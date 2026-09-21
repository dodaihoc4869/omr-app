// DANH MỤC PHỤ KIỆN THẦN THÚ — 40 món, nguồn DUY NHẤT cho máy chủ và giao diện (hợp đồng docs/hop-dong-shop-phu-kien-2109.md mục 1; bảng giá + chữ đã chốt: DE-XUAT-SHOP-PHU-KIEN-2109.md mục 3, chữ commit 7655c2c).
// Giá và điều kiện học ĐI QUA SOÁT COMMIT + test khoá (tests/phu-kien-danh-muc-2109.test.ts); máy chủ luôn là nơi quyết giá (giao diện gửi lại `giaThay`, lệch ⇒ `gia_doi`). KHÔNG dùng API riêng của trình duyệt (máy chủ nhập tệp này).
// Mã = tiền tố chỗ đeo + số thứ tự trong chỗ đeo (đúng sổ hình của Code 4: src/game/than-thu-v2/phu-kien/phu-kien-mon.ts): HQ Vòng sáng · VD Đuôi sáng · KT Khung tên · DA Trên đầu · CL Trên lưng.
export const PHIEN_BAN = 'm1-v1'
/** Mùa bán hiện tại (chữ "Mùa 1" hiện trên màn). */
export const MUA_BAN = 'm1'
/** Đợt mở bán: món có `moBan <= DOT_MO_BAN` mới được trả/bán. Đợt 2 (16 món Trên đầu + Trên lưng) chờ bảng điểm đặt theo loài của làn mỹ thuật; Boss đổi thành 2. */
export const DOT_MO_BAN: 1 | 2 = 1
/** Năm chỗ đeo (khoá máy chủ, không đổi): Vòng sáng · Đuôi sáng · Khung tên · Trên đầu · Trên lưng. */
export const O_GAN = ['hao-quang', 'vet', 'khung', 'dau', 'co-lung'] as const
export type OGanPhuKien = (typeof O_GAN)[number]
/** Bậc 1–5 = Thường · Đẹp · Hiếm · Sử thi · Huyền thoại. */
export type BacPhuKien = 1 | 2 | 3 | 4 | 5
export interface MonPhuKien {
  ma: string
  o: OGanPhuKien
  bac: BacPhuKien
  /** Giá bằng vàng (1 EXP thừa = 1 vàng). */
  gia: number
  /** Tên hiện trên màn (≤ 4 từ, không tên chất). */
  ten: string
  /** Dòng "Bật mí Hoá học" (≤ 14 từ, danh pháp 2018). */
  batMi: string
  /** Cần chuỗi N ngày ĐẠT nhiệm vụ ngày; null = không cần. */
  canChuoiNgay: number | null
  /** Cần M ấn thạch sáng (từ Đoàn Hộ Tống); null = không cần. */
  canAnThach: number | null
  /** Số cái tối đa của cả mùa; null = không giới hạn. */
  suatTong: number | null
  /** 1 = đợt 1 (24 món); 2 = đợt 2 (16 món, chờ bảng điểm đặt theo loài). */
  moBan: 1 | 2
}
const m = (ma: string, o: OGanPhuKien, bac: BacPhuKien, gia: number, ten: string, batMi: string, canChuoiNgay: number | null, canAnThach: number | null, suatTong: number | null, moBan: 1 | 2): MonPhuKien => ({ ma, o, bac, gia, ten, batMi, canChuoiNgay, canAnThach, suatTong, moBan })

