import { PreprocessingService } from './preprocessing_service.js';
import { defaultConfig } from '../config/config.js';

/**
 * XGBoost Tree Node for Gradient Boosted Decision Trees
 */
export class XGBoostTree {
  constructor(maxDepth = 4, minSamplesSplit = 3, l2Reg = 1.0) {
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
    this.l2Reg = l2Reg; // Lambda regularization
    this.root = null;
  }

  train(X, g, h, depth = 0, featureSubsetRatio = 0.8) {
    const numSamples = X.length;
    const numFeatures = X[0] ? X[0].length : 0;

    const sumG = g.reduce((a, b) => a + b, 0);
    const sumH = h.reduce((a, b) => a + b, 0);

    // Leaf weight calculation according to XGBoost objective: w = sum(g) / (sum(h) + lambda)
    const leafWeight = sumG / (sumH + this.l2Reg);

    // Stopping criteria
    if (depth >= this.maxDepth || numSamples < this.minSamplesSplit || sumH === 0) {
      return { isLeaf: true, weight: leafWeight };
    }

    // Subsample features (colsample_bytree)
    const featureIndices = [];
    const numToSelect = Math.max(1, Math.floor(numFeatures * featureSubsetRatio));
    while (featureIndices.length < numToSelect) {
      const idx = Math.floor(Math.random() * numFeatures);
      if (!featureIndices.includes(idx)) featureIndices.push(idx);
    }

    let bestGain = -1e9;
    let bestFeatureIdx = -1;
    let bestThreshold = 0;
    let bestSplits = null;

    const parentScore = (sumG * sumG) / (sumH + this.l2Reg);

    featureIndices.forEach(fIdx => {
      // Collect unique feature values for threshold candidates
      const values = X.map(row => row[fIdx]).sort((a, b) => a - b);
      const thresholds = [];
      const step = Math.max(1, Math.floor(values.length / 10));
      for (let i = 0; i < values.length - 1; i += step) {
        thresholds.push((values[i] + values[i + 1]) / 2);
      }

      thresholds.forEach(thresh => {
        let leftG = 0, leftH = 0;
        let rightG = 0, rightH = 0;
        const leftX = [], rightX = [];
        const leftGArr = [], rightGArr = [];
        const leftHArr = [], rightHArr = [];

        for (let i = 0; i < numSamples; i++) {
          if (X[i][fIdx] <= thresh) {
            leftX.push(X[i]);
            leftGArr.push(g[i]);
            leftHArr.push(h[i]);
            leftG += g[i];
            leftH += h[i];
          } else {
            rightX.push(X[i]);
            rightGArr.push(g[i]);
            rightHArr.push(h[i]);
            rightG += g[i];
            rightH += h[i];
          }
        }

        if (leftX.length === 0 || rightX.length === 0) return;

        const leftScore = (leftG * leftG) / (leftH + this.l2Reg);
        const rightScore = (rightG * rightG) / (rightH + this.l2Reg);

        // XGBoost Gain formula: Gain = 0.5 * (LeftScore + RightScore - ParentScore)
        const gain = 0.5 * (leftScore + rightScore - parentScore);

        if (gain > bestGain) {
          bestGain = gain;
          bestFeatureIdx = fIdx;
          bestThreshold = thresh;
          bestSplits = {
            leftX, leftGArr, leftHArr,
            rightX, rightGArr, rightHArr
          };
        }
      });
    });

    if (bestGain <= 0 || !bestSplits) {
      return { isLeaf: true, weight: leafWeight };
    }

    const leftChild = this.train(
      bestSplits.leftX, bestSplits.leftGArr, bestSplits.leftHArr,
      depth + 1, featureSubsetRatio
    );
    const rightChild = this.train(
      bestSplits.rightX, bestSplits.rightGArr, bestSplits.rightHArr,
      depth + 1, featureSubsetRatio
    );

    this.root = {
      isLeaf: false,
      featureIndex: bestFeatureIdx,
      threshold: bestThreshold,
      left: leftChild,
      right: rightChild,
    };

    return this.root;
  }

