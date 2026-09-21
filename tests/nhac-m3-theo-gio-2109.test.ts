// @vitest-environment node
// NHẮC M3 THEO GIỜ (W3 · Dồn về đích, prompt CODE 3): mốc M3 "chậm ≥ 2 chặng" không còn cố định 20:00 mà gửi ĐÚNG GIỜ CẦN = 30 phút trước `batDauMuonNhat` của tối đó
// (kế hoạch về đích `docVeDichCuaEm`), trong khung 07:00–21:30 và trần thông báo; lời: "Tối nay em cần khoảng N phút để về đúng nhịp … Bắt đầu trước HH:MM nhé." M1, M2, M4 giữ.
// Không tính được kế hoạch ⇒ giữ mốc 20:00 + lời cũ. SQLite thật; `docVeDichCuaEm` bọc bằng vi.mock để dựng các ca hiếm.
import { afterEach, describe, expect, it, vi } from 'vitest'

const moc = vi.hoisted(() => ({ ghiDe: null as null | ((env: unknown, sbd: string, now: number) => Promise<unknown>), soLan: 0 }))
vi.mock('../server/src/ve-dich-d1', async (goc) => {
  const m = await goc<typeof import('../server/src/ve-dich-d1')>()
  return { ...m, docVeDichCuaEm: async (env: never, sbd: string, now?: number) => { moc.soLan++; return moc.ghiDe ? moc.ghiDe(env, sbd, now ?? Date.now()) : m.docVeDichCuaEm(env, sbd, now) } }
})
import { denGioNhacM3, loiEmTheoMoc, nhacTuDong, CAU_HINH_MAC_DINH, PHUT_NHAC_M3_TRUOC_GIO_BAT_DAU, TOI_DA_EM_TINH_GIO_M3, type DauVaoLoi } from '../server/src/nhac-tu-dong'
import type { D1That } from './_d1-that'
import { BAY_GIO, DAP_AN_DUNG, boCuaEm, cauThay, dung, giao, gio, mo, nopChang } from './_btvn-nang-do-mau'

afterEach(() => { vi.useRealTimers(); moc.ghiDe = null; moc.soLan = 0 })
const VN = (ngay: string, hhmm: string): number => Date.parse(`${ngay}T${hhmm}:00+07:00`)
const chay = (d: D1That, ngay: string, hhmm: string) => nhacTuDong(d.env, VN(ngay, hhmm), { boQuaChiemLuot: true })
const dongsM3 = (d: D1That) => d.sql.prepare("SELECT sbd, loi_em, moc FROM canh_bao_thay WHERE moc = 'M3' ORDER BY sbd").all() as { sbd: string; loi_em: string }[]
const NGAY = '2026-09-25' // hạn 23:59 thứ Ba 29/09 — còn nhiều ngày; S1 chưa làm chặng nào ⇒ chậm ≥ 2

/** Bài cá nhân hoá hạn xa, S1 (và S2 nếu `soEm` = 2) đã mở bài nhưng chưa làm chặng nào; tối 25/09 đã chậm ≥ 2 chặng. */
async function baiCham(soEm = 1): Promise<D1That> {
  gio(BAY_GIO)
  const d = dung(soEm)
  for (let i = 1; i <= soEm; i++) d.sql.prepare("INSERT OR REPLACE INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,'12A','mk','x')").run(`S${i}`, `Em ${i}`)
  expect((await giao(d, { cau: cauThay(), hanNop: '2026-09-29T16:59:00.000Z' })).ok).toBe(true)
  d.sql.exec("UPDATE btvn_em SET ho_ten = 'Em ' || substr(sbd, 2)")
  for (let i = 1; i <= soEm; i++) await mo(d, `S${i}`)
  return d
}
/** Kế hoạch giả: tối nay em cần `phut` phút, bắt đầu muộn nhất `bd` (ISO +07:00) cho MỌI bài của em. */
const keHoachGia = (bd: string | null, phut = 36) => async (env: unknown, sbd: string, now: number) => {
  const that = await (await vi.importActual<typeof import('../server/src/ve-dich-d1')>('../server/src/ve-dich-d1')).docVeDichCuaEm(env as never, sbd, now)
  return { ...that, veDich: that.veDich.map((b) => ({ ...b, toiNay: bd ? { soChang: 2, soCau: 24, phut, batDauMuonNhat: bd } : null })) }
}

