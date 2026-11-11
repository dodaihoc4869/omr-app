// ĐO CHI PHÍ CLOUDFLARE (CHỈ ĐỌC, 11/11 — thầy: «Tôi chỉ đk gói 5 đô tại sao lại trừ vậy [127,61 USD lúc 17:30 11/11]. Tìm hiểu kĩ nguyên nhân»).
// Chỉ GỌI ĐỌC: REST gói đăng ký / lịch sử hoá đơn (in đúng vài trường không bí mật) + GraphQL Analytics số dùng theo ngày của từng dịch vụ.
// KHÔNG đọc D1 bằng SELECT (tránh cộng thêm hàng đọc khi D1 vừa quá tải), không ghi gì, không in khoá / mã tài khoản / địa chỉ / email.
const TOKEN = process.env.CF_TOKEN_SACH, ACC = process.env.CF_ACC_SACH, DB = process.env.DB_ID
// GraphQL giới hạn khoảng ≤ 4 tuần 4 ngày ⇒ 11/10 → 11/11 (đúng một kỳ hoá đơn nếu kỳ chốt ngày 11)
const TU = process.env.TU ?? '2026-10-11', DEN = process.env.DEN ?? '2026-11-11'
const H = { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' }
const an = (s) => String(s ?? '').split(ACC).join('<tk>')
const rest = async (duong) => { try { const r = await fetch(`https://api.cloudflare.com/client/v4${duong.replace('{acc}', ACC)}`, { headers: H }); let j = null; try { j = await r.json() } catch { /* không phải JSON */ } return { st: r.status, j } } catch (e) { return { st: 0, j: null, loi: String(e).slice(0, 120) } } }
const gql = async (query, variables = {}) => { const r = await fetch('https://api.cloudflare.com/client/v4/graphql', { method: 'POST', headers: H, body: JSON.stringify({ query, variables }) }); return r.json() }
const loiNgan = (e) => an((e ?? []).map((x) => x.message).join(' | ')).slice(0, 300)

console.log(`# Khoảng ngày (UTC): ${TU} → ${DEN}`)
// 0. Đối chiếu mã vùng Durable Object → tên lớp / Worker; danh sách Worker (tên, ngày sửa) — chỉ đọc
{ const r = await rest('/accounts/{acc}/workers/durable_objects/namespaces?per_page=100'); console.log(`\n## 0a. Vùng Durable Object: HTTP ${r.st} ${r.j?.success === false ? loiNgan(r.j.errors) : ''}`)
  for (const x of r.j?.result ?? []) console.log(JSON.stringify({ id: x.id, lop: x.class, worker: x.script, ten: x.name, sqlite: x.use_sqlite })) }
{ const r = await rest('/accounts/{acc}/workers/scripts'); console.log(`\n## 0b. Worker: HTTP ${r.st} ${r.j?.success === false ? loiNgan(r.j.errors) : ''}`)
  for (const x of r.j?.result ?? []) console.log(JSON.stringify({ ten: x.id, tao: x.created_on, sua: x.modified_on, nhatKy: x.observability ?? x.logpush ?? null, cron: x.has_modules === undefined ? undefined : null })) }
if (process.env.CHI_NS === '1') process.exit(0)
// LƯỢT 7 (CHI_NS=2): mọi D1 của tài khoản · Worker thử còn gắn D1 thật / còn lịch chạy không · lượt gọi theo Worker theo ngày · Durable Object hàng đọc/ghi
if (process.env.CHI_NS === '2') {
  const T0 = '2026-10-11T00:00:00Z', T1 = '2026-11-10T23:59:59Z'
  { const r = await rest('/accounts/{acc}/d1/database?per_page=100'); console.log(`\n## 7a. Mọi D1: HTTP ${r.st}`)
    for (const x of r.j?.result ?? []) console.log(JSON.stringify({ id: x.uuid, ten: x.name, coMB: x.file_size ? Math.round(x.file_size / 1e6) : null, tao: x.created_at })) }
  for (const w of ['omr-thu', 'omr-thu-tai']) {
    const a = await rest(`/accounts/{acc}/workers/scripts/${w}/settings`)
    console.log(`\n## 7b. ${w} — gắn kết: HTTP ${a.st}`)
    for (const b of a.j?.result?.bindings ?? []) console.log('  ', JSON.stringify({ loai: b.type, ten: b.name, d1: b.id ?? b.database_id, lop: b.class_name, bucket: b.bucket_name }))
    const c = await rest(`/accounts/{acc}/workers/scripts/${w}/schedules`)
    console.log(`   lịch chạy: HTTP ${c.st} ${JSON.stringify((c.j?.result?.schedules ?? []).map((x) => x.cron))}`)
  }
  const q = async (ten, than, loc) => { const j = await gql(`query($a:String!){viewer{accounts(filter:{accountTag:$a}){${ten}(limit:10000,filter:${loc}){${than}}}}}`, { a: ACC }); if (j.errors?.length) { console.log(`LỖI ${ten}: ${loiNgan(j.errors)}`); return [] } return j?.data?.viewer?.accounts?.[0]?.[ten] ?? [] }
  const L = `{datetime_geq:"${T0}",datetime_leq:"${T1}"}`
  console.log('\n## 7c. D1 theo từng database (11/10 → hết 10/11 UTC)')
  for (const x of await q('d1AnalyticsAdaptiveGroups', 'sum{rowsRead rowsWritten readQueries writeQueries} dimensions{databaseId}', L)) console.log(JSON.stringify({ db: x.dimensions.databaseId, ...x.sum }))
  console.log('\n## 7d. Worker thử theo ngày (lượt gọi, CPU ms)')
  for (const x of await q('workersInvocationsAdaptive', 'sum{requests cpuTimeUs} dimensions{date scriptName}', `{datetime_geq:"2026-10-25T00:00:00Z",datetime_leq:"2026-11-11T10:00:00Z",scriptName_in:["omr-thu","omr-thu-tai"]}`)) console.log(x.dimensions.date, x.dimensions.scriptName, x.sum.requests, Math.round(x.sum.cpuTimeUs / 1000))
  console.log('\n## 7e. Durable Object theo vùng — hàng đọc / ghi / tin WebSocket vào (11/10 → hết 10/11)')
  for (const x of await q('durableObjectsPeriodicGroups', 'sum{activeTime rowsRead rowsWritten inboundWebsocketMsgCount} dimensions{namespaceId}', L)) console.log(JSON.stringify({ vung: x.dimensions.namespaceId, giayChay: Math.round(x.sum.activeTime / 1e6), ...x.sum, activeTime: undefined }))
  console.log('\n## 7f. Tổng kỳ 11/10 → hết 10/11 (bỏ 11/11)')
  for (const [ten, than] of [['d1AnalyticsAdaptiveGroups', 'sum{rowsRead rowsWritten}'], ['workersInvocationsAdaptive', 'sum{requests cpuTimeUs}'], ['durableObjectsInvocationsAdaptiveGroups', 'sum{requests}'], ['durableObjectsPeriodicGroups', 'sum{activeTime}']]) for (const x of await q(ten, than, L)) console.log(ten, JSON.stringify(x.sum))
  process.exit(0)
}
// ───────── 1. HOÁ ĐƠN / GÓI ĐĂNG KÝ (REST) ─────────
console.log('\n## 1a. Gói đăng ký của tài khoản (/accounts/{acc}/subscriptions)')
{ const r = await rest('/accounts/{acc}/subscriptions'); console.log(`HTTP ${r.st} ${r.j?.success === false ? loiNgan(r.j.errors) : ''}`)
  for (const s of r.j?.result ?? []) console.log(JSON.stringify({ ten: s.rate_plan?.public_name ?? s.rate_plan?.id ?? s.product?.name, gia: s.price, tien: s.currency, chuKy: s.frequency, trangThai: s.state,
    tuNgay: s.current_period_start, denNgay: s.current_period_end, thanhPhan: (s.component_values ?? []).map((c) => ({ ten: c.name, gt: c.value, mac: c.default, gia: c.price })) })) }
console.log('\n## 1b. Lịch sử hoá đơn (/user/billing/history) — chỉ loại, mô tả, lúc, số tiền')
{ const r = await rest('/user/billing/history?per_page=50&order=occurred_at&direction=desc'); console.log(`HTTP ${r.st} ${r.j?.success === false ? loiNgan(r.j.errors) : ''}`)
  for (const x of r.j?.result ?? []) console.log(JSON.stringify({ loai: x.type, viec: x.action, moTa: x.description, luc: x.occurred_at, tien: x.amount, dv: x.currency })) }
for (const duong of ['/accounts/{acc}/billing/usage', '/accounts/{acc}/billing/usage/paygo', '/accounts/{acc}/paygo/usage', '/user/subscriptions']) {
  const r = await rest(duong)
  console.log(`\n## 1c. ${duong.replace('{acc}', '<tk>')}: HTTP ${r.st} ${r.j?.success === false ? loiNgan(r.j.errors) : ''}`)
  const ds = Array.isArray(r.j?.result) ? r.j.result : r.j?.result ? [r.j.result] : []
  for (const x of ds.slice(0, 60)) { const o = {}; for (const [k, v] of Object.entries(x ?? {})) if (!/email|address|name_on|first_name|last_name|phone|card|vat|tax_id|city|zip|state_or|country/i.test(k) && (typeof v !== 'object' || v === null)) o[k] = v; console.log(an(JSON.stringify(o)).slice(0, 400)) }
}
console.log('\n## 1d. D1: cỡ, bản sao đọc')
{ const r = await rest(`/accounts/{acc}/d1/database/${DB}`); const x = r.j?.result ?? {}; console.log(`HTTP ${r.st}`, JSON.stringify({ coMB: x.file_size ? Math.round(x.file_size / 1e6) : null, soBang: x.num_tables, banSaoDoc: x.read_replication, vung: x.running_in_region ?? x.version })) }

// ───────── 2. SỐ DÙNG THEO NGÀY (GraphQL Analytics) — truy vấn viết thẳng, mỗi bộ thử vài dạng, in lỗi nếu hỏng ─────────
const tongKy = []
const L = (x) => `{datetime_geq:"${TU}T00:00:00Z",datetime_leq:"${DEN}T10:00:00Z"${x ? ',' + x : ''}}`
const LD = (x) => `{date_geq:"${TU}",date_leq:"2026-11-10"${x ? ',' + x : ''}}`
async function bo(ten, bienThe) {
  console.log(`\n### ${ten}`)
  let loi = []
  for (const [loc, than] of bienThe) {
    const j = await gql(`query($a:String!){viewer{accounts(filter:{accountTag:$a}){${ten}(limit:10000,filter:${loc}){${than}}}}}`, { a: ACC })
    if (j.errors?.length) { loi.push(loiNgan(j.errors).slice(0, 160)); continue }
    const ds = j?.data?.viewer?.accounts?.[0]?.[ten] ?? []
    const theoNgay = new Map(), theoPh = new Map(), tong = {}
    for (const x of ds) {
      const d = x.dimensions ?? {}, ngay = String(d.date ?? d.datetimeHour ?? d.datetimeMinute ?? '').slice(0, 10)
      const ph = Object.entries(d).filter(([k]) => !/^(date|datetime)/.test(k)).map(([k, v]) => `${k}=${v}`).join(' ')
      for (const k of ['sum', 'max']) for (const [tt, v] of Object.entries(x[k] ?? {})) { if (typeof v !== 'number') continue
        const t = `${k}.${tt}`, gop = k === 'sum' ? (a, b) => a + b : Math.max
        const n = theoNgay.get(ngay) ?? {}; n[t] = gop(n[t] ?? 0, v); theoNgay.set(ngay, n)
        if (ph) { const p = theoPh.get(ph) ?? {}; p[t] = gop(p[t] ?? 0, v); theoPh.set(ph, p) }
        tong[t] = gop(tong[t] ?? 0, v) }
    }
    const tron = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v).map(([k, v]) => [k, Math.round(v)]))
    for (const [ngay, o] of [...theoNgay].sort()) console.log(ngay, JSON.stringify(tron(o)))
    for (const [k, o] of [...theoPh].slice(0, 30)) console.log('  ·', an(k), JSON.stringify(tron(o)))
    console.log('  TỔNG', JSON.stringify(tron(tong)))
    tongKy.push([ten, tron(tong)])
    return
  }
  console.log('LỖI: ' + loi.join(' || '))
}
const DBL = `databaseId:"${DB}"`
await bo('d1AnalyticsAdaptiveGroups', [[L(DBL), 'sum{readQueries writeQueries rowsRead rowsWritten} dimensions{date}'], [L(DBL), 'sum{readQueries writeQueries rowsRead rowsWritten} dimensions{datetimeHour}']])
await bo('d1StorageAdaptiveGroups', [[L(DBL), 'max{databaseSizeBytes} dimensions{date}'], [LD(DBL), 'max{databaseSizeBytes} dimensions{date}']])
await bo('workersInvocationsAdaptive', [[L(''), 'sum{requests errors subrequests cpuTimeUs wallTime} dimensions{date scriptName}'], [L(''), 'sum{requests errors subrequests} dimensions{date scriptName}']])
await bo('durableObjectsInvocationsAdaptiveGroups', [[L(''), 'sum{requests wallTime responseBodySize errors} dimensions{date scriptName}'], [L(''), 'sum{requests} dimensions{date}']])
await bo('durableObjectsPeriodicGroups', [[L(''), 'sum{activeTime cpuTime storageReadUnits storageWriteUnits subrequests inboundWebsocketMsgCount outboundWebsocketMsgCount} dimensions{date namespaceId}'], [L(''), 'sum{activeTime cpuTime} dimensions{date}']])
await bo('durableObjectsSqlStorageGroups', [[L(''), 'max{storedBytes} dimensions{date}'], [LD(''), 'max{storedBytes} dimensions{date}']])
await bo('durableObjectsStorageGroups', [[L(''), 'max{storedBytes} dimensions{date}'], [LD(''), 'max{storedBytes} dimensions{date}']])
await bo('r2OperationsAdaptiveGroups', [[L(''), 'sum{requests} dimensions{date actionType}']])
await bo('r2StorageAdaptiveGroups', [[L(''), 'max{payloadSize metadataSize objectCount} dimensions{date}']])
await bo('aiInferenceAdaptiveGroups', [[L(''), 'sum{totalNeurons totalInputTokens totalOutputTokens} dimensions{date}'], [L(''), 'sum{totalNeurons} dimensions{date}'], [L(''), 'count dimensions{date}']])
await bo('callsUsageAdaptiveGroups', [[L(''), 'sum{egressBytes ingressBytes} dimensions{date}'], [LD(''), 'sum{egressBytes ingressBytes} dimensions{date}']])
await bo('callsTurnUsageAdaptiveGroups', [[L(''), 'sum{egressBytes ingressBytes} dimensions{date}'], [LD(''), 'sum{egressBytes ingressBytes} dimensions{date}']])

