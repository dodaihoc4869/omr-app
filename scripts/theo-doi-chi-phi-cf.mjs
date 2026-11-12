// THEO DÕI CHI PHÍ CLOUDFLARE HẰNG ĐÊM (CHỈ ĐỌC, 11/11 — thầy «Làm mọi thứ để dùng bản 5 đô/tháng thôi»).
// Đọc GraphQL Analytics số dùng từ đầu kỳ (ngày 11 hằng tháng) tới giờ, dự báo cả kỳ 30 ngày, so hạn mức gói Workers Paid 5 USD
// (bảng giá đọc trên trang chính thức 11/11, ghi trong docs/chi-phi-cloudflare-1111.md). Dự báo vượt 5 USD ⇒ lượt chạy ĐỎ (GitHub gửi thư báo).
// Không SELECT trên D1, không ghi gì, không in khoá / mã tài khoản.
import { appendFileSync } from 'node:fs'
const TOKEN = process.env.CF_TOKEN_SACH, ACC = process.env.CF_ACC_SACH
const H = { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' }
const NGAY_KY = 11
const now = new Date()
const dauKy = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (now.getUTCDate() < NGAY_KY ? 1 : 0), NGAY_KY))
const soNgay = Math.max(0.25, (now - dauKy) / 86400e3)
const gql = async (ten, than) => {
  const loc = `{datetime_geq:"${dauKy.toISOString()}",datetime_leq:"${now.toISOString()}"}`
  const r = await fetch('https://api.cloudflare.com/client/v4/graphql', { method: 'POST', headers: H,
    body: JSON.stringify({ query: `query($a:String!){viewer{accounts(filter:{accountTag:$a}){${ten}(limit:10000,filter:${loc}){${than}}}}}`, variables: { a: ACC } }) })
  const j = await r.json().catch(() => null)
  if (!j || j.errors?.length) { console.log(`LỖI ${ten}: ${String((j?.errors ?? []).map((x) => x.message).join(' | ')).split(ACC).join('<tk>').slice(0, 200)}`); return null }
  const tong = {}
  for (const x of j.data?.viewer?.accounts?.[0]?.[ten] ?? []) for (const [k, v] of Object.entries(x.sum ?? {})) tong[k] = (tong[k] ?? 0) + (Number(v) || 0)
  return tong
}
const d1 = await gql('d1AnalyticsAdaptiveGroups', 'sum{rowsRead rowsWritten} dimensions{date}')
const wk = await gql('workersInvocationsAdaptive', 'sum{requests cpuTimeUs} dimensions{date}')
const doReq = await gql('durableObjectsInvocationsAdaptiveGroups', 'sum{requests} dimensions{date}')
const doTg = await gql('durableObjectsPeriodicGroups', 'sum{activeTime} dimensions{date}')
const ai = await gql('aiInferenceAdaptiveGroups', 'sum{totalNeurons} dimensions{date}')

