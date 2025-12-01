# CellBlock iOS Client

Swift iOS client for CellBlock digital wellbeing application.

## Tech Stack

- **Language:** Swift 5+
- **UI Framework:** SwiftUI
- **Target:** iOS 16.0+
- **APIs:** Screen Time API (Phase 1), Family Controls (Phase 2)

## Prerequisites

- macOS with Xcode 15+
- iOS 16.0+ device or simulator
- Apple Developer account (for testing on physical devices)

## Project Status

🚧 **Not yet implemented** - This client will be developed after backend and frontend are complete.

## Planned Features

### Phase 1 (MVP)

- Screen Time API integration
- Block "Social" category only
- WebSocket heartbeat system
- Basic time tracking
- Push notifications (APNs)

### Phase 2 (Full Enforcement)

- Family Controls entitlement
- Full whitelist enforcement
- DeviceActivity Monitor Extension
- Shield persistence even when app is killed

## Required Entitlements

- Screen Time API (Phase 1)
- Family Controls (Phase 2 - requires Apple approval)
- Background fetch
- Push notifications

## Development Setup

Instructions will be added when implementation begins.

## Architecture

See [CLAUDE.md](../CLAUDE.md) for detailed iOS architecture and implementation notes.

### Key Components

1. **Main App (SwiftUI)**
   - Dashboard with countdown timer
   - Settings and configuration
   - Whitelist management
   - WebSocket client

2. **DeviceActivity Monitor Extension** (Phase 2)
   - Persistent monitoring
   - Shield application
   - Cannot be disabled without device passcode

## Device Identification

Uses `identifierForVendor` (UUID) as device fingerprint.

## Background Operation

- Background refresh every 15-30 minutes
- WebSocket reconnects on app foreground
- Push notifications wake app for critical updates

## Testing

Testing will be implemented with XCTest.

## Deployment

- TestFlight for beta testing
- App Store for production release

## Contributing

See [CLAUDE.md](../CLAUDE.md) for comprehensive iOS implementation guidelines.
