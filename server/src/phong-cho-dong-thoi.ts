// Đệm CHỈ giá trị công khai đã đọc xong, không chia sẻ Promise I/O giữa các request workerd.
// Hạn 250 ms từ lúc nhận giá trị (nhịp phòng chờ 3 s), trần 128 ca/isolate. Các cổng vào thi/nộp bài vẫn đọc D1 mới.
// Khi thầy đổi ca, thay toàn bộ Map: lượt đọc cũ đang bay không được lấp lại đệm đã xoá.
import type { Env } from './kieu'
import { dbGoc } from './cau-hinh-dem'
interface TrangThai { trang_thai: string; phong_cho: number | string | null; bat_dau_thi_luc: string | null }
export const HAN_PHONG_CHO_MS = 250
const TRAN_CA = 128
type O = { luc: number; ca: TrangThai | null; dangDoc: boolean }
const dem = new WeakMap<object, Map<string, O>>()
function khoCua(env: Env): Map<string, O> {
  const db = dbGoc(env.DB)
  let kho = dem.get(db)
  if (!kho) { kho = new Map(); dem.set(db, kho) }
  return kho
}
export function xoaDemPhongCho(env: Env): void { dem.delete(dbGoc(env.DB)) }
export async function docPhongChoDongThoi(env: Env, maCa: string): Promise<TrangThai | null> {
  let kho = khoCua(env)
  const nay = Date.now()
  let cu = kho.get(maCa)
  // Không await Promise do request khác tạo. Mỗi lượt có timer riêng để workerd giữ đúng chủ sở hữu I/O.
  // Chỉ đợi tối đa 250 ms; D1 chậm/lượt chủ bị huỷ thì tự đọc lại, không treo cả lớp.
  for (let n = 0; cu?.dangDoc && n < 15 && kho.get(maCa) === cu && dem.get(dbGoc(env.DB)) === kho; n++) {
    await new Promise<void>(xong => setTimeout(xong, 16))
  }
  if (dem.get(dbGoc(env.DB)) !== kho) kho = khoCua(env)
  cu = kho.get(maCa)
  const lucDoc = Date.now()
  if (cu?.ca && lucDoc >= cu.luc && lucDoc - cu.luc < HAN_PHONG_CHO_MS) return { ...cu.ca }
  const o: O = { luc: nay, ca: null, dangDoc: true }
  kho.set(maCa, o)
  if (kho.size > TRAN_CA) kho.delete(kho.keys().next().value!)
  try {
    const ca = await env.DB.prepare('SELECT trang_thai, phong_cho, bat_dau_thi_luc FROM ca WHERE ma_ca = ?').bind(maCa).first<TrangThai>()
    if (ca && dem.get(dbGoc(env.DB)) === kho && kho.get(maCa) === o) {
      o.ca = { ...ca }; o.luc = Date.now()
    }
    return ca
  } finally {
    o.dangDoc = false
    if (!o.ca && kho.get(maCa) === o) kho.delete(maCa)
  }
}
