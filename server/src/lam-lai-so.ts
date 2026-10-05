// "LÀM LẠI CÂU SAI BẰNG BẢN KHÁC" (thầy 05/10) — PHẦN THUẦN: sổ, ref phiên, bản xáo. Không I/O, không import mô-đun có I/O
// (srs2-d1 / srs2-gv / game-v2 / game-v2-doan nhập tệp này ⇒ tệp này KHÔNG được nhập ngược chúng hay omni-game — tránh vòng phụ thuộc lúc nạp mô-đun).
// Luật thang 4 bậc và bộ chọn câu anh em (có I/O) nằm ở `cau-anh-em.ts`.
//
// Sổ (bậc 2, câu anh em): khi em làm lại câu sai Q bằng một câu THẬT khác cùng dạng (S), `su_kien_hoc` ghi dòng dưới qid của S (sự thật) kèm
// `raw_json.tc = Q` ("thay cho"). Mọi nơi phát lại lịch sử của Q (docLanLam / docHoSo2 / hàng chữa lỗi / bảng chiến dịch / kế hoạch còn lại)
// đọc THÊM các dòng `tc = Q` của em và coi là một lượt SONG SINH của Q (`LanLam.songSinh = true`) ⇒ Q hoàn thành đúng luật đóng lỗi chung
// (`phatLaiLoi`). Lịch sử của S vẫn là của S (dòng ấy đồng thời là một lần làm S).
// Ref phiên (JSON `game_v2_session.questions[]`, chỉ máy chủ): `tc` thay cho câu gốc · `xt` hoán vị bản xáo (xt[vị trí mới] = chỉ số gốc) · `nv` nguyên văn.
import type { LanLam } from './srs2-loi'
import type { TrangThaiLoi } from './loi-hoc-luat'
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { hashSeed, seededPermutation } from '../../src/lib/exam-shuffle'
import { khoiCuaCau, khoiCuaLop, khoiCuaMaDe, type Khoi } from '../../src/lib/khoi-cau'

type Row = Record<string, unknown>
type Obj = Record<string, unknown>
const laObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v)

// ---------------------------------------------------------------- cửa sổ lỗi
/**
 * Lượt làm lại của câu lỗi phải là BẢN KHÁC (không nguyên văn nếu còn bậc 1–3): lỗi MỞ, CHỜ KIỂM (từ lần sai cuối tới khi đóng) và lượt KIỂM
 * DUY TRÌ của lỗi đã đóng (cùng các trạng thái `phatLaiLoi` cho `nenSongSinh` khi câu có song sinh). `duy_tri` (qua hết mốc) / `khong_loi` ⇒ không.
 */
export const laCuaSoLoi = (t: TrangThaiLoi | null | undefined): boolean => t === 'mo' || t === 'cho_kiem' || t === 'dong'

// ---------------------------------------------------------------- sổ
/** Biểu thức SQL đọc "thay cho" từ `raw_json` (chỉ mục biểu thức: migration-lam-lai-0510.sql). */
export const SQL_TC = "json_extract(raw_json,'$.tc')"
/**
 * Câu SQL đọc sổ: dòng của chính các qid hỏi (gốc + song sinh — tham số `?2`, mảng JSON) VÀ dòng câu anh em làm thay một qid gốc (`?3`, mảng JSON
 * qid gốc). HAI nhánh UNION ALL để mỗi nhánh đi đúng chỉ mục của nó — (sbd, qid) và chỉ mục một phần (sbd, tc) của migration-lam-lai-0510.sql;
 * một vế OR chung làm SQLite quét MỌI dòng của em (đo EXPLAIN QUERY PLAN 05/10). Nhánh hai bỏ dòng đã có ở nhánh một (một dòng chỉ đọc một lần).
 * `cot`: các cột (cột `tc` tự thêm); `dkEm`: điều kiện em (dùng `?1`); `them`: điều kiện chung hai nhánh (tham số đánh số từ `?4`).
 */
