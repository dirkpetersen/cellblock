//
//  SettingsView.swift
//  CellBlock
//
//  App settings and user profile
//

import SwiftUI

struct SettingsView: View {
    @StateObject private var authService = AuthService.shared
    @StateObject private var deviceService = DeviceService.shared
    @StateObject private var notificationService = NotificationService.shared
    @StateObject private var screenTimeService = ScreenTimeService.shared
    @State private var showingLogoutConfirmation = false

    var body: some View {
        NavigationView {
            List {
                // User section
                Section(header: Text("Account")) {
                    if let user = authService.currentUser {
                        HStack {
                            Text("Email")
                            Spacer()
                            Text(user.email)
                                .foregroundColor(.secondary)
                        }

                        if let displayName = user.displayName {
                            HStack {
                                Text("Display Name")
                                Spacer()
                                Text(displayName)
                                    .foregroundColor(.secondary)
                            }
                        }

                        HStack {
                            Text("Timezone")
                            Spacer()
                            Text(user.timezone)
                                .foregroundColor(.secondary)
                        }
                    }
                }

                // Device section
                Section(header: Text("Device")) {
                    HStack {
                        Text("Device Name")
                        Spacer()
                        Text(deviceService.getDeviceName())
                            .foregroundColor(.secondary)
                    }

                    HStack {
                        Text("OS Version")
                        Spacer()
                        Text(deviceService.getOSVersion())
                            .foregroundColor(.secondary)
                    }

                    if let deviceId = deviceService.currentDeviceId {
                        HStack {
                            Text("Device ID")
                            Spacer()
                            Text(deviceId.prefix(8) + "...")
                                .foregroundColor(.secondary)
                                .font(.system(.caption, design: .monospaced))
                        }
                    }
                }

                // Permissions section
                Section(header: Text("Permissions")) {
                    permissionRow(
                        title: "Notifications",
                        icon: "bell.fill",
                        isAuthorized: notificationService.isAuthorized,
                        action: requestNotifications
                    )

                    permissionRow(
                        title: "Screen Time",
                        icon: "hourglass",
                        isAuthorized: screenTimeService.isAuthorized,
                        action: requestScreenTime
                    )
                }

                // Preferences section
                Section(header: Text("Preferences")) {
                    NavigationLink(destination: Text("Time Budget Settings")) {
                        Label("Time Budget", systemImage: "clock.fill")
                    }

                    NavigationLink(destination: Text("About")) {
                        Label("About CellBlock", systemImage: "info.circle.fill")
                    }
                }

                // Danger zone
                Section(header: Text("Danger Zone")) {
                    Button(action: { showingLogoutConfirmation = true }) {
                        HStack {
                            Image(systemName: "rectangle.portrait.and.arrow.right")
                            Text("Log Out")
                        }
                        .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Settings")
            .confirmationDialog(
                "Are you sure you want to log out?",
                isPresented: $showingLogoutConfirmation,
                titleVisibility: .visible
            ) {
                Button("Log Out", role: .destructive) {
                    authService.logout()
                }
                Button("Cancel", role: .cancel) {}
            }
        }
    }

    // MARK: - Permission Row

    private func permissionRow(
        title: String,
        icon: String,
        isAuthorized: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack {
                Label(title, systemImage: icon)
                    .foregroundColor(.primary)

                Spacer()

                if isAuthorized {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                } else {
                    Text("Request")
                        .foregroundColor(.blue)
                }
            }
        }
        .disabled(isAuthorized)
    }

    // MARK: - Actions

    private func requestNotifications() {
        Task {
            do {
                try await notificationService.requestAuthorization()
            } catch {
                print("Failed to request notification permission: \(error)")
            }
        }
    }

    private func requestScreenTime() {
        Task {
            do {
                try await screenTimeService.requestAuthorization()
            } catch {
                print("Failed to request Screen Time permission: \(error)")
            }
        }
    }
}

struct SettingsView_Previews: PreviewProvider {
    static var previews: some View {
        SettingsView()
    }
}
