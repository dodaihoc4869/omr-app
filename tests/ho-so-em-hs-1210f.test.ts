// @vitest-environment node
// MÁY CHỦ "HỒ SƠ LÀM BÀI CỦA EM" (thầy 12/10: "Cho hs bấm vào bảng lười chăm. Khi bấm vào hiển thị đủ hồ sơ như trong nhịp học nhé") — hai lệnh học
// sinh CHỈ ĐỌC `/hs/ho-so-thai-do` + `/hs/lich-su-lam-cau` (server/src/ho-so-em-hs.ts), lọc bản học sinh ở server/src/ho-so-em-hs-loc.ts. Chạy trên
// D1 THẬT (SQLite, lược đồ repo + bảng Hành trình / Gói 7 dựng bằng chính DDL máy chủ). Kiểm từng điểm bảo mật:
//   · token học sinh (thiếu / giả / mã phụ huynh ⇒ từ chối) · SBD từ token, `sbd` trong thân bị bỏ ⇒ không bao giờ có dữ liệu em khác;
//   · bỏ lượt còn giấu (embargoed), lượt ca kiểm tra CHƯA công bố và ca ĐÃ XOÁ — ở cả số đếm, tín hiệu, danh sách câu, lịch sử;
//   · không đáp án em chọn (`chon`), không mã câu thật, không ghi chú nội bộ; không lùi về câu lệnh không lọc khi câu lọc hỏng;
//   · CÙNG phép tính với `gvHoSoThaiDo` / `gvLichSuLamCau`: em không có lượt ẩn ⇒ mọi con số trùng thầy. Tên em là tên giả.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { SQL_GOI7 } from '../server/src/goi-bai-7-schema'
import type { KetQuaHoSoThaiDo } from '../server/src/bai-hang-ngay-kieu'
import type { KetQuaLichSuLamCau } from '../server/src/lich-su-lam-cau-kieu'
import { gvHoSoThaiDo, ngayVnCua } from '../server/src/bai-hang-ngay'
import { gvLichSuLamCau } from '../server/src/lich-su-lam-cau'
import { CAN_DANG_NHAP_HO_SO, hsHoSoThaiDo, hsLichSuLamCau, LOI_HO_SO_EM } from '../server/src/ho-so-em-hs'
import { banHocSinhLichSu, taoKhoaCau, tieuDeCauHs, TRUONG_BO_BAN_HOC_SINH } from '../server/src/ho-so-em-hs-loc'
import { gameToken, parentPass } from '../server/src/game-v2-auth'

type D = ReturnType<typeof taoD1That>
type Kq<T> = T & { ok: boolean; error?: string }
const NOW = Date.parse('2026-10-14T05:00:00Z') // 12:00 Thứ Tư 14/10 giờ Việt Nam
afterEach(() => vi.useRealTimers())

