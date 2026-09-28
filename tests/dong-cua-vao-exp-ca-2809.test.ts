// @vitest-environment node
// HOÀN THIỆN BẢN VẼ CA THI 28/09 — máy chủ CHỈ THÊM:
//   · `/gv/dong-cua-vao` (server/src/ca-thi-them.ts `gvDongCuaVao`): đặt `het_han_vao` = bây giờ cho ca ĐANG MỞ. Em đang làm vẫn khôi phục; em chưa vào bị `het_han_vao`;
//     em được duyệt thi lại không bị hạn chặn (luật sẵn có `luat-vao-thi.ts`, không đổi). Ca đóng ⇒ từ chối. Hạn cũ đã qua ⇒ giữ nguyên.
//   · `ketQua` (goi-cu.ts `ketQuaCuaEm`) trả `expCa` CHỈ khi đã được xem điểm — trước công bố KHÔNG có trường này (không lộ gì).
import { describe, expect, it } from 'vitest'
import { gvDongCuaVao, expCuaEmTrongCa } from '../server/src/ca-thi-them'
import { ketQuaCuaEm } from '../server/src/goi-cu'
import { quyetDinhVaoThi, type DongCa, type DongLuot } from '../server/src/luat-vao-thi'
import { taoD1That, type D1That } from './_d1-that'

const NOW = Date.parse('2026-09-28T05:00:00.000Z')
const themCa = (d: D1That, ma: string, o: { tt?: string; congBo?: string; han?: string } = {}) =>
  d.sql
    .prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,lop,cong_bo,thoi_gian_phut,het_han_vao,mo_luc,cap_nhat_luc) VALUES(?,?,?,'thi','12A1',?,45,?,'2026-09-28T01:00:00.000Z','x')")
    .run(ma, `Ca ${ma}`, o.tt ?? 'mo', o.congBo ?? 'khong', o.han ?? '')
const themLuot = (d: D1That, ma: string, sbd: string, tt = 'da_nop') =>
  d.sql
    .prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,nop_luc,trang_thai,tong,cap_nhat_luc) VALUES(?,?,?,1,'2026-09-28T01:00:00.000Z',?,?,7,'x')")
    .run(`${ma}|${sbd}|1`, ma, sbd, tt === 'da_nop' ? '2026-09-28T01:40:00.000Z' : null, tt)
const themExp = (d: D1That, sbd: string, ma: string, exp: number, khoa: string) =>
  d.sql
    .prepare("INSERT INTO exp_so(khoa,sbd,ngay_vn,loai,qid,ma_nguon,exp,luc,ghi_chu) VALUES(?,?,'2026-09-28','cau','Q',?,?,'2026-09-28T02:00:00.000Z','')")
    .run(khoa, sbd, ma, exp)
const docCa = (d: D1That, ma: string) => d.sql.prepare('SELECT * FROM ca WHERE ma_ca = ?').get(ma) as unknown as DongCa

