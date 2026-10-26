// LÀN MÀN LÀM BÀI 12/10D — máy chủ GIẢ cho màn làm bài của học sinh (bản vẽ dot13 thầy duyệt 12/10). CHỈ dùng trong bản build chụp ảnh
// (scripts/chup-v2) và kịch bản vuốt thật (scripts/kiem-vuot-lam-bai.mjs). Không dữ liệu học sinh thật; câu hỏi soạn theo đúng bản vẽ.
//   ?man=lam13            chặng 2 (đã làm 6/24 câu hôm nay): 3 trắc nghiệm · 1 đúng–sai · 1 trắc nghiệm · 1 trả lời ngắn (số câu đúng bản vẽ)
//   ?man=lam13&lam=g7     câu mới của bài (Gói 7 ngày): chặng 3 · câu 1/6 · "Câu này em chọn làm thế nào?" (đã làm 12/24)
//   ?man=lam13&lam=ds-dau đúng–sai đứng đầu (kịch bản vuốt: ý d + nút cuối phải tới được bằng vuốt)
//   ?man=lam13&lam=so-o   15/10: số ô = đúng số kí tự đáp số (thầy 15/10 ~10:25): câu amine "24" (2 ô) · "6,48" (4 ô) · "10000" (5 ô)
import { soOPhanIII } from '../../../src/lib/so-o-tra-loi-ngan'

const thamSo = new URLSearchParams(location.search)
export const LA_LAM13 = thamSo.get('man') === 'lam13'
const kieu = thamSo.get('lam') ?? ''

