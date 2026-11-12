// @vitest-environment node
// NHÓM H2 (12/11) — BẢN TÍNH SẴN DÙNG CHUNG THEO DẤU BẢNG (server/src/bang-tinh-chung.ts): câu đọc kho (ma trận nhãn Gói 7, chỉ mục câu theo dạng, câu của
// tờ, β câu) trả KẾT QUẢ Y HỆT câu cũ ở mọi lượt — trúng / trượt / sau khi bảng nguồn đổi (trigger đổi dấu ⇒ không bao giờ dùng bản cũ) / thiếu bảng dấu.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { batBangTinhChung, bamNgan, docChung, donBangTinhChung, sqlDocChung, TUOI_TOI_DA_MS } from '../server/src/bang-tinh-chung'
import { docMaTranCu7 } from '../server/src/goi-bai-7'
import { docChiMucTheoDang } from '../server/src/omni-game'
import { cauCuaToChiTiet } from '../server/src/srs2-gv'
import { batDemBeta, docBetaDong, SQL_BETA_CAU } from '../server/src/beta-dem'
import { docBetaVaTau } from '../server/src/omni-d1'
import type { Env } from '../server/src/kieu'
import { SQL_TANG_PHIEN } from '../server/src/dau-kho-cau'
import { readFileSync, readdirSync } from 'node:fs'

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
  for (let t = 0; t < 4; t++) d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,'v',?)").run(`DE${t}`, `2026-11-0${t + 1}T00:00:00.000Z`)
}
/** Như nơi ghi thật: câu kho chỉ ghi CÙNG LÔ với game_v2_index (lapChiMucTo / danhCoTuLuanKho đặt indexed_at mới); omni_q ghi xong ⇒ boKhoChup tăng phiên. */
let lan = 0
const ghiKho = (d: D, s: string) => d.sql.exec(`${s}; UPDATE game_v2_index SET indexed_at='2026-11-12T00:00:${String(++lan % 60).padStart(2, '0')}.${String(lan).padStart(3, '0')}Z' WHERE ma_de='DE0'`)
const ghiQ = (d: D, s: string) => d.sql.exec(`${s}; ${SQL_TANG_PHIEN.replace('?', "'omni_q'")}`)

beforeEach(() => { batBangTinhChung(true) })
afterEach(() => { batBangTinhChung(false); batDemBeta(false) })