export function sqlQidHoacTc(cot: string, dkEm: string, them = ''): string {
  const dk = them ? ` AND ${them}` : ''
  return `SELECT ${cot}, ${SQL_TC} AS tc FROM su_kien_hoc WHERE ${dkEm} AND qid IN (SELECT value FROM json_each(?2))${dk}
    UNION ALL SELECT ${cot}, ${SQL_TC} AS tc FROM su_kien_hoc WHERE ${dkEm} AND ${SQL_TC} IS NOT NULL AND ${SQL_TC} IN (SELECT value FROM json_each(?3))
      AND qid NOT IN (SELECT value FROM json_each(?2))${dk}`
}

const gocCua = (qid: string): string => /^(.*)~ss\d+$/.exec(qid)?.[1] ?? qid

/**
 * Một dòng sổ (đã SELECT thêm cột `tc`) → các lần làm: của CHÍNH qid dòng (quy song sinh về gốc) khi gốc ấy thuộc tập đang hỏi, và thêm một
 * lần làm SONG SINH của câu gốc `tc` khi `tc` thuộc tập đang hỏi. Dòng không có `tc` (sổ cũ, truy vấn lùi) ⇒ y hệt `lanLamGoc`.
 */
export function lanLamTuDongTc(x: Row, lanLamGoc: (x: Row) => LanLam, tapGoc: ReadonlySet<string>): LanLam[] {
  const ra: LanLam[] = []
  const qid = x.qid == null ? '' : String(x.qid)
  const goc = gocCua(qid)
  if (tapGoc.has(goc)) ra.push(lanLamGoc(x))
  const tc = x.tc == null ? '' : String(x.tc)
  if (tc && tc !== goc && tapGoc.has(tc)) ra.push({ ...lanLamGoc(x), qid: tc, songSinh: true })
  return ra
}

// ---------------------------------------------------------------- luật khối của câu anh em (thầy 05/10)
/**
 * Khối câu anh em phải có: khối EM; em chưa rõ khối ⇒ khối của câu Q (câu em đang sửa); cả hai không đọc ra ⇒ null (không phát câu anh em).
 * Thuần — `khoiCuaCau` của src/lib/khoi-cau.ts (mã tờ / qid / lớp), không tự đọc khối.
 */
export function khoiCanCo(khoiEm: Khoi | null | undefined, q: unknown): Khoi | null {
  return khoiEm ?? khoiCuaCau(q)
}
/**
 * Ứng viên ĐÚNG KHỐI `khoi` (chặt hơn `cauHopKhoi` hôm nay — luật thầy 05/10): mọi nguồn khối ĐỌC RA được của câu (mã tờ, qid, cột `lop` của
 * `de_kho`) đều bằng `khoi`, và có ít nhất một nguồn đọc ra. Câu không rõ khối / mâu thuẫn khối / khác khối ⇒ false. Thuần.
 */
export function dungKhoi(x: { maDe: string; qid: string }, lopTo: string | null | undefined, khoi: Khoi): boolean {
  const nguon = [khoiCuaMaDe(x.maDe), khoiCuaMaDe(x.qid), khoiCuaLop(lopTo)]
  return nguon.some((k) => k !== null) && nguon.every((k) => k === null || k === khoi)
}
// ---------------------------------------------------------------- ref phiên
/** Khoá "làm lại" trong ref câu của JSON phiên (máy chủ) — KHÔNG xuống máy em. */
export interface LamLaiRef { tc?: string; xt?: number[]; nv?: 1 }
/** Phần ghi vào ref phiên của một câu lượt. */
export const refLamLai = (x: { lamLai?: LamLaiRef }): LamLaiRef => (x.lamLai ? { ...x.lamLai } : {})

// ---------------------------------------------------------------- bậc 3: bản xáo
const CHU = ['A', 'B', 'C', 'D'] as const
const laHoanVi = (xt: unknown): xt is number[] => Array.isArray(xt) && xt.length === 4 && [0, 1, 2, 3].every((i) => xt.includes(i))

