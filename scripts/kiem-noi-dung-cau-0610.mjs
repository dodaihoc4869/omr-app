// Rà soát CHỈ ĐỌC trên D1 thật: tờ chữa của chiến dịch (thầy 06/10 — lẫn câu lớp 10 vào tờ chữa lớp 11). Chạy qua `.github/workflows/kiem-noi-dung-cau.yml` (esbuild gộp tệp này với hàm thuần
// `kiem-noi-dung-cau-lib.ts` + `cauChoThay` của máy chủ thành MỘT tệp node). Không ghi D1/R2. Nhật ký chỉ có SỐ ĐẾM: không mã chiến dịch, không mã câu, không đề, đáp án, tên em, khoá truy cập.
import { moiQid, tongHop } from './kiem-noi-dung-cau-lib'

const token = process.env.CLOUDFLARE_API_TOKEN?.trim()
const account = process.env.CLOUDFLARE_ACCOUNT_ID?.trim()
if (!token || !account) throw new Error('Thiếu cấu hình Cloudflare của quy trình phát hành')
if (/\s/.test(token) || !/^[0-9a-f]{32}$/i.test(account)) throw new Error('Cấu hình Cloudflare chưa được chuẩn hoá')
const database = 'd2e6d322-374a-45d7-83a3-9fac486b23f1'
async function query(sql, params = []) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${database}/query`, {
    method: 'POST', signal: AbortSignal.timeout(60_000), headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ sql, params }),
  })
  const j = await r.json()
  if (!r.ok || !j.success) throw new Error(`Không đọc được D1: HTTP ${r.status}; mã ${(j.errors ?? []).map((x) => x.code).join(',')}`)
  return j.result.flatMap((x) => x.results ?? [])
}

const chienDich = await query("SELECT lop, trang_thai, qid_json FROM chien_dich WHERE trang_thai <> 'da_huy'")
const dsQid = moiQid(chienDich)
const hang = new Map()
// Cùng điều kiện "còn trong kho" như `docMetaCau` / `noi-dung-cau` (JSON hợp lệ, qid + version trong JSON khớp cột). Lô nhỏ vì câu có ảnh nặng.
for (let i = 0; i < dsQid.length; i += 20) {
  const rows = await query(
    `SELECT q.qid AS qid, q.json AS json, c.chuyen_de AS chuyen_de
       FROM game_v2_question q LEFT JOIN cau_hoi c ON c.qid = q.qid
      WHERE q.qid IN (SELECT value FROM json_each(?)) AND json_valid(q.json)
        AND json_extract(q.json, '$.qid') = q.qid AND json_extract(q.json, '$.version') = q.version ORDER BY q.rowid`,
    [JSON.stringify(dsQid.slice(i, i + 20))],
  )
  for (const r of rows) if (!hang.has(r.qid)) hang.set(r.qid, r)
}
console.log(JSON.stringify({ luc: new Date().toISOString(), chiDoc: true, ...tongHop(chienDich, hang) }, null, 1))
