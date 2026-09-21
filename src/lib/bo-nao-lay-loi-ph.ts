// BỘ NÃO A.I — LẤY LỜI NHẮN CHO PHỤ HUYNH. Máy chủ (Code 3, đã chốt 21/09): lệnh phụ huynh SẴN CÓ `POST /ph/ke-hoach {pass}`
// (token phụ huynh, chỉ đúng con của phụ huynh đó) thêm `boNaoAi { ngay, loiNhan, thuTuan, tuanTu? }` — chỉ có khi có ít nhất một
// trong hai chữ VÀ bộ não đang chạy THẬT (chạy thử ⇒ không có khoá). Học sinh nhận lời qua /hs/ke-hoach-ngay, không qua đây.
//
// KHÔNG ném lỗi: thiếu mã (phụ huynh vào bằng SBD trần), mất mạng, máy chủ cũ chưa có khoá ⇒ trả null ⇒ không hiện thẻ. Mã phụ huynh
// chỉ đọc qua `docPass()` của app (không hiển thị, không ghi ra console, không đi đâu ngoài chính lệnh này).
import { layDiaChiMayChu } from './dia-chi-may-chu'
import { docPass } from './ph-token'
import { docBoNaoPhuHuynh, type BoNaoPhuHuynh } from './bo-nao-hien-thi'

const HAN_MS = 15_000

export async function taiBoNaoPhuHuynh(): Promise<BoNaoPhuHuynh | null> {
  const pass = docPass()
  if (!pass) return null
  try {
    const url = await layDiaChiMayChu()
    if (!url) return null
    const bo = new AbortController()
    const hen = setTimeout(() => bo.abort(), HAN_MS)
    try {
      const r = await fetch(`${String(url).replace(/\/+$/, '')}/ph/ke-hoach`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pass }), signal: bo.signal })
      if (!r.ok) return null
      const j = (await r.json()) as { ok?: boolean; boNaoAi?: unknown } | null
      return j && j.ok !== false ? docBoNaoPhuHuynh(j.boNaoAi) : null
    } finally {
      clearTimeout(hen)
    }
  } catch {
    return null
  }
}
