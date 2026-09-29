// TRANG XEM THỬ (chỉ `npm run dev`, KHÔNG vào bản build): /src/game/bi-a/xem-thu.html[?xong=1][&ca=1]
// Dựng Bi-a Phản Ứng THẬT (BiaGame) với máy chủ GIẢ trong trang: câu mẫu chiến dịch Ester – Lipid, chấm như máy chủ, lời giải đúng mẫu.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '../../styles/tokens.css'
import '../../index.css'
import '../../components/exp-cau/exp-cau.css' // hiệu ứng "+N EXP" (bản thật nạp ở src/main.tsx)
import { expMotCauGame } from '../../../server/src/exp-hoc-tap'
import BiaGame from './BiaGame'
import { datBoGoiBia } from './api'

const q = new URLSearchParams(location.search)
type CauThu = { qid: string; phan: 'I' | 'II' | 'III'; mucDo: string; tenDang: string; text: string; choices?: string[]; ideas?: string[]; dap: string; chot: string; giai: string[]; on?: boolean }
const CAU: CauThu[] = [
  { qid: 'q1', phan: 'I', mucDo: 'biet', tenDang: 'Khái niệm ester', text: 'Chất nào sau đây là ester?', choices: ['CH₃COOH', 'CH₃COOCH₃', 'CH₃CHO', 'C₂H₅OH'], dap: 'B', chot: 'Ester có dạng RCOOR′, trong đó R′ là gốc hydrocarbon (khác H).', giai: ['CH₃COOH là carboxylic acid (R′ = H), không phải ester.', 'CH₃COOCH₃ (methyl acetate) có dạng RCOOR′ nên là ester.', 'CH₃CHO là aldehyde.', 'C₂H₅OH là alcohol.'] },
  { qid: 'q4', phan: 'I', mucDo: 'hieu', tenDang: 'Tên gọi ester', on: true, text: 'Tên gọi của CH₃COOC₂H₅ là', choices: ['ethyl acetate', 'methyl propionate', 'methyl acetate', 'ethyl formate'], dap: 'A', chot: 'Tên ester RCOOR′ = tên gốc R′ + tên gốc acid RCOO (đuôi -ate).', giai: ['R′ = C₂H₅ (ethyl), gốc acid CH₃COO (acetate) → ethyl acetate.', 'Methyl propionate là C₂H₅COOCH₃.', 'Methyl acetate là CH₃COOCH₃.', 'Ethyl formate là HCOOC₂H₅.'] },
  { qid: 'q11', phan: 'II', mucDo: 'hieu', tenDang: 'Chất béo', text: 'Cho các phát biểu về chất béo:', ideas: ['Chất béo là triester của glycerol với acid béo.', 'Chất béo nhẹ hơn nước và không tan trong nước.', 'Dầu lạc, dầu vừng chứa chủ yếu gốc acid béo no.', 'Thuỷ phân chất béo trong môi trường kiềm gọi là phản ứng xà phòng hoá.'], dap: 'DDSD', chot: 'Chất béo là triester của glycerol với acid béo. Dầu thực vật chứa chủ yếu gốc acid béo không no nên ở thể lỏng.', giai: ['Đúng theo định nghĩa chất béo.', 'Đúng: chất béo nhẹ hơn nước, không tan trong nước.', 'Sai: dầu thực vật chứa chủ yếu gốc acid béo không no.', 'Đúng: thuỷ phân trong kiềm tạo muối của acid béo (xà phòng) và glycerol.'] },
  { qid: 'q5', phan: 'I', mucDo: 'hieu', tenDang: 'Thuỷ phân ester', on: true, text: 'Thuỷ phân vinyl acetate (CH₃COOCH=CH₂) trong dung dịch NaOH, thu được', choices: ['CH₃COONa và CH₃CHO', 'CH₃COONa và CH₂=CHOH', 'CH₂=CHCOONa và CH₃OH', 'CH₃COONa và C₂H₅OH'], dap: 'A', chot: 'CH₃COOCH=CH₂ + NaOH → CH₃COONa + CH₂=CH–OH; enol không bền, chuyển ngay thành CH₃CHO.', giai: ['Muối CH₃COONa và acetaldehyde CH₃CHO.', 'CH₂=CHOH không bền nên không thu được.', 'Đây là sản phẩm thuỷ phân methyl acrylate.', 'Đây là sản phẩm thuỷ phân ethyl acetate.'] },
  { qid: 'q13', phan: 'III', mucDo: 'van_dung', tenDang: 'Đồng phân ester', on: true, text: 'Số đồng phân cấu tạo ester ứng với công thức phân tử C₄H₈O₂ là bao nhiêu?', dap: '4', chot: 'Ester C₄H₈O₂ no, đơn chức: viết lần lượt theo gốc acid HCOO–, CH₃COO–, C₂H₅COO–.', giai: ['HCOOCH₂CH₂CH₃ và HCOOCH(CH₃)₂: 2 đồng phân.', 'CH₃COOC₂H₅: 1 đồng phân.', 'C₂H₅COOCH₃: 1 đồng phân.'] },
  { qid: 'q6', phan: 'I', mucDo: 'biet', tenDang: 'Chất béo', text: 'Chất béo là triester của acid béo với', choices: ['ethanol', 'glycerol', 'ethylene glycol', 'methanol'], dap: 'B', chot: 'Chất béo là triester của glycerol C₃H₅(OH)₃ với acid béo.', giai: ['Ethanol là alcohol đơn chức, chỉ tạo monoester.', 'Glycerol có 3 nhóm –OH nên tạo được triester.', 'Ethylene glycol có 2 nhóm –OH, tạo tối đa diester.', 'Methanol là alcohol đơn chức, chỉ tạo monoester.'] },
  { qid: 'q15', phan: 'III', mucDo: 'van_dung', tenDang: 'Thuỷ phân ester', text: 'Thuỷ phân hoàn toàn 7,4 gam methyl acetate bằng dung dịch NaOH dư. Khối lượng muối thu được là bao nhiêu gam? (Làm tròn đến hàng phần mười.)', dap: '8,2', chot: 'CH₃COOCH₃ + NaOH → CH₃COONa + CH₃OH; số mol muối bằng số mol ester.', giai: ['n(CH₃COOCH₃) = 7,4 : 74 = 0,1 mol.', 'n(CH₃COONa) = 0,1 mol.', 'm(CH₃COONa) = 0,1 × 82 = 8,2 gam.'] },
  { qid: 'q3', phan: 'I', mucDo: 'van_dung', tenDang: 'Thuỷ phân ester', on: true, text: 'Thuỷ phân hoàn toàn 8,8 gam ethyl acetate bằng dung dịch NaOH dư, đun nóng. Khối lượng muối thu được là', choices: ['4,1 gam', '8,2 gam', '9,6 gam', '6,8 gam'], dap: 'B', chot: 'CH₃COOC₂H₅ + NaOH → CH₃COONa + C₂H₅OH; tỉ lệ mol ester : muối = 1 : 1.', giai: ['Tính nhầm n(ester) = 0,05 mol.', 'n(ester) = 8,8 : 88 = 0,1 mol → m(CH₃COONa) = 0,1 × 82 = 8,2 gam.', '9,6 gam ứng với C₂H₅COONa: lấy nhầm gốc alcohol làm gốc acid.', '6,8 gam ứng với HCOONa: sai gốc acid.'] },
  { qid: 'q10', phan: 'I', mucDo: 'biet', tenDang: 'Khái niệm ester', text: 'Công thức chung của ester no, đơn chức, mạch hở là', choices: ['CₙH₂ₙO₂ (n ≥ 2)', 'CₙH₂ₙ₊₂O₂ (n ≥ 2)', 'CₙH₂ₙ₋₂O₂ (n ≥ 3)', 'CₙH₂ₙO (n ≥ 1)'], dap: 'A', chot: 'Ester no, đơn chức, mạch hở có một liên kết π (trong nhóm C=O) → CₙH₂ₙO₂, n ≥ 2.', giai: ['Đúng: một liên kết π, hai nguyên tử O.', 'Không có liên kết π nào.', 'Có 2 liên kết π: ester không no.', 'Chỉ có 1 nguyên tử O: aldehyde hoặc ketone no.'] },
  { qid: 'q7', phan: 'I', mucDo: 'hieu', tenDang: 'Chất béo', text: 'Xà phòng hoá hoàn toàn tristearin bằng dung dịch NaOH, thu được glycerol và', choices: ['C₁₇H₃₅COONa', 'C₁₇H₃₃COONa', 'C₁₅H₃₁COONa', 'C₁₇H₃₅COOH'], dap: 'A', chot: '(C₁₇H₃₅COO)₃C₃H₅ + 3NaOH → 3C₁₇H₃₅COONa + C₃H₅(OH)₃.', giai: ['Sodium stearate.', 'Sodium oleate, sinh ra từ triolein.', 'Sodium palmitate, sinh ra từ tripalmitin.', 'Acid béo chỉ thu được khi thuỷ phân trong môi trường acid.'] },
  { qid: 'q14', phan: 'III', mucDo: 'van_dung', tenDang: 'Chất béo', text: 'Xà phòng hoá hoàn toàn 17,8 gam tristearin bằng dung dịch NaOH vừa đủ, thu được m gam glycerol. Giá trị của m là bao nhiêu? (Làm tròn đến hàng phần trăm.)', dap: '1,84', chot: 'Số mol glycerol bằng số mol chất béo.', giai: ['M(tristearin) = 890 → n = 0,02 mol.', 'n(glycerol) = 0,02 mol.', 'm = 0,02 × 92 = 1,84 gam.'] },
  { qid: 'q12', phan: 'II', mucDo: 'hieu', tenDang: 'Tính chất ester', text: 'Cho các phát biểu về ethyl acetate:', ideas: ['Công thức của ethyl acetate là CH₃COOC₂H₅.', 'Ethyl acetate tan tốt trong nước.', 'Thuỷ phân ethyl acetate trong môi trường acid là phản ứng thuận nghịch.', 'Ethyl acetate có nhiệt độ sôi cao hơn acetic acid.'], dap: 'DSDS', chot: 'Giữa các phân tử ester không có liên kết hydrogen nên ethyl acetate sôi thấp hơn acetic acid.', giai: ['Đúng.', 'Sai: ethyl acetate ít tan trong nước.', 'Đúng: thuỷ phân ester trong môi trường acid là thuận nghịch.', 'Sai: ethyl acetate sôi ở 77 °C, acetic acid sôi ở 118 °C.'] },
  { qid: 'q9', phan: 'I', mucDo: 'hieu', tenDang: 'Tính chất ester', text: 'Isoamyl acetate có mùi', choices: ['chuối chín', 'dứa', 'hoa nhài', 'hoa hồng'], dap: 'A', chot: 'Isoamyl acetate: mùi chuối chín.', giai: ['Mùi chuối chín.', 'Mùi dứa là của ethyl butyrate.', 'Mùi hoa nhài là của benzyl acetate.', 'Mùi hoa hồng là của geranyl acetate.'] },
]
const congKhai = (c: CauThu) => ({ qid: c.qid, maDe: 'DE', version: '1', group: `g-${c.qid}`, phan: c.phan, text: c.text, choices: c.choices ?? [], ideas: c.ideas ?? [], hinhAnh: [], dang: c.tenDang, tenDang: c.tenDang, mucDo: c.mucDo, sao: 1, kienThuc: [], vai: c.on ? 'on_lai' : 'moi' })
const loiGiai = (c: CauThu) => c.phan === 'I' ? { chot: c.chot, tung_pa: Object.fromEntries(c.giai.map((g, i) => ['ABCD'[i], { dung: 'ABCD'[i] === c.dap, vi_sao: g }])) }
  : c.phan === 'II' ? { chot: c.chot, tung_y: Object.fromEntries(c.giai.map((g, i) => ['abcd'[i], { dung: c.dap[i] === 'D', vi_sao: g }])) }
  : { chot: c.chot, buoc: c.giai, ket_qua: c.dap }
