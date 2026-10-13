// TRANG CHỤP ẢNH OMNI 3 (chỉ để lấy bằng chứng giao diện, không vào bản phát hành): component THẬT + máy chủ GIẢ ngay trong trang
// (06/10) thêm cảnh CẨN THẬN: `?man=dao-can-than-soat|dao-can-than-the` (Sảnh có omni.canThan) — chip "Soát lại đơn vị và số liệu" ở câu Phần III + thẻ "Em biết câu này. Sai vì bước nào?".
// (thay `fetch`) — không một yêu cầu nào tới máy chủ thật, không dữ liệu học sinh thật. `?man=sanh|sanh-cho|ph|dao-chip|dao-cham|dao-chac-sai|dao-tln|dao-tram|de-thu|gv-bai|gv-bang-cu|gv-bang-omni|gv-cai-dat|gv-tong-quan`.
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
import HocTapHomNay from '../../src/components/hoc-tap/HocTapHomNay'
import { docSanh, type KetQuaSanh } from '../../src/components/hoa2/api'
import ParentPortalScreen from '../../src/screens/ParentPortalScreen'
import DayHocLenBang from '../../src/components/day-hoc/DayHocLenBang'
import BangChienDich from '../../src/components/chien-dich/BangChienDich'
import CongTacOmni from '../../src/components/chien-dich/CongTacOmni'
import ThanhBenTrai from '../../src/components/ThanhBenTrai'
import GvHomNayScreen from '../../src/screens/GvHomNayScreen'
import GoiLenBangScreen from '../../src/screens/GoiLenBangScreen'
import ChienDichScreen from '../../src/screens/ChienDichScreen'
import { useCoHoa2 } from '../../src/components/chien-dich/co-hoa2'
import { useAppStore } from '../../src/store/appStore'
import { BANG, NOW_BANG, OMNI_BANG } from './gia/bang-gv'
// App thật nạp dao.css qua các màn game khác (DaoCuaEm, ThamHiem…) trước khi vào Đảo 2.0 — thiếu thì nút Đảo mất nền (ảnh chụp 05/10).
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
/** CẨN THẬN (06/10): em có Sơ ý 11% (> 7%) ⇒ `omni.canThan` — CHỈ cảnh `dao-can-than-*` dùng bản này; các cảnh khác giữ SANH (không canThan) để ảnh cũ không đổi. */
const BUOC_SAI_GIA = [
  { ma: 'nen:doi_mol_khoi_luong', ten: 'Đổi khối lượng ra số mol' },
  { ma: 'nen:khoi_luong_ly_thuyet', ten: 'Tính khối lượng sản phẩm lí thuyết' },
  { ma: 'nen:hieu_suat', ten: 'Tính hiệu suất phản ứng' },
]
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

const CAU_NEN = {
  ok: true, nhan: 'doi_mol_khoi_luong', ten: 'Đổi khối lượng ra số mol',
  cau: [
    { id: 'sinh.doi_mol_khoi_luong.1', muc: 1, kieu: 'so', de: 'Tính số mol của 4,4 gam CO₂ (C = 12, O = 16). Viết kết quả dạng số thập phân.' },
    { id: 'sinh.doi_mol_khoi_luong.2', muc: 1, kieu: 'so', de: 'Tính số mol của 11,7 gam NaCl (Na = 23, Cl = 35,5).' },
    { id: 'sinh.doi_mol_khoi_luong.3', muc: 2, kieu: 'so', de: 'Tính số mol của 17,6 gam ethyl acetate CH₃COOC₂H₅ (C = 12, H = 1, O = 16).' },
  ],
}

const ngayTruoc = (n: number, gio: number) => new Date(now - n * 86_400_000).toISOString().slice(0, 10) + `T${String(gio).padStart(2, '0')}:00:00Z`
const caDong = (maCa: string, tenCa: string, lop: string, n: number, daNop: number) =>
  ({ maCa, tenCa, lop, thoiGianPhut: 45, moLuc: ngayTruoc(n, 12), batDau: ngayTruoc(n, 12), hetHanVao: ngayTruoc(n, 13), trangThai: 'dong', phamVi: 'tu_do', congBo: 'ngay', loai: 'thi', hanNop: '', lenBang: true, daVao: daNop, daNop, canhBao: 0 })
