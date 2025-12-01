# Developer Guide

Welcome to the CellBlock developer documentation. This section covers technical architecture, contribution guidelines, and deployment procedures.

## For Contributors

If you want to contribute to CellBlock:

- **[Contributing Guide](contributing.md)** - How to contribute code, docs, and bug reports
- **[Architecture](architecture.md)** - System design and technical decisions
- **[Deployment](deployment.md)** - How to deploy CellBlock to production

## Quick Links

### Getting Started

- [Repository](https://github.com/dirkpetersen/cellblock)
- [Issues](https://github.com/dirkpetersen/cellblock/issues)
- [Discussions](https://github.com/dirkpetersen/cellblock/discussions)
- [Pull Requests](https://github.com/dirkpetersen/cellblock/pulls)

### Technical Documentation

- [API Reference](../api/rest.md)
- [WebSocket Events](../api/websocket.md)
- [Database Schema](https://github.com/dirkpetersen/cellblock/blob/main/DBSCHEMA.md)
- [Technical Specifications](https://github.com/dirkpetersen/cellblock/blob/main/CLAUDE.md)

## Tech Stack Overview

### Backend

- **Framework**: NestJS (Node.js/TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.io for WebSocket communication
- **Authentication**: JWT with bcrypt password hashing
- **Email**: AWS SES or SendGrid
- **Deployment**: AWS EC2

### Frontend

- **Framework**: Next.js 14 (React App Router)
- **Styling**: TailwindCSS
- **State Management**: TanStack Query (server state) + Zustand (client state)
- **Type Safety**: TypeScript with shared types
- **Deployment**: GitHub Pages (static export)

### Mobile (iOS)

- **Language**: Swift
- **UI**: SwiftUI
- **APIs**: Screen Time API, DeviceActivity, ManagedSettings
- **Platform**: iOS 16.0+

### Desktop (Windows)

- **Language**: C# .NET 8
- **UI**: WPF/WinUI
- **Blocking**: Windows Filtering Platform (WFP)
- **Platform**: Windows 10/11

### Monorepo

- **Package Manager**: npm
- **Workspaces**: Multiple packages with shared types
- **Build Tool**: Turbo for caching and parallel execution
- **CI/CD**: GitHub Actions

## Development Environment

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14
- npm >= 9.0.0
- Git

### Local Setup

```bash
# Clone repository
git clone https://github.com/dirkpetersen/cellblock.git
cd cellblock

# Install dependencies
npm install

# Set up environment variables
cp srv-back/.env.example srv-back/.env
cp srv-front/.env.example srv-front/.env.local

# Initialize database
cd srv-back
npx prisma generate
npx prisma migrate dev
npx prisma db seed

# Start development servers
npm run dev
```

Visit:

- Frontend: http://localhost:3001
- Backend: http://localhost:3000
- API Docs: http://localhost:3000/api/v1

## Project Structure

```
cellblock/
├── packages/
│   ├── types/           # Shared TypeScript types
│   └── contracts/       # API contracts (Zod schemas)
├── srv-back/            # NestJS backend
├── srv-front/           # Next.js frontend
├── ios/                 # Swift iOS client
├── windows/             # C# Windows client
├── tests/               # Automated tests
├── docs/                # Documentation (mkdocs)
├── .github/workflows/   # CI/CD pipelines
└── [config files]
```

## Contributing Workflow

1. **Fork the repository**
2. **Create a feature branch** from `dev`
3. **Make your changes**
4. **Write/update tests**
5. **Update documentation**
6. **Submit pull request** to `dev` branch

See [Contributing Guide](contributing.md) for detailed instructions.

## Key Development Guidelines

### Code Style

- **TypeScript**: ESLint + Prettier configuration provided
- **Commits**: Conventional Commits format (`feat:`, `fix:`, `docs:`, etc.)
- **Testing**: Write tests for new features
- **Documentation**: Update docs alongside code changes

### Branch Strategy

- `main` - Production-ready code
- `dev` - Active development branch
- `feature/*` - Feature branches off `dev`

### Testing Requirements

- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- 80%+ code coverage for backend

### Documentation Standards

- Code comments for complex logic
- JSDoc for public APIs
- README updates for new features
- User documentation for UI changes

## Community

### Getting Help

- **Questions**: [GitHub Discussions](https://github.com/dirkpetersen/cellblock/discussions)
- **Bugs**: [GitHub Issues](https://github.com/dirkpetersen/cellblock/issues)
- **Features**: [GitHub Discussions](https://github.com/dirkpetersen/cellblock/discussions/categories/ideas)

### Code of Conduct

We follow the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

Be respectful, inclusive, and professional in all interactions.

## License

CellBlock is open source software licensed under the MIT License.

See [LICENSE](https://github.com/dirkpetersen/cellblock/blob/main/LICENSE) for details.

---

Ready to contribute? Start with the [Contributing Guide](contributing.md)!
