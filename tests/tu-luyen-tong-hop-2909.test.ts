// @vitest-environment node
// TU LUYỆN — lõi dùng chung (29/09): chấm câu theo luật chung, câu công khai không lộ đáp án, thanh chọn giữ luật kẹp cũ, TỔNG HỢP ĐÁNH GIÁ tính đúng.
import { describe, expect, it } from 'vitest'
import {
  cauCongKhaiTu,
  chamCauTuLuyen,
  kepSoCauCheDo2,
  kepSoCauCheDo3,
  kepSoCauCheDo4,
  loiGiaiTuCauRieng,
  ngaySoVn,
  timDangTrongDanhMuc,
  tongHopTuLuyen,
  type DongCauTuLuyen,
  type DongLuotTuLuyen,
} from '../src/lib/tu-luyen'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'

describe('chấm một câu', () => {
  it('Phần I: chữ A–D, không phân biệt hoa/thường; bỏ trống sai', () => {
    expect(chamCauTuLuyen('I', 'B', 'b')).toEqual({ dung: true, diem: 1 })
    expect(chamCauTuLuyen('I', 'B', 'C').dung).toBe(false)
    expect(chamCauTuLuyen('I', 'B', '').dung).toBe(false)
  })
  it('Phần II: từng ý Đ/S, điểm 0,1/0,25/0,5/1', () => {
    expect(chamCauTuLuyen('II', 'ĐSĐS', 'DSDS')).toEqual({ dung: true, diem: 1, yDung: 4 })
    expect(chamCauTuLuyen('II', 'DSDS', 'DSDD')).toEqual({ dung: false, diem: 0.5, yDung: 3 })
    expect(chamCauTuLuyen('II', 'DSDS', 'DD--')).toEqual({ dung: false, diem: 0.1, yDung: 1 })
    expect(chamCauTuLuyen('II', 'DSDS', '')).toEqual({ dung: false, diem: 0, yDung: 0 })
  })
  it('Phần III: một luật với ca thi (khopPhanIII) — "0,540" = "0,54", đơn vị viết theo, kí hiệu khoa học', () => {
    expect(chamCauTuLuyen('III', '0,54', '0,540').dung).toBe(true)
    expect(chamCauTuLuyen('III', '0,54', '0.54').dung).toBe(true)
    expect(chamCauTuLuyen('III', '12', '12 gam').dung).toBe(true)
    expect(chamCauTuLuyen('III', '0,0025', '2,5x10^-3').dung).toBe(true)
    expect(chamCauTuLuyen('III', '0,54', '0,55').dung).toBe(false)
    expect(chamCauTuLuyen('III', '12', '12abc').dung).toBe(false)
    expect(chamCauTuLuyen('III', '12', '').dung).toBe(false)
  })
})

describe('câu công khai + lời giải', () => {
  const c: CauLuyen = {
    phan: 'I', id: 'Q1', maDe: 'DH-12', chuyenDe: 'CD', dang: 'ly_thuyet', sao: 2, mucDo: 'biet', text: 'Đề', luaChon: ['a', 'b', 'c', 'd'],
    dapAn: 'B', chot: 'Chọn B', lyDo: [{ khoa: 'B', dung: true, ly: 'vì …' }], buoc: null, ketQua: '',
    chuaCho: { qid: 'Q1', soCau: 1, phan: 'I', maDang: 'X', bac: 1, daChon: 'A', viSaoSai: 'Em đã chọn A, đáp án đúng là B' },
  }
  it('không mang đáp án, lời giải, "đáp án đúng là"', () => {
    const k = cauCongKhaiTu(c, 'Dạng X')
    expect(JSON.stringify(k)).not.toMatch(/dapAn|chot|lyDo|chuaCho|đáp án đúng|Chọn B/)
    expect(k).toMatchObject({ qid: 'Q1', phan: 'I', tenDang: 'Dạng X', sao: 2, loai: 'ly_thuyet' })
  })
  it('lời giải có cấu trúc cho TheCau', () => {
    expect(loiGiaiTuCauRieng({ phan: 'I', chot: 'Chọn B', lyDo: c.lyDo, buoc: null, ketQua: '' })).toEqual({ chot: 'Chọn B', tungPa: { B: { dung: true, viSao: 'vì …' } } })
    expect(loiGiaiTuCauRieng({ phan: 'III', chot: '', lyDo: null, buoc: ['n = 0,1'], ketQua: '8,8' })).toEqual({ chot: '', buoc: ['n = 0,1'], ketQua: '8,8' })
    expect(loiGiaiTuCauRieng({ phan: 'I', chot: '', lyDo: null, buoc: null, ketQua: '' })).toBeUndefined()
  })
})

