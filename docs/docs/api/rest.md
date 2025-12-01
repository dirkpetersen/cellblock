# REST API

Complete reference for CellBlock REST API endpoints.

**Base URL**: `/api/v1`

## Authentication

### POST /auth/register

Create a new user account.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "displayName": "John Doe"
}
```

**Response:** `201 Created`

```json
{
  "message": "Registration successful. Please verify your email.",
  "userId": "user-uuid"
}
```

### POST /auth/login

Login with email and password.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK`

```json
{
  "accessToken": "eyJhbGciOiJI...",
  "refreshToken": "eyJhbGciOiJI...",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "displayName": "John Doe",
    "timezone": "America/New_York"
  }
}
```

### POST /auth/google

Login with Google OAuth.

**Request:**

```json
{
  "idToken": "google-id-token"
}
```

**Response:** Same as `/auth/login`

### POST /auth/refresh

Refresh access token.

**Request:**

```json
{
  "refreshToken": "eyJhbGciOiJI..."
}
```

**Response:** `200 OK`

```json
{
  "accessToken": "new-access-token"
}
```

### POST /auth/logout

Logout and invalidate refresh token.

**Headers:** `Authorization: Bearer {token}`

**Response:** `204 No Content`

## User Profile

### GET /user/profile

Get current user profile.

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "displayName": "John Doe",
  "timezone": "America/New_York",
  "createdAt": "2025-01-15T10:00:00Z"
}
```

### PUT /user/profile

Update user profile.

**Headers:** `Authorization: Bearer {token}`

**Request:**

```json
{
  "displayName": "John Smith",
  "timezone": "America/Los_Angeles"
}
```

**Response:** `200 OK` - Returns updated profile

### DELETE /user/account

Delete user account (soft delete, 30-day retention).

**Headers:** `Authorization: Bearer {token}`

**Request:**

```json
{
  "password": "confirm-password"
}
```

**Response:** `204 No Content`

## Time Budget

### GET /time-budget

Get time budget configuration and current usage.

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

```json
{
  "dailyLimits": {
    "monday": 120,
    "tuesday": 120,
    "wednesday": 120,
    "thursday": 120,
    "friday": 150,
    "saturday": 180,
    "sunday": 180
  },
  "weeklyLimit": 1050,
  "remainingToday": 3600,
  "remainingWeekly": 18000,
  "usedToday": 1800,
  "usedWeekly": 25200,
  "resetAt": "2025-01-16T00:00:00-05:00"
}
```

### PUT /time-budget

Update time budget configuration.

**Headers:** `Authorization: Bearer {token}`

**Request:**

```json
{
  "dailyLimits": {
    "monday": 90,
    "tuesday": 90,
    "wednesday": 90,
    "thursday": 90,
    "friday": 120,
    "saturday": 180,
    "sunday": 180
  },
  "weeklyLimit": 900,
  "comment": "Reducing weekday time to focus more on work"
}
```

**Response:** `200 OK` (if no warden) or `202 Accepted` (if warden approval required)

```json
{
  "message": "Time budget update request submitted",
  "requestId": "request-uuid",
  "status": "pending"
}
```

## Whitelist

### GET /whitelist

Get all whitelist items for current user.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**

- `category` (optional): Filter by category (`utility`, `healthy`, `custom`)
- `platform` (optional): Filter by platform (`ios`, `windows`, `android`)

**Response:** `200 OK`

```json
{
  "items": [
    {
      "id": "item-uuid",
      "name": "Phone",
      "iosBundleId": "com.apple.mobilephone",
      "windowsDomain": null,
      "category": "utility",
      "isEnabled": true,
      "createdAt": "2025-01-15T10:00:00Z"
    },
    {
      "id": "item-uuid-2",
      "name": "Spotify",
      "iosBundleId": "com.spotify.client",
      "windowsDomain": "spotify.com",
      "category": "healthy",
      "isEnabled": true,
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ]
}
```

### POST /whitelist

Add new whitelist item.

**Headers:** `Authorization: Bearer {token}`

**Request:**

```json
{
  "name": "Work Slack",
  "iosBundleId": "com.tinyspeck.chatlyio",
  "windowsDomain": "slack.com",
  "category": "custom",
  "comment": "Need for daily team meetings"
}
```

**Response:** `201 Created` (if no warden) or `202 Accepted` (if warden approval required)

```json
{
  "message": "Whitelist addition request submitted",
  "requestId": "request-uuid",
  "status": "pending"
}
```

### DELETE /whitelist/:id

Remove whitelist item.

**Headers:** `Authorization: Bearer {token}`

**Response:** `204 No Content` (if no warden) or `202 Accepted` (if warden approval required)

### PUT /whitelist/:id/toggle

Toggle healthy app on/off.

**Headers:** `Authorization: Bearer {token}`

**Request:**

```json
{
  "isEnabled": false,
  "comment": "Disabling Spotify to focus more"
}
```

**Response:** `200 OK` (if no warden) or `202 Accepted` (if warden approval required)

## Wardens

### GET /wardens

Get all warden relationships for current user.

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

```json
{
  "wardens": [
    {
      "id": "relationship-uuid",
      "warden": {
        "id": "warden-user-uuid",
        "email": "warden@example.com",
        "displayName": "Sarah Smith"
      },
      "role": "primary",
      "status": "active",
      "invitedAt": "2025-01-15T10:00:00Z",
      "acceptedAt": "2025-01-15T11:00:00Z"
    }
  ]
}
```

### POST /wardens/invite

Invite someone to be your warden.

**Headers:** `Authorization: Bearer {token}`

**Request:**

```json
{
  "email": "warden@example.com",
  "role": "primary",
  "message": "Would you be willing to help me stay accountable?"
}
```

**Response:** `201 Created`

```json
{
  "message": "Warden invitation sent",
  "relationshipId": "relationship-uuid"
}
```

### DELETE /wardens/:id

Remove a warden (requires backup warden).

**Headers:** `Authorization: Bearer {token}`

**Response:** `204 No Content`

### POST /wardens/break-glass

End all warden relationships immediately (emergency unlock).

**Headers:** `Authorization: Bearer {token}`

**Request:**

```json
{
  "comment": "Family emergency - need unrestricted access"
}
```

**Response:** `200 OK`

```json
{
  "message": "Break glass activated. All warden relationships ended."
}
```

## Requests

### GET /requests

Get all pending and historical requests.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**

- `status` (optional): Filter by status (`pending`, `approved`, `denied`, `expired`)
- `type` (optional): Filter by type (`whitelist`, `budget_change`, `parole`)

**Response:** `200 OK`

```json
{
  "requests": [
    {
      "id": "request-uuid",
      "type": "whitelist",
      "status": "pending",
      "data": {
        "name": "Zoom",
        "iosBundleId": "us.zoom.videomeetings"
      },
      "comment": "Need for work meetings",
      "createdAt": "2025-01-20T14:00:00Z",
      "expiresAt": "2025-01-23T14:00:00Z"
    }
  ]
}
```

## Parole

### POST /parole/request

Request emergency time from warden.

**Headers:** `Authorization: Bearer {token}`

**Request:**

```json
{
  "comment": "Work deadline tonight - need 2 extra hours"
}
```

**Response:** `202 Accepted`

```json
{
  "message": "Parole request submitted",
  "requestId": "request-uuid"
}
```

## Usage Logs

### GET /usage/logs

Get usage history.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**

- `startDate`: Start date (ISO 8601)
- `endDate`: End date (ISO 8601)
- `deviceId` (optional): Filter by device
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "log-uuid",
      "deviceId": "device-uuid",
      "deviceName": "John's iPhone",
      "timestamp": "2025-01-20T10:00:00Z",
      "durationSeconds": 60,
      "wasWhitelisted": false
    }
  ],
  "meta": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "itemsPerPage": 20
  }
}
```

### GET /usage/summary

Get usage summary for specified period.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**

- `period`: `day`, `week`, or `month`
- `date`: Date in period (ISO 8601)

**Response:** `200 OK`

```json
{
  "period": "week",
  "startDate": "2025-01-13T00:00:00Z",
  "endDate": "2025-01-19T23:59:59Z",
  "totalMinutes": 840,
  "dailyBreakdown": [
    {
      "date": "2025-01-13",
      "minutes": 120,
      "limitMinutes": 120,
      "overLimit": false
    }
  ],
  "devices": [
    {
      "deviceId": "device-uuid",
      "deviceName": "iPhone",
      "minutes": 450
    },
    {
      "deviceId": "device-uuid-2",
      "deviceName": "Windows PC",
      "minutes": 390
    }
  ]
}
```

## Devices

### GET /devices

Get all registered devices.

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

```json
{
  "devices": [
    {
      "id": "device-uuid",
      "name": "John's iPhone",
      "platform": "ios",
      "fingerprint": "device-fingerprint-hash",
      "lastActive": "2025-01-20T14:30:00Z",
      "isActive": true,
      "registeredAt": "2025-01-15T10:00:00Z"
    }
  ]
}
```

### DELETE /devices/:id

Remove a device.

**Headers:** `Authorization: Bearer {token}`

**Response:** `204 No Content`

## Warden API

These endpoints are for wardens managing their inmates.

### GET /warden/inmates

Get all supervised inmates.

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

```json
{
  "inmates": [
    {
      "id": "user-uuid",
      "displayName": "John Doe",
      "email": "john@example.com",
      "status": "active",
      "remainingToday": 3600,
      "remainingWeekly": 18000,
      "pendingRequestsCount": 2,
      "lastActive": "2025-01-20T14:30:00Z"
    }
  ]
}
```

### GET /warden/inmates/:id

Get detailed information about specific inmate.

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK` - Returns detailed inmate data including usage history

### GET /warden/requests

Get all pending requests from inmates.

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK` - Returns list of pending requests

### POST /warden/requests/:id/approve

Approve a request.

**Headers:** `Authorization: Bearer {token}`

**Request:**

```json
{
  "comment": "Approved - make sure you use this for work only"
}
```

**Response:** `200 OK`

```json
{
  "message": "Request approved",
  "requestId": "request-uuid"
}
```

### POST /warden/requests/:id/deny

Deny a request.

**Headers:** `Authorization: Bearer {token}`

**Request:**

```json
{
  "comment": "This isn't necessary for your goals. Let's discuss."
}
```

**Response:** `200 OK`

### POST /warden/parole

Grant emergency time to inmate.

**Headers:** `Authorization: Bearer {token}`

**Request:**

```json
{
  "inmateId": "user-uuid",
  "type": "minutes",
  "value": 120,
  "comment": "Granted for work deadline"
}
```

Or deadline-based:

```json
{
  "inmateId": "user-uuid",
  "type": "until",
  "value": "2025-01-20T23:59:59-05:00",
  "comment": "Unlocked until end of day"
}
```

**Response:** `200 OK`

### POST /warden/lockdown

Trigger lockdown for inmate.

**Headers:** `Authorization: Bearer {token}`

**Request:**

```json
{
  "inmateId": "user-uuid",
  "gracePeriodMinutes": 30,
  "comment": "Observed concerning usage pattern. Lockdown in 30 min."
}
```

For immediate lockdown, omit `gracePeriodMinutes` or set to `0`.

**Response:** `200 OK`

### POST /warden/resign/:inmateId

Resign as warden for specific inmate.

**Headers:** `Authorization: Bearer {token}`

**Request:**

```json
{
  "comment": "Starting new job, won't have time to respond quickly"
}
```

**Response:** `200 OK`

---

For real-time communication, see [WebSocket Events](websocket.md).
