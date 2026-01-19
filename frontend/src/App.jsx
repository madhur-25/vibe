//App.jsx
import React from 'react'
import { useAuth } from './context/AuthContext'
import LoginSignup from './components/LoginSignup'
import ChatApp from './components/ChatApp' // Your existing chat component

function App() {
  const { user, loading, login, signup } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <LoginSignup onLogin={login} onSignup={signup} />
  }

  return <ChatApp />
}

export default App
