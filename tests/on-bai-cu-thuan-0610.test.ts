// @vitest-environment node
// ÔN BÀI CŨ (thầy 06/10: "chọn Bài 6 thì tổng số câu ôn của Bài 1–5 khi hết hạn khoảng bao nhiêu, có giúp học sinh ôn trọn vẹn không") — PHẦN THUẦN
// (server/src/omni-on-bai-cu.ts): (a) số liệu dòng "tối đa N câu/em · kho X câu · phủ ≈ Y%", (b) chia đều theo bài/dạng (cắt trần công bằng + thứ tự xen kẽ),
// (c) đọc cấu hình tỉ lệ theo lớp (hợp lệ / sai kiểu / ngoài [0; 0,6]). Số liệu tính tay (đối chiếu bằng máy ở comment).
import { describe, expect, it } from 'vitest'
import {
  BUOC_TI_LE_ON_BAI_CU, KHOA_ON_BAI_CU_DEU, KHOA_ON_BAI_CU_TI_LE, TI_LE_ON_BAI_CU_TOI_DA, capCongBang, chiaCauTheoBai, docCauHinhTiLe, docOnBaiCuDeu, phuPhanTram,
  tiLeHieuLuc, tiLeHopLe, tiLeNgayOnBaiCu, tiLeRiengCuaLop, tranOnBaiCuToiDa, xemOnBaiCu, xepCongBang,
} from '../server/src/omni-on-bai-cu'
import { tiLeOnBaiCu } from '../server/src/omni-ke-hoach'
import { THAM_SO_OMNI } from '../server/src/omni-kieu'
import { congNgay, lapKeHoachNgay, phatLaiCau, type CauSrs, type TrangThaiCau } from '../server/src/srs2-loi'

describe('hằng số và khoá cấu hình', () => {
  it('khoá cau_hinh + trần 0,6 + bước 5 %', () => {
    expect(KHOA_ON_BAI_CU_DEU).toBe('on_bai_cu_deu')
    expect(KHOA_ON_BAI_CU_TI_LE).toBe('on_bai_cu_ti_le')
    expect(TI_LE_ON_BAI_CU_TOI_DA).toBe(0.6)
    expect(BUOC_TI_LE_ON_BAI_CU).toBe(0.05)
  })
})

describe('công tắc chia đều `on_bai_cu_deu` — vắng / hỏng ⇒ BẬT, chỉ {"bat":false} ⇒ TẮT', () => {
  it.each([
    [null, true], [undefined, true], ['', true], ['không phải JSON', true], ['null', true], ['[]', true], ['{}', true], ['{"bat":true}', true],
    ['{"bat":"false"}', true], ['{"bat":0}', true], ['{"bat":false}', false], ['{"bat":false,"x":1}', false],
  ] as const)('%j ⇒ %s', (giaTri, mong) => {
    expect(docOnBaiCuDeu(giaTri as string | null | undefined)).toBe(mong)
  })
})

describe('(c) tiLeHopLe — SỐ hữu hạn trong [0; 0,6]', () => {
  it('hợp lệ: 0, 0,05, 0,2, 0,6; không hợp lệ: ngoài khoảng, sai kiểu, NaN', () => {
    for (const v of [0, 0.05, 0.2, 0.4, 0.55, 0.6]) expect(tiLeHopLe(v), String(v)).toBe(v)
    for (const v of [-0.01, 0.61, 1, 20, '0.2', '', true, false, null, undefined, NaN, Infinity, -Infinity, [], {}, [0.2]]) expect(tiLeHopLe(v), String(v)).toBeNull()
  })
})

