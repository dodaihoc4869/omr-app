// @vitest-environment node
// LƯỢT ĐÚNG THEO LOẠI LỖI trong LUẬT ĐÓNG LỖI CHUNG (khối B, đề xuất v5 mục 3; thầy 10/11 «Làm nốt mấy việc còn lại đi đẩy hết lên bản sống»):
// «Tính / đọc đề sai» ⇒ đúng 1 ngày (sau ngày sai) là đóng · «Chưa biết cách» ⇒ 2 ngày, lượt cuối cách lần sai ≥ 3 ngày (luật gốc) · «Hiểu nhầm» ⇒ 3 ngày.
// Song sinh giữ nguyên. «Tính» mà câu đã sai từ 2 lần ⇒ máy nâng thành «Chưa biết cách».
import { describe, expect, it } from 'vitest'
import { phatLaiLoi, thamSoTheoLyDo, THAM_SO_GOC, type LanLamLoi } from '../server/src/loi-hoc-luat'
import { lyDoHieuLuc } from '../server/src/ly-do-sai'

const lan = (ngay: string, ketQua: 0 | 1, songSinh = false): LanLamLoi => ({ luc: `${ngay}T03:00:00Z`, ngayVn: ngay, ketQua, coHoTro: false, songSinh, nguon: 'game' })
const sai1 = [lan('2026-11-01', 0)]
const tt = (ds: LanLamLoi[], ly?: 'tinh' | 'cach' | 'nham', coSS = true) => phatLaiLoi(ds, [], coSS, '2026-11-20', thamSoTheoLyDo(THAM_SO_GOC, ly)).trangThai

describe('thamSoTheoLyDo', () => {
  it('Tính: một ngày đúng (song sinh) sau ngày sai là đóng; đúng ngay trong ngày sai chưa tính', () => {
    expect(tt([...sai1, lan('2026-11-02', 1, true)], 'tinh')).toBe('dong')
    expect(tt([...sai1, lan('2026-11-01', 1, true)], 'tinh')).toBe('cho_kiem')
    // câu có song sinh mà chưa đúng bản song sinh ⇒ chưa đóng (giữ luật song sinh)
    expect(tt([...sai1, lan('2026-11-02', 1)], 'tinh')).toBe('cho_kiem')
  })
  it('Chưa biết cách = luật gốc (2 ngày, lượt cuối cách lần sai ≥ 3 ngày); không lý do cũng vậy', () => {
    const hai = [...sai1, lan('2026-11-02', 1, true), lan('2026-11-04', 1)]
    expect(tt(hai, 'cach')).toBe('dong')
    expect(tt(hai)).toBe('dong')
    expect(tt([...sai1, lan('2026-11-02', 1, true)], 'cach')).toBe('cho_kiem')
  })
  it('Hiểu nhầm: cần 3 ngày đúng', () => {
    const hai = [...sai1, lan('2026-11-02', 1, true), lan('2026-11-04', 1)]
    expect(tt(hai, 'nham')).toBe('cho_kiem')
    expect(tt([...hai, lan('2026-11-06', 1)], 'nham')).toBe('dong')
  })
  it('máy nâng: Tính mà đã sai từ 2 lần ⇒ Chưa biết cách; dấu Chưa chắc / không lý do ⇒ không loại', () => {
    expect(lyDoHieuLuc('tinh', 1)).toBe('tinh')
    expect(lyDoHieuLuc('tinh', 2)).toBe('cach')
    expect(lyDoHieuLuc('nham', 5)).toBe('nham')
    expect(lyDoHieuLuc('cc', 1)).toBeUndefined()
    expect(lyDoHieuLuc(undefined, 1)).toBeUndefined()
  })
})

import { lam, lucVn, taoKhoOmni, themChienDich } from './omni-3-ke-hoach-chung'
import { docHoSo2 } from '../server/src/srs2-d1'
import { SQL_GOI7 } from '../server/src/goi-bai-7-schema'

describe('hồ sơ học (docHoSo2) dùng lý do đã ghi', () => {
  async function kho() {
    const k = taoKhoOmni()
    for (const q of SQL_GOI7) k.d.sql.exec(q)
    const b1 = k.qids('DH-B1')
    themChienDich(k.d, { id: 'CD1', maDe: ['DH-B1'], qids: b1, sbd: ['S1'], hanNop: '2026-10-07', taoLuc: '2026-09-21T01:00:00.000Z', theLuc: 40 })
    const qid = b1[0]!
    await lam(k.env, 'S1', qid, lucVn('2026-09-29'), false)
    await lam(k.env, 'S1', qid, lucVn('2026-10-02'), true)
    await lam(k.env, 'S1', qid, lucVn('2026-10-03'), true)
    const ly = (l: string) => k.d.sql.prepare('INSERT OR REPLACE INTO goi_bai_7_ly_do(sbd,qid,ly,luc) VALUES(?,?,?,?)').run('S1', qid, l, 'x')
    return { k, qid, ly }
  }
  it('không lý do / Chưa biết cách ⇒ đóng sau 2 ngày đúng như cũ; Hiểu nhầm ⇒ còn chờ kiểm (cần 3 ngày); Tính ⇒ đóng ngay ngày đúng đầu', async () => {
    const { k, qid, ly } = await kho()
    expect((await docHoSo2(k.env, 'S1', '2026-10-05')).loiV2.get(qid)).toMatchObject({ trangThai: 'dong', dongNgay: '2026-10-03' })
    ly('cach')
    expect((await docHoSo2(k.env, 'S1', '2026-10-05')).loiV2.get(qid)).toMatchObject({ trangThai: 'dong', dongNgay: '2026-10-03' })
    ly('nham')
    expect((await docHoSo2(k.env, 'S1', '2026-10-05')).loiV2.get(qid)!.trangThai).toBe('cho_kiem')
    ly('tinh')
    expect((await docHoSo2(k.env, 'S1', '2026-10-05')).loiV2.get(qid)).toMatchObject({ trangThai: 'dong', dongNgay: '2026-10-02' })
  })
})
