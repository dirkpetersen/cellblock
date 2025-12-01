# WebSocket Events

CellBlock uses Socket.io for real-time bidirectional communication between clients and server.

## Connection

### Establishing Connection

**Endpoint**: `wss://api.cellblock.app` (production) or `ws://localhost:3000` (development)

**JavaScript/TypeScript:**

```javascript
import { io } from 'socket.io-client';

const socket = io('https://api.cellblock.app', {
  auth: {
    token: 'your-jwt-access-token'
  },
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});
```

**Swift (iOS):**

```swift
import SocketIO

let manager = SocketManager(
    socketURL: URL(string: "https://api.cellblock.app")!,
    config: [
        .log(true),
        .compress,
        .forceWebsockets(true),
        .secure(true)
    ]
)

let socket = manager.defaultSocket

socket.on(clientEvent: .connect) { data, ack in
    print("Connected")
    // Authenticate
    socket.emit("authenticate", ["token": jwtToken])
}
```

**C# (Windows):**

```csharp
using SocketIOClient;

var socket = new SocketIOClient.SocketIO("https://api.cellblock.app");

socket.OnConnected += async (sender, e) =>
{
    Console.WriteLine("Connected");
    await socket.EmitAsync("authenticate", jwtToken);
};

await socket.ConnectAsync();
```

### Authentication

After connecting, authenticate with your JWT token:

**Client → Server:**

```javascript
socket.emit('authenticate', {
  token: 'your-jwt-access-token'
});
```

**Server → Client (on success):**

```javascript
socket.on('authenticated', (data) => {
  console.log('Authenticated as:', data.userId);
});
```

**Server → Client (on failure):**

```javascript
socket.on('authentication_error', (error) => {
  console.error('Auth failed:', error.message);
  socket.disconnect();
});
```

## Client Events (Client → Server)

### heartbeat

Send heartbeat to report device usage.

**Frequency**: Every 30-60 seconds when device is active and unlocked

**Payload:**

```json
{
  "deviceId": "device-uuid",
  "isWhitelisted": false,
  "clientTimestamp": "2025-01-20T14:30:00Z"
}
```

**Fields:**

- `deviceId` (string): Unique device identifier
- `isWhitelisted` (boolean): Whether current app/site is whitelisted
- `clientTimestamp` (string): Client timestamp (informational only, not used for calculations)

**Example:**

```javascript
setInterval(() => {
  socket.emit('heartbeat', {
    deviceId: 'device-123',
    isWhitelisted: getCurrentAppIsWhitelisted(),
    clientTimestamp: new Date().toISOString()
  });
}, 30000); // Every 30 seconds
```

**Server Response:**

