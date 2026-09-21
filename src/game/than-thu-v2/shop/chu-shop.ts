// CỬA HÀNG PHỤ KIỆN — TOÀN BỘ chữ người dùng nhìn thấy / nghe (aria) của bốn màn nằm ĐÂY. Tệp khác chỉ có chú thích.
// Nguồn: DE-XUAT-SHOP-PHU-KIEN-2109.md mục 4 + MỤC 9 (bảng từ chuẩn + kho câu chữ 58 chuỗi; số trong ngoặc vuông [N1]… là mã của kho).
// Chuỗi mục 9 không có mới viết chữ trung tính theo bảng từ chuẩn và ghi `// CHỜ MỤC 9` để Boss bổ sung / thay.
// Luật giọng: câu ngắn, động từ trước, xưng "em", mỗi màn tối đa MỘT dấu chấm than; không chữ gợi cờ bạc; con số nào cũng có nhãn.
import type { Bac, OGan } from './kieu'

/** Số kiểu Việt: 1.800 (dấu chấm ngăn nghìn). */
export const so = (n: number): string => Number(n).toLocaleString('vi-VN')

// ── Tiêu đề màn + nhãn [N1–N12] ──
export { chuCuaHang } from './chu-cua-vao' // [N1] — định nghĩa ở chu-cua-vao.ts (nhãn cửa vào dùng ở gói chính)
export const chuCuaHangPhu = 'Sắm đồ cho thần thú · Mùa 1, tới hết học kỳ I' // [N1]
export const chuThuDo = 'Thử đồ' // [N2]
export const chuThuDoPhu = 'Thử thoải mái, không mất vàng' // [N2]
export const chuTuDo = 'Tủ đồ' // [N3]
export const chuTuDoPhu = 'Đồ em đã mua, giữ mãi' // [N3]
export const chuVangCuaEm = 'Vàng của em' // [N4]
export const chuVang = 'vàng'
export const chuVangSo = (n: number): string => `${so(n)} ${chuVang}`
/** [N5] "Ống nghiệm có {620} EXP · Dự trữ đủ {3} ngày ăn" — tách vế để in đậm phần số. */
export const chuOngNghiemCo = 'Ống nghiệm có'
export const chuDonViExp = 'EXP'
export const chuExp = (n: number): string => `${so(n)} ${chuDonViExp}`
export const chuDuTruDu = 'Dự trữ đủ'
export const chuNgayAn = (n: number): string => `${so(n)} ngày ăn`
export const chuDoiVang = 'Đổi vàng' // [N6] cũng là nút phụ [B5]
export const chuDoiVangPhu = 'EXP thừa trong ống nghiệm đổi được thành vàng.' // [N6]
/** [N7] — số giữ lại do máy chủ trả (`giuLai`, 200). */
export const chuGhiChuDoi = (giuLai: number): string => `1 EXP thừa = 1 vàng. Thần thú luôn giữ lại ${so(giuLai)} EXP, đủ ăn 1 ngày.`
export const chuEmDoi = 'Em đổi' // mục 4
export const chuDoiThanh = (x: number): string => `${chuExp(x)} thành ${chuVangSo(x)}` // mục 4: "Em đổi · 180 EXP thành 180 vàng"
export const chuTruocKhiDoi = 'Trước khi đổi' // [N8]
export const chuSauKhiDoi = 'Sau khi đổi' // [N8]
export const chuDuNgayAn = (exp: number, ngay: number): string => `${chuExp(exp)} · đủ ${chuNgayAn(ngay)}` // [N8]
export const chuDatDan = 'Đắt dần:' // [N9]
export const chuChoDeoNhan = 'Chỗ đeo' // [N10]
export const chuChoDeo = (o: OGan): string => `${chuChoDeoNhan}: ${TEN_O[o]}` // [N10]
export const chuGia = 'Giá' // [N10]
export const chuCanCo = 'Cần có' // [N10]
export const chuSoLuong = 'Số lượng' // [N10]
export const chuBatMi = 'Bật mí Hoá học' // [N10]
export const chuDangThuDanhSach = 'Em đang thử · chạm một món để xem kỹ' // [N11]
export const chuDangThu = (n: number): string => `Đang thử ${n} phụ kiện` // [N12]
export const chuDoThanThuDangMac = 'Đồ thần thú đang mặc' // [N12]

