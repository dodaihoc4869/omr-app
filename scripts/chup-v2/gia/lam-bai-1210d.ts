// LÀN MÀN LÀM BÀI 12/10D — máy chủ GIẢ cho màn làm bài của học sinh (bản vẽ dot13 thầy duyệt 12/10). CHỈ dùng trong bản build chụp ảnh
// (scripts/chup-v2) và kịch bản vuốt thật (scripts/kiem-vuot-lam-bai.mjs). Không dữ liệu học sinh thật; câu hỏi soạn theo đúng bản vẽ.
//   ?man=lam13            chặng 2 (đã làm 6/24 câu hôm nay): 3 trắc nghiệm · 1 đúng–sai · 1 trắc nghiệm · 1 trả lời ngắn (số câu đúng bản vẽ)
//   ?man=lam13&lam=g7     câu mới của bài (Gói 7 ngày): chặng 3 · câu 1/6 · "Câu này em chọn làm thế nào?" (đã làm 12/24)
//   ?man=lam13&lam=ds-dau đúng–sai đứng đầu (kịch bản vuốt: ý d + nút cuối phải tới được bằng vuốt)
//   ?man=lam13&lam=so-o   15/10: số ô = đúng số kí tự đáp số (thầy 15/10 ~10:25): câu amine "24" (2 ô) · "6,48" (4 ô) · "10000" (5 ô)
import { soOPhanIII } from '../../../src/lib/so-o-tra-loi-ngan'
import { EXPANDED } from '../../../src/lib/experiments/expanded' // THÍ NGHIỆM GỌN 27/10
import { experimentKey } from '../../../src/lib/experiments/nhe'
import { tachDongTheoY } from '../../../src/lib/tach-dong-cau'
import { KET_BAI } from '../../../tests/_thuong-mau'

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
// ═══ BÀN PHÍM DUO 27/10: `lam13&lam=duo&ba=1` ⇒ câu trả lời ngắn D4 có hướng dẫn Gói 7 ⇒ thanh đáy đủ 3 viên (Hỏi thầy · Bắt đầu từ đâu? · Học cách giải) như ảnh thầy.
if (thamSo.get('ba') === '1') CAU_DUO[3] = { ...CAU_DUO[3]!, coGoi7: true }
// ═══ DUO APP 26/10: `lam13&lam=duo&ll=1` = có Gói 7 ⇒ hết chặng mà có câu tự làm sai thì gọi `hoc-tap-lam-lai` (hợp đồng docs/hop-dong-duolingo-2610.md mục 3):
// trả 1 câu anh em (chỉ đề) của câu D1; nộp qua `answer` ⇒ máy chủ ép có hỗ trợ (`attempt.assisted`).
const LAM_LAI = thamSo.get('ll') === '1'
const CAU_LAM_LAI: CauGia[] = [{ ...CAU_DUO[0]!, qid: 'DL1', vaiGoi7: 'lam_lai', lamLaiCua: 'D1', text: 'Số đồng phân amine bậc một có công thức phân tử C3H9N là' , choices: ['1', '2', '3', '4'], dapAn: 'B',
  loiGiai: { chot: 'C3H9N có 2 đồng phân amine bậc một: CH3CH2CH2NH2 và (CH3)2CHNH2.' } }]
