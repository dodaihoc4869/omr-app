// TRANG CHỤP ẢNH ĐỢT 16 · LÀN C — component THẬT + máy chủ GIẢ ngay trong trang (thay `fetch`; không yêu cầu nào tới máy chủ thật, tên em là tên giả).
//   ?man=hs  — app học sinh: tấm "Hồ sơ làm bài của em" (HoSoCuaEmHs, hộp "Chưa sửa được" bấm được), số giả qua ĐÚNG hàm lọc bản học sinh.
//   ?man=gv  — app thầy: CÙNG tấm ở chế độ thầy (SBD, Mở hồ sơ đầy đủ), có độ tin cậy (trường tuỳ chọn của làn máy chủ D).
//   ?man=ph  — app phụ huynh: Hôm nay có thẻ "Nhịp học của con" (`/ph/nhip-hoc` giả); bấm ⇒ CÙNG tấm chế độ phụ huynh.
import { createElement as h, useMemo, useState } from 'react'
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
import '../../src/styles/vo-thay.css'
import '../../src/styles/gv-mau.css'
import HoSoLamCauEm from '../../src/components/chien-dich/HoSoLamCauEm'
import '../../src/components/chien-dich/gv-v2.css'
import HoSoCuaEmHs from '../../src/components/hoc-tap/HoSoCuaEmHs'
import AppPhuHuynh from '../../src/components/ph-v3/AppPhuHuynh'
import { PH_OK } from '../../tests/_ph-moi/du-lieu-mau'
import { conTongQuanGia } from '../chup-v2/gia/ph-con-tong-quan'
import { hoSoEmGia, lichSuEmGia } from '../chup-v2/gia/ho-so-em-hs'
import { hoSoThaiDoGia } from '../chup-v2/gia/bai-hang-ngay'
import { lichSuGia } from '../chup-v2/gia/lich-su-lam-cau'
import { NHIP_EM_LUOI } from '../chup-v2/gia/nhip-hoc-em'
import type { KetQuaHoSoThaiDo } from '../../server/src/bai-hang-ngay-kieu'

const thamSo = new URLSearchParams(location.search)
const man = thamSo.get('man') ?? 'hs'

/** Thêm các trường TUỲ CHỌN đợt 16 (độ tin cậy) vào một hồ sơ giả. */
function themTinCay(td: KetQuaHoSoThaiDo, tin: number): KetQuaHoSoThaiDo {
  return {
    ...td,
    ketLuan: { ...td.ketLuan, doTinCay: tin, canThem: tin < 90 ? 'Cần thêm 4 ngày làm bài và ít nhất 20 lượt đo được số giây để kết luận chắc.' : undefined },
    tinHieu: td.tinHieu.map((t, i) => ({ ...t, doTinCay: [96, 72, 91, 88, 93, 64][i] ?? 90 })),
    cachTinhTinCay: 'Độ tin cậy tăng theo số ngày đã tính và số lượt đo được giây; dưới 90% thì kết luận chỉ là tạm, app tiếp tục theo dõi.',
    tuSuaSai: 5,
  } as KetQuaHoSoThaiDo
}

const TD_EM = themTinCay(hoSoEmGia('luoi'), 84)
const LS_EM = lichSuEmGia('luoi')
const SBD_GV = '12010'
const TD_GV = themTinCay({ ...hoSoThaiDoGia(SBD_GV), nhomNhip: 'chua-deu', coDoiPho: false, chuoiDuGanNhat: 3 }, 93)
const LS_GV = lichSuGia(SBD_GV, TD_GV.em.hoTen)
const NHIP_CON = { ...NHIP_EM_LUOI, doTinCay: 88, canThem: 'Cần thêm 2 ngày em làm bài để chắc nhóm.' }

const tra = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } })
window.fetch = async (input: RequestInfo | URL) => {
  const u = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, location.href)
  const d = u.pathname
  if (d.endsWith('cau-hinh.json')) return tra({ mayChuMoi: 'https://may-chu-gia.example.com' })
  if (d.endsWith('/hs/ho-so-thai-do') || d.endsWith('/ph/ho-so-thai-do')) return tra(TD_EM)
  if (d.endsWith('/hs/lich-su-lam-cau') || d.endsWith('/ph/lich-su-lam-cau')) return tra(LS_EM)
  if (d.endsWith('/ph/nhip-hoc')) return tra(NHIP_CON)
  if (d.endsWith('/ph/con-tong-quan')) return tra(conTongQuanGia())
  if (d.endsWith('/ph/tat-ca-ve-con')) return tra(PH_OK)
  if (d.endsWith('/ph/hoc-2')) return tra({ ok: true, cheDo2: true, ngay: '2026-10-09', homNay: { tong: 30, daLam: 12 } })
  if (d.endsWith('/ph/loi-thay')) return tra({ ok: true, nhanXet: [] })
  return tra({ ok: true })
}

const noop = () => {}
function ManGv() {
  const nguon = useMemo(() => ({ hoSoThaiDo: async () => ({ ok: true as const, du: TD_GV }), lichSu: async () => ({ ok: true as const, du: LS_GV }) }), [])
  return h('div', { className: 'min-h-screen m3 m3-thay vo-thay' }, h(HoSoLamCauEm, { em: { sbd: SBD_GV, ten: TD_GV.em.hoTen, khoi: '12', lop: TD_GV.em.lop }, nguon, onDong: noop }))
}
function ManHs() {
  const [mo, setMo] = useState(true)
  return mo ? h(HoSoCuaEmHs, { token: 'tk', tenEm: TD_EM.em.hoTen, lop: '12A1', onDong: () => setMo(false), onChuaCau: noop }) : h('p', null, 'Đã đóng')
}

createRoot(document.getElementById('root')!).render(
  man === 'gv' ? h(ManGv) : man === 'ph' ? h(AppPhuHuynh, { sbd: '12121212', hoTen: 'Nguyễn Minh Anh', lop: '12A1', onDoiSbd: noop }) : (document.body.setAttribute('data-bat-linh', 'hs'), h(ManHs)),
)
