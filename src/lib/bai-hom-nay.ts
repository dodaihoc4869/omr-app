// BÀI HÔM NAY (OMNI 3 · tick bài đã dạy — DAC-TA-BUILD-OMNI-3-0510.md mục 1 bước 1, prompt-tick-bai-tu-giao.md mục A) — phần THUẦN của bước
// "Bài hôm nay" trong bảng Dạy học: lấy danh sách bài của MỘT khối từ cây DẠY HỌC (`dungCay` trên `locDeDayHoc` — thứ tự cây = thứ tự SGK),
// khoá bài ổn định, tờ TỰ GIAO (thầy 05/10: "Khi tích chọn bạn chỉ lấy 3 phần trắc nghiệm, đúng sai trả lời ngắn làm tự động giao bỏ phần ví dụ
// minh họa và các dạng trọng tâm nhé." ⇒ CHỈ tờ phần Trắc nghiệm / Đúng sai / Trả lời ngắn, không ô tích), phạm vi = mọi bài đứng TRƯỚC (cùng luật tờ),
// chữ trạng thái từng bài. Không IO, không đọc đồng hồ (nơi gọi đưa `homNay`). Có test (`tests/omni-3-thay-bai-hom-nay.test.tsx`).
import { laMaDeTuLuan } from './cau-tu-luan'
import { tongCau, type Nut } from './cay-chon-de'
import { goMaDeTachRa, PHAN_DE_TACH, TEN_PHAN_TACH, type PhanDe } from './tach-phan-de'

/** Dòng ghi chú dưới dòng "Tự giao: …" của thẻ xác nhận. */
export const CHU_KHONG_GIAO_MUC_DAY_HOC = 'Không giao Ví dụ minh hoạ và Các dạng toán trọng tâm.'
/** Bài không còn tờ nào tự giao được — cùng lời máy chủ (`/gv/bai-da-day`, bai-da-day.ts). */
export const CHU_BAI_CHUA_CO_TO_TU_GIAO = 'Bài này chưa có tờ Trắc nghiệm / Đúng sai / Trả lời ngắn.'
/** Nhắc thầy từ ngày chờ thứ 3 (prompt tick bài mục D3): "Lớp 12A1: 3 ngày chưa có bài mới". */
export const NGAY_NHAC_CHO_BAI_MOI = 3

/** Một tờ của bài (lá tầng "dang" của cây). */
export interface ToBai {
  maDe: string
  nhan: string
  /** Số câu của tờ (tờ đã tách phần: số câu của phần ấy). */
  soCau: number
  /** Phần của tờ: hậu tố -TN / -DS / -TLN, hoặc tờ chưa tách chỉ có câu của MỘT phần. Ví dụ minh hoạ / Các dạng toán trọng tâm / tờ rỗng ⇒ null. */
  phan: PhanDe | null
  /** Tự giao khi tick: tờ phần Trắc nghiệm / Đúng sai / Trả lời ngắn có câu — không bao giờ là Ví dụ minh hoạ hay Các dạng toán trọng tâm. */
  tuDong: boolean
}
/** Một bài trong cây DẠY HỌC của khối. */
export interface BaiCay {
  /** Khoá ổn định gửi máy chủ: mã gốc chung của các tờ (vd `DH-12-C1-B1`); không có mã chung ⇒ đường dẫn nút trong cây. */
  khoaBai: string
  tenBai: string
  /** Vị trí trong khối (1, 2, 3…) theo thứ tự cây. */
  viTri: number
  chuong: string
  soCau: number
  to: ToBai[]
}

