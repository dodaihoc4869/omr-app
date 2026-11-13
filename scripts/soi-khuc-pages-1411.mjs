// SOI KHÚC MÃ TRÊN BẢN SỐNG (CHỈ ĐỌC, 14/11): lần theo mọi khúc JS từ index.html + sw.js (khúc nạp lười chỉ được khúc khác trỏ tới), tìm khúc có tên
// bắt đầu bằng tham số 1 rồi in các chuỗi cần có (tham số 2…). Chỉ in tên khúc + có / không. Dùng: node scripts/soi-khuc-pages-1411.mjs <gốc> <tiền tố> <chuỗi>…
const [goc, tienTo, ...can] = process.argv.slice(2)
const lay = async (u) => { try { const r = await fetch(u); return r.ok ? await r.text() : '' } catch { return '' } }
const TEN = /assets\/([A-Za-z0-9_.-]+\.js)|["'`(/.]([A-Za-z0-9_-]+-[A-Za-z0-9_-]{8}\.js)/g
const da = new Set(), hang = []
const them = (t) => { for (const m of t.matchAll(TEN)) { const f = m[1] || m[2]; if (f && !da.has(f)) { da.add(f); hang.push(f) } } }
them(await lay(`${goc}/`)); them(await lay(`${goc}/sw.js`))
const trung = []
while (hang.length && da.size < 600) {
  const loat = hang.splice(0, 12)
  const ds = await Promise.all(loat.map(async (f) => [f, await lay(`${goc}/assets/${f}`)]))
  for (const [f, t] of ds) { them(t); if (f.startsWith(tienTo)) trung.push([f, t]) }
}
console.log(`đã lần ${da.size} khúc; khúc «${tienTo}…»: ${trung.length}`)
for (const [f, t] of trung) console.log(`${f} ${t.length}B · ${can.map((c) => `${c}: ${t.includes(c) ? 'CÓ' : 'KHÔNG'}`).join(' · ')}`)
