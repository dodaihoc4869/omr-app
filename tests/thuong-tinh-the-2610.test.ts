// @vitest-environment node
// THƯỞNG PHẠT 26/10 — TINH THỂ (= sổ `vang_so`; DAC-TA-THUONG-PHAT-2610.md §4.2, §4.4, §4.6): kiếm (nhiệm vụ, rương, mục tiêu, cược thắng), tiêu (bình 50,
// cược 50), thăng hoa 10 % / tối thiểu 5 / tối đa 50 / không âm, chống lặp (bấm lặp, cron chạy lại), công tắc mặc định «bat». D1 thật (node:sqlite).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That } from './_d1-that'
import { gameToken } from '../server/src/game-v2-auth'
import type { Env } from '../server/src/kieu'
import {
  cronThuongNgay, gvCongTacThuong, hsCuocChuoi, hsDaXemThongBao, hsHuyHieu, hsMoRuong, hsMuaBinh, hsThuong, lenhCongTinhThe, lenhTruTinhThe,
} from '../server/src/thuong-d1'
import { chonNhiemVu, congTacTuDong, MAU_NHIEM_VU, mucTieuBai, soThangHoa } from '../server/src/thuong-luat'
import { datCauNoiChuoi, type CauNoiChuoi } from '../server/src/thuong-cau-noi-chuoi'

const NOW = Date.parse('2026-10-26T03:00:00Z') // 10:00 sáng VN, thứ Hai 26/10
const NGAY = '2026-10-26'
const DEM = Date.parse('2026-10-25T17:15:00Z') // 00:15 VN ngày 26/10
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); datCauNoiChuoi(null) })

async function dung(ds = ['S1']) {
  const d = taoD1That()
  const env = d.env as unknown as Env
  const em = d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,'12','mk','x')")
  for (const s of ds) em.run(s, `Em ${s}`)
  d.sql.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('thuong_moc','2026-10-01','x')").run()
  const token: Record<string, string> = {}
  for (const s of ds) token[s] = await gameToken(env, s)
  const vang = (s: string, so: number, khoa = `nap|${Math.random()}`) => d.sql.prepare("INSERT INTO vang_so(sbd,loai,so_vang,exp_tru,khoa_yeu_cau,luc) VALUES(?,'doi',?,0,?,'2026-10-01T00:00:00Z')").run(s, so, khoa)
  const du = (s: string) => (d.sql.prepare('SELECT COALESCE(SUM(so_vang),0) AS v FROM vang_so WHERE sbd=?').get(s) as { v: number }).v
  return { d, env, token, vang, du }
}
const gia = (x: Partial<CauNoiChuoi>) => datCauNoiChuoi(x)

describe('luật số', () => {
  it('thăng hoa: 10 %, tối thiểu 5, tối đa 50, không bao giờ quá số dư; số dư 0 ⇒ 0', () => {
    expect([soThangHoa(0), soThangHoa(-3), soThangHoa(3), soThangHoa(20), soThangHoa(100), soThangHoa(330), soThangHoa(5000)]).toEqual([0, 0, 3, 5, 10, 33, 50])
  })
  it('nhiệm vụ ngày: 3 ô, luôn có «Xong N bài», rút có hạt giống (cùng em + ngày ⇒ cùng bộ), mỗi ô 5–10 tinh thể', () => {
    const a = chonNhiemVu('S1', NGAY)
    expect(a).toHaveLength(3)
    expect(a[0]!.ma).toBe('xong_bai')
    expect(chonNhiemVu('S1', NGAY)).toEqual(a)
    expect(new Set(a.map((x) => x.ma)).size).toBe(3)
    for (const m of MAU_NHIEM_VU) expect(m.thuong >= 5 && m.thuong <= 10).toBe(true)
  })
  it('mục tiêu ngày = số bài của kế hoạch (mức câu đã chốt / 6, làm tròn lên), chưa chốt ⇒ 1', () => {
    expect([mucTieuBai(null), mucTieuBai(0), mucTieuBai(6), mucTieuBai(7), mucTieuBai(24)]).toEqual([1, 1, 1, 2, 4])
  })
  it('công tắc: vắng khoá ⇒ bat; chỉ đúng «tat» mới tắt', () => {
    expect(congTacTuDong([])).toEqual({ thuong_giai_tuan: 'bat', thuong_thang_hoa: 'bat', thuong_ban_be: 'bat', thuong_kim_cuong: 'bat' })
    expect(congTacTuDong([{ khoa: 'thuong_thang_hoa', gia_tri: 'tat' }, { khoa: 'thuong_ban_be', gia_tri: 'linh tinh' }, { khoa: 'thuong_giai_tuan', gia_tri: '"tat"' }]))
      .toEqual({ thuong_giai_tuan: 'tat', thuong_thang_hoa: 'tat', thuong_ban_be: 'bat', thuong_kim_cuong: 'bat' })
  })
})

