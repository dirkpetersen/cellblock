//
//  AuthServiceTests.swift
//  CellBlockTests
//
//  Unit tests for AuthService
//

import XCTest
@testable import CellBlock

final class AuthServiceTests: XCTestCase {
    var authService: AuthService!

    override func setUp() {
        super.setUp()
        authService = AuthService(baseURL: "http://localhost:3000")
    }

    override func tearDown() {
        authService.logout()
        authService = nil
        super.tearDown()
    }

    func testInitialState() {
        XCTAssertFalse(authService.isAuthenticated)
        XCTAssertNil(authService.currentUser)
        XCTAssertNil(authService.accessToken)
    }

    func testLoginValidation() {
        // Test would require mocking URLSession
        // This is a placeholder for the test structure
    }

    func testLogout() {
        authService.logout()

        XCTAssertFalse(authService.isAuthenticated)
        XCTAssertNil(authService.currentUser)
        XCTAssertNil(authService.accessToken)
    }

    func testAuthError() {
        let error = AuthError.notAuthenticated
        XCTAssertNotNil(error.errorDescription)
    }
}
