// MỤC "BÀI TẬP VỀ NHÀ ĐÃ GIAO" THIẾT KẾ LẠI — phần thuần (Code 1, 21/09/2026). Luật: màn KHÔNG tự tính nhóm, chỉ đọc số máy chủ; máy cũ thiếu khoá ⇒ không thanh nhóm.
import { describe, expect, it } from 'vitest'
import { mulberry32 } from '../src/lib/exam-shuffle'
import type { DongTheoDoiBtvn } from '../src/lib/btvn-may-chu-moi'
import { nhomBtvn } from '../src/lib/nhom-btvn'
import {
  baiChoThe, chuHanNop, chuHocGanNhat, chuNopTre, chuTienDoEm, daiCanYNhu, demEmTheoNhom, demNguocHan, docChang, docNhomBai, duongChang, emKhopTim, emTheoNhom, locBai, lopCuaCacBai,
  chuaNopQuaHan, laChuaNop, mucCanYCuaNhom, NGUONG_DOAN_HEP, sapXepThe, soEmCanY, thanhNhom, type NhomBai, type TheBai,
} from '../src/lib/btvn-da-giao'

const vn = (s: string) => Date.parse(`${s}:00+07:00`)
const N = (o: Partial<NhomBai> = {}): NhomBai => ({ chuaMo: 0, dungNhip: 0, chamNhip: 0, xongHomNay: 0, daNop: 0, nopTre: 0, ...o })

let dem = 0
function dong(o: Partial<DongTheoDoiBtvn> = {}): DongTheoDoiBtvn {
  dem++
  return { maBtvn: `B${dem}`, maCa: `C${dem}`, maDe: `DE${dem}`, soCau: 20, giaoLuc: '2026-09-21T03:48:00.000Z', hanNop: '2026-09-24T05:00:00.000Z', quaHan: false, tong: 10, daNop: 0, hocSinh: [], chuaNop: [], ...o }
}
const the = (o: Partial<DongTheoDoiBtvn> = {}) => baiChoThe(nhomBtvn([dong(o)])[0]!, (t) => `CU-${t.maDe}`)
const em = (sbd: string, hoTen: string, nhom: NonNullable<DongTheoDoiBtvn['hocSinh']>[number]['nhom'], o: Record<string, unknown> = {}) => ({ sbd, hoTen, nopLuc: null, soDung: null, soCau: null, thuHoi: false, nhom, ...o }) as NonNullable<DongTheoDoiBtvn['hocSinh']>[number]

describe('đọc dữ liệu máy chủ mới', () => {
  it('docNhomBai: đủ sáu số nguyên ≥ 0 mới nhận; thiếu / âm / lẻ / chuỗi ⇒ null (máy cũ)', () => {
    expect(docNhomBai(N({ chuaMo: 3, nopTre: 1 }))).toEqual(N({ chuaMo: 3, nopTre: 1 }))
    for (const x of [undefined, null, {}, { ...N(), chuaMo: -1 }, { ...N(), dungNhip: 1.5 }, { ...N(), daNop: '2' }, { chuaMo: 1 }]) expect(docNhomBai(x)).toBeNull()
  })
  it('docChang: bỏ phần tử sai dạng, sắp theo số chặng; không phải mảng ⇒ rỗng', () => {
    expect(docChang([{ so: 2, ngay: '2026-09-22', laHomNay: false }, { so: 1, ngay: '2026-09-21', laHomNay: true }, { so: 0, ngay: '2026-09-21' }, { so: 3, ngay: '22/09' }, null])).toEqual([{ so: 1, ngay: '2026-09-21', laHomNay: true }, { so: 2, ngay: '2026-09-22', laHomNay: false }])
    expect(docChang('x')).toEqual([])
  })
})

