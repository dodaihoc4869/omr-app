import GvHomNayScreen from '../../src/screens/GvHomNayScreen'
import NganHangDeScreen from '../../src/screens/NganHangDeScreen'
import CaiDatScreen from '../../src/screens/CaiDatScreen'
import HocSinhScreen from '../../src/screens/HocSinhScreen'
import ExamSetupScreen from '../../src/screens/ExamSetupScreen'
import BanGoNutThatScreen from '../../src/screens/BanGoNutThatScreen'
import DuyetLoiGiaiScreen from '../../src/screens/DuyetLoiGiaiScreen'
import '../../src/styles/giao-dien-day-du.css'
// TRANG CHỤP ẢNH BẢN DUYỆT V2 (chỉ để lấy bằng chứng giao diện, không vào bản phát hành): component THẬT + máy chủ GIẢ ngay trong trang
// (thay `fetch`) — không một yêu cầu nào tới máy chủ thật, không dữ liệu học sinh thật (tên em trong ảnh là tên giả).
// `?man=` sanh | sanh-xong | sanh-chon-thu | sanh-dang-tai | than-thu | cua-hang | dao | doan | gv-nhip | gv-bo-sung | gv-can-chua | gv-ca | gv-ma-tran
// `gv-nhip&the=day-hoc|dau-gio|can-chua|chien-dich` = màn Hành trình mở sẵn đúng thẻ (như Hôm nay / Cài đặt mở) — trung tu 09/10 tối.
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
import '../../src/styles/tokens.css'
import '../../src/styles/thang.css' // thang chung 3 app (main.tsx nạp ngay sau tokens.css) — thiếu thì --nut-*-cao, --t-*, --r-* rỗng trong ảnh chụp
import '../../src/index.css'
import '../../src/styles/the-loc.css'
import '../../src/components/m3'
import BatLinhShell from '../../src/components/bat-linh/BatLinhShell'
import SanhHomNay from '../../src/components/ban-duyet-v2/SanhHomNay'
import { docSanh, type KetQuaSanh } from '../../src/components/hoa2/api'
// Bản màu app thầy (App.tsx nạp ba tệp này, phạm vi `.vo-thay`) — màn thầy bọc đúng khung `.m3.m3-thay.vo-thay` như app thật.
import '../../src/styles/vo-thay.css'
import '../../src/styles/gv-mau.css'
import '../../src/styles/teacher-modern.css'
import '../../src/game/than-thu-v2/game.css'
import '../../src/game/than-thu-v2/dao/dao.css'
import ThanThuV2 from '../../src/game/than-thu-v2/dao/ThanThuV2'
import ManShop from '../../src/game/than-thu-v2/shop/ManShop'
import { ShopApiGia } from '../../src/game/than-thu-v2/shop/du-lieu-mau'
import { ThuMacDo } from '../../src/game/than-thu-v2/phu-kien/ThuMacDo'
import { HinhVatPham } from '../../src/game/than-thu-v2/phu-kien/HinhVatPham'
import Dao2 from '../../src/game/than-thu-v2/dao2/Dao2'
import DoanHoTong from '../../src/game/than-thu-v2/DoanHoTong'
import type { DoanXem } from '../../src/game/than-thu-v2/doan-kieu'
import type { DaoKetQua, DaoProfile } from '../../src/game/than-thu-v2/dao/kieu'
import ThanhBenTrai from '../../src/components/ThanhBenTrai'
import ChienDichScreen from '../../src/screens/ChienDichScreen'
import AppPhuHuynh from '../../src/components/ph-v3/AppPhuHuynh'
import DeThu from '../../src/game/than-thu-v2/dao2/DeThu'
import { PH_OK } from '../../tests/_ph-moi/du-lieu-mau'
import BangMaTranDe from '../../src/components/ma-tran-de/BangMaTranDe'
import { useCoHoa2 } from '../../src/components/chien-dich/co-hoa2'
import { useAppStore } from '../../src/store/appStore'
import { KHO } from '../chup-omni-3/gia/may-thay'
import BottomNav from '../../src/components/BottomNav'
import { apDungGiaoDien } from '../../src/lib/giao-dien-thay'
import { useSoDemGv, type TheHanhTrinh } from '../../src/lib/so-dem-gv'

