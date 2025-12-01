# CellBlock Backend

NestJS backend API server for CellBlock digital wellbeing application.

## Tech Stack

- **Framework:** NestJS (Node.js/TypeScript)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT + Google OAuth 2.0
- **WebSocket:** Socket.io for real-time communication
- **Validation:** Zod schemas + class-validator

## Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14
- npm >= 9.0.0

## Getting Started

### 1. Environment Setup

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and configure:

- `DATABASE_URL`: Your PostgreSQL connection string
- `JWT_SECRET`: Random secret key for JWT signing
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: From Google OAuth console
- Email service credentials (AWS SES, SendGrid, or Mailgun)

### 2. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed default whitelist items
npm run prisma:seed
```

### 3. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api/v1`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## Project Structure

```
srv-back/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Database seeding script
├── src/
│   ├── common/            # Shared utilities
│   │   └── prisma/        # Prisma service
│   ├── modules/           # Feature modules (TODO)
│   ├── config/            # Configuration files
│   ├── app.module.ts      # Root module
│   └── main.ts            # Application entry point
└── test/                  # Test files
```

## API Documentation

Once the server is running, visit:

- Health check: `GET /api/v1/health`
- API info: `GET /api/v1`

Full API documentation will be available at `/api/v1/docs` (OpenAPI/Swagger) once implemented.

## Database Schema

See [DBSCHEMA.md](../DBSCHEMA.md) for complete database schema documentation.

Key tables:

- `users` - User accounts (inmates and wardens)
- `devices` - Registered devices
- `time_budgets` - Daily/weekly time allowances
- `whitelist_items` - Allowed apps and domains
- `warden_relationships` - Inmate-warden connections
- `usage_logs` - Time tracking history

## Development Notes

- All times are stored in UTC/GMT
- Daily budget resets at midnight in user's configured timezone
- WebSocket heartbeats every 30-60 seconds
- Automated cleanup jobs run daily via cron
- Rate limiting: 10 whitelist requests/hour, 5 budget requests/hour

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Deployment

See [deployment documentation](../docs/developer-guide/deployment.md) for production deployment guide.

## Environment Variables Reference

| Variable               | Description                      | Required | Default     |
| ---------------------- | -------------------------------- | -------- | ----------- |
| `NODE_ENV`             | Environment mode                 | No       | development |
| `PORT`                 | Server port                      | No       | 3000        |
| `DATABASE_URL`         | PostgreSQL connection string     | Yes      | -           |
| `JWT_SECRET`           | JWT signing secret               | Yes      | -           |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID           | Yes      | -           |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret              | Yes      | -           |
| `SENDGRID_API_KEY`     | SendGrid API key                 | No\*     | -           |
| `APNS_KEY_ID`          | Apple Push Notification key      | No\*     | -           |
| `WNS_CLIENT_ID`        | Windows Push Notification client | No\*     | -           |

\*Required for production features
