// @vitest-environment jsdom
// 20/10 ĐO GIÂY — màn Làm bài tập (game): máy em gửi `doGiay: {g}` (giây câu đang hiện, chỉ cộng khi tab hiện + em còn chạm) cùng lượt nộp;
// chưa đủ 1 giây thì KHÔNG gửi (không gửi số 0). Số từ/hình/phần do máy chủ tự đo, máy em không gửi.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ManLamBaiTap from '../src/components/hoc-tap/ManLamBaiTap'
import { goiHoa2 } from '../src/components/hoa2/api'

vi.mock('../src/components/hoa2/api', async (goc) => ({ ...(await goc<typeof import('../src/components/hoa2/api')>()), goiHoa2: vi.fn() }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.mocked(goiHoa2).mockReset(); localStorage.clear() })

const nen = { maDe: 'de-8', version: 'v1', group: 'g', hinhAnh: [], dang: null, tenDang: 'Amine', mucDo: 'hieu', sao: 0, kienThuc: [] }
const TN = { ...nen, qid: 'tn1', phan: 'I' as const, text: 'Chất nào sau đây là amine bậc hai?', choices: ['CH3NH2', '(CH3)2NH', '(CH3)3N', 'C6H5NH2'], ideas: [] }

async function lamVaNop(doiMs: number) {
  vi.mocked(goiHoa2).mockImplementation(async (hanh: string) => (hanh === 'answer' ? { ok: true, correct: true, answer: 'B' } : { ok: true, id: 'p1', questions: [TN] }) as never)
  render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={{ daLam: 0, muc: 12, chang: 1, soChang: 3 }} />)
  await screen.findByText(TN.text)
  fireEvent.pointerDown(window)
  if (doiMs) await new Promise((r) => setTimeout(r, doiMs))
  fireEvent.pointerDown(window)
  fireEvent.click(screen.getAllByRole('radio')[1]!)
  fireEvent.click(screen.getByRole('button', { name: /^Nộp|^Kiểm tra|Nộp/ }))
  await waitFor(() => expect(vi.mocked(goiHoa2).mock.calls.some((c) => c[0] === 'answer')).toBe(true))
  return vi.mocked(goiHoa2).mock.calls.find((c) => c[0] === 'answer')![2] as Record<string, unknown>
}

describe('Làm bài tập: đồng hồ đo giây', () => {
  it('đợi ~2 giây có chạm ⇒ doGiay.g từ 1 tới 3; khuôn treo máy 22/10: v ≥ g, a = 0, l nhỏ, n = 0, w = 0 (jsdom không giữ màn sáng)', async () => {
    const body = await lamVaNop(2300)
    const dg = body.doGiay as { g: number; v: number; a: number; l: number; n: number; w: number }
    expect(dg.g).toBeGreaterThanOrEqual(1)
    expect(dg.g).toBeLessThanOrEqual(3)
    // 01/11 (đánh giá 99% đợt 2): cùng cụm thêm dd · dq · rn · ar · tb (src/lib/doi-dap-an.ts) — chọn một lần, không rời app.
    expect(Object.keys(dg)).toEqual(['g', 'v', 'a', 'l', 'n', 'w', 'dd', 'dq', 'rn', 'ar', 'tb'])
    expect(dg).toMatchObject({ dd: 0, dq: 1, rn: 0, ar: 0 })
    expect((dg as unknown as { tb: string }).tb).toMatch(/^[A-Za-z0-9]{1,16}$/)
    expect(dg.v).toBeGreaterThanOrEqual(dg.g)
    expect([dg.a, dg.n, dg.w]).toEqual([0, 0, 0])
    expect(dg.l).toBeLessThanOrEqual(3)
    expect(typeof body.msLam).toBe('number') // `msLam` cũ vẫn gửi cho OMNI
  }, 15000)
  it('nộp ngay (chưa đủ 1 giây) ⇒ KHÔNG gửi doGiay (không bịa số 0)', async () => {
    const body = await lamVaNop(0)
    expect(body.doGiay).toBeUndefined()
  })
})

