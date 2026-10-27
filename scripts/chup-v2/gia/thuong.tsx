// ═══ THƯỞNG PHẠT 26/10 — CẢNH CHỤP giao diện học sinh (component THẬT src/components/thuong/*, máy chủ GIẢ = tests/_thuong-mau.ts, đúng tên trường hợp đồng).
// `?man=tp&v=<cảnh>` (trang.tsx gọi `capFetchThuong()` rồi vẽ `canhThuong()`):
//   tren (tp-4 thanh trên + thẻ bên) · cau-dung / cau-day / cau-kho (tp-1) · khong-tinh (tp-2) · ket / ket-hh (tp-3) · chuoi (tp-5) · cuu / cuu-xong (tp-6) · giai (tp-7)
//   cuoi-len / cuoi-giu / cuoi-roi (tp-8) · nv / nv-mo (tp-9) · cua-hang (tp-10) · thang-hoa (tp-11) · kc-moi / kc-lam / kc-truot / kc-dat (tp-12) · huy-hieu (tp-13)
//   ban (tp-16) · moi-ban / loi-moi / moc-doi (tp-17) · binh / phep (tp-18) · moc-chuoi · cuoc-thua · tat (mọi công tắc tắt: Lộ trình chỉ còn 3 bộ đếm)
import { createElement as h, Fragment, type ReactNode } from 'react'
import { X } from 'lucide-react'
import * as M from '../../../tests/_thuong-mau'
import { ThanhThuong } from '../../../src/components/thuong/ThanhThuong'
import { BangCombo, CHU_KHONG_TINH, OngNghiem, TamThuong } from '../../../src/components/thuong/TamThuong'
import KetBaiThuong from '../../../src/components/thuong/KetBaiThuong'
import ManThuong, { BaoGoCua, ManBinhDaDo, ManCuocKetQua, ManCuoiTuan, ManCuuChuoi, ManKimCuong, ManLoiMoi, ManMocChuoi, ManMocDoi, ManMoiBan, ManThangHoa, TheBenThuong } from '../../../src/components/thuong/ManThuong'
import { IcNguyenTu } from '../../../src/components/thuong/hinh'
import { Bi } from '../../../src/components/linh-vat/Bi'
import { docKetBai, docThuongCau, docTongQuan, type ThongBao, type TongQuanThuong } from '../../../src/lib/thuong-api'

