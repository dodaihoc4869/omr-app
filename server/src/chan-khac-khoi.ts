// CỔNG CUỐI CHẶN CÂU KHÁC KHỐI (luật thầy 05/10/2026, mục D — điều phối chốt). Một định nghĩa khối: `src/lib/khoi-cau.ts`.
//
// LỆNH THẦY 05/10 (nguyên văn):
//   "rất nhiều cấu thuộc lớp 10 nhưng bị rút nhầm sang lớp 11, bạn phải chặn chuẩn 100% không được rút nhầm kho khác khối cho tôi nhé"
//   "mục câu cần chữa của khối 11 khi chiếu lên bảng thì rất nhiều câu của lớp 10 bị chèn vào, bạn xem mọi chỗ chặn triệt để rút nhầm câu của kho khối khác"
//
// HAI CỔNG, gọi ở BƯỚC CUỐI (tầng trên có quên lọc thì cổng vẫn chặn):
//   · `chanKhacKhoiEm`  (luật A) — mọi kênh rút câu TỰ ĐỘNG cho EM, ngay trước khi lưu phiên/trả câu: chỉ câu ĐÚNG khối em; khác khối, không rõ khối,
//     nguồn khối mâu thuẫn ⇒ CHẶN; em không rõ khối ⇒ chặn hết, trừ câu nơi gọi đánh dấu là THẦY GIAO TRỰC TIẾP cho em (`thayGiao`).
//   · `chanKhacKhoiLop` (luật B) — mọi danh sách chữa bài / chiếu lên bảng do MÁY dựng cho một LỚP / CHIẾN DỊCH, ngay trước khi trả cho thầy:
//     chặn câu KHÁC khối lớp và câu MÂU THUẪN khối (có bằng chứng là khối khác). Câu không đọc ra khối nào (không có bằng chứng khác khối) và lớp chưa rõ
//     khối ⇒ GIỮ (danh sách của thầy; kênh tự động đã không phát câu ấy cho em đã rõ khối) — có đếm để đo.
//   · `chanMetaKhacKhoi` — Hoá 2.0: xoá khỏi siêu dữ liệu hồ sơ (`HoSo2.meta`) câu không đúng khối em ⇒ kế hoạch ngày, kế hoạch đã chốt (thay câu hỏng),
//     Đảo/Đoàn/Bi-a, "Câu đã làm", báo cáo phụ huynh, lỗi đến hạn… đều coi câu ấy như đã rút khỏi kho của RIÊNG em.
// KHÔNG gọi cổng cho phần THẦY TỰ CHỌN (tick bài, chọn tờ, dựng ca thi, Gọi lên bảng chọn tay) — luật C.
//
// ĐO: mỗi lần cổng chặn ≥ 1 câu ⇒ một dòng console `[chan-khac-khoi]` (kênh, vai, khối đích, số giữ, số chặn theo lý do: khác khối · không rõ · mâu thuẫn ·
// em/lớp không rõ · nghi đáp án). Đếm cộng dồn trong isolate: `demChanKhoi()` (test đọc), `xoaDemChanKhoi()`.
// 06/10 CÂU NGHI SAI ĐÁP ÁN (làn A đợt 2): cổng EM (luật A: `chanKhacKhoiEm` / `TheoEm` / `Dong`) loại thêm câu đang 'nghi' trong `cau_nghi_dap_an` (tu-hoan-thien.ts) —
// em không được làm (và bị chấm sai) câu mà đáp án kho đang bị nghi. Lý do mới `nghi_dap_an` đếm cùng bảng đếm, ghi console như mọi lý do. Chỉ MỘT truy vấn / 60 giây / isolate
// (`docCauNghiDem`). KHÔNG lọc ở: cổng LỚP (luật B — danh sách của thầy), `chanMetaKhacKhoi` (siêu dữ liệu hồ sơ: "Câu đã làm" phải giữ câu em đã làm), nơi thầy TỰ CHỌN (Gọi lên bảng,
// dựng ca thi — ca thi đã có `/ca/cau-nghi-dap-an`), kênh `luot_cu` (resume lượt ĐÃ phát — `KENH_GIU_CAU_NGHI`).
// Đi kèm ở KẾ HOẠCH: srs2-d1.ts `tamHoanCauKhoa` bỏ câu nghi khỏi phần CÒN LẠI của kế hoạch ngày (như câu ca bảo vệ) — không thì em kẹt "còn N câu", rương không mở.
// TỐN D1: khối em truyền sẵn ⇒ 0 truy vấn; chỉ có SBD ⇒ 1 truy vấn `hoc_sinh`. Làm giàu nguồn khối từ D1 (`de_kho.lop`, `cau_hoi.lop/chuyen_de`,
// `game_v2_question.ma_de/dang`) — MỘT truy vấn — mặc định chỉ cho câu tự thân không đọc ra khối (hiếm: kho thật 28/15 359 câu, tờ `100`).
import type { Env } from './kieu'
import { khoiCuaEm, khoiCuaLop, phanTichKhoiCau, type Khoi, type LyDoChanKhoi } from '../../src/lib/khoi-cau'
import { dangKyXoaDem } from './dem-chung'
import { dbGoc } from './cau-hinh-dem'

