// @vitest-environment node
// Bình Phản Ứng — chọn em lên bảng theo TOÀN BỘ lịch sử, có lý do bằng số thật (thầy 09/11, Claude 10/11).
// Khoá: (1) bộ chọn thuần src/lib/bpu/chon-em-bpu.ts — tầng: đã lên trong buổi → đội → đúng/sai lượt này → lịch sử; (2) lý do có số thật, không lộ đúng/sai
// lượt này, không số kém; thiếu dữ liệu ⇒ lý do chung; (3) `kiem` chỉ ở view bảng (có chamSo, đang trả lời), không bao giờ ra máy em;
// (4) máy chủ kênh 'bpu' đọc dạng / chuyên đề / độ chăm / mọi lần lên bảng (len_bang ∪ bpu_luot), bpu_luot chưa có ⇒ vẫn chạy.
import { describe, expect, it } from 'vitest'
import { tenDoc, xepTheoBpu, type LuotBpu, type NapBpu } from '../src/lib/bpu/chon-em-bpu'
import { lyDoLenBang } from '../src/lib/bpu/ly-do'
import type { EmChieu } from '../src/lib/ung-vien-chieu'
import { moDapAn, moLuot, nhanTra, taoPhong, viewBang, viewEm } from '../src/lib/bpu/phong'
import { taoKhoOmni, lam } from './omni-3-ke-hoach-chung'
import { ungVienChieu } from '../server/src/ung-vien-chieu'

const NOW = Date.parse('2026-11-10T12:00:00Z')
const ngayTruoc = (n: number) => new Date(NOW - n * 86_400_000 - 3_600_000).toISOString()
const em = (sbd: string, them: Partial<EmChieu> = {}): EmChieu => ({ sbd, ten: `Em ${sbd}`, loai: 'chua_co', p: null, luc: null, ...them })
const xep = (list: EmChieu[], nap: NapBpu | undefined, v: LuotBpu) => xepTheoBpu(new Map([['q1', list]]), nap, v, NOW).get('q1')!
const view = (ds: LuotBpu['ds'], kiem?: Record<string, [number, number]>, them: Partial<LuotBpu> = {}): LuotBpu => ({ buoiId: 'b1', ds, luot: { so: 1, qid: 'q1', ...(kiem ? { kiem } : {}) }, ...them })

