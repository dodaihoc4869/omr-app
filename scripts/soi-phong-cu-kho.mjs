// SOI CHỮ PHÔNG CŨ / CÔNG THỨC VỠ trong kho câu hỏi (thầy 19/10: "lỗi công thức sơ đồ trong app hs, tìm kiếm mọi chỗ lỗi và sửa luôn").
// CHỈ ĐỌC. Nguồn: D1 `game_v2_question` (bản sao chỉ mục của câu trong kho; tờ DẠNG BÀI `DB-…` cố ý KHÔNG có ở đây — chúng chỉ nằm ở R2).
// KHOÁ CLOUDFLARE của Actions KHÔNG đọc được R2 (thử 19/10: 268/268 tờ trả 401/403) ⇒ muốn soi cả tờ R2 phải chạy ở máy có mã thầy (`/kho/lay`).
// In SỐ ĐẾM + token lỗi (≤ 80 ký tự) + mã câu; không in cả đề, không có dữ liệu học sinh.
// Chạy: node --experimental-strip-types scripts/soi-phong-cu-kho.mjs     (cần đăng nhập wrangler hoặc CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID)
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { timPhongCu } from '../src/lib/phong-cu.ts'

const cwd = resolve(process.cwd(), 'server')
const d1 = (sql) => JSON.parse(execFileSync('npx', ['-y', 'wrangler@4', 'd1', 'execute', 'omr', '--remote', '--json', '--command', sql], { cwd, encoding: 'utf8', maxBuffer: 256 << 20 })).flatMap((x) => x.results ?? [])

// Ký tự chỉ có trong phông TCVN3 / chữ xen kẽ (LIKE trên UTF-8): lọc ở D1 cho nhẹ, rồi bộ phát hiện chính xác chạy ở đây.
const DAU = ['¸', '¶', 'ª', '«', '¬', '¨', '»', '®', 'Æ', 'Ç', 'Ë', 'Ï', 'Ð', 'Ñ', 'Þ', 'ß', '¡', '¢', '£', '¤', '¥', '¦', '⁼', 'ⁿ', '₍']
const tong = d1('SELECT COUNT(*) AS n, COUNT(DISTINCT ma_de) AS so_to FROM game_v2_question')[0]
const ung = d1(`SELECT ma_de, qid FROM game_v2_question WHERE ${DAU.map((c) => `json LIKE '%${c}%'`).join(' OR ')}`)
console.log(JSON.stringify({ soCauTrongChiMuc: tong.n, soToTrongChiMuc: tong.so_to, soCauUngVien: ung.length }))

const gap = new Map()
let cauLoi = 0
for (let i = 0; i < ung.length; i += 40) {
  const lo = ung.slice(i, i + 40)
  const dong = d1(`SELECT ma_de, qid, json FROM game_v2_question WHERE qid IN (${lo.map((x) => `'${String(x.qid).replace(/'/g, "''")}'`).join(',')})`)
  for (const r of dong) {
    let o
    try { o = JSON.parse(r.json) } catch { continue }
    let co = false
    const duyet = (v, duong) => {
      if (typeof v === 'string') { for (const h of timPhongCu(v, Number(process.env.SOI_NGU) || 24)) { co = true; const k = `${h.loai}|${h.token}`; const e = gap.get(k) ?? { n: 0, loai: h.loai, token: h.token, truong: new Set(), qid: [], ngu: h.ngu }; e.n++; e.truong.add(duong); if (e.qid.length < 6 && !e.qid.includes(r.qid)) e.qid.push(r.qid); gap.set(k, e) } return }
      if (Array.isArray(v)) { v.forEach((x) => duyet(x, `${duong}[]`)); return }
      if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { if (k === 'hinh' || k === 'anh' || k === 'src') continue; duyet(x, duong ? `${duong}.${k}` : k) }
    }
    duyet(o, '')
    if (co) cauLoi++
  }
}
console.log(JSON.stringify({ soCauNghiLoi: cauLoi, soTokenKhac: gap.size }))
for (const e of [...gap.values()].sort((a, b) => b.n - a.n).slice(0, 120)) console.log(JSON.stringify({ loai: e.loai, n: e.n, token: e.token, truong: [...e.truong].slice(0, 3), qid: e.qid, ngu: e.ngu }))
