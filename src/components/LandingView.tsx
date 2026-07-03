/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NavigationTab } from '../types';
import { HEADPHONE_IMAGE } from '../data';
import { Play, ArrowRight, Music, Headphones } from 'lucide-react';
import { motion } from 'motion/react';

interface LandingViewProps {
  onStartListening: () => void;
  onExplore: () => void;
  onSwitchLayout?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onStartListening, onExplore, onSwitchLayout }) => {
  return (
    <section
      id="welcome-screen"
      className="relative min-h-[90vh] flex flex-col justify-center items-center text-center px-4 overflow-hidden"
    >
      {/* Abstract Glowing Aura Grid */}
      <div className="absolute inset-0 z-0 opacity-45 flex items-center justify-center pointer-events-none">
        <div className="absolute w-[500px] h-[500px] bg-[#00f2ff]/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute w-[400px] h-[400px] bg-[#ff571a]/5 rounded-full blur-[120px] delay-1000 animate-pulse" />
        <div
          className="w-full max-w-4xl h-[450px] opacity-25 filter blur-xs"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 15px, rgba(0, 242, 255, 0.15) 15px, rgba(0, 242, 255, 0.15) 17px)`,
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-3xl mx-auto mt-6">
        {/* Floating Headphone Container */}
        <div className="relative w-72 h-72 md:w-96 md:h-96 mb-6 flex items-center justify-center group">
          <div className="absolute inset-0 bg-radial from-[#00f2ff]/20 to-transparent rounded-full blur-[60px] animate-pulse pointer-events-none" />
          <img
            alt="Playme Headphone"
            className="w-full h-full object-contain drop-shadow-[0_25px_50px_rgba(0,219,231,0.3)] animate-bounce select-none pointer-events-none"
            src={HEADPHONE_IMAGE}
            style={{ animationDuration: '6s' }}
          />
          {/* Audio Badges overlays */}
          <div className="absolute top-24 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] text-[#00f2ff] flex items-center gap-1.5 font-label-mono animate-pulse">
            <Headphones size={10} />
            <span>HQ 3D AUDIO</span>
          </div>
          <div className="absolute bottom-24 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] text-[#ff571a] flex items-center gap-1.5 font-label-mono animate-pulse delay-700">
            <Music size={10} />
            <span>DOLBY ATMOS</span>
          </div>
        </div>

        <h1 className="font-headline-xl text-5xl md:text-7xl font-bold tracking-tighter mb-4 text-[#e1fdff] select-none text-glow leading-none">
          Playme<span className="text-[#00f2ff]">.</span>
        </h1>

        <p className="text-[#b9cacb] max-w-lg mb-8 text-sm md:text-base leading-relaxed px-4">
          Experience the second most popular place to listen to podcasts and state-of-the-art spatial streams in the world — and growing fast.
        </p>

        {/* Play actions */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center px-4">
          <button
            id="start-listening-btn"
            onClick={onStartListening}
            className="px-8 py-4 rounded-full bg-[#00f2ff] text-[#00363a] font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(0,242,255,0.4)] hover:shadow-[0_0_35px_rgba(0,242,255,0.7)] hover:scale-[1.04] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Play size={16} fill="currentColor" />
            <span>Start Listening</span>
          </button>
          <button
            id="explore-landing-btn"
            onClick={onExplore}
            className="px-8 py-4 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-[#e5e2e3] font-bold text-sm tracking-wide hover:scale-[1.04] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <span>Explore Discovery</span>
            <ArrowRight size={16} />
          </button>
          {onSwitchLayout && (
            <button
              id="switch-to-mavfarm-btn"
              onClick={onSwitchLayout}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-pink-500/20 to-pink-600/20 hover:from-pink-500/30 hover:to-pink-600/30 border border-pink-500/40 text-pink-300 font-bold text-sm tracking-wide hover:scale-[1.04] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              title="Activate MavFarm dynamic layout"
            >
              <span>⇄ Tablet Style</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
