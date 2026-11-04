// PHÒNG CHỜ HỎI LẠI GÓI (thầy 04/11: «Tải sẵn đề đáp án tới máy hs khi vào phòng chờ», «tức thì lúc bấm bắt đầu») — src/lib/khoa-de-thi.ts.
// Ca đề riêng: thầy nối câu ngoài kho vào kho ca trong lúc em chờ ⇒ gói đề / tờ đáp án đổi phiên bản. Máy em hỏi lại theo nhịp (~20 giây): không đổi ⇒ giữ;
// đổi ⇒ nhận gói đề mới + tải lại gói tờ đáp án (vẫn ĐÃ KHOÁ). Vào thi / ca bắt đầu ⇒ thôi hỏi.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const goiWorker = vi.hoisted(() => vi.fn())
vi.mock('../src/lib/may-chu-moi', () => ({ goiWorker, layCauHinhMayChu: async () => ({ BAT: true, URL: 'https://may-chu.test' }), nhipNong: () => 5 }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu.test' }))

const kd = await import('../src/lib/khoa-de-thi')

let phienDe = 'p1', phienDa = 'k1', batDau = false
beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValue(0.5) // nhịp đúng 20 giây
  phienDe = 'p1'; phienDa = 'k1'; batDau = false
  kd.xoaDeTruoc(); localStorage.clear()
  goiWorker.mockReset()
  goiWorker.mockImplementation(async (_ch: unknown, duong: string, b: { phien?: string }) => {
    if (duong === '/de-truoc') {
      if (b.phien && batDau) return { ok: false, lyDo: 'da_bat_dau' }
      if (b.phien === phienDe) return { ok: true, khongDoi: true, phien: phienDe }
      return { ok: true, goi: `goi-${phienDe}`, phien: phienDe }
    }
    if (duong === '/khoa-de') return { ok: true, goi: `dap-an-${phienDa}`, phien: phienDa }
    return null
  })
})
afterEach(() => { for (const m of ['C1', 'C2', 'C3', 'C4']) kd.thoiHoiLaiPhongCho(m); vi.useRealTimers(); vi.restoreAllMocks() })
// Mỗi test một mã ca: vòng hỏi lại của test trước còn chờ đồng hồ giả (đã gỡ) — không chạm ca của test sau.

const soLan = (duong: string) => goiWorker.mock.calls.filter((c) => c[1] === duong).length

it('vào phòng chờ tải cả hai gói; đề không đổi ⇒ hỏi lại chỉ nhận «không đổi», không tải lại tờ đáp án', async () => {
  await kd.taiSanPhongCho('u', 'C1', 'S1')
  expect(kd.docDeTruoc('C1')?.phien).toBe('p1')
  expect(kd.docGoiDe('C1', 'S1')?.phien).toBe('k1')
  await vi.advanceTimersByTimeAsync(20_000)
  expect(soLan('/de-truoc')).toBe(2)
  expect(goiWorker.mock.calls.filter((c) => c[1] === '/de-truoc').at(-1)![2]).toMatchObject({ phien: 'p1' })
  expect(soLan('/khoa-de')).toBe(1)
})

it('thầy nối câu (đề đổi phiên bản) ⇒ lượt hỏi kế nhận gói đề mới + tải lại gói tờ đáp án mới', async () => {
  await kd.taiSanPhongCho('u', 'C2', 'S1')
  phienDe = 'p2'; phienDa = 'k2'
  await vi.advanceTimersByTimeAsync(20_000)
  expect(kd.docDeTruoc('C2')).toMatchObject({ phien: 'p2', goi: 'goi-p2' })
  expect(kd.docGoiDe('C2', 'S1')?.phien).toBe('k2')
})

it('ca đã bắt đầu ⇒ máy chủ báo da_bat_dau ⇒ thôi hỏi (không gọi thêm suốt giờ thi)', async () => {
  await kd.taiSanPhongCho('u', 'C3', 'S1')
  batDau = true
  await vi.advanceTimersByTimeAsync(20_000)
  const n = soLan('/de-truoc')
  await vi.advanceTimersByTimeAsync(120_000)
  expect(soLan('/de-truoc')).toBe(n)
  expect(kd.docDeTruoc('C3')?.phien).toBe('p1') // gói đang giữ không mất
})

it('em vào thi (truocVao) ⇒ thôi hỏi lại', async () => {
  await kd.taiSanPhongCho('u', 'C4', 'S1')
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true, khongDoi: true, phien: 'p1' }))))
  await kd.truocVao('https://may-chu.test', 'C4', 'S1')
  const n = soLan('/de-truoc')
  await vi.advanceTimersByTimeAsync(100_000)
  expect(soLan('/de-truoc')).toBe(n)
  vi.unstubAllGlobals()
})