type Row = Record<string, unknown>
const str = (v: unknown): string => (v == null ? '' : String(v))
const laKhoi = (n: unknown): n is Khoi => n === 10 || n === 11 || n === 12
/**
 * LUẬT B — câu KHÔNG đọc ra khối nào (không có bằng chứng là khối khác) trong danh sách của lớp: GIỮ (true) hay CHẶN (false).
 * Điều phối 05/10 yêu cầu danh sách lớp "0 câu khác khối"; câu không rõ khối trong kho thật ≈ 0 (đo 21/09: 28/15 359 câu, tờ `100` — `de_kho.lop` = 12 cứu được)
 * nên mặc định GIỮ để không giấu câu thầy tự chọn có mã lạ. Đổi một dòng này thành `false` ⇒ danh sách lớp chặn cả câu không rõ khối (như luật A).
 */
export const B_GIU_KHONG_RO = true

// ---------------------------------------------------------------- đếm để đo
export type VaiCong = 'em' | 'lop'
/** `giu` = số phần tử cho qua; năm lý do (bốn lý do khối + `nghi_dap_an`) = số phần tử BỊ CHẶN; `qua_khong_ro` = cho qua dù không rõ khối (luật B / lớp chưa rõ khối); `qua_thay_giao` = cho qua vì thầy giao trực tiếp (em chưa rõ khối). */
export interface DemCong { giu: number; khac_khoi: number; khong_ro: number; mau_thuan: number; em_khong_ro: number; qua_khong_ro: number; qua_thay_giao: number; nghi_dap_an: number }
const DEM = new Map<string, DemCong>()
const demMoi = (): DemCong => ({ giu: 0, khac_khoi: 0, khong_ro: 0, mau_thuan: 0, em_khong_ro: 0, qua_khong_ro: 0, qua_thay_giao: 0, nghi_dap_an: 0 })
/** Ảnh chụp bộ đếm theo `vai:kênh` (cộng dồn trong isolate). */
export function demChanKhoi(): Record<string, DemCong> {
  return Object.fromEntries([...DEM].map(([k, v]) => [k, { ...v }]))
}
export function xoaDemChanKhoi(): void { DEM.clear() }
function ghiDem(vai: VaiCong, kenh: string, khoiDich: Khoi | readonly Khoi[] | null, d: DemCong): void {
  const k = `${vai}:${kenh}`
  const c = DEM.get(k) ?? demMoi()
  for (const x of Object.keys(d) as (keyof DemCong)[]) c[x] += d[x]
  DEM.set(k, c)
  const chan = d.khac_khoi + d.khong_ro + d.mau_thuan + d.em_khong_ro + d.nghi_dap_an
  if (chan > 0 || d.qua_khong_ro > 0) console.log('[chan-khac-khoi]', JSON.stringify({ kenh, vai, khoi: khoiDich, ...d }))
}

