// ĐỀ 28 THEO SUẤT — một lõi cho ngày Học mới, ngày Sửa lỗi và ngày ôn của Gói 7 (thầy 10/11: «mỗi ngày chỉ 28 câu nhưng chuẩn chính xác ma trận của đề
// thi đại học … Sửa cũng 28 câu theo cấu trúc … ôn lại cũng 28 câu theo cấu trúc mà mỗi lần ôn lại phải cá nhân hóa cho từng học sinh và ôn lại kiến thức cũ
// trọn vẹn»; duyệt «bản kịp hạn, build và đẩy lên bản sống luôn»). Đặc tả + số đo: docs/de-xuat-28-cau-v6-1011.md.
//
// LUẬT (thuần CPU, tất định, không đọc D1):
//   · Mỗi ngày là một đề 28 SUẤT cố định theo ô (phần × mức) của MA_TRAN_RUT_MOI: I 12·4·2 · II 0·2·2 · III 0·3·3.
//   · Ứng viên đã xếp sẵn theo TẦNG NGUỒN (0 = nguồn chính của ngày: câu mới ở ngày Học mới, câu sai ở ngày Sửa) và thứ tự ưu tiên trong tầng.
//   · Bước 1 — nguồn chính: đúng ô trước; còn dư thì lệch MỨC trong CÙNG PHẦN (kịp hạn bài / dọn lỗi nhanh) — không bao giờ lệch phần ở bước này.
//   · Bước 2 — mọi nguồn theo thứ tự tầng: lấp suất còn trống bằng câu ĐÚNG Ô.
//   · Bước 3 — suất vẫn trống: câu của ô gần nhất (cùng phần trước — giá lệch như `giaLech2026`), tầng trên trước.
//   · Bước 4 — hết suất mà chưa đủ số cần (hiếm: em đã làm vượt suất của một ô): lấy tiếp theo thứ tự.
//   · Câu em ĐÃ làm hôm nay chiếm suất trước (cùng luật) ⇒ lập lại giữa ngày vẫn ra một đề 28 đúng cấu trúc.
// Số đo thật 09/11 (workflow chỉ đọc do-ma-tran-28-1011): 169 em-ngày đủ 28 câu, KHÔNG em nào đúng hoặc sát 18/4/6; ngày Sửa 23/116 em không có câu trả lời ngắn nào.
import { MA_TRAN_RUT_MOI, type MucMt, type PhanMt } from './ma-tran-rut-moi'

/** Luật áp dụng từ đề của ngày này (phát hành 10/11; đổi giữa ngày sẽ làm đổi phần câu còn lại của em đang làm dở ⇒ bắt đầu từ ngày kế). */
export const NGAY_DE_28 = '2026-11-11'

const MUC: readonly MucMt[] = ['biet', 'hieu', 'van_dung']
const PHAN: readonly PhanMt[] = ['I', 'II', 'III']
/** 7 ô có suất, đúng thứ tự Phần I → III, Biết → Vận dụng. */
export const O_28: readonly string[] = PHAN.flatMap((p) => MUC.filter((m) => MA_TRAN_RUT_MOI[p][m] > 0).map((m) => `${p}|${m}`))
export const SUAT_28: readonly number[] = O_28.map((o) => { const [p, m] = o.split('|') as [PhanMt, MucMt]; return MA_TRAN_RUT_MOI[p][m] })
const CHI_SO = new Map(O_28.map((o, i) => [o, i]))
const PHAN_O = O_28.map((o) => o.split('|')[0]!)
const BAC_O = O_28.map((o) => MUC.indexOf(o.split('|')[1] as MucMt))
/** Giá lệch đặt câu ô `c` vào suất ô `s`: cùng phần = số bậc mức chênh; khác phần = 10 + số bậc (cùng luật `giaLech2026`). */
const GIA: readonly number[][] = O_28.map((_, s) => O_28.map((__, c) => (PHAN_O[s] === PHAN_O[c] ? 0 : 10) + Math.abs(BAC_O[s]! - BAC_O[c]!)))

export interface UngVien28 { qid: string; /** ô `phần|mức` từ `oMaTran` */ o: string; /** tầng nguồn, 0 = nguồn chính của ngày */ tang: number }