describe('thanh chọn số câu — luật kẹp của khối cũ', () => {
  it('chế độ 2/3/4', () => {
    expect(kepSoCauCheDo2(20, 7, 3)).toBe(7)
    expect(kepSoCauCheDo2(0, 50, 4)).toBe(8)
    expect(kepSoCauCheDo2(20, 0, 4)).toBe(0)
    expect(kepSoCauCheDo3(20, 100)).toBe(20)
    expect(kepSoCauCheDo3(2, 100)).toBe(5)
    expect(kepSoCauCheDo3(80, 100)).toBe(50)
    expect(kepSoCauCheDo3(20, 3)).toBe(3)
    expect(kepSoCauCheDo4(0, 100)).toBe(10) // v3: mặc định 10 câu/lượt
    expect(kepSoCauCheDo4(70, 100)).toBe(50)
    expect(kepSoCauCheDo4(20, 0)).toBe(0)
  })
})

describe('tổng hợp đánh giá', () => {
  const NGAY = 86_400_000
  const now = Date.parse('2026-09-29T20:00:00+07:00') // Thứ Ba
  const luc = (ngayTruoc: number) => now - ngayTruoc * NGAY
  const cau = (luotId: string, ngayTruoc: number, dung: boolean, o: Partial<DongCauTuLuyen> = {}): DongCauTuLuyen => ({
    luotId, cheDo: 3, luc: luc(ngayTruoc), qid: `${luotId}-${Math.random()}`, phan: 'I', dung, dangMa: 'DB-A', dangTen: 'Dạng A', bai: 'Bài 1', lop: '12', sao: 0, giay: 30, ...o,
  })
  const luot = (id: string, ngayTruoc: number, soCau: number, soDung: number): DongLuotTuLuyen => ({ id, cheDo: 3, tieuDe: id, taoLuc: luc(ngayTruoc), nopLuc: luc(ngayTruoc), soCau, soDung, giay: 120 })
  // Dạng A: lượt 1 (10 ngày trước) 1/4, lượt 3 (hôm nay) 4/4 ⇒ tiến bộ +75. Dạng B: 1/4 (hôm qua) ⇒ yếu nhất. Dạng C: 3/3 phần II sao 2.
  const dsCau: DongCauTuLuyen[] = [
    cau('L1', 10, true), cau('L1', 10, false), cau('L1', 10, false), cau('L1', 10, false),
    cau('L2', 1, true, { dangMa: '', dangTen: 'Dạng B' }), cau('L2', 1, false, { dangMa: '', dangTen: 'Dạng B' }), cau('L2', 1, false, { dangMa: '', dangTen: 'Dạng B' }), cau('L2', 1, false, { dangMa: '', dangTen: 'Dạng B' }),
    cau('L3', 0, true), cau('L3', 0, true), cau('L3', 0, true), cau('L3', 0, true),
    cau('L3', 0, true, { dangMa: 'DB-C', dangTen: 'Dạng C', phan: 'II', sao: 2 }), cau('L3', 0, true, { dangMa: 'DB-C', dangTen: 'Dạng C', phan: 'II', sao: 2 }), cau('L3', 0, true, { dangMa: 'DB-C', dangTen: 'Dạng C', phan: 'II', sao: 2 }),
  ]
  const dsLuot = [luot('L1', 10, 4, 1), luot('L2', 1, 4, 1), luot('L3', 0, 7, 7)]
  const t = tongHopTuLuyen(dsLuot, dsCau, now)

  it('tổng số, tỉ lệ, thời gian', () => {
    expect(t).toMatchObject({ soLuot: 3, soCau: 15, soDung: 9, tiLe: 60, tongGiay: 360, soNgayLuyen: 3 })
  })
  it('mạnh nhất / yếu nhất / tiến bộ nhiều nhất so với lần đầu', () => {
    expect(t.manhNhat?.ten).toBe('Dạng C')
    expect(t.yeuNhat?.ten).toBe('Dạng B')
    expect(t.tienBoNhat?.ten).toBe('Dạng A')
    const a = t.theoDang.find((d) => d.ten === 'Dạng A')!
    expect(a).toMatchObject({ soCau: 8, soDung: 5, soLuot: 2, tiLeDau: 25, tiLeCuoi: 100, tienBo: 75 })
    expect(t.theoDang.find((d) => d.ten === 'Dạng B')!.tienBo).toBeNull()
  })
  it('theo sao, theo phần, theo chế độ', () => {
    expect(t.theoSao['2']).toEqual({ soCau: 3, soDung: 3, tiLe: 100 })
    expect(t.theoSao['0']).toEqual({ soCau: 12, soDung: 6, tiLe: 50 })
    expect(t.theoPhan.II.soCau).toBe(3)
    expect(t.theoPhan.I).toEqual({ soCau: 12, soDung: 6, tiLe: 50 })
    expect(t.theoCheDo[3]).toMatchObject({ soLuot: 3, soCau: 15 })
  })
  it('theo tuần: 8 tuần, tuần này gồm hôm nay + hôm qua (Thứ Hai)', () => {
    expect(t.theoTuan).toHaveLength(8)
    expect(t.theoTuan[7]).toMatchObject({ soCau: 11, soDung: 8, nhan: '28/09' })
    expect(t.theoTuan[6].soCau).toBe(0)
    expect(t.theoTuan[5]).toMatchObject({ soCau: 4, soDung: 1, nhan: '14/09' }) // 19/09 thuộc tuần bắt đầu Thứ Hai 14/09
  })
  it('chuỗi ngày: hôm qua + hôm nay = 2; dài nhất 2', () => {
    expect(t.chuoiHienTai).toBe(2)
    expect(t.chuoiDaiNhat).toBe(2)
    // hôm nay chưa luyện, hôm qua có ⇒ chuỗi chưa đứt
    expect(tongHopTuLuyen([luot('X', 1, 1, 1)], [], now).chuoiHienTai).toBe(1)
    expect(tongHopTuLuyen([luot('X', 2, 1, 1)], [], now).chuoiHienTai).toBe(0)
  })
  it('gợi ý: dạng dưới 80 %, thấp nhất trước; dữ liệu rỗng không vỡ', () => {
    expect(t.goiY.map((d) => d.ten)).toEqual(['Dạng B', 'Dạng A'])
    const rong = tongHopTuLuyen([], [], now)
    expect(rong).toMatchObject({ soCau: 0, tiLe: 0, manhNhat: null, yeuNhat: null, tienBoNhat: null, chuoiHienTai: 0, goiY: [] })
  })
  it('ngày theo giờ Việt Nam', () => {
    expect(ngaySoVn(Date.parse('2026-09-29T23:30:00+07:00'))).toBe(ngaySoVn(Date.parse('2026-09-29T00:10:00+07:00')))
  })
  it('gợi ý bấm được: tìm dạng trong danh mục theo mã, rồi theo tên', () => {
    const dm = [{ lop: '12', bais: [{ tenBai: 'Bài 1. Ester', dangs: [{ ma: 'DB-12-B1-D1', ten: 'Ester  đơn chức', soCau: 30 }] }] }]
    expect(timDangTrongDanhMuc(dm, 'DB-12-B1-D1', '')?.tenBai).toBe('Bài 1. Ester')
    expect(timDangTrongDanhMuc(dm, 'ES.A.X', 'ester đơn chức')?.dang.ma).toBe('DB-12-B1-D1')
    expect(timDangTrongDanhMuc(dm, 'ZZ', 'Khác')).toBeNull()
  })
})
