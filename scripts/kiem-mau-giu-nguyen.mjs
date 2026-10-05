#!/usr/bin/env node
// KIỂM MÀU GIỮ NGUYÊN — thầy 05/10: "Tôi muốn giữ nguyên mọi màu sắc các lớp trong 3 app hiện tại, bạn thêm thì phải đồng bộ đúng chuẩn nhé."
//
//   node scripts/kiem-mau-giu-nguyen.mjs [mốc=origin/main]
//
// So cây làm việc với MỐC (bản đang chạy thật), chỉ trong src/ (CSS, TS, TSX) và index.html:
//   1. KHÔNG khai báo màu nào đang có bị xoá hay đổi giá trị. Khai báo màu = `thuộc-tính: giá-trị` với thuộc tính màu (color, background…,
//      border…, outline…, fill, stroke, box-shadow, text-shadow, caret/accent-color) hoặc biến `--x:` mà giá trị là màu. So theo TẬP khai báo
//      của từng tệp (dòng bị viết lại nhưng khai báo màu y nguyên thì không tính là đổi).
//   2. Khai báo màu THÊM mới không có màu thô (rgb/rgba/hsl/hsla/hex/tên màu) — chỉ dùng biến màu đã có (docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md
//      mục 8 "chỉ token", C11 "cùng một thứ cùng màu").
//   3. Mọi `var(--x)` trong khai báo màu thêm mới đều đã được định nghĩa ở đâu đó trong src/ (không có biến "ma" ⇒ màu rơi về trong suốt).
// Thoát mã 1 nếu vi phạm (in từng dòng: tệp · khai báo). Màu thật sự cần đổi ⇒ thầy duyệt trước, rồi ghi lý do trong commit.
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const MOC = process.argv[2] || 'origin/main'
const git = (...a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })

const THUOC_TINH_MAU = /^(?:color|background(?:-color|-image)?|border(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?(?:-color)?|outline(?:-color)?|fill|stroke|box-shadow|text-shadow|caret-color|accent-color|column-rule(?:-color)?|text-decoration(?:-color)?|--[\w-]+)$/i
const MAU_THO = /rgba?\(|hsla?\(|#[0-9a-fA-F]{3,8}\b|\b(?:white|black|red|green|blue|yellow|orange|purple|pink|gray|grey|silver|gold|navy|teal|maroon|olive|lime|aqua|fuchsia)\b/i
const LA_MAU = (gt) => MAU_THO.test(gt) || /var\(--|color-mix\(|currentcolor|transparent|gradient\(/i.test(gt)

/** Khai báo màu trong một đoạn văn bản: CSS `a: b;` và style JSX `{ color: 'var(--x)' }` / `background: \`…\``. */
function khaiBaoMau(van) {
  const ra = []
  const bo = (s) => s.replace(/\s+/g, ' ').trim()
  for (const m of van.matchAll(/(?<![\w-])(--[\w-]+|[a-z-]+)\s*:\s*([^;{}]+?)\s*(?=;|}|$)/gim)) {
    const tt = m[1].toLowerCase()
    if (!THUOC_TINH_MAU.test(tt)) continue
    const gt = bo(m[2])
    if (tt.startsWith('--') && !LA_MAU(gt)) continue
    if (!LA_MAU(gt) && !/^(?:none|inherit|initial|unset|0)$/i.test(gt)) continue
    ra.push(`${tt}: ${gt}`)
  }
  for (const m of van.matchAll(/\b(color|background(?:Color|Image)?|border(?:Color|Top|Bottom|Left|Right)?|outline(?:Color)?|fill|stroke|boxShadow|textShadow|caretColor|accentColor)\s*:\s*(['"`])([^'"`]+)\2/g)) {
    const tt = m[1].replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())
    if (LA_MAU(m[3])) ra.push(`${tt}: ${bo(m[3])}`)
  }
  return ra
}

const LA_TEP = (f) => (/^src\/.*\.(css|tsx?|html)$/.test(f) || f === 'index.html') && !f.includes('graphify-out')
const doi = git('diff', '--name-status', MOC, '--', 'src', 'index.html').trim().split('\n').filter(Boolean)
  .map((d) => d.split('\t')).filter(([, f, f2]) => LA_TEP(f2 ?? f))

// Biến đã định nghĩa trong src/ hiện tại (CSS `--x:`, style JSX `'--x':`, setProperty('--x')).
const dinh = new Set()
const quet = (thu) => {
  for (const ten of readdirSync(thu)) {
    const p = join(thu, ten)
    if (ten === 'node_modules' || ten === 'graphify-out') continue
    if (statSync(p).isDirectory()) quet(p)
    else if (/\.(css|tsx?|html)$/.test(ten)) {
      const s = readFileSync(p, 'utf8')
      for (const m of s.matchAll(/(--[\w-]+)\s*:/g)) dinh.add(m[1])
      for (const m of s.matchAll(/['"](--[\w-]+)['"]\s*[:,]/g)) dinh.add(m[1])
    }
  }
}
quet('src')
for (const m of readFileSync('index.html', 'utf8').matchAll(/(--[\w-]+)\s*:/g)) dinh.add(m[1])

const loi = []
let soTep = 0
for (const [trangThai, f, f2] of doi) {
  const ten = f2 ?? f
  soTep++
  const cu = trangThai.startsWith('A') ? '' : (() => { try { return git('show', `${MOC}:${f}`) } catch { return '' } })()
  let moi = ''
  try { moi = trangThai.startsWith('D') ? '' : readFileSync(ten, 'utf8') } catch { moi = '' }
  const dem = (ds) => ds.reduce((m, k) => m.set(k, (m.get(k) ?? 0) + 1), new Map())
  const a = dem(khaiBaoMau(cu)), b = dem(khaiBaoMau(moi))
  for (const [k, n] of a) if ((b.get(k) ?? 0) < n) loi.push(`ĐỔI/XOÁ màu đang có · ${ten} · ${k}`)
  for (const [k, n] of b) {
    if ((a.get(k) ?? 0) >= n) continue
    const gt = k.slice(k.indexOf(':') + 1)
    if (MAU_THO.test(gt)) loi.push(`MÀU THÔ mới (phải dùng biến chuẩn) · ${ten} · ${k}`)
    for (const m of gt.matchAll(/var\(\s*(--[\w-]+)/g)) if (!dinh.has(m[1])) loi.push(`BIẾN MÀU chưa định nghĩa · ${ten} · ${k}`)
  }
}
console.log(`kiem-mau-giu-nguyen · mốc ${MOC} · ${soTep} tệp src/ đổi · ${loi.length} vi phạm`)
for (const l of loi) console.log('  ' + l)
process.exit(loi.length ? 1 : 0)
