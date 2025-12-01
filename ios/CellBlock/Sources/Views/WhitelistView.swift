//
//  WhitelistView.swift
//  CellBlock
//
//  Manage whitelist items
//

import SwiftUI

struct WhitelistView: View {
    @StateObject private var whitelistService = WhitelistService.shared
    @State private var showingAddSheet = false

    var body: some View {
        NavigationView {
            List {
                if whitelistService.whitelistItems.isEmpty {
                    emptyState
                } else {
                    ForEach(whitelistService.whitelistItems) { item in
                        WhitelistItemRow(item: item)
                    }
                    .onDelete(perform: deleteItems)
                }
            }
            .navigationTitle("Whitelist")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingAddSheet = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddSheet) {
                AddWhitelistItemView()
            }
            .refreshable {
                await whitelistService.fetchWhitelist()
            }
            .task {
                await whitelistService.fetchWhitelist()
            }
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "list.bullet.circle")
                .font(.system(size: 64))
                .foregroundColor(.gray)

            Text("No Whitelist Items")
                .font(.headline)

            Text("Add apps to allow access even when time runs out")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)

            Button(action: { showingAddSheet = true }) {
                Text("Add First Item")
                    .fontWeight(.semibold)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
        }
        .padding()
        .listRowBackground(Color.clear)
    }

    // MARK: - Delete

    private func deleteItems(at offsets: IndexSet) {
        for index in offsets {
            let item = whitelistService.whitelistItems[index]
            Task {
                do {
                    try await whitelistService.removeWhitelistItem(item.id)
                } catch {
                    print("Failed to remove item: \(error)")
                }
            }
        }
    }
}

// MARK: - Whitelist Item Row

struct WhitelistItemRow: View {
    let item: WhitelistItem

    var body: some View {
        HStack(spacing: 12) {
            // Icon
            Image(systemName: categoryIcon)
                .font(.title2)
                .foregroundColor(categoryColor)
                .frame(width: 40)

            // Info
            VStack(alignment: .leading, spacing: 4) {
                Text(item.name)
                    .font(.headline)

                if let bundleId = item.iosBundleId {
                    Text(bundleId)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                HStack {
                    categoryBadge
                    if item.isEnabled {
                        enabledBadge
                    }
                }
            }

            Spacer()

            // Status
            if item.isEnabled {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.green)
            } else {
                Image(systemName: "circle")
                    .foregroundColor(.gray)
            }
        }
        .padding(.vertical, 4)
    }

    // MARK: - Category Helpers

    private var categoryIcon: String {
        switch item.category {
        case .utility:
            return "wrench.and.screwdriver"
        case .healthy:
            return "heart.fill"
        case .custom:
            return "star.fill"
        }
    }

    private var categoryColor: Color {
        switch item.category {
        case .utility:
            return .blue
        case .healthy:
            return .green
        case .custom:
            return .purple
        }
    }

    private var categoryBadge: some View {
        Text(item.category.rawValue.capitalized)
            .font(.caption2)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(categoryColor.opacity(0.2))
            .foregroundColor(categoryColor)
            .cornerRadius(4)
    }

    private var enabledBadge: some View {
        Text("Active")
            .font(.caption2)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(Color.green.opacity(0.2))
            .foregroundColor(.green)
            .cornerRadius(4)
    }
}

// MARK: - Add Whitelist Item View

struct AddWhitelistItemView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var whitelistService = WhitelistService.shared

    @State private var name = ""
    @State private var bundleId = ""
    @State private var comment = ""
    @State private var isSubmitting = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Item Details")) {
                    TextField("Name", text: $name)
                    TextField("iOS Bundle ID", text: $bundleId)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                }

                Section(header: Text("Comment (Optional)")) {
                    TextEditor(text: $comment)
                        .frame(height: 100)
                }

                Section(header: Text("Common Apps")) {
                    commonAppsList
                }

                if let error = errorMessage {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }
            }
            .navigationTitle("Add Whitelist Item")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Add") {
                        addItem()
                    }
                    .disabled(!isFormValid || isSubmitting)
                }
            }
        }
    }

    // MARK: - Common Apps

    private var commonAppsList: some View {
        VStack(spacing: 0) {
            commonAppButton(name: "Apple Maps", bundleId: "com.apple.Maps")
            commonAppButton(name: "Calendar", bundleId: "com.apple.mobilecal")
            commonAppButton(name: "Mail", bundleId: "com.apple.mobilemail")
            commonAppButton(name: "Phone", bundleId: "com.apple.mobilephone")
            commonAppButton(name: "Messages", bundleId: "com.apple.MobileSMS")
            commonAppButton(name: "Safari", bundleId: "com.apple.mobilesafari")
        }
    }

    private func commonAppButton(name: String, bundleId: String) -> some View {
        Button(action: {
            self.name = name
            self.bundleId = bundleId
        }) {
            HStack {
                Text(name)
                Spacer()
                Text(bundleId)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }

    // MARK: - Validation

    private var isFormValid: Bool {
        !name.isEmpty && !bundleId.isEmpty
    }

    // MARK: - Actions

    private func addItem() {
        errorMessage = nil
        isSubmitting = true

        Task {
            do {
                try await whitelistService.addWhitelistItem(
                    name: name,
                    iosBundleId: bundleId,
                    comment: comment.isEmpty ? nil : comment
                )

                await MainActor.run {
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    isSubmitting = false
                }
            }
        }
    }
}

struct WhitelistView_Previews: PreviewProvider {
    static var previews: some View {
        WhitelistView()
    }
}
