// BÀI MỚI TRONG 7 NGÀY (app thầy) — phép thuần cho thẻ `BangGoi7` (trùng tu 12/10, thầy: "trùng tu lại toàn bộ … khoa học đầy đủ và đẹp nhất trực quan").
// Không IO. Số liệu đọc nguyên từ lệnh `/gv/goi-bai-7` (máy chủ `server/src/goi-bai-7-thay.ts`); ở đây chỉ CỘNG / XẾP / LỌC, không bịa số.
//   · Ba bằng chứng đo riêng: ĐÃ GẶP câu gốc ⊇ ĐÃ TỰ LÀM (máy chủ chỉ ghi "tự làm" cho lượt đã ghi "gặp") · kỹ năng đã đạt.
//   · Tỉ lệ sai = sai ở lần tự làm ĐẦU / số em đã tự làm câu ấy. Dưới MAU_TOI_THIEU em là "mẫu nhỏ": vẫn hiện số thật nhưng xếp sau khi xếp theo tỉ lệ
//     (cùng ngưỡng nhãn "Nhiều học sinh sai" của `lyDoChua7`).
import type { CauGoi7 } from '../../../server/src/goi-bai-7-loi'
import { thuDu, ngayNgan } from './bai-hang-ngay-ui'
import { boDau } from './nhip-hanh-trinh'

export interface EmTen { ten: string; sbd: string }
export type CauDu = CauGoi7 & { lyDo: string[]; daChua: boolean; loiGo: string; daDo: number; sai: number; chuaGap: EmTen[]; canKiem: EmTen[]; choChua?: EmTen[] }
export interface EmDu {
  sbd: string; ten: string; tong: number; daGap: number; tuLam: number; con: number
  kyNang: { tong: number; dat: number; tyLe: number | null }
  diem: { maDe: string; diem: number }[]
}
/** Một bài (gói) — máy chủ trả nguyên hàng `goi_bai_7` (có `bat_dau`, `han` dạng YYYY-MM-DD). */
export interface GoiDu { id: string; ten: string; lop: string; han: string; bat_dau?: string }
export interface DuGoi7 {
  bat: boolean; nguonDayDu?: boolean; goiId: string; canChua: number; canGap?: number; soEm: number; soCau: number
  goi: GoiDu[]; cau: CauDu[]; em: EmDu[]
}

/** Loại câu — chữ đủ theo bảng từ chuẩn (luật A1.4: không viết tắt TN/DS/TLN). */
export const TEN_PHAN: Record<CauGoi7['phan'], string> = { I: 'Trắc nghiệm', II: 'Đúng–sai', III: 'Trả lời ngắn' }
export const NHIEU_SAI = 'Nhiều học sinh sai'
/** Ngưỡng mẫu: cùng ngưỡng nhãn "Nhiều học sinh sai" ở máy chủ (`lyDoChua7`: ít nhất 5 em đã tự làm, từ 30% sai). */
export const MAU_TOI_THIEU = 5
/** Số dòng mỗi đợt (chuẩn B16: danh sách dài phân trang). */
export const MOI_DOT_CAU = 20
export const MOI_DOT_EM = 30

export const phanTram = (a: number, b: number): number | null => (b > 0 ? Math.round((100 * a) / b) : null)
/** "8.712" — số kiểu Việt Nam. */
export const so = (n: number): string => n.toLocaleString('vi-VN')

// ------------------------------------------------------------------ hạn nộp
/** Ngày hôm nay theo giờ Việt Nam (YYYY-MM-DD) — cùng cách tính `ngayVn7` của máy chủ. */
export const ngayVn = (ms: number = Date.now()): string => new Date(ms + 7 * 3600000).toISOString().slice(0, 10)
const LA_NGAY = /^\d{4}-\d{2}-\d{2}$/
/** Số ngày còn lại TÍNH CẢ HÔM NAY (cùng `soNgayCon7` của máy chủ); ≤ 0 = đã qua hạn nộp. */
export function soNgayCon(han: string, homNay: string): number | null {
  const h = han.slice(0, 10)
  if (!LA_NGAY.test(h) || !LA_NGAY.test(homNay)) return null
  return 1 + Math.floor((Date.parse(h) - Date.parse(homNay)) / 86400000)
}
/** "còn 5 ngày" · "hôm nay là ngày cuối" · "đã qua hạn nộp" (null nếu hạn không đọc được). */
export function chuConLai(han: string, homNay: string): string | null {
  const n = soNgayCon(han, homNay)
  if (n === null) return null
  return n <= 0 ? 'đã qua hạn nộp' : n === 1 ? 'hôm nay là ngày cuối' : `còn ${n} ngày`
}
/** "23:59 · Thứ Sáu 16/10" (luật A1.6: 24 giờ, giờ Việt Nam). Hạn không đọc được ⇒ trả nguyên chữ máy chủ. */
export const chuHan = (han: string): string => (LA_NGAY.test(han.slice(0, 10)) ? `23:59 · ${thuDu(han.slice(0, 10))}` : han)
export const hanNgan = (han: string): string => (LA_NGAY.test(han.slice(0, 10)) ? ngayNgan(han.slice(0, 10)) : han)

