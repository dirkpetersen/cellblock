using CellBlock.Shared.Configuration;
using CellBlock.Shared.Models;
using Microsoft.Extensions.Logging;
using System.Text;

namespace CellBlock.Service.Services;

/// <summary>
/// Manages Windows hosts file for domain blocking
/// </summary>
public class HostsFileManager
{
    private readonly ILogger<HostsFileManager> _logger;
    private readonly ConfigurationService _configService;
    private readonly List<string> _blockedDomains = new();
    private readonly List<string> _whitelistedDomains = new();

    public HostsFileManager(ILogger<HostsFileManager> logger, ConfigurationService configService)
    {
        _logger = logger;
        _configService = configService;
    }

    /// <summary>
    /// Initialize hosts file blocking
    /// </summary>
    public async Task InitializeAsync()
    {
        _logger.LogInformation("Initializing hosts file manager...");

        // Clear any existing CellBlock entries
        await ClearBlockedDomainsAsync();

        _logger.LogInformation("Hosts file manager initialized");
    }

    /// <summary>
    /// Update whitelist from server
    /// </summary>
    public async Task UpdateWhitelistAsync(List<WhitelistItem> whitelistItems)
    {
        _whitelistedDomains.Clear();

        foreach (var item in whitelistItems.Where(i => i.IsEnabled && !string.IsNullOrEmpty(i.WindowsDomain)))
        {
            _whitelistedDomains.Add(item.WindowsDomain!);
        }

        _logger.LogInformation("Whitelist updated with {count} domains", _whitelistedDomains.Count);
    }

    /// <summary>
    /// Apply lock - block all non-whitelisted domains
    /// </summary>
    public async Task ApplyLockAsync()
    {
        _logger.LogInformation("Applying lock - blocking non-whitelisted domains");

        // For MVP, we'll block common distracting domains
        // In production, this would be more comprehensive
        var commonDistractingDomains = new List<string>
        {
            "facebook.com",
            "www.facebook.com",
            "instagram.com",
            "www.instagram.com",
            "twitter.com",
            "www.twitter.com",
            "x.com",
            "www.x.com",
            "tiktok.com",
            "www.tiktok.com",
            "reddit.com",
            "www.reddit.com",
            "youtube.com",
            "www.youtube.com",
            "twitch.tv",
            "www.twitch.tv",
            "netflix.com",
            "www.netflix.com"
        };

        // Remove whitelisted domains from blocking list
        var domainsToBlock = commonDistractingDomains
            .Where(d => !_whitelistedDomains.Any(w => d.Contains(w, StringComparison.OrdinalIgnoreCase)))
            .ToList();

        await BlockDomainsAsync(domainsToBlock);
    }

    /// <summary>
    /// Remove lock - clear all blocks
    /// </summary>
    public async Task RemoveLockAsync()
    {
        _logger.LogInformation("Removing lock - clearing blocked domains");
        await ClearBlockedDomainsAsync();
    }

    /// <summary>
    /// Block specific domains by adding to hosts file
    /// </summary>
    private async Task BlockDomainsAsync(List<string> domains)
    {
        try
        {
            var hostsPath = _configService.GetConfig().HostsFilePath;
            var currentContent = await File.ReadAllTextAsync(hostsPath);

            // Remove existing CellBlock entries
            var lines = currentContent.Split('\n')
                .Where(line => !line.Contains(Constants.HostsFileMarker))
                .ToList();

            // Add new blocking entries
            var newEntries = new StringBuilder();
            newEntries.AppendLine();
            newEntries.AppendLine($"{Constants.HostsFileMarker} - START");

            foreach (var domain in domains)
            {
                newEntries.AppendLine($"127.0.0.1 {domain} {Constants.HostsFileMarker}");
                _logger.LogDebug("Blocking domain: {domain}", domain);
            }

            newEntries.AppendLine($"{Constants.HostsFileMarker} - END");

            // Write back to hosts file
            var updatedContent = string.Join('\n', lines) + newEntries.ToString();
            await File.WriteAllTextAsync(hostsPath, updatedContent);

            _blockedDomains.Clear();
            _blockedDomains.AddRange(domains);

            _logger.LogInformation("Blocked {count} domains in hosts file", domains.Count);

            // Flush DNS cache
            await FlushDnsCacheAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to block domains in hosts file");
            throw;
        }
    }

    /// <summary>
    /// Clear all CellBlock entries from hosts file
    /// </summary>
    private async Task ClearBlockedDomainsAsync()
    {
        try
        {
            var hostsPath = _configService.GetConfig().HostsFilePath;
            var currentContent = await File.ReadAllTextAsync(hostsPath);

            // Remove all CellBlock entries
            var lines = currentContent.Split('\n')
                .Where(line => !line.Contains(Constants.HostsFileMarker))
                .ToList();

            var updatedContent = string.Join('\n', lines).TrimEnd() + '\n';
            await File.WriteAllTextAsync(hostsPath, updatedContent);

            _blockedDomains.Clear();

            _logger.LogInformation("Cleared all blocked domains from hosts file");

            // Flush DNS cache
            await FlushDnsCacheAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to clear blocked domains from hosts file");
            throw;
        }
    }

    /// <summary>
    /// Flush Windows DNS cache
    /// </summary>
    private async Task FlushDnsCacheAsync()
    {
        try
        {
            var processInfo = new System.Diagnostics.ProcessStartInfo
            {
                FileName = "ipconfig",
                Arguments = "/flushdns",
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = System.Diagnostics.Process.Start(processInfo);
            if (process != null)
            {
                await process.WaitForExitAsync();
                _logger.LogDebug("DNS cache flushed");
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to flush DNS cache");
        }
    }

    /// <summary>
    /// Get currently blocked domains
    /// </summary>
    public List<string> GetBlockedDomains()
    {
        return new List<string>(_blockedDomains);
    }

    /// <summary>
    /// Get whitelisted domains
    /// </summary>
    public List<string> GetWhitelistedDomains()
    {
        return new List<string>(_whitelistedDomains);
    }
}
