// TRANG XEM THỬ ĐOÀN 2.0 (chỉ `npm run dev`, KHÔNG vào bản build): /src/game/than-thu-v2/doan2/xem-thu-2.html?man=tran|cot-loi|ket-qua|trum|tiep-suc|thang|keo|thua|sanh|sanh-het (man=tran: chọn + chốt ⇒ tung chưởng ⇒ lời giải đứng yên + ĐÁNH TIẾP)
// Dựng DoanHoTong THẬT với máy chủ giả (dữ liệu bịa chỉ để nhìn bố cục — không bao giờ chạy trên máy em). Dùng để chụp ảnh đối chiếu bản vẽ Moi-DoanTran / Moi-DoanThang.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '../../../styles/tokens.css'
import '../../../index.css'
import '../game.css'
import '../../../components/exp-cau/exp-cau.css' // hiệu ứng "+N EXP" (bản thật nạp ở src/main.tsx)
import DoanHoTong from '../DoanHoTong'
import type { DoanXem } from '../doan-kieu'

const man = new URLSearchParams(location.search).get('man') ?? 'tran'
const thu = Math.max(0,Math.min(7,Number(new URLSearchParams(location.search).get('thu')??2)))
const ghe: DoanXem['ghe'] = [
  { ghe: 0, ten: 'Minh', pet: thu, cap: 32, laMay: false, roi: false, laEm: true, trangThai: 'dang_lam', tinHieu: null },
  { ghe: 1, ten: 'Thu Hà', pet: 1, cap: 30, laMay: false, roi: false, laEm: false, trangThai: 'da_chot', tinHieu: null },
  { ghe: 2, ten: 'Nam', pet: 3, cap: 12, laMay: false, roi: false, laEm: false, trangThai: 'dang_lam', tinHieu: null },
]
const tran = (o: Partial<NonNullable<DoanXem['tran']>> = {}): NonNullable<DoanXem['tran']> => ({ tenChang: 'Đèo Hoàng Hôn', hiep: 3, soHiep: 8, laTrum: false, ketThuc: false, thang: null, linhTam: { hp: 80, toiDa: 100 },
  quai: [{ ma: 5, loai: 'bun_acid', hp: 6 }, { ma: 6, loai: 'bun_acid', hp: 24 }], trumVoGiap: [], nangLuong: 2, daNhanTiepSuc: 0, giay: 45, moSauMs: 0, conMs: 26000,
  tenQuai: ['Bùn Acid', 'Khói Oxi Hoá'], loaiQuai: ['bun_acid', 'khoi_oxi_hoa'], tenTrum: ['Chúa tể Kết Tủa', 'Bá chủ Ăn Mòn'], loaiTrum: ['chua_te_ket_tua', 'ba_chu_an_mon'], ...o } as NonNullable<DoanXem['tran']>)
const deI = { qid: 'Q1', maDe: 'D', version: 'v', group: 'g', phan: 'I' as const, text: 'Thuỷ phân hoàn toàn 8,8 gam ethyl acetate bằng dung dịch NaOH dư, đun nóng. Khối lượng muối thu được là', choices: ['4,1 gam', '8,2 gam', '9,6 gam', '6,8 gam'], ideas: [], hinhAnh: [], dang: 'ES', tenDang: 'Thuỷ phân ester', mucDo: 'hieu', sao: 2, kienThuc: [] }
const deII = { ...deI, qid: 'Q2', phan: 'II' as const, text: 'Cho ethyl acetate tác dụng với dung dịch NaOH đun nóng.', choices: [], ideas: ['Sản phẩm có muối sodium acetate.', 'Phản ứng là thuận nghịch.', 'Ancol tạo ra là ethanol.', 'Cần 2 mol NaOH cho 1 mol ester.'] }
const vuaXong = { hiep: 2, laTrum: false, tongSatThuong: 48, tongChan: 0, quaiHaGuc: 1, quaiConLai: 2, linhTamMat: 0, linhTamHoi: 0, linhTamSau: 80, trum: null, ban: [],
  cuaEm: { ghe: 0, nop: true, dung: true, tuLam: true, hanhDong: 'danh', tenChieu: 'Liệt Diễm', satThuong: 24, heSo: { dung: 1.5, lienKich: 1, anThach: 1 }, lienKich: false, chan: 0, hoi: 0, lan: 0, haGuc: 0, giup: null, giupThanhCong: false, duocGiupBoi: null, nangLuongSau: 2, yGiu: [], yDung: [] } }
