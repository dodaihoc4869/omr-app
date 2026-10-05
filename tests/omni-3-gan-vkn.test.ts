// @vitest-environment node
// OMNI 3 · D1 — A.I Đỗ Đại Học tự gắn vi kỹ năng (server/src/omni-gan-vkn.ts `ganVknCau`, hàm THUẦN).
// (1) 40 câu mẫu tự soạn: lý thuyết Phần I (kể cả câu chứa chữ "hiệu suất", "dư", "pH", "ΔH", "pha loãng"… mà không tính gì), tính toán Phần I/III
//     có/không nhãn bước, Phần II lẫn ý lý thuyết và ý tính; (2) câu THẬT của kho (docs/ra-soat-hien-thi-de-2809/sao-luu-truoc-sua.json, 799 câu):
//     bất biến + các ca vàng đã soát tay (đúng nhãn và KHÔNG gắn nhầm).
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { ganVknCau, nhanTuBuoc, THAM_SO_GAN, TEN_LOI_NEN, type CauCanGan, type KetQuaGan } from '../server/src/omni-gan-vkn'
import { TEN_NEN } from '../server/src/thang-tu-go'

const D = 'dang:HOA.DANG.MAU'
const nen = (r: KetQuaGan) => r.q.vkn.filter((v) => v.startsWith('nen:')).map((v) => v.slice(4))
const nenY = (r: KetQuaGan) => (r.q.vknY ?? []).map((ds) => ds.filter((v) => v.startsWith('nen:')).map((v) => v.slice(4)))
const cau = (qid: string, x: Partial<CauCanGan>): CauCanGan => ({ qid, phan: 'III', maDang: 'HOA.DANG.MAU', ...x })
const pa = (a: string, b: string, c: string, d: string) => ({ A: a, B: b, C: c, D: d })

function batBien(r: KetQuaGan) {
  expect(r.q.vkn.length).toBeGreaterThan(0)
  expect(r.q.vkn[0]).toMatch(/^(dang|cd|cau):/)
  expect(r.q.nguon).toBe('goi_y')
  expect(new Set(r.q.vkn).size).toBe(r.q.vkn.length)
  for (const n of [...nen(r), ...nenY(r).flat()]) expect(Object.keys(TEN_NEN), n).toContain(n)
  expect(nen(r).length).toBeLessThanOrEqual(THAM_SO_GAN.NEN_TOI_DA)
  expect([THAM_SO_GAN.DO_TIN.BUOC, THAM_SO_GAN.DO_TIN.MAU, THAM_SO_GAN.DO_TIN.DANG]).toContain(r.doTin)
  if (r.q.phan === 'II') {
    expect(r.q.vknY).toHaveLength(4)
    for (const y of r.q.vknY!) { expect(y.length).toBeGreaterThan(0); expect(y[0]).toBe(r.q.vkn[0]) }
  } else expect(r.q.vknY).toBeUndefined()
}

