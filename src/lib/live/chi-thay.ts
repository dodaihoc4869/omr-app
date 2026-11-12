// «CHỈ GIỌNG THẦY» — CỜ, CÔNG TẮC LÙI KHẨN, TẢI MÔ HÌNH (lượt 2, 11/11 đêm; docs/do-live-1011.md mục 11). Mảnh nhỏ (chỉ nhập địa chỉ máy chủ + mã thầy).
// ĐƯỜNG THỬ CHỈ-THẦY (12/11, thầy muốn thử ngay dù mô hình chưa đạt đủ 4 tiêu chí mục 10.5) — MẶC ĐỊNH KHÔNG CHỌN.
// 12/11 trưa (thầy mở bảng mic Live hỏi «bộ tách giọng đâu» — link bật chưa vào được máy thầy): nút «Chỉ giọng thầy» LUÔN HIỆN trong hàng Lọc ồn của app
// thầy (chỉ app thầy gọi chiThayCo), không còn phụ thuộc link; chưa bấm thì đường tiếng y như cũ. Địa chỉ mô hình: `ddh.live.chi-thay-url` nếu có,
// không thì lệnh mô hình của máy chủ app (`layDiaChiMayChu()` + DUONG_MO_HINH_THAY, mã thầy gửi kèm). Link `?chi-thay=bat` / `?chi-thay=tat` vẫn chạy
// (đọc ở src/lib/dong-bo-thu-muc.ts — việc nền của vỏ app thầy đã mở khoá).
// CÔNG TẮC LÙI KHẨN: `ddh.live.chi-thay` = 'tat' ⇒ không bao giờ chạy mô hình (mức «Chỉ giọng thầy» coi như Tắt lọc), không hiện nút.
// Tệp mô hình (.tgt ≈ 2 MB) tải LƯỜI lần đầu thầy bật, KHÔNG nằm trong kho / precache của service worker. Giọng thầy là dữ liệu riêng ⇒ nằm trong R2
// sau lệnh có mã thầy của Worker (`GET /gv/mo-hinh-thay`, server/src/mo-hinh-thay.ts); mã thầy CHỈ gửi kèm khi địa chỉ mô hình đúng là máy chủ của app.
import { layDiaChiMayChu } from '../dia-chi-may-chu'
import { loadTeacherSecret } from '../exam-db'

/** Địa chỉ mô hình phát hành (null = chưa phát hành: chỉ chạy khi thầy bật bằng link). */
export const URL_MO_HINH_THAY: string | null = null
/** Lệnh mô hình trên máy chủ (cần mã thầy). */
export const DUONG_MO_HINH_THAY = '/gv/mo-hinh-thay'

const doc = (k: string): string => { try { return typeof localStorage !== 'undefined' ? localStorage.getItem(k) ?? '' : '' } catch { return '' } }
const ghi = (k: string, v: string): void => { try { localStorage.setItem(k, v) } catch { /* bị chặn */ } }
/** Công tắc lùi khẩn bật? */
export const chiThayTatKhan = (): boolean => doc('ddh.live.chi-thay') === 'tat'
/** Địa chỉ mô hình đang dùng (bản thử trong localStorage trước, rồi bản phát hành). */
export const urlMoHinhThay = (): string | null => { const u = doc('ddh.live.chi-thay-url'); return /^(https:\/\/|\/)/.test(u) ? u : URL_MO_HINH_THAY }
/** Có hiện mức «Chỉ giọng thầy» không: luôn hiện (app thầy), trừ khi lùi khẩn. */
export const chiThayCo = (): boolean => !chiThayTatKhan()
/** Địa chỉ lệnh mô hình trên máy chủ của app (null = chưa đọc được địa chỉ https). */
async function diaChiMoHinhMayChu(): Promise<string | null> {
  try { const g = (await layDiaChiMayChu()).replace(/\/+$/, ''); return /^https:\/\//.test(g) ? g + DUONG_MO_HINH_THAY : null } catch { return null }
}

/** CÔNG TẮC ẨN của app thầy (đường vào có `chi-thay=`): 'bat' ⇒ hiện mức + địa chỉ lệnh mô hình của máy chủ; 'tat' ⇒ lùi khẩn. */
export async function apChiThayUrl(timKiem: string, layGoc: () => Promise<string> = () => layDiaChiMayChu()): Promise<void> {
  const v = new URLSearchParams(timKiem).get('chi-thay')
  if (v === 'tat') { ghi('ddh.live.chi-thay', 'tat'); return }
  if (v !== 'bat') return
  let goc = ''
  try { goc = (await layGoc()).replace(/\/+$/, '') } catch { /* chưa đọc được cấu hình máy chủ */ }
  if (/^https:\/\//.test(goc)) ghi('ddh.live.chi-thay-url', goc + DUONG_MO_HINH_THAY)
  ghi('ddh.live.chi-thay', 'hien')
}

/** Đầu mục xác thực cho địa chỉ `u`: CHỈ khi `u` đúng nguồn (origin) của máy chủ app ⇒ mã thầy (`x-ma-bi-mat`, cách mọi lệnh thầy đang dùng). */
async function dauMucThay(u: string): Promise<Record<string, string>> {
  try {
    const goc = await layDiaChiMayChu()
    if (!goc || new URL(u, location.href).origin !== new URL(goc).origin) return {}
    const mat = (await loadTeacherSecret()).trim()
    return mat ? { 'x-ma-bi-mat': mat } : {}
  } catch { return {} }
}

let dangTai: Promise<ArrayBuffer | null> | null = null
/** Tải tệp mô hình MỘT lần cho cả phiên (lỗi ⇒ null, lần bật sau thử lại). Trả BẢN SAO (Worker nhận bằng chuyển quyền sở hữu). */
export async function taiMoHinhThay(laySo: typeof fetch = fetch, dauMuc: (u: string) => Promise<Record<string, string>> = dauMucThay, layMacDinh: () => Promise<string | null> = diaChiMoHinhMayChu): Promise<ArrayBuffer | null> {
  const u = urlMoHinhThay() ?? await layMacDinh()
  if (!u) return null
  if (!dangTai) {
    dangTai = (async () => {
      try { const r = await laySo(u, { credentials: 'omit', cache: 'no-store', headers: await dauMuc(u) }); if (!r.ok) return null; const b = await r.arrayBuffer(); return b.byteLength >= 16 ? b : null } catch { return null }
    })().then((b) => { if (!b) dangTai = null; return b })
  }
  const b = await dangTai
  return b ? b.slice(0) : null
}
