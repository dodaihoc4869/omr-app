// @vitest-environment node
// ÔN BÀI CŨ — lớp D1 (D1 thật node:sqlite, lược đồ đủ migration) của (b) chia ĐỀU theo bài/dạng và (c) tỉ lệ theo lớp (thầy 06/10):
//   · ứng viên: trần 800 cắt CÔNG BẰNG giữa các bài (trước: bài gần nhất trước ⇒ bài xa nhất không bao giờ có mặt);
//   · thứ tự: nhóm giữ nguyên, trong nhóm các bài xen kẽ (xoay theo ngày), trong bài các dạng xen kẽ; kế hoạch ngày chọn ôn bài cũ phủ nhiều bài;
//   · công tắc `cau_hinh.on_bai_cu_deu` = {"bat":false} ⇒ y hệt cũ (tập + thứ tự); ổn định trong ngày;
//   · `cau_hinh.on_bai_cu_ti_le` (theo lớp, mặc định chung, trường sai kiểu / ngoài [0; 0,6] bị bỏ) đi vào kế hoạch ngày;
//   · KHÔNG thêm vòng D1: hai khoá đọc KÈM câu đọc nhóm cờ (cau-hinh-dem.ts), nhóm đã nóng ⇒ 0 câu cau_hinh thêm.
// Các làn khác còn là STUB ⇒ tiêm bằng vi.mock như tests/omni-3-ke-hoach-d1.test.ts: omniBat / hoSoOmniEm (omni-d1), phamViCuaEm / lopCuaEm (bai-da-day).
import { beforeEach, describe, expect, it, vi } from 'vitest'

type PhamViGia = { lop: string; maDe: Set<string>; baiTheoMaDe: Map<string, { khoaBai: string; tenBai: string; viTri: number }>; baiDaTick: { khoaBai: string; tenBai: string; viTri: number; chienDichId: string | null; tickLuc: string }[] }
const gia = vi.hoisted(() => ({ omni: new Set<string>(), phamVi: null as PhamViGia | null, lop: '12A1' }))
vi.mock('../server/src/omni-d1', async (goc) => {
  const that = await goc<typeof import('../server/src/omni-d1')>()
  return {
    ...that,
    omniBat: vi.fn(async (_env: unknown, sbd: string) => gia.omni.has(sbd)),
    omniChoSanh: vi.fn(async (_env: unknown, _sbd: string, _nowMs: number, ngu: Record<string, unknown>) => ({ bat: true, onBaiCu: ngu.onBaiCu, choBaiMoi: !!ngu.cheDoCho })),
    hoSoOmniEm: vi.fn(async (_env: unknown, sbd: string) => ({
      sbd, sEm: 0.08, nVung: 0, nSaiVung: 0, tau: 0, nTau: 0, luotHomNay: 0, cursor: '', phienBan: 'test',
      khungGio: { truoc18: { n: 0, soY: 0 }, '18_20': { n: 0, soY: 0 }, '20_22': { n: 0, soY: 0 }, '22_24': { n: 0, soY: 0 }, sau24: { n: 0, soY: 0 } }, vkn: {},
    })),
  }
})
vi.mock('../server/src/bai-da-day', async (goc) => {
  const that = await goc<typeof import('../server/src/bai-da-day')>()
  return { ...that, phamViCuaEm: vi.fn(async () => gia.phamVi), lopCuaEm: vi.fn(async () => gia.lop) }
})

import { chanDoanEm, docCoHoa2, docHoSo2, layKeHoachHomNay, TRAN_UNG_VIEN_ON_BAI_CU, type HoSo2 } from '../server/src/srs2-d1'
import { xoaDemCauHinh } from '../server/src/cau-hinh-dem'
import { HOM_NAY, lam, lucVn, T_SANG, taoKhoOmni, themChienDich, type KhoOmni } from './omni-3-ke-hoach-chung'