// ---------------------------------------------------------------- 1. câu lý thuyết: chỉ dạng
const LY_THUYET: [string, CauCanGan][] = [
  ['LT1 chất điện li', cau('LT1', { phan: 'I', de: 'Chất nào sau đây là chất điện li mạnh?', pa: pa('NaCl', 'C₂H₅OH', 'C₆H₁₂O₆', 'CH₃COOH'), loiGiai: { chot: 'NaCl là muối tan, phân li hoàn toàn trong nước.' } })],
  ['LT2 chữ "hiệu suất" không có phép tính', cau('LT2', { phan: 'I', de: 'Để tăng hiệu suất tổng hợp NH₃ theo phản ứng N₂ + 3H₂ ⇌ 2NH₃ (ΔrH°₂₉₈ = −92 kJ), cần', pa: pa('tăng nhiệt độ', 'giảm áp suất', 'tăng áp suất', 'thêm xúc tác'), loiGiai: { chot: 'Chiều thuận giảm số mol khí nên tăng áp suất làm tăng hiệu suất; tăng nhiệt độ làm hiệu suất giảm.' } })],
  ['LT3 chữ "dư/hết"', cau('LT3', { phan: 'I', de: 'Cho Fe tan hết trong dung dịch HCl dư, muối thu được là', pa: pa('FeCl₃', 'FeCl₂', 'FeCl₂ và FeCl₃', 'Fe(OH)₂'), loiGiai: { chot: 'HCl dư chỉ oxi hoá Fe lên +2 nên thu được FeCl₂.' } })],
  ['LT4 pH không tính', cau('LT4', { phan: 'I', de: 'Dung dịch nào sau đây có pH > 7?', pa: pa('NaCl', 'HCl', 'NaOH', 'H₂SO₄'), loiGiai: { chot: 'NaOH là base mạnh nên dung dịch có pH > 7; pH tăng dần khi nhỏ thêm base.' } })],
  ['LT5 cân bằng + ΔH cho sẵn', cau('LT5', { phan: 'I', de: 'Cho cân bằng: 2SO₂(g) + O₂(g) ⇌ 2SO₃(g); ΔrH°₂₉₈ = −198,4 kJ. Tăng nhiệt độ thì cân bằng', pa: pa('chuyển dịch theo chiều thuận', 'chuyển dịch theo chiều nghịch', 'không chuyển dịch', 'dừng lại'), loiGiai: { chot: 'Chiều thuận toả nhiệt (ΔrH < 0) nên tăng nhiệt độ cân bằng chuyển theo chiều nghịch.' }, kienThuc: ['Nguyên lí Le Chatelier'] })],
  ['LT6 pha loãng an toàn', cau('LT6', { phan: 'I', de: 'Khi pha loãng dung dịch H₂SO₄ 98% cần làm thế nào?', pa: pa('Rót nước vào acid', 'Rót từ từ acid vào nước', 'Rót nhanh acid vào nước', 'Trộn cùng lúc'), loiGiai: { chot: 'Pha loãng acid đặc phải rót từ từ acid vào nước và khuấy đều.' } })],
  ['LT7 công thức phân tử cho sẵn', cau('LT7', { phan: 'I', de: 'Công thức phân tử của glucose là', pa: pa('C₆H₁₂O₆', 'C₁₂H₂₂O₁₁', 'C₆H₁₀O₅', 'C₂H₅OH'), loiGiai: { chot: 'Glucose có công thức phân tử C₆H₁₂O₆.' } })],
  ['LT8 tốc độ phản ứng định tính', cau('LT8', { phan: 'I', de: 'Yếu tố nào sau đây không làm tăng tốc độ phản ứng?', pa: pa('Tăng nhiệt độ', 'Tăng nồng độ', 'Dùng xúc tác', 'Giảm diện tích tiếp xúc'), loiGiai: { chot: 'Giảm diện tích tiếp xúc làm tốc độ phản ứng giảm.' } })],
  ['LT9 thế điện cực so sánh', cau('LT9', { phan: 'I', de: 'Cho E°(Zn²⁺/Zn) = −0,76 V; E°(Cu²⁺/Cu) = +0,34 V. Phát biểu nào đúng?', pa: pa('Zn khử được Cu²⁺', 'Cu khử được Zn²⁺', 'Zn²⁺ oxi hoá được Cu', 'Không phản ứng'), loiGiai: { chot: 'Thế điện cực chuẩn của Zn nhỏ hơn nên Zn có tính khử mạnh hơn Cu, khử được Cu²⁺.' } })],
  ['LT10 đếm phản ứng oxi hoá – khử (Phần III, đáp án số)', cau('LT10', { phan: 'III', de: 'Cho các phản ứng: (1) Fe + 2HCl → FeCl₂ + H₂; (2) NaOH + HCl → NaCl + H₂O; (3) 2Na + Cl₂ → 2NaCl. Có bao nhiêu phản ứng oxi hoá – khử?', loiGiai: { buoc: ['(1) Fe từ 0 lên +2: oxi hoá – khử.', '(2) không đổi số oxi hoá.', '(3) Na từ 0 lên +1: oxi hoá – khử.', 'Vậy có 2 phản ứng.'] } })],
]

