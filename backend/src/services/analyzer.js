/**
 * Simple Configuration Analyzer
 */

// Weak passwords to check
const WEAK_PASSWORDS = [
  'cisco', 'admin', 'password', '123456', 'letmein', 
  'welcome', 'default', 'secret', 'changeme', '12345',
  '1234', '12345678', 'qwerty', 'abc123', 'password123',
  'admin123', 'root', 'user', 'pass', '123'
];

/**
 * Analyze password strength
 */
function analyzePasswordStrength(password) {
  const issues = [];
  
  if (!password || password.length === 0) {
    return {
      strength: 'CRITICAL',
      score: 0,
      issues: [{
        severity: 'CRITICAL',
        category: 'Weak Authentication',
        title: 'No password provided',
        description: 'Router authentication password is empty or not provided.',
        location: 'Router Authentication',
        recommendation: 'Always use a strong password for router access.',
        cve: 'CWE-521'
      }]
    };
  }

  // Check if password is in weak passwords list
  if (WEAK_PASSWORDS.includes(password.toLowerCase())) {
    issues.push({
      severity: 'CRITICAL',
      category: 'Weak Authentication',
      title: `Very weak password detected: "${password}"`,
      description: `The password "${password}" is a commonly used weak password that is easily guessable.`,
      location: 'Router Authentication',
      recommendation: 'Use a strong password with at least 12 characters, including uppercase, lowercase, numbers, and symbols.',
      cve: 'CWE-521'
    });
    return {
      strength: 'CRITICAL',
      score: 10,
      issues: issues
    };
  }

  // Check password length
  if (password.length < 8) {
    issues.push({
      severity: 'CRITICAL',
      category: 'Weak Authentication',
      title: 'Password too short',
      description: `Password is only ${password.length} characters. Short passwords are easily cracked.`,
      location: 'Router Authentication',
      recommendation: 'Use passwords with at least 12-16 characters for better security.',
      cve: 'CWE-521'
    });
  } else if (password.length < 12) {
    issues.push({
      severity: 'HIGH',
      category: 'Weak Authentication',
      title: 'Password should be longer',
      description: `Password is ${password.length} characters. Consider using 12+ characters for better security.`,
      location: 'Router Authentication',
      recommendation: 'Use passwords with at least 12-16 characters.',
      cve: 'CWE-521'
    });
  }

  // Check for common patterns
  if (/^[0-9]+$/.test(password)) {
    issues.push({
      severity: 'HIGH',
      category: 'Weak Authentication',
      title: 'Password contains only numbers',
      description: 'Password consists only of numbers, making it easier to crack.',
      location: 'Router Authentication',
      recommendation: 'Use a mix of uppercase, lowercase, numbers, and special characters.',
      cve: 'CWE-521'
    });
  }

  if (/^[a-z]+$/i.test(password)) {
    issues.push({
      severity: 'HIGH',
      category: 'Weak Authentication',
      title: 'Password contains only letters',
      description: 'Password consists only of letters, making it easier to crack.',
      location: 'Router Authentication',
      recommendation: 'Use a mix of uppercase, lowercase, numbers, and special characters.',
      cve: 'CWE-521'
    });
  }

  // Check for common words
  const commonWords = ['password', 'admin', 'root', 'user', 'login', 'welcome'];
  if (commonWords.some(word => password.toLowerCase().includes(word))) {
    issues.push({
      severity: 'HIGH',
      category: 'Weak Authentication',
      title: 'Password contains common words',
      description: 'Password contains common dictionary words, making it vulnerable to dictionary attacks.',
      location: 'Router Authentication',
      recommendation: 'Avoid using common words. Use a combination of random words or a passphrase.',
      cve: 'CWE-521'
    });
  }

  // Calculate strength
  let strength = 'STRONG';
  let score = 100;

  if (issues.some(i => i.severity === 'CRITICAL')) {
    strength = 'CRITICAL';
    score = 20;
  } else if (issues.some(i => i.severity === 'HIGH')) {
    strength = 'WEAK';
    score = 40;
  } else if (password.length >= 12 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
    strength = 'STRONG';
    score = 100;
  } else if (password.length >= 12) {
    strength = 'MODERATE';
    score = 70;
  }

  return {
    strength: strength,
    score: score,
    issues: issues
  };
}

