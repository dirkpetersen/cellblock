# CellBlock Windows Client - Quick Start Guide

Get CellBlock running on your Windows 11 machine in 10 minutes.

## Prerequisites

1. **Backend Running** (in WSL2)

   ```bash
   cd ~/gh/cellblock/srv-back
   npm run dev
   ```

   Should be accessible at `http://localhost:3000`

2. **Frontend Running** (in WSL2)

   ```bash
   cd ~/gh/cellblock/srv-front
   npm run dev
   ```

   Should be accessible at `http://localhost:3001`

3. **.NET 8 SDK** installed on Windows
   - Download: https://dotnet.microsoft.com/download/dotnet/8.0
   - Look for "SDK 8.0.x" for Windows x64
   - Install and restart terminal

## Step 1: Copy Code to Windows

### Option A: Via File Explorer

1. Open File Explorer
2. Navigate to: `\\wsl$\Ubuntu\home\dp\gh\cellblock\windows`
3. Copy the entire `windows` folder to: `C:\Users\[YourUsername]\cellblock-windows`

### Option B: Via PowerShell

```powershell
# In Windows PowerShell
cd C:\Users\$env:USERNAME
robocopy \\wsl$\Ubuntu\home\dp\gh\cellblock\windows cellblock-windows /E
```

## Step 2: Build the Solution

Open PowerShell (regular, not admin) and run:

```powershell
cd C:\Users\$env:USERNAME\cellblock-windows
dotnet restore
dotnet build --configuration Debug
```

**Expected Output:**

```
Build succeeded.
    0 Warning(s)
    0 Error(s)
```

**Common Issues:**

- "dotnet not found" → Install .NET 8 SDK
- "Access denied" → Don't run as admin for build

## Step 3: Test Service (Console Mode)

Open **PowerShell as Administrator**:

```powershell
cd C:\Users\$env:USERNAME\cellblock-windows\CellBlock.Service\bin\Debug\net8.0-windows
.\CellBlock.Service.exe
```

**Expected Output:**

```
info: CellBlock.Service[0]
      CellBlock Service starting at: 11/30/2024 10:00:00 AM
info: CellBlock.Service.Services.ConfigurationService[0]
      Generated device fingerprint: ABC123...
info: CellBlock.Service.Services.RegistryMonitor[0]
      Registry monitoring started
info: CellBlock.Service.Services.NamedPipeServer[0]
      Named Pipe server started
```

**To Stop:** Press `Ctrl+C`

**If It Fails:**

- Check .NET 8 Runtime installed: `dotnet --list-runtimes`
- Check Windows version: `winver` (must be Windows 10 1809+ or Windows 11)
- Check Event Viewer: `eventvwr.msc` → Windows Logs → Application

## Step 4: Test UI Application

Open **regular PowerShell** (not admin):

```powershell
cd C:\Users\$env:USERNAME\cellblock-windows\CellBlock.UI\bin\Debug\net8.0-windows
.\CellBlock.UI.exe
```

**Expected Result:**

- System tray icon appears (bottom-right of screen)
- May need to click up arrow to see hidden icons
- Left-click icon opens status window

**If Tray Icon Doesn't Appear:**

- Check Windows Settings → Personalization → Taskbar
- Ensure "Select which icons appear" is enabled
- Icon will be default Windows icon (square) until you add `icon.ico`

## Step 5: Test Service-UI Communication

With both service and UI running:

