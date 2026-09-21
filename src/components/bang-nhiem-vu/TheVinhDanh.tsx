// VÙNG 5 — vinh danh top 3 trong ngày. Máy chủ đã xếp hạng kèm thần thú, biệt
// danh, cấp (`/daily-honors`, server/src/honors.ts) — ở đây CHỈ hiển thị, không
// tính lại. Không viền: tách lớp bằng tonal surface + cao độ. Shimmer chạy 1
// lần lúc tải rồi nhịp 8 s, tắt khi máy xin giảm chuyển động.
import { useEffect, useState } from 'react'
import { Star, Trophy } from 'lucide-react'
import { layDiaChiMayChu } from '../../lib/dia-chi-may-chu'
import { PETS } from '../../game/than-thu-v2/core'
import SpiritArt from '../../game/than-thu-v2/SpiritArt'

export interface NguoiVinhDanh {
  rank: number
  name: string
  nickname?: string
  score: number
  seconds: number | null
  exam: string
  pet: string | null
  level: number
}
export interface DuLieuVinhDanh {
  day: string
  live?: boolean
  winners: NguoiVinhDanh[]
}

async function taiTuMayChu(): Promise<DuLieuVinhDanh | null> {
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
    return d?.ok && Array.isArray(d.winners) ? (d as DuLieuVinhDanh) : null
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

function ngayThang(day: string): string {
  const [, thang, ngay] = day.split('-')
  return ngay && thang ? `${ngay}/${thang}` : day
}

function Hang({ w }: { w: NguoiVinhDanh }) {
  const pet = PETS.findIndex((p) => p.id === w.pet)
  // Luật ẩn danh của BangVinhDanh: có biệt danh thần thú thì dùng, không thì tên
  // máy chủ đã rút gọn; không bao giờ có SBD.
  const ten = w.nickname || w.name
  const diem = w.score.toLocaleString('vi-VN', { maximumFractionDigits: 2 })
  const phut = w.seconds === null ? null : Math.max(1, Math.round(w.seconds / 60))
  return (
    <li className="bnv-vd-hang" data-hang={w.rank} aria-label={`Hạng ${w.rank}: ${ten}, ${diem} điểm`}>
      <span className="bnv-vd-so" aria-hidden="true">
        {w.rank}
      </span>
      {pet >= 0 && (
        <span className="bnv-vd-thu">
          <SpiritArt index={pet} level={w.level} />
        </span>
      )}
      <span className="bnv-the-chu">
        <span className="bnv-vd-ten">
          <span className="bnv-chu-phu">Thần thú</span> {ten}
        </span>
        <span className="bnv-chu-phu">
          {diem} điểm{phut === null ? '' : ` · ${phut} phút`}
        </span>
      </span>
      {w.rank === 1 && <Star className="bnv-vd-sao" size={18} fill="currentColor" aria-hidden="true" />}
    </li>
  )
}

export default function TheVinhDanh({
  tatChuyenDong,
  taiDuLieu = taiTuMayChu,
}: {
  tatChuyenDong: boolean
  /** Chỗ cắm cho test và ảnh chụp; mặc định gọi máy chủ. */
  taiDuLieu?: () => Promise<DuLieuVinhDanh | null>
}) {
  const [data, setData] = useState<DuLieuVinhDanh | null>(null)
  const [daTai, setDaTai] = useState(false)

  useEffect(() => {
    let song = true
    let ban = false
    const nap = async () => {
      if (ban || document.hidden) return
      ban = true
      try {
        const d = await taiDuLieu()
        if (!song) return
        if (d) setData(d)
        setDaTai(true)
      } finally {
        ban = false
      }
    }
    void nap()
    const t = setInterval(() => void nap(), 60000)
    const focus = () => void nap()
    window.addEventListener('focus', focus)
    return () => {
      song = false
      clearInterval(t)
      window.removeEventListener('focus', focus)
    }
  }, [taiDuLieu])

  const top3 = data?.live ? data.winners.slice(0, 3) : []
  const bangCu = !data?.live && data?.winners?.length ? data : null

  return (
    <section
      className={`bnv-vd ${!tatChuyenDong && top3.length > 0 ? 'bnv-vd--dong' : ''}`}
      aria-label="Vinh danh hôm nay"
      data-vung="vinh-danh"
    >
      {top3.length > 0 && <span className="bnv-vd-shimmer" aria-hidden="true" />}
      <div className="bnv-vd-dau">
        <h2>
          <Trophy className="bnv-vd-cup" data-mo={top3.length === 0} size={20} aria-hidden="true" />
          <span>Vinh danh hôm nay</span>
        </h2>
        {top3.length > 0 && (
          <span className="bnv-chu-phu">
            {top3[0].exam} · {ngayThang(data!.day)}
          </span>
        )}
      </div>

      {!daTai ? (
        <div aria-busy="true" aria-label="Đang tải bảng vinh danh" style={{ display: 'grid', gap: 8 }}>
          <div className="bnv-xuong bnv-xuong--dong" />
          <div className="bnv-xuong bnv-xuong--dong" />
        </div>
      ) : top3.length > 0 ? (
        <ol style={{ display: 'grid', gap: 12, margin: 0, padding: 0, listStyle: 'none' }}>
          {top3.map((w) => (
            <Hang key={w.rank} w={w} />
          ))}
        </ol>
      ) : (
        <p className="bnv-chu-phu" style={{ margin: 0, padding: '6px 2px 2px' }}>
          Hôm nay chưa có bài chấm xong.
          {bangCu && ` Bảng ngày ${ngayThang(bangCu.day)}: ${bangCu.winners.slice(0, 3).map((w) => w.nickname || w.name).join(' · ')}.`}
        </p>
      )}
    </section>
  )
}
