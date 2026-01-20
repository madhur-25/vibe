# vibe. unfiltered connection.

**vibe.** is a high-performance, real-time communication platform engineered for seamless interaction.  
Built using the **MERN stack** and **Socket.io**, it enables secure authentication, persistent messaging, and real-time user presence.

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Vite

### Backend
- Node.js
- Express.js

### Database
- MongoDB Atlas

### Real-time Engine
- Socket.io

### Authentication
- JSON Web Tokens (JWT)

### Deployment
- Vercel (Frontend)
- Render (Backend)

---

## ✨ Key Features

- **Real-time Messaging**  
  Instant message delivery using WebSocket communication.

- **Secure Authentication**  
  JWT-based authentication with protected routes and encrypted sessions.

- **File & Media Sharing** 
  Secure uploads for images, documents, and media.

- **Online Presence**  
  Live tracking of active users in the *General Space*.

- **Typing Indicators**  
  Real-time “user is typing” feedback.

- **Private Whispers**  
  Secure peer-to-peer private messaging between users.

- **Persistent Chat History**  
  Messages are stored in MongoDB and restored on user login.

- **Modern UI**  
  Clean, minimalist *Astro-dark* interface built with Tailwind CSS.
  
- **Private Rooms with Unique IDs**  
 Create invite-only chat rooms accessible via unique room IDs or shareable links.(working on it)

---

### 🏗️ System Architecture

The **vibe. protocol** is built on a **Decoupled Event-Driven Architecture**, designed to deliver **high availability**, **scalability**, and **low-latency real-time communication**.

---

### 1️⃣ Client Layer (Frontend)

**Architecture:**  
- React.js Single Page Application (SPA)

**Responsibilities:**  
- Responsive UI rendering  
- Client-side state management  
- Full-duplex real-time communication using Socket.io  

**Key Logic & Features:**  
- Discovery Grid logic for room exploration  
- Glassmorphism-based UI built with Tailwind CSS  
- Optimized rendering for real-time updates  

---

### 2️⃣ Service Layer (Backend)

**Architecture:**  
- Node.js with Express.js RESTful API  

**Security:**  
- Stateless JWT (JSON Web Token) authentication  
- Custom middleware for room-level access control  

**Real-Time Engine:**  
- Socket.io server managing event-driven communication  
- Room-scoped message broadcasting mapped to virtual “frequencies”  

---

### 3️⃣ Data Persistence Layer (Database)

**Architecture:**  
- MongoDB (NoSQL)

**Data Model:**  
- Optimized for high-write chat workloads  
- Stores:
  - User profiles  
  - Room metadata  
  - Historical message logs  

---



##  Installation & Setup

### 1️⃣ Clone the repository
```bash
git clone https://github.com/madhur-25/vibe-app.git

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

VITE_API_URL=http://localhost:4000

# Backend
npm start

# Frontend
npm run dev

👤 Author
Madhur Kaushik






