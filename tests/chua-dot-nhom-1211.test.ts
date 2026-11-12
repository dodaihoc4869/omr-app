// 12/11 (hoá đơn D1, ~300 triệu hàng đọc/ngày): «đợt của em cho câu này HOẶC cùng nhóm nội dung» tách hai nhánh chỉ mục thay OR.
// Khoá: (1) kết quả cũ ↔ mới Y HỆT trên SQLite thật (nhiều đợt, nhóm rỗng, trùng nhóm, đã đóng/chưa đóng, dong_luc đúng mốc, giao_luc bằng nhau,
// câu thiếu trong kho, em khác); (2) kế hoạch truy vấn: mỗi nhánh đi đúng chỉ mục, không còn tra theo sbd đơn thuần, không SCAN bảng.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { taoD1That } from './_d1-that'
import { CHI_MUC_CRON_DEM } from '../server/src/chi-muc-luc-chay'
import { DOT_MO_EM_ROOTS, SQL_DOT_MO_THEO_CAU, SQL_THEM_DOT, SQL_THEM_DOT_MO_LAI, sqlDotMoDau } from '../server/src/chua-dot-nhom-sql'
import { SQL_LICH_KIEM_HOI_THAY } from '../server/src/hoi-thay-kiem-chung-metadata'

// ---- Câu CŨ (nguyên văn trước 12/11) ----
const CU_THEO_CAU = `SELECT id,revision FROM chua_loi_dot WHERE sbd=? AND dong_luc IS NULL AND (qid_chuan=? OR (content_group<>'' AND content_group=(SELECT content_group FROM game_v2_question WHERE qid=? LIMIT 1))) ORDER BY giao_luc ASC,id ASC LIMIT 4`
const cuMoDau = (cot: string) => `SELECT ${cot} FROM chua_loi_dot WHERE sbd=? AND (qid_chuan=? OR (content_group<>'' AND content_group=?)) AND dong_luc IS NULL ORDER BY giao_luc ASC,id ASC LIMIT 1`
const COT = 'id,sbd,qid_chuan,content_group,cohort_id,nguon_sai,phien_ban_cau,mo_luc,sai_cuoi_luc,trang_thai_day,ly_do_thieu,policy_snapshot,giao_luc,chot_do_luc,tao_luc,cap_nhat_luc'
const CU_THEM = `INSERT OR IGNORE INTO chua_loi_dot(${COT})
    SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM chua_loi_dot WHERE sbd=? AND (qid_chuan=? OR (content_group<>'' AND content_group=?)) AND dong_luc IS NULL)`
const CU_THEM_MO_LAI = `INSERT OR IGNORE INTO chua_loi_dot(${COT})
    SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM chua_loi_dot WHERE sbd=? AND (qid_chuan=? OR (content_group<>'' AND content_group=?)) AND (dong_luc IS NULL OR dong_luc>=?))`
const ROOTS = `WITH roots AS (
  SELECT qid FROM game_v2_question WHERE qid=?2 OR (content_group<>'' AND content_group=(SELECT content_group FROM game_v2_question WHERE qid=?2 LIMIT 1))
  UNION SELECT ?2
)`
const CAU_DOT = `(qid_chuan IN(SELECT qid FROM roots) OR (content_group<>'' AND content_group=(SELECT content_group FROM game_v2_question WHERE qid=?2 LIMIT 1)))`
const CU_META = `NOT EXISTS(SELECT 1 FROM chua_loi_dot d WHERE d.sbd=k.sbd AND d.dong_luc IS NULL
      AND d.trang_thai_day<>'da_tu_sua' AND (d.qid_chuan=k.qid_goc OR (d.content_group<>'' AND d.content_group=k.nhom_goc)))`
const MOI_META = `NOT EXISTS(SELECT 1 FROM chua_loi_dot d WHERE d.sbd=k.sbd AND d.qid_chuan=k.qid_goc AND d.dong_luc IS NULL AND d.trang_thai_day<>'da_tu_sua')
    AND NOT EXISTS(SELECT 1 FROM chua_loi_dot d WHERE k.nhom_goc<>'' AND d.sbd=k.sbd AND d.content_group=k.nhom_goc AND d.dong_luc IS NULL AND d.trang_thai_day<>'da_tu_sua')`

