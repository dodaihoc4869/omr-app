// BẢNG XANH THAN CỐ ĐỊNH của Live theo khối — tệp riêng (không nằm trong mau-chieu.ts) để chỉ các mảnh live theo khối nạp lười mới tải.
/** XANH THAN của Live theo khối (thầy 12/11 «nền xanh than tối chuẩn doligo … dịu mắt»): ĐÚNG bảng nền tối app học sinh (trong-hs-mau.css: nền · thẻ · viền ·
 *  chữ · màu chính · đúng · sai · chú ý) nhưng CỐ ĐỊNH — phòng chờ, màn bốn đội, chat, lớp nổi máy thầy luôn xanh than dù máy đang ở nền sáng và dù ở app
 *  thầy (không có `data-trong`). Gắn làm biến nội tuyến ở gốc từng lớp nổi: `--tr-*` (mảnh con đọc như trên app học sinh nền tối) + `--lk-*` (tên riêng). */
const XT = { nen: '#131f24', mat: '#202f36', mat2: '#263840', vien: '#37464f', chu: '#f1f7fb', chu2: '#dce6ec', chu3: '#c4d0d6', hs: '#7772ff', hsGo: '#3f00dc', dung: '#00d497', dungDay: '#00aa76', sai: '#f7498f', chuY: '#ff9447', tin: '#00bfd4', sao: '#ffc735' } as const
export const MAU_XANH_THAN: Record<string, string> = {
  '--tr-nen': XT.nen, '--tr-mat': XT.mat, '--tr-mat-2': XT.mat2, '--tr-mat-3': XT.vien, '--tr-vien': XT.vien, '--tr-chu': XT.chu, '--tr-chu-2': XT.chu2, '--tr-chu-3': XT.chu3,
  '--tr-hs': XT.hs, '--tr-hs-nut': XT.hs, '--tr-hs-go': XT.hsGo, '--tr-hs-tren': XT.chu, '--tr-dung': XT.dung, '--tr-dung-day': XT.dungDay, '--tr-sai': XT.sai, '--tr-chu-y': XT.chuY, '--tr-tin': XT.tin, '--tr-sao': XT.sao,
  '--lk-nen': XT.nen, '--lk-mat': XT.mat, '--lk-mat-2': XT.mat2, '--lk-vien': XT.vien, '--lk-chu': XT.chu, '--lk-chu-2': XT.chu2, '--lk-chu-3': XT.chu3, '--lk-nhan': XT.hs, '--lk-nhan-go': XT.hsGo,
  '--lk-dung': XT.dung, '--lk-dung-day': XT.dungDay, '--lk-sai': XT.sai, '--lk-chu-y': XT.chuY,
}

/** NỀN LUÔN TỐI của trò «Sinh Tồn · Trang vở» (thầy 13/11 «tối là #131f24 mặc định là nền này luôn nhé»): đúng bảng xanh than trên + viền sẫm. Gắn nội tuyến
 *  ở gốc màn trò (TroSinhTon.tsx) — không khai trong tokens.css để lượt mở ba app không nặng thêm byte nào (luật tốc độ 13/10). */
export const MAU_SINH_TON: Record<string, string> = { '--st-nen': XT.nen, '--st-mat': XT.mat, '--st-vien': XT.vien, '--st-vien-2': '#1a282e', '--st-chu': XT.chu }
