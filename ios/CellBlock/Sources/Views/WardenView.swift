//
//  WardenView.swift
//  CellBlock
//
//  Manage warden relationships and requests
//

import SwiftUI

struct WardenView: View {
    @State private var wardens: [WardenRelationship] = []
    @State private var showingInviteSheet = false
    @State private var isLoading = false

    var body: some View {
        NavigationView {
            List {
                Section(header: Text("My Wardens")) {
                    if wardens.isEmpty {
                        emptyWardenState
                    } else {
                        ForEach(wardens) { warden in
                            WardenRow(warden: warden)
                        }
                    }
                }

                Section {
                    Button(action: { showingInviteSheet = true }) {
                        HStack {
                            Image(systemName: "person.badge.plus")
                            Text("Invite Warden")
                        }
                    }
                }
            }
            .navigationTitle("Wardens")
            .refreshable {
                await fetchWardens()
            }
            .task {
                await fetchWardens()
            }
            .sheet(isPresented: $showingInviteSheet) {
                InviteWardenView()
            }
        }
    }

    // MARK: - Empty State

    private var emptyWardenState: some View {
        VStack(spacing: 12) {
            Image(systemName: "person.2.circle")
                .font(.largeTitle)
                .foregroundColor(.gray)

            Text("No Wardens")
                .font(.headline)

            Text("Invite someone to help enforce your limits")
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
    }

    // MARK: - Data

    private func fetchWardens() async {
        isLoading = true
        defer { isLoading = false }

        do {
            let response: APIResponse<[WardenRelationship]> = try await AuthService.shared.performRequest(
                endpoint: "/warden/relationships"
            )

            if let data = response.data {
                await MainActor.run {
                    wardens = data
                }
            }
        } catch {
            print("Failed to fetch wardens: \(error)")
        }
    }
}

// MARK: - Warden Row

struct WardenRow: View {
    let warden: WardenRelationship

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "person.circle.fill")
                .font(.title)
                .foregroundColor(statusColor)

            VStack(alignment: .leading, spacing: 4) {
                Text("Warden")
                    .font(.headline)

                Text(warden.status.rawValue.capitalized)
                    .font(.caption)
                    .foregroundColor(.secondary)

                if warden.isPrimary {
                    Text("Primary")
                        .font(.caption2)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.blue.opacity(0.2))
                        .foregroundColor(.blue)
                        .cornerRadius(4)
                }
            }

            Spacer()

            Image(systemName: statusIcon)
                .foregroundColor(statusColor)
        }
        .padding(.vertical, 4)
    }

    private var statusIcon: String {
        switch warden.status {
        case .active:
            return "checkmark.circle.fill"
        case .pending:
            return "clock.fill"
        case .cancelled, .resigned:
            return "xmark.circle.fill"
        }
    }

    private var statusColor: Color {
        switch warden.status {
        case .active:
            return .green
        case .pending:
            return .orange
        case .cancelled, .resigned:
            return .gray
        }
    }
}

// MARK: - Invite Warden View

struct InviteWardenView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var email = ""
    @State private var isPrimary = true
    @State private var isSubmitting = false
    @State private var errorMessage: String?
    @State private var successMessage: String?

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Warden Details")) {
                    TextField("Email Address", text: $email)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .autocorrectionDisabled()

                    Toggle("Primary Warden", isOn: $isPrimary)
                }

                Section(footer: Text("The warden will receive an email invitation to approve your requests.")) {
                    EmptyView()
                }

                if let error = errorMessage {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }

                if let success = successMessage {
                    Section {
                        Text(success)
                            .foregroundColor(.green)
                            .font(.caption)
                    }
                }
            }
            .navigationTitle("Invite Warden")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Send") {
                        sendInvite()
                    }
                    .disabled(!isFormValid || isSubmitting)
                }
            }
        }
    }

    // MARK: - Validation

    private var isFormValid: Bool {
        !email.isEmpty && email.contains("@")
    }

    // MARK: - Actions

    private func sendInvite() {
        errorMessage = nil
        successMessage = nil
        isSubmitting = true

        Task {
            do {
                let request = InviteWardenRequest(
                    email: email,
                    isPrimary: isPrimary
                )

                let _: APIResponse<WardenRelationship> = try await AuthService.shared.performRequest(
                    endpoint: "/warden/invite",
                    method: "POST",
                    body: request
                )

                await MainActor.run {
                    successMessage = "Invitation sent successfully!"
                    isSubmitting = false

                    // Dismiss after a delay
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                        dismiss()
                    }
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

struct WardenView_Previews: PreviewProvider {
    static var previews: some View {
        WardenView()
    }
}
