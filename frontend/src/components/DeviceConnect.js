import React, { useState } from 'react';
import { Wifi, WifiOff, Loader } from 'lucide-react';

function DeviceConnect({ onAnalyze, loading, disabled }) {
  const [deviceInfo, setDeviceInfo] = useState({
    type: 'cisco',
    host: '',
    port: '22',
    username: '',
    password: '',
    protocol: 'ssh'
  });

  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  const deviceTypes = [
    { value: 'cisco', label: 'Cisco IOS Router/Switch' },
    { value: 'openwrt', label: 'OpenWRT Router' },
    { value: 'pfsense', label: 'pfSense Firewall' },
    { value: 'mikrotik', label: 'MikroTik Router' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDeviceInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);

    try {
      const response = await fetch('http://localhost:5003/api/devices/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceInfo)
      });

      const result = await response.json();
      setConnectionStatus(result);
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: 'Failed to test connection: ' + error.message
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleAnalyze = () => {
    if (onAnalyze) {
      onAnalyze(deviceInfo);
    }
  };

  const isFormValid = deviceInfo.host && deviceInfo.username && deviceInfo.password;

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        🌐 Connect to Live Device
      </h2>

      <div className="space-y-4">
        {/* Device Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Device Type
          </label>
          <select
            name="type"
            value={deviceInfo.type}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {deviceTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Protocol */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Connection Protocol
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="protocol"
                value="ssh"
                checked={deviceInfo.protocol === 'ssh'}
                onChange={handleChange}
                className="mr-2"
              />
              SSH
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="protocol"
                value="api"
                checked={deviceInfo.protocol === 'api'}
                onChange={handleChange}
                className="mr-2"
              />
              REST API
            </label>
          </div>
        </div>

        {/* Host */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Device IP Address or Hostname
          </label>
          <input
            type="text"
            name="host"
            value={deviceInfo.host}
            onChange={handleChange}
            placeholder="192.168.1.1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Port */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Port
          </label>
          <input
            type="number"
            name="port"
            value={deviceInfo.port}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <input
            type="text"
            name="username"
            value={deviceInfo.username}
            onChange={handleChange}
            placeholder="admin"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={deviceInfo.password}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Connection Status */}
        {connectionStatus && (
          <div className={`p-4 rounded-lg ${
            connectionStatus.success 
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center">
              {connectionStatus.success ? (
                <Wifi className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-600 mr-2" />
              )}
              <p className={`text-sm ${
                connectionStatus.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {connectionStatus.message}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4 mt-6">
          <button
            onClick={handleTestConnection}
            disabled={!isFormValid || testingConnection || disabled}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
              !isFormValid || testingConnection || disabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {testingConnection ? (
              <span className="flex items-center justify-center">
                <Loader className="animate-spin h-5 w-5 mr-2" />
                Testing...
              </span>
            ) : (
              '🔍 Test Connection'
            )}
          </button>

          <button
            onClick={handleAnalyze}
            disabled={!isFormValid || loading || disabled}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
              !isFormValid || loading || disabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <Loader className="animate-spin h-5 w-5 mr-2" />
                Analyzing...
              </span>
            ) : (
              '🔒 Connect & Analyze'
            )}
          </button>
        </div>
      </div>

      {/* Security Warning */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-yellow-900 mb-2">
          🔐 Security Notice
        </h4>
        <ul className="text-xs text-yellow-800 space-y-1">
          <li>• Credentials are transmitted securely and not stored</li>
          <li>• Use read-only credentials when possible</li>
          <li>• Ensure device allows SSH/API access from your IP</li>
          <li>• Check firewall rules if connection fails</li>
        </ul>
      </div>
    </div>
  );
}

export default DeviceConnect;