# Database Schema

This document defines the PostgreSQL database schema for CellBlock.

## Overview

The database uses PostgreSQL with the following design principles:
- UUIDs for primary keys (better for distributed systems and security)
- Timestamps in UTC for all time-related fields
- Soft deletes where appropriate (30-day retention)
- Optimized indexes for frequent queries
- Foreign key constraints for referential integrity

## Tables

### users
Stores user accounts (both inmates and wardens).

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  hashed_password VARCHAR(255), -- NULL if OAuth-only user
  display_name VARCHAR(100),
  timezone VARCHAR(50) DEFAULT 'UTC', -- User's timezone for daily reset (e.g., 'America/New_York')
  is_email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  oauth_provider VARCHAR(50), -- 'google' or NULL
  oauth_provider_id VARCHAR(255), -- ID from OAuth provider
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP -- Soft delete (30-day retention)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_provider_id);
```

### devices
Stores registered devices for each user.

```sql
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_fingerprint VARCHAR(255) UNIQUE NOT NULL,
  platform VARCHAR(20) NOT NULL, -- 'ios', 'windows', 'android', 'macos'
  device_name VARCHAR(100), -- User-friendly name (e.g., "John's iPhone")
  os_version VARCHAR(50),
  app_version VARCHAR(20),
  first_seen TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_devices_user_id ON devices(user_id);
CREATE INDEX idx_devices_fingerprint ON devices(device_fingerprint);
CREATE INDEX idx_devices_last_seen ON devices(last_seen);

-- Enforce max 12 devices per user
CREATE OR REPLACE FUNCTION check_device_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM devices WHERE user_id = NEW.user_id AND is_active = true) >= 12 THEN
    RAISE EXCEPTION 'Maximum 12 devices per user exceeded';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_device_limit
BEFORE INSERT ON devices
FOR EACH ROW
EXECUTE FUNCTION check_device_limit();
```

### warden_relationships
Stores inmate-warden relationships.

```sql
CREATE TABLE warden_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inmate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  warden_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'cancelled', 'resigned'
  is_primary BOOLEAN DEFAULT false,
  invitation_token VARCHAR(255),
  invitation_sent_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(inmate_id, warden_id)
);

CREATE INDEX idx_warden_rel_inmate ON warden_relationships(inmate_id);
CREATE INDEX idx_warden_rel_warden ON warden_relationships(warden_id);
CREATE INDEX idx_warden_rel_status ON warden_relationships(status);

-- Enforce max 4 wardens per inmate
CREATE OR REPLACE FUNCTION check_warden_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM warden_relationships
      WHERE inmate_id = NEW.inmate_id
      AND status IN ('pending', 'active')) >= 4 THEN
    RAISE EXCEPTION 'Maximum 4 wardens per inmate exceeded';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_warden_limit
BEFORE INSERT ON warden_relationships
FOR EACH ROW
EXECUTE FUNCTION check_warden_limit();
```

### time_budgets
Stores daily time allowances per user (supports per-day and weekday/weekend modes).

```sql
CREATE TABLE time_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER, -- 0=Sunday, 1=Monday, ..., 6=Saturday; NULL for "all days"
  is_weekend BOOLEAN, -- NULL if using per-day mode, true/false for weekday/weekend mode
  minutes_allowed INTEGER NOT NULL CHECK (minutes_allowed >= 0 AND minutes_allowed <= 300), -- Max 5 hours
  weekly_max_minutes INTEGER, -- Weekly maximum constraint
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, day_of_week, is_weekend)
);

CREATE INDEX idx_time_budgets_user_id ON time_budgets(user_id);
```

### whitelist_items
Stores whitelisted apps/domains that don't count toward time budget.

```sql
CREATE TABLE whitelist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL, -- Display name (e.g., "Google Maps")
  ios_bundle_id VARCHAR(255), -- e.g., "com.google.Maps"
  windows_domain VARCHAR(255), -- e.g., "github.com"
  android_package_name VARCHAR(255), -- Future use
  category VARCHAR(20) NOT NULL DEFAULT 'custom', -- 'utility', 'healthy', 'custom'
  is_enabled BOOLEAN DEFAULT true, -- Can be disabled for 'healthy' category; 'utility' always true
  created_at TIMESTAMP DEFAULT NOW(),
  CHECK (ios_bundle_id IS NOT NULL OR windows_domain IS NOT NULL OR android_package_name IS NOT NULL),
  CHECK (category IN ('utility', 'healthy', 'custom'))
);

