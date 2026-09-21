// HÀNG ĐỢI NỘP LẠI TỰ ĐỘNG (Boss 21/09 sau sự cố D1): máy chủ bận / rớt mạng lúc em bấm nộp ⇒ bài GIỮ Ở MÁY, app tự thử lại có LÙI DẦN, em thấy
// "Đã lưu ở máy, đang chờ máy chủ" — không phải bấm nộp lại, không bấm dồn thêm lượt vào máy chủ đang nghẽn.
// AN TOÀN VÌ MÁY CHỦ IDEMPOTENT (Code 3 xác nhận 21/09): `/btvn/xong-lo` khoá đáp án ĐẦU, nộp lại = phát lại kết quả đã khoá; `/hs/on-lai/nop` và
// `/hs/thu-thach-hom-nay/nop` khoá sổ (kênh, ngày, sbd, qid) đầu thắng — nộp lại không ghi/cộng EXP lần hai. Nên KHÔNG cần khoá nộp riêng; chỉ cần đừng
// giữ hai mục cùng một việc (khoá `id` dưới đây) và nhớ lượt thử lại thành công có thể trả exp rỗng (EXP đã cộng ở lượt đầu).
// Tệp này THUẦN + lưu trữ (localStorage, có try/catch): việc gọi mạng nằm ở `use-hang-doi-nop.ts`.

export type LoaiHang = 'btvn_chang' | 'on_cau'

export interface MucHang {
  /** Khoá việc: cùng khoá ⇒ cùng một bài nộp (không giữ hai lần). */
  id: string
  loai: LoaiHang
  sbd: string
  /** Lúc đưa vào hàng (ms). */
  tao: number
  /** Số lần đã thử LẠI (0 = chưa thử lại lần nào). */
  lanThu: number
  /** Sớm nhất được thử lại (ms). */
  henLuc: number
  /** btvn_chang: `{ ma, chiSo, dapAn, maCa }`; on_cau: `{ traLoi, duong }`. Không chứa token. */
  goi: Record<string, unknown>
}

export type KetQuaThu = 'xong' | 'ban' | 'bo'

export const KHOA_LUU_HANG = 'omr_hang_doi_nop_v1'
/** Lùi dần giữa các lần thử lại (ms): 20 → 40 → 80 → 160 → 300 s, giữ ở 300. Lượt đầu KHÔNG nhanh (máy chủ đang bận). */
export const LUI_NOP_LAI_MS: readonly number[] = [20_000, 40_000, 80_000, 160_000, 300_000]
/** Lệch ngẫu nhiên ± một phần (0,25 ⇒ ±25 %) để hàng trăm máy không thử lại cùng một khoảnh khắc. */
export const LECH_NOP_LAI = 0.25
export const TUOI_TOI_DA_MS = 48 * 3_600_000
export const TOI_DA_MUC = 20
/** Thử lại tối đa bấy nhiêu lần rồi thôi (≈ vài giờ với bậc lùi tới 300 s) — quá thế là lỗi thật, không phải máy chủ bận; bài vẫn ở máy, em nộp tay. */
export const TOI_DA_LAN_THU = 20

export const khoaChang = (sbd: string, ma: string, chiSo: number): string => `btvn_chang|${sbd}|${ma}|${chiSo}`
export const khoaOnCau = (sbd: string, duong: string, qid: string[]): string => `on_cau|${sbd}|${duong}|${[...qid].sort().join(',')}`

/** Chờ bao lâu trước lần thử lại thứ `lanThu` (đếm từ 0). Không dưới 15 giây. */
export function khoangNopLai(lanThu: number, ngauNhien: () => number = Math.random): number {
  const n = Number.isFinite(lanThu) ? Math.max(0, Math.floor(lanThu)) : 0
  const nen = LUI_NOP_LAI_MS[Math.min(n, LUI_NOP_LAI_MS.length - 1)]!
  return Math.max(15_000, Math.round(nen * (1 + (ngauNhien() * 2 - 1) * LECH_NOP_LAI)))
}

const laDoiTuong = (x: unknown): x is Record<string, unknown> => x !== null && typeof x === 'object' && !Array.isArray(x)

const hopLe = (x: unknown): x is MucHang =>
  laDoiTuong(x) &&
  typeof x.id === 'string' && x.id !== '' &&
  (x.loai === 'btvn_chang' || x.loai === 'on_cau') &&
  typeof x.sbd === 'string' && x.sbd !== '' &&
  Number.isFinite(x.tao) && Number.isFinite(x.lanThu) && Number.isFinite(x.henLuc) &&
  laDoiTuong(x.goi)

