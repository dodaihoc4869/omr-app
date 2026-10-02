import { createRoot } from 'react-dom/client'
import '../../src/styles/tokens.css'
import '../../src/index.css'
import '../../src/game/than-thu-v2/doan.css'
import '../../src/game/than-thu-v2/doan2/doan2.css'
import DoanCau from '../../src/game/than-thu-v2/DoanCau'
import type { Question } from '../../src/game/than-thu-v2/core'

const q: Question = { qid: 'KIEM-BANG', maDe: 'THU', version: 'v1', group: 'g', phan: 'III',
  text: 'Để nghiên cứu thành phần chất béo người ta thường nghiên cứu dựa vào hàm lượng các acid béo (thu được sau khi chuyển hoàn toàn gốc acid béo trong triglyceride thành acid béo).\nMột loại dầu hướng dương có hàm lượng các acid béo như bảng sau.\nChỉ số iodine của một loại chất béo được xác định bằng số gam I₂ phản ứng cộng hợp được tối đa vào các liên kết C=C của 100 gam chất béo đó.\n\nXác định chỉ số iodine của dầu hướng dương đó. (Làm tròn kết quả đến hàng đơn vị.)',
  choices: [], ideas: [], hinhAnh: [], dang: 'D', tenDang: '', mucDo: 'hieu', sao: 1, kienThuc: [],
  table: [['Acid béo', 'Palmitic acid', 'Stearic acid', 'Oleic acid', 'Linoleic acid'], ['Tỉ lệ minh hoạ (%)', '5', '5', '30', '60']],
}
const theme = new URLSearchParams(location.search).get('theme') || 'toi'
document.documentElement.dataset.giaoDien = theme
createRoot(document.getElementById('root')!).render(<main className="dh dh2" style={{ padding: 16, display: 'flex', flexDirection: 'column' }}>
  <p style={{ flexShrink: 0 }}>Kiểm tra hiển thị bảng — số liệu minh hoạ</p>
  <div style={{ display: 'flex', flexDirection: 'column', height: 380, width: '100%', maxWidth: 1000, margin: 'auto', minHeight: 0 }}>
    <DoanCau q={q} chon="" onChon={() => {}} khoa={false} onZoom={() => {}} dau={<b>CÂU ÔN CỦA EM</b>} />
  </div>
</main>)