/**
 * Main analysis function
 */
function analyzeConfiguration(configText, userPassword = null) {
  const lines = configText.split('\n').map(line => line.trim());
  
  const results = {
    totalIssues: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    issues: [],
    recommendations: [],
    passwordAnalysis: null,
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

  // Analyze user-provided password if available
  let passwordIssues = [];
  if (userPassword) {
    const passwordAnalysis = analyzePasswordStrength(userPassword);
    results.passwordAnalysis = passwordAnalysis;
    // Add password issues to main issues list
    if (passwordAnalysis.issues && passwordAnalysis.issues.length > 0) {
      passwordIssues = passwordAnalysis.issues;
    }
  }

  // Combine all issues
  const allIssues = [
    ...weakPasswords,
    ...openPorts,
    ...missingACLs,
    ...securityBestPractices,
    ...passwordIssues
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

  // Calculate security score (factor in password strength)
  results.securityScore = calculateSecurityScore(results, results.passwordAnalysis);

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

    // Skip comment lines (especially fallback mode comments)
    if (line.trim().startsWith('!')) {
      // Check if it's a fallback mode comment
      if (line.includes('Fallback Mode') || 
          line.includes('fallback') || 
          line.includes('recommendations') ||
          line.includes('Best Practices') ||
          line.includes('demonstration')) {
        continue; // Skip fallback mode comments entirely
      }
      // Regular comments can continue to be processed for context
    }

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
    // Skip comments and fallback mode notes
    if (line.trim().startsWith('!') && (
      line.includes('Fallback Mode') || 
      line.includes('fallback') || 
      line.includes('demonstration') ||
      line.includes('recommendations')
    )) {
      return; // Skip analyzing comment lines in fallback mode
    }

    if (line.startsWith('password ') || line.includes('secret ')) {
      const password = line.split(' ')[1];
      
      // Skip if this is in a comment/recommendation section
      if (!password || password.includes('!')) {
        return;
      }
      
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
    // Skip comments and recommendations in fallback mode
    if (line.trim().startsWith('!') && (
      line.includes('Fallback Mode') || 
      line.includes('fallback') || 
      line.includes('recommendations') ||
      line.includes('Best Practices')
    )) {
      return;
    }

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

    if (line.includes('ip http server') && !line.startsWith('no ') && !line.includes('!')) {
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
function calculateSecurityScore(results, passwordAnalysis = null) {
  let score = 100;
  
  // Factor in password strength (heavily weighted - applied FIRST)
  if (passwordAnalysis) {
    // Password strength significantly affects overall score
    if (passwordAnalysis.strength === 'CRITICAL') {
      // Critical password severely limits score
      score = 20; // Start at 20 for critical passwords
      // Still subtract other issues
      score -= results.critical * 5;
      score -= results.high * 3;
      score -= results.medium * 2;
      score -= results.low * 1;
    } else if (passwordAnalysis.strength === 'WEAK') {
      // Weak password limits score
      score = 40; // Start at 40 for weak passwords
      score -= results.critical * 8;
      score -= results.high * 5;
      score -= results.medium * 3;
      score -= results.low * 1;
    } else if (passwordAnalysis.strength === 'MODERATE') {
      // Moderate password slightly limits score
      score = 70; // Start at 70 for moderate passwords
      score -= results.critical * 12;
      score -= results.high * 8;
      score -= results.medium * 4;
      score -= results.low * 2;
    } else {
      // Strong password - normal calculation
      score -= results.critical * 15;
      score -= results.high * 10;
      score -= results.medium * 5;
      score -= results.low * 2;
    }
  } else {
    // No password provided - normal calculation
    score -= results.critical * 15;
    score -= results.high * 10;
    score -= results.medium * 5;
    score -= results.low * 2;
  }
  
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