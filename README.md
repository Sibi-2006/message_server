# ⚡ Real-Time Notification & Messaging Platform

A production-ready full-stack real-time mobile messaging and notification application built with **React Native (Expo)**, **NativeWind (Tailwind CSS)**, **Node.js**, **Express**, **Socket.IO**, **MongoDB Atlas**, and **Expo Push Notifications**.

---

## ✨ Features

- 🔐 **JWT Authentication & Session Persistence**: Secure login & registration flow saved locally in `AsyncStorage`.
- 🆔 **Unique User Identity**: Auto-generates shareable unique User IDs (`#SB8687`) alongside custom `@username` handles.
- 🔍 **Instant User Search**: Search users by partial `@username` handle or exact `#userId`.
- 💬 **Real-Time Messaging**: Instant chat delivery powered by **Socket.IO**.
- ✍️ **Live Typing Indicators**: Broadcasts real-time "User is typing..." indicators.
- ⏱️ **Read Receipts (Double Ticks)**: Visual indicators for sent (`✓`), delivered (`✓✓`), and read status (blue `✓✓`).
- 🟢 **Online/Offline Status**: Live online status green dots and "Last seen" timestamps.
- 🔔 **Expo Push Notifications**: Automatic push notification fallback when a recipient is offline or backgrounded (`https://exp.host/--/api/v2/push/send`).
- 🌗 **Light & Dark Mode**: Persistent theme switching powered by NativeWind Tailwind CSS.
- 🛡️ **Security & Anti-Spam**: Rate limiting middleware, input sanitization, and password hashing with `bcryptjs`.

---

## 🛠️ Tech Stack

- **Frontend**: React Native, Expo, NativeWind (Tailwind CSS), Socket.IO Client, Expo Notifications, AsyncStorage.
- **Backend**: Node.js, Express, Socket.IO, Mongoose (MongoDB Atlas), JWT, bcryptjs, Cors, Dotenv.

---

## 📁 Repository Structure

```
Notification_Platform/
├── backend/
│   ├── config/           # MongoDB Atlas connection
│   ├── controllers/      # Auth, User, Message, Notification controllers
│   ├── middleware/       # JWT auth & Rate limiter middleware
│   ├── models/           # User, Message, Conversation, Notification schemas
│   ├── routes/           # Express API endpoints
│   ├── sockets/          # Socket.IO connection & event handlers
│   ├── utils/            # Expo Push API client & sanitizer
│   ├── .env              # Environment configuration
│   └── server.js         # Main server entry point
│
└── frontend/
    ├── src/
    │   ├── components/   # Avatar, ChatBubble, ConversationCard, Header, Toast, ThemeToggle
    │   ├── context/      # AuthContext, ThemeContext, MessagingContext, NotificationContext
    │   ├── screens/      # Login, Register, Home (Chats), Search, Chat, Notifications, Profile
    │   ├── services/     # API, Socket, and Push Notification helpers
    │   └── utils/        # Constants and Date/Time formatters
    ├── App.js            # Main application component & tab navigation
    └── tailwind.config.js# NativeWind Tailwind configuration
```

---

## 🚀 Getting Started

### 1. Backend Setup

```bash
cd backend
npm install
node server.js
```
The server will start at `http://localhost:5000`.

### 2. Frontend Mobile Setup

```bash
cd frontend
npm install
npx expo start
```
- Open on **Android Emulator**, **iOS Simulator**, or a physical device via **Expo Go**.
- Configure the backend URL in the App Login screen under **⚙️ Backend IP** if running on physical devices or network emulators.

---

## 🧪 Testing

Run the automated messaging verification test script:
```bash
cd backend
node test-messaging-flow.js
```
