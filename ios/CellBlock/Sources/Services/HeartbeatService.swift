//
//  HeartbeatService.swift
//  CellBlock
//
//  Manages 60-second heartbeat to backend
//

import Foundation
import Combine
import UIKit

class HeartbeatService: ObservableObject {
    static let shared = HeartbeatService()

    @Published var isActive = false
    @Published var lastHeartbeatTime: Date?

    private var timer: Timer?
    private let heartbeatInterval: TimeInterval = 60.0 // 60 seconds
    private var cancellables = Set<AnyCancellable>()

    init() {
        setupObservers()
    }

    // MARK: - Lifecycle

    private func setupObservers() {
        // Start/stop based on app state
        NotificationCenter.default.publisher(for: UIApplication.willEnterForegroundNotification)
            .sink { [weak self] _ in
                self?.start()
            }
            .store(in: &cancellables)

        NotificationCenter.default.publisher(for: UIApplication.didEnterBackgroundNotification)
            .sink { [weak self] _ in
                self?.stop()
            }
            .store(in: &cancellables)

        // React to authentication state
        AuthService.shared.$isAuthenticated
            .sink { [weak self] isAuthenticated in
                if isAuthenticated {
                    self?.start()
                } else {
                    self?.stop()
                }
            }
            .store(in: &cancellables)
    }

    // MARK: - Control

    func start() {
        guard AuthService.shared.isAuthenticated else {
            print("Cannot start heartbeat - not authenticated")
            return
        }

        guard !isActive else {
            print("Heartbeat already active")
            return
        }

        print("Starting heartbeat service")
        isActive = true

        // Send first heartbeat immediately
        sendHeartbeat()

        // Schedule recurring heartbeats
        timer = Timer.scheduledTimer(
            withTimeInterval: heartbeatInterval,
            repeats: true
        ) { [weak self] _ in
            self?.sendHeartbeat()
        }
    }

    func stop() {
        guard isActive else { return }

        print("Stopping heartbeat service")
        isActive = false
        timer?.invalidate()
        timer = nil
    }

    // MARK: - Heartbeat

    private func sendHeartbeat() {
        guard let deviceId = DeviceService.shared.currentDeviceId else {
            print("Cannot send heartbeat - no device ID")
            return
        }

        // Check if current app is whitelisted
        let isWhitelisted = checkIfCurrentActivityIsWhitelisted()

        // Send via WebSocket
        WebSocketService.shared.sendHeartbeat(
            deviceId: deviceId,
            isWhitelistedApp: isWhitelisted
        )

        // Also send via REST API as backup
        Task {
            await sendHeartbeatViaAPI(deviceId: deviceId, isWhitelisted: isWhitelisted)
        }

        DispatchQueue.main.async {
            self.lastHeartbeatTime = Date()
        }

        print("Heartbeat sent - whitelisted: \(isWhitelisted)")
    }

    private func sendHeartbeatViaAPI(deviceId: String, isWhitelisted: Bool) async {
        do {
            let request = HeartbeatRequest(
                deviceId: deviceId,
                isWhitelistedApp: isWhitelisted,
                timestamp: Int(Date().timeIntervalSince1970)
            )

            let response: APIResponse<HeartbeatResponse> = try await AuthService.shared.performRequest(
                endpoint: "/sync/heartbeat",
                method: "POST",
                body: request
            )

            if let data = response.data {
                await handleHeartbeatResponse(data)
            }
        } catch {
            print("Heartbeat API call failed: \(error.localizedDescription)")
        }
    }

    private func handleHeartbeatResponse(_ response: HeartbeatResponse) async {
        // Update time tracking service with new time data
        await MainActor.run {
            TimeTrackingService.shared.updateTimeStatus(
                remainingSeconds: response.remainingSeconds,
                weeklyRemaining: response.weeklyRemaining,
                isLocked: response.isLocked
            )
        }

        // If locked, trigger screen time blocking
        if response.isLocked {
            await ScreenTimeService.shared.enableBlocking()
        } else {
            await ScreenTimeService.shared.disableBlocking()
        }
    }

    private func checkIfCurrentActivityIsWhitelisted() -> Bool {
        // For Phase 1, we consider activity whitelisted if we're in a whitelisted app
        // This is simplified - full implementation would check Screen Time API
        // to see what app is currently active

        // For now, return false (not whitelisted) when app is active
        // In background, this doesn't matter as much
        return false
    }
}
