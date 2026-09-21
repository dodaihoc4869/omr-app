// @vitest-environment node
// SAI RẤT NHANH RỒI ĐÚNG LẠI cho Bảng tin của thầy (khoá `saiNhanh` của /gv/bang-tin; hàm thuần Code 1 `demSaiNhanhDungLai`): cron tính vào bản đệm `cau_hinh.sai_nhanh_gv` MỖI MỐC 6 GIỜ (00:10 · 06:10 · 12:10 · 18:10 giờ VN, ≤ 4 lần/ngày),
// bảng tin chỉ ĐỌC (0 truy vấn thêm, không ghi). Khoá: định nghĩa (khớp hàm thuần), ngưỡng 8 câu, loại tài khoản thử, bản đệm cũ hơn 7 giờ ⇒ khoá VẮNG, tần suất tính lại, tên/lớp ghép lúc đọc. SQLite thật.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { capNhatSaiNhanhNeuCu, docSaiNhanhDem, KHOA_SAI_NHANH_GV, mocSaiNhanhMoiNhat, PHUT_DEM_CU_NHAT, tinhSaiNhanhTatCa } from '../server/src/sai-nhanh-gv'
import { demSaiNhanhDungLai, type SuKienSaiNhanh } from '../src/lib/tin-hieu-sai-nhanh'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { gio } from './_btvn-nang-do-mau'

afterEach(() => vi.useRealTimers())
const VN = (s: string): number => Date.parse(`${s}+07:00`)
const NOW = VN('2026-09-22T13:00:00') // thứ Ba 22/09 13:00 VN; hôm qua = 21/09
let dem = 0
const themHs = (d: D1That, sbd: string, hoTen: string, lop = '12', tenLop: string | null = null, tt: string | null = null) =>
  d.sql.prepare("INSERT OR REPLACE INTO hoc_sinh(sbd,ho_ten,lop,ten_lop,trang_thai,mat_khau,cap_nhat_luc) VALUES(?,?,?,?,?,'mk','x')").run(sbd, hoTen, lop, tenLop, tt)
/** Ghi `n` câu KHÁC NHAU của em: sai `giaySai` giây ở ngày `ngaySai` rồi đúng ở ngày `ngayDung`. Trả các qid. */
const capSai = async (d: D1That, sbd: string, n: number, o: { ngaySai?: string; ngayDung?: string; giaySai?: number } = {}) => {
  const ngaySai = o.ngaySai ?? '2026-09-21'; const ngayDung = o.ngayDung ?? '2026-09-22'
  const qids = Array.from({ length: n }, () => `Q${++dem}`)
  await ghiSuKien(d.env, qids.flatMap((qid) => [
    { nguon: 'on_lai' as const, maNguon: 'M1', sbd, qid, lan: 1, ketQua: 0 as const, luc: new Date(VN(`${ngaySai}T10:00:00`)).toISOString(), maDang: 'D1', giay: o.giaySai ?? 3 },
    { nguon: 'on_lai' as const, maNguon: 'M1', sbd, qid, lan: 2, ketQua: 1 as const, luc: new Date(VN(`${ngayDung}T09:00:00`)).toISOString(), maDang: 'D1', giay: 25 },
  ]))
  return qids
}
const goi = (d: D1That) => goiWorker(worker, d.env, '/gv/bang-tin', {}, true) as Promise<any>
function truong(): D1That {
  gio(new Date(NOW))
  const d = taoD1That()
  d.sql.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('bang_tin_tu',?,'x')").run('2026-09-21T00:00:00.000Z')
  return d
}

