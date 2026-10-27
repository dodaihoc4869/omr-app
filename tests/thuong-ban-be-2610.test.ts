// @vitest-environment node
// HỌC CÙNG BẠN (thưởng phạt phần B, thầy chốt 26/10): tối đa 3 bạn, phải đồng ý, tìm theo tên/SBD ≤ 10 (không lộ SBD), chuỗi đôi tăng khi CẢ HAI xong ≥ 1 bài
// (luật B3: ≥ 6 câu khác nhau hoặc tự sửa xong), bình giữ chuỗi / vắng có phép đỡ cho bạn đó, mốc 7/30/100 ⇒ tinh thể cả hai (khoá chống lặp),
// gõ cửa 1 lần/ngày/bạn, không trả điểm/nguyên tử/nhãn của bạn. D1 = SQLite trong bộ nhớ trên lược đồ thật.
import { beforeEach, describe, expect, it } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import { gameToken } from '../server/src/game-v2-auth'
import {
  buocChuoiDoi, cronChuoiDoi, homNayDoi, hsBan, hsBanGoCua, hsBanMoi, hsBanThoi, hsBanTim, hsBanTraLoi, mocMoiDat, xoaNhoBanBe,
} from '../server/src/thuong-ban-be'
import { ngayCoHoc } from '../server/src/thuong-ngay-hoc'

const VN = (s: string): number => Date.parse(`${s}+07:00`)
const NOW = VN('2026-10-28T10:00:00') // thứ Tư

beforeEach(() => xoaNhoBanBe())

function themEm(d: D1That, sbd: string, ten: string, tenLop = '12A1', trangThai: string | null = null) {
  d.sql.prepare("INSERT INTO hoc_sinh(sbd, ho_ten, lop, ten_lop, mat_khau, trang_thai, cap_nhat_luc) VALUES (?, ?, '12', ?, 'mk', ?, 'x')").run(sbd, ten, tenLop, trangThai)
}
const maCua = (d: D1That, sbd: string): string => `e${(d.sql.prepare('SELECT rowid AS r FROM hoc_sinh WHERE sbd = ?').get(sbd) as { r: number }).r.toString(36)}`
let k = 0
/** Em xong `soCau` câu khác nhau trong ngày VN `ngay` (6 câu = 1 bài). */
function hoc(d: D1That, sbd: string, ngay: string, soCau = 6) {
  for (let q = 0; q < soCau; q++) {
    d.sql.prepare("INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, ket_qua, luc, ngay_vn) VALUES (?, ?, ?, 'on_lai', 'm', 1, ?, ?)")
      .run(`${sbd}|${ngay}|${q}|${++k}`, sbd, `Q${q}`, `${ngay}T02:00:00Z`, ngay)
  }
}
function phep(d: D1That, sbd: string, ngay: string) {
  const id = `B${++k}`
  d.sql.prepare("INSERT INTO buoi_hoc (id, ten, lop, bi_mat, mo_luc, het_han, cap_nhat_luc) VALUES (?, 'Buổi', '12A1', 'x', ?, ?, 'x')").run(id, `${ngay}T03:00:00Z`, `${ngay}T05:00:00Z`)
  d.sql.prepare("INSERT INTO buoi_hoc_diem_danh (buoi_id, sbd, luc, cach, trang_thai, cap_nhat_luc) VALUES (?, ?, 'x', 'tay', 'co_phep', 'x')").run(id, sbd)
}
function bangPhanA(d: D1That) {
  // ĐÚNG DDL của phần A (migration-2610-thuong-phat.sql).
  d.sql.exec('CREATE TABLE IF NOT EXISTS thong_bao_thuong (em TEXT NOT NULL, ma TEXT NOT NULL, loai TEXT NOT NULL, du_lieu TEXT, luc TEXT NOT NULL, da_xem TEXT, PRIMARY KEY (em, ma))')
  d.sql.exec('CREATE TABLE IF NOT EXISTS huy_hieu_em (em TEXT NOT NULL, ma TEXT NOT NULL, ngay TEXT NOT NULL, du_lieu TEXT, luc TEXT NOT NULL, PRIMARY KEY (em, ma))')
}
const cap = (d: D1That, a: string, b: string) => d.sql.prepare('SELECT * FROM ban_hoc WHERE em_a = ? AND em_b = ?').get(a < b ? a : b, a < b ? b : a) as Record<string, any> | undefined
async function ketBan(d: D1That, a: string, b: string, luc = VN('2026-10-26T08:00:00')) {
  expect(await hsBanMoi(d.env, { token: await gameToken(d.env, a), ma: maCua(d, b) }, luc)).toMatchObject({ ok: true, trangThai: 'da_moi' })
  expect(await hsBanTraLoi(d.env, { token: await gameToken(d.env, b), ma: maCua(d, a), dongY: true }, luc)).toMatchObject({ ok: true, trangThai: 'ban' })
}
async function cronDen(d: D1That, ms: number, lan = 4) {
  for (let i = 0; i < lan; i++) { xoaNhoBanBe(); await cronChuoiDoi(d.env, ms + i * 60_000) }
}

