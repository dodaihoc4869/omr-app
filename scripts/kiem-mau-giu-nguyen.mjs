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

// TỆP MÃ CHẾT ĐÃ XOÁ NGUYÊN TỆP — ngoại lệ ĐÓNG (06/10, thầy giao "gọn mã"; liệt kê đủ đường dẫn, KHÔNG glob). Cổng này so VĂN BẢN từng tệp với mốc nên xoá cả tệp bị tính là
// "xoá màu đang có"; nhưng các tệp dưới đây KHÔNG nằm trong gói của app nào (máy quét `scripts/quet-to-mo-coi.mjs`: không có đường từ src/main.tsx · src/sw.ts · server/src/index.ts;
// bằng chứng từng tệp + từng test gỡ ở docs/gon-ma-0610-lan-2.md) ⇒ xoá chúng không đổi màu nào của ba app. CHỈ áp cho trạng thái D (xoá) của đúng các đường dẫn này; thêm tệp vào đây phải có
// bằng chứng ấy. Khi mốc origin/main đã không còn các tệp này thì danh sách vô hại, xoá lúc nào cũng được.
const DA_XOA_MA_CHET = new Set([
  // game Thần thú v1 (đã bị than-thu-v2 thay)
  'src/components/ThanThuHoaHocGame.tsx', 'src/components/ThanThu3D.tsx', 'src/components/DauTruongChanLy.tsx', 'src/components/CauHoiTrongGame.tsx',
  'src/components/KhungLoiGiaiGame.tsx', 'src/components/OngNghiemExp.tsx', 'src/components/PopupThuongExp.tsx', 'src/lib/anh-than-thu.ts',
  'src/game/than-thu-hoa-hoc/am-thanh-pet.ts', 'src/game/than-thu-hoa-hoc/can-bang-thap.ts', 'src/game/than-thu-hoa-hoc/canh-3d-chung.ts', 'src/game/than-thu-hoa-hoc/canh-nen-3d.ts',
  'src/game/than-thu-hoa-hoc/cau-hoi-cua-em.ts', 'src/game/than-thu-hoa-hoc/chieu-thuc-3d.ts', 'src/game/than-thu-hoa-hoc/dang-than-thu.ts', 'src/game/than-thu-hoa-hoc/dau-truong-chan-ly.ts',
  'src/game/than-thu-hoa-hoc/dong-bo.ts', 'src/game/than-thu-hoa-hoc/dung-than-thu-3d.ts', 'src/game/than-thu-hoa-hoc/he-thong-pet.ts', 'src/game/than-thu-hoa-hoc/kho-cau-hoi.ts',
  'src/game/than-thu-hoa-hoc/long-thu-3d.ts', 'src/game/than-thu-hoa-hoc/rut-cau-thap.ts', 'src/game/than-thu-hoa-hoc/tan-hu-vo-3d.ts', 'src/game/than-thu-hoa-hoc/tuong-khac.ts',
  'src/game/than-thu-hoa-hoc/ve-than-thu.ts',
  // báo cáo xem điểm cũ của thầy (đã bị ca-thi/BaoCaoChiTiet thay) + thẻ ca gần nhất PH cũ
  'src/components/xem-diem-gv/BaoCaoCaLop.tsx', 'src/components/xem-diem-gv/BaoCaoMotEm.tsx', 'src/components/xem-diem-gv/xem-diem-gv.css', 'src/components/xem-diem/TheCaGanNhat.tsx',
])

const loi = []
let soTep = 0
let soMaChet = 0
for (const [trangThai, f, f2] of doi) {
  const ten = f2 ?? f
  if (trangThai.startsWith('D') && DA_XOA_MA_CHET.has(f)) { soMaChet++; continue }
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
console.log(`kiem-mau-giu-nguyen · mốc ${MOC} · ${soTep} tệp src/ đổi · ${loi.length} vi phạm` + (soMaChet ? ` · ${soMaChet} tệp mã chết đã xoá nguyên tệp (ngoại lệ đóng, không tính)` : ''))
for (const l of loi) console.log('  ' + l)
process.exit(loi.length ? 1 : 0)
