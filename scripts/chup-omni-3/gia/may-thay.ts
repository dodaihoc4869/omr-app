// MÁY CHỦ GIẢ CỦA APP THẦY cho trang chụp OMNI 3 (chép hình dữ liệu từ tests/omni-3-thay-bai-hom-nay.test.tsx của làn C1).
// Không dữ liệu học sinh thật; không yêu cầu nào ra mạng (goiLenh bị thay ở gia/goi-lenh-thay.ts).
import { BANG, CAU_HINH_OMNI } from './bang-gv'
import type { TeacherExamSource } from '../../../src/data/examContent'

let soCau = 0
const cau = (maDe: string, n: number) => Array.from({ length: n }, () => ({ id: `${maDe}-I-${++soCau}`, text: `Câu ${soCau} của ${maDe}`, choices: ['a', 'b', 'c', 'd'], correct: 'A' }))
const cauII = (maDe: string, n: number) => Array.from({ length: n }, () => ({ id: `${maDe}-II-${++soCau}`, text: `Ý ${soCau} của ${maDe}`, ideas: ['a', 'b', 'c', 'd'], correct: 'DDSS' }))
const cauIII = (maDe: string, n: number) => Array.from({ length: n }, () => ({ id: `${maDe}-III-${++soCau}`, text: `Câu ${soCau} của ${maDe}`, correct: '1,5' }))
const to = (maDe: string, nguon: string, nI: number, nII = 0, nhom = '12 · DẠY HỌC/C1 - Ester lipid', nIII = 0): TeacherExamSource =>
  ({ maDe, nhom, nguon, phanI: cau(maDe, nI), phanII: cauII(maDe, nII), phanIII: cauIII(maDe, nIII) }) as unknown as TeacherExamSource
export const KHO: TeacherExamSource[] = [
  to('DH-12-C1-B1', 'Bài 1. Ester', 24, 6),
  to('DH-12-C1-B1-VD', 'Bài 1. Ester · VÍ DỤ MINH HOẠ — dạy thêm', 6),
  to('DH-12-C1-B2', 'Bài 2. Lipid', 20, 4),
  to('DH-12-C1-B3', 'Bài 3. Xà phòng và chất giặt rửa', 80, 24, undefined, 8), // 80 + 24 + 8 = 112 = XEM.soCau
  to('DH-12-C1-B3-VD', 'Bài 3. Xà phòng và chất giặt rửa · VÍ DỤ MINH HOẠ', 5),
  to('DH-11-C2-B3', 'Bài 3. Ammonia', 18, 0, '11 · DẠY HỌC/C2 - Nitrogen'),
  to('KT-12-C1', 'Đề kiểm tra chương 1', 28, 0, '12 · C1 - Ester lipid'),
]
const BUOI = { id: 'BH-9', ten: 'Buổi học 05/10 · 12A1', lop: '12A1', moLuc: '2026-10-05T11:00:00Z', hetHan: '2026-10-06T11:00:00Z', dongLuc: null, dangMo: true }
const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Ngô']
const TEN = ['An', 'Bảo', 'Chi', 'Dũng', 'Giang', 'Hà', 'Khoa', 'Linh', 'Minh', 'Nam', 'Phương', 'Quân', 'Thảo', 'Trang', 'Vy']
const EM = Array.from({ length: 44 }, (_, i) => ({ sbd: `S${i + 1}`, hoTen: `${HO[i % HO.length]} ${TEN[(i * 7) % TEN.length]}`, khoi: '12', tenLop: '12A1' }))
  .concat(Array.from({ length: 30 }, (_, i) => ({ sbd: `T${i + 1}`, hoTen: `${HO[(i + 3) % HO.length]} ${TEN[(i * 5) % TEN.length]}`, khoi: '11', tenLop: '11B' })))
const coMat = (tu: number, den: number) => EM.slice(tu, den).map((e) => e.sbd)
const buoiCu = (id: string, ngay: string, ds: string[]) => ({ id, ten: `Buổi ${ngay}`, lop: '12A1', moLuc: `${ngay}T11:00:00Z`, hetHan: '', dongLuc: `${ngay}T13:00:00Z`, dangMo: false, coMat: ds })
const XEM = { ok: true, soCau: 112, soTuLuan: 6, hanNop: '2026-10-12', D: 7, luotCan: 224, sucChua: 280, duLuot: 37, tongEm: 44, soEmChon: 38, duDiem8: 29, quaTai: [{ sbd: 'S7', ten: 'Đặng Minh' }], theLucNgay: 40 }

