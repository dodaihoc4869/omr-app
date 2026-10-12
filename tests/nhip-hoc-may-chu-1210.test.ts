// @vitest-environment node
// MÁY CHỦ `/gv/nhip-hoc` (thầy 12/10 duyệt bản vẽ Nhịp học trên Hôm nay: "tôi nhìn vào thấy ngay học sinh nào chăm học sinh nào lười").
// Hợp đồng `server/src/nhip-hoc-kieu.ts`. CHỈ ĐỌC — chạy trên D1 THẬT (SQLite, lược đồ repo + bảng Hành trình / Gói 7 tạo bằng chính DDL của máy chủ).
// Kiểm: cổng thầy · mức / đã làm TRÙNG bảng Bài hằng ngày · ngày vào (tài khoản tạo muộn, dấu vết sớm nhất, dấu vết trước 01/10) · cờ đối phó
// THEO LÔ (quá nhanh từ cột giây + raw_json.ms, câu tự tính Phần III ngưỡng 15 giây, chọn lặp bằng hàm cửa sổ, chuỗi không nối qua ngày, lượt chỉ
// đọc lời giải không tính) · lùi về chỉ "quá nhanh" khi truy vấn chọn lặp hỏng · phép thuần biên ngưỡng. Tên em là tên giả.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { SQL_GOI7 } from '../server/src/goi-bai-7-schema'
import type { KetQuaBaiHangNgay } from '../server/src/bai-hang-ngay-kieu'
import type { KetQuaNhipHoc } from '../server/src/nhip-hoc-kieu'
import { gvBaiHangNgay, ngayVnCua } from '../server/src/bai-hang-ngay'
import { chonLapVuot, doiPhoCuaEm, gvNhipHoc, ngayTaoTaiKhoan, ngayVaoCuaEm, quaNhanhVuot, type DemGiayEm } from '../server/src/nhip-hoc'

type D = ReturnType<typeof taoD1That>
const NOW = Date.parse('2026-10-14T05:00:00Z') // 12:00 Thứ Tư 14/10 giờ Việt Nam
afterEach(() => vi.useRealTimers())

