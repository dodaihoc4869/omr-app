// @vitest-environment node
// ĐỢT 16 (12/10) — HỒ SƠ CỦA CON CHO PHỤ HUYNH (thầy: "App ph cũng phải hiển thị lười chăm đầy đủ như app hs"; hồ sơ giống nhau ở ba app).
// Ba lệnh phụ huynh CHỈ ĐỌC (server/src/ph-ho-so-con.ts) `/ph/nhip-hoc`, `/ph/ho-so-thai-do`, `/ph/lich-su-lam-cau` — chạy trên D1 THẬT (SQLite, lược
// đồ repo + bảng Hành trình / Gói 7 dựng bằng chính DDL máy chủ), qua định tuyến Worker thật. Kiểm:
//   · CÙNG HỢP ĐỒNG, CÙNG SỐ với ba lệnh học sinh của chính con đó (so nguyên trả lời, kể cả độ tin cậy mới);
//   · xác thực y hệt `/ph/con-tong-quan`: liên kết của con A + `sbd` con B trong thân ⇒ vẫn chỉ dữ liệu của A; liên kết giả / mã học sinh ⇒ từ chối,
//     không rơi xuống SBD trần; không danh tính / SBD không có ⇒ từ chối; SBD trần theo `CHI_NHAN_TOKEN` (giai đoạn mềm như mọi lệnh /ph/* đọc-chỉ);
//   · luật bảo mật của bản em áp y nguyên (lượt còn giấu, ca chưa công bố / đã xoá, đáp án chọn, mã câu thật); đếm truy cập đúng đường.
// Tên em là tên giả.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { SQL_GOI7 } from '../server/src/goi-bai-7-schema'
import type { KetQuaHoSoThaiDo } from '../server/src/bai-hang-ngay-kieu'
import type { KetQuaLichSuLamCau } from '../server/src/lich-su-lam-cau-kieu'
import type { KetQuaNhipHocEm } from '../server/src/nhip-hoc-kieu'
import { ngayVnCua } from '../server/src/bai-hang-ngay'
import { gameToken, parentPass } from '../server/src/game-v2-auth'
import { CHI_NHAN_TOKEN } from '../server/src/ph-tat-ca-ve-con'
import { LOI_HO_SO_CON, LOI_LICH_SU_CON, phHoSoThaiDo, phLichSuLamCau, phNhipHoc } from '../server/src/ph-ho-so-con'

type D = ReturnType<typeof taoD1That>
type Kq = Record<string, any>
const NOW = Date.parse('2026-10-14T05:00:00Z') // 12:00 Thứ Tư 14/10 giờ Việt Nam
afterEach(() => vi.useRealTimers())

