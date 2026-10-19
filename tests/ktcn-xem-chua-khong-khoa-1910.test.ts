// @vitest-environment node
// LỖI 17–18/10 (thầy 19/10 gửi ảnh Kiểm tra ôn tập: "Em vừa xem phần chữa của một câu trong chặng. Hãy quay lại sau ít nhất 12 giờ…" lúc còn 1 giờ 37 phút tới hạn
// 24:00; và "Không cho làm chặng 3" — chặng 3 đã trả lời 0/6, chặng 4–5 đã chốt). Nguyên nhân gốc: từ 16/10 mỗi câu nộp ở bài thường ghi `loi_giai_hoi`
// ('goi7:sau_nop') ⇒ lệnh mở chặng kiểm tra khoá cả chặng (kể cả chặng đã mở) khi đề có câu em vừa làm trong 12 giờ ⇒ tới hạn chốt 0 câu.
// Khoá: em luôn mở / mở lại chặng được; câu đã xem phần chữa trong [mở chặng − 12 giờ, lúc chốt chặng] vẫn tính điểm bài nhưng ghi sổ là CÓ TRỢ GIÚP.
import { afterEach, expect, it, vi } from 'vitest'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { lapKtCn, docKtCn, ktCnAction } from '../server/src/kiem-tra-ca-nhan'

const NOW = Date.parse('2026-10-13T02:00:00Z')
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi() })
async function kho() {
  const k = taoKhoOmni({ 'DH-B0': 12, 'DH-B1': 12 }); await damBaoBangBaiDaDay(k.env)
  k.d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('kiem_tra_ca_nhan_v1','{"bat":true}','x');
  INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES('b0','12A1','B0','Bài cũ',0,'["DH-B0"]','2026-10-01'),('b1','12A1','B1','Bài mới',1,'["DH-B1"]','2026-10-12');`)
  for (const ma of ['DH-B0', 'DH-B1']) {
    k.d.sql.prepare('INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES(?,?,12,0,?)').run(ma, ma, 'v1')
    k.d.sql.prepare('INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,?,?)').run(ma, 'v1', 'x')
    for (const qid of k.qids(ma)) k.d.sql.prepare("INSERT INTO omni_q(qid,y,vkn_json,nguon,duyet_luc) VALUES(?,-1,?,'thay','x')").run(qid, JSON.stringify([ma + '.kn']))
  }
  return k
}
type De = { cau: { q: { qid: string; correct: string } }[]; chang: { qids: string[] }[] }
const xem = (k: Awaited<ReturnType<typeof kho>>, qid: string, ms: number, nguon = 'goi7:sau_nop') =>
  k.d.sql.prepare('INSERT INTO loi_giai_hoi(sbd,qid,luc,co_ho_so,nguon) VALUES(?,?,?,0,?)').run('S1', qid, new Date(ms).toISOString(), nguon)

it('câu của chặng vừa làm ở bài thường (≤ 12 giờ) ⇒ vẫn mở chặng, mở lại được, làm hết và nộp được', async () => {
  const k = await kho(); await lapKtCn(k.env, 'S1', NOW, false, false, false)
  const r = (await docKtCn(k.env, 'S1', NOW))!, id = String(r.id), d = JSON.parse(String(r.json)) as De, now = Number(r.mo_luc) + 1000
  for (const ch of d.chang) xem(k, ch.qids[0]!, now - 3_600_000) // mỗi chặng có một câu em vừa làm 1 giờ trước
  const dau = await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-start', { id, chang: 0 }, now)
  expect((dau.questions as unknown[]).length).toBeGreaterThan(0)
  const lai = await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-start', { id, chang: 0 }, now + 5_000) // rời màn rồi vào lại chặng đang mở
  expect(lai.hanChang).toBe(dau.hanChang)
  for (let i = 0; i < d.chang.length; i++) {
    await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-start', { id, chang: i }, now + 10_000 + i * 1000)
    const tra = Object.fromEntries(d.cau.filter((c) => d.chang[i]!.qids.includes(c.q.qid)).map((c) => [c.q.qid, c.q.correct]))
    const rev = Number((k.d.sql.prepare('SELECT revision FROM kiem_tra_ca_nhan WHERE id=?').get(id) as { revision: number }).revision)
    await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-chot-chang', { id, chang: i, tra, revision: rev }, now + 10_500 + i * 1000)
  }
  const kq = await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-nop', { id }, now + 60_000)
  expect(kq.kiemTra).toMatchObject({ diem: 10, trangThai: 'da_nop' }) // điểm bài giữ nguyên
  const so = k.d.sql.prepare('SELECT qid, assistance FROM su_kien_hoc WHERE ma_nguon=?').all(id) as { qid: string; assistance: string }[]
  const daXem = new Set(d.chang.map((c) => c.qids[0]!))
  expect(so.length).toBe(d.cau.length)
  for (const e of so) expect(e.assistance, e.qid).toBe(daXem.has(e.qid) ? 'assisted' : 'none')
})

it('xem phần chữa trước khi mở chặng hơn 12 giờ, hoặc sau khi chặng đã chốt ⇒ vẫn là tự làm', async () => {
  const k = await kho(); await lapKtCn(k.env, 'S1', NOW, false, false, false)
  const r = (await docKtCn(k.env, 'S1', NOW))!, id = String(r.id), d = JSON.parse(String(r.json)) as De, now = Number(r.mo_luc) + 1000
  const q0 = d.chang[0]!.qids[0]!, q1 = d.chang[0]!.qids[1] ?? d.chang[0]!.qids[0]!
  xem(k, q0, now - 13 * 3_600_000, 'loi_giai')
  await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-start', { id, chang: 0 }, now)
  const tra = Object.fromEntries(d.cau.filter((c) => d.chang[0]!.qids.includes(c.q.qid)).map((c) => [c.q.qid, c.q.correct]))
  await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-chot-chang', { id, chang: 0, tra, revision: 0 }, now + 2_000)
  xem(k, q1, now + 3_000) // sau khi chặng 0 đã chốt (em làm bài thường giữa hai chặng)
  await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-nop', { id }, now + 60_000)
  const so = k.d.sql.prepare('SELECT qid, assistance FROM su_kien_hoc WHERE ma_nguon=?').all(id) as { qid: string; assistance: string }[]
  expect(so.length).toBeGreaterThan(0)
  for (const e of so) expect(e.assistance, e.qid).toBe('none')
})
