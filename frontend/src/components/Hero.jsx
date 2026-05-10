import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13, delayChildren: 0.25 } }
}
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] } }
}

const showcaseCards = [
  { label: '혼례 한복', gradient: 'linear-gradient(145deg, #8C1C2F 0%, #5a1020 40%, #1E3A6E 100%)', cls: 'animate-float' },
  { label: '궁중 한복', gradient: 'linear-gradient(145deg, #5B2D82 0%, #3d1a5e 50%, #C9A227 100%)', cls: 'animate-float-slow' },
  { label: '봄 한복',   gradient: 'linear-gradient(145deg, #7FB069 0%, #a8d5a2 50%, #F4B8C1 100%)', cls: 'animate-float-xslow' },
]

function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const done = useRef(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true
        let n = 0
        const step = target / 60
        const t = setInterval(() => {
          n += step
          if (n >= target) { setCount(target); clearInterval(t) }
          else setCount(Math.floor(n))
        }, 16)
      }
    })
    if (ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [target])
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

/* 전통 기와 지붕선 SVG */
function RoofLine({ className = '' }) {
  return (
    <svg viewBox="0 0 400 60" className={className} preserveAspectRatio="none">
      <path
        d="M0,60 L0,30 Q100,0 200,30 Q300,60 400,30 L400,60 Z"
        fill="rgba(139,40,32,0.18)"
      />
      <path
        d="M0,60 L0,38 Q100,8 200,38 Q300,68 400,38 L400,60 Z"
        fill="rgba(196,120,42,0.10)"
      />
    </svg>
  )
}

/* 행궁 문(門) 실루엣 */
function GateSilhouette() {
  return (
    <svg viewBox="0 0 320 380" className="absolute bottom-0 right-0 w-64 lg:w-80 opacity-[0.07] pointer-events-none" fill="none">
      {/* 누각 지붕 */}
      <path d="M20,140 L160,30 L300,140 Z" fill="#C4782A" />
      <path d="M40,145 L160,45 L280,145 Z" fill="#8B2820" />
      {/* 처마 끝 장식 */}
      <path d="M20,140 Q0,145 5,155 L40,150 Z" fill="#C4782A" />
      <path d="M300,140 Q320,145 315,155 L280,150 Z" fill="#C4782A" />
      {/* 기둥 */}
      <rect x="55"  y="145" width="22" height="180" fill="#8B2820" />
      <rect x="243" y="145" width="22" height="180" fill="#8B2820" />
      {/* 아치 문 */}
      <path d="M90,325 L90,240 Q160,180 230,240 L230,325 Z" fill="#5E1A14" />
      {/* 문 디테일 */}
      <path d="M105,315 L105,250 Q160,205 215,250 L215,315 Z" fill="rgba(0,0,0,0.5)" />
      {/* 기단부 */}
      <rect x="30" y="325" width="260" height="30" fill="#6B5840" />
      <rect x="10" y="355" width="300" height="25" fill="#5A4A32" />
      {/* 홍등 */}
      <ellipse cx="100" cy="175" rx="10" ry="14" fill="#C4782A" opacity="0.7" />
      <ellipse cx="220" cy="175" rx="10" ry="14" fill="#C4782A" opacity="0.7" />
    </svg>
  )
}

