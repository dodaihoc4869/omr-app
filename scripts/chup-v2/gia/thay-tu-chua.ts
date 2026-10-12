// LÀN THẦY TỰ CHỮA 12/10 — DỮ LIỆU GIẢ cho cảnh `?man=gv-nhip&the=can-chua&ttc=1` (Cần thầy chữa › Thầy tự chữa) của trang chụp V2.
// Một bài Dạy học khối 12 có đủ ba tờ (Trắc nghiệm 8 · Đúng–sai 4 · Trả lời ngắn 3, có câu tính toán lẫn lý thuyết, có lời giải), danh sách lớp CÓ số báo
// danh (để có tỉ lệ sai lớp), số gộp `/gv/thong-ke-lop-cau` và danh sách `/gv/ai-sai-cau` tất định. Tên em là tên giả; không yêu cầu nào ra mạng.
import type { TeacherExamSource } from '../../../src/data/examContent'

export const LA_TTC = !!new URLSearchParams(globalThis.location?.search ?? '').get('ttc')

const MA = 'DH-12-C2-B6'
const pa = (id: number, text: string, choices: [string, string, string, string], correct: 'A' | 'B' | 'C' | 'D', mucDo: 'biet' | 'hieu' | 'van_dung', chot: string, buoc?: string[]) => ({
  id: `${MA}-I-${id}`, text, choices, correct, mucDo, chuyenDe: 'Carbohydrate', loiGiai: { chot, ...(buoc ? { buoc } : {}) },
})
const ds = (id: number, text: string, ideas: [string, string, string, string], correct: ('D' | 'S')[], chot: string) => ({
  id: `${MA}-II-${id}`, text, ideas, correct, mucDo: 'hieu', chuyenDe: 'Carbohydrate', loiGiai: { chot },
})
const tln = (id: number, text: string, correct: string, chot: string, buoc: string[]) => ({
  id: `${MA}-III-${id}`, text, correct, mucDo: 'van_dung', chuyenDe: 'Carbohydrate', loiGiai: { chot, buoc },
})