const em = (d: D, sbd: string, ten: string) => {
  d.sql.prepare('INSERT INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run(sbd, ten, '2009', '12', 'x')
  d.sql.prepare('INSERT INTO hoc_sinh (sbd, ho_ten, lop, ten_lop, mat_khau, cap_nhat_luc) VALUES (?,?,?,?,?,?)').run(sbd, ten, '12', '12 - Tinh Hoa', `mk-${sbd}`, 'x')
}
let k = 0
interface Sk {
  sbd: string; qid: string; luc: string; kq?: number | null; giay?: number | null; nguon?: string; maNguon?: string; visibility?: string | null
  purpose?: string | null; raw?: Record<string, unknown> | null; maDang?: string | null
}
const sk = (d: D, x: Sk) =>
  d.sql.prepare(`INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang, purpose, visibility, raw_json)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    `k${String(++k).padStart(5, '0')}`, x.sbd, x.qid, x.nguon ?? 'game', x.maNguon ?? 'P', 1, x.kq === undefined ? 1 : x.kq, x.giay ?? null, x.luc,
    ngayVnCua(Date.parse(x.luc)), x.maDang ?? null, x.purpose ?? null, x.visibility ?? null, x.raw ? JSON.stringify(x.raw) : null,
  )
const luc = (ngay: string, gioVn = 10, phut = 0) => new Date(Date.parse(`${ngay}T00:00:00+07:00`) + (gioVn * 60 + phut) * 60_000).toISOString()
const NGAY = Array.from({ length: 14 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`)
const ca = (d: D, maCa: string, trangThai: string, congBo: string) =>
  d.sql.prepare('INSERT INTO ca (ma_ca, ten_ca, trang_thai, cong_bo, cap_nhat_luc) VALUES (?,?,?,?,?)').run(maCa, `Ca ${maCa}`, trangThai, congBo, 'x')

/** Mỗi ngày mức 2 câu (đã chốt), kế hoạch 2 câu; `lam[i]` = số câu kế hoạch đã làm ngày i (01/10 …), mỗi lượt 40 giây, chọn "B". */
function ngayEm(d: D, sbd: string, lam: readonly number[]) {
  lam.forEach((n, j) => {
    const ng = NGAY[j]!
    d.sql.prepare('INSERT INTO hanh_trinh_v3_ngay (sbd, ngay, tang, toi_thieu) VALUES (?,?,?,?)').run(sbd, ng, 1, 2)
    d.sql.prepare('INSERT INTO srs2_ke_hoach (sbd, ngay, chien_dich_id, dao_json, doan_json, tong, tao_luc) VALUES (?,?,?,?,?,?,?)')
      .run(sbd, ng, 'hanh-trinh-v3-khoi-12', JSON.stringify([`${sbd}-I-${j * 2 + 1}`, `${sbd}-I-${j * 2 + 2}`]), '[]', 2, 'x')
    for (let i = 0; i < n; i++) sk(d, { sbd, qid: `${sbd}-I-${j * 2 + 1 + i}`, luc: luc(ng, 8, i), giay: 40, kq: (j + i) % 3 ? 1 : 0, raw: { chon: 'B' } })
  })
}

/**
 * A (Ngô An Giả): 18 lượt kế hoạch (14 ngày) + các lượt ẨN phải bỏ ở bản em — 2 lượt CÒN GIẤU, 3 lượt ca CA-MO (đang mở, chưa công bố), 1 lượt ca CA-XOA
 *   (đã công bố nhưng thầy XOÁ ca) — và 2 lượt ca CA-CB ĐÃ công bố (phải còn, đúng như thầy thấy).
 * B (Lê Bình Giả): em khác, chỉ lượt thường + 1 lượt ca đã công bố — không lượt ẩn ⇒ bản em và bản thầy trùng mọi số.
 */
function boDuLieu() {
  const d = taoD1That()
  for (const q of [...SQL_BANG_HANH_TRINH, ...SQL_GOI7]) d.sql.exec(q)
  em(d, 'A', 'Ngô An Giả')
  em(d, 'B', 'Lê Bình Giả')
  d.sql.prepare("INSERT INTO chien_dich (id, ten, lop, sbd_json, ma_de_json, qid_json, han_nop, tao_luc, trang_thai) VALUES (?,?,?,?,?,?,?,?, 'dang_chay')")
    .run('hanh-trinh-v3-khoi-12', 'Hành trình · Khối 12', 'Khối 12', JSON.stringify(['A', 'B']), '[]', '[]', '9999-12-31', '2026-10-01T00:00:00Z')
  ngayEm(d, 'A', [2, 2, 2, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 1])
  ngayEm(d, 'B', [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0])
  ca(d, 'CA-CB', 'dong', 'ngay')
  ca(d, 'CA-MO', 'mo', 'khong')
  ca(d, 'CA-XOA', 'da_xoa', 'ngay')
  for (let i = 1; i <= 2; i++) sk(d, { sbd: 'A', qid: `CB-I-${i}`, luc: luc('2026-10-13', 14, i), kq: i === 1 ? 1 : 0, giay: 50, nguon: 'thi', maNguon: 'CA-CB', raw: { chon: 'C' } })
  for (let i = 1; i <= 3; i++) sk(d, { sbd: 'A', qid: `MO-I-${i}`, luc: luc('2026-10-13', 15, i), kq: 0, giay: 3, nguon: 'thi', maNguon: 'CA-MO', raw: { chon: 'D' } })
  sk(d, { sbd: 'A', qid: 'XOA-I-1', luc: luc('2026-10-12', 15), kq: 1, giay: 30, nguon: 'thi', maNguon: 'CA-XOA', raw: { chon: 'A' } })
  for (let i = 1; i <= 2; i++) sk(d, { sbd: 'A', qid: `GIAU-I-${i}`, luc: luc('2026-10-11', 16, i), kq: 0, giay: 4, visibility: 'embargoed' })
  sk(d, { sbd: 'B', qid: 'CB-I-1', luc: luc('2026-10-13', 14, 1), kq: 0, giay: 55, nguon: 'thi', maNguon: 'CA-CB', raw: { chon: 'A' } })
  return d
}
const goi = async <T>(env: Env, duong: string, body: Record<string, unknown>) => (await goiWorker(worker, env, duong, body)) as Kq<T>
const MA_AN = /MO-I-|XOA-I-|GIAU-I-|CA-MO|CA-XOA/

/** Mọi khoá (đệ quy) trong một trả lời JSON. */
const moiKhoa = (x: unknown, ra = new Set<string>()): Set<string> => {
  if (Array.isArray(x)) x.forEach((v) => moiKhoa(v, ra))
  else if (x && typeof x === 'object') for (const [kk, v] of Object.entries(x)) { ra.add(kk); moiKhoa(v, ra) }
  return ra
}

describe('cổng token: chỉ em đăng nhập, chỉ dữ liệu của chính em', () => {
  it('thiếu token / token giả / mã phụ huynh ⇒ từ chối ở CẢ HAI lệnh; token của A mà thân ghi sbd B ⇒ vẫn chỉ số của A', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    const d = boDuLieu()
    const env = d.env as unknown as Env
    for (const duong of ['/hs/ho-so-thai-do', '/hs/lich-su-lam-cau']) {
      expect(await goi(env, duong, {})).toMatchObject({ ok: false, error: CAN_DANG_NHAP_HO_SO })
      expect(await goi(env, duong, { token: 'abc.def', sbd: 'A' })).toMatchObject({ ok: false, error: CAN_DANG_NHAP_HO_SO })
      expect(await goi(env, duong, { token: await parentPass(env, 'A') })).toMatchObject({ ok: false, error: CAN_DANG_NHAP_HO_SO })
    }
    const tokenA = await gameToken(env, 'A')
    const td = await goi<KetQuaHoSoThaiDo>(env, '/hs/ho-so-thai-do', { token: tokenA, sbd: 'B', tu: '2026-09-01', den: '2026-09-02' })
    expect(td).toMatchObject({ ok: true, em: { sbd: 'A', hoTen: 'Ngô An Giả' }, tu: '2026-10-01', den: '2026-10-14' }) // em không chọn khoảng
    const ls = await goi<KetQuaLichSuLamCau>(env, '/hs/lich-su-lam-cau', { token: tokenA, sbd: 'B' })
    expect(ls).toMatchObject({ ok: true, em: { sbd: 'A', hoTen: 'Ngô An Giả' } })
    // Không một chữ nào của em B: tên, mã câu riêng của B (`B-I-…`), câu ca của B.
    for (const r of [td, ls]) expect(JSON.stringify(r)).not.toMatch(/Lê Bình Giả|"B-I-/)
  })
})

describe('bỏ lượt chưa được xem kết quả: còn giấu · ca chưa công bố · ca đã xoá', () => {
  it('lịch sử: thầy thấy cả ca chưa công bố / đã xoá; em thì không — số lượt, câu sai, từng lượt; ca đã công bố vẫn có', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    const d = boDuLieu()
    const env = d.env as unknown as Env
    const thay = (await gvLichSuLamCau(env, { sbd: 'A' })) as KetQuaLichSuLamCau
    const hs = (await hsLichSuLamCau(env, { token: await gameToken(env, 'A') })) as KetQuaLichSuLamCau
    expect(thay.ok && hs.ok).toBe(true)
    // thầy: 18 lượt kế hoạch + 2 ca công bố + 3 ca mở + 1 ca xoá (lượt còn giấu thầy cũng không thấy)
    expect(thay.tong.soLuot).toBe(18 + 2 + 3 + 1)
    expect(JSON.stringify(thay)).toMatch(/Ca CA-MO|Ca CA-XOA/)
    // em: bỏ 3 + 1
    expect(hs.tong.soLuot).toBe(18 + 2)
    expect(hs.lan).toHaveLength(20)
    expect(hs.tong.soSai).toBe(thay.tong.soSai - 3)
    expect(hs.tong.soDung).toBe(thay.tong.soDung - 1)
    expect(hs.tong.soCauSai).toBe(thay.tong.soCauSai - 3)
    expect(hs.lan.filter((l) => /Ca CA-CB/.test(l.noi))).toHaveLength(2) // ca ĐÃ công bố còn nguyên
    expect(JSON.stringify(hs)).not.toMatch(MA_AN)
  })

  it('hồ sơ thái độ: số đếm, phân bố giây, tín hiệu, Câu đúng / Câu đã ôn đều KHÔNG tính lượt ẩn', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    const d = boDuLieu()
    const env = d.env as unknown as Env
    const thay = (await gvHoSoThaiDo(env, { sbd: 'A' }, NOW)) as KetQuaHoSoThaiDo
    const hs = (await hsHoSoThaiDo(env, { token: await gameToken(env, 'A') }, NOW)) as KetQuaHoSoThaiDo
    expect(thay.ok && hs.ok).toBe(true)
    expect(thay.dem.soLuot - hs.dem.soLuot).toBe(4) // 3 ca mở + 1 ca xoá
    expect(thay.dem.soSai - hs.dem.soSai).toBe(3)
    expect(thay.dem.soDung - hs.dem.soDung).toBe(1)
    expect(hs.dem.soLuot).toBe(20)
    // 3 lượt 3 giây của ca chưa công bố là "quá nhanh" ở bản thầy — em không thấy nhóm ấy (không lộ % đúng của ca chưa công bố)
    const nhanh = (r: KetQuaHoSoThaiDo) => r.phanBoGiay.find((g) => g.nhan === 'Dưới 8 giây')!.soLuot
    expect(nhanh(thay)).toBe(3)
    expect(nhanh(hs)).toBe(0)
    expect(hs.tinHieu.find((t) => t.ma === 'qua-nhanh')!.tu).toBe(0)
    expect(hs.cauDung.length).toBe(thay.cauDung.length - 1) // câu ca đã xoá (đúng) không vào Câu đúng
    // Lịch kế hoạch (mức / đã làm từng ngày) lọc lượt ẩn ở CẢ HAI bản (SQL_LUOT_GOI7) ⇒ trùng nhau
    expect(hs.ngay.map((n) => [n.ngay, n.daLam, n.mucToiThieu])).toEqual(thay.ngay.map((n) => [n.ngay, n.daLam, n.mucToiThieu]))
    expect(hs.nhomNhip).toBe(thay.nhomNhip)
    expect(JSON.stringify(hs)).not.toMatch(MA_AN)
  })
})

