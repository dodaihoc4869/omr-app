// KHO CÂU CỦA MOL — MỘT CHỖ DUY NHẤT để thầy sửa / thêm câu (thầy 01/11 tối). Bong bóng trên đầu Mol (Lộ trình) chọn câu XOAY VÒNG theo lượt
// (src/lib/lua-cam-xuc.ts `chonCau`): tất định, không lặp liền câu vừa hiện. Câu dài tự xuống ≤ 2 dòng ở 390 px (3 dòng nếu không thể khác, ≤ 80 ký tự).
// Cấp giận: 2 dỗi · 3 bực · 4 cáu · 5 rất cáu (src/lib/lua-cam-xuc.ts). Câu nguyên văn thầy giữ nguyên chữ; sửa câu nào thì sửa thẳng trong mảng.

/** Các câu DỖI / BỰC thầy gửi (dùng chung cho cấp 2–3, xen với câu ngắn). */
const CAU_DOI_THAY = [
  'Nhét data vào đầu đi, thầy ăn cơm em không thể no được.',
  'Em không thể trồng cây chuối mà lại ra quả bưởi được.',
  'Để học giỏi Hoá cần 2 điều kiện: hiểu tiếng Việt và giỏi toán lớp 4.',
  'Học thật, nỗ lực thật thì kết quả mới thật được.',
  'Luôn phải thật khiêm hạ. Luôn phải thật xứng đáng.',
] as const

/** GIẬN VÌ CÂU CHƯA ĐƯỢC TÍNH (làm vội, đối phó) — gọi thẳng hành vi, gắt dần theo cấp. */
export const KHO_DOI_PHO: Readonly<Record<2 | 3 | 4 | 5, readonly string[]>> = {
  // 2 · dỗi: câu ngắn + câu dỗi của thầy
  2: ['Ơ, lại vội rồi đấy.', ...CAU_DOI_THAY],
  // 3 · bực: câu ngắn + câu dỗi của thầy
  3: ['Bực thật đấy! Lại đối phó.', ...CAU_DOI_THAY],
  // 4 · cáu (xen một câu dỗi của thầy)
  4: ['Cáu rồi nhé! Đối phó mãi thế?', 'Không biết học đối phó có lợi ích gì?', 'Học thật, nỗ lực thật thì kết quả mới thật được.'],
  // 5 · rất cáu — hai câu cuối Boss gọt nhẹ từ nguyên văn thầy («Mất công học thì học thật mẹ đi» / «Nộp rõ nhiều tiền mà sao lại học láo thế nhỉ»);
  //     thầy bảo dùng nguyên văn thì thay ngay ở đây
  5: ['Tại sao phải đối phó với một giáo viên top 3 miền Bắc dạy Hoá?', 'Mất công học thì học thật đi!', 'Bố mẹ nộp bao nhiêu tiền, sao lại học láo thế nhỉ?'],
}

/** GIẬN VÌ MUỘN MÀ CHƯA ĐỦ CÂU — giục vào học, cùng giọng (không nói «đối phó» khi em chưa làm). */
export const KHO_GIUC_HOC: Readonly<Record<2 | 3 | 4 | 5, readonly string[]>> = {
  // 2 · dỗi
  2: ['Ơ, muộn rồi đấy.', ...CAU_DOI_THAY],
  // 3 · bực
  3: ['Bực thật đấy! Học ngay đi.', ...CAU_DOI_THAY],
  // 4 · cáu
  4: ['Cáu rồi nhé! Sao chưa học?'],
  // 5 · rất cáu
  5: ['Đủ rồi! Vào học ngay!'],
}

/** CHÂN NGÔN lúc VUI (thầy: «Lúc nào vui vẻ thêm các câu chân ngôn chân lý») — nguyên văn; 1/3 lượt vui thay lời khen bằng một câu ở đây. */
export const KHO_CHAN_NGON: readonly string[] = [
  'Cái gì nhận ra được thì không phải là ta.',
  'Lòng biết ơn là nguyên lý của sự giàu có.',
  'Năng lực của tình yêu là chữa lành và nuôi lớn.',
  'Tập trung vào quá trình, kết quả là tất yếu.',
]
