// GÓI CA LỚN TÁCH ĐÔI (thầy 01/10: "không mở được ca thi, máy chủ không phản hồi, gói 9946 KB").
// Đề + đáp án có ảnh nhúng ≈ 10 MB nén, một lượt, gửi song song hai đường ⇒ đứt. Nay > NGUONG_TACH_GOI_CA: tờ đáp án đi TRƯỚC (`chiMoc`, không
// kèm đề), rồi ca + đề (không kèm đáp án) — ca không bao giờ mở mà thiếu đáp án. Gói nhỏ vẫn MỘT lượt như cũ.
import { afterEach, expect, it, vi } from 'vitest'
import { gunzipSync } from 'node:zlib'
import { NGUONG_TACH_GOI_CA, taoCaDaXacNhan } from '../src/lib/day-ca-may-chu-moi'

const ch = { BAT: true, URL: 'https://test' } as any
const ca = { maCa: '123456', tenCa: 'Ca thử', batDau: '2026-10-01T10:00:00Z' } as any
const res = (data: any, status = 200) => new Response(JSON.stringify(data), { status })
afterEach(() => vi.unstubAllGlobals())
const docThan = async (b: unknown) => {
  if (typeof b === 'string') return JSON.parse(b)
  const u8 = b instanceof Uint8Array ? b : new Uint8Array(await new Response(b as BodyInit).arrayBuffer())
  return JSON.parse(gunzipSync(u8).toString('utf8'))
}

it('gói lớn: hai lượt /ca/day — đáp án trước (chiMoc, không đề), rồi ca + đề (không đáp án)', async () => {
  const anh = 'x'.repeat(Math.ceil(NGUONG_TACH_GOI_CA / 2) + 1000)
  const bank = { cau: [{ hinh: anh }] }, keyBank = { cau: [{ dapAn: 'A', hinh: anh }] }
  const f = vi.fn().mockImplementation(async () => res({ ok: true }))
  vi.stubGlobal('fetch', f)
  expect(await taoCaDaXacNhan(ch, 'bi-mat', ca, bank, keyBank)).toBe(true)
  expect(f).toHaveBeenCalledTimes(2)
  expect(f.mock.calls.map((c) => c[0])).toEqual(['https://test/ca/day', 'https://test/ca/day'])
  const g1 = await docThan(f.mock.calls[0][1].body), g2 = await docThan(f.mock.calls[1][1].body)
  expect(g1).toMatchObject({ ca: { maCa: '123456' }, chiMoc: true, secret: 'bi-mat' })
  expect(g1.keyBank).toEqual(keyBank)
  expect(g1.bank).toBeUndefined()
  expect(g2).toMatchObject({ ca, secret: 'bi-mat' })
  expect(g2.bank).toEqual(bank)
  expect(g2.keyBank).toBeUndefined()
  expect(g2.chiMoc).toBeUndefined()
})

it('gói lớn: lượt đáp án hỏng hẳn ⇒ KHÔNG gửi ca + đề (ca không mở thiếu đáp án)', async () => {
  const anh = 'x'.repeat(NGUONG_TACH_GOI_CA)
  const f = vi.fn().mockRejectedValue(new TypeError('network'))
  vi.stubGlobal('fetch', f)
  await expect(taoCaDaXacNhan(ch, 'bi-mat', ca, { a: 1 }, { hinh: anh })).rejects.toThrow('Chưa xác nhận lưu ca #123456')
  for (const c of f.mock.calls.filter((c) => String(c[0]).endsWith('/ca/day'))) expect((await docThan(c[1].body)).chiMoc).toBe(true)
})

it('gói nhỏ: vẫn MỘT lượt kèm cả đề lẫn đáp án', async () => {
  const f = vi.fn().mockImplementation(async () => res({ ok: true }))
  vi.stubGlobal('fetch', f)
  expect(await taoCaDaXacNhan(ch, 'bi-mat', ca, { a: 1 }, { b: 2 })).toBe(true)
  expect(f).toHaveBeenCalledTimes(1)
  expect(JSON.parse(f.mock.calls[0][1].body)).toMatchObject({ ca, bank: { a: 1 }, keyBank: { b: 2 } })
})