const em = (d: D, sbd: string, ten: string) => {
  d.sql.prepare('INSERT INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run(sbd, ten, '2009', '12', 'x')
  d.sql.prepare('INSERT INTO hoc_sinh (sbd, ho_ten, lop, ten_lop, mat_khau, cap_nhat_luc) VALUES (?,?,?,?,?,?)').run(sbd, ten, '12', '12 - Tinh Hoa', `mk-${sbd}`, 'x')
}
let k = 0
interface Sk { sbd: string; qid: string; luc: string; kq?: number | null; giay?: number | null; nguon?: string; maNguon?: string; visibility?: string | null; raw?: Record<string, unknown> | null }
const sk = (d: D, x: Sk) =>
  d.sql.prepare(`INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, visibility, raw_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    `k${String(++k).padStart(5, '0')}`, x.sbd, x.qid, x.nguon ?? 'game', x.maNguon ?? 'P', 1, x.kq === undefined ? 1 : x.kq, x.giay ?? null, x.luc,
    ngayVnCua(Date.parse(x.luc)), x.visibility ?? null, x.raw ? JSON.stringify(x.raw) : null,
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

/** A (Ngô An Giả): có ba ngày liền bỏ (Lười) + lượt ẨN với em và phụ huynh (còn giấu, ca chưa công bố, ca đã xoá). B (Lê Bình Giả): chăm, không lượt ẩn. */
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
const goi = async (env: Env, duong: string, body: Record<string, unknown>): Promise<Kq> => {
  const r = await goiWorker(worker, env, duong, body)
  delete r.serverNow
  return r
}
const MA_AN = /MO-I-|XOA-I-|GIAU-I-|CA-MO|CA-XOA/
const BA_LENH = [
  ['/ph/nhip-hoc', '/hs/nhip-hoc'],
  ['/ph/ho-so-thai-do', '/hs/ho-so-thai-do'],
  ['/ph/lich-su-lam-cau', '/hs/lich-su-lam-cau'],
] as const
const moiKhoa = (x: unknown, ra = new Set<string>()): Set<string> => {
  if (Array.isArray(x)) x.forEach((v) => moiKhoa(v, ra))
  else if (x && typeof x === 'object') for (const [kk, v] of Object.entries(x)) { ra.add(kk); moiKhoa(v, ra) }
  return ra
}
const batDau = () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  const d = boDuLieu()
  return { d, env: d.env as unknown as Env }
}

describe('phụ huynh thấy ĐÚNG bản học sinh của con mình (cùng hợp đồng, cùng số)', () => {
  it.each(['A', 'B'])('con %s: ba lệnh /ph/* (liên kết riêng) = ba lệnh /hs/* (token của con) — nguyên trả lời, kể cả độ tin cậy', async (sbd) => {
    const { d, env } = batDau()
    const pass = await parentPass(d.env, sbd)
    const token = await gameToken(env, sbd)
    for (const [ph, hs] of BA_LENH) {
      const rPh = await goi(env, ph, { pass })
      const rHs = await goi(env, hs, { token })
      expect(rPh.ok, ph).toBe(true)
      expect(rPh, ph).toEqual(rHs)
    }
    // Lười / Chăm đầy đủ như app em: nhóm, chuỗi, dải ô; hồ sơ có kết luận + tín hiệu + độ tin cậy mới.
    const nhip = (await goi(env, '/ph/nhip-hoc', { pass })) as KetQuaNhipHocEm
    expect(nhip.nhom).toBe(sbd === 'A' ? 'luoi' : 'cham')
    expect(nhip.ngay.length).toBe(14)
    expect(nhip.doTinCay).toBeGreaterThanOrEqual(0)
    expect(nhip.doTinCay).toBeLessThanOrEqual(99)
    const hoSo = (await goi(env, '/ph/ho-so-thai-do', { pass })) as KetQuaHoSoThaiDo
    expect(hoSo.em.sbd).toBe(sbd)
    expect(hoSo.nhomNhip).toBe(nhip.nhom)
    expect(hoSo.ketLuan.nhan).toBe(sbd === 'A' ? 'luoi' : 'cham-chi')
    expect(typeof hoSo.ketLuan.doTinCay).toBe('number')
    expect(typeof hoSo.cachTinhTinCay).toBe('string')
    expect(hoSo.tuSuaSai).toMatchObject({ soCauSai: expect.any(Number), soCauDaSua: expect.any(Number) })
    const ls = (await goi(env, '/ph/lich-su-lam-cau', { pass, gioiHan: 5 })) as KetQuaLichSuLamCau
    expect(ls.lan.length).toBeLessThanOrEqual(5)
    expect(ls).toEqual(await goi(env, '/hs/lich-su-lam-cau', { token, gioiHan: 5 }))
  })

  it('A: lượt ẩn với em cũng ẩn với phụ huynh — còn giấu, ca chưa công bố, ca đã xoá; không đáp án chọn, không mã câu thật, không ghi chú nội bộ', async () => {
    const { d, env } = batDau()
    const pass = await parentPass(d.env, 'A')
    const td = (await goi(env, '/ph/ho-so-thai-do', { pass })) as KetQuaHoSoThaiDo
    const ls = (await goi(env, '/ph/lich-su-lam-cau', { pass })) as KetQuaLichSuLamCau
    expect(td.dem.soLuot).toBe(20) // 18 lượt kế hoạch + 2 lượt ca ĐÃ công bố
    expect(ls.tong.soLuot).toBe(20)
    expect(td.phanBoGiay.find((g) => g.nhan === 'Dưới 8 giây')!.soLuot).toBe(0) // 3 lượt 3 giây của ca chưa công bố không lộ
    expect(ls.lan.every((l) => l.chon === null)).toBe(true)
    expect([...ls.lan, ...ls.cauSai, ...td.cauDung, ...td.cauDaOn].every((x) => /^c\d+$/.test(x.qid))).toBe(true)
    expect(td.canhBao).toEqual([])
    for (const r of [td, ls, await goi(env, '/ph/nhip-hoc', { pass })]) {
      expect(JSON.stringify(r)).not.toMatch(MA_AN)
      expect(JSON.stringify(r)).not.toMatch(/"(A|CB)-I-\d+/)
      const khoa = moiKhoa(r)
      for (const cam of ['dapAn', 'dapAnDung', 'loiGiai', 'raw', 'ghiChu', 'moHoSo']) expect(khoa.has(cam)).toBe(false)
    }
  })
})

describe('xác thực y hệt /ph/con-tong-quan: chỉ con của chính phụ huynh', () => {
  it('liên kết của con A + sbd B (và tu/den) trong thân ⇒ vẫn chỉ dữ liệu của A; không một chữ của B', async () => {
    const { d, env } = batDau()
    const passA = await parentPass(d.env, 'A')
    for (const [ph] of BA_LENH) {
      const r = await goi(env, ph, { pass: passA, sbd: 'B', tu: '2026-09-01', den: '2026-09-02' })
      expect(r.ok, ph).toBe(true)
      expect(JSON.stringify(r), ph).not.toMatch(/Lê Bình Giả|"B-I-/)
    }
    const td = await goi(env, '/ph/ho-so-thai-do', { pass: passA, sbd: 'B' })
    expect(td).toMatchObject({ em: { sbd: 'A', hoTen: 'Ngô An Giả' }, tu: '2026-10-01', den: '2026-10-14' })
    expect((await goi(env, '/ph/nhip-hoc', { pass: passA, sbd: 'B' })).nhom).toBe('luoi') // A Lười, B Chăm
  })

  it('liên kết giả / sửa một chữ / token HỌC SINH ⇒ từ chối ở cả ba lệnh, KHÔNG rơi xuống SBD trần trong thân', async () => {
    const { d, env } = batDau()
    const passA = await parentPass(d.env, 'A')
    const tokenHs = await gameToken(env, 'A')
    for (const [ph] of BA_LENH) {
      for (const pass of ['abc.def', `${passA}x`, tokenHs]) {
        const r = await goi(env, ph, { pass, sbd: 'A' })
        expect(r.ok, `${ph} ${pass.slice(0, 6)}`).toBe(false)
        expect(typeof r.error).toBe('string')
        expect(r.em).toBeUndefined()
        expect(r.ngay).toBeUndefined()
      }
    }
    await expect(phHoSoThaiDo(env, { pass: `${passA}x`, sbd: 'A' }, NOW)).rejects.toThrow(/không hợp lệ/)
    await expect(phNhipHoc(env, { pass: `${passA}x`, sbd: 'A' }, NOW)).rejects.toThrow(/không hợp lệ/)
    await expect(phLichSuLamCau(env, { pass: `${passA}x`, sbd: 'A' })).rejects.toThrow(/không hợp lệ/)
  })

  it('không danh tính / SBD không có thật ⇒ từ chối; mã token học sinh ở `token` không mở được lệnh phụ huynh', async () => {
    const { env } = batDau()
    for (const [ph] of BA_LENH) {
      expect(await goi(env, ph, {})).toMatchObject({ ok: false, error: 'Không tìm thấy số báo danh của con.' })
      expect(await goi(env, ph, { sbd: 'KHONG-CO' })).toMatchObject({ ok: false, error: 'Không tìm thấy số báo danh của con.' })
      expect(await goi(env, ph, { token: await gameToken(env, 'A') })).toMatchObject({ ok: false })
    }
    await expect(phHoSoThaiDo(env, {}, NOW)).rejects.toThrow(/Không tìm thấy/)
  })

  it('SBD trần theo đúng `CHI_NHAN_TOKEN` như /ph/con-tong-quan (giai đoạn mềm: nhận; siết lại: từ chối)', async () => {
    const { d, env } = batDau()
    const pass = await parentPass(d.env, 'A')
    for (const [ph] of BA_LENH) {
      const tran = await goi(env, ph, { sbd: 'A' })
      if (CHI_NHAN_TOKEN) expect(tran.ok, ph).toBe(false)
      else expect(tran, ph).toEqual(await goi(env, ph, { pass }))
    }
  })

  it('đếm truy cập đúng đường và đúng loại (token / SBD trần), ghi ở đường ghi riêng', async () => {
    const { d, env } = batDau()
    const pass = await parentPass(d.env, 'B')
    for (const [ph] of BA_LENH) await goi(env, ph, { pass })
    if (!CHI_NHAN_TOKEN) await goi(env, '/ph/nhip-hoc', { sbd: 'B' })
    const dem = d.sql.prepare("SELECT duong, kieu, so FROM ph_truy_cap WHERE sbd = 'B' ORDER BY duong, kieu").all()
    expect(dem).toEqual([
      { duong: 'ph-ho-so-thai-do', kieu: 'token', so: 1 },
      { duong: 'ph-lich-su-lam-cau', kieu: 'token', so: 1 },
      ...(CHI_NHAN_TOKEN ? [] : [{ duong: 'ph-nhip-hoc', kieu: 'sbd_tran', so: 1 }]),
      { duong: 'ph-nhip-hoc', kieu: 'token', so: 1 },
    ])
  })
})

describe('lỗi lõi ⇒ câu nói với phụ huynh, không lùi về câu lệnh không lọc', () => {
  it('sổ có lọc hỏng (D1 cũ thiếu cột) ⇒ "Chưa tải được … của con. Anh/chị thử lại…"; không chạy câu lệnh không lọc', async () => {
    const { d, env } = batDau()
    const pass = await parentPass(d.env, 'A')
    const daChay: string[] = []
    const goc = env.DB.prepare.bind(env.DB)
    env.DB.prepare = ((q: string) => {
      daChay.push(q)
      if (/FROM su_kien_hoc/.test(q) && /visibility/.test(q) && /ORDER BY/.test(q)) throw new Error('no such column: visibility')
      return goc(q)
    }) as typeof env.DB.prepare
    expect(await phHoSoThaiDo(env, { pass }, NOW)).toEqual({ ok: false, error: LOI_HO_SO_CON })
    expect(await phLichSuLamCau(env, { pass })).toEqual({ ok: false, error: LOI_LICH_SU_CON })
    expect(daChay.filter((q) => /FROM su_kien_hoc/.test(q) && /ORDER BY/.test(q) && !/visibility/.test(q))).toEqual([])
  })
})
