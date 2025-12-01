using CellBlock.Shared.Configuration;
using Microsoft.Extensions.Logging;
using System.IO.Pipes;
using System.Text;
using System.Text.Json;

namespace CellBlock.Service.Services;

/// <summary>
/// Named Pipe server for IPC between Service and UI
/// </summary>
public class NamedPipeServer
{
    private readonly ILogger<NamedPipeServer> _logger;
    private readonly ConfigurationService _configService;
    private readonly WebSocketService _websocketService;
    private CancellationTokenSource? _cancellationTokenSource;
    private Task? _listenerTask;

    public NamedPipeServer(
        ILogger<NamedPipeServer> logger,
        ConfigurationService configService,
        WebSocketService websocketService)
    {
        _logger = logger;
        _configService = configService;
        _websocketService = websocketService;
    }

    /// <summary>
    /// Start Named Pipe server
    /// </summary>
    public void Start()
    {
        _cancellationTokenSource = new CancellationTokenSource();
        _listenerTask = Task.Run(() => ListenForConnectionsAsync(_cancellationTokenSource.Token));
        _logger.LogInformation("Named Pipe server started");
    }

    /// <summary>
    /// Stop Named Pipe server
    /// </summary>
    public void Stop()
    {
        _cancellationTokenSource?.Cancel();
        _listenerTask?.Wait(TimeSpan.FromSeconds(5));
        _logger.LogInformation("Named Pipe server stopped");
    }

    private async Task ListenForConnectionsAsync(CancellationToken cancellationToken)
    {
        var config = _configService.GetConfig();

        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                using var pipeServer = new NamedPipeServerStream(
                    config.NamedPipeName,
                    PipeDirection.InOut,
                    1,
                    PipeTransmissionMode.Message);

                _logger.LogDebug("Waiting for pipe connection...");
                await pipeServer.WaitForConnectionAsync(cancellationToken);
                _logger.LogDebug("Pipe client connected");

                await HandleClientAsync(pipeServer, cancellationToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Named Pipe listener");
                await Task.Delay(1000, cancellationToken);
            }
        }
    }

    private async Task HandleClientAsync(NamedPipeServerStream pipeServer, CancellationToken cancellationToken)
    {
        try
        {
            using var reader = new StreamReader(pipeServer, Encoding.UTF8);
            using var writer = new StreamWriter(pipeServer, Encoding.UTF8) { AutoFlush = true };

            while (pipeServer.IsConnected && !cancellationToken.IsCancellationRequested)
            {
                var request = await reader.ReadLineAsync(cancellationToken);
                if (string.IsNullOrEmpty(request))
                {
                    break;
                }

                _logger.LogDebug("Received pipe message: {request}", request);

                var response = await ProcessRequestAsync(request);
                await writer.WriteLineAsync(response);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling pipe client");
        }
    }

    private async Task<string> ProcessRequestAsync(string request)
    {
        try
        {
            using var doc = JsonDocument.Parse(request);
            var root = doc.RootElement;
            var command = root.GetProperty("command").GetString();

            var response = command switch
            {
                "get_status" => GetStatus(),
                "set_auth" => SetAuth(root),
                "clear_auth" => ClearAuth(),
                _ => new { success = false, error = "Unknown command" }
            };

            return JsonSerializer.Serialize(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing pipe request");
            return JsonSerializer.Serialize(new { success = false, error = ex.Message });
        }
    }

    private object GetStatus()
    {
        var config = _configService.GetConfig();
        return new
        {
            success = true,
            data = new
            {
                isAuthenticated = _configService.IsAuthenticated(),
                isConnected = _websocketService.IsConnected(),
                isLocked = _websocketService.IsLocked(),
                userId = config.UserId,
                deviceId = config.DeviceId
            }
        };
    }

    private object SetAuth(JsonElement root)
    {
        try
        {
            var accessToken = root.GetProperty("accessToken").GetString() ?? "";
            var refreshToken = root.GetProperty("refreshToken").GetString() ?? "";
            var userId = root.GetProperty("userId").GetString() ?? "";
            var deviceId = root.TryGetProperty("deviceId", out var deviceIdElement) ? deviceIdElement.GetString() : null;

            _configService.SetAuthTokens(accessToken, refreshToken, userId, deviceId);

            // Connect WebSocket if not already connected
            if (!_websocketService.IsConnected())
            {
                _ = Task.Run(async () =>
                {
                    await Task.Delay(1000); // Small delay to ensure tokens are saved
                    await _websocketService.ConnectAsync();
                });
            }

            return new { success = true };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    private object ClearAuth()
    {
        try
        {
            _configService.ClearAuth();
            _ = Task.Run(async () => await _websocketService.DisconnectAsync());
            return new { success = true };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }
}
