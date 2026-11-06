// Bình Phản Ứng — luật phòng thuần (src/lib/bpu/phong.ts). Khoá bất biến: máy em KHÔNG nhận đáp án trước khi mở; khoá bài trước khi phát đáp án.
import { describe, expect, it } from 'vitest'
import {
  KJ, chamLenBang, chiaDoi, diemDoi, duDoan, goiLenBang, kyHieu, lamBang, moDapAn, moLuot, nhanTra, roiMan, taoPhong, tenNgan, tiepSuc, vaoLop, viewBang, viewEm, xepDoi,
} from '../src/lib/bpu/phong'

const T0 = Date.parse('2026-11-06T12:00:00Z')
const chamSo = (a: string, b: string) => a.replace(',', '.') === b.replace(',', '.')
const ds = Array.from({ length: 12 }, (_, i) => ({ sbd: `S${i + 1}`, ten: `Nguyễn Văn Em${i + 1}`, coMat: i < 10, luc: T0 + i * 1000 }))
const phong = () => taoPhong({ buoiId: 'b1', lop: '12A1', nay: T0, ds })
const cauTN = { qid: 'q1', phan: 'I' as const, tuLuan: false, cau: { qid: 'q1', text: 'Chất nào là amine bậc hai?', choices: ['a', 'b', 'c', 'd'] }, dung: 'B', hanGiay: 60 }

describe('chia đội', () => {
  it('bốn đội lệch nhau tối đa một bạn, cố định theo tháng', () => {
    const s = Array.from({ length: 31 }, (_, i) => `X${i}`)
    const a = chiaDoi(s, '2026-11'), b = chiaDoi([...s].reverse(), '2026-11')
    const dem = [0, 0, 0, 0]; for (const v of a.values()) dem[v]!++
    expect(Math.max(...dem) - Math.min(...dem)).toBeLessThanOrEqual(1)
    expect([...a.entries()].every(([k, v]) => b.get(k) === v)).toBe(true)
  })
  it('chữ trên ô', () => { expect(kyHieu('Phan Hoài Nam')).toBe('Na'); expect(kyHieu('Lê Đạt')).toBe('Da'); expect(tenNgan('Nguyễn Minh Anh')).toBe('Minh Anh') })
})

describe('điểm danh', () => {
  it('mỗi em vào +10 cho đội; đội đủ quân đầu tiên +50; em lạ bị từ chối', () => {
    const st = taoPhong({ buoiId: 'b', lop: 'L', nay: T0, ds: ds.map((x) => ({ ...x, coMat: false })) })
    expect(vaoLop(st, 'S1', T0)).toBe(true)
    expect(st.doiThuong[st.ds[0]!.doi]).toBe(KJ.vaoLop)
    expect(vaoLop(st, 'LA', T0)).toBe(false)
    for (const e of st.ds) vaoLop(st, e.sbd, T0)
    expect(st.doiDu).not.toBeNull()
    expect(st.doiThuong[st.doiDu!]).toBe(KJ.vaoLop * st.ds.filter((e) => e.doi === st.doiDu).length + KJ.duQuanDau)
  })
})

