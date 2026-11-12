// @vitest-environment node
// NHÓM H2 (12/11, đợt 3 giảm chi phí D1): câu GỌI RẤT NHIỀU, mỗi lượt đọc vài chục–vài trăm hàng. Bản mới phải cho KẾT QUẢ Y HỆT bản cũ
// (so trên D1 thật trong bộ nhớ — node:sqlite, lược đồ thật của repo) + EXPLAIN QUERY PLAN chứng minh không còn quét bảng.
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { caDangBaoVe } from '../server/src/game-v2-bank'
import { chayDdlMotLan, lamMoiTenDoiTuongChung, SQL_TEN_DOI_TUONG, SQL_TEN_DOI_TUONG_CU } from '../server/src/ddl-mot-lan'
import { dauKhoCau, SQL_DAU_KHO_CAU_CU } from '../server/src/dau-kho-cau'
import { SQL_VAN_TAY, SQL_VAN_TAY_CU } from '../server/src/hanh-trinh-hop-nhat'
import type { Env } from '../server/src/kieu'

type Row = Record<string, unknown>
const keHoach = (sql: { prepare(s: string): { all(...a: unknown[]): unknown[] } }, q: string, ...b: unknown[]) =>
  (sql.prepare('EXPLAIN QUERY PLAN ' + q).all(...b) as { detail: string }[]).map((r) => r.detail)

// ---------------------------------------------------------------- (2)(3) bảng ca
/** Câu caDangBaoVe CŨ (trước 12/11 H2) — chép NGUYÊN VĂN. */
const SQL_CA_BAO_VE_CU = `SELECT ca.ma_ca,ca.bank_r2,ca.cap_nhat_luc,ca.trang_thai,ca.cong_bo,ca.het_han_vao,ca.thoi_gian_phut,ca.loai,ca.han_nop,ca.bat_dau,
    CASE WHEN ca.trang_thai<>'dong' THEN (SELECT COUNT(*) FROM luot l WHERE l.ma_ca=ca.ma_ca) ELSE 0 END entered,
    CASE WHEN ca.trang_thai<>'dong' THEN (SELECT COUNT(*) FROM luot l WHERE l.ma_ca=ca.ma_ca AND l.trang_thai='da_nop') ELSE 0 END submitted,
    CASE WHEN ca.trang_thai<>'dong' THEN (SELECT COUNT(*) FROM luot l WHERE l.ma_ca=ca.ma_ca AND l.trang_thai='dang_lam' AND (l.het_gio_luc IS NULL OR l.het_gio_luc>?)) ELSE 0 END active
    FROM ca WHERE ca.trang_thai<>'da_xoa' AND (ca.trang_thai='mo' OR COALESCE(NULLIF(ca.bat_dau,''),ca.cap_nhat_luc)>=?) ORDER BY ca.ma_ca`

function datCa(now: number) {
  const d = taoD1That()
  const iso = (ms: number) => new Date(ms).toISOString()
  const TT = ['mo', 'dong', 'da_xoa', 'la', ''], CB = ['khong', 'ngay', 'ca_lop_xong', null, '', 'NGAY', ' ngay'], LOAI = ['thi', 'baitap', null]
  const LUOT = [[], ['da_nop'], ['da_nop', 'dang_lam'], ['dang_lam_het'], ['khoa', 'da_nop']]
  const GIO = [{ bd: iso(now - 3 * 3600e3), het: iso(now - 2 * 3600e3), han: iso(now - 3600e3), cn: '2026-09-01T00:00:00.000Z' },
    { bd: iso(now + 3600e3), het: iso(now + 2 * 3600e3), han: iso(now + 3600e3), cn: '2026-09-01T00:00:00.000Z' },
    { bd: '', het: '', han: '', cn: iso(now - 86400e3) }, { bd: '', het: '', han: '', cn: '2026-09-01T00:00:00.000Z' },
    { bd: '2026-09-20T00:00:00.000Z', het: '', han: '', cn: iso(now) }, { bd: null, het: null, han: null, cn: '2026-09-28T17:00:00.000Z' }]
  const themCa = d.sql.prepare(`INSERT INTO ca(ma_ca,trang_thai,cong_bo,loai,bat_dau,het_han_vao,han_nop,thoi_gian_phut,bank_r2,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?)`)
  const themLuot = d.sql.prepare(`INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,trang_thai,het_gio_luc,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?)`)
  let n = 0
  for (const tt of TT) for (const cb of CB) for (const loai of LOAI) for (const g of GIO) for (const ls of LUOT) {
    const ma = `c${String(n++).padStart(5, '0')}`
    themCa.run(ma, tt, cb, loai, g.bd, g.het, g.han, 30, n % 7 ? `de/${ma}.json` : null, g.cn)
    ls.forEach((t, i) => themLuot.run(`${ma}|E${i}|1`, ma, `E${i}`, 1, iso(now), t === 'dang_lam_het' ? 'dang_lam' : t, t === 'dang_lam_het' ? iso(now - 60e3) : t === 'dang_lam' ? iso(now + 600e3) : null, iso(now)))
  }
  return { d, n }
}

