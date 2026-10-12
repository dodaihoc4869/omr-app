// EM CỦA LỚP LÀM SAI TỪNG CÂU — THEO LÔ (thầy 12/10: "chữa câu khó và tính toán cũng phải chiếu lên bảng theo chuẩn" ⇒ mỗi câu của đề gọi được một em
// làm SAI câu ấy lên bảng; app thầy cần danh sách ứng viên cho CẢ ĐỀ trong một lần gọi — `/gv/ai-sai-cau` chỉ nhận MỘT câu và không lọc theo lớp).
//
// `POST /gv/ai-sai-nhieu-cau {sbd: string[] (≤ 200), qids: string[] (≤ 120)}` — LỆNH THẦY, CHỈ ĐỌC sổ `su_kien_hoc` (sau cổng `laThay`). Không ghi gì,
// không đổi bảng nào.
//   · Lượt TỰ LÀM có kết quả của các em trong `sbd`, ở câu gốc lẫn câu song sinh (`<qid>~ss0..3`, `cacQidSongSinh`) — cùng phạm vi nút X "Ai sai";
//     bỏ sự kiện "đọc lời giải" (`purpose = 'xem_loi_giai'`) và sự kiện còn CHE (`visibility = 'embargoed'`, như dải thống kê lớp). Ca thi bỏ trống
//     (`ket_qua` NULL, nguồn `thi`) tính là sai — đúng luật của `/gv/ai-sai-cau`.
//   · Mỗi (em, câu gốc): LẦN LÀM MỚI NHẤT sai ⇒ em là ỨNG VIÊN gọi lên bảng (em đã làm lại đúng thì thôi — khớp số "x/y em sai" của lớp).
//     Kèm số lần sai, lúc sai gần nhất, số giây của lần sai gần nhất (cùng thứ tự của `/gv/ai-sai-cau`: cột `giay` ⇒ `raw_json.ms` ⇒ ca thi
//     `chi_tiet_cau.giay` ⇒ lượt game ƯỚC TÍNH `uocTinh` ⇒ null — không bịa).
//   · `lam` = số em trong lớp đã làm câu (có kết quả). Câu không em nào làm ⇒ vắng khỏi `cau`.
// Trả `{ ok, cau: { [qid gốc]: { lam, sai: EmSaiCau[] } }, conNua }` — `sai` xếp: nhiều lần sai trước, rồi sai gần đây trước, rồi tên.
import type { Env } from './kieu'
import { chiTietCauCuaLuot, giayDoCuaLuot, giayUocTinhGame } from './ai-sai-cau'
import { cacQidSongSinh } from './loi-hoc-luat'

type Row = Record<string, unknown>
const str = (x: unknown) => (x == null ? '' : String(x)).trim()
export const TOI_DA_EM_SAI_LO = 200
export const TOI_DA_CAU_SAI_LO = 120
/** Trần số dòng sổ đọc một lần (≈ 200 em × 120 câu × vài lượt). Quá trần ⇒ `conNua` (đọc phần mới nhất). */
export const TOI_DA_DONG_SAI_LO = 20000

export interface EmSaiCau {
  sbd: string
  ten: string
  /** Số lượt sai của em ở câu này (mọi kênh, cả song sinh). */
  soLanSai: number
  /** Lúc của lượt sai gần nhất (ISO). */
  lucSai: string
  /** Số giây của lượt sai gần nhất; null = không đo được. */
  giay: number | null
  uocTinh?: true
}
export interface SaiCuaCau {
  lam: number
  sai: EmSaiCau[]
}

const dsChuoi = (v: unknown, toiDa: number): string[] =>
  Array.isArray(v) ? [...new Set(v.map((x) => str(x)).filter((x) => x && x.length <= 120))].slice(0, toiDa) : []

/** Lượt sai: kết quả 0, hoặc bỏ trống ở ca thi. */
const laSai = (r: Row) => (r.ket_qua === null || r.ket_qua === undefined ? str(r.nguon) === 'thi' : Number(r.ket_qua) === 0)

