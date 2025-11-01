/**
 * ConfigInput Component
 * Handles file upload and triggers analysis
 */

import React, { useState, useRef } from 'react';

function ConfigInput({ onAnalyze, loading, disabled }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  /**
   * Handle file selection
   */
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  /**
   * Validate file and set state
   */
  const validateAndSetFile = (file) => {
    // Check file type
    if (!file.name.endsWith('.txt')) {
      alert('Please upload a .txt file');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File is too large. Maximum size is 10MB');
      return;
    }

    setSelectedFile(file);
  };

  /**
   * Handle analyze button click
   */
  const handleAnalyze = () => {
    if (selectedFile && onAnalyze) {
      onAnalyze(selectedFile);
    }
  };

  /**
   * Handle drag events for drag-and-drop functionality
   */
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  /**
   * Handle file drop
   */
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  /**
   * Trigger file input click
   */
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Clear selected file
   */
  const handleClearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Upload Configuration File
      </h2>

      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : disabled
            ? 'border-gray-200 bg-gray-50'
            : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />

        {/* Upload Icon */}
        <svg
          className={`mx-auto h-12 w-12 ${disabled ? 'text-gray-300' : 'text-gray-400'}`}
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* File Status or Instructions */}
        {selectedFile ? (
          <div className="mt-4">
            <div className="flex items-center justify-center space-x-2">
              <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
            <button
              onClick={handleClearFile}
              className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Remove file
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <p className={`text-base ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
              {disabled ? 'Backend server is offline' : 'Drag and drop your configuration file here'}
            </p>
            <p className={`text-sm ${disabled ? 'text-gray-300' : 'text-gray-500'} mt-1`}>
              or
            </p>
            <button
              onClick={handleBrowseClick}
              disabled={disabled}
              className={`mt-3 px-4 py-2 rounded-lg font-medium transition-colors ${
                disabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Browse Files
            </button>
            <p className={`text-xs ${disabled ? 'text-gray-300' : 'text-gray-500'} mt-3`}>
              Supported format: .txt (Max 10MB)
            </p>
          </div>
        )}
      </div>

      {/* Sample Files Info */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          📁 Sample Configuration Files
        </h3>
        <p className="text-sm text-blue-700">
          Sample files are available in the <code className="bg-blue-100 px-1 rounded">sample-configs/</code> folder:
        </p>
        <ul className="text-sm text-blue-700 mt-2 ml-4 list-disc">
          <li>router-config-1.txt - Configuration with multiple vulnerabilities</li>
          <li>router-config-2.txt - Moderately secure configuration</li>
          <li>switch-config-1.txt - Switch configuration example</li>
          <li>secure-config.txt - Well-configured baseline</li>
        </ul>
      </div>

      {/* Analyze Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={handleAnalyze}
          disabled={!selectedFile || loading || disabled}
          className={`px-8 py-3 rounded-lg font-semibold text-lg transition-colors ${
            !selectedFile || loading || disabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </span>
          ) : (
            '🔍 Analyze Configuration'
          )}
        </button>
      </div>

      {/* Detected Checks Info */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Security Checks Performed:</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>✓ Weak password detection</li>
            <li>✓ Insecure services (Telnet, FTP, HTTP)</li>
            <li>✓ Missing access control lists</li>
            <li>✓ Unused interfaces</li>
            <li>✓ Security best practices</li>
          </ul>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Analysis Output:</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>✓ Issue severity levels</li>
            <li>✓ Security score (0-100)</li>
            <li>✓ Detailed recommendations</li>
            <li>✓ Configuration summary</li>
            <li>✓ Remediation guidance</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ConfigInput;