describe('tinhSaiNhanhTatCa: định nghĩa khớp hàm thuần của Code 1', () => {
  it('em ≥ 8 câu sai nhanh (< 5 giây) hôm trước rồi đúng hôm sau ⇒ co; 7 câu ⇒ không; sai chậm ⇒ không; đúng CÙNG ngày ⇒ không; tài khoản thử bị loại; sắp giảm dần', async () => {
    const d = truong()
    for (const [s, ten] of [['S1', 'Em Một'], ['S2', 'Em Hai'], ['S3', 'Em Ba'], ['S4', 'Em Bốn'], ['S5', 'Em Năm'], ['12121212', 'Thử']]) themHs(d, s, ten)
    await capSai(d, 'S1', 9); await capSai(d, 'S2', 8); await capSai(d, 'S3', 7)
    await capSai(d, 'S4', 12, { giaySai: 10 }) // sai CHẬM (≥ 5 giây)
    await capSai(d, 'S5', 12, { ngaySai: '2026-09-22', ngayDung: '2026-09-22' }) // đúng cùng ngày, không phải hôm sau
    await capSai(d, '12121212', 12)
    const r = await tinhSaiNhanhTatCa(d.env, NOW)
    expect(r.ngay).toBe('2026-09-22')
    expect(r.ds.map((x) => [x.sbd, x.soCau])).toEqual([['S1', 9], ['S2', 8]])
    expect(r.ds[0]).toMatchObject({ nguongSoCau: 8, nguongGiay: 5, cuaSoNgay: 7, tuNgay: '2026-09-16', co: true })
  })
  it('KHỚP hàm thuần: kết quả bằng chạy `demSaiNhanhDungLai` trên TOÀN BỘ sự kiện của em (bộ dữ liệu trộn nhiều kiểu)', async () => {
    const d = truong()
    for (const s of ['A', 'B', 'C']) themHs(d, s, `Em ${s}`)
    await capSai(d, 'A', 10) // co
    await capSai(d, 'B', 8, { ngaySai: '2026-09-16', ngayDung: '2026-09-17' }) // sát mép cửa sổ (tuNgay = 16/09) ⇒ co
    await capSai(d, 'C', 8, { ngaySai: '2026-09-15', ngayDung: '2026-09-16' }) // sai ở NGOÀI cửa sổ ⇒ không
    const r = await tinhSaiNhanhTatCa(d.env, NOW)
    const tatCa = d.sql.prepare('SELECT sbd, qid, ngay_vn, ket_qua, giay FROM su_kien_hoc').all() as { sbd: string; qid: string; ngay_vn: string; ket_qua: number | null; giay: number | null }[]
    const mong = ['A', 'B', 'C'].map((s) => ({ s, k: demSaiNhanhDungLai(tatCa.filter((x) => x.sbd === s).map<SuKienSaiNhanh>((x) => ({ qid: x.qid, ngayVn: x.ngay_vn, ketQua: x.ket_qua === 1 ? 1 : x.ket_qua === 0 ? 0 : null, giay: x.giay })), '2026-09-22') }))
    expect(r.ds.map((x) => [x.sbd, x.soCau])).toEqual(mong.filter((m) => m.k.co).map((m) => [m.s, m.k.soCau]).sort((a, c) => (c[1] as number) - (a[1] as number) || (a[0]! < c[0]! ? -1 : 1)))
    expect(r.ds.map((x) => x.sbd)).toEqual(['A', 'B'])
  })
})

describe('mocSaiNhanhMoiNhat: bốn mốc 00:10 · 06:10 · 12:10 · 18:10 giờ VN', () => {
  it('trước/đúng/sau từng mốc; trước 00:10 là mốc 18:10 của ngày hôm trước', () => {
    const m = (s: string) => mocSaiNhanhMoiNhat(VN(s))
    expect(m('2026-09-22T00:09:59')).toBe('2026-09-21T18:10')
    expect(m('2026-09-22T00:10:00')).toBe('2026-09-22T00:10')
    expect(m('2026-09-22T06:09:59')).toBe('2026-09-22T00:10')
    expect(m('2026-09-22T06:10:00')).toBe('2026-09-22T06:10')
    expect(m('2026-09-22T12:10:00')).toBe('2026-09-22T12:10')
    expect(m('2026-09-22T18:09:59')).toBe('2026-09-22T12:10')
    expect(m('2026-09-22T23:59:59')).toBe('2026-09-22T18:10')
    // một ngày đủ 4 mốc khác nhau, không hơn
    const trongNgay = new Set(Array.from({ length: 24 * 60 }, (_, k) => m(`2026-09-22T${String(Math.floor(k / 60)).padStart(2, '0')}:${String(k % 60).padStart(2, '0')}:00`)))
    expect([...trongNgay].sort()).toEqual(['2026-09-21T18:10', '2026-09-22T00:10', '2026-09-22T06:10', '2026-09-22T12:10', '2026-09-22T18:10'])
  })
})

