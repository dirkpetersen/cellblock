//
//  WebSocketService.swift
//  CellBlock
//
//  Manages WebSocket connection to backend for real-time updates
//

import Foundation
import Combine

class WebSocketService: ObservableObject {
    static let shared = WebSocketService()

    @Published var isConnected = false
    @Published var lastHeartbeatResponse: HeartbeatResponse?
    @Published var timeUpdate: TimeUpdate?
    @Published var lockCommand: LockCommand?
    @Published var unlockCommand: UnlockCommand?

    private var webSocketTask: URLSessionWebSocketTask?
    private let baseURL: String
    private var reconnectTimer: Timer?
    private var shouldReconnect = false

    struct TimeUpdate {
        let remainingSeconds: Int
        let weeklyRemaining: Int
    }

    struct LockCommand {
        let reason: String
        let message: String
    }

    struct UnlockCommand {
        let reason: String
        let message: String
    }

    init(baseURL: String = "ws://localhost:3000") {
        self.baseURL = baseURL
    }

    // MARK: - Connection Management

    func connect(token: String) {
        guard let url = URL(string: "\(baseURL)/socket.io/?transport=websocket&token=\(token)") else {
            print("Invalid WebSocket URL")
            return
        }

        shouldReconnect = true
        webSocketTask = URLSession.shared.webSocketTask(with: url)
        webSocketTask?.resume()

        DispatchQueue.main.async {
            self.isConnected = true
        }

        receiveMessage()
        print("WebSocket connected")
    }

    func disconnect() {
        shouldReconnect = false
        reconnectTimer?.invalidate()
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil

        DispatchQueue.main.async {
            self.isConnected = false
        }

        print("WebSocket disconnected")
    }

    private func reconnect() {
        guard shouldReconnect else { return }

        print("Attempting to reconnect WebSocket...")

        if let token = AuthService.shared.accessToken {
            connect(token: token)
        }
    }

    // MARK: - Message Handling

    private func receiveMessage() {
        webSocketTask?.receive { [weak self] result in
            guard let self = self else { return }

            switch result {
            case .success(let message):
                self.handleMessage(message)
                self.receiveMessage() // Continue receiving

            case .failure(let error):
                print("WebSocket receive error: \(error)")
                DispatchQueue.main.async {
                    self.isConnected = false
                }

                // Attempt reconnection after delay
                if self.shouldReconnect {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 5.0) {
                        self.reconnect()
                    }
                }
            }
        }
    }

    private func handleMessage(_ message: URLSessionWebSocketTask.Message) {
        switch message {
        case .string(let text):
            handleTextMessage(text)
        case .data(let data):
            if let text = String(data: data, encoding: .utf8) {
                handleTextMessage(text)
            }
        @unknown default:
            break
        }
    }

    private func handleTextMessage(_ text: String) {
        guard let data = text.data(using: .utf8) else { return }

        // Parse Socket.IO protocol messages
        // Format: "42[\"event_name\",{...data...}]"

        if text.hasPrefix("0") {
            // Connection established
            print("Socket.IO connection established")
            return
        }

        if text.hasPrefix("40") {
            // Namespace connection
            print("Socket.IO namespace connected")
            return
        }

        if text.hasPrefix("42") {
            // Event message
            let jsonString = String(text.dropFirst(2)) // Remove "42"

            if let jsonData = jsonString.data(using: .utf8),
               let jsonArray = try? JSONSerialization.jsonObject(with: jsonData) as? [Any],
               jsonArray.count >= 2,
               let eventName = jsonArray[0] as? String,
               let eventData = jsonArray[1] {

                handleEvent(name: eventName, data: eventData)
            }
        }
    }

    private func handleEvent(name: String, data: Any) {
        print("Received event: \(name)")

        guard let jsonData = try? JSONSerialization.data(withJSONObject: data),
              let decoder = JSONDecoder() as JSONDecoder? else {
            return
        }

        decoder.dateDecodingStrategy = .iso8601

        DispatchQueue.main.async {
            switch name {
            case "time_update":
                if let update = try? decoder.decode(TimeUpdate.self, from: jsonData) {
                    self.timeUpdate = update
                }

            case "heartbeat_response":
                if let response = try? decoder.decode(HeartbeatResponse.self, from: jsonData) {
                    self.lastHeartbeatResponse = response
                }

            case "lock_command":
                if let command = try? decoder.decode(LockCommand.self, from: jsonData) {
                    self.lockCommand = command
                }

            case "unlock_command":
                if let command = try? decoder.decode(UnlockCommand.self, from: jsonData) {
                    self.unlockCommand = command
                }

            case "config_update":
                NotificationCenter.default.post(name: .configUpdate, object: nil)

            case "whitelist_change":
                NotificationCenter.default.post(name: .whitelistChange, object: nil)

            default:
                print("Unhandled event: \(name)")
            }
        }
    }

    // MARK: - Send Messages

    func sendHeartbeat(deviceId: String, isWhitelistedApp: Bool) {
        let heartbeat = HeartbeatRequest(
            deviceId: deviceId,
            isWhitelistedApp: isWhitelistedApp,
            timestamp: Int(Date().timeIntervalSince1970)
        )

        sendEvent(name: "heartbeat", data: heartbeat)
    }

    private func sendEvent<T: Codable>(name: String, data: T) {
        guard isConnected else {
            print("Cannot send event - WebSocket not connected")
            return
        }

        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            let jsonData = try encoder.encode(data)

            if let jsonObject = try JSONSerialization.jsonObject(with: jsonData) as? [String: Any] {
                let eventArray: [Any] = [name, jsonObject]
                let eventData = try JSONSerialization.data(withJSONObject: eventArray)

                if let eventString = String(data: eventData, encoding: .utf8) {
                    let message = "42\(eventString)" // Socket.IO protocol prefix

                    webSocketTask?.send(.string(message)) { error in
                        if let error = error {
                            print("Failed to send event: \(error)")
                        }
                    }
                }
            }
        } catch {
            print("Failed to encode event: \(error)")
        }
    }

    func ping() {
        webSocketTask?.sendPing { error in
            if let error = error {
                print("Ping failed: \(error)")
            }
        }
    }
}

// MARK: - Notification Names
extension Notification.Name {
    static let configUpdate = Notification.Name("cellblock.configUpdate")
    static let whitelistChange = Notification.Name("cellblock.whitelistChange")
}
