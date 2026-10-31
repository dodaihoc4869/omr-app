// @vitest-environment node
// KIỂM TRA ÔN TẬP — PHẦN CHỮA TẢI SẴN ĐÃ KHOÁ, NỘP XONG CHỈ TRAO CHÌA (thầy 31/10; server/src/kiem-tra-ca-nhan-khoa.ts, src/lib/khoa-ktcn.ts):
//   · `hoc-tap-ktcn-goi` trả chuỗi mã hoá (không đáp án / lời giải rõ), chưa nộp thì không có cách nào lấy chìa;
//   · nộp kèm phiên bản gói ⇒ phần chữa GỌN + chìa; máy em mở gói ghép lại ĐÚNG phần chữa nguyên (đường cũ);
//   · sai phiên bản ⇒ nguyên như cũ; chìa hỏng ⇒ máy em trả null (nơi gọi hỏi lại phần chữa nguyên).
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { lapKtCn as lapKtCnThat, docKtCn, ktCnAction } from '../server/src/kiem-tra-ca-nhan'
import { luuGoiKt, moKetKt, thanGoiKt } from '../src/lib/khoa-ktcn'

const lapKtCn = (env: Parameters<typeof lapKtCnThat>[0], sbd: string, now: number) => lapKtCnThat(env, sbd, now, false, false, false)
const NOW = Date.parse('2026-10-13T02:00:00Z')
beforeEach(() => {
  const m = new Map<string, string>()
  vi.stubGlobal('localStorage', { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), key: (i: number) => [...m.keys()][i] ?? null, get length() { return m.size } })
})
afterEach(() => { xoaDemPhamVi(); vi.unstubAllGlobals() })

async function kho() {
  const k = taoKhoOmni({ 'DH-B0': 12, 'DH-B1': 12 }); await damBaoBangBaiDaDay(k.env)
  k.d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('kiem_tra_ca_nhan_v1','{"bat":true}','x');
 INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES('b0','12A1','B0','Bài cũ',0,'["DH-B0"]','2026-10-01'),('b1','12A1','B1','Bài mới',1,'["DH-B1"]','2026-10-12');`)
  for (const ma of ['DH-B0', 'DH-B1']) {
    k.d.sql.prepare('INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES(?,?,12,0,?)').run(ma, ma, 'v1')
    k.d.sql.prepare('INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,?,?)').run(ma, 'v1', 'x')
    for (const qid of k.qids(ma)) k.d.sql.prepare("INSERT INTO omni_q(qid,y,vkn_json,nguon,duyet_luc) VALUES(?,-1,?,'thay','x')").run(qid, JSON.stringify([ma + '.kn']))
  }
  k.d.sql.prepare("UPDATE hoc_sinh SET mat_khau='gia' WHERE sbd='S1'").run()
  await lapKtCn(k.env, 'S1', NOW)
  const r = (await docKtCn(k.env, 'S1', NOW))!, id = String(r.id), now = Number(r.mo_luc) + 1000
  const start = await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-start', { id, chang: 0 }, now)
  const qs = (start.questions as { qid: string }[]).map((q) => q.qid)
  await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-luu', { id, chang: 0, revision: 0, tra: { [qs[0]!]: 'A', [qs[1]!]: 'B' } }, now + 1000)
  return { k, id, now, han: Number(start.hanChang) }
}

it('gói không lộ phần chữa; nộp kèm phiên bản ⇒ gọn + chìa; máy em ghép lại đúng phần chữa nguyên', async () => {
  const { k, id, now, han } = await kho()
  const g = await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-goi', { id }, now + 2000) as { goi: string; phien: string }
  expect(typeof g.goi).toBe('string')
  expect(JSON.stringify(g)).not.toMatch(/dapAn|loiGiai|correct|"de"/)
  luuGoiKt('S1', id, { goi: g.goi, phien: g.phien })
  // chưa nộp ⇒ xem phần chữa bị từ chối (không có đường lấy chìa)
  await expect(ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-ket-qua', { id, ...thanGoiKt('S1', id) }, now + 3000)).rejects.toThrow()
  await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-chot-chang', { id, chang: 0, revision: 1, tra: {} }, Math.min(han - 500, now + 4000))
  const nop = await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-nop', { id, ...thanGoiKt('S1', id) }, now + 5000) as Record<string, any>
  expect(nop.ketQua.gon).toBe(true)
  expect(typeof nop.khoaKq).toBe('string')
  expect(JSON.stringify(nop.ketQua)).not.toMatch(/dapAn|loiGiai/)
  const nguyen = (await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-ket-qua', { id }, now + 6000) as Record<string, any>).ketQua
  expect(nguyen.gon).toBeUndefined()
  expect(nguyen.cau.length).toBeGreaterThan(0)
  expect(await moKetKt('S1', id, nop)).toEqual(nguyen)
  expect(JSON.stringify(nop).length).toBeLessThan(JSON.stringify(nguyen).length)
  // trạng thái kèm kết quả cũng gọn + mở đúng
  const tt = await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-trang-thai', { id, kemKetQua: true, ...thanGoiKt('S1', id) }, now + 7000) as Record<string, any>
  expect(tt.ketQua.gon).toBe(true)
  expect(await moKetKt('S1', id, tt)).toEqual(nguyen)
  // chìa hỏng ⇒ null (máy em hỏi lại phần chữa nguyên)
  expect(await moKetKt('S1', id, { ...nop, khoaKq: String(nop.khoaKq).slice(0, -3) + 'AAA' })).toBeNull()
  // sai phiên bản ⇒ nguyên như cũ, không chìa
  const sai = await ktCnAction(k.env, 'S1', 'hoc-tap-ktcn-ket-qua', { id, phienKq: 'khac' }, now + 8000) as Record<string, any>
  expect(sai.khoaKq).toBeUndefined()
  expect(sai.ketQua).toEqual(nguyen)
  expect(await moKetKt('S1', id, sai)).toEqual(nguyen)
})
