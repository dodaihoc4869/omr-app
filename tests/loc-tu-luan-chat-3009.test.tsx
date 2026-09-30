// LUẬT TỰ LUẬN CHẶT (30/09/2026) — thầy lệnh kèm ảnh: "Lọc cẩn thận những câu tự luận này nhé".
// Ảnh: màn Câu đã làm hiện câu Phần III muối Mohr "…Xác định công thức của X." đáp án "(NH₄)₂Fe(SO₄)₂·6H₂O" ⇒ câu TỰ LUẬN lọt vào kênh tự động.
// Nguyên nhân gốc: `laCauTuLuan` (src/lib/cau-tu-luan.ts) chỉ bắt đáp án phần III DÀI / nhiều dòng / chữ ≥ 2 từ ⇒ công thức, tên nguyên tố, "Fe₃O₄"… lọt.
// Luật mới: phần III có đáp án KHÔNG đọc được thành MỘT số chấm được (`docSoPhanIII` + danh mục đơn vị của máy chấm) ⇒ tự luận; câu khuôn công khai
// (không có đáp án) mà đề ra lệnh "Xác định công thức / Viết phương trình / Vẽ / Chứng minh…" và không hỏi đại lượng ⇒ tự luận; cờ kho `tuLuan` ⇒ tự luận.
// MẪU THẬT: chữ đề + đáp án lấy từ các bản sao lưu kho trong repo (docs/loi-giai-a/tu-sua-2909/sao-luu/*.json, docs/loi-giai-a/**) — không dữ liệu học sinh.
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { laCauTuLuan, laMotSoPhanIII, lyDoTuLuan, laCauRutDuoc } from '../src/lib/cau-tu-luan'
import { docSoPhanIII } from '../src/lib/doc-so-phan-iii'
import { lamNhe, laTuLuanPool, normalizeBank } from '../server/src/game-v2-bank'
import { cauRiengTuLuan } from '../server/src/tu-luyen'
import { chamDeChuan } from '../server/src/luyen-de'
import { phanLoaiTuLuanDaLam } from '../server/src/srs2-game'
import { jsonLaTuLuan } from '../server/src/cam-tu-luan'
import { rutDeChuan2026, MA_TRAN_HOA_2026 } from '../src/lib/ma-tran-hoa-2026'
import { loaiCau, cauTrongGoi } from '../src/lib/loi-giai-kiem'
import { parseKhoDeJson, buildTeacherSourceFromKhoDe } from '../src/lib/exam-kho-de-import'
import { docCauDaLam, docChiTiet } from '../src/components/hoa2/api'
import { NHAN_TU_LUAN, propsTheCau, tomTatThe } from '../src/components/hoa2/cau-chuyen'
import { BO_LOC } from '../src/components/hoa2/CauDaLam'
import { cauPdfHtml, dauCauPdf } from '../src/components/hoa2/pdf-cau-da-lam'
import TheCau from '../src/components/TheCau'
import type { PrivateQuestion } from '../src/game/than-thu-v2/core'
import type { TeacherExamSource } from '../src/data/examContent'

// ───────────── câu trong ảnh thầy (dựng lại đúng chữ đề) ─────────────
const MOHR =
  'Hòa tan 3,92 gam một muối X ngậm nước vào cốc nước, thu được 100 mL dung dịch X gồm các ion: Fe²⁺, NH₄⁺, SO₄²⁻. Cho 10 mL dung dịch X tác dụng với dung dịch NaOH dư, đun nóng, thu được 49,58 mL khí (đkc). Cho 10 mL dung dịch X tác dụng với dung dịch BaCl₂ dư, thu được 0,466 gam kết tủa. Xác định công thức của X.'
const DA_MOHR = '(NH₄)₂Fe(SO₄)₂·6H₂O'

