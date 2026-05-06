/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // CSS-variable backed so light/dark theme can swap all backgrounds at once
        bunker: {
          950: 'var(--bunker-950, #020408)',
          900: 'var(--bunker-900, #060d14)',
          800: 'var(--bunker-800, #0a1520)',
          700: 'var(--bunker-700, #0f1f2e)',
          600: 'var(--bunker-600, #162840)',
        },
        ops: {
          // ops-green uses a CSS variable so dark/light mode can each pick the right shade.
          // Opacity modifiers (/20, /50, etc.) work because we pass space-separated RGB channels.
          green:  'rgb(var(--ops-green-rgb) / <alpha-value>)',
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
