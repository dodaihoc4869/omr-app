// @vitest-environment node
// ĐỆM 30 GIÂY của bảng Thi đua theo LỚP (Boss 21/09: truy vấn đọc lớn nhất, 3,1 triệu dòng/giờ): mọi em cùng lớp dùng chung một lần đọc BẢNG trong 30 giây; hết hạn ⇒ đọc lại; lớp khác không lẫn; kho mức MÔ-ĐUN khoá chuỗi (không theo env.DB);
// SỐ CỦA CHÍNH EM luôn TƯƠI (Boss: thầy phàn nàn thẻ Hôm nay ≠ ô Thi đua) — dòng của em được đọc lại riêng mỗi lần và ghi đè; số của BẠN cùng lớp chậm nhất 30 giây; đệm không đổi số liệu (cùng kết quả khi đệm trống).
import { beforeEach, describe, expect, it } from 'vitest'
import { DEM_THI_DUA_MS, docLopHomNay, tinhBangThiDua, xoaDemThiDua } from '../server/src/thi-dua-hom-nay'
import { docCauDaLamHomNay } from '../server/src/cau-da-lam'
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
  it('hai em cùng lớp trong 30 giây ⇒ MỘT lần đọc BẢNG lớp; số CỦA BẠN chỉ đổi khi hết hạn, số CỦA CHÍNH EM luôn tươi', async () => {
    const d = dung(); await lam(d, 'A1', 'Q1', '13:00:00'); const dem = demDoc(d)
    expect(await soCauCua(d, 'A1', NOW)).toBe(1); expect(dem()).toBe(1)                     // lần đầu (đệm trống): đọc bảng lớp (1); bảng vừa đếm ⇒ số của em đã tươi, khỏi đọc lại
    await lam(d, 'A1', 'Q2', '14:00:00')                                                   // A1 làm thêm một câu TRONG cửa sổ đệm
    expect(await soCauCua(d, 'A1', NOW + 10_000)).toBe(2); expect(dem()).toBe(2)            // em thấy NGAY (= soCauHienThi), bảng lớp vẫn từ đệm (chỉ +1 lần đọc tươi riêng em)
    const banA1 = (await docLopHomNay(d.env, 'A2', NOW + 12_000, MOC))!.thanhVien.find((x) => x.sbd === 'A1')!
    expect(banA1.soCau).toBe(1)                                                            // A2 nhìn dòng của A1: số CŨ trong đệm (chậm ≤ 30 giây)
    expect(await soCauCua(d, 'A1', NOW + DEM_THI_DUA_MS - 1)).toBe(2)
    const mo = await docLopHomNay(d.env, 'A2', NOW + DEM_THI_DUA_MS, MOC)                  // hết hạn ⇒ đọc lại cả bảng
    expect(mo!.thanhVien.find((x) => x.sbd === 'A1')!.soCau).toBe(2)
  })

  it('số tươi của em = soCauHienThi của thẻ Hôm nay (một định nghĩa) NGAY sau khi vừa làm thêm, dù bảng lớp còn đệm; xếp hạng tính trên dòng đã ghi đè', async () => {
    const d = dung(); await lam(d, 'A1', 'Q1', '13:00:00'); await lam(d, 'A2', 'Q7', '13:05:00'); await lam(d, 'A2', 'Q8', '13:06:00')
    let lop = (await docLopHomNay(d.env, 'A1', NOW, MOC))!.thanhVien
    expect(lop.find((x) => x.sbd === 'A1')!.soCau).toBe(1)
    for (const q of ['Q2', 'Q3', 'Q4']) await lam(d, 'A1', q, '14:00:00')                    // A1 vượt A2 (2 câu) trong lúc đệm còn hạn
    lop = (await docLopHomNay(d.env, 'A1', NOW + 5000, MOC))!.thanhVien
    const chuan = (await docCauDaLamHomNay(d.env, ['A1'], NOW + 5000, MOC))!.get('A1')!.soCau
    expect(lop.find((x) => x.sbd === 'A1')!.soCau).toBe(chuan); expect(chuan).toBe(4)
    expect(lop.find((x) => x.sbd === 'A2')!.soCau).toBe(2)
    const bang = tinhBangThiDua(lop, 'A1')
    expect(bang.cuaEm).toMatchObject({ soCau: 4, hang: 1 })                                 // hạng tính lại: A1 (4) đứng trên A2 (2)
  })

  it('lớp khác ⇒ đệm riêng; xoaDemThiDua() bắt đọc lại; giờ lùi (đồng hồ) không dùng đệm', async () => {
    const d = dung(); await lam(d, 'A1', 'Q1', '13:00:00'); await lam(d, 'B1', 'Q9', '13:00:00'); const dem = demDoc(d)
    await soCauCua(d, 'A1', NOW); await soCauCua(d, 'B1', NOW + 1000); expect(dem()).toBe(2)   // mỗi lớp một lần đọc bảng (đệm riêng, không dùng chung)
    xoaDemThiDua(); await soCauCua(d, 'A1', NOW + 2000); expect(dem()).toBe(3)               // đệm bị xoá ⇒ đọc lại bảng
    await lam(d, 'A2', 'Q5', '14:00:00')                                                     // bạn A2 làm thêm 1 câu sau khi đệm ghi
    const luiGio = (await docLopHomNay(d.env, 'A1', NOW - 60_000, MOC))!.thanhVien
    expect(luiGio.find((x) => x.sbd === 'A2')!.soCau).toBe(1); expect(dem()).toBe(4)          // nowMs < lúc đệm ⇒ không tin đệm: thấy số MỚI của bạn (đệm sẽ còn 0), đọc lại bảng
  })

  it('hạn đệm đúng 30 giây (Boss chốt)', () => { expect(DEM_THI_DUA_MS).toBe(30_000) })

  it('qua nửa đêm giờ VN trong cửa sổ đệm ⇒ KHÔNG dùng bảng của ngày cũ (mốc hiển thị đứng yên nhiều ngày, khoá phải có ngày)', async () => {
    const d = dung(); await lam(d, 'A1', 'Q1', '23:50:00'); const dem = demDoc(d)
    const truoc = VN('2026-09-22T23:59:58'), sau = VN('2026-09-23T00:00:03')
    expect(await soCauCua(d, 'A1', truoc)).toBe(1); expect(dem()).toBe(1)
    expect(await soCauCua(d, 'A2', sau)).toBe(0); expect(dem()).toBe(2)                        // ngày mới ⇒ đọc lại bảng dù mới 5 giây
    expect((await docLopHomNay(d.env, 'A2', sau, MOC))!.thanhVien.find((x) => x.sbd === 'A1')!.soCau).toBe(0) // A1 hôm qua có 1 câu, hôm nay 0
  })

  it('em đổi tên trong cửa sổ đệm ⇒ bảng đọc lại (khoá có tên), không giữ tên cũ', async () => {
    const d = dung(); await lam(d, 'A1', 'Q1', '13:00:00'); const dem = demDoc(d)
    await docLopHomNay(d.env, 'A2', NOW, MOC); expect(dem()).toBe(1)
    d.sql.prepare("UPDATE hoc_sinh SET ho_ten = 'Em Mới' WHERE sbd = 'A1'").run()
    const b = (await docLopHomNay(d.env, 'A2', NOW + 3000, MOC))!.thanhVien.find((x) => x.sbd === 'A1')!
    expect(b.hoTen).toBe('Em Mới'); expect(dem()).toBe(2)
  })

  it('dựng D1 giả mới (taoD1That) xoá đệm mô-đun: hai D1 cùng tên lớp, cùng giờ KHÔNG lẫn', async () => {
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
