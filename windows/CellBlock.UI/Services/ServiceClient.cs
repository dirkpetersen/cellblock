using CellBlock.Shared.Configuration;
using System.IO.Pipes;
using System.Text;
using System.Text.Json;

namespace CellBlock.UI.Services;

/// <summary>
/// Client for communicating with CellBlock Service via Named Pipes
/// </summary>
public class ServiceClient
{
    private readonly string _pipeName;

    public ServiceClient()
    {
        var config = new AppConfig();
        _pipeName = config.NamedPipeName;
    }

    /// <summary>
    /// Get status from service
    /// </summary>
    public async Task<ServiceStatus?> GetStatusAsync()
    {
        var request = new { command = "get_status" };
        var response = await SendRequestAsync(request);

        if (response != null && response.GetProperty("success").GetBoolean())
        {
            var data = response.GetProperty("data");
            return new ServiceStatus
            {
                IsAuthenticated = data.GetProperty("isAuthenticated").GetBoolean(),
                IsConnected = data.GetProperty("isConnected").GetBoolean(),
                IsLocked = data.GetProperty("isLocked").GetBoolean(),
                UserId = data.TryGetProperty("userId", out var userIdProp) ? userIdProp.GetString() : null,
                DeviceId = data.TryGetProperty("deviceId", out var deviceIdProp) ? deviceIdProp.GetString() : null
            };
        }

        return null;
    }

    /// <summary>
    /// Set authentication tokens
    /// </summary>
    public async Task<bool> SetAuthAsync(string accessToken, string refreshToken, string userId, string? deviceId = null)
    {
        var request = new
        {
            command = "set_auth",
            accessToken,
            refreshToken,
            userId,
            deviceId
        };

        var response = await SendRequestAsync(request);
        return response?.GetProperty("success").GetBoolean() == true;
    }

    /// <summary>
    /// Clear authentication
    /// </summary>
    public async Task<bool> ClearAuthAsync()
    {
        var request = new { command = "clear_auth" };
        var response = await SendRequestAsync(request);
        return response?.GetProperty("success").GetBoolean() == true;
    }

    private async Task<JsonElement?> SendRequestAsync(object request)
    {
        try
        {
            using var pipeClient = new NamedPipeClientStream(".", _pipeName, PipeDirection.InOut);

            // Connect with timeout
            await pipeClient.ConnectAsync(TimeSpan.FromSeconds(5));

            using var writer = new StreamWriter(pipeClient, Encoding.UTF8) { AutoFlush = true };
            using var reader = new StreamReader(pipeClient, Encoding.UTF8);

            // Send request
            var requestJson = JsonSerializer.Serialize(request);
            await writer.WriteLineAsync(requestJson);

            // Read response
            var responseJson = await reader.ReadLineAsync();
            if (string.IsNullOrEmpty(responseJson))
            {
                return null;
            }

            var doc = JsonDocument.Parse(responseJson);
            return doc.RootElement;
        }
        catch
        {
            return null;
        }
    }
}

/// <summary>
/// Service status information
/// </summary>
public class ServiceStatus
{
    public bool IsAuthenticated { get; set; }
    public bool IsConnected { get; set; }
    public bool IsLocked { get; set; }
    public string? UserId { get; set; }
    public string? DeviceId { get; set; }
}
