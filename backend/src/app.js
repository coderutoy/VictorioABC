import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './modules/auth/auth.routes.js';
import clinicalRoutes from './modules/clinical/clinical.routes.js';
import patientsRoutes from './modules/patients/patients.routes.js';
import triageRoutes from './modules/triage/triage.routes.js';
import clinicalOrdersRoutes from './modules/clinical-orders/clinical-orders.routes.js';
import schedulesRoutes from './modules/schedules/schedules.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import branchesRoutes from './modules/branches/branches.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';
import { enforceSecureCookiesMiddleware } from './utils/cookiePolicy.js';

const app = express();

app.use(helmet());
app.use(enforceSecureCookiesMiddleware);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Public liveness check (supports direct /health and Vercel /api/health or /api/v1/health rewrites)
const healthHandler = (_req, res) => {
  res.json({
    success: true,
    service: 'victorio-abc-backend',
    timestamp: new Date().toISOString(),
  });
};
app.get(['/health', '/api/health', '/api/v1/health', '/v1/health'], healthHandler);

// Multi-tenant versioned API routes (mounted on both /api/v1 and /v1 for Vercel rewrite resilience)
const v1Router = express.Router();
v1Router.use('/auth', authRoutes);
v1Router.use('/clinical', clinicalRoutes);
v1Router.use('/patients', patientsRoutes);
v1Router.use('/triage', triageRoutes);
v1Router.use('/clinical-orders', clinicalOrdersRoutes);
v1Router.use('/schedules', schedulesRoutes);
v1Router.use('/inventory', inventoryRoutes);
v1Router.use('/analytics', analyticsRoutes);
v1Router.use('/branches', branchesRoutes);
v1Router.use('/audit', auditRoutes);

app.use(['/api/v1', '/v1'], v1Router);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
