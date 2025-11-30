# CellBlock Windows Client

C# .NET 8 Windows client for CellBlock digital wellbeing application.

## Tech Stack

- **Language:** C# .NET 8
- **UI Framework:** WPF or WinUI 3
- **Target:** Windows 10/11
- **Blocking:** Hosts file (MVP), Windows Filtering Platform (Phase 2)

## Prerequisites

- .NET 8 SDK
- Windows 10/11
- Visual Studio 2022 or Rider
- Administrator privileges (for service installation)

## Project Status

🚧 **Not yet implemented** - This client will be developed after backend and frontend are complete.

## Planned Features

### Phase 1 (MVP)
- Modified hosts file for domain blocking
- System tray application
- Windows Service (runs as SYSTEM)
- WebSocket heartbeat system
- Local "Blocked" page

### Phase 2 (Full Enforcement)
- Windows Filtering Platform (WFP) driver
- Packet-level filtering
- Enhanced tamper detection
- Service auto-recovery

## Architecture

### Components

1. **UI Application** (WPF/WinUI)
   - System tray icon with hover tooltip ("150 min left")
   - Status dashboard window
   - Settings panel
   - Auto-start on Windows boot

2. **Background Service** (Windows Service)
   - Runs as SYSTEM user
   - Network filtering (hosts file or WFP)
   - WebSocket connection to server
   - Heartbeat transmission
   - Registry key monitoring

### Communication

Inter-process communication between UI and Service:
- Named Pipes (recommended)
- Or localhost HTTP API

## Device Identification

Uses combination of:
- MAC address hash (primary network adapter)
- Windows Machine GUID
- Stored as single `device_fingerprint`

## Installation

```bash
# Build the solution
dotnet build -c Release

# Run installer (requires admin)
CellBlockInstaller.msi
```

The installer will:
1. Install UI application
2. Register Windows Service
3. Create firewall exceptions
4. Add auto-start registry key

## Security Features

- Service runs as SYSTEM (cannot be killed by user)
- Configuration stored in encrypted registry keys
- JWT tokens stored using Windows DPAPI
- Registry monitoring for tamper detection
- Service persists even if Task Manager kills UI

## Blocked Page

When user tries to access blocked domain, they see:
- "This site is blocked by CellBlock"
- Remaining time display
- Link to open web dashboard
- Clean, branded design

## Known Limitations

- MVP operates at domain level only (no URL path filtering)
- Safe Mode bypass is acknowledged limitation
- Cannot prevent Live USB boot or new admin account creation

## Testing

Testing will be implemented with xUnit or NUnit.

## Deployment

- MSI installer for distribution
- Code signing certificate (future)
- Auto-update mechanism (future)

## System Tray Context Menu

- Open Dashboard (launches browser)
- View Remaining Time
- Settings
- Exit (disabled when locked)

## Contributing

See [CLAUDE.md](../CLAUDE.md) for comprehensive Windows implementation guidelines.