const nen = { version: '1', group: 'g', hinhAnh: [], dang: null, mucDo: 'hieu', sao: 0, kienThuc: [] }
type CauGia = Record<string, unknown> & { qid: string; phan: 'I' | 'II' | 'III'; dapAn: string; loiGiai: unknown }
const CAU: CauGia[] = [
  { ...nen, qid: 'L1', maDe: 'BAI8', phan: 'I', tenDang: 'Bậc của amine', text: 'Amine nào sau đây là amine bậc một?', choices: ['CH3NH2', '(CH3)2NH', '(CH3)3N', 'CH3NHC2H5'], ideas: [], dapAn: 'A',
    loiGiai: { chot: 'Amine bậc một: nguyên tử N liên kết với một gốc hydrocarbon.' } },
  { ...nen, qid: 'L2', maDe: 'BAI8', phan: 'I', tenDang: 'Tính base của amine', text: 'Dung dịch chất nào sau đây làm quỳ tím chuyển màu xanh?', choices: ['Aniline', 'Methylamine', 'Glycine', 'Ethanol'], ideas: [], dapAn: 'B',
    loiGiai: { chot: 'Methylamine có tính base mạnh hơn ammonia nên làm quỳ tím hoá xanh; aniline có tính base rất yếu, không làm đổi màu quỳ tím.' } },
  { ...nen, qid: 'L3', maDe: 'BAI8', phan: 'I', tenDang: 'Đồng phân amine', text: 'Số đồng phân amine có công thức phân tử C2H7N là', choices: ['1', '2', '3', '4'], ideas: [], dapAn: 'B',
    loiGiai: { chot: 'C2H7N có hai đồng phân: CH3CH2NH2 (bậc một) và CH3NHCH3 (bậc hai).' } },
  { ...nen, qid: 'L4', maDe: 'BAI4', phan: 'II', tenDang: 'Hydroxide ứng với hoá trị cao nhất', text: 'Xét dãy hydroxide ứng với hoá trị cao nhất của các nguyên tố chu kì 2: LiOH, Be(OH)2, H3BO3, H2CO3, HNO3.', choices: [],
    ideas: ['Theo chiều tăng điện tích hạt nhân, tính base của các hydroxide trong dãy giảm dần.', 'Theo chiều tăng điện tích hạt nhân, tính acid của các hydroxide trong dãy tăng dần.', 'Trong dãy trên, HNO3 là hydroxide thể hiện tính acid mạnh nhất.', 'H3BO3 có tính acid mạnh hơn H2CO3.'],
    dapAn: 'DDDS',
    loiGiai: { chot: 'Trong một chu kì, theo chiều tăng điện tích hạt nhân: tính kim loại giảm, tính phi kim tăng ⇒ tính base của hydroxide giảm, tính acid tăng.', tung_y: {
      a: { dung: true, vi_sao: 'Tính kim loại giảm dần từ Li đến N nên tính base giảm dần.' },
      b: { dung: true, vi_sao: 'Tính phi kim tăng dần nên tính acid tăng dần.' },
      c: { dung: true, vi_sao: 'N có tính phi kim mạnh nhất dãy nên HNO3 có tính acid mạnh nhất.' },
      d: { dung: false, vi_sao: 'B (Z = 5) đứng trước C (Z = 6) trong chu kì 2 nên tính phi kim B < C. Vì vậy tính acid H3BO3 < H2CO3.' } } } },
  { ...nen, qid: 'L5', maDe: 'BAI8', phan: 'I', tenDang: 'Bậc của amine', text: 'Chất nào sau đây là amine bậc hai?', choices: ['CH3NH2', '(CH3)2NH', '(CH3)3N', 'C6H5NH2'], ideas: [], dapAn: 'B',
    loiGiai: { chot: 'Trong (CH3)2NH, nguyên tử N liên kết với 2 gốc hydrocarbon nên là amine bậc hai. CH3NH2, C6H5NH2 bậc một; (CH3)3N bậc ba.' } },
  { ...nen, qid: 'L6', maDe: 'BAI8', phan: 'III', tenDang: 'Phản ứng đốt cháy amine', text: 'Đốt cháy hoàn toàn 0,1 mol ethylamine (C2H5NH2) thu được V lít khí N2 (đkc). Giá trị của V là bao nhiêu? (Làm tròn đến hàng phần mười.)', choices: [], ideas: [], dapAn: '1,2',
    loiGiai: { chot: 'Bảo toàn nguyên tố N: n(N2) = 0,1 : 2 = 0,05 mol.', buoc: ['V = 0,05 × 24,79 = 1,2395 lít', 'Làm tròn đến hàng phần mười: V ≈ 1,2'] } },
]
const CAU_G7: CauGia[] = [
  { ...nen, qid: 'G1', maDe: 'BAI8-AMINE', phan: 'III', tenDang: 'Muối của amine', vaiGoi7: 'moi', huongDan7: true, coGoi7: true,
    text: 'Cho 4,65 gam aniline tác dụng vừa đủ với dung dịch HCl. Khối lượng muối thu được là bao nhiêu gam? (Làm tròn đến hàng phần trăm.)', choices: [], ideas: [], dapAn: '6,48',
    loiGiai: { chot: 'n(aniline) = 4,65 : 93 = 0,05 mol = n(muối).', buoc: ['C6H5NH2 + HCl → C6H5NH3Cl', 'm(muối) = 0,05 × 129,5 = 6,475 ≈ 6,48 gam'] } },
  ...CAU.slice(0, 5).map((c, i) => ({ ...c, qid: `G${i + 2}` })),
]
// 15/10: số ô = đúng số kí tự đáp số (máy chủ tính bằng `soOPhanIII` trong `publicQuestion`, chỉ gửi con số). Câu amine "24" là câu trong ảnh thầy gửi
// (12-C3-B8-D2 câu III.7); câu thật DH-10-C1-B1-III-18 đáp số "10000" (lỗi em Lê Công sáng 15/10).
const CAU_SO_O: CauGia[] = [
  { ...nen, qid: '12-C3-B8-D2-III-7', maDe: '12-C3-B8-D2', phan: 'III', tenDang: 'Tính base của amine', choices: [], ideas: [], dapAn: '24',
    text: 'Cho các chất sau:\n(1) ammonia,\n(2) methylamine,\n(3) aniline,\n(4) dimethylamine.\n\nLiệt kê các chất theo số thứ tự tăng dần có lực base mạnh hơn ammonia?',
    loiGiai: { chot: 'Amine béo (methylamine, dimethylamine) có lực base mạnh hơn ammonia; aniline yếu hơn ammonia. Đáp án: 24.' } },
  { ...nen, qid: 'SO-O-648', maDe: 'BAI8-AMINE', phan: 'III', tenDang: 'Muối của amine', choices: [], ideas: [], dapAn: '6,48',
    text: 'Cho 4,65 gam aniline tác dụng vừa đủ với dung dịch HCl. Khối lượng muối thu được là bao nhiêu gam? (Làm tròn đến hàng phần trăm.)',
    loiGiai: { chot: 'n(aniline) = 4,65 : 93 = 0,05 mol = n(muối).', buoc: ['C6H5NH2 + HCl → C6H5NH3Cl', 'm(muối) = 0,05 × 129,5 = 6,475 ≈ 6,48 gam'] } },
  { ...nen, qid: 'DH-10-C1-B1-III-18', maDe: 'DH-10-C1-B1', phan: 'III', tenDang: 'Cấu tạo nguyên tử', choices: [], ideas: [], dapAn: '10000',
    text: 'Phóng đại nguyên tử Gold lên 1 tỉ lần thì đường kính nguyên tử khoảng 30 cm, đường kính hạt nhân khoảng 0,003 cm. Đường kính nguyên tử lớn gấp bao nhiêu lần đường kính hạt nhân?',
    loiGiai: { chot: '30 : 0,003 = 10000. Nguyên tử lớn gấp khoảng 10000 lần hạt nhân.' } },
]
// ═══ DUO 26/10: `?man=lam13&lam=duo` = chặng «làm kiểu Duolingo» (bản vẽ docs/ban-ve-duo-2610): trắc nghiệm ngắn (lưới 2×2, có lý do phương án B) ·
// trắc nghiệm có hình công thức cấu tạo · đúng–sai · trả lời ngắn · trắc nghiệm. Đáp án/lời giải chỉ trả sau `answer` như máy chủ thật.
const hinhDuo = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="130" viewBox="0 0 320 130"><rect width="320" height="130" fill="white"/><g stroke="black" stroke-width="2" fill="none"><polygon points="50,30 85,10 120,30 120,70 85,90 50,70"/><line x1="120" y1="30" x2="165" y2="10"/><line x1="165" y1="10" x2="205" y2="30"/></g><text x="210" y="40" font-family="sans-serif" font-size="20">NH2</text></svg>')
const CAU_DUO: CauGia[] = [
  { ...nen, qid: 'D1', maDe: 'BAI8', phan: 'I', tenDang: 'Hợp chất chứa nitrogen', text: 'Số đồng phân amine có công thức phân tử C4H11N tác dụng với dung dịch HNO2 (ở nhiệt độ thường) tạo ra alcohol là', choices: ['2', '8', '3', '4'], ideas: [], dapAn: 'D',
    loiGiai: { chot: 'Chỉ amine bậc một cho alcohol với HNO2; C4H11N có 4 đồng phân bậc một.', tung_pa: { A: { dung: false, vi_sao: '2 là số đồng phân bậc ba.' }, B: { dung: false, vi_sao: '8 là tổng số đồng phân amine. Chỉ amine bậc một cho alcohol với HNO2 ⇒ chỉ 4 chất.' }, C: { dung: false, vi_sao: '3 là số đồng phân bậc hai.' }, D: { dung: true, vi_sao: 'Bốn amine bậc một.' } } } },
  { ...nen, qid: 'D2', maDe: 'BAI8', phan: 'I', tenDang: 'Hợp chất chứa nitrogen', hinhAnh: [{ src: hinhDuo, viTri: 'sau_de', alt: 'Công thức cấu tạo' }], text: 'Hợp chất có công thức cấu tạo như hình dưới đây thuộc loại nào và có bậc mấy?',
    choices: ['Amine thơm, bậc một', 'Amine béo (no), bậc một', 'Amine béo (no), bậc hai', 'Amide, bậc một'], ideas: [], dapAn: 'B',
    loiGiai: { chot: 'Nhóm NH2 gắn vào mạch carbon no (không gắn trực tiếp vào vòng benzene) ⇒ amine béo bậc một.' } },
  { ...CAU[3]!, qid: 'D3' },
  { ...nen, qid: 'D4', maDe: 'BAI1', phan: 'III', tenDang: 'Ester – Lipid', text: 'Thuỷ phân hoàn toàn 8,8 gam ethyl acetate trong dung dịch sodium hydroxide dư, đun nóng. Khối lượng muối thu được là bao nhiêu gam?', choices: [], ideas: [], dapAn: '8,2',
    loiGiai: { chot: 'n(ester) = 8,8 : 88 = 0,1 mol = n(CH3COONa) ⇒ m = 0,1 × 82 = 8,2 gam.' } },
  { ...CAU[4]!, qid: 'D5' },
]
// ═══ DUO APP 26/10: `lam13&lam=duo&ll=1` = có Gói 7 ⇒ hết chặng mà có câu tự làm sai thì gọi `hoc-tap-lam-lai` (hợp đồng docs/hop-dong-duolingo-2610.md mục 3):
// trả 1 câu anh em (chỉ đề) của câu D1; nộp qua `answer` ⇒ máy chủ ép có hỗ trợ (`attempt.assisted`).
const LAM_LAI = thamSo.get('ll') === '1'
const CAU_LAM_LAI: CauGia[] = [{ ...CAU_DUO[0]!, qid: 'DL1', vaiGoi7: 'lam_lai', lamLaiCua: 'D1', text: 'Số đồng phân amine bậc một có công thức phân tử C3H9N là' , choices: ['1', '2', '3', '4'], dapAn: 'B',
  loiGiai: { chot: 'C3H9N có 2 đồng phân amine bậc một: CH3CH2CH2NH2 và (CH3)2CHNH2.' } }]
