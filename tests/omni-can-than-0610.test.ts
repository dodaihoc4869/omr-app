// @vitest-environment node
// OMNI 3 · CHƯƠNG TRÌNH "CẨN THẬN" (đặc tả DAC-TA-BUILD-OMNI-3-0510.md mục 4.6; thầy 05–06/10 "Làm nốt đi tất cả") — LÀN B, đợt 2 sáng 06/10.
// Phần máy chủ: (a) mốc kiểm duy trì 14/30 ngày × 0,7 khi OMNI bật ∧ Sơ ý > 0,07 · cờ `canThan` · lựa chọn thẻ "Sai vì bước nào?" · ghi sổ riêng `omni_buoc_sai`.
// D1 THẬT (node:sqlite, lược đồ đủ migration). `omniBat` / `hoSoOmniEm` của lớp omni-d1 là GIẢ tất định (cùng cách tests/omni-3-ke-hoach-d1.test.ts) để đặt Sơ ý tuỳ ý.
import { beforeEach, describe, expect, it, vi } from 'vitest'

const gia = vi.hoisted(() => ({
  omni: new Set<string>(),
  /** Sơ ý + số lượt ở câu đã vững của hồ sơ giả theo em (vắng ⇒ 0,08 / 0 = prior, như hồ sơ rỗng thật). */
  sEm: {} as Record<string, { sEm: number; nVung: number }>,
}))
vi.mock('../server/src/omni-d1', async (goc) => {
  const that = await goc<typeof import('../server/src/omni-d1')>()
  return {
    ...that,
    omniBat: vi.fn(async (_env: unknown, sbd: string) => gia.omni.has(sbd)),
    hoSoOmniEm: vi.fn(async (_env: unknown, sbd: string) => ({
      sbd, sEm: gia.sEm[sbd]?.sEm ?? 0.08, nVung: gia.sEm[sbd]?.nVung ?? 0, nSaiVung: 0, tau: 0, nTau: 0, luotHomNay: 0, cursor: '', phienBan: 'test', vkn: {},
      khungGio: { truoc18: { n: 0, soY: 0 }, '18_20': { n: 0, soY: 0 }, '20_22': { n: 0, soY: 0 }, '22_24': { n: 0, soY: 0 }, sau24: { n: 0, soY: 0 } },
    })),
  }
})

import { docHoSo2, layKeHoachHomNay } from '../server/src/srs2-d1' // nạp srs2-d1 TRƯỚC (như các test kế hoạch OMNI khác): omni-d1 nạp lười nên vi.mock của omni-d1 có hiệu lực
import { THAM_SO_OMNI, type HoSoOmniEm } from '../server/src/omni-kieu'
import { THAM_SO_GOC, type ThamSoLuat } from '../server/src/loi-hoc-luat'
import {
  LENH_OMNI_CAN_THAN, LUA_CHON_BUOC_TOI_DA, MA_EM_CHUA_RO, TRAN_BUOC_SAI_NGAY, canThanTu, damBaoBangCanThan, ghiBuocSai, luaChonBuocSai, nhanMocDuyTri, phanCanThanChoTraLoi, sEmDeXet, tenBuocChoEm,
} from '../server/src/omni-can-than'
import { RESET_HOA2 } from '../server/src/reset-hoa2'
import { RESET_2109 } from '../server/src/reset-toan-app'
import { HOM_NAY, T_SANG, lam, lucVn, taoKhoOmni, themChienDich } from './omni-3-ke-hoach-chung'

const hs = (sEm: number, nVung: number): Pick<HoSoOmniEm, 'sEm' | 'nVung'> => ({ sEm, nVung })

