// CẤM RÚT CÂU TỰ LUẬN — `src/lib/cau-tu-luan.ts` (Code 1, 21/09/2026). Đề bài: `prompt-cam-rut-tu-luan.md`.
// BẢNG GIÁ TRỊ: mỗi khuôn câu (tờ kho thô, đề thầy, phiếu CauLuyen, câu game/ôn lại công khai) × mỗi phần × từng luật. Câu saccharose trong ảnh thầy được dựng lại đúng chữ đề.
// (Kho thật nằm ở R2, không có trong kho mã; bảng dưới dựng theo ĐÚNG hình dạng các tệp kho — `de/pa/y/dap_an` — và theo `PrivateQuestion`/`CauLuyen`/`TeacherExamSource` của mã nguồn.)
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { chuBaoBoTuLuan, chuoiDapAn, laCauRutDuoc, laCauTuLuan, laMaDeTuLuan, locCauRutDuoc, lyDoTuLuan, type PhanCau } from '../src/lib/cau-tu-luan'

const PA = ['Etyl axetat', 'Metyl axetat', 'Etyl fomat', 'Metyl fomat']
const Y = ['Este no, đơn chức', 'Thuỷ phân trong kiềm thu được muối', 'Không tham gia phản ứng tráng bạc', 'Có nhiệt độ sôi cao hơn axit cùng số C']
const SACCHAROSE = 'Theo em, có thể dùng phương pháp nào để tách saccharose ra khỏi hỗn hợp với muối ăn?'