describe('bộ chọn thuần', () => {
  const nap: NapBpu = {
    tenDang: 'este hoá', chuyenDe: 'Este', lbDu: true,
    em: { A: { dang: [4, 5], ngay14: 9, lbCuoi: ngayTruoc(12) }, B: { dang: [1, 4], ngay14: 3, lbCuoi: ngayTruoc(1), lb: [1, 1], datCuoi: true } },
  }
  it('em đúng nhiều dạng ấy và lâu chưa lên bảng xếp trên em vừa lên bảng hôm qua', () => {
    const r = xep([em('B'), em('A')], nap, view([{ sbd: 'A', doi: 0 }, { sbd: 'B', doi: 0 }], { A: [1, 12], B: [1, 8] }))
    expect(r.map((e) => e.sbd)).toEqual(['A', 'B'])
  })
  it('em đã gọi trong buổi xuống cuối (dù lịch sử tốt nhất)', () => {
    const r = xep([em('A'), em('B'), em('C')], nap, view([{ sbd: 'A', doi: 0, daLenBang: 1 }, { sbd: 'B', doi: 0 }, { sbd: 'C', doi: 0 }]))
    expect(r.at(-1)!.sbd).toBe('A')
  })
  it('chia đều đội: đội chưa ai lên bảng được ưu tiên, lý do nói thật', () => {
    const v = view([{ sbd: 'A', doi: 0 }, { sbd: 'X', doi: 0, daLenBang: 1 }, { sbd: 'B', doi: 1 }])
    const r = xep([em('A'), em('B')], nap, v)
    expect(r[0]!.sbd).toBe('B')
    expect(r[0]!.lyDoBpu).toContain('Đội Kali chưa có bạn lên bảng trong buổi này.')
  })
  it('lý do có số thật, 2–3 dòng, không lộ đúng/sai lượt này, không nêu số kém', () => {
    const r = xep([em('B'), em('A')], nap, view([{ sbd: 'A', doi: 0 }, { sbd: 'B', doi: 0 }], { A: [1, 12], B: [0, 8] }))
    const a = r.find((e) => e.sbd === 'A')!.lyDoBpu!
    expect(a[0]).toBe('Đúng 4/5 lượt làm câu dạng este hoá trên app.')
    expect(a[1]).toBe('Chưa lên bảng 12 ngày.')
    expect(a.length).toBeLessThanOrEqual(3)
    expect(lyDoLenBang({ loai: 'chua_co', lyDoBpu: a }, { nowMs: NOW })).toEqual(a)
    // B đúng 1/4 dạng (kém) ⇒ không nêu; lượt này sai ⇒ không nêu.
    const b = r.find((e) => e.sbd === 'B')!.lyDoBpu!
    for (const d of [...a, ...b]) expect(d).not.toMatch(/1\/4|sai|Chưa đạt|lười|%|đúng ở lượt|chọn đúng/i)
  })
  it('ưu tiên em ĐÚNG lượt này; khoảng 1/3 lượt ưu tiên em sai để chữa (tất định theo buổi|lượt)', () => {
    const ds = [{ sbd: 'A', doi: 0 }, { sbd: 'B', doi: 0 }]
    let sai = 0
    for (let so = 1; so <= 60; so++) {
      const v: LuotBpu = { buoiId: 'b1', ds, luot: { so, qid: 'q1', kiem: { A: [0, 5], B: [1, 9] } } }
      const dau = xep([em('A'), em('B')], nap, v)[0]!.sbd
      expect(xep([em('A'), em('B')], nap, v)[0]!.sbd).toBe(dau) // cùng lượt ⇒ cùng em
      if (dau === 'A') sai++
    }
    expect(sai).toBeGreaterThan(8); expect(sai).toBeLessThan(35)
    // Lớp chỉ toàn em đúng ⇒ không có lượt «chữa».
    const v = (so: number): LuotBpu => ({ buoiId: 'b1', ds, luot: { so, qid: 'q1', kiem: { A: [1, 5], B: [1, 9] } } })
    expect(new Set(Array.from({ length: 30 }, (_, i) => xep([em('A'), em('B')], nap, v(i + 1))[0]!.sbd))).toEqual(new Set(['A']))
  })
  it('tên dạng đọc được: bỏ «Dạng» đầu, không gạch dài, mã nội bộ ⇒ «cùng dạng»', () => {
    expect(tenDoc('Dạng 3: Thuỷ phân ester')).toBe('Thuỷ phân ester')
    expect(tenDoc('Hằng số cân bằng — tính số mol')).toBe('Hằng số cân bằng, tính số mol')
    expect(tenDoc('DH-B0.D0')).toBe('')
    expect(tenDoc('Dạng DH-B0.D0')).toBe('')
    const r = xep([em('A')], { ...nap, tenDang: 'Dạng DH-B0.D0' }, view([{ sbd: 'A', doi: 0 }]))
    expect(r[0]!.lyDoBpu![0]).toBe('Đúng 4/5 lượt làm câu cùng dạng trên app.')
    for (const d of r[0]!.lyDoBpu!) expect(d).not.toMatch(/—|DH-B0/)
  })
  it('thiếu dữ liệu (máy chủ cũ) ⇒ không bịa số, dùng lý do chung', () => {
    const r = xep([em('C', { soLan14: 0 })], undefined, view([{ sbd: 'C', doi: 0 }]))
    expect(r[0]!.lyDoBpu).toEqual([])
    expect(lyDoLenBang(r[0]!, { nowMs: NOW }).at(-1)).toBe('Chưa lên bảng trong 14 ngày qua.')
  })
})

describe('đúng/sai lượt này chỉ ở bảng thầy', () => {
  const T0 = Date.parse('2026-11-06T12:00:00Z'), chamSo = (a: string, b: string) => a === b
  const ds = Array.from({ length: 4 }, (_, i) => ({ sbd: `S${i + 1}`, ten: `Em ${i + 1}`, coMat: true, luc: T0 }))
  const cau = { qid: 'q1', phan: 'I' as const, tuLuan: false, cau: { qid: 'q1', text: 'x', choices: ['a', 'b', 'c', 'd'] }, dung: 'B', hanGiay: 60 }
  it('`kiem` có ở view bảng khi máy chủ truyền chamSo; không có ở máy em, không có khi thiếu chamSo / đã mở / tự luận', () => {
    const st = taoPhong({ buoiId: 'b1', lop: '12A1', nay: T0, ds }); moLuot(st, cau, T0)
    nhanTra(st, 'S1', 'B', T0 + 7000); nhanTra(st, 'S2', 'C', T0 + 3000); nhanTra(st, 'S3', '', T0 + 2000, true)
    expect(viewBang(st, chamSo).luot!.kiem).toEqual({ S1: [1, 7], S2: [0, 3] })
    expect(viewBang(st).luot).not.toHaveProperty('kiem')
    for (const s of ['S1', 'S2', 'S3', 'S4']) expect(JSON.stringify(viewEm(st, s))).not.toContain('kiem')
    moDapAn(st, T0 + 9000, chamSo)
    expect(viewBang(st, chamSo).luot).not.toHaveProperty('kiem')
    const st2 = taoPhong({ buoiId: 'b2', lop: '12A1', nay: T0, ds }); moLuot(st2, { ...cau, tuLuan: true, dung: '' }, T0); nhanTra(st2, 'S1', 'xong', T0 + 1000)
    expect(viewBang(st2, chamSo).luot).not.toHaveProperty('kiem')
  })
})

