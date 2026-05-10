import { motion } from 'framer-motion'

const metrics = [
  { num: '30+', label: '년 전통' },
  { num: '50,000+', label: '제작 실적' },
  { num: '4.9', label: '평점' },
]

const visCards = [
  { label: '전통의 美', gradient: 'linear-gradient(145deg, #8C1C2F, #1E3A6E)' },
  { label: '장인 정신', gradient: 'linear-gradient(145deg, #5B2D82, #C9A227)' },
  { label: '미래 기술', gradient: 'linear-gradient(145deg, #2D6B59, #7FB069)' },
]

export default function About() {
  return (
    <section id="about" className="relative py-32" style={{ background: '#130E06' }}>
      <div className="noise-overlay" />
      {/* 기와 톤 빛망울 */}
      <div className="orb w-96 h-96 -top-20 right-0 opacity-12"
        style={{ background: 'radial-gradient(circle, #8B2820, transparent 70%)' }} />
      <div className="orb w-72 h-72 bottom-0 left-0 opacity-10"
        style={{ background: 'radial-gradient(circle, #3A5F7A, transparent 70%)' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* 단청 구분선 */}
        <div className="dancheong-divider mb-16 max-w-xs" />

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
            className="flex flex-col gap-6"
          >
            <span className="section-tag">OUR STORY</span>
            <h2 className="font-serif text-4xl lg:text-5xl font-bold text-cream leading-tight">
              수원 화성 행궁,<br />
              <span className="gradient-text">30년의 이야기</span>
            </h2>
            <p className="font-sans text-muted leading-relaxed">
              1994년 수원 화성 행궁 바로 옆 인사동에서 시작된 장금이 한복은 30년간 수많은 분들의 특별한 날을 함께해왔습니다. 조선의 얼이 살아있는 이 곳에서 한복의 아름다움을 지켜왔습니다.
            </p>
            <p className="font-sans text-muted leading-relaxed">
              전통 장인의 솜씨와 현대 AI 기술의 만남. 화성 행궁의 품격 그대로, 이제 누구나 집에서 편안하게 나만의 한복을 찾아보실 수 있습니다.
            </p>

            <div className="flex gap-8 mt-4">
              {metrics.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 * i }}
                  className="flex flex-col"
                >
                  <span className="font-serif text-3xl font-bold gradient-text">{m.num}</span>
                  <span className="font-sans text-xs text-muted mt-1">{m.label}</span>
                </motion.div>
              ))}
            </div>

            {/* 화성 행궁 위치 강조 */}
            <div className="glass rounded-xl p-4 flex items-center gap-3 self-start mt-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,40,32,0.2)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C4782A" strokeWidth="1.8">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div>
                <p className="font-sans text-xs font-semibold text-cream">화성 행궁 직영점</p>
                <p className="font-sans text-[11px] text-muted mt-0.5">경기 수원시 팔달구 행궁로 내</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <div className="grid grid-cols-3 grid-rows-2 gap-3 h-80 lg:h-96">
              {visCards.map((card, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  className={`relative rounded-2xl overflow-hidden ${i === 0 ? 'col-span-2 row-span-2' : ''}`}
                  style={{ background: card.gradient }}
                >
                  {/* 단청 상단 선 */}
                  <div className="absolute top-0 left-0 right-0 h-1" style={{
                    background: 'linear-gradient(90deg, #8B2820, #C4782A, #8B2820)'
                  }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg/60 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <span className="font-serif text-sm font-medium text-cream/90">{card.label}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
