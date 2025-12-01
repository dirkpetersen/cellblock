# CellBlock iOS - Build Instructions

This document provides instructions for building and running the CellBlock iOS client.

## Prerequisites

### Required

- **macOS** 13.0 or later (Ventura+)
- **Xcode** 15.0 or later
- **iOS 16.0+** device or simulator
- **Apple Developer Account** (for physical device testing)

### Optional

- CocoaPods or Swift Package Manager (SPM)
- TestFlight account for beta testing

## Project Structure

```
ios/
├── CellBlock/
│   ├── Sources/
│   │   ├── Models/           # Data models
│   │   ├── Services/         # Business logic
│   │   ├── Views/            # SwiftUI views
│   │   ├── Utilities/        # Helper functions
│   │   └── CellBlockApp.swift
│   ├── Tests/
│   │   ├── Unit/             # Unit tests
│   │   └── UI/               # UI tests
│   ├── Resources/            # Assets, colors
│   └── Configuration/
│       ├── Info.plist
│       └── CellBlock.entitlements
├── Package.swift             # Swift Package Manager
└── BUILD.md                  # This file
```

## Setup Instructions

### Option 1: Using Xcode (Recommended)

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/cellblock.git
   cd cellblock/ios
   ```

2. **Open in Xcode:**

   ```bash
   open CellBlock.xcodeproj
   # OR if using SPM:
   open Package.swift
   ```

3. **Configure Code Signing:**
   - Select the project in Xcode
   - Go to "Signing & Capabilities"
   - Select your development team
   - Xcode will automatically generate provisioning profiles

4. **Update Bundle Identifier:**
   - Change `com.cellblock.app` to your own bundle ID
   - Update in both the project settings and `Info.plist`

5. **Configure Entitlements:**
   - Ensure `CellBlock.entitlements` is included in the target
   - **Important:** Family Controls entitlement requires Apple approval
   - Request at: https://developer.apple.com/contact/request/family-controls-distribution/

6. **Install Dependencies:**
   - If using SPM: Xcode will automatically download dependencies
   - If using CocoaPods:
     ```bash
     pod install
     open CellBlock.xcworkspace
     ```

7. **Update Backend URL:**
   - Open `AuthService.swift`
   - Change `baseURL` from `localhost:3000` to your backend URL
   - Do the same in `WebSocketService.swift`

8. **Build and Run:**
   - Select target device/simulator
   - Press `Cmd + R` or click the Run button

### Option 2: Command Line Build

```bash
# Navigate to iOS directory
cd ios

# Build for simulator
xcodebuild -scheme CellBlock \
  -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
  build

# Run tests
xcodebuild -scheme CellBlock \
  -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
  test

# Build for device (requires code signing)
xcodebuild -scheme CellBlock \
  -destination 'generic/platform=iOS' \
  -configuration Release \
  build
```

## Configuration

### Environment-Specific Settings

Create a `Config.swift` file for environment-specific values:

```swift
enum Config {
    static let apiBaseURL: String = {
        #if DEBUG
        return "http://localhost:3000"
        #else
        return "https://api.cellblock.app"
        #endif
    }()

    static let websocketURL: String = {
        #if DEBUG
        return "ws://localhost:3000"
        #else
        return "wss://api.cellblock.app"
        #endif
    }()
}
```

### Required Permissions

The app requires the following permissions (configured in `Info.plist`):

1. **User Notifications**
   - Key: `NSUserNotificationsUsageDescription`
   - Purpose: Alert when time expires or warden approves requests

2. **Family Controls (Screen Time)**
   - Key: `NSFamilyControlsUsageDescription`
   - Purpose: Block apps when time limit is reached
   - **Requires Apple approval**

3. **Background App Refresh**
   - Configured in `UIBackgroundModes`
   - Purpose: Send heartbeat when app is backgrounded

## Testing

### Simulator Testing

Most features work in the simulator except:

- Push notifications (requires physical device)
- Screen Time API (requires physical device with iOS 16+)
- Device-specific identifiers

To test in simulator:

```bash
# List available simulators
xcrun simctl list devices

# Run on specific simulator
xcodebuild -scheme CellBlock \
  -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
  build test