/** Bài 6 · Tinh bột và cellulose (khối 12, chương 2) — đủ ba phần, kho tự tách thành -TN / -DS / -TLN. */
export const BAI_TTC: TeacherExamSource = {
  maDe: MA,
  nhom: '12 · DẠY HỌC/C2 - Carbohydrate',
  nguon: 'Bài 6. Tinh bột và cellulose',
  phanI: [
    pa(1, 'Tinh bột thuộc loại carbohydrate nào sau đây?', ['Monosaccharide.', 'Disaccharide.', 'Polysaccharide.', 'Ester.'], 'C', 'biet', 'Tinh bột gồm nhiều mắt xích α-glucose ⇒ polysaccharide.'),
    pa(2, 'Thuỷ phân hoàn toàn 32,4 gam tinh bột trong môi trường acid, thu được m gam glucose. Giá trị của m là', ['36,0.', '32,4.', '18,0.', '40,0.'], 'A', 'van_dung',
      'Mỗi mắt xích C₆H₁₀O₅ cho một phân tử glucose.', ['n(C₆H₁₀O₅) = 32,4 : 162 = 0,2 mol.', 'n(glucose) = 0,2 mol ⇒ m = 0,2 × 180 = 36,0 gam.']),
    pa(3, 'Tính chất nào sau đây là của cellulose?', ['Tan tốt trong nước lạnh.', 'Có phản ứng màu với iodine.', 'Bị thuỷ phân trong môi trường acid.', 'Có vị ngọt.'], 'C', 'biet', 'Cellulose là polysaccharide nên bị thuỷ phân trong acid thành glucose.'),
    pa(4, 'Phát biểu nào sau đây về tinh bột là đúng?', ['Tinh bột tan tốt trong nước lạnh.', 'Amylopectin có mạch phân nhánh.', 'Tinh bột có phản ứng tráng bạc.', 'Tinh bột là chất lỏng ở điều kiện thường.'], 'B', 'hieu', 'Amylose mạch không nhánh, amylopectin mạch phân nhánh.'),
    pa(5, 'Từ 16,2 gam tinh bột điều chế ethanol với hiệu suất cả quá trình 75%. Khối lượng ethanol thu được là', ['6,90 gam.', '9,20 gam.', '4,60 gam.', '13,80 gam.'], 'A', 'van_dung',
      'Một mắt xích tinh bột ⇒ một glucose ⇒ hai C₂H₅OH.', ['n(C₆H₁₀O₅) = 16,2 : 162 = 0,1 mol ⇒ n(C₂H₅OH) lí thuyết = 0,2 mol.', 'm = 0,2 × 46 × 75% = 6,90 gam.']),
    pa(6, 'Cellulose có cấu trúc mạch như thế nào?', ['Mạch không phân nhánh.', 'Mạch phân nhánh.', 'Mạch vòng.', 'Mạng không gian.'], 'A', 'biet', 'Cellulose gồm các mắt xích β-glucose nối thành mạch dài không phân nhánh.'),
    pa(7, 'Dung dịch iodine tạo màu xanh tím với chất nào sau đây?', ['Cellulose.', 'Glucose.', 'Tinh bột.', 'Saccharose.'], 'C', 'biet', 'Phân tử amylose cuộn xoắn hấp phụ iodine cho màu xanh tím.'),
    pa(8, 'Cho 8,1 gam cellulose phản ứng với nitric acid đặc dư (xúc tác sulfuric acid đặc) thu được cellulose trinitrate. Khối lượng sản phẩm tối đa là', ['14,85 gam.', '11,25 gam.', '29,70 gam.', '8,10 gam.'], 'A', 'van_dung',
      'Mỗi mắt xích nhận ba nhóm NO₂.', ['n(mắt xích) = 8,1 : 162 = 0,05 mol.', 'm[C₆H₇O₂(ONO₂)₃] = 0,05 × 297 = 14,85 gam.']),
  ],
  phanII: [
    ds(1, 'Cho các phát biểu về tinh bột và cellulose:', ['Tinh bột và cellulose đều là polysaccharide.', 'Cellulose tan tốt trong nước.', 'Tinh bột có phản ứng màu với iodine.', 'Thuỷ phân hoàn toàn cellulose thu được fructose.'], ['D', 'S', 'D', 'S'], 'Cellulose không tan trong nước; thuỷ phân cellulose cho glucose.'),
    ds(2, 'Thuỷ phân hoàn toàn 48,6 gam tinh bột rồi cho toàn bộ glucose tham gia phản ứng tráng bạc.', ['Số mol glucose thu được là 0,3 mol.', 'Khối lượng Ag tối đa là 64,8 gam.', 'Phản ứng tráng bạc chứng tỏ glucose có nhóm –CHO.', 'Thể tích dung dịch AgNO₃ 1M cần dùng ít nhất là 0,3 lít.'], ['D', 'D', 'D', 'S'], 'n(glucose) = 0,3 mol ⇒ n(Ag) = 0,6 mol = 64,8 gam; cần 0,6 lít AgNO₃ 1M.'),
    ds(3, 'Cellulose là nguyên liệu của nhiều ngành sản xuất.', ['Cellulose dùng sản xuất giấy.', 'Cellulose trinitrate dùng làm thuốc súng không khói.', 'Tơ visco là tơ tổng hợp.', 'Cellulose acetate dùng sản xuất tơ.'], ['D', 'D', 'S', 'D'], 'Tơ visco là tơ bán tổng hợp (nhân tạo).'),
    ds(4, 'Một nhà máy dùng 1 tấn mùn cưa chứa 50% cellulose để sản xuất ethanol, hiệu suất cả quá trình 70%.', ['Khối lượng cellulose là 500 kg.', 'Số kmol glucose tạo thành theo lí thuyết là 3,086 kmol.', 'Khối lượng ethanol thu được khoảng 198,8 kg.', 'Thể tích CO₂ sinh ra không phụ thuộc hiệu suất.'], ['D', 'D', 'D', 'S'], 'm(ethanol) = 500 : 162 × 2 × 46 × 70% ≈ 198,8 kg.'),
  ],
  phanIII: [
    tln(1, 'Thuỷ phân hoàn toàn 16,2 gam tinh bột thu được bao nhiêu gam glucose?', '18', 'Một mắt xích ⇒ một glucose.', ['n = 16,2 : 162 = 0,1 mol.', 'm(glucose) = 0,1 × 180 = 18 gam.']),
    tln(2, 'Cần bao nhiêu kg cellulose để sản xuất 29,7 kg cellulose trinitrate, biết hiệu suất phản ứng là 90%?', '18', 'Tính theo mắt xích, chia hiệu suất.', ['n(trinitrate) = 29,7 : 297 = 0,1 kmol.', 'm(cellulose) = 0,1 × 162 : 90% = 18 kg.']),
    tln(3, 'Lên men 360 gam glucose với hiệu suất 80%. Khối lượng ethanol thu được là bao nhiêu gam?', '147,2', 'C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂.', ['n(glucose) = 2 mol ⇒ n(ethanol) lí thuyết = 4 mol.', 'm = 4 × 46 × 80% = 147,2 gam.']),
  ],
} as unknown as TeacherExamSource

