/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#F8F8F8',
        surface: '#FFFFFF',
        s2:      '#F2F2F2',
        s3:      '#E8E8E8',
        border:  '#E0E0E0',
        hwang:   '#111111',
        hong:    '#111111',
        'hong-deep': '#000000',
        cheong:  '#111111',
        nok:     '#111111',
        gold:    '#111111',
        ink:     '#111111',
        cream:   '#111111',
        muted:   '#555555',
        stone:   '#999999',
        dancheong: '#111111',
      },
      fontFamily: {
        sans:  ['"Pretendard Variable"', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        serif: ['"Noto Serif KR"', 'serif'],
      },
      animation: {
        'marquee': 'marquee 40s linear infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'float':   'float 6s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '0% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}
