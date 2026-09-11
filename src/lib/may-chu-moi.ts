// MÁY CHỦ MỚI — LỚP ĐỊNH TUYẾN ở máy em (MAY-CHU-MOI.md mục 7).
//
// Bốn lệnh nóng đi Worker khi thầy bật cờ; MỌI trục trặc đều rơi về Apps Script
// cho ĐÚNG lượt đó. Đây là luật, không phải tuỳ chọn — Cloudflare sập giữa ca
// thi mà không có đường lùi là mất cả buổi.
//
// BA ĐIỀU CẤM:
//   1. Cấm ném lỗi ra ngoài. Hàm ở đây trả `null` nghĩa là "đi đường cũ", và
//      chỗ gọi không cần biết vì sao.
//   2. Cấm đi Worker khi em CẦN GÓI ĐỀ mà Worker chưa có (`deUrl` rỗng) — em
//      vào được mà không có đề là hỏng nặng hơn chậm.
//   3. Cấm nhớ cấu hình quá lâu: thầy tắt cờ giữa ca thì lượt gọi tiếp theo
//      phải đi đường cũ ngay.
import { chuanHoaMayChu, gianVaoThi, type CauHinhMayChu } from './cau-hinh-may-chu'
import { loadCauHinhMayChu } from './exam-db'

/** Bộ nhớ tạm cấu hình. Sống ngắn để thầy gạt cờ là có tác dụng gần như ngay. */
const SONG_MS = 5000
let nhoCauHinh: { luc: number; ch: CauHinhMayChu } | null = null

export async function layCauHinhMayChu(): Promise<CauHinhMayChu> {
  const nay = Date.now()
  if (nhoCauHinh && nay - nhoCauHinh.luc < SONG_MS) return nhoCauHinh.ch
  const ch = await loadCauHinhMayChu()
  nhoCauHinh = { luc: nay, ch }
  return ch
}

/** Gọi sau khi thầy đổi cấu hình trong màn Cài đặt — bỏ bộ nhớ tạm. */
export function quenCauHinhMayChu(): void {
  nhoCauHinh = null
}