const EM = ['E1', 'E2', 'E3']
const CAU = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'qMoi']
const NHOM = ['', 'gA', 'gB', 'gX']
const MOC = [500, 1000, 1500]

/** Kho câu: q1,q2 cùng gA; q3 gB; q4 nhóm rỗng; q5 có HAI dòng (hai đề) khác nhóm; q6 gA; qMoi không có trong kho. Đợt: trộn mở/đóng, nhóm rỗng,
 *  trùng nhóm, đợt khớp CẢ câu lẫn nhóm, dong_luc đúng mốc 1000, giao_luc bằng nhau (phân xử bằng id). */
function taoKho() {
  const d = taoD1That()
  for (const s of CHI_MUC_CRON_DEM) d.sql.exec(s)
  const q = d.sql.prepare("INSERT INTO game_v2_question(ma_de,qid,version,content_group,json) VALUES(?,?,'v1',?,'{}')")
  for (const [de, qid, g] of [['D1', 'q1', 'gA'], ['D1', 'q2', 'gA'], ['D1', 'q3', 'gB'], ['D1', 'q4', ''], ['D1', 'q5', 'gB'], ['D2', 'q5', 'gA'], ['D2', 'q6', 'gA']] as const) q.run(de, qid, g)
  const ins = d.sql.prepare(`INSERT INTO chua_loi_dot(id,sbd,qid_chuan,content_group,mo_luc,dong_luc,trang_thai_day,giao_luc,tao_luc,cap_nhat_luc,revision) VALUES(?,?,?,?,1,?,?,?,1,1,?)`)
  let n = 0
  const dongs: (number | null)[] = [null, 999, 1000, 1001, null]
  for (const sbd of EM) for (const qid of CAU.slice(0, 6)) for (const g of ['', 'gA', 'gB']) {
    if ((n * 7 + qid.length + g.length) % 3 === 2) { n++; continue } // để trống vài tổ hợp
    const dong = dongs[n % dongs.length]!
    ins.run(`d${String(n).padStart(3, '0')}`, sbd, qid, g, dong, dong == null ? (n % 4 ? 'can_chan_doan' : 'da_tu_sua') : 'da_tu_sua', 100 + (n % 5), n % 9)
    n++
  }
  // Em E3: rất nhiều đợt nhóm rỗng (kiểu em thật ~290 đợt) để kế hoạch truy vấn không đổi khi ANALYZE thấy dữ liệu lệch.
  for (let i = 0; i < 300; i++) ins.run(`z${i}`, 'E3', `qz${i}`, i % 3 ? '' : `gz${i % 7}`, null, 'can_chan_doan', 50, 0)
  return d
}
const ke = (d: ReturnType<typeof taoD1That>, q: string) => (d.sql.prepare(`EXPLAIN QUERY PLAN ${q}`).all() as { detail: string }[]).map((x) => x.detail).join('\n')

