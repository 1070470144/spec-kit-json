'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect media query matches
 * @param query - CSS media query string (e.g., "(max-width: 768px)")
 * @returns boolean indicating if the media query matches
 * 
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Server-side rendering guard
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia(query);
    
    // Set initial value
    setMatches(media.matches);

    // Define listener
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Modern browsers
    if (media.addEventListener) {
      media.addEventListener('change', listener);
    } else {
      // Legacy browsers (Safari < 14)
      media.addListener(listener);
    }

    // Cleanup
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener);
      } else {
        media.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Predefined breakpoint hooks based on Tailwind config
 */

// xs: 375px - 小屏手机 (iPhone SE)
export const useIsXs = () => useMediaQuery('(min-width: 375px)');

// sm: 640px - 大屏手机
export const useIsSm = () => useMediaQuery('(min-width: 640px)');

// md: 768px - 平板竖屏
export const useIsMd = () => useMediaQuery('(min-width: 768px)');

// lg: 1024px - 平板横屏/小桌面
export const useIsLg = () => useMediaQuery('(min-width: 1024px)');

// xl: 1280px - 桌面
export const useIsXl = () => useMediaQuery('(min-width: 1280px)');

// 2xl: 1536px - 大桌面
export const useIs2xl = () => useMediaQuery('(min-width: 1536px)');

/**
 * Semantic device type hooks
 */

// 移动端: < 768px
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');

// 平板: 768px - 1023px
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

// 桌面: >= 1024px
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');

/**
 * Orientation hooks
 */
export const useIsPortrait = () => useMediaQuery('(orientation: portrait)');
export const useIsLandscape = () => useMediaQuery('(orientation: landscape)');

/**
 * Device capability hooks
 */
export const useHasHover = () => useMediaQuery('(hover: hover)');
export const useHasTouch = () => useMediaQuery('(pointer: coarse)');
export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
export const usePrefersDarkMode = () => useMediaQuery('(prefers-color-scheme: dark)');

