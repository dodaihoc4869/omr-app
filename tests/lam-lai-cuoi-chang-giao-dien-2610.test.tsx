// @vitest-environment jsdom
// LÀM LẠI CUỐI CHẶNG kiểu Duolingo (hợp đồng docs/hop-dong-duolingo-2610.md mục 3; logic mẫu commit 406dbd17) — màn làm bài của em:
// chặng có câu TỰ LÀM SAI ⇒ sau câu cuối gọi MỘT lần `hoc-tap-lam-lai` {session} ⇒ vòng «Làm lại · câu i/n» (không đếm vào số câu của chặng, thanh tiến độ giữ
// nguyên) ⇒ nộp qua `answer` cùng phiên ⇒ «Làm lại đúng» ⇒ màn kết chặng ghi «Đã làm lại N câu». Không sai ⇒ không gọi. Rỗng ⇒ vào thẳng kết chặng. Chạm lặp
// khi đang xin không kết chặng giữa chừng, không gọi hai lần. Giao diện cũ (tắt «Trong») cùng luồng.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ManLamBaiTap from '../src/components/hoc-tap/ManLamBaiTap'
import { goiHoa2 } from '../src/components/hoa2/api'
import type { TomTatGoi7 } from '../src/lib/goi-bai-7'
vi.mock('../src/components/hoa2/api', async (goc) => ({ ...(await goc<typeof import('../src/components/hoa2/api')>()), goiHoa2: vi.fn() }))
// «Kiểm tra» của màn Duo đi theo luồng (doc-luong-nop.ts) — ở test đi qua cùng `goiHoa2` giả như trước (không dòng tạm).
vi.mock('../src/components/hoa2/doc-luong-nop', async () => { const api = await import('../src/components/hoa2/api'); return { nopCauLuong: (token: string, du: Record<string, unknown>, giay: number) => api.goiHoa2('answer', token, du, giay) } })
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.mocked(goiHoa2).mockReset(); localStorage.clear(); delete document.documentElement.dataset.trong })

const nen = { maDe: 'DH-12-B1', version: 'v1', hinhAnh: [], dang: 'D0', tenDang: 'Amine', mucDo: 'NB', sao: 0, kienThuc: [], ideas: [] }
const c1 = { ...nen, qid: 'q1', group: 'g1', phan: 'I' as const, text: 'Câu một: chất nào là amine bậc hai?', choices: ['CH3NH2', '(CH3)2NH', '(CH3)3N', 'C6H5NH2'], vaiGoi7: 'on' }
const c2 = { ...nen, qid: 'q2', group: 'g2', phan: 'I' as const, text: 'Câu hai: chất nào là muối?', choices: ['NaCl', 'HCl', 'NaOH', 'H2O'], vaiGoi7: 'on' }
const ll = { ...nen, qid: 'q9', group: 'g9', phan: 'I' as const, text: 'Câu làm lại: amine nào bậc hai?', choices: ['C2H5NH2', '(C2H5)2NH', '(C2H5)3N', 'CH3NH2'], vaiGoi7: 'lam_lai', lamLaiCua: 'q1' }
const goi: TomTatGoi7 = { bat: true, ngay: '2026-10-26', toiThieu: 24, daLamHomNay: 0, tuLamCon: 18, tiepCanCon: 6, thieuPhu: 0, thieuNgay: 0, canHoTro: false, kienThucCu: { tong: 10, dat: 7, tyLe: 70 }, goi: [{ id: 'g1', ten: 'Bài Amine', batDau: '2026-10-26', han: '2026-11-01', tong: 50, daGap: 0, con: 50, quota: 8, gapHomNay: 0, quaHan: false, canBoSung: 0, to: ['DH-12-B1'] }], diemDaDo: [] }

function giaLap(dungQ1: boolean, coLamLai = true) {
  vi.mocked(goiHoa2).mockImplementation(async (hanh: string, _t: string, b: Record<string, unknown> = {}) => {
    if (hanh === 'hoc-tap-start') return { ok: true, id: 'p1', questions: [c1, c2], goi7: goi } as never
    if (hanh === 'hoc-tap-dem') return { ok: true, daLamHomNay: 1, toiThieu: 24 } as never
    if (hanh === 'hoc-tap-lam-lai') return { ok: true, questions: coLamLai ? [ll] : [] } as never
    if (hanh === 'answer') {
      const qid = String(b.qid)
      return { ok: true, correct: qid === 'q1' ? dungQ1 : true, answer: 'B', attempt: { assisted: qid === 'q9' } } as never
    }
    return { ok: true } as never
  })
}
const homNay = { daLam: 0, muc: 24, chang: 1, soChang: 4 }
const moMan = () => render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={homNay} />)
const soLanXin = () => vi.mocked(goiHoa2).mock.calls.filter(c => c[0] === 'hoc-tap-lam-lai').length

