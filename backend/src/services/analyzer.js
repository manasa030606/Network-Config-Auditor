/**
 * Simple Configuration Analyzer
 */

// Weak passwords to check
const WEAK_PASSWORDS = [
  'cisco', 'admin', 'password', '123456', 'letmein', 
  'welcome', 'default', 'secret', 'changeme', '12345'
];

/**
 * Main analysis function
 */
function analyzeConfiguration(configText) {
  const lines = configText.split('\n').map(line => line.trim());
  
  const results = {
    totalIssues: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    issues: [],
    recommendations: [],
    configSummary: {
      totalInterfaces: 0,
      totalVTYLines: 0,
      totalACLs: 0
    }
  };

  // Parse configuration
  const parsedConfig = parseConfiguration(lines);
  results.configSummary = parsedConfig.summary;

  // Run security checks
  const weakPasswords = detectWeakPasswords(lines);
  const openPorts = checkOpenPorts(lines);
  const missingACLs = analyzeACLs(lines, parsedConfig);
  const securityBestPractices = checkSecurityBestPractices(lines);

  // Combine all issues
  const allIssues = [
    ...weakPasswords,
    ...openPorts,
    ...missingACLs,
    ...securityBestPractices
  ];

  // Count by severity
  allIssues.forEach(issue => {
    results.issues.push(issue);
    results.totalIssues++;
    
    switch(issue.severity.toLowerCase()) {
      case 'critical': results.critical++; break;
      case 'high': results.high++; break;
      case 'medium': results.medium++; break;
      case 'low': results.low++; break;
    }
  });

  // Calculate security score
  results.securityScore = calculateSecurityScore(results);

  // Generate recommendations
  results.recommendations = generateRecommendations(results);

  return results;
}

/**
 * Parse configuration structure
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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect interfaces
    if (line.startsWith('interface ')) {
      currentInterface = {
        name: line.replace('interface ', ''),
        status: 'unknown',
        acl: null,
        lineNumber: i + 1
      };
      config.interfaces.push(currentInterface);
      config.summary.totalInterfaces++;
    }

    // Check interface status
    if (currentInterface && line === 'no shutdown') {
      currentInterface.status = 'active';
    }
    if (currentInterface && line === 'shutdown') {
      currentInterface.status = 'shutdown';
    }

    // Detect VTY lines
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

    // Get VTY transport
    if (currentVTY && line.includes('transport input')) {
      currentVTY.transport = line.replace('transport input ', '').split(' ');
    }

    // Detect ACLs
    if (line.startsWith('access-list ') || line.startsWith('ip access-list')) {
      config.acls.push(line);
      config.summary.totalACLs++;
    }

    // Reset context
    if (line === '!') {
      currentInterface = null;
      currentVTY = null;
    }
  }

  return config;
}

/**
 * Detect weak passwords
 */
function detectWeakPasswords(lines) {
  const issues = [];

  lines.forEach((line, index) => {
    if (line.startsWith('password ') || line.includes('secret ')) {
      const password = line.split(' ')[1];
      
      if (WEAK_PASSWORDS.includes(password)) {
        issues.push({
          severity: 'CRITICAL',
          category: 'Weak Authentication',
          title: `Weak password detected: "${password}"`,
          description: `Line ${index + 1}: Found weak or default password "${password}".`,
          location: `Line ${index + 1}`,
          recommendation: 'Use a strong password with at least 12 characters.',
          cve: 'CWE-521'
        });
      }

      if (password.length < 8) {
        issues.push({
          severity: 'HIGH',
          category: 'Weak Authentication',
          title: 'Password too short',
          description: `Line ${index + 1}: Password is only ${password.length} characters.`,
          location: `Line ${index + 1}`,
          recommendation: 'Use passwords with at least 8-12 characters.',
          cve: 'CWE-521'
        });
      }
    }

    if (line.startsWith('enable password ')) {
      issues.push({
        severity: 'HIGH',
        category: 'Weak Authentication',
        title: 'Unencrypted enable password',
        description: `Line ${index + 1}: Using "enable password" stores password in plain text.`,
        location: `Line ${index + 1}`,
        recommendation: 'Use "enable secret" instead.',
        cve: 'CWE-256'
      });
    }
  });

  return issues;
}

