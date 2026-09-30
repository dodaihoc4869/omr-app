// @vitest-environment node
// RẢI ĐỀU CÂU MỚI THEO NGÀY (thầy chốt 30/09) — lớp D1 + lệnh thầy `/gv/chien-dich`:
// cờ lưu ở bảng phụ chỉ-thêm `chien_dich_tuy_chon` (tạo lúc chạy, không ALTER `chien_dich`); KHÔNG có dòng ⇒ BẬT (chiến dịch cũ đang chạy cũng bật);
// `tao` mặc định bật (không ghi dòng), `tao {raiDeu:false}` ghi dòng; action `rai-deu {id, bat}` đổi cờ trên chiến dịch đang chạy mà KHÔNG đụng kế hoạch
// đã chốt hôm nay ⇒ hiệu lực từ kế hoạch ngày kế tiếp; `suc-chua` giữ nguyên tiLe/muc/sucChua, chỉ thêm `cauMoiMoiNgay`.
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { gvChienDich } from '../server/src/srs2-gv'
import { docChienDichCuaEm, layKeHoachHomNay } from '../server/src/srs2-d1'
import type { Env } from '../server/src/kieu'

const NGAY = 86_400_000
const T0 = Date.parse('2026-09-29T03:00:00Z') // 10:00 VN thứ Ba 29/09
const HAN = '2026-10-05' // D = 7 tính từ 29/09

function cauJson(qid: string) {
  return JSON.stringify({ qid, maDe: 'DE1', version: 'v1', group: `g-${qid}`, phan: 'I', text: `Câu ${qid}`, choices: ['a', 'b', 'c', 'd'], ideas: [], hinhAnh: [], dang: 'D1', tenDang: 'Dạng 1', mucDo: 'NB', sao: 1, kienThuc: ['k'], correct: 'B', reviewed: true, solution: { chot: 'c' } })
}
function dung(soCau = 120) {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn An','12A1','mk1','x')")
  d.sql.exec(`INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DE1','Ester',${soCau},0,'v1')`)
  d.sql.exec("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')")
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 1; i <= soCau; i++) st.run('DE1', `Q${i}`, 'v1', `g-Q${i}`, 'D1', cauJson(`Q${i}`))
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["12A1"]}','x')`)
  return { d, env }
}
const coBangTuyChon = (d: ReturnType<typeof dung>['d']) => d.sql.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table' AND name='chien_dich_tuy_chon'").get() as { n: number }
async function tao(env: Env, them: Record<string, unknown> = {}) {
  const r = await gvChienDich(env, { action: 'tao', ten: 'Ester – Lipid', lop: '12A1', maDe: ['DE1'], hanNop: HAN, theLucNgay: 49, ...them }, T0)
  expect(r.ok).toBe(true)
  return String(r.id)
}
const cdTrong = (r: Record<string, unknown>, id: string) => (r.chienDich as { id: string; raiDeu?: boolean }[]).find((c) => c.id === id)!

describe('rải đều — lưu cờ, mặc định bật', () => {
  it('(a) `tao` mặc định ⇒ không có dòng chien_dich_tuy_chon, danh-sach/bang/chan-doan-em trả raiDeu=true; `tao {raiDeu:false}` ⇒ có dòng, trả false', async () => {
    const { d, env } = dung()
    const id1 = await tao(env)
    expect(coBangTuyChon(d).n).toBe(0) // bật = không cần bảng/dòng phụ
    const id2 = await tao(env, { ten: 'Đổ theo sức', raiDeu: false })
    expect(coBangTuyChon(d).n).toBe(1)
    expect(d.dem('chien_dich_tuy_chon')).toBe(1)
    expect(d.dem('chien_dich_tuy_chon', `id = '${id2}' AND rai_deu = 0`)).toBe(1)
    const ds = await gvChienDich(env, { action: 'danh-sach' }, T0)
    expect(cdTrong(ds, id1).raiDeu).toBe(true)
    expect(cdTrong(ds, id2).raiDeu).toBe(false)
    const bang1 = await gvChienDich(env, { action: 'bang', id: id1 }, T0)
    expect((bang1.chienDich as { raiDeu: boolean }).raiDeu).toBe(true)
    const bang2 = await gvChienDich(env, { action: 'bang', id: id2 }, T0)
    expect((bang2.chienDich as { raiDeu: boolean }).raiDeu).toBe(false)
  })
  it('(b) chiến dịch tạo TỪ TRƯỚC (chèn thẳng, bảng phụ chưa có) ⇒ null ⇒ BẬT', async () => {
    const { d, env } = dung()
    d.sql.prepare(`INSERT INTO chien_dich (id, ten, lop, sbd_json, ma_de_json, qid_json, han_nop, the_luc_ngay, huyet_chien, ma_ca, tao_luc, trang_thai) VALUES ('cd-cu','Cũ','12A1','["S1"]','["DE1"]',?,?,49,1,NULL,?,'dang_chay')`)
      .run(JSON.stringify(Array.from({ length: 120 }, (_, i) => `Q${i + 1}`)), HAN, new Date(T0 - NGAY).toISOString())
    expect(coBangTuyChon(d).n).toBe(0)
    const cd = (await docChienDichCuaEm(env, 'S1')).find((c) => c.id === 'cd-cu')!
    expect(cd.raiDeu).toBe(true)
    const kh = await layKeHoachHomNay(env, 'S1', T0)
    expect(kh.kh.tong).toBe(30) // 120 câu / (7 − 3) = 30 câu mới, không 49
  })
  it('(d) kế hoạch hôm nay với chiến dịch BẬT: tong = quota câu mới (30 < thể lực 49); chan-doan-em trả raiDeu + lapLaiSeRa.raiDeu', async () => {
    const { env } = dung()
    const id = await tao(env)
    const { kh } = await layKeHoachHomNay(env, 'S1', T0)
    expect(kh.tong).toBe(30)
    expect(kh.dao).toHaveLength(30)
    const cd = await gvChienDich(env, { action: 'chan-doan-em', sbd: 'S1' }, T0)
    expect(cd).toMatchObject({ ok: true, chienDichDangChay: { id, raiDeu: true }, lapLaiSeRa: { dao: 30, raiDeu: true } })
  })
  it('(f) `rai-deu` với id không tồn tại ⇒ ok:false', async () => {
    const { env } = dung()
    const r = await gvChienDich(env, { action: 'rai-deu', id: 'khong-co', bat: false }, T0)
    expect(r.ok).toBe(false)
  })
})

