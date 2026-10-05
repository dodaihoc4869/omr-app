// @vitest-environment node
// OMNI 3 · làn A2 — lớp D1 của kế hoạch ngày khi OMNI BẬT (D1 thật node:sqlite, lược đồ đủ migration): nhiều bài song song, lọc phạm vi đã dạy + TU LUYỆN,
// ôn bài cũ, chế độ chờ, tick bài giữa ngày (lập lại giữ câu đã làm, bảng phụ srs2_ke_hoach_omni), lọc lướt, đổi thứ tự khung giờ mệt, phần OMNI của Sảnh.
// Các làn khác còn là STUB ⇒ tiêm bằng vi.mock: omniBat / omniChoSanh / hoSoOmniEm / qCuaCau (omni-d1), phamViCuaEm / lopCuaEm (bai-da-day),
// dangDaVung (omni-ke-hoach). Thư mục tờ dùng luật lùi của stub kho-thu-muc: "DH-…" ⇒ DẠY HỌC, còn lại (KHO-A) ⇒ TU LUYỆN.
import { describe, expect, it, vi, beforeEach } from 'vitest'

type PhamViGia = { lop: string; maDe: Set<string>; baiTheoMaDe: Map<string, { khoaBai: string; tenBai: string; viTri: number }>; baiDaTick: { khoaBai: string; tenBai: string; viTri: number; chienDichId: string | null; tickLuc: string }[] }
const gia = vi.hoisted(() => ({
  omni: new Set<string>(),
  phamVi: null as PhamViGia | null,
  sanh: [] as { sbd: string; ngu: Record<string, unknown> }[],
  coQuanSat: false,
  dangVung: [] as string[],
}))
vi.mock('../server/src/omni-d1', async (goc) => {
  const that = await goc<typeof import('../server/src/omni-d1')>()
  return {
    ...that,
    omniBat: vi.fn(async (_env: unknown, sbd: string) => gia.omni.has(sbd)),
    omniChoSanh: vi.fn(async (_env: unknown, sbd: string, _nowMs: number, ngu: Record<string, unknown>) => { gia.sanh.push({ sbd, ngu }); return { bat: true, onBaiCu: ngu.onBaiCu, choBaiMoi: !!ngu.cheDoCho } }),
    // hồ sơ OMNI TỔNG HỢP (không phụ thuộc bản phát lại thật của làn khác): chưa / đã có quan sát tự làm
    hoSoOmniEm: vi.fn(async (_env: unknown, sbd: string) => ({
      sbd, sEm: 0.08, nVung: 0, nSaiVung: 0, tau: 0, nTau: 0, luotHomNay: 0, cursor: '', phienBan: 'test',
      khungGio: { truoc18: { n: 0, soY: 0 }, '18_20': { n: 0, soY: 0 }, '20_22': { n: 0, soY: 0 }, '22_24': { n: 0, soY: 0 }, sau24: { n: 0, soY: 0 } },
      vkn: gia.coQuanSat ? { 'dang:x': { vkn: 'dang:x', p: 0.5, nTuLam: 3, nCau: 3, nNgay: 2, nTroiChay: 0, nCauLaDung: 0, diemSprt: 0, trangThai: 'chua_du' as const, ngayCuoi: null, dayLai: false } } : {},
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

import { chanDoanEm, docHoSo2, docKeHoachOmni, docQuyetMetGio, doiThuTuMetGio, layKeHoachHomNay, qidGoc, sanh2, type HoSo2, type KeHoachDaChot } from '../server/src/srs2-d1'
import { bam, congNgay, quotaCauMoi, soNgayConLai } from '../server/src/srs2-loi'
import { theLucCho } from '../server/src/omni-ke-hoach'
import { dungKichBanHaiChienDich, HOM_NAY, lam, lucVn, NGAY_MS, T_SANG, taoKhoOmni, themChienDich, type KhoOmni } from './omni-3-ke-hoach-chung'

function phamViBai(...bai: { ma: string; viTri: number; tick?: string }[]): PhamViGia {
  return {
    lop: '12A1',
    maDe: new Set(bai.map((b) => b.ma)),
    baiTheoMaDe: new Map(bai.map((b) => [b.ma, { khoaBai: b.ma, tenBai: `Bài ${b.ma}`, viTri: b.viTri }])),
    baiDaTick: bai.filter((b) => b.tick).map((b) => ({ khoaBai: b.ma, tenBai: `Bài ${b.ma}`, viTri: b.viTri, chienDichId: b.tick!, tickLuc: '2026-10-01T01:00:00.000Z' })),
  }
}
const tatCa = (kh: Pick<KeHoachDaChot, 'dao' | 'doan'>) => [...kh.dao, ...kh.doan].map(qidGoc)
const bangCo = (k: KhoOmni, ten: string) => Number((k.d.sql.prepare(`SELECT COUNT(*) n FROM sqlite_master WHERE name = '${ten}'`).get() as { n: number }).n) > 0

beforeEach(() => {
  gia.omni = new Set()
  gia.phamVi = null
  gia.sanh = []
  gia.coQuanSat = false
  gia.dangVung = []
})

describe('OMNI 3 · docHoSo2 — nhiều bài song song + lọc phạm vi + ôn bài cũ', () => {
  it('đọc MỌI chiến dịch đang chạy (hạn gần trước), câu mang cd; bài chưa tick và TU LUYỆN không vào cau (vẫn trong tt/meta); ứng viên ôn bài cũ', async () => {
    const k = await dungKichBanHaiChienDich()
    gia.omni = new Set(['S1'])
    gia.phamVi = phamViBai({ ma: 'DH-B0', viTri: 0 }, { ma: 'DH-B1', viTri: 1, tick: 'CD1' }, { ma: 'DH-B2', viTri: 2, tick: 'CD2' })
    const hs = await docHoSo2(k.env, 'S1', HOM_NAY)
    expect(hs.chienDich?.id).toBe('CD1') // hạn 07/10 gần hơn CD2 (09/10) dù CD2 giao sau
    expect(hs.chienDichHet?.map((c) => c.id)).toEqual(['CD1', 'CD2'])
    for (const c of hs.cau) if (c.nguon === 'chien_dich') expect(c.cd).toBe(c.qid.startsWith('DH-B1') ? 'CD1' : 'CD2')
    expect(hs.cau.filter((c) => c.nguon === 'chien_dich').length).toBe(12 + 10)
    // không câu bài 3 (chưa tick) / TU LUYỆN dù em từng sai (nợ) — vẫn có trạng thái để "Câu đã làm" hiện đủ
    expect(hs.cau.some((c) => c.qid.startsWith('DH-B3') || c.qid.startsWith('KHO-A'))).toBe(false)
    for (const q of ['DH-B3-0', 'DH-B3-1', 'KHO-A-0', 'KHO-A-4']) { expect(hs.tt.has(q), q).toBe(true); expect(hs.meta.has(q), q).toBe(true) }
    // nợ cũ / duy trì của bài trong phạm vi vẫn vào
    expect(hs.cau.find((c) => c.qid === 'DH-B0-1')?.nguon).toBe('no_cu')
    // ôn bài cũ: câu DH-B0 chưa gặp (không thuộc chiến dịch đang chạy, chưa có trong cau)
    expect(hs.onBaiCu?.map((c) => c.qid)).toEqual(['DH-B0-2', 'DH-B0-3', 'DH-B0-4', 'DH-B0-5', 'DH-B0-6', 'DH-B0-7'])
    expect(hs.onBaiCu?.every((c) => c.nguon === 'on_bai_cu' && hs.tt.get(c.qid)?.laMoi && hs.meta.has(c.qid))).toBe(true)
    expect(hs.omni).toEqual({ bat: true, cheDoCho: false, onBaiCuSo: 6 })
    // em khác cùng D1, cờ tắt ⇒ đường cũ y nguyên (không khoá OMNI)
    const hs2 = await docHoSo2(k.env, 'S2', HOM_NAY)
    expect('omni' in hs2 || 'chienDichHet' in hs2 || 'onBaiCu' in hs2).toBe(false)
  })
  it('lớp CHƯA tick bài (phạm vi null): không lọc theo phạm vi, chỉ lọc TU LUYỆN; không ôn bài cũ, không chế độ chờ', async () => {
    const k = await dungKichBanHaiChienDich()
    gia.omni = new Set(['S1'])
    const hs = await docHoSo2(k.env, 'S1', HOM_NAY)
    expect(hs.cau.some((c) => c.qid.startsWith('DH-B3'))).toBe(true)
    expect(hs.cau.some((c) => c.qid.startsWith('KHO-A'))).toBe(false)
    expect(hs.onBaiCu).toEqual([])
    expect(hs.omni).toEqual({ bat: true, cheDoCho: false, onBaiCuSo: 0 })
  })
  it('kế hoạch: không câu ngoài phạm vi; câu mới theo quota từng bài; bảng phụ lưu tập chiến dịch + câu ôn bài cũ; Sảnh có phần OMNI', async () => {
    const k = await dungKichBanHaiChienDich()
    gia.omni = new Set(['S1'])
    gia.phamVi = phamViBai({ ma: 'DH-B0', viTri: 0 }, { ma: 'DH-B1', viTri: 1, tick: 'CD1' }, { ma: 'DH-B2', viTri: 2, tick: 'CD2' })
    const s = await sanh2(k.env, 'S1', T_SANG)
    const { kh, hs } = await layKeHoachHomNay(k.env, 'S1', T_SANG + 1000)
    const ds = tatCa(kh)
    expect(ds.every((q) => q.startsWith('DH-B0') || q.startsWith('DH-B1') || q.startsWith('DH-B2'))).toBe(true)
    // CD1: D = 3 ⇒ mọi câu mới còn lại (8) vào hôm nay; CD2 tắt rải đều ⇒ câu mới lấp lượt dư
    const moiCd1 = ds.filter((q) => q.startsWith('DH-B1') && hs.tt.get(q)!.laMoi)
    expect(moiCd1).toHaveLength(8)
    expect(kh.tong).toBeLessThanOrEqual(40)
    const luu = await docKeHoachOmni(k.env, 'S1', HOM_NAY)
    expect(luu?.chienDich).toEqual(['CD1', 'CD2'])
    expect(luu?.onBaiCu).toEqual(kh.onBaiCu)
    expect(kh.onBaiCu!.every((q) => q.startsWith('DH-B0-') && ds.includes(q))).toBe(true)
    // Sảnh: phần OMNI do làn D1 dựng — nhận đúng tổng/còn/chiến dịch hạn gần nhất/số câu ôn bài cũ/chế độ chờ
    expect(s.omni).toBeTruthy()
    expect(gia.sanh.at(-1)).toEqual({ sbd: 'S1', ngu: { tong: kh.tong, con: kh.conDao.length + kh.conDoan.length, chienDichId: 'CD1', onBaiCu: kh.onBaiCu!.length, cheDoCho: false } })
    // mở lại trong ngày: không lập lại
    const lai = await layKeHoachHomNay(k.env, 'S1', T_SANG + 60_000)
    expect(lai.kh.dao).toEqual(kh.dao)
    expect(lai.kh.doan).toEqual(kh.doan)
    // cờ tắt cho S2 ⇒ Sảnh không có khoá omni, không bảng phụ cho S2
    const s2 = await sanh2(k.env, 'S2', T_SANG)
    expect('omni' in s2).toBe(false)
    expect(await docKeHoachOmni(k.env, 'S2', HOM_NAY)).toBeNull()
  })
  it('trọng số OMNI chỉ dùng khi em đã có quan sát; dạng đã vững ⇒ câu mới dạng ấy rời kế hoạch (vẫn trong hồ sơ)', async () => {
    const k = await dungKichBanHaiChienDich()
    gia.omni = new Set(['S1'])
    gia.phamVi = phamViBai({ ma: 'DH-B0', viTri: 0 }, { ma: 'DH-B1', viTri: 1, tick: 'CD1' }, { ma: 'DH-B2', viTri: 2, tick: 'CD2' })
    const cd0 = (await chanDoanEm(k.env, 'S1', T_SANG)) as { omni: { lapLaiSeRa: { coTrongSo: boolean; tiLeOnBaiCu: number } } }
    expect(cd0.omni.lapLaiSeRa.coTrongSo).toBe(false)
    expect(cd0.omni.lapLaiSeRa.tiLeOnBaiCu).toBe(0.4) // ngày 5 của bài hạn gần nhất (giao 01/10) ⇒ đan xen 40 %
    gia.coQuanSat = true
    const cd1 = (await chanDoanEm(k.env, 'S1', T_SANG)) as { omni: { lapLaiSeRa: { coTrongSo: boolean } } }
    expect(cd1.omni.lapLaiSeRa.coTrongSo).toBe(true)
    gia.coQuanSat = false
    gia.dangVung = ['DH-B2.D1']
    const { kh, hs } = await layKeHoachHomNay(k.env, 'S1', T_SANG)
    const moiD1 = hs.cau.filter((c) => c.dang === 'DH-B2.D1' && hs.tt.get(c.qid)!.laMoi).map((c) => c.qid)
    expect(moiD1.length).toBeGreaterThan(0)
    expect(tatCa(kh).some((q) => moiD1.includes(q))).toBe(false)
  })
})

describe('OMNI 3 · ôn bài cũ khi chưa có trọng số: dạng yếu trước, bài gần nhất trước', () => {
  it('hạng theo dạng (nam_kt_dang) L1 → L4 xếp ứng viên; trong cùng hạng giữ thứ tự hồ sơ', async () => {
    const k = taoKhoOmni({ 'DH-B0': 8, 'DH-B1': 12 })
    gia.omni = new Set(['S1'])
    gia.phamVi = phamViBai({ ma: 'DH-B0', viTri: 0 }, { ma: 'DH-B1', viTri: 1, tick: 'CD1' })
    themChienDich(k.d, { id: 'CD1', maDe: ['DH-B1'], qids: k.qids('DH-B1'), sbd: ['S1'], hanNop: '2026-10-20', taoLuc: '2026-10-05T01:00:00.000Z', theLuc: 40 })
    const st = k.d.sql.prepare('INSERT INTO nam_kt_dang (khoa, sbd, ma_dang, so_gap, so_sai, so_da_khac_phuc, so_moi_sai, so_chua_thay_sai, bac, cap_nhat_luc) VALUES (?,?,?,?,?,0,0,0,0,?)')
    st.run('S1|DH-B0.D2', 'S1', 'DH-B0.D2', 10, 9, '2026-10-01T00:00:00.000Z') // p ≈ 0,21 ⇒ L1
    st.run('S1|DH-B0.D1', 'S1', 'DH-B0.D1', 10, 5, '2026-10-01T00:00:00.000Z') // p = 0,5 ⇒ L2
    st.run('S1|DH-B0.D0', 'S1', 'DH-B0.D0', 10, 0, '2026-10-01T00:00:00.000Z') // p ≈ 0,86 ⇒ L4
    const hs = await docHoSo2(k.env, 'S1', HOM_NAY)
    expect(hs.onBaiCu?.map((c) => c.qid)).toEqual(['DH-B0-0', 'DH-B0-1', 'DH-B0-2', 'DH-B0-3', 'DH-B0-4', 'DH-B0-5', 'DH-B0-6', 'DH-B0-7'])
    const { kh } = await layKeHoachHomNay(k.env, 'S1', T_SANG)
    // ngày 1 của bài (tỉ lệ 0,2 ⇒ ≤ 8 câu ôn bài cũ): dạng D2 (L1) → D1 (L2) → D0 (L4)
    expect(kh.onBaiCu).toEqual(['DH-B0-2', 'DH-B0-5', 'DH-B0-1', 'DH-B0-4', 'DH-B0-7', 'DH-B0-0', 'DH-B0-3', 'DH-B0-6'])
  })
})

describe('OMNI 3 · tick bài giữa ngày ⇒ lập lại giữ câu đã làm', () => {
  it('tập chiến dịch đổi ⇒ lập lại: câu đã làm đứng đầu, quota bài cũ trừ phần đã làm, bài mới có câu mới; bảng phụ cập nhật', async () => {
    const k = taoKhoOmni({ 'DH-B1': 30, 'DH-B2': 24 })
    gia.omni = new Set(['S1'])
    gia.phamVi = phamViBai({ ma: 'DH-B0', viTri: 0 }, { ma: 'DH-B1', viTri: 1, tick: 'CD1' })
    themChienDich(k.d, { id: 'CD1', maDe: ['DH-B1'], qids: k.qids('DH-B1'), sbd: ['S1'], hanNop: '2026-10-09', taoLuc: '2026-10-05T01:00:00.000Z', theLuc: 40 })
    const kh1 = (await layKeHoachHomNay(k.env, 'S1', T_SANG)).kh
    expect((await docKeHoachOmni(k.env, 'S1', HOM_NAY))?.chienDich).toEqual(['CD1'])
    const moiNgay1 = quotaCauMoi(30, soNgayConLai(HOM_NAY, '2026-10-09')) // ceil(30/2) = 15
    expect(tatCa(kh1).filter((q) => q.startsWith('DH-B1')).length).toBe(moiNgay1)
    const daLam = kh1.dao.slice(0, 3)
    for (const [i, key] of daLam.entries()) await lam(k.env, 'S1', qidGoc(key), T_SANG + 60_000 * (i + 1), i !== 1)
    // thầy tick bài 2 lúc 10:00
    themChienDich(k.d, { id: 'CD2', maDe: ['DH-B2'], qids: k.qids('DH-B2'), sbd: ['S1'], hanNop: '2026-10-11', taoLuc: '2026-10-05T03:00:00.000Z', theLuc: 40 })
    gia.phamVi = phamViBai({ ma: 'DH-B0', viTri: 0 }, { ma: 'DH-B1', viTri: 1, tick: 'CD1' }, { ma: 'DH-B2', viTri: 2, tick: 'CD2' })
    const { kh: kh2 } = await layKeHoachHomNay(k.env, 'S1', T_SANG + 2 * 3_600_000)
    expect(kh2.dao.slice(0, 3)).toEqual(daLam)
    expect(kh2.conDao.some((x) => daLam.includes(x))).toBe(false)
    expect((await docKeHoachOmni(k.env, 'S1', HOM_NAY))?.chienDich).toEqual(['CD1', 'CD2'])
    const moiCd1 = tatCa(kh2).filter((q) => q.startsWith('DH-B1'))
    expect(moiCd1.length).toBe(moiNgay1) // 3 đã làm + (quota(27 + 3) − 3) mới còn lại
    const moiCd2 = tatCa(kh2).filter((q) => q.startsWith('DH-B2'))
    expect(moiCd2.length).toBe(quotaCauMoi(24, soNgayConLai(HOM_NAY, '2026-10-11'))) // ceil(24/4) = 6
    expect(kh2.tong).toBeLessThanOrEqual(40 + 0)
    // mở lại: không lập lại nữa
    const { kh: kh3 } = await layKeHoachHomNay(k.env, 'S1', T_SANG + 3 * 3_600_000)
    expect(kh3.dao).toEqual(kh2.dao)
  })
})

describe('OMNI 3 · chế độ chờ bài mới', () => {
  const dungCho = async (theLucLop?: number) => {
    const k = taoKhoOmni({ 'DH-B1': 20 })
    gia.omni = new Set(['S1'])
    gia.phamVi = phamViBai({ ma: 'DH-B0', viTri: 0 }, { ma: 'DH-B1', viTri: 1, tick: 'CD1' })
    themChienDich(k.d, { id: 'CD1', maDe: ['DH-B1'], qids: k.qids('DH-B1'), sbd: ['S1'], hanNop: '2026-10-01', taoLuc: '2026-09-25T01:00:00.000Z', theLuc: 40 })
    if (theLucLop) k.d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('the_luc_lop','{"12A1":${theLucLop}}','x')`)
    const b1 = k.qids('DH-B1')
    for (let i = 0; i < 6; i++) await lam(k.env, 'S1', b1[i]!, lucVn('2026-09-30'), false) // nợ (sai trong chiến dịch)
    for (let i = 6; i < 10; i++) await lam(k.env, 'S1', b1[i]!, lucVn('2026-09-27'), true) // đúng một lần
    return k
  }
  it('không chiến dịch đang chạy + lớp đã tick ⇒ cheDoCho; trần = theLucCho(thể lực lớp 30) = 18; nợ trước, ôn bài cũ lấp phần còn lại', async () => {
    const k = await dungCho(30)
    const hs = await docHoSo2(k.env, 'S1', HOM_NAY)
    expect(hs.chienDich).toBeNull()
    expect(hs.omni?.cheDoCho).toBe(true)
    const { kh } = await layKeHoachHomNay(k.env, 'S1', T_SANG)
    expect(theLucCho(30)).toBe(18)
    expect(kh.tong).toBe(18)
    const ds = tatCa(kh)
    const no = ds.filter((q) => hs.cau.some((c) => c.qid === q && c.nguon === 'no_cu'))
    expect(no.length).toBeGreaterThanOrEqual(6)
    expect(kh.onBaiCu!.length).toBe(18 - no.length)
    await sanh2(k.env, 'S1', T_SANG + 1000)
    expect(gia.sanh.at(-1)?.ngu).toMatchObject({ chienDichId: null, cheDoCho: true, onBaiCu: kh.onBaiCu!.length })
  })
  it('vắng thể lực lớp ⇒ 40 ⇒ trần 24', async () => {
    const k = await dungCho()
    const { kh } = await layKeHoachHomNay(k.env, 'S1', T_SANG)
    expect(kh.tong).toBe(24)
  })
})

describe('OMNI 3 · lọc lướt (purpose luot)', () => {
  it('dòng lướt KHÔNG là lần làm (câu vẫn mới, không vào nợ) nhưng tính là ĐÃ PHỤC VỤ hôm nay', async () => {
    const k = taoKhoOmni({ 'DH-B1': 12 })
    gia.omni = new Set(['S1'])
    gia.phamVi = phamViBai({ ma: 'DH-B1', viTri: 1, tick: 'CD1' })
    themChienDich(k.d, { id: 'CD1', maDe: ['DH-B1'], qids: k.qids('DH-B1'), sbd: ['S1'], hanNop: '2026-10-12', taoLuc: '2026-10-05T01:00:00.000Z', theLuc: 40 })
    const kh = (await layKeHoachHomNay(k.env, 'S1', T_SANG)).kh
    const q = qidGoc(kh.dao[0]!)
    await lam(k.env, 'S1', q, T_SANG + 60_000, null, { purpose: 'luot' })
    const { kh: sau, hs } = await layKeHoachHomNay(k.env, 'S1', T_SANG + 120_000)
    expect(hs.tt.get(q)?.laMoi).toBe(true)
    expect(hs.cau.find((c) => c.qid === q)?.nguon).toBe('chien_dich')
    expect(sau.conDao.map(qidGoc)).not.toContain(q)
    expect(sau.conDao.length).toBe(kh.conDao.length - 1)
  })
})

describe('OMNI 3 · doiThuTuMetGio (khung giờ mệt)', () => {
  const dung = async (hanNop = '2026-10-15') => {
    const k = taoKhoOmni({ 'DH-B1': 40 }, 4)
    gia.omni = new Set(['S1', 'S2'])
    gia.phamVi = phamViBai({ ma: 'DH-B1', viTri: 1, tick: 'CD1' })
    // rải đều tắt ⇒ câu mới lấp đủ thể lực ⇒ kế hoạch có câu Vận dụng / Vận dụng cao
    themChienDich(k.d, { id: 'CD1', maDe: ['DH-B1'], qids: k.qids('DH-B1'), sbd: ['S1', 'S2', 'S3'], hanNop, taoLuc: '2026-10-03T01:00:00.000Z', theLuc: 30, raiDeu: false })
    const b1 = k.qids('DH-B1')
    for (const s of ['S1', 'S2']) for (const i of [0, 1, 2, 3, 6, 7]) await lam(k.env, s, b1[i]!, lucVn('2026-10-04'), false)
    return k
  }
  it("'de_mai': câu mới Vận dụng+ chưa làm rời hôm nay (D_mai > 3), câu ôn nhẹ lên trước; ghi quyết định", async () => {
    const k = await dung()
    const { kh, hs } = await layKeHoachHomNay(k.env, 'S1', T_SANG)
    const lam1 = qidGoc(kh.dao[0]!)
    await lam(k.env, 'S1', lam1, T_SANG + 60_000, true)
    const muc = (q: string) => hs.meta.get(q)?.mucDo ?? ''
    const khoMoi = tatCa(kh).filter((q) => hs.tt.get(q)!.laMoi && (muc(q) === 'VD' || muc(q) === 'VDC') && q !== lam1)
    expect(khoMoi.length).toBeGreaterThan(0)
    const r = await doiThuTuMetGio(k.env, 'S1', T_SANG + 120_000, 'de_mai')
    expect(r.ok).toBe(true)
    const { kh: sau } = await layKeHoachHomNay(k.env, 'S1', T_SANG + 180_000)
    expect(tatCa(sau).some((q) => khoMoi.includes(q))).toBe(false)
    expect(sau.tong).toBe(kh.tong - khoMoi.length)
    expect(r).toEqual({ ok: true, theLuc: { con: sau.conDao.length + sau.conDoan.length, tong: sau.tong }, dao: { con: sau.conDao.length }, doan: { con: sau.conDoan.length } })
    expect(tatCa(sau)).toContain(lam1) // câu đã làm giữ nguyên
    // câu ôn nhẹ (không khó) đứng trước câu ôn khó trong phần còn lại của Đoàn
    const kho = (q: string) => muc(q) === 'VD' || muc(q) === 'VDC'
    const conDoan = sau.conDoan.map(qidGoc)
    const dauKho = conDoan.findIndex(kho)
    if (dauKho >= 0) expect(conDoan.slice(dauKho).some((q) => !kho(q) && !hs.tt.get(q)!.laMoi)).toBe(false)
    expect(await docQuyetMetGio(k.env, 'S1', T_SANG)).toBe('de_mai')
    // bảng phụ vẫn giữ tập chiến dịch (không lập lại cả ngày)
    expect((await docKeHoachOmni(k.env, 'S1', HOM_NAY))?.chienDich).toEqual(['CD1'])
  })
  it("'lam_luon': kế hoạch y nguyên, chỉ ghi quyết định; OMNI tắt ⇒ { ok:false }", async () => {
    const k = await dung()
    const { kh } = await layKeHoachHomNay(k.env, 'S2', T_SANG)
    const r = await doiThuTuMetGio(k.env, 'S2', T_SANG + 1000, 'lam_luon')
    expect(r).toMatchObject({ ok: true, theLuc: { tong: kh.tong } })
    const { kh: sau } = await layKeHoachHomNay(k.env, 'S2', T_SANG + 2000)
    expect(sau.dao).toEqual(kh.dao)
    expect(await docQuyetMetGio(k.env, 'S2', T_SANG)).toBe('lam_luon')
    expect(await doiThuTuMetGio(k.env, 'S3', T_SANG, 'de_mai')).toEqual({ ok: false })
  })
  it("'de_mai' sát hạn (ngày mai đã là ngày ôn chốt) ⇒ không dời câu mới nào", async () => {
    const k = await dung('2026-10-08') // D = 4 ⇒ D_mai = 3
    const { kh } = await layKeHoachHomNay(k.env, 'S1', T_SANG)
    await doiThuTuMetGio(k.env, 'S1', T_SANG + 1000, 'de_mai')
    const { kh: sau } = await layKeHoachHomNay(k.env, 'S1', T_SANG + 2000)
    expect(sau.tong).toBe(kh.tong)
    expect([...sau.dao].sort()).toEqual([...kh.dao].sort())
  })
})

describe('OMNI 3 · mô phỏng D1 nhiều ngày: bài 2 tick ngày 4, bài 3 không bao giờ tick', () => {
  it('4 em × 10 ngày: mọi câu mới gặp trước hạn riêng − 3; không câu bài 3 / TU LUYỆN; kế hoạch không vượt trần trừ Huyết Chiến', async () => {
    const k = taoKhoOmni({ 'DH-B0': 10, 'DH-B1': 36, 'DH-B2': 30, 'DH-B3': 12, 'KHO-A': 8 }, 4)
    const em = ['S1', 'S2', 'S3', 'S4']
    gia.omni = new Set(em)
    const b3 = k.qids('DH-B3'), kho = k.qids('KHO-A')
    // trước khi tick: em từng sai câu bài 3 và câu TU LUYỆN (nguồn thứ 4) ⇒ cờ tắt sẽ kéo vào nợ; OMNI bật ⇒ không bao giờ vào kế hoạch
    for (const s of em) { await lam(k.env, s, b3[0]!, lucVn('2026-09-30'), false); await lam(k.env, s, kho[0]!, lucVn('2026-09-30'), false) }
    themChienDich(k.d, { id: 'CD1', maDe: ['DH-B1'], qids: k.qids('DH-B1'), sbd: em, hanNop: '2026-10-07', taoLuc: '2026-10-01T00:30:00.000Z', theLuc: 12 })
    const gapDau = new Map<string, string>()
    let soNgayHuyetChien = 0
    for (let d = 0; d < 10; d++) {
      const ngay = congNgay('2026-10-01', d)
      if (ngay === '2026-10-04') themChienDich(k.d, { id: 'CD2', maDe: ['DH-B2'], qids: k.qids('DH-B2'), sbd: em, hanNop: '2026-10-10', taoLuc: '2026-10-04T00:30:00.000Z', theLuc: 12 })
      gia.phamVi = ngay < '2026-10-04'
        ? phamViBai({ ma: 'DH-B0', viTri: 0 }, { ma: 'DH-B1', viTri: 1, tick: 'CD1' })
        : phamViBai({ ma: 'DH-B0', viTri: 0 }, { ma: 'DH-B1', viTri: 1, tick: 'CD1' }, { ma: 'DH-B2', viTri: 2, tick: 'CD2' })
      for (const [si, s] of em.entries()) {
        const sang = lucVn(ngay, 8)
        const { kh } = await layKeHoachHomNay(k.env, s, sang)
        const ds = tatCa(kh)
        expect(ds.some((q) => q.startsWith('DH-B3') || q.startsWith('KHO-A')), `${s} ${ngay}`).toBe(false)
        if (ngay < '2026-10-04') expect(ds.some((q) => q.startsWith('DH-B2'))).toBe(false)
        if (kh.huyetChien) soNgayHuyetChien++
        expect(kh.tong).toBeLessThanOrEqual(kh.huyetChien ? 24 : 12)
        for (const [i, key] of [...kh.conDao, ...kh.conDoan].entries()) {
          const q = qidGoc(key)
          const dung = bam(`${s}|${q}|${ngay}`) / 4294967296 < 0.55 + 0.1 * si
          await lam(k.env, s, q, sang + 3_600_000 + i * 60_000, dung)
          if (!gapDau.has(`${s}|${q}`)) gapDau.set(`${s}|${q}`, ngay)
        }
      }
    }
    const tre: string[] = []
    for (const s of em) {
      for (const q of k.qids('DH-B1')) { const n = gapDau.get(`${s}|${q}`); if (!n || n > '2026-10-04') tre.push(`${s} ${q} ${n}`) }
      for (const q of k.qids('DH-B2')) { const n = gapDau.get(`${s}|${q}`); if (!n || n > '2026-10-07') tre.push(`${s} ${q} ${n}`) }
    }
    expect(tre).toEqual([])
    expect(soNgayHuyetChien).toBeGreaterThanOrEqual(0)
    expect(bangCo(k, 'srs2_ke_hoach_omni')).toBe(true)
    void NGAY_MS
  }, 60_000)
})
