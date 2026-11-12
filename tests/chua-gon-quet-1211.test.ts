// @vitest-environment node
// NHÓM CÂU QUÉT / ĐÓNG ĐỢT CHỮA LỖI (12/11, hoá đơn D1 ~330 triệu hàng/ngày): so CŨ ↔ MỚI trên D1 thật trong bộ nhớ + khoá kế hoạch truy vấn.
//  (a)(b) điều kiện luật tự làm `sqlDaTuSuaDungLai` (chua-gon.ts) — cron đêm (sbd = cột) và câu đóng khi em mở danh sách (sbd = ?2);
//  (c) cron gói sửa `SQL_EM_CAN_GOI` (goi-sua-dem.ts); (d) hàng chiếu chữa trên lớp `SQL_HANG_CHIEU` (chua-cau-sai-chieu.ts).
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { sqlDaTuSuaDungLai, SQL_DONG_DA_DUNG_LAI, sqlHoCau, GIO_LOI_GIAI_GAN } from '../server/src/chua-gon'
import { SQL_DONG_CU_LO, cronDongDotCu } from '../server/src/chua-gon-dem'
import { SQL_EM_CAN_GOI, SQL_GOI_SUA, BANG_GOI_SUA } from '../server/src/goi-sua-dem'
import { SQL_HANG_CHIEU } from '../server/src/chua-cau-sai-chieu'

// ── BẢN CŨ NGUYÊN VĂN (trước 12/11) ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const laLanTuLamCu = (a: string) =>
  `COALESCE(${a}.purpose,'') NOT IN ('xem_loi_giai','luot','chan_doan','chua_buoc') AND COALESCE(${a}.assistance,'none') IN ('none','') AND COALESCE(${a}.visibility,'released')<>'embargoed'`
function sqlDaTuSuaDungLaiCu(d: string, sbd = '?2'): string {
  const Q = `${d}.qid_chuan`
  const saiCuoi = (cot: 'luc' | 'ngay_vn') =>
    `(SELECT w.${cot} FROM su_kien_hoc w WHERE w.sbd=${sbd} AND ${sqlHoCau('w.qid', Q)} AND COALESCE(w.ket_qua,0)=0 AND ${laLanTuLamCu('w')} ORDER BY w.luc DESC LIMIT 1)`
  return `EXISTS (SELECT 1 FROM su_kien_hoc c WHERE c.sbd=${sbd} AND ${sqlHoCau('c.qid', Q)} AND c.ket_qua=1 AND ${laLanTuLamCu('c')}
    AND c.luc > ${saiCuoi('luc')}
    AND (c.qid<>${Q} OR c.ngay_vn > ${saiCuoi('ngay_vn')})
    AND NOT EXISTS (SELECT 1 FROM loi_giai_hoi g WHERE g.sbd=${sbd} AND ${sqlHoCau('g.qid', Q)} AND g.luc<=c.luc AND g.luc>=strftime('%Y-%m-%dT%H:%M:%fZ',c.luc,'-${GIO_LOI_GIAI_GAN} hours'))
    AND NOT EXISTS (SELECT 1 FROM su_kien_hoc x WHERE x.sbd=${sbd} AND ${sqlHoCau('x.qid', Q)} AND x.purpose='xem_loi_giai' AND x.luc<=c.luc AND x.luc>=strftime('%Y-%m-%dT%H:%M:%fZ',c.luc,'-${GIO_LOI_GIAI_GAN} hours')))`
}
const SQL_DONG_DA_DUNG_LAI_CU = `UPDATE chua_loi_dot SET trang_thai_day='da_tu_sua',dong_luc=?1,revision=revision+1,cap_nhat_luc=?1
  WHERE sbd=?2 AND dong_luc IS NULL AND trang_thai_day<>'da_tu_sua' AND COALESCE(sai_cuoi_luc,mo_luc)>=?3 AND ${sqlDaTuSuaDungLaiCu('chua_loi_dot')}`
const SQL_EM_CAN_GOI_CU = `SELECT d.sbd AS sbd FROM chua_loi_dot d WHERE d.trang_thai_day<>'da_tu_sua' AND d.dong_luc IS NULL
        AND NOT EXISTS (SELECT 1 FROM ${BANG_GOI_SUA} g WHERE g.sbd=d.sbd AND g.ngay=?1 AND (g.so>=0 OR g.luc>?2))
      GROUP BY d.sbd ORDER BY MAX(d.cap_nhat_luc) DESC LIMIT ?3`
