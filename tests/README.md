# CellBlock Test Suite

Automated testing infrastructure for CellBlock.

## Tech Stack

- **E2E Testing:** Playwright
- **Unit Testing:** Jest
- **API Testing:** Supertest
- **Coverage:** Jest coverage reports

## Project Status

🚧 **Not yet implemented** - Test infrastructure will be set up alongside feature development.

## Test Categories

### 1. Unit Tests
Located in `/tests/unit/` - mirrors source structure

- Backend business logic
- Utility functions
- Data transformations
- Time calculation algorithms

### 2. Integration Tests
Located in `/tests/integration/`

- API endpoints
- Database operations
- WebSocket events
- Authentication flows

### 3. End-to-End Tests
Located in `/tests/e2e/`

Critical user flows:
- User signup and email verification
- Warden invitation and acceptance
- Time budget countdown and lockdown
- Whitelist request and approval
- Break glass functionality
- Parole grant flow

## Test Data

### Fixtures
Located in `/tests/fixtures/`

- Mock user accounts (inmates and wardens)
- Sample whitelist items
- Test time budgets
- Sample usage history

### Seeds
Located in `/tests/seeds/`

- Development database seed scripts
- Pre-populated test data
- Realistic scenario data

## Running Tests

```bash
# All tests
npm run test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests
npm run test:e2e

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov
```

## Playwright Configuration

Browsers tested:
- Chromium
- Firefox
- WebKit (Safari)

Viewports:
- Desktop (1280x720)
- Tablet (768x1024)
- Mobile (375x667)

## Test Coverage Goals

- Backend: >80% coverage
- Frontend: >70% coverage
- Critical paths: 100% coverage

## Test Utilities

Reusable test utilities will include:
- User factory (create test users)
- Device factory (create test devices)
- Time manipulation helpers
- WebSocket mock server
- Email delivery mocking

## CI/CD Integration

Tests run automatically on:
- All pull requests to `dev` and `main`
- Before merging to `main`
- Scheduled nightly runs

## Writing Tests

### Best Practices

1. **Descriptive Names:** Test names should describe behavior
2. **Arrange-Act-Assert:** Follow AAA pattern
3. **Isolation:** Each test should be independent
4. **Clean Up:** Reset database state after each test
5. **Mock External Services:** Don't send real emails or push notifications

### Example

```typescript
describe('Time Budget System', () => {
  it('should deduct time when heartbeat received', async () => {
    // Arrange
    const user = await createTestUser({ dailyBudget: 120 });
    const device = await createTestDevice(user.id);

    // Act
    await sendHeartbeat({ userId: user.id, deviceId: device.id });

    // Assert
    const budget = await getR emainingTime(user.id);
    expect(budget.remainingMinutes).toBeLessThan(120);
  });
});
```

## Contributing

See [CLAUDE.md](../CLAUDE.md) for testing guidelines and strategy.