// [tên, đã dùng, đơn vị, phần gồm trong gói / kỳ, giá phần vượt (USD / đơn vị), cách làm tròn]
const M = 1e6
const dong = [
  ['D1 hàng đọc', d1?.rowsRead, 'hàng', 25_000 * M, 0.001 / M],
  ['D1 hàng ghi', d1?.rowsWritten, 'hàng', 50 * M, 1 / M],
  ['Worker lượt gọi', wk?.requests, 'lượt', 10 * M, 0.3 / M],
  ['Worker CPU', wk ? wk.cpuTimeUs / 1000 : undefined, 'ms', 30 * M, 0.02 / M],
  ['DO lượt gọi', doReq?.requests, 'lượt', 1 * M, 0.15 / M],
  ['DO thời gian', doTg ? (doTg.activeTime / 1e6) * 0.128 : undefined, 'GB-s', 400_000, 12.5 / M, 'trieu'],
  ['Workers AI (cả kỳ, miễn phí 10.000/ngày)', ai?.totalNeurons, 'neurons', 10_000 * 30, 0.011 / 1000],
]
const so = (n) => n == null ? '—' : Math.round(n).toLocaleString('vi-VN')
let tongDuBao = 5
const bang = ['| Khoản | Đã dùng (từ ' + dauKy.toISOString().slice(0, 10) + ', ' + soNgay.toFixed(1) + ' ngày) | Dự báo cả kỳ 30 ngày | Gồm trong gói | % gói | Tiền vượt dự báo (USD) |', '|---|---|---|---|---|---|']
for (const [ten, dung, dv, goi, gia, lam] of dong) {
  if (dung == null) { bang.push(`| ${ten} | không đọc được | | ${so(goi)} ${dv} | | |`); continue }
  const duBao = dung / soNgay * 30
  let vuot = Math.max(0, duBao - goi)
  if (lam === 'trieu' && vuot > 0) vuot = Math.ceil(vuot / M) * M
  const tien = vuot * gia
  tongDuBao += tien
  bang.push(`| ${ten} | ${so(dung)} ${dv} | ${so(duBao)} | ${so(goi)} | ${Math.round(duBao / goi * 100)}% | ${tien.toFixed(2)} |`)
}
// Câu D1 đọc nhiều hàng nhất 24 giờ qua (để biết phải sửa câu nào khi D1 hàng đọc vượt). Chữ câu lệnh có tham số «?», không có dữ liệu em.
const tuQ = new Date(now - 86400e3).toISOString()
const SO_TOP = Math.min(100, Math.max(5, Number(process.env.SO_TOP) || 60)) // 12/11 đợt 3: 60 câu (trước 15) — phần đuôi ~0,7 tỉ hàng/ngày cũng phải sửa
const jq = await fetch('https://api.cloudflare.com/client/v4/graphql', { method: 'POST', headers: H, body: JSON.stringify({ variables: { a: ACC, db: process.env.DB_ID ?? '', tu: tuQ, den: now.toISOString() },
  query: `query($a:String!,$db:String!,$tu:Time!,$den:Time!){viewer{accounts(filter:{accountTag:$a}){d1QueriesAdaptiveGroups(limit:${SO_TOP},filter:{databaseId:$db,datetime_geq:$tu,datetime_leq:$den},orderBy:[sum_rowsRead_DESC]){count sum{rowsRead rowsWritten} dimensions{query}}}}}` }) }).then((r) => r.json()).catch(() => null)
const top = jq?.data?.viewer?.accounts?.[0]?.d1QueriesAdaptiveGroups ?? []
const j24 = await fetch('https://api.cloudflare.com/client/v4/graphql', { method: 'POST', headers: H, body: JSON.stringify({ variables: { a: ACC, db: process.env.DB_ID ?? '', tu: tuQ, den: now.toISOString() },
  query: `query($a:String!,$db:String!,$tu:Time!,$den:Time!){viewer{accounts(filter:{accountTag:$a}){d1AnalyticsAdaptiveGroups(limit:10000,filter:{databaseId:$db,datetime_geq:$tu,datetime_leq:$den}){sum{rowsRead rowsWritten}}}}}` }) }).then((r) => r.json()).catch(() => null)
const tong24 = (j24?.data?.viewer?.accounts?.[0]?.d1AnalyticsAdaptiveGroups ?? []).reduce((a, x) => a + (Number(x.sum?.rowsRead) || 0), 0)
const bangTop = [`\n### ${SO_TOP} câu D1 đọc nhiều hàng nhất 24 giờ qua`, '', `Tổng hàng đọc D1 thật 24 giờ qua: **${so(tong24)}** (gói: ~833 triệu/ngày). ${SO_TOP} câu dưới: ${so(top.reduce((a, x) => a + x.sum.rowsRead, 0))}.`, '', '| Hàng đọc | Hàng ghi | Lượt | Hàng/lượt | Câu (260 ký tự đầu) |', '|---|---|---|---|---|',
  ...top.map((x) => `| ${so(x.sum.rowsRead)} | ${so(x.sum.rowsWritten)} | ${so(x.count)} | ${so(x.sum.rowsRead / Math.max(1, x.count))} | \`${String(x.dimensions.query).replace(/\s+/g, ' ').replace(/[|`]/g, ' ').slice(0, 260)}\` |`)]