const ts = new URLSearchParams(location.search)
export const V = ts.get('v') ?? 'tren'
const TK = 'tk-chup'
const noop = () => {}
const tqGoc = (): Record<string, unknown> => {
  // 27/10 (cảnh mtc-*): mục tiêu ngày đo bằng CÂU — `&mt=du` đủ mức 93/92 · `&mt=chua` 40/92
  if (ts.get('mt') === 'du') return M.tongQuanGia({ mucTieu: { daXong: 8, can: 16, cau: 92, cauDaLam: 93, dat: true } })
  if (ts.get('mt') === 'chua') return M.tongQuanGia({ mucTieu: { daXong: 8, can: 16, cau: 92, cauDaLam: 40, dat: false } })
  if (V === 'tat') return M.tongQuanGia({ bat: { giai: false, thangHoa: false, banBe: false, kimCuong: false } })
  if (V === 'nv-mo') return M.tongQuanGia({ nhiemVu: M.NHIEM_VU_XONG, mucTieu: { daXong: 4, can: 4 }, tinhThe: 285, ruong: { mo: true, thuong: 15 } })
  if (V === 'chuoi') return M.tongQuanGia({ cuoc: null, mucTieu: { daXong: 1, can: 4 } })
  if (V === 'cuu' || V === 'cuu-xong') return M.tongQuanGia({ chuoiNgay: M.CUU(V === 'cuu' ? 0 : 2) })
  if (V === 'binh') return M.tongQuanGia({ chuoiNgay: { so: 12, giuChuoi: 0, sucChua: 2, lich7: M.lich7(['hoc', 'hoc', 'hoc', 'hoc', 'hoc', 'binh', 'tat']) } })
  if (V === 'phep') return M.tongQuanGia({ chuoiNgay: { so: 12, giuChuoi: 1, sucChua: 2, lich7: M.lich7(['hoc', 'hoc', 'hoc', 'hoc', 'hoc', 'phep', 'tat']) } })
  // gộp 26/10: máy chủ /hs/thuong gửi thêm lịch 30 ngày + chuỗi dài nhất (B3, `thang`) ⇒ màn Chuỗi ngày hiện lịch tháng như bản vẽ tp-5
  const K30 = Array.from({ length: 30 }, (_, i) => (i < 4 || i === 11 ? 'tat' : i === 8 || i === 27 ? 'binh' : i === 25 ? 'phep' : 'hoc')) as Parameters<typeof M.lich7>[0]
  const goc = M.tongQuanGia() as { chuoiNgay: Record<string, unknown> }
  // Luật bình 27/10 (cảnh binh-*): `&binh=da` ⇒ tuần này em đã mua bình (nút xám + lý do).
  const binh = { gia: 150, toiDaTuan: 1, daMuaTuan: ts.get('binh') === 'da', muaTiepTu: '2026-11-02' }
  return { ...goc, binh, chuoiNgay: { ...goc.chuoiNgay, lich30: M.lich7(K30), daiNhat: 21 } }
}
/** Máy chủ giả cho các lệnh thưởng phạt — đặt SAU máy giả chung của trang.tsx (lớp ngoài cùng). */
export function capFetchThuong(): void {
  // tờ «Trong» của Lộ trình + màn làm chặng — CHỈ cảnh này (không đổi ảnh các cảnh khác)
  void import('../../../src/styles/trong-hs.css'); void import('../../../src/styles/trong-lam-bai.css')
  const goc = window.fetch
  const BANG: Record<string, () => unknown> = {
    '/hs/thuong': tqGoc, '/hs/giai': () => M.GIAI_GIA, '/hs/huy-hieu': () => M.HUY_HIEU_GIA,
    // 27/10 (cảnh ton-*): `&ban=0` ⇒ chưa có bạn học cùng; `&kc=0` ⇒ chưa vững chuyên đề nào
    '/hs/ban': () => (ts.get('ban') === '0' ? { ...M.BAN_GIA, ban: [] } : ts.get('ten') === 'dai' ? { ...M.BAN_GIA, ban: [...M.BAN_GIA.ban, { ma: 'b3', ten: 'Tôn Nữ Hoàng Phương Uyên Khánh Linh', lop: '11', chuoiDoi: 1, homNay: 'ban_chua', daGoCua: false }] } : M.BAN_GIA),
    '/hs/ban/tim': () => (ts.get('ten') === 'tim' ? { ok: true, bat: true, ketQua: [{ ma: 't1', ten: 'Lê Minh Đức', lop: '11', trangThai: null }, { ma: 't2', ten: 'Nguyễn Thị Minh Khai', lop: '12A1', trangThai: 'da_moi' }, { ma: 't3', ten: 'Tôn Nữ Hoàng Phương Uyên Khánh Linh', lop: '11', trangThai: null }] } : M.TIM_GIA),
    '/hs/kim-cuong/ds': () => (ts.get('kc') === '0' ? { ok: true, bat: true, ds: [] } : M.DS_KC_GIA),
    '/hs/kim-cuong/bat-dau': () => M.PHIEN_KC, '/hs/thuong/mo-ruong': () => ({ ok: true }), '/hs/thuong/mua-binh': () => ({ ok: true }), '/hs/thuong/cuoc': () => ({ ok: true }),
    '/hs/thuong/da-xem': () => ({ ok: true }), '/hs/ban/go-cua': () => ({ ok: true }), '/hs/ban/moi': () => ({ ok: true }),
  }
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const f = BANG[new URL(url, location.href).pathname]
    return f ? new Response(JSON.stringify(f()), { status: 200, headers: { 'content-type': 'application/json' } }) : goc(input, init)
  }
  try { localStorage.removeItem('ddh.thuong.v1'); localStorage.removeItem('ddh.thuong.da-xem'); localStorage.removeItem('ddh.thuong.cuu-da-xem') } catch { /* bỏ qua */ }
  // FLIP giải tuần: lần trước em đứng hạng 6 (351 nguyên tử) ⇒ hàng của em trượt lên hạng 4
  if (V === 'giai') try { localStorage.setItem('ddh.thuong.hang-giai', JSON.stringify({ thuHang: 6, nguyenTu: 351 })) } catch { /* bỏ qua */ }
  // lửa đôi bùng: hôm qua Minh Châu 8
  if (V === 'ban') try { localStorage.setItem('ddh.thuong.lua-doi', JSON.stringify({ b1: 8, b2: 3 })) } catch { /* bỏ qua */ }
}
const tq = (): TongQuanThuong => docTongQuan(tqGoc())!
const tb = (x: object) => x as ThongBao
const KHUNG = '.tp-chup-mot.dm-khung{grid-template-columns:minmax(0,1fr)!important;max-width:none;padding-right:16px}.tp-chup-mot .da-tren{margin-right:-16px;padding-right:16px}'

