// SINH TỒN · VÁN THẮNG THEO ĐỘI (14/11, bản vẽ 17 «Đội Kali thắng 9 / 14 ván tuần này»): chỉ PHÒNG CHỜ CA (đội = đội cả kỳ) đếm; phòng LIVE không.
// Đội nhất ván theo điểm đội (hoà ⇒ mọi đội hoà thắng; 0-0-0-0 ⇒ không ai), mọi đội có em thật +1 ván chơi. Ghi CÙNG batch lô đang có vào `st_tuan_doi`
// theo phạm vi `k:<khối>` / `l:<lớp>` (một ván một lần mỗi phạm vi); `/gv/bpu/st-thi-dua` trả `van` / `thang` (đọc song song, D1 giả chạy SQL thật).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import { doiNhatVan, MaySinhTon } from '../server/src/sinh-ton-may-chu'
import { PhongSinhTonCa, type KetNoi, type VeDau } from '../server/src/sinh-ton-ca'
import { ghiCuoiVanSinhTon, sinhTonDuLieu, taoBang, taoBangDoiTuan, SQL_SINH_TON_DOI_TUAN, type KetQuaVanDoi, type KetQuaVanEm } from '../server/src/sinh-ton-du-lieu'
import { khoiTuLop } from '../server/src/live-khoi'
import { VAN_CHOI_MS, VAN_MS } from '../src/lib/live-khoi/sinh-ton-loi'

const VN = (s: string) => Date.parse(`${s}+07:00`)
const T0 = Math.ceil(Date.UTC(2026, 10, 14, 12) / VAN_MS) * VAN_MS + 10_000
const NGHI = T0 - 10_000 + VAN_CHOI_MS + 100

describe('đội nhất ván', () => {
  it('điểm cao nhất thắng; hoà nhất ⇒ mọi đội hoà; cả bốn 0 ⇒ không ai', () => {
    expect(doiNhatVan([3, 9, 1, 0])).toEqual([1])
    expect(doiNhatVan([7, 2, 7, 7])).toEqual([0, 2, 3])
    expect(doiNhatVan([0, 0, 0, 0])).toEqual([])
  })
})

/** Chạy máy trò: nhịp 250 ms, mỗi em gửi gói mỗi giây; `truocNghi` chạy ở nhịp cuối trước giờ nghỉ (đặt điểm đội). */
function chayVan(m: MaySinhTon, em: [string, number][], truocNghi: () => void): void {
  for (let t = T0; t < NGHI + 2000; t += 250) {
    if (t % 1000 === 0) em.forEach(([id, doi], i) => m.nhan(id, doi, { p: [800 + 20 * i, 500, 60, 1] }, t))
    if (t + 250 >= NGHI && t < NGHI) truocNghi()
    m.nhip(t + 1)
  }
}
const datDiem = (m: MaySinhTon, d: number[]) => { (m as unknown as { diem: number[] }).diem = d }

describe('máy trò: chỉ phòng ca gom ván theo đội', () => {
  it('phòng ca (`demDoi`): một ván ⇒ một mục — đội nhất + em thật kèm đội; rút sạch; `dung()` không xoá phần chờ ghi', () => {
    const m = new MaySinhTon(() => 0.5)
    m.demDoi = true
    chayVan(m, [['S1', 0], ['S2', 1], ['S3', 1]], () => datDiem(m, [10, 900, 20, 0]))
    m.dung()
    const vd = m.layVanDoi()
    expect(vd).toHaveLength(1)
    expect(vd[0]!.thang).toEqual([1])
    expect(new Map(vd[0]!.em)).toEqual(new Map([['S1', 0], ['S2', 1], ['S3', 1]]))
    expect(vd[0]!.em.every(([s]) => !s.startsWith('~'))).toBe(true)
    expect(m.layVanDoi()).toEqual([])
  })
  it('phòng LIVE (mặc định): không gom gì', () => {
    const m = new MaySinhTon(() => 0.5)
    chayVan(m, [['S1', 0], ['S2', 1]], () => datDiem(m, [10, 900, 20, 0]))
    expect(m.layThongKe().length).toBeGreaterThan(0)
    expect(m.layVanDoi()).toEqual([])
  })
  it('phòng ca chuyển `vanDoi` CÙNG lần ghi thống kê', () => {
    let gio = T0
    const ghi = vi.fn<(ma: string, ds: readonly KetQuaVanEm[], vd?: readonly KetQuaVanDoi[]) => void>()
    const p = new PhongSinhTonCa(() => gio, () => 0.5, 0, { ghi })
    const kn = (): KetNoi => ({ gui() {}, dong() {}, ghiKem() {} })
    const ve = (s: string): VeDau => ({ c: '123456', s, t: s, h: T0 + 3_600_000 })
    const a = kn(), b = kn()
    p.vao(a, ve('S1'), { c: '', dh: -1, doi: 2 }); p.vao(b, ve('S2'), { c: '', dh: -1, doi: 3 })
    for (; gio < NGHI + 1000; gio += 250) {
      if (gio % 1000 < 250) { p.nhan(a, JSON.stringify({ t: 'st', x: { p: [800, 500, 60, 1] } })); p.nhan(b, JSON.stringify({ t: 'st', x: { p: [820, 500, 60, 1] } })) }
      p.nhip()
    }
    p.dongTatCa('bat-dau')
    expect(ghi).toHaveBeenCalledTimes(1)
    const vd = ghi.mock.calls[0]![2]!
    expect(vd).toHaveLength(1)
    expect(new Map(vd[0]!.em)).toEqual(new Map([['S1', 2], ['S2', 3]]))
  })
})

