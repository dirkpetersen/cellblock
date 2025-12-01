# CellBlock Windows Client - Testing Guide

This document provides comprehensive testing procedures for the CellBlock Windows client.

## Table of Contents

1. [Testing Environment Setup](#testing-environment-setup)
2. [Manual Testing](#manual-testing)
3. [Component Testing](#component-testing)
4. [Integration Testing](#integration-testing)
5. [Security Testing](#security-testing)
6. [Performance Testing](#performance-testing)
7. [Known Limitations](#known-limitations)
8. [Future Testing](#future-testing)

## Testing Environment Setup

### Prerequisites

1. **Backend Server Running**
   ```bash
   cd cellblock/srv-back
   npm run dev
   ```
   Backend should be accessible at `http://localhost:3000`

2. **Frontend Dashboard Running**
   ```bash
   cd cellblock/srv-front
   npm run dev
   ```
   Dashboard should be accessible at `http://localhost:3001`

3. **Test User Account**
   - Create test user through web dashboard
   - Note down credentials for testing

4. **Windows VM (Optional but Recommended)**
   - Use clean Windows 10/11 VM for isolated testing
   - Take snapshot before testing for easy reset

### Build for Testing

```bash
cd cellblock/windows
dotnet build CellBlock.sln --configuration Debug
```

## Manual Testing

### Test 1: Service Installation

**Objective:** Verify service installs and starts correctly

**Steps:**
1. Open Command Prompt as Administrator
2. Navigate to build output directory
3. Install service:
   ```cmd
   sc create CellBlockService binPath= "[full-path]\CellBlock.Service.exe" start= auto
   sc start CellBlockService
   ```
4. Verify service status:
   ```cmd
   sc query CellBlockService
   ```

**Expected Result:**
- Service installs without errors
- Status shows "RUNNING"
- Event Viewer shows "CellBlock Service starting" log

**Pass/Fail:** ___________

---

### Test 2: UI Application Launch

**Objective:** Verify UI launches and tray icon appears

**Steps:**
1. Double-click `CellBlock.UI.exe`
2. Check system tray for CellBlock icon
3. Left-click tray icon to open main window

**Expected Result:**
- UI launches without errors
- Tray icon appears in system tray
- Main window opens showing status

**Pass/Fail:** ___________

---

### Test 3: Service-UI Communication

**Objective:** Verify Named Pipe IPC works

**Steps:**
1. Ensure service is running
2. Launch UI application
3. Click "Refresh" button in main window
4. Observe status updates

**Expected Result:**
- Status shows "Service not responding" → "Authenticated" or "Not Logged In"
- No error messages
- Connection indicator updates

**Pass/Fail:** ___________

---

### Test 4: Device Fingerprint Generation

**Objective:** Verify unique device ID is generated

**Steps:**
1. With service running, check registry:
   ```cmd
   reg query HKLM\SOFTWARE\CellBlock
   ```
2. Note `DeviceFingerprint` value
3. Stop service, delete registry key, restart service
4. Check fingerprint again

**Expected Result:**
- Fingerprint is 32+ character alphanumeric string
- Format: `[16-char-hash]-[machine-guid]`
- Fingerprint persists across restarts
- New fingerprint generated if registry cleared

**Pass/Fail:** ___________

---

### Test 5: Authentication Flow

**Objective:** Verify authentication token storage

**Steps:**
1. Log in via web dashboard
2. Get JWT tokens from browser DevTools (localStorage or network tab)
3. In UI, go to Settings
4. Enter tokens (or use Named Pipe test tool)
5. Verify service shows "Authenticated"

**Expected Result:**
- Tokens stored in encrypted registry
- Service status changes to "Authenticated"
- WebSocket connection attempt starts

**Pass/Fail:** ___________

---

### Test 6: WebSocket Connection

**Objective:** Verify WebSocket connects to backend

**Steps:**
1. Ensure backend is running
2. Authenticate service (Test 5)
3. Check Event Viewer for WebSocket logs
4. Verify in backend logs that device connected

**Expected Result:**
- Event Viewer shows "WebSocket connected"
- Backend logs show new connection
- Heartbeats sent every 60 seconds

**Pass/Fail:** ___________

---

### Test 7: Hosts File Blocking

**Objective:** Verify domains get blocked

**Steps:**
1. Manually trigger lock (via backend API or test script)
2. Open `C:\Windows\System32\drivers\etc\hosts` in Notepad (as Admin)
3. Check for CellBlock entries
4. Try to access blocked domain in browser

**Expected Result:**
- Hosts file contains entries like:
  ```
  # CellBlock Managed - START
  127.0.0.1 facebook.com # CellBlock Managed
  127.0.0.1 www.facebook.com # CellBlock Managed
  # CellBlock Managed - END
  ```
- Blocked domains redirect to 127.0.0.1
- Browser shows "Can't reach this page" or blocked.html

**Pass/Fail:** ___________

---

### Test 8: Whitelist Functionality

**Objective:** Verify whitelisted domains remain accessible

**Steps:**
1. Add `google.com` to whitelist via dashboard
2. Trigger lock
3. Check hosts file
4. Try to access google.com

**Expected Result:**
- google.com NOT in hosts file
- google.com remains accessible
- Non-whitelisted sites still blocked

**Pass/Fail:** ___________

---

### Test 9: Lock Command

**Objective:** Verify lock command from backend

**Steps:**
1. With WebSocket connected, trigger lock via backend
2. Check service logs
3. Verify hosts file updated
4. Try to access blocked site

**Expected Result:**
- Service receives lock command
- Hosts file immediately updated
- Sites become inaccessible within 5 seconds

**Pass/Fail:** ___________

---

### Test 10: Unlock Command

**Objective:** Verify unlock command clears blocks

**Steps:**
1. With device locked (Test 9)
2. Trigger unlock via backend (parole grant)
3. Check hosts file
4. Try to access previously blocked site

**Expected Result:**
- Service receives unlock command
- CellBlock entries removed from hosts file
- Sites become accessible again

**Pass/Fail:** ___________

---

### Test 11: Registry Monitoring

**Objective:** Verify tamper detection

**Steps:**
1. With service running, delete registry key:
   ```cmd
   reg delete HKLM\SOFTWARE\CellBlock /f
   ```
2. Wait 10 seconds
3. Check if registry key recreated

**Expected Result:**
- Registry key automatically recreated
- Event Viewer shows "Registry key deleted - possible tampering detected"

**Pass/Fail:** ___________

---

### Test 12: Service Persistence

**Objective:** Verify service survives UI termination

**Steps:**
1. Launch both service and UI
2. Kill UI via Task Manager
3. Check service status
4. Verify hosts file blocking still active

**Expected Result:**
- Service continues running
- Blocking remains active
- Service logs show no interruption

**Pass/Fail:** ___________

---

### Test 13: System Restart

**Objective:** Verify auto-start functionality

**Steps:**
1. Install service and UI startup task
2. Restart computer
3. After login, check service status
4. Verify UI tray icon appears

**Expected Result:**
- Service starts automatically
- UI starts on login
- WebSocket reconnects automatically

**Pass/Fail:** ___________

---

### Test 14: DNS Cache Flushing

**Objective:** Verify DNS cache clears after hosts modification

**Steps:**
1. Access a domain (e.g., facebook.com)
2. Trigger lock
3. Immediately try to access same domain

**Expected Result:**
- DNS cache flushed automatically
- Domain becomes inaccessible within seconds
- No cached IP allows access

**Pass/Fail:** ___________

---

### Test 15: Time Display

**Objective:** Verify time remaining displayed correctly

**Steps:**
1. With WebSocket connected, check main window
2. Note time remaining
3. Wait for heartbeat (60 seconds)
4. Check if time decremented

**Expected Result:**
- Time displayed in readable format (e.g., "120 min")
- Updates after each heartbeat
- Weekly time also shown

**Pass/Fail:** ___________

---

## Component Testing

### Shared Library Tests

```csharp
// Test device fingerprint generation
var fingerprint = DeviceFingerprint.Generate();
Assert.IsNotNull(fingerprint);
Assert.IsTrue(fingerprint.Length >= 32);
Assert.Contains("-", fingerprint);

// Test secure storage
var storage = new SecureStorage();
storage.SetValue("test", "value123");
var retrieved = storage.GetValue("test");
Assert.AreEqual("value123", retrieved);
```

### Service Component Tests

```csharp
// Test ConfigurationService
var config = new ConfigurationService(logger);
await config.InitializeAsync();
Assert.IsFalse(config.IsAuthenticated()); // Initially not authenticated

config.SetAuthTokens("token123", "refresh456", "user789");
Assert.IsTrue(config.IsAuthenticated());

// Test HostsFileManager
var hostsManager = new HostsFileManager(logger, config);
await hostsManager.ApplyLockAsync();
var blocked = hostsManager.GetBlockedDomains();
Assert.IsTrue(blocked.Count > 0);
```

## Integration Testing

### End-to-End Flow

**Test Scenario:** Complete user journey from installation to lock

1. Install service
2. Launch UI
3. Authenticate user
4. Wait for WebSocket connection
5. Add whitelist items
6. Exhaust time budget
7. Verify lock applied
8. Grant parole
9. Verify unlock

**Expected Duration:** 15-20 minutes

**Automation:** Could be scripted with PowerShell + Selenium

## Security Testing

### Test 1: Token Encryption

**Verify:** Tokens in registry are encrypted

```cmd
reg query HKLM\SOFTWARE\CellBlock /v AccessToken
```

Should show garbled base64, not plain JWT.

### Test 2: Privilege Escalation

**Verify:** Normal user can't modify registry

1. Run registry editor as normal user
2. Try to modify `HKLM\SOFTWARE\CellBlock`

Should fail with "Access Denied".

### Test 3: Service Account

**Verify:** Service runs as SYSTEM

```cmd
sc qc CellBlockService
```

Should show `SERVICE_START_NAME: LocalSystem`.

## Performance Testing

### CPU Usage

**Test:** Monitor CPU usage over 1 hour
**Expected:** <1% average

### Memory Usage

**Test:** Monitor RAM usage over 1 hour
**Expected:**
- Service: <100 MB
- UI: <150 MB

### Network Usage

**Test:** Monitor network traffic
**Expected:** ~60 KB/hour (heartbeats only)

### Disk I/O

**Test:** Monitor disk writes
**Expected:** Minimal, only on lock/unlock

## Known Limitations

### MVP Phase Limitations

1. **Hosts File Only**
   - Can't block HTTPS by domain without certificate hijacking
   - Can't block by URL path (e.g., allow youtube.com/education)
   - DNS over HTTPS bypasses hosts file

2. **No Active Window Detection**
   - `isWhitelistedApp` always false
   - Can't detect which app is active

3. **Manual Authentication**
   - No login window in UI
   - Must manually get tokens from web dashboard

4. **Limited Error Recovery**
   - WebSocket reconnects but may lose state
   - No automatic token refresh

5. **No Offline Mode**
   - Requires backend connection to function
   - Can't enforce blocks without server

### Future Enhancements

1. **Windows Filtering Platform (WFP) Driver**
   - Kernel-level packet filtering
   - Can't be bypassed by DNS changes
   - Block HTTPS traffic

2. **Login Window**
   - Built-in authentication UI
   - OAuth integration

3. **Active Window Monitoring**
   - Detect whitelisted applications
   - More accurate time tracking

4. **Offline Mode**
   - Cache policy locally
   - Enforce blocks without backend

5. **Automatic Updates**
   - Check for new versions
   - Auto-download and install

## Future Testing

### When WFP Driver Implemented

- Test kernel-level blocking
- Verify can't bypass with VPN
- Test DNS over HTTPS blocking
- Verify performance impact

### When Login Window Implemented

- Test OAuth flow
- Test token refresh
- Test error handling
- Test multi-factor auth

### When Offline Mode Implemented

- Test policy caching
- Test enforcement without network
- Test sync on reconnect

## Regression Testing

After any code changes, re-run:

1. Service installation (Test 1)
2. WebSocket connection (Test 6)
3. Hosts file blocking (Test 7)
4. Lock/unlock commands (Test 9-10)
5. Service persistence (Test 12)

## Bug Reporting

When reporting bugs, include:

1. Windows version
2. .NET version
3. Service and UI version
4. Logs from Event Viewer
5. Registry snapshot
6. Hosts file content
7. Steps to reproduce
8. Expected vs actual behavior

## Test Coverage Goals

- **Unit Tests:** 80%+ code coverage
- **Integration Tests:** All critical paths
- **Manual Tests:** All user-facing features
- **Security Tests:** All privilege boundaries
- **Performance Tests:** All long-running operations

## Testing Tools

- **Visual Studio Test Explorer:** Run unit tests
- **Windows Event Viewer:** Check service logs
- **Process Monitor (Sysinternals):** Monitor file/registry access
- **Wireshark:** Capture WebSocket traffic
- **Task Manager:** Monitor resource usage
- **Registry Editor:** Verify configuration
- **PowerShell:** Automate test scenarios
