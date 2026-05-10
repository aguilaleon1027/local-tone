import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Image, Sparkles, Check, RotateCcw, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { api } from '../utils/api'

const slide = {
  enter: (dir) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: (dir) => ({ x: dir > 0 ? -50 : 50, opacity: 0, transition: { duration: 0.25 } }),
}

function StepIndicator({ current, total = 3 }) {
  const labels = ['사진 업로드', '한복 선택', '결과 확인']
  return (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-sans text-sm font-semibold transition-all duration-300 ${
              i < current  ? 'bg-hwang text-white' :
              i === current ? 'border-2 border-hwang text-hwang bg-hwang/8' :
                              'border border-stone/40 text-stone bg-surface'
            }`}>
              {i < current ? <Check size={14} strokeWidth={2.5} /> : i + 1}
            </div>
            <span className={`font-sans text-[10px] whitespace-nowrap font-medium ${
              i === current ? 'text-hwang' : i < current ? 'text-muted' : 'text-stone'
            }`}>{labels[i]}</span>
          </div>
          {i < total - 1 && (
            <div className={`w-16 h-px mb-5 mx-2 transition-all duration-500 ${
              i < current ? 'bg-hwang' : 'bg-stone/20'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}

function Step1({ onNext }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef()

  const handleFile = (f) => {
    if (!f || !f.type.startsWith('image/')) return
    if (f.size > 10 * 1024 * 1024) { alert('10MB 이하의 파일을 선택해주세요.'); return }
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [])

  const handleNext = async () => {
    if (!file) return
    setUploading(true)
    try {
      const res = await api.uploadPhoto(file)
      onNext(res.photo_id)
    } catch {
      alert('업로드에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 업로드 영역 */}
      <div
        onClick={() => !preview && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden ${
          dragging  ? 'border-hwang bg-hwang/5 scale-[1.01]' :
          preview   ? 'border-stone/20 cursor-default' :
                      'border-stone/30 hover:border-hwang/50 hover:bg-hwang/3 cursor-pointer'
        }`}
        style={{ minHeight: '220px' }}
      >
        {preview ? (
          <div className="relative">
            <img src={preview} alt="preview" className="w-full object-cover rounded-2xl max-h-64" />
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null) }}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-12 px-6">
            <div className="w-14 h-14 rounded-2xl bg-hwang/10 flex items-center justify-center">
              <Upload size={24} className="text-hwang" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <p className="font-sans text-ink text-sm font-medium">사진을 드래그하거나 클릭하여 업로드</p>
              <p className="font-sans text-stone text-xs mt-1">JPG, PNG, WEBP · 최대 10MB</p>
            </div>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => handleFile(e.target.files[0])} />
      </div>

      {/* 팁 카드 */}
      <div className="card p-4">
        <p className="font-sans text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">좋은 결과를 위한 팁</p>
        <ul className="space-y-1.5">
          {['정면을 바라보는 전신 사진', '밝고 깨끗한 배경', '몸 전체가 나오는 구도'].map((t) => (
            <li key={t} className="flex items-center gap-2 font-sans text-xs text-muted">
              <span className="w-1 h-1 rounded-full bg-hwang flex-shrink-0" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={handleNext}
        disabled={!file || uploading}
        className="btn-gold justify-center disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {uploading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>업로드 중...</span>
          </>
        ) : (
          <>
            <Image size={15} />
            <span>다음: 한복 선택</span>
          </>
        )}
      </button>
    </div>
  )
}

function Step2({ photoId, prefillId, onNext, onBack }) {
  const [items, setItems] = useState([])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    api.getCatalog().then(setItems).catch(() => {})
  }, [])

  useEffect(() => {
    if (prefillId && items.length) {
      const i = items.findIndex((h) => h.id === prefillId)
      if (i >= 0) setIndex(i)
    }
  }, [prefillId, items])

  const selected = items[index] || null
  const go = (dir) => setIndex((i) => Math.max(0, Math.min(items.length - 1, i + dir)))

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowLeft') go(-1)
    if (e.key === 'ArrowRight') go(1)
  }, [items.length])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="flex flex-col gap-5">
      {/* 캐러셀 */}
      <div className="relative flex items-center justify-center" style={{ height: '280px' }}>
        {items.map((item, i) => {
          const offset = i - index
          const abs = Math.abs(offset)
          if (abs > 2) return null

          return (
            <motion.div
              key={item.id}
              className="absolute rounded-2xl overflow-hidden cursor-pointer shadow-lg"
              style={{ width: 130, height: 240 }}
              animate={{
                x: offset * 145,
                scale: abs === 0 ? 1 : abs === 1 ? 0.73 : 0.55,
                opacity: abs === 0 ? 1 : abs === 1 ? 0.45 : 0.15,
                filter: `blur(${abs === 0 ? 0 : abs === 1 ? 2 : 5}px)`,
                zIndex: 10 - abs,
              }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              onClick={() => abs > 0 && setIndex(i)}
            >
              <div className="absolute inset-0" style={{ background: item.gradient }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              {abs === 0 && (
                <div className="absolute bottom-3 inset-x-2 text-center">
                  <p className="font-serif text-xs font-semibold text-white truncate">{item.name}</p>
                </div>
              )}
            </motion.div>
          )
        })}

        <button
          onClick={() => go(-1)}
          disabled={index === 0}
          className="absolute left-0 z-20 w-9 h-9 rounded-full bg-white shadow-md border border-border flex items-center justify-center text-ink hover:text-hwang transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => go(1)}
          disabled={index === items.length - 1}
          className="absolute right-0 z-20 w-9 h-9 rounded-full bg-white shadow-md border border-border flex items-center justify-center text-ink hover:text-hwang transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* 점 인디케이터 */}
      <div className="flex items-center justify-center gap-1.5">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`rounded-full transition-all duration-300 ${
              i === index ? 'w-5 h-1.5 bg-hwang' : 'w-1.5 h-1.5 bg-stone/30 hover:bg-stone/50'
            }`}
          />
        ))}
      </div>

      {/* 선택 정보 */}
      <AnimatePresence mode="wait">
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="text-center"
          >
            <span className="font-sans text-[11px] font-semibold text-hwang uppercase tracking-widest">{selected.category}</span>
            <h3 className="font-sans text-lg font-bold text-ink mt-1" style={{ letterSpacing: '-0.03em' }}>{selected.name}</h3>
            <p className="font-sans text-xs text-muted mt-1.5 leading-relaxed line-clamp-2">{selected.description}</p>
            <div className="flex items-center justify-center gap-1.5 mt-2.5 flex-wrap">
              {selected.colors?.map((c) => (
                <span key={c} className="font-sans text-[11px] px-2.5 py-1 rounded-full bg-s2 text-muted border border-border">{c}</span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2.5">
        <button onClick={onBack} className="btn-outline gap-1.5 px-4">
          <ChevronLeft size={15} />이전
        </button>
        <button
          onClick={() => onNext(selected)}
          disabled={!selected}
          className="btn-gold flex-1 justify-center disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Sparkles size={15} />
          <span>AI 피팅 시작하기</span>
        </button>
      </div>
    </div>
  )
}

function Step3({ photoId, hanbok, onRetry }) {
  const [status, setStatus] = useState('loading')
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!photoId || !hanbok) return
    setStatus('loading')
    api.generateFitting(photoId, hanbok.id)
      .then((res) => { setResult(res); setStatus('done') })
      .catch(() => setStatus('error'))
  }, [photoId, hanbok])

  const goConsult = () => window.dispatchEvent(new CustomEvent('switch-tab', { detail: { tab: 'info' } }))

  return (
    <div className="flex flex-col items-center gap-5 py-4 text-center">
      {status === 'loading' && (
        <>
          <div className="relative w-20 h-20">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute inset-0 rounded-full border border-hwang/25 animate-ping"
                style={{ animationDelay: `${i * 0.3}s`, animationDuration: '1.5s' }}
              />
            ))}
            <div className="absolute inset-3 rounded-full border-2 border-hwang/40 flex items-center justify-center bg-hwang/5">
              <Sparkles className="text-hwang animate-pulse" size={20} />
            </div>
          </div>
          <div>
            <p className="font-sans text-base text-ink font-bold" style={{ letterSpacing: '-0.025em' }}>AI가 피팅 중입니다...</p>
            <p className="font-sans text-xs text-muted mt-1.5">잠시만 기다려 주세요</p>
          </div>
        </>
      )}

      {status === 'done' && (
        <>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 16 }}
            className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#F2F2F2' }}
          >
            <Check size={24} className="text-nok" strokeWidth={2.5} />
          </motion.div>

          <motion.h3
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="font-sans text-xl font-bold text-ink" style={{ letterSpacing: '-0.035em' }}
          >
            피팅 완료!
          </motion.h3>

          {/* 이미지 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="w-full"
          >
            {result?.result_image_url ? (
              <div className="relative rounded-2xl overflow-hidden shadow-md">
                <img src={result.result_image_url} alt="AI 피팅 결과" className="w-full object-cover rounded-2xl" />
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  <Sparkles size={10} className="text-white" />
                  <span className="font-sans text-[10px] font-semibold text-white">AI 피팅 결과</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="relative rounded-2xl overflow-hidden shadow-sm">
                  <img
                    src={result?.photo_url}
                    alt="업로드 사진"
                    className="w-full object-cover aspect-[3/4] rounded-2xl"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2.5">
                    <p className="font-sans text-[11px] text-white/90 font-medium">내 사진</p>
                  </div>
                </div>
                <div
                  className="relative rounded-2xl aspect-[3/4] flex flex-col items-center justify-end p-3 shadow-sm"
                  style={{ background: hanbok?.gradient }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl" />
                  <div className="relative z-10 text-center">
                    <p className="font-serif text-xs font-semibold text-white">{hanbok?.name}</p>
                    <p className="font-sans text-[10px] text-white/70 mt-0.5">{hanbok?.category}</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* AI 추천 */}
          {result?.ai_recommendation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="w-full p-4 text-left" style={{ background: '#F8F8F8', border: '1px solid #E8E8E8', borderLeft: '3px solid #111111', borderRadius: '12px' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={13} className="text-hwang" />
                <span className="font-sans text-[11px] font-bold text-hwang uppercase tracking-wider">AI 스타일 추천</span>
              </div>
              <p className="font-sans text-xs text-muted leading-relaxed">{result.ai_recommendation}</p>
            </motion.div>
          )}

          {/* 버튼 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex gap-2.5 w-full"
          >
            <button onClick={onRetry} className="btn-outline flex-1 gap-1.5 justify-center px-3">
              <RotateCcw size={13} />다시 피팅
            </button>
            <button onClick={goConsult} className="btn-gold flex-1 justify-center">
              <span>구매 상담하기</span>
            </button>
          </motion.div>
        </>
      )}

      {status === 'error' && (
        <>
          <p className="font-sans text-sm text-muted">오류가 발생했습니다.</p>
          <button onClick={onRetry} className="btn-outline gap-2"><RotateCcw size={14} />다시 시도</button>
        </>
      )}
    </div>
  )
}

export default function FittingWizard() {
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [photoId, setPhotoId] = useState(null)
  const [hanbok, setHanbok] = useState(null)
  const [prefillId, setPrefillId] = useState(null)

  const go = (n) => { setDir(n > step ? 1 : -1); setStep(n) }

  useEffect(() => {
    const handler = (e) => setPrefillId(e.detail?.id)
    window.addEventListener('prefill-hanbok', handler)
    return () => window.removeEventListener('prefill-hanbok', handler)
  }, [])

  const reset = () => { setStep(0); setPhotoId(null); setHanbok(null); setPrefillId(null) }

  return (
    <div className="card p-5">
      <StepIndicator current={step} />
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div key={step} custom={dir} variants={slide} initial="enter" animate="center" exit="exit">
          {step === 0 && <Step1 onNext={(id) => { setPhotoId(id); go(1) }} />}
          {step === 1 && <Step2 photoId={photoId} prefillId={prefillId} onNext={(h) => { setHanbok(h); go(2) }} onBack={() => go(0)} />}
          {step === 2 && <Step3 photoId={photoId} hanbok={hanbok} onRetry={reset} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
