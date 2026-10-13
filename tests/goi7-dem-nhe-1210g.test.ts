// @vitest-environment node
// KHẨN 12/10 22h30 (thầy: "tối ưu triệt để máy chủ cho học sinh làm bài tập giờ cao điểm phải mượt nhất và ổn định nhất"). Số đo D1 thật 24 giờ
// (`wrangler d1 insights`, workflow chỉ đọc do-d1-cao-diem-1210.yml) ⇒ bốn chỗ sửa máy chủ, khoá ở đây:
//  1. Lệnh nhẹ `hoc-tap-dem` (3 truy vấn chỉ đọc) trả ĐÚNG số "đã làm / M" của sảnh Gói 7 — mọi bước: chưa mở, mở, làm câu, câu hướng dẫn, trùng.
//  2. Cron đồng bộ gói chỉ GHI khi dòng câu đổi (trước: ghi lại y nguyên ~164 dòng/gói mỗi phút — ~1 triệu dòng ghi/ngày).
//  3. Đồng bộ ba hành trình: giờ cao điểm 20 phút/lượt (ngoài giờ 5 phút như cũ).
//  4. Danh mục hành trình (câu đọc ~23.000 dòng/lần): giờ cao điểm nhớ 10 phút (ngoài giờ 1 phút như cũ).
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoKhoOmni, themChienDich, lam, type KhoOmni } from './omni-3-ke-hoach-chung'
import { dongBoGoi7, lapGoi7, demHomNay7 } from '../server/src/goi-bai-7'
import { SQL_BANG_HANH_TRINH, dongBoBaHanhTrinh } from '../server/src/hanh-trinh-hop-nhat'
import { danhMuc } from '../server/src/hanh-trinh-v5-d1'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import type { Env } from '../server/src/kieu'

const NOW = Date.parse('2026-10-12T02:00:00Z') // 09:00 giờ VN
const CAO_DIEM = Date.parse('2026-10-12T14:00:00Z') // 21:00 giờ VN
const PHUT = 60_000
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe() })

/** Cùng kho với mot-con-so-goi7-1210: lớp "12 - Lớp Thường" (3 em), Bài 7 cũ + Bài 8 mới tick, Gói 7 bật. */
async function khoGoi7(soCauGoi = 192): Promise<KhoOmni & { token: string }> {
  const k = taoKhoOmni({ 'DH-B7': 40, 'DH-B8': soCauGoi }, 3)
  for (const q of SQL_BANG_HANH_TRINH) k.d.sql.exec(q)
  await damBaoBangBaiDaDay(k.env)
  k.d.sql.exec(`UPDATE hoc_sinh SET lop='12', ten_lop=NULL, mat_khau='mk';
    INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8. Amine',${soCauGoi},0,'v1'),('DH-B7','Bài 7. Ester',40,0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x'),('DH-B7','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x')`)
  const tick = k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
  tick.run('ester', '12 - Lớp Thường', 'B7', 'Bài 7. Ester', 7, '["DH-B7"]', '2026-10-01T02:00:00Z')
  tick.run('amine', '12 - Lớp Thường', 'B8', 'Bài 8. Amine', 8, '["DH-B8-TN","DH-B8-DS","DH-B8-TLN"]', '2026-10-11T11:00:00Z')
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: k.qids('DH-B8'), maDe: ['DH-B8'], sbd: ['S1', 'S2', 'S3'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, NOW)
  return { ...k, token: await gameToken(k.env, 'S1') }
}
type Goi7 = { goi7: { toiThieu: number; daLamHomNay: number } }
const sanh = async (env: Env, token: string, now: number) => { vi.setSystemTime(now); return (await gameV2(env, 'hoc-tap-sanh', { token })) as unknown as Goi7 }
const dem = async (env: Env, token: string, now: number) => { vi.setSystemTime(now); return (await gameV2(env, 'hoc-tap-dem', { token })) as { ok: boolean; daLamHomNay: number | null; toiThieu: number | null } }
const tongGhi = (k: KhoOmni) => Number((k.d.sql.prepare('SELECT total_changes() AS n').get() as { n: number }).n)

