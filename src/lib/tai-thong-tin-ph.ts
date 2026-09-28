// LẤY "CẢNH BÁO CỦA THẦY" CHO MÁY PHỤ HUYNH qua lệnh SẴN CÓ `POST /ph/ke-hoach {pass}` (token phụ huynh, chỉ đúng con của phụ huynh đó; khoá `canhBaoThay`, cửa sổ 72 giờ).
// Tách từ `bo-nao-lay-loi-ph.ts` khi gỡ Bộ não A.I (28/09/2026): bỏ phần lời Bộ não, giữ nguyên phần cảnh báo.
//
// KHÔNG ném lỗi: thiếu mã (phụ huynh vào bằng SBD trần), mất mạng, máy chủ cũ ⇒ danh sách rỗng. Mã phụ huynh chỉ đọc qua `docPass()` của app
// (không hiển thị, không ghi ra console, không đi đâu ngoài chính lệnh này).
import { layDiaChiMayChu } from './dia-chi-may-chu'
import { docPass } from './ph-token'
import { docCanhBaoThay, type CanhBaoThay } from './canh-bao-thay-hien-thi'

const HAN_MS = 15_000

export interface ThongTinPhuHuynh {
  canhBao: CanhBaoThay[]
}
export const KHONG_CO_GI_PH: ThongTinPhuHuynh = { canhBao: [] }

export async function taiThongTinPhuHuynh(): Promise<ThongTinPhuHuynh> {
  const pass = docPass()
  if (!pass) return KHONG_CO_GI_PH
  try {
    const url = await layDiaChiMayChu()
    if (!url) return KHONG_CO_GI_PH
    const bo = new AbortController()
    const hen = setTimeout(() => bo.abort(), HAN_MS)
    try {
      const r = await fetch(`${String(url).replace(/\/+$/, '')}/ph/ke-hoach`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pass }), signal: bo.signal })
      if (!r.ok) return KHONG_CO_GI_PH
      const j = (await r.json()) as { ok?: boolean; canhBaoThay?: unknown } | null
      if (!j || j.ok === false) return KHONG_CO_GI_PH
      return { canhBao: docCanhBaoThay(j.canhBaoThay) }
    } finally {
      clearTimeout(hen)
    }
  } catch {
    return KHONG_CO_GI_PH
  }
}
