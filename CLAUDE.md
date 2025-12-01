# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CellBlock** is a cross-platform digital wellbeing app with high-accountability enforcement. It implements a "Default Deny" policy where internet access is blocked by default, with only specific exceptions allowed.

**Core Principles:**

- **Whitelist-First:** Block everything; allow only essentials (e.g., Maps, Work Tools)
- **Shared Budget:** Time usage synchronizes across all devices (60 minutes on iOS reduces Windows time)
- **Friend Enforcement:** A "Warden" (secondary user) approves settings changes and emergency unlocks

## System Architecture

**Hub-and-Spoke Model:** Backend is the source of truth for time budgets.

### Tech Stack

- **iOS Client:** Swift (SwiftUI + Screen Time API)
- **Windows Client:** C# .NET 8 (WPF/WinUI + Packet Filtering)
- **Backend:** Node.js/TypeScript (Express or NestJS)
- **Frontend:** Next.js (React) with TailwindCSS
- **Database:** PostgreSQL
- **Communication:** WebSockets for heartbeats (enables real-time bidirectional communication, lower latency than polling, server can push LOCK_CMD immediately)

### Repository Structure

```
/ios          - Swift iOS client (iOS 16.0+)
/windows      - C# .NET 8 Windows client
/srv-back     - Backend API server
/srv-front    - Next.js frontend dashboard
/android      - Android client (future, post-launch)
/osx          - macOS client (future, post-launch)
/docs         - mkdocs-material documentation
```

## Core Design Decisions

### Time Tracking & Synchronization

- **Authoritative Time:** Server time (UTC/GMT) is the only source of truth; client timestamps are ignored to prevent clock manipulation
- **Offline Handling:** Offline devices do not accrue time; time is only deducted when server receives heartbeats
- **Connection Drops:** Clients must implement automatic reconnection logic with exponential backoff
- **Simultaneous Device Detection:** Devices sending heartbeats within 45 seconds of each other are considered "simultaneous" - only 1 minute of wall-clock time is deducted
- **Backend Failure Mode:** If server is down, clients default to OPEN (fail-safe, preserves utility app access)

### Time Budget Rules

- **Timezone:**
  - Default: Inmate's phone timezone (detected from device)
  - Can be manually changed in settings
  - Daily reset at midnight in user's configured timezone
  - Server stores user timezone preference
- **Daily Reset:** Budget resets at midnight in user's timezone
- **Rollover:** Unused daily time does NOT roll over
- **Weekly Maximum:** Implement a maximum time per week constraint (in addition to daily limits)
- **Budget Priority:** Daily limit takes precedence over weekly:
  - If daily limit (2hr) is reached, user is locked even if weekly budget remains
  - If weekly limit is exhausted mid-week, ALL remaining days are locked (even if daily limits would allow more)
- **Minimum Budget:** 0 minutes is allowed (complete lockout except whitelisted apps)
- **Whitelist Behavior:** Whitelisted app/domain usage does NOT count toward time budget
- **Granularity Options:**
  - Per-day configuration: Different limits for each day (Mon: 2hr, Tue: 3hr, Wed: 2hr, etc.)
  - Preset option: Weekday vs Weekend (e.g., Weekdays: 2hr, Weekends: 4hr)
  - UI should support both modes
- **Parole Budget Accounting:** Emergency time granted via parole counts toward weekly budget limit
- **Parole Timezone:** When warden grants parole "until [datetime]", the datetime is interpreted in the inmate's configured timezone

### Warden System

- **Multiple Wardens:** Users can have up to 4 wardens (1 primary + 3 backups)
- **Request Expiration:** If no warden responds within 3 days, requests automatically expire (not approved)
- **Approval Requirements:** ANY warden can approve; only one approval needed
- **Unlimited Inmates:** A warden can supervise unlimited inmates
- **Unified Dashboard:** Wardens see all their inmates in one dashboard with status overview
- **Warden Visibility:**
  - Wardens can see ALL other wardens for the same inmate
  - Wardens can see each other's approval/denial decisions and comments
  - Full transparency between all wardens supervising the same inmate
- **Warden Management:**
  - Wardens can resign from duty → inmate prompted to promote backup warden to primary
  - Inmates can remove warden if they have backup warden → backup becomes primary, both wardens notified
  - No abuse reporting system
- **Parole Override Behavior:** Last parole grant always replaces previous ones (not additive)
- **Time Budget Change Requests:**
  - Inmates CAN request changes to their time budget (daily/weekly limits)
  - Requires warden approval (same flow as whitelist requests)
  - Request type: `budget_change` in requests table

### Whitelist Data Model

**Schema Decision:** Use platform-specific columns in a unified whitelist table:

```
whitelist_items {
  id: uuid
  user_id: uuid
  name: string (display name)
  ios_bundle_id: string? (e.g., "com.google.Maps")
  windows_domain: string? (e.g., "github.com")
  android_package_name: string? (future)
  category: string (utility | healthy | custom)
  is_enabled: boolean (default true)
  created_at: timestamp
}
```

- At least one platform field must be non-null
- Clients filter by their platform-specific column
- Keep it simple: No time-based exceptions, no URL path filtering

**Whitelist Categories:**

1. **Utility Apps** (category: `utility`)
   - Always allowed, cannot be disabled
   - Examples: Google Maps, Waze, Calculator, Weather apps, Banking apps
   - Pre-populated on account creation
   - iOS: Phone, Messages, FaceTime, Maps, Calendar, Clock, Calculator
   - Windows: maps.google.com, weather.com, banking domains

2. **Healthy Apps** (category: `healthy`)
   - Allowed by default but CAN be disabled
   - Audio/entertainment that's less distracting
   - Examples: Spotify, Audible, Apple Music, Podcasts, Kindle
   - Pre-populated on account creation with `is_enabled: true`
   - **Toggling requires warden approval** (after warden accepts invite)
   - Before warden: User can toggle freely

3. **Custom Apps** (category: `custom`)
   - User-added whitelist items
   - Require warden approval after warden accepts invite
   - Examples: Work tools, specific websites

