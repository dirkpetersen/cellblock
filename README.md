# CellBlock

**CellBlock** is a cross-platform digital wellbeing app designed for high-accountability usage. Unlike standard blockers, CellBlock enforces a "Default Deny" policy where the internet is blocked by default, allowing only specific exceptions. It features a flexible time budget that synchronizes across devices and requires a secondary user ("Warden") to authorize changes or unlock the device after time expires.

## Core Principles

- **Whitelist-First:** Block everything by default; allow only essentials (Maps, Calculator, Banking)
- **Shared Budget:** Time usage synchronizes across all devices (30 min on iOS = 30 min on Windows)
- **Friend Enforcement:** A trusted "Warden" approves settings changes and can grant emergency time
- **Healthy Apps:** Less distracting audio apps (Spotify, Audible) allowed but can be disabled

## Features

### For Users (Inmates)

- ⏱️ Cross-device time budget synchronization
- 📱 Support for iOS and Windows (Android/macOS coming later)
- ✅ Whitelist utility apps (Maps, Banking, etc.)
- 🎵 Optional healthy apps (Spotify, Audible, Podcasts)
- 📊 Usage analytics and trends
- 🚨 Break glass emergency unlock
- ⚠️ 15-minute and 5-minute warnings before lockdown

### For Wardens

- 👥 Supervise unlimited inmates from unified dashboard
- ✔️ Approve/deny whitelist and time budget requests
- 🆘 Grant emergency time (parole)
- 🔒 Trigger immediate or delayed lockdowns
- 📈 View usage reports and trends
- 💬 Communicate via request comments

## Tech Stack

- **Backend:** NestJS (Node.js/TypeScript) + PostgreSQL + Prisma
- **Frontend:** Next.js 14 (React) + TailwindCSS + TanStack Query
- **iOS Client:** Swift + SwiftUI + Screen Time API
- **Windows Client:** C# .NET 8 + WPF/WinUI
- **Communication:** WebSockets (Socket.io) + REST API

## Repository Structure

```
cellblock/
├── packages/
│   ├── types/         # Shared TypeScript types
│   └── contracts/     # API contracts with Zod schemas
├── srv-back/          # NestJS backend API
├── srv-front/         # Next.js frontend dashboard
├── ios/               # Swift iOS client (TODO)
├── windows/           # C# Windows client (TODO)
├── tests/             # Automated tests (Playwright, Jest)
├── docs/              # Documentation (mkdocs-material)
├── CLAUDE.md          # Development guide for Claude Code
├── DBSCHEMA.md        # Database schema documentation
└── REQUIREMENTS.md    # System requirements specification
```

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14
- npm >= 9.0.0

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/dirkpetersen/cellblock.git
cd cellblock
```

2. **Install dependencies:**

```bash
npm install
```

3. **Set up environment variables:**

```bash
# Backend
cp srv-back/.env.example srv-back/.env
# Edit srv-back/.env with your database URL and secrets

# Frontend
cp srv-front/.env.example srv-front/.env.local
# Edit srv-front/.env.local with your API URLs
```

4. **Set up database:**

```bash
cd srv-back
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

5. **Start development servers:**

```bash
# Terminal 1 - Backend (port 3000)
cd srv-back
npm run dev

# Terminal 2 - Frontend (port 3001)
cd srv-front
npm run dev
```

Visit:

- Frontend: http://localhost:3001
- Backend API: http://localhost:3000/api/v1
- API Health: http://localhost:3000/api/v1/health

## Development

### Monorepo Scripts

```bash
# Build all packages
npm run build

# Run all dev servers
npm run dev

# Run all tests
npm run test

# Lint all packages
npm run lint

# Format all code
npm run format
```

### Individual Packages

See README files in each workspace:

- [Backend README](srv-back/README.md)
- [Frontend README](srv-front/README.md)
- [iOS README](ios/README.md)
- [Windows README](windows/README.md)
- [Tests README](tests/README.md)

## Documentation

- **User Guide:** [docs.cellblock.app](https://dirkpetersen.github.io/cellblock) (Coming soon)
- **Architecture:** See [CLAUDE.md](CLAUDE.md) for comprehensive technical documentation
- **Database:** See [DBSCHEMA.md](DBSCHEMA.md) for schema details
- **Requirements:** See [REQUIREMENTS.md](REQUIREMENTS.md) for full specification

## Deployment

### Local Testing (Current)

- Backend and frontend run on Ubuntu 24.04 (WSL2)
- PostgreSQL in Docker or native
- Windows client tested on Windows 11 host

### Production (Future)

- Backend: AWS EC2 instance with PostgreSQL
- Frontend: GitHub Pages (static export)
- Clients: Direct downloads from website

## Development Roadmap

### Phase 1: MVP (Trust Model) ✅ In Progress

- [x] Repository setup and documentation
- [x] Database schema design
- [x] Backend API foundation
- [x] Frontend foundation
- [ ] Authentication system (email/password + Google OAuth)
- [ ] Time tracking with WebSocket heartbeats
- [ ] Warden invitation and approval system
- [ ] Whitelist management
- [ ] Basic Windows client (hosts file blocking)
- [ ] Basic iOS client (Screen Time API)

### Phase 2: Enforcement Model (Future)

- [ ] iOS Family Controls entitlement
- [ ] iOS strict mode (block all except whitelist)
- [ ] Windows WFP driver for robust blocking
- [ ] Enhanced tamper detection
- [ ] Advanced analytics and reporting

## Contributing

CellBlock is open source (MIT License). Contributions welcome!

All development is currently managed by Claude Code (AI-powered development).

See [CLAUDE.md](CLAUDE.md) for:

- Architecture decisions
- Development workflow
- Multi-agent coordination strategy
- Implementation guidelines

## License

MIT License - See [LICENSE](LICENSE) for details

## Support

- **Issues:** https://github.com/dirkpetersen/cellblock/issues
- **Discussions:** https://github.com/dirkpetersen/cellblock/discussions

## Acknowledgments

Built with Claude Code - AI-powered software development by Anthropic.
