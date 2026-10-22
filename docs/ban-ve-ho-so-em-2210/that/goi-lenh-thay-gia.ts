// THAY `goiLenh` của app thầy CHỈ TRONG TRANG CHỤP HIỆN TRẠNG (bí danh trong cấu hình vite của scripts/chup-ban-ve-ho-so-em-2210.mjs, cùng kiểu scripts/chup-v2/vite.config.mjs).
// Lệnh `/gv/em-toan-canh` trả dữ liệu GIẢ (minh hoạ, tên giả); mọi lệnh khác ⇒ "chưa có lệnh" (không ra mạng).
export * from '../../../src/lib/goi-lenh-thay'
import type { KetQuaLenh } from '../../../src/lib/goi-lenh-thay'

const gio = (ngay: number, h: number, m: number) => new Date(Date.UTC(2026, 9, ngay, h - 7, m)).toISOString()
const TOAN_CANH = {
  ok: true,
  em: {
    sbd: '11010',
    hoTen: 'Lý Quang Minh',
    lop: '12A1',
    namSinh: '2009',
    thanThu: { ten: 'Mập Địch', cap: 7 },
    chuoiNgay: 5,
    hoatDongCuoi: { luc: gio(22, 20, 41), viec: 'Bài tập về nhà' },
    phuHuynhXemCuoi: gio(21, 21, 5),
    diemCaGanNhat: { diem: 7.25, tenCa: 'Ca kiểm tra 15 phút · Điện phân', maCa: 'CA-1', luc: gio(19, 14, 0) },
    expHomNay: 46,
    expTong: 3120,
  },
  dong: [
    { luc: gio(22, 20, 41), loai: 'btvn', tieuDe: 'Bài tập về nhà · Pin điện hoá', chiTiet: { mota: 'Nộp chặng 2: đúng 5/8 câu.' }, chips: [{ chu: '5/8 đúng', muc: 'trung' }] },
    { luc: gio(22, 19, 10), loai: 'game', tieuDe: 'Bát Linh Đảo · Chuyến thám hiểm', chiTiet: 'Qua 4/6 ải.', chips: [{ chu: '+30 EXP', muc: 'tot' }] },
    { luc: gio(21, 21, 2), loai: 'on_lai', tieuDe: 'Ôn lại 3 câu', chiTiet: 'Đúng lại 2/3 câu.', chips: [{ chu: '2/3', muc: 'tot' }] },
    { luc: gio(20, 15, 30), loai: 'len_bang', tieuDe: 'Gọi lên bảng · Câu 7 Điện phân', chiTiet: 'Làm đúng trên bảng.', chips: [{ chu: 'Đúng', muc: 'tot' }] },
    { luc: gio(19, 14, 0), loai: 'ca', tieuDe: 'Ca kiểm tra 15 phút', chiTiet: { mota: 'Điểm 7,25.', maCa: 'CA-1' }, chips: [{ chu: '7,25', muc: 'trung' }] },
  ],
  conNua: '',
  dang: [
    { ma: 'pin', ten: 'Pin điện hoá', bac: 'hieu', gap: 14, sai: 5, khacPhuc: 3, xuHuong: 'tang' },
    { ma: 'dp', ten: 'Điện phân', bac: 'biet', gap: 9, sai: 4, khacPhuc: 1, xuHuong: 'giu' },
    { ma: 'am', ten: 'Ăn mòn kim loại', bac: 'van_dung', gap: 6, sai: 1, khacPhuc: 1, xuHuong: 'tang' },
  ],
  nhip30: Array.from({ length: 30 }, (_, i) => ({ ngay: new Date(Date.UTC(2026, 9, 22 - 29 + i)).toISOString().slice(0, 10), muc: [0, 1, 2, 3, 3, 2, 3][i % 7] })),
}

export async function goiLenh(duong: string): Promise<KetQuaLenh<Record<string, unknown>>> {
  if (duong === '/gv/em-toan-canh') return { ok: true, du: TOAN_CANH as unknown as Record<string, unknown> }
  return { ok: false, loai: 'chua_co_lenh', chu: 'Trang chụp: lệnh này không có dữ liệu giả.' }
}