describe('không đáp án, không mã nội bộ, không ghi chú của thầy', () => {
  it('lịch sử bản em: `chon` luôn null (thầy có), qid là khoá c1…, tiêu đề không rỗng; không trường đáp án / lời giải / đề', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    const d = boDuLieu()
    const env = d.env as unknown as Env
    const thay = (await gvLichSuLamCau(env, { sbd: 'A' })) as KetQuaLichSuLamCau
    const hs = (await hsLichSuLamCau(env, { token: await gameToken(env, 'A') })) as KetQuaLichSuLamCau
    expect(thay.lan.some((l) => l.chon !== null)).toBe(true)
    expect(hs.lan.every((l) => l.chon === null)).toBe(true)
    expect([...hs.lan, ...hs.cauSai].every((x) => /^c\d+$/.test(x.qid) && x.tieuDe.trim() !== '')).toBe(true)
    expect(JSON.stringify(hs)).not.toMatch(/"(A|CB)-I-\d+/)
    const khoa = moiKhoa(hs)
    for (const cam of ['dapAn', 'dapAnDung', 'dap_an_dung', 'loiGiai', 'de', 'text', 'choices', 'raw', 'ghiChu', 'moHoSo']) expect(khoa.has(cam)).toBe(false)
  })

  it('hồ sơ thái độ bản em: canhBao chỉ còn dòng "sổ bị cắt" (ở đây không có) — thầy vẫn thấy ghi chú nội bộ; qid câu là khoá', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    const d = boDuLieu()
    // Cờ Gói 7 bật nhưng bảng gói hỏng (biến mất) ⇒ thầy có ghi chú nội bộ "Chưa đọc được Gói bài 7 ngày…"
    d.sql.prepare("INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES ('goi_bai_7_v1', '{\"bat\":true}', 'x')").run()
    d.sql.exec('DROP TABLE goi_bai_7_em')
    const env = d.env as unknown as Env
    const thay = (await gvHoSoThaiDo(env, { sbd: 'A' }, NOW)) as KetQuaHoSoThaiDo
    const hs = (await hsHoSoThaiDo(env, { token: await gameToken(env, 'A') }, NOW)) as KetQuaHoSoThaiDo
    expect(thay.canhBao.some((c) => /Gói bài 7/.test(c))).toBe(true)
    expect(hs.ok).toBe(true)
    expect(hs.canhBao).toEqual([])
    expect([...hs.cauDung, ...hs.cauDaOn].every((c) => /^c\d+$/.test(c.qid) && c.tieuDe.trim() !== '')).toBe(true)
    const khoa = moiKhoa(hs)
    for (const cam of ['dapAn', 'dapAnDung', 'loiGiai', 'chon', 'raw', 'ghiChu']) expect(khoa.has(cam)).toBe(false)
  })

  it('câu lệnh lọc hỏng (D1 cũ thiếu cột / bảng) ⇒ bản em báo lỗi, KHÔNG lùi về câu lệnh không lọc như bản thầy', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    const d = boDuLieu()
    const env = d.env as unknown as Env
    const daChay: string[] = []
    const goc = env.DB.prepare.bind(env.DB)
    // Giả D1 cũ: mọi câu đọc sổ CÓ lọc `visibility` đều hỏng (thiếu cột chuẩn) — chỉ câu lùi không lọc chạy được.
    env.DB.prepare = ((q: string) => {
      daChay.push(q)
      if (/FROM su_kien_hoc/.test(q) && /visibility/.test(q) && /ORDER BY/.test(q)) throw new Error('no such column: visibility')
      return goc(q)
    }) as typeof env.DB.prepare
    const tokenA = await gameToken(env, 'A')
    expect(await hsHoSoThaiDo(env, { token: tokenA }, NOW)).toMatchObject({ ok: false, error: LOI_HO_SO_EM })
    expect(await hsLichSuLamCau(env, { token: tokenA })).toMatchObject({ ok: false })
    const lui = (q: string) => /FROM su_kien_hoc/.test(q) && /ORDER BY/.test(q) && !/visibility/.test(q)
    expect(daChay.filter(lui)).toEqual([])
    // bản thầy vẫn lùi như trước (đúng hành vi cũ, không đổi)
    expect((await gvLichSuLamCau(env, { sbd: 'A' })).ok).toBe(true)
    expect(daChay.filter(lui).length).toBeGreaterThan(0)
  })
})