**Default Whitelist Seeding:**
On account creation, automatically populate:

- All utility apps for each platform (always enabled)
- All healthy apps for each platform (enabled by default)

### Known Limitations

- **Windows Tamper Resistance:** Safe Mode bypass, new admin account creation, and Live USB boot are acknowledged limitations and will not be prevented
- **iOS Phase 1:** Use Screen Time API only; Family Controls entitlement not required for MVP
- **Whitelist Granularity:** Domain/Bundle ID level only; no sub-path filtering

## User Flows & Experience

### Initial Setup Flow

**Default Time Budget:**

- Default: 2 hours recreational screen time per day
- Maximum allowed: 5 hours per day (enforced by app)
- UI: Slider with color coding:
  - 2 hours = Green
  - 3-4 hours = Yellow
  - 5 hours = Red

**Warden Assignment:**

- Optional during signup (users can start without a warden)
- If no warden assigned:
  - Daily email reminders for first 7 days
  - Weekly email reminders after that
  - Subject: "Add a Warden to enforce your CellBlock limits"

**Whitelist Management:**

- Before warden accepts: Users can add/remove whitelist items themselves
- After warden accepts: All whitelist changes require warden approval
- Wardens can also directly add/remove whitelist items for their inmates

### Warden Invitation & Relationship

**Invitation Process:**

- Inmate sends email invitation to warden
- Email contains accept/decline links
- Warden cannot see inmate's data until they accept
- Reciprocal relationships allowed (A is warden for B, B is warden for A)

**Relationship States:**

- `pending` - Invitation sent, not yet accepted
- `active` - Warden has accepted and is actively monitoring
- `cancelled` - Relationship terminated (see Uninstall Behavior)

### Device Management

**Device Limits:**

- Maximum 12 devices per user account
- Device Identification: Use combination of platform-specific IDs:
  - iOS: `identifierForVendor` (UUID)
  - Windows: MAC address hash + Windows Machine GUID
  - Store as `device_fingerprint` in database

**Device Registration:**

- Automatic on first heartbeat from new device
- Stores: device name, platform, fingerprint, first_seen, last_seen
- Users can remove old/unused devices from dashboard

### Emergency Access & Warnings

**Time Warnings:**

- 15-minute warning when `remainingSeconds == 900`
- 5-minute warning when `remainingSeconds == 300`
- Push notification + in-app banner
- After warnings expire: Immediate lockdown

**Break Glass Feature:**

- User can trigger "Break Glass" to immediately unlock
- Sends notification to ALL wardens: "X has broken glass and is no longer under your supervision"
- Optional comment field for user to explain emergency
- Permanently ends warden relationship (requires re-invitation to restore)
- No cooldown period - relationship is terminated
- **Pending Requests:** All pending requests (whitelist, budget changes) are automatically CANCELLED when break glass is triggered

**Warden Parole (Emergency Time):**

- Warden can grant unlimited emergency time
- Two formats:
  - "Open until [date/time]" - suspends all blocking until specified time
  - "[X] minutes" - adds X minutes to current budget
- No maximum limit on granted time
- No cooldown period between parole grants
- All parole grants logged in database for accountability
- Last parole grant always replaces previous ones (not cumulative)

**Warden Lockdown:**

- Immediately sets daily and weekly remaining time to 0
- Option 1: Immediate lockdown (no grace period)
- Option 2: Lockdown with grace period (e.g., "Lockdown in 30 minutes")
  - Grace period notification sent to inmate
  - Timer displayed in client UI
  - Lockdown executes after grace period expires

### Network & VPN Handling

**Default Policy:**

- VPNs and proxies are BLOCKED by default
- Exception: Cisco Secure Client is whitelisted by default (enterprise use)
- Users can request to whitelist other VPNs (requires warden approval after warden accepts)

**Detection Strategy:**

- iOS: Check for VPN status via `NEVPNManager`
- Windows: Detect TAP adapters, check routing table for VPN gateways

### Uninstall & Tamper Behavior

**App Uninstall:**

- Backend detects missing heartbeats from device
- After 30 minutes of silence: Send warden notification "Device X may be offline or app uninstalled"
- After 7 days of silence: Automatically cancel warden relationship
- Send final notification to warden: "CellBlock uninstalled from X's device. Your supervision has ended."

**iOS Uninstall:**

- Screen Time shields may persist even after app deletion (depends on iOS version)
- Shield removal requires going through iOS Settings → Screen Time

**Windows Uninstall:**

- Service uninstaller should attempt to notify server before removing
- If uninstaller is bypassed (force delete), backend will detect via missing heartbeats (see above)

### Historical Data & Reporting

**Data Retention:**

- Usage logs (heartbeat history) retained for 12 months
- After 12 months, data is automatically purged

**Warden Visibility:**

- Wardens can view last month + current month usage data
- Monthly notification sent to wardens: "Review [Inmate]'s usage this month" with link to dashboard
- Encourages warden-inmate discussion about usage patterns

**Dashboard Analytics:**

- Daily usage breakdown (time spent per day)
- Weekly totals and trends
- Parole grant history
- Whitelist change history

### Notifications & Communication

**Warden Notifications:**

- Cannot configure granularity (receive all notification types)
- Notification types:
  - Whitelist change requests (push + email)
  - Break glass events (push + email)
  - Device uninstall warnings (email after 30min, 7 days)
  - Monthly usage review reminder (email)
  - Warden relationship changes (email)

**Inmate Notifications:**

- Email notification when warden approves/denies requests
- Email notification when warden grants parole
- Email notification when warden triggers lockdown
- Time warnings (15min, 5min) via push notification + in-app banner

**Request Comments:**

- Inmates can add comment when requesting whitelist additions (e.g., "Need Zoom for work meetings")
- Wardens can add comment when denying requests (e.g., "This violates our agreement")
- Comments stored in database and visible in request history

### Account Management

**Inmate Account Deletion:**