/**
 * Check for insecure services
 */
function checkOpenPorts(lines) {
  const issues = [];

  lines.forEach((line, index) => {
    if (line.includes('transport input telnet') || line.includes('transport input all')) {
      issues.push({
        severity: 'CRITICAL',
        category: 'Insecure Service',
        title: 'Telnet enabled',
        description: `Line ${index + 1}: Telnet (port 23) is enabled.`,
        location: `Line ${index + 1}`,
        recommendation: 'Use SSH instead of Telnet.',
        cve: 'CWE-319'
      });
    }

    if (line.includes('ip http server') && !line.startsWith('no ')) {
      issues.push({
        severity: 'HIGH',
        category: 'Insecure Service',
        title: 'HTTP server enabled',
        description: `Line ${index + 1}: HTTP (port 80) is enabled.`,
        location: `Line ${index + 1}`,
        recommendation: 'Use HTTPS instead.',
        cve: 'CWE-319'
      });
    }
  });

  return issues;
}

/**
 * Analyze ACLs
 */
function analyzeACLs(lines, parsedConfig) {
  const issues = [];

  parsedConfig.vtyLines.forEach(vty => {
    if (!vty.accessClass) {
      issues.push({
        severity: 'HIGH',
        category: 'Missing Access Control',
        title: 'No access-class on VTY line',
        description: `VTY line ${vty.range} has no access-class configured.`,
        location: `Line ${vty.lineNumber}`,
        recommendation: 'Configure an access-class.',
        cve: 'CWE-284'
      });
    }
  });

  parsedConfig.interfaces.forEach(iface => {
    if (iface.status === 'active' && !iface.acl) {
      issues.push({
        severity: 'MEDIUM',
        category: 'Missing Access Control',
        title: `No ACL on interface ${iface.name}`,
        description: `Interface ${iface.name} has no access control list.`,
        location: `Line ${iface.lineNumber}`,
        recommendation: 'Consider adding an ACL.',
        cve: 'CWE-284'
      });
    }

    if (iface.status === 'shutdown' || iface.status === 'unknown') {
      issues.push({
        severity: 'LOW',
        category: 'Configuration Optimization',
        title: `Unused interface: ${iface.name}`,
        description: `Interface ${iface.name} is shutdown or not configured.`,
        location: `Line ${iface.lineNumber}`,
        recommendation: 'Ensure interface is properly shutdown if not needed.',
        cve: 'N/A'
      });
    }
  });

  return issues;
}

/**
 * Check security best practices
 */
function checkSecurityBestPractices(lines) {
  const issues = [];
  const configText = lines.join('\n');

  if (!configText.includes('transport input ssh')) {
    issues.push({
      severity: 'HIGH',
      category: 'Security Best Practice',
      title: 'SSH not configured',
      description: 'SSH is not configured for remote access.',
      location: 'Global configuration',
      recommendation: 'Configure SSH for secure remote access.',
      cve: 'N/A'
    });
  }

  return issues;
}

/**
 * Calculate security score
 */
function calculateSecurityScore(results) {
  let score = 100;
  
  score -= results.critical * 15;
  score -= results.high * 10;
  score -= results.medium * 5;
  score -= results.low * 2;
  
  return Math.max(0, score);
}

/**
 * Generate recommendations
 */
function generateRecommendations(results) {
  const recommendations = [];

  if (results.critical > 0) {
    recommendations.push('🔴 URGENT: Address all critical vulnerabilities immediately.');
  }

  if (results.high > 0) {
    recommendations.push('🟠 HIGH PRIORITY: Fix high-severity issues as soon as possible.');
  }

  if (results.securityScore < 50) {
    recommendations.push('⚠️ Overall security posture is poor.');
  }

  recommendations.push('📚 Refer to Cisco security best practices.');
  recommendations.push('🔄 Regularly audit your network configurations.');

  return recommendations;
}

module.exports = {
  analyzeConfiguration
};