/** Mã tờ KHÔNG tự giao: nhãn mục dạy học / tự luận (-VD, -DT, -TL — `laMaDeTuLuan`, cau-tu-luan.ts) và dạng dài -VDMH, -DTTT. Máy chủ dùng cùng luật. */
export const laMaToKhongGiao = (maDe: string): boolean => laMaDeTuLuan(maDe) || /(?:^|-)(?:VDMH|DTTT)(?:-|$)/i.test(String(maDe ?? ''))
/** Chữ hoa không dấu (so tên bền với "HOẠ" / "HỌA", NFC / NFD). */
const khongDau = (s: string): string => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'D').toUpperCase()
const TEN_MUC_KHONG_GIAO = ['VI DU MINH HOA', 'DANG TOAN TRONG TAM']
/** Tờ "Ví dụ minh hoạ" / "Các dạng toán trọng tâm" (theo mã hoặc theo tên đã chuẩn hoá) — không bao giờ tự giao. */
export function laToKhongGiao(t: { maDe?: string | null; nhan?: string | null }): boolean {
  if (laMaToKhongGiao(String(t.maDe ?? '').trim())) return true
  const ten = khongDau(String(t.nhan ?? ''))
  return TEN_MUC_KHONG_GIAO.some((x) => ten.includes(x))
}
/** Phần của một lá: hậu tố tách phần, không có thì phần DUY NHẤT có câu; mục không giao / tờ rỗng / nhiều phần ⇒ null. */
function phanCuaLa(l: Pick<Nut, 'maDe' | 'nhan' | 'soCau'>): PhanDe | null {
  if (laToKhongGiao(l)) return null
  const p = goMaDeTachRa(String(l.maDe ?? '')).phan
  if (p) return l.soCau[p] > 0 ? p : null
  const co = PHAN_DE_TACH.filter((k) => l.soCau[k] > 0)
  return co.length === 1 ? co[0]! : null
}

/** Mã gốc của bài: bỏ hậu tố phần (-TN/-DS/-TLN), mục đặc biệt (-VD/-VDMH/-DT/-DTTT) và đuôi cắt bài lớn (-D1, -D2). */
export function maGocBai(maDe: string): string {
  return goMaDeTachRa(maDe.trim()).goc.replace(/-(?:VD|VDMH|DT|DTTT)$/i, '').replace(/-D\d+$/i, '')
}

/** Khoá bài: mọi tờ chung MỘT mã gốc ⇒ mã ấy; lệch nhau (kho đặt mã lạ) ⇒ khoá nút trong cây (vẫn ổn định khi kho không đổi tên). */
export function khoaBaiCua(nut: Pick<Nut, 'khoa' | 'laMa'>): string {
  const goc = new Set(nut.laMa.map(maGocBai).filter(Boolean))
  return goc.size === 1 ? [...goc][0]! : nut.khoa
}

/** Khối "10" | "11" | "12" của một tên lớp ("12A1", "12 - Tinh Hoa"); không rõ ⇒ ''. */
export function khoiCuaTenLop(lop: string): string {
  const m = lop.trim().match(/^(10|11|12)(?!\d)/)
  return m ? m[1]! : ''
}

/** Tìm nút KHỐI trong cây (thư mục DẠY HỌC ▸ khối, hoặc khối đứng ngoài cùng). */
function timKhoi(cay: readonly Nut[], khoi: string): Nut | null {
  for (const n of cay) {
    if (n.tang === 'khoi' && (n.nhan === `Khối ${khoi}` || n.khoa === khoi || n.khoa.endsWith(`/${khoi}`))) return n
    if (n.tang === 'thumuc') {
      const k = timKhoi(n.con, khoi)
      if (k) return k
    }
  }
  return null
}

/** So tên theo số học ("Bài 8" đứng trước "Bài 10"), không phân biệt hoa thường / dấu thanh. */
const soTen = new Intl.Collator('vi', { numeric: true, sensitivity: 'base' })

