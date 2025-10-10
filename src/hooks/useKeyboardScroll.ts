'use client';

import { useEffect } from 'react';

/**
 * Hook to automatically scroll form inputs into view when keyboard appears
 * 
 * 解决移动端键盘弹出遮挡输入框的问题
 * 当输入框获得焦点时，自动滚动使其位于可视区域中心
 * 
 * @example
 * export default function UploadForm() {
 *   useKeyboardScroll();
 *   return <form>...</form>;
 * }
 */
export function useKeyboardScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    /**
     * 处理输入框聚焦
     */
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      
      // 仅处理表单输入元素
      if (
        !(target instanceof HTMLInputElement) &&
        !(target instanceof HTMLTextAreaElement) &&
        !(target instanceof HTMLSelectElement)
      ) {
        return;
      }

      // 延迟滚动，等待键盘动画完成
      // iOS 键盘动画通常需要 300ms
      setTimeout(() => {
        if (document.activeElement === target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 300);
    };

    /**
     * 处理窗口尺寸变化（键盘弹出/收起）
     */
    let lastHeight = window.innerHeight;
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      
      // 键盘弹出（高度变小）
      if (currentHeight < lastHeight) {
        const activeElement = document.activeElement as HTMLElement;
        if (
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement
        ) {
          setTimeout(() => {
            activeElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }, 100);
        }
      }
      
      lastHeight = currentHeight;
    };

    // 添加事件监听
    document.addEventListener('focusin', handleFocusIn);
    window.addEventListener('resize', handleResize);

    // 清理
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('resize', handleResize);
    };
  }, []);
}

/**
 * Hook with additional options for fine-tuning
 */
export interface KeyboardScrollOptions {
  delay?: number;          // Delay before scrolling (default: 300ms)
  block?: ScrollLogicalPosition;  // Vertical alignment (default: 'center')
  behavior?: ScrollBehavior;      // Scroll behavior (default: 'smooth')
}

export function useKeyboardScrollWithOptions(options: KeyboardScrollOptions = {}) {
  const {
    delay = 300,
    block = 'center',
    behavior = 'smooth'
  } = options;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      
      if (
        !(target instanceof HTMLInputElement) &&
        !(target instanceof HTMLTextAreaElement) &&
        !(target instanceof HTMLSelectElement)
      ) {
        return;
      }

      setTimeout(() => {
        if (document.activeElement === target) {
          target.scrollIntoView({
            behavior,
            block,
            inline: 'nearest'
          });
        }
      }, delay);
    };

    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, [delay, block, behavior]);
}

