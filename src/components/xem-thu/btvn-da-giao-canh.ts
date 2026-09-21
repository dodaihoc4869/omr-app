// DỮ LIỆU GIẢ cho trang xem thử "Bài tập về nhà đã giao" (Code 1, 21/09/2026) — năm cảnh của đề §6.1. CHỈ dùng ở trang xem thử và test; không vào gói sản phẩm.
import type { DongTheoDoiBtvn } from '../../lib/btvn-may-chu-moi'
import thatJson from './mau-btvn-theo-doi-that-2109.json' // THÂN THẬT của /btvn/theo-doi bản sống (Worker bae74f10, 21/09 19:3x), đã che họ tên em (Code 3)

/** Thứ Hai 21/09/2026 19:00 giờ VN — mọi mốc trong cảnh tính quanh giờ này để ảnh chụp ổn định. */
export const NOW_MAU = Date.parse('2026-09-21T19:00:00+07:00')
const vn = (s: string) => new Date(Date.parse(`${s}:00+07:00`)).toISOString()

export const CAC_CANH = ['binh-thuong', 'cham', 'khong-chang', 'qua-han', 'may-cu', 'that', 'may-cu-that'] as const
export type TenCanh = (typeof CAC_CANH)[number]
export const CHU_CANH: Record<TenCanh, string> = {
  'binh-thuong': 'Bình thường',
  cham: 'Nhiều em chậm nhịp',
  'khong-chang': 'Bài không chia chặng',
  'qua-han': 'Bài qua hạn có nộp trễ',
  'may-cu': 'Máy chủ cũ (thiếu khoá mới)',
  that: 'Dữ liệu THẬT bản sống (đã che tên)',
  'may-cu-that': 'Dữ liệu thật, bỏ khoá bản 2 (máy cũ thật)',
}

const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ']
const DEM = ['Văn', 'Thị', 'Minh', 'Quốc', 'Ngọc', 'Thu', 'Đức', 'Hoài', 'Thanh', 'Anh', 'Gia', 'Khánh']
const TEN = ['An', 'Bình', 'Chi', 'Dũng', 'Giang', 'Hà', 'Hiếu', 'Huy', 'Khoa', 'Lan', 'Linh', 'Mai', 'Nam', 'Phúc', 'Quân', 'Sơn', 'Thảo', 'Trang', 'Tú', 'Vy']

type NhomEm = 'chua_mo' | 'dung_nhip' | 'cham_nhip' | 'xong_hom_nay' | 'da_nop'
type Em = NonNullable<DongTheoDoiBtvn['hocSinh']>[number]

/** Sinh danh sách em theo số lượng từng nhóm (thứ tự ổn định). `khongNhom` = máy cũ (không trường mới). */
function taoEm(tienTo: string, dem: Partial<Record<NhomEm, number>>, o: { soChang?: number; soCauEm?: number; nopTreGio?: number[]; khongNhom?: boolean } = {}): Em[] {
  const ra: Em[] = []
  let k = 0
  const soCauEm = o.soCauEm ?? 32
  for (const nhom of ['chua_mo', 'dung_nhip', 'cham_nhip', 'xong_hom_nay', 'da_nop'] as NhomEm[]) {
    for (let i = 0; i < (dem[nhom] ?? 0); i++, k++) {
      const hoTen = `${HO[(k * 7) % HO.length]} ${DEM[(k * 5 + 3) % DEM.length]} ${TEN[(k * 3) % TEN.length]}`
      const chang = nhom === 'chua_mo' ? null : nhom === 'da_nop' ? (o.soChang ?? null) : 1 + (k % Math.max(1, o.soChang ?? 1))
      const soCauDaLam = nhom === 'chua_mo' ? 0 : nhom === 'da_nop' ? soCauEm : Math.min(soCauEm - 1, 4 + ((k * 3) % (soCauEm - 5)))
      const hocGanNhat = nhom === 'chua_mo' ? null : vn(nhom === 'cham_nhip' ? `2026-09-${String(18 + (k % 3)).padStart(2, '0')}T${String(19 + (k % 3)).padStart(2, '0')}:41` : `2026-09-21T${String(9 + (k % 10)).padStart(2, '0')}:${String(10 + ((k * 7) % 50)).padStart(2, '0')}`)
      const nopLuc = nhom === 'da_nop' ? vn('2026-09-21T18:20') : null
      const nopTreGio = nhom === 'da_nop' ? o.nopTreGio?.[i] : undefined
      ra.push({
        sbd: `${tienTo}${String(k + 1).padStart(3, '0')}`, hoTen, nopLuc, soDung: nhom === 'da_nop' ? soCauEm - 3 : null, soCau: nhom === 'da_nop' ? soCauEm : null, thuHoi: false,
        ...(o.khongNhom ? {} : { nhom, changHienTai: chang, soCauDaLam, soCauCuaEm: soCauEm, hocGanNhat, ...(nopTreGio ? { nopTreGio } : {}) }),
      })
    }
  }
  return ra
}