// 22/10 ĐO TREO MÁY (docs/dac-ta-muc-lam-6-muc-2210.md mục 3, 7): đồng hồ giả, chạy nhanh qua hàng phút.
describe('Làm bài tập: đo treo máy', () => {
  async function kichBan(lam: (tien: (giay: number) => Promise<void>) => Promise<void>) {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      vi.mocked(goiHoa2).mockImplementation(async (hanh: string) => (hanh === 'answer' ? { ok: true, correct: false, answer: 'B' } : { ok: true, id: 'p1', questions: [TN] }) as never)
      render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={{ daLam: 0, muc: 12, chang: 1, soChang: 3 }} />)
      await screen.findByText(TN.text)
      fireEvent.pointerDown(window)
      await lam(async (giay) => { await vi.advanceTimersByTimeAsync(giay * 1000) })
      fireEvent.pointerDown(window)
      fireEvent.click(screen.getAllByRole('radio')[1]!)
      fireEvent.click(screen.getByRole('button', { name: /^Nộp|^Kiểm tra|Nộp/ }))
      await waitFor(() => expect(vi.mocked(goiHoa2).mock.calls.some((c) => c[0] === 'answer')).toBe(true))
      return (vi.mocked(goiHoa2).mock.calls.find((c) => c[0] === 'answer')![2] as { doGiay: { g: number; v: number; a: number; l: number; n: number } }).doGiay
    } finally {
      vi.useRealTimers()
    }
  }
  const datHien = (hien: boolean) => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (hien ? 'visible' : 'hidden') }); document.dispatchEvent(new Event('visibilitychange')) }
  afterEach(() => datHien(true))

  it('10 phút không chạm ⇒ l ≥ 600, v ≈ 600; giây làm g vẫn cắt ở 180 (như cũ)', async () => {
    const d = await kichBan((tien) => tien(605))
    expect(d.l).toBeGreaterThanOrEqual(600)
    expect(d.v).toBeGreaterThanOrEqual(600)
    expect(d.g).toBeLessThanOrEqual(182)
    expect(d.n).toBe(0)
  }, 20000)

  it('rời app 3 phút (tab ẩn) ⇒ a ≈ 180 tính theo mốc lúc ẩn → hiện (không phụ thuộc nhịp bị hãm), không cộng vào v / g', async () => {
    const d = await kichBan(async (tien) => { await tien(5); datHien(false); await tien(180); datHien(true); await tien(2) })
    expect(d.a).toBeGreaterThanOrEqual(178)
    expect(d.a).toBeLessThanOrEqual(182)
    expect(d.v).toBeLessThanOrEqual(10)
    expect(d.g).toBeLessThanOrEqual(10)
  }, 20000)

  it('ba lần lặng 150 giây rồi chạm (giữ cho đồng hồ chạy) ⇒ n = 3', async () => {
    const d = await kichBan(async (tien) => { for (let i = 0; i < 3; i++) { await tien(150); fireEvent.pointerDown(window) } })
    expect(d.n).toBe(3)
    expect(d.l).toBeGreaterThanOrEqual(149)
    expect(d.l).toBeLessThan(180)
  }, 20000)
})