// ───────────────────────── các khuôn câu ─────────────────────────
const kho = (o: Record<string, unknown>) => ({ so: 1, ...o }) // tờ kho thô R2
const CAU_RUT_DUOC: [string, unknown, PhanCau?][] = [
  ['kho thô · phần I đủ 4 phương án, đáp án A', kho({ phan: 'I', de: 'Este nào sau đây có công thức CH3COOC2H5?', pa: PA, dap_an: 'A' })],
  ['kho thô · phần I đáp án "C." có dấu chấm', kho({ phan: 'I', de: 'Chất nào là este?', pa: PA, dap_an: 'C.' })],
  ['kho thô · phần II đủ 4 ý, đáp án DSSD', kho({ phan: 'II', de: 'Cho este X. Phát biểu nào đúng?', y: Y, dap_an: 'DSSD' })],
  ['kho thô · phần II đáp án Đ,S,S,Đ', kho({ phan: 'II', de: 'Cho este X.', y: Y, dap_an: 'Đ,S,S,Đ' })],
  ['kho thô · phần II đáp án mảng 4 phần tử', kho({ phan: 'II', de: 'Cho este X.', y: Y, dap_an: ['D', 'S', 'S', 'D'] })],
  ['kho thô · phần II đáp án đối tượng {a,b,c,d}', kho({ phan: 'II', de: 'Cho este X.', y: Y, dap_an: { a: { dung: true }, b: { dung: false }, c: { dung: false }, d: { dung: true } } })],
  ['kho thô · phần III đáp án số thập phân dấu phẩy', kho({ phan: 'III', de: 'Tính khối lượng este thu được (gam).', dap_an: '12,5' })],
  ['kho thô · phần III đáp án số âm', kho({ phan: 'III', de: 'Tính biến thiên enthalpy (kJ).', dap_an: '-285,8' })],
  ['kho thô · phần III đáp án số kèm một đơn vị', kho({ phan: 'III', de: 'Tính thể tích khí.', dap_an: '1,5 mol' })],
  ['kho thô · phần III đáp án là công thức', kho({ phan: 'III', de: 'Cho biết công thức phân tử của X.', dap_an: 'C2H5OH' })],
  ['kho thô · phần III đáp án luỹ thừa', kho({ phan: 'III', de: 'Tính hằng số cân bằng.', dap_an: '2.10^3' })],
  ['kho thô · phần III đáp án là số nguyên viết bằng kiểu số', kho({ phan: 'III', de: 'Tính số đồng phân.', dap_an: 4 })],
  ['kho thô · phần III hỏi "Tính…" đáp án ngắn có chữ "mol" đơn', kho({ phan: 'III', de: 'Giá trị của x là bao nhiêu?', dap_an: '0,25 mol' })],
  ['kho thô · mã đề thường', kho({ phan: 'I', maDe: 'DH-12-C2-B6-TN', de: 'Chất nào là este?', pa: PA, dap_an: 'B' })],
  ['kho thô · mã đề -TLN (trả lời ngắn) không dính -TL', kho({ phan: 'III', maDe: 'DH-12-C2-B6-TLN', de: 'Tính số mol.', dap_an: '0,5' })],
  ['đề thầy · phần I (không có `phan`, truyền phanMacDinh)', { id: 'DH-12-C2-B6-TN-I-3', text: 'Este nào sau đây có công thức CH3COOC2H5?', choices: PA, correct: 'A' }, 'I'],
  ['đề thầy · phần II', { id: 'DH-12-C2-B6-DS-II-1', text: 'Cho este X.', ideas: Y, correct: ['D', 'S', 'S', 'D'] }, 'II'],
  ['đề thầy · phần III', { id: 'DH-12-C2-B6-TLN-III-2', text: 'Tính khối lượng (gam).', correct: '12,5' }, 'III'],
  ['CauLuyen · phần I', { phan: 'I', id: 'DH-12-C2-B6-TN-I-3', maDe: 'DH-12-C2-B6-TN', text: 'Chất nào là este?', luaChon: PA, dapAn: 'C', chot: '', lyDo: null, buoc: null, ketQua: '' }],
  ['CauLuyen · phần III đáp án số', { phan: 'III', id: 'DH-12-C2-B6-TLN-III-2', maDe: 'DH-12-C2-B6-TLN', text: 'Tính số mol.', luaChon: null, dapAn: '0,5', chot: '', lyDo: null, buoc: null, ketQua: '' }],
  ['CauLuyen bài cá nhân hoá · máy chủ CHƯA gửi đáp án (dapAn rỗng + chuaCoDapAn) ⇒ chưa biết, không kết tội', { phan: 'III', id: 'DH-12-C2-B6-TLN-III-2', maDe: 'DH-12-C2-B6-TLN', text: 'Tính số mol.', luaChon: null, dapAn: '', caNhan: { chuaCoDapAn: true } }],
  ['CauLuyen bài cá nhân hoá · phần I chưa có đáp án', { phan: 'I', id: 'DH-12-C2-B6-TN-I-3', maDe: 'DH-12-C2-B6-TN', text: 'Chất nào là este?', luaChon: PA, dapAn: '', caNhan: { chuaCoDapAn: true } }],
  ['câu game công khai · phần I (không có `correct`)', { qid: 'DH-12-C2-B6-TN-I-3', phan: 'I', text: 'Chất nào là este?', choices: PA, ideas: [] }],
  ['câu game công khai · phần II', { qid: 'DH-12-C2-B6-DS-II-1', phan: 'II', text: 'Cho este X.', choices: [], ideas: Y }],
  ['câu game công khai · phần III hỏi tính (không có đáp án ⇒ không kết tội)', { qid: 'DH-12-C2-B6-TLN-III-2', phan: 'III', text: 'Tính số mol khí.', choices: [], ideas: [] }],
  ['phần I có phương án bằng ảnh (chữ rỗng, ảnh đủ 4)', { phan: 'I', text: 'Hình nào đúng?', choices: ['', '', '', ''], choiceImgs: ['a.png', 'b.png', 'c.png', 'd.png'], correct: 'B' }],
  ['phần II có ý bằng ảnh', { phan: 'II', text: 'Xét đồ thị.', ideas: ['', '', '', ''], ideaImgs: ['1.png', '2.png', '3.png', '4.png'], correct: 'DSDS' }],
  ['kho thô · phan viết kiểu mã đề TN / DS / TLN vẫn được nhận ra và rút được', kho({ phan: 'TLN', de: 'Tính số mol.', dap_an: '12,5' })],
  ['kho thô · phan TN', kho({ phan: 'TN', de: 'Chất nào là este?', pa: PA, dap_an: 'A' })],
  ['kho thô · phan DS', kho({ phan: 'DS', de: 'Cho este X.', y: Y, dap_an: 'DSSD' })],
  ['phần I hỏi "Giải thích nào sau đây đúng?" — chữ "giải thích" chỉ là dấu hiệu hỏi mở ở PHẦN III', kho({ phan: 'I', de: 'Giải thích nào sau đây về liên kết hiđro là đúng?', pa: PA, dap_an: 'D' })],
  ['phần II có chữ "theo em" trong ý vẫn rút được', kho({ phan: 'II', de: 'Theo em, phát biểu nào đúng?', y: Y, dap_an: 'DSSD' })],
  ['khuôn không mang `phan`, không có gợi ý phần ⇒ chỉ xét nhãn (không kết tội)', { text: 'Tính số mol.', correct: 'kết tinh lại' }],
]

