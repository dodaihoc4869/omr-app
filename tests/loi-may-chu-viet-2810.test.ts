// @vitest-environment node
// Thầy chụp 28/10: màn Kiểm tra ôn tập hiện «D1_ERROR: Currently processing a long-running export.».
// Máy chủ: chữ lỗi gốc chỉ ghi log; D1 tạm thời ⇒ 503 + maLoi MAY_CHU_BAN; lỗi kỹ thuật khác ⇒ câu Việt chung; câu Việt cố ý viết cho em ⇒ giữ.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { gameToken } from '../server/src/game-v2-auth'
import { lamSachThanLoi, phanLoaiLoi, thanTuLoiNem, CHU_LOI_CHUNG, CHU_MAY_CHU_BAN, CHU_MAY_CHU_BAN_PH, CHU_MAY_CHU_BAN_THAY, loiBanTheoDuong } from '../server/src/loi-may-chu'
import { taoD1That } from './_d1-that'

afterEach(() => vi.restoreAllMocks())

describe('phân loại chữ lỗi máy chủ', () => {
  it.each([
    'D1_ERROR: Currently processing a long-running export.',
    'D1_ERROR: D1 DB is overloaded. Requests queued for too long.',
    'D1_ERROR: storage operation exceeded timeout which caused object to be reset.',
    'Network connection lost.',
    'D1_ERROR: internal error',
  ])('D1 tạm thời ⇒ ban: %s', (s) => expect(phanLoaiLoi(s)).toBe('ban'))
  it.each([
    'D1_ERROR: no such column: abc: SQLITE_ERROR',
    "TypeError: Cannot read properties of undefined (reading 'x')",
    'synthetic database unavailable',
    'Lỗi: D1_ERROR no such table x',
  ])('lỗi kỹ thuật ⇒ chung: %s', (s) => expect(phanLoaiLoi(s)).toBe('chung'))
  it.each(['Thiếu mã ca.', 'het_tran', 'Hôm nay em đã chơi đủ câu ở Đảo.'])('câu Việt / mã có tên ⇒ giữ: %s', (s) => expect(phanLoaiLoi(s)).toBe('giu'))
})

describe('làm sạch thân lỗi', () => {
  it('D1 export ⇒ 503 + MAY_CHU_BAN, không còn chữ tiếng Anh', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { data, status } = lamSachThanLoi({ ok: false, error: 'D1_ERROR: Currently processing a long-running export.' }, 200)
    expect(status).toBe(503)
    expect(data).toEqual({ ok: false, error: CHU_MAY_CHU_BAN, ma: 'MAY_CHU_BAN', maLoi: 'MAY_CHU_BAN', thuLaiSau: 2 })
  })
  it('thân ok:true / lỗi Việt đi nguyên (cùng tham chiếu)', () => {
    const a = { ok: true, error: 'D1_ERROR x' }, b = { ok: false, error: 'Thiếu mã ca.', ma: 'x' }
    expect(lamSachThanLoi(a, 200).data).toBe(a)
    expect(lamSachThanLoi(b, 200)).toEqual({ data: b, status: 200 })
  })
  it('lỗi ném chưa bắt giữ mã có tên, đổi chữ', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const e = Object.assign(new Error('TypeError: x is not a function'), { ma: 'het_tran' })
    expect(thanTuLoiNem(e)).toEqual({ data: { ok: false, ma: 'het_tran', error: CHU_LOI_CHUNG }, status: 500 })
    expect(thanTuLoiNem(new Error('Em chưa vào ca.'))).toEqual({ data: { ok: false, error: 'Em chưa vào ca.' }, status: 500 })
  })
})

describe('Worker thật: D1 đang export ⇒ máy em nhận 503 câu Việt', () => {
  it('lệnh học sinh gặp D1_ERROR ⇒ 503 + MAY_CHU_BAN, CORS còn, không lộ chữ gốc', async () => {
    const loiLog = vi.spyOn(console, 'error').mockImplementation(() => {})
    const d = taoD1That()
    d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Em','12','mk','x')")
    const token = await gameToken(d.env, 'S1')
    // D1 đang export: MỌI truy vấn bị từ chối.
    d.env.DB.prepare = () => { throw new Error('D1_ERROR: Currently processing a long-running export.') }
    const res = await worker.fetch(new Request('https://local/game-v2/hoc-tap-ktcn-luu', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, id: 'K1', chang: 0, tra: {}, revision: 0 }),
    }), d.env)
    const than = await res.text()
    expect(than).not.toMatch(/D1_ERROR|long-running|export/)
    expect(res.headers.get('access-control-allow-origin')).toBeTruthy()
    const j = JSON.parse(than)
    expect(j.ok).toBe(false)
    expect(res.status).toBe(503)
    expect(j).toMatchObject({ ma: 'MAY_CHU_BAN', maLoi: 'MAY_CHU_BAN', thuLaiSau: 2, error: CHU_MAY_CHU_BAN })
    expect(loiLog.mock.calls.flat().map(String).join(' ')).toMatch(/long-running export/)
  })
  it('/hs/chua-cau-sai/* khi D1 quá tải lúc xác thực ⇒ 503 MAY_CHU_BAN (không báo nhầm 401 Em đăng nhập lại)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const d = taoD1That()
    d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Em','12','mk','x')")
    const token = await gameToken(d.env, 'S1')
    d.env.DB.prepare = () => { throw new Error('D1_ERROR: D1 DB is overloaded. Requests queued for too long.') }
    const res = await worker.fetch(new Request('https://local/hs/chua-cau-sai/danh-sach', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    }), d.env)
    expect(res.status).toBe(503)
    const j = await res.json() as Record<string, unknown>
    expect(j.ma).toBe('MAY_CHU_BAN')
    expect(j.mo).toBe(CHU_MAY_CHU_BAN)
  })
})

describe('xưng hô theo app khi máy chủ bận', () => {
  it('/gv ⇒ «Thầy thử lại», /ph ⇒ «Anh/chị thử lại», còn lại giữ câu cho em', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const d = taoD1That()
    d.env.DB.prepare = () => { throw new Error('D1_ERROR: D1 DB is overloaded. Requests queued for too long.') }
    const goi = async (duong: string) => {
      const res = await worker.fetch(new Request(`https://local${duong}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ secret: 'bi-mat-thu', token: 'x' }) }), d.env)
      return { status: res.status, j: await res.json() as Record<string, unknown> }
    }
    expect(loiBanTheoDuong('/ph/ke-hoach')).toBe(CHU_MAY_CHU_BAN_PH)
    expect(loiBanTheoDuong('/game-v2/answer')).toBeNull()
    for (const [duong, chu] of [['/gv/bang-tin-song', CHU_MAY_CHU_BAN_THAY]] as const) {
      const { status, j } = await goi(duong)
      expect(status).toBe(503); expect(j.error).toBe(chu)
      expect(JSON.stringify(j)).not.toMatch(/D1_|overloaded/)
    }
  })
})
