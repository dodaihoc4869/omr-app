// @vitest-environment node
// MỞ CÂU / KIỂM TRA CỦA SỬA LỖI TỨC THÌ (thầy 29/10, video 08:25: «Đang mở câu…» ~3,3 s, «Đang kiểm tra…» ~1,3 s): đệm isolate cho câu / bản làm lại / ca thi đang mở,
// đọc song song với xác thực, không đọc thừa. Khoá: bớt lượt D1 thật, và KHÔNG nới an toàn (đề bảo vệ ca thi luôn xét lại, lỗi thoáng qua không bị nhớ, token sai không đọc gì).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That } from './_d1-that'
import { seedChua, Q } from './_chua-cau-sai-fixture'
import { moDot } from '../server/src/chua-cau-sai'
import { gonMo, gonNop } from '../server/src/chua-gon-lenh'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaMoiDem } from '../server/src/dem-chung'

// Đề bảo vệ ca thi: mặc định đọc thật; ca thử đặt `baoVe` để giả «thầy vừa mở ca có câu này».
let baoVe: Set<string> | null = null
let baoVeLoi = false
vi.mock('../server/src/game-v2-bank', async (goc) => {
  const m = await goc<typeof import('../server/src/game-v2-bank')>()
  return { ...m, protectedQuestions: async (env: Parameters<typeof m.protectedQuestions>[0]) => { if (baoVeLoi) throw new Error('D1 lỗi'); return baoVe ?? m.protectedQuestions(env) } }
})

const T = Date.parse('2026-10-07T03:00:00Z')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T); baoVe = null; baoVeLoi = false; xoaMoiDem(); xoaDemCaBaoVe() })
afterEach(() => { vi.useRealTimers(); xoaDemCaBaoVe() })

async function dung() {
  const d = taoD1That()
  const token = await seedChua(d.env)
  const dotId = (await (await moDot(d.env, { token, qid: Q })).json()).dotId as string
  return { ...d, token, dotId }
}
type D = Awaited<ReturnType<typeof dung>>
const mo = (d: D) => gonMo(d.env, { token: d.token, dotId: d.dotId }).then(async (r) => ({ status: r.status, j: (await r.json()) as Record<string, any> }))
let n = 0
const nop = (d: D, traLoi: string, ban = Q) => gonNop(d.env, { token: d.token, dotId: d.dotId, ban, traLoi, khoa: `k${++n}` }).then(async (r) => ({ status: r.status, j: (await r.json()) as Record<string, any> }))
/** Đếm câu lệnh D1 chạy trong `f` theo chuỗi SQL chứa `mau` (đếm cả lệnh đơn lẫn trong lô). */
async function dem<T>(d: D, f: () => Promise<T>, ...mau: string[]): Promise<{ kq: T; tong: number; theo: number[] }> {
  const db = d.env.DB as unknown as { prepare: (s: string) => unknown }
  const goc = db.prepare.bind(db)
  const sql: string[] = []
  db.prepare = (s: string) => { sql.push(s); return goc(s) }
  try { const kq = await f(); return { kq, tong: sql.length, theo: mau.map((m) => sql.filter((s) => s.includes(m)).length) } } finally { db.prepare = goc }
}

describe('đệm câu / bản làm lại (gon-mo, gon-nop)', () => {
  it('mở câu lần hai (cùng câu) đọc ÍT câu lệnh D1 hơn hẳn lần đầu: không đọc lại nội dung câu / bản làm lại / học liệu', async () => {
    const d = await dung()
    const a = await dem(d, () => mo(d), 'cau_snapshot', 'cau_bo_tro', 'chua_loi_hoc_lieu')
    expect(a.kq.status).toBe(200)
    const b = await dem(d, () => mo(d), 'cau_snapshot', 'cau_bo_tro', 'chua_loi_hoc_lieu')
    expect(b.kq.status).toBe(200)
    expect(b.kq.j.de).toEqual(a.kq.j.de)
    expect(b.tong).toBeLessThan(a.tong)
    expect(b.theo).toEqual([0, 0, 0]) // không đọc lại cờ snapshot (đầu `layCauChoEm`), bộ trợ, học liệu
  })
  it('nộp câu: đúng / sai vẫn chấm đúng từ bản nhớ; lần nộp thứ hai không đọc lại câu', async () => {
    const d = await dung()
    await mo(d) // nạp bản nhớ
    const sai = await dem(d, () => nop(d, '40'), 'cau_snapshot', 'cau_bo_tro')
    expect(sai.kq.j).toMatchObject({ ok: true, dung: false, ket: 'goi_y' })
    expect(sai.theo).toEqual([0, 0])
    const dung2 = await nop(d, '24')
    expect(dung2.j).toMatchObject({ ok: true, dung: true })
  })
  it('lỗi đọc thoáng qua (bảng bộ trợ) ⇒ vẫn mở được bằng câu gốc nhưng KHÔNG nhớ danh sách rút gọn: lần sau đọc lại', async () => {
    const d = await dung()
    const db = d.env.DB as unknown as { prepare: (s: string) => unknown }
    const goc = db.prepare.bind(db)
    db.prepare = (s: string) => { if (s.includes('cau_bo_tro')) throw new Error('D1 mất kết nối'); return goc(s) }
    const a = await mo(d)
    db.prepare = goc
    expect(a.status).toBe(200)
    expect(a.j.ban).toBe(Q)
    const b = await dem(d, () => mo(d), 'cau_bo_tro')
    expect(b.theo[0]).toBeGreaterThan(0) // lần này đọc thật (lần trước lỗi nên không nhớ)
    const c = await dem(d, () => mo(d), 'cau_bo_tro')
    expect(c.theo[0]).toBe(0) // lần đọc thành công đã được nhớ
  })
})

