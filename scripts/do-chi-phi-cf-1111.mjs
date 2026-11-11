// ĐO CHI PHÍ CLOUDFLARE (CHỈ ĐỌC, 11/11 — thầy: «Tôi chỉ đk gói 5 đô tại sao lại trừ vậy [127,61 USD lúc 17:30 11/11]. Tìm hiểu kĩ nguyên nhân»).
// Chỉ GỌI ĐỌC: REST gói đăng ký / lịch sử hoá đơn (in đúng vài trường không bí mật) + GraphQL Analytics số dùng theo ngày của từng dịch vụ.
// KHÔNG đọc D1 bằng SELECT (tránh cộng thêm hàng đọc khi D1 vừa quá tải), không ghi gì, không in khoá / mã tài khoản / địa chỉ / email.
const TOKEN = process.env.CF_TOKEN_SACH, ACC = process.env.CF_ACC_SACH, DB = process.env.DB_ID
const TU = process.env.TU ?? '2026-10-05', DEN = process.env.DEN ?? '2026-11-11'
const H = { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' }
const an = (s) => String(s ?? '').split(ACC).join('<tk>')
const rest = async (duong) => { try { const r = await fetch(`https://api.cloudflare.com/client/v4${duong.replace('{acc}', ACC)}`, { headers: H }); let j = null; try { j = await r.json() } catch { /* không phải JSON */ } return { st: r.status, j } } catch (e) { return { st: 0, j: null, loi: String(e).slice(0, 120) } } }
const gql = async (query, variables = {}) => { const r = await fetch('https://api.cloudflare.com/client/v4/graphql', { method: 'POST', headers: H, body: JSON.stringify({ query, variables }) }); return r.json() }
const loiNgan = (e) => an((e ?? []).map((x) => x.message).join(' | ')).slice(0, 300)

console.log(`# Khoảng ngày (UTC): ${TU} → ${DEN}`)
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

// ───────── 2. SỐ DÙNG THEO NGÀY (GraphQL Analytics) ─────────
const tenKieu = (t) => t?.name ?? t?.ofType?.name ?? t?.ofType?.ofType?.name ?? t?.ofType?.ofType?.ofType?.name
const kieu = new Map()
async function truong(ten) { if (kieu.has(ten)) return kieu.get(ten); const j = await gql(`query($n:String!){__type(name:$n){fields{name type{name kind ofType{name kind ofType{name kind ofType{name}}}}} inputFields{name}}}`, { n: ten }); const t = j?.data?.__type ?? null; kieu.set(ten, t); return t }
const acct = await truong('account')
const dsBo = (acct?.fields ?? []).map((f) => ({ ten: f.name, kieu: tenKieu(f.type) }))
const QUAN_TAM = /^(d1|durableObjects|workersInvocations|workersSubrequests|r2|ai|calls|realtime|workersObservability|workersLogs|observability|kv|queue|pagesFunctions|workersAnalyticsEngine|containers|workflows|hyperdrive|vectorize|browser)/i
const chon = dsBo.filter((d) => QUAN_TAM.test(d.ten))
console.log(`\n## 2. Bộ số liệu (dataset) liên quan có trên tài khoản: ${chon.map((d) => d.ten).join(', ')}`)
const SO = new Set(['Int', 'Float', 'Uint64', 'Int64', 'uint64', 'int64', 'float64', 'float32', 'uint32', 'int32', 'Uint32', 'Float64'])
const tongKy = []
for (const d of chon) {
  const t = await truong(d.kieu)
  const f = new Map((t?.fields ?? []).map((x) => [x.name, tenKieu(x.type)]))
  const nhom = []
  for (const k of ['sum', 'max', 'avg']) if (f.has(k)) { const tt = await truong(f.get(k)); const so = (tt?.fields ?? []).filter((x) => SO.has(tenKieu(x.type)) || /^(U?Int|Float)/.test(tenKieu(x.type) ?? '')).map((x) => x.name); if (so.length) nhom.push(`${k}{${so.join(' ')}}`) }
  if (f.has('count')) nhom.push('count')
  const dimT = f.has('dimensions') ? await truong(f.get('dimensions')) : null, dims = new Set((dimT?.fields ?? []).map((x) => x.name))
  const dNgay = dims.has('date') ? 'date' : dims.has('datetimeDay') ? 'datetimeDay' : dims.has('datetimeHour') ? 'datetimeHour' : null
  // lọc theo ngày: xem kiểu filter
  const accF = (acct?.fields ?? []).find((x) => x.name === d.ten)
  const fArg = await (async () => { const j = await gql(`query{__type(name:"account"){fields{name args{name type{name ofType{name}}}}}}`); const a = j?.data?.__type?.fields?.find((x) => x.name === d.ten)?.args?.find((x) => x.name === 'filter'); return tenKieu(a?.type) })()
  const fT = fArg ? await truong(fArg) : null, fIn = new Set((fT?.inputFields ?? []).map((x) => x.name))
  const loc = fIn.has('date_geq') ? `{date_geq:"${TU}",date_leq:"${DEN}"}` : fIn.has('datetime_geq') ? `{datetime_geq:"${TU}T00:00:00Z",datetime_leq:"${DEN}T23:59:59Z"}` : fIn.has('datetimeHour_geq') ? `{datetimeHour_geq:"${TU}T00:00:00Z",datetimeHour_leq:"${DEN}T23:00:00Z"}` : null
  if (!nhom.length || !loc) { console.log(`\n### ${d.ten}: bỏ qua (không có nhóm số hoặc không lọc được theo ngày)`); continue }
  const ph = [...dims].filter((x) => /^(scriptName|namespaceId|actionType|bucketName|modelId|model|databaseId|status|storageClass)$/.test(x))
  const dimQ = `dimensions{${[dNgay, ...ph].filter(Boolean).join(' ')}}`
  const q = `query($a:String!){viewer{accounts(filter:{accountTag:$a}){${d.ten}(limit:9999,filter:${loc}${dNgay ? `,orderBy:[${dNgay}_ASC]` : ''}){${nhom.join(' ')} ${dNgay || ph.length ? dimQ : ''}}}}}`
  const j = await gql(q, { a: ACC })
  console.log(`\n### ${d.ten}  [${nhom.join(' ').slice(0, 300)}]`)
  if (j.errors?.length) { console.log('LỖI: ' + loiNgan(j.errors)); continue }
  const ds = j?.data?.viewer?.accounts?.[0]?.[d.ten] ?? []
  // gộp theo ngày (cộng mọi phân nhóm) + tổng cả khoảng theo phân nhóm
  const theoNgay = new Map(), theoPh = new Map(), tong = {}
  for (const x of ds) {
    const ngay = String(x.dimensions?.[dNgay] ?? '').slice(0, 10), khoa = ph.map((p) => `${p}=${x.dimensions?.[p]}`).join(' ')
    for (const k of ['sum', 'max', 'avg']) for (const [tt, v] of Object.entries(x[k] ?? {})) { if (typeof v !== 'number') continue
      const ten = `${k}.${tt}`, gop = k === 'sum' ? (a, b) => a + b : Math.max
      const n = theoNgay.get(ngay) ?? {}; n[ten] = gop(n[ten] ?? 0, v); theoNgay.set(ngay, n)
      const p = theoPh.get(khoa) ?? {}; p[ten] = gop(p[ten] ?? 0, v); theoPh.set(khoa, p)
      tong[ten] = gop(tong[ten] ?? 0, v) }
    if (typeof x.count === 'number') { const n = theoNgay.get(ngay) ?? {}; n.count = (n.count ?? 0) + x.count; theoNgay.set(ngay, n); tong.count = (tong.count ?? 0) + x.count }
  }
  const tron = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v).map(([k, v]) => [k, Math.round(v)]))
  for (const [ngay, o] of [...theoNgay].sort()) console.log(ngay, JSON.stringify(tron(o)))
  if (ph.length) for (const [k, o] of [...theoPh].sort((a, b) => (b[1]['sum.requests'] ?? b[1]['sum.rowsWritten'] ?? 0) - (a[1]['sum.requests'] ?? a[1]['sum.rowsWritten'] ?? 0)).slice(0, 25)) console.log('  ·', an(k), JSON.stringify(tron(o)))
  console.log('  TỔNG', JSON.stringify(tron(tong)))
  tongKy.push([d.ten, tron(tong)])
}

