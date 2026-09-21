// @vitest-environment node
// BTVN "NÂNG ĐỠ" — phía THẦY và kế hoạch ngày: theo dõi (số câu của em, chặng, lõi), chống chép bài CHỈ trên lõi, bài làm, hồ sơ lên bảng, kế hoạch ngày.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { hoSoLopLenBang } from '../server/src/goi-cu'
import { goiWorker, type D1That } from './_d1-that'
import { BAY_GIO, DAP_AN_DUNG, HAN, NGAY_MAI_0H_VN, boCuaEm, dung, giao, gio, maBtvn, mo, nopChang } from './_btvn-nang-do-mau'

afterEach(() => vi.useRealTimers())

const theoDoi = (d: D1That) => goiWorker(worker, d.env, '/btvn/theo-doi', { maCa: 'CA1' }, true)
const loiQid = (d: D1That) => (d.sql.prepare('SELECT qid FROM btvn_cau WHERE loi = 1').all() as { qid: string }[]).map((x) => x.qid)

/** Ép một em ĐÃ NỘP (không qua đường chấm): ghi thẳng dap_an_json + điểm — để dựng tình huống theo dõi/chống chép bài. */
function datDaNop(d: D1That, sbd: string, dapAn: (qid: string) => string, nopLuc: string, soDung: number) {
  const bo = boCuaEm(d, sbd)
  d.sql.prepare('UPDATE btvn_em SET nop_luc = ?, so_dung = ?, so_cau = ?, dap_an_json = ? WHERE sbd = ?').run(nopLuc, soDung, bo.length, JSON.stringify(Object.fromEntries(bo.map((x) => [x.qid, dapAn(x.qid)]))), sbd)
}

describe('/btvn/theo-doi — bài cá nhân hoá', () => {
  it('mỗi em thêm soCauCuaEm, soChang, loDaXong, đúng/lõi, câu thưởng sai; bài thêm caNhan + soLoi; em chưa chốt = null', async () => {
    gio(BAY_GIO)
    const d = dung(2)
    await giao(d)
    await mo(d, 'S1')
    const loi = loiQid(d)
    const bo = boCuaEm(d, 'S1')
    // S1 sai đúng các câu lõi + một câu thử thách (ép nhãn) — đúng còn lại.
    const thuong = bo[bo.length - 1]!.qid
    d.sql.prepare("UPDATE btvn_em_cau SET nhan = 'thu_thach' WHERE qid = ? AND sbd = 'S1'").run(thuong)
    const sai = new Set([...loi, thuong])
    datDaNop(d, 'S1', (q) => (sai.has(q) ? 'B' : DAP_AN_DUNG(q)), '2026-09-22T04:00:00.000Z', bo.length - sai.size)
    const r = await theoDoi(d)
    const bai = r.ds[0]
    expect(bai).toMatchObject({ caNhan: true, soLoi: loi.length })
    const s1 = bai.hocSinh.find((x: { sbd: string }) => x.sbd === 'S1')
    const s2 = bai.hocSinh.find((x: { sbd: string }) => x.sbd === 'S2')
    expect(s1).toMatchObject({ soCauCuaEm: bo.length, soChang: expect.any(Number), loDaXong: 0, soDungLoi: 0, soCauLoi: loi.length, diemLoi: 0, soCauThuongSai: 1, soDung: bo.length - sai.size, soCau: bo.length })
    expect(s2).toMatchObject({ soCauCuaEm: null, soChang: null, soDungLoi: 0, soCauLoi: 0, diemLoi: null, soCauThuongSai: 0 })
  })
  it('diemLoi = đúng/lõi × 10 chỉ khi đã nộp; chưa nộp = null nhưng soDungLoi đếm được', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    await mo(d)
    const loi = loiQid(d)
    const bo = boCuaEm(d)
    // Đúng lõi, chưa nộp cuối (đáp án chặng 0 đã lưu)
    const c0 = bo.filter((x) => x.chang === 0).map((x) => x.qid)
    await nopChang(d, 0, Object.fromEntries(c0.map((q) => [q, DAP_AN_DUNG(q)])))
    let s1 = (await theoDoi(d)).ds[0].hocSinh[0]
    expect(s1.diemLoi).toBeNull()
    expect(s1.soDungLoi).toBe(loi.filter((q) => c0.includes(q)).length)
    // Sau khi nộp cuối đúng hết lõi ⇒ 10.
    datDaNop(d, 'S1', (q) => DAP_AN_DUNG(q), '2026-09-22T04:00:00.000Z', bo.length)
    s1 = (await theoDoi(d)).ds[0].hocSinh[0]
    expect(s1).toMatchObject({ diemLoi: 10, soDungLoi: loi.length })
  })
  it('bài CŨ trong cùng phản hồi KHÔNG có trường cá nhân hoá', async () => {
    gio(BAY_GIO)
    const d = dung()
    await goiWorker(worker, d.env, '/btvn/giao', { maCa: 'CA1', maDe: 'DE1', hanNop: HAN }, true)
    const r = await theoDoi(d)
    expect(r.ds[0]).not.toHaveProperty('caNhan')
    expect(r.ds[0]).not.toHaveProperty('soLoi')
    // SỬA CÓ CHỦ Ý 21/09 (`/btvn/theo-doi` bản 2, CHỈ-THÊM, docs/hop-dong-btvn-theo-doi-v2-2109.md): thêm nhóm/chặng hiện tại/số câu đã làm/số câu của em/lần học gần nhất. Vẫn KHÔNG có trường cá nhân hoá (soChang, loDaXong, soDungLoi, diemLoi…).
    expect(Object.keys(r.ds[0].hocSinh[0]).sort()).toEqual(['changHienTai', 'chiTietDoiChieu', 'diemThiDoiChieu', 'gianLan', 'hocGanNhat', 'hoTen', 'lyDoGianLan', 'nhom', 'nopLuc', 'sbd', 'soCau', 'soCauCuaEm', 'soCauDaLam', 'soDung', 'thuHoi', 'xacSuatGianLan'].sort())
    expect(r.ds[0].hocSinh[0]).not.toHaveProperty('soChang')
  })
})

