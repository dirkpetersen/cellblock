# CellBlock Windows Client - Build Instructions

This document provides comprehensive instructions for building the CellBlock Windows client application.

## Prerequisites

### Required Software

1. **Windows 10/11** (64-bit)
2. **.NET 8 SDK** or later
   - Download from: https://dotnet.microsoft.com/download/dotnet/8.0
   - Verify installation: `dotnet --version`

3. **Visual Studio 2022** (recommended) or Visual Studio Code
   - Community Edition (free): https://visualstudio.microsoft.com/downloads/
   - Required workloads:
     - .NET desktop development
     - Universal Windows Platform development (optional)

4. **Git** (for cloning repository)
   - Download from: https://git-scm.com/downloads

### Optional Tools

- **Windows Terminal** - Modern terminal for better command-line experience
- **Visual Studio Code** - Lightweight alternative to Visual Studio

## Solution Structure

```
cellblock/windows/
├── CellBlock.sln                    # Visual Studio solution file
├── Directory.Build.props            # Shared project properties
├── .editorconfig                    # Code style configuration
├── BUILD.md                         # This file
├── INSTALL.md                       # Installation instructions
├── CellBlock.Shared/                # Shared library project
│   ├── CellBlock.Shared.csproj
│   ├── Models/                      # Data models
│   ├── Configuration/               # Configuration classes
│   └── Utilities/                   # Utility classes
├── CellBlock.Service/               # Windows Service project
│   ├── CellBlock.Service.csproj
│   ├── Program.cs
│   ├── CellBlockWorker.cs
│   └── Services/                    # Service components
└── CellBlock.UI/                    # WPF UI project
    ├── CellBlock.UI.csproj
    ├── App.xaml
    ├── MainWindow.xaml
    └── Services/                    # UI services
```

## Building from Command Line

### 1. Clone the Repository

```bash
git clone https://github.com/dirkpetersen/cellblock.git
cd cellblock/windows
```

### 2. Restore Dependencies

```bash
dotnet restore CellBlock.sln
```

This will download all required NuGet packages:

- SocketIOClient (WebSocket communication)
- Microsoft.Extensions.Hosting (Service infrastructure)
- Hardcodet.NotifyIcon.Wpf (System tray support)
- System.Management (Device fingerprinting)
- And more...

### 3. Build All Projects

#### Debug Build (Development)

```bash
dotnet build CellBlock.sln --configuration Debug
```

#### Release Build (Production)

```bash
dotnet build CellBlock.sln --configuration Release
```

### 4. Build Individual Projects

If you need to build projects separately:

```bash
# Shared library
dotnet build CellBlock.Shared/CellBlock.Shared.csproj

# Service
dotnet build CellBlock.Service/CellBlock.Service.csproj

# UI
dotnet build CellBlock.UI/CellBlock.UI.csproj
```

### 5. Run Tests (when available)

```bash
dotnet test CellBlock.sln
```

## Building with Visual Studio

### 1. Open Solution

1. Launch Visual Studio 2022
2. Click **File > Open > Project/Solution**
3. Navigate to `cellblock/windows/CellBlock.sln`
4. Click **Open**

### 2. Restore NuGet Packages

Visual Studio should automatically restore packages. If not:

1. Right-click solution in **Solution Explorer**
2. Click **Restore NuGet Packages**

### 3. Set Startup Projects

For development, you'll want to run both Service and UI:

1. Right-click solution in **Solution Explorer**
2. Click **Set Startup Projects**
3. Select **Multiple startup projects**
4. Set both **CellBlock.Service** and **CellBlock.UI** to **Start**

### 4. Build Solution

- **Build All**: Press `Ctrl+Shift+B` or **Build > Build Solution**
- **Clean and Rebuild**: **Build > Rebuild Solution**

### 5. Run Application

- Press `F5` to start with debugging
- Press `Ctrl+F5` to start without debugging

## Build Output

After successful build, binaries will be located in:

