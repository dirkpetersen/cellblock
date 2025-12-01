//
//  LoginView.swift
//  CellBlock
//
//  User authentication view
//

import SwiftUI

struct LoginView: View {
    @StateObject private var authService = AuthService.shared
    @State private var email = ""
    @State private var password = ""
    @State private var displayName = ""
    @State private var isSignup = false
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Logo and title
                    VStack(spacing: 12) {
                        Image(systemName: "lock.shield.fill")
                            .font(.system(size: 64))
                            .foregroundColor(.blue)

                        Text("CellBlock")
                            .font(.largeTitle)
                            .fontWeight(.bold)

                        Text(isSignup ? "Create your account" : "Welcome back")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .padding(.top, 40)
                    .padding(.bottom, 20)

                    // Form
                    VStack(spacing: 16) {
                        // Email
                        TextField("Email", text: $email)
                            .textInputAutocapitalization(.never)
                            .keyboardType(.emailAddress)
                            .autocorrectionDisabled()
                            .textFieldStyle(.roundedBorder)

                        // Display name (signup only)
                        if isSignup {
                            TextField("Display Name (optional)", text: $displayName)
                                .textFieldStyle(.roundedBorder)
                        }

                        // Password
                        SecureField("Password", text: $password)
                            .textFieldStyle(.roundedBorder)

                        // Error message
                        if let error = errorMessage {
                            Text(error)
                                .font(.caption)
                                .foregroundColor(.red)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }

                        // Submit button
                        Button(action: handleSubmit) {
                            HStack {
                                if isLoading {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                } else {
                                    Text(isSignup ? "Sign Up" : "Log In")
                                        .fontWeight(.semibold)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(10)
                        }
                        .disabled(isLoading || !isFormValid)

                        // Toggle mode
                        Button(action: { isSignup.toggle() }) {
                            Text(isSignup
                                ? "Already have an account? Log in"
                                : "Don't have an account? Sign up")
                                .font(.subheadline)
                                .foregroundColor(.blue)
                        }
                    }
                    .padding(.horizontal)

                    Spacer()
                }
            }
            .navigationBarHidden(true)
        }
    }

    // MARK: - Validation

    private var isFormValid: Bool {
        !email.isEmpty &&
        !password.isEmpty &&
        password.count >= 8 &&
        email.contains("@")
    }

    // MARK: - Actions

    private func handleSubmit() {
        errorMessage = nil
        isLoading = true

        Task {
            do {
                if isSignup {
                    try await authService.signup(
                        email: email,
                        password: password,
                        displayName: displayName.isEmpty ? nil : displayName
                    )
                } else {
                    try await authService.login(
                        email: email,
                        password: password
                    )
                }

                // Success - handled by AuthService's @Published property
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    isLoading = false
                }
            }
        }
    }
}

struct LoginView_Previews: PreviewProvider {
    static var previews: some View {
        LoginView()
    }
}
