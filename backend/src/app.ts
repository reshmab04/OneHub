import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';
import githubRoutes from './routes/github';
import modelsRoutes from './routes/models';
import filesRoutes from './routes/files';
import { requireAuth } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { securityHeaders, globalRateLimit, httpParamPollution, originCheck } from './middleware/security';
import { config } from './config/env';
import * as users from './database/users';

const app = express();

app.set('trust proxy', 1);

// Security middleware
app.use(securityHeaders);
app.use(globalRateLimit);
app.use(httpParamPollution);
app.use(originCheck);

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);

app.use('/api/github', requireAuth, githubRoutes);
app.use('/api/models', requireAuth, modelsRoutes);
app.use('/api/files', requireAuth, filesRoutes);

app.use(errorHandler);

// Seed admin account on startup
(async () => {
  if (users.countAdmins() === 0 && config.auth.adminEmail && config.auth.adminPassword) {
    try {
      await users.createUser(config.auth.adminEmail, 'Admin', config.auth.adminPassword, 'admin');
      console.log(`Admin account created: ${config.auth.adminEmail}`);
    } catch (err) {
      console.error('Failed to seed admin:', err);
    }
  }
})();

export default app;
