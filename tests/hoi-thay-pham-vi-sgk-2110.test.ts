// @vitest-environment node
// Thầy 21/10 (ảnh Câu 33 C4H11N): Hỏi Thầy chỉ trả lời trong SGK Hoá 10–11–12 Kết nối tri thức; amine bậc hai, bậc ba coi là không phản ứng với
// HNO2; bỏ câu tương đương; nạp skill "giai-bai-phong-cach-thay" (cách giải + kĩ thuật Thầy đã giảng) và bộ chìa khoá chương.
// SQL chạy trên SQLite trong bộ nhớ; mô hình là hàm giả — không đo chất lượng mô hình thật.
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { CAU_NGOAI_SGK, PHAM_VI_SGK, chanNgoaiSgk, ngoaiSgk } from '../server/src/hoi-thay-pham-vi-sgk'
import { CACH_GIAI_THAY, chonKyThuat, chuBoChiaKhoa, chuKyThuat, napKyThuat } from '../server/src/hoi-thay-ky-thuat'
import { lamSachCauTruc, type BoiCanhKhuon } from '../server/src/hoi-tro-ly-cau-truc'
import { CHI_DAN_THAY, CAU_NGOAI_PHAM_VI, dungNoiDung, traLoiHoiThem, type NguCanhCau, type NoiDungGemini } from '../server/src/hoi-tro-ly'
import { damBaoBangLoiGiai } from '../server/src/loi-giai'
import { taoD1That } from './_d1-that'

afterEach(() => vi.restoreAllMocks())
beforeAll(() => napKyThuat())
const DE = 'Ứng với công thức phân tử C4H11N có bao nhiêu amine phản ứng với HNO2 ở nhiệt độ thường giải phóng khí N2?'
// Nguyên văn câu trả lời trong ảnh thầy gửi 21/10 (nấc gợi ý ngoài SGK).
const ANH = {
  lienQuan: true, yChinh: 'Em chỉ cần đếm các amine bậc một.',
  nac: [
    { ten: 'Cơ chế phản ứng', chu: 'Amine bậc một (RNH2) phản ứng với HNO2 tạo muối diazonium không bền, phân huỷ ngay thành N2.' },
    { ten: 'Amine bậc hai', chu: 'Amine bậc hai (R2NH) phản ứng với HNO2 tạo hợp chất nitroso (R2N-N=O) dạng dầu, không giải phóng khí.' },
    { ten: 'Kết luận', chu: 'Chỉ amine bậc một mới thoả mãn điều kiện đề bài, em hãy tập trung đếm các đồng phân bậc một.' },
  ],
  bay: { tieuDe: 'Bẫy hay nhầm', chu: 'Đừng nhầm lẫn hiện tượng của amine bậc một với bậc hai; chỉ bậc một mới có khí thoát ra.' },
}
const BO: BoiCanhKhuon = { khuon: 'goi-y', phan: 'III', de: DE, pa: null, y: null, dapAn: '4', dapAnEm: '' }

