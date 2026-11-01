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
    expect(soYConYeuCau(H2S)).toBe(2) // a) Viết · b) Xác định (c) «Ở 427 °C, tính» mở đầu bằng dữ kiện — 2 ý đã đủ kết tội)
    expect(laCauTuLuan({ qid: 'DH-11-C2-B7-III-39', phan: 'III', text: H2S, correct: '169,8' })).toBe(true)
    expect(lyDoTuLuan({ phan: 'III', text: H2S, correct: '169,8' })).toBe('phần III nhiều ý')
    expect(laCauTuLuan({ qid: 'DH-11-C2-B7-III-39', phan: 'III', text: H2S })).toBe(true)
    expect(laCauTuLuan({ phan: 'III', so: 39, de: H2S, dap_an: '169,8' })).toBe(true)
  })
  it('các kiểu đánh dấu ý: «a)», «(a)», ý mở đầu bằng «Hãy …»', () => {
    expect(laCauTuLuan({ phan: 'III', text: 'Cho 5,6 gam Fe vào dung dịch HCl dư. (a) Viết phương trình phản ứng. (b) Tính thể tích khí H₂ (đkc).', correct: '2,479' })).toBe(true)
    expect(laCauTuLuan({ phan: 'III', text: 'Cho dữ kiện sau.\na) Hãy nêu hiện tượng.\nb) Tính ΔH của phản ứng ở điều kiện chuẩn.', correct: '-92' })).toBe(true)
  })
  it('soát kho thật 01/11: ý hỏi «Tại sao …?», ý tự đặt câu hỏi «… bao nhiêu …?», «cho biết … toả nhiệt hay thu nhiệt» ⇒ tự luận; «Viết PTHH và tính hiệu suất» vẫn rút được', () => {
    expect(laCauTuLuan({ phan: 'III', text: 'Hỗn hợp N₂O₄ và N₂H₄ dùng làm nhiên liệu tên lửa. a) Tính nhiệt lượng toả ra khi đốt cháy 1 kg hỗn hợp lỏng theo đúng tỉ lệ phản ứng. b) Tại sao hỗn hợp lỏng N₂O₄ và N₂H₄ được dùng làm nhiên liệu tên lửa?', correct: '6724,2' })).toBe(true)
    expect(laCauTuLuan({ phan: 'III', text: 'Nguyên tử nitrogen có 7 proton và 7 neutron trong hạt nhân. a) Nguyên tử nitrogen này có bao nhiêu electron? b) Tính khối lượng của hạt nhân, vỏ nguyên tử và của nguyên tử nitrogen. c) Khối lượng hạt nhân chiếm bao nhiêu phần trăm?', correct: '100,0' })).toBe(true)
    expect(lyDoTuLuan({ phan: 'III', text: 'Cho phản ứng NO₂(g) + SO₂(g) → NO(g) + SO₃(g). Tính biến thiên enthalpy của phản ứng và cho biết phản ứng trên là tỏa nhiệt hay thu nhiệt.', correct: '-41' })).toBe('phần III nhiều ý')
    expect(laCauTuLuan({ phan: 'III', text: 'Dẫn hỗn hợp X qua bình chứa xúc tác V₂O₅, thu được hỗn hợp khí Y có tỉ khối so với H₂ bằng 30. Viết phương trình hóa học và tính hiệu suất của phản ứng oxi hóa SO₂ thành SO₃.', correct: '80' })).toBe(false)
    expect(laCauTuLuan({ phan: 'III', text: 'Cho các nhận xét sau: (a) Nước chua có tính acid nên làm protein bị đông tụ. (b) Thạch cao có thể thay nước chua. (c) Đậu phụ giàu protein. Có bao nhiêu nhận xét đúng?', correct: '3' })).toBe(false)
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

describe('quét kho gắn cờ tự luận theo luật mới (game-v2-bank.ts `danhCoTuLuanKho`)', () => {
  it('câu luật mới kết tội ⇒ gắn cờ + đổi mốc tờ; câu thường giữ nguyên; quét xong ⇒ không làm gì nữa', async () => {
    const { taoD1That } = await import('./_d1-that')
    const { danhCoTuLuanKho } = await import('../server/src/game-v2-bank')
    const d = taoD1That()
    const cau = (qid: string, text: string, correct: string) => JSON.stringify({ qid, maDe: 'DH-11-C2-B7', version: 'v1', group: 'g-' + qid, phan: 'III', text, choices: [], ideas: [], hinhAnh: [], correct, reviewed: true })
    d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-11-C2-B7','Bài 7',2,0,'v1')").run()
    d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-11-C2-B7','v1','2026-10-01T00:00:00.000Z')").run()
    const q = d.sql.prepare("INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES('DH-11-C2-B7',?,?,?,NULL,?)")
    q.run('DH-11-C2-B7-III-39', 'v1', 'g39', cau('DH-11-C2-B7-III-39', H2S, '169,8'))
    q.run('DH-11-C2-B7-III-1', 'v1', 'g1', cau('DH-11-C2-B7-III-1', 'Tính thể tích khí SO₂ (đkc) thu được.', '2,479'))
    const env = d.env as never
    expect(await danhCoTuLuanKho(env, 1)).toEqual({ quet: 1, gan: 1, xong: false })
    expect(await danhCoTuLuanKho(env, 1)).toEqual({ quet: 1, gan: 0, xong: false })
    expect(await danhCoTuLuanKho(env, 5)).toEqual({ quet: 0, gan: 0, xong: true })
    expect(await danhCoTuLuanKho(env, 5)).toEqual({ quet: 0, gan: 0, xong: true })
    const tl = (qid: string) => JSON.parse((d.sql.prepare('SELECT json FROM game_v2_question WHERE qid=?').get(qid) as { json: string }).json).tuLuan
    expect(tl('DH-11-C2-B7-III-39')).toBe(true)
    expect(tl('DH-11-C2-B7-III-1')).toBeUndefined()
    expect((d.sql.prepare("SELECT version FROM game_v2_question WHERE qid='DH-11-C2-B7-III-39'").get() as { version: string }).version).toBe('v1')
    expect((d.sql.prepare("SELECT indexed_at FROM game_v2_index WHERE ma_de='DH-11-C2-B7'").get() as { indexed_at: string }).indexed_at).not.toBe('2026-10-01T00:00:00.000Z')
  })
})
