/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface WordByWordProps {
  text: string;
  startTime: number;
  endTime: number;
  currentTime: number;
  glowClass?: string;
  activeColorClass?: string;
  inactiveColorClass?: string;
}

/**
 * Premium Apple Music / Spotify-style Karaoke word-by-word highlights
 * Dynamically distributes highlighting inside a timed line based on duration.
 */
export const WordByWordLine: React.FC<WordByWordProps> = ({
  text,
  startTime,
  endTime,
  currentTime,
  glowClass = 'text-glow',
  activeColorClass = 'text-[#00f2ff]',
  inactiveColorClass = 'text-white/40'
}) => {
  if (!text) return null;

  // Split line into words
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return null;

  const totalDuration = Math.max(0.5, endTime - startTime);
  const wordDuration = totalDuration / words.length;

  return (
    <span className="flex flex-wrap gap-x-2 leading-relaxed justify-start items-center">
      {words.map((word, index) => {
        // Calculate estimated timing for this specific word
        const wordStart = startTime + index * wordDuration;
        const isActive = currentTime >= wordStart;

        return (
          <span
            key={index}
            className={`transition-all duration-200 transform select-none ${
              isActive 
                ? `${activeColorClass} ${glowClass} font-black scale-[1.02]` 
                : `${inactiveColorClass} font-medium scale-[1.0]`
            }`}
            style={{
              display: 'inline-block',
              textShadow: isActive ? '0 0 12px rgba(0, 242, 255, 0.4)' : 'none'
            }}
          >
            {word}
          </span>
        );
      })}
    </span>
  );
};