- User can delete their account from settings
- Sends notification to ALL wardens: "[Inmate] has broken out of jail and deleted their account. Your supervision services are no longer required."
- All warden relationships terminated
- Data retained for 30 days (soft delete) then permanently purged

**Warden Account Deletion:**

- Warden can delete their account
- Sends email to ALL inmates they supervise: "[Warden] has deleted their account. You may optionally re-invite them when they return."
- Inmates prompted to promote backup warden to primary (if available)
- If inmate has no backup wardens, they enter "no warden" mode with email reminders

**Warden Resignation:**

- Warden can resign from supervising specific inmate
- Inmate immediately promoted backup warden to primary (if available)
- Both parties notified via email
- Inmate can re-invite resigned warden if desired

## Key Technical Requirements

### Time Budgeting System

- **Cross-Device Sync:** Clients send heartbeats every 30-60 seconds; server deducts time from daily allowance
- **Wall Clock Time:** If multiple devices are active simultaneously, only 1 minute is deducted per wall clock minute
- **Daily Limits:** Different time allowances per day of week (e.g., Mon: 60m, Sat: 240m)
- **Lockout:** When `time_remaining <= 0`, server sends `LOCK_CMD` and clients engage strict mode

### Whitelist Exceptions

- Usage of whitelisted apps/URLs does NOT count toward time budget
- When time budget hits 0, whitelisted items remain accessible
- Everything else is blocked

### Warden Authorization Flow

- Inmate (user) pairs with Warden (friend) via email invite
- Changing time budgets or whitelist requires Warden push notification approval
- Warden can remotely trigger "Lockdown" or "Grant Parole" (emergency time)

## Platform-Specific Implementation Notes

### iOS (`/ios`)

**Phase 1 APIs (Screen Time - No Entitlement Required):**

- `DeviceActivity` - Detect device usage
- `ManagedSettings` - Apply content shields
- Block "Social" category only (simpler than full whitelist)

**Phase 2 APIs (Full Enforcement - Requires Entitlement):**

- `FamilyControls` - Authorization (requires Apple Developer entitlement application)
- `DeviceActivityMonitorExtension` - Persist shields even if app is killed
- Block ALL apps/websites except whitelist

**Whitelist Implementation (Phase 2):**

- Select specific Bundle IDs from database (e.g., `com.google.Maps`)
- Block all other categories using `WebContent` and `Application` tokens

### Windows (`/windows`)

**Blocking Engine:**

- MVP: Modified hosts file approach
- Production: Windows Filtering Platform (WFP) driver to silently drop packets

**Whitelist Implementation:**

- User inputs domains (e.g., `github.com`)
- Client resolves IPs and allows traffic
- All other HTTP/HTTPS traffic blocked/redirected to local "Blocked" page

**Blocked Page (Local HTML):**

- Simple, clean design with CellBlock branding
- Shows: "This site is blocked by CellBlock"
- Displays remaining time: "You have X minutes remaining today"
- If locked: "Your screen time has expired for today"
- Button: "Open Dashboard" (links to web dashboard)
- No option to request whitelist from blocked page (must use dashboard)

**Anti-Tamper:**

- Service runs as `SYSTEM`
- Registry keys monitored for changes
- Background service persists even if UI is killed via Task Manager

**Limitation:** MVP operates at domain level only (cannot distinguish `youtube.com/watch?v=good` vs `youtube.com/watch?v=bad`)

### Backend API (`/srv-back`)

**WebSocket Events:**

- `heartbeat` (client->server) - Sends `{deviceId, isWhitelistedApp}`
- `time_update` (server->client) - Returns `{remainingSeconds, weeklyRemaining}`
- `lock_command` (server->client) - Triggers when `remainingSeconds <= 0`
- `unlock_command` (server->client) - Sent when Warden grants parole

**REST Endpoints:**

- `POST /config/whitelist` - Request whitelist change (requires Warden approval after warden accepts invite)
  - Body: `{item_name, ios_bundle_id?, windows_domain?, comment?}`
- `POST /warden/approve` - Warden approves pending request
  - Body: `{request_id, approved: boolean, comment?}`
- `POST /warden/lockdown` - Warden triggers lockdown
  - Body: `{inmate_id, grace_period_minutes?: number}`
  - If grace_period_minutes provided, send warning notification first
- `POST /warden/parole` - Warden grants emergency time
  - Body: `{inmate_id, type: "minutes" | "until", value: number | ISO8601_datetime}`
- `POST /warden/resign` - Warden resigns from supervising inmate
- `POST /inmate/remove-warden` - Inmate removes warden (requires backup warden)
- `POST /inmate/break-glass` - Inmate triggers break glass
  - Body: `{comment?: string}`
- `DELETE /account` - Delete user account (soft delete, 30-day retention)

**Time Handling:**

- All times stored and calculated in UTC/GMT
- Daily reset at midnight GMT
- Weekly budget tracking resets Sunday 00:00 GMT

**Auth:** JWT-based authentication

**API Versioning:**

- URL-based versioning: `/api/v1/...`
- Backward compatibility: Support previous version for 6 months after new version release
- Client version check: Server can return `force_update: true` if client is too old
- Minimum client version stored in server config

**Notification Strategy:**

- Push and email sent simultaneously for critical events (break glass, lockdown)
- Email as primary for non-time-sensitive events (monthly reports, warden invitations)
- Push notification failures: Retry 3 times, then fall back to email
- Email failures: Retry with exponential backoff, log for manual review

### Frontend Dashboard (`/srv-front`)

**UI/UX Requirements:**

- Light and dark mode support (system preference detection + manual toggle)
- Slick, modern, cool-looking color scheme (to be defined during design phase)
- Fully responsive (desktop, tablet, mobile)
- PWA capable

**Inmate Dashboard:**

- **Real-time countdown:** Remaining time updated every minute (live timer)
- Request whitelist additions with comment field
- View historic usage graphs (daily, weekly, monthly)
- Time budget configuration (per-day or weekday/weekend mode)
- Whitelist management (add/remove requests)
- Device management (view and remove devices)
- Warden management (invite, remove, promote backup)
- Break glass button (with confirmation and comment field)

