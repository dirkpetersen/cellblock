using System.Windows;

namespace CellBlock.UI;

public partial class App : Application
{
    private TrayIconManager? _trayManager;

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        // Initialize tray icon manager
        _trayManager = new TrayIconManager();
        _trayManager.Initialize();

        // Hide main window (we only show it when user clicks tray icon)
        MainWindow?.Hide();
    }

    protected override void OnExit(ExitEventArgs e)
    {
        _trayManager?.Dispose();
        base.OnExit(e);
    }
}
