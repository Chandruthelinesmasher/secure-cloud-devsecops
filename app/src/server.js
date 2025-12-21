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
const PORT = process.env.PORT || 8080; // Changed from 3000 to 8080

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for our HTML page
}));
app.use(express.json({ limit: '10mb' }));

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint - CRITICAL for Azure Container Instances
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production',
    port: PORT
  });
});

// Info endpoint - Required by deployment pipeline
app.get('/info', (req, res) => {
  res.status(200).json({
    application: 'Secure Cloud DevSecOps Demo',
    version: '1.0.0',
    status: 'running',
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
    },
    deployment: {
      platform: 'Azure Container Instances',
      region: 'East US'
    }
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

// Root endpoint - Welcome page
app.get('/', (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Secure Cloud DevSecOps</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          padding: 20px;
        }
        .container {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 40px;
          max-width: 600px;
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        }
        h1 {
          margin: 0 0 20px 0;
          font-size: 2.5em;
        }
        .status {
          background: rgba(16, 185, 129, 0.2);
          border: 2px solid #10b981;
          border-radius: 10px;
          padding: 15px;
          margin: 20px 0;
        }
        .endpoints {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          padding: 20px;
          margin: 20px 0;
        }
        .endpoint {
          background: rgba(255, 255, 255, 0.1);
          padding: 10px 15px;
          margin: 10px 0;
          border-radius: 5px;
          font-family: monospace;
        }
        a {
          color: #60a5fa;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        .feature {
          margin: 8px 0;
          padding-left: 25px;
          position: relative;
        }
        .feature:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #10b981;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔐 Secure Cloud DevSecOps</h1>
        <div class="status">
          <strong>✅ Application Status: RUNNING</strong>
          <p>Deployed on Azure Container Instances</p>
        </div>
        
        <h2>Available Endpoints:</h2>
        <div class="endpoints">
          <div class="endpoint">
            <a href="/health" target="_blank">GET /health</a> - Health check
          </div>
          <div class="endpoint">
            <a href="/info" target="_blank">GET /info</a> - Application info
          </div>
          <div class="endpoint">
            <a href="/api" target="_blank">GET /api</a> - API information
          </div>
        </div>

        <h2>Security Features:</h2>
        <div class="feature">Infrastructure as Code (Terraform)</div>
        <div class="feature">Container Security Scanning (Trivy)</div>
        <div class="feature">Azure Key Vault Integration</div>
        <div class="feature">Automated Security Pipeline</div>
        <div class="feature">Network Security Groups</div>
        <div class="feature">Helmet.js Security Headers</div>
      </div>
    </body>
    </html>
  `);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    availableEndpoints: ['/', '/health', '/info', '/api']
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

// Start server - MUST bind to 0.0.0.0 for container access
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'production'}`);
  logger.info(`🌐 Health check: http://localhost:${PORT}/health`);
  logger.info(`📊 Info endpoint: http://localhost:${PORT}/info`);
  logger.info(`🔒 Security headers enabled via Helmet.js`);
});

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Received shutdown signal, closing server...');
  server.close(() => {
    logger.info('Server closed gracefully');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});