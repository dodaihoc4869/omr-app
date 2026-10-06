// @vitest-environment node
// VIỆC (14) 06/10 21:03 — thầy: "#cd22009otTH chiến dịch này đang chạy nhưng trên app học sinh báo hôm nay em chưa có câu nào".
// Đo trên D1 thật: chiến dịch giao tay trên 16 tờ TU LUYỆN (0/441 câu có tờ DẠY HỌC), lớp chưa tick bài, OMNI bật ⇒ bộ lọc phạm vi OMNI 3 loại HẾT câu chiến dịch
// khỏi `cau` ⇒ kế hoạch chốt TRỐNG và đứng nguyên cả ngày. Khoá hai luật sửa:
//   (A) câu của chiến dịch ĐANG CHẠY (thầy giao thẳng) luôn vào kế hoạch dù tờ thuộc TU LUYỆN / chưa tick; câu NGOÀI chiến dịch vẫn bị lọc như cũ;
//   (B) kế hoạch đã chốt TRỐNG mà hồ sơ nay lập được kế hoạch có câu ⇒ lập lại (một lần / 3 phút / em); em hết câu thật không bị lập lại.
// D1 thật (node:sqlite, đủ migration); các làn khác là STUB ⇒ vi.mock như tests/omni-3-ke-hoach-d1.test.ts. Thư mục tờ: luật lùi — "DH-…" ⇒ DẠY HỌC, còn lại ⇒ TU LUYỆN.
import { describe, expect, it, vi, beforeEach } from 'vitest'

type PhamViGia = { lop: string; maDe: Set<string>; baiTheoMaDe: Map<string, { khoaBai: string; tenBai: string; viTri: number }>; baiDaTick: { khoaBai: string; tenBai: string; viTri: number; chienDichId: string | null; tickLuc: string }[] }
const gia = vi.hoisted(() => ({
  omni: new Set<string>(),
  phamVi: null as PhamViGia | null,
  dangVung: [] as string[],
}))
vi.mock('../server/src/omni-d1', async (goc) => {
  const that = await goc<typeof import('../server/src/omni-d1')>()
  return {
    ...that,
    omniBat: vi.fn(async (_env: unknown, sbd: string) => gia.omni.has(sbd)),
    omniChoSanh: vi.fn(async (_env: unknown, _sbd: string, _nowMs: number, ngu: Record<string, unknown>) => ({ bat: true, onBaiCu: ngu.onBaiCu, choBaiMoi: !!ngu.cheDoCho })),
    hoSoOmniEm: vi.fn(async (_env: unknown, sbd: string) => ({
      sbd, sEm: 0.08, nVung: 0, nSaiVung: 0, tau: 0, nTau: 0, luotHomNay: 0, cursor: '', phienBan: 'test',
      khungGio: { truoc18: { n: 0, soY: 0 }, '18_20': { n: 0, soY: 0 }, '20_22': { n: 0, soY: 0 }, '22_24': { n: 0, soY: 0 }, sau24: { n: 0, soY: 0 } },
      vkn: {},
    })),
  }
})
vi.mock('../server/src/bai-da-day', async (goc) => {
  const that = await goc<typeof import('../server/src/bai-da-day')>()
  return { ...that, phamViCuaEm: vi.fn(async () => gia.phamVi), lopCuaEm: vi.fn(async () => '12A1') }
})
vi.mock('../server/src/omni-ke-hoach', async (goc) => {
  const that = await goc<typeof import('../server/src/omni-ke-hoach')>()
  return { ...that, dangDaVung: vi.fn(() => [...gia.dangVung]) }
})

import { docHoSo2, layKeHoachHomNay, LENH_TAO_BANG_KE_HOACH_OMNI, qidGoc } from '../server/src/srs2-d1'
import { HOM_NAY, lam, lucVn, T_SANG, taoKhoOmni, themChienDich, type KhoOmni } from './omni-3-ke-hoach-chung'

