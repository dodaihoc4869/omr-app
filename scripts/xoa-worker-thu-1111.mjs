// XOÁ HAI BẢN THỬ TẢI (thầy 11/11 «Làm mọi thứ để dùng bản 5 đô/tháng thôi», sau báo cáo docs/chi-phi-cloudflare-1111.md):
// Worker `omr-thu-tai` (28/10) + `omr-thu` (31/10) và D1 riêng của chúng — tháng 10–11 tốn ~70–77 USD, `omr-thu-tai` còn cron mỗi phút.
// CHỐT AN TOÀN: chỉ đúng hai tên + hai mã D1 dưới đây; gặp tên `omr` hoặc mã D1 thật ⇒ DỪNG. In trước khi xoá, liệt kê lại sau khi xoá.
const TOKEN = process.env.CF_TOKEN_SACH, ACC = process.env.CF_ACC_SACH
const D1_THAT = 'd2e6d322-374a-45d7-83a3-9fac486b23f1'
const WORKER_THU = ['omr-thu-tai', 'omr-thu']
const D1_THU = { 'omr-thu-tai': '1d5b052e-f812-42e1-bc69-70bb6458bd62', 'omr-thu': 'c67d70ab-587d-4180-a028-3d78239c30ca' }
const H = { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' }
const an = (s) => String(s ?? '').split(ACC).join('<tk>')
const goi = async (pt, duong, than) => { const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACC}${duong}`, { method: pt, headers: H, ...(than !== undefined ? { body: JSON.stringify(than) } : {}) }); let j = null; try { j = await r.json() } catch { /* rỗng */ } return { st: r.status, j } }
const loi = (j) => an((j?.errors ?? []).map((e) => `${e.code}:${e.message}`).join(' | '))
const dung = (ly) => { console.log(`::error::DỪNG — ${ly}`); process.exit(1) }

for (const w of WORKER_THU) if (w === 'omr') dung('danh sách xoá có tên omr')
for (const id of Object.values(D1_THU)) if (id === D1_THAT) dung('danh sách xoá có D1 thật')

// 0. Kiểm hiện trạng: mỗi Worker thử phải gắn đúng D1 thử của nó
const d1 = (await goi('GET', '/d1/database?per_page=100')).j?.result ?? []
console.log('D1 hiện có:', JSON.stringify(d1.map((x) => [x.name, x.uuid])))
for (const [ten, id] of Object.entries(D1_THU)) { const x = d1.find((d) => d.uuid === id); if (x && x.name !== ten) dung(`D1 ${id} tên là ${x.name}, không phải ${ten}`) }
for (const w of WORKER_THU) {
  const s = await goi('GET', `/workers/scripts/${w}/settings`)
  if (s.st === 404) { console.log(`${w}: không còn (bỏ qua)`); continue }
  const db = (s.j?.result?.bindings ?? []).filter((b) => b.type === 'd1').map((b) => b.id ?? b.database_id)
  console.log(`${w}: gắn D1 ${JSON.stringify(db)}`)
  if (db.includes(D1_THAT)) dung(`${w} gắn D1 thật — không xoá`)
}

// 1. Dừng lịch chạy (đảo ngược được) → 2. Xoá Worker → 3. Xoá D1 thử
for (const w of WORKER_THU) { const r = await goi('PUT', `/workers/scripts/${w}/schedules`, []); console.log(`1. ${w} bỏ lịch chạy: HTTP ${r.st} ${loi(r.j)}`) }
for (const w of WORKER_THU) {
  let r = await goi('DELETE', `/workers/scripts/${w}?force=true`)
  console.log(`2. xoá Worker ${w}: HTTP ${r.st} ${loi(r.j)}`)
  if (r.st === 403) dung(`khoá API không có quyền xoá Worker ${w}`)
}
for (const [ten, id] of Object.entries(D1_THU)) {
  if (!d1.some((d) => d.uuid === id)) { console.log(`3. D1 ${ten}: không còn (bỏ qua)`); continue }
  const r = await goi('DELETE', `/d1/database/${id}`)
  console.log(`3. xoá D1 ${ten}: HTTP ${r.st} ${loi(r.j)}`)
  if (r.st === 403) dung(`khoá API không có quyền xoá D1 ${ten}`)
}
// 4. Liệt kê lại
console.log('\n4. SAU KHI XOÁ')
console.log('Worker:', JSON.stringify(((await goi('GET', '/workers/scripts')).j?.result ?? []).map((x) => x.id)))
console.log('D1:', JSON.stringify(((await goi('GET', '/d1/database?per_page=100')).j?.result ?? []).map((x) => [x.name, x.uuid])))
console.log('Vùng Durable Object:', JSON.stringify(((await goi('GET', '/workers/durable_objects/namespaces?per_page=100')).j?.result ?? []).map((x) => x.name)))
