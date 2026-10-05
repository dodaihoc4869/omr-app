// RUNTIME D1 (workerd) cho LỚP D1 OMNI 3 (làn B2): câu SQL của omni-d1.ts chạy ĐÚNG trên D1 thật của workerd (node:sqlite ở tests/_d1-that.ts không
// chứng minh được dialect/giới hạn của D1): tạo bảng chỉ-thêm một lần, đọc sổ `sbd IN (json_each)` + lùi cột, đếm khoá đệm, β câu
// (`CASE WHEN json_valid(raw_json) THEN json_extract(...)`), chụp hồ sơ thô (bind REAL trực tiếp), prior lớp từ ảnh chụp. Dữ liệu TỔNG HỢP.
import { beforeAll, describe, expect, it } from 'vitest'
import { DB, ENV, tachCau } from './_cnh-exp-fixture'
import { env } from 'cloudflare:test'
import { LENH_TAO_BANG_OMNI, chupHoSoTho, damBaoBangOmni, docSuKienOmni, hoSoOmniNhieuEm, qCuaCau, tinhBetaMoiCau, xoaDemOmni } from '../server/src/omni-d1'
import { ghiSuKien, type SuKien } from '../server/src/su-kien-hoc'

const T0 = Date.parse('2026-10-05T03:00:00Z')
const NGAY = 86_400_000
const LOP = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6']
const sk = (sbd: string, qid: string, ms: number, kq: 0 | 1 | null, t: Partial<SuKien> = {}): SuKien => ({ nguon: 'game', maNguon: `rt-${ms}-${qid}`, sbd, qid, lan: 1, ketQua: kq, luc: new Date(ms).toISOString(), receivedAt: ms, assistance: 'none', ...t })

beforeAll(async () => {
  const ds = (env as unknown as { LUOC_DO_SQL: string[] }).LUOC_DO_SQL
  const can = ds.filter((s) => /CREATE TABLE IF NOT EXISTS\s+(su_kien_hoc|hoc_sinh|cau_hinh|game_v2_question|cau_bo_tro)\b/i.test(s) || /ALTER TABLE su_kien_hoc ADD COLUMN/i.test(s))
  for (const sql of can) for (const c of tachCau(sql)) {
    if (!/^(CREATE TABLE IF NOT EXISTS\s+(su_kien_hoc|hoc_sinh|cau_hinh|game_v2_question|cau_bo_tro)\b|ALTER TABLE su_kien_hoc ADD COLUMN)/i.test(c)) continue
    await DB.prepare(c).run().catch(() => undefined) // ALTER đã có cột ⇒ bỏ qua
  }
  for (const s of LOP) await DB.prepare("INSERT OR REPLACE INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,'12RT','mk','x')").bind(s, `Em ${s}`).run()
  await DB.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{\"bat\":true,\"lop\":[\"12RT\"]}','x'),('omni','{\"bat\":true,\"lop\":[\"12RT\"]}','x')").run()
  const json = (qid: string) => JSON.stringify({ qid, maDe: 'DE-RT', version: 'v1', group: `g-${qid}`, phan: qid === 'RQ3' ? 'II' : 'I', text: qid, choices: [], ideas: [], dang: 'RTD', tenDang: 'Dạng RT', mucDo: 'Thông hiểu', kienThuc: [], correct: 'B', reviewed: true, solution: null, hinhAnh: [] })
  for (const q of ['RQ1', 'RQ2', 'RQ3']) await DB.prepare('INSERT OR REPLACE INTO game_v2_question VALUES (?,?,?,?,?,?)').bind('DE-RT', q, 'v1', `g-${q}`, 'RTD', json(q)).run()
  const ev: SuKien[] = []
  LOP.forEach((s, i) => {
    for (let k = 1; k <= 3; k++) ev.push(sk(s, 'RQ1', T0 - k * NGAY + i, 1, { raw: { ms: 20_000 + 1000 * k + i, tt: 'chac' } }))
    ev.push(sk(s, 'RQ3~ss0', T0 - NGAY + 5000 + i, 1, { subitem: [1, 0, 1, 1] }))
  })
  ev.push(sk('R1', 'RQ2', T0 - 1000, null, { purpose: 'luot' }))
  const r = await ghiSuKien(ENV, ev)
  expect(r.ok).toBe(true)
})

describe('omni-d1 trên workerd D1', () => {
  it('bảng chỉ-thêm tạo một lần, khớp số lệnh migration', async () => {
    await damBaoBangOmni(ENV)
    const r = await DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'omni_%' ORDER BY name").all<{ name: string }>()
    expect(r.results.map((x) => x.name)).toEqual(['omni_beta_cau', 'omni_ca_chot', 'omni_chung_chi', 'omni_de_thu', 'omni_du_bao', 'omni_em', 'omni_lo_dien', 'omni_p_vkn', 'omni_q', 'omni_ve', 'omni_vkn', 'omni_xac_nhan'])
    expect(LENH_TAO_BANG_OMNI.length).toBe(20)
  })
  it('đọc sổ ⇒ SuKienOmni (json_each, song sinh, ý Đúng–sai, raw), β câu, chụp hồ sơ thô, prior lớp, Q', async () => {
    const ds = (await docSuKienOmni(ENV, ['R1'])).get('R1')!
    expect(ds.map((e) => e.qid)).toEqual(['RQ1', 'RQ1', 'RQ1', 'RQ3', 'RQ2'])
    expect(ds[3]).toMatchObject({ songSinh: true, phan: 'II', y: [1, 0, 1, 1] })
    expect(ds[0]!.msLam).toBeGreaterThan(20_000)
    expect(await tinhBetaMoiCau(ENV, T0)).toBe(1) // RQ1: 18 lượt đúng có thời lượng
    expect(await chupHoSoTho(ENV, LOP, '2026-10-05')).toBe(6)
    const n = await DB.prepare("SELECT COUNT(*) AS n FROM omni_p_vkn WHERE cap_nhat_luc = '2026-10-04T17:00:00.000Z'").first<{ n: number }>()
    expect(Number(n?.n)).toBeGreaterThan(0)
    xoaDemOmni()
    const hs = await hoSoOmniNhieuEm(ENV, LOP, T0)
    expect(hs.get('R1')!.vkn['dang:RTD']!.nTuLam).toBeGreaterThan(0)
    expect(hs.get('R1')!.luotHomNay).toBe(1)
    const q = await qCuaCau(ENV, ['RQ1', 'KHONG-CO-I-1'])
    expect(q.get('RQ1')!.vkn).toEqual(['dang:RTD'])
    expect(q.get('KHONG-CO-I-1')!.nguon).toBe('mac_dinh')
  })
})
