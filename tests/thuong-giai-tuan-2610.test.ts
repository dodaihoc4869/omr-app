// @vitest-environment node
// GIẢI TUẦN (thưởng phạt phần B, thầy chốt 26/10): lọc Học thật (có hỗ trợ / Đối phó bị loại), cộng sẵn bằng trigger exp_so, chia nhóm ≤ 20 trộn lớp,
// chốt thứ Hai 00:05: lên 5 / rơi 4, Sắt không rơi, Kim cương top 3 Quán quân, tinh thể lên hạng theo khoá (không cộng đôi), /hs/giai một batch,
// khối giai cho /hs/thuong, bảng thầy, khối tuần phụ huynh. D1 = SQLite trong bộ nhớ trên lược đồ thật (tests/_d1-that.ts).
import { beforeEach, describe, expect, it } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import { gameToken } from '../server/src/game-v2-auth'
import {
  chonNhom, chotNhom, cronGiaiTuan, hsGiai, laKhoanHoTro, nguyenTuThat, tomTatGiaiEm, xepNhomCho, xoaNhoGiai,
} from '../server/src/thuong-giai-tuan'
import { tuanCuaNgay, hetHanGiayCua } from '../server/src/thuong-b-chung'
import { gvThiDuaTuan, tuanThuongPh } from '../server/src/thuong-gv-ph'
import { phBaoCaoTuan } from '../server/src/bao-cao-tuan'

const VN = (s: string): number => Date.parse(`${s}+07:00`)
const NOW = VN('2026-10-28T10:00:00') // thứ Tư, tuần 26/10
const TUAN = '2026-10-26'

beforeEach(() => xoaNhoGiai())

function themEm(d: D1That, sbd: string, ten: string, tenLop = '12A1') {
  d.sql.prepare("INSERT INTO hoc_sinh(sbd, ho_ten, lop, ten_lop, mat_khau, cap_nhat_luc) VALUES (?, ?, '12', ?, 'mk', 'x')").run(sbd, ten, tenLop)
}
let k = 0
function nguyenTu(d: D1That, sbd: string, exp: number, luc = '2026-10-27T09:00:00', loai = 'cau', ghiChu: string | null = null) {
  const iso = new Date(VN(luc)).toISOString()
  d.sql.prepare('INSERT OR IGNORE INTO exp_so (khoa, sbd, ngay_vn, loai, exp, luc, ghi_chu) VALUES (?, ?, ?, ?, ?, ?, ?)').run(`${sbd}|k${++k}`, sbd, luc.slice(0, 10), loai, exp, iso, ghiChu)
}
/** Khoản «đúng có hỗ trợ» đúng như phần A ghi (exp-hoc-tap.ts: loai 'cau', ghi_chu «Câu đúng có hỗ trợ: +5»). */
const hoTro = (d: D1That, sbd: string, exp: number, luc = '2026-10-27T10:00:00') => nguyenTu(d, sbd, exp, luc, 'cau', `Câu đúng có hỗ trợ: +${exp}`)
const tok = (d: D1That, sbd: string) => gameToken(d.env, sbd)
const dong = (d: D1That, sbd: string, tuan = TUAN) => d.sql.prepare('SELECT * FROM giai_tuan WHERE tuan = ? AND em = ?').get(tuan, sbd) as Record<string, any> | undefined
function bangPhanA(d: D1That) {
  // ĐÚNG DDL của phần A (migration-2610-thuong-phat.sql) — khi tệp ấy lên main, _d1-that nạp sẵn và hai câu này không làm gì.
  d.sql.exec('CREATE TABLE IF NOT EXISTS thong_bao_thuong (em TEXT NOT NULL, ma TEXT NOT NULL, loai TEXT NOT NULL, du_lieu TEXT, luc TEXT NOT NULL, da_xem TEXT, PRIMARY KEY (em, ma))')
  d.sql.exec('CREATE TABLE IF NOT EXISTS huy_hieu_em (em TEXT NOT NULL, ma TEXT NOT NULL, ngay TEXT NOT NULL, du_lieu TEXT, luc TEXT NOT NULL, PRIMARY KEY (em, ma))')
}

