# API Documentation

## Base URL

```
http://localhost:5003
```

## Endpoints

### 1. Root Endpoint

Check if API server is running.

**Endpoint:** `GET /`

**Request:**
```bash
curl http://localhost:5003/
```

**Response:**
```json
{
  "message": "Secure Network Configuration Auditor API",
  "status": "running",
  "version": "1.0.0",
  "endpoints": [
    "GET  /",
    "POST /api/analyze"
  ]
}
```

**Status Codes:**
- `200 OK` - Server is running

---

### 2. Analyze Configuration File

Upload and analyze a network configuration file.

**Endpoint:** `POST /api/analyze`

**Request:**

Headers:
```
Content-Type: multipart/form-data
```

Body (FormData):
```
configFile: <file.txt>
```

**Example using curl:**
```bash
curl -X POST http://localhost:5003/api/analyze \
  -F "configFile=@router-config-1.txt"
```

**Example using JavaScript (Axios):**
```javascript
const formData = new FormData();
formData.append('configFile', file);

const response = await axios.post(
  'http://localhost:5003/api/analyze',
  formData,
  {
    headers: { 'Content-Type': 'multipart/form-data' }
  }
);
```

**Success Response:**
```json
{
  "success": true,
  "filename": "router-config-1.txt",
  "fileSize": 1245,
  "analysisTime": "15ms",
  "timestamp": "2025-11-01T10:30:45.123Z",
  "analysis": {
    "totalIssues": 7,
    "critical": 3,
    "high": 2,
    "medium": 2,
    "low": 0,
    "securityScore": 35,
    "issues": [
      {
        "severity": "CRITICAL",
        "category": "Weak Authentication",
        "title": "Weak password detected: \"cisco\"",
        "description": "Line 12: Found weak or default password \"cisco\"...",
        "location": "Line 12",
        "recommendation": "Use a strong password with at least 12 characters...",
        "cve": "CWE-521"
      }
    ],
    "recommendations": [
      "🔴 URGENT: Address all critical vulnerabilities immediately...",
      "🟠 HIGH PRIORITY: Fix high-severity issues as soon as possible...",
      "⚠️ Overall security posture is poor..."
    ],
    "configSummary": {
      "totalInterfaces": 4,
      "totalVTYLines": 1,
      "totalACLs": 0
    }
  }
}
```

**Error Responses:**

400 Bad Request:
```json
{
  "success": false,
  "error": "No configuration file provided. Please upload a .txt file."
}
```

```json
{
  "success": false,
  "error": "Configuration file is empty."
}
```

```json
{
  "success": false,
  "error": "File too large. Maximum size is 10MB."
}
```

500 Internal Server Error:
```json
{
  "success": false,
  "error": "Failed to analyze configuration file.",
  "details": "Error message details"
}
```

**Status Codes:**
- `200 OK` - Analysis completed successfully
- `400 Bad Request` - Invalid file or request
- `500 Internal Server Error` - Server-side error

---

### 3. Analyze Configuration Text

Analyze configuration text directly without file upload.

**Endpoint:** `POST /api/analyze-text`

**Request:**

Headers:
```
Content-Type: application/json
```

Body (JSON):
```json
{
  "configText": "interface GigabitEthernet0/1\n ip address 192.168.1.1 255.255.255.0\n no shutdown\n!\nline vty 0 4\n password cisco\n transport input telnet\n login\n!\nend"
}
```

**Example using curl:**
```bash
curl -X POST http://localhost:5003/api/analyze-text \
  -H "Content-Type: application/json" \
  -d '{"configText": "line vty 0 4\n password cisco\n!"}'
```

**Example using JavaScript:**
```javascript
const response = await axios.post(
  'http://localhost:5003/api/analyze-text',
  { configText: configurationText },
  {
    headers: { 'Content-Type': 'application/json' }
  }
);
```

**Success Response:**

Same format as `/api/analyze`, but with `textLength` instead of `filename` and `fileSize`:

```json
{
  "success": true,
  "textLength": 1234,
  "analysisTime": "12ms",
  "timestamp": "2025-11-01T10:30:45.123Z",
  "analysis": { ... }
}
```

**Error Responses:**

400 Bad Request:
```json
{
  "success": false,
  "error": "No configuration text provided."
}
```

```json
{
  "success": false,
  "error": "Configuration text is empty."
}
```

