vibe. unfiltered connections

vibe. is a high-performance, real-time communication platform engineered for seamless interaction. Built using the MERN stack and Socket.io, it features secure authentication, persistent messaging, and real-time user presence.

Bash

🛠️ Tech Stack
Frontend: React.js, Tailwind CSS, Vite

Backend: Node.js, Express.js

Database: MongoDB (Atlas)

Real-time Engine: Socket.io

Authentication: JSON Web Tokens (JWT)

Deployment: Vercel (Frontend), Render (Backend)

✨ Key Features
Real-time Messaging: Instant message delivery using WebSocket technology.

Secure Authentication: Protected routes and encrypted user sessions via JWT.

Online Presence: Live tracking of active members in the "General Space."

Typing Indicators: Real-time "User is typing..." feedback.

Private Whispers: Secure peer-to-peer private messaging capability.

Persistent History: All conversations are stored and retrieved from MongoDB on login.

Modern UI: Sleek, minimalist "Astro-dark" design built with Tailwind CSS.

🏗️ System Architecture
The application follows a Decoupled Architecture:

Client: A React SPA (Single Page Application) that manages local state and socket connections.

Server: A RESTful API that handles authentication, database CRUD operations, and coordinates the Socket.io server.

Database: A NoSQL layer for scalable message and user data storage.

🚀 Installation & Setup
Clone the repo:

Bash

git clone https://github.com/madhur-25/vibe-app.git
Install Dependencies:

Bash

# Backend
cd backend && npm install
# Frontend
cd frontend && npm install
Environment Variables: Create a .env in the backend for MONGODB_URI and JWT_SECRET. Create a .env in the frontend for VITE_API_URL.

Run Development:

Bash

# Backend
npm start
# Frontend
npm run dev
👤 Author
Madhur Kaushik Full-Stack Developer & DSA Enthusiast
