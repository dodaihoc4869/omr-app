// CHỈ ĐỌC: kiểm mục tiêu sáu bản và bằng chứng từng bản; không in đề/đáp án.
import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { laCauTuLuan } from '../../src/lib/cau-tu-luan'
import { khoaBanSongSinh, songSinhDuDuLieu, type SongSinh } from '../../server/src/cau-bo-tro'
import { CHO_SONG_SINH, TRAN_SONG_SINH } from '../../server/src/loi-hoc-luat'
import { chuanChu, khopMu } from '../../server/src/may-soan-kiem'

type Row = Record<string, unknown>
type Query = (sql: string, params: unknown[]) => Promise<Row[]>
const obj = (v: unknown): Row | null => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Row : null
function json(v: unknown): unknown { return typeof v === 'string' ? JSON.parse(v) : v }
function daKiem(k: unknown, dang: 'tn' | 'ds' | 'tln', dapAn: unknown): boolean {
  const x = obj(k)
  return !!x && x.chac === true && typeof x.lyDo2 === 'string' && !!x.lyDo2.trim()
    && typeof x.d2 === 'string' && khopMu(dang, String(dapAn ?? ''), { d: x.d2, chac: true })
}

/** Số bản đủ dữ liệu và số bản có bằng chứng kiểm độc lập; KHÔNG gọi đây là bảo đảm chuyên môn tuyệt đối. */
export function demBan(phan: string, ss: unknown, ys: readonly Row[] = []) {
  if (phan === 'II') {
    const co = new Set<string>(), kiem = new Set<string>()
    for (const y of ys) {
      if (typeof y.noi_dung !== 'string' || !y.noi_dung.trim() || !['D', 'S'].includes(String(y.gia_tri)) || !String(y.ly_do ?? '').trim()) continue
      const k = chuanChu(y.noi_dung)
      co.add(k)
      if (daKiem(json(y.kiem_json ?? 'null'), 'ds', y.gia_tri)) kiem.add(k)
    }
    return { duDuLieu: Math.floor(co.size / 4), coBangChung: Math.floor(kiem.size / 4) }
  }
  if (!['I', 'III'].includes(phan)) return { duDuLieu: 0, coBangChung: 0 }
  const ds = ss == null ? [] : json(ss)
  if (!Array.isArray(ds)) throw new Error('Song sinh phải là mảng JSON')
  const co = new Set<string>(), kiem = new Set<string>()
  for (const x of ds.slice(0, CHO_SONG_SINH)) {
    const s = obj(x)
    if (!s || !songSinhDuDuLieu(phan, s as unknown as SongSinh)) continue
    const k = khoaBanSongSinh(s)
    co.add(k)
    if (daKiem(s.kiem, phan === 'I' ? 'tn' : 'tln', s.dap_an)) kiem.add(k)
  }
  return { duDuLieu: co.size, coBangChung: kiem.size }
}

export async function quetSauBan(query: Query) {
  const ys = new Map<string, Row[]>()
  for (let offset = 0; ; offset += 500) {
    const rows = await query('SELECT bam,noi_dung,gia_tri,ly_do,kiem_json FROM cau_y_ds ORDER BY bam,stt LIMIT 500 OFFSET ?', [offset])
    for (const r of rows) { const b = String(r.bam); ys.set(b, [...(ys.get(b) ?? []), r]) }
    if (rows.length < 500) break
  }
  const seen = new Set<string>(), bams = new Set<string>(), thieu: Row[] = []
  let tong = 0, tuLuan = 0, chuaAnhXa = 0, duSauBan = 0, duSauBangChung = 0
  for (let offset = 0; ; offset += 300) {
    const rows = await query(`SELECT q.qid,q.json,l.bam,b.song_sinh_json FROM game_v2_question q
      JOIN de_kho d ON d.ma_de=q.ma_de AND COALESCE(d.da_xoa,0)=0
      LEFT JOIN loi_giai_cau l ON l.qid=q.qid AND l.ma_de=q.ma_de
      LEFT JOIN cau_bo_tro b ON b.bam=l.bam ORDER BY q.qid,q.ma_de LIMIT 300 OFFSET ?`, [offset])
    for (const r of rows) {
      const qid = String(r.qid)
      if (seen.has(qid)) continue
      seen.add(qid)
      const q = obj(json(r.json))
      if (!q) throw new Error('JSON câu gốc không phải đối tượng: ' + qid)
      if (laCauTuLuan(q)) { tuLuan++; continue }
      tong++
      const bam = r.bam == null ? '' : String(r.bam)
      if (!bam) chuaAnhXa++; else bams.add(bam)
      const n = demBan(String(q.phan), r.song_sinh_json, ys.get(bam))
      if (n.duDuLieu >= TRAN_SONG_SINH) duSauBan++
      if (n.coBangChung >= TRAN_SONG_SINH) duSauBangChung++
      if (n.coBangChung < TRAN_SONG_SINH) thieu.push({ qid, bam, phan: q.phan, ...n })
    }
    if (rows.length < 300) break
  }
  return { luc: new Date().toISOString(), chiDoc: true, mucTieu: TRAN_SONG_SINH, tong, tuLuan, nhomNoiDung: bams.size,
    chuaAnhXa, duSauBan, duSauBangChung, conThieu: thieu.length, datCongKiem: tong > 0 && chuaAnhXa === 0 && thieu.length === 0, thieu }
}

async function main() {
  const token = process.env.CLOUDFLARE_API_TOKEN, account = process.env.CLOUDFLARE_ACCOUNT_ID
  if (!token || !account) throw new Error('Thiếu cấu hình Cloudflare')
  const result = await quetSauBan(async (sql, params) => {
    if (!/^SELECT\b/i.test(sql.trim())) throw new Error('Chỉ cho phép SELECT')
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/d2e6d322-374a-45d7-83a3-9fac486b23f1/query`, {
      method: 'POST', signal: AbortSignal.timeout(60000), headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ sql, params }),
    })
    const j = await r.json() as { success: boolean; result: { results?: Row[] }[] }
    if (!r.ok || !j.success) throw new Error('Không đọc được D1: HTTP ' + r.status)
    return j.result.flatMap(x => x.results ?? [])
  })
  const { thieu, ...tomTat } = result
  const out = process.argv[2]
  if (out) writeFileSync(out, JSON.stringify(result, null, 2))
  console.log(JSON.stringify(tomTat))
  // Không được báo thành công mục tiêu khi còn câu chưa có sáu bằng chứng.
  if (!result.datCongKiem) process.exitCode = 2
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(e => { console.error(e.message); process.exitCode = 1 })
