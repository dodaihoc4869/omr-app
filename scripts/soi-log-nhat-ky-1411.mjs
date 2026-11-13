// SOI NHẬT KÝ LƯỢT GỌI (Workers Logs) cho «Nhật ký bài dạy» (14/11, thầy báo «Nhật ký của bài live K12 chưa có»). CHỈ ĐỌC. In giờ VN · phương thức ·
// ĐƯỜNG DẪN (bỏ hết phần sau «?» — vé `ve` mang số báo danh mã hoá) · mã trả. Repo công khai ⇒ không in tên / vé / thân trả lời.
// Dùng: CF_TOKEN=… CF_ACC=… node scripts/soi-log-nhat-ky-1411.mjs [số giờ lùi, mặc định 14]
const TOKEN = process.env.CF_TOKEN, ACC = process.env.CF_ACC, GIO = Number(process.argv[2] || 14)
const H = { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' }
const den = Date.now(), tu = den - GIO * 3_600_000
const gioVn = (t) => new Date(Number(t) + 7 * 3_600_000).toISOString().slice(5, 19).replace('T', ' ')
const sach = (s) => String(s ?? '').split('?')[0].replace(/^https?:\/\/[^/]+/, '')

/** Duyệt sâu một sự kiện, gom các trường cần (không in giá trị nào khác). */
function lay(ev) {
  const ra = {}
  const di = (o, duong) => {
    if (!o || typeof o !== 'object') return
    for (const [k, v] of Object.entries(o)) {
      const d = duong ? `${duong}.${k}` : k
      if (v && typeof v === 'object') { di(v, d); continue }
      if (/(^|\.)url$/i.test(d) && !ra.url) ra.url = sach(v)
      else if (/(^|\.)trigger$/i.test(d) && !ra.trigger) ra.trigger = sach(v)
      else if (/request\.method$/i.test(d) && !ra.method) ra.method = v
      else if (/response\.status$/i.test(d) && ra.status == null) ra.status = v
      else if (/^timestamp$|\.timestamp$/i.test(d) && !ra.t) ra.t = v
      else if (/outcome$/i.test(d) && !ra.outcome) ra.outcome = v
    }
  }
  di(ev, '')
  return ra
}

async function hoi(ten, chua) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACC}/workers/observability/telemetry/query`, {
    method: 'POST', headers: H,
    body: JSON.stringify({
      queryId: `soi-${ten}`, timeframe: { from: tu, to: den }, view: 'events', limit: 200,
      parameters: { datasets: ['cloudflare-workers'], filters: [{ key: '$workers.event.request.url', operation: 'includes', type: 'string', value: chua }], calculations: [], groupBys: [] },
    }),
  })
  const j = await r.json().catch(() => ({}))
  const ds = j?.result?.events?.events ?? j?.result?.events ?? []
  console.log(`\n── ${ten} (url chứa «${chua}», ${GIO} giờ gần nhất): HTTP ${r.status}${j?.success === false ? ` lỗi ${JSON.stringify(j.errors ?? '').slice(0, 300)}` : ''} · ${Array.isArray(ds) ? ds.length : 0} lượt`)
  if (!Array.isArray(ds)) { console.log('khoá kết quả:', Object.keys(j?.result ?? {}).join(', ')); return }
  if (ds[0]) console.log('khoá sự kiện mẫu:', Object.keys(ds[0]).join(', '))
  const dem = new Map()
  for (const ev of ds) {
    const x = lay(ev)
    console.log(`${x.t ? gioVn(x.t) : '?'} · ${x.method ?? '?'} · ${x.url || x.trigger || '?'} · ${x.status ?? '?'} · ${x.outcome ?? ''}`)
    const k = `${x.method ?? '?'} ${(x.url || x.trigger || '?').replace(/\/live-tep\/[^/]+\//, '/live-tep/<buổi>/')} ${x.status ?? '?'}`
    dem.set(k, (dem.get(k) ?? 0) + 1)
  }
  for (const [k, n] of dem) console.log(`  Σ ${k}: ${n}`)
}

await hoi('nhat-ky.json', 'nhat-ky.json')
await hoi('trang.json', 'trang.json')
await hoi('buổi K12', 'BH-20261113-6e6db0b8')
