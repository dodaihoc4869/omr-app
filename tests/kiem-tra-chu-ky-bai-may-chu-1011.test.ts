// @vitest-environment node
// KIỂM TRA ÔN TẬP THEO CHU KỲ BÀI — đường máy chủ thật `lapKtCn` (khối B; thầy 09/11 đặc tả mục 0 điểm 1; 10/11 «Bỏ codex tự làm lại ko chờ gì cả»).
// Nghiệm thu (docs/viec-giao-codex.md): em gặp hết câu mới của bài ⇒ ngày kế là Kiểm tra ôn tập, đề ghi mã gói; em chưa hết và hạn còn xa ⇒ chưa lập lịch;
// gói đã có lịch ⇒ không lập thêm (không lịch tuần cho em có gói); lịch đã lập giữ nguyên.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoKhoOmni, themChienDich, lam } from './omni-3-ke-hoach-chung'
import { dongBoGoi7 } from '../server/src/goi-bai-7'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich, xoaDemMetaCau } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { lapKtCn } from '../server/src/kiem-tra-ca-nhan'

const NOW = Date.parse('2026-11-10T02:00:00Z') // 09:00 10/11 giờ VN
const NGAY_MS = 86_400_000
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe(); xoaDemMetaCau() })

async function kho() {
  const k = taoKhoOmni({ 'DH-B8': 127 })
  await damBaoBangBaiDaDay(k.env)
  k.d.sql.exec(`UPDATE hoc_sinh SET mat_khau='mk';INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8. Amine',127,0,'v1');INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-11-05"}','x');INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('kiem_tra_ca_nhan_v1','{"bat":true}','x')`)
  k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
    .run('amine', '12A1', 'B8', 'Bài 8. Amine', 8, '["DH-B8"]', '2026-11-07T11:00:00Z')
  for (const qid of k.qids('DH-B8')) k.d.sql.prepare("INSERT INTO omni_q(qid,y,vkn_json,nguon,duyet_luc) VALUES(?,-1,?,'thay','x')").run(qid, JSON.stringify(['DH-B8.kn']))
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: k.qids('DH-B8'), maDe: ['DH-B8'], sbd: ['S1'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, NOW - 2 * NGAY_MS)
  const g = k.d.sql.prepare("SELECT e.goi_id id,e.han FROM goi_bai_7_em e WHERE e.sbd='S1'").get() as { id: string; han: string }
  return { k, g }
}
const lich = (k: Awaited<ReturnType<typeof kho>>['k']) => k.d.sql.prepare("SELECT ngay,trang_thai,json_extract(json,'$.goiId') goi FROM kiem_tra_ca_nhan WHERE sbd='S1' ORDER BY ngay").all() as { ngay: string; trang_thai: string; goi: string | null }[]
const gapHet = (k: Awaited<ReturnType<typeof kho>>['k'], goiId: string) => {
  const st = k.d.sql.prepare("INSERT INTO goi_bai_7_gap(receipt,goi_id,sbd,qid,version,kieu,luc) VALUES(?,?,?,?,?,?,?)")
  for (const r of k.d.sql.prepare('SELECT qid,version FROM goi_bai_7_cau WHERE goi_id=?').all(goiId) as { qid: string; version: string }[]) st.run(`r-${r.qid}`, goiId, 'S1', r.qid, r.version, 'gap', 'x')
}

describe('lapKtCn theo chu kỳ bài', () => {
  it('em chưa gặp hết câu mới, hạn còn xa ⇒ chưa lập lịch (không lịch tuần cho em có gói)', async () => {
    const { k, g } = await kho()
    expect(g.han > '2026-11-13').toBe(true)
    expect(await lapKtCn(k.env, 'S1', NOW)).toBeNull()
    expect(lich(k)).toEqual([])
  })
  it('em gặp hết câu mới của bài ⇒ Kiểm tra ôn tập ngày mai, đề ghi mã gói, có câu sai chờ kiểm lại; gọi lại ⇒ giữ lịch đã lập, không lập thêm', async () => {
    const { k, g } = await kho()
    gapHet(k, g.id)
    const sai = k.qids('DH-B8').slice(0, 6)
    for (const [i, qid] of sai.entries()) await lam(k.env, 'S1', qid, NOW - NGAY_MS + i * 60_000, false, { cauVersion: 'v1' })
    const r = await lapKtCn(k.env, 'S1', NOW)
    const json = String((k.d.sql.prepare("SELECT json FROM kiem_tra_ca_nhan WHERE sbd='S1'").get() as { json: string }).json)
    expect(sai.some(q => json.includes(`"${q}"`))).toBe(true) // ≥ 1 câu chờ kiểm lại vào đề (đặc tả việc 2)
    expect(r?.ngay).toBe('2026-11-11')
    expect(lich(k)).toEqual([expect.objectContaining({ ngay: '2026-11-11', goi: g.id })])
    expect((await lapKtCn(k.env, 'S1', NOW + 60_000))?.ngay).toBe('2026-11-11')
    // sau ngày kiểm tra: gói đã có lịch ⇒ không lập thêm (không quay về lịch tuần)
    vi.setSystemTime(NOW + 3 * NGAY_MS)
    k.d.sql.prepare("UPDATE kiem_tra_ca_nhan SET trang_thai='da_nop' WHERE sbd='S1'").run()
    expect(await lapKtCn(k.env, 'S1', NOW + 3 * NGAY_MS)).toBeNull()
    expect(lich(k)).toHaveLength(1)
  })
})
