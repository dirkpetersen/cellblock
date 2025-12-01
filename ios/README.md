# CellBlock iOS Client

Swift iOS client for CellBlock digital wellbeing application.

## Project Status

**Implementation Complete** - All core features implemented and ready for macOS/Xcode testing.

## Tech Stack

- **Language:** Swift 5.9+
- **UI Framework:** SwiftUI
- **Target:** iOS 16.0+
- **Architecture:** MVVM + Services
- **Reactive:** Combine framework
- **APIs:** Screen Time API, FamilyControls, BackgroundTasks

## Quick Start

### Prerequisites

- macOS 13+ with Xcode 15+
- iOS 16+ device or simulator
- Backend running at `http://localhost:3000`

### Build Instructions

1. Open project:

   ```bash
   cd ios
   open Package.swift
   # OR create Xcode project from Package.swift
   ```

2. Update backend URL in `AuthService.swift` and `WebSocketService.swift`

3. Build and run (Cmd + R)

**Full instructions:** See [BUILD.md](./BUILD.md)

## Project Structure

```
ios/
├── CellBlock/
│   ├── Sources/
│   │   ├── Models/              # Data models (User, Device, TimeStatus, etc.)
│   │   ├── Services/            # Business logic
│   │   │   ├── AuthService.swift
│   │   │   ├── WebSocketService.swift
│   │   │   ├── HeartbeatService.swift
│   │   │   ├── ScreenTimeService.swift
│   │   │   ├── TimeTrackingService.swift
│   │   │   ├── WhitelistService.swift
│   │   │   ├── DeviceService.swift
│   │   │   └── NotificationService.swift
│   │   ├── Views/               # SwiftUI views
│   │   │   ├── LoginView.swift
│   │   │   ├── DashboardView.swift
│   │   │   ├── WhitelistView.swift
│   │   │   ├── WardenView.swift
│   │   │   ├── SettingsView.swift
│   │   │   └── ContentView.swift
│   │   └── CellBlockApp.swift   # Main entry point
│   ├── Tests/
│   │   └── Unit/                # Unit tests
│   ├── Resources/               # Assets (empty - to be added)
│   └── Configuration/
│       ├── Info.plist
│       └── CellBlock.entitlements
├── Package.swift                # SPM configuration
├── BUILD.md                     # Build instructions
├── ARCHITECTURE.md              # Architecture documentation
└── README.md                    # This file
```

## Features Implemented

### Core Functionality

- **Authentication**: JWT-based login/signup with token refresh
- **WebSocket Connection**: Real-time sync with backend using native URLSessionWebSocketTask
- **Heartbeat System**: 60-second heartbeat with dual transport (WebSocket + REST)
- **Time Tracking**: Countdown timer with local optimization and server sync
- **Screen Time Integration**: Block "Social" category when time expires (Phase 1)
- **Whitelist Management**: Add/remove whitelisted apps
- **Warden System**: Invite and manage wardens
- **Push Notifications**: APNs integration for alerts
- **Background Tasks**: Background refresh for heartbeat
- **Device Registration**: Unique device fingerprint using identifierForVendor

### UI Components

- **LoginView**: Email/password authentication with signup
- **DashboardView**: Time remaining countdown, progress ring, status indicators
- **WhitelistView**: Manage whitelist with common app presets
- **WardenView**: Invite wardens and view relationships
- **SettingsView**: User profile, device info, permissions
- **ContentView**: Tab navigation with lock banner

### Services Architecture

All services follow the singleton pattern with `@Published` properties for reactive updates:

```swift
class AuthService: ObservableObject {
    static let shared = AuthService()
    @Published var isAuthenticated: Bool
    // ...
}
```

Views observe services using `@StateObject`:

```swift
struct DashboardView: View {
    @StateObject private var timeTracking = TimeTrackingService.shared
    // ...
}
```

## Screen Time API Implementation

### Phase 1 (Current - MVP)

**Status**: Implemented and ready to test

**Features**:

- Request Screen Time authorization
- Block "Social Networking" category when time expires
- Simple on/off blocking via ManagedSettings

**Limitations**:

- Only blocks predefined categories (not full whitelist)
- Blocking not persistent if app is killed
- Requires physical device to test

**Testing**:

```swift
// Request authorization
try await ScreenTimeService.shared.requestAuthorization()

// Enable blocking
await ScreenTimeService.shared.enableBlocking()

// Disable blocking
await ScreenTimeService.shared.disableBlocking()
```

### Phase 2 (Future - Full Enforcement)

**Requirements**:

- Family Controls entitlement from Apple
- DeviceActivityMonitorExtension target

**Features**:

- Block all apps except whitelist
- Persistent blocking (survives app kill and reboot)
- DeviceActivity monitoring

**See**: ARCHITECTURE.md for detailed implementation notes

## Configuration Required

### 1. Backend URL

Update in `AuthService.swift` and `WebSocketService.swift`:

```swift
// Change from:
init(baseURL: String = "http://localhost:3000")

// To your backend:
init(baseURL: String = "https://api.yourdomain.com")
```