describe('(c) docCauHinhTiLe + tiLeRiengCuaLop + tiLeHieuLuc', () => {
  const cauHinh = JSON.stringify({ mac_dinh: { thuong: 0.25, cuoi: 0.45 }, lop: { '12A1': { thuong: 0.3, cuoi: 0.5 }, ' 12A2 ': { thuong: 0.1 }, '11B': { thuong: 0.9, cuoi: 'x' }, '10C': {}, '': { thuong: 0.3 } } })
  it('lớp có dòng ⇒ số của lớp; thiếu trường ⇒ lấy mac_dinh; lớp không có dòng ⇒ mac_dinh', () => {
    const ch = docCauHinhTiLe(cauHinh)
    expect(tiLeRiengCuaLop(ch, '12A1')).toEqual({ thuong: 0.3, cuoi: 0.5 })
    expect(tiLeRiengCuaLop(ch, '12A2')).toEqual({ thuong: 0.1, cuoi: 0.45 }) // tên lớp cắt khoảng trắng hai đầu; thiếu cuoi ⇒ mac_dinh
    expect(tiLeRiengCuaLop(ch, '12A9')).toEqual({ thuong: 0.25, cuoi: 0.45 })
    expect(tiLeRiengCuaLop(ch, null)).toEqual({ thuong: 0.25, cuoi: 0.45 })
  })
  it('trường sai kiểu / ngoài [0; 0,6] bị bỏ ⇒ dùng cấp kế (mac_dinh rồi hằng cũ); dòng toàn trường hỏng coi như không có', () => {
    const ch = docCauHinhTiLe(cauHinh)
    expect(tiLeRiengCuaLop(ch, '11B')).toEqual({ thuong: 0.25, cuoi: 0.45 }) // thuong 0,9 ngoài khoảng, cuoi "x" sai kiểu ⇒ mac_dinh cả hai
    expect(tiLeRiengCuaLop(ch, '10C')).toEqual({ thuong: 0.25, cuoi: 0.45 })
    const khongMacDinh = docCauHinhTiLe(JSON.stringify({ lop: { '11B': { thuong: 0.9, cuoi: 'x' }, '12A1': { thuong: 0.3, cuoi: 0.9 } } }))
    expect(tiLeRiengCuaLop(khongMacDinh, '11B')).toBeNull() // không còn trường hợp lệ nào ⇒ null ⇒ hằng cũ (y hệt hôm nay)
    expect(tiLeRiengCuaLop(khongMacDinh, '12A1')).toEqual({ thuong: 0.3 }) // chỉ thuong hợp lệ
    expect(tiLeHieuLuc(tiLeRiengCuaLop(khongMacDinh, '12A1'))).toEqual({ thuong: 0.3, cuoi: THAM_SO_OMNI.DAN_XEN_TI_LE }) // cuoi thiếu ⇒ hằng 0,4
    expect(tiLeHieuLuc(null)).toEqual({ thuong: THAM_SO_OMNI.ON_BAI_CU_TI_LE, cuoi: THAM_SO_OMNI.DAN_XEN_TI_LE })
  })
  it('vắng / JSON hỏng / sai hình dạng ⇒ không cấu hình ⇒ null', () => {
    for (const v of [null, undefined, '', 'không phải JSON', 'null', '[]', '"a"', '5', '{"lop":[]}', '{"lop":"x","mac_dinh":5}', '{}']) {
      const ch = docCauHinhTiLe(v as string | null | undefined)
      expect(tiLeRiengCuaLop(ch, '12A1'), String(v)).toBeNull()
    }
  })
  it('mac_dinh hỏng một nửa: giữ nửa hợp lệ', () => {
    expect(tiLeRiengCuaLop(docCauHinhTiLe('{"mac_dinh":{"thuong":0.35,"cuoi":-1}}'), '12A1')).toEqual({ thuong: 0.35 })
    expect(tiLeRiengCuaLop(docCauHinhTiLe('{"mac_dinh":{"thuong":0,"cuoi":0.6}}'), '12A1')).toEqual({ thuong: 0, cuoi: 0.6 }) // 0 và 0,6 là hợp lệ (không bị coi là "vắng")
  })
})

