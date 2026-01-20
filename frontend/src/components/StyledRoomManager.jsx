import React, { useState, useEffect } from 'react';
import { Plus, Lock, Users, Trash2, LogOut, Search, Hash, Globe, Key, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function StyledRoomManager({ onRoomSelect }) {
  const { token, user, logout } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'https://vibe-ob16.onrender.com';

  useEffect(() => {
    fetchRooms();
  }, [filter]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/rooms?type=${filter}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms);
      }
    } catch (error) {
      console.error('Fetch rooms error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen bg-[#09090b] flex overflow-hidden font-sans text-zinc-300">
      {/* Sidebar */}
      <div className="w-80 bg-zinc-950/50 border-r border-zinc-800 flex flex-col backdrop-blur-3xl">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-black" />
            </div>
            <h2 className="text-2xl font-bold tracking-tighter text-zinc-100">vibe.</h2>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-100 font-bold border border-zinc-700">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-100 leading-none">{user.username}</p>
              <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-bold">Online</p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-zinc-100 text-black py-3 rounded-xl hover:bg-zinc-200 transition-all shadow-lg font-bold text-sm"
            >
              <Plus className="w-5 h-5" />
              Create Room
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 text-zinc-100 py-3 rounded-xl hover:bg-zinc-800 transition-all font-bold text-sm"
            >
              <Key className="w-5 h-5" />
              Join by ID
            </button>
          </div>
        </div>

        <div className="px-6 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-zinc-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rooms..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 text-sm font-medium"
            />
          </div>
        </div>

        <div className="px-6 mb-4">
          <div className="flex gap-2 flex-wrap">
            {['all', 'joined', 'created', 'public'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition ${
                  filter === f
                    ? 'bg-zinc-100 text-black'
                    : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-4 border-zinc-700 border-t-zinc-100 rounded-full animate-spin"></div>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-8">
              <Hash className="w-12 h-12 text-zinc-800 mx-auto mb-2" />
              <p className="text-sm text-zinc-600 font-medium">No rooms found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRooms.map((room) => (
                <RoomCard 
                  key={room.roomId} 
                  room={room} 
                  onSelect={onRoomSelect}
                  onDelete={fetchRooms}
                  onLeave={fetchRooms}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-zinc-800">
          <button 
            onClick={logout} 
            className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-zinc-400 py-3 rounded-xl hover:bg-zinc-100 hover:text-black transition-all border border-zinc-800 mb-6"
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

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center bg-[#09090b] relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-[#09090b] to-zinc-950 opacity-50"></div>
        
        <div className="text-center relative z-10">
          <div className="w-24 h-24 bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-zinc-800">
            <Hash className="w-12 h-12 text-zinc-700" />
          </div>
          <h2 className="text-3xl font-bold text-zinc-100 mb-3 tracking-tight">Select a Room</h2>
          <p className="text-zinc-500 text-sm font-medium">Choose a room from the sidebar to start vibing</p>
        </div>
      </div>

      {showCreateModal && (
        <CreateRoomModal 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={() => {
            setShowCreateModal(false);
            fetchRooms();
          }}
        />
      )}

      {showJoinModal && (
        <JoinRoomModal 
          onClose={() => setShowJoinModal(false)} 
          onSuccess={() => {
            setShowJoinModal(false);
            fetchRooms();
          }}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Plus, Lock, Users, Trash2, LogOut, Search, Hash, Globe, Key, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function StyledRoomManager({ onRoomSelect }) {
  const { token, user, logout } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'https://vibe-ob16.onrender.com';

  useEffect(() => {
    fetchRooms();
  }, [filter]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/rooms?type=${filter}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms);
      }
    } catch (error) {
      console.error('Fetch rooms error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen bg-[#09090b] flex overflow-hidden font-sans text-zinc-300">
      
      {/* 1. SIDEBAR: Controls & Profile */}
      <div className="w-72 bg-zinc-950/50 border-r border-zinc-800 flex flex-col backdrop-blur-3xl">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-black" />
            </div>
            <h2 className="text-2xl font-black tracking-tighter text-zinc-100 italic uppercase">vibe.</h2>
          </div>

          <div className="space-y-3 mb-10">
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-zinc-100 text-black rounded-2xl hover:bg-white transition-all shadow-xl font-black text-[10px] uppercase tracking-[0.2em]"
            >
              <span>Create Room</span>
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl hover:bg-zinc-800 transition-all font-black text-[10px] uppercase tracking-[0.2em]"
            >
              <span>Join by ID</span>
              <Key className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4 px-2">Filters</p>
              <div className="flex flex-col gap-1">
                {['all', 'joined', 'created', 'public'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-left transition-all ${
                      filter === f ? 'bg-zinc-900 text-zinc-100 border border-zinc-800' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {f} Rooms
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* User Footer */}
        <div className="mt-auto p-6 border-t border-zinc-800/50">
           <div className="bg-zinc-900/40 p-4 rounded-3xl border border-zinc-800/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-100 font-bold border border-zinc-700">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-zinc-100 truncate">{user.username}</p>
                  <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Connected</p>
                </div>
              </div>
              <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-2.5 text-zinc-500 hover:text-red-400 transition-colors text-[10px] font-black uppercase tracking-widest border-t border-zinc-800/30 pt-4">
                <LogOut className="w-3 h-3" /> Disconnect
              </button>
           </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT: The Discovery Dashboard */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-[#09090b]">
        {/* Subtle Background Glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-100/5 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-zinc-100/5 blur-[100px] rounded-full"></div>

        {/* Header with Search */}
        <div className="p-10 border-b border-zinc-800/50 flex flex-col md:flex-row md:items-center justify-between z-10 gap-6">
          <div>
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Frequencies</h2>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-1">Status: {loading ? 'Scanning...' : `${rooms.length} Channels Found`}</p>
          </div>
          
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-zinc-300 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH FREQUENCY..."
              className="w-full pl-12 pr-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 text-[10px] font-black tracking-[0.2em] transition-all"
            />
          </div>
        </div>

        {/* The Grid Container */}
        <div className="flex-1 overflow-y-auto p-10 relative z-10 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-12 h-12 border-4 border-zinc-800 border-t-white rounded-full animate-spin"></div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Initializing Protocol...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-30">
              <Hash className="w-20 h-20 text-zinc-800 mb-6" />
              <p className="text-2xl font-black text-zinc-100 uppercase italic tracking-tighter">Zero Transmissions Detected</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredRooms.map((room) => (
                <RoomCard 
                  key={room.roomId} 
                  room={room} 
                  onSelect={onRoomSelect} 
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateRoomModal onClose={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); fetchRooms(); }} />
      )}
      {showJoinModal && (
        <JoinRoomModal onClose={() => setShowJoinModal(false)} onSuccess={() => { setShowJoinModal(false); fetchRooms(); }} />
      )}
    </div>
  );
}

//  MODERN GRID CARD
function RoomCard({ room, onSelect }) {
  return (
    <div 
      onClick={() => room.isMember && onSelect(room)}
      className={`relative group bg-zinc-900/20 border border-zinc-800/50 p-8 rounded-[2.5rem] transition-all duration-500 hover:bg-zinc-900 hover:border-zinc-700 hover:translate-y-[-8px] cursor-pointer overflow-hidden ${
        !room.isMember ? 'opacity-40 grayscale' : ''
      }`}
    >
      {/* Visual Accents */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-zinc-100/5 blur-[60px] rounded-full group-hover:bg-zinc-100/10 transition-colors"></div>

      <div className="flex items-start justify-between mb-8 relative z-10">
        <div className="w-14 h-14 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center group-hover:bg-zinc-100 transition-all duration-500 shadow-2xl">
          {room.type === 'private' ? (
            <Lock className="w-6 h-6 text-orange-500/50 group-hover:text-black transition-colors" />
          ) : (
            <Hash className="w-6 h-6 text-zinc-600 group-hover:text-black transition-colors" />
          )}
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950/50 border border-zinc-800/50 rounded-full">
           <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
           <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Live</span>
        </div>
      </div>

      <div className="space-y-2 mb-10 relative z-10">
        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter truncate group-hover:text-zinc-100">
          {room.name}
        </h3>
        <p className="text-zinc-500 text-xs font-medium line-clamp-2 min-h-[32px] leading-relaxed">
          {room.description || "No transmission log provided for this channel."}
        </p>
      </div>

      <div className="pt-6 border-t border-zinc-800/50 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-6 h-6 rounded-lg border-2 border-[#09090b] bg-zinc-800 flex items-center justify-center text-[8px] font-bold text-zinc-600">
                {i}
              </div>
            ))}
          </div>
          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{room.memberCount} PULSING</span>
        </div>
        
        <div className="flex items-center gap-2">
           <span className="text-[9px] font-black text-zinc-100 uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">Enter</span>
           <div className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-100 transition-all duration-300">
              <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-black" />
           </div>
        </div>
      </div>
    </div>
  );
}



function CreateRoomModal({ onClose, onSuccess }) {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'public',
    password: '',
    maxMembers: 50
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'https://vibe-ob16.onrender.com';

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Room name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create a copy of the data and remove password if it's empty or just whitespace
      const dataToSend = { ...formData };
      if (!dataToSend.password || dataToSend.password.trim() === "") {
        delete dataToSend.password;
      }

      const response = await fetch(`${API_URL}/api/rooms/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        // Correctly handle validation errors or generic errors from the backend
        const errorMessage = data.errors ? data.errors[0].msg : (data.error || 'Failed to create room');
        setError(errorMessage);
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-zinc-100 mb-6">Create New Room</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-900/30 rounded-xl text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-zinc-500 mb-2 uppercase tracking-widest">
              Room Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Awesome Room"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 text-sm font-medium"
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-zinc-500 mb-2 uppercase tracking-widest">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What's this room about?"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none text-sm font-medium"
              rows={3}
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-zinc-500 mb-2 uppercase tracking-widest">
              Room Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 focus:outline-none focus:border-zinc-600 text-sm font-medium"
            >
              <option value="public">Public - Anyone can find and join</option>
              <option value="private">Private - Requires room ID to join</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-zinc-500 mb-2 uppercase tracking-widest">
              Password (Optional)
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Leave empty for no password"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-zinc-500 mb-2 uppercase tracking-widest">
              Max Members
            </label>
            <input
              type="number"
              value={formData.maxMembers}
              onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) })}
              min={2}
              max={500}
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 focus:outline-none focus:border-zinc-600 text-sm font-medium"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-zinc-800 text-zinc-100 rounded-xl hover:bg-zinc-700 font-bold text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-zinc-100 text-black rounded-xl hover:bg-zinc-200 disabled:opacity-50 font-bold text-sm"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

function JoinRoomModal({ onClose, onSuccess }) {
  const { token } = useAuth();
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requiresPassword, setRequiresPassword] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'https://vibe-ob16.onrender.com';

  const handleJoin = async () => {
    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/rooms/join/${roomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: password || undefined })
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to join room');
        if (data.requiresPassword) {
          setRequiresPassword(true);
        }
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div className="bg-zinc-950/90 border border-zinc-800/50 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl relative overflow-hidden">
        {/* Decorative Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-zinc-100/5 blur-[80px] rounded-full"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
              <Key className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-100 tracking-tighter uppercase italic">Join Room</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Enter frequency ID</p>
            </div>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 animate-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-[10px] uppercase tracking-widest font-black">{error}</span>
            </div>
          )}

          <div className="space-y-6">
            <div className="group">
              <label className="block text-[10px] font-black text-zinc-600 mb-3 uppercase tracking-[0.2em] group-focus-within:text-zinc-400 transition-colors">
                Access Code (Room ID)
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="room_xxxx_xxxx"
                className="w-full px-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 transition-all text-xs font-mono tracking-wider uppercase"
              />
            </div>

            {requiresPassword && (
              <div className="group animate-in slide-in-from-bottom-2">
                <label className="block text-[10px] font-black text-zinc-600 mb-3 uppercase tracking-[0.2em] group-focus-within:text-zinc-400 transition-colors">
                  Security Key (Password)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 transition-all text-xs tracking-widest"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-10">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-zinc-900 text-zinc-500 rounded-2xl hover:bg-zinc-800 hover:text-zinc-100 transition-all font-black text-[10px] uppercase tracking-widest border border-zinc-800/50"
            >
              Cancel
            </button>
            <button
              onClick={handleJoin}
              disabled={loading}
              className="flex-1 px-6 py-4 bg-zinc-100 text-black rounded-2xl hover:bg-white disabled:opacity-50 transition-all font-black text-[10px] uppercase tracking-widest shadow-xl shadow-white/5 flex items-center justify-center gap-2 group"
            >
              {loading ? 'Validating...' : (
                <>
                  Connect <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
