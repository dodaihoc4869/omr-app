// TRANG CHỤP ẢNH ĐỢT 20 — thẻ + màn Kiểm tra ôn tập THẬT (TheKiemTraCaNhan, ManKiemTraCaNhan, HocTapHomNay), máy chủ GIẢ ngay trong trang
// (thay `fetch`; không yêu cầu nào tới máy chủ thật; tên em là tên giả). ?khung=hom-nay|bang|man-tong-quan|man-lam|man-ket  ·  &tt=<trạng thái thẻ>
import { createElement as h, type ReactNode } from 'react'
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
import '../../src/styles/thang.css'
import '../../src/index.css'
import '../../src/components/m3'
import TheKiemTraCaNhan from '../../src/components/hoc-tap/TheKiemTraCaNhan'
import ManKiemTraCaNhan from '../../src/components/hoc-tap/ManKiemTraCaNhan'
import HocTapHomNay from '../../src/components/hoc-tap/HocTapHomNay'
import { docSanh } from '../../src/components/hoa2/api'
import type { TomTatKiemTra } from '../../src/lib/kiem-tra-ca-nhan'

const ts = new URLSearchParams(location.search)
const khung = ts.get('khung') ?? 'bang', tt = ts.get('tt') ?? 'can_lam', gap = ts.get('gap') === '1'
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
const kiemMan = khung === 'man-ket' ? THE.da_nop! : kt({ daTra: 8 })
const hanChay = NGAY_KT + (gap ? 48_000 : 462_000)
const CHANG = [{ stt: 0, soCau: 6, giay: 780, han: NGAY_KT - 1_200_000, daChot: true, daTra: 6 }, { stt: 1, soCau: 6, giay: 780, han: hanChay, daChot: false, daTra: 2 }, { stt: 2, soCau: 6, giay: 840, han: null, daChot: false, daTra: 0 }]
const json = (o: unknown) => Promise.resolve(new Response(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json' } }))
window.fetch = ((url: RequestInfo | URL) => {
  const u = String(url)
  if (u.includes('/game-v2/hoc-tap-ktcn-trang-thai')) return json({ ok: true, kiemTra: kiemMan, chang: CHANG })
  if (u.includes('/game-v2/hoc-tap-ktcn-start')) return json({ ok: true, kiemTra: kiemMan, revision: 3, hanChang: hanChay, daChot: false, questions: CAU, tra: { q1: 'A', q2: 'B', q3: 'B' } })
  if (u.includes('/game-v2/hoc-tap-ktcn-ket-qua')) return json({ ok: true, kiemTra: kiemMan, ketQua })
  if (u.includes('/game-v2/')) return json({ ok: true, kiemTra: kiemMan, revision: 4, daLuu: true })
  return json({})
}) as typeof fetch
const noop = () => {}
// App học sinh thật KHÔNG nằm dưới `.m3` (chỉ hộp thoại tự bọc) ⇒ trang chụp cũng không bọc, đúng bảng màu tokens.css.
const hopApp = (con: ReactNode) => h('div', { 'data-vai': 'hocsinh' }, con)
let noi: ReactNode
if (khung === 'bang') {
  noi = h('div', { className: 'ht-app', style: { padding: 16, display: 'grid', gap: 18, maxWidth: 560 } },
    ...(['can_lam', 'cho_nguon', 'sap_den', 'da_nop', 'het_han'] as const).map((k) => h('div', { key: k }, h('p', { style: { margin: '0 0 8px', fontSize: 13, color: 'var(--nhat)' } }, k), h(TheKiemTraCaNhan, { du: THE[k]!, onMo: noop }))))
} else if (khung === 'hom-nay') {
  const du = THE[tt]!
  const sanh = docSanh({ cheDo2: true, ngay: du.homNay ? du.ngay : '2026-10-13', kiemTraCaNhan: du, theLuc: { tong: 12, con: 7 }, dao: { con: 7 }, doan: { con: 0 } })
  noi = h(HocTapHomNay, { ten: 'Minh Anh', lop: '12A1', ketQua: sanh, dangTai: false, loi: '', onHoc: noop, onXemLai: noop, onChua: noop, onThi: noop, onTuLuyen: noop, onLichSu: noop, onBaiTap: noop, onGiaDinh: noop, onTaiLai: noop, onDangXuat: noop, coCa: false, onKiemTra: noop } as never)
} else {
  noi = h(ManKiemTraCaNhan, { token: 'gia', sbd: 'S-gia', id: 'kt-gia', onVe: noop, onCapNhat: noop })
}
createRoot(document.getElementById('root')!).render(hopApp(noi))
