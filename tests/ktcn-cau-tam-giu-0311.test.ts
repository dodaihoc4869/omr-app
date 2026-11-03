// @vitest-environment node
// LỖI 03/11 21:12 (ảnh thầy: «Một câu của bài đang đổi nguồn hoặc được giữ cho ca kiểm tra… Tải lại», 4/5 chặng chốt, hạn 24:00): MỘT câu của chặng 5 nằm trong
// đề một ca thi chưa công bố ⇒ `kiemNguon` ném lỗi ⇒ cả chặng không mở được, nộp xong cũng không xem được kết quả. Nay câu ấy TẠM GIỮ: không xuống máy, không
// hiện ở phần chữa, chưa trả lời thì không tính điểm; các câu còn lại em làm bình thường.
import { afterEach, expect, it, vi } from 'vitest'

const giu = vi.hoisted(() => new Set<string>())
vi.mock('../server/src/game-v2-bank', async (goc) => ({ ...(await goc<typeof import('../server/src/game-v2-bank')>()), protectedQuestions: async () => new Set(giu) }))

import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { lapKtCn, docKtCn, ktCnAction } from '../server/src/kiem-tra-ca-nhan'
import { xoaDemCauNghi } from '../server/src/chan-khac-khoi'

const NOW = Date.parse('2026-10-13T02:00:00Z')
afterEach(() => { giu.clear(); xoaDemPhamVi(); xoaDemCauNghi() })
async function kho() {
  const k = taoKhoOmni({ 'DH-12-B0': 12, 'DH-12-B1': 12 }); await damBaoBangBaiDaDay(k.env)
  k.d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('kiem_tra_ca_nhan_v1','{"bat":true}','x');
  INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES('b0','12A1','B0','Bài cũ',0,'["DH-12-B0"]','2026-10-01'),('b1','12A1','B1','Bài mới',1,'["DH-12-B1"]','2026-10-12');`)
  for (const ma of ['DH-12-B0', 'DH-12-B1']) {
    k.d.sql.prepare('INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES(?,?,12,0,?)').run(ma, ma, 'v1')
    k.d.sql.prepare('INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,?,?)').run(ma, 'v1', 'x')
    for (const qid of k.qids(ma)) k.d.sql.prepare("INSERT INTO omni_q(qid,y,vkn_json,nguon,duyet_luc) VALUES(?,-1,?,'thay','x')").run(qid, JSON.stringify([ma + '.kn']))
  }
  return k
}
type De = { cau: { q: { qid: string; correct: string; phan: string } }[]; chang: { qids: string[] }[] }

it('một câu của chặng đang giữ cho ca thi ⇒ chặng vẫn mở (không gửi câu ấy), nộp được, câu giữ không tính điểm, không hiện ở phần chữa', async () => {
  const k = await kho(); await lapKtCn(k.env, 'S1', NOW, false, false, false)
  const r = (await docKtCn(k.env, 'S1', NOW))!, id = String(r.id), d = JSON.parse(String(r.json)) as De, now = Number(r.mo_luc) + 1000
  const s = d.chang.length - 1, cauGiu = d.chang[s]!.qids[0]!
  expect(d.chang[s]!.qids.length).toBeGreaterThan(1)
  giu.add(cauGiu)
  const mo = await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-start', { id, chang: s }, now)
  const ds = (mo.questions as { qid: string }[]).map((q) => q.qid)
  expect(ds).not.toContain(cauGiu)
  expect(ds.length).toBe(d.chang[s]!.qids.length - 1)
  expect(mo.soGiu).toBe(1)
  expect(Object.keys(mo.tra as object)).not.toContain(cauGiu)
  expect(JSON.stringify(mo)).not.toContain(cauGiu) // không lộ gì của câu đang bảo vệ
  // em làm ĐÚNG mọi câu được nhận ở mọi chặng ⇒ điểm tối đa (câu giữ chưa trả lời không kéo điểm xuống)
  for (let i = 0; i < d.chang.length; i++) {
    if (i !== s) await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-start', { id, chang: i }, now)
    const bai = (await docKtCn(k.env, 'S1', now))!
    const tra = Object.fromEntries(d.cau.filter((c) => d.chang[i]!.qids.includes(c.q.qid) && c.q.qid !== cauGiu).map((c) => [c.q.qid, c.q.correct]))
    await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-chot-chang', { id, chang: i, tra, revision: Number(bai.revision) }, now + 2_000 + i)
  }
  const kq = await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-nop', { id }, now + 60_000)
  expect(kq.kiemTra).toMatchObject({ trangThai: 'da_nop' })
  expect(Number((await docKtCn(k.env, 'S1', now + 60_000))!.diem)).toBe(10)
  const xem = await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-ket-qua', { id }, now + 61_000)
  const cau = (xem.ketQua as { cau: { de: { qid: string } }[] }).cau
  expect(cau.length).toBe(d.cau.length - 1)
  expect(cau.map((c) => c.de.qid)).not.toContain(cauGiu)
})

it('cả chặng đều đang giữ ⇒ báo rõ, em làm chặng khác', async () => {
  const k = await kho(); await lapKtCn(k.env, 'S1', NOW, false, false, false)
  const r = (await docKtCn(k.env, 'S1', NOW))!, id = String(r.id), d = JSON.parse(String(r.json)) as De
  for (const q of d.chang[0]!.qids) giu.add(q)
  await expect(ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-start', { id, chang: 0 }, Number(r.mo_luc) + 1000)).rejects.toThrow(/chặng khác/)
})
