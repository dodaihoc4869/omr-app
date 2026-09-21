// Dữ liệu GIẢ đủ trường MỚI cho bảng "Mọi thứ về con" kiểu Apple (theo docs/ban-ve-ph-apple-2109/GHI-CHU-BUILD.md; số liệu khớp mẫu ph-d): mục tiêu ngày, lần học, điều đáng mừng, việc A.I đã làm, cờ làm lâu + lần của từng câu,
// chặng bài tập, lịch ôn 7 ngày, nhịp học đủ. Ngày mẫu 21/09/2026 21:00 giờ VN. PH_OK vẫn là bộ CŨ (không có trường mới) để kiểm "thiếu trường ⇒ ẩn".
import { H, NAY, PH_OK } from './du-lieu-mau'

const nhan = <T,>(o: T): T => JSON.parse(JSON.stringify(o))
export { H, NAY }

/** Bộ ĐỦ: máy chủ đã trả mọi trường mới. */
export const PH_APPLE = (() => {
  const r = nhan(PH_OK)
  const t = r.homNay.tongQuan
  t.mucTieu = { cau: 16, phut: 45 }
  t.viecXong = 3
  t.viecTong = 4
  t.soLanHoc = 5
  t.lanDaiNhatPhut = 21
  t.soVoiHomQua = { soCau: 33, tiLeDung: 0.76, phutHoc: 44 }
  r.homNay.dieuDangMung = [
    { loai: 'dung_lai', so: 4, chiTiet: 'trong 6 câu ôn lại lúc 06:40 sáng nay' },
    { loai: 'len_bac', so: 2, chiTiet: ['Phản ứng ester hoá', 'Tính chất vật lí của lipid'] },
    { loai: 'chuoi', so: 6 },
  ]
  r.homNay.aiDaLam = [
    { loai: 'chon_rieng', so: 23, chiTiet: { on_lai: 6, than_thu: 9, on_thi: 5, btvn_lo: 3 } },
    { loai: 'xep_on', so: 7 },
    { loai: 'soan_thu_thach', so: 5, luc: H(19, 30) },
    { loai: 'nhac_han', so: 1, luc: H(17, 0) },
    { loai: 'cham', so: 38 },
  ]
  // câu: làm lâu ≥ 120 giây (máy chủ tính: NGUONG_LAM_LAU_GIAY = 120) + lần ngồi học theo dongThoiGian (nguồn khớp)
  const lan = (nguon: string) => r.homNay.dongThoiGian.findIndex((m: { nguon: string }) => m.nguon === nguon)
  for (const c of r.homNay.cau) {
    c.lamLau = typeof c.giay === 'number' ? c.giay >= 120 : undefined
    c.lan = lan(c.nguon)
  }
  r.homNay.dongThoiGian[4].soCauDaLam = 6
  r.baiTapVeNha.dangChay[0].chang = [
    { thu: 'CN', ngay: '2026-09-20', trangThai: 'xong' },
    { thu: 'T2', ngay: '2026-09-21', trangThai: 'xong' },
    { thu: 'T3', ngay: '2026-09-22', trangThai: 'hom_nay' },
    { thu: 'T4', ngay: '2026-09-23', trangThai: 'sap_toi' },
    { thu: 'T5', ngay: '2026-09-24', trangThai: 'sap_toi' },
  ]
  r.baiTapVeNha.dangChay[0].changXong = 2
  r.baiTapVeNha.dangChay[0].changTong = 5
  r.baiTapVeNha.gan[1].nopTreGio = 1.5
  r.lichOn = { ...r.lichOn, tongTungSai: 31, phutNgayMai: 10, bayNgayToi: [7, 3, 4, 0, 5, 2, 1].map((soCau, i) => ({ ngay: `2026-09-${22 + i}`, soCau })) } // 7 dòng từ ngày mai
  r.nhipHoc.trungBinhCauMoiNgay = 20.2
  r.nhipHoc.tongCau = 283
  return r
})()

/** Bộ có NỢ (Dồn về đích): dòng cam "Con còn 1 chặng của Thứ Hai". */
export const PH_APPLE_NO = (() => {
  const r = nhan(PH_APPLE)
  r.no = { theoNgay: [{ ngay: '2026-09-21', loai: 'chang', ten: 'Ester – Lipid', soCau: 12, phut: 15 }], tongCau: 12, tongPhut: 15 }
  return r
})()

/** Bộ THƯA: con mới học 4 ngày, hôm nay học 9 câu, chưa có ca, chưa có bài tập về nhà, chưa có mục tiêu. */
export const PH_APPLE_THUA = (() => {
  const r = nhan(PH_OK)
  delete r.caGanNhat
  delete r.baiTapVeNha
  delete r.tienBo
  delete r.manhYeu
  r.homNay.tongQuan = { soCau: 9, soDung: 5, phutHoc: 14, datNhiemVu: false, chuoiNgayHoc: 4 }
  r.homNay.dongThoiGian = r.homNay.dongThoiGian.slice(0, 2)
  r.homNay.cau = r.homNay.cau.slice(0, 9)
  r.homNay.dieuDangMung = [{ loai: 'chuoi', so: 4 }, { loai: 'dung_lai', so: 1, chiTiet: 'câu ôn lại lúc 19:20' }]
  r.nhipHoc = { ngay: [['2026-09-18', 6], ['2026-09-19', 8], ['2026-09-20', 7], ['2026-09-21', 9]].map(([ngay, soCau]) => ({ ngay, soCau, soCauDung: Math.round((soCau as number) * 0.7) })), gioThuongHoc: '19:30 đến 21:00' }
  r.lichOn = { homNay: 0, ngayMai: 2, daKhacPhuc14Ngay: 1, conSaiChuaKhacPhuc: 4 }
  return r
})()

/** Bộ CHƯA HỌC hôm nay: không câu, không mốc; A.I đã chuẩn bị 2 việc; còn lịch ôn + nhịp học các ngày trước. */
export const PH_APPLE_CHUA_HOC = (() => {
  const r = nhan(PH_APPLE_THUA)
  r.homNay = { tongQuan: { soCau: 0, phutHoc: 0, datNhiemVu: false, chuoiNgayHoc: 3, mucTieu: { cau: 16, phut: 20 }, viecXong: 0, viecTong: 3 }, aiDaChuanBi: [{ loai: 'xep_on', so: 2 }, { loai: 'chon_rieng', so: 6, chiTiet: { on_lai: 2, than_thu: 4 } }] }
  r.nhipHoc.ngay = r.nhipHoc.ngay.filter((n: { ngay: string }) => n.ngay !== '2026-09-21')
  r.lichOn.homNay = 2
  return r
})()
