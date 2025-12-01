using CellBlock.Shared.Configuration;
using Hardcodet.Wpf.TaskbarNotification;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;

namespace CellBlock.UI;

/// <summary>
/// Manages system tray icon and menu
/// </summary>
public class TrayIconManager : IDisposable
{
    private TaskbarIcon? _trayIcon;
    private MenuItem? _exitMenuItem;

    public void Initialize()
    {
        _trayIcon = new TaskbarIcon
        {
            Icon = new System.Drawing.Icon("Resources/icon.ico"),
            ToolTipText = "CellBlock - Loading...",
            Visibility = Visibility.Visible
        };

        // Left-click opens main window
        _trayIcon.TrayLeftMouseUp += (s, e) => ShowMainWindow();

        // Create context menu
        var contextMenu = new ContextMenu();

        // Open Dashboard
        var dashboardItem = new MenuItem { Header = "Open Dashboard" };
        dashboardItem.Click += (s, e) => OpenDashboard();
        contextMenu.Items.Add(dashboardItem);

        contextMenu.Items.Add(new Separator());

        // View Remaining Time
        var timeItem = new MenuItem { Header = "View Remaining Time" };
        timeItem.Click += (s, e) => ShowMainWindow();
        contextMenu.Items.Add(timeItem);

        // Settings
        var settingsItem = new MenuItem { Header = "Settings" };
        settingsItem.Click += (s, e) => ShowSettings();
        contextMenu.Items.Add(settingsItem);

        contextMenu.Items.Add(new Separator());

        // Exit (initially enabled)
        _exitMenuItem = new MenuItem { Header = "Exit" };
        _exitMenuItem.Click += (s, e) => ExitApplication();
        contextMenu.Items.Add(_exitMenuItem);

        _trayIcon.ContextMenu = contextMenu;

        // Start updating tooltip
        UpdateTooltipPeriodically();
    }

    private void ShowMainWindow()
    {
        Application.Current.MainWindow?.Show();
        Application.Current.MainWindow?.Activate();
    }

    private void OpenDashboard()
    {
        try
        {
            var dashboardUrl = "http://localhost:3001";
            Process.Start(new ProcessStartInfo
            {
                FileName = dashboardUrl,
                UseShellExecute = true
            });
        }
        catch
        {
            MessageBox.Show("Failed to open dashboard", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    private void ShowSettings()
    {
        var settingsWindow = new SettingsWindow();
        settingsWindow.ShowDialog();
    }

    private void ExitApplication()
    {
        _trayIcon?.Dispose();
        Application.Current.Shutdown();
    }

    private async void UpdateTooltipPeriodically()
    {
        while (_trayIcon != null)
        {
            try
            {
                // TODO: Get actual remaining time from service
                // For now, just show static text
                _trayIcon.ToolTipText = "CellBlock - Click to view status";
                await Task.Delay(TimeSpan.FromSeconds(30));
            }
            catch
            {
                break;
            }
        }
    }

    public void Dispose()
    {
        _trayIcon?.Dispose();
    }
}
