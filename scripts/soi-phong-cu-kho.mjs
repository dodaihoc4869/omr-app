// SOI CHỮ PHÔNG CŨ / CÔNG THỨC VỠ trong KHO ĐỀ (thầy 19/10: "lỗi công thức sơ đồ trong app hs, tìm kiếm mọi chỗ lỗi và sửa luôn").
// CHỈ ĐỌC: đọc danh sách tờ (D1 `de_kho`, tệp JSON của `wrangler d1 execute --json`) rồi từng gói R2 `omr-de/kho/<mã đề>.json` bằng API Cloudflare.
// Không ghi gì. In SỐ ĐẾM + token lỗi (≤ 80 ký tự) + mã câu; không in cả đề, không có dữ liệu học sinh.
// Dạng lỗi tìm: (a) ký tự chỉ có trong phông TCVN3 / .VnTime bị đọc nhầm thành Unicode ("chÊt diÖp" = "chất diệp");
// (b) chữ nằm trên/dưới mũi tên bị bộ đọc MathType xen kẽ theo CỘT với chỉ số / số mũ ("lⁿôhc₍sc¸hⁿl", "SH⁼⁹⁶%→").
// Chạy: node scripts/soi-phong-cu-kho.mjs <ds-de.json>   (cần CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)
import { readFileSync } from 'node:fs'
import { timPhongCu } from '../src/lib/phong-cu.ts'

const [tepDs] = process.argv.slice(2)
const tok = process.env.CLOUDFLARE_API_TOKEN, acc = process.env.CLOUDFLARE_ACCOUNT_ID
if (!tepDs || !tok || !acc) { console.error('Thiếu tệp danh sách tờ hoặc khoá Cloudflare.'); process.exit(2) }
const ds = JSON.parse(readFileSync(tepDs, 'utf8')).flatMap((x) => x.results ?? []).map((x) => String(x.ma_de)).filter(Boolean)

async function layGoi(maDe) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${acc}/r2/buckets/omr-de/objects/${encodeURIComponent(`kho/${maDe}.json`)}`
  for (let lan = 0; lan < 3; lan++) {
    try {
      const r = await fetch(url, { headers: { authorization: `Bearer ${tok}` }, signal: AbortSignal.timeout(30000) })
      if (r.ok) return { ok: true, goi: await r.json() }
      if (r.status === 404) return { ok: false, ma: 404 }
      if (r.status === 401 || r.status === 403) return { ok: false, ma: r.status, chan: true }
    } catch { /* thử lại */ }
    await new Promise((f) => setTimeout(f, 800 * (lan + 1)))
  }
  return { ok: false, ma: 0 }
}

const gap = new Map() // token -> { n, loai, truong, qid[], ngu }
let doc = 0, khongCo = 0, loiMang = 0, cau = 0, chuoi = 0, cauLoi = 0, chan = 0
function duyet(o, qid, duong, ghi) {
  if (typeof o === 'string') { chuoi++; for (const h of timPhongCu(o)) ghi(qid, duong, h); return }
  if (Array.isArray(o)) { o.forEach((v, i) => duyet(v, qid, `${duong}[]`, ghi)); return }
  if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (k === 'hinh' || k === 'anh') continue; duyet(v, qid, duong ? `${duong}.${k}` : k, ghi) }
}
let i = 0
async function tho() {
  while (i < ds.length) {
    const maDe = ds[i++]
    const r = await layGoi(maDe)
    if (!r.ok) { if (r.chan) chan++; else if (r.ma === 404) khongCo++; else loiMang++; continue }
    doc++
    const dsCau = Array.isArray(r.goi?.cau) ? r.goi.cau : []
    for (const c of dsCau) {
      cau++
      const qid = String(c.qid ?? c.id ?? `${maDe}-${c.phan}-${c.so}`)
      let co = false
      duyet(c, qid, '', (q, duong, h) => {
        co = true
        const k = `${h.loai}|${h.token}`
        const e = gap.get(k) ?? { n: 0, loai: h.loai, token: h.token, truong: new Set(), qid: [], ngu: h.ngu }
        e.n++; e.truong.add(duong.replace(/\[\]/g, '')); if (e.qid.length < 4 && !e.qid.includes(q)) e.qid.push(q)
        gap.set(k, e)
      })
      if (co) cauLoi++
    }
  }
}
await Promise.all(Array.from({ length: 8 }, tho))
console.log(JSON.stringify({ soTo: ds.length, doc, khongCo, loiMang, bi401403: chan, soCau: cau, soCauNghiLoi: cauLoi, soChuoi: chuoi, soTokenKhac: gap.size }))
if (chan) { console.log('KHÔNG ĐỌC ĐƯỢC R2 bằng khoá này (401/403) — cần dùng cách khác.'); process.exit(chan === ds.length ? 3 : 0) }
const ra = [...gap.values()].sort((a, b) => b.n - a.n).slice(0, 160)
for (const e of ra) console.log(JSON.stringify({ loai: e.loai, n: e.n, token: e.token, truong: [...e.truong].slice(0, 3), qid: e.qid, ngu: e.ngu }))
