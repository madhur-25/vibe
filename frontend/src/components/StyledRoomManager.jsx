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
      {/* 1. SIDEBAR: Navigation & Profile */}
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
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4 px-2">Discovery</p>
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

        <div className="mt-auto p-6 border-t border-zinc-800/50">
           <div className="bg-zinc-900/40 p-4 rounded-3xl border border-zinc-800/50 text-center">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-100 font-bold border border-zinc-700 uppercase">
                  {user?.username?.charAt(0)}
                </div>
                <div className="overflow-hidden text-left">
                  <p className="text-xs font-bold text-zinc-100 truncate">{user?.username}</p>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Connected</span>
                  </div>
                </div>
              </div>
              <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-2.5 text-zinc-500 hover:text-red-400 transition-colors text-[10px] font-black uppercase tracking-widest border-t border-zinc-800/30 pt-4">
                <LogOut className="w-3 h-3" /> Disconnect
              </button>
           </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT: The Grid Dashboard */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-[#09090b]">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-100/5 blur-[120px] rounded-full animate-pulse z-0"></div>

        <div className="p-10 border-b border-zinc-800/50 flex flex-col md:flex-row md:items-center justify-between z-10 gap-6 bg-[#09090b]/80 backdrop-blur-md">
          <div>
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Discovery</h2>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-2">
              {loading ? 'Scanning...' : `${filteredRooms.length} Active Channels`}
            </p>
          </div>
          
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-zinc-300 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH FREQUENCY..."
              className="w-full pl-12 pr-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 text-[10px] font-black tracking-[0.2em]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 relative z-10 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-12 h-12 border-4 border-zinc-800 border-t-white rounded-full animate-spin"></div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Syncing Protocals...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-20">
              <Hash className="w-20 h-20 text-zinc-800 mb-6" />
              <p className="text-2xl font-black text-zinc-100 uppercase italic tracking-tighter">No transmissions</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-10">
              {filteredRooms.map((room) => (
                <RoomCard key={room.roomId} room={room} onSelect={onRoomSelect} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateRoomModal onClose={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); fetchRooms(); }} />
      )}
      {showJoinModal && (
        <JoinRoomModal onClose={() => setShowJoinModal(false)} onSuccess={() => { setShowJoinModal(false); fetchRooms(); }} />
      )}
    </div>
  );
}

