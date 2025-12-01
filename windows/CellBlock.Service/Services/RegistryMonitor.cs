using CellBlock.Shared.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Win32;

namespace CellBlock.Service.Services;

/// <summary>
/// Monitors registry for tamper detection
/// </summary>
public class RegistryMonitor
{
    private readonly ILogger<RegistryMonitor> _logger;
    private readonly ConfigurationService _configService;
    private RegistryKey? _monitoredKey;
    private Timer? _monitorTimer;

    public event EventHandler<string>? TamperDetected;

    public RegistryMonitor(ILogger<RegistryMonitor> logger, ConfigurationService configService)
    {
        _logger = logger;
        _configService = configService;
    }

    /// <summary>
    /// Start monitoring registry
    /// </summary>
    public void Start()
    {
        try
        {
            // Open or create the monitored registry key
            _monitoredKey = Registry.LocalMachine.CreateSubKey(Constants.RegistryMonitorPath);

            if (_monitoredKey == null)
            {
                _logger.LogError("Failed to open registry key for monitoring");
                return;
            }

            // Start polling timer (check every 5 seconds)
            _monitorTimer = new Timer(CheckForTampering, null, TimeSpan.Zero, TimeSpan.FromSeconds(5));

            _logger.LogInformation("Registry monitoring started");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to start registry monitoring");
        }
    }

    /// <summary>
    /// Stop monitoring registry
    /// </summary>
    public void Stop()
    {
        _monitorTimer?.Dispose();
        _monitorTimer = null;

        _monitoredKey?.Dispose();
        _monitoredKey = null;

        _logger.LogInformation("Registry monitoring stopped");
    }

    private void CheckForTampering(object? state)
    {
        try
        {
            // Check if the registry key still exists
            using var key = Registry.LocalMachine.OpenSubKey(Constants.RegistryKeyPath);
            if (key == null)
            {
                _logger.LogWarning("Registry key deleted - possible tampering detected");
                TamperDetected?.Invoke(this, "Registry key deleted");

                // Recreate the key
                Registry.LocalMachine.CreateSubKey(Constants.RegistryKeyPath);
            }

            // Additional checks can be added here
            // For example: verify specific values haven't been modified
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking for tampering");
        }
    }
}
