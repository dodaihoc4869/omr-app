// @vitest-environment node
// ĐĂNG NHẬP KÈM SẢNH (D1 vòng 2, 06/10 — thầy: "app thật mượt mà nhanh gấp 2 lần", giữ nguyên hành vi đăng nhập): máy em xin `kemSanh: true` ⇒ phản hồi đăng nhập
// THÀNH CÔNG mang thêm khoá `sanh` = đúng phản hồi lệnh `/game-v2/hoa2-sanh` của em ấy (bớt một vòng mạng). Mọi trường hợp khác: phản hồi y hệt cũ.
// Chạy trên D1 THẬT dạng SQLite (tests/_d1-that.ts) qua `worker.fetch` đúng như app.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { taoD1That } from './_d1-that'
import worker from '../server/src/index'
import { gvChienDich } from '../server/src/srs2-gv'
import { HAN_SANH_KEM_MS, sanhKemDangNhap } from '../server/src/dang-nhap-kem-sanh'
import type { Env } from '../server/src/kieu'

// Cho phép phép kiểm làm hỏng RIÊNG lệnh Sảnh (mọi lệnh game khác chạy thật) để kiểm "Sảnh lỗi ⇒ đăng nhập vẫn thành công".
vi.mock('../server/src/game-v2', async (goc) => {
  const m = await goc<typeof import('../server/src/game-v2')>()
  return { ...m, gameV2: (env: never, action: string, b: never, ctx?: never) => ((globalThis as { __SANH_HONG?: boolean }).__SANH_HONG && action === 'hoa2-sanh' ? Promise.reject(new Error('Sảnh hỏng giả')) : m.gameV2(env, action, b, ctx)) }
})

