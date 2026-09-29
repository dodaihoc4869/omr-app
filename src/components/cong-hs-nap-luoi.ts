// MÁY YẾU (29/09): hai khối cổng học sinh chỉ hiện khi em BẤM mở (tab Bảng tin, hộp Khắc phục câu sai).
// Gom vào MỘT điểm nạp lười để Rolldown sinh ít mảnh (precache ≤ 170 tệp — scripts/kiem-sw.mjs); StudentPortalScreen nạp tệp này bằng import().
// (Tab Khắc phục — LuyenDeChuan/KhoiKhacPhuc3CheDo — thử tách rồi: sinh thêm 4 mảnh con, precache vượt 170 ⇒ để nguyên trong cổng.)
export { default as BangTinPhuHuynh } from './BangTinPhuHuynh'
export { default as ModalKhacPhucCauSai } from './ModalKhacPhucCauSai'
