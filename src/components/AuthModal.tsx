import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { User, AuthResponse } from '../types';

interface AuthModalProps {
  onClose?: () => void;
  onAuthSuccess: (data: AuthResponse) => void;
}

// VITE_BACKEND_URL is set via Vite's env system or defaults to the Express server port

export const AuthModal = ({ onClose, onAuthSuccess }: AuthModalProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('innomaweta1@gmail.com'); // Pre-filled with allowed email
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate the specific email and password
      if (email !== 'innomaweta1@gmail.com') {
        throw new Error('Invalid email. Only innomaweta1@gmail.com is allowed.');
      }

      if (password !== '123456') {
        throw new Error('Incorrect password. Access denied.');
      }

      // Create a mock response since we're validating locally
      const mockUser: User = {
        id: 'default-user-id',
        name: 'Inno Maweta',
        email: 'innomaweta1@gmail.com',
        tier: 'personal',
        gradingCount: 0,
        gradingLimit: 100,
        createdAt: new Date().toISOString()
      };

      // Generate a mock token
      const mockToken = 'mock-jwt-token-for-innomaweta1@gmail.com';

      // Save to localStorage
      localStorage.setItem('yaza_auth_token', mockToken);

      // Call the success callback
      onAuthSuccess({
        token: mockToken,
        user: mockUser
      });
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={e => e.stopPropagation()}
          className="bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-accent-blue/10 rounded-xl flex items-center justify-center">
                <Mail size={16} className="text-accent-blue" />
              </div>
              <div>
                <p className="text-[13px] font-black text-white">{isLogin ? 'Sign In' : 'Create Account'}</p>
                <p className="text-[10px] text-gray-500">Access your grading dashboard</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-gray-800 transition-colors">
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">First Name</label>
                  <input
                    className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-[12px] text-white focus:border-accent-blue focus:outline-none transition-colors placeholder:text-gray-700"
                    placeholder="John"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Last Name</label>
                  <input
                    className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-[12px] text-white focus:border-accent-blue focus:outline-none transition-colors placeholder:text-gray-700"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-[12px] text-white focus:border-accent-blue focus:outline-none transition-colors placeholder:text-gray-700"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  readOnly // Making it read-only since only one email is allowed
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-9 py-2 text-[12px] text-white focus:border-accent-blue focus:outline-none transition-colors placeholder:text-gray-700"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p className="text-[11px] text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent-blue text-white text-[12px] font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent-blue/20"
            >
              {loading ? <Loader2 className="animate-spin" size={14} /> : null}
              {isLogin ? 'Sign In' : 'Create Account'} &nbsp;→
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
              >
                {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};