describe('sổ tinh thể (vang_so)', () => {
  it('kiếm idempotent theo khoá; tiêu chỉ khi đủ số dư (không âm), khoá chống trừ đôi', async () => {
    const { env, du, vang } = await dung()
    vang('S1', 30)
    const luc = new Date(NOW).toISOString()
    await env.DB.batch([lenhCongTinhThe(env, 'S1', { khoa: 'tt|x', so: 15, maMon: 'tt-ruong', luc }), lenhCongTinhThe(env, 'S1', { khoa: 'tt|x', so: 15, maMon: 'tt-ruong', luc })])
    expect(du('S1')).toBe(45)
    await lenhTruTinhThe(env, 'S1', { khoa: 'tt|y', so: 50, maMon: 'tt-binh', luc }).run()
    expect(du('S1')).toBe(45)
    await lenhTruTinhThe(env, 'S1', { khoa: 'tt|z', so: 40, maMon: 'tt-binh', luc }).run()
    await lenhTruTinhThe(env, 'S1', { khoa: 'tt|z', so: 40, maMon: 'tt-binh', luc }).run()
    expect(du('S1')).toBe(5)
  })
})

describe('/hs/thuong + rương', () => {
  it('tổng quan đúng hợp đồng §4.4; nhiệm vụ sinh một lần; mục tiêu ngày; thông báo hiện tới khi đánh dấu đã xem', async () => {
    const { d, env, token, vang } = await dung()
    vang('S1', 40)
    d.sql.prepare("INSERT INTO thong_bao_thuong(em,ma,loai,du_lieu,luc) VALUES('S1','thang_hoa|x','thang_hoa','{\"mat\":5}','2026-10-26T00:00:00Z')").run()
    const r = await hsThuong(env, { token: token.S1 }, undefined, NOW)
    expect(Object.keys(r).sort()).toEqual(['bat', 'chuoiNgay', 'cuoc', 'mucTieu', 'nguyenTuHomNay', 'nhiemVu', 'ok', 'ruong', 'thongBao', 'tinhThe'].sort())
    expect(r.bat).toEqual({ giai: true, thangHoa: true, banBe: true, kimCuong: true })
    expect(r.tinhThe).toBe(40)
    expect(r.mucTieu).toEqual({ daXong: 0, can: 1 })
    expect(r.ruong).toEqual({ mo: false, thuong: 15 })
    expect((r.nhiemVu as unknown[]).length).toBe(3)
    for (const n of r.nhiemVu as Record<string, unknown>[]) expect(Object.keys(n).sort()).toEqual(['can', 'ma', 'ten', 'thuong', 'tien', 'xong'])
    expect(r.thongBao).toEqual([{ ma: 'thang_hoa|x', loai: 'thang_hoa', duLieu: { mat: 5 } }])
    expect((d.sql.prepare('SELECT COUNT(*) AS n FROM nhiem_vu_ngay WHERE em=? AND ngay=?').get('S1', NGAY) as { n: number }).n).toBe(3)
    await hsDaXemThongBao(env, { token: token.S1, ma: 'thang_hoa|x' }, NOW)
    expect((await hsThuong(env, { token: token.S1 }, undefined, NOW)).thongBao).toEqual([])
  })
  it('rương: chưa đủ 3 ô ⇒ từ chối; đủ ⇒ +15 cùng thưởng các ô và mục tiêu; bấm lặp không cộng đôi', async () => {
    const { d, env, token, du } = await dung()
    const nv = d.sql.prepare('INSERT INTO nhiem_vu_ngay(em,ngay,ma,thu_tu,ten,can,da,thuong) VALUES(?,?,?,?,?,?,0,?)')
    nv.run('S1', NGAY, 'xong_bai', 0, 'Xong 1 bài', 1, 10); nv.run('S1', NGAY, 'hoan_hao', 1, 'Bài hoàn hảo', 1, 10); nv.run('S1', NGAY, 'hoc_truoc_20h', 2, 'Học trước 20:00', 1, 5)
    expect((await hsMoRuong(env, { token: token.S1 }, NOW)).ok).toBe(false)
    d.sql.prepare("INSERT INTO thuong_bai_xong(em,phien,ngay,so_cau,so_dung,chuoi_max,kho_dung,hoan_hao,nguyen_tu,luc) VALUES('S1','p1',?,6,6,6,0,1,90,'2026-10-26T03:00:00Z')").run(NGAY)
    const a = await hsMoRuong(env, { token: token.S1 }, NOW)
    expect(a).toMatchObject({ ok: true, ruong: { mo: true, thuong: 15 } })
    expect(du('S1')).toBe(15 + 10 + 10 + 5 + 5)
    const b = await hsMoRuong(env, { token: token.S1 }, NOW)
    expect(b).toMatchObject({ ok: true, daMoTruoc: true })
    expect(du('S1')).toBe(45)
    // Tổng quan sau đó: nhiệm vụ / mục tiêu đã trả không trả lại.
    const r = await hsThuong(env, { token: token.S1 }, undefined, NOW)
    expect(r.tinhThe).toBe(45)
    expect(r.mucTieu).toEqual({ daXong: 1, can: 1 })
  })
})

