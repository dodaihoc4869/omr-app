// Kho thi không được giữ màn chờ vô hạn hoặc trả "không có nháp" khi chưa đọc được nháp.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { loadAttempt, loadCachedSession, loadCauHinhMayChu, loadScriptUrlHoacMacDinh, saveAttempt } from '../src/lib/exam-db'
const m = vi.hoisted(() => ({ mo: vi.fn() }))
vi.mock('idb', () => ({ openDB: (...a: unknown[]) => m.mo(...a) }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://worker.test' }))
const nhap = { key: 'ca1:S1', maCa: 'ca1', sbd: 'S1', answers: { phanI: { q1: 'B' }, phanII: {}, phanIII: {} }, submitted: true, pendingSubmit: true }
beforeEach(() => vi.useFakeTimers())
afterEach(() => { vi.useRealTimers(); m.mo.mockReset() })
it('openDB treo quá 6 giây: đọc lượt/cached phải báo lỗi, cấu hình về dự phòng; không coi nháp là rỗng', async () => {
  m.mo.mockImplementation(() => new Promise(() => {}))
  const ket: Record<string, unknown> = {}
  void loadAttempt('ca1', 'S1').then(v => { ket.nhap = v }, e => { ket.nhap = e.name })
  void loadCachedSession('ca1').then(v => { ket.de = v }, e => { ket.de = e.name })
  void loadCauHinhMayChu().then(v => { ket.ch = v })
  await vi.advanceTimersByTimeAsync(6000)
  expect(ket.nhap).toBe('LoiKhoThi')
  expect(ket.de).toBe('LoiKhoThi')
  expect(ket.ch).toMatchObject({ URL: '' })
})
it('mở kho bị tab cũ chặn: hết hạn vẫn lấy địa chỉ Worker dự phòng', async () => {
  m.mo.mockImplementation((_ten, _v, opt) => { opt.blocked?.(); return new Promise(() => {}) })
  let url: string | undefined
  void loadScriptUrlHoacMacDinh().then(v => { url = v })
  await vi.advanceTimersByTimeAsync(6000)
  expect(url).toBe('https://worker.test')
})
it('upgrade/connection về muộn sau hạn phải abort trước mutation và đóng connection, không xóa nháp', async () => {
  let tra!: (v: unknown) => void
  m.mo.mockImplementation(() => new Promise(resolve => { tra = resolve }))
  const p = loadAttempt('ca1', 'S1').catch(e => e)
  await vi.advanceTimersByTimeAsync(6000)
  expect(await p).toMatchObject({ name: 'LoiKhoThi' })
  const tx = { abort: vi.fn() }, db = { close: vi.fn(), deleteObjectStore: vi.fn(), createObjectStore: vi.fn(), objectStoreNames: { contains: () => true } }
  m.mo.mock.calls[0][2].upgrade(db, 1, 2, tx)
  tra(db)
  await Promise.resolve(); await Promise.resolve()
  expect(tx.abort).toHaveBeenCalledOnce()
  expect(db.deleteObjectStore).not.toHaveBeenCalled()
  expect(db.createObjectStore).not.toHaveBeenCalled()
  expect(db.close).toHaveBeenCalledOnce()
})
function kho() {
  const data = new Map<string, unknown>([['ca1:S1', nhap]])
  let docTreo = true, ghiTreo = false, traGhi: (() => void) | undefined
  const abort = vi.fn()
  const db = {
    close: vi.fn(),
    get: (_store: string, key: string) => docTreo ? new Promise(() => {}) : Promise.resolve(data.get(key)),
    put: (_store: string, v: unknown) => new Promise(resolve => { traGhi = () => { data.set('ca1:S1', v); resolve('ca1:S1') } }),
    transaction: () => {
      let daHuy = false
      const store = {
        get: (key: string) => docTreo ? new Promise(() => {}) : Promise.resolve(data.get(key)),
        put: (v: unknown) => ghiTreo ? new Promise(resolve => { traGhi = () => { if (!daHuy) data.set('ca1:S1', v); resolve('ca1:S1') } }) : Promise.resolve(data.set('ca1:S1', v)),
      }
      return { store, done: Promise.resolve(), abort: () => { daHuy = true; abort() } }
    },
  }
  m.mo.mockResolvedValue(db)
  return { data, abort, docDuoc: () => { docTreo = false }, ghiBiTreo: () => { ghiTreo = true }, ghiVeMuon: () => traGhi?.() }
}
it('read transaction treo báo lỗi và abort; lần thử lại đọc nguyên pending draft sau khi kho hồi phục', async () => {
  const k = kho()
  const p = loadAttempt('ca1', 'S1').catch(e => e)
  await vi.advanceTimersByTimeAsync(6000)
  expect(await p).toMatchObject({ name: 'LoiKhoThi' })
  expect(k.abort).toHaveBeenCalled()
  expect(k.data.get('ca1:S1')).toEqual(nhap)
  k.docDuoc()
  expect(await loadAttempt('ca1', 'S1')).toEqual(nhap)
})
it('ghi transaction treo không báo ACK, abort ngăn ghi đè nháp khi request về muộn', async () => {
  const k = kho(); k.docDuoc(); k.ghiBiTreo()
  let ack = false
  const p = saveAttempt({ ...nhap, answers: { ...nhap.answers, phanI: { q1: 'D' } } } as never).then(() => { ack = true }, e => e)
  await vi.advanceTimersByTimeAsync(6000)
  expect(await p).toMatchObject({ name: 'LoiKhoThi' })
  expect(ack).toBe(false)
  k.ghiVeMuon(); await Promise.resolve()
  expect(k.abort).toHaveBeenCalled()
  expect(k.data.get('ca1:S1')).toEqual(nhap)
})
