// @vitest-environment node
// ĐỆM 30 GIÂY của bảng Thi đua theo LỚP (Boss 21/09: truy vấn đọc lớn nhất, 3,1 triệu dòng/giờ): mọi em cùng lớp dùng chung một lần đọc trong 30 giây; hết hạn ⇒ đọc lại; lớp khác / D1 khác không lẫn; đệm không đổi số liệu (cùng kết quả khi đệm trống).
import { beforeEach, describe, expect, it } from 'vitest'
import { DEM_THI_DUA_MS, docLopHomNay, xoaDemThiDua } from '../server/src/thi-dua-hom-nay'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { giaiMocHienThi } from '../server/src/moc-no'
import { taoD1That, type D1That } from './_d1-that'

const VN = (s: string): number => Date.parse(`${s}+07:00`)
const NOW = VN('2026-09-22T15:00:00')
const MOC = giaiMocHienThi('2026-09-22T05:00:00.000Z')
beforeEach(() => xoaDemThiDua())
function dung(): D1That {
  const d = taoD1That()
  for (const [s, lop] of [['A1', '12'], ['A2', '12'], ['B1', '11']] as const) d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,?,'mk','x')").run(s, `Em ${s}`, lop)
  return d
}
const lam = (d: D1That, sbd: string, qid: string, gio: string) => ghiSuKien(d.env, [{ nguon: 'on_lai', maNguon: 'm', sbd, qid, lan: 1, ketQua: 1, luc: new Date(VN(`2026-09-22T${gio}`)).toISOString() }])
/** Đếm số lần đọc bảng số câu của lớp (truy vấn su_kien_hoc của Thi đua). */
function demDoc(d: D1That): () => number {
  let n = 0
  const goc = d.env.DB.prepare.bind(d.env.DB)
  d.env.DB.prepare = ((q: string) => { if (/GROUP BY sbd, ngay_vn, qid/.test(q)) n++; return goc(q) }) as typeof d.env.DB.prepare
  return () => n
}
const soCauCua = async (d: D1That, sbd: string, t: number) => (await docLopHomNay(d.env, sbd, t, MOC))!.thanhVien.find((x) => x.sbd === sbd)!.soCau

describe('đệm Thi đua theo lớp', () => {
  it('hai em cùng lớp trong 30 giây ⇒ MỘT lần đọc; sau 30 giây ⇒ đọc lại; số mới chỉ hiện khi đệm hết hạn', async () => {
    const d = dung(); await lam(d, 'A1', 'Q1', '13:00:00'); const dem = demDoc(d)
    expect(await soCauCua(d, 'A1', NOW)).toBe(1); expect(dem()).toBe(1)
    await lam(d, 'A1', 'Q2', '14:00:00')
    expect(await soCauCua(d, 'A2', NOW + 10_000)).toBe(0); expect(dem()).toBe(1)          // em cùng lớp: dùng đệm (bảng còn cũ)
    expect(await soCauCua(d, 'A1', NOW + DEM_THI_DUA_MS - 1)).toBe(1); expect(dem()).toBe(1) // sát hạn vẫn đệm
    expect(await soCauCua(d, 'A1', NOW + DEM_THI_DUA_MS)).toBe(2); expect(dem()).toBe(2)  // hết hạn ⇒ đọc lại, thấy câu mới
  })

  it('lớp khác ⇒ đệm riêng; xoaDemThiDua() bắt đọc lại; giờ lùi (đồng hồ) không dùng đệm', async () => {
    const d = dung(); await lam(d, 'A1', 'Q1', '13:00:00'); await lam(d, 'B1', 'Q9', '13:00:00'); const dem = demDoc(d)
    await soCauCua(d, 'A1', NOW); await soCauCua(d, 'B1', NOW + 1000); expect(dem()).toBe(2)
    xoaDemThiDua(); await soCauCua(d, 'A1', NOW + 2000); expect(dem()).toBe(3)
    await soCauCua(d, 'A1', NOW - 60_000); expect(dem()).toBe(4) // nowMs < lúc đệm ⇒ không tin đệm
  })

  it('hai D1 khác nhau (cùng tên lớp, cùng giờ) KHÔNG lẫn đệm của nhau', async () => {
    const a = dung(), b = dung(); await lam(a, 'A1', 'Q1', '13:00:00'); await lam(b, 'A1', 'Q1', '13:00:00'); await lam(b, 'A1', 'Q2', '13:05:00')
    expect(await soCauCua(a, 'A1', NOW)).toBe(1)
    expect(await soCauCua(b, 'A1', NOW)).toBe(2)
  })

  it('đệm không đổi số liệu: kết quả đệm = kết quả đọc mới (cùng thanhVien)', async () => {
    const d = dung(); await lam(d, 'A1', 'Q1', '13:00:00'); await lam(d, 'A2', 'Q2', '13:10:00')
    const dau = (await docLopHomNay(d.env, 'A1', NOW, MOC))!.thanhVien
    const dem = (await docLopHomNay(d.env, 'A2', NOW + 5000, MOC))!.thanhVien
    xoaDemThiDua()
    const moi = (await docLopHomNay(d.env, 'A2', NOW + 5000, MOC))!.thanhVien
    expect(dem).toEqual(dau); expect(dem).toEqual(moi)
  })
})
