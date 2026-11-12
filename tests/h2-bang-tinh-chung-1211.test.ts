// @vitest-environment node
// NHÓM H2 (12/11) — BẢN TÍNH SẴN DÙNG CHUNG THEO DẤU BẢNG (server/src/bang-tinh-chung.ts): câu đọc kho (ma trận nhãn Gói 7, chỉ mục câu theo dạng, câu của
// tờ, β câu) trả KẾT QUẢ Y HỆT câu cũ ở mọi lượt — trúng / trượt / sau khi bảng nguồn đổi (trigger đổi dấu ⇒ không bao giờ dùng bản cũ) / thiếu bảng dấu.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { batBangTinhChung, bamNgan, docChung, sqlDocChung } from '../server/src/bang-tinh-chung'
import { docMaTranCu7 } from '../server/src/goi-bai-7'
import { docChiMucTheoDang } from '../server/src/omni-game'
import { cauCuaToChiTiet } from '../server/src/srs2-gv'
import { batDemBeta, docBetaDong, SQL_BETA_CAU } from '../server/src/beta-dem'
import { docBetaVaTau } from '../server/src/omni-d1'
import type { Env } from '../server/src/kieu'

type D = ReturnType<typeof taoD1That>
/** «Isolate mới»: D1 bọc bằng đối tượng mới (đệm trong isolate khoá theo D1 gốc) + đếm câu gửi đi. */
function isolate(d: D) {
  const goc = d.env.DB as unknown as { prepare(q: string): unknown; batch(x: unknown[]): unknown }
  const sql: string[] = []
  const env = { ...d.env, DB: { prepare: (q: string) => { sql.push(q); return goc.prepare(q) }, batch: (x: unknown[]) => { sql.push('batch'); return goc.batch(x) } } } as unknown as Env
  return { env, sql }
}
const cho = () => new Promise((r) => setTimeout(r, 30)) // cất nền xong
const dongCat = (d: D) => d.sql.prepare('SELECT khoa, dau, length(json) n FROM bang_tinh_chung ORDER BY khoa').all() as { khoa: string; dau: string; n: number }[]

function datKho(d: D, hong = true) {
  const them = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let t = 0; t < 4; t++) for (let i = 0; i < 12; i++) {
    const qid = `DE${t}-${i}`
    them.run(`DE${t}`, qid, '1', `g${i % 5}`, i % 3 ? `d${i % 4}` : null, i === 7 && hong ? '{hong' : JSON.stringify({ text: `câu ${qid}`, reviewed: i % 4 !== 0, phan: ['I', 'II', 'III'][i % 3], mucDo: ['NB', 'TH', ' VD', ''][i % 4], kienThuc: i % 2 ? ['k1', `k${i}`] : undefined, choiceImgs: i === 5 ? ['', 'x'] : undefined, tuLuan: i === 9 }))
  }
  const q = d.sql.prepare('INSERT INTO omni_q(qid,y,vkn_json,nguon,duyet_luc) VALUES(?,?,?,?,?)')
  for (let i = 0; i < 12; i += 2) q.run(`DE1-${i}`, -1, JSON.stringify([`v${i % 3}`, 'v9']), 'thay', i % 4 ? 'x' : null)
  q.run('DE2-3', 0, '[]', 'goi_y', null)
}

beforeEach(() => { batBangTinhChung(true) })
afterEach(() => { batBangTinhChung(false); batDemBeta(false) })

