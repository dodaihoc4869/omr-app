// @vitest-environment node
// MÁY CHỦ `/gv/bai-hang-ngay` + `/gv/ho-so-thai-do` (thầy 12/10: "lịch sử học sinh làm bài tập hàng ngày, tính từ 12/10. Học sinh thiếu nhiều ngày nhất
// hiển thị lên đầu, làm thiếu nhiều câu nhất trong từng ngày" · "bấm vào học sinh … chăm chỉ hay lười biếng hay đối phó"). Hợp đồng
// `server/src/bai-hang-ngay-kieu.ts`. CHỈ ĐỌC — chạy trên D1 THẬT (SQLite, lược đồ repo + bảng Hành trình / Gói 7 tạo bằng chính DDL của máy chủ).
// Kiểm: mức thật (đã chốt) / ước tính theo quy tắc hiện hành · đã làm đúng như kế hoạch đếm (Gói 7 + Hành trình) · thiếu · xếp thứ tự · thang ngày từ
// 12/10 · lọc khối/lớp · chỉ mục · tín hiệu thái độ với ngưỡng · "Chưa đủ dữ liệu". Tên em là tên giả.
// SỬA CÓ CHỦ ĐÍCH 12/10 — thầy: "dữ liệu phần này tính từ 1/10 cho tôi nhé" ⇒ mốc mặc định 01/10. Các ca kiểm LUẬT (mức / đã làm / xếp / lọc /
// hồ sơ) vẫn chạy trên khoảng 12–14/10 nên truyền `tu` rõ ràng; mốc mặc định + ngày trước Gói 7 + khoảng đọc theo chế độ + cắt 10.000 lượt có khối riêng cuối tệp.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { SQL_GOI7 } from '../server/src/goi-bai-7-schema'
import type { KetQuaBaiHangNgay, KetQuaHoSoThaiDo, NgayBaiEm } from '../server/src/bai-hang-ngay-kieu'
import {
  chuoiChonLap, gvBaiHangNgay, gvHoSoThaiDo, khoangDocTheoCheDo, khoangNgay, mucCuaNgay, ngayVnCua, phanBoGiay, SQL_DEM_GOI7, SQL_LUOT_KE_HOACH, tinhThaiDo,
  TOI_DA_LUOT_HO_SO, tomTatNgay, xepEmBaiHangNgay, type LuotThaiDo,
} from '../server/src/bai-hang-ngay'

type D = ReturnType<typeof taoD1That>
const NOW = Date.parse('2026-10-14T05:00:00Z') // 12:00 Thứ Tư 14/10 giờ Việt Nam
afterEach(() => vi.useRealTimers())