const CAU_TU_LUAN: [string, unknown, PhanCau?, RegExp?][] = [
  ['CÂU TRONG ẢNH THẦY · game công khai (chỉ có chữ đề, phần III, ô nhập ngắn)', { qid: 'DH-12-C3-B2-TLN-III-5', phan: 'III', text: SACCHAROSE, choices: [], ideas: [] }, undefined, /hỏi mở/],
  ['CÂU TRONG ẢNH THẦY · kho thô, đáp án ngắn "Kết tinh lại"', kho({ phan: 'III', de: SACCHAROSE, dap_an: 'Kết tinh lại' }), undefined, /chữ nhiều từ/],
  ['CÂU TRONG ẢNH THẦY · kho thô, đáp án dài', kho({ phan: 'III', de: SACCHAROSE, dap_an: 'Dùng phương pháp kết tinh lại vì saccharose tan tốt trong nước nóng' }), undefined, /dài/],
  ['CÂU TRONG ẢNH THẦY · CauLuyen (bài thường có đáp án)', { phan: 'III', id: 'DH-12-C3-B2-TLN-III-5', maDe: 'DH-12-C3-B2-TLN', text: SACCHAROSE, luaChon: null, dapAn: 'Kết tinh' }],
  ['CÂU TRONG ẢNH THẦY · CauLuyen bài cá nhân hoá chưa có đáp án — vẫn bị bắt bằng chữ đề', { phan: 'III', id: 'DH-12-C3-B2-TLN-III-5', text: SACCHAROSE, luaChon: null, dapAn: '', caNhan: { chuaCoDapAn: true } }, undefined, /hỏi mở/],
  ['CÂU TRONG ẢNH THẦY · đề thầy (không có `phan`, phần III)', { id: 'DH-12-C3-B2-TLN-III-5', text: SACCHAROSE, correct: 'Kết tinh' }, 'III'],
  ['kho thô · chữ đề hỏi mở nằm ở trường `de`, đáp án lại là số', kho({ phan: 'III', de: SACCHAROSE, dap_an: '3' }), undefined, /hỏi mở/],
  ['phần III đáp án dài > 20 ký tự có khoảng trắng (luật sẵn có của BTVN)', kho({ phan: 'III', de: 'Nêu cách nhận biết.', dap_an: 'Cho tác dụng với dung dịch brom rồi quan sát' }), undefined, /dài/],
  ['phần III đáp án nhiều dòng', kho({ phan: 'III', de: 'Viết các sản phẩm.', dap_an: 'X\nY' }), undefined, /dài/],
  ['phần III đáp án có dấu chấm phẩy', kho({ phan: 'III', de: 'Viết các sản phẩm.', dap_an: 'CH3COOH; C2H5OH' }), undefined, /dài/],
  ['phần III đáp án có mũi tên phản ứng', kho({ phan: 'III', de: 'Viết phương trình.', dap_an: 'CH3COOH → CH3COO- + H+' }), undefined, /dài/],
  ['phần III đáp án có dấu hai chấm (tỉ lệ)', kho({ phan: 'III', de: 'Cho biết tỉ lệ.', dap_an: '1:2' }), undefined, /dài/],
  ['phần III đáp án hai chữ', kho({ phan: 'III', de: 'Cho biết phương pháp.', dap_an: 'chưng cất' }), undefined, /chữ nhiều từ/],
  ['phần III đáp án CÓ TRƯỜNG nhưng rỗng ⇒ không chấm tự động được', kho({ phan: 'III', de: 'Tính số mol.', dap_an: '' }), undefined, /không có đáp án/],
  ['phần III đáp án null (có trường)', kho({ phan: 'III', de: 'Tính số mol.', dap_an: null }), undefined, /không có đáp án/],
  ['phần III hỏi "vì sao"', { phan: 'III', text: 'Vì sao etanol tan vô hạn trong nước?', choices: [], ideas: [] }, undefined, /hỏi mở/],
  ['phần III "giải thích"', { phan: 'III', text: 'Giải thích hiện tượng quan sát được.', choices: [], ideas: [] }, undefined, /hỏi mở/],
  ['phần III "như thế nào"', { phan: 'III', text: 'Tốc độ phản ứng thay đổi như thế nào khi tăng nhiệt độ?', choices: [], ideas: [] }, undefined, /hỏi mở/],
  ['phần I thiếu phương án (2/4)', kho({ phan: 'I', de: 'Chất nào là este?', pa: ['A', 'B'], dap_an: 'A' }), undefined, /thiếu phương án/],
  ['phần I không có phương án (luaChon null)', { phan: 'I', id: 'x-I-1', text: 'Nêu khái niệm este.', luaChon: null, dapAn: 'A' }, undefined, /thiếu phương án/],
  ['phần I có 4 ô nhưng một ô trống, không ảnh', kho({ phan: 'I', de: 'Chất nào?', pa: ['A', 'B', '', 'D'], dap_an: 'A' }), undefined, /thiếu phương án/],
  ['phần I đáp án không phải A–D', kho({ phan: 'I', de: 'Chất nào?', pa: PA, dap_an: 'AB' }), undefined, /A–D/],
  ['phần I đáp án rỗng (có trường)', kho({ phan: 'I', de: 'Chất nào?', pa: PA, dap_an: '' }), undefined, /A–D/],
  ['phần II thiếu ý (3/4)', kho({ phan: 'II', de: 'Cho este X.', y: Y.slice(0, 3), dap_an: 'DSS' }), undefined, /thiếu ý/],
  ['phần II đáp án không đủ 4 ý', kho({ phan: 'II', de: 'Cho este X.', y: Y, dap_an: 'DS' }), undefined, /đủ 4 ý/],
  ['phần LẠ: IV', kho({ phan: 'IV', de: 'Chứng minh …', dap_an: '' }), undefined, /không phải I, II, III/],
  ['phần LẠ: TL', kho({ phan: 'TL', de: 'Trình bày …' }), undefined, /không phải I, II, III/],
  ['kiểu "tự luận" (tiếng Việt có dấu)', { phan: 'III', kieu: 'Tự luận', text: 'Tính …', correct: '5' }, undefined, /nhãn tự luận/],
  ['kiểu "tu_luan"', { phan: 'III', loai: 'tu_luan', text: 'Tính …', correct: '5' }, undefined, /nhãn tự luận/],
  ['kiểu "essay"', { phan: 'III', type: 'essay', text: 'Tính …', correct: '5' }, undefined, /nhãn tự luận/],
  ['mã đề mục dạy học -VD', kho({ phan: 'I', maDe: 'DH-12-C2-VD', de: 'Chất nào?', pa: PA, dap_an: 'A' }), undefined, /mã đề/],
  ['mã đề mục dạy học -DT giữa chuỗi', kho({ phan: 'I', maDe: 'DH-12-DT-B6', de: 'Chất nào?', pa: PA, dap_an: 'A' }), undefined, /mã đề/],
  ['mã đề tự luận -TL', kho({ phan: 'III', maDe: 'DH-12-C2-B6-TL', de: 'Tính …', dap_an: '5' }), undefined, /mã đề/],
  ['qid mang -VD', { qid: 'DH-12-C2-VD-I-3', phan: 'I', text: 'Chất nào?', choices: PA }, undefined, /mã đề/],
  ['id đề thầy mang -TL', { id: 'DH-12-TL-III-2', text: 'Tính …', correct: '5' }, 'III', /mã đề/],
  ['phần I của đề thầy thiếu phương án (choices 3)', { id: 'x-I-1', text: 'Chất nào?', choices: ['A', 'B', 'C'], correct: 'A' }, 'I', /thiếu phương án/],
]

