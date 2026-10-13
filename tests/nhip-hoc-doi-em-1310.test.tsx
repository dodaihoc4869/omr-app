// @vitest-environment jsdom
// Máy dùng chung: không hiện nhóm/nhịp của em trước trong khi em mới đang tải hoặc lỗi.
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useNhipHocEm, xoaNhoNhipHocEm } from '../src/components/hoc-tap/TheHomNayEm'
import { layNhipHocEm } from '../src/lib/nhip-hoc-em'
import { NHIP_EM_CHAM, NHIP_EM_LUOI } from '../scripts/chup-v2/gia/nhip-hoc-em'
vi.mock('../src/lib/nhip-hoc-em', async (goc) => ({ ...await goc<typeof import('../src/lib/nhip-hoc-em')>(), layNhipHocEm: vi.fn() }))
afterEach(() => { cleanup(); vi.mocked(layNhipHocEm).mockReset(); xoaNhoNhipHocEm() })
it('đổi em: không giữ nhóm của em cũ khi yêu cầu mới còn chờ rồi lỗi', async () => {
  let traMoi!: (v: null) => void
  vi.mocked(layNhipHocEm).mockResolvedValueOnce(NHIP_EM_CHAM).mockImplementationOnce(() => new Promise(resolve => { traMoi = resolve }))
  const { result, rerender } = renderHook(({ token }) => useNhipHocEm(token, null), { initialProps: { token: 'em-cu' } })
  await waitFor(() => expect(result.current).toEqual(NHIP_EM_CHAM))
  rerender({ token: 'em-moi' })
  expect(result.current).toBe('tai')
  await act(async () => { traMoi(null) })
  expect(result.current).toBe('an')
})
it('lỗi của em cũ không làm ẩn trạng thái đang tải của em mới', async () => {
  vi.mocked(layNhipHocEm).mockResolvedValueOnce(null).mockImplementationOnce(() => new Promise(() => {}))
  const { result, rerender } = renderHook(({ token }) => useNhipHocEm(token, null), { initialProps: { token: 'em-cu' } })
  await waitFor(() => expect(result.current).toBe('an'))
  rerender({ token: 'em-moi' })
  expect(result.current).toBe('tai')
})
it('trả lời trễ của em trước không thay nhóm của em đang đăng nhập', async () => {
  let traCu!: (v: typeof NHIP_EM_CHAM) => void
  vi.mocked(layNhipHocEm).mockImplementationOnce(() => new Promise(resolve => { traCu = resolve })).mockResolvedValueOnce(NHIP_EM_LUOI)
  const { result, rerender } = renderHook(({ token }) => useNhipHocEm(token, null), { initialProps: { token: 'em-cu' } })
  rerender({ token: 'em-moi' })
  await waitFor(() => expect(result.current).toEqual(NHIP_EM_LUOI))
  await act(async () => { traCu(NHIP_EM_CHAM) })
  expect(result.current).toEqual(NHIP_EM_LUOI)
})
