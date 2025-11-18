/**
 * Router Detector Service
 * Detects router IP and attempts to fetch configuration
 */

const ping = require('ping');
const { NodeSSH } = require('node-ssh');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const axios = require('axios');

// Dynamically import ESM-only module
async function loadDefaultGateway() {
  const { default: defaultGateway } = await import('default-gateway');
  return defaultGateway;
}

class RouterDetector {
  constructor() {
    this.ssh = new NodeSSH();
    this.commonPorts = [22, 23]; // SSH, Telnet
    this.commonCredentials = [
      { username: 'admin', password: 'admin' },
      { username: 'admin', password: 'password' },
      { username: 'root', password: 'admin' },
      { username: 'root', password: '' },
      { username: 'admin', password: '' }
    ];
  }

  /**
   * Get default gateway (router IP)
   */
  async getGatewayIP() {
    try {
      const defaultGateway = await loadDefaultGateway();
      const result = await defaultGateway.v4();
      console.log(`🌐 Gateway IP: ${result.gateway}`);
      return result.gateway;
    } catch (error) {
      throw new Error(`Failed to detect gateway: ${error.message}`);
    }
  }

  /**
   * Check if router is reachable
   */
  async pingRouter(ip) {
    try {
      const result = await ping.promise.probe(ip, {
        timeout: 5,
        extra: ['-c', '3']
      });
      return result.alive;
    } catch (error) {
      return false;
    }
  }

  /**
   * Detect router type by checking open ports and banners
   */
  async detectRouterType(ip) {
    console.log(`🔍 Detecting router type for ${ip}...`);

    const detections = [];

    try {
      if (await this.checkPort(ip, 22)) detections.push({ type: 'SSH', port: 22, available: true });
      if (await this.checkPort(ip, 23)) detections.push({ type: 'Telnet', port: 23, available: true });
      if (await this.checkPort(ip, 80)) detections.push({ type: 'HTTP', port: 80, available: true });
      if (await this.checkPort(ip, 443)) detections.push({ type: 'HTTPS', port: 443, available: true });
    } catch (e) {
      console.log('Error during detection:', e.message);
    }

    return detections;
  }

