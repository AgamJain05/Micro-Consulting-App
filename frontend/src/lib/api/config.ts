import { apiClient } from './client';
import type { WebRTCConfig, PlatformStats, AdminUser, RevenueAnalytics, UserAnalytics } from '../../types';

const API_PREFIX = '/api/v1';

export const configApi = {
  /**
   * Get WebRTC configuration (ICE servers)
   */
  getWebRTCConfig: async (): Promise<WebRTCConfig> => {
    const response = await apiClient.get<WebRTCConfig>(`${API_PREFIX}/config/webrtc`);
    return response.data;
  },

  /**
   * Get ICE servers only
   */
  getIceServers: async (): Promise<{ iceServers: WebRTCConfig['iceServers'] }> => {
    const response = await apiClient.get<{ iceServers: WebRTCConfig['iceServers'] }>(`${API_PREFIX}/config/ice-servers`);
    return response.data;
  },
};

export const adminApi = {
  /**
   * Get platform statistics
   */
  getStats: async (): Promise<PlatformStats> => {
    const response = await apiClient.get<PlatformStats>(`${API_PREFIX}/admin/stats`);
    return response.data;
  },

  /**
   * Get all users
   */
  getUsers: async (params?: {
    role?: string;
    search?: string;
    skip?: number;
    limit?: number;
  }): Promise<AdminUser[]> => {
    const response = await apiClient.get<AdminUser[]>(`${API_PREFIX}/admin/users`, { params });
    return response.data;
  },

  /**
   * Get user details
   */
  getUserDetails: async (userId: string): Promise<any> => {
    const response = await apiClient.get(`${API_PREFIX}/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Perform action on user
   */
  userAction: async (userId: string, action: string, value?: number): Promise<any> => {
    const response = await apiClient.post(`${API_PREFIX}/admin/users/${userId}/action`, { action, value });
    return response.data;
  },

  /**
   * Get all sessions
   */
  getSessions: async (params?: {
    status?: string;
    skip?: number;
    limit?: number;
  }): Promise<any[]> => {
    const response = await apiClient.get(`${API_PREFIX}/admin/sessions`, { params });
    return response.data;
  },

  /**
   * Get revenue analytics
   */
  getRevenueAnalytics: async (days: number = 30): Promise<RevenueAnalytics> => {
    const response = await apiClient.get<RevenueAnalytics>(`${API_PREFIX}/admin/analytics/revenue`, { params: { days } });
    return response.data;
  },

  /**
   * Get user analytics
   */
  getUserAnalytics: async (days: number = 30): Promise<UserAnalytics> => {
    const response = await apiClient.get<UserAnalytics>(`${API_PREFIX}/admin/analytics/users`, { params: { days } });
    return response.data;
  },
};
