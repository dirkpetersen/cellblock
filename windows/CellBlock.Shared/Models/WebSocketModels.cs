using System.Text.Json.Serialization;

namespace CellBlock.Shared.Models;

/// <summary>
/// WebSocket event types
/// </summary>
public static class WebSocketEvents
{
    public const string Heartbeat = "heartbeat";
    public const string TimeUpdate = "time_update";
    public const string LockCommand = "lock_command";
    public const string UnlockCommand = "unlock_command";
    public const string ConfigUpdate = "config_update";
    public const string WhitelistChange = "whitelist_change";
    public const string ParoleGranted = "parole_granted";
    public const string Warning = "warning";
    public const string Error = "error";
}

/// <summary>
/// Heartbeat payload sent to server
/// </summary>
public class HeartbeatPayload
{
    [JsonPropertyName("deviceId")]
    public string DeviceId { get; set; } = string.Empty;

    [JsonPropertyName("isWhitelistedApp")]
    public bool IsWhitelistedApp { get; set; }
}

/// <summary>
/// Time update received from server
/// </summary>
public class TimeUpdatePayload
{
    [JsonPropertyName("remainingSeconds")]
    public int RemainingSeconds { get; set; }

    [JsonPropertyName("weeklyRemaining")]
    public int WeeklyRemaining { get; set; }

    [JsonPropertyName("isLocked")]
    public bool IsLocked { get; set; }

    [JsonPropertyName("activeParole")]
    public ParoleInfo? ActiveParole { get; set; }
}

/// <summary>
/// Active parole information
/// </summary>
public class ParoleInfo
{
    [JsonPropertyName("minutesGranted")]
    public int? MinutesGranted { get; set; }

    [JsonPropertyName("validUntil")]
    public DateTime? ValidUntil { get; set; }

    [JsonPropertyName("reason")]
    public string? Reason { get; set; }
}

/// <summary>
/// Lock command received from server
/// </summary>
public class LockCommandPayload
{
    [JsonPropertyName("reason")]
    public string Reason { get; set; } = string.Empty;

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// Unlock command received from server
/// </summary>
public class UnlockCommandPayload
{
    [JsonPropertyName("reason")]
    public string Reason { get; set; } = string.Empty;

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// Configuration update from server
/// </summary>
public class ConfigUpdatePayload
{
    [JsonPropertyName("whitelist")]
    public List<WhitelistItem>? Whitelist { get; set; }

    [JsonPropertyName("timeBudget")]
    public TimeBudget? TimeBudget { get; set; }
}

/// <summary>
/// Whitelist change notification
/// </summary>
public class WhitelistChangePayload
{
    [JsonPropertyName("action")]
    public string Action { get; set; } = string.Empty; // "added" or "removed"

    [JsonPropertyName("item")]
    public WhitelistItem Item { get; set; } = new();
}

/// <summary>
/// Warning notification (15 min, 5 min)
/// </summary>
public class WarningPayload
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty; // "15_minute" or "5_minute"

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("remainingSeconds")]
    public int RemainingSeconds { get; set; }
}
