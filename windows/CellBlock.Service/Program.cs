using CellBlock.Service;
using CellBlock.Service.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

var builder = Host.CreateApplicationBuilder(args);

// Configure Windows Service
builder.Services.AddWindowsService(options =>
{
    options.ServiceName = "CellBlockService";
});

// Add services
builder.Services.AddSingleton<ConfigurationService>();
builder.Services.AddSingleton<HostsFileManager>();
builder.Services.AddSingleton<WebSocketService>();
builder.Services.AddSingleton<RegistryMonitor>();
builder.Services.AddSingleton<NamedPipeServer>();
builder.Services.AddHostedService<CellBlockWorker>();

// Configure logging
builder.Logging.AddEventLog(settings =>
{
    settings.SourceName = "CellBlock Service";
});

var host = builder.Build();
await host.RunAsync();