describe('denGioNhacM3 (hàm thuần): 30 phút trước giờ bắt đầu muộn nhất, lượt CUỐI trong khung thì nhắc luôn, qua giờ thì thôi', () => {
  const c = CAU_HINH_MAC_DINH // khung 07:00–21:30, lượt 30 phút
  const den = (ngayGio: string, bd: string) => denGioNhacM3(VN(NGAY, ngayGio), VN(NGAY, bd), c)
  it('giờ bắt đầu 21:30: lượt 21:00 nhắc (đúng 30 phút trước); lượt 20:30 chưa; lượt 21:30 (đã tới giờ) không nhắc nữa', () => {
    expect(den('21:00', '21:30')).toBe(true)
    expect(den('20:30', '21:30')).toBe(false)
    expect(den('21:30', '21:30')).toBe(false)
  })
  it('giờ bắt đầu lẻ 21:17: lượt 21:00 nhắc (trong 30 phút trước); lượt 20:30 chưa', () => {
    expect(den('21:00', '21:17')).toBe(true)
    expect(den('20:30', '21:17')).toBe(false)
  })
  it('giờ bắt đầu SAU khung (22:10): lượt 21:00 chưa (còn lượt 21:30), lượt 21:30 là lượt CUỐI ⇒ nhắc luôn', () => {
    expect(den('21:00', '22:10')).toBe(false)
    expect(den('21:30', '22:10')).toBe(true)
  })
  it('giờ bắt đầu sáng sớm 07:20: lượt đầu 07:00 nhắc (06:50 nằm ngoài khung, không bỏ mất nhắc)', () => {
    expect(den('07:00', '07:20')).toBe(true)
  })
  it('giờ hỏng ⇒ false; đúng hằng số 30 phút', () => {
    expect(denGioNhacM3(VN(NGAY, '21:00'), NaN, c)).toBe(false)
    expect(PHUT_NHAC_M3_TRUOC_GIO_BAT_DAU).toBe(30)
  })
})

describe('lời M3 theo giờ', () => {
  const x = (o: Partial<DauVaoLoi> = {}): DauVaoLoi => ({ tenBai: 'Este – lipid', hanIso: '2026-09-29T16:59:00.000Z', nowMs: VN(NGAY, '21:00'), hoTen: 'Em Một', chamChang: 2, ...o })
  it('có toiNay ⇒ "Tối nay em cần khoảng N phút để về đúng nhịp của Bài tập về nhà «…». Bắt đầu trước HH:MM nhé."; vắng ⇒ lời cũ (chậm N chặng)', () => {
    expect(loiEmTheoMoc('M3', x({ toiNay: { phut: 36, batDauGio: '21:30' } }))).toBe('Tối nay em cần khoảng 36 phút để về đúng nhịp của Bài tập về nhà «Este – lipid». Bắt đầu trước 21:30 nhé.')
    expect(loiEmTheoMoc('M3', x({ soCauChangKe: 6 }))).toBe('Em đang chậm 2 chặng so với lịch của Bài tập về nhà «Este – lipid». Tối nay làm một chặng (6 câu) là bắt kịp.')
  })
})