/** Đọc hàng từ chuỗi lưu. Hỏng / lạ ⇒ bỏ mục đó (không ném). */
export function docHang(raw: string | null | undefined): MucHang[] {
  if (!raw) return []
  try {
    const a = JSON.parse(raw)
    return Array.isArray(a) ? a.filter(hopLe) : []
  } catch {
    return []
  }
}

type Kho = Pick<Storage, 'getItem' | 'setItem'>
const khoMac = (): Kho | null => {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    return null
  }
}
export function docHangTuKho(kho: Kho | null = khoMac()): MucHang[] {
  try {
    return docHang(kho?.getItem(KHOA_LUU_HANG))
  } catch {
    return []
  }
}
export function luuHangVaoKho(ds: readonly MucHang[], kho: Kho | null = khoMac()): void {
  try {
    kho?.setItem(KHOA_LUU_HANG, JSON.stringify(ds))
  } catch {
    /* máy đầy / chế độ riêng tư: hàng chỉ sống trong phiên này */
  }
}

/** Bỏ mục quá 48 giờ (bài BTVN đã hết hạn từ lâu — giữ mãi chỉ tốn máy). */
export function boMucQuaTuoi(ds: readonly MucHang[], now: number): MucHang[] {
  return ds.filter((m) => now - m.tao <= TUOI_TOI_DA_MS)
}

/** Thêm một việc. Đã có cùng `id` ⇒ GIỮ MỤC CŨ (máy chủ giữ đáp án đầu, không có lý do ghi đè). Quá `TOI_DA_MUC` ⇒ bỏ mục CŨ NHẤT. */
export function themMuc(ds: readonly MucHang[], m: Omit<MucHang, 'lanThu' | 'henLuc' | 'tao'> & { tao?: number }, now: number, ngauNhien: () => number = Math.random): MucHang[] {
  if (ds.some((x) => x.id === m.id)) return [...ds]
  const moi: MucHang = { ...m, tao: m.tao ?? now, lanThu: 0, henLuc: now + khoangNopLai(0, ngauNhien) }
  const ra = [...boMucQuaTuoi(ds, now), moi]
  return ra.length > TOI_DA_MUC ? ra.slice(ra.length - TOI_DA_MUC) : ra
}

/** Các mục của em `sbd` đã đến hạn thử lại, theo thứ tự đưa vào. */
export function mucDenHan(ds: readonly MucHang[], sbd: string, now: number): MucHang[] {
  return ds.filter((m) => m.sbd === sbd && m.henLuc <= now).sort((a, b) => a.tao - b.tao)
}

/** Ghi kết quả một lần thử: `xong` / `bo` (máy chủ từ chối hẳn: quá hạn, chặng chưa mở…) ⇒ gỡ; `ban` ⇒ tăng lần thử + hẹn lần sau (lùi dần). */
export function sauLanThu(ds: readonly MucHang[], id: string, kq: KetQuaThu, now: number, ngauNhien: () => number = Math.random): MucHang[] {
  if (kq !== 'ban') return ds.filter((m) => m.id !== id)
  return ds.map((m) => (m.id === id ? { ...m, lanThu: m.lanThu + 1, henLuc: now + khoangNopLai(m.lanThu + 1, ngauNhien) } : m))
}

/** Bao lâu nữa tới mục đến hạn sớm nhất của em (ms, không dưới `toiThieuMs`); không có mục ⇒ null. */
export function henSomNhat(ds: readonly MucHang[], sbd: string, now: number, toiThieuMs = 1000): number | null {
  let som: number | null = null
  for (const m of ds) if (m.sbd === sbd && (som === null || m.henLuc < som)) som = m.henLuc
  return som === null ? null : Math.max(toiThieuMs, som - now)
}

export const demHangCuaEm = (ds: readonly MucHang[], sbd: string): number => ds.filter((m) => m.sbd === sbd).length

/** Sự kiện (window) khi hàng đợi nộp xong / bị từ chối một việc `on_cau`: `detail = { id, phanHoi }` — màn ôn đang mở (nếu còn) nhận đó để vẽ kết quả. */
export const SU_KIEN_HANG_DOI_XONG = 'omr-hang-doi-xong'

/** Lời báo cho em (một nơi, để mọi màn nói CÙNG một câu). */
export const CHU_DA_LUU_MAY = 'Đã lưu ở máy, đang chờ máy chủ. Em không cần bấm nộp lại — app tự gửi khi máy chủ rảnh.'
export const chuDangCho = (n: number): string => (n <= 1 ? 'Đã lưu ở máy 1 bài, đang chờ máy chủ nhận.' : `Đã lưu ở máy ${n} bài, đang chờ máy chủ nhận.`)