describe('canThan — chỉ true khi OMNI bật ∧ Sơ ý (số em thấy ở Sảnh: đủ dữ liệu) > 0,07', () => {
  it('ngưỡng = C_SO_Y (0,07), đủ dữ liệu = S_AO (10) lượt ở câu đã vững', () => {
    expect(THAM_SO_OMNI.C_SO_Y).toBe(0.07)
    expect(THAM_SO_OMNI.S_AO).toBe(10)
    expect(THAM_SO_OMNI.CAN_THAN_HE_SO_MOC).toBe(0.7)
  })
  it('OMNI tắt ⇒ false dù Sơ ý rất cao', () => {
    expect(canThanTu(false, hs(0.5, 100))).toBe(false)
  })
  it('Sơ ý ≤ ngưỡng ⇒ false (kể cả đúng bằng 0,07); > ngưỡng ⇒ true', () => {
    expect(canThanTu(true, hs(0.06, 40))).toBe(false)
    expect(canThanTu(true, hs(0.07, 40))).toBe(false)
    expect(canThanTu(true, hs(0.0701, 40))).toBe(true)
    expect(canThanTu(true, hs(0.12, 40))).toBe(true)
  })
  it('chưa đủ dữ liệu (< 10 lượt vững) ⇒ false: prior 0,08 đã lớn hơn 0,07, em mới KHÔNG bị coi là sơ ý; hồ sơ rỗng thật cũng false', () => {
    expect(canThanTu(true, hs(0.08, 0))).toBe(false)
    expect(canThanTu(true, hs(0.3, 9))).toBe(false)
    expect(canThanTu(true, hs(0.3, 10))).toBe(true)
    expect(sEmDeXet(hs(0.3, 9))).toBeNull()
    expect(sEmDeXet(hs(0.3, 10))).toBe(0.3)
    expect(canThanTu(true, null)).toBe(false)
    expect(canThanTu(true, undefined)).toBe(false)
    expect(canThanTu(true, hs(Number.NaN, 50))).toBe(false)
  })
})

describe('(a) nhanMocDuyTri — mốc kiểm duy trì × 0,7', () => {
  it('ví dụ tính tay: [14, 30] × 0,7 = [9,8 → 10, 21]', () => {
    const moi = nhanMocDuyTri(THAM_SO_GOC, true)
    expect([...moi.mocDuyTri]).toEqual([10, 21])
    expect(moi.cachSaiCuoi).toBe(THAM_SO_GOC.cachSaiCuoi) // chỉ đổi mốc
    expect(moi.gioDocLoiGiai).toBe(THAM_SO_GOC.gioDocLoiGiai)
  })
  it('canThan sai (OMNI tắt hoặc Sơ ý ≤ ngưỡng) ⇒ trả CHÍNH tham số vào — mốc y hôm nay', () => {
    expect(nhanMocDuyTri(THAM_SO_GOC, false)).toBe(THAM_SO_GOC)
    expect([...THAM_SO_GOC.mocDuyTri]).toEqual([14, 30]) // không bị sửa tại chỗ
  })
  it('tham số riêng của em: [7, 28] ⇒ [5, 20]; [20, 90] ⇒ [14, 63]; mốc rất nhỏ giữ sàn 3 ngày và tăng dần', () => {
    const riengA: ThamSoLuat = { ...THAM_SO_GOC, mocDuyTri: [7, 28] }
    expect([...nhanMocDuyTri(riengA, true).mocDuyTri]).toEqual([5, 20])
    expect([...nhanMocDuyTri({ ...THAM_SO_GOC, mocDuyTri: [20, 90] }, true).mocDuyTri]).toEqual([14, 63])
    expect([...nhanMocDuyTri({ ...THAM_SO_GOC, mocDuyTri: [3, 4] }, true).mocDuyTri]).toEqual([3, 4]) // round(2,1)→sàn 3; round(2,8)=3 ≤ 3 ⇒ 4
    expect(nhanMocDuyTri({ ...THAM_SO_GOC, mocDuyTri: [] }, true).mocDuyTri).toEqual([])
  })
})