const thamSo = new URLSearchParams(location.search)
const man = thamSo.get('man') ?? 'sanh'
const now = Date.now()
const noop = () => {}

// ---------------------------------------------------------------- dữ liệu Sảnh giả (đúng kiểu SanhHoa2 — số đối chiếu được với nhau)
// Hành trình tầng Hiểu: tối thiểu 30 câu; đã làm 12 ⇒ còn 18 = 2 câu ôn (Đoàn) + 16 câu mới (Đảo). Chặng 3/5 (6 câu/chặng), còn 6 câu trong chặng.
const SANH_HT = {
  ok: true, cheDo2: true, ngay: '2026-10-09',
  hanhTrinh: { tang: 2, toiThieu: 30, daLam: 12, daXep: 30, conThieu: 0, soChang: 5, changHienTai: 3, cauTrongChang: 6 },
  chienDich: null,
  theLuc: { con: 18, tong: 30 }, huyetChien: false, doan: { con: 2 }, dao: { con: 16 }, khoaDao: true, loiKhoaDao: 'Gỡ xong 2 lỗi cũ ở Đoàn Hộ Tống để mở cầu sang đảo.',
  ruong: { daLam: 12, tong: 30, moDuoc: false, daMo: false, qua: null },
  bia: null, tamGiuCa: 0, thuSucThem: { duoc: false, soCau: 0 }, chuoiNgay: 12,
  omni: { bat: true, baiDangLuyen: [], dangVung: { a: 5, b: 8 }, conDangDe8: 2, sEm: 0.06, sMucTieu: 0.07, chungChi: [], ve: { con: 2, tong: 2 }, choBaiMoi: false, onBaiCu: 0, metGio: null, nhatKy: null, deThu: { duoc: false, soCau: 14, phut: 25 } },
}
// Xong kế hoạch: 30/30, rương mở được, có Thử sức thêm 6 câu.
const SANH_XONG = { ...SANH_HT, hanhTrinh: { ...SANH_HT.hanhTrinh, daLam: 30, changHienTai: 5, cauTrongChang: 0 }, theLuc: { con: 0, tong: 30 }, doan: { con: 0 }, dao: { con: 0 }, khoaDao: false, loiKhoaDao: '', ruong: { daLam: 30, tong: 30, moDuoc: true, daMo: false, qua: null }, thuSucThem: { duoc: true, soCau: 6 } }