// ── Chỗ đeo + bậc (bảng từ chuẩn 9.2) ──
export const TEN_O: Record<OGan, string> = {
  'hao-quang': 'Vòng sáng',
  vet: 'Đuôi sáng',
  khung: 'Khung tên',
  dau: 'Trên đầu',
  'co-lung': 'Trên lưng',
}
export const TEN_BAC: Record<Bac, string> = { 1: 'Thường', 2: 'Đẹp', 3: 'Hiếm', 4: 'Sử thi', 5: 'Huyền thoại' }
export const chuTatCa = 'Tất cả' // mục 4 (thanh lọc)
export const chuSapMo = 'Sắp mở' // mục 4 (Trên đầu, Trên lưng)

// ── Nút [B1–B9] ──
export const chuNutDoi = (x: number): string => `Đổi ${so(x)} EXP lấy ${so(x)} vàng` // [B1]
export const chuNutDoiXacNhan = (x: number): string => `Đổi ${so(x)} EXP` // [B1] trong hộp xác nhận
export const chuNutMua = (gia: number): string => `Mua · ${so(gia)} vàng` // [B2]
export const chuDeSau = 'Để sau' // [B3]
export const chuMacNgay = 'Mặc ngay' // [B4]
export const chuCoiRa = 'Cởi ra' // [B4]
export const chuBoThu = 'Bỏ thử món này' // [B6]
export const chuToiCuaHang = 'Tới Cửa hàng' // [B7]
export const chuXemCuaHang = 'Xem Cửa hàng' // [B7]
export const chuThuLai = 'Thử lại' // [B8]
export const chuKeoThanh = 'Kéo thanh để chọn số EXP' // [B9]
export const chuChuaCoExpThua = 'Chưa có EXP thừa để đổi' // [B9]

// ── Lần đầu mở Cửa hàng [C1–C4] ──
export const chuChao = ['Chào em tới Cửa hàng.', 'EXP thừa đổi thành vàng. Vàng mua đồ cho thần thú.', 'Phụ kiện chỉ để đẹp, không làm thần thú mạnh hơn.', 'Vàng chỉ đến từ việc học. Không nạp tiền, không xin bạn được.'] as const

// ── Tự hào + tò mò [T1–T4] ──
export const chuTuHao = 'Cả đoàn sẽ thấy thần thú của em y như thế này. Bảng vinh danh cũng vậy.' // [T2]
export const chuDangMacMonNay = 'Thần thú đang mặc món này' // [T3] (bỏ dấu chấm cuối: dùng làm nhãn nút khoá)

// ── Hộp xác nhận [X1–X2] ──
export const chuXacNhanDoi = (x: number, ngayAnSau: number): string => `Thần thú bớt ${so(x)} EXP dự trữ, vẫn đủ ${chuNgayAn(ngayAnSau)}. Em nhận ${chuVangSo(x)}, đổi rồi không đổi ngược lại được.` // [X1]
export const chuXacNhanMua = (gia: number, conLai: number): string => `Em trả ${chuVangSo(gia)}, còn lại ${chuVangSo(conLai)}. Mua rồi giữ mãi, không trả lại hay bán lại được.` // [X2]

// ── Mừng sau khi xong [M1–M4] ──
export const chuMuaXong = (ten: string, vang: number): string => `Hợp quá! ${ten} đã là của em. Em còn ${chuVangSo(vang)}.` // [M1]
export const chuMonKe = (ten: string, gia: number): string => `Em vẫn đủ vàng cho ${ten}, giá ${chuVangSo(gia)}.` // [M2]
export const chuDoiXong = (vang: number, ngay: number): string => `Đã đổi xong. Em có ${chuVangSo(vang)}, thần thú vẫn đủ ${chuNgayAn(ngay)}.` // [M3]
export const chuDaMac = (ten: string): string => `Đã mặc ${ten}.` // [M4]
export const chuDaCoi = (ten: string): string => `Đã cởi ${ten}.` // [M4]
/** Không còn món nào vừa số vàng: nói món rẻ nhất chưa có + lời [D1]/[D2]. Mục 9 không có khuôn ghép tên — CHỜ MỤC 9. */
export const chuMonKeChuaDu = (ten: string, chiDuong: string): string => `${ten}: ${chiDuong}` // CHỜ MỤC 9

