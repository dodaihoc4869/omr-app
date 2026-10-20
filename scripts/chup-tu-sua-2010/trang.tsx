// TRANG CHỤP ẢNH "VIỆC HÔM NAY" CỦA TỰ SỬA LỖI (thầy 20/10: "sửa ít nhất 12 câu mỗi ngày, chia làm các chặng") — component THẬT + máy chủ GIẢ ngay trong trang
// (thay `fetch`; không yêu cầu nào tới máy chủ thật; tên em và số liệu là GIẢ). Tham số:
//   ?k=hom-nay | man          — màn Hôm nay (thẻ mời) hoặc màn Tự sửa lỗi
//   ?tt=moi | gan | dang | xong — trạng thái trong ngày: chưa làm · có câu chỉ còn làm bản mới · xong 7 câu (chặng 2/3) · xong cả 12 câu
// Số giả KHỚP ảnh thầy gửi: 155 câu cần sửa, 4 câu chờ lần gặp lại, 50 câu đã tự sửa (tổng 209); danh sách chỉ trả 100 dòng đầu như máy chủ thật.
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
import ManTuChua from '../../src/components/hoc-tap/ManTuChua'
import { docSanh } from '../../src/components/hoa2/api'
import { dungViecHomNay, ghiXongHomNay, luuViecHomNay } from '../../src/lib/tu-sua-viec-hom-nay'
import { taiTuSuaLoi } from '../../src/lib/tu-sua-loi'

const q = new URLSearchParams(location.search)
const k = q.get('k') ?? 'hom-nay'
const tt = q.get('tt') ?? 'moi'
const noop = () => {}
const SBD = '11010'
localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: SBD, token: 'tk-gia' }))

const DANG = ['Cân bằng phản ứng oxi hóa – khử', 'Este – lipit', 'Điện phân dung dịch', 'Amino axit – peptit', 'Ăn mòn điện hóa', 'Tính pH dung dịch', 'Kim loại tác dụng với axit', 'Đồng phân – danh pháp', 'Polime']
const PHAN = ['I', 'II', 'III'] as const
const NGUON = ['thi', 'dao', 'doan', 'bia', 'len_bang'] as const
const hom = Date.now()
const QUA = new Date(hom - 3600_000).toISOString()
const MAI = new Date(hom + 20 * 3600_000).toISOString()

// 100 dòng đầu như máy chủ thật: câu đã tới lần gặp lại 2 đứng đầu, rồi câu giao gần nhất; "gan" ⇒ có 2 câu chỉ còn làm bản mới.
type Muc = { qid: string; dotId: string; trangThai: string; denHan?: string }
const ds: Muc[] = []
const them = (n: number, trangThai: string, denHan?: string) => { for (let i = 0; i < n; i++) { const s = ds.length; ds.push({ qid: `DH-12-C${1 + (s % 4)}-B${6 + (s % 3)}-TN-I-${s + 1}`, dotId: `dot-${s + 1}`, trangThai, ...(denHan ? { denHan } : {}) }) } }
if (tt !== 'moi') them(2, 'cho_gap_lai_2', QUA)
them(3, 'dang_chua_buoc')
them(5, 'can_chan_doan')
them(100 - ds.length, 'thieu_hoc_lieu')
const dsMay = ds.map((m, i) => (m.trangThai === 'thieu_hoc_lieu' && i % 23 === 0 ? { ...m, trangThai: 'can_thay' } : m))
const CAN = tt === 'moi' ? 155 : 155
const DEM = { tong: 209, can: CAN, cho: 4, xong: 50 }

const cau = dsMay.map((m, i) => ({
  qid: m.qid, chienDichId: 'cd1', stt: i + 1, phan: PHAN[i % 3], mucDo: 'hieu', tenDang: DANG[i % DANG.length], trangThai: 'dang_on', lanCuoiDung: false, henOn: null,
  lichSu: [{ ngay: `2026-10-${String(8 + (i % 10)).padStart(2, '0')}`, dung: false, coGoiY: false, nguon: NGUON[i % NGUON.length] }],
}))
const tra = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } })
window.fetch = async (input: RequestInfo | URL) => {
  const d = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, location.href).pathname
  if (d.endsWith('cau-hinh.json')) return tra({ mayChuMoi: 'https://may-chu-gia.example.com' })
  if (d.endsWith('/hs/chua-cau-sai/co')) return tra({ ok: true })
  if (d.endsWith('/hs/chua-cau-sai/danh-sach')) return tra({ ok: true, ds: dsMay, dem: DEM, sau: { hang: 1, giaoLuc: 1, dotId: 'dot-100', nay: new Date().toISOString() } })
  if (d.endsWith('/hoa2-cau-da-lam')) return tra({ ok: true, cheDo2: true, chienDich: [{ id: 'cd1', ten: 'Hành trình', hanNop: '9999-12-31', tong: 100 }], cau })
  return tra({ ok: false, message: 'Trang chụp: không có dữ liệu.' }, 404)
}

// Dựng sẵn "ngày hôm nay" đúng trạng thái cần chụp (chọn 12 câu, ghi những câu đã xong phần) trước khi vẽ.
async function dung() {
  const kq = await taiTuSuaLoi('tk-gia', { moi: true })
  const { viec, luu } = dungViecHomNay(kq, hom, SBD)
  luuViecHomNay(luu)
  const xong = tt === 'xong' ? 12 : tt === 'dang' ? 7 : 0
  viec?.muc.slice(0, xong).forEach((x) => ghiXongHomNay(x.khoa, hom))
}

const GOI7 = {
  bat: true, ngay: '2026-10-20', toiThieu: 24, daLamHomNay: 15, tuLamCon: 9, tiepCanCon: 0, thieuPhu: 0, thieuNgay: 0, canHoTro: false, kienThucCu: { tong: 0, dat: 0, tyLe: null }, diemDaDo: [], tang: 2,
  goi: [{ id: 'g7:amine', ten: 'Bài 8. Amine', batDau: '2026-10-10', han: '2026-10-26', tong: 164, daGap: 13, con: 151, quota: 24, gapHomNay: 3, quaHan: false, canBoSung: 0, to: ['DH-B8-TN'], tang: 2 }],
}
void dung().then(() => {
  const goc = document.getElementById('root')!
  createRoot(goc).render(k === 'man'
    ? h(ManTuChua, { token: 'tk-gia', onVe: noop })
    : h(HocTapHomNay, {
      token: 'tk-gia', ten: 'Nguyễn Minh Anh', lop: '12A1', dangTai: false, loi: '', coCa: false,
      ketQua: docSanh({ ok: true, cheDo2: true, ngay: '2026-10-20', goi7: GOI7, theLuc: { con: 9, tong: 24 }, chienDich: null, doan: { con: 0 }, dao: { con: 9 } }),
      onHoc: noop, onXemLai: noop, onChua: noop, onThi: noop, onTuLuyen: noop, onLuyenLai: noop, onLichSu: noop, onBaiTap: noop, onGiaDinh: noop, onTaiLai: noop, onDangXuat: noop,
    }))
})
