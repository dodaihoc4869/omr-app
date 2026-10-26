// @vitest-environment node
// ẨN HỆ PHÁT HIỆN LƯỜI KHỎI MÁY HỌC SINH (thầy 26/10) — PHẦN MÁY CHỦ: nhãn Học thật / Đối phó, 12 bậc chăm «Lười Vô Cực → Chăm», nhóm Chăm / Chưa đều /
// Lười, ĐUỔI, Mức làm (Nộp trước khi đọc hết đề, Bấm vội, Treo máy…) — CHỈ THẦY VÀ PHỤ HUYNH xem được. Kiểm:
//   (1) trả lời /hs/nhip-hoc · /hs/ho-so-thai-do · /hs/lich-su-lam-cau · /hs/danh-gia KHÔNG có các khoá ấy (em mở công cụ nhà phát triển cũng không thấy);
//   (2) bản /ph/* và /gv/* vẫn đủ. Màn ⇒ tests/an-luoi-hs-2610-man.test.tsx.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { SQL_GOI7 } from '../server/src/goi-bai-7-schema'
import { ngayVnCua } from '../server/src/bai-hang-ngay'
import { gameToken, parentPass } from '../server/src/game-v2-auth'
import { cronDanhGiaTuan } from '../server/src/danh-gia-hoc-that-d1'
import { danhGiaChoHs, hoSoThaiDoChoHs, lichSuChoHs, nhipHocChoHs } from '../server/src/an-luoi-hs'
import { banHocSinhLichSu } from '../server/src/ho-so-em-hs-loc'
import { lichSu6MucGia } from '../scripts/chup-v2/gia/lich-su-6-muc'

type D = ReturnType<typeof taoD1That>
type Kq = Record<string, unknown>
const CHU_LUOI = /lười|đối phó|bấm vội|treo/i
/** Khoá của hệ phát hiện lười — không được có ở BẤT KỲ tầng nào của trả lời /hs (trừ `nhan` của nhóm số giây "Dưới 8 giây" — kiểm riêng ở tầng đầu). */
const KHOA_LUOI = ['lyDo', 'soLieu', 'tienBo', 'tin', 'lichSu', 'coDoiPho', 'nhomNhip', 'bacCham', 'nhom', 'ketLuan', 'tinHieu', 'tinCayNhom', 'mucLam', 'mucLam6', 'tocDo', 'viecTiep', 'doTinCay', 'canThem', 'soNhanh', 'treo', 'giayTreo', 'cachTinhTinCay']
const moiKhoa = (x: unknown, ra = new Set<string>()): Set<string> => {
  if (Array.isArray(x)) x.forEach((v) => moiKhoa(v, ra))
  else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) { ra.add(k); moiKhoa(v, ra) }
  return ra
}
const NOW = Date.parse('2026-10-14T05:00:00Z') // 12:00 Thứ Tư 14/10 giờ Việt Nam
const CHU_TRONG_JSON = /Lười|lười|Đối phó|đối phó|Học thật|Bấm vội|bấm vội|[Tt]reo|Nộp trước khi đọc|Chăm|Chưa đều|ĐUỔI/
afterEach(() => vi.useRealTimers())
const sachLuoi = (ten: string, r: Kq) => {
  expect(r.ok, ten).toBe(true)
  expect(KHOA_LUOI.filter((k) => moiKhoa(r).has(k)), ten).toEqual([])
  expect('nhan' in r, ten).toBe(false)
  expect(JSON.stringify(r), ten).not.toMatch(CHU_TRONG_JSON)
  void CHU_LUOI
}