export default function Hero() {
  const handleNav = (href) => document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden pt-24 pb-16">

      {/* 배경 빛망울 — 황토, 홍색 톤 */}
      <div className="orb w-[700px] h-[700px] -top-60 -left-40 opacity-25"
        style={{ background: 'radial-gradient(circle, #8B2820, transparent 68%)' }} />
      <div className="orb w-[500px] h-[500px] top-10 -right-20 opacity-15"
        style={{ background: 'radial-gradient(circle, #C4782A, transparent 70%)' }} />
      <div className="orb w-[350px] h-[350px] bottom-0 left-1/3 opacity-12"
        style={{ background: 'radial-gradient(circle, #3A5F7A, transparent 70%)' }} />

      {/* 창살 격자 배경 */}
      <div className="absolute inset-0 lattice pointer-events-none" />
      <div className="noise-overlay" />

      {/* 행궁 문 실루엣 */}
      <GateSilhouette />

      {/* 기와 지붕선 — 상단 */}
      <RoofLine className="absolute top-0 left-0 right-0 w-full h-20 opacity-80" />

      {/* 단청 상단 띠 */}
      <div className="absolute top-0 left-0 right-0 h-1 z-20" style={{
        background: 'linear-gradient(90deg, #8B2820 0%, #C4782A 25%, #3A5F7A 50%, #3D6B4A 75%, #8B2820 100%)'
      }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-14 items-center">

          {/* ── 왼쪽: 텍스트 ── */}
          <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-6">

            {/* 배지 */}
            <motion.div variants={fadeUp} className="self-start">
              <div className="glass rounded-full px-4 py-2 flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-hwang animate-pulse" />
                <span className="font-sans text-[11px] text-hwang/90 tracking-[0.18em]">
                  수원 화성 행궁 × AI 가상 피팅
                </span>
              </div>
            </motion.div>

            {/* 제목 */}
            <motion.h1 variants={fadeUp} className="font-serif font-bold leading-[1.1] text-5xl lg:text-6xl xl:text-[4.2rem]">
              <span className="block text-cream">전통의 아름다움,</span>
              <span className="block gradient-text mt-1.5">미래의 기술로</span>
            </motion.h1>

            {/* 부제 */}
            <motion.p variants={fadeUp} className="font-sans text-muted text-lg leading-relaxed max-w-md">
              수원 화성 행궁 내에서 30년 전통을 이어온 장금이 한복.
              AI 가상 피팅으로 나만의 한복 스타일을 찾아보세요.
            </motion.p>

            {/* CTA 버튼 */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4 mt-1">
              <button onClick={() => handleNav('#fitting')} className="btn-gold group animate-pulse-hwang">
                <Sparkles size={15} className="relative z-10" />
                <span className="relative z-10">AI 피팅 시작하기</span>
                <ArrowRight size={15} className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              <button onClick={() => handleNav('#collection')} className="btn-outline">
                컬렉션 보기
              </button>
            </motion.div>

            {/* 통계 */}
            <motion.div variants={fadeUp} className="flex gap-10 pt-4">
              {[
                { count: 2000, suffix: '+', label: '피팅 완료' },
                { count: 30,   suffix: '년', label: '전통 & 경력' },
                { count: 98,   suffix: '%', label: '만족도' },
              ].map((s, i) => (
                <div key={i} className="flex flex-col">
                  <span className="font-serif text-3xl font-bold gradient-text">
                    <AnimatedCounter target={s.count} suffix={s.suffix} />
                  </span>
                  <span className="font-sans text-xs text-muted mt-0.5">{s.label}</span>
                </div>
              ))}
            </motion.div>

            {/* 위치 배지 */}
            <motion.div variants={fadeUp}>
              <div className="inline-flex items-center gap-2.5 glass rounded-xl px-4 py-2.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-hwang flex-shrink-0">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <span className="font-sans text-xs text-muted">수원 화성 행궁 내 위치 — 경기 수원시 팔달구 남창동</span>
              </div>
            </motion.div>
          </motion.div>

          {/* ── 오른쪽: 한복 쇼케이스 카드 ── */}
          <div className="relative h-[480px] hidden lg:block">
            {showcaseCards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.82, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.85, delay: 0.7 + i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={{ scale: 1.05, zIndex: 10 }}
                className={`absolute rounded-3xl overflow-hidden shadow-2xl cursor-default select-none ${card.cls} ${
                  i === 0 ? 'w-52 h-72 top-0 left-14 z-30' :
                  i === 1 ? 'w-44 h-60 top-20 right-4  z-20' :
                             'w-40 h-56 bottom-2 left-2  z-10'
                }`}
              >
                <div className="absolute inset-0" style={{ background: card.gradient }} />
                {/* 기와 느낌 상단 장식 */}
                <div className="absolute top-0 left-0 right-0 h-1.5" style={{
                  background: 'linear-gradient(90deg, #8B2820, #C4782A, #8B2820)'
                }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="font-serif text-sm font-medium text-cream/90">{card.label}</span>
                </div>
              </motion.div>
            ))}

            {/* 랜턴 효과 */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.3 }}
              className="absolute top-2 right-20 z-40"
            >
              <div className="flex flex-col items-center">
                <div className="w-px h-8 bg-hwang/40" />
                <div className="glass rounded-xl px-3 py-2 flex items-center gap-2 animate-flicker">
                  <div className="w-2 h-2 rounded-full bg-hwang animate-pulse" style={{ boxShadow: '0 0 8px #C4782A' }} />
                  <span className="font-sans text-[11px] font-semibold text-hwang tracking-wide">행궁 내 직영점</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* 스크롤 인디케이터 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-35">
        <div className="w-px h-12 bg-gradient-to-b from-transparent to-hwang" />
        <span className="font-sans text-[10px] tracking-[0.28em] text-muted">스크롤</span>
      </div>
    </section>
  )
}
