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
 *   Hoả Long   LONG   — thân rắn uốn khúc, cổ dài, râu rồng, bờm gáy
 *   Hải Quái   QUY    — mai vòm trên lưng, bốn chân ngắn, vây lưng
 *   Bảo Thần   LY     — kỳ lân bốn chân, một sừng, gai tinh thể trên vai
 *   Phong Lôi  PHƯỢNG — chim, mỏ, mào dựng, đuôi lông dài xoè
 *   Lôi Kim    MIÊU   — linh miêu hai chân, chân dài, chỏm tóc dựng
 *   Mộc Tinh   GẤU    — gấu bốn chân mập, lá vai, lông dày nhất
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
 *   long   rồng      thân rắn uốn khúc dựng đứng, cổ dài, râu, sừng nai
 *   quy    rùa       mai vòm to trên lưng, thân thấp bè, bốn chân ngắn
 *   ly     kỳ lân    bốn chân, thân nằm ngang, cổ vươn, một sừng giữa trán
 *   phuong phượng    chim: thân trứng đứng, mỏ, mào, đuôi lông dài xoè
 *   mieu   linh miêu hai chân, thân thon cao, chân dài, dáng chồm tới
 *   gau    gấu       bốn chân mập, thân tròn thấp, đầu gục xuống
 */
export type KhungXuong = 'long' | 'quy' | 'ly' | 'phuong' | 'mieu' | 'gau'

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
  khung: 'gau',
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
    khung: 'long',
    coDau: [0.7, 0.72, 1.08], coThan: [0.62, 0.6, 0.66], yThan: -0.62,
    kieuTai: 'nhon', coMom: 1.12, dayLong: 0.27, themLop: 3,
    netKy: 'bomGay', soDotDuoi: 4,
  },
  // ACID — đầu tròn to, thân thấp bè, tai vây cá, lông mượt sát. Dáng quái nước.
  thuy_quai: {
    khung: 'quy',
    coDau: [0.66, 0.6, 0.7], coThan: [1.02, 0.5, 0.94], yThan: -0.92,
    kieuTai: 'vay', coMom: 0.92, dayLong: 0.2, themLop: 1,
    netKy: 'vayLung', soDotDuoi: 3,
  },
  // BASE — vuông vức, thân dày nhất, tai ngắn, gai tinh thể trên vai. Dáng giáp sĩ.
  thiet_giap: {
    khung: 'ly',
    coDau: [0.8, 0.8, 1.0], coThan: [0.66, 0.6, 0.98], yThan: -0.74,
    kieuTai: 'tron', coMom: 0.88, dayLong: 0.23, themLop: 2,
    netKy: 'gaiVai', soDotDuoi: 2,
  },
  // KHÍ — đầu nhỏ, thân thon cao, tai dài thỏ, lông xù bay. Dáng nhanh nhẹn.
  loi_dieu: {
    khung: 'phuong',
    coDau: [0.68, 0.7, 0.72], coThan: [0.6, 0.86, 0.6], yThan: -0.72,
    kieuTai: 'dai', coMom: 0.95, dayLong: 0.31, themLop: 4,
    netKy: 'longXu', soDotDuoi: 5,
  },
  // ĐIỆN HOÁ — đầu vừa, thân gọn, tai chóp nhọn, chỏm tóc dựng đứng. Tinh nghịch.
  loi_kim: {
    khung: 'mieu',
    coDau: [0.98, 0.9, 0.92], coThan: [0.6, 0.82, 0.58], yThan: -0.66,
    kieuTai: 'chop', coMom: 1.0, dayLong: 0.26, themLop: 3,
    netKy: 'chomToc', soDotDuoi: 4,
  },
  // HỮU CƠ — tròn ũm, tai lá bè, lông dày nhất. Dáng hiền lành.
  moc_tinh: {
    khung: 'gau',
    coDau: [1.16, 1.06, 1.04], coThan: [0.94, 0.7, 0.92], yThan: -0.84,
    kieuTai: 'la', coMom: 0.94, dayLong: 0.34, themLop: 4,
    netKy: 'laVai', soDotDuoi: 3,
  },
}

export function dangCua(idThu: string): DangThu {
  return DANG_THU[idThu] ?? MAC_DINH
}