/** Ô có suất gần nhất còn trống cho câu ô `c` (chỉ trong cùng phần khi `cungPhan`). −1 = không còn. */
function suatGan(con: readonly number[], c: number, cungPhan: boolean): number {
  let tot = -1
  for (let s = 0; s < con.length; s++) {
    if (con[s]! <= 0 || (cungPhan && PHAN_O[s] !== PHAN_O[c])) continue
    if (tot < 0 || GIA[s]![c]! < GIA[tot]![c]!) tot = s
  }
  return tot
}

/**
 * Chọn `can` câu từ `ung` (ĐÃ xếp theo tầng rồi ưu tiên) theo 28 suất. `daLamO` = ô của các câu em đã làm hôm nay (chiếm suất trước).
 * Trả mã câu theo đúng thứ tự `ung` (nguồn chính trước) — nơi gọi chia chặng theo thứ tự ấy.
 */
export function rut28(a: { ung: readonly UngVien28[]; can: number; daLamO?: readonly string[]; tong?: number }): string[] { return rut28Lech(a).qids }
/** Suất của một ngày `tong` câu (nợ câu 11/11: mức hôm nay = 28 + số câu trả nợ): chia theo ĐÚNG tỉ lệ 28 suất, phần lẻ lớn nhất nhận trước. ≤ 28 ⇒ 28 suất gốc. */
export function suatTheoTong(tong?: number): number[] {
  const t = Math.floor(Number(tong) || 0)
  if (t <= 28) return [...SUAT_28]
  const ra = SUAT_28.map((x) => Math.floor(x * t / 28))
  const le = SUAT_28.map((x, i) => ({ i, le: (x * t) % 28 })).sort((a, b) => b.le - a.le || a.i - b.i)
  for (let k = 0, con = t - ra.reduce((n, x) => n + x, 0); k < con; k++) ra[le[k]!.i]!++
  return ra
}
/** Như `rut28`, kèm `lech` = số câu phải lấy LỆCH Ô ở bước 3–4 (nguồn chính lệch mức ở bước 1 không tính) — nơi gọi biết có cần nạp thêm nguồn (ôn sớm) không. */
export function rut28Lech(a: { ung: readonly UngVien28[]; can: number; daLamO?: readonly string[]; tong?: number }): { qids: string[]; lech: number } {
  const can = Math.max(0, Math.floor(a.can) || 0), n = a.ung.length
  if (!can || !n) return { qids: [], lech: 0 }
  const con = suatTheoTong(a.tong)
  for (const o of a.daLamO ?? []) { const s = suatGan(con, CHI_SO.get(o) ?? 1, false); if (s >= 0) con[s] = con[s]! - 1 }
  const oU = a.ung.map((u) => CHI_SO.get(u.o) ?? 1), lay = new Uint8Array(n)
  let so = 0
  const chon = (i: number, s: number) => { lay[i] = 1; con[s] = con[s]! - 1; so++ }
  // 1. nguồn chính: đúng ô, rồi lệch mức trong cùng phần
  for (let i = 0; i < n && so < can; i++) if (a.ung[i]!.tang === 0 && con[oU[i]!]! > 0) chon(i, oU[i]!)
  for (let i = 0; i < n && so < can; i++) if (a.ung[i]!.tang === 0 && !lay[i]) { const s = suatGan(con, oU[i]!, true); if (s >= 0) chon(i, s) }
  // 2. mọi nguồn, đúng ô
  for (let i = 0; i < n && so < can; i++) if (!lay[i] && con[oU[i]!]! > 0) chon(i, oU[i]!)
  const dungO = so
  // 3. suất còn trống: ô gần nhất, tầng trên trước
  for (let s = 0; s < con.length; s++) while (con[s]! > 0 && so < can) {
    let tot = -1
    for (let i = 0; i < n; i++) if (!lay[i] && (tot < 0 || GIA[s]![oU[i]!]! < GIA[s]![oU[tot]!]!)) tot = i
    if (tot < 0) break
    chon(tot, s)
  }
  // 4. hết suất mà chưa đủ số cần
  for (let i = 0; i < n && so < can; i++) if (!lay[i]) { lay[i] = 1; so++ }
  const ra: string[] = []
  for (let i = 0; i < n; i++) if (lay[i]) ra.push(a.ung[i]!.qid)
  return { qids: ra, lech: so - dungO }
}

