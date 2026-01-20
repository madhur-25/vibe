import React, { useState } from 'react';
import { Sparkles, Mail, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, Github } from 'lucide-react';

export default function LoginSignup({ onLogin, onSignup }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    setApiError('');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!isLogin && !formData.username.trim()) {
      newErrors.username = 'Username required';
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Valid email required';
    }
    if (formData.password.length < 6) {
      newErrors.password = 'Min 6 characters';
    }
    if (!isLogin && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setApiError('');
    try {
      const result = isLogin 
        ? await onLogin(formData.email, formData.password)
        : await onSignup(formData.username, formData.email, formData.password);
      
      if (!result.success) setApiError(result.error);
    } catch (error) {
      setApiError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#09090b] overflow-hidden font-sans selection:bg-zinc-100 selection:text-black">
      
      {/* LEFT SIDE: The Form Area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 z-10 relative">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-zinc-500/10 blur-[120px] rounded-full animate-pulse"></div>
        
        <div className="relative w-full max-w-[420px]">
          <div className="flex flex-col items-center mb-10">
            <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center shadow-2xl mb-6 rotate-3 hover:rotate-0 transition-transform duration-500">
              <Sparkles className="w-7 h-7 text-black" />
            </div>
            <h1 className="text-4xl font-black text-zinc-100 tracking-tighter mb-1 uppercase italic">vibe.</h1>
            <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.4em]">
              {isLogin ? 'Establish Connection' : 'Register Frequency'}
            </p>
          </div>

          {apiError && (
            <div className="mb-6 p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-[10px] uppercase tracking-widest font-black">{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-zinc-300 transition-colors" />
                <input
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="USERNAME"
                  className="w-full bg-zinc-900/30 border border-zinc-800/50 pl-12 pr-6 py-4 rounded-2xl text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 transition-all text-xs font-bold tracking-widest"
                />
              </div>
            )}

            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-zinc-300 transition-colors" />
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="EMAIL ADDRESS"
                className="w-full bg-zinc-900/30 border border-zinc-800/50 pl-12 pr-6 py-4 rounded-2xl text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 transition-all text-xs font-bold tracking-widest"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-zinc-300 transition-colors" />
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="PASSWORD"
                className="w-full bg-zinc-900/30 border border-zinc-800/50 pl-12 pr-12 py-4 rounded-2xl text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 transition-all text-xs font-bold tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-100 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {!isLogin && (
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="CONFIRM PASSWORD"
                  className="w-full bg-zinc-900/30 border border-zinc-800/50 pl-12 pr-6 py-4 rounded-2xl text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 transition-all text-xs font-bold tracking-widest"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-100 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-white/5 mt-4 group"
            >
              {loading ? 'Processing...' : (isLogin ? 'Connect' : 'Initialize')}
              {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-zinc-800/50 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-zinc-500 hover:text-zinc-100 text-[10px] font-black transition-colors uppercase tracking-[0.2em]"
            >
              {isLogin ? "Request Access // Sign Up" : "Authorized User // Sign In"}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: The Visual Experience (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative border-l border-zinc-800/30">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1000" 
            className="w-full h-full object-cover opacity-20 grayscale transition-all duration-1000 hover:grayscale-0 hover:opacity-40"
            alt="Abstract Vibe"
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-transparent to-transparent"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-end p-20 w-full h-full space-y-4">
          <div className="space-y-1">
            <h2 className="text-8xl font-black text-white/5 uppercase italic leading-none tracking-tighter">Connect.</h2>
            <h2 className="text-8xl font-black text-white/5 uppercase italic leading-none tracking-tighter">Share.</h2>
            <h2 className="text-8xl font-black text-white/5 uppercase italic leading-none tracking-tighter">Vibe.</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-1 bg-zinc-800 rounded-full opacity-20"></div>
            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.5em]">Realtime Social Protocol</p>
          </div>
        </div>
      </div>

    </div>
  );
}
