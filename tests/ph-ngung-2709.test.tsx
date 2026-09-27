// Game Hóa 2.0: app phụ huynh ngừng THEO CÔNG TẮC (máy chủ `/hoa2/ph-ngung`); chưa bật hoặc lỗi mạng ⇒ app cũ.
import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu.test' }))

import ParentPortalScreen, { CHU_PH_DA_NGUNG, hoiPhDaNgung } from '../src/screens/ParentPortalScreen'

afterEach(() => { vi.unstubAllGlobals() })

describe('ParentPortalScreen theo công tắc Game Hóa 2.0', () => {
  it('máy chủ báo ngung:true ⇒ màn đã ngừng', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true, ngung: true }))))
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.textContent).toContain(CHU_PH_DA_NGUNG))
  })
  it('máy chủ báo ngung:false ⇒ app phụ huynh cũ', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ ok: true, ngung: false })))
    vi.stubGlobal('fetch', f)
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(f.mock.calls.some((c) => String(c[0]).endsWith('/hoa2/ph-ngung'))).toBe(true))
    await new Promise((r) => setTimeout(r, 30))
    expect(container.textContent).not.toContain(CHU_PH_DA_NGUNG)
  })
  it('lỗi mạng ⇒ giữ app cũ', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('mất mạng') }))
    expect(await hoiPhDaNgung()).toBe(false)
  })
})