describe('hàm thuần', () => {
  it('bước chuỗi đôi: cả hai học +1; được đỡ (phép/bình/cứu) giữ; một bạn lỡ ⇒ 0', () => {
    expect(buocChuoiDoi(3, 'hoc', 'hoc')).toBe(4)
    expect(buocChuoiDoi(3, 'hoc', 'binh')).toBe(3)
    expect(buocChuoiDoi(3, 'phep', 'hoc')).toBe(3)
    expect(buocChuoiDoi(3, 'cuu', 'phep')).toBe(3)
    expect(buocChuoiDoi(3, 'hoc', 'tat')).toBe(0)
    expect(homNayDoi(true, false)).toBe('ban_chua')
    expect(homNayDoi(false, true)).toBe('em_chua')
    expect(mocMoiDat(7, 0).map((m) => m.tinhThe)).toEqual([10])
    expect(mocMoiDat(30, 7).map((m) => m.tinhThe)).toEqual([30])
    expect(mocMoiDat(100, 30).map((m) => m.tinhThe)).toEqual([100])
    expect(mocMoiDat(8, 7)).toEqual([])
  })
})

describe('mời / đồng ý / tối đa 3 / thôi', () => {
  it('phải đồng ý mới thành bạn; từ chối ⇒ không thành; mời lặp không nhân đôi; tối đa 3 bạn', async () => {
    const d = taoD1That(); bangPhanA(d)
    for (const [s, t] of [['A', 'Nguyễn Văn An'], ['B', 'Trần Thị Bình'], ['C', 'Lê Văn Cường'], ['D', 'Phạm Thị Dung'], ['E', 'Hoàng Văn Em']]) themEm(d, s!, t!)
    const tA = await gameToken(d.env, 'A')
    expect(await hsBanMoi(d.env, { token: tA, ma: maCua(d, 'B') }, NOW)).toMatchObject({ ok: true, trangThai: 'da_moi' })
    expect(await hsBanMoi(d.env, { token: tA, ma: maCua(d, 'B') }, NOW)).toMatchObject({ ok: true, trangThai: 'da_moi' })
    expect(d.dem('ban_hoc')).toBe(1)
    expect(d.dem('thong_bao_thuong', "loai = 'moi_ban' AND em = 'B'")).toBe(1)
    const banB = (await hsBan(d.env, { token: await gameToken(d.env, 'B') }, NOW)) as Record<string, any>
    expect(banB.ban).toEqual([])
    expect(banB.loiMoi).toEqual([{ ma: maCua(d, 'A'), ten: 'Nguyễn Văn An', lop: '12A1' }])
    expect(await hsBanTraLoi(d.env, { token: await gameToken(d.env, 'B'), ma: maCua(d, 'A'), dongY: false }, NOW)).toMatchObject({ ok: true, trangThai: null })
    expect(cap(d, 'A', 'B')!.trang_thai).toBe('tu_choi')
    // Mời lại sau khi bị từ chối được; lần này đồng ý.
    await ketBan(d, 'A', 'B', NOW)
    await ketBan(d, 'A', 'C', NOW)
    await ketBan(d, 'A', 'D', NOW)
    const r = await hsBanMoi(d.env, { token: tA, ma: maCua(d, 'E') }, NOW)
    expect(r).toMatchObject({ ok: false })
    expect(String(r.error)).toContain('3')
    // E mời A (A đã đủ 3) ⇒ A không đồng ý được.
    expect(await hsBanMoi(d.env, { token: await gameToken(d.env, 'E'), ma: maCua(d, 'A') }, NOW)).toMatchObject({ ok: false })
    // Thôi học cùng: bạn kia không nhận thông báo nào; A lại mời được E.
    const tb0 = d.dem('thong_bao_thuong')
    expect(await hsBanThoi(d.env, { token: tA, ma: maCua(d, 'D') }, NOW)).toMatchObject({ ok: true })
    expect(cap(d, 'A', 'D')!.trang_thai).toBe('thoi')
    expect(d.dem('thong_bao_thuong')).toBe(tb0)
    expect(await hsBanMoi(d.env, { token: tA, ma: maCua(d, 'E') }, NOW)).toMatchObject({ ok: true, trangThai: 'da_moi' })
  })
  it('bạn đã mời em ⇒ em bấm mời lại là thành bạn luôn; mã lạ / chính mình / tài khoản khoá ⇒ không tìm thấy; token sai ⇒ lỗi đăng nhập', async () => {
    const d = taoD1That(); themEm(d, 'A', 'An'); themEm(d, 'B', 'Bình'); themEm(d, 'K', 'Khoá', '12A1', 'khoa')
    const tA = await gameToken(d.env, 'A')
    await hsBanMoi(d.env, { token: await gameToken(d.env, 'B'), ma: maCua(d, 'A') }, NOW)
    expect(await hsBanMoi(d.env, { token: tA, ma: maCua(d, 'B') }, NOW)).toMatchObject({ ok: true, trangThai: 'ban' })
    expect(await hsBanMoi(d.env, { token: tA, ma: 'ezzzz' }, NOW)).toMatchObject({ ok: false })
    expect(await hsBanMoi(d.env, { token: tA, ma: maCua(d, 'A') }, NOW)).toMatchObject({ ok: false })
    expect(await hsBanMoi(d.env, { token: tA, ma: maCua(d, 'K') }, NOW)).toMatchObject({ ok: false })
    expect((await hsBan(d.env, { token: 'sai' }, NOW)).ok).toBe(false)
  })
})

