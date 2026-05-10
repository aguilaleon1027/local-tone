import { motion } from 'framer-motion'

const reviews = [
  {
    text: '"AI 피팅 덕분에 결혼식 한복을 고르는 게 너무 쉬웠어요. 실제로 입어보니 피팅 결과와 거의 똑같았습니다!"',
    name: '김지은',
    role: '웨딩 한복 구매',
    initial: 'K',
    gradient: 'linear-gradient(135deg, #8C1C2F, #1E3A6E)',
  },
  {
    text: '"아이 돌잔치 한복을 맞춰줬는데 퀄리티가 정말 최고예요. 장인분이 정성껏 만들어주신 게 느껴졌습니다."',
    name: '박수현',
    role: '아동 한복 구매',
    initial: 'P',
    gradient: 'linear-gradient(135deg, #F4A7B9, #FFD166)',
  },
  {
    text: '"궁중 한복 포토스튜디오 촬영에 입었는데 정말 아름다웠어요. 가상 피팅이 정확해서 고르기도 편했습니다."',
    name: '이민아',
    role: '궁중 한복 구매',
    initial: 'L',
    gradient: 'linear-gradient(135deg, #5B2D82, #C9A227)',
  },
  {
    text: '"생활 한복을 처음 도전해봤는데 AI 피팅으로 자신감이 생겼어요. 배송도 빠르고 마감도 깔끔합니다."',
    name: '최현우',
    role: '생활 한복 구매',
    initial: 'C',
    gradient: 'linear-gradient(135deg, #7FBEAC, #FFF8EE)',
  },
  {
    text: '"명절마다 장금이 한복에서 맞춥니다. 10년째 단골인데 품질이 한 번도 실망시킨 적이 없어요."',
    name: '오정희',
    role: '10년 단골',
    initial: 'O',
    gradient: 'linear-gradient(135deg, #C9A227, #3D7A6A)',
  },
]

const doubled = [...reviews, ...reviews]

function ReviewCard({ review }) {
  return (
    <div className="flex-shrink-0 w-80 glass rounded-2xl p-6 mx-3">
      <div className="flex gap-0.5 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className="text-gold text-sm">★</span>
        ))}
      </div>
      <p className="font-sans text-sm text-cream/80 leading-relaxed mb-5">{review.text}</p>
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-serif text-sm font-bold text-cream/90 flex-shrink-0"
          style={{ background: review.gradient }}
        >
          {review.initial}
        </div>
        <div>
          <p className="font-sans text-sm font-semibold text-cream">{review.name}</p>
          <p className="font-sans text-xs text-muted">{review.role}</p>
        </div>
      </div>
    </div>
  )
}

export default function Reviews() {
  return (
    <section id="reviews" className="relative py-32 overflow-hidden">
      <div className="noise-overlay" />

      <div className="max-w-7xl mx-auto px-6 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="section-tag">REVIEWS</span>
          <h2 className="font-serif text-4xl lg:text-5xl font-bold text-cream mt-3">고객 후기</h2>
        </motion.div>
      </div>

      <div className="relative">
        {/* Edge fades */}
        <div className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #07050c, transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, #07050c, transparent)' }} />

        <div className="flex" style={{ animation: 'marquee 40s linear infinite' }}>
          {doubled.map((r, i) => <ReviewCard key={i} review={r} />)}
        </div>
      </div>
    </section>
  )
}
