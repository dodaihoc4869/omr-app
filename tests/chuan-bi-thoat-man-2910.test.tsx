// @vitest-environment jsdom
// RỜI APP GIỮA CHẶNG ⇒ BÁO MÁY CHỦ LẬP LẠI BẢN SẴN (src/components/hoc-tap/mo-chang-truoc.ts): chưa trả lời câu nào ⇒ không báo; đã trả lời mà chưa kết chặng + app bị ẩn ⇒ báo MỘT lần
// (`hoc-tap-chuan-bi`); ẩn lần nữa trong 60 s ⇒ không báo thêm; app hiện lại ⇒ không báo.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ManLamBaiTap from '../src/components/hoc-tap/ManLamBaiTap'
import { goiHoa2 } from '../src/components/hoa2/api'
import { datLaiBaoRoiApp } from '../src/components/hoc-tap/mo-chang-truoc'

vi.mock('../src/components/hoa2/api', async (goc) => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: vi.fn() }))
vi.mock('../src/components/hoa2/doc-luong-nop', () => ({ nopCauLuong: (token: string, du: Record<string, unknown>, giay: number, tam: (o: Record<string, unknown>) => void) => goiHoa2('answer', token, du, giay, tam as never) }))
beforeEach(() => { document.documentElement.dataset.trong = 'hs'; datLaiBaoRoiApp() })
afterEach(() => { cleanup(); vi.mocked(goiHoa2).mockReset(); vi.unstubAllGlobals(); localStorage.clear(); delete document.documentElement.dataset.trong })

const nen = { maDe: 'de-8', version: 'v1', group: 'g', hinhAnh: [], dang: null, tenDang: 'Amine', mucDo: 'hieu', sao: 0, kienThuc: [], ideas: [] }
const cau = (n: number) => ({ ...nen, qid: `q${n}`, phan: 'I' as const, text: `Câu ${n} về amine`, choices: ['2', '8', '3', '4'] })
const an = (ten: 'hidden' | 'visible') => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => ten }); fireEvent(document, new Event('visibilitychange')) }
const soLanBao = () => vi.mocked(goiHoa2).mock.calls.filter((c) => c[0] === 'hoc-tap-chuan-bi').length

async function moChang() {
  vi.mocked(goiHoa2).mockImplementation((lenh) => lenh === 'answer'
    ? Promise.resolve({ ok: true, correct: true, answer: 'D', solution: {}, attempt: { assisted: false } })
    : lenh === 'hoc-tap-chuan-bi' ? Promise.resolve({ ok: true }) : Promise.resolve({ ok: true, id: 'p1', questions: [cau(1), cau(2), cau(3)] }))
  render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={null} />)
  await screen.findByText('Câu 1 về amine')
}

it('chưa trả lời câu nào mà app bị ẩn ⇒ KHÔNG báo', async () => {
  await moChang()
  act(() => an('hidden'))
  expect(soLanBao()).toBe(0)
})

it('đã trả lời ≥ 1 câu, chưa kết chặng, app bị ẩn ⇒ báo MỘT lần; ẩn lại trong 60 s ⇒ không báo thêm; app hiện lại ⇒ không báo', async () => {
  await moChang()
  fireEvent.click(screen.getByRole('radio', { name: /^D/ })); fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
  await waitFor(() => expect(document.querySelector('.duo-ket')).not.toBeNull())
  act(() => an('visible')); expect(soLanBao()).toBe(0)
  act(() => an('hidden')); expect(soLanBao()).toBe(1)
  expect(vi.mocked(goiHoa2).mock.calls.find((c) => c[0] === 'hoc-tap-chuan-bi')?.[1]).toBe('tk')
  act(() => an('visible')); act(() => an('hidden'))
  expect(soLanBao()).toBe(1)
})
