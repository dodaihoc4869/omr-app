import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: vi.fn(async () => 'https://may-chu.test') }))
vi.mock('../src/lib/exam-db', () => ({ loadTeacherSecret: vi.fn(async () => 'ma-thu') }))

import { goiLenh } from '../src/lib/goi-lenh-thay'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('Lệnh thầy: thời hạn chờ gồm cả phần dữ liệu', () => {
  it('đã nhận headers nhưng body treo: hết 20 giây trả lỗi chậm và cho phép thử lại', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn(async (_url, init: RequestInit) => {
      const signal = init.signal!
      return {
        status: 200, ok: true,
        json: () => new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(new DOMException('Đã hết hạn', 'AbortError')), { once: true })
        }),
      }
    }))
    const ketQua = goiLenh('/gv/goi-bai-7', { action: 'tong_hop' }, 'Chưa có bảng', 'Chưa nhận được bảng trong thời gian chờ.')
    await vi.advanceTimersByTimeAsync(20_000)
    await expect(ketQua).resolves.toEqual({ ok: false, loai: 'cham', chu: 'Chưa nhận được bảng trong thời gian chờ.' })
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ok: true, goi: [] })))
    await expect(goiLenh('/gv/goi-bai-7', {}, 'Chưa có bảng')).resolves.toEqual({ ok: true, du: { ok: true, goi: [] } })
    expect(vi.getTimerCount()).toBe(0)
  })

  it.each([null, [], 'không phải dữ liệu'])('JSON %j không làm thao tác lưu mắc kẹt hoặc ném lỗi', async du => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(du)))
    await expect(goiLenh('/gv/goi-bai-7', {}, 'Chưa có bảng')).resolves.toMatchObject({ ok: false, loai: 'khong_doc_duoc' })
  })

  it('giữ lời từ chối của máy chủ khi dữ liệu trả về hợp lệ', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ok: false, loi: 'Một lớp đã đổi hạn. Thầy cập nhật rồi thử lại.' }, { status: 409 })))
    await expect(goiLenh('/gv/goi-bai-7', {}, 'Chưa có bảng')).resolves.toEqual({ ok: false, loai: 'tu_choi', chu: 'Một lớp đã đổi hạn. Thầy cập nhật rồi thử lại.' })
  })

  it('giữ mã xung đột đúng dạng cho tấm danh sách; phản hồi cũ không thêm thuộc tính rỗng', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ok: false, error: 'Danh sách vừa thay đổi.', code: 'xung_dot' }, { status: 409 })))
    await expect(goiLenh('/gv/goi-bai-7', {}, 'Chưa có bảng')).resolves.toEqual({ ok: false, loai: 'tu_choi', chu: 'Danh sách vừa thay đổi.', code: 'xung_dot' })
    for (const code of [undefined, 2, 'MÃ SAI', 'x'.repeat(41)]) {
      vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ok: false, error: 'Chưa lưu.', code })))
      await expect(goiLenh('/gv/goi-bai-7', {}, 'Chưa có bảng')).resolves.toEqual({ ok: false, loai: 'tu_choi', chu: 'Chưa lưu.' })
    }
  })
})
