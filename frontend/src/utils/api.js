/**
 * API utility functions - Simple network scanning
 */
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003';

/**
 * Scan current network and analyze router
 */
export const scanNetwork = async () => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/scan/network`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 seconds
      }
    );
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Network scan failed');
    } else if (error.request) {
      throw new Error('Unable to connect to server. Make sure backend is running on port 5003.');
    } else {
      throw new Error('Error scanning network: ' + error.message);
    }
  }
};

/**
 * Get current network info
 */
export const getNetworkInfo = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/scan/info`, {
      timeout: 5000
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Failed to get network info');
    } else if (error.request) {
      throw new Error('Backend server not reachable');
    } else {
      throw new Error('Error: ' + error.message);
    }
  }
};

/**
 * Check if backend server is running
 */
export const checkServerHealth = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/`, {
      timeout: 5000
    });
    return response.data.status === 'running';
  } catch (error) {
    return false;
  }
};

/**
 * Scan for available WiFi networks
 */
export const scanWiFiNetworks = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/network/scan`, {
      timeout: 30000
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Failed to scan WiFi networks');
    } else if (error.request) {
      throw new Error('Unable to connect to server. Make sure backend is running.');
    } else {
      throw new Error('Error scanning WiFi: ' + error.message);
    }
  }
};

/**
 * Connect to WiFi network and analyze router configuration
 */
export const analyzeNetwork = async (ssid, password) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/network/analyze`,
      { ssid, password },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 120000, // 2 minutes for full analysis
      }
    );
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Network analysis failed');
    } else if (error.request) {
      throw new Error('Unable to connect to server. Make sure backend is running.');
    } else {
      throw new Error('Error analyzing network: ' + error.message);
    }
  }
};