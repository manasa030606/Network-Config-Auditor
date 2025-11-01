/**
 * Configuration Analyzer Service
 * This file contains the main logic for analyzing network configurations
 * and detecting security vulnerabilities.
 */

// List of common weak passwords to check against
const WEAK_PASSWORDS = [
    'cisco', 'admin', 'password', '123456', 'letmein', 
    'welcome', 'default', 'secret', 'changeme', '12345'
  ];
  
  // Insecure services/ports that should not be used
  const INSECURE_SERVICES = {
    'telnet': { port: 23, recommendation: 'Use SSH instead' },
    'ftp': { port: 21, recommendation: 'Use SFTP or FTPS instead' },
    'http': { port: 80, recommendation: 'Use HTTPS instead' }
  };
  
  /**
   * Main function to analyze a configuration file
   * @param {string} configText - The configuration file content
   * @returns {object} Analysis results with detected issues
   */
  function analyzeConfiguration(configText) {
    // Split configuration into lines for analysis
    const lines = configText.split('\n').map(line => line.trim());
    
    // Initialize results object
    const results = {
      totalIssues: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      issues: [],
      recommendations: [],
      configSummary: {}
    };
  
    // Parse configuration structure
    const parsedConfig = parseConfiguration(lines);
    results.configSummary = parsedConfig.summary;
  
    // Run all security checks
    const weakPasswords = detectWeakPasswords(lines);
    const openPorts = checkOpenPorts(lines);
    const missingACLs = analyzeACLs(lines, parsedConfig);
    const unusedInterfaces = findUnusedInterfaces(lines, parsedConfig);
    const securityBestPractices = checkSecurityBestPractices(lines);
  
    // Combine all detected issues
    const allIssues = [
      ...weakPasswords,
      ...openPorts,
      ...missingACLs,
      ...unusedInterfaces,
      ...securityBestPractices
    ];
  
    // Count issues by severity
    allIssues.forEach(issue => {
      results.issues.push(issue);
      results.totalIssues++;
      
      switch(issue.severity.toLowerCase()) {
        case 'critical':
          results.critical++;
          break;
        case 'high':
          results.high++;
          break;
        case 'medium':
          results.medium++;
          break;
        case 'low':
          results.low++;
          break;
      }
    });
  
    // Calculate security score (0-100)
    results.securityScore = calculateSecurityScore(results);
  
    // Generate recommendations
    results.recommendations = generateRecommendations(results);
  
    return results;
  }
  
  /**
   * Parse configuration file to extract key components
   * @param {array} lines - Array of configuration lines
   * @returns {object} Parsed configuration structure
   */
  function parseConfiguration(lines) {
    const config = {
      interfaces: [],
      vtyLines: [],
      acls: [],
      summary: {
        totalInterfaces: 0,
        totalVTYLines: 0,
        totalACLs: 0
      }
    };
  
    let currentInterface = null;
    let currentVTY = null;
  
    // Go through each line and extract information
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
  
      // Detect interface definitions
      if (line.startsWith('interface ')) {
        currentInterface = {
          name: line.replace('interface ', ''),
          ipAddress: null,
          status: 'unknown',
          acl: null,
          lineNumber: i + 1
        };
        config.interfaces.push(currentInterface);
        config.summary.totalInterfaces++;
      }
  
      // Get interface IP address
      if (currentInterface && line.includes('ip address ')) {
        currentInterface.ipAddress = line.replace('ip address ', '').trim();
      }
  
      // Check if interface is active
      if (currentInterface && line === 'no shutdown') {
        currentInterface.status = 'active';
      }
      if (currentInterface && line === 'shutdown') {
        currentInterface.status = 'shutdown';
      }
  
      // Check for ACL on interface
      if (currentInterface && line.includes('ip access-group')) {
        currentInterface.acl = line.split(' ')[2];
      }
  
      // Detect VTY line configurations
      if (line.startsWith('line vty')) {
        currentVTY = {
          range: line.replace('line vty ', ''),
          password: null,
          transport: [],
          accessClass: null,
          lineNumber: i + 1
        };
        config.vtyLines.push(currentVTY);
        config.summary.totalVTYLines++;
      }
  
      // Get VTY password
      if (currentVTY && line.startsWith('password ')) {
        currentVTY.password = line.replace('password ', '').trim();
      }
  
      // Get VTY transport method
      if (currentVTY && line.includes('transport input')) {
        currentVTY.transport = line.replace('transport input ', '').split(' ');
      }
  
      // Check for access-class (ACL) on VTY
      if (currentVTY && line.includes('access-class')) {
        currentVTY.accessClass = line.split(' ')[1];
      }
  
      // Detect ACL definitions
      if (line.startsWith('access-list ') || line.startsWith('ip access-list')) {
        config.acls.push(line);
        config.summary.totalACLs++;
      }
  
      // Reset current context when we hit an exclamation mark (end of block)
      if (line === '!') {
        currentInterface = null;
        currentVTY = null;
      }
    }
  
    return config;
  }
  
  /**
   * Detect weak or default passwords in configuration
   * @param {array} lines - Configuration lines
   * @returns {array} Array of detected weak password issues
   */
  function detectWeakPasswords(lines) {
    const issues = [];
  
    lines.forEach((line, index) => {
      if (line.startsWith('password ') || line.includes('secret ')) {
        const password = line.split(' ')[1];
        
        // Check if password is weak
        if (WEAK_PASSWORDS.includes(password)) {
          issues.push({
            severity: 'CRITICAL',
            category: 'Weak Authentication',
            title: `Weak password detected: "${password}"`,
            description: `Line ${index + 1}: Found weak or default password "${password}". This is a critical security vulnerability.`,
            location: `Line ${index + 1}`,
            recommendation: 'Use a strong password with at least 12 characters including uppercase, lowercase, numbers, and special characters.',
            cve: 'CWE-521'
          });
        }
  
        // Check if password is too short
        if (password.length < 8) {
          issues.push({
            severity: 'HIGH',
            category: 'Weak Authentication',
            title: 'Password too short',
            description: `Line ${index + 1}: Password is only ${password.length} characters. Minimum recommended length is 8 characters.`,
            location: `Line ${index + 1}`,
            recommendation: 'Use passwords with at least 8-12 characters.',
            cve: 'CWE-521'
          });
        }
      }
  
      // Check for enable password (should use enable secret instead)
      if (line.startsWith('enable password ')) {
        issues.push({
          severity: 'HIGH',
          category: 'Weak Authentication',
          title: 'Unencrypted enable password',
          description: `Line ${index + 1}: Using "enable password" which stores password in plain text.`,
          location: `Line ${index + 1}`,
          recommendation: 'Use "enable secret" instead, which stores an encrypted hash.',
          cve: 'CWE-256'
        });
      }
    });
  
    return issues;
  }
  
  /**
   * Check for open insecure ports/services
   * @param {array} lines - Configuration lines
   * @returns {array} Array of open port issues
   */
  function checkOpenPorts(lines) {
    const issues = [];
  
    lines.forEach((line, index) => {
      // Check for Telnet
      if (line.includes('transport input telnet') || line.includes('transport input all')) {
        issues.push({
          severity: 'CRITICAL',
          category: 'Insecure Service',
          title: 'Telnet enabled',
          description: `Line ${index + 1}: Telnet (port 23) is enabled. Telnet sends data in plain text including passwords.`,
          location: `Line ${index + 1}`,
          recommendation: 'Disable Telnet and use SSH (port 22) for secure remote access. Configure with "transport input ssh".',
          cve: 'CWE-319'
        });
      }
  
      // Check for HTTP
      if (line.includes('ip http server') && !line.startsWith('no ')) {
        issues.push({
          severity: 'HIGH',
          category: 'Insecure Service',
          title: 'HTTP server enabled',
          description: `Line ${index + 1}: HTTP (port 80) is enabled. HTTP traffic is unencrypted.`,
          location: `Line ${index + 1}`,
          recommendation: 'Disable HTTP and enable HTTPS instead using "ip http secure-server".',
          cve: 'CWE-319'
        });
      }
    });
  
    return issues;
  }
  
  /**
   * Analyze ACL (Access Control List) configuration
   * @param {array} lines - Configuration lines
   * @param {object} parsedConfig - Parsed configuration object
   * @returns {array} Array of ACL-related issues
   */
  function analyzeACLs(lines, parsedConfig) {
    const issues = [];
  
    // Check VTY lines for missing access-class
    parsedConfig.vtyLines.forEach(vty => {
      if (!vty.accessClass) {
        issues.push({
          severity: 'HIGH',
          category: 'Missing Access Control',
          title: 'No access-class on VTY line',
          description: `VTY line ${vty.range} has no access-class configured. This allows anyone to attempt remote access.`,
          location: `Line ${vty.lineNumber}`,
          recommendation: 'Configure an access-class to restrict remote access: "access-class <acl-number> in".',
          cve: 'CWE-284'
        });
      }
    });
  
    // Check interfaces for missing ACLs
    parsedConfig.interfaces.forEach(iface => {
      if (iface.status === 'active' && !iface.acl) {
        issues.push({
          severity: 'MEDIUM',
          category: 'Missing Access Control',
          title: `No ACL on interface ${iface.name}`,
          description: `Interface ${iface.name} is active but has no access control list configured.`,
          location: `Line ${iface.lineNumber}`,
          recommendation: 'Consider adding an ACL to filter traffic: "ip access-group <acl-name> in/out".',
          cve: 'CWE-284'
        });
      }
    });
  
    return issues;
  }
  
  /**
   * Find unused or shutdown interfaces
   * @param {array} lines - Configuration lines
   * @param {object} parsedConfig - Parsed configuration object
   * @returns {array} Array of unused interface warnings
   */
  function findUnusedInterfaces(lines, parsedConfig) {
    const issues = [];
  
    parsedConfig.interfaces.forEach(iface => {
      if (iface.status === 'shutdown' || iface.status === 'unknown') {
        issues.push({
          severity: 'LOW',
          category: 'Configuration Optimization',
          title: `Unused interface: ${iface.name}`,
          description: `Interface ${iface.name} is shutdown or not configured. Unused interfaces should be disabled for security.`,
          location: `Line ${iface.lineNumber}`,
          recommendation: 'If not needed, ensure interface is shutdown and consider removing unnecessary configuration.',
          cve: 'N/A'
        });
      }
    });
  
    return issues;
  }
  
  /**
   * Check for security best practices
   * @param {array} lines - Configuration lines
   * @returns {array} Array of best practice recommendations
   */
  function checkSecurityBestPractices(lines) {
    const issues = [];
    const configText = lines.join('\n');
  
    // Check for SSH configuration
    if (!configText.includes('transport input ssh')) {
      issues.push({
        severity: 'HIGH',
        category: 'Security Best Practice',
        title: 'SSH not configured',
        description: 'SSH (Secure Shell) is not configured for remote access. SSH provides encrypted communication.',
        location: 'Global configuration',
        recommendation: 'Configure SSH with: "crypto key generate rsa" and "transport input ssh" on VTY lines.',
        cve: 'N/A'
      });
    }
  
    // Check for login banner
    if (!configText.includes('banner')) {
      issues.push({
        severity: 'LOW',
        category: 'Security Best Practice',
        title: 'No login banner configured',
        description: 'Login banners warn unauthorized users and are important for legal compliance.',
        location: 'Global configuration',
        recommendation: 'Add a login banner: "banner login # Authorized access only #".',
        cve: 'N/A'
      });
    }
  
    // Check for logging
    if (!configText.includes('logging')) {
      issues.push({
        severity: 'MEDIUM',
        category: 'Security Best Practice',
        title: 'Logging not configured',
        description: 'No logging configuration found. Logging is essential for security monitoring and incident response.',
        location: 'Global configuration',
        recommendation: 'Configure logging: "logging buffered" and "logging host <syslog-server>".',
        cve: 'N/A'
      });
    }
  
    // Check for service password-encryption
    if (!configText.includes('service password-encryption')) {
      issues.push({
        severity: 'MEDIUM',
        category: 'Security Best Practice',
        title: 'Password encryption not enabled',
        description: 'Service password-encryption is not enabled. Passwords may be visible in plain text in the configuration.',
        location: 'Global configuration',
        recommendation: 'Enable password encryption: "service password-encryption".',
        cve: 'CWE-256'
      });
    }
  
    return issues;
  }
  
  /**
   * Calculate overall security score based on detected issues
   * @param {object} results - Analysis results object
   * @returns {number} Security score from 0 to 100
   */
  function calculateSecurityScore(results) {
    // Start with perfect score
    let score = 100;
  
    // Deduct points based on severity
    score -= results.critical * 15;  // Critical issues: -15 points each
    score -= results.high * 10;      // High issues: -10 points each
    score -= results.medium * 5;     // Medium issues: -5 points each
    score -= results.low * 2;        // Low issues: -2 points each
  
    // Ensure score doesn't go below 0
    return Math.max(0, score);
  }
  
  /**
   * Generate recommendations based on detected issues
   * @param {object} results - Analysis results object
   * @returns {array} Array of recommendation strings
   */
  function generateRecommendations(results) {
    const recommendations = [];
  
    if (results.critical > 0) {
      recommendations.push('🔴 URGENT: Address all critical vulnerabilities immediately. These pose severe security risks.');
    }
  
    if (results.high > 0) {
      recommendations.push('🟠 HIGH PRIORITY: Fix high-severity issues as soon as possible.');
    }
  
    if (results.securityScore < 50) {
      recommendations.push('⚠️ Overall security posture is poor. Consider a comprehensive security review.');
    } else if (results.securityScore < 75) {
      recommendations.push('⚠️ Security posture needs improvement. Focus on high and medium severity issues.');
    } else if (results.securityScore >= 90) {
      recommendations.push('✅ Good security posture! Continue monitoring and maintaining security configurations.');
    }
  
    recommendations.push('📚 Refer to Cisco security best practices documentation for detailed guidance.');
    recommendations.push('🔄 Regularly audit and update your network configurations.');
  
    return recommendations;
  }
  
  // Export the main analyze function
  module.exports = {
    analyzeConfiguration
  };