// Thẻ "Chất lượng sửa lỗi · 14 ngày" ở Tổng quan (05/10): hình dạng đúng `/gv/chat-luong-loi` (server/src/chat-luong-loi.ts). Số giả kiểu tuần
// đầu (sổ tính từ 29/09): chưa có lượt kiểm 14/30 ngày nào ⇒ hai dòng "Chưa đủ dữ liệu"; lớp 11B ít mẫu hơn.
const tl = (dat: number, n: number) => ({ tiLe: n ? dat / n : null, dat, n, du: n >= 10 })
const chuaKiem = [{ moc: 14, ...tl(0, 0) }, { moc: 30, ...tl(0, 0) }]
const CHAT_LUONG: Record<string, Record<string, unknown>> = {
  '12A1': { tenLop: '12A1', khoi: '12', soEm: 44, tuNgay: '2026-09-29', denNgay: '2026-10-05', soNgay: 14, nToiThieu: 10, lamLaiDau: tl(31, 48), saiLaiDuyTri: chuaKiem,
    ngayToiDong: { trungVi: 4, n: 17, du: true }, cauLaCungDang: tl(28, 40), lapNguyenVan: tl(12, 48), boKhacKhoi: 3, soEmCoLuot: 41 },
  '11B': { tenLop: '11B', khoi: '11', soEm: 30, tuNgay: '2026-09-29', denNgay: '2026-10-05', soNgay: 14, nToiThieu: 10, lamLaiDau: tl(14, 23), saiLaiDuyTri: chuaKiem,
    ngayToiDong: { trungVi: 3.5, n: 8, du: false }, cauLaCungDang: tl(11, 19), lapNguyenVan: tl(9, 23), boKhacKhoi: 0, soEmCoLuot: 26 },
}
/** Cảnh Tổng quan: thêm chiến dịch + cờ Game Hóa 2.0 CHỈ cho cảnh này (các cảnh khác giữ đúng câu trả lời cũ ⇒ ảnh cũ không đổi). */
const LA_TONG_QUAN = new URLSearchParams(globalThis.location?.search ?? '').get('man') === 'gv-tong-quan'

type KQ = { ok: true; du: Record<string, unknown> } | { ok: false; loai: string; chu: string }
export async function traLoiThay(duong: string, b: Record<string, unknown>): Promise<KQ> {
  await new Promise((r) => setTimeout(r, 60))
  const du = (o: Record<string, unknown>): KQ => ({ ok: true, du: { ok: true, ...o } })
  if (duong === '/gv/lop') return du({ lop: [{ tenLop: '12A1', khoi: '12', soEm: 44, sbd: [] }, { tenLop: '11B', khoi: '11', soEm: 30, sbd: [] }] })
  if (duong === '/gv/chat-luong-loi') {
    const lop = typeof b.lop === 'string' && CHAT_LUONG[b.lop] ? b.lop : '12A1'
    return du({ homNay: '2026-10-05', soNgay: 14, nToiThieu: 10, lop: [{ tenLop: '12A1', khoi: '12', soEm: 44 }, { tenLop: '11B', khoi: '11', soEm: 30 }], chon: lop, ketQua: CHAT_LUONG[lop] })
  }
  if (LA_TONG_QUAN && duong === '/gv/chien-dich' && b.action === 'co-doc') return du({ co: { bat: true, lop: [], sbd: [] } })
  if (LA_TONG_QUAN && duong === '/gv/chien-dich' && b.action === 'danh-sach') return du({ homNay: BANG.homNay, chienDich: [BANG.chienDich] })
  if (LA_TONG_QUAN && duong === '/gv/chien-dich' && b.action === 'bang') return du(BANG as unknown as Record<string, unknown>)
  if (duong === '/gv/buoi-hoc' && b.action === 'dang-mo') return du({ buoi: [BUOI] })
  if (duong === '/gv/buoi-hoc' && b.action === 'gan-day')
    return du({ buoi: [{ ...buoiCu('BH-9', '2026-10-05', coMat(0, 38)), dangMo: true }, buoiCu('BH-8', '2026-10-03', coMat(2, 42)), buoiCu('BH-7', '2026-10-01', []), buoiCu('BH-6', '2026-09-29', coMat(0, 41))] })
  if (duong === '/gv/buoi-hoc') return du({ buoi: BUOI, ma: '482915', doiMaLuc: Date.now() + 40_000, coMat: EM.slice(0, 38).map((e, i) => ({ sbd: e.sbd, hoTen: e.hoTen, luc: `2026-10-05T11:${String(i % 60).padStart(2, '0')}:00Z`, cach: 'ma' })), siSo: 44, lopEm: [] })
  if (duong === '/gv/chien-dich' && b.action === 'ds-em') return du({ em: EM })
  if (duong === '/gv/omni' && b.action === 'co-doc') return du({ co: { bat: true, lop: ['12A1'], sbd: [] } })
  if (duong === '/gv/omni' && b.action === 'cau-hinh-doc') return du(CAU_HINH_OMNI)
  if (duong === '/gv/bai-da-day' && b.action === 'danh-sach')
    return du({
      bai: [
        { khoaBai: 'DH-12-C1-B1', tenBai: 'Bài 1. Ester', viTri: 1, tickLuc: '2026-09-22T03:00:00Z', chienDichId: 'cd-1', trangThai: 'da_day', hanNop: '2026-09-29', conNgay: null, chungChi: { dat: 38, tong: 44 } },
        { khoaBai: 'DH-12-C1-B2', tenBai: 'Bài 2. Lipid', viTri: 2, tickLuc: '2026-09-30T03:00:00Z', chienDichId: 'cd-2', trangThai: 'dang_luyen', hanNop: '2026-10-07', conNgay: 2, chungChi: { dat: 0, tong: 44 } },
      ],
      choBaiMoi: null,
    })
  if (duong === '/gv/bai-da-day' && b.action === 'xem-truoc') {
    const n = Array.isArray(b.sbd) ? b.sbd.length : 44
    return du({ ...XEM, soEmChon: n, duLuot: Math.max(0, n - 1), duDiem8: Math.round(n * 0.76) })
  }
  if (duong === '/gv/bai-da-day' && b.action === 'tick') return du({ chienDichId: 'cd-3', hanNop: '2026-10-12', daCo: false })
  return { ok: false, loai: 'chua_co_lenh', chu: 'lệnh lạ (trang chụp)' }
}
