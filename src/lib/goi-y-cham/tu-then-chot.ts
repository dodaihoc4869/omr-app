// Từ THEN CHỐT cho «Chạm để hiểu đề» (thầy chốt build 26/10): nghĩa ngắn + một dòng kiến thức cụ thể.
// Mỗi dòng: «mã | cách viết 1; cách viết 2… | nghĩa | kiến thức thêm». Thầy 27/10 («Soát kĩ quá vô nghĩa»): bỏ mọi câu «tự hỏi …» chung chung;
// từ thường ai cũng hiểu («đun nóng», «thu được», «tối đa», «lọc», «nhiệt độ thường») để TRỐNG nghĩa ⇒ không có thẻ, không tô. Cách viết so khớp không phân biệt hoa thường,
// «hoà/hòa», «thuỷ/thủy» coi như một. Thầy 26/10: «Tạm thời bỏ tư duy tiền nhà» ⇒ nói thẳng bằng thuật ngữ.
import type { TheGiaiNghia } from './kieu'

const DONG = `hoan-toan|hoàn toàn;xảy ra hoàn toàn;phản ứng hoàn toàn|Phản ứng xảy ra đến cùng: ít nhất một chất ban đầu đã hết.|Lượng sản phẩm tính theo chất hết.
du|dư;còn dư;lượng dư|Chất được lấy nhiều hơn lượng cần, sau phản ứng vẫn còn.|Tính sản phẩm theo chất hết, không theo chất dư.
den-du|đến dư|Thêm tới khi chất đó dư: mọi phản ứng có thể xảy ra đều đã xảy ra.|Ví dụ: NaOH đến dư hoà tan hết kết tủa Al(OH)₃.
vua-du|vừa đủ;vừa hết|Hai chất phản ứng hết cùng lúc, không chất nào dư.|Số mol hai chất đúng tỉ lệ hệ số trong phương trình.
co-can|cô cạn|Làm bay hơi hết nước (và chất dễ bay hơi), còn lại chất rắn khan.|Chất rắn gồm muối tạo thành và chất không bay hơi còn dư (như NaOH dư).
chat-ran-khan|chất rắn khan;muối khan;rắn khan|Chất rắn không còn nước.|Gồm mọi chất rắn còn lại, kể cả chất dư không bay hơi.
dun-nong|đun nóng;đun sôi;nung nóng||
nung-kldk|nung đến khối lượng không đổi;khối lượng không đổi|Nung tới khi chất rắn không nhẹ đi nữa: phân huỷ đã xong.|Chất rắn còn lại thường là oxide kim loại.
nung|nung|Đun ở nhiệt độ rất cao, thường làm chất rắn bị phân huỷ.|Ví dụ: CaCO₃ → CaO + CO₂.
nhiet-phan|nhiệt phân|Dùng nhiệt để phân huỷ một chất.|Ví dụ: CaCO₃ → CaO + CO₂; 2NaHCO₃ → Na₂CO₃ + CO₂ + H₂O.
hieu-suat|hiệu suất|Phần trăm lượng chất thực sự thành sản phẩm.|Tính xuôi (nguyên liệu → sản phẩm) × H/100; tính ngược (sản phẩm → nguyên liệu) × 100/H.
thu-duoc|thu được||
phan-ung-het|phản ứng hết;tan hết;hoà tan hết|Chất đó đã phản ứng hết, không còn lại.|Lượng sản phẩm tính theo chất này.
toi-da|tối đa;cực đại;lớn nhất||
toi-thieu|tối thiểu;nhỏ nhất||
khi-thoat-ra|khí thoát ra;thoát ra;bay ra;giải phóng|Khí sinh ra rời khỏi dung dịch.|m dung dịch sau = m dung dịch trước + m chất thêm vào − m khí.
ket-tua|kết tủa|Chất rắn không tan sinh ra trong dung dịch.|Kết tủa tách khỏi dung dịch nên không tính vào khối lượng dung dịch.
loc|lọc;lọc bỏ;lọc lấy||
trung-hoa|trung hoà|Acid và base phản ứng vừa đủ với nhau.|n H⁺ = n OH⁻.
dien-phan|điện phân|Dùng dòng điện một chiều gây ra phản ứng oxi hoá – khử.|Cathode (cực âm): ion dương nhận electron. Anode (cực dương): ion âm hoặc H₂O nhường electron.
dien-cuc-tro|điện cực trơ|Điện cực không tham gia phản ứng (than chì, platinum).|Ở anode: Cl⁻ bị oxi hoá trước H₂O; SO₄²⁻, NO₃⁻ không bị oxi hoá (H₂O nhường electron, tạo O₂).
mang-ngan|màng ngăn|Vách ngăn giữ cho sản phẩm hai điện cực không trộn vào nhau.|Điện phân dung dịch NaCl có màng ngăn thu NaOH, H₂, Cl₂; không màng ngăn thì Cl₂ tác dụng với NaOH tạo nước Javel.
dot-chay|đốt cháy hoàn toàn;đốt cháy|Cho chất tác dụng với oxygen.|Chất hữu cơ chứa C, H (O) cháy hoàn toàn tạo CO₂ và H₂O.
hap-thu|hấp thụ hoàn toàn;hấp thụ;sục|Cho khí đi vào dung dịch (hoặc chất rắn) để bị giữ lại.|Ví dụ: CO₂ vào dung dịch kiềm tạo muối carbonate hoặc hydrogencarbonate.
nho-tu-tu|nhỏ từ từ|Thêm từng giọt nên các phản ứng xảy ra lần lượt.|Ví dụ: nhỏ từ từ HCl vào Na₂CO₃: tạo NaHCO₃ trước, sau đó mới có CO₂.
thuy-phan|thuỷ phân|Phản ứng với nước (xúc tác acid hoặc base) cắt chất thành phần nhỏ hơn.|Ester → acid (hoặc muối) + alcohol; tinh bột, cellulose → glucose.
xa-phong-hoa|xà phòng hoá|Thuỷ phân ester hoặc chất béo trong base, tạo muối và alcohol.|Chất béo: n NaOH = 3 × n chất béo, tạo glycerol.
este-hoa|ester hoá;este hoá|Acid carboxylic + alcohol ⇌ ester + nước (xúc tác H₂SO₄ đặc).|Phản ứng thuận nghịch nên hiệu suất nhỏ hơn 100%.
len-men|lên men|Biến đổi chất nhờ enzyme của vi sinh vật.|Lên men rượu: C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂.
loang|loãng|Dung dịch có ít chất tan, nhiều nước.|HCl, H₂SO₄ loãng + kim loại đứng trước H → muối + H₂.
dac-nong|đặc, nóng;đặc nóng|Acid đặc và đun nóng: H₂SO₄, HNO₃ có tính oxi hoá mạnh.|Kim loại lên số oxi hoá cao nhất; không tạo H₂ (tạo SO₂, NO₂…).
dac-nguoi|đặc, nguội;đặc nguội|Acid đặc ở nhiệt độ thường.|Al, Fe, Cr bị thụ động hoá trong HNO₃ và H₂SO₄ đặc, nguội (không tan).
dac|đặc|Dung dịch có rất nhiều chất tan.|H₂SO₄, HNO₃ đặc có tính oxi hoá mạnh.
bao-hoa|bão hoà|Dung dịch không hoà tan thêm được chất tan đó ở nhiệt độ ấy.|Độ tan S = số gam chất tan trong 100 g nước khi bão hoà.
pha-loang|pha loãng|Thêm nước: số mol chất tan không đổi, thể tích tăng.|C₁V₁ = C₂V₂.
xuc-tac|xúc tác|Chất làm phản ứng nhanh hơn, sau phản ứng vẫn còn nguyên.|Không tính chất xúc tác vào lượng chất phản ứng.
nhiet-do-thuong|nhiệt độ thường||
kl-dd-giam|khối lượng dung dịch giảm;khối lượng dung dịch tăng|Khối lượng dung dịch thay đổi sau phản ứng.|m dung dịch sau = m dung dịch trước + m chất thêm vào − m khí − m kết tủa.
kl-binh-tang|khối lượng bình tăng|Bình giữ lại chất nên nặng thêm đúng bằng khối lượng chất đó.|Bình H₂SO₄ đặc giữ H₂O; bình nước vôi trong hoặc NaOH giữ CO₂ (và H₂O).
ti-khoi|tỉ khối|So khối lượng mol của hai khí.|d A/B = M_A : M_B; không khí có M = 29.`

