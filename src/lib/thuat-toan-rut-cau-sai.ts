// THUẬT TOÁN RÚT CÂU SAI & KHẮC PHỤC LỖI SAI — CHUẨN HOÁ CHO CẢ 3 APP
// 1. Làm lại các câu sai: hiển thị lại toàn bộ câu sai và lời giải chuẩn để học sinh tự làm lại.
// 2. Luyện thêm dạng câu sai: thanh rút tối đa số câu có cùng nhãn dán chia theo tỷ lệ, giữ đúng tổng số câu đã chọn.
// 3. Lựa chọn luyện câu: 2 sao, 1 sao, 0 sao, lý thuyết, bài tập tính toán. Rút đúng nhãn dán, thanh trượt tối đa 100 câu.
// 4. Luyện dạng bài: chọn lớp → tên bài sách giáo khoa → dạng toán trọng tâm, gom TẤT CẢ câu trong kho thuộc dạng ấy.
// Tất cả câu rút hiển thị theo mẫu mới của HTML: chuẩn đề, chuẩn lời giải.

// LÕI THUẦN (không HTML, không DOM) nằm ở `thuat-toan-rut-cau-sai-loi.ts` — xuất lại TOÀN BỘ để mọi chỗ nhập cũ giữ nguyên.
// Tệp này chỉ còn bốn hàm DỰNG PHIẾU, mỗi hàm gọi lõi rồi dựng HTML.
import type { TeacherExamSource } from '../data/examContent'
import type { CauLuyen } from './bai-tap-pdf'
// Phiếu HTML (≈ 52 KB gzip) NẠP LƯỜI: chỉ tải khi thật sự dựng phiếu, không kéo vào lượt tải đầu của 3 app.
import type { ThongTinPhieu } from './html-phieu'
import {
  dsCauLamLaiCauSai,
  phanTichBoLocCau,
  rutDsDangBai,
  rutDsThemDangCauSai,
  rutTheoPhanBo,
  type BoLocCauLuyen,
  type CauSaiDauVao,
} from './thuat-toan-rut-cau-sai-loi'

export * from './thuat-toan-rut-cau-sai-loi'

/** LỰA CHỌN 1: Làm lại toàn bộ câu sai */
export async function taoDeLamLaiCauSai(
  dsCauSai: CauSaiDauVao[],
  thongTin: { hoTen: string; sbd: string; tenDe?: string }
): Promise<{ html: string; dsCau: CauLuyen[] }> {
  const dsCau = dsCauLamLaiCauSai(dsCauSai)
  const tt: ThongTinPhieu = {
    hoTen: thongTin.hoTen,
    sbd: thongTin.sbd,
    ngay: new Date(),
    tenChuyenDe: thongTin.tenDe || 'ĐỀ LÀM LẠI CÁC CÂU SAI',
    ketQua: `Gồm ${dsCau.length} câu làm sai cần khắc phục`,
    hienDapAn: false,
    giaoDienHocSinh: true,
    nhanBia: 'LÀM LẠI CÂU SAI',
  }
  const { dungPhieu } = await import('./html-phieu')
  const html = dungPhieu(tt, dsCau, { anGiai: false })
  return { html, dsCau }
}

/** Rút luyện thêm dạng câu sai theo tỷ lệ số câu chọn */
export async function rutLuyenThemDangCauSai(
  dsCauSai: CauSaiDauVao[],
  khoDe: TeacherExamSource[],
  soCauRut: number,
  thongTin: { hoTen: string; sbd: string; tenDe?: string }
): Promise<{ html: string; dsCau: CauLuyen[] }> {
  const { dsCau: dsCauRut, tongToiDa } = rutDsThemDangCauSai(dsCauSai, khoDe, soCauRut)

  const tt: ThongTinPhieu = {
    hoTen: thongTin.hoTen,
    sbd: thongTin.sbd,
    ngay: new Date(),
    tenChuyenDe: thongTin.tenDe || 'ĐỀ LUYỆN DẠNG KHẮC PHỤC CÂU SAI',
    ketQua: `Gồm ${dsCauRut.length} câu cùng dạng (chia theo tỷ lệ từ ${tongToiDa} câu tối đa)`,
    hienDapAn: false,
    giaoDienHocSinh: true,
    nhanBia: 'LUYỆN DẠNG CÂU SAI',
  }
  const { dungPhieu } = await import('./html-phieu')
  const html = dungPhieu(tt, dsCauRut, { anGiai: false })
  return { html, dsCau: dsCauRut }
}

/** Rút đề theo bộ lọc sao & thể loại */
export async function rutLuyenTheoBoLoc(
  dsCauSai: CauSaiDauVao[],
  khoDe: TeacherExamSource[],
  boLoc: BoLocCauLuyen,
  soCauRut: number,
  thongTin: { hoTen: string; sbd: string; tenDe?: string }
): Promise<{ html: string; dsCau: CauLuyen[] }> {
  const { thongKe, tongToiDa, tinhSoCauMoiDang } = phanTichBoLocCau(dsCauSai, khoDe, boLoc)
  const phanBo = tinhSoCauMoiDang(soCauRut)

  const dsCauRut = rutTheoPhanBo(thongKe, phanBo, Math.min(soCauRut, tongToiDa))

  // Nhãn sao và dạng
  const nhanSao = boLoc.sao === 'sao_2' ? '2 sao' : boLoc.sao === 'sao_1' ? '1 sao' : boLoc.sao === 'sao_0' ? '0 sao' : 'mọi sao'
  const nhanDang = boLoc.dang === 'ly_thuyet' ? 'Lý thuyết' : boLoc.dang === 'bai_tap' ? 'Bài tập' : 'mọi dạng'

  const tt: ThongTinPhieu = {
    hoTen: thongTin.hoTen,
    sbd: thongTin.sbd,
    ngay: new Date(),
    tenChuyenDe: thongTin.tenDe || `ĐỀ ÔN THEO BỘ LỌC (${nhanSao} · ${nhanDang})`,
    ketQua: `Gồm ${dsCauRut.length} câu (rút từ tối đa ${tongToiDa} câu)`,
    hienDapAn: false,
    giaoDienHocSinh: true,
    nhanBia: 'BỘ LỌC CÂU LUYỆN',
  }
  const { dungPhieu } = await import('./html-phieu')
  const html = dungPhieu(tt, dsCauRut, { anGiai: false })
  return { html, dsCau: dsCauRut }
}

export async function rutLuyenDangBai(
  khoDangBai: TeacherExamSource[],
  soCauRut: number,
  thongTin: { hoTen: string; sbd: string; tenDang: string; tenBai: string; lop: string },
  boLoc?: BoLocCauLuyen,
): Promise<{ html: string; dsCau: CauLuyen[] }> {
  const { dsCau: dsCauRut, tong } = rutDsDangBai(khoDangBai, soCauRut, boLoc)

  const tt: ThongTinPhieu = {
    hoTen: thongTin.hoTen,
    sbd: thongTin.sbd,
    ngay: new Date(),
    tenChuyenDe: `${thongTin.tenDang} — Lớp ${thongTin.lop} · ${thongTin.tenBai}`,
    ketQua: `Gồm ${dsCauRut.length} câu (kho có ${tong} câu thuộc dạng này)`,
    hienDapAn: false,
    giaoDienHocSinh: true,
    nhanBia: 'LUYỆN ĐỀ TỰ DO',
  }
  const { dungPhieu } = await import('./html-phieu')
  const html = dungPhieu(tt, dsCauRut, { anGiai: false })
  return { html, dsCau: dsCauRut }
}
