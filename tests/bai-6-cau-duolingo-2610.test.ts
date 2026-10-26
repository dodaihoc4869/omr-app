// @vitest-environment node
// BÀI 6 CÂU KIỂU DUOLINGO (thầy 26/10; docs/de-xuat-phan-cau-kieu-duolingo-2610.md A1 + A2 + A3): chỉ SẮP LẠI kế hoạch ngày, không thêm/bớt câu; mỗi chặng trộn câu
// mới · sửa · ôn theo tỉ lệ còn lại; trong chặng dễ → khó → vừa; câu mới chọn quanh ~80% đúng; ngày sát hạn giữ thứ tự cũ. Làm lại cuối chặng: chỉ câu SAI tự làm.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { chiaCho, xepBai6, xepTrongBai, P_MUC_TIEU } from '../server/src/bai-6-cau'
import { cauSaiCuaPhien, TRAN_LAM_LAI } from '../server/src/goi-bai-7-lam-lai'
import type { ViecGoi7 } from '../server/src/goi-bai-7-loi'
import type { RefGoi7 } from '../server/src/goi-bai-7'

const v = (qid: string, vai: ViecGoi7['vai']): ViecGoi7 => ({ qid, vai, huongDan: vai === 'tiep_can' })
// Kế hoạch kiểu chonGoi7: hết câu mới → sửa → ôn.
const keHoach = (moi: number, sua: number, on: number): ViecGoi7[] => [
  ...Array.from({ length: moi }, (_, i) => v(`m${i}`, 'moi')),
  ...Array.from({ length: sua }, (_, i) => v(`s${i}`, 'sua')),
  ...Array.from({ length: on }, (_, i) => v(`o${i}`, 'on')),
]
const nhom = (x: ViecGoi7) => x.vai === 'on' ? 'on' : x.vai === 'sua' || x.vai === 'chua' ? 'sua' : 'moi'
const chang = <T>(ds: readonly T[]) => Array.from({ length: Math.ceil(ds.length / 6) }, (_, i) => ds.slice(i * 6, i * 6 + 6))

describe('xepBai6 — chỉ đổi thứ tự', () => {
  it('cùng tập câu, cùng số câu, cùng đối tượng (không thêm/bớt, không đổi vai)', () => {
    const kh = keHoach(14, 4, 6)
    const ra = xepBai6(kh, {})
    expect(ra).toHaveLength(kh.length)
    expect(new Set(ra)).toEqual(new Set(kh))
  })
  it('mỗi chặng 6 câu đều có câu mới, câu sửa và câu ôn khi ngày có đủ ba loại (trước: chặng 1–2 toàn câu mới)', () => {
    const ra = xepBai6(keHoach(12, 4, 8), {})
    for (const c of chang(ra)) {
      const loai = new Set(c.map(nhom))
      expect(loai.has('moi')).toBe(true)
      expect(loai.has('on')).toBe(true)
    }
    // Câu mới chia đều: 12 câu mới / 4 chặng = 3 câu mỗi chặng.
    expect(chang(ra).map(c => c.filter(x => nhom(x) === 'moi').length)).toEqual([3, 3, 3, 3])
  })
  it('ngày nhiều câu mới (quota lớn): câu mới vẫn chiếm phần lớn mỗi chặng, không bị ôn/sửa ăn mất', () => {
    const ra = xepBai6(keHoach(20, 2, 2), {})
    expect(chang(ra).map(c => c.filter(x => nhom(x) === 'moi').length).reduce((a, b) => a + b, 0)).toBe(20)
    for (const c of chang(ra)) expect(c.filter(x => nhom(x) === 'moi').length).toBeGreaterThanOrEqual(4)
  })
  it('ngày sát hạn (giuThuTu) ⇒ giữ nguyên thứ tự cũ (câu mới trước)', () => {
    const kh = keHoach(8, 2, 4)
    expect(xepBai6(kh, {}, { giuThuTu: true })).toEqual(kh)
  })
  it('câu thầy vừa chữa xong (chua) luôn vào chặng ĐẦU, kể cả khi đứng cuối danh sách', () => {
    const kh = [...keHoach(10, 2, 6), v('c0', 'chua')]
    expect(xepBai6(kh, {}).slice(0, 6).map(x => x.qid)).toContain('c0')
  })
  it('danh sách ít hơn 6 câu ⇒ một chặng, vẫn đủ câu', () => {
    const kh = keHoach(2, 1, 1)
    expect(new Set(xepBai6(kh, {}))).toEqual(new Set(kh))
  })
})

describe('xepTrongBai — dễ → khó → vừa', () => {
  it('câu 1 là câu ôn dễ nhất (khởi động), câu cuối là câu ôn còn lại, giữa xếp dễ dần sang khó', () => {
    const p: Record<string, number> = { o0: 0.95, o1: 0.85, m0: 0.8, m1: 0.6, m2: 0.4, s0: 0.7 }
    const bai = [v('m0', 'moi'), v('m1', 'moi'), v('m2', 'moi'), v('s0', 'sua'), v('o0', 'on'), v('o1', 'on')]
    const ra = xepTrongBai(bai, x => p[x.qid]!)
    expect(ra.map(x => x.qid)).toEqual(['o0', 'm0', 's0', 'm1', 'm2', 'o1'])
  })
  it('không có câu ôn ⇒ khởi động bằng câu dễ nhất, kết bằng câu dễ thứ hai (không kết bằng câu khó nhất)', () => {
    const p: Record<string, number> = { a: 0.9, b: 0.3, c: 0.6, d: 0.8 }
    const ra = xepTrongBai(['a', 'b', 'c', 'd'].map(q => v(q, 'moi')), x => p[x.qid]!)
    expect(ra.map(x => x.qid)).toEqual(['a', 'c', 'b', 'd'])
  })
})

