// SINH TỰ ĐỘNG bởi scripts/loi-giai-kinh/dung-tri-thuc.mjs từ docs/skill-ly-thuyet-thay/SKILL.md — KHÔNG sửa tay.
// Bảng thần chú của thầy (soát tay từng câu trong skill). Máy chủ chỉ nhận thần chú có đúng trong bảng này.
export interface ThanChu { chu: string; them: string; dung: string; goc: string }
export const THAN_CHU: readonly ThanChu[] = [
 {
  "chu": "Tăng thu, giảm toả",
  "them": "",
  "dung": "chuyển dịch cân bằng theo nhiệt độ",
  "goc": "1.C1 Cân bằng hoá học · xét chuyển dịch cân bằng theo nhiệt độ"
 },
 {
  "chu": "Bình thông nhau",
  "them": "bên nào dâng thì chảy sang bên kia",
  "dung": "chuyển dịch theo nồng độ, áp suất",
  "goc": "1.C1 · xét chuyển dịch cân bằng theo nồng độ"
 },
 {
  "chu": "Chống lại sự thay đổi đó",
  "them": "",
  "dung": "nguyên lí Le Chatelier",
  "goc": "1.C1 · nguyên lý Lơ Sa-tơ-li-ê và các yếu tố ảnh hưởng"
 },
 {
  "chu": "Tăng áp suất chọn phía ít mol khí, giảm áp suất chọn phía nhiều mol khí",
  "them": "",
  "dung": "chuyển dịch theo áp suất",
  "goc": "1.C1 · xét chuyển dịch cân bằng theo áp suất"
 },
 {
  "chu": "Khử cho, O nhận",
  "them": "",
  "dung": "chất khử, chất oxi hoá",
  "goc": "2009 Chương 4 Kĩ thuật xác định số OXH · chất khử, chất oxi hoá"
 },
 {
  "chu": "Cứ trung gian thì vừa giảm được, vừa tăng được",
  "them": "thấp nhất chỉ tăng, cao nhất chỉ giảm",
  "dung": "đoán tính oxi hoá / khử từ số oxi hoá",
  "goc": "7.C2 Nitrogen · số oxi hoá đặc trưng và tính chất hai mặt của N₂"
 },
 {
  "chu": "Ba câu thần chú ion",
  "them": ": ion từ base yếu có tính acid yếu; ion từ acid yếu có tính base yếu; mạnh với mạnh thì trung tính",
  "dung": "môi trường của muối, tính chất ion",
  "goc": "2007 Chương 7 Nhóm IA · xét tính chất của ion bằng ba câu thần chú"
 },
 {
  "chu": "Chiến thắng thuộc về kẻ mạnh",
  "them": "",
  "dung": "muối acid mạnh – base yếu và ngược lại",
  "goc": "4.C1 Acid base · xét môi trường của muối"
 },
 {
  "chu": "Lưỡng là hai",
  "them": "năm ion lưỡng tính phải thuộc, không xét",
  "dung": "ion lưỡng tính HCO₃⁻, HSO₃⁻, HS⁻, H₂PO₄⁻, HPO₄²⁻",
  "goc": "2007 Chương 7 · năm ion lưỡng tính phải học thuộc"
 },
 {
  "chu": "Electron độc thân là electron đang FA",
  "them": ", hai electron là đã xây dựng gia đình",
  "dung": "electron độc thân, liên kết, N≡N",
  "goc": "4.C1 Cấu hình electron · ký hiệu và trạng thái của obitan"
 },
 {
  "chu": "Ion dương thì trừ e từ ngoài vào trong của cấu hình đúng",
  "them": "",
  "dung": "cấu hình electron ion dương",
  "goc": "5.C1 Kĩ thuật cấu hình electron · ion dương"
 },
 {
  "chu": "Ion âm điền thêm e theo dãy phân mức năng lượng",
  "them": "",
  "dung": "cấu hình electron ion âm",
  "goc": "5.C1 · ion âm"
 },
 {
  "chu": "Thụ động là có nhưng lại không ra sản phẩm được",
  "them": "",
  "dung": "Fe, Al, Cr với HNO₃ đặc nguội",
  "goc": "10.C2 Oxide của nitrogen và nitric acid · thụ động"
 },
 {
  "chu": "Phú dưỡng là môi trường bị gút",
  "them": "thừa NO₃⁻, PO₄³⁻",
  "dung": "phú dưỡng",
  "goc": "10.C2 · phú dưỡng"
 },
 {
  "chu": "Giống nhau thì chơi với nhau",
  "them": "",
  "dung": "độ tan của hợp chất hữu cơ",
  "goc": "2008 Chương 3 Nền tảng hữu cơ P1 · độ tan"
 },
 {
  "chu": "Thuyết cấu tạo là ánh sáng soi đường",
  "them": "",
  "dung": "thuyết cấu tạo hoá học",
  "goc": "2008 Nền tảng hữu cơ · ba luận điểm của thuyết cấu tạo"
 },
 {
  "chu": "Gộp thì dễ, tách thì khó",
  "them": "",
  "dung": "công thức cấu tạo thu gọn ↔ chi tiết",
  "goc": "2008 Nền tảng hữu cơ · công thức cấu tạo"
 },
 {
  "chu": "Thành cái khung xương thôi, bỏ cái phần thịt đi",
  "them": "",
  "dung": "công thức cấu tạo khung",
  "goc": "2008 Nền tảng hữu cơ · công thức cấu tạo khung"
 },
 {
  "chu": "Nhổ răng",
  "them": ": coi 1 H là một cái răng, nhổ một H thành gốc",
  "dung": "đếm đồng phân gốc hydrocarbon",
  "goc": "1.C1 Ester · quy tắc nhổ răng"
 },
 {
  "chu": "H₂ là hai đĩa rau, brom là hai đĩa thịt",
  "them": "thức ăn của liên kết π",
  "dung": "phản ứng cộng của liên kết π",
  "goc": "1.C1 Ester · thức ăn của liên kết pi"
 },
 {
  "chu": "OH như \"em yêu\" chỉ yêu hai anh: carbon no và carbon thơm",
  "them": "",
  "dung": "nhóm OH bền, alcohol / phenol",
  "goc": "1.C1 Ester · quy luật nhóm OH bền"
 }
]
