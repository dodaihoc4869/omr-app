// @vitest-environment node
// MÁY CHỦ `/gv/lich-su-lam-cau` (thầy 09/10 khuya: "bấm vào từng học sinh hiển thị rõ toàn bộ lịch sử, câu làm sai số giây làm mỗi câu,
// mọi thứ về học sinh đó"). Hợp đồng `server/src/lich-su-lam-cau-kieu.ts`. CHỈ ĐỌC sổ `su_kien_hoc` — chạy trên D1 THẬT (SQLite, lược đồ repo).
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import type { KetQuaLichSuLamCau } from '../server/src/lich-su-lam-cau-kieu'
import { chonTuGiaTri, chuanMucDo, tieuDeCau } from '../server/src/lich-su-lam-cau'

type D = ReturnType<typeof taoD1That>
interface Sk {
  khoa: string; qid: string; nguon: string; maNguon: string; kq: number | null; luc: string
  giay?: number | null; lan?: number; raw?: Record<string, unknown> | null; purpose?: string | null; visibility?: string | null
  assistance?: string | null; attemptId?: string | null; mucDo?: string | null; maDang?: string | null; sbd?: string
}
const sk = (d: D, x: Sk) =>
  d.sql.prepare(`INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang, muc_do, purpose, visibility, assistance, attempt_id, raw_json)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    x.khoa, x.sbd ?? 'S1', x.qid, x.nguon, x.maNguon, x.lan ?? 1, x.kq, x.giay ?? null, x.luc, x.luc.slice(0, 10), x.maDang ?? null, x.mucDo ?? null,
    x.purpose ?? null, x.visibility ?? null, x.assistance ?? null, x.attemptId ?? null, x.raw ? JSON.stringify(x.raw) : null,
  )
const em = (d: D, sbd = 'S1', ten = 'Trần An') => {
  d.sql.prepare('INSERT INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run(sbd, ten, '2009', '12', 'x')
  d.sql.prepare('INSERT INTO hoc_sinh (sbd, ho_ten, lop, ten_lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run(sbd, 'Tên cũ', '12', '12 - Tinh Hoa', 'x')
}
const goi = async (env: Env, body: Record<string, unknown>) => (await goiWorker(worker, env, '/gv/lich-su-lam-cau', body, true)) as KetQuaLichSuLamCau & { error?: string }

describe('máy chủ /gv/lich-su-lam-cau — cổng và lỗi', () => {
  it('chỉ thầy; sbd rỗng / quá 40 ký tự ⇒ lỗi; không có em ⇒ "Không tìm thấy học sinh"', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    em(d)
    expect((await goiWorker(worker, env, '/gv/lich-su-lam-cau', { sbd: 'S1' })).ok).toBe(false)
    expect(await goi(env, { sbd: '' })).toMatchObject({ ok: false })
    expect(await goi(env, { sbd: 'x'.repeat(41) })).toMatchObject({ ok: false })
    expect(await goi(env, { sbd: 'KHONG-CO' })).toMatchObject({ ok: false, error: 'Không tìm thấy học sinh' })
    const r = await goi(env, { sbd: 'S1' })
    expect(r).toMatchObject({ ok: true, em: { sbd: 'S1', hoTen: 'Trần An', lop: '12 - Tinh Hoa' }, lan: [], cauSai: [], conNua: false, catBot: false })
    expect(r.tong).toEqual({ soLuot: 0, soDung: 0, soSai: 0, soBoTrong: 0, soCau: 0, soCauSai: 0, giayTb: null, tongGiay: 0 })
  })
})

describe('số giây: thứ tự ưu tiên đo thật ⇒ ước tính ⇒ null (không bịa)', () => {
  it('cột giay ⇒ raw ms ⇒ chi_tiet_cau.giay (ca thi) ⇒ ước tính (game) ⇒ null; raw ms có thì KHÔNG ước tính', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    em(d)
    d.sql.prepare("INSERT INTO ca (ma_ca, ten_ca, trang_thai, cap_nhat_luc) VALUES ('C1', 'Kiểm tra tuần 3', 'dong', 'x')").run()
    d.sql.prepare('INSERT INTO chi_tiet_cau (khoa, ma_ca, sbd, lan_thu, phan, so_cau, qid, dap_an_chon, giay, cap_nhat_luc) VALUES (?,?,?,?,?,?,?,?,?,?)').run('C1|S1|1|I|2', 'C1', 'S1', 1, 'I', 2, 'GA-I-2', 'B', 70, 'x')
    d.sql.prepare('INSERT INTO chi_tiet_cau (khoa, ma_ca, sbd, lan_thu, phan, so_cau, qid, dap_an_chon, giay, cap_nhat_luc) VALUES (?,?,?,?,?,?,?,?,?,?)').run('C1|S1|1|I|1', 'C1', 'S1', 1, 'I', 1, 'GA-I-1', 'D', 33, 'x')
    const t0 = Date.parse('2026-10-04T13:00:00Z')
    d.sql.prepare('INSERT INTO game_v2_session (id, sbd, json, created_at) VALUES (?,?,?,?)').run('P1', 'S1', JSON.stringify({ created: t0, doan: { ma: 'D1' } }), new Date(t0).toISOString())
    const tl = (id: string, qid: string, at: number, traLoi: string) =>
      d.sql.prepare('INSERT INTO game_v2_attempt (id, sbd, session, qid, content_group, json, created_at) VALUES (?,?,?,?,?,?,?)').run(id, 'S1', 'P1', qid, 'g', JSON.stringify({ attempt: { at, qid }, traLoi, correct: false }), new Date(at).toISOString())
    tl('P1|GA-I-5', 'GA-I-5', t0 + 45_000, 'C') // câu đầu lượt: 45 giây từ lúc mở lượt (ước tính)
    tl('P1|GA-I-6', 'GA-I-6', t0 + 75_000, 'A') // 30 giây từ câu trước — nhưng sổ có raw ms ⇒ dùng số đo
    const iso = (ms: number) => new Date(ms).toISOString()
    sk(d, { khoa: 'k1', qid: 'GA-I-1', nguon: 'thi', maNguon: 'C1', kq: 0, giay: 95, luc: '2026-10-01T02:05:00.000Z' }) // cột giay
    sk(d, { khoa: 'k2', qid: 'GA-I-2', nguon: 'thi', maNguon: 'C1', kq: 0, luc: '2026-10-01T02:06:00.000Z' }) // chi_tiet_cau 70, chọn B
    sk(d, { khoa: 'k3', qid: 'GA-I-3', nguon: 'on_lai', maNguon: 'x', kq: 1, luc: '2026-10-02T02:00:00.000Z', raw: { chon: 'A', ms: 12_400 } }) // raw ms ⇒ 12
    sk(d, { khoa: 'k4', qid: 'GA-I-4', nguon: 'len_bang', maNguon: 'b', kq: 0, luc: '2026-10-03T02:00:00.000Z' }) // không đo ⇒ null
    sk(d, { khoa: 'k5', qid: 'GA-I-5', nguon: 'game', maNguon: 'P1', kq: 0, luc: iso(t0 + 45_000) }) // ước tính 45
    sk(d, { khoa: 'k6', qid: 'GA-I-6', nguon: 'game', maNguon: 'P1', kq: 0, luc: iso(t0 + 75_000), raw: { ms: 21_600 } }) // raw ms 22 (không phải ước tính 30)
    sk(d, { khoa: 'k7', qid: 'GA-I-7', nguon: 'dau_gio', maNguon: 'x', kq: 1, luc: '2026-10-05T02:00:00.000Z', raw: { ms: 300 } }) // ms nhỏ ⇒ tối thiểu 1
    sk(d, { khoa: 'k8', qid: 'GA-I-8', nguon: 'thi', maNguon: 'C1', kq: null, luc: '2026-10-01T02:07:00.000Z' }) // bỏ trống, không có chi_tiet ⇒ null
    const r = await goi(env, { sbd: 'S1' })
    expect(r.ok).toBe(true)
    const theo = Object.fromEntries(r.lan.map((x) => [x.qid, x]))
    expect([theo['GA-I-1']!.giay, theo['GA-I-1']!.nguonGiay]).toEqual([95, 'do'])
    expect([theo['GA-I-2']!.giay, theo['GA-I-2']!.nguonGiay, theo['GA-I-2']!.chon]).toEqual([70, 'do', 'B'])
    expect([theo['GA-I-3']!.giay, theo['GA-I-3']!.nguonGiay, theo['GA-I-3']!.chon]).toEqual([12, 'do', 'A'])
    expect([theo['GA-I-4']!.giay, theo['GA-I-4']!.nguonGiay]).toEqual([null, null])
    expect([theo['GA-I-5']!.giay, theo['GA-I-5']!.nguonGiay, theo['GA-I-5']!.chon]).toEqual([45, 'uoc', 'C'])
    expect([theo['GA-I-6']!.giay, theo['GA-I-6']!.nguonGiay, theo['GA-I-6']!.chon]).toEqual([22, 'do', 'A'])
    expect([theo['GA-I-7']!.giay, theo['GA-I-7']!.nguonGiay]).toEqual([1, 'do'])
    expect([theo['GA-I-8']!.giay, theo['GA-I-8']!.nguonGiay, theo['GA-I-8']!.dung]).toEqual([null, null, null])
    // nơi làm: ca ⇒ "Ca <tên ca>", game Đoàn ⇒ "Đoàn", nguồn khác ⇒ tên ngắn
    expect([theo['GA-I-1']!.noi, theo['GA-I-5']!.noi, theo['GA-I-3']!.noi, theo['GA-I-4']!.noi, theo['GA-I-7']!.noi]).toEqual(['Ca Kiểm tra tuần 3', 'Đoàn', 'Ôn lại', 'Lên bảng', 'Đầu giờ'])
    // tổng: 8 lượt · 2 đúng · 5 sai · 1 bỏ trống; giây đo được (gồm ước tính) = 95+70+12+45+22+1 = 245 / 6 ⇒ 41
    expect(r.tong).toEqual({ soLuot: 8, soDung: 2, soSai: 5, soBoTrong: 1, soCau: 8, soCauSai: 5, giayTb: 41, tongGiay: 245 })
  })
})

describe('lọc, xếp, tiêu đề, câu sai', () => {
  it('bỏ "đọc lời giải" + sự kiện còn giấu; lan mới trước; câu sai gom theo câu gốc (song sinh), chưa đúng lại trước → sai nhiều → gần đây', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    em(d)
    em(d, 'S2', 'Lê Bình')
    d.sql.prepare('INSERT INTO game_v2_question (ma_de, qid, version, content_group, dang, json) VALUES (?,?,?,?,?,?)').run('DE9', 'DE9-I-25', 'v', 'g', 'D.EST', JSON.stringify({ phan: 'I', tenDang: 'Hiệu suất ester hoá', mucDo: 'van_dung' }))
    // Q = DE9-I-25: sai (ca) → sai (song sinh, Ôn lại) → ĐÚNG ở bản song sinh ⇒ đã sửa được
    sk(d, { khoa: 'a1', qid: 'DE9-I-25', nguon: 'btvn', maNguon: 'B1', kq: 0, giay: 50, luc: '2026-10-01T01:00:00.000Z' })
    sk(d, { khoa: 'a2', qid: 'DE9-I-25~ss0', nguon: 'on_lai', maNguon: 'x', kq: 0, giay: 40, luc: '2026-10-02T01:00:00.000Z', assistance: 'assisted' })
    sk(d, { khoa: 'a3', qid: 'DE9-I-25~ss1', nguon: 'on_lai', maNguon: 'x', kq: 1, giay: 20, luc: '2026-10-03T01:00:00.000Z' })
    // R: sai 1 lần, chưa đúng lại, gần đây nhất
    sk(d, { khoa: 'b1', qid: 'R-II-1', nguon: 'len_bang', maNguon: 'x', kq: 0, luc: '2026-10-06T01:00:00.000Z', mucDo: 'Thông hiểu' })
    // T: sai 2 lần, chưa đúng lại ⇒ đứng TRƯỚC R (sai nhiều hơn)
    sk(d, { khoa: 'c1', qid: 'T-I-3', nguon: 'btvn', maNguon: 'B1', kq: 0, giay: 30, luc: '2026-10-04T01:00:00.000Z' })
    sk(d, { khoa: 'c2', qid: 'T-I-3', nguon: 'btvn', maNguon: 'B2', kq: 0, luc: '2026-10-05T01:00:00.000Z' })
    // U: chỉ đúng ⇒ không vào câu sai
    sk(d, { khoa: 'd1', qid: 'U-I-1', nguon: 'btvn', maNguon: 'B1', kq: 1, luc: '2026-10-05T02:00:00.000Z' })
    // bị lọc: đọc lời giải, còn giấu, em khác
    sk(d, { khoa: 'x1', qid: 'T-I-3', nguon: 'on_lai', maNguon: 'x', kq: 0, luc: '2026-10-07T01:00:00.000Z', purpose: 'xem_loi_giai' })
    sk(d, { khoa: 'x2', qid: 'T-I-3', nguon: 'thi', maNguon: 'C9', kq: 1, luc: '2026-10-07T02:00:00.000Z', visibility: 'embargoed' })
    sk(d, { khoa: 'x3', qid: 'T-I-3', nguon: 'btvn', maNguon: 'B1', kq: 1, luc: '2026-10-07T03:00:00.000Z', sbd: 'S2' })
    const r = await goi(env, { sbd: 'S1' })
    expect(r.lan.map((x) => x.luc.slice(0, 13))).toEqual(['2026-10-06T01', '2026-10-05T02', '2026-10-05T01', '2026-10-04T01', '2026-10-03T01', '2026-10-02T01', '2026-10-01T01'])
    const q = r.lan.find((x) => x.qid === 'DE9-I-25~ss0')!
    expect(q).toMatchObject({ tieuDe: 'Câu 25 · Hiệu suất ester hoá', mucDo: 'VD', noi: 'Ôn lại', dung: false, giay: 40, nguonGiay: 'do', coGoiY: true, ngay: '2026-10-02' })
    expect(r.lan.find((x) => x.qid === 'R-II-1')).toMatchObject({ tieuDe: '', mucDo: 'hieu', coGoiY: false, chon: null })
    expect(r.cauSai).toEqual([
      { qid: 'T-I-3', tieuDe: '', mucDo: '', soLan: 2, soSai: 2, soDung: 0, lanCuoiDung: false, lanCuoi: '2026-10-05T01:00:00.000Z', giaySai: [30, null] },
      { qid: 'R-II-1', tieuDe: '', mucDo: 'hieu', soLan: 1, soSai: 1, soDung: 0, lanCuoiDung: false, lanCuoi: '2026-10-06T01:00:00.000Z', giaySai: [null] },
      { qid: 'DE9-I-25', tieuDe: 'Câu 25 · Hiệu suất ester hoá', mucDo: 'VD', soLan: 3, soSai: 2, soDung: 1, lanCuoiDung: true, lanCuoi: '2026-10-03T01:00:00.000Z', giaySai: [50, 40] },
    ])
    // 7 lượt; câu khác nhau theo câu gốc: DE9-I-25, R, T, U = 4
    expect(r.tong).toEqual({ soLuot: 7, soDung: 2, soSai: 5, soBoTrong: 0, soCau: 4, soCauSai: 3, giayTb: 35, tongGiay: 140 })
    expect(r).toMatchObject({ conNua: false, catBot: false })
  })

  it('gioiHan: trả đúng số lượt mới nhất + conNua; tong/cauSai vẫn tính trên mọi lượt; trần 2000', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    em(d)
    for (let i = 0; i < 5; i++) sk(d, { khoa: `g${i}`, qid: `V-I-${i}`, nguon: 'btvn', maNguon: 'B', kq: i === 0 ? 0 : 1, luc: `2026-10-0${i + 1}T01:00:00.000Z` })
    const r = await goi(env, { sbd: 'S1', gioiHan: 2 })
    expect(r.lan.map((x) => x.qid)).toEqual(['V-I-4', 'V-I-3'])
    expect(r).toMatchObject({ conNua: true, catBot: false, tong: { soLuot: 5, soSai: 1 } })
    expect(r.cauSai.map((x) => x.qid)).toEqual(['V-I-0'])
    expect((await goi(env, { sbd: 'S1', gioiHan: 99_999 })).lan).toHaveLength(5)
  })

  it('sổ vượt 5000 lượt ⇒ catBot, tong chỉ tính 5000 lượt gần nhất; lan mặc định 1000', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    em(d)
    const st = d.sql.prepare("INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, luc, ngay_vn) VALUES (?, 'S1', ?, 'btvn', 'B', 1, 1, ?, ?)")
    const t0 = Date.parse('2026-09-01T00:00:00Z')
    d.sql.exec('BEGIN')
    for (let i = 0; i < 5003; i++) { const luc = new Date(t0 + i * 60_000).toISOString(); st.run(`n${i}`, `W-I-${i % 50}`, luc, luc.slice(0, 10)) }
    d.sql.exec('COMMIT')
    const r = await goi(env, { sbd: 'S1' })
    expect(r).toMatchObject({ ok: true, catBot: true, conNua: true, tong: { soLuot: 5000, soDung: 5000 } })
    expect(r.lan).toHaveLength(1000)
    expect(r.lan[0]!.luc).toBe(new Date(t0 + 5002 * 60_000).toISOString())
  }, 30_000)
})

describe('D1 cũ thiếu cột chuẩn (raw_json, purpose, visibility…)', () => {
  it('truy vấn đủ cột lỗi ⇒ lùi câu cột gốc: vẫn trả lịch sử, giây từ cột sổ, chọn = null', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    em(d)
    sk(d, { khoa: 'o1', qid: 'O-I-1', nguon: 'btvn', maNguon: 'B', kq: 0, giay: 25, luc: '2026-10-01T01:00:00.000Z', raw: { chon: 'A', ms: 9000 } })
    d.sql.exec('DROP INDEX IF EXISTS idx_skh_em_tc')
    // giả D1 cũ: bỏ trigger/chỉ mục đọc cột chuẩn trước khi bỏ cột
    for (const t of d.sql.prepare("SELECT name FROM sqlite_master WHERE type = 'trigger' AND tbl_name = 'su_kien_hoc'").all() as { name: string }[]) d.sql.exec(`DROP TRIGGER ${t.name}`)
    for (const c of ['raw_json', 'purpose', 'visibility']) d.sql.exec(`ALTER TABLE su_kien_hoc DROP COLUMN ${c}`)
    const r = await goi(env, { sbd: 'S1' })
    expect(r.ok).toBe(true)
    expect(r.lan).toEqual([{ luc: '2026-10-01T01:00:00.000Z', ngay: '2026-10-01', qid: 'O-I-1', tieuDe: '', mucDo: '', noi: 'BTVN', dung: false, chon: null, giay: 25, nguonGiay: 'do', coGoiY: false }])
  })
})

describe('hàm thuần', () => {
  it('tieuDeCau · chuanMucDo · chonTuGiaTri', () => {
    expect(tieuDeCau('DE1-II-04~ss2', 'Este')).toBe('Câu 4 · Este')
    expect(tieuDeCau('ma-la', 'Este')).toBe('Este')
    expect(tieuDeCau('DE1-I-3', '')).toBe('')
    expect(['Nhận biết', 'NB', 'thông hiểu', 'van_dung', 'VDC', 'Vận dụng cao', 'lạ', ''].map(chuanMucDo)).toEqual(['biet', 'biet', 'hieu', 'VD', 'VDC', 'VDC', '', ''])
    expect([chonTuGiaTri('B'), chonTuGiaTri(12.5), chonTuGiaTri(['Đ', 'S', 'Đ', 'Đ']), chonTuGiaTri({ a: 1 }), chonTuGiaTri('  '), chonTuGiaTri(null)]).toEqual(['B', '12.5', 'ĐSĐĐ', null, null, null])
  })
})
