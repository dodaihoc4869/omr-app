// @vitest-environment jsdom
// LƯỢT MỞ TRƯỚC KHÔNG ĐƯỢC MẤT KHI REACT BỎ LƯỢT DỰNG ĐẦU (29/10 khuya, đo máy yếu scripts/do-muot-hs.mjs: Lộ trình đã mở trước chặng, bấm vào chặng vẫn gọi
// `hoc-tap-start` lại từ đầu). Màn làm bài đọc lượt mở trước NGAY lúc dựng (0 ms) — trước đây đọc là XOÁ; React bỏ lượt dựng ấy (một thành phần cùng Suspense đang
// chờ) rồi dựng lại ⇒ lượt dựng thật không còn gì ⇒ gọi máy chủ lại. Nay lượt dựng chỉ XEM, effect (màn đã hiện thật) mới LẤY.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Suspense } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import ManLamBaiTap from '../src/components/hoc-tap/ManLamBaiTap'
import { goiHoa2 } from '../src/components/hoa2/api'
import { batMoChangTruoc, layChangMoTruocNgay, moChangTruoc } from '../src/components/hoc-tap/mo-chang-truoc'
vi.mock('../src/components/hoa2/api', async (goc) => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: vi.fn() }))
beforeEach(() => batMoChangTruoc(true))
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.mocked(goiHoa2).mockReset(); localStorage.clear(); batMoChangTruoc(false) })

const TN = { maDe: 'de-8', version: 'v1', group: 'g', hinhAnh: [], dang: null, tenDang: 'Amine', mucDo: 'hieu', sao: 0, kienThuc: [], qid: 'tn1', phan: 'I' as const,
  text: 'Chất nào sau đây là amine bậc hai?', choices: ['CH3NH2', '(CH3)2NH', '(CH3)3N', 'C6H5NH2'], ideas: [] }
const soLanMo = () => vi.mocked(goiHoa2).mock.calls.filter((c) => c[0] === 'hoc-tap-start').length

it('chỉ xem không xoá; lấy mới xoá', async () => {
  vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, id: 'p1', questions: [TN] })
  moChangTruoc('tk')
  await new Promise((r) => setTimeout(r, 0))
  expect(layChangMoTruocNgay('tk', Date.now(), true)?.id).toBe('p1')
  expect(layChangMoTruocNgay('tk', Date.now(), true)?.id).toBe('p1')
  expect(layChangMoTruocNgay('tk')?.id).toBe('p1')
  expect(layChangMoTruocNgay('tk')).toBeNull()
})

it('React bỏ lượt dựng đầu (thành phần cùng Suspense đang chờ) ⇒ lượt dựng thật vẫn dùng lượt mở trước, KHÔNG gọi hoc-tap-start lần hai', async () => {
  vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, id: 'p1', questions: [TN] })
  moChangTruoc('tk')
  await new Promise((r) => setTimeout(r, 0))
  let xong = false
  const cho = new Promise<void>((r) => setTimeout(() => { xong = true; r() }, 30))
  function Treo() { if (!xong) throw cho; return null }
  render(<Suspense fallback={null}><ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} /><Treo /></Suspense>)
  await screen.findByText(TN.text)
  expect(soLanMo()).toBe(1)
  expect(layChangMoTruocNgay('tk')).toBeNull() // màn đã lấy (xoá) lượt mở trước sau khi hiện thật
})
