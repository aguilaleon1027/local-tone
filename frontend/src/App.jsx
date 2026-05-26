import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, LayoutGrid, MapPin, Calendar,
  Globe, Check,
} from 'lucide-react'
import FittingWizard from './components/FittingWizard'
import NearbyMap from './components/NearbyMap'
import { api } from './utils/api'

/* ── 다국어 ── */
const I18N = {
  en: {
    short: 'EN',
    title: 'International Booking',
    subtitle: 'Traditional Korean clothing · Hwaseong Haenggung, Suwon',
    namePh: 'Full name *',
    contactPh: 'WhatsApp / Instagram / KakaoTalk (optional)',
    emailPh: 'Email *',
    dateLabel: 'Booking Date *',
    dateHint: 'Year / Month / Day',
    hanbokLabel: 'Select Hanbok',
    hanbokSub: 'Multiple selection allowed · Each hanbok is booked separately',
    submit: 'Request Booking',
    success: 'Booking Requested!',
    successSub: "We'll contact you within 24 hours.",
    newBooking: 'New Booking',
  },
  zh: {
    short: '中',
    title: '国际预约',
    subtitle: '韩国传统服装 · 水原华城行宫',
    namePh: '姓名 *',
    contactPh: 'WhatsApp / Instagram / KakaoTalk（选填）',
    emailPh: '电子邮件 *',
    dateLabel: '预约日期 *',
    dateHint: '年 / 月 / 日',
    hanbokLabel: '选择韩服',
    hanbokSub: '可多选 · 每件韩服分别登记预约',
    submit: '提交预约',
    success: '预约已提交！',
    successSub: '我们将在24小时内与您联系。',
    newBooking: '重新预约',
  },
  ja: {
    short: '日',
    title: '国際予約',
    subtitle: '韓国伝統衣装 · 水原華城行宮',
    namePh: 'お名前 *',
    contactPh: 'WhatsApp / Instagram / KakaoTalk（任意）',
    emailPh: 'メールアドレス *',
    dateLabel: 'ご予約日 *',
    dateHint: '年 / 月 / 日',
    hanbokLabel: '韓服を選択',
    hanbokSub: '複数選択可 · 韓服ごとに予約が登録されます',
    submit: '予約する',
    success: '予約受付完了！',
    successSub: '24時間以内にご連絡いたします。',
    newBooking: '新規予約',
  },
}

/* ── 공용 섹션 헤더 ── */
function SectionHeader({ title, sub }) {
  return (
    <div className="px-5 pt-6 pb-3">
      <div className="flex items-start gap-2.5">
        <div style={{ width: '3px', height: '18px', marginTop: '2px', background: '#B8975A', borderRadius: '2px', flexShrink: 0 }} />
        <div>
          <h2 className="font-serif font-bold text-[17px]" style={{ color: '#3D2314', letterSpacing: '0' }}>
            {title}
          </h2>
          {sub && <p className="font-sans text-[11px] mt-0.5" style={{ color: '#9C8572' }}>{sub}</p>}
        </div>
      </div>
    </div>
  )
}

/* ── 단청 스트라이프 패턴 ── */
const DANCHEONG_STRIPE = `repeating-linear-gradient(90deg,
  #B8975A 0px, #B8975A 6px,
  #3D2314 6px, #3D2314 9px,
  #D4C4B0 9px, #D4C4B0 11px,
  #3D2314 11px, #3D2314 14px,
  #B8975A 14px, #B8975A 20px
)`

/* ── 전통 장식 구분선 ── */
function TradDivider() {
  return (
    <div>
      <div style={{ height: '3px', background: DANCHEONG_STRIPE }} />
      <div className="flex items-center gap-3 px-5 py-2">
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, #D4C4B0)' }} />
        <span className="font-serif" style={{ color: '#B8975A', fontSize: '11px', lineHeight: 1 }}>◈</span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, #D4C4B0)' }} />
      </div>
      <div style={{ height: '3px', background: DANCHEONG_STRIPE }} />
    </div>
  )
}

/* ── 구분선 ── */
const DIV = { borderBottom: '1px solid #D4C4B0' }
const CARD_STYLE = { background: '#FDFAF6', border: '1px solid #D4C4B0', borderRadius: '12px' }

