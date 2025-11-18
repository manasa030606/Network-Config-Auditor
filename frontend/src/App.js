/**
 * Main App Component - Dynamic WiFi Scanner
 */
import React, { useState, useEffect } from 'react';
import WifiScanner from './components/WifiScanner';
import AnalysisResults from './components/AnalysisResults';
import { checkServerHealth } from './utils/api';

function App() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serverOnline, setServerOnline] = useState(true);

  // Check backend server status
  useEffect(() => {
    const checkServer = async () => {
      const isOnline = await checkServerHealth();
      setServerOnline(isOnline);
      
      if (!isOnline) {
        setError('⚠️ Backend server is not running. Please start: cd backend && npm start');
      }
    };
    checkServer();
  }, []);

  /**
   * Handle WiFi network analysis
   */
  const handleAnalyze = (result) => {
    try {
      setLoading(false); // WifiScanner handles its own loading state
      setError(null);

      console.log('Analysis result received:', result);

      if (result.success) {
        setAnalysis({
          ...result,
          filename: `${result.network?.ssid || 'Network'} - Router Analysis`
        });
      } else {
        setError(result.error || 'Analysis failed');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  /**
   * Reset and scan again
   */
  const handleReset = () => {
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🔒 Network Security Auditor
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Scan WiFi networks, connect, and analyze router configurations dynamically
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${serverOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {serverOnline ? 'Server Online' : 'Server Offline'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className={`rounded-lg p-4 mb-6 ${
            error.includes('demo') 
              ? 'bg-yellow-50 border border-yellow-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className={`h-5 w-5 ${error.includes('demo') ? 'text-yellow-400' : 'text-red-400'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${error.includes('demo') ? 'text-yellow-800' : 'text-red-800'}`}>
                  {error.includes('demo') ? 'Demo Mode' : 'Error'}
                </h3>
                <div className={`mt-2 text-sm ${error.includes('demo') ? 'text-yellow-700' : 'text-red-700'}`}>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WiFi Scanner */}
        {!analysis && (
          <WifiScanner 
            onAnalyze={handleAnalyze} 
            loading={loading}
          />
        )}

        {/* Analysis Results */}
        {analysis && (
          <div>
            {/* Results Header */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Security Analysis Results</h2>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Network:</span> {analysis.network?.ssid}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Router Gateway:</span> {analysis.network?.gateway}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Analysis Time:</span> {analysis.analysisTime}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                  🔄 Scan Again
                </button>
              </div>
            </div>


            {/* Analysis Display */}
            <AnalysisResults analysis={analysis} />
          </div>
        )}

        {/* Features Grid - Shown when no analysis */}
        {!analysis && !loading && (
          <div className="mt-12">
            <h3 className="text-xl font-bold text-gray-900 text-center mb-8">
              How It Works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📡</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">1. Scan WiFi Networks</h4>
                <p className="text-sm text-gray-600">
                  Click refresh to scan for all available WiFi networks in your area
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔐</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">2. Select & Connect</h4>
                <p className="text-sm text-gray-600">
                  Select a WiFi network, enter password if required, and connect
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🌐</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">3. Fetch Router Config</h4>
                <p className="text-sm text-gray-600">
                  Automatically detects router gateway and fetches configuration via SSH/OpenWRT
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔍</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">4. Analyze Security</h4>
                <p className="text-sm text-gray-600">
                  Scans for vulnerabilities and provides detailed security analysis
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600">
            Network Security Auditor | Computer Networks Project
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;