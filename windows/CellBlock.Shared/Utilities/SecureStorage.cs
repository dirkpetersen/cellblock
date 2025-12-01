using System.Security.Cryptography;
using System.Text;
using Microsoft.Win32;

namespace CellBlock.Shared.Utilities;

/// <summary>
/// Secure storage for sensitive data using Windows DPAPI and Registry
/// Stores encrypted data in HKLM for system-wide access
/// </summary>
public class SecureStorage
{
    private readonly string _registryKeyPath;

    public SecureStorage(string registryKeyPath = @"SOFTWARE\CellBlock")
    {
        _registryKeyPath = registryKeyPath;
    }

    /// <summary>
    /// Store encrypted value in registry
    /// </summary>
    public void SetValue(string key, string value)
    {
        try
        {
            // Encrypt using DPAPI (machine scope)
            var encryptedData = ProtectedData.Protect(
                Encoding.UTF8.GetBytes(value),
                null,
                DataProtectionScope.LocalMachine
            );

            // Convert to base64 for registry storage
            var base64Data = Convert.ToBase64String(encryptedData);

            // Store in registry
            using var registryKey = Registry.LocalMachine.CreateSubKey(_registryKeyPath);
            registryKey?.SetValue(key, base64Data, RegistryValueKind.String);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to store encrypted value for key '{key}'", ex);
        }
    }

    /// <summary>
    /// Retrieve and decrypt value from registry
    /// </summary>
    public string? GetValue(string key)
    {
        try
        {
            using var registryKey = Registry.LocalMachine.OpenSubKey(_registryKeyPath);
            var base64Data = registryKey?.GetValue(key)?.ToString();

            if (string.IsNullOrEmpty(base64Data))
            {
                return null;
            }

            // Decrypt using DPAPI
            var encryptedData = Convert.FromBase64String(base64Data);
            var decryptedData = ProtectedData.Unprotect(
                encryptedData,
                null,
                DataProtectionScope.LocalMachine
            );

            return Encoding.UTF8.GetString(decryptedData);
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Delete value from registry
    /// </summary>
    public void DeleteValue(string key)
    {
        try
        {
            using var registryKey = Registry.LocalMachine.OpenSubKey(_registryKeyPath, true);
            registryKey?.DeleteValue(key, false);
        }
        catch
        {
            // Silently ignore if key doesn't exist
        }
    }

    /// <summary>
    /// Check if value exists
    /// </summary>
    public bool HasValue(string key)
    {
        try
        {
            using var registryKey = Registry.LocalMachine.OpenSubKey(_registryKeyPath);
            return registryKey?.GetValue(key) != null;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Clear all stored values
    /// </summary>
    public void ClearAll()
    {
        try
        {
            Registry.LocalMachine.DeleteSubKeyTree(_registryKeyPath, false);
        }
        catch
        {
            // Silently ignore if key doesn't exist
        }
    }
}
