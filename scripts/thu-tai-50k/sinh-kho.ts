// DỰNG KHO GIẢ CHO THỬ TẢI 50.000 EM (31/10) — dữ liệu TỔNG HỢP hoàn toàn, không đọc gì của D1 thật.
// Cùng cách nạp với tests/do-tai-nong-3010.test.ts (tests/kho-tai-lon.ts): 120 đề × 25 câu + DH-B8, Gói bài 7, Hành trình khối 12, bài đã dạy.
// Rồi đổ ra MỘT tệp SQL (DROP → CREATE TABLE → INSERT nhiều dòng → INDEX → VIEW → TRIGGER) để `wrangler d1 execute omr-thu --remote --file`.
// Chạy (esbuild đóng gói vì nhập mã máy chủ TypeScript):
//   npx esbuild scripts/thu-tai-50k/sinh-kho.ts --bundle --platform=node --format=esm --target=node22 --outfile=/tmp/sinh-kho.mjs
//   SO_EM_TONG=50000 SO_EM_LS=2000 SK=250 SO_EM_NANG=50 SK_NANG=1500 node /tmp/sinh-kho.mjs /tmp/kho.sql
// Mọi em: lớp 12, mật khẩu 'mk' (máy tải tự ký token bằng MA_BI_MAT của Worker thử). SBD: S1–S3, E4…E<SO_EM_TONG>.
import { createWriteStream } from 'node:fs'
import { napKhoLon, sbdThu } from '../../tests/kho-tai-lon'
import { themChienDich } from '../../tests/omni-3-ke-hoach-chung'
import { dongBoGoi7 } from '../../server/src/goi-bai-7'
import { damBaoBangBaiDaDay } from '../../server/src/bai-da-day'

const so = (k: string, md: number) => Number(process.env[k] ?? md)
const SO_EM_TONG = so('SO_EM_TONG', 50_000), SO_EM_LS = so('SO_EM_LS', 2_000), SK = so('SK', 250), SO_EM_NANG = so('SO_EM_NANG', 50), SK_NANG = so('SK_NANG', 1_500)
const SO_DE = so('SO_DE', 120)
const ra = process.argv[2] ?? 'kho.sql'
const NOW = Date.now()

const t0 = performance.now()
const { k } = napKhoLon({ now: NOW, soDe: SO_DE, soEm: SO_EM_LS, skMoiEm: SK, soEmNang: SO_EM_NANG, skNang: SK_NANG, soEmTong: SO_EM_TONG, baoTienDo: (e) => console.log(`  … ${e} em có lịch sử`) })
await damBaoBangBaiDaDay(k.env)
// Hành trình khối 12: MỌI em (như máy thật: em lớp 12 đăng ký đều vào hành trình khối) — danh sách sbd_json cỡ thật của trường 50.000 em.
const tatCa: string[] = []
for (let e = 1; e <= SO_EM_TONG; e++) tatCa.push(sbdThu(e))
const ngay = (ms: number) => new Date(ms).toISOString()
themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: k.qids('DH-B8'), maDe: ['DH-B8'], sbd: tatCa, hanNop: '9999-12-31', taoLuc: ngay(NOW - 30 * 86_400_000), theLuc: 24, huyetChien: false })
const g7 = await dongBoGoi7(k.env, NOW)
const sql = k.d.sql
const dem = (b: string) => Number((sql.prepare(`SELECT COUNT(*) n FROM ${b}`).get() as { n: number }).n)
console.log(`nạp kho: ${Math.round(performance.now() - t0)} ms · hoc_sinh=${dem('hoc_sinh')} · su_kien_hoc=${dem('su_kien_hoc')} · game_v2_attempt=${dem('game_v2_attempt')} · gói 7: ${JSON.stringify(g7)}`)