describe('tiLeNgayOnBaiCu / tiLeOnBaiCu — vắng cấu hình ⇒ y hệt hằng cũ (20 % thường, 40 % ngày 4–5 của bài)', () => {
  it('ngày 1..30 + null: bằng đúng công thức cũ', () => {
    const cu = (n: number | null) => (n != null && (THAM_SO_OMNI.DAN_XEN_NGAY as readonly number[]).includes(n) ? THAM_SO_OMNI.DAN_XEN_TI_LE : THAM_SO_OMNI.ON_BAI_CU_TI_LE)
    for (const n of [null, ...Array.from({ length: 30 }, (_, i) => i + 1)]) {
      expect(tiLeOnBaiCu(n), String(n)).toBe(cu(n))
      expect(tiLeOnBaiCu(n, THAM_SO_OMNI, null), String(n)).toBe(cu(n))
      expect(tiLeOnBaiCu(n, THAM_SO_OMNI, {}), String(n)).toBe(cu(n))
      expect(tiLeNgayOnBaiCu(n), String(n)).toBe(cu(n))
    }
    expect([1, 2, 3, 4, 5, 6, 7].map((d) => tiLeOnBaiCu(d))).toEqual([0.2, 0.2, 0.2, 0.4, 0.4, 0.2, 0.2])
  })
  it('có tỉ lệ riêng: ngày đan xen dùng cuoi, còn lại dùng thuong; thiếu trường ⇒ hằng cũ cho trường ấy', () => {
    expect([1, 2, 3, 4, 5, 6].map((d) => tiLeOnBaiCu(d, THAM_SO_OMNI, { thuong: 0.3, cuoi: 0.5 }))).toEqual([0.3, 0.3, 0.3, 0.5, 0.5, 0.3])
    expect([3, 4].map((d) => tiLeOnBaiCu(d, THAM_SO_OMNI, { thuong: 0 }))).toEqual([0, 0.4])
    expect([3, 4].map((d) => tiLeOnBaiCu(d, THAM_SO_OMNI, { cuoi: 0 }))).toEqual([0.2, 0])
    expect(tiLeOnBaiCu(null, THAM_SO_OMNI, { thuong: 0.35, cuoi: 0.55 })).toBe(0.35) // chưa có chiến dịch ⇒ ngày thường
  })
})

describe('(a) tranOnBaiCuToiDa — N = Σ ngày 1..D ⌊thể lực × tỉ lệ⌋ (tính tay)', () => {
  it('mặc định thể lực 40: N = 8 × D + 16 khi D ≥ 5 (ngày 1–3, 6..: 8; ngày 4–5: 16)', () => {
    // D=7: 5 ngày × 8 + 2 ngày × 16 = 72 · D=14: 12 × 8 + 32 = 128 · D=5: 3 × 8 + 2 × 16 = 56 · D=1: 8 · D=3: 24 · D=4: 3 × 8 + 16 = 40
    expect([1, 3, 4, 5, 7, 10, 14].map((d) => tranOnBaiCuToiDa(d, 40))).toEqual([8, 24, 40, 56, 72, 96, 128])
    for (let d = 5; d <= 30; d++) expect(tranOnBaiCuToiDa(d, 40), `D=${d}`).toBe(8 * d + 16)
  })
  it('thể lực khác (nhập tay) và tỉ lệ lớp riêng', () => {
    // thể lực 35: ⌊7⌋ = 7 ×5 + ⌊14⌋ = 14 ×2 = 63 · thể lực 50, D=7: ⌊10⌋ ×5 + ⌊20⌋ ×2 = 90
    expect(tranOnBaiCuToiDa(7, 35)).toBe(63)
    expect(tranOnBaiCuToiDa(7, 50)).toBe(90)
    // 30 % / 50 % thể lực 40, D=7: 5 × 12 + 2 × 20 = 100
    expect(tranOnBaiCuToiDa(7, 40, { thuong: 0.3, cuoi: 0.5 })).toBe(100)
    // 0 % thường / 60 % ngày 4–5, D=10: 8 ngày × 0 + 2 × 24 = 48
    expect(tranOnBaiCuToiDa(10, 40, { thuong: 0, cuoi: 0.6 })).toBe(48)
    expect(tranOnBaiCuToiDa(10, 40, { thuong: 0, cuoi: 0 })).toBe(0)
  })
  it('biên: D = 0 / âm / không số ⇒ 0; thể lực 0 ⇒ 0; thể lực lẻ làm tròn xuống theo ngày (⌊15 × 0,2⌋ = 3)', () => {
    expect(tranOnBaiCuToiDa(0, 40)).toBe(0)
    expect(tranOnBaiCuToiDa(-3, 40)).toBe(0)
    expect(tranOnBaiCuToiDa(Number.NaN, 40)).toBe(0)
    expect(tranOnBaiCuToiDa(7, 0)).toBe(0)
    expect(tranOnBaiCuToiDa(3, 15)).toBe(9) // 3 ngày × ⌊3⌋
    expect(tranOnBaiCuToiDa(5, 12)).toBe(14) // ngày 1–3: ⌊2,4⌋ = 2 → 6; ngày 4–5: ⌊4,8⌋ = 4 → 8
  })
  it('KHỚP lapKeHoachNgay thật: mỗi ngày kế hoạch chọn đúng ⌊trần × tỉ lệ⌋ câu ôn bài cũ ⇒ tổng đúng N (mặc định + tỉ lệ riêng)', () => {
    const HOM = '2026-10-05'
    const lan = (qid: string) => ({ qid, ngay: congNgay(HOM, -9), luc: `${congNgay(HOM, -9)}T03:00:00Z`, dung: true, coGoiY: false })
    // 400 câu bài cũ chưa thành thạo (đúng 1 lần, hẹn tới lịch) — đủ để mọi ngày lấy hết phần trần cho phép
    const cau: CauSrs[] = Array.from({ length: 400 }, (_, i) => ({ qid: `o${i}`, phan: 'I', mucDo: 'TH', dang: `D${i % 3}`, nguon: 'on_bai_cu' }))
    const tt = new Map<string, TrangThaiCau>(cau.map((c, i) => [c.qid, phatLaiCau(c.qid, i % 2 ? [lan(c.qid)] : [], null, [], { phan: 'I', mucDo: 'TH' })]))
    for (const rieng of [null, { thuong: 0.3, cuoi: 0.5 }, { thuong: 0, cuoi: 0.6 }, { thuong: 0.35, cuoi: 0.15 }]) {
      let tong = 0
      for (let k = 1; k <= 14; k++) {
        const kh = lapKeHoachNgay([], tt, { homNay: HOM, hanNop: null, tranNgay: 40, onBaiCu: cau, tiLeOnBaiCu: tiLeOnBaiCu(k, THAM_SO_OMNI, rieng) })
        expect(kh.onBaiCu!.length, `ngày ${k} ${JSON.stringify(rieng)}`).toBe(Math.floor(40 * tiLeOnBaiCu(k, THAM_SO_OMNI, rieng)))
        tong += kh.onBaiCu!.length
      }
      expect(tong, JSON.stringify(rieng)).toBe(tranOnBaiCuToiDa(14, 40, rieng))
    }
  })
})