**Warden Dashboard:**

- **Unified View:** All supervised inmates in one dashboard
- **Real-time Status:** Show current state of each inmate (active, locked, offline)
- **Notification Badges:** Pending request count badges
- **Quick Actions:** Approve/deny requests directly from dashboard (expandable detail view)
- **"Pending Requests" Inbox:** List of all pending whitelist/budget change requests
- **Emergency Controls:**
  - Grant Parole button (modal with "minutes" or "until datetime" options)
  - Lockdown button (modal with optional grace period)
- **Usage Reports:** View last month + current month data for each inmate
- **Communication:** Add comments when approving/denying requests

## Infrastructure & Deployment

### Hosting Strategy

**Initial MVP:**

- Single AWS EC2 instance hosting both backend and PostgreSQL
- Expected scale: Hundreds of users initially, up to ~10,000 users
- Vertical scaling as needed

**Future Scaling:**

- Migrate to AWS Aurora for database (read replicas, automatic failover)
- Consider containerization (Docker + ECS/EKS)
- CDN for frontend static assets

### Push Notifications & Email

**Push Notifications:**

- iOS: Apple Push Notification service (APNs) - requires Apple Developer account and certificates
- Windows: Windows Push Notification Service (WNS) - requires Microsoft Store registration
- Push notification library: Consider `node-pushnotifications` or platform-specific SDKs

**Email Service:**

- Use service with free tier supporting few thousand emails/month
- Options: SendGrid (100 emails/day free), AWS SES (62k emails/month free tier), Mailgun (5k emails/month free)
- Required emails: Verification, password reset, warden notifications, monthly reports

### Authentication & Security

**Authentication Methods:**

- Email + Password (with bcrypt hashing)
- Google OAuth 2.0
- Email verification required on signup (send verification link)
- Standard password reset flow via email token

**JWT Configuration:**

- Access tokens: Short-lived (15 minutes)
- Refresh tokens: Long-lived (7 days), stored in httpOnly cookies
- Token rotation on refresh

**Security Measures:**

- Rate limiting on auth endpoints (e.g., 5 login attempts per 15 minutes per IP)
- IP-based blocking for suspicious activity (configurable threshold)
- TLS/HTTPS only (no HTTP)
- Client certificate verification to prevent MITM attacks
- Passwords hashed with bcrypt (cost factor 12)

**Data Privacy:**

- End-to-end encryption for sensitive data in transit (TLS 1.3)
- Database encryption at rest for sensitive fields (passwords, tokens)
- No GDPR compliance required (not targeting EU initially)
- 30-day soft delete for account deletion (data recovery window)

**API Security:**

- No rate limiting on API endpoints initially (implement if abuse occurs)
- No storage limits per user

### Business Model

- **Current:** Open source and free for all users
- **Future:** Potential freemium model (TBD)
- No feature restrictions currently

## Platform-Specific Architecture Details

### Windows Client Architecture (`/windows`)

**Component Structure:**

- **UI Application** (WPF/WinUI):
  - System tray icon showing remaining time on hover
  - Settings panel for configuration
  - Status dashboard
  - Auto-start on Windows boot (registry entry: `HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run`)

- **Background Service** (Windows Service):
  - Runs as SYSTEM user
  - Manages network filtering (hosts file or WFP)
  - WebSocket connection to server
  - Sends heartbeats every 30-60 seconds
  - Applies blocking rules from server
  - Monitors for tamper attempts

**Communication:**

- Inter-process communication via Named Pipes or localhost HTTP API
- UI queries service for real-time status

**Installation:**

- MSI installer with admin privileges
- Registers Windows Service
- Creates firewall exceptions
- Adds registry keys for auto-start

**Security:**

- Service binary signed with code signing certificate (future)
- Service configuration stored in encrypted registry keys
- API tokens stored using Windows DPAPI

### iOS Client Architecture (`/ios`)

**Component Structure:**

- **Main App** (SwiftUI):
  - Dashboard showing remaining time
  - Settings and configuration
  - Whitelist management
  - WebSocket connection to server
  - Background refresh enabled (BGTaskScheduler)

- **DeviceActivity Monitor Extension** (Phase 2):
  - Persistent monitoring even when app is killed
  - Applies ManagedSettings shields
  - Cannot be disabled without device passcode

**Data Storage:**

- JWT tokens stored in iOS Keychain (secure enclave)
- Configuration cached locally (UserDefaults)
- Does NOT work offline (requires server connection for all operations)

**Permissions Required:**

- Screen Time API access (user authorization)
- Background refresh
- Push notifications
- Network access

**Background Operation:**

- Background refresh task runs every 15-30 minutes to sync with server
- WebSocket reconnects automatically on app foreground
- Push notifications wake app for critical updates

### Client Configuration Sync

**WebSocket Push:**

- Server pushes configuration changes immediately via WebSocket
- Clients apply changes in real-time
- Events: `config_update`, `whitelist_change`, `parole_granted`, `lockdown`

**No Offline Operation:**

- Clients require active server connection to function
- If offline for >30 minutes, warden receives notification
- No local caching of whitelist for offline use

## Development Workflow

### Multi-Agent Development Strategy

**Coordination Model:**
This project uses a **coordination agent** pattern with specialized sub-agents for each component.

**Agent Roles:**

1. **Coordination Agent** (Primary):
   - Reviews overall architecture and requirements
   - Coordinates work across components
   - Ensures API contracts are consistent
   - Reviews cross-component integration
   - Manages CLAUDE.md updates

2. **Backend Sub-Agent** (`/srv-back`):
   - Implements Node.js/TypeScript backend
   - Database schema design and migrations
   - WebSocket server logic
   - REST API endpoints
   - Authentication and authorization
   - Background jobs (email sending, data purging)

3. **Frontend Sub-Agent** (`/srv-front`):
   - Implements Next.js dashboard
   - Inmate and Warden UIs
   - API client integration
   - State management
   - Responsive design (light/dark mode)

