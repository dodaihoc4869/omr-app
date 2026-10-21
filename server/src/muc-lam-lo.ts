// MỨC LÀM THEO LÔ EM — bảng điểm danh của thầy (thầy 20/10: "phần chi tiết học sinh và bảng điểm danh hiển thị lại đẹp hơn, chi tiết, khoa học hơn"; bản vẽ 03 `docs/ban-ve-muc-lam-2010/`:
// mỗi dòng "Vừa điểm danh" thêm thanh Mức làm 14 ngày + "Mức làm 1–2: x/y lượt").
//
// `POST /gv/muc-lam-lo {sbds: string[] (≤ 40), den?: 'YYYY-MM-DD'}` — LỆNH THẦY, CHỈ ĐỌC (chạy trên `envDoc`, không ghi, không DDL). KHÔNG đụng `/gv/nhip-hoc` (lệnh nặng nhất, mốc tốc độ chỉ hạ).
// Chỉ đọc đúng các em CÓ MẶT đang hiện trên bảng (mặc định 6 em, mở hết ≤ 40): 14 ngày × ~40 lượt = vài trăm dòng, không quét cả trường và KHÔNG thêm bảng đệm / trigger nào.
//
// MỘT ĐỊNH NGHĨA MỨC LÀM: dòng sổ → mức đi qua đúng các hàm thuần của Lịch sử làm câu (`lich-su-lam-cau.ts`): `giaySoLuot` · `mucLamCuaDong` (dưới) — cùng `mucLamTuDong` · `tongMucLam`.
// Test `muc-lam-lo-2110.test.ts` ghim: cùng em, cùng cửa sổ ⇒ số của lô = số tính từ chính `lichSuLamCauCuaEm` (thầy bấm em ra Hồ sơ phải thấy cùng con số — "một con số").
//   · Lượt ca thi KHÔNG xếp mức (giây ca thi cũ có thể THIẾU) — vào "chưa có số đo", như Hồ sơ.
//   · Bỏ lượt "đọc lời giải" (`purpose = 'xem_loi_giai'`) và lượt còn giấu (`visibility = 'embargoed'`) — như Hồ sơ bản thầy.
//   · y trong "Mức làm 1–2: x/y" là `soDo` = lượt CÓ số đo; lượt chưa có số đo đi riêng (`chuaCoSoDo`) để giao diện nói thật (phần lớn lịch sử cũ vẫn chưa có số đo).
import type { Env } from './kieu'
import { giayDoCuaLuot, giayUocTinhGame } from './ai-sai-cau'
import { tachSongSinh } from './loi-hoc-luat'
import { docBetaCau } from './omni-d1'
import { docKichThuocCau, type KichThuocCau } from './cau-doc-giay'
import { tongMucLam, type MucLamLuot } from './muc-lam'
import { chuanMucDo, docDoMuc, gocCanBeta, mucLamTuDong, type DoMucLuot } from './muc-lam-so'
import { congNgay7, ngayVn7 } from './goi-bai-7-loi'

type Row = Record<string, unknown>
const str = (x: unknown): string => (x === null || x === undefined ? '' : String(x)).trim()

// ───────────────────────── PHẦN THUẦN DÙNG CHUNG (Lịch sử làm câu + lô em) ─────────────────────────

/** Một dòng sổ đã đọc xong các trường cần cho Mức làm. */
export interface DongMucSo {
  sbd: string
  nguon: string
  /** Mã phiên game / mã ca thi (`ma_nguon`). */
  maNguon: string
  luc: string
  /** Mã câu GỐC (đã bỏ hậu tố song sinh). */
  goc: string
  /** Mức độ chuẩn hoá ('biet' | 'hieu' | 'VD' | 'VDC' | ''). */
  mucDo: string
  ketQua: number | null
  /** Cột `giay` của sổ (thô). */
  giayCot: unknown
  /** Chỉ cần `ms` (giây đo thật) ở đây; dòng đầy đủ do nơi gọi giữ. */
  ms: unknown
  doMuc: DoMucLuot | null
}