// ---------------------------------------------------------------- app thầy 2.0 (trung tu 09/10): danh sách em / ca / câu hỏi / học phí GIẢ
// 60 em (chia trang 25); 12 em đầu trùng SBD bảng Hành trình giả (gia/goi-lenh-thay.ts) ⇒ cột "Hôm nay" có số thật của bộ giả.
const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Ngô']
const TEN = ['Minh Anh', 'Đức Huy', 'Phương Linh', 'Quang Minh', 'Thu Trang', 'Khánh', 'Anh', 'Thảo Linh', 'Gia Bảo', 'Hải Yến', 'Quốc Việt', 'Mai Chi']
const EM_GIA = Array.from({ length: 60 }, (_, i) => {
  const khoi = [12, 11, 10][i % 3]!
  return {
    sbd: String(11010 + i), hoTen: i === 7 ? '' : `${HO[i % HO.length]} ${TEN[i % TEN.length]}`, namSinh: String(2021 - khoi), lop: khoi === 12 ? '12A1' : khoi === 11 ? '11B' : '10C',
    trangThai: i === 9 ? 'ngoai_danh_sach' : 'trong_danh_sach', soCa: i % 5, diemGanNhat: i % 4 === 3 ? null : Math.round((5 + ((i * 7) % 50) / 10) * 4) / 4, caGanNhat: '', nopGanNhat: '',
  }
})
const HOC_PHI_GIA = EM_GIA.map((e, i) => ({ sbd: e.sbd, phaiNop: 4_500_000, daNop: i % 3 === 0 ? 4_500_000 : i % 3 === 1 ? 3_000_000 : 0, ghiChu: '', soLan: i % 3 === 2 ? 0 : 1 }))
const phutTruoc = (p: number) => new Date(now - p * 60_000).toISOString()
const CA_GIA = [
  { maCa: 'DH-12-C2-B6', tenCa: 'Kiểm tra Ester 12A1', lop: '12A1', thoiGianPhut: 45, moLuc: phutTruoc(12), batDau: phutTruoc(12), hetHanVao: new Date(now + 30 * 60_000).toISOString(), trangThai: 'mo', phamVi: 'tu_do', congBo: 'ca_lop_xong', loai: 'thi', hanNop: '', lenBang: true, daVao: 36, daNop: 12, canhBao: 0 },
  { maCa: 'DH-11-C1-A2', tenCa: 'Kiểm tra 15 phút 11B', lop: '11B', thoiGianPhut: 15, moLuc: '2026-10-07T02:00:00Z', batDau: '2026-10-07T02:00:00Z', hetHanVao: '2026-10-07T02:20:00Z', trangThai: 'dong', phamVi: 'tu_do', congBo: 'ngay', loai: 'thi', hanNop: '', lenBang: true, daVao: 28, daNop: 28, canhBao: 1 },
]
const CAU_HOI_GIA = [0, 1, 2].map((i) => ({ maCa: 'DH-11-C1-A2', tenCa: 'Kiểm tra 15 phút 11B', sbd: String(11011 + i * 3), hoTen: EM_GIA[1 + i * 3]!.hoTen, qids: ['Q3'], ghiChu: '', guiLuc: '2026-10-07T03:00:00Z', daChua: i === 2, chuaLuc: '' }))

const emGia = (i: number) => ({ dotId: `d${i}`, sbd: EM_GIA[i]!.sbd, hoTen: EM_GIA[i]!.hoTen || EM_GIA[i]!.sbd, revision: 1, daHieu: [], traLoi: '0,2 mol', hoi: 'Số mol NaOH phản ứng là bao nhiêu?', soVongHoTro: 2 })
const BUOC_CUOI_GIA = [
  { id: 'bc-1', lop: '12A1', qid: 'DH-12-C1-B2-31', buocId: 'b3', tieuDe: 'Câu 31 · Bảo toàn khối lượng khi xà phòng hoá', maLoi: null, diemVuong: 'Quên cộng khối lượng H2O sinh ra vào vế sau', cauGoc: { phan: 'III', text: 'Xà phòng hoá hoàn toàn m gam chất béo…' }, buoc: [], em: [0, 3, 6].map(emGia), guiLuc: 1 },
]
const nhomNutGia = (khoa: string, qidMau: string, so: string, buoc: number, soEm: number, nhanNen: string, nhieuEmVuong = false) => ({ khoa, bam: khoa, buoc, qidMau, so, de: '<p>Cho m gam Fe tác dụng với HNO₃ loãng dư…</p>', chuBuoc: 'Bảo toàn electron: 3x = 0,4', nhanNen, cauKiemHoi: 'Số mol electron nhận là bao nhiêu?', soEm, em: Array.from({ length: soEm }, (_, i) => ({ sbd: EM_GIA[i * 3]!.sbd, hoTen: EM_GIA[i * 3]!.hoTen || EM_GIA[i * 3]!.sbd, dapAnChon: 'B', kiem: [], viet: '', soLanThu: 2, guiLuc: 'x' })), soCauCungChuyenDe: 0, hanGanNhat: null, diem: soEm, nhieuEmVuong })
const NUT_THAT_GIA = {
  ok: true,
  nhom: [nhomNutGia('BAM17|1', 'DH-12-C1-B2-17', 'Câu 17', 1, 2, 'Thuỷ phân ester'), nhomNutGia('BAM6|2', 'DH-12-C3-B1-6', 'Câu 6', 2, 4, 'Bảo toàn electron', true)],
  cungNen: [{ nen: 'Bảo toàn electron', soEm: 4, soCau: 2, khoa: ['BAM6|2'] }],
  kemRieng: [{ sbd: EM_GIA[4]!.sbd, hoTen: EM_GIA[4]!.hoTen, qid: 'DH-12-C1-B2-17', buoc: 1, so: 'Câu 17', chuBuoc: 'Đổi đơn vị' }],
  tong: { soThe: 7, soNhom: 2, theNgayDongNhat: 4, quaTai: false },
}

