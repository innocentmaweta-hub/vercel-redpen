import React from 'react';
import { X, User as UserIcon, Star, Zap, Crown, Shield, BarChart3, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';

interface Props {
    user: User;
    onClose: () => void;
    onLogout: () => void;
    onUpgrade: () => void;
}

const TIER_CONFIG: Record<string, { icon: any; color: string; label: string; price: string }> = {
    free: { icon: Star, color: 'text-gray-400', label: 'Free', price: 'Free' },
    personal: { icon: Zap, color: 'text-yellow-400', label: 'Personal', price: '5,000 MWK/mo' },
    corporate: { icon: Crown, color: 'text-amber-400', label: 'Corporate', price: '25,000 MWK/mo' },
};

export const ProfileModal = ({ user, onClose, onLogout, onUpgrade }: Props) => {
    const tierConfig = TIER_CONFIG[user.tier] || TIER_CONFIG.free;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border border-gray-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-4 bg-accent-blue rounded-full" />
                        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-300">Profile</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* User Avatar & Name */}
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-accent-blue/10 border border-accent-blue/20 rounded-2xl flex items-center justify-center">
                            <UserIcon size={28} className="text-accent-blue" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">{user.name}</p>
                            <p className="text-[11px] text-gray-500">{user.email}</p>
                            <div className={`flex items-center gap-1 mt-1.5 ${tierConfig.color}`}>
                                <tierConfig.icon size={12} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">{tierConfig.label} Plan</span>
                            </div>
                        </div>
                    </div>

                    {/* Grading Usage */}
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BarChart3 size={14} className="text-gray-500" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Grading Usage</span>
                            </div>
                            <span className="text-[11px] font-bold text-gray-300">
                                {user.gradingCount} / {user.gradingLimit === Infinity ? '∞' : user.gradingLimit}
                            </span>
                        </div>
                        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${user.gradingLimit === Infinity ? 0 : Math.min(100, (user.gradingCount / user.gradingLimit) * 100)}%` }}
                                className={`h-full rounded-full ${user.gradingLimit === Infinity ? 'w-0' : user.gradingCount / user.gradingLimit >= 0.9 ? 'bg-red-500' : user.gradingCount / user.gradingLimit >= 0.7 ? 'bg-yellow-500' : 'bg-accent-blue'}`}
                            />
                        </div>
                        {user.tier === 'free' && (
                            <p className="text-[10px] text-gray-600">
                                Free tier uses your own API key. Set it in Settings.
                            </p>
                        )}
                    </div>

                    {/* Plan Details */}
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Subscription</p>

                        <div className="grid grid-cols-3 gap-2">
                            {['free', 'personal', 'corporate'].map((tier) => {
                                const cfg = TIER_CONFIG[tier];
                                const isCurrent = user.tier === tier;
                                const Icon = cfg.icon;
                                return (
                                    <div
                                        key={tier}
                                        className={`rounded-xl p-3 border text-center ${isCurrent
                                            ? 'border-accent-blue bg-accent-blue/5'
                                            : 'border-gray-800 bg-gray-900/30 opacity-60'
                                            }`}
                                    >
                                        <Icon size={16} className={`mx-auto ${cfg.color}`} />
                                        <p className={`text-[10px] font-bold mt-1 ${cfg.color}`}>{cfg.label}</p>
                                        <p className="text-[9px] text-gray-600 mt-0.5">{cfg.price}</p>
                                        {isCurrent && (
                                            <span className="text-[8px] text-accent-blue font-bold uppercase tracking-wider">Current</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Account Created */}
                    <p className="text-[9px] text-gray-700 text-center">
                        Member since {new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2.5 pt-2">
                        {user.tier !== 'corporate' && (
                            <button
                                onClick={onUpgrade}
                                className="flex-1 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-white text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-yellow-600/20"
                            >
                                <Crown size={12} />
                                {user.tier === 'free' ? 'Upgrade to Personal' : 'Upgrade to Corporate'}
                            </button>
                        )}
                        <button
                            onClick={onLogout}
                            className="flex-1 py-2.5 bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                        >
                            <LogOut size={12} />
                            Logout
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};