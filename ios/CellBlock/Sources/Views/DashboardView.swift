//
//  DashboardView.swift
//  CellBlock
//
//  Main dashboard showing time remaining and status
//

import SwiftUI

struct DashboardView: View {
    @StateObject private var timeTracking = TimeTrackingService.shared
    @StateObject private var screenTime = ScreenTimeService.shared
    @StateObject private var heartbeat = HeartbeatService.shared

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Time remaining card
                    timeRemainingCard

                    // Status indicators
                    statusRow

                    // Quick actions
                    quickActionsCard

                    // Weekly progress
                    if let status = timeTracking.timeStatus {
                        weeklyProgressCard(status: status)
                    }
                }
                .padding()
            }
            .navigationTitle("Dashboard")
            .refreshable {
                await timeTracking.fetchTimeStatus()
            }
            .task {
                await timeTracking.fetchTimeStatus()
            }
        }
    }

    // MARK: - Time Remaining Card

    private var timeRemainingCard: some View {
        VStack(spacing: 16) {
            Text("Time Remaining")
                .font(.headline)
                .foregroundColor(.secondary)

            // Countdown timer
            Text(timeTracking.formatTime(timeTracking.remainingSeconds))
                .font(.system(size: 60, weight: .bold, design: .rounded))
                .monospacedDigit()
                .foregroundColor(timeColor)

            // Progress ring
            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.2), lineWidth: 12)

                Circle()
                    .trim(from: 0, to: 1 - timeTracking.getTimePercentage())
                    .stroke(timeColor, style: StrokeStyle(lineWidth: 12, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                    .animation(.easeInOut, value: timeTracking.getTimePercentage())
            }
            .frame(width: 200, height: 200)
            .overlay(
                VStack(spacing: 4) {
                    Text("\(Int((1 - timeTracking.getTimePercentage()) * 100))%")
                        .font(.system(size: 36, weight: .bold))
                    Text("remaining")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            )

            // Lock status
            if timeTracking.isLocked {
                HStack {
                    Image(systemName: "lock.fill")
                    Text("Device Locked")
                }
                .font(.headline)
                .foregroundColor(.red)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(Color.red.opacity(0.1))
                .cornerRadius(20)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.1), radius: 10, x: 0, y: 5)
    }

    // MARK: - Status Row

    private var statusRow: some View {
        HStack(spacing: 16) {
            statusIndicator(
                icon: "wifi",
                label: "Connected",
                isActive: heartbeat.isActive,
                color: .green
            )

            statusIndicator(
                icon: "hourglass",
                label: "Screen Time",
                isActive: screenTime.isBlocking,
                color: .orange
            )

            statusIndicator(
                icon: "checkmark.shield.fill",
                label: "Authorized",
                isActive: screenTime.isAuthorized,
                color: .blue
            )
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    private func statusIndicator(icon: String, label: String, isActive: Bool, color: Color) -> some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(isActive ? color : .gray)

            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)

            Circle()
                .fill(isActive ? color : Color.gray)
                .frame(width: 8, height: 8)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Quick Actions

    private var quickActionsCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Quick Actions")
                .font(.headline)

            Button(action: requestScreenTimeAuth) {
                HStack {
                    Image(systemName: "hand.raised.fill")
                    Text("Request Screen Time Access")
                    Spacer()
                    Image(systemName: "chevron.right")
                }
                .padding()
                .background(Color.blue.opacity(0.1))
                .foregroundColor(.blue)
                .cornerRadius(10)
            }
            .disabled(screenTime.isAuthorized)

            Button(action: refreshStatus) {
                HStack {
                    Image(systemName: "arrow.clockwise")
                    Text("Refresh Status")
                    Spacer()
                    Image(systemName: "chevron.right")
                }
                .padding()
                .background(Color.gray.opacity(0.1))
                .foregroundColor(.primary)
                .cornerRadius(10)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    // MARK: - Weekly Progress

    private func weeklyProgressCard(status: TimeStatus) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Weekly Progress")
                .font(.headline)

            HStack(spacing: 8) {
                Text("Used:")
                    .foregroundColor(.secondary)
                Spacer()
                Text(timeTracking.formatTimeShort(status.weeklyLimit - status.weeklyRemaining))
                    .fontWeight(.semibold)
                Text("of")
                    .foregroundColor(.secondary)
                Text(timeTracking.formatTimeShort(status.weeklyLimit))
                    .fontWeight(.semibold)
            }

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 12)
                        .cornerRadius(6)

                    Rectangle()
                        .fill(weeklyProgressColor(status: status))
                        .frame(
                            width: geometry.size.width * weeklyProgressPercentage(status: status),
                            height: 12
                        )
                        .cornerRadius(6)
                }
            }
            .frame(height: 12)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    // MARK: - Helpers

    private var timeColor: Color {
        let percentage = timeTracking.getTimePercentage()
        if percentage < 0.5 {
            return .green
        } else if percentage < 0.8 {
            return .orange
        } else {
            return .red
        }
    }

    private func weeklyProgressPercentage(status: TimeStatus) -> Double {
        guard status.weeklyLimit > 0 else { return 0 }
        let used = Double(status.weeklyLimit - status.weeklyRemaining)
        return min(used / Double(status.weeklyLimit), 1.0)
    }

    private func weeklyProgressColor(status: TimeStatus) -> Color {
        let percentage = weeklyProgressPercentage(status: status)
        if percentage < 0.5 {
            return .green
        } else if percentage < 0.8 {
            return .orange
        } else {
            return .red
        }
    }

    // MARK: - Actions

    private func requestScreenTimeAuth() {
        Task {
            do {
                try await screenTime.requestAuthorization()
            } catch {
                print("Screen Time authorization failed: \(error)")
            }
        }
    }

    private func refreshStatus() {
        Task {
            await timeTracking.fetchTimeStatus()
        }
    }
}

struct DashboardView_Previews: PreviewProvider {
    static var previews: some View {
        DashboardView()
    }
}
