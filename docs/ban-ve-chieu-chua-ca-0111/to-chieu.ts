// BẢN VẼ «CHIẾU CHỮA BÀI SAU CA» (thầy 01/11) — dựng TỜ CHIẾU THẬT bằng `taoHtmlMayChieu` (đúng màn chiếu chuẩn Chiếu lên bảng), dữ liệu GIẢ sát thực tế
// (ca «Kiểm tra 15 phút · 11A2», 32 em, 9 câu có em sai). Từ 01/11 (thầy chốt) dùng MÃ THẬT: `chuaDung` + `chuaBai` (src/lib/chieu-chua-ca-to.ts).
//   npx esbuild docs/ban-ve-chieu-chua-ca-0111/to-chieu.ts --bundle --platform=node --format=esm --outfile=<tmp>.mjs && node <tmp>.mjs <ra.html>
import { writeFileSync } from 'node:fs'
import { taoHtmlMayChieu, type OBang } from '../../src/lib/html-may-chieu'
import { thongKeLopCau } from '../../src/lib/thong-ke-lop-cau'
import { theChuaDung } from '../../src/lib/chieu-chua-ca'
import type { CauLuyen } from '../../src/lib/bai-tap-pdf'

/** 32 em (tên giả). */
export const LOP = [
  'Nguyễn Minh Anh', 'Trần Gia Bảo', 'Lê Thảo Chi', 'Phạm Quốc Dũng', 'Hoàng Thu Hà', 'Vũ Đức Huy', 'Đặng Ngọc Khánh', 'Bùi Hải Long',
  'Đỗ Phương Linh', 'Ngô Tuấn Minh', 'Dương Bảo Ngọc', 'Lý Hoàng Nam', 'Phan Thanh Phong', 'Trịnh Mai Phương', 'Hồ Đăng Quang', 'Mai Thuỳ Trang',
  'Cao Văn Sơn', 'Lâm Khánh Tâm', 'Tạ Minh Thư', 'Đinh Quang Trung', 'Chu Hà Vy', 'Kiều Anh Tú', 'Lưu Hữu Thắng', 'Tô Bích Ngân',
  'Quách Gia Hân', 'Vương Đình Khoa', 'Nghiêm Thảo My', 'Hà Duy Tùng', 'Thái Ngọc Diệp', 'Mạc Tuấn Kiệt', 'La Thanh Xuân', 'Khúc Bảo Châu',
] as const

interface CauMau { so: number; phan: 'I' | 'II' | 'III'; mucDo: 'biet' | 'hieu' | 'van_dung'; text: string; luaChon: string[] | null; dapAn: string; sai: number[]; chon: string[]; chot: string; buoc: string[] }

