using CellBlock.Service.Services;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CellBlock.Service;

/// <summary>
/// Main background worker for CellBlock Windows Service
/// Coordinates all service components
/// </summary>
public class CellBlockWorker : BackgroundService
{
    private readonly ILogger<CellBlockWorker> _logger;
    private readonly ConfigurationService _configService;
    private readonly WebSocketService _websocketService;
    private readonly RegistryMonitor _registryMonitor;
    private readonly NamedPipeServer _pipeServer;
    private readonly HostsFileManager _hostsFileManager;

    public CellBlockWorker(
        ILogger<CellBlockWorker> logger,
        ConfigurationService configService,
        WebSocketService websocketService,
        RegistryMonitor registryMonitor,
        NamedPipeServer pipeServer,
        HostsFileManager hostsFileManager)
    {
        _logger = logger;
        _configService = configService;
        _websocketService = websocketService;
        _registryMonitor = registryMonitor;
        _pipeServer = pipeServer;
        _hostsFileManager = hostsFileManager;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("CellBlock Service starting at: {time}", DateTimeOffset.Now);

        try
        {
            // Initialize configuration
            await _configService.InitializeAsync();
            _logger.LogInformation("Configuration initialized");

            // Start registry monitoring for tamper detection
            _registryMonitor.Start();
            _logger.LogInformation("Registry monitoring started");

            // Start Named Pipe server for UI communication
            _pipeServer.Start();
            _logger.LogInformation("Named Pipe server started");

            // Check if user is authenticated
            if (!_configService.IsAuthenticated())
            {
                _logger.LogWarning("Service not authenticated. Waiting for UI login...");

                // Wait for authentication through Named Pipe
                while (!_configService.IsAuthenticated() && !stoppingToken.IsCancellationRequested)
                {
                    await Task.Delay(5000, stoppingToken);
                }
            }

            if (_configService.IsAuthenticated())
            {
                _logger.LogInformation("User authenticated. Starting WebSocket connection...");

                // Initialize hosts file blocking
                await _hostsFileManager.InitializeAsync();

                // Connect to backend WebSocket
                await _websocketService.ConnectAsync();
                _logger.LogInformation("WebSocket connection established");
            }

            // Keep service running
            while (!stoppingToken.IsCancellationRequested)
            {
                await Task.Delay(10000, stoppingToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fatal error in CellBlock Service");
            throw;
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("CellBlock Service stopping at: {time}", DateTimeOffset.Now);

        // Disconnect WebSocket
        await _websocketService.DisconnectAsync();

        // Stop Named Pipe server
        _pipeServer.Stop();

        // Stop registry monitoring
        _registryMonitor.Stop();

        await base.StopAsync(cancellationToken);
    }
}
