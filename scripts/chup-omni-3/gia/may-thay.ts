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
const KHO_MAC_DINH: TeacherExamSource[] = [
  to('DH-12-C1-B1', 'Bài 1. Ester', 24, 6),
  to('DH-12-C1-B1-VD', 'Bài 1. Ester · VÍ DỤ MINH HOẠ — dạy thêm', 6),
  to('DH-12-C1-B2', 'Bài 2. Lipid', 20, 4),
  to('DH-12-C1-B3', 'Bài 3. Xà phòng và chất giặt rửa', 80, 24, undefined, 8), // 80 + 24 + 8 = 112 = XEM.soCau
  to('DH-12-C1-B3-VD', 'Bài 3. Xà phòng và chất giặt rửa · VÍ DỤ MINH HOẠ', 5),
  to('DH-11-C2-B3', 'Bài 3. Ammonia', 18, 0, '11 · DẠY HỌC/C2 - Nitrogen'),
  to('KT-12-C1', 'Đề kiểm tra chương 1', 28, 0, '12 · C1 - Ester lipid'),
]
// ── Cảnh "nhiều lớp" (thầy 06/10, ảnh app thật): cây Khối 12 như kho của thầy — chương 3 nhập ĐẢO thứ tự (Bài 10, 11, 11, 8, 9, 9) để thấy cây đã sắp lại; 5 lớp
// 12 - Lớp Thường / 12 - Nhóm 10 điểm / 12 - Tinh Hoa / 11 / 10 (+ "Chưa xếp lớp" không vào ô chọn). Số câu giống ảnh. Không dữ liệu học sinh thật.
const LA_NHIEU_LOP = ['gv-bai-nhieu-lop', 'gv-bai-ngang-may-tinh', 'gv-giao-cho', 'gv-bai-da-day-truoc'].includes(new URLSearchParams(globalThis.location?.search ?? '').get('man') ?? '')
const chuong = (n: number, ten: string) => `12 · DẠY HỌC/C${n} - ${ten}`
const bai = (ma: string, ten: string, soCau: number, c: string) => to(ma, ten, Math.round(soCau * 0.7), Math.round(soCau * 0.2), c, soCau - Math.round(soCau * 0.7) - Math.round(soCau * 0.2))
const KHO_NHIEU_LOP: TeacherExamSource[] = [
  bai('DH-12-C1-B1A', 'Bài 1. Ester – Lipid (Phần 1)', 120, chuong(1, 'Ester – Lipid')),
  bai('DH-12-C1-B1B', 'Bài 1. Ester – Lipid (Phần 2)', 137, chuong(1, 'Ester – Lipid')),
  bai('DH-12-C1-B2', 'Bài 2. Xà phòng và chất giặt rửa tổng hợp', 117, chuong(1, 'Ester – Lipid')),
  bai('DH-12-C1-B3A', 'Bài 3. Ôn tập chương 1 (Đề 1)', 17, chuong(1, 'Ester – Lipid')),
  bai('DH-12-C1-B3B', 'Bài 3. Ôn tập chương 1 (Đề 2)', 27, chuong(1, 'Ester – Lipid')),
  bai('DH-12-C2-B4', 'Bài 4. Glucose và fructose', 193, chuong(2, 'Carbohydrate')),
  bai('DH-12-C2-B5', 'Bài 5. Saccharose và maltose', 124, chuong(2, 'Carbohydrate')),
  bai('DH-12-C2-B6', 'Bài 6. Tinh bột và cellulose', 192, chuong(2, 'Carbohydrate')),
  bai('DH-12-C2-B7A', 'Bài 7. Ôn tập chương 2 (đề 1)', 19, chuong(2, 'Carbohydrate')),
  bai('DH-12-C2-B7B', 'Bài 7. Ôn tập chương 2 (đề 2)', 27, chuong(2, 'Carbohydrate')),
  // Chương 3 nhập ĐẢO (đúng thứ tự thầy thấy trên app thật): 10, 11, 11, 8, 9, 9.
  bai('DH-12-C3-B10', 'Bài 10. Protein và enzyme', 116, chuong(3, 'Hợp chất chứa N')),
  bai('DH-12-C3-B11A', 'Bài 11. Ôn tập chương 3 (Đề 1)', 22, chuong(3, 'Hợp chất chứa N')),
  bai('DH-12-C3-B11B', 'Bài 11. Ôn tập chương 3 (Đề 2)', 28, chuong(3, 'Hợp chất chứa N')),
  bai('DH-12-C3-B8', 'Bài 8. Amine', 189, chuong(3, 'Hợp chất chứa N')),
  bai('DH-12-C3-B9A', 'Bài 9. Amino acid (P1)', 162, chuong(3, 'Hợp chất chứa N')),
  bai('DH-12-C3-B9B', 'Bài 9. Peptide (P2)', 145, chuong(3, 'Hợp chất chứa N')),
]
export const KHO: TeacherExamSource[] = LA_NHIEU_LOP ? KHO_NHIEU_LOP : KHO_MAC_DINH
const LOP_NHIEU = [
  { tenLop: '12 - Lớp Thường', khoi: '12', soEm: 44, sbd: [] }, { tenLop: '12 - Nhóm 10 điểm', khoi: '12', soEm: 18, sbd: [] }, { tenLop: '12 - Tinh Hoa', khoi: '12', soEm: 26, sbd: [] },
  { tenLop: '11', khoi: '11', soEm: 30, sbd: [] }, { tenLop: '10', khoi: '10', soEm: 25, sbd: [] }, { tenLop: 'Chưa xếp lớp', khoi: '', soEm: 7, sbd: [] },
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
const LA_TONG_QUAN = ['gv-tong-quan', 'gv-len-bang', 'gv-chien-dich'].includes(new URLSearchParams(globalThis.location?.search ?? '').get('man') ?? '') // + hai cảnh đường đi (06/10): cũng cần cờ Game Hóa 2.0 + chiến dịch

type KQ = { ok: true; du: Record<string, unknown> } | { ok: false; loai: string; chu: string }
export async function traLoiThay(duong: string, b: Record<string, unknown>): Promise<KQ> {
  await new Promise((r) => setTimeout(r, 60))
  const du = (o: Record<string, unknown>): KQ => ({ ok: true, du: { ok: true, ...o } })
  if (LA_NHIEU_LOP) {
    const k = traLoiNhieuLop(duong, b)
    if (k) return k
  }
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

// ---------------------------------------------------------------- cảnh nhiều lớp
const EM_NHIEU = LOP_NHIEU.filter((l) => l.khoi).flatMap((l, li) =>
  Array.from({ length: l.soEm }, (_, i) => ({ sbd: `${'ABCDE'[li]}${i + 1}`, hoTen: `${HO[(i + li) % HO.length]} ${TEN[(i * 7 + li) % TEN.length]}`, khoi: l.khoi, tenLop: l.tenLop })),
)
const TICK_NHIEU: Record<string, { khoaBai: string; tenBai: string; trangThai: 'da_day' | 'dang_luyen'; ngay: string; con: number | null; tong: number }[]> = {
  '12 - Lớp Thường': [
    { khoaBai: 'DH-12-C1-B1A', tenBai: 'Bài 1. Ester – Lipid (Phần 1)', trangThai: 'da_day', ngay: '2026-09-22', con: null, tong: 44 },
    { khoaBai: 'DH-12-C1-B1B', tenBai: 'Bài 1. Ester – Lipid (Phần 2)', trangThai: 'da_day', ngay: '2026-09-24', con: null, tong: 44 },
    { khoaBai: 'DH-12-C1-B2', tenBai: 'Bài 2. Xà phòng và chất giặt rửa tổng hợp', trangThai: 'dang_luyen', ngay: '2026-09-30', con: 3, tong: 44 },
  ],
  '12 - Tinh Hoa': [
    { khoaBai: 'DH-12-C1-B1A', tenBai: 'Bài 1. Ester – Lipid (Phần 1)', trangThai: 'da_day', ngay: '2026-09-22', con: null, tong: 26 },
    { khoaBai: 'DH-12-C1-B1B', tenBai: 'Bài 1. Ester – Lipid (Phần 2)', trangThai: 'da_day', ngay: '2026-09-24', con: null, tong: 26 },
    { khoaBai: 'DH-12-C1-B2', tenBai: 'Bài 2. Xà phòng và chất giặt rửa tổng hợp', trangThai: 'da_day', ngay: '2026-09-28', con: null, tong: 26 },
    { khoaBai: 'DH-12-C1-B3A', tenBai: 'Bài 3. Ôn tập chương 1 (Đề 1)', trangThai: 'dang_luyen', ngay: '2026-10-01', con: 4, tong: 26 },
  ],
  '12 - Nhóm 10 điểm': [{ khoaBai: 'DH-12-C1-B1A', tenBai: 'Bài 1. Ester – Lipid (Phần 1)', trangThai: 'da_day', ngay: '2026-09-22', con: null, tong: 18 }],
}
const EM_LOP_THUONG = EM_NHIEU.filter((e) => e.tenLop === '12 - Lớp Thường').map((e) => e.sbd)
const buoiLopThuong = (id: string, ngay: string, ds: string[]) => ({ id, ten: `Buổi ${ngay}`, lop: '12 - Lớp Thường', moLuc: `${ngay}T11:00:00Z`, hetHan: '', dongLuc: `${ngay}T13:00:00Z`, dangMo: false, coMat: ds })
function traLoiNhieuLop(duong: string, b: Record<string, unknown>): KQ | null {
  const du = (o: Record<string, unknown>): KQ => ({ ok: true, du: { ok: true, ...o } })
  if (duong === '/gv/lop') return du({ lop: LOP_NHIEU })
  if (duong === '/gv/omni' && b.action === 'co-doc') return du({ co: { bat: true, lop: [], sbd: [] } })
  if (duong === '/gv/buoi-hoc' && b.action === 'dang-mo') return du({ buoi: [{ ...BUOI, ten: 'Buổi học 05/10 · 12 - Lớp Thường', lop: '12 - Lớp Thường' }] })
  // Điểm danh của lớp đang mở (để ô "Giao cho › Theo điểm danh" có chip buổi): buổi đang mở + hai buổi gần đây, em có mặt lấy từ chính danh sách em của lớp.
  if (duong === '/gv/buoi-hoc' && b.action === 'gan-day') return du({ buoi: [{ ...buoiLopThuong('BH-9', '2026-10-05', EM_LOP_THUONG.slice(0, 38)), dangMo: true }, buoiLopThuong('BH-8', '2026-10-03', EM_LOP_THUONG.slice(2, 42)), buoiLopThuong('BH-6', '2026-09-29', EM_LOP_THUONG.slice(0, 41))] })
  if (duong === '/gv/buoi-hoc') return du({ buoi: { ...BUOI, ten: 'Buổi học 05/10 · 12 - Lớp Thường', lop: '12 - Lớp Thường' }, ma: '482915', doiMaLuc: Date.now() + 40_000, coMat: EM_LOP_THUONG.slice(0, 38).map((sbd, i) => ({ sbd, hoTen: sbd, luc: `2026-10-05T11:${String(i % 60).padStart(2, '0')}:00Z`, cach: 'ma' })), siSo: 44, lopEm: [] })
  if (duong === '/gv/chien-dich' && b.action === 'ds-em') return du({ em: EM_NHIEU })
  if (duong === '/gv/bai-da-day' && b.action === 'danh-sach')
    return du({
      bai: (TICK_NHIEU[String(b.lop)] ?? []).map((t, i) => ({ khoaBai: t.khoaBai, tenBai: t.tenBai, viTri: i + 1, tickLuc: `${t.ngay}T03:00:00Z`, chienDichId: `cd-${t.khoaBai}`, trangThai: t.trangThai, hanNop: '2026-10-08', conNgay: t.con, chungChi: { dat: Math.round(t.tong * 0.8), tong: t.tong }, soEm: t.tong })),
      choBaiMoi: null,
    })
  if (duong === '/gv/bai-da-day' && b.action === 'xem-truoc') {
    const n = Array.isArray(b.sbd) ? b.sbd.length : 30
    const lop = String(b.lop)
    return du({ ...XEM, soCau: 192, soTuLuan: 0, soEmChon: n, tongEm: n, duLuot: Math.max(0, n - (lop === '12 - Lớp Thường' ? 3 : 0)), duDiem8: Math.round(n * 0.7), luotCan: 14 * n, sucChua: 18 * n, quaTai: lop === '12 - Lớp Thường' ? [{ sbd: 'A7', ten: 'Đặng Minh' }, { sbd: 'A19', ten: 'Vũ Chi' }, { sbd: 'A31', ten: 'Lê Bảo' }] : [] })
  }
  return null
}
