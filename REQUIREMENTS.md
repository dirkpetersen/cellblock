
This is a comprehensive requirements specification for **CellBlock**. It is structured to fit directly into your `docs/` folder structure (e.g., `docs/requirements.md`) and aligns with the technology stack and repository structure you provided.

---

# CellBlock: System Requirements Specification (SRS)

**Version:** 1.0.0
**Status:** Draft
**Repo:** `~/gh/cellblock`

## 1. Project Overview
**CellBlock** is a cross-platform digital wellbeing ecosystem designed for high-accountability usage. Unlike standard blockers, CellBlock enforces a "Default Deny" policy where the internet is blocked by default, allowing only specific exceptions. It features a flexible time budget that synchronizes across devices and requires a secondary user ("Warden") to authorize changes or unlock the device after time expires.

### 1.1 Core Philosophy
*   **Whitelist-First:** Block everything; allow only essentials (e.g., Maps, Work Tools).
*   **Shared Budget:** 60 minutes of usage on iOS reduces the remaining time on Windows.
*   **Friend Enforcement:** A "Warden" holds the keys to settings changes and emergency unlocks.

---

## 2. System Architecture

The system follows a **Hub-and-Spoke** model where the Backend acts as the source of truth for the Time Budget.

### 2.1 Tech Stack
*   **iOS Client:** Swift (SwiftUI + Screen Time API).
*   **Windows Client:** C# .NET 8 (WPF/WinUI + Packet Filtering).
*   **Backend:** Node.js (Express or NestJS) *OR* FastAPI (Python). *Recommendation: Node.js/TypeScript for type-sharing with Frontend.*
*   **Frontend:** Next.js (React).
*   **Database:** PostgreSQL (Relational data + Time logs).
*   **Communication:** REST API (Config) + WebSockets (Real-time Budget Sync).

### 2.2 Data Flow
1.  **Heartbeat:** Clients send a "heartbeat" to the server every 30-60 seconds when the device is unlocked and internet is active.
2.  **Server Calculation:** Server deducts time from the daily allowance.
3.  **Sync:** Server responds with `time_remaining`.
4.  **Lockout:** If `time_remaining <= 0`, Server sends `LOCK_CMD`. Clients engage "Strict Mode."

---

## 3. Functional Requirements

### 3.1 Time Budgeting
*   **REQ-TB-01:** Users must be able to set a specific time limit (in minutes) for each day of the week (e.g., Mon: 60m, Sat: 240m).
*   **REQ-TB-02:** Time usage must be synchronized. 30 minutes used on Windows = 30 minutes deducted from the global daily budget.
*   **REQ-TB-03:** If a user is active on multiple devices simultaneously, time is deducted based on "Wall Clock" time (1 minute passes = 1 minute deducted, regardless of device count).

### 3.2 The Whitelist (Exceptions)
*   **REQ-WL-01:** Users can define a list of "Always Allowed" exceptions.
*   **REQ-WL-02:** Usage of Whitelisted apps/URLs does **not** count toward the Time Budget deduction.
*   **REQ-WL-03:** When the Time Budget hits 0, Whitelisted items remain accessible; everything else is blocked.

### 3.3 Friend Enforcement (The Warden)
*   **REQ-FE-01:** A User (Inmate) must pair with a Friend (Warden) via email invite.
*   **REQ-FE-02:** Changing the Time Budget or adding items to the Whitelist requires Warden approval (Push Notification or Dashboard click).
*   **REQ-FE-03:** The Warden can remotely trigger a "Lockdown" (Block all immediately) or "Grant Parole" (Add emergency time).

---

## 4. Client Specifications

### 4.1 iOS Client (`/ios`)
**Language:** Swift 5+
**Target:** iOS 16.0+

*   **REQ-IOS-01 (API):** Must utilize `FamilyControls` for authorization.
*   **REQ-IOS-02 (Blocking):** Must utilize `ManagedSettings` to apply shields.
*   **REQ-IOS-03 (Activity):** Must utilize `DeviceActivity` to detect when the phone is being used.
*   **REQ-IOS-04 (Whitelist):**
    *   Allow selection of specific Bundle IDs (e.g., `com.google.Maps`).
    *   Block all other categories using `WebContent` and `Application` tokens.