function taoD1() {
  const d = taoD1That()
  for (const q of [...SQL_BANG_HANH_TRINH, ...SQL_GOI7]) d.sql.exec(q)
  return d
}
const em = (d: D, sbd: string, ten: string, khoi = '12', tenLop: string | null = null, trangThai: string | null = null) => {
  d.sql.prepare('INSERT INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run(sbd, ten, '2009', khoi, 'x')
  d.sql.prepare('INSERT INTO hoc_sinh (sbd, ho_ten, lop, ten_lop, trang_thai, cap_nhat_luc) VALUES (?,?,?,?,?,?)').run(sbd, ten, khoi, tenLop, trangThai, 'x')
}
const hanhTrinh = (d: D, khoi: string, sbd: string[]) =>
  d.sql.prepare("INSERT INTO chien_dich (id, ten, lop, sbd_json, ma_de_json, qid_json, han_nop, tao_luc, trang_thai) VALUES (?,?,?,?,?,?,?,?, 'dang_chay')")
    .run(`hanh-trinh-v3-khoi-${khoi}`, `Hành trình giỏi hoá · Khối ${khoi}`, `Khối ${khoi}`, JSON.stringify(sbd), '[]', '[]', '9999-12-31', '2026-10-01T00:00:00Z')
const chot = (d: D, sbd: string, ngay: string, tang: number, toiThieu: number) =>
  d.sql.prepare('INSERT INTO hanh_trinh_v3_ngay (sbd, ngay, tang, toi_thieu) VALUES (?,?,?,?)').run(sbd, ngay, tang, toiThieu)
const keHoach = (d: D, sbd: string, ngay: string, dao: string[], doan: string[] = []) =>
  d.sql.prepare('INSERT INTO srs2_ke_hoach (sbd, ngay, chien_dich_id, dao_json, doan_json, tong, tao_luc) VALUES (?,?,?,?,?,?,?)')
    .run(sbd, ngay, 'hanh-trinh-v3-khoi-12', JSON.stringify(dao), JSON.stringify(doan), dao.length + doan.length, 'x')
let k = 0
interface Sk { sbd: string; qid: string; luc: string; kq?: number | null; nguon?: string; maNguon?: string; purpose?: string | null; visibility?: string | null; assistance?: string | null; giay?: number | null; raw?: Record<string, unknown> | null }
const sk = (d: D, x: Sk) =>
  d.sql.prepare(`INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, purpose, visibility, assistance, raw_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    `k${++k}`, x.sbd, x.qid, x.nguon ?? 'game', x.maNguon ?? 'P', 1, x.kq === undefined ? 1 : x.kq, x.giay ?? null, x.luc, ngayVnCua(Date.parse(x.luc)),
    x.purpose ?? null, x.visibility ?? null, x.assistance ?? null, x.raw ? JSON.stringify(x.raw) : null,
  )
const luc = (ngay: string, gioVn = 10, phut = 0) => new Date(Date.parse(`${ngay}T00:00:00+07:00`) + (gioVn * 60 + phut) * 60_000).toISOString()
const goi7 = (d: D, sbd: string, batDau: string) => {
  d.sql.prepare("INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES ('goi_bai_7_v1', ?, 'x')").run(JSON.stringify({ bat: true, batDau: '2026-10-10' }))
  d.sql.prepare("INSERT INTO bai_da_day (id, lop, khoa_bai, ten_bai, vi_tri, ma_to_json, tick_luc) VALUES ('t1', '12', 'b6', 'Bài 6', 1, '[]', 'x')").run()
  d.sql.prepare("INSERT INTO goi_bai_7 (id, tick_id, lop, khoa_bai, ten, bat_dau, han, tao_luc) VALUES ('g7:t1', 't1', '12', 'b6', 'Bài 6', ?, '2026-10-18', 'x')").run(batDau)
  d.sql.prepare("INSERT INTO goi_bai_7_em (goi_id, sbd, bat_dau, han) VALUES ('g7:t1', ?, ?, '2026-10-18')").run(sbd, batDau)
}

/** Bộ dữ liệu chung: A (Hành trình, mức chốt + ước tính) · B (Gói 7 từ 12/10) · C (đủ gần hết) · D, E (hoà số) · F khối 11 · thử + khoá bị loại. */
function boDuLieu() {
  const d = taoD1()
  for (const [s, t] of [['A', 'Trần An'], ['B', 'Lê Bình'], ['C', 'Phạm Chi'], ['D', 'Đỗ Dũng'], ['E', 'Bùi Em'], ['12121212', 'Thử'], ['K', 'Khoá']] as const)
    em(d, s, t, '12', '12 - Tinh Hoa', s === 'K' ? 'khoa' : null)
  em(d, 'F', 'Vũ Phương', '11', '11 - Chuyên')
  hanhTrinh(d, '12', ['A', 'B', 'C', 'D', 'E', '12121212', 'K'])
  hanhTrinh(d, '11', ['F'])
  // A: chốt 11/10 tầng 2 (trước khoảng) + 13/10 tầng 3 mức 36; kế hoạch 13/10 bốn câu
  chot(d, 'A', '2026-10-11', 2, 30)
  chot(d, 'A', '2026-10-13', 3, 36)
  keHoach(d, 'A', '2026-10-13', ['Q1', 'Q2', 'Q3#2'], ['Q4'])
  sk(d, { sbd: 'A', qid: 'Q1', luc: luc('2026-10-13') })
  sk(d, { sbd: 'A', qid: 'Q2', luc: luc('2026-10-13', 11), kq: 0 })
  sk(d, { sbd: 'A', qid: 'Q3', luc: luc('2026-10-13', 12) })
  sk(d, { sbd: 'A', qid: 'Q5', luc: luc('2026-10-13', 12, 5) }) // ngoài kế hoạch ⇒ không tính (đúng bangHanhTrinh)
  sk(d, { sbd: 'A', qid: 'Q4', luc: luc('2026-10-13', 12, 9), purpose: 'xem_loi_giai' }) // đọc lời giải ⇒ không tính
  // B: Gói 7 từ 12/10, chưa ghi tầng ⇒ mức mặc định 24
  goi7(d, 'B', '2026-10-12')
  for (let i = 1; i <= 24; i++) sk(d, { sbd: 'B', qid: `G${i}`, luc: luc('2026-10-12', 9, i) })
  d.sql.prepare("INSERT INTO ca (ma_ca, ten_ca, trang_thai, cong_bo, cap_nhat_luc) VALUES ('C1', 'Ca chưa công bố', 'dong', 'khong', 'x'), ('C2', 'Ca đã công bố', 'dong', 'ngay', 'x')").run()
  sk(d, { sbd: 'B', qid: 'G1', luc: luc('2026-10-13', 9) })
  sk(d, { sbd: 'B', qid: 'G1', luc: luc('2026-10-13', 9, 1), kq: 0 }) // cùng câu ⇒ một
  sk(d, { sbd: 'B', qid: 'G2', luc: luc('2026-10-13', 9, 2), kq: null }) // chưa có kết quả
  sk(d, { sbd: 'B', qid: 'G3', luc: luc('2026-10-13', 9, 3), purpose: 'xem_loi_giai' })
  sk(d, { sbd: 'B', qid: 'G4', luc: luc('2026-10-13', 9, 4), visibility: 'embargoed' })
  sk(d, { sbd: 'B', qid: 'G5', luc: luc('2026-10-13', 9, 5), nguon: 'thi', maNguon: 'C1' }) // ca chưa công bố
  sk(d, { sbd: 'B', qid: 'G6', luc: luc('2026-10-13', 9, 6), nguon: 'thi', maNguon: 'C2' }) // ca đã công bố ⇒ tính
  const gap = d.sql.prepare('INSERT INTO goi_bai_7_gap (receipt, goi_id, sbd, qid, version, kieu, luc) VALUES (?,?,?,?,?,?,?)')
  gap.run('r1', 'g7:t1', 'B', 'G7', 'v', 'co_ho_tro', luc('2026-10-13', 10)) // câu có hướng dẫn, sổ chưa có ⇒ +1
  gap.run('r2', 'g7:t1', 'B', 'G1', 'v', 'co_ho_tro', luc('2026-10-13', 10, 1)) // đã có trong sổ ⇒ không cộng hai lần
  // C: chốt mức 2 mỗi ngày; 12, 13 đủ; 14 làm 1/2
  for (const [ng, lam] of [['2026-10-12', 2], ['2026-10-13', 2], ['2026-10-14', 1]] as const) {
    chot(d, 'C', ng, 1, 2)
    keHoach(d, 'C', ng, [`C${ng}a`, `C${ng}b`])
    for (let i = 0; i < lam; i++) sk(d, { sbd: 'C', qid: `C${ng}${'ab'[i]}`, luc: luc(ng, 8, i) })
  }
  // D, E: cùng 2 ngày thiếu · 10 câu thiếu ⇒ xếp theo tên (Bùi Em trước Đỗ Dũng)
  for (const s of ['D', 'E']) {
    for (const ng of ['2026-10-12', '2026-10-13', '2026-10-14']) chot(d, s, ng, 1, 5)
    keHoach(d, s, '2026-10-12', ['X1', 'X2', 'X3', 'X4', 'X5'])
    for (const q of ['X1', 'X2', 'X3', 'X4', 'X5']) sk(d, { sbd: s, qid: q, luc: luc('2026-10-12') })
  }
  return d
}
/** Ca kiểm luật: khoảng 12–14/10 (truyền `tu` rõ — mặc định nay là 01/10, xem đầu tệp). */
const goi = (d: D, b: Record<string, unknown> = {}) => gvBaiHangNgay(d.env as unknown as Env, { tu: '2026-10-12', ...b }, NOW) as Promise<KetQuaBaiHangNgay & { error?: string }>
const theo = (r: KetQuaBaiHangNgay, sbd: string) => r.em.find((e) => e.sbd === sbd)!
const o = (n: NgayBaiEm) => [n.ngay, n.mucToiThieu, n.daLam, n.thieu, n.datMuc, n.nguonMuc, n.cheDo]

describe('máy chủ /gv/bai-hang-ngay — cổng, thang ngày từ 01/10', () => {
  it('chỉ thầy; mặc định tu = 01/10, den = hôm nay (giờ VN); den tương lai bị chặn; tu sau den ⇒ lỗi; quá 62 ngày ⇒ cắt + cảnh báo', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    const d = boDuLieu()
    const env = d.env as unknown as Env
    expect((await goiWorker(worker, env, '/gv/bai-hang-ngay', {})).ok).toBe(false)
    const r = (await goiWorker(worker, env, '/gv/bai-hang-ngay', {}, true)) as KetQuaBaiHangNgay
    expect(r).toMatchObject({ ok: true, tu: '2026-10-01', den: '2026-10-14', homNay: '2026-10-14' })
    expect(r.ngay).toEqual(Array.from({ length: 14 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`))
    expect(r.em.every((e) => e.ngay.map((n) => n.ngay).join() === r.ngay.join())).toBe(true)
    expect(r.em.flatMap((e) => e.ngay.filter((n) => n.homNay).map((n) => n.ngay))).toEqual(r.em.map(() => '2026-10-14'))
    expect(khoangNgay({ den: '2026-12-01' }, NOW)).toMatchObject({ tu: '2026-10-01', den: '2026-10-14' })
    expect(khoangNgay({ tu: '2026-10-20' }, NOW)).toEqual({ error: 'Ngày bắt đầu đang sau ngày kết thúc.' })
    expect(khoangNgay({ tu: '12/10/2026' }, NOW)).toEqual({ error: 'Ngày bắt đầu phải có dạng YYYY-MM-DD.' })
    expect(khoangNgay({}, Date.parse('2026-09-30T05:00:00Z'))).toMatchObject({ tu: '2026-09-30', den: '2026-09-30' }) // trước 01/10: một ngày, không lỗi
    const dai = khoangNgay({ tu: '2026-07-01' }, NOW)
    expect(dai).toMatchObject({ tu: '2026-08-14', den: '2026-10-14' })
    expect('canhBao' in dai && dai.canhBao[0]).toMatch(/tối đa 62 ngày/)
  })
})