describe('BẢNG GIÁ TRỊ: câu RÚT ĐƯỢC (mọi khuôn, mọi phần)', () => {
  it.each(CAU_RUT_DUOC)('%s', (_ten, c, phan) => {
    expect(lyDoTuLuan(c, phan), JSON.stringify(c).slice(0, 120)).toBeNull()
    expect(laCauTuLuan(c, phan)).toBe(false)
    expect(laCauRutDuoc(c, phan)).toBe(true)
  })
})

describe('BẢNG GIÁ TRỊ: câu TỰ LUẬN (không được rút)', () => {
  it.each(CAU_TU_LUAN)('%s', (_ten, c, phan, lyDo) => {
    const ly = lyDoTuLuan(c, phan)
    expect(ly, JSON.stringify(c).slice(0, 120)).not.toBeNull()
    if (lyDo) expect(ly).toMatch(lyDo)
    expect(laCauTuLuan(c, phan)).toBe(true)
    expect(laCauRutDuoc(c, phan)).toBe(false)
  })
})

describe('phần III hỏi MỞ: từng cụm dấu hiệu đều bị bắt (chữ đề công khai, không có đáp án)', () => {
  it.each([
    ['theo em'], ['vì sao'], ['tại sao'], ['giải thích'], ['trình bày'], ['mô tả'], ['phương pháp nào'], ['cách nào'], ['cách gì'], ['bằng cách nào'], ['như thế nào'], ['đề xuất'], ['nhận xét'], ['so sánh'], ['hãy nêu'],
  ])('"%s"', (cum) => {
    const c = { qid: 'x-TLN-III-1', phan: 'III', text: `Trong thí nghiệm này, ${cum} ra sao?` }
    expect(laCauTuLuan(c), cum).toBe(true)
    expect(laCauTuLuan({ ...c, phan: 'I', choices: PA }), `${cum} ở phần I`).toBe(false)
    expect(laCauTuLuan({ ...c, phan: 'II', ideas: Y }), `${cum} ở phần II`).toBe(false)
  })
  it('chữ hoa/thường không quan trọng; câu tính toán bình thường không bị bắt nhầm', () => {
    expect(laCauTuLuan({ phan: 'III', text: 'THEO EM, làm sao tách hỗn hợp?' })).toBe(true)
    for (const t of ['Tính khối lượng kết tủa thu được (gam).', 'Giá trị của m là bao nhiêu?', 'Xác định số nguyên tử C trong X.', 'Cho biết số đồng phân cấu tạo của este C4H8O2.'])
      expect(laCauTuLuan({ phan: 'III', text: t }), t).toBe(false)
  })
})

