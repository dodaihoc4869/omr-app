// @vitest-environment node
// BTVN "NÂNG ĐỠ" — /btvn/xem-truoc (thầy, CHỈ ĐỌC): 0 câu ghi, bộ xem trước = bộ thật, ≤ 50 em, ≤ 8 truy vấn, cần mã bí mật.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, type D1That } from './_d1-that'
import { BAY_GIO, HAN, boCuaEm, cauThay, dung, giao, gio, maBtvn, mo } from './_btvn-nang-do-mau'

afterEach(() => vi.useRealTimers())

const xem = (d: D1That, body: Record<string, unknown>, thay = true) => goiWorker(worker, d.env, '/btvn/xem-truoc', body, thay)
const truocGiao = (dsSbd: string[], them: Record<string, unknown> = {}) => ({ maDe: 'DE1', cau: cauThay(), ghim: [], hanNop: HAN, hatGiong: 'hg-1', dsSbd, ...them })

/** Ghi lại mọi câu lệnh ghi (INSERT/UPDATE/DELETE/DDL) mà D1 nhận. */
function theoDoiGhi(d: D1That): string[] {
  const ghi: string[] = []
  const goc = d.env.DB.prepare.bind(d.env.DB)
  d.env.DB.prepare = ((q: string) => {
    if (/^\s*(INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER)\b/i.test(q)) ghi.push(q.trim().slice(0, 60))
    return goc(q)
  }) as typeof d.env.DB.prepare
  return ghi
}
const chupTatCa = (d: D1That) => ['btvn', 'btvn_em', 'btvn_cau', 'btvn_em_cau', 'su_kien_hoc', 'nam_kt_cau', 'nam_kt_dang', 'ke_hoach_ngay', 'exp_so'].map((t) => d.chup(t)).join('\n')