/** Số đứng sau chữ "Bài" ở đầu tên bài ("Bài 10. Protein và enzyme" → 10); tên không bắt đầu bằng "Bài <số>" ⇒ null. */
export function soBaiCuaTen(ten: string): number | null {
  const m = /^\s*bài\s+(\d+)/i.exec(ten.normalize('NFC'))
  return m ? Number(m[1]) : null
}
/** Số chương đứng đầu tên chương ("C3 - Hợp chất chứa N", "Chương 3: …" → 3); không có ⇒ null. */
export function soChuongCuaTen(ten: string): number | null {
  const m = /^\s*(?:chương\s*|c)(\d+)/i.exec(ten.normalize('NFC'))
  return m ? Number(m[1]) : null
}
/** Có số đứng trước, không số đứng sau (không số ⇒ giữ nguyên thứ tự cây). */
const soSanhSo = (a: number | null, b: number | null): number => (a !== null && b !== null ? a - b : a === null ? (b === null ? 0 : 1) : -1)

/**
 * Danh sách bài của một khối: chương theo SỐ CHƯƠNG, bài trong chương theo SỐ BÀI tăng dần (cùng số bài ⇒ theo tên, số học). Khối không có trong cây ⇒ [].
 * Thầy 06/10: kho nhập "Bài 10, 11, 8, 9" ⇒ cây phải hiện 8, 9, 10, 11. `viTri` (1, 2, 3…) đi theo thứ tự ĐÃ SẮP — "bài đứng trước" của OMNI
 * (`phamViTruoc`) cũng đúng theo. Sắp ổn định: tên không có số giữ thứ tự cây.
 */
export function dsBaiCuaKhoi(cay: readonly Nut[], khoi: string): BaiCay[] {
  const nutKhoi = khoi ? timKhoi(cay, khoi) : null
  if (!nutKhoi) return []
  const ra: BaiCay[] = []
  const dsChuong = nutKhoi.con
    .map((c, i) => ({ c, i }))
    .sort((x, y) => soSanhSo(soChuongCuaTen(x.c.nhan), soChuongCuaTen(y.c.nhan)) || x.i - y.i)
    .map((x) => x.c)
  for (const chuong of dsChuong) {
    const dsBai = (chuong.tang === 'bai' ? [chuong] : chuong.con.filter((b) => b.tang === 'bai'))
      .map((b, i) => ({ b, i }))
      .sort((x, y) => {
        const a = soBaiCuaTen(x.b.nhan)
        const b = soBaiCuaTen(y.b.nhan)
        return a === null || b === null ? soSanhSo(a, b) || x.i - y.i : a - b || soTen.compare(x.b.nhan, y.b.nhan) || x.i - y.i
      })
      .map((x) => x.b)
    for (const bai of dsBai) {
      const to: ToBai[] = bai.con
        .filter((l) => !!l.maDe)
        .map((l) => {
          const phan = phanCuaLa(l)
          return { maDe: l.maDe!, nhan: l.nhan, soCau: tongCau(l.soCau), phan, tuDong: phan !== null }
        })
      ra.push({ khoaBai: khoaBaiCua(bai), tenBai: bai.nhan, viTri: ra.length + 1, chuong: chuong.tang === 'bai' ? '' : chuong.nhan, soCau: tongCau(bai.soCau), to })
    }
  }
  return ra
}

/** Tờ TỰ GIAO của bài (không ô tích): CHỈ tờ phần Trắc nghiệm / Đúng sai / Trả lời ngắn — bỏ hẳn Ví dụ minh hoạ và Các dạng toán trọng tâm. */
export function maDeMacDinh(bai: Pick<BaiCay, 'to'>): string[] {
  return bai.to.filter((t) => t.tuDong && t.phan !== null && !laToKhongGiao(t)).map((t) => t.maDe)
}

/** Ba phần tự giao của bài, thứ tự I → II → III, cộng số câu mọi tờ cùng phần; phần 0 câu bị bỏ. */
export function phanTuGiao(bai: Pick<BaiCay, 'to'>): { phan: PhanDe; ten: string; soCau: number }[] {
  const tu = new Set(maDeMacDinh(bai))
  return PHAN_DE_TACH.map((p) => ({ phan: p, ten: TEN_PHAN_TACH[p], soCau: bai.to.filter((t) => tu.has(t.maDe) && t.phan === p).reduce((n, t) => n + t.soCau, 0) })).filter(
    (x) => x.soCau > 0,
  )
}
/** "Tự giao: Trắc nghiệm · 22 câu · Đúng sai · 6 câu · Trả lời ngắn · 4 câu" (phần 0 câu bỏ khỏi dòng); không phần nào ⇒ null. */
export function chuTuGiao(bai: Pick<BaiCay, 'to'>): string | null {
  const ds = phanTuGiao(bai)
  return ds.length ? `Tự giao: ${ds.map((x) => `${x.ten} · ${x.soCau} câu`).join(' · ')}` : null
}

