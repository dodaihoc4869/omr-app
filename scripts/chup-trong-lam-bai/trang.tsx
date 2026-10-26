// TRANG CHỤP ẢNH «TRONG» NHÓM 2 (26/10) — chép từ scripts/chup-dot16-lan-b, thêm trong.css + <html data-trong="hs"> như main.tsx (`&trong=tat` = giao diện cũ)
// và cảnh Kết quả sau nộp (`?man=kq` đã công bố · `?man=kq-cho` chờ cả lớp).
// Component THẬT + máy chủ GIẢ ngay trong trang (bọc `fetch`) — không yêu cầu nào tới máy chủ thật, không dữ liệu học sinh thật.
// Thứ tự CSS chép đúng src/main.tsx (bản phát hành) để ảnh khớp bản sống.
//   ?man=lam13[&lam=ds-dau|g7]   Màn làm bài (ManLamBaiTap) — máy chủ giả dùng lại scripts/chup-v2/gia/lam-bai-1210d.ts
//   ?man=cauon                   Ôn câu hôm nay (LamCauOn) trong đúng tấm phủ M3 của cổng học sinh
//   ?man=luyende                 Luyện đề chuẩn cấu trúc (LuyenDeChuan) — kịch bản bấm "Bắt đầu" để mở màn làm bài
//   ?man=ldct                    Luyện đề cấu trúc trong Tu luyện (LuyenDeCauTruc) — kịch bản bấm "Bắt đầu"
//   ?man=tuluyen-lam             Tu luyện đang làm (ManTuLuyen, bài dở trong localStorage)
//   ?man=cdl                     Câu đã làm (CauDaLam)
//   ?man=thi                     Màn thi (ExamTakeScreen) — vào lại lượt dở đã cất trong IndexedDB (máy chủ giả không trả lời ⇒ đường "rớt mạng")
//   &toi=1                       chế độ tối
//   npx vite build --config scripts/chup-trong-lam-bai/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-trong-lam-bai/chup.mjs <thư mục tạm> <thư mục ảnh>
import './bat-trong' // phải đứng ĐẦU: gắn data-trong trước khi mô-đun màn chạy
import './../../src/components/m3/m3-tuong-thich.css'
import './../../src/components/bang-nhiem-vu/m3-theme.css'
import './../../src/components/m3/m3.css'
import './../../src/components/loi-giai/loi-giai.css'
import './../../src/components/o-so-tra-loi.css'
import './../../src/components/m3/khung-xem-phieu.css'
import '@fontsource/noto-serif/latin-400.css'
import '@fontsource/noto-serif/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import './../../src/styles/tokens.css'
import './../../src/styles/thang.css'
import './../../src/index.css'
import './../../src/styles/the-loc.css'
import './../../src/styles/may-yeu.css'
import './../../src/components/exp-cau/exp-cau.css'
import './../../src/components/bat-linh/bat-linh.css'
import './../../src/components/bat-linh/hoc-sinh.css'
import './../../src/components/bat-linh/phu-huynh.css'
import './../../src/components/bat-linh/che-do-toi.css'
import './../../src/styles/teacher-layout.css'
import './../../src/styles/giao-dien-day-du.css'
import './../../src/styles/vo-thay.css'
import './../../src/components/logo-ddh.css'
import './../../src/components/chien-dich/thanh-ben-hoa2.css'
import './../../src/components/thanh-ben-gv2.css'
import './../../src/components/m3/phieu-screen.css'
import './../../src/styles/gv-mau.css'
import './../../src/styles/teacher-modern.css'
// Cổng học sinh (StudentPortalScreen) nạp hai tờ này; Hôm nay nạp hoc-tap.css trước khi mở các màn con.
import './../../src/components/bang-nhiem-vu/sheet-m3.css'
import './../../src/components/hoc-tap/hoc-tap.css'
import './../../src/styles/trong.css'
import { createElement as h, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { X } from 'lucide-react'
import BatLinhShell from '../../src/components/bat-linh/BatLinhShell'
import ManLamBaiTap from '../../src/components/hoc-tap/ManLamBaiTap'
import LamCauOn from '../../src/components/bang-nhiem-vu/LamCauOn'
import LuyenDeChuan from '../../src/components/LuyenDeChuan'
import LuyenDeCauTruc from '../../src/components/tu-luyen/LuyenDeCauTruc'
import ManTuLuyen from '../../src/components/tu-luyen/ManTuLuyen'
import ManChuaCauSai from '../../src/components/chua-cau-sai/ManChuaCauSai'
import ManKiemTraCaNhan from '../../src/components/hoc-tap/ManKiemTraCaNhan'
import type { TomTatKiemTra } from '../../src/lib/kiem-tra-ca-nhan'
import CauDaLam from '../../src/components/hoa2/CauDaLam'
import ExamTakeScreen from '../../src/screens/ExamTakeScreen'
import KetQuaSauNop, { type OCauKq } from '../../src/components/xem-diem/KetQuaSauNop'
import { ThanhTren } from '../../src/components/m3'
import { cacheSession, emptyAnswerRecord, emptyIntegrityLog, saveAttempt, type ExamAttempt } from '../../src/lib/exam-db'
import type { PublicExamBank } from '../../src/data/examContent'
import { LA_LAM13, soHomNayLam13, traLoiLam13 } from '../chup-v2/gia/lam-bai-1210d'

const thamSo = new URLSearchParams(location.search)
const man = thamSo.get('man') ?? 'lam13'
const noop = () => {}
const now = Date.now()
if (thamSo.get('toi') === '1') document.documentElement.classList.add('dark')

// ───────────────────────────── bộ câu giả dùng chung (Hoá 12, soạn cho ảnh chụp) ─────────────────────────────
const TN = [
  { id: 'q1', text: 'Thuỷ phân hoàn toàn 8,8 gam ethyl acetate (CH₃COOC₂H₅) bằng dung dịch NaOH vừa đủ. Khối lượng muối thu được là', choices: ['8,2 gam.', '6,8 gam.', '9,6 gam.', '4,1 gam.'] },
  { id: 'q2', text: 'Dung dịch chất nào sau đây làm quỳ tím chuyển màu xanh?', choices: ['Aniline.', 'Methylamine.', 'Glycine.', 'Ethanol.'] },
  { id: 'q3', text: 'Chất nào sau đây thuộc loại disaccharide?', choices: ['Glucose.', 'Saccharose.', 'Tinh bột.', 'Cellulose.'] },
  { id: 'q4', text: 'Số đồng phân ester ứng với công thức phân tử C₃H₆O₂ là', choices: ['1.', '2.', '3.', '4.'] },
] as PublicExamBank['phanI']
const DS = [
  { id: 'q5', text: 'Xét dãy hydroxide ứng với hoá trị cao nhất của các nguyên tố chu kì 2: LiOH, Be(OH)₂, H₃BO₃, H₂CO₃, HNO₃.',
    ideas: ['Theo chiều tăng điện tích hạt nhân, tính base của các hydroxide trong dãy giảm dần.', 'Theo chiều tăng điện tích hạt nhân, tính acid của các hydroxide trong dãy tăng dần.', 'Trong dãy trên, HNO₃ là acid mạnh nhất.', 'H₃BO₃ có tính acid mạnh hơn H₂CO₃.'] },
  { id: 'q6', text: 'Cho các phát biểu về chất béo:', ideas: ['Chất béo là triester của glycerol với acid béo.', 'Tristearin ở thể lỏng ở nhiệt độ thường.', 'Chất béo không tan trong nước.', 'Thuỷ phân chất béo trong môi trường kiềm gọi là phản ứng xà phòng hoá.'] },
] as PublicExamBank['phanII']
const TLN = [
  { id: 'q7', text: 'Lên men 45 gam glucose với hiệu suất 80%. Thể tích khí CO₂ (đkc, lít) thu được là bao nhiêu? (Làm tròn đến hàng phần mười.)' },
  { id: 'q8', text: 'Đốt cháy hoàn toàn 0,1 mol ethylamine (C₂H₅NH₂) thu được V lít khí N₂ (đkc). Giá trị của V là bao nhiêu? (Làm tròn đến hàng phần mười.)' },
] as PublicExamBank['phanIII']
const BANK: PublicExamBank = { phanI: TN, phanII: DS, phanIII: TLN, soCau: { I: 4, II: 2, III: 2 } }

const tra = (o: unknown) => new Response(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json' } })
const fetchChung = window.fetch.bind(window)
const bocFetch = (f: (p: string, b: Record<string, unknown>) => unknown) => {
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    let b: Record<string, unknown> = {}
    try { b = init?.body ? JSON.parse(String(init.body)) : {} } catch { /* bỏ qua */ }
    const r = f(new URL(url, location.href).pathname, b)
    return r ? tra(r) : fetchChung(input, init)
  }
}

// ───────────────────────────── Màn làm bài (ManLamBaiTap) ─────────────────────────────
if (LA_LAM13) bocFetch((p, b) => traLoiLam13(p, b))
function ManLam13() {
  const [homNay, datHomNay] = useState(soHomNayLam13())
  return h('div', { className: 'fixed inset-0 z-50 overflow-y-auto overscroll-contain' }, h(ManLamBaiTap, { token: 'tk', sbd: '12121212', onVe: noop, onCapNhat: () => datHomNay(soHomNayLam13()), onChua: noop, homNay }))
}

// ───────────────────────────── Luyện đề (LuyenDeChuan / LuyenDeCauTruc) ─────────────────────────────
const BANK_LD: PublicExamBank = { phanI: [...TN, ...TN.map((c) => ({ ...c, id: `${c.id}b` }))], phanII: DS, phanIII: TLN }
if (man === 'luyende' || man === 'ldct') {
  bocFetch((p) => {
    if (p.endsWith('/luyen-de/history')) return { ok: true, items: [] }
    if (p.endsWith('/luyen-de/dieu-kien')) return { ok: true, trangThai: 'mo', lyDo: '', items: [] }
    if (p.endsWith('/luyen-de/start') || p.endsWith('/luyen-de/open')) return { ok: true, id: 'ld1', deadline: now + 50 * 60_000, serverNow: now, status: 'active', answers: { q1: 'A', q5: 'DS--' }, bank: BANK_LD }
    if (p.endsWith('/luyen-de/save')) return { ok: true }
    return null
  })
}

// ───────────────────────────── Tu luyện đang làm (ManTuLuyen) — cùng dữ liệu cảnh hs12-tu-luyen-lam của scripts/chup-v2 ─────────────────────────────
if (man === 'tuluyen-lam') {
  const cau = [
    { qid: 'L1', phan: 'I', text: 'Thuỷ phân hoàn toàn 8,8 gam ethyl acetate bằng dung dịch NaOH vừa đủ. Khối lượng muối thu được là', luaChon: ['8,2 gam.', '6,8 gam.', '9,6 gam.', '4,1 gam.'], tenDang: 'Thuỷ phân ester', sao: 1, loai: 'bai_tap', nhanLuyen: 'Luyện lại lần 2', saiGoc: 'Sai gốc: Ca kiểm tra Ester · 08/10' },
    { qid: 'L2', phan: 'II', text: 'Cho các phát biểu về chất béo:', luaChon: ['Chất béo là triester của glycerol với acid béo.', 'Tristearin ở thể lỏng ở nhiệt độ thường.', 'Chất béo không tan trong nước.', 'Thuỷ phân chất béo trong môi trường kiềm gọi là phản ứng xà phòng hoá.'], tenDang: 'Chất béo', sao: 1, loai: 'bai_tap', nhanLuyen: 'Luyện lần đầu', saiGoc: 'Sai gốc: Bát Linh Đảo · 09/10' },
    { qid: 'L3', phan: 'III', text: 'Lên men 45 gam glucose với hiệu suất 80%. Thể tích khí CO₂ (đkc, lít) thu được là bao nhiêu?', luaChon: null, tenDang: 'Glucose và fructose', sao: 2, loai: 'bai_tap', nhanLuyen: 'Luyện lần đầu', saiGoc: 'Sai gốc: Ca kiểm tra Carbohydrate · 11/10' },
  ]
  try { localStorage.setItem('ddh.tuluyen.dang.12121212', JSON.stringify({ luotId: 'tl_hs12', cheDo: 1, tieuDe: 'Sửa câu sai · 3 câu', taoLuc: now, cau, traLoi: { L1: 'B' }, giay: 95, giayCau: {}, coGoiY: [] })) } catch { /* bỏ qua */ }
}
const CT = {
  de: { qid: 'H12-1', maDe: 'DH-12-C1-B2', version: '1', group: 'g', phan: 'I', text: 'Thuỷ phân hoàn toàn 8,8 gam ethyl acetate (CH₃COOC₂H₅) bằng dung dịch NaOH vừa đủ. Khối lượng muối thu được là',
    choices: ['8,2 gam.', '6,8 gam.', '9,6 gam.', '4,1 gam.'], ideas: [], hinhAnh: [], tenDang: 'Thuỷ phân ester', mucDo: 'hieu', sao: 1 },
  dapAn: 'A',
  loiGiai: { chot: 'Số mol ester bằng 0,1 mol nên muối CH₃COONa thu được là 0,1 mol, nặng 8,2 gam.', buoc: ['n = 8,8 : 88 = 0,1 mol.', 'CH₃COOC₂H₅ + NaOH → CH₃COONa + C₂H₅OH.', 'm = 0,1 × 82 = 8,2 gam.'] },
  emTraLoi: 'B',
}
const CDL = { ok: true, chienDich: [{ id: 'cd1', ten: 'Hành trình giỏi hoá · Khối 12', hanNop: '9999-12-31', tong: 120 }], cau: [
  { qid: 'H12-1', chienDichId: 'cd1', stt: 12, phan: 'I', mucDo: 'hieu', tenDang: 'Thuỷ phân ester', trangThai: 'dang_on', lanCuoiDung: false, henOn: null, lichSu: [{ ngay: '2026-10-10', dung: false, coGoiY: false, nguon: 'dao' }] },
  { qid: 'H12-2', chienDichId: 'cd1', stt: 18, phan: 'III', mucDo: 'VD', tenDang: 'Bài toán đốt cháy chất béo', trangThai: 'dang_on', lanCuoiDung: false, henOn: null, lichSu: [{ ngay: '2026-10-11', dung: false, coGoiY: false, nguon: 'thi' }] },
  { qid: 'H12-3', chienDichId: 'cd1', stt: 21, phan: 'II', mucDo: 'hieu', tenDang: 'Glucose và fructose', trangThai: 'dang_on', lanCuoiDung: false, henOn: null, lichSu: [{ ngay: '2026-10-09', dung: false, coGoiY: true, nguon: 'doan' }] },
  { qid: 'H12-5', chienDichId: 'cd1', stt: 30, phan: 'I', mucDo: 'hieu', tenDang: 'Khái niệm, danh pháp ester', trangThai: 'thanh_thao', lanCuoiDung: true, henOn: null, lichSu: [{ ngay: '2026-10-05', dung: false, coGoiY: false, nguon: 'dao' }, { ngay: '2026-10-07', dung: true, coGoiY: false, nguon: 'dao' }] },
] }
if (man === 'tuluyen-lam' || man === 'cdl') {
  bocFetch((p) => {
    if (p.endsWith('/hs/tu-luyen/nguon')) return { ok: true, cacCa: [], soCauSai: 14, danhMuc: [], dangThi: false, khoCauSai: { tong: 14, tuCa: 6, tuChienDich: 8, tuLuyenDe: 0, tuTuLuyen: 0, loi: '', tongTuMoc: 20, daKhacPhuc: 6, toiHan: 2, choHen: 3, theoNguon: { ca: 6, dao: 5, doan: 4, bia: 2, tu_luyen: 0, luyen_de: 0 }, theoMat: {} }, dangCauSai: { kieu: 'cau_sai', nhan: 'Theo câu sai của em' }, tuDo: { kieu: 'cau_sai', nhan: 'Theo câu sai của em' }, dangNenLuyen: null }
    if (p.endsWith('/hs/tu-luyen/tong-hop')) return { ok: true, luot: [], cau: [], luyenDe: [], khacPhuc: null }
    if (p.endsWith('/luyen-de/dieu-kien')) return { ok: true, trangThai: 'mo', lyDo: '', items: [] }
    if (p.endsWith('/hs/chua-cau-sai/co')) return { ok: true }
    if (p.endsWith('/hoa2-cau-chi-tiet')) return { ok: true, cau: [CT] }
    if (p.endsWith('/hoa2-cau-da-lam')) return CDL
    return null
  })
}

// ───────────────────────────── Sửa câu sai (ManChuaCauSai → ChuaGon, chữa câu gọn 25/10): `?man=chua` (đang làm lại) ─────────────────────────────
if (man === 'chua') {
  bocFetch((p) => {
    if (p.endsWith('/hs/chua-cau-sai/mo-dot')) return { ok: true, dotId: 'd1', trangThai: 'dang_chua', coHocLieu: false, revision: 1, tienDo: { soBuocDaQua: 0, soBuocCanKiem: 0 } }
    if (p.endsWith('/hs/chua-cau-sai/gon-mo')) return { ok: true, dotId: 'd1', lan: 1, ban: 'b1', tuSuaNeuDung: true, de: { qid: 'H12-1', phan: 'I', text: CT.de.text, choices: CT.de.choices, tenDang: 'Thuỷ phân ester' } }
    if (p.endsWith('/hs/chua-cau-sai/gon-nop')) return { ok: true, dotId: 'd1', dung: true, ket: 'tu_sua', chiTiet: { ok: true, cau: [CT] } }
    if (p.endsWith('/hoa2-cau-chi-tiet')) return { ok: true, cau: [CT] }
    if (p.includes('/hs/chua-cau-sai/')) return { ok: true }
    return null
  })
}

// ───────────────────────────── Kiểm tra ôn tập (ManKiemTraCaNhan) — máy chủ giả chép scripts/chup-ktcn-dot20: `?man=ktcn` · `?man=ktcn-ket` ─────────────
// Giờ máy chủ giả: 12:00 Thứ Bảy 17/10/2026 (ngày kiểm tra) hoặc Thứ Ba 13/10 (ngày thường).
const NGAY_KT = Date.parse('2026-10-17T05:00:00Z'), NGAY_THUONG = Date.parse('2026-10-13T05:00:00Z')
const kt = (o: Partial<TomTatKiemTra> = {}): TomTatKiemTra => {
  const x = { id: 'kt-gia', ngay: '2026-10-17', moLuc: Date.parse('2026-10-16T17:00:00Z'), serverNow: NGAY_KT, trangThai: 'can_lam', homNay: true, tong: 18, daTra: 5, soChang: 3, phut: 40, soBai: 3, tongKienThuc: 60, phuDe: 60, nguonDayDu: true, lyDo: 'Kiểm chứng những phần em đang luyện thêm', thieuNguon: 0, diem: null, nopLuc: null, ...o } as TomTatKiemTra
  return { ...x, hanLuc: x.moLuc + 86_400_000, con: x.tong - x.daTra }
}
const THE: Record<string, TomTatKiemTra> = {
  can_lam: kt(),
  cho_nguon: kt({ trangThai: 'cho_nguon', homNay: false, serverNow: NGAY_THUONG, phuDe: 42, thieuNguon: 18, nguonDayDu: false, daTra: 0 }),
  sap_den: kt({ trangThai: 'sap_den', homNay: false, serverNow: NGAY_THUONG, daTra: 0 }),
  da_nop: kt({ trangThai: 'da_nop', daTra: 18, diem: 8.25, nopLuc: Date.parse('2026-10-17T08:42:00Z') }),
  het_han: kt({ trangThai: 'het_han', daTra: 7, diem: 3.75, nopLuc: Date.parse('2026-10-17T17:00:00Z') }),
}
const C = (qid: string, text: string, choices: string[]) => ({ qid, maDe: 'DH-12-C3-B8', version: 'v1', group: qid, phan: 'I', text, choices, ideas: [], hinhAnh: [], dang: null, tenDang: '', mucDo: 'NB', sao: 0, kienThuc: [] })
const CAU = [
  C('q1', 'Chất nào sau đây là amine bậc một?', ['CH3NH2', 'CH3NHCH3', '(CH3)3N', 'CH3NHC2H5']),
  C('q2', 'Dung dịch chất nào sau đây làm quỳ tím hoá xanh?', ['C6H5NH2', 'CH3NH2', 'H2NCH2COOH', 'C2H5OH']),
  C('q3', 'Chất nào sau đây là amine bậc hai?', ['CH3NH2', 'CH3NHCH3', '(CH3)3N', 'C6H5NH2']),
  C('q4', 'Aniline phản ứng với nước bromine tạo kết tủa màu gì?', ['Trắng', 'Vàng', 'Xanh lam', 'Đỏ nâu']),
  C('q5', 'Số đồng phân amine bậc một có công thức C3H9N là', ['1', '2', '3', '4']),
  C('q6', 'Phát biểu nào sau đây đúng về methylamine?', ['Là chất lỏng ở điều kiện thường', 'Có mùi khai, tan tốt trong nước', 'Không làm đổi màu quỳ tím', 'Là amine thơm']),
]
// Máy chủ giả
const ketQua = { chu: 'Em vững phần Ester – Lipid; phần Amine cần luyện thêm bậc amine và tính base.',
  bai: [{ ten: 'Bài 6. Ester – Lipid', tong: 8, daKiem: 8, dungLanNay: 7 }, { ten: 'Bài 7. Carbohydrate', tong: 6, daKiem: 6, dungLanNay: 5 }, { ten: 'Bài 8. Amine', tong: 4, daKiem: 4, dungLanNay: 3 }],
  cau: Array.from({ length: 18 }, (_, i) => ({ de: CAU[i % 6]!, tra: i === 9 ? '' : 'A', dung: ![3, 9, 15].includes(i), dapAn: 'A', loiGiai: null })) }
const kiemMan = man === 'ktcn-ket' ? THE.da_nop! : kt({ daTra: 8 })
const hanChay = NGAY_KT + 462_000
const CHANG = [{ stt: 0, soCau: 6, giay: 780, han: NGAY_KT - 1_200_000, daChot: true, daTra: 6 }, { stt: 1, soCau: 6, giay: 780, han: hanChay, daChot: false, daTra: 2 }, { stt: 2, soCau: 6, giay: 840, han: null, daChot: false, daTra: 0 }]
const json = (o: unknown) => Promise.resolve(new Response(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json' } }))
if (man.startsWith('ktcn')) window.fetch = ((url: RequestInfo | URL) => {
  const u = String(url)
  if (u.includes('/game-v2/hoc-tap-ktcn-trang-thai')) return json({ ok: true, kiemTra: kiemMan, chang: CHANG })
  if (u.includes('/game-v2/hoc-tap-ktcn-start')) return json({ ok: true, kiemTra: kiemMan, revision: 3, hanChang: hanChay, daChot: false, questions: CAU, tra: { q1: 'A', q2: 'B', q3: 'B' } })
  if (u.includes('/game-v2/hoc-tap-ktcn-ket-qua')) return json({ ok: true, kiemTra: kiemMan, ketQua })
  if (u.includes('/game-v2/')) return json({ ok: true, kiemTra: kiemMan, revision: 4, daLuu: true })
  return json({})
}) as typeof fetch

// ───────────────────────────── Ôn câu hôm nay (LamCauOn) trong tấm phủ M3 của cổng ─────────────────────────────
const CAU_ON = [
  { qid: 'on1', phan: 'I' as const, text: TN[0].text, choices: TN[0].choices, tenDang: 'Thuỷ phân ester' },
  { qid: 'on2', phan: 'II' as const, text: DS[0].text, ideas: DS[0].ideas, tenDang: 'Bảng tuần hoàn · chu kì 2' },
  { qid: 'on3', phan: 'III' as const, text: TLN[0].text, tenDang: 'Lên men glucose' },
]
if (man === 'cauon') try { localStorage.setItem('omr_cauon:12121212:on_lai:2026-10-12', JSON.stringify({ on1: 'A', on2: 'DS--' })) } catch { /* bỏ qua */ }
const manCauOn = () =>
  h('div', { className: 'm3 m3-sheet fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 overflow-y-auto overscroll-contain flex flex-col' },
    h(ThanhTren, { tieuDe: 'Ôn câu hôm nay', onQuayLai: noop, nhanQuayLai: 'Về Hôm nay', phai: h('button', { type: 'button', className: 'm3-nut-chu', onClick: noop }, h(X, { size: 18, 'aria-hidden': true }), h('span', null, 'Đóng')) }),
    h('main', { className: 'max-w-6xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-6 flex-1' },
      h(LamCauOn, { token: 'tk', sbd: '12121212', viecId: 'on_lai:2026-10-12', qid: CAU_ON.map((c) => c.qid), tieuDe: 'Ôn câu hôm nay', cauSan: CAU_ON, onXong: noop })))

// ───────────────────────────── Màn thi (ExamTakeScreen): lượt dở đã cất trên máy ─────────────────────────────
const MA_CA = '246810'
async function datLuotThi() {
  await cacheSession({ maCa: MA_CA, lop: '12A1', thoiGianPhut: 50, bank: BANK })
  const a: ExamAttempt = {
    key: `${MA_CA}:12121212`, maCa: MA_CA, sbd: '12121212', maDe: 'ngân hàng', startedAt: new Date(now - 12 * 60_000).toISOString(), durationMinutes: 50,
    hetGioLuc: new Date(now + 38 * 60_000).toISOString(), lanThu: 1, idThietBi: 'may-gia', nguong: { lan: 99, giay: 999 }, loai: 'thi', tenCa: 'Ca kiểm tra Hoá 12 · Ester – Carbohydrate',
    answers: { ...emptyAnswerRecord(), phanI: { q1: 'A', q2: 'B' }, phanII: { q5: ['D', 'S', 'D', null] }, phanIII: { q7: '17,9' } } as ExamAttempt['answers'], integrity: emptyIntegrityLog(), submitted: false, submittedAt: null, pendingSubmit: false,
  }
  await saveAttempt(a)
}
const manThi = () =>
  h('div', { className: 'fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-white dark:bg-slate-950 man-thi-phu', style: { '--thi-le-phai': '52px' } },
    h(ExamTakeScreen, { tuCong: { maCa: MA_CA, sbd: '12121212', hoTen: 'Nguyễn Minh Anh', namSinh: '2008', lop: '12A1', scriptUrl: 'https://may-chu-gia.invalid' } }))

// ───────────────────────────── Kết quả sau nộp (KetQuaSauNop) — số khớp nhau ─────────────────────────────
const KQ_SAI: Record<number, OCauKq['kq']> = { 5: 'sai', 14: 'sai', 26: 'sai', 8: 'trong', 20: 'mot_phan', 22: 'mot_phan' }
const KQ_CAU: OCauKq[] = Array.from({ length: 28 }, (_, i) => i + 1).map((so) => ({ phan: so <= 18 ? 'I' : so <= 22 ? 'II' : 'III', so, kq: KQ_SAI[so] ?? 'dung' }))
const manKq = (daCongBo: boolean) => h(KetQuaSauNop, daCongBo
  ? { kieu: 'da_cong_bo', tenCa: 'Kiểm tra 50 phút · 12A1', gioNop: '20:41 · Thứ Bảy 24/10/2026', lanThu: 1, diem: 7.75, dung: 22, tong: 28, lam: '41 phút', de: '50 phút', ss: 0.5, truoc: 7.25,
      phan: [
        { ma: 'I', ten: 'Phần I · Trắc nghiệm', dung: 15, tong: 18, motPhan: 0, diem: 3.75, toiDa: 4.5 },
        { ma: 'II', ten: 'Phần II · Đúng–sai', dung: 2, tong: 4, motPhan: 2, diem: 2.75, toiDa: 4 },
        { ma: 'III', ten: 'Phần III · Trả lời ngắn', dung: 5, tong: 6, motPhan: 0, diem: 1.25, toiDa: 1.5 },
      ], cau: KQ_CAU, expCa: 40, onXemBaoCao: noop, onVe: noop } as never
  : { kieu: 'ca_lop', tenCa: 'Kiểm tra 50 phút · 12A1', gioNop: '20:41 · Thứ Bảy 24/10/2026', soDaLam: 27, tongCau: 28, lam2: '41 phút 12 giây', daNop: 18, daVao: 32, onVe: noop } as never)

// Khung màn con của cổng học sinh 2.0 (StudentPortalScreen `khungManCon(true)`).
const KHUNG_CON = { className: 'fixed inset-0 z-50 overflow-y-auto tt-mo-lop', style: { overscrollBehavior: 'contain', background: 'var(--v2-nen, var(--nen))' } }
const con =
  man === 'cauon' ? manCauOn()
  : man === 'luyende' ? h('div', { className: 'm3 p-4' }, h(LuyenDeChuan, { sbd: '12121212', token: 'tk' }))
  : man === 'ldct' ? h('div', { className: 'p-4' }, h(LuyenDeCauTruc, { token: 'tk', sbd: '12121212', dieuKien: { trangThai: 'mo', lyDo: '', items: [] }, dangTaiDieuKien: false, onDoi: noop }))
  : man === 'tuluyen-lam' ? h('div', KHUNG_CON, h(ManTuLuyen, { token: 'tk', sbd: '12121212', onVe: noop }))
  : man === 'cdl' ? h('div', KHUNG_CON, h(CauDaLam, { token: 'tk', hoTen: 'Nguyễn Minh Anh', sbd: '12121212', lop: '12A1', onVe: noop, caGanNhat: { chu: 'Chưa có ca đã công bố', coDiem: false }, onLichSuCa: noop }))
  : man === 'thi' ? manThi()
  : man.startsWith('ktcn') ? h('div', KHUNG_CON, h(ManKiemTraCaNhan, { token: 'gia', sbd: 'S-gia', id: 'kt-gia', onVe: noop, onCapNhat: noop }))
  : man === 'chua' ? h('div', KHUNG_CON, h(ManChuaCauSai, { token: 'tk', qid: 'H12-1', onVe: noop }))
  : man === 'kq' || man === 'kq-cho' ? manKq(man === 'kq')
  : h(ManLam13)

const veTrang = () => createRoot(document.getElementById('root')!).render(h(BatLinhShell, { vai: 'hs' }, con))
if (man === 'thi') void datLuotThi().then(veTrang)
else veTrang()
