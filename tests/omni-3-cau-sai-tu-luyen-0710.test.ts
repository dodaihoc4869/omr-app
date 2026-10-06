// @vitest-environment node
// VIỆC (14d) 07/10 — thầy duyệt "Làm tất 123": câu SAI thuộc kho TU LUYỆN luôn vào nợ của kế hoạch Đảo/Đoàn khi OMNI bật.
// GỐC: bộ lọc phạm vi OMNI 3 ("game chỉ câu DẠY HỌC") loại luôn câu em SAI ở ca thi / Lên bảng / tự làm mà câu chỉ nằm ở tờ TU LUYỆN ⇒ câu sai không bao giờ được
// làm lại ở Đảo/Đoàn — trái nguyên tắc 02/10 "mọi câu sai phải được xử lý triệt để". LUẬT MỚI (srs2-d1 `docHoSo2`): NỢ (nguon 'no_cu', chưa đóng lỗi) có LỊCH SỬ SAI THẬT
// (ca đã công bố · Lên bảng / đầu giờ · tự làm từ 29/09; lần sai thuộc chiến dịch đã huỷ KHÔNG tính) mà câu CHỈ ở tờ TU LUYỆN ⇒ vào kế hoạch. Vẫn LỌC: duy trì (câu đã
// vững), nợ chiến dịch cũ không có lịch sử sai, câu của tờ DẠY HỌC bài CHƯA tick, ca CHƯA công bố, ôn bài cũ và câu mới. OMNI tắt ⇒ đường cũ y nguyên.
// D1 thật (node:sqlite, đủ migration); các làn khác là STUB ⇒ vi.mock như tests/omni-3-chien-dich-tu-luyen-0610.test.ts. Thư mục tờ: luật lùi — "DH-…" ⇒ DẠY HỌC, còn lại ⇒ TU LUYỆN.
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

import { docHoSo2, layKeHoachHomNay, qidGoc, xoaDemChienDich } from '../server/src/srs2-d1'
import { HOM_NAY, lam, lucVn, T_SANG, taoKhoOmni, themChienDich, type KhoOmni } from './omni-3-ke-hoach-chung'

const tatCa = (kh: { dao: string[]; doan: string[] }) => [...kh.dao, ...kh.doan].map(qidGoc)
const nguonCua = (hs: Awaited<ReturnType<typeof docHoSo2>>, q: string) => hs.cau.find((c) => c.qid === q)?.nguon
/** KHO-C: TU LUYỆN NGOÀI mọi chiến dịch (8 câu) · KHO-A: TU LUYỆN làm chiến dịch giao tay · DH-B1: bài ĐÃ tick · DH-B3: DẠY HỌC bài CHƯA tick (mặc định 8 câu). */
function dungKho(): KhoOmni {
  const k = taoKhoOmni({ 'KHO-A': 6, 'KHO-C': 8, 'DH-B1': 10 })
  gia.omni = new Set(['S1'])
  gia.phamVi = null
  gia.dangVung = []
  return k
}
/** Lớp ĐÃ tick bài DH-B1 (phạm vi chỉ có DH-B1): DH-B3 nằm NGOÀI phạm vi. */
function lopDaTickB1(): PhamViGia {
  return {
    lop: '12A1', maDe: new Set(['DH-B1']), baiTheoMaDe: new Map([['DH-B1', { khoaBai: 'DH-B1', tenBai: 'Bài 1', viTri: 1 }]]),
    baiDaTick: [{ khoaBai: 'DH-B1', tenBai: 'Bài 1', viTri: 1, chienDichId: null, tickLuc: '2026-10-01T01:00:00.000Z' }],
  }
}
/** Ca C1 (đã đóng) + một lần em S1 làm SAI câu `qid` trong ca ngày `ngay`. `congBo`: 'ngay' = đã công bố · 'khong' = chưa. */
function saiTrongCa(k: KhoOmni, qid: string, congBo: 'ngay' | 'khong', ngay = '2026-10-02'): void {
  k.d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,lop,cong_bo,thoi_gian_phut,cap_nhat_luc) VALUES('C1','KT','dong','thi','12',?,45,'x')").run(congBo)
  k.d.sql.prepare("INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn) VALUES (?,?,?,'thi','C1',1,0,30,?,?)").run(`thi|C1|S1|${qid}`, 'S1', qid, `${ngay}T02:30:00.000Z`, ngay)
}