// ── Chỉ đường tới món kế [D1–D5] ──
export const chuChiDuongDuExp = 'Em có đủ EXP thừa. Đổi vàng là mua được.' // [D1]
export const chuChiDuongNgay = (n: number): string => `Học đều khoảng ${so(n)} ngày nữa là đủ vàng.` // [D2]
export const chuChiDuongChuoi = (n: number): string => `Giữ chuỗi thêm ${so(n)} ngày nữa là mở.` // [D3]
export const chuChiDuongAn = (n: number): string => `Kiếm thêm ${so(n)} ấn thạch sáng ở Đoàn Hộ Tống là mở.` // [D4]
export const chuChiDuongNhiemVu = 'Làm nhiệm vụ hôm nay để ống nghiệm đầy thêm.' // [D5]

// ── Bảy trạng thái của một món (9.2) + dạng dài của khoá [S1–S4] ──
export const chuTrangThai = {
  dangThu: 'Đang thử',
  duVang: 'Đủ vàng rồi',
  daCo: 'Đã có',
  dangMac: 'Đang mặc',
  daHet: 'Đã hết',
} as const
export const chuThieuVang = (n: number): string => `Chưa đủ vàng — còn thiếu ${chuVangSo(n)}`
/** "Cần chuỗi 14 ngày" / "Cần chuỗi 14 ngày + 5 ấn thạch sáng" — dạng ngắn của khoá. */
export const chuCanChuoiNgan = (chuoi: number | null, an: number | null): string => `Cần ${[chuoi ? `chuỗi ${so(chuoi)} ngày` : '', an ? `${so(an)} ấn thạch sáng` : ''].filter(Boolean).join(' + ')}`
/** Giá trị dòng "Cần có": "Chuỗi 14 ngày + 5 ấn thạch sáng". */
export const chuCanCoGiaTri = (chuoi: number | null, an: number | null): string => [chuoi ? `Chuỗi ${so(chuoi)} ngày` : '', an ? `${so(an)} ấn thạch sáng` : ''].filter(Boolean).join(' + ')
/** [S1] / [S2] — dạng dài của khoá, nói em đang ở đâu: "chuỗi 14 ngày (em đang chuỗi 9 ngày)". */
export const chuKhoaChuoiDai = (can: number, dang: number): string => `chuỗi ${so(can)} ngày (em đang chuỗi ${so(dang)} ngày)`
export const chuKhoaAnDai = (can: number, dang: number): string => `${so(can)} ấn thạch sáng (em đang có ${so(dang)} ấn thạch)`
export const chuCanDai = (phan: readonly string[]): string => `Cần ${phan.join(' và ')}`
export const chuKhongCan = 'Không cần' // CHỜ MỤC 9 (dòng "Cần có" của món không có điều kiện)
export const chuChiCon = (n: number): string => `Chỉ còn ${so(n)} cái` // [S3]
export const chuMuaChiCo = (n: number): string => `Mùa 1 chỉ có ${so(n)} cái` // [S3]
export const chuSoLuongDai = (con: number, tong: number): string => `Chỉ còn ${so(con)} cái · mùa 1 có ${so(tong)} cái` // [S3]
export const chuKhongGioiHan = 'Không giới hạn' // CHỜ MỤC 9 (dòng "Số lượng" của món không giới hạn)
/** [S4] — ghép từ lời `thieu` của máy chủ: "Chưa mua được — cần chuỗi 14 ngày (em đang chuỗi 9 ngày)". */
export const chuChuaMuaDuoc = (thieu: string): string => `Chưa mua được — ${thieu.charAt(0).toLocaleLowerCase('vi-VN')}${thieu.slice(1)}`

// ── Trống [R1–R4] ──
export const chuTuDoTrong = 'Tủ đồ còn trống. Ghé Cửa hàng chọn món đầu tiên, có món chỉ 20 vàng.' // [R1]
export const chuOTrong = 'Chưa có món nào cho chỗ này.' // [R2]
export const chuChuaThuMon = 'Em chưa thử món nào. Chạm một phụ kiện ở Cửa hàng, thần thú mặc thử liền.' // [R3]
export const chuChuaCoExpThuaLoi = (giuLai: number): string => `Chưa có EXP thừa. Thần thú cần giữ ${so(giuLai)} EXP để ăn.` // [R4]