describe('docSaiNhanhDem: bản đệm hợp lệ / cũ / hỏng', () => {
  const dem0 = (luc: number, ds: unknown[] = [{ sbd: 'S1', soCau: 9, nguongSoCau: 8, nguongGiay: 5, cuaSoNgay: 7, tuNgay: '2026-09-16', co: true }], them: object = {}) => JSON.stringify({ ngay: '2026-09-22', luc: new Date(luc).toISOString(), moc: '2026-09-22T12:10', ds, ...them })
  it('còn mới (kể cả 6 giờ trước) ⇒ đọc được; cũ hơn 7 giờ, ở TƯƠNG LAI xa, đánh dấu lỗi, hỏng ⇒ null', () => {
    expect(docSaiNhanhDem(dem0(NOW - 5 * 60_000), NOW)?.ds).toHaveLength(1)
    expect(docSaiNhanhDem(dem0(NOW - 6 * 3_600_000), NOW)?.ds).toHaveLength(1) // giữa hai mốc vẫn dùng bản đệm
    expect(docSaiNhanhDem(dem0(NOW - (PHUT_DEM_CU_NHAT + 1) * 60_000), NOW)).toBeNull()
    expect(docSaiNhanhDem(dem0(NOW + 3_600_000), NOW)).toBeNull()
    expect(docSaiNhanhDem(dem0(NOW - 60_000, [], { loi: true }), NOW)).toBeNull()
    for (const v of [undefined, null, '', 'rác', '[]', '{}', '{"ds":5}']) expect(docSaiNhanhDem(v, NOW), String(v)).toBeNull()
  })
  it('bỏ dòng hỏng (thiếu sbd / co không true) và giữ dòng đúng', () => {
    const r = docSaiNhanhDem(dem0(NOW, [{ sbd: '', soCau: 9, co: true }, { sbd: 'S2', soCau: 9, co: false }, { sbd: 'S3', soCau: 9, co: true }, null]), NOW)
    expect(r?.ds.map((x) => x.sbd)).toEqual(['S3'])
  })
})

describe('capNhatSaiNhanhNeuCu (cron mỗi phút): tính ĐÚNG MỘT LẦN mỗi mốc 6 giờ (≤ 4 lần/ngày)', () => {
  it('cả một ngày cron mỗi phút ⇒ đúng 4 lần tính nặng (00:10, 06:10, 12:10, 18:10); lỡ mốc thì lần đầu sau đó tính bù', async () => {
    const d = truong(); themHs(d, 'S1', 'Em Một'); await capSai(d, 'S1', 9)
    const cauLenh: string[] = []
    const goc = d.env.DB.prepare.bind(d.env.DB)
    d.env.DB.prepare = ((q: string) => { cauLenh.push(q); return goc(q) }) as typeof d.env.DB.prepare
    const soNang = () => cauLenh.filter((q) => /FROM su_kien_hoc a\b/.test(q)).length
    await capNhatSaiNhanhNeuCu(d.env, VN('2026-09-21T23:00:00')) // bản đệm của mốc 18:10 hôm trước đã có; đếm từ đây
    cauLenh.length = 0
    const gioTinh: string[] = []
    for (let k = 0; k < 24 * 60; k++) {
      const t = VN('2026-09-22T00:00:00') + k * 60_000
      const truoc = soNang()
      await capNhatSaiNhanhNeuCu(d.env, t)
      if (soNang() > truoc) gioTinh.push(new Date(t + 7 * 3_600_000).toISOString().slice(11, 16))
    }
    expect(gioTinh).toEqual(['00:10', '06:10', '12:10', '18:10'])
    expect(soNang()).toBe(4)
    const dong = d.sql.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').get(KHOA_SAI_NHANH_GV) as { gia_tri: string }
    expect(JSON.parse(dong.gia_tri)).toMatchObject({ moc: '2026-09-22T18:10', ds: [{ sbd: 'S1', soCau: 9 }] })
    // lỡ mốc 00:10 (Worker không chạy): 03:00 mới gọi ⇒ tính bù đúng một lần, rồi im đến 06:10
    const e = truong(); themHs(e, 'S1', 'Em Một'); await capSai(e, 'S1', 9)
    expect(await capNhatSaiNhanhNeuCu(e.env, VN('2026-09-23T03:00:00'))).toMatchObject({ chay: true, soEm: 1 })
    expect(await capNhatSaiNhanhNeuCu(e.env, VN('2026-09-23T03:01:00'))).toMatchObject({ chay: false, lyDo: 'con_moi' })
    expect(await capNhatSaiNhanhNeuCu(e.env, VN('2026-09-23T06:10:00'))).toMatchObject({ chay: true })
  })
  it('tính LỖI (thiếu bảng) ⇒ không ném, trả loi, đánh dấu mốc để KHÔNG thử lại mỗi phút; bảng tin coi như chưa có; mốc kế thử lại', async () => {
    const d = truong(); d.sql.exec('DROP TABLE su_kien_hoc')
    expect(await capNhatSaiNhanhNeuCu(d.env, NOW)).toMatchObject({ chay: false, lyDo: 'loi' })
    expect(await capNhatSaiNhanhNeuCu(d.env, NOW + 60_000)).toMatchObject({ chay: false, lyDo: 'con_moi' }) // không thử lại phút sau
    const dong = d.sql.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').get(KHOA_SAI_NHANH_GV) as { gia_tri: string }
    expect(JSON.parse(dong.gia_tri)).toMatchObject({ loi: true })
    expect(docSaiNhanhDem(dong.gia_tri, NOW + 60_000)).toBeNull()
    d.sql.exec('CREATE TABLE su_kien_hoc (sbd TEXT, qid TEXT, ngay_vn TEXT, ket_qua INTEGER, giay INTEGER)')
    expect(await capNhatSaiNhanhNeuCu(d.env, VN('2026-09-22T18:10:00'))).toMatchObject({ chay: true }) // mốc kế tính lại được
  })
})