// ═══ hết DUO 26/10
const ds = kieu === 'duo' ? CAU_DUO : kieu === 'g7' ? CAU_G7 : kieu === 'ds-dau' ? [CAU[3]!, CAU[4]!, CAU[5]!] : kieu === 'so-o' ? CAU_SO_O : CAU
const GOI7 = { bat: true, ngay: '2026-10-12', toiThieu: 24, daLamHomNay: 12, tuLamCon: 9, tiepCanCon: 3, thieuPhu: 0, thieuNgay: 0, canHoTro: false, kienThucCu: { tong: 0, dat: 0, tyLe: null },
  goi: [{ id: 'g8', ten: 'Bài 8. Amine', batDau: '2026-10-10', han: '2026-10-16', tong: 40, daGap: 10, con: 30, quota: 6, gapHomNay: 2, quaHan: false, canBoSung: 0, to: ['BAI8-AMINE'] }], diemDaDo: [] }

// Số câu đã làm hôm nay: chặng 2 bắt đầu ở 6/24 (chặng 3 ở 12/24); mỗi câu nộp / học cách giải +1 — như Sảnh tải lại sau mỗi câu.
let daNop = 0
const DAU = kieu === 'g7' ? 12 : 6
export const soHomNayLam13 = () => ({ daLam: DAU + daNop, muc: 24, chang: Math.floor(DAU / 6) + 1, soChang: 4 })

