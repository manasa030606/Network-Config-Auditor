const express = require('express');
const router = express.Router();
const DeviceConnector = require('../services/deviceConnector');
const { analyzeConfiguration } = require('../services/analyzer');

const connector = new DeviceConnector();

/**
 * POST /api/devices/connect
 * Connect to a live device and analyze configuration
 */
router.post('/connect', async (req, res) => {
  try {
    const deviceInfo = req.body;

    // Validate input
    if (!deviceInfo.host || !deviceInfo.username || !deviceInfo.password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: host, username, password'
      });
    }

    console.log(`\n🔌 Connecting to device: ${deviceInfo.host}`);

    // Fetch configuration from device
    const startTime = Date.now();
    const fetchResult = await connector.fetchConfiguration(deviceInfo);
    
    if (!fetchResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch configuration from device'
      });
    }

    console.log(`✅ Configuration fetched via ${fetchResult.method}`);

    // Analyze the fetched configuration
    const analysis = analyzeConfiguration(fetchResult.config);
    const totalTime = Date.now() - startTime;

    console.log(`✅ Analysis complete in ${totalTime}ms`);
    console.log(`🔍 Found ${analysis.totalIssues} issues`);

    // Send response
    res.json({
      success: true,
      device: {
        host: deviceInfo.host,
        type: deviceInfo.type,
        method: fetchResult.method
      },
      analysisTime: `${totalTime}ms`,
      timestamp: new Date().toISOString(),
      analysis: analysis
    });

  } catch (error) {
    console.error('❌ Device connection error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/devices/test
 * Test device connectivity
 */
router.post('/test', async (req, res) => {
  try {
    const deviceInfo = req.body;

    const result = await connector.testConnection(deviceInfo);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;