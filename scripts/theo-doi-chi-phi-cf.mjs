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
const jq = await fetch('https://api.cloudflare.com/client/v4/graphql', { method: 'POST', headers: H, body: JSON.stringify({ variables: { a: ACC, db: process.env.DB_ID ?? '', tu: tuQ, den: now.toISOString() },
  query: `query($a:String!,$db:String!,$tu:Time!,$den:Time!){viewer{accounts(filter:{accountTag:$a}){d1QueriesAdaptiveGroups(limit:15,filter:{databaseId:$db,datetime_geq:$tu,datetime_leq:$den},orderBy:[sum_rowsRead_DESC]){count sum{rowsRead rowsWritten} dimensions{query}}}}}` }) }).then((r) => r.json()).catch(() => null)
const top = jq?.data?.viewer?.accounts?.[0]?.d1QueriesAdaptiveGroups ?? []
const bangTop = ['\n### 15 câu D1 đọc nhiều hàng nhất 24 giờ qua', '', '| Hàng đọc | Lượt | Hàng/lượt | Câu (200 ký tự đầu) |', '|---|---|---|---|',
  ...top.map((x) => `| ${so(x.sum.rowsRead)} | ${so(x.count)} | ${so(x.sum.rowsRead / Math.max(1, x.count))} | \`${String(x.dimensions.query).replace(/\s+/g, ' ').replace(/[|`]/g, ' ').slice(0, 200)}\` |`)]
if (!top.length) bangTop.push(`(không đọc được: ${String((jq?.errors ?? []).map((x) => x.message).join(' | ')).split(ACC).join('<tk>').slice(0, 200)})`)
const ket = `\n**Dự báo hoá đơn kỳ này: ${tongDuBao.toFixed(2)} USD** (5 USD gói + phần vượt; chưa gồm Workers Logs — khoá chưa có quyền đọc).`
const ra = `## Chi phí Cloudflare — ${now.toISOString().slice(0, 16)} UTC\n\n${bang.join('\n')}\n${ket}\n${bangTop.join('\n')}\n`
console.log(ra)
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, ra)
// Đỏ khi dự báo vượt 6 USD (chừa 1 USD cho sai số dự báo của mấy ngày đầu kỳ).
if (tongDuBao > 6 && soNgay >= 1) { console.log(`::error::Dự báo ${tongDuBao.toFixed(2)} USD > 6 USD — xem bảng, giảm khoản vượt.`); process.exit(1) }