// Như `publicQuestion`: câu Phần III kèm số ô = đúng số kí tự đáp số (chỉ con số), không kèm đáp án.
const congKhai = ({ dapAn: _d, loiGiai: _l, ...q }: CauGia) => { const n = q.phan === 'III' ? soOPhanIII(_d) : null; return n === null ? q : { ...q, soO: n } }
const so = (v: string) => Number(String(v).replace(',', '.'))
/** Trả lời các lệnh `/game-v2/hoc-tap-*` + `answer` của màn làm bài; lệnh khác ⇒ null (bộ giả chung lo). */
export function traLoiLam13(duong: string, b: Record<string, unknown>): Record<string, unknown> | null {
  if (duong.endsWith('/game-v2/hoc-tap-start')) return { ok: true, id: `phien-${kieu || 'chung'}`, questions: ds.map(congKhai), ...(kieu === 'g7' || LAM_LAI ? { goi7: GOI7 } : {}) }
  if (duong.endsWith('/game-v2/hoc-tap-lam-lai')) return { ok: true, questions: LAM_LAI ? CAU_LAM_LAI.map(congKhai) : [] }
  const q = [...ds, ...CAU_LAM_LAI].find((c) => c.qid === b.qid)
  if (!q) return null
  if (duong.endsWith('/game-v2/answer')) {
    const tra = String(b.answer ?? '')
    daNop++
    return { ok: true, correct: q.phan === 'III' ? so(tra) === so(q.dapAn) : tra === q.dapAn, answer: q.dapAn, solution: q.loiGiai, solutionImages: [], ...(q.vaiGoi7 === 'lam_lai' ? { attempt: { assisted: true } } : {}) }
  }
  if (duong.endsWith('/game-v2/hoc-tap-gap')) { daNop++; return { ok: true, correct: false, hocCoHoTro: true, answer: q.dapAn, solution: q.loiGiai, solutionImages: [] } }
  return null
}
