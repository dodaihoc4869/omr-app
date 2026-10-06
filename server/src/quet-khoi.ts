// QUÉT CÂU LỌT KHỐI (thầy 06/10: "em khối 10 rút câu khối 11") — lệnh thầy, CHỈ ĐỌC.
// Lấy các câu em khối `khoi` (mặc định 10) đã làm từ `tu` (mặc định 3 ngày trước) ở sổ `su_kien_hoc`, rồi chỉ ra câu mà bất kỳ nguồn nào
// (mã câu, mã tờ ở game_v2_question, `de_kho.lop`) nói là khối CAO hơn khối em, hoặc không đọc ra khối. Kèm kênh (nguon), số em, mẫu SBD, mã tờ, đầu đề câu.
import type { Env } from './kieu'
import { khoiCuaCau, khoiCuaLop, type Khoi } from '../../src/lib/khoi-cau'

type Row = Record<string, unknown>
const str = (v: unknown): string => (v == null ? '' : String(v))

export async function quetKhoi(env: Env, b: Row, nowMs = Date.now()): Promise<Record<string, unknown>> {
  const khoi = ([10, 11, 12] as number[]).includes(Number(b.khoi)) ? (Number(b.khoi) as Khoi) : 10
  const tu = /^\d{4}-\d{2}-\d{2}$/.test(str(b.tu)) ? str(b.tu) : new Date(nowMs - 3 * 86_400_000 + 7 * 3_600_000).toISOString().slice(0, 10)
  const hs = (await env.DB.prepare('SELECT sbd, lop FROM hoc_sinh').all<Row>()).results ?? []
  const em = hs.filter((x) => khoiCuaLop(x.lop) === khoi).map((x) => str(x.sbd))
  if (!em.length) return { ok: true, khoi, tu, soEm: 0, lot: [] }
  const r = (await env.DB.prepare(
    `SELECT qid, nguon, COUNT(DISTINCT sbd) AS so_em, MIN(sbd) AS mau_sbd, COUNT(*) AS so_luot FROM su_kien_hoc
      WHERE ngay_vn >= ? AND sbd IN (SELECT value FROM json_each(?)) GROUP BY qid, nguon`,
  ).bind(tu, JSON.stringify(em)).all<Row>()).results ?? []
  const qids = [...new Set(r.map((x) => str(x.qid)))]
  const meta = new Map<string, { maDe: string; text: string }>()
  for (let i = 0; i < qids.length; i += 400) {
    const m = (await env.DB.prepare(`SELECT qid, ma_de, substr(json_extract(json,'$.text'),1,70) AS text FROM game_v2_question WHERE qid IN (SELECT value FROM json_each(?))`)
      .bind(JSON.stringify(qids.slice(i, i + 400))).all<Row>().catch(() => ({ results: [] as Row[] }))).results ?? []
    for (const x of m) if (!meta.has(str(x.qid))) meta.set(str(x.qid), { maDe: str(x.ma_de), text: str(x.text) })
  }
  const maDes = [...new Set([...meta.values()].map((x) => x.maDe).filter(Boolean))]
  const lopTo = new Map<string, string>()
  if (maDes.length) for (const x of (await env.DB.prepare('SELECT ma_de, lop FROM de_kho WHERE ma_de IN (SELECT value FROM json_each(?))').bind(JSON.stringify(maDes)).all<Row>().catch(() => ({ results: [] as Row[] }))).results ?? []) lopTo.set(str(x.ma_de), str(x.lop))
  const lot: Row[] = []
  for (const x of r) {
    const qid = str(x.qid), m = meta.get(qid)
    const k = khoiCuaCau({ qid, ...(m ? { maDe: m.maDe, lop: lopTo.get(m.maDe) ?? '' } : {}) })
    if (k !== null && k <= khoi) continue
    lot.push({ qid, kenh: str(x.nguon), khoiCau: k, maDe: m?.maDe ?? null, lopTo: m ? lopTo.get(m.maDe) ?? null : null, soEm: Number(x.so_em), mauSbd: str(x.mau_sbd), soLuot: Number(x.so_luot), dau: m?.text ?? null })
  }
  lot.sort((a, c) => Number(c.soLuot) - Number(a.soLuot))
  return { ok: true, khoi, tu, soEm: em.length, soCauDaLam: qids.length, soLot: lot.length, lot: lot.slice(0, 150) }
}
