// @vitest-environment node
// CHẶN CÂU MỚI GÓI 7 — THỨ TỰ NỐI (31/10, thử tải 50.000 em lớp 100 em: câu đọc 101.509 dòng / lần vì SQLite đi từ bai_da_day rồi đọc mọi em của từng gói).
// Bản mới khoá thứ tự nối bằng CROSS JOIN (đi từ em). Kết quả PHẢI y hệt câu cũ ở mọi trường hợp: em thường, em khoá, bài bỏ tick, thầy chọn riêng
// không giao / giao, danh sách tick riêng, em chuyển lớp sau khi nhận gói, đã gặp câu.
import { describe, expect, it } from 'vitest'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import { damBaoBangBaiDaDay } from '../server/src/bai-da-day'
import { dongBoGoi7 } from '../server/src/goi-bai-7'
import { docChanCauMoiGoi7 } from '../server/src/goi-bai-7-chan-moi'
import type { Env } from '../server/src/kieu'

/** Câu CŨ (trước 31/10) dựng lại từ câu mới: bỏ CROSS JOIN về JOIN … ON như bản cũ. */
function cauCu(moi: string): string {
  return moi
    .replace(/FROM em h CROSS JOIN goi_bai_7 g CROSS JOIN bai_da_day b ON b\.id=g\.tick_id\s+WHERE (.*?) AND \((b\.bo_tick_luc IS NOT NULL OR COALESCE\(h\.trang_thai,''\)='khoa' OR NOT \([\s\S]*?\)=1\))\)\s+UNION/,
      (_m, dk: string, phan: string) => `FROM em h JOIN goi_bai_7 g ON ${dk.replace(/^g\.lop=/, 'g.lop=')} JOIN bai_da_day b ON b.id=g.tick_id\n      WHERE ${phan}\n      UNION`)
    .replace('FROM em h CROSS JOIN goi_bai_7_em e ON e.sbd=h.sbd CROSS JOIN goi_bai_7 g ON g.id=e.goi_id CROSS JOIN bai_da_day b ON b.id=g.tick_id',
      'FROM em h JOIN goi_bai_7_em e ON e.sbd=h.sbd JOIN goi_bai_7 g ON g.id=e.goi_id JOIN bai_da_day b ON b.id=g.tick_id')
}

describe('chặn câu mới gói 7: thứ tự nối mới cho kết quả y hệt', () => {
  it('nhiều lớp, nhiều trường hợp: tập câu bị chặn giống câu cũ cho mọi em', async () => {
    const k = taoKhoOmni({ 'DH-B8': 24, 'DH-B9': 20 }, 3)
    const env = k.env as Env
    await damBaoBangBaiDaDay(env)
    const sql = k.d.sql
    const em = sql.prepare("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,lop,ten_lop,trang_thai,cap_nhat_luc,mat_khau) VALUES(?,?,'12',?,?,'x','mk')")
    const lop = (i: number) => `12A${1 + (i % 4)}`
    for (let i = 1; i <= 40; i++) em.run(`E${i}`, `Em ${i}`, lop(i), i % 13 === 0 ? 'khoa' : null)
    sql.exec(`UPDATE hoc_sinh SET ten_lop='12A1' WHERE sbd IN ('S1','S2','S3')`)
    sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x')`)
    sql.exec(`INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8',24,0,'v1'),('DH-B9','Bài 9',20,0,'v1');
      INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x'),('DH-B9','v1','x')`)
    const tick = sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc,bo_tick_luc) VALUES(?,?,?,?,?,?,?,?)')
    for (let l = 1; l <= 4; l++) {
      tick.run(`b8-12A${l}`, `12A${l}`, 'B8', 'Bài 8', 8, '["DH-B8"]', '2026-10-11T11:00:00Z', null)
      tick.run(`b9-12A${l}`, `12A${l}`, 'B9', 'Bài 9', 9, '["DH-B9"]', '2026-10-12T11:00:00Z', null)
    }
    const NOW = Date.parse('2026-10-31T05:00:00Z')
    for (let i = 0; i < 20; i++) { const r = await dongBoGoi7(env, NOW, 50, '', true); if (!r.soGoi && !r.soEm) break }
    // Trường hợp đặc biệt: bỏ tick một bài ở lớp 12A2; thầy chọn riêng KHÔNG giao cho vài em; tick riêng một danh sách ở 12A3; em chuyển lớp sau khi nhận gói.
    sql.exec(`UPDATE bai_da_day SET bo_tick_luc='2026-10-20T00:00:00Z' WHERE id='b9-12A2'`)
    const goi = sql.prepare('SELECT id, lop, tick_id FROM goi_bai_7').all() as { id: string; lop: string; tick_id: string }[]
    expect(goi.length).toBeGreaterThan(2)
    const g1 = goi.find((g) => g.lop === '12A1')!
    sql.prepare("INSERT OR REPLACE INTO goi_bai_7_chon_em(goi_id,sbd,nhan,luc) VALUES(?,?,0,'x')").run(g1.id, 'E4')
    sql.prepare("INSERT OR REPLACE INTO goi_bai_7_chon_em(goi_id,sbd,nhan,luc) VALUES(?,?,1,'x')").run(g1.id, 'E8')
    const g3 = goi.find((g) => g.lop === '12A3')!
    sql.prepare("INSERT OR REPLACE INTO goi_bai_7_tick_em(tick_id,sbd_json,luc) VALUES(?,?,'x')").run(g3.tick_id, JSON.stringify(['E2', 'E6']))
    sql.exec(`UPDATE hoc_sinh SET ten_lop='12A4' WHERE sbd='E5'`)
    const cau = sql.prepare('SELECT goi_id, qid, version FROM goi_bai_7_cau LIMIT 3').all() as { goi_id: string; qid: string; version: string }[]
    for (const c of cau) sql.prepare("INSERT OR IGNORE INTO goi_bai_7_gap(goi_id,sbd,qid,version,kieu,luc,receipt) VALUES(?,?,?,?,'moi','2026-10-30T10:00:00Z',?)").run(c.goi_id, 'E1', c.qid, c.version, `r-${c.qid}`)

    let moi = ''
    const db = env.DB as unknown as { prepare(q: string): unknown }
    const goc = db.prepare.bind(db)
    db.prepare = (q: string) => { if (q.includes('WITH em AS MATERIALIZED')) moi = q; return goc(q) }
    const ds = ['S1', 'S2', 'S3', ...Array.from({ length: 40 }, (_, i) => `E${i + 1}`)]
    let khacRong = 0
    for (const s of ds) {
      const a = [...(await docChanCauMoiGoi7(env, s))].sort()
      const cu = cauCu(moi)
      expect(cu).not.toBe(moi)
      const b = (sql.prepare(cu).all(s) as { qid: string }[]).map((x) => x.qid).sort()
      expect(a, s).toEqual(b)
      if (a.length) khacRong++
    }
    expect(khacRong).toBeGreaterThan(0) // có em bị chặn câu thật — phép so có ý nghĩa
  })
})