// ---------------------------------------------------------------- khối em / lớp
/** Khối của nhiều em (`hoc_sinh.lop` + `ten_lop`, luật `khoiCuaEm`). MỘT truy vấn; lỗi đọc ⇒ em vắng (không rõ khối ⇒ cổng chặn). */
export async function docKhoiCacEmCong(env: Env, sbds: readonly string[]): Promise<Map<string, Khoi | null>> {
  const ra = new Map<string, Khoi | null>()
  const ds = [...new Set(sbds.map(str).filter(Boolean))]
  if (!ds.length) return ra
  const doc = (cot: string) => env.DB.prepare(`SELECT sbd, ${cot} FROM hoc_sinh WHERE sbd IN (SELECT value FROM json_each(?))`).bind(JSON.stringify(ds)).all<Row>().then((r) => r.results ?? [])
  const rows = await doc('lop, ten_lop').catch(() => doc('lop')).catch(() => [] as Row[])
  for (const r of rows) ra.set(str(r.sbd), khoiCuaEm({ lop: r.lop, tenLop: r.ten_lop }))
  return ra
}
export async function docKhoiEmCong(env: Env, sbd: string): Promise<Khoi | null> {
  return (await docKhoiCacEmCong(env, [sbd])).get(sbd) ?? null
}
/** Khối CHUNG của một nhóm em (đội Đoàn Hộ Tống: câu chung hiện cho CẢ đội): mọi em rõ khối và CÙNG một khối ⇒ khối ấy; lẫn khối / có em chưa rõ ⇒ null (không có câu chung). */
export async function docKhoiChungCacEm(env: Env, sbds: readonly string[]): Promise<Khoi | null> {
  const ds = [...new Set(sbds.map(str).filter(Boolean))]
  if (!ds.length) return null
  const m = await docKhoiCacEmCong(env, ds).catch(() => new Map<string, Khoi | null>())
  let k: Khoi | null = null
  for (const s of ds) {
    const x = m.get(s) ?? null
    if (!x || (k !== null && x !== k)) return null
    k = x
  }
  return k
}
/**
 * KHỐI ĐÍCH của một LỚP / CHIẾN DỊCH (luật B): khối đọc từ tên lớp (`lop` của chiến dịch / ca, "11 - Tinh Hoa", "12A1"); không ra ⇒ các khối RÕ của
 * các em trong danh sách (một khối ⇒ khối ấy; lớp gom nhiều khối ⇒ câu đúng khối của BẤT KỲ em nào). Không có gì rõ ⇒ [] (lớp chưa rõ khối).
 */
export async function docKhoiLopCong(env: Env, lop: { lop?: unknown; sbd?: readonly string[]; khoi?: Khoi | null }): Promise<Khoi[]> {
  if (laKhoi(lop.khoi)) return [lop.khoi]
  const k = khoiCuaLop(lop.lop)
  if (k) return [k]
  if (!lop.sbd?.length) return []
  const s = new Set<Khoi>()
  for (const x of (await docKhoiCacEmCong(env, lop.sbd).catch(() => new Map<string, Khoi | null>())).values()) if (x) s.add(x)
  return [...s].sort()
}

// ---------------------------------------------------------------- nguồn khối bổ sung từ D1
/** Bỏ đuôi câu song sinh "~ss0" — song sinh theo khối câu gốc. */
const qidGocKhoi = (q: unknown): string => str(q).split('~')[0]!
/**
 * Mọi dòng mô tả câu trong D1 (MỘT truy vấn, ≤ 2 nhánh UNION): `game_v2_question` (ma_de, dang, `lop`/`khoi` trong JSON câu) + `de_kho.lop` của tờ, và `cau_hoi` (ma_de, lop, chuyen_de).
 * Một qid ở nhiều tờ ⇒ nhiều dòng (tờ khác khối ⇒ mâu thuẫn). Lỗi đọc ⇒ rỗng (chỉ xét nguồn tự thân của câu).
 */