describe('hàm thuần', () => {
  it('nguyên tử Học thật: trừ khoản có hỗ trợ; tuần bị xếp Đối phó (bậc ≥ 3) ⇒ 0; chưa xếp ⇒ tính', () => {
    expect(nguyenTuThat(100, 20, null)).toBe(80)
    expect(nguyenTuThat(100, 20, 2)).toBe(80)
    expect(nguyenTuThat(100, 20, 3)).toBe(0)
    expect(nguyenTuThat(100, 20, 5)).toBe(0)
  })
  it('chốt nhóm 20: top 5 lên (tinh thể theo hạng mới), 4 cuối rơi, giữa giữ', () => {
    const ds = Array.from({ length: 20 }, (_, i) => ({ em: `E${String(i).padStart(2, '0')}`, nguyenTu: 200 - i * 10, vaoLuc: 'x' }))
    const kq = chotNhom('bac', ds)
    expect(kq.filter((x) => x.ket === 'len').map((x) => x.thuHang)).toEqual([1, 2, 3, 4, 5])
    expect(kq.filter((x) => x.ket === 'roi').map((x) => x.thuHang)).toEqual([17, 18, 19, 20])
    expect(kq.find((x) => x.thuHang === 1)).toMatchObject({ hangSau: 'vang', tinhThe: 40 })
    expect(kq.find((x) => x.thuHang === 20)).toMatchObject({ hangSau: 'dong', tinhThe: 0 })
    expect(kq.filter((x) => x.ket === 'giu')).toHaveLength(11)
  })
  it('hạng Sắt không rơi; 0 nguyên tử Học thật không được lên; Kim cương không lên, top 3 Quán quân, top 3 không rơi', () => {
    const ds = Array.from({ length: 8 }, (_, i) => ({ em: `S${i}`, nguyenTu: i < 2 ? 50 : 0, vaoLuc: 'x' }))
    const sat = chotNhom('sat', ds)
    expect(sat.filter((x) => x.ket === 'roi')).toHaveLength(0)
    expect(sat.filter((x) => x.ket === 'len').map((x) => x.em)).toEqual(['S0', 'S1'])
    expect(sat.find((x) => x.em === 'S0')).toMatchObject({ hangSau: 'dong', tinhThe: 20 })
    const kc = chotNhom('kimcuong', Array.from({ length: 6 }, (_, i) => ({ em: `K${i}`, nguyenTu: 60 - i, vaoLuc: 'x' })))
    expect(kc.filter((x) => x.ket === 'len')).toHaveLength(0)
    expect(kc.filter((x) => x.quanQuan).map((x) => x.thuHang)).toEqual([1, 2, 3])
    expect(kc.filter((x) => x.ket === 'roi').map((x) => x.thuHang)).toEqual([6]) // n=6: vị trí > 5 và > n−4
  })
  it('hoà nguyên tử ⇒ ai vào tuần sớm hơn đứng trên', () => {
    const kq = chotNhom('dong', [{ em: 'B', nguyenTu: 10, vaoLuc: '2026-10-27' }, { em: 'A', nguyenTu: 10, vaoLuc: '2026-10-28' }])
    expect(kq.map((x) => x.em)).toEqual(['B', 'A'])
  })
  it('chia nhóm: cùng hạng, tối đa 20, ưu tiên nhóm ít bạn cùng lớp (trộn lớp), hết chỗ mở nhóm mới', () => {
    const cho = Array.from({ length: 45 }, (_, i) => ({ em: `E${String(i).padStart(2, '0')}`, hang: 'sat' as const, lop: i % 3 === 0 ? 'L1' : i % 3 === 1 ? 'L2' : 'L3' }))
    const gan = chonNhom([...cho, { em: 'V1', hang: 'vang', lop: 'L1' }], [])
    const dem = new Map<string, number>()
    for (const n of gan.values()) dem.set(n, (dem.get(n) ?? 0) + 1)
    expect([...dem.entries()].filter(([n]) => n.startsWith('sat-')).map(([, c]) => c).sort()).toEqual([20, 20, 5])
    expect(gan.get('V1')).toBe('vang-1')
    // nhóm có sẵn toàn lớp L1 ⇒ em lớp L2 vào nhóm khác ít L1 hơn
    const g2 = chonNhom([{ em: 'X', hang: 'sat', lop: 'L2' }], [{ nhom: 'sat-1', hang: 'sat', lop: 'L2', n: 5 }, { nhom: 'sat-2', hang: 'sat', lop: 'L1', n: 5 }])
    expect(g2.get('X')).toBe('sat-2')
  })
  it('tuần: thứ Hai của tuần; hạn = CN 22:00 VN', () => {
    expect(tuanCuaNgay('2026-11-01')).toBe('2026-10-26')
    expect(tuanCuaNgay('2026-10-26')).toBe('2026-10-26')
    expect(hetHanGiayCua(TUAN, VN('2026-11-01T21:00:00'))).toBe(3600)
    expect(hetHanGiayCua(TUAN, VN('2026-11-01T23:00:00'))).toBe(0)
  })
})

