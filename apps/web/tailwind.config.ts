import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,tsx,mdx}',
    './src/components/**/*.{js,ts,tsx,mdx}',
    './src/app/**/*.{js,ts,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#101112',
        graphite: '#1B1C1D',
        'royal-gold': {
          DEFAULT: '#C49A48',
          light: '#D4B370',
          dark: '#A67F37',
        },
        honey: '#E5D3A2',
        ivory: '#F0EEE8',
        orchid: '#B89AF7',
        coral: '#F18D83',
        mint: '#86D6BB',
        background: '#101112',
        foreground: '#F0EEE8',
        primary: {
          DEFAULT: '#C49A48',
          dark: '#A67F37',
          light: '#D4B370',
        },
        dark: {
          100: '#101112',
          200: '#1B1C1D',
          300: '#2A2B2C',
          400: '#3A3B3C',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'honeycomb': "url('/honeycomb-pattern.svg')",
        'premium-gradient': 'linear-gradient(135deg, #1B1C1D 0%, #101112 100%)',
        'gold-gradient': 'linear-gradient(135deg, #C49A48 0%, #E5D3A2 100%)',
      },
      boxShadow: {
        'premium': '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
        'gold-glow': '0 0 20px -5px rgba(196, 154, 72, 0.3)',
      }
    },
  },
  plugins: [],
}
export default config
