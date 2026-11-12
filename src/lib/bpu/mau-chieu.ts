// BẢNG MÀU MÀN CHIẾU của bảng Bình Phản Ứng (thầy 08/11 «nền dịu mắt giống màn chiếu cũ, đo chính xác»; bản vẽ docs/ban-ve-bpu-giay-0811, phương án B).
// ĐÚNG giá trị tờ chiếu cũ (src/lib/giao-dien-to-chieu.ts: NEN_BANG · GIAY · CHU · PHU · --mc-the · giấy «dark» ba bậc · nhãn sáng / tối) — test
// tests/bpu-mau-chieu-0811.test.ts đối chiếu từng mã với tờ. Tệp riêng (không nhập giao-dien-to-chieu) để mảnh bảng không kéo theo CSS của tờ.
export const MAU = { bang: '#131f24', giay: '#f4efe4', chu: '#22262b', phu: '#5b6168', the: '#e7e1d3', mat: '#23282d', mat2: '#2f353b', mat3: '#3b4148', nhan: '#0b57d0', nhanToi: '#a8c7fa' } as const
/** Biến CSS gắn lên gốc bảng; bpu-bang.css đè --tr-* bằng các biến này. */
export const MAU_CHIEU: Record<string, string> = {
  '--tr-chieu-bang': MAU.bang, '--tr-chieu-giay': MAU.giay, '--tr-chieu-chu': MAU.chu, '--tr-chieu-phu': MAU.phu, '--tr-chieu-the': MAU.the,
  '--tr-chieu-mat': MAU.mat, '--tr-chieu-mat-2': MAU.mat2, '--tr-chieu-mat-3': MAU.mat3, '--tr-chieu-nhan': MAU.nhan, '--tr-chieu-nhan-toi': MAU.nhanToi,
}
