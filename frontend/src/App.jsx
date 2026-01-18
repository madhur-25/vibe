import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, MessageCircle, LogOut, User, Paperclip, Image, FileText, X, Lock, Sparkles } from 'lucide-react';


class EnhancedSocketSimulator {
  constructor() {
    this.listeners = {};
    this.users = new Map();
    this.messages = [];
    this.privateMessages = new Map();
    this.messageId = 0;
  }
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }
  emit(event, data) {
    setTimeout(() => {
      if (event === 'join') {
        this.users.set(data.userId, { username: data.username, status: 'online' });
        this.trigger('userJoined', {
          username: data.username,
          userId: data.userId,
          onlineUsers: Array.from(this.users.entries()).map(([id, u]) => ({ userId: id, username: u.username, status: u.status }))
        });
      } else if (event === 'message') {
        const msg = { id: this.messageId++, ...data, timestamp: new Date().toISOString() };
        this.messages.push(msg);
        this.trigger('message', msg);
      } else if (event === 'fileMessage') {
        const msg = { id: this.messageId++, ...data, type: 'file', timestamp: new Date().toISOString() };
        this.messages.push(msg);
        this.trigger('message', msg);
      } else if (event === 'privateMessage') {
        const msg = { id: this.messageId++, fromUserId: data.fromUserId, fromUsername: data.fromUsername, toUserId: data.toUserId, text: data.text, type: 'private', timestamp: new Date().toISOString() };
        const key = [data.fromUserId, data.toUserId].sort().join('-');
        if (!this.privateMessages.has(key)) this.privateMessages.set(key, []);
        this.privateMessages.get(key).push(msg);
        this.trigger('privateMessage', msg);
      } else if (event === 'typing') {
        this.trigger('userTyping', data);
      } else if (event === 'disconnect') {
        this.users.delete(data.userId);
        this.trigger('userLeft', {
          username: data.username,
          onlineUsers: Array.from(this.users.entries()).map(([id, u]) => ({ userId: id, username: u.username, status: u.status }))
        });
      } else if (event === 'reaction') {
        this.trigger('reactionUpdate', { messageId: data.messageId, reactions: data.reactions });
      }
    }, 100);
  }
  trigger(event, data) {
    if (this.listeners[event]) this.listeners[event].forEach(callback => callback(data));
  }
}

const socket = new EnhancedSocketSimulator();

