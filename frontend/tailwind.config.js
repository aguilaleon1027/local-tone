/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        white:   '#FFFFFF',
        bg:      '#EEF3FF',    // 매우 연한 파란 배경 (원래 F5EDE0 역할)
        surface: '#FFFFFF',    // 카드
        s2:      '#E0EEFF',    // 보조 배경 (원래 EDE0CF 역할)
        s3:      '#BDD6FF',    // 경계선 (원래 D4C4B0 역할)
        border:  '#BDD6FF',    // 소프트 경계선
        hwang:   '#015DFE',    // accent (원래 B8975A 역할)
        gold:    '#015DFE',
        ink:     '#0022FE',    // 메인 (원래 3D2314 역할)
        cream:   '#EEF3FF',
        muted:   '#4186FF',    // 중간 (원래 6B4C35 역할)
        stone:   '#4186FF',    // 뮤트 (원래 9C8572 역할)
        dancheong: '#015DFE',
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
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        shimmer: { '0%': { backgroundPosition: '0% center' }, '100%': { backgroundPosition: '200% center' } },
        float:   { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-8px)' } },
      },
    },
  },
  plugins: [],
}
