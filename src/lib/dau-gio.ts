// KIỂM TRA ĐẦU GIỜ (thẻ thứ ba của mục Lên bảng, đặc tả docs/DAC-TA-KIEM-TRA-DAU-GIO-SO-NO-2909.md mục B) — phần THUẦN, dùng CHUNG app thầy + máy chủ:
//   · `diemThanhThaoAo`   — độ ưu tiên một câu em đã làm đúng: "thành thạo ảo" = đúng ngay lần đầu, ít lần gặp, LÂU chưa gặp lại ⇒ điểm cao.
//   · `chonLuotDauGio`    — một lượt gọi: tối đa 6 em (ngẫu nhiên), mỗi em 1 câu, KHÔNG trùng câu giữa các em, không gọi lại em đã gọi trong buổi;
//                           em hết câu ⇒ bỏ qua ở lượt này. Luật "không lặp câu cũ qua các buổi" do máy chủ lọc trước (bảng `dau_gio_hoi`) và kiểm lại khi chốt.
//   · `chuLichSuCau`      — dòng lịch sử một câu của em cho thẻ tên: "Sai 20/09 (Ca) · Đúng 22/09 (Đoàn) · Đúng 25/09 (Bi-a)".
// Không đọc đồng hồ, không gọi mạng: `nowMs` và `rng` do nơi gọi truyền (test khoá được).

export const TOI_DA_EM_MOI_LUOT = 6
/** Số câu ứng viên máy chủ trả cho MỖI em (đã xếp theo điểm) — đủ rộng để app lọc câu không có trong kho mà vẫn còn câu. */
export const TOI_DA_UNG_VIEN_MOI_EM = 40
/** Chọn ngẫu nhiên trong ngần này câu điểm cao nhất của em (không luôn lấy câu số 1 ⇒ hai buổi liền nhau không đoán trước được). */
export const CUA_SO_NGAU_NHIEN = 3

/** Một câu em đã làm ĐÚNG (lần gần nhất đúng — kể cả câu từng sai nay đã khắc phục). */
export interface UngVienCau {
  qid: string
  /** Số lần làm có kết quả (mọi nguồn). */
  soLan: number
  /** Lần đầu tiên làm câu này là đúng. */
  dungLanDau: boolean
  /** ISO — lần gần nhất gặp câu. */
  lanCuoi: string
}

const NGAY_MS = 86_400_000

/** Điểm "thành thạo ảo" (cao = nên hỏi trước): đúng ngay lần đầu +2; mới gặp đúng một lần +1; mỗi 15 ngày chưa gặp lại +1 (trần 60 ngày ⇒ +4). */
export function diemThanhThaoAo(c: Pick<UngVienCau, 'soLan' | 'dungLanDau' | 'lanCuoi'>, nowMs: number): number {
  const cuoi = Date.parse(c.lanCuoi)
  const ngay = Number.isFinite(cuoi) ? Math.max(0, Math.min(60, (nowMs - cuoi) / NGAY_MS)) : 60
  return (c.dungLanDau ? 2 : 0) + (c.soLan <= 1 ? 1 : 0) + ngay / 15
}

/** Xếp ứng viên của một em: điểm giảm dần, hoà thì qid tăng dần (ổn định). */
export function xepUngVien<T extends UngVienCau>(ds: readonly T[], nowMs: number): T[] {
  return [...ds].sort((a, b) => diemThanhThaoAo(b, nowMs) - diemThanhThaoAo(a, nowMs) || (a.qid < b.qid ? -1 : a.qid > b.qid ? 1 : 0))
}

export interface EmUngVien {
  sbd: string
  hoTen: string
  /** Câu em đã làm đúng và CHƯA từng được hỏi ở đầu giờ (máy chủ đã lọc) — đã xếp theo điểm. */
  cau: UngVienCau[]
}
export interface GoiDauGio {
  sbd: string
  hoTen: string
  qid: string
}