describe('(2)(3) bảng ca — chỉ mục trạng thái + chỉ mục bộ phận ca còn bảo vệ', () => {
  const now = Date.parse('2026-11-12T12:00:00Z')
  it('caDangBaoVe: DÒNG trả về (đủ cột, đúng thứ tự) y hệt câu cũ + bộ lọc JS, mọi tổ hợp trạng thái × công bố × loại × giờ × lượt', async () => {
    const { d, n } = datCa(now)
    const moi = await caDangBaoVe(d.env, now)
    const goc = d.env.DB
    let thay = 0
    const envCu = { ...d.env, DB: { ...goc, prepare: (s: string) => { thay++; return goc.prepare(SQL_CA_BAO_VE_CU) } } } as unknown as Env
    const cu = await caDangBaoVe(envCu, now)
    expect(thay).toBe(1)
    expect(cu.length).toBeGreaterThan(50)
    expect(cu.length).toBeLessThan(n)
    expect(moi).toEqual(cu)
    // Câu MỚI trả ÍT dòng thô hơn (ca đã đóng đã công bố không còn đọc) mà vẫn đủ mọi ca còn bảo vệ.
    const tho = (q: string) => (d.sql.prepare(q).all(new Date(now).toISOString(), '2026-09-28T17:00:00.000Z') as Row[]).length
    let qMoi = ''
    await caDangBaoVe({ ...d.env, DB: { ...goc, prepare: (s: string) => { qMoi = s; return goc.prepare(s) } } } as unknown as Env, now)
    expect(tho(qMoi)).toBeLessThan(tho(SQL_CA_BAO_VE_CU))
  })
  it('EXPLAIN: caDangBaoVe đi chỉ mục bộ phận idx_ca_bao_ve (không SCAN ca); đếm/kiểm ca mở SEARCH idx_ca_trang_thai', async () => {
    const { d } = datCa(now)
    let qMoi = ''
    const goc = d.env.DB
    await caDangBaoVe({ ...d.env, DB: { ...goc, prepare: (s: string) => { qMoi = s; return goc.prepare(s) } } } as unknown as Env, now)
    const kh = keHoach(d.sql, qMoi, 'x', 'y')
    expect(kh.some((x) => /^SCAN ca USING INDEX idx_ca_bao_ve/.test(x)), kh.join('\n')).toBe(true)
    expect(kh.filter((x) => /^SCAN (ca|l|luot)\b(?! USING INDEX idx_ca_bao_ve)/.test(x)), kh.join('\n')).toEqual([])
    expect(kh.filter((x) => /TEMP B-TREE/.test(x)), kh.join('\n')).toEqual([])
    for (const q of ["SELECT COUNT(*) AS n FROM ca WHERE trang_thai='mo'", "SELECT 1 FROM ca WHERE trang_thai='mo' LIMIT 1", "SELECT COUNT(*) n FROM ca WHERE trang_thai='mo'"]) {
      const k = keHoach(d.sql, q)
      expect(k.some((x) => /^SEARCH ca USING COVERING INDEX idx_ca_trang_thai \(trang_thai=\?\)/.test(x)), `${q}\n${k.join('\n')}`).toBe(true)
    }
  })
})