const fetchGoc = window.fetch.bind(window)
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const u = new URL(url, location.href)
  if (u.origin === location.origin && !u.pathname.startsWith('/game-v2/') && !u.pathname.startsWith('/hs/') && !u.pathname.startsWith('/gv/') && !u.pathname.endsWith('cau-hinh.json')) return fetchGoc(input, init)
  const tra = (o: unknown) => new Response(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json' } })
  if (u.pathname.endsWith('cau-hinh.json')) return tra({ mayChuMoi: 'https://may-chu-gia.example.com' })
  let b: Record<string, unknown> = {}
  try { b = init?.body ? JSON.parse(String(init.body)) : {} } catch { /* bỏ qua */ }
  if (u.pathname.includes('vang-xem') || b.action === 'vang-xem' || b.lenh === 'vang-xem') return tra({ ok: true, bat: true, vang: 340, ongNghiem: 1200, giuLai: 200, chuoiNgay: 12, doiToiDa: 10 })
  if (b.action === 'danhSachEm' || u.pathname.endsWith('/em/danh-sach')) return tra({ ok: true, items: EM_GIA })
  if (b.action === 'danhSachCa') return tra({ ok: true, items: b.daXoa ? [] : CA_GIA })
  if (b.action === 'danhSachCauHoi') return tra({ ok: true, items: CAU_HOI_GIA })
  if (u.pathname.endsWith('/gv/hoc-phi/ds')) return tra({ ok: true, items: HOC_PHI_GIA })
  // Hành trình › Cần thầy chữa (trung tu 09/10 tối): bước cuối trên lớp + thẻ nút thắt GIẢ (tên em giả).
  if (u.pathname.endsWith('/gv/chua-cau-sai/hang-chieu')) return tra({ ok: true, bat: true, conNua: false, ds: BUOC_CUOI_GIA })
  if (u.pathname.endsWith('/gv/nut-that/ds')) return tra(NUT_THAT_GIA)
  if (u.pathname.endsWith('/ph/tat-ca-ve-con')) return tra(PH_OK)
  if (u.pathname.endsWith('/ph/hoc-2')) return tra({ ok: true, cheDo2: true, ngay: '2026-10-09', homNay: { tong: 30, daLam: 12 } })
  // App phụ huynh (trung tu 09/10): một nhận xét đã công bố để ảnh có thẻ "Nhận xét của thầy" ở Hôm nay và màn con `#loi-thay`.
  if (u.pathname.endsWith('/ph/loi-thay')) return tra({ ok: true, nhanXet: [{ maCa: 'CA-2', tenCa: 'Kiểm tra 45 phút · Ester – Lipid', noiDung: 'Con làm tốt phần lý thuyết ester. Bài đốt cháy hỗn hợp con còn nhầm bước bảo toàn nguyên tố, thầy sẽ chữa cùng con ở buổi tới.', capNhatLuc: '2026-09-20T01:00:00Z', nopLuc: '2026-09-19T02:12:00Z', tong: 7.5 }] })
  return tra({ ok: true })
}

function manSanh(du: Record<string, unknown> | null, them: Record<string, unknown> = {}) {
  return h(SanhHomNay, {
    tenEm: 'Nguyễn Minh Anh', lop: '12A1',
    ketQua: du ? (docSanh(du) as KetQuaSanh) : null, loi: '', dangTai: !du, thu: { index: 5, cap: 7, ten: 'Linh Hồ' }, exp: { homNay: 22, conThieu: 160 },
    chuoiNgay: 12, caDangMo: false, now, token: 'tk', shopBat: true, onVaoThi: noop, onPhaPhucKich: noop, onKhamPhaDao: noop, onCauDaLam: noop,
    onTuiDo: noop, onCuaHang: noop, onMoThanThu: noop, onChonThu: noop, onDangXuat: noop, onTaiLai: noop, onTuLuyen: noop,
    caGanNhat: { chu: 'Ca kiểm tra gần nhất: 8,00 điểm · 03/10', coDiem: true }, onLichSuCa: noop,
    ...them,
  } as never)
}

