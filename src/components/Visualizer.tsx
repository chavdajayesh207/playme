/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';

interface VisualizerProps {
  isPlaying: boolean;
  barCount?: number;
  heightClass?: string;
  colorClass?: string;
}

export const Visualizer: React.FC<VisualizerProps> = ({
  isPlaying,
  barCount = 12,
  heightClass = 'h-10',
  colorClass = 'bg-[#00f2ff]',
}) => {
  const [heights, setHeights] = useState<number[]>(new Array(barCount).fill(15));

  useEffect(() => {
    if (!isPlaying) {
      setHeights(new Array(barCount).fill(4));
      return;
    }

    const interval = setInterval(() => {
      setHeights(
        Array.from({ length: barCount }, () => Math.floor(Math.random() * 85) + 15)
      );
    }, 120);

    return () => clearInterval(interval);
  }, [isPlaying, barCount]);

  return (
    <div className={`flex items-end gap-[3px] select-none ${heightClass}`} id="audio-visualizer">
      {heights.map((height, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-t-full transition-all duration-100 ease-in-out ${colorClass}`}
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
};
