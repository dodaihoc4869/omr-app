// Từ THEN CHỐT cho «Chạm để hiểu đề» (thầy chốt build 26/10): nghĩa ngắn + một câu tự hỏi.
// Mỗi dòng: «mã | cách viết 1; cách viết 2… | nghĩa | câu tự hỏi». Cách viết so khớp không phân biệt hoa thường,
// «hoà/hòa», «thuỷ/thủy» coi như một. Câu dính tới mol nói theo tư duy thầy: số mol là tiền, hiệu suất là đánh thuế.
import type { TheGiaiNghia } from './kieu'

const DONG = `hoan-toan|hoàn toàn;xảy ra hoàn toàn;phản ứng hoàn toàn|Phản ứng xảy ra đến cùng: ít nhất một chất ban đầu đã hết.|Chất nào hết, chất nào còn dư?
du|dư;còn dư;lượng dư|Chất đó được lấy nhiều hơn mức cần, sau phản ứng vẫn còn lại.|Tính theo chất hết. Chất dư còn nằm lại ở đâu: trong dung dịch hay trong chất rắn?
den-du|đến dư|Thêm mãi cho tới khi chất đó dư: mọi phản ứng có thể xảy ra đều đã xảy ra.|Khi chất này dư, kết tủa hay sản phẩm trước đó có bị hoà tan tiếp không?
vua-du|vừa đủ;vừa hết|Hai chất phản ứng hết cùng lúc, không chất nào dư.|Tiền (số mol) hai bên khớp nhau theo hệ số: biết tiền chất nào để tính chất kia?
co-can|cô cạn|Làm bay hơi hết nước (và chất dễ bay hơi như ethanol), chỉ còn chất rắn khan.|Chất rắn gồm những gì? Có chất nào dư (như NaOH) còn lại không?
chat-ran-khan|chất rắn khan;muối khan;rắn khan|Chất rắn đã hết nước.|Khối lượng chất rắn gồm mọi chất rắn còn lại, kể cả chất dư: đó là những chất nào?
dun-nong|đun nóng;đun sôi;nung nóng|Cấp nhiệt để phản ứng xảy ra (hoặc xảy ra nhanh hơn).|Khi nóng, chất nào bay hơi hoặc bị phân huỷ?
nung-kldk|nung đến khối lượng không đổi;khối lượng không đổi|Nung tới khi chất rắn không nhẹ đi nữa: sự phân huỷ đã xong hết.|Sau khi nung, chất rắn còn lại là chất gì (thường là oxide)?
nung|nung|Đun ở nhiệt độ rất cao, thường làm chất rắn bị phân huỷ.|Chất nào bị phân huỷ, tạo ra chất gì?
nhiet-phan|nhiệt phân|Dùng nhiệt để phân huỷ một chất.|Chất bị nhiệt phân tạo ra chất rắn nào, khí nào?
hieu-suat|hiệu suất|Phần trăm lượng chất thực sự chuyển thành sản phẩm. Tiền chuyển sang nhà sản phẩm bị đánh thuế: chỉ còn H%.|Đang tính xuôi (nguyên liệu → sản phẩm, × H/100) hay tính ngược (sản phẩm → nguyên liệu, × 100/H)?
thu-duoc|thu được|Sản phẩm lấy ra được sau thí nghiệm.|Thứ thu được là chất nào, ở dạng gì: khí, kết tủa, dung dịch hay chất rắn?
phan-ung-het|phản ứng hết;tan hết;hoà tan hết|Chất đó đã dùng hết, không còn lại.|Chất hết quyết định lượng sản phẩm: lấy tiền (số mol) của nó để tính.
toi-da|tối đa;cực đại;lớn nhất|Lượng lớn nhất có thể.|Lượng lớn nhất đạt được khi nào: chất nào vừa hết?
toi-thieu|tối thiểu;nhỏ nhất|Lượng nhỏ nhất cần dùng để mọi chất cần phản ứng đều phản ứng hết.|Ít nhất phải đủ tiền (số mol) cho phản ứng nào?
khi-thoat-ra|khí thoát ra;thoát ra;bay ra;giải phóng|Khí sinh ra rời khỏi dung dịch, không còn ở trong dung dịch.|Khí đó là chất gì? Khối lượng dung dịch giảm đi đúng bằng khối lượng khí (và kết tủa).
ket-tua|kết tủa|Chất rắn không tan sinh ra trong dung dịch.|Kết tủa là chất gì? Nó có tan tiếp khi thêm chất khác đến dư không?
loc|lọc;lọc bỏ;lọc lấy|Tách chất rắn (kết tủa) ra khỏi dung dịch.|Phần nào được giữ lại để tính tiếp: chất rắn hay dung dịch (nước lọc)?
trung-hoa|trung hoà|Acid và base phản ứng vừa đủ với nhau.|Tiền H⁺ bằng tiền OH⁻: biết bên nào thì tính được bên kia.
dien-phan|điện phân|Dùng dòng điện một chiều làm xảy ra phản ứng oxi hoá – khử.|Ở cathode, ở anode chất nào nhận hay nhường electron trước?
dien-cuc-tro|điện cực trơ|Điện cực không tham gia phản ứng (than chì, platinum).|Ở anode, ion nào nhường electron vì điện cực không tan?
mang-ngan|màng ngăn|Vách ngăn giữ cho sản phẩm ở hai điện cực không trộn vào nhau.|Nếu không có màng ngăn thì sản phẩm hai cực có phản ứng với nhau không?
dot-chay|đốt cháy hoàn toàn;đốt cháy|Cho chất tác dụng với oxygen. Chất hữu cơ cháy hoàn toàn tạo CO₂ và H₂O.|Nguyên tố C, H của chất đi đâu? (C vào CO₂, H vào H₂O)
hap-thu|hấp thụ hoàn toàn;hấp thụ;sục|Cho khí đi vào dung dịch (hoặc chất rắn) để bị giữ lại.|Khí bị giữ lại hết hay một phần? Tạo ra muối gì?
nho-tu-tu|nhỏ từ từ|Thêm từng giọt, nên các phản ứng xảy ra lần lượt theo thứ tự.|Chất nào phản ứng trước, chất nào sau?
thuy-phan|thuỷ phân|Phản ứng với nước (có acid hoặc base) cắt chất thành các phần nhỏ hơn.|Thuỷ phân xong thu được những chất nào?
xa-phong-hoa|xà phòng hoá|Thuỷ phân ester hoặc chất béo trong base, tạo muối và alcohol.|Một nhóm ester cần bao nhiêu base: nhà base giàu gấp mấy nhà ester?
este-hoa|ester hoá;este hoá|Acid carboxylic + alcohol tạo ester và nước; phản ứng thuận nghịch.|Hiệu suất ester hoá tính theo chất nào (chất hết nếu phản ứng hoàn toàn)?
len-men|lên men|Biến đổi chất nhờ enzyme của vi sinh vật (vd glucose thành ethanol).|Lên men tạo ra những chất nào? Có hiệu suất (bị đánh thuế) không?
loang|loãng|Dung dịch có ít chất tan, nhiều nước.|Với acid loãng, kim loại nào phản ứng, khí thoát ra là gì?
dac-nong|đặc, nóng;đặc nóng|Acid đặc và đun nóng: H₂SO₄, HNO₃ lúc này có tính oxi hoá mạnh.|Sản phẩm khử là khí gì? Kim loại lên số oxi hoá cao nhất chưa?
dac-nguoi|đặc, nguội;đặc nguội|Acid đặc ở nhiệt độ thường.|Al, Fe, Cr bị thụ động trong HNO₃, H₂SO₄ đặc, nguội: kim loại nào không tan?
dac|đặc|Dung dịch có rất nhiều chất tan.|Acid đặc (H₂SO₄, HNO₃) có tính oxi hoá mạnh: sản phẩm khử là gì?
bao-hoa|bão hoà|Dung dịch không hoà tan thêm được chất tan đó nữa.|Ở nhiệt độ này, 100 g nước hoà tan tối đa bao nhiêu gam chất (độ tan)?
pha-loang|pha loãng|Thêm nước vào dung dịch: tiền (số mol) chất tan không đổi, chỉ thể tích tăng.|Thêm nước thì tiền (số mol) chất tan có đổi không? Vì vậy C₁V₁ = C₂V₂.
xuc-tac|xúc tác|Chất làm phản ứng nhanh hơn nhưng không bị mất đi.|Chất xúc tác có tính vào lượng chất phản ứng không?
nhiet-do-thuong|nhiệt độ thường|Khoảng 25 °C, không đun nóng.|Ở nhiệt độ thường, phản ứng này có xảy ra không?
kl-dd-giam|khối lượng dung dịch giảm;khối lượng dung dịch tăng|Thay đổi khối lượng dung dịch sau phản ứng.|Cái gì vào dung dịch, cái gì ra khỏi dung dịch (khí, kết tủa)?
kl-binh-tang|khối lượng bình tăng|Bình giữ lại chất (như H₂O, CO₂) nên nặng thêm đúng bằng khối lượng chất bị giữ.|Bình này giữ lại chất nào?
ti-khoi|tỉ khối|So khối lượng mol của hai khí: d A/B = M_A : M_B.|Biết tỉ khối thì tìm được M của khí nào?`

