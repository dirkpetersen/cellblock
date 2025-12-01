//
//  ContentView.swift
//  CellBlock
//
//  Main navigation container
//

import SwiftUI

struct ContentView: View {
    @StateObject private var authService = AuthService.shared
    @StateObject private var timeTracking = TimeTrackingService.shared
    @State private var selectedTab = 0

    var body: some View {
        Group {
            if authService.isAuthenticated {
                mainTabView
            } else {
                LoginView()
            }
        }
    }

    // MARK: - Main Tab View

    private var mainTabView: some View {
        TabView(selection: $selectedTab) {
            DashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "house.fill")
                }
                .tag(0)

            WhitelistView()
                .tabItem {
                    Label("Whitelist", systemImage: "list.bullet")
                }
                .tag(1)

            WardenView()
                .tabItem {
                    Label("Wardens", systemImage: "person.2.fill")
                }
                .tag(2)

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gear")
                }
                .tag(3)
        }
        .overlay(alignment: .top) {
            // Lock banner when device is locked
            if timeTracking.isLocked {
                lockBanner
            }
        }
    }

    // MARK: - Lock Banner

    private var lockBanner: some View {
        HStack {
            Image(systemName: "lock.fill")
            Text("Device Locked - Time Expired")
            Spacer()
        }
        .padding()
        .background(Color.red)
        .foregroundColor(.white)
        .font(.headline)
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
