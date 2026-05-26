/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        white:   '#FDFAF6',   // 따뜻한 흰색 (한지 느낌)
        bg:      '#F5EDE0',   // 한지 배경
        surface: '#FDFAF6',   // 카드/서피스
        s2:      '#EDE0CF',   // 보조 배경
        s3:      '#D4C4B0',   // 경계선
        border:  '#DCCCB8',   // 소프트 경계선
        hwang:   '#B8975A',   // 황금빛 (단청 accent)
        gold:    '#B8975A',   // 금색 accent
        ink:     '#3D2314',   // 옻칠 먹색
        cream:   '#F5EDE0',   // 한지색
        muted:   '#6B4C35',   // 중간 우드
        stone:   '#9C8572',   // 뮤트 우드
        dancheong: '#B8975A', // 단청 황금
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