beforeEach(() => { gia.omni = new Set(); gia.phamVi = null; gia.dangVung = [] })

describe('(14d) NỢ câu SAI chỉ ở tờ TU LUYỆN vào kế hoạch khi OMNI bật', () => {
  it('tự làm SAI (từ 29/09) câu TU LUYỆN ngoài mọi chiến dịch ⇒ vào `cau` là nợ cũ — lớp CHƯA tick bài', async () => {
    const k = dungKho()
    await lam(k.env, 'S1', 'KHO-C-0', lucVn('2026-10-02'), false)
    const hs = await docHoSo2(k.env, 'S1', HOM_NAY)
    expect(nguonCua(hs, 'KHO-C-0')).toBe('no_cu')
    expect(hs.tt.get('KHO-C-0')?.thanhThao).toBe(false)
    expect(hs.meta.has('KHO-C-0')).toBe(true)
  })
  it('cùng câu, lớp ĐÃ tick bài khác (phạm vi chỉ DH-B1) ⇒ vẫn vào', async () => {
    const k = dungKho()
    gia.phamVi = lopDaTickB1()
    await lam(k.env, 'S1', 'KHO-C-1', lucVn('2026-10-02'), false)
    const hs = await docHoSo2(k.env, 'S1', HOM_NAY)
    expect(nguonCua(hs, 'KHO-C-1')).toBe('no_cu')
  })
  it('SAI khi Lên bảng ⇒ vào (nguồn 2 — sổ nợ tại lớp)', async () => {
    const k = dungKho()
    await lam(k.env, 'S1', 'KHO-C-2', lucVn('2026-10-02'), false, { nguon: 'len_bang', maNguon: 'buoi-1' })
    const hs = await docHoSo2(k.env, 'S1', HOM_NAY)
    expect(hs.qidSaiTaiLop?.has('KHO-C-2')).toBe(true)
    expect(nguonCua(hs, 'KHO-C-2')).toBe('no_cu')
  })
  it('SAI trong ca ĐÃ công bố ⇒ vào (nguồn 3 — ca_sai); ca CHƯA công bố ⇒ KHÔNG vào (không lộ câu thi)', async () => {
    const k = dungKho()
    saiTrongCa(k, 'KHO-C-3', 'ngay')
    const hs = await docHoSo2(k.env, 'S1', HOM_NAY)
    expect(hs.qidCaSai?.has('KHO-C-3')).toBe(true)
    expect(nguonCua(hs, 'KHO-C-3')).toBe('no_cu')
    const k2 = dungKho()
    saiTrongCa(k2, 'KHO-C-3', 'khong')
    const hs2 = await docHoSo2(k2.env, 'S1', HOM_NAY)
    expect(hs2.cau.some((c) => c.qid === 'KHO-C-3')).toBe(false)
  })
  it('ca ĐÃ công bố / Lên bảng sai TRƯỚC 29/09: nguồn 2–3 không có mốc sàn nên vẫn là nợ ⇒ vẫn vào (sổ tự làm từ 29/09 không thấy lần sai này)', async () => {
    const k = dungKho()
    saiTrongCa(k, 'KHO-C-3', 'ngay', '2026-09-27')
    await lam(k.env, 'S1', 'KHO-C-2', lucVn('2026-09-27'), false, { nguon: 'len_bang', maNguon: 'buoi-0' })
    const hs = await docHoSo2(k.env, 'S1', HOM_NAY)
    expect(hs.qidCaSai?.has('KHO-C-3')).toBe(true)
    expect(hs.qidSaiTaiLop?.has('KHO-C-2')).toBe(true)
    expect(hs.qidSaiV2?.has('KHO-C-3') || hs.qidSaiV2?.has('KHO-C-2')).toBeFalsy() // tiền đề: nguồn tự làm (từ 29/09) KHÔNG kéo hai câu này
    expect(nguonCua(hs, 'KHO-C-3')).toBe('no_cu')
    expect(nguonCua(hs, 'KHO-C-2')).toBe('no_cu')
  })
  it('câu DẠY HỌC của bài CHƯA tick: em sai vẫn bị lọc (bộ lọc bài chưa tick giữ nguyên); câu DẠY HỌC bài đã tick vẫn vào', async () => {
    const k = dungKho()
    gia.phamVi = lopDaTickB1()
    await lam(k.env, 'S1', 'DH-B3-0', lucVn('2026-10-02'), false)
    await lam(k.env, 'S1', 'DH-B1-0', lucVn('2026-10-02'), false)
    const hs = await docHoSo2(k.env, 'S1', HOM_NAY)
    expect(hs.cau.some((c) => c.qid === 'DH-B3-0')).toBe(false)
    expect(hs.tt.has('DH-B3-0')).toBe(true) // vẫn có trạng thái để "Câu đã làm" hiện đủ
    expect(nguonCua(hs, 'DH-B1-0')).toBe('no_cu')
  })
  it('câu có mặt ở CẢ tờ TU LUYỆN lẫn tờ DẠY HỌC bài chưa tick ⇒ KHÔNG phải "chỉ ở TU LUYỆN": vẫn lọc', async () => {
    const k = dungKho()
    gia.phamVi = lopDaTickB1()
    // KHO-C-5 sao chép sang tờ DH-B3 (bài chưa tick): câu thuộc bài chưa dạy ⇒ không vào kế hoạch dù em sai
    k.d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) SELECT ?, qid, version, content_group, dang, json FROM game_v2_question WHERE qid = ?').run('DH-B3', 'KHO-C-5')
    await lam(k.env, 'S1', 'KHO-C-5', lucVn('2026-10-02'), false)
    await lam(k.env, 'S1', 'KHO-C-6', lucVn('2026-10-02'), false) // đối chứng: câu chỉ ở KHO-C vẫn vào
    const hs = await docHoSo2(k.env, 'S1', HOM_NAY)
    expect(hs.cau.some((c) => c.qid === 'KHO-C-5')).toBe(false)
    expect(nguonCua(hs, 'KHO-C-6')).toBe('no_cu')
  })
  it('câu TU LUYỆN em đã SỬA XONG (2 lượt đúng khác ngày, cách lần sai ≥ 3 ngày ⇒ đóng lỗi) ⇒ KHÔNG vào: duy trì vẫn lọc; câu mới sai hôm nay vẫn vào', async () => {
    const k = dungKho()
    await lam(k.env, 'S1', 'KHO-C-0', lucVn('2026-09-29'), false)
    await lam(k.env, 'S1', 'KHO-C-0', lucVn('2026-09-30'), true)
    await lam(k.env, 'S1', 'KHO-C-0', lucVn('2026-10-02'), true)
    await lam(k.env, 'S1', 'KHO-C-1', lucVn('2026-10-04'), false)
    const hs = await docHoSo2(k.env, 'S1', HOM_NAY)
    expect(hs.tt.get('KHO-C-0')?.thanhThao).toBe(true) // tiền đề: đã đóng lỗi
    expect(hs.cau.some((c) => c.qid === 'KHO-C-0')).toBe(false)
    expect(nguonCua(hs, 'KHO-C-1')).toBe('no_cu')
  })
  it('nợ của chiến dịch CŨ đã đóng, em chỉ sai TRƯỚC 29/09 (không có lịch sử sai theo luật 29/09) ⇒ vẫn lọc như đặc tả OMNI 3', async () => {
    const k = dungKho()
    themChienDich(k.d, { id: 'CDC', maDe: ['KHO-C'], qids: k.qids('KHO-C'), sbd: ['S1'], hanNop: '2026-09-30', taoLuc: '2026-09-25T01:00:00.000Z', trangThai: 'da_dong' })
    await lam(k.env, 'S1', 'KHO-C-2', lucVn('2026-09-27'), false)
    const hs = await docHoSo2(k.env, 'S1', HOM_NAY)
    expect(hs.cau.some((c) => c.qid === 'KHO-C-2')).toBe(false)
  })
  it('lần sai nằm trong chiến dịch đã HUỶ (thu hồi) ⇒ KHÔNG tính là lịch sử sai, dù câu còn nằm ở một chiến dịch cũ khác', async () => {
    const k = dungKho()
    themChienDich(k.d, { id: 'CDC', maDe: ['KHO-C'], qids: k.qids('KHO-C'), sbd: ['S1'], hanNop: '2026-09-30', taoLuc: '2026-09-25T01:00:00.000Z', trangThai: 'da_dong' })
    themChienDich(k.d, { id: 'CDH', maDe: ['KHO-C'], qids: k.qids('KHO-C'), sbd: ['S1'], hanNop: '2026-10-12', taoLuc: '2026-09-29T02:00:00.000Z', trangThai: 'da_huy' })
    // chiến dịch đã huỷ chỉ được đọc khi có `dong_luc` ≥ 29/09 (srs2-d1 `docMoiChienDich`) — `gvChienDich` huỷ luôn ghi mốc này
    k.d.sql.prepare("UPDATE chien_dich SET dong_luc = ? WHERE id = 'CDH'").run('2026-10-03T01:00:00.000Z')
    xoaDemChienDich()
    await lam(k.env, 'S1', 'KHO-C-3', lucVn('2026-10-02'), false) // sai SAU khi được giao chiến dịch đã huỷ ⇒ thu hồi
    const hs = await docHoSo2(k.env, 'S1', HOM_NAY)
    expect(hs.cau.some((c) => c.qid === 'KHO-C-3')).toBe(false)
  })
  it('KẾ HOẠCH NGÀY: nợ TU LUYỆN vào Đảo/Đoàn cùng câu chiến dịch', async () => {
    const k = dungKho()
    themChienDich(k.d, { id: 'CDT', maDe: ['KHO-A'], qids: k.qids('KHO-A'), sbd: ['S1'], hanNop: '2026-10-12', taoLuc: '2026-09-29T02:00:00.000Z', theLuc: 91 })
    await lam(k.env, 'S1', 'KHO-C-0', lucVn('2026-10-02'), false)
    await lam(k.env, 'S1', 'KHO-C-4', lucVn('2026-10-03'), false, { nguon: 'len_bang', maNguon: 'buoi-2' })
    const { kh } = await layKeHoachHomNay(k.env, 'S1', T_SANG)
    const ds = tatCa(kh)
    expect(ds).toContain('KHO-C-0')
    expect(ds).toContain('KHO-C-4')
    expect(ds.filter((q) => q.startsWith('KHO-A-')).length).toBeGreaterThan(0) // câu chiến dịch vẫn vào
    expect(ds.some((q) => q.startsWith('KHO-C-') && q !== 'KHO-C-0' && q !== 'KHO-C-4')).toBe(false) // câu TU LUYỆN em chưa sai: không vào
  })
  it('OMNI TẮT ⇒ đường cũ y nguyên: mọi câu sai đều vào nợ như trước, không bộ lọc', async () => {
    const k = dungKho()
    gia.omni = new Set()
    await lam(k.env, 'S1', 'KHO-C-0', lucVn('2026-10-02'), false)
    await lam(k.env, 'S1', 'DH-B3-0', lucVn('2026-10-02'), false)
    const hs = await docHoSo2(k.env, 'S1', HOM_NAY)
    expect(nguonCua(hs, 'KHO-C-0')).toBe('no_cu')
    expect(nguonCua(hs, 'DH-B3-0')).toBe('no_cu')
  })
})