export async function docNguonKhoiD1(env: Env, qids: readonly string[]): Promise<Map<string, Row[]>> {
  const ra = new Map<string, Row[]>()
  const ds = [...new Set(qids.map(qidGocKhoi).filter(Boolean))]
  if (!ds.length) return ra
  const j = JSON.stringify(ds)
  // `khoi` = trường `lop`/`khoi` ghi THẲNG trong JSON câu của chỉ mục game (cách sửa tờ lạc khối đã ghi ở docs/khoi-cau-khong-doc-ra-2109.md, mục 2).
  const rows = await env.DB.prepare(`SELECT q.qid AS qid, q.ma_de AS ma_de, q.dang AS dang, d.lop AS lop, NULL AS chuyen_de,
        COALESCE(json_extract(q.json, '$.lop'), json_extract(q.json, '$.khoi')) AS khoi
      FROM game_v2_question q LEFT JOIN de_kho d ON d.ma_de = q.ma_de WHERE q.qid IN (SELECT value FROM json_each(?)) AND json_valid(q.json)
    UNION ALL
    SELECT c.qid, c.ma_de, NULL, c.lop, c.chuyen_de, NULL FROM cau_hoi c WHERE c.qid IN (SELECT value FROM json_each(?))`).bind(j, j).all<Row>()
    .then((r) => r.results ?? []).catch(() => [] as Row[])
  for (const r of rows) {
    const q = str(r.qid)
    let a = ra.get(q)
    if (!a) { a = []; ra.set(q, a) }
    a.push(r)
  }
  return ra
}

// ---------------------------------------------------------------- lõi cổng (thuần)
/** Lý do chặn một câu với TẬP khối đích, gộp nguồn tự thân + các dòng D1 (`them`). `null` = cho qua. */
export function lyDoChanTap(khoiDich: readonly Khoi[], cau: unknown, them: readonly Row[] = []): LyDoChanKhoi | null {
  if (!khoiDich.length) return 'em_khong_ro'
  const s = new Set<Khoi>(phanTichKhoiCau(cau).cacKhoi)
  for (const r of them) for (const k of phanTichKhoiCau(r).cacKhoi) s.add(k)
  if (!s.size) return 'khong_ro'
  if (s.size > 1) return 'mau_thuan'
  return khoiDich.includes([...s][0]!) ? null : 'khac_khoi'
}
const qidCua = (c: unknown): string => (typeof c === 'string' ? c : c && typeof c === 'object' ? str((c as Row).qid ?? (c as Row).id) : '')

/** Em của cổng A: SBD (đọc khối 1 truy vấn), hoặc khối đã đọc, hoặc `meta` của hồ sơ Hoá 2.0 đã qua `chanMetaKhacKhoi` (0 truy vấn). */
export interface EmCong { sbd?: string; khoiEm?: Khoi | null; meta?: object }
interface DaLoc { khoi: Khoi | null; thayGiao: Set<string> }
/** Hồ sơ đã lọc: `meta` → khối em đã dùng + các câu giữ vì thầy giao trực tiếp (em chưa rõ khối). */
const DA_LOC = new WeakMap<object, DaLoc>()

export interface TuyChonCong<T> {
  /** Lấy mô tả câu từ phần tử (mặc định chính phần tử: chuỗi qid hoặc đối tượng câu). */
  cauCua?: (x: T) => unknown
  /** Luật A, em KHÔNG rõ khối: phần tử là nội dung THẦY GIAO TRỰC TIẾP cho em (chiến dịch thầy giao em…) ⇒ cho qua. Em rõ khối ⇒ không dùng. */
  thayGiao?: (x: T) => boolean
  /** Làm giàu nguồn khối từ D1: 'khi_khong_ro' (mặc định cổng em — chỉ câu tự thân không đọc ra khối), 'luon' (mặc định cổng lớp), 'khong'. */
  lamGiau?: 'luon' | 'khi_khong_ro' | 'khong'
  /** CỔNG EM: tập qid câu đang NGHI mà nơi gọi ĐÃ đọc sẵn bằng một truy vấn của riêng nó (thêm cột, không thêm truy vấn — giữ ngân sách D1 của lệnh, vd `/hs/cau-theo-qid`). Vắng ⇒ cổng tự đọc (`docCauNghiDem`, đệm 60 s). */
  nghiSan?: ReadonlySet<string>
}

