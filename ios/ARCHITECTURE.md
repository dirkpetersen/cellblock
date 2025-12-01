# CellBlock iOS - Architecture Documentation

This document explains the iOS client architecture, design decisions, and implementation details.

## Table of Contents

1. [Overview](#overview)
2. [Architecture Pattern](#architecture-pattern)
3. [Core Components](#core-components)
4. [Data Flow](#data-flow)
5. [Screen Time Integration](#screen-time-integration)
6. [Background Processing](#background-processing)
7. [Security Considerations](#security-considerations)
8. [Performance Optimization](#performance-optimization)
9. [Future Enhancements](#future-enhancements)

## Overview

CellBlock iOS is built with:

- **Swift 5.9+**
- **SwiftUI** for declarative UI
- **Combine** for reactive programming
- **Screen Time API** for blocking enforcement
- **Native WebSocket** for real-time communication

### Key Design Principles

1. **Reactive Architecture**: Use `@Published` properties and Combine for state management
2. **Service-Oriented**: Separate concerns into dedicated service classes
3. **Fail-Open**: If backend is unreachable, don't block the user
4. **Offline-First**: Cache critical data locally
5. **Battery Efficient**: Minimize background activity

## Architecture Pattern

### MVVM + Services

```
┌─────────────────────────────────────────────┐
│              SwiftUI Views                  │
│  (DashboardView, WhitelistView, etc.)      │
└─────────────────┬───────────────────────────┘
                  │ @StateObject
                  ▼
┌─────────────────────────────────────────────┐
│           Service Layer                     │
│  (AuthService, TimeTrackingService, etc.)  │
└─────────────────┬───────────────────────────┘
                  │ async/await
                  ▼
┌─────────────────────────────────────────────┐
│          Network Layer                      │
│  (URLSession, WebSocket)                   │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│          Backend API                        │
│  (Node.js REST + Socket.IO)                │
└─────────────────────────────────────────────┘
```

### Why MVVM?

- **Separation of Concerns**: Views handle UI, Services handle logic
- **Testability**: Services can be unit tested independently
- **SwiftUI Integration**: `@Published` properties automatically trigger UI updates
- **Scalability**: Easy to add new features without modifying existing code

## Core Components

### 1. Models (`Sources/Models/`)

**Purpose**: Define data structures matching backend API

**Key Files**:

- `User.swift`: User, Device, TimeBudget, TimeStatus models
- `APIModels.swift`: Request/response models for API calls

**Design Notes**:

- All models conform to `Codable` for JSON serialization
- Use `AnyCodable` wrapper for dynamic JSON data
- Date handling uses ISO8601 format

### 2. Services (`Sources/Services/`)

#### AuthService

**Responsibility**: Authentication and token management

```swift
class AuthService: ObservableObject {
    @Published var isAuthenticated: Bool
    @Published var currentUser: User?
    @Published var accessToken: String?

    func login(email: String, password: String) async throws
    func refreshAccessToken() async throws
    func logout()
}
```

**Key Features**:

- JWT token storage in UserDefaults
- Automatic token refresh on 401
- Centralized auth state management

#### WebSocketService

**Responsibility**: Real-time communication with backend

```swift
class WebSocketService: ObservableObject {
    @Published var isConnected: Bool
    @Published var timeUpdate: TimeUpdate?
    @Published var lockCommand: LockCommand?

    func connect(token: String)
    func sendHeartbeat(deviceId: String, isWhitelistedApp: Bool)
}
```

**Implementation**:

- Uses native `URLSessionWebSocketTask`
- Socket.IO protocol parsing
- Auto-reconnect on disconnect
- Event-driven architecture

#### HeartbeatService

**Responsibility**: Send periodic heartbeat to backend

```swift
class HeartbeatService: ObservableObject {
    @Published var isActive: Bool
    @Published var lastHeartbeatTime: Date?

    func start()
    func stop()
}
```

**Behavior**:

- Sends heartbeat every 60 seconds
- Pauses when app is backgrounded
- Resumes on foreground
- Dual transport: WebSocket + REST API

#### ScreenTimeService

**Responsibility**: Screen Time API integration

```swift
@MainActor
class ScreenTimeService: ObservableObject {
    @Published var isAuthorized: Bool
    @Published var isBlocking: Bool

    func requestAuthorization() async throws
    func enableBlocking() async
    func disableBlocking() async
}
```

**Phase 1 (MVP)**:

- Block "Social Networking" category only
- Simple on/off toggle
- No persistent monitoring

**Phase 2 (Full)**:

- Block all apps except whitelist
- DeviceActivityMonitorExtension
- Persistent blocking even when app is killed

#### TimeTrackingService

**Responsibility**: Manage time status and countdown

```swift
@MainActor
class TimeTrackingService: ObservableObject {
    @Published var timeStatus: TimeStatus?
    @Published var remainingSeconds: Int
    @Published var isLocked: Bool

    func fetchTimeStatus() async
    func formatTime(_ seconds: Int) -> String
}
```

**Features**:

- Local countdown timer (optimistic update)
- WebSocket sync for accuracy
- Lock/unlock event handling
- Time formatting utilities

#### WhitelistService

**Responsibility**: Manage whitelist items

```swift
@MainActor
class WhitelistService: ObservableObject {
    @Published var whitelistItems: [WhitelistItem]
    @Published var isLoading: Bool

    func fetchWhitelist() async
    func addWhitelistItem(...) async throws
    func removeWhitelistItem(_ id: String) async throws
}
```

#### DeviceService

**Responsibility**: Device registration and fingerprinting

```swift
class DeviceService: ObservableObject {
    @Published var currentDevice: Device?
    @Published var currentDeviceId: String?

    func getDeviceFingerprint() -> String
    func registerDevice() async throws
}
```

**Fingerprinting**:

- Uses `UIDevice.current.identifierForVendor`
- Stable across app launches
- Resets on app uninstall

#### NotificationService

**Responsibility**: Push and local notifications

```swift
@MainActor
class NotificationService: ObservableObject {
    @Published var isAuthorized: Bool
    @Published var pushToken: String?

    func requestAuthorization() async throws
    func showLocalNotification(title: String, body: String) async
    func handleNotification(_ userInfo: [AnyHashable: Any])
}
```

### 3. Views (`Sources/Views/`)

#### LoginView

- Email/password authentication
- Signup flow
- Input validation
- Error handling

#### DashboardView

- Time remaining countdown
- Progress ring visualization
- Status indicators
- Quick actions

#### WhitelistView

- List of whitelisted apps
- Add/remove functionality
- Common apps presets
- Category badges

#### WardenView

- Warden relationship management
- Invite warden flow
- Status indicators

#### SettingsView

- User profile
- Device information
- Permissions management
- Logout

#### ContentView

- Root navigation container
- Tab bar navigation
- Lock banner overlay

## Data Flow

### Authentication Flow

```
User enters credentials
    ↓
LoginView → AuthService.login()
    ↓
API request to /auth/login
    ↓
Store tokens in UserDefaults
    ↓
Update @Published isAuthenticated = true
    ↓
ContentView switches to TabView
    ↓
Register device
    ↓
Connect WebSocket
    ↓
Start heartbeat
```

### Heartbeat Flow

```
Timer fires every 60s
    ↓
HeartbeatService.sendHeartbeat()
    ↓
Check if current activity is whitelisted
    ↓
Send via WebSocket + REST API
    ↓
Backend responds with remaining time
    ↓
Update TimeTrackingService
    ↓
UI automatically updates via @Published
    ↓
If time = 0, trigger ScreenTimeService.enableBlocking()
```

### Lock Flow

```
Backend detects time expired
    ↓
Send "lock_command" via WebSocket
    ↓
WebSocketService receives event
    ↓
Update @Published lockCommand
    ↓
TimeTrackingService observes change
    ↓
Set isLocked = true
    ↓
Call ScreenTimeService.enableBlocking()
    ↓
Screen Time shields social apps
    ↓
Show lock banner in UI
```

## Screen Time Integration

### Phase 1 Implementation (Current)

**Goal**: Block social media apps when time expires

**Steps**:

1. Request authorization: `AuthorizationCenter.requestAuthorization(for: .individual)`
2. Configure shield: `ManagedSettingsStore().shield.applicationCategories`
3. Block social category: `ActivityCategoryToken.category(.socialNetworking)`

**Code Example**:

```swift
func enableBlocking() async {
    let socialCategory = ActivityCategoryToken.category(.socialNetworking)
    store.shield.applicationCategories = .specific([socialCategory])
}
```

**Limitations**:

- Only blocks predefined categories
- Cannot create custom whitelist
- Blocking not persistent if app is killed

### Phase 2 Implementation (Future)

**Goal**: Block all apps except whitelist

**Requirements**:

- Family Controls entitlement
- DeviceActivityMonitorExtension target

**Steps**:

1. Create monitor extension
2. Configure device activity schedule
3. Shield all apps: `store.shield.applications = .all()`
4. Exempt whitelist: `store.shield.applications = .all(except: whitelistTokens)`

**Benefits**:

- Blocking persists even when app is killed
- Works across device reboots
- More granular control

### Screen Time API Gotchas

1. **Authorization Required**: User must explicitly grant permission
2. **Device Only**: Does not work in simulator
3. **iOS 16+**: Screen Time API requires iOS 16 or later
4. **Entitlement Approval**: Full features require Apple approval
5. **No Programmatic Disable**: Only device passcode can disable shields

## Background Processing

### App States

```
Foreground → Background → Suspended
    ↑            ↓            ↓
    └────────────┴────────────┘
         Resume
```

### Heartbeat in Background

**Challenges**:

- iOS aggressively suspends apps
- WebSocket connections drop
- Timers stop firing

**Solutions**:

1. **BGAppRefreshTask**: Schedule periodic background refresh

   ```swift
   BGTaskScheduler.shared.register(
       forTaskWithIdentifier: "com.cellblock.heartbeat",
       using: nil
   ) { task in
       self.handleHeartbeatTask(task as! BGAppRefreshTask)
   }
   ```

2. **Push Notifications**: Wake app for critical events
   - Lock command
   - Unlock command
   - Time update

3. **Background Modes**: Enable in Info.plist
   - `fetch`: Background app refresh
   - `processing`: Background processing
   - `remote-notification`: Silent push

### Foreground Transition

When app returns to foreground:

1. Reconnect WebSocket
2. Fetch latest time status
3. Resume heartbeat timer
4. Sync any pending changes

## Security Considerations

### Token Storage

**Current**: UserDefaults (acceptable for MVP)
**Production**: Keychain

```swift
// Migrate to Keychain
KeychainWrapper.standard.set(accessToken, forKey: "accessToken")
```

### Network Security

1. **HTTPS Only**: Enforce in App Transport Security
2. **Certificate Pinning**: Verify server certificate
3. **Token Refresh**: Auto-refresh expired tokens
4. **Logout on Unauthorized**: Clear tokens on 401

### Local Data Protection

1. **No Sensitive Data in Logs**: Redact tokens, passwords
2. **Encrypted Database**: Use Core Data with encryption
3. **App Group Isolation**: Sandbox data from other apps

## Performance Optimization

### Memory Management

1. **Weak References**: Prevent retain cycles

   ```swift
   timer = Timer.scheduledTimer(...) { [weak self] _ in
       self?.sendHeartbeat()
   }
   ```

2. **Lazy Loading**: Load views on demand
3. **Image Caching**: Cache downloaded images
4. **List Optimization**: Use `LazyVStack` for long lists

### Network Efficiency

1. **Request Batching**: Combine multiple API calls
2. **Response Caching**: Cache API responses
3. **Compression**: Enable gzip compression
4. **Connection Pooling**: Reuse HTTP connections

### Battery Optimization

1. **Coalesce Timers**: Group timer firings
2. **Location Services**: Only when needed
3. **Background Fetch**: Limit frequency
4. **Screen Time Checks**: Cache results

## Future Enhancements

### Short Term

1. **Offline Mode**: Cache all data locally
2. **Analytics**: Track usage patterns
3. **Crash Reporting**: Crashlytics integration
4. **A/B Testing**: Firebase Remote Config

### Medium Term

1. **Widget Support**: Home screen widget showing time remaining
2. **Shortcuts Integration**: Siri shortcuts for common actions
3. **Apple Watch App**: View time status on wrist
4. **iCloud Sync**: Sync settings across devices

### Long Term

1. **Advanced Blocking**: URL-level filtering
2. **Focus Modes**: Integration with iOS Focus
3. **Health Integration**: Screen time in Health app
4. **Machine Learning**: Predict usage patterns

## Testing Strategy

### Unit Tests

- Service logic
- Model validation
- Data formatting
- Error handling

### Integration Tests

- API communication
- WebSocket events
- Push notifications
- Background tasks

### UI Tests

- Login flow
- Navigation
- Add/remove whitelist
- Settings changes

### Manual Testing Checklist

- [ ] Install on physical device
- [ ] Test Screen Time authorization
- [ ] Test notifications
- [ ] Test background refresh
- [ ] Test app suspend/resume
- [ ] Test low battery mode
- [ ] Test airplane mode
- [ ] Test poor network conditions

## Code Style Guidelines

### Naming Conventions

- **Classes**: PascalCase (e.g., `AuthService`)
- **Methods**: camelCase (e.g., `sendHeartbeat()`)
- **Properties**: camelCase (e.g., `isAuthenticated`)
- **Constants**: camelCase (e.g., `accessTokenKey`)

### File Organization

```swift
// MARK: - Imports
import SwiftUI
import Combine

// MARK: - Class Definition
class MyService: ObservableObject {

    // MARK: - Properties
    @Published var property: String

    // MARK: - Initialization
    init() { }

    // MARK: - Public Methods
    func publicMethod() { }

    // MARK: - Private Methods
    private func privateMethod() { }
}

// MARK: - Extensions
extension MyService {
    // Related functionality
}
```

### SwiftUI Best Practices

1. **Extract Subviews**: Keep views under 300 lines
2. **Use `@StateObject` for Services**: Ensure single instance
3. **Prefer `async/await`**: Over completion handlers
4. **Handle Loading States**: Show spinners for async operations
5. **Accessibility**: Add `.accessibilityLabel()` to all interactive elements

## Debugging Tips

### Common Issues

**WebSocket Not Connecting**:

- Check backend URL
- Verify token is valid
- Check network permissions

**Screen Time Not Working**:

- Must use physical device
- Check authorization status
- Verify entitlements

**Time Not Updating**:

- Check heartbeat is running
- Verify WebSocket connection
- Check backend logs

### Useful Debug Commands

```bash
# View console logs
log stream --predicate 'subsystem == "com.cellblock.app"'

# Reset simulator
xcrun simctl erase all

# View UserDefaults
defaults read com.cellblock.app

# Clear all data
defaults delete com.cellblock.app
```

## Resources

- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [SwiftUI Tutorials](https://developer.apple.com/tutorials/swiftui)
- [Screen Time API Guide](https://developer.apple.com/documentation/screetime)
- [Socket.IO Swift Client](https://github.com/socketio/socket.io-client-swift)

## Contributing

See main repository CONTRIBUTING.md for guidelines.

## License

See main repository LICENSE file.