describe('tìm bạn', () => {
  it('theo tên (không dấu) hoặc SBD đúng; tối đa 10; không trả SBD; không có chính em / em bị khoá', async () => {
    const d = taoD1That()
    themEm(d, 'TIM0', 'Ngô Văn Tìm')
    for (let i = 0; i < 14; i++) themEm(d, `N${i}`, `Nguyễn Thị Hoa ${i}`, i % 2 ? '12A1' : '11B2')
    themEm(d, 'KX', 'Nguyễn Thị Hoa Khoá', '12A1', 'khoa')
    const t = await gameToken(d.env, 'TIM0')
    const r = (await hsBanTim(d.env, { token: t, q: 'nguyen thi hoa' })) as Record<string, any>
    expect(r.ketQua).toHaveLength(10)
    const json = JSON.stringify(r)
    expect(json).not.toMatch(/"N\d+"|KX|TIM0|sbd/)
    expect(json).not.toContain('Khoá')
    const s = (await hsBanTim(d.env, { token: t, q: 'N7' })) as Record<string, any>
    expect(s.ketQua).toEqual([{ ma: maCua(d, 'N7'), ten: 'Nguyễn Thị Hoa 7', lop: '12A1', trangThai: null }])
    expect(((await hsBanTim(d.env, { token: t, q: 'tìm' })) as Record<string, any>).ketQua).toEqual([]) // chính em
    expect(((await hsBanTim(d.env, { token: t, q: 'a' })) as Record<string, any>).ketQua).toEqual([]) // < 2 ký tự
  })
})

