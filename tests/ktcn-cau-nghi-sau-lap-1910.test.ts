// @vitest-environment node
// LỖI 19/10 18:31 (em báo "Em ko làm đc chặng 4 thầy ơi"): bài Kiểm tra ôn tập lập ngày 13/10, chặng 1·2·3·5 làm xong, chặng 4 bấm là báo lỗi tới hạn.
// Nguyên nhân gốc: 00:01 ngày 19/10 tự hoàn thiện đánh dấu một câu của chặng 4 là "nghi sai đáp án" (`cau_nghi_dap_an`) — SAU khi đề đã lập. Lệnh mở chặng
// (`kiemNguon`) đi qua cổng khối có lọc câu nghi ⇒ câu ấy bị loại ⇒ ném "Một câu của bài đang đổi nguồn…" ⇒ cả chặng không mở được, tới hạn chốt 0 câu;
// nộp bài xong cũng không xem được kết quả (ketQuaKt gọi cùng `kiemNguon`). Đề ĐÃ PHÁT giữ câu như lượt đã phát (`luot_cu`); lúc LẬP đề vẫn loại câu nghi.
import { afterEach, expect, it, vi } from 'vitest'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { lapKtCn, docKtCn, ktCnAction } from '../server/src/kiem-tra-ca-nhan'
import { xoaDemCauNghi } from '../server/src/chan-khac-khoi'

const NOW = Date.parse('2026-10-13T02:00:00Z')
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemCauNghi() })
async function kho() {
  const k = taoKhoOmni({ 'DH-12-B0': 12, 'DH-12-B1': 12 }); await damBaoBangBaiDaDay(k.env)
  k.d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('kiem_tra_ca_nhan_v1','{"bat":true}','x');
  INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES('b0','12A1','B0','Bài cũ',0,'["DH-12-B0"]','2026-10-01'),('b1','12A1','B1','Bài mới',1,'["DH-12-B1"]','2026-10-12');
  CREATE TABLE IF NOT EXISTS cau_nghi_dap_an (qid TEXT PRIMARY KEY, so_lan INTEGER NOT NULL, so_sai INTEGER NOT NULL, ty_le_sai REAL NOT NULL, trang_thai TEXT NOT NULL DEFAULT 'nghi', ghi_chu TEXT, luc TEXT NOT NULL);`)
  for (const ma of ['DH-12-B0', 'DH-12-B1']) {
    k.d.sql.prepare('INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES(?,?,12,0,?)').run(ma, ma, 'v1')
    k.d.sql.prepare('INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,?,?)').run(ma, 'v1', 'x')
    for (const qid of k.qids(ma)) k.d.sql.prepare("INSERT INTO omni_q(qid,y,vkn_json,nguon,duyet_luc) VALUES(?,-1,?,'thay','x')").run(qid, JSON.stringify([ma + '.kn']))
  }
  return k
}
type De = { cau: { q: { qid: string; correct: string } }[]; chang: { qids: string[] }[] }
const nghi = (k: Awaited<ReturnType<typeof kho>>, qid: string) =>
  k.d.sql.prepare("INSERT INTO cau_nghi_dap_an(qid,so_lan,so_sai,ty_le_sai,trang_thai,luc) VALUES(?,10,6,0.6,'nghi',?)").run(qid, new Date(NOW).toISOString())

it('câu bị đánh dấu nghi đáp án SAU khi lập đề ⇒ chặng chứa câu vẫn mở được, nộp bài và xem kết quả được', async () => {
  const k = await kho(); await lapKtCn(k.env, 'S1', NOW, false, false, false)
  const r = (await docKtCn(k.env, 'S1', NOW))!, id = String(r.id), d = JSON.parse(String(r.json)) as De, now = Number(r.mo_luc) + 1000
  const s = d.chang.length - 1, cauNghi = d.chang[s]!.qids[0]!
  nghi(k, cauNghi); xoaDemCauNghi() // tự hoàn thiện chạy đêm, sau khi đề đã lập (bỏ đệm 60 giây của lượt lập đề)
  const mo = await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-start', { id, chang: s }, now)
  expect((mo.questions as { qid: string }[]).map((q) => q.qid)).toContain(cauNghi)
  const tra = Object.fromEntries(d.cau.filter((c) => d.chang[s]!.qids.includes(c.q.qid)).map((c) => [c.q.qid, c.q.correct]))
  await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-chot-chang', { id, chang: s, tra, revision: 0 }, now + 2_000)
  const kq = await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-nop', { id }, now + 60_000)
  expect(kq.kiemTra).toMatchObject({ trangThai: 'da_nop' })
  const xem = await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-ket-qua', { id }, now + 61_000)
  expect((xem.ketQua as { cau: unknown[] }).cau.length).toBe(d.cau.length)
})

it('lúc LẬP đề vẫn loại câu đang nghi đáp án', async () => {
  const k = await kho()
  const tatCa = k.qids('DH-12-B0')
  for (const q of tatCa) nghi(k, q)
  await lapKtCn(k.env, 'S1', NOW, false, false, false)
  const r = (await docKtCn(k.env, 'S1', NOW))!, d = JSON.parse(String(r.json)) as De
  expect(d.cau.length).toBeGreaterThan(0)
  for (const c of d.cau) expect(tatCa).not.toContain(c.q.qid)
})
