# CellBlock Windows Client

Cross-platform digital wellbeing client for Windows 10/11. Enforces screen time limits through system-level blocking with real-time synchronization.

## Features

### Core Functionality

- **System Tray Application**: Minimalist UI showing time remaining and status
- **Windows Service**: Runs as SYSTEM for persistent blocking
- **Hosts File Blocking**: Domain-level blocking (MVP)
- **WebSocket Sync**: Real-time communication with backend
- **Device Fingerprinting**: Unique device identification
- **Whitelist Support**: Allow essential domains
- **Lock/Unlock Commands**: Instant enforcement from backend
- **Auto-Start**: Service and UI start on boot/login
- **Tamper Detection**: Registry monitoring for security

### User Interface

- **System Tray Icon**: Always visible, shows status
- **Tooltip**: "X min left" on hover
- **Left-Click**: Opens status window
- **Right-Click Menu**:
  - Open Dashboard (browser)
  - View Remaining Time
  - Settings
  - Exit (disabled when locked)

### Security Features

- **Service Persistence**: Can't be killed without admin rights
- **Encrypted Storage**: DPAPI encryption for tokens
- **Registry Protection**: Monitors and restores deleted keys
- **Process Isolation**: Service independent of UI

## Technology Stack

- **Framework**: .NET 8 Windows
- **UI**: WPF (Windows Presentation Foundation)
- **Service**: .NET Worker with Windows Service hosting
- **Communication**:
  - WebSocket (SocketIOClient for Socket.io protocol)
  - Named Pipes (Service ↔ UI IPC)
  - REST API (HttpClient)
- **Security**: Windows DPAPI, WMI, Registry

## Project Structure

```
windows/
├── CellBlock.sln                    # Visual Studio solution
├── Directory.Build.props            # Shared properties
├── BUILD.md                         # Build instructions
├── INSTALL.md                       # Installation guide
├── TESTING.md                       # Testing procedures
├── DEVELOPER_NOTES.md               # Technical details
├── CellBlock.Shared/                # Shared library
│   ├── Models/                      # API/WebSocket models
│   ├── Configuration/               # Config and constants
│   └── Utilities/                   # Fingerprint, crypto
├── CellBlock.Service/               # Windows Service
│   ├── Program.cs                   # Service host
│   ├── CellBlockWorker.cs           # Main worker
│   └── Services/                    # Components
│       ├── ConfigurationService.cs  # Config management
│       ├── WebSocketService.cs      # Backend connection
│       ├── HostsFileManager.cs      # Domain blocking
│       ├── RegistryMonitor.cs       # Tamper detection
│       └── NamedPipeServer.cs       # IPC server
└── CellBlock.UI/                    # WPF Application
    ├── App.xaml                     # App resources
    ├── MainWindow.xaml              # Status window
    ├── SettingsWindow.xaml          # Settings dialog
    ├── TrayIconManager.cs           # Tray icon
    └── Services/
        └── ServiceClient.cs         # IPC client
```

## Quick Start

### Prerequisites

1. **Windows 10/11** (64-bit)
2. **.NET 8 SDK** (for building) or .NET 8 Runtime (for running)
   - Download: https://dotnet.microsoft.com/download/dotnet/8.0
3. **Administrator Access** (for service installation)
4. **Backend Running** at `http://localhost:3000`

### Build

```bash
cd cellblock/windows
dotnet restore
dotnet build --configuration Release
```

See [BUILD.md](BUILD.md) for detailed build instructions.

### Install

1. **Install Service** (as Administrator):
   ```cmd
   sc create CellBlockService binPath= "C:\Path\To\CellBlock.Service.exe" start= auto
   sc start CellBlockService
   ```

2. **Launch UI**:
   - Double-click `CellBlock.UI.exe`
   - Look for tray icon

3. **Configure Auto-Start**:
   - Use Task Scheduler for UI auto-start
   - Service already set to auto-start

See [INSTALL.md](INSTALL.md) for detailed installation instructions.

## Configuration

### Service Configuration (Registry)

