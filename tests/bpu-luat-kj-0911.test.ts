// @vitest-environment node
// Bình Phản Ứng — LUẬT CỘNG TRỪ kJ 09/11 (thầy: «luật cộng trừ kJ làm chặt nhé, thoát màn hình cảnh báo bị trừ cả đội và cá nhân. Làm dưới đúng nhưng
// lên bảng làm sai … cũng bị trừ cả đội và bị trừ cá nhân, cộng trừ hiệu ứng bay thẳng vào ống nghiệm của đội»). Luật thuần: src/lib/bpu/phong.ts.
// Hợp đồng cho bảng chiếu / máy em: `st.bienDong` ⇒ viewBang.bienDong (≤ 30 mục), viewEm.bienDongEm (≤ 5 mục của chính em).
import { describe, expect, it } from 'vitest'
import {
  BIEN_DONG_GIU, KJ, chamLenBang, diemDoi, goiLenBang, moDapAn, moLuot, nhanTra, roiMan, taoPhong, veMan, viewBang, viewEm, type TrangThaiPhong,
} from '../src/lib/bpu/phong'

const T0 = Date.parse('2026-11-09T12:00:00Z')
const chamSo = (a: string, b: string) => a === b
const cau = (qid = 'q1', phan: 'I' | 'II' = 'I', dung = 'B') => ({ qid, phan, tuLuan: false, cau: {}, dung, hanGiay: 60 })
/** 10 em có mặt (2 đội) — ít em đúng ⇒ không kích hoạt (< 75%). */
const phong = () => taoPhong({ buoiId: 'b', lop: 'L', nay: T0, ds: Array.from({ length: 10 }, (_, i) => ({ sbd: `S${i + 1}`, ten: `Em ${i + 1}`, coMat: true, luc: T0 + i })) })
const NHANH_1S = Math.round(KJ.nhanhToiDa * (1 - 1000 / 60_000))
const e = (st: TrangThaiPhong, s: string) => st.ds.find((x) => x.sbd === s)!
/** Một lượt: các em gửi theo thứ tự `tra` (mỗi em +1 s), rồi (tuỳ) gọi lên bảng + chấm, rồi mở đáp án. */
function luot(st: TrangThaiPhong, so: number, tra: [string, string][], goi?: { sbd: string; dat: boolean }, c = cau(`q${so}`)) {
  const t = T0 + so * 100_000
  moLuot(st, c, t)
  tra.forEach(([s, chon], i) => nhanTra(st, s, chon, t + 1000 * (i + 1)))
  if (goi) { goiLenBang(st, goi.sbd, [], t); chamLenBang(st, goi.dat, t) }
  moDapAn(st, t + 30_000, chamSo)
  return st.luot!
}

