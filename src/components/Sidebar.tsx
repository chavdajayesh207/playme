/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NavigationTab } from '../types';
import { useAudioPlayer } from './AudioPlayerContext';
import { Home, Compass, Music, Radio, Disc, FolderHeart, LogOut, LogIn } from 'lucide-react';
import { useAuth } from './AuthContext';

interface SidebarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  onAuthClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onAuthClick }) => {
  const { isPlaying } = useAudioPlayer();
  const { user, logout } = useAuth();

  const menuItems = [
    { tab: NavigationTab.HOME, label: 'Home', icon: Home },
    { tab: NavigationTab.DISCOVER, label: 'Discover', icon: Compass },
    { tab: NavigationTab.LIVE_STAGE, label: 'Live Stage', icon: Radio },
    { tab: NavigationTab.LIBRARY, label: 'My Studio', icon: Music },
    { tab: NavigationTab.PLAYER, label: 'Now Playing', icon: Disc, pulse: isPlaying },
    { tab: NavigationTab.COLLECTIONS, label: 'Favorites', icon: FolderHeart },
  ];

  return (
    <aside
      id="sidebar-navigation"
      className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 border-r border-white/5 bg-[#0e0e0f]/90 backdrop-blur-2xl py-6 px-4 z-40 transition-all duration-300"
    >
      {/* Brand logo */}
      <div 
        className="mb-8 px-4 cursor-pointer" 
        onClick={() => setActiveTab(NavigationTab.WELCOME)}
        id="side-logo-btn"
      >
        <h1 className="font-headline-lg text-4xl font-bold text-[#e1fdff] tracking-tighter hover:text-[#00f2ff] transition-colors relative flex items-center gap-1">
          Playme<span className="text-[#ff5ec3] animate-pulse">.</span>
        </h1>
        <p className="font-label-mono text-[9px] text-[#b9cacb] mt-1 tracking-widest uppercase">
          Lumina Sonic
        </p>
      </div>

      {/* Nav Menu */}
      <nav className="flex flex-col gap-2 flex-grow">
        <p className="font-label-mono text-[10px] text-white/30 uppercase tracking-widest px-4 mb-2">
          Menu
        </p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              id={`nav-tab-${item.tab}`}
              onClick={() => setActiveTab(item.tab)}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-[#00f2ff] bg-[#00f2ff]/10 border-r-4 border-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.05)]'
                  : 'text-[#b9cacb] hover:text-[#e5e2e3] hover:bg-white/5'
              }`}
            >
              <Icon 
                size={20} 
                className={`${isActive ? 'text-[#00f2ff]' : 'text-[#b9cacb]'} ${item.pulse ? 'animate-spin' : ''}`}
                style={item.pulse ? { animationDuration: '6s' } : undefined}
              />
              <span>{item.label}</span>
              {item.pulse && (
                <span className="ml-auto w-2 h-2 rounded-full bg-[#00f2ff] animate-ping" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Account Bar */}
      <div className="mt-auto pt-4 border-t border-white/15">
        {user ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all font-sans">
            <div 
              className="flex items-center gap-2.5 truncate cursor-pointer flex-1"
              onClick={() => setActiveTab(NavigationTab.COLLECTIONS)}
            >
              <div id="sidebar-user-avatar" className="w-9 h-9 rounded-full border border-[#00f2ff]/30 overflow-hidden shrink-0 flex items-center justify-center bg-[#00f2ff]/10">
                {user.photoURL ? (
                  <img
                    alt="User Avatar"
                    className="w-full h-full object-cover"
                    src={user.photoURL}
                  />
                ) : (
                  <span className="text-[11px] font-bold text-[#00f2ff] uppercase">
                    {user.displayName ? user.displayName.slice(0, 2) : 'PL'}
                  </span>
                )}
              </div>
              <div className="truncate flex-1">
                <p className="text-xs font-semibold text-[#e5e2e3] truncate" title={user.displayName}>
                  {user.displayName}
                </p>
                <p className="font-label-mono text-[8px] text-[#00f2ff] tracking-wide uppercase">
                  Level 2. Listener
                </p>
              </div>
            </div>
            <button
              id="sidebar-logout-btn"
              onClick={() => logout()}
              title="Disconnect Session"
              className="p-1.5 hover:bg-red-500/10 text-[#b9cacb] hover:text-red-400 rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button 
            id="sidebar-login-trigger"
            onClick={onAuthClick}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-white/10 hover:border-[#00f2ff]/30 hover:bg-white/5 text-white font-semibold text-xs transition-all cursor-pointer font-sans"
          >
            <LogIn size={13} className="text-[#00f2ff]" />
            <span>Sign In / Join</span>
          </button>
        )}
      </div>
    </aside>
  );
};