// ---------------------------------------------------------------- 2. câu tính toán, dò mẫu mạnh
const TINH: [string, CauCanGan, string[]][] = [
  ['T1 bảo toàn khối lượng', cau('T1', { de: 'Nung 10 gam CaCO₃ … thu được 5,6 gam CaO và m gam CO₂. Tính m.', loiGiai: { buoc: ['Áp dụng định luật bảo toàn khối lượng: m = 10 − 5,6 = 4,4.'] } }), ['bao_toan_khoi_luong']],
  ['T2 thể tích khí đkc + khối lượng ↔ mol', cau('T2', { de: 'Nung 20 gam CaCO₃ thu được V lít CO₂ (đkc). Tính V.', loiGiai: { buoc: ['n(CaCO₃) = 20 : 100 = 0,2 mol = n(CO₂).', 'V = 0,2 · 24,79 = 4,958 lít.'] } }), ['doi_mol_khoi_luong', 'doi_mol_the_tich_khi']],
  ['T3 hiệu suất', cau('T3', { de: 'Lên men 36 gam glucose với hiệu suất 80%. Tính khối lượng ethanol.', loiGiai: { buoc: ['n(glucose) = 36 : 180 = 0,2 mol; n(C₂H₅OH) lí thuyết = 0,4 mol.', 'm = 0,4 · 46 · 80% = 14,72 gam.'] } }), ['hieu_suat', 'doi_mol_khoi_luong']],
  ['T4 nồng độ phần trăm', cau('T4', { de: 'Hoà tan 15 gam NaCl vào 135 gam nước. Tính C% của dung dịch.', loiGiai: { buoc: ['m dung dịch = 15 + 135 = 150 gam.', 'C% = 15 : 150 × 100% = 10%.'] } }), ['nong_do_phan_tram']],
  ['T5 nồng độ mol', cau('T5', { de: 'Hoà tan 0,2 mol NaOH vào nước được 500 mL dung dịch. Tính nồng độ mol.', loiGiai: { buoc: ['V = 0,5 L.', 'CM = n : V = 0,2 : 0,5 = 0,4 M.'] } }), ['nong_do_mol']],
  ['T6 pH', cau('T6', { de: 'Tính pH của dung dịch HCl 0,01 M.', loiGiai: { buoc: ['[H⁺] = 0,01 M.', 'pH = −lg(0,01) = 2.'] } }), ['ph_nong_do_ion']],
  ['T7 Faraday', cau('T7', { de: 'Điện phân dung dịch CuSO₄ với I = 5 A trong 1930 giây. Tính khối lượng Cu.', loiGiai: { buoc: ['n(e) = I · t : F = 5 · 1930 : 96500 = 0,1 mol.', 'm(Cu) = 64 · 0,1 : 2 = 3,2 gam.'] } }), ['dien_phan_faraday', 'doi_mol_khoi_luong']],
  ['T8 thế điện cực, pin', cau('T8', { de: 'Tính sức điện động chuẩn của pin Zn–Cu.', loiGiai: { buoc: ['E°pin = E°(Cu²⁺/Cu) − E°(Zn²⁺/Zn) = 0,34 − (−0,76) = 1,10 V.'] } }), ['the_dien_cuc_pin']],
  ['T9 hằng số cân bằng', cau('T9', { de: 'Tại cân bằng có 0,8 mol HI, 0,1 mol H₂ và 0,1 mol I₂. Tính KC.', loiGiai: { buoc: ['KC = 0,8²/(0,1 · 0,1) = 64.'] } }), ['hang_so_can_bang']],
  ['T10 nhiệt tạo thành', cau('T10', { de: 'Tính biến thiên enthalpy của phản ứng từ nhiệt tạo thành chuẩn các chất.', loiGiai: { buoc: ['ΔrH = ΣΔfH(sản phẩm) − ΣΔfH(chất đầu) = 2·(−393,5) − 2·(−110,5) = −566 kJ.'] } }), ['bien_thien_enthalpy']],
  ['T11 năng lượng liên kết (không phải nhiệt tạo thành)', cau('T11', { de: 'Tính ΔrH của phản ứng H₂ + Cl₂ → 2HCl theo năng lượng liên kết.', loiGiai: { buoc: ['ΔrH = ΣEb(chất đầu) − ΣEb(sản phẩm) = 436 + 243 − 2 · 432 = −185 kJ.'] } }), ['nang_luong_lien_ket']],
  ['T12 chất dư chất hết', cau('T12', { de: 'Cho 0,1 mol Fe vào dung dịch chứa 0,3 mol HCl. Tính số mol H₂.', loiGiai: { buoc: ['So sánh: 0,1/1 < 0,3/2 ⇒ Fe hết, HCl dư.', 'n(H₂) = n(Fe) = 0,1 mol.'] } }), ['chat_du_het']],
  ['T13 hệ phương trình', cau('T13', { de: 'Hỗn hợp 8 gam gồm Fe và Mg tác dụng hết với HCl thu được 0,2 mol H₂. Tính số mol Fe.', loiGiai: { buoc: ['Gọi x, y lần lượt là số mol Fe và Mg.', 'Ta có: 56x + 24y = 8; x + y = 0,2.', 'Giải ra x = 0,1; y = 0,1.'] } }), ['lap_he_phuong_trinh', 'doi_mol_khoi_luong']],
  ['T14 tỉ khối + giá trị trung bình', cau('T14', { de: 'Hỗn hợp X gồm CH₄ và C₂H₄ có tỉ khối so với H₂ là 11. Tính phần trăm số mol CH₄.', loiGiai: { buoc: ['Khối lượng mol trung bình M = 11 · 2 = 22.', '16a + 28(1 − a) = 22 ⇒ a = 0,5.'] } }), ['ti_khoi_khi', 'gia_tri_trung_binh']],
  ['T15 độ bất bão hoà', cau('T15', { de: 'Tính độ bất bão hoà của C₆H₆.', loiGiai: { buoc: ['k = (2C + 2 − H) : 2 = (2·6 + 2 − 6) : 2 = 4.'] } }), ['do_bat_bao_hoa']],
  ['T16 tốc độ phản ứng có tính', cau('T16', { de: 'Nồng độ Br₂ giảm từ 0,6 M xuống 0,4 M sau 20 giây. Tính tốc độ trung bình của phản ứng.', loiGiai: { buoc: ['v = (0,6 − 0,4) : 20 = 0,01 M/s.'] } }), ['toc_do_phan_ung']],
  ['T17 pha loãng có tính', cau('T17', { de: 'Pha loãng 100 mL dung dịch HCl 0,5 M thành dung dịch 0,1 M. Tính thể tích sau pha loãng.', loiGiai: { buoc: ['C₁V₁ = C₂V₂ ⇒ V₂ = 0,5 · 100 : 0,1 = 500 mL.'] } }), ['dung_dich_pha_loang']],
  ['T18 bảo toàn nguyên tố', cau('T18', { de: 'Đốt cháy hoàn toàn hydrocarbon X thu được 0,3 mol CO₂ và 0,4 mol H₂O. Tính khối lượng X.', loiGiai: { buoc: ['Bảo toàn nguyên tố C: n(C) = 0,3; bảo toàn H: n(H) = 0,8.', 'm = 0,3 · 12 + 0,8 = 4,4 gam.'] } }), ['bao_toan_nguyen_to', 'doi_mol_khoi_luong']],
  ['T19 phần trăm khối lượng', cau('T19', { de: 'Hỗn hợp gồm 5,6 gam Fe và 6,4 gam Cu. Tính phần trăm khối lượng Fe.', loiGiai: { buoc: ['%m(Fe) = 5,6 : 12 × 100% = 46,67%.'] } }), ['phan_tram_khoi_luong']],
  ['T20 khối lượng riêng', cau('T20', { de: 'Tính khối lượng của 50 mL dung dịch có khối lượng riêng 1,2 g/mL.', loiGiai: { buoc: ['m = D · V = 1,2 · 50 = 60 gam.'] } }), ['khoi_luong_rieng']],
  ['T21 công thức phân tử phải tìm', cau('T21', { de: 'Đốt cháy 0,1 mol X thu được 0,2 mol CO₂ và 0,3 mol H₂O. Xác định công thức phân tử của X.', loiGiai: { buoc: ['Số C = 0,2 : 0,1 = 2; số H = 2 · 0,3 : 0,1 = 6.', 'Công thức phân tử của X là C₂H₆.'] } }), ['cong_thuc_phan_tu']],
  ['T22 cân bằng phương trình (tổng hệ số)', cau('T22', { phan: 'I', de: 'Cho sơ đồ: Al + HNO₃ → Al(NO₃)₃ + NO + H₂O. Tổng hệ số (nguyên, tối giản) của các chất là', pa: pa('9', '8', '10', '12'), loiGiai: { chot: 'Al + 4HNO₃ → Al(NO₃)₃ + NO + 2H₂O, tổng hệ số 1 + 4 + 1 + 1 + 2 = 9.' } }), ['can_bang_phuong_trinh']],
]

