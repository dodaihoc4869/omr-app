// TẢI SẴN LỜI GIẢI KÍNH LÊN MÁY EM (thầy 02/11: «đẩy sẵn tải sẵn vào app cho hs theo từng ngày», «hiển thị tức thì đầy đủ hiệu ứng»).
// Vừa mở chặng / màn có câu ⇒ `taiSanKinh(token, qids)` gọi MỘT lệnh nền `/hs/loi-giai-kinh` (máy chủ lọc phạm vi như gói đáp án dm), giữ gói «khoá.gói»
// AES-GCM trên máy (bộ nhớ + localStorage, bọc try/catch; gói hết hạn theo ngày VN như dm). Bấm «Kiểm tra» xong ⇒ `banKinhCua(qid)` mở gói NGAY tại máy.
// Không có mạng / lệnh lỗi ⇒ không có bản, màn giữ lời giải đang có. Không vào lệnh nóng nào, không chặn vẽ.
import { docTokenHs, goiHs } from '../loi-giai-api'
import { giaiChuoi } from '../dap-an-may'

const KHOA_LUU = 'ddh.kinh.v1'
const TRAN = 600
// Câu đã xin mà máy chủ chưa có bản (máy soạn chưa tới / ca còn bảo vệ): giữ dấu trong localStorage 30 phút để đổi màn / tải lại trang không gọi lại D1.
const XIN_LAI_MS = 30 * 60_000
type Luu = Record<string, { dm: string; ngay: string; luc?: number }>
const ngayVn = (ms = Date.now()) => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10)

let nho: Luu | null = null
let rawCuoi: string | null = null
function kho(): Luu {
  let raw: string | null = null
  try { raw = localStorage.getItem(KHOA_LUU) } catch { /* bỏ */ }
  if (nho && raw === rawCuoi) return nho
  rawCuoi = raw
  let trenDia: Luu = {}
  try { const v = JSON.parse(raw || '{}'); if (v && typeof v === 'object') trenDia = v as Luu } catch { /* bỏ */ }
  nho = nho ? { ...trenDia, ...nho } : trenDia
  const hom = ngayVn()
  for (const [k, v] of Object.entries(nho)) if (!v || v.ngay !== hom) delete nho[k]
  return nho
}
function luu(): void {
  try {
    const ds = Object.entries(kho())
    if (ds.length > TRAN) nho = Object.fromEntries(ds.slice(-TRAN))
    const s = JSON.stringify(nho)
    rawCuoi = s
    localStorage.setItem(KHOA_LUU, s)
  } catch { /* hết chỗ / chặn lưu: vẫn còn trong bộ nhớ */ }
}
function daCoHoacVuaXin(v: { dm: string; ngay: string; luc?: number } | undefined, nay = Date.now()): boolean {
  if (!v) return false
  if (v.dm && v.dm.includes('.')) return true
  return v.dm === '' && nay - (v.luc ?? 0) <= XIN_LAI_MS
}

const dangTai = new Map<string, Promise<void>>()
/** Tải nền gói Kính cho các câu chưa có gói hôm nay. Gom trùng; lỗi im lặng. */
export function taiSanKinh(token: string, qids: readonly string[]): Promise<void> {
  if (!token) return Promise.resolve()
  const k = kho()
  const nay = Date.now()
  const tat = [...new Set(qids.filter((q) => q && !daCoHoacVuaXin(k[q], nay) && !dangTai.has(q)))]
  if (tat.length > 80) return Promise.all(Array.from({ length: Math.ceil(tat.length / 80) }, (_, i) => taiSanKinh(token, tat.slice(i * 80, i * 80 + 80)))).then(() => undefined)
  const can = tat
  if (!can.length) return Promise.all(qids.map((q) => dangTai.get(q)).filter(Boolean)).then(() => undefined)
  const p = goiHs('/hs/loi-giai-kinh', { token, qids: can }).then((r) => {
    const ban = r && r.ok === true && r.ban && typeof r.ban === 'object' ? (r.ban as Record<string, unknown>) : null
    if (!ban) return
    const hom = ngayVn(), luc = Date.now(), dong = r?.dong === true
    for (const q of can) {
      const dm = ban[q]
      if (typeof dm === 'string' && dm.includes('.')) kho()[q] = { dm, ngay: hom }
      else if (!dong && !kho()[q]?.dm) kho()[q] = { dm: '', ngay: hom, luc }
    }
    luu()
  }).catch(() => undefined).finally(() => { for (const q of can) dangTai.delete(q) })
  for (const q of can) dangTai.set(q, p)
  return p
}

/** Có gói Kính của câu trên máy chưa (không mở gói). */
export const coGoiKinh = (qid: string): boolean => Boolean(kho()[qid]?.dm)

// Màn nào cần bản mà máy chưa có (Câu đã làm, Chữa câu sai…): gom mọi câu xin trong cùng ~40 ms thành MỘT lệnh, token lấy từ phiên học sinh đã lưu.
let hangCho: Set<string> | null = null
let henGom: Promise<void> | null = null
function xinGom(qid: string): Promise<void> {
  if (!hangCho) {
    hangCho = new Set()
    // Máy chủ nhận tối đa 80 câu một lệnh ⇒ chia lô 80 (trước 03/11 câu thứ 81 trở đi của màn danh sách dài không bao giờ được xin ⇒ «một số câu không hiện lời giải mới»).
    henGom = new Promise((ok) => setTimeout(() => {
      const ds = [...(hangCho ?? [])]; hangCho = null
      const tk = docTokenHs()
      void Promise.all(Array.from({ length: Math.ceil(ds.length / 80) }, (_, i) => taiSanKinh(tk, ds.slice(i * 80, i * 80 + 80)))).finally(ok)
    }, 40))
  }
  hangCho.add(qid)
  return henGom!
}
const daXin = new Map<string, number>()

/** Mở gói Kính của câu (bản THÔ còn `_goc` — nơi vẽ sắp theo câu đã phát bằng `xepTheoCauPhat`). Chưa có ⇒ xin máy chủ một lần (gom). Không có / hỏng ⇒ null. */
export async function banKinhCua(qid: string): Promise<unknown | null> {
  let g = kho()[qid]
  if (!g?.dm) {
    await dangTai.get(qid)
    g = kho()[qid]
    const nay = Date.now()
    if (!daCoHoacVuaXin(g, nay) && nay - (daXin.get(qid) ?? 0) > XIN_LAI_MS) { daXin.set(qid, nay); await xinGom(qid); g = kho()[qid] }
    if (!g?.dm) return null
  }
  const dm = g.dm
  const i = dm.indexOf('.')
  const chu = i > 0 ? await giaiChuoi(dm.slice(0, i), `kinh|${qid}`, dm.slice(i + 1)) : null
  if (!chu) return null
  try { return JSON.parse(chu) } catch { return null }
}