describe('cộng sẵn nguyên tử tuần (trigger exp_so → giai_tuan)', () => {
  it('cộng theo tuần, khoá trùng không cộng đôi, khoản có hỗ trợ tách riêng, sau CN 22:00 không tính, tuần mới mang hạng sau chốt', () => {
    const d = taoD1That(); themEm(d, 'A1', 'Trần Minh Anh')
    nguyenTu(d, 'A1', 10); hoTro(d, 'A1', 5, '2026-10-28T08:00:00'); nguyenTu(d, 'A1', 2, '2026-10-28T09:00:00', 'cau_ho_tro')
    d.sql.prepare("INSERT OR IGNORE INTO exp_so (khoa, sbd, ngay_vn, loai, exp, luc) VALUES ('A1|k1', 'A1', '2026-10-27', 'cau', 10, 'x')").run() // trùng khoá ⇒ bỏ qua
    nguyenTu(d, 'A1', 7, '2026-11-01T21:59:00'); nguyenTu(d, 'A1', 9, '2026-11-01T22:00:00') // 22:00 trở đi không tính
    expect(dong(d, 'A1')).toMatchObject({ hang: 'sat', nhom: '', nguyen_tu: 24, nguyen_tu_ho_tro: 7 })
    expect(laKhoanHoTro('cau', 'Câu đúng có hỗ trợ: +5')).toBe(true)
    expect(laKhoanHoTro('cau', 'Câu đúng Phần 1: +10')).toBe(false)
    d.sql.prepare("UPDATE giai_tuan SET hang_sau = 'bac', chot_luc = 'x' WHERE em = 'A1'").run()
    nguyenTu(d, 'A1', 3, '2026-11-02T08:00:00')
    expect(dong(d, 'A1', '2026-11-02')).toMatchObject({ hang: 'bac', nguyen_tu: 3 })
    nguyenTu(d, 'A1', 4, '2026-10-30T08:00:00') // tuần đã chốt ⇒ không cộng nữa
    expect(dong(d, 'A1')!.nguyen_tu).toBe(24)
  })
})

