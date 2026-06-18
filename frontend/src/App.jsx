import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, LayoutGrid, MapPin, Calendar,
  Globe, Check, Menu, Bell, Home, Heart,
  ChevronRight, User, Headphones, ClipboardList,
  FileText, Shield, RefreshCw, MessageCircle,
} from 'lucide-react'
import FittingWizard from './components/FittingWizard'
import NearbyMap from './components/NearbyMap'
import { api } from './utils/api'

/* ══════════════════════════════════════
   전역 다국어 (APP_I18N)
══════════════════════════════════════ */
const APP_I18N = {
  ko: {
    tabs:       { home: '홈', collection: '카테고리', nearby: '주변', booking: '예약', mypage: '마이' },
    heroTitle:  '특별한 날,\n나에게 딱 맞는 한복',
    heroSub:    'AI가 추천해드려요',
    heroCta:    'AI 가상 피팅하기',
    catSection: '카테고리',
    newSection: '신상품',
    viewAll:    '전체보기',
    catSuffix:  ' 한복',
    intro:      '장금이공방 소개',
    all:        '전체',
    chips:      ['필터', '색상', '가격순'],
    emptyMsg:   '해당 카테고리 한복이 없습니다',
    colorLabel: '색상', sizeLabel: '사이즈',
    cartBtn:    '장바구니 담기', bookBtn: '바로 예약하기',
    descPh:     '상품 설명이 여기에 표시됩니다.',
    guest:      '방문 고객',
    guestSub:   '장금이공방 · 수원 화성 행궁',
    menuItems:  [
      { id: 'cs',      label: '고객센터' },
      { id: 'notice',  label: '공지사항' },
      { id: 'review',  label: '후기 작성' },
      { id: 'terms',   label: '서비스 이용 약관' },
      { id: 'privacy', label: '개인정보 처리방침' },
      { id: 'version', label: '앱 버전 1.0.0', right: '최신 버전입니다' },
    ],
    versionOk: '최신 버전입니다',
    splashTitle:'장금이 공방',
    splashSub:  '언어를 선택해 주세요',
    langBtn:    '언어 변경',
    catMap:     { '여성': '여성 한복', '남성': '남성 한복', '아동': '아동 한복' },
  },
  en: {
    tabs:       { home: 'Home', collection: 'Shop', nearby: 'Nearby', booking: 'Book', mypage: 'My' },
    heroTitle:  'A Special Day\nin Perfect Hanbok',
    heroSub:    'AI-powered recommendations for you',
    heroCta:    'Try AI Virtual Fitting',
    catSection: 'Category',
    newSection: 'New Arrivals',
    viewAll:    'View All',
    catSuffix:  '',
    intro:      'About Janggeum',
    all:        'All',
    chips:      ['Filter', 'Color', 'Price'],
    emptyMsg:   'No hanbok in this category',
    colorLabel: 'Color', sizeLabel: 'Size',
    cartBtn:    'Add to Cart', bookBtn:    'Book Now',
    descPh:     'Product description here.',
    guest:      'Guest',
    guestSub:   'Janggeum Hanbok · Hwaseong Haenggung, Suwon',
    menuItems:  [
      { id: 'cs',      label: 'Customer Service' },
      { id: 'notice',  label: 'Announcements' },
      { id: 'review',  label: 'Write a Review' },
      { id: 'terms',   label: 'Terms of Service' },
      { id: 'privacy', label: 'Privacy Policy' },
      { id: 'version', label: 'App Version 1.0.0', right: 'Up to date' },
    ],
    versionOk: 'Up to date',
    splashTitle:'Janggeum Hanbok',
    splashSub:  'Please select your language',
    langBtn:    'Change Language',
    catMap:     { '여성': 'Women', '남성': 'Men', '아동': 'Children' },
  },
  zh: {
    tabs:       { home: '首页', collection: '商品', nearby: '附近', booking: '预约', mypage: '我的' },
    heroTitle:  '特别的日子\n穿上最适合你的韩服',
    heroSub:    'AI为您量身推荐',
    heroCta:    'AI虚拟试穿',
    catSection: '分类',
    newSection: '新品',
    viewAll:    '查看全部',
    catSuffix:  '',
    intro:      '关于长今工坊',
    all:        '全部',
    chips:      ['筛选', '颜色', '价格'],
    emptyMsg:   '该类别暂无韩服',
    colorLabel: '颜色', sizeLabel: '尺码',
    cartBtn:    '加入购物车', bookBtn:    '立即预约',
    descPh:     '商品描述显示在这里。',
    guest:      '访客',
    guestSub:   '长今工坊 · 水原华城行宫',
    menuItems:  [
      { id: 'cs',      label: '客服中心' },
      { id: 'notice',  label: '公告' },
      { id: 'review',  label: '写评价' },
      { id: 'terms',   label: '服务条款' },
      { id: 'privacy', label: '隐私政策' },
      { id: 'version', label: '应用版本 1.0.0', right: '已是最新版本' },
    ],
    versionOk: '已是最新版本',
    splashTitle:'长今工坊',
    splashSub:  '请选择语言',
    langBtn:    '更换语言',
    catMap:     { '여성': '女性', '남성': '男性', '아동': '儿童' },
  },
  ja: {
    tabs:       { home: 'ホーム', collection: 'ショップ', nearby: '周辺', booking: '予約', mypage: 'マイ' },
    heroTitle:  '特別な日に\nぴったりの韓服を',
    heroSub:    'AIがあなたにおすすめします',
    heroCta:    'AI仮想フィッティング',
    catSection: 'カテゴリ',
    newSection: '新着',
    viewAll:    'すべて見る',
    catSuffix:  '',
    intro:      '長今工房について',
    all:        'すべて',
    chips:      ['フィルター', '色', '価格順'],
    emptyMsg:   'このカテゴリの韓服はありません',
    colorLabel: '色', sizeLabel: 'サイズ',
    cartBtn:    'カートに追加', bookBtn:    'すぐ予約',
    descPh:     '商品説明がここに表示されます。',
    guest:      'お客様',
    guestSub:   '長今工房 · 水原華城行宮',
    menuItems:  [
      { id: 'cs',      label: 'カスタマーサービス' },
      { id: 'notice',  label: 'お知らせ' },
      { id: 'review',  label: 'レビューを書く' },
      { id: 'terms',   label: '利用規約' },
      { id: 'privacy', label: 'プライバシーポリシー' },
      { id: 'version', label: 'アプリバージョン 1.0.0', right: '最新バージョンです' },
    ],
    versionOk: '最新バージョンです',
    splashTitle:'長今工房',
    splashSub:  '言語を選んでください',
    langBtn:    '言語変更',
    catMap:     { '여성': '女性', '남성': '男性', '아동': '子ども' },
  },
}