CREATE INDEX idx_whitelist_user_id ON whitelist_items(user_id);
CREATE INDEX idx_whitelist_ios ON whitelist_items(ios_bundle_id) WHERE ios_bundle_id IS NOT NULL;
CREATE INDEX idx_whitelist_windows ON whitelist_items(windows_domain) WHERE windows_domain IS NOT NULL;
CREATE INDEX idx_whitelist_category ON whitelist_items(category);
```

**Category Definitions:**
- `utility`: Essential apps (Maps, Calculator, Weather) - always enabled, cannot be disabled
- `healthy`: Less distracting entertainment (Spotify, Audible) - enabled by default, can be toggled
- `custom`: User-added items - requires warden approval after warden accepts

### usage_logs
Stores time usage history (12-month retention).

```sql
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  seconds_used INTEGER NOT NULL,
  was_whitelisted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_device_id ON usage_logs(device_id);
CREATE INDEX idx_usage_logs_start_time ON usage_logs(start_time);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at);

-- Auto-delete logs older than 12 months (run via cron job)
CREATE OR REPLACE FUNCTION delete_old_usage_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM usage_logs WHERE created_at < NOW() - INTERVAL '12 months';
END;
$$ LANGUAGE plpgsql;
```

### parole_grants
Stores emergency time grants from wardens.

```sql
CREATE TABLE parole_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inmate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  warden_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- 'minutes' or 'until'
  minutes_granted INTEGER, -- Used if type='minutes'
  valid_until TIMESTAMP, -- Used if type='until'
  reason TEXT, -- Optional comment from warden
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- NULL if type='until', calculated if type='minutes'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_parole_inmate_id ON parole_grants(inmate_id);
CREATE INDEX idx_parole_warden_id ON parole_grants(warden_id);
CREATE INDEX idx_parole_active ON parole_grants(is_active);
CREATE INDEX idx_parole_expires ON parole_grants(expires_at);
```

### requests
Stores whitelist change requests and time budget change requests.

```sql
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Inmate
  approver_id UUID REFERENCES users(id), -- Warden who approved/denied
  type VARCHAR(50) NOT NULL, -- 'whitelist_add', 'whitelist_remove', 'budget_change'
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'denied', 'expired'
  request_data JSONB NOT NULL, -- Flexible storage for request details
  requester_comment TEXT,
  approver_comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '3 days'
);

