// @vitest-environment node
// HUỶ CHIẾN DỊCH ⇒ THU HỒI HẾT PHẦN ĐÃ PHÂN (thầy 06/10): "Tôi hủy một chiến dịch amine. Nhưng học sinh Đỗ Đại Học vẫn làm câu của chiến dịch.
// Tôi muốn khi hủy chiến dịch thì những học sinh đã phân phải đc thu hồi hết".
// GỐC LỖI: `huy` chỉ đổi `trang_thai` — chiến dịch rời danh sách nên kế hoạch lập lại không còn câu chiến dịch, NHƯNG câu em đã làm SAI trong chiến dịch ấy
// vẫn được "nguồn thứ 4" của vòng học v2 (`docQidSaiV2`: mọi lượt tự làm sai từ 29/09, mọi kênh) kéo lại làm NỢ CŨ ⇒ em vẫn làm câu của chiến dịch đã huỷ.
// Luật mới (thầy 06/10): huỷ = như chưa từng giao — câu em làm sai TỪ LÚC ĐƯỢC GIAO không quay lại làm nợ; nợ có từ trước chiến dịch, nợ do chiến dịch KHÁC / ca thi /
// Lên bảng / đầu giờ giữ nguyên; lịch sử làm bài, điểm, EXP giữ nguyên (không xoá dữ liệu thật); `dong` (kết thúc) KHÔNG đổi (nợ vẫn theo em).
// D1 THẬT (node:sqlite, lược đồ đủ migration) — tests/omni-3-ke-hoach-chung.ts.
import { beforeEach, describe, expect, it } from 'vitest'
import { gvChienDich } from '../server/src/srs2-gv'
import { docHoSo2, docKeHoachDaChot, layKeHoachHomNay, qidGoc, tamHoanCauKhoa, xoaDemChienDich } from '../server/src/srs2-d1'
import { HOM_NAY, lam, lucVn, T_SANG, taoKhoOmni, themChienDich, type KhoOmni } from './omni-3-ke-hoach-chung'

beforeEach(() => { xoaDemChienDich() })

const TAO_LUC_CD1 = '2026-10-01T01:00:00.000Z'
const cauB1 = (hs: Awaited<ReturnType<typeof docHoSo2>>) => hs.cau.filter((c) => c.qid.startsWith('DH-B1-')).map((c) => `${c.qid}:${c.nguon}`).sort()
const trongKeHoach = (kh: { dao: string[]; doan: string[] }) => [...kh.dao, ...kh.doan].map(qidGoc).filter((q) => q.startsWith('DH-B1-')).sort()

/** Chiến dịch CD1 (bài DH-B1, S1+S2, giao 01/10) và lịch sử của S1: sai B1-0 (03/10), đúng B1-1, sai B1-3 (04/10 tối); sai B1-5 TRƯỚC khi giao (30/09). */
async function dung(): Promise<KhoOmni> {
  const k = taoKhoOmni()
  const b1 = k.qids('DH-B1')
  themChienDich(k.d, { id: 'CD1', maDe: ['DH-B1'], qids: [...b1, 'DH-B1-TL'], sbd: ['S1', 'S2'], hanNop: '2026-10-07', taoLuc: TAO_LUC_CD1, theLuc: 40 })
  await lam(k.env, 'S1', 'DH-B1-5', Date.parse('2026-09-30T03:00:00Z'), false) // nợ có TRƯỚC chiến dịch
  await lam(k.env, 'S1', 'DH-B1-0', lucVn('2026-10-03'), false)
  await lam(k.env, 'S1', 'DH-B1-1', lucVn('2026-10-02'), true)
  await lam(k.env, 'S1', 'DH-B1-3', lucVn('2026-10-04', 20), false)
  return k
}
const huy = (k: KhoOmni, id: string, ms = T_SANG + 60_000) => gvChienDich(k.env, { action: 'huy', id }, ms)