describe('chốt chặn PHẠM VI SGK (máy chủ)', () => {
  it('bỏ câu ngoài SGK: nitroso, diazonium phân huỷ, bậc hai phản ứng HNO2, cơ chế; giữ câu đúng SGK', () => {
    expect(ngoaiSgk(ANH.nac[1]!.chu)).toBe(true)
    expect(ngoaiSgk(ANH.nac[0]!.chu)).toBe(true)
    expect(ngoaiSgk('Amine bậc hai phản ứng với HNO2 tạo chất màu vàng.')).toBe(true)
    expect(ngoaiSgk('Xét theo cơ chế SN2 thì nhóm thế đi vào từ phía sau.')).toBe(true)
    expect(ngoaiSgk('Theo SGK, amine bậc hai, bậc ba không phản ứng với HNO2 nên không có khí.')).toBe(false)
    expect(ngoaiSgk('Alkylamine bậc một gặp HNO2 ở nhiệt độ thường tạo alcohol và giải phóng N2.')).toBe(false)
    expect(ngoaiSgk('Aniline gặp HNO2 ở 0–5 °C tạo muối diazonium.')).toBe(false)
    expect(ngoaiSgk(ANH.nac[2]!.chu)).toBe(false)
    // Chữ SGK có từ giống thuật ngữ cấm: không được bỏ nhầm.
    expect(ngoaiSgk('Sn2+ bị khử thành Sn; cặp Sn2+/Sn đứng trước Pb2+/Pb.')).toBe(false)
    expect(ngoaiSgk('Cơ chế giặt rửa: đầu ưa nước quay ra nước, đuôi kị nước bám vết dầu.')).toBe(false)
    expect(ngoaiSgk('Cơ chế ăn mòn điện hoá: kim loại mạnh hơn là cực âm.')).toBe(false)
    expect(ngoaiSgk('Cơ chế phản ứng thế ở đây là SN1.')).toBe(true)
  })
  it('dữ liệu kĩ thuật của Thầy không đổi nhầm "oxi hoá" thành "oxygen hoá", không có "phức chất tạp"', async () => {
    const { KY_THUAT_THO: chu } = await import('../server/src/hoi-thay-ky-thuat-du-lieu')
    expect(chu).not.toMatch(/oxygen\s*h[oó]/i)
    expect(chu).not.toContain('phức chất tạp')
    expect(chu).toMatch(/số oxi h[oó]a/)
  })
  it('thuật ngữ đã có trong đề / lời giải của Thầy thì không chặn', () => {
    expect(ngoaiSgk('Sản phẩm là hợp chất nitroso.', 'Đề: … tạo hợp chất nitroso …')).toBe(false)
    expect(chanNgoaiSgk('Câu một đúng. Câu hai có nitroso. Câu ba đúng.')).toBe('Câu một đúng. Câu ba đúng.')
    expect(chanNgoaiSgk('Chỉ có nitroso.')).toBe('')
  })
  it('đúng câu trả lời trong ảnh: bỏ hai nấc sai và tên "Cơ chế"; nấc còn lại + bẫy đúng SGK giữ nguyên', () => {
    for (const dangLam of [true, false]) {
      const c = lamSachCauTruc(ANH, dangLam, undefined, BO)!
      const chu = JSON.stringify(c)
      expect(chu).not.toMatch(/nitroso|Cơ chế|phân huỷ|dạng dầu/)
      expect(c.yChinh).toBe('Em chỉ cần đếm các amine bậc một.')
      expect(c.bay?.chu).toContain('chỉ bậc một mới có khí thoát ra')
      expect(c.nac).toBeUndefined() // còn 1 nấc < 2 ⇒ không vẽ thẻ nấc rời rạc
    }
  })
  it('tên bước ngoài SGK bị bỏ, chữ bước giữ', () => {
    const c = lamSachCauTruc({ lienQuan: true, yChinh: 'x', buoc: [{ ten: 'Cơ chế phản ứng', chu: 'Viết đồng phân bậc một.' }] }, false, undefined, { ...BO, khuon: 'giai-thich' })!
    expect(c.buoc).toEqual([{ ten: '', chu: 'Viết đồng phân bậc một.' }])
  })
})

describe('lời dặn + cách giải của Thầy', () => {
  it('lời dặn hệ thống có PHẠM VI SGK (Kết nối tri thức, quy tắc HNO2) và CÁCH GIẢI CỦA THẦY; bỏ câu kiểm lại; không còn "kiến thức Hoá phổ thông liên quan"', () => {
    expect(CHI_DAN_THAY).toContain(PHAM_VI_SGK)
    expect(CHI_DAN_THAY).toContain(CACH_GIAI_THAY)
    expect(CHI_DAN_THAY).toContain('Kết nối tri thức với cuộc sống')
    expect(CHI_DAN_THAY).toContain('Amine bậc hai, bậc ba: theo SGK coi là KHÔNG phản ứng với HNO2')
    expect(CHI_DAN_THAY).not.toContain('được giải thích kiến thức Hoá phổ thông liên quan')
    expect(CHI_DAN_THAY).not.toMatch(/kiemLai/)
    // Ví dụ mẫu trong lời dặn cũng phải qua được chốt chặn của chính máy chủ.
    const vd = CHI_DAN_THAY.slice(CHI_DAN_THAY.indexOf('Có bao nhiêu amine C3H9N'))
    const json = JSON.parse(vd.slice(vd.indexOf('⇒ ') + 2, vd.indexOf('\n'))) as Record<string, unknown>
    const c = lamSachCauTruc(json, false, undefined, { ...BO, khuon: 'giai-thich' })!
    expect(c.buoc).toHaveLength(2)
    expect(c.yChinh).toContain('amine bậc một')
  })
  it('kĩ thuật Thầy đã giảng khớp đúng dạng (HNO2 + amine bậc một); đề vô nghĩa không gửi gì', () => {
    const ds = chonKyThuat(DE, 'Hợp chất chứa nitrogen')
    expect(ds.length).toBeGreaterThan(0)
    expect(ds.length).toBeLessThanOrEqual(6)
    expect(ds[0]!.chu).toMatch(/HNO2/)
    expect(ds.filter((m) => m.loai === 'b').length).toBeLessThanOrEqual(2)
    expect(chuKyThuat('xyz qwe abc')).toBe('')
  })
  it('bộ chìa khoá chương: theo mã dạng, đánh dấu chìa khoá của dạng; vắng mã thì theo tên chương; chương lạ ⇒ rỗng', () => {
    const t = chuBoChiaKhoa('HOP_CHAT_N.AMINE_TINH_BASE.NHAN_DANG')
    expect(t).toContain('BỘ CHÌA KHOÁ CỦA THẦY · chương Hợp chất chứa nitrogen')
    expect(t).toContain('[CHÌA KHOÁ CỦA DẠNG NÀY] Chìa khoá Amine gặp thuốc thử')
    expect(t).not.toMatch(/<[a-z]/)
    expect(chuBoChiaKhoa('', 'Hợp chất chứa nitrogen')).toContain('Chìa khoá Bậc, tên, phổ IR')
    expect(chuBoChiaKhoa('KHONG_CO.X', 'Chương lạ')).toBe('')
  })
  it('gói gửi mô hình: lời dặn cố định (dùng lại bộ đệm), bộ chìa khoá + kĩ thuật nằm trong lượt dữ liệu câu', () => {
    const nc: NguCanhCau = { qid: 'Q', cau: { phan: 'III', so: '33', chuong: 'Hợp chất chứa nitrogen', dangMa: 'HOP_CHAT_N.AMINE_TINH_BASE.NHAN_DANG', de: DE, pa: null, y: null, dapAn: '4', bang: null, hinh: [], loiGiai: null }, hoSo: null, loiGiaiChu: null }
    const a = dungNoiDung(nc, [], 'Amine bậc hai có phản ứng không ạ?', { ketQuaGanNhat: 'sai', dapAnEm: '' })
    const b = dungNoiDung({ ...nc, cau: { ...nc.cau, de: 'Đề khác hẳn', dangMa: 'ESTER.X' } }, [], 'x', { ketQuaGanNhat: 'sai', dapAnEm: '' })
    expect(a.systemInstruction).toEqual(b.systemInstruction)
    const chu = a.contents[0]!.parts[0]!.text!
    expect(chu).toContain('BỘ CHÌA KHOÁ CỦA THẦY')
    expect(chu).toContain('THẦY ĐÃ GIẢNG DẠNG NÀY')
  })
})

