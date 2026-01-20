import React, { useState } from 'react'
import { useAuth } from './context/AuthContext'
import LoginSignup from './components/LoginSignup'
import RoomManager from './components/RoomManager'
import ChatApp from './components/ChatApp'

function App() {
  const { user, loading, login, signup } = useAuth()
  const [selectedRoom, setSelectedRoom] = useState(null)

  if (loading) return <div>Loading...</div>
  if (!user) return <LoginSignup onLogin={login} onSignup={signup} />
  if (!selectedRoom) return <RoomManager onRoomSelect={setSelectedRoom} />

  return <ChatApp room={selectedRoom} onLeaveRoom={() => setSelectedRoom(null)} />
}

export default App
