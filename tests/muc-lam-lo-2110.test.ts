// @vitest-environment node
// MỨC LÀM THEO LÔ EM cho bảng điểm danh (thầy 20/10, bản vẽ 03) — chạy trên D1 THẬT (SQLite, lược đồ repo).
// ĐIỀU QUAN TRỌNG NHẤT: thầy bấm em ở bảng điểm danh ra Hồ sơ làm bài phải thấy ĐÚNG số trên dòng (một con số, thầy 12/10). Nên số của lô được ghim bằng số tính từ chính `lichSuLamCauCuaEm`.
import { beforeEach, describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { lichSuLamCauCuaEm } from '../server/src/lich-su-lam-cau'
import { gvHoSoLenBang } from '../server/src/ho-so-em-chieu'
import type { KetQuaLichSuLamCau } from '../server/src/lich-su-lam-cau-kieu'
import { gvMucLamLo, mucLamCacEm, xoaDemMucLamLo, TOI_DA_EM_MUC_LAM_LO, type MucLamEmLo } from '../server/src/muc-lam-lo'
import { SQL_CAU_DOC_GIAY } from '../server/src/cau-doc-giay'

type D = ReturnType<typeof taoD1That>
const BAY_GIO = Date.parse('2026-10-21T08:00:00Z')
let dem = 0
beforeEach(() => { xoaDemMucLamLo(); dem = 0 })

const em = (d: D, sbd: string) => {
  d.sql.prepare('INSERT INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run(sbd, `Em ${sbd}`, '2009', '12', 'x')
  d.sql.prepare('INSERT INTO hoc_sinh (sbd, ho_ten, lop, ten_lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run(sbd, `Em ${sbd}`, '12', '12 - Tinh Hoa', 'x')
}
interface Tuy { nguon?: string; ma?: string; ngay?: string; visibility?: string | null; purpose?: string | null }
/** Một dòng sổ; `giay` = cột giây; `doc` = raw_json.doc. */
const dong = (d: D, sbd: string, qid: string, kq: number | null, giay: number | null, doc: Record<string, unknown> | null, raw: Record<string, unknown> = {}, t: Tuy = {}) => {
  const luc = new Date(Date.parse('2026-10-21T01:00:00Z') + dem * 60_000).toISOString()
  d.sql.prepare(`INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, raw_json, visibility, purpose) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)`)
    .run(`m${dem++}`, sbd, qid, t.nguon ?? 'game', t.ma ?? 'P1', kq, giay, luc, t.ngay ?? luc.slice(0, 10), JSON.stringify(doc ? { ...raw, doc } : raw), t.visibility ?? null, t.purpose ?? null)
}
const DOC = (t: number, p: 'I' | 'II' | 'III' = 'I', h = 0) => ({ t, h, p, dh: 1 })

function dungDuLieu() {
  const d = taoD1That()
  em(d, 'S1'); em(d, 'S2')
  d.sql.exec('CREATE TABLE IF NOT EXISTS omni_beta_cau (qid TEXT PRIMARY KEY, beta REAL NOT NULL, n INTEGER NOT NULL, cap_nhat_luc TEXT NOT NULL)')
  for (const s of SQL_CAU_DOC_GIAY) d.sql.exec(s)
  // Kích thước đề tính sẵn cho câu của lượt CŨ (không có `doc`): 20 từ, không hình, phần I ⇒ T_đọc = 15 s.
  d.sql.prepare("INSERT INTO cau_doc_giay (qid, so_tu, co_hinh, phan, tinh_luc) VALUES ('V-I-7', 20, 0, 'I', 'x')").run()
  d.sql.prepare("INSERT INTO omni_beta_cau (qid, beta, n, cap_nhat_luc) VALUES ('V-I-6', ?, 12, 'x')").run(Math.log(30_000))
  // S1: đủ loại lượt
  dong(d, 'S1', 'V-I-1', 0, 10, DOC(20))              // Mức 1
  dong(d, 'S1', 'V-I-2', 1, 8, DOC(20))               // Mức 1 (đúng trước khi đọc)
  dong(d, 'S1', 'V-I-3', 0, 18, DOC(20))              // Mức 2
  dong(d, 'S1', 'V-I-5', 0, 40, DOC(20))              // Mức 3
  dong(d, 'S1', 'V-I-6', 1, 40, DOC(20))              // Mức 4 (β thật)
  dong(d, 'S1', 'V-I-7', 0, 12, { t: 20, h: 0, p: 'I' }) // giây CŨ + kích thước đề tính sẵn ⇒ ≈ Mức 1 (ước tính)
  dong(d, 'S1', 'V-I-8', 0, null, DOC(20))            // không giây ⇒ chưa có số đo
  dong(d, 'S1', 'V-I-9', 0, 30, null, { ms: 30_000 }) // lượt cũ có ms nhưng câu chưa có kích thước ⇒ chưa có số đo
  dong(d, 'S1', 'T-I-1', 0, 30, null, {}, { nguon: 'thi', ma: 'CA1' }) // ca thi: không xếp mức
  // Ngoài cửa sổ 14 ngày / lượt bị loại như Hồ sơ
  dong(d, 'S1', 'V-I-1', 0, 10, DOC(20), {}, { ngay: '2026-10-01' })
  dong(d, 'S1', 'V-I-1', 0, 10, DOC(20), {}, { visibility: 'embargoed' })
  dong(d, 'S1', 'V-I-1', 0, 10, DOC(20), {}, { purpose: 'xem_loi_giai' })
  // S2: chỉ hai lượt
  dong(d, 'S2', 'V-I-3', 1, 18, DOC(20))
  dong(d, 'S2', 'V-I-5', 1, 40, DOC(20))
  return d
}

/** Số của Hồ sơ cho cùng em + cửa sổ: đếm theo mức từ `lan` của `lichSuLamCauCuaEm` (đúng hàm Hồ sơ dùng). */
async function soTuHoSo(env: Env, sbd: string, tu: string, den: string): Promise<MucLamEmLo> {
  const r = (await lichSuLamCauCuaEm(env, sbd, undefined, 'thay')) as KetQuaLichSuLamCau
  expect(r.ok).toBe(true)
  const trong = r.lan.filter((l) => l.ngay >= tu && l.ngay <= den)
  const m: [number, number, number, number] = [0, 0, 0, 0]
  let soUoc = 0
  for (const l of trong) if (l.mucLam) { m[l.mucLam.ma - 1]!++; if (l.mucLam.uocTinh) soUoc++ }
  const soDo = m[0] + m[1] + m[2] + m[3]
  return { soDo, chuaCoSoDo: trong.length - soDo, m, soUocTinh: soUoc }
}

/** «Cách làm bài 14 ngày» của chi tiết em lên bảng (tờ chiếu) — cùng nhãn «14 ngày» với dòng điểm danh ⇒ phải CÙNG số. */
async function cachLam14(env: Env, sbd: string, qid: string): Promise<MucLamEm14> {
  const r = (await gvHoSoLenBang(env, { sbd, qid }, BAY_GIO)) as unknown as { ok: boolean; cachLam14?: { soDo: number; chuaCoSoDo: number; soUocTinh: number; theoMuc: { luot: number }[] } }
  expect(r.ok).toBe(true)
  const c = r.cachLam14!
  expect(c).toBeTruthy()
  return { soDo: c.soDo, chuaCoSoDo: c.chuaCoSoDo, m: [c.theoMuc[0]!.luot, c.theoMuc[1]!.luot, c.theoMuc[2]!.luot, c.theoMuc[3]!.luot], soUocTinh: c.soUocTinh }
}
type MucLamEm14 = MucLamEmLo


/** Bốn khoá Mức làm 1–4 (khuôn cũ). Khoá treo máy 22/10 (`soTreo`/`soCoTinh`/`soChuaDoTreo`) kiểm riêng ở test cuối. */
const bon = (x: { soDo: number; chuaCoSoDo: number; m: number[]; soUocTinh: number } | undefined) => x && { soDo: x.soDo, chuaCoSoDo: x.chuaCoSoDo, m: x.m, soUocTinh: x.soUocTinh }

describe('mức làm theo lô em (bảng điểm danh)', () => {
  it('CÙNG SỐ với «Cách làm bài 14 ngày» của tờ chiếu (chi tiết em lên bảng) — kể cả khi em có lượt BỎ TRỐNG có giây (cả hai KHÔNG đếm)', async () => {
    const d = dungDuLieu()
    const env = d.env as unknown as Env
    dong(d, 'S1', 'V-I-1', null, 12, DOC(20)) // lượt bỏ trống (ket_qua NULL) có giây: không phải lượt làm câu
    const kq = await gvMucLamLo(env, { sbds: ['S1', 'S2'] }, BAY_GIO)
    expect(kq.ok).toBe(true)
    if (!kq.ok) return
    expect(bon(kq.em.S1)).toEqual(await cachLam14(env, 'S1', 'V-I-1'))
    expect(bon(kq.em.S2)).toEqual(await cachLam14(env, 'S2', 'V-I-3'))
    expect(bon(kq.em.S1)).toEqual({ soDo: 6, chuaCoSoDo: 3, m: [3, 1, 1, 1], soUocTinh: 1 }) // lượt bỏ trống không làm đổi số
  })

  it('CÙNG HÀM MỨC LÀM với Hồ sơ làm bài: em không có lượt bỏ trống ⇒ số của lô = số tính từ `lichSuLamCauCuaEm` trong cùng cửa sổ (kể cả lượt ≈ giây cũ, ca thi, lượt bị loại)', async () => {
    const d = dungDuLieu()
    const env = d.env as unknown as Env
    const kq = await gvMucLamLo(env, { sbds: ['S1', 'S2'] }, BAY_GIO)
    expect(kq.ok).toBe(true)
    if (!kq.ok) return
    expect(kq.den).toBe('2026-10-21')
    expect(kq.tu).toBe('2026-10-08') // 14 ngày: 08/10 → 21/10
    for (const s of ['S1', 'S2']) expect(bon(kq.em[s]), s).toEqual(await soTuHoSo(env, s, kq.tu, kq.den))
    // Chốt cả số cụ thể (không chỉ khớp nhau): S1 có Mức 1 ×3 (gồm 1 lượt ≈), 2 ×1, 3 ×1, 4 ×1; 3 lượt chưa có số đo (không giây · không kích thước · ca thi)
    expect(bon(kq.em.S1)).toEqual({ soDo: 6, chuaCoSoDo: 3, m: [3, 1, 1, 1], soUocTinh: 1 })
    expect(bon(kq.em.S2)).toEqual({ soDo: 2, chuaCoSoDo: 0, m: [0, 1, 1, 0], soUocTinh: 0 })
  })

  it('em không có lượt trong cửa sổ ⇒ toàn 0 (vẫn có mặt trong kết quả); `den` quá hạn / sai ⇒ về hôm nay; trùng SBD gộp một', async () => {
    const d = dungDuLieu()
    em(d, 'S3')
    const env = d.env as unknown as Env
    const a = await gvMucLamLo(env, { sbds: ['S3', 'S3', ' ', 'S1'], den: '2099-01-01' }, BAY_GIO)
    expect(a.ok && a.den).toBe('2026-10-21')
    expect(bon(a.ok ? a.em.S3 : undefined)).toEqual({ soDo: 0, chuaCoSoDo: 0, m: [0, 0, 0, 0], soUocTinh: 0 })
    // cửa sổ lùi về 10/10 (tới 10/10 chỉ còn lượt 01/10 ngoài khung ⇒ S1 rỗng)
    const b = await gvMucLamLo(env, { sbds: ['S1'], den: '2026-10-10' }, BAY_GIO)
    expect(b.ok && b.tu).toBe('2026-09-27')
    expect(bon(b.ok ? b.em.S1 : undefined)).toEqual({ soDo: 1, chuaCoSoDo: 0, m: [1, 0, 0, 0], soUocTinh: 0 })
    // Treo máy (22/10): dữ liệu mẫu chưa có số đo treo ⇒ 0 treo, mọi lượt có mức đều "chưa đo treo máy"
    expect(b.ok && [b.em.S1!.soTreo, b.em.S1!.soCoTinh, b.em.S1!.soChuaDoTreo]).toEqual([0, 0, 1])
  })

  it('thiếu danh sách em ⇒ lỗi nói thật; quá 40 em ⇒ chỉ lấy 40 đầu', async () => {
    const d = dungDuLieu()
    const env = d.env as unknown as Env
    expect(await gvMucLamLo(env, { sbds: [] }, BAY_GIO)).toEqual({ ok: false, error: 'Thiếu danh sách em.' })
    expect(await gvMucLamLo(env, {}, BAY_GIO)).toMatchObject({ ok: false })
    const nhieu = Array.from({ length: 55 }, (_, i) => `E${i}`)
    const r = await gvMucLamLo(env, { sbds: nhieu }, BAY_GIO)
    expect(r.ok && Object.keys(r.em).length).toBe(TOI_DA_EM_MUC_LAM_LO)
  })

  it('đệm 5 phút theo em: lần hai không đọc lại sổ; sau 5 phút đọc lại; chỉ em CHƯA có trong đệm mới đọc', async () => {
    const d = dungDuLieu()
    const env = d.env as unknown as Env
    let soDoc = 0
    const goc = env.DB.prepare.bind(env.DB)
    ;(env.DB as { prepare: unknown }).prepare = (sql: string) => { if (/FROM su_kien_hoc s/.test(sql)) soDoc++; return goc(sql) }
    await gvMucLamLo(env, { sbds: ['S1'] }, BAY_GIO)
    expect(soDoc).toBe(1)
    await gvMucLamLo(env, { sbds: ['S1'] }, BAY_GIO + 60_000)
    expect(soDoc).toBe(1)
    await gvMucLamLo(env, { sbds: ['S1', 'S2'] }, BAY_GIO + 61_000) // chỉ S2 mới
    expect(soDoc).toBe(2)
    await gvMucLamLo(env, { sbds: ['S1'] }, BAY_GIO + 6 * 60_000)
    expect(soDoc).toBe(3)
  })

  it('đường lệnh thầy `/gv/muc-lam-lo` chạy qua cổng thầy (trả `ok` + số của từng em); không có mã thầy ⇒ bị chặn', async () => {
    const d = dungDuLieu()
    const r = (await goiWorker(worker, d.env as unknown as Env, '/gv/muc-lam-lo', { sbds: ['S2'] }, true)) as { ok: boolean; em: Record<string, MucLamEmLo> }
    expect(r.ok).toBe(true)
    expect(r.em.S2!.soDo).toBe(2)
    const khong = await goiWorker(worker, d.env as unknown as Env, '/gv/muc-lam-lo', { sbds: ['S2'] }, false)
    expect(JSON.stringify(khong)).not.toContain('"soDo"')
  })

  it('đọc sổ lỗi ⇒ lệnh trả lỗi (không ném); `mucLamCacEm` ném để nơi gọi bắt', async () => {
    const d = dungDuLieu()
    const env = d.env as unknown as Env
    ;(env.DB as { prepare: unknown }).prepare = () => { throw new Error('D1 hỏng') }
    expect(await gvMucLamLo(env, { sbds: ['S1'] }, BAY_GIO)).toEqual({ ok: false, error: 'Không đọc được sổ học của các em.' })
    await expect(mucLamCacEm(env, ['S1'], '2026-10-08', '2026-10-21')).rejects.toThrow()
  })
  it('6 MỨC (thầy duyệt 22/10): lượt treo KHÔNG đếm trong `m` ⇒ soDo = Σm + soTreo + soCoTinh; saiLamVoi/saiDuNghi bỏ lượt treo; ≥ 3 lượt treo một ngày ⇒ Mức 6; CÙNG SỐ với `cachLam14` (tờ chiếu gộp Mức 6 vào Treo)', async () => {
    const d = dungDuLieu()
    em(d, 'S4'); em(d, 'S5')
    const env = d.env as unknown as Env
    const DO = (l: number, a = 0) => ({ ...DOC(20), v: 60, a, l, n: 0, w: 0 })
    // S4: Mức 1 sai (đã đo, không treo) · Mức 3 sai (đã đo) · MỘT lượt treo sai (giây 40 ⇒ lẽ ra Mức 3) · Mức 2 sai chưa đo treo (DOC thường)
    dong(d, 'S4', 'V-I-1', 0, 10, DO(5))
    dong(d, 'S4', 'V-I-5', 0, 40, DO(20))
    dong(d, 'S4', 'V-I-3', 0, 40, DO(620))
    dong(d, 'S4', 'V-I-3', 0, 18, DOC(20))
    // S5: BA lượt treo cùng ngày ⇒ cả ba Mức 6 (màn thầy); một lượt Mức 1 đúng
    dong(d, 'S5', 'V-I-1', 0, 30, DO(400))
    dong(d, 'S5', 'V-I-3', 0, 30, DO(500))
    dong(d, 'S5', 'V-I-5', 1, 30, DO(0, 700))
    dong(d, 'S5', 'V-I-1', 1, 8, DO(3))
    const kq = await gvMucLamLo(env, { sbds: ['S4', 'S5'] }, BAY_GIO)
    expect(kq.ok).toBe(true)
    if (!kq.ok) return
    const a = kq.em.S4!, b = kq.em.S5!
    expect(a).toMatchObject({ soDo: 4, m: [1, 1, 1, 0], soTreo: 1, soCoTinh: 0, soChuaDoTreo: 1, saiLamVoi: 2, saiDuNghi: 1 })
    expect(b).toMatchObject({ soDo: 4, m: [1, 0, 0, 0], soTreo: 0, soCoTinh: 3, soChuaDoTreo: 0, saiLamVoi: 0, saiDuNghi: 0 })
    for (const x of [a, b]) expect(x.m.reduce((p, q) => p + q, 0) + x.soTreo + x.soCoTinh).toBe(x.soDo)
    // Cùng số với «Cách làm bài 14 ngày» của chi tiết em lên bảng: bốn dòng + sai vội/dù nghĩ bằng nhau; treo của lô (5 + 6) = treo công khai của tờ
    for (const [sbd, x] of [['S4', a], ['S5', b]] as const) {
      const r = (await gvHoSoLenBang(env, { sbd, qid: 'V-I-1' }, BAY_GIO)) as unknown as { cachLam14: { soDo: number; theoMuc: { luot: number }[]; saiLamVoi: number; saiDuNghi: number; soTreo: number; soCoTinh: number } }
      const c = r.cachLam14
      expect(c.theoMuc.map((t) => t.luot), sbd).toEqual(x.m)
      expect([c.saiLamVoi, c.saiDuNghi, c.soDo], sbd).toEqual([x.saiLamVoi, x.saiDuNghi, x.soDo])
      expect([c.soTreo, c.soCoTinh], sbd).toEqual([x.soTreo + x.soCoTinh, 0])
    }
  })
})
