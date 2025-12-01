# Contributing to CellBlock

Thank you for your interest in contributing to CellBlock! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)
- [Submitting Changes](#submitting-changes)
- [Review Process](#review-process)

## Code of Conduct

We follow the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). Please read and follow it in all interactions.

### Key Principles

- Be respectful and inclusive
- Welcome newcomers
- Focus on what's best for the community
- Show empathy towards others

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14
- npm >= 9.0.0
- Git
- GitHub account

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/cellblock.git
cd cellblock
```

3. Add upstream remote:

```bash
git remote add upstream https://github.com/dirkpetersen/cellblock.git
```

### Local Setup

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp srv-back/.env.example srv-back/.env
cp srv-front/.env.example srv-front/.env.local
```

Edit these files with your local database credentials and API keys.

3. Initialize database:

```bash
cd srv-back
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
cd ..
```

4. Start development servers:

```bash
npm run dev
```

This starts both backend (port 3000) and frontend (port 3001) in watch mode.

### Verify Setup

Visit these URLs to verify everything works:

- Frontend: http://localhost:3001
- Backend API: http://localhost:3000/api/v1
- API Health Check: http://localhost:3000/api/v1/health

## Development Workflow

### 1. Create a Branch

Always branch from `dev`:

```bash
git checkout dev
git pull upstream dev
git checkout -b feature/my-feature-name
```

### Branch Naming Convention

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or fixes
- `chore/` - Maintenance tasks

Examples:

- `feature/warden-dashboard-improvements`
- `fix/timezone-calculation-bug`
- `docs/api-authentication-guide`

### 2. Make Changes

Follow our [Coding Standards](#coding-standards) when making changes.

### 3. Write Tests

Add tests for new functionality:

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test srv-back/src/time-budget/time-budget.service.spec.ts
```

### 4. Update Documentation

- Update code comments
- Update relevant markdown files in `/docs`
- Update README if needed

### 5. Commit Changes

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

**Scopes:**

- `backend` or `srv-back`
- `frontend` or `srv-front`
- `ios`
- `windows`
- `docs`
- `api`
- `db` or `database`

**Examples:**

```bash
git commit -m "feat(backend): add weekly usage report API endpoint"
git commit -m "fix(ios): resolve heartbeat reconnection bug"
git commit -m "docs(user-guide): add timezone configuration instructions"
```

### 6. Push to Your Fork

```bash
git push origin feature/my-feature-name
```

### 7. Create Pull Request

1. Go to GitHub and navigate to your fork
2. Click "New Pull Request"
3. Target the `dev` branch (not `main`)
4. Fill out the PR template
5. Submit the PR

## Coding Standards

### TypeScript/JavaScript

**Style Guide:**

- Use TypeScript for all new code
- Enable strict mode
- Use meaningful variable names
- Keep functions small and focused
- Prefer const over let, avoid var
- Use async/await over promises

**Formatting:**

- We use Prettier for code formatting
- ESLint for linting
- Run before committing:

```bash
npm run lint
npm run format
```

**Example:**

```typescript
// Good
async function getUserTimeRemaining(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { timeBudget: true }
  });

  if (!user) {
    throw new NotFoundException(`User ${userId} not found`);
  }

  return calculateRemainingTime(user.timeBudget);
}

// Bad
async function getTime(id) {
  let u = await prisma.user.findUnique({ where: { id: id }, include: { timeBudget: true } })
  if (!u) throw new Error("not found")
  return calculateRemainingTime(u.timeBudget)
}
```

### React/Next.js

**Component Structure:**

- Use functional components with hooks
- One component per file
- Organize by feature, not by type
- Use TypeScript interfaces for props

**Example:**

```typescript
// components/TimeDisplay.tsx
interface TimeDisplayProps {
  remainingSeconds: number;
  onRequestParole: () => void;
}