describe('/btvn/xem-truoc — TRƯỚC khi giao (a)', () => {
  it('KHÔNG GHI gì: không câu INSERT/UPDATE/DELETE nào, mọi bảng nguyên vẹn', async () => {
    gio(BAY_GIO)
    const d = dung(3)
    const truoc = chupTatCa(d)
    const ghi = theoDoiGhi(d)
    const r = await xem(d, truocGiao(['S1', 'S2', 'S3'], { sbdChiTiet: 'S2' }))
    expect(r.ok).toBe(true)
    expect(ghi).toEqual([])
    expect(chupTatCa(d)).toBe(truoc)
    expect(d.dem('btvn_em_cau')).toBe(0)
  })
  it('bảng từng em: tên, daChot=false, coHoSo, ngân sách, tóm tắt; lõi + số câu bài; chiTiet chỉ cho em được chọn', async () => {
    gio(BAY_GIO)
    const d = dung(3)
    d.sql.prepare("INSERT INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,cap_nhat_luc) VALUES('S1|DA-1','S1','DA-1',8,7,1,6,0,0,'x')").run()
    const r = await xem(d, truocGiao(['S1', 'S2', 'S3'], { sbdChiTiet: 'S1' }))
    expect(r).toMatchObject({ ok: true, hatGiong: 'hg-1', soCauBai: 24 })
    expect(r.soLoi).toBe(r.loi.length)
    expect(r.ds.map((x: { sbd: string }) => x.sbd)).toEqual(['S1', 'S2', 'S3'])
    expect(r.ds[0]).toMatchObject({ sbd: 'S1', hoTen: 'Em 1', daChot: false, coHoSo: true })
    expect(r.ds[1]).toMatchObject({ sbd: 'S2', daChot: false, coHoSo: false })
    expect(r.ds[0].nganSach).toMatchObject({ soNgay: 7 }) // bản 1.3: số BUỔI TỐI còn trọn trước hạn (`soNgayToiHan` của Code 1): chốt 22/09 10:00, hạn 29/09 10:00 ⇒ 22…28/09 = 7 (tối 29/09 nằm sau hạn nên không tính)
    expect(r.ds[0].nganSach.cauMoiNgay).toBeGreaterThanOrEqual(8)
    expect(r.ds[0].tomTat).toMatchObject({ soLoi: r.soLoi })
    expect(r.chiTiet.sbd).toBe('S1')
    expect(Object.keys(r.chiTiet.nhan).length).toBe(r.ds[0].tomTat.tong)
    expect(r.chiTiet.chang.flat().length).toBe(r.ds[0].tomTat.tong)
    expect(r.chiTiet.chang.length).toBe(r.ds[0].tomTat.soChang)
    // Lõi ⊆ bộ của mọi em: mỗi bộ có đủ lõi (qua chiTiet của từng em).
    for (const s of ['S1', 'S2', 'S3']) {
      const ct = (await xem(d, truocGiao(['S1', 'S2', 'S3'], { sbdChiTiet: s }))).chiTiet
      for (const q of r.loi) expect(ct.chang.flat()).toContain(q)
    }
  })
  it('KHỚP BỘ THẬT: cùng hạt giống + hồ sơ + giờ ⇒ chiTiet xem trước == btvn_em_cau sau khi giao và em mở bài (mọi chặng, mọi nhãn)', async () => {
    gio(BAY_GIO)
    const d = dung(2)
    d.sql.prepare("INSERT INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,cap_nhat_luc) VALUES('S2|DA-2','S2','DA-2',6,4,1,3,0,0,'x')").run()
    const truoc = await Promise.all(['S1', 'S2'].map((s) => xem(d, truocGiao(['S1', 'S2'], { sbdChiTiet: s }))))
    await giao(d, { hatGiong: 'hg-1' })
    for (const s of ['S1', 'S2']) await mo(d, s)
    for (const [i, s] of ['S1', 'S2'].entries()) {
      const bo = boCuaEm(d, s)
      const ct = truoc[i]!.chiTiet
      const chang = Array.from({ length: Math.max(...bo.map((x) => x.chang)) + 1 }, (_, c) => bo.filter((x) => x.chang === c).map((x) => x.qid))
      expect(ct.chang, s).toEqual(chang)
      expect(ct.nhan, s).toEqual(Object.fromEntries(bo.map((x) => [x.qid, x.nhan])))
    }
  })
  it('KHỚP BỘ THẬT cả khi ngân sách < số câu (hạt giống phân xử câu nào được chọn): xem trước == thật; hạt giống khác ⇒ bộ khác', async () => {
    gio(BAY_GIO)
    const d = dung(1)
    // Tờ DE3: 60 câu Phần I, 6 dạng × 10 câu, toàn mức Biết ⇒ rất nhiều câu cùng điểm; hạn 3 ngày (72 giờ ⇒ hạn DÀI) ⇒ ngân sách ≈ 4 × 12 câu < 60.
    d.objects.set('kho/DE3.json', { ma_de: 'DE3', cau: Array.from({ length: 60 }, (_, i) => ({ phan: 'I', so: i + 1, de: 'x', dap_an: 'A', chuyen_de: 'Este', muc_do: 'biet', dang: { ma: `DB-${Math.floor(i / 10)}`, ten: 'x' } })) })
    d.sql.exec("INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DE3','Tờ 3',60,0,'x')")
    const han2 = '2026-09-25T03:00:00.000Z'
    const xemSeed = (hatGiong: string) => xem(d, { maDe: 'DE3', cau: [], ghim: [], hanNop: han2, hatGiong, dsSbd: ['S1'], sbdChiTiet: 'S1' })
    const truoc = await xemSeed('seed-A')
    expect(truoc.ok).toBe(true)
    expect(truoc.chiTiet.chang.flat().length).toBeLessThan(60)
    const cacBo = new Set<string>()
    for (const h of ['seed-A', 'seed-B', 'seed-C', 'seed-D', 'seed-E']) cacBo.add(JSON.stringify((await xemSeed(h)).chiTiet.chang))
    expect(cacBo.size).toBeGreaterThan(1) // hạt giống thật sự quyết định bộ
    await goiWorker(worker, d.env, '/btvn/giao', { maCa: 'CA1', maDe: 'DE3', hanNop: han2, caNhan: true, cau: [], hatGiong: 'seed-A' }, true)
    await mo(d)
    const bo = boCuaEm(d)
    const chang = Array.from({ length: Math.max(...bo.map((x) => x.chang)) + 1 }, (_, c) => bo.filter((x) => x.chang === c).map((x) => x.qid))
    expect(truoc.chiTiet.chang).toEqual(chang)
  })
  it('giới hạn: rỗng ⇒ lỗi; 51 em ⇒ lỗi; thiếu tờ đề ⇒ lỗi; hạn quá khứ ⇒ lỗi; cần mã bí mật của thầy', async () => {
    gio(BAY_GIO)
    const d = dung()
    expect((await xem(d, truocGiao([]))).ok).toBe(false)
    expect((await xem(d, truocGiao(Array.from({ length: 51 }, (_, i) => `S${i}`)))).ok).toBe(false)
    expect((await xem(d, truocGiao(Array.from({ length: 50 }, (_, i) => `S${i}`)))).ok).toBe(true)
    expect((await xem(d, { dsSbd: ['S1'] })).ok).toBe(false)
    expect((await xem(d, truocGiao(['S1'], { hanNop: '2020-01-01T00:00:00.000Z' }))).ok).toBe(false)
    const khongMa = await xem(d, truocGiao(['S1']), false)
    expect(khongMa.ok).not.toBe(true)
    expect(khongMa.soLoi).toBeUndefined()
  })
  it('SỐ TRUY VẤN: ≤ 8 cho cả 50 em (chế độ a)', async () => {
    gio(BAY_GIO)
    const d = dung(1)
    const t0 = d.soLenh.prepare
    const r = await xem(d, truocGiao(Array.from({ length: 50 }, (_, i) => `S${i + 1}`), { sbdChiTiet: 'S1' }))
    const soLenh = d.soLenh.prepare - t0
    console.log(`[đo] xem trước (a) 50 em: ${soLenh} truy vấn`)
    expect(r.ok).toBe(true)
    expect(r.ds.length).toBe(50)
    expect(soLenh).toBeLessThanOrEqual(8)
  })
})

