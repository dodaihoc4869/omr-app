// @vitest-environment node
// NỢ CÂU — máy chủ (thầy 11/11): chốt nợ MỘT lần mỗi ngày ở lần lập đầu tiên, mức hôm nay = 28 + số câu trả nợ, lệnh đổi lựa chọn, lãi 5 %/đêm.
// Luật thuần: tests/no-cau-1111.test.ts. Đặc tả: docs/ban-ve-lam-bu-1111/DAC-TA.md.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { taoKhoOmni, themChienDich, lam } from './omni-3-ke-hoach-chung'
import { dongBoGoi7, lapGoi7, tomTatGoi7, demHomNay7 } from '../server/src/goi-bai-7'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { xoaMoiDem } from '../server/src/dem-chung'
import { docNo7, chonNoCau7 } from '../server/src/no-cau-d1'

const D11 = Date.parse('2026-11-11T02:00:00Z'), NGAY = 86400000 // 09:00 giờ VN
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(D11) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe(); xoaMoiDem() })

async function kho(n = 400) {
  const k = taoKhoOmni({ 'DH-B1': n })
  await damBaoBangBaiDaDay(k.env)
  k.d.sql.exec(`INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B1','Bài mới',${n},0,'v1');INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B1','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x')`)
  k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)').run('latest', '12A1', 'B1', 'Bài mới', 1, '["DH-B1-TN","DH-B1-DS","DH-B1-TLN"]', '2026-11-10T18:30:00Z')
  k.d.sql.prepare("UPDATE hoc_sinh SET mat_khau='gia' WHERE sbd='S1'").run()
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: k.qids('DH-B1'), maDe: ['DH-B1'], sbd: ['S1', 'S2', 'S3'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, D11)
  return k
}
type Kho = Awaited<ReturnType<typeof kho>>
const sang = (now: number) => { vi.setSystemTime(now); xoaMoiDem(); xoaDemChienDich() }
async function lap(k: Kho, now: number) { const l = await lapGoi7(k.env, 'S1', now); if (!l) throw new Error('không lập được'); return { l, t: tomTatGoi7(l, now) as ReturnType<typeof tomTatGoi7> & { noCau?: Record<string, unknown> } } }
/** Em làm `n` câu đầu của kế hoạch vừa lập. */
async function lamCau(k: Kho, l: Awaited<ReturnType<typeof lap>>['l'], n: number, now: number) {
  const ds = l.plan.viec.slice(0, n)
  expect(ds).toHaveLength(n)
  for (const [i, v] of ds.entries()) await lam(k.env, 'S1', v.qid, now + 60_000 + i * 1000, true, { cauVersion: 'v1' })
}
const mucNgay = (k: Kho, ngay: string) => (k.d.sql.prepare("SELECT muc FROM goi_bai_7_muc_ngay WHERE sbd='S1' AND ngay=?").get(ngay) as { muc: number } | undefined)?.muc
const soDong = (k: Kho, bang: string) => (k.d.sql.prepare(`SELECT COUNT(*) n FROM ${bang} WHERE sbd='S1'`).get() as { n: number }).n

it('ngày đầu mở sổ nợ 0; thiếu 8 câu ⇒ hôm sau nợ 8, trả tối thiểu 6, mức hôm nay 34; lập lại không cộng lần nữa', async () => {
  const k = await kho()
  const a = await lap(k, D11)
  expect(a.l.toiThieu).toBe(28)
  expect(a.t.noCau).toBeUndefined()
  expect(await docNo7(k.env, 'S1', '2026-11-11')).toMatchObject({ em: { no: 0, lan: 0, den: '2026-11-10' }, chon: null })
  await lamCau(k, a.l, 20, D11)

  const D12 = D11 + NGAY
  sang(D12)
  const b = await lap(k, D12)
  expect(b.l.toiThieu).toBe(34)
  expect(b.l.plan.viec).toHaveLength(34)
  expect(b.t.noCau).toMatchObject({ no: 8, con: 8, toiThieu: 6, lan: 0, phaiTraHet: false, kieu: 'toi_thieu', so: 6, daTra: 0, lai: 5, laiDemNay: 1 })
  expect(mucNgay(k, '2026-11-12')).toBe(34)
  expect(await demHomNay7(k.env, 'S1', D12)).toMatchObject({ daLamHomNay: 0, toiThieu: 34 }) // lệnh đếm nhẹ thấy cùng một con số
  // lập lại (Sảnh + mở chặng cùng lúc, lập sẵn nền …): cùng số, không cộng dồn
  sang(D12 + 60_000)
  const c = await lap(k, D12 + 60_000)
  expect(c.l.toiThieu).toBe(34)
  expect(mucNgay(k, '2026-11-12')).toBe(34)
  expect(soDong(k, 'goi_bai_7_no_chon')).toBe(1)
  expect(await docNo7(k.env, 'S1', '2026-11-12')).toMatchObject({ em: { no: 8, lan: 0, den: '2026-11-11' }, chon: { kieu: 'toi_thieu', so: 6, goc: 28 } })
})

