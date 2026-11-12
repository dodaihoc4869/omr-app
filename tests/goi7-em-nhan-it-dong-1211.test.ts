// @vitest-environment node
// NHÓM G4 (12/11, giảm chi phí D1): câu nối bảng lớp / chiến dịch / Gói 7 — bản ít dòng phải cho KẾT QUẢ Y HỆT câu cũ.
// Đo D1 thật 24h: danh sách em Gói 7 (bai-hang-ngay.ts) 1.971 × 28.217 dòng; danh sách em cron Sảnh (san-sang.ts) 1.908 × 28.495; thêm em vào gói
// (goi-bai-7.ts dongBoThat7) 301 × ~27.500; chốt quota / đếm «chưa nhận» (scripts/ap-goi7-song.ts); chọn em kiểm động cơ 258 × 543.881.
// Đo lại trên miniflare (workerd thật, `meta.rows_read`), dữ liệu giả cỡ thật: danh sách em 78.678 ⇒ 7.781 dòng; thêm em 73.800 ⇒ ~8.000;
// đếm «chưa nhận» 71.756 ⇒ 7.932; quota lần đầu trong ngày 168.395 ⇒ 141.085, từ lần thứ hai 5.162; quota 0: 79.942 ⇒ 5.161.
// Khoá: (1) so CŨ ↔ MỚI trên D1 thật trong bộ nhớ (node:sqlite, lược đồ thật) với dữ liệu đủ ca (tên lớp rỗng/khoảng trắng/mặc định khối, em khoá/đã nghỉ/đổi lớp,
// tick bỏ, danh sách tick có sbd lặp / phần tử số / rỗng, chọn riêng 0/1, nhiều gói ngày bắt đầu khác nhau, ca mở);
// (2) EXPLAIN QUERY PLAN: không quét `goi_bai_7_em`, `json_each` danh sách tick chỉ chạy trong bảng phụ MATERIALIZE te7 (một lần mỗi câu).
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { SQL_GOI7 } from '../server/src/goi-bai-7-schema'
import { SQL_SAN_SANG, BANG_SAN_SANG, BAN_DAU } from '../server/src/san-sang'
import { sqlTenLopHs, SQL_LUOT_GOI7 } from '../server/src/goi-bai-7'
import { sqlEmDangNhan7, sqlQuyetDinhNhan7, SQL_TE7, sqlQuyetDinhNhan7Te, sqlThemEmGoi7 } from '../server/src/goi-bai-7-quyen'
import { SQL_EM_NHAN7, sqlChotQuotaNgay7, SQL_QUOTA0_NGAY7, SQL_CHUA_NHAN7, docEmNhan7, docEmNhan7Cron, BANG_EM_NHAN7_DEM, TUOI_DEM_CRON_MS } from '../server/src/goi-bai-7-em-nhan'
import { SQL_CHON_EM_KIEM, SQL_LICH_SU_EM } from '../scripts/kiem-dong-co-chon-em'

// ---------------------------------------------------------------- CÂU CŨ (chép NGUYÊN VĂN trước 12/11)
const TL = sqlTenLopHs('h')
const CU_GOI7_EM = `SELECT e.sbd AS sbd, MIN(e.bat_dau) AS bat_dau FROM goi_bai_7_em e JOIN goi_bai_7 g ON g.id = e.goi_id
  JOIN hoc_sinh h ON h.sbd = e.sbd AND ${TL} = g.lop JOIN bai_da_day b ON b.id = g.tick_id AND b.bo_tick_luc IS NULL AND ${sqlEmDangNhan7('e','g','h')} GROUP BY e.sbd`
const CU_EM_NHAN = `SELECT DISTINCT e.sbd FROM goi_bai_7_em e JOIN goi_bai_7 g ON g.id=e.goi_id
      JOIN hoc_sinh h ON h.sbd=e.sbd AND ${TL}=g.lop JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL WHERE ${sqlEmDangNhan7('e', 'g', 'h')}`
