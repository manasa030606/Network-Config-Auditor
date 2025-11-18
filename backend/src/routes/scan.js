/**
 * Scan Routes - Network scanning endpoints
 * WITH ERROR HANDLING
 */
const express = require('express');
const router = express.Router();

// Try to load dependencies with error handling
let RouterScanner;
let analyzeConfiguration;

try {
  RouterScanner = require('../services/routerScanner');
  console.log('✅ RouterScanner loaded');
} catch (error) {
  console.error('❌ Error loading RouterScanner:', error.message);
  console.error('   File: src/services/routerScanner.js');
}

try {
  const analyzer = require('../services/analyzer');
  analyzeConfiguration = analyzer.analyzeConfiguration;
  console.log('✅ Analyzer loaded');
} catch (error) {
  console.error('❌ Error loading analyzer:', error.message);
  console.error('   File: src/services/analyzer.js');
  
  // Create a simple fallback analyzer if file is missing
  analyzeConfiguration = (config) => {
    return {
      totalIssues: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      securityScore: 50,
      issues: [],
      recommendations: ['Analyzer module not found'],
      configSummary: {}
    };
  };
}

/**
 * POST /api/scan/network
 * Scan current network and analyze router
 */
router.post('/network', async (req, res) => {
  try {
    if (!RouterScanner) {
      return res.status(500).json({
        success: false,
        error: 'RouterScanner module not loaded. Check backend/src/services/routerScanner.js exists.'
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('🔒 NETWORK SECURITY SCAN STARTED');
    console.log('='.repeat(70));

    const scanner = new RouterScanner();
    const startTime = Date.now();

    // Step 1: Scan network and get router config
    console.log('\n📡 Step 1: Scanning current network...');
    const scanResult = await scanner.scanCurrentNetwork();

    // Step 2: Analyze configuration
    console.log('🔍 Step 2: Analyzing security...');
    const analysis = analyzeConfiguration(scanResult.config);
    
    const totalTime = Date.now() - startTime;

    console.log(`\n✅ Scan complete!`);
    console.log(`   Network: ${scanResult.ssid}`);
    console.log(`   Gateway: ${scanResult.gateway}`);
    console.log(`   Issues: ${analysis.totalIssues}`);
    console.log(`   Score: ${analysis.securityScore}/100`);
    console.log(`   Time: ${totalTime}ms`);
    console.log('='.repeat(70) + '\n');

    // Send response
    res.json({
      success: true,
      network: {
        ssid: scanResult.ssid,
        gateway: scanResult.gateway,
        localIP: scanResult.localIP,
        username: scanResult.username,
        isDemo: scanResult.isDemo
      },
      analysisTime: `${totalTime}ms`,
      timestamp: new Date().toISOString(),
      analysis: analysis
    });

  } catch (error) {
    console.error('\n❌ SCAN FAILED:', error.message);
    console.error(error.stack);
    console.log('='.repeat(70) + '\n');

    res.status(500).json({
      success: false,
      error: error.message,
      hint: 'Check backend terminal for detailed error logs'
    });
  }
});

/**
 * GET /api/scan/info
 * Get current network info without analysis
 */
router.get('/info', async (req, res) => {
  try {
    if (!RouterScanner) {
      return res.status(500).json({
        success: false,
        error: 'RouterScanner module not loaded'
      });
    }

    const scanner = new RouterScanner();
    
    // Get network info
    const gateway = await scanner.getGatewayIP();
    const ssid = await scanner.getWiFiSSID();

    res.json({
      success: true,
      ssid: ssid,
      gateway: gateway
    });
  } catch (error) {
    console.error('Error getting network info:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Export router
module.exports = router;