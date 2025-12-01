//
//  NotificationService.swift
//  CellBlock
//
//  Manages push notifications and local notifications
//

import Foundation
import UserNotifications
import UIKit
import Combine

@MainActor
class NotificationService: ObservableObject {
    static let shared = NotificationService()

    @Published var isAuthorized = false
    @Published var pushToken: String?

    private let notificationCenter = UNUserNotificationCenter.current()

    private init() {
        checkAuthorization()
    }

    // MARK: - Authorization

    func requestAuthorization() async throws {
        let options: UNAuthorizationOptions = [.alert, .badge, .sound]

        do {
            let granted = try await notificationCenter.requestAuthorization(options: options)
            isAuthorized = granted

            if granted {
                await registerForRemoteNotifications()
            }
        } catch {
            print("Notification authorization error: \(error)")
            throw NotificationError.authorizationDenied
        }
    }

    private func checkAuthorization() {
        Task {
            let settings = await notificationCenter.notificationSettings()
            isAuthorized = settings.authorizationStatus == .authorized
        }
    }

    private func registerForRemoteNotifications() async {
        await UIApplication.shared.registerForRemoteNotifications()
    }

    // MARK: - Push Token

    func setPushToken(_ token: Data) {
        let tokenString = token.map { String(format: "%02.2hhx", $0) }.joined()
        pushToken = tokenString

        // Send to backend
        Task {
            await registerPushToken(tokenString)
        }
    }

    private func registerPushToken(_ token: String) async {
        guard let deviceId = DeviceService.shared.currentDeviceId else {
            print("Cannot register push token - no device ID")
            return
        }

        struct PushTokenRequest: Codable {
            let deviceId: String
            let pushToken: String
            let platform: String
        }

        do {
            let request = PushTokenRequest(
                deviceId: deviceId,
                pushToken: token,
                platform: "apns"
            )

            let _: APIResponse<EmptyResponse> = try await AuthService.shared.performRequest(
                endpoint: "/notifications/register-token",
                method: "POST",
                body: request
            )

            print("Push token registered successfully")
        } catch {
            print("Failed to register push token: \(error)")
        }
    }

    // MARK: - Local Notifications

    func showLocalNotification(title: String, body: String, delay: TimeInterval = 0) async {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default

        let trigger = delay > 0
            ? UNTimeIntervalNotificationTrigger(timeInterval: delay, repeats: false)
            : nil

        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: trigger
        )

        do {
            try await notificationCenter.add(request)
        } catch {
            print("Failed to show local notification: \(error)")
        }
    }

    // MARK: - Handle Notifications

    func handleNotification(_ userInfo: [AnyHashable: Any]) {
        print("Received notification: \(userInfo)")

        // Parse notification type
        guard let type = userInfo["type"] as? String else {
            return
        }

        switch type {
        case "time_update":
            // Refresh time status
            Task {
                await TimeTrackingService.shared.fetchTimeStatus()
            }

        case "lock_command":
            // Lock device
            Task {
                await MainActor.run {
                    TimeTrackingService.shared.isLocked = true
                }
                await ScreenTimeService.shared.enableBlocking()
            }

        case "unlock_command":
            // Unlock device
            Task {
                await MainActor.run {
                    TimeTrackingService.shared.isLocked = false
                }
                await ScreenTimeService.shared.disableBlocking()
                await TimeTrackingService.shared.fetchTimeStatus()
            }

        case "config_update":
            // Refresh configuration
            NotificationCenter.default.post(name: .configUpdate, object: nil)

        case "whitelist_change":
            // Refresh whitelist
            Task {
                await WhitelistService.shared.fetchWhitelist()
            }

        case "warden_request":
            // Show warden request notification
            if let message = userInfo["message"] as? String {
                Task {
                    await showLocalNotification(
                        title: "Warden Request",
                        body: message
                    )
                }
            }

        default:
            print("Unknown notification type: \(type)")
        }
    }

    // MARK: - Badge

    func setBadgeCount(_ count: Int) {
        UIApplication.shared.applicationIconBadgeNumber = count
    }

    func clearBadge() {
        setBadgeCount(0)
    }
}

// MARK: - Errors

enum NotificationError: LocalizedError {
    case authorizationDenied
    case registrationFailed

    var errorDescription: String? {
        switch self {
        case .authorizationDenied:
            return "Notification authorization was denied"
        case .registrationFailed:
            return "Failed to register for notifications"
        }
    }
}
