// MÁY YẾU (29/09): hai khối cổng học sinh chỉ hiện khi em BẤM mở (tab Bảng tin, hộp Khắc phục câu sai).
// Gom vào MỘT điểm nạp lười để Rolldown sinh ít mảnh (precache ≤ 170 tệp — scripts/kiem-sw.mjs); StudentPortalScreen nạp tệp này bằng import().
// Tab Khắc phục: LuyenDeChuan nay nạp khi mở (13/10), không precache.
// Gói C 15/10 (app mở nhanh hơn): thêm ba khối chỉ hiện khi em BẤM mở tab — Khắc phục (KhoiKhacPhuc3CheDo, kéo theo cửa nạp kho đề, thẻ câu,
// thuật toán rút câu sai), Bài tập về nhà (BtvnM3), Bài gia đình giao (MomM3). Cùng mảnh này ⇒ không thêm tệp precache; cổng nạp trước lúc rảnh.
export { default as BangTinPhuHuynh } from './BangTinPhuHuynh'
export { default as ModalKhacPhucCauSai } from './ModalKhacPhucCauSai'
export { default as KhoiKhacPhuc3CheDo } from './KhoiKhacPhuc3CheDo'
export { default as BtvnM3 } from './bang-nhiem-vu/BtvnM3'
export { MomDanhSachM3, MomLamBaiM3 } from './bang-nhiem-vu/MomM3'
// 25/10 (tức thì hơn nữa): tab «Xem điểm» (LichSuCaM3) cũng chỉ hiện khi em BẤM ⇒ vào mảnh này, lượt mở /hs bớt mã của nó.
export { default as LichSuCaM3 } from './bang-nhiem-vu/LichSuCaM3'
// Bong bóng A.I Đỗ Đại Học (24/10): cửa nạp nằm Ở ĐÂY (không ở StudentPortalScreen) ⇒ danh sách mảnh kèm của import() không vào lượt mở /hs; bong bóng vẫn là mảnh riêng ngoài precache.
export const napBong = () => import('./ai-ddh/BongBongAiDdh')

// MÁY YẾU 27/10 (thầy: «Máy yếu bị lag»): mảnh này nạp lúc rảnh sau khi Lộ trình hiện ⇒ đo nhịp khung thật ở đây (src/lib/do-nhip-khung.ts):
// thông số máy trông ổn mà khung hình chậm ⇒ bật chế độ máy yếu ngay + nhớ cho lần mở sau. Không thêm tệp, không cộng byte lượt mở.
import { henDoNhipKhung } from '../lib/do-nhip-khung'
if (typeof window !== 'undefined') henDoNhipKhung(window)
