import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  saved: '',
  file: '',
  loads: 0,
}))

vi.mock('../src/lib/exam-db', () => ({
  loadCauHinhMayChu: async () => ({ BAT: !!state.saved, URL: state.saved, HAN_GIAY: 10, HAN_NONG_GIAY: 3, SO_LAN_THU: 1, GIAN_VAO_THI_GIAY: 0 }),
  saveCauHinhMayChu: async (ch: { URL: string }) => { state.saved = ch.URL; return ch },
  loadDiaChiMayChuMoiChoEm: async () => { state.loads++; return state.file },
}))

const mayChu = await import('../src/lib/may-chu-moi')
const { layDiaChiMayChu, quenDiaChiMayChu } = await import('../src/lib/dia-chi-may-chu')
const URL_CHUNG = 'https://omr.ttadodaihoc.workers.dev'

beforeEach(() => {
  state.saved = ''
  state.file = ''
  state.loads = 0
  mayChu.quenCauHinhMayChu()
  mayChu.quenDiaChiTuTep()
  quenDiaChiMayChu()
})

describe('máy mới đọc cùng máy chủ với máy mở ca', () => {
  it('lần đầu không đọc được tệp cấu hình vẫn thử lại được trong cùng phiên', async () => {
    await mayChu.napDiaChiMayChuMoiChoEm()
    expect(state.saved).toBe('')
    state.file = URL_CHUNG
    await mayChu.napDiaChiMayChuMoiChoEm()
    expect(state.loads).toBe(2)
    expect(state.saved).toBe(URL_CHUNG)
    expect(await layDiaChiMayChu()).toBe(URL_CHUNG)
  })

  it('không có IndexedDB hay localStorage, lượt gọi sau tự đọc lại cấu hình công khai', async () => {
    expect(await layDiaChiMayChu()).toBe('')
    state.file = URL_CHUNG
    expect(await layDiaChiMayChu()).toBe(URL_CHUNG)
  })

  it('cấu hình hợp lệ vừa thay thắng địa chỉ đã nhớ', async () => {
    state.file = URL_CHUNG
    expect(await layDiaChiMayChu()).toBe(URL_CHUNG)
    state.saved = 'https://exam.example.edu/api'
    mayChu.quenCauHinhMayChu()
    expect(await layDiaChiMayChu()).toBe(state.saved)
  })

  it('không rẽ sang localhost, loopback, Google hoặc HTTP qua link mời', async () => {
    for (const url of ['http://exam.example.edu', 'https://localhost:8787', 'https://127.0.0.1:8787', 'https://[::1]:8787', 'https://script.google.com/macros/s/abc']) {
      expect(await layDiaChiMayChu(url), url).toBe('')
    }
    expect(await layDiaChiMayChu(URL_CHUNG)).toBe(URL_CHUNG)
  })
})