const loiGiai = { chot: 'Ester RCOOR\' + NaOH → RCOONa + R\'OH; n(muối) = n(ester).', tung_pa: { A: { dung: false, vi_sao: 'Nhầm khối lượng của HCOONa.' }, B: { dung: true, vi_sao: 'n = 0,1 mol ⇒ m(CH3COONa) = 8,2 gam.' }, C: { dung: false, vi_sao: 'Nhầm với khối lượng muối potassium.' }, D: { dung: false, vi_sao: 'Nhầm khối lượng C2H5ONa.' } } }
const ket = (thang: boolean): DoanXem => ({ ma: 'DH9', revision: 30, laChu: true, batDau: true, ghe, gioMayChu: 0, tran: tran({ hiep: 8, laTrum: true, ketThuc: true, thang, quai: [] }),
  ketChang: { thang, sao: thang ? 3 : 0, linhTam: { hp: thang ? 84 : 0, toiDa: 100 }, trumVoGiap: [true, true], quaiHaGuc: 17, soLienKich: 2,
    cuaEm: { ghe: 0, id: 'x', laMay: false, soCau: 4, soDung: 3, soTuLamDung: 3, satThuong: 120, chan: 8, haGuc: 5, soLanGiup: 1, soLanGiupThanhCong: 1, soLanDuocGiup: 0, soLienKich: 1 } as never,
    tienBo: { soCau: 4, tuLamDung: 3, lenBac: null, giup: 1, giupThanhCong: 1, duocGiup: 0 }, ban: [],
    expChang: [{ loai: 'doan_chang', exp: 12, ghiChu: '' }, { loai: 'doan_giap', exp: 6, ghiChu: '' }],
    doanLop: { tramTruoc: 17, tramSau: 18, tongTram: 30, banThu: 10, siSo: 32, conTramToiMoc: 3, tenMocKe: 'Hồ Cân Bằng', trumLop: null } } })
const xem: DoanXem | null =
  man === 'tran' ? { ma: 'DH1', revision: 5, laChu: true, batDau: true, ghe, gioMayChu: 0, tran: tran(), hiepVuaXong: vuaXong as never, tiepSuc: { conLuotNhan: 2, daXin: false, theNhan: null, banCan: [], daGiup: false, lienKichSanSang: true }, cau: { qid: 'Q1', nhan: 'toi_han_on', de: deI, goiY: { gach: ['A', 'D'] } } as never }
    : man === 'cot-loi' ? { ma: 'DH1', revision: 5, laChu: true, batDau: true, ghe, gioMayChu: 0, tran: tran(), cau: { qid: 'Q2', nhan: 'toi_han_on', de: deII, goiY: { cotLoi: 'Ester thuỷ phân trong kiềm là phản ứng một chiều (xà phòng hoá).' } } as never }
      : man === 'ket-qua' ? { ma: 'DH1', revision: 5, laChu: true, batDau: true, ghe, gioMayChu: 0, tran: tran(), cau: { qid: 'Q1', nhan: 'toi_han_on', de: deI, daChot: true, hanhDong: 'danh', ketQua: new URLSearchParams(location.search).has('dung') ? { correct: true, answer: 'B', solution: loiGiai, reward: 0, expCau: 3 } : { correct: false, answer: 'B', solution: loiGiai } } } // ?dung ⇒ câu đúng có "+3 EXP"
        : man === 'trum' ? { ma: 'DH1', revision: 5, laChu: true, batDau: true, ghe, gioMayChu: 0, tran: tran({ hiep: 4, laTrum: true, quai: [], giay: 60 }),
          trum: { coCau: true, giaoY: [0, 1, 2, 0], yCuaEm: [0, 3], yDaChot: [false, true, false, false], qid: 'Q2', tenDang: 'Thuỷ phân ester', de: deII } }
        : man === 'tiep-suc' ? { ma: 'DH1', revision: 5, laChu: true, batDau: true, ghe: ghe.map(g => g.ghe === 2 ? { ...g, trangThai: 'can_tiep_suc' as const } : g), gioMayChu: 0, tran: tran(),
          tiepSuc: { conLuotNhan: 2, daXin: false, theNhan: null, banCan: [2], daGiup: false, lienKichSanSang: false }, cau: { qid: 'Q1', nhan: 'toi_han_on', de: deI, daChot: true, hanhDong: 'danh', ketQua: null } }
        : man === 'thang' || man === 'keo' ? ket(true) : man === 'thua' ? ket(false) : null