describe('/hs/giai + xếp nhóm', () => {
  function dung25() {
    const d = taoD1That()
    for (let i = 0; i < 25; i++) {
      const s = `H${String(i).padStart(2, '0')}`
      themEm(d, s, `Nguyễn Văn Em${i}`, i % 2 ? '12A1' : '11B2')
      nguyenTu(d, s, 100 - i)
    }
    d.sql.prepare("INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES ('giai_tuan_chot', '2026-10-19', 'x')").run()
    return d
  }
  it('cron xếp 25 em hạng Sắt ⇒ nhóm ≤ 20; em thấy nhóm đủ họ tên (thầy 27/10) + lớp, KHÔNG số báo danh, KHÔNG nhãn; một batch đọc', async () => {
    const d = dung25()
    await cronGiaiTuan(d.env, NOW)
    const nhom = d.sql.prepare("SELECT nhom, COUNT(*) n FROM giai_tuan WHERE tuan = ? GROUP BY nhom").all(TUAN) as { nhom: string; n: number }[]
    expect(nhom.every((x) => x.nhom.startsWith('sat-') && x.n <= 20)).toBe(true)
    expect(nhom.reduce((s, x) => s + x.n, 0)).toBe(25)
    const t = await tok(d, 'H03')
    const b0 = d.soLenh.batch
    const r = (await hsGiai(d.env, { token: t }, NOW)) as Record<string, any>
    expect(d.soLenh.batch - b0).toBe(1)
    expect(r).toMatchObject({ ok: true, bat: true, hang: 'sat', len: 5, roi: 0 })
    expect(r.hetHanGiay).toBe(Math.floor((VN('2026-11-01T22:00:00') - NOW) / 1000))
    const em = r.nhom.find((x: any) => x.laEm)
    expect(em).toMatchObject({ ten: 'Nguyễn Văn Em3', lop: '12A1', nguyenTu: 97 })
    expect(r.nhom.filter((x: any) => x.laEm)).toHaveLength(1)
    const json = JSON.stringify(r)
    for (let i = 0; i < 25; i++) expect(json).not.toContain(`H${String(i).padStart(2, '0')}`)
    expect(json).not.toMatch(/Đối phó|Học thật|bac\b|nhan/)
    expect(r.nhom.map((x: any) => x.thuHang)).toEqual(r.nhom.map((_: any, i: number) => i + 1))
  })
  it('em bị xếp Đối phó tuần này ⇒ nguyên tử bảng giải = 0 (em không thấy lý do); khoản có hỗ trợ không vào bảng', async () => {
    const d = dung25()
    d.sql.prepare("INSERT INTO danh_gia_em_tuan (sbd, tuan, diem, bac_tuan, bac, tinh_luc) VALUES ('H00', ?, 40, 3, 3, 'x')").run(TUAN)
    hoTro(d, 'H01', 50, '2026-10-28T08:00:00')
    await cronGiaiTuan(d.env, NOW)
    const r = (await hsGiai(d.env, { token: await tok(d, 'H00') }, NOW)) as Record<string, any>
    expect(r.nhom.find((x: any) => x.laEm).nguyenTu).toBe(0)
    const r1 = (await hsGiai(d.env, { token: await tok(d, 'H01') }, NOW)) as Record<string, any>
    expect(r1.nhom.find((x: any) => x.laEm).nguyenTu).toBe(99)
    expect(JSON.stringify(r)).not.toMatch(/Đối phó|lười|vội|treo/i)
  })
  it('em mở /hs/giai khi còn «chờ xếp» ⇒ xếp ngay (một lần); em chưa có nguyên tử tuần ⇒ nhóm rỗng, hạng mang từ tuần trước', async () => {
    const d = dung25(); themEm(d, 'Z9', 'Lê Thị Mới')
    const r = (await hsGiai(d.env, { token: await tok(d, 'H05') }, NOW)) as Record<string, any>
    expect(r.nhom.length).toBeGreaterThan(0)
    expect(dong(d, 'H05')!.nhom).toMatch(/^sat-/)
    d.sql.prepare("INSERT INTO giai_tuan (tuan, em, hang, nhom, vao_luc, hang_sau, chot_luc) VALUES ('2026-10-19', 'Z9', 'vang', 'vang-1', 'x', 'bachkim', 'x')").run()
    const z = (await hsGiai(d.env, { token: await tok(d, 'Z9') }, NOW)) as Record<string, any>
    expect(z).toMatchObject({ ok: true, hang: 'bachkim', nhom: [] })
  })
  it('công tắc thuong_giai_tuan = tat ⇒ {bat:false}; tóm tắt cho /hs/thuong = null; token sai ⇒ lỗi đăng nhập', async () => {
    const d = dung25(); await cronGiaiTuan(d.env, NOW)
    expect(await tomTatGiaiEm(d.env, 'H02', NOW)).toEqual({ hang: 'sat', thuHang: expect.any(Number), soNguoi: expect.any(Number), hetHanGiay: expect.any(Number) })
    d.sql.prepare("INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES ('thuong_giai_tuan', 'tat', 'x')").run()
    expect(await hsGiai(d.env, { token: await tok(d, 'H02') }, NOW)).toEqual({ ok: true, bat: false })
    expect(await tomTatGiaiEm(d.env, 'H02', NOW)).toBeNull()
    expect((await hsGiai(d.env, { token: 'sai' }, NOW)).ok).toBe(false)
  })
})

