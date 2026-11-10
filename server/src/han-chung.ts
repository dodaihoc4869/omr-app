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
//
// 10/11 — HẠN THEO HÀNG CHỜ + ĐỀ 28 SUẤT (thầy: «Tôi chỉ giao bài. Máy tự động tính toán một hạn tối ưu cho tất cả học sinh, có đầy đủ kế hoạch cho hết hạn chưa
// giao hoặc giao sớm hơn đảm bảo học sinh luôn được làm hết câu mới, ôn tập sửa lỗi … mỗi ngày luôn là 28 câu»). Khi nơi gọi đưa SỐ CÂU THEO PHẦN:
//   · ngày Học mới của một lượng câu = max(⌈Phần I / 18⌉, ⌈Phần II / 4⌉, ⌈Phần III / 6⌉) — đề 28 suất giữ đúng 18 · 4 · 6 nên phần dồn câu nhất quyết định;
//   · HÀNG CHỜ của từng em = câu mới em CHƯA gặp của các bài đã giao trước (giao sớm khi bài cũ chưa xong ⇒ bài mới xếp sau, hạn tự dài ra);
//   · Tₑ = ngày Học mới(hàng chờ + bài này) + 1 ngày Kiểm tra ôn tập cho mỗi bài còn dở và bài này + ngày Sửa dự báo; hạn chung = phân vị 90 %, kẹp [M + 2, 42],
//     và không sớm hơn hạn của bài đang dở (máy phát câu mới theo hạn gần trước ⇒ thứ tự bài giữ đúng).
// Hết hạn mà thầy chưa giao bài mới: không cần hạn — kế hoạch ngày vẫn 28 câu (câu mới còn dở → câu sai → ôn theo nợ ôn dạng, rut-28.ts).
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
/** Số câu theo phần (câu rút được: đã bỏ tự luận, câu chưa hợp lệ). */
export interface TheoPhan { I: number; II: number; III: number }
/** Hàng chờ của một em: câu mới chưa gặp của các bài đã giao trước, số bài còn dở, hạn muộn nhất của các bài ấy. */
export interface HangCho extends TheoPhan { goi: number; han: string }
const SUAT_PHAN: TheoPhan = { I: 18, II: 4, III: 6 }
export const TRAN_HAN_HANG_CHO = 42
const so0 = (v: unknown): number => Math.max(0, Math.floor(Number(v)) || 0)
/** Số ngày Học mới để làm hết lượng câu mới theo đề 28 suất (18 · 4 · 6): phần dồn câu nhất quyết định. */
export const ngayMoiTheoPhan = (n: TheoPhan): number => Math.max(1, Math.ceil(so0(n.I) / SUAT_PHAN.I), Math.ceil(so0(n.II) / SUAT_PHAN.II), Math.ceil(so0(n.III) / SUAT_PHAN.III))
/** Đếm câu theo phần (bỏ câu `hopLe === false`; phần lạ ⇒ Phần I như `oMaTran`). */
export function demTheoPhan(cau: readonly { phan?: string | null; hopLe?: boolean }[]): TheoPhan {
  const n: TheoPhan = { I: 0, II: 0, III: 0 }
  for (const c of cau) if (c.hopLe !== false) n[c.phan === 'II' || c.phan === 'III' ? c.phan : 'I']++
  return n
}
/** Hạn chung (số ngày, tính cả ngày bắt đầu) của bài cho lớp có năng lực `lop` (mỗi phần tử một em; null = em chưa có dữ liệu).
 *  `bai` là SỐ ⇒ luật 09/11 (M = ⌈N / 28⌉, không hàng chờ). `bai` là số câu THEO PHẦN ⇒ luật 10/11: đề 28 suất + hàng chờ `cho[i]` của từng em;
 *  `tuHan` = số ngày từ hôm nay tới hạn muộn nhất của bài đang dở của lớp (0 = không có) — hạn bài mới không sớm hơn. */