describe('máy chủ kênh bpu', () => {
  const T = Date.parse('2026-11-08T02:00:00Z')
  function kho() {
    const k = taoKhoOmni({ 'DH-B0': 6 }, 3)
    k.d.sql.exec("INSERT INTO cau_meta(ma_de,qid,thu_tu,version,content_group,dang,muc_do,ten_dang,chuyen_de) SELECT ma_de,qid,rowid,version,content_group,dang,json_extract(json,'$.mucDo'),json_extract(json,'$.tenDang'),'Este' FROM game_v2_question")
    return k
  }
  it('đọc đúng/tổng cùng dạng, độ chăm, mọi lần lên bảng; bpu_luot chưa có ⇒ lbDu false, vẫn trả', async () => {
    const k = kho()
    // DH-B0-0 và DH-B0-3 cùng dạng DH-B0.D0.
    await lam(k.env, 'S1', 'DH-B0-3', T, true, { maDang: 'DH-B0.D0', chuyenDe: 'Este' })
    await lam(k.env, 'S1', 'DH-B0-3', T + 60_000, false, { maDang: 'DH-B0.D0', chuyenDe: 'Este' })
    await lam(k.env, 'S1', 'DH-B0-0', T + 120_000, true, { maDang: 'DH-B0.D0', chuyenDe: 'Este' })
    await lam(k.env, 'S2', 'DH-B0-1', T, true, { maDang: 'DH-B0.D1', chuyenDe: 'Este' })
    k.d.sql.prepare('INSERT INTO len_bang(sbd,chuyen_de,qid,dat,luc) VALUES(?,?,?,?,?)').run('S1', 'Este', 'DH-B0-2', 1, new Date(T - 5 * 864e5).toISOString())
    const r = await ungVienChieu(k.env, { qids: ['DH-B0-0'], sbd: ['S1', 'S2', 'S3'], kenh: 'bpu' }) as unknown as { bpu: NapBpu }
    expect(r.bpu.tenDang).toBe('Dạng DH-B0.D0')
    expect(r.bpu.lbDu).toBe(false)
    expect(r.bpu.em.S1).toMatchObject({ dang: [2, 3], cd: [2, 3], ngay14: 1, lb: [1, 1], datCuoi: true })
    expect(r.bpu.em.S2).toMatchObject({ cd: [1, 1] })
    expect(r.bpu.em.S2?.dang).toBeUndefined()
    // Kênh khác không có phần bpu.
    expect(await ungVienChieu(k.env, { qids: ['DH-B0-0'], sbd: ['S1'] })).not.toHaveProperty('bpu')
  })
  it('gộp lần lên bảng ở Bình Phản Ứng (bpu_luot) — lần mới nhất quyết Đạt', async () => {
    const k = kho()
    k.d.sql.exec('CREATE TABLE bpu_luot (buoi_id TEXT NOT NULL, sbd TEXT NOT NULL, qid TEXT NOT NULL, luot INTEGER NOT NULL, chon TEXT, dung INTEGER NOT NULL DEFAULT 0, giay REAL, kj INTEGER NOT NULL DEFAULT 0, doi INTEGER, roi INTEGER NOT NULL DEFAULT 0, len_bang INTEGER NOT NULL DEFAULT 0, luc TEXT NOT NULL, PRIMARY KEY (buoi_id, sbd, luot))')
    k.d.sql.prepare('INSERT INTO len_bang(sbd,chuyen_de,qid,dat,luc) VALUES(?,?,?,?,?)').run('S1', 'Este', 'x', 1, new Date(T - 9 * 864e5).toISOString())
    k.d.sql.prepare('INSERT INTO bpu_luot(buoi_id,sbd,qid,luot,len_bang,luc) VALUES(?,?,?,?,?,?)').run('b0', 'S1', 'x', 1, 1, new Date(T - 2 * 864e5).toISOString())
    k.d.sql.prepare('INSERT INTO bpu_luot(buoi_id,sbd,qid,luot,len_bang,luc) VALUES(?,?,?,?,?,?)').run('b0', 'S2', 'x', 2, 0, new Date(T - 2 * 864e5).toISOString())
    const r = await ungVienChieu(k.env, { qids: ['DH-B0-0'], sbd: ['S1', 'S2'], kenh: 'bpu' }) as unknown as { bpu: NapBpu }
    expect(r.bpu.lbDu).toBe(true)
    expect(r.bpu.em.S1).toMatchObject({ lb: [1, 2], lbCuoi: new Date(T - 2 * 864e5).toISOString(), datCuoi: false })
    expect(r.bpu.em.S2?.lb).toBeUndefined()
  })
})
