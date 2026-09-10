// "CÂU EM TỪNG SAI KHÔNG NẰM TRONG KHO CA NÀY" — nghiệm thu cách chữa tận gốc.
//
// Id câu được ghép từ `maDe`. Nạp lại kho ⇒ `maDe` đổi ⇒ id đổi, dù đề bài y
// nguyên. Ca cũ ghi id cũ nên tra trong kho HIỆN TẠI là hụt — đúng dòng thầy
// gặp ngày 10/09 ("SBD 12124 · sai 18 câu · cần 6 · rút được 0").
//
// Chữa: không đi tìm trong kho hiện tại nữa, lấy NGUYÊN VĂN câu đó từ bản đề
// CÓ ĐÁP ÁN của chính ca cũ.
import { beforeEach, describe, expect, it, vi } from 'vitest'

const loadSessionTeacherBank = vi.fn()
const saveSessionTeacherBank = vi.fn(async () => {})
const chiTietCa = vi.fn()

vi.mock('../src/lib/exam-db', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  loadSessionTeacherBank: (...a: unknown[]) => loadSessionTeacherBank(...a),
  saveSessionTeacherBank: (...a: unknown[]) => saveSessionTeacherBank(...a),
}))
vi.mock('../src/lib/exam-api', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  chiTietCa: (...a: unknown[]) => chiTietCa(...a),
}))

const { gomCauTuCaCu } = await import('../src/lib/de-rieng-nguon')

function mcq(id: string) {
  return { id, text: `Đề của ${id}`, choices: ['A', 'B', 'C', 'D'] as [string, string, string, string], correct: 'A' as const }
}

beforeEach(() => {
  loadSessionTeacherBank.mockReset()
  saveSessionTeacherBank.mockClear()
  chiTietCa.mockReset()
})

describe('gomCauTuCaCu — lấy câu từ bản đề của chính ca cũ', () => {
  it('lấy đúng nguyên văn câu em từng sai, kể cả khi kho hiện tại không còn id đó', async () => {
    loadSessionTeacherBank.mockResolvedValue([
      { maDe: 'DE-CU', phanI: [mcq('DE-CU-1'), mcq('DE-CU-2'), mcq('DE-CU-3')], phanII: [], phanIII: [] },
    ])
    const ra = await gomCauTuCaCu('u', 'm', new Map([['743814', new Set(['DE-CU-1', 'DE-CU-3'])]]))
    expect(ra.phanI.map((q) => q.id)).toEqual(['DE-CU-1', 'DE-CU-3'])
    expect(ra.phanI[0].text).toBe('Đề của DE-CU-1')
    expect(ra.thieu).toEqual([])
    expect(chiTietCa).not.toHaveBeenCalled()
  })

  it('máy thầy chưa có bản đề ca cũ thì xin máy chủ, rồi cất lại cho lần sau', async () => {
    loadSessionTeacherBank.mockResolvedValue(null)
    chiTietCa.mockResolvedValue({
      ca: { maCa: '879501' },
      luot: [],
      keyBank: { phanI: [mcq('X-7')], phanII: [], phanIII: [] },
    })
    const ra = await gomCauTuCaCu('u', 'm', new Map([['879501', new Set(['X-7'])]]))
    expect(ra.phanI.map((q) => q.id)).toEqual(['X-7'])
    expect(chiTietCa).toHaveBeenCalledWith('u', 'm', '879501', true)
    expect(saveSessionTeacherBank).toHaveBeenCalledTimes(1)
  })

  it('KHÔNG im lặng: ca không lấy được bản đề thì khai ra từng qid vào `thieu`', async () => {
    loadSessionTeacherBank.mockResolvedValue(null)
    chiTietCa.mockRejectedValue(new Error('mất mạng'))
    const ra = await gomCauTuCaCu('u', 'm', new Map([['352039', new Set(['Q-1', 'Q-2'])]]))
    expect(ra.phanI).toEqual([])
    expect(ra.thieu.sort()).toEqual(['Q-1', 'Q-2'])
  })

  it('câu có mặt ở hai ca chỉ lấy MỘT lần — nối trùng là đề em có hai câu giống hệt', async () => {
    loadSessionTeacherBank.mockImplementation(async (ma: string) => [
      { maDe: ma, phanI: [mcq('CHUNG-1')], phanII: [], phanIII: [] },
    ])
    const ra = await gomCauTuCaCu(
      'u',
      'm',
      new Map([
        ['caA', new Set(['CHUNG-1'])],
        ['caB', new Set(['CHUNG-1'])],
      ]),
    )
    expect(ra.phanI.map((q) => q.id)).toEqual(['CHUNG-1'])
    expect(ra.thieu).toEqual([])
  })

  it('gom được cả ba phần trong một lượt', async () => {
    loadSessionTeacherBank.mockResolvedValue([
      {
        maDe: 'D',
        phanI: [mcq('D-I1')],
        phanII: [{ id: 'D-II1', text: 'y', ideas: ['a', 'b', 'c', 'd'] as [string, string, string, string], correct: [true, false, true, false] as [boolean, boolean, boolean, boolean] }],
        phanIII: [{ id: 'D-III1', text: 'z', correct: '4,93' }],
      },
    ])
    const ra = await gomCauTuCaCu('u', 'm', new Map([['ca', new Set(['D-I1', 'D-II1', 'D-III1'])]]))
    expect([ra.phanI.length, ra.phanII.length, ra.phanIII.length]).toEqual([1, 1, 1])
  })
})