it('đổi sang trả hết rồi đổi lại: mức hôm nay = 28 + số của lựa chọn; làm đủ ⇒ đêm ấy chỉ còn lãi của phần chưa trả', async () => {
  const k = await kho()
  const a = await lap(k, D11)
  await lamCau(k, a.l, 20, D11)
  const D12 = D11 + NGAY
  sang(D12)
  await lap(k, D12)
  const token = await gameToken(k.env, 'S1')
  expect(await gameV2(k.env, 'hoc-tap-no-cau-chon', { token, kieu: 'het' })).toMatchObject({ ok: true, kieu: 'het', so: 8, muc: 36 })
  expect(mucNgay(k, '2026-11-12')).toBe(36)
  sang(D12 + 20_000)
  expect((await lap(k, D12 + 20_000)).t).toMatchObject({ toiThieu: 36, noCau: { kieu: 'het', so: 8 } })
  expect(await chonNoCau7(k.env, 'S1', { kieu: 'toi_thieu' }, D12 + 30_000)).toMatchObject({ kieu: 'toi_thieu', so: 6, muc: 34 })
  await expect(chonNoCau7(k.env, 'S1', { kieu: 'bua' }, D12)).rejects.toThrow('không hợp lệ')
  sang(D12 + 40_000)
  const b = await lap(k, D12 + 40_000)
  expect(b.l.toiThieu).toBe(34)
  await lamCau(k, b.l, 34, D12 + 40_000)
  sang(D12 + 3_600_000)
  expect((await lap(k, D12 + 3_600_000)).t.noCau).toMatchObject({ con: 2, daTra: 6, laiDemNay: 1 })

  const D13 = D12 + NGAY
  sang(D13)
  const c = await lap(k, D13) // còn 2 + lãi 1 = 3 ⇒ nợ ≤ 6 thì trả hết luôn; đã dùng 1 lần trả tối thiểu
  expect(c.t.noCau).toMatchObject({ no: 3, toiThieu: 3, lan: 1, kieu: 'toi_thieu', so: 3, theoLoai: { lai: 1 } })
  expect(c.l.toiThieu).toBe(31)
  // câu lãi (1 câu) = câu ÔN của chính em, đứng đầu đề: một câu em đã làm ở các ngày trước, không phải câu mới
  expect(c.l.plan.viec).toHaveLength(31)
  expect(c.l.plan.viec[0]!.vai).toBe('on')
  expect((k.d.sql.prepare("SELECT COUNT(*) n FROM su_kien_hoc WHERE sbd='S1' AND qid=? AND ngay_vn<'2026-11-13'").get(c.l.plan.viec[0]!.qid) as { n: number }).n).toBeGreaterThan(0)
  expect(c.l.plan.viec.slice(1).filter((v) => v.vai === 'moi' || v.vai === 'tiep_can').length).toBeGreaterThanOrEqual(28)
  await lamCau(k, c.l, 31, D13)
  const D14 = D13 + NGAY
  sang(D14)
  const d = await lap(k, D14)
  expect(d.t.noCau).toBeUndefined() // trả hết ⇒ thẻ biến mất, mức về 28
  expect(d.l.toiThieu).toBe(28)
  expect(await docNo7(k.env, 'S1', '2026-11-14')).toMatchObject({ em: { no: 0, lan: 0, den: '2026-11-13' }, chon: null })
})

