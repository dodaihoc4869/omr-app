// HỌC THẬT · ĐỐI PHÓ CỦA EM (app học sinh, thầy 24/10). Tệp riêng để chỉ mảnh nạp lười (HoSoCuaEmHs) kéo về.
import { goiLenhEm } from './ho-so-em-hs-api'
// `POST /hs/danh-gia {token}` (server/src/danh-gia-hoc-that-d1.ts): CHỈ khi thầy bật; chỉ «Học thật» / «Đối phó» + lý do bằng số (Đối phó). Mở thẻ ⇒ máy chủ ghi «em đã xem»
// lời nhắc. Tệp này KHÔNG chứa tên bậc nào khác. Thầy chưa bật / máy chủ cũ ⇒ null (thẻ không hiện).
export interface HocThatEm { nhan: 'Học thật' | 'Đối phó'; tuan: string; lyDo: string[]; lichSu: { tuan: string; nhan: 'Học thật' | 'Đối phó' }[] }
const nhanHop = (x: unknown): 'Học thật' | 'Đối phó' | null => (x === 'Học thật' || x === 'Đối phó' ? x : null)
export async function layHocThatEm(token: string): Promise<HocThatEm | null> {
  if (!token) return null
  const r = await goiLenhEm('/hs/danh-gia', { token })
  if (!r.ok || r.du.bat !== true || r.du.coDanhGia !== true) return null
  const nhan = nhanHop(r.du.nhan)
  if (!nhan) return null
  const ls = Array.isArray(r.du.lichSu) ? r.du.lichSu : []
  return {
    nhan,
    tuan: typeof r.du.tuan === 'string' ? r.du.tuan : '',
    lyDo: nhan === 'Đối phó' && Array.isArray(r.du.lyDo) ? r.du.lyDo.filter((x): x is string => typeof x === 'string' && !!x) : [],
    lichSu: ls.flatMap((x) => { const o = x as Record<string, unknown>; const n = nhanHop(o?.nhan); return n && typeof o.tuan === 'string' ? [{ tuan: o.tuan, nhan: n }] : [] }),
  }
}