/** Cổng THUẦN (không IO): giữ phần tử ĐÚNG khối, GIỮ NGUYÊN thứ tự; đếm + ghi console. `vai = 'lop'` ⇒ luật B (giữ câu không rõ khối; lớp chưa rõ khối ⇒ giữ hết). */
export function congKhoi<T>(vai: VaiCong, kenh: string, khoiDich: Khoi | readonly Khoi[] | null | undefined, ds: readonly T[], tuyChon: TuyChonCong<T> = {}, them?: ReadonlyMap<string, Row[]>, nghi?: ReadonlySet<string>): T[] {
  if (!Array.isArray(ds) || !ds.length) return []
  const tap: Khoi[] = Array.isArray(khoiDich) ? (khoiDich as Khoi[]).filter(laKhoi) : laKhoi(khoiDich) ? [khoiDich] : []
  const cauCua = tuyChon.cauCua ?? ((x: T) => x as unknown)
  const d = demMoi()
  const giu: T[] = []
  for (const x of ds) {
    const c = cauCua(x)
    const ly = lyDoChanTap(tap, c, them?.get(qidGocKhoi(qidCua(c))) ?? [])
    const thayGiao = vai === 'em' && ly === 'em_khong_ro' && !!tuyChon.thayGiao?.(x)
    const quaKhongRo = vai === 'lop' && (ly === 'em_khong_ro' || (ly === 'khong_ro' && B_GIU_KHONG_RO))
    // 06/10: câu đang NGHI sai đáp án (cổng EM — `nghi` chỉ truyền cho vai 'em'): câu qua được cổng khối (kể cả câu thầy giao khi em chưa rõ khối) vẫn bị loại.
    if (nghi?.size && (ly === null || thayGiao) && nghi.has(qidGocKhoi(qidCua(c)))) { d.nghi_dap_an++; continue }
    if (ly === null || thayGiao || quaKhongRo) {
      giu.push(x)
      d.giu++
      if (thayGiao) d.qua_thay_giao++
      if (quaKhongRo) d.qua_khong_ro++
    } else d[ly]++
  }
  ghiDem(vai, kenh, tap.length === 1 ? tap[0]! : tap, d)
  return giu
}

// ---------------------------------------------------------------- câu NGHI sai đáp án (06/10)
/** Tuổi thọ đệm danh sách câu nghi trong isolate (thầy chốt câu nghi ⇒ em thấy lại câu trong ≤ 60 giây). */
export const HAN_DEM_CAU_NGHI_MS = 60_000
interface DemNghi { at: number; p: Promise<ReadonlySet<string>> }
let demNghi = new WeakMap<object, DemNghi>()
/** Xoá đệm danh sách câu nghi (test / sau khi thầy chốt câu nghi ở cùng isolate). `xoaMoiDem()` (dem-chung.ts) gọi hàm này. */
export function xoaDemCauNghi(): void { demNghi = new WeakMap() }
/** Kênh KHÔNG lọc câu nghi: lượt ĐÃ phát (resume) — câu đã qua cổng lúc phát; thêm một truy vấn ở mỗi lần mở app không đáng (đáp án chỉ bị nghi sau khi tự hoàn thiện đêm thứ Hai chạy). */
export const KENH_GIU_CAU_NGHI: ReadonlySet<string> = new Set(['luot_cu'])
dangKyXoaDem(xoaDemCauNghi)
const RONG: ReadonlySet<string> = new Set()
/**
 * Tập qid câu đang 'nghi' trong `cau_nghi_dap_an` (tu-hoan-thien.ts `dsCauNghi`; ở đây đọc THẲNG, không tạo bảng — đường đọc nóng không được ghi DDL). Đệm HAN_DEM_CAU_NGHI_MS theo D1 gốc;
 * lượt gọi chồng nhau dùng chung MỘT truy vấn. Bảng chưa có / lỗi đọc ⇒ tập rỗng (không chặn thêm câu nào — "không biết ⇒ không kết tội"), cũng đệm cùng hạn.
 */