const con = man === 'thang' || man === 'sanh-het' ? 0 : man === 'keo' || man === 'thua' ? 2 : 4
if (xem) sessionStorage.setItem('doan:S1', xem.ma); else sessionStorage.removeItem('doan:S1')
const sanh = { lop: '12A1', tenDoan: 'Đoàn Hộ Tống 12A1', mua: { so: 1, conNgay: 19 }, ve: 0, mienPhiHomNay: false, chuoi: { ngay: 5, daDiHomNay: false, mocKe: 7, conNgay: 2 },
  doanLop: { lop: '12A1', tram: 17, tongTram: 30, changThang: 3, changMoiTram: 4, conChangToiTramKe: 4, mocKe: 20, tenMocKe: 'Hồ Cân Bằng', conTramToiMoc: 3, gopSucHomNay: 9, siSo: 32 },
  trumLop: { dangMo: false, chuNhat: '2026-10-04', moSauMs: 4 * 24 * 3_600_000 + 5 * 3_600_000, conMs: 0, daGop: 0, mucTieu: 300, daHa: false }, quaMoi: [] }
let daNop: DoanXem | null = null
const call = async (lenh: string) => {
  await new Promise(r => setTimeout(r, 30))
  if (lenh === 'hoa2-sanh') return { ok: true, cheDo2: true, doan: { con }, dao: { con: 28 } }
  if (lenh === 'doan-sanh') return { ok: true, sanh, dangDo: null, tranNgay: 60, dailyUsed: 8 }
  if (lenh === 'recommendations') return { ok: true, suggestions: [] }
  if (lenh === 'doan-xem' && xem) return { ok: true, doan: daNop ?? xem }
  if (lenh === 'doan-nop' && xem) { daNop = { ...xem, revision: 6, tran: tran({ hiep: 4, moSauMs: 15 * 60_000, choTiep: true, quai: [{ ma: 6, loai: 'bun_acid', hp: 24 }] } as never), cau: undefined, hiepVuaXong: { ...vuaXong, hiep: 3 } as never }; return { ok: true, doan: daNop, ketQuaCau: { correct: true, answer: 'B', solution: loiGiai } } }
  if (lenh === 'doan-the-goi-y') return { ok: true, goiY: { den: 2, ten: 'Nam', pet: 3, cap: 12, tenDang: 'Thuỷ phân ester', de: deI.text, the: [{ loai: 'nhac_cong_thuc', tieuDe: 'Nhắc công thức', moTa: 'Gửi bạn kiến thức gốc của câu' }, { loai: 'loai_phuong_an', tieuDe: 'Loại 1 phương án', moTa: 'Thầy Đỗ Đại Học gạch một đáp án sai' }] } }
  return { ok: true }
}

createRoot(document.getElementById('root')!).render(<StrictMode><DoanHoTong call={call} sbd="S1" pet={thu} cap={32} onDong={() => {}} onVeBangNhiemVu={() => {}} /></StrictMode>)
