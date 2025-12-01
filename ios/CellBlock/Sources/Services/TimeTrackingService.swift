//
//  TimeTrackingService.swift
//  CellBlock
//
//  Manages time status and tracking
//

import Foundation
import Combine

@MainActor
class TimeTrackingService: ObservableObject {
    static let shared = TimeTrackingService()

    @Published var timeStatus: TimeStatus?
    @Published var remainingSeconds: Int = 0
    @Published var isLocked: Bool = false

    private var updateTimer: Timer?
    private var cancellables = Set<AnyCancellable>()

    private init() {
        setupObservers()
        startLocalTimer()
    }

    // MARK: - Setup

    private func setupObservers() {
        // Listen for time updates from WebSocket
        WebSocketService.shared.$timeUpdate
            .compactMap { $0 }
            .sink { [weak self] update in
                self?.handleTimeUpdate(update)
            }
            .store(in: &cancellables)

        // Listen for lock commands
        WebSocketService.shared.$lockCommand
            .compactMap { $0 }
            .sink { [weak self] command in
                self?.handleLockCommand(command)
            }
            .store(in: &cancellables)

        // Listen for unlock commands
        WebSocketService.shared.$unlockCommand
            .compactMap { $0 }
            .sink { [weak self] command in
                self?.handleUnlockCommand(command)
            }
            .store(in: &cancellables)
    }

    // MARK: - Time Status

    func fetchTimeStatus() async {
        do {
            let response: APIResponse<TimeStatus> = try await AuthService.shared.performRequest(
                endpoint: "/time/status"
            )

            if let status = response.data {
                updateTimeStatus(status)
            }
        } catch {
            print("Failed to fetch time status: \(error)")
        }
    }

    func updateTimeStatus(_ status: TimeStatus) {
        timeStatus = status
        remainingSeconds = status.remainingSeconds
        isLocked = status.isLocked
    }

    func updateTimeStatus(remainingSeconds: Int, weeklyRemaining: Int, isLocked: Bool) {
        self.remainingSeconds = remainingSeconds
        self.isLocked = isLocked

        // Update full status if we have it
        if var status = timeStatus {
            status = TimeStatus(
                remainingSeconds: remainingSeconds,
                weeklyRemaining: weeklyRemaining,
                dailyLimit: status.dailyLimit,
                weeklyLimit: status.weeklyLimit,
                lastHeartbeat: Date(),
                isLocked: isLocked,
                activeParole: status.activeParole
            )
            timeStatus = status
        }
    }

    // MARK: - Local Timer

    private func startLocalTimer() {
        // Update UI every second to show countdown
        updateTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self = self else { return }

            // Decrement local counter (optimistic update)
            if self.remainingSeconds > 0 && !self.isLocked {
                self.remainingSeconds -= 1
            }

            // Check if we hit zero
            if self.remainingSeconds <= 0 && !self.isLocked {
                Task { @MainActor in
                    self.isLocked = true
                    await ScreenTimeService.shared.enableBlocking()
                }
            }
        }
    }

    // MARK: - WebSocket Event Handlers

    private func handleTimeUpdate(_ update: WebSocketService.TimeUpdate) {
        remainingSeconds = update.remainingSeconds

        // Update weekly remaining if we have status
        if var status = timeStatus {
            status = TimeStatus(
                remainingSeconds: update.remainingSeconds,
                weeklyRemaining: update.weeklyRemaining,
                dailyLimit: status.dailyLimit,
                weeklyLimit: status.weeklyLimit,
                lastHeartbeat: Date(),
                isLocked: status.isLocked,
                activeParole: status.activeParole
            )
            timeStatus = status
        }
    }

    private func handleLockCommand(_ command: WebSocketService.LockCommand) {
        print("Lock command received: \(command.message)")

        isLocked = true

        Task {
            await ScreenTimeService.shared.enableBlocking()

            // Show notification
            await NotificationService.shared.showLocalNotification(
                title: "CellBlock: Time's Up",
                body: command.message
            )
        }
    }

    private func handleUnlockCommand(_ command: WebSocketService.UnlockCommand) {
        print("Unlock command received: \(command.message)")

        isLocked = false

        Task {
            await ScreenTimeService.shared.disableBlocking()

            // Refresh time status
            await fetchTimeStatus()

            // Show notification
            await NotificationService.shared.showLocalNotification(
                title: "CellBlock: Unlocked",
                body: command.message
            )
        }
    }

    // MARK: - Formatting Helpers

    func formatTime(_ seconds: Int) -> String {
        let hours = seconds / 3600
        let minutes = (seconds % 3600) / 60
        let secs = seconds % 60

        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, secs)
        } else {
            return String(format: "%d:%02d", minutes, secs)
        }
    }

    func formatTimeShort(_ seconds: Int) -> String {
        let hours = seconds / 3600
        let minutes = (seconds % 3600) / 60

        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }

    func getTimePercentage() -> Double {
        guard let status = timeStatus, status.dailyLimit > 0 else {
            return 0.0
        }

        let used = Double(status.dailyLimit - remainingSeconds)
        let total = Double(status.dailyLimit)

        return min(max(used / total, 0.0), 1.0)
    }
}
