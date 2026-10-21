// MÁY CHỦ GIẢ cho trang chụp Hành trình (21/10) — thay `src/lib/goi-lenh-thay.ts` qua vite alias. Số liệu GIẢ, khớp bản vẽ docs/ban-ve-hanh-trinh-2110.
type Ket = { ok: true; du: Record<string, unknown> } | { ok: false; loai: 'chua_co_lenh'; chu: string }
export type KetQuaLenh<T> = { ok: true; du: T } | { ok: false; loai: 'chua_co_lenh' | 'mang' | 'cham' | 'tu_choi' | 'khong_doc_duoc'; chu: string; code?: string }
export type Thoat = { ok: false; loai: 'chua_co_lenh' | 'mang' | 'cham' | 'tu_choi' | 'khong_doc_duoc'; chu: string; code?: string }
export const CHU_HUONG_DAN_MA = 'mã trên máy này không còn đúng với máy chủ.'

const q = new URLSearchParams(location.search)
const chuaMo = q.get('chua') === '1'
const HO = ['Nguyễn Hà Vy', 'Trần Đức Anh', 'Lê Bảo Ngọc', 'Phạm Quang Huy', 'Vũ Thảo My', 'Hoàng Gia Bảo', 'Đỗ Minh Khang', 'Bùi Thu Trang', 'Ngô Đức Long', 'Phan Khánh Linh', 'Đặng Tuấn Kiệt', 'Mai Phương Thảo', 'Lý Gia Hân', 'Tạ Minh Quân', 'Hồ Ngọc Ánh', 'Cao Đức Thịnh', 'Võ Thanh Tâm', 'Đinh Hải Yến', 'Trịnh Quốc Bảo', 'Lâm Nhật Minh', 'Kiều Anh Thư', 'Dương Tiến Đạt', 'Phạm Lan', 'Đỗ Minh']
const EM = HO.map((hoTen, i) => ({ sbd: `S${i + 1}`, hoTen, tenLop: '12A1' }))
const BUOI = { id: 'BH-21', ten: 'Buổi học 21/10 · 12A1', lop: '12A1', moLuc: '2026-10-21T11:02:00Z', hetHan: '2026-10-22T11:00:00Z', dongLuc: null, dangMo: true }
const LUOT = [
  { sbd: 'S1', hoTen: 'Nguyễn Hà Vy', qid: 'Q-12', luot: 1, chuyenDe: 'Amine', trangThai: 'dat' },
  { sbd: 'S2', hoTen: 'Trần Đức Anh', qid: 'Q-5', luot: 1, chuyenDe: 'Ester', trangThai: 'dat' },
  { sbd: 'S3', hoTen: 'Lê Bảo Ngọc', qid: 'Q-7', luot: 1, chuyenDe: 'Peptide', trangThai: 'chua_dat' },
  { sbd: 'S4', hoTen: 'Phạm Quang Huy', qid: 'Q-9', luot: 1, chuyenDe: 'Carbohydrate', trangThai: 'dat' },
]
const GOI = [
  { id: 'g7:a1', ten: 'Bài 12. Amine', lop: '12A1', han: '2026-10-25', bat_dau: '2026-10-18' },
  { id: 'g7:a2', ten: 'Bài 11. Carbohydrate', lop: '12A2', han: '2026-10-24', bat_dau: '2026-10-17' },
  { id: 'g7:b1', ten: 'Bài 6. Nitrogen', lop: '11B1', han: '2026-10-27', bat_dau: '2026-10-20' },
]
const TONG_HOP = { bat: true, goi: GOI, thongKe: { 'g7:a1': { soEm: 24, pGap: 64, pTuLam: 41 }, 'g7:a2': { soEm: 22, pGap: 72, pTuLam: 55 }, 'g7:b1': { soEm: 20, pGap: 18, pTuLam: 6 } } }
const XEM = { ok: true, soCau: 38, soTuLuan: 3, hanNop: '2026-10-28', D: 7, luotCan: 210, sucChua: 343, duLuot: 20, tongEm: 24, duDiem8: null, quaTai: [], theLucNgay: 49 }
const BAI = [
  { khoaBai: 'DH-12-C1-B10', tenBai: 'Bài 10. Ester — lipid', viTri: 10, tickLuc: '2026-10-07T03:00:00Z', chienDichId: 'cd-10', trangThai: 'dang_luyen', hanNop: '2026-10-14', conNgay: 0, soEm: 24, chungChi: null },
  { khoaBai: 'DH-12-C2-B11', tenBai: 'Bài 11. Carbohydrate', viTri: 11, tickLuc: '2026-10-14T03:00:00Z', chienDichId: 'cd-11', trangThai: 'dang_luyen', hanNop: '2026-10-21', conNgay: 0, soEm: 24, chungChi: null },
  { khoaBai: 'DH-12-C3-B12', tenBai: 'Bài 12. Amine', viTri: 12, tickLuc: '2026-10-18T03:00:00Z', chienDichId: 'cd-12', trangThai: 'dang_luyen', hanNop: '2026-10-25', conNgay: 4, soEm: 24, chungChi: null },
]