// ───────── 3. TRUY VẤN D1 GHI / ĐỌC NHIỀU NHẤT (2 ngày mẫu) ─────────
for (const [tu, den] of [[`${DEN}T00:00:00Z`, `${DEN}T10:00:00Z`], ['2026-11-05T00:00:00Z', '2026-11-05T23:59:59Z']]) {
  for (const theo of ['rowsWritten', 'rowsRead']) {
    const j = await gql(`query($a:String!,$db:String!,$tu:Time!,$den:Time!){viewer{accounts(filter:{accountTag:$a}){d1QueriesAdaptiveGroups(limit:15,filter:{databaseId:$db,datetime_geq:$tu,datetime_leq:$den},orderBy:[sum_${theo}_DESC]){count sum{rowsRead rowsWritten queryDurationMs} dimensions{query}}}}}`, { a: ACC, db: DB, tu, den })
    console.log(`\n## 3. D1 — 15 câu nhiều ${theo} nhất, ${tu} → ${den}`)
    if (j.errors?.length) { console.log('LỖI: ' + loiNgan(j.errors)); continue }
    for (const x of j?.data?.viewer?.accounts?.[0]?.d1QueriesAdaptiveGroups ?? []) console.log(`lan=${x.count} ghi=${x.sum.rowsWritten} doc=${x.sum.rowsRead} giay=${Math.round(x.sum.queryDurationMs / 1000)} :: ${String(x.dimensions.query).replace(/\s+/g, ' ').slice(0, 230)}`)
  }
}
console.log('\n## TỔNG CẢ KHOẢNG (từng bộ số liệu)'); for (const [t, o] of tongKy) console.log(t, JSON.stringify(o))
