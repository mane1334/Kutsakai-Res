module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html', './index.html'],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        lg: '1024px',
        xl: '1280px',
        '2xl': '1440px',
      },
    },
    extend: {
      colors: {
        surface: {
          DEFAULT: '#fff7ed',
          lowest: '#ffffff',
          low: '#fff1f2',
          container: '#ffe4e6',
          high: '#fecdd3',
          highest: '#fda4af',
        },
        ink: {
          DEFAULT: '#1f1115',
          muted: '#5f323b',
          soft: '#7a4a54',
        },
        emeraldpro: {
          DEFAULT: '#6d2430',
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          700: '#571923',
          900: '#3a0f17',
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
      boxShadow: {
        card: '0 2px 10px rgba(0,0,0,0.05)',
        'admin-soft': '0 10px 30px rgba(109, 36, 48, 0.10)',
      },
      borderRadius: {
        xl: '0.5rem',
        '2xl': '0.75rem',
      },
    },
  },
  plugins: [],
}
