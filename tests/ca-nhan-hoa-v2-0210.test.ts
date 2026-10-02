// @vitest-environment node
// Cá nhân hoá sâu v2 (thầy 02/10: "khắc phục luôn giới hạn này"): ngưỡng luật riêng, tốc độ đọc riêng, nhịp học riêng, kênh riêng.
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { nguongLuot, onVaoDaoRieng, thamSoRieng, tiLeNoRieng, docThamSoEm } from '../server/src/ca-nhan-hoa-v2'
import { THAM_SO_GOC, type LanLamLoi } from '../server/src/loi-hoc-luat'
import { lapKeHoachNgay, type CauSrs, type TrangThaiCau } from '../server/src/srs2-loi'
import { chayTuHoanThien } from '../server/src/tu-hoan-thien'
import { docHoSo2 } from '../server/src/srs2-d1'

describe('hàm thuần', () => {
  it('ngưỡng luật riêng: em mới ≈ mức chung; em hay quên ⇒ cách xa hơn, kiểm sớm hơn; em nhớ tốt ⇒ giãn ra', () => {
    expect(thamSoRieng(0, 0, 0.15).ts).toMatchObject({ cachSaiCuoi: 3, mocDuyTri: [14, 30] })
    const quen = thamSoRieng(20, 12, 0.15).ts
    expect(quen.cachSaiCuoi).toBeGreaterThan(3); expect(quen.mocDuyTri[0]).toBeLessThan(14)
    const nho = thamSoRieng(30, 0, 0.15).ts
    expect(nho.cachSaiCuoi).toBeLessThanOrEqual(3); expect(nho.mocDuyTri[0]).toBeGreaterThan(14)
    for (const t of [quen, nho]) { expect(t.cachSaiCuoi).toBeGreaterThanOrEqual(2); expect(t.cachSaiCuoi).toBeLessThanOrEqual(7); expect(t.mocDuyTri[0]).toBeGreaterThanOrEqual(7); expect(t.mocDuyTri[0]).toBeLessThanOrEqual(28) }
  })
  it('ngưỡng lướt theo tốc độ đọc của em: < 5 lần đo ⇒ 5 giây; em đọc nhanh ⇒ thấp hơn, không dưới 2', () => {
    expect(nguongLuot([{ giay: 10, soBuoc: 5 }])).toBe(5)
    expect(nguongLuot(Array(8).fill({ giay: 40, soBuoc: 5 }))).toBe(2.8)
    expect(nguongLuot(Array(8).fill({ giay: 10, soBuoc: 5 }))).toBe(2)
    expect(nguongLuot(Array(8).fill({ giay: 200, soBuoc: 4 }))).toBe(5)
  })
  it('nhịp học: nợ đến hạn nhiều so với số câu em làm/ngày ⇒ trần nợ cao hơn; kênh: không mở Đoàn mà chơi Đảo ⇒ ôn vào Đảo', () => {
    expect(tiLeNoRieng(3, 10)).toBe(0.5); expect(tiLeNoRieng(15, 10)).toBe(0.65); expect(tiLeNoRieng(30, 10)).toBe(0.8); expect(tiLeNoRieng(12, 0)).toBe(0.8)
    expect(onVaoDaoRieng(5, 0)).toBe(true); expect(onVaoDaoRieng(5, 1)).toBe(false); expect(onVaoDaoRieng(0, 0)).toBe(false)
  })
  it('lập kế hoạch: onVaoDao ⇒ câu ôn Phần I/III vào Đảo; tiLeNo ⇒ nhiều nợ hơn khi còn câu mới', () => {
    const cau: CauSrs[] = []; const tt = new Map<string, TrangThaiCau>()
    const t = (qid: string, laMoi: boolean): TrangThaiCau => ({ qid, laMoi, cc: 0, lanSai: 1, thanhThao: false, henOn: laMoi ? null : '2026-10-01', ngayDungCuoi: null, lanCuoiDung: false, catTia: false, lichSu: laMoi ? [] : [{ ngay: '2026-09-30', dung: false, coGoiY: false }] })
    for (let i = 0; i < 20; i++) { const q = `N${i}`; cau.push({ qid: q, phan: 'I', mucDo: 'NB', dang: 'D', nguon: 'no_cu' }); tt.set(q, t(q, false)) }
    for (let i = 0; i < 30; i++) { const q = `M${i}`; cau.push({ qid: q, phan: 'II', mucDo: 'NB', dang: 'D', nguon: 'chien_dich' }); tt.set(q, t(q, true)) }
    const tc = { homNay: '2026-10-01', hanNop: '2026-10-20', tranNgay: 20 }
    const goc = lapKeHoachNgay(cau, tt, tc)
    expect(goc.doan.length).toBe(10); expect(goc.dao.some((q) => q.startsWith('N'))).toBe(false)
    const rieng = lapKeHoachNgay(cau, tt, { ...tc, onVaoDao: true, tiLeNo: 0.8 })
    expect(rieng.doan).toEqual([]); expect(rieng.dao.filter((q) => q.startsWith('N')).length).toBe(16)
  })
})