describe('luật kJ 09/11 — mở đáp án', () => {
  it('đúng +100 + nhanh; sai 0 (không có mục biến động); một mục mỗi em', () => {
    const st = phong(), dau = st.bienDong!.at(-1)!.id
    const l = luot(st, 1, [['S1', 'B'], ['S2', 'A']])
    expect(l.ketQua!.S1!.kj).toBe(KJ.dung + NHANH_1S)
    expect(l.ketQua!.S2!.kj).toBe(0)
    const moi = st.bienDong!.filter((x) => x.id > dau)
    expect(moi).toEqual([{ id: dau + 1, sbd: 'S1', doi: e(st, 'S1').doi, kjEm: KJ.dung + NHANH_1S, kjDoi: 0, lyDo: 'Đúng · nhanh thứ 1', luc: T0 + 130_000 }])
  })
  it('CHUỖI: đúng lần 3 ⇒ +20, lần 4 ⇒ +40, lần 5 trở đi ⇒ +60 (trần); sai ⇒ về 0', () => {
    const st = phong(), them: number[] = []
    for (let i = 1; i <= 6; i++) { const l = luot(st, i, [['S1', 'B']]); them.push(l.ketQua!.S1!.kj - KJ.dung - NHANH_1S) }
    expect(them).toEqual([0, 0, 20, 40, 60, 60])
    expect(st.bienDong!.at(-1)!.lyDo).toBe('Đúng · nhanh thứ 1 · chuỗi 6')
    luot(st, 7, [['S1', 'A']])
    expect(e(st, 'S1').chuoi).toBe(0)
    const l = luot(st, 8, [['S1', 'B']])
    expect(l.ketQua!.S1!.kj).toBe(KJ.dung + NHANH_1S)
  })
  it('lý do «Đúng · nhanh thứ 2 · chuỗi 4»', () => {
    const st = phong()
    for (let i = 1; i <= 3; i++) luot(st, i, [['S2', 'B']])
    luot(st, 4, [['S1', 'B'], ['S2', 'B']])
    const m = st.bienDong!.find((x) => x.sbd === 'S2' && x.lyDo.includes('chuỗi 4'))!
    expect(m.lyDo).toBe('Đúng · nhanh thứ 2 · chuỗi 4')
    expect(m.kjEm).toBe(KJ.dung + Math.round(KJ.nhanhToiDa * (1 - 2000 / 60_000)) + 40)
  })
  it('Đúng–sai: 25/ý; đủ 4 ý mới có nhanh + chuỗi; «chưa biết làm» +20 không phá chuỗi', () => {
    const st = phong()
    const l1 = luot(st, 1, [['S1', 'DSDD'], ['S2', 'DSDS']], undefined, cau('q1', 'II', 'DSDD'))
    expect(l1.ketQua!.S1!.kj).toBe(100 + NHANH_1S)
    expect(l1.ketQua!.S2!.kj).toBe(75)
    expect(st.bienDong!.filter((x) => x.sbd === 'S2').at(-1)!.lyDo).toBe('Đúng 3/4 ý')
    moLuot(st, cau('q2'), T0 + 200_000); nhanTra(st, 'S1', '', T0 + 201_000, true); moDapAn(st, T0 + 230_000, chamSo)
    expect(st.luot!.ketQua!.S1!.kj).toBe(KJ.thanhThat)
    expect(st.bienDong!.at(-1)).toMatchObject({ sbd: 'S1', kjEm: 20, lyDo: 'Thành thật: chưa biết làm' })
    expect(e(st, 'S1').chuoi).toBe(1)
  })
  it('kích hoạt gộp CHUNG một mục với đúng/nhanh', () => {
    const st = phong(), dau = st.bienDong!.at(-1)!.id
    luot(st, 1, Array.from({ length: 8 }, (_, i) => [`S${i + 1}`, 'B'] as [string, string]))
    const moi = st.bienDong!.filter((x) => x.id > dau)
    expect(moi).toHaveLength(10) // 8 em đúng + 2 em chỉ được +30 hoạt hoá — mỗi em MỘT mục
    expect(new Set(moi.map((x) => x.sbd)).size).toBe(10)
    expect(moi.find((x) => x.sbd === 'S1')!.lyDo).toBe('Đúng · nhanh thứ 1 · năng lượng hoạt hoá')
    expect(moi.find((x) => x.sbd === 'S9')).toMatchObject({ kjEm: KJ.kichHoat, lyDo: 'Năng lượng hoạt hoá' })
    // Thứ tự: biến động nhỏ trước ⇒ lớp đông bị cắt 30 mục thì mất mục +30 trước.
    expect(moi.slice(0, 2).every((x) => x.kjEm === KJ.kichHoat)).toBe(true)
  })
})

