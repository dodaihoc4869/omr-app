// Kiểm tra "một nguồn sự thật" cho màu (MANCUAVAOVANENTOI.md mục 1): ngoài
// src/styles/tokens.css KHÔNG được có mã màu "#rrggbb" nào trong src/.
// Chạy: npm run check:mau — CI cũng chạy, sót là build đỏ.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

// `.pathname` GIỮ NGUYÊN phần trăm mã hoá: kho nằm trong thư mục có dấu cách
// hoặc dấu tiếng Việt ("/Volumes/SSD NGOÀI/…") là ra `SSD%20NGO%C3%80I` rồi
// `ENOENT`. `fileURLToPath` giải mã đúng trên cả macOS và Windows.
const ROOT = fileURLToPath(new URL('../src', import.meta.url))
// Ngoại lệ: BẢN GIẤY. Phiếu bài tập PDF và ảnh phiếu rời khỏi máy thầy, in ra
// hoặc mở trên máy người khác, nên KHÔNG được lấy màu theo nền sáng/tối của
// app. Bảng màu của chúng là bảng màu riêng thầy đã chốt, sống ngay cạnh chỗ
// dùng. Đây là ngoại lệ ĐÓNG: thêm file vào đây phải có lý do "rời khỏi máy".
const CHO_PHEP = new Set([
  'styles/tokens.css',
  'lib/html-phieu.ts',
  'lib/html-may-chieu.ts',
  // Bảng màu của TỜ MÁY CHIẾU (M3, 19/09): tờ là HTML rời trong iframe, có thể lưu ra tệp / mở tab riêng / chiếu từ máy khác, và nền bảng luôn TỐI
  // (#15181c) dù app đang sáng — nên không đi theo token app. Chỉ chứa bảng màu của tờ; test `giao-dien-to-chieu-1909` khoá từng giá trị.
  'lib/giao-dien-to-chieu.ts',
  'lib/experiments/catalog.ts',
  'lib/experiments/render.ts',
  'lib/experiments/scene.ts',
  'screens/exam-setup.css',
  // BẢNG MÀU TRANH VẼ / NỀN TỐI CỐ ĐỊNH CỦA GAME (Boss duyệt 21/09): đất, cát, biển, thần thú, khiên, vòng EXP… là TRANH nên KHÔNG đổi theo nền
  // sáng/tối của app (~330 mã, hơn 250 màu riêng — không thể thành token mà vẫn đọc được). Ngoại lệ ĐÓNG: đúng 7 tệp, liệt kê đủ đường dẫn, KHÔNG glob.
  // Chữ/nút/nền GIAO DIỆN MỚI trong các tệp này VẪN phải dùng token (biến ở tokens.css); chỉ phần tranh mới được giữ mã màu thô.
  'game/than-thu-v2/game.css',
  'game/than-thu-v2/escort.css',
  'game/than-thu-v2/progress-chart.css',
  'game/than-thu-v2/EscortRoom.tsx',
  'game/than-thu-v2/LinhTam.tsx',
  'game/than-thu-v2/ImmortalShield.tsx',
  'game/than-thu-v2/ProgressChart.tsx',
])
const HEX = /#[0-9a-fA-F]{3,8}\b/g
// bỏ qua: id URL fragment kiểu "#root", tham chiếu React key… — chỉ bắt chuỗi hex thuần
const loi = []

function duyet(dir) {
  for (const ten of readdirSync(dir)) {
    const p = join(dir, ten)
    if (statSync(p).isDirectory()) duyet(p)
    else if (/\.(tsx?|css)$/.test(ten)) {
      const rel = relative(ROOT, p)
      if (CHO_PHEP.has(rel)) continue
      const dong = readFileSync(p, 'utf8').split('\n')
      dong.forEach((d, i) => {
        const m = d.match(HEX)
        if (m) loi.push(`${rel}:${i + 1}: ${m.join(' ')}`)
      })
    }
  }
}
duyet(ROOT)
if (loi.length) {
  console.error(`❌ ${loi.length} mã màu nằm ngoài tokens.css:\n` + loi.join('\n'))
  process.exit(1)
}
console.log('✅ Không có mã màu # nào ngoài src/styles/tokens.css')