describe('rải đều — đổi công tắc trên chiến dịch đang chạy', () => {
  it('(c) `rai-deu {id, bat:false}`: đổi cờ, xoá đệm; kế hoạch hôm nay ĐÃ CHỐT không đổi (tong 30); ngày mai lập theo luật TẮT (đổ đủ thể lực)', async () => {
    const { d, env } = dung()
    const id = await tao(env)
    const truoc = await layKeHoachHomNay(env, 'S1', T0)
    expect(truoc.kh.tong).toBe(30)
    const daoTruoc = d.sql.prepare('SELECT dao_json, tong FROM srs2_ke_hoach WHERE sbd = ? AND ngay = ?').get('S1', '2026-09-29') as { dao_json: string; tong: number }

    const r = await gvChienDich(env, { action: 'rai-deu', id, bat: false, nguoi: 'thầy' }, T0 + 60_000)
    expect(r).toMatchObject({ ok: true, id, raiDeu: false })
    expect(d.dem('chien_dich_tuy_chon', `id = '${id}' AND rai_deu = 0`)).toBe(1)
    expect(d.dem('nhat_ky_may', "nguon = 'sua_chien_dich' AND muc = 'tin'")).toBe(1)
    const ds = await gvChienDich(env, { action: 'danh-sach' }, T0 + 60_000)
    expect(cdTrong(ds, id).raiDeu).toBe(false) // đệm 15 s đã xoá ⇒ thấy ngay

    // Hôm nay: kế hoạch đã chốt y nguyên (không UPDATE srs2_ke_hoach)
    const sau = await layKeHoachHomNay(env, 'S1', T0 + 120_000)
    expect(sau.kh.tong).toBe(30)
    const daoSau = d.sql.prepare('SELECT dao_json, tong FROM srs2_ke_hoach WHERE sbd = ? AND ngay = ?').get('S1', '2026-09-29') as { dao_json: string; tong: number }
    expect(daoSau).toEqual(daoTruoc)

    // Ngày mai (30/09, D = 6, 120 câu mới chưa làm): TẮT ⇒ quota 40 rồi đổ cho đầy 49
    const mai = await layKeHoachHomNay(env, 'S1', T0 + NGAY)
    expect(mai.kh.tong).toBe(49)

    // Bật lại ⇒ ngày kia (01/10, D = 5): quota = ceil(120/2) = 60 > thể lực ⇒ 49 (bằng thể lực là đúng luật); xoá kế hoạch 01/10 chưa có ⇒ lập mới
    const r2 = await gvChienDich(env, { action: 'rai-deu', id, bat: true }, T0 + NGAY)
    expect(r2).toMatchObject({ ok: true, raiDeu: true })
    expect(d.dem('chien_dich_tuy_chon', `id = '${id}' AND rai_deu = 1`)).toBe(1)
  })
  it('(c2) bật lại trên chiến dịch đã tắt ⇒ ngày kế tiếp lập theo quota', async () => {
    const { env } = dung()
    const id = await tao(env, { raiDeu: false })
    expect((await layKeHoachHomNay(env, 'S1', T0)).kh.tong).toBe(49)
    await gvChienDich(env, { action: 'rai-deu', id, bat: true }, T0)
    // ngày mai (D = 6): 120 câu mới ⇒ quota = ceil(120/3) = 40 < 49
    expect((await layKeHoachHomNay(env, 'S1', T0 + NGAY)).kh.tong).toBe(40)
  })
})

describe('rải đều — đồng hồ sức chứa', () => {
  it('(e) `suc-chua`: tiLe/muc/sucChua KHÔNG đổi khi bật/tắt; trả raiDeu + cauMoiMoiNgay = ceil(cauMoi/(D−3))', async () => {
    const { env } = dung()
    const dauVao = { action: 'suc-chua', lop: '12A1', maDe: ['DE1'], hanNop: HAN, theLucNgay: 49 }
    const bat = await gvChienDich(env, dauVao, T0)
    const tat = await gvChienDich(env, { ...dauVao, raiDeu: false }, T0)
    expect(bat.ok).toBe(true)
    expect([bat.tiLe, bat.muc, bat.sucChua, bat.D]).toEqual([tat.tiLe, tat.muc, tat.sucChua, tat.D])
    expect(bat).toMatchObject({ D: 7, raiDeu: true, cauMoiMoiNgay: 30 })
    expect(tat).toMatchObject({ raiDeu: false, cauMoiMoiNgay: 30 })
  })
})
