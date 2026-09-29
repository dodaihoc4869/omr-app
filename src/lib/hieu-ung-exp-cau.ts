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

/** Thần thú sau lượt nộp (máy chủ v4/v5 gửi `thanThu`). v5 (chỉ-thêm): `choNgay` số ngày đạt còn thiếu khi thanh đã đầy; `tran`/`vangTran`/`manhTran` EXP tràn của lần này và phần đã đổi. */
export interface AnhThuNhan {
  cap: number
  exp: number
  thanh: number
  soCapLen: number
  choMoc: number
  choNgay?: number
  tran?: number
  vangTran?: number
  manhTran?: number
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

/**
 * EXP hiện cho MỘT câu trả lời trong GAME (Đảo, Đoàn Hộ Tống, Bi-a): số lấy NGUYÊN từ phản hồi máy chủ — `reward` thưởng nấc + `expThuThach` (câu thử thách/trùm)
 * + `expCau` (v5: câu game thường đúng = ½ câu học tập). Câu sai, câu có trợ giúp (ô "Trợ giúp", Bùa Trợ giảng) hoặc câu em đã bấm Hỏi thầy ⇒ 0 (không hiệu ứng), dù máy chủ trả gì.
 */
export function expCauGame(r: { correct?: boolean; assisted?: boolean; coTroGiup?: boolean; daHoi?: boolean; reward?: number; expThuThach?: number; expCau?: number } | null | undefined): number {
  if (!r || r.correct !== true || r.assisted === true || r.coTroGiup === true || r.daHoi === true) return 0
  const so = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) && x > 0 ? Math.floor(x) : 0)
  return so(r.reward) + so(r.expThuThach) + so(r.expCau)
}

const nguyen = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? Math.floor(x) : null)

/** Đọc CHẶT `thanThu` máy chủ gửi; thiếu/sai dạng ⇒ null (màn chỉ hiện số, không thanh — không bịa). */
export function docAnhThu(raw: unknown): AnhThuNhan | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const cap = nguyen(o.cap), exp = nguyen(o.exp), thanh = nguyen(o.thanh)
  if (cap === null || cap < 1 || exp === null || thanh === null) return null
  const them = (k: 'choNgay' | 'tran' | 'vangTran' | 'manhTran') => { const v = nguyen(o[k]); return v && v > 0 ? { [k]: v } : {} }
  return { cap, exp, thanh, soCapLen: nguyen(o.soCapLen) ?? 0, choMoc: nguyen(o.choMoc) ?? 0, ...them('choNgay'), ...them('tran'), ...them('vangTran'), ...them('manhTran') }
}

/** Tỉ lệ thanh EXP (0…1); cấp tối đa (thanh 0) ⇒ đầy. */
export const tiLeThanh = (t: Pick<AnhThuNhan, 'exp' | 'thanh'>): number => (t.thanh > 0 ? Math.max(0, Math.min(1, t.exp / t.thanh)) : 1)

/** Chữ cho màn (bảng từ chuẩn: "thần thú", "EXP", "cấp"). */
export const chuExpCau = (n: number): string => `+${Math.max(0, Math.floor(n)).toLocaleString('vi-VN')} EXP`
export const chuLenCap = (cap: number): string => `Lên cấp ${cap}!`
export const chuThanhThu = (t: AnhThuNhan): string =>
  t.thanh > 0 ? `Thần thú cấp ${t.cap} · ${t.exp.toLocaleString('vi-VN')} / ${t.thanh.toLocaleString('vi-VN')} EXP` : `Thần thú cấp ${t.cap} · cấp cao nhất`
/** EXP chờ mốc của luật cũ (ngăn riêng): được giữ, vào thú khi em có thêm ngày đạt. */
export const chuChoMocNgan = (choMoc: number): string =>
  `${Math.max(0, Math.floor(choMoc)).toLocaleString('vi-VN')} EXP đang được giữ, vào thần thú khi em đạt nhiệm vụ ngày thêm ngày mới.`
/** v5: thanh đã đầy, còn thiếu ngày đạt. `vangTran`/`manhTran` = phần EXP làm thêm vừa đổi được (có thì nói, có số). */
export const chuChoNgayNgan = (t: Pick<AnhThuNhan, 'cap' | 'choNgay' | 'vangTran' | 'manhTran'>): string => {
  const n = Math.max(0, Math.floor(t.choNgay ?? 0)), v = Math.max(0, Math.floor(t.vangTran ?? 0)), m = Math.max(0, Math.floor(t.manhTran ?? 0))
  const doi = v > 0 || m > 0 ? ` EXP làm thêm đổi thành ${[v > 0 ? `+${v.toLocaleString('vi-VN')} vàng` : '', m > 0 ? `+${m} mảnh khiên` : ''].filter(Boolean).join(', ')}.` : ''
  return `Thanh EXP đã đầy. Em đạt nhiệm vụ ngày thêm ${n} ngày nữa thì thần thú lên cấp ${t.cap + 1}.${doi}`
}
