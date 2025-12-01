using System.Management;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Win32;

namespace CellBlock.Shared.Utilities;

/// <summary>
/// Generates a unique device fingerprint for Windows machines
/// Combines MAC address hash with Windows Machine GUID
/// </summary>
public static class DeviceFingerprint
{
    /// <summary>
    /// Generate unique device fingerprint
    /// Format: {MAC-HASH}-{MACHINE-GUID}
    /// </summary>
    public static string Generate()
    {
        var macHash = GetPrimaryMacAddressHash();
        var machineGuid = GetMachineGuid();
        return $"{macHash}-{machineGuid}";
    }

    /// <summary>
    /// Get SHA256 hash of primary network adapter MAC address
    /// </summary>
    private static string GetPrimaryMacAddressHash()
    {
        try
        {
            var macAddress = GetPrimaryMacAddress();
            if (string.IsNullOrEmpty(macAddress))
            {
                // Fallback to random identifier if MAC not available
                return GenerateRandomHash();
            }

            using var sha256 = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(macAddress);
            var hash = sha256.ComputeHash(bytes);
            return Convert.ToHexString(hash)[..16]; // First 16 characters
        }
        catch
        {
            return GenerateRandomHash();
        }
    }

    /// <summary>
    /// Get MAC address of primary network adapter
    /// </summary>
    private static string? GetPrimaryMacAddress()
    {
        try
        {
            using var searcher = new ManagementObjectSearcher(
                "SELECT MACAddress FROM Win32_NetworkAdapterConfiguration WHERE IPEnabled = TRUE");

            foreach (var obj in searcher.Get())
            {
                var macAddress = obj["MACAddress"]?.ToString();
                if (!string.IsNullOrEmpty(macAddress))
                {
                    return macAddress.Replace(":", "").Replace("-", "");
                }
            }
        }
        catch
        {
            // Silently fail and return null
        }

        return null;
    }

    /// <summary>
    /// Get Windows Machine GUID from registry
    /// </summary>
    private static string GetMachineGuid()
    {
        try
        {
            using var key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Cryptography");
            var guid = key?.GetValue("MachineGuid")?.ToString();

            if (!string.IsNullOrEmpty(guid))
            {
                return guid.Replace("-", "");
            }
        }
        catch
        {
            // Silently fail
        }

        // Fallback to generated GUID
        return Guid.NewGuid().ToString("N");
    }

    /// <summary>
    /// Generate random hash as fallback
    /// </summary>
    private static string GenerateRandomHash()
    {
        using var sha256 = SHA256.Create();
        var randomBytes = Guid.NewGuid().ToByteArray();
        var hash = sha256.ComputeHash(randomBytes);
        return Convert.ToHexString(hash)[..16];
    }

    /// <summary>
    /// Get device name (computer name)
    /// </summary>
    public static string GetDeviceName()
    {
        return Environment.MachineName;
    }

    /// <summary>
    /// Get Windows version
    /// </summary>
    public static string GetOsVersion()
    {
        return Environment.OSVersion.VersionString;
    }
}