describe('cùng phép tính với thầy: em không có lượt ẩn ⇒ mọi con số trùng', () => {
  it('B: hồ sơ thái độ bản em = gvHoSoThaiDo (trừ khoá câu); lịch sử bản em = gvLichSuLamCau (trừ chon / khoá câu)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    const d = boDuLieu()
    const env = d.env as unknown as Env
    const tokenB = await gameToken(env, 'B')
    const thayTd = (await gvHoSoThaiDo(env, { sbd: 'B' }, NOW)) as KetQuaHoSoThaiDo
    const hsTd = (await hsHoSoThaiDo(env, { token: tokenB }, NOW)) as KetQuaHoSoThaiDo
    const boCau = (r: KetQuaHoSoThaiDo) => ({ ...r, canhBao: [], cauDung: r.cauDung.map(({ qid: _q, tieuDe: _t, ...c }) => c), cauDaOn: r.cauDaOn.map(({ qid: _q, tieuDe: _t, ...c }) => c) })
    expect(thayTd.ok).toBe(true)
    expect(boCau(hsTd)).toEqual(boCau(thayTd))
    expect(hsTd.dem.soLuot).toBe(27) // 26 lượt kế hoạch + 1 ca đã công bố
    const thayLs = (await gvLichSuLamCau(env, { sbd: 'B' })) as KetQuaLichSuLamCau
    const hsLs = (await hsLichSuLamCau(env, { token: tokenB })) as KetQuaLichSuLamCau
    expect(hsLs.tong).toEqual(thayLs.tong)
    expect(hsLs.lan.map(({ qid: _q, tieuDe: _t, chon: _c, ...l }) => l)).toEqual(thayLs.lan.map(({ qid: _q, tieuDe: _t, chon: _c, ...l }) => l))
    expect(hsLs.cauSai.map(({ qid: _q, tieuDe: _t, moChua: _m, ...c }) => c)).toEqual(thayLs.cauSai.map(({ qid: _q, tieuDe: _t, ...c }) => c)) // moChua: khoá mở Tự chữa chỉ ở bản em (đợt 16)
    // qua Worker (đường thật) ra đúng như gọi hàm (Worker thêm `serverNow` vào mọi trả lời)
    const quaWorker = await goi<KetQuaLichSuLamCau & { serverNow?: number }>(env, '/hs/lich-su-lam-cau', { token: tokenB })
    delete quaWorker.serverNow
    expect(quaWorker).toEqual(hsLs)
  })
})