export default function EnhancedChatApp() {
  const [username, setUsername] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [userId] = useState(() => Math.random().toString(36).substr(2, 9));
  const [selectedFile, setSelectedFile] = useState(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [privateMessageUser, setPrivateMessageUser] = useState(null);
  const [reactions, setReactions] = useState({});
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    socket.on('message', (msg) => setMessages(prev => [...prev, msg]));
    socket.on('userJoined', (data) => {
      setOnlineUsers(data.onlineUsers);
      if (data.username !== username) {
        setMessages(prev => [...prev, { id: Date.now(), type: 'system', text: `${data.username} joined`, timestamp: new Date().toISOString() }]);
      }
    });
    socket.on('userLeft', (data) => {
      setOnlineUsers(data.onlineUsers);
      setMessages(prev => [...prev, { id: Date.now(), type: 'system', text: `${data.username} left`, timestamp: new Date().toISOString() }]);
    });
    socket.on('userTyping', (data) => {
      if (data.userId !== userId) {
        setTypingUsers(prev => new Set(prev).add(data.username));
        setTimeout(() => setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.username);
          return newSet;
        }), 3000);
      }
    });
    socket.on('privateMessage', (msg) => {
      if (msg.toUserId === userId || msg.fromUserId === userId) {
        setMessages(prev => [...prev, { ...msg, type: 'private', text: `🔒 ${msg.text}` }]);
      }
    });
    socket.on('reactionUpdate', (data) => {
      setReactions(prev => ({ ...prev, [data.messageId]: data.reactions }));
    });
  }, [username, userId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleJoin = () => { if (username.trim()) { socket.emit('join', { username: username.trim(), userId }); setIsJoined(true); } };
  const handleSendMessage = () => {
    if (selectedFile) handleFileUpload();
    else if (message.trim()) {
      if (privateMessageUser) socket.emit('privateMessage', { fromUserId: userId, fromUsername: username, toUserId: privateMessageUser.userId, text: message.trim() });
      else socket.emit('message', { username, userId, text: message.trim(), type: 'user' });
      setMessage('');
    }
  };
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 10 * 1024 * 1024) { setSelectedFile(file); setShowFilePreview(true); }
    else if (file) alert('File too large (Max 10MB)');
  };
  const handleFileUpload = () => {
    if (!selectedFile) return;
    socket.emit('fileMessage', { username, userId, fileUrl: URL.createObjectURL(selectedFile), filename: selectedFile.name, fileType: selectedFile.type, text: selectedFile.name });
    setSelectedFile(null); setShowFilePreview(false);
  };
  const handleReaction = (messageId, emoji) => {
    const current = reactions[messageId] || [];
    const exists = current.find(r => r.userId === userId && r.emoji === emoji);
    const newR = exists ? current.filter(r => !(r.userId === userId && r.emoji === emoji)) : [...current, { userId, emoji }];
    socket.emit('reaction', { messageId, emoji, userId, reactions: newR });
  };
  const handleTyping = () => {
    socket.emit('typing', { username, userId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {}, 1000);
  };
  const formatTime = (t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const handleKeyPress = (e, action) => { if (e.key === 'Enter') { e.preventDefault(); action(); } };

  // --- UI SECTION: GREY AESTHETIC REWRITE ---
  if (!isJoined) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-6 font-sans selection:bg-zinc-500/30">
        {/* Subtle Grey Blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-zinc-500/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-zinc-500/5 rounded-full blur-[120px]"></div>
        
        <div className="relative w-full max-w-[400px] backdrop-blur-3xl bg-zinc-900/40 border border-zinc-800 p-10 rounded-[2.5rem] shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-zinc-100 rounded-3xl flex items-center justify-center shadow-2xl shadow-zinc-500/10 mb-6 transition-transform hover:rotate-6 duration-500">
              <Sparkles className="w-10 h-10 text-black" />
            </div>
            <h1 className="text-5xl font-black text-zinc-100 tracking-tighter mb-2">vibe.</h1>
            <p className="text-zinc-500 font-medium">unfiltered connection.</p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, handleJoin)}
              placeholder="What's your alias?"
              className="w-full bg-zinc-950/50 border border-zinc-800 px-6 py-4 rounded-2xl text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition-all text-center text-lg"
            />
            <button
              onClick={handleJoin}
              className="w-full bg-zinc-100 text-black py-4 rounded-2xl font-bold text-lg hover:bg-zinc-200 transition-all duration-300 active:scale-95 shadow-lg"
            >
              Enter the space
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#09090b] flex overflow-hidden font-sans text-zinc-300">
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,.pdf,.doc,.docx,.txt" className="hidden" />

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
              {username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-100 leading-none">{username}</p>
              <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-bold">Online</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Members</h3>
            <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded-md font-bold">{onlineUsers.length}</span>
          </div>
          <div className="space-y-1">
            {onlineUsers.map((user, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800/50 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full group-hover:bg-zinc-100 transition-colors"></div>
                  <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-100">{user.username}</span>
                </div>
                {user.userId !== userId && (
                  <button onClick={() => setPrivateMessageUser(user)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Lock className="w-4 h-4 text-zinc-600 hover:text-zinc-100" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800">
          <p className="text-[10px] text-center text-zinc-600 mb-4 tracking-tight">
            Designed for <span className="text-zinc-100 font-bold">vibe.</span> by <span className="text-zinc-500">Madhur Kaushik</span>
          </p>
          <button onClick={() => setIsJoined(false)} className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-zinc-400 py-3 rounded-xl hover:bg-zinc-100 hover:text-black transition-all border border-zinc-800">
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-bold">Disconnect</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-[#09090b]">
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-10 border-b border-zinc-800/50 backdrop-blur-md bg-[#09090b]/80 z-10">
          <div>
            <h1 className="text-lg font-bold text-zinc-100 tracking-tight flex items-center gap-2">
              {privateMessageUser ? <><Lock className="w-4 h-4 text-zinc-500" /> {privateMessageUser.username}</> : 'General Space'}
            </h1>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-10 py-8 space-y-8">
          {messages.map((msg) => {
            if (msg.type === 'system') return (
              <div key={msg.id} className="flex justify-center"><span className="text-[9px] uppercase tracking-[0.2em] text-zinc-600 font-black">{msg.text}</span></div>
            );
            const isOwn = msg.userId === userId;
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                  {!isOwn && <p className="text-[10px] font-black text-zinc-600 mb-1.5 ml-1 uppercase tracking-widest">{msg.username}</p>}
                  <div className={`relative px-5 py-3.5 rounded-2xl ${isOwn ? 'bg-zinc-100 text-black rounded-tr-none shadow-xl' : 'bg-zinc-900 text-zinc-200 rounded-tl-none border border-zinc-800'}`}>
                    {msg.type === 'file' ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-2 bg-black/10 rounded-lg">
                          <FileText className="w-5 h-5" />
                          <span className="text-xs truncate max-w-[150px]">{msg.text}</span>
                        </div>
                        {msg.fileType?.startsWith('image/') && <img src={msg.fileUrl} className="max-w-full rounded-lg" alt="upload" />}
                      </div>
                    ) : <p className="text-[14px] leading-relaxed font-medium">{msg.text}</p>}
                    <p className={`text-[8px] mt-2 font-bold uppercase tracking-widest opacity-40 ${isOwn ? 'text-right' : 'text-left'}`}>{formatTime(msg.timestamp)}</p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <div className="absolute bottom-28 left-10 flex items-center gap-2 text-[9px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-900/50 px-4 py-2 rounded-full border border-zinc-800 animate-pulse">
            {Array.from(typingUsers).join(', ')} typing...
          </div>
        )}

        {/* Input */}
        <div className="p-10 pt-0">
          {showFilePreview && (
            <div className="mb-4 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3">
                <Paperclip className="w-4 h-4 text-zinc-400" />
                <span className="text-xs text-zinc-100 font-bold truncate max-w-[200px]">{selectedFile?.name}</span>
              </div>
              <button onClick={() => setShowFilePreview(false)} className="text-zinc-500 hover:text-zinc-100"><X className="w-4 h-4" /></button>
            </div>
          )}
          <div className="relative group">
            <div className="relative flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl transition-all focus-within:border-zinc-500 shadow-2xl">
              <button onClick={() => fileInputRef.current?.click()} className="p-3 text-zinc-500 hover:text-zinc-100 transition-colors">
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={message}
                onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
                onKeyPress={(e) => handleKeyPress(e, handleSendMessage)}
                placeholder={privateMessageUser ? `Whisper to ${privateMessageUser.username}...` : "Type a message..."}
                className="flex-1 bg-transparent border-none text-zinc-100 focus:ring-0 placeholder:text-zinc-700 text-sm font-medium"
              />
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() && !selectedFile}
                className="bg-zinc-100 text-black p-3.5 rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-10 shadow-lg"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