describe('chốt tuần (cron thứ Hai 00:05)', () => {
  function dungNhom(hang: string, n: number) {
    const d = taoD1That()
    for (let i = 0; i < n; i++) {
      const s = `C${String(i).padStart(2, '0')}`
      themEm(d, s, `Phạm Văn C${i}`)
      d.sql.prepare("INSERT INTO giai_tuan (tuan, em, hang, nhom, nguyen_tu, vao_luc) VALUES (?, ?, ?, ?, ?, ?)").run(TUAN, s, hang, `${hang}-1`, 200 - i * 10, `2026-10-27T0${i % 10}:00:00Z`)
    }
    return d
  }
  const SAU = VN('2026-11-02T00:06:00')
  it('chưa tới 00:05 ⇒ không chốt; tới giờ ⇒ lên 5 / rơi 4, tinh thể theo khoá, thông báo cuoi_tuan, Quán quân; chạy lại không cộng đôi', async () => {
    const d = dungNhom('bachkim', 12); bangPhanA(d)
    d.sql.prepare("INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES ('giai_tuan_chot', '2026-10-19', 'x')").run()
    expect(await cronGiaiTuan(d.env, VN('2026-11-02T00:03:00'))).toMatchObject({ lyDo: 'chua_toi_gio' })
    for (let i = 0; i < 4; i++) await cronGiaiTuan(d.env, SAU + i * 60_000)
    expect(dong(d, 'C00')).toMatchObject({ hang_sau: 'kimcuong', thu_hang_chot: 1, nguyen_tu_that: 200 })
    expect(dong(d, 'C06')).toMatchObject({ hang_sau: 'bachkim' })
    expect(dong(d, 'C11')).toMatchObject({ hang_sau: 'vang', thu_hang_chot: 12 })
    expect(d.dem('vang_so', "ma_mon = 'tt-len-hang' AND khoa_yeu_cau LIKE 'tt|len_hang|%'")).toBe(5)
    expect(d.sql.prepare("SELECT SUM(so_vang) s FROM vang_so WHERE sbd = 'C00'").get()).toEqual({ s: 60 })
    expect(d.dem('thong_bao_thuong', "loai = 'cuoi_tuan'")).toBe(12)
    expect(d.dem('huy_hieu_em', "ma = 'hang_kimcuong'")).toBe(5)
    expect(JSON.parse((d.sql.prepare("SELECT du_lieu FROM thong_bao_thuong WHERE em = 'C11'").get() as any).du_lieu)).toMatchObject({ ket: 'roi', hangCu: 'bachkim', hangMoi: 'vang' })
    expect(d.sql.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa = 'giai_tuan_chot'").get()).toEqual({ gia_tri: TUAN })
    xoaNhoGiai()
    d.sql.prepare("UPDATE giai_tuan SET chot_luc = NULL WHERE em = 'C00'").run() // giả lập chạy lại
    d.sql.prepare("UPDATE cau_hinh SET gia_tri = '2026-10-19' WHERE khoa = 'giai_tuan_chot'").run()
    for (let i = 0; i < 3; i++) await cronGiaiTuan(d.env, SAU + 10 * 60_000 + i * 60_000)
    expect(d.dem('vang_so', "sbd = 'C00'")).toBe(1)
  })
  it('Kim cương: top 3 nhận huy hiệu Quán quân; bảng phần A chưa có ⇒ chốt vẫn xong', async () => {
    const d = dungNhom('kimcuong', 6); bangPhanA(d)
    d.sql.prepare("INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES ('giai_tuan_chot', '2026-10-19', 'x')").run()
    for (let i = 0; i < 3; i++) await cronGiaiTuan(d.env, SAU + i * 60_000)
    expect((d.sql.prepare("SELECT em FROM huy_hieu_em WHERE ma = 'quan_quan' ORDER BY em").all() as any[]).map((x) => x.em)).toEqual(['C00', 'C01', 'C02'])
    expect(d.dem('vang_so', "ma_mon = 'tt-len-hang'")).toBe(0) // Kim cương không lên nữa ⇒ không tinh thể lên hạng
    const d2 = dungNhom('sat', 10)
    d2.sql.prepare("INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES ('giai_tuan_chot', '2026-10-19', 'x')").run()
    xoaNhoGiai()
    for (let i = 0; i < 3; i++) await cronGiaiTuan(d2.env, SAU + i * 60_000)
    expect(d2.dem('giai_tuan', "hang_sau = 'dong'")).toBe(5)
    expect(d2.dem('giai_tuan', "hang_sau = 'sat'")).toBe(5) // Sắt không rơi
  })
  it('em đã có nguyên tử tuần mới trước lúc chốt ⇒ hạng tuần mới được sửa theo kết quả chốt; tuần mới chỉ xếp nhóm sau khi tuần trước chốt xong', async () => {
    const d = dungNhom('dong', 6)
    d.sql.prepare("INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES ('giai_tuan_chot', '2026-10-19', 'x')").run()
    nguyenTu(d, 'C00', 5, '2026-11-02T00:01:00')
    expect(dong(d, 'C00', '2026-11-02')).toMatchObject({ hang: 'dong', nhom: '' })
    for (let i = 0; i < 4; i++) await cronGiaiTuan(d.env, SAU + i * 60_000)
    expect(dong(d, 'C00', '2026-11-02')).toMatchObject({ hang: 'bac' })
    expect(dong(d, 'C00', '2026-11-02')!.nhom).toBe('bac-1')
  })
})

describe('thầy + phụ huynh', () => {
  it('/gv/thi-dua-tuan: nguyên tử thật / bị loại, hạng + thứ hạng, nhãn, bậc dưới, học cùng — đúng hợp đồng', async () => {
    const d = taoD1That()
    themEm(d, 'G1', 'Đỗ Văn Một', '12A1'); themEm(d, 'G2', 'Đỗ Văn Hai', '12A1'); themEm(d, 'G3', 'Đỗ Văn Ba', '11B2')
    nguyenTu(d, 'G1', 50); hoTro(d, 'G1', 10); nguyenTu(d, 'G2', 30); nguyenTu(d, 'G3', 70)
    d.sql.prepare("INSERT INTO danh_gia_em_tuan (sbd, tuan, diem, bac_tuan, bac, tinh_luc) VALUES ('G2', ?, 40, 3, 4, 'x')").run(TUAN)
    d.sql.prepare("INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES ('giai_tuan_chot', '2026-10-19', 'x')").run()
    await xepNhomCho(d.env, TUAN)
    d.sql.prepare("INSERT INTO ban_hoc (em_a, em_b, trang_thai, nguoi_moi, chuoi_doi, moi_luc, cap_nhat_luc) VALUES ('G1', 'G3', 'dong_y', 'G1', 4, 'x', 'x')").run()
    const b0 = d.soLenh.batch
    const r = (await gvThiDuaTuan(d.env, { lop: '12A1' }, NOW)) as Record<string, any>
    expect(d.soLenh.batch - b0).toBe(1)
    expect(r).toMatchObject({ ok: true, lop: '12A1', tuan: TUAN })
    const g1 = r.ds.find((x: any) => x.sbd === 'G1'), g2 = r.ds.find((x: any) => x.sbd === 'G2')
    expect(g1).toMatchObject({ ten: 'Đỗ Văn Một', nguyenTuThat: 50, nguyenTuLoai: 10, hang: { kl: 'sat', thuHang: 2 }, nhan: null, bacDuoi: null, hocCung: [{ ten: 'Đỗ Văn Ba', lop: '11B2', chuoiDoi: 4 }] })
    expect(g2).toMatchObject({ nguyenTuThat: 0, nguyenTuLoai: 30, nhan: 'Đối phó', bacDuoi: 4, hang: { kl: 'sat', thuHang: 3 } })
    expect(r.ds.some((x: any) => x.sbd === 'G3')).toBe(false)
  })
  it('khối tuần phụ huynh ở gốc /ph/bao-cao-tuan: chuoi, soBai, hang, tiLeHocThat 0..1, hocCung; đọc song song (không thêm đợt chờ)', async () => {
    const d = taoD1That(); themEm(d, 'P1', 'Vũ Thị Con'); themEm(d, 'P2', 'Vũ Văn Bạn')
    nguyenTu(d, 'P1', 30); hoTro(d, 'P1', 10)
    for (const ngay of ['2026-10-27', '2026-10-28']) for (let q = 0; q < 6; q++)
      d.sql.prepare("INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, ket_qua, luc, ngay_vn) VALUES (?, 'P1', ?, 'on_lai', 'm', 1, ?, ?)").run(`${ngay}|${q}`, `Q${q}`, `${ngay}T02:00:00Z`, ngay)
    d.sql.prepare("INSERT INTO ban_hoc (em_a, em_b, trang_thai, nguoi_moi, moi_luc, cap_nhat_luc) VALUES ('P1', 'P2', 'dong_y', 'P1', 'x', 'x')").run()
    const t = await tuanThuongPh(d.env, 'P1', NOW)
    expect(t).toEqual({ chuoi: 2, soBai: 2, hang: 'sat', tiLeHocThat: 0.75, hocCung: ['Vũ Văn Bạn'] })
    const r = (await phBaoCaoTuan(d.env, { sbd: 'P1' }, NOW)) as Record<string, any>
    if (r.ok) expect(r.tuan).toEqual(t)
  })
})