// ═══ hết DUO 26/10
// ═══ KIỂM GD MỚI 26/10: `?man=lam13&lam=duo-xau` = dữ liệu XẤU cho màn làm chặng kiểu Duolingo: đề 6 dòng, phương án 3–4 dòng, công thức dài có chỉ
// số dưới (C6H5NH3Cl…), lưới 2×2 công thức sát ngưỡng 22 kí tự, ý Đúng/Sai dài, trả lời ngắn 6 ô (−12,75), hình rộng hơn màn + hình cuối câu, lời
// giải / lý do phương án dài. `&so=lon` ⇒ số hôm nay lớn (1234/2400 câu, 12 chặng).
const hinhRong = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="960" height="180" viewBox="0 0 960 180"><rect width="960" height="180" fill="white"/><g stroke="black" stroke-width="2" fill="none"><polygon points="60,50 95,30 130,50 130,90 95,110 60,90"/><line x1="130" y1="50" x2="900" y2="50"/></g><text x="300" y="120" font-family="sans-serif" font-size="22">C6H5–CH2–CH2–NH3Cl (hình rộng 960px)</text></svg>')
const LY_DAI = 'Phương án này nhầm giữa số đồng phân cấu tạo và số đồng phân bậc một: C4H11N có 8 đồng phân amine (4 bậc một, 3 bậc hai, 1 bậc ba); chỉ amine bậc một phản ứng với HNO2 ở nhiệt độ thường tạo alcohol và giải phóng khí N2, nên phải đếm riêng 4 chất bậc một.'
const CAU_XAU: CauGia[] = [
  { ...nen, qid: 'X1', maDe: 'BAI8', phan: 'I', tenDang: 'Muối phenylammonium chloride và phản ứng của muối amine với dung dịch kiềm mạnh',
    text: 'Cho 12,95 gam muối phenylammonium chloride (C6H5NH3Cl) tác dụng vừa đủ với dung dịch NaOH, đun nhẹ. Tách lấy lớp chất lỏng không tan rồi cho tác dụng với nước bromine dư thu được m gam kết tủa trắng 2,4,6-tribromoaniline (C6H2Br3NH2). Biết các phản ứng xảy ra hoàn toàn, hiệu suất tách đạt 100% và bỏ qua sự hoà tan của aniline trong nước. Giá trị của m gần nhất với giá trị nào sau đây?',
    choices: ['33,0 gam, vì số mol C6H2Br3NH2 bằng số mol C6H5NH3Cl ban đầu và khối lượng mol của kết tủa là 330 g/mol', '16,5 gam, vì chỉ một nửa lượng aniline phản ứng với bromine do lớp chất lỏng bị hao hụt khi tách khỏi dung dịch nước', '49,5 gam, vì mỗi phân tử aniline thế ba nguyên tử bromine nên khối lượng kết tủa gấp ba lần khối lượng muối', '24,75 gam, vì NaOH dư tác dụng với HBr sinh ra làm giảm lượng kết tủa thu được sau phản ứng thế'], ideas: [], dapAn: 'A',
    loiGiai: { chot: 'n(C6H5NH3Cl) = 12,95 : 129,5 = 0,1 mol = n(C6H5NH2) = n(C6H2Br3NH2) ⇒ m = 0,1 × 330 = 33,0 gam.', tung_pa: { A: { dung: true, vi_sao: 'Bảo toàn vòng benzene.' }, B: { dung: false, vi_sao: LY_DAI }, C: { dung: false, vi_sao: LY_DAI }, D: { dung: false, vi_sao: LY_DAI } } } },
  { ...nen, qid: 'X2', maDe: 'BAI8', phan: 'I', tenDang: 'Đồng phân cấu tạo của amine no, đơn chức, mạch hở có công thức phân tử C5H13N',
    text: 'Amine nào sau đây là amine bậc ba?', choices: ['CH3CH2CH2CH2CH2NH2', '(CH3)2CHCH2CH2NH2', '(CH3)2NCH2CH2CH3', 'CH3NHCH2CH2CH2CH3'], ideas: [], dapAn: 'C',
    loiGiai: { chot: 'Amine bậc ba: nguyên tử N liên kết với ba gốc hydrocarbon. (CH3)2NCH2CH2CH3 có N gắn hai nhóm CH3 và một nhóm C3H7 nên là amine bậc ba; các chất còn lại là amine bậc một hoặc bậc hai.' } },
  { ...nen, qid: 'X3', maDe: 'BAI4', phan: 'II', tenDang: 'Tính chất của ester và chất béo trong môi trường acid và base',
    text: 'Cho các phát biểu sau về ethyl acetate (CH3COOC2H5), tristearin ((C17H35COO)3C3H5) và phản ứng xà phòng hoá:', choices: [],
    ideas: ['Thuỷ phân hoàn toàn 8,9 gam tristearin ((C17H35COO)3C3H5) trong dung dịch NaOH dư, đun nóng, thu được 0,92 gam glycerol (C3H5(OH)3) và 9,18 gam muối sodium stearate (C17H35COONa).', 'Phản ứng thuỷ phân ethyl acetate (CH3COOC2H5) trong môi trường acid là phản ứng thuận nghịch, còn trong môi trường base là phản ứng một chiều.', 'Chất béo là triester của glycerol với acid béo; ở điều kiện thường các chất béo no như tristearin thường ở trạng thái rắn.', 'Xà phòng hoá hoàn toàn 1 mol tristearin cần đúng 1 mol NaOH vì phân tử chỉ có một nhóm chức ester.'],
    dapAn: 'DDDS',
    loiGiai: { chot: 'Tristearin có 3 nhóm ester ⇒ cần 3 mol NaOH cho 1 mol chất béo.', tung_y: { d: { dung: false, vi_sao: 'Tristearin là triester (ba nhóm –COO–) nên xà phòng hoá hoàn toàn 1 mol cần 3 mol NaOH, thu được 1 mol glycerol và 3 mol C17H35COONa.' } } } },
  { ...nen, qid: 'X4', maDe: 'BAI1', phan: 'III', tenDang: 'Biến thiên enthalpy của phản ứng đốt cháy hợp chất hữu cơ chứa nitrogen',
    text: 'Biết biến thiên enthalpy tạo thành chuẩn của các chất: CH3NH2(g) là −23,0 kJ/mol; CO2(g) là −393,5 kJ/mol; H2O(l) là −285,8 kJ/mol. Tính biến thiên enthalpy (kJ) khi đốt cháy 0,0125 mol methylamine theo phương trình 4CH3NH2 + 9O2 → 4CO2 + 10H2O + 2N2. (Làm tròn đến hàng phần trăm.)', choices: [], ideas: [], dapAn: '-12,75',
    loiGiai: { chot: 'ΔrH° (4 mol) = 4(−393,5) + 10(−285,8) − 4(−23,0) = −4340 kJ ⇒ 0,0125 mol: −4340 × 0,0125 : 4 ≈ −13,56; số giả chỉ để chụp.' } },
  { ...nen, qid: 'X5', maDe: 'BAI8', phan: 'I', tenDang: 'Hợp chất chứa nitrogen', hinhAnh: [{ src: hinhRong, viTri: 'sau_de', alt: 'Công thức cấu tạo (hình rộng)' }, { src: hinhDuo, viTri: 'cuoi_cau', alt: 'Hình cuối câu' }],
    text: 'Hợp chất có công thức cấu tạo như hình dưới đây có tên gọi theo danh pháp thay thế là gì?',
    choices: ['2-phenylethan-1-amine', 'N-methylbenzylamine', 'benzylamine', '1-phenylethan-1-amine'], ideas: [], dapAn: 'A',
    loiGiai: { chot: 'Nhóm NH2 gắn ở C1 của mạch ethan, vòng benzene ở C2.' } },
]
// ═══ NÂNG CẤP 27/10: `lam13&lam=duo-nc` (bản vẽ ve-moi/nang-cap) — câu chọn chất (4 phân tử), câu tính có cảnh phản ứng + 4 phương án số, câu aniline
// (câu cuối trả `thuong.tinh = false` ⇒ tấm «Câu này chưa được tính»). Số liệu tự giải: 4,5 g C2H5NH2 = 0,1 mol ⇒ 0,1 × 81,5 = 8,15 g C2H5NH3Cl;
// 0,1 mol C6H5NH2 ⇒ 0,1 × 129,5 = 12,95 g C6H5NH3Cl.
const CAU_NC: CauGia[] = [
  { ...nen, qid: 'N1', maDe: 'BAI8', phan: 'I', tenDang: 'Amine — khái niệm, phân loại', text: 'Chất nào sau đây là amine?', choices: ['ethanol', 'methylamine', 'acetic acid', 'methyl formate'], ideas: [], dapAn: 'B',
    loiGiai: { chot: 'Amine có nhóm –NH2 (hoặc –NH–, –N<) gắn vào gốc hydrocarbon: CH3NH2 là methylamine.' } },
  { ...nen, qid: 'N2', maDe: 'BAI8', phan: 'I', tenDang: 'Amine — tính base — tính khối lượng', text: 'Cho 4,5 gam ethylamine tác dụng với dung dịch HCl vừa đủ, thu được m gam muối. Giá trị của m là', choices: ['7,65', '8,15', '8,10', '9,15'], ideas: [], dapAn: 'B',
    loiGiai: { chot: 'C2H5NH2 + HCl → C2H5NH3Cl; n = 4,5 : 45 = 0,1 mol ⇒ m = 0,1 × 81,5 = 8,15 gam.' } },
  { ...nen, qid: 'N3', maDe: 'BAI8', phan: 'I', tenDang: 'Amine — tính base — tính khối lượng', text: 'Cho 0,1 mol aniline tác dụng vừa đủ với HCl. Khối lượng muối phenylammonium chloride thu được là', choices: ['25,900 gam.', '6,475 gam.', '19,425 gam.', '12,950 gam.'], ideas: [], dapAn: 'D',
    loiGiai: { chot: 'C6H5NH2 + HCl → C6H5NH3Cl; m = 0,1 × 129,5 = 12,95 gam.' } },
]
// ═══ BẢNG + TẤM CHƯA TÍNH 27/10: `lam13&lam=duo-bang` — câu có bảng 2 hàng × 4 cột (ảnh thầy: nhiệt độ sôi NH3 −33,3 · CH3NH2 −6,4 · C2H5NH2 16,6 °C)
// tự xoay dọc ở khổ hẹp; nộp ⇒ `thuong.tinh = false` (tấm «Chưa được tính»); câu 2 có bảng lớn 3 hàng × 5 cột (cuộn ngang, bóng mép).
const CAU_BANG: CauGia[] = [
  { ...nen, qid: 'B1', maDe: 'BAI8', phan: 'I', tenDang: 'Amine — tính chất vật lí', text: 'Cho nhiệt độ sôi của dãy các chất gồm ammonia và các amine như bảng sau.\nNgoài liên kết hydrogen, tương tác van der Waals, yếu tố nào sau đây ảnh hưởng chính đến chiều biến đổi nhiệt độ sôi trong dãy trên?',
    table: [['Chất', 'Ammonia', 'Methylamine', 'Ethylamine'], ['Nhiệt độ sôi (°C)', '−33,3', '−6,4', '16,6']],
    choices: ['Độ dài liên kết N–H.', 'Số oxi hoá của nguyên tử N.', 'Khối lượng phân tử.', 'Năng lượng liên kết N–H.'], ideas: [], dapAn: 'C',
    loiGiai: { chot: 'Cùng có liên kết hydrogen; phân tử khối tăng (17 < 31 < 45) ⇒ tương tác van der Waals mạnh hơn ⇒ nhiệt độ sôi tăng.' } },
  { ...nen, qid: 'B2', maDe: 'BAI8', phan: 'I', tenDang: 'Amine — tính chất vật lí', text: 'Cho bảng nhiệt độ sôi và độ tan trong nước của một số chất. Chất nào sau đây tan tốt nhất trong nước?',
    table: [['Chất', 'Methylamine', 'Ethylamine', 'Propylamine', 'Aniline'], ['Nhiệt độ sôi (°C)', '−6,4', '16,6', '47,8', '184,1'], ['Độ tan (g/100 g nước)', 'rất lớn', 'rất lớn', 'lớn', '3,6']],
    choices: ['Methylamine.', 'Aniline.', 'Propylamine.', 'Benzene.'], ideas: [], dapAn: 'A', loiGiai: { chot: 'Amine mạch ngắn tan rất tốt nhờ liên kết hydrogen với nước.' } },
]
// ═══ COMBO + CÂU DÀI 27/10: `lam13&lam=duo-combo&chuoi=2|4|9` — câu đầu DÀI (bảng + đề nhiều dòng, phải cuộn mới tới phương án) để quay mốc 3 · 5 · 10
// (thanh trên dính, sét, lắc, Bi gom, viên «+N» cạnh bộ đếm); các câu sau là câu ngắn của duo-nc. Mọi câu đều được tính.
const CAU_COMBO: CauGia[] = [
  { ...CAU_BANG[0]!, qid: 'L1', text: `${CAU_BANG[0]!.text}\nBiết rằng cả ba chất đều tạo được liên kết hydrogen giữa các phân tử, nhưng số liên kết N–H trong mỗi phân tử giảm dần từ ammonia đến ethylamine. Khi phân tử khối tăng, diện tích tiếp xúc giữa các phân tử tăng nên tương tác van der Waals mạnh dần.\nHãy chọn yếu tố giải thích đúng xu hướng nhiệt độ sôi trong bảng.` },
  { ...CAU_NC[0]!, qid: 'C2' }, { ...CAU_NC[1]!, qid: 'C3' }, { ...CAU_BANG[1]!, qid: 'C4' },
]
const SO_LON = thamSo.get('so') === 'lon'
// ═══ hết KIỂM GD MỚI 26/10
// ═══ THẺ CHẠM 27/10: `lam13&lam=duo&cham=chat|don-vi|phu-dinh|vd` — câu đầu chặng có chữ chạm để chụp thẻ kiểu Duolingo (tiền tố ảnh «duo-cham-»):
// chất (aniline) · đơn vị (1,5 M) · phủ định (không đúng) · vd = đúng câu trong ảnh thầy gửi (không còn tô «dịch chất nào sau đây»).
const CHAM = thamSo.get('cham') ?? ''
const CAU_CHAM: Record<string, CauGia> = {
  chat: { ...nen, qid: 'C1', maDe: 'BAI8', phan: 'III', tenDang: 'Amine', text: 'Cho 4,65 gam aniline tác dụng vừa đủ với dung dịch HCl. Khối lượng muối thu được là bao nhiêu gam? (Làm tròn đến hàng phần trăm.)', choices: [], ideas: [], dapAn: '6,48',
    loiGiai: { chot: 'n(aniline) = 4,65 : 93 = 0,05 mol = n(muối) ⇒ m = 0,05 × 129,5 = 6,475 ≈ 6,48 gam.' } },
  'don-vi': { ...nen, qid: 'C2', maDe: 'BAI1', phan: 'III', tenDang: 'Ester – Lipid', text: 'Thuỷ phân hoàn toàn 8,8 gam ethyl acetate bằng 100 mL dung dịch NaOH 1,5 M, đun nóng. Cô cạn dung dịch sau phản ứng, thu được m gam chất rắn khan. Giá trị của m là', choices: [], ideas: [], dapAn: '10,2',
    loiGiai: { chot: 'n(ester) = 0,1 mol, n(NaOH) = 0,15 mol ⇒ chất rắn: 0,1 mol CH3COONa (8,2 g) + 0,05 mol NaOH dư (2 g) = 10,2 gam.' } },
  'phu-dinh': { ...nen, qid: 'C3', maDe: 'BAI8', phan: 'I', tenDang: 'Amine', text: 'Phát biểu nào sau đây về aniline (C6H5NH2) không đúng?', choices: ['Aniline là amine bậc một.', 'Dung dịch aniline làm quỳ tím hoá xanh.', 'Aniline tác dụng với nước bromine tạo kết tủa trắng.', 'Aniline tác dụng với dung dịch HCl.'], ideas: [], dapAn: 'B',
    loiGiai: { chot: 'Aniline có tính base rất yếu, dung dịch không làm quỳ tím đổi màu.' } },
  vd: { ...nen, qid: 'C4', maDe: 'BAI8', phan: 'I', tenDang: 'Amine', text: 'Ethylamine thể hiện tính khử khi tác dụng với dung dịch chất nào sau đây ở nhiệt độ thường?', choices: ['HCl', 'HNO2', 'FeCl3', 'CH3COOH'], ideas: [], dapAn: 'B',
    loiGiai: { chot: 'Amine bậc một + HNO2 ⇒ N2: nguyên tử N (−3) lên 0, ethylamine là chất khử.' } },
}
const CAU_DUO_CHAM = CAU_CHAM[CHAM] ? [CAU_CHAM[CHAM]!, ...CAU_DUO] : CAU_DUO
// ═══ hết THẺ CHẠM 27/10
// ═══ PHƯƠNG TRÌNH 27/10: `lam13&lam=duo-pt` — đúng câu trong ảnh thầy (chặng 3 · 4 câu): bốn phương án là phương trình viết LIỀN, chỉ số / điện tích
// Unicode như kho thật ⇒ soát dấu cộng toán tử (ROH + N₂, không phải ROH⁺), khoảng hẹp quanh toán tử, ⇌ cỡ chữ, «l» trong HCl. Đáp án D (phản ứng với HNO₂).
const CAU_PT: CauGia[] = [
  { ...nen, qid: 'P1', maDe: 'BAI8', phan: 'I', tenDang: 'Amine — tính base', text: 'Phản ứng nào dưới đây không thể hiện tính base của amine?',
    choices: ['RNH₂+H₂O⇌RNH₃⁺+OH⁻.', 'C₆H₅NH₂+HCl→C₆H₅NH₃Cl.', 'Fe³⁺+3RNH₂+3H₂O→Fe(OH)₃↓+3RNH₃⁺.', 'RNH₂+HNO₂→ROH+N₂↑+H₂O.'], ideas: [], dapAn: 'D',
    loiGiai: { chot: 'RNH2 + HNO2 → ROH + N2↑ + H2O: N của amine bị oxi hoá (−3 lên 0), không nhận H⁺ ⇒ không phải tính base.' } },
  ...CAU_NC,
]
// ═══ hết PHƯƠNG TRÌNH 27/10
// ═══ THÍ NGHIỆM GỌN 27/10: `lam13&lam=duo-tn` — câu đúng–sai kiểu ảnh thầy (methylamine + phenolphthalein + HCl) có khối «Xem thí nghiệm».
// Kho thật gắn cảnh theo dấu vân tay đề (scripts/experiment-reviewed-map.json, câu DH-12-C3-B8-II-11); trang chụp không có đề gốc nguyên văn
// ⇒ gắn dấu vân tay của đề giả vào bảng tra cảnh (chỉ bản build chụp).
const TN_DE = 'Tiến hành thí nghiệm theo các bước sau:\nBước 1: Cho 2 mL dung dịch methylamine 0,1 M vào ống nghiệm, thêm tiếp 1 giọt phenolphthalein.\nBước 2: Nhỏ từ từ 2 mL dung dịch HCl 0,1 M vào ống nghiệm.'
const CAU_TN: CauGia[] = [
  { ...nen, qid: 'TN1', maDe: 'BAI8', phan: 'II', tenDang: 'Amine — tính base', text: TN_DE, choices: [],
    ideas: ['Sau bước 1, dung dịch trong ống nghiệm có màu hồng.', 'Sau bước 2, màu hồng của dung dịch nhạt dần rồi mất.', 'Methylamine có tính base mạnh hơn ammonia.', 'Sau bước 2, dung dịch thu được chỉ chứa một chất tan.'],
    dapAn: 'DDDS', loiGiai: { chot: 'CH3NH2 làm phenolphthalein hoá hồng; HCl vừa đủ trung hoà ⇒ mất màu; dung dịch còn CH3NH3Cl (và phenolphthalein).' } },
  ...CAU_NC,
]
if (kieu === 'duo-tn') (EXPANDED as Record<string, string[]>)[experimentKey(tachDongTheoY(TN_DE))] = ['amine-acid']
// ═══ hết THÍ NGHIỆM GỌN 27/10
// ═══ GIÁM THỊ 27/10: `&gt=nb|th|vd|vdc` ⇒ mọi câu mang mức ấy (giám thị tương ứng); `&gtde=ngan` ⇒ thêm câu đề NGẮN (L2, đáp án B) lên đầu chặng Duo.
const MUC_GT = ({ nb: 'biet', th: 'hieu', vd: 'van_dung', vdc: 'van_dung_cao', khong: '' } as Record<string, string>)[thamSo.get('gt') ?? ''] // khong ⇒ câu không mức (đo nền)
// `&gtde=dai` ⇒ câu đề DÀI ~15 dòng (ảnh thầy gửi 27/10, câu toluidine) lên đầu chặng: khung chữ L ôm giám thị.
const CAU_TOLUIDINE: CauGia = { ...nen, qid: 'GT2', maDe: 'BAI8', phan: 'I', tenDang: 'Tính base của amine', text: 'Toluidine là một nhóm chất amine thơm bậc I, trong đó đồng phân ortho được dùng để sản xuất thuốc trừ sâu metolachlor và acetochlor. Các đồng phân toluidine khác được sử dụng trong sản xuất thuốc nhuộm. Phổ khối lượng (MS) cho biết toluidine có phân tử khối 107. Kết quả phân tích nguyên tố cho biết phần trăm khối lượng các nguyên tố carbon, hydrogen và nitrogen trong phân tử toluidine lần lượt bằng 78,50; 8,42 và 13,08.\n\nCông thức cấu tạo nào sau đây không đúng với toluidine?',
  choices: ['o-CH3-C6H4-NH2.', 'm-CH3-C6H4-NH2.', 'p-CH3-C6H4-NH2.', 'C6H5-CH2-NH2.'], ideas: [], dapAn: 'D', loiGiai: { chot: 'C6H5-CH2-NH2 là benzylamine (amine bậc I nhưng N không gắn vào vòng), không phải toluidine.' } }