describe('ganVknCau — câu lý thuyết chỉ gắn dạng (kể cả khi có chữ giống bài tính)', () => {
  it.each(LY_THUYET)('%s', (_t, c) => {
    const r = ganVknCau(c)
    batBien(r)
    expect(r.q.vkn).toEqual([D])
    expect(r.nguonNhan).toBe('dang')
    expect(r.doTin).toBe(1)
  })
})

describe('ganVknCau — câu tính toán: dò mẫu mạnh', () => {
  it.each(TINH)('%s', (_t, c, mongDoi) => {
    const r = ganVknCau(c)
    batBien(r)
    expect(new Set(nen(r))).toEqual(new Set(mongDoi))
    expect(r.q.vkn[0]).toBe(D)
    expect(r.nguonNhan).toBe('mau')
    expect(r.doTin).toBe(0.8)
    expect(r.lyDo.some((l) => l.startsWith('Dò mẫu:'))).toBe(true)
  })
  it('chữ "theo phương trình hoá học sau:" chỉ để giới thiệu phương trình ⇒ không gắn tỉ lệ mol', () => {
    const r = ganVknCau(cau('T23', { de: 'Phản ứng xảy ra theo phương trình hoá học sau: 2SO₂ + O₂ ⇌ 2SO₃. Tính KC khi biết [SO₃] = 0,4 M; [SO₂] = 0,2 M; [O₂] = 0,1 M.', loiGiai: { buoc: ['KC = 0,4² : (0,2² · 0,1) = 40.'] } }))
    expect(nen(r)).toEqual(['hang_so_can_bang']) // nồng độ cho sẵn ⇒ KHÔNG gắn nồng độ mol
  })
  it('hiệu suất 100 % (lý tưởng) không cần kỹ năng hiệu suất', () => {
    const r = ganVknCau(cau('T24', { de: 'Từ 1 tấn quặng pyrite (giả sử hiệu suất mỗi giai đoạn đạt 100%) sản xuất được bao nhiêu tấn H₂SO₄?', loiGiai: { buoc: ['n(FeS₂) = 10⁶ : 120 = 8333 mol ⇒ n(H₂SO₄) = 2 · 8333 = 16667 mol.', 'm = 16667 · 98 = 1,633·10⁶ gam = 1,63 tấn.'] } }))
    expect(nen(r)).not.toContain('hieu_suat')
  })
  it('câu có phép tính nhưng không dò chắc kiến thức nền nào ⇒ chỉ dạng, ghi rõ lý do', () => {
    const r = ganVknCau(cau('T25', { de: 'Tổng số hạt proton, neutron, electron của nguyên tử X là 34, số hạt mang điện nhiều hơn không mang điện là 10. Tính số khối.', loiGiai: { buoc: ['2Z + N = 34; 2Z − N = 10 ⇒ Z = 11, N = 12.', 'A = Z + N = 11 + 12 = 23.'] } }))
    expect(r.q.vkn).toEqual([D])
    expect(r.lyDo).toContain('Có phép tính nhưng chưa dò chắc kiến thức nền nào ⇒ chỉ gắn dạng')
  })
  it('quá 3 nhãn ⇒ cắt nhãn chung trước (đổi mol ↔ khối lượng)', () => {
    const r = ganVknCau(cau('T26', { de: 'Cho 5,6 gam Fe vào 200 mL dung dịch HCl 1M với hiệu suất 80%.', loiGiai: { buoc: ['n(Fe) = 5,6 : 56 = 0,1 mol; n(HCl) = 0,2 · 1 = 0,2 mol.', 'So sánh: 0,1/1 = 0,2/2 nên vừa đủ; Bảo toàn khối lượng: m muối = 5,6 + 0,2 · 36,5 − 0,2 = 12,7 gam.', 'Thực tế: 12,7 · 80% = 10,16 gam.'] } }))
    batBien(r)
    expect(nen(r)).toHaveLength(3)
    expect(nen(r)).not.toContain('doi_mol_khoi_luong')
    expect(r.lyDo.some((l) => l.includes('vượt 3 nhãn') && l.includes('doi_mol_khoi_luong'))).toBe(true)
  })
  it('công thức viết \\ce{…} (chữ số ASCII) cũng không bị coi là phép tính', () => {
    const r = ganVknCau(cau('T27', { phan: 'I', de: 'Cân bằng \\ce{N2 + 3H2 <=> 2NH3}, \\ce{ΔH = -92 kJ}. Khi tăng áp suất, hiệu suất phản ứng', pa: pa('tăng', 'giảm', 'không đổi', 'bằng 0'), loiGiai: { chot: 'Chiều thuận giảm số mol khí \\ce{(4 -> 2)} nên hiệu suất tăng.' } }))
    expect(r.q.vkn).toEqual([D])
  })
})

