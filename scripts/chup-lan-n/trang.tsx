// TRANG CHỤP ẢNH ĐỢT 19 · LÀN N (thầy 13/10: Hành trình "cực đẹp, khoa học, thân thiện trực quan" · Ôn & sửa "rõ từng phần" · biểu tượng Tự sửa lỗi
// "đẹp mắt hơn nữa") — component THẬT + máy chủ GIẢ ngay trong trang (thay `fetch`; không yêu cầu nào tới máy chủ thật, tên em là tên giả).
// Sảnh giả đúng HÌNH phản hồi `hoc-tap-sanh` khi Gói 7 bật (KHÔNG có `hanhTrinh` — trường hợp từng ra "Chưa có danh sách bài.").
//   ?tang=0  — máy chủ chưa gửi tầng (bản đang chạy) ⇒ thang trung tính. Mặc định: có `goi7.tang` / `goi[].tang` (trường CHỈ-THÊM đợt 19).
//   ?mot=1   — chỉ một bài (Bài 8. Amine, đúng ảnh thầy).
import { createElement as h } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '../../src/styles/tokens.css'
import '../../src/styles/thang.css'
import '../../src/index.css'
import HocTapHomNay from '../../src/components/hoc-tap/HocTapHomNay'
import { docSanh } from '../../src/components/hoa2/api'

const thamSo = new URLSearchParams(location.search)
const coTang = thamSo.get('tang') !== '0'
const motBai = thamSo.get('mot') === '1'
const noop = () => {}

const tra = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } })
window.fetch = async (input: RequestInfo | URL) => {
  const u = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, location.href)
  const d = u.pathname
  if (d.endsWith('cau-hinh.json')) return tra({ mayChuMoi: 'https://may-chu-gia.example.com' })
  if (d.endsWith('/hs/chua-cau-sai/co')) return tra({ ok: true })
  if (d.endsWith('/hs/chua-cau-sai/danh-sach')) return tra({ ok: true, ds: Array.from({ length: 100 }, (_, i) => ({ qid: `DH-12-C1-B8-TN-I-${i + 1}`, trangThai: 'can_chan_doan' })) })
  return tra({ ok: false, message: 'Trang chụp: không có dữ liệu.' }, 404)
}

const amine = { id: 'g7:amine', ten: 'Bài 8. Amine', batDau: '2026-10-10', han: '2026-10-16', tong: 164, daGap: 13, con: 151, quota: 24, gapHomNay: 3, quaHan: false, canBoSung: 0, to: ['DH-B8-TN'], ...(coTang ? { tang: 2 } : {}) }
const ester = { id: 'g7:ester', ten: 'Bài 7. Ester – Lipid', batDau: '2026-10-06', han: '2026-10-12', tong: 96, daGap: 81, con: 15, quota: 6, gapHomNay: 2, quaHan: true, canBoSung: 0, to: ['DH-B7-TN'], ...(coTang ? { tang: 3 } : {}) }
const GOI7 = {
  bat: true, ngay: '2026-10-13', toiThieu: 24, daLamHomNay: 15, tuLamCon: 9, tiepCanCon: 0, thieuPhu: 0, thieuNgay: 0, canHoTro: false, kienThucCu: { tong: 0, dat: 0, tyLe: null }, diemDaDo: [],
  ...(coTang ? { tang: 2 } : {}), goi: motBai ? [amine] : [amine, ester],
}

createRoot(document.getElementById('root')!).render(h(HocTapHomNay, {
  token: 'tk-gia', ten: 'Nguyễn Minh Anh', lop: '12A1', dangTai: false, loi: '', coCa: false,
  ketQua: docSanh({ ok: true, cheDo2: true, ngay: '2026-10-13', goi7: GOI7, theLuc: { con: 9, tong: 24 }, chienDich: null, doan: { con: 0 }, dao: { con: 9 } }),
  onHoc: noop, onXemLai: noop, onChua: noop, onThi: noop, onTuLuyen: noop, onLuyenLai: noop, onLichSu: noop, onBaiTap: noop, onGiaDinh: noop, onTaiLai: noop, onDangXuat: noop,
}))
