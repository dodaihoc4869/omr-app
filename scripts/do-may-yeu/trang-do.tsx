// TRANG ĐO MÁY YẾU (chỉ để đo, không vào bản phát hành): dựng từng màn học sinh / phụ huynh bằng component THẬT + dữ liệu GIẢ
// (cùng dữ liệu mẫu các phép kiểm giao diện đang dùng), bật chế độ máy yếu y như main.tsx. `?man=sanh|hs|ph|phbang`.
// Dựng xong gắn #xong để scripts/do-may-yeu.mjs bắt đầu đo khung / commit / heap.
import { createElement as h, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '../../src/styles/tokens.css'
import '../../src/index.css'
import '../../src/styles/the-loc.css'
import '../../src/styles/may-yeu.css'
import '../../src/components/m3'
import '../../src/components/bang-nhiem-vu/sheet-m3.css'
import '../../src/components/ph-v3/ph-v3.css'
import { batCheDoMayYeu } from '../../src/lib/may-yeu'
import SanhBanDo from '../../src/components/hoa2/SanhBanDo'
import { docSanh, type KetQuaSanh } from '../../src/components/hoa2/api'
import BangNhiemVu from '../../src/components/bang-nhiem-vu/BangNhiemVu'
import { dungBangNhiemVu } from '../../src/lib/nhiem-vu-adapter'
import { tongHopKeHoachTroLy } from '../../src/lib/tro-ly-ca-nhan'
import PH from '../../src/components/ph-moi/ManChinh'
import BangPH from '../../src/components/ph-moi/BangMoiThu'
import { docTatCaVeCon } from '../../src/lib/ph-moi/du-lieu'
import { PH_APPLE } from '../../tests/_ph-moi/du-lieu-mau-apple'

batCheDoMayYeu()
const man = new URLSearchParams(location.search).get('man') ?? 'sanh'
const now = Date.now()
const noop = () => {}
const SANH = {
  ok: true,
  cheDo2: true,
  ngay: '2026-09-30',
  chienDich: { id: 'cd1', ten: 'Ester – Lipid', hanNop: '2026-10-04', D: 5, tong: 120, coXat: 67, thanhThao: 0, canDayLai: 0, thanhThaoTangTu: '2026-10-02' },
  theLuc: { con: 32, tong: 40 },
  huyetChien: false,
  doan: { con: 4 },
  dao: { con: 28 },
  khoaDao: false,
  loiKhoaDao: '',
  ruong: { daLam: 8, tong: 40, moDuoc: false, daMo: false },
}
const dsBtvn = Array.from({ length: 14 }, (_, i) => ({ maBtvn: `B${i}`, tenBtvn: `Bài tập về nhà số ${i + 1}: Ester – Lipid`, soCau: 12 + i, giaoLuc: new Date(now - (i + 1) * 3600000).toISOString(), hanNop: new Date(now + (i % 3) * 3600000 + 600000).toISOString() }))

let con: React.ReactElement
if (man === 'sanh')
  con = h(SanhBanDo, {
    ketQua: docSanh(SANH) as KetQuaSanh,
    loi: '',
    dangTai: false,
    thu: { index: 2, cap: 7, ten: 'Lửa Nhỏ' },
    exp: { homNay: 22, conThieu: 160 },
    chuoiNgay: 5,
    caDangMo: false,
    now,
    token: 'tk',
    shopBat: true,
    onVaoThi: noop,
    onPhaPhucKich: noop,
    onKhamPhaDao: noop,
    onCauDaLam: noop,
    onTuiDo: noop,
    onCuaHang: noop,
    onMoThanThu: noop,
    onChonThu: noop,
    onDangXuat: noop,
    onTaiLai: noop,
  })
else if (man === 'hs')
  con = h(
    'div',
    { className: 'm3' },
    h(BangNhiemVu, { vaiTro: 'hocsinh', hoTen: 'Nguyễn Văn Thử', now, duLieu: dungBangNhiemVu({ keHoachTroLy: tongHopKeHoachTroLy({ sbd: 'TEST', hoTen: 'Nguyễn Văn Thử', dsBtvn, dsMomGiao: [], dsLichSu: [], tongCauSai: 0, now }), now }), onHanhDong: noop, onVaoThi: noop, onMoThanThu: noop } as never),
  )
else if (man === 'ph')
  con = h(PH, { v: { trangThai: 'ok', pm: { serverNow: now, tongQuan: { soCau: 1234, soDung: 1200, phutHoc: 240, datNhiemVu: true, viecTong: 5, viecXong: 5 }, caGanNhat: null, nhipHoc: null }, thuLai: noop }, tenCon: 'Nguyễn Văn Thử', lop: '12A1', now, canhBao: [], onCanhBaoDaXem: noop, giaoThem: { trangThai: 'san_sang', conLai: 3, onGiao: noop }, onMoBang: noop, onDoiSbd: noop } as never)
else con = h(BangPH, { pm: docTatCaVeCon(PH_APPLE), sbd: 'TEST', lop: '12A1', giaoThem: { san: true, dangTai: false, conLai: 3, goiGanNhat: null, the: null, dangGui: false, giao: noop }, onVe: noop } as never)

createRoot(document.getElementById('root')!).render(h(StrictMode, null, con))
requestAnimationFrame(() =>
  setTimeout(() => {
    const x = document.createElement('i')
    x.id = 'xong'
    x.textContent = '.'
    x.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:.01'
    document.body.append(x)
  }, 0),
)
