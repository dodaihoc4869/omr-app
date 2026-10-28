// THỬ TẢI 28/10 — số đo PHÍA MÁY CHỦ của bản sao (CHỈ ĐỌC GraphQL Analytics): Worker `omr-thu-tai` theo phút (yêu cầu, lỗi, thời gian, CPU)
// + D1 sao (thời gian lô truy vấn, số câu đọc/ghi, hàng đọc) + 15 nhóm câu SQL nặng nhất (SQL rút gọn, không tham số). Không có dữ liệu học sinh.
// Env: CF_TOKEN_SACH, CF_ACC_SACH, DB_ID (D1 SAO), TU, DEN (ISO).
const { CF_TOKEN_SACH: TOKEN, CF_ACC_SACH: ACC, DB_ID, TU, DEN } = process.env
if (DB_ID === 'd2e6d322-374a-45d7-83a3-9fac486b23f1') { console.error('DỪNG: đây là D1 thật'); process.exit(1) }
const H = { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' }
const hoi = async (ten, query, variables) => {
  const r = await fetch('https://api.cloudflare.com/client/v4/graphql', { method: 'POST', headers: H, body: JSON.stringify({ query, variables }) })
  const j = await r.json(); if (j.errors?.length) console.log(`(${ten}) LỖI GraphQL:`, JSON.stringify(j.errors).slice(0, 400)); return j.data?.viewer?.accounts?.[0]
}
const v = { acc: ACC, tu: TU, den: DEN, db: DB_ID }
console.log(`=== Worker omr-thu-tai theo phút ${TU} → ${DEN} ===`)
const truyW = (qs) => `query($acc:String!,$tu:Time!,$den:Time!){viewer{accounts(filter:{accountTag:$acc}){
  workersInvocationsAdaptive(limit:60,filter:{scriptName:"omr-thu-tai",datetime_geq:$tu,datetime_leq:$den},orderBy:[datetimeMinute_ASC]){
  dimensions{datetimeMinute} sum{requests errors subrequests} quantiles{${qs}}}}}}`
let w = await hoi('worker', truyW('durationP50 durationP90 durationP99 cpuTimeP50 cpuTimeP99 wallTimeP50 wallTimeP90 wallTimeP99'), v)
if (!w) w = await hoi('worker (không wallTime)', truyW('durationP50 durationP90 durationP99 cpuTimeP50 cpuTimeP99'), v)
let tong = 0, loi = 0
for (const x of w?.workersInvocationsAdaptive ?? []) {
  tong += x.sum.requests; loi += x.sum.errors
  const q = x.quantiles
  console.log([x.dimensions.datetimeMinute.slice(11, 16), `yc=${x.sum.requests}`, `loi=${x.sum.errors}`, `wall50=${Math.round(q.wallTimeP50 / 1000)}ms`, `wall90=${Math.round(q.wallTimeP90 / 1000)}ms`, `wall99=${Math.round(q.wallTimeP99 / 1000)}ms`, `dur90=${q.durationP90}`, `dur99=${q.durationP99}`, `cpu50=${(q.cpuTimeP50 / 1000).toFixed(1)}ms`, `cpu99=${(q.cpuTimeP99 / 1000).toFixed(1)}ms`, `dur50=${q.durationP50}`].join(' '))
}
console.log(`TỔNG: yêu cầu=${tong} lỗi=${loi}`)
const st = await hoi('trạng thái', `query($acc:String!,$tu:Time!,$den:Time!){viewer{accounts(filter:{accountTag:$acc}){
  workersInvocationsAdaptive(limit:20,filter:{scriptName:"omr-thu-tai",datetime_geq:$tu,datetime_leq:$den}){dimensions{status} sum{requests}}}}}`, v)
console.log('Trạng thái lượt chạy:', (st?.workersInvocationsAdaptive ?? []).map((x) => `${x.dimensions.status}=${x.sum.requests}`).join(' '))
console.log('=== D1 sao theo phút ===')
const d = await hoi('d1', `query($acc:String!,$db:String!,$tu:Time!,$den:Time!){viewer{accounts(filter:{accountTag:$acc}){
  d1AnalyticsAdaptiveGroups(limit:60,filter:{databaseId:$db,datetime_geq:$tu,datetime_leq:$den},orderBy:[datetimeMinute_ASC]){
  dimensions{datetimeMinute} sum{readQueries writeQueries rowsRead rowsWritten} quantiles{queryBatchTimeMsP50 queryBatchTimeMsP90}}}}}`, v)
for (const x of d?.d1AnalyticsAdaptiveGroups ?? []) console.log([x.dimensions.datetimeMinute.slice(11, 16), `doc=${x.sum.readQueries}`, `ghi=${x.sum.writeQueries}`, `hangDoc=${x.sum.rowsRead}`, `hangGhi=${x.sum.rowsWritten}`, `lo50=${x.quantiles.queryBatchTimeMsP50?.toFixed?.(1)}ms`, `lo90=${x.quantiles.queryBatchTimeMsP90?.toFixed?.(1)}ms`].join(' '))
console.log('=== D1 sao: 15 nhóm câu nặng nhất (tổng thời gian) ===')
const q = await hoi('d1 câu', `query($acc:String!,$db:String!,$tu:Time!,$den:Time!){viewer{accounts(filter:{accountTag:$acc}){
  d1QueriesAdaptiveGroups(limit:60,filter:{databaseId:$db,datetime_geq:$tu,datetime_leq:$den},orderBy:[sum_queryDurationMs_DESC]){
  count sum{queryDurationMs rowsRead rowsWritten} quantiles{queryDurationMsP50 queryDurationMsP95} dimensions{query}}}}}`, v)
const ds = q?.d1QueriesAdaptiveGroups ?? []
console.log(`Tổng thời gian D1 (60 nhóm đầu): ${Math.round(ds.reduce((n, x) => n + x.sum.queryDurationMs, 0) / 1000)} s`)
for (const x of ds.slice(0, 15)) console.log([`lan=${x.count}`, `tongS=${(x.sum.queryDurationMs / 1000).toFixed(1)}`, `tbMs=${(x.sum.queryDurationMs / Math.max(1, x.count)).toFixed(1)}`, `p95=${x.quantiles?.queryDurationMsP95?.toFixed?.(1)}`, `docTB=${Math.round(x.sum.rowsRead / Math.max(1, x.count))}`, `ghi=${x.sum.rowsWritten}`, '|', String(x.dimensions.query).replace(/\s+/g, ' ').replace(/'[^']*'/g, "'…'").slice(0, 260)].join(' '))
