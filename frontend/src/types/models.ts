// User Types
export type UserRole = 'client' | 'consultant' | 'admin';

export interface User {
  id: string;
  _id?: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  credits: number;
  headline?: string;
  bio?: string;
  skills: string[];
  price_per_minute?: number;
  rating: number;
  review_count: number;
  category: string;
  avatar_url?: string;
  status: 'online' | 'offline' | 'busy';
  timezone: string;
  created_at?: string;
}

export interface UserCreate {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'client' | 'consultant';
}

export interface UserUpdate {
  first_name?: string;
  last_name?: string;
  headline?: string;
  bio?: string;
  skills?: string[];
  price_per_minute?: number;
  status?: 'online' | 'offline' | 'busy';
  category?: string;
  avatar_url?: string;
}

// Session Types
export type SessionStatus = 'pending' | 'accepted' | 'rejected' | 'active' | 'completed' | 'cancelled';

export interface Session {
  id: string;
  _id?: string;
  client: User;
  consultant: User;
  topic: string;
  description?: string;
  status: SessionStatus;
  created_at: string;
  scheduled_at?: string;
  duration_minutes: number;
  actual_start_time?: string;
  actual_end_time?: string;
  actual_duration_seconds?: number;
  cost_per_minute: number;
  total_cost: number;
  is_paid: boolean;
}

export interface SessionCreate {
  consultant_id: string;
  topic: string;
  description?: string;
  duration_minutes?: number;
  scheduled_at?: string;
}

export interface SessionUpdate {
  status?: SessionStatus;
}

// Review Types
export interface Review {
  id: string;
  rating: number;
  comment: string;
  client_name: string;
  created_at: string;
}

export interface ReviewCreate {
  session_id: string;
  rating: number;
  comment: string;
}

// Message Types
export interface Message {
  id: string;
  sender_id: string;
  content: string;
  timestamp: string;
}

export interface ChatMessage {
  userId: string;
  text: string;
  timestamp: number;
  isMe: boolean;
  isSystem?: boolean;
}

// WebSocket Message Types
export type WebSocketMessageType = 
  | 'offer' 
  | 'answer' 
  | 'ice-candidate' 
  | 'chat' 
  | 'system' 
  | 'end-session' 
  | 'session-ended'
  | 'user-joined'
  | 'user-left';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  userId?: string;
  text?: string;
  timestamp?: number;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

// Auth Types
export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

// API Response Types
export interface ApiError {
  detail: string;
}

// WebRTC Config Types
export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface WebRTCConfig {
  iceServers: IceServer[];
  iceCandidatePoolSize?: number;
}

// Admin Types
export interface PlatformStats {
  total_users: number;
  total_clients: number;
  total_consultants: number;
  total_sessions: number;
  completed_sessions: number;
  active_sessions: number;
  pending_sessions: number;
  total_revenue: number;
  total_reviews: number;
  avg_rating: number;
  users_today: number;
  sessions_today: number;
}

export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  credits: number;
  rating: number;
  review_count: number;
  created_at: string;
  is_active: boolean;
}

export interface RevenueAnalytics {
  period_days: number;
  total_revenue: number;
  session_count: number;
  daily_breakdown: Array<{
    date: string;
    revenue: number;
  }>;
}

export interface UserAnalytics {
  period_days: number;
  total_new_users: number;
  new_clients: number;
  new_consultants: number;
  daily_breakdown: Array<{
    date: string;
    signups: number;
  }>;
}

// Utility type for getting ID from various formats
export function getId(obj: { id?: string; _id?: string } | null | undefined): string | undefined {
  return obj?.id || obj?._id;
}
