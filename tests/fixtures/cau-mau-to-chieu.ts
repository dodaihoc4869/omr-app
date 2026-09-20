// 40 CÂU MẪU ĐỦ LOẠI cho tờ máy chiếu (M2, 19/09/2026): ngắn, Phần II bốn ý dài, có hình, có bảng, lời dẫn 120 từ,
// đề là ảnh cắt cả thân. Tất định (không ngẫu nhiên) để đo bố cục thật bằng Chrome và hiệu chỉnh ước lượng.
//
// Dùng ở: `docs/anh-man-chieu-1909/` (ảnh chụp), `tests/uoc-luong-bo-cuc-1909.test.ts` (bảng bậc đo thật đã khoá).
import type { OBang } from '../../src/lib/html-may-chieu'

const svg = (w: number, h: number, nhan: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#e7e1d3"/><rect x="8" y="8" width="${w - 16}" height="${h - 16}" fill="none" stroke="#5b6168" stroke-width="3"/><text x="50%" y="50%" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#22262b">${nhan}</text></svg>`,
  )}`

const CAU_DAN = [
  'Tiến hành thí nghiệm oxi hoá ethanol bằng CuO theo sơ đồ: đun nóng ống nghiệm chứa CuO dư trong ethanol, dẫn hơi sản phẩm qua ống sinh hàn rồi thu vào cốc nước lạnh.',
  'Cho m gam hỗn hợp X gồm glucose và fructose tác dụng hoàn toàn với dung dịch AgNO3 trong NH3 dư, đun nóng nhẹ, sau phản ứng thu được 21,6 gam Ag kết tủa màu trắng bạc bám trên thành ống nghiệm.',
  'Thuỷ phân hoàn toàn triglyceride X trong dung dịch NaOH dư, đun nóng, thu được glycerol và hỗn hợp hai muối C17H35COONa và C17H33COONa có tỉ lệ mol tương ứng là 2 : 1.',
  'Điện phân dung dịch chứa đồng thời CuSO4 và NaCl với điện cực trơ, màng ngăn xốp, cường độ dòng điện không đổi 5A; sau thời gian t giây thu được khí ở cả hai điện cực và dung dịch có pH giảm.',
  'Cho từ từ dung dịch HCl 1M vào dung dịch chứa đồng thời Na2CO3 và NaHCO3 với số mol lần lượt là 0,2 và 0,15; sau khi phản ứng kết thúc hoàn toàn thu được V lít khí CO2 ở điều kiện chuẩn.',
]
const TU = (s: string, n: number) => s.split(/\s+/).slice(0, n).join(' ')
const LOREM = CAU_DAN.join(' ') + ' ' + CAU_DAN.join(' ') + ' ' + CAU_DAN.join(' ')
const DOAN = (n: number) => TU(LOREM, n)

const PA_NGAN = ['CH3–CH2–OH', 'CH3–CH(OH)–CH3', '(CH3)3C–OH', 'CH3–OH']
const PA_TB = ['Dung dịch chuyển sang màu xanh lam đặc trưng', 'Xuất hiện kết tủa trắng và có khí không màu thoát ra', 'Chất rắn màu đen chuyển dần sang màu đỏ', 'Không có hiện tượng gì xảy ra sau phản ứng']
const PA_DAI = [
  'Ở anode xảy ra sự oxi hoá ion Cl– tạo khí Cl2, sau đó khi hết ion Cl– thì nước bị điện phân tạo khí O2 và làm giảm pH của dung dịch',
  'Ở cathode ion Cu2+ bị khử trước thành kim loại Cu bám vào điện cực, sau đó nước bị điện phân tạo khí H2 và ion OH–',
  'Sau khi ion Cu2+ đã bị điện phân hết, dung dịch thu được chứa các ion Na+, SO42– và một lượng nhỏ ion H+ nên có pH nhỏ hơn 7',
  'Tổng số mol electron trao đổi tỉ lệ thuận với cường độ dòng điện và thời gian điện phân nên khối lượng kim loại thu được tăng đều theo thời gian',
]
const Y_NGAN = ['X là acetaldehyde (ethanal).', 'CuO đóng vai trò là chất khử.', 'Chất rắn chuyển từ đen sang đỏ.', 'Thay ethanol bằng propan-2-ol thu được ketone.']
const Y_DAI = [
  'Trong phản ứng trên, ethanol bị oxi hoá thành acetaldehyde còn CuO bị khử thành đồng kim loại nên chất rắn trong ống nghiệm chuyển dần từ màu đen sang màu đỏ gạch đặc trưng.',
  'Nếu thay ethanol bằng propan-2-ol và giữ nguyên các điều kiện thí nghiệm thì sản phẩm hữu cơ thu được là acetone, không tham gia phản ứng tráng bạc với dung dịch AgNO3 trong NH3.',
  'Chất hữu cơ X thu được có thể phản ứng với dung dịch AgNO3 trong NH3 đun nóng tạo kết tủa Ag, đồng thời có thể bị oxi hoá tiếp bằng oxygen không khí có xúc tác thành acetic acid.',
  'Khối lượng ống nghiệm chứa CuO sau thí nghiệm giảm đi đúng bằng khối lượng nguyên tử oxygen đã chuyển sang ethanol, nên có thể dùng độ giảm khối lượng để tính lượng ethanol phản ứng.',
]

interface Mau {
  ten: string
  phan: 'I' | 'II' | 'III'
  text: string
  luaChon: string[] | null
  hinh?: { viTri: string; src: string; alt?: string }[]
  bang?: string[][]
  anhThanCau?: string
}

export const CAU_MAU_DEF: Mau[] = [
  // ── PHẦN I ngắn (10) ──
  ...['Ancol nào sau đây là ancol bậc II?', 'Chất nào sau đây là ester?', 'Công thức của glucose là gì?', 'Kim loại nào dẫn điện tốt nhất?', 'Số oxi hoá của Fe trong Fe2O3 là bao nhiêu?', 'Dung dịch nào làm quỳ tím hoá đỏ?', 'Polymer nào là chất dẻo?', 'Phản ứng nào là phản ứng thuỷ phân?', 'Chất nào là amine bậc một?', 'Nguyên tố nào thuộc nhóm halogen?'].map((t, i) => ({ ten: `I-ngắn-${i + 1}`, phan: 'I' as const, text: t, luaChon: PA_NGAN })),
  // ── PHẦN I dài: đề dài, phương án dài (8) ──
  ...[45, 70, 95, 120].map((n) => ({ ten: `I-đề-dài-${n}`, phan: 'I' as const, text: DOAN(n) + ' Phát biểu nào sau đây là đúng?', luaChon: PA_TB })),
  ...[1, 2, 3, 4].map((k) => ({ ten: `I-pa-dài-${k}`, phan: 'I' as const, text: DOAN(35) + ' Nhận định nào sau đây là đúng khi nói về quá trình điện phân này?', luaChon: PA_DAI.map((p) => (k > 2 ? p + ' ' + PA_TB[k - 1] : p)) })),
  // ── PHẦN I có hình (4) ──
  ...[[520, 300], [640, 420], [420, 560], [860, 520]].map(([w, h], i) => ({ ten: `I-hình-${w}x${h}`, phan: 'I' as const, text: DOAN(28 + i * 8) + ' Hình vẽ bên mô tả thí nghiệm.', luaChon: PA_TB, hinh: [{ viTri: 'sau_de', src: svg(w, h, `hình ${w}×${h}`), alt: 'hình thí nghiệm' }] })),
  // ── PHẦN II (6): bốn ý ──
  { ten: 'II-ngắn', phan: 'II', text: 'Tiến hành thí nghiệm oxi hoá ethanol bằng CuO thu được chất hữu cơ X. Xét tính đúng sai của các phát biểu:', luaChon: Y_NGAN },
  { ten: 'II-vừa', phan: 'II', text: DOAN(40) + ' Xét tính đúng sai của các phát biểu sau:', luaChon: [Y_DAI[0].slice(0, 90), Y_DAI[1].slice(0, 100), Y_DAI[2].slice(0, 95), Y_DAI[3].slice(0, 100)] },
  { ten: 'II-ý-dài', phan: 'II', text: DOAN(30) + ' Xét tính đúng sai của các phát biểu:', luaChon: Y_DAI },
  { ten: 'II-dẫn-90', phan: 'II', text: DOAN(90) + ' Xét tính đúng sai của các phát biểu:', luaChon: Y_DAI },
  { ten: 'II-dẫn-120-ý-dài', phan: 'II', text: DOAN(120) + ' Xét tính đúng sai của các phát biểu:', luaChon: Y_DAI },
  { ten: 'II-có-hình', phan: 'II', text: DOAN(55) + ' Xét tính đúng sai của các phát biểu:', luaChon: Y_NGAN, hinh: [{ viTri: 'sau_de', src: svg(640, 260, 'sơ đồ thí nghiệm'), alt: 'sơ đồ' }] },
  // ── PHẦN III (7) ──
  { ten: 'III-ngắn', phan: 'III', text: 'Đốt cháy hoàn toàn 4,6 gam ethanol thu được V lít khí CO2 (đkc). Giá trị của V là bao nhiêu?', luaChon: null },
  { ten: 'III-vừa', phan: 'III', text: DOAN(45) + ' Tính giá trị của m (làm tròn đến hàng phần mười).', luaChon: null },
  { ten: 'III-dài', phan: 'III', text: DOAN(100) + ' Tính giá trị của m.', luaChon: null },
  { ten: 'III-dẫn-120', phan: 'III', text: DOAN(120) + ' Tính giá trị của V.', luaChon: null },
  { ten: 'III-bảng-nhỏ', phan: 'III', text: 'Cho bảng số liệu sau về nhiệt độ sôi của một số chất. Chất có nhiệt độ sôi cao nhất là chất nào?', luaChon: null, bang: [['Chất', 'Nhiệt độ sôi (°C)', 'Khối lượng mol'], ['Ethanol', '78,3', '46'], ['Acetic acid', '118', '60'], ['Diethyl ether', '34,6', '74']] },
  { ten: 'III-bảng-lớn', phan: 'III', text: DOAN(60) + ' Dựa vào bảng số liệu, tính giá trị của x.', luaChon: null, bang: [['Thí nghiệm', 'V1 (mL)', 'V2 (mL)', 'Thời gian (s)', 'Nhiệt độ (°C)'], ...Array.from({ length: 8 }, (_, i) => [`TN ${i + 1}`, `${10 + i}`, `${20 + i * 2}`, `${30 + i * 5}`, `${25 + i}`])] },
  { ten: 'III-hình-đề-dài', phan: 'III', text: DOAN(85) + ' Tính giá trị của a.', luaChon: null, hinh: [{ viTri: 'sau_de', src: svg(720, 380, 'đồ thị'), alt: 'đồ thị' }] },
  // ── CỰC ĐOAN (3) ──
  { ten: 'cực-II-dẫn-140-hình-ý-dài', phan: 'II', text: DOAN(140) + ' Xét tính đúng sai của các phát biểu:', luaChon: Y_DAI, hinh: [{ viTri: 'sau_de', src: svg(760, 420, 'sơ đồ lớn'), alt: 'sơ đồ' }] },
  { ten: 'cực-I-đề-160', phan: 'I', text: DOAN(160) + ' Kết luận nào sau đây là đúng?', luaChon: PA_DAI },
  { ten: 'cực-III-bảng-dẫn-110', phan: 'III', text: DOAN(110) + ' Tính giá trị của y.', luaChon: null, bang: [['Mẫu', 'm (g)', 'V (mL)'], ...Array.from({ length: 10 }, (_, i) => [`M${i + 1}`, `${(1 + i * 0.35).toFixed(2)}`, `${12 + i * 3}`])] },
  // ── ĐỀ LÀ ẢNH cắt cả thân (2) ──
  { ten: 'ảnh-thân-vừa', phan: 'I', text: '', luaChon: PA_NGAN, anhThanCau: svg(900, 300, 'ảnh cả thân câu') },
  { ten: 'ảnh-thân-cao', phan: 'II', text: '', luaChon: Y_NGAN, anhThanCau: svg(900, 720, 'ảnh cả thân câu cao') },
]

/** Thần thú mẫu (ảnh SVG nhúng) — MỌI em mẫu đều có thú và "lần lên bảng thứ N" để thẻ tên có kích cỡ như thật (M3: thẻ tên có
 * ảnh thần thú cao hơn thẻ không ảnh; đo bố cục không được đo trên thẻ "rỗng"). */
const THU_MAU = {
  anh: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><path d="M48 10 C63 30 72 40 72 58 A24 24 0 0 1 24 58 C24 40 33 30 48 10Z" fill="#f4a261"/><path d="M48 30 C56 41 61 47 61 58 A13 13 0 0 1 35 58 C35 47 40 41 48 30Z" fill="#ffd166"/></svg>')}`,
  ten: 'Hoả Long',
  danhHieu: '',
  he: 'Lửa',
  capDo: 12,
  hinhThai: 'Thức Tỉnh',
  tangThapCaoNhat: 3,
  soCauDaThanhTay: 0,
  capToiDa: 120,
}

