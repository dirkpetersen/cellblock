//
//  DeviceService.swift
//  CellBlock
//
//  Manages device registration and fingerprinting
//

import Foundation
import UIKit
import Combine

class DeviceService: ObservableObject {
    static let shared = DeviceService()

    @Published var currentDevice: Device?
    @Published var currentDeviceId: String?

    private let userDefaults = UserDefaults.standard
    private let deviceIdKey = "cellblock.deviceId"
    private let deviceFingerprintKey = "cellblock.deviceFingerprint"

    private init() {
        loadStoredDeviceId()
    }

    // MARK: - Device Fingerprint

    func getDeviceFingerprint() -> String {
        // Use identifierForVendor as device fingerprint
        // This is stable unless app is uninstalled
        if let stored = userDefaults.string(forKey: deviceFingerprintKey) {
            return stored
        }

        let fingerprint = UIDevice.current.identifierForVendor?.uuidString
            ?? UUID().uuidString

        userDefaults.set(fingerprint, forKey: deviceFingerprintKey)
        return fingerprint
    }

    // MARK: - Device Registration

    func registerDevice() async throws {
        let fingerprint = getDeviceFingerprint()
        let deviceInfo = getDeviceInfo()

        let request = RegisterDeviceRequest(
            deviceFingerprint: fingerprint,
            platform: .ios,
            deviceName: deviceInfo.name,
            osVersion: deviceInfo.osVersion,
            appVersion: deviceInfo.appVersion
        )

        let response: APIResponse<Device> = try await AuthService.shared.performRequest(
            endpoint: "/devices/register",
            method: "POST",
            body: request
        )

        if let device = response.data {
            await MainActor.run {
                self.currentDevice = device
                self.currentDeviceId = device.id
            }

            userDefaults.set(device.id, forKey: deviceIdKey)
            print("Device registered: \(device.id)")
        } else {
            throw DeviceError.registrationFailed
        }
    }

    func fetchDevices() async throws -> [Device] {
        let response: APIResponse<[Device]> = try await AuthService.shared.performRequest(
            endpoint: "/devices"
        )

        return response.data ?? []
    }

    func removeDevice(deviceId: String) async throws {
        let request = RemoveDeviceSchema(deviceId: deviceId)

        let _: APIResponse<EmptyResponse> = try await AuthService.shared.performRequest(
            endpoint: "/devices/\(deviceId)",
            method: "DELETE",
            body: request
        )

        // If this is the current device, clear local data
        if deviceId == currentDeviceId {
            await MainActor.run {
                self.currentDevice = nil
                self.currentDeviceId = nil
            }
            userDefaults.removeObject(forKey: deviceIdKey)
        }
    }

    // MARK: - Device Info

    private func getDeviceInfo() -> (name: String, osVersion: String, appVersion: String) {
        let device = UIDevice.current

        let deviceName = device.name
        let osVersion = "\(device.systemName) \(device.systemVersion)"
        let appVersion = getAppVersion()

        return (deviceName, osVersion, appVersion)
    }

    private func getAppVersion() -> String {
        let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
        let build = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"
        return "\(version) (\(build))"
    }

    func getDeviceName() -> String {
        UIDevice.current.name
    }

    func getOSVersion() -> String {
        let device = UIDevice.current
        return "\(device.systemName) \(device.systemVersion)"
    }

    // MARK: - Storage

    private func loadStoredDeviceId() {
        if let deviceId = userDefaults.string(forKey: deviceIdKey) {
            currentDeviceId = deviceId
        }
    }
}

// MARK: - Supporting Types

struct RemoveDeviceSchema: Codable {
    let deviceId: String
}

struct EmptyResponse: Codable {}

// MARK: - Errors

enum DeviceError: LocalizedError {
    case registrationFailed
    case notRegistered

    var errorDescription: String? {
        switch self {
        case .registrationFailed:
            return "Failed to register device"
        case .notRegistered:
            return "Device not registered"
        }
    }
}