const CU_CHUA = `SELECT x.sbd FROM (${CU_EM_NHAN}) x WHERE NOT EXISTS (SELECT 1 FROM ${BANG_SAN_SANG} s WHERE s.sbd=x.sbd AND s.ngay=? AND s.dau LIKE ?) ORDER BY x.sbd LIMIT ?`
const CU_CO = `SELECT x.sbd, s.dau, (SELECT g.created_at FROM game_v2_session g WHERE g.sbd=x.sbd ORDER BY g.created_at DESC LIMIT 1) AS gan,
        EXISTS(SELECT 1 FROM goi_bai_7_em e2 JOIN goi_bai_7 g2 ON g2.id=e2.goi_id WHERE e2.sbd=x.sbd AND g2.tao_luc > strftime('%Y-%m-%dT%H:%M:%fZ', s.luc/1000.0, 'unixepoch')) AS goi_moi
        FROM (${CU_EM_NHAN}) x JOIN ${BANG_SAN_SANG} s ON s.sbd=x.sbd AND s.ngay=? AND s.dau LIKE ?`
const CU_THEM_EM = `INSERT OR IGNORE INTO goi_bai_7_em(goi_id,sbd,bat_dau,han)
    SELECT g.id,h.sbd,g.bat_dau,g.han FROM goi_bai_7 g JOIN hoc_sinh h ON ${TL}=g.lop AND COALESCE(h.trang_thai,'')<>'khoa' JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL WHERE ${sqlQuyetDinhNhan7('g','h.sbd')} AND NOT EXISTS(SELECT 1 FROM ca WHERE trang_thai='mo')`
const MOI_THEM_EM = `INSERT OR IGNORE INTO goi_bai_7_em(goi_id,sbd,bat_dau,han)
    WITH ${SQL_TE7} SELECT g.id,h.sbd,g.bat_dau,g.han FROM goi_bai_7 g JOIN hoc_sinh h ON ${TL}=g.lop AND COALESCE(h.trang_thai,'')<>'khoa' JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL
    WHERE NOT EXISTS(SELECT 1 FROM goi_bai_7_em e WHERE e.goi_id=g.id AND e.sbd=h.sbd) AND ${sqlQuyetDinhNhan7Te('g','h.sbd')} AND NOT EXISTS(SELECT 1 FROM ca WHERE trang_thai='mo')`
const CU_QUOTA = `INSERT OR IGNORE INTO goi_bai_7_ngay(goi_id,sbd,ngay,quota)
  SELECT e.goi_id,e.sbd,?,CAST((COUNT(c.qid)+MAX(1,CAST(julianday(e.han)-julianday(?)+1 AS INT))-1)/MAX(1,CAST(julianday(e.han)-julianday(?)+1 AS INT)) AS INT)
  FROM goi_bai_7_em e JOIN goi_bai_7 g ON g.id=e.goi_id JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL
    JOIN hoc_sinh h ON h.sbd=e.sbd AND ${TL}=g.lop JOIN goi_bai_7_cau c ON c.goi_id=e.goi_id
  WHERE ${sqlEmDangNhan7('e','g','h')} AND NOT EXISTS(SELECT 1 FROM ca WHERE trang_thai='mo')
    AND NOT EXISTS(SELECT 1 FROM su_kien_hoc WHERE su_kien_hoc.sbd=e.sbd AND su_kien_hoc.qid=c.qid AND json_extract(su_kien_hoc.raw_json,'$.ht_cau_version')=c.version AND su_kien_hoc.ket_qua IS NOT NULL
      AND ngay_vn<? AND ${SQL_LUOT_GOI7})
    AND NOT EXISTS(SELECT 1 FROM goi_bai_7_gap x WHERE x.goi_id=e.goi_id AND x.sbd=e.sbd AND x.qid=c.qid AND x.version=c.version AND date(x.luc,'+7 hours')<?)
  GROUP BY e.goi_id,e.sbd,e.han`
const CU_QUOTA0 = `INSERT OR IGNORE INTO goi_bai_7_ngay(goi_id,sbd,ngay,quota) SELECT e.goi_id,e.sbd,?,0 FROM goi_bai_7_em e JOIN goi_bai_7 g ON g.id=e.goi_id JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL JOIN hoc_sinh h ON h.sbd=e.sbd AND ${TL}=g.lop WHERE ${sqlEmDangNhan7('e','g','h')} AND NOT EXISTS(SELECT 1 FROM ca WHERE trang_thai='mo')`
const CU_CHUA_NHAN = `SELECT COUNT(*) n FROM hoc_sinh h WHERE COALESCE(h.trang_thai,'')<>'khoa' AND EXISTS(
  SELECT 1 FROM goi_bai_7 g JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL
  WHERE g.lop=${TL} AND ${sqlQuyetDinhNhan7('g','h.sbd')}
    AND NOT EXISTS(SELECT 1 FROM goi_bai_7_em e WHERE e.goi_id=g.id AND e.sbd=h.sbd))`