export type TuThenChot = { ma: string; cachViet: string[]; nghia: string; them: string }

let _ds: TuThenChot[] | null = null
/** Danh sách từ then chốt (nạp lười). */
export function danhSachThenChot(): readonly TuThenChot[] {
  if (!_ds) _ds = DONG.split('\n').map((d) => { const [ma, cv, nghia, them] = d.split('|'); return { ma, cachViet: cv.split(';'), nghia, them } })
  return _ds
}

/** Chữ sau từ «đặc» khiến nó KHÔNG phải từ then chốt («đặc điểm», «đặc trưng»…). */
export const DAC_KHONG_PHAI = ['điểm', 'trưng', 'biệt', 'tính', 'sản', 'thù', 'sệt', 'quánh']

const hoaDau = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Thẻ cho từ then chốt; `chu` là chữ trong đề (để giữ nguyên cách viết). Từ không có nghĩa riêng ⇒ null (không tô). */
export function theThenChot(ma: string, chu = ''): TheGiaiNghia | null {
  const t = danhSachThenChot().find((x) => x.ma === ma)
  if (!t?.nghia) return null
  return { ten: hoaDau((chu || t.cachViet[0]).trim()), nhan: 'Từ then chốt', doan: [t.nghia, t.them].filter(Boolean) }
}