/** Phạm vi đã dạy gửi kèm `tick`: mọi bài đứng TRƯỚC bài này trong cây cùng khối, kèm tờ TỰ GIAO của chúng (cùng luật `maDeMacDinh`). */
export function phamViTruoc(dsBai: readonly BaiCay[], viTri: number): { khoaBai: string; tenBai: string; viTri: number; maDe: string[] }[] {
  return dsBai.filter((b) => b.viTri < viTri).map((b) => ({ khoaBai: b.khoaBai, tenBai: b.tenBai, viTri: b.viTri, maDe: maDeMacDinh(b) }))
}

/** "Bài 6" từ "Bài 6. Tinh bột và cellulose"; tên không bắt đầu bằng "Bài <số>" ⇒ nguyên tên. Dùng trên nút "Giao Bài 6 cho 12A1". */
export function tenNganBai(tenBai: string): string {
  const m = /^\s*Bài\s+(\d+[a-z]?)/i.exec(tenBai)
  return m ? `Bài ${m[1]}` : tenBai.trim()
}

/** "05/10" từ thời điểm ISO (giờ Việt Nam). Hỏng ⇒ ''. */
export function ngayThangVn(iso: string): string {
  const ms = Date.parse(iso)
  if (!Number.isFinite(ms)) return ''
  const d = new Date(ms + 7 * 3_600_000)
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export type KieuTrangThaiBai = 'da_day' | 'dang_luyen' | 'hom_nay' | 'chua_day'
/** Bài đã tick theo máy chủ (phần cần cho chữ trạng thái). */
export interface TickTom {
  trangThai: 'dang_luyen' | 'da_day'
  tickLuc: string
  conNgay: number | null
  chungChi: { dat: number; tong: number } | null
}

/**
 * BÀI ĐỨNG TRƯỚC thuộc phạm vi đã dạy (thầy 06/10: "khi tôi chọn bài nào thì những bài trước hiện đã dạy"). Khớp luật phạm vi của máy chủ (`dungPhamVi`: bài đã tick ∪ mọi bài
 * đứng trước bài đã tick XA NHẤT của lớp): 'tick' = đứng trước bài đã tick xa nhất của lớp (đã là phạm vi thật); 'xem' = chỉ đứng trước bài thầy ĐANG CHỌN (sẽ thành phạm vi khi giao —
 * hiện nét đứt); null = không thuộc phạm vi.
 */
export type NguonPhamVi = 'tick' | 'xem' | null
/** Vị trí (trong cây khối, từ 1) của bài đã tick xa nhất; chưa tick bài nào / không thấy bài trong cây ⇒ 0. */
export function viTriTickXaNhat(dsBai: readonly Pick<BaiCay, 'khoaBai' | 'viTri'>[], khoaDaTick: Iterable<string>): number {
  const tap = new Set(khoaDaTick)
  return dsBai.reduce((m, b) => (tap.has(b.khoaBai) && b.viTri > m ? b.viTri : m), 0)
}
/** Bài ở vị trí `viTriBai` có đứng trước bài đã tick xa nhất (`viTriTickXa`, 0 = chưa tick) hoặc trước bài đang chọn xem (`viTriXem`, 0 = chưa chọn) không. Tick được ưu tiên hơn xem. */
export const nguonPhamVi = (viTriBai: number, viTriTickXa: number, viTriXem: number): NguonPhamVi => (viTriBai < viTriTickXa ? 'tick' : viTriXem > 0 && viTriBai < viTriXem ? 'xem' : null)

/**
 * Chip trạng thái của một bài: "Đã dạy dd/mm · chứng chỉ a/b" · "Đang luyện · còn N ngày" · "Bài hôm nay" (đang chọn, chưa tick) · "Đã dạy" (chưa tick nhưng đứng trước bài đã tick / đang chọn —
 * `nguon`; `duKien` = mới đứng trước bài đang chọn xem) · "Chưa dạy".
 */
export function trangThaiBai(tick: TickTom | null | undefined, dangChon: boolean, nguon: NguonPhamVi = null): { kieu: KieuTrangThaiBai; chu: string; duKien?: boolean } {
  if (tick?.trangThai === 'dang_luyen') {
    const con = tick.conNgay
    return { kieu: 'dang_luyen', chu: typeof con === 'number' && con >= 0 ? `Đang luyện · còn ${con} ngày` : 'Đang luyện' }
  }
  if (tick) {
    const ngay = ngayThangVn(tick.tickLuc)
    const cc = tick.chungChi && tick.chungChi.tong > 0 ? ` · chứng chỉ ${tick.chungChi.dat}/${tick.chungChi.tong}` : ''
    return { kieu: 'da_day', chu: `Đã dạy${ngay ? ` ${ngay}` : ''}${cc}` }
  }
  if (dangChon) return { kieu: 'hom_nay', chu: 'Bài hôm nay' }
  if (nguon) return { kieu: 'da_day', chu: 'Đã dạy', ...(nguon === 'xem' ? { duKien: true } : {}) }
  return { kieu: 'chua_day', chu: 'Chưa dạy' }
}

/** Dòng nhắc ở đầu bảng Dạy học khi lớp chờ bài mới từ 3 ngày; chưa tới ngưỡng / không chờ ⇒ null. */
export function chuChoBaiMoi(lop: string, choBaiMoi: { soNgay: number } | null | undefined): string | null {
  const n = choBaiMoi?.soNgay
  if (!lop.trim() || typeof n !== 'number' || n < NGAY_NHAC_CHO_BAI_MOI) return null
  return `Lớp ${lop.trim()}: ${n} ngày chưa có bài mới`
}

// ---------------------------------------------------------------- NHIỀU LỚP (thầy 06/10: "tích chọn được nhiều lớp", "chỗ chọn lớp xếp theo khối 10, 11, 12")
// Máy chủ giữ NGUYÊN: mỗi lớp một lệnh `danh-sach` / `xem-truoc` / `tick` riêng; nhiều lớp = gọi lần lượt từng lớp. Cây bài mỗi KHỐI một khác ⇒ mỗi lần chỉ chọn lớp CÙNG KHỐI.

/** Một dòng lớp của bộ chọn: tên + khối ('10' | '11' | '12') + sĩ số. */
export interface LopChonDuoc {
  tenLop: string
  khoi: string
  soEm: number
}

/** Khối của một dòng lớp: cột khối (nếu đọc được) rồi tên lớp; không rõ ⇒ ''. */
export const khoiCuaDongLop = (l: { tenLop: string; khoi?: string }): string => khoiCuaTenLop(l.khoi ?? '') || khoiCuaTenLop(l.tenLop)

/** Các lớp biết khối, xếp khối 10 → 11 → 12, trong khối theo tên (số học). Lớp không rõ khối ("Chưa xếp lớp") bị bỏ — cây bài cần khối. Trùng tên lấy dòng đầu. */
export function lopTheoKhoi(dsLop: readonly { tenLop: string; khoi?: string; soEm?: number }[]): LopChonDuoc[] {
  const thay = new Set<string>()
  const ra: LopChonDuoc[] = []
  for (const l of dsLop) {
    const ten = l.tenLop.trim()
    const khoi = khoiCuaDongLop({ tenLop: ten, khoi: l.khoi })
    if (!ten || !khoi || thay.has(ten)) continue
    thay.add(ten)
    ra.push({ tenLop: ten, khoi, soEm: Number.isFinite(l.soEm) ? Number(l.soEm) : 0 })
  }
  return ra.sort((a, b) => Number(a.khoi) - Number(b.khoi) || soTen.compare(a.tenLop, b.tenLop))
}

/** Tên gọn của lớp để làm nhãn nhỏ ("12 - Tinh Hoa" → "Tinh Hoa"; "12A1" và "11" giữ nguyên). */
export function tenGonLop(tenLop: string): string {
  const m = /^\s*(?:10|11|12)\s*[-–—:·]\s*(.+)$/.exec(tenLop)
  return m ? m[1]!.trim() : tenLop.trim()
}

const khoiDauTien = (dsLop: readonly { tenLop: string; khoi: string }[], chon: readonly string[]): string => (chon.length ? (dsLop.find((l) => l.tenLop === chon[0])?.khoi ?? '') : '')
const theoThuTuLop = (dsLop: readonly { tenLop: string }[], tap: ReadonlySet<string>): string[] => dsLop.filter((l) => tap.has(l.tenLop)).map((l) => l.tenLop)

/**
 * Tick / bỏ tick MỘT lớp. Tick lớp thuộc KHỐI KHÁC với các lớp đang chọn ⇒ chọn lại từ đầu, chỉ lớp ấy (`doiKhoi` = true để báo thầy).
 * Kết quả luôn theo thứ tự `dsLop`. Lớp không có trong `dsLop` ⇒ giữ nguyên.
 */
export function doiChonLop(dsLop: readonly { tenLop: string; khoi: string }[], chon: readonly string[], lop: string, nhan: boolean): { chon: string[]; doiKhoi: boolean } {
  const dong = dsLop.find((l) => l.tenLop === lop)
  if (!dong) return { chon: [...chon], doiKhoi: false }
  const kc = khoiDauTien(dsLop, chon)
  if (nhan && kc && kc !== dong.khoi) return { chon: [lop], doiKhoi: true }
  const tap = new Set(chon)
  if (nhan) tap.add(lop)
  else tap.delete(lop)
  return { chon: theoThuTuLop(dsLop, tap), doiKhoi: false }
}
/** Tick / bỏ tick CẢ KHỐI: tick ⇒ mọi lớp của khối (bỏ lớp khối khác); bỏ tick ⇒ bỏ mọi lớp của khối ấy. */
export function doiChonKhoi(dsLop: readonly { tenLop: string; khoi: string }[], chon: readonly string[], khoi: string, nhan: boolean): { chon: string[]; doiKhoi: boolean } {
  const cua = dsLop.filter((l) => l.khoi === khoi).map((l) => l.tenLop)
  if (!nhan) return { chon: chon.filter((l) => !cua.includes(l)), doiKhoi: false }
  const kc = khoiDauTien(dsLop, chon)
  return { chon: cua, doiKhoi: !!kc && kc !== khoi }
}

/** Một em của bộ chọn em (`useDsEmGiao`). */
export interface EmCuaLop {
  sbd: string
  khoi: string
  tenLop: string
}
/** Em thuộc lớp: cùng tên lớp, hoặc lớp gọi theo khối trần ("11") — đúng luật cũ của bước một lớp. */
export const emThuocLop = (e: Pick<EmCuaLop, 'khoi' | 'tenLop'>, lop: string): boolean => e.khoi === lop || e.tenLop === lop

/**
 * Chia các em ĐÃ CHỌN về từng lớp để gọi `tick` mỗi lớp một lần: em thuộc lớp nào thì về lớp ấy; em ngoài các lớp đã chọn (thầy thêm tay) về lớp ĐẦU — y
 * hành vi một lớp cũ (gửi mọi em đã chọn kèm lớp). Thứ tự em theo `dsEm`. Mọi lớp đều có khoá (có thể rỗng).
 */
export function chiaEmTheoLop(dsLop: readonly string[], dsEm: readonly EmCuaLop[], sbdChon: readonly string[]): Map<string, string[]> {
  const ra = new Map<string, string[]>(dsLop.map((l) => [l, []]))
  if (!dsLop.length) return ra
  const chon = new Set(sbdChon)
  for (const e of dsEm) {
    if (!chon.has(e.sbd)) continue
    const lop = dsLop.find((l) => emThuocLop(e, l)) ?? dsLop[0]!
    ra.get(lop)!.push(e.sbd)
  }
  return ra
}

export interface TrangThaiNhieuLop {
  kieu: KieuTrangThaiBai
  chu: string
  /** Số lớp (trong các lớp đang chọn) đã tick bài này. */
  soLopDaGiao: number
  tong: number
  /** Chip "Đã dạy" chỉ vì bài đứng trước bài đang chọn xem (chưa giao) — vẽ nét đứt. */
  duKien?: boolean
}
/**
 * Chip của MỘT bài qua các lớp đang chọn (mỗi phần tử = tick của một lớp, null = chưa tick; `nguon[i]` = bài có đứng trước bài đã tick / đang chọn của lớp i không). Một lớp ⇒ y chip cũ
 * (`trangThaiBai`). Nhiều lớp: chưa lớp nào tick ⇒ "Bài hôm nay" / "Đã dạy" (hoặc "Đã dạy · k/n lớp" khi chỉ k lớp coi bài này là bài trước) / "Chưa dạy"; có lớp đang luyện ⇒
 * "Đang luyện · k/n lớp"; còn lại ⇒ "Đã dạy · k/n lớp".
 */
export function trangThaiNhieuLop(theoLop: readonly (TickTom | null | undefined)[], dangChon: boolean, nguon: readonly NguonPhamVi[] = []): TrangThaiNhieuLop {
  const n = theoLop.length
  const co = theoLop.filter((t): t is TickTom => !!t)
  if (n <= 1) return { ...trangThaiBai(co[0], dangChon, nguon[0] ?? null), soLopDaGiao: co.length, tong: n }
  if (co.length === 0) {
    if (dangChon) return { kieu: 'hom_nay', chu: 'Bài hôm nay', soLopDaGiao: 0, tong: n }
    const truoc = theoLop.map((_, i) => nguon[i] ?? null).filter((x): x is 'tick' | 'xem' => !!x)
    if (!truoc.length) return { kieu: 'chua_day', chu: 'Chưa dạy', soLopDaGiao: 0, tong: n }
    return { kieu: 'da_day', chu: truoc.length === n ? 'Đã dạy' : `Đã dạy · ${truoc.length}/${n} lớp`, soLopDaGiao: 0, tong: n, ...(truoc.every((x) => x === 'xem') ? { duKien: true } : {}) }
  }
  return co.some((t) => t.trangThai === 'dang_luyen')
    ? { kieu: 'dang_luyen', chu: `Đang luyện · ${co.length}/${n} lớp`, soLopDaGiao: co.length, tong: n }
    : { kieu: 'da_day', chu: `Đã dạy · ${co.length}/${n} lớp`, soLopDaGiao: co.length, tong: n }
}

/** Khoá phiên (sessionStorage): nút "Giao theo bài" ở mục Chiến dịch luyện nhờ mục Lên bảng mở sẵn thẻ Dạy học (bước Bài hôm nay). Đọc một lần rồi xoá. */
export const KHOA_MO_THE_DAY_HOC = 'ddh.moTheDayHoc'
/** Đọc (và xoá) yêu cầu mở sẵn thẻ Dạy học. Máy chặn bộ nhớ / không có ⇒ false (mở thẻ thứ nhất như cũ). */
export function docMoTheDayHoc(kho: Pick<Storage, 'getItem' | 'removeItem'> | undefined = globalThis.sessionStorage): boolean {
  try {
    const v = kho?.getItem(KHOA_MO_THE_DAY_HOC)
    if (v) kho?.removeItem(KHOA_MO_THE_DAY_HOC)
    return v === '1'
  } catch {
    return false
  }
}