export function docCauNghiDem(env: Env, nowMs: number = Date.now()): Promise<ReadonlySet<string>> {
  const k = dbGoc(env.DB as unknown as object)
  const c = demNghi.get(k)
  if (c && nowMs - c.at >= 0 && nowMs - c.at < HAN_DEM_CAU_NGHI_MS) return c.p
  const p = Promise.resolve().then(() => env.DB.prepare("SELECT qid FROM cau_nghi_dap_an WHERE trang_thai = 'nghi'").all<Row>())
    .then((r) => new Set((r.results ?? []).map((x) => qidGocKhoi(x.qid)).filter(Boolean)) as ReadonlySet<string>)
    .catch(() => RONG)
  demNghi.set(k, { at: nowMs, p })
  return p
}
/**
 * Đổi chuỗi JSON `["qid", …]` (cột `json_group_array(qid)` nơi gọi gộp vào truy vấn có sẵn) thành tập qid GỐC câu nghi — cùng phép chuẩn hoá với `docCauNghiDem`.
 * Không phải chuỗi JSON mảng ⇒ `undefined` (nơi gọi không đọc được ⇒ cổng tự đọc như thường, KHÔNG coi là "không có câu nghi nào").
 */
export function tapCauNghiTuJson(j: unknown): ReadonlySet<string> | undefined {
  if (typeof j !== 'string') return undefined
  try {
    const m = JSON.parse(j) as unknown
    return Array.isArray(m) ? new Set(m.filter((x): x is string => typeof x === 'string').map((x) => qidGocKhoi(x)).filter(Boolean)) : undefined
  } catch {
    return undefined
  }
}
/** Khối em mà `chanMetaKhacKhoi` đã ghi cho `meta` của hồ sơ này (cùng hồ sơ ⇒ 0 truy vấn); chưa lọc lần nào ⇒ undefined. */
export function khoiDaLocCua(meta: object): Khoi | null | undefined {
  return DA_LOC.get(meta)?.khoi
}

async function nguonThem<T>(env: Env, ds: readonly T[], tap: readonly Khoi[], tuyChon: TuyChonCong<T>, macDinh: 'luon' | 'khi_khong_ro'): Promise<Map<string, Row[]> | undefined> {
  const che = tuyChon.lamGiau ?? macDinh
  if (che === 'khong' || !tap.length) return undefined
  const cauCua = tuyChon.cauCua ?? ((x: T) => x as unknown)
  const can = ds.map(cauCua).filter((c) => che === 'luon' || phanTichKhoiCau(c).tinhTrang === 'khong_ro').map(qidCua).filter(Boolean)
  return can.length ? docNguonKhoiD1(env, can) : undefined
}

/**
 * CỔNG EM (luật A) — gọi NGAY TRƯỚC khi lưu phiên / trả câu cho em. `em` = SBD (đọc khối 1 truy vấn) hoặc `{ khoiEm }` đã đọc (0 truy vấn).
 * Trả các phần tử ĐÚNG khối em, giữ thứ tự. Lỗi đọc ⇒ không rõ khối ⇒ chặn (thà thiếu câu còn hơn lọt câu khối khác).
 */