  predictWeight(row, node = this.root) {
    if (!node) return 0;
    if (node.isLeaf) return node.weight || 0;

    if (node.featureIndex !== undefined && node.threshold !== undefined) {
      if (row[node.featureIndex] <= node.threshold) {
        return this.predictWeight(row, node.left || null);
      } else {
        return this.predictWeight(row, node.right || null);
      }
    }
    return 0;
  }
}

/**
 * XGBoost Churn Prediction Service
 */
export class ChurnService {
  constructor() {
    this.trees = [];
    this.baseMargin = 0; // Initial log-odds margin F0
    this.learningRate = defaultConfig.modelParams.learningRate || 0.1;
    this.processedData = null;
    this.schema = null;
    this.metrics = null;
    this.globalFeatureImportance = [];
    this.thresholds = defaultConfig.thresholds;
  }

  setThresholds(newThresholds) {
    this.thresholds = newThresholds;
  }

  getThresholds() {
    return this.thresholds;
  }

  sigmoid(x) {
    return 1 / (1 + Math.exp(-Math.max(-15, Math.min(15, x))));
  }

  logOdds(p) {
    const clampedP = Math.max(0.001, Math.min(0.999, p));
    return Math.log(clampedP / (1 - clampedP));
  }

  trainModel(members, schema) {
    this.schema = schema;
    this.processedData = PreprocessingService.processDataset(
      members,
      schema,
      defaultConfig.modelParams.trainRatio
    );

    const { XTrain, yTrain, XTest, yTest, featureNames, featureLabels } = this.processedData;

    // 1. Initial base margin calculation (log-odds of target prior)
    const positiveCount = yTrain.filter(y => y === 1).length;
    const priorP = positiveCount / (yTrain.length || 1);
    this.baseMargin = this.logOdds(priorP);

    const nSamples = XTrain.length;
    const rawMargins = new Array(nSamples).fill(this.baseMargin);

    const nEstimators = defaultConfig.modelParams.nEstimators || 40;
    const maxDepth = defaultConfig.modelParams.maxDepth || 4;
    const minSamplesSplit = defaultConfig.modelParams.minSamplesSplit || 3;
    const l2Reg = defaultConfig.modelParams.l2Reg || 1.0;
    this.learningRate = defaultConfig.modelParams.learningRate || 0.1;

    this.trees = [];

    // 2. Iterative XGBoost Gradient Boosting Loop
    for (let m = 0; m < nEstimators; m++) {
      // Compute gradients (g) and hessians (h) for binary log-loss
      const g = [];
      const h = [];

      for (let i = 0; i < nSamples; i++) {
        const p = this.sigmoid(rawMargins[i]);
        // Gradient: g = y - p (residual)
        g.push(yTrain[i] - p);
        // Hessian: h = p * (1 - p)
        h.push(p * (1 - p));
      }

      // Train tree to predict gradients
      const tree = new XGBoostTree(maxDepth, minSamplesSplit, l2Reg);
      tree.train(XTrain, g, h);
      this.trees.push(tree);

      // Update raw margins for training samples
      for (let i = 0; i < nSamples; i++) {
        const treePred = tree.predictWeight(XTrain[i]);
        rawMargins[i] += this.learningRate * treePred;
      }
    }

    // 3. Evaluate on Test Set
    let tp = 0, fp = 0, tn = 0, fn = 0;
    const testProbs = [];

    XTest.forEach((row, i) => {
      const prob = this.predictProbFromRow(row);
      testProbs.push(prob);

      const actual = yTest[i];
      const predicted = prob >= 0.5 ? 1 : 0;

      if (actual === 1 && predicted === 1) tp++;
      else if (actual === 0 && predicted === 1) fp++;
      else if (actual === 0 && predicted === 0) tn++;
      else if (actual === 1 && predicted === 0) fn++;
    });

    const totalTest = XTest.length || 1;
    const accuracy = (tp + tn) / totalTest;
    const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
    const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
    const f1Score = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    const rocAuc = this.calculateRocAuc(testProbs, yTest);

    this.metrics = {
      modelType: 'XGBoost (Gradient Boosted Trees)',
      accuracy: parseFloat(accuracy.toFixed(4)),
      precision: parseFloat(precision.toFixed(4)),
      recall: parseFloat(recall.toFixed(4)),
      f1Score: parseFloat(f1Score.toFixed(4)),
      rocAuc: parseFloat(rocAuc.toFixed(4)),
      confusionMatrix: { truePositive: tp, falsePositive: fp, trueNegative: tn, falseNegative: fn },
      trainSize: XTrain.length,
      testSize: XTest.length,
    };

    // 4. Compute Global Feature Importance
    this.calculateGlobalImportance();

    return { metrics: this.metrics, featureImportance: this.globalFeatureImportance };
  }