/** Giây ĐO THẬT từng dòng (`giayDoCuaLuot`: cột sổ ⇒ `raw_json.ms`). */
export const doThatCacDong = (dong: readonly Pick<DongMucSo, 'giayCot' | 'ms'>[]): (number | null)[] => dong.map((d) => giayDoCuaLuot(d.giayCot, d.ms))

/** Các tập cần tra thêm (CÙNG đợt với mọi lượt đọc khác của nơi gọi): câu cần β · câu cần kích thước đề · lượt game thiếu giây (để ước tính). */
export function tapCanTraMucLam(dong: readonly DongMucSo[], doThat: readonly (number | null)[]): { gocMuc: string[]; gocCanKichThuoc: string[]; gameThieuGiay: { sbd: string; phien: string }[] } {
  return {
    // Mức làm 1–4: CHỈ lượt có số đo mới (đồng hồ mới + kích thước đề) cần β của câu.
    gocMuc: gocCanBeta(dong.map((d, i) => ({ doMuc: d.doMuc, giayDo: doThat[i] ?? null, goc: d.goc }))),
    // ĐO LẠI LƯỢT CŨ (21/10): kích thước đề của các câu mà lượt chưa có `doc`. CA THI KHÔNG ĐO LẠI (giây ca thi cũ có thể THIẾU, xếp mức từ đó sẽ sai chiều).
    gocCanKichThuoc: [...new Set(dong.filter((d, i) => !d.doMuc && d.goc && d.nguon !== 'thi' && (doThat[i] != null || d.nguon === 'game')).map((d) => d.goc))],
    gameThieuGiay: dong.filter((d, i) => d.nguon === 'game' && doThat[i] === null).map((d) => ({ sbd: d.sbd, phien: d.maNguon })),
  }
}

/**
 * GIÂY MỖI LƯỢT + LOẠI: 'do' = số đo (đồng hồ mới có `doc`) · 'cu' = đồng hồ cũ (cột `giay` / `raw_json.ms` / ca thi) · 'uoc' = ƯỚC TÍNH (mốc trả lời game). 'cu' và 'uoc' chỉ có thể DƯ.
 * KHÔNG ước tính từ khoảng cách giữa các dòng sổ (ôn lại / tự luyện / BTVN lỡ nộp cả lô cùng lúc). `giayCaThi` = giây chi tiết ca thi (chỉ Lịch sử làm câu đọc; lô em không cần: ca thi không xếp mức).
 */
export function giaySoLuot(d: Pick<DongMucSo, 'nguon' | 'maNguon' | 'luc' | 'doMuc'>, doThatI: number | null, uoc: ReadonlyMap<string, number>, giayCaThi: number | null = null): { g: number | null; loai: 'do' | 'cu' | 'uoc' | null } {
  if (doThatI != null) return { g: doThatI, loai: d.doMuc ? 'do' : 'cu' }
  if (d.nguon === 'thi' && giayCaThi !== null) return { g: giayCaThi, loai: 'cu' }
  if (d.nguon === 'game') { const u = uoc.get(`${d.maNguon}|${Date.parse(d.luc)}`); if (u !== undefined) return { g: u, loai: 'uoc' } }
  return { g: null, loai: null }
}

/** Mức làm của một lượt (thuần). Giây cũ / ước tính chỉ dùng cho lượt KHÔNG phải ca thi. */
export function mucLamCuaDong(d: DongMucSo, doThatI: number | null, gs: { g: number | null; loai: 'do' | 'cu' | 'uoc' | null }, beta: ReadonlyMap<string, number>, kichThuoc: ReadonlyMap<string, KichThuocCau>): MucLamLuot | null {
  return mucLamTuDong({
    doMuc: d.doMuc, giayDo: doThatI, goc: d.goc, mucDo: d.mucDo, dung: d.ketQua === null ? null : d.ketQua === 1,
    ...((gs.loai === 'cu' || gs.loai === 'uoc') && d.nguon !== 'thi' ? { giayCu: gs.g, loaiCu: gs.loai as 'cu' | 'uoc' } : {}),
  }, beta, kichThuoc)
}