// ───────────── MẪU THẬT phần III: đáp án KHÔNG phải một số (kho sao lưu) ─────────────
const THAT_TU_LUAN: [string, string][] = [
  [DA_MOHR, MOHR],
  ['Fe₃O₄', 'Nitric acid (HNO₃) là hợp chất vô cơ, trong tự nhiên được hình thành trong những cơn mưa giông kèm sấm sét. Xác định công thức oxide sắt.'],
  ['K₂O', 'Oxide của kim loại M (M₂O) được dùng nhiều trong ngành hoá chất và sản xuất phân bón. Tổng số hạt cơ bản trong phân tử là 140. Xác định công thức.'],
  ['FeS₂', 'Hợp chất XY₂ có biệt danh là "vàng của kẻ ngốc" vì có ánh kim và sắc vàng đồng, nhìn khá giống vàng.'],
  ['AlCl₃', 'Hợp chất MX₃ có tổng số p, n, e là 196; trong đó tổng số hạt mang điện nhiều hơn số hạt không mang điện là 60.'],
  ['S', 'Nguyên tử của nguyên tố R có cấu hình electron lớp ngoài cùng là ns²np⁴. Trong hợp chất hydride (hợp chất với hydrogen) R chiếm 94,12% khối lượng.'],
  ['Sulfur (S)', 'Nguyên tử của nguyên tố R có cấu hình electron lớp ngoài cùng là ns²np⁴. R là nguyên tố nào?'],
  ['N', 'Một nguyên tố tạo hợp chất khí với hydrogen có công thức RH₃, được sử dụng để trung hoà các thành phần acid.'],
  ['Nitrogen (N)', 'Một nguyên tố tạo hợp chất khí với hydrogen có công thức RH₃. R là nguyên tố nào?'],
  ['Si', 'X là nguyên tố có hóa trị cao nhất đối với oxygen bằng hóa trị của X trong hợp chất với hydrogen.'],
  ['Silicon (Si)', 'X là nguyên tố có hóa trị cao nhất đối với oxygen bằng hóa trị của X trong hợp chất với hydrogen. X là nguyên tố nào?'],
  ['thấp (khoảng 113 °C)', 'Trong tinh thể sulfur, các phân tử S₈ tương tác với nhau bằng lực van der Waals yếu. Hãy dự đoán về nhiệt độ nóng chảy của sulfur.'],
  ['C₇H₉N', 'Kết quả phân tích nguyên tố của hợp chất amine thơm X có phần trăm khối lượng các nguyên tố như sau: C 78,5%; H 8,41%; N 13,09%.'],
  ['(CH₃)₃N', 'Vị tanh của cá, đặc biệt là cá mè, là do các amine gây ra, trong đó có amine X. Phân tích nguyên tố cho thấy X có 61,02% C.'],
  ['(Ala)₄', 'Tetrapeptide X được cấu tạo từ một α-amino acid (phân tử chứa một nhóm amino và một nhóm carboxyl).'],
  ['Tyr-Gly-Gly-Phe-Leu', 'Enkephalin (A) là các cấu tử pentapeptide của các endorphin. Xác định trật tự các amino acid trong A.'],
  ['Na mạnh hơn Mg', 'So sánh tính kim loại của sodium và magnesium.'],
  ['Al(OH)₃ < Mg(OH)₂ < NaOH', 'Sắp xếp các chất Mg(OH)₂, Al(OH)₃, NaOH theo chiều tính base TĂNG DẦN.'],
  ['25% N₂; 25% H₂; 50% NH₃', 'Cho hỗn hợp gồm N₂, H₂ và NH₃ có tỉ khối so với hydrogen là 8.'],
  ['a) 2550 kg; b) 1,05 kg; c) 25 mg', 'Trong công nghiệp, copper(II) sulfate pentahydrate được sản xuất từ copper(II) oxide.'],
  // dạng "nhiều số / khoảng" (luật mới nói rõ)
  ['2 và 3', 'Tính số liên kết pi.'],
  ['1-2', 'Khoảng pH của dung dịch.'],
  ['1,3,4', 'Chọn các phát biểu đúng.'],
]