```

### Physical Device Testing

1. **Connect iPhone/iPad via USB**
2. **Trust the device** (Settings > General > Device Management)
3. **Select device** in Xcode
4. **Run the app** (Cmd + R)
5. **First launch:** Trust the developer certificate on device

### TestFlight Beta Testing

1. **Archive the app:**
   - Product > Archive
   - Wait for build to complete

2. **Upload to App Store Connect:**
   - Window > Organizer
   - Select archive
   - Click "Distribute App"
   - Choose "App Store Connect"

3. **Configure TestFlight:**
   - Log in to App Store Connect
   - Add beta testers
   - Submit for beta review

## Screen Time API Implementation

### Phase 1 (Current - MVP)

- Uses `ManagedSettings` framework
- Blocks "Social Networking" category only
- No Family Controls entitlement required for testing

### Phase 2 (Full Enforcement)

- Requires Family Controls entitlement
- Block all apps except whitelist
- DeviceActivityMonitorExtension for persistence

### Requesting Family Controls Entitlement

1. **Go to:** https://developer.apple.com/contact/request/family-controls-distribution/
2. **Provide:**
   - App description
   - Reason for needing Screen Time API
   - Screenshots of implementation
3. **Wait for approval** (usually 2-4 weeks)

### Testing Without Entitlement

During development, you can test basic functionality:

- Authorization request flow
- UI components
- Shield configuration (limited categories)

Full blocking requires the entitlement on a physical device.

## Troubleshooting

### Common Issues

**1. Code Signing Failed**

- Solution: Check that your Apple ID is added in Xcode Preferences
- Solution: Select correct development team
- Solution: Update bundle identifier to unique value

**2. Screen Time Authorization Fails**

- Cause: Missing entitlement or not on physical device
- Solution: Test on real device with iOS 16+
- Solution: Ensure entitlements file is included

**3. WebSocket Connection Fails**

- Cause: Backend not running or wrong URL
- Solution: Check backend is running on specified port
- Solution: Update `baseURL` in services
- Solution: Check network permissions in Info.plist

**4. Push Notifications Don't Work**

- Cause: Must use physical device
- Solution: Test on real iPhone/iPad
- Solution: Check APNs certificate in backend

**5. Build Fails - Missing Dependencies**

- Solution: Run `xcodebuild -resolvePackageDependencies`
- Solution: Clean build folder (Cmd + Shift + K)
- Solution: Delete derived data

### Clean Build

```bash
# Clean build folder
rm -rf ~/Library/Developer/Xcode/DerivedData/CellBlock-*

# Clean SPM cache
rm -rf .build
rm -rf .swiftpm

# Rebuild
xcodebuild clean build
```

## Debugging

### Enable Verbose Logging

Add to `AppDelegate`:

```swift
func application(_ application: UIApplication, didFinishLaunchingWithOptions...) -> Bool {
    #if DEBUG
    print("CellBlock: Debug mode enabled")
    // Enable network logging
    URLSession.shared.configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
    #endif
    return true
}
```

### View Console Logs

- In Xcode: View > Debug Area > Activate Console (Cmd + Shift + Y)
- Filter logs: Type "CellBlock" in console search

### Network Debugging

Use **Charles Proxy** or **Proxyman** to inspect network traffic:

1. Install proxy tool
2. Configure iOS device to use proxy
3. Install SSL certificate on device
4. View all API requests/responses

## Production Build

### Create Release Build

1. **Update version number:**
   - In Xcode: General > Identity > Version
   - Or edit `Info.plist` manually

2. **Configure Release settings:**
   - Build Settings > Optimization Level: `-O` (Optimize for Speed)
   - Build Settings > Swift Compilation Mode: `Whole Module`

3. **Archive:**

   ```bash
   xcodebuild -scheme CellBlock \
     -configuration Release \
     -archivePath build/CellBlock.xcarchive \
     archive
   ```

4. **Export IPA:**
   ```bash
   xcodebuild -exportArchive \
     -archivePath build/CellBlock.xcarchive \
     -exportPath build \
     -exportOptionsPlist ExportOptions.plist
   ```

### App Store Submission

1. **Prepare metadata** in App Store Connect
2. **Upload build** via Xcode or Transporter
3. **Submit for review**
4. **Wait for approval** (usually 1-3 days)

## CI/CD Setup

### GitHub Actions Example

```yaml
name: iOS Build

on: [push, pull_request]

jobs:
  build:
    runs-on: macos-13
    steps:
      - uses: actions/checkout@v3

      - name: Select Xcode
        run: sudo xcode-select -s /Applications/Xcode_15.0.app

      - name: Build
        run: |
          cd ios
          xcodebuild -scheme CellBlock \
            -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
            build

      - name: Test
        run: |
          cd ios
          xcodebuild -scheme CellBlock \
            -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
            test
```

## Next Steps

1. **Configure backend URL** for your environment
2. **Request Family Controls entitlement** from Apple
3. **Test on physical device** with iOS 16+
4. **Set up TestFlight** for beta testing
5. **Implement analytics** (Firebase, Mixpanel, etc.)
6. **Add crash reporting** (Crashlytics, Sentry)

## Resources

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Screen Time API Documentation](https://developer.apple.com/documentation/screetime)
- [SwiftUI Documentation](https://developer.apple.com/documentation/swiftui)
- [Socket.IO Swift Client](https://github.com/socketio/socket.io-client-swift)

## Support

For issues or questions:

- GitHub Issues: https://github.com/yourusername/cellblock/issues
- Documentation: See ARCHITECTURE.md
- Backend Setup: See ../srv-back/README.md