const dem = (hs: Em[]) => hs.length
function dong(id: string, o: Partial<DongTheoDoiBtvn> & { hs: Em[] }): DongTheoDoiBtvn {
  const { hs, ...r } = o
  return {
    maBtvn: id, maCa: `Ca ${id}`, maDe: `Dạy học / Lớp 10 / Ch.2 / Bài 5 / Riêng-muapgf2t · 10`, soCau: 113, giaoLuc: vn('2026-09-21T10:48'), hanNop: vn('2026-09-24T12:00'), quaHan: false,
    tong: dem(hs), daNop: hs.filter((e) => e.nopLuc).length, hocSinh: hs, chuaNop: hs.filter((e) => !e.nopLuc).map((e) => ({ sbd: e.sbd, hoTen: e.hoTen })), ...r,
  }
}
const chang = (soChang: number, homNay: number) => Array.from({ length: soChang }, (_, i) => ({ so: i + 1, ngay: new Date(Date.parse('2026-09-21T00:00:00Z') + (i - (homNay - 1)) * 86_400_000 + (homNay - 1) * 86_400_000).toISOString().slice(0, 10), laHomNay: i + 1 === homNay }))
const nhomTu = (hs: Em[], nopTre = 0) => ({ chuaMo: hs.filter((e) => e.nhom === 'chua_mo').length, dungNhip: hs.filter((e) => e.nhom === 'dung_nhip').length, chamNhip: hs.filter((e) => e.nhom === 'cham_nhip').length, xongHomNay: hs.filter((e) => e.nhom === 'xong_hom_nay').length, daNop: hs.filter((e) => e.nhom === 'da_nop').length, nopTre })

/** Giờ "bây giờ" của cảnh: cảnh giả cố định; cảnh THẬT theo `serverNow` của thân mẫu. */
export const nowCua = (ten: TenCanh): number => (ten === 'that' || ten === 'may-cu-that' ? Number((thatJson as unknown as { serverNow?: number }).serverNow) || NOW_MAU : NOW_MAU)

/** Bỏ mọi khoá BẢN 2 khỏi thân thật ⇒ đúng dáng máy chủ cũ (trước 19:07): không ten / tenLop / soCauLoi / chang / nhom, em không nhom / changHienTai / soCauDaLam / hocGanNhat / nopTreGio. */
function boKhoaBan2(ds: DongTheoDoiBtvn[]): DongTheoDoiBtvn[] {
  return ds.map((b) => {
    const { ten: _t, tenLop: _l, soCauLoi: _c, chang: _g, nhom: _n, ...r } = b
    void _t; void _l; void _c; void _g; void _n
    return { ...r, hocSinh: b.hocSinh?.map((e) => { const { nhom: _a, changHienTai: _b, soCauDaLam: _d, hocGanNhat: _e, nopTreGio: _f, ...x } = e; void _a; void _b; void _d; void _e; void _f; return x }) }
  })
}

