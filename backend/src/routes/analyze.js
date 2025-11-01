/**
 * API Routes for configuration analysis
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { analyzeConfiguration } = require('../services/analyzer');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

/**
 * POST /api/analyze
 * Endpoint to analyze a configuration file
 * Accepts: multipart/form-data with 'configFile' field
 * Returns: JSON with analysis results
 */
router.post('/analyze', upload.single('configFile'), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No configuration file provided. Please upload a .txt file.'
      });
    }

    // Get file content as string
    const configText = req.file.buffer.toString('utf-8');

    // Validate that file is not empty
    if (!configText || configText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Configuration file is empty.'
      });
    }

    console.log(`\n📄 Analyzing file: ${req.file.originalname}`);
    console.log(`📏 File size: ${req.file.size} bytes`);

    // Perform analysis
    const startTime = Date.now();
    const analysis = analyzeConfiguration(configText);
    const analysisTime = Date.now() - startTime;

    console.log(`✅ Analysis complete in ${analysisTime}ms`);
    console.log(`🔍 Found ${analysis.totalIssues} issues`);

    // Send successful response
    res.json({
      success: true,
      filename: req.file.originalname,
      fileSize: req.file.size,
      analysisTime: `${analysisTime}ms`,
      timestamp: new Date().toISOString(),
      analysis: analysis
    });

  } catch (error) {
    console.error('❌ Analysis error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to analyze configuration file.',
      details: error.message
    });
  }
});

/**
 * POST /api/analyze-text
 * Alternative endpoint to analyze text directly (without file upload)
 * Accepts: JSON with 'configText' field
 * Returns: JSON with analysis results
 */
router.post('/analyze-text', express.json(), async (req, res) => {
  try {
    const { configText } = req.body;

    // Validate input
    if (!configText || typeof configText !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'No configuration text provided.'
      });
    }

    if (configText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Configuration text is empty.'
      });
    }

    console.log(`\n📝 Analyzing text (${configText.length} characters)`);

    // Perform analysis
    const startTime = Date.now();
    const analysis = analyzeConfiguration(configText);
    const analysisTime = Date.now() - startTime;

    console.log(`✅ Analysis complete in ${analysisTime}ms`);
    console.log(`🔍 Found ${analysis.totalIssues} issues`);

    // Send successful response
    res.json({
      success: true,
      textLength: configText.length,
      analysisTime: `${analysisTime}ms`,
      timestamp: new Date().toISOString(),
      analysis: analysis
    });

  } catch (error) {
    console.error('❌ Analysis error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to analyze configuration text.',
      details: error.message
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Network Configuration Auditor',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;