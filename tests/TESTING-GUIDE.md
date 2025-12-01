# CellBlock Testing Guide

Comprehensive guide for running and maintaining the CellBlock test suite.

## Table of Contents

- [Overview](#overview)
- [Test Infrastructure](#test-infrastructure)
- [Running Tests](#running-tests)
- [Test Types](#test-types)
- [Writing Tests](#writing-tests)
- [Test Coverage](#test-coverage)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Overview

The CellBlock testing infrastructure consists of three layers:

1. **Unit Tests** - Test individual functions and logic in isolation
2. **Integration Tests** - Test API endpoints and service interactions
3. **E2E Tests** - Test complete user flows with Playwright

### Test Statistics

- **Total Test Files**: 12+
- **Unit Tests**: 50+ tests covering core business logic
- **Integration Tests**: 40+ tests covering all API endpoints
- **E2E Tests**: 30+ tests covering critical user journeys
- **Target Coverage**: >80% backend, >70% frontend

## Test Infrastructure

### Technologies Used

- **Jest** - Unit and integration test framework
- **Playwright** - E2E testing with cross-browser support
- **Supertest** - HTTP assertion library for API tests
- **Faker** - Test data generation
- **PostgreSQL** - Separate test database

### Project Structure

```
tests/
├── unit/                    # Unit tests
│   ├── time-calculation.spec.ts
│   ├── parole-grant.spec.ts
│   └── simultaneous-device.spec.ts
├── integration/             # Integration tests
│   ├── auth-api.spec.ts
│   └── time-api.spec.ts
├── e2e/                     # End-to-end tests
│   ├── user-signup-flow.spec.ts
│   ├── warden-flow.spec.ts
│   └── time-budget-lockdown.spec.ts
├── utils/                   # Test utilities
│   ├── test-database.ts
│   ├── factories.ts
│   ├── auth-helper.ts
│   └── websocket-helper.ts
├── fixtures/                # Test data
│   ├── users.json
│   └── whitelist-items.json
├── seeds/                   # Database seeds
│   └── test-seed.ts
├── package.json
├── jest.config.js
├── playwright.config.ts
└── .env.test
```

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run playwright:install --workspace=tests

# Set up test database
createdb cellblock_test
```

### Quick Start

```bash
# Run all tests
npm run test --workspace=tests

# Run unit tests only
npm run test:unit --workspace=tests

# Run integration tests only
npm run test:integration --workspace=tests

# Run E2E tests only
npm run test:e2e --workspace=tests

# Run tests in watch mode
npm run test:watch --workspace=tests

# Generate coverage report
npm run test:cov --workspace=tests
```

### Running Specific Tests

```bash
# Run a specific test file
npm run test:unit --workspace=tests -- time-calculation.spec.ts

# Run tests matching a pattern
npm run test:unit --workspace=tests -- --testNamePattern="time budget"

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed --workspace=tests

# Run E2E tests with UI mode
npm run test:e2e:ui --workspace=tests
```

### Environment Configuration

Create `/tests/.env.test`:

```env
NODE_ENV=test
DATABASE_URL="postgresql://cellblock:cellblock@localhost:5432/cellblock_test"
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001
API_BASE_URL=http://localhost:3000/api/v1
JWT_SECRET=test-jwt-secret-key
JWT_REFRESH_SECRET=test-refresh-secret-key
```

## Test Types

### Unit Tests

Test individual functions and business logic in isolation.

**Location**: `/tests/unit/`

**Examples**:

- Time calculation logic
- Budget enforcement rules
- Parole grant logic
- Simultaneous device detection

**Run Command**:

```bash
npm run test:unit --workspace=tests
```

### Integration Tests

Test API endpoints and service interactions with real database.

**Location**: `/tests/integration/`

**Examples**:

- Authentication API (register, login, logout)
- Time budget API (heartbeat, status, budget updates)
- Warden API (invitations, approvals)
- Whitelist API (add, remove, request)

**Run Command**:

```bash
npm run test:integration --workspace=tests
```

**Note**: Integration tests start the backend server automatically.

### E2E Tests

Test complete user journeys using Playwright with real browser.

**Location**: `/tests/e2e/`

**Examples**:

- User signup and email verification
- Warden invitation and acceptance
- Time budget countdown and lockdown
- Whitelist request and approval
- Break glass emergency flow
- Parole grant flow

**Run Command**:

```bash
npm run test:e2e --workspace=tests
```

**Browsers Tested**:

- Chromium (Desktop)
- Firefox (Desktop)
- WebKit/Safari (Desktop)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

## Writing Tests

### Unit Test Example

```typescript
import { TimeService } from '../../srv-back/src/modules/time/time.service';

describe('TimeService', () => {
  it('should deduct time for non-whitelisted apps', async () => {
    const timeService = new TimeService(mockPrisma);

    const result = await timeService.processHeartbeat(userId, deviceId, {
      isWhitelistedApp: false,
    });

    expect(result.remainingSeconds).toBeLessThan(3600);
  });
});
```

### Integration Test Example

```typescript
import * as request from 'supertest';
import { loginUser, getAuthHeaders } from '../utils/auth-helper';

describe('Time API', () => {
  it('should process heartbeat', async () => {
    const tokens = await loginUser({ email, password });

    const response = await request(API_URL)
      .post('/api/v1/time/heartbeat')
      .set(getAuthHeaders(tokens.accessToken))
      .send({ deviceId, timestamp: new Date().toISOString() })
      .expect(200);

    expect(response.body).toHaveProperty('remainingSeconds');
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('should complete signup flow', async ({ page }) => {
  await page.goto('/signup');

  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'TestPassword123!');
  await page.click('button[type="submit"]');

  await expect(page.locator('text=Check your email')).toBeVisible();
});
```

### Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Reset database state between tests
3. **Descriptive Names**: Use clear, behavior-focused test names
4. **AAA Pattern**: Arrange, Act, Assert
5. **Mock External Services**: Don't send real emails or push notifications
6. **Factories**: Use factories to create test data
7. **Test Data**: Use realistic but fake data (Faker)

## Test Coverage

### Current Coverage

Run `npm run test:cov --workspace=tests` to see current coverage.

### Coverage Thresholds

Configured in `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 80,
    lines: 80,
    statements: 80,
  },
}
```

### Coverage Reports

- **Console**: Summary in terminal
- **HTML**: Open `tests/coverage/lcov-report/index.html`
- **LCOV**: For CI/CD integration at `tests/coverage/lcov.info`

### Excluded from Coverage

- Main entry points (`main.ts`)
- Module files (`*.module.ts`)
- DTOs and interfaces
- Type definitions

## CI/CD Integration

### GitHub Actions Workflow

Tests run automatically on:

- Push to `main` or `dev` branches
- Pull requests to `main` or `dev`
- Scheduled nightly runs (optional)

### Workflow Steps

1. **Lint and Type Check**
2. **Unit Tests** - Fast, no database required
3. **Integration Tests** - With PostgreSQL service
4. **Backend Tests (Legacy)** - Existing backend tests
5. **Build Backend**
6. **Build Frontend**
7. **E2E Tests** - Full stack with Playwright
8. **All Checks Passed** - Final gate

### Test Artifacts

- **Playwright Report**: Saved for 30 days
- **Screenshots**: Only on failure
- **Videos**: Only on failure
- **Coverage Reports**: Uploaded to Codecov

### Running Tests Locally Like CI

```bash
# Simulate CI environment
export CI=true
export DATABASE_URL="postgresql://cellblock:testpassword@localhost:5432/cellblock_test"

# Run all checks
npm run lint
npm run test:unit --workspace=tests
npm run test:integration --workspace=tests
npm run test:e2e --workspace=tests
```

## Troubleshooting

### Common Issues

#### Database Connection Errors

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Create test database
createdb cellblock_test

# Run migrations
cd srv-back && npx prisma migrate deploy
```

#### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
export PORT=3001
```

#### Playwright Browser Issues

```bash
# Reinstall browsers
npx playwright install --with-deps

# Check browser installation
npx playwright --version
```

#### Timeout Errors

Increase timeout in test:

```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ...
});
```

Or globally in `playwright.config.ts`:

```typescript
timeout: 60000,
```

#### Database State Issues

```bash
# Clean and reseed database
npm run clean --workspace=tests
cd tests && ts-node seeds/test-seed.ts
```

### Debug Mode

#### Jest Debug

```bash
npm run test:debug --workspace=tests
# Then open chrome://inspect in Chrome
```

#### Playwright Debug

```bash
# Run with headed browser
npm run test:e2e:headed --workspace=tests

# Run with UI mode (interactive)
npm run test:e2e:ui --workspace=tests

# Debug specific test
npx playwright test --debug user-signup-flow.spec.ts
```

### Logs

Enable verbose logging:

```bash
DEBUG=* npm run test:integration --workspace=tests
```

## Continuous Improvement

### Adding New Tests

1. Identify untested code paths in coverage report
2. Write tests following existing patterns
3. Run tests locally
4. Submit PR with tests

### Test Maintenance

- Keep tests up-to-date with code changes
- Remove obsolete tests
- Refactor duplicated test code into utilities
- Update fixtures when data models change

### Performance

- Keep unit tests fast (<1s each)
- Use `beforeEach` for common setup
- Run E2E tests in parallel when possible
- Mock slow external services

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
- [Coverage Reports](./coverage/lcov-report/index.html)

---

**Last Updated**: 2024-11-30
**Maintained By**: CellBlock Testing Team