describe('ganVknCau — nhãn nền từng bước đã soạn (cau_bo_tro) là nguồn tin cậy nhất', () => {
  const coBuoc = (nhanNen: { buoc: number; nen: string }[], x: Partial<CauCanGan> = {}) => cau('B', { de: 'Tính hiệu suất phản ứng.', loiGiai: { buoc: ['H = 8 : 10 × 100% = 80%.'] }, nhanNen, ...x })
  it('theo thứ tự bước, bỏ trùng, bỏ lam_tron_ket_qua khỏi cổng AND; doTin 1; không dò mẫu thêm', () => {
    const r = ganVknCau(coBuoc([{ buoc: 2, nen: 'lam_tron_ket_qua' }, { buoc: 1, nen: 'bao_toan_nguyen_to' }, { buoc: 0, nen: 'doi_mol_khoi_luong' }, { buoc: 3, nen: 'doi_mol_khoi_luong' }]))
    batBien(r)
    expect(r.q.vkn).toEqual([D, 'nen:doi_mol_khoi_luong', 'nen:bao_toan_nguyen_to'])
    expect(r.nguonNhan).toBe('buoc')
    expect(r.doTin).toBe(1)
    expect(r.lyDo).toContain('Bỏ lam_tron_ket_qua khỏi cổng AND (kỹ năng phụ)')
  })
  it('lam_tron_ket_qua là nhãn duy nhất ⇒ giữ', () => {
    expect(ganVknCau(coBuoc([{ buoc: 0, nen: 'lam_tron_ket_qua' }])).q.vkn).toEqual([D, 'nen:lam_tron_ket_qua'])
  })
  it("nhãn 'khac' / ngoài TEN_NEN bị bỏ ⇒ lùi về dò mẫu", () => {
    const r = ganVknCau(coBuoc([{ buoc: 0, nen: 'khac' }, { buoc: 1, nen: 'nhan_la' }]))
    expect(r.nguonNhan).toBe('mau')
    expect(nen(r)).toEqual(['hieu_suat'])
  })
  it('quá 3 nhãn bước ⇒ giữ 3 nhãn đầu theo bước', () => {
    const r = ganVknCau(coBuoc(['hieu_suat', 'chat_du_het', 'nong_do_mol', 'ph_nong_do_ion'].map((n, i) => ({ buoc: i, nen: n }))))
    expect(nen(r)).toEqual(['hieu_suat', 'chat_du_het', 'nong_do_mol'])
    expect(nhanTuBuoc([{ buoc: 0, nen: 'khac' }]).nhan).toEqual([])
  })
})

