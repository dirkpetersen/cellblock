namespace CellBlock.Shared.Configuration;

/// <summary>
/// Application configuration settings
/// </summary>
public class AppConfig
{
    /// <summary>
    /// Backend API base URL
    /// </summary>
    public string ApiBaseUrl { get; set; } = "http://localhost:3000";

    /// <summary>
    /// WebSocket URL for real-time communication
    /// </summary>
    public string WebSocketUrl { get; set; } = "ws://localhost:3000";

    /// <summary>
    /// Frontend dashboard URL
    /// </summary>
    public string DashboardUrl { get; set; } = "http://localhost:3001";

    /// <summary>
    /// Heartbeat interval in milliseconds (60 seconds)
    /// </summary>
    public int HeartbeatInterval { get; set; } = 60000;

    /// <summary>
    /// Device fingerprint (unique identifier)
    /// </summary>
    public string? DeviceFingerprint { get; set; }

    /// <summary>
    /// Device ID assigned by backend
    /// </summary>
    public string? DeviceId { get; set; }

    /// <summary>
    /// User ID
    /// </summary>
    public string? UserId { get; set; }

    /// <summary>
    /// JWT access token
    /// </summary>
    public string? AccessToken { get; set; }

    /// <summary>
    /// JWT refresh token
    /// </summary>
    public string? RefreshToken { get; set; }

    /// <summary>
    /// Path to hosts file
    /// </summary>
    public string HostsFilePath { get; set; } = @"C:\Windows\System32\drivers\etc\hosts";

    /// <summary>
    /// Path to blocked page HTML
    /// </summary>
    public string BlockedPagePath { get; set; } = @"C:\ProgramData\CellBlock\blocked.html";

    /// <summary>
    /// Named pipe name for IPC between service and UI
    /// </summary>
    public string NamedPipeName { get; set; } = "CellBlockPipe";
}