4. **iOS Sub-Agent** (`/ios`):
   - Implements Swift iOS client
   - Screen Time API integration
   - WebSocket client
   - Local state management
   - Background refresh logic

5. **Windows Sub-Agent** (`/windows`):
   - Implements C# .NET 8 client
   - UI application and system service
   - Network filtering (hosts file → WFP)
   - WebSocket client
   - System tray integration

6. **Testing Sub-Agent** (`/tests`):
   - Writes automated tests for all components
   - Playwright for end-to-end testing
   - Unit tests for backend logic
   - Integration tests for API endpoints
   - Test data generation and seeding
   - Ensures Claude Code can run and verify tests

7. **Documentation Sub-Agent** (`/docs`):
   - Maintains mkdocs-material documentation
   - User documentation (primary focus) - hosted at dirkpetersen.github.io/cellblock
   - Developer documentation (contribution guides)
   - API documentation (OpenAPI/Swagger)
   - Architecture diagrams
   - Written alongside development (not after)

**Workflow:**

- Coordination agent delegates tasks to specialized sub-agents
- Sub-agents work independently within their component directories
- Coordination agent reviews integration points and API contracts
- Use conventional commits: `feat(ios): add shield logic`, `fix(backend): resolve race condition`

**Communication:**

- Shared contract: API endpoint definitions, WebSocket event schemas
- Coordination agent maintains `/docs/api/contracts.md` with TypeScript interfaces
- Sub-agents must adhere to contracts when implementing features

### Testing Strategy

**Automated Testing (Required for MVP):**

- **Unit Tests:** Backend business logic, utility functions
- **Integration Tests:** API endpoints, database operations, WebSocket events
- **End-to-End Tests:** Critical user flows using Playwright
  - User signup and email verification
  - Warden invitation and acceptance
  - Time budget countdown and lockdown
  - Whitelist request and approval flow
  - Break glass functionality
  - Parole grant flow

**Test Data:**

- Seed scripts for development database
- Mock warden and inmate accounts
- Pre-populated whitelist items
- Sample usage history data

**Test Execution:**

- All tests must be runnable by Claude Code
- Tests run in CI/CD pipeline (GitHub Actions)
- Coverage reports generated for backend (target: >80%)

**Testing Tools:**

- Backend: Jest or Vitest
- Frontend: React Testing Library + Playwright
- API Testing: Supertest
- E2E Testing: Playwright (cross-browser)

**Repository Structure:**

```
/tests
  /e2e          - Playwright end-to-end tests
  /integration  - API integration tests
  /unit         - Unit tests (mirror source structure)
  /fixtures     - Test data and fixtures
  /seeds        - Database seed scripts
```

### Logging & Error Handling

**Logging Strategy:**

- **Default Log Level:** Info
- **Log Levels Used:**
  - `error`: Critical failures (DB connection lost, auth failures)
  - `warn`: Recoverable issues (retry attempts, rate limit warnings)
  - `info`: Normal operations (user signup, warden actions, heartbeats summary)
  - `debug`: Detailed debugging (disabled in production)

**What to Log:**

- Authentication attempts (success and failures with IP)
- Warden actions (parole grants, lockdowns, approvals)
- Break glass events
- Device registration and uninstall detection
- Heartbeat failures and reconnection attempts
- Email sending (success/failure)
- Configuration changes

**Log Storage:**

- **Initial:** Local log files with rotation (daily rotation, 30-day retention)
- **Future:** Centralized logging service (CloudWatch, Papertrail, Datadog)
- **Backup:** Logs backed up to S3 or similar storage

**Log Format:**

- Structured JSON logs for easy parsing
- Include: timestamp, level, message, user_id, device_id, request_id (for tracing)

**Error Handling:**
**Backend:**

- User-friendly error messages sent to clients
- Technical details logged server-side only
- HTTP status codes: 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (server error)
- Validation errors include field-specific messages

**Client Error Handling:**

- **WebSocket Connection Failures:**
  - Retry with exponential backoff: 1s, 2s, 4s, 8s, 16s
  - Maximum 5 retry attempts
  - After 5 failures: Show error message with "Report Issue" button
  - Report URL: https://github.com/dirkpetersen/cellblock/issues/new
  - Pre-populate issue with error details, logs, device info

- **API Request Failures:**
  - Retry transient errors (5xx) up to 3 times
  - Show user-friendly error messages
  - Offer "Report Issue" for persistent failures

- **Graceful Degradation:**
  - If server unreachable, clients default to OPEN (fail-safe mode)
  - Show warning banner: "Server unreachable - blocking temporarily disabled"

### MVP Requirements (Phase 1)

**All features listed below are MUST-HAVES for MVP:**

1. **Core Time Tracking:**
   - Cross-device time budget synchronization
   - Heartbeat system with WebSocket
   - Daily and weekly budget limits
   - 15-minute and 5-minute warnings
   - Automatic lockdown when time expires

2. **Whitelist Management:**
   - Add/remove whitelist items (domains for Windows, bundle IDs for iOS)
   - Whitelist usage doesn't count toward budget
   - Request approval flow after warden accepts

3. **Warden System:**
   - Invitation and acceptance flow via email
   - Support for up to 4 wardens (1 primary + 3 backups)
   - Unified warden dashboard
   - Request approval/denial with comments

4. **Emergency Features:**
   - Break glass functionality (ends warden relationship)
   - Parole grants (time-based or duration-based)
   - Warden lockdown (immediate or with grace period)

5. **Device Management:**
   - Auto-registration on first heartbeat
   - Support up to 12 devices per user
   - Device removal from dashboard

6. **Historical Usage:**
   - Usage logs retained for 12 months
   - Daily, weekly, monthly graphs
   - Warden access to last month + current month

7. **Notifications:**
   - Email notifications (verification, password reset, warden actions, monthly reports)
   - Push notifications (time warnings, break glass, warden requests)
   - Notification badge counts in warden dashboard