describe('Làm bài tập: giữ màn sáng khi đang làm câu (22/10)', () => {
  it('xin khi mở; 10 phút không chạm ⇒ nhả; chạm lại ⇒ xin lại; nộp gửi w = 1', async () => {
    const xin = vi.fn(), nha = vi.fn(async () => {})
    xin.mockImplementation(async () => ({ release: nha }))
    Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: xin } })
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      vi.mocked(goiHoa2).mockImplementation(async (hanh: string) => (hanh === 'answer' ? { ok: true, correct: true, answer: 'B' } : { ok: true, id: 'p1', questions: [TN] }) as never)
      render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={{ daLam: 0, muc: 12, chang: 1, soChang: 3 }} />)
      await screen.findByText(TN.text)
      await waitFor(() => expect(xin).toHaveBeenCalledTimes(1))
      expect(xin).toHaveBeenCalledWith('screen')
      fireEvent.pointerDown(window)
      expect(xin).toHaveBeenCalledTimes(1) // đang giữ ⇒ không xin chồng
      await vi.advanceTimersByTimeAsync(602_000)
      expect(nha).toHaveBeenCalledTimes(1)
      fireEvent.pointerDown(window)
      await waitFor(() => expect(xin).toHaveBeenCalledTimes(2))
      fireEvent.click(screen.getAllByRole('radio')[1]!)
      fireEvent.click(screen.getByRole('button', { name: /^Nộp|^Kiểm tra|Nộp/ }))
      await waitFor(() => expect(vi.mocked(goiHoa2).mock.calls.some((c) => c[0] === 'answer')).toBe(true))
      const dg = (vi.mocked(goiHoa2).mock.calls.find((c) => c[0] === 'answer')![2] as { doGiay: { w: number } }).doGiay
      expect(dg.w).toBe(1)
    } finally {
      vi.useRealTimers()
      delete (navigator as unknown as Record<string, unknown>).wakeLock
    }
  }, 20000)
})

// 01/11 ĐỢT 2 ĐÁNH GIÁ 99%: đổi / dò đáp án + rời app NGAY trước lựa chọn cuối, đo trên màn thật, gửi cùng cụm `doGiay` (không thêm lệnh).
describe('Làm bài tập: đổi đáp án, dò đáp án, rời app ngay trước khi chọn (01/11)', () => {
  const datHien = (hien: boolean) => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (hien ? 'visible' : 'hidden') }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => !hien }); document.dispatchEvent(new Event('visibilitychange')) }
  afterEach(() => datHien(true))
  it('A → (rời app 10 giây) → C → B rồi Kiểm tra ⇒ dd 2, dq 3, rn 1, ar ≈ 10; mã máy giữ nguyên giữa hai lần mở', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      vi.mocked(goiHoa2).mockImplementation(async (hanh: string) => (hanh === 'answer' ? { ok: true, correct: true, answer: 'B' } : { ok: true, id: 'p1', questions: [TN] }) as never)
      render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={{ daLam: 0, muc: 12, chang: 1, soChang: 3 }} />)
      await screen.findByText(TN.text)
      fireEvent.pointerDown(window)
      const pa = () => screen.getAllByRole('radio')
      fireEvent.click(pa()[0]!)
      await vi.advanceTimersByTimeAsync(5_000)
      datHien(false); await vi.advanceTimersByTimeAsync(10_000); datHien(true)
      await vi.advanceTimersByTimeAsync(1_000)
      fireEvent.click(pa()[2]!)
      fireEvent.click(pa()[1]!)
      fireEvent.click(screen.getByRole('button', { name: /^Nộp|^Kiểm tra|Nộp/ }))
      await waitFor(() => expect(vi.mocked(goiHoa2).mock.calls.some((c) => c[0] === 'answer')).toBe(true))
      const dg = (vi.mocked(goiHoa2).mock.calls.find((c) => c[0] === 'answer')![2] as { doGiay: Record<string, number | string> }).doGiay
      expect(dg).toMatchObject({ dd: 2, dq: 3, rn: 1 })
      expect(dg.ar).toBeGreaterThanOrEqual(9)
      expect(dg.ar).toBeLessThanOrEqual(11)
      expect(dg.a).toBeGreaterThanOrEqual(9) // tổng giây ẩn (đo cũ) vẫn gửi như trước
      expect(dg.tb).toBe(localStorage.getItem('ddh_id_thiet_bi')!.replace(/[^A-Za-z0-9]/g, '').slice(0, 16))
    } finally {
      vi.useRealTimers()
    }
  }, 20000)
})
