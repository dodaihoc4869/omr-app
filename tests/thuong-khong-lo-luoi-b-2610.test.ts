// @vitest-environment node
// KHÔNG LỘ HỆ LƯỜI Ở /hs (thưởng phạt phần B, luật cứng thầy 26/10): mọi phản hồi /hs mới của phần B (giai, ban, ban/tim, ban/moi, ban/tra-loi, ban/go-cua,
// ban/thoi) và mọi thông báo B ghi cho học sinh (cuoi_tuan, moc_doi, go_cua, moi_ban) KHÔNG chứa khoá hay chữ của hệ lười — kể cả khi em đang bị xếp
// Đối phó / ĐUỔI và bị loại nguyên tử khỏi bảng giải. Cũng không lộ số báo danh của bạn khác.
import { describe, expect, it } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import { gameToken } from '../server/src/game-v2-auth'
import { chotTuan, hsGiai, tomTatGiaiEm, xepNhomCho, xoaNhoGiai } from '../server/src/thuong-giai-tuan'
import { cronChuoiDoi, hsBan, hsBanGoCua, hsBanMoi, hsBanThoi, hsBanTim, hsBanTraLoi, xoaNhoBanBe } from '../server/src/thuong-ban-be'

const VN = (s: string): number => Date.parse(`${s}+07:00`)
const NOW = VN('2026-10-28T10:00:00')
const TUAN = '2026-10-26'

/** Khoá / chữ của hệ lười (Học thật/Đối phó, 5 bậc, Mức làm Bấm vội/treo máy) + số báo danh. */
const CAM_KHOA = /"(nhan|bac|bacDuoi|bacTuan|diemThat|hocThat|doiPho|nguyenTuThat|nguyenTuLoai|tiLeHocThat|mucLam|muc_lam|khongTinh|lyDo|phat|coDo|sbd|em_a|em_b)"/
const CAM_CHU = /Học thật|Đối phó|ĐUỔI|Không dạy nổi|Cần theo dõi|lười|Bấm vội|vội|treo máy|bị loại/i

function themEm(d: D1That, sbd: string, ten: string, tenLop = '12A1') {
  d.sql.prepare("INSERT INTO hoc_sinh(sbd, ho_ten, lop, ten_lop, mat_khau, cap_nhat_luc) VALUES (?, ?, '12', ?, 'mk', 'x')").run(sbd, ten, tenLop)
}
const maCua = (d: D1That, sbd: string): string => `e${(d.sql.prepare('SELECT rowid AS r FROM hoc_sinh WHERE sbd = ?').get(sbd) as { r: number }).r.toString(36)}`
let k = 0
const nguyenTu = (d: D1That, sbd: string, exp: number, ngay = '2026-10-27', ghiChu: string | null = null) =>
  d.sql.prepare("INSERT INTO exp_so (khoa, sbd, ngay_vn, loai, exp, luc, ghi_chu) VALUES (?, ?, ?, 'cau', ?, ?, ?)").run(`${sbd}|${++k}`, sbd, ngay, exp, `${ngay}T02:00:00Z`, ghiChu)
function hoc(d: D1That, sbd: string, ngay: string) {
  for (let q = 0; q < 6; q++) d.sql.prepare("INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, ket_qua, luc, ngay_vn) VALUES (?, ?, ?, 'on_lai', 'm', 1, ?, ?)").run(`${sbd}|${ngay}|${q}|${++k}`, sbd, `Q${q}`, `${ngay}T02:00:00Z`, ngay)
}
function sach(nhan: string, v: unknown) {
  const json = JSON.stringify(v)
  expect(json, nhan).not.toMatch(CAM_KHOA)
  expect(json, nhan).not.toMatch(CAM_CHU)
  for (const s of ['LUOI1', 'LUOI2', 'BAN01', 'BAN02']) expect(json, `${nhan}: lộ SBD ${s}`).not.toContain(`"${s}"`)
}

