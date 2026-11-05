/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // --- Superficies / pergamino (design.md) ---
        surface: '#faf5eb',
        'surface-dim': '#e9d7cb',
        'surface-bright': '#fff8f5',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#fff1e9',
        'surface-container': '#faeae0',
        'surface-container-high': '#f2e7d7',
        'surface-container-highest': '#ebdccb',
        'on-surface': '#231a13',
        'on-surface-variant': '#56423c',
        'inverse-surface': '#392e26',
        'inverse-on-surface': '#ffede3',
        'surface-variant': '#f2dfd3',
        background: '#faf5eb',
        'on-background': '#231a13',
        outline: '#89726b',
        'outline-variant': '#ddc0b9',
        'surface-tint': '#9e4223',

        // --- Primario: terracota / lacre ---
        primary: '#792609',
        'primary-container': '#983d1f',
        'on-primary': '#ffffff',
        'on-primary-container': '#ffc4b2',
        terracotta: '#b85434',

        // --- Secundario: verde bosque ---
        secondary: '#141d16',
        'secondary-container': '#1b261d',
        'on-secondary': '#faf5eb',
        'on-secondary-container': '#a4b3a6',

        // --- Terciario: dorado botánico ---
        tertiary: '#583e00',
        'tertiary-container': '#725516',
        'gold': '#c6a15b',

        // --- Error ---
        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',

        // --- Extras de marca ---
        parchment: '#faf5eb',
        'parchment-border': '#ded2c1',
        'forest-night': '#141d16',
        'forest-canopy': '#1b261d',
        'ink-warm': '#1c1815',
        'stamp-sepia': '#7a6452',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Work Sans"', 'system-ui', 'sans-serif'],
        hand: ['Caveat', 'cursive'],
      },
      borderRadius: {
        sm: '0.5rem',
        DEFAULT: '1rem',
        md: '1.5rem',
        lg: '2rem',
        xl: '3rem',
        full: '9999px',
      },
      boxShadow: {
        paper: '0 20px 40px -12px rgba(36, 44, 38, 0.14)',
        'paper-lg': '0 30px 60px -15px rgba(15, 22, 17, 0.35)',
      },
      letterSpacing: {
        widest2: '0.25em',
      },
      maxWidth: {
        '7xl': '80rem',
      },
    },
  },
  plugins: [],
}
