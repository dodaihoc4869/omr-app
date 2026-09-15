/**
 * SÁU CON — SÁU DÁNG, SÁU CHẤT NGẦU RIÊNG.
 *
 * Thầy chốt 15-09: *"thay đổi 6 con thú mỗi con 1 hình dạng khác nhau, có độ
 * ngầu riêng, lông lá nhiều hơn chút phù hợp với thị hiếu giới trẻ chút"*.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * BẢN TRƯỚC SAI Ở ĐÂU. Sáu con dùng CHUNG một bộ khung chibi: cùng tỉ lệ đầu
 * thân, cùng tai tròn, cùng mõm, cùng đuôi. Khác nhau đúng ba thứ: màu, công
 * thức trên huy hiệu, và khung cảnh đứng. Che màu đi thì không ai phân biệt
 * nổi Hoả Long với Mộc Tinh — sáu con hoá ra một con sơn sáu màu.
 *
 * BẢN NÀY cho mỗi con một BỘ SỐ DÁNG riêng, và một NÉT KÝ riêng không con nào
 * có. Vẫn một bộ mã dựng, nhưng đọc số từ bảng dưới nên sáu bóng đổ khác hẳn:
 *
 *   Hoả      Xích Phượng Nhiệt Nhôm    → PHƯỢNG
 *   Acid     Tử Giác Kỳ Lân Cường Toan → KỲ LÂN
 *   Base     Huyền Quy Kết Tủa BaSO₄   → QUY
 *   Khí      Thanh Long Halogen        → LONG
 *   Điện hoá Lôi Lân Điện Cực          → LÂN
 *   Hữu cơ   Bích Long Ester Polymer   → THUỶ LONG
 *
 * "Lông lá nhiều hơn" làm bằng hai núm: `dayLong` (bề dày bộ lông) và số lớp vỏ
 * — nâng chung cho cả sáu, rồi mỗi con lệch thêm một chút theo tính cách.
 */

/**
 * KHUNG XƯƠNG — thứ quyết định con thú là CON GÌ.
 *
 * Thầy chốt 15-09: *"Mỗi thần thú phải khác nhau hoàn toàn về hình dáng. Có
 * con dáng long ly quy phượng. Không con nào được giống con nào."*
 *
 * Đổi tai, đổi tỉ lệ đầu thân là chưa đủ — che màu đi vẫn ra sáu con gấu bông
 * cùng một khuôn. Sáu khung dưới đây khác nhau ở CẤU TRÚC: số chân, thân nằm
 * ngang hay đứng, có mai hay không, có cổ hay không.
 *
 *   long     Thanh Long Halogen        thân rắn uốn khúc, sừng nai, râu, cánh dơi
 *   quy      Huyền Quy Kết Tủa          mai vòm vảy lục giác, bốn chân ngắn, sừng nhỏ
 *   kyLan    Tử Giác Kỳ Lân Cường Toan  ngựa bốn chân, HAI sừng xoắn, bờm và đuôi bay
 *   phuong   Xích Phượng Nhiệt Nhôm     chim lửa, cánh xoè lớn, mào ngọn lửa, đuôi lửa
 *   lan      Lôi Lân Điện Cực           sư tử bờm dày, sừng, bốn chân, đuôi chùm
 *   thuyLong Bích Long Ester Polymer    rồng nước, mào lá dọc lưng, vây, cánh dơi
 */
export type KhungXuong = 'long' | 'quy' | 'kyLan' | 'phuong' | 'lan' | 'thuyLong'

/** Kiểu tai — quyết định bóng đổ của đầu, thứ mắt nhận ra đầu tiên. */
export type KieuTai = 'tron' | 'nhon' | 'vay' | 'dai' | 'chop' | 'la'

/** Nét ký riêng — không con nào có nét của con nào. */
export type NetKy = 'bomGay' | 'vayLung' | 'gaiVai' | 'longXu' | 'chomToc' | 'laVai'

