# System Architecture

## Overview

The Secure Network Configuration Auditor follows a client-server architecture with clear separation between frontend and backend components.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      User Browser                        │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │         React Frontend (Port 3000)              │    │
│  │                                                 │    │
│  │  - File Upload Component                       │    │
│  │  - Analysis Results Display                    │    │
│  │  - Security Score Visualization                │    │
│  │  - Issue Filtering & Categorization            │    │
│  └────────────────────────────────────────────────┘    │
│                        │                                 │
│                        │ HTTP/HTTPS                      │
│                        │ (Axios)                         │
└────────────────────────┼─────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│             Backend Server (Port 5003)                   │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │           Express.js API Server                 │    │
│  │                                                 │    │
│  │  ┌──────────────────────────────────────┐     │    │
│  │  │        API Routes                     │     │    │
│  │  │  - POST /api/analyze                  │     │    │
│  │  │  - POST /api/analyze-text             │     │    │
│  │  │  - GET  /api/health                   │     │    │
│  │  └──────────────────────────────────────┘     │    │
│  │                    │                            │    │
│  │  ┌──────────────────────────────────────┐     │    │
│  │  │      Analysis Engine                  │     │    │
│  │  │                                        │     │    │
│  │  │  - Configuration Parser               │     │    │
│  │  │  - Security Rule Engine               │     │    │
│  │  │  - Vulnerability Detection            │     │    │
│  │  │  - Recommendation Generator           │     │    │
│  │  └──────────────────────────────────────┘     │    │
│  │                    │                            │    │
│  │  ┌──────────────────────────────────────┐     │    │
│  │  │        Utility Functions              │     │    │
│  │  │  - File validation                    │     │    │
│  │  │  - Score calculation                  │     │    │
│  │  │  - Result formatting                  │     │    │
│  │  └──────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Component Details

### Frontend (React Application)

**Technology Stack:**
- React 18.2
- Tailwind CSS
- Axios for HTTP requests

**Key Components:**

1. **App.js**
   - Main application controller
   - State management
   - Backend connectivity checking
   - Error handling

2. **ConfigInput.js**
   - File upload interface
   - Drag-and-drop support
   - File validation
   - Analysis triggering

3. **AnalysisResults.js**
   - Results visualization
   - Issue listing
   - Filtering functionality
   - Security score display

**Data Flow:**
```
User Action → ConfigInput → API Call → Backend
                                      ↓
Results Display ← App State ← API Response
```

### Backend (Node.js Server)

**Technology Stack:**
- Node.js
- Express.js
- Multer (file uploads)
- CORS

**Key Modules:**

1. **server.js**
   - Express server setup
   - Middleware configuration
   - Route registration
   - Error handling

2. **analyzer.js (Core Engine)**
   - Configuration parsing
   - Rule-based analysis
   - Security checks:
     - Weak password detection
     - Open port analysis
     - ACL validation
     - Best practice checking
   
3. **routes/analyze.js**
   - API endpoint definitions
   - Request validation
   - Response formatting

4. **utils/helpers.js**
   - Utility functions
   - Data formatting
   - Validation helpers

## Data Flow

### Analysis Request Flow

```
1. User uploads file in frontend
2. Frontend validates file (type, size)
3. File sent to backend via HTTP POST
4. Backend receives and validates file
5. Configuration text extracted
6. Analysis engine processes configuration:
   a. Parse configuration structure
   b. Apply security rules
   c. Detect vulnerabilities
   d. Calculate security score
   e. Generate recommendations
7. Results formatted as JSON
8. Response sent to frontend
9. Frontend displays results
```

### Analysis Engine Workflow

```
Configuration Text Input
         │
         ▼
┌─────────────────┐
│  Parse Config   │ ← Extract interfaces, VTY lines, ACLs
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Security Checks │
│                 │
│ • Weak Passwords│
│ • Open Ports    │
│ • Missing ACLs  │
│ • Best Practices│
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Issue Detection │ ← Categorize by severity
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Score Calculation│ ← 100 - (penalties)
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Recommendations │ ← Generate fix suggestions
└─────────────────┘
         │
         ▼
    JSON Output
```

## Security Architecture

### Input Validation
- File type checking (.txt only)
- File size limits (10MB max)
- Content validation
- Malicious input filtering

### Error Handling
- Try-catch blocks
- Graceful degradation
- User-friendly error messages
- Backend error logging

### CORS Configuration
- Allows frontend-backend communication
- Configured for localhost development
- Will need adjustment for production

## Scalability Considerations

### Current Design (Milestone 2)
- Single server instance
- In-memory processing
- No database
- Synchronous analysis

### Future Enhancements (Milestones 3-4)
- Database integration for history
- Async processing for large files
- Caching for repeated analyses
- Multiple analysis workers
- Report generation queue

## Technology Choices

### Why React?
- Component-based architecture
- Easy state management
- Large ecosystem
- Good for dashboard UIs

### Why Node.js?
- JavaScript full-stack
- Non-blocking I/O
- Large package ecosystem
- Easy to deploy

### Why Express?
- Lightweight
- Flexible routing
- Middleware support
- Well-documented

### Why Tailwind CSS?
- Utility-first approach
- Fast development
- Consistent design
- Responsive by default

## Performance Considerations

### Frontend
- Lazy loading components
- Optimized bundle size
- Minimal re-renders
- Efficient state updates

### Backend
- Streaming file uploads
- Efficient parsing algorithms
- Memory-conscious processing
- Quick response times (<100ms)

## Deployment Architecture (Future)

```
┌──────────────┐
│   Load       │
│   Balancer   │
└──────────────┘
       │
    ┌──┴──┐
    │     │
┌───▼─┐ ┌─▼───┐
│ API │ │ API │  (Multiple instances)
│  1  │ │  2  │
└─────┘ └─────┘
    │     │
    └──┬──┘
       │
┌──────▼───────┐
│   Database   │
│   (MongoDB)  │
└──────────────┘
```

## Monitoring & Logging

### Current Implementation
- Console logging
- Basic error tracking
- Response time logging

### Planned (Future Milestones)
- Application monitoring
- Error tracking service
- Performance metrics
- User analytics

## API Design

### RESTful Principles
- Resource-based URLs
- HTTP methods (POST, GET)
- JSON request/response
- Status codes (200, 400, 500)

### Endpoint Structure
```
/api/analyze      - Main analysis endpoint
/api/analyze-text - Text-based analysis
/api/health       - Health check
```

## Configuration Management

### Environment Variables
```
PORT=5003                        # Backend port
NODE_ENV=development               # Environment
REACT_APP_API_URL=http://localhost:5003  # API URL
```

## Testing Strategy

### Unit Testing
- Individual function testing
- Mock external dependencies
- Test edge cases

### Integration Testing
- API endpoint testing
- Frontend-backend communication
- File upload workflows

### End-to-End Testing
- Complete user workflows
- Browser automation
- Real file testing

## Future Architecture Improvements

1. **Microservices**
   - Separate analysis engine
   - Independent scaling
   - Service isolation

2. **Caching Layer**
   - Redis for results
   - Faster repeated analyses
   - Reduced backend load

3. **Message Queue**
   - Async processing
   - Better scalability
   - Job scheduling

4. **Database Integration**
   - Store analysis history
   - User management
   - Configuration versioning

---

**Document Version**: 1.0  
**Last Updated**: November 1, 2025  
**Authors**: Kalash Kumari Thakur, Manasa Chinnam