// ───────────── MẪU THẬT phần III: đáp án là MỘT số (không được bắt nhầm) ─────────────
const THAT_SO: [string, string][] = [
  ['-396', 'Tính biến thiên enthalpy chuẩn của phản ứng (kJ).'],
  ['−96,9', 'Tính biến thiên enthalpy chuẩn của phản ứng (kJ).'],
  ['–1', 'Số oxi hoá của oxygen trong H₂O₂ là bao nhiêu?'],
  ['0,125', 'Tính nồng độ mol của dung dịch.'],
  ['12 395', 'Tính nhiệt lượng toả ra (kJ).'],
  ['1,2375×10⁹ kJ', 'Tính nhiệt lượng cần cung cấp để sản xuất 1 tấn vôi sống.'],
  ['1.237.500.000', 'Tính nhiệt lượng (J).'],
  ['2,5.10^-3', 'Tính số mol.'],
  ['53,3', 'Phần trăm khối lượng của nguyên tố X là bao nhiêu?'],
  ['1245', 'Liệt kê các yếu tố làm thay đổi cân bằng của hệ theo số thứ tự tăng dần (Ví dụ: 1245, 235,…)'],
  ['3421', 'Sắp xếp số tương ứng của mỗi phản ứng theo thứ tự, thành bộ bốn số (ví dụ: 1234, 4321,...).'],
  ['6,0', 'Tính pH của dung dịch.'],
  ['94,0', 'Tính hiệu suất phản ứng (%).'],
  ['25%', 'Tính hiệu suất phản ứng.'],
  ['0,1 mol', 'Tính số mol khí.'],
  ['4000', 'Tính khối lượng (kg).'],
  ['7,84', 'Tính thể tích khí (L).'],
  ['1', 'Số đồng phân cấu tạo là'],
  ['166', 'Phân tử khối của X là'],
  // đề ra lệnh "Xác định công thức / Viết phương trình" nhưng hỏi MỘT số ⇒ trả lời ngắn
  ['7', 'Viết phương trình phản ứng đốt cháy. Tổng hệ số cân bằng (nguyên, tối giản) là bao nhiêu?'],
  ['8', 'Xác định công thức phân tử của X. Số nguyên tử hydrogen trong X là'],
]

describe('LUẬT: phần III đáp án không đọc được thành một số ⇒ tự luận', () => {
  it('câu trong ảnh thầy (muối Mohr) là TỰ LUẬN', () => {
    expect(docSoPhanIII(DA_MOHR)).toBeNull()
    expect(lyDoTuLuan({ phan: 'III', de: MOHR, dap_an: DA_MOHR })).toMatch(/không phải một số/)
    // mọi khuôn câu (kho thô, đề thầy, câu game đầy đủ, phiếu CauLuyen)
    expect(laCauTuLuan({ id: 'DB-12-X-III-5', text: MOHR, correct: DA_MOHR }, 'III')).toBe(true)
    expect(laCauTuLuan({ qid: 'DB-12-X-III-5', phan: 'III', text: MOHR, correct: DA_MOHR, choices: [], ideas: [] })).toBe(true)
    expect(laCauTuLuan({ phan: 'III', id: 'DB-12-X-III-5', text: MOHR, luaChon: null, dapAn: DA_MOHR })).toBe(true)
    // khuôn công khai (máy em chưa có đáp án): chữ đề "Xác định công thức của X." cũng đủ
    expect(laCauTuLuan({ qid: 'DB-12-X-III-5', phan: 'III', text: MOHR, choices: [], ideas: [] })).toBe(true)
  })
  it.each(THAT_TU_LUAN)('mẫu thật tự luận: %s', (da, de) => {
    expect(laMotSoPhanIII(da)).toBe(false)
    expect(laCauTuLuan({ phan: 'III', de, dap_an: da }), da).toBe(true)
  })
  it.each(THAT_SO)('mẫu thật số (KHÔNG bắt nhầm): %s', (da, de) => {
    expect(laMotSoPhanIII(da)).toBe(true)
    expect(lyDoTuLuan({ phan: 'III', de, dap_an: da }), da).toBeNull()
  })
  it('đủ ≥ 30 mẫu thật', () => expect(THAT_TU_LUAN.length + THAT_SO.length).toBeGreaterThanOrEqual(30))
  it('khuôn công khai (không đáp án): lệnh viết/vẽ/xác định công thức ⇒ tự luận; câu hỏi đại lượng hay thứ tự số ⇒ không', () => {
    const pub = (text: string) => laCauTuLuan({ phan: 'III', text, choices: [], ideas: [] })
    expect(pub('Cho X tác dụng với NaOH. Viết phương trình phản ứng xảy ra.')).toBe(true)
    expect(pub('Hãy vẽ sơ đồ pin điện hoá Zn–Cu.')).toBe(true)
    expect(pub('Chứng minh rằng X là hợp chất no.')).toBe(true)
    expect(pub('Đốt cháy X thu được CO₂ và H₂O, xác định công thức cấu tạo của X.')).toBe(true)
    expect(pub('Viết phương trình phản ứng đốt cháy. Tổng hệ số cân bằng là bao nhiêu?')).toBe(false)
    expect(pub('Hãy sắp xếp các chất có khả năng tham gia phản ứng thuỷ phân thành bộ số theo số thứ tự tăng dần (ví dụ: 23, 134).')).toBe(false)
    expect(pub('Một amino acid có các tên gọi sau: (1) alanine; (2) α-aminopropionic acid. Sắp xếp các tên đã được số hoá theo trình tự.')).toBe(false)
    expect(pub('Xác định số nguyên tử C trong X.')).toBe(false)
  })
  it('KHÔNG bắt nhầm phần I / phần II có chữ "xác định", "viết"', () => {
    const PA = ['Fe₃O₄', 'Fe₂O₃', 'FeO', 'Fe']
    expect(laCauTuLuan({ phan: 'I', text: 'Xác định công thức của oxide sắt X.', choices: PA, correct: 'A' })).toBe(false)
    expect(laCauTuLuan({ phan: 'I', text: 'Viết phương trình phản ứng. Chất khử là', choices: PA })).toBe(false)
    expect(laCauTuLuan({ phan: 'II', text: 'Xác định công thức của X. Cho các phát biểu:', ideas: ['a', 'b', 'c', 'd'], correct: 'DSSD' })).toBe(false)
  })
  it('cờ kho `tuLuan` / nhãn `kieu: tu_luan` ⇒ tự luận dù đáp án là số', () => {
    expect(laCauTuLuan({ phan: 'III', text: 'Tính m.', correct: '5', tuLuan: true })).toBe(true)
    expect(laCauTuLuan({ phan: 'III', de: 'Tính m.', dap_an: '5', kieu: 'tu_luan' })).toBe(true)
  })
})

