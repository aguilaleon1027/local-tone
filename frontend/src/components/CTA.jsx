import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

/* 전통 처마 선 */
function EaveLine() {
  return (
    <svg viewBox="0 0 1200 80" className="absolute top-0 left-0 right-0 w-full pointer-events-none opacity-50" preserveAspectRatio="none">
      <path d="M0,80 L0,50 Q150,10 300,40 Q450,70 600,40 Q750,10 900,40 Q1050,70 1200,40 L1200,80 Z"
        fill="rgba(139,40,32,0.2)" />
      <path d="M0,80 L0,62 Q150,25 300,52 Q450,78 600,52 Q750,25 900,52 Q1050,78 1200,52 L1200,80 Z"
        fill="rgba(196,120,42,0.12)" />
    </svg>
  )
}

export default function CTA() {
  const handleNav = () => document.querySelector('#fitting')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section className="relative py-36 overflow-hidden">
      <EaveLine />
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(135deg, rgba(139,40,32,0.18) 0%, rgba(196,120,42,0.12) 50%, rgba(58,95,122,0.15) 100%)'
      }} />
      <div className="orb w-[700px] h-[700px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-18"
        style={{ background: 'radial-gradient(circle, #C4782A, transparent 60%)' }} />
      <div className="noise-overlay" />
      <div className="lattice absolute inset-0 opacity-60 pointer-events-none" />

      {/* 단청 구분선 */}
      <div className="absolute top-0 left-0 right-0 dancheong-divider" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="flex flex-col items-center gap-6"
        >
          {/* 홍등 아이콘 */}
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-2"
            style={{ background: 'rgba(196,120,42,0.15)', border: '1px solid rgba(196,120,42,0.25)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C4782A" strokeWidth="1.5">
              <path d="M12 2C6.48 2 2 6 2 9c0 3.5 4 7 10 12C18 16 22 12.5 22 9c0-3-4.48-7-10-7z"/>
              <circle cx="12" cy="9" r="3"/>
            </svg>
          </div>

          <h2 className="font-serif text-4xl lg:text-5xl font-bold text-cream leading-tight">
            화성 행궁에서 찾는<br />
            <span className="gradient-text">나만의 한복</span>
          </h2>
          <p className="font-sans text-muted text-lg">무료 AI 피팅으로 나만의 스타일을 찾아드립니다</p>
          <button onClick={handleNav} className="btn-gold text-base px-10 py-4 mt-2 animate-pulse-hwang">
            <Sparkles size={18} className="relative z-10" />
            <span className="relative z-10">무료 AI 피팅 체험</span>
          </button>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 dancheong-divider" />
    </section>
  )
}
