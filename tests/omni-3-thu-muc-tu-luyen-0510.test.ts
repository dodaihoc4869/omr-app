// @vitest-environment node
// OMNI 3 · TU LUYỆN LỌC THEO THƯ MỤC (server/src/tu-luyen.ts + kho-thu-muc.ts). Khoá:
//   (1) OMNI bật cho em ⇒ câu MỚI / rút thêm / bù kho của chế độ 2, 3, 4 (kể cả toàn kho) chỉ từ tờ TU LUYỆN; danh mục Dạng bài bỏ dạng DẠY HỌC;
//   (2) kho CÂU SAI của em giữ nguyên mọi nguồn (chế độ 1 vẫn phục vụ câu sai thuộc tờ DẠY HỌC);
//   (3) cờ tắt ⇒ y cũ (rút cả hai thư mục) và KHÔNG một truy vấn thư mục nào; (4) bảng `de_kho_thu_muc` thắng luật lùi "DH-".
// Cờ OMNI tiêm bằng vi.mock (`omniBat` của omni-d1 còn là stub ở nhánh này) — test không phụ thuộc thân stub.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import { dongBoCacTo, xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { gvKhoThuMuc } from '../server/src/kho-thu-muc'
import type { Env } from '../server/src/kieu'

const co = vi.hoisted(() => ({ omni: false, hoi: 0 }))
vi.mock('../server/src/omni-d1', async (orig) => {
  const m = await orig<typeof import('../server/src/omni-d1')>()
  return { ...m, omniBat: async () => { co.hoi++; return co.omni } }
})
const { tuLuyenNguon, tuLuyenRut, tuLuyenXemTruoc } = await import('../server/src/tu-luyen')

const T0 = Date.parse('2026-10-05T19:00:00+07:00')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0); xoaDemCaBaoVe(); co.omni = false; co.hoi = 0 })
afterEach(() => { vi.useRealTimers(); xoaDemCaBaoVe() })

type Tho = Record<string, unknown>
const PA = { A: 'Phương án A', B: 'Phương án B', C: 'Phương án C', D: 'Phương án D' }
const DANG = { ma: 'ES.A.X', ten: 'Ester đơn chức' }
const cauI = (so: number, de: string, dapAn: string): Tho => ({
  phan: 'I', so, de, pa: PA, dap_an: dapAn, dang: DANG, chuyen_de: 'CD1', muc_do: 'biet', loi_giai: { chot: `Chọn ${dapAn} vì lý do ${so}.`, trang_thai: 'khop' },
})
const MA_DH = 'DH-12-C1-B1' // tờ DẠY HỌC (luật lùi: mã DH-)
const MA_TL = '12-C1-ON-1' // tờ thường ⇒ TU LUYỆN
const KHO_DH: Tho[] = [
  ...[1, 2, 3, 4, 5, 6].map((i) => cauI(i, `Dạy học: câu ${i} về ester.`, 'ABCD'[i % 4]!)),
  { phan: 'III', so: 1, de: 'Dạy học: tính khối lượng ester (gam).', dap_an: '8,8', dang: DANG, chuyen_de: 'CD1', muc_do: 'van_dung', loi_giai: { chot: 'Tính mol.', ket_qua: '8,8', trang_thai: 'khop' } },
  { phan: 'III', so: 2, de: 'Giải thích vì sao ester nhẹ hơn nước.', dap_an: 'vì khối lượng riêng nhỏ hơn nước nên nổi lên trên', dang: DANG, chuyen_de: 'CD1' }, // tự luận
]
const KHO_TL: Tho[] = [1, 2, 3, 4, 5, 6].map((i) => cauI(i, `Tu luyện: câu ${i} về ester.`, 'ABCD'[(i + 1) % 4]!))
const MA_DB1 = 'DB-12-B1-D1' // dạng bài TU LUYỆN (luật lùi)
const MA_DB2 = 'DB-12-B1-D2' // dạng bài thầy xếp vào DẠY HỌC (bảng thư mục)

