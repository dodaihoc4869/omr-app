// CỔNG NHỊP — KHACPHUCTREOHANGLOAT.md T2 ("Chỉ gửi lưu tạm khi đáp án THẬT SỰ đổi").
//
// Một ca 45 phút, 30 em, nhịp lưu tạm 20 giây = 4 050 lượt gọi, tức 1,5 lượt mỗi
// giây LIÊN TỤC suốt ca. Nhưng em làm 28 câu thì đáp án chỉ đổi 28 lần — hơn một
// trăm nhịp còn lại đang gửi lại y nguyên thứ máy chủ đã có. Bỏ những nhịp đó là
// chỗ cắt được nhiều nhất mà KHÔNG đánh đổi gì: không đổi thì không có gì để mất.
//
// ─────────────────────────────────────────────────────────────────────────────
// CÁI BẪY mà tệp này sinh ra để chặn
//
// Cách viết tự nhiên nhất là: ghi nhớ chữ ký RỒI gửi.
//
//     daGui = van
//     void gui(...)          // ← nhịp này rớt mạng
//
// Máy em đã ghi "bản này gửi rồi" trong khi máy chủ chưa hề nhận. Mười lăm phút
// cuối em ngồi soát bài, không đổi thêm ô nào, nên MỌI nhịp sau đều thấy "y
// nguyên" và bỏ qua. Máy chủ giữ mãi bản cũ. Thầy khoá ca giữa giờ là chấm đúng
// bản cũ ấy: em mất sạch số câu làm sau nhịp rớt, và không ai biết vì không có
// lỗi nào hiện ra.
//
// Cổng này chỉ ghi nhớ khi máy chủ ĐÃ XÁC NHẬN. Nhịp hỏng thì chữ ký cũ giữ
// nguyên, nên nhịp sau tự gửi lại — dù em không đổi gì.
//
// ─────────────────────────────────────────────────────────────────────────────
// BA VIỆC, chỉ ba việc:
//   1. bỏ nhịp khi nội dung KHÔNG đổi (theo NỘI DUNG, không theo đồng hồ);
//   2. không bắn chồng khi lượt trước còn đang bay;
//   3. vẫn gửi lại theo nhịp tim để máy chủ biết máy em còn sống.

export class CongNhip {
  /** Chữ ký MÁY CHỦ ĐÃ XÁC NHẬN. Cố ý KHÔNG phải "chữ ký đã bắn đi". */
  private daNhan = ''
  /** Mốc máy chủ xác nhận lần cuối. 0 = chưa lần nào. */
  private mocNhan = 0
  /** Có lượt đang bay không. */
  private bay = false
  /** Dù nội dung không đổi vẫn gửi lại sau ngần này. 0 = không có nhịp tim.
   * Đây là gửi DÀY THÊM, không phải thưa đi — cấm dùng nó để giãn nhịp theo
   * đồng hồ (mục 4 của đặc tả). */
  private readonly nhipTimMs: number

  constructor(nhipTimMs = 0) {
    this.nhipTimMs = nhipTimMs
  }

  /** Nhịp này có đáng gửi không. */
  nenGui(van: string, nay: number = Date.now()): boolean {
    if (this.bay) return false
    if (van !== this.daNhan) return true
    if (this.nhipTimMs <= 0) return false
    return nay - this.mocNhan >= this.nhipTimMs
  }

  /** Bắt đầu bay. Gọi ngay trước khi gửi. */
  batDau(): void {
    this.bay = true
  }

  /** Máy chủ đã nhận — TỪ GIỜ mới được phép bỏ nhịp cho nội dung này. */
  xong(van: string, nay: number = Date.now()): void {
    this.bay = false
    this.daNhan = van
    this.mocNhan = nay
  }

  /** Gửi hỏng — thả cờ bay, giữ nguyên chữ ký cũ để nhịp sau gửi lại. */
  hong(): void {
    this.bay = false
  }

  /** Cho phép kiểm tra trong test và trong màn hình. */
  dangBay(): boolean {
    return this.bay
  }
}

/** NHỊP TIM CỦA LƯU TẠM. Đặc tả T2: "Vẫn gửi lại ít nhất mỗi 5 phút".
 *
 * Cắt từ 135 lượt/em/ca xuống còn (số lần đổi đáp án + tối đa 9 nhịp tim). Chín
 * lượt là 6,7% tải cũ — trả giá đó để có một bản đối chứng đều đặn trên máy chủ
 * là đáng: nhịp tim bắt được cả trường hợp máy chủ nhận rồi ghi hụt. */
export const NHIP_TIM_LUU_TAM_GIAY = 300
