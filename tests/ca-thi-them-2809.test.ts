// @vitest-environment node
// CA THI 28/09 — phần máy chủ CHỈ THÊM (server/src/ca-thi-them.ts): /gv/cong-bo-ca, /gv/nhan-xet-ca-em, maTran + tbCaTruoc trong /gv/bao-cao-ca, nhanXet trong /gv/bao-cao-ca-em.
// Khoá: KHÔNG lộ điểm trước công bố (ca đang mở bị từ chối; ca 'khong' đã đóng vẫn chưa công bố tới khi thầy bấm), ghi nhật ký nhưng bảng tin KHÔNG coi là lỗi, bảng mới thuộc GIỮ khi reset.
import { describe, expect, it } from 'vitest'
import { gvCongBoCa, gvNhanXetCaEm, oMaTran, TOI_DA_NHAN_XET } from '../server/src/ca-thi-them'
import { gvBaoCaoCa, gvBaoCaoCaEm } from '../server/src/bao-cao-ca'
import { docTrangThaiCongBo } from '../server/src/cong-bo-diem'
import { BANG_GIU } from '../server/src/reset-toan-app'
import { taoD1That, type D1That } from './_d1-that'

const NOW = Date.parse('2026-09-28T05:00:00.000Z')
const themCa = (d: D1That, ma: string, o: { tt?: string; congBo?: string; lop?: string; mo?: string } = {}) =>
  d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,lop,cong_bo,thoi_gian_phut,mo_luc,cap_nhat_luc) VALUES(?,?,?,'thi',?,?,45,?,'x')")
    .run(ma, `Ca ${ma}`, o.tt ?? 'dong', o.lop ?? '12A1', o.congBo ?? 'khong', o.mo ?? '2026-09-28T01:00:00.000Z')
const themLuot = (d: D1That, ma: string, sbd: string, tong: number, tt = 'da_nop') =>
  d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,nop_luc,trang_thai,tong,cap_nhat_luc) VALUES(?,?,?,1,'2026-09-28T01:00:00.000Z',?,?,?,'x')")
    .run(`${ma}|${sbd}|1`, ma, sbd, tt === 'da_nop' ? '2026-09-28T01:40:00.000Z' : null, tt, tong)
const themCau = (d: D1That, ma: string, sbd: string, phan: string, so: number, chon: string, dung: string, ds: number | null) =>
  d.sql.prepare('INSERT INTO chi_tiet_cau(khoa,ma_ca,sbd,lan_thu,phan,so_cau,qid,chuyen_de,muc_do,dap_an_chon,dap_an_dung,dung_sai,giay,cap_nhat_luc) VALUES(?,?,?,1,?,?,?,\'\',\'\',?,?,?,30,\'x\')')
    .run(`${ma}|${sbd}|1|${phan}|${so}`, ma, sbd, phan, so, `Q-${phan}-${so}`, chon, dung, ds)

describe('/gv/cong-bo-ca', () => {
  it('ca ĐANG MỞ ⇒ từ chối, không đổi cong_bo (không lộ điểm cho em đang làm)', async () => {
    const d = taoD1That()
    themCa(d, 'M1', { tt: 'mo' })
    themLuot(d, 'M1', 'S1', 7)
    expect(await gvCongBoCa(d.env, { maCa: 'M1' }, NOW)).toMatchObject({ ok: false, lyDo: 'ca_dang_mo' })
    expect((d.sql.prepare("SELECT cong_bo FROM ca WHERE ma_ca='M1'").get() as any).cong_bo).toBe('khong')
    expect((await docTrangThaiCongBo(d.env, ['M1'])).get('M1')?.daCongBo).toBe(false)
  })
  it('ca đã đóng + "thầy công bố sau": TRƯỚC khi bấm chưa công bố; bấm ⇒ cong_bo ngay, daCongBo true, ghi nhật ký (không tính là lỗi)', async () => {
    const d = taoD1That()
    themCa(d, 'D1')
    themLuot(d, 'D1', 'S1', 7)
    expect((await docTrangThaiCongBo(d.env, ['D1'])).get('D1')?.daCongBo).toBe(false)
    expect(await gvCongBoCa(d.env, { maCa: 'D1' }, NOW)).toMatchObject({ ok: true, congBo: 'ngay', daCongBoTruoc: false })
    expect((await docTrangThaiCongBo(d.env, ['D1'])).get('D1')?.daCongBo).toBe(true)
    const nk = d.sql.prepare("SELECT nguon, muc FROM nhat_ky_may").all() as any[]
    expect(nk).toEqual([{ nguon: 'cong_bo_ca', muc: 'tin' }])
    // bấm lần hai: không ghi thêm
    expect(await gvCongBoCa(d.env, { maCa: 'D1' }, NOW)).toMatchObject({ ok: true, daCongBoTruoc: true })
    expect((d.sql.prepare('SELECT COUNT(*) AS n FROM nhat_ky_may').get() as any).n).toBe(1)
  })
  it('thiếu mã / ca không có / đã xoá', async () => {
    const d = taoD1That()
    themCa(d, 'X', { tt: 'da_xoa' })
    expect(await gvCongBoCa(d.env, {}, NOW)).toMatchObject({ ok: false, lyDo: 'thieu' })
    expect(await gvCongBoCa(d.env, { maCa: 'KHONG' }, NOW)).toMatchObject({ ok: false, lyDo: 'khong_co_ca' })
    expect(await gvCongBoCa(d.env, { maCa: 'X' }, NOW)).toMatchObject({ ok: false, lyDo: 'khong_co_ca' })
  })
})

