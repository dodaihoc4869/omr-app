// @vitest-environment jsdom
// SỐ Ô TRẢ LỜI NGẮN = ĐÚNG SỐ KÍ TỰ CẦN ĐIỀN (thầy 15/10 ~10:25, Telegram, ảnh câu amine đáp án "24" mà màn làm bài hiện 4 ô): "Tôi vẫn thấy hiển thị chọn 4 ô
// bạn hãy sửa app và đẩy lên luôn, tuỳ vào đáp án mà hiển thị đúng số ô cần điền nhé". Ghi đè quyết định sáng 15/10 (mức cố định 4 / 8 ô để khỏi lộ độ dài).
// Luật mới: số ô = độ dài chuỗi gõ chuẩn `dapSoGoPhim(correct)` (1..TRAN_O); quá TRAN_O hoặc không gõ được ⇒ null (chốt kênh số `ngoaiKenhSo` giữ nguyên).
// Câu công khai mang `soO` cho MỌI câu Phần III gõ được, vẫn không mang correct / solution / chuỗi đáp án. Câu thiếu `soO` (gói cũ, máy chủ cũ) ⇒ 4 ô như phiếu.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import ManLamBaiTap from '../src/components/hoc-tap/ManLamBaiTap'
import { goiHoa2 } from '../src/components/hoa2/api'
import { nhanPhim, phimCoTacDung, type PhimSo } from '../src/components/hoc-tap/lam-bai'
import { grade, publicQuestion, type PrivateQuestion } from '../src/game/than-thu-v2/core'
import { SO_O_PHIEU, TRAN_O, ngoaiKenhSo, soOCuaCau, soOPhanIII } from '../src/lib/so-o-tra-loi-ngan'
vi.mock('../src/components/hoa2/api', async (goc) => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: vi.fn() }))
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.mocked(goiHoa2).mockReset(); localStorage.clear() })

const DE_AMINE = 'Cho các chất sau: (1) ammonia, (2) methylamine, (3) aniline, (4) dimethylamine. Liệt kê các chất theo số thứ tự tăng dần có lực base mạnh hơn ammonia?'
const cauIII = (qid: string, correct: string, text = 'Tính kết quả.'): PrivateQuestion => ({
  qid, maDe: 'DE-SO-O', version: 'v1', group: 'g', phan: 'III', text, choices: [], ideas: [], hinhAnh: [], dang: null, tenDang: 'Amine', mucDo: 'hieu', sao: 0, kienThuc: [],
  correct, solution: 'Lời giải', reviewed: true,
})
const go = (chuoi: string, soO?: number) => [...chuoi].reduce((v, c) => nhanPhim(v, c as PhimSo, soO), '')

