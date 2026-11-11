// @vitest-environment node
// NỢ CÂU CHO THẦY VÀ PHỤ HUYNH XEM (thầy 11/11: «Làm tiếp cho thầy và phụ huynh xem nợ câu từng em»).
// Khoá: (1) luật thuần `xemNoEm`; (2) bảng «Bài hằng ngày» của thầy và trang «Về con» của phụ huynh trả ĐÚNG số em thấy trên thẻ Nợ câu — kể cả khi em
// chưa mở app (tính tiếp các ngày đã qua bằng cùng luật); (3) em không nợ thì không có trường `noCau`.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { taoKhoOmni, themChienDich, lam } from './omni-3-ke-hoach-chung'
import { dongBoGoi7, lapGoi7, tomTatGoi7 } from '../server/src/goi-bai-7'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaMoiDem } from '../server/src/dem-chung'
import { gvBaiHangNgay } from '../server/src/bai-hang-ngay'
import { phConTongQuan } from '../server/src/ph-con-tong-quan'
import { gomDongNo, xemNoEm, type NgayXem } from '../server/src/no-cau-xem'
import type { KetQuaBaiHangNgay } from '../server/src/bai-hang-ngay-kieu'
import type { KetQuaConTongQuan } from '../server/src/ph-con-tong-quan-kieu'
import type { Env } from '../server/src/kieu'

const D11 = Date.parse('2026-11-11T02:00:00Z'), NGAY = 86400000
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(D11) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe(); xoaMoiDem() })

const dong = (k: string, sbd: string, ngay: string, tang: number, muc: number, d: string | null) => ({ sbd, ngay, tang, muc, k, d })
const g7 = (ngay: string, muc: number | null, lam: number): NgayXem => ({ ngay, cheDo: 'goi7', muc, lam })

it('luật thuần: sổ đã chốt tới hôm qua ⇒ đúng số của thẻ em (đã trả 5/11, còn 37); em không có sổ / không nợ ⇒ null', () => {
  const x = gomDongNo([dong('e', 'S1', '2026-11-12', 1, 42, '{"moi":20,"sua":14,"on":6,"lai":2}'), dong('c', 'S1', '2026-11-13', 28, 11, 'toi_thieu'), dong('g', 'S1', '2026-11-08', 0, 0, '2026-11-17')]).get('S1')!
  expect(xemNoEm(x, [g7('2026-11-12', 28, 28), g7('2026-11-13', 39, 5)], '2026-11-13')).toMatchObject({ no: 42, con: 37, daTra: 5, so: 11, kieu: 'toi_thieu', toiThieu: 11, lan: 1, phaiTraHet: false, theoLoai: { lai: 2 }, muc: 39, daChon: true })
  expect(xemNoEm({ so: null, chon: new Map(), loai: new Map(), goi: [] }, [], '2026-11-13')).toBeNull()
  const sach = gomDongNo([dong('e', 'S2', '2026-11-12', 0, 0, '{}')]).get('S2')!
  expect(xemNoEm(sach, [g7('2026-11-13', 28, 0)], '2026-11-13')).toBeNull()
})
it('luật thuần: em chưa mở app từ sau ngày chốt sổ ⇒ tính tiếp ngày vắng (có bài trong hạn), ngày Kiểm tra ôn tập đã nộp không đổi; hôm nay theo lựa chọn mặc định', () => {
  const x = gomDongNo([dong('e', 'S1', '2026-11-12', 0, 8, '{"moi":8}'), dong('g', 'S1', '2026-11-08', 0, 0, '2026-11-20')]).get('S1')!
  const r = xemNoEm(x, [g7('2026-11-13', null, 0), { ngay: '2026-11-14', cheDo: 'kiem-tra', muc: null, lam: 28, ktNop: true }, g7('2026-11-15', null, 0)], '2026-11-15')!
  expect(r).toMatchObject({ no: 8 + 1 + 28, con: 37, daTra: 0, kieu: 'toi_thieu', so: 10, toiThieu: 10, daChon: false, muc: 38 }) // 13/11 vắng: lãi 1 + thiếu 28; 14/11 đã nộp bài kiểm tra: giữ nguyên
  const ngoaiHan = gomDongNo([dong('e', 'S1', '2026-11-12', 0, 8, '{"moi":8}'), dong('g', 'S1', '2026-11-01', 0, 0, '2026-11-12')]).get('S1')!
  expect(xemNoEm(ngoaiHan, [g7('2026-11-13', null, 0), g7('2026-11-14', null, 0)], '2026-11-14')).toMatchObject({ no: 8 }) // không có bài trong hạn ⇒ không nợ thêm, không lãi
})