**Status Codes:**
- `200 OK` - Analysis completed successfully
- `400 Bad Request` - Invalid request
- `500 Internal Server Error` - Server-side error

---

### 4. Health Check

Check API health status.

**Endpoint:** `GET /api/health`

**Request:**
```bash
curl http://localhost:5003/api/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "Network Configuration Auditor",
  "timestamp": "2025-11-01T10:30:45.123Z"
}
```

**Status Codes:**
- `200 OK` - Service is healthy

---

## Data Models

### Issue Object

```typescript
{
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  category: string,
  title: string,
  description: string,
  location: string,
  recommendation: string,
  cve: string  // Common Weakness Enumeration ID
}
```

### Analysis Object

```typescript
{
  totalIssues: number,
  critical: number,
  high: number,
  medium: number,
  low: number,
  securityScore: number,  // 0-100
  issues: Issue[],
  recommendations: string[],
  configSummary: {
    totalInterfaces: number,
    totalVTYLines: number,
    totalACLs: number
  }
}
```

## Security Checks Performed

The analyzer detects the following security issues:

### 1. Weak Passwords
- Default passwords (cisco, admin, password, etc.)
- Short passwords (< 8 characters)
- Plain text passwords
- Unencrypted enable passwords

### 2. Insecure Services
- Telnet enabled (port 23)
- FTP enabled (port 21)
- HTTP enabled (port 80)
- Mixed transport protocols

### 3. Access Control Issues
- Missing access-class on VTY lines
- Missing ACLs on active interfaces
- No input/output filtering

### 4. Unused Resources
- Shutdown interfaces
- Unconfigured interfaces

### 5. Best Practices
- SSH not configured
- No login banner
- Logging not enabled
- Password encryption disabled
- No NTP configuration

## Severity Levels

### CRITICAL
- Immediate security risks
- Default passwords
- Telnet enabled
- Plain text credentials
- **Deduction:** -15 points per issue

### HIGH
- Important security issues
- Missing ACLs
- Insecure services
- Weak configurations
- **Deduction:** -10 points per issue

### MEDIUM
- Configuration improvements
- Missing logging
- No password encryption
- Suboptimal settings
- **Deduction:** -5 points per issue

### LOW
- Minor recommendations
- Unused interfaces
- Missing banners
- Optimization suggestions
- **Deduction:** -2 points per issue

## Security Score Calculation

```
Security Score = 100 - (Critical × 15 + High × 10 + Medium × 5 + Low × 2)
Minimum Score = 0
Maximum Score = 100
```

**Rating Scale:**
- 90-100: Excellent
- 75-89: Good
- 50-74: Fair
- 25-49: Poor
- 0-24: Critical

## Rate Limiting

Currently no rate limiting implemented (Milestone 2).

Planned for production:
- 100 requests per hour per IP
- 429 Too Many Requests response

## Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Optional detailed error information"
}
```

## CORS Configuration

CORS is enabled for all origins in development:

```javascript
app.use(cors());
```

Production will restrict to specific origins.

## File Upload Limits

- **Max file size:** 10 MB
- **Accepted types:** .txt
- **Encoding:** UTF-8

## Testing the API

### Using curl

```bash
# Test server status
curl http://localhost:5003/

# Test file upload
curl -X POST http://localhost:5003/api/analyze \
  -F "configFile=@sample-configs/router-config-1.txt"

# Test text analysis
curl -X POST http://localhost:5003/api/analyze-text \
  -H "Content-Type: application/json" \
  -d '{"configText":"line vty 0 4\npassword cisco\n!"}'

# Test health check
curl http://localhost:5003/api/health
```

### Using Postman

1. Import collection with endpoints
2. Set base URL to `http://localhost:5003`
3. Test each endpoint with sample data

### Using Frontend

Frontend automatically calls these APIs:
- Server health check on load
- File analysis on upload
- Error handling for all responses

## API Versioning

Current version: **v1.0**

Future versions will use URL versioning:
```
/api/v2/analyze
```

## Authentication

**Milestone 2:** No authentication required

**Future Milestones:** 
- JWT token authentication
- API key support
- User session management

## WebSocket Support

Not implemented in Milestone 2.

Planned for real-time updates in future milestones.

---

**Document Version**: 1.0  
**Last Updated**: November 1, 2025  
**Authors**: Kalash Kumari Thakur, Manasa Chinnam