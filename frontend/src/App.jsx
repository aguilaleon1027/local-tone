import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, LayoutGrid, MapPin, MessageSquare,
  Star, Phone, Clock, Globe,
  Coffee, UtensilsCrossed, ShoppingBag, Bus,
  Check, ChevronRight,
} from 'lucide-react'
import FittingWizard from './components/FittingWizard'
import { api } from './utils/api'

/* ── 데이터 ── */
const NEARBY = [
  { id: 1, name: '화성행궁',      cat: '궁궐',    dist: '2분',  hours: '09:00–18:00', emoji: '🏯' },
  { id: 2, name: '수원 화성',     cat: '문화유산', dist: '5분',  hours: '상시 개방',   emoji: '🏰' },
  { id: 3, name: '방화수류정',    cat: '누각',    dist: '10분', hours: '상시 개방',   emoji: '🛖' },
  { id: 4, name: '수원 남문시장', cat: '시장',    dist: '7분',  hours: '10:00–21:00', emoji: '🏪' },
  { id: 5, name: '수원 화성박물관', cat: '박물관', dist: '8분',  hours: '09:00–18:00', emoji: '🏛️' },
]
const SPONSORS = [
  { id: 1, name: '행궁동 전통 찻집', cat: '카페',  offer: '음료 10% 할인',     Icon: Coffee },
  { id: 2, name: '화성 순환 셔틀',   cat: '교통',  offer: '무료 탑승권 1매',   Icon: Bus },
  { id: 3, name: '왕갈비 원조가게', cat: '맛집',   offer: '세트 5,000원 할인', Icon: UtensilsCrossed },
  { id: 4, name: '행궁 기념품점',   cat: '쇼핑',   offer: '전 상품 15% 할인',  Icon: ShoppingBag },
]
const REVIEWS = [
  { id: 1, name: '김지은', role: '웨딩 한복', text: 'AI 피팅 덕분에 결혼식 한복을 고르는 게 너무 쉬웠어요. 피팅 결과와 거의 똑같았습니다!', av: '김' },
  { id: 2, name: '박수현', role: '아동 한복', text: '아이 돌잔치 한복 퀄리티가 최고예요. 장인분이 정성껏 만들어주신 게 느껴졌어요.', av: '박' },
  { id: 3, name: '이민아', role: '궁중 한복', text: '포토스튜디오 촬영에 입었는데 아름다웠어요. 가상 피팅이 정확해서 고르기도 편했어요.', av: '이' },
  { id: 4, name: '최현우', role: '생활 한복', text: '처음 한복 도전인데 AI 피팅으로 자신감이 생겼어요. 배송도 빠르고 마감도 깔끔해요.', av: '최' },
  { id: 5, name: '오정희', role: '10년 단골', text: '명절마다 장금이에서 맞춥니다. 10년째 단골인데 품질이 한 번도 실망시킨 적 없어요.', av: '오' },
]

/* ── 다국어 ── */
const I18N = {
  en: {
    short: 'EN',
    title: 'Book Your Hanbok Experience',
    subtitle: 'Traditional Korean clothing · Hwaseong Haenggung, Suwon',
    namePh: 'Full name',
    peoplePh: 'No. of guests',
    type: 'Experience Type',
    types: ['Try-on Only', 'Full Purchase', 'Wedding Hanbok', "Kids' Hanbok"],
    notePh: 'Special requests (size, occasion…)',
    submit: 'Request Booking',
    success: 'Booking Requested!',
    successSub: "We'll contact you within 24 hours.",
  },
  zh: {
    short: '中',
    title: '预约韩服体验',
    subtitle: '韩国传统服装 · 水原华城行宫',
    namePh: '请输入您的姓名',
    peoplePh: '人数（例：2人）',
    type: '体验类型',
    types: ['试穿体验', '购买韩服', '婚礼韩服', '儿童韩服'],
    notePh: '尺寸、场合等特殊要求',
    submit: '提交预约',
    success: '预约已提交！',
    successSub: '我们将在24小时内与您联系。',
  },
  ja: {
    short: '日',
    title: '韓服体験のご予約',
    subtitle: '韓国伝統衣装 · 水原華城行宮',
    namePh: 'お名前を入力',
    peoplePh: '人数（例：2名）',
    type: '体験タイプ',
    types: ['試着体験', '韓服購入', '結婚式韓服', 'お子様韓服'],
    notePh: 'サイズ・ご要望など',
    submit: '予約する',
    success: '予約受付完了！',
    successSub: '24時間以内にご連絡いたします。',
  },
}