describe('/hs/ban + gõ cửa', () => {
  it('ngọn lửa đôi tăng ngay khi cả hai xong bài hôm nay; trạng thái hôm nay; KHÔNG điểm/nguyên tử/SBD của bạn; một batch đọc', async () => {
    const d = taoD1That(); bangPhanA(d); themEm(d, 'A', 'Nguyễn Văn An'); themEm(d, 'B', 'Trần Thị Bình', '11B2')
    await ketBan(d, 'A', 'B')
    d.sql.prepare("UPDATE ban_hoc SET chuoi_doi = 2, ngay_tinh = '2026-10-27'").run()
    d.sql.prepare("INSERT INTO exp_so (khoa, sbd, ngay_vn, loai, exp, luc) VALUES ('B|x', 'B', '2026-10-28', 'cau', 777, 'x')").run()
    const tA = await gameToken(d.env, 'A')
    hoc(d, 'A', '2026-10-28', 5) // 5 câu: chưa xong bài
    const b0 = d.soLenh.batch
    let r = (await hsBan(d.env, { token: tA }, NOW)) as Record<string, any>
    expect(d.soLenh.batch - b0).toBe(1)
    expect(r.ban).toEqual([{ ma: maCua(d, 'B'), ten: 'Trần Thị Bình', lop: '11B2', chuoiDoi: 2, homNay: 'ca_hai_chua', daGoCua: false }])
    hoc(d, 'A', '2026-10-28', 6)
    r = (await hsBan(d.env, { token: tA }, NOW)) as Record<string, any>
    expect(r.ban[0]).toMatchObject({ homNay: 'ban_chua', chuoiDoi: 2 })
    hoc(d, 'B', '2026-10-28', 6)
    r = (await hsBan(d.env, { token: tA }, NOW)) as Record<string, any>
    expect(r.ban[0]).toMatchObject({ homNay: 'ca_hai', chuoiDoi: 3 })
    const json = JSON.stringify(r)
    expect(json).not.toMatch(/777|"B"|diem|nguyenTu|Học thật|Đối phó|bac/)
  })
  it('gõ cửa 1 lần/ngày/bạn ⇒ một thông báo go_cua cho bạn; ngày mới gõ lại được; chưa là bạn ⇒ không gõ được', async () => {
    const d = taoD1That(); bangPhanA(d); themEm(d, 'A', 'Nguyễn Văn An'); themEm(d, 'B', 'Trần Thị Bình'); themEm(d, 'C', 'Lê Văn Cường')
    await ketBan(d, 'A', 'B')
    const tA = await gameToken(d.env, 'A')
    expect(await hsBanGoCua(d.env, { token: tA, ma: maCua(d, 'B') }, NOW)).toMatchObject({ ok: true, daGoCua: true, moi: true })
    expect(await hsBanGoCua(d.env, { token: tA, ma: maCua(d, 'B') }, NOW + 60_000)).toMatchObject({ ok: true, moi: false })
    expect(d.dem('thong_bao_thuong', "loai = 'go_cua' AND em = 'B'")).toBe(1)
    const tb = d.sql.prepare("SELECT du_lieu FROM thong_bao_thuong WHERE loai = 'go_cua'").get() as { du_lieu: string }
    expect(JSON.parse(tb.du_lieu)).toEqual({ ma: maCua(d, 'A'), ten: 'Nguyễn Văn An', lop: '12A1' })
    expect(((await hsBan(d.env, { token: tA }, NOW)) as Record<string, any>).ban[0].daGoCua).toBe(true)
    expect(await hsBanGoCua(d.env, { token: tA, ma: maCua(d, 'B') }, VN('2026-10-29T08:00:00'))).toMatchObject({ moi: true })
    expect(await hsBanGoCua(d.env, { token: tA, ma: maCua(d, 'C') }, NOW)).toMatchObject({ ok: false })
  })
  it('công tắc thuong_ban_be = tat ⇒ {bat:false}, lệnh ghi bị chặn', async () => {
    const d = taoD1That(); themEm(d, 'A', 'An'); themEm(d, 'B', 'Bình')
    d.sql.prepare("INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES ('thuong_ban_be', 'tat', 'x')").run()
    const tA = await gameToken(d.env, 'A')
    expect(await hsBan(d.env, { token: tA }, NOW)).toEqual({ ok: true, bat: false })
    expect(await hsBanMoi(d.env, { token: tA, ma: maCua(d, 'B') }, NOW)).toMatchObject({ ok: false, bat: false })
    expect(d.dem('ban_hoc')).toBe(0)
  })
})

