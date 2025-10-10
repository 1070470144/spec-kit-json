'use client';

import { useRef, useCallback } from 'react';

/**
 * Touch gesture types
 */
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export interface TouchGestureOptions {
  threshold?: number;        // Minimum distance for swipe (default: 50px)
  preventScroll?: boolean;   // Prevent scroll during touch (default: false)
}

/**
 * Hook to handle touch gestures (swipe, tap, long press)
 */
export function useSwipe(
  handlers: SwipeHandlers,
  options: TouchGestureOptions = {}
) {
  const { threshold = 50, preventScroll = false } = options;
  
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (preventScroll) {
      e.preventDefault();
    }
    
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  }, [preventScroll]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    const deltaTime = Date.now() - touchStart.current.time;

    // Calculate distances
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Ignore if movement is too small
    if (absX < threshold && absY < threshold) {
      touchStart.current = null;
      return;
    }

    // Ignore if too slow (likely not a swipe)
    if (deltaTime > 500) {
      touchStart.current = null;
      return;
    }

    // Determine primary direction (horizontal vs vertical)
    if (absX > absY) {
      // Horizontal swipe
      if (deltaX > 0 && handlers.onSwipeRight) {
        handlers.onSwipeRight();
      } else if (deltaX < 0 && handlers.onSwipeLeft) {
        handlers.onSwipeLeft();
      }
    } else {
      // Vertical swipe
      if (deltaY > 0 && handlers.onSwipeDown) {
        handlers.onSwipeDown();
      } else if (deltaY < 0 && handlers.onSwipeUp) {
        handlers.onSwipeUp();
      }
    }

    touchStart.current = null;
  }, [handlers, threshold]);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd
  };
}

/**
 * Hook for long press gesture
 */
export interface LongPressOptions {
  onLongPress: () => void;
  delay?: number;  // Duration in ms (default: 500)
}

export function useLongPress(options: LongPressOptions) {
  const { onLongPress, delay = 500 } = options;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const handlePointerDown = useCallback(() => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const handlePointerUp = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handlePointerCancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    isLongPress.current = false;
  }, []);

  return {
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel
  };
}

/**
 * Hook to detect tap gesture (fast touch)
 */
export interface TapOptions {
  onTap: () => void;
  onDoubleTap?: () => void;
  maxDuration?: number;  // Max duration for tap (default: 300ms)
  maxDistance?: number;  // Max movement allowed (default: 10px)
}

export function useTap(options: TapOptions) {
  const { onTap, onDoubleTap, maxDuration = 300, maxDistance = 10 } = options;
  
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapTime = useRef<number>(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;

    const touch = e.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStart.current.x);
    const deltaY = Math.abs(touch.clientY - touchStart.current.y);
    const duration = Date.now() - touchStart.current.time;

    // Check if it's a valid tap
    if (duration <= maxDuration && deltaX <= maxDistance && deltaY <= maxDistance) {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTime.current;

      // Check for double tap
      if (onDoubleTap && timeSinceLastTap < 300) {
        onDoubleTap();
        lastTapTime.current = 0; // Reset to prevent triple tap
      } else {
        onTap();
        lastTapTime.current = now;
      }
    }

    touchStart.current = null;
  }, [onTap, onDoubleTap, maxDuration, maxDistance]);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd
  };
}