const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Ngô']
const TEN = ['Minh Anh', 'Đức Huy', 'Phương Linh', 'Quang Minh', 'Thu Trang', 'Khánh', 'Bảo Ngọc', 'Thảo Linh', 'Gia Bảo', 'Hải Yến', 'Quốc Việt', 'Mai Chi']
const sbdLop = (goc: number, n: number) => Array.from({ length: n }, (_, i) => String(goc + i))
/** `/gv/lop` của cảnh: hai lớp khối 12 + một lớp khối 11, có số báo danh. */
export const LOP_TTC = [
  { tenLop: '12A1', khoi: '12', soEm: 36, sbd: sbdLop(12010, 36) },
  { tenLop: '12 - Tinh Hoa', khoi: '12', soEm: 26, sbd: sbdLop(12110, 26) },
  { tenLop: '11B', khoi: '11', soEm: 30, sbd: sbdLop(11010, 30) },
]

const bam = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
/** Số gộp tất định của một câu (không tên em) — Phần I đủ đáp án chọn, Phần II chuỗi Đ/S, Phần III đáp số. */
export function soGopTtc(qid: string): Record<string, unknown> {
  const h = bam(qid)
  const bai = 24 + (h % 12)
  const dung = Math.round(bai * (0.3 + ((h >>> 4) % 50) / 100))
  const sai = bai - dung
  if (qid.includes('-I-')) {
    const dap = (['C', 'A', 'C', 'B', 'A', 'A', 'C', 'A'] as const)[Number(qid.split('-').pop()) - 1] ?? 'A'
    const khac = (['A', 'B', 'C', 'D'] as const).filter((x) => x !== dap)
    const chon: Record<string, number> = { [dap]: dung, [khac[0]!]: Math.ceil(sai * 0.6), [khac[1]!]: Math.floor(sai * 0.3) }
    chon[khac[2]!] = bai - Object.values(chon).reduce((a, b) => a + b, 0)
    return { bai, dung, coChon: bai, chon, chonSai: Object.fromEntries(khac.map((k) => [k, chon[k] ?? 0])) }
  }
  if (qid.includes('-II-')) {
    // đáp án đúng từng câu Đúng–sai của bài giả; em sai thường lệch ý b hoặc d
    const dap = (['DSDS', 'DDDS', 'DDSD', 'DDDS'] as const)[Number(qid.split('-').pop()) - 1] ?? 'DDDS'
    const lat = (i: number) => dap.slice(0, i) + (dap[i] === 'D' ? 'S' : 'D') + dap.slice(i + 1)
    const chon = { [dap]: dung, [lat(1)]: Math.ceil(sai * 0.6), [lat(3)]: sai - Math.ceil(sai * 0.6) }
    return { bai, dung, coChon: bai, chon, chonSai: { [lat(1)]: chon[lat(1)], [lat(3)]: chon[lat(3)] } }
  }
  return { bai, dung, coChon: bai, chon: {}, chonSai: { '1,8': Math.ceil(sai * 0.6), '36': Math.floor(sai * 0.4) } }
}

/** `/gv/ai-sai-cau` của cảnh: vài lượt sai với nơi làm + số giây (có lượt "≈" ước tính, có lượt chưa đo giờ). */
export function aiSaiTtc(qid: string): { ok: true; ds: unknown[]; conNua: false } {
  const h = bam(qid)
  const noi = ['Đảo', 'Đoàn', 'Ca Kiểm tra tuần 3', 'Lên bảng', 'Đảo']
  const ds = Array.from({ length: 6 }, (_, i) => {
    const k = (h + i * 7) % 12
    return {
      sbd: String(12010 + k), ten: `${HO[k % HO.length]} ${TEN[k]}`, luc: new Date(Date.UTC(2026, 9, 6 + (i % 5), 2 + i, 10 * i)).toISOString(),
      noi: noi[i % noi.length], giay: i === 4 ? null : 35 + ((h >>> i) % 90), ...(i === 2 ? { uocTinh: true } : {}),
    }
  })
  return { ok: true, ds, conNua: false }
}