describe('ganVknCau — Phần II: vi kỹ năng từng ý', () => {
  const II = (x: Partial<CauCanGan>) => cau('II', { phan: 'II', de: 'Cho phản ứng thuận nghịch H₂ + I₂ ⇌ 2HI trong bình 2 lít.', ...x })
  it('ý lý thuyết chỉ dạng; ý tính nhận nhãn của chính ý; cả câu = hợp các ý', () => {
    const r = ganVknCau(II({
      y: ['Phản ứng thuận toả nhiệt.', 'Nồng độ HI lúc cân bằng là 0,85 M.', 'Hiệu suất phản ứng là 85%.', 'Muốn hiệu suất cao cần thêm chất đầu.'],
      loiGiai: { chot: 'Dùng số liệu bảng.', tungY: { a: { dung: true, viSao: 'ΔrH < 0.' }, b: { dung: true, viSao: '[HI] = 1,7/2 = 0,85 M.' }, c: { dung: true, viSao: 'H = 0,85 : 1 × 100% = 85%.' }, d: { dung: true, viSao: 'Thêm chất đầu làm cân bằng chuyển theo chiều thuận.' } } },
    }))
    batBien(r)
    expect(nenY(r)).toEqual([[], ['nong_do_mol'], ['hieu_suat'], []])
    expect(new Set(nen(r))).toEqual(new Set(['nong_do_mol', 'hieu_suat']))
    expect(r.nguonNhan).toBe('mau')
  })
  it('có nhãn bước ⇒ ý chỉ nhận nhãn thuộc tập nhãn bước; cả câu = dạng ∪ nhãn bước; doTin 1', () => {
    const r = ganVknCau(II({
      nhanNen: [{ buoc: 0, nen: 'hang_so_can_bang' }],
      y: ['Biểu thức KC đúng.', 'KC = 64.', 'Nồng độ HI là 0,4 M.', 'Phản ứng thuận nghịch.'],
      loiGiai: { tungY: { a: { dung: true, viSao: 'Sản phẩm ở tử số.' }, b: { dung: true, viSao: 'KC = 0,8²/(0,1 · 0,1) = 64.' }, c: { dung: false, viSao: '[HI] = 0,8/2 = 0,4 M.' }, d: { dung: true, viSao: 'Có mũi tên hai chiều.' } } },
    }))
    batBien(r)
    expect(r.q.vkn).toEqual([D, 'nen:hang_so_can_bang'])
    expect(nenY(r)).toEqual([[], ['hang_so_can_bang'], [], []])
    expect(r.doTin).toBe(1)
  })
  it('ý nêu con số mà lời giải chung TÍNH RA, lời giải chung chỉ có MỘT nhãn ⇒ ý kế thừa nhãn đó', () => {
    const r = ganVknCau(II({
      de: 'Cho enthalpy tạo thành chuẩn của CO(g), NO(g), CO₂(g) lần lượt là −110,5; 91,3; −393,5 kJ/mol. Phản ứng: 2CO + 2NO → 2CO₂ + N₂.',
      y: ['Phản ứng giúp giảm khí độc.', 'CO là chất oxi hoá.', 'Biến thiên enthalpy chuẩn của phản ứng là −748,6 kJ.', 'Phản ứng thuận lợi về năng lượng.'],
      loiGiai: { chot: 'ΔrH = 2·(−393,5) − [2·(−110,5) + 2·91,3] = −748,6 kJ.', tungY: { a: { dung: true, viSao: 'CO, NO thành CO₂, N₂.' }, b: { dung: false, viSao: 'CO là chất khử.' }, c: { dung: true, viSao: 'Đúng: −748,6 kJ.' }, d: { dung: true, viSao: 'Toả nhiệt mạnh.' } } },
    }))
    batBien(r)
    expect(nenY(r)).toEqual([[], [], ['bien_thien_enthalpy'], []])
    expect(r.lyDo.some((l) => l.includes('kế thừa nhãn duy nhất') && l.includes('748,6'))).toBe(true)
  })
  it('lời giải dạng chuỗi "a) … b) … c) … d) …" được tách theo ý', () => {
    const r = ganVknCau(II({ y: ['A', 'B', 'C', 'D'], loiGiai: 'a) Sai vì ngược chiều. b) Đúng: [HI] = 1,7/2 = 0,85 M. c) Sai. d) Đúng: H = 0,85 : 1 × 100% = 85%.' }))
    expect(nenY(r)).toEqual([[], ['nong_do_mol'], [], ['hieu_suat']])
  })
  it('thiếu ý ⇒ vẫn đủ 4 vknY (ý vắng chỉ dạng)', () => {
    const r = ganVknCau(II({ y: ['Chỉ một ý.'] }))
    batBien(r)
    expect(r.q.vknY).toEqual([[D], [D], [D], [D]])
  })
})

