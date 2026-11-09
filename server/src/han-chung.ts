// HẠN CHUNG CẢ LỚP (thầy 09/11: «hạn chung cho học sinh vì học sinh đang phải học cùng nhau trên lớp, tính toán lại thông minh tuyệt đỉnh»).
// Đặc tả: docs/ban-ve-giao-bai-0911/DAC-TA.md mục 3b · giả lập: docs/de-xuat-28-cau-mo-phong/han-chung.py.
//
// MỘT hàm cho MỌI nơi cần hạn của bài giao mới: máy chủ tạo gói (goi-bai-7.ts) và hộp Giao bài xem trước (bai-da-day.ts `xem-truoc`) ⇒ số thầy thấy
// trên hộp = số máy chủ ghi. Chỉ áp cho bài giao MỚI — gói đang chạy giữ hạn cũ (không sửa dữ liệu thật hàng loạt).
//
//   M  = ⌈N / 28⌉ ngày câu mới (luật «đủ 28, chuẩn nhất có thể»: ô dồn câu lấp suất ô gần nhất, không kéo dài ngày).
//   Sₑ = số ngày Sửa dự báo của em e (theo tỉ lệ đúng CHÍNH em ở từng mức, 21 ngày gần nhất; em chưa có dữ liệu ⇒ tỉ lệ trung vị của lớp):
//        max theo 7 ô ⌈ nhóm lỗi dự kiến / (suất ô × tỉ lệ sửa được) ⌉ + ⌊(M − 1) / 2⌋ ngày Sửa chen giữa;
//        nhóm lỗi dự kiến của ô = số dạng × (1 − p^(câu/dạng)) + suất ô × (1 − (p − 0,05)) (một ngày Ôn); tỉ lệ sửa được q = p + (1 − p)/2.
//   Tₑ = M + 1 (ngày Ôn) + Sₑ.   HẠN CHUNG T = phân vị 90 % của Tₑ trong lớp (≥ 90 % em dự kiến xong hết), kẹp [M + 2, 28].
// CHƯA HIỆU CHỈNH: giả lập cho thấy công thức tính dư ~2 ngày (an toàn). Hiệu chỉnh bằng kết quả thật để rút hạn ⇒ việc khối B.
import type { Env } from './kieu'

const O7 = [['biet', 12], ['hieu', 4], ['van_dung', 2], ['hieu', 2], ['van_dung', 2], ['hieu', 3], ['van_dung', 3]] as const
/** Tỉ lệ đúng theo mức (0..1). */
export interface NangLucEm { biet: number; hieu: number; van_dung: number }
/** Lớp chưa có dữ liệu nào: mức khá-trung bình (giả lập «Trung bình»), nghiêng về hạn dài cho an toàn. */
export const NANG_LUC_MAC_DINH: NangLucEm = { biet: 0.85, hieu: 0.65, van_dung: 0.4 }
const DANG_MOI_O = 4

export const soNgayMoiHc = (soCau: number): number => Math.max(1, Math.ceil(Math.max(0, Math.floor(soCau) || 0) / 28))

export function ngaySuaDuBao(M: number, nl: NangLucEm): number {
  let S = 0, coLoi = false
  for (const [muc, suat] of O7) {
    const p = Math.min(0.99, Math.max(0.05, nl[muc])), q = p + (1 - p) / 2, cau = suat * M
    const nhom = DANG_MOI_O * (1 - p ** (cau / DANG_MOI_O)) + suat * (1 - Math.max(0, p - 0.05))
    if (nhom > 0.3) coLoi = true
    S = Math.max(S, Math.ceil(nhom / (q * suat)))
  }
  return S + (coLoi ? Math.floor((M - 1) / 2) : 0)
}

export interface HanChung { M: number; T: number; duKienXong: number; tongEm: number }
/** Hạn chung (số ngày, tính cả ngày bắt đầu) của bài `soCau` câu cho lớp có năng lực `lop` (mỗi phần tử một em; null = em chưa có dữ liệu). */
export function hanChung(soCau: number, lop: readonly (NangLucEm | null)[]): HanChung {
  const M = soNgayMoiHc(soCau)
  const co = lop.filter((x): x is NangLucEm => !!x)
  const trungVi = (k: keyof NangLucEm): number => { const v = co.map((x) => x[k]).sort((a, b) => a - b); return v.length ? v[Math.floor((v.length - 1) / 2)]! : NANG_LUC_MAC_DINH[k] }
  const tv: NangLucEm = { biet: trungVi('biet'), hieu: trungVi('hieu'), van_dung: trungVi('van_dung') }
  const T_em = (lop.length ? lop : [null]).map((x) => M + 1 + ngaySuaDuBao(M, x ?? tv)).sort((a, b) => a - b)
  const T = Math.min(28, Math.max(M + 2, T_em[Math.ceil(0.9 * T_em.length) - 1]!))
  return { M, T, duKienXong: T_em.filter((t) => t <= T).length, tongEm: lop.length }
}

