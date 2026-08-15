import { Router } from 'express';
import { DataService } from '../services/data_service.js';
import { MemberController } from '../controllers/member_controller.js';
import { PredictionController } from '../controllers/prediction_controller.js';
import { RecommendationController } from '../controllers/recommendation_controller.js';
import fs from 'fs';
import path from 'path';

export function createApiRouter(churnService) {
  const router = Router();

  const memberController = new MemberController(churnService);
  const predictionController = new PredictionController(churnService);
  const recommendationController = new RecommendationController(churnService);

  // Health
  router.get('/health', (req, res) => {
    try {
      const { schema } = DataService.loadDataset();
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        datasetRows: schema.totalRows,
        targetColumn: schema.targetColumn,
        idColumn: schema.idColumn,
        datasetName: schema.fileName || 'Uploaded_dataset.csv',
      });
    } catch (err) {
      res.status(500).json({ status: 'unhealthy', error: err.message });
    }
  });

  // Dashboard KPI & Charts
  router.get('/dashboard', predictionController.getDashboard);

  // Members List & Filter
  router.get('/members', memberController.getMembers);

  // Member Details
  router.get('/members/:member_id', memberController.getMemberById);

  // Ad-hoc Predict
  router.post('/predict', predictionController.predictMember);

  // Model Metrics & Feature Importance
  router.get('/model/metrics', predictionController.getModelMetrics);
  router.get('/model/drivers', predictionController.getModelDrivers);

  // Retention Recommendations
  router.get('/recommendations/:member_id', recommendationController.getMemberRecommendations);
  router.get('/retention/summary', recommendationController.getRetentionSummary);

  // Configure Risk Thresholds
  router.post('/config/thresholds', (req, res) => {
    try {
      const { lowMax, mediumMax } = req.body;
      if (typeof lowMax !== 'number' || typeof mediumMax !== 'number' || lowMax >= mediumMax) {
        return res.status(400).json({ error: 'Invalid thresholds. Ensure lowMax < mediumMax.' });
      }

      churnService.setThresholds({ lowMax, mediumMax });
      res.json({ message: 'Thresholds updated successfully', thresholds: churnService.getThresholds() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Upload Custom CSV Dataset Endpoint
  router.post('/upload-csv', (req, res) => {
    try {
      const { csvContent, fileName } = req.body;
      if (!csvContent || typeof csvContent !== 'string') {
        return res.status(400).json({ error: 'Valid CSV content is required.' });
      }

      const targetFileName = fileName ? path.basename(fileName) : 'Uploaded_dataset.csv';
      const uploadPath = path.join(process.cwd(), 'data', targetFileName);
      fs.mkdirSync(path.dirname(uploadPath), { recursive: true });
      fs.writeFileSync(uploadPath, csvContent, 'utf8');

      // Reload dataset & retrain model
      DataService.setDatasetFilePath(uploadPath);
      const { members, schema } = DataService.reloadDataset();
      const retrainResult = churnService.trainModel(members, schema);

      res.json({
        message: `Dataset '${targetFileName}' loaded successfully`,
        datasetName: targetFileName,
        totalRows: schema.totalRows,
        columns: schema.columns,
        targetColumn: schema.targetColumn,
        idColumn: schema.idColumn,
        metrics: retrainResult.metrics,
      });
    } catch (err) {
      res.status(500).json({ error: err.message || 'Error processing uploaded CSV dataset' });
    }
  });

  // Reset to Default Dataset Endpoint
  router.post('/reset-dataset', (req, res) => {
    try {
      const defaultPath = path.join(process.cwd(), 'data', 'Default_dataset.csv');
      const uploadPath = path.join(process.cwd(), 'data', 'Uploaded_dataset.csv');

      if (!fs.existsSync(defaultPath)) {
        return res.status(404).json({ error: 'Default dataset file (Default_dataset.csv) not found.' });
      }

      // Overwrite Uploaded_dataset.csv with Default_dataset.csv
      const defaultContent = fs.readFileSync(defaultPath, 'utf8');
      fs.writeFileSync(uploadPath, defaultContent, 'utf8');

      // Reset file path and reload
      DataService.setDatasetFilePath(defaultPath);
      const { members, schema } = DataService.reloadDataset();
      const retrainResult = churnService.trainModel(members, schema);

      res.json({
        message: "Dataset reset to 'Default_dataset.csv' successfully and model retrained.",
        datasetName: 'Default_dataset.csv',
        totalRows: schema.totalRows,
        columns: schema.columns,
        targetColumn: schema.targetColumn,
        idColumn: schema.idColumn,
        metrics: retrainResult.metrics,
      });
    } catch (err) {
      res.status(500).json({ error: err.message || 'Error resetting to default dataset' });
    }
  });

  return router;
}