const LANGUAGES = [
  { key: 'ko', flag: 'https://flagcdn.com/w40/kr.png', name: '한국어' },
  { key: 'en', flag: 'https://flagcdn.com/w40/us.png', name: 'English' },
  { key: 'zh', flag: 'https://flagcdn.com/w40/cn.png', name: '中文' },
  { key: 'ja', flag: 'https://flagcdn.com/w40/jp.png', name: '日本語' },
]

/* ══════════════════════════════════════
   예약 탭 전용 다국어
══════════════════════════════════════ */
const BOOKING_I18N = {
  ko: {
    steps:          ['상품 선택', '날짜 선택', '정보 입력'],
    title0: '한복을 선택해주세요', sub0: '원하시는 한복을 선택하세요 (복수 선택 가능)',
    title1: '날짜를 선택해주세요', rental: '대여일', return: '반납일',
    title2: '예약 정보를 입력해주세요',
    rentalTypeLabel: '대여 유형',
    types: [{ key: '일반', label: '일반 대여', sub: '반납일 기준 요금이 적용됩니다.' }, { key: '활영', label: '활영 대여', sub: '활영 일정에 맞는 요금이 적용됩니다.' }],
    contactLabel: '연락처 정보',
    namePh: '이름 *', phonePh: '연락처 *', emailPh: '이메일 *',
    next: '다음', back: '이전', submit: '예약 신청하기', submitting: '처리 중...',
    doneTitle: '예약 신청 완료!', doneSub: '빠른 시간 내에 연락드리겠습니다.', newBook: '새 예약하기',
  },
  en: {
    steps:          ['Select', 'Date', 'Info'],
    title0: 'Select a Hanbok', sub0: 'Choose your favorite hanbok (multiple selection allowed)',
    title1: 'Select Date', rental: 'Rental Date', return: 'Return Date',
    title2: 'Enter Your Info',
    rentalTypeLabel: 'Rental Type',
    types: [{ key: '일반', label: 'Standard Rental', sub: 'Standard daily pricing applies.' }, { key: '활영', label: 'Photo Shoot', sub: 'Special pricing for photo shoots.' }],
    contactLabel: 'Contact Info',
    namePh: 'Full Name *', phonePh: 'Contact *', emailPh: 'Email *',
    next: 'Next', back: 'Back', submit: 'Request Booking', submitting: 'Processing...',
    doneTitle: 'Booking Requested!', doneSub: "We'll contact you within 24 hours.", newBook: 'New Booking',
  },
  zh: {
    steps:          ['选择韩服', '选择日期', '填写信息'],
    title0: '请选择韩服', sub0: '选择您喜欢的韩服（可多选）',
    title1: '请选择日期', rental: '租借日期', return: '归还日期',
    title2: '请填写预约信息',
    rentalTypeLabel: '租借类型',
    types: [{ key: '일반', label: '普通租借', sub: '按归还日期标准计费。' }, { key: '활영', label: '拍摄租借', sub: '按拍摄日程特别计费。' }],
    contactLabel: '联系方式',
    namePh: '姓名 *', phonePh: '联系方式 *', emailPh: '邮箱 *',
    next: '下一步', back: '上一步', submit: '提交预约', submitting: '处理中...',
    doneTitle: '预约已提交！', doneSub: '我们将在24小时内与您联系。', newBook: '重新预约',
  },
  ja: {
    steps:          ['韓服を選択', '日付選択', '情報入力'],
    title0: '韓服を選んでください', sub0: 'お好みの韓服をお選びください（複数選択可）',
    title1: '日付を選んでください', rental: 'レンタル日', return: '返却日',
    title2: '予約情報を入力してください',
    rentalTypeLabel: 'レンタル種別',
    types: [{ key: '일반', label: '通常レンタル', sub: '返却日基準の料金が適用されます。' }, { key: '활영', label: '撮影レンタル', sub: '撮影スケジュールに合わせた料金。' }],
    contactLabel: '連絡先情報',
    namePh: 'お名前 *', phonePh: '連絡先 *', emailPh: 'メールアドレス *',
    next: '次へ', back: '戻る', submit: '予約する', submitting: '処理中...',
    doneTitle: '予約受付完了！', doneSub: '24時間以内にご連絡いたします。', newBook: '新規予約',
  },
}

/* ── 언어에 맞는 한복 제목 반환 ── */
function getHanbokTitle(item, lang) {
  if (lang === 'en' && item.title_en) return item.title_en
  if (lang === 'zh' && item.title_zh) return item.title_zh
  if (lang === 'ja' && item.title_ja) return item.title_ja
  return item.title
}

/* ── 색상명 → CSS 색상 ── */
const COLOR_MAP = {
  '진홍': '#8C1C2F', '청색': '#1E3A6E', '연두': '#7FB069', '연분홍': '#F4B8C1',
  '자주': '#5B2D82', '금색': '#C9A227', '하늘': '#6BB8D4', '흰색': '#F5F0E8',
  '분홍': '#F4A7B9', '노랑': '#FFD166', '진청': '#1A3A5C', '백색': '#F0EBE1',
  '황금': '#C9A227', '옥색': '#3D7A6A', '은회': '#B8BCC8', '먹색': '#2C2C3A',
  '민트': '#7FBEAC', '크림': '#FFF8EE', '연보라': '#A08DBF', '검정': '#1A1A3E',
  '빨간': '#E03030', '파란': '#0022FE', '초록': '#2D8A4E', '보라': '#7B1FA2',
}

const CARD_STYLE = {
  background: '#FFFFFF', border: '1px solid #F0F0F5',
  borderRadius: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
}