describe('baiChoThe — gộp một lần giao', () => {
  it('tên mới của máy chủ; máy cũ ⇒ tên cũ do nơi gọi đưa; nhóm null khi máy cũ; chiaChang theo đường chặng', () => {
    const moi = the({ ten: 'Lớp 10 · Chương 2 · Bài 5', tenLop: 'Lớp 10', nhom: N({ chuaMo: 8, dungNhip: 22 }), chang: [{ so: 1, ngay: '2026-09-21', laHomNay: true }] })
    expect(moi).toMatchObject({ ten: 'Lớp 10 · Chương 2 · Bài 5', coTenMoi: true, tenLop: 'Lớp 10', nhom: N({ chuaMo: 8, dungNhip: 22 }), chiaChang: true, mucCanY: 8 })
    const cu = the({})
    expect(cu).toMatchObject({ coTenMoi: false, nhom: null, chiaChang: false, mucCanY: 0 })
    expect(cu.ten).toMatch(/^CU-DE/)
  })
  it('nhiều dòng cùng lần giao (nhiều ca + Riêng): CỘNG số nhóm; MỘT dòng thiếu nhóm ⇒ null (không cộng nửa vời); tên lớp gộp không trùng; chặng của dòng đầu có chặng', () => {
    const chung = { giaoLuc: '2026-09-21T03:48:00.000Z', maDe: 'DE-X' }
    const a = dong({ ...chung, maCa: '111', tenLop: 'Lớp 10', ten: 'Lớp 10 · Bài 1', nhom: N({ chuaMo: 2, chamNhip: 1, daNop: 3 }), tong: 6 })
    const b = dong({ ...chung, maCa: 'Riêng', tenLop: 'Lớp 10', ten: 'Lớp 10 · Bài 1', nhom: N({ chuaMo: 1, dungNhip: 4, nopTre: 1, daNop: 1 }), tong: 6, chang: [{ so: 1, ngay: '2026-09-21', laHomNay: true }] })
    const g = nhomBtvn([a, b])
    expect(g.length).toBe(1)
    const t = baiChoThe(g[0]!, () => 'x')
    expect(t.nhom).toEqual(N({ chuaMo: 3, dungNhip: 4, chamNhip: 1, daNop: 4, nopTre: 1 }))
    expect(t.tenLop).toBe('Lớp 10')
    expect(t.chang.length).toBe(1)
    const thieu = nhomBtvn([a, { ...b, nhom: undefined }])
    expect(baiChoThe(thieu[0]!, () => 'x').nhom).toBeNull()
  })
})

describe('tên bài: máy chủ trả ten KHÔNG kèm lớp', () => {
  it('một lớp ⇒ thẻ đọc "Lớp 10 · Chương 2 · Bài 5"; đã có lớp trong tên ⇒ không lặp; nhiều lớp / không lớp ⇒ giữ nguyên tên', () => {
    expect(the({ ten: 'Chương 2 · Bài 5', tenLop: 'Lớp 10' }).ten).toBe('Lớp 10 · Chương 2 · Bài 5')
    expect(the({ ten: 'Lớp 10 · Chương 2 · Bài 5', tenLop: 'Lớp 10' }).ten).toBe('Lớp 10 · Chương 2 · Bài 5')
    expect(the({ ten: 'Chương 2 · Bài 5', tenLop: '' }).ten).toBe('Chương 2 · Bài 5')
    const chung = { giaoLuc: '2026-09-21T03:48:00.000Z', maDe: 'DE-Y' }
    const g = nhomBtvn([dong({ ...chung, ten: 'Bài 5', tenLop: 'Lớp 10' }), dong({ ...chung, ten: 'Bài 5', tenLop: 'Lớp 11' })])
    expect(baiChoThe(g[0]!, () => 'x').ten).toBe('Bài 5') // hai lớp: không đoán
  })
})