describe('(a) phuPhanTram + xemOnBaiCu', () => {
  it('Y = min(100, làm tròn(N / X × 100)); kho 0 / hỏng ⇒ null (không chia cho 0)', () => {
    expect(phuPhanTram(96, 310)).toBe(31) // 30,97
    expect(phuPhanTram(72, 100)).toBe(72)
    expect(phuPhanTram(1, 3)).toBe(33)
    expect(phuPhanTram(2, 3)).toBe(67)
    expect(phuPhanTram(500, 100)).toBe(100) // kẹp 100
    expect(phuPhanTram(0, 50)).toBe(0)
    expect(phuPhanTram(96, 0)).toBeNull()
    expect(phuPhanTram(96, -5)).toBeNull()
    expect(phuPhanTram(96, Number.NaN)).toBeNull()
    expect(phuPhanTram(Number.NaN, 50)).toBeNull()
  })
  it('khối onBaiCu: N theo tỉ lệ/D/thể lực, X và số bài giữ nguyên; kho 0 ⇒ null', () => {
    const tiLe = { thuong: 0.2, cuoi: 0.4 }
    // D = 7, thể lực 40 ⇒ N = 72; kho 310 ⇒ 23,2 % ⇒ 23 ; 5 bài
    expect(xemOnBaiCu({ soNgay: 7, theLuc: 40, khoCau: 310, soBai: 5, tiLe })).toEqual({ toiDaMoiEm: 72, khoCau: 310, phuPhanTram: 23, soBai: 5, tiLe })
    expect(xemOnBaiCu({ soNgay: 7, theLuc: 40, khoCau: 0, soBai: 0, tiLe })).toBeNull()
    expect(xemOnBaiCu({ soNgay: 7, theLuc: 40, khoCau: 50, soBai: 2, tiLe })!.phuPhanTram).toBe(100) // N 72 > kho 50 ⇒ kẹp 100
    // đổi tỉ lệ ⇒ tính lại: 30 % / 50 % ⇒ N = 100 ⇒ 100/310 = 32 %
    expect(xemOnBaiCu({ soNgay: 7, theLuc: 40, khoCau: 310, soBai: 5, tiLe: { thuong: 0.3, cuoi: 0.5 } })).toMatchObject({ toiDaMoiEm: 100, phuPhanTram: 32, tiLe: { thuong: 0.3, cuoi: 0.5 } })
  })
})