describe('/gv/bang-tin: khoá saiNhanh', () => {
  it('có bản đệm ⇒ saiNhanh.ds có tên + lớp lúc đọc, chỉ em co, số câu giảm dần, ≤ 20; em đã KHOÁ bị bỏ; KHÔNG ghi, không thêm truy vấn (≤ 12)', async () => {
    const d = truong()
    themHs(d, 'S1', 'Em Một', '12'); themHs(d, 'S2', 'Em Hai', '12', '12 - Tinh Hoa'); themHs(d, 'S3', 'Em Ba', '12', null, 'khoa')
    await capSai(d, 'S1', 8); await capSai(d, 'S2', 11); await capSai(d, 'S3', 15)
    await capNhatSaiNhanhNeuCu(d.env, NOW)
    const ghi: string[] = []
    const goc = d.env.DB.prepare.bind(d.env.DB)
    d.env.DB.prepare = ((q: string) => { if (/^\s*(INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER)\b/i.test(q)) ghi.push(q.trim().slice(0, 60)); return goc(q) }) as typeof d.env.DB.prepare
    const r = await goi(d)
    expect(r.ok).toBe(true)
    expect(r.soTruyVan).toBeLessThanOrEqual(12)
    expect(ghi).toEqual([])
    expect(r.saiNhanh.ds.map((x: { sbd: string }) => x.sbd)).toEqual(['S2', 'S1']) // S3 đã khoá; S2 nhiều hơn S1
    expect(r.saiNhanh.ds[0]).toEqual({ sbd: 'S2', hoTen: 'Em Hai', tenLop: expect.any(String), soCau: 11, nguongSoCau: 8, nguongGiay: 5, cuaSoNgay: 7, tuNgay: '2026-09-16', co: true })
    expect(r.saiNhanh.ds[0].tenLop).not.toBe('')
  })
  it('tính rồi mà không em nào co ⇒ saiNhanh = { ds: [] }', async () => {
    const d = truong(); themHs(d, 'S1', 'Em Một'); await capSai(d, 'S1', 3)
    await capNhatSaiNhanhNeuCu(d.env, NOW)
    expect((await goi(d)).saiNhanh).toEqual({ ds: [] })
  })
  it('chưa có bản đệm / bản đệm cũ hơn 7 giờ / lần tính lỗi ⇒ khoá VẮNG (không bịa 0); giữa hai mốc (6 giờ) vẫn dùng bản đệm', async () => {
    const d = truong(); themHs(d, 'S1', 'Em Một'); await capSai(d, 'S1', 9)
    expect(await goi(d)).not.toHaveProperty('saiNhanh')
    await capNhatSaiNhanhNeuCu(d.env, NOW - 6 * 3_600_000) // tính 6 giờ trước
    expect((await goi(d)).saiNhanh.ds).toHaveLength(1)
    d.sql.prepare('DELETE FROM cau_hinh WHERE khoa = ?').run(KHOA_SAI_NHANH_GV)
    await capNhatSaiNhanhNeuCu(d.env, NOW - (PHUT_DEM_CU_NHAT + 5) * 60_000) // tính từ hơn 7 giờ trước
    expect(await goi(d)).not.toHaveProperty('saiNhanh')
    d.sql.prepare('DELETE FROM cau_hinh WHERE khoa = ?').run(KHOA_SAI_NHANH_GV)
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,'x')").run(KHOA_SAI_NHANH_GV, JSON.stringify({ ngay: '2026-09-22', luc: new Date(NOW).toISOString(), moc: '2026-09-22T12:10', loi: true, ds: [] }))
    expect(await goi(d)).not.toHaveProperty('saiNhanh')
  })
})