```
CellBlock.Service/bin/Debug/net8.0-windows/    (or Release)
CellBlock.UI/bin/Debug/net8.0-windows/         (or Release)
```

### Key Files Generated

- **CellBlock.Service.exe** - Windows Service executable
- **CellBlock.UI.exe** - WPF UI application
- **CellBlock.Shared.dll** - Shared library
- **.dll files** - Dependencies
- **.pdb files** - Debug symbols (Debug build only)

## Creating Application Icon

The UI project references `Resources/icon.ico` which needs to be created:

### Option 1: Use Online Tool

1. Create a 256x256 PNG image with your logo
2. Visit https://cloudconvert.com/png-to-ico
3. Upload PNG and convert to ICO
4. Save as `CellBlock.UI/Resources/icon.ico`

### Option 2: Use Visual Studio

1. Right-click `CellBlock.UI` project
2. **Add > New Item > Icon File**
3. Name it `icon.ico`
4. Move to `Resources` folder
5. Design in Visual Studio icon editor

## Publishing Release Build

To create a distributable release:

### Single-File Executable

```bash
# Service
dotnet publish CellBlock.Service/CellBlock.Service.csproj \
  --configuration Release \
  --runtime win-x64 \
  --self-contained false \
  --output ./publish/service

# UI
dotnet publish CellBlock.UI/CellBlock.UI.csproj \
  --configuration Release \
  --runtime win-x64 \
  --self-contained false \
  --output ./publish/ui
```

### Self-Contained Deployment

Include .NET runtime (larger, but no .NET SDK required):

```bash
dotnet publish CellBlock.Service/CellBlock.Service.csproj \
  --configuration Release \
  --runtime win-x64 \
  --self-contained true \
  --output ./publish/service-standalone

dotnet publish CellBlock.UI/CellBlock.UI.csproj \
  --configuration Release \
  --runtime win-x64 \
  --self-contained true \
  --output ./publish/ui-standalone
```

## Common Build Issues

### Issue: "SDK Not Found"

**Solution:** Install .NET 8 SDK from https://dotnet.microsoft.com/download

### Issue: "Package Restore Failed"

**Solution:**

```bash
dotnet nuget locals all --clear
dotnet restore --force
```

### Issue: "Access Denied" when Building Service

**Solution:** Run Visual Studio or terminal as Administrator

### Issue: Missing System.Management

**Solution:**

```bash
dotnet add CellBlock.Shared package System.Management --version 8.0.0
```

### Issue: WPF Designer Not Loading

**Solution:**

1. Close Visual Studio
2. Delete `.vs` folder in solution directory
3. Reopen Visual Studio
4. Rebuild solution

## Build Optimization

### Release Build Optimizations

The `Directory.Build.props` file configures release builds to:

- Remove debug symbols (`<DebugType>none</DebugType>`)
- Enable compiler optimizations
- Reduce file size

### Custom Build Configurations

To add custom configurations (e.g., Staging):

1. Right-click solution > **Configuration Manager**
2. Create new configuration based on Release
3. Customize settings per project

## Next Steps

After successful build:

1. Review [INSTALL.md](INSTALL.md) for installation instructions
2. Run the service: See "Installing as Windows Service" section
3. Test the UI application
4. Configure API endpoints in Settings

## Troubleshooting

If you encounter build errors:

1. Ensure you're using .NET 8 SDK (`dotnet --version`)
2. Verify all NuGet packages restored successfully
3. Check Windows Event Viewer for detailed errors
4. Review build output for specific error messages
5. Try clean rebuild: `dotnet clean && dotnet build`

## Support

For build issues:

- Check GitHub Issues: https://github.com/dirkpetersen/cellblock/issues
- Review error logs in `bin/Debug` or `bin/Release`
- Consult Visual Studio Error List panel

## Version Information

- **Target Framework:** .NET 8.0 Windows
- **Language Version:** C# Latest
- **Platform:** Windows 10/11 (x64)
- **Solution Version:** 1.0.0