/* ── 히어로 슬라이드 이미지 ── */
const STATIC_SLIDES = [
  { url: 'http://search.pstatic.net/common/?src=https%3A%2F%2Fldb-phinf.pstatic.net%2F20210410_183%2F1617984225133UDnEr_PNG%2Fsw7FbEZnt5RhnWJG_pzC_sjs.png',  fit: 'cover',   pos: 'top center' },
  { url: 'https://search.pstatic.net/common/?src=https%3A%2F%2Fldb-phinf.pstatic.net%2F20260412_89%2F1775952791576HXL6G_JPEG%2F1000070560.jpg',                  fit: 'cover',   pos: 'center center' },
  { url: 'https://search.pstatic.net/common/?src=https%3A%2F%2Fldb-phinf.pstatic.net%2F20210410_242%2F1617984225323q0lnM_PNG%2FCM887Rgk__STf_Guf7nrDLyy.png',    fit: 'contain', pos: 'center center' },
  { url: 'https://lh3.googleusercontent.com/gps-cs-s/APNQkAHK1wEatzrUxUChbqdfrJKtzGa-FnIOm__TggXTq3d38E68KBdvnewkurzpZNPzqlmCYzXk4bCYEkrJqMW1MREHxIBuS51c3vm2lCF1BldSp85q4vWtiRaa6Ic33dj6txdqW-WATf7TV4Rr=s1360-w1360-h1020-rw', fit: 'cover', pos: 'center center' },
]

/* ── CAT_LABELS (HanbokSelectGrid용) ── */
const CAT_LABELS = {
  ko: { all: '전체', '여성': '여자', '남성': '남자', '아동': '아동', empty: '해당 카테고리 한복이 없습니다' },
  en: { all: 'All',  '여성': 'Women', '남성': 'Men', '아동': 'Children', empty: 'No hanbok in this category' },
  zh: { all: '全部', '여성': '女性', '남성': '男性', '아동': '儿童', empty: '该类别暂无韩服' },
  ja: { all: '全て', '여성': '女性', '남성': '男性', '아동': '子ども', empty: 'このカテゴリの韓服はありません' },
}

/* ── 헬퍼 ── */
const toggleItem = (prev, item) =>
  prev.some(h => h.id === item.id) ? prev.filter(h => h.id !== item.id) : [...prev, item]