// ───────── 2b. Nhật ký Worker (Workers Logs — tính phí theo số sự kiện): đếm qua API Telemetry nếu khoá có quyền ─────────
for (const [tu, den] of [['2026-10-11', '2026-11-11'], ['2026-11-10', '2026-11-11']]) {
  try {
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACC}/workers/observability/telemetry/query`, { method: 'POST', headers: H,
      body: JSON.stringify({ queryId: 'dem-su-kien', timeframe: { from: Date.parse(`${tu}T00:00:00Z`), to: Date.parse(`${den}T00:00:00Z`) }, view: 'calculations', limit: 10,
        parameters: { datasets: ['cloudflare-workers'], calculations: [{ operator: 'count', alias: 'soSuKien' }], filters: [], groupBys: [] } }) })
    const j = await r.json().catch(() => null)
    console.log(`\n## 2b. Workers Logs ${tu} → ${den}: HTTP ${r.status} ${j?.success === false ? loiNgan(j.errors) : ''} ${an(JSON.stringify(j?.result?.calculations ?? j?.result ?? '').slice(0, 600))}`)
  } catch (e) { console.log('2b lỗi', String(e).slice(0, 120)) }
}

if (process.env.MUC3 === '1') {} // mục 3 (15 câu D1 ghi / đọc nhiều nhất) đã chạy lượt #1 — bỏ cho nhật ký gọn
console.log('\n## TỔNG CẢ KHOẢNG (từng bộ số liệu)'); for (const [t, o] of tongKy) console.log(t, JSON.stringify(o))
