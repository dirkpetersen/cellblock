using CellBlock.Shared.Configuration;
using CellBlock.Shared.Utilities;
using Microsoft.Extensions.Logging;

namespace CellBlock.Service.Services;

/// <summary>
/// Manages application configuration and secure storage
/// </summary>
public class ConfigurationService
{
    private readonly ILogger<ConfigurationService> _logger;
    private readonly SecureStorage _secureStorage;
    private AppConfig _config;

    public ConfigurationService(ILogger<ConfigurationService> logger)
    {
        _logger = logger;
        _secureStorage = new SecureStorage(Constants.RegistryKeyPath);
        _config = new AppConfig();
    }

    /// <summary>
    /// Initialize configuration from registry
    /// </summary>
    public async Task InitializeAsync()
    {
        _logger.LogInformation("Initializing configuration...");

        // Load configuration from registry
        _config.ApiBaseUrl = _secureStorage.GetValue("ApiBaseUrl") ?? _config.ApiBaseUrl;
        _config.WebSocketUrl = _secureStorage.GetValue("WebSocketUrl") ?? _config.WebSocketUrl;
        _config.DashboardUrl = _secureStorage.GetValue("DashboardUrl") ?? _config.DashboardUrl;
        _config.AccessToken = _secureStorage.GetValue("AccessToken");
        _config.RefreshToken = _secureStorage.GetValue("RefreshToken");
        _config.DeviceId = _secureStorage.GetValue("DeviceId");
        _config.UserId = _secureStorage.GetValue("UserId");

        // Generate or load device fingerprint
        if (string.IsNullOrEmpty(_config.DeviceFingerprint))
        {
            _config.DeviceFingerprint = DeviceFingerprint.Generate();
            _secureStorage.SetValue("DeviceFingerprint", _config.DeviceFingerprint);
            _logger.LogInformation("Generated device fingerprint: {fingerprint}", _config.DeviceFingerprint);
        }
        else
        {
            _config.DeviceFingerprint = _secureStorage.GetValue("DeviceFingerprint");
        }

        await Task.CompletedTask;
    }

    /// <summary>
    /// Get current configuration
    /// </summary>
    public AppConfig GetConfig()
    {
        return _config;
    }

    /// <summary>
    /// Check if user is authenticated
    /// </summary>
    public bool IsAuthenticated()
    {
        return !string.IsNullOrEmpty(_config.AccessToken) && !string.IsNullOrEmpty(_config.UserId);
    }

    /// <summary>
    /// Store authentication tokens
    /// </summary>
    public void SetAuthTokens(string accessToken, string refreshToken, string userId, string? deviceId = null)
    {
        _config.AccessToken = accessToken;
        _config.RefreshToken = refreshToken;
        _config.UserId = userId;

        if (!string.IsNullOrEmpty(deviceId))
        {
            _config.DeviceId = deviceId;
            _secureStorage.SetValue("DeviceId", deviceId);
        }

        _secureStorage.SetValue("AccessToken", accessToken);
        _secureStorage.SetValue("RefreshToken", refreshToken);
        _secureStorage.SetValue("UserId", userId);

        _logger.LogInformation("Authentication tokens stored for user: {userId}", userId);
    }

    /// <summary>
    /// Clear authentication
    /// </summary>
    public void ClearAuth()
    {
        _config.AccessToken = null;
        _config.RefreshToken = null;
        _config.UserId = null;
        _config.DeviceId = null;

        _secureStorage.DeleteValue("AccessToken");
        _secureStorage.DeleteValue("RefreshToken");
        _secureStorage.DeleteValue("UserId");
        _secureStorage.DeleteValue("DeviceId");

        _logger.LogInformation("Authentication cleared");
    }

    /// <summary>
    /// Update configuration value
    /// </summary>
    public void SetConfigValue(string key, string value)
    {
        _secureStorage.SetValue(key, value);
        _logger.LogInformation("Configuration updated: {key}", key);
    }

    /// <summary>
    /// Get configuration value
    /// </summary>
    public string? GetConfigValue(string key)
    {
        return _secureStorage.GetValue(key);
    }
}