describe('chống chép bài — CHỈ so trên câu LÕI', () => {
  it('hai em giống nhau ở LÕI (≥ 6 câu chung), nộp cách vài phút ⇒ bị gắn cờ', async () => {
    gio(BAY_GIO)
    const d = dung(2)
    await giao(d)
    await mo(d, 'S1')
    await mo(d, 'S2')
    expect(loiQid(d).length).toBeGreaterThanOrEqual(6)
    for (const [s, gioNop] of [['S1', '2026-09-22T04:00:00.000Z'], ['S2', '2026-09-22T04:03:00.000Z']] as const) datDaNop(d, s, (q) => DAP_AN_DUNG(q), gioNop, boCuaEm(d, s).length)
    const r = await theoDoi(d)
    expect(r.ds[0].hocSinh.every((x: { gianLan: boolean }) => x.gianLan)).toBe(true)
  })
  it('hai em KHÁC nhau ở lõi nhưng giống hệt ở phần ngoài lõi ⇒ KHÔNG bị gắn cờ (câu riêng không dùng để so)', async () => {
    gio(BAY_GIO)
    const d = dung(2)
    await giao(d)
    // Hồ sơ MẠNH cho cả hai em (mọi dạng bậc 2) ⇒ bộ lớn, hai em chung nhiều câu NGOÀI lõi: nếu chống chép bài so cả câu riêng thì họ sẽ bị gắn cờ oan.
    for (const s of ['S1', 'S2']) for (const ma of ['DA-1', 'DA-2', 'DA-3', 'DA-4']) d.sql.prepare('INSERT INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?)').run(`${s}|${ma}`, s, ma, 10, 1, 1, 0, 9, 2, 'x')
    await mo(d, 'S1')
    await mo(d, 'S2')
    const loi = new Set(loiQid(d))
    const chung = boCuaEm(d, 'S1').filter((x) => boCuaEm(d, 'S2').some((y) => y.qid === x.qid && !loi.has(x.qid))).length
    expect(chung).toBeGreaterThanOrEqual(10) // đủ nhiều câu chung ngoài lõi để phép thử có nghĩa
    datDaNop(d, 'S1', (q) => DAP_AN_DUNG(q), '2026-09-22T04:00:00.000Z', boCuaEm(d, 'S1').length)
    // S2 sai ở các câu lõi Phần I (nhẹ ký) nhưng đúng ở lõi Phần II/III ⇒ trên TOÀN BỘ câu chung hai em giống ≥ 70 % (sẽ bị gắn cờ oan nếu so cả câu riêng); trên lõi chỉ giống ít.
    datDaNop(d, 'S2', (q) => (loi.has(q) && /-I-/.test(q) ? 'C' : DAP_AN_DUNG(q)), '2026-09-22T04:03:00.000Z', boCuaEm(d, 'S2').length)
    const r = await theoDoi(d)
    for (const x of r.ds[0].hocSinh) expect(x.gianLan, x.sbd).toBe(false)
  })
})