describe('mức / đã làm / thiếu — đúng như kế hoạch đang chấm', () => {
  it('Hành trình: mức đã chốt là số thật; ngày không chốt ⇒ quy tắc hiện hành theo tầng gần nhất (ưu tiên trước), có cờ ước tính; đã làm = câu kế hoạch', async () => {
    const r = await goi(boDuLieu())
    const a = theo(r, 'A')
    expect(a.ngay.map(o)).toEqual([
      ['2026-10-12', 30, 0, 30, false, 'tang-gan-nhat', 'hanh-trinh'], // tầng 2 của 11/10 ⇒ 30
      ['2026-10-13', 36, 3, 33, false, 'da-chot', 'hanh-trinh'], // Q1, Q2 (sai vẫn là đã làm), Q3#2 ⇒ 3; Q5 ngoài kế hoạch, Q4 chỉ đọc lời giải
      ['2026-10-14', 36, 0, 36, false, 'tang-gan-nhat', 'hanh-trinh'], // tầng 3 gần nhất
    ])
    expect(a.ngay.map((n) => n.mucUocTinh)).toEqual([true, false, true])
    // hôm nay (14/10) chưa hết ngày ⇒ không cộng vào tổng; chỉ để xếp khi hoà
    expect(a).toMatchObject({ soNgayThieu: 2, tongCauThieu: 63, ngayThieuNhieuNhat: { ngay: '2026-10-13', thieu: 33 }, soNgayDu: 0, soNgayKhongLam: 1, tongDaLam: 3, thieuHomNay: 36 })
  })

  it('Gói 7: mức không lưu ⇒ tầng 1 (24 câu, mặc định); đã làm = mã câu khác nhau có kết quả, bỏ đọc lời giải / còn giấu / ca chưa công bố, cộng câu có hướng dẫn', async () => {
    const r = await goi(boDuLieu())
    const b = theo(r, 'B')
    expect(b.ngay.map(o)).toEqual([
      ['2026-10-12', 24, 24, 0, true, 'mac-dinh', 'goi7'],
      ['2026-10-13', 24, 3, 21, false, 'mac-dinh', 'goi7'], // G1 (hai lượt + một hướng dẫn) · G6 (ca đã công bố) · G7 (hướng dẫn)
      ['2026-10-14', 24, 0, 24, false, 'mac-dinh', 'goi7'],
    ])
    expect(b.ngay.every((n) => n.mucUocTinh && n.tang === 1)).toBe(true)
    expect(b).toMatchObject({ soNgayThieu: 1, tongCauThieu: 21, ngayThieuNhieuNhat: { ngay: '2026-10-13', thieu: 21 }, thieuHomNay: 24 })
  })

  it('mucCuaNgay: Gói 7 KHÔNG lấy mức chốt của Hành trình làm số thật; tầng sau ngày ấy chỉ dùng khi không có tầng trước', () => {
    const c = [{ ngay: '2026-10-13', tang: 2 as const, toiThieu: 30 }, { ngay: '2026-10-15', tang: 4 as const, toiThieu: 36 }]
    expect(mucCuaNgay('2026-10-13', 'goi7', c)).toEqual({ muc: 30, tang: 2, nguon: 'tang-gan-nhat', uoc: true })
    expect(mucCuaNgay('2026-10-13', 'hanh-trinh', c)).toEqual({ muc: 30, tang: 2, nguon: 'da-chot', uoc: false })
    expect(mucCuaNgay('2026-10-12', 'hanh-trinh', c)).toEqual({ muc: 30, tang: 2, nguon: 'tang-gan-nhat', uoc: true })
    expect(mucCuaNgay('2026-10-14', 'hanh-trinh', c)).toEqual({ muc: 30, tang: 2, nguon: 'tang-gan-nhat', uoc: true })
    expect(mucCuaNgay('2026-10-16', 'goi7', c)).toEqual({ muc: 36, tang: 4, nguon: 'tang-gan-nhat', uoc: true })
    expect(mucCuaNgay('2026-10-16', 'goi7', [])).toEqual({ muc: 24, tang: 1, nguon: 'mac-dinh', uoc: true })
  })
})

