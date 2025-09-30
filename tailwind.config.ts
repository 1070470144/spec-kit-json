import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{ts,tsx}', './pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // Material Design 3 颜色系统
      colors: {
        // 主色调 (Primary)
        primary: {
          DEFAULT: '#6750A4',
          container: '#EADDFF',
          on: '#FFFFFF',
          'on-container': '#21005D',
        },
        // 次要色 (Secondary)
        secondary: {
          DEFAULT: '#625B71',
          container: '#E8DEF8',
          on: '#FFFFFF',
          'on-container': '#1D192B',
        },
        // 第三色 (Tertiary)
        tertiary: {
          DEFAULT: '#7D5260',
          container: '#FFD8E4',
          on: '#FFFFFF',
          'on-container': '#31111D',
        },
        // 错误色 (Error)
        error: {
          DEFAULT: '#B3261E',
          container: '#F9DEDC',
          on: '#FFFFFF',
          'on-container': '#410E0B',
        },
        // 表面色 (Surface)
        surface: {
          DEFAULT: '#FFFBFE',
          variant: '#E7E0EC',
          on: '#1C1B1F',
          'on-variant': '#49454F',
        },
        // 背景色 (Background)
        background: {
          DEFAULT: '#FFFBFE',
          on: '#1C1B1F',
        },
        // 轮廓色 (Outline)
        outline: {
          DEFAULT: '#79747E',
          variant: '#CAC4D0',
        },
      },
      // Material Design 3 排版系统
      fontSize: {
        // Display
        'display-large': ['57px', { lineHeight: '64px', letterSpacing: '-0.25px', fontWeight: '400' }],
        'display-medium': ['45px', { lineHeight: '52px', letterSpacing: '0px', fontWeight: '400' }],
        'display-small': ['36px', { lineHeight: '44px', letterSpacing: '0px', fontWeight: '400' }],
        // Headline
        'headline-large': ['32px', { lineHeight: '40px', letterSpacing: '0px', fontWeight: '400' }],
        'headline-medium': ['28px', { lineHeight: '36px', letterSpacing: '0px', fontWeight: '400' }],
        'headline-small': ['24px', { lineHeight: '32px', letterSpacing: '0px', fontWeight: '400' }],
        // Title
        'title-large': ['22px', { lineHeight: '28px', letterSpacing: '0px', fontWeight: '400' }],
        'title-medium': ['16px', { lineHeight: '24px', letterSpacing: '0.15px', fontWeight: '500' }],
        'title-small': ['14px', { lineHeight: '20px', letterSpacing: '0.1px', fontWeight: '500' }],
        // Body
        'body-large': ['16px', { lineHeight: '24px', letterSpacing: '0.5px', fontWeight: '400' }],
        'body-medium': ['14px', { lineHeight: '20px', letterSpacing: '0.25px', fontWeight: '400' }],
        'body-small': ['12px', { lineHeight: '16px', letterSpacing: '0.4px', fontWeight: '400' }],
        // Label
        'label-large': ['14px', { lineHeight: '20px', letterSpacing: '0.1px', fontWeight: '500' }],
        'label-medium': ['12px', { lineHeight: '16px', letterSpacing: '0.5px', fontWeight: '500' }],
        'label-small': ['11px', { lineHeight: '16px', letterSpacing: '0.5px', fontWeight: '500' }],
      },
      // Material Design 3 圆角系统
      borderRadius: {
        'xs': '4px',    // Extra Small
        'sm': '8px',    // Small
        'md': '12px',   // Medium
        'lg': '16px',   // Large
        'xl': '28px',   // Extra Large
      },
      // Material Design 3 阴影系统 (Elevation)
      boxShadow: {
        'elevation-1': '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
        'elevation-2': '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)',
        'elevation-3': '0px 1px 3px 0px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)',
        'elevation-4': '0px 2px 3px 0px rgba(0, 0, 0, 0.3), 0px 6px 10px 4px rgba(0, 0, 0, 0.15)',
        'elevation-5': '0px 4px 4px 0px rgba(0, 0, 0, 0.3), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)',
      },
      // Material Design 3 动画时长
      transitionDuration: {
        'fast': '100ms',
        'standard': '200ms',
        'slow': '400ms',
      },
    },
  },
  plugins: []
} satisfies Config
