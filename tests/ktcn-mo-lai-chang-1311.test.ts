// @vitest-environment node
// 13/11 (em SBD 10041 «đi học về thì nó không cho em làm chặng 3, 4 nữa»; thầy «xem bao nhiêu hs bị lỗi này, sửa triệt để»): em bấm mở chặng rồi rời app ⇒ đồng hồ
// chặng chạy hết khi em vắng ⇒ chặng khoá với 0 câu trả lời (đo 01–12/11: 36 lượt bài, 171 câu bỏ trống). Nay chặng HẾT GIỜ mà em CHƯA TRẢ LỜI câu nào được MỞ LẠI
// MỘT LẦN, đủ giờ của chặng (không quá hạn bài). Chặng em đã trả lời / đã bấm nộp sớm / đã mở lại một lần / bài đã nộp ⇒ không mở lại.
import { afterEach, expect, it } from 'vitest'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { lapKtCn, docKtCn, ktCnAction } from '../server/src/kiem-tra-ca-nhan'
import { xoaDemCauNghi } from '../server/src/chan-khac-khoi'

const NOW = Date.parse('2026-10-13T02:00:00Z')
afterEach(() => { xoaDemPhamVi(); xoaDemCauNghi() })
async function kho() {
  const k = taoKhoOmni({ 'DH-12-B0': 40, 'DH-12-B1': 40 }); await damBaoBangBaiDaDay(k.env)
  k.d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('kiem_tra_ca_nhan_v1','{"bat":true}','x');
  INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES('b0','12A1','B0','Bài cũ',0,'["DH-12-B0"]','2026-10-01'),('b1','12A1','B1','Bài mới',1,'["DH-12-B1"]','2026-10-12');`)
  for (const ma of ['DH-12-B0', 'DH-12-B1']) {
    k.d.sql.prepare('INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES(?,?,40,0,?)').run(ma, ma, 'v1')
    k.d.sql.prepare('INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,?,?)').run(ma, 'v1', 'x')
    for (const qid of k.qids(ma)) k.d.sql.prepare("INSERT INTO omni_q(qid,y,vkn_json,nguon,duyet_luc) VALUES(?,-1,?,'thay','x')").run(qid, JSON.stringify([ma + '.kn']))
  }
  await lapKtCn(k.env, 'S1', NOW, false, false, false)
  let r = (await docKtCn(k.env, 'S1', NOW))!
  // Đề giả nhỏ (2 câu) ⇒ chia lại thành 2 chặng một câu (mỗi chặng 120 giây) để thử luật nhiều chặng.
  const goc = JSON.parse(String(r.json)) as { cau: { q: { qid: string } }[]; chang: { qids: string[]; giay: number }[] }
  const qs = goc.cau.map((c) => c.q.qid)
  goc.chang = qs.slice(0, 2).map((q) => ({ qids: [q], giay: 120 }))
  k.d.sql.prepare('UPDATE kiem_tra_ca_nhan SET json=? WHERE id=?').run(JSON.stringify(goc), String(r.id))
  r = (await docKtCn(k.env, 'S1', NOW))!
  const d = JSON.parse(String(r.json)) as { cau: { q: { qid: string; correct: string; phan: string } }[]; chang: { qids: string[]; giay: number }[] }
  expect(d.chang.length).toBe(2)
  return { k, id: String(r.id), d, mo: Number(r.mo_luc), han: Number(r.han_luc) }
}
type Chang = { stt: number; han: number | null; daChot: boolean }
const trangThai = async (k: Awaited<ReturnType<typeof kho>>['k'], id: string, now: number) => (await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-trang-thai', { id }, now)).chang as Chang[]
const dapAn = (q: { phan: string; correct: string }) => (q.phan === 'I' ? 'A' : q.phan === 'II' ? 'DDDD' : '1')

it('mở chặng rồi rời app ⇒ hết giờ, 0 câu trả lời ⇒ trạng thái báo «Làm chặng» (không khoá); mở lại đủ giờ của chặng, lưu được; lần hết giờ thứ hai ⇒ khoá', async () => {
  const { k, id, d, mo } = await kho()
  const t0 = mo + 3_600_000
  const a = await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-start', { id, chang: 0 }, t0)
  expect(a.daChot).toBe(false)
  const hetGio = Number(a.hanChang) + 5 * 3_600_000 // em đi học, về sau 5 giờ
  let ds = await trangThai(k, id, hetGio)
  expect(ds[0]).toMatchObject({ stt: 0, han: null, daChot: false })
  const b = await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-start', { id, chang: 0 }, hetGio)
  expect(b.daChot).toBe(false)
  expect(Number(b.hanChang)).toBe(hetGio + d.chang[0]!.giay * 1000)
  const q0 = d.cau.find((c) => c.q.qid === d.chang[0]!.qids[0])!.q
  const luu = await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-luu', { id, chang: 0, tra: { [q0.qid]: dapAn(q0) }, revision: Number(b.revision) }, hetGio + 1000)
  expect(luu.daLuu).toBe(true)
  // Mở lại rồi lại bỏ đi (0 câu MỚI nhưng đã có 1 câu trả lời) ⇒ hết giờ lần hai ⇒ khoá như cũ.
  ds = await trangThai(k, id, Number(b.hanChang) + 1000)
  expect(ds[0]!.daChot).toBe(true)
  expect(k.d.sql.prepare('SELECT COUNT(*) n FROM kiem_tra_ca_nhan_mo_lai').get()).toEqual({ n: 1 })
})

it('chỉ MỘT lần: mở lại rồi lại bỏ trống tới hết giờ ⇒ không mở lại lần nữa', async () => {
  const { k, id, mo } = await kho()
  const a = await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-start', { id, chang: 1 }, mo + 1000)
  const t1 = Number(a.hanChang) + 60_000
  const b = await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-start', { id, chang: 1 }, t1)
  expect(b.daChot).toBe(false)
  const t2 = Number(b.hanChang) + 60_000
  expect((await trangThai(k, id, t2))[1]).toMatchObject({ daChot: true })
  const c = await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-start', { id, chang: 1 }, t2)
  expect(c.daChot).toBe(true)
})

it('em đã trả lời ít nhất một câu rồi hết giờ (đang làm thật) ⇒ KHÔNG mở lại', async () => {
  const { k, id, d, mo } = await kho()
  const a = await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-start', { id, chang: 0 }, mo + 1000)
  const q0 = d.cau.find((c) => c.q.qid === d.chang[0]!.qids[0])!.q
  await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-luu', { id, chang: 0, tra: { [q0.qid]: dapAn(q0) }, revision: Number(a.revision) }, mo + 2000)
  const sau = Number(a.hanChang) + 60_000
  expect((await trangThai(k, id, sau))[0]).toMatchObject({ daChot: true })
  expect((await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-start', { id, chang: 0 }, sau)).daChot).toBe(true)
})

it('em bấm NỘP CHẶNG sớm với 0 câu ⇒ KHÔNG mở lại (em tự chốt)', async () => {
  const { k, id, mo } = await kho()
  const a = await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-start', { id, chang: 0 }, mo + 1000)
  await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-chot-chang', { id, chang: 0, tra: {}, revision: Number(a.revision) }, mo + 5000)
  const sau = Number(a.hanChang) + 60_000
  expect((await trangThai(k, id, sau))[0]).toMatchObject({ daChot: true })
  expect((await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-start', { id, chang: 0 }, sau)).daChot).toBe(true)
})

it('đang chạy chặng khác ⇒ chưa mở lại (một chặng một lúc); giờ mở lại không vượt hạn bài; sát hạn bài (< 1 phút) ⇒ không mở lại; bài đã nộp ⇒ không mở lại', async () => {
  const { k, id, d, mo, han } = await kho()
  const a = await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-start', { id, chang: 0 }, mo + 1000)
  const t1 = Number(a.hanChang) + 1000
  await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-start', { id, chang: 1 }, t1) // chặng 1 đang chạy
  await expect(ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-start', { id, chang: 0 }, t1 + 1000)).rejects.toThrow(/chặng đang mở/)
  expect(k.d.sql.prepare('SELECT COUNT(*) n FROM kiem_tra_ca_nhan_mo_lai').get()).toEqual({ n: 0 })
  // Sát hạn bài: còn 30 giây ⇒ không mở lại.
  expect((await trangThai(k, id, han - 30_000))[0]).toMatchObject({ daChot: true })
  // Còn 2 phút ⇒ mở lại, hạn chặng kẹp bằng hạn bài.
  const sat = han - 120_000
  const b = await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-start', { id, chang: 0 }, sat)
  expect(b.daChot).toBe(false)
  expect(Number(b.hanChang)).toBe(Math.min(han, sat + d.chang[0]!.giay * 1000))
  // Nộp bài ⇒ trạng thái không còn chặng mở lại được.
  await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-nop', { id }, sat + 2000)
  const ds = await trangThai(k, id, sat + 3000)
  expect(ds.every((x) => x.daChot || x.han === null)).toBe(true)
  expect(ds.filter((x) => x.han === null && !x.daChot)).toEqual([])
})
