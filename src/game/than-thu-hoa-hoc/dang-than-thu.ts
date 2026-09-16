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
 *   Hoả      Nhiệt Nhôm Triều Dương Phượng → PHƯỢNG
 *   Acid     Cường Toan Ngân Hà Kỳ Lân     → KỲ LÂN
 *   Base     Trầm Tủa Vạn Niên Thần Quy    → QUY
 *   Khí      Halogen Cung Đình Thần Long   → LONG
 *   Điện hoá Điện Cực Sơn Lâm Kim Lân      → LÂN
 *   Hữu cơ   Trùng Hợp Thuỷ Phù Long Thần  → THUỶ LONG
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
 *   long     Halogen Cung Đình Thần Long   thân rắn uốn khúc, sừng nai, râu, vây má
 *   quy      Trầm Tủa Vạn Niên Thần Quy    mai vòm vảy lục giác, bốn chân ngắn, mỏ sừng
 *   kyLan    Cường Toan Ngân Hà Kỳ Lân     ngựa bốn chân, HAI sừng xoắn, bờm và đuôi bay
 *   phuong   Nhiệt Nhôm Triều Dương Phượng chim lửa, cánh xoè lớn, mào ngọn lửa, đuôi lửa
 *   lan      Điện Cực Sơn Lâm Kim Lân      sư tử bờm dày vòng kín, sừng, bốn chân, vằn
 *   thuyLong Trùng Hợp Thuỷ Phù Long Thần  rồng nước, mào lá dọc lưng, vây, sừng nhánh
 */
export type KhungXuong = 'long' | 'quy' | 'kyLan' | 'phuong' | 'lan' | 'thuyLong'

/** Kiểu tai — quyết định bóng đổ của đầu, thứ mắt nhận ra đầu tiên. */
export type KieuTai = 'tron' | 'nhon' | 'vay' | 'dai' | 'chop' | 'la'

/**
 * KIỂU MẶT — thứ cuối cùng còn giống nhau sau khi đã tách sáu khung xương.
 *
 * Ảnh chụp 16-09 cho thấy: thân đã ra sáu con khác hẳn (rắn, mai rùa, bốn
 * chân, chân chim) nhưng SÁU CÁI MẶT vẫn là một cái mặt gấu bông — cùng mắt
 * tròn to, cùng mũi hồng, cùng miệng cười, cùng má hồng. Nhìn vào mặt thì
 * không phân biệt nổi con nào với con nào.
 *
 *   thu   Lân   mõm bè, nanh, má hồng, mắt tròn      — mặt thú dữ dễ thương
 *   rong  Long  mõm dài, đồng tử dọc, không má hồng  — mặt bò sát
 *   chim  Phượng mỏ thay mõm, không tai, không má    — mặt chim
 *   huou  Kỳ Lân mõm dài thanh, mắt hiền, mi cong    — mặt hươu
 *   quy   Quy   mỏ sừng, gờ mày dày, mắt nhỏ sâu     — mặt rùa già
 *   thuy  Thuỷ Long mõm ngắn, vây má, đồng tử dọc    — mặt rồng nước
 */
export type KieuMat = 'thu' | 'rong' | 'chim' | 'huou' | 'quy' | 'thuy'

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
  /** Kiểu mặt — mắt, mõm, mũi, má. Xem `KieuMat`. */
  kieuMat: KieuMat
  /** Mõm dài ngắn: nhân vào cỡ mõm gốc. */
  coMom: number
  /**
   * Bề dày bộ lông thân, tính theo tỉ lệ bán kính khối được bọc.
   *
   * SỬA 16-09. Bản 15-09 để 0,20…0,34 — lông dài gấp bốn lần cái mức mà toạ độ
   * mặt và phụ kiện được viết cho (0,07). Hậu quả đo được trên ảnh chụp: mắt,
   * mõm, mỏ phượng, bờm sư tử, vằn hổ đều nằm TRONG bộ lông, sáu con hoá sáu
   * quả trứng xù giống hệt nhau. Nay rút còn 0,11…0,18 (vẫn dày hơn 0,07 cũ
   * nhiều) và bù lại bằng THÊM LỚP vỏ: lông ngắn mà dày lớp ra nhung, lông dài
   * mà thưa lớp ra bồ công anh.
   */
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
  kieuMat: 'thu',
  coMom: 1,
  dayLong: 0.14,
  themLop: 3,
  netKy: 'longXu',
  soDotDuoi: 3,
}

export const DANG_THU: Record<string, DangThu> = {
  // HOẢ — vạm vỡ, tai nhọn vểnh, bờm gáy dựng. Dáng hổ báo.
  hoa_long: {
    khung: 'phuong',
    coDau: [0.66, 0.68, 0.74], coThan: [0.6, 0.84, 0.62], yThan: -0.72,
    kieuTai: 'nhon', kieuMat: 'chim', coMom: 1.12, dayLong: 0.15, themLop: 4,
    netKy: 'bomGay', soDotDuoi: 4,
  },
  // ACID — đầu tròn to, thân thấp bè, tai vây cá, lông mượt sát. Dáng quái nước.
  thuy_quai: {
    khung: 'kyLan',
    coDau: [0.72, 0.76, 0.96], coThan: [0.6, 0.56, 0.96], yThan: -0.78,
    kieuTai: 'vay', kieuMat: 'huou', coMom: 0.92, dayLong: 0.11, themLop: 2,
    netKy: 'vayLung', soDotDuoi: 3,
  },
  // BASE — vuông vức, thân dày nhất, tai ngắn, gai tinh thể trên vai. Dáng giáp sĩ.
  thiet_giap: {
    khung: 'quy',
    coDau: [0.66, 0.6, 0.72], coThan: [1.02, 0.5, 0.94], yThan: -0.92,
    kieuTai: 'tron', kieuMat: 'quy', coMom: 0.88, dayLong: 0.13, themLop: 3,
    netKy: 'gaiVai', soDotDuoi: 2,
  },
  // KHÍ — đầu nhỏ, thân thon cao, tai dài thỏ, lông xù bay. Dáng nhanh nhẹn.
  loi_dieu: {
    khung: 'long',
    coDau: [0.7, 0.72, 1.06], coThan: [0.62, 0.6, 0.66], yThan: -0.62,
    kieuTai: 'dai', kieuMat: 'rong', coMom: 0.95, dayLong: 0.17, themLop: 5,
    netKy: 'longXu', soDotDuoi: 5,
  },
  // ĐIỆN HOÁ — đầu vừa, thân gọn, tai chóp nhọn, chỏm tóc dựng đứng. Tinh nghịch.
  loi_kim: {
    khung: 'lan',
    coDau: [0.88, 0.84, 0.92], coThan: [0.72, 0.62, 1.0], yThan: -0.78,
    kieuTai: 'chop', kieuMat: 'thu', coMom: 1.0, dayLong: 0.14, themLop: 4,
    netKy: 'chomToc', soDotDuoi: 4,
  },
  // HỮU CƠ — tròn ũm, tai lá bè, lông dày nhất. Dáng hiền lành.
  moc_tinh: {
    khung: 'thuyLong',
    coDau: [0.72, 0.74, 1.02], coThan: [0.62, 0.6, 0.68], yThan: -0.64,
    kieuTai: 'la', kieuMat: 'thuy', coMom: 0.94, dayLong: 0.18, themLop: 5,
    netKy: 'laVai', soDotDuoi: 3,
  },
}

export function dangCua(idThu: string): DangThu {
  return DANG_THU[idThu] ?? MAC_DINH
}
