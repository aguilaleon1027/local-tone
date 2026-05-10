import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Mail, MapPin, CheckCircle } from 'lucide-react'

const contactItems = [
  { Icon: Phone,  title: '전화 상담', value: '02-1234-5678',         sub: '평일 10:00 - 18:00', color: '#C4782A' },
  { Icon: Mail,   title: '이메일',    value: 'hello@janggeum.kr',    sub: '24시간 접수 가능',    color: '#3A5F7A' },
  { Icon: MapPin, title: '매장 위치', value: '수원 화성 행궁 내 직영점', sub: '경기 수원시 팔달구 행궁로', color: '#8B2820' },
]

const occasions = ['결혼식 / 혼례', '돌잔치', '명절', '졸업식', '포토스튜디오', '일상 생활', '기타']

export default function Contact() {
  const [form, setForm] = useState({ name: '', phone: '', occasion: '', message: '' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const set = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.phone) return
    setSending(true)
    await new Promise((r) => setTimeout(r, 800))
    setSending(false)
    setSent(true)
  }

  return (
    <section id="contact" className="relative py-32" style={{ background: '#130E06' }}>
      <div className="noise-overlay" />
      <div className="orb w-96 h-96 bottom-0 right-0 opacity-10"
        style={{ background: 'radial-gradient(circle, #3D6B4A, transparent 70%)' }} />
      <div className="absolute top-0 left-0 right-0 dancheong-divider" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
            className="flex flex-col gap-8"
          >
            <div>
              <span className="section-tag">CONTACT</span>
              <h2 className="font-serif text-4xl lg:text-5xl font-bold text-cream mt-3">상담 & 문의</h2>
            </div>

            <div className="flex flex-col gap-4">
              {contactItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex items-start gap-4 glass rounded-2xl p-5 roof-accent"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${item.color}20` }}>
                    <item.Icon size={18} strokeWidth={1.5} style={{ color: item.color }} />
                  </div>
                  <div>
                    <p className="font-sans text-xs text-muted uppercase tracking-wider">{item.title}</p>
                    <p className="font-sans text-sm font-medium text-cream mt-1">{item.value}</p>
                    <p className="font-sans text-xs text-muted mt-0.5">{item.sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass rounded-3xl p-12 flex flex-col items-center gap-6 text-center h-full justify-center roof-accent"
                >
                  <CheckCircle size={52} className="text-hwang" strokeWidth={1.5} />
                  <h3 className="font-serif text-2xl font-bold text-cream">상담 신청 완료!</h3>
                  <p className="font-sans text-muted text-sm leading-relaxed">
                    빠른 시간 내에 연락드리겠습니다.<br />감사합니다 😊
                  </p>
                  <button onClick={() => { setSent(false); setForm({ name: '', phone: '', occasion: '', message: '' }) }} className="btn-outline mt-2">
                    다시 문의하기
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleSubmit}
                  className="glass rounded-3xl p-8 flex flex-col gap-5 roof-accent"
                >
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="font-sans text-xs text-muted uppercase tracking-wider">이름 *</label>
                      <input value={form.name} onChange={set('name')} placeholder="홍길동" required className="input-field" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-sans text-xs text-muted uppercase tracking-wider">연락처 *</label>
                      <input value={form.phone} onChange={set('phone')} type="tel" placeholder="010-0000-0000" required className="input-field" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-sans text-xs text-muted uppercase tracking-wider">용도</label>
                    <select value={form.occasion} onChange={set('occasion')} className="input-field">
                      <option value="">선택해주세요</option>
                      {occasions.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-sans text-xs text-muted uppercase tracking-wider">문의 내용</label>
                    <textarea value={form.message} onChange={set('message')} rows={4}
                      placeholder="궁금하신 점을 자유롭게 남겨주세요." className="input-field resize-none" />
                  </div>
                  <button type="submit" disabled={sending} className="btn-gold justify-center mt-2 disabled:opacity-60">
                    {sending ? (
                      <>
                        <div className="relative z-10 w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
                        <span className="relative z-10">전송 중...</span>
                      </>
                    ) : (
                      <span className="relative z-10">상담 신청하기</span>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