async function dung(): Promise<D1That> {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('HS1','Em Một','12','x','x')").run()
  const themTo = (maDe: string, cau: Tho[], ten: string, cauHoi: boolean) => {
    d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?,'12',?,?,0,'v1')").run(maDe, ten, cau.length, `kho/${maDe}.json`)
    d.objects.set(`kho/${maDe}.json`, { ma_de: maDe, cau: cau.map((c) => ({ ...c })) })
    if (cauHoi) for (const t of cau) d.sql.prepare("INSERT INTO cau_hoi(qid,ma_de,chuyen_de,muc_do,phan,lop,co_loi_giai,cap_nhat_luc) VALUES(?,?,'CD1','biet',?,'12',1,'x')").run(`${maDe}-${t.phan}-${t.so}`, maDe, String(t.phan))
  }
  themTo(MA_DH, KHO_DH, MA_DH, true)
  themTo(MA_TL, KHO_TL, MA_TL, true)
  themTo(MA_DB1, [cauI(1, 'Dạng bài 1: câu một.', 'A'), cauI(2, 'Dạng bài 1: câu hai.', 'B')], 'Dạng bài · 12 · Bài 1. Ester · Ester đơn chức', false)
  themTo(MA_DB2, [cauI(1, 'Dạng bài 2: câu một.', 'C')], 'Dạng bài · 12 · Bài 1. Ester · Ester đa chức', false)
  await gvKhoThuMuc(d.env as unknown as Env, { ds: [{ maDe: MA_DB2, thuMuc: 'DAY_HOC' }] })
  await dongBoCacTo(d.env, [MA_DH, MA_TL])
  // Kho câu sai: em sai câu I-2 của tờ DẠY HỌC ở một ca ĐÃ CÔNG BỐ (sau mốc 29/09).
  d.sql.prepare(`INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc) VALUES('CA-1','Ca kiểm tra Ester','dong','2026-10-01T01:00:00.000Z','2026-10-01T02:00:00.000Z',45,'thi','ngay','','x')`).run()
  d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn) VALUES('k1','HS1',?,'thi','CA-1',1,0,'2026-10-01T02:00:00.000Z','2026-10-01')").run(`${MA_DH}-I-2`)
  return d
}
const qids = (r: Tho) => ((r.cau ?? []) as { qid: string }[]).map((c) => c.qid.replace(/~\d+$/, ''))
const tuTo = (ds: string[], ma: string) => ds.filter((q) => q.startsWith(`${ma}-`))
const maDang = (ng: Tho) => ((ng.danhMuc ?? []) as { bais: { dangs: { ma: string }[] }[] }[]).flatMap((l) => l.bais.flatMap((b) => b.dangs.map((x) => x.ma)))
/** Ghi lại mọi câu SQL chạy qua env (để chứng minh cờ tắt không đụng bảng thư mục). */
function ghiSql(env: Env): string[] {
  const ds: string[] = []
  const goc = env.DB.prepare.bind(env.DB)
  env.DB.prepare = ((q: string) => { ds.push(q); return goc(q) }) as typeof env.DB.prepare
  return ds
}

describe('OMNI tắt ⇒ Tu luyện y hệt cũ', () => {
  it('chế độ 2, 4 rút cả câu tờ DẠY HỌC lẫn TU LUYỆN; chế độ 3 rút được dạng DẠY HỌC; danh mục đủ; không truy vấn thư mục', async () => {
    const d = await dung()
    const sql = ghiSql(d.env as unknown as Env)
    const r2 = await tuLuyenRut(d.env, 'HS1', { cheDo: 2, soCau: 50 })
    expect(r2.ok).toBe(true)
    expect(tuTo(qids(r2), MA_DH).length).toBeGreaterThan(0)
    expect(tuTo(qids(r2), MA_TL).length).toBeGreaterThan(0)
    const r4 = await tuLuyenRut(d.env, 'HS1', { cheDo: 4, mucDo: ['ngau_nhien'], soCau: 50 })
    expect(r4.ok).toBe(true)
    expect(tuTo(qids(r4), MA_DH).length).toBeGreaterThan(0)
    expect(maDang(await tuLuyenNguon(d.env, 'HS1'))).toEqual(expect.arrayContaining([MA_DB1, MA_DB2]))
    expect((await tuLuyenRut(d.env, 'HS1', { cheDo: 3, dsDang: [MA_DB2], soCau: 5 })).ok).toBe(true)
    expect(co.hoi).toBeGreaterThan(0)
    expect(sql.some((q) => q.includes('de_kho_thu_muc'))).toBe(false)
  })
  it('toàn kho (kho câu sai trống) rút cả hai thư mục', async () => {
    const d = await dung()
    d.sql.exec('DELETE FROM su_kien_hoc')
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 4, mucDo: ['ngau_nhien'], soCau: 50 })
    expect(r.nguonDang).toMatchObject({ kieu: 'toan_kho' })
    expect(tuTo(qids(r), MA_DH).length).toBe(7) // 6 câu Phần I + 1 câu Phần III (bỏ tự luận)
    expect(tuTo(qids(r), MA_TL).length).toBe(6)
  })
})

