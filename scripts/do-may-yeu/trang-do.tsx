// TRANG ĐO MÁY YẾU (chỉ để đo, không vào bản phát hành): dựng từng màn học sinh / phụ huynh bằng component THẬT + dữ liệu GIẢ
// (cùng dữ liệu mẫu các phép kiểm giao diện đang dùng), bật chế độ máy yếu y như main.tsx. `?man=hoc-tap|hs|ph|phbang`.
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
import HocTapHomNay from '../../src/components/hoc-tap/HocTapHomNay'
import { docSanh, type KetQuaSanh } from '../../src/components/hoa2/api'
import PH from '../../src/components/ph-moi/ManChinh'
import BangPH from '../../src/components/ph-moi/BangMoiThu'
import { docTatCaVeCon } from '../../src/lib/ph-moi/du-lieu'
import { PH_APPLE } from '../../tests/_ph-moi/du-lieu-mau-apple'

batCheDoMayYeu()
const man = new URLSearchParams(location.search).get('man') ?? 'hoc-tap'
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
  hanhTrinh: { tang: 2, toiThieu: 40, daLam: 8, daXep: 40, conThieu: 0, soChang: 5, changHienTai: 2, cauTrongChang: 8 },
}
const dsBtvn = Array.from({ length: 14 }, (_, i) => ({ maBtvn: `B${i}`, tenBtvn: `Bài tập về nhà số ${i + 1}: Ester – Lipid`, soCau: 12 + i, giaoLuc: new Date(now - (i + 1) * 3600000).toISOString(), hanNop: new Date(now + (i % 3) * 3600000 + 600000).toISOString() }))

let con: React.ReactElement
if (man === 'hoc-tap' || man === 'sanh' || man === 'hs')
  con = h(HocTapHomNay, {
    ten: 'Nguyễn Văn Thử', lop: '12A1', ketQua: docSanh(SANH) as KetQuaSanh, loi: '', dangTai: false, coCa: false,
    soBaiTap: man === 'hs' ? dsBtvn.length : 0,
    onHoc: noop, onXemLai: noop, onChua: noop, onThi: noop, onTuLuyen: noop, onLichSu: noop,
    onBaiTap: noop, onGiaDinh: noop, onDangXuat: noop, onTaiLai: noop,
  })
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
