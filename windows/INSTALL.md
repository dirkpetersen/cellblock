# CellBlock Windows Client - Installation Guide

This document provides step-by-step instructions for installing and configuring the CellBlock Windows client.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Pre-Installation Checklist](#pre-installation-checklist)
3. [Installation Steps](#installation-steps)
4. [Service Installation](#service-installation)
5. [UI Application Setup](#ui-application-setup)
6. [Configuration](#configuration)
7. [First-Time Setup](#first-time-setup)
8. [Verification](#verification)
9. [Troubleshooting](#troubleshooting)
10. [Uninstallation](#uninstallation)

## System Requirements

### Minimum Requirements

- **Operating System:** Windows 10 64-bit (version 1809 or later) or Windows 11
- **RAM:** 4 GB
- **Disk Space:** 200 MB free space
- **.NET Runtime:** .NET 8.0 Runtime (or .NET 8 SDK)
- **Permissions:** Administrator access for service installation

### Recommended Requirements

- **Operating System:** Windows 11 64-bit
- **RAM:** 8 GB or more
- **Disk Space:** 500 MB free space
- **Network:** Stable internet connection for sync

### Prerequisites

1. **.NET 8 Runtime** (if not using self-contained build)
   - Download: https://dotnet.microsoft.com/download/dotnet/8.0
   - Look for "Download .NET Desktop Runtime 8.0"

2. **Administrator Access**
   - Required for service installation
   - Required for hosts file modification

3. **Backend Server Running**
   - CellBlock backend API must be accessible
   - Default: `http://localhost:3000`

## Pre-Installation Checklist

Before installing, ensure:

- [ ] You have administrator privileges
- [ ] .NET 8 Runtime is installed
- [ ] Backend server is running and accessible
- [ ] No other security software conflicts (firewalls, antivirus)
- [ ] Windows is up to date

## Installation Steps

### Step 1: Download or Build

#### Option A: Download Release Build (Recommended)

1. Download latest release from GitHub
2. Extract ZIP to desired location (e.g., `C:\Program Files\CellBlock`)

#### Option B: Build from Source

Follow instructions in [BUILD.md](BUILD.md) to build from source.

### Step 2: Prepare Installation Directory

1. Create installation directory:

   ```
   C:\Program Files\CellBlock\
   ```

2. Create data directory:

   ```
   C:\ProgramData\CellBlock\
   ```

3. Copy build output to installation directory:
   - Copy `CellBlock.Service.exe` and dependencies
   - Copy `CellBlock.UI.exe` and dependencies
   - Copy `blocked.html` to `C:\ProgramData\CellBlock\`

## Service Installation

The CellBlock Service must run as a Windows Service with SYSTEM privileges.

### Option 1: Using sc.exe (Command-Line)

1. **Open Command Prompt as Administrator**
   - Press `Win + X`
   - Select "Command Prompt (Admin)" or "Windows Terminal (Admin)"

2. **Create the Service**

   ```cmd
   sc create CellBlockService binPath= "C:\Program Files\CellBlock\CellBlock.Service.exe" start= auto
   sc description CellBlockService "CellBlock Background Service - Manages screen time blocking and synchronization"
   ```

3. **Start the Service**

   ```cmd
   sc start CellBlockService
   ```

4. **Verify Service is Running**

   ```cmd
   sc query CellBlockService
   ```

   Should show `STATE: 4 RUNNING`

### Option 2: Using PowerShell

```powershell
# Run PowerShell as Administrator
New-Service -Name "CellBlockService" `
            -BinaryPathName "C:\Program Files\CellBlock\CellBlock.Service.exe" `
            -DisplayName "CellBlock Background Service" `
            -Description "Manages screen time blocking and synchronization for CellBlock" `
            -StartupType Automatic

Start-Service -Name "CellBlockService"
Get-Service -Name "CellBlockService"
```

### Service Configuration

The service will:

- Start automatically on Windows boot
- Run as LocalSystem account
- Create registry entries in `HKLM\SOFTWARE\CellBlock`
- Monitor and modify hosts file
- Listen on Named Pipe: `\\.\pipe\CellBlockPipe`

### Verify Service Logs

Check Windows Event Viewer:

1. Open Event Viewer (`eventvwr.msc`)
2. Navigate to: **Windows Logs > Application**
3. Filter by source: "CellBlock Service"
4. Look for successful startup messages

## UI Application Setup

### Auto-Start Configuration

To run the UI automatically on login:

#### Option 1: Using Task Scheduler (Recommended)

1. Open Task Scheduler (`taskschd.msc`)
2. Click **Create Task** (not "Create Basic Task")
3. **General Tab:**
   - Name: `CellBlock UI`
   - Description: `CellBlock System Tray Application`
   - Check "Run whether user is logged on or not"
   - Check "Run with highest privileges"

4. **Triggers Tab:**
   - Click **New**
   - Begin the task: **At log on**
   - Specific user: `[Your Username]`
   - Click **OK**

5. **Actions Tab:**
   - Click **New**
   - Action: **Start a program**
   - Program/script: `C:\Program Files\CellBlock\CellBlock.UI.exe`
   - Click **OK**

6. **Conditions Tab:**
   - Uncheck "Start the task only if the computer is on AC power"

7. **Settings Tab:**
   - Check "Allow task to be run on demand"
   - Check "If the task fails, restart every: 1 minute"

8. Click **OK** and enter your password if prompted

#### Option 2: Using Startup Folder

1. Press `Win + R`
2. Type `shell:startup` and press Enter
3. Create shortcut to `CellBlock.UI.exe` in this folder

### Manual Launch

Simply double-click `CellBlock.UI.exe` to start the tray application.

## Configuration

### Service Configuration

Configuration is stored in Windows Registry:

- Key: `HKLM\SOFTWARE\CellBlock`
- Values are encrypted using Windows DPAPI

#### Default Values

- **ApiBaseUrl:** `http://localhost:3000`
- **WebSocketUrl:** `ws://localhost:3000`
- **DashboardUrl:** `http://localhost:3001`
- **HeartbeatInterval:** 60000 (60 seconds)

#### Changing Server URLs

Use the Settings window in the UI application or modify registry:

```powershell
# Set custom API URL (requires admin)
Set-ItemProperty -Path "HKLM:\SOFTWARE\CellBlock" -Name "ApiBaseUrl" -Value "https://api.cellblock.app"
```

### Hosts File Location

Default: `C:\Windows\System32\drivers\etc\hosts`

The service must have write access to this file.

## First-Time Setup

### 1. Launch UI Application

1. Start `CellBlock.UI.exe`
2. Look for tray icon in system tray (bottom-right)
3. If you don't see it, click the up arrow to show hidden icons

### 2. Login (Currently Manual)

For MVP, authentication must be done through:

1. Open web dashboard: `http://localhost:3001`
2. Log in with your credentials
3. Get JWT tokens from browser developer tools
4. Use Settings > Authentication in UI to configure

**Note:** In production, this will be streamlined with a login window.

### 3. Device Registration

On first connection:

- Service generates device fingerprint automatically
- Device registers with backend
- Device ID is stored in registry

### 4. Verify Connection

1. Right-click tray icon
2. Select "View Remaining Time"
3. Check status indicator:
   - **Green:** Connected and syncing
   - **Orange:** Authenticated but not connected
   - **Red:** Not logged in

## Verification

### Check Service Status

```cmd
sc query CellBlockService
```

Should show `RUNNING`

### Check UI Status

1. Look for system tray icon
2. Left-click to open status window
3. Verify "Connected" status

### Check WebSocket Connection

In Service logs (Event Viewer), look for:

```
WebSocket connected
Heartbeat sent
Time update received
```

### Check Hosts File Blocking

1. Open: `C:\Windows\System32\drivers\etc\hosts`
2. Look for entries marked with `# CellBlock Managed`
3. When locked, blocked domains should appear

### Test Blocking

1. Ensure time budget is exhausted (or manually lock)
2. Try to access blocked domain (e.g., `facebook.com`)
3. Should show blocked page

## Troubleshooting

### Service Won't Start

**Symptoms:** Service fails to start, shows "ERROR" state

**Solutions:**

1. Check Event Viewer for detailed error
2. Verify .NET 8 Runtime is installed
3. Ensure installation path is correct
4. Run as administrator:
   ```cmd
   sc start CellBlockService
   ```

### UI Shows "Service Not Responding"

**Symptoms:** UI can't connect to service

**Solutions:**

1. Verify service is running: `sc query CellBlockService`
2. Check Named Pipe permissions
3. Restart service:
   ```cmd
   sc stop CellBlockService
   sc start CellBlockService
   ```

### "Access Denied" on Hosts File

**Symptoms:** Service logs show access denied errors

**Solutions:**

1. Verify service is running as LocalSystem
2. Check hosts file permissions:
   ```cmd
   icacls "C:\Windows\System32\drivers\etc\hosts"
   ```
3. Grant SYSTEM full control if needed:
   ```cmd
   icacls "C:\Windows\System32\drivers\etc\hosts" /grant SYSTEM:F
   ```

### WebSocket Won't Connect

**Symptoms:** Status shows "Authenticated but not connected"

**Solutions:**

1. Verify backend is running and accessible
2. Check firewall settings
3. Test WebSocket URL in browser DevTools
4. Verify authentication tokens are valid

### Device Fingerprint Issues

**Symptoms:** "Failed to generate device fingerprint"

**Solutions:**

1. Run UI as Administrator (once)
2. Check if WMI service is running:
   ```cmd
   sc query Winmgmt
   ```
3. Manually set fingerprint in registry (admin required)

### Tray Icon Not Appearing

**Symptoms:** UI runs but no tray icon

**Solutions:**

1. Check Windows Settings > Personalization > Taskbar
2. Ensure "Select which icons appear on the taskbar" includes CellBlock
3. Restart Explorer.exe:
   ```cmd
   taskkill /f /im explorer.exe
   start explorer.exe
   ```

## Uninstallation

### 1. Stop and Remove Service

```cmd
# Stop service
sc stop CellBlockService

# Delete service
sc delete CellBlockService
```

### 2. Remove UI Startup Entry

- Remove from Task Scheduler or Startup folder

### 3. Clean Up Files

Delete installation directory:

```
C:\Program Files\CellBlock\
C:\ProgramData\CellBlock\
```

### 4. Clean Registry

```cmd
reg delete "HKLM\SOFTWARE\CellBlock" /f
```

### 5. Clean Hosts File

1. Open `C:\Windows\System32\drivers\etc\hosts` as Administrator
2. Remove all lines containing `# CellBlock Managed`
3. Save and flush DNS:
   ```cmd
   ipconfig /flushdns
   ```

## Advanced Configuration

### Running Service Under Different Account

By default, service runs as LocalSystem. To use different account:

```cmd
sc config CellBlockService obj= "DOMAIN\Username" password= "password"
```

### Custom Named Pipe Name

Modify `AppConfig.cs` and rebuild, or use registry:

```powershell
Set-ItemProperty -Path "HKLM:\SOFTWARE\CellBlock" -Name "NamedPipeName" -Value "CustomPipeName"
```

### Debugging Service

To run service in console mode (for debugging):

```cmd
CellBlock.Service.exe --console
```

(Note: Requires code modification to support console mode)

## Security Considerations

1. **Service runs as SYSTEM:** Has full access to hosts file and registry
2. **Tokens encrypted:** JWT tokens encrypted with DPAPI (machine scope)
3. **Registry monitoring:** Detects tampering attempts
4. **Process protection:** Service persists even if UI is killed

## Performance Impact

- **CPU:** Minimal (<1% on idle)
- **RAM:** ~50-100 MB (service + UI)
- **Network:** ~1 KB/minute (heartbeat traffic)
- **Disk:** Negligible (registry writes only)

## Support

For installation issues:

- Check Event Viewer: `eventvwr.msc`
- Review service logs
- GitHub Issues: https://github.com/dirkpetersen/cellblock/issues

## Next Steps

After successful installation:

1. Configure whitelist in web dashboard
2. Set time budgets
3. Invite warden (if using enforcement model)
4. Test blocking functionality
5. Review usage analytics

## Version History

- **v1.0.0:** Initial release with MVP features
  - Hosts file blocking
  - WebSocket sync
  - System tray UI
  - Named Pipe IPC
