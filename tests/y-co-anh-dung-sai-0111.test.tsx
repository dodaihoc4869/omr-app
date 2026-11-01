// @vitest-environment jsdom
// Ý ĐÚNG/SAI CÓ ẢNH RIÊNG (thầy chụp 01/11: ý c «Sơ đồ mô tả sự hình thành liên kết phân tử N₂ (hình …)» chữ dựng đứng 1 ký tự/dòng, ảnh đè chữ). Gốc lỗi:
// khổ rộng (cột trả lời ≥ 560px) mỗi ý là lưới «chữ | cặp nút», ảnh `sau_y_x` rơi vào cột nút ⇒ cột chữ bị bóp về 0. Khoá:
//   · CSS: cặp nút ghim hàng 1 cột 2, ảnh của ý nằm trọn hàng dưới chữ (đo thật bằng Chromium — ảnh trước/sau trong PR);
//   · lúc làm và sau khi Kiểm tra (PhanHoiDungSai) ảnh của ý đều hiện ngay dưới chữ ý đó (trước: sau Kiểm tra mất ảnh).
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { ChonDungSai, PhanHoiDungSai } from '../src/components/hoc-tap/LamCau'
import type { Question } from '../src/game/than-thu-v2/core'

afterEach(cleanup)
const q = {
  qid: 'q', maDe: 'DH-10-C3-B10', version: 'v1', group: 'g', phan: 'II', text: 'Cho các phát biểu về phân tử N₂.', choices: [],
  ideas: ['Có một liên kết ba.', 'Mỗi N góp 3 electron.', 'Sơ đồ mô tả sự hình thành liên kết phân tử N₂ (hình dưới).', 'Liên kết không phân cực.'],
  hinhAnh: [{ src: 'data:image/png;base64,AA==', viTri: 'sau_y_c' }], kienThuc: [], dang: null,
} as unknown as Question
const anhCuaY = (el: HTMLElement) => [...el.querySelectorAll('.ht2-lam-y')].map((s) => s.querySelectorAll(':scope > .cau-hinh img').length)

describe('ý Đúng/Sai có ảnh riêng', () => {
  it('lúc làm: ảnh nằm ngay dưới chữ ý c (con trực tiếp của thẻ ý, sau phần chữ, trước cặp nút)', () => {
    const { container } = render(<ChonDungSai q={q} value="----" onChon={() => {}} khoa={false} />)
    expect(anhCuaY(container)).toEqual([0, 0, 1, 0])
    const c = container.querySelectorAll('.ht2-lam-y')[2]!
    expect([...c.children].map((x) => x.className)).toEqual(['ht2-lam-y-dau', 'cau-hinh', 'ht2-lam-y-nut'])
  })
  it('sau Kiểm tra: ảnh của ý c vẫn hiện', () => {
    const { container } = render(<PhanHoiDungSai q={q} tra="DDSD" dapAn="DDDD" lyDo={() => undefined} />)
    expect(anhCuaY(container)).toEqual([0, 0, 1, 0])
  })
  it('CSS khổ rộng: cặp nút ghim hàng 1 cột 2, ảnh của ý trải hết hàng', () => {
    const css = readFileSync('src/styles/trong-lam-bai.css', 'utf8')
    const khoi = css.slice(css.indexOf('@container (min-width: 560px)'))
    expect(khoi).toMatch(/\.ht2-lam-y:not\(\[data-ket\]\) \.ht2-lam-y-nut \{[^}]*grid-area: 1 \/ 2/)
    expect(khoi).toMatch(/\.ht2-lam-y:not\(\[data-ket\]\) > \.cau-hinh \{ grid-column: 1 \/ -1/)
  })
})
