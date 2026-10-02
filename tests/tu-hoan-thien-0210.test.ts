// @vitest-environment node
// Vòng học v2 — GĐ5 tự hoàn thiện hằng tuần: hiệu chỉnh luật theo tỉ lệ sai lại; câu nghi sai đáp án.
import { describe, expect, it } from 'vitest'
import { taoD1That, goiWorker } from './_d1-that'
import worker from '../server/src/index'
import type { Env } from '../server/src/kieu'
import { chayTuHoanThien, chuanThamSo, deXuatThamSo, docThamSo, luotKiemDuyTri, timCauNghi } from '../server/src/tu-hoan-thien'
import { THAM_SO_GOC, type LanLamLoi } from '../server/src/loi-hoc-luat'

const L = (ngay: string, kq: 0 | 1, o: Partial<LanLamLoi> = {}): LanLamLoi => ({ luc: `${ngay}T03:00:00.000Z`, ngayVn: ngay, ketQua: kq, coHoTro: false, songSinh: false, nguon: 'game', ...o })
const DONG = [L('2026-09-29', 0), L('2026-09-30', 1), L('2026-10-02', 1)] // đóng 02/10 (không song sinh)

describe('tự hoàn thiện', () => {
  it('lượt kiểm duy trì: lượt tự làm đầu tiên ≥ 14 ngày sau khi đóng', () => {
    expect(luotKiemDuyTri([...DONG, L('2026-10-10', 0)], [], false, THAM_SO_GOC)).toEqual({ kiem: 0, saiLai: 0 }) // mới 8 ngày
    expect(luotKiemDuyTri([...DONG, L('2026-10-16', 0)], [], false, THAM_SO_GOC)).toEqual({ kiem: 1, saiLai: 1 })
    expect(luotKiemDuyTri([...DONG, L('2026-10-17', 1)], [], false, THAM_SO_GOC)).toEqual({ kiem: 1, saiLai: 0 })
  })
  it('đề xuất: < 30 lượt kiểm giữ nguyên; sai lại > 20% ⇒ +1 ngày (tối đa 7); < 5% ⇒ −1 (tối thiểu 2)', () => {
    expect(deXuatThamSo(THAM_SO_GOC, 29, 29)).toBe(THAM_SO_GOC)
    expect(deXuatThamSo(THAM_SO_GOC, 100, 25).cachSaiCuoi).toBe(4)
    expect(deXuatThamSo({ ...THAM_SO_GOC, cachSaiCuoi: 7 }, 100, 90).cachSaiCuoi).toBe(7)
    expect(deXuatThamSo(THAM_SO_GOC, 100, 4).cachSaiCuoi).toBe(2)
    expect(deXuatThamSo(THAM_SO_GOC, 100, 10)).toBe(THAM_SO_GOC)
    expect(chuanThamSo('{"cachSaiCuoi":99}')).toEqual(THAM_SO_GOC)
  })
  it('câu nghi sai đáp án: em giỏi (top 30%, ≥20 lượt) sai ≥60% trên ≥5 lượt', () => {
    const theo = new Map<string, LanLamLoi[]>()
    for (let e = 0; e < 10; e++) {
      const gioi = e < 3
      for (let i = 0; i < 25; i++) theo.set(`E${e}|Q${i}`, [L('2026-09-30', gioi || i % 2 ? 1 : 0)])
      theo.set(`E${e}|NGHI`, [...Array(2)].map(() => L('2026-09-30', 0)))
    }
    const r = timCauNghi(theo, '2026-09-29')
    expect(r.map((x) => x.qid)).toEqual(['NGHI'])
    expect(r[0]).toMatchObject({ soLan: 6, soSai: 6, tyLeSai: 1 })
  })
  it('chạy D1: ghi nhật ký tuần một lần, đổi tham số khi đủ dữ liệu, kế hoạch đọc được; route thầy', async () => {
    const d = taoD1That(); const env = d.env as unknown as Env
    const ghi = d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn) VALUES(?,?,?,?,?,1,?,?,?)')
    for (let e = 0; e < 40; e++) for (const x of [...DONG, L('2026-10-17', e < 20 ? 0 : 1)]) ghi.run(`k${e}${x.luc}`, `E${e}`, 'Q1', 'game', 'M', x.ketQua, x.luc, x.ngayVn)
    const now = Date.parse('2026-10-19T17:01:00Z') // 00:01 thứ Ba VN? — hàm không tự kiểm thứ; cron mới kiểm
    const r = await chayTuHoanThien(env, now)
    expect(r).toMatchObject({ chay: true, kiem: 40, saiLai: 20 })
    expect((await docThamSo(env)).cachSaiCuoi).toBe(4)
    expect(await chayTuHoanThien(env, now)).toMatchObject({ chay: false })
    const tong = await goiWorker(worker, d.env, '/gv/v2/tong', {}, true)
    expect(tong).toMatchObject({ ok: true, thamSo: { cachSaiCuoi: 4 } })
    expect((await goiWorker(worker, d.env, '/gv/v2/tong', {})).ok).not.toBe(true)
  })
})