/* ══════════════════════════════════════
   피팅 탭
══════════════════════════════════════ */
/* ── 한복 선택 그리드 (예약 폼 공용) ── */
function HanbokSelectGrid({ items, selected, onToggle, label, subLabel }) {
  return (
    <div style={{ borderTop: '1px solid #D4C4B0', paddingTop: '14px' }}>
      <div className="flex items-center justify-between mb-1">
        <p className="font-sans font-bold text-[12px]" style={{ color: '#3D2314' }}>{label}</p>
        {selected.length > 0 && (
          <span className="font-sans font-bold text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#3D2314', color: '#FDFAF6' }}>
            {selected.length}
          </span>
        )}
      </div>
      <p className="font-sans text-[11px] mb-3" style={{ color: '#9C8572' }}>{subLabel}</p>
      {items.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: '#D4C4B0', borderTopColor: '#3D2314' }} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => {
            const isSelected = selected.some((h) => h.id === item.id)
            return (
              <motion.div
                key={item.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => onToggle(item)}
                className="relative rounded-xl overflow-hidden cursor-pointer"
                style={{ outline: isSelected ? '2.5px solid #3D2314' : '2.5px solid transparent', outlineOffset: '-1px' }}
              >
                <div className="aspect-[3/4] relative" style={{ background: '#EDE0CF' }}>
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent 55%)' }} />
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#3D2314' }}>
                      <Check size={11} style={{ color: '#FDFAF6' }} strokeWidth={3} />
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 p-2">
                    <p className="font-sans font-semibold text-[11px] text-white leading-tight truncate" style={{ letterSpacing: '-0.01em' }}>{item.title}</p>
                    <p className="font-sans text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>{item.category}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── 한복 선택 토글 헬퍼 ── */
const toggleItem = (prev, item) =>
  prev.some((h) => h.id === item.id)
    ? prev.filter((h) => h.id !== item.id)
    : [...prev, item]

/* ── 예약 submit 공통 로직 ── */
async function submitBookingData(form, selectedHanboks, setSubmitting, setDone, errorMsg) {
  if (!form.name) return
  setSubmitting(true)
  try {
    const targets = selectedHanboks.length > 0 ? selectedHanboks : [{ id: null }]
    await Promise.all(targets.map((h) => api.createBooking({
      name: form.name,
      phone: form.phone,
      email: form.email || null,
      booking_date: form.booking_date || null,
      hanbok_id: h.id || null,
      hanbok_title: h.title || null,
    })))
    setDone(true)
  } catch {
    alert(errorMsg)
  } finally {
    setSubmitting(false)
  }
}

function FittingTab({ catalog }) {
  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-white">
      {/* 히어로 */}
      <div className="px-5 pt-8 pb-6 relative overflow-hidden" style={DIV}>
        {/* 배경 마름모 패턴 (단청 느낌) */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(45deg, rgba(184,151,90,0.12) 1px, transparent 1px),
                            linear-gradient(-45deg, rgba(184,151,90,0.12) 1px, transparent 1px)`,
          backgroundSize: '18px 18px',
        }} />

        {/* 장식 태그 */}
        <div className="flex items-center gap-2 mb-4">
          <span style={{ display: 'inline-block', width: '16px', height: '1px', background: '#B8975A', flexShrink: 0 }} />
          <p className="font-serif text-[10px]" style={{ color: '#B8975A', letterSpacing: '0.15em', whiteSpace: 'nowrap' }}>
            장금이 한복 · {new Date().getFullYear()}
          </p>
          <span style={{ display: 'inline-block', width: '16px', height: '1px', background: '#B8975A', flexShrink: 0 }} />
        </div>

        <h1 className="font-serif font-bold leading-[1.22]" style={{ fontSize: '30px', color: '#3D2314' }}>
          나에게 어울리는<br />한복을 찾아보세요
        </h1>

        <p className="font-sans text-[13px] mt-3" style={{ color: '#9C8572', letterSpacing: '-0.01em' }}>
          30년 전통 · 수원 화성 행궁 직영
        </p>

        {/* 통계 */}
        <div className="mt-6">
          <div style={{ height: '2px', borderRadius: '2px', background: DANCHEONG_STRIPE, marginBottom: '16px' }} />
          <div className="flex">
            {[['2,000+', '피팅 완료'], ['30년', '전통 경력'], ['98%', '만족도']].map(([n, l], idx) => (
              <div
                key={l}
                className={`flex-1 ${idx > 0 ? 'pl-4' : ''}`}
                style={idx > 0 ? { borderLeft: '1px solid #D4C4B0' } : {}}
              >
                <p className="font-serif font-bold text-[20px]" style={{ color: '#3D2314' }}>{n}</p>
                <p className="font-sans text-[10px] font-medium uppercase tracking-wide mt-0.5" style={{ color: '#9C8572' }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-6 bg-bg">
        <FittingWizard catalog={catalog} />
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   컬렉션 탭
══════════════════════════════════════ */
function CollectionTab({ onFit, catalog }) {
  const [active, setActive] = useState('전체')

  const cats = [...new Set(catalog.map((i) => i.category).filter(Boolean))].sort()
  const filtered = active === '전체' ? catalog : catalog.filter((i) => i.category === active)

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
                ? { background: '#3D2314', color: '#FDFAF6', fontWeight: 700, letterSpacing: '-0.01em' }
                : { background: '#EDE0CF', color: '#6B4C35', fontWeight: 500, letterSpacing: '-0.01em' }}
            >
              {c}
            </motion.button>
          ))}
        </div>
      </div>

      {/* 무신사 격자 그리드 */}
      <div className="flex-1 overflow-y-auto no-scrollbar bg-bg">
        <div className="grid grid-cols-2 gap-px" style={{ background: '#D4C4B0' }}>
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
                  style={{ background: '#EDE0CF' }}>
                  {item.image_url && (
                    <img src={item.image_url} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.45),transparent 50%)' }} />
                  <span
                    className="absolute top-2 left-2 text-[9px] font-bold text-white tracking-wide uppercase px-1.5 py-0.5"
                    style={{ background: 'rgba(0,0,0,0.35)', borderRadius: '3px', backdropFilter: 'blur(4px)' }}
                  >
                    {item.category}
                  </span>
                </div>

                <p className="font-sans font-bold text-[13px] leading-tight" style={{ color: '#3D2314', letterSpacing: '-0.02em' }}>
                  {item.title}
                </p>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onFit(item.id)}
                  className="mt-2.5 w-full py-2 text-[11px] font-bold rounded-lg transition-all duration-150 active:bg-black active:text-white"
                  style={{ border: '1.5px solid #3D2314', color: '#3D2314', letterSpacing: '-0.01em', background: 'transparent' }}
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
  return (
    <div className="h-full overflow-hidden">
      <NearbyMap appKey={import.meta.env.VITE_KAKAO_MAP_KEY || ''} />
    </div>
  )
}

/* ══════════════════════════════════════
   정보 탭
══════════════════════════════════════ */
function InfoTab({ catalog }) {
  const [lang, setLang] = useState('en')
  const t = I18N[lang]

  const [bookingForm, setBookingForm] = useState({ name: '', phone: '', email: '', booking_date: '' })
  const [selectedHanboks, setSelectedHanboks] = useState([])
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [bookingDone, setBookingDone] = useState(false)

  const [intlForm, setIntlForm] = useState({ name: '', phone: '', email: '', booking_date: '' })
  const [intlSelectedHanboks, setIntlSelectedHanboks] = useState([])
  const [intlSubmitting, setIntlSubmitting] = useState(false)
  const [intlDone, setIntlDone] = useState(false)

  const toggleHanbok = (item) => setSelectedHanboks((prev) => toggleItem(prev, item))
  const toggleIntlHanbok = (item) => setIntlSelectedHanboks((prev) => toggleItem(prev, item))

  const submitBooking = (e) => { e.preventDefault(); submitBookingData(bookingForm, selectedHanboks, setBookingSubmitting, setBookingDone, '예약 신청 중 오류가 발생했습니다. 다시 시도해주세요.') }
  const submitIntl = (e) => { e.preventDefault(); submitBookingData(intlForm, intlSelectedHanboks, setIntlSubmitting, setIntlDone, 'Booking failed. Please try again.') }

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-bg">

      {/* 외국인 예약 */}
      <div className="px-5 pt-5 pb-1">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe size={15} style={{ color: '#3D2314' }} />
            <h2 className="font-sans font-bold text-[17px]" style={{ color: '#3D2314', letterSpacing: '-0.03em' }}>
              {t.title}
            </h2>
          </div>
          <div className="flex gap-px overflow-hidden" style={{ border: '1.5px solid #DCCCB8', borderRadius: '8px' }}>
            {Object.entries(I18N).map(([k, v]) => (
              <button
                key={k}
                onClick={() => { setLang(k); setIntlDone(false) }}
                className="px-2.5 py-1 text-[11px] font-bold transition-all duration-150"
                style={lang === k
                  ? { background: '#3D2314', color: '#FDFAF6' }
                  : { background: '#FDFAF6', color: '#9C8572' }}
              >
                {v.short}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-4" style={CARD_STYLE}>
          <p className="font-sans text-[11px] mb-4" style={{ color: '#9C8572' }}>{t.subtitle}</p>
          <AnimatePresence mode="wait">
            {intlDone ? (
              <motion.div key="intl-done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-8 gap-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-1" style={{ background: '#EDE0CF' }}>
                  <Check size={22} style={{ color: '#3D2314' }} strokeWidth={2.5} />
                </div>
                <p className="font-sans font-bold text-[15px]" style={{ color: '#3D2314', letterSpacing: '-0.02em' }}>{t.success}</p>
                <p className="font-sans text-[12px] text-center" style={{ color: '#9C8572' }}>{t.successSub}</p>
                <button
                  onClick={() => { setIntlDone(false); setIntlSelectedHanboks([]); setIntlForm({ name: '', phone: '', email: '', booking_date: '' }) }}
                  className="mt-2 font-sans text-[12px] underline"
                  style={{ color: '#9C8572' }}
                >
                  {t.newBooking}
                </button>
              </motion.div>
            ) : (
              <motion.form key={`intl-${lang}`} onSubmit={submitIntl} className="space-y-3">
                <div className="space-y-2.5">
                  <input className="input-field text-[13px]" placeholder={t.namePh} value={intlForm.name}
                    onChange={(e) => setIntlForm((p) => ({ ...p, name: e.target.value }))} />
                  <input className="input-field text-[13px]" placeholder={t.emailPh} type="email" value={intlForm.email}
                    onChange={(e) => setIntlForm((p) => ({ ...p, email: e.target.value }))} />
                  <input className="input-field text-[13px]" placeholder={t.contactPh} type="text" value={intlForm.phone}
                    onChange={(e) => setIntlForm((p) => ({ ...p, phone: e.target.value }))} />
                  <div>
                    <div className="flex items-baseline justify-between mb-1.5">
                      <p className="font-sans text-[10px] font-bold uppercase tracking-wide" style={{ color: '#B8A898' }}>{t.dateLabel}</p>
                      <p className="font-sans text-[10px]" style={{ color: '#C8B49A' }}>{t.dateHint}</p>
                    </div>
                    <input type="date" className="input-field text-[13px]" value={intlForm.booking_date}
                      onChange={(e) => setIntlForm((p) => ({ ...p, booking_date: e.target.value }))} />
                  </div>
                </div>
                <HanbokSelectGrid items={catalog} selected={intlSelectedHanboks} onToggle={toggleIntlHanbok}
                  label={t.hanbokLabel} subLabel={t.hanbokSub} />
                <motion.button type="submit" whileTap={{ scale: 0.98 }}
                  disabled={intlSubmitting || !intlForm.name || !intlForm.email || !intlForm.booking_date}
                  className="btn-gold w-full justify-center disabled:opacity-40">
                  {intlSubmitting
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t.submit}</>
                    : `${t.submit}${intlSelectedHanboks.length > 1 ? ` (${intlSelectedHanboks.length})` : ''}`}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 한국어 예약 신청 */}
      <SectionHeader title="예약 신청 (내국인)" sub="원하시는 한복을 선택 후 예약해주세요" />
      <div className="mx-5 mb-4 p-4" style={CARD_STYLE}>
        <AnimatePresence mode="wait">
          {bookingDone ? (
            <motion.div key="booking-done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-8 gap-2">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-1" style={{ background: '#EDE0CF' }}>
                <Check size={22} style={{ color: '#3D2314' }} strokeWidth={2.5} />
              </div>
              <p className="font-sans font-bold text-[15px]" style={{ color: '#3D2314', letterSpacing: '-0.02em' }}>예약 신청 완료!</p>
              <p className="font-sans text-[12px] text-center" style={{ color: '#9C8572' }}>
                {selectedHanboks.length > 1 ? `${selectedHanboks.length}개 한복 · ` : ''}빠른 시간 내에 연락드리겠습니다.
              </p>
              <button
                onClick={() => { setBookingDone(false); setSelectedHanboks([]); setBookingForm({ name: '', phone: '', email: '', booking_date: '' }) }}
                className="mt-2 font-sans text-[12px] underline"
                style={{ color: '#9C8572' }}
              >
                새 예약 신청
              </button>
            </motion.div>
          ) : (
            <motion.form key="booking-form" onSubmit={submitBooking} className="space-y-3">
              {/* 기본 정보 */}
              <div className="space-y-2.5">
                <input
                  className="input-field text-[13px]"
                  placeholder="이름 *"
                  value={bookingForm.name}
                  onChange={(e) => setBookingForm((p) => ({ ...p, name: e.target.value }))}
                />
                <input
                  className="input-field text-[13px]"
                  placeholder="연락처 *"
                  type="tel"
                  value={bookingForm.phone}
                  onChange={(e) => setBookingForm((p) => ({ ...p, phone: e.target.value }))}
                />
                <input
                  className="input-field text-[13px]"
                  placeholder="이메일 (선택)"
                  type="email"
                  value={bookingForm.email}
                  onChange={(e) => setBookingForm((p) => ({ ...p, email: e.target.value }))}
                />
                <div>
                  <p className="font-sans text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: '#B8A898' }}>
                    예약 날짜 *
                  </p>
                  <input
                    type="date"
                    className="input-field text-[13px]"
                    value={bookingForm.booking_date}
                    onChange={(e) => setBookingForm((p) => ({ ...p, booking_date: e.target.value }))}
                  />
                </div>
              </div>

              <HanbokSelectGrid
                items={catalog}
                selected={selectedHanboks}
                onToggle={toggleHanbok}
                label="한복 선택"
                subLabel="중복 선택 가능 · 한복별로 예약이 각각 등록됩니다"
              />

              <motion.button
                type="submit"
                whileTap={{ scale: 0.98 }}
                disabled={bookingSubmitting || !bookingForm.name || !bookingForm.phone || !bookingForm.booking_date}
                className="btn-gold w-full justify-center disabled:opacity-40"
              >
                {bookingSubmitting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />처리 중...</>
                ) : (
                  `예약 신청하기${selectedHanboks.length > 1 ? ` (${selectedHanboks.length}개)` : ''}`
                )}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      <p className="text-center font-sans text-[10px] pb-6" style={{ color: '#C8B49A' }}>
        © {new Date().getFullYear()} 장금이 한복. All rights reserved.
      </p>
    </div>
  )
}

/* ── 탭 ── */
const TABS = [
  { id: 'fitting',    label: '피팅',   Icon: Sparkles },
  { id: 'collection', label: '컬렉션', Icon: LayoutGrid },
  { id: 'nearby',     label: '주변',   Icon: MapPin },
  { id: 'info',       label: '예약',   Icon: Calendar },
]

export default function App() {
  const [tab, setTab] = useState('fitting')
  const [catalog, setCatalog] = useState([])

  useEffect(() => {
    api.getCatalog().then(setCatalog).catch(() => {})
  }, [])

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
    <div className="flex flex-col" style={{ height: '100dvh', maxWidth: '480px', margin: '0 auto', background: '#F5EDE0' }}>

      {/* 헤더 */}
      <header className="flex-none flex items-center justify-between px-5 safe-top bg-white" style={{ height: '52px' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#3D2314' }}>
            <span className="font-serif text-white text-[11px] font-bold">장</span>
          </div>
          <span className="font-serif text-[15px] font-bold" style={{ color: '#3D2314', letterSpacing: '-0.02em' }}>
            장금이 한복
          </span>
        </div>
        <span className="font-sans text-[10px] font-semibold px-2.5 py-1 rounded-full"
          style={{ background: '#EDE0CF', color: '#8B6344', letterSpacing: '-0.01em' }}>
          수원 화성 행궁
        </span>
      </header>
      {/* 단청 헤더 구분선 */}
      <div className="flex-none" style={{ height: '3px', background: DANCHEONG_STRIPE }} />

      {/* 콘텐츠 */}
      <main className="flex-1 overflow-hidden relative" style={{ background: '#F5EDE0' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            {tab === 'fitting'    && <FittingTab catalog={catalog} />}
            {tab === 'collection' && <CollectionTab onFit={handleFit} catalog={catalog} />}
            {tab === 'nearby'     && <NearbyTab />}
            {tab === 'info'       && <InfoTab catalog={catalog} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 단청 탭바 구분선 */}
      <div className="flex-none" style={{ height: '3px', background: DANCHEONG_STRIPE }} />
      {/* 탭바 */}
      <nav className="flex-none flex bg-white safe-bottom" style={{ height: '56px' }}>
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id
          return (
            <motion.button
              key={id}
              onClick={() => setTab(id)}
              whileTap={{ scale: 0.88 }}
              className="flex-1 flex flex-col items-center justify-center gap-1"
            >
              <Icon
                size={18}
                strokeWidth={active ? 2.3 : 1.7}
                style={{ color: active ? '#3D2314' : '#C8B49A' }}
                className="transition-colors duration-150"
              />
              <span className="font-sans text-[10px] transition-colors duration-150"
                style={{ color: active ? '#3D2314' : '#C8B49A', fontWeight: active ? 700 : 400, letterSpacing: '-0.01em' }}>
                {label}
              </span>
            </motion.button>
          )
        })}
      </nav>
    </div>
  )
}
