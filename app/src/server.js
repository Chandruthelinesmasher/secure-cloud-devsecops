const express = require('express');
const helmet = require('helmet');
const winston = require('winston');
require('dotenv').config();

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for our HTML page
}));
app.use(express.json({ limit: '10mb' }));

// Serve static files (HTML, CSS, JS)
app.use(express.static('src/public'));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API root endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    message: '🔐 Secure Cloud Application',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      info: '/info',
      api: '/api'
    }
  });
});

// Info endpoint (demonstrates Key Vault usage)
app.get('/info', (req, res) => {
  res.status(200).json({
    application: 'Secure Cloud DevSecOps Demo',
    features: [
      'Infrastructure as Code (Terraform)',
      'Container Security Scanning',
      'Azure Key Vault Integration',
      'Automated Security Pipeline',
      'Network Security Groups'
    ],
    security: {
      helmet: 'enabled',
      httpsOnly: true,
      secretsManagement: 'Azure Key Vault'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 Open http://localhost:${PORT} in your browser`);
});

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Received shutdown signal, closing server...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);