function HanbokSelectGrid({ items, selected, onToggle, label, subLabel, lang = 'ko' }) {
  const [catFilter, setCatFilter] = useState('all')
  const cl = CAT_LABELS[lang] ?? CAT_LABELS.ko
  const availableCats = [...new Set(items.map(i => i.category).filter(Boolean))].sort()
  const filtered = catFilter === 'all' ? items : items.filter(i => i.category === catFilter)

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ borderTop: '1px solid #BDD6FF', paddingTop: '14px' }}>
      <div className="flex items-center justify-between mb-2 flex-none">
        <p className="font-sans font-bold text-[12px]" style={{ color: '#1A1A3E' }}>{label}</p>
        {selected.length > 0 && (
          <span className="font-sans font-bold text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#0022FE', color: '#FFFFFF' }}>
            {selected.length}
          </span>
        )}
      </div>
      <p className="font-sans text-[11px] mb-2.5 flex-none" style={{ color: '#888' }}>{subLabel}</p>
      {availableCats.length > 1 && (
        <div className="flex gap-1.5 mb-3 flex-none">
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
        <div className="flex items-center justify-center py-8 flex-1">
          <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: '#E0E0E0', borderTopColor: '#0022FE' }} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 overflow-y-auto no-scrollbar flex-1 min-h-0" style={{ alignContent: 'start' }}>
          {filtered.map(item => {
            const isSel = selected.some(h => h.id === item.id)
            return (
              <motion.div key={item.id} whileTap={{ scale: 0.97 }} onClick={() => onToggle(item)}
                className="cursor-pointer"
                style={{
                  borderBottom: '1px solid #F0F0F5',
                  borderRight: '1px solid #F0F0F5',
                  padding: '10px',
                }}>
                {/* 이미지 — 컬렉션과 동일한 3:4 비율 */}
                <div className="aspect-[3/4] rounded-xl overflow-hidden relative" style={{ background: '#E8EEFF' }}>
                  {item.image_url && <img src={item.image_url} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />}
                  {isSel && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#0022FE' }}>
                      <Check size={13} style={{ color: '#FFF' }} strokeWidth={3} />
                    </div>
                  )}
                  {isSel && (
                    <div className="absolute inset-0 rounded-xl" style={{ outline: '2.5px solid #0022FE', outlineOffset: '-2px' }} />
                  )}
                </div>
                {/* 이름 */}
                <div className="pt-2">
                  <p className="font-sans font-semibold text-[12px] truncate" style={{ color: isSel ? '#0022FE' : '#1A1A3E' }}>{getHanbokTitle(item, lang)}</p>
                  <p className="font-sans text-[11px] mt-0.5" style={{ color: isSel ? '#4186FF' : '#888' }}>{cl[item.category] ?? item.category}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════
   언어 선택 스플래시
══════════════════════════════════════ */
function LanguageSplash({ onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] overflow-y-auto"
      style={{
        maxWidth: '480px', margin: '0 auto',
        backgroundImage: 'url(/splash.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>

      {/* 우측 상단 브랜드 텍스트 */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        style={{ position: 'sticky', top: '5px', textAlign: 'right', paddingRight: '16px', zIndex: 1 }}>
        <p className="font-sans font-bold text-[11px]" style={{ color: '#1A2B6B', letterSpacing: '-0.01em' }}>장금이공방</p>
        <p className="font-sans text-[9px]" style={{ color: 'rgba(30,50,130,0.5)', letterSpacing: '0.03em' }}>Since 2012</p>
      </motion.div>

      {/* 53% 지점까지 밀어주는 스페이서 */}
      <div style={{ height: '50vh' }} />

      {/* 언어 선택 영역 */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="px-6 pb-10">
        <p className="font-sans text-[12px] text-center mb-3" style={{ color: 'rgba(30,50,130,0.7)' }}>
          Please select your language · 언어를 선택해 주세요
        </p>
        <div className="space-y-2.5">
          {LANGUAGES.map(({ key, flag, name }) => (
            <motion.button key={key} whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(key)}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all"
              style={{
                background: 'rgba(255,255,255,0.6)',
                border: '1.5px solid rgba(255,255,255,0.85)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              }}>
              <img src={flag} alt={name} style={{ width: '28px', height: '20px', objectFit: 'cover', borderRadius: '3px', flexShrink: 0 }} />
              <span className="font-sans font-bold text-[16px]" style={{ color: '#1A2B6B' }}>{name}</span>
              <ChevronRight size={16} style={{ color: 'rgba(40,60,140,0.45)', marginLeft: 'auto' }} />
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ══════════════════════════════════════
   홈 탭
══════════════════════════════════════ */
function HomeTab({ catalog, onDetail, setTab, i18n, lang }) {
  const [slideIdx, setSlideIdx] = useState(0)
  const [visible,  setVisible]  = useState(true)

  const slides = STATIC_SLIDES
  useEffect(() => {
    if (slides.length <= 1) return
    const t = setInterval(() => {
      setVisible(false)
      setTimeout(() => { setSlideIdx(i => (i + 1) % slides.length); setVisible(true) }, 400)
    }, 4000)
    return () => clearInterval(t)
  }, [slides.length])

  const categoryMap = {}
  catalog.forEach(item => { if (item.category && !categoryMap[item.category]) categoryMap[item.category] = item })
  const categories = Object.entries(categoryMap)
  const newItems   = catalog.slice(0, 6)
  const currentSlide = slides[slideIdx]

  return (
    <div className="h-full overflow-y-auto no-scrollbar" style={{ background: '#FFFFFF' }}>

      {/* 히어로 슬라이드쇼 */}
      <div className="relative overflow-hidden" style={{ height: '360px' }}>
        <img src={currentSlide.url} alt="장금이 한복"
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: currentSlide.fit, objectPosition: currentSlide.pos, transition: 'opacity 0.4s ease', opacity: visible ? 1 : 0 }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(10,10,30,0.18) 0%, rgba(10,10,40,0.62) 100%)' }} />
        <div className="absolute inset-0 flex flex-col justify-end px-5 pb-10">
          <h1 className="font-sans font-bold text-white leading-tight"
            style={{ fontSize: '26px', letterSpacing: '-0.03em', textShadow: '0 1px 6px rgba(0,0,0,0.4)', whiteSpace: 'pre-line' }}>
            {i18n.heroTitle}
          </h1>
          <p className="font-sans text-[13px] mt-2 mb-4"
            style={{ color: 'rgba(255,255,255,0.82)', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
            {i18n.heroSub}
          </p>
          <button onClick={() => setTab('fitting')}
            className="self-start flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-sans font-bold text-[13px] transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,0.92)', color: '#1A1A3E', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', boxShadow: '0 2px 12px rgba(0,0,0,0.18)' }}>
            <Sparkles size={14} style={{ color: '#0022FE' }} />
            {i18n.heroCta}
          </button>
        </div>
        {slides.length > 1 && (
          <div className="absolute bottom-4 right-5 flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button key={i} onClick={() => { setSlideIdx(i); setVisible(true) }}
                style={{ height: '4px', borderRadius: '2px', transition: 'all 0.3s ease', width: i === slideIdx ? '20px' : '6px', background: i === slideIdx ? '#FFFFFF' : 'rgba(255,255,255,0.4)' }} />
            ))}
          </div>
        )}
      </div>

      {/* 카테고리 */}
      <div className="pt-5">
        <div className="flex items-center justify-between px-4 mb-3">
          <p className="font-sans font-bold text-[15px]" style={{ color: '#1A1A3E' }}>{i18n.catSection}</p>
          <button onClick={() => setTab('collection')} className="flex items-center gap-0.5 font-sans text-[12px]" style={{ color: '#888' }}>
            {i18n.viewAll} <ChevronRight size={13} />
          </button>
        </div>
        <div className="flex gap-4 px-4 overflow-x-auto no-scrollbar pb-3">
          {categories.length > 0
            ? categories.map(([cat, item]) => (
              <div key={cat} className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer" onClick={() => setTab('collection')}>
                <div className="w-14 h-14 rounded-2xl overflow-hidden" style={{ background: '#E8EEFF' }}>
                  {item.image_url && <img src={item.image_url} alt={cat} className="w-full h-full object-cover" />}
                </div>
                <p className="font-sans text-[10px] whitespace-nowrap" style={{ color: '#333' }}>
                  {i18n.catMap?.[cat] ?? cat + i18n.catSuffix}
                </p>
              </div>
            ))
            : ['여성', '남성', '아동'].map(cat => (
              <div key={cat} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className="w-14 h-14 rounded-2xl" style={{ background: '#E8EEFF' }} />
                <p className="font-sans text-[10px] whitespace-nowrap" style={{ color: '#333' }}>
                  {i18n.catMap?.[cat] ?? cat}
                </p>
              </div>
            ))
          }
        </div>
      </div>

      {/* 신상품 */}
      <div className="pt-4">
        <div className="flex items-center justify-between px-4 mb-3">
          <p className="font-sans font-bold text-[15px]" style={{ color: '#1A1A3E' }}>{i18n.newSection}</p>
          <button onClick={() => setTab('collection')} className="flex items-center gap-0.5 font-sans text-[12px]" style={{ color: '#888' }}>
            {i18n.viewAll} <ChevronRight size={13} />
          </button>
        </div>
        <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar pb-5">
          {(newItems.length > 0 ? newItems : [{}, {}, {}]).map((item, i) => (
            <div key={item.id || i} className="flex-shrink-0 w-32 cursor-pointer" onClick={() => item.id && onDetail(item)}>
              <div className="w-32 h-36 rounded-xl overflow-hidden" style={{ background: '#E8EEFF' }}>
                {item.image_url && <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />}
              </div>
              <p className="font-sans font-semibold text-[12px] mt-1.5 truncate" style={{ color: '#1A1A3E' }}>{getHanbokTitle(item, lang) || '—'}</p>
              <p className="font-sans text-[12px]" style={{ color: '#333' }}>₩ 00,000</p>
            </div>
          ))}
        </div>
      </div>

      {/* 소개 */}
      <div className="mx-4 mb-8" style={{ borderTop: '1px solid #F0F0F5' }}>
        <button className="flex items-center justify-between w-full py-4">
          <p className="font-sans font-semibold text-[13px]" style={{ color: '#1A1A3E' }}>{i18n.intro}</p>
          <ChevronRight size={16} style={{ color: '#ABABAB' }} />
        </button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   카테고리 탭
══════════════════════════════════════ */
function CollectionTab({ catalog, onDetail, i18n, lang }) {
  const [active,   setActive]   = useState('all')
  const [wishlist, setWishlist] = useState([])

  const cats     = [...new Set(catalog.map(i => i.category).filter(Boolean))].sort()
  const cl       = CAT_LABELS[lang] ?? CAT_LABELS.ko
  const filtered = active === 'all' ? catalog : catalog.filter(i => i.category === active)
  const toggleWish = (e, id) => { e.stopPropagation(); setWishlist(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]) }

  return (
    <div className="h-full flex flex-col" style={{ background: '#FFFFFF' }}>

      {/* 카테고리 탭 */}
      <div className="flex-none" style={{ borderBottom: '1px solid #F0F0F5' }}>
        <div className="flex overflow-x-auto no-scrollbar">
          {[{ id: 'all', label: i18n.all }, ...cats.map(c => ({ id: c, label: cl[c] ?? c }))].map(({ id, label }) => (
            <motion.button key={id} onClick={() => setActive(id)} whileTap={{ scale: 0.97 }}
              className="relative flex-none px-4 py-3.5 text-[13px] whitespace-nowrap font-sans"
              style={{ color: active === id ? '#1A1A3E' : '#ABABAB', fontWeight: active === id ? 700 : 400 }}>
              {label}
              {active === id && (
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
        {i18n.chips.map(label => (
          <button key={label} className="flex items-center gap-0.5 px-3 py-1.5 rounded-full font-sans text-[12px]"
            style={{ border: '1px solid #E0E0E0', color: '#333', background: '#FFF' }}>
            {label} ▾
          </button>
        ))}
      </div>

      {/* 그리드 */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {filtered.length === 0
          ? <div className="flex items-center justify-center h-40">
              <p className="font-sans text-[13px]" style={{ color: '#ABABAB' }}>{i18n.emptyMsg}</p>
            </div>
          : <div className="grid grid-cols-2">
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
                        {item.image_url && <img src={item.image_url} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />}
                      </div>
                      <div className="pt-2 flex items-start justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          <p className="font-sans font-semibold text-[13px] truncate" style={{ color: '#1A1A3E' }}>{getHanbokTitle(item, lang)}</p>
                          <p className="font-sans text-[12px] mt-0.5" style={{ color: '#333' }}>₩ 00,000</p>
                        </div>
                        <button onClick={e => toggleWish(e, item.id)} className="flex-shrink-0 mt-0.5">
                          <Heart size={16} fill={wished ? '#E03030' : 'none'} stroke={wished ? '#E03030' : '#CCCCCC'} />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
                {filtered.length % 2 !== 0 && <div style={{ borderBottom: '1px solid #F0F0F5' }} />}
              </AnimatePresence>
            </div>
        }
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   상품 상세 시트
══════════════════════════════════════ */
function HanbokDetailSheet({ item, onClose, onFit, onBook, i18n, lang }) {
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedSize,  setSelectedSize]  = useState(null)
  const [wished, setWished] = useState(false)

  const colors = item?.color ? item.color.split(',').map(c => c.trim()).filter(Boolean) : []
  const SIZES  = ['S', 'M', 'L', 'XL']

  if (!item) return null

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        className="rounded-t-3xl overflow-y-auto no-scrollbar"
        style={{ background: '#FFFFFF', maxHeight: '90dvh' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: '#E0E0E0' }} />
        </div>

        <div className="mx-4 rounded-2xl overflow-hidden" style={{ height: '280px', background: '#E8EEFF' }}>
          {item.image_url && <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />}
        </div>

        <div className="px-4 pt-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-sans font-bold text-[20px]" style={{ color: '#1A1A3E', letterSpacing: '-0.02em' }}>{getHanbokTitle(item, lang)}</p>
              <p className="font-sans font-semibold text-[16px] mt-1" style={{ color: '#1A1A3E' }}>₩ 00,000</p>
            </div>
            <button onClick={() => setWished(w => !w)} className="mt-1">
              <Heart size={22} fill={wished ? '#E03030' : 'none'} stroke={wished ? '#E03030' : '#CCCCCC'} />
            </button>
          </div>
          <p className="font-sans text-[13px] mt-3" style={{ color: '#888' }}>{i18n.descPh}</p>
        </div>

        {colors.length > 0 && (
          <div className="px-4 pt-4">
            <p className="font-sans font-semibold text-[13px] mb-2.5" style={{ color: '#1A1A3E' }}>{i18n.colorLabel}</p>
            <div className="flex gap-2.5">
              {colors.map((color, i) => (
                <button key={i} onClick={() => setSelectedColor(color)}
                  className="w-8 h-8 rounded-full transition-all"
                  style={{ background: COLOR_MAP[color] || '#EEEEEE', outline: selectedColor === color ? '2px solid #1A1A3E' : '2px solid transparent', outlineOffset: '2px' }} />
              ))}
            </div>
          </div>
        )}

        <div className="px-4 pt-4 pb-2">
          <p className="font-sans font-semibold text-[13px] mb-2.5" style={{ color: '#1A1A3E' }}>{i18n.sizeLabel}</p>
          <div className="flex gap-2">
            {SIZES.map(size => (
              <button key={size} onClick={() => setSelectedSize(size)}
                className="w-12 h-10 rounded-lg font-sans font-semibold text-[13px] transition-all active:scale-95"
                style={{ border: `1.5px solid ${selectedSize === size ? '#1A1A3E' : '#E0E0E0'}`, background: selectedSize === size ? '#1A1A3E' : '#FFFFFF', color: selectedSize === size ? '#FFFFFF' : '#333' }}>
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 px-4 pt-3 pb-8">
          <button onClick={onFit}
            className="flex-1 py-3.5 rounded-xl font-sans font-bold text-[14px] transition-all active:scale-95"
            style={{ border: '1.5px solid #0022FE', color: '#0022FE', background: '#FFFFFF' }}>
            {i18n.cartBtn}
          </button>
          <button onClick={onBook}
            className="flex-1 py-3.5 rounded-xl font-sans font-bold text-[14px] transition-all active:scale-95"
            style={{ background: '#0022FE', color: '#FFFFFF' }}>
            {i18n.bookBtn}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ══════════════════════════════════════
   주변 탭
══════════════════════════════════════ */
function NearbyTab({ lang }) {
  return (
    <div className="h-full overflow-hidden">
      <NearbyMap appKey={import.meta.env.VITE_KAKAO_MAP_KEY || ''} lang={lang} />
    </div>
  )
}

/* ══════════════════════════════════════
   AI 피팅 탭
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
   스텝 인디케이터 (파란색)
══════════════════════════════════════ */
function StepIndicator({ current, steps }) {
  return (
    <div className="flex items-center px-5 py-4">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center" style={{ flex: i < steps.length - 1 ? 1 : 'none' }}>
          <div className="flex flex-col items-center gap-1">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-all"
              style={{ background: i <= current ? '#0022FE' : '#F0F0F5', color: i <= current ? '#FFF' : '#ABABAB' }}>
              {i < current ? <Check size={13} strokeWidth={3} /> : i + 1}
            </div>
            <span className="font-sans text-[9px] whitespace-nowrap"
              style={{ color: i === current ? '#0022FE' : '#ABABAB', fontWeight: i === current ? 700 : 400 }}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 mx-1 mb-4"
              style={{ height: '1px', background: i < current ? '#0022FE' : '#E0E0E0' }} />
          )}
        </div>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════
   예약 탭 — 전역 lang 사용, 3단계
══════════════════════════════════════ */
function BookingTab({ catalog, preselect, lang }) {
  const t = BOOKING_I18N[lang] ?? BOOKING_I18N.ko

  const [step, setStep]                       = useState(0)
  const [selectedHanboks, setSelectedHanboks] = useState(preselect ? [preselect] : [])
  const [bookingDate, setBookingDate]         = useState('')
  const [returnDate,  setReturnDate]          = useState('')
  const [rentalType, setRentalType]           = useState('일반')
  const [form, setForm]                       = useState({ name: '', phone: '', email: '' })
  const [submitting, setSubmitting]           = useState(false)
  const [done, setDone]                       = useState(false)

  const toggleHanbok = (item) => {
    setSelectedHanboks(prev =>
      prev.some(h => h.id === item.id)
        ? prev.filter(h => h.id !== item.id)
        : [...prev, item]
    )
  }

  const reset = () => {
    setDone(false); setStep(0); setSelectedHanboks([])
    setBookingDate(''); setReturnDate(''); setRentalType('일반')
    setForm({ name: '', phone: '', email: '' })
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await api.createBooking({
        name: form.name, phone: form.phone, email: form.email || null,
        booking_date: bookingDate || null,
        return_date: returnDate || null,
        rental_type: rentalType || null,
        hanbok_id:    selectedHanboks.map(h => h.id).join(', ') || null,
        hanbok_title: selectedHanboks.map(h => getHanbokTitle(h, lang)).join(', ') || null,
        lang,
      })
      setDone(true)
    } catch { alert(t.submitting) }
    finally { setSubmitting(false) }
  }

  if (done) return (
    <div className="h-full flex flex-col items-center justify-center gap-4 px-6" style={{ background: '#FFFFFF' }}>
      <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: '#EEF3FF' }}>
        <Check size={34} style={{ color: '#0022FE' }} strokeWidth={2.5} />
      </motion.div>
      <p className="font-sans font-bold text-[22px] text-center" style={{ color: '#1A1A3E', letterSpacing: '-0.02em' }}>{t.doneTitle}</p>
      <p className="font-sans text-[13px] text-center" style={{ color: '#888' }}>{t.doneSub}</p>
      <button onClick={reset} className="mt-2 px-8 py-3.5 rounded-xl font-sans font-bold text-[14px]"
        style={{ background: '#0022FE', color: '#FFFFFF' }}>{t.newBook}</button>
    </div>
  )

  return (
    <div className="h-full flex flex-col" style={{ background: '#FFFFFF' }}>
      <StepIndicator current={step} steps={t.steps} />
      <div style={{ height: '1px', background: '#F0F0F5' }} />

      <div className={`flex-1 px-4 py-4 ${step === 0 ? 'flex flex-col overflow-hidden' : 'overflow-y-auto no-scrollbar'}`}>

        {step === 0 && (
          <div className="flex flex-col flex-1 min-h-0">
            <p className="font-sans font-bold text-[15px] mb-0.5 flex-none" style={{ color: '#1A1A3E' }}>{t.title0}</p>
            <p className="font-sans text-[12px] mb-3 flex-none" style={{ color: '#888' }}>{t.sub0}</p>
            <HanbokSelectGrid items={catalog} selected={selectedHanboks}
              onToggle={toggleHanbok}
              label={t.steps[0]} subLabel={t.sub0} lang={lang} />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <p className="font-sans font-bold text-[15px] mb-0.5" style={{ color: '#1A1A3E' }}>{t.title1}</p>
            {selectedHanboks.length > 0 && (
              <div className="flex flex-col gap-2">
                {selectedHanboks.map(hanbok => (
                  <div key={hanbok.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#F8F8FC', border: '1px solid #F0F0F5' }}>
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0" style={{ background: '#E8EEFF' }}>
                      {hanbok.image_url && <img src={hanbok.image_url} alt={getHanbokTitle(hanbok, lang)} className="w-full h-full object-cover" />}
                    </div>
                    <p className="font-sans font-semibold text-[13px]" style={{ color: '#1A1A3E' }}>{getHanbokTitle(hanbok, lang)}</p>
                  </div>
                ))}
              </div>
            )}
            <div>
              <p className="font-sans text-[11px] font-bold mb-1.5 tracking-wide" style={{ color: '#ABABAB' }}>{t.rental}</p>
              <input type="date" className="input-field text-[13px]" value={bookingDate} onChange={e => setBookingDate(e.target.value)} />
            </div>
            <div>
              <p className="font-sans text-[11px] font-bold mb-1.5 tracking-wide" style={{ color: '#ABABAB' }}>{t.return}</p>
              <input type="date" className="input-field text-[13px]" value={returnDate} onChange={e => setReturnDate(e.target.value)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="font-sans font-bold text-[15px] mb-4" style={{ color: '#1A1A3E' }}>{t.title2}</p>

            <div className="rounded-xl overflow-hidden mb-5" style={{ border: '1px solid #F0F0F5' }}>
              {[[t.steps[0], selectedHanboks.map(h => getHanbokTitle(h, lang)).join(', ') || '—'], [t.rental, bookingDate || '—'], [t.return, returnDate || '—']]
                .map(([label, value], i, arr) => (
                  <div key={label} className="flex items-center px-4 py-3"
                    style={{ borderBottom: i < arr.length - 1 ? '1px solid #F0F0F5' : 'none', background: '#FAFBFF' }}>
                    <p className="font-sans text-[12px] flex-shrink-0" style={{ color: '#888', minWidth: '80px' }}>{label}</p>
                    <p className="font-sans text-[13px] font-semibold" style={{ color: '#1A1A3E' }}>{value}</p>
                  </div>
                ))}
            </div>

            <p className="font-sans font-bold text-[13px] mb-3" style={{ color: '#1A1A3E' }}>{t.rentalTypeLabel}</p>
            <div className="space-y-2 mb-5">
              {t.types.map(({ key, label, sub }) => (
                <button key={key} onClick={() => setRentalType(key)}
                  className="w-full flex items-start gap-3 p-4 rounded-xl text-left"
                  style={{ border: `1.5px solid ${rentalType === key ? '#0022FE' : '#E0E0E0'}`, background: '#FFF' }}>
                  <div className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0 flex items-center justify-center"
                    style={{ border: `2px solid ${rentalType === key ? '#0022FE' : '#CCC'}` }}>
                    {rentalType === key && <div className="w-2 h-2 rounded-full" style={{ background: '#0022FE' }} />}
                  </div>
                  <div>
                    <p className="font-sans font-bold text-[13px]" style={{ color: '#1A1A3E' }}>{label}</p>
                    <p className="font-sans text-[11px] mt-0.5" style={{ color: '#888' }}>{sub}</p>
                  </div>
                </button>
              ))}
            </div>

            <p className="font-sans font-bold text-[13px] mb-3" style={{ color: '#1A1A3E' }}>{t.contactLabel}</p>
            <div className="space-y-2.5">
              <input className="input-field text-[13px]" placeholder={t.namePh} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              <input className="input-field text-[13px]" placeholder={t.phonePh} type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              <input className="input-field text-[13px]" placeholder={t.emailPh} type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
          </div>
        )}
      </div>

      <div className="flex-none px-4 py-4 flex gap-2" style={{ borderTop: '1px solid #F0F0F5' }}>
        <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
          className="flex-1 py-3.5 rounded-xl font-sans font-bold text-[14px] disabled:opacity-30"
          style={{ background: '#F0F0F5', color: '#666' }}>
          {t.back}
        </button>
        {step === 2 ? (
          <button onClick={handleSubmit} disabled={submitting || !form.name || !form.phone || !form.email}
            className="flex-1 py-3.5 rounded-xl font-sans font-bold text-[14px] disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: '#0022FE', color: '#FFF' }}>
            {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t.submitting}</> : t.submit}
          </button>
        ) : (
          <button onClick={() => setStep(s => s + 1)} disabled={step === 0 && selectedHanboks.length === 0}
            className="flex-1 py-3.5 rounded-xl font-sans font-bold text-[14px] disabled:opacity-40"
            style={{ background: '#0022FE', color: '#FFF' }}>
            {t.next}
          </button>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   마이 탭
══════════════════════════════════════ */
/* 메뉴 아이템 id → 아이콘 매핑 */
const MENU_ICON_MAP = {
  cs:      Headphones,
  notice:  ClipboardList,
  review:  MessageCircle,
  terms:   FileText,
  privacy: Shield,
  version: RefreshCw,
  lang:    Globe,
}

function MyPageTab({ catalog, lang, i18n, onChangeLang }) {
  return (
    <div className="h-full overflow-y-auto no-scrollbar" style={{ background: '#FFFFFF' }}>

      {/* ── 프로필 헤더 ── */}
      <div className="px-5 pt-5 pb-5" style={{ background: '#FFF', borderBottom: '1px solid #F0F0F5' }}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#E8EEFF' }}>
            <User size={28} style={{ color: '#4186FF' }} />
          </div>
          <div className="flex-1">
            <p className="font-sans font-bold text-[17px]" style={{ color: '#1A1A3E' }}>{i18n.guest}</p>
            <p className="font-sans text-[12px] mt-0.5" style={{ color: '#ABABAB' }}>{i18n.guestSub}</p>
          </div>
          <button onClick={onChangeLang}
            className="flex items-center justify-center w-9 h-9 rounded-full"
            style={{ background: '#F4F4F8' }}>
            <img src={LANGUAGES.find(l => l.key === lang)?.flag} alt={lang}
              style={{ width: '22px', height: '16px', objectFit: 'cover', borderRadius: '2px' }} />
          </button>
        </div>
      </div>

      {/* ── 홍보 배너 ── */}
      <button className="w-full flex items-center gap-3 px-5 py-4 text-left"
        style={{ background: '#F8F9FF', borderBottom: '1px solid #F0F0F5' }}>
        <span style={{ fontSize: '22px' }}>👘</span>
        <p className="font-sans font-semibold text-[13px]" style={{ color: '#1A1A3E' }}>
          {lang === 'ko' ? '장금이공방의 특별 혜택 보러 가기'
          : lang === 'en' ? 'See special offers from Janggeum'
          : lang === 'zh' ? '查看长今工坊的特别优惠'
          : '長今工房の特別特典を見る'}
        </p>
        <ChevronRight size={15} style={{ color: '#ABABAB', marginLeft: 'auto', flexShrink: 0 }} />
      </button>

      {/* ── 메뉴 리스트 ── */}
      <div style={{ background: '#FFF' }}>
        {i18n.menuItems.map(({ id, label, right }, i, arr) => {
          const Icon = MENU_ICON_MAP[id] ?? ChevronRight
          const isLast = i === arr.length - 1
          return (
            <button key={id} className="w-full flex items-center gap-4 px-5 text-left"
              style={{
                height: '62px',
                borderBottom: isLast ? 'none' : '1px solid #F4F4F8',
                background: '#FFF',
              }}>
              <Icon size={22} strokeWidth={1.6} style={{ color: '#ABABAB', flexShrink: 0 }} />
              <p className="font-sans font-medium text-[15px] flex-1" style={{ color: '#1A1A3E' }}>{label}</p>
              {right
                ? <p className="font-sans text-[12px]" style={{ color: '#ABABAB' }}>{right}</p>
                : <ChevronRight size={16} style={{ color: '#D0D0D0' }} />
              }
            </button>
          )
        })}
      </div>

      {/* ── 언어 변경 ── */}
      <div style={{ background: '#FFF', marginTop: '8px', borderTop: '1px solid #F0F0F5', borderBottom: '1px solid #F0F0F5' }}>
        <button onClick={onChangeLang} className="w-full flex items-center gap-4 px-5 text-left" style={{ height: '62px' }}>
          <Globe size={22} strokeWidth={1.6} style={{ color: '#ABABAB', flexShrink: 0 }} />
          <p className="font-sans font-medium text-[15px] flex-1" style={{ color: '#1A1A3E' }}>{i18n.langBtn}</p>
          <span className="font-sans text-[12px] mr-1" style={{ color: '#ABABAB' }}>
            <img src={LANGUAGES.find(l => l.key === lang)?.flag} alt={lang}
              style={{ width: '18px', height: '13px', objectFit: 'cover', borderRadius: '2px', display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
            {LANGUAGES.find(l => l.key === lang)?.name}
          </span>
          <ChevronRight size={16} style={{ color: '#D0D0D0' }} />
        </button>
      </div>

      <p className="text-center font-sans text-[10px] py-8" style={{ color: '#D0D0D0' }}>
        © {new Date().getFullYear()} 장금이 공방. All rights reserved.
      </p>
    </div>
  )
}

/* ── 탭 정의 ── */
const TABS = [
  { id: 'home',       Icon: Home },
  { id: 'collection', Icon: LayoutGrid },
  { id: 'nearby',     Icon: MapPin },
  { id: 'booking',    Icon: Calendar },
  { id: 'mypage',     Icon: User },
]

/* ══════════════════════════════════════
   App (루트)
══════════════════════════════════════ */
export default function App() {
  const [lang, setLang]                       = useState(null)   // null = 언어 미선택
  const [showLangSplash, setShowLangSplash]   = useState(false)
  const [tab, setTab]                         = useState('home')
  const [catalog, setCatalog]                 = useState([])
  const [detailItem, setDetailItem]           = useState(null)
  const [bookingPreselect, setBookingPreselect] = useState(null)
  useEffect(() => { api.getCatalog().then(setCatalog).catch(() => {}) }, [])
  useEffect(() => {
    const h = e => setTab(e.detail?.tab || 'home')
    window.addEventListener('switch-tab', h)
    return () => window.removeEventListener('switch-tab', h)
  }, [])

  const handleFit = useCallback((hanbokId) => {
    window.dispatchEvent(new CustomEvent('prefill-hanbok', { detail: { id: hanbokId } }))
    setDetailItem(null); setTab('fitting')
  }, [])

  const handleBook = useCallback((item) => {
    setBookingPreselect(item); setDetailItem(null); setTab('booking')
  }, [])

  const i18n = APP_I18N[lang] ?? APP_I18N.ko

  // 언어 미선택 → 언어선택 스플래시
  if (!lang || showLangSplash) return (
    <div style={{ height: '100dvh', maxWidth: '480px', margin: '0 auto' }}>
      <LanguageSplash onSelect={key => { setLang(key); setShowLangSplash(false) }} />
    </div>
  )

  return (
    <div className="flex flex-col" style={{ height: '100dvh', maxWidth: '480px', margin: '0 auto', background: '#F8F8FC' }}>

      {/* 헤더 */}
      <header className="flex-none flex items-center safe-top"
        style={{ height: '56px', background: '#FFFFFF', borderBottom: '1px solid #F0F0F5' }}>
        <button className="flex items-center justify-center flex-shrink-0" style={{ width: '48px', height: '56px' }}>
          <Menu size={22} style={{ color: '#1A1A3E' }} />
        </button>
        <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
          <span className="font-sans font-bold" style={{ fontSize: '16px', color: '#1A4FFF', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            장금이공방
          </span>
          <span className="font-sans" style={{ fontSize: '10px', color: '#85AEFF', letterSpacing: '0.04em' }}>
            Janggeum Hanbok · Since 2012
          </span>
        </div>
        {/* 알림 버튼 */}
        <button className="flex items-center justify-center flex-shrink-0" style={{ width: '48px', height: '56px' }}>
          <Bell size={22} style={{ color: '#1A1A3E' }} />
        </button>
      </header>

      {/* 콘텐츠 */}
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }} className="absolute inset-0">
            {tab === 'home'       && <HomeTab catalog={catalog} onDetail={setDetailItem} setTab={setTab} i18n={i18n} lang={lang} />}
            {tab === 'collection' && <CollectionTab catalog={catalog} onDetail={setDetailItem} i18n={i18n} lang={lang} />}
            {tab === 'nearby'     && <NearbyTab lang={lang} />}
            {tab === 'booking'    && <BookingTab catalog={catalog} preselect={bookingPreselect} lang={lang} />}
            {tab === 'mypage'     && <MyPageTab catalog={catalog} lang={lang} i18n={i18n} onChangeLang={() => setShowLangSplash(true)} />}
            {tab === 'fitting'    && <FittingTab catalog={catalog} />}
          </motion.div>
        </AnimatePresence>

        {/* 상품 상세 시트 */}
        <AnimatePresence>
          {detailItem && (
            <HanbokDetailSheet item={detailItem} i18n={i18n} lang={lang}
              onClose={() => setDetailItem(null)}
              onFit={() => handleFit(detailItem.id)}
              onBook={() => handleBook(detailItem)} />
          )}
        </AnimatePresence>
      </main>

      {/* 탭바 */}
      <nav className="flex-none flex safe-bottom"
        style={{
          height: '64px',
          background: 'linear-gradient(to right, #1035C8 0%, #4F78EE 55%, #85AAFF 100%)',
          borderTop: 'none',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -4px 24px rgba(16,53,200,0.22)',
        }}>
        {TABS.map(({ id, Icon }) => {
          const active = tab === id
          const label  = i18n.tabs[id] ?? id
          return (
            <motion.button key={id} onClick={() => setTab(id)} whileTap={{ scale: 0.85 }}
              className="relative flex-1 flex flex-col items-center justify-center gap-0.5">
              {active && (
                <motion.div layoutId="tab-indicator"
                  className="absolute"
                  style={{
                    inset: '6px 8px',
                    background: 'rgba(255,255,255,0.22)',
                    borderRadius: '12px',
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
              )}
              <Icon size={21} strokeWidth={active ? 2.2 : 1.6}
                style={{ color: active ? '#FFFFFF' : 'rgba(255,255,255,0.5)', position: 'relative', zIndex: 1 }}
                className="transition-colors duration-150" />
              <span className="font-sans text-[10px] transition-colors duration-150"
                style={{
                  color: active ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                  fontWeight: active ? 700 : 400,
                  letterSpacing: '-0.01em',
                  position: 'relative', zIndex: 1,
                }}>
                {label}
              </span>
            </motion.button>
          )
        })}
      </nav>
    </div>
  )
}
