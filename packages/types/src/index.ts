/**
 * Shared TypeScript types and interfaces for CellBlock
 * @packageDocumentation
 */

// User roles and states
export type UserRole = 'inmate' | 'warden';
export type WardenRelationshipStatus = 'pending' | 'active' | 'cancelled' | 'resigned';

// Device platforms
export type DevicePlatform = 'ios' | 'windows' | 'android' | 'macos';

// Whitelist categories
export type WhitelistCategory = 'utility' | 'healthy' | 'custom';

// Request types
export type RequestType = 'whitelist_add' | 'whitelist_remove' | 'budget_change';
export type RequestStatus = 'pending' | 'approved' | 'denied' | 'expired';

// Parole grant types
export type ParoleGrantType = 'minutes' | 'until';

// Event types for audit log
export type EventType =
  | 'break_glass'
  | 'lockdown'
  | 'parole_granted'
  | 'warden_invited'
  | 'warden_accepted'
  | 'warden_resigned'
  | 'device_registered'
  | 'whitelist_added'
  | 'whitelist_removed'
  | 'budget_changed';

// Notification types
export type NotificationType = 'email' | 'push';
export type NotificationChannel = 'email' | 'apns' | 'wns';
export type NotificationStatus = 'pending' | 'sent' | 'failed';

// WebSocket event types
export type WebSocketEvent =
  | 'heartbeat'
  | 'time_update'
  | 'lock_command'
  | 'unlock_command'
  | 'config_update'
  | 'whitelist_change'
  | 'parole_granted'
  | 'lockdown';

// User interface
export interface User {
  id: string;
  email: string;
  displayName?: string;
  timezone: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Device interface
export interface Device {
  id: string;
  userId: string;
  deviceFingerprint: string;
  platform: DevicePlatform;
  deviceName?: string;
  osVersion?: string;
  appVersion?: string;
  firstSeen: Date;
  lastSeen: Date;
  isActive: boolean;
}

// Time budget interface
export interface TimeBudget {
  id: string;
  userId: string;
  dayOfWeek?: number; // 0-6 (Sunday-Saturday)
  isWeekend?: boolean;
  minutesAllowed: number;
  weeklyMaxMinutes?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Whitelist item interface
export interface WhitelistItem {
  id: string;
  userId: string;
  name: string;
  iosBundleId?: string;
  windowsDomain?: string;
  androidPackageName?: string;
  category: WhitelistCategory;
  isEnabled: boolean;
  createdAt: Date;
}

// Warden relationship interface
export interface WardenRelationship {
  id: string;
  inmateId: string;
  wardenId: string;
  status: WardenRelationshipStatus;
  isPrimary: boolean;
  invitationToken?: string;
  invitationSentAt: Date;
  acceptedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Request interface
export interface Request {
  id: string;
  requesterId: string;
  approverId?: string;
  type: RequestType;
  status: RequestStatus;
  requestData: Record<string, any>;
  requesterComment?: string;
  approverComment?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

// Parole grant interface
export interface ParoleGrant {
  id: string;
  inmateId: string;
  wardenId: string;
  type: ParoleGrantType;
  minutesGranted?: number;
  validUntil?: Date;
  reason?: string;
  grantedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

// Usage log interface
export interface UsageLog {
  id: string;
  userId: string;
  deviceId: string;
  startTime: Date;
  endTime: Date;
  secondsUsed: number;
  wasWhitelisted: boolean;
  createdAt: Date;
}

// Event log interface
export interface Event {
  id: string;
  userId?: string;
  actorId?: string;
  eventType: EventType;
  eventData?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// Session interface
export interface Session {
  id: string;
  userId: string;
  deviceId?: string;
  refreshToken: string;
  websocketConnectionId?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  createdAt: Date;
  lastActivity: Date;
}

// Notification interface
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  body: string;
  data?: Record<string, any>;
  status: NotificationStatus;
  sentAt?: Date;
  failedReason?: string;
  retryCount: number;
  createdAt: Date;
}

// WebSocket message payloads
export interface HeartbeatPayload {
  deviceId: string;
  isWhitelistedApp: boolean;
}

export interface TimeUpdatePayload {
  remainingSeconds: number;
  weeklyRemaining: number;
}

export interface LockCommandPayload {
  reason: 'budget_exhausted' | 'warden_lockdown';
  message: string;
}

export interface UnlockCommandPayload {
  reason: 'parole_granted' | 'budget_reset';
  message: string;
}

// API request/response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
