namespace CellBlock.Shared.Configuration;

/// <summary>
/// Application-wide constants
/// </summary>
public static class Constants
{
    /// <summary>
    /// Application name
    /// </summary>
    public const string AppName = "CellBlock";

    /// <summary>
    /// Application version
    /// </summary>
    public const string AppVersion = "1.0.0";

    /// <summary>
    /// Windows service name
    /// </summary>
    public const string ServiceName = "CellBlockService";

    /// <summary>
    /// Windows service display name
    /// </summary>
    public const string ServiceDisplayName = "CellBlock Background Service";

    /// <summary>
    /// Windows service description
    /// </summary>
    public const string ServiceDescription = "Manages screen time blocking and synchronization for CellBlock";

    /// <summary>
    /// Registry key for configuration (HKLM)
    /// </summary>
    public const string RegistryKeyPath = @"SOFTWARE\CellBlock";

    /// <summary>
    /// Registry key for monitoring (tamper detection)
    /// </summary>
    public const string RegistryMonitorPath = @"SOFTWARE\CellBlock\Settings";

    /// <summary>
    /// Hosts file marker for CellBlock entries
    /// </summary>
    public const string HostsFileMarker = "# CellBlock Managed";

    /// <summary>
    /// Primary brand color (Teal)
    /// </summary>
    public const string BrandColor = "#0D9488";

    /// <summary>
    /// Minimum time for warnings (seconds)
    /// </summary>
    public const int Warning15Minutes = 900;
    public const int Warning5Minutes = 300;

    /// <summary>
    /// WebSocket reconnect delay (milliseconds)
    /// </summary>
    public const int WebSocketReconnectDelay = 5000;

    /// <summary>
    /// Maximum WebSocket reconnect attempts before exponential backoff
    /// </summary>
    public const int MaxReconnectAttempts = 10;

    /// <summary>
    /// Maximum exponential backoff delay (5 minutes)
    /// </summary>
    public const int MaxBackoffDelay = 300000;
}