describe('ganVknCau — vi kỹ năng gốc, kienThuc, nhãn kiểm định tuần, tất định', () => {
  it('thiếu mã dạng ⇒ cd:<chuyên đề>; chuyên đề điền tạm "Hoá học" hoặc vắng ⇒ cau:<qid>', () => {
    expect(ganVknCau({ qid: 'Q1', phan: 'I', chuyenDe: 'Ester – lipid', de: 'Ester là gì?' }).q.vkn).toEqual(['cd:Ester – lipid'])
    expect(ganVknCau({ qid: 'Q2', phan: 'I', chuyenDe: 'Hoá học', de: 'x' }).q.vkn).toEqual(['cau:Q2'])
    expect(ganVknCau({ qid: 'Q3', phan: 'III', dang: { ma: 'ESTER.THUY_PHAN.TINH' }, de: 'x' }).q.vkn).toEqual(['dang:ESTER.THUY_PHAN.TINH'])
  })
  it('kienThuc khớp NGUYÊN VĂN (bỏ dấu) vi kỹ năng riêng của dạng ⇒ thêm id vi kỹ năng đó', () => {
    const vknDang = [{ id: 'HOA.DANG.MAU#1', maDang: 'HOA.DANG.MAU', ten: 'Tỉ lệ ester – NaOH', thuTu: 1 }, { id: 'HOA.DANG.MAU#2', maDang: 'HOA.DANG.MAU', ten: 'Ester của phenol', thuTu: 2 }]
    const r = ganVknCau(cau('K', { phan: 'I', de: 'x', kienThuc: ['tỉ lệ ester – naoh', 'Một câu dài khác không khớp'] }), { vknDang })
    expect(r.q.vkn).toEqual([D, 'HOA.DANG.MAU#1'])
  })
  it('nhãn kiểm định tuần đã thêm theo dữ liệu được giữ khi gắn lại', () => {
    const r = ganVknCau(cau('W', { phan: 'II', y: ['a', 'b', 'c', 'd'] }), { themNhan: [{ y: -1, vkn: 'nen:hieu_suat' }, { y: 2, vkn: 'nen:hieu_suat' }] })
    expect(r.q.vkn).toEqual([D, 'nen:hieu_suat'])
    expect(r.q.vknY![2]).toEqual([D, 'nen:hieu_suat'])
    expect(r.q.vknY![0]).toEqual([D])
  })
  it('tất định: cùng đầu vào ⇒ cùng kết quả', () => {
    for (const [, c] of [...LY_THUYET, ...TINH.map(([t, x]) => [t, x] as [string, CauCanGan])]) expect(JSON.stringify(ganVknCau(c))).toBe(JSON.stringify(ganVknCau(c)))
  })
  it('TEN_LOI_NEN phủ mọi nhãn TEN_NEN, là cụm chữ thường dùng sau "vướng ở bước …"', () => {
    expect(Object.keys(TEN_LOI_NEN).sort()).toEqual(Object.keys(TEN_NEN).sort())
    for (const t of Object.values(TEN_LOI_NEN)) {
      const khongKyHieu = t.replace('pH', '').replace('Faraday', '') // ký hiệu và tên riêng giữ chữ hoa
      expect(khongKyHieu).toBe(khongKyHieu.toLocaleLowerCase('vi'))
      expect(t.length).toBeGreaterThan(5)
    }
    expect(TEN_LOI_NEN.bao_toan_khoi_luong).toBe('bảo toàn khối lượng')
    expect(TEN_LOI_NEN.doi_mol_khoi_luong).toBe('đổi khối lượng ra số mol')
  })
})

// ---------------------------------------------------------------- câu thật của kho
const GOC = path.resolve(__dirname, '..')
const THAT = JSON.parse(fs.readFileSync(path.join(GOC, 'docs/ra-soat-hien-thi-de-2809/sao-luu-truoc-sua.json'), 'utf8')) as Record<string, { cau: Record<string, unknown> }>
const ganThat = (qid: string) => {
  const c = THAT[qid]!.cau as Record<string, never>
  return ganVknCau({ qid, phan: c.phan, dang: c.dang, chuyenDe: c.chuyen_de, mucDo: c.muc_do, de: c.de, pa: c.pa, y: c.y, loiGiai: c.loi_giai, kienThuc: c.kienThuc, bang: c.bang })
}