/** Xáo Fisher–Yates bằng `rng` ∈ [0,1). */
function xao<T>(ds: readonly T[], rng: () => number): T[] {
  const a = [...ds]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/**
 * MỘT LƯỢT GỌI (nút "Chiếu lên bảng" hay "Gọi thêm"). Em được xáo ngẫu nhiên; từng em lấy một câu trong `CUA_SO_NGAU_NHIEN` câu điểm cao nhất còn
 * chưa bị em khác trong lượt giữ. Em nằm trong `daGoi` (đã gọi trong buổi) bị bỏ; em không còn câu ⇒ bỏ qua em ấy (lượt vẫn chạy tiếp các em khác).
 * `cauDaDung` = câu đã chiếu ở các lượt trước CỦA BUỔI (không cho hai em cùng câu trong buổi).
 */
export function chonLuotDauGio(
  em: readonly EmUngVien[],
  tuy: { toiDa?: number; daGoi?: ReadonlySet<string>; cauDaDung?: ReadonlySet<string>; rng?: () => number; nowMs?: number } = {},
): GoiDauGio[] {
  const toiDa = Math.max(0, Math.min(TOI_DA_EM_MOI_LUOT, tuy.toiDa ?? TOI_DA_EM_MOI_LUOT))
  const rng = tuy.rng ?? Math.random
  const nowMs = tuy.nowMs ?? Date.now()
  const daGoi = tuy.daGoi ?? new Set<string>()
  const dung = new Set(tuy.cauDaDung ?? [])
  const daCo = new Set<string>()
  const ra: GoiDauGio[] = []
  for (const e of xao(em, rng)) {
    if (ra.length >= toiDa) break
    if (!e.sbd || daGoi.has(e.sbd) || daCo.has(e.sbd)) continue
    const con = xepUngVien(
      e.cau.filter((c) => c.qid && !dung.has(c.qid)),
      nowMs,
    )
    if (!con.length) continue
    const c = con[Math.floor(rng() * Math.min(CUA_SO_NGAU_NHIEN, con.length))]!
    dung.add(c.qid)
    daCo.add(e.sbd)
    ra.push({ sbd: e.sbd, hoTen: e.hoTen, qid: c.qid })
  }
  return ra
}

// ───────── LỊCH SỬ MỘT CÂU (thẻ tên) ─────────

export interface LanLamNgan {
  /** ISO. */
  luc: string
  dung: boolean
  /** Tên nguồn ngắn đã dịch ("Ca", "Đoàn", "Bi-a", "Đầu giờ"…). */
  nguon: string
}

/** Tên nguồn NGẮN cho dòng lịch sử (bản ví dụ của thầy: "Ca", "Đoàn", "Bi-a"). `game` cần loại lượt: Đoàn / Bi-a / Đảo. */
export function tenNguonNgan(nguon: string, loaiGame: 'doan' | 'bia' | 'dao' | null = null): string {
  if (nguon === 'game') return loaiGame === 'doan' ? 'Đoàn' : loaiGame === 'bia' ? 'Bi-a' : 'Đảo'
  return (
    ({
      thi: 'Ca',
      len_bang: 'Lên bảng',
      dau_gio: 'Đầu giờ',
      btvn: 'BTVN',
      btvn_lo: 'BTVN',
      on_lai: 'Ôn lại',
      khac_phuc: 'Khắc phục',
      mom: 'Bài gia đình giao',
      luyen: 'Luyện đề',
      thu_thach_rieng: 'Thử thách',
    } as Record<string, string>)[nguon] ?? 'Khác'
  )
}

const GIO_VN_MS = 7 * 3_600_000
/** "dd/mm" theo giờ Việt Nam. */
export function ngayNganVn(iso: string): string {
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return '—'
  const d = new Date(t + GIO_VN_MS)
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

/** "Sai 20/09 (Ca) · Đúng 22/09 (Đoàn) · Đúng 25/09 (Bi-a)" — cũ → mới; quá `toiDa` lần thì giữ các lần MỚI NHẤT và mở đầu bằng "… ". Rỗng ⇒ ''. */
export function chuLichSuCau(lan: readonly LanLamNgan[], toiDa = 6): string {
  const ds = [...lan].sort((a, b) => (a.luc < b.luc ? -1 : a.luc > b.luc ? 1 : 0))
  const cat = ds.length > toiDa ? ds.slice(-toiDa) : ds
  const chu = cat.map((x) => `${x.dung ? 'Đúng' : 'Sai'} ${ngayNganVn(x.luc)} (${x.nguon})`).join(' · ')
  return ds.length > toiDa ? `… ${chu}` : chu
}
