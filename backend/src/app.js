import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import patientsRoutes from './modules/patients/patients.routes.js';
import triageRoutes from './modules/triage/triage.routes.js';
import clinicalOrdersRoutes from './modules/clinical-orders/clinical-orders.routes.js';
import schedulesRoutes from './modules/schedules/schedules.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import branchesRoutes from './modules/branches/branches.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Public liveness check
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    service: 'victorio-abc-backend',
    timestamp: new Date().toISOString(),
  });
});

// Multi-tenant versioned API routes
app.use('/api/v1/patients', patientsRoutes);
app.use('/api/v1/triage', triageRoutes);
app.use('/api/v1/clinical-orders', clinicalOrdersRoutes);
app.use('/api/v1/schedules', schedulesRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/branches', branchesRoutes);
app.use('/api/v1/audit', auditRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