describe('một lượt', () => {
  it('máy em KHÔNG có đáp án trước khi mở, có sau khi mở', () => {
    const st = phong(); moLuot(st, cauTN, T0)
    nhanTra(st, 'S1', 'B', T0 + 5000)
    for (const pha of ['tra-loi', 'goi', 'lam-bang'] as const) {
      if (pha === 'goi') goiLenBang(st, 'S2', ['Lý do'], T0 + 9000)
      if (pha === 'lam-bang') lamBang(st, T0 + 9500)
      const s = JSON.stringify(viewEm(st, 'S1'))
      expect(s).not.toContain('"dung"')
      expect(JSON.stringify(viewBang(st))).not.toContain('"dung"')
    }
    moDapAn(st, T0 + 10000, chamSo)
    expect(viewEm(st, 'S1').luot?.dung).toBe('B')
  })
  it('chỉ nhận lần gửi đầu; khoá sau khi mở; quá hạn bị từ chối', () => {
    const st = phong(); moLuot(st, cauTN, T0)
    expect(nhanTra(st, 'S1', 'B', T0 + 1000)).toEqual({ ok: true })
    expect(nhanTra(st, 'S1', 'C', T0 + 2000)).toEqual({ ok: false, ly: 'da-gui' })
    expect(nhanTra(st, 'S2', 'B', T0 + 63_000)).toEqual({ ok: false, ly: 'het-gio' })
    expect(nhanTra(st, 'LA', 'B', T0 + 1000)).toEqual({ ok: false, ly: 'la' })
    moDapAn(st, T0 + 5000, chamSo)
    expect(nhanTra(st, 'S3', 'B', T0 + 6000)).toEqual({ ok: false, ly: 'da-khoa' })
  })
  it('kJ: đúng 100 + nhanh, sai 0; năng lượng hoạt hoá khi ≥ 75% có mặt đúng', () => {
    const st = phong(); moLuot(st, cauTN, T0)
    for (let i = 1; i <= 8; i++) nhanTra(st, `S${i}`, 'B', T0 + i * 1000)
    nhanTra(st, 'S9', 'A', T0 + 9000)
    moDapAn(st, T0 + 20_000, chamSo)
    const l = st.luot!
    expect(l.kich).toBe(true) // 8/10 có mặt
    expect(l.ketQua!.S1!.dung).toBe(true)
    expect(l.ketQua!.S1!.nhanh).toBe(1)
    expect(l.ketQua!.S1!.kj).toBe(KJ.dung + Math.round(50 * (1 - 1000 / 60000)) + KJ.kichHoat)
    expect(l.ketQua!.S9!.kj).toBe(KJ.kichHoat)
  })
  it('Đúng–sai: 25 kJ mỗi ý, đủ 4 ý mới cộng nhanh', () => {
    const st = phong(); moLuot(st, { ...cauTN, phan: 'II', dung: 'DSDD' }, T0)
    nhanTra(st, 'S1', 'DSDS', T0 + 1000); nhanTra(st, 'S2', 'DSDD', T0 + 1000)
    moDapAn(st, T0 + 5000, chamSo)
    expect(st.luot!.ketQua!.S1).toMatchObject({ dung: false, soY: 3, kj: 75 })
    expect(st.luot!.ketQua!.S2!.kj).toBe(100 + Math.round(50 * (1 - 1000 / 60000)))
  })
  it('tự luận: không chấm, chỉ đếm làm xong', () => {
    const st = phong(); moLuot(st, { ...cauTN, tuLuan: true, dung: '' }, T0)
    expect(nhanTra(st, 'S1', '', T0 + 1000)).toEqual({ ok: true })
    moDapAn(st, T0 + 2000, chamSo)
    expect(st.luot!.ketQua!.S1!.kj).toBe(0)
    expect(st.luot!.kich).toBe(false)
  })
})

describe('gọi lên bảng, đoán, tiếp sức, rời màn', () => {
  it('Đạt ⇒ đội +200, đoán đúng +20; tiếp sức tối đa 10; em được gọi không tự đoán', () => {
    const st = phong(); moLuot(st, cauTN, T0)
    expect(goiLenBang(st, 'S3', ['a', 'b', 'c', 'd'], T0)).toBe(true)
    expect(st.luot!.goi!.lyDo).toHaveLength(3)
    expect(duDoan(st, 'S3', 1, T0)).toBe(false)
    duDoan(st, 'S1', 1, T0); duDoan(st, 'S2', 0, T0)
    for (let i = 0; i < 15; i++) tiepSuc(st, 'S1', T0)
    expect(st.luot!.goi!.tiep.S1).toBe(10)
    const doi = st.ds.find((e) => e.sbd === 'S3')!.doi, truoc = diemDoi(st, doi)
    chamLenBang(st, true, T0)
    moDapAn(st, T0 + 1000, chamSo)
    expect(diemDoi(st, doi) - truoc).toBeGreaterThanOrEqual(KJ.lenBangDat)
    expect(st.ds.find((e) => e.sbd === 'S1')!.kj).toBe(KJ.doanDung)
    expect(st.ds.find((e) => e.sbd === 'S2')!.kj).toBe(0)
  })
  it('rời màn −20 cho đội, đếm lần, ghi vào lượt', () => {
    const st = phong(); moLuot(st, cauTN, T0)
    const d = st.ds[0]!.doi, truoc = st.doiThuong[d]!
    roiMan(st, 'S1', T0); roiMan(st, 'S1', T0)
    expect(st.doiThuong[d]).toBe(truoc + 2 * KJ.roiMan)
    expect(st.ds[0]!.roi).toBe(2)
    expect(st.luot!.roiMe).toEqual(['S1'])
  })
  it('xếp đội theo tổng kJ (con số hiện trên bảng)', () => {
    const st = phong()
    const x = xepDoi(st)
    expect(x).toHaveLength(4)
    expect(x[0]!.tong).toBeGreaterThanOrEqual(x[3]!.tong)
  })
})