/** Phạm vi giả: mỗi bài = một tờ gốc `DH-B<n>` (vị trí n); bài `tick` có chiến dịch. */
function phamViBai(...bai: { ma: string; viTri: number; tick?: string }[]): PhamViGia {
  return {
    lop: '12A1',
    maDe: new Set(bai.map((b) => b.ma)),
    baiTheoMaDe: new Map(bai.map((b) => [b.ma, { khoaBai: b.ma, tenBai: `Bài ${b.ma}`, viTri: b.viTri }])),
    baiDaTick: bai.filter((b) => b.tick).map((b) => ({ khoaBai: b.ma, tenBai: `Bài ${b.ma}`, viTri: b.viTri, chienDichId: b.tick!, tickLuc: '2026-10-01T01:00:00.000Z' })),
  }
}
const baiCua = (qid: string): string => qid.split('-').slice(0, 2).join('-') // 'DH-B3-17' → 'DH-B3'
const demTheoBai = (ds: readonly string[]): Record<string, number> => {
  const r: Record<string, number> = {}
  for (const q of ds) r[baiCua(q)] = (r[baiCua(q)] ?? 0) + 1
  return r
}
const soBaiKhacNhau = (ds: readonly string[]): number => new Set(ds.map(baiCua)).size
const dat = (k: KhoOmni, khoa: string, giaTri: string) => {
  k.d.sql.prepare('INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri').run(khoa, giaTri, 'x')
  xoaDemCauHinh(k.env) // như lệnh thầy ghi cờ: isolate này thấy ngay
}

/** Lớp 12A1 đã tick Bài 6 hôm nay (CD6, hạn 11/10, thể lực 40) và coi Bài 1–5 là bài đã dạy; mỗi bài cũ 200 câu (5 × 200 = 1 000 > trần 800). */
function dungLop(soCauBai = 200): KhoOmni {
  const k = taoKhoOmni({ 'DH-B1': soCauBai, 'DH-B2': soCauBai, 'DH-B3': soCauBai, 'DH-B4': soCauBai, 'DH-B5': soCauBai, 'DH-B6': 20 })
  gia.omni = new Set(['S1'])
  gia.phamVi = phamViBai({ ma: 'DH-B1', viTri: 1 }, { ma: 'DH-B2', viTri: 2 }, { ma: 'DH-B3', viTri: 3 }, { ma: 'DH-B4', viTri: 4 }, { ma: 'DH-B5', viTri: 5 }, { ma: 'DH-B6', viTri: 6, tick: 'CD6' })
  themChienDich(k.d, { id: 'CD6', maDe: ['DH-B6'], qids: k.qids('DH-B6'), sbd: ['S1', 'S2', 'S3'], hanNop: '2026-10-11', taoLuc: '2026-10-05T01:00:00.000Z', theLuc: 40 })
  return k
}

beforeEach(() => {
  gia.omni = new Set()
  gia.phamVi = null
  gia.lop = '12A1'
})