describe('đầu-cuối traLoiHoiThem (SQLite trong bộ nhớ, mô hình giả)', () => {
  const NC: NguCanhCau = { qid: '12-SGK-III-33', cau: { phan: 'III', so: '33', chuong: 'Hợp chất chứa nitrogen', de: DE, pa: null, y: null, dapAn: '4', bang: null, hinh: [], loiGiai: null }, hoSo: null, loiGiaiChu: null }
  async function hoi(traLoi: string) {
    const d = await taoD1That()
    await damBaoBangLoiGiai(d.env)
    d.env.GEMINI_API_KEY = 'khoa-gia'
    const nd: NoiDungGemini[] = []
    const goiAi = vi.fn(async (_k: string, _c: unknown, n: NoiDungGemini) => { nd.push(n); return { ok: true as const, chu: traLoi, vao: 1, ra: 1 } })
    const kq = await traLoiHoiThem(d.env, 'EM-SGK', { qid: NC.qid, cauHoi: 'Amine bậc hai có phản ứng với HNO2 không ạ?', nguon: 'luyen' },
      { nguCanh: async () => ({ ok: true as const, ...NC }), goiAi, nowMs: Date.parse('2026-10-21T08:00:00Z') })
    return { kq, nd }
  }
  it('mô hình chỉ viết kiến thức ngoài SGK ⇒ câu báo ngoài SGK (không phải "ngoài phạm vi câu"), lượt vẫn ghi sổ là liên quan', async () => {
    const { kq } = await hoi(JSON.stringify({ lienQuan: true, yChinh: 'Amine bậc hai tạo hợp chất nitroso dạng dầu.' }))
    expect(kq).toMatchObject({ ok: true, traLoi: CAU_NGOAI_SGK, ngoaiPhamVi: false })
    expect(kq.traLoi).not.toBe(CAU_NGOAI_PHAM_VI)
  })
  it('câu trả lời đúng SGK đi qua nguyên vẹn; khuôn cũ chữ phẳng cũng bị lọc', async () => {
    const dung = await hoi(JSON.stringify({ lienQuan: true, yChinh: 'Theo SGK, amine bậc hai, bậc ba không phản ứng với HNO2 nên không có khí.' }))
    expect(dung.kq).toMatchObject({ ok: true, ngoaiPhamVi: false })
    expect(String(dung.kq.traLoi)).toContain('không phản ứng với HNO2')
    const cu = await hoi(JSON.stringify({ lienQuan: true, traLoi: 'Bậc một ra N2. Bậc hai tạo nitroso.' }))
    expect(cu.kq.traLoi).toBe('Bậc một ra N2.')
  })
})