describe('D1: tuần tính ngưỡng riêng ⇒ kế hoạch dùng ngưỡng của em', () => {
  it('em hay quên được ngưỡng riêng; luật đóng lỗi của em dùng ngưỡng đó', async () => {
    const d = taoD1That(); const env = d.env as unknown as Env
    const ghi = d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn) VALUES(?,?,?,?,?,1,?,?,?)')
    const L = (n: string, kq: 0 | 1): LanLamLoi => ({ luc: `${n}T03:00:00.000Z`, ngayVn: n, ketQua: kq, coHoTro: false, songSinh: false, nguon: 'game' })
    // E1: 10 câu, mỗi câu đóng rồi SAI LẠI ở lượt kiểm 14 ngày ⇒ hay quên.
    for (let i = 0; i < 10; i++) for (const x of [L('2026-09-29', 0), L('2026-09-30', 1), L('2026-10-02', 1), L('2026-10-17', 0)]) ghi.run(`a${i}${x.luc}`, 'E1', `Q${i}`, 'game', 'M', x.ketQua, x.luc, x.ngayVn)
    await chayTuHoanThien(env, Date.parse('2026-10-19T17:01:00Z'))
    const ts = await docThamSoEm(env, 'E1')
    expect(ts!.cachSaiCuoi).toBeGreaterThan(THAM_SO_GOC.cachSaiCuoi)
    expect(ts!.mocDuyTri[0]).toBeLessThan(14)
    expect(await docThamSoEm(env, 'E2')).toBeNull()
  })

  it('docHoSo2 dùng ngưỡng của em: cùng lịch sử, em ngưỡng chung ĐÓNG lỗi, em cần cách 5 ngày còn CHỜ KIỂM', async () => {
    const d = taoD1That(); const env = d.env as unknown as Env
    const cau = (qid: string) => JSON.stringify({ qid, maDe: 'DE9', version: 'v1', group: `g-${qid}`, phan: 'I', text: qid, choices: ['a', 'b', 'c', 'd'], hinhAnh: [], dang: 'D1', tenDang: 'D', mucDo: 'TH', correct: 'B', reviewed: true, solution: {} })
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE9', 'X1', 'v1', 'g-X1', 'D1', cau('X1'))
    for (const sbd of ['A', 'B']) {
      d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES(?,?,'12','x')").run(sbd, sbd)
      for (const [n, kq] of [['2026-09-29', 0], ['2026-09-30', 1], ['2026-10-03', 1]] as const)
        d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn) VALUES(?,?,?,?,?,1,?,?,?)').run(`${sbd}${n}`, sbd, 'X1', 'luyen', 'M', kq, `${n}T03:00:00.000Z`, n)
    }
    d.sql.exec('CREATE TABLE IF NOT EXISTS v2_tham_so_em (sbd TEXT PRIMARY KEY, tham_so_json TEXT NOT NULL, ty_le REAL, n_kiem INTEGER NOT NULL, n_sai_lai INTEGER NOT NULL, cap_nhat_luc TEXT NOT NULL)')
    d.sql.prepare("INSERT INTO v2_tham_so_em VALUES('B',?,0.4,10,4,'x')").run(JSON.stringify({ cachSaiCuoi: 5, mocDuyTri: [9, 20], gioDocLoiGiai: 12 }))
    expect((await docHoSo2(env, 'A', '2026-10-03')).loiV2?.get('X1')?.trangThai).toBe('dong')
    expect((await docHoSo2(env, 'B', '2026-10-03')).loiV2?.get('X1')).toMatchObject({ trangThai: 'cho_kiem', denHan: '2026-10-04' })
  })
})
