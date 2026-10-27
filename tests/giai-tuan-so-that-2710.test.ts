// @vitest-environment node
// THẦY 27/10 (ảnh máy em, 12 - Lớp Thường): thanh trên 597 nguyên tử, bảng Giải tuần ghi em 0 (hạng 20, các bạn hạng 16–19 cũng 0), luật cũ dòng 4 «chưa có
// nguyên tử thì chưa vào bảng». Đọc D1 thật (workflow chỉ đọc do-giai-tuan-2710, ẩn danh): em ấy hôm nay 597 · sổ tuần 623 · giai_tuan.nguyen_tu 623 (bảng
// khớp sổ cho cả 262/262 em) · danh_gia_em_tuan.bac = 3 ⇒ luật «chỉ Học thật» (thầy chốt 26/10) đưa nguyên tử TÍNH HẠNG về 0; 64/261 em đã xếp nhóm hiện 0
// cùng lý do. Test tái hiện đúng số ấy + luật hiện cho em nói đúng cách tính (thanh trên = hôm nay, bảng = tính hạng cả tuần).
import { beforeEach, describe, expect, it } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import { gameToken } from '../server/src/game-v2-auth'
import { cronGiaiTuan, hsGiai, xoaNhoGiai } from '../server/src/thuong-giai-tuan'
import { LUAT_GIAI } from '../src/components/thuong/ManGiai'

const VN = (s: string): number => Date.parse(`${s}+07:00`)
const NOW = VN('2026-10-27T17:00:00')
const TUAN = '2026-10-26'
beforeEach(() => xoaNhoGiai())

let k = 0
function nt(d: D1That, sbd: string, exp: number, luc: string) {
  d.sql.prepare("INSERT OR IGNORE INTO exp_so (khoa, sbd, ngay_vn, loai, exp, luc) VALUES (?, ?, ?, 'cau_game', ?, ?)").run(`${sbd}|k${++k}`, sbd, luc.slice(0, 10), exp, new Date(VN(luc)).toISOString())
}

describe('giải tuần: số trên bảng = nguyên tử tính hạng của tuần, cùng nguồn sổ', () => {
  it('em 26 (thứ Hai) + 597 (hôm nay) ⇒ giai_tuan 623 = sổ tuần; tuần bị xếp bậc 3 ⇒ bảng 0 (đúng luật Học thật); bạn bậc 1 ⇒ đủ số', async () => {
    const d = taoD1That()
    for (const [s, ten] of [['E1', 'Em Một'], ['E2', 'Em Hai']]) d.sql.prepare("INSERT INTO hoc_sinh(sbd, ho_ten, lop, ten_lop, mat_khau, cap_nhat_luc) VALUES (?, ?, '12', '12 - Lớp Thường', 'mk', 'x')").run(s, ten)
    d.sql.prepare("INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES ('giai_tuan_chot', '2026-10-19', 'x')").run()
    nt(d, 'E1', 26, '2026-10-26T21:00:00')
    for (let i = 0; i < 30; i++) nt(d, 'E1', i < 29 ? 20 : 17, `2026-10-27T${String(8 + Math.floor(i / 6)).padStart(2, '0')}:${String((i % 6) * 9).padStart(2, '0')}:00`)
    nt(d, 'E2', 300, '2026-10-27T09:00:00')
    const homNay = (d.sql.prepare("SELECT SUM(exp) s FROM exp_so WHERE sbd = 'E1' AND ngay_vn = '2026-10-27'").get() as { s: number }).s
    expect(homNay).toBe(597)
    // Bảng phái sinh khớp sổ (trigger cộng sẵn, không lệch múi giờ đầu tuần).
    expect((d.sql.prepare('SELECT nguyen_tu FROM giai_tuan WHERE tuan = ? AND em = ?').get(TUAN, 'E1') as { nguyen_tu: number }).nguyen_tu).toBe(623)
    d.sql.prepare("INSERT INTO danh_gia_em_tuan (sbd, tuan, diem, bac_tuan, bac, tinh_luc) VALUES ('E1', ?, 40, 3, 3, 'x')").run(TUAN)
    await cronGiaiTuan(d.env, NOW)
    const r = (await hsGiai(d.env, { token: await gameToken(d.env, 'E1') }, NOW)) as { nhom: { laEm: boolean; nguyenTu: number; thuHang: number }[] }
    expect(r.nhom.find((x) => x.laEm)).toMatchObject({ nguyenTu: 0, thuHang: 2 })
    expect(r.nhom.find((x) => !x.laEm)).toMatchObject({ nguyenTu: 300, thuHang: 1 })
    expect(JSON.stringify(r)).not.toMatch(/Đối phó|Học thật|bac\b/)
  })
  it('luật hiện cho em khớp cách tính: không còn «chưa có nguyên tử thì chưa vào bảng»; nói rõ thanh trên = hôm nay, bảng = tính hạng cả tuần; không nhãn lười', () => {
    const chu = LUAT_GIAI.join(' ')
    expect(chu).not.toMatch(/chưa có nguyên tử thì em chưa vào bảng/)
    expect(chu).toMatch(/nguyên tử tính hạng của cả tuần/)
    expect(chu).toMatch(/Thanh trên đếm nguyên tử hôm nay/)
    expect(chu).not.toMatch(/Đối phó|lười|vội|treo|Học thật/i)
  })
})
