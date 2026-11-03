// Câu có ảnh CỦA ĐỀ (sau_de / cuoi_cau — không phải ảnh phương án / ý / lời giải) ⇒ đáng xin cảnh «hình vẽ lại» (thầy 03/11: chỉ câu có hình). Tệp nhỏ, dùng được ở lượt mở app.
export const coHinhDe = (hinhAnh: ReadonlyArray<{ viTri?: string }> | null | undefined): boolean => !!hinhAnh?.some((h) => h.viTri === 'sau_de' || h.viTri === 'cuoi_cau')
