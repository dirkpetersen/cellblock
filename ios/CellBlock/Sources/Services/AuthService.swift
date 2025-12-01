//
//  AuthService.swift
//  CellBlock
//
//  Handles JWT authentication and token management
//

import Foundation
import Combine

class AuthService: ObservableObject {
    static let shared = AuthService()

    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var accessToken: String?

    private var refreshToken: String?
    private let baseURL: String
    private let userDefaults = UserDefaults.standard

    // Keys for storing tokens
    private let accessTokenKey = "cellblock.accessToken"
    private let refreshTokenKey = "cellblock.refreshToken"
    private let userKey = "cellblock.user"

    init(baseURL: String = "http://localhost:3000") {
        self.baseURL = baseURL
        loadStoredCredentials()
    }

    // MARK: - Authentication

    func login(email: String, password: String) async throws {
        let request = LoginRequest(email: email, password: password)
        let response: APIResponse<AuthResponse> = try await performRequest(
            endpoint: "/auth/login",
            method: "POST",
            body: request,
            requiresAuth: false
        )

        guard let authData = response.data else {
            throw AuthError.invalidResponse
        }

        saveCredentials(authData)
    }

    func signup(email: String, password: String, displayName: String?) async throws {
        let request = SignupRequest(email: email, password: password, displayName: displayName)
        let response: APIResponse<AuthResponse> = try await performRequest(
            endpoint: "/auth/signup",
            method: "POST",
            body: request,
            requiresAuth: false
        )

        guard let authData = response.data else {
            throw AuthError.invalidResponse
        }

        saveCredentials(authData)
    }

    func logout() {
        clearCredentials()
    }

    func refreshAccessToken() async throws {
        guard let refreshToken = refreshToken else {
            throw AuthError.noRefreshToken
        }

        struct RefreshRequest: Codable {
            let refreshToken: String
        }

        let request = RefreshRequest(refreshToken: refreshToken)
        let response: APIResponse<AuthResponse> = try await performRequest(
            endpoint: "/auth/refresh",
            method: "POST",
            body: request,
            requiresAuth: false
        )

        guard let authData = response.data else {
            throw AuthError.invalidResponse
        }

        saveCredentials(authData)
    }

    // MARK: - Credential Management

    private func saveCredentials(_ authData: AuthResponse) {
        DispatchQueue.main.async {
            self.accessToken = authData.accessToken
            self.refreshToken = authData.refreshToken
            self.currentUser = authData.user
            self.isAuthenticated = true
        }

        userDefaults.set(authData.accessToken, forKey: accessTokenKey)
        userDefaults.set(authData.refreshToken, forKey: refreshTokenKey)

        if let userData = try? JSONEncoder().encode(authData.user) {
            userDefaults.set(userData, forKey: userKey)
        }
    }

    private func loadStoredCredentials() {
        accessToken = userDefaults.string(forKey: accessTokenKey)
        refreshToken = userDefaults.string(forKey: refreshTokenKey)

        if let userData = userDefaults.data(forKey: userKey),
           let user = try? JSONDecoder().decode(User.self, from: userData) {
            currentUser = user
            isAuthenticated = true
        }
    }

    private func clearCredentials() {
        DispatchQueue.main.async {
            self.accessToken = nil
            self.refreshToken = nil
            self.currentUser = nil
            self.isAuthenticated = false
        }

        userDefaults.removeObject(forKey: accessTokenKey)
        userDefaults.removeObject(forKey: refreshTokenKey)
        userDefaults.removeObject(forKey: userKey)
    }

    // MARK: - Network Requests

    func performRequest<T: Codable, B: Codable>(
        endpoint: String,
        method: String = "GET",
        body: B? = nil,
        requiresAuth: Bool = true
    ) async throws -> T {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw AuthError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // Add auth header if required
        if requiresAuth {
            guard let token = accessToken else {
                throw AuthError.notAuthenticated
            }
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        // Add body if present
        if let body = body {
            request.httpBody = try JSONEncoder().encode(body)
        }

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw AuthError.invalidResponse
        }

        // Handle 401 - try to refresh token
        if httpResponse.statusCode == 401 && requiresAuth {
            try await refreshAccessToken()
            // Retry the request once with new token
            request.setValue("Bearer \(accessToken ?? "")", forHTTPHeaderField: "Authorization")
            let (retryData, retryResponse) = try await URLSession.shared.data(for: request)
            guard let retryHttpResponse = retryResponse as? HTTPURLResponse,
                  retryHttpResponse.statusCode == 200 else {
                throw AuthError.unauthorized
            }
            return try JSONDecoder().decode(T.self, from: retryData)
        }

        guard httpResponse.statusCode == 200 || httpResponse.statusCode == 201 else {
            throw AuthError.httpError(httpResponse.statusCode)
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(T.self, from: data)
    }

    // Convenience method without body
    func performRequest<T: Codable>(
        endpoint: String,
        method: String = "GET",
        requiresAuth: Bool = true
    ) async throws -> T {
        struct EmptyBody: Codable {}
        return try await performRequest(
            endpoint: endpoint,
            method: method,
            body: nil as EmptyBody?,
            requiresAuth: requiresAuth
        )
    }
}

// MARK: - Errors
enum AuthError: LocalizedError {
    case invalidURL
    case invalidResponse
    case notAuthenticated
    case unauthorized
    case noRefreshToken
    case httpError(Int)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .notAuthenticated:
            return "Not authenticated"
        case .unauthorized:
            return "Unauthorized - please log in again"
        case .noRefreshToken:
            return "No refresh token available"
        case .httpError(let code):
            return "HTTP error: \(code)"
        }
    }
}