describe('lọc thuần (ho-so-em-hs-loc.ts)', () => {
  it('khoá câu: cùng mã ⇒ cùng khoá; khớp câu sai ↔ lượt giữ nguyên; tiêu đề rỗng ⇒ "Câu N" / "Câu chưa có tên dạng"', () => {
    const khoa = taoKhoaCau()
    // Đợt 16: khoá cố định theo mã (băm) — cùng mã ⇒ cùng khoá ở mọi trả lời; mã khác ⇒ khoá khác; vẫn dạng "c<số>".
    const [k1, k2, k3] = [khoa('X-I-1'), khoa('X-I-2'), khoa('X-I-1')]
    expect(k1).toBe(k3); expect(k1).not.toBe(k2); expect([k1, k2].every((k) => /^c\d+$/.test(k))).toBe(true)
    expect(taoKhoaCau()('X-I-1')).toBe(k1)
    expect(tieuDeCauHs('DH-12-C1-B2-III-17~ss2#3', '')).toBe('Câu 17')
    expect(tieuDeCauHs('nen:abc', ' ')).toBe('Câu chưa có tên dạng')
    expect(tieuDeCauHs('DH-12-I-4', 'Câu 4 · Chất béo')).toBe('Câu 4 · Chất béo')
    const r = banHocSinhLichSu({
      ok: true, em: { sbd: 'A', hoTen: 'An', lop: '12' }, conNua: false, catBot: false,
      tong: { soLuot: 2, soDung: 1, soSai: 1, soBoTrong: 0, soCau: 1, soCauSai: 1, giayTb: 30, tongGiay: 60 },
      lan: [
        { luc: '2026-10-02T01:00:00Z', ngay: '2026-10-02', qid: 'Q-I-9', tieuDe: '', mucDo: '', noi: 'Đảo', dung: true, chon: 'A', giay: 30, nguonGiay: 'do', coGoiY: false },
        { luc: '2026-10-01T01:00:00Z', ngay: '2026-10-01', qid: 'Q-I-9', tieuDe: '', mucDo: '', noi: 'Đảo', dung: false, chon: 'C', giay: 30, nguonGiay: 'do', coGoiY: false },
      ],
      cauSai: [{ qid: 'Q-I-9', tieuDe: '', mucDo: '', soLan: 2, soSai: 1, soDung: 1, lanCuoiDung: true, lanCuoi: '2026-10-02T01:00:00Z', giaySai: [30] }],
    })
    const kQ = taoKhoaCau()('Q-I-9')
    expect(r.lan.map((l) => [l.qid, l.chon, l.tieuDe])).toEqual([[kQ, null, 'Câu 9'], [kQ, null, 'Câu 9']])
    expect(r.cauSai[0]).toMatchObject({ qid: kQ, tieuDe: 'Câu 9', soSai: 1, giaySai: [30] })
    expect(r.cauSai[0]!.moChua).toMatch(/^g\d+$/) // đợt 16: khoá mở Tự chữa (băm mã gốc), không mã nội bộ
    expect(TRUONG_BO_BAN_HOC_SINH).toContain('lan[].chon')
  })
})
