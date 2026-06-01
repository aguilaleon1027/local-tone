import { useState, useEffect, useRef } from 'react'
import { MapPin, X, Phone, ExternalLink, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const SHOP = { lat: 37.28421, lng: 127.01438 }

const CATEGORIES = [
  { id: '맛집' },
  { id: '카페' },
  { id: '관광지' },
]

const CLICK_CATS = ['FD6', 'CE7', 'AT4', 'SW8', 'CT1', 'CS2', 'MT1', 'HP8']

/* ─── 핀 모양 SVG 마커 이미지 URL ─── */
function pinSVG(n, active = false) {
  const bg   = active ? '#B8975A' : '#3D2314'
  const size = active ? 11 : 10
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 9.33 14 22 14 22s14-12.67 14-22C28 6.27 21.73 0 14 0z" fill="${bg}"/>
      <circle cx="14" cy="13" r="7" fill="rgba(255,255,255,0.2)"/>
      <text x="14" y="17" font-family="sans-serif" font-size="${size}" font-weight="bold"
            text-anchor="middle" dominant-baseline="middle" fill="#FDFAF6">${n}</text>
    </svg>`
  )}`
}

/* ─── SDK 로드 (services + clusterer) ─── */
function loadKakaoMaps(appKey) {
  return new Promise((resolve, reject) => {
    if (window.kakao?.maps?.Map) { resolve(); return }

    const init = () => {
      if (window.kakao?.maps?.load) {
        window.kakao.maps.load(resolve)
      } else {
        reject(new Error('Kakao Maps 초기화 실패'))
      }
    }

    const existing = document.querySelector('script[src*="dapi.kakao.com/v2/maps"]')
    if (existing) {
      window.kakao?.maps ? init() : existing.addEventListener('load', init)
      existing.addEventListener('error', reject)
      return
    }

    const s = document.createElement('script')
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services,clusterer`
    s.addEventListener('load', init)
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
export default function NearbyMap({ appKey }) {
  const containerRef  = useRef(null)
  const mapRef        = useRef(null)
  const clustererRef  = useRef(null)
  const markerRefs    = useRef([])
  const skipMapClick  = useRef(false)

  const [mapReady,      setMapReady]      = useState(false)
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
    loadKakaoMaps(appKey)
      .then(() => {
        if (!containerRef.current || mapRef.current) return
        const center = new kakao.maps.LatLng(SHOP.lat, SHOP.lng)
        const map    = new kakao.maps.Map(containerRef.current, { center, level: 3 })
        mapRef.current = map

        /* 장금이 한복 핀 */
        const shopEl = document.createElement('div')
        shopEl.style.cssText = [
          'background:#B8975A', 'color:#FDFAF6', 'font-size:10px', 'font-weight:700',
          'padding:5px 10px', 'border-radius:20px', 'white-space:nowrap',
          'box-shadow:0 2px 10px rgba(0,0,0,0.3)', 'border:1.5px solid #FDFAF6',
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
            background: '#3D2314', color: '#FDFAF6',
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
      .catch(console.error)
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
      const imgUrl  = pinSVG(idx + 1, idx === selected)
      const imgSize = new kakao.maps.Size(28, 36)
      const imgOpt  = { offset: new kakao.maps.Point(14, 36) }
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
      const imgUrl  = pinSVG(idx + 1, idx === selected)
      const imgSize = new kakao.maps.Size(28, 36)
      const imgOpt  = { offset: new kakao.maps.Point(14, 36) }
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
      <div className="flex-none px-4 py-2.5 bg-white" style={{ borderBottom: '1px solid #D4C4B0' }}>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {CATEGORIES.map(c => (
            <motion.button
              key={c.id}
              whileTap={{ scale: 0.94 }}
              onClick={() => { setCategory(c.id); setMoved(false) }}
              className="flex-none flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] whitespace-nowrap transition-all duration-150"
              style={category === c.id
                ? { background: '#3D2314', color: '#FDFAF6', fontWeight: 700 }
                : { background: '#EDE0CF', color: '#6B4C35', fontWeight: 500 }}
            >
              <span>{c.id}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 지도 */}
      <div className="flex-none relative" style={{ height: '40%' }}>
        {appKey ? (
          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2"
            style={{ background: '#EDE0CF' }}>
            <MapPin size={24} style={{ color: '#9C8572' }} />
            <p className="text-[12px] font-medium" style={{ color: '#9C8572' }}>VITE_KAKAO_MAP_KEY 설정 필요</p>
          </div>
        )}

        {/* 로딩 오버레이 */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(245,237,224,0.6)' }}>
              <div className="w-6 h-6 border-2 rounded-full animate-spin"
                style={{ borderColor: '#D4C4B0', borderTopColor: '#3D2314' }} />
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
                background:  '#FDFAF6',
                color:       '#3D2314',
                border:      '1px solid #D4C4B0',
                boxShadow:   '0 2px 12px rgba(61,35,20,0.2)',
                transform:   'translateX(-50%)',   // framer-motion x override용
              }}
            >
              <Search size={12} />
              이 지역에서 검색
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
            style={{ background: '#FDFAF6', border: '1px solid #D4C4B0', boxShadow: '0 4px 20px rgba(61,35,20,0.14)' }}
          >
            <div className="px-4 pt-3.5 pb-2 flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[14px] leading-snug" style={{ color: '#3D2314' }}>
                  {infoPlace.title}
                </p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {infoPlace.category && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: '#EDE0CF', color: '#6B4C35' }}>
                      {infoPlace.category}
                    </span>
                  )}
                  {infoPlace.distance && (
                    <span className="text-[10px]" style={{ color: '#9C8572' }}>
                      · {distLabel(infoPlace.distance)}
                    </span>
                  )}
                  {isMapSource && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: '#F5EDE0', color: '#B8975A', border: '1px solid #D4C4B0' }}>
                      지도 검색
                    </span>
                  )}
                </div>
              </div>
              <button onClick={closeCard} className="p-1.5 rounded-full flex-shrink-0"
                style={{ background: '#EDE0CF' }}>
                <X size={12} style={{ color: '#6B4C35' }} />
              </button>
            </div>

            <div className="px-4 pb-3 space-y-1.5">
              {(infoPlace.roadAddress || infoPlace.address) && (
                <div className="flex items-start gap-2">
                  <MapPin size={11} className="flex-shrink-0 mt-0.5" style={{ color: '#B8975A' }} />
                  <div>
                    {infoPlace.roadAddress && (
                      <p className="text-[11px] font-medium" style={{ color: '#3D2314' }}>
                        {infoPlace.roadAddress}
                      </p>
                    )}
                    {infoPlace.address && infoPlace.address !== infoPlace.roadAddress && (
                      <p className="text-[10px]" style={{ color: '#9C8572' }}>지번 {infoPlace.address}</p>
                    )}
                  </div>
                </div>
              )}
              {infoPlace.telephone && (
                <div className="flex items-center gap-2">
                  <Phone size={11} style={{ color: '#B8975A', flexShrink: 0 }} />
                  <a href={`tel:${infoPlace.telephone}`}
                    className="text-[11px] font-medium" style={{ color: '#3D2314' }}>
                    {infoPlace.telephone}
                  </a>
                </div>
              )}
            </div>

            <div className="flex" style={{ borderTop: '1px solid #EDE0CF' }}>
              {infoPlace.telephone && (
                <a href={`tel:${infoPlace.telephone}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium"
                  style={{ color: '#6B4C35', borderRight: '1px solid #EDE0CF' }}>
                  <Phone size={11} /> 전화
                </a>
              )}
              {infoPlace.link && (
                <a href={infoPlace.link} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold"
                  style={{ color: '#B8975A' }}>
                  <ExternalLink size={11} /> 카카오맵에서 자세히 보기
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 장소 리스트 */}
      <div className="flex-1 overflow-y-auto no-scrollbar mt-1" style={{ background: '#F5EDE0' }}>
        {!loading && places.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-[12px]" style={{ color: '#9C8572' }}>
              {appKey ? '검색 결과가 없습니다' : 'API 키를 설정해주세요'}
            </p>
          </div>
        ) : (
          places.map((p, idx) => (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.99 }}
              onClick={() => { setMapPlace(null); setSelected(prev => prev === idx ? null : idx) }}
              className="w-full text-left px-4 py-3 flex items-start gap-3"
              style={{
                background:   selected === idx ? '#EDE0CF' : 'transparent',
                borderBottom: idx < places.length - 1 ? '1px solid #D4C4B0' : 'none',
              }}
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: selected === idx ? '#B8975A' : '#D4C4B0' }}>
                <span className="text-[10px] font-bold"
                  style={{ color: selected === idx ? '#FDFAF6' : '#6B4C35' }}>
                  {idx + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[13px] truncate"
                  style={{ color: '#3D2314', letterSpacing: '-0.02em' }}>{p.title}</p>
                <p className="text-[11px] mt-0.5" style={{ color: '#9C8572' }}>
                  {p.category}{p.distance ? ` · ${distLabel(p.distance)}` : ''}
                </p>
                <p className="text-[11px] truncate" style={{ color: '#B8A898' }}>
                  {p.roadAddress || p.address}
                </p>
              </div>
              <MapPin size={13} className="flex-shrink-0 mt-1" style={{ color: '#B8975A' }} />
            </motion.button>
          ))
        )}
      </div>
    </div>
  )
}