const MUC_SKH: Record<string, keyof NangLucEm> = { NB: 'biet', biet: 'biet', 'Nhận biết': 'biet', TH: 'hieu', hieu: 'hieu', 'Thông hiểu': 'hieu', VD: 'van_dung', VDC: 'van_dung', van_dung: 'van_dung', 'Vận dụng': 'van_dung', 'Vận dụng cao': 'van_dung' }
/** Năng lực từng em của lớp (MỘT truy vấn gộp, 21 ngày gần nhất). Mức nào em chưa làm đủ 5 câu ⇒ lấy trung vị lớp của mức đó (trong `hanChung`). */
export async function docNangLucLop(env: Env, sbds: readonly string[], now: number): Promise<(NangLucEm | null)[]> {
  if (!sbds.length) return []
  const tu = new Date(now + 7 * 3600000 - 21 * 86400000).toISOString().slice(0, 10)
  const r = await env.DB.prepare(`SELECT sbd, muc_do m, COUNT(*) n, SUM(CASE WHEN ket_qua = 1 THEN 1 ELSE 0 END) d FROM su_kien_hoc
    WHERE sbd IN (SELECT value FROM json_each(?)) AND ngay_vn >= ? AND ket_qua IS NOT NULL AND COALESCE(muc_do,'') <> '' GROUP BY sbd, muc_do`)
    .bind(JSON.stringify(sbds), tu).all<{ sbd: string; m: string; n: number; d: number }>()
  const gom = new Map<string, Record<keyof NangLucEm, [number, number]>>()
  for (const x of r.results ?? []) {
    const k = MUC_SKH[String(x.m).trim()]
    if (!k) continue
    const g = gom.get(x.sbd) ?? { biet: [0, 0], hieu: [0, 0], van_dung: [0, 0] }
    g[k][0] += Number(x.n) || 0; g[k][1] += Number(x.d) || 0; gom.set(x.sbd, g)
  }
  return sbds.map((s) => {
    const g = gom.get(s)
    if (!g) return null
    const tl = (k: keyof NangLucEm): number => (g[k][0] >= 5 ? g[k][1] / g[k][0] : NaN)
    const nl = { biet: tl('biet'), hieu: tl('hieu'), van_dung: tl('van_dung') }
    if (Object.values(nl).every((v) => Number.isNaN(v))) return null
    // Mức thiếu dữ liệu ⇒ suy từ mức có dữ liệu (thấp hơn 0,15 mỗi bậc khó hơn), không bịa cao hơn.
    const b = Number.isNaN(nl.biet) ? (Number.isNaN(nl.hieu) ? nl.van_dung + 0.3 : nl.hieu + 0.15) : nl.biet
    const h = Number.isNaN(nl.hieu) ? (Number.isNaN(nl.van_dung) ? b - 0.15 : (b + nl.van_dung) / 2) : nl.hieu
    const v = Number.isNaN(nl.van_dung) ? h - 0.15 : nl.van_dung
    return { biet: Math.min(0.99, b), hieu: Math.min(0.99, h), van_dung: Math.min(0.99, Math.max(0.05, v)) }
  })
}

/** Hạn chung cho lớp `lop` (tên lớp hiệu lực) — đọc danh sách em đang học + năng lực, tính `hanChung`. */
export async function hanChungLop(env: Env, sbds: readonly string[], soCau: number, now: number): Promise<HanChung> {
  return hanChung(soCau, await docNangLucLop(env, sbds, now).catch(() => sbds.map(() => null)))
}

/** ĐỘ CHUẨN ĐỀ của bài (hộp Giao bài, thẻ «Bài thiếu câu chuẩn»): mỗi ngày Mới trung bình bao nhiêu suất có câu ĐÚNG ô ma trận.
 *  `theoO` = số câu theo ô đã quy (`oMaTran`: «I|biet»…); M ngày Mới; đúng ô = ⌊Σ min(câu ô, suất ô × M) / M⌋ (chưa có câu bù song sinh — khối B).
 *  `thieuDS` = số câu Đúng/Sai còn thiếu so với 4 suất/ngày × M. */
export function doChuanDe(theoO: Readonly<Record<string, number>>, soCau: number, W: Readonly<Record<string, number>>): { dungO: number; M: number; thieuDS: number } {
  const M = soNgayMoiHc(soCau)
  let dung = 0
  for (const [o, w] of Object.entries(W)) dung += Math.min(Math.max(0, theoO[o] ?? 0), w * M)
  const ds = Object.entries(theoO).filter(([o]) => o.startsWith('II|')).reduce((n, [, v]) => n + v, 0)
  return { dungO: Math.min(28, Math.floor(dung / M)), M, thieuDS: Math.max(0, 4 * M - ds) }
}