describe('nhắc M3 chạy thật trên D1', () => {
  it('kế hoạch bắt đầu muộn nhất 21:30, cần 36 phút: 20:30 KHÔNG nhắc; 21:00 nhắc đúng lời với 36 phút và 21:30; 21:30 (đã tới giờ) không thêm', async () => {
    const d = await baiCham(); moc.ghiDe = keHoachGia(`${NGAY}T21:30:00+07:00`, 36)
    expect((await chay(d, NGAY, '20:30')).theoMoc ?? {}).not.toHaveProperty('M3')
    expect(dongsM3(d)).toEqual([])
    const r = await chay(d, NGAY, '21:00')
    expect(r.theoMoc).toMatchObject({ M3: 1 })
    expect(dongsM3(d).map((x) => x.loi_em)).toEqual([expect.stringMatching(/^Tối nay em cần khoảng 36 phút để về đúng nhịp của Bài tập về nhà «.+»\. Bắt đầu trước 21:30 nhé\.$/)])
    await chay(d, NGAY, '21:30')
    expect(dongsM3(d)).toHaveLength(1) // idempotent + đã qua giờ
  })

  it('giờ bắt đầu muộn nhất sau khung (22:10) ⇒ lượt cuối 21:30 nhắc luôn; 21:00 chưa', async () => {
    const d = await baiCham(); moc.ghiDe = keHoachGia(`${NGAY}T22:10:00+07:00`, 40)
    await chay(d, NGAY, '21:00'); expect(dongsM3(d)).toEqual([])
    await chay(d, NGAY, '21:30')
    expect(dongsM3(d).map((x) => x.loi_em)).toEqual([expect.stringContaining('Bắt đầu trước 22:10 nhé.')])
  })

  it('tối nay kế hoạch KHÔNG xếp việc (toiNay = null) ⇒ không nhắc M3 (không có gì để nhắc)', async () => {
    const d = await baiCham(); moc.ghiDe = keHoachGia(null)
    for (const g of ['20:00', '21:00', '21:30']) await chay(d, NGAY, g)
    expect(dongsM3(d)).toEqual([])
  })

  it('KHÔNG tính được kế hoạch (ném lỗi) ⇒ giữ mốc 20:00 + lời cũ "Em đang chậm N chặng…"; 19:30 chưa nhắc', async () => {
    const d = await baiCham(); moc.ghiDe = async () => { throw new Error('D1 lỗi giả') }
    await chay(d, NGAY, '19:30'); expect(dongsM3(d)).toEqual([])
    const r = await chay(d, NGAY, '20:00')
    expect(r.theoMoc).toMatchObject({ M3: 1 })
    expect(dongsM3(d)[0]!.loi_em).toMatch(/^Em đang chậm \d+ chặng so với lịch của Bài tập về nhà «.+»\. Tối nay làm một chặng/)
  })

  it('kế hoạch trả về mà KHÔNG có bài này (bài giao trước ngày mốc bị loại) ⇒ KHÔNG nhắc M3 (không phải "không tính được")', async () => {
    const d = await baiCham(); moc.ghiDe = async () => ({ no: { theoNgay: [], tongCau: 0, tongPhut: 0 }, veDich: [] })
    for (const g of ['20:00', '21:00', '21:30']) await chay(d, NGAY, g)
    expect(dongsM3(d)).toEqual([])
  })

  it('chỉ tính kế hoạch cho em CHẬM ≥ 2 chặng: em đúng lịch không bị đọc (0 lần gọi), em chậm bị đọc 1 lần', async () => {
    const d = await baiCham(2)
    const so = Number((d.sql.prepare("SELECT so_chang FROM btvn_em WHERE sbd = 'S1'").get() as { so_chang: number }).so_chang)
    d.sql.prepare("UPDATE btvn_em SET lo_da_xong = ? WHERE sbd = 'S2'").run(so) // S2 đã xong hết chặng theo lịch
    moc.ghiDe = keHoachGia(`${NGAY}T21:30:00+07:00`)
    moc.soLan = 0
    await chay(d, NGAY, '21:00')
    expect(dongsM3(d).map((x) => x.sbd)).toEqual(['S1'])
    expect(moc.soLan).toBe(1)
    expect(TOI_DA_EM_TINH_GIO_M3).toBeGreaterThanOrEqual(50)
    expect(TOI_DA_EM_TINH_GIO_M3 * 6).toBeLessThanOrEqual(600) // 6 truy vấn/em: một lượt cron không quá 600 truy vấn cho việc này
  })

  it('"chậm" tính theo mốc GỐC của lịch: chặng MỞ SỚM chưa làm không làm em thành "chậm ≥ 2 chặng" (mở sớm hôm nay, chặng kế gốc là 00:00 mai)', async () => {
    const d = await baiCham(); moc.ghiDe = keHoachGia('2026-09-22T21:30:00+07:00')
    // hôm BAY_GIO (22/09): làm đúng chặng 0 ⇒ chặng 1 MỞ SỚM (mốc gốc 00:00 23/09); rồi đặt lại lo_da_xong = 0 để mô phỏng em chưa làm chặng nào
    const q0 = boCuaEm(d).filter((x) => x.chang === 0).map((x) => x.qid)
    expect(await nopChang(d, 0, Object.fromEntries(q0.map((q) => [q, DAP_AN_DUNG(q)]))) as any).toMatchObject({ ok: true, moSom: { duoc: true } })
    d.sql.prepare("UPDATE btvn_em SET lo_da_xong = 0 WHERE sbd = 'S1'").run()
    // 21:00 CÙNG ngày 22/09: theo lịch gốc mới có chặng 0 (chậm 1); nếu tính mốc mở sớm thì thành chặng 0 + 1 (chậm 2 ⇒ nhắc oan)
    await chay(d, '2026-09-22', '21:00')
    expect(dongsM3(d)).toEqual([])
    // đối chứng: sang 23/09 lịch gốc đã có chặng 0 + 1 ⇒ chậm 2 ⇒ được nhắc
    moc.ghiDe = keHoachGia('2026-09-23T21:30:00+07:00')
    await chay(d, '2026-09-23', '21:00')
    expect(dongsM3(d)).toHaveLength(1)
  })

  it('cờ mốc M3 tắt ⇒ không nhắc và không đọc kế hoạch', async () => {
    const d = await baiCham(); moc.ghiDe = keHoachGia(`${NGAY}T21:30:00+07:00`)
    d.sql.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('canh_bao_tu_dong',?,'x')").run(JSON.stringify({ bat: true, mocTat: ['M3'] }))
    moc.soLan = 0
    await chay(d, NGAY, '21:00')
    expect(dongsM3(d)).toEqual([]); expect(moc.soLan).toBe(0)
  })
})
