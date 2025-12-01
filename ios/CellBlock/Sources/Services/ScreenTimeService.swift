//
//  ScreenTimeService.swift
//  CellBlock
//
//  Integrates with Screen Time API for blocking functionality
//  Phase 1: Block "Social" category only
//

import Foundation
import FamilyControls
import ManagedSettings
import DeviceActivity
import Combine

@MainActor
class ScreenTimeService: ObservableObject {
    static let shared = ScreenTimeService()

    @Published var isAuthorized = false
    @Published var isBlocking = false

    private let center = AuthorizationCenter.shared
    private let store = ManagedSettingsStore()

    private init() {
        checkAuthorization()
    }

    // MARK: - Authorization

    func requestAuthorization() async throws {
        do {
            try await center.requestAuthorization(for: .individual)
            isAuthorized = true
            print("Screen Time authorization granted")
        } catch {
            isAuthorized = false
            print("Screen Time authorization failed: \(error)")
            throw ScreenTimeError.authorizationDenied
        }
    }

    private func checkAuthorization() {
        // Check if already authorized
        switch center.authorizationStatus {
        case .approved:
            isAuthorized = true
        default:
            isAuthorized = false
        }
    }

    // MARK: - Blocking Control

    func enableBlocking() async {
        guard isAuthorized else {
            print("Cannot enable blocking - not authorized")
            return
        }

        guard !isBlocking else {
            print("Blocking already enabled")
            return
        }

        print("Enabling Screen Time blocking...")

        // Phase 1: Block Social category
        // This shields all social media apps
        let socialCategory = ActivityCategoryToken.category(.socialNetworking)

        // Configure shield for social apps
        store.shield.applicationCategories = .specific([socialCategory])

        // Also block web domains in social category
        store.shield.webDomainCategories = .specific([socialCategory])

        // Set shield restrictions
        store.shield.applications = .all() // Shield all apps that match categories

        isBlocking = true
        print("Screen Time blocking enabled")
    }

    func disableBlocking() async {
        guard isBlocking else {
            print("Blocking already disabled")
            return
        }

        print("Disabling Screen Time blocking...")

        // Remove all shields
        store.shield.applicationCategories = nil
        store.shield.webDomainCategories = nil
        store.shield.applications = nil

        isBlocking = false
        print("Screen Time blocking disabled")
    }

    func enableWhitelistMode(whitelist: [WhitelistItem]) async {
        guard isAuthorized else {
            print("Cannot enable whitelist mode - not authorized")
            return
        }

        print("Enabling whitelist mode with \(whitelist.count) items...")

        // Phase 2: Full whitelist implementation
        // This would block everything except whitelisted apps

        // For Phase 1, we just block social category
        await enableBlocking()
    }

    // MARK: - Monitoring (Phase 2)

    func startMonitoring() {
        // Phase 2: Use DeviceActivity to monitor app usage
        // This requires DeviceActivityMonitorExtension

        print("Device activity monitoring would start here (Phase 2)")
    }

    func stopMonitoring() {
        print("Device activity monitoring would stop here (Phase 2)")
    }

    // MARK: - Helper Methods

    func getBlockedApps() -> [String] {
        // Return list of currently blocked app bundle IDs
        // Phase 1: All social apps
        return [
            "com.facebook.Facebook",
            "com.instagram.Instagram",
            "com.twitter.Twitter",
            "com.snapchat.Snapchat",
            "com.zhiliaoapp.musically", // TikTok
            "com.reddit.Reddit",
        ]
    }

    func isAppBlocked(_ bundleId: String) -> Bool {
        guard isBlocking else { return false }

        // Check if app is in blocked category
        let blockedApps = getBlockedApps()
        return blockedApps.contains(bundleId)
    }
}

// MARK: - Activity Category Extension

extension ActivityCategoryToken {
    static func category(_ category: ActivityCategory) -> ActivityCategoryToken {
        // Create a token for the given category
        // This is a simplified version - actual implementation may vary
        return ActivityCategoryToken()
    }
}

// MARK: - Errors

enum ScreenTimeError: LocalizedError {
    case authorizationDenied
    case notAuthorized
    case blockingFailed

    var errorDescription: String? {
        switch self {
        case .authorizationDenied:
            return "Screen Time authorization was denied"
        case .notAuthorized:
            return "Screen Time not authorized"
        case .blockingFailed:
            return "Failed to enable blocking"
        }
    }
}

// MARK: - Notes
/*
 Phase 1 Implementation (MVP):
 - Request Screen Time authorization
 - Block "Social Networking" category when time expires
 - Simple on/off blocking

 Phase 2 Implementation (Full Enforcement):
 - Use Family Controls entitlement
 - Implement full whitelist blocking (block all except whitelist)
 - Add DeviceActivityMonitorExtension for persistent monitoring
 - Shield configuration persists even when app is killed
 - Handle device reboots

 Screen Time API Requirements:
 - iOS 16.0+
 - Entitlements: com.apple.developer.family-controls
 - Info.plist: NSFamilyControlsUsageDescription

 Important Notes:
 - Screen Time restrictions work even when app is in background
 - User can only disable with device passcode (not app passcode)
 - Shields are applied at system level
 */