describe('luật sẵn có của BTVN (`btvn-grading.ts homeworkQuestions`) vẫn được giữ NGUYÊN', () => {
  it('phần III đáp án > 20 ký tự có khoảng trắng, hoặc chứa xuống dòng ; → ⇌ : ⇒ tự luận; đúng 20 ký tự, hoặc dài nhưng không khoảng trắng ⇒ không dính luật độ dài', () => {
    const c = (dap_an: string) => kho({ phan: 'III', de: 'Tính x.', dap_an })
    expect(laCauTuLuan(c('12345678901234567890'))).toBe(false) // 20 ký tự, không khoảng trắng
    expect(laCauTuLuan(c('1,2 3,4 5,6 7,8 9,1 2,3'))).toBe(true) // > 20 có khoảng trắng
    expect(laCauTuLuan(c('123456789012345678901234567890'))).toBe(false) // dài nhưng không khoảng trắng (chuỗi số)
    for (const ky of ['\n', ';', '→', '⇌', ':']) expect(laCauTuLuan(c(`A${ky}B`)), JSON.stringify(ky)).toBe(true)
  })
  it('nhãn mã đề -VD / -DT (BTVN đang loại) vẫn bị loại, viết hoa/thường; -TLN không', () => {
    expect(laMaDeTuLuan('DH-12-C2-VD')).toBe(true)
    expect(laMaDeTuLuan('dh-12-c2-vd-TN')).toBe(true)
    expect(laMaDeTuLuan('DH-12-DT')).toBe(true)
    expect(laMaDeTuLuan('DH-12-TL')).toBe(true)
    expect(laMaDeTuLuan('VD')).toBe(true)
    expect(laMaDeTuLuan('DH-12-C2-B6-TLN')).toBe(false)
    expect(laMaDeTuLuan('DH-12-C2-B6-TN')).toBe(false)
    expect(laMaDeTuLuan('DH-12-DTX-B6')).toBe(false) // DTX không phải DT
    expect(laMaDeTuLuan('')).toBe(false)
  })
})