Stored in `HKLM\SOFTWARE\CellBlock`:
- `ApiBaseUrl`: Backend API URL (default: `http://localhost:3000`)
- `WebSocketUrl`: WebSocket URL (default: `ws://localhost:3000`)
- `DashboardUrl`: Frontend URL (default: `http://localhost:3001`)
- `DeviceFingerprint`: Unique device ID
- `AccessToken`: JWT token (encrypted)
- `RefreshToken`: Refresh token (encrypted)

### Hosts File

Location: `C:\Windows\System32\drivers\etc\hosts`

CellBlock entries are marked with `# CellBlock Managed`:
```
# CellBlock Managed - START
127.0.0.1 facebook.com # CellBlock Managed
127.0.0.1 www.facebook.com # CellBlock Managed
# CellBlock Managed - END
```

## Architecture

### Communication Flow

```
Backend API (NestJS)
      ↕ (WebSocket + REST)
CellBlock.Service (Windows Service)
      ↕ (Named Pipe)
CellBlock.UI (WPF App)
```

### Key Components

1. **ConfigurationService**: Manages encrypted config in registry
2. **WebSocketService**: Maintains connection to backend, handles heartbeats
3. **HostsFileManager**: Blocks/unblocks domains
4. **RegistryMonitor**: Detects tampering attempts
5. **NamedPipeServer**: IPC for service-UI communication
6. **TrayIconManager**: System tray integration

## Usage

### For End Users

1. **Install** service and UI (see INSTALL.md)
2. **Login** through web dashboard (authentication)
3. **Configure** whitelist and time budgets in dashboard
4. **Monitor** time remaining via tray icon
5. **Lock/Unlock** controlled by backend based on time budget

### For Developers

1. **Clone** repository
2. **Build** solution (see BUILD.md)
3. **Test** components (see TESTING.md)
4. **Debug** service and UI in Visual Studio
5. **Contribute** via pull requests

## Testing

Run comprehensive manual tests:
```bash
# See TESTING.md for procedures
```

Run unit tests (when available):
```bash
dotnet test CellBlock.sln
```

See [TESTING.md](TESTING.md) for detailed testing procedures.

## Known Limitations (MVP)

1. **Hosts File Only**: Can't block HTTPS selectively
2. **Domain-Level**: Can't block specific URLs
3. **DNS Bypass**: DNS over HTTPS can bypass
4. **Manual Auth**: No built-in login window yet
5. **No Active Window**: Can't detect whitelisted apps

**Future Enhancements** (Phase 2):
- Windows Filtering Platform (WFP) driver for robust blocking
- Built-in login window
- Active window detection
- Automatic token refresh
- Offline mode

## Troubleshooting

### Service Won't Start

```cmd
# Check service status
sc query CellBlockService

# View logs in Event Viewer
eventvwr.msc
```

### UI Not Connecting to Service

1. Verify service is running
2. Check Named Pipe permissions
3. Restart both service and UI

### Hosts File Access Denied

1. Ensure service runs as SYSTEM
2. Check file permissions:
   ```cmd
   icacls "C:\Windows\System32\drivers\etc\hosts"
   ```

See [INSTALL.md](INSTALL.md) and [TESTING.md](TESTING.md) for more troubleshooting.

## Documentation

- **[BUILD.md](BUILD.md)**: Complete build instructions
- **[INSTALL.md](INSTALL.md)**: Installation and configuration guide
- **[TESTING.md](TESTING.md)**: Testing procedures and checklists
- **[DEVELOPER_NOTES.md](DEVELOPER_NOTES.md)**: Architecture and design decisions

## Contributing

Contributions welcome! Please:

1. Read [DEVELOPER_NOTES.md](DEVELOPER_NOTES.md)
2. Follow code style in `.editorconfig`
3. Write tests for new features
4. Update documentation
5. Submit pull request

## License

MIT License - See [../LICENSE](../LICENSE)

## Support

- **Issues**: https://github.com/dirkpetersen/cellblock/issues
- **Discussions**: https://github.com/dirkpetersen/cellblock/discussions

## Version

**Current Version**: 1.0.0 (MVP)

**Release Date**: TBD

**Status**: Complete - Ready for testing on Windows 11 host
