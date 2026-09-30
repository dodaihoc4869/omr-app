// Chia sẻ CHỈ truy vấn đang bay cho trạng thái phòng chờ công khai.
// Không TTL, không đáp án/đề/tài khoản: xong truy vấn là bỏ, nhịp tiếp theo đọc D1 mới.
import type { Env } from './kieu'
interface TrangThai { trang_thai: string; phong_cho: number | string | null; bat_dau_thi_luc: string | null }
const TRAN_CA_DANG_DOC = 128
const dangDoc = new WeakMap<object, Map<string, Promise<TrangThai | null>>>()
export function docPhongChoDongThoi(env: Env, maCa: string): Promise<TrangThai | null> {
  let kho = dangDoc.get(env.DB)
  if (!kho) { kho = new Map(); dangDoc.set(env.DB, kho) }
  const cu = kho.get(maCa)
  if (cu) return cu
  const p = env.DB.prepare('SELECT trang_thai, phong_cho, bat_dau_thi_luc FROM ca WHERE ma_ca = ?').bind(maCa).first<TrangThai>()
  if (kho.size >= TRAN_CA_DANG_DOC) return p
  kho.set(maCa, p)
  const don = () => { if (kho.get(maCa) === p) kho.delete(maCa) }
  void p.then(don, don)
  return p
}