describe('(c) lựa chọn thẻ "Sai vì bước nào?"', () => {
  const TEN = new Map<string, { ten?: string | null }>([
    ['nen:ti_le_mol', { ten: 'Tính theo tỉ lệ mol' }], ['nen:lap_pt', { ten: 'Lập phương trình phản ứng' }], ['nen:khoi_luong', { ten: 'Đổi sang khối lượng' }],
    ['dang:ES.A', { ten: 'Thuỷ phân ester' }], ['ES.A#2', { ten: 'ES.A#2' }], ['nen:ma', { ten: 'nen:ma' }], ['nen:trung', { ten: 'tính theo tỉ lệ mol' }],
  ])
  it('bước tính (nen:) trước, dạng (dang:) sau; ≤ 3; không mã nội bộ; không trùng tên', () => {
    expect(luaChonBuocSai(['dang:ES.A', 'nen:ti_le_mol', 'nen:lap_pt'], TEN)).toEqual([
      { ma: 'nen:ti_le_mol', ten: 'Tính theo tỉ lệ mol' }, { ma: 'nen:lap_pt', ten: 'Lập phương trình phản ứng' }, { ma: 'dang:ES.A', ten: 'Thuỷ phân ester' },
    ])
    expect(luaChonBuocSai(['nen:ti_le_mol', 'nen:lap_pt', 'nen:khoi_luong', 'dang:ES.A'], TEN).map((x) => x.ma)).toEqual(['nen:ti_le_mol', 'nen:lap_pt', 'nen:khoi_luong'])
    expect(luaChonBuocSai(['nen:ti_le_mol', 'nen:lap_pt', 'nen:khoi_luong', 'dang:ES.A'], TEN)).toHaveLength(LUA_CHON_BUOC_TOI_DA)
    expect(luaChonBuocSai(['ES.A#2', 'nen:ma'], TEN)).toEqual([]) // tên là mã nội bộ ⇒ bỏ
    expect(luaChonBuocSai(['nen:ti_le_mol', 'nen:trung'], TEN).map((x) => x.ma)).toEqual(['nen:ti_le_mol']) // trùng tên (không phân biệt hoa/thường)
    expect(luaChonBuocSai([], TEN)).toEqual([])
    expect(luaChonBuocSai(['nen:khong_co_ten'], TEN)).toEqual([])
  })
  it('tenBuocChoEm: lọc mã nội bộ và chữ "vi kỹ năng"', () => {
    expect(tenBuocChoEm('Cân bằng hệ số')).toBe('Cân bằng hệ số')
    expect(tenBuocChoEm(' nen:ti_le_mol ')).toBeNull()
    expect(tenBuocChoEm('dang:X')).toBeNull()
    expect(tenBuocChoEm('ES.A#2')).toBeNull()
    expect(tenBuocChoEm('Vi kỹ năng cân bằng')).toBeNull()
    expect(tenBuocChoEm('')).toBeNull()
    expect(tenBuocChoEm(null)).toBeNull()
  })
  it('phanCanThanChoTraLoi: không canThan ⇒ {}; canThan nhưng không chắc-mà-sai ⇒ chỉ canThan; chắc-mà-sai ⇒ kèm buocSai; tra tên lỗi ⇒ vẫn canThan, không ném', async () => {
    const tenVkn = vi.fn(async () => TEN)
    expect(await phanCanThanChoTraLoi({ canThan: false, chacMaSai: true, vkn: ['nen:ti_le_mol'], tenVkn })).toEqual({})
    expect(tenVkn).not.toHaveBeenCalled() // không canThan ⇒ không tra gì
    expect(await phanCanThanChoTraLoi({ canThan: true, chacMaSai: false, vkn: ['nen:ti_le_mol'], tenVkn })).toEqual({ canThan: true })
    expect(tenVkn).not.toHaveBeenCalled() // lượt thường ⇒ không thêm truy vấn
    expect(await phanCanThanChoTraLoi({ canThan: true, chacMaSai: true, vkn: ['nen:ti_le_mol', 'nen:ti_le_mol', 'dang:ES.A'], tenVkn }))
      .toEqual({ canThan: true, buocSai: { lua: [{ ma: 'nen:ti_le_mol', ten: 'Tính theo tỉ lệ mol' }, { ma: 'dang:ES.A', ten: 'Thuỷ phân ester' }] } })
    expect(tenVkn).toHaveBeenCalledTimes(1)
    expect(tenVkn).toHaveBeenCalledWith(['nen:ti_le_mol', 'dang:ES.A'])
    expect(await phanCanThanChoTraLoi({ canThan: true, chacMaSai: true, vkn: ['nen:ti_le_mol'], tenVkn: async () => { throw new Error('D1 lỗi') } })).toEqual({ canThan: true })
    expect(await phanCanThanChoTraLoi({ canThan: true, chacMaSai: true, vkn: [], tenVkn })).toEqual({ canThan: true })
    expect(await phanCanThanChoTraLoi({ canThan: true, chacMaSai: true, vkn: ['ES.A#2'], tenVkn: async () => TEN })).toEqual({ canThan: true }) // không tên hợp lệ ⇒ không thẻ
  })
})

