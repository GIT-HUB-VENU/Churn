import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { ChurnService } from './backend/app/services/churn_service.js';
import { DataService } from './backend/app/services/data_service.js';
import { createApiRouter } from './backend/app/routes/api_routes.js';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Initialize Data & ML Pipeline
  console.log('Loading CareRetain AI dataset and training XGBoost ML Model...');
  const churnService = new ChurnService();

  try {
    const { members, schema } = DataService.loadDataset();
    console.log(`Successfully loaded dataset with ${schema.totalRows} member records.`);
    console.log(`Target Column: ${schema.targetColumn} | Member ID Column: ${schema.idColumn}`);
    
    const trainResult = churnService.trainModel(members, schema);
    console.log(`ML Model Trained Successfully! Accuracy: ${(trainResult.metrics.accuracy * 100).toFixed(2)}% | ROC-AUC: ${trainResult.metrics.rocAuc}`);
  } catch (err) {
    console.error('Error initializing ML model:', err.message);
  }

  // API Routes MUST BE MOUNTED FIRST
  app.use('/api', createApiRouter(churnService));

  // Vite Middleware for Development vs Static Serving for Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CareRetain AI Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