const CA_TONG_QUAN = [caDong('DH-12-C1-B2-TN', 'Kiểm tra Bài 2 · Lipid', '12A1', 2, 41), caDong('DH-11-C2-B3-TN', 'Kiểm tra Bài 3 · Ammonia', '11B', 4, 27), caDong('DH-12-C1-B1-TN', 'Kiểm tra Bài 1 · Ester', '12A1', 6, 43)]

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
  // Tổng quan app thầy (cảnh gv-tong-quan): danh sách ca giả — 3 ca đã đóng mấy ngày trước (biểu đồ bài nộp), không ca nào đang mở.
  if (man === 'gv-tong-quan' && (u.pathname.endsWith('/ca/danh-sach') || b.action === 'danhSachCa')) return tra({ ok: true, items: CA_TONG_QUAN, dauDongBo: { ma: 'ca_day_du' } })
  if (u.pathname.endsWith('/hs/luyen-nen/nop')) return tra({ ok: true, dung: true, dapAn: '0,1', giai: ['M(CO₂) = 12 + 2 · 16 = 44 g/mol', 'n(CO₂) = m : M = 4,4 : 44 = 0,1 mol'], meo: 'n = m : M; nhớ cộng đủ nguyên tử khối theo chỉ số trong công thức (CO₂ có 2 nguyên tử O).' })
  return tra({ ok: true })
}

function manSanh(du: Record<string, unknown>) {
  return h(HocTapHomNay, {
    ten: 'Minh', lop: '12A1', ketQua: docSanh(du) as KetQuaSanh, loi: '', dangTai: false, coCa: false,
    onHoc: noop, onXemLai: noop, onChua: noop, onThi: noop, onTuLuyen: noop, onLichSu: noop,
    onBaiTap: noop, onGiaDinh: noop, onDangXuat: noop, onTaiLai: noop,
  })
}
if (man.startsWith('dao-') || ['doan-tram', 'de-thu'].includes(man)) throw Error('Cảnh Game đã ngừng: ' + man)

const con =
  man === 'ph' ? h(ParentPortalScreen)
  : man === 'sanh-cho' ? manSanh(SANH_CHO)
  : man === 'gv-bai' || man === 'gv-bai-nhieu-lop' || man === 'gv-bai-ngang-may-tinh' || man === 'gv-giao-cho' || man === 'gv-bai-da-day-truoc' ? h(DayHocLenBang)
  // ĐƯỜNG ĐI thật tới "Bài hôm nay" (thầy 06/10 "Tôi không thấy chỗ này"): Game Hóa 2.0 bật ⇒ thanh bên "Chữa trên lớp" → thẻ "Dạy học"; và "Chiến dịch luyện" → nút "Giao theo bài".
  : man === 'gv-len-bang' ? (useCoHoa2.getState().dat({ bat: true, lop: [], sbd: [] }), h(GoiLenBangScreen))
  : man === 'gv-chien-dich' ? (useCoHoa2.getState().dat({ bat: true, lop: [], sbd: [] }), h(ChienDichScreen))
  : man === 'gv-bang-cu' || man === 'gv-bang-omni'
    ? h(BangChienDich, { du: BANG, nowMs: NOW_BANG, dangChieu: false, onChieu: async () => true, onDaChua: noop, omni: man === 'gv-bang-omni' ? OMNI_BANG : null, onOmniDoi: noop } as never)
  : man === 'gv-cai-dat' ? h(CongTacOmni)
  : man === 'gv-tong-quan' ? (useCoHoa2.getState().dat({ bat: true, lop: [], sbd: [] }), h(GvHomNayScreen)) // màn đầu app thầy khi Game Hóa 2.0 bật
  : manSanh(SANH)
// Màn thầy: dựng ĐÚNG khung App.tsx (thanh bên trái thật + khung nội dung) để bố cục, màu như app thầy thật.
const MAN_THAY: Record<string, string> = { 'gv-bai': 'goilenbang', 'gv-bai-nhieu-lop': 'goilenbang', 'gv-bai-ngang-may-tinh': 'goilenbang', 'gv-giao-cho': 'goilenbang', 'gv-bai-da-day-truoc': 'goilenbang', 'gv-bang-cu': 'goilenbang', 'gv-bang-omni': 'goilenbang', 'gv-cai-dat': 'caidat', 'gv-tong-quan': 'tongquan', 'gv-len-bang': 'goilenbang', 'gv-chien-dich': 'chiendich' }
const manThay = MAN_THAY[man]
if (manThay) useAppStore.setState({ screen: manThay as never })
createRoot(document.getElementById('root')!).render(
  manThay
    ? h('div', { className: 'min-h-screen m3 m3-thay vo-thay' }, h(ThanhBenTrai), h('div', { className: 'khung-noi-dung' }, h('div', { className: 'giua-noi-dung', 'data-teacher-screen': manThay }, con)))
    : con,
)