// `&gtde=4dong|6dong`: đề 4 dòng (ảnh thầy 27/10 tối: câu aniline — trước bị khung chữ L có đáy rỗng) và 6 dòng.
const CAU_4DONG: CauGia = { ...nen, qid: 'GT3', maDe: 'BAI8', phan: 'I', tenDang: 'Amine', text: 'Phần trăm khối lượng của nguyên tố carbon trong phân tử aniline là bao nhiêu %? (Kết quả làm tròn đến hàng phần mười).',
  choices: ['77,4', '75,0', '15,1', '7,5'], ideas: [], dapAn: 'A', loiGiai: { chot: 'Aniline là C6H5NH2, M = 93 ⇒ %C = 72 : 93 = 77,4 %.' } }
const CAU_6DONG: CauGia = { ...nen, qid: 'GT4', maDe: 'BAI8', phan: 'I', tenDang: 'Muối của amine', text: 'Cho 4,5 gam ethylamine (C2H5NH2) tác dụng vừa đủ với dung dịch HCl, thu được dung dịch X. Cô cạn cẩn thận dung dịch X ở nhiệt độ thấp, thu được m gam muối khan. Giá trị của m là',
  choices: ['7,65', '8,10', '8,15', '0,85'], ideas: [], dapAn: 'C', loiGiai: { chot: 'n = 4,5 : 45 = 0,1 mol ⇒ m = 0,1 × 81,5 = 8,15 gam.' } }