const CU_CHON_EM_KIEM = `SELECT h.sbd,COUNT(s.khoa) n FROM hoc_sinh h LEFT JOIN su_kien_hoc s ON s.sbd=h.sbd WHERE COALESCE(h.trang_thai,'')<>'khoa' AND EXISTS(SELECT 1 FROM chien_dich c,json_each(c.sbd_json) j WHERE c.id LIKE 'hanh-trinh-v3-khoi-%' AND c.trang_thai='dang_chay' AND j.value=h.sbd) GROUP BY h.sbd ORDER BY n DESC,h.sbd LIMIT 1`

// ---------------------------------------------------------------- DỮ LIỆU GIẢ ĐỦ CA
const NGAY = '2026-11-12'
function rnd(seed: number) { let x = seed; return () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648 } }
type Kho = ReturnType<typeof taoD1That>
function taoKho(seed: number, bien: { caMo?: boolean; ngayCo?: boolean } = {}): Kho {
  const d = taoD1That()
  for (const s of [...SQL_GOI7, ...SQL_SAN_SANG]) d.sql.exec(s)
  const r = rnd(seed)
  // cột NOT NULL không có mặc định mà dữ liệu giả không nêu ⇒ '' (không ảnh hưởng câu đang so)
  const cot = new Map<string, { name: string; notnull: number; dflt_value: unknown; pk: number }[]>()
  const ins = (t: string, o0: Record<string, unknown>) => {
    if (!cot.has(t)) cot.set(t, d.sql.prepare(`SELECT name, "notnull", dflt_value, pk FROM pragma_table_info('${t}')`).all() as never)
    const o = { ...o0 }
    for (const c of cot.get(t)!) if (!(c.name in o) && c.notnull && c.dflt_value == null && !c.pk) o[c.name] = ''
    const k = Object.keys(o)
    d.sql.prepare(`INSERT INTO ${t}(${k.join(',')}) VALUES(${k.map(() => '?').join(',')})`).run(...(k.map((x) => o[x]) as never[]))
  }
  const LOP = ['10 - A', '11 - A', '12 - Lớp Thường', '12 - Tinh Hoa', 'Chưa xếp lớp', '11']
  const hs: { sbd: string; lop: string }[] = []
  for (let i = 0; i < 90; i++) {
    const l = LOP[i % LOP.length]!
    // tên lớp hiệu lực theo nhiều đường: gán thẳng · rỗng/khoảng trắng ⇒ theo khối ('12' ⇒ Lớp Thường, '' ⇒ Chưa xếp lớp, ' 11 ' ⇒ '11')
    let lop = l.slice(0, 2), ten: string | null = l
    if (l === '12 - Lớp Thường' && i % 2) { ten = i % 4 === 1 ? '' : null; lop = '12' }
    if (l === 'Chưa xếp lớp') { ten = i % 3 ? '  ' : null; lop = '' }
    if (l === '11') { ten = null; lop = ' 11 ' }
    const sbd = i === 7 ? '123' : `HS${String(i).padStart(3, '0')}`
    ins('hoc_sinh', { sbd, ho_ten: `Em ${i}`, lop, ten_lop: ten, trang_thai: i % 13 === 0 ? 'khoa' : i % 17 === 0 ? 'da_nghi' : i % 3 === 0 ? null : 'hoat_dong' })
    hs.push({ sbd, lop: l })
  }
  const cua = (l: string) => hs.filter((h) => h.lop === l).map((h) => h.sbd)
  let n = 0
  for (const l of LOP) for (let k = 0; k < 5; k++) {
    const id = `b${n++}`, bd = `2026-11-0${1 + k}`
    ins('bai_da_day', { id, lop: l, khoa_bai: `k${k}`, ten_bai: `Bài ${k}`, vi_tri: k, ma_to_json: '[]', tick_luc: `${bd}T00:00:00Z`, bo_tick_luc: k < 2 ? '2026-11-05T00:00:00Z' : null })
    ins('goi_bai_7', { id: `g7:${id}`, tick_id: id, lop: l, khoa_bai: `k${k}`, ten: `Bài ${k}`, bat_dau: bd, han: `2026-11-${10 + k}`, tao_luc: `${bd}T0${k}:00:00.000Z` })
    const ds = cua(l)
    for (const s of ds) if (r() < 0.8) ins('goi_bai_7_em', { goi_id: `g7:${id}`, sbd: s, bat_dau: r() < 0.2 ? '2026-10-30' : bd, han: `2026-11-${10 + k}` })
    // em lớp khác còn dòng cũ (đổi lớp) — không được tính
    ins('goi_bai_7_em', { goi_id: `g7:${id}`, sbd: cua(LOP[(LOP.indexOf(l) + 1) % LOP.length]!)[k]!, bat_dau: '2026-10-01', han: '2026-11-20' })
    // danh sách tick: có sbd lặp, phần tử số 123 (so với sbd '123'), danh sách rỗng
    if (k % 3 === 0) ins('goi_bai_7_tick_em', { tick_id: id, sbd_json: JSON.stringify([...ds.filter(() => r() < 0.7), ds[0], 123, 'NGOAI']), luc: 'x' })
    if (k === 4 && l === '11 - A') ins('goi_bai_7_tick_em', { tick_id: id, sbd_json: '[]', luc: 'x' })
    for (const s of ds) if (r() < 0.12) ins('goi_bai_7_chon_em', { goi_id: `g7:${id}`, sbd: s, nhan: r() < 0.5 ? 1 : 0, luc: 'x' })
    for (let q = 0; q < 6; q++) ins('goi_bai_7_cau', { goi_id: `g7:${id}`, qid: `q${k}-${q}`, version: 'v1', ma_de: 'm', meta_json: '{}' })
  }
  // sổ: câu đã làm trước hôm nay (đúng bản / sai bản / hôm nay) + đã gặp
  let sk = 0
  for (const h of hs) for (let q = 0; q < 6; q++) {
    if (r() < 0.25) ins('su_kien_hoc', { khoa: `sk${sk++}`, sbd: h.sbd, qid: `q${q % 5}-${q}`, nguon: 'luyen', ma_nguon: 'x', ket_qua: r() < 0.9 ? 1 : null, luc: 'x', ngay_vn: r() < 0.8 ? '2026-11-10' : NGAY, raw_json: JSON.stringify({ ht_cau_version: r() < 0.8 ? 'v1' : 'v0' }) })
    if (r() < 0.1) ins('goi_bai_7_gap', { receipt: `r${sk++}`, goi_id: `g7:b${(q * 7) % 30}`, sbd: h.sbd, qid: `q${q % 5}-${q}`, version: 'v1', kieu: 'x', luc: r() < 0.7 ? '2026-11-10T03:00:00Z' : '2026-11-12T03:00:00Z' })
  }
  // em chưa có dòng nhận gói (để câu thêm em / đếm chưa nhận có việc)
  d.sql.exec(`DELETE FROM goi_bai_7_em WHERE sbd IN ('HS004','HS010','HS022') AND goi_id IN ('g7:b4','g7:b9','g7:b13','g7:b14')`)
  // chiến dịch ba hành trình (+ chiến dịch khác / đã xong), sbd lặp và phần tử số
  ins('chien_dich', { id: 'hanh-trinh-v3-khoi-12', ten: 'x', sbd_json: JSON.stringify([...hs.slice(0, 40).map((h) => h.sbd), 'HS001', 123]), ma_de_json: '[]', qid_json: '[]', han_nop: 'x', tao_luc: 'x', trang_thai: 'dang_chay' })
  ins('chien_dich', { id: 'hanh-trinh-v3-khoi-11', ten: 'x', sbd_json: JSON.stringify(hs.slice(30, 70).map((h) => h.sbd)), ma_de_json: '[]', qid_json: '[]', han_nop: 'x', tao_luc: 'x', trang_thai: 'dang_chay' })
  ins('chien_dich', { id: 'hanh-trinh-v3-khoi-10', ten: 'x', sbd_json: JSON.stringify(hs.slice(60).map((h) => h.sbd)), ma_de_json: '[]', qid_json: '[]', han_nop: 'x', tao_luc: 'x', trang_thai: 'xong' })
  ins('chien_dich', { id: 'khac', ten: 'x', sbd_json: JSON.stringify(hs.map((h) => h.sbd)), ma_de_json: '[]', qid_json: '[]', han_nop: 'x', tao_luc: 'x', trang_thai: 'dang_chay' })
  // sảnh: một số em đã có bản hôm nay (đúng/sai dấu), phiên gần nhất
  hs.forEach((h, i) => {
    if (i % 3 === 0) ins(BANG_SAN_SANG, { sbd: h.sbd, ngay: NGAY, luc: Date.parse(`2026-11-0${1 + (i % 6)}T02:00:00Z`), dau: i % 2 ? `${BAN_DAU}§x` : 'v5§x' })
    if (i % 4 === 0) ins('game_v2_session', { id: `s${i}`, sbd: h.sbd, json: '{}', created_at: `2026-11-1${i % 3}T00:00:00Z` })
  })
  if (bien.ngayCo) d.sql.exec(`INSERT OR IGNORE INTO goi_bai_7_ngay(goi_id,sbd,ngay,quota) SELECT goi_id,sbd,'${NGAY}',99 FROM goi_bai_7_em WHERE rowid % 3 = 0`)
  if (bien.caMo) ins('ca', { ma_ca: 'CA1', trang_thai: 'mo' })
  return d
}
const tat = (d: Kho, q: string, ...b: unknown[]) => d.sql.prepare(q).all(...(b as never[])) as Record<string, unknown>[]
const bang = (d: Kho, t: string) => tat(d, `SELECT * FROM ${t} ORDER BY 1,2,3`)
const keHoach = (d: Kho, q: string, ...b: unknown[]) => d.sql.prepare('EXPLAIN QUERY PLAN ' + q).all(...(b as never[])) as { id: number; parent: number; detail: string }[]
/** Mỗi lần `json_each` (VIRTUAL TABLE) chạy phải nằm dưới nút `MATERIALIZE te7` (bung một lần), không dưới vòng của từng dòng. */
function jsonChiTrongTe7(kh: { id: number; parent: number; detail: string }[], nut = /^MATERIALIZE te7$/): boolean {
  const theo = new Map(kh.map((x) => [x.id, x]))
  return kh.filter((x) => /VIRTUAL TABLE/.test(x.detail)).every((x) => {
    for (let p = theo.get(x.parent); p; p = theo.get(p.parent)) if (nut.test(p.detail)) return true
    return false
  })
}

