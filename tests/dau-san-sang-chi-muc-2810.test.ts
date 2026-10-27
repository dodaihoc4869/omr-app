// @vitest-environment node
// DẤU SẢNH THEO CHỈ MỤC CỦA EM (nghiệm thu 28/10: câu dấu của #530 ĐẾM cả sổ / lượt trả lời của em mỗi lượt Sảnh ⇒ ~4.300 dòng đọc / lượt với em nặng nhất).
// Nay (server/src/san-sang.ts): phần CỦA EM chỉ đọc DÒNG CUỐI theo (sbd, mốc giờ) hoặc vài dòng của em qua chỉ mục sbd; phần CHUNG (cấu hình thầy, kho, ca…)
// lấy từ đệm isolate 5 phút. Bản thật 28/10 (em nặng nhất, wrangler d1 execute --remote): cũ 4.334 dòng / 3–4,4 ms ⇒ mới 32 dòng / ~1,1 ms; EXPLAIN đều SEARCH.
// Khoá: (1) EXPLAIN QUERY PLAN trên lược đồ thật của repo — mọi phần của em là SEARCH theo chỉ mục, không SCAN bảng, không sắp tạm toàn bộ;
// (2) đệm phần chung: một câu D1 mỗi lượt, phần chung chỉ đọc lại khi hết hạn 5 phút; phần của em luôn tươi; lỗi không giữ cờ «đang làm mới».
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That } from './_d1-that'
import {
  COT_BAN, SQL_DAU_SAN_SANG, SQL_DAU_SAN_SANG_EM, SQL_SAN_SANG, BAN_DAU, batDemDauChung, dauSanSang, docDauVaBan, xoaBangVangSanSang,
} from '../server/src/san-sang'
import { SQL_GOI7 } from '../server/src/goi-bai-7-schema'
import { damBaoKtCn } from '../server/src/kiem-tra-ca-nhan-schema'
import { damBaoBangLoiGiai } from '../server/src/loi-giai'
import { CHI_MUC_CRON_DEM } from '../server/src/chi-muc-luc-chay'
import type { Env } from '../server/src/kieu'

async function taoKho() {
  const d = taoD1That()
  for (const s of [...SQL_GOI7, ...SQL_SAN_SANG]) d.sql.exec(s)
  await damBaoKtCn(d.env)
  await damBaoBangLoiGiai(d.env)
  // chien_dich_em: bảng tạo ở app khác; trên bản thật có PK (chien_dich_id, sbd) + chỉ mục idx_chien_dich_em_sbd (sqlite_master 28/10)
  d.sql.exec('CREATE TABLE IF NOT EXISTS chien_dich_em (chien_dich_id TEXT NOT NULL, sbd TEXT NOT NULL, them_luc TEXT, bot_luc TEXT, PRIMARY KEY (chien_dich_id, sbd))')
  d.sql.exec('CREATE INDEX IF NOT EXISTS idx_chien_dich_em_sbd ON chien_dich_em(sbd)')
  for (const s of CHI_MUC_CRON_DEM) { try { d.sql.exec(s) } catch { /* bảng của lệnh khác chưa có trong kho test */ } }
  return d
}

const keHoach = (d: Awaited<ReturnType<typeof taoKho>>, sql: string) =>
  (d.sql.prepare('EXPLAIN QUERY PLAN ' + sql).all('E1') as { detail: string }[]).map((r) => r.detail)

afterEach(() => { batDemDauChung(false); xoaBangVangSanSang(); vi.useRealTimers() })