// `&gtde=aniline` ⇒ đề DÀI nhiều ý như ảnh thầy 27/10 («Đề hiển thị phải có giãn cách ý»): giới thiệu · phương pháp · Bước 1 (kèm phương trình) · Bước 2 · Giả sử… · câu hỏi.
const CAU_ANILINE: CauGia = { ...nen, qid: 'GT5', maDe: 'BAI8', phan: 'I', tenDang: 'Xử lí aniline trong nước thải', text: [
  'Aniline (C6H5NH2) là một amine thơm được sử dụng rộng rãi trong công nghiệp để sản xuất phẩm nhuộm, dược phẩm và hóa chất khác. Tuy nhiên, aniline là chất độc và có thể gây hại cho môi trường nếu không được xử lý đúng cách.',
  'Một phương pháp xử lý aniline trong nước thải công nghiệp là oxi hoá aniline thành picric acid (2,4,6-trinitrophenol), một chất ít độc hơn và có thể được sử dụng làm thuốc nổ hoặc chất nhuộm.',
  'Bước 1: Nitro hoá aniline để tạo 2,4,6-trinitroaniline C6H5NH2 + 3HNO3 đặc, (H2SO4 đặc, t°) → C6H2(NO2)3NH2 + 3H2O',
  'Bước 2: Oxi hoá 2,4,6-trinitroaniline bằng Na2Cr2O7/H+ tạo thành 2,4,6-trinitrophenol.',
  'Giả sử một nhà máy thải ra 1000 lít nước (khối lượng riêng 1 g/mL) chứa 0,05% khối lượng aniline. Để xử lý toàn bộ lượng aniline này, người ta sử dụng dung dịch HNO3 68% (khối lượng riêng 1,42 g/mL). Thể tích dung dịch HNO3 tối thiểu cần dùng là bao nhiêu lít?',
].join('\n'), choices: ['1,05', '0,35', '1,52', '3,15'], ideas: [], dapAn: 'A', loiGiai: { chot: 'm aniline = 500 g ⇒ 5,376 mol ⇒ HNO3 16,13 mol = 1016 g ⇒ dung dịch 1494 g ⇒ 1,05 lít.' } }
// ═══ CHẶNG NGANG 01/11: `lam13&lam=chang-ngang` (thầy «Phần chặng của học sinh tối ưu thêm cho màn xoay ngang và máy tính … đề dài nhớ có thanh cuộn»):
// đủ 4 kiểu câu theo thứ tự chụp — trắc nghiệm ngắn (D1) · ĐỀ DÀI (6 đoạn + phương trình dài `\ce{}` ⇒ ô cuộn ngang `.ct-dai` + bảng + hình) ·
// đúng–sai 4 ý (L4) · trả lời ngắn có bàn phím số (D4). Số liệu đề dài tự giải: V tb = 13,20 mL ⇒ n(KMnO4) = 1,32·10⁻⁴ ⇒ n(Fe²⁺) 10 mL = 6,6·10⁻⁴
// ⇒ 100 mL: 6,6·10⁻³ mol × 152 = 1,0032 g ⇒ 50,16 %.
const hinhChuanDo = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="360" height="220" viewBox="0 0 360 220"><rect width="360" height="220" fill="white"/><g stroke="black" stroke-width="2" fill="none"><rect x="160" y="10" width="22" height="120"/><line x1="171" y1="130" x2="171" y2="150"/><path d="M130 150 h82 l26 56 h-134 z"/><line x1="40" y1="206" x2="320" y2="206"/></g><g font-family="sans-serif" font-size="14" fill="black"><text x="192" y="40">Burette</text><text x="192" y="58">KMnO4 0,0100 M</text><text x="226" y="186">10,00 mL dung dịch X</text></g></svg>')
const CAU_DAI_NGANG: CauGia = { ...nen, qid: 'NG2', maDe: 'BAI-OXH', phan: 'I', tenDang: 'Chuẩn độ oxi hoá – khử', text: [
  'Thuốc tím (potassium permanganate, KMnO4) là chất oxi hoá mạnh, được dùng phổ biến để chuẩn độ xác định hàm lượng sắt trong mẫu quặng và trong viên thuốc bổ sung sắt.',
  'Một nhóm học sinh tiến hành như sau: hoà tan hoàn toàn 2,00 gam mẫu viên thuốc bổ sung sắt (chứa FeSO4) trong dung dịch H2SO4 loãng dư, thu được 100,0 mL dung dịch X. Lấy 10,00 mL dung dịch X cho vào bình tam giác rồi chuẩn độ bằng dung dịch KMnO4 0,0100 M như hình dưới đây.',
  'Phản ứng chuẩn độ xảy ra theo phương trình:',
  '\\ce{2KMnO4 + 10FeSO4 + 8H2SO4 -> K2SO4 + 2MnSO4 + 5Fe2(SO4)3 + 8H2O}',
  'Biết các tạp chất trong viên thuốc không phản ứng với KMnO4; điểm tương đương nhận ra khi dung dịch trong bình chuyển sang màu hồng nhạt bền trong khoảng 20 giây. Kết quả ba lần chuẩn độ được ghi trong bảng sau.',
  'Phần trăm khối lượng FeSO4 trong mẫu viên thuốc là',
].join('\n'), table: [['Lần chuẩn độ', '1', '2', '3'], ['Thể tích KMnO4 (mL)', '13,10', '13,20', '13,30']],
  hinhAnh: [{ src: hinhChuanDo, viTri: 'sau_de', alt: 'Sơ đồ chuẩn độ bằng burette' }],
  choices: ['50,16%', '10,03%', '25,08%', '45,60%'], ideas: [], dapAn: 'A',
  loiGiai: { chot: 'V trung bình = 13,20 mL ⇒ n(KMnO4) = 0,0100 × 0,01320 = 1,32·10⁻⁴ mol ⇒ n(Fe²⁺) trong 10,00 mL = 5 × 1,32·10⁻⁴ = 6,6·10⁻⁴ mol.',
    buoc: ['Trong 100,0 mL dung dịch X: n(FeSO4) = 6,6·10⁻³ mol', 'm(FeSO4) = 6,6·10⁻³ × 152 = 1,0032 gam', '%m(FeSO4) = 1,0032 : 2,00 × 100 = 50,16%'],
    tung_pa: { A: { dung: true, vi_sao: 'Đúng tỉ lệ 1 KMnO4 : 5 Fe²⁺ và nhân 10 cho cả 100 mL.' }, B: { dung: false, vi_sao: 'Quên nhân 5 theo tỉ lệ mol KMnO4 : FeSO4 = 2 : 10 = 1 : 5 trong phương trình.' }, C: { dung: false, vi_sao: 'Nhầm tỉ lệ 1 : 2,5.' }, D: { dung: false, vi_sao: 'Dùng thể tích lần 1 thay vì thể tích trung bình và làm tròn sớm.' } } } }