// ---------------------------------------------------------------- D1 thật (SQLite trong bộ nhớ) — em A Lười + lượt quá nhanh, em B Chăm
const em = (d: D, sbd: string, ten: string) => {
  d.sql.prepare('INSERT INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run(sbd, ten, '2009', '12', 'x')
  d.sql.prepare('INSERT INTO hoc_sinh (sbd, ho_ten, lop, ten_lop, mat_khau, cap_nhat_luc) VALUES (?,?,?,?,?,?)').run(sbd, ten, '12', '12 - Tinh Hoa', `mk-${sbd}`, 'x')
}
let k = 0
const luc = (ngay: string, gio = 10, phut = 0) => new Date(Date.parse(`${ngay}T00:00:00+07:00`) + (gio * 60 + phut) * 60_000).toISOString()
const NGAY = Array.from({ length: 14 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`)
function ngayEm(d: D, sbd: string, lam: readonly number[], giay: number) {
  lam.forEach((n, j) => {
    const ng = NGAY[j]!
    d.sql.prepare('INSERT INTO hanh_trinh_v3_ngay (sbd, ngay, tang, toi_thieu) VALUES (?,?,?,?)').run(sbd, ng, 1, 4)
    d.sql.prepare('INSERT INTO srs2_ke_hoach (sbd, ngay, chien_dich_id, dao_json, doan_json, tong, tao_luc) VALUES (?,?,?,?,?,?,?)')
      .run(sbd, ng, 'hanh-trinh-v3-khoi-12', JSON.stringify(Array.from({ length: 4 }, (_, i) => `${sbd}-I-${j * 4 + i + 1}`)), '[]', 4, 'x')
    for (let i = 0; i < n; i++) {
      d.sql.prepare(`INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, visibility, raw_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
        `k${String(++k).padStart(5, '0')}`, sbd, `${sbd}-I-${j * 4 + i + 1}`, 'game', 'P', 1, (j + i) % 3 ? 1 : 0, giay, luc(ng, 8, i), ngayVnCua(Date.parse(luc(ng, 8, i))), null, JSON.stringify({ chon: 'B' }),
      )
    }
  })
}
function boDuLieu() {
  const d = taoD1That()
  for (const q of [...SQL_BANG_HANH_TRINH, ...SQL_GOI7]) d.sql.exec(q)
  em(d, 'A', 'Ngô An Giả')
  em(d, 'B', 'Lê Bình Giả')
  d.sql.prepare("INSERT INTO chien_dich (id, ten, lop, sbd_json, ma_de_json, qid_json, han_nop, tao_luc, trang_thai) VALUES (?,?,?,?,?,?,?,?, 'dang_chay')")
    .run('hanh-trinh-v3-khoi-12', 'Hành trình · Khối 12', 'Khối 12', JSON.stringify(['A', 'B']), '[]', '[]', '9999-12-31', '2026-10-01T00:00:00Z')
  ngayEm(d, 'A', [4, 4, 0, 0, 0, 0, 1, 2, 4, 0, 0, 0, 1, 1], 3) // Lười: ít ngày đủ mức, nhiều ngày bỏ; mỗi lượt 3 giây (quá nhanh)
  ngayEm(d, 'B', [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 0], 45)
  return d
}
const goi = async (env: Env, duong: string, body: Record<string, unknown>, thay = false): Promise<Kq> => {
  const r = (await goiWorker(worker, env, duong, body, thay)) as Kq
  delete r.serverNow
  return r
}
const batDau = () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  const d = boDuLieu()
  return { d, env: d.env as unknown as Env }
}