/** Chín câu có em sai (`sai` = chỉ số em trong LOP; `chon` = bài làm của TỪNG em sai, cùng thứ tự). */
const CAU: CauMau[] = [
  { so: 4, phan: 'I', mucDo: 'hieu', text: 'Chất nào sau đây là chất điện li mạnh?', luaChon: ['CH₃COOH', 'HF', 'NaCl', 'H₂S'], dapAn: 'C', sai: [3, 9, 17, 22, 27], chon: ['A', 'A', 'B', 'A', 'D'], chot: 'Muối tan là chất điện li mạnh.', buoc: ['NaCl là muối tan ⇒ phân li hoàn toàn.'] },
  { so: 7, phan: 'I', mucDo: 'van_dung', text: 'Cho 12,0 gam hỗn hợp X gồm Fe và Cu vào dung dịch HCl dư, thu được 2,479 lít khí H₂ (đkc). Phần trăm khối lượng Cu trong X là', luaChon: ['53,33%', '46,67%', '35,00%', '65,00%'], dapAn: 'A', sai: [0, 2, 3, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 22, 24, 26, 27, 29, 30, 31, 6], chon: ['B', 'B', 'C', 'B', 'D', 'B', 'B', 'C', 'B', 'B', 'D', 'B', 'C', 'B', 'B', 'D', 'B', 'B', 'C', 'B', 'B'], chot: 'Cu không tác dụng với HCl ⇒ khí H₂ chỉ do Fe.', buoc: ['n(H₂) = 2,479 / 24,79 = 0,1 mol ⇒ n(Fe) = 0,1 mol ⇒ m(Fe) = 5,6 g', 'm(Cu) = 12,0 − 5,6 = 6,4 g ⇒ %Cu = 6,4 / 12,0 × 100% = 53,33%'] },
  { so: 13, phan: 'II', mucDo: 'van_dung', text: 'Cho cân bằng: N₂(g) + 3H₂(g) ⇌ 2NH₃(g)   ΔᵣH°₂₉₈ = −92 kJ.', luaChon: ['Tăng nhiệt độ, cân bằng chuyển dịch theo chiều thuận.', 'Tăng áp suất chung, cân bằng chuyển dịch theo chiều thuận.', 'Thêm xúc tác Fe, hiệu suất tổng hợp NH₃ tăng.', 'Hằng số cân bằng KC chỉ phụ thuộc vào nhiệt độ.'], dapAn: 'SDSD', sai: [1, 3, 8, 10, 13, 15, 18, 20, 23, 25, 28, 30, 4, 9], chon: ['DDSD', 'DDDD', 'SDDD', 'DDSD', 'SDDD', 'DDSD', 'DSSD', 'DDDD', 'SDDS', 'DDSD', 'SDDD', 'DDSD', 'SDDD', 'DDSD'], chot: 'Phản ứng toả nhiệt, số mol khí giảm.', buoc: ['a) Toả nhiệt ⇒ tăng nhiệt độ: chiều nghịch ⇒ Sai.', 'b) Giảm số mol khí ⇒ tăng áp suất: chiều thuận ⇒ Đúng.', 'c) Xúc tác không làm chuyển dịch ⇒ Sai.', 'd) Đúng.'] },
  { so: 18, phan: 'III', mucDo: 'van_dung', text: 'Trộn 100 mL dung dịch HCl 0,03 M với 100 mL dung dịch NaOH 0,01 M, thu được dung dịch X. Giá trị pH của X là bao nhiêu?', luaChon: null, dapAn: '2', sai: [0, 2, 5, 6, 11, 12, 14, 16, 19, 21, 24, 26, 29, 31, 7, 13, 27], chon: ['1,7', '1,52', '1,7', '2,3', '1,7', '', '1,52', '1,7', '12', '1,7', '1,52', '1,7', '1,7', '', '2,3', '1,7', '1,52'], chot: 'H⁺ dư sau trung hoà, chia cho THỂ TÍCH SAU TRỘN.', buoc: ['n(H⁺) dư = 0,003 − 0,001 = 0,002 mol', '[H⁺] = 0,002 / 0,2 = 0,01 M ⇒ pH = 2'] },
  { so: 9, phan: 'I', mucDo: 'hieu', text: 'Dung dịch nào sau đây có pH > 7?', luaChon: ['NH₄Cl', 'Na₂CO₃', 'HCl', 'NaCl'], dapAn: 'B', sai: [3, 17, 22, 27, 9, 11, 30, 5], chon: ['A', 'D', 'D', 'A', 'D', 'A', 'D', 'A'], chot: 'Muối của base mạnh và acid yếu ⇒ môi trường base.', buoc: ['CO₃²⁻ thuỷ phân tạo OH⁻ ⇒ pH > 7.'] },
  { so: 21, phan: 'III', mucDo: 'van_dung', text: 'Nung 10,0 gam CaCO₃ một thời gian, thu được 7,8 gam chất rắn. Hiệu suất phản ứng nhiệt phân là bao nhiêu phần trăm?', luaChon: null, dapAn: '50', sai: [2, 7, 12, 16, 21, 26, 29, 31, 6, 19, 24], chon: ['78', '50,0', '22', '78', '44', '', '78', '22', '78', '44', '78'], chot: 'Khối lượng giảm = khối lượng CO₂ thoát ra.', buoc: ['m(CO₂) = 10,0 − 7,8 = 2,2 g ⇒ n = 0,05 mol', 'n(CaCO₃) ban đầu = 0,1 mol ⇒ H = 0,05 / 0,1 × 100% = 50%'] },
  { so: 2, phan: 'I', mucDo: 'biet', text: 'Theo thuyết Brønsted – Lowry, chất nào sau đây là acid?', luaChon: ['NH₃', 'HCl', 'NaOH', 'Na₂O'], dapAn: 'B', sai: [3, 22, 27], chon: ['A', 'A', 'C'], chot: 'Acid là chất cho proton (H⁺).', buoc: ['HCl → H⁺ + Cl⁻ ⇒ cho proton.'] },
  { so: 15, phan: 'II', mucDo: 'hieu', text: 'Nitrogen là chất khí chiếm khoảng 78% thể tích không khí.', luaChon: ['Phân tử N₂ có một liên kết ba.', 'Ở điều kiện thường N₂ hoạt động hoá học mạnh.', 'N₂ vừa có tính oxi hoá vừa có tính khử.', 'N₂ tan nhiều trong nước.'], dapAn: 'DSDS', sai: [9, 17, 22, 27, 3, 30], chon: ['DDDS', 'DSDD', 'DDDS', 'DSSS', 'DDDS', 'DSDD'], chot: 'Liên kết ba bền ⇒ N₂ kém hoạt động ở nhiệt độ thường.', buoc: ['a) Đúng. b) Sai. c) Đúng. d) Sai.'] },
  { so: 1, phan: 'I', mucDo: 'biet', text: 'Phản ứng thuận nghịch là phản ứng', luaChon: ['chỉ xảy ra theo một chiều.', 'xảy ra theo hai chiều ngược nhau trong cùng điều kiện.', 'luôn toả nhiệt.', 'có hằng số cân bằng bằng 1.'], dapAn: 'B', sai: [22], chon: ['A'], chot: 'Định nghĩa phản ứng thuận nghịch.', buoc: ['Hai chiều ngược nhau, cùng điều kiện.'] },
]

