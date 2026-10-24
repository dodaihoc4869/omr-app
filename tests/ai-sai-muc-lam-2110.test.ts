// @vitest-environment node
// MỨC LÀM 1–4 TRÊN TỜ CHIẾU (thầy 21/10: "hiển thị đầy đủ các mức 1 tới 4"; "bấm vào chi tiết là phải hiện đủ trên màn chiếu") — D1 THẬT (SQLite, lược đồ repo).
//   · `/gv/ai-sai-cau`: mỗi lượt sai có `mucLam` khi giây ĐO THẬT bằng đồng hồ mới (raw_json.doc.dh = 1); lọc theo danh sách lớp `sbds` NGAY trong truy vấn (trước khi cắt 300 lượt);
//     β đọc đúng một lần khi có lượt đủ điều kiện, không đọc khi không có.
//   · `/gv/ho-so-len-bang`: mỗi lần làm CHÍNH câu đang chiếu mang `mucLam` (kể cả lượt đúng — không giấu gì trên màn chiếu).
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'
import { gvHoSoLenBang } from '../server/src/ho-so-em-chieu'
import { aiSaiCau } from '../server/src/ai-sai-cau'
import type { Env } from '../server/src/kieu'

type D = ReturnType<typeof taoD1That>
const T0 = Date.parse('2026-10-21T10:00:00Z')
const DOC = (t: number, p: 'I' | 'II' | 'III' = 'I', h = 0, dh: 1 | undefined = 1) => ({ t, h, p, ...(dh ? { dh } : {}) })
let dem = 0
/** Một dòng sổ (game); `doc` = raw_json.doc. */
function sk(d: D, sbd: string, qid: string, kq: number | null, giay: number | null, doc: Record<string, unknown> | null, luc = new Date(T0 + dem * 1000).toISOString(), raw: Record<string, unknown> = {}) {
  d.sql.prepare(`INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, raw_json) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(`k${dem++}`, sbd, qid, 'game', 'P1', 1, kq, giay, luc, luc.slice(0, 10), JSON.stringify(doc ? { ...raw, doc } : raw))
}
function dung() {
  const d = taoD1That()
  for (const [sbd, ten] of [['S1', 'Trần An'], ['S2', 'Lê Bình'], ['S3', 'Phạm Chi']]) d.sql.prepare('INSERT INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run(sbd, ten, '2009', '12', 'x')
  d.sql.exec('CREATE TABLE IF NOT EXISTS omni_beta_cau (qid TEXT PRIMARY KEY, beta REAL NOT NULL, n INTEGER NOT NULL, cap_nhat_luc TEXT NOT NULL)')
  return d
}
/** Bọc D1: ghi lại các câu SQL có chứa chuỗi `mau` (giữ nguyên mọi hành vi khác). */
function theoDoi(d: D, mau: RegExp) {
  const goc = d.env.DB as unknown as { prepare(q: string): unknown }
  const sql: string[] = []
  const DB = new Proxy(goc, { get: (t, k, r) => (k === 'prepare' ? (q: string) => { if (mau.test(q)) sql.push(q); return t.prepare(q) } : Reflect.get(t, k, r)) })
  return { env: { ...d.env, DB } as unknown as Env, sql }
}
const goi = async (env: Env, than: Record<string, unknown>) => goiWorker(worker, env, '/gv/ai-sai-cau', than, true)

describe('/gv/ai-sai-cau — Mức làm từng lượt sai', () => {
  it('xếp mức cho lượt có đồng hồ mới (T_đọc 20 từ = 15 s, sàn nghĩ I = 6 s); β thật ⇒ Mức 4 kèm thời gian thường; giây cũ / ước tính / không có kích thước đề ⇒ không mức', async () => {
    const d = dung()
    sk(d, 'S1', 'Q1', 0, 10, DOC(20))                       // Mức 1
    sk(d, 'S2', 'Q1', 0, 18, DOC(20))                       // Mức 2
    sk(d, 'S3', 'Q1', 0, 40, DOC(20))                       // β thật: thường 30 s ⇒ 0,8 × = 24 ⇒ Mức 4
    d.sql.prepare("INSERT INTO omni_beta_cau (qid, beta, n, cap_nhat_luc) VALUES ('Q1', ?, 12, 'x')").run(Math.log(30_000))
    sk(d, 'S1', 'Q1', 0, 12, { t: 20, h: 0, p: 'I' })       // giây cũ (không dh) ⇒ không mức
    sk(d, 'S2', 'Q1', 0, 30, null, undefined, { ms: 30_000 }) // không có doc ⇒ không mức
    const r = await goi(d.env as unknown as Env, { qids: ['Q1'] })
    expect(r.ok).toBe(true)
    const muc = (sbd: string, giay: number) => (r.ds as { sbd: string; giay: number; mucLam?: Record<string, unknown> }[]).find((x) => x.sbd === sbd && x.giay === giay)?.mucLam
    expect(muc('S1', 10)).toMatchObject({ ma: 1, giay: 10, giayDoc: 15, sanNghi: 6, thuong: 30 })
    expect(muc('S2', 18)).toMatchObject({ ma: 2 })
    expect(muc('S3', 40)).toMatchObject({ ma: 4, thuong: 30 })
    expect(muc('S1', 12)).toBeUndefined()
    expect(muc('S2', 30)).toBeUndefined()
  })

  it('lọc theo lớp `sbds` NGAY trong truy vấn: 305 lượt mới của em lớp khác không đẩy lượt (cũ hơn) của em lớp này ra khỏi 300 lượt; vắng `sbds` ⇒ mọi em như cũ', async () => {
    const d = dung()
    sk(d, 'S1', 'Q1', 0, 10, DOC(20), '2026-10-01T00:00:00Z')
    for (let i = 0; i < 305; i++) sk(d, 'S2', 'Q1', 0, 20, DOC(20), new Date(T0 + 60_000 + i * 1000).toISOString())
    const tatCa = await goi(d.env as unknown as Env, { qids: ['Q1'] })
    expect(tatCa.conNua).toBe(true)
    expect((tatCa.ds as { sbd: string }[]).some((x) => x.sbd === 'S1')).toBe(false) // cũ nhất bị cắt: đúng vấn đề lọc phía khách sẽ gặp
    const lop = await goi(d.env as unknown as Env, { qids: ['Q1'], sbds: ['S1', 'S3'] })
    expect(lop.conNua).toBe(false)
    expect((lop.ds as { sbd: string }[]).map((x) => x.sbd)).toEqual(['S1'])
    expect(lop.soEm).toBe(1)
    // danh sách lớp rác (không chuỗi / quá dài) bị bỏ ⇒ coi như không lọc
    const rac = await goi(d.env as unknown as Env, { qids: ['Q1'], sbds: ['', 'X'.repeat(41)] })
    expect(rac.conNua).toBe(true)
  })

  it('β: đúng MỘT truy vấn khi có lượt đủ điều kiện (cùng đợt các lượt đọc khác), KHÔNG truy vấn nào khi chưa lượt nào có số đo mới', async () => {
    const d = dung()
    sk(d, 'S1', 'Q1', 0, 10, { t: 20, h: 0, p: 'I' }) // đồng hồ cũ
    const cu = theoDoi(d, /FROM omni_beta_cau/i)
    expect((await aiSaiCau(cu.env, { qids: ['Q1'] })).ok).toBe(true) // gọi thẳng lõi: đường Worker bọc lại D1 nên bộ đếm không thấy
    expect(cu.sql).toHaveLength(0)
    sk(d, 'S2', 'Q1', 0, 18, DOC(20))
    const moi = theoDoi(d, /FROM omni_beta_cau/i)
    expect(((await aiSaiCau(moi.env, { qids: ['Q1'] })).ds as { mucLam?: unknown }[]).filter((x) => x.mucLam)).toHaveLength(1)
    expect(moi.sql).toHaveLength(1)
  })
})

describe('/gv/ho-so-len-bang — Mức làm từng lần làm câu đang chiếu', () => {
  it('mỗi lần làm có `mucLam` (kể cả lượt ĐÚNG ở Mức 1 — kèm ghi chú đúng-trước-khi-đọc, hiện đủ cho cả lớp); lượt không có số đo mới không có mức', async () => {
    const d = dung()
    d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','Trần An','12','x')")
    sk(d, 'S1', 'Q1', 0, 10, DOC(20), '2026-10-20T01:00:00Z')            // sai, Mức 1
    sk(d, 'S1', 'Q1', 1, 3, DOC(20), '2026-10-20T02:00:00Z')             // ĐÚNG, gặp lần 2 (24/10: T_đọc × 0,38 = 6 s) ⇒ Mức 1 đúng = «Thuộc»
    sk(d, 'S1', 'Q1', 0, 40, DOC(20), '2026-10-20T03:00:00Z')            // sai, Mức 3 (chưa có β)
    sk(d, 'S1', 'Q1', 0, 50, { t: 20, h: 0, p: 'I' }, '2026-10-20T04:00:00Z') // đồng hồ cũ ⇒ không mức
    const r = await gvHoSoLenBang(d.env as unknown as Env, { sbd: 'S1', qid: 'Q1' }, T0)
    const lan = (r.cauNay as { lan: { dung: boolean; giay: number | null; mucLam?: Record<string, unknown> }[] }).lan
    expect(lan.map((x) => x.mucLam?.ma)).toEqual([1, 1, 3, undefined])
    expect(lan[1]!.mucLam).toMatchObject({ ghiChu: 'dung_truoc_doc', thuoc: true, giayDoc: 6, heSoLap: 0.38 })
    expect(lan[0]!.mucLam).toMatchObject({ giayDoc: 15 })
    expect(lan[0]!.mucLam!.heSoLap).toBeUndefined()
    expect(lan[0]!.mucLam!.ghiChu).toBeUndefined()
    expect(lan[2]!.mucLam!.thuong).toBeUndefined()
  })

  it('Cách làm bài 14 ngày: đếm theo Mức làm (đúng/sai), mẫu số là mọi lượt có kết quả trong 14 ngày; lượt ngoài 14 ngày / đồng hồ cũ không vào mức', async () => {
    const d = dung()
    d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','Trần An','12','x')")
    sk(d, 'S1', 'Q1', 0, 10, DOC(20), '2026-10-20T01:00:00Z')               // sai, Mức 1
    sk(d, 'S1', 'Q2', 1, 8, DOC(20), '2026-10-20T02:00:00Z')                // đúng, Mức 1 (đúng trước khi đọc)
    sk(d, 'S1', 'Q3', 0, 18, DOC(20), '2026-10-20T03:00:00Z')               // sai, Mức 2
    sk(d, 'S1', 'Q4', 0, 40, DOC(20), '2026-10-20T04:00:00Z')               // sai, Mức 3
    sk(d, 'S1', 'Q5', 1, 50, { t: 20, h: 0, p: 'I' }, '2026-10-20T05:00:00Z') // đồng hồ cũ ⇒ chưa có số đo
    sk(d, 'S1', 'Q6', 0, 12, null, '2026-10-20T06:00:00Z', {})              // không có doc ⇒ chưa có số đo
    sk(d, 'S1', 'Q7', 0, 10, DOC(20), '2026-08-01T01:00:00Z')               // quá 14 ngày ⇒ không tính
    const r = await gvHoSoLenBang(d.env as unknown as Env, { sbd: 'S1', qid: 'Q1' }, T0)
    const c = r.cachLam14 as { soDo: number; chuaCoSoDo: number; theoMuc: { ma: number; luot: number; dung: number; sai: number }[]; saiLamVoi: number; saiDuNghi: number; dungTruocDoc: number; coBetaThat: boolean }
    expect(c).toMatchObject({ soDo: 4, chuaCoSoDo: 2, saiLamVoi: 2, saiDuNghi: 1, dungTruocDoc: 1, coBetaThat: false })
    expect(c.theoMuc.map((x) => [x.ma, x.luot, x.dung, x.sai])).toEqual([[1, 2, 1, 1], [2, 1, 0, 1], [3, 1, 0, 1], [4, 0, 0, 0]])
  })

  it('β thật của câu ⇒ Mức 4 + thời gian thường; truy vấn β đúng một lần, và 0 lần khi không lượt nào đủ điều kiện', async () => {
    const d = dung()
    d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','Trần An','12','x')")
    sk(d, 'S1', 'Q1', 0, 10, { t: 20, h: 0, p: 'I' })
    const cu = theoDoi(d, /FROM omni_beta_cau/i)
    await gvHoSoLenBang(cu.env, { sbd: 'S1', qid: 'Q1' }, T0)
    expect(cu.sql).toHaveLength(0)
    d.sql.prepare("INSERT INTO omni_beta_cau (qid, beta, n, cap_nhat_luc) VALUES ('Q1', ?, 12, 'x')").run(Math.log(30_000))
    sk(d, 'S1', 'Q1', 0, 40, DOC(20))
    const moi = theoDoi(d, /FROM omni_beta_cau/i)
    const r = await gvHoSoLenBang(moi.env, { sbd: 'S1', qid: 'Q1' }, T0)
    expect(moi.sql).toHaveLength(1)
    const lan = (r.cauNay as { lan: { mucLam?: { ma: number; thuong?: number } }[] }).lan
    expect(lan.map((x) => x.mucLam?.ma)).toEqual([undefined, 4])
    expect(lan[1]!.mucLam!.thuong).toBe(30)
  })
})