const SQL_HANG_CHIEU_CU = SQL_HANG_CHIEU.replace('chua_loi_thay t CROSS JOIN chua_loi_dot d', 'chua_loi_thay t JOIN chua_loi_dot d')

// ── DỮ LIỆU GIẢ ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
let hat = 12345
const ngauNhien = () => { hat = (hat * 1103515245 + 12345) % 2147483648; return hat / 2147483648 }
const chon = <T,>(a: readonly T[]): T => a[Math.floor(ngauNhien() * a.length)]!
const EM = ['E1', 'E2', 'E3'] as const
// Họ câu + anh em tiền tố (c10, c1x không thuộc họ c1) + biên khoảng (c1~~, c1#~ nằm NGOÀI khoảng mở).
const GOC = ['c1', 'c10', 'c2'] as const
const QID = ['c1', 'c1~ss0', 'c1~bt1', 'c1#2', 'c1~~', 'c1#~', 'c10', 'c1x', 'c10~ss1', 'c2', 'c2#1', 'c2~yd'] as const
const T0 = Date.parse('2026-11-01T00:00:00.000Z')
const iso = (ms: number) => new Date(ms).toISOString()
const ngayVnCua = (ms: number) => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10)

function napDuLieu(sql: ReturnType<typeof taoD1That>['sql'], soSk = 900) {
  let k = 0
  const sk = sql.prepare(`INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance,visibility,purpose) VALUES(?,?,?,'game','G',1,?,?,?,?,?,?)`)
  const moc: number[] = []
  for (let i = 0; i < soSk; i++) {
    const ms = T0 + Math.floor(ngauNhien() * 6 * 86_400_000)
    moc.push(ms)
    sk.run(`k${++k}`, chon(EM), chon(QID), chon([null, 0, 0, 1, 1, 1] as const), iso(ms), ngayVnCua(ms),
      chon([null, 'none', 'none', '', 'assisted'] as const), chon([null, 'released', 'released', 'embargoed'] as const),
      chon([null, 'repair', 'repair', 'luot', 'xem_loi_giai', 'chan_doan', 'chua_buoc', 'practice'] as const))
  }
  // Mốc 12 giờ ± 1 ms quanh lượt đúng (lời giải đọc ngay mép cửa sổ), cả em khác cùng qid.
  const lg = sql.prepare('INSERT OR IGNORE INTO loi_giai_hoi(sbd,qid,nguon,luc,co_ho_so) VALUES(?,?,?,?,0)')
  for (let i = 0; i < 160; i++) {
    const goc = chon(moc), lech = chon([0, -1, 1, -12 * 3_600_000, -12 * 3_600_000 + 1, -12 * 3_600_000 - 1, -3_600_000] as const)
    lg.run(chon(EM), chon(QID), 'x', iso(goc + lech))
    if (ngauNhien() < 0.3) sk.run(`k${++k}`, chon(EM), chon(QID), 1, iso(goc + lech), ngayVnCua(goc + lech), 'none', 'released', 'xem_loi_giai')
  }
  const dot = sql.prepare(`INSERT INTO chua_loi_dot(id,sbd,qid_chuan,mo_luc,sai_cuoi_luc,dong_luc,trang_thai_day,tao_luc,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?)`)
  let n = 0
  for (const e of [...EM, 'E4']) for (const q of GOC) for (let j = 0; j < 3; j++) {
    const mo = T0 + Math.floor(ngauNhien() * 20 * 86_400_000) - 10 * 86_400_000
    dot.run(`D${String(++n).padStart(3, '0')}`, e, q, mo, ngauNhien() < 0.5 ? null : mo + 3_600_000, ngauNhien() < 0.15 ? mo : null,
      chon(['can_chan_doan', 'dang_chua_buoc', 'cho_gap_lai_2', 'da_tu_sua', 'can_thay'] as const), mo, mo + n)
  }
}

