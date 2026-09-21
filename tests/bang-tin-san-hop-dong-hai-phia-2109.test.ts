// @vitest-environment node
// BẢNG TIN KIỂU SÀN GIAO DỊCH · HỢP ĐỒNG HAI PHÍA: THÂN THẬT của máy chủ (`gvBangTinSong` qua worker, D1 giả bằng SQLite thật, cổng mật khẩu thầy) đi qua BỘ ĐỌC của màn (`docSan`) —
// không nhập tay thân mẫu ⇒ máy chủ đổi tên khoá / kiểu số thì test này đỏ trước khi màn thầy trắng. Đọc được ⇒ đủ khối, số KHỚP (`kiemTraKhop` rỗng), chữ nội bộ đã đổi.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { xoaDemBangTinSong } from '../server/src/gv-bang-tin-song'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { docSan } from '../src/lib/bang-tin-san/doc-san'
import { chotSo, kiemTraKhop } from '../src/lib/bang-tin-san/trang-thai'

vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }) }))
vi.mock('../src/lib/exam-db', () => ({ loadTeacherSecret: async () => 'mat-thu' }))

const VN = (s: string): number => Date.parse(`${s}+07:00`)
const MOC = '2026-09-21T05:00:00.000Z' // 12:00 trưa 21/09
const NOW = VN('2026-09-22T10:00:00')
beforeEach(() => { xoaDemBangTinSong(); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => vi.useRealTimers())

let dem = 0
const sk = (d: D1That, o: { sbd: string; luc: number; kq: 0 | 1 | null; dang?: string }) =>
  d.sql.prepare('INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .run(`k${++dem}`, o.sbd, `Q${dem}`, 'on_lai', 'm', 1, o.kq, 30, new Date(o.luc).toISOString(), new Date(o.luc + 7 * 3_600_000).toISOString().slice(0, 10), o.dang ?? 'D.1')
const themHs = (d: D1That, sbd: string, hoTen: string, lop: string, tenLop: string | null) =>
  d.sql.prepare('INSERT OR REPLACE INTO hoc_sinh(sbd,ho_ten,lop,ten_lop,trang_thai,mat_khau,cap_nhat_luc) VALUES(?,?,?,?,NULL,?,?)').run(sbd, hoTen, lop, tenLop, 'mk', 'x')

function truong(): D1That {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('bang_tin_tu',?,'x')").run(MOC)
  for (const [s, ten, lop] of [['S1', 'An', '12 - Tinh Hoa'], ['S2', 'Bình', '12 - Tinh Hoa'], ['S3', 'Chi', '12 - Tinh Hoa'], ['S4', 'Dũng', '12 - Lớp Thường'], ['S5', 'Em', '12 - Lớp Thường']] as const) themHs(d, s, ten, '12', lop)
  themHs(d, 'S6', 'Phúc', '', null) // khối rỗng, chưa gán lớp ⇒ máy chủ đặt tên "Chưa xếp lớp"
  const t = (phut: number) => VN('2026-09-22T09:00:00') + phut * 60_000
  for (let i = 0; i < 12; i++) sk(d, { sbd: 'S1', luc: t(i * 2), kq: i === 3 || i === 7 ? 0 : 1 })
  for (let i = 0; i < 6; i++) sk(d, { sbd: 'S2', luc: t(1 + i * 5), kq: i % 2 === 0 ? 1 : 0 })
  for (let i = 0; i < 3; i++) sk(d, { sbd: 'S4', luc: t(40 + i), kq: i === 0 ? 1 : 0, dang: 'D.VAP' })
  sk(d, { sbd: 'S6', luc: t(50), kq: 1 })
  return d
}

describe('thân thật của /gv/bang-tin-song ⇒ docSan', () => {
  it('đọc được, đủ khối, KHỚP số, chữ nội bộ "Chưa xếp lớp" đã thành "Chưa rõ lớp"', async () => {
    const d = truong()
    const r = (await goiWorker(worker, d.env, '/gv/bang-tin-song', {}, true)) as Record<string, any>
    expect(r.ok).toBe(true)
    expect(JSON.stringify(r.song.theoLop)).toContain('Chưa xếp lớp') // máy chủ vẫn nói chữ cũ — đổi ở bộ đọc
    const du = docSan(r, Date.now())
    expect(du, 'bộ đọc từ chối thân thật của máy chủ').not.toBeNull()
    expect(du!.theoLop!.map((l) => l.lop).sort()).toEqual(['12 - Lớp Thường', '12 - Tinh Hoa', 'Chưa rõ lớp'])
    const s = JSON.stringify(du)
    const i = s.indexOf('Chưa xếp lớp')
    expect(i < 0 ? '' : s.slice(Math.max(0, i - 120), i + 40), 'còn chữ nội bộ ở').toBe('')
    expect(du!.nhiet).toHaveLength(6)
    expect(du!.nhiet!.filter((e) => e.soCau > 0)).toHaveLength(4)
    expect(du!.tia).not.toBeNull()
    expect(du!.tia!.hs).toHaveLength(60)
    expect(du!.nen).not.toBeNull()
    expect(du!.tin.length).toBeGreaterThan(0)
    expect(du!.mocMs).toBe(VN('2026-09-22T00:00:00')) // mọi số là của HÔM NAY: từ MAX(mốc, 00:00 hôm nay) = `tuHomNay`; sang 22/09 chip ghi "Từ 00:00 · Thứ Ba 22/09" (mốc 12:00 21/09 đã qua)
    expect(du!.soCau).toBe(12 + 6 + 3 + 1)
    expect(kiemTraKhop(du!), kiemTraKhop(du!).join('\n')).toEqual([])
    const so = chotSo(du!)
    expect(so.chuaHoc).toBe(du!.tongEm - du!.soEmHoc)
    expect(du!.bt!.nhip.soCau).toBe(du!.soCau)
  })
  it('cờ lùi cau_hinh.bang_tin_san = "tat" ⇒ thân ok:false ⇒ bộ đọc không cần (màn dùng bản 3); chưa có câu nào hôm nay ⇒ vẫn đọc được, nến ẩn', async () => {
    const d = truong()
    d.sql.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('bang_tin_san','tat','x')").run()
    const r = (await goiWorker(worker, d.env, '/gv/bang-tin-song', {}, true)) as Record<string, any>
    expect(r.ok).toBe(false)
    expect(docSan(r, 1)).toBeNull()
    xoaDemBangTinSong()
    const trong = taoD1That()
    trong.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('bang_tin_tu',?,'x')").run(MOC)
    themHs(trong, 'S1', 'An', '12', '12 - Tinh Hoa')
    const r2 = (await goiWorker(worker, trong.env, '/gv/bang-tin-song', {}, true)) as Record<string, any>
    const du = docSan(r2, 1)!
    expect(du).toBeTruthy()
    expect(du.nen).toBeNull()
    expect(du.soCau).toBe(0)
    expect(du.danDau).toBeNull()
  })
})
