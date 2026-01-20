//updated chatroom 
import React, { useState, useEffect, useRef } from 'react';
import { Send, LogOut, Paperclip, Lock, Sparkles, ArrowLeft, Hash } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function EnhancedChatApp({ room, onLeaveRoom }) {
  const { user, socket, logout, token } = useAuth();
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [selectedFile, setSelectedFile] = useState(null);
  const [privateMessageUser, setPrivateMessageUser] = useState(null);
  const [reactions, setReactions] = useState({});
  const [roomInfo, setRoomInfo] = useState(room || null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'https://vibe-ob16.onrender.com';

  useEffect(() => {
    if (!socket || !room) return;

    // Join the room
    socket.emit('joinRoom', { roomId: room.roomId });

    // Fetch room message history
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/api/messages/${room.roomId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setMessages(data);
        } else if (data.error) {
          console.error('History error:', data.error);
          if (data.error.includes('not a member')) {
            alert('You are not a member of this room');
            onLeaveRoom();
          }
        }
      } catch (err) {
        console.error("History load failed", err);
      }
    };

    fetchHistory();

    // Listen for room joined confirmation
    socket.on('roomJoined', (data) => {
      console.log('Successfully joined room:', data);
      setRoomInfo(data);
      setOnlineUsers(data.onlineUsers || []);
    });

    // Listen for new messages
    socket.on('message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    
    // User joined the room
    socket.on('userJoined', (data) => {
      setOnlineUsers(data.onlineUsers || []);
      if (data.userId !== user.userId) {
        setMessages(prev => [...prev, { 
          id: Date.now(), 
          type: 'system', 
          text: `${data.username} joined`, 
          timestamp: new Date().toISOString() 
        }]);
      }
    });

    // User left the room
    socket.on('userLeft', (data) => {
      setOnlineUsers(data.onlineUsers || []);
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        type: 'system', 
        text: `${data.username} left`, 
        timestamp: new Date().toISOString() 
      }]);
    });

    // Typing indicator
    socket.on('userTyping', (data) => {
      if (data.userId !== user.userId) {
        setTypingUsers(prev => new Set(prev).add(data.username));
        setTimeout(() => setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.username);
          return newSet;
        }), 3000);
      }
    });

    // Private messages (if still using them)
    socket.on('privateMessage', (msg) => {
      setMessages(prev => [...prev, { ...msg, type: 'private', text: `🔒 ${msg.text}` }]);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      if (error.code === 'ROOM_NOT_FOUND') {
        alert('Invalid room ID. This room does not exist.');
        onLeaveRoom();
      } else if (error.code === 'ROOM_DELETED') {
        alert('This room has been deleted.');
        onLeaveRoom();
      } else if (error.code === 'NOT_MEMBER') {
        alert('You are not a member of this room.');
        onLeaveRoom();
      } else {
        alert(error.message || 'An error occurred');
      }
    });

    // Room deleted notification
    socket.on('roomDeleted', (data) => {
      alert('This room has been deleted by the creator');
      onLeaveRoom();
    });

    return () => {
      socket.off('roomJoined');
      socket.off('message');
      socket.off('userJoined');
      socket.off('userLeft');
      socket.off('userTyping');
      socket.off('privateMessage');
      socket.off('error');
      socket.off('roomDeleted');
    };
  }, [socket, token, room, user.userId, onLeaveRoom]);

  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages]);

  const handleSendMessage = () => {
    if (!socket || !message.trim()) return;

    if (privateMessageUser) {
      socket.emit('privateMessage', { 
        toUserId: privateMessageUser.userId, 
        text: message.trim() 
      });
    } else {
      socket.emit('message', { 
        text: message.trim()
      });
    }
    setMessage('');
  };

  const handleTyping = () => {
    if (!socket) return;
    socket.emit('typing');
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {}, 1000);
  };

  const formatTime = (t) => {
    try {
      return new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (!room) {
    return (
      <div className="h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center">
          <Hash className="w-24 h-24 text-zinc-700 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-zinc-100 mb-2">No Room Selected</h2>
          <p className="text-zinc-500">Please select or create a room to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#09090b] flex overflow-hidden font-sans text-zinc-300">
      <input type="file" ref={fileInputRef} className="hidden" />

      {/* Sidebar */}
      <div className="w-80 bg-zinc-950/50 border-r border-zinc-800 flex flex-col backdrop-blur-3xl">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-black" />
            </div>
            <h2 className="text-2xl font-bold tracking-tighter text-zinc-100">vibe.</h2>
          </div>

          {/* Room Info Card */}
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-zinc-500" />
                <p className="text-sm font-bold text-zinc-100">{room.name}</p>
              </div>
            </div>
            {room.description && (
              <p className="text-xs text-zinc-500 mt-1">{room.description}</p>
            )}
          </div>

          {/* User Info Card */}
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-100 font-bold border border-zinc-700">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-100 leading-none">{user.username}</p>
              <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-bold">Online</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">
            Active Members ({onlineUsers.length})
          </h3>
          <div className="space-y-1">
            {onlineUsers.map((u, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800/50 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${u.userId === user.userId ? 'bg-zinc-100' : 'bg-zinc-400'} group-hover:bg-zinc-100`}></div>
                  <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-100">{u.username}</span>
                </div>
                {u.userId !== user.userId && (
                  <button 
                    onClick={() => setPrivateMessageUser(u)} 
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Send private message"
                  >
                    <Lock className="w-4 h-4 text-zinc-600 hover:text-zinc-100" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800 space-y-3">
          {/* Leave Room Button */}
          <button 
            onClick={onLeaveRoom} 
            className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-zinc-400 py-3 rounded-xl hover:bg-orange-600 hover:text-white transition-all border border-zinc-800"
          >
            <ArrowLeft className="w-4 h-4" /> 
            <span className="text-sm font-bold">Leave Room</span>
          </button>

          {/* Logout Button */}
          <button 
            onClick={logout} 
            className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-zinc-400 py-3 rounded-xl hover:bg-zinc-100 hover:text-black transition-all border border-zinc-800"
          >
            <LogOut className="w-4 h-4" /> 
            <span className="text-sm font-bold">Disconnect</span>
          </button>
          
          <div className="flex justify-center items-center opacity-50 hover:opacity-100 transition-opacity duration-500">
            <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-500 font-bold">
              Developed by{" "}
              <a 
                href="https://github.com/madhur-25" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-zinc-100 hover:text-indigo-400 transition-colors duration-300 border-b border-zinc-500/20 hover:border-indigo-500/50 pb-0.5"
              >
                Madhur Kaushik
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-[#09090b]">
        <div className="h-20 flex items-center justify-between px-10 border-b border-zinc-800/50 backdrop-blur-md bg-[#09090b]/80 z-10">
          <h1 className="text-lg font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            {privateMessageUser ? (
              <>
                <Lock className="w-4 h-4 text-zinc-500" /> 
                {privateMessageUser.username}
              </>
            ) : (
              <>
                <Hash className="w-4 h-4 text-zinc-500" />
                {room.name}
              </>
            )}
            {privateMessageUser && (
              <button 
                onClick={() => setPrivateMessageUser(null)} 
                className="ml-2 text-[10px] text-zinc-500 hover:text-white uppercase tracking-wider"
              >
                Exit Whisper
              </button>
            )}
          </h1>
          <div className="text-xs text-zinc-500">
            {onlineUsers.length} {onlineUsers.length === 1 ? 'member' : 'members'} online
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-10 py-8 space-y-8">
          {messages.map((msg, idx) => (
            <div key={msg.id || idx} className={`flex ${msg.userId === user.userId ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
               {msg.type === 'system' ? (
                 <div className="w-full flex justify-center">
                   <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-600 font-black">
                     {msg.text}
                   </span>
                 </div>
               ) : (
                <div className={`max-w-[70%] ${msg.userId === user.userId ? 'order-2' : 'order-1'}`}>
                  {msg.userId !== user.userId && (
                    <p className="text-[10px] font-black text-zinc-600 mb-1.5 ml-1 uppercase tracking-widest">
                      {msg.username}
                    </p>
                  )}
                  <div className={`relative px-5 py-3.5 rounded-2xl ${
                    msg.userId === user.userId 
                      ? 'bg-zinc-100 text-black rounded-tr-none' 
                      : msg.type === 'private'
                      ? 'bg-blue-900/30 text-zinc-200 border border-blue-800 rounded-tl-none'
                      : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-none'
                  }`}>
                    <p className="text-[14px] leading-relaxed font-medium">{msg.text}</p>
                    <p className={`text-[8px] mt-2 font-bold uppercase tracking-widest opacity-40 ${
                      msg.userId === user.userId ? 'text-right' : 'text-left'
                    }`}>
                      {formatTime(msg.timestamp || msg.createdAt)}
                    </p>
                  </div>
                </div>
               )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-10 pt-0">
          {typingUsers.size > 0 && (
            <div className="mb-2 text-[10px] text-zinc-500 italic flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              {Array.from(typingUsers).join(', ')} is typing...
            </div>
          )}
          <div className="relative flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl shadow-2xl focus-within:border-zinc-500">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-zinc-500 hover:text-zinc-100 transition-colors"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder={privateMessageUser ? `Whisper to ${privateMessageUser.username}...` : "Type a message..."}
              className="flex-1 bg-transparent border-none text-zinc-100 focus:ring-0 placeholder:text-zinc-700 text-sm font-medium outline-none"
            />
            <button 
              onClick={handleSendMessage} 
              disabled={!message.trim()}
              className="bg-zinc-100 text-black p-3.5 rounded-xl hover:bg-zinc-200 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