8. **Authentication:**
   - Email + password signup with verification
   - Google OAuth integration
   - Password reset via email
   - JWT-based sessions

9. **Client Applications:**
   - iOS app with Screen Time API
   - Windows app with system service and tray icon
   - Both clients with WebSocket heartbeat

10. **Documentation:**
    - User documentation (primary) at dirkpetersen.github.io/cellblock
    - Developer/contributor documentation
    - API documentation (OpenAPI/Swagger)

### Phase 2: Enforcement Model (Post-MVP)

1. Implement full iOS Family Controls entitlement
2. iOS strict mode (block all except whitelist)
3. Windows upgrade to WFP for robust blocking
4. Enhanced tamper detection
5. Additional analytics and reporting features

### Database Schema

**See DBSCHEMA.md for detailed database schema including:**

- Table definitions
- Relationships and foreign keys
- Indexes for performance optimization
- Migration strategy

### Documentation Standards

- Use `mkdocs-material` in `/docs`
- Conventional Commits (e.g., `feat(ios): add shield logic`)
- Written alongside development (not after)
- User docs are primary focus, developer docs secondary

### Development Environment & Workflow

**Local Development:**

- Primary development on Ubuntu 24.04 (WSL2 on Windows 11 host)
- Backend and frontend run locally for testing before deployment
- Windows 11 host available for Windows client development and testing
- iOS client requires macOS (development machine or CI runner)

**Environment Configuration:**

- **dev:** Local development (localhost)
- **prod:** AWS EC2 instance
- No staging environment for MVP

**Secrets Management:**

- `.env` files for all secrets (not committed to git)
- `.env.example` templates committed for reference
- Google OAuth credentials stored in `.env`
- Separate `.env.dev` and `.env.prod` files

**Branch Strategy:**

- **main:** Production-ready code
- **dev:** Active development branch
- Feature branches off `dev`, merge back to `dev`
- `dev` merged to `main` when ready for production release

**Code Review Process:**

- Fully automated (Claude Code is the only developer)
- Automated checks via GitHub Actions:
  - Linting (ESLint, Prettier)
  - Type checking (TypeScript)
  - Unit and integration tests
  - Build verification
- No human code review required
- Merge to `main` only when all automated checks pass

### Technology Stack Decisions

**Backend Framework:**

- **NestJS** (Node.js/TypeScript)
  - Structured, opinionated framework
  - Built-in dependency injection
  - Easy integration with TypeORM/Prisma
  - WebSocket support via Socket.io adapter
  - Better for large-scale applications

**WebSocket Library:**

- **Socket.io**
  - Automatic reconnection
  - Room support for user-specific channels
  - Fallback to polling if WebSocket unavailable
  - Better DX than raw `ws`

**Frontend State Management:**

- **TanStack Query (React Query):** Server state management (API calls, caching, invalidation)
- **Zustand:** Client state management (UI state, user preferences)
- Lightweight, modern, and performant

**Database ORM & Migrations:**

- **Prisma**
  - Type-safe database access
  - Automatic TypeScript type generation from schema
  - Built-in migration system (`prisma migrate`)
  - Excellent developer experience
  - Works well with PostgreSQL

**Type Sharing:**

- **Monorepo structure** with shared packages
- Shared types package: `/packages/types` (TypeScript interfaces, DTOs)
- Backend and frontend import from shared package
- Ensures type consistency across stack

**Monorepo Structure:**

```
/cellblock
  /packages
    /types          - Shared TypeScript types, interfaces, DTOs
    /contracts      - API contracts (request/response schemas)
  /srv-back         - NestJS backend
  /srv-front        - Next.js frontend
  /ios              - Swift iOS client
  /windows          - C# Windows client
  /tests            - Automated tests (Playwright, Jest)
  /docs             - mkdocs-material documentation
```

**Package Management:**

- **pnpm workspaces** for monorepo management
  - Faster than npm, better disk space efficiency
  - Stricter dependency resolution (prevents phantom dependencies)
  - Built-in workspace support
- Shared dependencies hoisted to root
- Per-project dependencies in respective package.json files
- Use Turborepo for build caching and parallel task execution

### Development Order & Milestones

**Build Order (Sequential):**

1. **Database Schema & Backend API** (Foundation)
   - Set up Prisma schema from DBSCHEMA.md
   - Implement NestJS backend with all API endpoints
   - WebSocket server for heartbeats
   - Authentication (email/password + Google OAuth)
   - Background jobs (email sending, data cleanup)
   - Automated tests (unit + integration)

2. **Frontend Dashboard** (Backend Testing)
   - Next.js app with inmate and warden dashboards
   - TanStack Query for API integration
   - Light/dark mode support
   - Real-time WebSocket updates
   - All forms and UI flows
   - Playwright E2E tests

3. **Windows Client** (Simpler Platform)
   - C# .NET 8 application
   - System service + UI app
   - Hosts file blocking (MVP)
   - WebSocket heartbeat
   - System tray integration
   - Local testing on Windows 11 host

4. **iOS Client** (Requires Apple Setup)
   - Swift/SwiftUI application
   - Screen Time API integration
   - WebSocket heartbeat
   - Push notifications (APNs)
   - Requires Apple Developer account

5. **Testing & Documentation** (Throughout)
   - Testing agent writes tests alongside development
   - Documentation agent writes docs as features are built
   - Continuous testing and refinement

**No Incremental MVP Phases:**

- Build all MVP features together in each component
- Complete backend includes all features
- Complete frontend includes all features
- Testing happens continuously throughout development

**Database & API Contract Development:**

- Iterate both together (not one-then-the-other)
- Start with Prisma schema (translates DBSCHEMA.md to `schema.prisma`)
- Generate TypeScript types from Prisma
- Define API contracts in `/packages/contracts` using Zod schemas
- Backend implements contracts
- Frontend consumes contracts

### Branding & Design

**Logo Concept:**

