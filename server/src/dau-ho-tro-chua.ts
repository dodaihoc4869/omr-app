// Cùng một định nghĩa dấu trợ giúp cho sửa lỗi, kiểm chứng và lịch kiểm lại.
// Chỉ mở khung hỏi chưa là đọc hướng dẫn; các nguồn dưới đã phục vụ nội dung.
export const SQL_DAU_HO_TRO_CHUA = "(co_ho_so=1 OR nguon LIKE '%:tro_ly' OR nguon LIKE '%:goi_y' OR nguon LIKE '%:thay_go' OR nguon LIKE '%:giai_kho' OR nguon='goi7:sau_nop')"
