// @vitest-environment node
// CHẤM LẠI BÀI BỊ KẸT CÂU TẠM GIỮ (thầy 04/11 «Cho phép đẩy luôn ko hỏi lại»): trước #822 chặng có câu đang giữ cho ca thi không mở được ⇒ em nộp bài với
// chặng ấy 0 câu. `chamLaiCauGiu0411` chỉ nâng điểm bài có chặng CHƯA MỞ chứa câu hiện vẫn đang giữ; lưu điểm cũ; chạy một lần.
import { afterEach, expect, it, vi } from 'vitest'

const giu = vi.hoisted(() => new Set<string>())
vi.mock('../server/src/game-v2-bank', async (goc) => ({ ...(await goc<typeof import('../server/src/game-v2-bank')>()), protectedQuestions: async () => new Set(giu) }))

import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { lapKtCn, docKtCn, ktCnAction, chamLaiCauGiu0411 } from '../server/src/kiem-tra-ca-nhan'
import { xoaDemCauNghi } from '../server/src/chan-khac-khoi'

const NOW = Date.parse('2026-10-13T02:00:00Z')
afterEach(() => { giu.clear(); xoaDemPhamVi(); xoaDemCauNghi() })
type De = { cau: { q: { qid: string; correct: string } }[]; chang: { qids: string[] }[] }
async function kho(sbds: string[]) {
  const k = taoKhoOmni({ 'DH-12-B0': 40, 'DH-12-B1': 40 }); await damBaoBangBaiDaDay(k.env)
  k.d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('kiem_tra_ca_nhan_v1','{"bat":true}','x');
  INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES('b0','12A1','B0','Bài cũ',0,'["DH-12-B0"]','2026-10-01'),('b1','12A1','B1','Bài mới',1,'["DH-12-B1"]','2026-10-12');`)
  for (const ma of ['DH-12-B0', 'DH-12-B1']) {
    k.d.sql.prepare('INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES(?,?,40,0,?)').run(ma, ma, 'v1')
    k.d.sql.prepare('INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,?,?)').run(ma, 'v1', 'x')
    for (const qid of k.qids(ma)) k.d.sql.prepare("INSERT INTO omni_q(qid,y,vkn_json,nguon,duyet_luc) VALUES(?,-1,?,'thay','x')").run(qid, JSON.stringify([ma + '.kn']))
  }
  const bai: { id: string; d: De; sbd: string }[] = []
  for (const sbd of sbds) {
    await lapKtCn(k.env, sbd, NOW, false, false, false)
    const r = (await docKtCn(k.env, sbd, NOW))!, d = JSON.parse(String(r.json)) as De & { chang: { qids: string[]; giay: number }[] }
    // Đề thử chỉ một chặng ⇒ tách đôi (như bài thật nhiều chặng) để có «chặng cuối không mở được».
    if (d.chang.length === 1) { const c = d.chang[0]!, n = Math.ceil(c.qids.length / 2); d.chang = [{ ...c, qids: c.qids.slice(0, n) }, { ...c, qids: c.qids.slice(n) }]; k.d.sql.prepare('UPDATE kiem_tra_ca_nhan SET json=? WHERE id=?').run(JSON.stringify(d), String(r.id)) }
    bai.push({ id: String(r.id), d, sbd })
  }
  return { k, bai }
}
/** Như em kẹt trước #822: làm đúng mọi chặng trừ chặng cuối (không mở được), rồi nộp bài. */
async function lamTruChangCuoi(k: Awaited<ReturnType<typeof kho>>['k'], sbd: string, id: string, d: De) {
  const r = (await docKtCn(k.env, sbd, NOW))!, now = Number(r.mo_luc) + 1000, cuoi = d.chang.length - 1
  for (let i = 0; i < cuoi; i++) {
    await ktCnAction(k.env, sbd, 'hoc-tap-ktcn-start', { id, chang: i }, now + i * 10)
    const rev = Number((await docKtCn(k.env, sbd, now))!.revision)
    const tra = Object.fromEntries(d.cau.filter((c) => d.chang[i]!.qids.includes(c.q.qid)).map((c) => [c.q.qid, c.q.correct]))
    await ktCnAction(k.env, sbd, 'hoc-tap-ktcn-chot-chang', { id, chang: i, tra, revision: rev }, now + i * 10 + 5)
  }
  await ktCnAction(k.env, sbd, 'hoc-tap-ktcn-nop', { id }, now + 60_000)
}
const diem = (k: Awaited<ReturnType<typeof kho>>['k'], id: string) => Number((k.d.sql.prepare('SELECT diem FROM kiem_tra_ca_nhan WHERE id=?').get(id) as { diem: number }).diem)

it('bài có chặng chưa mở chứa câu đang giữ ⇒ nâng điểm (bỏ chặng ấy khỏi tử + mẫu), lưu điểm cũ; bài chặng chưa mở KHÔNG có câu giữ ⇒ giữ nguyên; chạy lần hai không đổi', async () => {
  const { k, bai } = await kho(['S1', 'S2'])
  const [a, b] = bai as [typeof bai[0], typeof bai[0]]
  expect(a.d.chang.length).toBeGreaterThan(1)
  await lamTruChangCuoi(k, 'S1', a.id, a.d)
  await lamTruChangCuoi(k, 'S2', b.id, b.d)
  k.d.sql.prepare("UPDATE kiem_tra_ca_nhan SET ngay='2026-11-03'").run() // trong khung chấm lại 28/10–03/11
  const cuA = diem(k, a.id), cuB = diem(k, b.id)
  expect(cuA).toBeLessThan(10)
  giu.add(a.d.chang[a.d.chang.length - 1]!.qids[0]!) // câu chặng cuối của S1 vẫn đang giữ cho ca thi
  ;(k.env as { DE?: unknown }).DE = {}
  const kq = await chamLaiCauGiu0411(k.env, NOW + 3_600_000)
  expect(kq).toMatchObject({ soBai: 1 })
  expect(diem(k, a.id)).toBe(10)
  expect(diem(k, b.id)).toBe(cuB)
  expect(k.d.sql.prepare('SELECT id,diem_cu,diem_moi,chang_bo FROM ktcn_cham_lai').all()).toEqual([{ id: a.id, diem_cu: cuA, diem_moi: 10, chang_bo: JSON.stringify([a.d.chang.length]) }])
  expect(await chamLaiCauGiu0411(k.env, NOW + 7_200_000)).toBeNull()
  expect(k.d.sql.prepare('SELECT COUNT(*) n FROM ktcn_cham_lai').get()).toMatchObject({ n: 1 })
})

it('ngoài khung 28/10–03/11 ⇒ không đụng', async () => {
  const { k, bai } = await kho(['S1'])
  const a = bai[0]!
  await lamTruChangCuoi(k, 'S1', a.id, a.d)
  k.d.sql.prepare("UPDATE kiem_tra_ca_nhan SET ngay='2026-11-04'").run()
  const cu = diem(k, a.id)
  giu.add(a.d.chang[a.d.chang.length - 1]!.qids[0]!)
  await chamLaiCauGiu0411(k.env, NOW + 3_600_000)
  expect(diem(k, a.id)).toBe(cu)
})
