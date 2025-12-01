using CellBlock.Shared.Configuration;
using CellBlock.Shared.Models;
using Microsoft.Extensions.Logging;
using SocketIOClient;
using System.Text.Json;

namespace CellBlock.Service.Services;

/// <summary>
/// Manages WebSocket connection to backend server
/// Handles heartbeats and real-time commands
/// </summary>
public class WebSocketService
{
    private readonly ILogger<WebSocketService> _logger;
    private readonly ConfigurationService _configService;
    private readonly HostsFileManager _hostsFileManager;
    private SocketIO? _socket;
    private Timer? _heartbeatTimer;
    private int _reconnectAttempts = 0;
    private bool _isLocked = false;

    public event EventHandler<TimeUpdatePayload>? TimeUpdated;
    public event EventHandler<LockCommandPayload>? LockReceived;
    public event EventHandler<UnlockCommandPayload>? UnlockReceived;
    public event EventHandler<WarningPayload>? WarningReceived;

    public WebSocketService(
        ILogger<WebSocketService> logger,
        ConfigurationService configService,
        HostsFileManager hostsFileManager)
    {
        _logger = logger;
        _configService = configService;
        _hostsFileManager = hostsFileManager;
    }

    /// <summary>
    /// Connect to WebSocket server
    /// </summary>
    public async Task ConnectAsync()
    {
        if (_socket?.Connected == true)
        {
            _logger.LogWarning("WebSocket already connected");
            return;
        }

        var config = _configService.GetConfig();
        var wsUrl = config.WebSocketUrl;

        _logger.LogInformation("Connecting to WebSocket: {url}", wsUrl);

        _socket = new SocketIO(wsUrl, new SocketIOOptions
        {
            Auth = new Dictionary<string, string>
            {
                { "token", config.AccessToken ?? "" },
                { "deviceId", config.DeviceId ?? "" }
            },
            Reconnection = true,
            ReconnectionAttempts = int.MaxValue,
            ReconnectionDelay = Constants.WebSocketReconnectDelay
        });

        // Set up event handlers
        _socket.OnConnected += OnConnected;
        _socket.OnDisconnected += OnDisconnected;
        _socket.OnReconnectAttempt += OnReconnectAttempt;
        _socket.On(WebSocketEvents.TimeUpdate, OnTimeUpdate);
        _socket.On(WebSocketEvents.LockCommand, OnLockCommand);
        _socket.On(WebSocketEvents.UnlockCommand, OnUnlockCommand);
        _socket.On(WebSocketEvents.Warning, OnWarning);
        _socket.On(WebSocketEvents.ConfigUpdate, OnConfigUpdate);
        _socket.On(WebSocketEvents.WhitelistChange, OnWhitelistChange);

        await _socket.ConnectAsync();
    }

    /// <summary>
    /// Disconnect from WebSocket server
    /// </summary>
    public async Task DisconnectAsync()
    {
        _heartbeatTimer?.Dispose();
        _heartbeatTimer = null;

        if (_socket != null)
        {
            await _socket.DisconnectAsync();
            _socket.Dispose();
            _socket = null;
        }

        _logger.LogInformation("WebSocket disconnected");
    }

    private async void OnConnected(object? sender, EventArgs e)
    {
        _logger.LogInformation("WebSocket connected");
        _reconnectAttempts = 0;

        // Start heartbeat timer
        var config = _configService.GetConfig();
        _heartbeatTimer = new Timer(SendHeartbeat, null, TimeSpan.Zero, TimeSpan.FromMilliseconds(config.HeartbeatInterval));
    }

    private void OnDisconnected(object? sender, string e)
    {
        _logger.LogWarning("WebSocket disconnected: {reason}", e);
        _heartbeatTimer?.Dispose();
        _heartbeatTimer = null;
    }

    private void OnReconnectAttempt(object? sender, int attempt)
    {
        _reconnectAttempts = attempt;
        _logger.LogWarning("WebSocket reconnection attempt {attempt}", attempt);
    }

    private async void SendHeartbeat(object? state)
    {
        try
        {
            if (_socket?.Connected != true)
            {
                return;
            }

            var config = _configService.GetConfig();
            var payload = new HeartbeatPayload
            {
                DeviceId = config.DeviceId ?? "",
                IsWhitelistedApp = false // TODO: Implement active window detection
            };

            await _socket.EmitAsync(WebSocketEvents.Heartbeat, payload);
            _logger.LogDebug("Heartbeat sent");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send heartbeat");
        }
    }

    private void OnTimeUpdate(SocketIOResponse response)
    {
        try
        {
            var payload = response.GetValue<TimeUpdatePayload>();
            _logger.LogDebug("Time update received: {remaining}s remaining", payload.RemainingSeconds);
            TimeUpdated?.Invoke(this, payload);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process time update");
        }
    }

    private async void OnLockCommand(SocketIOResponse response)
    {
        try
        {
            var payload = response.GetValue<LockCommandPayload>();
            _logger.LogWarning("Lock command received: {reason}", payload.Reason);

            if (!_isLocked)
            {
                _isLocked = true;
                await _hostsFileManager.ApplyLockAsync();
                _logger.LogInformation("Device locked");
            }

            LockReceived?.Invoke(this, payload);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process lock command");
        }
    }

    private async void OnUnlockCommand(SocketIOResponse response)
    {
        try
        {
            var payload = response.GetValue<UnlockCommandPayload>();
            _logger.LogInformation("Unlock command received: {reason}", payload.Reason);

            if (_isLocked)
            {
                _isLocked = false;
                await _hostsFileManager.RemoveLockAsync();
                _logger.LogInformation("Device unlocked");
            }

            UnlockReceived?.Invoke(this, payload);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process unlock command");
        }
    }

    private void OnWarning(SocketIOResponse response)
    {
        try
        {
            var payload = response.GetValue<WarningPayload>();
            _logger.LogWarning("Warning received: {type} - {message}", payload.Type, payload.Message);
            WarningReceived?.Invoke(this, payload);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process warning");
        }
    }

    private async void OnConfigUpdate(SocketIOResponse response)
    {
        try
        {
            var payload = response.GetValue<ConfigUpdatePayload>();
            _logger.LogInformation("Configuration update received");

            if (payload.Whitelist != null)
            {
                await _hostsFileManager.UpdateWhitelistAsync(payload.Whitelist);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process config update");
        }
    }

    private async void OnWhitelistChange(SocketIOResponse response)
    {
        try
        {
            var payload = response.GetValue<WhitelistChangePayload>();
            _logger.LogInformation("Whitelist change: {action} - {name}", payload.Action, payload.Item.Name);

            // Re-apply lock if currently locked to update blocked domains
            if (_isLocked)
            {
                await _hostsFileManager.ApplyLockAsync();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process whitelist change");
        }
    }

    /// <summary>
    /// Check if WebSocket is connected
    /// </summary>
    public bool IsConnected()
    {
        return _socket?.Connected == true;
    }

    /// <summary>
    /// Get current lock status
    /// </summary>
    public bool IsLocked()
    {
        return _isLocked;
    }
}
