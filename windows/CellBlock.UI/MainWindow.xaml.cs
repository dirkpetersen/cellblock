using CellBlock.UI.Services;
using System.Diagnostics;
using System.Windows;
using System.Windows.Media;

namespace CellBlock.UI;

public partial class MainWindow : Window
{
    private readonly ServiceClient _serviceClient;
    private System.Windows.Threading.DispatcherTimer? _updateTimer;

    public MainWindow()
    {
        InitializeComponent();
        _serviceClient = new ServiceClient();
        Loaded += MainWindow_Loaded;
    }

    private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
    {
        await UpdateStatusAsync();

        // Start periodic updates every 5 seconds
        _updateTimer = new System.Windows.Threading.DispatcherTimer
        {
            Interval = TimeSpan.FromSeconds(5)
        };
        _updateTimer.Tick += async (s, args) => await UpdateStatusAsync();
        _updateTimer.Start();
    }

    private async Task UpdateStatusAsync()
    {
        try
        {
            var status = await _serviceClient.GetStatusAsync();

            if (status != null)
            {
                // Update connection status
                if (status.IsConnected)
                {
                    StatusIndicator.Fill = new SolidColorBrush(Color.FromRgb(34, 197, 94)); // Green
                    StatusText.Text = "Connected";
                    ConnectionStatus.Text = "Syncing with server";
                }
                else if (status.IsAuthenticated)
                {
                    StatusIndicator.Fill = new SolidColorBrush(Color.FromRgb(251, 146, 60)); // Orange
                    StatusText.Text = "Authenticated";
                    ConnectionStatus.Text = "Connecting to server...";
                }
                else
                {
                    StatusIndicator.Fill = new SolidColorBrush(Color.FromRgb(239, 68, 68)); // Red
                    StatusText.Text = "Not Logged In";
                    ConnectionStatus.Text = "Please log in to activate CellBlock";
                }

                // Update lock status
                if (status.IsLocked)
                {
                    StatusText.Text = "Locked";
                    StatusIndicator.Fill = new SolidColorBrush(Color.FromRgb(239, 68, 68)); // Red
                }
            }
            else
            {
                StatusIndicator.Fill = new SolidColorBrush(Color.FromRgb(156, 163, 175)); // Gray
                StatusText.Text = "Service not responding";
                ConnectionStatus.Text = "Unable to connect to background service";
            }
        }
        catch (Exception ex)
        {
            StatusIndicator.Fill = new SolidColorBrush(Color.FromRgb(239, 68, 68)); // Red
            StatusText.Text = "Error";
            ConnectionStatus.Text = $"Error: {ex.Message}";
        }
    }

    private async void RefreshButton_Click(object sender, RoutedEventArgs e)
    {
        await UpdateStatusAsync();
    }

    private void OpenDashboardButton_Click(object sender, RoutedEventArgs e)
    {
        try
        {
            // Open dashboard in default browser
            var dashboardUrl = "http://localhost:3001";
            Process.Start(new ProcessStartInfo
            {
                FileName = dashboardUrl,
                UseShellExecute = true
            });
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Failed to open dashboard: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    private void SettingsButton_Click(object sender, RoutedEventArgs e)
    {
        var settingsWindow = new SettingsWindow();
        settingsWindow.ShowDialog();
    }

    protected override void OnClosing(System.ComponentModel.CancelEventArgs e)
    {
        // Minimize to tray instead of closing
        e.Cancel = true;
        Hide();
    }

    protected override void OnClosed(EventArgs e)
    {
        _updateTimer?.Stop();
        base.OnClosed(e);
    }
}