describe('luật số ô mới (phép thuần)', () => {
  it('số ô = đúng số kí tự đáp số gõ chuẩn: 24 ⇒ 2, 7,5 ⇒ 3, 2024 ⇒ 4, 10000 ⇒ 5, ×10ⁿ ⇒ định trị, -96,9 ⇒ 5, 7 ⇒ 1', () => {
    expect(soOPhanIII('24')).toBe(2)
    expect(soOPhanIII('7,5')).toBe(3)
    expect(soOPhanIII('2024')).toBe(4)
    expect(soOPhanIII('10000')).toBe(5)
    expect(soOPhanIII('1,2375×10⁹ kJ')).toBe(6)
    expect(soOPhanIII('-96,9')).toBe(5)
    expect(soOPhanIII('7')).toBe(1)
    expect(soOPhanIII('25%')).toBe(2) // đơn vị viết theo bị bỏ: gõ "25"
    expect(soOPhanIII('12345678')).toBe(TRAN_O)
  })
  it('quá TRAN_O ô hoặc không gõ được ⇒ null (chốt kênh số giữ nguyên)', () => {
    expect(soOPhanIII('123456789')).toBeNull()
    for (const c of ['AlCl₃', 'Na mạnh hơn Mg', '', '13,1 g; 14,1 g']) expect(soOPhanIII(c), c).toBeNull()
    expect(ngoaiKenhSo(cauIII('q', '123456789'))).toBe(true)
    expect(ngoaiKenhSo(cauIII('q', '24'))).toBe(false)
  })
  it('máy em đọc số ô 1..TRAN_O; thiếu / lạ ⇒ 4 như phiếu', () => {
    expect(soOCuaCau({ soO: 2 })).toBe(2); expect(soOCuaCau({ soO: 1 })).toBe(1); expect(soOCuaCau({ soO: 3 })).toBe(3)
    expect(soOCuaCau({ soO: 4 })).toBe(4); expect(soOCuaCau({ soO: 5 })).toBe(5); expect(soOCuaCau({ soO: TRAN_O })).toBe(TRAN_O)
    for (const la of [undefined, null, 0, -2, 2.5, 9, 99, 'x', NaN]) expect(soOCuaCau({ soO: la }), String(la)).toBe(SO_O_PHIEU)
    expect(soOCuaCau({})).toBe(SO_O_PHIEU); expect(soOCuaCau(null)).toBe(SO_O_PHIEU); expect(soOCuaCau(undefined)).toBe(SO_O_PHIEU)
  })
  it('publicQuestion gửi soO cho MỌI câu Phần III gõ được (24 ⇒ 2, 2024 ⇒ 4), không gửi đáp án; Phần I / câu không gõ được không có soO', () => {
    for (const [c, n] of [['24', 2], ['2024', 4], ['7,5', 3], ['10000', 5], ['-1,5', 4]] as const) {
      const pub = publicQuestion(cauIII('Q-III-1', c, DE_AMINE)) as unknown as Record<string, unknown>
      expect(pub.soO, c).toBe(n)
      expect(pub).not.toHaveProperty('correct'); expect(pub).not.toHaveProperty('solution')
      expect(JSON.stringify(pub), c).not.toContain(JSON.stringify(c))
    }
    expect(publicQuestion({ ...cauIII('Q-I-1', 'A'), phan: 'I', choices: ['a', 'b', 'c', 'd'] })).not.toHaveProperty('soO')
    expect(publicQuestion(cauIII('Q-III-2', 'AlCl₃'))).not.toHaveProperty('soO')
  })
  it('bàn phím 2 ô: gõ 2-4-9 vẫn "24"; phím số, dấu phẩy, dấu trừ mờ khi đủ; xoá vẫn bấm được', () => {
    expect(go('249', 2)).toBe('24')
    for (const p of ['0', '9', ',', '-'] as PhimSo[]) expect(phimCoTacDung('24', p, 2), p).toBe(false)
    expect(phimCoTacDung('24', 'xoa', 2)).toBe(true); expect(phimCoTacDung('24', 'xoa-het', 2)).toBe(true)
    expect(go('5-', 2)).toBe('-5'); expect(go('-5', 2)).toBe('-5') // đáp số âm 2 kí tự gõ đủ
    expect(go('7,59', 3)).toBe('7,5'); expect(go('99', 1)).toBe('9')
  })
})

