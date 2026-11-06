// Tải cảnh «hình của đề vẽ lại» của câu cho app HỌC SINH (thầy 03/11). Gom mọi câu xin trong ~40 ms thành MỘT lệnh `/hs/hinh-ve` (token học sinh đã lưu);
// nhớ trong bộ nhớ + localStorage (cảnh 6 giờ, «chưa có» 30 phút để khỏi hỏi dồn). Lỗi / không mạng / đóng trong ca kiểm tra ⇒ không có cảnh ⇒ màn giữ ảnh gốc.
// Tệp nằm trong mảnh nạp lười của thẻ hình — không vào lượt mở app.
import { useEffect, useState } from 'react'
import { docTokenHs, goiHs } from '../loi-giai-api'
import { hinhVeDungDuoc, type HinhVeLai } from './kieu'

const KHOA_LUU = 'ddh.hv.v1'
type Luu = Record<string, { h: unknown[]; ms: number }>
const HAN_CO = 6 * 3_600_000, HAN_KHONG = 30 * 60_000
let nho: Luu | null = null
function kho(): Luu {
  if (nho) return nho
  try { const v = JSON.parse(localStorage.getItem(KHOA_LUU) || '{}'); nho = v && typeof v === 'object' ? (v as Luu) : {} } catch { nho = {} }
  return nho
}
/** Đọc MỚI từ đĩa: gói cả ngày (mo-chang-truoc.ts) có thể đã ghi cảnh sau khi tệp này nạp. */
function docDia(): Luu {
  try { const v = JSON.parse(localStorage.getItem(KHOA_LUU) || '{}'); return v && typeof v === 'object' ? (v as Luu) : {} } catch { return {} }
}
function luu(): void {
  try {
    // Gộp với đĩa (giữ bản mới hơn) để không xoá cảnh gói cả ngày vừa ghi.
    const dia = docDia(), bo = kho()
    for (const [q, x] of Object.entries(dia)) if (x && typeof x.ms === 'number' && (!bo[q] || bo[q]!.ms < x.ms)) bo[q] = x
    const ds = Object.entries(bo); nho = ds.length > 300 ? Object.fromEntries(ds.slice(-300)) : bo
    localStorage.setItem(KHOA_LUU, JSON.stringify(nho))
  } catch { /* hết chỗ / chặn lưu */ }
}
const conHan = (x: { h: unknown[]; ms: number } | undefined) => !!x && Date.now() - x.ms < (x.h.length ? HAN_CO : HAN_KHONG)
const lamSach = (h: unknown[]): HinhVeLai[] => h.map(hinhVeDungDuoc).filter((x): x is HinhVeLai => !!x)

let hangCho: Set<string> | null = null
let henGom: Promise<void> | null = null
function xinGom(qid: string): Promise<void> {
  if (!hangCho) {
    hangCho = new Set()
    henGom = new Promise((ok) => setTimeout(() => {
      const ds = [...(hangCho ?? [])]; hangCho = null
      const token = docTokenHs()
      if (!token) { ok(); return }
      void Promise.all(Array.from({ length: Math.ceil(ds.length / 60) }, (_, i) => goiHs('/hs/hinh-ve', { token, qids: ds.slice(i * 60, i * 60 + 60) }).then((r) => {
        const ban = r && r.ok === true && r.ban && typeof r.ban === 'object' ? (r.ban as Record<string, unknown[]>) : {}
        if (r?.dong === true) return // đang có ca kiểm tra mở: không nhớ «chưa có»
        const ms = Date.now()
        for (const q of ds.slice(i * 60, i * 60 + 60)) kho()[q] = { h: Array.isArray(ban[q]) ? ban[q]! : [], ms }
      }).catch(() => undefined))).then(() => luu()).finally(ok)
    }, 40))
  }
  hangCho.add(qid)
  return henGom!
}

/** Cảnh của câu (đã làm sạch khuôn). Không có / lỗi ⇒ []. */
export async function hinhVeCua(qid: string): Promise<HinhVeLai[]> {
  const x = kho()[qid]
  if (conHan(x)) return lamSach(x!.h)
  const d = docDia()[qid] // gói cả ngày đã tải sẵn sau lần đọc đầu
  if (conHan(d)) { kho()[qid] = d!; return lamSach(d!.h) }
  await xinGom(qid)
  return lamSach(kho()[qid]?.h ?? [])
}

/** Hook: cảnh của câu `qid` (null = chưa biết / đang tải). Gắn với câu đã xin: đổi câu ⇒ không hiện cảnh câu cũ. */
export function useHinhVe(qid: string): HinhVeLai[] | null {
  const [kq, setKq] = useState<{ qid: string; h: HinhVeLai[] } | null>(null)
  useEffect(() => {
    let con = true
    void hinhVeCua(qid).then((h) => { if (con) setKq({ qid, h }) })
    return () => { con = false }
  }, [qid])
  return kq && kq.qid === qid ? kq.h : null
}