// ------------------------------------------------------------------ tổng cả lớp
export interface TomTatLop {
  soEm: number; tong: number; gap: number; tuLam: number
  /** đã gặp nhưng chưa tự làm */
  gapChuaTuLam: number; chuaGap: number
  sai: number; daDo: number
  theoPhan: Record<CauGoi7['phan'], number>
  daCoChua: number
  /** trung bình mỗi em (làm tròn) */
  tbGap: number; tbTuLam: number
}
export function tomTatLop(du: Pick<DuGoi7, 'em' | 'cau'>): TomTatLop {
  let tong = 0, gap = 0, tuLam = 0
  for (const e of du.em) {
    const t = Math.max(0, e.tong), g = Math.min(Math.max(0, e.daGap), t)
    tong += t; gap += g; tuLam += Math.min(Math.max(0, e.tuLam), g)
  }
  let sai = 0, daDo = 0
  const theoPhan: Record<CauGoi7['phan'], number> = { I: 0, II: 0, III: 0 }
  for (const c of du.cau) { sai += c.sai; daDo += c.daDo; theoPhan[c.phan] = (theoPhan[c.phan] ?? 0) + 1 }
  const soEm = du.em.length
  return {
    soEm, tong, gap, tuLam, gapChuaTuLam: gap - tuLam, chuaGap: tong - gap, sai, daDo, theoPhan,
    daCoChua: du.cau.filter((c) => c.daChua).length,
    tbGap: soEm ? Math.round(gap / soEm) : 0, tbTuLam: soEm ? Math.round(tuLam / soEm) : 0,
  }
}

// ------------------------------------------------------------------ danh sách chữa
/** Cùng điều kiện "câu cần chữa" của máy chủ: có lý do (khó / tính toán / nhiều em sai) hoặc có em nhờ thầy chữa, mà chưa có phần chữa. */
export const canChuaCau = (c: CauDu): boolean => (c.lyDo.length > 0 || (c.choChua?.length ?? 0) > 0) && !c.daChua
export const mucCau = (c: CauDu): 'can-chua' | 'da-chua' | 'theo-doi' => (c.daChua ? 'da-chua' : canChuaCau(c) ? 'can-chua' : 'theo-doi')
export const tiLeSai = (c: Pick<CauDu, 'sai' | 'daDo'>): number | null => phanTram(c.sai, c.daDo)

export type LocTinhTrang = 'tat-ca' | 'chua-duyet' | 'nhieu-sai' | 'tinh-toan'
export type LocPhan = 'moi' | CauGoi7['phan']
export const TEN_LOC: Record<LocTinhTrang, string> = { 'tat-ca': 'Tất cả', 'chua-duyet': 'Chưa duyệt phần chữa', 'nhieu-sai': NHIEU_SAI, 'tinh-toan': 'Có tính toán' }
export function khopTinhTrang(c: CauDu, loc: LocTinhTrang): boolean {
  if (loc === 'chua-duyet') return !c.daChua
  if (loc === 'nhieu-sai') return c.lyDo.includes(NHIEU_SAI)
  if (loc === 'tinh-toan') return c.tinhToan
  return true
}
export const khopPhan = (c: CauDu, p: LocPhan): boolean => p === 'moi' || c.phan === p
export const locCau = (ds: readonly CauDu[], loc: LocTinhTrang, p: LocPhan): CauDu[] => ds.filter((c) => khopTinhTrang(c, loc) && khopPhan(c, p))
/** Số câu mỗi nút lọc — đếm TRONG loại câu đang chọn (và ngược lại) để số trên nút đúng bằng số dòng sẽ hiện. */
export function demLoc(ds: readonly CauDu[], loc: LocTinhTrang, p: LocPhan): { tinhTrang: Record<LocTinhTrang, number>; phan: Record<LocPhan, number> } {
  const theoPhan = ds.filter((c) => khopPhan(c, p)), theoTinhTrang = ds.filter((c) => khopTinhTrang(c, loc))
  const tt = (l: LocTinhTrang) => theoPhan.filter((c) => khopTinhTrang(c, l)).length
  const ph = (x: LocPhan) => theoTinhTrang.filter((c) => khopPhan(c, x)).length
  return {
    tinhTrang: { 'tat-ca': tt('tat-ca'), 'chua-duyet': tt('chua-duyet'), 'nhieu-sai': tt('nhieu-sai'), 'tinh-toan': tt('tinh-toan') },
    phan: { moi: ph('moi'), I: ph('I'), II: ph('II'), III: ph('III') },
  }
}

