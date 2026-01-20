
import React, { useState, useEffect } from 'react';
import { Plus, Lock, Users, Trash2, LogOut, Search, Hash, Globe, Key, Sparkles, ArrowRight } from 'lucide-react';
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

function RoomCard({ room, onSelect }) {
  return (
    <button 
      onClick={() => room.isMember && onSelect(room)}
      className={`w-full group flex items-center justify-between p-3 rounded-xl transition-all mb-1 ${
        !room.isMember 
          ? 'opacity-30 grayscale cursor-not-allowed' 
          : 'hover:bg-zinc-900 border border-transparent hover:border-zinc-800'
      }`}
    >
      <div className="flex items-center gap-3 overflow-hidden text-left">
        {/* Simple Icon Box */}
        <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center flex-shrink-0 group-hover:bg-zinc-800 transition-colors">
          {room.type === 'private' ? (
            <Lock className="w-3.5 h-3.5 text-orange-500/50 group-hover:text-orange-500" />
          ) : (
            <Hash className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-200" />
          )}
        </div>

        {/* Room Info */}
        <div className="overflow-hidden">
          <p className="text-xs font-bold text-zinc-400 group-hover:text-zinc-100 truncate transition-colors">
            {room.name}
          </p>
          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-tight">
            {room.memberCount} members
          </p>
        </div>
      </div>
      
      {/* Show lock icon if not a member */}
      {!room.isMember && <Lock className="w-3 h-3 text-zinc-800" />}
    </button>
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
        // Use the cleaned dataToSend object
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-zinc-100 mb-6">Join Room</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-900/30 rounded-xl text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-zinc-500 mb-2 uppercase tracking-widest">
              Room ID
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="room_12345_abc"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 text-sm font-mono"
            />
          </div>

          {requiresPassword && (
            <div>
              <label className="block text-xs font-black text-zinc-500 mb-2 uppercase tracking-widest">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter room password"
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 text-sm font-medium"
              />
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-zinc-800 text-zinc-100 rounded-xl hover:bg-zinc-700 font-bold text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleJoin}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-zinc-100 text-black rounded-xl hover:bg-zinc-200 disabled:opacity-50 font-bold text-sm"
          >
            {loading ? 'Joining...' : 'Join'}
          </button>
        </div>
      </div>
    </div>
  );
}