describe('(b) capCongBang — trần ứng viên công bằng giữa các bài (bài gần nhất trước, mỗi bài giữ thứ tự gốc)', () => {
  const nhom = [['a1', 'a2', 'a3', 'a4', 'a5'], ['b1', 'b2'], ['c1', 'c2', 'c3', 'c4']]
  it('chưa chạm trần ⇒ giữ TOÀN BỘ theo thứ tự nhóm (không cắt)', () => {
    expect(capCongBang(nhom, 100)).toEqual(['a1', 'a2', 'a3', 'a4', 'a5', 'b1', 'b2', 'c1', 'c2', 'c3', 'c4'])
    expect(capCongBang(nhom, 11)).toHaveLength(11)
    expect(capCongBang([], 5)).toEqual([])
  })
  it('chạm trần ⇒ vòng r lấy câu thứ r của mỗi bài; bài hết câu rút khỏi vòng; tổng đúng bằng trần', () => {
    expect(capCongBang(nhom, 6)).toEqual(['a1', 'b1', 'c1', 'a2', 'b2', 'c2'])
    expect(capCongBang(nhom, 8)).toEqual(['a1', 'b1', 'c1', 'a2', 'b2', 'c2', 'a3', 'c3']) // b hết ⇒ chỉ a, c
    expect(capCongBang(nhom, 3)).toEqual(['a1', 'b1', 'c1'])
    expect(capCongBang(nhom, 2)).toEqual(['a1', 'b1']) // trần < số bài: bài gần nhất trước (không thể phủ hết)
    expect(capCongBang(nhom, 0)).toEqual([])
    expect(capCongBang([Array.from({ length: 10 }, (_, i) => `x${i}`), ['y1']], 4)).toEqual(['x0', 'y1', 'x1', 'x2'])
  })
  it('trần 800 với 5 bài × 200 câu: mỗi bài đúng 160 câu; cũ (bài gần nhất trước) mất hẳn bài xa nhất', () => {
    const baiXaDen = ['b5', 'b4', 'b3', 'b2', 'b1'].map((b) => Array.from({ length: 200 }, (_, i) => `${b}-${i}`)) // b5 gần nhất
    const ra = capCongBang(baiXaDen, 800)
    expect(ra).toHaveLength(800)
    for (const b of ['b5', 'b4', 'b3', 'b2', 'b1']) expect(ra.filter((q) => q.startsWith(`${b}-`)), b).toHaveLength(160)
    const cu = baiXaDen.flat().slice(0, 800)
    expect(cu.some((q) => q.startsWith('b1-'))).toBe(false) // hành vi cũ: bài 1 không bao giờ có mặt
    // mỗi bài giữ thứ tự gốc: 160 câu ĐẦU của bài
    expect(ra.filter((q) => q.startsWith('b3-'))).toEqual(Array.from({ length: 160 }, (_, i) => `b3-${i}`))
  })
})

describe('(b) chiaCauTheoBai — chia danh sách phẳng về từng bài theo số câu mỗi tờ', () => {
  it('đoạn theo tờ ⇒ bài; bỏ câu trong `loai`; trả qid → bài, qid → tờ', () => {
    const maDe = ['T5', 'T4a', 'T4b', 'T3']
    const qids = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7']
    const theoTo = { T5: 2, T4a: 2, T4b: 1, T3: 2 }
    const khoaBai = (m: string) => ({ T5: 'B5', T4a: 'B4', T4b: 'B4', T3: 'B3' } as Record<string, string>)[m] ?? ''
    const r = chiaCauTheoBai(maDe, qids, theoTo, khoaBai, new Set(['q4']))
    expect(r.khoa).toEqual(['B5', 'B4', 'B3'])
    expect(r.nhom).toEqual([['q1', 'q2'], ['q3', 'q5'], ['q6', 'q7']])
    expect(r.baiCua.get('q5')).toBe('B4')
    expect(r.baiCua.has('q4')).toBe(false)
    expect(r.toCua.get('q5')).toBe('T4b')
    expect(r.toCua.get('q3')).toBe('T4a')
    // tờ không có trong `theoTo` ⇒ 0 câu (không lệch đoạn)
    expect(chiaCauTheoBai(['X', 'T5'], ['q1'], { T5: 1 }, () => 'B', new Set()).nhom).toEqual([['q1']])
  })
})