1. Open UI status window (left-click tray icon)
2. Click "Refresh" button
3. Status should show:
   - **Red**: "Not Logged In" (expected initially)
   - **Gray**: "Service not responding" (if service isn't running)

**To Test IPC:**

```powershell
# In another PowerShell, test pipe connection
[System.IO.Pipes.NamedPipeClientStream]$pipe = [System.IO.Pipes.NamedPipeClientStream]::new(".", "CellBlockPipe", [System.IO.Pipes.PipeDirection]::InOut)
$pipe.Connect(1000)
$pipe.Dispose()
# If no error, pipe is working
```

## Step 6: Install as Windows Service (Optional)

To run service automatically on boot:

**Open PowerShell as Administrator:**

```powershell
# Use full path to your build output
$servicePath = "C:\Users\$env:USERNAME\cellblock-windows\CellBlock.Service\bin\Debug\net8.0-windows\CellBlock.Service.exe"

# Create service
sc.exe create CellBlockService binPath= $servicePath start= auto

# Start service
sc.exe start CellBlockService

# Verify running
sc.exe query CellBlockService
```

**Expected Output:**

```
STATE              : 4  RUNNING
```

**To Stop/Remove:**

```powershell
sc.exe stop CellBlockService
sc.exe delete CellBlockService
```

## Step 7: Test Hosts File Blocking (Requires Admin)

With service running as Windows Service (or console with admin):

1. **Check Current Hosts File:**

   ```powershell
   notepad C:\Windows\System32\drivers\etc\hosts
   ```

2. **Manually Trigger Lock** (via backend API):

   ```bash
   # In WSL, use curl or Postman
   curl -X POST http://localhost:3000/api/v1/devices/lock \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json"
   ```

3. **Verify Hosts File Updated:**
   - Reload Notepad
   - Look for `# CellBlock Managed` entries
   - Should see blocked domains

4. **Test Blocking:**
   - Open browser
   - Try to visit `http://facebook.com`
   - Should see "Can't reach this page" or timeout

## Step 8: Configure Auto-Start for UI (Optional)

To start UI on login:

**Option 1: Startup Folder**

1. Press `Win+R`, type `shell:startup`, press Enter
2. Create shortcut to `CellBlock.UI.exe` in this folder

**Option 2: Task Scheduler**

1. Open Task Scheduler (`taskschd.msc`)
2. Create new task
3. Trigger: At log on
4. Action: Start program → `CellBlock.UI.exe`
5. Settings: Run whether user is logged on or not

## Verification Checklist

- [ ] .NET 8 SDK installed (`dotnet --version`)
- [ ] Backend running (`curl http://localhost:3000/api/v1/health`)
- [ ] Frontend running (visit `http://localhost:3001`)
- [ ] Windows code copied from WSL
- [ ] Solution builds without errors
- [ ] Service runs in console mode
- [ ] UI launches and tray icon appears
- [ ] Service-UI can communicate
- [ ] (Optional) Service installed as Windows Service
- [ ] (Optional) Hosts file blocking tested

## Troubleshooting

### Build Errors

**"The command 'dotnet' is not recognized"**

- Install .NET 8 SDK from Microsoft
- Restart PowerShell after install

**"Package restore failed"**

```powershell
dotnet nuget locals all --clear
dotnet restore --force
```

### Runtime Errors

**"Unable to load DLL 'hostfxr.dll'"**

- Install .NET 8 Runtime (Desktop)
- Download from same link as SDK

**"Access to the path is denied"**

- For service: Run PowerShell as Administrator
- For UI: Should run as regular user

### Service Issues

**"Service failed to start"**

1. Check Event Viewer: `eventvwr.msc`
2. Look in: Windows Logs → Application
3. Filter by source: "CellBlock Service"

**"The service did not respond in a timely fashion"**

- Service may be crashing on startup
- Run in console mode to see errors
- Check dependencies installed

### UI Issues

**"Tray icon not appearing"**

- Check Task Manager → Details for `CellBlock.UI.exe`
- If running but no icon, restart Explorer:
  ```powershell
  taskkill /f /im explorer.exe
  start explorer.exe
  ```

**"Service not responding"**

- Verify service is running: `sc.exe query CellBlockService`
- Check Named Pipe permissions
- Restart both service and UI

## Next Steps

1. **Add Icon**: Create or download `icon.ico` and place in `CellBlock.UI\Resources\`
2. **Authenticate**: Log in via web dashboard, get JWT tokens
3. **Configure**: Set API URLs in Settings if not using localhost
4. **Test Whitelist**: Add domains in dashboard, verify they're not blocked
5. **Test Locking**: Exhaust time budget, verify domains get blocked

## Get Help

- **Documentation**: See `README.md`, `INSTALL.md`, `TESTING.md`
- **Architecture**: See `DEVELOPER_NOTES.md`
- **Issues**: https://github.com/dirkpetersen/cellblock/issues

## Common Commands Reference

```powershell
# Build
dotnet build --configuration Debug

# Clean and rebuild
dotnet clean
dotnet build --configuration Release

# Run service (console, admin required)
.\CellBlock.Service.exe

# Run UI (regular user)
.\CellBlock.UI.exe

# Check service status
sc.exe query CellBlockService

# Start/stop service
sc.exe start CellBlockService
sc.exe stop CellBlockService

# View hosts file
notepad C:\Windows\System32\drivers\etc\hosts

# Flush DNS cache
ipconfig /flushdns

# Check .NET version
dotnet --version
dotnet --list-runtimes
```

## Success!

If you've completed the checklist, you now have:

- ✅ CellBlock service running
- ✅ UI application in system tray
- ✅ Communication between service and UI
- ✅ Ready to connect to backend

**Next**: Configure authentication and test blocking functionality!
