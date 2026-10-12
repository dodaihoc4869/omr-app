// TRANG CHỤP ẢNH ĐỢT 18 · LÀN I (thầy 13/10: "Tối ưu lại câu từ … Bỏ hết các gợi ý hướng dẫn") — component THẬT + máy chủ GIẢ ngay trong trang
// (thay `fetch`; không yêu cầu nào tới máy chủ thật, tên em là tên giả).
//   ?man=ph       — app phụ huynh (Hôm nay; thêm `#tien-bo` để mở Tiến bộ).
//   ?man=hs-btvn  — app học sinh: tấm "Bài tập về nhà" (BtvnM3) trong vỏ sheet M3, hai bài giả.
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
import AppPhuHuynh from '../../src/components/ph-v3/AppPhuHuynh'
import BtvnM3, { type MucBtvn } from '../../src/components/bang-nhiem-vu/BtvnM3'
import { gioDayDu } from '../../src/lib/ngay-gio-24'
import { PH_OK } from '../../tests/_ph-moi/du-lieu-mau'
import { conTongQuanGia } from '../chup-v2/gia/ph-con-tong-quan'
import { NHIP_EM_LUOI } from '../chup-v2/gia/nhip-hoc-em'

const man = new URLSearchParams(location.search).get('man') ?? 'ph'
const noop = () => {}
const NOW = Date.parse('2026-10-16T13:30:00Z') // 20:30 Thứ Sáu 16/10 giờ VN

const tra = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } })
window.fetch = async (input: RequestInfo | URL) => {
  const u = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, location.href)
  const d = u.pathname
  if (d.endsWith('cau-hinh.json')) return tra({ mayChuMoi: 'https://may-chu-gia.example.com' })
  if (d.endsWith('/ph/con-tong-quan')) return tra(conTongQuanGia())
  if (d.endsWith('/ph/nhip-hoc')) return tra(NHIP_EM_LUOI)
  if (d.endsWith('/ph/tat-ca-ve-con')) return tra(PH_OK)
  if (d.endsWith('/ph/hoc-2')) return tra({ ok: true, cheDo2: true, ngay: '2026-10-16', homNay: { tong: 30, daLam: 12 } })
  if (d.endsWith('/ph/loi-thay'))
    return tra({ ok: true, nhanXet: [{ maCa: 'CA-0919', tenCa: 'Kiểm tra 45 phút · Ester – Lipid', noiDung: 'Bài 19/09 con sai 3/5 câu thuỷ phân ester. Tuần này con làm lại 10 câu dạng này; Thứ Bảy thầy kiểm tra lại.', nopLuc: '2026-09-19T10:00:00Z', capNhatLuc: '2026-09-20T03:00:00Z' }] })
  return tra({ ok: true })
}

const ngay = (gioSau: number) => new Date(NOW + gioSau * 3_600_000).toISOString()
const BTVN: MucBtvn[] = [
  { maBtvn: 'BT-ESTER', maCa: '482913', tenBtvn: 'Bài tập về nhà · Ester – Lipid', soCau: 24, hanNop: ngay(30), daNop: false, soLanLamLaiConLai: 3 },
  { maBtvn: 'BT-AMINE', maCa: '391827', tenBtvn: 'Bài tập về nhà · Amine', soCau: 20, hanNop: ngay(-48), daNop: true, nopLuc: ngay(-50), diem: 8.25, soDung: 17, soLanLamLaiConLai: 2 },
]

function ManHsBtvn() {
  return h('div', { className: 'm3 m3-sheet', style: { minHeight: '100vh' } }, h('main', { style: { maxWidth: 1152, margin: '0 auto', padding: '16px 12px' } },
    h(BtvnM3, { dangTai: false, ds: BTVN, now: NOW, dangMoId: null, ngayGio: (iso: string) => gioDayDu(iso, ''), onMo: noop, onTaiLai: noop })))
}

createRoot(document.getElementById('root')!).render(
  man === 'hs-btvn' ? h(ManHsBtvn) : h('div', { className: 'm3' }, h(AppPhuHuynh, { sbd: '12121212', hoTen: 'Nguyễn Minh Anh', lop: '12A1', onDoiSbd: noop })),
)
