// TRANG CHỤP ẢNH OMNI 3 (chỉ để lấy bằng chứng giao diện, không vào bản phát hành): component THẬT + máy chủ GIẢ ngay trong trang
// (thay `fetch`) — không một yêu cầu nào tới máy chủ thật, không dữ liệu học sinh thật. `?man=sanh|sanh-cho|ph`.
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
import SanhBanDo from '../../src/components/hoa2/SanhBanDo'
import { docSanh, type KetQuaSanh } from '../../src/components/hoa2/api'
import ParentPortalScreen from '../../src/screens/ParentPortalScreen'
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
  return tra({ ok: true })
}

function manSanh(du: Record<string, unknown>) {
  return h(SanhBanDo, {
    ketQua: docSanh(du) as KetQuaSanh, loi: '', dangTai: false, thu: { index: 2, cap: 7, ten: 'Lửa Nhỏ' }, exp: { homNay: 22, conThieu: 160 },
    chuoiNgay: 5, caDangMo: false, now, token: 'tk', shopBat: true, onVaoThi: noop, onPhaPhucKich: noop, onKhamPhaDao: noop, onCauDaLam: noop,
    onTuiDo: noop, onCuaHang: noop, onMoThanThu: noop, onChonThu: noop, onDangXuat: noop, onTaiLai: noop, onTuLuyen: noop,
  } as never)
}

const con = man === 'ph' ? h(ParentPortalScreen) : man === 'sanh-cho' ? manSanh(SANH_CHO) : manSanh(SANH)
createRoot(document.getElementById('root')!).render(con)