describe('sắp thẻ + dải "cần thầy để ý"', () => {
  it('sắp: mức cần để ý (chậm × 2 + chưa mở) giảm dần, rồi hạn gần trước, rồi giao muộn trước; ổn định; máy cũ (0) xuống cuối', () => {
    const a = the({ nhom: N({ chuaMo: 4 }), hanNop: '2026-09-25T05:00:00.000Z' }) // 4
    const b = the({ nhom: N({ chamNhip: 2 }), hanNop: '2026-09-26T05:00:00.000Z' }) // 4, hạn muộn hơn a
    const c = the({ nhom: N({ chamNhip: 3 }) }) // 6
    const d = the({}) // máy cũ: 0
    const e = the({ nhom: N({ dungNhip: 9 }), hanNop: '2026-09-23T05:00:00.000Z' }) // 0, hạn gần
    expect(mucCanYCuaNhom(N({ chamNhip: 2, chuaMo: 1 }))).toBe(5)
    expect(sapXepThe([d, a, e, b, c]).map((x) => x.khoa)).toEqual([c.khoa, a.khoa, b.khoa, e.khoa, d.khoa])
  })
  it('ô nào = 0 thì ẨN; số em cộng qua các bài, số bài đếm bài có em; hạn gần nhất bỏ bài đã nộp hết / qua hạn', () => {
    const now = vn('2026-09-22T10:00')
    const bai = [the({ nhom: N({ chuaMo: 5, chamNhip: 0, dungNhip: 5 }), hanNop: new Date(vn('2026-09-24T12:00')).toISOString() }), the({ nhom: N({ chuaMo: 3, chamNhip: 4 }), hanNop: new Date(vn('2026-09-25T12:00')).toISOString() }), the({ nhom: N({ daNop: 10 }), tong: 10, daNop: 10, hanNop: new Date(vn('2026-09-22T12:00')).toISOString() }), the({ nhom: N({ dungNhip: 10 }), hanNop: new Date(vn('2026-09-20T12:00')).toISOString() })]
    const d = daiCanYNhu(bai, now)
    expect(d.chuaMo).toEqual({ em: 8, bai: 2 })
    expect(d.chamNhip).toEqual({ em: 4, bai: 1 })
    expect(d.hanGanNhat).toMatchObject({ chu: 'còn 2 ngày 2 giờ', cam: false })
    expect(d.moiBaiDungNhip).toBe(false)
    const sach = daiCanYNhu([the({ nhom: N({ daNop: 6 }), tong: 6, daNop: 6, hanNop: new Date(vn('2026-09-20T12:00')).toISOString() })], now) // đã nộp hết, hạn đã qua
    expect(sach).toMatchObject({ chuaMo: null, chamNhip: null, chuaNopQuaHan: null, hanGanNhat: null, coDuNhom: true, moiBaiDungNhip: true })
  })
  it('thiếu nhóm của MỘT bài (máy cũ) ⇒ KHÔNG nói "mọi bài đúng nhịp" (không biết); hạn dưới 6 giờ ⇒ cam', () => {
    const now = vn('2026-09-22T10:00')
    const d = daiCanYNhu([the({ nhom: N({ dungNhip: 4 }), hanNop: new Date(vn('2026-09-22T14:30')).toISOString() }), the({})], now)
    expect(d.coDuNhom).toBe(false)
    expect(d.moiBaiDungNhip).toBe(false)
    expect(d.hanGanNhat).toMatchObject({ chu: 'còn 4 giờ 30 phút', cam: true })
    expect(daiCanYNhu([], now).moiBaiDungNhip).toBe(false)
  })
})

