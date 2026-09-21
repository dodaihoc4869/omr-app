// @vitest-environment node
// Sửa lỗi: trang chủ học sinh hiện sai thần thú ("Hoả Long cấp 1" luôn) vì client đọc bảng V1 `than_thu` mà lấy trường V2.
// Thần thú thật nằm ở `game_v2_profile`; `/hs/ke-hoach-ngay` trả thêm `thanThu` đọc TƯƠI mỗi lần gọi.
import { describe, it, expect } from 'vitest'
import worker from '../server/src/index'
import { docThanThu, lapVaLuuKeHoach } from '../server/src/ke-hoach-ngay-d1'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const themHs = (d: D1That, sbd: string) => d.sql.prepare("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,cap_nhat_luc) VALUES(?,'x','x')").run(sbd)
const hoSo = (d: D1That, sbd: string, json: Record<string, unknown> | string) =>
  d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').run(sbd, typeof json === 'string' ? json : JSON.stringify(json), 'x')
const goi = (d: D1That, sbd: string) => goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd })

describe('/hs/ke-hoach-ngay trả thêm thanThu (thần thú THẬT từ game_v2_profile)', () => {
  it('có hồ sơ đã chọn thần thú → đúng pet, cap, nickname', async () => {
    const d = taoD1That()
    themHs(d, 'S1')
    hoSo(d, 'S1', { pet: 'hoa_long', choice: false, cap: 7, nickname: 'Bé Lửa', exp: 3 })
    const r = await goi(d, 'S1')
    expect(r.ok).toBe(true)
    expect(r.thanThu).toEqual({ pet: 'hoa_long', cap: 7, nickname: 'Bé Lửa' })
  })

  it('em CHƯA chọn thần thú (choice=true, pet chỉ là dat_quy điền tạm) → null, không bịa', async () => {
    const d = taoD1That()
    themHs(d, 'S1')
    hoSo(d, 'S1', { pet: 'dat_quy', choice: true, cap: 1 })
    expect((await goi(d, 'S1')).thanThu).toBeNull()
  })

  it('chưa có hồ sơ game → null (không phải hoa_long)', async () => {
    const d = taoD1That()
    themHs(d, 'S1')
    const r = await goi(d, 'S1')
    expect(r.ok).toBe(true)
    expect(r.thanThu).toBeNull()
    expect(JSON.stringify(r)).not.toContain('hoa_long')
  })

  it('cap rác được kẹp về 1..120', async () => {
    const d = taoD1That()
    const thu = async (sbd: string, cap: unknown) => {
      themHs(d, sbd)
      hoSo(d, sbd, { pet: 'thuy_long', choice: false, cap })
      return (await goi(d, sbd)).thanThu
    }
    expect((await thu('A1', 999)).cap).toBe(120)
    expect((await thu('A2', -5)).cap).toBe(1)
    expect((await thu('A3', 0)).cap).toBe(1)
    expect((await thu('A4', 'abc')).cap).toBe(1)
    expect((await thu('A5', null)).cap).toBe(1)
    expect((await thu('A6', 12.7)).cap).toBe(13)
    expect((await thu('A7', 120)).cap).toBe(120)
  })

  it('nickname rỗng, khoảng trắng hoặc thiếu → null; pet không phải chữ → null cả thanThu', async () => {
    const d = taoD1That()
    themHs(d, 'B1'); hoSo(d, 'B1', { pet: 'hoa_long', choice: false, cap: 2, nickname: '   ' })
    themHs(d, 'B2'); hoSo(d, 'B2', { pet: 'hoa_long', choice: false, cap: 2 })
    themHs(d, 'B3'); hoSo(d, 'B3', { pet: 'hoa_long', choice: false, cap: 2, nickname: ' Tí ' })
    themHs(d, 'B4'); hoSo(d, 'B4', { pet: { x: 1 }, choice: false, cap: 2 })
    themHs(d, 'B5'); hoSo(d, 'B5', { pet: '', choice: false, cap: 2 })
    expect((await goi(d, 'B1')).thanThu).toEqual({ pet: 'hoa_long', cap: 2, nickname: null })
    expect((await goi(d, 'B2')).thanThu).toEqual({ pet: 'hoa_long', cap: 2, nickname: null })
    expect((await goi(d, 'B3')).thanThu).toEqual({ pet: 'hoa_long', cap: 2, nickname: 'Tí' })
    expect((await goi(d, 'B4')).thanThu).toBeNull()
    expect((await goi(d, 'B5')).thanThu).toBeNull()
  })

  it('JSON hồ sơ hỏng không làm sập kế hoạch: thanThu = null, phần còn lại vẫn có', async () => {
    const d = taoD1That()
    themHs(d, 'S1')
    hoSo(d, 'S1', '{không phải json')
    const r = await goi(d, 'S1')
    expect(r.ok).toBe(true)
    expect(r.thanThu).toBeNull()
    expect(Array.isArray(r.viec)).toBe(true)
  })

  it('không đổi gì khác trong phản hồi và KHÔNG lưu vào ke_hoach_ngay', async () => {
    const d = taoD1That()
    themHs(d, 'S1')
    hoSo(d, 'S1', { pet: 'hoa_long', choice: false, cap: 5, nickname: 'Bé Lửa' })
    const r = await goi(d, 'S1')
    const { thanThu: _t, ...con } = r
    const goc = (await lapVaLuuKeHoach(d.env, ['S1'], Date.now(), { luu: false })).get('S1')!
    // `serverNow` do route `/hs/*` thêm sẵn từ trước; `doanMo` do route thêm từ cb80f0d (cờ mở game Đoàn, không thuộc kế hoạch); `no` + `veDich` do route thêm từ W3b (Dồn về đích: đọc-chỉ `docVeDichCuaEm`,
    // chỉ-thêm, KHÔNG lưu vào ke_hoach_ngay — sửa CÓ CHỦ Ý 21/09); đều không phải của lệnh này.
    expect(Object.keys(con).sort()).toEqual(['doanMo', 'no', 'ok', 'serverNow', 'veDich', ...Object.keys(goc)].sort())
    expect(d.chup('ke_hoach_ngay')).not.toMatch(/thanThu|hoa_long|Bé Lửa/)
    // Đổi thần thú rồi gọi lại → thấy ngay (đọc tươi, không cache trong kế hoạch).
    d.sql.prepare("UPDATE game_v2_profile SET json = json_set(json, '$.pet', 'thuy_long', '$.cap', 9) WHERE sbd = 'S1'").run()
    expect((await goi(d, 'S1')).thanThu).toEqual({ pet: 'thuy_long', cap: 9, nickname: 'Bé Lửa' })
  })

  it('thêm đúng MỘT truy vấn', async () => {
    const d = taoD1That()
    hoSo(d, 'S1', { pet: 'hoa_long', choice: false, cap: 5 })
    const truoc = d.soLenh.prepare
    await docThanThu(d.env, 'S1')
    expect(d.soLenh.prepare - truoc).toBe(1)
  })

  it('bảng game_v2_profile chưa có (migration chưa chạy) → null, kế hoạch vẫn ra', async () => {
    const d = taoD1That()
    themHs(d, 'S1')
    d.sql.exec('DROP TABLE game_v2_profile')
    const r = await goi(d, 'S1')
    expect(r.ok).toBe(true)
    expect(r.thanThu).toBeNull()
  })

  it('SBD không có thật vẫn bị từ chối, không có thanThu', async () => {
    const d = taoD1That()
    const r = await goi(d, '00000000')
    expect(r).toMatchObject({ ok: false, error: 'Không tìm thấy học sinh' })
    expect('thanThu' in r).toBe(false)
  })
})