// ---------------------------------------------------------------- thần thú + cửa hàng (component THẬT)
const hoSo = { nickname: 'Linh Hồ', pet: 'tinhyeu_ho', choice: false, cap: 7, exp: 120, wallet: 0, mastery: [] } as unknown as DaoProfile
const veThuThat = (o: { pet: number; cap: number; size?: number; dangMac?: unknown; ten?: string; nhan?: string; tinh?: boolean }) => h(ThuMacDo as never, o as never)

// ---------------------------------------------------------------- Đảo 2.0 (component THẬT `Dao2`, máy chủ giả qua prop `call`) — câu công khai không đáp án
const cauDao = (i: number) => [
  { text: 'Chất nào sau đây là ester?', choices: ['CH₃COOH', 'C₂H₅OH', 'CH₃COOCH₃', 'CH₃CH₂CH₂OH'] },
  { text: 'Thuỷ phân ethyl acetate trong dung dịch NaOH thu được muối nào?', choices: ['HCOONa', 'CH₃COONa', 'C₂H₅ONa', 'CH₃ONa'] },
  { text: 'Công thức chung của ester no, đơn chức, mạch hở là', choices: ['CₙH₂ₙO₂ (n ≥ 2)', 'CₙH₂ₙ₊₂O₂', 'CₙH₂ₙ₋₂O₂', 'CₙH₂ₙO (n ≥ 1)'] },
  { text: 'Chất nào có nhiệt độ sôi thấp nhất?', choices: ['CH₃COOH', 'CH₃COOCH₃', 'C₂H₅OH', 'CH₃CH₂CH₂OH'] },
].map((c, k) => ({ qid: `HS${k + 1}`, maDe: 'DH-12-C1-B1-TN', version: '1', group: `g${k + 1}`, phan: 'I', text: c.text, choices: c.choices, ideas: [], hinhAnh: [], dang: 'ES', tenDang: 'Khái niệm ester', mucDo: 'biet', sao: 0, kienThuc: [], vai: 'moi' }))[i]!
const SANH_DAO = { ...SANH_HT, khoaDao: false, loiKhoaDao: '' }
const callDao = async (action: string): Promise<DaoKetQua> => {
  await new Promise((r) => setTimeout(r, 60))
  const kq: Record<string, unknown> =
    action === 'hoa2-sanh' ? SANH_DAO
    : action === 'resume' ? { questions: [] }
    : action === 'sync' ? { remaining: 0 }
    : action === 'hoa2-omni-de-thu' ? { id: 'DT1', cau: Array.from({length:14},(_,i)=>({...cauDao(i%4),qid:`DT${i+1}`})), phut: 25, hetLuc: new Date(Date.now()+25*60_000).toISOString() }
    : action === 'start' ? { id: 'P1', questions: [0, 1, 2, 3].map(cauDao), theLuc: { con: 18, tong: 30 }, dao: { con: 16 }, doan: { con: 0 } }
    : {}
  return { ok: true, ...kq } as DaoKetQua
}