const CAU_NGANG: CauGia[] = [{ ...CAU_DUO[0]!, qid: 'NG1' }, CAU_DAI_NGANG, { ...CAU[3]!, qid: 'NG3' }, { ...CAU_DUO[3]!, qid: 'NG4' }]
// ═══ hết CHẶNG NGANG 01/11
const DAU_GT: Record<string, CauGia> = { ngan: { ...CAU[1]!, qid: 'GT1' }, '4dong': CAU_4DONG, '6dong': CAU_6DONG, dai: CAU_TOLUIDINE, aniline: CAU_ANILINE }
const CAU_DUO_GT = DAU_GT[thamSo.get('gtde') ?? ''] ? [DAU_GT[thamSo.get('gtde')!]!, ...CAU_DUO_CHAM] : CAU_DUO_CHAM
const ds0 = kieu === 'chang-ngang' ? CAU_NGANG : kieu === 'duo-tn' ? CAU_TN : kieu === 'duo-bang' ? CAU_BANG : kieu === 'duo-pt' ? CAU_PT : kieu === 'duo-nc' ? CAU_NC : kieu === 'duo-combo' ? CAU_COMBO : kieu === 'duo-xau' ? CAU_XAU : kieu === 'duo' ? CAU_DUO_GT : kieu === 'g7' ? CAU_G7 : kieu === 'ds-dau' ? [CAU[3]!, CAU[4]!, CAU[5]!] : kieu === 'so-o' ? CAU_SO_O : CAU
const ds = MUC_GT !== undefined ? ds0.map((c) => ({ ...c, mucDo: MUC_GT || null })) : ds0
const GOI7 = { bat: true, ngay: '2026-10-12', toiThieu: 24, daLamHomNay: 12, tuLamCon: 9, tiepCanCon: 3, thieuPhu: 0, thieuNgay: 0, canHoTro: false, kienThucCu: { tong: 0, dat: 0, tyLe: null },
  goi: [{ id: 'g8', ten: 'Bài 8. Amine', batDau: '2026-10-10', han: '2026-10-16', tong: 40, daGap: 10, con: 30, quota: 6, gapHomNay: 2, quaHan: false, canBoSung: 0, to: ['BAI8-AMINE'] }], diemDaDo: [] }

