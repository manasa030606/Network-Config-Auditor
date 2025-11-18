/**
 * WiFi Scanner Service
 * Scans for available WiFi networks
 */
const wifi = require('node-wifi');
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

// Initialize wifi module
wifi.init({
  iface: null // network interface, choose a random wifi interface if set to null
});

class WiFiScanner {
  constructor() {
    this.currentConnection = null;
  }

  /**
   * Scan WiFi networks using macOS system commands (fallback)
   */
  async scanNetworksMacOS() {
    try {
      console.log('🔍 Scanning WiFi using macOS system commands...');
      
      // Try using airport command (requires location services)
      let command = '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -s';
      
      try {
        const { stdout } = await execPromise(command, { timeout: 10000 });
        const lines = stdout.split('\n').filter(line => line.trim().length > 0);
        
        const networks = [];
        const currentSSID = await this.getCurrentSSIDMacOS();
        
        // Parse airport output
        // Format: SSID BSSID RSSI CHANNEL HT CC SECURITY (auth/unicast/group)
        // Note: SSID can contain spaces, so we need to parse carefully
        for (let i = 1; i < lines.length; i++) { // Skip header
          const line = lines[i].trim();
          if (!line) continue;
          
          // Airport output format: SSID (may have spaces) BSSID RSSI CHANNEL HT CC SECURITY
          // BSSID is always in format XX:XX:XX:XX:XX:XX (17 chars)
          // Find the BSSID position (starts with MAC address pattern)
          const bssidMatch = line.match(/([0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2})/);
          
          if (!bssidMatch) continue;
          
          const bssidIndex = bssidMatch.index;
          const ssid = line.substring(0, bssidIndex).trim();
          const rest = line.substring(bssidIndex).trim();
          const parts = rest.split(/\s+/);
          
          if (parts.length < 2) continue;
          
          const bssid = parts[0];
          const rssi = parseInt(parts[1]);
          const channel = parseInt(parts[2]) || 0;
          const security = parts.slice(5).join(' ') || 'Open';
          
          // Convert RSSI to percentage (RSSI typically ranges from -100 to 0)
          // If RSSI is invalid or 0, don't default to 100%
          let signal = 0;
          if (!isNaN(rssi) && rssi < 0) {
            // RSSI is negative, convert to percentage
            // -50 dBm = excellent (100%), -100 dBm = poor (0%)
            signal = Math.max(0, Math.min(100, 2 * (rssi + 100)));
          } else if (!isNaN(rssi) && rssi === 0) {
            // If RSSI is exactly 0, it might be a parsing error, set to unknown
            signal = 0;
          }
          
          networks.push({
            ssid: ssid,
            bssid: bssid,
            signal: signal,
            security: security.includes('WPA') ? 'WPA2' : security.includes('WEP') ? 'WEP' : 'Open',
            channel: channel,
            frequency: channel > 0 ? (channel <= 14 ? 2400 + (channel * 5) : 5000 + (channel * 5)) : 0,
            isConnected: ssid === currentSSID
          });
        }
        
        // Sort by signal strength
        networks.sort((a, b) => b.signal - a.signal);
        
        console.log(`✅ Found ${networks.length} networks via macOS system command`);
        
        return {
          success: true,
          networks: networks,
          currentNetwork: currentSSID,
          method: 'macOS system command'
        };
      } catch (error) {
        console.log('⚠️  Airport command failed, trying networksetup...');
        
        // Fallback: Use networksetup (less detailed but more reliable)
        try {
          const { stdout } = await execPromise('networksetup -listallhardwareports', { timeout: 5000 });
          const wifiInterface = stdout.match(/Hardware Port: Wi-Fi[\s\S]*?Device: (\w+)/);
          
          if (wifiInterface) {
            const device = wifiInterface[1];
            const currentSSID = await this.getCurrentSSIDMacOS();
            
            // networksetup doesn't provide scan, so return current network only
            const networks = currentSSID ? [{
              ssid: currentSSID,
              bssid: 'N/A',
              signal: 100,
              security: 'Unknown',
              channel: 0,
              frequency: 0,
              isConnected: true
            }] : [];
            
            return {
              success: true,
              networks: networks,
              currentNetwork: currentSSID,
              method: 'macOS networksetup (limited)',
              note: 'macOS requires Location Services permission to scan WiFi. Please enable it in System Preferences > Security & Privacy > Location Services.'
            };
          }
        } catch (err) {
          throw new Error('macOS WiFi scanning requires Location Services permission');
        }
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current WiFi SSID on macOS
   */
  async getCurrentSSIDMacOS() {
    try {
      const { stdout } = await execPromise('networksetup -getairportnetwork en0', { timeout: 3000 });
      const match = stdout.match(/Current Wi-Fi Network:\s*(.+)/);
      return match ? match[1].trim() : null;
    } catch (error) {
      try {
        const { stdout } = await execPromise('/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I', { timeout: 3000 });
        const match = stdout.match(/\sSSID:\s*(.+)/);
        return match ? match[1].trim() : null;
      } catch (err) {
        return null;
      }
    }
  }

  /**
   * Scan for available WiFi networks
   */
  async scanNetworks() {
    try {
      console.log('🔍 Scanning for WiFi networks...');
      
      // On macOS, try system commands first (more reliable)
      if (process.platform === 'darwin') {
        try {
          return await this.scanNetworksMacOS();
        } catch (macOSError) {
          console.log('⚠️  macOS system command failed, trying node-wifi...');
          console.log('   Error:', macOSError.message);
        }
      }
      
      // Try node-wifi library
      try {
        const networks = await wifi.scan();
        
        // Get current connection
        const currentConnections = await wifi.getCurrentConnections();
        this.currentConnection = currentConnections[0] || null;

        // Format network list
        const formattedNetworks = networks.map(network => {
          // Calculate signal properly from quality or signal_level
          let signal = 0;
          if (network.quality !== undefined && network.quality !== null) {
            signal = Math.max(0, Math.min(100, network.quality));
          } else if (network.signal_level !== undefined && network.signal_level !== null) {
            // signal_level is typically in dBm (negative), convert to percentage
            const rssi = parseInt(network.signal_level);
            if (!isNaN(rssi) && rssi < 0) {
              signal = Math.max(0, Math.min(100, 2 * (rssi + 100)));
            }
          }
          
          return {
            ssid: network.ssid,
            bssid: network.bssid,
            signal: signal,
            security: network.security || 'Unknown',
            channel: network.channel || 0,
            frequency: network.frequency || 0,
            isConnected: this.currentConnection && this.currentConnection.ssid === network.ssid
          };
        });

        // Sort by signal strength
        formattedNetworks.sort((a, b) => b.signal - a.signal);

        console.log(`✅ Found ${formattedNetworks.length} networks via node-wifi`);
        
        return {
          success: true,
          networks: formattedNetworks,
          currentNetwork: this.currentConnection ? this.currentConnection.ssid : null,
          method: 'node-wifi'
        };
      } catch (nodeWifiError) {
        // If both fail, return helpful error
        if (process.platform === 'darwin') {
          throw new Error(
            'WiFi scanning failed. macOS requires Location Services permission. ' +
            'Please enable it in: System Preferences > Security & Privacy > Location Services > Enable Location Services'
          );
        }
        throw new Error(`Failed to scan WiFi networks: ${nodeWifiError.message}`);
      }
    } catch (error) {
      console.error('❌ WiFi scan error:', error.message);
      throw error;
    }
  }

  /**
   * Get current WiFi connection
   */
  async getCurrentConnection() {
    try {
      const connections = await wifi.getCurrentConnections();
      return connections[0] || null;
    } catch (error) {
      console.error('❌ Error getting current connection:', error.message);
      return null;
    }
  }

  /**
   * Connect to a WiFi network
   */
  async connect(ssid, password) {
    try {
      console.log(`🔌 Connecting to ${ssid}...`);
      
      await wifi.connect({ ssid, password });
      
      // Wait for connection to establish
      await this.waitForConnection(ssid, 30000); // 30 second timeout
      
      console.log(`✅ Connected to ${ssid}`);
      
      return {
        success: true,
        message: `Connected to ${ssid}`,
        ssid: ssid
      };
    } catch (error) {
      console.error(`❌ Connection failed: ${error.message}`);
      throw new Error(`Failed to connect to ${ssid}: ${error.message}`);
    }
  }

  /**
   * Wait for WiFi connection to establish
   */
  async waitForConnection(ssid, timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const current = await this.getCurrentConnection();
      
      if (current && current.ssid === ssid) {
        return true;
      }
      
      // Wait 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Connection timeout');
  }

  /**
   * Disconnect from current WiFi network
   */
  async disconnect() {
    try {
      await wifi.disconnect();
      console.log('🔌 Disconnected from WiFi');
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to disconnect: ${error.message}`);
    }
  }

  /**
   * Get system network information
   */
  getSystemInfo() {
    const interfaces = os.networkInterfaces();
    const info = {};

    for (const [name, details] of Object.entries(interfaces)) {
      info[name] = details
        .filter(detail => detail.family === 'IPv4')
        .map(detail => ({
          address: detail.address,
          netmask: detail.netmask,
          mac: detail.mac
        }));
    }

    return info;
  }
}

module.exports = WiFiScanner;