// ---------------------------------------------------------------- Đoàn Hộ Tống (component THẬT `DoanHoTong`, phòng Hóa 2.0 một người thật)
const gheD: DoanXem['ghe'] = [
  { ghe: 0, ten: 'Minh Anh', pet: 5, cap: 7, laMay: false, roi: false, laEm: true, trangThai: 'dang_lam', tinHieu: null },
  { ghe: 1, ten: 'Thu Hà', pet: 1, cap: 6, laMay: false, roi: false, laEm: false, trangThai: 'da_chot', tinHieu: null },
]
const tranD = { tenChang: 'Ổ phục kích Sương Mù', hiep: 1, soHiep: 8, laTrum: false, ketThuc: false, thang: null, linhTam: { hp: 100, toiDa: 100 }, quai: [{ ma: 5, loai: 'bun_acid', hp: 24 }], trumVoGiap: [],
  nangLuong: 2, daNhanTiepSuc: 0, giay: 40, moSauMs: 0, conMs: 26000, tenQuai: ['Bùn Acid', 'Khói Oxi Hoá'], loaiQuai: ['bun_acid', 'khoi_oxi_hoa'], tenTrum: ['Chúa tể Kết Tủa', 'Bá chủ Ăn Mòn'], loaiTrum: ['chua_te_ket_tua', 'ba_chu_an_mon'] } as DoanXem['tran']
const deD = { qid: 'Q1', maDe: 'DH-12-C1-B1-TN', version: 'v', group: 'g', phan: 'I' as const, text: 'Dựa vào bảng sau, chất nào là ester?', table: [['Chất', 'Công thức'], ['Ethanol', 'C₂H₅OH'], ['Acetic acid', 'CH₃COOH'], ['Methyl acetate', 'CH₃COOCH₃']], choices: ['Ethanol', 'Acetic acid', 'Methyl acetate', 'Cả ba chất'], ideas: [], hinhAnh: [], dang: 'ES', tenDang: 'Khái niệm ester', mucDo: 'biet', sao: 0, kienThuc: [] }
const xemD = (): DoanXem => ({ ma: 'DH2', revision: 5, laChu: true, batDau: true, ghe: gheD, gioMayChu: 0, tran: tranD, cau: { qid: deD.qid, nhan: 'toi_han_on', de: deD } as DoanXem['cau'] })
const OMNI_D = { bat: true, baiDangLuyen: [], dangVung: { a: 0, b: 0 }, conDangDe8: null, sEm: null, sMucTieu: 0.07, chungChi: [], ve: { con: 2, tong: 2 }, choBaiMoi: false, onBaiCu: 0, metGio: null, nhatKy: null, deThu: { duoc: false, soCau: 14, phut: 25 } }
const callDoan = async (lenh: string): Promise<unknown> =>
  lenh === 'hoa2-sanh' ? { ok: true, cheDo2: true, doan: { con: 4 }, dao: { con: 16 }, omni: OMNI_D } : lenh === 'doan-xem' ? { ok: true, doan: xemD() } : { ok: true }

const MAN_THAY: Record<string, string> = { 'gv-hom-nay':'tongquan', 'gv-kho':'nganhangde', 'gv-cai-dat':'caidat', 'gv-hoc-sinh':'hocsinh', 'gv-mo-ca':'tao-ca', 'gv-go-nut':'cauhoi', 'gv-duyet':'duyetloigiai', 'gv-nhip': 'chiendich', 'gv-ma-tran': 'tao-ca' }
const con =
  man === 'gv-hom-nay' ? h(GvHomNayScreen) : man === 'gv-kho' ? h(NganHangDeScreen) : man === 'gv-cai-dat' ? h(CaiDatScreen) : man === 'gv-hoc-sinh' ? h(HocSinhScreen) : man === 'gv-mo-ca' ? h(ExamSetupScreen) : man === 'gv-go-nut' ? h(BanGoNutThatScreen) : man === 'gv-duyet' ? h(DuyetLoiGiaiScreen) :
  man === 'ph' ? h(AppPhuHuynh, { sbd: '12121212', hoTen: 'Nguyễn Minh Anh', lop: '12A1', onDoiSbd: noop })
  : man === 'de-thu' ? h('div', {className:'dao dao2'}, h(DeThu, {sbd:'GIA',call:callDao,onVe:noop}))
  : man === 'than-thu' ? h('div', { className: 'dao dao-vo dao-v2', 'data-thu': 5 }, h(ThanThuV2, { profile: hoSo, token: 'tk', onCuaHang: noop, onTuiDo: noop, onDongHanh: noop }))
  : man === 'cua-hang' ? h('div', { className: 'dao dao-vo dao-v2', 'data-thu': 5 }, h(ManShop as never, { api: new ShopApiGia(), pet: 5, cap: 7, tenThu: 'Linh Hồ', onDong: noop, veThu: veThuThat, veHinhMon: (m: { ma: string }) => h(HinhVatPham as never, { ma: m.ma }) } as never))
  : man === 'dao' ? h(Dao2, { sbd: 'GIA', profile: hoSo, call: callDao, doanMo: false, sanhDau: SANH_DAO, onMoDoan: noop, onMoSoTay: noop, onDong: noop } as never)
  : man === 'doan' ? (sessionStorage.setItem('doan:GIA', 'DH2'), h(DoanHoTong, { call: callDoan as never, sbd: 'GIA', pet: 5, cap: 7, onDong: noop, onVeBangNhiemVu: noop } as never))
  : man === 'gv-nhip' ? (useCoHoa2.getState().dat({ bat: true, lop: [], sbd: [] }), thamSo.get('the') && useSoDemGv.getState().datMoHanhTrinh({ the: thamSo.get('the') as TheHanhTrinh }), h(ChienDichScreen))
  : man === 'gv-ma-tran' ? h('div', { style: { padding: 24, maxWidth: 900 } }, h(BangMaTranDe, { nguon: KHO, rut: false }))
  : man === 'sanh-xong' ? manSanh(SANH_XONG)
  : man === 'sanh-ca-mo' ? manSanh(SANH_HT, { caDangMo: true })
  : man === 'sanh-dang-tai' ? manSanh(null)
  : manSanh(SANH_HT)