describe('(c) ghi sổ riêng omni_buoc_sai (D1 thật)', () => {
  const T0 = Date.parse('2026-10-06T03:00:00Z') // 10:00 Thứ Ba 06/10 giờ VN
  it('bảng tạo lúc chạy (IF NOT EXISTS), một dòng cho mỗi (em, câu gốc, ngày)', async () => {
    expect(LENH_OMNI_CAN_THAN).toEqual(['hoa2-omni-buoc-sai'])
    const k = taoKhoOmni()
    const dem = () => Number((k.d.sql.prepare('SELECT COUNT(*) AS n FROM omni_buoc_sai').get() as { n: number }).n)
    await damBaoBangCanThan(k.env)
    expect(dem()).toBe(0)
    expect(await ghiBuocSai(k.env, 'S1', { qid: 'DH-B1-3', ma: 'nen:ti_le_mol' }, T0)).toEqual({ ok: true, daGhi: true })
    expect(k.d.sql.prepare('SELECT * FROM omni_buoc_sai').all()).toEqual([{ sbd: 'S1', qid: 'DH-B1-3', ngay: '2026-10-06', ma_vkn: 'nen:ti_le_mol', luc: new Date(T0).toISOString() }])
    // gọi lại (mạng chập chờn) hoặc bấm lần hai cùng câu cùng ngày: giữ lựa chọn đầu, không thêm dòng
    expect(await ghiBuocSai(k.env, 'S1', { qid: 'DH-B1-3', ma: 'nen:lap_pt' }, T0 + 60_000)).toEqual({ ok: true, daGhi: false })
    expect(dem()).toBe(1)
    expect((k.d.sql.prepare('SELECT ma_vkn FROM omni_buoc_sai').get() as { ma_vkn: string }).ma_vkn).toBe('nen:ti_le_mol')
    // câu song sinh / lần-trong-ngày quy về câu GỐC; "Em chưa rõ" ghi mã chua_ro; ngày khác ⇒ dòng mới; em khác ⇒ dòng mới
    expect(await ghiBuocSai(k.env, 'S1', { qid: 'DH-B1-4~ss1#2', ma: MA_EM_CHUA_RO }, T0)).toEqual({ ok: true, daGhi: true })
    expect(await ghiBuocSai(k.env, 'S1', { qid: 'DH-B1-3', ma: 'nen:lap_pt' }, T0 + 86_400_000)).toEqual({ ok: true, daGhi: true })
    expect(await ghiBuocSai(k.env, 'S2', { qid: 'DH-B1-3', ma: 'nen:lap_pt' }, T0)).toEqual({ ok: true, daGhi: true })
    expect(k.d.sql.prepare('SELECT sbd, qid, ngay, ma_vkn FROM omni_buoc_sai ORDER BY sbd, ngay, qid').all()).toEqual([
      { sbd: 'S1', qid: 'DH-B1-3', ngay: '2026-10-06', ma_vkn: 'nen:ti_le_mol' },
      { sbd: 'S1', qid: 'DH-B1-4', ngay: '2026-10-06', ma_vkn: 'chua_ro' },
      { sbd: 'S1', qid: 'DH-B1-3', ngay: '2026-10-07', ma_vkn: 'nen:lap_pt' },
      { sbd: 'S2', qid: 'DH-B1-3', ngay: '2026-10-06', ma_vkn: 'nen:lap_pt' },
    ])
  })
  it('dữ liệu lạ bị từ chối, KHÔNG ghi gì; sổ học su_kien_hoc không bị đụng', async () => {
    const k = taoKhoOmni()
    const soHoc = () => Number((k.d.sql.prepare('SELECT COUNT(*) AS n FROM su_kien_hoc').get() as { n: number }).n)
    const truoc = soHoc()
    for (const xau of [{ qid: '', ma: 'nen:x' }, { qid: "q'; DROP TABLE x;--", ma: 'nen:x' }, { qid: 'Q1', ma: '' }, { qid: 'Q1', ma: 'có dấu cách' }, { qid: 'Q1', ma: 'x'.repeat(101) }, {}])
      expect(await ghiBuocSai(k.env, 'S1', xau, T0)).toMatchObject({ ok: false })
    await damBaoBangCanThan(k.env)
    expect(Number((k.d.sql.prepare('SELECT COUNT(*) AS n FROM omni_buoc_sai').get() as { n: number }).n)).toBe(0)
    expect(soHoc()).toBe(truoc)
  })
  it('trần TRAN_BUOC_SAI_NGAY dòng/em/ngày: lệnh dồn dập không làm đầy bảng; ngày khác / em khác vẫn ghi được', async () => {
    const k = taoKhoOmni()
    const dem = (sbd: string) => Number((k.d.sql.prepare('SELECT COUNT(*) AS n FROM omni_buoc_sai WHERE sbd = ?').get(sbd) as { n: number }).n)
    for (let i = 0; i < TRAN_BUOC_SAI_NGAY; i++) expect(await ghiBuocSai(k.env, 'S1', { qid: `Q${i}`, ma: 'chua_ro' }, T0)).toEqual({ ok: true, daGhi: true })
    expect(dem('S1')).toBe(TRAN_BUOC_SAI_NGAY)
    expect(await ghiBuocSai(k.env, 'S1', { qid: 'QMOI', ma: 'chua_ro' }, T0)).toEqual({ ok: true, daGhi: false }) // quá trần ngày
    expect(dem('S1')).toBe(TRAN_BUOC_SAI_NGAY)
    expect(await ghiBuocSai(k.env, 'S1', { qid: 'QMOI', ma: 'chua_ro' }, T0 + 86_400_000)).toEqual({ ok: true, daGhi: true }) // ngày mai
    expect(await ghiBuocSai(k.env, 'S2', { qid: 'QMOI', ma: 'chua_ro' }, T0)).toEqual({ ok: true, daGhi: true }) // em khác
  })
  it('bảng mới xếp GIỮ ở cả hai job reset (học tập của em — không bao giờ bị xoá)', () => {
    expect(RESET_HOA2.bangGiu).toContain('omni_buoc_sai')
    expect(RESET_HOA2.bangXoa).not.toContain('omni_buoc_sai')
    expect(RESET_2109.bangGiu).toContain('omni_buoc_sai')
    expect(RESET_2109.bangXoa).not.toContain('omni_buoc_sai')
  })
})

