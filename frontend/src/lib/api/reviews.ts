import { apiClient } from './client';
import type { Review, ReviewCreate } from '../../types';

const API_PREFIX = '/api/v1';

export const reviewsApi = {
  /**
   * Create a review for a completed session
   */
  create: async (data: ReviewCreate): Promise<Review> => {
    const response = await apiClient.post<Review>(`${API_PREFIX}/reviews/`, data);
    return response.data;
  },

  /**
   * Get reviews for a consultant
   */
  getForConsultant: async (consultantId: string): Promise<Review[]> => {
    const response = await apiClient.get<Review[]>(`${API_PREFIX}/reviews/consultant/${consultantId}`);
    return response.data;
  },
};
