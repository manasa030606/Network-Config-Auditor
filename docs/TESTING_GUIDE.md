# Testing Guide

Comprehensive testing procedures for the Secure Network Configuration Auditor.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Testing](#backend-testing)
3. [Frontend Testing](#frontend-testing)
4. [Integration Testing](#integration-testing)
5. [Test Cases](#test-cases)
6. [Expected Results](#expected-results)

---

## Prerequisites

Before testing, ensure:

✅ Node.js installed (v14+)  
✅ Backend dependencies installed (`cd backend && npm install`)  
✅ Frontend dependencies installed (`cd frontend && npm install`)  
✅ Sample configuration files available in `sample-configs/`

---

## Backend Testing

### 1. Start the Backend Server

```bash
cd backend
npm start
```

Expected output:
```
✅ Backend server running on http://localhost:5003
📁 Ready to analyze configurations
```

### 2. Test Server Health

#### Using Browser:
Navigate to: `http://localhost:5003/`

#### Using curl:
```bash
curl http://localhost:5003/
```

**Expected Response:**
```json
{
  "message": "Secure Network Configuration Auditor API",
  "status": "running",
  "version": "1.0.0",
  "endpoints": [...]
}
```

### 3. Test File Analysis API

```bash
cd sample-configs

# Test with vulnerable config
curl -X POST http://localhost:5003/api/analyze \
  -F "configFile=@router-config-1.txt"

# Test with secure config
curl -X POST http://localhost:5003/api/analyze \
  -F "configFile=@secure-config.txt"
```

### 4. Test Text Analysis API

```bash
curl -X POST http://localhost:5003/api/analyze-text \
  -H "Content-Type: application/json" \
  -d '{
    "configText": "line vty 0 4\n password cisco\n transport input telnet\n login\n!"
  }'
```

### 5. Test Error Handling

**Empty file test:**
```bash
echo "" > empty.txt
curl -X POST http://localhost:5003/api/analyze \
  -F "configFile=@empty.txt"
```

**Expected:** 400 error with message "Configuration file is empty"

**No file test:**
```bash
curl -X POST http://localhost:5003/api/analyze
```

**Expected:** 400 error with message "No configuration file provided"

---

## Frontend Testing

### 1. Start the Frontend

```bash
cd frontend
npm start
```

Browser should automatically open to `http://localhost:3000`

### 2. Visual Testing

#### Header Check:
- ✅ "Secure Network Configuration Auditor" title visible
- ✅ Status indicator shows "Online" (green dot)
- ✅ Project info banner displays authors' names

#### File Upload Section:
- ✅ Upload area visible with drag-drop zone
- ✅ "Browse Files" button functional
- ✅ Sample files info section present
- ✅ Security checks list displayed

#### Features Section:
- ✅ Three feature cards displayed
- ✅ Icons and descriptions visible
- ✅ Proper spacing and layout

### 3. Functional Testing

#### Test File Upload:

1. **Click Browse:**
   - Click "Browse Files"
   - Select `sample-configs/router-config-1.txt`
   - File name should appear
   - File size should display

2. **Drag and Drop:**
   - Drag a .txt file to the upload zone
   - Zone should highlight on hover
   - File should be accepted

3. **File Validation:**
   - Try uploading a .pdf file
   - Should show error: "Please upload a .txt file"

#### Test Analysis:

1. Upload `router-config-1.txt`
2. Click "Analyze Configuration"
3. Loading spinner should appear
4. Results should display within 2 seconds

#### Test Results Display:

- ✅ Security score shown with progress bar
- ✅ Issue counts displayed (Critical, High, Medium, Low)
- ✅ Issues list with severity badges
- ✅ Recommendations section visible
- ✅ Configuration summary present

#### Test Filtering:

1. Click severity filter buttons (ALL, CRITICAL, HIGH, etc.)
2. Issues list should filter accordingly
3. Count should update

#### Test Reset:

1. Click "Analyze Another File"
2. Results should clear
3. Upload section should reappear

---

## Integration Testing

### End-to-End Test Flow

```
User Action          → Expected Behavior
─────────────────────────────────────────────
1. Open browser      → App loads successfully
2. Check status      → Green "Online" indicator
3. Upload file       → File name displayed
4. Click analyze     → Loading spinner shows
5. Wait              → Results appear (< 3 sec)
6. View results      → All sections populated
7. Filter issues     → List updates correctly
8. Reset             → Returns to upload screen
```

### Backend-Frontend Communication Test

1. **Start backend first:**
   ```bash
   cd backend && npm start
   ```

2. **Then start frontend:**
   ```bash
   cd frontend && npm start
   ```

3. **Verify connection:**
   - Status should show "Online"
   - Upload and analyze should work
   - No CORS errors in browser console

4. **Stop backend:**
   ```bash
   # Stop the backend server (Ctrl+C)
   ```

5. **Refresh frontend:**
   - Status should show "Offline"
   - Upload should be disabled
   - Error message should display

---

## Test Cases

### Test Case 1: Vulnerable Configuration

**File:** `router-config-1.txt`

**Expected Results:**
- Total Issues: 7-10
- Critical: 3-4
- High: 2-3
- Security Score: 30-40
- Key Issues:
  - Weak password "cisco"
  - Telnet enabled
  - No ACLs
  - No logging

### Test Case 2: Moderate Security Configuration

**File:** `router-config-2.txt`

**Expected Results:**
- Total Issues: 2-4
- Critical: 0
- High: 1-2
- Security Score: 70-80
- Key Issues:
  - Minor ACL recommendations
  - Some best practice warnings

### Test Case 3: Secure Configuration

**File:** `secure-config.txt`

**Expected Results:**
- Total Issues: 0-2
- Critical: 0
- High: 0
- Security Score: 90-100
- Key Issues:
  - Minimal or no critical issues
  - Possibly minor recommendations

### Test Case 4: Switch Configuration

**File:** `switch-config-1.txt`

**Expected Results:**
- Total Issues: 5-8
- Critical: 2-3
- High: 1-2
- Security Score: 40-50
- Key Issues:
  - Weak passwords
  - Transport input all
  - Missing security features

---

## Expected Results

### Performance Metrics

| Metric | Expected Value |
|--------|---------------|
| Backend startup time | < 2 seconds |
| Frontend load time | < 3 seconds |
| Analysis time | 10-50ms |
| API response time | < 100ms |
| File upload time | < 1 second |
| Results display time | Immediate |

### Accuracy Metrics

**Detection Rate:**
- Weak passwords: 100%
- Insecure services: 100%
- Missing ACLs: 95%+
- Unused interfaces: 100%
- Best practices: 90%+

**False Positives:**
- Target: < 5%
- Issues flagged incorrectly

**False Negatives:**
- Target: < 10%
- Issues missed

---

## Browser Compatibility Testing

Test in the following browsers:

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

**Expected:** Consistent behavior across all browsers

---

## Responsive Design Testing

Test at different screen sizes:

- Desktop (1920x1080)
- Laptop (1366x768)
- Tablet (768x1024)
- Mobile (375x667)

**Expected:** Layout adapts properly at all sizes

---

## Error Scenario Testing

### Scenario 1: Backend Offline
- Stop backend server
- Try to analyze file
- **Expected:** Error message displayed

### Scenario 2: Invalid File
- Upload non-.txt file
- **Expected:** Validation error

### Scenario 3: Large File
- Upload file > 10MB
- **Expected:** Size limit error

### Scenario 4: Empty File
- Upload empty .txt file
- **Expected:** Empty file error

### Scenario 5: Network Error
- Simulate network failure
- **Expected:** Connection error message

---

## Automated Testing (Future)

### Backend Unit Tests
```bash
cd backend
npm test
```

### Frontend Unit Tests
```bash
cd frontend
npm test
```

### End-to-End Tests
```bash
npm run e2e
```

*Note: Automated tests will be implemented in Milestone 3*

---

## Bug Reporting

If you find issues during testing:

1. Note the exact steps to reproduce
2. Record expected vs actual behavior
3. Take screenshots if applicable
4. Check browser console for errors
5. Document environment details:
   - OS version
   - Browser version
   - Node.js version

---

## Test Checklist

### Backend
- [ ] Server starts without errors
- [ ] Root endpoint responds
- [ ] File upload works
- [ ] Analysis returns results
- [ ] Error handling works
- [ ] CORS allows frontend

### Frontend
- [ ] App loads successfully
- [ ] Status indicator works
- [ ] File upload functional
- [ ] Drag-drop works
- [ ] Analysis triggers
- [ ] Results display correctly
- [ ] Filtering works
- [ ] Reset works

### Integration
- [ ] Frontend connects to backend
- [ ] Files upload successfully
- [ ] Analysis completes
- [ ] Results display properly
- [ ] Error messages show correctly
- [ ] No console errors

### User Experience
- [ ] Interface is intuitive
- [ ] Loading states are clear
- [ ] Error messages are helpful
- [ ] Results are easy to read
- [ ] Navigation is smooth

---

## Known Issues (Milestone 2)

1. **Limited file format support** - Only .txt files
2. **No history tracking** - Analysis not saved
3. **Basic visualization** - Charts pending Milestone 3
4. **No export feature** - Cannot download reports

These will be addressed in upcoming milestones.

---

**Document Version**: 1.0  
**Last Updated**: November 1, 2025  
**Authors**: Kalash Kumari Thakur, Manasa Chinnam