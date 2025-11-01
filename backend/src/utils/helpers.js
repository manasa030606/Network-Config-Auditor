/**
 * Helper utility functions
 */

/**
 * Format file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size (e.g., "1.5 MB")
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
  
  /**
   * Get severity color for display
   * @param {string} severity - Severity level
   * @returns {string} Color code
   */
  function getSeverityColor(severity) {
    const colors = {
      'CRITICAL': '#DC2626', // Red
      'HIGH': '#EA580C',     // Orange
      'MEDIUM': '#F59E0B',   // Yellow
      'LOW': '#10B981'       // Green
    };
    
    return colors[severity.toUpperCase()] || '#6B7280';
  }
  
  /**
   * Get severity emoji
   * @param {string} severity - Severity level
   * @returns {string} Emoji representation
   */
  function getSeverityEmoji(severity) {
    const emojis = {
      'CRITICAL': '🔴',
      'HIGH': '🟠',
      'MEDIUM': '🟡',
      'LOW': '🟢'
    };
    
    return emojis[severity.toUpperCase()] || '⚪';
  }
  
  /**
   * Get security score rating
   * @param {number} score - Security score (0-100)
   * @returns {string} Rating description
   */
  function getSecurityRating(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 50) return 'Fair';
    if (score >= 25) return 'Poor';
    return 'Critical';
  }
  
  /**
   * Sanitize filename to prevent path traversal
   * @param {string} filename - Original filename
   * @returns {string} Sanitized filename
   */
  function sanitizeFilename(filename) {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  }
  
  /**
   * Format timestamp to readable format
   * @param {Date} date - Date object
   * @returns {string} Formatted date string
   */
  function formatTimestamp(date = new Date()) {
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
  
  /**
   * Validate configuration file content
   * @param {string} content - File content
   * @returns {object} Validation result
   */
  function validateConfigContent(content) {
    const result = {
      valid: true,
      errors: []
    };
  
    // Check if content is empty
    if (!content || content.trim().length === 0) {
      result.valid = false;
      result.errors.push('Configuration file is empty');
    }
  
    // Check minimum length
    if (content.length < 10) {
      result.valid = false;
      result.errors.push('Configuration file is too short');
    }
  
    // Check if it looks like a config file (has common keywords)
    const configKeywords = ['interface', 'ip', 'router', 'line', 'access'];
    const hasKeywords = configKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );
  
    if (!hasKeywords) {
      result.valid = false;
      result.errors.push('File does not appear to be a valid network configuration');
    }
  
    return result;
  }
  
  /**
   * Group issues by category
   * @param {array} issues - Array of issue objects
   * @returns {object} Issues grouped by category
   */
  function groupIssuesByCategory(issues) {
    const grouped = {};
  
    issues.forEach(issue => {
      const category = issue.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(issue);
    });
  
    return grouped;
  }
  
  /**
   * Group issues by severity
   * @param {array} issues - Array of issue objects
   * @returns {object} Issues grouped by severity
   */
  function groupIssuesBySeverity(issues) {
    const grouped = {
      CRITICAL: [],
      HIGH: [],
      MEDIUM: [],
      LOW: []
    };
  
    issues.forEach(issue => {
      const severity = issue.severity.toUpperCase();
      if (grouped[severity]) {
        grouped[severity].push(issue);
      }
    });
  
    return grouped;
  }
  
  /**
   * Generate summary statistics
   * @param {object} analysis - Analysis results
   * @returns {object} Summary statistics
   */
  function generateSummaryStats(analysis) {
    return {
      totalIssues: analysis.totalIssues,
      criticalCount: analysis.critical,
      highCount: analysis.high,
      mediumCount: analysis.medium,
      lowCount: analysis.low,
      securityScore: analysis.securityScore,
      rating: getSecurityRating(analysis.securityScore),
      configSummary: analysis.configSummary
    };
  }
  
  // Export all helper functions
  module.exports = {
    formatFileSize,
    getSeverityColor,
    getSeverityEmoji,
    getSecurityRating,
    sanitizeFilename,
    formatTimestamp,
    validateConfigContent,
    groupIssuesByCategory,
    groupIssuesBySeverity,
    generateSummaryStats
  };