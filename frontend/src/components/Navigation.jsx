import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'

const links = [
  { href: '#collection', label: '컬렉션' },
  { href: '#fitting',    label: 'AI 피팅' },
  { href: '#about',      label: '브랜드' },
  { href: '#contact',    label: '문의' },
]

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleNav = (href) => {
    setOpen(false)
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      {/* 단청 최상단 띠 */}
      <div className="fixed top-0 left-0 right-0 h-1 z-[60]" style={{
        background: 'linear-gradient(90deg, #8B2820 0%, #C4782A 25%, #3A5F7A 50%, #3D6B4A 75%, #8B2820 100%)'
      }} />

      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`fixed top-1 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'glass py-3 shadow-2xl shadow-black/60' : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* 로고 */}
          <a href="/" className="flex flex-col leading-none group">
            <span className="font-serif text-xl font-bold text-cream group-hover:text-hwang transition-colors duration-300">장금이</span>
            <span className="font-sans text-[9px] tracking-[0.3em] text-hwang/70 group-hover:text-hwang transition-colors duration-300">HANBOK</span>
          </a>

          {/* 데스크탑 링크 */}
          <ul className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <li key={l.href}>
                <button
                  onClick={() => handleNav(l.href)}
                  className="font-sans text-sm text-muted hover:text-cream transition-colors duration-200 relative group"
                >
                  {l.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-hwang transition-all duration-300 group-hover:w-full" />
                </button>
              </li>
            ))}
          </ul>

          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => handleNav('#fitting')} className="btn-gold text-xs px-5 py-2.5">
              <span className="relative z-10">AI 피팅 체험</span>
            </button>
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden relative z-50 p-2 text-cream hover:text-hwang transition-colors"
            aria-label="메뉴"
          >
            <AnimatePresence mode="wait">
              {open ? (
                <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <X size={22} />
                </motion.span>
              ) : (
                <motion.span key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Menu size={22} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.nav>

      {/* 모바일 메뉴 */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 glass flex flex-col items-center justify-center gap-8 md:hidden"
          >
            <div className="noise-overlay" />
            {links.map((l, i) => (
              <motion.button
                key={l.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3, delay: i * 0.07 }}
                onClick={() => handleNav(l.href)}
                className="font-serif text-3xl font-light text-cream hover:text-hwang transition-colors duration-200"
              >
                {l.label}
              </motion.button>
            ))}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, delay: links.length * 0.07 }}
              onClick={() => handleNav('#fitting')}
              className="btn-gold mt-4"
            >
              <span className="relative z-10">AI 피팅 체험하기</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