describe('1 · hoc-tap-dem = đúng số "đã làm / M" của sảnh Gói 7', () => {
  it('chưa mở sảnh hôm nay ⇒ đã làm 0, M chưa chốt = null (không bịa)', async () => {
    const k = await khoGoi7()
    expect(await dem(k.env, k.token, NOW)).toEqual({ ok: true, ngay: '2026-10-12', daLamHomNay: 0, toiThieu: null })
  })
  it('mọi bước trong ngày: mở · câu cũ đúng/sai · câu gói · câu hướng dẫn · hướng dẫn trùng câu đã làm — dem luôn bằng sảnh', async () => {
    const k = await khoGoi7()
    const so = async (t: number) => {
      const s = await sanh(k.env, k.token, t), d = await dem(k.env, k.token, t + 1000)
      expect({ daLam: d.daLamHomNay, muc: d.toiThieu }).toEqual({ daLam: s.goi7.daLamHomNay, muc: s.goi7.toiThieu })
      return d
    }
    expect(await so(NOW)).toMatchObject({ daLamHomNay: 0, toiThieu: 32 })
    const cu = k.qids('DH-B7')
    await lam(k.env, 'S1', cu[0]!, NOW + PHUT, true)
    await lam(k.env, 'S1', cu[1]!, NOW + 2 * PHUT, false)
    expect(await so(NOW + 3 * PHUT)).toMatchObject({ daLamHomNay: 2 })
    const moi = (await lapGoi7(k.env, 'S1', NOW + 4 * PHUT))!.plan.viec.map((v) => v.qid)
    for (const [i, q] of moi.slice(0, 5).entries()) await lam(k.env, 'S1', q, NOW + (5 + i) * PHUT, i % 2 === 0, { cauVersion: 'v1' })
    const gap = k.d.sql.prepare('INSERT INTO goi_bai_7_gap(receipt,goi_id,sbd,qid,version,kieu,luc) VALUES(?,?,?,?,?,?,?)')
    gap.run('r-a', 'g7:amine', 'S1', moi[6]!, 'v1', 'co_ho_tro', new Date(NOW + 20 * PHUT).toISOString())
    gap.run('r-b', 'g7:amine', 'S1', moi[0]!, 'v1', 'co_ho_tro', new Date(NOW + 21 * PHUT).toISOString()) // trùng câu đã làm ⇒ không cộng
    expect(await so(NOW + 22 * PHUT)).toMatchObject({ daLamHomNay: 8, toiThieu: 32 })
    // Em khác cùng lớp không lẫn số.
    const t2 = await gameToken(k.env, 'S2')
    expect((await dem(k.env, t2, NOW + 23 * PHUT)).daLamHomNay).toBe(0)
  })
  it('hàm thuần demHomNay7 = lệnh; lệnh có trong danh sách chạy song song cổng (chỉ đọc) và không ghi gì', async () => {
    const k = await khoGoi7()
    await sanh(k.env, k.token, NOW)
    const truoc = tongGhi(k)
    expect(await demHomNay7(k.env, 'S1', NOW + PHUT)).toEqual({ ok: true, ngay: '2026-10-12', daLamHomNay: 0, toiThieu: 32 })
    expect(tongGhi(k)).toBe(truoc)
    const src = readFileSync(new URL('../server/src/game-v2.ts', import.meta.url), 'utf8')
    expect(src).toMatch(/laLenhCongSongSong=\(action:string\):boolean=>\['hoc-tap-gap','hoc-tap-dem',/)
  })
})

describe('2 · cron đồng bộ gói chỉ ghi khi dòng câu đổi', () => {
  it('lượt đồng bộ lặp lại y nguyên ⇒ 0 dòng ghi; bảng câu không đổi', async () => {
    const k = await khoGoi7(60)
    const anh = () => JSON.stringify(k.d.sql.prepare('SELECT goi_id,qid,version,ma_de,meta_json FROM goi_bai_7_cau ORDER BY goi_id,qid').all())
    const bang = anh()
    expect(JSON.parse(bang).length).toBe(60)
    const truoc = tongGhi(k)
    await dongBoGoi7(k.env, NOW + PHUT, 2, '', true)
    await dongBoGoi7(k.env, NOW + 2 * PHUT, 2, '', true)
    expect(tongGhi(k) - truoc).toBe(0)
    expect(anh()).toBe(bang)
  })
  it('một dòng lệch (meta hỏng) ⇒ ghi lại ĐÚNG dòng ấy, về đúng bản chuẩn; câu rút khỏi chỉ mục ⇒ đánh hopLe=false một lần', async () => {
    const k = await khoGoi7(60)
    const chuan = k.d.sql.prepare("SELECT meta_json FROM goi_bai_7_cau WHERE goi_id='g7:amine' ORDER BY qid LIMIT 1").get() as { meta_json: string }
    k.d.sql.exec(`UPDATE goi_bai_7_cau SET meta_json='{"hong":1}' WHERE rowid=(SELECT rowid FROM goi_bai_7_cau WHERE goi_id='g7:amine' ORDER BY qid LIMIT 1);
      INSERT INTO goi_bai_7_cau(goi_id,qid,version,ma_de,meta_json) VALUES('g7:amine','DH-B8-rut','v1','DH-B8','{"qid":"DH-B8-rut","hopLe":true}')`)
    const truoc = tongGhi(k)
    await dongBoGoi7(k.env, NOW + PHUT, 2, '', true)
    expect(tongGhi(k) - truoc).toBe(2)
    expect((k.d.sql.prepare("SELECT meta_json FROM goi_bai_7_cau WHERE goi_id='g7:amine' ORDER BY qid LIMIT 1").get() as { meta_json: string }).meta_json).toBe(chuan.meta_json)
    expect(JSON.parse((k.d.sql.prepare("SELECT meta_json FROM goi_bai_7_cau WHERE qid='DH-B8-rut'").get() as { meta_json: string }).meta_json)).toEqual({ qid: 'DH-B8-rut', hopLe: false })
    const sau = tongGhi(k)
    await dongBoGoi7(k.env, NOW + 2 * PHUT, 2, '', true)
    expect(tongGhi(k) - sau).toBe(0)
  })
})

describe('3 · đồng bộ ba hành trình: 20 phút/lượt giờ cao điểm, 5 phút ngoài giờ', () => {
  it('ngoài giờ: sau 6 phút chạy lại; giờ cao điểm: 6 phút / 19 phút vẫn nghỉ, 21 phút chạy', async () => {
    const k = await khoGoi7(60)
    expect((await dongBoBaHanhTrinh(k.env, NOW)).trangThai).not.toBe('da_cap_nhat')
    expect((await dongBoBaHanhTrinh(k.env, NOW + 6 * PHUT)).trangThai).not.toBe('da_cap_nhat')
    expect((await dongBoBaHanhTrinh(k.env, CAO_DIEM)).trangThai).not.toBe('da_cap_nhat')
    expect((await dongBoBaHanhTrinh(k.env, CAO_DIEM + 6 * PHUT)).trangThai).toBe('da_cap_nhat')
    expect((await dongBoBaHanhTrinh(k.env, CAO_DIEM + 19 * PHUT)).trangThai).toBe('da_cap_nhat')
    expect((await dongBoBaHanhTrinh(k.env, CAO_DIEM + 21 * PHUT)).trangThai).not.toBe('da_cap_nhat')
  })
})

describe('4 · danh mục hành trình: nhớ 10 phút giờ cao điểm, 1 phút ngoài giờ', () => {
  it('đếm câu đọc danh mục (json hanhTrinh) theo thời điểm', async () => {
    const k = await khoGoi7(60)
    let soDoc = 0
    const goc = k.env.DB.prepare.bind(k.env.DB)
    const env = { ...k.env, DB: { ...k.env.DB, prepare: (q: string) => { if (q.includes("json_extract(g.json,'$.hanhTrinh')")) soDoc++; return goc(q) }, batch: k.env.DB.batch.bind(k.env.DB) } } as unknown as Env
    const hs = { chienDich: null, phamVi: { maDe: new Set(['DH-B8']) }, cau: k.qids('DH-B8').slice(0, 20).map((qid) => ({ qid })) } as unknown as Parameters<typeof danhMuc>[1]
    await danhMuc(env, hs, NOW); await danhMuc(env, hs, NOW + 2 * PHUT)
    expect(soDoc).toBe(2) // ngoài giờ: quá 1 phút ⇒ đọc lại
    soDoc = 0
    await danhMuc(env, hs, CAO_DIEM); await danhMuc(env, hs, CAO_DIEM + 9 * PHUT)
    expect(soDoc).toBe(1) // giờ cao điểm: trong 10 phút dùng bản nhớ
    await danhMuc(env, hs, CAO_DIEM + 11 * PHUT)
    expect(soDoc).toBe(2)
  })
})
