using CellBlock.UI.Services;
using System.Windows;

namespace CellBlock.UI;

public partial class SettingsWindow : Window
{
    private readonly ServiceClient _serviceClient;

    public SettingsWindow()
    {
        InitializeComponent();
        _serviceClient = new ServiceClient();
        Loaded += SettingsWindow_Loaded;
    }

    private async void SettingsWindow_Loaded(object sender, RoutedEventArgs e)
    {
        await UpdateAuthStatusAsync();
    }

    private async Task UpdateAuthStatusAsync()
    {
        try
        {
            var status = await _serviceClient.GetStatusAsync();
            if (status != null && status.IsAuthenticated)
            {
                AuthStatusText.Text = $"Logged in as User ID: {status.UserId}";
            }
            else
            {
                AuthStatusText.Text = "Not logged in";
            }
        }
        catch
        {
            AuthStatusText.Text = "Unable to check authentication status";
        }
    }

    private void SaveConfigButton_Click(object sender, RoutedEventArgs e)
    {
        // TODO: Implement configuration save
        MessageBox.Show("Configuration saved successfully!", "Success", MessageBoxButton.OK, MessageBoxImage.Information);
    }

    private async void LogoutButton_Click(object sender, RoutedEventArgs e)
    {
        var result = MessageBox.Show(
            "Are you sure you want to log out? You will need to log in again to use CellBlock.",
            "Confirm Logout",
            MessageBoxButton.YesNo,
            MessageBoxImage.Question);

        if (result == MessageBoxResult.Yes)
        {
            try
            {
                await _serviceClient.ClearAuthAsync();
                await UpdateAuthStatusAsync();
                MessageBox.Show("Logged out successfully", "Success", MessageBoxButton.OK, MessageBoxImage.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to log out: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }
    }

    private void CloseButton_Click(object sender, RoutedEventArgs e)
    {
        Close();
    }
}