describe('luật kJ 09/11 — lên bảng', () => {
  it('Đạt: em +100, đội +200 — gộp với đúng trên máy', () => {
    const st = phong(), d = e(st, 'S1').doi, dt = st.doiThuong[d]!
    const l = luot(st, 1, [['S1', 'B']], { sbd: 'S1', dat: true })
    expect(l.ketQua!.S1!.kj).toBe(KJ.dung + NHANH_1S + 100)
    expect(st.doiThuong[d]! - dt).toBe(200)
    expect(st.bienDong!.at(-1)).toMatchObject({ sbd: 'S1', kjEm: KJ.dung + NHANH_1S + 100, kjDoi: 200, lyDo: 'Đúng · nhanh thứ 1 · giải đúng trên bảng' })
  })
  it('Chưa đạt mà trên máy ĐÃ ĐÚNG ⇒ em −100, đội −100', () => {
    const st = phong(), d = e(st, 'S1').doi, dt = st.doiThuong[d]!, tong = diemDoi(st, d)
    const l = luot(st, 1, [['S1', 'B']], { sbd: 'S1', dat: false })
    expect(l.ketQua!.S1!.kj).toBe(KJ.dung + NHANH_1S - 100)
    expect(st.doiThuong[d]! - dt).toBe(-100)
    expect(diemDoi(st, d) - tong).toBe(NHANH_1S - 100)
    expect(st.bienDong!.at(-1)).toMatchObject({ sbd: 'S1', kjDoi: -100, lyDo: 'Đúng · nhanh thứ 1 · đúng trên máy, chưa giải được trên bảng' })
  })
  it('Chưa đạt mà trên máy sai / không gửi ⇒ 0 / 0, vẫn có mục «Lên bảng chữa — không trừ»', () => {
    for (const tra of [[['S1', 'A']], []] as [string, string][][]) {
      const st = phong(), d = e(st, 'S1').doi, dt = st.doiThuong[d]!
      luot(st, 1, tra, { sbd: 'S1', dat: false })
      expect(st.doiThuong[d]).toBe(dt)
      expect(e(st, 'S1').kj).toBe(0)
      expect(st.bienDong!.at(-1)).toMatchObject({ sbd: 'S1', kjEm: 0, kjDoi: 0, lyDo: 'Lên bảng chữa — không trừ' })
    }
  })
  it('kJ em KẸP 0 (đội vẫn trừ đủ); mục ghi số THỰC đổi', () => {
    const st = phong(), d = e(st, 'S1').doi, dt = st.doiThuong[d]!
    roiMan(st, 'S1', T0) // em đang 0 ⇒ vẫn 0
    expect(e(st, 'S1').kj).toBe(0)
    expect(st.doiThuong[d]! - dt).toBe(-KJ.roiMan)
    veMan(st, 'S1', T0)
    e(st, 'S1').kj = 40
    roiMan(st, 'S1', T0)
    expect(e(st, 'S1').kj).toBe(0)
    expect(st.bienDong!.at(-1)).toMatchObject({ kjEm: -40, kjDoi: -50 })
  })
  it('AN TOÀN: thầy chấm «chưa đạt» TRƯỚC khi mở ⇒ chưa có biến động nào (cả lớp không biết em đúng/sai trên máy)', () => {
    const st = phong(); moLuot(st, cau(), T0); nhanTra(st, 'S1', 'B', T0 + 1000)
    goiLenBang(st, 'S1', [], T0)
    const truoc = JSON.stringify(viewBang(st).bienDong)
    chamLenBang(st, false, T0)
    expect(JSON.stringify(viewBang(st).bienDong)).toBe(truoc)
    expect(viewEm(st, 'S2').luot).not.toHaveProperty('dung')
  })
})

describe('hợp đồng bienDong / viewBang / viewEm', () => {
  it('vào lớp + đội đủ quân đầu tiên có mục; id tăng dần; giữ 30 mục mới nhất', () => {
    const st = phong()
    expect(st.bienDong!.filter((x) => x.lyDo === 'Vào lớp')).toHaveLength(10)
    expect(st.bienDong!.find((x) => x.lyDo === 'Đội đủ quân đầu tiên')).toMatchObject({ sbd: null, kjEm: 0, kjDoi: KJ.duQuanDau })
    for (let i = 0; i < 40; i++) { roiMan(st, 'S2', T0); veMan(st, 'S2', T0) }
    const b = viewBang(st).bienDong
    expect(b).toHaveLength(BIEN_DONG_GIU)
    expect(b.every((x, i) => i === 0 || x.id === b[i - 1]!.id + 1)).toBe(true)
    expect(b.at(-1)!.id).toBe(st.bienDong!.at(-1)!.id)
  })
  it('viewEm.bienDongEm: chỉ mục của chính em, tối đa 5, mới nhất cuối', () => {
    const st = phong()
    for (let i = 1; i <= 7; i++) luot(st, i, [['S1', 'B'], ['S2', 'B']])
    const v = viewEm(st, 'S1')
    expect(v.bienDongEm).toHaveLength(5)
    expect(v.bienDongEm.every((x) => x.sbd === 'S1')).toBe(true)
    expect(v.bienDongEm.at(-1)!.id).toBe(st.bienDong!.filter((x) => x.sbd === 'S1').at(-1)!.id)
    expect(viewEm(st, 'S9').bienDongEm.every((x) => x.sbd === 'S9')).toBe(true)
  })
  it('phòng lưu trước 09/11 (không có bienDong) vẫn chạy', () => {
    const st = phong(); delete st.bienDong
    expect(viewBang(st).bienDong).toEqual([])
    expect(viewEm(st, 'S1').bienDongEm).toEqual([])
    roiMan(st, 'S1', T0)
    expect(st.bienDong![0]!.id).toBe(1)
  })
})