// ───────────── KÊNH 1: kho → chỉ mục game (normalizeBank/lamNhe) ─────────────
const cauGame = (o: Partial<PrivateQuestion>): PrivateQuestion => ({
  qid: 'DB-12-X-III-5', maDe: 'DB-12-X', version: 'v', group: 'g', phan: 'III', text: MOHR, choices: [], ideas: [], hinhAnh: [], dang: 'D1', tenDang: '', mucDo: 'hieu', sao: 1, kienThuc: [], family: null,
  correct: DA_MOHR, solution: null, reviewed: true, ...o,
} as PrivateQuestion)

describe('KÊNH game (Đảo / Đoàn / Bi-a / Trả lời câu hỏi — cùng pool + napCau/currentQuestion dùng laCauTuLuan)', () => {
  it('bản nhẹ của pool mang cờ tuLuan đúng; câu số giữ nguyên', () => {
    expect(laTuLuanPool(lamNhe(cauGame({})))).toBe(true)
    expect(laTuLuanPool(lamNhe(cauGame({ text: 'Tính m (gam).', correct: '7,5' })))).toBe(false)
    expect(jsonLaTuLuan(JSON.stringify(cauGame({})))).toBe(true) // qidTuLuanTrongLuot / qidPhucVuDuoc / cauKhoKhongTuLuan đọc JSON chỉ mục
    expect(jsonLaTuLuan(JSON.stringify(cauGame({ text: 'Tính m (gam).', correct: '7,5' })))).toBe(false)
  })
  it('chỉ mục: nhãn tự luận của kho (kieu tu_luan) đi theo câu vào PrivateQuestion (normalizeBank)', async () => {
    const goi = {
      ma_de: '12-KHO-30',
      cau: [
        { phan: 'III', so: 1, de: 'Tính m (gam).', dap_an: '7,5', kieu: 'tu_luan', muc_do: 'hieu' },
        { phan: 'III', so: 2, de: 'Tính V (lít).', dap_an: '2,24', kieu: 'bai_tap', muc_do: 'hieu' },
      ],
    }
    const qs = await normalizeBank(goi as unknown as Record<string, unknown>, '12-KHO-30')
    expect(qs).toHaveLength(2)
    expect(laCauTuLuan(qs[0])).toBe(true)
    expect(laCauTuLuan(qs[1])).toBe(false)
    expect(laTuLuanPool(lamNhe(qs[0]))).toBe(true)
    // cổng nhập kho giữ cờ riêng, không nhét vào `kieu` (chỉ nhận lý thuyết/bài tập)
    const p = parseKhoDeJson(goi)
    const src = buildTeacherSourceFromKhoDe(p.json!).source
    expect((src.phanIII[0] as { tuLuan?: boolean }).tuLuan).toBe(true)
    expect((src.phanIII[1] as { tuLuan?: boolean }).tuLuan).toBeUndefined()
  })
})