// Số câu đã làm hôm nay: chặng 2 bắt đầu ở 6/24 (chặng 3 ở 12/24); mỗi câu nộp / học cách giải +1 — như Sảnh tải lại sau mỗi câu.
let daNop = 0
const DAU = kieu === 'g7' || kieu === 'duo-pt' ? 12 : thamSo.get('giu') === '1' ? 2 : 6 // GIỮ CHÂN 27/10: hôm nay mới 2 câu ⇒ tấm nhắc giữ chuỗi
export const soHomNayLam13 = () => SO_LON ? { daLam: 1234 + daNop, muc: 2400, chang: 11, soChang: 12 } : ({ daLam: DAU + daNop, muc: 24, chang: Math.floor(DAU / 6) + 1, soChang: 4 })

// Như `publicQuestion`: câu Phần III kèm số ô = đúng số kí tự đáp số (chỉ con số), không kèm đáp án.
const congKhai = ({ dapAn: _d, loiGiai: _l, ...q }: CauGia) => { const n = q.phan === 'III' ? soOPhanIII(_d) : null; return n === null ? q : { ...q, soO: n } }
const so = (v: string) => Number(String(v).replace(',', '.'))
// THƯỞNG PHẠT (gộp 26/10): `&tp=1` ⇒ lệnh answer trả `thuong` (Đúng +10, chuỗi ≥ 3: +2; sai làm kĩ +2) như máy chủ phần A, câu cuối của chặng thêm `ketBai`.
const TP = thamSo.get('tp') === '1' || kieu === 'duo-nc' || kieu === 'duo-bang' || kieu === 'duo-combo'
let chuoiTp = Number(thamSo.get('chuoi') ?? 0) // `&chuoi=2` (27/10): bắt đầu giữa chuỗi đúng ⇒ câu đúng đầu chạm mốc 3 (cảnh hiệu ứng mốc combo)
const daTraTp = new Set<string>()
const thuongTp = (dung: boolean) => {
  chuoiTp = dung ? chuoiTp + 1 : 0
  return dung ? { tinh: true, nguyenTu: 10 + (chuoiTp >= 3 ? 2 : 0), dong: [{ nhan: 'Đúng', so: 10 }, ...(chuoiTp >= 3 ? [{ nhan: `Chuỗi đúng ${chuoiTp}`, so: 2 }] : [])], chuoiDung: chuoiTp, cauKho: false }
    : { tinh: true, nguyenTu: 2, dong: [{ nhan: 'Làm nghiêm túc', so: 2 }], chuoiDung: 0, cauKho: false }
}
/** Trả lời các lệnh `/game-v2/hoc-tap-*` + `answer` của màn làm bài; lệnh khác ⇒ null (bộ giả chung lo). */
export function traLoiLam13(duong: string, b: Record<string, unknown>): Record<string, unknown> | null {
  if (duong.endsWith('/game-v2/hoc-tap-start') && thamSo.get('loi') === '1') return { ok: false, error: 'Máy chủ đang bận, chưa mở được chặng học của em lúc này. Em kiểm tra kết nối mạng rồi bấm Thử lại sau ít phút nhé.' } // KIỂM GD MỚI 26/10
  if (duong.endsWith('/game-v2/hoc-tap-start')) return { ok: true, id: `phien-${kieu || 'chung'}`, questions: ds.map(congKhai), ...(kieu === 'g7' || LAM_LAI ? { goi7: GOI7 } : {}) }
  if (duong.endsWith('/game-v2/hoc-tap-lam-lai')) return { ok: true, questions: LAM_LAI ? CAU_LAM_LAI.map(congKhai) : [] }
  // HỎI THẦY THEO TÔNG 27/10: `&ht=1` ⇒ lệnh /hs/hoi-thay trả hộp hỏi thêm (đề câu + thẻ «Em và câu này» «Tự làm đúng 1/2 lần») như máy chủ thật.
  if (duong.endsWith('/hs/hoi-thay') && thamSo.get('ht') === '1') {
    const c = ds.find((x) => x.qid === b.qid)
    if (!c) return null
    const y = Object.fromEntries(((c.choices as string[] | undefined) ?? []).map((t, i) => ['ABCD'[i]!, t]))
    const cau = { qid: c.qid, so: `Câu ${ds.indexOf(c) + 1}`, chuong: String(c.tenDang ?? ''), de: `<p>${String(c.text ?? '')}</p>`, y }
    const em = { cauNay: { tuLam: 2, tuLamDung: 1, coTroGiup: 0, lan: [{ ketQua: 0, troGiup: false, luc: '2026-10-25T08:00:00Z' }, { ketQua: 1, troGiup: false, luc: '2026-10-26T08:00:00Z' }] }, kienThuc: [], hoiNhanh: ['Vì sao chỉ amine bậc một tạo alcohol?'] }
    return b.chiHoi ? { ok: true, chiHoi: true, hoiThem: true, cau, emVaCau: em } : { ok: true, hoiThem: true, cau, loiGiaiChu: { chu: '' }, emVaCau: em }
  }
  const q = [...ds, ...CAU_LAM_LAI].find((c) => c.qid === b.qid)
  if (!q) return null
  if (duong.endsWith('/game-v2/answer')) {
    const tra = String(b.answer ?? '')
    daNop++
    const dung = q.phan === 'III' ? so(tra) === so(q.dapAn) : tra === q.dapAn
    daTraTp.add(q.qid)
    const tp = TP ? { thuong: q.qid === 'N3' || q.qid === 'B1' ? { tinh: false, nguyenTu: 0, dong: [], chuoiDung: 0, cauKho: false } : thuongTp(dung), ...(ds.every((c) => daTraTp.has(c.qid)) ? { ketBai: KET_BAI } : {}) } : {}
    return { ok: true, correct: dung, answer: q.dapAn, solution: q.loiGiai, solutionImages: [], ...(q.vaiGoi7 === 'lam_lai' ? { attempt: { assisted: true } } : {}), ...tp }
  }
  if (duong.endsWith('/game-v2/hoc-tap-gap')) { daNop++; return { ok: true, correct: false, hocCoHoTro: true, answer: q.dapAn, solution: q.loiGiai, solutionImages: [] } }
  return null
}
