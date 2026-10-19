// THẦY 19/10: "hỏi thầy gọi ý tới bước ba bị lỗi hiển thị kí tự". Nguyên nhân gốc: em ĐANG LÀM ⇒ máy chủ bỏ CÂU lộ đáp án (chanLoDapAn) SAU khi đã
// cân cặp dấu tô ⇒ câu bị bỏ mang theo nửa cặp **…** ⇒ "**Bước cuối…" hiện nguyên dấu sao. Nấc 3 ("gợi bước cuối để em tự kết luận") gần đáp án nhất
// nên hay bị cắt nhất. Sửa: cân dấu lại sau khi lọc (máy chủ) + ChuTo không bao giờ in dấu tô lẻ (câu trả lời cũ trong lịch sử).
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { lamSachCauTruc, type BoiCanhKhuon } from '../server/src/hoi-tro-ly-cau-truc'
import { CAU_CHUA_NOP, chanLoDapAn } from '../server/src/hoi-tro-ly'
import TraLoiThay, { ChuTo, docCauTruc } from '../src/components/loi-giai/TraLoiThay'

afterEach(cleanup)
const PA = { A: 'methylamine, glucose, aniline', B: 'aniline, glucose, methylamine', C: 'glucose, methylamine, aniline', D: 'methylamine, aniline, glucose' }
const chan = (phan: string, dapAn: string, pa: Record<string, string> | null) => (t: string) => { const r = chanLoDapAn(t, phan, dapAn, pa); return r === CAU_CHUA_NOP ? '' : r }
const bo = (phan: string, dapAn: string, pa: Record<string, string> | null): BoiCanhKhuon => ({ khuon: 'goi-y', phan, de: 'Đề.', pa, y: null, dapAn, dapAnEm: '' })
const nac3 = (chu: string, phan = 'I', dapAn = 'A', pa: Record<string, string> | null = PA) =>
  lamSachCauTruc({ lienQuan: true, yChinh: 'Thầy gợi ý 3 nấc.', nac: [{ ten: 'Một', chu: 'Nấc một.' }, { ten: 'Hai', chu: 'Nấc hai.' }, { ten: 'Loại phương án', chu }] }, true, chan(phan, dapAn, pa), bo(phan, dapAn, pa))!

describe('máy chủ: dấu tô không lẻ sau khi bỏ câu lộ đáp án', () => {
  it('nấc 3: bỏ câu nêu phương án đúng giữa cặp ** ⇒ không còn "**" lẻ, chữ còn lại giữ nguyên', () => {
    // "A.** Em…" là MỘT câu với chanLoDapAn (sau dấu chấm là **) ⇒ bỏ cả câu; điều cần: không còn "**" lẻ.
    expect(nac3('**Bước cuối: ghép từng chất với ống. Vậy đáp án là A.** Em tự kiểm lại nhé.').nac![2]!.chu).toBe('Bước cuối: ghép từng chất với ống.')
  })
  it('phần III: bỏ câu chứa đáp số giữa cặp ** ⇒ phần còn lại không còn dấu lẻ', () => {
    const c = nac3('Nhân **0,16 × 24,79 = 3,97 L. Đổi đơn vị** nếu cần.', 'III', '3,97', null).nac![2]!.chu
    expect(c).toBe('Đổi đơn vị nếu cần.')
  })
  it('cặp ** còn nguyên thì giữ (vẫn tô đậm)', () => {
    expect(nac3('Chất nào **không có** nhóm chức của ống ấy thì gạch cả phương án.').nac![2]!.chu).toBe('Chất nào **không có** nhóm chức của ống ấy thì gạch cả phương án.')
  })
  it('*nghiêng* một dấu sao (markdown) ⇒ bỏ dấu, giữ chữ; phép nhân 2*3 và **đậm** không bị đụng', () => {
    const c = nac3('*Lưu ý:* xét **gốc** gắn với N, 2*3 không đổi.').nac![2]!.chu
    expect(c).toBe('Lưu ý: xét **gốc** gắn với N, 2*3 không đổi.')
  })
})

describe('máy em: ChuTo không in dấu tô lẻ', () => {
  it('"**", "==", "!!" lẻ không hiện; cặp vẫn tô', () => {
    for (const [vao, ra] of [['**Bước cuối: ghép từng chất.', 'Bước cuối: ghép từng chất.'], ['Đổi đơn vị** nếu cần.', 'Đổi đơn vị nếu cần.'], ['m ==8,2 gam', 'm 8,2 gam'], ['Em lấy !!gốc ethyl', 'Em lấy gốc ethyl']] as const) {
      cleanup()
      const { container } = render(<p><ChuTo text={vao} /></p>)
      expect(container.textContent).toBe(ra)
    }
    cleanup()
    const { container } = render(<p><ChuTo text="Chất nào **không có** nhóm chức" /></p>)
    expect(container.querySelector('strong')!.textContent).toBe('không có')
  })
  it('mở tới gợi ý 3 trên màn: không có dấu sao nào (câu trả lời cũ còn dấu lẻ trong lịch sử)', () => {
    const ct = docCauTruc({ khuon: 'goi-y', yChinh: 'Gợi ý.', buoc: [], bang: null, ghiNho: '', hoiTiep: [], nac: [{ ten: 'Một', chu: 'Nấc một.', khoi: '' }, { ten: 'Hai', chu: 'Nấc hai.', khoi: '' }, { ten: 'Loại phương án', chu: '**Bước cuối: ghép từng chất với ống.', khoi: '' }] })!
    const { container } = render(<TraLoiThay ct={ct} dangLam />)
    fireEvent.click(screen.getByRole('button', { name: /Mở gợi ý 2/ }))
    fireEvent.click(screen.getByRole('button', { name: /Mở gợi ý 3/ }))
    const p3 = container.querySelectorAll('.lg-nac > li')[2]!.querySelector('p')!
    expect(p3.textContent).toBe('Bước cuối: ghép từng chất với ống.')
  })
})