if (!top.length) bangTop.push(`(không đọc được: ${String((jq?.errors ?? []).map((x) => x.message).join(' | ')).split(ACC).join('<tk>').slice(0, 200)})`)
// Theo giờ (8 giờ qua): 25 cặp (giờ, câu) đọc nhiều nhất — để thấy câu cũ / câu mới sau mỗi lượt phát hành.
{ const tu8 = new Date(now - 8 * 3600e3).toISOString()
  const j = await fetch('https://api.cloudflare.com/client/v4/graphql', { method: 'POST', headers: H, body: JSON.stringify({ variables: { a: ACC, db: process.env.DB_ID ?? '', tu: tu8, den: now.toISOString() },
    query: `query($a:String!,$db:String!,$tu:Time!,$den:Time!){viewer{accounts(filter:{accountTag:$a}){d1QueriesAdaptiveGroups(limit:25,filter:{databaseId:$db,datetime_geq:$tu,datetime_leq:$den},orderBy:[sum_rowsRead_DESC]){count sum{rowsRead} dimensions{query datetimeHour}}}}}` }) }).then((r) => r.json()).catch(() => null)
  const ds = j?.data?.viewer?.accounts?.[0]?.d1QueriesAdaptiveGroups ?? []
  bangTop.push('', '#### Theo giờ, 8 giờ qua (giờ UTC · hàng đọc · lượt · 90 ký tự đầu)')
  for (const x of ds) bangTop.push(`- ${String(x.dimensions.datetimeHour).slice(5, 16)} · ${so(x.sum.rowsRead)} · ${so(x.count)} · \`${String(x.dimensions.query).replace(/\s+/g, ' ').replace(/[|`]/g, ' ').slice(0, 90)}\``)
  if (!ds.length) bangTop.push(`(không đọc được: ${String((j?.errors ?? []).map((x) => x.message).join(' | ')).split(ACC).join('<tk>').slice(0, 200)})`) }
// 13/11: 25 câu GHI nhiều hàng nhất 24 giờ qua (1 hàng ghi = giá 1.000 hàng đọc ⇒ khoản ghi ~2,9 triệu/ngày là khoản vượt lớn).
{ const j = await fetch('https://api.cloudflare.com/client/v4/graphql', { method: 'POST', headers: H, body: JSON.stringify({ variables: { a: ACC, db: process.env.DB_ID ?? '', tu: tuQ, den: now.toISOString() },
    query: `query($a:String!,$db:String!,$tu:Time!,$den:Time!){viewer{accounts(filter:{accountTag:$a}){d1QueriesAdaptiveGroups(limit:25,filter:{databaseId:$db,datetime_geq:$tu,datetime_leq:$den},orderBy:[sum_rowsWritten_DESC]){count sum{rowsRead rowsWritten} dimensions{query}}}}}` }) }).then((r) => r.json()).catch(() => null)
  const ds = j?.data?.viewer?.accounts?.[0]?.d1QueriesAdaptiveGroups ?? []
  bangTop.push('', '### 25 câu D1 GHI nhiều hàng nhất 24 giờ qua', '', '| Hàng ghi | Hàng đọc | Lượt | Ghi/lượt | Câu (200 ký tự đầu) |', '|---|---|---|---|---|')
  for (const x of ds) bangTop.push(`| ${so(x.sum.rowsWritten)} | ${so(x.sum.rowsRead)} | ${so(x.count)} | ${so(x.sum.rowsWritten / Math.max(1, x.count))} | \`${String(x.dimensions.query).replace(/\s+/g, ' ').replace(/[|`]/g, ' ').slice(0, 200)}\` |`)
  if (!ds.length) bangTop.push(`(không đọc được: ${String((j?.errors ?? []).map((x) => x.message).join(' | ')).split(ACC).join('<tk>').slice(0, 200)})`) }