// ───────────── KÊNH 2: Tu luyện (lượt đang mở) ─────────────
describe('KÊNH Tu luyện: lượt đang làm còn câu tự luận ⇒ bỏ qua (không chấm, không tính sai)', () => {
  it('cauRiengTuLuan theo đáp án đã cất trong lượt', () => {
    expect(cauRiengTuLuan({ phan: 'III', qid: 'DB-12-X-III-5~1', dapAn: DA_MOHR })).toBe(true)
    expect(cauRiengTuLuan({ phan: 'III', qid: 'DB-12-X-III-6', dapAn: '1,2375×10⁹ kJ' })).toBe(false)
    expect(cauRiengTuLuan({ phan: 'I', qid: 'DB-12-X-I-1', dapAn: 'B' })).toBe(false)
    expect(cauRiengTuLuan({ phan: 'II', qid: 'DB-12-X-II-1', dapAn: 'DSSD' })).toBe(false)
  })
})

// ───────────── KÊNH 3: Luyện đề cấu trúc ─────────────
type Cau = Record<string, unknown>
const nguon = (I: Cau[], II: Cau[], III: Cau[]): TeacherExamSource => ({ maDe: 'BD12', nhom: '12 · Bộ đề', phanI: I, phanII: II, phanIII: III }) as unknown as TeacherExamSource
describe('KÊNH Luyện đề cấu trúc (rutDeChuan2026 + chấm đề cũ)', () => {
  function khoDu(): TeacherExamSource[] {
    const I: Cau[] = [], II: Cau[] = [], III: Cau[] = []
    for (const muc of ['biet', 'hieu', 'van_dung'] as const) {
      for (let i = 0; i < MA_TRAN_HOA_2026.I[muc]; i++) I.push({ id: `I-${muc}-${i}`, text: `Câu I riêng ${muc} ${i} chất A${i}${muc}`, choices: ['a', 'b', 'c', 'd'], correct: 'A', mucDo: muc })
      for (let i = 0; i < MA_TRAN_HOA_2026.II[muc]; i++) II.push({ id: `II-${muc}-${i}`, text: `Câu II riêng ${muc} ${i} chất B${i}${muc}`, ideas: ['a', 'b', 'c', 'd'], correct: ['D', 'S', 'S', 'D'], mucDo: muc })
      for (let i = 0; i < MA_TRAN_HOA_2026.III[muc]; i++) III.push({ id: `III-${muc}-${i}`, text: `Câu III riêng ${muc} ${i}: tính m của chất C${i}${muc}.`, correct: `${i + 1},5`, mucDo: muc })
      // câu tự luận kiểu ảnh thầy chen vào mỗi ô phần III
      III.push({ id: `III-${muc}-cong-thuc`, text: `${MOHR} (${muc})`, correct: DA_MOHR, mucDo: muc })
    }
    return [nguon(I, II, III)]
  }
  it('không seed nào rút câu đáp án công thức', () => {
    for (let s = 0; s < 20; s++) {
      const de = rutDeChuan2026(khoDu(), `seed-${s}`)
      const iii = de.flatMap((x) => x.phanIII)
      expect(iii).toHaveLength(6)
      expect(iii.some((q) => q.id.endsWith('cong-thuc'))).toBe(false)
    }
  })
  it('đề đã rút TRƯỚC luật còn câu tự luận ⇒ không chấm, không trừ điểm, gắn tuLuan (sổ học bỏ qua)', () => {
    const src = nguon([], [], [{ id: 'III-a', text: MOHR, correct: DA_MOHR }, { id: 'III-b', text: 'Tính m.', correct: '7,5' }])
    const r = chamDeChuan([src], { 'III-b': '7,5' })
    expect(r.detail['III-a']).toMatchObject({ points: 0.25, tuLuan: true })
    expect(r.detail['III-b']).toMatchObject({ points: 0.25 })
    expect(r.detail['III-b']).not.toHaveProperty('tuLuan')
    expect(r.score).toBe(0.5)
    const sai = chamDeChuan([src], { 'III-b': '1' })
    expect(sai.detail['III-b']!.points).toBe(0)
  })
  it('laCauRutDuoc của đề thầy (TeacherShortAnswerQuestion) loại câu công thức', () => {
    expect(laCauRutDuoc({ id: 'x-III-1', text: MOHR, correct: DA_MOHR }, 'III')).toBe(false)
    expect(laCauRutDuoc({ id: 'x-III-2', text: 'Tính m.', correct: '7,5' }, 'III')).toBe(true)
  })
})