describe('(b) ứng viên ôn bài cũ — cắt trần CÔNG BẰNG giữa các bài', () => {
  it('BẬT (mặc định): 5 bài × 200 câu > trần 800 ⇒ mỗi bài đúng 160 câu, bài xa nhất (Bài 1) CÓ MẶT; mỗi bài giữ 160 câu ĐẦU theo thứ tự gốc', async () => {
    const k = dungLop()
    const hs = await docHoSo2(k.env, 'S1', HOM_NAY)
    const on = hs.onBaiCu!.map((c) => c.qid)
    expect(TRAN_UNG_VIEN_ON_BAI_CU).toBe(800)
    expect(on).toHaveLength(800)
    expect(demTheoBai(on)).toEqual({ 'DH-B1': 160, 'DH-B2': 160, 'DH-B3': 160, 'DH-B4': 160, 'DH-B5': 160 })
    expect(on.filter((q) => q.startsWith('DH-B1-')).sort()).toEqual(Array.from({ length: 160 }, (_, i) => `DH-B1-${i}`).sort())
    expect(hs.omni).toEqual({ bat: true, cheDoCho: false, onBaiCuSo: 800 })
  })
  it('TẮT {"bat":false}: y hệt cũ — bài gần nhất trước, cắt 800 ⇒ Bài 5, 4, 3, 2 đủ 200 câu, Bài 1 KHÔNG bao giờ có mặt; thứ tự = bài gần nhất trước, trong bài theo thứ tự câu', async () => {
    const k = dungLop()
    dat(k, 'on_bai_cu_deu', '{"bat":false}')
    const hs = await docHoSo2(k.env, 'S1', HOM_NAY)
    const on = hs.onBaiCu!.map((c) => c.qid)
    expect(demTheoBai(on)).toEqual({ 'DH-B5': 200, 'DH-B4': 200, 'DH-B3': 200, 'DH-B2': 200 })
    // thứ tự cũ: tờ theo vị trí giảm dần (Bài 5 → 2), mỗi tờ theo thứ tự câu trong kho (rowid) — câu hợp lệ (bỏ câu tự luận) — rồi cắt 800
    const cu = ['DH-B5', 'DH-B4', 'DH-B3', 'DH-B2', 'DH-B1'].flatMap((b) => k.qids(b)).slice(0, 800)
    expect(on).toEqual(cu)
    expect(on.some((q) => q.startsWith('DH-B1-'))).toBe(false)
  })
  it('chưa chạm trần: cùng TẬP câu ở cả hai chế độ (chỉ khác thứ tự)', async () => {
    const k = dungLop(60) // 5 × 60 = 300 < 800 (Bài 1 có thêm 1 câu tự luận ⇒ bị bỏ)
    const bat = (await docHoSo2(k.env, 'S1', HOM_NAY)).onBaiCu!.map((c) => c.qid)
    dat(k, 'on_bai_cu_deu', '{"bat":false}')
    const tat = (await docHoSo2(k.env, 'S1', HOM_NAY)).onBaiCu!.map((c) => c.qid)
    expect(bat).toHaveLength(300)
    expect([...bat].sort()).toEqual([...tat].sort())
    expect(bat).not.toEqual(tat)
    // TẮT = bài gần nhất trước; BẬT = bài xen kẽ
    expect(tat.slice(0, 60).every((q) => q.startsWith('DH-B5-'))).toBe(true)
    expect(soBaiKhacNhau(bat.slice(0, 5))).toBe(5)
  })
  it('công tắc hỏng / sai kiểu ⇒ BẬT (chỉ {"bat":false} mới tắt)', async () => {
    for (const giaTri of ['hỏng không phải JSON', '{"bat":"false"}', '{"bat":0}', '[]', 'null']) {
      const k = dungLop()
      dat(k, 'on_bai_cu_deu', giaTri)
      const on = (await docHoSo2(k.env, 'S1', HOM_NAY)).onBaiCu!.map((c) => c.qid)
      expect(demTheoBai(on)['DH-B1'], giaTri).toBe(160)
    }
  })
})

describe('(b) thứ tự ôn bài cũ — nhóm giữ nguyên, bài xen kẽ, dạng xen kẽ; tất định', () => {
  it('mọi tiền tố độ dài k phủ min(k, 5) bài khác nhau; trong mỗi bài các dạng xen kẽ vòng tròn', async () => {
    const k = dungLop()
    const on = (await docHoSo2(k.env, 'S1', HOM_NAY)).onBaiCu!.map((c) => c.qid)
    const thay = new Set<string>()
    on.forEach((q, i) => { thay.add(baiCua(q)); expect(thay.size, `tiền tố ${i + 1}`).toBe(Math.min(i + 1, 5)) })
    // dạng của câu = `${tờ}.D${i % 3}` (fixture) ⇒ trong MỘT bài, mỗi 3 câu liên tiếp của bài ấy là ba dạng khác nhau
    for (const b of ['DH-B1', 'DH-B2', 'DH-B3', 'DH-B4', 'DH-B5']) {
      const cua = on.filter((q) => q.startsWith(`${b}-`))
      const dang = cua.map((q) => Number(q.slice(b.length + 1)) % 3)
      for (let i = 0; i + 2 < Math.min(cua.length, 150); i += 3) expect(new Set(dang.slice(i, i + 3)).size, `${b} cụm ${i / 3}`).toBe(3)
    }
  })
  it('nhóm "đã gặp tới lịch" đứng TRƯỚC nhóm "chưa gặp": câu bài cũ em đã làm đúng và tới lịch ôn lên đầu, rồi mới xen kẽ bài', async () => {
    const k = dungLop(60)
    // Em làm ĐÚNG một lần 9 ngày trước ba câu Phần I (không phải câu Phần II / III ⇒ chưa thành thạo, hẹn ôn đã tới) ở Bài 1, 3, 5
    const chon = (b: string) => k.qids(b).find((q) => { const i = Number(q.split('-').pop()); return i % 4 === 1 && i % 5 !== 4 && i % 7 !== 6 })! // Phần I, mức Thông hiểu
    const daGap = [chon('DH-B1'), chon('DH-B3'), chon('DH-B5')]
    for (const q of daGap) await lam(k.env, 'S1', q, lucVn('2026-09-26'), true)
    const hs = await docHoSo2(k.env, 'S1', HOM_NAY)
    const on = hs.onBaiCu!.map((c) => c.qid)
    for (const q of daGap) { expect(on, q).toContain(q); expect(hs.tt.get(q)!.laMoi, q).toBe(false); expect(hs.tt.get(q)!.henOn! <= HOM_NAY, q).toBe(true) }
    expect(on.slice(0, 3).sort()).toEqual([...daGap].sort()) // nhóm 0 trước
    expect(soBaiKhacNhau(on.slice(3, 8))).toBe(5) // rồi nhóm "chưa gặp": 5 câu liền nhau phủ 5 bài
  })
  it('ổn định trong ngày (hai lần đọc cùng ngày y hệt) và kế hoạch đã chốt không đổi; sang ngày khác: cùng tập, bài đứng đầu xoay', async () => {
    const k = dungLop()
    const a = (await docHoSo2(k.env, 'S1', HOM_NAY)).onBaiCu!.map((c) => c.qid)
    const b = (await docHoSo2(k.env, 'S1', HOM_NAY)).onBaiCu!.map((c) => c.qid)
    expect(b).toEqual(a)
    const kh1 = (await layKeHoachHomNay(k.env, 'S1', T_SANG)).kh
    const kh2 = (await layKeHoachHomNay(k.env, 'S1', T_SANG + 3_600_000)).kh
    expect(kh2.onBaiCu).toEqual(kh1.onBaiCu)
    expect(kh2.dao).toEqual(kh1.dao)
    const ngayKhac = (await docHoSo2(k.env, 'S1', '2026-10-06')).onBaiCu!.map((c) => c.qid)
    expect([...ngayKhac].sort()).toEqual([...a].sort())
    expect(baiCua(ngayKhac[0]!)).not.toBe(baiCua(a[0]!))
  })
})

