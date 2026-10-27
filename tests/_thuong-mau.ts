// DỮ LIỆU GIẢ thưởng phạt (khớp số các bản vẽ tp-* thầy chốt 26/10) — dùng chung cho test giao diện (tests/thuong-giao-dien-hs-2610.test.tsx)
// và cảnh chụp (scripts/chup-v2/gia/thuong.tsx). Tên em là tên giả. Ngày tính theo «hôm nay» giờ Việt Nam để lịch 7 ngày luôn kết thúc ở hôm nay.
// Đúng tên trường HỢP ĐỒNG (DAC-TA-THUONG-PHAT-2610 mục 4).
const ngayVn = (ms = Date.now()) => new Date(ms + 7 * 3600e3).toISOString().slice(0, 10)
export const HOM_NAY = ngayVn()
export const ngayTruoc = (n: number) => ngayVn(Date.now() - n * 864e5)
type Kieu = 'hoc' | 'binh' | 'phep' | 'tat'
export const lich7 = (k: Kieu[]) => k.map((kieu, i) => ({ ngay: ngayTruoc(k.length - 1 - i), kieu }))

export const BAT = { giai: true, thangHoa: true, banBe: true, kimCuong: true }
export const NHIEM_VU = [
  { ma: 'xong_bai', ten: 'Xong 4 chặng', tien: 3, can: 4, thuong: 10, xong: false },
  { ma: 'chuoi_dung_5', ten: 'Chuỗi đúng 5 câu', tien: 5, can: 5, thuong: 5, xong: true },
  { ma: 'dung_kho_2', ten: 'Đúng 2 câu khó', tien: 1, can: 2, thuong: 10, xong: false },
]
export const NHIEM_VU_XONG = [
  { ma: 'xong_bai', ten: 'Xong 4 chặng', tien: 4, can: 4, thuong: 10, xong: true },
  { ma: 'chuoi_dung_5', ten: 'Chuỗi đúng 5 câu', tien: 5, can: 5, thuong: 5, xong: true },
  { ma: 'dung_kho_2', ten: 'Đúng 2 câu khó', tien: 2, can: 2, thuong: 10, xong: true },
]
/** /hs/thuong — Khôi, chuỗi 12, 147 nguyên tử hôm nay, 245 tinh thể, mục tiêu 3/4, Giải Bạc hạng 4/20, cược ngày 3/7. */
export function tongQuanGia(them: Record<string, unknown> = {}) {
  return {
    ok: true, bat: BAT, nguyenTuHomNay: 147, tinhThe: 245, mucTieu: { daXong: 3, can: 4 },
    chuoiNgay: { so: 12, giuChuoi: 1, sucChua: 2, lich7: lich7(['hoc', 'hoc', 'phep', 'hoc', 'binh', 'hoc', 'hoc']) },
    nhiemVu: NHIEM_VU, ruong: { mo: false, thuong: 15 },
    giai: { hang: 'bac', thuHang: 4, soNguoi: 20, hetHanGiay: 2 * 86400 + 5 * 3600 + 120 },
    thongBao: [], cuoc: { dat: 50, ngay: 3 },
    ...them,
  }
}
const TEN = [['Trần Gia Bảo', '12A2', 688], ['Nguyễn Hà My', '11B1', 615], ['Phạm Đức Minh', '12A3', 540], ['Lê Minh Khôi', '12A1', 412], ['Lê Thu Trang', '11A2', 398],
  ['Hoàng Nam', '12A3', 371], ['Vũ Khánh Linh', '11B1', 344], ['Đỗ Quang Huy', '12A2', 310], ['Bùi Ngọc Ánh', '10C1', 287], ['Đặng Tuấn Kiệt', '11A2', 260],
  ['Phan Bảo Ngọc', '12A1', 231], ['Ngô Thanh Tâm', '10C2', 205], ['Trịnh Hải Đăng', '11B2', 178], ['Lý Mai Phương', '12A3', 150], ['Võ Minh Quân', '10C1', 126],
  ['Dương Thảo Vy', '11A1', 98], ['Hồ Đức Anh', '12A2', 74], ['Mai Phương Thảo', '10C2', 52], ['Tạ Quốc Việt', '11B2', 30], ['Chu Khánh Hà', '12A1', 12]] as const
/** /hs/giai — nhóm Bạc 20 bạn, em hạng 4 (412). */
export const GIAI_GIA = { ok: true, bat: true, hang: 'bac', hetHanGiay: 2 * 86400 + 5 * 3600 + 120, len: 5, roi: 4,
  nhom: TEN.map(([ten, lop, nguyenTu], i) => ({ thuHang: i + 1, ten, lop, nguyenTu, laEm: i === 3 })) }