// ---------------------------------------------------------------- (a) trên D1: câu từng sai đã ĐÓNG lỗi, mốc duy trì theo em
/**
 * S1 làm câu DH-B1-0: sai 29/09, đúng 02/10, đúng 03/10 ⇒ ĐÓNG lỗi ngày 03/10 (2 ngày đúng, cách lần sai cuối 4 ngày ≥ 3, kho không có song sinh ⇒ miễn).
 * Mốc chuẩn [14, 30]: kiểm lại 17/10, rồi 02/11. Em canThan (mốc × 0,7 = [10, 21]): 13/10, rồi 24/10.
 */
async function dungDaDongLoi(them: { lanKiem?: string } = {}) {
  const k = taoKhoOmni()
  const b1 = k.qids('DH-B1')
  themChienDich(k.d, { id: 'CD1', maDe: ['DH-B1'], qids: b1, sbd: ['S1', 'S2'], hanNop: '2026-10-07', taoLuc: '2026-09-21T01:00:00.000Z', theLuc: 40 }) // giao TRƯỚC lần sai đầu (câu chiến dịch chỉ tính lần làm từ lúc giao)
  for (const sbd of ['S1', 'S2']) {
    await lam(k.env, sbd, b1[0]!, lucVn('2026-09-29'), false)
    await lam(k.env, sbd, b1[0]!, lucVn('2026-10-02'), true)
    await lam(k.env, sbd, b1[0]!, lucVn('2026-10-03'), true)
    if (them.lanKiem) await lam(k.env, sbd, b1[0]!, lucVn(them.lanKiem), true)
  }
  return { k, qid: b1[0]! }
}
const loiCua = (h: Awaited<ReturnType<typeof docHoSo2>>, qid: string) => h.loiV2.get(qid)!