// 13/11: câu GHI nhiều nhất theo GIỜ (24 giờ) — biết khoản ghi lớn chạy một lần đêm hay rải cả ngày; và lượt gọi / CPU theo tên script (Worker omr vs Pages Functions).
{ const j = await fetch('https://api.cloudflare.com/client/v4/graphql', { method: 'POST', headers: H, body: JSON.stringify({ variables: { a: ACC, db: process.env.DB_ID ?? '', tu: tuQ, den: now.toISOString() },
    query: `query($a:String!,$db:String!,$tu:Time!,$den:Time!){viewer{accounts(filter:{accountTag:$a}){d1QueriesAdaptiveGroups(limit:30,filter:{databaseId:$db,datetime_geq:$tu,datetime_leq:$den},orderBy:[sum_rowsWritten_DESC]){count sum{rowsWritten} dimensions{query datetimeHour}}}}}` }) }).then((r) => r.json()).catch(() => null)
  const ds = j?.data?.viewer?.accounts?.[0]?.d1QueriesAdaptiveGroups ?? []
  bangTop.push('', '#### Câu ghi nhiều nhất theo giờ (giờ UTC · hàng ghi · lượt · 80 ký tự đầu)')
  for (const x of ds) bangTop.push(`- ${String(x.dimensions.datetimeHour).slice(5, 16)} · ${so(x.sum.rowsWritten)} · ${so(x.count)} · \`${String(x.dimensions.query).replace(/\s+/g, ' ').replace(/[|`]/g, ' ').slice(0, 80)}\``)
  const k = await fetch('https://api.cloudflare.com/client/v4/graphql', { method: 'POST', headers: H, body: JSON.stringify({ variables: { a: ACC },
    query: `query($a:String!){viewer{accounts(filter:{accountTag:$a}){workersInvocationsAdaptive(limit:1000,filter:{datetime_geq:"${tuQ}",datetime_leq:"${now.toISOString()}"}){sum{requests cpuTimeUs subrequests} dimensions{scriptName}}}}}` }) }).then((r) => r.json()).catch(() => null)
  const gop = new Map(); for (const x of k?.data?.viewer?.accounts?.[0]?.workersInvocationsAdaptive ?? []) { const o = gop.get(x.dimensions.scriptName) ?? { r: 0, c: 0, s: 0 }; o.r += x.sum.requests; o.c += x.sum.cpuTimeUs / 1000; o.s += x.sum.subrequests; gop.set(x.dimensions.scriptName, o) }
  bangTop.push('', '#### Theo tên script, 24 giờ qua (lượt · CPU ms · lượt gọi phụ)')
  for (const [ten, o] of [...gop].sort((a, b) => b[1].r - a[1].r)) bangTop.push(`- ${ten}: ${so(o.r)} · ${so(o.c)} · ${so(o.s)}`)
  if (!gop.size) bangTop.push(`(không đọc được: ${String((k?.errors ?? []).map((x) => x.message).join(' | ')).split(ACC).join('<tk>').slice(0, 200)})`) }
