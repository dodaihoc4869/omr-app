// HIỆU ỨNG EXP THEO TỪNG CÂU ĐÚNG (luật v4 "nạp tự do", thầy chốt 29/09/2026 — docs/DE-XUAT-EXP-2909.md) — hàm THUẦN, không React.
//
// Luật hiện: chỉ câu em TỰ LÀM ĐÚNG mà máy chủ đã ghi khoản EXP câu (`loai: 'cau'`, có `qid`, exp > 0) mới có số "+N EXP" bay lên. Câu sai, câu "có trợ giúp",
// câu em đã bấm Hỏi thầy trước khi nộp ⇒ KHÔNG EXP, KHÔNG hiệu ứng. Số lấy NGUYÊN từ máy chủ, máy em không tự tính thưởng.
// Mức hiệu ứng: đầy đủ (số bay + hạt + thanh nhích) · gọn (máy yếu: chỉ số + thanh, không hạt) · tĩnh (xin giảm chuyển động: số và thanh đứng yên).

export interface KhoanExpNhan {
  exp: number
  ghiChu: string
  loai?: string
  qid?: string
}

/** Thần thú sau lượt nộp (máy chủ v4 gửi `thanThu`). */
export interface AnhThuNhan {
  cap: number
  exp: number
  thanh: number
  soCapLen: number
  choMoc: number
}

export type CheDoHieuUng = 'day-du' | 'gon' | 'tinh'

/** Chọn mức hiệu ứng: xin giảm chuyển động ⇒ tĩnh; máy yếu ⇒ gọn; còn lại đầy đủ. */
export function cheDoHieuUng(o: { mayYeu: boolean; giamChuyenDong: boolean }): CheDoHieuUng {
  if (o.giamChuyenDong) return 'tinh'
  return o.mayYeu ? 'gon' : 'day-du'
}

/**
 * EXP của TỪNG câu đúng trong một lượt nộp: `{qid: exp}`. Chỉ tính câu có kết quả ĐÚNG, không nằm trong `daHoi` (em đã bấm Hỏi thầy trước khi nộp)
 * và có khoản `cau` của máy chủ mang đúng `qid`. Nhiều khoản cùng qid (khác ngày) thì cộng.
 */
export function expTheoCau(
  ketQua: readonly { qid: string; dung: boolean | null }[] | undefined,
  expNhan: readonly KhoanExpNhan[] | undefined,
  daHoi: ReadonlySet<string> = new Set(),
): Record<string, number> {
  const dung = new Set((ketQua ?? []).filter((k) => k.dung === true && !daHoi.has(k.qid)).map((k) => k.qid))
  const ra: Record<string, number> = {}
  for (const k of expNhan ?? []) {
    if (k.loai !== 'cau' || !k.qid || !dung.has(k.qid)) continue
    const n = Math.floor(Number(k.exp) || 0)
    if (n > 0) ra[k.qid] = (ra[k.qid] ?? 0) + n
  }
  return ra
}

const nguyen = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? Math.floor(x) : null)

/** Đọc CHẶT `thanThu` máy chủ gửi; thiếu/sai dạng ⇒ null (màn chỉ hiện số, không thanh — không bịa). */
export function docAnhThu(raw: unknown): AnhThuNhan | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const cap = nguyen(o.cap), exp = nguyen(o.exp), thanh = nguyen(o.thanh)
  if (cap === null || cap < 1 || exp === null || thanh === null) return null
  return { cap, exp, thanh, soCapLen: nguyen(o.soCapLen) ?? 0, choMoc: nguyen(o.choMoc) ?? 0 }
}

/** Tỉ lệ thanh EXP (0…1); cấp tối đa (thanh 0) ⇒ đầy. */
export const tiLeThanh = (t: Pick<AnhThuNhan, 'exp' | 'thanh'>): number => (t.thanh > 0 ? Math.max(0, Math.min(1, t.exp / t.thanh)) : 1)

/** Chữ cho màn (bảng từ chuẩn: "thần thú", "EXP", "cấp"). */
export const chuExpCau = (n: number): string => `+${Math.max(0, Math.floor(n)).toLocaleString('vi-VN')} EXP`
export const chuLenCap = (cap: number): string => `Lên cấp ${cap}!`
export const chuThanhThu = (t: AnhThuNhan): string =>
  t.thanh > 0 ? `Thần thú cấp ${t.cap} · ${t.exp.toLocaleString('vi-VN')} / ${t.thanh.toLocaleString('vi-VN')} EXP` : `Thần thú cấp ${t.cap} · cấp cao nhất`
export const chuChoMocNgan = (choMoc: number, ngayCan: number): string =>
  `${Math.max(0, Math.floor(choMoc)).toLocaleString('vi-VN')} EXP đang được giữ, vào thần thú khi em đạt nhiệm vụ ngày đủ ${ngayCan} ngày.`
