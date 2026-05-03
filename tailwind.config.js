/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bunker: {
          950: '#020408',
          900: '#060d14',
          800: '#0a1520',
          700: '#0f1f2e',
          600: '#162840',
        },
        ops: {
          green:  '#00ff88',
          lime:   '#a3e635',
          amber:  '#f59e0b',
          red:    '#ef4444',
          blue:   '#38bdf8',
          purple: '#a78bfa',
          cyan:   '#22d3ee',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'blink': 'blink 1.2s step-end infinite',
      },
      keyframes: {
        blink: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } },
      }
    },
  },
  plugins: [],
}
