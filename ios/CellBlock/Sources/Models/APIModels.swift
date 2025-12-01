//
//  APIModels.swift
//  CellBlock
//
//  API Request/Response models
//

import Foundation

// MARK: - API Response
struct APIResponse<T: Codable>: Codable {
    let success: Bool
    let data: T?
    let error: String?
    let message: String?
}

// MARK: - Authentication
struct LoginRequest: Codable {
    let email: String
    let password: String
}

struct SignupRequest: Codable {
    let email: String
    let password: String
    let displayName: String?
}

struct AuthResponse: Codable {
    let accessToken: String
    let refreshToken: String
    let user: User
}

// MARK: - Device Registration
struct RegisterDeviceRequest: Codable {
    let deviceFingerprint: String
    let platform: DevicePlatform
    let deviceName: String?
    let osVersion: String?
    let appVersion: String?
}

// MARK: - Heartbeat
struct HeartbeatRequest: Codable {
    let deviceId: String
    let isWhitelistedApp: Bool
    let timestamp: Int // Unix timestamp
}

struct HeartbeatResponse: Codable {
    let remainingSeconds: Int
    let weeklyRemaining: Int
    let isLocked: Bool
}

// MARK: - Whitelist
struct AddWhitelistItemRequest: Codable {
    let name: String
    let iosBundleId: String?
    let windowsDomain: String?
    let androidPackageName: String?
    let comment: String?
}

struct RemoveWhitelistItemRequest: Codable {
    let itemId: String
    let comment: String?
}

// MARK: - Time Budget
struct UpdateTimeBudgetRequest: Codable {
    let mode: String // "per_day" or "weekday_weekend"
    let perDayLimits: [DayLimit]?
    let weekdayMinutes: Int?
    let weekendMinutes: Int?
    let weeklyMaxMinutes: Int
    let comment: String?

    struct DayLimit: Codable {
        let dayOfWeek: Int // 0-6
        let minutesAllowed: Int
    }
}

// MARK: - Warden
struct InviteWardenRequest: Codable {
    let email: String
    let isPrimary: Bool
}

struct ApproveRequestRequest: Codable {
    let requestId: String
    let approved: Bool
    let comment: String?
}

struct GrantParoleRequest: Codable {
    let inmateId: String
    let type: String // "minutes" or "until"
    let value: ParoleValue
    let reason: String?

    enum ParoleValue: Codable {
        case minutes(Int)
        case datetime(String)

        init(from decoder: Decoder) throws {
            let container = try decoder.singleValueContainer()
            if let int = try? container.decode(Int.self) {
                self = .minutes(int)
            } else if let string = try? container.decode(String.self) {
                self = .datetime(string)
            } else {
                throw DecodingError.typeMismatch(
                    ParoleValue.self,
                    DecodingError.Context(
                        codingPath: decoder.codingPath,
                        debugDescription: "Expected Int or String"
                    )
                )
            }
        }

        func encode(to encoder: Encoder) throws {
            var container = encoder.singleValueContainer()
            switch self {
            case .minutes(let int):
                try container.encode(int)
            case .datetime(let string):
                try container.encode(string)
            }
        }
    }
}

struct TriggerLockdownRequest: Codable {
    let inmateId: String
    let gracePeriodMinutes: Int?
    let reason: String?
}

// MARK: - Pagination
struct PaginatedResponse<T: Codable>: Codable {
    let data: [T]
    let total: Int
    let page: Int
    let limit: Int
    let totalPages: Int
}
