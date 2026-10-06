// @vitest-environment node
// ĐĂNG NHẬP KÈM SẢNH (D1 vòng 2, 06/10 — thầy: "app thật mượt mà nhanh gấp 2 lần", giữ nguyên hành vi đăng nhập): máy em xin `kemSanh: true` ⇒ đăng nhập THÀNH CÔNG trả
// THEO LUỒNG (NDJSON): dòng 1 = đúng thân đăng nhập cũ (đi NGAY, không chờ Sảnh), dòng 2 = `{sanh}` = đúng phản hồi lệnh `/game-v2/hoa2-sanh` của em ấy (bớt một vòng mạng).
// Mọi trường hợp khác: phản hồi JSON y hệt cũ. Chạy trên D1 THẬT dạng SQLite (tests/_d1-that.ts) qua `worker.fetch` đúng như app.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { taoD1That } from './_d1-that'
import worker from '../server/src/index'
import { gvChienDich } from '../server/src/srs2-gv'
import { HAN_SANH_KEM_MS, KIEU_LUONG_DANG_NHAP, kemSanhBiTat, luongDangNhapKemSanh, sanhKemDangNhap } from '../server/src/dang-nhap-kem-sanh'
import type { Env } from '../server/src/kieu'

// Cho phép phép kiểm làm hỏng / làm CHẬM RIÊNG lệnh Sảnh (mọi lệnh game khác chạy thật): `__SANH_HONG` ném lỗi; `__SANH_CHO` = lời hứa Sảnh phải chờ trước khi chạy.
type CongTac = { __SANH_HONG?: boolean; __SANH_CHO?: Promise<void> }
const CT = globalThis as unknown as CongTac
vi.mock('../server/src/game-v2', async (goc) => {
  const m = await goc<typeof import('../server/src/game-v2')>()
  return {
    ...m,
    gameV2: async (env: never, action: string, b: never, ctx?: never) => {
      if (action === 'hoa2-sanh') {
        if (CT.__SANH_CHO) await CT.__SANH_CHO
        if (CT.__SANH_HONG) throw new Error('Sảnh hỏng giả')
      }
      return m.gameV2(env, action, b, ctx)
    },
  }
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
const yeuCau = (duong: string, than: Obj) => new Request(`https://omr.test${duong}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(than) })
/** Phản hồi JSON MỘT khối (mọi lệnh thường). */
const goi = async (env: Env, duong: string, than: Obj): Promise<Obj> => (await (await worker.fetch(yeuCau(duong, than), env as never)).json()) as Obj
/** Phản hồi THEO LUỒNG đọc hết: kiểu + từng dòng JSON. */
const goiLuong = async (env: Env, than: Obj): Promise<{ kieu: string; dong: Obj[]; status: number }> => {
  const r = await worker.fetch(yeuCau('/hs/dang-nhap', than), env as never)
  const chu = await r.text()
  return { kieu: r.headers.get('content-type') ?? '', status: r.status, dong: chu.split('\n').filter(Boolean).map((x) => JSON.parse(x) as Obj) }
}
const boGio = ({ serverNow: _a, nhipDeNghi: _b, ...r }: Obj): Obj => r

afterEach(() => {
  vi.useRealTimers()
  delete CT.__SANH_HONG
  delete CT.__SANH_CHO
})

describe('/hs/dang-nhap — xin kèm Sảnh (kemSanh): trả theo luồng', () => {
  it('đúng mật khẩu + kemSanh ⇒ NDJSON hai dòng: dòng 1 = đăng nhập đủ trường cũ, dòng 2 = Sảnh GIỐNG TỪNG KHOÁ lệnh hoa2-sanh trả riêng (trừ giờ máy chủ)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(T0 + 1000)
    const { env } = await dung()
    const dn = await goiLuong(env, { sbd: 'S1', matKhau: 'mk-s1', kemSanh: true })
    expect(dn.status).toBe(200)
    expect(dn.kieu).toBe(KIEU_LUONG_DANG_NHAP)
    expect(dn.dong).toHaveLength(2)
    const [dau, sau] = dn.dong as [Obj, { sanh: Obj }]
    expect(dau).toMatchObject({ ok: true, chuaCoMatKhau: false, sbd: 'S1', hoTen: 'An', lop: '12' })
    expect(typeof dau.token).toBe('string')
    expect(typeof dau.serverNow).toBe('number')
    expect('sanh' in dau).toBe(false) // dòng 1 giống hệt thân đăng nhập cũ
    expect(sau.sanh).toMatchObject({ ok: true, cheDo2: true })
    expect(typeof sau.sanh.serverNow).toBe('number')
    // Bản trả riêng ngay sau đó (cùng token, cùng giờ): trùng từng khoá.
    const rieng = await goi(env, '/game-v2/hoa2-sanh', { token: dau.token })
    expect(rieng.ok).toBe(true)
    expect(boGio(sau.sanh)).toEqual(boGio(rieng))
  })

  it('DÒNG 1 ĐI TRƯỚC khi Sảnh xong: Sảnh bị giữ lại mà đăng nhập vẫn đọc được ngay (các lệnh còn lại của máy em không bị chậm lại)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(T0 + 1000)
    const { env } = await dung()
    let nha!: () => void
    CT.__SANH_CHO = new Promise<void>((xong) => { nha = xong })
    const r = await worker.fetch(yeuCau('/hs/dang-nhap', { sbd: 'S1', matKhau: 'mk-s1', kemSanh: true }), env as never)
    const doc = r.body!.getReader()
    const giaiMa = new TextDecoder()
    let dem = ''
    // Đọc tới khi có dòng 1 — Sảnh CHƯA được nhả ⇒ nếu luồng đợi Sảnh thì phép kiểm này treo (hạn 3 giây).
    const docToiDongDau = (async () => { while (!dem.includes('\n')) { const { value, done } = await doc.read(); if (value) dem += giaiMa.decode(value, { stream: true }); if (done) break } })()
    const tre = new Promise<'treo'>((xong) => setTimeout(() => xong('treo'), 3000))
    expect(await Promise.race([docToiDongDau.then(() => 'doc-duoc'), tre])).toBe('doc-duoc')
    const dau = JSON.parse(dem.slice(0, dem.indexOf('\n'))) as Obj
    expect(dau).toMatchObject({ ok: true, sbd: 'S1' })
    expect(typeof dau.token).toBe('string')
    expect(dem.slice(dem.indexOf('\n') + 1)).toBe('') // chưa có gì của Sảnh
    // Nhả Sảnh ⇒ dòng 2 về, luồng đóng.
    nha()
    let con = dem.slice(dem.indexOf('\n') + 1)
    for (;;) { const { value, done } = await doc.read(); if (value) con += giaiMa.decode(value, { stream: true }); if (done) break }
    const sau = JSON.parse(con.trim()) as { sanh: Obj }
    expect(sau.sanh).toMatchObject({ ok: true, cheDo2: true })
  })

  it('KHÔNG xin kemSanh (máy em cũ, cổng khác, màn Game) ⇒ JSON một khối, không có khoá `sanh`, phản hồi y hệt cũ', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(T0 + 1000)
    const { env } = await dung()
    for (const them of [{}, { kemSanh: false }, { kemSanh: 'true' }, { kemSanh: 1 }]) {
      const r = await worker.fetch(yeuCau('/hs/dang-nhap', { sbd: 'S1', matKhau: 'mk-s1', ...them }), env as never)
      expect(r.headers.get('content-type'), JSON.stringify(them)).toMatch(/application\/json/)
      const dn = (await r.json()) as Obj
      expect(dn.ok, JSON.stringify(them)).toBe(true)
      expect('sanh' in dn, JSON.stringify(them)).toBe(false)
      expect(Object.keys(dn).sort()).toEqual(['chuaCoMatKhau', 'hoTen', 'lop', 'namSinh', 'nhipDeNghi', 'ok', 'sbd', 'serverNow', 'token'])
    }
  })

  it('sai mật khẩu / thiếu mật khẩu / chưa có mật khẩu / SBD lạ ⇒ JSON một khối với lời lỗi như cũ, KHÔNG token, KHÔNG Sảnh (không lộ gì cho người chưa xác thực)', async () => {
    const { env } = await dung()
    for (const [than, mong] of [
      [{ sbd: 'S1', matKhau: 'sai-roi', kemSanh: true }, { ok: false, error: 'Mật khẩu không chính xác' }],
      [{ sbd: 'S1', matKhau: '', kemSanh: true }, { ok: false, error: 'Vui lòng nhập mật khẩu' }],
      [{ sbd: 'S2', matKhau: '', kemSanh: true }, { ok: true, chuaCoMatKhau: true, sbd: 'S2' }],
      [{ sbd: 'KHONGCO', matKhau: 'x', kemSanh: true }, { ok: false }],
    ] as [Obj, Obj][]) {
      const r = await worker.fetch(yeuCau('/hs/dang-nhap', than), env as never)
      expect(r.headers.get('content-type'), JSON.stringify(than)).toMatch(/application\/json/)
      const j = (await r.json()) as Obj
      expect(j, JSON.stringify(than)).toMatchObject(mong)
      expect('sanh' in j || 'token' in j, JSON.stringify(than)).toBe(false)
    }
  })

  it('Sảnh lỗi ⇒ dòng 1 vẫn đủ (đăng nhập thành công), dòng 2 = {sanh:null} — máy em tự hỏi Sảnh như cũ', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(T0 + 1000)
    const { env } = await dung()
    CT.__SANH_HONG = true
    const dn = await goiLuong(env, { sbd: 'S1', matKhau: 'mk-s1', kemSanh: true })
    expect(dn.dong).toHaveLength(2)
    expect(dn.dong[0]).toMatchObject({ ok: true, chuaCoMatKhau: false, sbd: 'S1', hoTen: 'An' })
    expect(typeof dn.dong[0]!.token).toBe('string')
    expect(dn.dong[1]).toEqual({ sanh: null })
    delete CT.__SANH_HONG
    const sau = await goi(env, '/game-v2/hoa2-sanh', { token: dn.dong[0]!.token })
    expect(sau).toMatchObject({ ok: true, cheDo2: true })
  })

  it('em chưa ở Hoá 2.0 (cờ tắt) ⇒ dòng 2 = { ok:true, cheDo2:false } — máy em biết ngay, không hỏi lại', async () => {
    const { d, env } = await dung()
    d.sql.exec(`UPDATE cau_hinh SET gia_tri = '{"bat":false}' WHERE khoa = 'game_hoa_2'`)
    const dn = await goiLuong(env, { sbd: 'S1', matKhau: 'mk-s1', kemSanh: true })
    expect(dn.dong[0]!.ok).toBe(true)
    expect((dn.dong[1]!.sanh as Obj).ok).toBe(true)
    expect((dn.dong[1]!.sanh as Obj).cheDo2).toBe(false)
  })

  it('công tắc khẩn env.TAT_KEM_SANH ⇒ bỏ qua kemSanh: JSON một khối y hệt cũ (không cần sửa mã máy em)', async () => {
    const { env } = await dung()
    for (const gt of ['1', 'true', true]) {
      const r = await worker.fetch(yeuCau('/hs/dang-nhap', { sbd: 'S1', matKhau: 'mk-s1', kemSanh: true }), { ...env, TAT_KEM_SANH: gt } as never)
      expect(r.headers.get('content-type')).toMatch(/application\/json/)
      const dn = (await r.json()) as Obj
      expect(dn.ok).toBe(true)
      expect('sanh' in dn).toBe(false)
    }
    expect([undefined, null, '', '0', 'false', false].map((v) => kemSanhBiTat({ TAT_KEM_SANH: v }))).toEqual([false, false, false, false, false, false])
    expect(kemSanhBiTat({})).toBe(false)
    expect(kemSanhBiTat(undefined)).toBe(false)
    expect(['1', 'true', 'bat', true].map((v) => kemSanhBiTat({ TAT_KEM_SANH: v }))).toEqual([true, true, true, true])
  })
})

describe('sanhKemDangNhap / luongDangNhapKemSanh — không bao giờ ném lỗi, luôn đóng luồng', () => {
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
  it('hạn mặc định đủ rộng cho Sảnh lần đầu trong ngày nhưng hữu hạn', () => {
    expect(HAN_SANH_KEM_MS).toBeGreaterThanOrEqual(10_000)
    expect(HAN_SANH_KEM_MS).toBeLessThanOrEqual(30_000)
  })
  it('luồng: dòng 1 rồi dòng 2; laySanh ném lỗi ⇒ dòng 2 null; luồng luôn đóng', async () => {
    const doc = async (r: Response) => (await r.text()).split('\n').filter(Boolean).map((x) => JSON.parse(x) as Obj)
    expect(await doc(luongDangNhapKemSanh({ ok: true, a: 1 }, async () => ({ ok: true, b: 2 }), { 'x-th': '1' }))).toEqual([{ ok: true, a: 1 }, { sanh: { ok: true, b: 2 } }])
    expect(await doc(luongDangNhapKemSanh({ ok: true }, async () => { throw new Error('x') }, {}))).toEqual([{ ok: true }, { sanh: null }])
    expect(await doc(luongDangNhapKemSanh({ ok: true }, async () => null, {}))).toEqual([{ ok: true }, { sanh: null }])
    const r = luongDangNhapKemSanh({ ok: true }, async () => null, { 'access-control-allow-origin': '*' })
    expect(r.headers.get('content-type')).toBe(KIEU_LUONG_DANG_NHAP)
    expect(r.headers.get('access-control-allow-origin')).toBe('*')
    expect(r.headers.get('cache-control')).toMatch(/no-transform/)
  })
})
