// Đang ở TRONG màn chữa câu sai (12/10): lời giải trong khung "Chữa trực tiếp câu gốc" có nút Hỏi thầy, mà nút ấy kèm nút
// "Chữa câu sai từng bước" (NutChuaTungBuoc) — bấm ở đây sẽ mở lồng thêm một màn chữa CHÍNH câu đang chữa. Màn chữa bọc cây con
// bằng ngữ cảnh này ⇒ nút ấy tự ẩn; mọi chỗ khác (Câu đã làm, báo cáo ca, Tu luyện…) không đổi.
import { createContext } from 'react'

export const TrongManChua = createContext(false)
