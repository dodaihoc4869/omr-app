// TRANG CHỤP ẢNH OMNI 3 (chỉ để lấy bằng chứng giao diện, không vào bản phát hành): component THẬT + máy chủ GIẢ ngay trong trang
// (thay `fetch`) — không một yêu cầu nào tới máy chủ thật, không dữ liệu học sinh thật. `?man=sanh|sanh-cho|ph|dao-chip|dao-cham|dao-chac-sai|dao-tln|dao-tram|de-thu|gv-bai|gv-bang-cu|gv-bang-omni|gv-cai-dat`.
// Dữ liệu OMNI theo đúng hợp đồng docs/hop-dong-omni-3.md (SanhOmni, PhOmni). Các màn thêm sau khi gộp làn: dao, gv-bai, gv-bang.
import { createElement as h } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '@fontsource/noto-serif/vietnamese-400.css'
import '@fontsource/noto-serif/latin-400.css'
import '@fontsource/noto-serif/vietnamese-700.css'
import '@fontsource/noto-serif/latin-700.css'
import '../../src/styles/tokens.css'
import '../../src/index.css'
import '../../src/styles/the-loc.css'
import '../../src/components/m3'
import '../../src/components/bang-nhiem-vu/sheet-m3.css'
// Bản màu app thầy (App.tsx nạp ba tệp này, phạm vi `.vo-thay`) — màn thầy bọc đúng khung `.m3.m3-thay.vo-thay` như app thật.
import '../../src/styles/vo-thay.css'
import '../../src/styles/gv-mau.css'
import '../../src/styles/teacher-modern.css'
import SanhBanDo from '../../src/components/hoa2/SanhBanDo'
import { docSanh, type KetQuaSanh } from '../../src/components/hoa2/api'
import ParentPortalScreen from '../../src/screens/ParentPortalScreen'
import Dao2 from '../../src/game/than-thu-v2/dao2/Dao2'
import { datViecOmniDao } from '../../src/lib/omni-hs'
import DayHocLenBang from '../../src/components/day-hoc/DayHocLenBang'
import BangChienDich from '../../src/components/chien-dich/BangChienDich'
import CongTacOmni from '../../src/components/chien-dich/CongTacOmni'
import ThanhBenTrai from '../../src/components/ThanhBenTrai'
import { useAppStore } from '../../src/store/appStore'
import { BANG, NOW_BANG, OMNI_BANG } from './gia/bang-gv'
import '../../src/game/than-thu-v2/game.css'
// App thật nạp dao.css qua các màn game khác (DaoCuaEm, ThamHiem…) trước khi vào Đảo 2.0 — thiếu thì nút Đảo mất nền (ảnh chụp 05/10).
import '../../src/game/than-thu-v2/dao/dao.css'
import { CHU_CHAC_MA_SAI, chuDungNhungCham, chuTram } from '../../src/lib/omni-chu'
import type { DaoKetQua, DaoProfile } from '../../src/game/than-thu-v2/dao/kieu'
import { PH_OK } from '../../tests/_ph-moi/du-lieu-mau'

const thamSo = new URLSearchParams(location.search)
const man = thamSo.get('man') ?? 'sanh'
const now = Date.now()
const noop = () => {}
try {
  localStorage.setItem('omr_student_portal_auth', JSON.stringify({ token: 'tk-gia', sbd: 'GIA' }))
  localStorage.setItem('omr_ph_sbd', '12121212')
} catch { /* bỏ qua */ }