async function kho(n = 400) {
  const k = taoKhoOmni({ 'DH-B1': n })
  await damBaoBangBaiDaDay(k.env)
  k.d.sql.exec(`INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B1','Bài mới',${n},0,'v1');INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B1','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x')`)
  k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)').run('latest', '12A1', 'B1', 'Bài mới', 1, '["DH-B1-TN","DH-B1-DS","DH-B1-TLN"]', '2026-11-10T18:30:00Z')
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: k.qids('DH-B1'), maDe: ['DH-B1'], sbd: ['S1', 'S2', 'S3'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, D11)
  return k
}
type Kho = Awaited<ReturnType<typeof kho>>
const sang = (now: number) => { vi.setSystemTime(now); xoaMoiDem(); xoaDemChienDich() }
async function lap(k: Kho, now: number) { const l = (await lapGoi7(k.env, 'S1', now))!; return { l, t: tomTatGoi7(l, now) as ReturnType<typeof tomTatGoi7> & { noCau?: Record<string, unknown> } } }
async function lamCau(k: Kho, l: Awaited<ReturnType<typeof lap>>['l'], n: number, now: number) { for (const [i, v] of l.plan.viec.slice(0, n).entries()) await lam(k.env, 'S1', v.qid, now + 60_000 + i * 1000, true, { cauVersion: 'v1' }) }
const thay = async (k: Kho, now: number) => ((await gvBaiHangNgay(k.env as unknown as Env, {}, now)) as KetQuaBaiHangNgay).em.find((e) => e.sbd === 'S1')!
const phuHuynh = async (k: Kho, now: number) => (await phConTongQuan(k.env as unknown as Env, { sbd: 'S1' }, now)) as KetQuaConTongQuan

it('thầy và phụ huynh thấy đúng số của thẻ em: trước khi em mở app (tính tiếp), sau khi em mở app, và sau khi em trả vài câu', async () => {
  const k = await kho()
  const a = await lap(k, D11)
  await lamCau(k, a.l, 20, D11)
  expect((await thay(k, D11 + 3_600_000)).noCau).toBeUndefined() // hôm nay chưa hết ngày ⇒ chưa nợ
  expect((await phuHuynh(k, D11 + 3_600_000)).noCau).toBeUndefined()

  const D12 = D11 + NGAY
  sang(D12)
  // em CHƯA mở app ngày 12/11: sổ còn chốt tới 10/11 ⇒ thầy / phụ huynh vẫn thấy 8 câu nợ của ngày 11/11, theo lựa chọn mặc định
  const truoc = { no: 8, con: 8, daTra: 0, toiThieu: 6, kieu: 'toi_thieu', so: 6, lan: 0, daChon: false, muc: 34 }
  expect((await thay(k, D12)).noCau).toMatchObject(truoc)
  expect((await phuHuynh(k, D12)).noCau).toMatchObject(truoc)

  const b = await lap(k, D12) // em mở app
  const cuaEm = b.t.noCau!
  for (const xem of [(await thay(k, D12 + 1000)).noCau!, (await phuHuynh(k, D12 + 1000)).noCau!]) {
    expect(xem).toMatchObject({ ...cuaEm, daChon: true })
    expect(xem).toMatchObject({ no: 8, con: 8, so: 6, muc: 34 })
  }
  await lamCau(k, b.l, 3, D12)
  sang(D12 + 600_000)
  const c = await lap(k, D12 + 600_000)
  expect(c.t.noCau).toMatchObject({ con: 5, daTra: 3 })
  expect((await thay(k, D12 + 600_000)).noCau).toMatchObject({ ...c.t.noCau!, daChon: true })
  expect((await phuHuynh(k, D12 + 600_000)).noCau).toMatchObject({ ...c.t.noCau!, daChon: true })
  // số «đã làm / mức» của ô hôm nay vẫn như cũ (mức 34 = 28 + 6 câu trả nợ)
  expect((await thay(k, D12 + 600_000)).ngay.find((n) => n.homNay)).toMatchObject({ daLam: 3, mucToiThieu: 34 })
})

it('em chưa từng mở app (chưa có sổ nợ) vẫn hiện nợ cho thầy và phụ huynh, tính từ 11/11 — đúng số em sẽ thấy khi mở app', async () => {
  const k = await kho()
  const D13 = D11 + 2 * NGAY
  sang(D13)
  const xem = { no: 58, con: 58, daTra: 0, toiThieu: 15, kieu: 'toi_thieu', so: 15, daChon: false, muc: 43 }
  expect((await thay(k, D13)).noCau).toMatchObject(xem)
  expect((await phuHuynh(k, D13)).noCau).toMatchObject(xem)
  const em = await lap(k, D13) // em mở app: cùng con số
  expect(em.t.noCau).toMatchObject({ no: 58, toiThieu: 15, so: 15 })
  expect((await thay(k, D13 + 1000)).noCau).toMatchObject({ ...em.t.noCau!, daChon: true })
})

it('bảng nợ chưa có (máy chủ chưa tạo) ⇒ bảng thầy vẫn ra đủ số như cũ, chỉ không có nợ câu', async () => {
  const k = await kho()
  await lap(k, D11)
  const co = await thay(k, D11 + 1000)
  k.d.sql.exec('DROP TABLE goi_bai_7_no_em')
  const mat = await thay(k, D11 + 2000)
  expect(mat.noCau).toBeUndefined()
  expect(mat.ngay).toEqual(co.ngay)
})
