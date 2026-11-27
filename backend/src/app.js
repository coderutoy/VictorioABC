import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import v1Routes from './modules/v1/v1.routes.js';
import { getHealth } from './modules/v1/v1.controller.js';
import clinicalRoutes from './modules/clinical/clinical.routes.js';
import triageRoutes from './modules/triage/triage.routes.js';
import clinicalOrdersRoutes from './modules/clinical-orders/clinical-orders.routes.js';
import schedulesRoutes from './modules/schedules/schedules.routes.js';
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

// Public liveness + Supabase DB connection check
app.get(['/health', '/api/health', '/api/v1/health', '/v1/health'], getHealth);

// Primary Phase 2.2b /api/v1 router (mounted on both /api/v1 and /v1 for Vercel rewrite resilience)
const apiRouter = express.Router();
apiRouter.use('/', v1Routes);
apiRouter.use('/clinical', clinicalRoutes);
apiRouter.use('/triage', triageRoutes);
apiRouter.use('/clinical-orders', clinicalOrdersRoutes);
apiRouter.use('/schedules', schedulesRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/branches', branchesRoutes);
apiRouter.use('/audit', auditRoutes);

app.use(['/api/v1', '/v1'], apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