export type XepCau = 'uu-tien' | 'ti-le-sai'
/** 'uu-tien' = GIỮ NGUYÊN thứ tự máy chủ (em nhờ thầy chữa → câu có lý do → chưa chữa → nhiều em sai).
 *  'ti-le-sai' = câu đủ mẫu (≥ 5 em tự làm) trước, tỉ lệ sai giảm dần, rồi số em sai; câu chưa ai tự làm cuối; hoà giữ thứ tự máy chủ. */
export function xepCau(ds: readonly CauDu[], xep: XepCau): CauDu[] {
  if (xep === 'uu-tien') return [...ds]
  const viTri = new Map(ds.map((c, i) => [c.qid, i]))
  return [...ds].sort((a, b) =>
    Number(b.daDo >= MAU_TOI_THIEU) - Number(a.daDo >= MAU_TOI_THIEU) ||
    (tiLeSai(b) ?? -1) - (tiLeSai(a) ?? -1) ||
    b.sai - a.sai ||
    (viTri.get(a.qid) ?? 0) - (viTri.get(b.qid) ?? 0))
}

/** Ba nhóm học sinh cần hỗ trợ của MỘT câu, KHÔNG trùng em: Nhờ thầy chữa → Cần kiểm lại (đã gặp, lần tự làm gần nhất chưa đúng hoặc
 *  chưa tự làm) → Chưa gặp. (`canKiem` của máy chủ gồm cả em chưa gặp ⇒ tách ra để mỗi em đứng đúng một chỗ.) */
export function nhomHoTro(c: Pick<CauDu, 'chuaGap' | 'canKiem' | 'choChua'>): { choChua: EmTen[]; canKiem: EmTen[]; chuaGap: EmTen[]; tong: number } {
  const choChua = c.choChua ?? []
  const daCho = new Set(choChua.map((e) => e.sbd))
  const chuaGap = c.chuaGap.filter((e) => !daCho.has(e.sbd))
  const daChuaGap = new Set(chuaGap.map((e) => e.sbd))
  const canKiem = c.canKiem.filter((e) => !daCho.has(e.sbd) && !daChuaGap.has(e.sbd))
  return { choChua, canKiem, chuaGap, tong: choChua.length + canKiem.length + chuaGap.length }
}

// ------------------------------------------------------------------ tiến độ học sinh
export type XepEm = 'chua-gap' | 'tu-lam' | 'ky-nang' | 'ten'
export const TEN_XEP_EM: Record<XepEm, string> = { 'chua-gap': 'Còn nhiều câu chưa gặp', 'tu-lam': 'Ít câu tự làm', 'ky-nang': 'Kỹ năng đạt thấp', ten: 'Tên A–Z' }
const theoTen = (a: EmDu, b: EmDu) => a.ten.localeCompare(b.ten, 'vi') || a.sbd.localeCompare(b.sbd)
const tiTuLam = (e: EmDu) => (e.tong > 0 ? e.tuLam / e.tong : 0)
/** Mặc định: em còn nhiều câu chưa gặp lên đầu (rồi ít tự làm, rồi tên). Kỹ năng chưa có bản đồ xếp cuối. */
export function xepEm(ds: readonly EmDu[], xep: XepEm): EmDu[] {
  const f: Record<XepEm, (a: EmDu, b: EmDu) => number> = {
    'chua-gap': (a, b) => b.con - a.con || tiTuLam(a) - tiTuLam(b) || theoTen(a, b),
    'tu-lam': (a, b) => tiTuLam(a) - tiTuLam(b) || b.con - a.con || theoTen(a, b),
    'ky-nang': (a, b) => (a.kyNang.tyLe ?? 101) - (b.kyNang.tyLe ?? 101) || theoTen(a, b),
    ten: theoTen,
  }
  return [...ds].sort(f[xep])
}
/** Tìm tên hoặc SBD, không dấu vẫn khớp ("nguyen" ↔ "Nguyễn"). */
export function khopEm(e: Pick<EmDu, 'ten' | 'sbd'>, tim: string): boolean {
  const q = boDau(tim.trim())
  return !q || boDau(e.ten).includes(q) || e.sbd.toLocaleLowerCase('vi').includes(q)
}
/** "Tờ 1: 8.50/10" — cùng cách ghi điểm tự kiểm ở màn học sinh. */
export const chuDiem = (d: { diem: number }, i: number): string => `Tờ ${i + 1}: ${d.diem.toFixed(2)}/10`