- Primary icon: Stylized cell/prison bars forming a shield shape
- The bars subtly form a "CB" monogram
- Conveys: Protection, boundaries, structure
- Variations: Full color, monochrome, app icon (rounded square)
- File formats: SVG (scalable), PNG (various sizes), ICO (Windows)

**Color Scheme:**

- **Primary:** Deep Teal (#0D9488) - Trust, calm, digital wellness
- **Secondary:** Slate Gray (#475569) - Professional, neutral
- **Accent:** Amber (#F59E0B) - Warnings, attention
- **Success:** Emerald (#10B981) - Approvals, available time
- **Danger:** Rose (#F43F5E) - Lockdown, break glass, errors
- **Background Light:** Zinc 50 (#FAFAFA)
- **Background Dark:** Zinc 900 (#18181B)
- **Text Light:** Zinc 100 (#F4F4F5)
- **Text Dark:** Zinc 800 (#27272A)

**Typography:**

- Headings: Inter (clean, modern sans-serif)
- Body: Inter
- Monospace (code/times): JetBrains Mono

**Design Principles:**

- Clean, minimal interface
- Generous whitespace
- Clear visual hierarchy
- Accessible contrast ratios (WCAG AA)
- Consistent iconography (Lucide icons recommended)

### UI/UX Implementation Details

**Email Templates:**

- HTML format with responsive design (mobile-friendly)
- Include inline CSS for broad email client compatibility
- Templates: Welcome, Email Verification, Password Reset, Warden Invitation, Monthly Report, Break Glass Alert
- Use brand colors (teal primary, slate secondary)

**Time Budget Slider:**

- Two sliders: One for daily limit, one for weekly limit
- Daily slider: 0-300 minutes (0-5 hours)
  - 0-120 min (2hr): Green
  - 121-240 min (3-4hr): Yellow
  - 241-300 min (5hr): Red
- Weekly slider: 0-2100 minutes (0-35 hours, i.e., 7 days × 5 hours)
  - Color coding scales proportionally
- Both sliders required for account setup

**Windows System Tray:**

- Icon: CellBlock logo (simple lock icon)
- Tooltip on hover: "150 min left" (format: `{minutes} min left`)
- Click opens status window
- Right-click shows context menu:
  - "Open Dashboard" (launches browser to web dashboard)
  - "View Remaining Time"
  - "Settings"
  - "Exit" (disabled while locked)

**Push Notification Content:**

- **15-minute warning:** "⏰ 15 minutes remaining" / "You have 15 minutes of screen time left today."
- **5-minute warning:** "⏰ 5 minutes remaining" / "Your screen time will expire in 5 minutes."
- **Lockdown:** "🔒 Screen time expired" / "Your daily screen time has been used. Only whitelisted apps are available."
- **Parole granted:** "✅ Emergency time granted" / "[Warden] has granted you [X] minutes of additional time."
- **Warden request:** "📋 New request from [Inmate]" / "[Inmate] is requesting to add [App/Domain] to whitelist."
- **Break glass:** "🚨 Break glass activated" / "[Inmate] has activated break glass and is no longer under your supervision."
- All notifications are actionable (tap to open relevant screen in app/dashboard)

### CI/CD

- GitHub Actions for builds and tests
- Automated checks on all PRs to `dev` and `main`:
  - Linting and formatting
  - TypeScript compilation
  - Unit tests
  - Integration tests
  - E2E tests (Playwright)
  - Build verification
- iOS requires macOS runner
- Windows binary builds on push
- Frontend deployment to GitHub Pages (dirkpetersen.github.io/cellblock)

### Initial Repository Setup

**Repository Information:**

- GitHub: https://github.com/dirkpetersen/cellblock
- Repository already created
- Clone URL: `git@github.com:dirkpetersen/cellblock.git`

**Initial Setup Tasks:**

1. **Branch Setup:**
   - Create `dev` branch from `main`
   - Set `dev` as default branch for development
   - Document branch protection rules (require passing tests before merge to `main`)

2. **Monorepo Structure:**
   - Create directory structure for all workspaces
   - Set up `pnpm-workspace.yaml`
   - Create root `package.json` with workspace definitions
   - Add Turborepo configuration (`turbo.json`)

3. **Configuration Files:**
   - `.gitignore` (node_modules, .env, build artifacts, IDE files)
   - `.env.example` templates for all projects
   - `.prettierrc` and `.eslintrc` for code formatting
   - `tsconfig.json` base configuration (extended by projects)
   - `.github/workflows/` for CI/CD automation

4. **Package.json Files:**
   - Root package.json with workspace scripts
   - `/packages/types/package.json`
   - `/packages/contracts/package.json`
   - `/srv-back/package.json` (NestJS dependencies)
   - `/srv-front/package.json` (Next.js dependencies)
   - `/tests/package.json` (Playwright, Jest)

5. **Database Setup:**
   - Convert DBSCHEMA.md to Prisma schema (`/srv-back/prisma/schema.prisma`)
   - Create initial migration
   - Set up seed scripts in `/tests/seeds/`

6. **Test Infrastructure:**
   - Jest configuration (`jest.config.js`)
   - Playwright configuration (`playwright.config.ts`)
   - Test utilities and fixtures in `/tests/fixtures/`
   - Mock data generators

7. **Documentation Structure:**
   - `/docs/mkdocs.yml` configuration
   - `/docs/docs/index.md` (landing page)
   - `/docs/docs/user-guide/` (user documentation - primary focus)
   - `/docs/docs/developer-guide/` (contributor documentation)
   - `/docs/docs/api/` (API reference)
   - Set up GitHub Pages deployment workflow

8. **README Files:**
   - Root `/README.md` with project overview
   - `/srv-back/README.md` (backend setup instructions)
   - `/srv-front/README.md` (frontend setup instructions)
   - `/windows/README.md` (Windows client setup)
   - `/ios/README.md` (iOS client setup)
   - `/tests/README.md` (testing instructions)

### Initial Deployment Strategy

1. **Phase 1:** Local development and testing
   - Backend runs on localhost (Ubuntu WSL2): `http://localhost:3000`
   - Frontend runs on localhost (Ubuntu WSL2): `http://localhost:3001`
   - PostgreSQL runs locally (Docker recommended for easy setup)
   - Windows client tested on Windows 11 host machine
   - iOS client tested on simulator (if macOS available)

2. **Phase 2:** Production deployment
   - Provision AWS EC2 instance (Ubuntu 22.04 LTS recommended)
   - Install PostgreSQL on EC2
   - Deploy backend to EC2 (systemd service or Docker)
   - Deploy frontend to GitHub Pages (static export)
   - Configure DNS and SSL certificates (Let's Encrypt)
   - Set up email service (AWS SES or SendGrid)
   - Configure push notifications (APNs, WNS)

## Critical Technical Challenges

1. **WebSocket Reconnection:** Implement robust reconnection with exponential backoff; handle network transitions (WiFi<->Cellular)
2. **Simultaneous Device Race Conditions:** When multiple devices send heartbeats within 45s window, ensure only wall-clock time is deducted (prevent double-counting)
3. **Windows Tamper Detection:** While Safe Mode bypass is accepted, implement basic tamper detection for registry/hosts file modifications during normal operation
4. **iOS Background Persistence:** Ensure `DeviceActivity` monitors continue running even when app is backgrounded or killed
5. **Weekly Budget Edge Cases:** Handle week boundary correctly (Sun 23:59->00:00 GMT), ensure daily budgets don't exceed weekly maximum
6. **Warden Notification Delivery:** Ensure push notifications reach wardens reliably; implement fallback email notifications

## Implementation Considerations & Open Questions

The following items should be addressed during implementation. Document decisions in code comments and update this section.

### Onboarding & First-Run Experience

1. **Signup Flow Order:**
   - Recommended: Email/password → Email verification → Time budget setup → Whitelist category review (enable/disable healthy apps) → Optional warden invite
   - Consider skippable steps with "Set up later" option
   - Progressive disclosure: Don't overwhelm new users

2. **Tutorial/Walkthrough:**
   - Implement context-sensitive tooltips on first interaction with each feature
   - Optional video walkthrough or interactive guide
   - "Getting Started" documentation page with screenshots

3. **Default Time Budget:**
   - Daily: 2 hours (120 minutes)
   - Weekly: Calculate as daily × 7 = 14 hours (840 minutes) initially
   - User can adjust both independently during setup
   - Consider suggesting weekly = daily × 6 (allow one "off" day)

### Warden Experience

4. **Warden Onboarding:**
   - When warden accepts invite, show modal explaining their role and responsibilities
   - Highlight key actions: Approve/deny requests, grant parole, trigger lockdown
   - Link to detailed warden guide in documentation
   - Emphasize the trust relationship

5. **Warden Notifications Frequency:**
   - **Immediate:** Break glass, lockdown requests, device uninstall warnings
   - **Batched (daily digest):** Pending requests summary if not acted upon
   - **Weekly:** Monthly usage review reminder
   - **Never:** Routine heartbeats (too noisy)
   - Implement notification preferences (future: let wardens customize)

### Edge Cases & Behavior

6. **Device Switching Mid-Session:**
   - Seamless continuation: Server tracks total time across all devices
   - No overlap grace period needed (simultaneous use already handled)
   - Example: 30min on iPhone, switch to laptop, 30min remaining shown immediately

7. **Time Budget Exhausted Mid-Activity:**
   - **Immediate block:** Consistency is key for accountability
   - Show warning banner 5 seconds before lockdown
   - No exceptions for "finishing" content
   - Whitelisted content remains accessible

8. **Multiple Browser Tabs (Windows):**
   - Block individual tabs showing blocked domains
   - Replace blocked tab content with blocked page HTML
   - Other tabs (whitelisted) remain functional
   - Browser remains usable for whitelisted sites

9. **Daylight Saving Time:**
   - Use IANA timezone database (e.g., 'America/New_York')
   - Daily reset at midnight in user's timezone, regardless of DST shift
   - On "spring forward" (23-hour day): Budget still applies for full day
   - On "fall back" (25-hour day): Budget still applies for full day
   - Edge case: User could get extra hour on fall-back day if they stay up through 1-2am

### Analytics & Insights

10. **Usage Categories:**
    - **Track:** Time spent per day, device used, whitelisted vs non-whitelisted
    - **Do NOT track:** Specific URLs/apps visited (privacy-preserving)
    - **Exception:** Store app/domain only when added to whitelist (with user consent)
    - Warden sees: Total time used, compliance trends, NOT specific sites visited

11. **Trends & Streaks:**
    - Implement positive reinforcement (not gamification)
    - Show: "X days under budget this week"
    - Weekly summary email to inmate (optional, user can disable)
    - Avoid negative language ("failed," "broke streak")
    - Focus on progress and patterns

12. **Export Data:**
    - Implement basic CSV export of usage logs (date, device, time used, whitelisted flag)
    - Available in settings: "Download My Data"
    - Include: Time budgets, whitelist items, warden relationships, parole grants
    - Format: ZIP file with multiple CSVs
    - Generate on-demand (not pre-computed)

### Security & Abuse Prevention

13. **Session Hijacking Prevention:**
    - JWT access tokens bound to IP address (stored in session)
    - Detect IP changes: Require re-authentication if IP changes drastically (different country)
    - Device fingerprinting: Include device_fingerprint in JWT claims
    - Short-lived access tokens (15 min) with secure refresh flow

14. **Brute Force on Break Glass:**
    - Break glass is self-limiting (ends all warden relationships)
    - Log all break glass events with IP and timestamp
    - No cooldown needed (user loses all supervision)
    - Monitor for abuse patterns in logs

15. **API Abuse Prevention:**
    - Rate limiting per user: Max 10 whitelist requests per hour
    - Max 5 time budget change requests per hour
    - Cooldown: 1 minute between requests of same type
    - Exponential backoff on repeated rejections
    - Log suspicious patterns (e.g., 100 requests in 1 minute)
    - Consider temporary account suspension for extreme abuse (manual review)