describe('EXPLAIN QUERY PLAN — câu dấu của em (đường nóng Sảnh / Mở chặng)', () => {
  it('mọi phần của em: SEARCH theo chỉ mục; không SCAN bảng; không sắp tạm toàn bộ', async () => {
    const d = await taoKho()
    const kh = keHoach(d, SQL_DAU_SAN_SANG_EM + COT_BAN)
    const quet = kh.filter((x) => /^SCAN /.test(x) && !/^SCAN (CONSTANT ROW|\(subquery)/.test(x))
    expect(quet, kh.join('\n')).toEqual([])
    expect(kh.filter((x) => /USE TEMP B-TREE FOR ORDER BY/.test(x)), kh.join('\n')).toEqual([])
    // bảng lớn theo em: đi đúng chỉ mục (sbd, mốc giờ), chỉ đọc chỉ mục (COVERING)
    for (const [bang, chiMuc] of [['game_v2_attempt', 'game_v2_attempt_student'], ['su_kien_hoc', 'idx_skh_tiep_nhan'], ['goi_bai_7_gap', 'goi_bai_7_gap_sbd_luc'],
      ['loi_giai_hoi', 'idx_lg_hoi_em_luc'], ['chua_loi_dot', 'idx_cld_em_cap_nhat'], ['game_v2_session', 'game_v2_session_student']] as const) {
      expect(kh.some((x) => x.startsWith(`SEARCH ${bang} USING COVERING INDEX ${chiMuc} (sbd=?)`)), `${bang}\n${kh.join('\n')}`).toBe(true)
    }
    for (const bang of ['kiem_tra_ca_nhan', 'goi_bai_7_em', 'hoc_sinh', 'game_v2_scope', 'btvn_em', 'chien_dich_em', 'hoc_tap_san_sang']) {
      expect(kh.some((x) => new RegExp(`^SEARCH ${bang} USING .*INDEX .*\\(sbd=\\?\\)`).test(x)), `${bang}\n${kh.join('\n')}`).toBe(true)
    }
  })
  it('câu dấu của em không nhắc bảng chung nào (cấu hình, kho, ca, chiến dịch, câu nghi, bài đã dạy)', () => {
    for (const b of ['cau_hinh', 'game_v2_index', 'de_kho', 'FROM ca', 'cau_nghi_dap_an', 'FROM chien_dich ', 'bai_da_day', 'FROM goi_bai_7\n', 'COUNT(*)||\'|\'||COALESCE(MAX(tao_luc)']) {
      expect(SQL_DAU_SAN_SANG_EM.includes(b), b).toBe(false)
    }
    expect(SQL_DAU_SAN_SANG.includes('game_v2_index')).toBe(true)
  })
})

describe('đệm phần chung (isolate, 5 phút)', () => {
  const NOW = Date.parse('2026-10-28T12:00:00Z')
  beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })

  function demLenh(env: Env) {
    const ds: string[] = []
    const g = env.DB as unknown as { prepare(q: string): unknown }
    const db = Object.create(env.DB) as Record<string, unknown>
    db.prepare = (q: string) => { ds.push(q); return g.prepare(q) }
    return { env: { ...env, DB: db } as unknown as Env, ds }
  }

  it('một câu D1 mỗi lượt; phần chung đọc lại khi hết hạn; dấu giữ nguyên khi không đổi gì', async () => {
    const d = await taoKho()
    batDemDauChung(true)
    const { env, ds } = demLenh(d.env)
    const d1 = await dauSanSang(env, 'E1', NOW)
    expect(d1?.startsWith(BAN_DAU + '§')).toBe(true)
    expect(ds.length).toBe(1); expect(ds[0]).toContain('game_v2_index') // lượt đầu isolate: kèm phần chung
    const [d2] = await docDauVaBan(env, 'E1', NOW + 60_000)
    expect(ds.length).toBe(2); expect(ds[1]).not.toContain('game_v2_index') // trong hạn: chỉ phần của em
    expect(d2).toBe(d1)
    await dauSanSang(env, 'E1', NOW + 5 * 60_000 + 1)
    expect(ds.length).toBe(3); expect(ds[2]).toContain('game_v2_index') // hết hạn: ghép lại vào chính câu dấu (không thêm lệnh)
  })

  it('phần của em luôn tươi: em vừa trả lời ⇒ dấu đổi ngay dù phần chung đang đệm', async () => {
    const d = await taoKho()
    batDemDauChung(true)
    const a = await dauSanSang(d.env, 'E1', NOW)
    d.sql.exec("INSERT INTO goi_bai_7_gap(receipt,goi_id,sbd,qid,version,kieu,luc) VALUES('r1','g1','E1','q1','v1','moi','2026-10-28T12:00:30Z')")
    const b = await dauSanSang(d.env, 'E1', NOW + 30_000)
    expect(b).not.toBe(a)
    d.sql.exec("INSERT INTO loi_giai_hoi(sbd,qid,nguon,luc) VALUES('E1','q1','x','2026-10-28T12:00:40Z')")
    expect(await dauSanSang(d.env, 'E1', NOW + 40_000)).not.toBe(b)
  })

  it('thầy đổi cấu hình: dấu đổi chậm nhất sau hạn đệm (5 phút); tắt đệm (test) ⇒ đổi ngay', async () => {
    const d = await taoKho()
    batDemDauChung(true)
    const a = await dauSanSang(d.env, 'E1', NOW)
    d.sql.exec("INSERT INTO cau_hinh(khoa, gia_tri, cap_nhat_luc) VALUES('thu-dau-2810','1','2026-10-28T12:01:00Z')")
    expect(await dauSanSang(d.env, 'E1', NOW + 60_000)).toBe(a)
    const sau = await dauSanSang(d.env, 'E1', NOW + 5 * 60_000 + 1)
    expect(sau).not.toBe(a)
    batDemDauChung(false)
    d.sql.exec("UPDATE cau_hinh SET cap_nhat_luc='2026-10-28T12:09:00Z' WHERE khoa='thu-dau-2810'")
    expect(await dauSanSang(d.env, 'E1', NOW + 6 * 60_000)).not.toBe(sau)
  })

  it('lượt đồng thời lúc hết hạn: một lượt làm mới, lượt khác dùng bản cũ; lỗi không giữ cờ «đang làm mới»', async () => {
    const d = await taoKho()
    batDemDauChung(true)
    await dauSanSang(d.env, 'E1', NOW)
    const { env, ds } = demLenh(d.env)
    const t = NOW + 5 * 60_000 + 1
    await Promise.all([dauSanSang(env, 'E1', t), dauSanSang(env, 'E2', t), dauSanSang(env, 'E3', t)])
    expect(ds.filter((q) => q.includes('game_v2_index')).length).toBe(1)
    // lỗi đọc ở lượt làm mới ⇒ lượt sau vẫn được làm mới (không kẹt dùng bản cũ mãi)
    const hong = { ...d.env, DB: { prepare: () => { throw new Error('D1_ERROR: hỏng tạm') } } } as unknown as Env
    const t2 = t + 5 * 60_000 + 1
    expect(await dauSanSang(hong, 'E1', t2)).toBeNull()
    ds.length = 0
    await dauSanSang(env, 'E1', t2 + 1000)
    expect(ds[0]).toContain('game_v2_index')
  })
})