// ---------------------------------------------------------------- dữ liệu OMNI giả (đúng hợp đồng)
const SANH_OMNI = {
  bat: true,
  baiDangLuyen: [
    { id: 'cd6', ten: 'Bài 6 · Tinh bột và cellulose', hanNop: '2026-10-12' },
    { id: 'cd5', ten: 'Bài 5 · Saccharose và maltose', hanNop: '2026-10-08' },
  ],
  dangVung: { a: 5, b: 8 },
  conDangDe8: 2,
  sEm: 0.06,
  sMucTieu: 0.07,
  chungChi: [{ ten: 'Bài 4', doTin: 0.92, ngay: '2026-10-03' }],
  ve: { con: 2, tong: 2 },
  choBaiMoi: false,
  onBaiCu: 6,
  metGio: null,
  nhatKy: null,
  deThu: { duoc: true, soCau: 14, phut: 25 },
}
const SANH = {
  ok: true, cheDo2: true, ngay: '2026-10-05',
  chienDich: { id: 'cd5', ten: 'Bài 5 · Saccharose và maltose', hanNop: '2026-10-08', D: 3, tong: 96, coXat: 81, thanhThao: 40, canDayLai: 1, thanhThaoTangTu: null },
  theLuc: { con: 26, tong: 40 }, huyetChien: false, doan: { con: 4 }, dao: { con: 26 }, khoaDao: false, loiKhoaDao: '',
  ruong: { daLam: 14, tong: 40, moDuoc: false, daMo: false },
  omni: SANH_OMNI,
}
/** Ngày 8 không tick bài mới: chế độ chờ, ôn bài cũ, nhật ký cuối ngày, mệt giờ. */
const SANH_CHO = {
  ...SANH,
  theLuc: { con: 0, tong: 24 }, dao: { con: 0 },
  omni: { ...SANH_OMNI, choBaiMoi: true, onBaiCu: 10, conDangDe8: 0,
    chungChi: [{ ten: 'Bài 5', doTin: 0.91, ngay: '2026-10-05' }, { ten: 'Bài 4', doTin: 0.92, ngay: '2026-10-03' }],
    metGio: { khung: '22_24', tiLe: 0.21, tiLeTot: 0.08, coTheDoi: true },
    nhatKy: ['Dạng "Thuỷ phân saccharose" chuyển sang vững (đúng 2 ngày khác nhau, làm trôi chảy).', 'Sơ ý giảm từ 9% xuống 6%.', 'Bước "bảo toàn khối lượng" đã gỡ xong ở Trạm hồi phục.'] },
}
const HOC2_PH = {
  ok: true, cheDo2: true, ngay: '2026-10-05',
  chienDich: { ten: 'Bài 6 · Tinh bột và cellulose', hanNop: '2026-10-12', conNgay: 7, tong: 112, daGap: 60, thanhThao: 24, canDayLai: 2 },
  homNay: { tong: 40, daLam: 34 },
  omni: {
    khoangCach8: 1.1, hieuChuan: { soCaChot: 3, du: true }, dangCanVung: ['Hiệu suất ester hoá', 'Hỗn hợp ester'], sEm: 0.06,
    chungChi: [{ ten: 'Bài 5', doTin: 0.91, ngay: '2026-10-05', diem: 8.5 }], gioHoc: '20:30', canThayChua: 1,
  },
}