describe('an toàn: đề bảo vệ ca thi luôn được xét lại, kể cả khi dùng bản nhớ', () => {
  it('câu vừa vào đề thi đang bảo vệ ⇒ mở / nộp từ bản nhớ cũng bị chặn (không phục vụ câu của ca thi)', async () => {
    const d = await dung()
    expect((await mo(d)).status).toBe(200) // nạp bản nhớ
    baoVe = new Set([Q])
    const a = await mo(d)
    expect(a.status).toBe(404)
    expect(a.j).toMatchObject({ ok: false, ma: 'KHONG_MO_DUOC_CAU' })
    const b = await nop(d, '24')
    expect(b.status).toBe(404)
    baoVe = null
    expect((await mo(d)).status).toBe(200)
  })
  it('không kiểm được đề bảo vệ ⇒ đóng cửa (không dùng bản nhớ)', async () => {
    const d = await dung()
    expect((await mo(d)).status).toBe(200)
    baoVeLoi = true
    const a = await mo(d)
    expect(a.status).toBe(404)
    expect(a.j).toMatchObject({ ok: false, ma: 'KHONG_MO_DUOC_CAU' })
    baoVeLoi = false
    expect((await mo(d)).status).toBe(200)
  })
})

describe('«em có ca thi đang mở không» (quyen) nhớ 8 giây', () => {
  const moCa = (d: D) => d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,lop,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc) VALUES('CA','Ca','12','mo',?,?,60,'thi','khong','','x')")
    .run(new Date(T - 60000).toISOString(), new Date(T + 3600000).toISOString())
  it('đọc D1 một lần cho nhiều lệnh liên tiếp; thầy mở ca (isolate này ghi bảng ca ⇒ xoá bản nhớ) ⇒ chặn ngay', async () => {
    const d = await dung()
    const a = await dem(d, () => mo(d), 'FROM ca c WHERE c.trang_thai')
    const b = await dem(d, () => mo(d), 'FROM ca c WHERE c.trang_thai')
    expect(a.theo[0] + b.theo[0]).toBeLessThanOrEqual(1) // lần đầu có thể đã nhớ từ lúc mo-dot; lần hai chắc chắn không đọc
    expect(b.theo[0]).toBe(0)
    moCa(d); xoaDemCaBaoVe() // như đường ghi bảng ca thật
    const c = await mo(d)
    expect(c.status).toBe(403)
    expect(c.j.ma).toBe('DANG_KIEM_TRA')
  })
  it('ca mở bằng đường khác (isolate khác): chậm nhất 8 giây sau vẫn chặn', async () => {
    const d = await dung()
    await mo(d)
    moCa(d) // không xoá bản nhớ
    expect((await mo(d)).status).toBe(200) // trong 8 giây còn dùng bản nhớ «không có ca»
    vi.setSystemTime(T + 9_000)
    const c = await mo(d)
    expect(c.status).toBe(403)
    expect(c.j.ma).toBe('DANG_KIEM_TRA')
  })
})

describe('đọc song song với xác thực', () => {
  it('token hỏng ⇒ 401 và KHÔNG đọc dữ liệu nào của em', async () => {
    const d = await dung()
    const a = await dem(d, () => gonNop(d.env, { token: 'sai.sai', dotId: d.dotId, ban: Q, traLoi: '24', khoa: 'k-x' }).then((r) => r.status))
    expect(a.kq).toBe(401)
    expect(a.tong).toBe(0)
    const b = await dem(d, () => gonMo(d.env, { token: 'sai.sai', dotId: d.dotId }).then((r) => r.status))
    expect(b.kq).toBe(401)
    expect(b.tong).toBe(0)
  })
  it('thiếu tham số / chưa trả lời ⇒ lời báo cũ (sau xác thực), không đọc đợt', async () => {
    const d = await dung()
    expect((await gonNop(d.env, { token: d.token, dotId: d.dotId, ban: Q, traLoi: '', khoa: 'k1' })).status).toBe(400)
    expect(await gonNop(d.env, { token: d.token, dotId: d.dotId, ban: Q, traLoi: '', khoa: 'k1' }).then((r) => r.json())).toMatchObject({ ma: 'CHUA_TRA_LOI' })
    expect(await gonNop(d.env, { token: d.token, dotId: '', ban: Q, traLoi: '24', khoa: 'k1' }).then((r) => r.json())).toMatchObject({ ma: 'THIEU_THAM_SO' })
    expect(await gonMo(d.env, { token: d.token, dotId: '' }).then((r) => r.json())).toMatchObject({ ma: 'THIEU_THAM_SO' })
  })
  it('mo-dot kèm gon-mo: không chạy quyen lần hai (truyền SBD đã kiểm)', async () => {
    const d = await dung()
    const sbd = 'HS1'
    const a = await dem(d, () => gonMo(d.env, { token: d.token, dotId: d.dotId }, sbd).then((r) => r.status), 'FROM ca c WHERE c.trang_thai', 'SELECT mat_khau FROM hoc_sinh')
    expect(a.kq).toBe(200)
    expect(a.theo).toEqual([0, 0])
  })
})