/** Lời giải nhắc thẳng chữ cái phương án / tên ý ("Chọn B", "đáp án C", dòng "A. …", "ý a", "a) đúng") thì KHÔNG xáo được (chữ sẽ lệch với thứ tự mới). */
export function loiGiaiXaoDuoc(solution: unknown, phan: 'I' | 'II'): boolean {
  let o: unknown = solution
  if (typeof o === 'string') { const s = o.trim(); if (!s) return true; if (s.startsWith('{')) { try { o = JSON.parse(s) } catch { /* chữ thô */ } } }
  if (o == null) return true
  let chu: string
  if (laObj(o)) {
    const { tung_pa: _a, tungPa: _b, tung_y: _c, tungY: _d, lyDo: _e, ...con } = o // các khối theo khoá được đổi tên khoá lúc xáo
    chu = JSON.stringify(con)
  } else chu = String(o)
  // Nhận cả chữ nằm trong chuỗi JSON ("…\"chot\":\"a) Đúng…") ⇒ mốc bắt đầu là "không phải chữ/số" chứ không chỉ đầu dòng. Nghi ngờ ⇒ không xáo (an toàn).
  if (phan === 'I') return !/(^|[^\p{L}\d])(đáp án|chọn|phương án)\s*:?\s*[ABCD](?![\p{L}\d])/iu.test(chu) && !/(^|[^\p{L}\d])[ABCD]\s*[.)]\s/u.test(chu)
  return !/(^|[^\p{L}\d])(ý|phát biểu|mệnh đề|nhận định)\s*\(?[abcd]\)?(?![\p{L}\d])/iu.test(chu) && !/(^|[^\p{L}\d])\(?[abcd]\)(?![\p{L}\d])/u.test(chu)
}

/**
 * Phương án / ý tự nhắc tới phương án / ý khác ("Cả A và B", "A, B, C đều đúng", "Tất cả các đáp án trên", "Cả hai ý a và b") thì KHÔNG xáo được:
 * đổi chỗ xong chữ cái / chữ "trên" sẽ trỏ sai. Nghi ngờ ⇒ không xáo (an toàn — rơi xuống nguyên văn).
 */
export function phanTuXaoDuoc(ds: readonly string[], phan: 'I' | 'II'): boolean {
  const ten = '(đáp án|phương án|ý|câu|mệnh đề|phát biểu|nhận định)'
  const viTri = new RegExp(`(tất cả\\s+(đều|các\\s+${ten})|cả\\s+(hai|ba|bốn|2|3|4)\\s+(đều|${ten})|${ten}\\s+(ở\\s+)?(trên|dưới)|không có\\s+${ten}\\s+nào)`, 'iu')
  // Phần I: chữ cái A–D đứng riêng ("Cả A và B"). Phần II: tên ý ("ý a", "phát biểu b)", "a) và b)") — nhãn "(a)" của phản ứng trong ĐỀ thì không tính.
  const chu = phan === 'I'
    ? /(^|[^\p{L}\d])[ABCD](?![\p{L}\d])/u
    : /(^|[^\p{L}\d])(ý|phát biểu|mệnh đề|nhận định)\s*\(?[abcd]\)?(?![\p{L}\d])|(^|[^\p{L}\d(])[abcd]\)\s*(và|,|hoặc)\s*\(?[abcd]\)/iu
  return ds.every((x) => !viTri.test(String(x ?? '')) && !chu.test(String(x ?? '')))
}

/** Câu xáo được: Phần I đủ 4 phương án + đáp án A–D; Phần II đủ 4 ý + đáp án Đ/S 4 ký tự; phương án/ý và lời giải không trỏ thẳng chữ cái / vị trí. Phần III: không. */
export function xaoDuoc(q: Pick<PrivateQuestion, 'phan' | 'choices' | 'ideas' | 'correct' | 'solution'>): boolean {
  const dapAn = String(q.correct ?? '').trim().toUpperCase()
  if (q.phan === 'I') return (q.choices?.length ?? 0) === 4 && /^[ABCD]$/.test(dapAn) && phanTuXaoDuoc(q.choices, 'I') && loiGiaiXaoDuoc(q.solution, 'I')
  if (q.phan === 'II') return (q.ideas?.length ?? 0) === 4 && /^[DS]{4}$/.test(dapAn) && phanTuXaoDuoc(q.ideas, 'II') && loiGiaiXaoDuoc(q.solution, 'II')
  return false
}

