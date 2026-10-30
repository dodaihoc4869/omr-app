// KIỂM NHANH Worker thử sau khi đẩy (31/10): một em giả đi hết vòng học (Sảnh → kế hoạch → mở chặng → trả lời → đếm) — mọi lệnh phải ok:true, qua ngăn (x-ngan: 1).
//   MA_BI_MAT=… node scripts/thu-tai-50k/kiem-nhanh.mjs <gốc https://omr-thu.….workers.dev> [sbd]
// Lệnh đầu thử lại tới 120 s (workers.dev của Worker mới cần vài giây mới nhận). Sai ⇒ thoát 1 (không chạy giai đoạn tải nào).
import { createHmac, createHash } from 'node:crypto'

const GOC = String(process.argv[2] ?? '').replace(/\/+$/, ''), SBD = process.argv[3] ?? 'E10', MA = process.env.MA_BI_MAT ?? ''
if (!GOC || !MA) { console.error('Thiếu gốc / MA_BI_MAT'); process.exit(2) }
const pwd = createHash('sha256').update(JSON.stringify('mk')).digest('hex')
const payload = Buffer.from(JSON.stringify({ sbd: SBD, exp: Date.now() + 86_400_000, pwd })).toString('base64')
const token = `${payload}.${createHmac('sha256', MA).update(payload).digest('hex')}`
let hong = 0
async function goi(d, b) {
  const t = Date.now()
  const r = await fetch(GOC + d, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b), signal: AbortSignal.timeout(30_000) })
  const s = await r.text(); let j = {}; try { j = JSON.parse(s) } catch { j = { ok: false, error: `không phải JSON: ${s.slice(0, 80)}` } }
  const ok = r.status === 200 && j.ok !== false
  console.log(`${d.padEnd(26)} HTTP ${r.status} · ok=${j.ok} · x-ngan=${r.headers.get('x-ngan')} · ${Date.now() - t} ms${ok ? '' : ` · ${j.maLoi ?? ''} ${j.error ?? ''}`}`)
  return { ok, j, ngan: r.headers.get('x-ngan') === '1' }
}
let dau = null
for (const het = Date.now() + 120_000; Date.now() < het;) {
  try { dau = await goi('/game-v2/hoc-tap-sanh', { token }); if (dau.ok) break } catch (e) { console.log('chưa nối được:', e?.cause?.code ?? e?.message) }
  await new Promise((r) => setTimeout(r, 5000))
}
if (!dau?.ok) hong++
if (dau && !dau.ngan) { console.log('CẢNH BÁO: Sảnh không qua ngăn riêng (x-ngan khác 1)'); hong++ }
for (const [d, b] of [['/hs/ke-hoach-ngay', { token }], ['/presence', { session: `kiem-nhanh-${Date.now().toString(36)}`, role: 'hs' }]]) if (!(await goi(d, b)).ok) hong++
const s = await goi('/game-v2/hoc-tap-start', { token })
const q = s.j?.questions?.[0]
console.log(`  chặng: ${s.j?.questions?.length ?? 0} câu`)
if (!s.ok || !q) hong++
else {
  const a = await goi('/game-v2/answer', { session: s.j.id, qid: q.qid, answer: { I: 'A', II: 'DSDD', III: '4' }[q.phan] ?? 'A', assisted: false, msLam: 9000, token })
  if (!a.ok) hong++
  if (!(await goi('/game-v2/hoc-tap-dem', { token })).ok) hong++
}
console.log(hong ? `KIỂM NHANH HỎNG (${hong} chỗ)` : 'KIỂM NHANH ĐẠT')
process.exit(hong ? 1 : 0)
