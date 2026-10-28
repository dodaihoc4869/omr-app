// Kho thi không được giữ màn chờ vô hạn hoặc trả "không có nháp" khi chưa đọc được nháp.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
// Kho thi giữ MỘT kết nối dùng chung (28/10) ⇒ mỗi ca test nạp lại mô-đun để kho giả của ca trước không bị dùng lại.
let K: typeof import('../src/lib/exam-db')
const loadAttempt: typeof K.loadAttempt = (...a) => K.loadAttempt(...a)
const loadCachedSession: typeof K.loadCachedSession = (...a) => K.loadCachedSession(...a)
const loadCauHinhMayChu: typeof K.loadCauHinhMayChu = (...a) => K.loadCauHinhMayChu(...a)
const loadScriptUrlHoacMacDinh: typeof K.loadScriptUrlHoacMacDinh = (...a) => K.loadScriptUrlHoacMacDinh(...a)
const saveAttempt: typeof K.saveAttempt = (...a) => K.saveAttempt(...a)
const m = vi.hoisted(() => ({ mo: vi.fn() }))
vi.mock('idb', () => ({ openDB: (...a: unknown[]) => m.mo(...a) }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://worker.test' }))
const nhap = { key: 'ca1:S1', maCa: 'ca1', sbd: 'S1', answers: { phanI: { q1: 'B' }, phanII: {}, phanIII: {} }, submitted: true, pendingSubmit: true }
beforeEach(async () => { vi.resetModules(); K = await import('../src/lib/exam-db'); vi.useFakeTimers() })
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
  let baoLoi!: (e: Error) => void
  const tx = { done: new Promise<void>((_resolve, reject) => { baoLoi = reject }), abort: vi.fn(() => baoLoi(new Error('Giao dịch đã hủy.'))) }
  const db = { close: vi.fn(), deleteObjectStore: vi.fn(), createObjectStore: vi.fn(), objectStoreNames: { contains: () => true } }
  m.mo.mock.calls[0][2].upgrade(db, 1, 2, tx)
  tra(db)
  await Promise.resolve(); await Promise.resolve()
  expect(tx.abort).toHaveBeenCalledOnce()
  expect(db.deleteObjectStore).not.toHaveBeenCalled()
  expect(db.createObjectStore).not.toHaveBeenCalled()
  expect(db.close).toHaveBeenCalledOnce()
})
function nangCapDangCho() {
  const data = new Map<string, unknown>([['ca1:S1', nhap]])
  const stores = new Set(['settings', 'attempts', 'examContents'])
  let daHuy = false, xoaNhap = false
  let traDone!: () => void, baoLoiDone!: (e: Error) => void, traMo!: (db: unknown) => void, baoLoiMo!: (e: Error) => void
  const tx = {
    done: new Promise<void>((resolve, reject) => { traDone = resolve; baoLoiDone = reject }),
    abort: vi.fn(() => { daHuy = true; baoLoiDone(new Error('Giao dịch đã hủy.')) }),
  }
  const db = {
    close: vi.fn(), objectStoreNames: { contains: (s: string) => stores.has(s) },
    deleteObjectStore: vi.fn((s: string) => { stores.delete(s); if (s === 'attempts') xoaNhap = true }),
    createObjectStore: vi.fn((s: string) => { stores.add(s) }),
    transaction: () => ({ store: { get: (key: string) => Promise.resolve(data.get(key)) }, done: Promise.resolve(), abort: vi.fn() }),
  }
  m.mo.mockImplementation((_ten, _v, opt) => {
    opt.upgrade(db, 1, 2, tx)
    return new Promise((resolve, reject) => { traMo = resolve; baoLoiMo = reject })
  })
  return {
    data, tx, db,
    commitMuon: () => { if (!daHuy) { if (xoaNhap) data.clear(); traDone() } traMo(db) },
    moLoi: () => baoLoiMo(new Error('Không mở được kho.')),
    done: () => traDone(),
    thuLai: () => m.mo.mockResolvedValue(db),
  }
}
it('upgrade bắt đầu trước hạn nhưng chưa commit: timeout rollback thao tác đã xếp hàng, đóng connection muộn và thử lại giữ nháp', async () => {
  const k = nangCapDangCho()
  const p = loadAttempt('ca1', 'S1').catch(e => e)
  expect(k.db.deleteObjectStore).toHaveBeenCalledWith('attempts')
  expect(k.tx.abort).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(3000)
  expect(await p).toMatchObject({ name: 'LoiKhoThi' })
  expect(k.tx.abort).toHaveBeenCalledOnce()
  k.commitMuon()
  await Promise.resolve(); await Promise.resolve()
  expect(k.db.close).toHaveBeenCalledOnce()
  expect(k.data.get('ca1:S1')).toEqual(nhap)
  k.thuLai()
  expect(await loadAttempt('ca1', 'S1')).toEqual(nhap)
})
it('open báo lỗi cũng hủy upgrade đang chờ, nhưng transaction đã done không bị hủy lại', async () => {
  const k = nangCapDangCho()
  const p = loadAttempt('ca1', 'S1').catch(e => e)
  k.moLoi()
  expect(await p).toMatchObject({ name: 'LoiKhoThi' })
  expect(k.tx.abort).toHaveBeenCalledOnce()
  const xong = nangCapDangCho()
  const p2 = loadAttempt('ca1', 'S1').catch(e => e)
  xong.done()
  await Promise.resolve()
  xong.moLoi()
  expect(await p2).toMatchObject({ name: 'LoiKhoThi' })
  expect(xong.tx.abort).not.toHaveBeenCalled()
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

// TỐC ĐỘ 28/10: MỘT kết nối dùng chung — lưu câu liên tiếp không mở kho lại; nâng phiên bản từ v2 trở lên KHÔNG xoá bài làm chưa gửi.
it('nhiều lần lưu / đọc liên tiếp chỉ mở kho MỘT lần; thao tác lỗi thì lần sau mở lại', async () => {
  vi.useRealTimers()
  const data = new Map<string, unknown>([['ca1:S1', nhap]])
  let loi = false
  const db = {
    close: vi.fn(),
    transaction: () => ({ store: { get: (k: string) => (loi ? Promise.reject(new Error('hỏng')) : Promise.resolve(data.get(k))), put: (v: { key: string }) => Promise.resolve(data.set(v.key, v)) }, done: Promise.resolve(), abort: vi.fn() }),
  }
  m.mo.mockResolvedValue(db)
  await saveAttempt(nhap as never)
  await saveAttempt(nhap as never)
  expect(await loadAttempt('ca1', 'S1')).toEqual(nhap)
  expect(m.mo).toHaveBeenCalledOnce()
  loi = true
  await expect(loadAttempt('ca1', 'S1')).rejects.toMatchObject({ name: 'LoiKhoThi' })
  loi = false
  expect(await loadAttempt('ca1', 'S1')).toEqual(nhap)
  expect(m.mo).toHaveBeenCalledTimes(2)
})
it('nâng kho từ v2 (sau này đổi DB_VERSION) không xoá kho bài làm', async () => {
  vi.useRealTimers()
  const db = { close: vi.fn(), objectStoreNames: { contains: () => true }, deleteObjectStore: vi.fn(), createObjectStore: vi.fn(),
    transaction: () => ({ store: { get: () => Promise.resolve(nhap) }, done: Promise.resolve(), abort: vi.fn() }) }
  const tx = { done: Promise.resolve(), abort: vi.fn() }
  m.mo.mockImplementation((_ten, _v, opt) => { opt.upgrade(db, 2, 3, tx); return Promise.resolve(db) })
  expect(await loadAttempt('ca1', 'S1')).toEqual(nhap)
  expect(db.deleteObjectStore).not.toHaveBeenCalled()
})