*   **REQ-IOS-05 (Resilience):** Must implement "On Demand" checking. If the app is killed, the `DeviceActivityMonitorExtension` must persist the shield.

### 4.2 Windows Client (`/windows`)
**Language:** C# (.NET 8)
**Target:** Windows 10/11

*   **REQ-WIN-01 (Blocking Engine):** Must use **Windows Filtering Platform (WFP)** or a Modified Hosts file approach (MVP level) to intercept DNS requests.
    *   *Preferred:* WFP driver integration to silently drop packets for non-whitelisted domains.
*   **REQ-WIN-02 (Whitelist):**
    *   User inputs domains (e.g., `github.com`).
    *   Client resolves associated IPs and allows traffic.
    *   All other HTTP/HTTPS traffic is blocked/redirected to a local "Blocked" page.
*   **REQ-WIN-03 (Anti-Tamper):**
    *   Service runs as `SYSTEM`.
    *   Registry keys for the app config are monitored for changes.
    *   Task Manager killing of the UI does not stop the background Service.

---

## 5. Server & API Specifications

### 5.1 Backend (`/srv-back`)
**Stack:** Node.js (TypeScript) or FastAPI

*   **REQ-API-01 (Auth):** JWT-based authentication.
*   **REQ-API-02 (Endpoints):**
    *   `POST /sync/heartbeat`: Receives `{deviceId, timestamp, isWhitelistedApp}`. Returns `{remainingSeconds}`.
    *   `POST /config/whitelist`: Request change to whitelist.
    *   `POST /warden/approve`: Warden approves a pending request.
*   **REQ-API-03 (Logic):** Server must handle timezone differences for "Start of Day" resets.

### 5.2 Frontend (`/srv-front`)
**Stack:** Next.js (App Router), TailwindCSS

*   **REQ-WEB-01 (Inmate Dashboard):** View remaining time, request whitelist additions, view historic usage graphs.
*   **REQ-WEB-02 (Warden Dashboard):** "Pending Requests" inbox. "Emergency Unlock" button.
*   **REQ-WEB-03 (Responsive):** Must act as the primary configuration tool for mobile users (PWA).

---

## 6. Implementation Roadmap

### Phase 1: MVP (The "Trust" Model)
1.  **Backend:** Setup Users, rudimentary budget counting.
2.  **Windows:** C# app that modifies `hosts` file (Easier than WFP).
3.  **iOS:** Basic Screen Time implementation blocking "Social" category only.
4.  **No Warden:** User can change their own settings (Honor system).

### Phase 2: The "Enforcement" Model
1.  **Warden:** Implement the Warden permission flow in DB and Frontend.
2.  **iOS:** Full strict mode (Block All except Whitelist).
3.  **Windows:** Upgrade to WFP or Packet Filter for robust blocking.

---

## 7. Repository Structure & Documentation

The documentation in `docs/` should use `mkdocs-material` and follow this layout:

```text
docs/
├── index.md             # Project intro and installation
├── architecture.md      # Diagrams of sync logic
├── api/
│   ├── rest-spec.md     # OpenAPI/Swagger definitions
│   └── socket-events.md # WebSocket event definitions
├── clients/
│   ├── ios-guide.md     # How to compile/sign the Swift app
│   └── windows-guide.md # .NET build instructions
└── contribution.md      # Coding standards
```

### 7.1 Development Standards
*   **Commits:** Use Conventional Commits (e.g., `feat(ios): add shield logic`).
*   **CI/CD:** GitHub Actions to build the iOS app (requires macOS runner) and Windows binary on push.

## 8. Specific Technical Challenges to Address
1.  **iOS Entitlements:** You must apply for the *Family Controls* or *digital wellbeing* entitlement via Apple Developer portal immediately. The app cannot run on real devices without it.
2.  **Windows HTTPS:** Blocking domains is easy. Blocking specific URLs (e.g., `youtube.com/watch?v=good` vs `youtube.com`) is hard without a browser extension.youtube.com`) is hard without a browser extension.
    *   *Decision:* The Windows client will operate on a **Domain Level Only** for the MVP (Allow `google.com`, Block `facebook.com`).
    