describe('(b) kế hoạch ngày — ôn bài cũ phủ nhiều bài (trần ⌊40 × 0,2⌋ = 8 câu, không đổi)', () => {
  it('BẬT: 8 câu ôn bài cũ hôm nay thuộc 5 bài khác nhau; TẮT: cả 8 câu đều của Bài 5 (bài gần nhất)', async () => {
    const k = dungLop()
    const bat = (await layKeHoachHomNay(k.env, 'S1', T_SANG)).kh.onBaiCu!
    expect(bat).toHaveLength(8) // trần = ⌊thể lực × tỉ lệ⌋ — giữ nguyên
    expect(soBaiKhacNhau(bat)).toBe(5)
    const k2 = dungLop()
    dat(k2, 'on_bai_cu_deu', '{"bat":false}')
    const tat = (await layKeHoachHomNay(k2.env, 'S1', T_SANG)).kh.onBaiCu!
    expect(tat).toHaveLength(8)
    expect(soBaiKhacNhau(tat)).toBe(1)
    expect(tat.every((q) => q.startsWith('DH-B5-'))).toBe(true)
  })
  it('giữ nguyên thứ tự ưu tiên: nợ / câu mới / củng cố / duy trì đi trước ôn bài cũ; câu tự luận, câu khác khối không vào ôn bài cũ', async () => {
    const k = dungLop()
    const { kh, hs } = await layKeHoachHomNay(k.env, 'S1', T_SANG)
    const cd6 = new Set(k.qids('DH-B6'))
    const moi = [...kh.dao, ...kh.doan].filter((q) => cd6.has(q.split('~')[0]!))
    expect(moi.length).toBeGreaterThan(0) // câu mới của bài đang luyện vẫn có chỗ
    expect(kh.onBaiCu!.every((q) => !cd6.has(q))).toBe(true) // ôn bài cũ không lấy câu chiến dịch đang chạy
    expect(hs.onBaiCu!.some((c) => c.qid === 'DH-B1-TL')).toBe(false) // câu tự luận không bao giờ vào
  })
  it('KHÔNG thêm vòng D1: nhóm cờ đã nóng ⇒ đọc công tắc + tỉ lệ ôn bài cũ = 0 câu cau_hinh; nhóm lạnh ⇒ đúng MỘT câu đọc nhóm chứa cả hai khoá', async () => {
    const k = dungLop()
    const nhatKy: { sql: string; args: unknown[] }[] = []
    const goc = k.env.DB.prepare.bind(k.env.DB)
    k.env.DB.prepare = ((q: string) => {
      const st = goc(q) as unknown as { bind: (...a: unknown[]) => unknown }
      const dong = { sql: q, args: [] as unknown[] }
      nhatKy.push(dong)
      const bindGoc = st.bind.bind(st)
      st.bind = (...a: unknown[]) => { dong.args = a; return bindGoc(...a) }
      return st
    }) as typeof k.env.DB.prepare
    // câu cau_hinh có chứa MỘT trong hai khoá ôn bài cũ trong tham số
    const chuaKhoa = () => nhatKy.filter((x) => /FROM cau_hinh/.test(x.sql) && x.args.some((a) => a === 'on_bai_cu_deu' || a === 'on_bai_cu_ti_le'))
    // (1) nhóm LẠNH: lần đọc đầu tiên của một khoá trong nhóm (cờ Hoá 2.0) ⇒ ĐÚNG MỘT câu đọc nhóm, chứa cả hai khoá ôn bài cũ
    await docCoHoa2(k.env)
    expect(chuaKhoa()).toHaveLength(1)
    expect(chuaKhoa()[0]!.sql).toMatch(/WHERE khoa IN/)
    expect(chuaKhoa()[0]!.args).toEqual(expect.arrayContaining(['on_bai_cu_deu', 'on_bai_cu_ti_le', 'game_hoa_2']))
    // (2) nhóm NÓNG: hồ sơ + kế hoạch ngày (công tắc chia đều ở docHoSo2, tỉ lệ ở tuyChonKeHoachOmni) ⇒ KHÔNG thêm câu nào đụng hai khoá ấy
    nhatKy.length = 0
    await layKeHoachHomNay(k.env, 'S1', T_SANG)
    expect(nhatKy.some((x) => /FROM cau_hinh/.test(x.sql) && x.args.length === 1 && (x.args[0] === 'on_bai_cu_deu' || x.args[0] === 'on_bai_cu_ti_le'))).toBe(false)
    expect(chuaKhoa()).toHaveLength(0)
  })
})