// PRNG gieo hạt (mulberry32) — thử tính chất, không ngẫu nhiên giữa các lần chạy.
function prng(hat: number) {
  let a = hat >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
interface Muc { q: string; nhom: number; bai: string; dang: string }
const khoa = { nhom: (x: Muc) => x.nhom, bai: (x: Muc) => x.bai, dang: (x: Muc) => x.dang }
function dungMuc(rnd: () => number, soBai: number): Muc[] {
  const ra: Muc[] = []
  for (let b = soBai; b >= 1; b--) { // bài gần nhất trước, mỗi bài một dãy câu theo thứ tự gốc
    const n = 1 + Math.floor(rnd() * 14)
    for (let i = 0; i < n; i++) ra.push({ q: `B${b}-${i}`, nhom: Math.floor(rnd() * 3), bai: `B${b}`, dang: `D${Math.floor(rnd() * 4)}` })
  }
  return ra
}
const ngaySo = (homNay: string) => Math.floor(Date.parse(`${homNay}T00:00:00Z`) / 86_400_000)

describe('(b) xepCongBang — thứ tự công bằng: nhóm giữ nguyên, trong nhóm xen kẽ bài, trong bài xen kẽ dạng', () => {
  it('ví dụ tay: 1 nhóm, 3 bài (B3 gần nhất), mỗi bài 3 câu hai dạng ⇒ vòng đầu phủ cả 3 bài; trong bài dạng xen kẽ', () => {
    const ds: Muc[] = [
      { q: 'B3-0', nhom: 1, bai: 'B3', dang: 'X' }, { q: 'B3-1', nhom: 1, bai: 'B3', dang: 'X' }, { q: 'B3-2', nhom: 1, bai: 'B3', dang: 'Y' },
      { q: 'B2-0', nhom: 1, bai: 'B2', dang: 'X' }, { q: 'B2-1', nhom: 1, bai: 'B2', dang: 'X' }, { q: 'B2-2', nhom: 1, bai: 'B2', dang: 'X' },
      { q: 'B1-0', nhom: 1, bai: 'B1', dang: 'Y' }, { q: 'B1-1', nhom: 1, bai: 'B1', dang: 'X' }, { q: 'B1-2', nhom: 1, bai: 'B1', dang: 'Y' },
    ]
    // 2026-10-05 ⇒ ngày số 20 731 ⇒ 20 731 mod 3 = 1 ⇒ vòng đầu bắt đầu từ bài thứ 2 trong danh sách (B2), rồi B1, rồi B3
    expect(ngaySo('2026-10-05') % 3).toBe(1)
    const ra = xepCongBang(ds, khoa, '2026-10-05').map((x) => x.q)
    // trong bài: B3 = [B3-0 X, B3-2 Y, B3-1 X]; B2 = [B2-0, B2-1, B2-2] (một dạng); B1 = [B1-0 Y, B1-1 X, B1-2 Y]
    expect(ra).toEqual(['B2-0', 'B1-0', 'B3-0', 'B2-1', 'B1-1', 'B3-2', 'B2-2', 'B1-2', 'B3-1'])
    // ngày số 20 730 (2026-10-04) chia hết cho 3 ⇒ không xoay: B3 (gần nhất) đứng đầu
    expect(ngaySo('2026-10-04') % 3).toBe(0)
    expect(xepCongBang(ds, khoa, '2026-10-04').map((x) => x.q).slice(0, 3)).toEqual(['B3-0', 'B2-0', 'B1-0'])
  })
  it('nhóm giữ nguyên thứ tự: mọi phần tử nhóm 0 đứng trước nhóm 1, rồi nhóm 2; nhóm lẻ bỏ trống vẫn đúng', () => {
    const ds: Muc[] = [
      { q: 'a', nhom: 2, bai: 'B2', dang: 'X' }, { q: 'b', nhom: 0, bai: 'B2', dang: 'X' }, { q: 'c', nhom: 2, bai: 'B1', dang: 'X' }, { q: 'd', nhom: 0, bai: 'B1', dang: 'X' },
    ]
    const ra = xepCongBang(ds, khoa, '2026-10-04').map((x) => x.q)
    expect(ra.slice(0, 2).sort()).toEqual(['b', 'd'])
    expect(ra.slice(2).sort()).toEqual(['a', 'c'])
  })
  it('đầu vào rỗng / một bài / ngày hỏng ⇒ không lỗi', () => {
    expect(xepCongBang([], khoa, '2026-10-05')).toEqual([])
    const mot: Muc[] = [{ q: 'q0', nhom: 0, bai: 'B1', dang: 'X' }, { q: 'q1', nhom: 0, bai: 'B1', dang: 'X' }]
    expect(xepCongBang(mot, khoa, '2026-10-05').map((x) => x.q)).toEqual(['q0', 'q1'])
    expect(xepCongBang(mot, khoa, 'hỏng').map((x) => x.q)).toEqual(['q0', 'q1'])
  })
  it('TÍNH CHẤT (300 bộ ngẫu nhiên gieo hạt, mọi ngày): hoán vị đầy đủ · nhóm tăng dần · mọi tiền tố k của một nhóm phủ min(k, số bài) bài · trong bài mọi tiền tố phủ min(k, số dạng) dạng', () => {
    const rnd = prng(20261006)
    for (let lan = 0; lan < 300; lan++) {
      const ds = dungMuc(rnd, 1 + Math.floor(rnd() * 12))
      const homNay = congNgay('2026-10-01', Math.floor(rnd() * 40))
      const ra = xepCongBang(ds, khoa, homNay)
      expect(ra.map((x) => x.q).sort(), `lần ${lan}`).toEqual(ds.map((x) => x.q).sort())
      expect(ra.map((x) => x.nhom), `lần ${lan}`).toEqual([...ra.map((x) => x.nhom)].sort((a, b) => a - b))
      for (const n of new Set(ra.map((x) => x.nhom))) {
        const trongNhom = ra.filter((x) => x.nhom === n)
        const soBai = new Set(trongNhom.map((x) => x.bai)).size
        const thay = new Set<string>()
        trongNhom.forEach((x, k) => {
          thay.add(x.bai)
          expect(thay.size, `lần ${lan} nhóm ${n} tiền tố ${k + 1}`).toBe(Math.min(k + 1, soBai))
        })
        for (const bai of new Set(trongNhom.map((x) => x.bai))) {
          const cua = trongNhom.filter((x) => x.bai === bai)
          const soDang = new Set(cua.map((x) => x.dang)).size
          const d = new Set<string>()
          cua.forEach((x, k) => { d.add(x.dang); expect(d.size, `lần ${lan} nhóm ${n} bài ${bai} tiền tố ${k + 1}`).toBe(Math.min(k + 1, soDang)) })
        }
      }
    }
  })
  it('TẤT ĐỊNH: cùng đầu vào + cùng ngày ⇒ cùng kết quả; khác ngày ⇒ cùng tập (chỉ xoay bài đầu vòng)', () => {
    const rnd = prng(7)
    const ds = dungMuc(rnd, 9)
    const a = xepCongBang(ds, khoa, '2026-10-05').map((x) => x.q)
    expect(xepCongBang(ds, khoa, '2026-10-05').map((x) => x.q)).toEqual(a)
    expect(xepCongBang([...ds], khoa, '2026-10-05').map((x) => x.q)).toEqual(a)
    const b = xepCongBang(ds, khoa, '2026-10-06').map((x) => x.q)
    expect([...b].sort()).toEqual([...a].sort())
  })
  it('XOAY theo ngày: trong 12 ngày liên tiếp, mỗi bài trong 12 bài đứng đầu vòng đúng một lần (không bài nào bị bỏ đói khi số bài > số câu mỗi ngày)', () => {
    const ds: Muc[] = []
    for (let b = 12; b >= 1; b--) for (let i = 0; i < 5; i++) ds.push({ q: `B${b}-${i}`, nhom: 1, bai: `B${b}`, dang: 'X' })
    const dau = Array.from({ length: 12 }, (_, d) => xepCongBang(ds, khoa, congNgay('2026-10-05', d))[0]!.bai)
    expect(new Set(dau).size).toBe(12)
    // 8 câu/ngày (⌊40 × 0,2⌋) với 12 bài: mỗi ngày 8 bài khác nhau; qua 12 ngày mỗi bài được ôn 8 lần
    const dem = new Map<string, number>()
    for (let d = 0; d < 12; d++) for (const x of xepCongBang(ds, khoa, congNgay('2026-10-05', d)).slice(0, 8)) dem.set(x.bai, (dem.get(x.bai) ?? 0) + 1)
    expect([...dem.values()]).toEqual(Array(12).fill(8))
  })
})