/** Bộ của tests/danh-gia-hoc-that-d1-2410.test.ts: A1 làm thật (Học thật) · B1 bấm vội mà sai, chọn lặp (Đối phó); thầy BẬT, chấm tuần lúc thứ Hai 26/10 02:30. */
const BAY_GIO = Date.parse('2026-10-25T19:30:00Z')
async function boDanhGia() {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(BAY_GIO)
  const d = taoD1That()
  const env = d.env as unknown as Env
  let n = 0
  const ngay = Array.from({ length: 14 }, (_, i) => new Date(Date.parse('2026-10-13T00:00:00Z') + i * 86400000).toISOString().slice(0, 10))
  const dong = (sbd: string, qid: string, kq: number, giay: number, ng: string, chon: string) =>
    d.sql.prepare(`INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, raw_json) VALUES (?, ?, ?, 'game', 'P1', 1, ?, ?, ?, ?, ?)`)
      .run(`k${n}`, sbd, qid, kq, giay, `${ng}T0${n % 9}:${String(n++ % 60).padStart(2, '0')}:00Z`, ng, JSON.stringify({ doc: { t: 20, h: 0, p: 'I', dh: 1 }, chon }))
  for (const sbd of ['A1', 'B1']) d.sql.prepare('INSERT INTO hoc_sinh (sbd, ho_ten, lop, mat_khau, cap_nhat_luc) VALUES (?,?,?,?,?)').run(sbd, `Em ${sbd}`, '12', `mk-${sbd}`, 'x')
  for (let i = 0; i < 42; i++) dong('A1', `Q${i}`, i % 3 ? 1 : 0, 40, ngay[i % 14]!, 'ABCD'[i % 4]!)
  for (let i = 0; i < 42; i++) dong('B1', `R${i}`, i % 5 ? 0 : 1, 3, ngay[2 * Math.floor(i / 6)]!, 'C')
  await goi(env, '/gv/danh-gia/che-do', { cheDo: 'bat' }, true)
  for (let i = 0; i < 6; i++) await cronDanhGiaTuan(env, BAY_GIO + i * 60_000)
  const chup = d.sql.prepare('SELECT sbd, bac FROM danh_gia_em_tuan ORDER BY sbd').all() as { sbd: string; bac: number }[]
  expect(chup).toEqual([{ sbd: 'A1', bac: 1 }, { sbd: 'B1', bac: 3 }]) // máy đã chấm: A1 Học thật, B1 Đối phó
  return { d, env }
}

describe('(1) máy chủ: bốn lệnh /hs KHÔNG trả trường nào của hệ phát hiện lười', () => {
  it.each(['A', 'B'])('em %s: /hs/nhip-hoc · /hs/ho-so-thai-do · /hs/lich-su-lam-cau sạch khoá + chữ; số đếm vẫn đủ', async (sbd) => {
    const { env } = batDau()
    const token = await gameToken(env, sbd)
    const nhip = await goi(env, '/hs/nhip-hoc', { token })
    sachLuoi('/hs/nhip-hoc', nhip)
    expect((nhip.ngay as unknown[]).length).toBe(14) // dải ngày vẫn đủ
    expect(typeof nhip.chuoiDuGanNhat).toBe('number')
    const hs = await goi(env, '/hs/ho-so-thai-do', { token })
    sachLuoi('/hs/ho-so-thai-do', hs)
    expect((hs.dem as Kq).soLuot).toBeGreaterThan(0)
    expect((hs.phanBoGiay as Kq[]).every((g) => typeof g.soLuot === 'number' && !('soNhanh' in g))).toBe(true)
    const ls = await goi(env, '/hs/lich-su-lam-cau', { token })
    sachLuoi('/hs/lich-su-lam-cau', ls)
    expect((ls.lan as Kq[]).every((l) => 'dung' in l && 'giay' in l && 'coGoiY' in l)).toBe(true) // Đúng / Sai · thời gian · có dùng gợi ý
  })

  it('/hs/danh-gia khi thầy BẬT: em Đối phó / Học thật đều chỉ nhận { ok: true } — không nhãn, lý do, số liệu, tiến bộ, lịch sử, tin', async () => {
    const { env } = await boDanhGia()
    for (const sbd of ['A1', 'B1']) expect(await goi(env, '/hs/danh-gia', { token: await gameToken(env, sbd) })).toEqual({ ok: true })
    expect(await goi(env, '/hs/danh-gia', {})).toMatchObject({ ok: false }) // lỗi giữ nguyên lời
    expect(danhGiaChoHs({ ok: true, bat: true, coDanhGia: true, nhan: 'Đối phó', lyDo: ['x'], soLieu: {}, tienBo: {}, lichSu: [], tin: [] })).toEqual({ ok: true })
  })

  it('/hs/lich-su-lam-cau: Mức làm (Nộp trước khi đọc hết đề, Máy để treo…) bỏ ở MỌI tầng; bản phụ huynh (dữ liệu gốc) vẫn có', () => {
    const goc = banHocSinhLichSu(lichSu6MucGia('11010', 'Em Giả', 'phu-huynh'))
    expect(moiKhoa(goc).has('mucLam')).toBe(true)
    expect(goc.lan.some((l) => l.mucLam?.treo)).toBe(true)
    const em = lichSuChoHs(goc) as unknown as Kq
    expect(KHOA_LUOI.filter((x) => moiKhoa(em).has(x))).toEqual([])
    expect((em.lan as Kq[]).length).toBe(goc.lan.length) // không bỏ lượt, chỉ bỏ trường
    expect(goc.mucLam6).toBeTruthy() // không sửa đối tượng gốc (bản phụ huynh dùng lõi chung)
  })
})

