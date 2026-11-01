// @vitest-environment node
// CÂU PHẦN III NHIỀU Ý YÊU CẦU = TỰ LUẬN (thầy 01/11, ảnh câu H2S lọt vào chặng học: «a) Viết biểu thức KC … b) Xác định biến thiên enthalpy … Cho biết … toả nhiệt hay
// thu nhiệt. c) Ở 427 °C, tính hằng số cân bằng K'C …», đáp án kho «169,8»). Khoá luật dùng chung `src/lib/cau-tu-luan.ts`:
//   · ≥ 2 ý con a) b) … mở đầu bằng động từ yêu cầu ⇒ tự luận, KỂ CẢ khi có đáp án số; cả khuôn công khai (không đáp án) lẫn tờ kho thô (`de`, `dap_an`);
//   · danh sách phát biểu / thí nghiệm «(a) … (b) …» + câu hỏi đếm ⇒ VẪN là trả lời ngắn; «tính chất / tính khử» là danh từ;
//   · Phần I / II có ý con trong đề vẫn rút được (chấm bằng A–D / Đ–S).
import { describe, expect, it } from 'vitest'
import { laCauTuLuan, lyDoTuLuan, soYConYeuCau } from '../src/lib/cau-tu-luan'

const H2S = 'Hydrogen sulfide phân hủy theo phản ứng sau đây:\n2H₂S (g) ⇌ 2H₂ + S₂(g) KC = 9,30.10⁻⁸ ở 427 °C.\na) Viết biểu thức hằng số cân bằng KC của phản ứng.\nb) Xác định biến thiên enthanpy chuẩn của phản ứng, biết nhiệt tạo thành chuẩn của H₂S(g) và S₂(g) lần lượt là -20,6 kJ/mol và 128,6kJ/mol.\nCho biết phản ứng thuận là tỏa nhiệt hay thu nhiệt.\nc) Ở 427 °C, tính hằng số cân bằng K\'C của phản ứng 2H₂S (g) ⇌ 2H₂ + S₂(g).'

describe('Phần III nhiều ý yêu cầu ⇒ tự luận', () => {
  it('câu H2S thầy gửi: tự luận cả khi có đáp án số 169,8 (khuôn game, khuôn công khai, tờ kho thô)', () => {
    expect(soYConYeuCau(H2S)).toBe(3)
    expect(laCauTuLuan({ qid: 'DH-11-C2-B7-III-39', phan: 'III', text: H2S, correct: '169,8' })).toBe(true)
    expect(lyDoTuLuan({ phan: 'III', text: H2S, correct: '169,8' })).toBe('phần III gồm nhiều ý yêu cầu (a, b, c …) — tự luận')
    expect(laCauTuLuan({ qid: 'DH-11-C2-B7-III-39', phan: 'III', text: H2S })).toBe(true)
    expect(laCauTuLuan({ phan: 'III', so: 39, de: H2S, dap_an: '169,8' })).toBe(true)
  })
  it('các kiểu đánh dấu ý: «a)», «(a)», ý mở đầu bằng «Hãy …», lệnh sau dấu phẩy', () => {
    expect(laCauTuLuan({ phan: 'III', text: 'Cho 5,6 gam Fe vào dung dịch HCl dư. (a) Viết phương trình phản ứng. (b) Tính thể tích khí H₂ (đkc).', correct: '2,479' })).toBe(true)
    expect(laCauTuLuan({ phan: 'III', text: 'Cho dữ kiện sau.\na) Hãy nêu hiện tượng.\nb) Trong điều kiện chuẩn, tính ΔH.', correct: '-92' })).toBe(true)
  })
  it('danh sách phát biểu / thí nghiệm + câu hỏi đếm ⇒ vẫn là trả lời ngắn', () => {
    const phatBieu = 'Cho các phát biểu sau:\n(a) Glucose có phản ứng tráng bạc.\n(b) Tính chất hoá học đặc trưng của kim loại là tính khử.\n(c) Saccharose thuộc loại disaccharide.\n(d) Cho Fe vào dung dịch CuSO₄ có kim loại Cu bám vào.\nSố phát biểu đúng là'
    expect(soYConYeuCau(phatBieu)).toBe(0)
    expect(laCauTuLuan({ phan: 'III', text: phatBieu, correct: '4' })).toBe(false)
    const thiNghiem = 'Thực hiện các thí nghiệm sau: (a) Sục khí CO₂ vào dung dịch Ca(OH)₂ dư. (b) Nhỏ dung dịch NaOH vào dung dịch FeCl₃. (c) Điện phân dung dịch CuSO₄. Số thí nghiệm tạo kết tủa là'
    expect(laCauTuLuan({ phan: 'III', text: thiNghiem, correct: '2' })).toBe(false)
  })
  it('chỉ MỘT ý yêu cầu (ý còn lại là dữ kiện) ⇒ không kết tội theo luật này', () => {
    expect(soYConYeuCau('Hỗn hợp X gồm: a) 0,1 mol Fe; b) 0,2 mol Cu. Tính khối lượng X (gam).')).toBe(0)
    expect(laCauTuLuan({ phan: 'III', text: 'Hỗn hợp X gồm: a) 0,1 mol Fe; b) 0,2 mol Cu. Tính khối lượng X (gam).', correct: '18,4' })).toBe(false)
  })
  it('Phần I / II có ý con trong đề vẫn rút được (chấm A–D / Đ–S)', () => {
    expect(laCauTuLuan({ phan: 'I', text: H2S, choices: ['a', 'b', 'c', 'd'], correct: 'B' })).toBe(false)
    expect(laCauTuLuan({ phan: 'II', text: H2S, ideas: ['a', 'b', 'c', 'd'], correct: 'DSDS' })).toBe(false)
  })
})
