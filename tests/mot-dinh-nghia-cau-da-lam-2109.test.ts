// @vitest-environment node
// BẤT BIẾN "MỘT ĐỊNH NGHĨA CÂU ĐÃ LÀM" (prompt-mot-dinh-nghia-cau-da-lam-2109.md §4): cùng một sổ học ⇒ thẻ Hôm nay = ô Thi đua = phụ huynh = ô nhiệt Bảng tin sống = Bảng tin (Σ) cho CÙNG một em.
// Một bộ dữ liệu, mỗi ca khó một dòng: câu TRƯỚC mốc, câu BỎ TRỐNG, câu LÀM LẠI 3 lần (kể cả khác nguồn / khác mã dạng), câu của HÔM QUA, hai em cùng một câu. Câu BỊ CHE ở phụ huynh: phần của Code 4 (ph-tat-ca-ve-con.ts) —
// bộ dữ liệu này KHÔNG có câu che; khi Code 4 đổi phụ huynh sang "gồm cả câu che" thì thêm ca che vào đây.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { xoaDemBangTinSong, gvBangTinSong } from '../server/src/gv-bang-tin-song'
import { gvBangTin } from '../server/src/gv-bang-tin'
import { docLopHomNay } from '../server/src/thi-dua-hom-nay'
import { lapVaLuuKeHoach } from '../server/src/ke-hoach-ngay-d1'
import { phTatCaVeCon } from '../server/src/ph-tat-ca-ve-con'
import { docCauDaLamHomNay } from '../server/src/cau-da-lam'
import { gvEmToanCanh } from '../server/src/gv-hom-nay-v2'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { giaiMocHienThi } from '../server/src/moc-no'
import { taoD1That, type D1That } from './_d1-that'

const VN = (s: string): number => Date.parse(`${s}+07:00`)
const NOW = VN('2026-09-22T15:00:00')
const MOC_ISO = '2026-09-22T05:00:00.000Z' // 12:00 VN hôm nay
beforeEach(() => { xoaDemBangTinSong(); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })

/** S1 (12 - Lớp Thường): Q1 trước mốc · Q2 đúng hai lần · Q3 sai rồi đúng (khác nguồn, khác mã dạng) · Q4 sai 3 lần · Q5 bỏ trống · Q6 hôm qua ⇒ 3 câu khác nhau, 2 câu đúng.
 *  S2: chỉ câu trước mốc ⇒ 0. S3: Q7 đúng rồi sai, Q2 sai ⇒ 2 câu, 1 đúng. S4 (lớp Tinh Hoa): 10 câu khác nhau, 7 đúng ⇒ vào "Dẫn đầu". */
async function dung(): Promise<D1That> {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('hien_thi_tu',?,'x')").run(MOC_ISO)
  for (const [s, lop] of [['S1', null], ['S2', null], ['S3', null], ['S4', '12 - Tinh Hoa']] as const) d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,ten_lop,mat_khau,cap_nhat_luc) VALUES(?,?,'12',?,'mk','x')").run(s, `Em ${s}`, lop)
  const su = (sbd: string, qid: string, gio: string, ketQua: 0 | 1 | null, ngay = '2026-09-22', nguon: 'on_lai' | 'luyen' | 'btvn' = 'on_lai') =>
    ({ nguon, maNguon: 'm', sbd, qid, lan: 1, ketQua, luc: new Date(VN(`${ngay}T${gio}`)).toISOString() })
  await ghiSuKien(d.env, [
    su('S1', 'Q1', '10:00:00', 1),
    su('S1', 'Q2', '13:00:00', 1), su('S1', 'Q2', '13:50:00', 1, undefined, 'luyen'),
    su('S1', 'Q3', '13:10:00', 0), su('S1', 'Q3', '13:20:00', 1, undefined, 'luyen'),
    su('S1', 'Q4', '13:30:00', 0), su('S1', 'Q4', '13:31:00', 0, undefined, 'luyen'), su('S1', 'Q4', '13:32:00', 0, undefined, 'btvn'),
    su('S1', 'Q5', '13:40:00', null),
    su('S1', 'Q6', '20:00:00', 1, '2026-09-21'),
    su('S2', 'Q1', '10:00:00', 1),
    su('S3', 'Q7', '14:00:00', 1), su('S3', 'Q7', '14:10:00', 0, undefined, 'luyen'), su('S3', 'Q2', '14:05:00', 0),
    ...Array.from({ length: 10 }, (_, i) => su('S4', `P${i}`, `13:${String(10 + i).padStart(2, '0')}:00`, i < 7 ? 1 : 0)),
  ])
  // Q3 của S1 mang HAI mã dạng trong cùng ngày (đo được trên D1 thật): không được cộng hai lần
  d.sql.prepare("UPDATE su_kien_hoc SET ma_dang = 'D.A' WHERE sbd = 'S1' AND qid = 'Q3' AND nguon = 'on_lai'").run()
  d.sql.prepare("UPDATE su_kien_hoc SET ma_dang = 'D.B' WHERE sbd = 'S1' AND qid = 'Q3' AND nguon = 'luyen'").run()
  return d
}
const CHUAN: Record<string, number> = { S1: 3, S3: 2, S4: 10 } // S2 = 0 (vắng)