describe('G4 — danh sách em đang nhận Gói 7 (bai-hang-ngay.ts / san-sang.ts)', () => {
  it('SQL_EM_NHAN7 y hệt câu cũ (cùng tập em, cùng ngày bắt đầu sớm nhất, cùng thứ tự sbd)', async () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const d = taoKho(seed)
      const cu = tat(d, CU_GOI7_EM), moi = tat(d, SQL_EM_NHAN7)
      expect(cu.length).toBeGreaterThan(20)
      expect(moi).toEqual(cu)
      expect((await docEmNhan7(d.env)).map((x) => x.sbd)).toEqual(cu.map((x) => x.sbd))
      // em có phần tử số 123 trong danh sách tick: so sánh theo cùng luật ái lực như json_each cũ
      expect(moi.some((x) => x.sbd === '123')).toBe(cu.some((x) => x.sbd === '123'))
    }
  })
  it('cron Sảnh: hai câu đọc danh sách một lần qua json_each — `chua` / `co` y hệt câu cũ', () => {
    for (const seed of [1, 2, 3]) {
      const d = taoKho(seed)
      const ds = JSON.stringify(tat(d, SQL_EM_NHAN7).map((x) => x.sbd))
      for (const toiDa of [1, 5, 500]) {
        const cu = tat(d, CU_CHUA, NGAY, BAN_DAU + '§%', toiDa)
        const moi = tat(d, `SELECT x.value AS sbd FROM json_each(?) x WHERE NOT EXISTS (SELECT 1 FROM ${BANG_SAN_SANG} s WHERE s.sbd=x.value AND s.ngay=? AND s.dau LIKE ?) ORDER BY x.value LIMIT ?`, ds, NGAY, BAN_DAU + '§%', toiDa)
        expect(moi).toEqual(cu)
      }
      const xep = (a: Record<string, unknown>[]) => [...a].sort((x, y) => String(x.sbd).localeCompare(String(y.sbd)))
      const coCu = tat(d, CU_CO, NGAY, BAN_DAU + '§%')
      const coMoi = tat(d, `SELECT x.value AS sbd, s.dau, (SELECT g.created_at FROM game_v2_session g WHERE g.sbd=x.value ORDER BY g.created_at DESC LIMIT 1) AS gan,
        EXISTS(SELECT 1 FROM goi_bai_7_em e2 JOIN goi_bai_7 g2 ON g2.id=e2.goi_id WHERE e2.sbd=x.value AND g2.tao_luc > strftime('%Y-%m-%dT%H:%M:%fZ', s.luc/1000.0, 'unixepoch')) AS goi_moi
        FROM json_each(?) x JOIN ${BANG_SAN_SANG} s ON s.sbd=x.value AND s.ngay=? AND s.dau LIKE ? ORDER BY x.value`, ds, NGAY, BAN_DAU + '§%')
      expect(coCu.length).toBeGreaterThan(3)
      expect(xep(coMoi)).toEqual(xep(coCu))
    }
  })
  it('mã san-sang.ts dùng đúng câu mới (đọc danh sách một lần, json_each)', async () => {
    const { readFileSync } = await import('node:fs')
    const m = readFileSync('server/src/san-sang.ts', 'utf8')
    expect(m).toContain("docEmNhan7Cron(env, now)")
    expect(m).not.toMatch(/FROM \(\$\{emNhan\}\) x/)
    expect((m.match(/FROM json_each\(\?\) x/g) ?? []).length).toBe(2)
  })
  it('EXPLAIN: đi từ tick còn hoạt động, không quét goi_bai_7_em / hoc_sinh, json_each chỉ trong te7', () => {
    const d = taoKho(1)
    const kh = keHoach(d, SQL_EM_NHAN7)
    const chu = kh.map((x) => x.detail)
    expect(chu.filter((x) => /^SCAN (e|h|g|goi_bai_7_em|hoc_sinh)\b/.test(x)), chu.join('\n')).toEqual([])
    expect(chu.some((x) => /^SEARCH e USING (COVERING )?INDEX sqlite_autoindex_goi_bai_7_em_1 \(goi_id=\?\)/.test(x)), chu.join('\n')).toBe(true)
    expect(chu.some((x) => /AUTOMATIC COVERING INDEX \(tick_id=\? AND sbd=\?\)/.test(x)), chu.join('\n')).toBe(true)
    expect(jsonChiTrongTe7(kh), chu.join('\n')).toBe(true)
    // câu cũ: json_each chạy theo từng dòng gói×em (nằm trong CORRELATED SCALAR SUBQUERY)
    expect(jsonChiTrongTe7(keHoach(d, CU_GOI7_EM))).toBe(false)
  })
})

