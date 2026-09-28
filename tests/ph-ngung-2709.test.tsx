// ĐỔI 28/09 — thầy: "Trùng tu toàn bộ app phụ huynh, … chỉ xem được báo cáo mọi thứ về con" THAY quyết định 27/09 "bỏ hẳn app phụ huynh".
// Trước: app phụ huynh ngừng THEO CÔNG TẮC (máy chủ `/hoa2/ph-ngung`, Game Hoá 2.0 bật cả trung tâm ⇒ màn "đã ngừng").
// Nay: app phụ huynh CHẠY LẠI dù Game Hoá 2.0 bật — cổng không hỏi công tắc nữa, luôn mở màn đăng nhập / app chỉ xem (tests/ph-v3-app-2809.test.tsx).
import { describe, expect, it, vi, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu.test' }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrl: async () => '/test' }))

import ParentPortalScreen from '../src/screens/ParentPortalScreen'

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})

describe('ParentPortalScreen khi Game Hoá 2.0 bật cả trung tâm (thầy 28/09: app phụ huynh chạy lại, chỉ xem)', () => {
  it('máy chủ vẫn báo ngung:true ⇒ cổng KHÔNG hỏi công tắc, vẫn hiện ô đăng nhập (không màn "đã ngừng")', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ ok: true, ngung: true })))
    vi.stubGlobal('fetch', f)
    const { container } = render(<ParentPortalScreen />)
    expect(await screen.findByRole('button', { name: 'Vào xem kết quả của con' })).toBeTruthy()
    await new Promise((r) => setTimeout(r, 30))
    expect(f.mock.calls.some((c) => String(c[0]).endsWith('/hoa2/ph-ngung'))).toBe(false)
    expect(container.textContent).not.toContain('Ứng dụng phụ huynh đã ngừng')
  })
  it('nguồn: không còn hàm/màn ngừng theo công tắc', () => {
    const p = fs.readFileSync(path.join(process.cwd(), 'src/screens/ParentPortalScreen.tsx'), 'utf8').replace(/\/\/.*$/gm, '')
    for (const cam of ['hoiPhDaNgung', 'PhDaNgung', 'CHU_PH_DA_NGUNG', '/hoa2/ph-ngung']) expect(p, cam).not.toContain(cam)
  })
})