export async function aiSaiNhieuCau(env: Env, b: Row): Promise<Row> {
  const sbd = dsChuoi(b.sbd, TOI_DA_EM_SAI_LO)
  const qids = dsChuoi(b.qids, TOI_DA_CAU_SAI_LO)
  if (!qids.length) return { ok: false, error: 'Thiếu mã câu.' }
  if (!sbd.length) return { ok: true, cau: {}, conNua: false }
  // Mã câu đọc được (câu gốc + song sinh) ⇒ câu gốc.
  const veGoc = new Map<string, string>()
  for (const q of qids) for (const x of cacQidSongSinh(q)) if (!veGoc.has(x)) veGoc.set(x, q)
  const sql = (moi: boolean) => `SELECT s.sbd, s.qid, s.nguon, s.ma_nguon, s.lan, s.giay, s.luc, s.ket_qua, d.ho_ten AS ten${moi ? ", CASE WHEN json_valid(s.raw_json) THEN json_extract(s.raw_json, '$.ms') END AS ms" : ''}
      FROM su_kien_hoc s LEFT JOIN danh_sach d ON d.sbd = s.sbd
     WHERE s.qid IN (SELECT value FROM json_each(?1)) AND s.sbd IN (SELECT value FROM json_each(?2))
       AND (s.ket_qua IS NOT NULL OR s.nguon = 'thi')
       ${moi ? "AND COALESCE(s.purpose, '') <> 'xem_loi_giai' AND COALESCE(s.visibility, '') <> 'embargoed'" : ''}
     ORDER BY s.luc DESC LIMIT ${TOI_DA_DONG_SAI_LO + 1}`
  const bind = [JSON.stringify([...veGoc.keys()]), JSON.stringify(sbd)]
  let rows: Row[]
  try {
    rows = (await env.DB.prepare(sql(true)).bind(...bind).all<Row>()).results ?? []
  } catch {
    // sổ chưa có cột chuẩn (raw_json / purpose / visibility) ⇒ đọc cột gốc
    try {
      rows = (await env.DB.prepare(sql(false)).bind(...bind).all<Row>()).results ?? []
    } catch {
      return { ok: false, lyDo: 'loi_doc', error: 'Chưa đọc được sổ học.' }
    }
  }
  const conNua = rows.length > TOI_DA_DONG_SAI_LO
  rows = rows.slice(0, TOI_DA_DONG_SAI_LO)

  // rows xếp MỚI trước ⇒ dòng đầu của mỗi (câu gốc, em) là lần làm mới nhất.
  type Gom = { ten: string; moiNhatSai: boolean; soLanSai: number; dongSai: Row | null }
  const theoCau = new Map<string, Map<string, Gom>>()
  for (const r of rows) {
    const goc = veGoc.get(str(r.qid))
    if (!goc) continue
    const em = str(r.sbd)
    let m = theoCau.get(goc)
    if (!m) theoCau.set(goc, (m = new Map()))
    let g = m.get(em)
    const sai = laSai(r)
    if (!g) m.set(em, (g = { ten: str(r.ten) || em, moiNhatSai: sai, soLanSai: 0, dongSai: null }))
    if (sai) {
      g.soLanSai++
      if (!g.dongSai) g.dongSai = r
    }
  }

  // Số giây của các lượt sai gần nhất (chỉ ứng viên): đo thật ⇒ ca thi `chi_tiet_cau` ⇒ game ước tính.
  const dongUv: Row[] = []
  for (const m of theoCau.values()) for (const g of m.values()) if (g.moiNhatSai && g.dongSai) dongUv.push(g.dongSai)
  const doThat = new Map(dongUv.map((r) => [r, giayDoCuaLuot(r.giay, r.ms)]))
  const thieu = dongUv.filter((r) => doThat.get(r) === null)
  const thiThieu = thieu.filter((x) => str(x.nguon) === 'thi')
  const gameThieu = thieu.filter((x) => str(x.nguon) === 'game').map((x) => ({ sbd: str(x.sbd), phien: str(x.ma_nguon) }))
  const [uoc, ct] = await Promise.all([
    giayUocTinhGame(env, gameThieu).catch(() => new Map<string, number>()),
    chiTietCauCuaLuot(env, thiThieu.map((x) => str(x.ma_nguon)), thiThieu.map((x) => str(x.sbd)), thiThieu.map((x) => str(x.qid))).catch(
      () => new Map<string, { chon: string | null; giay: number | null }>(),
    ),
  ])
  const giayCua = (r: Row): { giay: number | null; uocTinh?: true } => {
    const g = doThat.get(r)
    if (g !== null && g !== undefined) return { giay: g }
    if (str(r.nguon) === 'thi') {
      const k = `${str(r.ma_nguon)}|${str(r.sbd)}|${str(r.qid)}`
      return { giay: (ct.get(`${k}|${Number(r.lan) || 1}`) ?? ct.get(`${k}|*`))?.giay ?? null }
    }
    const u = str(r.nguon) === 'game' ? uoc.get(`${str(r.ma_nguon)}|${Date.parse(str(r.luc))}`) : undefined
    return u !== undefined ? { giay: u, uocTinh: true } : { giay: null }
  }

  const cau: Record<string, SaiCuaCau> = {}
  for (const [goc, m] of theoCau) {
    const sai: EmSaiCau[] = []
    for (const [em, g] of m) if (g.moiNhatSai && g.dongSai) sai.push({ sbd: em, ten: g.ten, soLanSai: g.soLanSai, lucSai: str(g.dongSai.luc), ...giayCua(g.dongSai) })
    sai.sort((a, c) => c.soLanSai - a.soLanSai || (a.lucSai < c.lucSai ? 1 : a.lucSai > c.lucSai ? -1 : 0) || a.ten.localeCompare(c.ten, 'vi'))
    cau[goc] = { lam: m.size, sai }
  }
  return { ok: true, cau, conNua }
}