const tatCa = (kh: { dao: string[]; doan: string[] }) => [...kh.dao, ...kh.doan].map(qidGoc)
const hangKeHoach = (k: KhoOmni) => k.d.sql.prepare('SELECT chien_dich_id, dao_json, doan_json, tong, tao_luc FROM srs2_ke_hoach WHERE sbd = ? AND ngay = ?').get('S1', HOM_NAY) as { chien_dich_id: string | null; dao_json: string; doan_json: string; tong: number; tao_luc: string } | undefined
const hangBangPhu = (k: KhoOmni) => k.d.sql.prepare('SELECT chien_dich_json, cap_nhat_luc FROM srs2_ke_hoach_omni WHERE sbd = ? AND ngay = ?').get('S1', HOM_NAY) as { chien_dich_json: string; cap_nhat_luc: string } | undefined
/** Hai tờ TU LUYỆN (mã không "DH-") làm chiến dịch giao tay; KHO-C là TU LUYỆN NGOÀI chiến dịch; DH-B3 là DẠY HỌC của bài CHƯA tick. */
function dungKho(): KhoOmni {
  const k = taoKhoOmni({ 'KHO-A': 6, 'KHO-B': 12, 'KHO-C': 4, 'DH-B1': 10 })
  gia.omni = new Set(['S1'])
  gia.phamVi = null
  gia.dangVung = []
  themChienDich(k.d, { id: 'CDT', maDe: ['KHO-A', 'KHO-B'], qids: [...k.qids('KHO-A'), ...k.qids('KHO-B')], sbd: ['S1'], hanNop: '2026-10-12', taoLuc: '2026-09-29T02:00:00.000Z', theLuc: 91 })
  return k
}
/** Dòng kế hoạch chốt TRỐNG y như sáng nay trên máy chủ thật (chiến dịch đúng, bảng phụ đúng tập) — CHỈ thứ làm kế hoạch đứng yên là chính bộ lọc cũ. */
function chotTrongTuSang(k: KhoOmni): void {
  k.d.sql.prepare('INSERT INTO srs2_ke_hoach (sbd, ngay, chien_dich_id, dao_json, doan_json, huyet_chien, tong, tao_luc) VALUES (?,?,?,?,?,?,?,?)').run('S1', HOM_NAY, 'CDT', '[]', '[]', 0, 0, new Date(T_SANG - 3_600_000).toISOString())
  k.d.sql.exec(LENH_TAO_BANG_KE_HOACH_OMNI)
  k.d.sql.prepare('INSERT INTO srs2_ke_hoach_omni (sbd, ngay, chien_dich_json, on_bai_cu_json, cap_nhat_luc) VALUES (?,?,?,?,?)').run('S1', HOM_NAY, '["CDT"]', '[]', new Date(T_SANG - 3_600_000).toISOString())
}

beforeEach(() => { gia.omni = new Set(); gia.phamVi = null; gia.dangVung = [] })

describe('(A) câu của chiến dịch ĐANG CHẠY luôn vào kế hoạch — kể cả tờ TU LUYỆN / bài chưa tick', () => {
  it('lớp CHƯA tick bài, chiến dịch giao tay trên tờ TU LUYỆN: mọi câu chiến dịch vào `cau` (nguon chien_dich, cd); câu TU LUYỆN NGOÀI chiến dịch vẫn bị lọc', async () => {
    const k = dungKho()
    await lam(k.env, 'S1', 'KHO-C-0', lucVn('2026-10-02'), false) // nợ TU LUYỆN ngoài mọi chiến dịch ⇒ vẫn không vào kế hoạch (luật OMNI 3 giữ nguyên)
    const hs = await docHoSo2(k.env, 'S1', HOM_NAY)
    expect(hs.chienDich?.id).toBe('CDT')
    const cd = hs.cau.filter((c) => c.nguon === 'chien_dich')
    expect(cd).toHaveLength(18)
    expect(cd.every((c) => c.cd === 'CDT')).toBe(true)
    expect(hs.cau.some((c) => c.qid === 'KHO-C-0')).toBe(false)
    expect(hs.tt.has('KHO-C-0') && hs.meta.has('KHO-C-0')).toBe(true) // vẫn có trạng thái để "Câu đã làm" hiện đủ
  })
  it('lớp ĐÃ tick bài khác (phạm vi có DH-B1): câu chiến dịch TU LUYỆN vẫn vào; câu bài chưa tick ngoài chiến dịch vẫn loại', async () => {
    const k = dungKho()
    gia.phamVi = {
      lop: '12A1', maDe: new Set(['DH-B1']), baiTheoMaDe: new Map([['DH-B1', { khoaBai: 'DH-B1', tenBai: 'Bài 1', viTri: 1 }]]),
      baiDaTick: [{ khoaBai: 'DH-B1', tenBai: 'Bài 1', viTri: 1, chienDichId: null, tickLuc: '2026-10-01T01:00:00.000Z' }],
    }
    await lam(k.env, 'S1', 'KHO-C-1', lucVn('2026-10-02'), false)
    const hs = await docHoSo2(k.env, 'S1', HOM_NAY)
    expect(hs.cau.filter((c) => c.nguon === 'chien_dich')).toHaveLength(18)
    expect(hs.cau.some((c) => c.qid === 'KHO-C-1')).toBe(false)
  })
  it('kế hoạch hôm nay có câu của chiến dịch; mọi câu trong kế hoạch thuộc chiến dịch', async () => {
    const k = dungKho()
    const { kh } = await layKeHoachHomNay(k.env, 'S1', T_SANG)
    const ds = tatCa(kh)
    expect(kh.tong).toBeGreaterThan(0)
    expect(ds.length).toBe(kh.tong)
    expect(ds.every((q) => q.startsWith('KHO-A-') || q.startsWith('KHO-B-'))).toBe(true)
    expect(hangKeHoach(k)?.chien_dich_id).toBe('CDT')
  })
  it('chiến dịch xong/đã đóng KHÔNG được miễn: câu TU LUYỆN của chiến dịch cũ vẫn bị lọc khỏi nợ/duy trì', async () => {
    const k = dungKho()
    themChienDich(k.d, { id: 'CDC', maDe: ['KHO-C'], qids: k.qids('KHO-C'), sbd: ['S1'], hanNop: '2026-09-30', taoLuc: '2026-09-25T01:00:00.000Z', trangThai: 'da_dong' })
    await lam(k.env, 'S1', 'KHO-C-2', lucVn('2026-09-27'), false)
    const hs = await docHoSo2(k.env, 'S1', HOM_NAY)
    expect(hs.cau.some((c) => c.qid.startsWith('KHO-C-'))).toBe(false)
  })
})