describe('đợt của em cho câu/nhóm: cũ ↔ mới y hệt (12/11)', () => {
  it('đợt mở theo câu (tra nhóm trong kho câu) — LIMIT 4, đúng thứ tự giao_luc,id', () => {
    const d = taoKho()
    let coDong = 0
    for (const sbd of [...EM, 'E9']) for (const qid of [...CAU, 'qz3']) {
      const cu = d.sql.prepare(CU_THEO_CAU).all(sbd, qid, qid)
      const moi = d.sql.prepare(SQL_DOT_MO_THEO_CAU).all(sbd, qid)
      expect(moi, `${sbd}/${qid}`).toEqual(cu)
      if (cu.length) coDong++
    }
    expect(coDong).toBeGreaterThan(10)
  })
  it('đợt mở đầu tiên theo câu + nhóm cho sẵn (SELECT * và SELECT qid_chuan)', () => {
    const d = taoKho()
    let co = 0
    for (const cot of ['*', 'qid_chuan']) for (const sbd of [...EM, 'E9']) for (const qid of [...CAU, 'qz3']) for (const g of [...NHOM, 'gz0']) {
      const cu = d.sql.prepare(cuMoDau(cot)).get(sbd, qid, g)
      expect(d.sql.prepare(sqlDotMoDau(cot)).get(sbd, qid, g), `${cot} ${sbd}/${qid}/${g}`).toEqual(cu)
      if (cu) co++
    }
    expect(co).toBeGreaterThan(50)
  })
  it('hai INSERT … WHERE NOT EXISTS: cùng bind, cùng số dòng thêm (kể cả dong_luc đúng mốc)', () => {
    const d = taoKho()
    let them = 0, khong = 0
    for (const [cu, moi, coMoc] of [[CU_THEM, SQL_THEM_DOT, false], [CU_THEM_MO_LAI, SQL_THEM_DOT_MO_LAI, true]] as const)
      for (const sbd of [...EM, 'E9']) for (const qid of CAU) for (const g of NHOM) for (const moc of coMoc ? MOC : [0]) {
        const bind = ['moi-id', sbd, qid, g, 'c', 'thi', 'v1', 1, 1, 'can_chan_doan', '', '{}', 9, 9, 9, 9, sbd, qid, g, ...(coMoc ? [moc] : [])]
        const chay = (s: string) => { d.sql.exec('SAVEPOINT t'); const r = Number(d.sql.prepare(s).run(...bind).changes); d.sql.exec('ROLLBACK TO t'); d.sql.exec('RELEASE t'); return r }
        const a = chay(cu)
        expect(chay(moi), `${coMoc} ${sbd}/${qid}/${g}/${moc}`).toBe(a)
        if (a) them++; else khong++
      }
    expect(them).toBeGreaterThan(10)
    expect(khong).toBeGreaterThan(10)
  })
  it('hỏi thầy đồng bộ sửa: đợt mở của em cho roots/nhóm — cùng tập id,revision', () => {
    const d = taoKho()
    for (const sbd of [...EM, 'E9']) for (const qid of [...CAU, 'qz3']) {
      const sx = (r: unknown[]) => (r as { id: string }[]).map((x) => JSON.stringify(x)).sort()
      const cu = d.sql.prepare(`${ROOTS} SELECT id,revision FROM chua_loi_dot WHERE sbd=?1 AND ${CAU_DOT} AND dong_luc IS NULL`).all(sbd, qid)
      const moi = d.sql.prepare(`${ROOTS} SELECT id,revision FROM chua_loi_dot WHERE ${DOT_MO_EM_ROOTS}`).all(sbd, qid)
      expect(sx(moi), `${sbd}/${qid}`).toEqual(sx(cu))
      const ne = (s: string) => d.sql.prepare(`${ROOTS} SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM chua_loi_dot WHERE ${s}) THEN 1 ELSE 0 END x`).get(sbd, qid)
      expect(ne(DOT_MO_EM_ROOTS)).toEqual(ne(`sbd=?1 AND ${CAU_DOT} AND dong_luc IS NULL`))
    }
  })
  it('lịch kiểm hỏi thầy: NOT EXISTS tách đôi cho cùng kết quả theo từng dòng kiểm', () => {
    const d = taoKho()
    d.sql.exec('CREATE TEMP TABLE k(id TEXT, sbd TEXT, qid_goc TEXT, nhom_goc TEXT)')
    const ins = d.sql.prepare('INSERT INTO k VALUES(?,?,?,?)')
    let i = 0
    for (const sbd of [...EM, 'E9']) for (const qid of CAU) for (const g of NHOM) ins.run(`k${i++}`, sbd, qid, g)
    const chay = (frag: string) => d.sql.prepare(`SELECT id FROM k WHERE ${frag} ORDER BY id`).all()
    const cu = chay(CU_META)
    expect(chay(MOI_META)).toEqual(cu)
    expect(cu.length).toBeGreaterThan(5)
    expect(cu.length).toBeLessThan(i)
  })
})