// ── Lỗi bằng lời phía màn (lời máy chủ hiện thẳng ở `loi`; hai chuỗi này chỉ dùng khi KHÔNG có lời máy chủ) ──
export const chuTamDong = 'Cửa hàng đang tạm đóng. Đồ em đã mua vẫn còn nguyên.' // [L7]
export const chuMatMang = 'Mất mạng rồi. Có mạng lại mới mua được, em vẫn xem được Tủ đồ.' // [L9]
export const chuLoiKhongRo = 'Cửa hàng chưa tải được. Em bấm Thử lại nhé.' // [L10]

// ── Nhãn trợ năng + chữ phụ mà mục 9 chưa có — CHỜ MỤC 9 ──
export const chuVeDao = 'Về Đảo thần thú' // CHỜ MỤC 9 (nhãn nút quay lại của Cửa hàng)
export const chuVeCuaHang = 'Về Cửa hàng' // CHỜ MỤC 9 (nhãn nút quay lại của Thử đồ, Tủ đồ)
export const chuLocNhan = 'Lọc theo chỗ đeo trên thần thú' // CHỜ MỤC 9
export const chuThanhKeoNhan = 'Số EXP thừa em muốn đổi thành vàng' // CHỜ MỤC 9
export const chuDoiToiDa = (n: number): string => `Đổi được nhiều nhất ${chuExp(n)}` // CHỜ MỤC 9 (nhãn đầu mút thanh kéo)
export const chuDangTai = 'Đang tải' // CHỜ MỤC 9 (nhãn trợ năng của khung xám giữ chỗ)
export const chuNhanKhungTen = 'Tên em đặt cho thần thú' // CHỜ MỤC 9 (dòng nhỏ trên khung tên, chữ của mẫu phác 204d27e)
export const chuThuCuaEm = (ten?: string): string => (ten ? `Thần thú của em: ${ten}` : 'Thần thú của em') // CHỜ MỤC 9 (nhãn trợ năng của sân khấu; danh từ chung đi trước tên riêng — chuẩn A1.2)
/** Nhãn trợ năng của thẻ món ở Cửa hàng (chạm = thử). */
export const chuTheMon = (ten: string, bac: Bac, gia: number, trangThai: string): string => `Thử ${ten}. ${TEN_BAC[bac]}. Giá ${chuVangSo(gia)}. ${trangThai}` // CHỜ MỤC 9

// ── Lời chung khi máy chủ không kèm lời (mã lỗi mới: lời tạm theo hợp đồng, chờ Boss viết) — CHỜ MỤC 9 ──
export const chuLoiTheoMa: Readonly<Record<string, string>> = { // CHỜ MỤC 9 (ba mã lỗi mới: lời tạm theo hợp đồng)
  khong_co_mon: 'Không tìm thấy món này.',
  sap_mo: 'Món này chưa mở bán. Em quay lại sau nhé.',
  sai_dau_vao: 'Yêu cầu chưa đúng. Em thử lại nhé.',
}

// ── Lời máy chủ MẪU [L1–L8]: CHỈ máy chủ giả (du-lieu-mau.ts) dùng. Máy thật tự trả lời ở trường `loi`; màn không viết lại. ──
export const loiMayChu = {
  duoiNguong: (giuLai: number, toiDa: number): string => `Thần thú cần giữ lại ${so(giuLai)} EXP để ăn. Em đổi được tối đa ${so(toiDa)} EXP.`, // [L1]
  thieuVang: (n: number): string => `Chưa đủ vàng — còn thiếu ${chuVangSo(n)}.`, // [L2]
  chuaMo: (can: number, dang: number): string => `Món này cần chuỗi ${so(can)} ngày. Em đang chuỗi ${so(dang)} ngày.`, // [L3]
  hetSuat: (tong: number): string => `Món này đã hết. Mùa 1 chỉ có ${so(tong)} cái.`, // [L4]
  daCo: 'Em đã có món này rồi. Vào Tủ đồ để mặc.', // [L5]
  giaDoi: 'Giá vừa thay đổi, em xem lại rồi mua nhé.', // [L6]
  tamDong: chuTamDong, // [L7]
  chuaCo: 'Em chưa có món này nên chưa mặc được.', // [L8]
  matMang: chuMatMang, // [L9]
  loiKhongRo: chuLoiKhongRo, // [L10]
} as const