export function canh(ten: TenCanh): DongTheoDoiBtvn[] {
  if (ten === 'that') return (thatJson as unknown as { ds: DongTheoDoiBtvn[] }).ds
  if (ten === 'may-cu-that') return boKhoaBan2((thatJson as unknown as { ds: DongTheoDoiBtvn[] }).ds)
  if (ten === 'binh-thuong' || ten === 'cham') {
    const cham = ten === 'cham'
    const a = taoEm('A', cham ? { chua_mo: 10, dung_nhip: 6, cham_nhip: 24, xong_hom_nay: 4 } : { chua_mo: 8, dung_nhip: 22, cham_nhip: 6, xong_hom_nay: 8 }, { soChang: 3 })
    const b = taoEm('B', cham ? { chua_mo: 9, dung_nhip: 30, cham_nhip: 20, xong_hom_nay: 8 } : { chua_mo: 16, dung_nhip: 39, cham_nhip: 4, xong_hom_nay: 8 }, { soChang: 4 })
    const c = taoEm('C', cham ? { chua_mo: 5, dung_nhip: 20, cham_nhip: 21, xong_hom_nay: 6 } : { chua_mo: 7, dung_nhip: 37, cham_nhip: 2, xong_hom_nay: 6 }, { soChang: 5 })
    return [
      dong('B-LOP10', { hs: a, ten: 'Lớp 10 · Chương 2 · Bài 5', tenLop: 'Lớp 10', soCauLoi: 29, caNhan: true, soLoi: 29, chang: chang(3, 1), nhom: nhomTu(a), hanNop: cham ? vn('2026-09-22T00:30') : vn('2026-09-24T12:00') }),
      dong('B-LOP12', { hs: b, ten: 'Lớp 12 · Chương 2 · Bài 4', tenLop: 'Lớp 12', soCauLoi: 31, caNhan: true, soLoi: 31, soCau: 120, chang: chang(4, 1), nhom: nhomTu(b), giaoLuc: vn('2026-09-21T10:49'), hanNop: vn('2026-09-25T12:00'), maDe: 'Dạy học / Lớp 12 / Ch.2 / Bài 4' }),
      dong('B-LOP11', { hs: c, ten: 'Lớp 11 · Chương 1 · Bài 3', tenLop: 'Lớp 11', soCauLoi: 27, caNhan: true, soLoi: 27, soCau: 96, chang: chang(5, 1), nhom: nhomTu(c), giaoLuc: vn('2026-09-21T10:50'), hanNop: vn('2026-09-26T12:00'), maDe: 'Dạy học / Lớp 11 / Ch.1 / Bài 3' }),
    ]
  }
  if (ten === 'khong-chang') {
    const a = taoEm('K', { chua_mo: 12, dung_nhip: 20, da_nop: 9 }, { soCauEm: 20 })
    return [dong('B-KHONG-CHANG', { hs: a, ten: 'Lớp 11 · Ôn tập Chương 1', tenLop: 'Lớp 11', soCau: 20, soCauLoi: null, chang: [], nhom: nhomTu(a), hanNop: vn('2026-09-23T21:00'), maDe: 'Ôn tập / Lớp 11 / Chương 1' })]
  }
  if (ten === 'qua-han') {
    const a = taoEm('Q', { chua_mo: 3, dung_nhip: 0, cham_nhip: 4, da_nop: 38 }, { soChang: 3, nopTreGio: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 11, 13, 20, 26, 30] })
    const b = taoEm('R', { dung_nhip: 14, cham_nhip: 2, xong_hom_nay: 4 }, { soChang: 3 })
    return [
      dong('B-QUA-HAN', { hs: a, ten: 'Lớp 10 · Chương 1 · Bài 2', tenLop: 'Lớp 10', soCauLoi: 24, caNhan: true, soLoi: 24, chang: chang(3, 3), nhom: nhomTu(a, 6), quaHan: true, hanNop: vn('2026-09-21T12:00'), giaoLuc: vn('2026-09-18T09:15') }),
      dong('B-CON-HAN', { hs: b, ten: 'Lớp 12 · Chương 3 · Bài 1', tenLop: 'Lớp 12', soCauLoi: 30, caNhan: true, soLoi: 30, chang: chang(3, 1), nhom: nhomTu(b), hanNop: vn('2026-09-24T12:00') }),
    ]
  }
  // máy cũ: không `ten`, `tenLop`, `chang`, `nhom` và không trường mới ở từng em
  const a = taoEm('M', { chua_mo: 5, dung_nhip: 20, da_nop: 6 }, { khongNhom: true })
  const b = taoEm('N', { dung_nhip: 12, da_nop: 20 }, { khongNhom: true })
  return [
    dong('Riêng-muapgf2t', { hs: a, maCa: 'Riêng', hanNop: vn('2026-09-24T12:00') }),
    dong('CA-2109-B', { hs: b, maCa: '2109', maDe: 'Dạy học / Lớp 12 / Ch.2 / Bài 4', soCau: 60, hanNop: vn('2026-09-25T12:00'), giaoLuc: vn('2026-09-21T10:49') }),
  ]
}
