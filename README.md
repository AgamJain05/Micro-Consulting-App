# Micro Consulting Marketplace 💼

> A real-time platform connecting clients with experts for quick, 15-minute video consultations.

## 📖 About the Project

The **Micro Consulting Marketplace** solves the problem of accessibility to expert advice. Instead of booking expensive, hour-long sessions, users can find experts available *now* for short, focused 15-minute consultations. This creates a liquid market for knowledge, perfect for quick debugging, code reviews, or specific advice.

This project was built to demonstrate a full-stack application with real-time capabilities, complex state management, and a modern microservices-ready architecture.

## ✨ Key Features

- **Real-Time Availability**: Consultants can toggle their status online/offline instantly.
- **Instant Session Requests**: Clients can request immediate sessions with available experts.
- **Video Conferencing**: Integrated WebRTC-based video rooms for face-to-face consultations.
- **Smart Wallet System**: Built-in credit system for managing session payments.
- **Role-Based Access**: distinct flows for Consultants (earnings, schedule) and Clients (search, booking).

## 🛠️ Tech Stack

### Frontend
- **React 18 & TypeScript**: For a robust, type-safe UI.
- **Vite**: Next-generation frontend tooling.
- **TailwindCSS**: For rapid, responsive styling.
- **Zustand**: Lightweight global state management (User sessions, UI state).
- **React Query**: Efficient server state management and caching.

### Backend
- **FastAPI (Python)**: High-performance async framework.
- **Beanie & MongoDB**: Asynchronous ODM for flexible document storage.
- **WebSockets**: For real-time session updates and signaling.
- **Docker**: Containerized environment for consistent development and deployment.

## 💡 Technical Highlights

- **Real-time State Sync**: Used WebSockets to synchronize session states (requested, active, ended) between client and consultant instantly.
- **Optimistic UI Updates**: Implemented using React Query to ensure the interface feels snappy even on slower networks.
- **Authentication**: Secure JWT-based authentication flow with protected routes.
- **Scalable Architecture**: Backend structured with clear separation of concerns (Routers, Controllers, Services, DAL) to allow easy transition to microservices.


## 🔮 Future Roadmap

- [ ] **Payment Integration**: Stripe integration for real money transactions.
- [ ] **Review System**: Post-session ratings and reviews.
- [ ] **Calendar Integration**: Google Calendar sync for scheduled sessions.
- [ ] **Chat Fallback**: Text chat alongside video.

