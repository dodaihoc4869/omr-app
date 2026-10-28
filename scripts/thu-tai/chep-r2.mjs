// THỬ TẢI 28/10 — chép tệp kho câu (kho/<mã tờ>.json) từ thùng R2 thật `omr-de` sang thùng sao `omr-thu-tai-de`.
// Thùng thật CHỈ ĐỌC (GET); chỉ ghi (PUT/DELETE) vào thùng sao — tên thùng sao là hằng số, kiểm cứng trước khi ghi.
// `node chep-r2.mjs chep <tệp JSON danh sách khoá>` · `node chep-r2.mjs xoa <tệp JSON danh sách khoá>`. Chỉ in số đếm.
import fs from 'node:fs'
const { CF_TOKEN_SACH: TOKEN, CF_ACC_SACH: ACC } = process.env
const [, , lenh, tep] = process.argv
const THAT = 'omr-de', SAO = 'omr-thu-tai-de'
if (SAO === THAT) process.exit(1)
const goc = `https://api.cloudflare.com/client/v4/accounts/${ACC}/r2/buckets`
const H = { authorization: `Bearer ${TOKEN}` }
const kq = JSON.parse(fs.readFileSync(tep, 'utf8'))
const khoa = [...new Set((Array.isArray(kq) ? kq : kq[0]?.results ?? []).map((r) => String(r.k ?? r)).filter((k) => /^[\w./-]+$/.test(k)))]
let ok = 0, thieu = 0, loi = 0, byte = 0
const viec = async (k) => {
  const duong = k.split('/').map(encodeURIComponent).join('/')
  if (lenh === 'xoa') { const r = await fetch(`${goc}/${SAO}/objects/${duong}`, { method: 'DELETE', headers: H }); r.ok ? ok++ : loi++; return }
  const r = await fetch(`${goc}/${THAT}/objects/${duong}`, { headers: H })
  if (r.status === 404) { thieu++; return }
  if (!r.ok) { loi++; if (loi <= 3) console.log('GET lỗi', r.status); return }
  const than = Buffer.from(await r.arrayBuffer())
  const w = await fetch(`${goc}/${SAO}/objects/${duong}`, { method: 'PUT', headers: { ...H, 'content-type': r.headers.get('content-type') || 'application/json' }, body: than })
  if (w.ok) { ok++; byte += than.length } else { loi++; if (loi <= 3) console.log('PUT lỗi', w.status, (await w.text()).slice(0, 160)) }
}
const hang = [...khoa]
await Promise.all(Array.from({ length: 12 }, async () => { while (hang.length) await viec(hang.shift()).catch(() => { loi++ }) }))
console.log(`R2 ${lenh}: ${khoa.length} khoá · xong ${ok} · không có ${thieu} · lỗi ${loi} · ${(byte / 1048576).toFixed(1)} MB`)
if (lenh === 'chep' && ok === 0 && khoa.length) process.exit(1)
