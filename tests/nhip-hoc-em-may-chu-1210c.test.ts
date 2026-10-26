// @vitest-environment node
// MÁY CHỦ `/hs/nhip-hoc` (bảng "Nhịp học của em", thầy 12/10 duyệt bản vẽ HS-Cham / HS-Luoi; "6 ngày liền làm đủ mới thoát nhóm lười nhé") và các
// trường CHỈ THÊM của `/gv/ho-so-thai-do` (nhomNhip · coDoiPho · chuoiDuGanNhat). CHỈ ĐỌC — chạy trên D1 THẬT (SQLite, lược đồ repo + bảng Hành trình
// tạo bằng chính DDL của máy chủ). Kiểm: token học sinh (thiếu / sai / mã phụ huynh ⇒ từ chối) · CHỈ số của chính em (thân lệnh có `sbd` khác vẫn bỏ) ·
// cùng mức / đã làm với bảng Bài hằng ngày · nhóm + chuỗi + việc tiếp · tốc độ BỎ lượt còn giấu và lượt ca chưa công bố · ngày vào muộn · hồ sơ thầy
// cùng nhóm với em và với Nhịp học. Tên em là tên giả.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { SQL_GOI7 } from '../server/src/goi-bai-7-schema'
import type { KetQuaNhipHoc, KetQuaNhipHocEm } from '../server/src/nhip-hoc-kieu'
import type { KetQuaBaiHangNgay, KetQuaHoSoThaiDo } from '../server/src/bai-hang-ngay-kieu'
import { gvBaiHangNgay, ngayVnCua } from '../server/src/bai-hang-ngay'
import { gvNhipHoc } from '../server/src/nhip-hoc'
// SỬA CÓ CHỦ ĐÍCH 26/10 (thầy: nhóm / bậc / tốc độ CHỈ thầy + phụ huynh xem): `/hs/nhip-hoc` không còn nhóm, việc tiếp, tốc độ ⇒ phép tính kiểm ở LÕI
// dùng chung `nhipHocCuaEm` (= `/ph/nhip-hoc`); bản em ⇒ tests/an-luoi-hs-2610.test.ts.
import { mucTocDo, nhipHocCuaEm } from '../server/src/nhip-hoc-em'
import { gameToken, parentPass } from '../server/src/game-v2-auth'
import { phanNhomEm } from '../src/lib/nhip-hoc-thay'

type D = ReturnType<typeof taoD1That>
const NOW = Date.parse('2026-10-14T05:00:00Z') // 12:00 Thứ Tư 14/10 giờ Việt Nam
afterEach(() => vi.useRealTimers())