export const DANH_MUC_PHU_KIEN: readonly MonPhuKien[] = [
  m('HQ-01', 'hao-quang', 1, 20, 'Vòng Sương Mai', 'Sương là hơi nước gặp lạnh, ngưng tụ thành giọt nhỏ li ti.', null, null, null, 1),
  m('HQ-02', 'hao-quang', 1, 40, 'Thảm Đỏ Xanh', 'Giấy quỳ tím gặp acid hoá đỏ, gặp base hoá xanh.', null, null, null, 1),
  m('HQ-03', 'hao-quang', 2, 150, 'Vòng Lửa Vàng', 'Đốt muối sodium, ngọn lửa chuyển sang màu vàng.', null, null, null, 1),
  m('HQ-04', 'hao-quang', 2, 220, 'Thảm Tinh Thể Xanh', 'Tinh thể copper(II) sulfate ngậm nước có màu xanh lam.', null, null, null, 1),
  m('HQ-05', 'hao-quang', 3, 600, 'Vòng Sáng Neon', 'Khí neon phát sáng đỏ cam khi có dòng điện chạy qua.', null, null, null, 1),
  m('HQ-06', 'hao-quang', 3, 850, 'Thảm Kim Cương', 'Kim cương chỉ gồm carbon; mỗi nguyên tử nối bốn nguyên tử khác.', null, null, null, 1),
  m('HQ-07', 'hao-quang', 4, 2400, 'Dải Cực Quang', 'Màu lục của cực quang do nguyên tử oxygen trên cao phát ra.', 7, null, null, 1),
  m('HQ-08', 'hao-quang', 5, 9000, 'Vòng Nguyên Tử Vàng', 'Electron chuyển động rất nhanh quanh hạt nhân, tạo thành đám mây electron.', 14, 5, 20, 1),
  m('VD-01', 'vet', 1, 20, 'Đuôi Bong Bóng', 'Bọt trong nước ngọt có ga là khí carbon dioxide thoát ra.', null, null, null, 1),
  m('VD-02', 'vet', 1, 30, 'Dấu Chân Muối', 'Hạt muối ăn (sodium chloride) kết tinh thành khối lập phương.', null, null, null, 1),
  m('VD-03', 'vet', 1, 60, 'Đuôi Giọt Hồng', 'Phenolphthalein không màu, gặp dung dịch base thì chuyển hồng.', null, null, null, 1),
  m('VD-04', 'vet', 2, 120, 'Đuôi Lửa Tím', 'Đốt muối potassium, ngọn lửa chuyển sang màu tím.', null, null, null, 1),
  m('VD-05', 'vet', 2, 200, 'Đuôi Lửa Xanh Lục', 'Đốt muối copper(II), ngọn lửa chuyển sang màu xanh lục.', null, null, null, 1),
  m('VD-06', 'vet', 3, 700, 'Đuôi Pháo Sáng', 'Magnesium cháy sáng trắng chói, nên được dùng làm pháo sáng.', null, null, null, 1),
  m('VD-07', 'vet', 4, 2000, 'Đuôi Sao Băng Đỏ', 'Muối strontium tạo màu đỏ tươi cho pháo hoa.', 7, null, null, 1),
  m('VD-08', 'vet', 5, 7500, 'Đuôi Tia Sét', 'Dòng điện trong dây kim loại là dòng electron chuyển động có hướng.', 21, null, 25, 1),
  m('KT-01', 'khung', 1, 20, 'Khung Thuỷ Tinh', 'Thuỷ tinh nấu từ cát, thành phần chính là silicon dioxide.', null, null, null, 1),
  m('KT-02', 'khung', 1, 40, 'Khung Nhãn Lọ', 'Hình thoi viền đỏ trên nhãn báo hoá chất nguy hiểm.', null, null, null, 1),
  m('KT-03', 'khung', 1, 50, 'Khung Ô Nguyên Tố', 'Bảng tuần hoàn có 118 nguyên tố, mỗi ô một nguyên tố.', null, null, null, 1),
  m('KT-04', 'khung', 2, 180, 'Khung Bạc Sáng', 'Silver (bạc) dẫn điện tốt nhất trong các kim loại.', null, null, null, 1),
  m('KT-05', 'khung', 2, 250, 'Khung Lục Giác', 'Phân tử benzene là một vòng sáu cạnh gồm sáu nguyên tử carbon.', null, null, null, 1),
  m('KT-06', 'khung', 3, 500, 'Khung Thạch Anh Tím', 'Thạch anh tím có màu tím nhờ lẫn một chút iron (sắt).', null, null, null, 1),
  m('KT-07', 'khung', 4, 1800, 'Khung Đổi Màu', 'Lớp oxide mỏng trên titanium làm ánh sáng giao thoa, tạo nhiều màu.', null, null, null, 1),
  m('KT-08', 'khung', 5, 6000, 'Khung Vàng 999', 'Vàng 999 chứa 99,9 % gold, để lâu không gỉ.', 14, null, 30, 1),
  m('DA-01', 'dau', 1, 30, 'Kính Bảo Hộ', 'Kính bảo hộ che mắt khỏi hoá chất bắn vào khi làm thí nghiệm.', null, null, null, 2),
  m('DA-02', 'dau', 1, 60, 'Mũ Phễu Lọc', 'Phễu và giấy lọc giữ lại chất rắn, cho chất lỏng chảy qua.', null, null, null, 2),
  m('DA-03', 'dau', 2, 140, 'Nơ Đôi', 'Hai vạch song song trong công thức là liên kết đôi, như ở ethylene.', null, null, null, 2),
  m('DA-04', 'dau', 2, 240, 'Mũ Bình Sủi Bọt', 'Bình cầu đáy tròn giúp dung dịch nóng đều khi đun.', null, null, null, 2),
  m('DA-05', 'dau', 3, 550, 'Nguyệt Quế Đồng', 'Copper (đồng) để lâu ngoài không khí ẩm sẽ phủ lớp gỉ xanh.', null, null, null, 2),
  m('DA-06', 'dau', 3, 900, 'Sừng Cầu Vồng', 'Tinh thể bismuth mọc thành bậc thang vuông, óng ánh bảy màu.', null, null, null, 2),
  m('DA-07', 'dau', 4, 2600, 'Vương Miện Thạch Anh', 'Thạch anh trong suốt là silicon dioxide kết tinh, cứng hơn thuỷ tinh.', 7, null, null, 2),
  m('DA-08', 'dau', 5, 12000, 'Vương Miện Bạch Kim', 'Platinum (bạch kim) không gỉ, còn giúp lọc khí thải ô tô.', 30, 5, 10, 2),
  m('CL-01', 'co-lung', 1, 30, 'Khăn Loang Màu', 'Chấm mực lên giấy lọc rồi nhúng nước, mực tách thành nhiều màu.', null, null, null, 2),
  m('CL-02', 'co-lung', 1, 50, 'Vòng Cổ Ngọc Trai', 'Ngọc trai, vỏ sò, đá vôi đều chủ yếu là calcium carbonate.', null, null, null, 2),
  m('CL-03', 'co-lung', 2, 160, 'Áo Nhà Khoa Học', 'Áo thí nghiệm màu trắng để dễ thấy vết hoá chất dính vào.', null, null, null, 2),
  m('CL-04', 'co-lung', 2, 250, 'Khăn Lửa Trắng', 'Magnesium cháy trong không khí tạo bột trắng magnesium oxide.', null, null, null, 2),
  m('CL-05', 'co-lung', 3, 650, 'Cánh Giọt Nước', 'Phân tử nước hình chữ V, góc giữa hai liên kết khoảng 104,5°.', null, null, null, 2),
  m('CL-06', 'co-lung', 3, 800, 'Ba Lô Bóng Bay', 'Khí helium nhẹ hơn không khí nên kéo bóng bay lên.', null, null, null, 2),
  m('CL-07', 'co-lung', 4, 3000, 'Cánh Bóng Đêm', 'Graphene là lớp carbon dày đúng một nguyên tử, xếp hình lục giác.', 7, null, null, 2),
  m('CL-08', 'co-lung', 5, 10000, 'Áo Choàng Ngân Hà', 'Hydrogen là nguyên tố nhiều nhất vũ trụ, nhiên liệu của các vì sao.', 28, null, 15, 2),
]

const THEO_MA = new Map(DANH_MUC_PHU_KIEN.map((x) => [x.ma, x] as const))
/** Món theo mã; mã lạ / không phải chuỗi ⇒ undefined. */
export const docMonPhuKien = (ma: unknown): MonPhuKien | undefined => (typeof ma === 'string' ? THEO_MA.get(ma) : undefined)
/** Món đang được bán (đúng đợt mở). */
export const monDangBan = (): MonPhuKien[] => DANH_MUC_PHU_KIEN.filter((x) => x.moBan <= DOT_MO_BAN)
