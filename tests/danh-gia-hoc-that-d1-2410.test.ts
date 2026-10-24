// @vitest-environment node
// Xếp học sinh — phần D1 + lệnh (thầy 24/10: «Chốt build tất cả nhưng chưa đẩy»). Chạy trên D1 THẬT (SQLite, lược đồ repo).
// Ghim: mặc định CHẠY NGẦM (em/phụ huynh không thấy gì, không tự nhắc), bản chụp tuần, gán nhãn mù, ĐUỔI chỉ khi thầy xác nhận.
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { cronDanhGiaTuan, docCheDo, thuHaiCua, tinhLoEm } from '../server/src/danh-gia-hoc-that-d1'

type D = ReturnType<typeof taoD1That>
const BAY_GIO = Date.parse('2026-10-25T19:30:00Z') // thứ Hai 26/10 02:30 giờ VN
let dem = 0
const em = (d: D, sbd: string) => d.sql.prepare('INSERT INTO hoc_sinh (sbd, ho_ten, lop, cap_nhat_luc) VALUES (?,?,?,?)').run(sbd, `Em ${sbd}`, '12', 'x')
const dong = (d: D, sbd: string, qid: string, kq: number, giay: number, ngay: string, raw: Record<string, unknown> = {}) => {
  const luc = `${ngay}T0${dem % 9}:${String(dem % 60).padStart(2, '0')}:00Z`
  d.sql.prepare(`INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, raw_json) VALUES (?, ?, ?, 'game', 'P1', 1, ?, ?, ?, ?, ?)`)
    .run(`k${dem++}`, sbd, qid, kq, giay, luc, ngay, JSON.stringify({ doc: { t: 20, h: 0, p: 'I', dh: 1 }, ...raw }))
}
const NGAY = Array.from({ length: 14 }, (_, i) => new Date(Date.parse('2026-10-13T00:00:00Z') + i * 86400000).toISOString().slice(0, 10))

function duLieu() {
  const d = taoD1That()
  em(d, 'A1'); em(d, 'B1')
  // A1: làm thật — chậm, có nghĩ, đúng / sai bình thường, mỗi ngày.
  for (let i = 0; i < 42; i++) dong(d, 'A1', `Q${i}`, i % 3 ? 1 : 0, 40, NGAY[i % 14]!, { chon: 'ABCD'[i % 4] })
  // B1: bấm vội mà sai liên tục, cùng một đáp án.
  for (let i = 0; i < 42; i++) dong(d, 'B1', `R${i}`, i % 5 ? 0 : 1, 3, NGAY[2 * Math.floor(i / 6)]!, { chon: 'C' })
  return d
}