describe('/btvn/xem-truoc — SAU khi giao (b)', () => {
  it('em CHƯA chốt: bộ tính thử; em ĐÃ chốt: trả ĐÚNG bộ đã ghi kể cả khi hồ sơ đổi sau đó; vẫn không ghi gì', async () => {
    gio(BAY_GIO)
    const d = dung(2)
    await giao(d)
    await mo(d, 'S1')
    const bo1 = boCuaEm(d, 'S1')
    // Hồ sơ S1 đổi sau khi chốt: bộ của em KHÔNG đổi.
    d.sql.prepare("INSERT INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,cap_nhat_luc) VALUES('S1|DA-1','S1','DA-1',10,9,0,9,0,0,'x')").run()
    const truoc = chupTatCa(d)
    const ghi = theoDoiGhi(d)
    const t0 = d.soLenh.prepare
    const r = await xem(d, { maBtvn: maBtvn(d), dsSbd: ['S1', 'S2', 'S9'], sbdChiTiet: 'S1' })
    const soLenh = d.soLenh.prepare - t0
    console.log(`[đo] xem trước (b) 3 em + chi tiết: ${soLenh} truy vấn`)
    expect(soLenh).toBeLessThanOrEqual(8)
    expect(r.ok).toBe(true)
    expect(ghi).toEqual([])
    expect(chupTatCa(d)).toBe(truoc)
    expect(r.ds.map((x: { sbd: string; daChot: boolean }) => [x.sbd, x.daChot])).toEqual([['S1', true], ['S2', false]])
    expect(r.khongCoTrongBai).toEqual(['S9'])
    expect(r.ds[0].tomTat.tong).toBe(bo1.length)
    expect(r.chiTiet.chang.flat()).toEqual(bo1.map((x) => x.qid))
    expect(r.ds[1]).toMatchObject({ hoTen: 'Em 2', daChot: false })
    expect(r.hatGiong).toBe('hg-1')
  })
  it('bài không cá nhân hoá / không tồn tại ⇒ lỗi bằng lời', async () => {
    gio(BAY_GIO)
    const d = dung()
    await goiWorker(worker, d.env, '/btvn/giao', { maCa: 'CA1', maDe: 'DE1', hanNop: HAN }, true)
    expect(await xem(d, { maBtvn: maBtvn(d), dsSbd: ['S1'] })).toMatchObject({ ok: false, error: 'Bài này không cá nhân hoá.' })
    expect((await xem(d, { maBtvn: 'KHONG-CO', dsSbd: ['S1'] })).ok).toBe(false)
  })
})
