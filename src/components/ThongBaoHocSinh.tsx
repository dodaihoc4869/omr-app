import { lazy, Suspense, useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { layDiaChiMayChu } from '../lib/dia-chi-may-chu'
import { NutTron } from './m3'
import { batNhipBenVung } from '../lib/nhip-ben-vung'
import './m3/thong-bao-hoc-sinh.css'

export type Notice = {
  id: string
  title: string
  body: string
  target: 'btvn' | 'mom'
  created_at: string
  read_at: string | null
}

export async function noticeApi(
  token: string,
  action: string,
  body: Record<string, unknown> = {}
) {
  const c = new AbortController()
  const t = setTimeout(() => c.abort(), 20000)
  try {
    const url = await layDiaChiMayChu()
    const r = await fetch(`${url}/notifications/${action}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, ...body }),
      signal: c.signal,
    })
    const d = await r.json()
    if (!r.ok || !d.ok) throw new Error(d.error || 'Chưa cập nhật được thông báo.')
    return d
  } finally {
    clearTimeout(t)
  }
}

// 09/11 (luật tốc độ): tấm thông báo (danh sách, bật/tắt thông báo đẩy) là mảnh nạp khi bấm chuông — TamThongBaoHs.tsx. Tải hỏng (mất mạng) ⇒ không mở tấm, app không vỡ.
const TamThongBao = lazy(() => import('./TamThongBaoHs').catch(() => ({ default: () => null })))

export default function ThongBaoHocSinh({
  token,
  onOpen,
}: {
  token: string
  onOpen: (tab: 'btvn' | 'mom', noticeId?: string) => void
}) {
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [items, setItems] = useState<Notice[]>([])
  const [open, setOpen] = useState(
    new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').has('thongbao')
  )
  const [key, setKey] = useState('')

  useEffect(() => {
    let alive = true
    let pending = false
    setItems([])
    setLoaded(false)

    const refresh = async (): Promise<boolean> => {
      if (document.hidden || pending) return true
      pending = true
      let ok = true
      try {
        const d = await noticeApi(token, 'list')
        if (alive) {
          setItems(d.items || [])
          setKey(d.publicKey || '')
          setLoaded(true)
          setLoadError('')
        }
      } catch {
        ok = false
        if (alive) setLoadError('Chưa tải được thông báo. App sẽ tự thử lại khi có mạng.')
      } finally {
        pending = false
      }
      return ok
    }

    // Nhịp nền CHẬM (180 s ± 30 s, không gọi chồng, lỗi ⇒ lùi 30 → 60 → 120 s; sự cố D1 21/09: vòng 15 giây × mọi máy em). Quay lại tab / có mạng / tin từ dịch vụ nền vẫn nạp nhưng chặn dội ≥ 20 giây.
    const nhip = batNhipBenVung(refresh)
    const focus = () => nhip.kich()
    const received = (event: MessageEvent) => {
      if (event.data?.type === 'open-student-notices') setOpen(true)
      nhip.kich()
    }

    window.addEventListener('focus', focus)
    window.addEventListener('online', focus)
    navigator.serviceWorker?.addEventListener('message', received)


    return () => {
      alive = false
      nhip.dung()
      window.removeEventListener('focus', focus)
      window.removeEventListener('online', focus)
      navigator.serviceWorker?.removeEventListener('message', received)
    }
  }, [token])
  const count = items.filter((x) => !x.read_at).length
  const demHienThi = count > 99 ? '99+' : String(count)

  return (
    <div className="m3 m3-tb">
      {/* Nút chuông thông báo */}
      <NutTron
        nhan={`Thông báo, ${demHienThi} chưa đọc`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title="Thông báo của em"
        className="m3-tb-chuong"
      >
        <Bell size={22} aria-hidden="true" />
        {count > 0 && <span className="m3-tb-dem">{demHienThi}</span>}
      </NutTron>
      {open && (
        <Suspense fallback={null}>
          <TamThongBao token={token} items={items} setItems={setItems} loaded={loaded} loadError={loadError} khoa={key} onOpen={onOpen} dong={() => setOpen(false)} />
        </Suspense>
      )}
    </div>
  )
}
