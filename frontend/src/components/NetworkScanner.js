/**
 * Network Scanner Component - FIXED VERSION
 * Always shows network info, even with errors
 */
import React, { useState, useEffect } from 'react';
import { Wifi, Loader, AlertCircle, CheckCircle } from 'lucide-react';

function NetworkScanner({ onScan, loading }) {
  const [networkInfo, setNetworkInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchNetworkInfo();
  }, [retryCount]);

  /**
   * Fetch current network information
   */
  const fetchNetworkInfo = async () => {
    setLoadingInfo(true);
    setError(null);

    try {
      console.log('Fetching network info...');
      const response = await fetch('http://localhost:5003/api/scan/info', {
        timeout: 5000
      });
      
      if (!response.ok) {
        throw new Error('Server returned error');
      }

      const data = await response.json();
      console.log('Network info received:', data);

      if (data.success) {
        setNetworkInfo(data);
        setError(null);
      } else {
        // Show default info even if detection failed
        setNetworkInfo({
          ssid: 'Home Network',
          gateway: '192.168.1.1'
        });
        setError('Could not auto-detect. Using default values.');
      }
    } catch (err) {
      console.error('Network info error:', err);
      
      // Show default network info instead of failing
      setNetworkInfo({
        ssid: 'Home Network',
        gateway: '192.168.1.1'
      });
      setError('Backend not responding. Using default network settings.');
    } finally {
      setLoadingInfo(false);
    }
  };

  /**
   * Retry fetching network info
   */
  const handleRetry = () => {
    setRetryCount(retryCount + 1);
  };

  /**
   * Handle scan button click
   */
  const handleScan = () => {
    if (onScan) {
      onScan();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4">
          <Wifi className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Network Security Scanner
        </h2>
        <p className="text-gray-600 text-lg">
          Analyze your router's security configuration
        </p>
      </div>

      {/* Current Network Info */}
      {loadingInfo ? (
        <div className="bg-gray-50 rounded-lg p-8 mb-6 text-center">
          <Loader className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600">Detecting your network...</p>
        </div>
      ) : (
        <>
          {/* Network Info Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-blue-900 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Your Network Connection
              </h3>
              <button
                onClick={handleRetry}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                🔄 Refresh
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="bg-white rounded-lg px-4 py-3 flex items-center justify-between shadow-sm">
                <span className="text-sm text-gray-600 font-medium">Network Name</span>
                <span className="font-bold text-gray-900 text-lg">{networkInfo?.ssid || 'Loading...'}</span>
              </div>
              <div className="bg-white rounded-lg px-4 py-3 flex items-center justify-between shadow-sm">
                <span className="text-sm text-gray-600 font-medium">Router Gateway</span>
                <span className="font-mono text-sm text-gray-900 font-semibold">{networkInfo?.gateway || 'Loading...'}</span>
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-yellow-100 border border-yellow-300 rounded px-3 py-2">
                <p className="text-xs text-yellow-800">
                  ℹ️ {error}
                </p>
              </div>
            )}
          </div>

          {/* Scan Button */}
          <div className="text-center mb-6">
            <button
              onClick={handleScan}
              disabled={loading}
              className={`px-12 py-4 rounded-xl font-bold text-xl transition-all transform shadow-lg ${
                loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 hover:shadow-xl hover:scale-105'
              }`}
            >
              {loading ? (
                <span className="flex items-center">
                  <Loader className="animate-spin h-6 w-6 mr-3" />
                  Scanning Network...
                </span>
              ) : (
                <span className="flex items-center">
                  🔍 Scan & Analyze Security
                </span>
              )}
            </button>
          </div>

          {/* Loading Progress */}
          {loading && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
              <h4 className="text-sm font-bold text-blue-900 mb-4 text-center">
                ⚡ Analysis in Progress
              </h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
                  <span className="text-sm text-gray-700">Detecting router gateway...</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
                  <span className="text-sm text-gray-700">Attempting secure connection...</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
                  <span className="text-sm text-gray-700">Fetching router configuration...</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
                  <span className="text-sm text-gray-700">Analyzing security vulnerabilities...</span>
                </div>
              </div>
              <div className="mt-4 bg-white rounded-lg p-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                </div>
                <p className="text-xs text-center text-gray-500 mt-2">
                  This may take 10-30 seconds...
                </p>
              </div>
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
              <h4 className="text-sm font-semibold text-purple-900 mb-2 flex items-center">
                <span className="text-xl mr-2">🔍</span>
                Security Checks
              </h4>
              <ul className="text-xs text-purple-800 space-y-1">
                <li>✓ Weak password detection</li>
                <li>✓ Insecure services (Telnet, FTP)</li>
                <li>✓ Missing access controls</li>
                <li>✓ Unencrypted configurations</li>
                <li>✓ 10+ vulnerability types</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <h4 className="text-sm font-semibold text-green-900 mb-2 flex items-center">
                <span className="text-xl mr-2">📊</span>
                You'll Get
              </h4>
              <ul className="text-xs text-green-800 space-y-1">
                <li>✓ Security score (0-100)</li>
                <li>✓ Issue severity levels</li>
                <li>✓ Detailed descriptions</li>
                <li>✓ Fix recommendations</li>
                <li>✓ Configuration summary</li>
              </ul>
            </div>
          </div>

          {/* Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-1">
                  📝 How This Works
                </h4>
                <p className="text-xs text-blue-800 leading-relaxed">
                  The tool will attempt to connect to your router via SSH to fetch the actual configuration. 
                  If SSH is not available (common for home routers), a demo analysis will be shown for testing purposes. 
                  All analysis happens locally on your computer - no data is sent externally.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NetworkScanner;