// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { CAU_TOI_THIEU, chonCauHanhTrinh, tangCuaEm, tienDoHanhTrinh } from '../server/src/hanh-trinh-ngay'
import { phatLaiCau, type CauSrs, type TrangThaiCau } from '../server/src/srs2-loi'

const cau = (n: number, mucDo = 'NB'): CauSrs[] => Array.from({ length: n }, (_, i) => ({ qid: `${mucDo}-${i}`, phan: 'I', mucDo, dang: 'd', nguon: 'chien_dich' }))
const trangThai = (cs: CauSrs[]) => new Map(cs.map(c => [c.qid, phatLaiCau(c.qid, [], null)]))
describe('Hành trình: tối thiểu mỗi ngày + bằng chứng mở tầng', () => {
  it('24/30/36/36, không cộng tầng; đúng 80% mới mở', () => {
    const cs = [...cau(10), ...cau(10, 'TH'), ...cau(10, 'VD')], tt = trangThai(cs)
    expect(CAU_TOI_THIEU).toEqual({ 1: 24, 2: 30, 3: 36, 4: 36 })
    for (const c of cs.slice(0, 7)) tt.get(c.qid)!.thanhThao = true
    expect(tangCuaEm(cs, tt, new Map())).toBe(1)
    tt.get(cs[7]!.qid)!.thanhThao = true
    expect(tangCuaEm(cs, tt, new Map())).toBe(2)
    for (const c of cs.slice(10, 18)) tt.get(c.qid)!.thanhThao = true
    expect(tangCuaEm(cs, tt, new Map())).toBe(3)
    expect(tangCuaEm(cau(10, 'VD'), trangThai(cau(10, 'VD')), new Map())).toBe(1)
  })
  it('bản sao nội dung không tạo 80% thành thạo giả', () => {
    const cs = cau(10), tt = trangThai(cs), nhom = new Map(cs.map((c,i) => [c.qid, i < 8 ? 'trung' : c.qid]))
    for (const c of cs.slice(0, 8)) tt.get(c.qid)!.thanhThao = true
    expect(tangCuaEm(cs, tt, nhom)).toBe(1)
  })
  it('đủ sàn, bỏ câu bị khoá/cắt tỉa/trùng nội dung/thiếu tiên quyết', () => {
    const cs = [...cau(50), ...cau(40, 'VD')], tt = trangThai(cs)
    tt.get(cs[0]!.qid)!.catTia = true
    const nhom = new Map(cs.map((c,i) => [c.qid, i < 8 ? 'ban-sao' : c.qid]))
    const a = { ngay: '2026-10-09', tang: 1 as const, toiThieu: 24, daLam: [cs[1]!.qid], cau: cs, tt, nhom, chan: new Set([cs[9]!.qid]) }
    const r = chonCauHanhTrinh(a), ds = [...r.dao, ...r.doan]
    expect(ds).toHaveLength(23)
    expect(new Set(ds.map(q => nhom.get(q))).size).toBe(23)
    expect(ds.every(q => q.startsWith('NB-') && !a.chan.has(q))).toBe(true)
    expect(ds).not.toContain(cs[0]!.qid)
    expect(chonCauHanhTrinh(a)).toEqual(r)
  })
  it('không lặp để đủ sàn và không kéo ôn chưa tới hạn', () => {
    const cs = cau(10), tt = trangThai(cs)
    Object.assign(tt.get(cs[0]!.qid)!, { laMoi: false, thanhThao: true, henOn: '2026-10-10' })
    const r = chonCauHanhTrinh({ ngay: '2026-10-09', tang: 1, toiThieu: 24, daLam: [], cau: cs, tt, nhom: new Map(), chan: new Set() })
    expect(r.dao).toHaveLength(9)
    expect(tienDoHanhTrinh(1, 24, 9, 6)).toMatchObject({ conThieu: 15, changHienTai: 2, cauTrongChang: 3 })
  })
  it('không mở bài khác chỉ vì một bài đã lên tầng cao', () => {
    const cs = [...cau(40, 'TH'), ...cau(40)], tt = trangThai(cs)
    const tangSanSang = new Map(cs.map(c => [c.qid, c.mucDo === 'TH' ? 1 as const : 2 as const]))
    const r = chonCauHanhTrinh({ ngay: '2026-10-09', tang: 2, toiThieu: 30, daLam: [], cau: cs, tt, nhom: new Map(), chan: new Set(), tangSanSang })
    expect(r.dao).toHaveLength(30)
    expect(r.dao.every(q => q.startsWith('NB'))).toBe(true)
  })
  it('ưu tiên nợ tới hạn, không phát lại câu đã làm hôm nay', () => {
    const cs = cau(60), tt: Map<string, TrangThaiCau> = trangThai(cs)
    for (const c of cs.slice(0, 20)) Object.assign(tt.get(c.qid)!, { laMoi: false, henOn: '2026-10-08', lanSai: 2 })
    const r = chonCauHanhTrinh({ ngay: '2026-10-09', tang: 1, toiThieu: 24, daLam: [cs[0]!.qid], cau: cs, tt, nhom: new Map(), chan: new Set() })
    expect(r.doan.length).toBeGreaterThanOrEqual(12)
    expect([...r.dao, ...r.doan]).not.toContain(cs[0]!.qid)
  })
})