function tra(duong: string, b: Record<string, unknown>): Ket | null {
  const ok = (du: Record<string, unknown>): Ket => ({ ok: true, du: { ok: true, ...du } })
  if (duong === '/gv/lop') return ok({ lop: [{ tenLop: '12A1', khoi: '12', soEm: 24, sbd: [] }, { tenLop: '12A2', khoi: '12', soEm: 22, sbd: [] }, { tenLop: '12A3', khoi: '12', soEm: 20, sbd: [] }, { tenLop: '11B1', khoi: '11', soEm: 20, sbd: [] }] })
  if (duong === '/gv/buoi-hoc' && b.action === 'dang-mo') return ok({ buoi: chuaMo ? [] : [BUOI] })
  if (duong === '/gv/buoi-hoc' && b.action === 'gan-day') return ok({ buoi: [BUOI] })
  if (duong === '/gv/buoi-hoc') return ok({ buoi: BUOI, ma: '472915', doiMaLuc: Date.now() + 60_000, coMat: EM.slice(0, 22).map((e) => ({ sbd: e.sbd, hoTen: e.hoTen, luc: BUOI.moLuc, cach: 'ma' })), siSo: 24, lopEm: EM })
  if (duong === '/gv/dau-gio' && b.action === 'xem') return ok({ daKetThuc: false, luot: LUOT })
  if (duong === '/gv/dau-gio' && b.action === 'lich-su') return ok({ ketQua: [] })
  if (duong === '/gv/omni' && b.action === 'co-doc') return ok({ co: { bat: true, lop: ['12A1', '12A2', '12A3'], sbd: [] } })
  if (duong === '/gv/bai-da-day' && b.action === 'danh-sach') return ok({ bai: b.lop === '12A1' ? BAI : [], choBaiMoi: null })
  if (duong === '/gv/bai-da-day' && b.action === 'xem-truoc') return ok(XEM)
  if (duong === '/gv/bai-da-day' && b.action === 'ds-em') return ok({ em: EM.map((e) => ({ ...e, khoi: '12' })) })
  if (duong === '/gv/chien-dich' && b.action === 'danh-sach') return ok({ homNay: '2026-10-21', chienDich: [] })
  if (duong === '/gv/goi-bai-7') return ok(b.action === 'tong_hop' ? TONG_HOP : { bat: true, goi: GOI, em: [], cau: [] })
  return null
}

export async function goiLenh(duong: string, body: unknown): Promise<KetQuaLenh<Record<string, unknown>>> {
  await new Promise((r) => setTimeout(r, 20))
  return tra(duong, (body ?? {}) as Record<string, unknown>) ?? { ok: false, loai: 'chua_co_lenh', chu: 'Trang chụp: không có dữ liệu.' }
}
