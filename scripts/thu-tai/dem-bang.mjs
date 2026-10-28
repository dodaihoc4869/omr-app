// THỬ TẢI 28/10 — ĐẾM DÒNG từng bảng của D1 THẬT (CHỈ ĐỌC, luật #543: cấm export). Mỗi câu chạy riêng, nghỉ giữa các câu, dừng nếu một câu > 2 s.
// Câu được phép: danh sách bảng (sqlite_master), max(rowid) (tra chỉ mục, tức thì), COUNT(*) khi max(rowid) ≤ 200 nghìn, và vài phép đếm theo nhóm
// trên cột KHÔNG riêng tư (lớp, mã tờ, nguồn sổ). Không đọc giá trị dòng nào. In JSON số đếm (tên bảng + con số) ra log và tệp.
import fs from 'node:fs'
const { CF_TOKEN_SACH: TOKEN, CF_ACC_SACH: ACC, DB_THAT, RA } = process.env
const url = `https://api.cloudflare.com/client/v4/accounts/${ACC}/d1/database/${DB_THAT}/query`
const CHO_PHEP = /^SELECT (name FROM sqlite_master WHERE type='table'|max\(rowid\) AS n FROM "[\w]+"|COUNT\(\*\) AS n FROM "[\w]+"|\w+ AS k, COUNT\(\*\) AS n FROM "[\w]+" GROUP BY \w+|COUNT\(DISTINCT \w+\) AS n FROM "[\w]+"|khoa AS k, length\(gia_tri\) AS dai, json_extract\(CASE WHEN json_valid\(gia_tri\) THEN gia_tri END, '\$\.bat'\) AS bat, json_array_length\(CASE WHEN json_valid\(gia_tri\) THEN gia_tri END, '\$\.lop'\) AS so_lop, json_array_length\(CASE WHEN json_valid\(gia_tri\) THEN gia_tri END, '\$\.sbd'\) AS so_sbd, CASE WHEN length\(gia_tri\) <= 8 THEN gia_tri END AS ngan FROM cau_hinh)$/
const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
async function hoi(sql) {
  if (!CHO_PHEP.test(sql)) throw new Error('Câu không nằm trong danh sách chỉ-đọc: ' + sql)
  const t0 = Date.now()
  const r = await fetch(url, { method: 'POST', headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' }, body: JSON.stringify({ sql }) })
  const j = await r.json()
  const ms = Date.now() - t0
  await ngu(250)
  if (!j.success) return { loi: String(j.errors?.[0]?.message ?? r.status).slice(0, 120), ms }
  const kq = j.result?.[0]
  const d1ms = kq?.meta?.duration
  if (d1ms > 2000) throw new Error(`Câu chạy ${d1ms} ms > 2 s — dừng để không làm chậm D1 thật`)
  return { rows: kq?.results ?? [], ms, d1ms }
}
const ds = (await hoi("SELECT name FROM sqlite_master WHERE type='table'")).rows.map((r) => r.name).filter((t) => /^\w+$/.test(t) && !/^(sqlite_|_cf_|d1_)/.test(t)).sort()
console.log(`Số bảng: ${ds.length}`)
const dem = {}
let tongD1 = 0
for (const t of ds) {
  const m = await hoi(`SELECT max(rowid) AS n FROM "${t}"`)
  tongD1 += m.d1ms || 0
  const maxRowid = m.loi ? null : Number(m.rows[0]?.n ?? 0)
  if (maxRowid !== null && maxRowid > 200_000) { dem[t] = { uoc: maxRowid, cach: 'max(rowid)' }; continue }
  const c = await hoi(`SELECT COUNT(*) AS n FROM "${t}"`)
  tongD1 += c.d1ms || 0
  dem[t] = c.loi ? { loi: c.loi } : { n: Number(c.rows[0]?.n ?? 0), d1ms: Math.round(c.d1ms ?? 0) }
}
// Phân bố KHÔNG riêng tư để dữ liệu giả có hình dạng gần thật.
const nhom = {}
for (const [t, cot] of [['hoc_sinh', 'lop'], ['game_v2_question', 'ma_de'], ['su_kien_hoc', 'nguon'], ['bai_da_day', 'lop'], ['chien_dich', 'trang_thai']]) {
  if (!dem[t]) continue
  const r = await hoi(`SELECT ${cot} AS k, COUNT(*) AS n FROM "${t}" GROUP BY ${cot}`)
  tongD1 += r.d1ms || 0
  nhom[`${t}.${cot}`] = r.loi ? { loi: r.loi } : r.rows.map((x) => [String(x.k ?? '').slice(0, 40), x.n])
}
for (const [t, cot] of [['su_kien_hoc', 'sbd'], ['su_kien_hoc', 'qid']]) {
  const r = await hoi(`SELECT COUNT(DISTINCT ${cot}) AS n FROM "${t}"`)
  tongD1 += r.d1ms || 0
  nhom[`${t}.distinct_${cot}`] = r.loi ? { loi: r.loi } : r.rows[0]?.n
}
// Công tắc cấu hình: CHỈ tên khoá + độ dài + cờ `bat` + SỐ lớp/SBD trong danh sách + giá trị ≤ 8 ký tự ('bat'/'tat') — không đọc danh sách SBD.
{
  const r = await hoi("SELECT khoa AS k, length(gia_tri) AS dai, json_extract(CASE WHEN json_valid(gia_tri) THEN gia_tri END, '$.bat') AS bat, json_array_length(CASE WHEN json_valid(gia_tri) THEN gia_tri END, '$.lop') AS so_lop, json_array_length(CASE WHEN json_valid(gia_tri) THEN gia_tri END, '$.sbd') AS so_sbd, CASE WHEN length(gia_tri) <= 8 THEN gia_tri END AS ngan FROM cau_hinh")
  tongD1 += r.d1ms || 0
  nhom.cau_hinh = r.loi ? { loi: r.loi } : r.rows.map((x) => [String(x.k).slice(0, 60), x.dai, x.bat, x.so_lop, x.so_sbd, x.ngan])
}
const kq = { luc: new Date().toISOString(), dem, nhom, tongD1ms: Math.round(tongD1) }
fs.writeFileSync(RA, JSON.stringify(kq))
console.log(`Tổng thời gian D1 của mọi câu: ${Math.round(tongD1)} ms`)
console.log('DEM_JSON ' + JSON.stringify(kq))