describe('huỷ chiến dịch ⇒ nợ do chiến dịch ấy không quay lại (đường kế hoạch cũ, OMNI tắt)', () => {
  it('TRƯỚC khi huỷ: chiến dịch đang chạy ⇒ câu chiến dịch trong hồ sơ và kế hoạch (nền của test)', async () => {
    const k = await dung()
    const hs = await docHoSo2(k.env, 'S1', HOM_NAY)
    expect(cauB1(hs).length).toBe(12)
    expect(cauB1(hs).every((x) => x.endsWith(':chien_dich'))).toBe(true)
    const kh = (await layKeHoachHomNay(k.env, 'S1', T_SANG)).kh
    expect(kh.chienDichId).toBe('CD1')
    expect(trongKeHoach(kh).length).toBeGreaterThan(0)
  })

  it('SAU khi huỷ: kế hoạch hôm nay (đã chốt sáng) không còn câu nào do chiến dịch giao; nợ có từ TRƯỚC chiến dịch (B1-5) vẫn theo em', async () => {
    const k = await dung()
    await layKeHoachHomNay(k.env, 'S1', T_SANG) // chốt kế hoạch sáng, có câu chiến dịch
    const r = await huy(k, 'CD1')
    expect(r.ok).toBe(true)
    xoaDemChienDich()
    const kh = (await layKeHoachHomNay(k.env, 'S1', T_SANG + 120_000)).kh
    expect(kh.chienDichId).toBeNull()
    // B1-0 và B1-3 em sai TRONG chiến dịch ⇒ thu hồi; B1-5 em sai TRƯỚC khi giao ⇒ nợ riêng của em, giữ
    expect(trongKeHoach(kh)).toEqual(['DH-B1-5'])
    const hs = await docHoSo2(k.env, 'S1', HOM_NAY)
    expect(cauB1(hs)).toEqual(['DH-B1-5:no_cu'])
  })

  it('PHỤ HUYNH mở app NGAY sau khi huỷ (em chưa mở lại app, kế hoạch chốt sáng chưa lập lại): phần "còn lại" của con đã không còn câu chiến dịch', async () => {
    const k = await dung()
    await layKeHoachHomNay(k.env, 'S2', T_SANG) // chốt kế hoạch sáng của S2 (có câu chiến dịch)
    const chot = await docKeHoachDaChot(k.env, 'S2', T_SANG + 60_000)
    expect(chot && trongKeHoach(chot).length).toBeGreaterThan(0)
    await huy(k, 'CD1')
    xoaDemChienDich()
    // đọc đúng như app phụ huynh: kế hoạch ĐÃ CHỐT (không lập) + hồ sơ hiện tại, rồi bỏ câu không phục vụ được (`ph-bao-cao-moi.ts`)
    const kh = await docKeHoachDaChot(k.env, 'S2', T_SANG + 120_000)
    const hs = await docHoSo2(k.env, 'S2', HOM_NAY)
    const hien = await tamHoanCauKhoa(k.env, kh!, hs)
    expect([...hien.conDao, ...hien.conDoan].map(qidGoc).filter((q) => q.startsWith('DH-B1-'))).toEqual([])
  })

  it('em KHÁC trong chiến dịch (chưa làm gì) sạch hẳn; lịch sử làm bài của S1 KHÔNG bị xoá (sổ su_kien_hoc giữ nguyên)', async () => {
    const k = await dung()
    const dem = () => Number((k.d.sql.prepare("SELECT COUNT(*) n FROM su_kien_hoc WHERE sbd = 'S1'").get() as { n: number }).n)
    const truoc = dem()
    await huy(k, 'CD1')
    xoaDemChienDich()
    expect(cauB1(await docHoSo2(k.env, 'S2', HOM_NAY))).toEqual([])
    expect(trongKeHoach((await layKeHoachHomNay(k.env, 'S2', T_SANG + 120_000)).kh)).toEqual([])
    expect(dem()).toBe(truoc)
  })

  it('câu em làm sai SAU khi huỷ (máy em còn lượt đang làm dở) cũng không thành nợ', async () => {
    const k = await dung()
    await huy(k, 'CD1')
    await lam(k.env, 'S1', 'DH-B1-9', T_SANG + 5 * 60_000, false) // em nộp nốt câu của lượt đang mở
    xoaDemChienDich()
    const hs = await docHoSo2(k.env, 'S1', HOM_NAY)
    expect(cauB1(hs)).toEqual(['DH-B1-5:no_cu'])
  })

  it('câu còn THUỘC chiến dịch KHÁC đang chạy ⇒ vẫn là câu của chiến dịch ấy (không bị thu hồi nhầm)', async () => {
    const k = await dung()
    themChienDich(k.d, { id: 'CD2', maDe: ['DH-B2'], qids: [...k.qids('DH-B2'), 'DH-B1-0'], sbd: ['S1'], hanNop: '2026-10-09', taoLuc: '2026-10-02T01:00:00.000Z', theLuc: 30 })
    await huy(k, 'CD1')
    xoaDemChienDich()
    const hs = await docHoSo2(k.env, 'S1', HOM_NAY)
    expect(hs.cau.find((c) => c.qid === 'DH-B1-0')?.nguon).toBe('chien_dich')
    expect(hs.cau.find((c) => c.qid === 'DH-B1-3')).toBeUndefined() // chỉ thuộc CD1 ⇒ thu hồi
  })

  it('nợ từ Lên bảng / ca thi là việc của thầy dạy trên lớp, không phải chiến dịch ⇒ giữ nguyên dù câu nằm trong chiến dịch bị huỷ', async () => {
    const k = await dung()
    await lam(k.env, 'S1', 'DH-B1-7', lucVn('2026-10-04'), false, { nguon: 'len_bang', maNguon: 'buoi-1' })
    await huy(k, 'CD1')
    xoaDemChienDich()
    const hs = await docHoSo2(k.env, 'S1', HOM_NAY)
    expect(cauB1(hs)).toEqual(['DH-B1-5:no_cu', 'DH-B1-7:no_cu'])
  })

  it('KẾT THÚC (dong) khác HUỶ: nợ vẫn theo em như thiết kế sổ nợ (không đổi hành vi cũ)', async () => {
    const k = await dung()
    const r = await gvChienDich(k.env, { action: 'dong', id: 'CD1' }, T_SANG + 60_000)
    expect(r.ok).toBe(true)
    xoaDemChienDich()
    const hs = await docHoSo2(k.env, 'S1', HOM_NAY)
    // câu chiến dịch ĐÃ ĐÓNG em từng làm mà chưa thành thạo vẫn là nợ (B1-1 mới đúng một lần); B1-5 sai TRƯỚC khi giao không tính vào chiến dịch (luật 28/09) nên không kéo sang
    expect(cauB1(hs)).toEqual(['DH-B1-0:no_cu', 'DH-B1-1:no_cu', 'DH-B1-3:no_cu'])
  })

  it('huỷ HAI lần / huỷ chiến dịch không có em nào làm gì: không lỗi, kết quả như nhau', async () => {
    const k = await dung()
    expect((await huy(k, 'CD1')).ok).toBe(true)
    expect((await huy(k, 'CD1')).ok).toBe(true)
    xoaDemChienDich()
    expect(cauB1(await docHoSo2(k.env, 'S1', HOM_NAY))).toEqual(['DH-B1-5:no_cu'])
  })
})

