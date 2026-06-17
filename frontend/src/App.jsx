import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, LayoutGrid, MapPin, Calendar,
  Globe, Check, Menu, Bell, Home, Heart,
  ChevronRight, User,
} from 'lucide-react'
import FittingWizard from './components/FittingWizard'
import NearbyMap from './components/NearbyMap'
import { api } from './utils/api'

/* ── 다국어 ── */
const I18N = {
  en: {
    short: 'EN', title: 'International Booking',
    subtitle: 'Traditional Korean clothing · Hwaseong Haenggung, Suwon',
    namePh: 'Full name *', contactPh: 'WhatsApp / Instagram / KakaoTalk (optional)',
    emailPh: 'Email *', dateLabel: 'Booking Date *', dateHint: 'Year / Month / Day',
    hanbokLabel: 'Select Hanbok', hanbokSub: 'Multiple selection allowed · Each hanbok is booked separately',
    submit: 'Request Booking', success: 'Booking Requested!',
    successSub: "We'll contact you within 24 hours.", newBooking: 'New Booking',
  },
  zh: {
    short: '中', title: '国际预约', subtitle: '韩国传统服装 · 水原华城行宫',
    namePh: '姓名 *', contactPh: 'WhatsApp / Instagram / KakaoTalk（选填）',
    emailPh: '电子邮件 *', dateLabel: '预约日期 *', dateHint: '年 / 月 / 日',
    hanbokLabel: '选择韩服', hanbokSub: '可多选 · 每件韩服分别登记预约',
    submit: '提交预约', success: '预约已提交！', successSub: '我们将在24小时内与您联系。', newBooking: '重新预约',
  },
  ja: {
    short: '日', title: '国際予約', subtitle: '韓国伝統衣装 · 水原華城行宮',
    namePh: 'お名前 *', contactPh: 'WhatsApp / Instagram / KakaoTalk（任意）',
    emailPh: 'メールアドレス *', dateLabel: 'ご予約日 *', dateHint: '年 / 月 / 日',
    hanbokLabel: '韓服を選択', hanbokSub: '複数選択可 · 韓服ごとに予約が登録されます',
    submit: '予約する', success: '予約受付完了！', successSub: '24時間以内にご連絡いたします。', newBooking: '新規予約',
  },
}

/* ── 색상명 → CSS 색상 맵 ── */
const COLOR_MAP = {
  '진홍': '#8C1C2F', '청색': '#1E3A6E', '연두': '#7FB069', '연분홍': '#F4B8C1',
  '자주': '#5B2D82', '금색': '#C9A227', '하늘': '#6BB8D4', '흰색': '#F5F0E8',
  '분홍': '#F4A7B9', '노랑': '#FFD166', '진청': '#1A3A5C', '백색': '#F0EBE1',
  '황금': '#C9A227', '옥색': '#3D7A6A', '은회': '#B8BCC8', '먹색': '#2C2C3A',
  '민트': '#7FBEAC', '크림': '#FFF8EE', '연보라': '#A08DBF', '검정': '#1A1A3E',
  '빨간': '#E03030', '파란': '#0022FE', '초록': '#2D8A4E', '보라': '#7B1FA2',
}

/* ── 공통 스타일 ── */
const CARD_STYLE = {
  background: '#FFFFFF', border: '1px solid #F0F0F5',
  borderRadius: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
}

/* ── 카테고리 라벨 다국어 ── */
const CAT_LABELS = {
  ko: { all: '전체', '여성': '여자', '남성': '남자', '아동': '아동', empty: '해당 카테고리 한복이 없습니다' },
  en: { all: 'All',  '여성': 'Women', '남성': 'Men', '아동': 'Children', empty: 'No hanbok in this category' },
  zh: { all: '全部', '여성': '女性', '남성': '男性', '아동': '儿童', empty: '该类别暂无韩服' },
  ja: { all: '全て', '여성': '女性', '남성': '男性', '아동': '子ども', empty: 'このカテゴリの韓服はありません' },
}