describe('bài QUÁ HẠN còn em chưa nộp (Boss soát 21/09: không được nói "mọi bài đúng nhịp")', () => {
  const now = vn('2026-09-22T10:00')
  const qua = new Date(vn('2026-09-21T12:00')).toISOString()
  it('chuaNopQuaHan = tổng − đã nộp CHỈ khi hạn đã qua; chưa quá hạn / không hạn ⇒ 0', () => {
    expect(chuaNopQuaHan({ hanMs: vn('2026-09-21T12:00'), tong: 10, daNop: 7 }, now)).toBe(3)
    expect(chuaNopQuaHan({ hanMs: vn('2026-09-23T12:00'), tong: 10, daNop: 7 }, now)).toBe(0)
    expect(chuaNopQuaHan({ hanMs: now, tong: 10, daNop: 7 }, now)).toBe(3) // đúng lúc hết hạn: coi là quá hạn
    expect(chuaNopQuaHan({ hanMs: null, tong: 10, daNop: 7 }, now)).toBe(0)
    expect(chuaNopQuaHan({ hanMs: vn('2026-09-21T12:00'), tong: 10, daNop: 12 }, now)).toBe(0)
  })
  it('bài KHÔNG chia chặng quá hạn, em đang làm dở (không chưa mở, không chậm nhịp) ⇒ ô "chưa nộp quá hạn", KHÔNG "mọi bài đúng nhịp"', () => {
    const d = daiCanYNhu([the({ nhom: N({ dungNhip: 4, daNop: 6 }), tong: 10, daNop: 6, hanNop: qua })], now)
    expect(d.chuaNopQuaHan).toEqual({ em: 4, bai: 1 })
    expect(d.chuaMo).toBeNull()
    expect(d.chamNhip).toBeNull()
    expect(d.moiBaiDungNhip).toBe(false)
  })
  it('máy chủ cũ (không nhóm) quá hạn còn em chưa nộp: vẫn hiện ô (chỉ cần tổng / đã nộp); cộng qua bài', () => {
    const d = daiCanYNhu([the({ tong: 10, daNop: 6, hanNop: qua }), the({ tong: 8, daNop: 8, hanNop: qua }), the({ nhom: N({ chuaMo: 2, dungNhip: 3, daNop: 5 }), tong: 10, daNop: 5, hanNop: qua })], now)
    expect(d.chuaNopQuaHan).toEqual({ em: 9, bai: 2 })
    expect(d.coDuNhom).toBe(false)
  })
  it('em chưa nộp cho ngăn: có nhóm ⇒ khác "đã nộp"; máy cũ ⇒ chưa có giờ nộp; tab "chua_nop" lọc đúng và đếm đúng', () => {
    expect(laChuaNop({ nhom: 'dung_nhip', nopLuc: null })).toBe(true)
    expect(laChuaNop({ nhom: 'da_nop', nopLuc: null })).toBe(false)
    expect(laChuaNop({ nhom: undefined, nopLuc: null })).toBe(true)
    expect(laChuaNop({ nhom: undefined, nopLuc: '2026-09-21T01:00:00Z' })).toBe(false)
    const hs = [em('S1', 'An', 'dung_nhip'), em('S2', 'Bình', 'da_nop', { nopLuc: '2026-09-21T01:00:00Z' }), em('S3', 'Chi', 'chua_mo'), em('S4', 'Dũng', undefined, { nopLuc: null })]
    expect(emTheoNhom(hs, 'chua_nop').map((e) => e.sbd)).toEqual(['S1', 'S3', 'S4'])
    expect(demEmTheoNhom(hs).chuaNop).toBe(3)
  })
})

describe('chữ hạn nộp + đếm ngược (giờ VN)', () => {
  it('chuHanNop: "12:00 Thứ Năm 24/09"; đếm ngược theo phút; dưới 6 giờ cam; qua hạn', () => {
    expect(chuHanNop(Date.parse('2026-09-24T05:00:00Z'))).toBe('12:00 Thứ Năm 24/09')
    expect(chuHanNop(null)).toBe('Chưa có hạn hợp lệ')
    const han = vn('2026-09-24T12:00')
    expect(demNguocHan(han, vn('2026-09-22T18:45'))).toEqual({ chu: 'còn 1 ngày 17 giờ', cam: false, qua: false })
    expect(demNguocHan(han, vn('2026-09-21T19:00'))).toEqual({ chu: 'còn 2 ngày 17 giờ', cam: false, qua: false }) // đúng số của mẫu phác (65 giờ)
    expect(demNguocHan(han, han - (47 * 60 + 30) * 60_000)).toEqual({ chu: 'còn 1 ngày 23 giờ', cam: false, qua: false }) // 2 850 phút: sát biên 2 ngày (bắt nhầm hệ số ngày)
    expect(demNguocHan(han, vn('2026-09-24T06:48'))).toEqual({ chu: 'còn 5 giờ 12 phút', cam: true, qua: false })
    expect(demNguocHan(han, vn('2026-09-24T11:18'))).toEqual({ chu: 'còn 42 phút', cam: true, qua: false })
    expect(demNguocHan(han, han - 1000)).toEqual({ chu: 'còn 1 phút', cam: true, qua: false })
    expect(demNguocHan(han, han)).toEqual({ chu: 'Đã qua hạn', cam: false, qua: true })
    expect(demNguocHan(han, vn('2026-09-24T06:00')).cam).toBe(false) // đúng 6 giờ: chưa cam
    expect(demNguocHan(null, 0).qua).toBe(false)
  })
})

