import { TEN, LOP, deMau } from './fx.mjs'
const now = Date.now()
const iso = (d) => new Date(now + d).toISOString()
const H = 3600000
const LOP2 = '12A2 Cơ bản buổi tối'
export const CA = Array.from({ length: 8 }, (_, i) => ({
  maCa: String(704000 + i), tenCa: ['Kiểm tra 45 phút chương Ester – Lipid (đề chẵn lẻ, 40 câu trắc nghiệm)', 'Ca sáng thứ Bảy', 'Bài tập về nhà: Cacbohiđrat nâng cao phần đồ thị', 'Kiểm tra định kỳ tuần 3'][i % 4], lop: i % 2 ? LOP : LOP2,
  thoiGianPhut: 45, moLuc: iso(-i * 24 * H), batDau: iso(-i * 24 * H), hetHanVao: iso(-i * 24 * H + H), trangThai: i === 0 ? 'mo' : 'dong', phamVi: 'chon', congBo: 'ngay', loai: i % 4 === 2 ? 'baitap' : 'thi', hanNop: iso(2 * 24 * H), lenBang: true, daVao: 38, daNop: 35 - i, canhBao: i % 3,
  deRieng: i === 3, phongCho: false,
}))
export const EM = Array.from({ length: 24 }, (_, i) => ({ sbd: 'HS' + (1000 + i), hoTen: TEN[i % TEN.length], namSinh: '2009', lop: i % 2 ? LOP : LOP2, trangThai: 'hoc', soCa: 12, diemGanNhat: 7.75, caGanNhat: CA[0].tenCa, nopGanNhat: iso(-2 * H), tenLop: i % 2 ? LOP : LOP2 }))
const DE = Array.from({ length: 10 }, (_, i) => ({ maDe: 'DE-HOA-12-ESTER-LIPID-' + (i + 1), nguon: 'Đề thi thử THPT Chuyên Lê Hồng Phong Nam Định lần 2 năm 2026', ngayNap: '2026-09-2' + (i % 9), soCau: 40, soNghi: i % 3, capNhatLuc: iso(-i * H), nhom: i % 2 ? 'Ester – Lipid' : 'Đề thi thử toàn quốc' }))

export function fxGv(p, body, u, method) {
  const a = body.action
  if (p === '/goi') {
    if (a === 'danhSachCa') return { ok: true, items: CA }
    if (a === 'danhSachDe') return { ok: true, items: DE }
    if (a === 'danhSachEm') return { ok: true, items: EM }
    if (a === 'hoSoEm') {
      const e = EM.find(x => x.sbd === body.sbd) || EM[0]
      const ca = CA.slice(0, 6).map((c, i) => ({ maCa: c.maCa, tenCa: c.tenCa, lop: e.lop, lanThu: 1, nopLuc: iso(-i * 24 * H), trangThai: 'da_nop', diemI: 4.25, diemII: 2.5, diemIII: 1, tong: 7.75 - i * 0.25, tongCau: 28, soCauDung: 20, soCauSai: 8, soCauDungMotPhan: 2, soCauBoTrong: 1 }))
      const cd = [['Thuỷ phân ester đơn chức trong môi trường kiềm', 30, 12], ['Danh pháp ester và đồng đẳng', 12, 1], ['Chất béo', 20, 7], ['Đốt cháy hỗn hợp ester', 8, 5]].map(([ten, soCau, soSai]) => ({ ten, soCau, soSai }))
      return { ok: true, em: e, chuyenDe: cd, ca, caGanNhat: ca[0], chuyenDeCaGanNhat: cd, soCauSaiCaGanNhat: 8 }
    }
    if (a === 'chiTietCa') {
      const ca = { ...(CA.find(c => c.maCa === body.maCa) || CA[0]), danhSachMoi: EM.map(e => e.sbd), nguoiTao: 'Thầy Đỗ Đại Học' }
      const luot = EM.slice(0, 20).map((e, i) => ({ sbd: e.sbd, hoTen: e.hoTen, lanThu: 1, trangThai: i % 4 === 0 ? 'dang_lam' : 'da_nop', vaoLuc: iso(-40 * 60000), hetGioLuc: iso(5 * 60000), nopLuc: i % 4 === 0 ? '' : iso(-5 * 60000), soLanRoiMan: i % 3, tongGiayRoiMan: (i % 3) * 14, diemI: 4.25, diemII: 2.5, diemIII: 1, tong: i % 4 === 0 ? null : 7.75, duyetBoi: '', duyetLuc: '', ghiChu: i === 2 ? 'Em xin ra ngoài 2 phút, thầy đã cho phép trong giờ làm bài' : '', dapAn: null, integrity: null, giayCau: null }))
      return { ok: true, ca, luot, keyBank: null, biChan: [], dsCho: [] }
    }
    if (a === 'lichSuLenBang') return { ok: true, items: [] }
    if (a === 'layDe') return { ok: true, de: deMau(body.maDe) }
    if (a === 'linkDanhSachLop') return { ok: true, links: ['https://docs.google.com/spreadsheets/d/e/2PACX-1vRrất-dài-danh-sách-lớp-12A1/pub?output=csv'] }
    return undefined
  }
  if (p === '/ca/danh-sach') return { ok: true, dauDongBo: { ma: 'ca_day_du' }, items: CA, soDongLuot: 300 }
  if (p === '/em/danh-sach') return { ok: true, items: EM }
  if (p === '/gv/lop') return { ok: true, lop: [{ tenLop: LOP, khoi: '12', soEm: 12, sbd: EM.filter((_, i) => i % 2).map(e => e.sbd) }, { tenLop: LOP2, khoi: '12', soEm: 12, sbd: EM.filter((_, i) => !(i % 2)).map(e => e.sbd) }] }
  if (p === '/ai/cau-hinh') return { ok: true, bat: true }
  if (p === '/ai/dem-qua') return { ok: true }
  return undefined
}