describe('kế hoạch truy vấn: hai nhánh chỉ mục, không còn tra theo sbd đơn thuần (12/11)', () => {
  const CAU_MOI: [string, string][] = [
    ['đợt mở theo câu', SQL_DOT_MO_THEO_CAU], ['đợt mở đầu *', sqlDotMoDau('*')], ['đợt mở đầu qid', sqlDotMoDau('qid_chuan')],
    ['thêm đợt', SQL_THEM_DOT], ['thêm đợt mở lại', SQL_THEM_DOT_MO_LAI], ['hỏi thầy roots', `${ROOTS} SELECT id,revision FROM chua_loi_dot WHERE ${DOT_MO_EM_ROOTS}`],
  ]
  const kiem = (d: ReturnType<typeof taoD1That>) => {
    for (const [ten, q] of CAU_MOI) {
      const k = ke(d, q)
      expect(k, ten).toMatch(/SEARCH chua_loi_dot USING (COVERING )?INDEX idx_cld_sbd_qid \(sbd=\? AND qid_chuan=\?\)/)
      expect(k, ten).toMatch(/SEARCH chua_loi_dot USING (COVERING )?INDEX idx_cld_sbd_nhom \(sbd=\? AND content_group=\?/)
      expect(k, ten).not.toMatch(/INDEX \w+ \(sbd=\?\)/)
      expect(k, ten).not.toMatch(/SCAN chua_loi_dot/)
    }
    const meta = ke(d, SQL_LICH_KIEM_HOI_THAY)
    expect(meta).toMatch(/SEARCH d USING (COVERING )?INDEX idx_cld_sbd_qid \(sbd=\? AND qid_chuan=\?\)/)
    expect(meta).toMatch(/SEARCH d USING (COVERING )?INDEX idx_cld_sbd_nhom \(sbd=\? AND content_group=\?/)
    expect(meta).not.toMatch(/SEARCH d USING (COVERING )?INDEX \w+ \(sbd=\?\)/)
  }
  it('kho mới (chưa ANALYZE)', () => kiem(taoKho()))
  it('sau ANALYZE trên dữ liệu lệch (một em ~300 đợt, phần lớn nhóm rỗng)', () => {
    const d = taoKho()
    d.sql.exec('ANALYZE')
    kiem(d)
  })
  it('thiếu chỉ mục mới (migration chưa chạy): vẫn đúng và không tệ hơn cũ — không SCAN cả bảng', () => {
    const d = taoKho()
    d.sql.exec('DROP INDEX idx_cld_sbd_nhom')
    for (const [ten, q] of CAU_MOI) {
      expect(ke(d, q), ten).not.toMatch(/SCAN chua_loi_dot/)
      expect(ke(d, q), ten).toMatch(/idx_cld_sbd_qid \(sbd=\? AND qid_chuan=\?\)/)
    }
    expect(d.sql.prepare(sqlDotMoDau('id')).get('E1', 'q1', 'gA')).toEqual(d.sql.prepare(cuMoDau('id')).get('E1', 'q1', 'gA'))
  })
  it('chỉ mục mới có trong migration 1211 và CHI_MUC_CRON_DEM', () => {
    expect(readFileSync('server/migration-1211-chua-dot-nhom.sql', 'utf8')).toContain('CREATE INDEX IF NOT EXISTS idx_cld_sbd_nhom ON chua_loi_dot(sbd, content_group, dong_luc)')
    expect(CHI_MUC_CRON_DEM).toContain('CREATE INDEX IF NOT EXISTS idx_cld_sbd_nhom ON chua_loi_dot(sbd, content_group, dong_luc)')
  })
})

describe('mã nguồn dùng câu mới, không còn mẫu OR cũ (12/11)', () => {
  it('chua-cau-sai.ts / hoi-thay-dong-bo-sua.ts / hoi-thay-kiem-chung-metadata.ts', () => {
    const ccs = readFileSync('server/src/chua-cau-sai.ts', 'utf8')
    expect(ccs).not.toMatch(/FROM chua_loi_dot WHERE sbd=\? AND [^`]*\(qid_chuan=\? OR/)
    expect(ccs).not.toContain("NOT EXISTS(SELECT 1 FROM chua_loi_dot WHERE sbd=? AND (qid_chuan=?")
    for (const t of ['SQL_DOT_MO_THEO_CAU)', "sqlDotMoDau('*')", "sqlDotMoDau('qid_chuan')", 'prepare(SQL_THEM_DOT)', 'prepare(SQL_THEM_DOT_MO_LAI)']) expect(ccs).toContain(t)
    const htd = readFileSync('server/src/hoi-thay-dong-bo-sua.ts', 'utf8')
    expect(htd).not.toContain('sbd=?1 AND ${CAU_DOT} AND dong_luc IS NULL')
    expect(htd.split('${DOT_MO_EM_ROOTS}').length - 1).toBe(4)
    expect(SQL_LICH_KIEM_HOI_THAY).toContain(MOI_META)
  })
})