describe('đường chặng', () => {
  it('nhãn có ngày: hôm nay / thứ / hôm qua / ngày mai / dd/mm; trạng thái theo cờ hôm nay của máy chủ', () => {
    const now = vn('2026-09-22T10:00') // Thứ Ba 22/09
    const c = duongChang([{ so: 1, ngay: '2026-09-21', laHomNay: false }, { so: 2, ngay: '2026-09-22', laHomNay: true }, { so: 3, ngay: '2026-09-23', laHomNay: false }, { so: 4, ngay: '2026-09-25', laHomNay: false }, { so: 5, ngay: '2026-10-05', laHomNay: false }], now)
    expect(c.map((x) => x.nhan)).toEqual(['Chặng 1 · hôm qua', 'Chặng 2 · hôm nay', 'Chặng 3 · ngày mai', 'Chặng 4 · Thứ Sáu', 'Chặng 5 · 05/10'])
    expect(c.map((x) => x.trangThai)).toEqual(['qua', 'nay', 'toi', 'toi', 'toi'])
    // không cờ nào ⇒ so với ngày VN của bây giờ
    expect(duongChang([{ so: 1, ngay: '2026-09-20', laHomNay: false }, { so: 2, ngay: '2026-09-24', laHomNay: false }], now).map((x) => x.trangThai)).toEqual(['qua', 'toi'])
  })
})

describe('thanh nhóm', () => {
  it('bài chia chặng: 5 nhóm, "đã nộp" CHỈ khi > 0; đoạn 0 bỏ khỏi thanh nhưng còn ở chú giải; nhãn đúng', () => {
    const t = thanhNhom(N({ chuaMo: 8, dungNhip: 22, chamNhip: 6, xongHomNay: 8 }), true)
    expect(t.doan.map((d) => `${d.khoa}:${d.so}:${d.sac}`)).toEqual(['chua_mo:8:xam', 'dung_nhip:22:duong', 'cham_nhip:6:cam', 'xong_hom_nay:8:la'])
    expect(t.chuGiai.map((d) => d.nhan)).toEqual(['chưa mở', 'đúng nhịp', 'chậm nhịp', 'xong chặng hôm nay'])
    expect(t.tong).toBe(44)
    expect(Math.round(t.doan[1]!.phanTram)).toBe(50)
    const co = thanhNhom(N({ chuaMo: 0, dungNhip: 5, daNop: 3, nopTre: 1 }), true)
    expect(co.doan.map((d) => d.khoa)).toEqual(['dung_nhip', 'da_nop'])
    expect(co.chuGiai.map((d) => `${d.nhan} ${d.so}`)).toEqual(['chưa mở 0', 'đúng nhịp 5', 'chậm nhịp 0', 'xong chặng hôm nay 0', 'đã nộp cả bài 3'])
  })
  it('bài KHÔNG chia chặng nhưng QUÁ HẠN (máy chủ đặt em chưa nộp vào chậm nhịp): thêm đoạn "quá hạn chưa nộp"; chamNhip = 0 thì không có đoạn/mục ấy', () => {
    const t = thanhNhom(N({ chuaMo: 2, dungNhip: 3, chamNhip: 4, daNop: 1 }), false)
    expect(t.chuGiai.map((d) => `${d.nhan} ${d.so}`)).toEqual(['chưa mở 2', 'đang làm 3', 'quá hạn chưa nộp 4', 'đã nộp 1'])
    expect(t.doan.map((d) => d.sac)).toEqual(['xam', 'duong', 'cam', 'la_dam'])
    expect(t.tong).toBe(10)
    expect(thanhNhom(N({ chuaMo: 2, dungNhip: 3 }), false).chuGiai.map((d) => d.nhan)).toEqual(['chưa mở', 'đang làm'])
  })
  it('bài KHÔNG chia chặng: chưa mở · đang làm · đã nộp', () => {
    const t = thanhNhom(N({ chuaMo: 3, dungNhip: 5, daNop: 2 }), false)
    expect(t.chuGiai.map((d) => d.nhan)).toEqual(['chưa mở', 'đang làm', 'đã nộp'])
    expect(t.doan.map((d) => d.so)).toEqual([3, 5, 2])
  })
  it('đoạn hẹp (< ngưỡng) đánh dấu hep để số ra chú giải; tổng bằng 0 ⇒ không đoạn', () => {
    const t = thanhNhom(N({ chuaMo: 1, dungNhip: 40 }), true)
    expect(t.doan.map((d) => d.hep)).toEqual([true, false])
    expect(NGUONG_DOAN_HEP).toBeGreaterThan(0)
    expect(thanhNhom(N(), true).doan).toEqual([])
  })
  it('TÍNH CHẤT 2 000 ca: tổng % = 100, mỗi đoạn giữ đúng số máy chủ, không đoạn 0, thứ tự cố định', () => {
    const r = mulberry32(21)
    const ORDER = ['chua_mo', 'dung_nhip', 'cham_nhip', 'xong_hom_nay', 'da_nop']
    for (let i = 0; i < 2000; i++) {
      const n = N({ chuaMo: Math.floor(r() * 30), dungNhip: Math.floor(r() * 30), chamNhip: Math.floor(r() * 30), xongHomNay: Math.floor(r() * 30), daNop: Math.floor(r() * 30) })
      const t = thanhNhom(n, r() < 0.7)
      if (t.doan.length === 0) { expect(t.tong).toBe(0); continue }
      expect(Math.abs(t.doan.reduce((s, d) => s + d.phanTram, 0) - 100)).toBeLessThan(1e-9)
      expect(t.doan.every((d) => d.so > 0)).toBe(true)
      const idx = t.doan.map((d) => ORDER.indexOf(d.khoa))
      expect(idx).toEqual([...idx].sort((a, b) => a - b))
    }
  })
  it('soEmCanY = chưa mở + chậm nhịp (đọc số máy chủ); máy cũ ⇒ 0', () => {
    expect(soEmCanY(N({ chuaMo: 8, chamNhip: 6, dungNhip: 22 }))).toBe(14)
    expect(soEmCanY(null)).toBe(0)
  })
})