export async function chanKhacKhoiEm<T>(env: Env, kenh: string, em: string | EmCong, ds: readonly T[], tuyChon: TuyChonCong<T> = {}): Promise<T[]> {
  if (!Array.isArray(ds) || !ds.length) return []
  const e: EmCong = typeof em === 'string' ? { sbd: em } : em
  const daLoc = e.meta ? DA_LOC.get(e.meta) : undefined
  const khoiEm = e.khoiEm !== undefined ? e.khoiEm : daLoc ? daLoc.khoi : e.sbd ? await docKhoiEmCong(env, e.sbd).catch(() => null) : null
  const tap = laKhoi(khoiEm) ? [khoiEm] : []
  const cauCua = tuyChon.cauCua ?? ((x: T) => x as unknown)
  // Hồ sơ Hoá 2.0 đã lọc (`chanMetaKhacKhoi`): câu được giữ vì thầy giao trực tiếp ở bước hồ sơ cũng được giữ ở cổng cuối (em chưa rõ khối).
  const tc: TuyChonCong<T> = !tuyChon.thayGiao && daLoc?.thayGiao.size ? { ...tuyChon, thayGiao: (x) => daLoc.thayGiao.has(qidGocKhoi(qidCua(cauCua(x)))) } : tuyChon
  const [them, nghi] = await Promise.all([nguonThem(env, ds, tap, tc, 'khi_khong_ro'), tap.length && !KENH_GIU_CAU_NGHI.has(kenh) ? (tuyChon.nghiSan ?? docCauNghiDem(env)) : Promise.resolve(RONG)]) // câu nghi: nơi gọi đã đọc sẵn (`nghiSan`) hoặc cùng đợt với nguồn khối (không thêm đợt nối tiếp)
  return congKhoi('em', kenh, tap, ds, tc, them, nghi)
}

/**
 * CỔNG LỚP (luật B) — gọi NGAY TRƯỚC khi trả danh sách chữa bài / chiếu lên bảng cho thầy. `lop` = { lop (tên lớp), sbd (em của danh sách), khoi }.
 * Chặn câu khác khối lớp + câu mâu thuẫn khối; giữ câu không rõ khối; lớp chưa rõ khối ⇒ giữ hết (đếm để đo).
 */
export async function chanKhacKhoiLop<T>(env: Env, kenh: string, lop: { lop?: unknown; sbd?: readonly string[]; khoi?: Khoi | null }, ds: readonly T[], tuyChon: TuyChonCong<T> = {}): Promise<T[]> {
  if (!Array.isArray(ds) || !ds.length) return []
  const tap = await docKhoiLopCong(env, lop).catch(() => [] as Khoi[])
  return congKhoi('lop', kenh, tap, ds, tuyChon, await nguonThem(env, ds, tap, tuyChon, 'luon'))
}

/**
 * CỔNG EM cho NHIỀU EM một lúc (luật A): `ds` = sbd → danh sách câu của em ấy. MỘT truy vấn khối cho cả nhóm + tối đa MỘT truy vấn làm giàu.
 * Trả map mới, mỗi em chỉ còn câu ĐÚNG khối em ấy (em không rõ khối ⇒ rỗng).
 */
export async function chanKhacKhoiTheoEm<T>(env: Env, kenh: string, ds: ReadonlyMap<string, readonly T[]>, tuyChon: TuyChonCong<T> = {}): Promise<Map<string, T[]>> {
  const ra = new Map<string, T[]>()
  if (!ds.size) return ra
  if (![...ds.values()].some((x) => x.length)) { for (const s of ds.keys()) ra.set(s, []); return ra } // không em nào có câu ⇒ 0 truy vấn
  const khoi = await docKhoiCacEmCong(env, [...ds.keys()]).catch(() => new Map<string, Khoi | null>())
  const tatCa = [...ds.values()].flat()
  const coKhoi = [...khoi.values()].filter(laKhoi)
  const [them, nghi] = await Promise.all([nguonThem(env, tatCa, [...new Set(coKhoi)], tuyChon, 'khi_khong_ro'), coKhoi.length ? docCauNghiDem(env) : Promise.resolve(RONG)])
  for (const [sbd, cua] of ds) {
    const k = khoi.get(sbd) ?? null
    ra.set(sbd, congKhoi('em', kenh, k ? [k] : [], cua, tuyChon, them, nghi))
  }
  return ra
}