export function hanChung(bai: number | TheoPhan, lop: readonly (NangLucEm | null)[], cho: readonly (HangCho | null | undefined)[] = [], tuHan = 0): HanChung {
  const theoPhan = typeof bai !== 'number'
  const M = theoPhan ? ngayMoiTheoPhan(bai) : soNgayMoiHc(bai)
  const co = lop.filter((x): x is NangLucEm => !!x)
  const trungVi = (k: keyof NangLucEm): number => { const v = co.map((x) => x[k]).sort((a, b) => a - b); return v.length ? v[Math.floor((v.length - 1) / 2)]! : NANG_LUC_MAC_DINH[k] }
  const tv: NangLucEm = { biet: trungVi('biet'), hieu: trungVi('hieu'), van_dung: trungVi('van_dung') }
  const T_em = (lop.length ? lop : [null]).map((x, i) => {
    const c = theoPhan ? cho[i] : null
    const Me = theoPhan && c ? ngayMoiTheoPhan({ I: bai.I + so0(c.I), II: bai.II + so0(c.II), III: bai.III + so0(c.III) }) : M
    return Me + 1 + (c ? so0(c.goi) : 0) + ngaySuaDuBao(Me, x ?? tv)
  }).sort((a, b) => a - b)
  const T = Math.min(theoPhan ? TRAN_HAN_HANG_CHO : 28, Math.max(M + 2, so0(tuHan), T_em[Math.ceil(0.9 * T_em.length) - 1]!))
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

/** Hàng chờ từng em (MỘT truy vấn gộp, chỉ chạy lúc giao bài / xem trước): câu mới CHƯA gặp theo phần của các bài đã giao còn hạn trong 30 ngày gần đây.
 *  «Đã gặp» = có dòng sổ có kết quả hoặc dòng gặp có hướng dẫn (gần đúng với `docGoiCuaEm7`: không so phiên bản câu ⇒ có thể đếm thiếu vài câu thầy vừa sửa). */
export async function docHangCho(env: Env, sbds: readonly string[], now: number): Promise<(HangCho | null)[]> {
  if (!sbds.length) return []
  const tu = new Date(now + 7 * 3600000 - 30 * 86400000).toISOString().slice(0, 10)
  const r = await env.DB.prepare(`SELECT e.sbd, json_extract(c.meta_json,'$.phan') p, COUNT(*) n, COUNT(DISTINCT e.goi_id) g, MAX(e.han) han
    FROM goi_bai_7_em e JOIN goi_bai_7 gg ON gg.id = e.goi_id JOIN bai_da_day b ON b.id = gg.tick_id AND b.bo_tick_luc IS NULL
    JOIN goi_bai_7_cau c ON c.goi_id = e.goi_id AND COALESCE(json_extract(c.meta_json,'$.hopLe'),1) <> 0
    WHERE e.sbd IN (SELECT value FROM json_each(?)) AND e.han >= ?
      AND NOT EXISTS(SELECT 1 FROM su_kien_hoc s WHERE s.sbd = e.sbd AND s.qid = c.qid AND s.ket_qua IS NOT NULL)
      AND NOT EXISTS(SELECT 1 FROM goi_bai_7_gap x WHERE x.goi_id = e.goi_id AND x.sbd = e.sbd AND x.qid = c.qid)
    GROUP BY e.sbd, p`).bind(JSON.stringify(sbds), tu).all<{ sbd: string; p: string | null; n: number; g: number; han: string }>()
  const gom = new Map<string, HangCho>()
  for (const x of r.results ?? []) {
    const h = gom.get(x.sbd) ?? { I: 0, II: 0, III: 0, goi: 0, han: '' }
    h[x.p === 'II' || x.p === 'III' ? x.p : 'I'] += so0(x.n); h.goi = Math.max(h.goi, so0(x.g)); if (String(x.han) > h.han) h.han = String(x.han)
    gom.set(x.sbd, h)
  }
  return sbds.map((s) => gom.get(s) ?? null)
}

/** Hạn chung cho lớp — đọc năng lực (và hàng chờ khi có số câu theo phần) rồi tính `hanChung`. `bai`: số câu (luật 09/11), số câu theo phần, hoặc
 *  danh sách câu của bài (đếm theo phần ở đây). Đọc hàng chờ hỏng ⇒ coi như không có hàng chờ (không chặn việc giao bài). */
export async function hanChungLop(env: Env, sbds: readonly string[], bai: number | TheoPhan | readonly { phan?: string | null; hopLe?: boolean }[], now: number): Promise<HanChung> {
  const nlP = docNangLucLop(env, sbds, now).catch(() => sbds.map(() => null))
  if (typeof bai === 'number') return hanChung(bai, await nlP)
  const [nl, cho] = await Promise.all([nlP, docHangCho(env, sbds, now).catch(() => [] as (HangCho | null)[])])
  const homNay = new Date(now + 7 * 3600000).toISOString().slice(0, 10), hanXa = cho.reduce((m, c) => (c && c.han > m ? c.han : m), '')
  const tuHan = hanXa >= homNay ? Math.round((Date.parse(hanXa) - Date.parse(homNay)) / 86400000) + 1 : 0
  return hanChung('I' in bai ? (bai as TheoPhan) : demTheoPhan(bai as readonly { phan?: string | null; hopLe?: boolean }[]), nl, cho, tuHan)
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
