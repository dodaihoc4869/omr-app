// ĐO ĐỘ PHỦ + TẢI của việc THAY CÂU ở ca "Kiểm chứng câu đã đúng" (thầy 06/10) TRÊN D1 THẬT — CHỈ ĐỌC, CHỈ IN SỐ ĐẾM (repo công khai, nhật ký ai cũng đọc được).
// Mỗi em mẫu: rút bộ 28 câu từ câu em ĐÃ ĐÚNG (đúng `rutDeDaDung` của ca) → hỏi ĐÚNG hàm máy chủ `cauThayDaDung` (server/src/cau-thay-so.ts) → đếm cách thay
// (song sinh · biến thể · câu anh em · giữ nguyên), theo câu lý thuyết / tính toán, theo phần; đo giây và số truy vấn D1 mỗi em (căn trần `TOI_DA_EM_CAU_THAY`).
// Chạy ĐÚNG mã máy chủ, nhưng `env.DB` là lớp mỏng gọi D1 qua API REST của Cloudflare:
//   · CHỈ nhận SELECT / WITH — mọi lệnh ghi bị chặn (riêng `CREATE … IF NOT EXISTS` của hàm "đảm bảo bảng" là không-làm-gì: bảng đã có trên D1 thật);
//   · KHÔNG in mã em, mã câu, nội dung câu, nhãn: chỉ số thứ tự em mẫu + số đếm.
// Câu lý thuyết: máy thầy biết qua nhãn kho (`kieu`); ở đây chỉ có JSON câu trong kho game (không `kieu`) ⇒ ước lượng bằng `dangCua` — báo trong kết quả là "ước lượng".
// Dùng: node do-phu.mjs [số em mẫu] (đã gói bằng esbuild — .github/workflows/do-phu-thay-so-0610.yml). Thử cục bộ: OMR_D1_CHE_DO=local (D1 giả trong bộ nhớ).
import { writeSync } from 'node:fs'
import '../server/src/index' // nạp theo ĐÚNG thứ tự của Worker thật (các tệp máy chủ nhập vòng nhau — vào từ giữa chừng sẽ lỗi khởi tạo)
import { cauThayDaDung } from '../server/src/cau-thay-so'
import { docCauDaDung } from '../server/src/cau-da-dung'
import { rutDeDaDung, type CauDaDung } from '../src/lib/rut-de-da-dung'
import { dangCua } from '../src/lib/dang-cau'

type Row = Record<string, unknown>
const CHE_DO = process.env.OMR_D1_CHE_DO === 'local' ? 'local' : 'rest'
const SO_EM = Math.max(1, Math.min(60, Number(process.argv[2]) || 12))
const t0 = Date.now()
const ra = (s: string): void => { writeSync(1, `${String((Date.now() - t0) / 1000).padStart(7).slice(0, 7)}s ${s}\n`) }

