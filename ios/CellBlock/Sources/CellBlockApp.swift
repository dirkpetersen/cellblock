//
//  CellBlockApp.swift
//  CellBlock
//
//  Main application entry point
//

import SwiftUI
import BackgroundTasks

@main
struct CellBlockApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var authService = AuthService.shared
    @StateObject private var webSocketService = WebSocketService.shared
    @StateObject private var heartbeatService = HeartbeatService.shared

    init() {
        // Configure JSON decoder for date handling
        configureDateFormatters()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .onAppear {
                    setupApp()
                }
                .onChange(of: authService.isAuthenticated) { isAuthenticated in
                    handleAuthenticationChange(isAuthenticated)
                }
        }
    }

    // MARK: - Setup

    private func setupApp() {
        print("CellBlock app starting...")

        // Register background tasks
        registerBackgroundTasks()

        // If authenticated, start services
        if authService.isAuthenticated {
            startServices()
        }
    }

    private func handleAuthenticationChange(_ isAuthenticated: Bool) {
        if isAuthenticated {
            startServices()
        } else {
            stopServices()
        }
    }

    // MARK: - Services

    private func startServices() {
        print("Starting CellBlock services...")

        Task {
            // Register device if needed
            if DeviceService.shared.currentDeviceId == nil {
                do {
                    try await DeviceService.shared.registerDevice()
                } catch {
                    print("Failed to register device: \(error)")
                }
            }

            // Connect WebSocket
            if let token = authService.accessToken {
                await MainActor.run {
                    webSocketService.connect(token: token)
                }
            }

            // Start heartbeat
            await MainActor.run {
                heartbeatService.start()
            }

            // Request permissions
            await requestPermissions()

            // Fetch initial data
            await TimeTrackingService.shared.fetchTimeStatus()
            await WhitelistService.shared.fetchWhitelist()
        }
    }

    private func stopServices() {
        print("Stopping CellBlock services...")

        webSocketService.disconnect()
        heartbeatService.stop()
    }

    private func requestPermissions() async {
        // Request notification permission
        do {
            try await NotificationService.shared.requestAuthorization()
        } catch {
            print("Notification permission denied: \(error)")
        }

        // Don't auto-request Screen Time - let user do it from Dashboard
    }

    // MARK: - Background Tasks

    private func registerBackgroundTasks() {
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: "com.cellblock.heartbeat",
            using: nil
        ) { task in
            handleHeartbeatTask(task as! BGAppRefreshTask)
        }
    }

    private func handleHeartbeatTask(_ task: BGAppRefreshTask) {
        print("Background heartbeat task running...")

        task.expirationHandler = {
            print("Background task expired")
        }

        Task {
            // Send a heartbeat
            if let deviceId = DeviceService.shared.currentDeviceId {
                WebSocketService.shared.sendHeartbeat(
                    deviceId: deviceId,
                    isWhitelistedApp: false
                )
            }

            // Schedule next background task
            scheduleBackgroundHeartbeat()

            // Mark task as complete
            task.setTaskCompleted(success: true)
        }
    }

    private func scheduleBackgroundHeartbeat() {
        let request = BGAppRefreshTaskRequest(identifier: "com.cellblock.heartbeat")
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 minutes

        do {
            try BGTaskScheduler.shared.submit(request)
            print("Background heartbeat scheduled")
        } catch {
            print("Failed to schedule background task: \(error)")
        }
    }

    // MARK: - Date Formatting

    private func configureDateFormatters() {
        // Configure default date decoding strategy
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
    }
}

// MARK: - App Delegate

class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        print("CellBlock: didFinishLaunching")
        return true
    }

    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        print("Registered for remote notifications")
        Task { @MainActor in
            NotificationService.shared.setPushToken(deviceToken)
        }
    }

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        print("Failed to register for remote notifications: \(error)")
    }

    func application(
        _ application: UIApplication,
        didReceiveRemoteNotification userInfo: [AnyHashable: Any],
        fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
    ) {
        print("Received remote notification")

        Task { @MainActor in
            NotificationService.shared.handleNotification(userInfo)
            completionHandler(.newData)
        }
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        print("CellBlock: entering foreground")

        // Reconnect WebSocket
        if AuthService.shared.isAuthenticated,
           let token = AuthService.shared.accessToken {
            WebSocketService.shared.connect(token: token)
        }

        // Resume heartbeat
        HeartbeatService.shared.start()
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        print("CellBlock: entering background")

        // Schedule background task
        scheduleBackgroundTask()
    }

    private func scheduleBackgroundTask() {
        let request = BGAppRefreshTaskRequest(identifier: "com.cellblock.heartbeat")
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60)

        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            print("Failed to schedule background task: \(error)")
        }
    }
}
