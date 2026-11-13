// @vitest-environment node
// 13/11 thầy «Cho 20 em làm lại chặng bị khoá»: bài ĐÃ NỘP giữ nguyên trạng thái; chặng có quyền (kiem_tra_ca_nhan_lam_lai, có hạn) mở lại MỘT lần với đồng hồ mới;
// chốt ⇒ chấm lại cả bài + ghi sổ câu vừa trả lời (mốc = giờ làm lại, có trợ giúp). Sảnh trỏ vào bài có quyền khi hôm nay không có bài kiểm tra.
import { afterEach, expect, it } from 'vitest'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { lapKtCn, docKtCn, ktCnAction, tomTatKt } from '../server/src/kiem-tra-ca-nhan'
import { xoaDemCauNghi } from '../server/src/chan-khac-khoi'

const NOW = Date.parse('2026-10-13T02:00:00Z'), NGAY = 86_400_000
afterEach(() => { xoaDemPhamVi(); xoaDemCauNghi() })
type Cau = { q: { qid: string; correct: string; phan: string } }
async function kho() {
  const k = taoKhoOmni({ 'DH-12-B0': 12, 'DH-12-B1': 12 }); await damBaoBangBaiDaDay(k.env)
  k.d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('kiem_tra_ca_nhan_v1','{"bat":true}','x');
  INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES('b0','12A1','B0','Bài cũ',0,'["DH-12-B0"]','2026-10-01'),('b1','12A1','B1','Bài mới',1,'["DH-12-B1"]','2026-10-12');`)
  for (const ma of ['DH-12-B0', 'DH-12-B1']) {
    k.d.sql.prepare('INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES(?,?,12,0,?)').run(ma, ma, 'v1')
    k.d.sql.prepare('INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,?,?)').run(ma, 'v1', 'x')
    for (const qid of k.qids(ma)) k.d.sql.prepare("INSERT INTO omni_q(qid,y,vkn_json,nguon,duyet_luc) VALUES(?,-1,?,'thay','x')").run(qid, JSON.stringify([ma + '.kn']))
  }
  await lapKtCn(k.env, 'S1', NOW, false, false, false)
  let r = (await docKtCn(k.env, 'S1', NOW))!
  const goc = JSON.parse(String(r.json)) as { cau: Cau[]; chang: { qids: string[]; giay: number }[] }
  goc.chang = goc.cau.slice(0, 2).map((c) => ({ qids: [c.q.qid], giay: 120 })) // 2 chặng một câu
  k.d.sql.prepare('UPDATE kiem_tra_ca_nhan SET json=? WHERE id=?').run(JSON.stringify(goc), String(r.id))
  r = (await docKtCn(k.env, 'S1', NOW))!
  const d = JSON.parse(String(r.json)) as { cau: Cau[]; chang: { qids: string[]; giay: number }[] }
  return { k, id: String(r.id), d, mo: Number(r.mo_luc), han: Number(r.han_luc), ngay: String(r.ngay) }
}
/** Em mở chặng 0 rồi rời app (hết giờ, 0 câu); làm đúng chặng 1; nộp bài. */
async function baiDaNopCoChangTrong(x: Awaited<ReturnType<typeof kho>>) {
  const { k, id, d, mo } = x
  await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-start', { id, chang: 0 }, mo + 1000)
  const b = await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-start', { id, chang: 1 }, mo + 200_000)
  const q1 = d.cau.find((c) => c.q.qid === d.chang[1]!.qids[0])!.q
  await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-chot-chang', { id, chang: 1, tra: { [q1.qid]: q1.correct }, revision: Number(b.revision) }, mo + 210_000)
  // Bài đã chốt (như 21 bài thật) ⇒ chặng 0 đã chốt trống trước khi thầy cấp quyền.
  k.d.sql.prepare('UPDATE kiem_tra_ca_nhan_chang SET chot_luc=han WHERE bai_id=? AND stt=0').run(id)
  await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-nop', { id }, mo + 220_000)
  return k.d.sql.prepare('SELECT trang_thai,diem,nop_luc FROM kiem_tra_ca_nhan WHERE id=?').get(id) as { trang_thai: string; diem: number; nop_luc: number }
}
const capQuyen = (x: Awaited<ReturnType<typeof kho>>, stt: number, het: number) => x.k.d.sql.prepare('INSERT INTO kiem_tra_ca_nhan_lam_lai(bai_id,stt,cap_luc,het_luc) VALUES(?,?,?,?)').run(x.id, stt, x.mo, het)

it('quyền làm lại: sảnh trỏ vào bài; mở chặng đồng hồ mới; lưu, chốt ⇒ chấm lại, ghi sổ mốc làm lại (có trợ giúp); bài vẫn «đã nộp»; xong quyền ⇒ sảnh về như cũ', async () => {
  const x = await kho()
  const truoc = await baiDaNopCoChangTrong(x)
  expect(truoc.trang_thai).toBe('da_nop')
  const sau2Ngay = x.mo + 2 * NGAY + 3_600_000
  capQuyen(x, 0, sau2Ngay + NGAY)
  // Sảnh (docKtCn chiMeta) ngày sau: trỏ vào bài có quyền, kèm danh sách chặng làm lại.
  const s = (await docKtCn(x.k.env, 'S1', sau2Ngay, true))!
  expect(s.id).toBe(x.id)
  expect(tomTatKt(s, sau2Ngay)).toMatchObject({ lamLai: [0], nopLuc: truoc.nop_luc })
  const tt = await ktCnAction(x.k.env, 'S1', 'hoc-tap-ktcn-trang-thai', { id: x.id }, sau2Ngay)
  expect((tt.chang as { stt: number }[])[0]).toMatchObject({ stt: 0, han: null, daChot: false, lamLai: true })
  expect((tt.kiemTra as { lamLai?: number[] }).lamLai).toEqual([0])
  // Mở chặng: đồng hồ mới.
  const t1 = sau2Ngay + 1000
  const a = await ktCnAction(x.k.env, 'S1', 'hoc-tap-ktcn-start', { id: x.id, chang: 0 }, t1)
  expect(a).toMatchObject({ daChot: false, lamLai: true, hanChang: t1 + 120_000 })
  const q0 = x.d.cau.find((c) => c.q.qid === x.d.chang[0]!.qids[0])!.q
  const luu = await ktCnAction(x.k.env, 'S1', 'hoc-tap-ktcn-luu', { id: x.id, chang: 0, tra: { [q0.qid]: q0.correct }, revision: Number(a.revision) }, t1 + 5000)
  expect(luu.daLuu).toBe(true)
  const c = await ktCnAction(x.k.env, 'S1', 'hoc-tap-ktcn-chot-chang', { id: x.id, chang: 0, tra: {}, revision: Number(luu.revision) }, t1 + 10_000)
  expect(c.daChot).toBe(true)
  const moi = x.k.d.sql.prepare('SELECT trang_thai,diem,nop_luc FROM kiem_tra_ca_nhan WHERE id=?').get(x.id) as typeof truoc
  expect(moi.trang_thai).toBe('da_nop')
  expect(moi.nop_luc).toBe(truoc.nop_luc)
  expect(moi.diem).toBeGreaterThan(truoc.diem)
  const so = x.k.d.sql.prepare('SELECT luc,assistance FROM su_kien_hoc WHERE sbd=? AND qid=? AND ma_nguon=?').all('S1', q0.qid, x.id) as { luc: string; assistance: string }[]
  expect(so).toEqual([{ luc: new Date(t1 + 10_000).toISOString(), assistance: 'assisted' }])
  // Quyền đã dùng: trạng thái chốt; sảnh không trỏ vào bài cũ nữa; mở lại ⇒ như bài đã nộp.
  const tt2 = await ktCnAction(x.k.env, 'S1', 'hoc-tap-ktcn-trang-thai', { id: x.id }, t1 + 20_000)
  expect((tt2.chang as { daChot: boolean }[])[0]!.daChot).toBe(true)
  expect((tt2.kiemTra as { lamLai?: number[] }).lamLai).toBeUndefined()
  expect((await docKtCn(x.k.env, 'S1', t1 + 20_000, true))?.id ?? null).not.toBe(x.id)
  expect((await ktCnAction(x.k.env, 'S1', 'hoc-tap-ktcn-start', { id: x.id, chang: 0 }, t1 + 30_000)).daNop).toBe(true)
})

it('chặng KHÔNG có quyền vẫn khoá; quyền HẾT HẠN không mở; hết giờ làm lại ⇒ tự chốt', async () => {
  const x = await kho()
  await baiDaNopCoChangTrong(x)
  const t = x.mo + 2 * NGAY
  expect((await ktCnAction(x.k.env, 'S1', 'hoc-tap-ktcn-start', { id: x.id, chang: 1 }, t)).daNop).toBe(true)
  capQuyen(x, 0, t - 1000) // hết hạn
  expect((await ktCnAction(x.k.env, 'S1', 'hoc-tap-ktcn-start', { id: x.id, chang: 0 }, t)).daNop).toBe(true)
  expect((await docKtCn(x.k.env, 'S1', t, true))?.id ?? null).not.toBe(x.id)
  x.k.d.sql.prepare('UPDATE kiem_tra_ca_nhan_lam_lai SET het_luc=? WHERE bai_id=?').run(t + NGAY, x.id)
  const a = await ktCnAction(x.k.env, 'S1', 'hoc-tap-ktcn-start', { id: x.id, chang: 0 }, t)
  const sau = Number(a.hanChang) + 1000
  const b = await ktCnAction(x.k.env, 'S1', 'hoc-tap-ktcn-start', { id: x.id, chang: 0 }, sau)
  expect(b.daChot).toBe(true)
  expect(x.k.d.sql.prepare('SELECT dung_luc FROM kiem_tra_ca_nhan_lam_lai WHERE bai_id=?').get(x.id)).toEqual({ dung_luc: Number(a.hanChang) })
})

it('hôm nay có bài kiểm tra ⇒ sảnh vẫn trỏ bài hôm nay (quyền làm lại chờ)', async () => {
  const x = await kho()
  await baiDaNopCoChangTrong(x)
  capQuyen(x, 0, x.mo + 5 * NGAY)
  // Một bài kiểm tra của ngày mai (giả lập «hôm nay» khi đọc vào ngày mai).
  const mai = new Date(Date.parse(x.ngay + 'T00:00:00Z') + NGAY).toISOString().slice(0, 10)
  x.k.d.sql.prepare("INSERT INTO kiem_tra_ca_nhan(id,sbd,lop,ngay,mo_luc,han_luc,trang_thai,json,cap_nhat_luc) SELECT 'ktcn:S1:'||?,sbd,lop,?,mo_luc+86400000,han_luc+86400000,'hen',json,cap_nhat_luc FROM kiem_tra_ca_nhan WHERE id=?").run(mai, mai, x.id)
  const r = (await docKtCn(x.k.env, 'S1', x.mo + NGAY + 3_600_000, true))!
  expect(r.id).toBe(`ktcn:S1:${mai}`)
})