/** LUẬT XẾP (bản đề xuất): mức độ KHÓ → DỄ (Vận dụng → Hiểu → Biết), cùng mức thì SAI NHIỀU → ÍT, bằng nhau thì theo số câu. */
const BAC: Record<string, number> = { van_dung: 3, hieu: 2, biet: 1 }
export const XEP = [...CAU].sort((a, b) => (BAC[b.mucDo] ?? 0) - (BAC[a.mucDo] ?? 0) || b.sai.length - a.sai.length || a.so - b.so)

const cauLuyen = (c: CauMau): CauLuyen => ({ phan: c.phan, id: `KT15-${c.so}`, maDe: 'KT15-11A2', chuyenDe: 'Cân bằng hoá học', dang: 'bai_tap', sao: 1, mucDo: c.mucDo, text: c.text, luaChon: c.luaChon, dapAn: c.dapAn, chot: c.chot, lyDo: null, buoc: c.buoc, ketQua: c.dapAn })

const o: OBang[] = XEP.map((c) => {
  const lam = LOP.map((_, i) => { const k = c.sai.indexOf(i); return k < 0 ? { dung: true, chon: c.dapAn, dapAnDung: c.dapAn } : { dung: false, chon: c.chon[k] ?? '', dapAnDung: c.dapAn } })
  return { sbd: '', hoTen: 'Cả lớp', soCau: c.so, mucDo: c.mucDo, cau: cauLuyen(c), thongKe: thongKeLopCau(c.phan, lam), chuaDung: theChuaDung({ sai: c.sai.map((i) => ({ sbd: String(i), hoTen: LOP[i]! })), lam: LOP.length }) }
})

writeFileSync(process.argv[2]!, taoHtmlMayChieu(o, { tenBuoi: 'Chữa bài · Kiểm tra 15 phút · 11A2', chuaBai: true }))