describe('huỷ chiến dịch ⇒ thu hồi khi OMNI BẬT (nhiều bài song song)', () => {
  /** Hai chiến dịch chạy song song cho S1 (CD1 bài B1, CD2 bài B2) + OMNI bật cho cả trung tâm. */
  async function dungOmni(): Promise<KhoOmni> {
    const k = taoKhoOmni()
    k.d.sql.exec(`INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('omni','{"bat":true}','x')`)
    themChienDich(k.d, { id: 'CD1', maDe: ['DH-B1'], qids: [...k.qids('DH-B1'), 'DH-B1-TL'], sbd: ['S1', 'S2'], hanNop: '2026-10-07', taoLuc: TAO_LUC_CD1, theLuc: 40 })
    themChienDich(k.d, { id: 'CD2', maDe: ['DH-B2'], qids: k.qids('DH-B2'), sbd: ['S1'], hanNop: '2026-10-09', taoLuc: '2026-10-03T01:00:00.000Z', theLuc: 30, raiDeu: false })
    await lam(k.env, 'S1', 'DH-B1-0', lucVn('2026-10-03'), false)
    await lam(k.env, 'S1', 'DH-B1-3', lucVn('2026-10-04', 20), false)
    await lam(k.env, 'S1', 'DH-B2-0', lucVn('2026-10-04'), false)
    return k
  }
  const cauCua = (kh: { dao: string[]; doan: string[] }, tienTo: string) => [...kh.dao, ...kh.doan].map(qidGoc).filter((q) => q.startsWith(tienTo))

  it('huỷ CD1 giữa ngày: kế hoạch đã chốt lập lại — câu CD1 còn lại biến mất (cả nợ do CD1 sinh ra), câu CD2 còn, câu CD1 em ĐÃ LÀM hôm nay giữ nguyên', async () => {
    const k = await dungOmni()
    const sang = (await layKeHoachHomNay(k.env, 'S1', T_SANG)).kh
    expect(cauCua(sang, 'DH-B1-').length).toBeGreaterThan(0)
    expect(cauCua(sang, 'DH-B2-').length).toBeGreaterThan(0)
    const daLam = sang.dao.concat(sang.doan).map(qidGoc).find((q) => q.startsWith('DH-B1-') && q !== 'DH-B1-0' && q !== 'DH-B1-3')!
    await lam(k.env, 'S1', daLam, T_SANG + 10 * 60_000, true) // em làm đúng một câu CD1 sáng nay, rồi thầy huỷ
    expect((await huy(k, 'CD1', T_SANG + 20 * 60_000)).ok).toBe(true)
    xoaDemChienDich()
    const sau = (await layKeHoachHomNay(k.env, 'S1', T_SANG + 30 * 60_000)).kh
    expect(sau.chienDichId).toBe('CD2')
    const conLai = [...sau.conDao, ...sau.conDoan].map(qidGoc)
    expect(conLai.filter((q) => q.startsWith('DH-B1-')), 'câu CD1 chưa làm phải bị thu hồi').toEqual([])
    expect(cauCua(sau, 'DH-B1-')).toContain(daLam) // câu đã làm hôm nay vẫn tính vào thể lực hôm nay
    expect(conLai.filter((q) => q.startsWith('DH-B2-')).length).toBeGreaterThan(0)
    const hs = await docHoSo2(k.env, 'S1', HOM_NAY)
    expect(hs.cau.filter((c) => c.qid.startsWith('DH-B1-')).map((c) => c.qid)).toEqual([])
    expect(hs.chienDichHet?.map((c) => c.id)).toEqual(['CD2'])
  })

  it('huỷ nốt CD2: em không còn câu nào của hai chiến dịch (chế độ chờ bài mới), sổ làm bài vẫn nguyên', async () => {
    const k = await dungOmni()
    await layKeHoachHomNay(k.env, 'S1', T_SANG)
    await huy(k, 'CD1'); await huy(k, 'CD2')
    xoaDemChienDich()
    const kh = (await layKeHoachHomNay(k.env, 'S1', T_SANG + 120_000)).kh
    expect(kh.chienDichId).toBeNull()
    expect(cauCua(kh, 'DH-B1-')).toEqual([])
    expect(cauCua(kh, 'DH-B2-')).toEqual([])
    expect(Number((k.d.sql.prepare("SELECT COUNT(*) n FROM su_kien_hoc WHERE sbd = 'S1'").get() as { n: number }).n)).toBe(3)
  })
})