describe('phần B không lộ hệ lười ở /hs', () => {
  it('em bị xếp Đối phó / ĐUỔI: mọi phản hồi /hs của giải + học cùng bạn và mọi thông báo B ghi đều sạch', async () => {
    xoaNhoGiai(); xoaNhoBanBe()
    const d = taoD1That()
    d.sql.exec('CREATE TABLE IF NOT EXISTS thong_bao_thuong (em TEXT NOT NULL, ma TEXT NOT NULL, loai TEXT NOT NULL, du_lieu TEXT, luc TEXT NOT NULL, da_xem TEXT, PRIMARY KEY (em, ma))')
    d.sql.exec('CREATE TABLE IF NOT EXISTS huy_hieu_em (em TEXT NOT NULL, ma TEXT NOT NULL, ngay TEXT NOT NULL, du_lieu TEXT, luc TEXT NOT NULL, PRIMARY KEY (em, ma))')
    themEm(d, 'LUOI1', 'Nguyễn Văn Lâm'); themEm(d, 'LUOI2', 'Trần Văn Tùng'); themEm(d, 'BAN01', 'Lê Thị Bạn', '11B2'); themEm(d, 'BAN02', 'Phạm Văn Hai')
    for (const s of ['LUOI1', 'LUOI2', 'BAN01', 'BAN02']) nguyenTu(d, s, 40)
    nguyenTu(d, 'LUOI1', 5, '2026-10-27', 'Câu đúng có hỗ trợ: +5')
    d.sql.prepare("INSERT INTO danh_gia_em_tuan (sbd, tuan, diem, bac_tuan, bac, tinh_luc, phat_json, ly_do_json) VALUES ('LUOI1', ?, 20, 3, 5, 'x', '[\"Bấm vội\"]', '[\"Đối phó\"]')").run(TUAN)
    d.sql.prepare("INSERT INTO danh_gia_em_tuan (sbd, tuan, diem, bac_tuan, bac, tinh_luc) VALUES ('LUOI2', ?, 50, 3, 3, 'x')").run(TUAN)
    d.sql.prepare("INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES ('giai_tuan_chot', '2026-10-19', 'x')").run()
    await xepNhomCho(d.env, TUAN)
    const t1 = await gameToken(d.env, 'LUOI1'), t2 = await gameToken(d.env, 'LUOI2')

    const giai = (await hsGiai(d.env, { token: t1 }, NOW)) as Record<string, any>
    expect(giai.nhom.find((x: any) => x.laEm).nguyenTu).toBe(0) // bị loại khỏi bảng mà không có lý do nào
    sach('/hs/giai', giai)
    sach('tomTatGiaiEm', await tomTatGiaiEm(d.env, 'LUOI1', NOW))

    sach('/hs/ban/tim', await hsBanTim(d.env, { token: t1, q: 'van' }))
    sach('/hs/ban/moi', await hsBanMoi(d.env, { token: t1, ma: maCua(d, 'LUOI2') }, NOW))
    sach('/hs/ban (lời mời)', await hsBan(d.env, { token: t2 }, NOW))
    sach('/hs/ban/tra-loi', await hsBanTraLoi(d.env, { token: t2, ma: maCua(d, 'LUOI1'), dongY: true }, NOW))
    hoc(d, 'LUOI1', '2026-10-28')
    sach('/hs/ban', await hsBan(d.env, { token: t1 }, NOW))
    sach('/hs/ban/go-cua', await hsBanGoCua(d.env, { token: t1, ma: maCua(d, 'LUOI2') }, NOW))
    sach('/hs/ban/tim (sbd)', await hsBanTim(d.env, { token: t1, q: 'BAN01' }))

    // Thông báo cuối tuần + mốc đôi.
    d.sql.prepare("UPDATE ban_hoc SET chuoi_doi = 6, ngay_tinh = '2026-10-27'").run()
    hoc(d, 'LUOI2', '2026-10-28')
    await cronChuoiDoi(d.env, VN('2026-10-29T00:15:00'))
    for (let i = 0; i < 3; i++) await chotTuan(d.env, TUAN, '2026-11-02', VN('2026-11-02T00:06:00') + i * 60_000)
    sach('/hs/ban/thoi', await hsBanThoi(d.env, { token: t1, ma: maCua(d, 'LUOI2') }, NOW))
    const tb = d.sql.prepare('SELECT loai, du_lieu FROM thong_bao_thuong').all() as { loai: string; du_lieu: string }[]
    expect(new Set(tb.map((x) => x.loai))).toEqual(new Set(['moi_ban', 'go_cua', 'moc_doi', 'cuoi_tuan']))
    for (const x of tb) sach(`thông báo ${x.loai}`, JSON.parse(x.du_lieu))
  })
})