let soTruyVan = 0
async function hoiRest(sql: string, params: unknown[]): Promise<Row[]> {
  const tai = process.env.CLOUDFLARE_ACCOUNT_ID, token = process.env.CLOUDFLARE_API_TOKEN, db = process.env.OMR_D1_ID
  if (!tai || !token || !db) throw new Error('thiếu CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN / OMR_D1_ID')
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${tai}/d1/database/${db}/query`, {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ sql, params }),
  })
  const j = (await r.json()) as { success?: boolean; errors?: { message?: string }[]; result?: { results?: Row[] }[] }
  if (!j.success) throw new Error(`D1 REST ${r.status}: ${(j.errors ?? []).map((e) => e.message).join('; ').slice(0, 160)}`)
  return j.result?.[0]?.results ?? []
}
let hoiLocal: ((sql: string, params: unknown[]) => Row[]) | null = null
const laDocDuoc = (sql: string): boolean => /^\s*(SELECT|WITH)\b/i.test(sql)
const laDdlDamBao = (sql: string): boolean => /^\s*CREATE\s+(TABLE|INDEX|UNIQUE INDEX)\s+IF\s+NOT\s+EXISTS\b/i.test(sql)
async function hoi(sql: string, params: unknown[]): Promise<Row[]> {
  if (!laDocDuoc(sql)) throw new Error('CHỈ ĐỌC: chặn câu không phải SELECT')
  soTruyVan++
  return CHE_DO === 'local' ? hoiLocal!(sql, params) : hoiRest(sql, params)
}
function lopMong(query: string) {
  let values: unknown[] = []
  const st = {
    bind(...a: unknown[]) { values = a; return st },
    async first<T>() { return ((await hoi(query, values))[0] ?? null) as T | null },
    async all<T>() { return { results: (await hoi(query, values)) as T[], success: true, meta: { changes: 0, last_row_id: 0, rows_read: 0, rows_written: 0 } } },
    async run() { if (laDdlDamBao(query)) return { success: true, meta: { changes: 0 } }; throw new Error('CHỈ ĐỌC: chặn run()') },
    _q: query,
  }
  return st
}
const db = {
  prepare: lopMong,
  async batch(ds: { all: () => Promise<unknown> }[]) { const r = []; for (const s of ds) r.push(await s.all()); return r },
  async exec(sql: string) { if (laDdlDamBao(sql)) return { count: 0, duration: 0 }; throw new Error('CHỈ ĐỌC: chặn exec()') },
  withSession() { return db },
}
const env = { MA_BI_MAT: 'khong-dung', DB: db, DE: { async get() { return null }, async put() { return {} }, async delete() {} } } as never

if (CHE_DO === 'local') {
  const { taoD1That } = await import('../tests/_d1-that')
  const k = taoD1That()
  hoiLocal = (sql, params) => k.sql.prepare(sql).all(...(params as never[])) as Row[]
  // Thử cục bộ: nạp dữ liệu mẫu từ một mô-đun do người chạy chỉ định (OMR_D1_SEED=<đường dẫn>, `export default (k) => void`).
  if (process.env.OMR_D1_SEED) await (await import(process.env.OMR_D1_SEED)).default(k)
}

/** Em mẫu: em có mặt trong chiến dịch còn hiệu lực, rải đều theo thứ tự số báo danh. */
async function chonEmMau(): Promise<string[]> {
  const cd = await hoi("SELECT sbd_json FROM chien_dich WHERE trang_thai <> 'da_huy' AND json_valid(sbd_json) ORDER BY tao_luc DESC LIMIT 60", [])
  const ds = new Set<string>()
  for (const x of cd) { try { for (const s of JSON.parse(String(x.sbd_json)) as unknown[]) ds.add(String(s)) } catch { /* bỏ */ } }
  const tat = [...ds].sort()
  if (tat.length <= SO_EM) return tat
  return Array.from({ length: SO_EM }, (_, i) => tat[Math.floor((i * tat.length) / SO_EM)]!)
}

interface Dem { ss: number; bt: number; ae: number; giu: number }
const moi = (): Dem => ({ ss: 0, bt: 0, ae: 0, giu: 0 })
const cong = (a: Dem, b: Dem): void => { a.ss += b.ss; a.bt += b.bt; a.ae += b.ae; a.giu += b.giu }
const tong = (a: Dem): number => a.ss + a.bt + a.ae + a.giu
const pct = (n: number, m: number): string => (m > 0 ? `${((100 * n) / m).toFixed(1)}%` : '—')
const chuDem = (a: Dem): string => `thay số ${a.ss + a.bt} (song sinh ${a.ss} · biến thể ${a.bt}) · cùng dạng ${a.ae} · giữ nguyên ${a.giu} / ${tong(a)}`

ra(`BẮT ĐẦU đo thay câu · chế độ ${CHE_DO} · ${SO_EM} em mẫu`)
const emMau = await chonEmMau()
ra(`em mẫu: ${emMau.length}`)
const TONG = { lyThuyet: moi(), tinhToan: moi(), I: moi(), II: moi(), III: moi(), tatCa: moi() }
const giay: number[] = [], truyVan: number[] = []
let emKhongCoCau = 0, emLoi = 0
for (const [i, sbd] of emMau.entries()) {
  try {
    const dung = (await docCauDaDung(env, [sbd]))[sbd] ?? []
    const nguon: CauDaDung[] = dung.map((c) => ({ qid: c.qid, phan: c.phan, mucDo: c.mucDo, dang: c.dang, nhan: c.nhan, lucDung: c.lucDung, soLanDung: c.soLanDung, soLanSai: c.soLanSai }))
    const kq = rutDeDaDung({ nguon: { [sbd]: nguon }, dsSbd: [sbd], tongCau: 28, seed: 'DO-PHU' })
    const chon = (kq.theoEm[sbd] ?? []).filter((c) => !c.bu)
    if (chon.length === 0) { emKhongCoCau++; ra(`em#${i + 1}: chưa có câu đã đúng`); continue }
    // Ước lượng câu lý thuyết bằng `dangCua` trên JSON câu trong kho game (máy thầy dùng nhãn kho `kieu`).
    const ly = new Set<string>()
    const nd = await hoi('SELECT qid, json_extract(json,\'$.text\') AS text, json_extract(json,\'$.choices\') AS choices, json_extract(json,\'$.ideas\') AS ideas, json_extract(json,\'$.correct\') AS correct, json_extract(json,\'$.mucDo\') AS muc FROM game_v2_question WHERE qid IN (SELECT value FROM json_each(?))', [JSON.stringify(chon.map((c) => c.qid))])
    const phanCua = new Map(chon.map((c) => [c.qid, c.phan]))
    for (const x of nd) {
      const qid = String(x.qid), phan = phanCua.get(qid)
      if (!phan) continue
      const mang = (v: unknown): string[] => { try { const a = JSON.parse(String(v ?? '[]')) as unknown; return Array.isArray(a) ? a.map(String) : [] } catch { return [] } }
      if (dangCua({ phan, text: String(x.text ?? ''), luaChon: phan === 'I' ? mang(x.choices) : phan === 'II' ? mang(x.ideas) : [], dapAn: phan === 'III' ? String(x.correct ?? '') : '', mucDo: String(x.muc ?? '') }) === 'ly_thuyet') ly.add(qid)
    }
    const cau = chon.map((c) => ({ qid: c.qid, phan: c.phan, mucDo: c.mucDo, dang: dung.find((d) => d.qid === c.qid)?.dang ?? '', lyThuyet: ly.has(c.qid), bu: false }))
    const q0 = soTruyVan, b = Date.now()
    const r = (await cauThayDaDung(env, { sbd: [sbd], seed: 'DO-PHU', cau: { [sbd]: cau } })) as { ok?: boolean; em?: Record<string, Record<string, { cach: 'ss' | 'bt' | 'ae' }>>; loi?: string[] }
    const ms = Date.now() - b, nq = soTruyVan - q0
    giay.push(ms / 1000); truyVan.push(nq)
    if (!r.ok || (r.loi ?? []).length > 0) { emLoi++; ra(`em#${i + 1}: LỖI khi thay (${(r.loi ?? []).length} em lỗi)`) }
    const em = r.em?.[sbd] ?? {}
    const dem = moi()
    for (const c of cau) {
      const kieu = em[c.qid]?.cach
      const nhom = c.lyThuyet ? TONG.lyThuyet : TONG.tinhToan
      const theoPhan = TONG[c.phan]
      const them = (a: Dem): void => { if (kieu) a[kieu]++; else a.giu++ }
      them(dem); them(nhom); them(theoPhan); them(TONG.tatCa)
    }
    ra(`em#${i + 1}: ${chon.length} câu đã đúng (lý thuyết ước lượng ${ly.size}) · ${chuDem(dem)} · ${(ms / 1000).toFixed(1)} giây · ${nq} truy vấn D1`)
  } catch (e) {
    emLoi++
    ra(`em#${i + 1}: NÉM LỖI ${(e instanceof Error ? e.message : String(e)).slice(0, 120)}`)
  }
}
ra('--- TỔNG HỢP (số đếm, không mã em / mã câu)')
ra(`em mẫu ${emMau.length} · chưa có câu đúng ${emKhongCoCau} · lỗi ${emLoi}`)
ra(`TẤT CẢ câu em đã đúng trong bộ 28: ${chuDem(TONG.tatCa)}`)
ra(`  = thay số ${pct(TONG.tatCa.ss + TONG.tatCa.bt, tong(TONG.tatCa))} · cùng dạng ${pct(TONG.tatCa.ae, tong(TONG.tatCa))} · giữ nguyên ${pct(TONG.tatCa.giu, tong(TONG.tatCa))}`)
ra(`Câu LÝ THUYẾT (ước lượng): ${chuDem(TONG.lyThuyet)}`)
ra(`Câu TÍNH TOÁN: ${chuDem(TONG.tinhToan)}`)
for (const p of ['I', 'II', 'III'] as const) ra(`Phần ${p}: ${chuDem(TONG[p])}`)
if (giay.length) {
  const xep = (a: number[]) => [...a].sort((x, y) => x - y)
  const g = xep(giay), q = xep(truyVan)
  ra(`GIÂY mỗi em: trung vị ${g[Math.floor(g.length / 2)]!.toFixed(1)} · lớn nhất ${g.at(-1)!.toFixed(1)} · TRUY VẤN D1 mỗi em: trung vị ${q[Math.floor(q.length / 2)]} · lớn nhất ${q.at(-1)} (trần Worker 1000 truy vấn phụ mỗi lượt gọi; lượt gọi tối đa 2 em)`)
}
ra(`tổng truy vấn D1 của cả lượt đo: ${soTruyVan}`)
process.exit(0)