describe('(c) tỉ lệ ôn bài cũ theo lớp — vào kế hoạch ngày', () => {
  /** CD6 giao 01/10 (ngày 1 của bài = 01/10 ⇒ ngày 4–5 = 04–05/10), hạn 14/10, em chưa làm gì. */
  const dungNgay = (): KhoOmni => {
    const k = taoKhoOmni({ 'DH-B1': 120, 'DH-B2': 120, 'DH-B6': 20 })
    gia.omni = new Set(['S1'])
    gia.phamVi = phamViBai({ ma: 'DH-B1', viTri: 1 }, { ma: 'DH-B2', viTri: 2 }, { ma: 'DH-B6', viTri: 6, tick: 'CD6' })
    themChienDich(k.d, { id: 'CD6', maDe: ['DH-B6'], qids: k.qids('DH-B6'), sbd: ['S1', 'S2', 'S3'], hanNop: '2026-10-14', taoLuc: '2026-10-01T01:00:00.000Z', theLuc: 40 })
    return k
  }
  const tiLeCacNgay = async (k: KhoOmni) => {
    const ra: number[] = []
    for (const ngay of ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06']) {
      const cd = (await chanDoanEm(k.env, 'S1', lucVn(ngay))) as { omni: { lapLaiSeRa: { tiLeOnBaiCu: number } } }
      ra.push(cd.omni.lapLaiSeRa.tiLeOnBaiCu)
    }
    return ra
  }
  it('vắng cấu hình ⇒ y hệt hôm nay: 20 % thường, 40 % ngày 4–5 của bài', async () => {
    const k = dungNgay()
    expect(await tiLeCacNgay(k)).toEqual([0.2, 0.2, 0.2, 0.4, 0.4, 0.2])
  })
  it('thầy đặt theo lớp: ngày thường = thuong, ngày 4–5 = cuoi; lớp khác không bị ảnh hưởng', async () => {
    const k = dungNgay()
    dat(k, 'on_bai_cu_ti_le', JSON.stringify({ lop: { '12A1': { thuong: 0.3, cuoi: 0.55 }, '12A2': { thuong: 0.6, cuoi: 0.6 } } }))
    expect(await tiLeCacNgay(k)).toEqual([0.3, 0.3, 0.3, 0.55, 0.55, 0.3])
    gia.lop = '12A9' // lớp không có dòng ⇒ hằng cũ
    expect(await tiLeCacNgay(k)).toEqual([0.2, 0.2, 0.2, 0.4, 0.4, 0.2])
    gia.lop = '12A2'
    expect(await tiLeCacNgay(k)).toEqual([0.6, 0.6, 0.6, 0.6, 0.6, 0.6])
  })
  it('mac_dinh áp cho lớp không có dòng riêng; dòng riêng đè mac_dinh; thiếu trường ⇒ lấy mac_dinh', async () => {
    const k = dungNgay()
    dat(k, 'on_bai_cu_ti_le', JSON.stringify({ mac_dinh: { thuong: 0.25, cuoi: 0.45 }, lop: { '12A1': { thuong: 0.1 } } }))
    expect(await tiLeCacNgay(k)).toEqual([0.1, 0.1, 0.1, 0.45, 0.45, 0.1])
    gia.lop = '12A7'
    expect(await tiLeCacNgay(k)).toEqual([0.25, 0.25, 0.25, 0.45, 0.45, 0.25])
  })
  it('giá trị ngoài [0; 0,6] / sai kiểu / JSON hỏng ⇒ bỏ qua, dùng mặc định (không làm hỏng kế hoạch)', async () => {
    for (const giaTri of [
      JSON.stringify({ lop: { '12A1': { thuong: 0.9, cuoi: 1 } } }),
      JSON.stringify({ lop: { '12A1': { thuong: '0.3', cuoi: null } } }),
      JSON.stringify({ lop: { '12A1': { thuong: -0.1, cuoi: 0.61 } } }),
      JSON.stringify({ lop: 'x', mac_dinh: [] }),
      'không phải JSON',
      '{}',
    ]) {
      const k = dungNgay()
      dat(k, 'on_bai_cu_ti_le', giaTri)
      expect(await tiLeCacNgay(k), giaTri).toEqual([0.2, 0.2, 0.2, 0.4, 0.4, 0.2])
    }
    // một nửa hợp lệ ⇒ giữ nửa ấy
    const k = dungNgay()
    dat(k, 'on_bai_cu_ti_le', JSON.stringify({ lop: { '12A1': { thuong: 0.35, cuoi: 2 } } }))
    expect(await tiLeCacNgay(k)).toEqual([0.35, 0.35, 0.35, 0.4, 0.4, 0.35])
  })
  it('kế hoạch ngày dùng tỉ lệ mới: trần ôn bài cũ = ⌊40 × tỉ lệ⌋ (20 % ⇒ 8; 50 % ⇒ 20; 0 % ⇒ 0)', async () => {
    const soCau = async (cauHinh: string | null): Promise<number> => {
      const k = dungLop()
      if (cauHinh) dat(k, 'on_bai_cu_ti_le', cauHinh)
      const kh = (await layKeHoachHomNay(k.env, 'S1', T_SANG)).kh // ngày 1 của CD6 (05/10) ⇒ ngày thường
      return kh.onBaiCu!.length
    }
    expect(await soCau(null)).toBe(8)
    expect(await soCau(JSON.stringify({ lop: { '12A1': { thuong: 0.5, cuoi: 0.6 } } }))).toBe(20)
    expect(await soCau(JSON.stringify({ lop: { '12A1': { thuong: 0, cuoi: 0.6 } } }))).toBe(0)
    expect(await soCau(JSON.stringify({ lop: { '12A1': { thuong: 0.9 } } }))).toBe(8) // ngoài khoảng ⇒ mặc định
  })
})

describe('đối chiếu kiểu HoSo2 cũ: công tắc TẮT không thêm khoá nào vào hồ sơ', () => {
  it('khoá của hồ sơ (Object.keys) y như nhau ở hai chế độ — công tắc chỉ đổi tập/thứ tự ôn bài cũ', async () => {
    const khoa = (hs: HoSo2) => Object.keys(hs).sort()
    const k = dungLop(60)
    const bat = await docHoSo2(k.env, 'S1', HOM_NAY)
    dat(k, 'on_bai_cu_deu', '{"bat":false}')
    const tat = await docHoSo2(k.env, 'S1', HOM_NAY)
    expect(khoa(bat)).toEqual(khoa(tat))
    expect(bat.omni).toEqual(tat.omni)
  })
})