// ───────────── NỢ ÔN THEO DẠNG — ôn cá nhân hoá, phủ rộng ─────────────
// Mỗi em × mỗi dạng: ngày chạm gần nhất + độ bền h (ngày). h = 1 + QUÃNG EM ĐÃ GIỮ ĐÚNG dạng ấy (từ lần sai gần nhất — chưa sai thì từ lần chạm đầu —
// tới lần chạm gần nhất): giữ đúng qua 10 ngày ⇒ lần ôn kế chờ được ~10 ngày (khoảng cách tự nhân đôi như ôn giãn cách); vừa sai ⇒ h = 1, mai ôn lại.
// Trần `tranH` ngày ⇒ dạng vững nhất cũng tới hạn sau ngần ấy ngày. NỢ ÔN = số ngày chưa chạm ÷ h: dạng em yếu và dạng lâu chưa làm lên đầu.
// Trong một đề mỗi dạng một câu trước (vòng 1), hết dạng mới tới câu thứ hai ⇒ một đề chạm nhiều dạng nhất có thể. Một lượt duyệt lịch sử, không sắp xếp.
export const TRAN_H = 30
export const TRAN_H_CUOI = 14
/** Ba tháng cuối trước kỳ thi (cùng mốc `MOC_HAI_KT_MOI_BAI`): trần quay lại 14 ngày. */
export const MOC_H_CUOI = '2027-03-22'
const soNgay = (a: string, b: string): number => Math.round((Date.parse(b) - Date.parse(a)) / 86400000)

/** Nợ ôn của từng dạng em đã chạm. `dangCua(qid)` trả khoá dạng ('' = không có dạng ⇒ bỏ qua). */
export function noOnDang(tt: ReadonlyMap<string, { lichSu: readonly { ngay: string; dung: boolean }[] }>, dangCua: (qid: string) => string, ngay: string): Map<string, number> {
  const so = new Map<string, { dau: string; cuoi: string; sai: string }>()
  for (const [qid, t] of tt) {
    const ls = t.lichSu
    if (!ls.length) continue
    const d = dangCua(qid)
    if (!d) continue
    let x = so.get(d)
    if (!x) { x = { dau: '9', cuoi: '', sai: '' }; so.set(d, x) }
    for (const l of ls) { if (l.ngay < x.dau) x.dau = l.ngay; if (l.ngay > x.cuoi) x.cuoi = l.ngay; if (!l.dung && l.ngay > x.sai) x.sai = l.ngay }
  }
  const tran = ngay >= MOC_H_CUOI ? TRAN_H_CUOI : TRAN_H, ra = new Map<string, number>()
  for (const [d, x] of so) ra.set(d, Math.max(0, soNgay(x.cuoi, ngay)) / Math.min(tran, 1 + Math.max(0, soNgay(x.sai || x.dau, x.cuoi))))
  return ra
}

/** Xếp hàng câu ôn: dạng nợ ôn lớn trước, mỗi dạng một câu rồi mới tới vòng hai; trong một dạng giữ thứ tự cũ. Dạng chưa chạm bao giờ = nợ 1 (đến hạn). */
export function xepOnTheoNo(ids: readonly string[], dangCua: (qid: string) => string, no: ReadonlyMap<string, number>): string[] {
  const nhom = new Map<string, string[]>()
  for (const q of ids) { const d = dangCua(q) || `cau:${q}`; const ds = nhom.get(d); if (ds) ds.push(q); else nhom.set(d, [q]) }
  const xep = [...nhom].map(([d, ds], i) => ({ ds, no: no.get(d) ?? 1, i })).sort((x, y) => y.no - x.no || x.i - y.i)
  const ra: string[] = []
  for (let v = 0; ra.length < ids.length; v++) for (const g of xep) if (v < g.ds.length) ra.push(g.ds[v]!)
  return ra
}
