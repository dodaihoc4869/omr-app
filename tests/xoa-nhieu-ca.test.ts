import { describe, it, expect, vi, afterEach } from 'vitest'
import { xoaNhieuCa } from '../src/lib/exam-api'

// ĐỊA CHỈ MÁY CHỦ MỚI. Trước 12/09 chỗ này là link Apps Script; từ khi thầy
// chốt "gỡ sạch google", `postJson` TỪ CHỐI mọi địa chỉ Google — nên một link
// `script.google.com` ở đây sẽ không gọi được lượt nào, và đó là hành vi đúng
// (xem phép kiểm cuối tệp).
const URL_GIA = 'https://omr.example'

function gaFetch(ketQua: Record<string, { ok: boolean; error?: string }>) {
  const goi: { maCa: string; xacNhan: string }[] = []
  const f = vi.fn(async (_url: string, init?: { body?: string }) => {
    const body = JSON.parse(String(init?.body ?? '{}'))
    goi.push({ maCa: body.maCa, xacNhan: body.xacNhan })
    const r = ketQua[body.maCa] ?? { ok: true }
    return { ok: true, json: async () => r, text: async () => JSON.stringify(r) } as unknown as Response
  })
  vi.stubGlobal('fetch', f)
  return goi
}

afterEach(() => vi.unstubAllGlobals())

describe('xoaNhieuCa — xoá lô nhiều ca', () => {
  it('mỗi ca gửi đúng mã của nó làm xacNhan, gọi đủ số ca', async () => {
    const goi = gaFetch({})
    const kq = await xoaNhieuCa(URL_GIA, 'mat', ['111111', '222222', '333333'])
    expect(kq.ok).toEqual(['111111', '222222', '333333'])
    expect(kq.loi).toEqual([])
    expect(goi).toEqual([
      { maCa: '111111', xacNhan: '111111' },
      { maCa: '222222', xacNhan: '222222' },
      { maCa: '333333', xacNhan: '333333' },
    ])
  })

  it('một ca lỗi không chặn các ca còn lại', async () => {
    gaFetch({ '222222': { ok: false, error: 'Không tìm thấy ca' } })
    const kq = await xoaNhieuCa(URL_GIA, 'mat', ['111111', '222222', '333333'])
    expect(kq.ok).toEqual(['111111', '333333'])
    expect(kq.loi).toEqual([{ maCa: '222222', loi: 'Không tìm thấy ca' }])
  })

  it('danh sách rỗng thì không gọi máy chủ', async () => {
    const goi = gaFetch({})
    const kq = await xoaNhieuCa(URL_GIA, 'mat', [])
    expect(kq).toEqual({ ok: [], loi: [] })
    expect(goi).toEqual([])
  })
})

describe('ĐỊA CHỈ GOOGLE BỊ TỪ CHỐI', () => {
  it('link Apps Script không gọi được lượt nào — app không còn đường về Google', async () => {
    const goi = gaFetch({})
    const kq = await xoaNhieuCa('https://script.google.com/macros/s/GIA/exec', 'mat', ['111111'])
    expect(goi).toEqual([])
    expect(kq.ok).toEqual([])
    expect(kq.loi[0]?.loi).toContain('máy chủ')
  })
})