### 2. Bundle Identifier

Update in Xcode project settings and `Info.plist`:

- Default: `com.cellblock.app`
- Change to your unique identifier

### 3. Code Signing

- Select your development team in Xcode
- Xcode will auto-generate provisioning profiles

### 4. Entitlements

**Already configured in `CellBlock.entitlements`:**

- App Groups: `group.com.cellblock.app`
- Family Controls: `com.apple.developer.family-controls`
- Push Notifications: APNs development
- Background Processing: Network extension

**Important**: Family Controls entitlement requires Apple approval. Apply at:
https://developer.apple.com/contact/request/family-controls-distribution/

## Testing

### What Works in Simulator

- Authentication flow
- UI components
- Navigation
- WebSocket connection (if backend reachable)
- Time tracking UI
- Whitelist management UI

### What Requires Physical Device

- Push notifications (APNs)
- Screen Time API
- Background app refresh
- Device fingerprinting
- Full blocking enforcement

### Running Tests

```bash
cd ios
xcodebuild -scheme CellBlock \
  -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
  test
```

## API Endpoints Used

### REST API

- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `POST /auth/refresh` - Refresh access token
- `GET /time/status` - Get time status
- `POST /sync/heartbeat` - Send heartbeat
- `GET /whitelist` - Get whitelist items
- `POST /whitelist` - Add whitelist item
- `DELETE /whitelist/:id` - Remove whitelist item
- `POST /devices/register` - Register device
- `GET /devices` - Get user devices
- `GET /warden/relationships` - Get warden relationships
- `POST /warden/invite` - Invite warden

### WebSocket Events

**Client → Server:**

- `heartbeat` - Send heartbeat with device status

**Server → Client:**

- `time_update` - Time status changed
- `lock_command` - Device should lock
- `unlock_command` - Device unlocked (parole granted)
- `config_update` - Configuration changed
- `whitelist_change` - Whitelist updated

## Known Limitations

### Phase 1 MVP

1. **Screen Time**: Only blocks "Social" category, not full whitelist
2. **Offline**: Limited offline functionality (fail-open design)
3. **Background**: Heartbeat limited by iOS background restrictions
4. **Testing**: Screen Time features require physical device

### Production Considerations

1. **Token Storage**: Currently uses UserDefaults; migrate to Keychain
2. **Crash Reporting**: Add Crashlytics or Sentry
3. **Analytics**: Add Firebase or Mixpanel
4. **Error Handling**: More robust error handling and retry logic
5. **Accessibility**: Add VoiceOver labels
6. **Localization**: Currently English only
7. **iPad Support**: Optimize layouts for iPad

## Next Steps

### Before First Run

1. **Start backend**: Ensure backend is running
2. **Update URLs**: Change localhost to your backend
3. **Code signing**: Configure in Xcode
4. **Build**: Press Cmd + R

### For Testing

1. **Simulator Testing**: Test UI and basic flows
2. **Device Testing**: Test Screen Time and notifications
3. **Backend Integration**: Verify API communication
4. **Time Sync**: Test heartbeat and time tracking

### For Production

1. **Request Entitlement**: Apply for Family Controls
2. **Configure APNs**: Set up push notification certificates
3. **TestFlight**: Set up beta testing
4. **App Store**: Prepare metadata and screenshots

## Troubleshooting

### Common Issues

**WebSocket Connection Fails**

- Check backend is running
- Verify URL is correct
- Check Info.plist App Transport Security settings

**Screen Time Authorization Fails**

- Must use physical device with iOS 16+
- Check entitlements file is included
- Verify FamilyControls framework is linked

**Build Fails**

- Clean build folder (Cmd + Shift + K)
- Delete derived data
- Run `xcodebuild -resolvePackageDependencies`

**Token Expired**

- Logout and login again
- Check token refresh logic

See [BUILD.md](./BUILD.md) for detailed troubleshooting.

## Documentation

- **[BUILD.md](./BUILD.md)** - Comprehensive build instructions
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture deep dive
- **[../REQUIREMENTS.md](../REQUIREMENTS.md)** - System requirements
- **[../srv-back/README.md](../srv-back/README.md)** - Backend setup

## Development Workflow

### Making Changes

1. **Create feature branch**: `git checkout -b feature/my-feature`
2. **Make changes**: Edit Swift files
3. **Test**: Run unit tests and manual testing
4. **Commit**: `git commit -m "feat(ios): add feature"`
5. **Push**: `git push origin feature/my-feature`
6. **PR**: Create pull request

### Code Style

- Follow Swift API Design Guidelines
- Use SwiftLint (optional but recommended)
- Document public APIs with comments
- Write unit tests for services

## Contributing

See main repository [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## Support

- **GitHub Issues**: https://github.com/yourusername/cellblock/issues
- **Documentation**: See docs/ folder
- **Backend Issues**: See srv-back/README.md

## License

See main repository [LICENSE](../LICENSE) file.

---

**Built with Claude Code** - iOS implementation by Claude (Sonnet 4.5)

Last Updated: 2025-11-30
