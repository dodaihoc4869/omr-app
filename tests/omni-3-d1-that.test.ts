// @vitest-environment node
// OMNI 3 · LÀN B2 — LỚP D1 + LỆNH THẦY chạy với LÕI THẬT (làn A1 đã gộp: omni-p-vkn, du-bao-diem, omni-chung-chi, omni-q…) trên D1 thật (node:sqlite).
// Không giả lõi: kiểm tích hợp đầu-cuối + tính chất "xoá bảng đệm omni_* rồi gọi lại ⇒ hồ sơ / Bảng bài y hệt" với công thức thật (kể cả τ dùng β).
import { describe, expect, it } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import { KHOA_CON_TRO_DEM, chayOmniDem, hoSoOmniNhieuEm, omniChoPh, omniChoSanh, qCuaCau, xoaDemOmni } from '../server/src/omni-d1'
import { gvOmni } from '../server/src/omni-gv'
import { phHoc2 } from '../server/src/ph-bao-cao-moi'
import { gvChienDich } from '../server/src/srs2-gv'
import { ghiSuKien, type SuKien } from '../server/src/su-kien-hoc'
import { THAM_SO_OMNI } from '../server/src/omni-kieu'
import type { Env } from '../server/src/kieu'

const T0 = Date.parse('2026-10-05T03:00:00Z') // 10:00 Thứ Hai 05/10/2026 giờ VN
const NGAY = 86_400_000
const LOP1 = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']

function cau(d: D1That, qid: string, dang: string, phan: 'I' | 'II' | 'III' = 'I') {
  const json = { qid, maDe: 'DEA', version: 'v1', group: `g-${qid}`, phan, text: `Câu ${qid}`, choices: ['a', 'b', 'c', 'd'], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [], dang, tenDang: `Dạng ${dang}`,
    mucDo: 'Thông hiểu', kienThuc: [], correct: phan === 'II' ? 'DSDS' : phan === 'III' ? '12' : 'B', solution: {}, reviewed: true, hinhAnh: [] }
  d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DEA', qid, 'v1', `g-${qid}`, dang, JSON.stringify(json))
}
const sk = (sbd: string, qid: string, ms: number, kq: 0 | 1 | null, t: Partial<SuKien> = {}): SuKien => ({ nguon: 'game', maNguon: `p-${ms}-${qid}`, sbd, qid, lan: 1, ketQua: kq, luc: new Date(ms).toISOString(), receivedAt: ms, assistance: 'none', ...t })

async function dung(omni: unknown = { bat: true }) {
  const d = taoD1That()
  const env = d.env as unknown as Env
  const st = d.sql.prepare('INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,?,?,?)')
  LOP1.forEach((s, i) => st.run(s, `Em ${i + 1}`, '12A1', 'mk', 'x'))
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{\"bat\":true}','x')").run()
  if (omni) d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('omni',?,'x')").run(JSON.stringify(omni))
  for (const q of ['A1', 'A2', 'A3']) cau(d, q, 'D1')
  cau(d, 'A4', 'D2'); cau(d, 'A5', 'D2'); cau(d, 'A6', 'D2', 'II')
  d.sql.prepare("INSERT INTO cau_bo_tro(bam,qid_mau,nhan_nen_json,cap_nhat_luc) VALUES('b-A2','A2',?,'x')").run(JSON.stringify([{ buoc: 1, nen: 'can_bang_phuong_trinh' }, { buoc: 2, nen: 'nhan_ngoai_danh_muc' }]))
  const r = await gvChienDich(env, { action: 'tao', ten: 'Bài 6', lop: '12A1', maDe: ['DEA'], hanNop: '2026-10-12' }, T0 - 6 * NGAY)
  const ds: SuKien[] = []
  LOP1.forEach((s, i) => {
    for (let k = 1; k <= 5; k++) ds.push(sk(s, 'A1', T0 - k * NGAY + i * 1000, (k + i) % 3 ? 1 : 0, { raw: { ms: 30_000 + 1000 * k + 100 * i, tt: 'chac', td: 'thuong' } }))
    ds.push(sk(s, 'A2', T0 - 2 * NGAY + 60_000 + i, i % 2 ? 1 : 0, { raw: { ms: 50_000, tt: i === 1 ? 'chua_chac' : 'chac' } }))
    ds.push(sk(s, 'A6', T0 - NGAY + 120_000 + i, 1, { subitem: [1, i % 2, 1, null], raw: { ms: 90_000, tt: 'chac' } }))
  })
  for (let k = 2; k <= 5; k++) ds.push(sk('S3', 'A5', T0 - k * NGAY + 3_600_000, 0)) // 4 lần sai ⇒ rời kế hoạch
  ds.push(sk('S1', 'A4', T0 - 3_600_000, null, { purpose: 'luot' }))
  await ghiSuKien(env, ds)
  return { d, env, id: String(r.id) }
}

