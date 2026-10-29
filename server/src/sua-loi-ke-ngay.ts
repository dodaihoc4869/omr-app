// KẾ HOẠCH SỬA LỖI CỦA NGÀY — phần đọc D1 (thầy 29/10; tính toán thuần ở sua-loi-phan-bo.ts). Gọi trong `danhSach` (chua-cau-sai.ts) khi việc hôm nay CHƯA lập / còn thiếu:
//   · chưa có dòng việc hôm nay (đầu ngày) ⇒ lập N câu;
//   · đã có nhưng em chưa làm câu nào, chưa thêm chặng, và mục tiêu đã lưu < N (danh sách cũ 12 câu từ trước bản này, hoặc có câu sai mới) ⇒ bù cho đủ N, GIỮ NGUYÊN các câu đang có.
// Em đã làm câu nào / đã thêm chặng ⇒ KHÔNG đổi danh sách giữa chừng (số «Còn x câu» không nhảy lên). Câu sai mới trong ngày và câu chưa sửa xong dồn sang ngày sau, ngày sau tính lại.
// KHÔNG thêm đợt chờ D1: máy em chỉ xin (`ke: 1` trong lệnh danh sách) khi máy chưa có việc hôm nay / chưa nhớ mục tiêu ⇒ câu đọc ứng viên đi CÙNG lô với danh sách; các lần mở
// sau máy em đã nhớ mục tiêu (`mt`) ⇒ không xin ⇒ danh sách vẫn đúng một lô như trước.
import type { MucNgay, ViecNgay } from './tu-sua-viec-ngay'
import { bacMucSua, chonViecSuaNgay, soCauSuaNgay, SUA_NGAY_TOI_THIEU, SUA_NGAY_TINH_DA_SUA, type DemSuaNgay, type UngVienSua } from './sua-loi-phan-bo'

type Obj = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' ? v : '')

export interface KeSuaNgay {
  /** Số câu mục tiêu của ngày (12…36). */
  n: number
  /** Câu bổ sung theo thứ tự chọn (không gồm câu đã có trong việc hôm nay). */
  ung: MucNgay[]
}

/** Số ngày VN nhìn lại để đếm câu «đã tự sửa gần đây» (mốc ms = nay − N ngày; cửa sổ trượt, không làm tròn theo ngày VN). */
export const MOC_DA_SUA_MS = SUA_NGAY_TINH_DA_SUA * 86_400_000

/**
 * Câu có thể sửa hôm nay (cùng luật `nhomMucChua` = «can» của danhSach): chưa «đã tự sửa», không đang chờ lịch gặp lại, chưa kiểm lại sau Hỏi thầy.
 * ?1 = sbd, ?2 = mốc giờ ISO. `cau_meta` (chỉ mục theo qid) cho dạng + mức; thiếu bảng / thiếu dòng ⇒ dạng rơi về nhóm nội dung.
 */
export const SQL_UNG_VIEN_SUA = `SELECT d.id AS d, d.qid_chuan AS q, d.trang_thai_day AS t, d.den_han AS h, d.lan_gap_lai AS lan,
    COALESCE(d.sai_cuoi_luc, d.mo_luc) AS sai, d.content_group AS cg,
    (SELECT json_array(c.dang, c.muc_do, c.chuyen_de) FROM cau_meta c WHERE c.qid=d.qid_chuan ORDER BY c.thu_tu LIMIT 1) AS meta
  FROM chua_loi_dot d
  WHERE d.sbd=?1 AND d.trang_thai_day<>'da_tu_sua'
    AND NOT (d.trang_thai_day='cho_gap_lai_2' AND (julianday(d.den_han) IS NULL OR julianday(d.den_han)>julianday(?2)))
    AND NOT EXISTS (SELECT 1 FROM hoi_thay_kiem k WHERE k.sbd=?1 AND k.qid_goc=d.qid_chuan)
  LIMIT 2000`

/** Có cần lập / bù kế hoạch cho ngày này không (xem đầu tệp). `viec` = dòng việc hôm nay đọc cùng lô (null = chưa có). */
export function canLapKe(viec: ViecNgay | null, n: number): boolean {
  if (!viec || viec.m.length === 0) return true
  if (viec.x.length > 0 || viec.them > 0) return false
  return (viec.mt ?? SUA_NGAY_TOI_THIEU) < n
}

function docUngVien(r: Obj): UngVienSua {
  let dang = '', muc = -1
  try {
    const m = JSON.parse(str(r.meta) || 'null') as unknown[] | null
    if (Array.isArray(m)) { dang = str(m[0]) || str(m[2]); muc = bacMucSua(m[1]) }
  } catch { /* siêu dữ liệu hỏng ⇒ coi như không rõ */ }
  return { d: str(r.d), q: str(r.q), t: str(r.t), h: str(r.h), lan: Number(r.lan) || 0, sai: Number(r.sai) || 0, dang: dang || str(r.cg), muc }
}

const sangMuc = (u: UngVienSua): MucNgay => ({ q: u.q, d: u.d, t: u.t, ...(u.h ? { h: u.h } : {}), l: 'goc' })

/**
 * Lập kế hoạch từ các dòng `SQL_UNG_VIEN_SUA` (đã đọc CÙNG lô với danh sách — không thêm đợt chờ D1). `viec` = dòng việc hôm nay đọc cùng lô (null = chưa có).
 * Không bao giờ ném — lỗi ⇒ null (máy em chọn như cũ, 12 câu).
 */
export function lapKeSuaNgay(dong: readonly Obj[], dem: DemSuaNgay, viec: ViecNgay | null, nayMs: number): KeSuaNgay | null {
  try {
    if (dem.can <= 0) return null // không có câu nào cần sửa ⇒ không có gì để lập
    const n = soCauSuaNgay(dem)
    if (!canLapKe(viec, n)) return null
    const ung = dong.map(docUngVien).filter((u) => u.d && u.q)
    const co = new Set((viec?.m ?? []).flatMap((x) => (x.d ? [x.d, x.q] : [x.q])))
    const daCo = ung.filter((u) => co.has(u.d) || co.has(u.q))
    const them = chonViecSuaNgay(ung.filter((u) => !co.has(u.d) && !co.has(u.q)), n - (viec?.m.length ?? 0), nayMs, daCo)
    if (!them.length && !viec?.m.length) return null // không câu nào sửa được hôm nay
    return { n, ung: them.map(sangMuc) }
  } catch { return null }
}
