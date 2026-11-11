// XEM LẠI LIVE — MÁY EM (đợt X2, thầy chốt build 11/11; đặc tả docs/dac-ta-live-xem-lai-1011.md). Cửa của mảnh nạp lười `xem-lai-live`.
//   · mặc định: `XemBuoiLive({ id, ve, nguon: 'hs' | 'gv', dong })` — ĐIỂM VÀO DÙNG CHUNG mở xem một buổi (app thầy: nút «Mở» ở Lịch sử Live nhập lười tệp này);
//   · `ManLiveHs({ token, dong })` — màn của app học sinh (danh sách + trang buổi), mở từ dòng «Live» ở tấm «Thêm»;
//   · `demBuoiMoi(token)` — số buổi em chưa mở, cho chip «N buổi mới» (gọi `GET /hs/live-ds`, nhớ 10 phút).
// Trình phát (`TrinhPhat`) là mảnh lười riêng `xem-lai-phat`, chỉ tải khi em bấm phát / mở trang trên máy tính.
export { XemBuoiLive as default, default as ManLiveHs } from './ManLiveHs'
export { demBuoiMoi } from './may-chu'
