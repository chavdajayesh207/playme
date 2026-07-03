/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LogoProps {
  /** Size height of the logo container (e.g. 24, 32, 40, 48) */
  size?: number | string;
  /** Whether to show the "play me" text beside the brand icon */
  withText?: boolean;
  /** Adaptive style for dark/light themes */
  theme?: 'dark' | 'light';
  className?: string;
  animate?: boolean;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  size = 36,
  withText = true,
  theme = 'dark',
  className = '',
  animate = false,
  onClick
}) => {
  // Convert size to number for proportion if needed, but height in px is easy
  const heightVal = typeof size === 'number' ? `${size}px` : size;

  // Exact Hex Color specifications based on Official Brand Logo Image
  const colors = {
    bar1And5: '#9fa0ec', // Light periwinkle
    bar2And4: '#7e78e2', // Medium periwinkle/violet
    centerBar: '#463bb5', // Tallest deep blue-violet
    dot: '#c1c3f4',      // Soft pale lavender
    textPlayLight: '#32269a', // Deep royal blue for light background
    textPlayDark: '#ffffff',  // Bright white/lavender for dark background
    textMeLight: '#7e78e2',   // Medium violet for "me" on light
    textMeDark: '#a39eed'     // Pale periwinkle for "me" on dark
  };

  const playColor = theme === 'dark' ? colors.textPlayDark : colors.textPlayLight;
  const meColor = theme === 'dark' ? colors.textMeDark : colors.textMeLight;

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center select-none gap-2.5 transition-all outline-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ height: heightVal }}
    >
      {/* Official Stylized Wave icon */}
      <svg
        viewBox="0 0 135 100"
        className="h-full w-auto shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Five rounded vertical bars with high-fidelity pill shape */}
        <rect
          x="10"
          y="35"
          width="13"
          height="30"
          rx="6.5"
          fill={colors.bar1And5}
        >
          {animate && (
            <>
              <animate
                attributeName="height"
                values="15;45;15"
                dur="1s"
                repeatCount="indefinite"
                begin="0s"
              />
              <animate
                attributeName="y"
                values="42.5;27.5;42.5"
                dur="1s"
                repeatCount="indefinite"
                begin="0s"
              />
            </>
          )}
        </rect>
        <rect
          x="29"
          y="20"
          width="13"
          height="60"
          rx="6.5"
          fill={colors.bar2And4}
        >
          {animate && (
            <>
              <animate
                attributeName="height"
                values="30;80;30"
                dur="1.2s"
                repeatCount="indefinite"
                begin="0.15s"
              />
              <animate
                attributeName="y"
                values="35;10;35"
                dur="1.2s"
                repeatCount="indefinite"
                begin="0.15s"
              />
            </>
          )}
        </rect>
        <rect
          x="48"
          y="10"
          width="13"
          height="80"
          rx="6.5"
          fill={colors.centerBar}
        >
          {animate && (
            <>
              <animate
                attributeName="height"
                values="40;90;40"
                dur="0.9s"
                repeatCount="indefinite"
                begin="0.3s"
              />
              <animate
                attributeName="y"
                values="30;5;30"
                dur="0.9s"
                repeatCount="indefinite"
                begin="0.3s"
              />
            </>
          )}
        </rect>
        <rect
          x="67"
          y="18"
          width="13"
          height="64"
          rx="6.5"
          fill={colors.bar2And4}
        >
          {animate && (
            <>
              <animate
                attributeName="height"
                values="32;84;32"
                dur="1.1s"
                repeatCount="indefinite"
                begin="0.45s"
              />
              <animate
                attributeName="y"
                values="34;8;34"
                dur="1.1s"
                repeatCount="indefinite"
                begin="0.45s"
              />
            </>
          )}
        </rect>
        <rect
          x="86"
          y="32"
          width="13"
          height="36"
          rx="6.5"
          fill={colors.bar1And5}
        >
          {animate && (
            <>
              <animate
                attributeName="height"
                values="18;54;18"
                dur="0.8s"
                repeatCount="indefinite"
                begin="0.6s"
              />
              <animate
                attributeName="y"
                values="41;23;41"
                dur="0.8s"
                repeatCount="indefinite"
                begin="0.6s"
              />
            </>
          )}
        </rect>
        {/* Small trailing periwinkle dot */}
        <circle
          cx="112"
          cy="50"
          r="6.5"
          fill={colors.dot}
        >
          {animate && (
            <>
              <animate
                attributeName="r"
                values="4.5;8.5;4.5"
                dur="1.4s"
                repeatCount="indefinite"
                begin="0.75s"
              />
              <animate
                attributeName="opacity"
                values="0.4;1;0.4"
                dur="1.4s"
                repeatCount="indefinite"
                begin="0.75s"
              />
            </>
          )}
        </circle>
      </svg>

      {/* Brand typographic name "play me" with exact visual alignment */}
      {withText && (
        <div className="flex items-baseline font-sans font-bold leading-none tracking-tight gap-1 select-none pr-1">
          <span
            style={{ color: playColor }}
            className="text-base md:text-lg font-black tracking-[-0.035em]"
          >
            play
          </span>
          <span
            style={{ color: meColor }}
            className="text-base md:text-lg font-medium tracking-normal"
          >
            me
          </span>
        </div>
      )}
    </div>
  );
};