// 🚀 UPDATED ROOM CARD (Grid Style)
function RoomCard({ room, onSelect }) {
  return (
    <div 
      onClick={() => room.isMember && onSelect(room)}
      className={`relative group bg-zinc-900/20 border border-zinc-800/50 p-8 rounded-[2.5rem] transition-all duration-500 hover:bg-zinc-900 hover:border-zinc-700 hover:translate-y-[-8px] cursor-pointer overflow-hidden ${
        !room.isMember ? 'opacity-40 grayscale' : ''
      }`}
    >
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
           <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
           <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Active</span>
        </div>
      </div>

      <div className="space-y-2 mb-10 relative z-10 text-left">
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
                {room.name.charAt(0)}
              </div>
            ))}
          </div>
          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{room.memberCount} PULSING</span>
        </div>
        <div className="flex items-center gap-2 group/btn">
           <span className="text-[9px] font-black text-zinc-100 uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 text-right">Enter</span>
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
  const [formData, setFormData] = useState({ name: '', description: '', type: 'public', password: '', maxMembers: 50 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || 'https://vibe-ob16.onrender.com';

  const handleSubmit = async () => {
    if (!formData.name.trim()) { setError('Room name is required'); return; }
    setLoading(true); setError('');
    try {
      const dataToSend = { ...formData };
      if (!dataToSend.password || dataToSend.password.trim() === "") delete dataToSend.password;
      const response = await fetch(`${API_URL}/api/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(dataToSend)
      });
      const data = await response.json();
      if (response.ok) onSuccess();
      else setError(data.errors ? data.errors[0].msg : (data.error || 'Failed to create room'));
    } catch (error) { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-zinc-950 border border-zinc-800/50 rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl relative overflow-hidden">
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/5 blur-[80px] rounded-full"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center shadow-xl"><Plus className="w-6 h-6 text-black" /></div>
            <div>
              <h2 className="text-2xl font-black text-zinc-100 tracking-tighter uppercase italic leading-none">Create Room</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1 text-left">New Frequency</p>
            </div>
          </div>
          {error && <div className="mb-6 p-4 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-500 text-[10px] uppercase font-black">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="group text-left">
                <label className="block text-[10px] font-black text-zinc-600 mb-2 uppercase tracking-[0.2em]">Identity</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="LOBBY" className="w-full px-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-zinc-100 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-zinc-600" />
              </div>
              <div className="group text-left">
                <label className="block text-[10px] font-black text-zinc-600 mb-2 uppercase tracking-[0.2em]">Protocol</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-zinc-100 text-[10px] font-black uppercase tracking-widest focus:outline-none appearance-none">
                  <option value="public">PUBLIC</option><option value="private">PRIVATE</option>
                </select>
              </div>
            </div>
            <div className="group text-left">
              <label className="block text-[10px] font-black text-zinc-600 mb-2 uppercase tracking-[0.2em]">Transmission</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="..." className="w-full px-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-zinc-100 text-xs font-medium h-[132px] resize-none focus:outline-none focus:border-zinc-600" />
            </div>
          </div>
          <div className="flex gap-3 mt-10">
            <button onClick={onClose} className="flex-1 px-6 py-4 bg-zinc-900 text-zinc-500 rounded-2xl text-[10px] font-black uppercase hover:text-white transition-colors">Cancel</button>
            <button onClick={handleSubmit} disabled={loading} className="flex-1 px-6 py-4 bg-zinc-100 text-black rounded-2xl text-[10px] font-black uppercase shadow-xl hover:bg-white transition-all">Confirm</button>
          </div>
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
    if (!roomId.trim()) { setError('Enter ID'); return; }
    setLoading(true); setError('');
    try {
      const response = await fetch(`${API_URL}/api/rooms/join/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ password: password || undefined })
      });
      const data = await response.json();
      if (response.ok) onSuccess();
      else { setError(data.error); if (data.requiresPassword) setRequiresPassword(true); }
    } catch (error) { setError('Network error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-zinc-950 border border-zinc-800/50 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 blur-[80px] rounded-full"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center shadow-xl"><Key className="w-6 h-6 text-black" /></div>
            <div>
              <h2 className="text-2xl font-black text-zinc-100 tracking-tighter uppercase italic leading-none text-left">Join</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1 text-left">Connect ID</p>
            </div>
          </div>
          {error && <div className="mb-6 p-4 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-500 text-[10px] uppercase font-black">{error}</div>}
          <div className="space-y-6 text-left">
            <div className="group">
              <label className="block text-[10px] font-black text-zinc-600 mb-2 uppercase tracking-[0.2em]">Frequency ID</label>
              <input type="text" value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="ROOM_ID" className="w-full px-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-zinc-100 font-mono text-xs focus:outline-none focus:border-zinc-600" />
            </div>
            {requiresPassword && (
              <div className="group"><label className="block text-[10px] font-black text-zinc-600 mb-2 uppercase tracking-[0.2em]">Key</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••" className="w-full px-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-zinc-100 text-xs tracking-widest focus:outline-none focus:border-zinc-600" /></div>
            )}
          </div>
          <div className="flex gap-3 mt-10">
            <button onClick={onClose} className="flex-1 px-6 py-4 bg-zinc-900 text-zinc-500 rounded-2xl text-[10px] font-black uppercase hover:text-white transition-colors">Cancel</button>
            <button onClick={handleJoin} disabled={loading} className="flex-1 px-6 py-4 bg-zinc-100 text-black rounded-2xl text-[10px] font-black uppercase shadow-xl hover:bg-white transition-all flex items-center justify-center gap-2">Connect <ArrowRight className="w-3 h-3" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
