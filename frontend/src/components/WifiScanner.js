/**
 * WiFi Scanner Component
 * Displays available networks and handles connection
 */
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Loader, Signal } from 'lucide-react';
import { scanWiFiNetworks, analyzeNetwork } from '../utils/api';

function WifiScanner({ onAnalyze, loading }) {
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [password, setPassword] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Get current network on component mount
  useEffect(() => {
    getCurrentNetwork();
  }, []);

  /**
   * Get current connected WiFi network
   */
  const getCurrentNetwork = async () => {
    setScanning(true);
    setError(null);

    try {
      const data = await scanWiFiNetworks();

      if (data.success) {
        // Find the currently connected network
        const connected = data.networks.find(n => n.isConnected);
        
        if (connected) {
          setSelectedNetwork(connected);
        } else if (data.currentNetwork) {
          // If we have current network name but not in list, create a network object
          const currentNet = {
            ssid: data.currentNetwork,
            bssid: 'N/A',
            signal: 0,
            security: 'Unknown',
            channel: 0,
            frequency: 0,
            isConnected: true
          };
          setSelectedNetwork(currentNet);
        } else {
          setError('Not connected to any WiFi network');
        }
      } else {
        setError(data.error || 'Failed to get current network');
      }
    } catch (err) {
      setError(err.message || 'Failed to get current network. Make sure backend is running.');
    } finally {
      setScanning(false);
    }
  };


  /**
   * Handle analyze button click
   */
  const handleAnalyze = async () => {
    if (!selectedNetwork) {
      setError('No network selected');
      return;
    }

    const targetSSID = selectedNetwork.ssid;

    // Check if network requires password
    if (selectedNetwork.security !== 'Open' && !password && !selectedNetwork.isConnected) {
      setError('This network requires a password');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      // Call the analyze endpoint which will:
      // 1. Connect to WiFi (if not already connected)
      // 2. Detect router gateway
      // 3. Fetch router configuration via SSH/OpenWRT
      // 4. Analyze the configuration
      const result = await analyzeNetwork(targetSSID, password || '');

      if (result.success && onAnalyze) {
        // Pass the analysis result to parent component
        onAnalyze(result);
      } else {
        setError(result.error || 'Analysis failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze network');
    } finally {
      setAnalyzing(false);
    }
  };

  /**
   * Get signal strength icon
   */
  const getSignalIcon = (signal) => {
    if (!signal || signal === 0) return <Signal className="h-5 w-5 text-gray-400" />;
    if (signal >= 80) return <Signal className="h-5 w-5 text-green-600" />;
    if (signal >= 60) return <Signal className="h-5 w-5 text-yellow-600" />;
    if (signal >= 40) return <Signal className="h-5 w-5 text-orange-600" />;
    return <Signal className="h-5 w-5 text-red-600" />;
  };

  /**
   * Get signal strength text
   */
  const getSignalText = (signal) => {
    if (!signal || signal === 0) return 'Unknown';
    if (signal >= 80) return 'Excellent';
    if (signal >= 60) return 'Good';
    if (signal >= 40) return 'Fair';
    return 'Weak';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          📡 Current WiFi Network
        </h2>
      </div>

      {/* Current Connection Info */}
      {selectedNetwork && selectedNetwork.isConnected && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Wifi className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Connected to: <strong>{selectedNetwork.ssid}</strong>
                </p>
                {selectedNetwork.signal > 0 && (
                  <p className="text-xs text-green-700 mt-1">
                    Signal: {selectedNetwork.signal}% ({getSignalText(selectedNetwork.signal)})
                  </p>
                )}
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium">
              Connected
            </span>
          </div>
        </div>
      )}


      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <WifiOff className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Scanning State */}
      {scanning && !selectedNetwork && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader className="h-12 w-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">Detecting current network...</p>
        </div>
      )}

      {/* No Network Connected */}
      {!scanning && !selectedNetwork && !error && (
        <div className="text-center py-8">
          <WifiOff className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Not connected to any WiFi network</p>
          <p className="text-sm text-gray-500">Please connect to a WiFi network first</p>
        </div>
      )}

      {/* Password Input - Only show if network is selected */}
      {selectedNetwork && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            WiFi Password:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            onKeyPress={(e) => {
              // Auto-analyze when Enter is pressed
              if (e.key === 'Enter' && !analyzing && !loading) {
                handleAnalyze();
              }
            }}
            onBlur={() => {
              // Auto-analyze when password field loses focus (if password is entered)
              if (password && password.length > 0 && !analyzing && !loading) {
                // Small delay to allow user to see what happened
                setTimeout(() => {
                  handleAnalyze();
                }, 500);
              }
            }}
            placeholder={selectedNetwork.security === 'Open' ? "Open network - no password needed (press Enter to analyze)" : "Enter WiFi password (press Enter to analyze)"}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            {selectedNetwork.security === 'Open' 
              ? "This network is open (no password required). Press Enter to analyze."
              : "Enter the password for this network and press Enter to analyze automatically"
            }
          </p>
        </div>
      )}

      {/* Analyze Button - Always show when network is selected */}
      {selectedNetwork && (
        <div className="flex justify-center">
          <button
            onClick={handleAnalyze}
            disabled={!selectedNetwork || loading || analyzing}
            className={`px-8 py-3 rounded-lg font-semibold text-lg transition-colors ${
              !selectedNetwork || loading || analyzing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {(loading || analyzing) ? (
              <span className="flex items-center">
                <Loader className="animate-spin h-5 w-5 mr-2" />
                {analyzing ? 'Connecting & Analyzing...' : 'Analyzing Network...'}
              </span>
            ) : (
              '🔍 Analyze Router Configuration'
            )}
          </button>
        </div>
      )}

      {/* Show analyzing status when auto-analyzing */}
      {analyzing && (
        <div className="flex justify-center items-center py-4">
          <Loader className="animate-spin h-6 w-6 text-blue-600 mr-3" />
          <span className="text-lg font-medium text-gray-700">Connecting & Analyzing Router Configuration...</span>
        </div>
      )}

    </div>
  );
}

export default WifiScanner;