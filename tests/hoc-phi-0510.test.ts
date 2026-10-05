// @vitest-environment node
// HỌC PHÍ (thầy 05/10) — lõi thuần (src/lib/hoc-phi.ts) + máy chủ thật trên D1 sqlite (server/src/hoc-phi.ts):
//   · em không có dòng ⇒ 4.500.000 đ, chưa nộp; nộp từng lần cộng dồn; không vượt số còn thiếu; mã lần nộp chống ghi đôi;
//   · mức riêng (miễn giảm / 0 = không thu) không thấp hơn số đã nộp; xoá lần nhập nhầm; nạp sổ Excel chạy lại không ghi đôi;
//   · chỉ thầy gọi được.
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { conThieu, dinhDangTien, docSoTien, hocPhiCuaEm, MUC_HOC_PHI_CHUAN, tongHocPhi, trangThaiHocPhi, type HocPhiEm } from '../src/lib/hoc-phi'

describe('lõi học phí', () => {
  it('trạng thái 4 màu', () => {
    expect(trangThaiHocPhi(4_500_000, 0)).toBe('chua_nop')
    expect(trangThaiHocPhi(4_500_000, 3_000_000)).toBe('con_thieu')
    expect(trangThaiHocPhi(4_500_000, 4_500_000)).toBe('du')
    expect(trangThaiHocPhi(2_250_000, 2_250_000)).toBe('du')
    expect(trangThaiHocPhi(0, 0)).toBe('khong_thu')
  })
  it('em không có trong sổ = mức chuẩn, chưa nộp', () => {
    expect(MUC_HOC_PHI_CHUAN).toBe(4_500_000)
    expect(hocPhiCuaEm('X', new Map())).toEqual({ sbd: 'X', phaiNop: 4_500_000, daNop: 0, ghiChu: '', soLan: 0 })
  })
  it('tổng: còn thiếu cộng từng em, đếm đúng trạng thái, SBD trùng chỉ tính một lần', () => {
    const m = new Map<string, HocPhiEm>([
      ['A', { sbd: 'A', phaiNop: 4_500_000, daNop: 4_500_000, ghiChu: '', soLan: 2 }],
      ['B', { sbd: 'B', phaiNop: 4_500_000, daNop: 3_000_000, ghiChu: '', soLan: 1 }],
      ['D', { sbd: 'D', phaiNop: 0, daNop: 0, ghiChu: 'trùng', soLan: 0 }],
    ])
    const t = tongHocPhi(['A', 'B', 'C', 'D', 'A'], m)
    expect(t).toEqual({ soEm: 4, phaiNop: 13_500_000, daNop: 7_500_000, conThieu: 6_000_000, dem: { du: 1, con_thieu: 1, chua_nop: 1, khong_thu: 1 } })
    expect(conThieu({ phaiNop: 100, daNop: 300 })).toBe(0)
  })
  it('đọc số tiền thầy gõ', () => {
    expect(docSoTien('500000')).toBe(500_000)
    expect(docSoTien('500.000')).toBe(500_000)
    expect(docSoTien('1.500.000 đ')).toBe(1_500_000)
    expect(docSoTien('500 000')).toBe(500_000)
    expect(docSoTien('500k')).toBe(500_000)
    expect(docSoTien('1,5tr')).toBe(1_500_000)
    expect(docSoTien('2 triệu')).toBe(2_000_000)
    expect(docSoTien('3000000vnđ')).toBe(3_000_000)
    for (const sai of ['', 'abc', '0', '-500', '500.5', '1.50.000', '12,3']) expect(docSoTien(sai)).toBeNull()
  })
  it('định dạng tiền', () => {
    expect(dinhDangTien(4_500_000)).toBe('4.500.000 đ')
    expect(dinhDangTien(0)).toBe('0 đ')
  })
})