describe('màn làm bài thật: số ô theo đúng đáp số', () => {
  const moMan = (cau: object[], cham?: (tra: string) => { correct: boolean; answer: string }) => {
    vi.mocked(goiHoa2).mockImplementation(async (lenh: string, _tk: string, du: Record<string, unknown> = {}) => {
      if (lenh === 'hoc-tap-start') return { ok: true, id: 'p1', questions: cau }
      if (lenh === 'answer') return { ok: true, solution: 'x', ...(cham ? cham(String(du.answer ?? '')) : { correct: false, answer: '' }) }
      return { ok: true }
    })
    return render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={null} />)
  }
  const soOHien = () => screen.getByRole('region', { name: 'Ô trả lời' }).querySelectorAll('.ht2-lam-o').length
  const daGuiAnswer = () => vi.mocked(goiHoa2).mock.calls.filter(([lenh]) => lenh === 'answer').map(([, , than]) => (than as { answer?: string }).answer)

  it('câu amine đáp án "24" (ảnh thầy): 2 ô; bấm 2-4-9 vẫn "24"; phím số mờ sau 2 kí tự; nộp chấm Đúng', async () => {
    const q = cauIII('12-C3-B8-D2-III-7', '24', DE_AMINE)
    moMan([publicQuestion(q)], (tra) => ({ correct: grade(q, tra), answer: q.correct }))
    const phim = within(await screen.findByRole('group', { name: 'Bàn phím số' }))
    expect(soOHien()).toBe(2)
    for (const p of ['2', '4', '9']) fireEvent.click(phim.getByRole('button', { name: p }))
    expect(soOHien()).toBe(2)
    expect((phim.getByRole('button', { name: '9' }) as HTMLButtonElement).disabled).toBe(true)
    expect((phim.getByRole('button', { name: 'Dấu phẩy' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: /^Nộp câu · 24$/ }))
    await waitFor(() => expect(daGuiAnswer()).toEqual(['24']))
    expect(await screen.findByText('Đúng · tự làm')).toBeTruthy()
    expect(document.querySelectorAll('.ht2-lam-o-hang[data-ket=dung] .ht2-lam-o')).toHaveLength(2)
  })
  it('phím máy tính cùng hành vi: gõ 2-4-9 ⇒ "24" (2 ô)', async () => {
    const q = cauIII('12-C3-B8-D2-III-7', '24', DE_AMINE)
    moMan([publicQuestion(q)], (tra) => ({ correct: grade(q, tra), answer: q.correct }))
    await screen.findByRole('group', { name: 'Bàn phím số' })
    for (const k of ['2', '4', '9']) fireEvent.keyDown(window, { key: k })
    expect(soOHien()).toBe(2)
    fireEvent.click(screen.getByRole('button', { name: /^Nộp câu · 24$/ }))
    await waitFor(() => expect(daGuiAnswer()).toEqual(['24']))
  })
  it('câu 10000 hiện 5 ô (gõ đủ 10000, kí tự thứ 6 không vào); câu 2024 hiện 4 ô; câu 7,5 hiện 3 ô', async () => {
    for (const [c, n] of [['10000', 5], ['2024', 4], ['7,5', 3]] as const) {
      const q = cauIII(`DE-III-${n}`, c)
      moMan([publicQuestion(q)], (tra) => ({ correct: grade(q, tra), answer: q.correct }))
      const phim = within(await screen.findByRole('group', { name: 'Bàn phím số' }))
      expect(soOHien(), c).toBe(n)
      for (const p of [...c.replace(',', 'P'), '9']) fireEvent.click(phim.getByRole('button', { name: p === 'P' ? 'Dấu phẩy' : p }))
      expect(soOHien(), c).toBe(n)
      expect(screen.getByRole('button', { name: new RegExp(`^Nộp câu · ${c}$`) }), c).toBeTruthy()
      cleanup(); vi.mocked(goiHoa2).mockReset()
    }
  })
  it('câu thiếu soO (gói cũ / máy chủ cũ): vẫn 4 ô như phiếu', async () => {
    const { soO: _bo, ...cu } = publicQuestion(cauIII('DE-III-9', '24')) as unknown as Record<string, unknown>
    moMan([cu])
    const phim = within(await screen.findByRole('group', { name: 'Bàn phím số' }))
    for (const p of ['1', '2', '3', '4', '5']) fireEvent.click(phim.getByRole('button', { name: p }))
    expect(soOHien()).toBe(4)
    expect(screen.getByRole('button', { name: /^Nộp câu · 1234$/ })).toBeTruthy()
  })
  it('1–3 ô giữ ô phiếu 58 px (không bật kiểu co ô của > 4 ô); 5 ô mới chia đều', async () => {
    moMan([publicQuestion(cauIII('DE-III-2', '24'))])
    await screen.findByRole('group', { name: 'Bàn phím số' })
    const hang = document.querySelector('.ht2-lam-o-hang') as HTMLElement
    expect(hang.hasAttribute('data-nhieu')).toBe(false)
    cleanup(); vi.mocked(goiHoa2).mockReset()
    moMan([publicQuestion(cauIII('DE-III-5', '10000'))])
    await screen.findByRole('group', { name: 'Bàn phím số' })
    const hang5 = document.querySelector('.ht2-lam-o-hang') as HTMLElement
    expect(hang5.hasAttribute('data-nhieu')).toBe(true)
    expect(hang5.style.getPropertyValue('--so-o')).toBe('5')
  })
})