// ---------------------------------------------------------------- Đảo 2.0 (component THẬT `Dao2`, máy chủ giả qua prop `call`)
// Câu công khai KHÔNG có đáp án (đáp án chỉ về trong phản hồi `answer`, đúng hợp đồng). Số liệu tính lại: CH₃COOH 60, CH₃COOC₂H₅ 88.
const cauDao = (i: number) => [
  { text: 'Đun nóng 6 gam acetic acid với ethanol dư (xúc tác H₂SO₄ đặc), thu được 4,4 gam ethyl acetate. Hiệu suất của phản ứng ester hoá là', choices: ['25%', '50%', '62,5%', '75%'] },
  { text: 'Đun nóng 9 gam acetic acid với ethanol dư (xúc tác H₂SO₄ đặc), thu được 9,9 gam ethyl acetate. Hiệu suất của phản ứng ester hoá là', choices: ['25%', '50%', '62,5%', '75%'] },
  { text: 'Cho 12 gam acetic acid phản ứng với 9,2 gam ethanol (xúc tác H₂SO₄ đặc), thu được 11 gam ester. Hiệu suất của phản ứng là', choices: ['50%', '62,5%', '75%', '80%'] },
  { text: 'Đun nóng 3 gam acetic acid với ethanol dư, hiệu suất phản ứng 60%. Khối lượng ethyl acetate thu được là', choices: ['2,64 gam', '4,40 gam', '1,76 gam', '3,30 gam'] },
  { text: 'Thể tích dung dịch NaOH 1M cần để thuỷ phân hoàn toàn 8,8 gam ethyl acetate là', choices: ['50 mL', '100 mL', '150 mL', '200 mL'] },
].map((c, k) => ({ qid: `HS${k + 1}`, maDe: 'DH-B6-TN', version: '1', group: `g${k + 1}`, phan: 'I', text: c.text, choices: c.choices, ideas: [], hinhAnh: [], dang: 'HSE', tenDang: 'Hiệu suất phản ứng ester hoá', mucDo: 'van_dung', sao: 2, kienThuc: [], vai: 'moi' }))[i]!
// Lời giải đúng CẤU TRÚC KHO (chot + vì sao từng phương án); chỉ số viết Unicode như kho — app phải tự vẽ <sub> (luật 28/09). Số liệu đã tính lại:
// 6 : 60 = 0,1 mol · 0,1 · 88 = 8,8 g · 4,4 : 8,8 = 50% · 4,4 : 17,6 = 25% · 5,5 : 8,8 = 62,5% · 6,6 : 8,8 = 75%.
const GIAI = {
  chot: 'Hiệu suất H = khối lượng sản phẩm thực tế : khối lượng sản phẩm lí thuyết × 100%. Tính lí thuyết theo chất hết (ethanol dư ⇒ theo CH₃COOH).',
  tungPa: {
    A: { dung: false, viSao: '25% = 4,4 : 17,6 — nhầm khối lượng CH₃COOC₂H₅ lí thuyết thành gấp đôi.' },
    B: { dung: true, viSao: 'n(CH₃COOH) = 6 : 60 = 0,1 mol ⇒ m(CH₃COOC₂H₅) lí thuyết = 0,1 · 88 = 8,8 gam ⇒ H = 4,4 : 8,8 × 100% = 50%.' },
    C: { dung: false, viSao: '62,5% ứng với 5,5 gam ester (5,5 : 8,8), không đúng số liệu đề.' },
    D: { dung: false, viSao: '75% ứng với 6,6 gam ester (6,6 : 8,8), không đúng số liệu đề.' },
  },
}
// Câu Phần III (trả lời ngắn): 9 : 60 = 0,15 mol · 0,15 · 88 = 13,2 g · 13,2 · 75% = 9,9 g.
const CAU_TLN = { qid: 'TLN1', maDe: 'DH-B6-TLN', version: '1', group: 'gt1', phan: 'III', text: 'Đun nóng 9 gam acetic acid với ethanol dư (xúc tác H₂SO₄ đặc), hiệu suất phản ứng ester hoá đạt 75%. Tính khối lượng ethyl acetate thu được (gam).', choices: [], ideas: [], hinhAnh: [], dang: 'HSE', tenDang: 'Hiệu suất phản ứng ester hoá', mucDo: 'van_dung', sao: 2, kienThuc: [], vai: 'moi' }
const GIAI_TLN = { chot: 'Tính sản phẩm theo hiệu suất thì NHÂN H; tính ngược nguyên liệu thì CHIA H.', buoc: ['n(CH₃COOH) = 9 : 60 = 0,15 mol', 'm(CH₃COOC₂H₅) lí thuyết = 0,15 · 88 = 13,2 gam', 'm(CH₃COOC₂H₅) thực tế = 13,2 · 75% = 9,9 gam'], ketQua: '9,9' }
const hoSoDao: DaoProfile = { nickname: 'Lửa Nhỏ', pet: 'lua_phuong', choice: false, cap: 7, exp: 120, wallet: 0, mastery: [] } as DaoProfile
let soLanTraLoi = 0
function traLoiDao(d: Record<string, unknown>): Record<string, unknown> {
  soLanTraLoi++
  const omni = (o: Record<string, unknown>) => ({ nhanTocDo: 'thuong', msLam: 62_000, msKyVong: 85_000, luot: false, chacMaSai: false, loiNhan: null, ...o })
  if (man === 'dao-tln') return { correct: true, answer: '9,9', traLoi: d.answer, solution: GIAI_TLN, reward: 4, stage: 1, omni: omni({}) }
  if (man === 'dao-cham') return { correct: true, answer: 'B', traLoi: d.answer, solution: GIAI, reward: 4, stage: 1, omni: omni({ nhanTocDo: 'cham', msLam: 204_000, loiNhan: chuDungNhungCham(204_000, 85_000) }) }
  if (man === 'dao-chac-sai') return { correct: false, answer: 'B', traLoi: d.answer, solution: GIAI, reward: 0, stage: 0, omni: omni({ chacMaSai: true, loiNhan: CHU_CHAC_MA_SAI }) }
  const tram = soLanTraLoi >= 3
    ? { tram: { vkn: 'nen:doi_mol_khoi_luong', ten: 'Đổi khối lượng ra số mol', tenLoi: 'đổi khối lượng ra số mol', nhan: 'doi_mol_khoi_luong', coCauNen: true, chu: chuTram('đổi khối lượng ra số mol', true) } }
    : {}
  return { correct: false, answer: 'B', traLoi: d.answer, solution: GIAI, reward: 0, stage: 0, omni: omni(tram) }
}
const callDao = async (action: string, data: Record<string, unknown> = {}): Promise<DaoKetQua> => {
  await new Promise((r) => setTimeout(r, 60))
  const kq: Record<string, unknown> =
    action === 'hoa2-sanh' ? SANH
    : action === 'resume' ? { questions: [] }
    : action === 'sync' ? { remaining: 0 }
    : action === 'start' ? { id: 'P1', questions: man === 'dao-tln' ? [CAU_TLN, cauDao(1)] : [0, 1, 2, 3].map(cauDao), theLuc: { con: 26, tong: 40 }, dao: { con: 26 }, doan: { con: 4 } }
    : action === 'answer' ? traLoiDao(data)
    : action === 'hoa2-omni-tram-xong' ? { cau: { ...cauDao(4), mucDo: 'hieu' }, viTri: 3 }
    : action === 'hoa2-cau-da-lam' ? { cau: [] }
    : action === 'hoa2-omni-de-thu' ? { id: 'DT1', cau: Array.from({ length: 14 }, (_, k) => ({ ...cauDao(k % 5), qid: `DT${k + 1}` })), phut: 25, hetLuc: new Date(Date.now() + 25 * 60_000).toISOString() }
    : {}
  return { ok: true, ...kq } as DaoKetQua
}
const CAU_NEN = {
  ok: true, nhan: 'doi_mol_khoi_luong', ten: 'Đổi khối lượng ra số mol',
  cau: [
    { id: 'sinh.doi_mol_khoi_luong.1', muc: 1, kieu: 'so', de: 'Tính số mol của 4,4 gam CO₂ (C = 12, O = 16). Viết kết quả dạng số thập phân.' },
    { id: 'sinh.doi_mol_khoi_luong.2', muc: 1, kieu: 'so', de: 'Tính số mol của 11,7 gam NaCl (Na = 23, Cl = 35,5).' },
    { id: 'sinh.doi_mol_khoi_luong.3', muc: 2, kieu: 'so', de: 'Tính số mol của 17,6 gam ethyl acetate CH₃COOC₂H₅ (C = 12, H = 1, O = 16).' },
  ],
}