describe('ngăn danh sách em', () => {
  const ds = [em('S3', 'Trần Văn Bình', 'cham_nhip', { changHienTai: 2, soCauDaLam: 14, soCauCuaEm: 32, hocGanNhat: '2026-09-22T13:41:00.000Z' }), em('S1', 'Nguyễn Thị An', 'chua_mo'), em('S2', 'Lê Đức Anh', 'dung_nhip'), em('S4', 'Phạm Văn Cường', 'da_nop', { nopTreGio: 5 }), em('S5', 'Bị Thu Hồi', 'chua_mo', { thuHoi: true })]
  it('lọc theo nhóm và ô tìm không dấu (tên / số báo danh); thu hồi bỏ; sắp theo tên gọi rồi họ tên (không xếp hạng em)', () => {
    expect(emTheoNhom(ds, 'tat_ca').map((e) => e.sbd)).toEqual(['S1', 'S2', 'S3', 'S4']) // tên gọi: An < Anh < Bình < Cường
    expect(emTheoNhom(ds, 'chua_mo').map((e) => e.sbd)).toEqual(['S1'])
    expect(emTheoNhom(ds, 'can_y').map((e) => e.sbd)).toEqual(['S1', 'S3']) // chưa mở + chậm nhịp
    expect(emTheoNhom(ds, 'tat_ca', 'duc anh').map((e) => e.sbd)).toEqual(['S2'])
    expect(emTheoNhom(ds, 'tat_ca', 's3').map((e) => e.sbd)).toEqual(['S3'])
    expect(emTheoNhom(ds, 'tat_ca', 'ĐỨC').length).toBe(1)
    expect(emKhopTim({ sbd: 'S9', hoTen: 'Đặng Văn Đô' }, 'dang van do')).toBe(true)
    expect(emTheoNhom(undefined, 'tat_ca')).toEqual([])
  })
  it('đếm tab theo nhóm của từng em (máy chủ tính); thiếu nhóm ở một em ⇒ coNhom = false', () => {
    expect(demEmTheoNhom(ds)).toEqual({ tatCa: 4, canY: 2, chuaNop: 3, theo: { chua_mo: 1, dung_nhip: 1, cham_nhip: 1, xong_hom_nay: 0, da_nop: 1 }, coNhom: true })
    expect(demEmTheoNhom([...ds, em('S6', 'Cũ Không Nhóm', undefined)]).coNhom).toBe(false)
    expect(demEmTheoNhom(ds, 'thi').tatCa).toBe(1) // chỉ Nguyễn Thị An (em thu hồi không đếm)
  })
  it('học gần nhất, tiến độ, nộp trễ', () => {
    const now = vn('2026-09-22T21:00')
    expect(chuHocGanNhat(null, now)).toBe('chưa mở')
    expect(chuHocGanNhat('bậy', now)).toBe('chưa mở')
    expect(chuHocGanNhat(new Date(vn('2026-09-22T20:41')).toISOString(), now)).toBe('hôm nay 20:41')
    expect(chuHocGanNhat(new Date(vn('2026-09-21T23:59')).toISOString(), now)).toBe('hôm qua 23:59')
    expect(chuHocGanNhat(new Date(vn('2026-09-20T08:00')).toISOString(), now)).toBe('2 ngày trước')
    expect(chuTienDoEm({ changHienTai: 2, soCauDaLam: 14, soCauCuaEm: 32 })).toBe('Chặng 2 · 14/32 câu')
    expect(chuTienDoEm({ changHienTai: null, soCauDaLam: 0, soCauCuaEm: null })).toBe('0 câu')
    expect(chuTienDoEm({ changHienTai: 1 })).toBe('Chặng 1')
    expect(chuTienDoEm({})).toBe('')
    expect(chuNopTre(5)).toBe('nộp trễ 5 giờ')
    expect(chuNopTre(0)).toBe('')
    expect(chuNopTre(undefined)).toBe('')
  })
})