describe('(a)(b) luật tự làm: tập đợt y hệt bản cũ', () => {
  it('dạng sbd = cột (cron đêm) và sbd = ?2 (mở danh sách) — mọi đợt, mọi em, nhiều hạt ngẫu nhiên', async () => {
    let coDong = 0
    for (const h of [1, 7, 42, 2026, 99991]) {
      hat = h
      const { sql, env } = taoD1That()
      napDuLieu(sql)
      const ids = async (q: string, ...a: unknown[]) => ((await env.DB.prepare(q).bind(...a).all<{ id: string }>()).results.map((r) => r.id)).sort()
      const cot = await ids(`SELECT id FROM chua_loi_dot WHERE ${sqlDaTuSuaDungLai('chua_loi_dot', 'chua_loi_dot.sbd')}`)
      expect(cot).toEqual(await ids(`SELECT id FROM chua_loi_dot WHERE ${sqlDaTuSuaDungLaiCu('chua_loi_dot', 'chua_loi_dot.sbd')}`))
      coDong += cot.length
      for (const e of [...EM, 'E4']) {
        const moi = await ids(`SELECT id FROM chua_loi_dot WHERE sbd=?2 AND ${sqlDaTuSuaDungLai('chua_loi_dot')}`, null, e)
        expect(moi).toEqual(await ids(`SELECT id FROM chua_loi_dot WHERE sbd=?2 AND ${sqlDaTuSuaDungLaiCu('chua_loi_dot')}`, null, e))
      }
    }
    expect(coDong).toBeGreaterThan(5) // dữ liệu có cả đợt đạt lẫn không đạt
  })
  it('câu UPDATE đóng đợt (danh sách) và cron đêm cho CÙNG bảng sau khi chạy như bản cũ', async () => {
    hat = 314
    const a = taoD1That(), b = taoD1That()
    napDuLieu(a.sql); hat = 314; napDuLieu(b.sql)
    const now = Date.parse('2026-11-07T20:00:00.000Z'), moc = now - 14 * 86_400_000
    for (const e of [...EM, 'E4']) {
      const ra = await a.env.DB.prepare(SQL_DONG_DA_DUNG_LAI).bind(now, e, moc).run()
      const rb = await b.env.DB.prepare(SQL_DONG_DA_DUNG_LAI_CU).bind(now, e, moc).run()
      expect(ra.meta.changes).toBe(rb.meta.changes)
    }
    const bang = (s: typeof a.sql) => s.prepare('SELECT id,trang_thai_day,dong_luc,revision FROM chua_loi_dot ORDER BY id').all()
    expect(bang(a.sql)).toEqual(bang(b.sql))
    // Cron đêm (bản mới) đóng đúng những đợt cũ mà điều kiện cũ (sbd = cột) chọn.
    const truoc = new Set((b.sql.prepare(`SELECT id FROM chua_loi_dot WHERE dong_luc IS NULL AND trang_thai_day<>'da_tu_sua' AND COALESCE(sai_cuoi_luc,mo_luc)<? AND ${sqlDaTuSuaDungLaiCu('chua_loi_dot', 'chua_loi_dot.sbd')}`).all(moc) as { id: string }[]).map((r) => r.id))
    let dong = 0
    for (let i = 0; i < 20; i++) { const r = await cronDongDotCu(a.env, now, 5, true); dong += r.dong; if (r.het) break }
    expect(dong).toBe(truoc.size)
    for (const id of truoc) expect((a.sql.prepare('SELECT trang_thai_day FROM chua_loi_dot WHERE id=?').get(id) as { trang_thai_day: string }).trang_thai_day).toBe('da_tu_sua')
  })
})

/** Mỗi dòng kế hoạch: «chi tiết». */
const keHoach = (sql: ReturnType<typeof taoD1That>['sql'], q: string) =>
  (sql.prepare(`EXPLAIN QUERY PLAN ${q}`).all() as { detail: string }[]).map((x) => x.detail)