// ---- ĐỔ SQL ----
const out = createWriteStream(ra)
let byte = 0
const ghi = (s: string) => { byte += Buffer.byteLength(s); if (!out.write(s)) return new Promise<void>((r) => out.once('drain', () => r())); return null }
const q = (ten: string) => `"${ten.replace(/"/g, '""')}"`
const giaTri = (v: unknown): string => {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL'
  if (typeof v === 'bigint') return v.toString()
  if (v instanceof Uint8Array) return `X'${Buffer.from(v).toString('hex')}'`
  return `'${String(v).replace(/'/g, "''")}'`
}
/** D1: một câu SQL tối đa 100 KB ⇒ lô INSERT ~60 KB; giá trị chữ > 40 KB (sbd_json của hành trình 50.000 em) ⇒ chèn khúc đầu rồi nối dần bằng UPDATE. */
const TRAN_LO = 60_000, TRAN_CHU = 40_000
type Dt = { type: string; name: string; tbl_name: string; sql: string | null }
const doiTuong = sql.prepare("SELECT type, name, tbl_name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND sql IS NOT NULL").all() as Dt[]
const bang = doiTuong.filter((x) => x.type === 'table')
await ghi('PRAGMA defer_foreign_keys = TRUE;\n')
for (const x of doiTuong.filter((x) => x.type === 'trigger')) await ghi(`DROP TRIGGER IF EXISTS ${q(x.name)};\n`)
for (const x of doiTuong.filter((x) => x.type === 'view')) await ghi(`DROP VIEW IF EXISTS ${q(x.name)};\n`)
for (const x of bang) await ghi(`DROP TABLE IF EXISTS ${q(x.name)};\n`)
for (const x of bang) await ghi(`${x.sql};\n`)
let soDong = 0
for (const b of bang) {
  // Bỏ cột NULL ở MỌI dòng mà mặc định cũng là NULL (bớt ~20 % cỡ tệp, cùng dữ liệu).
  const cot = (sql.prepare(`SELECT name, dflt_value FROM pragma_table_info(${giaTri(b.name)})`).all() as { name: string; dflt_value: unknown }[])
    .filter((c) => c.dflt_value !== null || (sql.prepare(`SELECT 1 FROM ${q(b.name)} WHERE ${q(c.name)} IS NOT NULL LIMIT 1`).get() !== undefined))
    .map((c) => c.name)
  if (!cot.length) continue
  const dau = `INSERT INTO ${q(b.name)} (${cot.map(q).join(',')}) VALUES `
  let lo: string[] = [], loByte = 0
  const xa = async () => { if (lo.length) { await ghi(dau + lo.join(',') + ';\n'); lo = []; loByte = 0 } }
  for (const r of sql.prepare(`SELECT * FROM ${q(b.name)}`).iterate() as Iterable<Record<string, unknown>>) {
    soDong++
    const dai = cot.find((c) => typeof r[c] === 'string' && (r[c] as string).length > TRAN_CHU)
    if (dai) {
      // Hàng có chữ dài: chèn riêng (khúc đầu), nối phần còn lại vào ĐÚNG hàng vừa chèn (rowid lớn nhất).
      await xa()
      const s = r[dai] as string
      await ghi(dau + '(' + cot.map((c) => (c === dai ? giaTri(s.slice(0, TRAN_CHU)) : giaTri(r[c]))).join(',') + ');\n')
      for (let i = TRAN_CHU; i < s.length; i += TRAN_CHU) await ghi(`UPDATE ${q(b.name)} SET ${q(dai)} = ${q(dai)} || ${giaTri(s.slice(i, i + TRAN_CHU))} WHERE rowid = (SELECT MAX(rowid) FROM ${q(b.name)});\n`)
      continue
    }
    const dong = '(' + cot.map((c) => giaTri(r[c])).join(',') + ')'
    if (loByte + dong.length > TRAN_LO) await xa()
    lo.push(dong); loByte += dong.length + 1
  }
  await xa()
}
for (const x of doiTuong.filter((x) => x.type === 'index')) await ghi(`${x.sql};\n`)
for (const x of doiTuong.filter((x) => x.type === 'view')) await ghi(`${x.sql};\n`)
for (const x of doiTuong.filter((x) => x.type === 'trigger')) await ghi(`${x.sql};\n`)
await new Promise<void>((r) => out.end(() => r()))
console.log(`đổ SQL: ${ra} · ${(byte / 1048576).toFixed(1)} MB · ${bang.length} bảng · ${soDong} dòng · ${Math.round(performance.now() - t0)} ms`)