describe('/btvn/bai-lam — bài cá nhân hoá', () => {
  it('chỉ câu CỦA EM (kèm đáp án — màn thầy), soCau = mẫu, có chặng + nhãn; bài cũ vẫn cả tờ', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    await mo(d)
    const bo = boCuaEm(d)
    d.sql.prepare("UPDATE btvn_em_cau SET nhan = 'thu_thach' WHERE qid = ?").run(bo[bo.length - 1]!.qid)
    datDaNop(d, 'S1', (q) => (q === bo[bo.length - 1]!.qid ? 'B' : DAP_AN_DUNG(q)), '2026-09-22T04:00:00.000Z', bo.length - 1)
    const r = await goiWorker(worker, d.env, '/btvn/bai-lam', { maBtvn: maBtvn(d), sbd: 'S1' }, true)
    expect(r).toMatchObject({ ok: true, caNhan: true, soCauCuaEm: bo.length, soCauThuongSai: 1, soCau: bo.length - 1, soDung: bo.length - 1 })
    expect(r.de.cau.length).toBe(bo.length)
    expect(r.de.cau[0]).toHaveProperty('dap_an') // thầy được thấy đáp án
    expect(r.chang.flat().sort()).toEqual(bo.map((x) => x.qid).sort())
    expect(r.nhan[bo[bo.length - 1]!.qid]).toBe('thu_thach')

    const cu = dung()
    await goiWorker(worker, cu.env, '/btvn/giao', { maCa: 'CA1', maDe: 'DE1', hanNop: HAN }, true)
    cu.sql.prepare("UPDATE btvn_em SET nop_luc='x', so_dung=1, so_cau=24, dap_an_json='{}' WHERE sbd='S1'").run()
    const rc = await goiWorker(worker, cu.env, '/btvn/bai-lam', { maBtvn: maBtvn(cu), sbd: 'S1' }, true)
    expect(rc.de.cau.length).toBe(24)
    expect(rc).not.toHaveProperty('caNhan')
  })
})

describe('hồ sơ lên bảng — câu ngoài bộ của em không bị tính "chưa làm/sai"', () => {
  it('em đã chốt: số câu giao = |bộ|, không phải 24; em chưa chốt: lượt bị bỏ; bài cũ: cả 24 như cũ', async () => {
    gio(BAY_GIO)
    const d = dung(2)
    await giao(d)
    await mo(d, 'S1')
    const bo = boCuaEm(d, 'S1')
    const c0 = bo.filter((x) => x.chang === 0).map((x) => x.qid)
    await nopChang(d, 0, Object.fromEntries(c0.map((q) => [q, q === c0[0] ? 'B' : DAP_AN_DUNG(q)])))
    const r = (await hoSoLopLenBang(d.env, { dsSbd: ['S1', 'S2'] })) as { em: Record<string, { btvn: Record<string, any> }> }
    expect(r.em.S1!.btvn).toMatchObject({ soLuot: 1, soCauGiao: bo.length, soDaLam: c0.length, soSai: 1, soDung: c0.length - 1, soChuaLam: bo.length - c0.length })
    expect(r.em.S1!.btvn.qidSai).toEqual([c0[0]])
    expect(r.em.S2!.btvn).toMatchObject({ soLuot: 0, soCauGiao: 0 })

    const cu = dung()
    await goiWorker(worker, cu.env, '/btvn/giao', { maCa: 'CA1', maDe: 'DE1', hanNop: HAN }, true)
    const rc = (await hoSoLopLenBang(cu.env, { dsSbd: ['S1'] })) as { em: Record<string, { btvn: Record<string, any> }> }
    expect(rc.em.S1!.btvn).toMatchObject({ soLuot: 1, soCauGiao: 24, soChuaLam: 24 })
  })
})