// ───────────────────────── LỆNH THEO LÔ ─────────────────────────

export const TOI_DA_EM_MUC_LAM_LO = 40
/** Số ngày của thanh (đúng dải 14 ngày của Hồ sơ làm bài). */
export const SO_NGAY_MUC_LAM_LO = 14

/** Mức làm gộp của MỘT em trong cửa sổ. `m` = số lượt Mức 1 → 4. */
export interface MucLamEmLo {
  soDo: number
  chuaCoSoDo: number
  m: [number, number, number, number]
  /** Trong `soDo`: số lượt xếp từ giây cũ / ước tính (hiện "≈"). */
  soUocTinh: number
}
export type TraLoiMucLamLo = { ok: true; tu: string; den: string; em: Record<string, MucLamEmLo> } | { ok: false; error: string }

const NGAY_RE = /^\d{4}-\d{2}-\d{2}$/

function docDoc(raw: unknown): Row | null {
  if (raw === null || raw === undefined || raw === '') return null
  try {
    const j = JSON.parse(String(raw)) as unknown
    return j && typeof j === 'object' && !Array.isArray(j) ? (j as Row) : null
  } catch {
    return null
  }
}

/** Đệm ngắn theo isolate: mở / mở rộng danh sách liên tục không đọc lại cùng em trong 5 phút. Chỉ nhớ kết quả ĐỌC ĐƯỢC. */
const dem = new Map<string, { luc: number; v: MucLamEmLo }>()
export const HAN_DEM_MUC_LAM_LO_MS = 5 * 60_000
export function xoaDemMucLamLo(): void { dem.clear() }

