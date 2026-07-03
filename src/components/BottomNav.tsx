/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NavigationTab } from '../types';
import { Home, Compass, Radio, Disc, FolderHeart, Music } from 'lucide-react';

interface BottomNavProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { tab: NavigationTab.HOME, label: 'Home', icon: Home },
    { tab: NavigationTab.DISCOVER, label: 'Explore', icon: Compass },
    { tab: NavigationTab.LIVE_STAGE, label: 'Live Stage', icon: Radio },
    { tab: NavigationTab.LIBRARY, label: 'Studio', icon: Music },
    { tab: NavigationTab.PLAYER, label: 'Player', icon: Disc },
    { tab: NavigationTab.COLLECTIONS, label: 'Favorites', icon: FolderHeart },
  ];

  return (
    <nav
      id="bottom-navigation"
      className="md:hidden fixed bottom-0 left-0 w-full z-40 border-t border-white/10 shadow-[0_-10px_35px_rgba(0,0,0,0.6)] bg-[#1c1b1c]/80 backdrop-blur-xl flex justify-around items-center h-16 pb-safe"
    >
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.tab;
        return (
          <button
            key={item.tab}
            id={`mobile-tab-${item.tab}`}
            onClick={() => setActiveTab(item.tab)}
            className={`flex flex-col items-center justify-center w-16 h-full transition-all duration-200 cursor-pointer ${
              isActive ? 'text-[#00f2ff]' : 'text-[#b9cacb] hover:text-[#e5e2e3]'
            }`}
          >
            <Icon size={20} className={isActive ? 'animate-bounce' : ''} style={{ animationDuration: '3s' }} />
            <span className="font-label-mono text-[9px] mt-1 tracking-tighter">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