const em = (d: D, sbd: string, ten: string, taoLuc: string | null = null) => {
  d.sql.prepare('INSERT INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run(sbd, ten, '2009', '12', 'x')
  d.sql.prepare('INSERT INTO hoc_sinh (sbd, ho_ten, lop, ten_lop, mat_khau, tao_luc, cap_nhat_luc) VALUES (?,?,?,?,?,?,?)').run(sbd, ten, '12', '12 - Tinh Hoa', `mk-${sbd}`, taoLuc, 'x')
}
let k = 0
interface Sk { sbd: string; qid: string; luc: string; kq?: number | null; giay?: number | null; purpose?: string | null; visibility?: string | null; nguon?: string; maNguon?: string }
const sk = (d: D, x: Sk) =>
  d.sql.prepare('INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, purpose, visibility) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(
    `k${String(++k).padStart(5, '0')}`, x.sbd, x.qid, x.nguon ?? 'game', x.maNguon ?? 'P', 1, x.kq === undefined ? 1 : x.kq, x.giay ?? null, x.luc, ngayVnCua(Date.parse(x.luc)), x.purpose ?? null, x.visibility ?? null,
  )
const luc = (ngay: string, gioVn = 10, phut = 0) => new Date(Date.parse(`${ngay}T00:00:00+07:00`) + (gioVn * 60 + phut) * 60_000).toISOString()
const NGAY = Array.from({ length: 14 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`)

/** Mỗi ngày mức 2 câu (đã chốt), kế hoạch 2 câu; `lam[i]` = số câu kế hoạch đã làm ngày i (01/10 …). `tu` = ngày đầu có kế hoạch. */
function ngayEm(d: D, sbd: string, lam: readonly number[], tu = 0) {
  lam.forEach((n, j) => {
    const ng = NGAY[tu + j]!
    d.sql.prepare('INSERT INTO hanh_trinh_v3_ngay (sbd, ngay, tang, toi_thieu) VALUES (?,?,?,?)').run(sbd, ng, 1, 2)
    d.sql.prepare('INSERT INTO srs2_ke_hoach (sbd, ngay, chien_dich_id, dao_json, doan_json, tong, tao_luc) VALUES (?,?,?,?,?,?,?)')
      .run(sbd, ng, 'hanh-trinh-v3-khoi-12', JSON.stringify([`${sbd}${ng}a`, `${sbd}${ng}b`]), '[]', 2, 'x')
    for (let i = 0; i < n; i++) sk(d, { sbd, qid: `${sbd}${ng}${'ab'[i]}`, luc: luc(ng, 8, i), giay: 40 })
  })
}

/**
 * L (Lười): 01–03 đủ · 04–09 bỏ 6 ngày · 10 thiếu (1/2) · 11–13 đủ (chuỗi 3) · hôm nay 1/2 ⇒ 6/13 ngày, Lười, 3/6 để thoát.
 *    Tốc độ: 24 lượt ngoài kế hoạch 13/10 — 10 lượt 5 giây (đúng 2), 14 lượt 30 giây; thêm lượt CÒN GIẤU + lượt ca CHƯA công bố 3 giây (phải bỏ).
 * C (Chăm): 01–13 đủ (13 ngày liền), hôm nay 0/2. M (vào muộn): tài khoản tạo 10/10, 10–13 đủ, hôm nay 2/2 ⇒ Chăm từ ngày vào.
 */
function boDuLieu() {
  const d = taoD1That()
  for (const q of [...SQL_BANG_HANH_TRINH, ...SQL_GOI7]) d.sql.exec(q)
  em(d, 'L', 'Ngô Lười Giả')
  em(d, 'C', 'Trần Chăm Giả')
  em(d, 'M', 'Lý Muộn Giả', '2026-10-10T02:00:00Z')
  d.sql.prepare("INSERT INTO chien_dich (id, ten, lop, sbd_json, ma_de_json, qid_json, han_nop, tao_luc, trang_thai) VALUES (?,?,?,?,?,?,?,?, 'dang_chay')")
    .run('hanh-trinh-v3-khoi-12', 'Hành trình · Khối 12', 'Khối 12', JSON.stringify(['L', 'C', 'M']), '[]', '[]', '9999-12-31', '2026-10-01T00:00:00Z')
  ngayEm(d, 'L', [2, 2, 2, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 1])
  ngayEm(d, 'C', [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0])
  ngayEm(d, 'M', [2, 2, 2, 2, 2], 9)
  for (let i = 0; i < 10; i++) sk(d, { sbd: 'L', qid: `L-I-${i}`, luc: luc('2026-10-13', 9, i), kq: i < 2 ? 1 : 0, giay: 5 })
  for (let i = 0; i < 14; i++) sk(d, { sbd: 'L', qid: `L-I-${10 + i}`, luc: luc('2026-10-13', 10, i), kq: 1, giay: 30 })
  for (let i = 0; i < 3; i++) sk(d, { sbd: 'L', qid: `L-G-${i}`, luc: luc('2026-10-13', 11, i), kq: 0, giay: 3, visibility: 'embargoed' })
  d.sql.prepare("INSERT INTO ca (ma_ca, ten_ca, trang_thai, cong_bo, cap_nhat_luc) VALUES ('CA-MO', 'Ca đang mở', 'dang_mo', 'khong', 'x')").run()
  for (let i = 0; i < 3; i++) sk(d, { sbd: 'L', qid: `L-T-${i}`, luc: luc('2026-10-13', 12, i), kq: 0, giay: 3, nguon: 'thi', maNguon: 'CA-MO' })
  sk(d, { sbd: 'L', qid: 'L-X', luc: luc('2026-10-13', 13), giay: 2, purpose: 'xem_loi_giai' })
  return d
}
const goiEm = async (env: Env, body: Record<string, unknown>) => (await goiWorker(worker, env, '/hs/nhip-hoc', body)) as KetQuaNhipHocEm & { error?: string }

describe('máy chủ /hs/nhip-hoc — cổng token, chỉ số của chính em', () => {
  it('thiếu token / token giả / mã phụ huynh ⇒ từ chối; token của L mà thân lệnh ghi sbd C ⇒ vẫn chỉ số của L', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    const d = boDuLieu()
    const env = d.env as unknown as Env
    expect(await goiEm(env, {})).toMatchObject({ ok: false, error: 'Em đăng nhập lại để xem nhịp học.' })
    expect(await goiEm(env, { token: 'abc.def' })).toMatchObject({ ok: false })
    expect(await goiEm(env, { token: await parentPass(env, 'L') })).toMatchObject({ ok: false })
    const tokenL = await gameToken(env, 'L')
    const r = await goiEm(env, { token: tokenL, sbd: 'C' })
    expect(r.ok).toBe(true)
    expect(r.ngay.map((x) => x.lam)).toEqual([2, 2, 2, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 1])
    // không trả mã câu, đáp án hay sự kiện nào — chỉ số đếm
    expect(JSON.stringify(r)).not.toMatch(/L-I-|L-G-|L-T-|CA-MO|qid|dapAn|answer/)
  })
})

describe('máy chủ /hs/nhip-hoc — số giống thầy, luật 6 ngày', () => {
  it('em Lười: 6/13 ngày, chuỗi bỏ 04–09/10, chuỗi đủ 3/6, việc tiếp thoát Lười; mức / đã làm TRÙNG bảng Bài hằng ngày', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    const d = boDuLieu()
    const env = d.env as unknown as Env
    const r = (await nhipHocCuaEm(env, 'L', NOW)) as KetQuaNhipHocEm
    expect(r).toMatchObject({
      ok: true, tu: '2026-10-01', homNay: '2026-10-14', nhom: 'luoi', soNgayQua: 13, soNgayDu: 6, phanTram: 46, chuoiDuGanNhat: 3,
      tongDaLam: 14, tongCauThieu: 13, ngayDuGanNhat: '2026-10-13', homNayMuc: { muc: 2, lam: 1 },
      chuoiBo: { dai: 6, tu: '2026-10-04', den: '2026-10-09' },
      viecTiep: { loai: 'thoat-luoi', coNgay: 3, canNgay: 6, cauConHomNay: 1, homNayDu: false },
    })
    const bhn = (await gvBaiHangNgay(env, {}, NOW)) as KetQuaBaiHangNgay
    const dong = bhn.em.find((e) => e.sbd === 'L')!
    expect(r.ngay.map((x) => [x.muc, x.lam])).toEqual(dong.ngay.map((n) => [n.mucToiThieu, n.daLam]))
  })

  it('tốc độ: bỏ lượt còn giấu, lượt ca chưa công bố và lượt đọc lời giải; 10/38 lượt dưới 8 giây (26%) đúng 20% ⇒ "cần để mắt" theo NGUONG_THAI_DO; biên mức', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    const d = boDuLieu()
    const env = d.env as unknown as Env
    const r = (await nhipHocCuaEm(env, 'L', NOW)) as KetQuaNhipHocEm
    // 24 lượt ngoài kế hoạch + 14 lượt kế hoạch (40 giây) = 38 lượt có số giây; 10 lượt quá nhanh, đúng 2/10
    expect(r.tocDo).toEqual({ soNhanh: 10, soCoGiay: 38, dungNhanh: 20, coTuTinh: false, muc: 'chu-y' })
    expect(mucTocDo(10, 24, 20)).toBe('xau')
    expect(mucTocDo(10, 38, 20)).toBe('chu-y') // 26% — dưới 30% thì chỉ cần để mắt
    expect(mucTocDo(2, 96, 50)).toBe('tot')
    expect(mucTocDo(5, 19, 0)).toBe('chua-du')
  })

  it('em Chăm: 13/13 ngày, chuỗi 13, hôm nay 0/2 ⇒ việc tiếp giữ chuỗi 14 ngày', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    const d = boDuLieu()
    const env = d.env as unknown as Env
    const r = (await nhipHocCuaEm(env, 'C', NOW)) as KetQuaNhipHocEm
    expect(r).toMatchObject({ nhom: 'cham', soNgayDu: 13, soNgayQua: 13, phanTram: 100, chuoiDuGanNhat: 13, tongDaLam: 26, chuoiBo: null })
    expect(r.viecTiep).toEqual({ loai: 'giu-chuoi', cauConHomNay: 2, homNayDu: false, chuoiNeuDu: 14 })
  })

  it('em vào muộn: dải từ ngày vào (10/10); hôm nay đủ cộng vào chuỗi', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    const d = boDuLieu()
    const env = d.env as unknown as Env
    const r = (await nhipHocCuaEm(env, 'M', NOW)) as KetQuaNhipHocEm
    expect(r).toMatchObject({ tu: '2026-10-10', nhom: 'cham', soNgayQua: 4, soNgayDu: 4, chuoiDuGanNhat: 5, ngayDuGanNhat: '2026-10-14' })
    expect(r.ngay.map((x) => x.ngay)).toEqual(NGAY.slice(9))
    expect(r.viecTiep).toEqual({ loai: 'giu-chuoi', cauConHomNay: 0, homNayDu: true, chuoiNeuDu: 5 })
  })
})

describe('/gv/ho-so-thai-do — CHỈ THÊM nhomNhip · coDoiPho · chuoiDuGanNhat (cùng hàm với Nhịp học, từ ngày vào)', () => {
  it('hồ sơ, Nhịp học của thầy và bảng của em cùng một nhóm; em vào muộn tính từ ngày vào (nhãn thái độ cũ vẫn tính từ 01/10)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    const d = boDuLieu()
    const env = d.env as unknown as Env
    const nhip = (await gvNhipHoc(env, {}, NOW)) as KetQuaNhipHoc
    for (const sbd of ['L', 'C', 'M']) {
      const hs = (await goiWorker(worker, env, '/gv/ho-so-thai-do', { sbd }, true)) as KetQuaHoSoThaiDo
      const em = (await nhipHocCuaEm(env, sbd, NOW)) as KetQuaNhipHocEm
      const dong = phanNhomEm(nhip.em.find((e) => e.sbd === sbd)!, nhip.ngay, nhip.homNay)
      expect([hs.nhomNhip, hs.chuoiDuGanNhat]).toEqual([dong.nhom, dong.chuoiDuGanNhat])
      expect([em.nhom, em.chuoiDuGanNhat, em.soNgayDu, em.soNgayQua]).toEqual([dong.nhom, dong.chuoiDuGanNhat, dong.soNgayDu, dong.soNgayQua])
      expect(typeof hs.coDoiPho).toBe('boolean')
    }
    const m = (await goiWorker(worker, env, '/gv/ho-so-thai-do', { sbd: 'M' }, true)) as KetQuaHoSoThaiDo
    expect(m.nhomNhip).toBe('cham')
    expect(m.ketLuan.nhan).toBe('luoi') // nhãn thái độ cũ: 4/13 ngày từ 01/10 — nay chỉ còn là lý do bằng số, nhãn chính là nhóm
    const l = (await goiWorker(worker, env, '/gv/ho-so-thai-do', { sbd: 'L' }, true)) as KetQuaHoSoThaiDo
    expect(l).toMatchObject({ nhomNhip: 'luoi', chuoiDuGanNhat: 3, coDoiPho: l.ketLuan.nhan === 'doi-pho' })
  })
})
