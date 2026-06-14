import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'
import typography from '@tailwindcss/typography'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      textShadow: {
        sm: '0 1px 1px rgb(0 0 0 / 0.25)',
        DEFAULT: '0 2px 3px rgb(0 0 0 / 0.3)',
        md: '0 2px 6px rgb(0 0 0 / 0.4)',
        lg: '0 4px 12px rgb(0 0 0 / 0.45)',
      },
      colors: {
        // Backgrounds
        bg: {
          DEFAULT: 'rgb(var(--bg) / <alpha-value>)',
          subtle: 'rgb(var(--bg-subtle) / <alpha-value>)',
          muted: 'rgb(var(--bg-muted) / <alpha-value>)',
        },
        
        // Surfaces
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          2: 'rgb(var(--surface-2) / <alpha-value>)',
          3: 'rgb(var(--surface-3) / <alpha-value>)',
        },
        
        // Cards
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          2: 'rgb(var(--card-2) / <alpha-value>)',
        },
        
        // Overlays
        overlay: {
          DEFAULT: 'rgb(var(--overlay) / 0.7)',
          hover: 'rgb(var(--overlay-hover) / 0.05)',
        },
        
        // Text
        text: {
          DEFAULT: 'rgb(var(--text) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
          disabled: 'rgb(var(--text-disabled) / <alpha-value>)',
        },
        
        // Borders (use variable-driven alpha so components can pick /5 /10 etc.)
        border: {
          DEFAULT: 'rgb(var(--border) / <alpha-value>)',
          hover: 'rgb(var(--border-hover) / <alpha-value>)',
          focus: 'rgb(var(--border-focus) / <alpha-value>)',
        },
        
        // Brand accent
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          hover: 'rgb(var(--accent-hover) / <alpha-value>)',
          pressed: 'rgb(var(--accent-pressed) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
        },
        
        // Primary alias for backward compatibility
        primary: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          hover: 'rgb(var(--accent-hover) / <alpha-value>)',
          pressed: 'rgb(var(--accent-pressed) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
        },
        
        // Semantic feedback colors
        success: {
          DEFAULT: 'rgb(var(--success) / <alpha-value>)',
          muted: 'rgb(var(--success) / 0.8)',
          subtle: 'rgb(var(--success) / 0.2)',
        },
        warning: {
          DEFAULT: 'rgb(var(--warning) / <alpha-value>)',
          muted: 'rgb(var(--warning) / 0.8)',
          subtle: 'rgb(var(--warning) / 0.2)',
        },
        danger: {
          DEFAULT: 'rgb(var(--danger) / <alpha-value>)',
          muted: 'rgb(var(--danger) / 0.8)',
          subtle: 'rgb(var(--danger) / 0.2)',
        },
      },
      
      fontFamily: {
        'proxima': 'var(--font-proxima-nova)',
        sans: 'var(--font-proxima-nova)',
      },
      
      fontSize: {
        'display': ['4rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display-sm': ['3rem', { lineHeight: '1.1', fontWeight: '700' }],
      },
      
      borderRadius: {
        '4xl': '2rem',
      },
      
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        'accent': 'var(--shadow-accent)',
        'elevation-1': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'elevation-2': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'elevation-3': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'elevation-4': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },
      
      transitionDuration: {
        fast: 'var(--transition-fast)',
        base: 'var(--transition-base)',
        slow: 'var(--transition-slow)',
      },
      
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-down': 'slide-down 0.5s ease-out',
        'pulse-subtle': 'pulse-subtle 3s infinite',
      },
      
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [
    typography,
    plugin(function({ addBase, matchUtilities, theme }) {
      addBase({
        'html': {
          fontFamily: 'var(--font-proxima-nova)',
        },
        'body': {
          backgroundColor: 'rgb(var(--bg))',
          color: 'rgb(var(--text))',
          fontFamily: 'var(--font-proxima-nova)',
        },
      })
      // Text shadow utilities
      matchUtilities(
        {
          'text-shadow': (value) => ({ textShadow: value }),
        },
        { values: theme('textShadow') as any }
      )
    }),
  ],
}

export default config
