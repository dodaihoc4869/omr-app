// @vitest-environment node
// ĐỆM + DỒN LƯỢT `/hs/ke-hoach-ngay` (Boss 21/09 ~21:05): lượt trùng dùng chung MỘT lần tính; đệm 20 giây theo em (mức mô-đun); em GHI ⇒ đệm bỏ ngay (số ở thẻ Hôm nay không đứng);
// lượt đệm KHÔNG ghi gì và KHÔNG lặp thông báo một lần; hai em không lẫn; lỗi không được đệm; thanThu đọc tươi.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { emCoGhi, keHoachCoDem, xoaDemKeHoach, HAN_DEM_KE_HOACH_MS } from '../server/src/dem-ke-hoach'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { gameToken } from '../server/src/game-v2-auth'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const T0 = Date.parse('2026-09-22T12:00:00+07:00')
beforeEach(() => { xoaDemKeHoach(); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0) })
afterEach(() => vi.useRealTimers())

function truong(): D1That {
  const d = taoD1That()
  for (const sbd of ['S1', 'S2']) d.sql.prepare("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,cap_nhat_luc) VALUES(?,?,'x')").run(sbd, `Em ${sbd}`)
  return d
}
const goi = (d: D1That, sbd: string) => goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd })
/** Đếm câu ghi (INSERT/UPDATE/DELETE) và câu đọc trong một đoạn chạy. */
function dem(d: D1That): { ghi: () => number; doc: () => number; xoa: () => void } {
  let g = 0, r = 0; const goc = d.env.DB.prepare.bind(d.env.DB)
  d.env.DB.prepare = ((q: string) => { if (/^\s*(INSERT|UPDATE|DELETE|REPLACE)/i.test(q)) g++; else r++; return goc(q) }) as typeof d.env.DB.prepare
  return { ghi: () => g, doc: () => r, xoa: () => { g = 0; r = 0 } }
}
const lam = (d: D1That, sbd: string, qid: string, gio: string) => ghiSuKien(d.env, [{ nguon: 'on_lai', maNguon: 'm', sbd, qid, lan: 1, ketQua: 1, luc: new Date(Date.parse(`2026-09-22T${gio}+07:00`)).toISOString() }])

describe('keHoachCoDem (hàm thuần)', () => {
  it('đệm còn hạn ⇒ không chạy lại; hết hạn ⇒ chạy lại; trả bản SAO (sửa bản trả không đổi đệm)', async () => {
    let n = 0; const dung = async () => ({ ok: true, so: ++n })
    const a = await keHoachCoDem('E1', dung, 1000); a.so = 999
    expect((await keHoachCoDem('E1', dung, 1000 + HAN_DEM_KE_HOACH_MS - 1)).so).toBe(1)
    expect((await keHoachCoDem('E1', dung, 1000 + HAN_DEM_KE_HOACH_MS)).so).toBe(2); expect(n).toBe(2)
  })
  it('phản hồi ok:false KHÔNG được đệm', async () => {
    let n = 0; const dung = async () => ({ ok: false, error: 'x', so: ++n })
    await keHoachCoDem('E1', dung, 1); await keHoachCoDem('E1', dung, 2); expect(n).toBe(2)
  })
  it('dồn lượt: nhiều lượt cùng em đang bay ⇒ MỘT lần tính; hai em khác nhau tính riêng; lượt sau khi xong không dính lượt cũ', async () => {
    let n = 0; const dung = async () => { const k = ++n; await new Promise((r) => setTimeout(r, 5)); return { ok: true, so: k } }
    vi.useRealTimers()
    const [a, b, c, d] = await Promise.all([keHoachCoDem('E1', dung), keHoachCoDem('E1', dung), keHoachCoDem('E1', dung), keHoachCoDem('E2', dung)])
    expect(n).toBe(2); expect([a.so, b.so, c.so].every((x) => x === a.so)).toBe(true); expect(d.so).not.toBe(a.so)
  })
  it('em GHI trong lúc một lượt đang tính: kết quả lượt ấy KHÔNG được đệm và lượt mới KHÔNG dùng chung với nó', async () => {
    let n = 0; let mo!: () => void
    const chan = new Promise<void>((r) => { mo = r })
    const dung = async () => { const k = ++n; if (k === 1) await chan; return { ok: true, so: k } }
    vi.useRealTimers()
    const cu = keHoachCoDem('E1', dung); await Promise.resolve()
    emCoGhi('E1')                                                        // em vừa nộp bài
    const moi = await keHoachCoDem('E1', dung); expect(moi.so).toBe(2) // lượt mới tính riêng
    mo(); expect((await cu).so).toBe(1)
    expect((await keHoachCoDem('E1', dung)).so).toBe(2); expect(n).toBe(2) // đệm giữ kết quả MỚI, không phải của lượt cũ
  })
})

