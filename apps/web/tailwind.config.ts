import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // SEOART Orange Palette
        orange: {
          50: 'hsl(var(--orange-50))',
          100: 'hsl(var(--orange-100))',
          200: 'hsl(var(--orange-200))',
          300: 'hsl(var(--orange-300))',
          400: 'hsl(var(--orange-400))',
          500: 'hsl(var(--orange-500))',
          600: 'hsl(var(--orange-600))',
          700: 'hsl(var(--orange-700))',
          800: 'hsl(var(--orange-800))',
          900: 'hsl(var(--orange-900))',
        },
        // Status colors
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        // Tool-specific colors
        tool1: {
          DEFAULT: 'hsl(var(--tool1))',
          foreground: 'hsl(var(--tool1-foreground))',
        },
        tool2: {
          DEFAULT: 'hsl(var(--tool2))',
          foreground: 'hsl(var(--tool2-foreground))',
        },
        tool3: {
          DEFAULT: 'hsl(var(--tool3))',
          foreground: 'hsl(var(--tool3-foreground))',
        },
        // Brand
        brand: 'hsl(var(--brand))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
        '3xl': 'calc(var(--radius) + 16px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      boxShadow: {
        'glow-sm': '0 0 10px hsl(var(--primary) / 0.2)',
        'glow': '0 0 20px hsl(var(--primary) / 0.3)',
        'glow-lg': '0 0 30px hsl(var(--primary) / 0.4)',
        'glow-xl': '0 0 40px hsl(var(--primary) / 0.5)',
        'inner-glow': 'inset 0 0 20px hsl(var(--primary) / 0.1)',
        'premium': '0 4px 6px -1px hsl(0 0% 0% / 0.1), 0 2px 4px -2px hsl(0 0% 0% / 0.1), inset 0 1px 0 0 hsl(var(--foreground) / 0.05)',
        'premium-hover': '0 10px 25px -5px hsl(0 0% 0% / 0.15), 0 4px 6px -2px hsl(0 0% 0% / 0.1)',
        'card-hover': '0 8px 30px hsl(0 0% 0% / 0.12)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          from: { opacity: '0', transform: 'translateY(-20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-left': {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-in-right': {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'scale-in-bounce': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-bottom': {
          from: { opacity: '0', transform: 'translateY(100%)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-out-bottom': {
          from: { opacity: '1', transform: 'translateY(0)' },
          to: { opacity: '0', transform: 'translateY(100%)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px hsl(var(--primary) / 0.3)' },
          '50%': { boxShadow: '0 0 40px hsl(var(--primary) / 0.5)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        'ping-slow': {
          '75%, 100%': {
            transform: 'scale(1.5)',
            opacity: '0',
          },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'border-beam': {
          '100%': { offsetDistance: '100%' },
        },
        'text-shine': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        'rotate-gradient': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'progress-grow': {
          from: { width: '0%' },
          to: { width: 'var(--progress-width, 100%)' },
        },
        'count-up': {
          from: { '--num': '0' },
          to: { '--num': 'var(--target-num)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'spin-slow': 'spin-slow 3s linear infinite',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
        'fade-in-down': 'fade-in-down 0.5s ease-out forwards',
        'fade-in-left': 'fade-in-left 0.5s ease-out forwards',
        'fade-in-right': 'fade-in-right 0.5s ease-out forwards',
        'scale-in': 'scale-in 0.3s ease-out forwards',
        'scale-in-bounce': 'scale-in-bounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
        'slide-in-bottom': 'slide-in-bottom 0.4s ease-out forwards',
        'slide-out-bottom': 'slide-out-bottom 0.4s ease-in forwards',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.5s ease-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'ping-slow': 'ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'gradient-shift': 'gradient-shift 3s ease infinite',
        'border-beam': 'border-beam 4s linear infinite',
        'text-shine': 'text-shine 3s linear infinite',
        'rotate-gradient': 'rotate-gradient 3s linear infinite',
        'progress-grow': 'progress-grow 1s ease-out forwards',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-mesh': 'radial-gradient(at 40% 20%, hsl(var(--primary) / 0.1) 0px, transparent 50%), radial-gradient(at 80% 0%, hsl(24 90% 48% / 0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsl(var(--primary) / 0.05) 0px, transparent 50%)',
        'gradient-premium': 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(17 88% 40%) 100%)',
        'gradient-card': 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.8) 100%)',
        'shine': 'linear-gradient(90deg, transparent, hsl(var(--foreground) / 0.1), transparent)',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },
      backdropBlur: {
        xs: '2px',
      },
      scale: {
        '102': '1.02',
        '103': '1.03',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [],
};

export default config;
