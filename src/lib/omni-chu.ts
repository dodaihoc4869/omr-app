// CHỮ HIỂN THỊ CỦA OMNI 3 — MỘT NGUỒN cho máy chủ (server/src/omni-*.ts import tệp này) và ba app.
// Luật chữ: docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md (A1: số có nhãn, một khái niệm một từ, không nhãn năng lực, không doạ, không hứa 100%).
// Thầy lệnh 05/10: chữ MỚI dùng "A.I Đỗ Đại Học" làm chủ ngữ thay "máy" (chữ "máy" chỉ THIẾT BỊ giữ nguyên: máy chủ, máy em…).
// Thầy lệnh 05/10: giữ nguyên giao diện hiện tại — các chữ ở đây là DÒNG THÊM vào thẻ/khung sẵn có, ngắn, cùng giọng với chữ cũ.
// Hàm thuần, không đọc đồng hồ.

export const TEN_AI = 'A.I Đỗ Đại Học'

/** 0,82 — xác suất/tỉ lệ 0..1 viết thập phân dấu phẩy, 2 chữ số. */
export function soP(p: number): string {
  return (Math.round(Math.max(0, Math.min(1, p)) * 100) / 100).toFixed(2).replace('.', ',')
}
/** "6%" — tỉ lệ 0..1 thành phần trăm nguyên, viết LIỀN như phần lớn app (ô "Làm đúng 79%" cùng thẻ). */
export function phanTram(p: number): string {
  return `${Math.round(Math.max(0, Math.min(1, p)) * 100)}%`
}
/** Độ tin hiển thị: KHÔNG BAO GIỜ 100% (kẹp 99%). */
export function doTinChu(p: number): string {
  return `${Math.min(99, Math.round(Math.max(0, Math.min(1, p)) * 100))}%`
}
/** "1 phút 05 giây" · "42 giây" từ mili-giây. */
export function thoiLuongChu(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 60) return `${s} giây`
  const p = Math.floor(s / 60)
  const g = s % 60
  return `${p} phút ${String(g).padStart(2, '0')} giây`
}
/** Điểm 1 chữ số thập phân dấu phẩy: 8,5. */
export function diemChu(d: number): string {
  return (Math.round(d * 10) / 10).toFixed(1).replace('.', ',')
}

// ---------------------------------------------------------------- dòng thêm dưới kết quả một câu
export const CHU_LUOT = 'Câu này em bấm nhanh quá nên chưa tính. Mai làm lại câu này.'
export function chuDungNhungCham(msLam: number, msThuong: number): string {
  return `Đúng nhưng chậm: em mất ${thoiLuongChu(msLam)}, mức thường của em ${thoiLuongChu(msThuong)}. Dạng này chưa tính vững — mai gặp câu tương tự để làm nhanh hơn.`
}
export const CHU_DUNG_CHUA_CHAC = 'Đúng. Em chọn "Chưa chắc" nên câu này sẽ quay lại sớm cho chắc hẳn.'
export const CHU_CHAC_MA_SAI = 'Em chắc mà sai — đây là chỗ đáng xem nhất hôm nay. Mở lời giải từng bước bên dưới.'
/** Nút/chip tự tin trên thẻ câu (mặc định = Chắc; chạm chip trước khi chọn đáp án ⇒ Chưa chắc). */
export const CHIP_CHUA_CHAC = 'Chưa chắc'
export const GOI_Y_CHIP_CHUA_CHAC = `Chạm "Chưa chắc" trước khi chọn nếu em còn phân vân — giúp ${TEN_AI} chọn đúng câu cho em hơn. Không trừ gì cả.`
/** Hai nút Chắc / Chưa chắc của màn Đoàn (thầy 06/10: "Nút chưa chắc với chắc đổi màu dễ nhìn hơn nhé, và bấm nó chưa phản hồi"): nhãn nút Chắc, câu hỏi cho đọc màn hình, bóng báo ngay khi bấm. */
export const CHIP_CHAC = 'Chắc'
export const HOI_CHAC = 'Em có chắc đáp án này không?'
export const BONG_CHAC = 'Đã chọn: Chắc'
export const BONG_CHUA_CHAC = 'Đã chọn: Chưa chắc · câu này sẽ quay lại sớm'

// ---------------------------------------------------------------- Trạm hồi phục
export const TIEU_DE_TRAM = 'Trạm hồi phục'
export function chuTram(tenLoi: string | null, coCauNen: boolean): string {
  const loi = tenLoi ? `3 câu em vừa sai đều vướng ở bước ${tenLoi}.` : '3 câu vừa rồi khó với em.'
  return coCauNen
    ? `${loi} ${TEN_AI} cho em 3 câu nhỏ để gỡ bước này rồi quay lại. Không mất Máu.`
    : `${loi} ${TEN_AI} đổi ải tiếp theo dễ hơn một bậc. Không mất Máu.`
}