describe('kế hoạch ngày — lô ≡ chặng', () => {
  const kh = (d: D1That) => goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' })
  const viecLo = (r: Record<string, any>) => (r.viec as Record<string, any>[]).filter((v) => v.loai === 'btvn_lo')

  it('CHƯA chốt: một lô ước bằng ngân sách một chặng (không phải cả 24), chiTiet.chuaChot', async () => {
    gio(BAY_GIO)
    const d = dung()
    await giao(d)
    const r = await kh(d)
    expect(r.ok).toBe(true)
    const lo = viecLo(r)
    expect(lo.length).toBe(1)
    expect(lo[0]).toMatchObject({ chiTiet: { caNhan: true, chuaChot: true, chiSo: 0 } })
    expect(lo[0].soCau).toBeLessThan(24)
  })
  it('ĐÃ chốt: soCau lô = số câu chặng 0, tongLo = soChang; chặng 1 chưa tới 00:00 ⇒ sapToi; sang ngày mới ⇒ lô 1 hiện', async () => {
    gio(BAY_GIO)
    const d = dung()
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('btvn_mo_som','tat','x')").run() // Điều 6 mở sớm chặng tắt: test này khoá lịch/mốc mở chặng như cũ (sửa CÓ CHỦ Ý 21/09)
    await giao(d)
    const m = await mo(d)
    const c0 = boCuaEm(d).filter((x) => x.chang === 0).map((x) => x.qid)
    const r0 = await kh(d)
    const lo0 = viecLo(r0)
    expect(lo0.length).toBe(1)
    expect(lo0[0]).toMatchObject({ soCau: c0.length, chiTiet: { caNhan: true, chiSo: 0, tongLo: m.soChang } })
    expect(lo0[0].chiTiet.chuaChot).toBeUndefined()
    // Xong chặng 0 ⇒ chặng 1 mở vào 00:00 ngày mai giờ VN.
    await nopChang(d, 0, Object.fromEntries(c0.map((q) => [q, DAP_AN_DUNG(q)])))
    const r1 = await kh(d)
    expect(viecLo(r1)).toEqual([])
    expect(r1.sapToi).toContainEqual({ loai: 'btvn_lo', ma: maBtvn(d), chiSo: 1, moLuc: NGAY_MAI_0H_VN })
    gio(NGAY_MAI_0H_VN)
    const r2 = await kh(d)
    const c1 = boCuaEm(d).filter((x) => x.chang === 1)
    expect(viecLo(r2)[0]).toMatchObject({ soCau: c1.length, chiTiet: { chiSo: 1, tongLo: m.soChang } })
  })
  it('bài cũ: chiTiet KHÔNG có caNhan/chuaChot (lịch lô như trước)', async () => {
    gio(BAY_GIO)
    const d = dung()
    await goiWorker(worker, d.env, '/btvn/giao', { maCa: 'CA1', maDe: 'DE1', hanNop: HAN }, true)
    const lo = viecLo(await kh(d))[0]!
    expect(lo.chiTiet).not.toHaveProperty('caNhan')
    expect(lo.chiTiet).not.toHaveProperty('chuaChot')
  })
})