describe('dựng kế hoạch: truy vấn độc lập chạy SONG SONG (hạ tải D1: một lượt chờ hàng đợi thay vì ~10)', () => {
  it('một lượt thật có nhiều truy vấn D1 cùng bay một lúc (đỉnh ≥ 6), và kết quả kế hoạch không đổi so với lượt tuần tự (cùng dữ liệu ⇒ cùng phản hồi)', async () => {
    vi.useRealTimers()
    const d = truong(); await lam(d, 'S1', 'Q1', '11:00:00')
    let dang = 0, dinh = 0; const goc = d.env.DB.prepare.bind(d.env.DB)
    d.env.DB.prepare = ((q: string) => {
      const st = goc(q) as any; const bind = st.bind.bind(st)
      st.bind = (...a: unknown[]) => { const s2 = bind(...a); const all = s2.all.bind(s2); s2.all = async () => { dang++; dinh = Math.max(dinh, dang); await new Promise((r) => setTimeout(r, 4)); try { return await all() } finally { dang-- } }; return s2 }
      return st
    }) as typeof d.env.DB.prepare
    const a = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' })
    expect(a.ok).toBe(true); expect(dinh).toBeGreaterThanOrEqual(6)
    // Cùng dữ liệu, D1 không chậm: phản hồi y hệt (sau khi bỏ đệm và dựng lại) — không mất khoá nào vì thứ tự đọc đổi
    xoaDemKeHoach(); const b = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' })
    const bo = (o: Record<string, any>) => { const { capNhatLuc: _1, serverNow: _2, ...r } = o; return r }
    expect(bo(b)).toEqual(bo(a)); expect(Object.keys(a).length).toBeGreaterThan(10)
  })
})

describe('/hs/ke-hoach-ngay qua Worker', () => {
  it('lượt hai trong 20 giây: KHÔNG ghi gì và ít truy vấn hơn hẳn; hết 20 giây tính lại', async () => {
    const d = truong(); const c = dem(d)
    const a = await goi(d, 'S1'); expect(a.ok).toBe(true); const docA = c.doc(); expect(c.ghi()).toBeGreaterThan(0) // lượt thật: dựng + lưu kế hoạch
    c.xoa(); const b = await goi(d, 'S1')
    expect(b.ok).toBe(true); expect(c.ghi()).toBe(0); expect(c.doc()).toBeLessThan(docA / 2)
    expect(b.tienBo).toEqual(a.tienBo); expect(b.ngay).toBe(a.ngay)
    vi.setSystemTime(T0 + HAN_DEM_KE_HOACH_MS + 1000); c.xoa(); await goi(d, 'S1'); expect(c.doc()).toBeGreaterThan(docA / 2)
  })
  it('em NỘP (ghi sổ) ⇒ lượt kế thấy SỐ MỚI ngay, không đứng số; em khác không bị ảnh hưởng', async () => {
    const d = truong()
    const a = await goi(d, 'S1'); const a2 = await goi(d, 'S2')
    expect(a.tienBo.daLamCau).toBe(0)
    await lam(d, 'S1', 'Q1', '11:00:00'); await lam(d, 'S1', 'Q2', '11:05:00')
    const b = await goi(d, 'S1'); expect(b.tienBo.daLamCau).toBe(2)             // số mới NGAY (đệm bị bỏ)
    const b2 = await goi(d, 'S2'); expect(b2.tienBo.daLamCau).toBe(0); expect(b2.sbd).toBe('S2'); expect(a2.sbd).toBe('S2')
    expect(b.sbd).toBe('S1')
  })
  it('thanThu luôn đọc TƯƠI ở lượt đệm (đổi thần thú / cấp hiện ngay), phần còn lại của kế hoạch từ đệm', async () => {
    const d = truong()
    const a = await goi(d, 'S1'); expect(a.thanThu ?? null).toBeNull()
    d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').run('S1', JSON.stringify({ pet: 'lua_phuong', choice: false, legacy: null, cap: 7, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z' }), 'x')
    const c = dem(d); const b = await goi(d, 'S1')
    expect(b.thanThu).not.toBeNull(); expect(JSON.stringify(b.thanThu)).toContain('7'); expect(c.ghi()).toBe(0)   // thẻ thú mới nhưng KHÔNG dựng lại kế hoạch
    expect(b.tienBo).toEqual(a.tienBo)
  })
  it('hai em không lẫn kế hoạch của nhau dù cùng lúc', async () => {
    const d = truong()
    const [a, b] = await Promise.all([goi(d, 'S1'), goi(d, 'S2')]); expect(a.sbd).toBe('S1'); expect(b.sbd).toBe('S2')
    const [a2, b2] = await Promise.all([goi(d, 'S1'), goi(d, 'S2')]); expect(a2.sbd).toBe('S1'); expect(b2.sbd).toBe('S2')
  })
  it('lỗi (em không có thật) không được đệm; lượt kế vẫn báo lỗi đúng', async () => {
    const d = taoD1That()
    expect((await goi(d, 'KHONGCO')).ok).toBe(false); expect((await goi(d, 'KHONGCO')).ok).toBe(false)
  })
  it('lệnh nộp qua Worker (canh-bao/xem của em, thoi-gian-hoc) xoá đệm: đổi số phút ⇒ ngân sách mới NGAY', async () => {
    const d = truong(); const token = await gameToken(d.env, 'S1')
    d.sql.prepare("UPDATE hoc_sinh SET mat_khau='mk' WHERE sbd='S1'").run()
    const tk = await gameToken(d.env, 'S1'); void token
    const a = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { token: tk })
    expect(a.ok).toBe(true)
    const doi = await goiWorker(worker, d.env, '/hs/thoi-gian-hoc', { token: tk, phut: 12 }); expect(doi.ok).toBe(true)
    const b = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { token: tk })
    expect(b.ok).toBe(true); expect(JSON.stringify(b.nganSach)).not.toBe(JSON.stringify(a.nganSach))
  })
})