describe('mua bình (hàm cộng bình của B3 qua cầu nối) + cược chuỗi', () => {
  const chuoi = { so: 5, giuChuoi: 0, sucChua: 2, lich7: [] }
  it('trừ 50 rồi cộng bình (id = khoá giao dịch); bấm lặp trong ngày không trừ đôi; thiếu tinh thể / đủ bình / chuỗi chưa mở ⇒ không trừ', async () => {
    const { env, token, vang, du } = await dung()
    const ids: string[] = []
    gia({ docChuoiNgay: async () => chuoi, congBinh: async (_e, _s, id) => { ids.push(id); return true } })
    expect((await hsMuaBinh(env, { token: token.S1 }, NOW)).ok).toBe(false) // 0 tinh thể
    vang('S1', 120)
    const a = await hsMuaBinh(env, { token: token.S1 }, NOW)
    expect(a).toMatchObject({ ok: true, tinhThe: 70, gia: 50 })
    expect(ids).toEqual([`S1|tt|${NGAY}|binh`])
    expect((await hsMuaBinh(env, { token: token.S1 }, NOW)).ok).toBe(false)
    expect(du('S1')).toBe(70)
    gia({ docChuoiNgay: async () => ({ ...chuoi, giuChuoi: 2 }) })
    expect((await hsMuaBinh(env, { token: token.S1 }, NOW + 86_400_000)).ok).toBe(false)
    gia({ docChuoiNgay: async () => null })
    expect((await hsMuaBinh(env, { token: token.S1 }, NOW + 86_400_000)).ok).toBe(false)
    expect(du('S1')).toBe(70)
  })
  it('hàm cộng bình lỗi ⇒ hoàn đúng 50 (khoá hoàn riêng)', async () => {
    const { env, token, vang, du } = await dung()
    vang('S1', 60)
    gia({ docChuoiNgay: async () => chuoi, congBinh: async () => { throw new Error('D1 lỗi') } })
    const r = await hsMuaBinh(env, { token: token.S1 }, NOW)
    expect(r.ok).toBe(false)
    expect(du('S1')).toBe(60)
  })
  it('cược: đặt đúng 50, một lượt mỗi lúc; cron: giữ chuỗi đủ 7 ngày ⇒ +100; đứt ⇒ mất 50', async () => {
    const { d, env, token, vang, du } = await dung(['S1', 'S2'])
    vang('S1', 60); vang('S2', 50)
    expect((await hsCuocChuoi(env, { token: token.S1, dat: 30 }, NOW)).ok).toBe(false)
    expect(await hsCuocChuoi(env, { token: token.S1, dat: 50 }, NOW)).toMatchObject({ ok: true, tinhThe: 10, cuoc: { dat: 50, tuNgay: NGAY, denNgay: '2026-11-01', thuong: 100 } })
    expect((await hsCuocChuoi(env, { token: token.S1, dat: 50 }, NOW + 86_400_000)).ok).toBe(false)
    expect((await hsCuocChuoi(env, { token: token.S2 }, NOW)).ok).toBe(true)
    expect(du('S2')).toBe(0)
    // S1 học mọi ngày; S2 bỏ ngày 27/10.
    gia({
      docNgayCoHoc: async (_e, ds, tu, den) => {
        const m = new Map<string, Set<string>>()
        for (const s of ds) { const set = new Set<string>(); for (let n = tu; n <= den; n = new Date(Date.parse(`${n}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10)) if (!(s === 'S2' && n === '2026-10-27')) set.add(n); m.set(s, set) }
        return m
      },
      docNgayCoPhep: async () => new Map(), docNgayDuocDo: async () => new Map(),
    })
    const dem = (ngay: string) => Date.parse(`${ngay}T00:15:00+07:00`)
    const r1 = await cronThuongNgay(env, dem('2026-10-28'), true)
    expect(r1).toMatchObject({ cuocThua: 1, cuocThang: 0 })
    const r2 = await cronThuongNgay(env, dem('2026-11-02'), true)
    expect(r2).toMatchObject({ cuocThang: 1 })
    expect(du('S1')).toBe(110)
    await cronThuongNgay(env, dem('2026-11-02'), true)
    expect(du('S1')).toBe(110)
    expect((d.sql.prepare("SELECT trang_thai FROM cuoc_chuoi WHERE em='S2'").get() as { trang_thai: string }).trang_thai).toBe('thua')
  })
})

describe('cron thăng hoa (00:10 VN)', () => {
  const khongHoc = () => gia({ docNgayCoHoc: async () => new Map(), docNgayDuocDo: async () => new Map(), docNgayCoPhep: async () => new Map() })
  it('2 ngày liền không học, không bình ⇒ mất 10 % (tối thiểu 5, tối đa 50, không âm) + thông báo; chạy lại không trừ đôi; số dư 0 không chạy', async () => {
    const { d, env, vang, du } = await dung(['S1', 'S2', 'S3', 'S4'])
    vang('S1', 100); vang('S2', 3); vang('S3', 1000)
    khongHoc()
    const r = await cronThuongNgay(env, DEM)
    expect(r.chay).toBe(true)
    expect([du('S1'), du('S2'), du('S3'), du('S4')]).toEqual([90, 0, 950, 0])
    expect((d.sql.prepare("SELECT du_lieu FROM thong_bao_thuong WHERE em='S1' AND loai='thang_hoa'").get() as { du_lieu: string }).du_lieu).toBe('{"mat":10,"conLai":90}')
    expect((await cronThuongNgay(env, DEM + 60_000)).chay).toBe(false) // đã chạy hôm nay
    await cronThuongNgay(env, DEM + 60_000, true)
    expect([du('S1'), du('S2'), du('S3')]).toEqual([90, 0, 950])
    // Hôm sau: hôm qua vừa thăng hoa ⇒ chưa phạt lại (cần thêm 2 ngày trống mới).
    await cronThuongNgay(env, DEM + 86_400_000)
    expect(du('S1')).toBe(90)
  })
  it('có học / được bình đỡ / ngoài khung giờ / công tắc tắt ⇒ không mất', async () => {
    const { d, env, vang, du } = await dung(['S1', 'S2'])
    vang('S1', 100); vang('S2', 100)
    gia({
      docNgayCoHoc: async () => new Map([['S1', new Set(['2026-10-25'])]]),
      docNgayDuocDo: async () => new Map([['S2', new Set(['2026-10-24'])]]),
    })
    await cronThuongNgay(env, DEM)
    expect([du('S1'), du('S2')]).toEqual([100, 100])
    khongHoc()
    expect((await cronThuongNgay(env, Date.parse('2026-10-26T03:00:00Z'))).chay).toBe(false)
    expect((await gvCongTacThuong(env, { khoa: 'thuong_thang_hoa', giaTri: 'tat' })).ok).toBe(true)
    await cronThuongNgay(env, DEM, true)
    expect([du('S1'), du('S2')]).toEqual([100, 100])
    expect(d.sql.prepare("SELECT COUNT(*) AS n FROM thong_bao_thuong").get()).toEqual({ n: 0 })
  })
  it('cron sinh 3 nhiệm vụ hôm nay cho em có bài trong 7 ngày (một câu cho cả lô)', async () => {
    const { d, env } = await dung(['S1'])
    khongHoc()
    d.sql.prepare("INSERT INTO thuong_bai_xong(em,phien,ngay,so_cau,so_dung,luc) VALUES('S1','p','2026-10-23',6,3,'2026-10-23T03:00:00Z')").run()
    const r = await cronThuongNgay(env, DEM)
    expect(r.sinh).toBe(1)
    expect((d.sql.prepare('SELECT ma FROM nhiem_vu_ngay WHERE em=? AND ngay=? ORDER BY thu_tu').all('S1', NGAY) as { ma: string }[]).map((x) => x.ma)).toEqual(chonNhiemVu('S1', NGAY).map((x) => x.ma))
  })
})

describe('công tắc thầy + huy hiệu', () => {
  it('đọc mặc định «bat»; ghi một khoá; khoá lạ / giá trị lạ ⇒ lỗi 400', async () => {
    const { env } = await dung()
    expect(await gvCongTacThuong(env, {})).toEqual({ ok: true, congTac: { thuong_giai_tuan: 'bat', thuong_thang_hoa: 'bat', thuong_ban_be: 'bat', thuong_kim_cuong: 'bat' } })
    expect((await gvCongTacThuong(env, { khoa: 'thuong_kim_cuong', giaTri: 'tat' }))).toMatchObject({ ok: true, congTac: { thuong_kim_cuong: 'tat', thuong_giai_tuan: 'bat' } })
    expect(await gvCongTacThuong(env, { khoa: 'thuong_la', giaTri: 'tat' })).toMatchObject({ ok: false, loi400: true })
    expect(await gvCongTacThuong(env, { khoa: 'thuong_ban_be', giaTri: 'mo' })).toMatchObject({ ok: false, loi400: true })
  })
  it('huy hiệu: danh sách đủ (gồm chuỗi đôi doi_7/30/100); 10 bài hoàn hảo ⇒ trao một lần + thông báo', async () => {
    const { d, env, token } = await dung()
    gia({ docChuoiNgay: async () => null })
    const st = d.sql.prepare("INSERT INTO thuong_bai_xong(em,phien,ngay,so_cau,so_dung,chuoi_max,hoan_hao,luc) VALUES('S1',?,?,6,6,6,1,'2026-10-20T03:00:00Z')")
    for (let i = 0; i < 10; i++) st.run(`p${i}`, '2026-10-20')
    const r = await hsHuyHieu(env, { token: token.S1 }, undefined, NOW)
    const ds = r.huyHieu as { ma: string; co: boolean; tienDo?: { da: number; can: number } }[]
    for (const ma of ['chuoi_7', 'hoan_hao_10', 'doi_7', 'doi_30', 'doi_100', 'cu_dem']) expect(ds.some((h) => h.ma === ma), ma).toBe(true)
    expect(ds.find((h) => h.ma === 'hoan_hao_10')).toMatchObject({ co: true, tienDo: { da: 10, can: 10 } })
    await hsHuyHieu(env, { token: token.S1 }, undefined, NOW)
    expect(d.sql.prepare("SELECT COUNT(*) AS n FROM huy_hieu_em WHERE em='S1' AND ma='hoan_hao_10'").get()).toEqual({ n: 1 })
    expect(d.sql.prepare("SELECT COUNT(*) AS n FROM thong_bao_thuong WHERE em='S1' AND ma='huy_hieu|hoan_hao_10'").get()).toEqual({ n: 1 })
  })
})
