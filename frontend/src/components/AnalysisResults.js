/**
 * AnalysisResults Component
 * Displays the analysis results from the backend
 */

import React, { useState } from 'react';

function AnalysisResults({ analysis }) {
  const [filter, setFilter] = useState('ALL'); // Filter by severity
  
  if (!analysis || !analysis.analysis) {
    return null;
  }

  const { analysis: data, filename, analysisTime, network } = analysis;
  const { totalIssues, critical, high, medium, low, securityScore, issues, recommendations, configSummary } = data;
  const isFallback = network?.isFallback || false;

  /**
   * Get color class based on severity
   */
  const getSeverityColor = (severity) => {
    const colors = {
      'CRITICAL': 'bg-red-100 text-red-800 border-red-300',
      'HIGH': 'bg-orange-100 text-orange-800 border-orange-300',
      'MEDIUM': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'LOW': 'bg-green-100 text-green-800 border-green-300'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  /**
   * Get score color based on value
   */
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    if (score >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  /**
   * Get score rating text
   */
  const getScoreRating = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 50) return 'Fair';
    if (score >= 25) return 'Poor';
    return 'Critical';
  };

  /**
   * Filter issues based on selected severity
   */
  const filteredIssues = filter === 'ALL' 
    ? issues 
    : issues.filter(issue => issue.severity === filter);

  return (
    <div className="space-y-6">
      {/* Fallback Mode Warning */}
      {isFallback && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Fallback Analysis Mode</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>⚠️ <strong>Router direct access unavailable.</strong> This analysis shows general security recommendations based on detected router information.</p>
                <p className="mt-2">To get actual router configuration analysis:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Enable SSH on your router (check router admin panel)</li>
                  <li>Ensure router web interface is accessible</li>
                  <li>Use router admin credentials (not WiFi password)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Info Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Analysis Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Filename</p>
            <p className="font-medium text-gray-900">{filename}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Analysis Time</p>
            <p className="font-medium text-gray-900">{analysisTime}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Issues</p>
            <p className="font-medium text-gray-900">{totalIssues}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Security Score</p>
            <p className={`font-bold text-2xl ${getScoreColor(securityScore)}`}>
              {securityScore}/100
            </p>
            <p className={`text-sm ${getScoreColor(securityScore)}`}>
              {getScoreRating(securityScore)}
            </p>
          </div>
        </div>

        {/* Password Strength Analysis */}
        {data.passwordAnalysis && (
          <div className={`mt-4 p-4 rounded-lg border-2 ${
            data.passwordAnalysis.strength === 'CRITICAL' ? 'bg-red-50 border-red-300' :
            data.passwordAnalysis.strength === 'WEAK' ? 'bg-orange-50 border-orange-300' :
            data.passwordAnalysis.strength === 'MODERATE' ? 'bg-yellow-50 border-yellow-300' :
            'bg-green-50 border-green-300'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  🔐 Password Strength Analysis
                </h4>
                <p className="text-sm text-gray-700">
                  Strength: <strong>{data.passwordAnalysis.strength}</strong> | 
                  Score: <strong>{data.passwordAnalysis.score}/100</strong>
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                data.passwordAnalysis.strength === 'CRITICAL' ? 'bg-red-200 text-red-800' :
                data.passwordAnalysis.strength === 'WEAK' ? 'bg-orange-200 text-orange-800' :
                data.passwordAnalysis.strength === 'MODERATE' ? 'bg-yellow-200 text-yellow-800' :
                'bg-green-200 text-green-800'
              }`}>
                {data.passwordAnalysis.strength}
              </div>
            </div>
            {data.passwordAnalysis.issues && data.passwordAnalysis.issues.length > 0 && (
              <div className="mt-3 space-y-1">
                {data.passwordAnalysis.issues.map((issue, idx) => (
                  <p key={idx} className="text-xs text-gray-600">
                    ⚠️ {issue.title}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Security Score Visualization */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Score</h3>
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${getScoreColor(securityScore)} bg-opacity-20`}>
                {getScoreRating(securityScore)}
              </span>
            </div>
            <div className="text-right">
              <span className={`text-xs font-semibold inline-block ${getScoreColor(securityScore)}`}>
                {securityScore}%
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
            <div
              style={{ width: `${securityScore}%` }}
              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${
                securityScore >= 75 ? 'bg-green-500' :
                securityScore >= 50 ? 'bg-yellow-500' :
                securityScore >= 25 ? 'bg-orange-500' : 'bg-red-500'
              }`}
            ></div>
          </div>
        </div>
      </div>

      {/* Issue Counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Critical</p>
              <p className="text-3xl font-bold text-red-700">{critical}</p>
            </div>
            <div className="text-4xl">🔴</div>
          </div>
        </div>
        <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">High</p>
              <p className="text-3xl font-bold text-orange-700">{high}</p>
            </div>
            <div className="text-4xl">🟠</div>
          </div>
        </div>
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Medium</p>
              <p className="text-3xl font-bold text-yellow-700">{medium}</p>
            </div>
            <div className="text-4xl">🟡</div>
          </div>
        </div>
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Low</p>
              <p className="text-3xl font-bold text-green-700">{low}</p>
            </div>
            <div className="text-4xl">🟢</div>
          </div>
        </div>
      </div>

      {/* Configuration Summary */}
      {configSummary && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600">Total Interfaces</p>
              <p className="text-2xl font-bold text-blue-700">{configSummary.totalInterfaces || 0}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-600">VTY Lines</p>
              <p className="text-2xl font-bold text-purple-700">{configSummary.totalVTYLines || 0}</p>
            </div>
            <div className="bg-indigo-50 rounded-lg p-4">
              <p className="text-sm text-indigo-600">Access Lists</p>
              <p className="text-2xl font-bold text-indigo-700">{configSummary.totalACLs || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Recommendations</h3>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="text-sm text-blue-800 flex items-start">
                <span className="mr-2">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Issues List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Detected Issues</h3>
          
          {/* Severity Filter */}
          <div className="flex space-x-2">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(severity => (
              <button
                key={severity}
                onClick={() => setFilter(severity)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filter === severity
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {severity}
              </button>
            ))}
          </div>
        </div>

        {/* Issues */}
        <div className="space-y-4">
          {filteredIssues.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No issues found for this filter.
            </p>
          ) : (
            filteredIssues.map((issue, index) => (
              <div
                key={index}
                className={`border-2 rounded-lg p-4 ${getSeverityColor(issue.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityColor(issue.severity)}`}>
                        {issue.severity}
                      </span>
                      <span className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-700">
                        {issue.category}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{issue.title}</h4>
                    <p className="text-sm text-gray-700 mb-2">{issue.description}</p>
                    
                    {issue.location && (
                      <p className="text-xs text-gray-600 mb-2">
                        📍 Location: {issue.location}
                      </p>
                    )}
                    
                    {issue.recommendation && (
                      <div className="mt-3 bg-white bg-opacity-50 rounded p-3">
                        <p className="text-xs font-semibold text-gray-800 mb-1">💡 Recommendation:</p>
                        <p className="text-sm text-gray-700">{issue.recommendation}</p>
                      </div>
                    )}
                    
                    {issue.cve && issue.cve !== 'N/A' && (
                      <p className="text-xs text-gray-600 mt-2">
                        🔗 Reference: {issue.cve}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default AnalysisResults;