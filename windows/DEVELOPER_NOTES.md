# CellBlock Windows Client - Developer Notes

Internal development notes, design decisions, and technical details for maintainers.

## Architecture Overview

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Backend API                          │
│               (NestJS + PostgreSQL)                         │
│            WebSocket Server (Socket.io)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │ WebSocket + REST
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              CellBlock.Service (Windows Service)            │
│  • WebSocket Client                                         │
│  • Hosts File Manager                                       │
│  • Registry Monitor                                         │
│  • Named Pipe Server (IPC)                                  │
│  • Configuration Service                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │ Named Pipe
                       │
┌──────────────────────▼──────────────────────────────────────┐
│               CellBlock.UI (WPF Application)                │
│  • System Tray Icon                                         │
│  • Status Window                                            │
│  • Settings Window                                          │
│  • Named Pipe Client                                        │
└─────────────────────────────────────────────────────────────┘
```

## Design Decisions

### 1. Why Windows Service + Separate UI?

**Decision:** Split into service and UI rather than single application

**Rationale:**
- Service runs as SYSTEM for privileged operations (hosts file, registry)
- UI runs as user for proper tray icon integration
- Service persists even if UI is killed
- Follows Windows best practices for background tasks

**Alternatives Considered:**
- Single elevated application (rejected: poor UX, always runs as admin)
- UI with background worker (rejected: can be killed by user)

### 2. Why Hosts File for MVP?

**Decision:** Use hosts file for domain blocking in Phase 1

**Rationale:**
- Simple to implement
- No kernel driver required
- Works immediately
- Easy to debug and verify

**Limitations:**
- Can't block HTTPS selectively
- Can be bypassed with DNS over HTTPS
- Domain-level only, not URL-level
- Can be manually edited (but monitored)

**Future:** Windows Filtering Platform (WFP) driver for robust blocking

### 3. Why Named Pipes for IPC?

**Decision:** Use Named Pipes for service-UI communication

**Rationale:**
- Native Windows IPC mechanism
- Secure (can restrict access)
- Low overhead
- Bidirectional
- Easy to implement

**Alternatives Considered:**
- HTTP server in service (rejected: overkill, security issues)
- Shared memory (rejected: complex, race conditions)
- Windows Messages (rejected: requires window handle)

### 4. Why DPAPI for Token Storage?

**Decision:** Use Windows Data Protection API for encrypting tokens

**Rationale:**
- Built-in Windows encryption
- Machine-scoped (no user password needed)
- Automatic key management
- Secure against casual inspection

**Limitation:** Admin can still decrypt (acceptable for trust model)

### 5. Why Device Fingerprint = MAC + Machine GUID?

**Decision:** Combine MAC address hash with Windows Machine GUID

**Rationale:**
- MAC address: tied to network hardware
- Machine GUID: persists across network changes
- Hash MAC for privacy
- Unique per machine
- Survives most hardware changes

**Limitation:** Can change if both MAC and machine GUID change (rare)

## Code Organization

### Project Structure

```
CellBlock.Shared/
├── Models/              # API and WebSocket models
├── Configuration/       # Config classes and constants
└── Utilities/           # Helpers (fingerprint, crypto)

CellBlock.Service/
├── Program.cs           # Service host setup
├── CellBlockWorker.cs   # Main background worker
└── Services/            # Service components
    ├── ConfigurationService.cs
    ├── WebSocketService.cs
    ├── HostsFileManager.cs
    ├── RegistryMonitor.cs
    └── NamedPipeServer.cs

CellBlock.UI/
├── App.xaml             # Application resources
├── MainWindow.xaml      # Main status window
├── SettingsWindow.xaml  # Settings dialog
├── TrayIconManager.cs   # System tray management
└── Services/
    └── ServiceClient.cs # Named Pipe client
```

### Naming Conventions

- **Classes:** PascalCase (e.g., `WebSocketService`)
- **Methods:** PascalCase (e.g., `ConnectAsync`)
- **Private fields:** `_camelCase` with underscore prefix
- **Constants:** PascalCase (e.g., `Constants.AppName`)
- **Async methods:** Suffix with `Async`

## Key Implementation Details

### Device Fingerprint Generation

```csharp
// Pseudocode
macAddresses = GetAllNetworkAdapters()
primaryMac = macAddresses.First(IsPhysical && IsUp)
macHash = SHA256(primaryMac).Substring(0, 16)
machineGuid = Registry.Get("HKLM\SOFTWARE\Microsoft\Cryptography\MachineGuid")
fingerprint = $"{macHash}-{machineGuid}"
```

**Fallback:** If MAC or GUID unavailable, generate random GUID (persisted in registry)

### Hosts File Blocking

```csharp
// Blocking strategy
blockedDomains = ["facebook.com", "twitter.com", ...]
whitelistedDomains = ["maps.google.com", "banking.com", ...]

domainsToBlock = blockedDomains
    .Where(d => !whitelistedDomains.Any(w => d.Contains(w)))

