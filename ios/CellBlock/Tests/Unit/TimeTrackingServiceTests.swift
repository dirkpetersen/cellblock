//
//  TimeTrackingServiceTests.swift
//  CellBlockTests
//
//  Unit tests for TimeTrackingService
//

import XCTest
@testable import CellBlock

@MainActor
final class TimeTrackingServiceTests: XCTestCase {
    var timeTracking: TimeTrackingService!

    override func setUp() async throws {
        try await super.setUp()
        timeTracking = TimeTrackingService.shared
    }

    override func tearDown() async throws {
        timeTracking = nil
        try await super.tearDown()
    }

    func testFormatTime() {
        XCTAssertEqual(timeTracking.formatTime(3665), "1:01:05")
        XCTAssertEqual(timeTracking.formatTime(65), "1:05")
        XCTAssertEqual(timeTracking.formatTime(0), "0:00")
    }

    func testFormatTimeShort() {
        XCTAssertEqual(timeTracking.formatTimeShort(3665), "1h 1m")
        XCTAssertEqual(timeTracking.formatTimeShort(65), "1m")
        XCTAssertEqual(timeTracking.formatTimeShort(3600), "1h 0m")
    }

    func testGetTimePercentage() {
        // Without status, should return 0
        XCTAssertEqual(timeTracking.getTimePercentage(), 0.0)
    }

    func testInitialState() {
        XCTAssertNil(timeTracking.timeStatus)
        XCTAssertEqual(timeTracking.remainingSeconds, 0)
        XCTAssertFalse(timeTracking.isLocked)
    }
}