describe('máy chủ: st_tuan_doi (D1 giả chạy SQL thật)', () => {
  let d: D1That
  const nay = VN('2026-11-13T19:00:00')
  const themEm = (sbd: string, lop: string, tenLop = '') =>
    d.sql.prepare('INSERT INTO hoc_sinh (sbd, ho_ten, lop, ten_lop, cap_nhat_luc) VALUES (?, ?, ?, ?, ?)').run(sbd, `Em ${sbd}`, lop, tenLop, '2026-11-01')
  const dong = () => d.sql.prepare('SELECT pham_vi, doi, van, thang FROM st_tuan_doi ORDER BY pham_vi, doi').all() as { pham_vi: string; doi: number; van: number; thang: number }[]
  const goi = (b: Record<string, unknown>) => sinhTonDuLieu(d.env, '/gv/bpu/st-thi-dua', b, true)
  beforeEach(() => {
    d = taoD1That()
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(nay)
    themEm('A1', '11A2'); themEm('A2', '11A2'); themEm('B1', '11A3'); themEm('C1', '12A1')
  })
  afterEach(() => { vi.useRealTimers() })

  it('đếm thắng / hoà / chơi theo phạm vi; hai lớp cùng khối chung đội ⇒ khối +1 một lần; máy bù + Thầy bỏ; CÙNG một batch', async () => {
    await Promise.all([taoBang(d.env), taoBangDoiTuan(d.env)]) // DDL một lần mỗi isolate (chỉ lần đầu)
    const batch = vi.spyOn(d.env.DB, 'batch')
    const em: KetQuaVanEm[] = ['A1', 'A2', 'B1', 'C1'].map((id) => ({ id, van: 2 }))
    await ghiCuoiVanSinhTon(d.env, { ma: 'ca:1:0', luc: nay, idThay: 'THAY' }, em, [
      // Ván 1: Kali (1) nhất; A1 + B1 (hai lớp khối 11) cùng đội Kali.
      { thang: [1], em: [['A1', 1], ['B1', 1], ['A2', 0], ['C1', 1], ['~may', 2], ['THAY', 3]] },
      // Ván 2: Natri (0) và Kali (1) hoà nhất.
      { thang: [0, 1], em: [['A1', 1], ['A2', 0], ['B1', 2]] },
    ])
    expect(batch).toHaveBeenCalledTimes(1) // ván theo đội đi CÙNG lô ghi cuối ván
    expect(batch.mock.calls[0]![0]).toHaveLength(4 + 2 + 1) // gán đội 4 em + st_tuan + st_thanh_tich + st_tuan_doi
    expect(dong()).toEqual([
      { pham_vi: 'k:11', doi: 0, van: 2, thang: 1 },
      { pham_vi: 'k:11', doi: 1, van: 2, thang: 2 }, // ván 1: A1 + B1 cùng Kali ⇒ một lần
      { pham_vi: 'k:11', doi: 2, van: 1, thang: 0 },
      { pham_vi: 'k:12', doi: 1, van: 1, thang: 1 },
      { pham_vi: 'l:11A2', doi: 0, van: 2, thang: 1 },
      { pham_vi: 'l:11A2', doi: 1, van: 2, thang: 2 },
      { pham_vi: 'l:11A3', doi: 1, van: 1, thang: 1 },
      { pham_vi: 'l:11A3', doi: 2, van: 1, thang: 0 },
      { pham_vi: 'l:12A1', doi: 1, van: 1, thang: 1 },
    ])
    // Lô sau cộng dồn.
    await ghiCuoiVanSinhTon(d.env, { ma: 'ca:1:0', luc: nay }, [{ id: 'A1', van: 1 }], [{ thang: [1], em: [['A1', 1]] }])
    expect(dong().find((r) => r.pham_vi === 'k:11' && r.doi === 1)).toEqual({ pham_vi: 'k:11', doi: 1, van: 3, thang: 3 })
  })

  it('phòng live (không truyền vanDoi) ⇒ không tạo / không ghi st_tuan_doi; lô có ván 0-0-0-0 ⇒ chơi +1, thắng 0', async () => {
    await ghiCuoiVanSinhTon(d.env, { ma: 'buoi-1', luc: nay }, [{ id: 'A1', ha: 3 }])
    expect((d.sql.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE name = 'st_tuan_doi'").get() as { n: number }).n).toBe(0)
    expect((await goi({ khoi: 11 }))).toMatchObject({ ok: true, van: [0, 0, 0, 0], thang: [0, 0, 0, 0] }) // bảng chưa có ⇒ rỗng
    await ghiCuoiVanSinhTon(d.env, { ma: 'ca:1:0', luc: nay }, [{ id: 'A1', van: 1 }], [{ thang: [], em: [['A1', 3]] }])
    expect(dong()).toEqual([{ pham_vi: 'k:11', doi: 3, van: 1, thang: 0 }, { pham_vi: 'l:11A2', doi: 3, van: 1, thang: 0 }])
  })

  it('đường thầy trả `van` / `thang` theo khối hoặc lớp, đọc song song (một đợt chờ)', async () => {
    await ghiCuoiVanSinhTon(d.env, { ma: 'ca:1:0', luc: nay }, [{ id: 'A1', van: 3 }, { id: 'B1', van: 3 }], [
      { thang: [1], em: [['A1', 1], ['B1', 0]] }, { thang: [1], em: [['A1', 1], ['B1', 0]] }, { thang: [0], em: [['A1', 1], ['B1', 0]] },
    ])
    const prepare = vi.spyOn(d.env.DB, 'prepare')
    const r = await goi({ khoi: 11 })
    expect(r).toMatchObject({ ok: true, van: [3, 3, 0, 0], thang: [1, 2, 0, 0] })
    expect(prepare).toHaveBeenCalledTimes(2) // hai tuần thi đua + ván theo đội, cùng Promise.all
    expect(await goi({ lop: '11A3' })).toMatchObject({ van: [3, 0, 0, 0], thang: [1, 0, 0, 0] })
    expect(await goi({ khoi: 12 })).toMatchObject({ van: [0, 0, 0, 0], thang: [0, 0, 0, 0] })
  })

  it('khối trong SQL khớp `khoiTuLop` (số 10/11/12 đầu tiên có viền; tên lớp trống ⇒ cột lop)', async () => {
    const ca: [string, string, string][] = [
      ['K1', '10A1', ''], ['K2', 'x', '11A10'], ['K3', 'x', '12A10'], ['K4', 'x', '12A11'], ['K5', 'x', 'Lớp 11 chuyên'], ['K6', '12A3', ''],
      ['K7', 'x', '110A'], ['K8', 'x', 'A'], ['K9', '10B', 'Toán 2'], ['K10', 'x', '10-11'],
    ]
    for (const [s, lop, ten] of ca) themEm(s, lop, ten)
    await ghiCuoiVanSinhTon(d.env, { ma: 'ca:1:0', luc: nay }, ca.map(([id]) => ({ id, van: 1 })), [{ thang: [0], em: ca.map(([s], i) => [s, i % 4] as [string, number]) }])
    const theoDoi = new Map(dong().filter((r) => r.pham_vi.startsWith('k:')).map((r) => [`${r.doi}:${r.pham_vi}`, r.van]))
    const mong = new Map<string, number>()
    ca.forEach(([, lop, ten], i) => { const k = khoiTuLop(ten || lop) ?? khoiTuLop(lop); if (k) mong.set(`${i % 4}:k:${k}`, 1) }) // một ván ⇒ mỗi (đội, khối) một lần
    expect(theoDoi).toEqual(mong)
  })

  it('bảng CHỈ-THÊM, khoá DDL riêng', () => {
    for (const s of SQL_SINH_TON_DOI_TUAN) expect(s).toMatch(/^CREATE (TABLE|INDEX) IF NOT EXISTS /)
  })
})