describe('G4 — bản dùng chung cho cron (docEmNhan7Cron, lệch tối đa 5 phút)', () => {
  it('lần đầu tính thẳng + ghi đệm; trong 5 phút đọc MỘT dòng đệm; quá 5 phút / đồng hồ lùi ⇒ tính lại', async () => {
    const d = taoKho(2)
    const dung = (await docEmNhan7(d.env))
    const t0 = Date.parse('2026-11-12T03:00:00Z')
    expect(await docEmNhan7Cron(d.env, t0)).toEqual(dung)
    expect(tat(d, `SELECT luc FROM ${BANG_EM_NHAN7_DEM}`)).toEqual([{ luc: t0 }])
    // dữ liệu đổi (em mới nhận gói) — trong hạn vẫn bản cũ (đúng giới hạn đã nêu), hết hạn ⇒ bản mới
    d.sql.prepare(MOI_THEM_EM).run()
    const moi = await docEmNhan7(d.env)
    expect(moi).not.toEqual(dung)
    expect(await docEmNhan7Cron(d.env, t0 + TUOI_DEM_CRON_MS - 1)).toEqual(dung)
    expect(await docEmNhan7Cron(d.env, t0 + TUOI_DEM_CRON_MS)).toEqual(moi)
    expect(await docEmNhan7Cron(d.env, t0)).toEqual(moi) // đồng hồ lùi ⇒ không tin đệm, tính lại
  })
  it('đệm hỏng ⇒ tính thẳng, không bao giờ sai hơn câu thẳng', async () => {
    const d = taoKho(3)
    await docEmNhan7Cron(d.env, 1000)
    d.sql.exec(`UPDATE ${BANG_EM_NHAN7_DEM} SET json='{hong'`)
    expect(await docEmNhan7Cron(d.env, 2000)).toEqual(await docEmNhan7(d.env))
  })
  it('chỉ cron dùng bản đệm: lệnh thầy (docDanhSachEm không có cronNow) luôn đọc thẳng', async () => {
    const { readFileSync } = await import('node:fs')
    const bhn = readFileSync('server/src/bai-hang-ngay.ts', 'utf8')
    expect(bhn).toContain('cronNow !== undefined ? await docEmNhan7Cron(env, cronNow)')
    expect(readFileSync('server/src/bon-chi-so-d1.ts', 'utf8').match(/docDanhSachEm\(env, \[\], nowMs\)/g)?.length).toBe(1)
    for (const f of ['server/src/nhip-hoc.ts', 'server/src/nhip-hoc-dem.ts']) expect(readFileSync(f, 'utf8')).not.toMatch(/docDanhSachEm\([^)]*,[^)]*,/)
  })
})