/**
 * CỔNG EM cho DÒNG nhiều em (mỗi dòng có `sbd` + `qid`, ví dụ hàng ôn của kế hoạch ngày cũ): khối từng em ĐÃ ĐỌC SẴN (`khoiEm`: sbd → khối) — 0 truy vấn khối;
 * tối đa MỘT truy vấn làm giàu cho câu tự thân không rõ khối. Trả các dòng ĐÚNG khối em của dòng, GIỮ NGUYÊN thứ tự.
 */
export async function chanKhacKhoiDong<T extends { sbd?: unknown; qid?: unknown }>(env: Env, kenh: string, khoiEm: ReadonlyMap<string, Khoi | null>, ds: readonly T[]): Promise<T[]> {
  if (!Array.isArray(ds) || !ds.length) return []
  const theoEm = new Map<string, T[]>()
  for (const x of ds) { const s = str(x.sbd); let a = theoEm.get(s); if (!a) { a = []; theoEm.set(s, a) } a.push(x) }
  const tuyChon: TuyChonCong<T> = { cauCua: (x) => str(x.qid) }
  const tapKhoi = [...new Set([...khoiEm.values()].filter(laKhoi))]
  const [them, nghi] = await Promise.all([nguonThem(env, ds, tapKhoi, tuyChon, 'khi_khong_ro'), tapKhoi.length ? docCauNghiDem(env) : Promise.resolve(RONG)])
  const giu = new Set<T>()
  for (const [s, cua] of theoEm) {
    const k = khoiEm.get(s) ?? null
    for (const x of congKhoi('em', kenh, k ? [k] : [], cua, tuyChon, them, nghi)) giu.add(x)
  }
  return ds.filter((x) => giu.has(x))
}

/** Khối ĐÍCH của một danh sách lớp KHÔNG cần đọc D1 (luật B): tên lớp đọc ra khối ⇒ [khối]; không ⇒ các khối rõ của các em đã biết. */
export function khoiDichLop(lop: unknown, khoiCacEm: Iterable<Khoi | null | undefined> = []): Khoi[] {
  const k = khoiCuaLop(lop)
  if (k) return [k]
  return [...new Set([...khoiCacEm].filter(laKhoi))].sort()
}

/**
 * HOÁ 2.0 — xoá khỏi `meta` (qid → siêu dữ liệu câu: maDe, qid, dang…) mọi câu không ĐÚNG khối em (luật A). `thayGiao(qid)`: em KHÔNG rõ khối ⇒ vẫn giữ
 * câu thầy giao trực tiếp (câu của chiến dịch em được giao). Sửa `meta` tại chỗ; trả số câu đã xoá.
 */
export async function chanMetaKhacKhoi(env: Env, kenh: string, khoiEm: Khoi | null | undefined, meta: Map<string, unknown>, thayGiao?: (qid: string) => boolean): Promise<number> {
  const k = laKhoi(khoiEm) ? khoiEm : null
  const rec: DaLoc = DA_LOC.get(meta) ?? { khoi: k, thayGiao: new Set() }
  rec.khoi = k
  DA_LOC.set(meta, rec)
  if (!meta.size) return 0
  const ds = [...meta.keys()]
  const tap = k ? [k] : []
  const tuyChon: TuyChonCong<string> = { cauCua: (q) => meta.get(q) ?? q, ...(thayGiao ? { thayGiao } : {}) }
  const giu = new Set(congKhoi('em', kenh, tap, ds, tuyChon, await nguonThem(env, ds, tap, tuyChon, 'khi_khong_ro')))
  let bo = 0
  for (const q of ds) {
    if (!giu.has(q)) { meta.delete(q); bo++ } else if (!k) rec.thayGiao.add(q)
  }
  return bo
}