describe('(2) máy chủ: bản phụ huynh /ph/* và thầy /gv/* GIỮ đủ trường', () => {
  it('em A Lười: /ph/nhip-hoc có nhóm + việc tiếp + tốc độ; /ph/ho-so-thai-do + /gv/ho-so-thai-do có kết luận, tín hiệu, nhóm; /gv/nhip-hoc có nhóm từng em', async () => {
    const { d, env } = batDau()
    const pass = await parentPass(d.env, 'A')
    const ph = await goi(env, '/ph/nhip-hoc', { pass })
    expect(ph).toMatchObject({ ok: true, nhom: 'luoi' })
    expect(ph.viecTiep).toMatchObject({ loai: 'thoat-luoi' })
    expect(ph.tocDo).toBeTruthy()
    // bản em = bản phụ huynh TRỪ đúng các trường ẩn
    expect(await goi(env, '/hs/nhip-hoc', { token: await gameToken(env, 'A') })).toEqual(nhipHocChoHs(ph as never))
    const phTd = await goi(env, '/ph/ho-so-thai-do', { pass })
    expect(phTd).toMatchObject({ ok: true, nhomNhip: 'luoi' })
    expect((phTd.ketLuan as Kq).nhan).toBeTruthy()
    expect((phTd.tinHieu as unknown[]).length).toBe(6)
    expect(await goi(env, '/hs/ho-so-thai-do', { token: await gameToken(env, 'A') })).toEqual(hoSoThaiDoChoHs(phTd as never))
    const gvTd = await goi(env, '/gv/ho-so-thai-do', { sbd: 'A' }, true)
    expect(gvTd).toMatchObject({ ok: true, nhomNhip: 'luoi' })
    expect((gvTd.tinHieu as Kq[]).find((t) => t.ma === 'qua-nhanh')).toBeTruthy()
    const gvNhip = await goi(env, '/gv/nhip-hoc', {}, true)
    expect(gvNhip.ok).toBe(true)
    expect(JSON.stringify(gvNhip)).toMatch(/"sbd":"A"/)
  })

  it('/ph/danh-gia + /gv/danh-gia/lop khi thầy BẬT: phụ huynh em Học thật vẫn thấy nhãn + số liệu; thầy thấy cả Đối phó', async () => {
    const { d, env } = await boDanhGia()
    const r = await goi(env, '/ph/danh-gia', { pass: await parentPass(d.env, 'A1') })
    expect(r).toMatchObject({ ok: true, bat: true, coDanhGia: true, nhan: 'Học thật' })
    expect(r).toHaveProperty('soLieu')
    expect(r).toHaveProperty('lichSu')
    const lop = await goi(env, '/gv/danh-gia/lop', {}, true)
    expect((lop.em as { sbd: string; tenBac: string }[]).map((x) => [x.sbd, x.tenBac])).toEqual(expect.arrayContaining([['A1', 'Học thật'], ['B1', 'Đối phó']]))
  })
})
