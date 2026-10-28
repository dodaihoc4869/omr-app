// THỬ TẢI 28/10 — MỐC SO SÁNH từ bản thật: CHỈ ĐỌC GraphQL Analytics (không gọi D1 thật, không đọc dòng nào).
// Worker `omr` + D1 thật theo GIỜ trong khung 19:00–23:59 VN của 5 tối gần nhất: số yêu cầu, thời gian chạy p50/p90/p99, số câu D1, số dòng đọc.
// Dùng để biết tải bản sao (270 em) có gần giờ cao điểm thật không. Env: CF_TOKEN_SACH, CF_ACC_SACH, DB_THAT.
const { CF_TOKEN_SACH: TOKEN, CF_ACC_SACH: ACC, DB_THAT } = process.env
const H = { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' }
const hoi = async (ten, query, variables) => {
  const r = await fetch('https://api.cloudflare.com/client/v4/graphql', { method: 'POST', headers: H, body: JSON.stringify({ query, variables }) })
  const j = await r.json(); if (j.errors?.length) console.log(`(${ten}) LỖI GraphQL:`, JSON.stringify(j.errors).slice(0, 300)); return j.data?.viewer?.accounts?.[0]
}
const homNay = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10)
for (let lui = 5; lui >= 1; lui--) {
  const ngay = new Date(Date.parse(homNay) - lui * 86400_000).toISOString().slice(0, 10)
  const tu = new Date(Date.parse(`${ngay}T19:00:00+07:00`)).toISOString(), den = new Date(Date.parse(`${ngay}T23:59:59+07:00`)).toISOString()
  const v = { acc: ACC, db: DB_THAT, tu, den }
  const w = await hoi('worker', `query($acc:String!,$tu:Time!,$den:Time!){viewer{accounts(filter:{accountTag:$acc}){
    workersInvocationsAdaptive(limit:24,filter:{scriptName:"omr",datetime_geq:$tu,datetime_leq:$den},orderBy:[datetimeHour_ASC]){
    dimensions{datetimeHour} sum{requests errors} quantiles{wallTimeP50 wallTimeP90 wallTimeP99 cpuTimeP99}}}}}`, v)
  const d = await hoi('d1', `query($acc:String!,$db:String!,$tu:Time!,$den:Time!){viewer{accounts(filter:{accountTag:$acc}){
    d1AnalyticsAdaptiveGroups(limit:24,filter:{databaseId:$db,datetime_geq:$tu,datetime_leq:$den},orderBy:[datetimeHour_ASC]){
    dimensions{datetimeHour} sum{readQueries writeQueries rowsRead rowsWritten} quantiles{queryBatchTimeMsP50 queryBatchTimeMsP90}}}}}`, v)
  const dm = new Map((d?.d1AnalyticsAdaptiveGroups ?? []).map((x) => [x.dimensions.datetimeHour, x]))
  for (const x of w?.workersInvocationsAdaptive ?? []) {
    const gio = String((new Date(x.dimensions.datetimeHour).getUTCHours() + 7) % 24).padStart(2, '0')
    const y = dm.get(x.dimensions.datetimeHour)
    console.log([`${ngay} ${gio}h`, `yc/phút=${Math.round(x.sum.requests / 60)}`, `loi=${x.sum.errors}`, `wall50=${Math.round(x.quantiles.wallTimeP50 / 1000)}ms`, `wall90=${Math.round(x.quantiles.wallTimeP90 / 1000)}ms`, `wall99=${Math.round(x.quantiles.wallTimeP99 / 1000)}ms`, `cpu99=${Math.round(x.quantiles.cpuTimeP99 / 1000)}ms`,
      y ? `d1doc/phút=${Math.round(y.sum.readQueries / 60)} d1ghi/phút=${Math.round(y.sum.writeQueries / 60)} hàngĐọc/phút=${Math.round(y.sum.rowsRead / 60)} lo90=${y.quantiles.queryBatchTimeMsP90?.toFixed?.(1)}ms` : ''].join(' '))
  }
}
