// @vitest-environment jsdom
// GIỮ CHÂN — SANG CÂU KẾ KHÔNG BẬT TẤM «Đừng đi mà» (thầy 30/10, ảnh «Bấm vào tiếp tục lại hiện thoát»).
// Màn sửa câu dựng lại cả khung mỗi câu (ChuaGon key = đợt) ⇒ móc useGiuChan của câu cũ nhả, câu mới bật trong cùng một lượt vẽ.
// Khoá: (1) sang câu kế ⇒ tấm KHÔNG mở, lịch sử không phình; (2) back thật vẫn mở tấm; (3) rời màn ⇒ mục canh được gỡ.
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'
import { useGiuChan } from '../src/components/hoc-tap/GiuChan'

const ngu = (ms = 30) => act(() => new Promise<void>((r) => setTimeout(r, ms)))
const laMucCanh = () => !!(history.state as { giuChan?: number } | null)?.giuChan

let moCuoi = false
function Cau({ bat = true }: { bat?: boolean }) {
  const g = useGiuChan({ bat, onThoat: () => {} })
  moCuoi = g.mo
  return null
}

afterEach(async () => { cleanup(); await ngu() })

describe('useGiuChan — mục canh dùng chung khi màn dựng lại mỗi câu', () => {
  it('sang câu kế (dựng lại khung) ⇒ tấm không mở, chỉ một mục canh', async () => {
    const dai0 = history.length
    const r = render(<Cau key="dot-1" />)
    await ngu()
    expect(laMucCanh()).toBe(true)
    const dai1 = history.length
    expect(dai1).toBe(dai0 + 1)
    for (const k of ['dot-2', 'dot-3', 'dot-4']) {
      r.rerender(<Cau key={k} />)
      await ngu()
      expect(moCuoi).toBe(false)
      expect(laMucCanh()).toBe(true)
    }
    expect(history.length).toBe(dai1)
  })

  it('back thật ⇒ mở tấm, back lần nữa ⇒ đóng tấm (vẫn ở lại màn)', async () => {
    render(<Cau key="dot-1" />)
    await ngu()
    await act(async () => { history.back() })
    await ngu()
    expect(moCuoi).toBe(true)
    expect(laMucCanh()).toBe(true)
    await act(async () => { history.back() })
    await ngu()
    expect(moCuoi).toBe(false)
  })

  it('rời màn ⇒ mục canh được gỡ (back lần sau không vướng)', async () => {
    const r = render(<Cau key="dot-1" />)
    await ngu()
    expect(laMucCanh()).toBe(true)
    r.unmount()
    await ngu()
    expect(laMucCanh()).toBe(false)
  })

  it('hết điều để giữ (bat=false) rồi bật lại ⇒ không tự mở tấm', async () => {
    const r = render(<Cau key="dot-1" />)
    await ngu()
    r.rerender(<Cau key="dot-1" bat={false} />)
    r.rerender(<Cau key="dot-1" />)
    await ngu()
    expect(moCuoi).toBe(false)
    expect(laMucCanh()).toBe(true)
  })
})
