// ĐỔI ĐÁP ÁN · DÒ ĐÁP ÁN · RỜI APP NGAY TRƯỚC KHI CHỌN · MÃ MÁY LUYỆN TẬP (01/11, đợt 2 «đánh giá 4 bảng v2» — thầy muốn chính xác ≥ 99%).
// Bộ đếm THUẦN cho MỘT lượt làm câu luyện tập (màn `ManLamBaiTap`). ĐƯỜNG NÓNG: mỗi lần chạm chỉ đổi vài số trong một đối tượng giữ ở ref — không vẽ lại,
// không đọc DOM. Kết quả đi CÙNG cụm `doGiay` của lượt nộp (không thêm lệnh); máy chủ làm sạch lại ở `server/src/do-giay-luot.ts` (`lamSachHanhVi`):
//   dd · số lần ĐỔI lựa chọn trước khi bấm «Kiểm tra» — Phần I: đổi sang chữ khác; Phần II: đổi Đ↔S ở một ý đã chọn; Phần III: mỗi ĐỢT xoá / sửa số đã gõ
//        (gõ thêm chữ số không tính; xoá liền nhiều kí tự là một lần);
//   dq · số phương án KHÁC NHAU đã thử — CHỈ Phần I (A–D). «Dò đáp án» = dq ≥ 3;
//   rn · số lần ẩn app (chuyển app / tab ẩn / tắt màn) trong lượt;
//   ar · giây ẩn app trong 30 giây NGAY TRƯỚC lựa chọn cuối (0 = không rời). Lượt chưa chọn gì ở lần mở này (nộp bản nháp cũ) ⇒ không gửi `ar`;
//   tb · mã máy luyện tập NGẮN: lấy từ CÙNG mã máy của luồng thi (`thiet-bi.ts`, localStorage `ddh_id_thiet_bi`), bỏ dấu, 16 kí tự. Không phải IP,
//        không định danh cá nhân. Hiện chỉ ghi lại (phát hiện «làm hộ» để đợt sau).
import { layIdThietBi } from './thiet-bi'

/** Bộ đếm một lượt. Giữ ở `useRef`, đổi TẠI CHỖ (không tạo đối tượng mới mỗi lần chạm). */
export interface DemLuot {
  /** Giá trị đang hiện trên màn (chuỗi máy em gửi). */
  hien: string
  /** Lựa chọn KHÔNG rỗng gần nhất (Phần I: một chữ; Phần II: 4 kí tự D/S/-; Phần III: số đã gõ). Bỏ chọn rồi chọn lại đúng chữ cũ ⇒ không tính đổi. */
  truoc: string
  dd: number
  /** Phần I: mặt nạ bit các chữ A–D đã thử. */
  thu: number
  /** Phần III: đang trong một đợt xoá / sửa (một đợt chỉ đếm một lần). */
  sua: boolean
  /** Mốc (ms) lựa chọn cuối; -1 = chưa chọn ở lần mở này. */
  chonLuc: number
  rn: number
  /** Mốc (ms) bắt đầu lần ẩn đang dở; -1 = đang hiện. */
  anTu: number
  /** Các khoảng ẩn đã xong, phẳng [đầu, cuối, đầu, cuối…] — chỉ giữ `KHOANG_AN_TOI_DA` khoảng gần nhất (ar chỉ xét 30 giây). */
  an: number[]
}

/** Cụm hành vi gửi kèm `doGiay` (khoá trùng `DoHanhVi` của máy chủ). */
export interface HanhViGui { dd: number; dq?: number; rn: number; ar?: number; tb?: string }

export const CUA_SO_AR_MS = 30_000
const KHOANG_AN_TOI_DA = 8
const CHU = 'ABCD'
const bitChu = (v: string): number => (v.length === 1 ? (CHU.indexOf(v) >= 0 ? 1 << CHU.indexOf(v) : 0) : 0)
const laDS = (c: string | undefined) => c === 'D' || c === 'S'

