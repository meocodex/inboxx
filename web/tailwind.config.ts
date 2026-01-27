import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
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
        // Conversation-specific colors
        conv: {
          'bg-primary': 'hsl(var(--conv-bg-primary))',
          'bg-secondary': 'hsl(var(--conv-bg-secondary))',
          'bg-tertiary': 'hsl(var(--conv-bg-tertiary))',
          'bg-hover': 'hsl(var(--conv-bg-hover))',
          border: 'hsl(var(--conv-border))',
          'border-light': 'hsl(var(--conv-border-light))',
          'text-primary': 'hsl(var(--conv-text-primary))',
          'text-secondary': 'hsl(var(--conv-text-secondary))',
          'text-muted': 'hsl(var(--conv-text-muted))',
          accent: 'hsl(var(--conv-accent))',
        },
        // Channel colors
        whatsapp: 'hsl(var(--whatsapp))',
        instagram: 'hsl(var(--instagram))',
        facebook: 'hsl(var(--facebook))',
        // Status colors
        online: 'hsl(var(--online))',
        away: 'hsl(var(--away))',
        busy: 'hsl(var(--busy))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'conv-sm': 'var(--radius-sm)',
        'conv-md': 'var(--radius-md)',
        'conv-lg': 'var(--radius-lg)',
        'conv-full': 'var(--radius-full)',
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
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
