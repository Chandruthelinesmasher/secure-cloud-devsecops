const express = require('express');
const helmet = require('helmet');
const winston = require('winston');
const path = require('path');
require('dotenv').config();

/* =========================
   Logger Configuration
========================= */
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

/* =========================
   App Initialization
========================= */
const app = express();
const PORT = process.env.PORT || 8080;

/* =========================
   Security & Middleware
========================= */
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

app.use(express.json({ limit: '10mb' }));

/* =========================
   Serve Static Frontend
   (IMPORTANT FIX)
========================= */
app.use(express.static(path.join(__dirname, 'public')));

/* =========================
   Request Logging
========================= */
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

/* =========================
   Health Check
========================= */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production',
    port: PORT
  });
});

/* =========================
   Info Endpoint
========================= */
app.get('/info', (req, res) => {
  res.status(200).json({
    application: 'Secure Cloud DevSecOps Demo',
    version: '1.0.0',
    status: 'running',
    features: [
      'Infrastructure as Code (Terraform)',
      'Container Security Scanning (Trivy)',
      'Azure Key Vault Integration',
      'Automated Security Pipeline',
      'Network Security Groups'
    ],
    security: {
      helmet: 'enabled',
      httpsOnly: true,
      secretsManagement: 'Azure Key Vault'
    },
    deployment: {
      platform: 'Azure Container Instances',
      region: 'East US'
    }
  });
});

/* =========================
   API Endpoint
========================= */
app.get('/api', (req, res) => {
  res.status(200).json({
    message: '🔐 Secure Cloud Application',
    version: '1.0.0',
    endpoints: {
      root: '/',
      health: '/health',
      info: '/info',
      api: '/api'
    }
  });
});

/* =========================
   404 Handler
========================= */
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    availableEndpoints: ['/', '/health', '/info', '/api']
  });
});

/* =========================
   Error Handler
========================= */
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Something went wrong'
  });
});

/* =========================
   Start Server
========================= */
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'production'}`);
  logger.info(`🌐 Health: http://localhost:${PORT}/health`);
  logger.info(`📊 Info: http://localhost:${PORT}/info`);
});

/* =========================
   Graceful Shutdown
========================= */
const gracefulShutdown = () => {
  logger.info('Received shutdown signal, closing server...');
  server.close(() => {
    logger.info('Server closed gracefully');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});