describe('biên: đầu vào lạ, không biết ⇒ không kết tội, thuần', () => {
  it('không phải đối tượng ⇒ tự luận (không có gì để rút): null, undefined, số, chuỗi, mảng', () => {
    for (const x of [null, undefined, 5, 'câu', [], [1]]) {
      expect(laCauTuLuan(x)).toBe(true)
      expect(laCauRutDuoc(x)).toBe(false)
    }
  })
  it('luật chỉ áp khi TRƯỜNG có mặt: phần III thiếu trường đáp án + chữ đề tính toán ⇒ rút được; có trường rỗng ⇒ không; chuaCoDapAn ở gốc hoặc trong caNhan đều tính là "chưa biết"', () => {
    expect(laCauRutDuoc({ phan: 'III', text: 'Tính số mol.' })).toBe(true)
    expect(laCauRutDuoc({ phan: 'III', text: 'Tính số mol.', dapAn: '' })).toBe(false)
    expect(laCauRutDuoc({ phan: 'III', text: 'Tính số mol.', dapAn: '', chuaCoDapAn: true })).toBe(true)
    expect(laCauRutDuoc({ phan: 'III', text: 'Tính số mol.', dapAn: '', caNhan: { chuaCoDapAn: true } })).toBe(true)
    expect(laCauRutDuoc({ phan: 'III', text: 'Tính số mol.', dapAn: '', caNhan: { chuaCoDapAn: false } })).toBe(false)
    expect(laCauRutDuoc({ phan: 'I', text: 'Chất nào?' })).toBe(true) // không có phương án lẫn đáp án ⇒ chưa biết
  })
  it('phan đọc chịu: TN/DS/TLN, 1/2/3, chữ thường, khoảng trắng; suy từ qid khi thiếu `phan`; phanMacDinh dùng khi không có gì', () => {
    expect(laCauTuLuan({ phan: 'TLN', text: 'Tính x.', dap_an: 'kết tinh lại' })).toBe(true)
    expect(laCauTuLuan({ phan: ' iii ', text: 'Tính x.', dap_an: 'kết tinh lại' })).toBe(true)
    expect(laCauTuLuan({ phan: 3, text: 'Tính x.', dap_an: 'kết tinh lại' })).toBe(true) // số 3 ⇒ phần III
    expect(laCauTuLuan({ phan: 'TN', choices: ['a'], correct: 'A' })).toBe(true)
    expect(laCauTuLuan({ qid: 'DH-12-B6-TLN-III-2', text: 'Tính x.', correct: 'kết tinh lại' })).toBe(true)
    expect(laCauTuLuan({ text: 'Tính x.', correct: 'kết tinh lại' })).toBe(false) // không biết phần ⇒ không kết tội
    expect(laCauTuLuan({ text: 'Tính x.', correct: 'kết tinh lại' }, 'III')).toBe(true)
    expect(laCauTuLuan({ phan: 'II', qid: 'x-III-4', ideas: Y.slice(0, 3) })).toBe(true) // `phan` thắng qid
  })
  it('THUẦN: không sửa đầu vào (đóng băng sâu), cùng đầu vào cùng kết quả, laCauRutDuoc = !laCauTuLuan', () => {
    const sau = <T,>(x: T): T => {
      if (x && typeof x === 'object') for (const v of Object.values(x)) sau(v)
      return Object.freeze(x)
    }
    for (const [, c, p] of [...CAU_RUT_DUOC, ...CAU_TU_LUAN]) {
      const dong = sau(structuredClone(c))
      const a = lyDoTuLuan(dong, p)
      expect(lyDoTuLuan(dong, p)).toBe(a)
      expect(laCauRutDuoc(dong, p)).toBe(!laCauTuLuan(dong, p))
    }
  })
  it('chuoiDapAn: chuỗi, số, mảng, boolean, đối tượng {a,b,c,d}/{A,B,C,D}, rỗng', () => {
    expect(chuoiDapAn('  B ')).toBe('B')
    expect(chuoiDapAn(4)).toBe('4')
    expect(chuoiDapAn(['D', 'S', 'S', 'D'])).toBe('DSSD')
    expect(chuoiDapAn([true, false, false, true])).toBe('DSSD')
    expect(chuoiDapAn({ a: { dung: true }, b: { dung: false }, c: true, d: 'S' })).toBe('DSDS')
    expect(chuoiDapAn({ A: 'D', B: 'S', C: 'S', D: 'D' })).toBe('DSSD')
    for (const x of [null, undefined, {}, '']) expect(chuoiDapAn(x)).toBe('')
  })
})