CREATE INDEX idx_requests_requester ON requests(requester_id);
CREATE INDEX idx_requests_approver ON requests(approver_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_expires ON requests(expires_at);

-- Auto-expire requests older than 3 days (run via cron job)
CREATE OR REPLACE FUNCTION expire_old_requests()
RETURNS void AS $$
BEGIN
  UPDATE requests
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

### events
Stores audit log of important events (break glass, lockdowns, etc.).

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL if user deleted
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Who performed the action
  event_type VARCHAR(50) NOT NULL, -- 'break_glass', 'lockdown', 'parole_granted', 'warden_invited', etc.
  event_data JSONB, -- Flexible storage for event details
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_actor_id ON events(actor_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_created_at ON events(created_at);
```

### sessions
Stores active WebSocket sessions and JWT refresh tokens.

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  refresh_token VARCHAR(255) UNIQUE NOT NULL,
  websocket_connection_id VARCHAR(255), -- For tracking active WS connections
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_activity TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_device_id ON sessions(device_id);
CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Auto-delete expired sessions (run via cron job)
CREATE OR REPLACE FUNCTION delete_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

### notifications
Stores notification queue for email and push notifications.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'email', 'push'
  channel VARCHAR(50) NOT NULL, -- 'email', 'apns', 'wns'
  recipient VARCHAR(255) NOT NULL, -- Email address or device token
  subject VARCHAR(255),
  body TEXT NOT NULL,
  data JSONB, -- Additional data for push notifications
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  sent_at TIMESTAMP,
  failed_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

### push_tokens
Stores push notification device tokens for APNs (iOS) and WNS (Windows).

```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  platform VARCHAR(20) NOT NULL, -- 'apns', 'wns'
  token TEXT NOT NULL, -- APNs device token or WNS channel URI
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(device_id, platform)
);

CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_device_id ON push_tokens(device_id);
CREATE INDEX idx_push_tokens_platform ON push_tokens(platform);
```

### default_whitelist_items
Stores the master list of default whitelist items (utility and healthy apps) that get copied to new users.

```sql
CREATE TABLE default_whitelist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  ios_bundle_id VARCHAR(255),
  windows_domain VARCHAR(255),
  android_package_name VARCHAR(255),
  category VARCHAR(20) NOT NULL, -- 'utility' or 'healthy'
  created_at TIMESTAMP DEFAULT NOW(),
  CHECK (ios_bundle_id IS NOT NULL OR windows_domain IS NOT NULL OR android_package_name IS NOT NULL),
  CHECK (category IN ('utility', 'healthy'))
);

-- Seed with default utility apps (iOS)
INSERT INTO default_whitelist_items (name, ios_bundle_id, category) VALUES
  ('Phone', 'com.apple.mobilephone', 'utility'),
  ('Messages', 'com.apple.MobileSMS', 'utility'),
  ('FaceTime', 'com.apple.facetime', 'utility'),
  ('Maps', 'com.apple.Maps', 'utility'),
  ('Calendar', 'com.apple.mobilecal', 'utility'),
  ('Clock', 'com.apple.mobiletimer', 'utility'),
  ('Calculator', 'com.apple.calculator', 'utility'),
  ('Google Maps', 'com.google.Maps', 'utility'),
  ('Waze', 'com.waze.iphone', 'utility'),
  ('Cisco Secure Client', 'com.cisco.secureclient', 'utility'),
  -- Banking apps (iOS)
  ('Chase', 'com.chase.sig.android', 'utility'),
  ('Bank of America', 'com.bankofamerica.mobileapps.iphone', 'utility'),
  ('Wells Fargo', 'com.wf.wellsfargomobile', 'utility'),
  ('Citi Mobile', 'com.citi.citimobile', 'utility'),
  ('Capital One', 'com.capitalone.enterprisemobilebanking', 'utility'),
  ('US Bank', 'com.usbank.mobilebanking', 'utility'),
  ('PNC Mobile', 'com.pnc.ecommerce.mobile', 'utility'),
  ('TD Bank', 'com.tdbank.myspend', 'utility'),
  ('Schwab Mobile', 'com.schwab.mobile', 'utility'),
  ('Fidelity', 'com.fidelity.fidelity', 'utility'),
  ('Venmo', 'com.venmo.Venmo', 'utility'),
  ('PayPal', 'com.paypal.android.p2pmobile', 'utility'),
  ('Zelle', 'com.zellepay.zelle', 'utility');

-- Seed with default healthy apps (iOS)
INSERT INTO default_whitelist_items (name, ios_bundle_id, category) VALUES
  ('Spotify', 'com.spotify.client', 'healthy'),
  ('Audible', 'com.audible.iphone', 'healthy'),
  ('Apple Music', 'com.apple.Music', 'healthy'),
  ('Podcasts', 'com.apple.podcasts', 'healthy'),
  ('Kindle', 'com.amazon.Kindle', 'healthy'),
  ('Apple Books', 'com.apple.iBooks', 'healthy'),
  ('Libby', 'com.overdrive.libby', 'healthy');