export interface DangThu {
  /** Khung xương — thứ quyết định con thú là CON GÌ. */
  khung: KhungXuong
  /** Cỡ đầu (x, y, z). Chibi gốc là 1,02 · 0,96 · 0,98. */
  coDau: readonly [number, number, number]
  /** Cỡ thân dưới. Gốc 0,74 · 0,66 · 0,70. */
  coThan: readonly [number, number, number]
  /** Vị trí thân dưới theo trục đứng. Gốc −0,74. */
  yThan: number
  kieuTai: KieuTai
  /** Mõm dài ngắn: nhân vào cỡ mõm gốc. */
  coMom: number
  /** Bề dày bộ lông thân. Gốc cũ 0,17 — nay tối thiểu 0,22. */
  dayLong: number
  /** Cộng thêm bao nhiêu lớp vỏ so với mặc định của máy. */
  themLop: number
  netKy: NetKy
  /** Số đốt đuôi. Gốc 3. */
  soDotDuoi: number
}

const MAC_DINH: DangThu = {
  khung: 'lan',
  coDau: [1.02, 0.96, 0.98],
  coThan: [0.74, 0.66, 0.7],
  yThan: -0.74,
  kieuTai: 'tron',
  coMom: 1,
  dayLong: 0.24,
  themLop: 2,
  netKy: 'longXu',
  soDotDuoi: 3,
}

export const DANG_THU: Record<string, DangThu> = {
  // HOẢ — vạm vỡ, tai nhọn vểnh, bờm gáy dựng. Dáng hổ báo.
  hoa_long: {
    khung: 'phuong',
    coDau: [0.66, 0.68, 0.74], coThan: [0.6, 0.84, 0.62], yThan: -0.72,
    kieuTai: 'nhon', coMom: 1.12, dayLong: 0.27, themLop: 3,
    netKy: 'bomGay', soDotDuoi: 4,
  },
  // ACID — đầu tròn to, thân thấp bè, tai vây cá, lông mượt sát. Dáng quái nước.
  thuy_quai: {
    khung: 'kyLan',
    coDau: [0.72, 0.76, 0.96], coThan: [0.6, 0.56, 0.96], yThan: -0.78,
    kieuTai: 'vay', coMom: 0.92, dayLong: 0.2, themLop: 1,
    netKy: 'vayLung', soDotDuoi: 3,
  },
  // BASE — vuông vức, thân dày nhất, tai ngắn, gai tinh thể trên vai. Dáng giáp sĩ.
  thiet_giap: {
    khung: 'quy',
    coDau: [0.66, 0.6, 0.72], coThan: [1.02, 0.5, 0.94], yThan: -0.92,
    kieuTai: 'tron', coMom: 0.88, dayLong: 0.23, themLop: 2,
    netKy: 'gaiVai', soDotDuoi: 2,
  },
  // KHÍ — đầu nhỏ, thân thon cao, tai dài thỏ, lông xù bay. Dáng nhanh nhẹn.
  loi_dieu: {
    khung: 'long',
    coDau: [0.7, 0.72, 1.06], coThan: [0.62, 0.6, 0.66], yThan: -0.62,
    kieuTai: 'dai', coMom: 0.95, dayLong: 0.31, themLop: 4,
    netKy: 'longXu', soDotDuoi: 5,
  },
  // ĐIỆN HOÁ — đầu vừa, thân gọn, tai chóp nhọn, chỏm tóc dựng đứng. Tinh nghịch.
  loi_kim: {
    khung: 'lan',
    coDau: [0.88, 0.84, 0.92], coThan: [0.72, 0.62, 1.0], yThan: -0.78,
    kieuTai: 'chop', coMom: 1.0, dayLong: 0.26, themLop: 3,
    netKy: 'chomToc', soDotDuoi: 4,
  },
  // HỮU CƠ — tròn ũm, tai lá bè, lông dày nhất. Dáng hiền lành.
  moc_tinh: {
    khung: 'thuyLong',
    coDau: [0.72, 0.74, 1.02], coThan: [0.62, 0.6, 0.68], yThan: -0.64,
    kieuTai: 'la', coMom: 0.94, dayLong: 0.34, themLop: 4,
    netKy: 'laVai', soDotDuoi: 3,
  },
}

export function dangCua(idThu: string): DangThu {
  return DANG_THU[idThu] ?? MAC_DINH
}