describe('giao diện cũ (tắt «Trong»)', () => {
  async function tra(text: string, chon: number) {
    await screen.findByText(text)
    fireEvent.click(screen.getAllByRole('radio')[chon]!)
    fireEvent.click(screen.getByRole('button', { name: /^Nộp câu/ }))
  }
  it('sai câu 1 ⇒ «Làm lại câu sai» ⇒ câu cùng dạng «Làm lại · Câu 1/1» ⇒ «Làm lại đúng» ⇒ kết chặng 1/2 + «Đã làm lại 1 câu»', async () => {
    giaLap(false)
    moMan()
    await tra(c1.text, 0)
    fireEvent.click(await screen.findByRole('button', { name: /Câu tiếp theo/ }))
    await tra(c2.text, 0)
    fireEvent.click(await screen.findByRole('button', { name: /Làm lại câu sai/ }))
    await screen.findByText(ll.text)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Làm lại · Câu 1/1')
    expect(screen.getByText('Làm lại · cùng dạng câu 1')).toBeTruthy()
    expect(vi.mocked(goiHoa2).mock.calls.find(c => c[0] === 'hoc-tap-lam-lai')![2]).toEqual({ session: 'p1' })
    await tra(ll.text, 1)
    await screen.findByText('Làm lại đúng', { selector: 'b' })
    expect(vi.mocked(goiHoa2).mock.calls.filter(c => c[0] === 'answer').map(c => (c[2] as { session: string }).session)).toEqual(['p1', 'p1', 'p1'])
    expect(screen.queryByRole('button', { name: 'Sửa câu này' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Kết thúc chặng/ }))
    await screen.findByText(/Đã làm lại 1 câu/)
    expect(document.querySelector('.ht2-lam-xong-so')!.textContent).toBe('1/2 câu tự làm đúng')
    expect(soLanXin()).toBe(1)
  })
  it('không sai câu nào ⇒ không gọi làm lại, nút cuối «Kết thúc chặng»', async () => {
    giaLap(true)
    moMan()
    await tra(c1.text, 1)
    fireEvent.click(await screen.findByRole('button', { name: /Câu tiếp theo/ }))
    await tra(c2.text, 0)
    fireEvent.click(await screen.findByRole('button', { name: /Kết thúc chặng/ }))
    await waitFor(() => expect(document.querySelector('.ht2-lam-xong-so')?.textContent).toBe('2/2 câu tự làm đúng'))
    expect(screen.queryByText(/Đã làm lại/)).toBeNull()
    expect(soLanXin()).toBe(0)
  })
})

describe('màn Duo («Trong»)', () => {
  async function tra(text: string, chon: number) {
    await screen.findByText(text)
    fireEvent.click(screen.getAllByRole('radio')[chon]!)
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
  }
  it('sai ⇒ hết chặng vào vòng «Làm lại · câu 1/1», thanh tiến độ giữ đầy theo 2 câu của chặng; chạm lặp không gọi hai lần; kết chặng ghi «Đã làm lại 1 câu»', async () => {
    document.documentElement.dataset.trong = 'hs'
    giaLap(false)
    moMan()
    await tra(c1.text, 0)
    fireEvent.click(await screen.findByRole('button', { name: 'Tiếp tục' }))
    await tra(c2.text, 0)
    const tiep = await screen.findByRole('button', { name: 'Tiếp tục' })
    fireEvent.click(tiep); fireEvent.click(tiep) // chạm lặp khi đang xin
    await screen.findByText(ll.text)
    expect(soLanXin()).toBe(1)
    expect(screen.getByText('Làm lại · câu 1/1')).toBeTruthy()
    const thanh = screen.getByRole('progressbar', { name: 'Làm lại · câu 1/1' })
    expect(thanh.getAttribute('aria-valuemax')).toBe('2'); expect(thanh.getAttribute('aria-valuenow')).toBe('2')
    await tra(ll.text, 1)
    await screen.findByRole('heading', { name: 'Làm lại đúng' })
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }))
    await screen.findByText(/Đã làm lại 1 câu\./)
    expect(screen.getByLabelText('Kết quả chặng').textContent).toContain('1/2')
    expect(soLanXin()).toBe(1)
  })
  it('máy chủ không có câu cùng dạng ⇒ vào thẳng kết chặng (không kẹt), không ghi «Đã làm lại»', async () => {
    document.documentElement.dataset.trong = 'hs'
    giaLap(false, false)
    moMan()
    await tra(c1.text, 0)
    fireEvent.click(await screen.findByRole('button', { name: 'Tiếp tục' }))
    await tra(c2.text, 0)
    fireEvent.click(await screen.findByRole('button', { name: 'Tiếp tục' }))
    await waitFor(() => expect(screen.getByLabelText('Kết quả chặng')).toBeTruthy())
    expect(screen.queryByText(/Đã làm lại/)).toBeNull()
  })
})
