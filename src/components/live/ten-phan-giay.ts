// LIVE BẢNG — tên phần của câu trên đầu giấy, dùng chung giấy dựng (GiayDung.tsx) và giấy soi (GiayThay.tsx).
// Tách khỏi GiayDung.tsx (12/11, luật lint only-export-components: tệp component chỉ xuất component). Tệp riêng, KHÔNG gộp vào giay-thay-do.ts:
// GiayDung còn đi cùng trình phát «Xem lại Live» ⇒ phần đo của giấy soi không theo sang mảnh ấy.

/** Tên phần của câu trên đầu giấy. */
export const TEN_PHAN: Record<string, string> = { I: 'Trắc nghiệm', II: 'Đúng / Sai', III: 'Trả lời ngắn' }
