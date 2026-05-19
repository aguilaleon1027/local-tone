import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Tag } from 'lucide-react'
import { api } from '../utils/api'

function priceLabel(range) {
  const fmt = (n) => n >= 10000 ? `${(n / 10000).toFixed(0)}만` : `${n.toLocaleString()}`
  return `${fmt(range.min)} ~ ${fmt(range.max)}원`
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/5 animate-pulse" style={{ background: '#130E06' }}>
      <div className="aspect-[3/4]" style={{ background: '#1B1409' }} />
      <div className="p-4 space-y-2">
        <div className="h-4 rounded w-3/4" style={{ background: '#1B1409' }} />
        <div className="h-3 rounded w-1/2" style={{ background: '#1B1409' }} />
      </div>
    </div>
  )
}

function HanbokCard({ item, onFit }) {
  const [hovered, setHovered] = useState(false)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl overflow-hidden border border-white/5 group cursor-default card-glow"
      style={{ background: '#130E06' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] z-10"
          style={{ background: 'linear-gradient(90deg, #8B2820, #C4782A, #8B2820)' }} />
        <img
          src={item.image_url}
          alt={item.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg/80 via-transparent to-transparent" />

        {item.category && (
          <div className="absolute top-4 left-3">
            <span className="glass rounded-full px-2.5 py-0.5 font-sans text-[10px] text-cream/80 tracking-wide">
              {item.category}
            </span>
          </div>
        )}

        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(10,7,3,0.65)' }}
            >
              <button onClick={() => onFit(item)} className="btn-gold shadow-xl">
                <Sparkles size={15} className="relative z-10" />
                <span className="relative z-10">AI 피팅</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-serif text-sm font-semibold text-cream">{item.title}</h3>
            {item.color && <p className="font-sans text-[11px] text-muted mt-0.5">{item.color}</p>}
          </div>
          <span className="font-sans text-[11px] text-hwang shrink-0 mt-0.5">{item.category}</span>
        </div>
      </div>
    </motion.div>
  )
}

export default function Collection() {
  const [categories, setCategories] = useState([{ id: 'all', name: '전체' }])
  const [active, setActive] = useState('all')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getCategories().then(setCategories).catch(() => {}) }, [])

  useEffect(() => {
    setLoading(true)
    api.getCatalog(active)
      .then(setItems).catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [active])

  const handleFit = (item) => {
    document.querySelector('#fitting')?.scrollIntoView({ behavior: 'smooth' })
    setTimeout(() => window.dispatchEvent(new CustomEvent('prefill-hanbok', { detail: item })), 600)
  }

  return (
    <section id="collection" className="relative py-32" style={{ background: '#0F0B05' }}>
      <div className="noise-overlay" />
      <div className="orb w-96 h-96 top-0 right-0 opacity-10"
        style={{ background: 'radial-gradient(circle, #3A5F7A, transparent 70%)' }} />

      {/* 단청 구분선 */}
      <div className="absolute top-0 left-0 right-0 dancheong-divider" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="section-tag">COLLECTION</span>
          <h2 className="font-serif text-4xl lg:text-5xl font-bold text-cream mt-3">한복 컬렉션</h2>
          <p className="font-sans text-muted mt-3 text-lg">전통부터 현대까지, 다양한 스타일의 한복을 만나보세요.</p>
        </motion.div>

        {/* 카테고리 필터 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActive(cat.id)}
              className={`relative px-5 py-2 rounded-full font-sans text-sm transition-all duration-300 ${
                active === cat.id
                  ? 'text-cream font-semibold'
                  : 'text-muted hover:text-cream border border-white/10 hover:border-white/20'
              }`}
            >
              {active === cat.id && (
                <motion.span
                  layoutId="active-cat"
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'linear-gradient(135deg, #8B2820, #C4782A)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10">{cat.name}</span>
            </button>
          ))}
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-5">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <HanbokCard key={item.id} item={item} onFit={handleFit} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  )
}
