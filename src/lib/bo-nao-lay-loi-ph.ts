// BỘ NÃO A.I — LẤY LỜI NHẮN CHO PHỤ HUYNH. Máy chủ (Code 3, đã chốt 21/09): lệnh phụ huynh SẴN CÓ `POST /ph/ke-hoach {pass}`
// (token phụ huynh, chỉ đúng con của phụ huynh đó) thêm `boNaoAi { ngay, loiNhan, thuTuan, tuanTu? }` — chỉ có khi có ít nhất một
// trong hai chữ VÀ bộ não đang chạy THẬT (chạy thử ⇒ không có khoá). Học sinh nhận lời qua /hs/ke-hoach-ngay, không qua đây.
//
// KHÔNG ném lỗi: thiếu mã (phụ huynh vào bằng SBD trần), mất mạng, máy chủ cũ chưa có khoá ⇒ trả null ⇒ không hiện thẻ. Mã phụ huynh
// chỉ đọc qua `docPass()` của app (không hiển thị, không ghi ra console, không đi đâu ngoài chính lệnh này).
import { layDiaChiMayChu } from './dia-chi-may-chu'
import { docPass } from './ph-token'
import { docBoNaoPhuHuynh, type BoNaoPhuHuynh } from './bo-nao-hien-thi'
import { docCanhBaoThay, type CanhBaoThay } from './canh-bao-thay-hien-thi'

const HAN_MS = 15_000

/** Hai thứ phụ huynh lấy chung MỘT lệnh /ph/ke-hoach: lời Bộ não A.I và "Cảnh báo của thầy" (khoá `canhBaoThay`, lời cho phụ huynh, cửa sổ 72 giờ). */
export interface ThongTinPhuHuynh {
  boNao: BoNaoPhuHuynh | null
  canhBao: CanhBaoThay[]
}
export const KHONG_CO_GI_PH: ThongTinPhuHuynh = { boNao: null, canhBao: [] }

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
      const j = (await r.json()) as { ok?: boolean; boNaoAi?: unknown; canhBaoThay?: unknown } | null
      if (!j || j.ok === false) return KHONG_CO_GI_PH
      return { boNao: docBoNaoPhuHuynh(j.boNaoAi), canhBao: docCanhBaoThay(j.canhBaoThay) }
    } finally {
      clearTimeout(hen)
    }
  } catch {
    return KHONG_CO_GI_PH
  }
}

export async function taiBoNaoPhuHuynh(): Promise<BoNaoPhuHuynh | null> {
  return (await taiThongTinPhuHuynh()).boNao
}