describe('G4 — thêm em vào gói (goi-bai-7.ts dongBoThat7)', () => {
  it('bảng goi_bai_7_em sau lệnh y hệt câu cũ (kể cả khi ca mở ⇒ không thêm gì)', () => {
    for (const [seed, bien] of [[1, {}], [2, {}], [3, { caMo: true }]] as const) {
      const a = taoKho(seed, bien), b = taoKho(seed, bien)
      const r1 = a.sql.prepare(CU_THEM_EM).run(), r2 = b.sql.prepare(MOI_THEM_EM).run()
      expect(Number(r2.changes)).toBe(Number(r1.changes))
      if (!('caMo' in bien)) expect(Number(r1.changes)).toBeGreaterThan(0)
      expect(bang(b, 'goi_bai_7_em')).toEqual(bang(a, 'goi_bai_7_em'))
      // lần hai: không còn gì để thêm ở cả hai
      expect(Number(b.sql.prepare(MOI_THEM_EM).run().changes)).toBe(Number(a.sql.prepare(CU_THEM_EM).run().changes))
    }
  })
  it('mã goi-bai-7.ts dùng đúng câu mới', async () => {
    const { readFileSync } = await import('node:fs')
    expect(readFileSync('server/src/goi-bai-7.ts', 'utf8')).toContain("await env.DB.prepare(sqlThemEmGoi7(sqlTenLopHs('h'),KHONG_CA)).run()")
    expect(sqlThemEmGoi7(TL, "NOT EXISTS(SELECT 1 FROM ca WHERE trang_thai='mo')")).toBe(MOI_THEM_EM)
  })
  it('EXPLAIN: dò khoá chính goi_bai_7_em, json_each chỉ trong te7', () => {
    const kh = keHoach(taoKho(1), MOI_THEM_EM)
    expect(kh.some((x) => /SEARCH e USING COVERING INDEX sqlite_autoindex_goi_bai_7_em_1 \(goi_id=\? AND sbd=\?\)/.test(x.detail))).toBe(true)
    expect(jsonChiTrongTe7(kh), kh.map((x) => x.detail).join('\n')).toBe(true)
  })
})