export type TuThenChot = { ma: string; cachViet: string[]; nghia: string; tuHoi: string }

let _ds: TuThenChot[] | null = null
/** Danh sách từ then chốt (nạp lười). */
export function danhSachThenChot(): readonly TuThenChot[] {
  if (!_ds) _ds = DONG.split('\n').map((d) => { const [ma, cv, nghia, tuHoi] = d.split('|'); return { ma, cachViet: cv.split(';'), nghia, tuHoi } })
  return _ds
}

/** Chữ sau từ «đặc» khiến nó KHÔNG phải từ then chốt («đặc điểm», «đặc trưng»…). */
export const DAC_KHONG_PHAI = ['điểm', 'trưng', 'biệt', 'tính', 'sản', 'thù', 'sệt', 'quánh']

const hoaDau = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Thẻ cho từ then chốt; `chu` là chữ trong đề (để giữ nguyên cách viết). */
export function theThenChot(ma: string, chu = ''): TheGiaiNghia | null {
  const t = danhSachThenChot().find((x) => x.ma === ma)
  if (!t) return null
  const chuGoc = (chu || t.cachViet[0]).trim()
  return { ten: hoaDau(chuGoc), nhan: 'Từ then chốt', doan: [t.nghia, `Gặp «${chuGoc.toLowerCase()}» ⇒ tự hỏi: ${t.tuHoi}`] }
}
