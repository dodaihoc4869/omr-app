// @vitest-environment node
// ĐO LẠI LƯỢT CŨ (thầy 21/10: "phải tìm cách đo lại hết") — D1 THẬT (SQLite, lược đồ repo). Lượt không có `raw_json.doc` (trước khi máy em nạp đồng hồ mới) vẫn xếp được Mức làm khi
//   · có giây CŨ (cột `giay`, `raw_json.ms`, ca thi) ⇒ `uocTinh: 'cu'`; hoặc giây ƯỚC TÍNH (mốc trả lời của lượt chơi game — `giayUocTinhGame`) ⇒ `uocTinh: 'uoc'`. KHÔNG ước tính từ khoảng cách giữa các dòng sổ (ôn lại / tự luyện / BTVN lỡ nộp cả lô cùng lúc);
//   · VÀ câu có kích thước đề trong bảng tính sẵn `cau_doc_giay` (cron `dongBoCauDocGiay`, tính bằng đúng `noiDungTuCauGoc` trên câu rút gọn).
// Luật: không bao giờ Mức làm 4 (giây cũ chỉ có thể dư); lượt nộp cả lô không giây ⇒ không mức; thiếu bảng / câu chưa tính ⇒ "Chưa có số đo" như trước; bản học sinh ẩn mức lượt ĐÚNG ở Mức 1–2.
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import type { KetQuaLichSuLamCau } from '../server/src/lich-su-lam-cau-kieu'
import { lichSuLamCauCuaEm } from '../server/src/lich-su-lam-cau'
import { aiSaiCau } from '../server/src/ai-sai-cau'
import { gvHoSoLenBang } from '../server/src/ho-so-em-chieu'
import { dongBoCauDocGiay, kichThuocTuDong, xoaDemKichThuocCau } from '../server/src/cau-doc-giay'
import { mucLamCuaLuot } from '../server/src/muc-lam'

