// src/App.jsx - Complete flow with room management
import React, { useState } from 'react'
import { useAuth } from './context/AuthContext'
import LoginSignup from './components/LoginSignup'
import StyledRoomManager from './components/StyledRoomManager'
import EnhancedChatApp from './components/EnhancedChatApp'

function App() {
  const { user, loading, login, signup } = useAuth()
  const [selectedRoom, setSelectedRoom] = useState(null)

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-zinc-700 border-t-zinc-100 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-wider">Loading vibe...</p>
        </div>
      </div>
    )
  }

  // Not authenticated - show login/signup
  if (!user) {
    return <LoginSignup onLogin={login} onSignup={signup} />
  }

  // Authenticated but no room selected - show room manager
  if (!selectedRoom) {
    return <StyledRoomManager onRoomSelect={setSelectedRoom} />
  }

  // Authenticated and room selected - show chat
  return (
    <EnhancedChatApp 
      room={selectedRoom} 
      onLeaveRoom={() => setSelectedRoom(null)} 
    />
  )
}

export default App