describe('cùng một sổ ⇒ cùng một con số ở mọi nơi', () => {
  it('chuẩn (cau-da-lam.ts) = thẻ Hôm nay (kế hoạch) = ô Thi đua = phụ huynh = ô nhiệt Bảng tin sống, em nào cũng đúng', async () => {
    const d = await dung()
    const moc = giaiMocHienThi(MOC_ISO)
    const chuan = (await docCauDaLamHomNay(d.env, ['S1', 'S2', 'S3', 'S4'], NOW, moc))!
    expect(Object.fromEntries([...chuan].map(([s, v]) => [s, v.soCau]))).toEqual(CHUAN)

    const kh = await lapVaLuuKeHoach(d.env, ['S1', 'S2', 'S3', 'S4'], NOW)
    const song = (await gvBangTinSong(d.env, {}, NOW, { dem: false })).song as { nhiet: { sbd: string; soCau: number; soCauDung: number }[] }
    for (const s of ['S1', 'S2', 'S3', 'S4']) {
      const kv = CHUAN[s] ?? 0
      expect(kh.get(s)!.tienBo.soCauHienThi, `thẻ Hôm nay ${s}`).toBe(kv)
      expect(song.nhiet.find((x) => x.sbd === s)!.soCau, `ô nhiệt ${s}`).toBe(kv)
      const lop = await docLopHomNay(d.env, s, NOW, moc)
      expect(lop?.thanhVien.find((x) => x.sbd === s)?.soCau ?? 0, `Thi đua ${s}`).toBe(kv)
      const ph = (await phTatCaVeCon(d.env, { sbd: s }, NOW)) as { homNay?: { tongQuan?: { soCau?: number } } }
      expect(ph.homNay?.tongQuan?.soCau ?? 0, `phụ huynh ${s}`).toBe(kv)
    }
  })

  it('cả lớp: Bảng tin (nhip.soCau) = Bảng tin sống (nhip + Σ theoLop + Σ ô nhiệt + cuối tia 60) = Σ số từng em; soCauDung cùng khuôn (câu có ≥ 1 lần đúng)', async () => {
    const d = await dung()
    const tong = Object.values(CHUAN).reduce((a, b) => a + b, 0) // 15
    const bt = await gvBangTin(d.env, {}, NOW)
    expect(bt.ok).toBe(true)
    expect(bt.nhip).toMatchObject({ soCau: tong, soCauDung: 2 + 1 + 7, soEmHoc: 3 })
    const s = await gvBangTinSong(d.env, {}, NOW, { dem: false })
    const song = s.song as { theoLop: { soCau: number; soCauDung: number }[]; nhiet: { soCau: number; soCauDung: number }[]; tia60: { cau: number[]; tile: number[] }; nen: { soCau: number; soLuot: number }[]; danDau: { sbd: string; soCau: number }[] }
    expect(s.nhip).toMatchObject({ soCau: tong, soCauDung: 10, soEmHoc: 3, tiLeDung: 0.667 })
    expect(song.theoLop.reduce((a, x) => a + x.soCau, 0)).toBe(tong)
    expect(song.theoLop.reduce((a, x) => a + x.soCauDung, 0)).toBe(10)
    expect(song.nhiet.reduce((a, x) => a + x.soCau, 0)).toBe(tong)
    expect(song.tia60.cau[59]).toBe(tong)
    expect(song.tia60.tile[59]).toBe(66.67)
    expect(song.nen.reduce((a, x) => a + x.soCau, 0)).toBe(tong)
    expect(song.nen.reduce((a, x) => a + x.soLuot, 0)).toBe(20) // LƯỢT từ mốc: S1 7 (Q2×2, Q3×2, Q4×3) + S3 3 (Q7×2, Q2) + S4 10; câu làm lại CHỈ nằm ở soLuot
    expect(song.danDau).toEqual([{ sbd: 'S4', hoTen: 'Em S4', tenLop: '12 - Tinh Hoa', soCau: 10, tienBo: 0 }])
  })

  it('luật "dạng vấp" GIỮ số LƯỢT (em sai đi sai lại một câu vẫn là vấp) dù số "câu" hiển thị đếm câu khác nhau', async () => {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('hien_thi_tu',?,'x')").run(MOC_ISO)
    for (const s of ['V1', 'V2', 'V3']) d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,'12','mk','x')").run(s, `Em ${s}`)
    await ghiSuKien(d.env, ['V1', 'V2', 'V3'].flatMap((sbd, i) => [0, 1, 2].map((k) => ({ nguon: 'on_lai' as const, maNguon: 'm', sbd, qid: 'Z', lan: k + 1, ketQua: 0 as const, luc: new Date(VN(`2026-09-22T13:${10 + i}:${10 + k}`)).toISOString(), maDang: 'D.V' }))))
    const r = await gvBangTin(d.env, {}, NOW)
    expect(r.nhip).toMatchObject({ soCau: 3, soCauDung: 0, soEmHoc: 3 }) // mỗi em MỘT câu (làm 3 lượt)
    expect((r.dangVap as { ma?: string }[] | undefined)?.some((x) => x.ma === 'D.V') ?? false).toBe(true)
  })

  it('mốc CHUNG: cau_hinh.hien_thi_tu thắng bang_tin_tu ở Bảng tin (một nguồn với Thi đua / thẻ Hôm nay); chỉ có bang_tin_tu ⇒ dùng nó như cũ', async () => {
    const d = await dung()
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('bang_tin_tu','2026-09-22T00:00:00.000Z','x')").run() // sớm hơn: nếu Bảng tin còn đọc khoá này thì S2 (câu 10:00) lọt vào
    expect((await gvBangTin(d.env, {}, NOW)).nhip).toMatchObject({ soCau: 15, soEmHoc: 3 })
    const e = taoD1That()
    e.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('bang_tin_tu',?,'x')").run(MOC_ISO)
    e.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Em','12','mk','x')").run()
    await ghiSuKien(e.env, [
      { nguon: 'on_lai', maNguon: 'm', sbd: 'S1', qid: 'A', lan: 1, ketQua: 1, luc: new Date(VN('2026-09-22T10:00:00')).toISOString() },
      { nguon: 'on_lai', maNguon: 'm', sbd: 'S1', qid: 'B', lan: 1, ketQua: 1, luc: new Date(VN('2026-09-22T13:00:00')).toISOString() },
    ])
    expect((await gvBangTin(e.env, {}, NOW)).nhip).toMatchObject({ soCau: 1, soEmHoc: 1 })
  })

  it('Toàn cảnh em (thầy): ô nhịp 30 ngày HÔM NAY chỉ nhận câu khác nhau đã trả lời từ mốc (S1: 3 câu ⇒ cùng mức với 3 câu; ô hôm qua tính Q6)', async () => {
    const d = await dung()
    const r = (await gvEmToanCanh(d.env, { sbd: 'S1' }, NOW)) as { nhip30: { ngay: string; muc: number }[] }
    const homNay = r.nhip30.find((x) => x.ngay === '2026-09-22')!.muc
    const homQua = r.nhip30.find((x) => x.ngay === '2026-09-21')!.muc
    // cùng bộ thước với dữ liệu 3 câu / 1 câu: đối chiếu với em có ĐÚNG 3 và 1 câu khác nhau
    const d2 = taoD1That()
    d2.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('hien_thi_tu',?,'x')").run(MOC_ISO)
    d2.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('X','Em X','12','mk','x')").run()
    await ghiSuKien(d2.env, [
      ...['A', 'B', 'C'].map((q, i) => ({ nguon: 'on_lai' as const, maNguon: 'm', sbd: 'X', qid: q, lan: 1, ketQua: 1 as const, luc: new Date(VN(`2026-09-22T13:0${i}:00`)).toISOString() })),
      { nguon: 'on_lai' as const, maNguon: 'm', sbd: 'X', qid: 'Z', lan: 1, ketQua: 1 as const, luc: new Date(VN('2026-09-21T20:00:00')).toISOString() },
      ...['U1', 'U2', 'U3', 'U4', 'U5'].map((q) => ({ nguon: 'on_lai' as const, maNguon: 'm', sbd: 'X', qid: q, lan: 1, ketQua: null, luc: new Date(VN('2026-09-21T20:30:00')).toISOString() })), // 5 câu BỎ TRỐNG hôm qua: không tính (1 câu ⇒ mức 1; nếu tính sẽ thành 6 câu ⇒ mức 2)
    ])
    const x = (await gvEmToanCanh(d2.env, { sbd: 'X' }, NOW)) as { nhip30: { ngay: string; muc: number }[] }
    expect(homNay).toBe(x.nhip30.find((v) => v.ngay === '2026-09-22')!.muc)
    expect(homQua).toBe(x.nhip30.find((v) => v.ngay === '2026-09-21')!.muc)
  })
})
