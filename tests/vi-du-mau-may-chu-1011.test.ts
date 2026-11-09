// @vitest-environment node
// VÍ DỤ MẪU — đường máy chủ thật (khối B lát 6, thầy 10/11 «Làm nốt hết đi đẩy lên bản sống luôn nhé»).
// Khoá: em làm ĐÚNG vài câu và SAI ≥ 12 câu (chạm «Chưa biết cách») ⇒ ngày Sửa: nhóm «Chưa biết cách» có `viDu` là câu cùng dạng em đã làm đúng, và lệnh
// «Câu đã làm» (`hoc-tap-cau-chi-tiet`, máy chủ chỉ trả câu em đã làm) trả đúng câu ấy kèm lời giải — nút «Xem ví dụ mẫu» mở được thật.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { taoKhoOmni, themChienDich, lam } from './omni-3-ke-hoach-chung'
import { dongBoGoi7, lapGoi7 } from '../server/src/goi-bai-7'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich, xoaDemMetaCau } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { gameToken } from '../server/src/game-v2-auth'

const NOW = Date.parse('2026-11-10T02:00:00Z')
const NGAY_MS = 86_400_000
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe(); xoaDemMetaCau() })

it('ngày Sửa: nhóm «Chưa biết cách» có ví dụ mẫu là câu em đã làm đúng; lệnh Câu đã làm trả được câu ấy', async () => {
  const k = taoKhoOmni({ 'DH-B8': 127 })
  await damBaoBangBaiDaDay(k.env)
  k.d.sql.exec(`UPDATE hoc_sinh SET mat_khau='mk';INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8. Amine',127,0,'v1');INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-11-05"}','x')`)
  k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
    .run('amine', '12A1', 'B8', 'Bài 8. Amine', 8, '["DH-B8-TN","DH-B8-DS","DH-B8-TLN"]', '2026-11-07T11:00:00Z')
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: k.qids('DH-B8'), maDe: ['DH-B8'], sbd: ['S1'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, NOW - 2 * NGAY_MS)
  for (const ngay of ['2026-11-08', '2026-11-09']) k.d.sql.prepare('INSERT INTO goi_bai_7_loai_ngay(sbd,ngay,loai,luc) VALUES(?,?,?,?)').run('S1', ngay, 'moi', 'x')
  const t8 = NOW - 2 * NGAY_MS
  const lap8 = (await lapGoi7(k.env, 'S1', t8))!, nhom = new Set<string>()
  const ds = lap8.plan.viec.filter(v => v.vai === 'moi').map(v => v.qid).filter(q => { const g = lap8.hs.meta.get(q)?.group ?? q; if (nhom.has(g)) return false; nhom.add(g); return true })
  const dung = ds.slice(0, 4), sai = ds.slice(4)
  expect(sai.length).toBeGreaterThanOrEqual(12)
  for (const [i, qid] of dung.entries()) await lam(k.env, 'S1', qid, t8 + i * 60_000, true, { cauVersion: 'v1' })
  for (const [i, qid] of sai.entries()) {
    await lam(k.env, 'S1', qid, t8 + (i + 10) * 60_000, false, { cauVersion: 'v1' })
    k.d.sql.prepare('INSERT INTO goi_bai_7_ly_do(sbd,qid,ly,luc) VALUES(?,?,?,?)').run('S1', qid, 'cach', 'x')
  }
  const lap = (await lapGoi7(k.env, 'S1', NOW))!
  expect(lap.loaiNgay).toBe('sua')
  const coViDu = lap.nhomSua.filter(n => n.loai === 'cach' && n.viDu)
  expect(coViDu.length).toBeGreaterThan(0)
  for (const n of coViDu) expect(dung).toContain(n.viDu)
  // nút «Xem ví dụ mẫu» gọi đúng lệnh này
  const token = await gameToken(k.env, 'S1')
  const res = await worker.fetch(new Request('https://test/game-v2/hoc-tap-cau-chi-tiet', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, qids: [coViDu[0]!.viDu] }) }), k.env, { waitUntil() {}, passThroughOnException() {} } as never)
  const kq = (await res.json()) as { ok?: boolean; cau?: { qid?: string; de?: { qid?: string } }[] } & Record<string, unknown>
  expect(kq.ok, JSON.stringify(kq).slice(0, 300)).toBe(true)
  expect(JSON.stringify(kq)).toContain(coViDu[0]!.viDu!)
})
