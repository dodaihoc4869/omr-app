// @vitest-environment jsdom
// LÀM LẠI SỚM (thầy 29/10 «tức thì mọi thứ»; src/components/hoc-tap/ManLamBaiTap.tsx `lamLaiSom`): câu CUỐI của chặng vừa có bản đầy đủ mà chặng có câu TỰ LÀM SAI ⇒ lệnh `hoc-tap-lam-lai`
// được xin NGAY (em đang đọc lời giải), «Làm lại câu sai» có câu tức thì — trước: ~1,2 s trắng sau khi bấm. Đúng hết ⇒ không xin. Mỗi chặng một lần; lệnh xin sớm lỗi ⇒ xin lại một lần.
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


async function tra(text: string, chon: number) {
  await screen.findByText(text)
  fireEvent.click(screen.getAllByRole('radio')[chon]!)
  fireEvent.click(screen.getByRole('button', { name: /^Nộp câu/ }))
}

describe('làm lại xin sớm', () => {
  it('sai câu 1, nộp câu cuối ⇒ lệnh làm lại đã đi TRƯỚC khi bấm «Làm lại câu sai»; bấm xong có câu ngay, tổng đúng MỘT lệnh', async () => {
    giaLap(false)
    moMan()
    await tra(c1.text, 0)
    fireEvent.click(await screen.findByRole('button', { name: /Câu tiếp theo/ }))
    await tra(c2.text, 0)
    const nut = await screen.findByRole('button', { name: /Làm lại câu sai/ })
    expect(soLanXin()).toBe(1)
    fireEvent.click(nut)
    await screen.findByText(ll.text)
    expect(soLanXin()).toBe(1)
  })
  it('làm đúng hết ⇒ KHÔNG xin vòng làm lại', async () => {
    giaLap(true)
    moMan()
    await tra(c1.text, 0)
    fireEvent.click(await screen.findByRole('button', { name: /Câu tiếp theo/ }))
    await tra(c2.text, 0)
    await screen.findByRole('button', { name: /Kết thúc chặng/ })
    expect(soLanXin()).toBe(0)
  })
  it('lệnh xin sớm lỗi mạng ⇒ bấm «Làm lại câu sai» xin lại MỘT lần và vẫn có câu', async () => {
    giaLap(false)
    const goc = vi.mocked(goiHoa2).getMockImplementation()!
    let lan = 0
    vi.mocked(goiHoa2).mockImplementation(async (hanh: string, ...a: never[]) => { if (hanh === 'hoc-tap-lam-lai' && ++lan === 1) throw new Error('mất mạng'); return goc(hanh, ...(a as [string, Record<string, unknown>])) as never })
    moMan()
    await tra(c1.text, 0)
    fireEvent.click(await screen.findByRole('button', { name: /Câu tiếp theo/ }))
    await tra(c2.text, 0)
    fireEvent.click(await screen.findByRole('button', { name: /Làm lại câu sai/ }))
    await screen.findByText(ll.text)
    expect(soLanXin()).toBe(2)
  })
})