// ───────────── KÊNH 4: hàng soạn lời giải / Hỏi thầy (loaiCau) ─────────────
describe('KÊNH lời giải hàng soạn (loaiCau)', () => {
  it('câu công thức và câu gắn nhãn tu_luan KHÔNG vào hàng soạn; câu số vẫn vào', () => {
    const cau = cauTrongGoi('DB-12-X', {
      cau: [
        { phan: 'III', so: 1, de: MOHR, dap_an: DA_MOHR },
        { phan: 'III', so: 2, de: 'Tính m.', dap_an: '7,5', kieu: 'tu_luan' },
        { phan: 'III', so: 3, de: 'Tính m.', dap_an: '7,5' },
      ],
    })
    expect(cau.map(loaiCau)).toEqual([null, null, 'tln'])
  })
})

// ───────────── KÊNH 5: Câu đã làm + PDF ─────────────
const ctMohr = (emTraLoi: string | null, tuLuanMayChu = false) =>
  docChiTiet({
    de: { qid: 'DB-12-X-III-5', phan: 'III', text: MOHR, choices: [], ideas: [], hinhAnh: [], tenDang: 'Muối kép', mucDo: 'van_dung', maDe: 'DB-12-X', sao: 1 },
    dapAn: DA_MOHR,
    loiGiai: null,
    emTraLoi,
    ...(tuLuanMayChu ? { tuLuan: true } : {}),
  })!