/** Khung Lộ trình / màn menu: thanh trên THẬT (ThanhThuong) + nội dung. */
function khungMenu(noiDung: ReactNode, ben?: ReactNode) {
  return h('div', { className: `dm-khung${ben ? '' : ' tp-chup-mot'}` }, h('style', null, KHUNG),
    h('header', { className: 'da-tren', 'aria-label': 'Số của em' }, h(ThanhThuong, { token: TK, onMo: noop, onHoc: noop, thongBao: false })),
    h('main', { className: ben ? 'da-vo' : '', style: ben ? undefined : { padding: '0 0 24px' } }, noiDung), ben ? h('aside', { className: 'dm-ben', 'aria-label': 'Tóm tắt' }, ben) : null)
}
/** Khung màn làm chặng (giả lập vị trí cắm trong ManLamBaiTap — tấm kết quả ở đáy). */
function khungCau(k: 'dung' | 'day' | 'kho' | 'khong-tinh') {
  const thuong = docThuongCau(k === 'day' ? M.THUONG_DAY : k === 'kho' ? M.THUONG_KHO : k === 'khong-tinh' ? M.THUONG_KHONG_TINH : M.THUONG_COMBO)
  const cau = k === 'day' ? 5 : k === 'kho' ? 4 : k === 'khong-tinh' ? 4 : 3, chuoi = thuong?.chuoiDung ?? 0
  const trung = k === 'khong-tinh'
  const de = k === 'day' ? ['Chất nào sau đây là amine bậc hai?', ['CH₃NH₂', '(CH₃)₂NH', '(CH₃)₃N', 'C₆H₅NH₂'], 1]
    : k === 'kho' ? ['Số đồng phân amine có công thức phân tử C₄H₁₁N tác dụng với dung dịch HNO₂ (ở nhiệt độ thường) tạo ra alcohol là', ['2', '8', '3', '4'], 3]
    : trung ? ['Cho 0,1 mol glycine tác dụng vừa đủ với dung dịch sodium hydroxide. Khối lượng muối thu được là', ['9,7 g', '7,5 g', '11,1 g', '9,4 g'], -1]
    : ['Thuỷ phân ethyl acetate trong dung dịch sodium hydroxide, đun nóng. Muối thu được là', ['sodium formate', 'sodium acetate', 'sodium propanoate', 'sodium ethoxide'], 1]
  const [deChu, pa, dung] = de as [string, string[], number]
  return h('div', { className: 'ht-app ht2-lam duo' },
    h('div', { className: 'duo-tren' }, h('button', { type: 'button', className: 'duo-dong', 'aria-label': 'Thoát, lưu bài' }, h(X, { size: 26 })),
      h(OngNghiem, { phanTram: (cau / 6) * 100, combo: chuoi >= 3, nhan: `Câu ${cau}/6 của bài` }),
      h('span', { className: 'duo-chuoi', 'data-co': '', 'aria-label': 'Nguyên tử của chặng này' }, h(IcNguyenTu), String(k === 'day' ? 59 : k === 'kho' ? 49 : trung ? 32 : 32))),
    h('main', { className: 'duo-than' },
      h(BangCombo, { chuoi: trung ? 0 : chuoi, tat: trung, truoc: 3 }),
      h('p', { className: 'duo-nhan' }, k === 'day' || k === 'kho' ? 'Câu mới · Amine' : trung ? 'Câu mới · Amino acid' : 'Câu mới · Ester – Lipid', h('span', { className: 'duo-chip' }, `Câu ${cau}/6`)),
      h('p', { style: { margin: 0, fontSize: 21, fontWeight: 600, lineHeight: 1.5 } }, deChu),
      h('div', { className: 'ht2-lam-tn', style: { display: 'grid', gridTemplateColumns: pa.every((x) => x.length < 6) ? 'repeat(2,minmax(0,1fr))' : undefined, gap: 12 } },
        pa.map((x, i) => h('div', { key: i, className: 'ht2-lam-pa', 'data-ket': i === dung ? 'dung' : 'mo', style: { display: 'flex', alignItems: 'center', gap: 14 } }, h('b', { className: 'ht2-lam-pa-ma', style: { display: 'grid', placeItems: 'center' } }, 'ABCD'[i]), x)))),
    h('div', { className: 'duo-day duo-ket', 'data-tt': trung ? 'trung' : 'dung' }, h('div', { className: 'duo-giua' },
      h('div', { className: 'duo-kq' }, h('div', { className: 'duo-kq-chu' }, h('h2', null, trung ? CHU_KHONG_TINH : 'Chính xác!'), h(TamThuong, { thuong })), h(Bi, { cam: trung ? 'nghi' : 'vui', size: 58 })),
      h('button', { type: 'button', className: 'duo-nut' }, 'Tiếp tục'))))
}