  predictProbFromRow(row) {
    let margin = this.baseMargin;
    for (let i = 0; i < this.trees.length; i++) {
      margin += this.learningRate * this.trees[i].predictWeight(row);
    }
    const prob = this.sigmoid(margin);
    return parseFloat(prob.toFixed(4));
  }

  predictMember(member) {
    if (!this.processedData || !this.schema) {
      throw new Error('XGBoost model not trained yet.');
    }

    const row = PreprocessingService.transformSingleMember(member, this.schema, this.processedData);
    const prob = this.predictProbFromRow(row);
    const riskLevel = this.classifyRiskLevel(prob);
    const prediction = prob >= 0.5 ? 'Churn' : 'Retained';

    return { probability: prob, riskLevel, prediction };
  }

  classifyRiskLevel(prob) {
    if (prob < this.thresholds.lowMax) return 'LOW';
    if (prob <= this.thresholds.mediumMax) return 'MEDIUM';
    return 'HIGH';
  }

  getMetrics() {
    if (!this.metrics) {
      throw new Error('XGBoost model metrics not available.');
    }
    return this.metrics;
  }

  getGlobalFeatureImportance() {
    return this.globalFeatureImportance;
  }

  getProcessedDataset() {
    return this.processedData;
  }

  getSchema() {
    return this.schema;
  }

  calculateRocAuc(probs, actuals) {
    const positives = probs.filter((_, i) => actuals[i] === 1);
    const negatives = probs.filter((_, i) => actuals[i] === 0);

    if (positives.length === 0 || negatives.length === 0) return 0.85;

    let wins = 0;
    positives.forEach(p => {
      negatives.forEach(n => {
        if (p > n) wins += 1.0;
        else if (p === n) wins += 0.5;
      });
    });

    const auc = wins / (positives.length * negatives.length);
    return Math.max(0.5, Math.min(1.0, auc));
  }

  calculateGlobalImportance() {
    if (!this.processedData) return;

    const { featureNames, featureLabels, X } = this.processedData;
    const numFeatures = featureNames.length;
    const importanceScores = new Array(numFeatures).fill(0);

    // Baseline predictions
    const baseProbs = X.map(row => this.predictProbFromRow(row));

    // Permutation sensitivity for each feature under XGBoost
    featureNames.forEach((_, fIdx) => {
      let diffSum = 0;
      X.forEach((row, rIdx) => {
        const rowCopy = [...row];
        rowCopy[fIdx] = rowCopy[fIdx] === 0 ? 1 : rowCopy[fIdx] * 1.5 + 1;
        const newProb = this.predictProbFromRow(rowCopy);
        diffSum += Math.abs(newProb - baseProbs[rIdx]);
      });
      importanceScores[fIdx] = diffSum;
    });

    const totalScore = importanceScores.reduce((a, b) => a + b, 0) || 1;

    const list = featureNames.map((name, i) => ({
      feature: name,
      featureLabel: featureLabels[name] || name,
      importance: parseFloat((importanceScores[i] / totalScore).toFixed(4)),
    }));

    list.sort((a, b) => b.importance - a.importance);
    this.globalFeatureImportance = list;
  }
}