describe('docChung — lõi', () => {
  it('trượt ⇒ câu cũ cùng lô với dấu, cất nền; trúng ⇒ MỘT câu (dấu + dòng cất), không chạy câu cũ; ghi bảng nguồn ⇒ dấu đổi ⇒ đọc lại', async () => {
    const d = taoD1That(); datKho(d)
    const SQL = "SELECT qid, json FROM game_v2_question WHERE dang = ? ORDER BY rowid"
    const cu = () => d.sql.prepare(SQL).all('d1')
    const a = isolate(d)
    const r1 = await docChung(a.env, 'thu', SQL, 'd1', ['game_v2_index'], () => a.env.DB.prepare(SQL).bind('d1'))
    expect(r1.results).toEqual(cu())
    expect(a.sql.slice(0, 4)).toEqual([sqlDocChung(['game_v2_index']), "SELECT (SELECT dau FROM dau_bang WHERE ten = 'game_v2_index') AS d", SQL, 'batch'])
    await cho()
    expect(dongCat(d).map((x) => x.khoa)).toEqual([`thu.${bamNgan(SQL)}|d1`])
    const b = isolate(d)
    const r2 = await docChung(b.env, 'thu', SQL, 'd1', ['game_v2_index'], () => b.env.DB.prepare(SQL).bind('d1'))
    expect(r2.results).toEqual(cu())
    expect(b.sql).toEqual([sqlDocChung(['game_v2_index'])])
    // ghi bảng nguồn (sửa json một câu) ⇒ dấu đổi ⇒ không dùng dòng cất cũ
    ghiKho(d, "UPDATE game_v2_question SET json='{\"text\":\"moi\"}' WHERE qid='DE0-1'")
    const c = isolate(d)
    const r3 = await docChung(c.env, 'thu', SQL, 'd1', ['game_v2_index'], () => c.env.DB.prepare(SQL).bind('d1'))
    expect(r3.results).toEqual(cu())
    expect(JSON.stringify(r3.results)).toContain('moi')
    expect(c.sql).toContain(SQL)
    // câu SQL khác ⇒ khoá khác (không dùng nhầm dòng cất)
    const SQL2 = SQL.replace('qid, json', 'qid')
    const e = isolate(d)
    expect((await docChung(e.env, 'thu', SQL2, 'd1', ['game_v2_index'], () => e.env.DB.prepare(SQL2).bind('d1'))).results).toEqual(d.sql.prepare(SQL2).all('d1'))
    expect(e.sql).toContain(SQL2)
  })
  it('dòng lớn ⇒ nén gzip, đọc lại đúng; thiếu bảng dấu ⇒ câu cũ, không cất; công tắc tắt ⇒ đúng câu cũ', async () => {
    const d = taoD1That(); datKho(d)
    d.sql.exec(`UPDATE game_v2_question SET json = json_set(json, '$.dai', '${'x'.repeat(30_000)}') WHERE json_valid(json)`)
    const SQL = 'SELECT qid, json FROM game_v2_question ORDER BY rowid'
    const a = isolate(d)
    await docChung(a.env, 'lon', SQL, '', ['game_v2_index'], () => a.env.DB.prepare(SQL))
    await cho()
    const cat = dongCat(d)[0]!
    expect(cat.n).toBeLessThan(200_000)
    expect(String((d.sql.prepare('SELECT json FROM bang_tinh_chung').get() as { json: string }).json).startsWith('z')).toBe(true)
    const b = isolate(d)
    expect((await docChung(b.env, 'lon', SQL, '', ['game_v2_index'], () => b.env.DB.prepare(SQL))).results).toEqual(d.sql.prepare(SQL).all())
    expect(b.sql).toHaveLength(1)
    d.sql.exec("DELETE FROM dau_bang WHERE ten = 'game_v2_index'") // thiếu dòng dấu ⇒ không dùng / không cất
    const c = isolate(d)
    expect((await docChung(c.env, 'lon', SQL, '', ['game_v2_index'], () => c.env.DB.prepare(SQL))).results).toEqual(d.sql.prepare(SQL).all())
    expect(c.sql).toEqual([sqlDocChung(['game_v2_index']), SQL])
    batBangTinhChung(false)
    const e = isolate(d)
    expect((await docChung(e.env, 'lon', SQL, '', ['game_v2_index'], () => e.env.DB.prepare(SQL))).results).toEqual(d.sql.prepare(SQL).all())
    expect(e.sql).toEqual([SQL])
  })
  it('EXPLAIN câu trúng: chỉ SEARCH dau_bang + bang_tinh_chung theo khoá chính', () => {
    const d = taoD1That()
    const kh = (d.sql.prepare('EXPLAIN QUERY PLAN ' + sqlDocChung(['game_v2_index', 'omni_q'])).all('k') as { detail: string }[]).map((x) => x.detail)
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
      if (buoc) (buoc.includes('omni_q') ? ghiQ : ghiKho)(d, buoc)
      const { cu, moi1, moi2 } = await soCuMoi(d, f)
      expect(moi1, buoc).toEqual(cu); expect(moi2, buoc).toEqual(cu)
    }
    expect(dongCat(d).some((x) => x.khoa.startsWith('kn7.'))).toBe(true)
  })
  it('(7) docChiMucTheoDang + (12) cauCuaToChiTiet: y hệt; sửa kho ⇒ theo dữ liệu mới', async () => {
    const d = taoD1That(); datKho(d)
    for (const buoc of ['', "UPDATE game_v2_question SET json=json_set(json,'$.reviewed',json('true')) WHERE qid='DE0-4'", "DELETE FROM game_v2_question WHERE qid='DE1-2'", "INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES('DE1','DE1-99','1','g','d1','{\"reviewed\":true,\"phan\":\"I\"}')"]) {
      if (buoc) ghiKho(d, buoc)
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
    d.sql.exec('DELETE FROM omni_beta_cau'); for (let i = 0; i < 40; i++) them.run(`q${i}`, 20 + i, 6, '2026-11-13') // cùng số dòng ⇒ MAX(rowid) như cũ: chỉ phiên (tinhBetaMoiCau tăng) báo đổi
    d.sql.prepare(SQL_TANG_PHIEN).run('omni_beta_cau')
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

describe('nơi ghi bảng nguồn không trigger — khoá danh sách (thêm nơi ghi mới ⇒ test đỏ, phải tăng dấu)', () => {
  const tep = readdirSync('server/src').filter((f) => f.endsWith('.ts')).map((f) => [f, readFileSync(`server/src/${f}`, 'utf8')] as const)
  const noiGhi = (bang: string) => tep.filter(([, s]) => new RegExp(`(INSERT( OR [A-Z]+)? INTO|UPDATE|DELETE FROM|REPLACE INTO) ${bang}\\b`).test(s)).map(([f]) => f).sort()
  it('game_v2_question chỉ ghi ở game-v2-bank.ts, mỗi lô đều ghi game_v2_index', () => {
    expect(noiGhi('game_v2_question')).toEqual(['game-v2-bank.ts'])
    const s = tep.find(([f]) => f === 'game-v2-bank.ts')![1]
    for (const m of s.matchAll(/(INSERT INTO|UPDATE|DELETE FROM) game_v2_question\b/g)) {
      const doan = s.slice(m.index!, m.index! + 900)
      expect(/game_v2_index/.test(doan), doan.slice(0, 120)).toBe(true)
    }
  })
  it('omni_q chỉ ghi ở omni-gan-vkn.ts / omni-gv.ts (cả hai gọi boKhoChup ⇒ tăng phiên); omni_beta_cau chỉ ở omni-d1.ts (tinhBetaMoiCau tăng phiên)', () => {
    expect(noiGhi('omni_q')).toEqual(['omni-gan-vkn.ts', 'omni-gv.ts'])
    for (const f of ['omni-gan-vkn.ts', 'omni-gv.ts']) expect(tep.find(([x]) => x === f)![1]).toContain('boKhoChup(env)')
    expect(noiGhi('omni_beta_cau')).toEqual(['omni-d1.ts'])
    expect(tep.find(([x]) => x === 'omni-d1.ts')![1]).toContain("bind('omni_beta_cau')")
    expect(tep.find(([x]) => x === 'kho-chung.ts')![1]).toContain("bind('omni_q')")
  })
})

describe('tuổi tối đa + dọn bảng', () => {
  it('dòng cất quá 24 giờ coi như trượt (dù dấu khớp); cron dọn xoá dòng quá tuổi', async () => {
    const d = taoD1That(); datKho(d)
    const SQL = 'SELECT qid FROM game_v2_question ORDER BY rowid'
    await docChung(isolate(d).env, 'tuoi', SQL, '', ['game_v2_index'], () => d.env.DB.prepare(SQL)); await cho()
    d.sql.prepare('UPDATE bang_tinh_chung SET luc = ?').run(Date.now() - TUOI_TOI_DA_MS - 1000)
    const a = isolate(d)
    expect((await docChung(a.env, 'tuoi', SQL, '', ['game_v2_index'], () => a.env.DB.prepare(SQL))).results).toEqual(d.sql.prepare(SQL).all())
    expect(a.sql).toContain(SQL)
    await cho()
    d.sql.exec("INSERT INTO bang_tinh_chung(khoa,dau,json,luc) VALUES('cu','x','[]',0)")
    expect(await donBangTinhChung(d.env, Date.now())).toBe(1)
    expect(dongCat(d).map((x) => x.khoa)).toEqual([`tuoi.${bamNgan(SQL)}|`])
  })
})