describe('docChung — lõi', () => {
  it('trượt ⇒ câu cũ cùng lô với dấu, cất nền; trúng ⇒ MỘT câu (dấu + dòng cất), không chạy câu cũ; ghi bảng nguồn ⇒ dấu đổi ⇒ đọc lại', async () => {
    const d = taoD1That(); datKho(d)
    const SQL = "SELECT qid, json FROM game_v2_question WHERE dang = ? ORDER BY rowid"
    const cu = () => d.sql.prepare(SQL).all('d1')
    const a = isolate(d)
    const r1 = await docChung(a.env, 'thu', SQL, 'd1', ['game_v2_question'], () => a.env.DB.prepare(SQL).bind('d1'))
    expect(r1.results).toEqual(cu())
    expect(a.sql.slice(0, 4)).toEqual([sqlDocChung(['game_v2_question']), "SELECT (SELECT dau FROM dau_bang WHERE ten = 'game_v2_question') AS d", SQL, 'batch'])
    await cho()
    expect(dongCat(d).map((x) => x.khoa)).toEqual([`thu.${bamNgan(SQL)}|d1`])
    const b = isolate(d)
    const r2 = await docChung(b.env, 'thu', SQL, 'd1', ['game_v2_question'], () => b.env.DB.prepare(SQL).bind('d1'))
    expect(r2.results).toEqual(cu())
    expect(b.sql).toEqual([sqlDocChung(['game_v2_question'])])
    // ghi bảng nguồn (sửa json một câu) ⇒ dấu đổi ⇒ không dùng dòng cất cũ
    d.sql.exec("UPDATE game_v2_question SET json='{\"text\":\"moi\"}' WHERE qid='DE0-1'")
    const c = isolate(d)
    const r3 = await docChung(c.env, 'thu', SQL, 'd1', ['game_v2_question'], () => c.env.DB.prepare(SQL).bind('d1'))
    expect(r3.results).toEqual(cu())
    expect(JSON.stringify(r3.results)).toContain('moi')
    expect(c.sql).toContain(SQL)
    // câu SQL khác ⇒ khoá khác (không dùng nhầm dòng cất)
    const SQL2 = SQL.replace('qid, json', 'qid')
    const e = isolate(d)
    expect((await docChung(e.env, 'thu', SQL2, 'd1', ['game_v2_question'], () => e.env.DB.prepare(SQL2).bind('d1'))).results).toEqual(d.sql.prepare(SQL2).all('d1'))
    expect(e.sql).toContain(SQL2)
  })
  it('dòng lớn ⇒ nén gzip, đọc lại đúng; thiếu bảng dấu ⇒ câu cũ, không cất; công tắc tắt ⇒ đúng câu cũ', async () => {
    const d = taoD1That(); datKho(d)
    d.sql.exec(`UPDATE game_v2_question SET json = json_set(json, '$.dai', '${'x'.repeat(30_000)}') WHERE json_valid(json)`)
    const SQL = 'SELECT qid, json FROM game_v2_question ORDER BY rowid'
    const a = isolate(d)
    await docChung(a.env, 'lon', SQL, '', ['game_v2_question'], () => a.env.DB.prepare(SQL))
    await cho()
    const cat = dongCat(d)[0]!
    expect(cat.n).toBeLessThan(200_000)
    expect(String((d.sql.prepare('SELECT json FROM bang_tinh_chung').get() as { json: string }).json).startsWith('z')).toBe(true)
    const b = isolate(d)
    expect((await docChung(b.env, 'lon', SQL, '', ['game_v2_question'], () => b.env.DB.prepare(SQL))).results).toEqual(d.sql.prepare(SQL).all())
    expect(b.sql).toHaveLength(1)
    d.sql.exec("DELETE FROM dau_bang WHERE ten = 'game_v2_question'") // thiếu dòng dấu ⇒ không dùng / không cất
    const c = isolate(d)
    expect((await docChung(c.env, 'lon', SQL, '', ['game_v2_question'], () => c.env.DB.prepare(SQL))).results).toEqual(d.sql.prepare(SQL).all())
    expect(c.sql).toEqual([sqlDocChung(['game_v2_question']), SQL])
    batBangTinhChung(false)
    const e = isolate(d)
    expect((await docChung(e.env, 'lon', SQL, '', ['game_v2_question'], () => e.env.DB.prepare(SQL))).results).toEqual(d.sql.prepare(SQL).all())
    expect(e.sql).toEqual([SQL])
  })
  it('EXPLAIN câu trúng: chỉ SEARCH dau_bang + bang_tinh_chung theo khoá chính', () => {
    const d = taoD1That()
    const kh = (d.sql.prepare('EXPLAIN QUERY PLAN ' + sqlDocChung(['game_v2_question', 'omni_q'])).all('k') as { detail: string }[]).map((x) => x.detail)
    expect(kh.filter((x) => /^SCAN (?!CONSTANT ROW|s\b)/.test(x)), kh.join('\n')).toEqual([])
    expect(kh.filter((x) => /^SEARCH (dau_bang|c|bang_tinh_chung) USING (COVERING )?INDEX sqlite_autoindex/.test(x)).length, kh.join('\n')).toBeGreaterThanOrEqual(3)
  })
})