  /**
   * Check if a port is open
   */
  async checkPort(ip, port) {
    return new Promise((resolve) => {
      const net = require('net');
      const socket = new net.Socket();

      socket.setTimeout(3000);

      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });

      socket.on('error', () => {
        resolve(false);
      });

      socket.connect(port, ip);
    });
  }

  /**
   * Attempt to connect to router via SSH
   */
  async connectSSH(ip, username, password, port = 22) {
    try {
      await this.ssh.connect({
        host: ip,
        username,
        password,
        port,
        readyTimeout: 5000, // Reduced timeout
        algorithms: {
          kex: [
            'diffie-hellman-group14-sha1',
            'diffie-hellman-group1-sha1',
            'ecdh-sha2-nistp256',
            'ecdh-sha2-nistp384',
            'ecdh-sha2-nistp521'
          ],
          cipher: [
            'aes128-cbc',
            'aes192-cbc',
            'aes256-cbc',
            '3des-cbc',
            'aes128-ctr',
            'aes192-ctr',
            'aes256-ctr'
          ]
        }
      });

      console.log(`✅ SSH connected to ${ip}`);
      return true;
    } catch (error) {
      // Don't log SSH failures - they're expected if SSH is disabled
      return false;
    }
  }

  /**
   * Try to fetch configuration via OpenWRT HTTP API (LuCI) or generic router web interface
   */
  async fetchOpenWRTConfigHTTP(ip, username, password) {
    try {
      // Try HTTPS first, then HTTP
      const protocols = ['https', 'http'];
      
      for (const protocol of protocols) {
        try {
          // Try multiple router web interface endpoints
          const endpoints = [
            // OpenWRT LuCI
            '/cgi-bin/luci/admin/ubus',
            '/cgi-bin/luci/admin/network/network',
            '/cgi-bin/luci/admin/network/firewall',
            '/cgi-bin/luci/admin/system/system',
            // Generic router admin pages
            '/admin/config.asp',
            '/admin/status.asp',
            '/cgi-bin/webproc',
            '/cgi-bin/webcm',
            // RouterOS (MikroTik)
            '/rest/system/resource',
            '/rest/ip/address',
            // Generic
            '/status.asp',
            '/index.asp',
            '/'
          ];

          let config = '';

          for (const endpoint of endpoints) {
            try {
              const url = `${protocol}://${ip}${endpoint}`;
              
              // Try with basic auth
              const response = await axios.get(url, {
                auth: {
                  username: username || 'admin',
                  password: password || ''
                },
                timeout: 2000, // Reduced timeout
                validateStatus: () => true, // Don't throw on any status
                headers: {
                  'User-Agent': 'Mozilla/5.0 (compatible; NetworkAuditor/1.0)'
                }
              });

              if (response.status === 200) {
                // If we get HTML, try to extract useful info
                if (typeof response.data === 'string' && response.data.includes('<')) {
                  // Extract text content from HTML
                  const textContent = response.data
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                  
                  if (textContent.length > 100) {
                    config += `\n! Router Web Interface: ${endpoint}\n`;
                    config += textContent.substring(0, 5000) + '\n';
                  }
                } else if (response.data) {
                  // JSON or other data
                  config += `\n! Router API: ${endpoint}\n`;
                  config += JSON.stringify(response.data, null, 2) + '\n';
                }
              }
            } catch (e) {
              continue;
            }
          }

          if (config.length > 100) {
            return config;
          }
        } catch (e) {
          continue;
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Fetch router configuration
   */
  async fetchConfiguration(ip, username, password) {
    try {
      // First, try OpenWRT HTTP API (no SSH needed)
      const httpConfig = await this.fetchOpenWRTConfigHTTP(ip, username, password);
      if (httpConfig && httpConfig.length > 100) {
        console.log(`✅ Configuration fetched via HTTP API (${httpConfig.length} bytes)`);
        return httpConfig;
      }

      // If HTTP API fails, try SSH
      const connected = await this.connectSSH(ip, username, password);

      if (!connected) {
        throw new Error('Failed to connect to router');
      }

      const commands = [
        'uci show',                  // OpenWRT - Unified Configuration Interface
        'uci show network',         // OpenWRT network config
        'uci show firewall',         // OpenWRT firewall config
        'uci show wireless',         // OpenWRT wireless config
        'cat /etc/config/network',   // OpenWRT network file
        'cat /etc/config/firewall',  // OpenWRT firewall file
        'cat /etc/config/wireless',  // OpenWRT wireless file
        'cat /etc/config/system',    // OpenWRT system config
        'ubus call system board',    // OpenWRT system info
        'ubus call network.interface dump', // OpenWRT network interfaces
        'show running-config',      // Cisco
        'show configuration'        // Generic
      ];

      let config = '';

      for (const cmd of commands) {
        try {
          const result = await this.ssh.execCommand(cmd);
          if (result.stdout && result.stdout.length > 50) {
            config += `\n! Output from: ${cmd}\n`;
            config += result.stdout + '\n';
          }
        } catch (e) {
          continue;
        }
      }

      await this.ssh.dispose();

      if (!config || config.length < 50) {
        throw new Error('Could not retrieve configuration from router');
      }

      console.log(`✅ Configuration fetched via SSH (${config.length} bytes)`);

      return config;
    } catch (error) {
      if (this.ssh.isConnected()) {
        await this.ssh.dispose();
      }
      throw error;
    }
  }

  /**
   * Auto-detect and fetch router configuration
   */
  async autoFetch(password) {
    try {
      const gatewayIP = await this.getGatewayIP();

      console.log(`🏓 Pinging router at ${gatewayIP}...`);
      const isAlive = await this.pingRouter(gatewayIP);

      if (!isAlive) {
        throw new Error(`Router at ${gatewayIP} is not reachable`);
      }

      console.log('✅ Router is reachable');

      const services = await this.detectRouterType(gatewayIP);
      console.log('📡 Available services:', services);

      let config = null;

      // Try user-provided password first (with shorter timeout per attempt)
      if (password) {
        const usernames = ['admin', 'root', 'user'];
        console.log(`🔑 Trying provided password with common usernames...`);
        for (const username of usernames) {
          try {
            // Add timeout per attempt (5 seconds)
            config = await Promise.race([
              this.fetchConfiguration(gatewayIP, username, password),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]);
            if (config) {
              console.log(`✅ Successfully authenticated with ${username}`);
              return {
                success: true,
                gateway: gatewayIP,
                username: username,
                config: config,
                services: services
              };
            }
          } catch (e) {
            continue;
          }
        }
      }

      // Try common credentials (with shorter timeout, limit attempts)
      console.log(`🔑 Trying common router credentials...`);
      // Only try first 3 common credentials to save time
      const limitedCredentials = this.commonCredentials.slice(0, 3);
      for (const cred of limitedCredentials) {
        try {
          // Add timeout per attempt (5 seconds)
          config = await Promise.race([
            this.fetchConfiguration(gatewayIP, cred.username, cred.password),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
          ]);
          if (config) {
            console.log(`✅ Successfully authenticated with ${cred.username}:${cred.password ? '***' : '(empty)'}`);
            return {
              success: true,
              gateway: gatewayIP,
              username: cred.username,
              config: config,
              services: services
            };
          }
        } catch (e) {
          continue;
        }
      }

      throw new Error('Failed to authenticate with router. The router may require different credentials or SSH/HTTP access may be disabled.');
    } catch (error) {
      throw error;
    }
  }
}

module.exports = RouterDetector;