/**
 * Hoán vị tất định theo muối (xt[vị trí mới] = chỉ số gốc). Thử lần lượt 4 vòng xoay của hoán vị gốc, lấy vòng đầu tiên ĐỔI được thứ em có thể nhớ:
 * Phần I — chữ cái của đáp án đúng đổi (luôn có: chỉ một vòng giữ chỗ phương án đúng); Phần II — MẪU Đ/S đổi (luôn có khi mẫu không đồng nhất;
 * mẫu ĐĐĐĐ/SSSS thì chỉ đổi được thứ tự ý — luôn có vòng không phải hoán vị đồng nhất).
 */
export function hoanViXao(q: Pick<PrivateQuestion, 'phan' | 'correct'>, muoi: string): number[] {
  const goc = seededPermutation(4, hashSeed(muoi))
  const dapAn = String(q.correct ?? '').trim().toUpperCase()
  const dongNhat = (xt: number[]) => xt.every((v, i) => v === i)
  const doiDuoc = (xt: number[]): boolean => {
    if (dongNhat(xt)) return false
    if (q.phan === 'I') { const i = CHU.indexOf(dapAn as 'A'); return i < 0 || xt.indexOf(i) !== i }
    return /^(D{4}|S{4})$/.test(dapAn) || xt.map((i) => dapAn[i] ?? '').join('') !== dapAn
  }
  for (let k = 0; k < 4; k++) { const xt = goc.map((_, p) => goc[(p + k) % 4]!); if (doiDuoc(xt)) return xt }
  return [1, 2, 3, 0] // không thể xảy ra (xem trên) — vẫn trả một hoán vị khác đồng nhất
}

/** Bản xáo của câu (null nếu không xáo được): `xt` giữ ở máy chủ (JSON phiên); câu trả về dùng cho phản hồi `publicQuestion` và cho chấm. */
export function xaoCau(q: PrivateQuestion, muoi: string): { q: PrivateQuestion; xt: number[] } | null {
  if (!xaoDuoc(q)) return null
  const xt = hoanViXao(q, muoi)
  return { q: apHoanVi(q, xt), xt }
}

const doiViTriHinh = (hinhAnh: PrivateQuestion['hinhAnh'], tienTo: string, doi: (chu: string) => string) =>
  (hinhAnh ?? []).map((h) => (h.viTri.startsWith(tienTo) && h.viTri.length === tienTo.length + 1 ? { ...h, viTri: `${tienTo}${doi(h.viTri.slice(tienTo.length))}` } : h))

/** Đổi tên khoá lý do từng phương án / ý (tung_pa, tungPa, tung_y, tungY) và `lyDo[].khoa` theo thứ tự mới; giữ nguyên mọi phần khác và kiểu (chuỗi JSON vẫn là chuỗi). */
export function doiLoiGiai(solution: unknown, phan: 'I' | 'II', doi: (chu: string) => string): unknown {
  const laChuoi = typeof solution === 'string'
  let o: unknown = solution
  if (laChuoi) { const s = (solution as string).trim(); if (!s.startsWith('{')) return solution; try { o = JSON.parse(s) } catch { return solution } }
  if (!laObj(o)) return solution
  const khoa = phan === 'I' ? ['tung_pa', 'tungPa'] : ['tung_y', 'tungY']
  const mot = (chu: string): string => (/^[A-Da-d]$/.test(chu) ? doi(chu) : chu)
  const ra: Obj = { ...o }
  for (const k of khoa) if (laObj(o[k])) ra[k] = Object.fromEntries(Object.entries(o[k] as Obj).map(([c, v]) => [mot(c), v]))
  if (Array.isArray(o.lyDo)) ra.lyDo = o.lyDo.map((p) => (laObj(p) && typeof p.khoa === 'string' ? { ...p, khoa: mot(p.khoa) } : p))
  return laChuoi ? JSON.stringify(ra) : ra
}

