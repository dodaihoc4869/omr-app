// @vitest-environment node
// CHỮA CÂU GỌN (thầy 25/10, server/src/chua-gon.ts): mở danh sách Tự sửa lỗi ⇒ đóng đợt em ĐÃ làm đúng lại qua luật tự làm; và đợt đã đóng mở lại được khi em sai lại.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That } from './_d1-that'
import { seedChua, Q } from './_chua-cau-sai-fixture'
import { danhSach, moDot } from '../server/src/chua-cau-sai'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaLuotDong } from '../server/src/chua-gon'

const T = Date.parse('2026-10-07T03:00:00Z')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T); xoaDemCaBaoVe(); xoaLuotDong() })
afterEach(() => { vi.useRealTimers(); xoaDemCaBaoVe() })

async function dung() {
  const d = taoD1That()
  const token = await seedChua(d.env)
  const r = await moDot(d.env, { token, qid: Q })
  expect(r.status).toBe(200)
  const dotId = (await r.json()).dotId as string
  return { ...d, token, dotId }
}
let k = 0
function lam(d: Awaited<ReturnType<typeof dung>>, qid: string, ketQua: 0 | 1, luc: string, khac: { assistance?: string; purpose?: string } = {}) {
  d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance,visibility,purpose) VALUES(?,'HS1',?,'game','G2',1,?,?,?,?,'released',?)")
    .run(`k${++k}`, qid, ketQua, luc, luc.slice(0, 10), khac.assistance ?? 'none', khac.purpose ?? 'repair')
}
const dot = (d: Awaited<ReturnType<typeof dung>>, id = d.dotId) =>
  d.sql.prepare('SELECT trang_thai_day, dong_luc FROM chua_loi_dot WHERE id=?').get(id) as { trang_thai_day: string; dong_luc: number | null }
async function ds(d: Awaited<ReturnType<typeof dung>>) {
  return (await (await danhSach(d.env, { token: d.token })).json()) as { ok: boolean; ds: { dotId: string; trangThai: string; saiLuc?: number }[]; dem: { xong: number; xongHomNay: number } }
}

describe('Chữa câu gọn — đóng đợt em đã làm đúng lại (luật tự làm)', () => {
  it('đúng câu gốc ở NGÀY KHÁC ngày sai, không gợi ý, không đọc lời giải ⇒ Đã tự sửa ngay khi mở danh sách; đếm "hôm nay"', async () => {
    const d = await dung()
    lam(d, Q, 1, '2026-10-06T02:00:00.000Z')
    const r = await ds(d)
    expect(r.ok).toBe(true)
    expect(dot(d).trang_thai_day).toBe('da_tu_sua')
    expect(dot(d).dong_luc).toBe(T)
    expect(r.ds.find((m) => m.dotId === d.dotId)?.trangThai).toBe('da_tu_sua')
    expect(r.dem.xongHomNay).toBe(1)
    expect(r.ds[0]!.saiLuc).toBeGreaterThan(0)
  })
  it('đúng câu gốc CÙNG NGÀY sai ⇒ chưa tính (có thể vừa thấy lời giải trong game)', async () => {
    const d = await dung()
    lam(d, Q, 1, '2026-09-29T05:00:00.000Z')
    await ds(d)
    expect(dot(d).trang_thai_day).not.toBe('da_tu_sua')
  })
  it('đúng BẢN KHÁC (~ss0) cùng ngày ⇒ tính', async () => {
    const d = await dung()
    lam(d, `${Q}~ss0`, 1, '2026-09-29T05:00:00.000Z')
    await ds(d)
    expect(dot(d).trang_thai_day).toBe('da_tu_sua')
  })
  it('đọc lời giải trong 12 giờ trước lượt đúng ⇒ chưa tính; gợi ý (assisted) ⇒ chưa tính', async () => {
    const d = await dung()
    d.sql.prepare("INSERT INTO loi_giai_hoi(sbd,qid,luc,co_ho_so,nguon) VALUES('HS1',?,'2026-10-06T00:00:00.000Z',0,'x')").run(Q)
    lam(d, Q, 1, '2026-10-06T02:00:00.000Z')
    lam(d, `${Q}~ss1`, 1, '2026-10-06T03:00:00.000Z', { assistance: 'assisted' })
    await ds(d)
    expect(dot(d).trang_thai_day).not.toBe('da_tu_sua')
  })
  it('sai lại SAU lượt đúng ⇒ chưa tính', async () => {
    const d = await dung()
    lam(d, Q, 1, '2026-10-05T02:00:00.000Z')
    lam(d, `${Q}~ss0`, 0, '2026-10-06T02:00:00.000Z')
    await ds(d)
    expect(dot(d).trang_thai_day).not.toBe('da_tu_sua')
  })
  it('câu khác tên gần giống (Q0, tiền tố) không bị tính nhầm vào họ câu', async () => {
    const d = await dung()
    lam(d, `${Q}0`, 1, '2026-10-06T02:00:00.000Z')
    await ds(d)
    expect(dot(d).trang_thai_day).not.toBe('da_tu_sua')
  })
  it('mỗi em tối đa một lần / 10 phút (danh sách mở liên tục không tốn thêm); qua 10 phút thì đóng tiếp', async () => {
    const d = await dung()
    await ds(d)
    lam(d, Q, 1, '2026-10-06T02:00:00.000Z')
    await ds(d)
    expect(dot(d).trang_thai_day).not.toBe('da_tu_sua')
    vi.setSystemTime(T + 11 * 60_000)
    await ds(d)
    expect(dot(d).trang_thai_day).toBe('da_tu_sua')
  })
  it('câu đóng tự động lỗi (D1 từ chối) ⇒ danh sách VẪN trả bình thường, không đóng gì', async () => {
    const d = await dung()
    lam(d, Q, 1, '2026-10-06T02:00:00.000Z')
    d.sql.exec('DROP TABLE loi_giai_hoi')
    const r = await ds(d)
    expect(r.ok).toBe(true)
    expect(r.ds.map((m) => m.dotId)).toContain(d.dotId)
    expect(dot(d).trang_thai_day).not.toBe('da_tu_sua')
  })
  it('đợt ĐÃ đóng, em sai lại sau lúc đóng ⇒ mở đợt MỚI (không kẹt "Đã tự sửa"); dòng cũ giữ nguyên', async () => {
    const d = await dung()
    lam(d, Q, 1, '2026-10-06T02:00:00.000Z')
    await ds(d)
    expect(dot(d).trang_thai_day).toBe('da_tu_sua')
    vi.setSystemTime(T + 86_400_000)
    lam(d, Q, 0, '2026-10-08T02:00:00.000Z')
    const r = await (await moDot(d.env, { token: d.token, qid: Q })).json()
    expect(r.ok).toBe(true)
    expect(r.dotId).not.toBe(d.dotId)
    expect(r.trangThai).not.toBe('da_tu_sua')
    expect(dot(d).trang_thai_day).toBe('da_tu_sua')
    // Mở lại lần nữa (chưa sai thêm) ⇒ vẫn đúng đợt mới, không đẻ thêm dòng.
    const r2 = await (await moDot(d.env, { token: d.token, qid: Q })).json()
    expect(r2.dotId).toBe(r.dotId)
    expect(d.dem('chua_loi_dot')).toBe(2)
  })
})
