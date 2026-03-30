/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B8EAD',
          dark: '#2A6F8A',
          light: '#E6F2F7',
          50: '#F0F7FA',
        },
        coral: '#D46B5A',
        accent: {
          DEFAULT: '#C4983B',
          light: '#F5EDD6',
        },
        offwhite: '#F8F8F8',
        charcoal: '#2C2C2C',
        gray: {
          100: '#F2F2F2',
          200: '#E0E0E0',
          400: '#A0A0A0',
          600: '#6B6B6B',
        },
        success: '#2D7A4F',
        warning: '#D4922A',
        error: '#C0392B',
        info: '#3B8EAD',
      },
      fontFamily: {
        heading: ['PlayfairDisplay_700Bold'],
        body: ['SourceSans3_400Regular'],
        'body-medium': ['SourceSans3_500Medium'],
        'body-semibold': ['SourceSans3_600SemiBold'],
        arabic: ['Amiri_400Regular'],
        'arabic-bold': ['Amiri_700Bold'],
      },
      borderRadius: {
        card: '12px',
        button: '8px',
        chip: '20px',
      },
    },
  },
  plugins: [],
};