const T0 = Date.parse('2026-09-30T02:00:00Z')
const cau = (qid: string, phan: 'I' | 'II') => JSON.stringify({
  qid, maDe: 'DE1', lop: '12', version: 'v1', group: `g-${qid}`, phan, text: `Câu ${qid}`, choices: phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [],
  hinhAnh: [], dang: 'D1', tenDang: 'Dạng 1', mucDo: 'NB', sao: 1, kienThuc: ['k'], correct: phan === 'I' ? 'B' : 'DSDS', reviewed: true, solution: { chot: 'c' },
})
async function dung() {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','An','12','mk-s1','x'),('S2','Bình','12',NULL,'x')")
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true}','x')`)
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 1; i <= 24; i++) st.run('DE1', `Q${i}`, 'v1', `g-Q${i}`, 'D1', cau(`Q${i}`, i % 4 === 0 ? 'II' : 'I'))
  await gvChienDich(env, { action: 'tao', ten: 'Test', sbd: ['S1'], maDe: ['DE1'], hanNop: '2026-10-05' }, T0)
  return { d, env }
}
type Obj = Record<string, unknown>
const goi = async (env: Env, duong: string, than: Obj): Promise<Obj> =>
  (await (await worker.fetch(new Request(`https://omr.test${duong}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(than) }), env as never)).json()) as Obj
const boGio = ({ serverNow: _a, nhipDeNghi: _b, ...r }: Obj): Obj => r

afterEach(() => {
  vi.useRealTimers()
  delete (globalThis as { __SANH_HONG?: boolean }).__SANH_HONG
})

describe('/hs/dang-nhap — xin kèm Sảnh (kemSanh)', () => {
  it('đúng mật khẩu + kemSanh ⇒ có `sanh`, GIỐNG TỪNG KHOÁ lệnh hoa2-sanh trả riêng (trừ giờ máy chủ); token dùng được', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(T0 + 1000)
    const { env } = await dung()
    const dn = await goi(env, '/hs/dang-nhap', { sbd: 'S1', matKhau: 'mk-s1', kemSanh: true })
    expect(dn.ok).toBe(true)
    expect(typeof dn.token).toBe('string')
    expect(dn.sbd).toBe('S1')
    const sanh = dn.sanh as Obj
    expect(sanh).toMatchObject({ ok: true, cheDo2: true })
    expect(typeof sanh.serverNow).toBe('number')
    expect(sanh.nhipDeNghi).toBeDefined()
    // Bản trả riêng ngay sau đó (cùng token, cùng giờ): trùng từng khoá.
    const rieng = await goi(env, '/game-v2/hoa2-sanh', { token: dn.token })
    expect(rieng.ok).toBe(true)
    expect(boGio(sanh)).toEqual(boGio(rieng))
    // Phản hồi đăng nhập giữ NGUYÊN các trường cũ.
    expect(dn).toMatchObject({ ok: true, chuaCoMatKhau: false, sbd: 'S1', hoTen: 'An', lop: '12' })
  })

  it('KHÔNG xin kemSanh (máy em cũ, cổng khác, màn Game) ⇒ không có khoá `sanh`, phản hồi y hệt cũ', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(T0 + 1000)
    const { env } = await dung()
    for (const them of [{}, { kemSanh: false }, { kemSanh: 'true' }, { kemSanh: 1 }]) {
      const dn = await goi(env, '/hs/dang-nhap', { sbd: 'S1', matKhau: 'mk-s1', ...them })
      expect(dn.ok, JSON.stringify(them)).toBe(true)
      expect('sanh' in dn, JSON.stringify(them)).toBe(false)
      expect(Object.keys(dn).sort()).toEqual(['chuaCoMatKhau', 'hoTen', 'lop', 'namSinh', 'nhipDeNghi', 'ok', 'sbd', 'serverNow', 'token'])
    }
  })

  it('sai mật khẩu / thiếu mật khẩu / chưa có mật khẩu ⇒ lời lỗi như cũ, KHÔNG token, KHÔNG `sanh` (không lộ gì cho người chưa xác thực)', async () => {
    const { env } = await dung()
    const sai = await goi(env, '/hs/dang-nhap', { sbd: 'S1', matKhau: 'sai-roi', kemSanh: true })
    expect(sai).toMatchObject({ ok: false, error: 'Mật khẩu không chính xác' })
    expect('sanh' in sai || 'token' in sai).toBe(false)
    const thieu = await goi(env, '/hs/dang-nhap', { sbd: 'S1', matKhau: '', kemSanh: true })
    expect(thieu).toMatchObject({ ok: false, error: 'Vui lòng nhập mật khẩu' })
    expect('sanh' in thieu).toBe(false)
    const chua = await goi(env, '/hs/dang-nhap', { sbd: 'S2', matKhau: '', kemSanh: true })
    expect(chua).toMatchObject({ ok: true, chuaCoMatKhau: true, sbd: 'S2' })
    expect('sanh' in chua || 'token' in chua).toBe(false)
    const la = await goi(env, '/hs/dang-nhap', { sbd: 'KHONGCO', matKhau: 'x', kemSanh: true })
    expect(la).toMatchObject({ ok: false })
    expect('sanh' in la).toBe(false)
  })

  it('Sảnh lỗi ⇒ đăng nhập VẪN thành công (đủ token + thông tin), chỉ thiếu `sanh` — máy em tự hỏi Sảnh như cũ', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(T0 + 1000)
    const { env } = await dung()
    ;(globalThis as { __SANH_HONG?: boolean }).__SANH_HONG = true
    const dn = await goi(env, '/hs/dang-nhap', { sbd: 'S1', matKhau: 'mk-s1', kemSanh: true })
    expect(dn).toMatchObject({ ok: true, chuaCoMatKhau: false, sbd: 'S1', hoTen: 'An' })
    expect(typeof dn.token).toBe('string')
    expect('sanh' in dn).toBe(false)
    delete (globalThis as { __SANH_HONG?: boolean }).__SANH_HONG
    const sau = await goi(env, '/game-v2/hoa2-sanh', { token: dn.token })
    expect(sau).toMatchObject({ ok: true, cheDo2: true })
  })

  it('em chưa ở Hoá 2.0 (cờ tắt) ⇒ `sanh` = { ok:true, cheDo2:false } — máy em biết ngay, không hỏi lại', async () => {
    const { d, env } = await dung()
    d.sql.exec(`UPDATE cau_hinh SET gia_tri = '{"bat":false}' WHERE khoa = 'game_hoa_2'`)
    const dn = await goi(env, '/hs/dang-nhap', { sbd: 'S1', matKhau: 'mk-s1', kemSanh: true })
    expect(dn.ok).toBe(true)
    expect((dn.sanh as Obj).ok).toBe(true)
    expect((dn.sanh as Obj).cheDo2).toBe(false)
  })
})

describe('sanhKemDangNhap — không bao giờ ném lỗi, không bao giờ giữ đăng nhập chờ quá hạn', () => {
  it('thành công ⇒ trả kết quả đã trang trí; `ok` khác true ⇒ null', async () => {
    expect(await sanhKemDangNhap(async () => ({ ok: true, a: 1 }), (r) => ({ ...r, them: 2 }))).toEqual({ ok: true, a: 1, them: 2 })
    expect(await sanhKemDangNhap(async () => ({ ok: false, error: 'x' }))).toBeNull()
    expect(await sanhKemDangNhap(async () => ({ cheDo2: true }))).toBeNull()
  })
  it('lệnh ném lỗi (đồng bộ hoặc bất đồng bộ) ⇒ null, không lỗi chưa xử lý', async () => {
    expect(await sanhKemDangNhap(() => Promise.reject(new Error('hỏng')))).toBeNull()
    expect(await sanhKemDangNhap(() => { throw new Error('hỏng đồng bộ') })).toBeNull()
    expect(await sanhKemDangNhap(async () => ({ ok: true }), () => { throw new Error('trang trí hỏng') })).toBeNull()
  })
  it('quá hạn ⇒ null đúng hạn (không chờ lệnh treo); lệnh trễ rồi mới lỗi cũng không thành lỗi chưa xử lý', async () => {
    const t0 = Date.now()
    expect(await sanhKemDangNhap(() => new Promise(() => {}), undefined, 40)).toBeNull()
    expect(Date.now() - t0).toBeLessThan(1500)
    let loiTre!: (e: Error) => void
    const tre = new Promise<Record<string, unknown>>((_, hong) => { loiTre = hong })
    expect(await sanhKemDangNhap(() => tre, undefined, 20)).toBeNull()
    loiTre(new Error('lỗi sau hạn'))
    await new Promise((r) => setTimeout(r, 10))
  })
  it('hạn mặc định ngắn hơn hạn 15 giây của form đăng nhập', () => {
    expect(HAN_SANH_KEM_MS).toBeGreaterThan(0)
    expect(HAN_SANH_KEM_MS).toBeLessThan(15_000)
  })
})
