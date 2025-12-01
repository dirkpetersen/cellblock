/**
 * API Client for CellBlock Frontend
 * Handles all HTTP requests to the backend API
 */

import type {
  SignupInput,
  LoginInput,
  UpdateUserInput,
  AddWhitelistItemInput,
  InviteWardenInput,
  ApproveRequestInput,
  GrantParoleInput,
  TriggerLockdownInput,
  RegisterDeviceInput,
} from '@cellblock/contracts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private accessToken: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_URL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include cookies for refresh token
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ============================================================================
  // Authentication
  // ============================================================================

  async signup(data: SignupInput) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginInput) {
    const result = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    this.setAccessToken(result.accessToken);
    return result;
  }

  async logout() {
    const result = await this.request('/auth/logout', { method: 'POST' });
    this.setAccessToken(null);
    return result;
  }

  async refreshToken() {
    const result = await this.request('/auth/refresh', { method: 'POST' });
    this.setAccessToken(result.accessToken);
    return result;
  }

  async getProfile() {
    return this.request('/auth/me');
  }

  async verifyEmail(token: string) {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async requestPasswordReset(email: string) {
    return this.request('/auth/password-reset/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request('/auth/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  // ============================================================================
  // Users
  // ============================================================================

  async updateProfile(data: UpdateUserInput) {
    return this.request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAccount(password: string) {
    return this.request('/users/me', {
      method: 'DELETE',
      body: JSON.stringify({ password, confirmation: 'DELETE' }),
    });
  }

  async breakGlass(comment?: string) {
    return this.request('/users/break-glass', {
      method: 'POST',
      body: JSON.stringify({ confirmation: 'BREAK_GLASS', comment }),
    });
  }

  // ============================================================================
  // Devices
  // ============================================================================

  async registerDevice(data: RegisterDeviceInput) {
    return this.request('/devices/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDevices() {
    return this.request('/devices');
  }

  async removeDevice(deviceId: string) {
    return this.request(`/devices/${deviceId}`, { method: 'DELETE' });
  }

  // ============================================================================
  // Time
  // ============================================================================

  async getTimeStatus() {
    return this.request('/time/status');
  }

  async getUsageLogs(params?: { startDate?: string; endDate?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/time/usage${query ? `?${query}` : ''}`);
  }

  // ============================================================================
  // Whitelist
  // ============================================================================

  async getWhitelist() {
    return this.request('/whitelist');
  }

  async getEnabledWhitelist(platform?: string) {
    const query = platform ? `?platform=${platform}` : '';
    return this.request(`/whitelist/enabled${query}`);
  }

  async addWhitelistItem(data: AddWhitelistItemInput) {
    return this.request('/whitelist', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removeWhitelistItem(itemId: string, comment?: string) {
    return this.request('/whitelist', {
      method: 'DELETE',
      body: JSON.stringify({ itemId, comment }),
    });
  }

  async toggleHealthyApp(itemId: string, enabled: boolean, comment?: string) {
    return this.request('/whitelist/toggle', {
      method: 'PUT',
      body: JSON.stringify({ itemId, enabled, comment }),
    });
  }

  // ============================================================================
  // Warden
  // ============================================================================

  async inviteWarden(data: InviteWardenInput) {
    return this.request('/warden/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async acceptWardenInvite(token: string) {
    return this.request('/warden/accept', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async getInmates() {
    return this.request('/warden/inmates');
  }

  async getMyWardens() {
    return this.request('/warden/my-wardens');
  }

  async getPendingRequests() {
    return this.request('/warden/requests/pending');
  }

  async approveRequest(data: ApproveRequestInput) {
    return this.request('/warden/approve', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async grantParole(data: GrantParoleInput) {
    return this.request('/warden/parole', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async triggerLockdown(data: TriggerLockdownInput) {
    return this.request('/warden/lockdown', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resignAsWarden(inmateId: string) {
    return this.request('/warden/resign', {
      method: 'POST',
      body: JSON.stringify({ inmateId }),
    });
  }
}

export const apiClient = new ApiClient();
