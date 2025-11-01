# Backend - Secure Network Configuration Auditor

This is the backend server for the Network Configuration Auditor project.

## Features

- RESTful API for configuration analysis
- File upload support with validation
- Security vulnerability detection
- Rule-based analysis engine
- JSON response format

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Multer** - File upload middleware
- **CORS** - Cross-origin resource sharing

## Project Structure

```
backend/
├── server.js              # Main server entry point
├── package.json          # Dependencies and scripts
└── src/
    ├── services/
    │   └── analyzer.js   # Core analysis logic
    ├── routes/
    │   └── analyze.js    # API endpoints
    └── utils/
        └── helpers.js    # Utility functions
```

## Installation

```bash
npm install
```

## Running the Server

Development mode:
```bash
npm start
```

With auto-reload (requires nodemon):
```bash
npm run dev
```

## API Endpoints

### 1. Health Check
```
GET /
```

Response:
```json
{
  "message": "Secure Network Configuration Auditor API",
  "status": "running",
  "version": "1.0.0"
}
```

### 2. Analyze Configuration File
```
POST /api/analyze
Content-Type: multipart/form-data
```

Request body:
- `configFile`: Configuration file (.txt)

Response:
```json
{
  "success": true,
  "filename": "router-config-1.txt",
  "analysisTime": "15ms",
  "analysis": {
    "totalIssues": 7,
    "critical": 3,
    "high": 2,
    "medium": 2,
    "low": 0,
    "securityScore": 35,
    "issues": [...],
    "recommendations": [...]
  }
}
```

### 3. Analyze Text Directly
```
POST /api/analyze-text
Content-Type: application/json
```

Request body:
```json
{
  "configText": "interface GigabitEthernet0/1\n ip address 192.168.1.1 255.255.255.0\n..."
}
```

### 4. Health Check
```
GET /api/health
```

## Security Checks

The analyzer detects:

1. **Weak Passwords** - Default/common passwords
2. **Insecure Services** - Telnet, FTP, HTTP
3. **Missing ACLs** - No access control lists
4. **Unused Interfaces** - Inactive interfaces
5. **Best Practices** - SSH, logging, encryption

## Configuration

Default port: `5003`

To change port, set environment variable:
```bash
PORT=3001 npm start
```

## Error Handling

The API returns appropriate HTTP status codes:
- `200` - Success
- `400` - Bad request (invalid file, empty content)
- `404` - Route not found
- `500` - Server error

## Development

### Adding New Security Rules

Edit `src/services/analyzer.js`:

```javascript
function checkNewRule(lines) {
  const issues = [];
  
  // Your detection logic here
  
  return issues;
}
```

Add to main analysis function:
```javascript
const newRuleIssues = checkNewRule(lines);
allIssues.push(...newRuleIssues);
```

### Testing

Test with curl:
```bash
curl -X POST http://localhost:5003/api/analyze \
  -F "configFile=@sample-configs/router-config-1.txt"
```

## Troubleshooting

**Port already in use:**
```bash
# Find and kill process
lsof -ti:5003 | xargs kill -9
```

**Module not found:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## Authors

- Kalash Kumari Thakur (230136)
- Manasa Chinnam (230078)

## License

Educational project - Academic use only