describe('KÊNH Câu đã làm + PDF: câu tự luận em đã trả lời ⇒ nhãn "Câu tự luận — không chấm tự động", không đỏ/xanh, không tính sai', () => {
  it('máy em tự nhận ra (máy chủ cũ) và nhận cờ máy chủ', () => {
    expect(ctMohr('FeSO4').tuLuan).toBe(true)
    expect(ctMohr(null, true).tuLuan).toBe(true)
    const so = docChiTiet({ de: { qid: 'q', phan: 'III', text: 'Tính m.', choices: [], ideas: [], hinhAnh: [], tenDang: '', mucDo: null, maDe: 'M', sao: null }, dapAn: '7,5', loiGiai: null, emTraLoi: '7,5' })!
    expect(so.tuLuan).toBeUndefined()
  })
  it('tóm tắt thẻ: không đúng/sai; đáp án chỉ tham khảo', () => {
    const t = tomTatThe(ctMohr('FeSO4'))
    expect(t).toMatchObject({ tuLuan: true, dung: false, em: 'FeSO4', dapAn: DA_MOHR })
    expect(propsTheCau(ctMohr('FeSO4'), 5)).toMatchObject({ phan: 'III', tuLuan: true })
  })
  it('danh sách: câu tự luận không vào "Sai lần gần nhất" / "Đang ôn"; chỉ ở "Tất cả"', () => {
    const kq = docCauDaLam({
      cau: [
        { qid: 'a', chienDichId: 'cd', stt: 1, phan: 'III', trangThai: 'dang_on', lanCuoiDung: false, lichSu: [{ ngay: '2026-09-29', dung: false }], tuLuan: true },
        { qid: 'b', chienDichId: 'cd', stt: 2, phan: 'III', trangThai: 'dang_on', lanCuoiDung: false, lichSu: [{ ngay: '2026-09-29', dung: false }] },
      ],
      chienDich: [{ id: 'cd', ten: 'CD', tong: 2 }],
    })
    if (!kq.cheDo2) throw new Error('phải là chế độ 2.0')
    const [a, b] = kq.cau
    expect(a).toMatchObject({ tuLuan: true, lanCuoiDung: null })
    const loc = (id: string) => BO_LOC.find((x) => x.id === id)!.hop
    expect(loc('tat_ca')(a!)).toBe(true)
    expect(loc('sai_gan')(a!)).toBe(false)
    expect(loc('dang_on')(a!)).toBe(false)
    expect(loc('sai_gan')(b!)).toBe(true)
  })
  it('thẻ xem lại (TheCau) — không tô đúng/sai, ghi nhãn tự luận', () => {
    const { container, getByText, queryByText } = render(<TheCau {...propsTheCau(ctMohr('FeSO4'), 5)} />)
    expect(getByText(NHAN_TU_LUAN)).toBeTruthy()
    expect(getByText('Đáp án tham khảo')).toBeTruthy()
    expect(queryByText('Em chưa trả lời câu này.')).toBeNull()
    const tt = Array.from(container.querySelectorAll('[data-trang-thai]')).map((x) => x.getAttribute('data-trang-thai'))
    expect(tt).not.toContain('sai')
    expect(tt).not.toContain('dung')
  })
  it('PDF: đầu câu mang nhãn tự luận thay trạng thái; không dấu ✗', () => {
    const muc = { qid: 'DB-12-X-III-5', chienDichId: 'cd', stt: 5, phan: 'III' as const, mucDo: 'van_dung', tenDang: '', trangThai: 'dang_on' as const, lanCuoiDung: null, henOn: null, lichSu: [{ ngay: '2026-09-29', dung: false, coGoiY: false }], tuLuan: true }
    const m = { muc, ct: ctMohr('FeSO4') }
    expect(dauCauPdf(m)).toContain(NHAN_TU_LUAN)
    const html = cauPdfHtml(m)
    expect(html).not.toContain('✗')
    expect(html).toContain('Đã làm 29/09')
  })
})

// ───────────── Câu đã làm phía máy chủ: ẩn câu tự luận chưa trả lời ─────────────
function dbGia(cau: { qid: string; ma_de: string; version: string; json: string }[], daTraLoi: string[]) {
  return {
    DB: {
      prepare(sql: string) {
        return {
          bind(..._a: unknown[]) {
            return {
              async all() {
                if (/FROM game_v2_question/.test(sql)) return { results: cau }
                if (/FROM su_kien_hoc/.test(sql)) return { results: daTraLoi.map((qid) => ({ qid })) }
                return { results: [] }
              },
            }
          },
        }
      },
    },
  } as unknown as Parameters<typeof phanLoaiTuLuanDaLam>[0]
}
describe('máy chủ Câu đã làm: phân loại tự luận + đã trả lời', () => {
  it('câu công thức là tự luận; chỉ câu có kết quả trong sổ là "đã trả lời"', async () => {
    const env = dbGia(
      [
        { qid: 'a', ma_de: 'M', version: 'v1', json: JSON.stringify(cauGame({ qid: 'a' })) },
        { qid: 'b', ma_de: 'M', version: 'v1', json: JSON.stringify(cauGame({ qid: 'b' })) },
        { qid: 'c', ma_de: 'M', version: 'v1', json: JSON.stringify(cauGame({ qid: 'c', text: 'Tính m.', correct: '7,5' })) },
      ],
      ['a'],
    )
    const meta = (qid: string) => ({ qid, maDe: 'M', version: 'v1', group: '', phan: 'III' as const, mucDo: null, dang: null, tenDang: null, sao: 0 })
    const r = await phanLoaiTuLuanDaLam(env, 'SBD1', ['a', 'b', 'c'].map((qid) => ({ qid, m: meta(qid) })))
    expect([...r.tuLuan].sort()).toEqual(['a', 'b'])
    expect([...r.daTraLoi]).toEqual(['a'])
  })
})
