/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  gapClass?: string;
}

export const ScrollContainer: React.FC<ScrollContainerProps> = ({ children, className = '', gapClass = 'gap-2' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Drag states
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const isMouseDown = useRef(false);

  const checkScrollLimits = () => {
    const el = containerRef.current;
    if (!el) return;

    // Tolerance of 2px for high-dpi screen scroll offsets
    const canScrollLeft = el.scrollLeft > 2;
    const canScrollRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 2;

    setShowLeftArrow(canScrollLeft);
    setShowRightArrow(canScrollRight);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    checkScrollLimits();

    // Check bounds on resize (e.g. screen orientation or layout updates)
    const resizeObserver = new ResizeObserver(() => {
      checkScrollLimits();
    });
    resizeObserver.observe(el);

    el.addEventListener('scroll', checkScrollLimits);
    return () => {
      resizeObserver.disconnect();
      el.removeEventListener('scroll', checkScrollLimits);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;

    isMouseDown.current = true;
    startX.current = e.pageX - el.offsetLeft;
    scrollLeft.current = el.scrollLeft;
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown.current) return;
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;

    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX.current) * 1.5; // Drag speed multiplier
    el.scrollLeft = scrollLeft.current - walk;

    if (Math.abs(walk) > 5) {
      setIsDragging(true);
    }
  };

  const handleMouseUpOrLeave = () => {
    isMouseDown.current = false;
    // Tiny delay to ensure pointer events are restored after click cycle completes
    setTimeout(() => {
      setIsDragging(false);
    }, 50);
  };

  const scrollByAmount = (amount: number) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({
      left: el.scrollLeft + amount,
      behavior: 'smooth'
    });
  };

  return (
    <div className={`relative w-full group/scroll-container ${className}`}>
      {/* Left Glassmorphic Scroll Arrow */}
      {showLeftArrow && (
        <button
          onClick={() => scrollByAmount(-240)}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 flex items-center justify-center backdrop-blur-md hover:scale-110 active:scale-95 transition-all text-[#00f2ff] hover:text-white shadow-xl cursor-pointer select-none"
          title="Scroll Left"
          type="button"
        >
          <ChevronLeft size={16} />
        </button>
      )}

      {/* Drag & Swipe Scroll Container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className={`overflow-x-auto scrollbar-none w-full select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab active:cursor-grabbing'
        }`}
        style={{
          scrollBehavior: isDragging ? 'auto' : 'smooth',
          pointerEvents: 'auto'
        }}
      >
        <div className={`flex items-center ${gapClass} py-1 ${isDragging ? 'pointer-events-none' : ''}`}>
          {children}
        </div>
      </div>

      {/* Right Glassmorphic Scroll Arrow */}
      {showRightArrow && (
        <button
          onClick={() => scrollByAmount(240)}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 flex items-center justify-center backdrop-blur-md hover:scale-110 active:scale-95 transition-all text-[#00f2ff] hover:text-white shadow-xl cursor-pointer select-none"
          title="Scroll Right"
          type="button"
        >
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
};
