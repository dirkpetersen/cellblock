//
//  WhitelistService.swift
//  CellBlock
//
//  Manages whitelist items
//

import Foundation
import Combine

@MainActor
class WhitelistService: ObservableObject {
    static let shared = WhitelistService()

    @Published var whitelistItems: [WhitelistItem] = []
    @Published var isLoading = false

    private var cancellables = Set<AnyCancellable>()

    private init() {
        setupObservers()
    }

    // MARK: - Setup

    private func setupObservers() {
        // Listen for whitelist changes from WebSocket
        NotificationCenter.default.publisher(for: .whitelistChange)
            .sink { [weak self] _ in
                Task {
                    await self?.fetchWhitelist()
                }
            }
            .store(in: &cancellables)
    }

    // MARK: - Fetch

    func fetchWhitelist() async {
        isLoading = true
        defer { isLoading = false }

        do {
            let response: APIResponse<[WhitelistItem]> = try await AuthService.shared.performRequest(
                endpoint: "/whitelist"
            )

            if let items = response.data {
                whitelistItems = items.sorted { $0.createdAt > $1.createdAt }
            }
        } catch {
            print("Failed to fetch whitelist: \(error)")
        }
    }

    // MARK: - Add/Remove

    func addWhitelistItem(
        name: String,
        iosBundleId: String? = nil,
        windowsDomain: String? = nil,
        androidPackageName: String? = nil,
        comment: String? = nil
    ) async throws {
        let request = AddWhitelistItemRequest(
            name: name,
            iosBundleId: iosBundleId,
            windowsDomain: windowsDomain,
            androidPackageName: androidPackageName,
            comment: comment
        )

        let response: APIResponse<WhitelistItem> = try await AuthService.shared.performRequest(
            endpoint: "/whitelist",
            method: "POST",
            body: request
        )

        if let item = response.data {
            whitelistItems.insert(item, at: 0)
        }

        // Update Screen Time blocking with new whitelist
        await ScreenTimeService.shared.enableWhitelistMode(whitelist: whitelistItems)
    }

    func removeWhitelistItem(_ itemId: String, comment: String? = nil) async throws {
        let request = RemoveWhitelistItemRequest(
            itemId: itemId,
            comment: comment
        )

        let _: APIResponse<EmptyResponse> = try await AuthService.shared.performRequest(
            endpoint: "/whitelist/\(itemId)",
            method: "DELETE",
            body: request
        )

        whitelistItems.removeAll { $0.id == itemId }

        // Update Screen Time blocking
        await ScreenTimeService.shared.enableWhitelistMode(whitelist: whitelistItems)
    }

    // MARK: - Helpers

    func isAppWhitelisted(_ bundleId: String) -> Bool {
        whitelistItems.contains { item in
            item.isEnabled && item.iosBundleId == bundleId
        }
    }

    func getEnabledItems() -> [WhitelistItem] {
        whitelistItems.filter { $0.isEnabled }
    }

    func getItemsByCategory(_ category: WhitelistCategory) -> [WhitelistItem] {
        whitelistItems.filter { $0.category == category }
    }
}
