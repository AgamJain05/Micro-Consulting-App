import { apiClient } from './client';
import type { Session, SessionCreate, SessionUpdate, Message } from '../../types';

const API_PREFIX = '/api/v1';

export const sessionsApi = {
  /**
   * Request a new session
   */
  create: async (data: SessionCreate): Promise<Session> => {
    const response = await apiClient.post<Session>(`${API_PREFIX}/sessions/`, data);
    return response.data;
  },

  /**
   * Get all sessions for current user
   */
  getAll: async (status?: string): Promise<Session[]> => {
    const params = status ? { status } : {};
    const response = await apiClient.get<Session[]>(`${API_PREFIX}/sessions/`, { params });
    return response.data;
  },

  /**
   * Get session by ID
   */
  getById: async (sessionId: string): Promise<Session> => {
    const response = await apiClient.get<Session>(`${API_PREFIX}/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Accept a session (consultant only)
   */
  accept: async (sessionId: string): Promise<Session> => {
    const response = await apiClient.post<Session>(`${API_PREFIX}/sessions/${sessionId}/accept`);
    return response.data;
  },

  /**
   * Reject a session (consultant only)
   */
  reject: async (sessionId: string): Promise<Session> => {
    const response = await apiClient.post<Session>(`${API_PREFIX}/sessions/${sessionId}/reject`);
    return response.data;
  },

  /**
   * Start video for a session
   */
  startVideo: async (sessionId: string): Promise<Session> => {
    const response = await apiClient.post<Session>(`${API_PREFIX}/sessions/${sessionId}/start_video`);
    return response.data;
  },

  /**
   * Update session status (complete, cancel)
   */
  updateStatus: async (sessionId: string, data: SessionUpdate): Promise<Session> => {
    const response = await apiClient.patch<Session>(`${API_PREFIX}/sessions/${sessionId}/status`, data);
    return response.data;
  },

  /**
   * Get session messages
   */
  getMessages: async (sessionId: string): Promise<Message[]> => {
    const response = await apiClient.get<Message[]>(`${API_PREFIX}/sessions/${sessionId}/messages`);
    return response.data;
  },
};