const chuan = (t: string) => t.replace(',', '.').replace('−', '-').trim()
let du = CAU.slice(8)
const xong = q.get('xong') === '1'
datBoGoiBia(async (lenh, _token, d = {}) => {
  await new Promise((r) => setTimeout(r, 60))
  if (q.get('ca') === '1') return { ok: true, bat: true, lyDoKhoa: 'dang_co_ca', message: 'Đang có ca kiểm tra. Bi-a mở lại khi ca kết thúc.' }
  if (lenh === 'bia-sanh') return { ok: true, bat: true, ...(xong ? { lyDoKhoa: 'xong_ke_hoach', message: 'Hôm nay em xong kế hoạch rồi. Em chơi Bàn giao hữu được (không câu, không EXP).' } : {}), chienDich: { ten: 'Ester – Lipid', hanNop: '2026-10-01', tong: 120 }, theLuc: { con: xong ? 0 : 26, tong: 40 }, doan: { con: 6 }, dao: { con: 20 }, tran: { con: xong ? 0 : 15, tong: 15, conDoan: 5, conDao: 10 }, giaoHuu: { mo: xong, con: 2, toiDa: 2 } }
  if (lenh === 'bia-xep-ban') {
    if (d.loai === 'giao_huu') return { ok: true, van: 'v-gh', loai: 'giao_huu', bi: [], chot: null }
    const soBi = Number(d.soBi) || 7
    return { ok: true, van: 'v1', session: 's1', bi: CAU.slice(0, soBi === 4 ? 4 : 7).map(congKhai), chot: congKhai(CAU[7]!), tran: { con: 7, tong: 15 } }
  }
  if (lenh === 'answer') {
    const c = CAU.find((x) => x.qid === d.qid)!
    const tl = String(d.answer ?? '')
    const dung = c.phan === 'III' ? chuan(tl) === chuan(c.dap) : tl === c.dap
    return { ok: true, correct: dung, answer: c.dap, traLoi: tl, solution: loiGiai(c), solutionImages: [], reward: dung ? 4 : 0, expCau: dung ? 4 + expMotCauGame(c.phan, 1) : 0 }
  }
  if (lenh === 'bia-doi-cau') { const moi = du.shift(); return moi ? { ok: true, trong: false, cau: congKhai(moi) } : { ok: true, trong: true } }
  if (lenh === 'bia-ket-van') return { ok: true, theLuc: { con: 18, tong: 40 } }
  return { ok: true }
})
;(window as unknown as { __dapAn: Record<string, string> }).__dapAn = Object.fromEntries(CAU.map((c) => [c.qid, c.dap]))
createRoot(document.getElementById('root')!).render(<StrictMode><BiaGame token="thu" hoTen="Khánh Linh" onVe={() => location.reload()} /></StrictMode>)
