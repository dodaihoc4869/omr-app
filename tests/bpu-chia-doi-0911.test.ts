// @vitest-environment node
// Bình Phản Ứng 09/11 — (1) CHIA ĐỘI theo số em CÓ MẶT + NĂNG LỰC (thầy: «dưới 12 học sinh thì tự động chia 2 đội, từ học sinh thứ 13 trở lên lập tức
// chia thành 4 đội … Chia thật công bằng dựa trên năng lực»); (2) RỜI MÀN không trừ kJ, «đang rời» `roiNay` cho bảng báo động viền đỏ.
// Luật thuần: src/lib/bpu/phong.ts; máy chủ đọc năng lực: server/src/phong-binh-phan-ung.ts (`docNangLucBpu`, `gvBpuMo`).
import { describe, expect, it } from 'vitest'
import {
  KJ, chiaDoi, diemDoi, moDapAn, moLuot, nhanTra, roiMan, taoPhong, tongNangLuc, vaoLop, veMan, viewBang, viewEm, type TrangThaiPhong,
} from '../src/lib/bpu/phong'
import { docNangLucBpu, gvBpuMo, nangLucTuSo } from '../server/src/phong-binh-phan-ung'
import { taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'

const T0 = Date.parse('2026-11-09T12:00:00Z')
const chamSo = (a: string, b: string) => a === b
const cau = { qid: 'q1', phan: 'I' as const, tuLuan: false, cau: {}, dung: 'B', hanGiay: 60 }
/** Năng lực giả tất định, trải 0,05..0,95. */
const nlGia = (i: number) => Math.round((0.05 + ((i * 37) % 19) / 20) * 1000) / 1000
const lop = (n: number, coMat = 0) => Array.from({ length: n }, (_, i) => ({ sbd: `S${String(i + 1).padStart(2, '0')}`, ten: `Em ${i + 1}`, coMat: i < coMat, luc: T0 + i, nangLuc: nlGia(i) }))
const coMat = (st: TrangThaiPhong) => st.ds.filter((e) => e.vao)
const demDoi = (st: TrangThaiPhong) => Array.from({ length: st.soDoi ?? 4 }, (_, d) => coMat(st).filter((e) => e.doi === d).length)
const tongDoi = (st: TrangThaiPhong) => Array.from({ length: st.soDoi ?? 4 }, (_, d) => tongNangLuc(st, d))
const chenh = (a: number[]) => Math.max(...a) - Math.min(...a)

describe('chia đội theo số em có mặt (thầy 09/11)', () => {
  it('12 em có mặt ⇒ 2 đội; em thứ 13 vào ⇒ NGAY LÚC ĐÓ 4 đội, số em chênh ≤ 1, tổng năng lực chênh nhỏ', () => {
    const st = taoPhong({ buoiId: 'b', lop: 'L', nay: T0, ds: lop(20, 12) })
    expect(st.soDoi).toBe(2)
    expect(viewBang(st).soDoi).toBe(2)
    expect(chenh(demDoi(st))).toBeLessThanOrEqual(1)
    vaoLop(st, 'S13', T0 + 100)
    expect(st.soDoi).toBe(4)
    expect(st.doiThuong).toHaveLength(4)
    expect(viewBang(st).soDoi).toBe(4)
    expect(new Set(coMat(st).map((e) => e.doi))).toEqual(new Set([0, 1, 2, 3]))
    expect(chenh(demDoi(st))).toBeLessThanOrEqual(1)
    // 13 em năng lực 0,05..0,95: chênh tổng năng lực giữa các đội phải nhỏ hơn hẳn chênh của một em mạnh nhất với yếu nhất.
    expect(chenh(tongDoi(st))).toBeLessThan(0.3)
  })
  it('chia rắn + đổi chỗ: tổng năng lực các đội sát nhau, số em chênh ≤ 1; tất định', () => {
    const ds = Array.from({ length: 17 }, (_, i) => ({ sbd: `X${i}`, nangLuc: nlGia(i * 3 + 1) }))
    const a = chiaDoi(ds, 4), b = chiaDoi([...ds].reverse(), 4)
    expect([...a].every(([k, v]) => b.get(k) === v)).toBe(true)
    const tong = [0, 0, 0, 0], dem = [0, 0, 0, 0]
    for (const x of ds) { const d = a.get(x.sbd)!; tong[d]! += x.nangLuc; dem[d]! += 1 }
    expect(chenh(dem)).toBeLessThanOrEqual(1)
    expect(chenh(tong)).toBeLessThan(0.1) // TỔNG năng lực các đội (luật thầy: «chênh lệch tổng năng lực»)
    // Hai em năng lực bằng nhau, mạnh nhất ⇒ hai đội khác nhau (chia rắn).
    const hai = chiaDoi([{ sbd: 'A', nangLuc: 0.9 }, { sbd: 'B', nangLuc: 0.9 }, { sbd: 'C', nangLuc: 0.1 }, { sbd: 'D', nangLuc: 0.1 }], 2)
    expect(hai.get('A')).not.toBe(hai.get('B'))
  })
  it('em vào muộn (số đội không đổi) ⇒ đội có tổng năng lực THẤP NHẤT khi số em bằng nhau; em có mặt khác không bị dời', () => {
    const ds = [
      { sbd: 'A', ten: 'A', coMat: true, luc: 1, nangLuc: 0.9 }, { sbd: 'B', ten: 'B', coMat: true, luc: 2, nangLuc: 0.8 },
      { sbd: 'C', ten: 'C', coMat: true, luc: 3, nangLuc: 0.3 }, { sbd: 'D', ten: 'D', coMat: true, luc: 4, nangLuc: 0.1 },
      { sbd: 'E', ten: 'E', coMat: false, luc: null, nangLuc: 0.5 },
    ]
    const st = taoPhong({ buoiId: 'b', lop: 'L', nay: T0, ds })
    const truoc = new Map(coMat(st).map((e) => [e.sbd, e.doi]))
    const tong = tongDoi(st)
    expect(demDoi(st)).toEqual([2, 2])
    const yeu = tong[0]! <= tong[1]! ? 0 : 1
    expect(tong[0]).not.toBe(tong[1]) // có đội yếu hơn rõ
    vaoLop(st, 'E', T0)
    expect(st.ds.find((e) => e.sbd === 'E')!.doi).toBe(yeu)
    for (const [s, d] of truoc) expect(st.ds.find((e) => e.sbd === s)!.doi).toBe(d)
  })
  it('em vào muộn khi số em lệch ⇒ vào đội ít em hơn (giữ chênh ≤ 1) dù đội kia yếu hơn', () => {
    const st = taoPhong({ buoiId: 'b', lop: 'L', nay: T0, ds: [
      { sbd: 'A', ten: 'A', coMat: true, luc: 1, nangLuc: 0.9 }, { sbd: 'B', ten: 'B', coMat: true, luc: 2, nangLuc: 0.2 }, { sbd: 'C', ten: 'C', coMat: true, luc: 3, nangLuc: 0.1 },
    ] })
    const it = demDoi(st).indexOf(1)
    expect(demDoi(st).sort()).toEqual([1, 2])
    vaoLop(st, 'Z', T0, 'Em Z', 0.5)
    expect(st.ds.find((e) => e.sbd === 'Z')!.doi).toBe(it)
    expect(demDoi(st)).toEqual([2, 2])
  })
  it('chia lại: kJ cá nhân giữ theo em; thưởng đội cộng tổng rồi chia đều (dư cho đội đầu)', () => {
    const st = taoPhong({ buoiId: 'b', lop: 'L', nay: T0, ds: lop(13, 12) })
    moLuot(st, cau, T0)
    for (const e of coMat(st)) nhanTra(st, e.sbd, e.sbd < 'S05' ? 'B' : 'A', T0 + 1000)
    moDapAn(st, T0 + 2000, chamSo)
    st.doiThuong[0]! += 3 // tổng lẻ ⇒ có phần dư
    const kj = new Map(st.ds.map((e) => [e.sbd, e.kj])), tong = st.doiThuong.reduce((a, b) => a + b, 0)
    expect(st.doiDu).not.toBeNull() // đội đủ quân đã thưởng ⇒ chia lại không thưởng lần hai
    vaoLop(st, 'S13', T0 + 3000)
    expect(st.soDoi).toBe(4)
    for (const e of st.ds) expect(e.kj).toBe(kj.get(e.sbd))
    const moi = tong + KJ.vaoLop
    expect(st.doiThuong.reduce((a, b) => a + b, 0)).toBe(moi)
    const deu = Math.floor(moi / 4)
    expect(st.doiThuong).toEqual([moi - 3 * deu, deu, deu, deu])
    // Tổng điểm cả lớp (kJ em + thưởng đội) bảo toàn qua lần chia lại.
    expect([0, 1, 2, 3].reduce((s, d) => s + diemDoi(st, d), 0)).toBe([...kj.values()].reduce((a, b) => a + b, 0) + moi)
  })
  it('đội đủ quân: hễ có đội đủ mặt (kể cả do xếp lại em chưa vào) là đã thưởng đúng một lần', () => {
    for (const n of [5, 7, 9, 11, 16]) {
      const st = taoPhong({ buoiId: 'b', lop: 'L', nay: T0, ds: lop(n, 0) })
      const thu = [...st.ds].map((e) => e.sbd).sort((a, b) => ((Number(a.slice(1)) * 7) % n) - ((Number(b.slice(1)) * 7) % n))
      for (const s of thu) {
        vaoLop(st, s, T0)
        const du = Array.from({ length: st.soDoi ?? 4 }, (_, d) => st.ds.filter((e) => e.doi === d)).some((t) => t.length > 0 && t.every((e) => e.vao))
        if (du) expect(st.doiDu).not.toBeNull()
      }
    }
  })
  it('em chưa vào có đội dự kiến: tổng số em các đội đều; viewEm vẫn đủ trường cũ', () => {
    const st = taoPhong({ buoiId: 'b', lop: 'L', nay: T0, ds: lop(11, 4) })
    const dem = [0, 1].map((d) => st.ds.filter((e) => e.doi === d).length)
    expect(chenh(dem)).toBeLessThanOrEqual(1)
    const v = viewEm(st, 'S01')
    expect(v.em).toMatchObject({ sbd: 'S01', doi: expect.any(Number) })
    expect(v.doi.tong).toBeGreaterThanOrEqual(v.doi.so)
    expect(JSON.stringify(viewBang(st))).not.toContain('nangLuc') // năng lực không ra bảng chiếu
    expect(JSON.stringify(v)).not.toContain('nangLuc')
  })
  it('phòng lưu trước 09/11 (4 đội, có mặt ≤ 12) ⇒ mở lượt nắn về 2 đội, không mất kJ', () => {
    const st = taoPhong({ buoiId: 'b', lop: 'L', nay: T0, ds: lop(8, 8) })
    st.soDoi = undefined; st.doiThuong = [10, 20, 30, 40]; for (const e of st.ds) e.doi = Number(e.sbd.slice(1)) % 4; delete st.roiNay
    moLuot(st, cau, T0)
    expect(st.soDoi).toBe(2)
    expect(st.doiThuong).toEqual([50, 50])
    expect(st.ds.every((e) => e.doi < 2)).toBe(true)
  })
})

describe('rời màn: báo động, không trừ kJ (thầy 09/11)', () => {
  const phong = () => taoPhong({ buoiId: 'b', lop: 'L', nay: T0, ds: lop(6, 6) })
  it('roi ⇒ roiNay có em, kJ không đổi; ve ⇒ gỡ; roi lại ⇒ có lại, roi đếm 2', () => {
    const st = phong(); moLuot(st, cau, T0)
    const truoc = [0, 1].map((d) => diemDoi(st, d))
    expect(roiMan(st, 'S01', T0)).toBe(true)
    expect(viewBang(st).roiNay).toEqual(['S01'])
    expect([0, 1].map((d) => diemDoi(st, d))).toEqual(truoc)
    expect(veMan(st, 'S01', T0)).toBe(true)
    expect(viewBang(st).roiNay).toEqual([])
    expect(veMan(st, 'S01', T0)).toBe(false)
    roiMan(st, 'S01', T0); roiMan(st, 'S02', T0)
    expect(viewBang(st).roiNay).toEqual(['S01', 'S02'])
    expect(st.ds[0]!.roi).toBe(2)
    expect(st.luot!.roiMe).toEqual(['S01', 'S02'])
  })
  it('mở đáp án ⇒ roiNay rỗng; lúc chờ (đã mở) rời không tính; lượt mới ⇒ rỗng', () => {
    const st = phong(); moLuot(st, cau, T0)
    roiMan(st, 'S01', T0)
    moDapAn(st, T0 + 1000, chamSo)
    expect(viewBang(st).roiNay).toEqual([])
    expect(roiMan(st, 'S02', T0)).toBe(false)
    moLuot(st, { ...cau, qid: 'q2' }, T0 + 2000)
    roiMan(st, 'S03', T0 + 2500)
    expect(st.roiNay).toEqual(['S03'])
    moLuot(st, { ...cau, qid: 'q3' }, T0 + 3000)
    expect(viewBang(st).roiNay).toEqual([])
  })
})

describe('máy chủ: năng lực từ sổ học (một đợt chờ D1)', () => {
  const chen = (d: ReturnType<typeof taoD1That>, bang: string, can: Record<string, string | number | null>) => {
    const cot = d.sql.prepare(`SELECT name, type, "notnull" AS nn, dflt_value AS md FROM pragma_table_info('${bang}')`).all() as { name: string; type: string; nn: number; md: unknown }[]
    const dung = cot.filter((c) => c.name in can || (c.nn && c.md == null))
    d.sql.prepare(`INSERT INTO ${bang} (${dung.map((c) => c.name).join(', ')}) VALUES (${dung.map(() => '?').join(', ')})`).run(...dung.map((c) => (c.name in can ? can[c.name]! : /INT|REAL|NUM/i.test(c.type) ? 0 : '') as never))
  }
  it('công thức co về 0,5: chưa làm = 0,5; làm ít không ra cực', () => {
    expect(nangLucTuSo(0, 0)).toBe(0.5)
    expect(nangLucTuSo(3, 3)).toBeCloseTo(0.615, 3)
    expect(nangLucTuSo(0, 40)).toBeCloseTo(0.1, 3)
  })
  it('gvBpuMo: đọc năng lực SONG SONG với batch danh sách; em giỏi / yếu chia về hai đội; câu che (embargoed) không tính', async () => {
    const d = taoD1That()
    const nay = Date.parse('2026-11-09T05:00:00Z'), hom = '2026-11-09'
    chen(d, 'buoi_hoc', { id: 'B1', ten: 'Buổi', lop: '12 - Tinh Hoa', bi_mat: 'x', mo_luc: '2026-11-09T00:00:00Z', het_han: '2099-01-01T00:00:00Z', cap_nhat_luc: 'x' })
    for (const [s, l] of [['A', '12 - Tinh Hoa'], ['B', '12 - Tinh Hoa'], ['C', '12 - Tinh Hoa'], ['D', '12 - Tinh Hoa'], ['K', '11 - Khác']] as const) chen(d, 'hoc_sinh', { sbd: s, ho_ten: `Em ${s}`, lop: '12', ten_lop: l })
    for (const s of ['A', 'B', 'C', 'D']) chen(d, 'buoi_hoc_diem_danh', { buoi_id: 'B1', sbd: s, luc: '2026-11-09T01:00:00Z', cach: 'ma', trang_thai: 'co_mat', cap_nhat_luc: 'x' })
    let k = 0
    const lam = (sbd: string, dung: number, sai: number, che = '') => { for (let i = 0; i < dung + sai; i++) chen(d, 'su_kien_hoc', { khoa: `k${k++}`, sbd, qid: `q${i}`, ngay_vn: hom, ket_qua: i < dung ? 1 : 0, luc: '2026-11-09T01:00:00Z', ...(che ? { visibility: che } : {}) }) }
    lam('A', 40, 0); lam('B', 38, 2); lam('C', 2, 38); lam('D', 0, 40); lam('K', 40, 0); lam('D', 30, 0, 'embargoed')
    const nl = await docNangLucBpu(d.env as unknown as Env, { buoiId: 'B1' }, nay)
    expect(nl.has('K')).toBe(false) // em lớp khác, không điểm danh ⇒ không đọc
    expect(nl.get('A')!).toBeGreaterThan(0.85)
    expect(nl.get('D')!).toBeLessThan(0.15) // 30 câu đúng còn che không tính
    // Đếm đợt chờ D1 nối tiếp trước khi gọi phòng: phải là MỘT.
    let dangCho = 0, dot = 0, dotLucGoiPhong = -1
    const goc = d.env.DB as unknown as { prepare: (q: string) => Record<string, unknown>; batch: (s: unknown[]) => Promise<unknown> }
    const theo = <T,>(p: Promise<T>): Promise<T> => { if (dangCho === 0) dot++; dangCho++; return p.finally(() => { dangCho-- }) }
    const db = {
      prepare: (q: string) => { const st = goc.prepare(q); for (const m of ['all', 'first', 'run'] as const) { const f = st[m] as (...a: unknown[]) => Promise<unknown>; st[m] = (...a: unknown[]) => theo(f.apply(st, a)) } return st },
      batch: (s: unknown[]) => theo(goc.batch(s)),
    }
    let than: { ds: { sbd: string; nangLuc: number; coMat: boolean }[] } | null = null
    const env = { ...d.env, DB: db, MA_BI_MAT: 'x', PHONG_BPU: { idFromName: (t: string) => ({ toString: () => t }), get: () => ({ fetch: async (r: Request) => { dotLucGoiPhong = dot; than = await r.json(); return new Response('{"ok":true}') } }) } } as unknown as Env
    const r = await gvBpuMo(env, { buoiId: 'B1' }, nay)
    expect(r.ok).toBe(true)
    expect(dotLucGoiPhong).toBe(1)
    const ds = than!.ds
    expect(ds.map((x) => x.sbd).sort()).toEqual(['A', 'B', 'C', 'D'])
    const st = taoPhong({ buoiId: 'B1', lop: 'L', nay, ds: ds.map((x) => ({ ...x, ten: x.sbd, luc: 1 })) })
    const doi = (s: string) => st.ds.find((e) => e.sbd === s)!.doi
    expect(doi('A')).not.toBe(doi('B')) // hai em giỏi nhất ở hai đội
    expect(doi('C')).not.toBe(doi('D'))
  })
})
