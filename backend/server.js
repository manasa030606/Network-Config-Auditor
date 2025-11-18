/**
 * Network Security Auditor - Backend Server
 * FINAL WORKING VERSION
 */
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5003;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import routes - with error handling
let scanRoutes;
let networkRoutes;
let analyzeRoutes;

try {
  scanRoutes = require('./src/routes/scan');
  console.log('✅ Scan routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading scan routes:', error.message);
  console.error('   Make sure file exists: ./src/routes/scan.js');
}

try {
  networkRoutes = require('./src/routes/network');
  console.log('✅ Network routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading network routes:', error.message);
  console.error('   Make sure file exists: ./src/routes/network.js');
}

try {
  analyzeRoutes = require('./src/routes/analyze');
  console.log('✅ Analyze routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading analyze routes:', error.message);
  console.error('   Make sure file exists: ./src/routes/analyze.js');
}

// Root endpoint - API info
app.get('/', (req, res) => {
  res.json({
    message: 'Network Security Auditor API',
    status: 'running',
    version: '2.0.0',
    endpoints: [
      'GET  / - API info',
      'POST /api/scan/network - Scan and analyze current network',
      'GET  /api/scan/info - Get current network info',
      'GET  /api/network/scan - Scan for WiFi networks',
      'POST /api/network/connect - Connect to WiFi network',
      'POST /api/network/analyze - Connect to WiFi and analyze router',
      'POST /api/analyze - Analyze uploaded config file',
      'POST /api/analyze-text - Analyze config text'
    ],
    timestamp: new Date().toISOString()
  });
});

// Mount scan routes if loaded successfully
if (scanRoutes) {
  app.use('/api/scan', scanRoutes);
  console.log('✅ Routes mounted at /api/scan');
} else {
  console.error('⚠️  Scan routes not loaded - endpoints will not work!');
  
  // Add fallback route to show helpful error
  app.all('/api/scan/*', (req, res) => {
    res.status(500).json({
      success: false,
      error: 'Scan routes not loaded. Check if src/routes/scan.js exists.',
      hint: 'Make sure you created the file backend/src/routes/scan.js'
    });
  });
}

// Mount network routes if loaded successfully
if (networkRoutes) {
  app.use('/api/network', networkRoutes);
  console.log('✅ Routes mounted at /api/network');
} else {
  console.error('⚠️  Network routes not loaded - WiFi features will not work!');
}

// Mount analyze routes if loaded successfully
if (analyzeRoutes) {
  app.use('/api/analyze', analyzeRoutes);
  console.log('✅ Routes mounted at /api/analyze');
} else {
  console.error('⚠️  Analyze routes not loaded - file upload features will not work!');
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  console.error(err.stack);
  
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler - must be last
app.use((req, res) => {
  console.log(`⚠️  404 Not Found: ${req.method} ${req.url}`);
  
  res.status(404).json({
    success: false,
    error: 'Route not found',
    requestedUrl: req.url,
    availableEndpoints: [
      'GET  /',
      'GET  /api/network/scan',
      'POST /api/network/analyze',
      'POST /api/scan/network',
      'GET  /api/scan/info'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(70));
  console.log('🔒 NETWORK SECURITY AUDITOR - BACKEND SERVER');
  console.log('='.repeat(70));
  console.log(`✅ Server running: http://localhost:${PORT}`);
  console.log(`📡 Status: ${scanRoutes && networkRoutes ? 'All routes loaded' : '⚠️  Some routes missing!'}`);
  console.log(`🌐 CORS: Enabled`);
  console.log('='.repeat(70));
  console.log('\n📝 Available Endpoints:');
  console.log(`   GET  http://localhost:${PORT}/`);
  console.log(`   GET  http://localhost:${PORT}/api/network/scan`);
  console.log(`   POST http://localhost:${PORT}/api/network/analyze`);
  console.log(`   POST http://localhost:${PORT}/api/scan/network`);
  console.log(`   GET  http://localhost:${PORT}/api/scan/info`);
  console.log('\n💡 Test with:');
  console.log(`   curl http://localhost:${PORT}/`);
  console.log(`   curl http://localhost:${PORT}/api/scan/info`);
  console.log('='.repeat(70) + '\n');
  
  // Check if routes file exists
  const fs = require('fs');
  const routesPath = path.join(__dirname, 'src', 'routes', 'scan.js');
  if (!fs.existsSync(routesPath)) {
    console.error('⚠️  WARNING: src/routes/scan.js does NOT exist!');
    console.error('   Please create this file for the app to work.\n');
  }
});

module.exports = app;