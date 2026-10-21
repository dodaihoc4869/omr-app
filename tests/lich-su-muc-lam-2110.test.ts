// @vitest-environment node
// MỨC LÀM 1–4 TRONG LỊCH SỬ LÀM CÂU (thầy 21/10) — chạy trên D1 THẬT (SQLite, lược đồ repo). Máy chủ chỉ xếp mức cho lượt có `raw_json.doc.dh = 1` (đồng hồ mới) và số từ/phần hợp lệ;
// bản học sinh/phụ huynh không mang mức của lượt ĐÚNG ở Mức 1–2 và tổng khớp đúng những gì em thấy.
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import type { KetQuaLichSuLamCau } from '../server/src/lich-su-lam-cau-kieu'
import { lichSuLamCauCuaEm } from '../server/src/lich-su-lam-cau'

type D = ReturnType<typeof taoD1That>
const em = (d: D) => {
  d.sql.prepare('INSERT INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run('S1', 'Trần An', '2009', '12', 'x')
  d.sql.prepare('INSERT INTO hoc_sinh (sbd, ho_ten, lop, ten_lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run('S1', 'Tên cũ', '12', '12 - Tinh Hoa', 'x')
}
let dem = 0
/** Một dòng sổ game; `doc` = raw_json.doc. Cột `giay` = giây đo của lượt. */
const dong = (d: D, qid: string, kq: number | null, giay: number | null, doc: Record<string, unknown> | null, raw: Record<string, unknown> = {}) => {
  const luc = new Date(Date.parse('2026-10-21T10:00:00Z') + dem * 60_000).toISOString()
  d.sql.prepare(`INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, raw_json) VALUES (?, 'S1', ?, 'game', 'P1', 1, ?, ?, ?, ?, ?)`)
    .run(`m${dem++}`, qid, kq, giay, luc, luc.slice(0, 10), JSON.stringify(doc ? { ...raw, doc } : raw))
}
const DOC = (t: number, p: 'I' | 'II' | 'III' = 'I', h = 0, dh: 1 | undefined = 1) => ({ t, h, p, ...(dh ? { dh } : {}) })
const goi = async (env: Env) => (await goiWorker(worker, env, '/gv/lich-su-lam-cau', { sbd: 'S1' }, true)) as KetQuaLichSuLamCau
/** qid → mức (hoặc undefined) của lượt trong `lan`. */
const mucCua = (r: KetQuaLichSuLamCau, qid: string) => r.lan.find((x) => x.qid === qid)?.mucLam

function dungDuLieu() {
  const d = taoD1That()
  em(d)
  d.sql.exec('CREATE TABLE IF NOT EXISTS omni_beta_cau (qid TEXT PRIMARY KEY, beta REAL NOT NULL, n INTEGER NOT NULL, cap_nhat_luc TEXT NOT NULL)')
  // T_đọc(20 từ, không hình) = 15; sàn nghĩ phần I = 6 ⇒ Mức 1 < 15 ≤ Mức 2 < 21 ≤ Mức 3/4.
  dong(d, 'V-I-1', 0, 10, DOC(20))            // sai, 10 s  ⇒ Mức 1
  dong(d, 'V-I-2', 1, 8, DOC(20))             // đúng, 8 s  ⇒ Mức 1 + ghi chú đúng-trước-khi-đọc (chỉ thầy)
  dong(d, 'V-I-3', 0, 18, DOC(20))            // sai, 18 s  ⇒ Mức 2
  dong(d, 'V-I-4', 1, 18, DOC(20))            // đúng, 18 s ⇒ Mức 2 (học sinh không thấy mức)
  dong(d, 'V-I-5', 0, 40, DOC(20))            // sai, 40 s, chưa có β ⇒ Mức 3
  dong(d, 'V-I-6', 1, 40, DOC(20))            // đúng, 40 s, β thật (thường 30 s ⇒ 0,8 × = 24) ⇒ Mức 4
  d.sql.prepare("INSERT INTO omni_beta_cau (qid, beta, n, cap_nhat_luc) VALUES ('V-I-6', ?, 12, 'x')").run(Math.log(30_000))
  dong(d, 'V-I-7', 0, 12, { t: 20, h: 0, p: 'I' })   // giây cũ (không dh) ⇒ KHÔNG xếp mức
  dong(d, 'V-I-8', 0, null, DOC(20))          // không có giây ⇒ không mức
  dong(d, 'V-I-9', 0, 30, { t: 20, h: 0, dh: 1 })     // thiếu phần ⇒ không mức
  dong(d, 'V-I-10', 0, 30, null, { ms: 30_000 })      // không có doc (lượt cũ có ms) ⇒ không mức
  return d
}

describe('lịch sử làm câu — Mức làm 1–4 (thầy)', () => {
  it('xếp đúng mức từng lượt từ kích thước đề + đồng hồ mới; β thật mới có Mức 4; giây cũ/không đo/thiếu phần không có mức', async () => {
    const d = dungDuLieu()
    const r = await goi(d.env as unknown as Env)
    expect(mucCua(r, 'V-I-1')).toMatchObject({ ma: 1, giay: 10, giayDoc: 15, sanNghi: 6 })
    expect(mucCua(r, 'V-I-1')!.ghiChu).toBeUndefined()
    expect(mucCua(r, 'V-I-2')).toMatchObject({ ma: 1, ghiChu: 'dung_truoc_doc' })
    expect(mucCua(r, 'V-I-3')).toMatchObject({ ma: 2 })
    expect(mucCua(r, 'V-I-4')).toMatchObject({ ma: 2 })
    expect(mucCua(r, 'V-I-5')).toMatchObject({ ma: 3 })
    expect(mucCua(r, 'V-I-5')!.thuong).toBeUndefined()
    expect(mucCua(r, 'V-I-6')).toMatchObject({ ma: 4, thuong: 30 })
    for (const q of ['V-I-7', 'V-I-8', 'V-I-9', 'V-I-10']) expect(mucCua(r, q), q).toBeUndefined()
  })

  it('tổng Mức làm (trường riêng `mucLam`, `tong` không đổi hình dạng): 6 lượt có mức, 4 chưa có số đo; sai khi làm vội 2 · sai dù đã nghĩ 1; 1 lượt đúng trước khi đọc; có β thật', async () => {
    const d = dungDuLieu()
    const r = await goi(d.env as unknown as Env)
    expect(Object.keys(r.tong).sort()).toEqual(['giayTb', 'soBoTrong', 'soCau', 'soCauSai', 'soDung', 'soLuot', 'soSai', 'tongGiay'])
    expect(r.mucLam).toMatchObject({ soDo: 6, chuaCoSoDo: 4, saiLamVoi: 2 + 0, saiDuNghi: 1, dungTruocDoc: 1, coBetaThat: true })
    expect(r.mucLam!.theoMuc.map((x) => [x.ma, x.luot, x.dung, x.sai])).toEqual([[1, 2, 1, 1], [2, 2, 1, 1], [3, 1, 0, 1], [4, 1, 1, 0]])
  })

  it('bản học sinh: lượt ĐÚNG ở Mức 1–2 không mang mức (chỉ còn số giây) và KHÔNG vào tổng; lượt sai và đúng Mức 3–4 giữ; không còn ghi chú riêng của thầy', async () => {
    const d = dungDuLieu()
    const r = await lichSuLamCauCuaEm(d.env as unknown as Env, 'S1', undefined, 'hoc-sinh') as KetQuaLichSuLamCau
    expect(r.ok).toBe(true)
    expect(mucCua(r, 'V-I-1')).toMatchObject({ ma: 1 })            // sai Mức 1: giữ (giải thích lượt sai)
    expect(mucCua(r, 'V-I-2')).toBeUndefined()                      // đúng Mức 1: ẩn
    expect(mucCua(r, 'V-I-3')).toMatchObject({ ma: 2 })            // sai Mức 2: giữ
    expect(mucCua(r, 'V-I-4')).toBeUndefined()                      // đúng Mức 2: ẩn
    expect(mucCua(r, 'V-I-6')).toMatchObject({ ma: 4 })            // đúng Mức 4: giữ
    expect(r.lan.find((x) => x.qid === 'V-I-2')!.giay).toBe(8)      // số giây vẫn hiện
    expect(r.lan.every((x) => x.mucLam?.ghiChu === undefined)).toBe(true)
    // tổng chỉ trên các lượt được xem: 4 lượt có mức (sai M1, sai M2, sai M3, đúng M4); 4 lượt không có số đo; 2 lượt ẩn KHÔNG tính là "chưa có số đo"
    expect(r.mucLam).toMatchObject({ soDo: 4, chuaCoSoDo: 4, saiLamVoi: 2, saiDuNghi: 1, dungTruocDoc: 0 })
    expect(r.mucLam!.theoMuc.map((x) => [x.ma, x.luot, x.dung, x.sai])).toEqual([[1, 1, 0, 1], [2, 1, 0, 1], [3, 1, 0, 1], [4, 1, 1, 0]])
  })

  it('em chưa có lượt nào đo bằng đồng hồ mới: không lượt nào có mức, tổng toàn "chưa có số đo", KHÔNG đọc β (không thêm lệnh D1)', async () => {
    const d = taoD1That()
    em(d)
    dong(d, 'V-I-1', 0, 12, { t: 20, h: 0, p: 'I' })
    dong(d, 'V-I-2', 1, null, null, { ms: 20_000 })
    const r = await goi(d.env as unknown as Env)
    expect(r.lan.every((x) => x.mucLam === undefined)).toBe(true)
    expect(r.mucLam).toMatchObject({ soDo: 0, chuaCoSoDo: 2, coBetaThat: false })
    expect(r.lan).toHaveLength(2)
  })

  it('bảng β thiếu (D1 cũ) hoặc đọc lỗi: lượt vẫn có Mức 1–3, chỉ không có Mức 4', async () => {
    const d = taoD1That()
    em(d)
    dong(d, 'V-I-6', 1, 40, DOC(20)) // không tạo omni_beta_cau
    const r = await goi(d.env as unknown as Env)
    expect(r.ok).toBe(true)
    expect(mucCua(r, 'V-I-6')).toMatchObject({ ma: 3 })
  })

  it('có hình và câu chỉ là ảnh: T_đọc cộng 10 s; 40 từ + hình ⇒ T_đọc "≈" và Mức 1 chỉ khi giây < 0,5 × T_đọc', async () => {
    const d = taoD1That()
    em(d)
    dong(d, 'H-I-1', 0, 24, DOC(20, 'I', 1))   // T_đọc 25 ⇒ Mức 1
    dong(d, 'H-I-2', 0, 25, DOC(20, 'I', 1))   // ⇒ Mức 2
    dong(d, 'A-I-1', 0, 20, DOC(40, 'I', 1))   // ảnh: T_đọc ≈ 32; 20 ≥ 16 ⇒ KHÔNG Mức 1 ⇒ Mức 2
    dong(d, 'A-I-2', 0, 15, DOC(40, 'I', 1))   // 15 < 16 ⇒ Mức 1
    const r = await goi(d.env as unknown as Env)
    expect(mucCua(r, 'H-I-1')).toMatchObject({ ma: 1, giayDoc: 25 })
    expect(mucCua(r, 'H-I-2')).toMatchObject({ ma: 2 })
    expect(mucCua(r, 'A-I-1')).toMatchObject({ ma: 2, xapXi: true, giayDoc: 32 })
    expect(mucCua(r, 'A-I-2')).toMatchObject({ ma: 1, xapXi: true })
  })
})

describe('lịch sử làm câu — chi phí β của Mức làm', () => {
  /** Bọc D1: ghi lại các câu SQL đọc `omni_beta_cau`. */
  const theoDoiBeta = (env: Env) => {
    const goc = env.DB as unknown as { prepare(q: string): unknown }
    const sql: string[] = []
    const DB = new Proxy(goc, { get: (t, k, r) => (k === 'prepare' ? (q: string) => { if (/FROM omni_beta_cau/i.test(q)) sql.push(q); return t.prepare(q) } : Reflect.get(t, k, r)) })
    return { env: { ...env, DB } as unknown as Env, sql }
  }
  it('đúng MỘT truy vấn β khi có lượt đủ điều kiện xếp mức; KHÔNG truy vấn nào khi chưa lượt nào có số đo mới', async () => {
    const d = taoD1That()
    em(d)
    d.sql.exec('CREATE TABLE IF NOT EXISTS omni_beta_cau (qid TEXT PRIMARY KEY, beta REAL NOT NULL, n INTEGER NOT NULL, cap_nhat_luc TEXT NOT NULL)')
    dong(d, 'V-I-1', 0, 12, { t: 20, h: 0, p: 'I' }) // đồng hồ cũ
    dong(d, 'V-I-2', 0, null, DOC(20))                 // không có giây
    const cu = theoDoiBeta(d.env as unknown as Env)
    await lichSuLamCauCuaEm(cu.env, 'S1', undefined, 'thay')
    expect(cu.sql).toHaveLength(0)
    dong(d, 'V-I-3', 0, 40, DOC(20))
    dong(d, 'V-I-4', 0, 18, DOC(20))
    const moi = theoDoiBeta(d.env as unknown as Env)
    const r = await lichSuLamCauCuaEm(moi.env, 'S1', undefined, 'thay')
    expect(moi.sql).toHaveLength(1)
    expect(r.ok).toBe(true)
  })
})