-- Seed Windows domains (utility)
INSERT INTO default_whitelist_items (name, windows_domain, category) VALUES
  ('Google Maps', 'maps.google.com', 'utility'),
  ('Google Maps', 'www.google.com/maps', 'utility'),
  ('Weather', 'weather.com', 'utility'),
  ('Cisco Secure Client', '*.webex.com', 'utility'),
  -- Banking domains (Windows)
  ('Chase', 'chase.com', 'utility'),
  ('Chase', 'secure.chase.com', 'utility'),
  ('Bank of America', 'bankofamerica.com', 'utility'),
  ('Wells Fargo', 'wellsfargo.com', 'utility'),
  ('Citi', 'citi.com', 'utility'),
  ('Capital One', 'capitalone.com', 'utility'),
  ('US Bank', 'usbank.com', 'utility'),
  ('PNC', 'pnc.com', 'utility'),
  ('TD Bank', 'td.com', 'utility'),
  ('Schwab', 'schwab.com', 'utility'),
  ('Fidelity', 'fidelity.com', 'utility'),
  ('Vanguard', 'vanguard.com', 'utility'),
  ('PayPal', 'paypal.com', 'utility'),
  ('Venmo', 'venmo.com', 'utility');

-- Seed Windows domains (healthy)
INSERT INTO default_whitelist_items (name, windows_domain, category) VALUES
  ('Spotify', 'open.spotify.com', 'healthy'),
  ('Audible', 'audible.com', 'healthy'),
  ('Kindle', 'read.amazon.com', 'healthy');
```

## Relationships Diagram

```
users (1) <----> (N) devices
users (1) <----> (N) time_budgets
users (1) <----> (N) whitelist_items
users (1) <----> (N) usage_logs
users (1) <----> (N) parole_grants (as inmate)
users (1) <----> (N) parole_grants (as warden)
users (1) <----> (N) warden_relationships (as inmate)
users (1) <----> (N) warden_relationships (as warden)
users (1) <----> (N) requests (as requester)
users (1) <----> (N) requests (as approver)
users (1) <----> (N) events
users (1) <----> (N) sessions
users (1) <----> (N) notifications
users (1) <----> (N) push_tokens

devices (1) <----> (N) usage_logs
devices (1) <----> (N) sessions
devices (1) <----> (N) push_tokens

default_whitelist_items - standalone reference table (no FK relationships)
```

## Migration Strategy

1. **Initial Schema Creation:**
   - Use migration tool like `node-pg-migrate` or `knex.js` migrations
   - Version: `001_initial_schema.sql`

2. **Future Migrations:**
   - Create incremental migration files
   - Never modify existing migrations
   - Always add `up` and `down` functions for rollback

3. **Seeding:**
   - Development seed data in `/tests/seeds/`
   - Create default system whitelist items (Cisco Secure Client)
   - Mock users for testing

## Performance Optimization

1. **Indexes:** All foreign keys have indexes for join performance
2. **Partitioning (Future):** Consider partitioning `usage_logs` by month for better query performance
3. **Materialized Views (Future):** For usage statistics and reporting
4. **Connection Pooling:** Use `pg-pool` with 10-20 connections for production

## Data Retention & Cleanup

**Automated Cleanup Jobs (Run Daily via Cron):**
1. Delete `usage_logs` older than 12 months
2. Expire `requests` older than 3 days (status=pending)
3. Delete expired `sessions`
4. Purge soft-deleted `users` after 30 days
5. Delete sent `notifications` older than 30 days

**Implementation:**
```sql
-- Run this via cron or background job scheduler
SELECT delete_old_usage_logs();
SELECT expire_old_requests();
SELECT delete_expired_sessions();
DELETE FROM users WHERE deleted_at < NOW() - INTERVAL '30 days';
DELETE FROM notifications WHERE status = 'sent' AND sent_at < NOW() - INTERVAL '30 days';
```

## Backup Strategy

1. **Automated Daily Backups:**
   - Full PostgreSQL dump to S3 or similar
   - Retain 30 days of daily backups
   - Test restore procedure monthly

2. **Point-in-Time Recovery:**
   - Enable WAL archiving for production
   - Allows restoration to any point within last 7 days
