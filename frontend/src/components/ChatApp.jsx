import React, { useState, useEffect, useRef } from 'react';
import { Send, LogOut, Paperclip, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function EnhancedChatApp() {
  // Pull authenticated state from Context
  const { user, socket, logout, token } = useAuth();
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [selectedFile, setSelectedFile] = useState(null);
  const [privateMessageUser, setPrivateMessageUser] = useState(null);
  const [reactions, setReactions] = useState({});
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'https://vibe-ob16.onrender.com';

  useEffect(() => {
    if (!socket) return;

    // 1. Fetch History with JWT Authorization
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/api/messages/general`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (Array.isArray(data)) setMessages(data);
      } catch (err) {
        console.error("History load failed", err);
      }
    };

    fetchHistory();

    // 2. Real-time Listeners
    socket.emit('join', { roomId: 'general' });

    socket.on('message', (msg) => setMessages(prev => [...prev, msg]));
    
    socket.on('userJoined', (data) => {
      setOnlineUsers(data.onlineUsers);
      if (data.userId !== user.userId) {
        setMessages(prev => [...prev, { 
          id: Date.now(), 
          type: 'system', 
          text: `${data.username} joined`, 
          timestamp: new Date().toISOString() 
        }]);
      }
    });

    socket.on('userLeft', (data) => {
      setOnlineUsers(data.onlineUsers);
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        type: 'system', 
        text: `${data.username} left`, 
        timestamp: new Date().toISOString() 
      }]);
    });

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

    socket.on('privateMessage', (msg) => {
      setMessages(prev => [...prev, { ...msg, type: 'private', text: `🔒 ${msg.text}` }]);
    });

    return () => {
      socket.off('message');
      socket.off('userJoined');
      socket.off('userLeft');
      socket.off('userTyping');
      socket.off('privateMessage');
    };
  }, [socket, token, user.userId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSendMessage = () => {
    if (!socket || !message.trim()) return;

    if (privateMessageUser) {
      socket.emit('privateMessage', { 
        toUserId: privateMessageUser.userId, 
        text: message.trim() 
      });
    } else {
      socket.emit('message', { 
        text: message.trim(), 
        roomId: 'general' 
      });
    }
    setMessage('');
  };

  const handleTyping = () => {
    if (!socket) return;
    socket.emit('typing', { roomId: 'general' });
  };

  const formatTime = (t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // --- UI REMAINS THE SAME ---
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
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Active Members ({onlineUsers.length})</h3>
          <div className="space-y-1">
            {onlineUsers.map((u, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800/50 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${u.userId === user.userId ? 'bg-zinc-100' : 'bg-zinc-400'} group-hover:bg-zinc-100`}></div>
                  <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-100">{u.username}</span>
                </div>
                {u.userId !== user.userId && (
                  <button onClick={() => setPrivateMessageUser(u)} className="opacity-0 group-hover:opacity-100">
                    <Lock className="w-4 h-4 text-zinc-600 hover:text-zinc-100" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800">
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-zinc-400 py-3 rounded-xl hover:bg-zinc-100 hover:text-black transition-all border border-zinc-800">
            <LogOut className="w-4 h-4" /> <span className="text-sm font-bold">Disconnect</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-[#09090b]">
        <div className="h-20 flex items-center justify-between px-10 border-b border-zinc-800/50 backdrop-blur-md bg-[#09090b]/80 z-10">
          <h1 className="text-lg font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            {privateMessageUser ? <><Lock className="w-4 h-4 text-zinc-500" /> {privateMessageUser.username}</> : 'General Space'}
            {privateMessageUser && <button onClick={() => setPrivateMessageUser(null)} className="ml-2 text-[10px] text-zinc-500 hover:text-white uppercase">Exit Whisper</button>}
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto px-10 py-8 space-y-8">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.userId === user.userId ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
               {msg.type === 'system' ? (
                 <div className="w-full flex justify-center"><span className="text-[9px] uppercase tracking-[0.2em] text-zinc-600 font-black">{msg.text}</span></div>
               ) : (
                <div className={`max-w-[70%] ${msg.userId === user.userId ? 'order-2' : 'order-1'}`}>
                  {msg.userId !== user.userId && <p className="text-[10px] font-black text-zinc-600 mb-1.5 ml-1 uppercase tracking-widest">{msg.username}</p>}
                  <div className={`relative px-5 py-3.5 rounded-2xl ${msg.userId === user.userId ? 'bg-zinc-100 text-black rounded-tr-none' : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-none'}`}>
                    <p className="text-[14px] leading-relaxed font-medium">{msg.text}</p>
                    <p className={`text-[8px] mt-2 font-bold uppercase tracking-widest opacity-40 ${msg.userId === user.userId ? 'text-right' : 'text-left'}`}>{formatTime(msg.timestamp || msg.createdAt)}</p>
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
            <div className="mb-2 text-[10px] text-zinc-500 italic">
              {Array.from(typingUsers).join(', ')} is typing...
            </div>
          )}
          <div className="relative flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl shadow-2xl focus-within:border-zinc-500">
            <button className="p-3 text-zinc-500 hover:text-zinc-100 transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={privateMessageUser ? `Whisper to ${privateMessageUser.username}...` : "Type a message..."}
              className="flex-1 bg-transparent border-none text-zinc-100 focus:ring-0 placeholder:text-zinc-700 text-sm font-medium"
            />
            <button onClick={handleSendMessage} className="bg-zinc-100 text-black p-3.5 rounded-xl hover:bg-zinc-200 transition-all shadow-lg">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