describe('/gv/dong-cua-vao', () => {
  it('ca đang mở ⇒ hạn vào = bây giờ; em đang làm vẫn khôi phục, em chưa vào bị chặn het_han_vao, em được duyệt thi lại vẫn vào', async () => {
    const d = taoD1That()
    themCa(d, 'M1')
    expect(await gvDongCuaVao(d.env, { maCa: 'M1' }, NOW)).toMatchObject({ ok: true, hetHanVao: new Date(NOW).toISOString(), daDongTruoc: false })
    const ca = docCa(d, 'M1')
    expect(ca.trang_thai).toBe('mo') // KHÔNG khoá ca
    const sau = NOW + 1000
    expect(quyetDinhVaoThi(ca, null, 'may1', sau)).toMatchObject({ ok: false, lyDo: 'het_han_vao' })
    const dangLam = { trang_thai: 'dang_lam', lan_thu: 1, id_thiet_bi: 'may1' } as unknown as DongLuot
    expect(quyetDinhVaoThi(ca, dangLam, 'may1', sau)).toMatchObject({ ok: true, cach: 'khoi_phuc' })
    const duyetLai = { trang_thai: 'duoc_duyet_lai', lan_thu: 2, id_thiet_bi: '' } as unknown as DongLuot
    expect(quyetDinhVaoThi(ca, duyetLai, 'may2', sau)).toMatchObject({ ok: true, cach: 'duyet_lai' })
    const nk = d.sql.prepare('SELECT nguon, muc FROM nhat_ky_may').all()
    expect(nk).toEqual([{ nguon: 'dong_cua_vao', muc: 'tin' }])
  })
  it('hạn cũ ĐÃ QUA ⇒ giữ nguyên (không nới); hạn cũ còn xa ⇒ kéo về bây giờ', async () => {
    const d = taoD1That()
    themCa(d, 'A', { han: '2026-09-28T04:00:00.000Z' })
    themCa(d, 'B', { han: '2026-09-28T09:00:00.000Z' })
    expect(await gvDongCuaVao(d.env, { maCa: 'A' }, NOW)).toMatchObject({ ok: true, daDongTruoc: true })
    expect(docCa(d, 'A').het_han_vao).toBe('2026-09-28T04:00:00.000Z')
    await gvDongCuaVao(d.env, { maCa: 'B' }, NOW)
    expect(docCa(d, 'B').het_han_vao).toBe(new Date(NOW).toISOString())
  })
  it('ca đã đóng / đã xoá / không có / thiếu mã ⇒ từ chối, không ghi', async () => {
    const d = taoD1That()
    themCa(d, 'D', { tt: 'dong' })
    themCa(d, 'X', { tt: 'da_xoa' })
    expect(await gvDongCuaVao(d.env, { maCa: 'D' }, NOW)).toMatchObject({ ok: false, lyDo: 'ca_khong_mo' })
    expect(await gvDongCuaVao(d.env, { maCa: 'X' }, NOW)).toMatchObject({ ok: false, lyDo: 'khong_co_ca' })
    expect(await gvDongCuaVao(d.env, { maCa: 'KHONG' }, NOW)).toMatchObject({ ok: false, lyDo: 'khong_co_ca' })
    expect(await gvDongCuaVao(d.env, {}, NOW)).toMatchObject({ ok: false, lyDo: 'thieu' })
    expect(docCa(d, 'D').het_han_vao).toBe('')
  })
})

describe('ketQua · expCa', () => {
  it('CHƯA công bố (ca mở, cong_bo khong) ⇒ không có expCa, không keyBank', async () => {
    const d = taoD1That()
    themCa(d, 'K1', { tt: 'mo', congBo: 'khong' })
    themLuot(d, 'K1', 'S1')
    themExp(d, 'S1', 'K1', 40, 'k1')
    const r = await ketQuaCuaEm(d.env, { maCa: 'K1', sbd: 'S1' })
    expect(r.sanSang).toBe(false)
    expect(r).not.toHaveProperty('expCa')
    expect(r.keyBank).toBeNull()
  })
  it('ĐÃ công bố ⇒ expCa = tổng EXP sổ của em từ ca này (không cộng ca khác, em khác)', async () => {
    const d = taoD1That()
    themCa(d, 'K2', { tt: 'dong', congBo: 'ngay' })
    themLuot(d, 'K2', 'S1')
    themExp(d, 'S1', 'K2', 30, 'a')
    themExp(d, 'S1', 'K2', 10, 'b')
    themExp(d, 'S1', 'KHAC', 99, 'c')
    themExp(d, 'S2', 'K2', 7, 'd')
    const r = await ketQuaCuaEm(d.env, { maCa: 'K2', sbd: 'S1' })
    expect(r).toMatchObject({ sanSang: true, expCa: 40 })
    expect(await expCuaEmTrongCa(d.env, 'K2', 'S2')).toBe(7)
    // không SBD ⇒ không trả
    expect(await ketQuaCuaEm(d.env, { maCa: 'K2' })).not.toHaveProperty('expCa')
  })
})
