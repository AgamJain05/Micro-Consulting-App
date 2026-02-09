import { apiClient } from './client';
import type { User, UserCreate, UserUpdate, LoginResponse } from '../../types';

const API_PREFIX = '/api/v1';

export const authApi = {
  /**
   * Register a new user
   */
  register: async (data: UserCreate): Promise<User> => {
    const response = await apiClient.post<User>(`${API_PREFIX}/auth/register`, data);
    return response.data;
  },

  /**
   * Login user and get access token
   */
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await apiClient.post<LoginResponse>(
      `${API_PREFIX}/auth/login`,
      formData,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return response.data;
  },

  /**
   * Get current user profile
   */
  me: async (token?: string): Promise<User> => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const response = await apiClient.get<User>(`${API_PREFIX}/auth/me`, config);
    return response.data;
  },
};

export const usersApi = {
  /**
   * Update user profile
   */
  updateProfile: async (data: UserUpdate): Promise<User> => {
    const response = await apiClient.put<User>(`${API_PREFIX}/users/profile`, data);
    return response.data;
  },

  /**
   * Top up credits
   */
  topUp: async (amount: number): Promise<User> => {
    const response = await apiClient.post<User>(`${API_PREFIX}/users/topup`, { amount });
    return response.data;
  },

  /**
   * Search consultants
   */
  searchConsultants: async (params?: {
    search?: string;
    category?: string;
    skills?: string[];
    skip?: number;
    limit?: number;
  }): Promise<User[]> => {
    const response = await apiClient.get<User[]>(`${API_PREFIX}/users/consultants`, { params });
    return response.data;
  },

  /**
   * Get user by ID
   */
  getById: async (userId: string): Promise<User> => {
    const response = await apiClient.get<User>(`${API_PREFIX}/users/${userId}`);
    return response.data;
  },
};
