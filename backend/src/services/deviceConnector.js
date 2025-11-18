const SSHClient = require('./sshClient');
const axios = require('axios');

class DeviceConnector {
  constructor() {
    this.sshClient = new SSHClient();
  }

  /**
   * Connect to device and fetch configuration
   */
  async fetchConfiguration(deviceInfo) {
    const { type, host, username, password, port, protocol } = deviceInfo;

    switch (protocol.toLowerCase()) {
      case 'ssh':
        return await this.fetchViaSSH(host, username, password, port);
      
      case 'api':
        return await this.fetchViaAPI(type, host, username, password, port);
      
      default:
        throw new Error(`Unsupported protocol: ${protocol}`);
    }
  }

  /**
   * Fetch config via SSH (Cisco IOS, OpenWRT)
   */
  async fetchViaSSH(host, username, password, port = 22) {
    try {
      await this.sshClient.connect(host, username, password, port);
      const config = await this.sshClient.getRunningConfig();
      await this.sshClient.disconnect();

      return {
        success: true,
        config,
        method: 'SSH'
      };
    } catch (error) {
      throw new Error(`SSH fetch failed: ${error.message}`);
    }
  }

  /**
   * Fetch config via REST API (pfSense, OpenWRT API)
   */
  async fetchViaAPI(deviceType, host, username, password, port = 443) {
    try {
      let config;

      if (deviceType.toLowerCase() === 'pfsense') {
        config = await this.fetchPfSenseConfig(host, username, password, port);
      } else if (deviceType.toLowerCase() === 'openwrt') {
        config = await this.fetchOpenWRTConfig(host, username, password, port);
      } else {
        throw new Error(`Unsupported device type: ${deviceType}`);
      }

      return {
        success: true,
        config,
        method: 'API'
      };
    } catch (error) {
      throw new Error(`API fetch failed: ${error.message}`);
    }
  }

  /**
   * Fetch pfSense configuration via API
   */
  async fetchPfSenseConfig(host, username, password, port) {
    const url = `https://${host}:${port}/api/v1/system/config`;
    
    const response = await axios.get(url, {
      auth: { username, password },
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
    });

    // Convert pfSense XML to text format
    return this.convertPfSenseToText(response.data);
  }

  /**
   * Fetch OpenWRT configuration via UCI
   */
  async fetchOpenWRTConfig(host, username, password, port) {
    // OpenWRT uses SSH with UCI commands
    await this.sshClient.connect(host, username, password, port);
    
    const commands = [
      'uci show network',
      'uci show firewall',
      'uci show wireless',
      'uci show system'
    ];

    let config = '';
    for (const cmd of commands) {
      const result = await this.sshClient.ssh.execCommand(cmd);
      config += result.stdout + '\n\n';
    }

    await this.sshClient.disconnect();
    return config;
  }

  /**
   * Convert pfSense XML to readable text format
   */
  convertPfSenseToText(xmlData) {
    // Simplified conversion - in production, use proper XML parser
    let text = '! pfSense Configuration\n!\n';
    
    // Extract key security settings
    if (xmlData.interfaces) {
      text += '! Interfaces\n';
      Object.keys(xmlData.interfaces).forEach(iface => {
        text += `interface ${iface}\n`;
        text += ` ip address ${xmlData.interfaces[iface].ipaddr || 'dhcp'}\n`;
      });
    }

    return text;
  }

  /**
   * Test device connectivity before full fetch
   */
  async testConnection(deviceInfo) {
    const { protocol, host, username, password, port } = deviceInfo;

    if (protocol === 'ssh') {
      return await this.sshClient.testConnection(host, username, password, port);
    } else if (protocol === 'api') {
      // Test API endpoint
      try {
        const url = `https://${host}:${port}/api/v1/system/status`;
        await axios.get(url, {
          auth: { username, password },
          timeout: 5000,
          httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
        });
        return { success: true, message: 'API connection successful' };
      } catch (error) {
        return { success: false, message: error.message };
      }
    }

    return { success: false, message: 'Unsupported protocol' };
  }
}

module.exports = DeviceConnector;