// 13/11: THEO GIỜ 50 giờ qua (giờ VN) — mọi khoản tính tiền, để so cùng khung giờ trước / sau một lượt phát hành (dự báo cả kỳ tuyến tính nên trễ).
{ const tu50 = new Date(now - 50 * 3600e3).toISOString(), den = now.toISOString()
  const gio = async (ten, than, locThem = '') => { const j = await fetch('https://api.cloudflare.com/client/v4/graphql', { method: 'POST', headers: H, body: JSON.stringify({ variables: { a: ACC },
    query: `query($a:String!){viewer{accounts(filter:{accountTag:$a}){${ten}(limit:10000,filter:{datetime_geq:"${tu50}",datetime_leq:"${den}"${locThem}}){${than}}}}}` }) }).then((r) => r.json()).catch(() => null)
    const m = new Map(); for (const x of j?.data?.viewer?.accounts?.[0]?.[ten] ?? []) { const k = x.dimensions.datetimeHour; const o = m.get(k) ?? {}; for (const [kk, v] of Object.entries(x.sum ?? {})) o[kk] = (o[kk] ?? 0) + (Number(v) || 0); m.set(k, o) } return m }
  const [mD1, mWk, mDo] = await Promise.all([
    gio('d1AnalyticsAdaptiveGroups', 'sum{rowsRead rowsWritten} dimensions{datetimeHour}'),
    gio('workersInvocationsAdaptive', 'sum{requests cpuTimeUs} dimensions{datetimeHour}'),
    gio('durableObjectsInvocationsAdaptiveGroups', 'sum{requests} dimensions{datetimeHour}')])
  const cacGio = [...new Set([...mD1.keys(), ...mWk.keys(), ...mDo.keys()])].sort()
  const vn = (t) => { const d = new Date(new Date(t).getTime() + 7 * 3600e3); return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')} ${String(d.getUTCHours()).padStart(2, '0')}h` }
  bangTop.push('', '### Theo giờ, 50 giờ qua (giờ VN)', '', '| Giờ VN | D1 hàng đọc | D1 hàng ghi | Worker lượt | Worker CPU ms | DO lượt |', '|---|---|---|---|---|---|')
  for (const k of cacGio) { const a = mD1.get(k) ?? {}, w = mWk.get(k) ?? {}, d = mDo.get(k) ?? {}
    bangTop.push(`| ${vn(k)} | ${so(a.rowsRead)} | ${so(a.rowsWritten)} | ${so(w.requests)} | ${so(w.cpuTimeUs == null ? null : w.cpuTimeUs / 1000)} | ${so(d.requests)} |`) } }
// LIVE (thầy 11/11 «phần live có tăng thêm tiền không»): Realtime SFU/TURN (gói gồm 1 TB ra/tháng, vượt 0,05 USD/GB) + Durable Object theo vùng 30 ngày qua.
const tu30 = new Date(now - 30 * 86400e3).toISOString()
const g30 = async (ten, than) => { const j = await fetch('https://api.cloudflare.com/client/v4/graphql', { method: 'POST', headers: H, body: JSON.stringify({ variables: { a: ACC },
  query: `query($a:String!){viewer{accounts(filter:{accountTag:$a}){${ten}(limit:10000,filter:{datetime_geq:"${tu30}",datetime_leq:"${now.toISOString()}"}){${than}}}}}` }) }).then((r) => r.json()).catch(() => null)
  if (!j || j.errors?.length) return { loi: String((j?.errors ?? []).map((x) => x.message).join(' | ')).split(ACC).join('<tk>').slice(0, 160) }
  return { ds: j.data?.viewer?.accounts?.[0]?.[ten] ?? [] } }
const bangLive = ['\n### Live — 30 ngày qua', '']
for (const ten of ['callsUsageAdaptiveGroups', 'callsTurnUsageAdaptiveGroups']) {
  const r = await g30(ten, 'sum{egressBytes ingressBytes} dimensions{date}')
  if (r.loi) { bangLive.push(`- ${ten}: không đọc được (${r.loi})`); continue }
  const ra = r.ds.reduce((a, x) => a + (Number(x.sum?.egressBytes) || 0), 0), vao = r.ds.reduce((a, x) => a + (Number(x.sum?.ingressBytes) || 0), 0)
  const ngay = r.ds.filter((x) => Number(x.sum?.egressBytes) > 0).map((x) => `${x.dimensions.date}: ${(x.sum.egressBytes / 1e9).toFixed(3)} GB`).sort()
  bangLive.push(`- ${ten}: ra ${(ra / 1e9).toFixed(3)} GB, vào ${(vao / 1e9).toFixed(3)} GB (gói 1.000 GB ra/tháng) · ${ngay.slice(-8).join(' · ') || 'không ngày nào có'}`)
}
{ const r = await g30('durableObjectsPeriodicGroups', 'sum{activeTime inboundWebsocketMsgCount outboundWebsocketMsgCount} dimensions{namespaceId}')
  const ns = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACC}/workers/durable_objects/namespaces?per_page=100`, { headers: H }).then((x) => x.json()).catch(() => null)
  const ten = new Map((ns?.result ?? []).map((x) => [x.id, x.class]))
  const gop = new Map()
  for (const x of r.ds ?? []) { const k = ten.get(x.dimensions.namespaceId) ?? 'khác'; const o = gop.get(k) ?? { s: 0, vao: 0, ra: 0 }; o.s += x.sum.activeTime / 1e6; o.vao += x.sum.inboundWebsocketMsgCount; o.ra += x.sum.outboundWebsocketMsgCount; gop.set(k, o) }
  for (const [k, o] of [...gop].sort((a, b) => b[1].s - a[1].s)) bangLive.push(`- DO ${k}: chạy ${so(o.s)} giây = ${so(o.s * 0.128)} GB-s · tin WebSocket vào ${so(o.vao)}, ra ${so(o.ra)}`)
  if (r.loi) bangLive.push(`- DO: không đọc được (${r.loi})`) }
const ket = `\n**Dự báo hoá đơn kỳ này: ${tongDuBao.toFixed(2)} USD** (5 USD gói + phần vượt; chưa gồm Workers Logs — khoá chưa có quyền đọc).`
const ra = `## Chi phí Cloudflare — ${now.toISOString().slice(0, 16)} UTC\n\n${bang.join('\n')}\n${ket}\n${bangTop.join('\n')}\n${bangLive.join('\n')}\n`
console.log(ra)
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, ra)
// Đỏ khi dự báo vượt 6 USD (chừa 1 USD cho sai số dự báo của mấy ngày đầu kỳ).
if (tongDuBao > 6 && soNgay >= 1) { console.log(`::error::Dự báo ${tongDuBao.toFixed(2)} USD > 6 USD — xem bảng, giảm khoản vượt.`); process.exit(1) }
