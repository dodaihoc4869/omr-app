// @vitest-environment jsdom
// «CÓ CÂU KO CÓ GIÁM THỊ» (ảnh thầy 29/10, câu Đúng–Sai Amine): hai câu LIỀN NHAU khác MỨC ⇒ giám thị cũ chờ huỷ (hẹn 0 ms), giám thị mới dựng vào CHÍNH khung ấy,
// hẹn chạy sau ⇒ `huy()` cũ xoá sạch khung kéo theo giám thị mới ⇒ khung trống cả câu. Khoá: đổi mức / giữ mức / đổi qua lại, sau khi hết hẹn khung VẪN có giám thị đúng mức.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'
import GiamThiCau from '../src/components/giam-thi/GiamThi'
import { GT_DANG_SONG } from '../src/components/giam-thi/giam-thi-nguoi'
import type { MucGT } from '../src/components/giam-thi/giam-thi-ve'

beforeEach(() => { vi.useFakeTimers(); document.documentElement.dataset.trong = 'hs' })
afterEach(() => { cleanup(); vi.useRealTimers(); delete document.documentElement.dataset.trong })

const gt = (muc: MucGT, qid: string) => <div className="duo-gt-san"><div className="duo-gt-loi-o" /><GiamThiCau muc={muc} qid={qid} phien="p" nop={false} ket={null} vung={() => document.body} /></div>
const svg = (c: HTMLElement) => c.querySelector('.gt-o svg.gtn')
const xong = () => act(() => { vi.advanceTimersByTime(50) })

describe('giám thị qua các câu', () => {
  it('đổi MỨC giữa hai câu ⇒ sau hẹn huỷ khung vẫn có giám thị mới (trước: khung trống)', () => {
    const { container, rerender } = render(gt('th', 'q1'))
    xong()
    expect(svg(container)?.getAttribute('data-muc')).toBe('th')
    rerender(gt('vd', 'q2'))
    xong()
    expect(svg(container), 'khung trống sau khi đổi mức').toBeTruthy()
    expect(svg(container)?.getAttribute('data-muc')).toBe('vd')
    expect(container.querySelectorAll('.gt-o svg.gtn')).toHaveLength(1)
  })
  it('giữ nguyên mức ⇒ dùng lại đúng giám thị; đổi qua lại nhiều lần ⇒ luôn đúng MỘT giám thị đúng mức, không rò rỉ', () => {
    const { container, rerender } = render(gt('nb', 'q1'))
    xong()
    const dau = svg(container)
    rerender(gt('nb', 'q2')); xong()
    expect(svg(container)).toBe(dau)
    for (const [m, q] of [['vdc', 'q3'], ['th', 'q4'], ['th', 'q5'], ['nb', 'q6'], ['vd', 'q7']] as const) {
      rerender(gt(m, q)); xong()
      expect(container.querySelectorAll('.gt-o svg.gtn'), `${m} ${q}`).toHaveLength(1)
      expect(svg(container)?.getAttribute('data-muc')).toBe(m)
    }
    expect(GT_DANG_SONG.size).toBe(1)
  })
})