describe('xếp em + lọc', () => {
  it('thiếu nhiều NGÀY nhất lên đầu → nhiều CÂU → (hoà) thiếu hôm nay → tên; bỏ tài khoản thử và em bị khoá; số ô ước tính', async () => {
    const r = await goi(boDuLieu())
    expect(r.em.map((e) => [e.hoTen, e.soNgayThieu, e.tongCauThieu, e.thieuHomNay])).toEqual([
      ['Trần An', 2, 63, 36],
      ['Vũ Phương', 2, 48, 24], // khối 11: chưa ghi tầng, không kế hoạch ⇒ 24 mỗi ngày
      ['Lê Bình', 1, 21, 24],
      ['Bùi Em', 1, 5, 5],
      ['Đỗ Dũng', 1, 5, 5],
      ['Phạm Chi', 0, 0, 1],
    ])
    expect(r.em.map((e) => e.sbd)).not.toContain('12121212')
    expect(r.em.map((e) => e.sbd)).not.toContain('K')
    expect(theo(r, 'E').ngayThieuNhieuNhat).toEqual({ ngay: '2026-10-13', thieu: 5 })
    expect(theo(r, 'C')).toMatchObject({ soNgayThieu: 0, tongCauThieu: 0, soNgayDu: 2, ngayThieuNhieuNhat: null })
    expect(r.soO).toBe(r.em.length * 3)
    expect(r.soOUocTinh).toBe(r.em.flatMap((e) => e.ngay).filter((n) => n.mucUocTinh).length)
    expect(r.canhBao).toEqual([])
  })

  it('tomTatNgay: hôm nay không cộng vào tổng; ngày thiếu nhiều nhất hoà ⇒ ngày gần hơn; hoà tổng ⇒ thiếu hôm nay nhiều hơn đứng trước', () => {
    const ng = (ngay: string, daLam: number, homNay = false): NgayBaiEm => ({ ngay, mucToiThieu: 24, daLam, thieu: Math.max(0, 24 - daLam), datMuc: daLam >= 24, mucUocTinh: true, nguonMuc: 'mac-dinh', tang: 1, cheDo: 'goi7', homNay })
    const t = tomTatNgay([ng('2026-10-12', 20), ng('2026-10-13', 20), ng('2026-10-14', 0, true)])
    expect(t).toEqual({ soNgayThieu: 2, tongCauThieu: 8, ngayThieuNhieuNhat: { ngay: '2026-10-13', thieu: 4 }, soNgayDu: 0, soNgayKhongLam: 0, tongDaLam: 40, thieuHomNay: 24 })
    expect(tomTatNgay([ng('2026-10-12', 24, true)])).toMatchObject({ soNgayThieu: 0, soNgayDu: 1, thieuHomNay: 0 })
    const e = (sbd: string, hoTen: string, homNay: number) => ({ sbd, hoTen, lop: '', khoi: '12', ...tomTatNgay([ng('2026-10-12', 20), ng('2026-10-13', homNay, true)]), ngay: [] })
    expect([e('1', 'An', 20), e('2', 'Bình', 0), e('3', 'Chi', 24)].sort(xepEmBaiHangNgay).map((x) => x.hoTen)).toEqual(['Bình', 'An', 'Chi'])
  })

  it('lọc khối / tên lớp; danh sách lớp lấy trước khi lọc', async () => {
    const d = boDuLieu()
    const r11 = await goi(d, { khoi: 11 })
    expect(r11.em.map((e) => [e.sbd, e.khoi, e.lop])).toEqual([['F', '11', '11 - Chuyên']])
    expect(r11.lop).toEqual([{ tenLop: '12 - Tinh Hoa', khoi: '12', soEm: 5 }, { tenLop: '11 - Chuyên', khoi: '11', soEm: 1 }])
    expect((await goi(d, { lop: '12 - Tinh Hoa' })).em).toHaveLength(5)
  })

  it('không có Hành trình / Gói 7 nào đang chạy ⇒ danh sách rỗng (không bịa em)', async () => {
    const d = taoD1()
    em(d, 'A', 'Trần An')
    const r = await goi(d)
    expect(r).toMatchObject({ ok: true, em: [], soO: 0 })
  })

  it('bảng phụ chưa có (D1 cũ: chưa dựng Gói 7 / mức chốt) ⇒ vẫn trả số, cảnh báo nói thật, mức ước tính', async () => {
    const d = taoD1That() // KHÔNG dựng bảng Hành trình v3 / Gói 7
    em(d, 'A', 'Trần An')
    hanhTrinh(d, '12', ['A'])
    d.sql.prepare("INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES ('goi_bai_7_v1', '{\"bat\":true}', 'x')").run()
    const r = await goi(d)
    expect(r.ok).toBe(true)
    expect(theo(r, 'A').ngay.map((n) => [n.mucToiThieu, n.nguonMuc, n.cheDo])).toEqual([[24, 'mac-dinh', 'hanh-trinh'], [24, 'mac-dinh', 'hanh-trinh'], [24, 'mac-dinh', 'hanh-trinh']])
    expect(r.canhBao).toEqual([
      'Chưa đọc được Gói bài 7 ngày — các em tính theo kế hoạch Hành trình.',
      'Chưa đọc được mức đã chốt theo ngày — mọi ô dùng mức ước tính theo quy tắc hiện hành.',
    ])
  })

  it('truy vấn sổ đi chỉ mục (sbd, ngay_vn)', () => {
    const d = taoD1()
    for (const q of [SQL_DEM_GOI7, SQL_LUOT_KE_HOACH]) {
      const plan = (d.sql.prepare(`EXPLAIN QUERY PLAN ${q}`).all('["A","B"]', '2026-10-12', '2026-10-14') as { detail: string }[]).map((x) => x.detail).join(' | ')
      expect(plan).toMatch(/su_kien_hoc USING (COVERING )?INDEX idx_skh_em_ngay/)
    }
  })
})

