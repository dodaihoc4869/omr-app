// @vitest-environment node
// 13/11 (giảm GHI D1 — thầy «đạt mức dưới 5 đô»): ảnh chụp đêm omni_p_vkn chỉ ghi nhãn ĐỔI SỐ, xoá đúng nhãn rời hồ sơ; mốc ảnh chụp của em ở omni_em.
import { describe, expect, it } from 'vitest'
import { taoKhoOmni, lam, lucVn, congNgay, HOM_NAY } from './omni-3-ke-hoach-chung'
import { chupHoSoTho, damBaoBangOmni, SQL_GHI_NHAN_DOI, SQL_XOA_NHAN_ROI } from '../server/src/omni-d1'
import { dauNgayVn } from '../server/src/srs2-d1'

const bang = (k: ReturnType<typeof taoKhoOmni>, sbd = 'S1') =>
  k.d.sql.prepare('SELECT vkn_id,p,n_tu_lam,n_cau,n_ngay,n_troi_chay,n_cau_la_dung,diem_sprt,trang_thai,day_lai,phien_ban FROM omni_p_vkn WHERE sbd=? ORDER BY vkn_id').all(sbd)

describe('ảnh chụp đêm omni_p_vkn chỉ ghi khi đổi', () => {
  it('đêm sau không có câu mới ⇒ 0 dòng ghi, bảng y hệt; em làm câu mới ⇒ chỉ nhãn đổi mang mốc mới; omni_em luôn mang mốc đêm', async () => {
    const k = taoKhoOmni({ 'DH-A': 60, 'DH-B': 40 }, 3)
    await damBaoBangOmni(k.env)
    for (const [i, q] of k.qids('DH-A').slice(0, 30).entries()) await lam(k.env, 'S1', q, lucVn(HOM_NAY, 8) + i * 60_000, i % 3 !== 0)
    const d1 = congNgay(HOM_NAY, 1), d2 = congNgay(HOM_NAY, 2), d3 = congNgay(HOM_NAY, 3)
    await chupHoSoTho(k.env, ['S1'], d1)
    const truoc = bang(k)
    expect(truoc.length).toBeGreaterThan(0)
    const thayDoi = () => (k.d.sql.prepare('SELECT total_changes() n').get() as { n: number }).n
    const t0 = thayDoi()
    await chupHoSoTho(k.env, ['S1'], d2)
    // Chỉ omni_em (xoá + chèn 1 dòng) và bản gọn đổi; omni_p_vkn không ghi dòng nào.
    expect(bang(k)).toEqual(truoc)
    expect(k.d.sql.prepare('SELECT COUNT(*) n FROM omni_p_vkn WHERE sbd=? AND cap_nhat_luc=?').get('S1', dauNgayVn(d2))).toEqual({ n: 0 })
    expect(thayDoi() - t0).toBeLessThanOrEqual(4)
    expect(k.d.sql.prepare('SELECT cap_nhat_luc FROM omni_em WHERE sbd=?').get('S1')).toEqual({ cap_nhat_luc: dauNgayVn(d2) })
    // Em làm thêm câu (DH-B) ⇒ đêm sau ghi các nhãn đổi, nhãn không đổi giữ mốc cũ.
    for (const [i, q] of k.qids('DH-B').slice(0, 20).entries()) await lam(k.env, 'S1', q, lucVn(d2, 9) + i * 60_000, i % 2 === 0)
    await chupHoSoTho(k.env, ['S1'], d3)
    const moi = k.d.sql.prepare('SELECT COUNT(*) n FROM omni_p_vkn WHERE sbd=? AND cap_nhat_luc=?').get('S1', dauNgayVn(d3)) as { n: number }
    expect(moi.n).toBeGreaterThan(0)
    // Đối chứng: chụp trên kho sạch cùng sổ ⇒ cùng số (trừ mốc).
    const k2 = taoKhoOmni({ 'DH-A': 60, 'DH-B': 40 }, 3)
    await damBaoBangOmni(k2.env)
    for (const [i, q] of k2.qids('DH-A').slice(0, 30).entries()) await lam(k2.env, 'S1', q, lucVn(HOM_NAY, 8) + i * 60_000, i % 3 !== 0)
    for (const [i, q] of k2.qids('DH-B').slice(0, 20).entries()) await lam(k2.env, 'S1', q, lucVn(d2, 9) + i * 60_000, i % 2 === 0)
    await chupHoSoTho(k2.env, ['S1'], d3)
    expect(bang(k)).toEqual(bang(k2))
  })

  it('SQL: chỉ sửa dòng đổi số; xoá đúng nhãn rời hồ sơ; em khác không bị đụng', async () => {
    const k = taoKhoOmni({ 'DH-A': 4 }, 2)
    await damBaoBangOmni(k.env)
    const r = (sbd: string, ds: unknown[][], moc: string) => k.d.sql.prepare(SQL_GHI_NHAN_DOI).run(sbd, JSON.stringify(ds), 'v1', moc).changes
    const dong = (id: string, p: number, tt = 'chua_vung') => [id, p, 3, 4, 2, 1, 2, 0.5, tt, 0]
    expect(r('S1', [dong('a', 0.5), dong('b', 0.25)], 'm1')).toBe(2)
    expect(r('S2', [dong('a', 0.9)], 'm1')).toBe(1)
    expect(r('S1', [dong('a', 0.5), dong('b', 0.25)], 'm2')).toBe(0) // y hệt ⇒ 0 dòng
    expect(r('S1', [dong('a', 0.5), dong('b', 0.75, 'vung')], 'm3')).toBe(1) // chỉ b
    expect(k.d.sql.prepare("SELECT vkn_id,p,trang_thai,cap_nhat_luc FROM omni_p_vkn WHERE sbd='S1' ORDER BY vkn_id").all()).toEqual([
      { vkn_id: 'a', p: 0.5, trang_thai: 'chua_vung', cap_nhat_luc: 'm1' },
      { vkn_id: 'b', p: 0.75, trang_thai: 'vung', cap_nhat_luc: 'm3' },
    ])
    expect(k.d.sql.prepare(SQL_XOA_NHAN_ROI).run('S1', JSON.stringify(['b'])).changes).toBe(1)
    expect(k.d.sql.prepare("SELECT sbd,vkn_id FROM omni_p_vkn ORDER BY sbd,vkn_id").all()).toEqual([{ sbd: 'S1', vkn_id: 'b' }, { sbd: 'S2', vkn_id: 'a' }])
  })
})