describe('(B) kế hoạch đã chốt TRỐNG từ sáng ⇒ lập lại khi hồ sơ nay có câu', () => {
  it('chốt trống + chiến dịch có câu ⇒ lập lại: kế hoạch có câu, dòng chốt và bảng phụ được ghi; lần gọi sau giữ nguyên', async () => {
    const k = dungKho()
    chotTrongTuSang(k)
    expect(hangKeHoach(k)?.tong).toBe(0)
    const { kh } = await layKeHoachHomNay(k.env, 'S1', T_SANG)
    expect(kh.tong).toBeGreaterThan(0)
    expect(tatCa(kh).every((q) => q.startsWith('KHO-A-') || q.startsWith('KHO-B-'))).toBe(true)
    const h = hangKeHoach(k)!
    expect(h.tong).toBe(kh.tong)
    expect(JSON.parse(h.dao_json).length + JSON.parse(h.doan_json).length).toBe(kh.tong)
    expect(h.chien_dich_id).toBe('CDT')
    expect(JSON.parse(hangBangPhu(k)!.chien_dich_json)).toEqual(['CDT'])
    // gọi lại: kế hoạch đã có câu ⇒ không lập lại nữa
    const lai = await layKeHoachHomNay(k.env, 'S1', T_SANG + 600_000)
    expect(lai.kh.dao).toEqual(kh.dao)
    expect(lai.kh.doan).toEqual(kh.doan)
    expect(hangBangPhu(k)!.cap_nhat_luc).toBe(new Date(T_SANG).toISOString())
  })
  it('em HẾT câu thật (chiến dịch đã thành thạo, chưa tới lịch ôn): chốt trống GIỮ NGUYÊN — không lập lại, không ghi D1', async () => {
    const k = dungKho()
    for (const q of [...k.qids('KHO-A'), ...k.qids('KHO-B')]) { await lam(k.env, 'S1', q, lucVn('2026-10-02'), true); await lam(k.env, 'S1', q, lucVn('2026-10-04'), true) }
    const hs = await docHoSo2(k.env, 'S1', HOM_NAY)
    expect(hs.cau.filter((c) => c.nguon === 'chien_dich')).toHaveLength(18)
    expect(hs.cau.every((c) => hs.tt.get(c.qid)?.thanhThao && !((hs.tt.get(c.qid)?.henOn ?? '9') <= HOM_NAY))).toBe(true) // tiền đề: đã vững, chưa tới lịch
    chotTrongTuSang(k)
    const dau = hangBangPhu(k)!.cap_nhat_luc
    for (const dt of [0, 30_000, 5 * 60_000]) { // kể cả sau khi bộ nhớ 3 phút hết hạn: đánh giá lại vẫn ra trống ⇒ không ghi
      const { kh } = await layKeHoachHomNay(k.env, 'S1', T_SANG + dt)
      expect(kh.tong).toBe(0)
    }
    expect(hangBangPhu(k)!.cap_nhat_luc).toBe(dau)
    expect(hangKeHoach(k)?.tong).toBe(0)
  })
  it('lập lại ra TRỐNG nữa (mọi dạng đã vững) ⇒ chỉ thử lại sau 3 phút, không mỗi lượt gọi', async () => {
    const k = dungKho()
    gia.dangVung = ['KHO-A.D0', 'KHO-A.D1', 'KHO-A.D2', 'KHO-B.D0', 'KHO-B.D1', 'KHO-B.D2']
    chotTrongTuSang(k)
    const g = (dt: number) => layKeHoachHomNay(k.env, 'S1', T_SANG + dt)
    const mot = await g(0)
    expect(mot.kh.tong).toBe(0) // dạng đã vững ⇒ câu mới không bắt buộc ⇒ kế hoạch gốc vẫn trống
    const luc1 = hangBangPhu(k)!.cap_nhat_luc
    expect(luc1).toBe(new Date(T_SANG).toISOString()) // lượt đầu đã thử lập lại (ghi dòng bảng phụ)
    await g(60_000)
    expect(hangBangPhu(k)!.cap_nhat_luc).toBe(luc1) // trong 3 phút: không thử lại
    await g(4 * 60_000)
    expect(hangBangPhu(k)!.cap_nhat_luc).toBe(new Date(T_SANG + 4 * 60_000).toISOString()) // qua 3 phút: thử lại một lần
  })
})