/** Áp hoán vị `xt` (xt[vị trí mới] = chỉ số gốc) lên câu: phương án/ý + ảnh kèm + đáp án + lời giải theo khoá. Hoán vị hỏng ⇒ trả nguyên câu. */
export function apHoanVi(q: PrivateQuestion, xt: number[]): PrivateQuestion {
  if (!laHoanVi(xt)) return q
  // chữ cái gốc → chữ cái ở vị trí mới
  const chuMoi = (cu: string, hoa: boolean): string => {
    const i = CHU.indexOf(cu.toUpperCase() as 'A'), p = i < 0 ? -1 : xt.indexOf(i)
    return p < 0 ? cu : hoa ? CHU[p]! : CHU[p]!.toLowerCase()
  }
  if (q.phan === 'I') {
    return {
      ...q, choices: xt.map((i) => q.choices[i] ?? ''), correct: chuMoi(q.correct.trim(), true),
      ...(q.choiceImgs ? { choiceImgs: xt.map((i) => q.choiceImgs![i] ?? '') } : {}),
      hinhAnh: doiViTriHinh(q.hinhAnh, 'sau_pa_', (c) => chuMoi(c, true)), solution: doiLoiGiai(q.solution, 'I', (c) => chuMoi(c, true)),
    }
  }
  if (q.phan === 'II') {
    const dapAn = q.correct.trim().toUpperCase()
    return {
      ...q, ideas: xt.map((i) => q.ideas[i] ?? ''), correct: xt.map((i) => dapAn[i] ?? '').join(''),
      ...(q.ideaImgs ? { ideaImgs: xt.map((i) => q.ideaImgs![i] ?? '') } : {}),
      hinhAnh: doiViTriHinh(q.hinhAnh, 'sau_y_', (c) => chuMoi(c, false)), solution: doiLoiGiai(q.solution, 'II', (c) => chuMoi(c, false)),
    }
  }
  return q
}

/** Câu theo ref phiên: ref có hoán vị `xt` ⇒ bản xáo y hệt lúc phát (để chấm / phát lại / Đoàn hiển thị); không có ⇒ chính câu. */
export function apXaoTheoRef<Q extends PrivateQuestion>(q: Q, ref: Pick<LamLaiRef, 'xt'> | null | undefined): Q {
  return laHoanVi(ref?.xt) ? (apHoanVi(q, ref!.xt!) as Q) : q
}

/** Đáp án em gửi ở khung ĐÃ XÁO → khung GỐC (Phần I chữ cái, Phần II mẫu Đ/S) — để sổ, OMNI từng ý và "Câu đã làm" đọc đúng câu gốc. */
export function chonVeGoc(ref: Pick<LamLaiRef, 'xt'> | null | undefined, phan: string, chon: string): string {
  const xt = ref?.xt
  if (!laHoanVi(xt)) return chon
  const c = chon.trim().toUpperCase()
  if (phan === 'I' && /^[ABCD]$/.test(c)) return CHU[xt[CHU.indexOf(c as 'A')]!]!
  if (phan === 'II' && /^[DS]{4}$/.test(c)) { const goc = ['', '', '', '']; xt.forEach((i, p) => { goc[i] = c[p]! }); return goc.join('') }
  return chon
}

/** Phần "làm lại" của `raw` khi ghi sổ: đáp án em chọn (quy về khung gốc nếu xáo) + `tc` / `xt: 1` / `nv: 1`. Rỗng khi không có gì. */
export function rawLamLai(ref: LamLaiRef | null | undefined, phan: string, chon?: string): Record<string, unknown> {
  const ra: Record<string, unknown> = {}
  if (chon) ra.chon = chonVeGoc(ref, phan, chon)
  if (ref?.tc) ra.tc = ref.tc
  if (laHoanVi(ref?.xt)) ra.xt = 1
  if (ref?.nv) ra.nv = 1
  return ra
}
/** Khối `raw` cho `ghiSuKien`: gộp phần làm lại với phần OMNI; rỗng ⇒ KHÔNG có khoá `raw` (dòng sổ y hệt hôm nay). */
export function rawSo(lamLai: Record<string, unknown>, omni?: Record<string, unknown>): { raw?: Record<string, unknown> } {
  const r = { ...lamLai, ...(omni ?? {}) }
  return Object.keys(r).length ? { raw: r } : {}
}