function taoD1() {
  const d = taoD1That()
  for (const q of [...SQL_BANG_HANH_TRINH, ...SQL_GOI7]) d.sql.exec(q)
  return d
}
const em = (d: D, sbd: string, ten: string, khoi = '12', tenLop: string | null = '12 - Tinh Hoa', taoLuc: string | null = null) => {
  d.sql.prepare('INSERT INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run(sbd, ten, '2009', khoi, 'x')
  d.sql.prepare('INSERT INTO hoc_sinh (sbd, ho_ten, lop, ten_lop, tao_luc, cap_nhat_luc) VALUES (?,?,?,?,?,?)').run(sbd, ten, khoi, tenLop, taoLuc, 'x')
}
const hanhTrinh = (d: D, khoi: string, sbd: string[]) =>
  d.sql.prepare("INSERT INTO chien_dich (id, ten, lop, sbd_json, ma_de_json, qid_json, han_nop, tao_luc, trang_thai) VALUES (?,?,?,?,?,?,?,?, 'dang_chay')")
    .run(`hanh-trinh-v3-khoi-${khoi}`, `Hành trình giỏi hoá · Khối ${khoi}`, `Khối ${khoi}`, JSON.stringify(sbd), '[]', '[]', '9999-12-31', '2026-10-01T00:00:00Z')
const chot = (d: D, sbd: string, ngay: string, tang: number, toiThieu: number) =>
  d.sql.prepare('INSERT INTO hanh_trinh_v3_ngay (sbd, ngay, tang, toi_thieu) VALUES (?,?,?,?)').run(sbd, ngay, tang, toiThieu)
const keHoach = (d: D, sbd: string, ngay: string, dao: string[]) =>
  d.sql.prepare('INSERT INTO srs2_ke_hoach (sbd, ngay, chien_dich_id, dao_json, doan_json, tong, tao_luc) VALUES (?,?,?,?,?,?,?)')
    .run(sbd, ngay, 'hanh-trinh-v3-khoi-12', JSON.stringify(dao), '[]', dao.length, 'x')
let k = 0
interface Sk { sbd: string; qid: string; luc: string; kq?: number | null; purpose?: string | null; giay?: number | null; raw?: Record<string, unknown> | null }
const sk = (d: D, x: Sk) =>
  d.sql.prepare('INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, purpose, raw_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(
    `k${String(++k).padStart(5, '0')}`, x.sbd, x.qid, 'game', 'P', 1, x.kq === undefined ? 1 : x.kq, x.giay ?? null, x.luc, ngayVnCua(Date.parse(x.luc)), x.purpose ?? null, x.raw ? JSON.stringify(x.raw) : null,
  )
const luc = (ngay: string, gioVn = 10, phut = 0) => new Date(Date.parse(`${ngay}T00:00:00+07:00`) + (gioVn * 60 + phut) * 60_000).toISOString()

/**
 * A: có mức + kế hoạch từ 10/10 (dấu vết sớm nhất 10/10 ⇒ vào 10/10) · B: tài khoản tạo 12/10, chưa có dấu vết ⇒ vào 12/10 · C: có lượt từ 20/09 ⇒ vào 01/10
 * D: quá nhanh (cột giây + raw_json.ms) · E: chọn lặp 7 lượt "C" liền · G: hai mẩu "C" ở hai ngày (không nối) · F: câu tự tính 10 giây (quá nhanh)
 * H: câu trắc nghiệm 10 giây (không quá nhanh) · khối 11: em I.
 */
function boDuLieu() {
  const d = taoD1()
  em(d, 'A', 'Trần An')
  em(d, 'B', 'Lê Bình', '12', '12 - Tinh Hoa', '2026-10-12T03:00:00Z')
  em(d, 'C', 'Phạm Chi', '12', '12 - Tinh Hoa', '2026-08-01T00:00:00Z')
  for (const [s, t] of [['D', 'Đỗ Dũng'], ['E', 'Bùi Em'], ['F', 'Hồ Phúc'], ['G', 'Lý Giang'], ['H', 'Mai Hà']] as const) em(d, s, t)
  em(d, 'I', 'Vũ Ích', '11', '11 - Chuyên')
  hanhTrinh(d, '12', ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])
  hanhTrinh(d, '11', ['I'])
  for (const [ng, lam] of [['2026-10-10', 2], ['2026-10-11', 2], ['2026-10-12', 2], ['2026-10-13', 0], ['2026-10-14', 1]] as const) {
    chot(d, 'A', ng, 1, 2)
    keHoach(d, 'A', ng, [`A${ng}a`, `A${ng}b`])
    for (let i = 0; i < lam; i++) sk(d, { sbd: 'A', qid: `A${ng}${'ab'[i]}`, luc: luc(ng, 8, i) })
  }
  sk(d, { sbd: 'C', qid: 'CU', luc: luc('2026-09-20') })
  // D: 24 lượt có số giây ngày 13/10 — 10 lượt quá nhanh (6 cột giây, 4 raw_json.ms), đúng 2; 14 lượt thường, đúng 11. Một lượt "đọc lời giải" 2 giây không tính.
  for (let i = 0; i < 10; i++) sk(d, { sbd: 'D', qid: `D-I-${i}`, luc: luc('2026-10-13', 9, i), kq: i < 2 ? 1 : 0, ...(i < 6 ? { giay: 5 } : { raw: { ms: 4200 } }) })
  for (let i = 0; i < 14; i++) sk(d, { sbd: 'D', qid: `D-I-${10 + i}`, luc: luc('2026-10-13', 10, i), kq: i < 11 ? 1 : 0, giay: 30 })
  sk(d, { sbd: 'D', qid: 'D-I-99', luc: luc('2026-10-13', 11), purpose: 'xem_loi_giai', giay: 2 })
  // E: 20 lượt trắc nghiệm ngày 13/10: 7 lượt "C" liền giữa chừng (35% lượt trong chuỗi)
  const chuE = ['A', 'B', 'D', 'A', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'B', 'A', 'D', 'B', 'A', 'D', 'B', 'A', 'D']
  chuE.forEach((c, i) => sk(d, { sbd: 'E', qid: `E-I-${i}`, luc: luc('2026-10-13', 14, i), raw: { chon: c } }))
  // G: 4 "C" cuối 12/10 + 4 "C" đầu 13/10 (không cùng ngày ⇒ không thành chuỗi 6) + 8 lượt xen kẽ
  for (let i = 0; i < 4; i++) sk(d, { sbd: 'G', qid: `G-a${i}`, luc: luc('2026-10-12', 23, 50 + i), raw: { chon: 'C' } })
  for (let i = 0; i < 4; i++) sk(d, { sbd: 'G', qid: `G-b${i}`, luc: luc('2026-10-13', 0, i), raw: { chon: 'C' } })
  for (let i = 0; i < 8; i++) sk(d, { sbd: 'G', qid: `G-c${i}`, luc: luc('2026-10-13', 9, i), raw: { traLoi: 'ABDA'[i % 4] } })
  // F / H: 20 lượt 10 giây, đúng 3 — câu tự tính (Phần III, ngưỡng 15 giây) vs câu trắc nghiệm (ngưỡng 8 giây)
  for (let i = 0; i < 20; i++) sk(d, { sbd: 'F', qid: `DE1-III-${i}`, luc: luc('2026-10-13', 15, i), kq: i < 3 ? 1 : 0, giay: 10 })
  for (let i = 0; i < 20; i++) sk(d, { sbd: 'H', qid: `DE1-I-${i}`, luc: luc('2026-10-13', 15, i), kq: i < 3 ? 1 : 0, giay: 10 })
  return d
}
const theo = (r: KetQuaNhipHoc, sbd: string) => r.em.find((e) => e.sbd === sbd)!