/** Tính mức làm của các em (đã lọc, đã bỏ trùng) trong `[tu, den]`. Mỗi em một dòng kết quả (em không có lượt ⇒ toàn 0). Ném lỗi nếu không đọc được sổ. */
export async function mucLamCacEm(env: Env, sbds: readonly string[], tu: string, den: string): Promise<Map<string, MucLamEmLo>> {
  const r = await env.DB.prepare(
    `SELECT s.sbd, s.qid, s.nguon, s.ma_nguon, s.ket_qua, s.giay, s.luc, s.muc_do,
       CASE WHEN json_valid(s.raw_json) THEN json_extract(s.raw_json, '$.ms') END AS ms,
       CASE WHEN json_valid(s.raw_json) THEN json_extract(s.raw_json, '$.tc') END AS tc,
       CASE WHEN json_valid(s.raw_json) THEN json_extract(s.raw_json, '$.doc') END AS doc
     FROM su_kien_hoc s
     WHERE s.sbd IN (SELECT value FROM json_each(?1)) AND s.ngay_vn BETWEEN ?2 AND ?3
       AND COALESCE(s.purpose, '') <> 'xem_loi_giai' AND COALESCE(s.visibility, '') <> 'embargoed'`,
  ).bind(JSON.stringify(sbds), tu, den).all<Row>()
  const dong: DongMucSo[] = (r.results ?? []).map((x) => {
    const qid = str(x.qid)
    const tc = str(x.tc)
    const kq = x.ket_qua === null || x.ket_qua === undefined || x.ket_qua === '' ? null : Number(x.ket_qua)
    return {
      sbd: str(x.sbd),
      nguon: str(x.nguon),
      maNguon: str(x.ma_nguon),
      luc: str(x.luc),
      goc: tc ? tachSongSinh(tc).goc : tachSongSinh(qid).goc,
      mucDo: chuanMucDo(x.muc_do),
      ketQua: kq === null || !Number.isFinite(kq) ? null : kq,
      giayCot: x.giay,
      ms: x.ms,
      // `doc` là chuỗi JSON của đối tượng `raw_json.doc` (json_extract trả văn bản); `docDoMuc` đọc như `raw.doc`.
      doMuc: docDoMuc({ doc: docDoc(x.doc) }),
    }
  })
  const doThat = doThatCacDong(dong)
  const can = tapCanTraMucLam(dong, doThat)
  // MỘT đợt song song (β · kích thước đề · ước tính game) — như Lịch sử làm câu; lỗi từng khối ⇒ rỗng (lượt ấy vẫn "chưa có số đo", không hỏng cả lệnh).
  const [uoc, beta, kichThuoc] = await Promise.all([
    can.gameThieuGiay.length ? giayUocTinhGame(env, can.gameThieuGiay).catch(() => new Map<string, number>()) : Promise.resolve(new Map<string, number>()),
    can.gocMuc.length ? docBetaCau(env, can.gocMuc).catch(() => new Map<string, number>()) : Promise.resolve(new Map<string, number>()),
    can.gocCanKichThuoc.length ? docKichThuocCau(env, can.gocCanKichThuoc).catch(() => new Map<string, KichThuocCau>()) : Promise.resolve(new Map<string, KichThuocCau>()),
  ])
  const theoEm = new Map<string, { mucLam?: MucLamLuot | null; dung: boolean | null }[]>(sbds.map((s) => [s, []]))
  dong.forEach((d, i) => {
    const gs = giaySoLuot(d, doThat[i] ?? null, uoc)
    theoEm.get(d.sbd)?.push({ mucLam: mucLamCuaDong(d, doThat[i] ?? null, gs, beta, kichThuoc), dung: d.ketQua === null ? null : d.ketQua === 1 })
  })
  const ra = new Map<string, MucLamEmLo>()
  for (const [s, luot] of theoEm) {
    const t = tongMucLam(luot)
    ra.set(s, { soDo: t.soDo, chuaCoSoDo: t.chuaCoSoDo, m: [t.theoMuc[0].luot, t.theoMuc[1].luot, t.theoMuc[2].luot, t.theoMuc[3].luot], soUocTinh: t.soUocTinh })
  }
  return ra
}

/** `POST /gv/muc-lam-lo` — xem đầu tệp. */
export async function gvMucLamLo(env: Env, b: Row, nowMs = Date.now()): Promise<TraLoiMucLamLo> {
  const sbds = [...new Set((Array.isArray(b.sbds) ? b.sbds : []).map(str).filter((x) => x && x.length <= 40))].slice(0, TOI_DA_EM_MUC_LAM_LO)
  if (!sbds.length) return { ok: false, error: 'Thiếu danh sách em.' }
  const homNay = ngayVn7(nowMs)
  const denTho = str(b.den)
  const den = NGAY_RE.test(denTho) && denTho <= homNay ? denTho : homNay
  const tu = congNgay7(den, -(SO_NGAY_MUC_LAM_LO - 1))
  const khoa = (s: string) => `${s}|${tu}|${den}`
  const ra: Record<string, MucLamEmLo> = {}
  const can: string[] = []
  for (const s of sbds) {
    const c = dem.get(khoa(s))
    if (c && nowMs - c.luc < HAN_DEM_MUC_LAM_LO_MS && nowMs >= c.luc) ra[s] = c.v
    else can.push(s)
  }
  if (can.length) {
    let kq: Map<string, MucLamEmLo>
    try {
      kq = await mucLamCacEm(env, can, tu, den)
    } catch {
      return { ok: false, error: 'Không đọc được sổ học của các em.' }
    }
    if (dem.size > 400) dem.clear()
    for (const [s, v] of kq) { ra[s] = v; dem.set(khoa(s), { luc: nowMs, v }) }
  }
  return { ok: true, tu, den, em: ra }
}