// ---------------------------------------------------------------- máy chủ giả (chặn MỌI fetch ra ngoài trang)
const fetchGoc = window.fetch.bind(window)
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const tra = (o: unknown) => new Response(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json' } })
  const u = new URL(url, location.href)
  if (u.origin === location.origin && !u.pathname.endsWith('cau-hinh.json') && !u.pathname.startsWith('/ph/') && !u.pathname.startsWith('/game-v2/') && !u.pathname.startsWith('/hs/')) return fetchGoc(input, init)
  await new Promise((r) => setTimeout(r, 80))
  let b: Record<string, unknown> = {}
  try { b = init?.body ? JSON.parse(String(init.body)) : {} } catch { /* bỏ qua */ }
  if (u.pathname.endsWith('cau-hinh.json')) return tra({ mayChuMoi: 'https://may-chu-gia.example.com' })
  if (b.action === 'tenTheoSbd') return tra({ ok: true, sbd: '12121212', hoTen: 'Nguyễn Minh Khôi', lop: '12A1', tenCa: '' })
  if (u.pathname.endsWith('/ph/tat-ca-ve-con')) return tra(PH_OK)
  if (u.pathname.endsWith('/ph/hoc-2')) return tra(HOC2_PH)
  if (u.pathname.endsWith('/ph/ke-hoach')) return tra({ ok: true, canhBao: [] })
  if (u.pathname.endsWith('/game-v2/hoa2-sanh')) return tra(man === 'sanh-cho' ? SANH_CHO : SANH)
  if (u.pathname.endsWith('/hs/luyen-nen')) return tra(CAU_NEN)
  if (u.pathname.endsWith('/hs/luyen-nen/nop')) return tra({ ok: true, dung: true, dapAn: '0,1', giai: ['M(CO₂) = 12 + 2 · 16 = 44 g/mol', 'n(CO₂) = m : M = 4,4 : 44 = 0,1 mol'], meo: 'n = m : M; nhớ cộng đủ nguyên tử khối theo chỉ số trong công thức (CO₂ có 2 nguyên tử O).' })
  return tra({ ok: true })
}