describe('máy chủ /gv/nhip-hoc — một lần gọi cho cả màn', () => {
  it('chỉ thầy; mặc định từ 01/10 tới hôm nay; mọi em của các Hành trình; mức/đã làm TRÙNG bảng Bài hằng ngày; danh sách lớp', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    const d = boDuLieu()
    const env = d.env as unknown as Env
    expect((await goiWorker(worker, env, '/gv/nhip-hoc', {})).ok).toBe(false)
    const r = (await goiWorker(worker, env, '/gv/nhip-hoc', {}, true)) as KetQuaNhipHoc
    expect(r).toMatchObject({ ok: true, tu: '2026-10-01', den: '2026-10-14', homNay: '2026-10-14', doiPhoDaTinh: { quaNhanh: true, chonLap: true } })
    expect(r.ngay).toHaveLength(14)
    expect(r.em.map((e) => e.sbd).sort()).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'])
    expect(r.em.every((e) => e.muc.length === 14 && e.lam.length === 14)).toBe(true)
    expect(theo(r, 'A').lam.slice(9)).toEqual([2, 2, 2, 0, 1])
    expect(theo(r, 'A').muc.slice(9)).toEqual([2, 2, 2, 2, 2])
    const bhn = (await gvBaiHangNgay(env, {}, NOW)) as KetQuaBaiHangNgay
    for (const e of bhn.em) {
      expect(theo(r, e.sbd).muc).toEqual(e.ngay.map((n) => n.mucToiThieu))
      expect(theo(r, e.sbd).lam).toEqual(e.ngay.map((n) => n.daLam))
    }
    expect(r.lop).toEqual([{ tenLop: '12 - Tinh Hoa', khoi: '12', soEm: 8 }, { tenLop: '11 - Chuyên', khoi: '11', soEm: 1 }])
    expect(r.canhBao).toEqual([])
  })

  it('ngày vào: dấu vết sớm nhất 10/10 ⇒ 10/10 · tài khoản tạo 12/10 (giờ VN) chưa dấu vết ⇒ 12/10 · có lượt từ 20/09 ⇒ 01/10 · không nguồn nào ⇒ 01/10', async () => {
    const r = (await gvNhipHoc(boDuLieu().env as unknown as Env, {}, NOW)) as KetQuaNhipHoc
    expect(theo(r, 'A').ngayVao).toBe('2026-10-10')
    expect(theo(r, 'B').ngayVao).toBe('2026-10-12')
    expect(theo(r, 'C').ngayVao).toBe('2026-10-01')
    expect(theo(r, 'I').ngayVao).toBe('2026-10-01')
    expect(theo(r, 'D').ngayVao).toBe('2026-10-13') // dấu vết đầu tiên của D là lượt 13/10
  })

  it('đối phó THEO LÔ: quá nhanh (giây + ms, bỏ lượt đọc lời giải) · câu tự tính 10 giây là quá nhanh, trắc nghiệm 10 giây thì không · chọn lặp không nối qua ngày', async () => {
    const r = (await gvNhipHoc(boDuLieu().env as unknown as Env, {}, NOW)) as KetQuaNhipHoc
    expect(theo(r, 'D').doiPho).toEqual({
      quaNhanh: { nhanh: 10, coGiay: 24, dungNhanh: 20, dungThuong: 79, coTuTinh: false },
      chonLap: null,
      lyDo: ['10/24 lượt trả lời dưới 8 giây, nhóm này đúng 20% (lượt thường đúng 79%)'],
    })
    expect(theo(r, 'E').doiPho).toEqual({
      quaNhanh: null,
      chonLap: { trongChuoi: 7, tong: 20, dai: 7, chu: 'C' },
      lyDo: ['Chọn C 7 lượt liền · 7/20 lượt trắc nghiệm nằm trong chuỗi chọn lặp (35%)'],
    })
    expect(theo(r, 'F').doiPho?.quaNhanh).toMatchObject({ nhanh: 20, coGiay: 20, dungNhanh: 15, coTuTinh: true })
    expect(theo(r, 'F').doiPho?.lyDo[0]).toBe('20/20 lượt trả lời quá nhanh (dưới 8 giây, câu tự tính dưới 15 giây), nhóm này đúng 15%')
    expect(theo(r, 'H').doiPho).toBeNull()
    expect(theo(r, 'G').doiPho).toBeNull()
    expect(theo(r, 'A').doiPho).toBeNull()
  })

  it('truy vấn chọn lặp hỏng ⇒ vẫn trả số, chỉ dùng quá nhanh + một câu cảnh báo nói thật; danh sách em hỏng ⇒ lỗi dễ hiểu', async () => {
    const d = boDuLieu()
    const that = d.env as unknown as Env
    const hong = { ...that, DB: { ...that.DB, prepare: (q: string) => { if (/ROW_NUMBER/.test(q)) throw new Error('no such function'); return that.DB.prepare(q) } } } as unknown as Env
    const r = (await gvNhipHoc(hong, {}, NOW)) as KetQuaNhipHoc
    expect(r.doiPhoDaTinh).toEqual({ quaNhanh: true, chonLap: false })
    expect(r.canhBao).toEqual(['Chưa đọc được đáp án em chọn — dấu hiệu đối phó lần này chỉ tính trả lời quá nhanh.'])
    expect(theo(r, 'D').doiPho).not.toBeNull()
    expect(theo(r, 'E').doiPho).toBeNull()
    const khongEm = { ...that, DB: { ...that.DB, prepare: (q: string) => { if (/FROM (hoc_sinh|danh_sach)\b/.test(q)) throw new Error('x'); return that.DB.prepare(q) } } } as unknown as Env
    expect(await gvNhipHoc(khongEm, {}, NOW)).toEqual({ ok: false, error: 'Không đọc được danh sách học sinh.' })
  })
})