describe('lõi thật — tích hợp lớp D1', () => {
  it('Q gợi nhãn nền theo TEN_NEN (nhãn ngoài danh mục bị bỏ); hồ sơ thật có dang:/nen:, câu Đúng–sai theo ý', async () => {
    const { env } = await dung()
    const q = await qCuaCau(env, ['A2', 'A1'])
    expect(q.get('A2')).toMatchObject({ vkn: ['dang:D1', 'nen:can_bang_phuong_trinh'], nguon: 'goi_y' })
    expect(q.get('A1')).toMatchObject({ vkn: ['dang:D1'], nguon: 'mac_dinh' })
    const hs = (await hoSoOmniNhieuEm(env, LOP1, T0)).get('S1')!
    expect(hs.vkn['dang:D1']!.nTuLam).toBe(6) // 5 ngày A1 + A2
    expect(hs.vkn['nen:can_bang_phuong_trinh']!.nTuLam).toBe(1)
    expect(hs.vkn['dang:D2']!.nTuLam).toBe(3) // A6: 3 ý có kết quả (ý 4 bỏ trống)
    expect(hs.luotHomNay).toBe(1)
    expect(hs.sEm).toBeGreaterThan(0)
  })
  it('xoá bảng đệm omni_* rồi gọi lại ⇒ hồ sơ + Bảng bài y hệt; dựng lại từ sổ ra đúng bảng cũ', async () => {
    const { d, env, id } = await dung()
    while (!(await chayOmniDem(env, T0)).xong) { /* β + ảnh chụp + chứng chỉ */ }
    expect(d.dem('omni_beta_cau')).toBe(1) // A1: 30 lượt đúng có thời lượng ≥ 8 mẫu
    const anh = [d.chup('omni_em'), d.chup('omni_p_vkn'), d.chup('omni_beta_cau')]
    xoaDemOmni()
    const A = JSON.stringify([...(await hoSoOmniNhieuEm(env, LOP1, T0))])
    const bangA = await gvOmni(env, { action: 'bang', chienDichId: id }, T0)
    expect(bangA.ok).toBe(true)
    d.sql.exec('DELETE FROM omni_em; DELETE FROM omni_p_vkn; DELETE FROM omni_du_bao')
    xoaDemOmni()
    expect(JSON.stringify([...(await hoSoOmniNhieuEm(env, LOP1, T0))])).toBe(A)
    expect(await gvOmni(env, { action: 'bang', chienDichId: id }, T0)).toEqual(bangA)
    d.sql.exec(`DELETE FROM omni_em; DELETE FROM omni_p_vkn; DELETE FROM omni_du_bao; DELETE FROM omni_beta_cau; DELETE FROM cau_hinh WHERE khoa = '${KHOA_CON_TRO_DEM}'`)
    while (!(await chayOmniDem(env, T0)).xong) { /* dựng lại */ }
    expect([d.chup('omni_em'), d.chup('omni_p_vkn'), d.chup('omni_beta_cau')]).toEqual(anh)
    xoaDemOmni()
    expect(JSON.stringify([...(await hoSoOmniNhieuEm(env, LOP1, T0))])).toBe(A)
    expect(await gvOmni(env, { action: 'bang', chienDichId: id }, T0)).toEqual(bangA)
  })
  it('Sảnh / phụ huynh / Bảng bài trả đủ trường với lõi thật; cờ tắt ⇒ /ph/hoc-2 không có omni', async () => {
    const { env, id } = await dung()
    const s = (await omniChoSanh(env, 'S1', T0, { tong: 10, con: 0, chienDichId: id }))!
    expect(s).toMatchObject({ bat: true, baiDangLuyen: [{ id, ten: 'Bài 6', hanNop: '2026-10-12' }], dangVung: { a: expect.any(Number), b: 2 }, sMucTieu: THAM_SO_OMNI.C_SO_Y, ve: { con: 2, tong: 2 } })
    expect(s.deThu).toEqual({ duoc: true, soCau: 14, phut: 25 })
    expect(Array.isArray(s.nhatKy) || s.nhatKy === null).toBe(true)
    const ph = await phHoc2(env, { sbd: 'S3' }, T0)
    expect(Object.keys(ph.omni as object).sort()).toEqual(['canThayChua', 'chungChi', 'dangCanVung', 'gioHoc', 'hieuChuan', 'khoangCach8', 'sEm'])
    expect((ph.omni as { canThayChua: number }).canThayChua).toBe(1)
    expect(await omniChoPh(env, 'S3', T0)).toEqual(ph.omni)
    const b = await gvOmni(env, { action: 'bang', chienDichId: id }, T0)
    expect((b.canThayChua as { loai: string; qids?: string[] }[]).find((c) => c.loai === 'cat_tia')).toMatchObject({ qids: ['A5'], sbd: ['S3'] })
    const r = await gvOmni(env, { action: 'ca-chot', chienDichId: id })
    expect(r).toMatchObject({ ok: true, soLa: 0, soCu: 6 }) // kho không có câu TU LUYỆN cùng ô ⇒ bù đủ câu chiến dịch
    const tat = await dung(null)
    expect('omni' in (await phHoc2(tat.env, { sbd: 'S1' }, T0))).toBe(false)
  })
})