describe('/gv/nhan-xet-ca-em', () => {
  it('lưu, ghi đè, trả trong /gv/bao-cao-ca-em; rỗng ⇒ xoá; quá dài ⇒ từ chối', async () => {
    const d = taoD1That()
    themCa(d, 'C1', { congBo: 'ngay' })
    themLuot(d, 'C1', 'S1', 8)
    expect(await gvNhanXetCaEm(d.env, { maCa: 'C1', sbd: 'S1', noiDung: '  Làm chắc Phần III.  ' }, NOW)).toMatchObject({ ok: true, noiDung: 'Làm chắc Phần III.' })
    await gvNhanXetCaEm(d.env, { maCa: 'C1', sbd: 'S1', noiDung: 'Xem lại câu 7.' }, NOW)
    const r = (await gvBaoCaoCaEm(d.env, { maCa: 'C1', sbd: 'S1' }, NOW)) as any
    expect(r.nhanXet).toMatchObject({ noiDung: 'Xem lại câu 7.' })
    await gvNhanXetCaEm(d.env, { maCa: 'C1', sbd: 'S1', noiDung: '' }, NOW)
    expect(((await gvBaoCaoCaEm(d.env, { maCa: 'C1', sbd: 'S1' }, NOW)) as any).nhanXet).toBeUndefined()
    expect(await gvNhanXetCaEm(d.env, { maCa: 'C1', sbd: 'S1', noiDung: 'a'.repeat(TOI_DA_NHAN_XET + 1) }, NOW)).toMatchObject({ ok: false, lyDo: 'qua_dai' })
    expect(await gvNhanXetCaEm(d.env, { maCa: 'C1' }, NOW)).toMatchObject({ ok: false, lyDo: 'thieu' })
  })
  it('bảng nhan_xet_ca_em thuộc GIỮ khi reset', () => {
    expect(BANG_GIU).toContain('nhan_xet_ca_em')
  })
})

describe('/gv/bao-cao-ca — maTran + tbCaTruoc', () => {
  it('ô: D đúng · P đúng một phần (Phần II) · S sai · B bỏ trống · N chưa chấm', () => {
    expect(oMaTran({ phan: 'I', soCau: 1, chon: 'B', dapAnDung: 'B', dungSai: 1 })).toBe('D')
    expect(oMaTran({ phan: 'I', soCau: 1, chon: 'A', dapAnDung: 'B', dungSai: 0 })).toBe('S')
    expect(oMaTran({ phan: 'I', soCau: 1, chon: '', dapAnDung: 'B', dungSai: 0 })).toBe('B')
    expect(oMaTran({ phan: 'II', soCau: 1, chon: 'DDSS', dapAnDung: 'DSDS', dungSai: 0 })).toBe('P')
    expect(oMaTran({ phan: 'II', soCau: 1, chon: 'SDSD', dapAnDung: 'DSDS', dungSai: 0 })).toBe('S')
    expect(oMaTran({ phan: 'III', soCau: 1, chon: '2', dapAnDung: '3', dungSai: null })).toBe('N')
  })
  it('hàng theo điểm cao trước, cột theo phần rồi số câu; tbCaTruoc = TB ca ĐÃ CÔNG BỐ liền trước cùng lớp', async () => {
    const d = taoD1That()
    themCa(d, 'C2', { congBo: 'ngay', mo: '2026-09-28T01:00:00.000Z' })
    themLuot(d, 'C2', 'S1', 5); themLuot(d, 'C2', 'S2', 9)
    for (const [s, kq] of [['S1', ['A', 'DDSS']], ['S2', ['B', 'DSDS']]] as const) {
      themCau(d, 'C2', s, 'II', 1, kq[1], 'DSDS', kq[1] === 'DSDS' ? 1 : 0)
      themCau(d, 'C2', s, 'I', 1, kq[0], 'B', kq[0] === 'B' ? 1 : 0)
    }
    // ca trước cùng lớp: P1 đã công bố (TB 6), P2 mới hơn nhưng CHƯA công bố, P3 lớp khác
    themCa(d, 'P1', { congBo: 'ngay', mo: '2026-09-21T01:00:00.000Z' }); themLuot(d, 'P1', 'S1', 5); themLuot(d, 'P1', 'S2', 7); themLuot(d, 'P1', '12121212', 10)
    themCa(d, 'P2', { congBo: 'khong', mo: '2026-09-25T01:00:00.000Z' }); themLuot(d, 'P2', 'S1', 1)
    themCa(d, 'P3', { congBo: 'ngay', lop: '11B', mo: '2026-09-26T01:00:00.000Z' }); themLuot(d, 'P3', 'S1', 2)
    const r = (await gvBaoCaoCa(d.env, { maCa: 'C2' }, NOW)) as any
    expect(r.maTran.cot).toEqual([{ phan: 'I', soCau: 1 }, { phan: 'II', soCau: 1 }])
    expect(r.maTran.em).toEqual([{ sbd: 'S2', kq: 'DD' }, { sbd: 'S1', kq: 'SP' }])
    expect(r.tongQuan.tbCaTruoc).toBe(6)
    expect(r.tongQuan.caTruoc).toMatchObject({ maCa: 'P1' })
  })
  it('không có ca trước ⇒ KHÔNG khoá tbCaTruoc (không số 0 giả)', async () => {
    const d = taoD1That()
    themCa(d, 'C3', { congBo: 'ngay' }); themLuot(d, 'C3', 'S1', 5)
    const r = (await gvBaoCaoCa(d.env, { maCa: 'C3' }, NOW)) as any
    expect(r.tongQuan.tbCaTruoc).toBeUndefined()
    expect(r.maTran).toBeUndefined()
  })
})