describe('phép thuần — biên ngưỡng (NGUONG_THAI_DO)', () => {
  it('ngày vào: sớm nhất trong các nguồn rồi kẹp về đầu khoảng; nguồn hỏng bị bỏ; ngày tạo tài khoản đổi giờ Việt Nam', () => {
    expect(ngayVaoCuaEm('2026-10-01', [])).toBe('2026-10-01')
    expect(ngayVaoCuaEm('2026-10-01', [null, '', 'x', '2026-10-09', '2026-10-05'])).toBe('2026-10-05')
    expect(ngayVaoCuaEm('2026-10-01', ['2026-10-09', '2026-09-28'])).toBe('2026-10-01')
    expect(ngayTaoTaiKhoan('2026-10-11T18:30:00Z')).toBe('2026-10-12') // 01:30 sáng 12/10 giờ VN
    expect(ngayTaoTaiKhoan('2026-10-11')).toBe('2026-10-11')
    expect(ngayTaoTaiKhoan('')).toBeNull()
    expect(ngayTaoTaiKhoan('hỏng')).toBeNull()
  })

  it('quá nhanh: cần ≥ 20 lượt có giây; ≥ 30% quá nhanh VÀ nhóm ấy đúng dưới 50%', () => {
    const g = (o: Partial<DemGiayEm>): DemGiayEm => ({ coGiay: 20, coGiayKq: 20, coGiayDung: 10, nhanh: 6, nhanhKq: 6, nhanhDung: 2, coTuTinh: false, ...o })
    expect(quaNhanhVuot(g({}))).toMatchObject({ nhanh: 6, coGiay: 20, dungNhanh: 33, dungThuong: 57 }) // 30% · đúng 33%
    expect(quaNhanhVuot(g({ coGiay: 19, coGiayKq: 19 }))).toBeNull() // chưa đủ lượt
    expect(quaNhanhVuot(g({ nhanh: 5, nhanhKq: 5 }))).toBeNull() // 25%
    expect(quaNhanhVuot(g({ nhanhDung: 3 }))).toBeNull() // nhóm quá nhanh đúng 50% ⇒ không phải đoán bừa
    expect(quaNhanhVuot(g({ nhanhKq: 0, nhanhDung: 0 }))).toBeNull() // không lượt nào có kết quả ⇒ không kết luận
  })

  it('chọn lặp: cần ≥ 15 lượt A–D; chuỗi ≥ 6 lượt; ≥ 10% lượt trong chuỗi; gộp hai tín hiệu, tỉ lệ cao đứng trước', () => {
    expect(chonLapVuot({ tong: 60, chuoi: [{ chu: 'B', n: 6 }] })).toEqual({ trongChuoi: 6, tong: 60, dai: 6, chu: 'B' }) // đúng 10%
    expect(chonLapVuot({ tong: 61, chuoi: [{ chu: 'B', n: 6 }] })).not.toBeNull() // 9,8% làm tròn 10% — đúng phép làm tròn của hồ sơ một em
    expect(chonLapVuot({ tong: 70, chuoi: [{ chu: 'B', n: 6 }] })).toBeNull() // 8,6% ⇒ 9
    expect(chonLapVuot({ tong: 14, chuoi: [{ chu: 'A', n: 14 }] })).toBeNull() // chưa đủ lượt
    expect(chonLapVuot({ tong: 20, chuoi: [{ chu: 'A', n: 5 }] })).toBeNull() // chuỗi 5 chưa tính
    const hai = doiPhoCuaEm({ coGiay: 20, coGiayKq: 20, coGiayDung: 10, nhanh: 6, nhanhKq: 6, nhanhDung: 1, coTuTinh: false }, { tong: 20, chuoi: [{ chu: 'D', n: 8 }, { chu: 'A', n: 6 }] })
    expect(hai?.lyDo).toEqual(['Chọn D 8 lượt liền · 14/20 lượt trắc nghiệm nằm trong chuỗi chọn lặp (70%)', '6/20 lượt trả lời dưới 8 giây, nhóm này đúng 17% (lượt thường đúng 64%)'])
    expect(doiPhoCuaEm(null, null)).toBeNull()
  })
})