describe('nơi dùng: kết quả y hệt đường cũ qua trượt / trúng / bảng nguồn đổi', () => {
  async function soCuMoi<T>(d: D, f: (env: Env) => Promise<T>) {
    batBangTinhChung(false); const cu = await f(isolate(d).env)
    batBangTinhChung(true); const moi1 = await f(isolate(d).env); await cho()
    const moi2 = await f(isolate(d).env)
    return { cu, moi1, moi2 }
  }
  it('(9) docMaTranCu7 (ma trận nhãn + 96 câu yếu Gói 7): y hệt; đổi omni_q / game_v2_question ⇒ theo đúng dữ liệu mới', async () => {
    const d = taoD1That(); datKho(d, false) // JSON hỏng làm câu cũ lỗi (json_extract) ⇒ không đưa vào phép so
    const f = (env: Env) => docMaTranCu7(env, 'E1', ['DE1', 'DE2', 'DE0'], Date.parse('2026-11-12T12:00:00Z'))
    for (const buoc of ['', "UPDATE omni_q SET vkn_json='[\"v7\"]' WHERE qid='DE1-2'", "UPDATE game_v2_question SET json=json_set(json,'$.reviewed',json('false')) WHERE qid='DE2-1'", "DELETE FROM omni_q WHERE qid='DE1-4'"]) {
      if (buoc) d.sql.exec(buoc)
      const { cu, moi1, moi2 } = await soCuMoi(d, f)
      expect(moi1, buoc).toEqual(cu); expect(moi2, buoc).toEqual(cu)
    }
    expect(dongCat(d).some((x) => x.khoa.startsWith('kn7.'))).toBe(true)
  })
  it('(7) docChiMucTheoDang + (12) cauCuaToChiTiet: y hệt; sửa kho ⇒ theo dữ liệu mới', async () => {
    const d = taoD1That(); datKho(d)
    for (const buoc of ['', "UPDATE game_v2_question SET json=json_set(json,'$.reviewed',json('true')) WHERE qid='DE0-4'", "DELETE FROM game_v2_question WHERE qid='DE1-2'", "INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES('DE1','DE1-99','1','g','d1','{\"reviewed\":true,\"phan\":\"I\"}')"]) {
      if (buoc) d.sql.exec(buoc)
      for (const dang of ['d1', 'd2', 'khong']) { const { cu, moi1, moi2 } = await soCuMoi(d, (env) => docChiMucTheoDang(env, dang)); expect(moi1).toEqual(cu); expect(moi2).toEqual(cu) }
      for (const to of [['DE0', 'DE1'], ['DE1#II', 'DE0'], ['DE3']]) { const { cu, moi1, moi2 } = await soCuMoi(d, (env) => cauCuaToChiTiet(env, to)); expect(moi1, `${buoc} ${to}`).toEqual(cu); expect(moi2).toEqual(cu) }
    }
  })
  it('(1) β câu: đệm «đủ» từ bản tính sẵn = câu cũ theo qid (có β / không β / câu lạ); viết lại bảng đêm ⇒ β mới; docBetaVaTau y hệt', async () => {
    const d = taoD1That()
    const them = d.sql.prepare('INSERT INTO omni_beta_cau(qid,beta,n,cap_nhat_luc) VALUES(?,?,?,?)')
    for (let i = 0; i < 40; i++) them.run(`q${i}`, 8 + i / 10, 5, '2026-11-12')
    d.sql.prepare("INSERT INTO omni_em(sbd,s_uoc,tau,n_tau,phien_ban,cap_nhat_luc) VALUES('E1',0,0.3,9,'1','x')").run()
    const QS = ['q1', 'q39', 'q40', 'khong', 'q7', 'q1']
    const cu = () => (d.sql.prepare(SQL_BETA_CAU).all(JSON.stringify([...new Set(QS)])) as { qid: string; beta: number }[])
    const theoQid = (r: { results: { qid: string; beta: number }[] }) => Object.fromEntries(r.results.map((x) => [x.qid, x.beta]))
    batDemBeta(true)
    const a = isolate(d)
    expect(theoQid(await docBetaDong(a.env, QS))).toEqual(Object.fromEntries(cu().map((x) => [x.qid, x.beta])))
    await cho()
    const b = isolate(d)
    expect(theoQid(await docBetaDong(b.env, QS))).toEqual(Object.fromEntries(cu().map((x) => [x.qid, x.beta])))
    expect(b.sql).toEqual([sqlDocChung(['omni_beta_cau'])]) // trúng: một câu, không đọc theo qid
    // việc đêm viết lại bảng (DELETE + INSERT) ⇒ dấu đổi ⇒ isolate mới thấy β mới
    d.sql.exec('DELETE FROM omni_beta_cau'); for (let i = 0; i < 40; i += 2) them.run(`q${i}`, 20 + i, 6, '2026-11-13')
    const c = isolate(d)
    expect(theoQid(await docBetaDong(c.env, QS))).toEqual(Object.fromEntries(cu().map((x) => [x.qid, x.beta])))
    // docBetaVaTau: cùng β + τ như đường cũ (đệm tắt)
    batDemBeta(false); batBangTinhChung(false)
    const goc = await docBetaVaTau(isolate(d).env, QS, ['E1', 'E2'])
    batDemBeta(true); batBangTinhChung(true)
    expect(await docBetaVaTau(isolate(d).env, QS, ['E1', 'E2'])).toEqual(goc)
    await cho()
    expect(await docBetaVaTau(isolate(d).env, QS, ['E1', 'E2'])).toEqual(goc)
  })
})