See [`time_update`](#time_update) event below.

### register_device

Register a new device (sent on first connection).

**Payload:**

```json
{
  "name": "John's iPhone",
  "platform": "ios",
  "fingerprint": "device-fingerprint-hash",
  "systemVersion": "iOS 17.2"
}
```

**Server Response:**

```javascript
socket.on('device_registered', (data) => {
  console.log('Device ID:', data.deviceId);
});
```

## Server Events (Server → Client)

### time_update

Server sends updated time remaining after each heartbeat.

**Payload:**

```json
{
  "remainingSeconds": 3600,
  "remainingWeeklySeconds": 18000,
  "usedTodaySeconds": 1800,
  "usedWeeklySeconds": 25200,
  "dailyLimitSeconds": 5400,
  "weeklyLimitSeconds": 43200,
  "resetAt": "2025-01-21T00:00:00-05:00",
  "isLocked": false
}
```

**Example Handler:**

```javascript
socket.on('time_update', (data) => {
  updateTimeDisplay(data.remainingSeconds);

  if (data.remainingSeconds <= 900 && data.remainingSeconds > 300) {
    show15MinuteWarning();
  } else if (data.remainingSeconds <= 300 && data.remainingSeconds > 0) {
    show5MinuteWarning();
  }
});
```

### lock_command

Server commands client to engage lockdown mode (time expired or warden-triggered).

**Payload:**

```json
{
  "reason": "time_expired",
  "message": "Your daily time budget has been used up",
  "gracePeriodSeconds": 0
}
```

**Reason Values:**

- `time_expired` - Daily or weekly budget exhausted
- `warden_lockdown` - Warden triggered lockdown
- `policy_violation` - Tampering detected

**Example Handler:**

```javascript
socket.on('lock_command', (data) => {
  if (data.gracePeriodSeconds > 0) {
    showGracePeriodWarning(data.gracePeriodSeconds, data.message);
    setTimeout(() => {
      engageLockdownMode();
    }, data.gracePeriodSeconds * 1000);
  } else {
    engageLockdownMode();
  }
});
```

### unlock_command

Server commands client to disengage lockdown mode (parole granted or budget reset).

**Payload:**

```json
{
  "reason": "parole_granted",
  "message": "Your warden granted you 2 hours of emergency time",
  "grantedByWarden": "Sarah Smith",
  "expiresAt": "2025-01-20T23:59:59-05:00"
}
```

**Reason Values:**

- `parole_granted` - Warden granted emergency time
- `daily_reset` - Daily budget reset at midnight
- `break_glass` - User activated break glass

**Example Handler:**

```javascript
socket.on('unlock_command', (data) => {
  disengageLockdownMode();
  showNotification(data.message);

  if (data.expiresAt) {
    scheduleRelockWarning(data.expiresAt);
  }
});
```

### config_update

Server notifies client of configuration changes (whitelist, time budget, etc.).

**Payload:**

```json
{
  "type": "whitelist_update",
  "data": {
    "added": [
      {
        "id": "item-uuid",
        "name": "Zoom",
        "iosBundleId": "us.zoom.videomeetings",
        "windowsDomain": "zoom.us"
      }
    ],
    "removed": []
  }
}
```

**Type Values:**

- `whitelist_update` - Whitelist items added/removed
- `time_budget_update` - Time budget limits changed
- `warden_update` - Warden relationship changed

**Example Handler:**

```javascript
socket.on('config_update', (data) => {
  switch (data.type) {
    case 'whitelist_update':
      updateLocalWhitelist(data.data);
      break;
    case 'time_budget_update':
      refreshTimeBudgetConfig();
      break;
    case 'warden_update':
      refreshWardenList();
      break;
  }
});
```

### request_status

Notification about request approval/denial.

**Payload:**

```json
{
  "requestId": "request-uuid",
  "type": "whitelist",
  "status": "approved",
  "wardenName": "Sarah Smith",
  "wardenComment": "Approved for work use only",
  "timestamp": "2025-01-20T15:00:00Z"
}
```

**Status Values:**

- `approved` - Request approved
- `denied` - Request denied
- `expired` - Request expired (no response within 3 days)

**Example Handler:**

```javascript
socket.on('request_status', (data) => {
  if (data.status === 'approved') {
    showNotification(`${data.wardenName} approved your request`);
    refreshConfig();
  } else if (data.status === 'denied') {
    showNotification(`${data.wardenName} denied your request: ${data.wardenComment}`);
  }
});
```

### warden_notification

Warden receives notifications about inmate activities.

**Payload (for wardens):**

```json
{
  "type": "new_request",
  "inmateId": "user-uuid",
  "inmateName": "John Doe",
  "requestId": "request-uuid",
  "requestType": "whitelist",
  "summary": "John Doe wants to add Zoom to whitelist",
  "timestamp": "2025-01-20T14:00:00Z"
}
```

**Notification Types:**

- `new_request` - Inmate submitted request
- `break_glass` - Inmate activated break glass
- `device_offline` - Device hasn't sent heartbeat for 30+ minutes
- `usage_milestone` - Daily or weekly limit reached

**Example Handler (Warden Dashboard):**

```javascript
socket.on('warden_notification', (data) => {
  playNotificationSound();
  incrementPendingBadge(data.inmateId);
  addNotificationToList(data);

  if (data.type === 'break_glass') {
    showUrgentAlert(`${data.inmateName} activated break glass!`);
  }
});
```

### warning

Time warning notifications (15 min and 5 min).

**Payload:**

```json
{
  "type": "15_minute",
  "remainingSeconds": 900,
  "message": "You have 15 minutes remaining today"
}
```

**Warning Types:**

- `15_minute` - 15 minutes remaining
- `5_minute` - 5 minutes remaining

**Example Handler:**

```javascript
socket.on('warning', (data) => {
  showBanner(data.message, 'warning');
  playWarningSound();

  if (data.type === '5_minute') {
    showUrgentBanner(data.message, 'danger');
  }
});
```

### error

Server sends error messages for invalid operations.

**Payload:**

```json
{
  "code": "INVALID_HEARTBEAT",
  "message": "Device ID not registered",
  "details": "Please register device before sending heartbeats"
}
```

**Example Handler:**

```javascript
socket.on('error', (error) => {
  console.error('WebSocket error:', error);

  if (error.code === 'INVALID_TOKEN') {
    refreshAuthToken();
  }
});
```

## Reconnection

Socket.io handles reconnection automatically, but you should handle reconnection events:

```javascript
socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
  // Re-authenticate
  socket.emit('authenticate', { token: getAccessToken() });
  // Re-register device if needed
  socket.emit('register_device', getDeviceInfo());
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('Reconnection attempt', attemptNumber);
});

socket.on('reconnect_error', (error) => {
  console.error('Reconnection error:', error);
});

socket.on('reconnect_failed', () => {
  console.error('Reconnection failed after max attempts');
  showOfflineMessage();
});
```

### Exponential Backoff

Socket.io uses exponential backoff automatically:

- Attempt 1: Immediate
- Attempt 2: After 1 second
- Attempt 3: After 2 seconds
- Attempt 4: After 4 seconds
- Attempt 5: After 8 seconds
- Max delay: 5 seconds

## Best Practices

### Heartbeat Strategy

```javascript
let heartbeatInterval;
let isDeviceActive = true;

// Start heartbeats when device active
function startHeartbeats() {
  heartbeatInterval = setInterval(() => {
    if (isDeviceActive && !isWhitelistedAppActive()) {
      socket.emit('heartbeat', {
        deviceId: getDeviceId(),
        isWhitelisted: false,
        clientTimestamp: new Date().toISOString()
      });
    }
  }, 30000); // Every 30 seconds
}

// Stop heartbeats when device inactive
function stopHeartbeats() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// Detect device activity
document.addEventListener('visibilitychange', () => {
  isDeviceActive = !document.hidden;

  if (isDeviceActive) {
    startHeartbeats();
  } else {
    stopHeartbeats();
  }
});
```

### Error Handling

```javascript
// Global error handler
socket.on('error', (error) => {
  logError('WebSocket error', error);

  // Handle specific error types
  switch (error.code) {
    case 'INVALID_TOKEN':
      refreshTokenAndReconnect();
      break;
    case 'DEVICE_LIMIT_REACHED':
      showDeviceLimitError();
      break;
    case 'SERVER_MAINTENANCE':
      showMaintenanceMessage(error.estimatedDowntimeMinutes);
      break;
    default:
      showGenericErrorMessage();
  }
});
```

### Offline Handling

```javascript
let isOnline = navigator.onLine;

window.addEventListener('online', () => {
  isOnline = true;
  socket.connect();
  hideOfflineMessage();
});

window.addEventListener('offline', () => {
  isOnline = false;
  showOfflineMessage();
  // Continue enforcing cached rules
  applyOfflineMode();
});
```

### State Synchronization

```javascript
// Request full state sync after reconnection
socket.on('reconnect', async () => {
  // Re-authenticate
  socket.emit('authenticate', { token: getAccessToken() });

  // Request current state
  try {
    const state = await fetchCurrentState();
    updateLocalState(state);
  } catch (error) {
    console.error('Failed to sync state:', error);
  }
});
```

## Testing WebSocket Events

### Using Postman

Postman supports WebSocket connections:

1. Create new WebSocket request
2. URL: `ws://localhost:3000/socket.io/?EIO=4&transport=websocket`
3. Send authentication message:
   ```json
   {
     "type": "authenticate",
     "data": { "token": "your-jwt-token" }
   }
   ```

### Using wscat (CLI)

```bash
npm install -g wscat

wscat -c "ws://localhost:3000/socket.io/?EIO=4&transport=websocket"
```

Then send Socket.io protocol messages.

### Unit Testing (Jest)

```javascript
import { io } from 'socket.io-client';

describe('WebSocket Events', () => {
  let socket;

  beforeEach((done) => {
    socket = io('http://localhost:3000', {
      auth: { token: testToken }
    });
    socket.on('connect', done);
  });

  afterEach(() => {
    socket.disconnect();
  });

  test('should receive time_update after heartbeat', (done) => {
    socket.once('time_update', (data) => {
      expect(data).toHaveProperty('remainingSeconds');
      expect(data.remainingSeconds).toBeGreaterThanOrEqual(0);
      done();
    });

    socket.emit('heartbeat', {
      deviceId: 'test-device',
      isWhitelisted: false,
      clientTimestamp: new Date().toISOString()
    });
  });
});
```

## Troubleshooting

### Connection Issues

**Problem**: Cannot connect to WebSocket server

**Solutions**:

1. Check firewall rules (port 3000 or 443)
2. Verify JWT token is valid
3. Check CORS configuration
4. Try polling transport first:
   ```javascript
   const socket = io(url, {
     transports: ['polling', 'websocket']
   });
   ```

### Heartbeats Not Received

**Problem**: Server not receiving heartbeats

**Solutions**:

1. Check device is authenticated
2. Verify heartbeat format matches schema
3. Check network connectivity
4. Verify device is registered

### Events Not Firing

**Problem**: Event listeners not triggering

**Solutions**:

1. Check event name spelling
2. Verify socket is connected
3. Check authentication status
4. Add debug logging:
   ```javascript
   socket.onAny((eventName, ...args) => {
     console.log('Event:', eventName, args);
   });
   ```

---

For REST API documentation, see [REST API Reference](rest.md).