const manThay = MAN_THAY[man]
// TRUNG TU 09/10: mọi màn thầy chụp ở CHẾ ĐỘ 2.0 thật (cờ bật + `data-hoa2` trên vỏ như App.tsx) — trước đây chỉ gv-nhip bật cờ nên thanh bên
// trong ảnh là danh sách cũ 9 mục. Thanh đáy (< 880 px) cũng dựng như app thật. `?giao=toi|sang` = thầy ép nút Sáng/Tối trong Cài đặt.
const MAN_STORE: Record<string, string> = { 'gv-hom-nay': 'tongquan', 'gv-kho': 'nganhangde', 'gv-cai-dat': 'caidat', 'gv-hoc-sinh': 'hocsinh', 'gv-mo-ca': 'examsetup', 'gv-go-nut': 'bangonutthat', 'gv-duyet': 'duyetloigiai', 'gv-nhip': 'chiendich', 'gv-ma-tran': 'examsetup' }
if (manThay) {
  // Trang chụp nạp CHUNG CSS game (doan.css có lớp `.dh-so` cùng tên — ô đáp số Đoàn Hộ Tống, rộng 100%, nền giấy) với màn thầy; app thầy thật
  // KHÔNG nạp doan.css (mảnh game chỉ máy em tải) ⇒ trả số bước Dạy học / Kiểm tra đầu giờ về đúng hình tròn 36 px của day-hoc.css cho ảnh chụp.
  document.head.append(Object.assign(document.createElement('style'), { textContent: '.vo-thay .dh-buoc-dau > .dh-so{width:36px;height:36px;padding:0;border-radius:50%;box-shadow:none;background:var(--bts-duong);color:var(--bts-mat);font-size:16px}' }))
  useCoHoa2.getState().dat({ bat: true, lop: [], sbd: [] })
  useAppStore.setState({ screen: MAN_STORE[man] as never })
}
const giao = thamSo.get('giao')
if (giao === 'toi' || giao === 'sang') apDungGiaoDien(giao)
createRoot(document.getElementById('root')!).render(
  manThay
    ? (document.body.removeAttribute('data-bat-linh'), h('div', { className: 'min-h-screen m3 m3-thay vo-thay', 'data-hoa2': '' }, h(ThanhBenTrai), h('div', { className: 'khung-noi-dung' }, h('div', { className: 'giua-noi-dung', 'data-teacher-screen': manThay }, con)), h(BottomNav)))
    : man === 'ph' ? (document.body.removeAttribute('data-bat-linh'), con) : h(BatLinhShell, { vai: 'hs' }, con),
)