describe('(a) docHoSo2 / layKeHoachHomNay — mốc duy trì theo em, CHỈ khi OMNI bật ∧ canThan (D1 thật)', () => {
  beforeEach(() => { gia.omni = new Set(); gia.sEm = {} })

  it('OMNI tắt, hoặc Sơ ý ≤ 0,07, hoặc chưa đủ dữ liệu ⇒ mốc [14, 30] y hôm nay (hẹn kiểm lại 17/10)', async () => {
    const { k, qid } = await dungDaDongLoi()
    // OMNI tắt: dù hồ sơ giả có Sơ ý cao
    gia.sEm.S1 = { sEm: 0.5, nVung: 60 }
    const tat = await layKeHoachHomNay(k.env, 'S1', T_SANG)
    expect(loiCua(tat.hs, qid)).toMatchObject({ trangThai: 'dong', dongNgay: '2026-10-03', mocDuyTri: 0, denHan: '2026-10-17' })
    expect(tat.hs.tt.get(qid)!.henOn).toBe('2026-10-17')
    // OMNI bật nhưng Sơ ý thấp / đúng bằng ngưỡng / chưa đủ dữ liệu
    gia.omni = new Set(['S1', 'S2'])
    for (const [sbd, v] of [['S1', { sEm: 0.05, nVung: 60 }], ['S2', { sEm: 0.07, nVung: 60 }]] as const) {
      gia.sEm[sbd] = v
      const r = await layKeHoachHomNay(k.env, sbd, T_SANG)
      expect(loiCua(r.hs, qid).denHan, sbd).toBe('2026-10-17')
    }
    const k2 = await dungDaDongLoi()
    gia.omni = new Set(['S1'])
    gia.sEm.S1 = { sEm: 0.4, nVung: 9 }
    expect(loiCua((await layKeHoachHomNay(k2.k.env, 'S1', T_SANG)).hs, k2.qid).denHan).toBe('2026-10-17')
  })

  it('OMNI bật ∧ Sơ ý > 0,07 (đủ dữ liệu) ⇒ mốc × 0,7: hẹn kiểm lại 03/10 + 10 = 13/10 (thay vì 17/10)', async () => {
    const { k, qid } = await dungDaDongLoi()
    gia.omni = new Set(['S1'])
    gia.sEm.S1 = { sEm: 0.12, nVung: 30 }
    const r = await layKeHoachHomNay(k.env, 'S1', T_SANG)
    expect(loiCua(r.hs, qid)).toMatchObject({ trangThai: 'dong', dongNgay: '2026-10-03', mocDuyTri: 0, denHan: '2026-10-13' })
    expect(r.hs.tt.get(qid)!.henOn).toBe('2026-10-13')
    // em khác cùng D1, cờ OMNI không áp ⇒ y như cũ
    const em2 = await layKeHoachHomNay(k.env, 'S2', T_SANG)
    expect(loiCua(em2.hs, qid).denHan).toBe('2026-10-17')
  })

  it('mốc thứ hai: lượt kiểm đúng ở ngày thứ 10 ĐƯỢC TÍNH khi canThan (hẹn tiếp 03/10 + 21 = 24/10); mốc chuẩn chưa tính (ngày 10 < 14) ⇒ vẫn hẹn 17/10', async () => {
    const { k, qid } = await dungDaDongLoi({ lanKiem: '2026-10-13' })
    const ngay = '2026-10-14'
    const chuan = await docHoSo2(k.env, 'S1', ngay)
    expect(loiCua(chuan, qid)).toMatchObject({ trangThai: 'dong', mocDuyTri: 0, denHan: '2026-10-17' })
    const can = await docHoSo2(k.env, 'S1', ngay, Promise.resolve(true), Promise.resolve(true))
    expect(loiCua(can, qid)).toMatchObject({ trangThai: 'dong', mocDuyTri: 1, denHan: '2026-10-24' })
  })

  it('docHoSo2 trực tiếp: cờ canThan chỉ có tác dụng khi OMNI bật; không truyền / canThan sai / lỗi ⇒ mốc chuẩn', async () => {
    const { k, qid } = await dungDaDongLoi()
    const ngay = HOM_NAY
    const han = async (omni: boolean | undefined, can: Promise<boolean> | undefined) => loiCua(await docHoSo2(k.env, 'S1', ngay, omni === undefined ? undefined : Promise.resolve(omni), can), qid).denHan
    expect(await han(true, Promise.resolve(true))).toBe('2026-10-13')
    expect(await han(true, Promise.resolve(false))).toBe('2026-10-17')
    expect(await han(true, undefined)).toBe('2026-10-17')
    expect(await han(true, Promise.reject(new Error('hồ sơ lỗi')))).toBe('2026-10-17')
    expect(await han(false, Promise.resolve(true))).toBe('2026-10-17') // OMNI tắt ⇒ cờ canThan vô hiệu
    expect(await han(undefined, undefined)).toBe('2026-10-17') // chữ ký cũ ⇒ y hệt
  })

  it('kế hoạch đã chốt hôm nay: lần mở sau KHÔNG đọc hồ sơ OMNI thêm (mốc theo em chỉ áp lúc LẬP kế hoạch ngày)', async () => {
    const { k, qid } = await dungDaDongLoi()
    gia.omni = new Set(['S1'])
    gia.sEm.S1 = { sEm: 0.12, nVung: 30 }
    const dau = await layKeHoachHomNay(k.env, 'S1', T_SANG)
    expect(loiCua(dau.hs, qid).denHan).toBe('2026-10-13')
    const lai = await layKeHoachHomNay(k.env, 'S1', T_SANG + 60_000)
    expect(lai.kh.dao).toEqual(dau.kh.dao)
    expect(lai.kh.doan).toEqual(dau.kh.doan)
    expect(loiCua(lai.hs, qid).denHan).toBe('2026-10-17') // chủ ý: không đọc hồ sơ OMNI ở nhánh kế hoạch đã chốt (ngân sách D1)
  })
})