it('thầy giao bài mới giữa ngày (máy xoá mức tính sẵn rồi chốt lại) ⇒ mức hôm nay vẫn = mức gốc mới + số trả đã chọn; mức đã HẠ vì kho hết câu thì giữ', async () => {
  const k = await kho()
  const a = await lap(k, D11)
  await lamCau(k, a.l, 20, D11)
  const D12 = D11 + NGAY
  sang(D12)
  expect((await lap(k, D12)).l.toiThieu).toBe(34)
  k.d.sql.prepare("DELETE FROM goi_bai_7_muc_ngay WHERE sbd='S1' AND ngay='2026-11-12'").run() // như dongBoGoi7 khi có gói mới
  sang(D12 + 600_000)
  const b = await lap(k, D12 + 600_000)
  expect(b.l.toiThieu).toBe(34)
  expect(b.t.noCau).toMatchObject({ no: 8, so: 6, kieu: 'toi_thieu' })
  expect(mucNgay(k, '2026-11-12')).toBe(34)
  sang(D12 + 700_000)
  expect((await lap(k, D12 + 700_000)).l.toiThieu).toBe(34) // lần sau không nâng thêm
  expect(mucNgay(k, '2026-11-12')).toBe(34)
  k.d.sql.prepare("UPDATE goi_bai_7_muc_ngay SET muc=30 WHERE sbd='S1' AND ngay='2026-11-12'").run() // như lượt hạ mức khi kho hết câu
  sang(D12 + 800_000)
  expect((await lap(k, D12 + 800_000)).l.toiThieu).toBe(30)
  expect(mucNgay(k, '2026-11-12')).toBe(30)
})

it('em vắng nhiều ngày: nợ cộng dồn có lãi nhưng không quá trần 84; hết 3 lần trả tối thiểu thì chỉ còn trả hết', async () => {
  const k = await kho()
  await lap(k, D11)
  const D16 = D11 + 5 * NGAY // vắng 11 → 15/11
  sang(D16)
  const a = await lap(k, D16)
  expect(a.t.noCau).toMatchObject({ no: 84, toiThieu: 21, kieu: 'toi_thieu', so: 21 })
  expect(a.l.toiThieu).toBe(49)
  k.d.sql.prepare("UPDATE goi_bai_7_no_em SET lan=3 WHERE sbd='S1'").run() // dựng trạng thái «đã trả tối thiểu 3 lần»
  await expect(chonNoCau7(k.env, 'S1', { kieu: 'toi_thieu' }, D16 + 1000)).rejects.toThrow('trả hết')
  expect(await chonNoCau7(k.env, 'S1', { kieu: 'het' }, D16 + 2000)).toMatchObject({ so: 84, muc: 112 })
})

it('ÁP DỤNG CHO MỌI EM TỪ 11/11 (thầy: «áp dụng luôn cho học sinh»): em chưa từng mở app, lần đầu mở ngày 13/11 ⇒ nợ đã tính cả 11/11 và 12/11', async () => {
  const k = await kho()
  expect(await docNo7(k.env, 'S1', '2026-11-13')).toMatchObject({ em: null, chon: null }) // chưa có sổ
  const D13 = D11 + 2 * NGAY
  sang(D13)
  const a = await lap(k, D13)
  expect(a.t.noCau).toMatchObject({ no: 28 + 2 + 28, toiThieu: 15, kieu: 'toi_thieu', so: 15, lan: 0 }) // 11/11 thiếu 28; đêm 12/11 lãi 2 + thiếu 28
  expect(a.l.toiThieu).toBe(43)
  expect(await docNo7(k.env, 'S1', '2026-11-13')).toMatchObject({ em: { no: 58, den: '2026-11-12' }, chon: { kieu: 'toi_thieu', so: 15, goc: 28 } })
})

it('em vắng những ngày KHÔNG có bài nào trong hạn (lớp chưa được giao bài) ⇒ không nợ, không lãi', async () => {
  const k = await kho()
  await lap(k, D11)
  k.d.sql.prepare("UPDATE goi_bai_7_em SET han='2026-11-12' WHERE sbd='S1'").run() // bài hết hạn 12/11; em vắng 11 → 15/11
  const D16 = D11 + 5 * NGAY
  sang(D16)
  const a = await lap(k, D16)
  expect(a.t.noCau).toMatchObject({ no: 28 + 2 + 28 }) // chỉ 11/11 và 12/11 (trong hạn): 28, rồi lãi 2 + 28; 13 → 15/11 không tính
})

it('không nợ thì không có lệnh chọn; trước ngày bật / lỗi đọc sổ ⇒ mức 28 như cũ', async () => {
  const k = await kho()
  await lap(k, D11)
  await expect(chonNoCau7(k.env, 'S1', { kieu: 'het' }, D11)).rejects.toThrow('không có nợ câu')
  k.d.sql.exec('DROP TABLE goi_bai_7_no_chon') // bảng hỏng ⇒ câu đọc lùi về bản cũ, em học như chưa có tính năng
  sang(D11 + NGAY)
  const b = await lap(k, D11 + NGAY)
  expect(b.l.toiThieu).toBe(28)
  expect(b.t.noCau).toBeUndefined()
  expect(b.l.lichBai).toBeTruthy()
})