// ---------------------------------------------------------------- (4) tên đối tượng lược đồ — bản sao dùng chung
describe('(4) ddl-mot-lan: danh sách tên đối tượng dùng chung (ddl_ten_chung) thay cho đọc sqlite_master mỗi isolate', () => {
  const LENH = ['CREATE TABLE IF NOT EXISTS h2_thu (id TEXT PRIMARY KEY, x TEXT)', 'CREATE INDEX IF NOT EXISTS idx_h2_thu_x ON h2_thu(x)']
  /** Isolate mới = D1 gốc mới (đối tượng khác) trên cùng dữ liệu; đếm lô ghi + câu đọc. */
  const isolate = (d: ReturnType<typeof taoD1That>) => {
    const goc = d.env.DB as unknown as { prepare(q: string): unknown; batch(x: unknown[]): unknown }
    const dem = { lo: 0, doc: [] as string[] }
    const env = { ...d.env, DB: { prepare: (q: string) => { dem.doc.push(q); return goc.prepare(q) }, batch: (x: unknown[]) => { dem.lo++; return goc.batch(x) } } } as unknown as Env
    return { env, dem }
  }
  it('chưa có dòng chép ⇒ tên đọc từ sqlite_master (MỘT câu, như cũ); có dòng chép ⇒ dùng bản chép; bảng đã có ⇒ không lô ghi', async () => {
    const d = taoD1That()
    const a = isolate(d)
    await chayDdlMotLan(a.env, 'h2_thu', LENH)
    expect(a.dem.lo).toBe(1) // bảng chưa có ⇒ một lô tạo
    expect(a.dem.doc.filter((q) => q === SQL_TEN_DOI_TUONG)).toHaveLength(1)
    // isolate mới, chưa có bản chép ⇒ nhánh sqlite_master thấy bảng ⇒ không lô
    const b = isolate(d)
    await chayDdlMotLan(b.env, 'h2_thu', LENH)
    expect(b.dem.lo).toBe(0)
    expect(b.dem.doc).toEqual([SQL_TEN_DOI_TUONG])
    // cron chép ⇒ bản chép đủ tên; câu đọc trả MỘT dòng (k = 1), nhánh sqlite_master không trả gì
    expect(await lamMoiTenDoiTuongChung(d.env, 1)).toBe(true)
    const r = d.sql.prepare(SQL_TEN_DOI_TUONG).all() as { k: number; t: string }[]
    expect(r).toHaveLength(1)
    expect(r[0]!.k).toBe(1)
    const ten = new Set(JSON.parse(r[0]!.t) as string[])
    const that = new Set((d.sql.prepare(SQL_TEN_DOI_TUONG_CU).all() as { name: string }[]).map((x) => x.name))
    expect(ten).toEqual(that)
    const c = isolate(d)
    await chayDdlMotLan(c.env, 'h2_thu', LENH)
    expect(c.dem.lo).toBe(0)
    // bản chép CŨ thiếu tên mới (bảng tạo sau lần chép) ⇒ chạy lô IF NOT EXISTS như trước 31/10 (vô hại), lần chép sau có tên
    const LENH2 = ['CREATE TABLE IF NOT EXISTS h2_thu_2 (id TEXT PRIMARY KEY)']
    d.sql.exec(LENH2[0]!)
    const e = isolate(d)
    await chayDdlMotLan(e.env, 'h2_thu_2', LENH2)
    expect(e.dem.lo).toBe(1)
    await lamMoiTenDoiTuongChung(d.env, 2)
    const f = isolate(d)
    await chayDdlMotLan(f.env, 'h2_thu_2', LENH2)
    expect(f.dem.lo).toBe(0)
  })
  it('EXPLAIN: nhánh sqlite_master bị chặn bằng LIMIT khi có dòng chép (đo miniflare 663 → 2 hàng); bảng chép chưa có ⇒ lùi câu cũ, cron tự tạo bảng', async () => {
    const d = taoD1That()
    const kh = keHoach(d.sql, SQL_TEN_DOI_TUONG)
    expect(kh.filter((x) => /^SEARCH ddl_ten_chung USING INTEGER PRIMARY KEY/.test(x)).length, kh.join('\n')).toBeGreaterThanOrEqual(2)
    d.sql.exec('DROP TABLE ddl_ten_chung')
    const a = isolate(d)
    await chayDdlMotLan(a.env, 'h2_thu', LENH)
    expect(a.dem.doc.slice(0, 2)).toEqual([SQL_TEN_DOI_TUONG, SQL_TEN_DOI_TUONG_CU])
    const b = isolate(d)
    await chayDdlMotLan(b.env, 'h2_thu', LENH)
    expect(b.dem.lo).toBe(0)
    expect(await lamMoiTenDoiTuongChung(d.env, 3)).toBe(true)
    expect((d.sql.prepare(SQL_TEN_DOI_TUONG).all() as { k: number }[]).map((x) => x.k)).toEqual([1])
  })
})