// Write to hosts file
foreach (domain in domainsToBlock)
{
    Write("127.0.0.1 {domain} # CellBlock Managed");
    Write("127.0.0.1 www.{domain} # CellBlock Managed");
}

FlushDnsCache();
```

**Marker:** All CellBlock entries include `# CellBlock Managed` for easy cleanup

### WebSocket Heartbeat

```csharp
// Every 60 seconds
heartbeat = {
    deviceId: config.DeviceId,
    isWhitelistedApp: CheckActiveWindow() // TODO: implement
}

socket.Emit("heartbeat", heartbeat);

// Server responds with time_update
OnTimeUpdate(payload) {
    UpdateUI(payload.remainingSeconds);
    if (payload.isLocked && !payload.activeParole) {
        ApplyLock();
    }
}
```

### Registry Monitoring

```csharp
// Poll every 5 seconds
Timer pollingTimer = new Timer(5000);

CheckForTampering() {
    if (!Registry.KeyExists("HKLM\SOFTWARE\CellBlock")) {
        Logger.Warning("Registry key deleted - tampering detected");
        Registry.CreateKey("HKLM\SOFTWARE\CellBlock");
        RaiseAlert();
    }
}
```

**Note:** Native registry watching (RegNotifyChangeKeyValue) not used due to complexity

### Named Pipe Protocol

**Request Format (JSON):**
```json
{
  "command": "get_status" | "set_auth" | "clear_auth",
  "accessToken": "...",  // for set_auth only
  "refreshToken": "...", // for set_auth only
  "userId": "...",       // for set_auth only
  "deviceId": "..."      // for set_auth only
}
```

**Response Format (JSON):**
```json
{
  "success": true,
  "data": { ... },       // command-specific data
  "error": "..."         // if success = false
}
```

## Dependencies

### NuGet Packages

**CellBlock.Shared:**
- `System.Text.Json` - JSON serialization
- `System.Management` - WMI for MAC address

**CellBlock.Service:**
- `Microsoft.Extensions.Hosting` - Service host framework
- `Microsoft.Extensions.Hosting.WindowsServices` - Windows Service support
- `SocketIOClient` - WebSocket client (Socket.io protocol)
- `System.IO.Pipes` - Named Pipe IPC

**CellBlock.UI:**
- `Hardcodet.NotifyIcon.Wpf` - System tray icon support
- `System.IO.Pipes` - Named Pipe IPC

### Why SocketIOClient over Native WebSocket?

**Decision:** Use SocketIOClient library

**Rationale:**
- Backend uses Socket.io (Socket.io protocol, not raw WebSocket)
- Handles reconnection automatically
- Supports auth in handshake
- Event-based API (matches server)

**Alternative:** Could use `System.Net.WebSockets` but would need Socket.io protocol implementation

## Security Considerations

### Threat Model

**Threats In Scope (MVP):**
- Casual user trying to bypass by killing UI
- User manually editing hosts file
- User deleting registry keys

**Threats Out of Scope (Phase 2):**
- Determined attacker with admin rights
- Kernel-level bypasses (safe mode, driver tampering)
- Network-level bypasses (VPN, DNS over HTTPS)

### Security Measures

1. **Service as SYSTEM**
   - Can't be killed by user without admin rights
   - Has full control over hosts file
   - Can monitor registry

2. **Encrypted Token Storage**
   - DPAPI encryption (machine scope)
   - Only LocalSystem and Administrators can decrypt

3. **Registry Monitoring**
   - Detects key deletion
   - Recreates automatically
   - Logs tampering attempts

4. **Hosts File Markers**
   - Easy to identify CellBlock entries
   - Can detect manual editing (future)

5. **Process Isolation**
   - Service independent of UI
   - UI crash doesn't affect enforcement

### Known Vulnerabilities (Accepted for MVP)

1. **Admin Bypass:** User with admin rights can stop service
   - **Mitigation:** Not a target threat for MVP (trust model)

2. **Hosts File Editing:** Admin can edit hosts file directly
   - **Mitigation:** Monitored, but not prevented

3. **DNS Bypass:** User can change DNS to bypass hosts file
   - **Mitigation:** WFP driver in Phase 2

4. **VPN Bypass:** VPN can route around blocks
   - **Mitigation:** WFP driver in Phase 2

## Performance Optimization

### Current Bottlenecks

1. **Hosts File I/O:** Reads/writes entire file
   - **Impact:** ~100ms per lock/unlock
   - **Future:** Incremental updates

2. **DNS Cache Flush:** Spawns ipconfig process
   - **Impact:** ~200ms
   - **Future:** Native API call

3. **Registry Polling:** Checks every 5 seconds
   - **Impact:** Minimal
   - **Future:** Event-driven monitoring

### Memory Profile

- **Service:** ~80 MB baseline
- **UI:** ~120 MB baseline
- **Combined:** ~200 MB total

**Optimization Opportunities:**
- Use WeakReference for cached data
- Dispose WebSocket messages promptly
- Lazy-load UI resources