/** `OBang` cho tờ chiếu: mỗi câu một em riêng (`E01`…). */
export const CAU_MAU: { ten: string; o: OBang }[] = CAU_MAU_DEF.map((m, i) => ({
  ten: m.ten,
  o: {
    sbd: `E${String(i + 1).padStart(2, '0')}`,
    hoTen: `Học sinh ${String(i + 1).padStart(2, '0')}`,
    qid: `Q${String(i + 1).padStart(2, '0')}`,
    thanThu: THU_MAU,
    lanLenBang: 3,
    soCau: i + 1,
    sao: (i % 3) as 0 | 1 | 2,
    cau: {
      phan: m.phan,
      id: `Q${String(i + 1).padStart(2, '0')}`,
      maDe: 'MAU',
      chuyenDe: 'Hoá học',
      dang: 'bai_tap',
      sao: (i % 3) as 0 | 1 | 2,
      mucDo: 'hieu',
      text: m.text,
      luaChon: m.luaChon,
      dapAn: m.phan === 'I' ? 'B' : m.phan === 'II' ? 'DSDD' : '2,3',
      chot: 'Chốt của câu mẫu.',
      lyDo: null,
      buoc: ['Bước 1: viết phương trình.', 'Bước 2: tính số mol.', 'Bước 3: kết luận.'],
      ketQua: '',
      ...(m.hinh ? { hinh: m.hinh } : {}),
      ...(m.bang ? { bang: m.bang } : {}),
      ...(m.anhThanCau ? { anhThanCau: m.anhThanCau } : {}),
    } as unknown as OBang['cau'],
  },
}))
