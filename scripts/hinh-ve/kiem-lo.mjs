// Bộ kiểm của lô vẽ hình: chạy trong thư mục lô — node kiem.mjs
import fs from 'node:fs'
import { kiemCanhHinh } from './kiem-hinh.bundle.mjs'
let dat = 0, tong = 0
for (const f of fs.readdirSync('vao').filter((x) => x.endsWith('.json')).sort()) {
  tong++
  const v = JSON.parse(fs.readFileSync('vao/' + f, 'utf8'))
  if (!fs.existsSync('ra/' + f)) { console.log(f + ': CHƯA CÓ ra/' + f); continue }
  let ra; try { ra = JSON.parse(fs.readFileSync('ra/' + f, 'utf8')) } catch (e) { console.log(f + ': TRƯỢT · JSON hỏng ' + e.message); continue }
  if (ra.giuGoc === true) { console.log(f + ': TRƯỢT · không được giữ ảnh gốc — vẽ minh hoạ đơn giản đủ thành phần'); continue }
  const k = kiemCanhHinh(ra, v.phienAm || [])
  if (k.ok) { dat++; console.log(f + ': ĐẠT') } else console.log(f + ': TRƯỢT · ' + k.lyDo)
}
console.log('TỔNG: ' + dat + '/' + tong + ' đạt')