function HanbokSelectGrid({ items, selected, onToggle, label, subLabel, lang = 'ko' }) {
  const [catFilter, setCatFilter] = useState('all')
  const cl = CAT_LABELS[lang] ?? CAT_LABELS.ko
  const availableCats = [...new Set(items.map(i => i.category).filter(Boolean))].sort()
  const filtered = catFilter === 'all' ? items : items.filter(i => i.category === catFilter)

  return (
    <div style={{ borderTop: '1px solid #BDD6FF', paddingTop: '14px' }}>
      <div className="flex items-center justify-between mb-2">
        <p className="font-sans font-bold text-[12px]" style={{ color: '#1A1A3E' }}>{label}</p>
        {selected.length > 0 && (
          <span className="font-sans font-bold text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#1A1A3E', color: '#FFFFFF' }}>
            {selected.length}
          </span>
        )}
      </div>
      <p className="font-sans text-[11px] mb-2.5" style={{ color: '#888' }}>{subLabel}</p>
      {availableCats.length > 1 && (
        <div className="flex gap-1.5 mb-3">
          <button onClick={() => setCatFilter('all')} className="flex-none px-3 py-1 rounded-full text-[11px] font-sans"
            style={catFilter === 'all' ? { background: '#0022FE', color: '#FFF', fontWeight: 700 } : { background: '#FFF', color: '#4186FF', fontWeight: 500, border: '1px solid #BDD6FF' }}>
            {cl.all}
          </button>
          {availableCats.map(cat => (
            <button key={cat} onClick={() => setCatFilter(cat)} className="flex-none px-3 py-1 rounded-full text-[11px] font-sans"
              style={catFilter === cat ? { background: '#0022FE', color: '#FFF', fontWeight: 700 } : { background: '#FFF', color: '#4186FF', fontWeight: 500, border: '1px solid #BDD6FF' }}>
              {cl[cat] ?? cat}
            </button>
          ))}
        </div>
      )}
      {items.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: '#E0E0E0', borderTopColor: '#1A1A3E' }} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 overflow-y-auto no-scrollbar" style={{ maxHeight: '220px' }}>
          {filtered.map(item => {
            const isSel = selected.some(h => h.id === item.id)
            return (
              <motion.div key={item.id} whileTap={{ scale: 0.97 }} onClick={() => onToggle(item)}
                className="relative rounded-xl overflow-hidden cursor-pointer"
                style={{ outline: isSel ? '2.5px solid #1A1A3E' : '2.5px solid transparent', outlineOffset: '-1px' }}>
                <div className="relative" style={{ height: '160px', background: '#E8EEFF' }}>
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent 55%)' }} />
                  {isSel && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#1A1A3E' }}>
                      <Check size={11} style={{ color: '#FFF' }} strokeWidth={3} />
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 p-2">
                    <p className="font-sans font-semibold text-[11px] text-white leading-tight truncate">{item.title}</p>
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

const toggleItem = (prev, item) =>
  prev.some(h => h.id === item.id) ? prev.filter(h => h.id !== item.id) : [...prev, item]

async function submitBookingData(form, selectedHanboks, setSubmitting, setDone, errorMsg) {
  if (!form.name) return
  setSubmitting(true)
  try {
    const targets = selectedHanboks.length > 0 ? selectedHanboks : [{ id: null }]
    await Promise.all(targets.map(h => api.createBooking({
      name: form.name, phone: form.phone, email: form.email || null,
      booking_date: form.booking_date || null, hanbok_id: h.id || null, hanbok_title: h.title || null,
    })))
    setDone(true)
  } catch { alert(errorMsg) } finally { setSubmitting(false) }
}

/* ══════════════════════════════════════
   홈 탭 (Screen 1)
══════════════════════════════════════ */
function HomeTab({ catalog, onDetail, setTab }) {
  // 카테고리별 대표 이미지
  const categoryMap = {}
  catalog.forEach(item => {
    if (item.category && !categoryMap[item.category]) categoryMap[item.category] = item
  })
  const categories = Object.entries(categoryMap)
  const heroItem   = catalog[0]
  const newItems   = catalog.slice(0, 6)

  return (
    <div className="h-full overflow-y-auto no-scrollbar" style={{ background: '#FFFFFF' }}>

      {/* ── 히어로 ── */}
      <div className="flex items-center gap-4 px-4 py-6" style={{ background: '#F8F8FC' }}>
        <div className="flex-1">
          <h1 className="font-sans font-bold leading-tight"
            style={{ fontSize: '22px', color: '#1A1A3E', letterSpacing: '-0.03em' }}>
            특별한 날,<br />나에게 딱 맞는 한복
          </h1>
          <p className="font-sans text-[12px] mt-2 mb-3" style={{ color: '#888' }}>
            AI가 추천해드려요
          </p>
          <button
            onClick={() => setTab('fitting')}
            className="px-4 py-2 rounded-lg font-sans font-bold text-[12px] transition-all active:scale-95"
            style={{ border: '1.5px solid #1A1A3E', color: '#1A1A3E', background: '#FFFFFF' }}>
            AI 가상 피팅하기
          </button>
        </div>
        <div className="flex-shrink-0 w-24 h-28 rounded-2xl overflow-hidden" style={{ background: '#E8EEFF' }}>
          {heroItem?.image_url && (
            <img src={heroItem.image_url} alt="" className="w-full h-full object-cover" />
          )}
        </div>
      </div>

      {/* ── 카테고리 ── */}
      <div className="pt-5">
        <div className="flex items-center justify-between px-4 mb-3">
          <p className="font-sans font-bold text-[15px]" style={{ color: '#1A1A3E' }}>카테고리</p>
          <button onClick={() => setTab('collection')}
            className="flex items-center gap-0.5 font-sans text-[12px]" style={{ color: '#888' }}>
            전체보기 <ChevronRight size={13} />
          </button>
        </div>
        <div className="flex gap-4 px-4 overflow-x-auto no-scrollbar pb-3">
          {categories.length > 0
            ? categories.map(([cat, item]) => (
              <div key={cat} className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer"
                onClick={() => setTab('collection')}>
                <div className="w-14 h-14 rounded-2xl overflow-hidden" style={{ background: '#E8EEFF' }}>
                  {item.image_url && (
                    <img src={item.image_url} alt={cat} className="w-full h-full object-cover" />
                  )}
                </div>
                <p className="font-sans text-[10px] whitespace-nowrap" style={{ color: '#333' }}>
                  {cat} 한복
                </p>
              </div>
            ))
            : ['여성 한복', '남성 한복', '아동 한복'].map(cat => (
              <div key={cat} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className="w-14 h-14 rounded-2xl" style={{ background: '#E8EEFF' }} />
                <p className="font-sans text-[10px] whitespace-nowrap" style={{ color: '#333' }}>{cat}</p>
              </div>
            ))
          }
        </div>
      </div>

      {/* ── 신상품 ── */}
      <div className="pt-4">
        <div className="flex items-center justify-between px-4 mb-3">
          <p className="font-sans font-bold text-[15px]" style={{ color: '#1A1A3E' }}>신상품</p>
          <button onClick={() => setTab('collection')}
            className="flex items-center gap-0.5 font-sans text-[12px]" style={{ color: '#888' }}>
            전체보기 <ChevronRight size={13} />
          </button>
        </div>
        <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar pb-5">
          {(newItems.length > 0 ? newItems : [{}, {}, {}]).map((item, i) => (
            <div key={item.id || i} className="flex-shrink-0 w-32 cursor-pointer"
              onClick={() => item.id && onDetail(item)}>
              <div className="w-32 h-36 rounded-xl overflow-hidden" style={{ background: '#E8EEFF' }}>
                {item.image_url && (
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                )}
              </div>
              <p className="font-sans font-semibold text-[12px] mt-1.5 truncate" style={{ color: '#1A1A3E' }}>
                {item.title || '상품명'}
              </p>
              <p className="font-sans text-[12px]" style={{ color: '#333' }}>₩ 00,000</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 장금이공방 소개 ── */}
      <div className="mx-4 mb-8" style={{ borderTop: '1px solid #F0F0F5' }}>
        <button className="flex items-center justify-between w-full py-4">
          <p className="font-sans font-semibold text-[13px]" style={{ color: '#1A1A3E' }}>장금이공방 소개</p>
          <ChevronRight size={16} style={{ color: '#ABABAB' }} />
        </button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   카테고리 탭 (Screen 2)
══════════════════════════════════════ */
function CollectionTab({ catalog, onDetail }) {
  const [active, setActive]     = useState('전체')
  const [wishlist, setWishlist] = useState([])

  const cats     = [...new Set(catalog.map(i => i.category).filter(Boolean))].sort()
  const filtered = active === '전체' ? catalog : catalog.filter(i => i.category === active)

  const toggleWish = (e, id) => {
    e.stopPropagation()
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div className="h-full flex flex-col" style={{ background: '#FFFFFF' }}>

      {/* 카테고리 탭 */}
      <div className="flex-none" style={{ borderBottom: '1px solid #F0F0F5' }}>
        <div className="flex overflow-x-auto no-scrollbar">
          {['전체', ...cats].map(c => (
            <motion.button key={c} onClick={() => setActive(c)} whileTap={{ scale: 0.97 }}
              className="relative flex-none px-4 py-3.5 text-[13px] whitespace-nowrap font-sans"
              style={{ color: active === c ? '#1A1A3E' : '#ABABAB', fontWeight: active === c ? 700 : 400 }}>
              {c}
              {active === c && (
                <motion.div layoutId="col-underline" className="absolute bottom-0 left-0 right-0"
                  style={{ height: '2px', background: '#1A1A3E', borderRadius: '1px' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }} />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* 필터 칩 */}
      <div className="flex-none flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid #F0F0F5' }}>
        {['필터', '색상', '가격순'].map(label => (
          <button key={label}
            className="flex items-center gap-0.5 px-3 py-1.5 rounded-full font-sans text-[12px]"
            style={{ border: '1px solid #E0E0E0', color: '#333', background: '#FFF' }}>
            {label} ▾
          </button>
        ))}
      </div>

      {/* 상품 그리드 */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="font-sans text-[13px]" style={{ color: '#ABABAB' }}>해당 카테고리 한복이 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-2">
            <AnimatePresence>
              {filtered.map((item, idx) => {
                const wished = wishlist.includes(item.id)
                return (
                  <motion.div key={item.id} layout
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.16, delay: idx * 0.025 }}
                    className="cursor-pointer"
                    style={{ borderBottom: '1px solid #F0F0F5', borderRight: '1px solid #F0F0F5', padding: '12px' }}
                    onClick={() => onDetail(item)}>
                    <div className="aspect-[3/4] rounded-xl overflow-hidden relative" style={{ background: '#E8EEFF' }}>
                      {item.image_url && (
                        <img src={item.image_url} alt={item.title}
                          className="absolute inset-0 w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="pt-2 flex items-start justify-between gap-1">
                      <div className="flex-1 min-w-0">
                        <p className="font-sans font-semibold text-[13px] truncate" style={{ color: '#1A1A3E' }}>
                          {item.title}
                        </p>
                        <p className="font-sans text-[12px] mt-0.5" style={{ color: '#333' }}>₩ 00,000</p>
                      </div>
                      <button onClick={e => toggleWish(e, item.id)} className="flex-shrink-0 mt-0.5">
                        <Heart size={16}
                          fill={wished ? '#E03030' : 'none'}
                          stroke={wished ? '#E03030' : '#CCCCCC'} />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
              {filtered.length % 2 !== 0 && <div style={{ borderBottom: '1px solid #F0F0F5' }} />}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   상품 상세 시트 (Screen 3 — 하단 카드)
══════════════════════════════════════ */
function HanbokDetailSheet({ item, onClose, onFit, onBook }) {
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedSize,  setSelectedSize]  = useState(null)
  const [wished, setWished] = useState(false)

  const colors = item?.color
    ? item.color.split(',').map(c => c.trim()).filter(Boolean)
    : []
  const SIZES  = ['S', 'M', 'L', 'XL']

  if (!item) return null

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        className="rounded-t-3xl overflow-y-auto no-scrollbar"
        style={{ background: '#FFFFFF', maxHeight: '90dvh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: '#E0E0E0' }} />
        </div>

        {/* 이미지 */}
        <div className="mx-4 rounded-2xl overflow-hidden" style={{ height: '280px', background: '#E8EEFF' }}>
          {item.image_url && (
            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
          )}
        </div>

        {/* 상품명 + 가격 + 하트 */}
        <div className="px-4 pt-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-sans font-bold text-[20px]"
                style={{ color: '#1A1A3E', letterSpacing: '-0.02em' }}>
                {item.title}
              </p>
              <p className="font-sans font-semibold text-[16px] mt-1" style={{ color: '#1A1A3E' }}>
                ₩ 00,000
              </p>
            </div>
            <button onClick={() => setWished(w => !w)} className="mt-1">
              <Heart size={22}
                fill={wished ? '#E03030' : 'none'}
                stroke={wished ? '#E03030' : '#CCCCCC'} />
            </button>
          </div>
          <p className="font-sans text-[13px] mt-3" style={{ color: '#888' }}>
            상품 설명이 여기에 표시됩니다.
          </p>
        </div>

        {/* 색상 선택 */}
        {colors.length > 0 && (
          <div className="px-4 pt-4">
            <p className="font-sans font-semibold text-[13px] mb-2.5" style={{ color: '#1A1A3E' }}>색상</p>
            <div className="flex gap-2.5">
              {colors.map((color, i) => (
                <button key={i} onClick={() => setSelectedColor(color)}
                  className="w-8 h-8 rounded-full transition-all"
                  style={{
                    background: COLOR_MAP[color] || '#EEEEEE',
                    outline: selectedColor === color ? '2px solid #1A1A3E' : '2px solid transparent',
                    outlineOffset: '2px',
                  }} />
              ))}
            </div>
          </div>
        )}

        {/* 사이즈 선택 */}
        <div className="px-4 pt-4 pb-2">
          <p className="font-sans font-semibold text-[13px] mb-2.5" style={{ color: '#1A1A3E' }}>사이즈</p>
          <div className="flex gap-2">
            {SIZES.map(size => (
              <button key={size} onClick={() => setSelectedSize(size)}
                className="w-12 h-10 rounded-lg font-sans font-semibold text-[13px] transition-all active:scale-95"
                style={{
                  border: `1.5px solid ${selectedSize === size ? '#1A1A3E' : '#E0E0E0'}`,
                  background: selectedSize === size ? '#1A1A3E' : '#FFFFFF',
                  color: selectedSize === size ? '#FFFFFF' : '#333',
                }}>
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-2 px-4 pt-3 pb-8">
          <button onClick={onFit}
            className="flex-1 py-3.5 rounded-xl font-sans font-bold text-[14px] transition-all active:scale-95"
            style={{ border: '1.5px solid #1A1A3E', color: '#1A1A3E', background: '#FFFFFF' }}>
            장바구니 담기
          </button>
          <button onClick={onBook}
            className="flex-1 py-3.5 rounded-xl font-sans font-bold text-[14px] transition-all active:scale-95"
            style={{ background: '#1A1A3E', color: '#FFFFFF' }}>
            바로 예약하기
          </button>
        </div>
      </motion.div>
    </motion.div>
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
   AI 피팅 탭 (핌)
══════════════════════════════════════ */
function FittingTab({ catalog }) {
  return (
    <div className="h-full overflow-y-auto no-scrollbar" style={{ background: '#F5F7FF' }}>
      <div className="px-4 pt-4 pb-6">
        <FittingWizard catalog={catalog} />
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   스텝 인디케이터
══════════════════════════════════════ */
function StepIndicator({ current, steps }) {
  return (
    <div className="flex items-center px-5 py-4">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center" style={{ flex: i < steps.length - 1 ? 1 : 'none' }}>
          <div className="flex flex-col items-center gap-1">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-all"
              style={{ background: i <= current ? '#1A1A3E' : '#F0F0F5', color: i <= current ? '#FFF' : '#ABABAB' }}>
              {i < current ? <Check size={13} strokeWidth={3} /> : i + 1}
            </div>
            <span className="font-sans text-[9px] whitespace-nowrap"
              style={{ color: i === current ? '#1A1A3E' : '#ABABAB', fontWeight: i === current ? 700 : 400 }}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 mx-1 mb-4"
              style={{ height: '1px', background: i < current ? '#1A1A3E' : '#E0E0E0' }} />
          )}
        </div>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════
   예약 탭 — 4단계 스텝
══════════════════════════════════════ */
function BookingTab({ catalog, preselect }) {
  const [step, setStep]                     = useState(0)
  const [selectedHanbok, setSelectedHanbok] = useState(preselect || null)
  const [bookingDate, setBookingDate]       = useState('')
  const [returnDate,  setReturnDate]        = useState('')
  const [rentalType, setRentalType]         = useState('일반')
  const [form, setForm]                     = useState({ name: '', phone: '', email: '' })
  const [submitting, setSubmitting]         = useState(false)
  const [done, setDone]                     = useState(false)

  const STEPS = ['상품 선택', '날짜 선택', '옵션 선택', '결제']

  const reset = () => {
    setDone(false); setStep(0); setSelectedHanbok(null)
    setBookingDate(''); setReturnDate(''); setRentalType('일반')
    setForm({ name: '', phone: '', email: '' })
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await api.createBooking({
        name: form.name, phone: form.phone, email: form.email || null,
        booking_date: bookingDate || null,
        hanbok_id: selectedHanbok?.id || null, hanbok_title: selectedHanbok?.title || null,
      })
      setDone(true)
    } catch { alert('예약 신청 중 오류가 발생했습니다.') }
    finally { setSubmitting(false) }
  }

  if (done) return (
    <div className="h-full flex flex-col items-center justify-center gap-3 px-6" style={{ background: '#FFFFFF' }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#F0F4FF' }}>
        <Check size={28} style={{ color: '#1A1A3E' }} strokeWidth={2.5} />
      </div>
      <p className="font-sans font-bold text-[20px]" style={{ color: '#1A1A3E', letterSpacing: '-0.02em' }}>예약 신청 완료!</p>
      <p className="font-sans text-[13px] text-center" style={{ color: '#888' }}>빠른 시간 내에 연락드리겠습니다.</p>
      <button onClick={reset} className="mt-4 px-8 py-3 rounded-xl font-sans font-bold text-[14px]"
        style={{ background: '#1A1A3E', color: '#FFFFFF' }}>새 예약하기</button>
    </div>
  )

  return (
    <div className="h-full flex flex-col" style={{ background: '#FFFFFF' }}>
      <StepIndicator current={step} steps={STEPS} />
      <div style={{ height: '1px', background: '#F0F0F5' }} />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4">
        {step === 0 && (
          <div>
            <p className="font-sans font-bold text-[15px] mb-0.5" style={{ color: '#1A1A3E' }}>한복을 선택해주세요</p>
            <p className="font-sans text-[12px] mb-4" style={{ color: '#888' }}>원하시는 한복을 하나 선택하세요</p>
            <HanbokSelectGrid items={catalog} selected={selectedHanbok ? [selectedHanbok] : []}
              onToggle={item => setSelectedHanbok(prev => prev?.id === item.id ? null : item)}
              label="한복 선택" subLabel="하나를 선택해주세요" />
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4">
            <p className="font-sans font-bold text-[15px] mb-0.5" style={{ color: '#1A1A3E' }}>대여 날짜를 선택해주세요</p>
            <div>
              <p className="font-sans text-[11px] font-bold mb-1.5 tracking-wide" style={{ color: '#ABABAB' }}>대여일</p>
              <input type="date" className="input-field text-[13px]" value={bookingDate} onChange={e => setBookingDate(e.target.value)} />
            </div>
            <div>
              <p className="font-sans text-[11px] font-bold mb-1.5 tracking-wide" style={{ color: '#ABABAB' }}>반납일</p>
              <input type="date" className="input-field text-[13px]" value={returnDate} onChange={e => setReturnDate(e.target.value)} />
            </div>
          </div>
        )}
        {step === 2 && (
          <div>
            {selectedHanbok && (
              <div className="flex items-center gap-3 p-3 rounded-xl mb-5"
                style={{ background: '#F8F8FC', border: '1px solid #F0F0F5' }}>
                <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0" style={{ background: '#E8EEFF' }}>
                  {selectedHanbok.image_url && (
                    <img src={selectedHanbok.image_url} alt={selectedHanbok.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <p className="font-sans font-bold text-[14px]" style={{ color: '#1A1A3E' }}>{selectedHanbok.title}</p>
                  <p className="font-sans text-[12px] mt-0.5" style={{ color: '#888' }}>₩ 00,000</p>
                </div>
              </div>
            )}
            <p className="font-sans font-bold text-[13px] mb-3" style={{ color: '#1A1A3E' }}>대여 유형 선택</p>
            <div className="space-y-2 mb-5">
              {[{ type: '일반', label: '일반 대여', sub: '반납일 기준 요금이 적용됩니다.' },
                { type: '활영', label: '활영 대여', sub: '활영 일정에 맞는 요금이 적용됩니다.' }].map(({ type, label, sub }) => (
                <button key={type} onClick={() => setRentalType(type)}
                  className="w-full flex items-start gap-3 p-4 rounded-xl text-left"
                  style={{ border: `1.5px solid ${rentalType === type ? '#1A1A3E' : '#E0E0E0'}`, background: '#FFF' }}>
                  <div className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0 flex items-center justify-center"
                    style={{ border: `2px solid ${rentalType === type ? '#1A1A3E' : '#CCC'}` }}>
                    {rentalType === type && <div className="w-2 h-2 rounded-full" style={{ background: '#1A1A3E' }} />}
                  </div>
                  <div>
                    <p className="font-sans font-bold text-[13px]" style={{ color: '#1A1A3E' }}>{label}</p>
                    <p className="font-sans text-[11px] mt-0.5" style={{ color: '#888' }}>{sub}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="font-sans font-bold text-[13px] mb-3" style={{ color: '#1A1A3E' }}>연락처 정보</p>
            <div className="space-y-2.5">
              <input className="input-field text-[13px]" placeholder="이름 *" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              <input className="input-field text-[13px]" placeholder="연락처 *" type="tel" value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              <input className="input-field text-[13px]" placeholder="이메일 (선택)" type="email" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
          </div>
        )}
        {step === 3 && (
          <div>
            <p className="font-sans font-bold text-[15px] mb-4" style={{ color: '#1A1A3E' }}>예약 내용을 확인해주세요</p>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #F0F0F5' }}>
              {[['선택 한복', selectedHanbok?.title || '—'], ['대여 유형', rentalType === '일반' ? '일반 대여' : '활영 대여'],
                ['대여일', bookingDate || '—'], ['반납일', returnDate || '—'],
                ['이름', form.name || '—'], ['연락처', form.phone || '—'],
                ...(form.email ? [['이메일', form.email]] : [])
              ].map(([label, value], i, arr) => (
                <div key={label} className="flex items-center px-4 py-3.5"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid #F0F0F5' : 'none' }}>
                  <p className="font-sans text-[12px] w-20 flex-shrink-0" style={{ color: '#888' }}>{label}</p>
                  <p className="font-sans text-[13px] font-semibold" style={{ color: '#1A1A3E' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-none px-4 py-4 space-y-2" style={{ borderTop: '1px solid #F0F0F5' }}>
        {step === 3 ? (
          <button onClick={handleSubmit} disabled={submitting || !form.name || !form.phone}
            className="w-full py-3.5 rounded-xl font-sans font-bold text-[14px] disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: '#1A1A3E', color: '#FFF' }}>
            {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />처리 중...</> : '예약 신청하기'}
          </button>
        ) : (
          <button onClick={() => setStep(s => s + 1)} disabled={step === 0 && !selectedHanbok}
            className="w-full py-3.5 rounded-xl font-sans font-bold text-[14px] disabled:opacity-40"
            style={{ background: '#1A1A3E', color: '#FFF' }}>
            다음
          </button>
        )}
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)}
            className="w-full py-3 rounded-xl font-sans font-bold text-[13px]"
            style={{ background: '#F0F0F5', color: '#666' }}>
            이전
          </button>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   마이 탭
══════════════════════════════════════ */
function MyPageTab({ catalog }) {
  const [lang, setLang]               = useState('en')
  const t                             = I18N[lang]
  const [intlForm, setIntlForm]       = useState({ name: '', phone: '', email: '', booking_date: '' })
  const [intlSel, setIntlSel]         = useState([])
  const [intlSubmitting, setIntlSub]  = useState(false)
  const [intlDone, setIntlDone]       = useState(false)

  const submitIntl = e => {
    e.preventDefault()
    submitBookingData(intlForm, intlSel, setIntlSub, setIntlDone, 'Booking failed. Please try again.')
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar" style={{ background: '#F8F8FC' }}>
      <div className="px-5 pt-5 pb-4" style={{ background: '#FFF', borderBottom: '1px solid #F0F0F5' }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#E8EEFF' }}>
            <User size={24} style={{ color: '#4186FF' }} />
          </div>
          <div>
            <p className="font-sans font-bold text-[16px]" style={{ color: '#1A1A3E' }}>방문 고객</p>
            <p className="font-sans text-[12px]" style={{ color: '#888' }}>장금이공방 · 수원 화성 행궁</p>
          </div>
        </div>
      </div>

      <div className="mx-4 mt-4 rounded-2xl overflow-hidden" style={CARD_STYLE}>
        {[{ label: '이용 안내', sub: '한복 대여 방법 및 운영 시간' },
          { label: '자주 묻는 질문', sub: 'FAQ' },
          { label: '앱 정보', sub: 'v1.0.0' }
        ].map(({ label, sub }, i, arr) => (
          <div key={label} className="flex items-center justify-between px-4 py-3.5"
            style={{ borderBottom: i < arr.length - 1 ? '1px solid #F0F0F5' : 'none' }}>
            <div>
              <p className="font-sans font-semibold text-[13px]" style={{ color: '#1A1A3E' }}>{label}</p>
              <p className="font-sans text-[11px]" style={{ color: '#888' }}>{sub}</p>
            </div>
            <ChevronRight size={16} style={{ color: '#ABABAB' }} />
          </div>
        ))}
      </div>

      <div className="px-4 pt-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Globe size={15} style={{ color: '#1A1A3E' }} />
            <h2 className="font-sans font-bold text-[15px]" style={{ color: '#1A1A3E', letterSpacing: '-0.02em' }}>{t.title}</h2>
          </div>
          <div className="flex gap-px overflow-hidden" style={{ border: '1.5px solid #BDD6FF', borderRadius: '8px' }}>
            {Object.entries(I18N).map(([k, v]) => (
              <button key={k} onClick={() => { setLang(k); setIntlDone(false) }}
                className="px-2.5 py-1 text-[11px] font-bold"
                style={lang === k ? { background: '#0022FE', color: '#FFF' } : { background: '#FFF', color: '#4186FF' }}>
                {v.short}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl p-4 mb-6" style={CARD_STYLE}>
          <p className="font-sans text-[11px] mb-4" style={{ color: '#888' }}>{t.subtitle}</p>
          <AnimatePresence mode="wait">
            {intlDone ? (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-8 gap-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#F0F0F5' }}>
                  <Check size={22} style={{ color: '#1A1A3E' }} strokeWidth={2.5} />
                </div>
                <p className="font-sans font-bold text-[15px]" style={{ color: '#1A1A3E' }}>{t.success}</p>
                <p className="font-sans text-[12px] text-center" style={{ color: '#888' }}>{t.successSub}</p>
                <button onClick={() => { setIntlDone(false); setIntlSel([]); setIntlForm({ name: '', phone: '', email: '', booking_date: '' }) }}
                  className="mt-2 font-sans text-[12px] underline" style={{ color: '#888' }}>{t.newBooking}</button>
              </motion.div>
            ) : (
              <motion.form key={`intl-${lang}`} onSubmit={submitIntl} className="space-y-3">
                <input className="input-field text-[13px]" placeholder={t.namePh} value={intlForm.name}
                  onChange={e => setIntlForm(p => ({ ...p, name: e.target.value }))} />
                <input className="input-field text-[13px]" placeholder={t.emailPh} type="email" value={intlForm.email}
                  onChange={e => setIntlForm(p => ({ ...p, email: e.target.value }))} />
                <input className="input-field text-[13px]" placeholder={t.contactPh} value={intlForm.phone}
                  onChange={e => setIntlForm(p => ({ ...p, phone: e.target.value }))} />
                <input type="date" className="input-field text-[13px]" value={intlForm.booking_date}
                  onChange={e => setIntlForm(p => ({ ...p, booking_date: e.target.value }))} />
                <HanbokSelectGrid items={catalog} selected={intlSel}
                  onToggle={item => setIntlSel(prev => toggleItem(prev, item))}
                  label={t.hanbokLabel} subLabel={t.hanbokSub} lang={lang} />
                <motion.button type="submit" whileTap={{ scale: 0.98 }}
                  disabled={intlSubmitting || !intlForm.name || !intlForm.email || !intlForm.booking_date}
                  className="btn-gold w-full justify-center disabled:opacity-40">
                  {intlSubmitting
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t.submit}</>
                    : t.submit}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
      <p className="text-center font-sans text-[10px] pb-6" style={{ color: '#CACACA' }}>
        © {new Date().getFullYear()} 장금이 공방. All rights reserved.
      </p>
    </div>
  )
}

/* ── 탭 ── */
const TABS = [
  { id: 'home',       label: '홈',     Icon: Home },
  { id: 'collection', label: '카테고리', Icon: LayoutGrid },
  { id: 'nearby',     label: '주변',   Icon: MapPin },
  { id: 'booking',    label: '예약',   Icon: Calendar },
  { id: 'mypage',     label: '마이',   Icon: User },
]

export default function App() {
  const [tab, setTab]                         = useState('home')
  const [catalog, setCatalog]                 = useState([])
  const [detailItem, setDetailItem]           = useState(null)
  const [bookingPreselect, setBookingPreselect] = useState(null)

  useEffect(() => {
    api.getCatalog().then(setCatalog).catch(() => {})
  }, [])

  const handleFit = useCallback((hanbokId) => {
    window.dispatchEvent(new CustomEvent('prefill-hanbok', { detail: { id: hanbokId } }))
    setDetailItem(null)
    setTab('fitting')
  }, [])

  const handleBook = useCallback((item) => {
    setBookingPreselect(item)
    setDetailItem(null)
    setTab('booking')
  }, [])

  useEffect(() => {
    const h = e => setTab(e.detail?.tab || 'home')
    window.addEventListener('switch-tab', h)
    return () => window.removeEventListener('switch-tab', h)
  }, [])

  return (
    <div className="flex flex-col" style={{ height: '100dvh', maxWidth: '480px', margin: '0 auto', background: '#F8F8FC' }}>

      {/* 헤더 */}
      <header className="flex-none flex items-center safe-top"
        style={{ height: '56px', background: '#FFFFFF', borderBottom: '1px solid #F0F0F5' }}>
        <button className="flex items-center justify-center flex-shrink-0" style={{ width: '48px', height: '56px' }}>
          <Menu size={22} style={{ color: '#1A1A3E' }} />
        </button>
        <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
          <span className="font-sans font-bold"
            style={{ fontSize: '16px', color: '#1A1A3E', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            장금이공방
          </span>
          <span className="font-sans" style={{ fontSize: '10px', color: '#ABABAB', letterSpacing: '0.04em' }}>
            Janggeum Hanbok · Since 2012
          </span>
        </div>
        <button className="flex items-center justify-center flex-shrink-0" style={{ width: '48px', height: '56px' }}>
          <Bell size={20} style={{ color: '#1A1A3E' }} />
        </button>
      </header>

      {/* 콘텐츠 */}
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }} className="absolute inset-0">
            {tab === 'home'       && <HomeTab catalog={catalog} onDetail={setDetailItem} setTab={setTab} />}
            {tab === 'collection' && <CollectionTab catalog={catalog} onDetail={setDetailItem} />}
            {tab === 'nearby'     && <NearbyTab />}
            {tab === 'booking'    && <BookingTab catalog={catalog} preselect={bookingPreselect} />}
            {tab === 'mypage'     && <MyPageTab catalog={catalog} />}
            {tab === 'fitting'    && <FittingTab catalog={catalog} />}
          </motion.div>
        </AnimatePresence>

        {/* 상품 상세 시트 */}
        <AnimatePresence>
          {detailItem && (
            <HanbokDetailSheet
              item={detailItem}
              onClose={() => setDetailItem(null)}
              onFit={() => handleFit(detailItem.id)}
              onBook={() => handleBook(detailItem)}
            />
          )}
        </AnimatePresence>
      </main>

      {/* 탭바 */}
      <nav className="flex-none flex safe-bottom"
        style={{ height: '60px', background: '#FFFFFF', borderTop: '1px solid #F0F0F5' }}>
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id
          return (
            <motion.button key={id} onClick={() => setTab(id)} whileTap={{ scale: 0.85 }}
              className="relative flex-1 flex flex-col items-center justify-center gap-0.5">
              {active && (
                <motion.div layoutId="tab-indicator" className="absolute top-0 left-4 right-4"
                  style={{ height: '2px', background: '#1A1A3E', borderRadius: '0 0 2px 2px' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
              )}
              <Icon size={22} strokeWidth={active ? 2.2 : 1.5}
                style={{ color: active ? '#1A1A3E' : '#C4CACE' }} className="transition-colors duration-150" />
              <span className="font-sans text-[10px] transition-colors duration-150"
                style={{ color: active ? '#1A1A3E' : '#C4CACE', fontWeight: active ? 700 : 400, letterSpacing: '-0.01em' }}>
                {label}
              </span>
            </motion.button>
          )
        })}
      </nav>
    </div>
  )
}