export function canhThuong(): ReactNode {
  const t = tq()
  switch (V) {
    case 'tren': case 'tat': return khungMenu(h('div', { className: 'tp-goc', style: { display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 } },
      h('div', { className: 'dm-the' }, h('h3', null, 'Lộ trình hôm nay'), h('span', { className: 'mo' }, 'Tầng Hiểu · Bài 8 · Amine — 2/6 chặng'))), h(TheBenThuong, { token: TK, onMo: noop }))
    case 'cau-dung': return khungCau('dung')
    case 'cau-day': return khungCau('day')
    case 'cau-kho': return khungCau('kho')
    case 'khong-tinh': return khungCau('khong-tinh')
    case 'ket': case 'ket-hh': return h('div', { className: 'ht-app duo', style: { minHeight: '100dvh', background: 'var(--tr-mat)' } },
      h(KetBaiThuong, { ketBai: docKetBai(V === 'ket' ? M.KET_BAI : M.KET_BAI_HH)!, hang: 'bac', bat: t.bat, phu: V === 'ket' ? 'Amine · tầng Hiểu · chặng 3 · 6 câu' : 'Amine · chặng 3', onTiep: noop }))
    case 'chuoi': return khungMenu(h(ManThuong, { man: 'chuoi', token: TK, onHoc: noop, hieuUng: 'chuoi' }))
    case 'cuu': case 'cuu-xong': return h(ManCuuChuoi, { chuoi: t.chuoiNgay!, onHoc: noop, onDong: noop })
    case 'giai': return khungMenu(h(ManThuong, { man: 'giai', token: TK }))
    case 'cuoi-len': return h(ManCuoiTuan, { tb: tb(M.TB.cuoiTuanLen), tq: t, onDong: noop })
    case 'cuoi-giu': return h(ManCuoiTuan, { tb: tb(M.TB.cuoiTuanGiu), tq: t, onDong: noop })
    case 'cuoi-roi': return h(ManCuoiTuan, { tb: tb(M.TB.cuoiTuanRoi), tq: t, onDong: noop })
    case 'nv': return khungMenu(h(ManThuong, { man: 'nhiem-vu', token: TK }))
    case 'nv-mo': return khungMenu(h(ManThuong, { man: 'nhiem-vu', token: TK, hieuUng: 'ruong' }))
    case 'cua-hang': return khungMenu(h(ManThuong, { man: 'cua-hang', token: TK, onMo: noop }))
    case 'thang-hoa': return h(ManThangHoa, { tb: tb(M.TB.thangHoa), onHoc: noop, onDong: noop })
    case 'kc-moi': return h(ManKimCuong, { token: TK, chuyenDe: 'ester', tenChuyenDe: 'Ester – Lipid', onDong: noop })
    case 'kc-lam': case 'kc-truot': case 'kc-dat': {
      const phien = { phien: 'kc1', ong: 3, cau: M.PHIEN_KC.cau.map((x) => ({ ...x, phan: 'I' as const })) }
      const b = V === 'kc-lam' ? { buoc: 'lam' as const, phien, viTri: 6, vo: 1, dung: 5 } : V === 'kc-truot' ? { buoc: 'truot' as const, phien, viTri: 7, vo: 3, dung: 5 } : { buoc: 'dat' as const, phien, viTri: 9, vo: 2, dung: 8 }
      return h(ManKimCuong, { token: TK, chuyenDe: 'ester', tenChuyenDe: 'Ester – Lipid', onDong: noop, onOnLai: noop, batDau: b })
    }
    case 'huy-hieu': return khungMenu(h(ManThuong, { man: 'huy-hieu', token: TK }))
    case 'ban': return khungMenu(h(ManThuong, { man: 'ban', token: TK, onMo: noop }))
    case 'moi-ban': return h(ManMoiBan, { token: TK, onDong: noop, q: 'Hà' })
    case 'loi-moi': return h(ManLoiMoi, { tb: tb(M.TB.moiBan), token: TK, onDong: noop })
    case 'moc-doi': return h(ManMocDoi, { tb: tb(M.TB.mocDoi), tq: t, onDong: noop })
    case 'binh': return h(ManBinhDaDo, { tb: tb(M.TB.binhDo), tq: t, token: TK, onHoc: noop, onDong: noop })
    case 'phep': return h(ManBinhDaDo, { tb: tb(M.TB.phep), tq: t, token: TK, onHoc: noop, onDong: noop })
    case 'moc-chuoi': return h(ManMocChuoi, { tb: tb(M.TB.mocChuoi), tq: t, onDong: noop })
    case 'cuoc-thua': return h(ManCuocKetQua, { tb: tb(M.TB.cuocThua), tq: t, onDong: noop })
    case 'go-cua': return h(Fragment, null, khungMenu(h('div', { className: 'dm-the' }, h('h3', null, 'Lộ trình hôm nay'))), h(BaoGoCua, { tb: tb(M.TB.goCua), onHoc: noop, onDong: noop }))
  }
  return h('p', null, 'Không có cảnh ' + V)
}