function ngu(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/** Một lượt gọi Worker. Trả `null` cho MỌI trục trặc ⇒ chỗ gọi đi đường cũ.
 *
 * Thử lại có lùi kèm nhiễu: 30 em bấm cùng lúc mà thử lại đúng nhịp nhau là lại
 * húc cửa lần nữa. */
export async function goiWorker<T = Record<string, unknown>>(
  ch: CauHinhMayChu,
  duong: string,
  than: unknown,
): Promise<T | null> {
  if (!ch.BAT || !ch.URL) return null
  for (let lan = 0; lan < Math.max(1, ch.SO_LAN_THU); lan++) {
    if (lan > 0) await ngu(Math.round((500 * 3 ** (lan - 1)) * (0.6 + Math.random() * 0.8)))
    const bo = new AbortController()
    const hen = setTimeout(() => bo.abort(), ch.HAN_GIAY * 1000)
    try {
      const res = await fetch(`${ch.URL}${duong}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(than),
        signal: bo.signal,
      })
      // 4xx là máy chủ ĐÃ TRẢ LỜI, thử lại cũng thế — trả về luôn cho chỗ gọi xử.
      if (res.status >= 400 && res.status < 500) return (await res.json()) as T
      if (!res.ok) continue
      return (await res.json()) as T
    } catch {
      // mạng hỏng hoặc quá hạn — vòng sau
    } finally {
      clearTimeout(hen)
    }
  }
  return null
}

export interface KetQuaVaoThiMoi {
  ok: boolean
  cach?: 'moi' | 'khoi_phuc' | 'duyet_lai'
  lyDo?: string
  khoaLuot?: string
  lanThu?: number
  vaoLuc?: string
  hetGioLuc?: string
  thoiGianPhut?: number
  congBo?: string
  loai?: string
  hanNop?: string
  tenCa?: string
  nguongLan?: number
  nguongGiay?: number
  soCau?: { I: number; II: number; III: number }
  boTheoEm?: Record<string, string[]>
  deUrl?: string | null
}

/** VÀO THI qua máy chủ mới. `null` ⇒ chỗ gọi đi Apps Script.
 *
 * `canBank` = em chưa có gói đề trên máy. Worker chưa có gói đề (`deUrl` rỗng)
 * thì TRẢ NULL — thà chậm còn hơn em vào phòng mà không có đề. */
export async function vaoThiMoi(
  ch: CauHinhMayChu,
  maCa: string,
  sbd: string,
  idThietBi: string,
  canBank: boolean,
): Promise<KetQuaVaoThiMoi | null> {
  if (!ch.BAT) return null
  await gianVaoThi(ch)
  const r = await goiWorker<KetQuaVaoThiMoi>(ch, '/vao-thi', { maCa, sbd, idThietBi })
  if (!r) return null
  if (r.ok && canBank && !r.deUrl) return null
  return r
}

export async function luuTamMoi(
  ch: CauHinhMayChu,
  maCa: string,
  sbd: string,
  dapAn: unknown,
  giayCau?: Record<string, number>,
): Promise<boolean | null> {
  const r = await goiWorker<{ ok: boolean; lyDo?: string }>(ch, '/luu-tam', { maCa, sbd, dapAn, giayCau })
  if (!r) return null
  // Lượt không nằm ở máy chủ mới (em vào thi bằng đường cũ) ⇒ đi đường cũ.
  if (!r.ok && r.lyDo === 'khong_dang_lam') return null
  return !!r.ok
}

export async function nopMoi(
  ch: CauHinhMayChu,
  maCa: string,
  sbd: string,
  dapAn: unknown,
  integrity: unknown,
  giayCau?: Record<string, number>,
): Promise<{ ok: boolean; daNhan?: boolean; nopLuc?: string } | null> {
  const r = await goiWorker<{ ok: boolean; lyDo?: string; daNhan?: boolean; nopLuc?: string }>(ch, '/nop', {
    maCa,
    sbd,
    dapAn,
    integrity,
    giayCau,
  })
  if (!r) return null
  if (!r.ok && (r.lyDo === 'khong_tim_thay' || r.lyDo === 'thieu')) return null
  return r
}

/** Nút "Thử kết nối" trong Cài đặt. Không dùng bộ nhớ tạm — thầy vừa gõ URL. */
export async function thuKetNoi(url: string): Promise<{ ok: boolean; chu: string }> {
  const ch = chuanHoaMayChu({ BAT: true, URL: url, HAN_GIAY: 8, SO_LAN_THU: 1 })
  if (!ch.BAT) return { ok: false, chu: 'Chưa điền địa chỉ máy chủ' }
  try {
    const res = await fetch(`${ch.URL}/khoe`, { method: 'GET' })
    const j = (await res.json()) as { ok?: boolean; coDB?: boolean; coR2?: boolean; coMat?: boolean }
    if (!j?.ok) return { ok: false, chu: 'Máy chủ trả lời nhưng không đúng dạng' }
    const thieu: string[] = []
    if (!j.coDB) thieu.push('chưa nối cơ sở dữ liệu')
    if (!j.coMat) thieu.push('chưa đặt mã bí mật')
    if (!j.coR2) thieu.push('chưa nối kho đề')
    return { ok: thieu.length === 0, chu: thieu.length === 0 ? 'Máy chủ sẵn sàng' : `Nối được, nhưng ${thieu.join(' · ')}` }
  } catch {
    return { ok: false, chu: 'Không gọi được máy chủ — kiểm tra lại địa chỉ' }
  }
}

// ---------------------------------------------------------------------------
// ĐỢT 3 — HAI LỆNH DÀY NHẤT CỦA MỘT CA
//
// Đếm thật trong một ca 45 phút, mỗi em:
//   đẩy trạng thái  270 lệnh  (10 giây một lần)
//   lưu tạm         135 lệnh  (20 giây một lần)
//   vào thi + nộp     2 lệnh
// Ba mươi em ⇒ 12.210 lệnh, trong đó 12.150 là hai lệnh trên — 99,5%.
//
// Vì vậy chuyển hai lệnh này đi là việc đáng giá nhất, và nó còn chữa gián tiếp
// cả chỗ treo lúc VÀO THI: vào thi vẫn ở Apps Script nhưng từ nay được dùng một
// mình toàn bộ sức máy chủ, không phải chen với 12.150 lệnh kia.
// ---------------------------------------------------------------------------

export interface TrangThaiEm {
  sbd: string
  maCa: string
  lop: string
  dangLam: boolean
  batDauLuc: string
  daLamCauHoi: number
  tongCauHoi: number
  soLanRoiApp: number
  blocked: boolean
}

/** ĐẨY TRẠNG THÁI LÀM BÀI. `null` ⇒ chỗ gọi đi Apps Script.
 *
 * Chỉ thử MỘT lần: nhịp sau tới sau mười giây, cố ở đây chỉ tổ giữ chân em. */
export async function trangThaiMoi(ch: CauHinhMayChu, tt: TrangThaiEm): Promise<boolean | null> {
  // Không cần tự kiểm cờ ở đây — `goiWorker` đã chốt `!ch.BAT || !ch.URL` ngay
  // dòng đầu. Thêm một chốt nữa chỉ tạo ra một dòng không phép kiểm nào chạm tới.
  const r = await goiWorker<{ ok: boolean }>({ ...ch, SO_LAN_THU: 1 }, '/trang-thai', tt)
  return r ? !!r.ok : null
}

export interface PhongChoMoi {
  phongCho: boolean
  batDau: boolean
  batDauLuc: string
  trangThai: string
}

/** HỎI PHÒNG CHỜ. Đây là lúc ĐÔNG NHẤT cả ca — cả lớp đứng chờ và hỏi lại mỗi
 *  ba giây — nên gọi GET, một câu truy vấn, một lần thử. */
export async function phongChoMoi(ch: CauHinhMayChu, maCa: string): Promise<PhongChoMoi | null> {
  if (!ch.BAT || !ch.URL) return null
  const bo = new AbortController()
  const hen = setTimeout(() => bo.abort(), ch.HAN_GIAY * 1000)
  try {
    const res = await fetch(`${ch.URL}/phong-cho?maCa=${encodeURIComponent(maCa)}`, { signal: bo.signal })
    if (!res.ok) return null
    const j = (await res.json()) as { ok?: boolean } & PhongChoMoi
    if (!j?.ok) return null
    return { phongCho: !!j.phongCho, batDau: !!j.batDau, batDauLuc: String(j.batDauLuc ?? ''), trangThai: String(j.trangThai ?? '') }
  } catch {
    return null
  } finally {
    clearTimeout(hen)
  }
}
