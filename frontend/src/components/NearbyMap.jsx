import { useState, useEffect, useRef } from 'react'
import { MapPin, X, Phone, ExternalLink, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const SHOP = { lat: 37.28421, lng: 127.01438 }

const CATEGORIES = [
  { id: '맛집' },
  { id: '카페' },
  { id: '관광지' },
]

const NEARBY_I18N = {
  ko: {
    cats:        { '맛집': '맛집', '카페': '카페', '관광지': '관광지' },
    searchHere:  '이 지역에서 검색',
    call:        '전화',
    kakaoMap:    '카카오맵에서 자세히 보기',
    jibun:       '지번',
    mapSearch:   '지도 검색',
    noResult:    '검색 결과가 없습니다',
    noKey:       'API 키를 설정해주세요',
    mapFail:     '지도를 불러올 수 없습니다',
    mapFailSub:  '카카오 개발자 콘솔에서 현재 도메인을 등록해주세요',
    retry:       '다시 시도',
  },
  en: {
    cats:        { '맛집': 'Restaurant', '카페': 'Café', '관광지': 'Sightseeing' },
    searchHere:  'Search this area',
    call:        'Call',
    kakaoMap:    'View on KakaoMap',
    jibun:       'Lot No.',
    mapSearch:   'Map Result',
    noResult:    'No results found',
    noKey:       'Please set API key',
    mapFail:     'Map could not be loaded',
    mapFailSub:  'Please register this domain in Kakao Developer Console',
    retry:       'Retry',
  },
  zh: {
    cats:        { '맛집': '餐厅', '카페': '咖啡厅', '관광지': '景点' },
    searchHere:  '搜索此区域',
    call:        '电话',
    kakaoMap:    '在KakaoMap查看',
    jibun:       '地番',
    mapSearch:   '地图结果',
    noResult:    '未找到结果',
    noKey:       '请设置API密钥',
    mapFail:     '地图加载失败',
    mapFailSub:  '请在Kakao开发者控制台注册当前域名',
    retry:       '重试',
  },
  ja: {
    cats:        { '맛집': 'グルメ', '카페': 'カフェ', '관광지': '観光地' },
    searchHere:  'このエリアを検索',
    call:        '電話',
    kakaoMap:    'KakaoMapで詳しく見る',
    jibun:       '地番',
    mapSearch:   '地図検索',
    noResult:    '検索結果がありません',
    noKey:       'APIキーを設定してください',
    mapFail:     '地図を読み込めません',
    mapFailSub:  'Kakao開発者コンソールでドメインを登録してください',
    retry:       '再試行',
  },
}

const CLICK_CATS = ['FD6', 'CE7', 'AT4', 'SW8', 'CT1', 'CS2', 'MT1', 'HP8']

/* ─── 핀 모양 SVG 마커 이미지 URL ─── */
function pinSVG(n, active = false) {
  if (active) {
    // 선택됨: 메인 색상 유지, 큰 사이즈로 구분
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">
        <path d="M18 0C8.06 0 0 8.06 0 18c0 12 18 28 18 28s18-16 18-28C36 8.06 27.94 0 18 0z" fill="#0022FE"/>
        <circle cx="18" cy="17" r="9" fill="rgba(255,255,255,0.2)"/>
        <text x="18" y="21" font-family="sans-serif" font-size="12" font-weight="bold"
              text-anchor="middle" dominant-baseline="middle" fill="#FFFFFF">${n}</text>
      </svg>`
    )}`
  }
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 9.33 14 22 14 22s14-12.67 14-22C28 6.27 21.73 0 14 0z" fill="#0022FE"/>
      <circle cx="14" cy="13" r="7" fill="rgba(255,255,255,0.2)"/>
      <text x="14" y="17" font-family="sans-serif" font-size="10" font-weight="bold"
            text-anchor="middle" dominant-baseline="middle" fill="#FFFFFF">${n}</text>
    </svg>`
  )}`
}

/* ─── SDK 로드 (services + clusterer) ─── */
function loadKakaoMaps(appKey) {
  return new Promise((resolve, reject) => {
    // 이미 완전히 로드된 경우
    if (window.kakao?.maps?.Map) { resolve(); return }

    const init = () => {
      if (window.kakao?.maps?.load) {
        window.kakao.maps.load(() => resolve())
      } else {
        reject(new Error('Kakao Maps 초기화 실패'))
      }
    }

    const existing = document.querySelector('script[src*="dapi.kakao.com/v2/maps"]')
    if (existing) {
      // 스크립트는 있지만 아직 로드 중인 경우
      if (existing.dataset.loaded === 'true') {
        // 이미 load 이벤트가 발생했지만 kakao.maps.Map이 없음 → init 재시도
        init()
      } else {
        existing.addEventListener('load', () => { existing.dataset.loaded = 'true'; init() })
        existing.addEventListener('error', () => reject(new Error('Kakao Maps SDK 로드 실패')))
      }
      return
    }

    const s = document.createElement('script')
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services,clusterer`
    s.addEventListener('load', () => { s.dataset.loaded = 'true'; init() })
    s.addEventListener('error', () => reject(new Error('Kakao Maps SDK 로드 실패')))
    document.head.appendChild(s)
  })
}

/* ─── 좌표 근처 장소 검색 (지도 클릭용) ─── */
function searchNearPoint(latlng) {
  return new Promise((resolve) => {
    if (!window.kakao?.maps?.services?.Places) { resolve(null); return }
    const ps = new kakao.maps.services.Places()
    let best = null, pending = CLICK_CATS.length
    CLICK_CATS.forEach(code => {
      ps.categorySearch(code, (data, status) => {
        if (status === kakao.maps.services.Status.OK && data.length > 0) {
          const d = data[0]
          if (!best || Number(d.distance) < Number(best.distance)) best = d
        }
        if (--pending === 0) resolve(best)
      }, { location: latlng, radius: 50, size: 1, sort: kakao.maps.services.SortBy.DISTANCE })
    })
  })
}

function docToPlace(doc) {
  return {
    title:       doc.place_name,
    category:    (doc.category_name || '').split(' > ').pop(),
    address:     doc.address_name      || '',
    roadAddress: doc.road_address_name || '',
    telephone:   doc.phone     || '',
    link:        doc.place_url || '',
    distance:    doc.distance  || '',
    lat:         parseFloat(doc.y),
    lng:         parseFloat(doc.x),
  }
}

function distLabel(d) {
  if (!d) return ''
  return Number(d) < 1000 ? `${d}m` : `${(Number(d) / 1000).toFixed(1)}km`
}

/* ─── 메인 컴포넌트 ─── */
export default function NearbyMap({ appKey, lang = 'ko' }) {
  const t = NEARBY_I18N[lang] ?? NEARBY_I18N.ko
  const containerRef  = useRef(null)
  const mapRef        = useRef(null)
  const clustererRef  = useRef(null)
  const markerRefs    = useRef([])
  const skipMapClick  = useRef(false)

  const [mapReady,      setMapReady]      = useState(false)
  const [mapError,      setMapError]      = useState(null)
  const [category,      setCategory]      = useState('맛집')
  const [searchCenter,  setSearchCenter]  = useState(SHOP)   // 현재 검색 기준 좌표
  const [moved,         setMoved]         = useState(false)   // 지도 이동 감지
  const [places,        setPlaces]        = useState([])
  const [loading,       setLoading]       = useState(false)
  const [selected,      setSelected]      = useState(null)
  const [mapPlace,      setMapPlace]      = useState(null)

  const infoPlace   = selected !== null ? places[selected] : mapPlace
  const isMapSource = selected === null && mapPlace !== null

  /* 카카오맵 초기화 */
  useEffect(() => {
    if (!appKey) return
    setMapError(null)
    loadKakaoMaps(appKey)
      .then(() => {
        if (!containerRef.current || mapRef.current) return
        const center = new kakao.maps.LatLng(SHOP.lat, SHOP.lng)
        const map    = new kakao.maps.Map(containerRef.current, { center, level: 3 })
        mapRef.current = map

        /* 장금이 한복 핀 */
        const shopEl = document.createElement('div')
        shopEl.style.cssText = [
          'background:#015DFE', 'color:#FFFFFF', 'font-size:10px', 'font-weight:700',
          'padding:5px 10px', 'border-radius:20px', 'white-space:nowrap',
          'box-shadow:0 2px 10px rgba(0,0,0,0.3)', 'border:1.5px solid #FFFFFF',
        ].join(';')
        shopEl.textContent = '장금이 한복'
        new kakao.maps.CustomOverlay({ position: center, content: shopEl, map, yAnchor: 1 })

        /* 클러스터러 초기화 */
        clustererRef.current = new kakao.maps.MarkerClusterer({
          map,
          averageCenter: true,
          minLevel: 5,
          disableClickZoom: false,
          styles: [{
            width: '36px', height: '36px', borderRadius: '18px',
            background: '#0022FE', color: '#FFFFFF',
            textAlign: 'center', lineHeight: '36px',
            fontWeight: '700', fontSize: '13px',
            boxShadow: '0 2px 8px rgba(61,35,20,0.4)',
          }],
        })

        /* 지도 이동 감지 */
        kakao.maps.event.addListener(map, 'dragend',      () => setMoved(true))
        kakao.maps.event.addListener(map, 'zoom_changed', () => setMoved(true))

        /* 지도 클릭 → 근처 장소 */
        kakao.maps.event.addListener(map, 'click', async (mouseEvent) => {
          if (skipMapClick.current) return
          const result = await searchNearPoint(mouseEvent.latLng)
          if (result) {
            setSelected(null)
            setMapPlace(docToPlace(result))
          }
        })

        setMapReady(true)
      })
      .catch((err) => {
        console.error(err)
        setMapError(err.message || '지도 로드 실패')
      })
  }, [appKey])

  /* 검색 (카테고리 or 검색 중심 변경 시) */
  useEffect(() => {
    setLoading(true)
    setSelected(null)
    setMapPlace(null)
    setPlaces([])
    const { lat, lng } = searchCenter
    fetch(`/api/places/nearby?category=${encodeURIComponent(category)}&lat=${lat}&lng=${lng}`)
      .then(r => r.json())
      .then(data => { setPlaces(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [category, searchCenter])

  /* 마커 + 클러스터 업데이트 */
  useEffect(() => {
    if (!mapReady || !mapRef.current || !clustererRef.current) return

    // 기존 마커 제거
    markerRefs.current.forEach(m => m.setMap(null))
    clustererRef.current.clear()
    markerRefs.current = []

    const markers = places.map((place, idx) => {
      const isActive = idx === selected
      const imgUrl  = pinSVG(idx + 1, isActive)
      const imgSize = isActive ? new kakao.maps.Size(36, 46) : new kakao.maps.Size(28, 36)
      const imgOpt  = isActive ? { offset: new kakao.maps.Point(18, 46) } : { offset: new kakao.maps.Point(14, 36) }
      const marker  = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(place.lat, place.lng),
        image:    new kakao.maps.MarkerImage(imgUrl, imgSize, imgOpt),
        title:    place.title,
      })

      kakao.maps.event.addListener(marker, 'click', () => {
        skipMapClick.current = true
        setTimeout(() => { skipMapClick.current = false }, 200)
        setMapPlace(null)
        setSelected(prev => prev === idx ? null : idx)
      })

      markerRefs.current.push(marker)
      return marker
    })

    clustererRef.current.addMarkers(markers)
  }, [places, mapReady])

  /* 선택 마커 이미지 교체 */
  useEffect(() => {
    markerRefs.current.forEach((marker, idx) => {
      const isActive = idx === selected
      const imgUrl  = pinSVG(idx + 1, isActive)
      const imgSize = isActive ? new kakao.maps.Size(36, 46) : new kakao.maps.Size(28, 36)
      const imgOpt  = isActive ? { offset: new kakao.maps.Point(18, 46) } : { offset: new kakao.maps.Point(14, 36) }
      marker.setImage(new kakao.maps.MarkerImage(imgUrl, imgSize, imgOpt))
    })
  }, [selected])

  /* 선택 장소로 지도 이동 */
  useEffect(() => {
    if (selected === null || !mapRef.current || !places[selected]) return
    mapRef.current.panTo(new kakao.maps.LatLng(places[selected].lat, places[selected].lng))
  }, [selected])

  /* 이 지역에서 검색 */
  function searchHere() {
    if (!mapRef.current) return
    const c = mapRef.current.getCenter()
    setSearchCenter({ lat: c.getLat(), lng: c.getLng() })
    setMoved(false)
  }

  function closeCard() { setSelected(null); setMapPlace(null) }

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* 카테고리 필터 */}
      <div className="flex-none" style={{ background: '#FFFFFF', borderBottom: '1px solid #F0F0F5' }}>
        <div className="flex overflow-x-auto no-scrollbar">
          {CATEGORIES.map(c => (
            <motion.button
              key={c.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setCategory(c.id); setMoved(false) }}
              className="relative flex-none px-5 py-3.5 text-[13px] whitespace-nowrap font-sans transition-colors duration-150"
              style={{ color: category === c.id ? '#1A1A3E' : '#ABABAB', fontWeight: category === c.id ? 700 : 400 }}
            >
              {t.cats[c.id]}
              {category === c.id && (
                <motion.div
                  layoutId="nearby-underline"
                  className="absolute bottom-0 left-0 right-0"
                  style={{ height: '2px', background: '#1A1A3E', borderRadius: '1px' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* 지도 */}
      <div className="flex-none relative" style={{ height: '40%' }}>
        {/* 지도 컨테이너 (항상 렌더링, 에러/미설정 시 숨김) */}
        <div
          ref={containerRef}
          style={{ width: '100%', height: '100%', display: appKey && !mapError ? 'block' : 'none' }}
        />

        {/* API 키 미설정 */}
        {!appKey && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ background: '#E0EEFF' }}>
            <MapPin size={24} style={{ color: '#4186FF' }} />
            <p className="text-[12px] font-medium" style={{ color: '#4186FF' }}>{t.noKey}</p>
          </div>
        )}

        {/* 로드 에러 */}
        {mapError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: '#EEF3FF' }}>
            <MapPin size={28} style={{ color: '#4186FF' }} />
            <div className="text-center px-4">
              <p className="text-[13px] font-bold" style={{ color: '#0022FE' }}>{t.mapFail}</p>
              <p className="text-[11px] mt-1" style={{ color: '#4186FF' }}>{t.mapFailSub}</p>
              <p className="text-[11px]" style={{ color: '#4186FF' }}>({window.location.origin})</p>
            </div>
            <button
              onClick={() => { setMapError(null); mapRef.current = null; }}
              className="px-4 py-1.5 rounded-full text-[11px] font-bold"
              style={{ background: '#0022FE', color: '#FFF' }}
            >
              {t.retry}
            </button>
          </div>
        )}

        {/* 로딩 오버레이 */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(245,237,224,0.6)' }}>
              <div className="w-6 h-6 border-2 rounded-full animate-spin"
                style={{ borderColor: '#BDD6FF', borderTopColor: '#0022FE' }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 이 지역에서 검색 버튼 */}
        <AnimatePresence>
          {moved && !loading && (
            <motion.button
              initial={{ opacity: 0, y: -8, x: '-50%' }}
              animate={{ opacity: 1, y: 0,  x: '-50%' }}
              exit={{    opacity: 0, y: -8,  x: '-50%' }}
              transition={{ duration: 0.18 }}
              onClick={searchHere}
              className="absolute top-2.5 left-1/2 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-bold"
              style={{
                background:  '#FFFFFF',
                color:       '#0022FE',
                border:      '1px solid #BDD6FF',
                boxShadow:   '0 2px 12px rgba(61,35,20,0.2)',
                transform:   'translateX(-50%)',   // framer-motion x override용
              }}
            >
              <Search size={12} />
              {t.searchHere}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* 상세 카드 */}
      <AnimatePresence>
        {infoPlace && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: -8 }}
            transition={{ duration: 0.16 }}
            className="flex-none mx-3 mt-2.5 rounded-2xl overflow-hidden"
            style={{ background: '#FFFFFF', border: '1px solid #BDD6FF', boxShadow: '0 4px 20px rgba(0,34,254,0.1)' }}
          >
            <div className="px-4 pt-3.5 pb-2 flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[14px] leading-snug" style={{ color: '#0022FE' }}>
                  {infoPlace.title}
                </p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {infoPlace.category && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: '#E0EEFF', color: '#4186FF' }}>
                      {infoPlace.category}
                    </span>
                  )}
                  {infoPlace.distance && (
                    <span className="text-[10px]" style={{ color: '#4186FF' }}>
                      · {distLabel(infoPlace.distance)}
                    </span>
                  )}
                  {isMapSource && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: '#E0EEFF', color: '#0022FE', border: '1px solid #BDD6FF' }}>
                      {t.mapSearch}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={closeCard} className="p-1.5 rounded-full flex-shrink-0"
                style={{ background: '#E0EEFF' }}>
                <X size={12} style={{ color: '#4186FF' }} />
              </button>
            </div>

            <div className="px-4 pb-3 space-y-1.5">
              {(infoPlace.roadAddress || infoPlace.address) && (
                <div className="flex items-start gap-2">
                  <MapPin size={11} className="flex-shrink-0 mt-0.5" style={{ color: '#015DFE' }} />
                  <div>
                    {infoPlace.roadAddress && (
                      <p className="text-[11px] font-medium" style={{ color: '#0022FE' }}>
                        {infoPlace.roadAddress}
                      </p>
                    )}
                    {infoPlace.address && infoPlace.address !== infoPlace.roadAddress && (
                      <p className="text-[10px]" style={{ color: '#4186FF' }}>{t.jibun} {infoPlace.address}</p>
                    )}
                  </div>
                </div>
              )}
              {infoPlace.telephone && (
                <div className="flex items-center gap-2">
                  <Phone size={11} style={{ color: '#015DFE', flexShrink: 0 }} />
                  <a href={`tel:${infoPlace.telephone}`}
                    className="text-[11px] font-medium" style={{ color: '#0022FE' }}>
                    {infoPlace.telephone}
                  </a>
                </div>
              )}
            </div>

            <div className="flex" style={{ borderTop: '1px solid #E0EEFF' }}>
              {infoPlace.telephone && (
                <a href={`tel:${infoPlace.telephone}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium"
                  style={{ color: '#4186FF', borderRight: '1px solid #E0EEFF' }}>
                  <Phone size={11} /> {t.call}
                </a>
              )}
              {infoPlace.link && (
                <a href={infoPlace.link} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold"
                  style={{ color: '#015DFE' }}>
                  <ExternalLink size={11} /> {t.kakaoMap}
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 장소 리스트 */}
      <div className="flex-1 overflow-y-auto no-scrollbar mt-1" style={{ background: '#FFFFFF' }}>
        {!loading && places.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-[12px]" style={{ color: '#ABABAB' }}>
              {appKey ? t.noResult : t.noKey}
            </p>
          </div>
        ) : (
          places.map((p, idx) => (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.99 }}
              onClick={() => { setMapPlace(null); setSelected(prev => prev === idx ? null : idx) }}
              className="w-full text-left py-3 flex items-start gap-3"
              style={{
                background:   selected === idx ? '#F5F7FF' : '#FFFFFF',
                borderBottom: idx < places.length - 1 ? '1px solid #F0F0F5' : 'none',
                borderLeft:   selected === idx ? '3px solid #0022FE' : '3px solid transparent',
                paddingLeft:  '13px',
                paddingRight: '16px',
              }}
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: selected === idx ? '#0022FE' : '#EEEEEE' }}>
                <span className="text-[10px] font-bold"
                  style={{ color: selected === idx ? '#FFFFFF' : '#888888' }}>
                  {idx + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[13px] truncate"
                  style={{ color: selected === idx ? '#0022FE' : '#1A1A3E', letterSpacing: '-0.02em' }}>{p.title}</p>
                <p className="text-[11px] mt-0.5"
                  style={{ color: selected === idx ? '#4186FF' : '#888888' }}>
                  {p.category}{p.distance ? ` · ${distLabel(p.distance)}` : ''}
                </p>
                <p className="text-[11px] truncate"
                  style={{ color: selected === idx ? '#4186FF' : '#ABABAB' }}>
                  {p.roadAddress || p.address}
                </p>
              </div>
              <MapPin size={13} className="flex-shrink-0 mt-1"
                style={{ color: selected === idx ? '#015DFE' : '#ABABAB' }} />
            </motion.button>
          ))
        )}
      </div>
    </div>
  )
}
