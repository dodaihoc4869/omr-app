import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const db = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }))
vi.mock('idb', () => ({ openDB: async () => db }))

const URL_CHUNG = 'https://omr.ttadodaihoc.workers.dev'
const treo = () => new Promise<never>(() => {})
const json = (data: unknown) => new Response(JSON.stringify(data))

beforeEach(() => {
  vi.resetModules()
  vi.useFakeTimers()
  db.get.mockReset().mockResolvedValue(undefined)
  db.put.mockReset().mockResolvedValue(undefined)
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

async function chuanBiMoCa() {
  const { datMaBiMatPhien } = await import('../src/lib/exam-db')
  datMaBiMatPhien('chi-dung-trong-test')
  const { publishSession } = await import('../src/lib/exam-api')
  return () => publishSession('', '123456', 'Lớp thử', 45, { phanI: [], phanII: [], phanIII: [] } as any)
}

it('máy mới: đã có địa chỉ thì gửi ca dù ghi IndexedDB không kết thúc', async () => {
  db.put.mockImplementation(treo)
  const fetch = vi.fn(async (_url: unknown, init?: RequestInit) =>
    init?.method === 'POST' ? json({ ok: true }) : json({ mayChuMoi: URL_CHUNG }))
  vi.stubGlobal('fetch', fetch)
  const moCa = await chuanBiMoCa()
  const done = moCa()
  let xong = false
  void done.then(() => { xong = true }).catch(() => {})
  await vi.advanceTimersByTimeAsync(9000)
  expect(xong).toBe(true)
  await done
  expect(fetch.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1)
})

it('nạp nền xong dùng ngay địa chỉ: không tải tệp lần hai rồi treo', async () => {
  let nhan!: (r: Response) => void
  const fetch = vi.fn().mockImplementationOnce(() => new Promise<Response>(r => { nhan = r })).mockImplementation(treo)
  vi.stubGlobal('fetch', fetch)
  const mc = await import('../src/lib/may-chu-moi')
  const nap = mc.napDiaChiMayChuMoiChoEm()
  await vi.advanceTimersByTimeAsync(1)
  const done = mc.layCauHinhMayChu()
  await vi.advanceTimersByTimeAsync(1)
  nhan(json({ mayChuMoi: URL_CHUNG }))
  await nap
  let url = ''
  void done.then(ch => { url = ch.URL })
  await vi.advanceTimersByTimeAsync(1)
  expect(url).toBe(URL_CHUNG)
  expect(fetch).toHaveBeenCalledTimes(1)
})

it('IndexedDB không trả lời vẫn mở ca bằng cấu hình chung và phiên đã đăng nhập', async () => {
  db.get.mockImplementation(treo)
  const fetch = vi.fn(async (_url: unknown, init?: RequestInit) =>
    init?.method === 'POST' ? json({ ok: true }) : json({ mayChuMoi: URL_CHUNG }))
  vi.stubGlobal('fetch', fetch)
  const moCa = await chuanBiMoCa()
  const done = moCa()
  let xong = false
  void done.then(() => { xong = true }).catch(() => {})
  await vi.advanceTimersByTimeAsync(9000)
  expect(xong).toBe(true)
  await done
})

it('tải cấu hình hoặc thân JSON treo đều kết thúc và hủy yêu cầu', async () => {
  for (const bodyTreo of [false, true]) {
    const fetch = vi.fn(() => bodyTreo ? Promise.resolve({ ok: true, json: treo }) : treo())
    vi.stubGlobal('fetch', fetch)
    const { loadDiaChiMayChuMoiChoEm } = await import('../src/lib/exam-db')
    let result: string | undefined
    const done = loadDiaChiMayChuMoiChoEm().then(u => { result = u })
    await vi.advanceTimersByTimeAsync(7000)
    expect(result).toBe('')
    expect((fetch.mock.calls as any)[0][1].signal.aborted).toBe(true)
    await done
  }
})