describe('ganVknCau — câu thật của kho (799 câu)', () => {
  it('bất biến trên mọi câu: không rỗng, Phần II đủ 4 ý, nhãn thuộc TEN_NEN, ≤ 3 nhãn nền', () => {
    expect(Object.keys(THAT).length).toBeGreaterThan(700)
    for (const qid of Object.keys(THAT)) batBien(ganThat(qid))
  })
  it.each([
    ['11-C1-B1-II-15', 'ý a, b tính nồng độ mol; ý c hằng số cân bằng; ý d hiệu suất', (r: KetQuaGan) => expect(nenY(r)).toEqual([['nong_do_mol'], ['nong_do_mol'], ['hang_so_can_bang'], ['hieu_suat']])],
    ['DB-11-B6-D3-II-7', 'chỉ ý c (ΔrH = −748,6 kJ) cần nhiệt tạo thành', (r: KetQuaGan) => expect(nenY(r)).toEqual([[], [], ['bien_thien_enthalpy'], []])],
    ['12-C6-B20-II-1', 'ý a kế thừa nhiệt tạo thành (−882,4 kJ); ý c cần đổi 1 kg ra mol và ΔrH(2)', (r: KetQuaGan) => { expect(nenY(r)[0]).toEqual(['bien_thien_enthalpy']); expect(new Set(nenY(r)[2])).toEqual(new Set(['doi_mol_khoi_luong', 'bien_thien_enthalpy'])) }],
    ['11-C1-B1-II-13', 'Le Chatelier thuần lý thuyết ⇒ chỉ dạng', (r: KetQuaGan) => { expect(nen(r)).toEqual([]); expect(nenY(r).flat()).toEqual([]) }],
    ['10-C4-B15-III-5', 'đếm phản ứng oxi hoá – khử (đáp án số) ⇒ chỉ dạng', (r: KetQuaGan) => expect(nen(r)).toEqual([])],
    ['12-C2-B4-D2-III-32', 'công thức phân tử CHO SẴN (lactic acid) ⇒ không gắn tìm công thức', (r: KetQuaGan) => expect(nen(r)).not.toContain('cong_thuc_phan_tu')],
    ['DH-12-C2-B6-III-49', '"Xác định công thức phân tử chất Y" ⇒ tìm công thức', (r: KetQuaGan) => expect(nen(r)).toContain('cong_thuc_phan_tu')],
    ['11-C1-B1-III-9', '"tổng hệ số các chất khí ở hai vế" (Δn khí) ⇒ không phải cân bằng phương trình', (r: KetQuaGan) => expect(nen(r)).not.toContain('can_bang_phuong_trinh')],
    ['DB-11-B5-D2-III-76', 'tổng hệ số sau khi cân bằng ⇒ cân bằng phương trình', (r: KetQuaGan) => expect(nen(r)).toContain('can_bang_phuong_trinh')],
    ['DB-10-B8-D1-I-37', '"K có bán kính…" không phải hằng số cân bằng', (r: KetQuaGan) => expect(nen(r)).not.toContain('hang_so_can_bang')],
    ['DB-11-B5-D2-I-52', 'V = 0,1 × 24,79 ⇒ đổi mol ↔ thể tích khí', (r: KetQuaGan) => expect(nen(r)).toContain('doi_mol_the_tich_khi')],
    ['DB-11-B6-D3-II-5', 'ΔrH theo năng lượng liên kết ⇒ không gắn nhiệt tạo thành', (r: KetQuaGan) => { expect(nen(r)).toContain('nang_luong_lien_ket'); expect(nen(r)).not.toContain('bien_thien_enthalpy') }],
    ['DB-11-B1-D1-III-226', 'Kc với nồng độ CHO SẴN ⇒ không gắn nồng độ mol', (r: KetQuaGan) => { expect(nen(r)).toContain('hang_so_can_bang'); expect(nen(r)).not.toContain('nong_do_mol') }],
    ['12-KT-C5-D4-I-16', 'phương án bị dính chữ câu sau ("pH = 14") ⇒ không gắn pH', (r: KetQuaGan) => expect(nen(r)).not.toContain('ph_nong_do_ion')],
    ['DB-11-B8-D1-III-16', 'hiệu suất mỗi giai đoạn 100 % ⇒ không gắn hiệu suất', (r: KetQuaGan) => expect(nen(r)).not.toContain('hieu_suat')],
    ['11-C2-B7-III-2', 'bài tính H₂SO₄ có hiệu suất 80 %, khí đkc', (r: KetQuaGan) => { expect(nen(r)).toContain('hieu_suat'); expect(nen(r)).toContain('doi_mol_the_tich_khi') }],
  ] as [string, string, (r: KetQuaGan) => void][])('%s — %s', (qid, _mo, kiem) => {
    const r = ganThat(qid)
    batBien(r)
    kiem(r)
  })
})