export function TimeDisplay({ remainingSeconds, onRequestParole }: TimeDisplayProps) {
  const { hours, minutes } = formatTime(remainingSeconds);

  return (
    <div className="flex flex-col items-center">
      <p className="text-4xl font-bold">
        {hours}h {minutes}m
      </p>
      {remainingSeconds < 900 && (
        <button onClick={onRequestParole} className="btn-primary">
          Request More Time
        </button>
      )}
    </div>
  );
}
```

### Database

**Prisma Schema:**

- Use descriptive model names (PascalCase)
- Use descriptive field names (camelCase)
- Add comments for complex fields
- Include created_at and updated_at timestamps

**Migrations:**

- Create migrations with descriptive names
- Never edit existing migrations
- Test migrations on sample data

```bash
npx prisma migrate dev --name add_parole_grant_table
```

### API Design

**REST Endpoints:**

- Use RESTful conventions
- Versioning: `/api/v1/...`
- Return appropriate HTTP status codes
- Include clear error messages

**Example:**

```typescript
@Post('whitelist')
@HttpCode(201)
async addWhitelistItem(
  @Body() dto: AddWhitelistItemDto,
  @User() user: UserEntity
): Promise<WhitelistItemResponse> {
  return this.whitelistService.addItem(user.id, dto);
}
```

## Testing Requirements

### Unit Tests

Test individual functions and methods:

```typescript
// time-budget.service.spec.ts
describe('TimeBudgetService', () => {
  describe('calculateRemainingTime', () => {
    it('should calculate remaining time correctly', () => {
      const budget = {
        dailyLimitMinutes: 120,
        usedMinutesToday: 45
      };

      const remaining = service.calculateRemainingTime(budget);

      expect(remaining).toBe(75 * 60); // 75 minutes in seconds
    });

    it('should return 0 for negative remaining time', () => {
      const budget = {
        dailyLimitMinutes: 120,
        usedMinutesToday: 150
      };

      const remaining = service.calculateRemainingTime(budget);

      expect(remaining).toBe(0);
    });
  });
});
```

### Integration Tests

Test API endpoints:

```typescript
// whitelist.controller.spec.ts
describe('WhitelistController (e2e)', () => {
  it('/api/v1/whitelist (POST) should add item', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/whitelist')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Work Slack',
        windowsDomain: 'slack.com',
        category: 'custom'
      })
      .expect(201);

    expect(response.body.name).toBe('Work Slack');
    expect(response.body.category).toBe('custom');
  });
});
```

### End-to-End Tests

Test critical user flows with Playwright:

```typescript
// tests/e2e/warden-approval.spec.ts
test('warden can approve whitelist request', async ({ page }) => {
  // Login as inmate
  await page.goto('/login');
  await page.fill('[name="email"]', 'inmate@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Request whitelist addition
  await page.goto('/settings/whitelist');
  await page.click('button:has-text("Add Item")');
  await page.fill('[name="name"]', 'Zoom');
  await page.fill('[name="iosBundleId"]', 'us.zoom.videomeetings');
  await page.click('button:has-text("Request")');

  // Login as warden
  await page.goto('/logout');
  await page.goto('/login');
  await page.fill('[name="email"]', 'warden@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Approve request
  await page.goto('/warden/requests');
  await page.click('button:has-text("Approve")');

  // Verify approval
  await expect(page.locator('text=Approved')).toBeVisible();
});
```

### Running Tests

```bash
# All tests
npm run test

# Specific package
npm run test:backend
npm run test:frontend

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

### Coverage Requirements

- Backend: 80%+ coverage
- Critical paths: 100% coverage
- New features: Must include tests

## Documentation

### Code Documentation

Use JSDoc for public APIs:

```typescript
/**
 * Calculate remaining time in seconds for a user's time budget.
 *
 * @param userId - The unique identifier of the user
 * @returns Remaining time in seconds, or 0 if budget exhausted
 * @throws NotFoundException if user doesn't exist
 *
 * @example
 * const remaining = await calculateRemainingTime('user-123');
 * console.log(`${remaining} seconds remaining`);
 */
async function calculateRemainingTime(userId: string): Promise<number> {
  // ...
}
```

### User Documentation

Update markdown files in `/docs`:

- User-facing features → `/docs/docs/user-guide/`
- API changes → `/docs/docs/api/`
- Architecture changes → `/docs/docs/developer-guide/`

Build and preview docs locally:

```bash
cd docs
pip install mkdocs-material
mkdocs serve
# Visit http://localhost:8000
```

### README Updates

Update relevant README files:

- `/README.md` - Project overview
- `/srv-back/README.md` - Backend setup
- `/srv-front/README.md` - Frontend setup
- `/tests/README.md` - Testing guide

## Submitting Changes

### Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code follows style guidelines
- [ ] All tests pass locally
- [ ] New tests added for new functionality
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] Branch is up to date with `dev`
- [ ] No merge conflicts

### PR Description Template

```markdown
## Description
Brief description of changes.

## Motivation
Why is this change needed? What problem does it solve?

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
How was this tested? Include test cases.

## Screenshots (if applicable)
Add screenshots for UI changes.

## Related Issues
Closes #123
Related to #456

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No breaking changes (or documented if unavoidable)
```

## Review Process

### What to Expect

1. **Automated Checks** - CI/CD runs tests, linting, build
2. **Code Review** - Maintainers review your code
3. **Feedback** - You may be asked to make changes
4. **Approval** - Once approved, PR is merged to `dev`
5. **Release** - Changes included in next release

### Timeline

- Initial review: Within 3-5 days
- Follow-up reviews: 1-2 days
- Merge: After approval and passing checks

### Addressing Feedback

When reviewers request changes:

1. Make the requested changes
2. Commit with descriptive message
3. Push to your branch (PR updates automatically)
4. Respond to comments explaining your changes
5. Request re-review

### After Merge

- Your changes are in `dev` branch
- Will be included in next release to `main`
- Close related issues if applicable
- Update your fork:

```bash
git checkout dev
git pull upstream dev
git push origin dev
```

## Types of Contributions

### Bug Fixes

1. Create an issue describing the bug (if not already created)
2. Reference the issue in your PR
3. Include steps to reproduce
4. Add regression test

### New Features

1. Discuss feature in GitHub Discussions first
2. Get consensus before implementing
3. Break large features into smaller PRs
4. Update documentation

### Documentation

1. Typo fixes and small improvements can be PRed directly
2. Large documentation changes should be discussed first
3. Test documentation builds locally
4. Check for broken links

### Tests

1. Adding missing test coverage is always welcome
2. Follow existing test patterns
3. Ensure tests are deterministic

## Getting Help

### Questions?

- **General Questions**: [GitHub Discussions](https://github.com/dirkpetersen/cellblock/discussions)
- **Bug Reports**: [GitHub Issues](https://github.com/dirkpetersen/cellblock/issues)
- **Feature Requests**: [GitHub Discussions - Ideas](https://github.com/dirkpetersen/cellblock/discussions/categories/ideas)

### Stuck?

- Check existing issues and PRs
- Ask in GitHub Discussions
- Read the [Architecture Guide](architecture.md)
- Review the [CLAUDE.md](https://github.com/dirkpetersen/cellblock/blob/main/CLAUDE.md) technical spec

## Recognition

Contributors are recognized in:

- [GitHub Contributors](https://github.com/dirkpetersen/cellblock/graphs/contributors) page
- Release notes for significant contributions
- Special thanks in documentation for major features

## License

By contributing to CellBlock, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to CellBlock! Your efforts help make digital wellbeing accessible to everyone.
