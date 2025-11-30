# CellBlock Frontend

Next.js frontend dashboard for CellBlock digital wellbeing application.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **UI:** React 18 with TailwindCSS
- **State Management:** TanStack Query + Zustand
- **WebSocket:** Socket.io-client
- **Type Safety:** TypeScript + Zod validation

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

## Getting Started

### 1. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: `http://localhost:3000/api/v1`)
- `NEXT_PUBLIC_WS_URL`: WebSocket server URL (default: `http://localhost:3000`)

### 2. Start Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:3001`

## Available Scripts

- `npm run dev` - Start development server on port 3001
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
srv-front/
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js App Router pages
│   │   ├── globals.css  # Global styles
│   │   ├── layout.tsx   # Root layout
│   │   ├── page.tsx     # Landing page
│   │   └── providers.tsx # React Query provider
│   ├── components/      # React components (TODO)
│   │   ├── ui/          # Reusable UI components
│   │   ├── inmate/      # Inmate dashboard components
│   │   └── warden/      # Warden dashboard components
│   └── lib/             # Utilities (TODO)
│       ├── api/         # API client functions
│       ├── hooks/       # Custom React hooks
│       └── stores/      # Zustand stores
└── tailwind.config.ts   # Tailwind configuration
```

## Design System

### Brand Colors

- **Primary (Teal):** `#0D9488` - Trust, calm, digital wellness
- **Secondary (Slate):** `#475569` - Professional, neutral
- **Accent (Amber):** `#F59E0B` - Warnings, attention
- **Success (Emerald):** `#10B981` - Approvals, available time
- **Danger (Rose):** `#F43F5E` - Lockdown, errors

### Typography

- **Sans-serif:** Inter (headings and body)
- **Monospace:** JetBrains Mono (code, time displays)

### Dark Mode

Dark mode is automatically detected from system preferences and can be toggled manually. Use Tailwind's `dark:` prefix for dark mode styles.

## Key Features

### Inmate Dashboard
- Real-time countdown timer (updates every minute)
- Time budget configuration (daily/weekly)
- Whitelist management with request system
- Device management
- Usage analytics and graphs
- Break glass emergency unlock

### Warden Dashboard
- Unified view of all supervised inmates
- Real-time status indicators
- Pending requests inbox with quick actions
- Emergency controls (parole grants, lockdown)
- Usage reports and trends
- Communication via comments

## State Management

### Server State (TanStack Query)
- API data fetching and caching
- Automatic refetching and invalidation
- Optimistic updates

### Client State (Zustand)
- UI state (modals, sidebars)
- User preferences
- Dark mode toggle

### WebSocket (Socket.io)
- Real-time time updates
- Lock/unlock commands
- Configuration changes
- Warden notifications

## Development Guidelines

- Use TypeScript for all files
- Follow component-first development
- Keep components small and focused
- Use Tailwind classes over custom CSS
- Implement proper error boundaries
- Add loading states for all async operations

## Responsive Design

Mobile-first approach with breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## Testing

Tests will be implemented with Playwright for E2E testing and React Testing Library for component tests.

## Deployment

The frontend can be deployed as:
1. **Static Export:** `npm run build` → Deploy to GitHub Pages
2. **Server:** `npm run build && npm run start` → Deploy to Vercel/Netlify
3. **Docker:** Build container and deploy anywhere

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes | http://localhost:3000/api/v1 |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | Yes | http://localhost:3000 |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID | No | - |

## Contributing

See [CLAUDE.md](../CLAUDE.md) for comprehensive development guidelines and architecture decisions.
