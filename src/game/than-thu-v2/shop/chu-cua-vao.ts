// NHÃN CỬA VÀO của Cửa hàng (một chữ) — tách riêng để nút ở Bảng nhiệm vụ (gói chính) KHÔNG kéo cả chu-shop.ts vào gói chính:
// module dùng chung giữa gói chính và gói nạp lười bị gộp NGUYÊN vào gói chính (đo ở bản dựng: chu-shop lọt vào index). Định nghĩa MỘT chỗ; chu-shop.ts nhập lại và xuất lại.
export const chuCuaHang = 'Cửa hàng' // [N1]