describe('TÍNH CHẤT ngẫu nhiên: đáp án số luôn rút được; đáp án chữ nhiều từ luôn bị loại', () => {
  function mulberry32(a: number) {
    return () => {
      a |= 0
      a = (a + 0x6d2b79f5) | 0
      let t = Math.imul(a ^ (a >>> 15), 1 | a)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }
  it('500 đáp án số (dấu phẩy/chấm, âm, kèm đơn vị đơn) ⇒ rút được', () => {
    const r = mulberry32(2109)
    const dv = ['', '', ' mol', ' gam', ' lít', ' %']
    for (let i = 0; i < 500; i++) {
      const so = (r() * (r() < 0.3 ? 5000 : 30) * (r() < 0.2 ? -1 : 1)).toFixed(Math.floor(r() * 3)).replace('.', r() < 0.5 ? ',' : '.')
      const da = so + dv[Math.floor(r() * dv.length)]
      expect(laCauRutDuoc({ phan: 'III', de: 'Tính giá trị của x.', dap_an: da }), da).toBe(true)
    }
  })
  it('500 cụm chữ ≥ 2 từ ⇒ tự luận, kể cả rất ngắn', () => {
    const r = mulberry32(3)
    const tu = ['kết', 'tinh', 'lại', 'chưng', 'cất', 'lọc', 'chiết', 'phân', 'đoạn', 'thuỷ', 'phân', 'trung', 'hoà']
    for (let i = 0; i < 500; i++) {
      const n = 2 + Math.floor(r() * 3)
      const da = Array.from({ length: n }, () => tu[Math.floor(r() * tu.length)]).join(' ')
      expect(laCauTuLuan({ phan: 'III', de: 'Nêu phương pháp.', dap_an: da }), da).toBe(true)
    }
  })
})

describe('locCauRutDuoc + chữ báo thầy', () => {
  it('giữ thứ tự câu rút được, gom câu bỏ kèm lý do; danh sách rỗng; chữ "Đã bỏ N câu tự luận"', () => {
    const ds = [
      kho({ phan: 'I', de: 'a', pa: PA, dap_an: 'A' }),
      kho({ phan: 'III', de: SACCHAROSE, dap_an: 'Kết tinh lại' }),
      kho({ phan: 'III', de: 'Tính.', dap_an: '5' }),
      kho({ phan: 'I', de: 'thiếu', pa: ['A'], dap_an: 'A' }),
    ]
    const { giu, bo } = locCauRutDuoc(ds)
    expect(giu).toEqual([ds[0], ds[2]])
    expect(bo.map((b) => b.cau)).toEqual([ds[1], ds[3]])
    expect(bo.every((b) => b.lyDo.length > 0)).toBe(true)
    expect(locCauRutDuoc([])).toEqual({ giu: [], bo: [] })
    expect(chuBaoBoTuLuan(0)).toBe('')
    expect(chuBaoBoTuLuan(3)).toBe('Đã bỏ 3 câu tự luận (chỉ rút câu trắc nghiệm, đúng sai, trả lời ngắn)')
    const { giu: g2 } = locCauRutDuoc([{ text: 'Tính x.', correct: '5' }, { text: 'Tính y.', correct: 'kết tinh lại' }], 'III')
    expect(g2).toHaveLength(1)
  })
})

describe('khoá nguồn: thuần', () => {
  it('cau-tu-luan.ts không import, không đồng hồ, không ngẫu nhiên, không IO', () => {
    const ma = readFileSync('src/lib/cau-tu-luan.ts', 'utf8')
      .split('\n')
      .filter((l) => !l.trimStart().startsWith('//') && !l.trimStart().startsWith('*') && !l.trimStart().startsWith('/**'))
      .join('\n')
    expect(ma).not.toMatch(/^import /m)
    expect(ma).not.toMatch(/Date\.now|new Date|Math\.random|process\.|fetch\(|localStorage|console\./)
  })
})