describe('G4 — bước «Áp bài gần nhất» (scripts/ap-goi7-song.ts)', () => {
  it('chốt quota + quota 0: bảng goi_bai_7_ngay y hệt câu cũ (chưa có dòng / đã có một phần dòng hôm nay / ca mở)', () => {
    for (const [seed, bien] of [[1, {}], [2, { ngayCo: true }], [3, {}], [4, { caMo: true }]] as const) {
      const a = taoKho(seed, bien), b = taoKho(seed, bien)
      a.sql.prepare(CU_QUOTA).run(NGAY, NGAY, NGAY, NGAY, NGAY); a.sql.prepare(CU_QUOTA0).run(NGAY)
      b.sql.prepare(sqlChotQuotaNgay7(SQL_LUOT_GOI7)).run(NGAY); b.sql.prepare(SQL_QUOTA0_NGAY7).run(NGAY)
      const x = bang(a, 'goi_bai_7_ngay')
      if (!('caMo' in bien)) expect(x.some((r) => Number(r.quota) > 0 && Number(r.quota) < 99)).toBe(true)
      expect(bang(b, 'goi_bai_7_ngay')).toEqual(x)
    }
  })
  it('đếm «đã chọn mà chưa nhận gói» y hệt câu cũ', () => {
    for (const seed of [1, 2, 3]) {
      const d = taoKho(seed)
      const cu = tat(d, CU_CHUA_NHAN)[0]!.n
      expect(Number(cu)).toBeGreaterThan(0)
      expect(tat(d, SQL_CHUA_NHAN7)[0]!.n).toBe(cu)
      d.sql.prepare(MOI_THEM_EM).run()
      expect(tat(d, SQL_CHUA_NHAN7)[0]!.n).toBe(tat(d, CU_CHUA_NHAN)[0]!.n)
      expect(Number(tat(d, SQL_CHUA_NHAN7)[0]!.n)).toBe(0)
    }
  })
  it('EXPLAIN: quota / quota 0 không quét goi_bai_7_em, json_each chỉ trong te7; câu đếm dò khoá chính trước', () => {
    const d = taoKho(1)
    for (const [q, b] of [[sqlChotQuotaNgay7(SQL_LUOT_GOI7), [NGAY]], [SQL_QUOTA0_NGAY7, [NGAY]], [SQL_CHUA_NHAN7, []]] as const) {
      const kh = keHoach(d, q, ...b), chu = kh.map((x) => x.detail)
      expect(chu.filter((x) => /^SCAN (e|goi_bai_7_em)\b/.test(x)), chu.join('\n')).toEqual([])
      expect(jsonChiTrongTe7(kh), chu.join('\n')).toBe(true)
    }
    expect(keHoach(d, sqlChotQuotaNgay7(SQL_LUOT_GOI7), NGAY).some((x) => /SEARCH n USING COVERING INDEX sqlite_autoindex_goi_bai_7_ngay_1 \(goi_id=\? AND sbd=\? AND ngay=\?\)/.test(x.detail))).toBe(true)
  })
})