describe('máy chủ học phí (D1 thật)', () => {
  const dung = () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    for (const s of ['10001', '10002', '10003']) d.sql.prepare('INSERT INTO hoc_sinh (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run(s, `Em ${s}`, '2011', '10', '2026-10-01')
    return { d, env, g: (duong: string, body: Record<string, unknown> = {}, thay = true) => goiWorker(worker, env, duong, body, thay) }
  }

  it('chỉ thầy', async () => {
    const { g } = dung()
    expect((await g('/gv/hoc-phi/ds', {}, false)).ok).toBe(false)
  })

  it('nộp từng lần cộng dồn, không vượt, mã trùng không ghi đôi', async () => {
    const { g } = dung()
    let r = await g('/gv/hoc-phi/em', { sbd: '10001' })
    expect(r.em).toMatchObject({ phaiNop: 4_500_000, daNop: 0, soLan: 0 })
    r = await g('/gv/hoc-phi/nop', { sbd: '10001', soTien: 2_500_000, id: 'lan-0001-aaaa' })
    expect(r.ok).toBe(true)
    expect(r.em).toMatchObject({ daNop: 2_500_000, soLan: 1 })
    // gửi lại cùng mã ⇒ không cộng thêm
    r = await g('/gv/hoc-phi/nop', { sbd: '10001', soTien: 2_500_000, id: 'lan-0001-aaaa' })
    expect(r).toMatchObject({ ok: true, trung: true })
    expect(r.em.daNop).toBe(2_500_000)
    // còn thiếu 2.000.000: nộp 500.000 ⇒ còn 1.500.000; nhập tiếp được
    r = await g('/gv/hoc-phi/nop', { sbd: '10001', soTien: 500_000, id: 'lan-0002-bbbb', ghiChu: 'mẹ nộp' })
    expect(r.em).toMatchObject({ daNop: 3_000_000, soLan: 2 })
    // vượt số còn thiếu ⇒ từ chối, không ghi
    r = await g('/gv/hoc-phi/nop', { sbd: '10001', soTien: 1_500_001, id: 'lan-0003-cccc' })
    expect(r.ok).toBe(false)
    expect(r.em.daNop).toBe(3_000_000)
    r = await g('/gv/hoc-phi/nop', { sbd: '10001', soTien: 1_500_000, id: 'lan-0004-dddd' })
    expect(r.em).toMatchObject({ daNop: 4_500_000, soLan: 3 })
    r = await g('/gv/hoc-phi/nop', { sbd: '10001', soTien: 1, id: 'lan-0005-eeee' })
    expect(r.ok).toBe(false)
    expect(String(r.error)).toContain('đủ')
    // số sai / em không có
    expect((await g('/gv/hoc-phi/nop', { sbd: '10002', soTien: 0, id: 'lan-0006-ffff' })).ok).toBe(false)
    expect((await g('/gv/hoc-phi/nop', { sbd: '10002', soTien: 1.5, id: 'lan-0007-gggg' })).ok).toBe(false)
    expect((await g('/gv/hoc-phi/nop', { sbd: '99999', soTien: 1000, id: 'lan-0008-hhhh' })).ok).toBe(false)
    // danh sách chỉ có em đã ghi
    const ds = await g('/gv/hoc-phi/ds')
    expect(ds.mucChuan).toBe(4_500_000)
    expect(ds.items).toEqual([{ sbd: '10001', phaiNop: 4_500_000, daNop: 4_500_000, ghiChu: '', soLan: 3 }])
  })

  it('xoá lần nhập nhầm; mức riêng không thấp hơn đã nộp; 0 = không thu', async () => {
    const { g } = dung()
    await g('/gv/hoc-phi/nop', { sbd: '10002', soTien: 3_000_000, id: 'lan-1001-aaaa' })
    let r = await g('/gv/hoc-phi/muc', { sbd: '10002', phaiNop: 2_000_000, ghiChu: 'x' })
    expect(r.ok).toBe(false)
    r = await g('/gv/hoc-phi/muc', { sbd: '10002', phaiNop: 3_000_000, ghiChu: 'giảm' })
    expect(r.em).toMatchObject({ phaiNop: 3_000_000, daNop: 3_000_000, ghiChu: 'giảm' })
    const id = r.em.lanNop[0].id
    r = await g('/gv/hoc-phi/xoa-lan', { sbd: '10002', id })
    expect(r.em).toMatchObject({ daNop: 0, soLan: 0 })
    expect((await g('/gv/hoc-phi/xoa-lan', { sbd: '10002', id })).ok).toBe(false)
    r = await g('/gv/hoc-phi/muc', { sbd: '10003', phaiNop: 0, ghiChu: 'tài khoản trùng' })
    expect(r.em).toMatchObject({ phaiNop: 0, daNop: 0 })
    expect((await g('/gv/hoc-phi/nop', { sbd: '10003', soTien: 1000, id: 'lan-1002-bbbb' })).ok).toBe(false)
  })

  it('nạp sổ Excel: đúng số, SBD lạ báo riêng, chạy lại không ghi đôi, dữ liệu sai ⇒ không ghi gì', async () => {
    const { g } = dung()
    const items = [
      { sbd: '10001', lan: [{ soTien: 3_000_000, ghiChu: 'Đợt 1' }, { soTien: 1_500_000, ghiChu: 'Đợt 2' }] },
      { sbd: '10002', phaiNop: 2_250_000, ghiChu: 'Excel ghi đã đóng đủ', lan: [{ soTien: 2_250_000, ghiChu: 'Đợt 1' }] },
      { sbd: '10003', phaiNop: 0, ghiChu: 'Trùng SBD 10001' },
      { sbd: '77777', lan: [{ soTien: 3_000_000 }] },
    ]
    expect((await g('/gv/hoc-phi/nap', { nguon: 'excel:DS_2026_1', items: [{ sbd: '10001', lan: [{ soTien: 5_000_000 }] }] })).ok).toBe(false)
    expect((await g('/gv/hoc-phi/ds')).items).toEqual([])
    let r = await g('/gv/hoc-phi/nap', { nguon: 'excel:DS_2026_1', items })
    expect(r).toMatchObject({ ok: true, soEm: 3, soLan: 3, tongTien: 6_750_000, khongCo: ['77777'], boQua: [] })
    r = await g('/gv/hoc-phi/nap', { nguon: 'excel:DS_2026_1', items })
    expect(r).toMatchObject({ ok: true, soEm: 0, soLan: 0, boQua: ['10001', '10002', '10003'] })
    const ds = new Map<string, HocPhiEm>(((await g('/gv/hoc-phi/ds')).items as HocPhiEm[]).map((x) => [x.sbd, x]))
    expect(ds.get('10001')).toMatchObject({ phaiNop: 4_500_000, daNop: 4_500_000, soLan: 2 })
    expect(ds.get('10002')).toMatchObject({ phaiNop: 2_250_000, daNop: 2_250_000 })
    expect(ds.get('10003')).toMatchObject({ phaiNop: 0, daNop: 0 })
    expect(tongHocPhi(['10001', '10002', '10003'], ds)).toMatchObject({ phaiNop: 6_750_000, daNop: 6_750_000, conThieu: 0 })
  })
})