/** Bộ đếm mới cho một câu. `dau` = đáp án nháp khôi phục (không tính là đổi); `dangAn` = màn đang ẩn lúc mở (hiếm). */
export function taoDem(dau: string = '', phan?: string | null, now: number = Date.now(), dangAn = false): DemLuot {
  const v = String(dau ?? '')
  return { hien: v, truoc: v, dd: 0, thu: phan === 'I' ? bitChu(v) : 0, sua: false, chonLuc: -1, rn: 0, anTu: dangAn ? now : -1, an: [] }
}

/** Em vừa đổi đáp án đang chọn thành `v`. Đổi `d` tại chỗ. */
export function ghiChon(d: DemLuot, phan: string | null | undefined, v: string, now: number): void {
  if (v === d.hien) return
  const cu = d.hien
  d.hien = v
  if (phan === 'I') {
    const b = bitChu(v)
    if (!b) return // bỏ chọn / giá trị lạ: không phải một lựa chọn
    d.chonLuc = now
    if (d.truoc && d.truoc !== v) d.dd++
    d.thu |= b
    d.truoc = v
    return
  }
  if (phan === 'II') {
    let moi = '', coChon = false
    for (let i = 0; i < 4; i++) {
      const c = v[i], t = d.truoc[i]
      if (laDS(c)) { coChon = true; if (laDS(t) && t !== c) d.dd++; moi += c } else moi += laDS(t) ? t : '-'
    }
    d.truoc = moi
    if (coChon) d.chonLuc = now
    return
  }
  // Phần III (và phần lạ): gõ thêm ⇒ không tính; bắt đầu xoá / sửa số đã gõ ⇒ một lần đổi cho cả đợt.
  if (cu && !v.startsWith(cu)) { if (!d.sua) { d.dd++; d.sua = true } } else d.sua = false
  if (v) { d.chonLuc = now; d.truoc = v }
}

/** Màn vừa ẩn (rời app). */
export function ghiAn(d: DemLuot, now: number): void {
  if (d.anTu >= 0) return
  d.anTu = now
  d.rn++
}

/** Màn vừa hiện lại. */
export function ghiHien(d: DemLuot, now: number): void {
  if (d.anTu < 0) return
  d.an.push(d.anTu, Math.max(d.anTu, now))
  if (d.an.length > 2 * KHOANG_AN_TOI_DA) d.an.splice(0, d.an.length - 2 * KHOANG_AN_TOI_DA)
  d.anTu = -1
}

/** Giây ẩn app trong 30 giây ngay trước lựa chọn cuối; chưa chọn ở lần mở này ⇒ null. */
export function giayAnTruocChon(d: DemLuot): number | null {
  if (d.chonLuc < 0) return null
  const tu = d.chonLuc - CUA_SO_AR_MS, den = d.chonLuc
  let ms = 0
  for (let i = 0; i + 1 < d.an.length; i += 2) ms += Math.max(0, Math.min(d.an[i + 1]!, den) - Math.max(d.an[i]!, tu))
  if (d.anTu >= 0 && d.anTu < den) ms += den - Math.max(d.anTu, tu)
  return Math.min(30, Math.round(ms / 1000))
}

/** Chốt cụm gửi lúc bấm «Kiểm tra». `tb` rỗng ⇒ không gửi. Thuần. */
export function chotHanhVi(d: DemLuot, phan: string | null | undefined, tb = ''): HanhViGui {
  const ar = giayAnTruocChon(d)
  let dq = 0
  for (let b = d.thu; b; b &= b - 1) dq++
  return { dd: d.dd, ...(phan === 'I' ? { dq } : {}), rn: d.rn, ...(ar !== null ? { ar } : {}), ...(tb ? { tb } : {}) }
}

/** Mã máy luyện tập ngắn (≤ 16 kí tự [A-Za-z0-9]) từ mã máy của luồng thi. Không đọc được ⇒ ''. */
export function maMayNgan(id?: string): string {
  let goc = id
  if (goc === undefined) try { goc = layIdThietBi() } catch { goc = '' }
  return String(goc ?? '').replace(/[^A-Za-z0-9]/g, '').slice(0, 16)
}