// ---------------------------------------------------------------- CHƯƠNG TRÌNH "CẨN THẬN" (đặc tả 4.6; thầy 06/10) — CHỈ hiện cho em máy chủ báo `canThan` (Sơ ý > 7%)
/** (b) Ô một chạm trước khi nộp câu Phần III — chữ đúng đặc tả; KHÔNG bắt buộc, không chặn nút nộp. */
export const CHU_SOAT_LAI = 'Soát lại đơn vị và số liệu'
export const GOI_Y_SOAT_LAI = 'Đọc lại đề một lượt: đơn vị đã đổi đúng chưa, số liệu đã chép đúng chưa. Chạm khi em đã soát xong — không bắt buộc, không trừ gì cả.'
/** (c) Thẻ sau lượt chắc-mà-sai ở câu em đã vững: em chạm MỘT bước (hoặc "Em chưa rõ") — ghi lại, không chấm. */
export const TIEU_DE_BUOC_SAI = 'Em biết câu này. Sai vì bước nào?'
export const NUT_EM_CHUA_RO = 'Em chưa rõ'
export const CHU_DA_GHI_BUOC_SAI = 'Đã ghi lại lựa chọn của em. Không chấm điểm.'
export const CHU_LOI_GHI_BUOC_SAI = 'Chưa ghi được lựa chọn. Em chạm lại nhé.'

// ---------------------------------------------------------------- Sảnh (dòng thêm trong thẻ chiến dịch sẵn có)
export function chuDangVung(a: number, b: number): string {
  return `Dạng vững ${a}/${b}`
}
export function chuConDangDe8(n: number | null): string | null {
  if (n == null) return null
  return n <= 0 ? 'Đủ dạng vững để chạm mốc 8 — chờ ca chốt xác nhận' : `Còn ${n} dạng cần vững để chạm mốc 8`
}
export function chuSoY(s: number | null, mucTieu: number): string | null {
  if (s == null) return null
  return `Sơ ý ${phanTram(s)} (mục tiêu dưới ${phanTram(mucTieu)})`
}
export function chuChungChi(ten: string, doTin: number, ngay: string): string {
  return `${ten}: Sẵn sàng 8+ · độ tin ${doTinChu(doTin)} · kiểm bằng câu lạ ngày ${ngay}`
}
export function chuVe(con: number, tong: number): string {
  return `Vé thử thách ${con}/${tong}`
}
export const GOI_Y_VE = '3 câu cao hơn một bậc ở dạng em chọn. Sai không mất gì.'
export function chuOnBaiCu(n: number): string {
  return `Hôm nay ôn bài cũ: ${n} câu`
}
export const CHU_CHO_BAI_MOI = 'Đang ôn bài cũ, chờ thầy giao bài mới.'
export function chuMetGio(tiLe: number, tiLeTot: number): string {
  return `Giờ này em hay sai nhanh hơn lúc em học tốt nhất (${phanTram(tiLe)} so với ${phanTram(tiLeTot)}). ${TEN_AI} để câu ôn nhẹ lên trước; câu mới khó có thể để mai.`
}
export const NUT_DE_MAI = 'Để mai'
export const NUT_LAM_LUON = 'Làm luôn'
export function chuDeThu(soCau: number, phut: number): string {
  return `Đề thử ${soCau} câu · ${phut} phút (không bắt buộc)`
}

// ---------------------------------------------------------------- thầy
export const TIEU_DE_CAN_THAY_CHUA = 'Cần thầy chữa'
export const NUT_XAC_NHAN_VUNG = 'Thầy xác nhận em đã vững'
export const NUT_DAY_LAI = 'Chưa đạt, dạy lại'
export function chuKhoangCach8(kc: number | null): string {
  if (kc == null) return 'chưa đủ dữ liệu'
  return kc <= 0 ? 'đã chạm 8' : diemChu(kc)
}
export function chuDangHieuChuan(soCaChot: number, can: number): string {
  return `đang hiệu chỉnh: ${soCaChot}/${can} ca chốt`
}

// ---------------------------------------------------------------- phụ huynh
export function chuPhKhoangCach(kc: number | null): string | null {
  if (kc == null) return null
  return kc <= 0 ? 'Con đã chạm mốc 8 theo dự báo — chờ ca chốt xác nhận' : `Con còn ${diemChu(kc)} điểm tới 8`
}