describe('cron chuỗi đôi (00:10 VN)', () => {
  it('cả hai học ⇒ +1 mỗi ngày; bình giữ chuỗi của bạn nào đỡ bạn ấy; hết bình mà lỡ ⇒ về 0', async () => {
    const d = taoD1That(); bangPhanA(d); themEm(d, 'A', 'An'); themEm(d, 'B', 'Bình')
    await ketBan(d, 'A', 'B') // thứ Hai 26/10 ⇒ chuỗi đôi tính từ 26
    for (const n of ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29']) hoc(d, 'A', n)
    for (const n of ['2026-10-26', '2026-10-27']) hoc(d, 'B', n)
    expect(await cronChuoiDoi(d.env, VN('2026-10-28T00:05:00'))).toMatchObject({ lyDo: 'chua_toi_gio' })
    await cronDen(d, VN('2026-10-28T00:15:00'))
    expect(cap(d, 'A', 'B')).toMatchObject({ chuoi_doi: 2, ngay_tinh: '2026-10-27' })
    // 28: B lỡ, nhưng có 1 bình tặng thứ Hai (luật B3) ⇒ bình tự đỡ ⇒ chuỗi đôi giữ 2.
    await cronDen(d, VN('2026-10-29T00:15:00'))
    expect(cap(d, 'A', 'B')).toMatchObject({ chuoi_doi: 2, ngay_tinh: '2026-10-28' })
    expect(await ngayCoHoc(d.env, 'B', '2026-10-28', VN('2026-10-28T20:00:00'))).toBe('cho') // hôm nay chưa xong ⇒ còn chờ
    expect(await ngayCoHoc(d.env, 'B', '2026-10-28', VN('2026-10-29T08:00:00'))).toBe('binh') // qua ngày ⇒ bình đã đỡ
    // 29: B lỡ tiếp, hết bình ⇒ chuỗi đôi tắt.
    await cronDen(d, VN('2026-10-30T00:15:00'))
    expect(cap(d, 'A', 'B')).toMatchObject({ chuoi_doi: 0, ngay_tinh: '2026-10-29' })
    // Chạy lại cùng ngày ⇒ không đổi (CAS ngay_tinh).
    await cronDen(d, VN('2026-10-30T00:20:00'))
    expect(cap(d, 'A', 'B')).toMatchObject({ chuoi_doi: 0, ngay_tinh: '2026-10-29' })
  })
  it('ngày vắng có phép đỡ cho bạn đó (không tốn bình); ngayCoHoc trả đúng kiểu ngày', async () => {
    const d = taoD1That(); themEm(d, 'C', 'Cường'); themEm(d, 'D', 'Dung')
    await ketBan(d, 'C', 'D')
    hoc(d, 'C', '2026-10-26'); phep(d, 'D', '2026-10-26'); hoc(d, 'C', '2026-10-27'); hoc(d, 'D', '2026-10-27')
    await cronDen(d, VN('2026-10-28T00:15:00'))
    expect(cap(d, 'C', 'D')).toMatchObject({ chuoi_doi: 1, ngay_tinh: '2026-10-27' })
    expect(await ngayCoHoc(d.env, 'D', '2026-10-26', VN('2026-10-28T08:00:00'))).toBe('phep')
    expect(await ngayCoHoc(d.env, 'C', '2026-10-26', VN('2026-10-28T08:00:00'))).toBe('hoc')
    expect(await ngayCoHoc(d.env, 'C', '2026-10-25', VN('2026-10-28T08:00:00'))).toBe('tat')
  })
  it('mốc 7 ⇒ +10 tinh thể cả hai, huy hiệu đôi, thông báo moc_doi; chạy lại không cộng đôi; bạn bị khoá ⇒ cặp kết thúc êm', async () => {
    const d = taoD1That(); bangPhanA(d); themEm(d, 'A', 'Nguyễn Văn An'); themEm(d, 'B', 'Trần Thị Bình'); themEm(d, 'X', 'Xuân')
    await ketBan(d, 'A', 'B'); await ketBan(d, 'A', 'X')
    d.sql.prepare("UPDATE ban_hoc SET chuoi_doi = 6, ngay_tinh = '2026-10-27'").run()
    hoc(d, 'A', '2026-10-28'); hoc(d, 'B', '2026-10-28')
    d.sql.prepare("UPDATE hoc_sinh SET trang_thai = 'khoa' WHERE sbd = 'X'").run()
    await cronDen(d, VN('2026-10-29T00:15:00'))
    expect(cap(d, 'A', 'B')).toMatchObject({ chuoi_doi: 7, moc_da: 7 })
    expect(cap(d, 'A', 'X')!.trang_thai).toBe('thoi')
    expect(d.dem('vang_so', "ma_mon = 'tt-moc-chuoi-doi' AND so_vang = 10")).toBe(2)
    expect(d.dem('huy_hieu_em', "ma = 'doi_7'")).toBe(2)
    expect(d.dem('thong_bao_thuong', "loai = 'moc_doi'")).toBe(2)
    expect(JSON.parse((d.sql.prepare("SELECT du_lieu FROM thong_bao_thuong WHERE em = 'A' AND loai = 'moc_doi'").get() as any).du_lieu)).toEqual({ moc: 7, tinhThe: 10, ban: 'Trần Thị Bình' })
    // Giả lập chạy lại ngày đó: mốc đã thưởng (moc_da) + khoá vang_so ⇒ không cộng đôi.
    d.sql.prepare("UPDATE ban_hoc SET chuoi_doi = 6, ngay_tinh = '2026-10-27', moc_da = 0 WHERE em_a = 'A' AND em_b = 'B'").run()
    await cronDen(d, VN('2026-10-29T00:30:00'))
    expect(d.dem('vang_so', "ma_mon = 'tt-moc-chuoi-doi'")).toBe(2)
    expect(d.dem('thong_bao_thuong', "loai = 'moc_doi'")).toBe(2)
  })
})
