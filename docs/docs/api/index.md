# API Reference

CellBlock provides both REST API endpoints and WebSocket events for real-time communication.

## Overview

- **Base URL**: `https://api.cellblock.app/api/v1` (production)
- **Local Development**: `http://localhost:3000/api/v1`
- **Authentication**: JWT Bearer tokens
- **Content-Type**: `application/json`
- **WebSocket**: Socket.io for real-time events

## Documentation

- **[REST API](rest.md)** - HTTP endpoints for configuration and data access
- **[WebSocket Events](websocket.md)** - Real-time heartbeat and notification system

## Authentication

All API requests (except public endpoints) require authentication via JWT Bearer token.

### Obtaining a Token

**Login with email/password:**

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "displayName": "John Doe"
  }
}
```

### Using the Token

Include the access token in the `Authorization` header:

```http
GET /api/v1/user/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Refreshing Tokens

Access tokens expire after 15 minutes. Use the refresh token to get a new access token:

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authentication**: 5 requests per 15 minutes per IP
- **General**: 100 requests per 15 minutes per user
- **Whitelist Changes**: 10 requests per hour per user
- **Time Budget Changes**: 5 requests per hour per user

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Error Responses

All errors follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `204 No Content` - Request successful, no content to return
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Authenticated but not authorized for this action
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate email)
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## API Versioning

CellBlock uses URL-based versioning:

- Current version: `/api/v1/...`
- Backward compatibility maintained for 6 months after new version release
- Deprecated endpoints include `Deprecation` and `Sunset` headers

## Pagination

List endpoints support pagination:

```http
GET /api/v1/usage/logs?page=1&limit=20
```

**Response includes pagination metadata:**

```json
{
  "data": [...],
  "meta": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "itemsPerPage": 20
  }
}
```

## Filtering and Sorting

Many endpoints support query parameters for filtering:

```http
GET /api/v1/usage/logs?startDate=2025-01-01&endDate=2025-01-31&deviceId=device-123
```

Sorting:

```http
GET /api/v1/whitelist?sortBy=name&order=asc
```

## WebSocket Connection

Connect to WebSocket for real-time updates:

```javascript
import { io } from 'socket.io-client';

const socket = io('https://api.cellblock.app', {
  auth: {
    token: 'your-jwt-token'
  }
});

socket.on('connect', () => {
  console.log('Connected');
});

socket.on('time_update', (data) => {
  console.log('Time remaining:', data.remainingSeconds);
});
```

See [WebSocket Events](websocket.md) for complete event documentation.

## Quick Reference

### Common Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | Login with email/password |
| `/auth/register` | POST | Create new account |
| `/user/profile` | GET | Get user profile |
| `/time-budget` | GET | Get time budget configuration |
| `/time-budget` | PUT | Update time budget (requires warden approval) |
| `/whitelist` | GET | Get whitelist items |
| `/whitelist` | POST | Add whitelist item (requires warden approval) |
| `/wardens` | GET | Get warden relationships |
| `/wardens/invite` | POST | Invite a warden |
| `/requests` | GET | Get pending requests |
| `/usage/logs` | GET | Get usage history |

### Warden Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/warden/inmates` | GET | Get all supervised inmates |
| `/warden/requests` | GET | Get pending requests from inmates |
| `/warden/requests/:id/approve` | POST | Approve a request |
| `/warden/requests/:id/deny` | POST | Deny a request |
| `/warden/parole` | POST | Grant emergency time to inmate |
| `/warden/lockdown` | POST | Trigger lockdown for inmate |

## SDKs and Libraries

Official SDKs coming soon:

- TypeScript/JavaScript SDK
- Swift SDK for iOS
- C# SDK for Windows

## Testing

### Development Environment

Use the development server for testing:

```
http://localhost:3000/api/v1
```

### Postman Collection

Import the Postman collection for easy API testing:

[Download Postman Collection](https://github.com/dirkpetersen/cellblock/blob/main/docs/postman/cellblock-api.json) (coming soon)

### cURL Examples

Get user profile:

```bash
curl -X GET https://api.cellblock.app/api/v1/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Add whitelist item:

```bash
curl -X POST https://api.cellblock.app/api/v1/whitelist \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Work Slack",
    "windowsDomain": "slack.com",
    "category": "custom",
    "comment": "Need for work meetings"
  }'
```

## Support

- **API Issues**: [GitHub Issues](https://github.com/dirkpetersen/cellblock/issues)
- **Questions**: [GitHub Discussions](https://github.com/dirkpetersen/cellblock/discussions)
- **Breaking Changes**: Announced in [CHANGELOG](https://github.com/dirkpetersen/cellblock/blob/main/CHANGELOG.md)

---

Ready to start? Check out the [REST API](rest.md) or [WebSocket Events](websocket.md) documentation.