describe('độ khó chặng quanh ~80% đúng', () => {
  it('câu mới chọn trong cửa sổ ưu tiên sao cho trung bình chặng gần mức mục tiêu hơn so với lấy thẳng 3 câu đầu', () => {
    // 3 câu ưu tiên đầu đều rất khó; cửa sổ có câu vừa sức.
    const p: Record<string, number> = { m0: 0.3, m1: 0.3, m2: 0.3, m3: 0.9, m4: 0.85, m5: 0.8, o0: 0.9, o1: 0.9, s0: 0.7 }
    const kh = [...['m0', 'm1', 'm2', 'm3', 'm4', 'm5'].map(q => v(q, 'moi')), v('s0', 'sua'), v('o0', 'on'), v('o1', 'on')]
    const ra = xepBai6(kh, p)
    const tb = (c: ViecGoi7[]) => c.reduce((s, x) => s + p[x.qid]!, 0) / c.length
    const thang = [kh[0]!, kh[1]!, kh[2]!, kh[6]!, kh[7]!]
    expect(Math.abs(tb(chang(ra)[0]!) - P_MUC_TIEU)).toBeLessThan(Math.abs(tb(thang) - P_MUC_TIEU))
    // Mọi câu mới vẫn được xếp trong ngày (chỉ đổi chặng).
    expect(ra.filter(x => x.vai === 'moi')).toHaveLength(6)
  })
})

describe('chiaCho — tỉ lệ theo phần còn lại', () => {
  it('tổng đúng kích thước chặng, không nhóm nào vượt số câu có', () => {
    expect(chiaCho({ on: 1, sua: 0, moi: 10 }, 6)).toEqual({ on: 1, sua: 0, moi: 5 })
    expect(chiaCho({ on: 0, sua: 0, moi: 2 }, 6)).toEqual({ on: 0, sua: 0, moi: 2 })
    const r = chiaCho({ on: 7, sua: 3, moi: 14 }, 6)
    expect(r.on + r.sua + r.moi).toBe(6)
  })
})

describe('làm lại cuối chặng — câu nào được làm lại', () => {
  const ref = (qid: string, x: Partial<RefGoi7> = {}): RefGoi7 => ({ qid, maDe: 'DH-1', version: 'v1', group: qid, novel: true, role: 'cau_moi', vai: 'moi', huongDan: false, ...x })
  const luot = (qid: string, correct: boolean, assisted = false, luotNhanh = false) => ({ qid, json: JSON.stringify({ attempt: { correct, assisted }, ...(luotNhanh ? { omni: { luot: true } } : {}) }) })
  it('chỉ câu SAI tự làm; bỏ câu đúng, câu có hỗ trợ, lượt lướt và chính câu làm lại', () => {
    const refs = [ref('a'), ref('b'), ref('c'), ref('d'), ref('e', { lamLaiCuoi: true })]
    const ra = cauSaiCuaPhien(refs, [luot('a', false), luot('b', true), luot('c', false, true), luot('d', false, false, true), luot('e', false)])
    expect(ra.map(r => r.qid)).toEqual(['a'])
  })
  it('trần câu làm lại mỗi chặng là 3', () => { expect(TRAN_LAM_LAI).toBe(3) })
})

describe('khoá nguồn — nối dây máy chủ', () => {
  const g7 = readFileSync('server/src/goi-bai-7.ts', 'utf8')
  const ll = readFileSync('server/src/goi-bai-7-lam-lai.ts', 'utf8')
  const gv = readFileSync('server/src/game-v2.ts', 'utf8')
  it('mở chặng Gói 7 dùng xepBai6 trên kế hoạch ngày; câu làm lại không thành chặng mới', () => {
    expect(g7).toMatch(/xepBai6\(lap\.plan\.viec, lap\.pDung/)
    expect(g7).toMatch(/!r\.lamLaiCuoi/)
  })
  it('câu làm lại luôn có hỗ trợ (goiY) — lệnh nộp ép assisted, không EXP, không đóng lỗi; chỉ trả đề (publicQuestion)', () => {
    expect(ll).toMatch(/goiY: GOI_Y_LAM_LAI/)
    expect(gv).toMatch(/assisted:b\.assisted===true\|\|!!\(ref as \{goiY\?:unknown\}\)\.goiY/)
    expect(ll).toMatch(/publicQuestion\(x\.q\)/)
    expect(ll).not.toMatch(/correct:/)
  })
  it('lệnh hoc-tap-lam-lai có trong nhánh Gói 7, bị chặn ngày kiểm tra riêng, và trả rỗng khi Gói 7 tắt', () => {
    expect(gv).toMatch(/action==='hoc-tap-lam-lai'\)return import\('\.\/goi-bai-7-lam-lai'\)/)
    expect(gv).toMatch(/\['hoc-tap-start','hoc-tap-gap','hoc-tap-lam-lai'/)
    expect(gv).toMatch(/action==='hoc-tap-lam-lai'\)return \{ok:true,questions:\[\]\}/)
  })
})
