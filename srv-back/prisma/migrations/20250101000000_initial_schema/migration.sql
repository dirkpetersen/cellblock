-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "hashed_password" VARCHAR(255),
    "display_name" VARCHAR(100),
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'UTC',
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verification_token" VARCHAR(255),
    "password_reset_token" VARCHAR(255),
    "password_reset_expires" TIMESTAMP(3),
    "oauth_provider" VARCHAR(50),
    "oauth_provider_id" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "device_fingerprint" VARCHAR(255) NOT NULL,
    "platform" VARCHAR(20) NOT NULL,
    "device_name" VARCHAR(100),
    "os_version" VARCHAR(50),
    "app_version" VARCHAR(20),
    "first_seen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warden_relationships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inmate_id" UUID NOT NULL,
    "warden_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "invitation_token" VARCHAR(255),
    "invitation_sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warden_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_budgets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "day_of_week" INTEGER,
    "is_weekend" BOOLEAN,
    "minutes_allowed" INTEGER NOT NULL,
    "weekly_max_minutes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "time_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whitelist_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "ios_bundle_id" VARCHAR(255),
    "windows_domain" VARCHAR(255),
    "android_package_name" VARCHAR(255),
    "category" VARCHAR(20) NOT NULL DEFAULT 'custom',
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whitelist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "device_id" UUID NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "seconds_used" INTEGER NOT NULL,
    "was_whitelisted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parole_grants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inmate_id" UUID NOT NULL,
    "warden_id" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "minutes_granted" INTEGER,
    "valid_until" TIMESTAMP(3),
    "reason" TEXT,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parole_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "requester_id" UUID NOT NULL,
    "approver_id" UUID,
    "type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "request_data" JSONB NOT NULL,
    "requester_comment" TEXT,
    "approver_comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL DEFAULT NOW() + INTERVAL '3 days',

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "actor_id" UUID,
    "event_type" VARCHAR(50) NOT NULL,
    "event_data" JSONB,
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "device_id" UUID,
    "refresh_token" VARCHAR(255) NOT NULL,
    "websocket_connection_id" VARCHAR(255),
    "ip_address" INET,
    "user_agent" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "channel" VARCHAR(50) NOT NULL,
    "recipient" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(255),
    "body" TEXT NOT NULL,
    "data" JSONB,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "sent_at" TIMESTAMP(3),
    "failed_reason" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "device_id" UUID NOT NULL,
    "platform" VARCHAR(20) NOT NULL,
    "token" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "default_whitelist_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "ios_bundle_id" VARCHAR(255),
    "windows_domain" VARCHAR(255),
    "android_package_name" VARCHAR(255),
    "category" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "default_whitelist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_deleted_at" ON "users"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_users_oauth" ON "users"("oauth_provider", "oauth_provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "devices_device_fingerprint_key" ON "devices"("device_fingerprint");

-- CreateIndex
CREATE INDEX "idx_devices_user_id" ON "devices"("user_id");

-- CreateIndex
CREATE INDEX "idx_devices_fingerprint" ON "devices"("device_fingerprint");

-- CreateIndex
CREATE INDEX "idx_devices_last_seen" ON "devices"("last_seen");

-- CreateIndex
CREATE UNIQUE INDEX "warden_relationships_inmate_id_warden_id_key" ON "warden_relationships"("inmate_id", "warden_id");

-- CreateIndex
CREATE INDEX "idx_warden_rel_inmate" ON "warden_relationships"("inmate_id");

-- CreateIndex
CREATE INDEX "idx_warden_rel_warden" ON "warden_relationships"("warden_id");

-- CreateIndex
CREATE INDEX "idx_warden_rel_status" ON "warden_relationships"("status");

-- CreateIndex
CREATE UNIQUE INDEX "time_budgets_user_id_day_of_week_is_weekend_key" ON "time_budgets"("user_id", "day_of_week", "is_weekend");

-- CreateIndex
CREATE INDEX "idx_time_budgets_user_id" ON "time_budgets"("user_id");

-- CreateIndex
CREATE INDEX "idx_whitelist_user_id" ON "whitelist_items"("user_id");

-- CreateIndex
CREATE INDEX "idx_whitelist_ios" ON "whitelist_items"("ios_bundle_id");

-- CreateIndex
CREATE INDEX "idx_whitelist_windows" ON "whitelist_items"("windows_domain");

-- CreateIndex
CREATE INDEX "idx_whitelist_category" ON "whitelist_items"("category");

-- CreateIndex
CREATE INDEX "idx_usage_logs_user_id" ON "usage_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_usage_logs_device_id" ON "usage_logs"("device_id");

-- CreateIndex
CREATE INDEX "idx_usage_logs_start_time" ON "usage_logs"("start_time");

-- CreateIndex
CREATE INDEX "idx_usage_logs_created_at" ON "usage_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_parole_inmate_id" ON "parole_grants"("inmate_id");

-- CreateIndex
CREATE INDEX "idx_parole_warden_id" ON "parole_grants"("warden_id");

-- CreateIndex
CREATE INDEX "idx_parole_active" ON "parole_grants"("is_active");

-- CreateIndex
CREATE INDEX "idx_parole_expires" ON "parole_grants"("expires_at");

-- CreateIndex
CREATE INDEX "idx_requests_requester" ON "requests"("requester_id");

-- CreateIndex
CREATE INDEX "idx_requests_approver" ON "requests"("approver_id");

-- CreateIndex
CREATE INDEX "idx_requests_status" ON "requests"("status");

-- CreateIndex
CREATE INDEX "idx_requests_expires" ON "requests"("expires_at");

-- CreateIndex
CREATE INDEX "idx_events_user_id" ON "events"("user_id");

-- CreateIndex
CREATE INDEX "idx_events_actor_id" ON "events"("actor_id");

-- CreateIndex
CREATE INDEX "idx_events_type" ON "events"("event_type");

-- CreateIndex
CREATE INDEX "idx_events_created_at" ON "events"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_key" ON "sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "idx_sessions_user_id" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "idx_sessions_device_id" ON "sessions"("device_id");

-- CreateIndex
CREATE INDEX "idx_sessions_refresh_token" ON "sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "idx_sessions_expires" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "idx_notifications_user_id" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "idx_notifications_status" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "idx_notifications_created_at" ON "notifications"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "push_tokens_device_id_platform_key" ON "push_tokens"("device_id", "platform");

-- CreateIndex
CREATE INDEX "idx_push_tokens_user_id" ON "push_tokens"("user_id");

-- CreateIndex
CREATE INDEX "idx_push_tokens_device_id" ON "push_tokens"("device_id");

-- CreateIndex
CREATE INDEX "idx_push_tokens_platform" ON "push_tokens"("platform");

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warden_relationships" ADD CONSTRAINT "warden_relationships_inmate_id_fkey" FOREIGN KEY ("inmate_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warden_relationships" ADD CONSTRAINT "warden_relationships_warden_id_fkey" FOREIGN KEY ("warden_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_budgets" ADD CONSTRAINT "time_budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whitelist_items" ADD CONSTRAINT "whitelist_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parole_grants" ADD CONSTRAINT "parole_grants_inmate_id_fkey" FOREIGN KEY ("inmate_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parole_grants" ADD CONSTRAINT "parole_grants_warden_id_fkey" FOREIGN KEY ("warden_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
