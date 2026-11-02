// TẢI SẴN LỜI GIẢI KÍNH LÊN MÁY EM (thầy 02/11: «đẩy sẵn tải sẵn vào app cho hs theo từng ngày», «hiển thị tức thì đầy đủ hiệu ứng»).
// Vừa mở chặng / màn có câu ⇒ `taiSanKinh(token, qids)` gọi MỘT lệnh nền `/hs/loi-giai-kinh` (máy chủ lọc phạm vi như gói đáp án dm), giữ gói «khoá.gói»
// AES-GCM trên máy (bộ nhớ + localStorage, bọc try/catch; gói hết hạn theo ngày VN như dm). Bấm «Kiểm tra» xong ⇒ `banKinhCua(qid)` mở gói NGAY tại máy.
// Không có mạng / lệnh lỗi ⇒ không có bản, màn giữ lời giải đang có. Không vào lệnh nóng nào, không chặn vẽ.
import { docTokenHs, goiHs } from '../loi-giai-api'
import { giaiChuoi } from '../dap-an-may'

const KHOA_LUU = 'ddh.kinh.v1'
const TRAN = 400
type Luu = Record<string, { dm: string; ngay: string }>
const ngayVn = (ms = Date.now()) => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10)

let nho: Luu | null = null
function kho(): Luu {
  if (nho) return nho
  try { const v = JSON.parse(localStorage.getItem(KHOA_LUU) || '{}'); nho = v && typeof v === 'object' ? (v as Luu) : {} } catch { nho = {} }
  const hom = ngayVn()
  for (const [k, v] of Object.entries(nho)) if (!v || v.ngay !== hom) delete nho[k]
  return nho
}
function luu(): void {
  try {
    const ds = Object.entries(kho())
    if (ds.length > TRAN) nho = Object.fromEntries(ds.slice(-TRAN))
    localStorage.setItem(KHOA_LUU, JSON.stringify(nho))
  } catch { /* hết chỗ / chặn lưu: vẫn còn trong bộ nhớ */ }
}

const dangTai = new Map<string, Promise<void>>()
/** Tải nền gói Kính cho các câu chưa có gói hôm nay. Gom trùng; lỗi im lặng. */
export function taiSanKinh(token: string, qids: readonly string[]): Promise<void> {
  if (!token) return Promise.resolve()
  const k = kho()
  const can = [...new Set(qids.filter((q) => q && !k[q] && !dangTai.has(q)))].slice(0, 80)
  if (!can.length) return Promise.all(qids.map((q) => dangTai.get(q)).filter(Boolean)).then(() => undefined)
  const p = goiHs('/hs/loi-giai-kinh', { token, qids: can }).then((r) => {
    const ban = r && r.ok === true && r.ban && typeof r.ban === 'object' ? (r.ban as Record<string, unknown>) : {}
    const hom = ngayVn()
    for (const [q, dm] of Object.entries(ban)) if (typeof dm === 'string' && dm.includes('.')) kho()[q] = { dm, ngay: hom }
    luu()
  }).catch(() => undefined).finally(() => { for (const q of can) dangTai.delete(q) })
  for (const q of can) dangTai.set(q, p)
  return p
}

/** Có gói Kính của câu trên máy chưa (không mở gói). */
export const coGoiKinh = (qid: string): boolean => !!kho()[qid]

// Màn nào cần bản mà máy chưa có (Câu đã làm, Chữa câu sai…): gom mọi câu xin trong cùng ~40 ms thành MỘT lệnh, token lấy từ phiên học sinh đã lưu.
let hangCho: Set<string> | null = null
let henGom: Promise<void> | null = null
function xinGom(qid: string): Promise<void> {
  if (!hangCho) {
    hangCho = new Set()
    henGom = new Promise((ok) => setTimeout(() => { const ds = [...(hangCho ?? [])]; hangCho = null; void taiSanKinh(docTokenHs(), ds).finally(ok) }, 40))
  }
  hangCho.add(qid)
  return henGom!
}
const daXin = new Set<string>()

/** Mở gói Kính của câu (bản THÔ còn `_goc` — nơi vẽ sắp theo câu đã phát bằng `xepTheoCauPhat`). Chưa có ⇒ xin máy chủ một lần (gom). Không có / hỏng ⇒ null. */
export async function banKinhCua(qid: string): Promise<unknown | null> {
  const g = kho()[qid]
  if (!g) {
    await dangTai.get(qid)
    if (!kho()[qid] && !daXin.has(qid)) { daXin.add(qid); await xinGom(qid) }
    if (!kho()[qid]) return null
  }
  const dm = kho()[qid]!.dm
  const i = dm.indexOf('.')
  const chu = i > 0 ? await giaiChuoi(dm.slice(0, i), `kinh|${qid}`, dm.slice(i + 1)) : null
  if (!chu) return null
  try { return JSON.parse(chu) } catch { return null }
}
