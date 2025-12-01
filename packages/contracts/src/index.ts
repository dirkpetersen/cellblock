/**
 * API Contracts and Zod Schemas for CellBlock
 * @packageDocumentation
 */

import { z } from 'zod';

// ============================================================================
// Authentication Schemas
// ============================================================================

export const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const PasswordResetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const PasswordResetSchema = z.object({
  token: z.string(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const EmailVerificationSchema = z.object({
  token: z.string(),
});

// ============================================================================
// User Schemas
// ============================================================================

export const UpdateUserSchema = z.object({
  displayName: z.string().min(2).optional(),
  timezone: z.string().optional(),
});

export const DeleteAccountSchema = z.object({
  password: z.string(),
  confirmation: z.literal('DELETE'),
});

// ============================================================================
// Time Budget Schemas
// ============================================================================

export const TimeBudgetConfigSchema = z.object({
  mode: z.enum(['per_day', 'weekday_weekend']),
  perDayLimits: z
    .array(
      z.object({
        dayOfWeek: z.number().min(0).max(6), // 0=Sunday, 6=Saturday
        minutesAllowed: z.number().min(0).max(300), // Max 5 hours
      })
    )
    .optional(),
  weekdayMinutes: z.number().min(0).max(300).optional(),
  weekendMinutes: z.number().min(0).max(300).optional(),
  weeklyMaxMinutes: z.number().min(0).max(2100), // Max 35 hours
});

export const UpdateTimeBudgetSchema = TimeBudgetConfigSchema.extend({
  comment: z.string().max(500).optional(),
});

// ============================================================================
// Whitelist Schemas
// ============================================================================

export const AddWhitelistItemSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255),
    iosBundleId: z.string().max(255).optional(),
    windowsDomain: z.string().max(255).optional(),
    androidPackageName: z.string().max(255).optional(),
    comment: z.string().max(500).optional(),
  })
  .refine((data) => data.iosBundleId || data.windowsDomain || data.androidPackageName, {
    message: 'At least one platform identifier is required',
  });

export const RemoveWhitelistItemSchema = z.object({
  itemId: z.string().uuid(),
  comment: z.string().max(500).optional(),
});

export const ToggleHealthyAppSchema = z.object({
  itemId: z.string().uuid(),
  enabled: z.boolean(),
  comment: z.string().max(500).optional(),
});

// ============================================================================
// Warden Schemas
// ============================================================================

export const InviteWardenSchema = z.object({
  email: z.string().email('Invalid email address'),
  isPrimary: z.boolean().default(true),
});

export const AcceptWardenInviteSchema = z.object({
  token: z.string(),
});

export const ResignWardenSchema = z.object({
  inmateId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export const RemoveWardenSchema = z.object({
  wardenId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export const ApproveRequestSchema = z.object({
  requestId: z.string().uuid(),
  approved: z.boolean(),
  comment: z.string().max(500).optional(),
});

export const GrantParoleSchema = z.object({
  inmateId: z.string().uuid(),
  type: z.enum(['minutes', 'until']),
  value: z.union([
    z.number().min(1).max(10000), // Minutes (max ~7 days)
    z.string().datetime(), // ISO8601 datetime
  ]),
  reason: z.string().max(500).optional(),
});

export const TriggerLockdownSchema = z.object({
  inmateId: z.string().uuid(),
  gracePeriodMinutes: z.number().min(0).max(120).optional(), // Max 2 hour grace
  reason: z.string().max(500).optional(),
});

// ============================================================================
// Device Schemas
// ============================================================================

export const RegisterDeviceSchema = z.object({
  deviceFingerprint: z.string(),
  platform: z.enum(['ios', 'windows', 'android', 'macos']),
  deviceName: z.string().max(100).optional(),
  osVersion: z.string().max(50).optional(),
  appVersion: z.string().max(20).optional(),
});

export const RemoveDeviceSchema = z.object({
  deviceId: z.string().uuid(),
});

export const UpdateDeviceSchema = z.object({
  deviceId: z.string().uuid(),
  deviceName: z.string().max(100).optional(),
});

// ============================================================================
// Emergency Schemas
// ============================================================================

export const BreakGlassSchema = z.object({
  comment: z.string().max(1000).optional(),
  confirmation: z.literal('BREAK_GLASS'),
});

// ============================================================================
// WebSocket Schemas
// ============================================================================

export const HeartbeatSchema = z.object({
  deviceId: z.string().uuid(),
  isWhitelistedApp: z.boolean(),
  timestamp: z.number(), // Unix timestamp (client time for reference only)
});

// ============================================================================
// Query Schemas
// ============================================================================

export const GetUsageLogsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  deviceId: z.string().uuid().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export const GetRequestsSchema = z.object({
  status: z.enum(['pending', 'approved', 'denied', 'expired']).optional(),
  type: z.enum(['whitelist_add', 'whitelist_remove', 'budget_change']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// ============================================================================
// Response Schemas
// ============================================================================

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

export const TimeStatusSchema = z.object({
  remainingSeconds: z.number(),
  weeklyRemaining: z.number(),
  dailyLimit: z.number(),
  weeklyLimit: z.number(),
  lastHeartbeat: z.string().datetime(),
  isLocked: z.boolean(),
  activeParole: z
    .object({
      type: z.enum(['minutes', 'until']),
      expiresAt: z.string().datetime().optional(),
    })
    .optional(),
});

// ============================================================================
// Export Types
// ============================================================================

export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type PasswordResetRequestInput = z.infer<typeof PasswordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof PasswordResetSchema>;
export type EmailVerificationInput = z.infer<typeof EmailVerificationSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type DeleteAccountInput = z.infer<typeof DeleteAccountSchema>;
export type TimeBudgetConfigInput = z.infer<typeof TimeBudgetConfigSchema>;
export type UpdateTimeBudgetInput = z.infer<typeof UpdateTimeBudgetSchema>;
export type AddWhitelistItemInput = z.infer<typeof AddWhitelistItemSchema>;
export type RemoveWhitelistItemInput = z.infer<typeof RemoveWhitelistItemSchema>;
export type ToggleHealthyAppInput = z.infer<typeof ToggleHealthyAppSchema>;
export type InviteWardenInput = z.infer<typeof InviteWardenSchema>;
export type AcceptWardenInviteInput = z.infer<typeof AcceptWardenInviteSchema>;
export type ResignWardenInput = z.infer<typeof ResignWardenSchema>;
export type RemoveWardenInput = z.infer<typeof RemoveWardenSchema>;
export type ApproveRequestInput = z.infer<typeof ApproveRequestSchema>;
export type GrantParoleInput = z.infer<typeof GrantParoleSchema>;
export type TriggerLockdownInput = z.infer<typeof TriggerLockdownSchema>;
export type RegisterDeviceInput = z.infer<typeof RegisterDeviceSchema>;
export type RemoveDeviceInput = z.infer<typeof RemoveDeviceSchema>;
export type UpdateDeviceInput = z.infer<typeof UpdateDeviceSchema>;
export type BreakGlassInput = z.infer<typeof BreakGlassSchema>;
export type HeartbeatInput = z.infer<typeof HeartbeatSchema>;
export type GetUsageLogsInput = z.infer<typeof GetUsageLogsSchema>;
export type GetRequestsInput = z.infer<typeof GetRequestsSchema>;
export type TimeStatusResponse = z.infer<typeof TimeStatusSchema>;