describe('OMNI bật ⇒ câu MỚI chỉ từ tờ TU LUYỆN', () => {
  it('chế độ 2 (rút thêm câu cùng dạng câu sai): chỉ câu tờ TU LUYỆN; xem trước đếm đúng phần còn lại', async () => {
    const d = await dung()
    const tat = await tuLuyenXemTruoc(d.env, 'HS1', { cheDo: 2 })
    co.omni = true
    const bat = await tuLuyenXemTruoc(d.env, 'HS1', { cheDo: 2 })
    expect(Number(bat.tongToiDa)).toBeGreaterThan(0)
    expect(Number(bat.tongToiDa)).toBeLessThan(Number(tat.tongToiDa))
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 2, soCau: 50 })
    expect(r.ok).toBe(true)
    expect(qids(r).length).toBe(6)
    expect(tuTo(qids(r), MA_TL)).toEqual(qids(r))
  })
  it('chế độ 4 (kho câu sai làm mồi) và toàn kho: chỉ tờ TU LUYỆN', async () => {
    const d = await dung()
    co.omni = true
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 4, mucDo: ['ngau_nhien'], soCau: 50 })
    expect(r.ok).toBe(true)
    expect(qids(r).length).toBeGreaterThan(0)
    expect(tuTo(qids(r), MA_TL)).toEqual(qids(r))
    d.sql.exec('DELETE FROM su_kien_hoc')
    const tk = await tuLuyenRut(d.env, 'HS1', { cheDo: 4, mucDo: ['ngau_nhien'], soCau: 50 })
    expect(tk.nguonDang).toMatchObject({ kieu: 'toan_kho' })
    expect(qids(tk).sort()).toEqual(KHO_TL.map((c) => `${MA_TL}-I-${c.so}`).sort())
  })
  it('chế độ 3: dạng DẠY HỌC bị bỏ khỏi danh mục và không rút được; dạng TU LUYỆN rút bình thường', async () => {
    const d = await dung()
    co.omni = true
    const ng = await tuLuyenNguon(d.env, 'HS1')
    expect(maDang(ng)).toContain(MA_DB1)
    expect(maDang(ng)).not.toContain(MA_DB2)
    expect((await tuLuyenRut(d.env, 'HS1', { cheDo: 3, dsDang: [MA_DB2], soCau: 5 })).ok).toBe(false)
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 3, dsDang: [MA_DB1], soCau: 5 })
    expect(r.ok).toBe(true)
    expect(qids(r).length).toBe(2)
  })
  it('kho CÂU SAI giữ mọi nguồn: chế độ 1 vẫn phục vụ câu sai thuộc tờ DẠY HỌC (không cần hỏi cờ)', async () => {
    const d = await dung()
    co.omni = true
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 1, soCau: 5 })
    expect(r.ok).toBe(true)
    expect(qids(r)).toContain(`${MA_DH}-I-2`)
    expect(co.hoi).toBe(0)
  })
  it('bảng thư mục thắng luật lùi: thầy xếp tờ DH- vào TU LUYỆN, tờ thường vào DẠY HỌC ⇒ đảo nguồn', async () => {
    const d = await dung()
    await gvKhoThuMuc(d.env as unknown as Env, { ds: [{ maDe: MA_DH, thuMuc: 'TU_LUYEN' }, { maDe: MA_TL, thuMuc: 'DAY_HOC' }] })
    co.omni = true
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 2, soCau: 50 })
    expect(r.ok).toBe(true)
    expect(qids(r).length).toBeGreaterThan(0)
    expect(tuTo(qids(r), MA_DH)).toEqual(qids(r))
    expect(qids(r)).not.toContain(`${MA_DH}-I-2`) // câu em đã sai vẫn bị loại trừ như cũ
  })
})