/** /hs/huy-hieu (tp-13). */
export const HUY_HIEU_GIA = { ok: true, huyHieu: [
  { ma: 'chuoi_7', ten: '7 ngày', co: true, ngay: '2026-09-23' }, { ma: 'chuoi_30', ten: '30 ngày', co: false, tienDo: { da: 12, can: 30 } },
  { ma: 'chuoi_50', ten: '50 ngày', co: false, tienDo: { da: 12, can: 50 } }, { ma: 'chuoi_100', ten: '100 ngày', co: false, tienDo: { da: 12, can: 100 } },
  { ma: 'chuoi_365', ten: 'CLB 365', co: false, tienDo: { da: 12, can: 365 } },
  { ma: 'hang_dong', ten: 'Giải Đồng', co: true, ngay: '2026-09-28' }, { ma: 'hang_bac', ten: 'Giải Bạc', co: true, ngay: '2026-10-05' },
  { ma: 'hang_vang', ten: 'Giải Vàng', co: true, ngay: '2026-10-19' }, { ma: 'hang_bachkim', ten: 'Bạch kim', co: false }, { ma: 'hang_kimcuong', ten: 'Kim cương', co: false },
  { ma: 'quan_quan', ten: 'Quán quân', co: false },
  { ma: 'hoan_hao_10', ten: '10 chặng', co: true, ngay: HOM_NAY }, { ma: 'hoan_hao_50', ten: '50 chặng', co: false, tienDo: { da: 14, can: 50 } },
  { ma: 'kim_cuong_ester', ten: 'Ester – Lipid', co: true, ngay: '2026-10-24' }, { ma: 'kim_cuong_amine', ten: 'Amine', co: false }, { ma: 'kim_cuong_carbo', ten: 'Carbohydrate', co: false },
  { ma: 'doi_7', ten: 'Chuỗi đôi 7', co: true, ngay: '2026-10-25' }, { ma: 'doi_30', ten: 'Chuỗi đôi 30', co: false, tienDo: { da: 9, can: 30 } },
  { ma: 'doi_100', ten: 'Chuỗi đôi 100', co: false, tienDo: { da: 9, can: 100 } },
  { ma: 'phan_ung_day_chuyen', ten: 'Phản ứng dây chuyền', co: true, ngay: '2026-10-12' }, { ma: 'cu_dem', ten: 'Cú đêm', co: true, ngay: '2026-10-20' },
] }
/** /hs/ban (tp-16) — Nguyễn Minh Châu cả hai xong (lửa đôi 9), Trần Gia Bảo chưa học (3). Đủ họ tên (thầy 27/10). Không điểm của bạn. */
export const BAN_GIA = { ok: true, bat: true, toiDa: 3, loiMoi: [], daMoi: [], ban: [
  { ma: 'b1', ten: 'Nguyễn Minh Châu', lop: '12A2', chuoiDoi: 9, homNay: 'ca_hai', daGoCua: false, tuNgay: '2026-10-17' },
  { ma: 'b2', ten: 'Trần Gia Bảo', lop: '12A2', chuoiDoi: 3, homNay: 'ban_chua', daGoCua: false, tuNgay: '2026-10-23' },
] }
/** /hs/kim-cuong/ds (lối vào Thử thách Kim cương, 27/10): một chuyên đề mở, một lượt dở, một đang khoá, một đã đạt. */
export const DS_KC_GIA = { ok: true, bat: true, ds: [
  { ma: 'ESTER', ten: 'Ester – lipid', tt: 'dang', daDat: false },
  { ma: 'NGUYEN_TU', ten: 'Cấu tạo nguyên tử', tt: 'mo', daDat: false },
  { ma: 'POLYMER', ten: 'Polymer', tt: 'mo', daDat: true },
  { ma: 'HALOGEN', ten: 'Nguyên tố nhóm halogen', tt: 'khoa', daDat: false, moLaiLuc: '2026-10-28T02:30:00.000Z' },
] }
export const TIM_GIA = { ok: true, bat: true, ketQua: [
  { ma: 't1', ten: 'Nguyễn Thu Hà', lop: '12A1', trangThai: null }, { ma: 't2', ten: 'Chu Khánh Hà', lop: '12A1', trangThai: 'da_moi' },
  { ma: 't3', ten: 'Trịnh Hải Đăng', lop: '11B2', trangThai: null },
] }
/** Phản hồi `answer` — trường `thuong` (hợp đồng 4.1). */
export const THUONG_COMBO = { tinh: true, nguyenTu: 12, dong: [{ nhan: 'Đúng', so: 10 }, { nhan: 'Chuỗi đúng 3', so: 2 }], chuoiDung: 3, cauKho: false }
export const THUONG_DAY = { tinh: true, nguyenTu: 15, dong: [{ nhan: 'Đúng', so: 10 }, { nhan: 'Chuỗi đúng 5', so: 5 }], chuoiDung: 5, cauKho: false }
export const THUONG_KHO = { tinh: true, nguyenTu: 17, dong: [{ nhan: 'Đúng', so: 10 }, { nhan: 'Câu khó', so: 5 }, { nhan: 'Chuỗi đúng 4', so: 2 }], chuoiDung: 4, cauKho: true }
export const THUONG_KHONG_TINH = { tinh: false }
/** `ketBai` — bài thường 5/6 (61) và hoàn hảo 6/6 (99). */
export const KET_BAI = { tong: 61, soDung: 5, soCau: 6, chinhXac: 83, giay: 252, hoanHao: false, mucTieu: { daXong: 3, can: 4 }, giai: { thuHang: 4, doi: 2 },
  dong: [{ nhan: 'Câu đúng · 5 câu × 10', so: 50 }, { nhan: 'Câu khó · câu 4', so: 5 }, { nhan: 'Chuỗi đúng · câu 3, 4', so: 4 }, { nhan: 'Câu sai làm kĩ · câu 5', so: 2 }, { nhan: 'Hoàn hảo · cần 6/6 câu đúng', so: 0 }] }
