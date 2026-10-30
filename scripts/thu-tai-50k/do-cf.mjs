// SỐ LIỆU CLOUDFLARE CỦA LƯỢT THỬ TẢI (31/10) — GraphQL Analytics, CHỈ ĐỌC, CHỈ D1 THỬ `omr-thu` + Worker `omr-thu` (không chạm D1/Worker thật).
//   TOKEN=… ACC=… D1_THU=<id omr-thu> node scripts/thu-tai-50k/do-cf.mjs <tom.json của gop.mjs | "tu,den" ISO> [--md <tệp>]
// Mỗi giai đoạn (khung batDau−30 s … ketThuc+30 s):
//   D1   : tổng ms truy vấn, số lệnh, dòng đọc/ghi; 15 câu nặng nhất (lần, tb ms, dòng đọc tb)
//   Worker: requests / errors / CPU p50,p99 / thời lượng p50,p99 + theo trạng thái (exceededMemory / exceededCpu / exceededResources …)
//   Durable Object: requests / errors / CPU, wall p50,p99 + theo trạng thái; lỗi vượt bộ nhớ / CPU (periodic)
import { readFileSync, appendFileSync } from 'node:fs'

const { TOKEN, ACC, D1_THU } = process.env
const ID_THAT = 'd2e6d322-374a-45d7-83a3-9fac486b23f1'
if (!TOKEN || !ACC || !D1_THU) { console.error('Thiếu TOKEN / ACC / D1_THU'); process.exit(2) }
if (D1_THU === ID_THAT) { console.error('CHẶN: D1_THU là D1 thật'); process.exit(3) }
const SCRIPT = 'omr-thu'
const arg = process.argv[2] ?? ''
const tham = (ten) => { const i = process.argv.indexOf(`--${ten}`); return i > 0 ? process.argv[i + 1] : undefined }
let khung = []
if (arg.includes(',')) { const [tu, den] = arg.split(','); khung = [{ gd: 'khung', tu, den }] }
else {
  const tom = JSON.parse(readFileSync(arg, 'utf8'))
  khung = Object.entries(tom).sort((a, b) => a[1].batDau - b[1].batDau).map(([gd, t]) => ({ gd, tu: new Date(t.batDau - 30_000).toISOString(), den: new Date(t.ketThuc + 30_000).toISOString() }))
}
const md = []
const ra = (s) => { console.log(s); md.push(s) }