/* ── 공용 섹션 헤더 ── */
function SectionHeader({ title, sub }) {
  return (
    <div className="px-5 pt-6 pb-3">
      <h2 className="font-sans font-bold text-[17px]" style={{ color: '#111111', letterSpacing: '-0.03em' }}>
        {title}
      </h2>
      {sub && <p className="font-sans text-[11px] mt-0.5" style={{ color: '#999999' }}>{sub}</p>}
    </div>
  )
}

/* ── 구분선 ── */
const DIV = { borderBottom: '1px solid #E8E8E8' }
const CARD_STYLE = { background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: '12px' }

/* ══════════════════════════════════════
   피팅 탭
══════════════════════════════════════ */
function FittingTab() {
  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-white">
      {/* 히어로 */}
      <div className="px-5 pt-8 pb-6" style={DIV}>
        <p className="font-sans font-bold text-[10px] tracking-[0.25em] uppercase mb-4" style={{ color: '#999999' }}>
          AI Virtual Fitting · 2025
        </p>

        <h1 className="font-sans font-bold leading-[1.12]" style={{ fontSize: '32px', color: '#111111', letterSpacing: '-0.045em' }}>
          나에게 어울리는<br />한복을 찾아보세요
        </h1>
        <p className="font-sans text-[13px] mt-3" style={{ color: '#999999', letterSpacing: '-0.01em' }}>
          30년 전통 · 수원 화성 행궁 직영
        </p>

        {/* 통계 */}
        <div className="flex mt-6 pt-5" style={{ borderTop: '1px solid #E8E8E8' }}>
          {[['2,000+', '피팅 완료'], ['30년', '전통 경력'], ['98%', '만족도']].map(([n, l], idx) => (
            <div
              key={l}
              className={`flex-1 ${idx > 0 ? 'pl-4' : ''}`}
              style={idx > 0 ? { borderLeft: '1px solid #E8E8E8' } : {}}
            >
              <p className="font-sans font-black text-[20px]" style={{ color: '#111111', letterSpacing: '-0.04em' }}>{n}</p>
              <p className="font-sans text-[10px] font-medium uppercase tracking-wide mt-0.5" style={{ color: '#999999' }}>{l}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 pb-6 bg-bg">
        <FittingWizard />
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   컬렉션 탭
══════════════════════════════════════ */
function CollectionTab({ onFit }) {
  const [items, setItems] = useState([])
  const [cats, setCats] = useState([])
  const [active, setActive] = useState('전체')

  useEffect(() => {
    api.getCatalog().then(setItems).catch(() => {})
    api.getCategories().then((data) => {
      const names = Array.isArray(data)
        ? data.map((c) => typeof c === 'string' ? c : c.name).filter((n) => n && n !== '전체' && n !== 'all')
        : []
      setCats(names)
    }).catch(() => {})
  }, [])

  const filtered = active === '전체' ? items : items.filter((i) => i.category === active)

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 카테고리 필터 */}
      <div className="flex-none px-4 py-2.5 bg-white" style={DIV}>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {['전체', ...cats].map((c) => (
            <motion.button
              key={c}
              onClick={() => setActive(c)}
              whileTap={{ scale: 0.94 }}
              className="flex-none px-3.5 py-1.5 rounded-full text-[12px] whitespace-nowrap transition-all duration-150"
              style={active === c
                ? { background: '#111111', color: '#FFFFFF', fontWeight: 700, letterSpacing: '-0.01em' }
                : { background: '#F2F2F2', color: '#555555', fontWeight: 500, letterSpacing: '-0.01em' }}
            >
              {c}
            </motion.button>
          ))}
        </div>
      </div>

      {/* 무신사 격자 그리드 */}
      <div className="flex-1 overflow-y-auto no-scrollbar bg-bg">
        <div className="grid grid-cols-2 gap-px" style={{ background: '#E8E8E8' }}>
          <AnimatePresence>
            {filtered.map((item, idx) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, delay: idx * 0.02 }}
                className="bg-white p-3"
              >
                {/* 썸네일 */}
                <div className="aspect-[3/4] rounded-lg overflow-hidden relative mb-2.5"
                  style={{ background: item.gradient || '#F2F2F2' }}>
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.5),transparent 50%)' }} />
                  <span
                    className="absolute top-2 left-2 text-[9px] font-bold text-white tracking-wide uppercase px-1.5 py-0.5"
                    style={{ background: 'rgba(0,0,0,0.35)', borderRadius: '3px', backdropFilter: 'blur(4px)' }}
                  >
                    {item.category}
                  </span>
                </div>

                <p className="font-sans font-bold text-[13px] leading-tight" style={{ color: '#111111', letterSpacing: '-0.02em' }}>
                  {item.name}
                </p>
                <p className="font-sans font-semibold text-[12px] mt-0.5" style={{ color: '#555555' }}>
                  {item.price_range?.min?.toLocaleString()}원~
                </p>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onFit(item.id)}
                  className="mt-2.5 w-full py-2 text-[11px] font-bold rounded-lg transition-all duration-150 active:bg-black active:text-white"
                  style={{ border: '1.5px solid #111111', color: '#111111', letterSpacing: '-0.01em', background: 'transparent' }}
                >
                  피팅해보기
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   주변 탭
══════════════════════════════════════ */
function NearbyTab() {
  const [sub, setSub] = useState('nearby')

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 서브탭 — 언더라인 */}
      <div className="flex-none px-5 pt-4 bg-white" style={DIV}>
        <div className="flex">
          {[{ id: 'nearby', label: '주변 볼거리' }, { id: 'sponsors', label: '파트너 혜택' }].map((t) => (
            <button
              key={t.id}
              onClick={() => setSub(t.id)}
              className="flex-1 pb-3 text-[13px] font-semibold relative transition-colors duration-150"
              style={{ color: sub === t.id ? '#111111' : '#BBBBBB', letterSpacing: '-0.02em' }}
            >
              {t.label}
              {sub === t.id && (
                <motion.div
                  layoutId="sub-line"
                  className="absolute bottom-0 left-0 right-0"
                  style={{ height: '2px', background: '#111111', borderRadius: '2px 2px 0 0' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar bg-white px-5 py-4">
        <AnimatePresence mode="wait">
          {sub === 'nearby' ? (
            <motion.div key="nearby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
              {/* 위치 안내 */}
              <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-4" style={{ background: '#F2F2F2' }}>
                <MapPin size={14} style={{ color: '#111111' }} className="flex-shrink-0" />
                <div>
                  <p className="font-sans font-semibold text-[12px]" style={{ color: '#111111', letterSpacing: '-0.02em' }}>
                    장금이 한복 기준 도보 거리
                  </p>
                  <p className="font-sans text-[11px]" style={{ color: '#999999' }}>경기 수원시 팔달구 행궁로 일대</p>
                </div>
              </div>

              {NEARBY.map((place, idx) => (
                <motion.div
                  key={place.id}
                  whileTap={{ scale: 0.99 }}
                  className="flex items-center gap-3 py-4"
                  style={idx < NEARBY.length - 1 ? { borderBottom: '1px solid #F2F2F2' } : {}}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: '#F2F2F2' }}>
                    {place.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-sans font-bold text-[13px]" style={{ color: '#111111', letterSpacing: '-0.02em' }}>
                        {place.name}
                      </p>
                      <span className="font-sans text-[9px] font-bold px-1.5 py-0.5"
                        style={{ background: '#F2F2F2', color: '#555555', borderRadius: '3px' }}>
                        {place.cat}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="font-sans text-[11px]" style={{ color: '#999999' }}>도보 {place.dist}</span>
                      <span className="font-sans text-[11px]" style={{ color: '#999999' }}>{place.hours}</span>
                    </div>
                  </div>
                  <ChevronRight size={14} style={{ color: '#D0D0D0' }} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div key="sponsors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
              {/* 배너 */}
              <div className="rounded-xl px-4 py-3.5 mb-4" style={{ background: '#F2F2F2' }}>
                <p className="font-sans font-bold text-[10px] tracking-[0.18em] uppercase mb-1" style={{ color: '#555555' }}>
                  Partner Benefits
                </p>
                <p className="font-sans text-[12px]" style={{ color: '#555555', letterSpacing: '-0.01em' }}>
                  구매·체험 영수증 제시 시 파트너 업체 할인 혜택
                </p>
              </div>

              {SPONSORS.map((sp, idx) => (
                <motion.div
                  key={sp.id}
                  whileTap={{ scale: 0.99 }}
                  className="flex items-center gap-3 py-4"
                  style={idx < SPONSORS.length - 1 ? { borderBottom: '1px solid #F2F2F2' } : {}}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: '#F2F2F2' }}>
                    <sp.Icon size={18} style={{ color: '#111111' }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-sans font-bold text-[13px]" style={{ color: '#111111', letterSpacing: '-0.02em' }}>{sp.name}</p>
                    <p className="font-sans text-[11px]" style={{ color: '#999999' }}>{sp.cat}</p>
                  </div>
                  <span className="font-sans font-bold text-[11px]" style={{ color: '#111111' }}>{sp.offer}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   정보 탭
══════════════════════════════════════ */
function InfoTab() {
  const [form, setForm] = useState({ name: '', phone: '', message: '' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState('en')
  const [bookForm, setBookForm] = useState({ name: '', date: '', people: '', type: '', note: '' })
  const [bookSent, setBookSent] = useState(false)
  const [bookLoading, setBookLoading] = useState(false)
  const t = I18N[lang]

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.phone) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 700))
    setLoading(false); setSent(true)
  }
  const submitBook = async (e) => {
    e.preventDefault()
    if (!bookForm.name || !bookForm.date) return
    setBookLoading(true)
    await new Promise((r) => setTimeout(r, 700))
    setBookLoading(false); setBookSent(true)
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-bg">
      {/* 리뷰 */}
      <SectionHeader title="고객 후기" sub={`별점 5.0 · 리뷰 ${REVIEWS.length}개`} />
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-2">
        {REVIEWS.map((r) => (
          <div key={r.id} className="bg-white rounded-xl p-4 flex-none w-56" style={{ border: '1px solid #E8E8E8' }}>
            <div className="flex gap-0.5 mb-2.5">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={10} className="fill-current" style={{ color: '#111111' }} />)}
            </div>
            <p className="font-sans text-[12px] leading-relaxed line-clamp-3" style={{ color: '#555555', letterSpacing: '-0.01em' }}>
              {r.text}
            </p>
            <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid #F2F2F2' }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                style={{ background: '#111111' }}>
                {r.av}
              </div>
              <div>
                <p className="font-sans font-semibold text-[11px] leading-none" style={{ color: '#111111' }}>{r.name}</p>
                <p className="font-sans text-[10px]" style={{ color: '#999999' }}>{r.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 매장 정보 */}
      <SectionHeader title="매장 안내" />
      <div className="mx-5 overflow-hidden" style={CARD_STYLE}>
        {[
          { Icon: MapPin, label: '위치',     value: '수원 화성 행궁 내 직영점', sub: '경기 수원시 팔달구 행궁로' },
          { Icon: Phone,  label: '전화',     value: '02-1234-5678',            sub: '평일 10:00–18:00' },
          { Icon: Clock,  label: '운영시간', value: '10:00–19:00',             sub: '매주 화요일 휴무' },
        ].map(({ Icon, label, value, sub }, idx, arr) => (
          <div key={label} className="flex items-center gap-3 px-4 py-3.5 bg-white"
            style={idx < arr.length - 1 ? { borderBottom: '1px solid #F2F2F2' } : {}}>
            <Icon size={14} style={{ color: '#BBBBBB' }} className="flex-shrink-0" />
            <div>
              <p className="font-sans font-bold text-[9px] tracking-[0.15em] uppercase" style={{ color: '#BBBBBB' }}>{label}</p>
              <p className="font-sans font-semibold text-[13px]" style={{ color: '#111111', letterSpacing: '-0.02em' }}>{value}</p>
              <p className="font-sans text-[11px]" style={{ color: '#999999' }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 외국인 예약 */}
      <div className="px-5 pt-6 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe size={15} style={{ color: '#111111' }} />
            <h2 className="font-sans font-bold text-[17px]" style={{ color: '#111111', letterSpacing: '-0.03em' }}>
              International Booking
            </h2>
          </div>
          {/* 언어 선택 */}
          <div className="flex gap-px overflow-hidden" style={{ border: '1.5px solid #E0E0E0', borderRadius: '8px' }}>
            {Object.entries(I18N).map(([k, v]) => (
              <button
                key={k}
                onClick={() => { setLang(k); setBookSent(false) }}
                className="px-2.5 py-1 text-[11px] font-bold transition-all duration-150"
                style={lang === k
                  ? { background: '#111111', color: '#FFFFFF' }
                  : { background: '#FFFFFF', color: '#999999' }}
              >
                {v.short}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-4" style={CARD_STYLE}>
          <p className="font-sans text-[11px] mb-4" style={{ color: '#999999' }}>{t.subtitle}</p>
          <AnimatePresence mode="wait">
            {bookSent ? (
              <motion.div key="book-done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-8 gap-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-1" style={{ background: '#F2F2F2' }}>
                  <Check size={22} style={{ color: '#111111' }} strokeWidth={2.5} />
                </div>
                <p className="font-sans font-bold text-[15px]" style={{ color: '#111111', letterSpacing: '-0.02em' }}>{t.success}</p>
                <p className="font-sans text-[12px] text-center" style={{ color: '#999999' }}>{t.successSub}</p>
              </motion.div>
            ) : (
              <motion.form key={`book-${lang}`} onSubmit={submitBook} className="space-y-2.5">
                <input className="input-field text-[13px]" placeholder={t.namePh} value={bookForm.name}
                  onChange={(e) => setBookForm((p) => ({ ...p, name: e.target.value }))} />
                <input type="date" className="input-field text-[13px]" value={bookForm.date}
                  onChange={(e) => setBookForm((p) => ({ ...p, date: e.target.value }))} />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" min="1" className="input-field text-[13px]" placeholder={t.peoplePh} value={bookForm.people}
                    onChange={(e) => setBookForm((p) => ({ ...p, people: e.target.value }))} />
                  <select className="input-field text-[13px]" value={bookForm.type}
                    onChange={(e) => setBookForm((p) => ({ ...p, type: e.target.value }))}>
                    <option value="">{t.type}</option>
                    {t.types.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
                  </select>
                </div>
                <textarea rows={2} className="input-field resize-none text-[13px]" placeholder={t.notePh} value={bookForm.note}
                  onChange={(e) => setBookForm((p) => ({ ...p, note: e.target.value }))} />
                <motion.button type="submit" whileTap={{ scale: 0.98 }} disabled={bookLoading}
                  className="btn-gold w-full justify-center disabled:opacity-40">
                  {bookLoading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t.submit}</>
                    : t.submit}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 한국어 상담 */}
      <SectionHeader title="구매 상담 신청" sub="한국어 문의" />
      <div className="mx-5 mb-8 p-4" style={CARD_STYLE}>
        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-8 gap-2">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-1" style={{ background: '#F2F2F2' }}>
                <Check size={22} style={{ color: '#111111' }} strokeWidth={2.5} />
              </div>
              <p className="font-sans font-bold text-[15px]" style={{ color: '#111111', letterSpacing: '-0.02em' }}>접수 완료!</p>
              <p className="font-sans text-[12px] text-center" style={{ color: '#999999' }}>빠른 시간 내에 연락드리겠습니다.</p>
            </motion.div>
          ) : (
            <motion.form key="kr-form" onSubmit={submit} className="space-y-2.5">
              <input className="input-field" placeholder="이름" value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              <input className="input-field" placeholder="연락처" type="tel" value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              <textarea className="input-field resize-none" rows={3} placeholder="문의 내용 (행사, 일정 등)" value={form.message}
                onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} />
              <motion.button type="submit" whileTap={{ scale: 0.98 }} disabled={loading}
                className="btn-gold w-full justify-center disabled:opacity-40">
                {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />처리중...</> : '상담 신청하기'}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      <p className="text-center font-sans text-[10px] pb-6" style={{ color: '#D0D0D0' }}>
        © 2025 장금이 한복. All rights reserved.
      </p>
    </div>
  )
}

/* ── 탭 ── */
const TABS = [
  { id: 'fitting',    label: '피팅',   Icon: Sparkles },
  { id: 'collection', label: '컬렉션', Icon: LayoutGrid },
  { id: 'nearby',     label: '주변',   Icon: MapPin },
  { id: 'info',       label: '정보',   Icon: MessageSquare },
]

export default function App() {
  const [tab, setTab] = useState('fitting')

  const handleFit = useCallback((hanbokId) => {
    window.dispatchEvent(new CustomEvent('prefill-hanbok', { detail: { id: hanbokId } }))
    setTab('fitting')
  }, [])

  useEffect(() => {
    const h = (e) => setTab(e.detail?.tab || 'fitting')
    window.addEventListener('switch-tab', h)
    return () => window.removeEventListener('switch-tab', h)
  }, [])

  return (
    <div className="flex flex-col" style={{ height: '100dvh', maxWidth: '480px', margin: '0 auto', background: '#F8F8F8' }}>

      {/* 헤더 */}
      <header className="flex-none flex items-center justify-between px-5 safe-top bg-white" style={{ height: '52px', borderBottom: '1px solid #E8E8E8' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#111111' }}>
            <span className="font-serif text-white text-[11px] font-bold">장</span>
          </div>
          <span className="font-serif text-[15px] font-bold" style={{ color: '#111111', letterSpacing: '-0.02em' }}>
            장금이 한복
          </span>
        </div>
        <span className="font-sans text-[10px] font-semibold px-2.5 py-1 rounded-full"
          style={{ background: '#F2F2F2', color: '#555555', letterSpacing: '-0.01em' }}>
          수원 화성 행궁
        </span>
      </header>

      {/* 콘텐츠 */}
      <main className="flex-1 overflow-hidden relative" style={{ background: '#F8F8F8' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            {tab === 'fitting'    && <FittingTab />}
            {tab === 'collection' && <CollectionTab onFit={handleFit} />}
            {tab === 'nearby'     && <NearbyTab />}
            {tab === 'info'       && <InfoTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 탭바 */}
      <nav className="flex-none flex bg-white safe-bottom" style={{ height: '56px', borderTop: '1px solid #E8E8E8' }}>
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id
          return (
            <motion.button
              key={id}
              onClick={() => setTab(id)}
              whileTap={{ scale: 0.88 }}
              className="relative flex-1 flex flex-col items-center justify-center gap-1"
            >
              {active && (
                <motion.div
                  layoutId="tab-line"
                  className="absolute top-0 left-3 right-3"
                  style={{ height: '2px', background: '#111111', borderRadius: '0 0 2px 2px' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <Icon
                size={18}
                strokeWidth={active ? 2.3 : 1.7}
                style={{ color: active ? '#111111' : '#CCCCCC' }}
                className="transition-colors duration-150"
              />
              <span className="font-sans text-[10px] transition-colors duration-150"
                style={{ color: active ? '#111111' : '#CCCCCC', fontWeight: active ? 700 : 400, letterSpacing: '-0.01em' }}>
                {label}
              </span>
            </motion.button>
          )
        })}
      </nav>
    </div>
  )
}
