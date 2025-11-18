const { NodeSSH } = require('node-ssh');

class SSHClient {
  constructor() {
    this.ssh = new NodeSSH();
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Connect to device via SSH
   */
  async connect(host, username, password, port = 22) {
    try {
      await this.ssh.connect({
        host,
        username,
        password,
        port,
        readyTimeout: this.timeout,
        // Allow older encryption for Cisco devices
        algorithms: {
          kex: ['diffie-hellman-group14-sha1', 'diffie-hellman-group1-sha1'],
          cipher: ['aes128-cbc', '3des-cbc'],
        }
      });
      
      console.log(`✅ SSH Connected to ${host}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ SSH Connection failed: ${error.message}`);
      throw new Error(`Failed to connect: ${error.message}`);
    }
  }

  /**
   * Fetch running configuration
   */
  async getRunningConfig() {
    try {
      // Execute 'show running-config' command
      const result = await this.ssh.execCommand('show running-config');
      
      if (result.stderr) {
        throw new Error(result.stderr);
      }

      return result.stdout;
    } catch (error) {
      throw new Error(`Failed to fetch config: ${error.message}`);
    }
  }

  /**
   * Test device connectivity
   */
  async testConnection(host, username, password, port = 22) {
    try {
      await this.connect(host, username, password, port);
      const hostname = await this.ssh.execCommand('show version | include hostname');
      await this.disconnect();
      
      return {
        success: true,
        message: 'Connection successful',
        hostname: hostname.stdout
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Disconnect from device
   */
  async disconnect() {
    if (this.ssh.isConnected()) {
      this.ssh.dispose();
      console.log('🔌 SSH Disconnected');
    }
  }
}

module.exports = SSHClient;