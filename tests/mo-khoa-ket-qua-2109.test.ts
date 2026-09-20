// `moKhoa` (exam-api) trả KẾT QUẢ THẬT của máy chủ — nút "Cho vào bằng máy khác" dựa vào `goKhoaMay` để nói đúng việc đã làm (Code 1, 21/09/2026).
// Máy chủ (`moKhoaEm`, server/src/goi-cu.ts): `goKhoaMay` = có gỡ khoá máy của lượt `duoc_duyet_lai` hay không; máy chủ đời cũ không trả trường này.
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/lib/may-chu-moi', async (o) => ({ ...(await o<Record<string, unknown>>()), layCauHinhMayChu: async () => ({ BAT: true, URL: 'https://may-chu.test', HAN_GIAY: 5 }) }))
const api = await import('../src/lib/exam-api')

const traLoi = (j: unknown, ok = true) => vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => j } as unknown as Response)
const goi = () => api.moKhoa('https://may-chu.test', 'mat', 'C1', '12001')
afterEach(() => vi.restoreAllMocks())

describe('moKhoa trả kết quả thật', () => {
  it('gửi đúng lệnh `moKhoa` (mã ca, sbd, người mở) và trả `goKhoaMay:true` khi máy chủ đã gỡ khoá máy', async () => {
    const f = traLoi({ ok: true, soDong: 1, goKhoaMay: true })
    expect(await goi()).toEqual({ soDong: 1, goKhoaMay: true })
    const body = JSON.parse(String((f.mock.calls[0][1] as RequestInit).body))
    expect(body).toMatchObject({ action: 'moKhoa', secret: 'mat', maCa: 'C1', sbd: '12001', nguoiMo: 'thầy' })
  })
  it('máy chủ báo KHÔNG có khoá máy để gỡ ⇒ `goKhoaMay:false` (không bị ép thành undefined hay true)', async () => {
    traLoi({ ok: true, soDong: 0, goKhoaMay: false })
    expect(await goi()).toEqual({ soDong: 0, goKhoaMay: false })
  })
  it('máy chủ đời cũ không trả `goKhoaMay` ⇒ undefined (không đoán); giá trị không phải boolean cũng bỏ', async () => {
    traLoi({ ok: true })
    expect(await goi()).toEqual({ soDong: undefined, goKhoaMay: undefined })
    traLoi({ ok: true, soDong: '1', goKhoaMay: 'true' })
    expect(await goi()).toEqual({ soDong: undefined, goKhoaMay: undefined })
  })
  it('máy chủ từ chối ⇒ ném lỗi kèm lý do', async () => {
    traLoi({ ok: false, error: 'Sai mã bí mật' })
    await expect(goi()).rejects.toThrow('Sai mã bí mật')
  })
})
