//
//  User.swift
//  CellBlock
//
//  Models matching backend API types
//

import Foundation

// MARK: - User
struct User: Codable, Identifiable {
    let id: String
    let email: String
    let displayName: String?
    let timezone: String
    let isEmailVerified: Bool
    let createdAt: Date
    let updatedAt: Date
}

// MARK: - Device
struct Device: Codable, Identifiable {
    let id: String
    let userId: String
    let deviceFingerprint: String
    let platform: DevicePlatform
    let deviceName: String?
    let osVersion: String?
    let appVersion: String?
    let firstSeen: Date
    let lastSeen: Date
    let isActive: Bool
}

enum DevicePlatform: String, Codable {
    case ios
    case windows
    case android
    case macos
}

// MARK: - Time Budget
struct TimeBudget: Codable, Identifiable {
    let id: String
    let userId: String
    let dayOfWeek: Int? // 0-6 (Sunday-Saturday)
    let isWeekend: Bool?
    let minutesAllowed: Int
    let weeklyMaxMinutes: Int?
    let createdAt: Date
    let updatedAt: Date
}

// MARK: - Time Status
struct TimeStatus: Codable {
    let remainingSeconds: Int
    let weeklyRemaining: Int
    let dailyLimit: Int
    let weeklyLimit: Int
    let lastHeartbeat: Date
    let isLocked: Bool
    let activeParole: ActiveParole?

    struct ActiveParole: Codable {
        let type: ParoleGrantType
        let expiresAt: Date?
    }
}

enum ParoleGrantType: String, Codable {
    case minutes
    case until
}

// MARK: - Whitelist Item
struct WhitelistItem: Codable, Identifiable {
    let id: String
    let userId: String
    let name: String
    let iosBundleId: String?
    let windowsDomain: String?
    let androidPackageName: String?
    let category: WhitelistCategory
    let isEnabled: Bool
    let createdAt: Date
}

enum WhitelistCategory: String, Codable {
    case utility
    case healthy
    case custom
}

// MARK: - Warden Relationship
struct WardenRelationship: Codable, Identifiable {
    let id: String
    let inmateId: String
    let wardenId: String
    let status: WardenRelationshipStatus
    let isPrimary: Bool
    let invitationToken: String?
    let invitationSentAt: Date
    let acceptedAt: Date?
    let cancelledAt: Date?
    let createdAt: Date
    let updatedAt: Date
}

enum WardenRelationshipStatus: String, Codable {
    case pending
    case active
    case cancelled
    case resigned
}

// MARK: - Request
struct Request: Codable, Identifiable {
    let id: String
    let requesterId: String
    let approverId: String?
    let type: RequestType
    let status: RequestStatus
    let requestData: [String: AnyCodable]
    let requesterComment: String?
    let approverComment: String?
    let createdAt: Date
    let updatedAt: Date
    let expiresAt: Date
}

enum RequestType: String, Codable {
    case whitelistAdd = "whitelist_add"
    case whitelistRemove = "whitelist_remove"
    case budgetChange = "budget_change"
}

enum RequestStatus: String, Codable {
    case pending
    case approved
    case denied
    case expired
}

// MARK: - Parole Grant
struct ParoleGrant: Codable, Identifiable {
    let id: String
    let inmateId: String
    let wardenId: String
    let type: ParoleGrantType
    let minutesGranted: Int?
    let validUntil: Date?
    let reason: String?
    let grantedAt: Date
    let expiresAt: Date?
    let isActive: Bool
}

// MARK: - Usage Log
struct UsageLog: Codable, Identifiable {
    let id: String
    let userId: String
    let deviceId: String
    let startTime: Date
    let endTime: Date
    let secondsUsed: Int
    let wasWhitelisted: Bool
    let createdAt: Date
}

// MARK: - Event
struct Event: Codable, Identifiable {
    let id: String
    let userId: String?
    let actorId: String?
    let eventType: EventType
    let eventData: [String: AnyCodable]?
    let ipAddress: String?
    let userAgent: String?
    let createdAt: Date
}

enum EventType: String, Codable {
    case breakGlass = "break_glass"
    case lockdown
    case paroleGranted = "parole_granted"
    case wardenInvited = "warden_invited"
    case wardenAccepted = "warden_accepted"
    case wardenResigned = "warden_resigned"
    case deviceRegistered = "device_registered"
    case whitelistAdded = "whitelist_added"
    case whitelistRemoved = "whitelist_removed"
    case budgetChanged = "budget_changed"
}

// MARK: - Helper for dynamic JSON
struct AnyCodable: Codable {
    let value: Any

    init(_ value: Any) {
        self.value = value
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()

        if let bool = try? container.decode(Bool.self) {
            value = bool
        } else if let int = try? container.decode(Int.self) {
            value = int
        } else if let double = try? container.decode(Double.self) {
            value = double
        } else if let string = try? container.decode(String.self) {
            value = string
        } else if let array = try? container.decode([AnyCodable].self) {
            value = array.map { $0.value }
        } else if let dict = try? container.decode([String: AnyCodable].self) {
            value = dict.mapValues { $0.value }
        } else {
            value = NSNull()
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()

        switch value {
        case let bool as Bool:
            try container.encode(bool)
        case let int as Int:
            try container.encode(int)
        case let double as Double:
            try container.encode(double)
        case let string as String:
            try container.encode(string)
        case let array as [Any]:
            try container.encode(array.map { AnyCodable($0) })
        case let dict as [String: Any]:
            try container.encode(dict.mapValues { AnyCodable($0) })
        default:
            try container.encodeNil()
        }
    }
}