async function gql(query, variables) {
  for (let lan = 0; lan < 3; lan++) {
    const r = await fetch('https://api.cloudflare.com/client/v4/graphql', { method: 'POST', headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' }, body: JSON.stringify({ query, variables }) })
    const j = await r.json().catch(() => ({ errors: [{ message: `HTTP ${r.status}` }] }))
    if (j.errors?.length) { if (lan < 2 && /rate|timeout|internal/i.test(j.errors[0].message)) { await new Promise((x) => setTimeout(x, 3000)); continue } return { loi: j.errors.map((e) => e.message).join(' | ').slice(0, 400) } }
    return { data: j.data?.viewer?.accounts?.[0] ?? {} }
  }
  return { loi: 'hết lượt thử' }
}
const r1 = (x) => (x == null ? '-' : Math.round(x * 10) / 10)

for (const k of khung) {
  const v = { acc: ACC, db: D1_THU, s: SCRIPT, tu: k.tu, den: k.den }
  ra(`\n### Cloudflare — giai đoạn ${k.gd} (${k.tu.slice(11, 19)}–${k.den.slice(11, 19)} UTC)`)
  // ---- D1 ----
  const d1 = await gql(`query($acc:String!,$db:String!,$tu:Time!,$den:Time!){viewer{accounts(filter:{accountTag:$acc}){
    d1QueriesAdaptiveGroups(limit:1000,filter:{databaseId:$db,datetime_geq:$tu,datetime_leq:$den},orderBy:[sum_queryDurationMs_DESC]){dimensions{query} count sum{queryDurationMs rowsRead rowsWritten}}}}}`, v)
  if (d1.loi) ra(`- D1: lỗi GraphQL ${d1.loi}`)
  else {
    const g = d1.data.d1QueriesAdaptiveGroups ?? []
    const tong = g.reduce((a, x) => ({ ms: a.ms + x.sum.queryDurationMs, n: a.n + x.count, doc: a.doc + x.sum.rowsRead, ghi: a.ghi + x.sum.rowsWritten }), { ms: 0, n: 0, doc: 0, ghi: 0 })
    const giay = (Date.parse(k.den) - Date.parse(k.tu)) / 1000
    ra(`- **D1 omr-thu**: tổng ${r1(tong.ms / 1000)} s truy vấn trong ${Math.round(giay)} s tường (≈ ${r1(tong.ms / 1000 / giay)} s bận / giây) · ${tong.n} lệnh · đọc ${tong.doc} dòng · ghi ${tong.ghi} dòng`)
    ra('\n| # | lần | tổng s | tb ms | dòng đọc tb | câu (rút gọn) |\n|---:|---:|---:|---:|---:|---|')
    g.slice(0, 15).forEach((x, i) => ra(`| ${i + 1} | ${x.count} | ${r1(x.sum.queryDurationMs / 1000)} | ${r1(x.sum.queryDurationMs / x.count)} | ${Math.round(x.sum.rowsRead / x.count)} | \`${x.dimensions.query.replace(/\s+/g, ' ').replace(/[|`]/g, '¦').slice(0, 170)}\` |`))
  }
  // ---- Worker ----
  const w = await gql(`query($acc:String!,$s:String!,$tu:Time!,$den:Time!){viewer{accounts(filter:{accountTag:$acc}){
    tong: workersInvocationsAdaptive(limit:5,filter:{scriptName:$s,datetime_geq:$tu,datetime_leq:$den}){sum{requests errors subrequests} quantiles{cpuTimeP50 cpuTimeP99 durationP50 durationP99}}
    tt: workersInvocationsAdaptive(limit:20,filter:{scriptName:$s,datetime_geq:$tu,datetime_leq:$den}){dimensions{status} sum{requests errors}}}}}`, v)
  if (w.loi) ra(`- Worker: lỗi GraphQL ${w.loi}`)
  else {
    const t = w.data.tong?.[0]
    ra(`- **Worker omr-thu**: ${t ? `${t.sum.requests} yêu cầu · ${t.sum.errors} lỗi · ${t.sum.subrequests} subrequest · CPU p50/p99 ${r1(t.quantiles.cpuTimeP50 / 1000)}/${r1(t.quantiles.cpuTimeP99 / 1000)} ms · thời lượng p50/p99 ${r1(t.quantiles.durationP50)}/${r1(t.quantiles.durationP99)}` : 'không có số'} · theo trạng thái: ${(w.data.tt ?? []).map((x) => `${x.dimensions.status}=${x.sum.requests}`).join(', ')}`)
  }
  // ---- Durable Objects ----
  const d = await gql(`query($acc:String!,$s:String!,$tu:Time!,$den:Time!){viewer{accounts(filter:{accountTag:$acc}){
    tong: durableObjectsInvocationsAdaptiveGroups(limit:5,filter:{scriptName:$s,datetime_geq:$tu,datetime_leq:$den}){sum{requests errors} quantiles{cpuTimeP50 cpuTimeP99 wallTimeP50 wallTimeP99}}
    tt: durableObjectsInvocationsAdaptiveGroups(limit:20,filter:{scriptName:$s,datetime_geq:$tu,datetime_leq:$den}){dimensions{status} sum{requests errors}}}}}`, v)
  if (d.loi) ra(`- Durable Object: lỗi GraphQL ${d.loi}`)
  else {
    const t = d.data.tong?.[0]
    ra(`- **Durable Object (omr-thu)**: ${t ? `${t.sum.requests} yêu cầu · ${t.sum.errors} lỗi · CPU p50/p99 ${r1(t.quantiles.cpuTimeP50 / 1000)}/${r1(t.quantiles.cpuTimeP99 / 1000)} ms · wall p50/p99 ${r1(t.quantiles.wallTimeP50 / 1000)}/${r1(t.quantiles.wallTimeP99 / 1000)} ms` : 'không có số'} · theo trạng thái: ${(d.data.tt ?? []).map((x) => `${x.dimensions.status}=${x.sum.requests}`).join(', ')}`)
  }
  const p = await gql(`query($acc:String!,$s:String!,$tu:Time!,$den:Time!){viewer{accounts(filter:{accountTag:$acc}){
    durableObjectsPeriodicGroups(limit:5,filter:{scriptName:$s,datetime_geq:$tu,datetime_leq:$den}){sum{activeTime cpuTime exceededCpuErrors exceededMemoryErrors fatalInternalErrors storageReadUnits storageWriteUnits}}}}}`, v)
  if (p.loi) ra(`- DO định kỳ: lỗi GraphQL ${p.loi}`)
  else { const t = p.data.durableObjectsPeriodicGroups?.[0]?.sum; ra(`- DO định kỳ: ${t ? `vượt bộ nhớ ${t.exceededMemoryErrors} · vượt CPU ${t.exceededCpuErrors} · lỗi nội bộ ${t.fatalInternalErrors} · CPU ${r1(t.cpuTime / 1e6)} s · active ${r1(t.activeTime / 1e6)} s · đọc/ghi kho ${t.storageReadUnits}/${t.storageWriteUnits}` : 'không có số'}`) }
}
const tepMd = tham('md'); if (tepMd) appendFileSync(tepMd, md.join('\n') + '\n')
