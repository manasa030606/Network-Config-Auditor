/**
 * API utility functions for communicating with backend
 */

import axios from 'axios';

// Base URL for API (backend server)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003';

/**
 * Analyze a configuration file
 * @param {File} file - Configuration file to analyze
 * @returns {Promise} API response with analysis results
 */
export const analyzeConfigFile = async (file) => {
  try {
    // Create FormData to send file
    const formData = new FormData();
    formData.append('configFile', file);

    // Make POST request to /api/analyze endpoint
    const response = await axios.post(
      `${API_BASE_URL}/api/analyze`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    // Handle errors
    if (error.response) {
      // Server responded with error status
      throw new Error(error.response.data.error || 'Analysis failed');
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Unable to connect to server. Make sure backend is running on port 5003.');
    } else {
      // Something else went wrong
      throw new Error('Error analyzing file: ' + error.message);
    }
  }
};

/**
 * Analyze configuration text directly
 * @param {string} configText - Configuration text to analyze
 * @returns {Promise} API response with analysis results
 */
export const analyzeConfigText = async (configText) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/analyze-text`,
      { configText },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Analysis failed');
    } else if (error.request) {
      throw new Error('Unable to connect to server. Make sure backend is running.');
    } else {
      throw new Error('Error analyzing text: ' + error.message);
    }
  }
};

/**
 * Check if backend server is running
 * @returns {Promise<boolean>} True if server is reachable
 */
export const checkServerHealth = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/`);
    return response.data.status === 'running';
  } catch (error) {
    return false;
  }
};