describe('khoá kế hoạch truy vấn', () => {
  it('(a)(b): mọi truy vấn con trên su_kien_hoc / loi_giai_hoi dò MULTI-INDEX OR (sbd=? AND qid…), không đi (sbd, luc) / không quét', () => {
    const { sql } = taoD1That()
    for (const q of [SQL_DONG_DA_DUNG_LAI, SQL_DONG_CU_LO]) {
      const k = keHoach(sql, q)
      expect(k.filter((x) => x === 'MULTI-INDEX OR')).toHaveLength(5) // c, sai cuối (luc), sai cuối (ngày), lời giải, xem_loi_giai
      for (const x of k) {
        if (/^SEARCH [cwgx] /.test(x)) expect(x).toMatch(/\(sbd=\? AND qid(=|>)\?/)
        expect(x).not.toMatch(/idx_skh_em_luc|idx_lg_hoi_em_luc|idx_skh_luc|^SCAN (su_kien_hoc|loi_giai_hoi|chua_loi_dot)|^SCAN [cwgx]\b/)
      }
    }
    expect(keHoach(sql, SQL_DONG_DA_DUNG_LAI)[0]).toMatch(/^SEARCH chua_loi_dot USING INDEX idx_cld_\w+ \(sbd=\?/)
    expect(keHoach(sql, SQL_DONG_CU_LO).join('\n')).toMatch(/SEARCH chua_loi_dot USING INDEX idx_cld_mo_cu \(id>\?\)/)
  })
  it('(c): nhảy từng em trên idx_cld_mo_em, không quét đợt', () => {
    const { sql } = taoD1That()
    for (const s of SQL_GOI_SUA) sql.exec(s)
    const k = keHoach(sql, SQL_EM_CAN_GOI).join('\n')
    expect(k).not.toMatch(/SCAN d\b|SCAN chua_loi_dot/)
    // Mọi lần chạm chua_loi_dot là dò KHOẢNG trên chỉ mục bộ phận đợt mở (không `sbd=?` — SQLite sẽ chọn chỉ mục đầy đủ gồm cả đợt đã đóng).
    const dot = k.split('\n').filter((x) => /\bd\b|chua_loi_dot/.test(x))
    expect(dot).toHaveLength(2)
    for (const x of dot) expect(x).toMatch(/^SEARCH d USING (COVERING )?INDEX idx_cld_mo_em \(sbd<\?\)$/)
    expect(k).toMatch(/SEARCH g USING INDEX sqlite_autoindex_sua_goi_ngay_1 \(sbd=\?\)/)
  })
  it('(d): hàng chiếu đi từ chua_loi_thay theo idx_clt_cho, đợt dò khoá chính', () => {
    const { sql } = taoD1That()
    const k = keHoach(sql, SQL_HANG_CHIEU)
    expect(k[0]).toMatch(/^SEARCH t USING INDEX idx_clt_cho \(trang_thai=\?\)/)
    expect(k.join('\n')).toMatch(/SEARCH d USING INDEX sqlite_autoindex_chua_loi_dot_1 \(id=\?\)/)
    expect(k.join('\n')).not.toMatch(/SCAN d\b/)
    // Không có chỉ mục mới (migration chưa chạy) vẫn đi t trước — CROSS JOIN giữ thứ tự.
    sql.exec('DROP INDEX idx_clt_cho')
    expect(keHoach(sql, SQL_HANG_CHIEU)[0]).toMatch(/^SCAN t\b/)
  })
})

describe('(c) cron gói sửa: cùng em, cùng thứ tự', () => {
  it('bảng rỗng, em chỉ còn đợt đã đóng, gói hôm nay / ngày khác / giữ chỗ còn hạn / giữ chỗ quá hạn', async () => {
    const { sql, env } = taoD1That()
    for (const s of SQL_GOI_SUA) sql.exec(s)
    const ngay = '2026-11-12', moc = 1_000_000
    const so = async (q: string, toiDa: number) => (await env.DB.prepare(q).bind(ngay, moc, toiDa).all<{ sbd: string }>()).results.map((r) => r.sbd)
    expect(await so(SQL_EM_CAN_GOI, 5)).toEqual([])
    expect(await so(SQL_EM_CAN_GOI_CU, 5)).toEqual([])
    const dot = sql.prepare(`INSERT INTO chua_loi_dot(id,sbd,qid_chuan,mo_luc,dong_luc,trang_thai_day,tao_luc,cap_nhat_luc) VALUES(?,?,?,1,?,?,1,?)`)
    let n = 0, cn = 5000
    const em = Array.from({ length: 40 }, (_, i) => `S${String(i).padStart(2, '0')}`)
    hat = 77
    for (const e of em) for (let j = 0; j < 1 + Math.floor(ngauNhien() * 5); j++) {
      const loai = chon(['mo', 'mo', 'mo', 'dong', 'da_tu_sua'] as const)
      dot.run(`X${++n}`, e, 'q', loai === 'dong' ? 9 : null, loai === 'da_tu_sua' ? 'da_tu_sua' : chon(['can_chan_doan', 'cho_gap_lai_2'] as const), cn += 1 + Math.floor(ngauNhien() * 50))
    }
    dot.run('Y1', 'CHI_DONG', 'q', 9, 'can_chan_doan', 9_999_999) // em chỉ có đợt đã đóng, cập nhật mới nhất
    dot.run('Y2', 'CHI_DONG', 'q', null, 'da_tu_sua', 9_999_998)
    const goi = sql.prepare(`INSERT INTO ${BANG_GOI_SUA}(sbd,ngay,luc,so) VALUES(?,?,?,?)`)
    goi.run('S01', ngay, 5, 3) // có gói hôm nay
    goi.run('S02', '2026-11-11', 5, 3) // gói hôm qua
    goi.run('S03', ngay, moc + 1, -1) // đang đóng, còn hạn
    goi.run('S04', ngay, moc, -1) // đang đóng, quá hạn (luc = mốc ⇒ không còn hạn)
    goi.run('S05', ngay, 5, 0) // đã xét, không câu
    for (const toiDa of [1, 3, 10, 50]) {
      const moi = await so(SQL_EM_CAN_GOI, toiDa)
      expect(moi).toEqual(await so(SQL_EM_CAN_GOI_CU, toiDa))
      expect(moi).not.toContain('CHI_DONG')
    }
    const tatCa = await so(SQL_EM_CAN_GOI, 100)
    expect(tatCa).toContain('S04'); expect(tatCa).not.toContain('S03'); expect(tatCa).not.toContain('S01')
    expect(tatCa.length).toBeGreaterThan(20)
  })
})

describe('(d) hàng chiếu: cùng dòng, cùng thứ tự', () => {
  it('lọc lớp, trạng thái thầy, trạng thái đợt, phiên mới nhất, lần nộp cuối', async () => {
    const { sql, env } = taoD1That()
    hat = 5
    const hs = sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES(?,?,?,'2026-11-01')")
    for (let i = 0; i < 12; i++) hs.run(`H${i}`, `Em ${i}`, chon(['10A', '11B', '12C'] as const))
    const dot = sql.prepare(`INSERT INTO chua_loi_dot(id,sbd,qid_chuan,mo_luc,trang_thai_day,tao_luc,cap_nhat_luc) VALUES(?,?,?,1,?,1,1)`)
    const thay = sql.prepare(`INSERT INTO chua_loi_thay(dot_id,sbd,qid,bang_chung_json,trang_thai,gui_luc) VALUES(?,?,?,'{}',?,?)`)
    const phien = sql.prepare(`INSERT INTO chua_loi_phien(id,dot_id,sbd,qid_chuan,lan_gap_lai,so_luot,bat_dau_luc,tao_luc,cap_nhat_luc,tien_do_json) VALUES(?,?,?,?,?,?,1,1,1,?)`)
    const item = sql.prepare(`INSERT INTO chua_loi_item(id,phien_id,dot_id,sbd,thu_tu,loai,public_json,phat_luc,tao_luc) VALUES(?,?,?,?,?,'probe',?,1,1)`)
    const nop = sql.prepare(`INSERT INTO chua_loi_nop(id,attempt_id,item_id,phien_id,dot_id,sbd,tra_loi,nop_luc,server_luc) VALUES(?,?,?,?,?,?,?,?,1)`)
    for (let i = 0; i < 60; i++) {
      const id = `D${i}`, sbd = `H${i % 13}` // H12 không có trong hoc_sinh
      dot.run(id, sbd, `q${i % 7}`, chon(['can_thay', 'can_thay', 'dang_chua_buoc', 'da_tu_sua'] as const))
      if (ngauNhien() < 0.85) thay.run(id, sbd, `q${i % 7}`, chon(['cho_thay', 'cho_thay', 'da_chua_tren_lop'] as const), Math.floor(ngauNhien() * 8))
      for (let p = 0; p < Math.floor(ngauNhien() * 3); p++) {
        const pid = `${id}P${p}`
        phien.run(pid, id, sbd, `q${i % 7}`, 1 + (p % 2), 1 + p, `[${p}]`)
        for (let t = 0; t < 2; t++) {
          item.run(`${pid}I${t}`, pid, id, sbd, t, `{"t":${t}}`)
          nop.run(`${pid}N${t}`, `${pid}A${t}`, `${pid}I${t}`, pid, id, sbd, `tl${t}`, Math.floor(ngauNhien() * 3))
        }
      }
    }
    for (const lop of ['', '10A', '11B', 'khong-co']) {
      const moi = (await env.DB.prepare(SQL_HANG_CHIEU).bind(lop, lop).all()).results
      const cu = (await env.DB.prepare(SQL_HANG_CHIEU_CU).bind(lop, lop).all()).results
      expect(moi).toEqual(cu)
      if (lop === '') expect(moi.length).toBeGreaterThan(5)
    }
  })
})
