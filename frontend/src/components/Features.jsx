import { motion } from 'framer-motion'
import { Sparkles, Shield, Heart, Zap } from 'lucide-react'

const features = [
  {
    Icon: Sparkles,
    title: 'AI 가상 피팅',
    desc: '최신 AI 기술로 내 사진에 한복을 즉시 피팅해드립니다. 매장 방문 없이 수백 가지 스타일을 체험하세요.',
    topColor: '#C4782A',
    iconBg: 'rgba(196,120,42,0.12)',
    iconColor: 'text-hwang',
    border: 'border-hwang/10 hover:border-hwang/30',
    glow: 'rgba(196,120,42,0.06)',
  },
  {
    Icon: Shield,
    title: '전통 장인 정신',
    desc: '30년 경력의 전통 한복 장인이 한 땀 한 땀 정성으로 제작합니다. 화성 행궁의 품격을 담아냅니다.',
    topColor: '#8B2820',
    iconBg: 'rgba(139,40,32,0.12)',
    iconColor: 'text-hong',
    border: 'border-hong/10 hover:border-hong/30',
    glow: 'rgba(139,40,32,0.06)',
  },
  {
    Icon: Heart,
    title: '맞춤 제작',
    desc: '표준 사이즈부터 완전 맞춤 제작까지. 체형과 취향에 맞는 나만의 한복을 완성해드립니다.',
    topColor: '#3A5F7A',
    iconBg: 'rgba(58,95,122,0.12)',
    iconColor: 'text-cheong',
    border: 'border-cheong/10 hover:border-cheong/30',
    glow: 'rgba(58,95,122,0.06)',
  },
  {
    Icon: Zap,
    title: '빠른 제작 & 배송',
    desc: '주문 후 최소 7일 내 제작 완료. 전국 무료 배송과 함께 소중한 날을 위해 제때 도착합니다.',
    topColor: '#3D6B4A',
    iconBg: 'rgba(61,107,74,0.12)',
    iconColor: 'text-nok',
    border: 'border-nok/10 hover:border-nok/30',
    glow: 'rgba(61,107,74,0.06)',
  },
]

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
}
const card = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] } }
}

export default function Features() {
  return (
    <section id="features" className="relative py-32">
      <div className="noise-overlay" />
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="section-tag">WHY JANGGEUM</span>
          <h2 className="font-serif text-4xl lg:text-5xl font-bold text-cream mt-3">왜 장금이 한복인가요?</h2>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {features.map((f, i) => (
            <motion.div
              key={i}
              variants={card}
              className={`relative rounded-2xl border card-glow cursor-default overflow-hidden ${f.border}`}
              style={{ background: '#130E06' }}
            >
              {/* 단청 상단 선 */}
              <div className="h-[3px]" style={{ background: `linear-gradient(90deg, transparent, ${f.topColor}, transparent)` }} />
              <div className="p-7">
                <div className="noise-overlay" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: f.iconBg }}>
                    <f.Icon size={22} strokeWidth={1.5} className={f.iconColor} />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-cream mb-3">{f.title}</h3>
                  <p className="font-sans text-sm text-muted leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
