import React, { useState } from 'react';
import { Sparkles, Mail, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-6 font-sans">
      {/* Background Aesthetic */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-zinc-500/5 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-zinc-500/5 rounded-full blur-[120px]"></div>

      <div className="relative w-full max-w-[420px] backdrop-blur-3xl bg-zinc-900/40 border border-zinc-800 p-10 rounded-[2.5rem] shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center shadow-2xl shadow-zinc-500/10 mb-6">
            <Sparkles className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-4xl font-black text-zinc-100 tracking-tighter mb-1">vibe.</h1>
          <p className="text-zinc-500 font-medium text-sm">
            {isLogin ? 'Welcome back to the space.' : 'Join the unfiltered connection.'}
          </p>
        </div>

        {apiError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-[10px] uppercase tracking-widest font-black">{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="Username"
                className="w-full bg-zinc-950/50 border border-zinc-800 pl-12 pr-6 py-4 rounded-2xl text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition-all text-sm"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              className="w-full bg-zinc-950/50 border border-zinc-800 pl-12 pr-6 py-4 rounded-2xl text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition-all text-sm"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full bg-zinc-950/50 border border-zinc-800 pl-12 pr-12 py-4 rounded-2xl text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition-all text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-100"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {!isLogin && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
                className="w-full bg-zinc-950/50 border border-zinc-800 pl-12 pr-6 py-4 rounded-2xl text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition-all text-sm"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-100 text-black py-4 rounded-2xl font-bold text-sm hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-zinc-800 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-zinc-500 hover:text-zinc-100 text-xs font-bold transition-colors uppercase tracking-widest"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
