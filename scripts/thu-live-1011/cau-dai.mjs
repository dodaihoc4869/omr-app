// CÂU CÓ ĐỀ DÀI cho bộ thử «cuộn đề» (13/11 — thầy: «Đề trên máy học sinh không vuốt cuộn xuống được»). Dùng chung cho trang thử (tờ của thầy dựng
// từ `text`) và máy chủ thử (câu công khai của lượt gửi xuống máy em, `textEm` nếu có). Không dữ liệu học sinh thật.
//   Q3 — đề dài hơn CẢ ô giấy của thầy (và mọi khung giấy máy em) ⇒ giấy SOI khớp giấy thầy; phần dưới nằm ngoài ô giấy thầy đang thấy.
//   Q4 — câu của lượt khác chữ trên tờ (giấy lệch)               ⇒ máy em DỰNG THƯỜNG (`.lv-de`), nét trên giấy ẩn.
const MO = 'Hỗn hợp X gồm ethanol, propan-1-ol và phenol. Chia X thành ba phần bằng nhau. '
const P1 = 'Phần một tác dụng hết với sodium dư, thu được 3,7185 lít khí hydrogen (đkc). '
const P2 = 'Phần hai tác dụng vừa đủ với 100 mL dung dịch sodium hydroxide 1 M. '
const P3 = 'Phần ba đem đốt cháy hoàn toàn rồi dẫn toàn bộ sản phẩm qua bình đựng dung dịch calcium hydroxide dư, thấy khối lượng bình tăng 44,2 gam và có 70 gam kết tủa. '
const HOI = 'Biết các phản ứng xảy ra hoàn toàn. Phần trăm khối lượng của propan-1-ol trong hỗn hợp X gần nhất với giá trị nào sau đây?'
const THEM = 'Để kiểm tra lại, một bạn lấy thêm một phần nữa cho tác dụng với nước bromine dư, lọc lấy kết tủa trắng, rửa sạch, sấy khô rồi cân được 33,1 gam. Bạn khác đem phần nước lọc chưng cất để thu hồi hai alcohol, sau đó oxi hoá không hoàn toàn bằng copper(II) oxide nung nóng và cho sản phẩm tráng bạc. '
const PA = ['24,5 %', '31,6 %', '38,2 %', '45,1 %']
const DAI = MO + P1 + P2 + P3 + THEM + THEM.replace('33,1', '16,55') + THEM.replace('33,1', '8,275')

export const CAU_DAI = [
  { qid: 'Q3', text: DAI + HOI, choices: PA },
  { qid: 'Q4', text: DAI + HOI, textEm: DAI + 'Hai bạn so kết quả với nhau. ' + HOI, choices: PA },
]