// ------------------------------------------------------------------ HỒ SƠ THÁI ĐỘ
const ngayKh = (ds: [string, boolean][], homNay = ''): NgayBaiEm[] =>
  ds.map(([ngay, du]) => ({ ngay, mucToiThieu: 24, daLam: du ? 24 : 5, thieu: du ? 0 : 19, datMuc: du, mucUocTinh: true, nguonMuc: 'mac-dinh', tang: 1, cheDo: 'goi7', homNay: ngay === homNay }))
const NGAY5 = ['2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14']
const lt = (i: number, o: Partial<LuotThaiDo> = {}): LuotThaiDo => ({ luc: luc(NGAY5[i % 5]!, 9, i), ngay: NGAY5[i % 5]!, goc: `Q${i}`, dung: true, giay: 40, loai: 'trac-nghiem', chon: 'ABCD'[i % 4]!, ...o })
const tap = (n: number) => new Set(Array.from({ length: n }, (_, i) => `Q${i}`))
const tin = (r: ReturnType<typeof tinhThaiDo>, ma: string) => r.tinHieu.find((t) => t.ma === ma)!

describe('hồ sơ thái độ — tín hiệu có số và ngưỡng, kết luận theo luật', () => {
  it('Chưa đủ dữ liệu: dưới 3 ngày đã tính (hôm nay chưa đủ thì chưa tính); không có lượt ⇒ mọi tín hiệu "chua-du"', () => {
    const r = tinhThaiDo({ ngay: ngayKh([['2026-10-13', true], ['2026-10-14', false]], '2026-10-14'), luot: [], cauDaLam: new Set(), cauHoTro: new Set(), den: '2026-10-14' })
    expect(r.ketLuan).toMatchObject({ nhan: 'chua-du-du-lieu', chu: 'Chưa đủ dữ liệu' })
    expect(tin(r, 'ngay-du-muc')).toMatchObject({ tu: 1, mau: 1, giaTri: 100, muc: 'chua-du' })
    expect(r.tinHieu.map((t) => t.muc)).toEqual(['chua-du', 'chua-du', 'chua-du', 'chua-du', 'chua-du', 'chua-du'])
    expect(r.ketLuan.lyDo.join(' ')).toMatch(/1\/1 ngày/)
  })

  it('Chăm chỉ: ≥ 80% ngày đủ mức, tốc độ thường, ban ngày, ít gợi ý — lý do bằng số', () => {
    const luot = Array.from({ length: 40 }, (_, i) => lt(i))
    const r = tinhThaiDo({ ngay: ngayKh(NGAY5.map((n, i) => [n, i !== 0])), luot, cauDaLam: tap(40), cauHoTro: new Set(['Q1']), den: '2026-10-14' })
    expect(tin(r, 'ngay-du-muc')).toMatchObject({ tu: 4, mau: 5, giaTri: 80, muc: 'tot' })
    expect(r.ketLuan.nhan).toBe('cham-chi')
    expect(r.ketLuan.lyDo[0]).toBe('Ngày đủ mức: Đủ mức 4/5 ngày (80%).')
  })

  it('Chưa đều: dưới 80% ngày đủ mức (60% ⇒ chú ý vẫn là chưa đều; 40% ⇒ xấu) hoặc dồn bài khuya từ 50%', () => {
    const luot = Array.from({ length: 40 }, (_, i) => lt(i))
    const r60 = tinhThaiDo({ ngay: ngayKh(NGAY5.map((n, i) => [n, i < 3])), luot, cauDaLam: tap(40), cauHoTro: new Set(), den: '2026-10-14' })
    expect(tin(r60, 'ngay-du-muc').muc).toBe('chu-y')
    expect(r60.ketLuan.nhan).toBe('chua-deu')
    const r40 = tinhThaiDo({ ngay: ngayKh(NGAY5.map((n, i) => [n, i < 2])), luot, cauDaLam: tap(40), cauHoTro: new Set(), den: '2026-10-14' })
    expect(tin(r40, 'ngay-du-muc').muc).toBe('xau')
    // dồn bài: 24/40 lượt lúc 23:30 hoặc 00:30 giờ VN ⇒ 60% ⇒ xấu (ngày đủ mức vẫn 100%)
    const khuya = luot.map((l, i) => (i < 24 ? { ...l, luc: luc(l.ngay, i % 2 ? 23 : 0, 30) } : l))
    const rKhuya = tinhThaiDo({ ngay: ngayKh(NGAY5.map((n) => [n, true])), luot: khuya, cauDaLam: tap(40), cauHoTro: new Set(), den: '2026-10-14' })
    expect(tin(rKhuya, 'don-bai')).toMatchObject({ tu: 24, mau: 40, giaTri: 60, muc: 'xau' })
    expect(rKhuya.ketLuan.nhan).toBe('chua-deu')
    expect(rKhuya.ketLuan.lyDo.join(' ')).toMatch(/24\/40 lượt làm trong 23:00–04:59 \(60%\)/)
  })

  it('Đối phó (quá nhanh): ≥ 30% lượt dưới ngưỡng mà nhóm ấy đúng dưới 50%; nhanh mà đúng nhiều ⇒ chỉ chú ý; Phần III dùng ngưỡng 15 giây', () => {
    const ngay = ngayKh(NGAY5.map((n) => [n, true]))
    const doan = Array.from({ length: 40 }, (_, i) => lt(i, i < 16 ? { giay: 3, dung: i % 4 === 0 } : {})) // 16/40 = 40% nhanh, đúng 4/16 = 25%
    const r = tinhThaiDo({ ngay, luot: doan, cauDaLam: tap(40), cauHoTro: new Set(), den: '2026-10-14' })
    expect(tin(r, 'qua-nhanh')).toMatchObject({ tu: 16, mau: 40, giaTri: 40, muc: 'xau' })
    expect(r.ketLuan.nhan).toBe('doi-pho')
    expect(r.ketLuan.lyDo[0]).toBe('Trả lời quá nhanh: Quá nhanh 16/40 lượt (40%) · nhóm quá nhanh đúng 25% · lượt thường đúng 100%.')
    const gioi = Array.from({ length: 40 }, (_, i) => lt(i, i < 16 ? { giay: 3 } : {}))
    expect(tin(tinhThaiDo({ ngay, luot: gioi, cauDaLam: tap(40), cauHoTro: new Set(), den: '2026-10-14' }), 'qua-nhanh').muc).toBe('chu-y')
    // 12 giây: trắc nghiệm KHÔNG nhanh, tự tính (Phần III) nhanh
    const muoiHai = Array.from({ length: 20 }, (_, i) => lt(i, { giay: 12, loai: i < 10 ? 'tu-tinh' : 'trac-nghiem' }))
    expect(tin(tinhThaiDo({ ngay, luot: muoiHai, cauDaLam: tap(20), cauHoTro: new Set(), den: '2026-10-14' }), 'qua-nhanh')).toMatchObject({ tu: 10, mau: 20 })
    // dưới 20 lượt có số giây ⇒ chưa đủ dữ liệu
    expect(tin(tinhThaiDo({ ngay, luot: doan.slice(0, 19), cauDaLam: tap(19), cauHoTro: new Set(), den: '2026-10-14' }), 'qua-nhanh').muc).toBe('chua-du')
  })

  it('Đối phó (chọn lặp): chuỗi ≥ 6 lượt trắc nghiệm liên tiếp cùng chữ, cùng ngày; chuỗi 5 hoặc vắt qua ngày không tính', () => {
    const cung = (n: number, ngay: string, chu: string, tu = 0) => Array.from({ length: n }, (_, i) => lt(tu + i, { ngay, luc: luc(ngay, 9, tu + i), chon: chu }))
    expect(chuoiChonLap([...cung(5, '2026-10-13', 'B'), ...cung(1, '2026-10-13', 'C', 5)])).toMatchObject({ trongChuoi: 0, dai: 5, chu: 'B' })
    expect(chuoiChonLap([...cung(3, '2026-10-13', 'B'), ...cung(3, '2026-10-14', 'B')]).trongChuoi).toBe(0)
    const luot = [...cung(7, '2026-10-13', 'B'), ...Array.from({ length: 13 }, (_, i) => lt(20 + i))]
    const r = tinhThaiDo({ ngay: ngayKh(NGAY5.map((n) => [n, true])), luot, cauDaLam: tap(20), cauHoTro: new Set(), den: '2026-10-14' })
    expect(tin(r, 'chon-lap')).toMatchObject({ tu: 7, mau: 20, giaTri: 35, muc: 'xau' })
    expect(tin(r, 'chon-lap').chu).toMatch(/chuỗi dài nhất 7 lượt chọn B/)
    expect(r.ketLuan.nhan).toBe('doi-pho')
  })

  it('Đối phó (dựa lời giải + độ đúng giảm): gợi ý ≥ 50% câu VÀ 7 ngày gần nhất giảm ≥ 5 điểm %; gợi ý cao mà độ đúng không giảm ⇒ không kết luận đối phó', () => {
    const ngayDai = Array.from({ length: 14 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`)
    const truoc = Array.from({ length: 20 }, (_, i) => lt(i, { ngay: '2026-10-03', luc: luc('2026-10-03', 9, i), dung: i < 16 })) // 80%
    const gan = Array.from({ length: 20 }, (_, i) => lt(40 + i, { ngay: '2026-10-12', luc: luc('2026-10-12', 9, i), dung: i < 10 })) // 50%
    const ngay = ngayKh(ngayDai.map((n) => [n, true]))
    const r = tinhThaiDo({ ngay, luot: [...truoc, ...gan], cauDaLam: tap(20), cauHoTro: tap(12), den: '2026-10-14' })
    expect(tin(r, 'xu-huong')).toMatchObject({ giaTri: -30, muc: 'xau', tu: 20, mau: 20 })
    expect(tin(r, 'goi-y')).toMatchObject({ tu: 12, mau: 20, giaTri: 60, muc: 'xau' })
    expect(r.ketLuan.nhan).toBe('doi-pho')
    const khongGiam = tinhThaiDo({ ngay, luot: [...truoc, ...truoc.map((l, i) => ({ ...l, ngay: '2026-10-12', luc: luc('2026-10-12', 9, i) }))], cauDaLam: tap(20), cauHoTro: tap(12), den: '2026-10-14' })
    expect(tin(khongGiam, 'xu-huong').muc).toBe('tot')
    expect(khongGiam.ketLuan.nhan).toBe('cham-chi')
  })

  it('phân bố số giây: bảy nhóm, đếm lượt quá nhanh theo ngưỡng của loại câu', () => {
    const p = phanBoGiay([lt(0, { giay: 5 }), lt(1, { giay: 12, loai: 'tu-tinh' }), lt(2, { giay: 12 }), lt(3, { giay: 400 }), lt(4, { giay: null })])
    expect(p.map((x) => [x.nhan, x.soLuot, x.soNhanh])).toEqual([
      ['Dưới 8 giây', 1, 1], ['8–14 giây', 2, 1], ['15–29 giây', 0, 0], ['30–59 giây', 0, 0], ['1–2 phút', 0, 0], ['2–5 phút', 0, 0], ['Từ 5 phút', 1, 0],
    ])
  })
})

describe('máy chủ /gv/ho-so-thai-do — đọc D1', () => {
  it('chỉ thầy; thiếu sbd / không có em ⇒ lỗi', async () => {
    const d = boDuLieu()
    const env = d.env as unknown as Env
    expect((await goiWorker(worker, env, '/gv/ho-so-thai-do', { sbd: 'B' })).ok).toBe(false)
    expect(await gvHoSoThaiDo(env, { sbd: '' }, NOW)).toMatchObject({ ok: false })
    expect(await gvHoSoThaiDo(env, { sbd: 'KHONG-CO' }, NOW)).toEqual({ ok: false, error: 'Không tìm thấy học sinh' })
  })

  it('em Gói 7: lịch ngày khớp bảng Bài hằng ngày; đếm đúng / sai / đã ôn; gợi ý từ hỗ trợ + đọc lời giải; số giây đo thật', async () => {
    const d = boDuLieu()
    // thêm: 13/10 làm lại G1 (từng sai) ⇒ ôn; Ôn lại câu G9; một lượt có hỗ trợ; một lượt raw ms 5 giây
    sk(d, { sbd: 'B', qid: 'G1', luc: luc('2026-10-13', 15), kq: 1, raw: { ms: 5000, chon: 'A' } })
    sk(d, { sbd: 'B', qid: 'G9', luc: luc('2026-10-14', 8), kq: 0, nguon: 'on_lai', giay: 30 })
    sk(d, { sbd: 'B', qid: 'G10', luc: luc('2026-10-14', 8, 5), kq: 1, assistance: 'assisted', giay: 50 })
    d.sql.prepare('INSERT INTO loi_giai_hoi (sbd, qid, nguon, luc) VALUES (?,?,?,?)').run('B', 'G11', 'x', luc('2026-10-14', 9))
    const env = d.env as unknown as Env
    const r = (await gvHoSoThaiDo(env, { sbd: 'B', tu: '2026-10-12' }, NOW)) as KetQuaHoSoThaiDo
    expect(r).toMatchObject({ ok: true, em: { sbd: 'B', hoTen: 'Lê Bình', lop: '12 - Tinh Hoa', khoi: '12' }, tu: '2026-10-12', den: '2026-10-14' })
    const bang = theo(await goi(d), 'B')
    expect(r.ngay.map((n) => [n.ngay, n.mucToiThieu, n.datMuc])).toEqual(bang.ngay.map((n) => [n.ngay, n.mucToiThieu, n.datMuc]))
    // lượt làm trong khoảng (bỏ đọc lời giải, bỏ còn giấu G4): 24 (12/10) + G1, G1, G2, G5, G6, G1 (13/10) + G9, G10 (14/10)
    expect(r.dem.soLuot).toBe(24 + 6 + 2)
    expect(r.dem).toMatchObject({ soDung: 24 + 4 + 1, soSai: 1 + 1, soBoTrong: 1 })
    expect(r.dem.soLuotOn).toBe(2) // G1 lúc 15:00 sau lần sai 09:01 · G9 Ôn lại
    expect(r.dem.soCauOn).toBe(2)
    expect(r.cauDaOn.map((c) => c.qid)).toEqual(['G9', 'G1']) // chưa đúng lại trước
    expect(r.cauDung.find((c) => c.qid === 'G1')).toMatchObject({ soLan: 4, soDung: 3, soSai: 1, dungLanDau: true, lanCuoiDung: true, soLanOn: 1 })
    expect(tin(r as never, 'goi-y')).toMatchObject({ tu: 3, mau: 24 }) // G10 có hỗ trợ · G3 đọc lời giải · G11 hỏi lời giải (cả ba đều đã làm)
    expect(r.phanBoGiay[0]).toMatchObject({ nhan: 'Dưới 8 giây', soLuot: 1, soNhanh: 1 }) // raw ms 5000
    expect(r.ngay.find((n) => n.ngay === '2026-10-14')).toMatchObject({ soLuot: 2, soDung: 1, soSai: 1, tiLeDung: 50, homNay: true })
    expect(r.ketLuan.nhan).toBe('chua-du-du-lieu') // 12/10 + 13/10 đã hết, hôm nay chưa đủ ⇒ 2 ngày
  })
})

// ------------------------------------------------------------------ MỐC 01/10 (thầy 12/10: "dữ liệu phần này tính từ 1/10 cho tôi nhé")
describe('mốc 01/10 — mặc định, ngày trước Gói 7, khoảng đọc, cắt 10.000 lượt', () => {
  it('mặc định tính từ 2026-10-01; ngày 05/10 (trước Gói 7) tính theo kế hoạch Hành trình, từ ngày gói 10/10 mới là Gói 7; hồ sơ cùng khoảng, cùng số', async () => {
    const d = taoD1()
    const env = d.env as unknown as Env
    em(d, 'G', 'Ngô Giang', '12', '12 - Tinh Hoa')
    hanhTrinh(d, '12', ['G'])
    goi7(d, 'G', '2026-10-10')
    // 05/10: mức chốt tầng 2 = 30; kế hoạch 3 câu — làm H1, H2 (sai vẫn là đã làm) + Z1 ngoài kế hoạch (Gói 7 sẽ đếm 3, Hành trình chỉ 2)
    chot(d, 'G', '2026-10-05', 2, 30)
    keHoach(d, 'G', '2026-10-05', ['H1', 'H2', 'H3'])
    sk(d, { sbd: 'G', qid: 'H1', luc: luc('2026-10-05', 9) })
    sk(d, { sbd: 'G', qid: 'H2', luc: luc('2026-10-05', 9, 5), kq: 0 })
    sk(d, { sbd: 'G', qid: 'Z1', luc: luc('2026-10-05', 9, 10) })
    // 06/10: không có kế hoạch, vẫn làm một câu ⇒ Hành trình đếm 0 (không bị tính nhầm kiểu Gói 7)
    sk(d, { sbd: 'G', qid: 'Z2', luc: luc('2026-10-06', 9) })
    // 10/10: ngày gói đầu ⇒ Gói 7 đếm mọi mã câu khác nhau có kết quả
    for (const q of ['G1', 'G2']) sk(d, { sbd: 'G', qid: q, luc: luc('2026-10-10', 9) })
    const r = (await gvBaiHangNgay(env, {}, NOW)) as KetQuaBaiHangNgay
    expect(r).toMatchObject({ ok: true, tu: '2026-10-01', den: '2026-10-14', canhBao: [] })
    expect(r.ngay).toHaveLength(14)
    const g = theo(r, 'G')
    const theoNgay = Object.fromEntries(g.ngay.map((n) => [n.ngay, o(n)]))
    expect(theoNgay['2026-10-01']).toEqual(['2026-10-01', 30, 0, 30, false, 'tang-gan-nhat', 'hanh-trinh']) // chưa có tầng trước ⇒ tầng sau gần nhất
    expect(theoNgay['2026-10-05']).toEqual(['2026-10-05', 30, 2, 28, false, 'da-chot', 'hanh-trinh'])
    expect(theoNgay['2026-10-06']).toEqual(['2026-10-06', 30, 0, 30, false, 'tang-gan-nhat', 'hanh-trinh'])
    expect(theoNgay['2026-10-10']).toEqual(['2026-10-10', 30, 2, 28, false, 'tang-gan-nhat', 'goi7'])
    expect(g.ngay.filter((n) => n.cheDo === 'hanh-trinh').map((n) => n.ngay)).toEqual(r.ngay.filter((n) => n < '2026-10-10'))
    expect(g).toMatchObject({ soNgayThieu: 13, soNgayKhongLam: 11, tongDaLam: 4 })
    // hồ sơ thái độ mặc định: cùng khoảng 01/10 → 14/10, cùng "đã làm / chế độ" từng ngày với bảng
    const h = (await gvHoSoThaiDo(env, { sbd: 'G' }, NOW)) as KetQuaHoSoThaiDo
    expect(h).toMatchObject({ ok: true, tu: '2026-10-01', den: '2026-10-14', catBot: false })
    expect(h.ngay.map((n) => [n.ngay, n.mucToiThieu, n.daLam, n.cheDo])).toEqual(g.ngay.map((n) => [n.ngay, n.mucToiThieu, n.daLam, n.cheDo]))
    expect(h.ngay.find((n) => n.ngay === '2026-10-05')).toMatchObject({ soLuot: 3, soDung: 2, soSai: 1, cheDo: 'hanh-trinh' })
    expect(h.dem.soLuot).toBe(6)
    expect(h.tinHieu.find((t) => t.ma === 'ngay-du-muc')).toMatchObject({ tu: 0, mau: 13, muc: 'xau' })
  })

  it('khoảng đọc theo chế độ: sổ Gói 7 từ ngày gói sớm nhất của lô, kế hoạch Hành trình tới trước ngày gói muộn nhất (chưa có gói ⇒ tới den)', () => {
    const [tu, den] = ['2026-10-01', '2026-10-14']
    expect(khoangDocTheoCheDo([{ goi7Tu: '2026-10-10' }, { goi7Tu: '2026-10-12' }], tu, den)).toEqual({ tuGoi: '2026-10-10', denHt: '2026-10-11' })
    expect(khoangDocTheoCheDo([{ goi7Tu: null }, { goi7Tu: '2026-10-10' }], tu, den)).toEqual({ tuGoi: '2026-10-10', denHt: den })
    expect(khoangDocTheoCheDo([{ goi7Tu: '2026-10-20' }], tu, den)).toEqual({ tuGoi: den, denHt: den }) // gói sau khoảng ⇒ cả khoảng là Hành trình
    expect(khoangDocTheoCheDo([{ goi7Tu: '2026-09-20' }], tu, den)).toEqual({ tuGoi: tu, denHt: tu }) // gói trước khoảng ⇒ cả khoảng là Gói 7
  })

  it(`sổ vượt ${TOI_DA_LUOT_HO_SO} lượt: cắt rơi vào khoảng xem ⇒ catBot + cảnh báo nói rõ khoảng; cắt ở lượt cũ trước khoảng ⇒ cảnh báo danh sách câu`, async () => {
    const dung = (truocKhoang: number) => {
      const d = taoD1()
      em(d, 'H', 'Hồ Hải', '12', '12 - Tinh Hoa')
      const them = d.sql.prepare('INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, luc, ngay_vn) VALUES (?,?,?,?,?,?,?,?,?)')
      const ghi = (i: number, ngay: string) => {
        const l = new Date(Date.parse(`${ngay}T08:00:00+07:00`) + i * 1000).toISOString()
        them.run(`h${i}`, 'H', `Q${i % 400}`, 'game', 'P', 1, i % 3 ? 1 : 0, l, ngayVnCua(Date.parse(l)))
      }
      for (let i = 0; i < truocKhoang; i++) ghi(i, '2026-09-20')
      for (let i = truocKhoang; i < TOI_DA_LUOT_HO_SO + 1; i++) ghi(i, `2026-10-${String(1 + (i % 14)).padStart(2, '0')}`)
      return d.env as unknown as Env
    }
    const trong = (await gvHoSoThaiDo(dung(0), { sbd: 'H' }, NOW)) as KetQuaHoSoThaiDo
    expect(trong).toMatchObject({ ok: true, catBot: true })
    expect(trong.dem.soLuot).toBe(TOI_DA_LUOT_HO_SO)
    expect(trong.canhBao).toContain('Riêng từ 01/10 đến 14/10 em đã có hơn 10.000 lượt — các số của khoảng này chỉ tính 10.000 lượt gần nhất.')
    const ngoai = (await gvHoSoThaiDo(dung(1), { sbd: 'H' }, NOW)) as KetQuaHoSoThaiDo
    expect(ngoai).toMatchObject({ ok: true, catBot: true })
    expect(ngoai.dem.soLuot).toBe(TOI_DA_LUOT_HO_SO) // mọi lượt trong khoảng đều đọc đủ
    expect(ngoai.canhBao).toContain('Sổ của em vượt 10.000 lượt — danh sách câu tính trên 10.000 lượt gần nhất.')
  })
})