export const KET_BAI_HH = { tong: 99, soDung: 6, soCau: 6, chinhXac: 100, giay: 228, hoanHao: true, mucTieu: { daXong: 4, can: 4 }, giai: { thuHang: 3, doi: 3 },
  dong: [{ nhan: 'Câu đúng · 6 câu × 10', so: 60 }, { nhan: 'Câu khó · câu 4', so: 5 }, { nhan: 'Chuỗi đúng · câu 3–6', so: 14 }, { nhan: 'Hoàn hảo', so: 20 }] }
/** Thông báo một lần (`thongBao`). */
export const TB = {
  thangHoa: { ma: 'thang_hoa|1', loai: 'thang_hoa', duLieu: { mat: 12, conLai: 108 } },
  binhDo: { ma: 'binh_do|1', loai: 'binh_do', duLieu: { ngay: ngayTruoc(1) } },
  phep: { ma: 'binh_do|2', loai: 'binh_do', duLieu: { ngay: ngayTruoc(1), phep: true } },
  cuoiTuanLen: { ma: 'cuoi_tuan|1', loai: 'cuoi_tuan', duLieu: { tuan: '2026-10-19', ket: 'len', hangCu: 'bac', hangMoi: 'vang', thuHang: 4, soNguoi: 20, tinhThe: 40, nguyenTu: 412, soNgay: 7 } },
  cuoiTuanGiu: { ma: 'cuoi_tuan|2', loai: 'cuoi_tuan', duLieu: { tuan: '2026-10-19', ket: 'giu', hangCu: 'bac', hangMoi: 'bac', thuHang: 9, soNguoi: 20, tinhThe: 0, nguyenTu: 287, soNgay: 5 } },
  cuoiTuanRoi: { ma: 'cuoi_tuan|3', loai: 'cuoi_tuan', duLieu: { tuan: '2026-10-19', ket: 'roi', hangCu: 'bac', hangMoi: 'dong', thuHang: 18, soNguoi: 20, tinhThe: 0, nguyenTu: 52, soNgay: 2 } },
  mocChuoi: { ma: 'moc_chuoi|7', loai: 'moc_chuoi', duLieu: { moc: 7, tinhThe: 10 } },
  cuocThua: { ma: 'cuoc|1', loai: 'cuoc', duLieu: { ketQua: 'thua', tinhThe: -50 } },
  huyHieu: { ma: 'huy_hieu|hoan_hao_10', loai: 'huy_hieu', duLieu: { ma: 'hoan_hao_10', ten: '10 chặng hoàn hảo' } },
  mocDoi: { ma: 'moc_doi|7', loai: 'moc_doi', duLieu: { moc: 7, tinhThe: 10, ban: 'Nguyễn Minh Châu' } },
  moiBan: { ma: 'moi_ban|1', loai: 'moi_ban', duLieu: { ma: 'b9', ten: 'Nguyễn Minh Châu', lop: '12A2' } },
  goCua: { ma: 'go_cua|1', loai: 'go_cua', duLieu: { ma: 'b2', ten: 'Trần Gia Bảo', lop: '12A2' } },
} as const
/** Chuỗi vừa tắt, đang cứu (tp-6). */
export const CUU = (daLam: number) => ({ so: 0, giuChuoi: 0, sucChua: 2, lich7: lich7(['hoc', 'hoc', 'hoc', 'hoc', 'hoc', 'tat', 'tat']),
  cuu: { hetHan: Date.now() + (23 * 3600 + 16 * 60 + 5) * 1000, daLam, can: 2, so: 12 } })
/** Phiên Kim cương: 10 câu (KHÔNG đáp án). */
export const PHIEN_KC = { ok: true, phien: 'kc1', ong: 3, cau: Array.from({ length: 10 }, (_, i) => ({ qid: `KC-${i + 1}`, phan: 'I',
  text: 'Xà phòng hoá hoàn toàn 17,8 gam tristearin bằng dung dịch sodium hydroxide vừa đủ, thu được m gam glycerol. Giá trị của m là',
  choices: ['1,84', '0,92', '5,52', '3,68'], ideas: [] })) }