function manSanh(du: Record<string, unknown>) {
  return h(SanhBanDo, {
    ketQua: docSanh(du) as KetQuaSanh, loi: '', dangTai: false, thu: { index: 2, cap: 7, ten: 'Lửa Nhỏ' }, exp: { homNay: 22, conThieu: 160 },
    chuoiNgay: 5, caDangMo: false, now, token: 'tk', shopBat: true, onVaoThi: noop, onPhaPhucKich: noop, onKhamPhaDao: noop, onCauDaLam: noop,
    onTuiDo: noop, onCuaHang: noop, onMoThanThu: noop, onChonThu: noop, onDangXuat: noop, onTaiLai: noop, onTuLuyen: noop,
  } as never)
}

const con =
  man === 'ph' ? h(ParentPortalScreen)
  : man === 'sanh-cho' ? manSanh(SANH_CHO)
  : man.startsWith('dao-') ? h(Dao2, { sbd: 'GIA', profile: hoSoDao, call: callDao, doanMo: false, sanhDau: SANH, onMoDoan: noop, onMoSoTay: noop, onDong: noop })
  : man === 'de-thu' ? (datViecOmniDao('de-thu'), h(Dao2, { sbd: 'GIA', profile: hoSoDao, call: callDao, doanMo: false, sanhDau: SANH, onMoDoan: noop, onMoSoTay: noop, onDong: noop })) // đúng đường app thật: nút Đề thử ở Sảnh ⇒ Đảo mở màn đề thử trong khung `.dao2`
  : man === 'gv-bai' ? h(DayHocLenBang)
  : man === 'gv-bang-cu' || man === 'gv-bang-omni'
    ? h(BangChienDich, { du: BANG, nowMs: NOW_BANG, dangChieu: false, onChieu: async () => true, onDaChua: noop, omni: man === 'gv-bang-omni' ? OMNI_BANG : null, onOmniDoi: noop } as never)
  : man === 'gv-cai-dat' ? h(CongTacOmni)
  : manSanh(SANH)
// Màn thầy: dựng ĐÚNG khung App.tsx (thanh bên trái thật + khung nội dung) để bố cục, màu như app thầy thật.
const MAN_THAY: Record<string, string> = { 'gv-bai': 'goilenbang', 'gv-bang-cu': 'goilenbang', 'gv-bang-omni': 'goilenbang', 'gv-cai-dat': 'caidat' }
const manThay = MAN_THAY[man]
if (manThay) useAppStore.setState({ screen: manThay as never })
createRoot(document.getElementById('root')!).render(
  manThay
    ? h('div', { className: 'min-h-screen m3 m3-thay vo-thay' }, h(ThanhBenTrai), h('div', { className: 'khung-noi-dung' }, h('div', { className: 'giua-noi-dung', 'data-teacher-screen': manThay }, con)))
    : con,
)
