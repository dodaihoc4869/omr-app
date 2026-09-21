import { useEffect, useState } from 'react'
import { Crown, Medal, Sparkles } from 'lucide-react'
import { layDiaChiMayChu } from '../lib/dia-chi-may-chu'
import { classroomSpiritImage } from '../lib/anh-than-thu-v2'
import { PETS } from '../game/than-thu-v2/core'
import './BangVinhDanh.css'

type Winner = {
  nickname?: string
  rank: number
  name: string
  score: number
  seconds: number | null
  exam: string
  pet: string | null
  level: number
}

export interface BangVinhDanhProps {
  vaiTro?: 'hocsinh' | 'phuhuynh' | 'giaovien'
  hoTen?: string
  sbd?: string
  lop?: string
  tongSoCa?: number
}

export default function BangVinhDanh({
  vaiTro: _vaiTro,
  hoTen: _hoTen,
  sbd: _sbd,
  lop: _lop,
  tongSoCa: _tongSoCa = 0,
}: BangVinhDanhProps = {}) {
  const [data, setData] = useState<{ day: string; live?: boolean; winners: Winner[] } | null>(null)

  useEffect(() => {
    let alive = true
    let busy = false
    const load = async () => {
      if (busy || document.hidden) return
      busy = true
      const c = new AbortController()
      const t = setTimeout(() => c.abort(), 15000)
      try {
        const url = await layDiaChiMayChu()
        const r = await fetch(`${url}/daily-honors`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: '{}',
          signal: c.signal,
        })
        const d = await r.json()
        if (alive && d.ok) setData(d)
      } catch {
      } finally {
        busy = false
        clearTimeout(t)
      }
    }
    void load()
    const t = setInterval(() => void load(), 30000)
    const focus = () => void load()
    window.addEventListener('focus', focus)
    return () => {
      alive = false
      clearInterval(t)
      window.removeEventListener('focus', focus)
    }
  }, [])

  return (
    <section className="honors" aria-label="Bảng vinh danh học sinh">
      <header className="honors-heading">
        <div>
          <span className="honors-eyebrow">
            <Sparkles size={13} className="text-[var(--vd-vang)]" /> DẤU ẤN MỖI NGÀY
          </span>
          <h2>Bảng vinh danh</h2>
          <p>
            Kết quả ngày {data?.day ? data.day.split('-').reverse().join('/') : 'hôm nay'} ·{' '}
            {data?.live ? 'Vinh danh hôm nay · Chốt lúc 00:01' : 'Đã chốt lúc 00:01'}
          </p>
        </div>
        <Crown className="honors-crown" size={22} />
      </header>

      {data && data.winners.length > 0 ? (
        <div className="honors-podium">
          {data.winners.map((w) => (
            <WinnerCard key={w.rank} winner={w} />
          ))}
        </div>
      ) : (
        <p className="honors-empty">Ngày này chưa có kết quả kiểm tra đủ điều kiện vinh danh.</p>
      )}
    </section>
  )
}

function WinnerCard({ winner: w }: { winner: Winner }) {
  const [image, setImage] = useState('')
  const pet = PETS.findIndex((p) => p.id === w.pet)
  useEffect(() => {
    let active = true
    if (pet >= 0) {
      void classroomSpiritImage(pet, w.level)
        .then((src) => {
          if (active) setImage(src)
        })
        .catch(() => {})
    }
    return () => {
      active = false
    }
  }, [pet, w.level])

  const isTop1 = w.rank === 1
  return (
    <article className={`honors-card honors-rank-${w.rank} ${isTop1 ? 'honors-top1-glow' : ''}`}>
      {isTop1 && (
        <>
          <div className="honors-top1-radiance" aria-hidden="true" />
          <div className="honors-sparkle honors-sparkle-1" aria-hidden="true">✦</div>
          <div className="honors-sparkle honors-sparkle-2" aria-hidden="true">✦</div>
          <div className="honors-sparkle honors-sparkle-3" aria-hidden="true">✦</div>
          <div className="honors-sparkle honors-sparkle-4" aria-hidden="true">✦</div>
        </>
      )}
      <div className="honors-rank">
        {isTop1 ? <Crown size={14} className="honors-crown-spin" /> : <Medal size={14} />}
        <span>TOP {w.rank}</span>
      </div>
      <h3 className="honors-name">{w.name}</h3>
      <div className="honors-spirit">
        {image ? (
          <img
            src={image}
            alt={w.nickname || PETS[pet]?.name || 'Thần thú của học sinh'}
            className={isTop1 ? 'honors-spirit-top1-animated' : 'honors-spirit-normal'}
          />
        ) : (
          <Crown size={isTop1 ? 50 : 40} className={isTop1 ? 'text-amber-400 animate-pulse' : ''} />
        )}
        <div className={`honors-spirit-shadow ${isTop1 ? 'honors-shadow-top1-animated' : ''}`} />
      </div>
      <div className="honors-score">
        {w.score.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}
        <span>/10</span>
      </div>
      <p className="honors-praise">Thầy khen em đạt {w.score.toLocaleString('vi-VN')} điểm!</p>
      <p className="honors-pet">{pet >= 0 ? `${w.nickname || PETS[pet].name} · Cấp ${w.level}` : 'Chưa chọn thần thú'}</p>
      <div className="honors-foot">
        {w.seconds === null
          ? 'Chưa có thời gian hợp lệ'
          : `${Math.floor(w.seconds / 60)} phút ${w.seconds % 60} giây`}
        <span>{w.exam}</span>
      </div>
    </article>
  )
}