describe('xếp học sinh — D1', () => {
  it('thứ Hai của tuần', () => {
    expect(thuHaiCua('2026-10-26')).toBe('2026-10-26')
    expect(thuHaiCua('2026-11-02')).toBe('2026-11-02')
    expect(thuHaiCua('2026-10-30')).toBe('2026-10-26')
    expect(thuHaiCua('2026-11-01')).toBe('2026-10-26')
  })
  it('tính một lô: em làm thật ⇒ Học thật; em bấm vội mà sai, bấm lặp ⇒ Đối phó', async () => {
    const d = duLieu()
    const ds = await tinhLoEm(d.env as unknown as Env, ['A1', 'B1'], BAY_GIO)
    const a = ds.find((x) => x.sbd === 'A1')!, b = ds.find((x) => x.sbd === 'B1')!
    expect(a.bac.bac).toBe(1)
    expect(b.bac.bac).toBe(3)
    expect(b.kq.phat.map((p) => p.ma)).toEqual(expect.arrayContaining(['nhanMaSai', 'bamLap']))
  })
  it('mặc định CHẠY NGẦM: cron lưu bản chụp tuần nhưng KHÔNG tự nhắc em; em/phụ huynh không thấy gì', async () => {
    const d = duLieu()
    const env = d.env as unknown as Env
    expect(await docCheDo(env)).toBe('ngam')
    for (let i = 0; i < 5; i++) await cronDanhGiaTuan(env, BAY_GIO + i * 60_000)
    const chup = d.sql.prepare('SELECT sbd, bac FROM danh_gia_em_tuan ORDER BY sbd').all() as { sbd: string; bac: number }[]
    expect(chup).toEqual([{ sbd: 'A1', bac: 1 }, { sbd: 'B1', bac: 3 }])
    expect((d.sql.prepare('SELECT COUNT(*) AS n FROM can_thiep_em').get() as { n: number }).n).toBe(0)
    const lop = await goiWorker(worker, env, '/gv/danh-gia/lop', {}, true)
    expect(lop.cheDo).toBe('ngam')
    expect(lop.em.map((x: { sbd: string; tenBac: string }) => [x.sbd, x.tenBac])).toEqual(expect.arrayContaining([['A1', 'Học thật'], ['B1', 'Đối phó']]))
  })
  it('ngoài 01:00–06:00 giờ VN thứ Hai ⇒ cron không truy vấn gì', async () => {
    const d = duLieu()
    const r = await cronDanhGiaTuan(d.env as unknown as Env, Date.parse('2026-10-27T05:00:00Z'))
    expect(r).toMatchObject({ chay: false, lyDo: 'ngoai_gio' })
  })
  it('BẬT: em Đối phó tuần đầu ⇒ máy nhắc em (một lần mỗi tuần); em xem ⇒ ghi «đã xem»; nhãn công khai chỉ Học thật/Đối phó', async () => {
    const d = duLieu()
    const env = d.env as unknown as Env
    await goiWorker(worker, env, '/gv/danh-gia/che-do', { cheDo: 'bat' }, true)
    for (let i = 0; i < 6; i++) await cronDanhGiaTuan(env, BAY_GIO + i * 60_000)
    const ct = d.sql.prepare('SELECT sbd, loai FROM can_thiep_em').all()
    expect(ct).toEqual([{ sbd: 'B1', loai: 'nhac_em' }])
  })
  it('thầy ghi can thiệp; ĐUỔI chỉ vào nhật ký khi thầy bấm «Xác nhận cho nghỉ»; loại lạ bị từ chối; không có mã bí mật bị chặn', async () => {
    const d = duLieu()
    const env = d.env as unknown as Env
    expect((await goiWorker(worker, env, '/gv/danh-gia/can-thiep', { sbd: 'B1', loai: 'xoa_em' }, true)).ok).toBe(false)
    expect((await goiWorker(worker, env, '/gv/danh-gia/can-thiep', { sbd: 'B1', loai: 'xac_nhan_nghi' }, false)).ok).toBe(false)
    expect((await goiWorker(worker, env, '/gv/danh-gia/can-thiep', { sbd: 'B1', loai: 'xac_nhan_nghi', noiDung: 'Thầy đã gọi phụ huynh' }, true)).ok).toBe(true)
    const em1 = await goiWorker(worker, env, '/gv/danh-gia/em', { sbd: 'B1' }, true)
    expect(em1.canThiep[0]).toMatchObject({ loai: 'xac_nhan_nghi', taoBoi: 'thay' })
    expect(em1.hienTai.bac).toBe(3)
  })
  it('nhãn mù: gán / đọc; chưa đủ 30 em thì không so với máy (tránh thầy bị kéo theo)', async () => {
    const d = duLieu()
    const env = d.env as unknown as Env
    await goiWorker(worker, env, '/gv/danh-gia/nhan-mu', { sbd: 'A1', nhan: 'hoc_that' }, true)
    const r = await goiWorker(worker, env, '/gv/danh-gia/nhan-mu', { soSanh: true }, true)
    expect(r.nhan).toEqual([{ sbd: 'A1', nhan: 'hoc_that' }])
    expect(r.soSanh).toBeUndefined()
  })
})
