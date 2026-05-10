import { Instagram, Youtube, MessageCircle, MapPin } from 'lucide-react'

const links = {
  서비스: [
    { href: '#fitting',    label: 'AI 가상 피팅' },
    { href: '#collection', label: '한복 컬렉션' },
    { href: '#about',      label: '브랜드 스토리' },
    { href: '#contact',    label: '맞춤 제작 상담' },
  ],
  카테고리: [
    { href: '#collection', label: '혼례 한복' },
    { href: '#collection', label: '궁중 한복' },
    { href: '#collection', label: '생활 한복' },
    { href: '#collection', label: '아동 한복' },
  ],
  고객지원: [
    { href: '#contact', label: '상담 문의' },
    { href: '#',        label: '배송 안내' },
    { href: '#',        label: '교환 / 반품' },
    { href: '#',        label: '사이즈 가이드' },
  ],
}

const handleNav = (href) => document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5" style={{ background: '#0A0703' }}>
      {/* 단청 구분선 */}
      <div className="dancheong-divider" />
      <div className="noise-overlay" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex flex-col leading-none mb-4">
              <span className="font-serif text-xl font-bold text-cream">장금이</span>
              <span className="font-sans text-[9px] tracking-[0.3em] text-hwang/70 mt-0.5">HANBOK</span>
            </div>
            <p className="font-sans text-sm text-muted leading-relaxed mb-4">
              전통의 아름다움을 현대의 기술로.<br />
              30년 장인의 손끝에서 완성됩니다.
            </p>

            {/* 위치 */}
            <div className="flex items-start gap-2 mb-5">
              <MapPin size={13} className="text-hwang mt-0.5 flex-shrink-0" />
              <p className="font-sans text-xs text-muted leading-relaxed">
                경기 수원시 팔달구<br />화성 행궁 내 직영점
              </p>
            </div>

            <div className="flex gap-3">
              {[
                { Icon: Instagram, label: '인스타그램' },
                { Icon: MessageCircle, label: '카카오채널' },
                { Icon: Youtube, label: '유튜브' },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-muted hover:text-hwang hover:border-hwang/30 transition-all duration-200"
                >
                  <Icon size={16} strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h4 className="font-sans text-xs font-semibold text-cream/50 uppercase tracking-wider mb-4">{title}</h4>
              <ul className="flex flex-col gap-3">
                {items.map((item) => (
                  <li key={item.label}>
                    <button
                      onClick={() => handleNav(item.href)}
                      className="font-sans text-sm text-muted hover:text-cream transition-colors duration-200"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-sans text-xs text-muted">© 2024 장금이 한복. All rights reserved.</p>
          <div className="flex gap-6">
            {['개인정보처리방침', '이용약관'].map((t) => (
              <a key={t} href="#" className="font-sans text-xs text-muted hover:text-cream transition-colors">{t}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
