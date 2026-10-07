// 07/10: thầy đổi MA_BI_MAT ở Cloudflare; app chỉ báo "Sai mã bí mật" trơ trọi (Bi-a, OMNI, chiến dịch…) nên không biết phải làm gì.
// Nay: máy chủ trả 403 + câu nhắc mã bí mật ⇒ giữ NGUYÊN lời máy chủ ở đầu câu, thêm đuôi chỉ chỗ nhập lại. Lỗi khác giữ nguyên chữ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu.test' }))
vi.mock('../src/lib/exam-db', () => ({ loadTeacherSecret: async () => 'bi-mat' }))

const { goiLenh, CHU_HUONG_DAN_MA } = await import('../src/lib/goi-lenh-thay')

const dap = (status: number, json: unknown) => vi.fn(async () => ({ ok: status >= 200 && status < 300, status, json: async () => json }))
beforeEach(() => vi.unstubAllGlobals())
afterEach(() => vi.unstubAllGlobals())

describe('goiLenh — máy chủ từ chối mã bí mật', () => {
  it('403 + "Sai mã bí mật" ⇒ tu_choi, lời máy chủ đứng đầu, đuôi chỉ Cài đặt → Kết nối máy chủ', async () => {
    vi.stubGlobal('fetch', dap(403, { ok: false, error: 'Sai mã bí mật' }))
    const r = await goiLenh('/gv/chien-dich', { action: 'co-doc' }, 'chưa có lệnh')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.loai).toBe('tu_choi')
    expect(r.chu.startsWith('Sai mã bí mật — ')).toBe(true)
    expect(r.chu).toContain('Cài đặt → Kết nối máy chủ')
    expect(r.chu).toContain(CHU_HUONG_DAN_MA)
  })

  it('gửi mã trong tiêu đề x-ma-bi-mat (không đổi cách gửi)', async () => {
    const f = dap(403, { ok: false, error: 'Sai mã bí mật' })
    vi.stubGlobal('fetch', f)
    await goiLenh('/gv/chien-dich', { action: 'co-doc' }, 'x')
    const init = (f.mock.calls[0] as unknown as [string, { headers: Record<string, string> }])[1]
    expect(init.headers['x-ma-bi-mat']).toBe('bi-mat')
  })

  it('403 nhưng KHÔNG nói về mã bí mật ⇒ giữ nguyên lời máy chủ, không gán nhầm', async () => {
    vi.stubGlobal('fetch', dap(403, { ok: false, error: 'Lệnh này đang tắt.' }))
    const r = await goiLenh('/gv/x', {}, 'x')
    expect(r).toEqual({ ok: false, loai: 'tu_choi', chu: 'Lệnh này đang tắt.' })
  })

  it('lỗi khác (500 không rõ) giữ nguyên câu cũ', async () => {
    vi.stubGlobal('fetch', dap(500, { ok: false }))
    const r = await goiLenh('/gv/x', {}, 'x')
    expect(r).toEqual({ ok: false, loai: 'tu_choi', chu: 'Máy chủ không đồng ý lệnh này.' })
  })

  it('404 ⇒ chưa có lệnh (câu do nơi gọi đặt); 200 ok ⇒ trả số thật', async () => {
    vi.stubGlobal('fetch', dap(404, {}))
    expect(await goiLenh('/gv/x', {}, 'CHƯA CÓ LỆNH')).toEqual({ ok: false, loai: 'chua_co_lenh', chu: 'CHƯA CÓ LỆNH' })
    vi.stubGlobal('fetch', dap(200, { ok: true, so: 3 }))
    expect(await goiLenh('/gv/x', {}, 'x')).toEqual({ ok: true, du: { ok: true, so: 3 } })
  })
})