type D = ReturnType<typeof taoD1That>
const T0 = Date.parse('2026-10-21T10:00:00Z')
const tu = (n: number) => Array.from({ length: n }, (_, i) => `từ${i}`).join(' ')
/** Câu phần I: `text` n từ + bốn phương án 1 từ ⇒ n + 4 từ; T_đọc = 8 + 0,35 × (n + 4); với n = 16: 20 từ ⇒ 15 s; sàn nghĩ I = 6 ⇒ Mức 1 < 15 ≤ Mức 2 < 21 ≤ Mức 3. */
function cau(d: D, qid: string, n = 16, them: Record<string, unknown> = {}) {
  d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
    .run('DH-X', qid, 'v1', `g-${qid}`, 'DH-X.D0', JSON.stringify({ qid, phan: 'I', text: tu(n), choices: ['a', 'b', 'c', 'd'], ...them }))
}
let dem = 0
function sk(d: D, o: { qid: string; kq: number | null; giay?: number | null; nguon?: string; ma?: string; luc?: string; raw?: Record<string, unknown>; sbd?: string }) {
  const luc = o.luc ?? new Date(T0 + dem * 60_000).toISOString()
  d.sql.prepare(`INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, raw_json) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(`o${dem++}`, o.sbd ?? 'S1', o.qid, o.nguon ?? 'game', o.ma ?? `P${dem}`, 1, o.kq, o.giay ?? null, luc, luc.slice(0, 10), JSON.stringify(o.raw ?? {}))
}
function dung() {
  const d = taoD1That()
  d.sql.prepare('INSERT INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run('S1', 'Trần An', '2009', '12', 'x')
  d.sql.prepare('INSERT INTO hoc_sinh (sbd, ho_ten, lop, ten_lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run('S1', 'Tên cũ', '12', '12 - Tinh Hoa', 'x')
  d.sql.exec('CREATE TABLE IF NOT EXISTS omni_beta_cau (qid TEXT PRIMARY KEY, beta REAL NOT NULL, n INTEGER NOT NULL, cap_nhat_luc TEXT NOT NULL)')
  return d
}
const env = (d: D) => d.env as unknown as Env
const lichSu = async (e: Env, nguoi: 'thay' | 'hoc-sinh' = 'thay') => (await lichSuLamCauCuaEm(e, 'S1', undefined, nguoi)) as KetQuaLichSuLamCau
const mucCua = (r: KetQuaLichSuLamCau, qid: string) => r.lan.find((x) => x.qid === qid)?.mucLam

describe('cau_doc_giay — kích thước đề tính sẵn', () => {
  it('cron tính bằng ĐÚNG noiDungTuCauGoc trên câu rút gọn: số từ + có hình + phần; câu lạ ghi dòng DẤU (không tính lại); chạy lại không thêm gì', async () => {
    xoaDemKichThuocCau()
    const d = dung()
    cau(d, 'K-1', 16)
    cau(d, 'K-2', 16, { table: [[1]] })                                 // có bảng ⇒ có hình
    cau(d, 'K-3', 16, { thanCauImg: 'data:x', text: '' })               // câu chỉ là ảnh ⇒ 40 từ + hình
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DH-X', 'K-LA', 'v1', 'g', 'DH-X.D0', JSON.stringify({ qid: 'K-LA', phan: 'IV', text: 'x' }))
    const r = await dongBoCauDocGiay(env(d), 50)
    expect(r).toEqual({ them: 4, conNua: false })
    const hang = Object.fromEntries((d.sql.prepare('SELECT qid, so_tu, co_hinh, phan FROM cau_doc_giay').all() as { qid: string; so_tu: number; co_hinh: number; phan: string }[]).map((x) => [x.qid, x]))
    expect(hang['K-1']).toMatchObject({ so_tu: 20, co_hinh: 0, phan: 'I' })
    expect(hang['K-2']).toMatchObject({ so_tu: 20, co_hinh: 1, phan: 'I' })
    expect(hang['K-3']).toMatchObject({ so_tu: 4, co_hinh: 1, phan: 'I' })     // thân câu là ảnh: chỉ còn 4 phương án, có hình (mức làm tự tính nửa T_đọc cho câu chỉ-ảnh)
    expect(hang['K-LA']).toMatchObject({ so_tu: 0, co_hinh: 0, phan: '?' })
    expect(await dongBoCauDocGiay(env(d), 50)).toEqual({ them: 0, conNua: false })
    expect(kichThuocTuDong({ phan: 'IV' })).toBeNull()
  })
  it('trần mỗi lượt: lượt đầu chỉ tính `toiDa` câu và báo còn nữa', async () => {
    const d = dung()
    for (let i = 0; i < 5; i++) cau(d, `T-${i}`)
    expect(await dongBoCauDocGiay(env(d), 3)).toEqual({ them: 3, conNua: true })
    expect(await dongBoCauDocGiay(env(d), 3)).toEqual({ them: 2, conNua: false })
  })
  it('con trỏ theo MAX(qid): câu mới phía sau được lấp ngay; hết thì quét cả bảng tìm "lỗ" tối đa 30 phút một lần (dòng đánh dấu bền trong bảng); mã nhiều đề chỉ một dòng', async () => {
    const d = dung()
    cau(d, 'D-1')
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DH-Y', 'D-1', 'v1', 'g-d1', 'DH-Y.D0', JSON.stringify({ qid: 'D-1', phan: 'I', text: 'a b', choices: ['a', 'b', 'c', 'd'] }))
    expect(await dongBoCauDocGiay(env(d), 50)).toEqual({ them: 1, conNua: false })
    expect(await dongBoCauDocGiay(env(d), 50)).toEqual({ them: 0, conNua: false })        // hết phần sau con trỏ, quét cả bảng không có lỗ ⇒ ghi dấu
    expect(d.sql.prepare("SELECT COUNT(*) n FROM cau_doc_giay WHERE qid <> ''").get()).toMatchObject({ n: 1 })
    cau(d, 'D-2')
    expect(await dongBoCauDocGiay(env(d), 50)).toEqual({ them: 1, conNua: false })        // phía sau con trỏ: lấp ngay, không chờ
    cau(d, 'C-0')                                                                          // "lỗ": mã nhỏ hơn con trỏ
    expect(await dongBoCauDocGiay(env(d), 50)).toEqual({ them: 0, conNua: false })        // dấu còn mới ⇒ nghỉ
    d.sql.prepare("UPDATE cau_doc_giay SET tinh_luc = ? WHERE qid = ''").run(new Date(Date.now() - 31 * 60_000).toISOString())
    expect(await dongBoCauDocGiay(env(d), 50)).toEqual({ them: 1, conNua: false })        // hết nghỉ ⇒ quét cả bảng, lấp lỗ
    expect((d.sql.prepare("SELECT qid FROM cau_doc_giay WHERE qid <> '' ORDER BY qid").all() as { qid: string }[]).map((x) => x.qid)).toEqual(['C-0', 'D-1', 'D-2'])
  })
  it('chuỗi rỗng KHÔNG phải ảnh: thanCauImg:"" và imageDataUrl:"" không thêm hình / không bỏ số từ thân câu', async () => {
    const d = dung()
    cau(d, 'E-1', 16, { thanCauImg: '', imageDataUrl: '' })
    await dongBoCauDocGiay(env(d), 10)
    expect(d.sql.prepare("SELECT so_tu, co_hinh FROM cau_doc_giay WHERE qid = 'E-1'").get()).toMatchObject({ so_tu: 20, co_hinh: 0 })
  })
})

describe('Lịch sử làm câu — đo lại lượt cũ', () => {
  async function dungLuotCu() {
    xoaDemKichThuocCau()
    const d = dung()
    for (const q of ['C-1', 'C-2', 'C-3', 'C-4', 'C-5', 'C-6', 'C-7', 'C-8', 'C-9']) cau(d, q)
    await dongBoCauDocGiay(env(d), 50)
    // đồng hồ CŨ (raw.ms): T_đọc 15, sàn nghĩ 6 ⇒ Mức 1 < 15 ≤ Mức 2 < 21 ≤ Mức 3
    sk(d, { qid: 'C-1', kq: 0, raw: { ms: 10_000 } })                // Mức 1 ≈
    sk(d, { qid: 'C-2', kq: 1, raw: { ms: 8_000 } })                 // đúng, Mức 1 ≈ (+ ghi chú đúng trước khi đọc)
    sk(d, { qid: 'C-3', kq: 0, raw: { ms: 18_000 } })                // Mức 2 ≈
    sk(d, { qid: 'C-4', kq: 0, raw: { ms: 400_000 } })               // 400 s ⇒ Mức 3 ≈ (KHÔNG BAO GIỜ Mức 4, kể cả có β)
    d.sql.prepare("INSERT INTO omni_beta_cau (qid, beta, n, cap_nhat_luc) VALUES ('C-4', ?, 12, 'x')").run(Math.log(30_000))
    // ca thi cũ: cột giay
    sk(d, { qid: 'C-5', kq: 0, giay: 25, nguon: 'thi', ma: 'CA1' })  // Mức 3 ≈ (đồng hồ cũ)
    // ôn lại: hai dòng cách nhau 12 s NHƯNG sổ ghi theo từng lần nộp lô ⇒ khoảng cách không phải thời gian làm câu ⇒ KHÔNG ước tính (không bịa)
    sk(d, { qid: 'C-6', kq: 0, nguon: 'on_lai', ma: 'OL1', luc: new Date(T0 + 3_600_000).toISOString() })
    sk(d, { qid: 'C-7', kq: 0, nguon: 'on_lai', ma: 'OL1', luc: new Date(T0 + 3_600_000 + 12_000).toISOString() })
    // game: mốc trả lời của lượt chơi (game_v2_attempt) ⇒ giây ước tính 12 (câu đầu lượt: tính từ lúc mở lượt)
    const tg = Date.parse('2026-10-20T10:00:00Z')
    d.sql.prepare('INSERT INTO game_v2_session (id, sbd, json, created_at) VALUES (?,?,?,?)').run('PG', 'S1', JSON.stringify({ created: tg, doan: { ma: 'D1' } }), new Date(tg).toISOString())
    d.sql.prepare('INSERT INTO game_v2_attempt (id, sbd, session, qid, content_group, json, created_at) VALUES (?,?,?,?,?,?,?)').run('PG|C-3B', 'S1', 'PG', 'C-3B', 'g', JSON.stringify({ attempt: { at: tg + 12_000, qid: 'C-3B' }, traLoi: 'B', correct: false }), new Date(tg + 12_000).toISOString())
    cau(d, 'C-3B')
    await dongBoCauDocGiay(env(d), 50)
    sk(d, { qid: 'C-3B', kq: 0, nguon: 'game', ma: 'PG', luc: new Date(tg + 12_000).toISOString() })
    // câu chưa tính kích thước + lượt khoảng cách 0 (nộp lô) + lượt không có gì
    sk(d, { qid: 'C-KHONG', kq: 0, raw: { ms: 10_000 } })
    sk(d, { qid: 'C-8', kq: 0, nguon: 'btvn', ma: 'B1', luc: new Date(T0 + 7_200_000).toISOString() })
    sk(d, { qid: 'C-9', kq: 0, nguon: 'btvn', ma: 'B1', luc: new Date(T0 + 7_200_000).toISOString() })
    return d
  }
  it('lượt cũ có giây cũ / ước tính + kích thước đề ⇒ Mức làm kèm uocTinh; không Mức 4; thiếu kích thước hoặc nộp lô ⇒ không mức', async () => {
    const d = await dungLuotCu()
    const r = await lichSu(env(d))
    expect(mucCua(r, 'C-1')).toMatchObject({ ma: 1, giay: 10, uocTinh: 'cu', giayDoc: 15, ranh2: 15, ranh3: 21 })
    expect(mucCua(r, 'C-2')).toMatchObject({ ma: 1, uocTinh: 'cu', ghiChu: 'dung_truoc_doc' })
    expect(mucCua(r, 'C-3')).toMatchObject({ ma: 2, uocTinh: 'cu' })
    expect(mucCua(r, 'C-4')).toMatchObject({ ma: 3, uocTinh: 'cu' })
    expect(mucCua(r, 'C-4')!.ranh4).toBeUndefined()
    expect(mucCua(r, 'C-4')!.thuong).toBeUndefined()
    // ca thi cũ: giây có thể THIẾU (chỉ cộng cho một câu hiện nhiều nhất, bỏ qua lúc tab ẩn) ⇒ KHÔNG xếp mức, vẫn hiện số giây
    expect(mucCua(r, 'C-5')).toBeUndefined()
    expect(r.lan.find((x) => x.qid === 'C-5')).toMatchObject({ giay: 25 })
    expect(mucCua(r, 'C-3B')).toMatchObject({ ma: 1, uocTinh: 'uoc', giay: 12 })
    expect(r.lan.find((x) => x.qid === 'C-3B')).toMatchObject({ giay: 12, nguonGiay: 'uoc' })
    expect(mucCua(r, 'C-6')).toBeUndefined()                                  // ôn lại nộp lô: không có giây, không mức
    expect(mucCua(r, 'C-7')).toBeUndefined()
    expect(r.lan.find((x) => x.qid === 'C-7')?.giay ?? null).toBeNull()
    expect(mucCua(r, 'C-KHONG')).toBeUndefined()                              // câu chưa có kích thước đề
    expect(mucCua(r, 'C-8')).toBeUndefined()                                  // btvn nộp lô (khoảng cách 0): không giây, không mức
    expect(mucCua(r, 'C-9')).toBeUndefined()
    expect(r.lan.find((x) => x.qid === 'C-9')?.giay ?? null).toBeNull()
    // tổng: soUocTinh đếm đúng phần xếp từ giây cũ / ước tính
    expect(r.mucLam).toMatchObject({ soDo: 5, soUocTinh: 5, coBetaThat: false })
    expect(r.mucLam!.chuaCoSoDo).toBeGreaterThanOrEqual(6) // C-5 (thi), C-6, C-7, C-8, C-9, C-KHONG
  })
  it('bản học sinh: lượt ĐÚNG ở Mức 1–2 (giây cũ) không mang mức và không vào tổng; lượt sai giữ mức kèm uocTinh', async () => {
    const d = await dungLuotCu()
    const r = await lichSu(env(d), 'hoc-sinh')
    expect(mucCua(r, 'C-2')).toBeUndefined()
    expect(mucCua(r, 'C-1')).toMatchObject({ ma: 1, uocTinh: 'cu' })
    // C-5 là ca thi (không đo lại) ⇒ không mức; còn lại C-1, C-3, C-4, C-3B
    expect(mucCua(r, 'C-5')).toBeUndefined()
    expect(r.mucLam).toMatchObject({ soDo: 4, soUocTinh: 4, dungTruocDoc: 0 })
  })
  it('chưa có bảng cau_doc_giay (D1 mới / lỗi đọc) ⇒ lượt cũ như trước: không mức, hồ sơ vẫn trả bình thường', async () => {
    xoaDemKichThuocCau()
    const d = dung()
    cau(d, 'C-1')
    sk(d, { qid: 'C-1', kq: 0, raw: { ms: 10_000 } })
    const r = await lichSu(env(d))
    expect(r.ok).toBe(true)
    expect(r.lan).toHaveLength(1)
    expect(r.lan[0]!.mucLam).toBeUndefined()
    expect(r.mucLam).toMatchObject({ soDo: 0, chuaCoSoDo: 1, soUocTinh: 0 })
  })
  it('số đo MỚI (doc.dh = 1) không đổi: vẫn đúng như trước, không có uocTinh, có Mức 4 khi có β thật', async () => {
    xoaDemKichThuocCau()
    const d = dung()
    cau(d, 'N-1')
    await dongBoCauDocGiay(env(d), 10)
    sk(d, { qid: 'N-1', kq: 1, giay: 40, raw: { doc: { t: 20, h: 0, p: 'I', dh: 1 } } })
    d.sql.prepare("INSERT INTO omni_beta_cau (qid, beta, n, cap_nhat_luc) VALUES ('N-1', ?, 12, 'x')").run(Math.log(30_000))
    const m = mucCua(await lichSu(env(d)), 'N-1')
    expect(m).toMatchObject({ ma: 4, thuong: 30 })
    expect(m!.uocTinh).toBeUndefined()
  })
})

describe('mucLamCuaLuot — giây cũ / ước tính', () => {
  it('uocTinh ⇒ bỏ thời gian thường (không Mức 4) và mang cờ; không có uocTinh ⇒ như trước', () => {
    const co = { giay: 40, soTu: 20, coHinh: false, phan: 'I' as const, dung: false, thuongGiay: 30 }
    expect(mucLamCuaLuot(co)).toMatchObject({ ma: 4, thuong: 30 })
    const cu = mucLamCuaLuot({ ...co, uocTinh: 'uoc' })!
    expect(cu).toMatchObject({ ma: 3, uocTinh: 'uoc' })
    expect(cu.thuong).toBeUndefined()
  })
})

describe('tờ chiếu — đo lại lượt cũ', () => {
  it('/gv/ai-sai-cau: lượt sai cũ (raw.ms · ước tính) có mucLam + uocTinh khi câu có kích thước đề; không có ⇒ như trước', async () => {
    xoaDemKichThuocCau()
    const d = dung()
    cau(d, 'X-1')
    await dongBoCauDocGiay(env(d), 10)
    sk(d, { qid: 'X-1', kq: 0, raw: { ms: 18_000 } })
    const r = (await aiSaiCau(env(d), { qids: ['X-1'] })) as { ok: boolean; ds: { giay: number | null; mucLam?: { ma: number; uocTinh?: string } }[] }
    expect(r.ok).toBe(true)
    expect(r.ds[0]).toMatchObject({ giay: 18, mucLam: { ma: 2, uocTinh: 'cu' } })
  })
  it('/gv/ho-so-len-bang: lần làm cũ của câu đang chiếu có mucLam ≈; "Cách làm bài 14 ngày" đếm cả lượt cũ có giây (soUocTinh) và phần còn lại là "chưa có số đo"', async () => {
    xoaDemKichThuocCau()
    const d = dung()
    cau(d, 'H-1')
    await dongBoCauDocGiay(env(d), 10)
    const luc = (i: number) => new Date(T0 + i * 60_000).toISOString()
    sk(d, { qid: 'H-1', kq: 0, raw: { ms: 10_000 }, luc: luc(1) })
    sk(d, { qid: 'H-1', kq: 1, raw: { ms: 30_000 }, luc: luc(2) })
    sk(d, { qid: 'H-1', kq: 0, luc: luc(3) })                       // không giây ⇒ chưa có số đo
    // game không giây nhưng có mốc trả lời của lượt chơi ⇒ giây ước tính 9 (như Lịch sử làm câu và tờ chiếu «Ai đã sai?»)
    const tg = Date.parse('2026-10-20T10:00:00Z')
    d.sql.prepare('INSERT INTO game_v2_session (id, sbd, json, created_at) VALUES (?,?,?,?)').run('PH', 'S1', JSON.stringify({ created: tg, doan: { ma: 'D1' } }), new Date(tg).toISOString())
    d.sql.prepare('INSERT INTO game_v2_attempt (id, sbd, session, qid, content_group, json, created_at) VALUES (?,?,?,?,?,?,?)').run('PH|H-1', 'S1', 'PH', 'H-1', 'g', JSON.stringify({ attempt: { at: tg + 9_000, qid: 'H-1' }, traLoi: 'B', correct: false }), new Date(tg + 9_000).toISOString())
    sk(d, { qid: 'H-1', kq: 0, nguon: 'game', ma: 'PH', luc: new Date(tg + 9_000).toISOString() })
    const r = (await gvHoSoLenBang(env(d), { sbd: 'S1', qid: 'H-1' }, T0 + 3_600_000)) as { ok: boolean; cauNay: { lan: { dung: boolean; mucLam?: { ma: number; uocTinh?: string } }[] }; cachLam14: { soDo: number; chuaCoSoDo: number; soUocTinh: number } }
    expect(r.ok).toBe(true)
    // cũ → mới: game ước tính (20/10) · hai lượt đồng hồ cũ · lượt không giây
    expect(r.cauNay.lan.map((x) => x.mucLam && [x.mucLam.ma, x.mucLam.uocTinh])).toEqual([[1, 'uoc'], [1, 'cu'], [3, 'cu'], undefined])
    expect(r.cachLam14).toMatchObject({ soDo: 3, soUocTinh: 3, chuaCoSoDo: 1 })
  })
})