// ---------------------------------------------------------------- dấu bảng do trigger giữ (11) + dấu kho
describe('dấu bảng (dau_bang) — trigger giữ dấu đúng mọi kiểu ghi', () => {
  const dau = (d: ReturnType<typeof taoD1That>, ten: string) => (d.sql.prepare('SELECT dau FROM dau_bang WHERE ten = ?').get(ten) as { dau: string } | undefined)?.dau
  it('game_v2_index: dấu luôn BẰNG ĐÚNG chuỗi cũ COUNT|MAX(indexed_at) qua thêm / thay (OR REPLACE, UPSERT) / sửa / xoá / xoá hết; dauKhoCau = câu cũ', async () => {
    const d = taoD1That()
    const cu = () => (d.sql.prepare(SQL_DAU_KHO_CAU_CU).get() as { d: string }).d
    const buoc = [
      "INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('A','v1','2026-11-01T00:00:00.000Z'),('B','v1','2026-11-02T00:00:00.000Z')",
      "INSERT OR REPLACE INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('A','v2','2026-11-03T00:00:00.000Z')",
      "INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('C','v1','2026-10-01T00:00:00.000Z') ON CONFLICT(ma_de) DO UPDATE SET indexed_at=excluded.indexed_at",
      "INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('B','v9','2026-11-05T00:00:00.000Z') ON CONFLICT(ma_de) DO UPDATE SET indexed_at=excluded.indexed_at",
      "UPDATE game_v2_index SET indexed_at='2026-11-09T00:00:00.000Z' WHERE ma_de='C'",
      "DELETE FROM game_v2_index WHERE ma_de='C'",
      'DELETE FROM game_v2_index',
      "INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('Z','v1','2026-11-10T00:00:00.000Z')",
    ]
    expect(dau(d, 'game_v2_index')).toBe(cu())
    for (const s of buoc) {
      d.sql.exec(s)
      expect(dau(d, 'game_v2_index'), s).toBe(cu())
      expect(await dauKhoCau(d.env)).toBe(cu())
    }
    // dòng dấu vắng ⇒ COALESCE tính như cũ; bảng dau_bang chưa có ⇒ lùi câu cũ
    d.sql.exec("DELETE FROM dau_bang WHERE ten='game_v2_index'")
    expect(await dauKhoCau(d.env)).toBe(cu())
    d.sql.exec('DROP TABLE dau_bang')
    for (const t of ['them', 'sua', 'xoa']) d.sql.exec(`DROP TRIGGER dau_bang_gvi_${t}`)
    expect(await dauKhoCau(d.env)).toBe(cu())
  })
  it('số phiên: MỖI lượt ghi (thêm / OR REPLACE / UPSERT / sửa / xoá) đổi dấu, không lặp lại; chiến dịch chỉ theo đúng cột vân tay', () => {
    const d = taoD1That()
    const lenh: Record<string, string[]> = {
      cau_hoi: ["INSERT INTO cau_hoi(qid,ma_de,cap_nhat_luc) VALUES('q1','A','x')", "INSERT OR REPLACE INTO cau_hoi(qid,ma_de,cap_nhat_luc) VALUES('q1','A','y')",
        "INSERT INTO cau_hoi(qid,ma_de,cap_nhat_luc) VALUES('q1','A','z') ON CONFLICT(qid) DO UPDATE SET cap_nhat_luc=excluded.cap_nhat_luc", "UPDATE cau_hoi SET muc_do='NB'", "DELETE FROM cau_hoi"],
      game_v2_question: ["INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES('A','q1','1','g','d','{}')",
        "UPDATE game_v2_question SET json='{\"reviewed\":true}'", "DELETE FROM game_v2_question"],
      omni_q: ["INSERT INTO omni_q(qid,y,vkn_json,nguon) VALUES('q1',-1,'[]','thay')", "INSERT OR REPLACE INTO omni_q(qid,y,vkn_json,nguon) VALUES('q1',-1,'[\"a\"]','thay')",
        "UPDATE omni_q SET duyet_luc='x'", "DELETE FROM omni_q"],
      omni_beta_cau: ["INSERT INTO omni_beta_cau(qid,beta,n,cap_nhat_luc) VALUES('q1',1.5,3,'d')", "INSERT OR REPLACE INTO omni_beta_cau(qid,beta,n,cap_nhat_luc) VALUES('q1',2,3,'d')",
        'UPDATE omni_beta_cau SET n=4', 'DELETE FROM omni_beta_cau'],
      chien_dich: ["INSERT INTO chien_dich(id,ten,sbd_json,ma_de_json,qid_json,han_nop,tao_luc) VALUES('c1','T','[]','[]','[]','2026-12-01','x')",
        "UPDATE chien_dich SET trang_thai='da_dong'", "UPDATE chien_dich SET han_nop='2026-12-09'", 'UPDATE chien_dich SET the_luc_ngay=36', 'UPDATE chien_dich SET huyet_chien=0',
        "UPDATE chien_dich SET tao_luc='y'", "DELETE FROM chien_dich"],
    }
    for (const [ten, ds] of Object.entries(lenh)) {
      const da = new Set([dau(d, ten)])
      expect(Number(dau(d, ten))).toBeGreaterThan(1.7e12) // mồi bằng mốc ms
      for (const s of ds) { d.sql.exec(s); const v = dau(d, ten); expect(da.has(v), `${ten}: ${s}`).toBe(false); da.add(v) }
    }
    d.sql.exec("INSERT INTO chien_dich(id,ten,sbd_json,ma_de_json,qid_json,han_nop,tao_luc) VALUES('c2','T','[]','[]','[]','2026-12-01','x')")
    const v = dau(d, 'chien_dich')
    d.sql.exec("UPDATE chien_dich SET ten='T2', sbd_json='[\"E1\"]', qid_json='[\"q\"]', dong_luc='z'") // cột KHÔNG thuộc vân tay ⇒ dấu giữ nguyên (như chuỗi cũ)
    expect(dau(d, 'chien_dich')).toBe(v)
  })
  it('vân tay Hành trình: chuỗi cũ đổi ⇒ chuỗi mới đổi (không bỏ sót lượt gộp); phần kho y hệt; EXPLAIN chỉ SEARCH dau_bang', () => {
    const d = taoD1That()
    const doc = (q: string) => d.sql.prepare(q).get('hanh_trinh_v3_van_tay') as { kho: string; ch: string; cd: string }
    const ops = [
      "INSERT INTO cau_hoi(qid,ma_de,cap_nhat_luc) VALUES('q1','A','2026-11-01')", "INSERT INTO cau_hoi(qid,ma_de,cap_nhat_luc) VALUES('q2','A','2026-11-02')",
      "UPDATE cau_hoi SET cap_nhat_luc='2026-11-05' WHERE qid='q1'", "DELETE FROM cau_hoi WHERE qid='q2'",
      "INSERT INTO chien_dich(id,ten,sbd_json,ma_de_json,qid_json,han_nop,tao_luc) VALUES('c1','T','[]','[]','[]','2026-12-01','x')",
      "UPDATE chien_dich SET trang_thai='da_huy'", "UPDATE chien_dich SET trang_thai='dang_chay', han_nop='2027-01-01'", "UPDATE chien_dich SET huyet_chien=5",
      "INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('A','v1','2026-11-01T00:00:00.000Z')", "UPDATE game_v2_index SET indexed_at='2026-11-07T00:00:00.000Z'",
      "UPDATE chien_dich SET ten='khong-doi'", "UPDATE cau_hoi SET muc_do='VD'",
    ]
    let a = doc(SQL_VAN_TAY_CU), b = doc(SQL_VAN_TAY)
    for (const s of ops) {
      d.sql.exec(s)
      const a2 = doc(SQL_VAN_TAY_CU), b2 = doc(SQL_VAN_TAY)
      expect(b2.kho, s).toBe(a2.kho)
      if (a2.ch !== a.ch) expect(b2.ch, s).not.toBe(b.ch)
      if (a2.cd !== a.cd) expect(b2.cd, s).not.toBe(b.cd)
      a = a2; b = b2
    }
    const kh = keHoach(d.sql, SQL_VAN_TAY, 'x')
    for (const t of ['dau_bang']) expect(kh.filter((x) => x.startsWith(`SEARCH ${t} USING INDEX sqlite_autoindex_${t}_1 (ten=?)`)).length, kh.join('\n')).toBe(3)
  })
})