describe('G4 — chọn em cho bước kiểm động cơ (scripts/kiem-dong-co-chon-em.ts)', () => {
  it('?1 = -1 (không giới hạn) y hệt câu cũ; giới hạn N chỉ đếm N sự kiện mới nhất; tổng lịch sử đúng', () => {
    for (const seed of [1, 2, 3]) {
      const d = taoKho(seed)
      const cu = tat(d, CU_CHON_EM_KIEM)
      expect(cu.length).toBe(1)
      expect(tat(d, SQL_CHON_EM_KIEM, -1)).toEqual(cu)
      expect(tat(d, SQL_LICH_SU_EM, cu[0]!.sbd)[0]!.n).toBe(cu[0]!.n)
      const gan = tat(d, SQL_CHON_EM_KIEM, 20)[0]!
      const moiNhat = tat(d, 'SELECT sbd FROM su_kien_hoc ORDER BY rowid DESC LIMIT 20').map((x) => x.sbd)
      expect(Number(gan.n)).toBe(moiNhat.filter((s) => s === gan.sbd).length)
    }
  })
  it('EXPLAIN: danh sách ba hành trình bung một lần (LIST SUBQUERY, không tương quan), sổ chỉ đọc ?1 dòng mới nhất', () => {
    const kh = keHoach(taoKho(1), SQL_CHON_EM_KIEM, 5000), chu = kh.map((x) => x.detail)
    expect(jsonChiTrongTe7(kh, /^LIST SUBQUERY/), chu.join('\n')).toBe(true)
    expect(chu.some((x) => /CORRELATED/.test(x)), chu.join('\n')).toBe(false)
    expect(chu.some((x) => /^SCAN su_kien_hoc$/.test(x)), chu.join('\n')).toBe(true) // theo rowid giảm dần, dừng ở LIMIT
  })
})