describe('bộ lọc lớp + ô tìm chung', () => {
  const b10 = the({ tenLop: 'Lớp 10', nhom: N({ dungNhip: 2 }), hocSinh: [em('A1', 'Hoàng Văn Nam', 'dung_nhip'), em('A2', 'Vũ Thị Hoa', 'dung_nhip')] })
  const b12 = the({ tenLop: 'Lớp 12', nhom: N({ chuaMo: 1 }), hocSinh: [em('B1', 'Hoàng Thị Lan', 'chua_mo')] })
  const bao = [b10, b12]
  const emCua = (k: string) => (k === b10.khoa ? [em('A1', 'Hoàng Văn Nam', 'dung_nhip'), em('A2', 'Vũ Thị Hoa', 'dung_nhip')] : [em('B1', 'Hoàng Thị Lan', 'chua_mo')])
  it('lớp: tên chuẩn không trùng; lọc theo lớp; ô tìm ⇒ CHỈ bài có em khớp và em đầu để mở sẵn ngăn', () => {
    expect(lopCuaCacBai(bao)).toEqual(['Lớp 10', 'Lớp 12'])
    expect(locBai(bao, emCua, '', '').map((x) => x.bai.khoa)).toEqual([b10.khoa, b12.khoa])
    expect(locBai(bao, emCua, 'Lớp 12', '').map((x) => x.bai.khoa)).toEqual([b12.khoa])
    const t = locBai(bao, emCua, '', 'hoang')
    expect(t.map((x) => x.bai.khoa)).toEqual([b10.khoa, b12.khoa])
    expect(t[0]!.emDau?.sbd).toBe('A1')
    const chi = locBai(bao, emCua, '', 'vu thi')
    expect(chi.map((x) => x.bai.khoa)).toEqual([b10.khoa])
    expect(chi[0]!.emDau?.sbd).toBe('A2')
    expect(locBai(bao, emCua, '', 'không ai').length).toBe(0)
    expect(locBai(bao, emCua, 'Lớp 10', 'lan').length).toBe(0) // đúng em nhưng khác lớp
  })
})