## Testing Strategy

### Unit Tests (TODO)

**Coverage Target:** 80%

**Key Test Areas:**
- Device fingerprint generation
- Secure storage encryption/decryption
- Hosts file parsing and modification
- WebSocket message handling
- Named Pipe protocol

**Framework:** xUnit or NUnit

### Integration Tests (TODO)

**Scenarios:**
- Service startup and shutdown
- WebSocket connect and reconnect
- UI-Service communication
- Lock/unlock flow

**Environment:** Docker with Windows container (if possible)

### Manual Testing

**Critical Paths:**
- Installation and first run
- Authentication flow
- Lock enforcement
- Service persistence

See [TESTING.md](TESTING.md) for detailed test procedures.

## Known Issues

### Issue #1: Icon Missing

**Status:** Placeholder `.gitkeep` file
**Resolution:** User must provide icon.ico or generate one

### Issue #2: No Active Window Detection

**Status:** Not implemented
**Impact:** `isWhitelistedApp` always false
**Future:** Use Win32 APIs to detect foreground window

### Issue #3: No Token Refresh

**Status:** Tokens not refreshed automatically
**Impact:** User must re-login when tokens expire
**Future:** Implement refresh token flow

### Issue #4: No Login Window

**Status:** No built-in auth UI
**Impact:** Must use web dashboard for login
**Future:** Add WPF login window with OAuth

## Future Enhancements

### Phase 2: WFP Driver

**Windows Filtering Platform Driver:**
- Kernel-level packet filtering
- Can't be bypassed
- Block by IP, port, domain, URL
- Requires driver signing certificate ($$$)

**Implementation:**
- C++ WFP driver
- C# wrapper for driver control
- Integrate with existing service

**Timeline:** 6-8 weeks development + testing

### Phase 3: Machine Learning

**Smart Blocking:**
- Detect productivity vs distraction patterns
- Suggest whitelist additions
- Adaptive time budgets

**Requirements:**
- Usage telemetry
- ML model training
- Privacy considerations

### Phase 4: Browser Extension

**Selective URL Blocking:**
- Block youtube.com/watch but allow youtube.com/education
- Block facebook.com/news but allow facebook.com/marketplace
- Inject warnings before time expires

**Challenges:**
- Must work with driver/hosts file
- Extension store approval
- Keep in sync with service

## Debugging Tips

### Enable Verbose Logging

Modify `appsettings.json` (create if missing):
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "CellBlock": "Trace"
    }
  }
}
```

### View Service Logs

1. Event Viewer: `eventvwr.msc`
2. Navigate to: Windows Logs > Application
3. Filter by source: "CellBlock Service"

### Debug Service in Console Mode

Temporarily run as console app:
```csharp
// In Program.cs
#if DEBUG
builder.Services.AddHostedService<CellBlockWorker>();
#else
builder.Services.AddWindowsService(options =>
{
    options.ServiceName = "CellBlockService";
});
builder.Services.AddHostedService<CellBlockWorker>();
#endif
```

Then run: `CellBlock.Service.exe --console` (requires code change)

### Attach Debugger to Running Service

1. Start service
2. Visual Studio > Debug > Attach to Process
3. Find `CellBlock.Service.exe`
4. Click Attach

### Test WebSocket Locally

Use browser DevTools console:
```javascript
const socket = io('http://localhost:3000', {
  auth: { token: 'your-jwt-token' }
});

socket.on('connect', () => console.log('Connected'));
socket.on('time_update', (data) => console.log('Time update:', data));

socket.emit('heartbeat', { deviceId: 'test', isWhitelistedApp: false });
```

## Build Configurations

### Debug Build

- Includes debug symbols (.pdb)
- No optimizations
- Verbose logging
- Easier debugging

### Release Build

- No debug symbols
- Compiler optimizations
- Info-level logging
- Smaller binaries

### Publish Profiles (Future)

Create publish profiles for:
- Standalone (includes .NET runtime)
- Framework-dependent (requires .NET installed)
- Single-file (all in one EXE)

## Contribution Guidelines

### Code Style

Follow `.editorconfig` settings:
- 4 spaces for indentation
- CRLF line endings
- UTF-8 encoding
- Trim trailing whitespace

### PR Checklist

- [ ] Code compiles without warnings
- [ ] All existing tests pass
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] No secrets or tokens in code
- [ ] Changelog updated

### Review Process

1. Submit PR with clear description
2. Automated checks (CI/CD)
3. Code review by maintainer
4. Address feedback
5. Merge

## License

MIT License - See [LICENSE](../LICENSE)

## Maintainer Notes

**Primary Maintainer:** CellBlock Team

**Contact:** Via GitHub Issues

**Response Time:** Best effort, typically 24-48 hours

## Version History

- **v1.0.0 (Current):** MVP with hosts file blocking, WebSocket sync, system tray
- **v0.9.0 (Beta):** Pre-release testing
- **v0.1.0 (Alpha):** Proof of concept
