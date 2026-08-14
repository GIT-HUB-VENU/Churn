export class PreprocessingService {
  static processDataset(members, schema, trainRatio = 0.8) {
    const medians = {};
    const modes = {};
    const categoricalMaps = {};

    // 1. Compute Medians for Numerical Features
    schema.numericalFeatures.forEach(feat => {
      const vals = members
        .map(m => Number(m[feat]))
        .filter(v => !isNaN(v))
        .sort((a, b) => a - b);
      
      if (vals.length > 0) {
        const mid = Math.floor(vals.length / 2);
        medians[feat] = vals.length % 2 !== 0 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
      } else {
        medians[feat] = 0;
      }
    });

    // 2. Compute Unique Values & Categorical Encodings
    schema.categoricalFeatures.forEach(feat => {
      const counts = {};
      members.forEach(m => {
        const val = String(m[feat] || '').trim();
        if (val) counts[val] = (counts[val] || 0) + 1;
      });

      const uniqueVals = Object.keys(counts).sort();
      categoricalMaps[feat] = uniqueVals;

      // Mode
      let maxCount = 0;
      let modeVal = uniqueVals[0] || 'Unknown';
      Object.entries(counts).forEach(([k, v]) => {
        if (v > maxCount) {
          maxCount = v;
          modeVal = k;
        }
      });
      modes[feat] = modeVal;
    });

    // 3. Construct Feature Names & Labels
    const featureNames = [];
    const featureLabels = {};

    schema.numericalFeatures.forEach(feat => {
      featureNames.push(feat);
      featureLabels[feat] = this.formatFeatureLabel(feat);
    });

    // One-hot encode categoricals for better ML precision
    schema.categoricalFeatures.forEach(feat => {
      const categories = categoricalMaps[feat];
      categories.forEach(cat => {
        const encodedName = `${feat}_${cat}`;
        featureNames.push(encodedName);
        featureLabels[encodedName] = `${this.formatFeatureLabel(feat)}: ${cat}`;
      });
    });

    // 4. Transform Records to Feature Matrix X and Target y
    const X = [];
    const y = [];
    const memberIds = [];

    members.forEach(m => {
      memberIds.push(String(m[schema.idColumn]));
      
      // Target
      const targetVal = String(m[schema.targetColumn]).toLowerCase();
      const isChurn = targetVal === 'yes' || targetVal === '1' || targetVal === 'true' ? 1 : 0;
      y.push(isChurn);

      const rowFeatures = [];

      // Numerical features (with median imputation)
      schema.numericalFeatures.forEach(feat => {
        let val = Number(m[feat]);
        if (isNaN(val) || val === null || val === undefined) {
          val = medians[feat];
        }
        rowFeatures.push(val);
      });

      // One-hot categorical features
      schema.categoricalFeatures.forEach(feat => {
        const mVal = String(m[feat] || '').trim();
        const categories = categoricalMaps[feat];
        categories.forEach(cat => {
          rowFeatures.push(mVal === cat ? 1 : 0);
        });
      });

      X.push(rowFeatures);
    });

    // 5. Split into Train & Test (80/20 stratified-like)
    const totalCount = X.length;
    const splitIndex = Math.floor(totalCount * trainRatio);

    // Shuffle deterministically with seed for reproducible train/test split
    const indices = Array.from({ length: totalCount }, (_, i) => i);
    indices.sort((a, b) => {
      const hashA = (a * 9301 + 49297) % 233280;
      const hashB = (b * 9301 + 49297) % 233280;
      return hashA - hashB;
    });

    const trainIndices = indices.slice(0, splitIndex);
    const testIndices = indices.slice(splitIndex);

    const XTrain = trainIndices.map(i => X[i]);
    const yTrain = trainIndices.map(i => y[i]);

    const XTest = testIndices.map(i => X[i]);
    const yTest = testIndices.map(i => y[i]);
    const testMemberIds = testIndices.map(i => memberIds[i]);

    return {
      featureNames,
      X,
      y,
      XTrain,
      yTrain,
      XTest,
      yTest,
      memberIds,
      testMemberIds,
      medians,
      categoricalMaps,
      featureLabels,
    };
  }

  static transformSingleMember(member, schema, processed) {
    const rowFeatures = [];

    // Numerical
    schema.numericalFeatures.forEach(feat => {
      let val = Number(member[feat]);
      if (isNaN(val) || val === null || val === undefined) {
        val = processed.medians[feat] || 0;
      }
      rowFeatures.push(val);
    });

    // Categorical One-Hot
    schema.categoricalFeatures.forEach(feat => {
      const mVal = String(member[feat] || '').trim();
      const categories = processed.categoricalMaps[feat] || [];
      categories.forEach(cat => {
        rowFeatures.push(mVal === cat ? 1 : 0);
      });
    });

    return rowFeatures;
  }

  static formatFeatureLabel(feat) {
    return feat
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\bPct\b/g, '%')
      .replace(/\b90d\b/g, '(90 Days)')
      .replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  }
}
