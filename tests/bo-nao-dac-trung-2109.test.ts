// BỘ NÃO — ĐẶC TRƯNG + PHÂN LUỒNG + ĐÁNH GIÁ (`src/lib/bo-nao-dac-trung.ts`, Code 1, 21/09/2026).
// Kiểm: thẻ tính đúng từng cửa sổ ngày · cờ thuật toán · phân luồng + xoay vòng 1/7 tất định · đánh giá điều chỉnh · mốc đáng khen · bức tranh lớp · không PII · nhỏ gọn · thuần.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  NGUONG_BO_NAO,
  chiSoNgay,
  danhGiaDieuChinh,
  hieuNgay,
  phanLuong,
  themNgay,
  tinhBucTranhLop,
  tinhDacTrung,
  toiLuotSoiKy,
  type CauEmNgan,
  type DangEmNgan,
  type DauVaoEm,
  type SuKienNgan,
  type TheNgan,
} from '../src/lib/bo-nao-dac-trung'
import { kiemKhuon, type DauRaEm } from '../src/lib/bo-nao-khuon'
import { mulberry32 } from '../src/lib/exam-shuffle'

const NGAY = '2026-09-22'
const ngayTruoc = (n: number) => themNgay(NGAY, -n)
const ev = (n: number, ketQua: 0 | 1 | null, o: Partial<SuKienNgan> = {}): SuKienNgan => ({ qid: `q${Math.random() > 2 ? 0 : 0}`, nguon: 'btvn', ketQua, giay: null, ngay: ngayTruoc(n), ...o })
/** `k` sự kiện trong ngày `n` ngày trước, `dung` đúng, còn lại sai; qid tuỳ ý; mã dạng gắn qua `cau`. */
function ngay(n: number, k: number, dung: number, o: Partial<SuKienNgan> = {}, tienTo = 'q'): SuKienNgan[] {
  return Array.from({ length: k }, (_, i) => ({ qid: `${tienTo}${n}-${i}`, nguon: 'btvn', ketQua: (i < dung ? 1 : 0) as 0 | 1, giay: null, ngay: ngayTruoc(n), ...o }))
}
const dang = (ma: string, bac: 0 | 1 | 2, soGap: number, soSai: number, soDaKhacPhuc = 0, soChuaThaySai = 0): DangEmNgan => ({ ma, bac, soGap, soSai, soDaKhacPhuc, soChuaThaySai })
const dauVao = (o: Partial<DauVaoEm> = {}): DauVaoEm => ({
  ngay: NGAY,
  sbd: '12007',
  lop: '12A1',
  ngayHoatDongCuoi: ngayTruoc(1),
  ngayHoatDongDau: ngayTruoc(40),
  suKien: [],
  cau: [],
  dang: [],
  noOn: 0,
  keHoach: [],
  btvn: [],
  exp: { tong: null, cap: null },
  caGanNhat: null,
  dieuChinhHomQua: null,
  ...o,
})
const the = (o: Partial<DauVaoEm> = {}) => tinhDacTrung(dauVao(o)).the

describe('ngày — thuần, không đồng hồ', () => {
  it('chỉ số ngày, cộng ngày, hiệu ngày (qua ranh tháng/năm nhuận), ngày sai ⇒ NaN / rỗng', () => {
    expect(themNgay('2026-09-22', -1)).toBe('2026-09-21')
    expect(themNgay('2026-03-01', -1)).toBe('2026-02-28')
    expect(themNgay('2028-03-01', -1)).toBe('2028-02-29')
    expect(themNgay('2026-12-31', 1)).toBe('2027-01-01')
    expect(hieuNgay('2026-09-22', '2026-09-15')).toBe(7)
    expect(Number.isNaN(chiSoNgay('2026/09/22'))).toBe(true)
    expect(themNgay('rác', 1)).toBe('')
  })
})

describe('thẻ — cửa sổ ngày và số đếm', () => {
  it('7 ngày = ngày−7..ngày−1 (KHÔNG tính hôm nay); 3 ngày gần; 4 ngày trước; hôm qua', () => {
    const suKien = [
      ...ngay(1, 6, 5), // hôm qua: 6 câu, 5 đúng
      ...ngay(2, 4, 4),
      ...ngay(3, 5, 3),
      ...ngay(5, 8, 6), // thuộc "4 ngày trước" (ngày−7..ngày−4)
      ...ngay(7, 2, 1),
      ...ngay(8, 30, 30), // NGOÀI cửa sổ
      ...ngay(0, 9, 0), // hôm nay: KHÔNG tính
    ]
    const t = the({ suKien })
    expect(t.cau).toEqual({ lam7: 25, dung7: 19, sai7: 6, tiLe7: 0.76, lam3: 15, tiLe3: 0.8, lam4Truoc: 10, lamHomQua: 6, dungHomQua: 5 })
    expect(t.hoatDong.ngayCoBai7).toBe(5)
  })
  it('câu bỏ trống (ketQua null) không tính là làm và không tính là sai', () => {
    const t = the({ suKien: [...ngay(1, 4, 2), ev(1, null), ev(1, null)] })
    expect(t.cau.lam7).toBe(4)
    expect(t.cau.sai7).toBe(2)
  })
  it('xu hướng: đủ ≥ 5 câu mỗi đoạn mới nói; lệch ≥ 10 điểm mới lên/xuống', () => {
    expect(the({ suKien: [...ngay(1, 6, 6), ...ngay(6, 6, 3)] }).xuHuong).toBe('len')
    expect(the({ suKien: [...ngay(1, 6, 3), ...ngay(6, 6, 6)] }).xuHuong).toBe('xuong')
    expect(the({ suKien: [...ngay(1, 6, 5), ...ngay(6, 6, 5)] }).xuHuong).toBe('on')
    expect(the({ suKien: [...ngay(1, 4, 4), ...ngay(6, 6, 3)] }).xuHuong).toBe('chua_du')
  })
  it('giây/câu: trung vị chỉ khi ≥ 5 mẫu; hôm qua tách riêng', () => {
    const g = (n: number, giay: number) => ngay(n, 1, 1, { giay })
    const suKien = [...[30, 40, 50, 60, 70].flatMap((x, i) => g(2 + (i % 4), x)), ...[10, 12, 14, 16, 18].flatMap((x) => g(1, x))]
    const t = the({ suKien })
    expect(t.giay.trungVi7).toBe(24) // trung vị của cả 10 mẫu trong cửa sổ (hôm qua nằm trong 7 ngày): (18 + 30) / 2
    expect(t.giay.homQua).toBe(14)
    expect(the({ suKien: g(1, 30).concat(g(2, 40)) }).giay).toEqual({ trungVi7: null, homQua: null })
  })
  it('nguồn: BTVN (gồm lô), ôn lại, game, còn lại; BTVN 2 ngày gần', () => {
    const suKien = [...ngay(1, 3, 3, { nguon: 'btvn' }), ...ngay(2, 2, 1, { nguon: 'btvn_lo' }), ...ngay(4, 4, 2, { nguon: 'btvn' }), ...ngay(1, 5, 5, { nguon: 'on_lai' }), ...ngay(3, 2, 2, { nguon: 'game' }), ...ngay(2, 1, 1, { nguon: 'thi' })]
    expect(the({ suKien }).nguon).toEqual({ btvn7: 9, btvn2: 5, onLai7: 5, game7: 2, khac7: 1 })
  })
  it('vắng: số ngày TRỌN VẸN không học tới hôm qua (học hôm qua ⇒ 0; hoạt động cuối cách 3 ngày ⇒ 2)', () => {
    expect(the({ ngayHoatDongCuoi: ngayTruoc(1) }).hoatDong.soNgayVang).toBe(0)
    expect(the({ ngayHoatDongCuoi: ngayTruoc(2) }).hoatDong.soNgayVang).toBe(1)
    expect(the({ ngayHoatDongCuoi: ngayTruoc(3) }).hoatDong.soNgayVang).toBe(2)
    expect(the({ ngayHoatDongCuoi: null }).hoatDong.soNgayVang).toBeGreaterThan(NGUONG_BO_NAO.KHONG_HOAT_DONG_BO_QUA)
  })
  it('chuỗi ngày đạt: đếm ngược, ngày nghỉ và chưa chốt không làm đứt, `mot_phan`/`khong` làm đứt', () => {
    const kh = (n: number, ketQua: 'dat' | 'mot_phan' | 'khong' | null, laNgayNghi = false) => ({ ngay: ngayTruoc(n), ketQua, laNgayNghi })
    expect(the({ keHoach: [kh(1, 'dat'), kh(2, 'dat'), kh(3, 'dat'), kh(4, 'khong')] }).chuoi).toBe(3)
    expect(the({ keHoach: [kh(1, 'dat'), kh(2, null, true), kh(3, 'dat'), kh(4, 'mot_phan'), kh(5, 'dat')] }).chuoi).toBe(2)
    expect(the({ keHoach: [kh(1, null), kh(2, 'dat')] }).chuoi).toBe(1)
    expect(the({ keHoach: [] }).chuoi).toBe(0)
    const t = the({ keHoach: [kh(1, 'dat'), kh(2, null, true), kh(3, 'khong')] })
    expect([t.datNgay7, t.ngayNghi7]).toEqual([1, 1])
  })
  it('BTVN, nợ ôn, EXP, ca thi gần nhất', () => {
    const t = the({ btvn: [{ changXong: 3, tongChang: 7 }, { changXong: 1, tongChang: 4 }], noOn: 12, exp: { tong: 1300, cap: 8 }, caGanNhat: { diem: 7.5, ngayNop: ngayTruoc(2) } })
    expect(t.btvn).toEqual({ baiMo: 2, changXong: 4, tongChang: 11 })
    expect([t.noOn, t.exp, t.ca]).toEqual([12, { tong: 1300, cap: 8 }, { diem: 7.5, ngayTruoc: 2 }])
    expect(the({ btvn: [{ changXong: 3, tongChang: null }] }).btvn.tongChang).toBeNull()
    expect(the({}).btvn).toEqual({ baiMo: 0, changXong: 0, tongChang: null })
  })
  it('dạng cần chú ý: sai nhiều trong 7 ngày trước, rồi tỉ lệ khắc phục thấp; ≤ 3 dạng; mã dạng tra qua bảng câu', () => {
    const cau: CauEmNgan[] = [...ngay(1, 5, 1, {}, 'a'), ...ngay(2, 4, 2, {}, 'b')].map((e) => ({ qid: e.qid, dang: e.qid.startsWith('a') ? 'ESTE.THUY_PHAN' : 'CARB.PHAN_LOAI', lanSai: 1, trangThai: 'moi_sai' as const }))
    const t = the({ suKien: [...ngay(1, 5, 1, {}, 'a'), ...ngay(2, 4, 2, {}, 'b')], cau, dang: [dang('ESTE.THUY_PHAN', 0, 8, 6), dang('CARB.PHAN_LOAI', 1, 6, 2, 3, 1), dang('LIPID.BEO', 1, 5, 4, 0, 0)] })
    expect(t.dangChuY.map((d) => d.ma)).toEqual(['ESTE.THUY_PHAN', 'CARB.PHAN_LOAI', 'LIPID.BEO'])
    expect(t.dangChuY[0]).toMatchObject({ ma: 'ESTE.THUY_PHAN', lam7: 5, sai7: 4, bac: 0, gap: 8, tiLeKhacPhuc: 0 })
    expect(t.dangChuY[1]).toMatchObject({ lam7: 4, sai7: 2, tiLeKhacPhuc: 0.67 })
    expect(t.maDang).toContain('ESTE.THUY_PHAN')
    expect(t.bacCuaMaDang[t.maDang.indexOf('ESTE.THUY_PHAN')]).toBe(0)
  })
})

describe('cờ thuật toán', () => {
  it('tụt nhịp: 3 ngày gần < 50 % nhịp 4 ngày trước (nền ≥ 12 câu)', () => {
    expect(the({ suKien: [...ngay(1, 3, 2), ...ngay(5, 8, 6), ...ngay(6, 8, 6)] }).co).toContain('tut_nhip') // 3/3 = 1 câu/ngày vs 16/4 = 4
    expect(the({ suKien: [...ngay(1, 6, 4), ...ngay(2, 6, 4), ...ngay(5, 8, 6), ...ngay(6, 8, 6)] }).co).not.toContain('tut_nhip')
    expect(the({ suKien: [...ngay(1, 1, 1), ...ngay(5, 5, 4)] }).co).not.toContain('tut_nhip') // nền < 12 câu
  })
  it('bỏ dở BTVN: có bài mở, 7 ngày có làm bài, 2 ngày gần không làm câu nào của bài', () => {
    const b = [{ changXong: 2, tongChang: 7 }]
    expect(the({ btvn: b, suKien: [...ngay(4, 6, 4), ...ngay(1, 3, 3, { nguon: 'on_lai' })] }).co).toContain('bo_do')
    expect(the({ btvn: b, suKien: [...ngay(4, 6, 4), ...ngay(1, 3, 3)] }).co).not.toContain('bo_do')
    expect(the({ btvn: [], suKien: ngay(4, 6, 4) }).co).not.toContain('bo_do')
  })
  it('sai lặp: một dạng sai ≥ 3 lần trong 7 ngày', () => {
    const cau = (n: number) => ngay(2, n, 0, {}, 'a').map((e) => ({ qid: e.qid, dang: 'D', lanSai: 1, trangThai: 'moi_sai' as const }))
    expect(the({ suKien: ngay(2, 3, 0, {}, 'a'), cau: cau(3) }).co).toContain('sai_lap')
    expect(the({ suKien: ngay(2, 2, 0, {}, 'a'), cau: cau(2) }).co).not.toContain('sai_lap')
  })
  it('đúng nhanh bất thường / làm cho xong: dựa vào giây hôm qua so với trung vị CỦA CHÍNH em', () => {
    const chan = ngay(4, 8, 8, { giay: 60 })
    const nhanDung = the({ suKien: [...chan, ...ngay(1, 8, 8, { giay: 20 })] })
    expect(nhanDung.co).toContain('dung_nhanh')
    expect(nhanDung.co).not.toContain('lam_cho_xong')
    const nhanSai = the({ suKien: [...chan, ...ngay(1, 8, 2, { giay: 20 })] })
    expect(nhanSai.co).toContain('lam_cho_xong')
    expect(the({ suKien: [...chan, ...ngay(1, 8, 8, { giay: 55 })] }).co).not.toContain('dung_nhanh')
  })
  it('vừa thi (1–3 ngày), mới vào (≤ 7 ngày từ lần đầu), vắng lâu (≥ 5 ngày)', () => {
    expect(the({ caGanNhat: { diem: 7, ngayNop: ngayTruoc(2) } }).co).toContain('vua_thi')
    expect(the({ caGanNhat: { diem: 7, ngayNop: ngayTruoc(5) } }).co).not.toContain('vua_thi')
    expect(the({ ngayHoatDongDau: ngayTruoc(5) }).co).toContain('moi_vao')
    expect(the({ ngayHoatDongDau: ngayTruoc(9) }).co).not.toContain('moi_vao')
    expect(the({ ngayHoatDongCuoi: ngayTruoc(7) }).co).toContain('vang_lau')
  })
})

describe('MỐC ĐÁNG KHEN (thuật toán, có số)', () => {
  const thePhu = (bacs: Record<string, 0 | 1 | 2>): TheNgan => ({ ...the({}), maDang: Object.keys(bacs), bacCuaMaDang: Object.values(bacs) })
  it('lên bậc: so với thẻ đêm trước; chỉ khi bậc CAO hơn', () => {
    const v = { dang: [dang('D1', 1, 8, 2), dang('D2', 0, 6, 3)], suKien: ngay(1, 3, 2), cau: [{ qid: 'q1-0', dang: 'D1', lanSai: 0, trangThai: null }, { qid: 'q1-1', dang: 'D2', lanSai: 0, trangThai: null }] as CauEmNgan[] }
    const t = the({ ...v, theHomTruoc: thePhu({ D1: 0, D2: 0 }) })
    expect(t.mocDangKhen).toEqual([{ loai: 'len_bac', dang: 'D1', tu: 0, den: 1 }])
    expect(the({ ...v, theHomTruoc: thePhu({ D1: 2 }) }).mocDangKhen).toEqual([]) // tụt thì không khen
    expect(the({ ...v }).mocDangKhen.some((m) => m.loai === 'len_bac')).toBe(false) // không có thẻ trước
  })
  it('đúng lại câu từng sai (hôm qua), chuỗi 3/7/14, quay lại sau vắng, tự làm thêm', () => {
    const suKien = [...ngay(1, 4, 4, { nguon: 'btvn' }), ...ngay(1, 3, 3, { nguon: 'luyen' }, 'l')]
    const cau: CauEmNgan[] = [{ qid: 'q1-0', dang: 'D', lanSai: 2, trangThai: 'dang_on' }, { qid: 'q1-1', dang: 'D', lanSai: 1, trangThai: 'dang_on' }, { qid: 'q1-2', dang: 'D', lanSai: 0, trangThai: 'chua_thay_sai' }]
    const kh = [1, 2, 3].map((n) => ({ ngay: ngayTruoc(n), ketQua: 'dat' as const, laNgayNghi: false }))
    const t = the({ suKien, cau, keHoach: kh })
    expect(t.mocDangKhen).toEqual([{ loai: 'dung_lai', soCau: 2 }, { loai: 'chuoi', soNgay: 3 }, { loai: 'tu_lam_them', soCau: 3 }])
    const quay = the({ suKien: [...ngay(1, 3, 2), ...ngay(6, 4, 3)] })
    expect(quay.mocDangKhen).toEqual([{ loai: 'quay_lai', soNgay: 4 }]) // học 6 ngày trước, nghỉ 4 ngày trọn, học lại hôm qua
    expect(the({ suKien: [...ngay(1, 3, 2), ...ngay(2, 4, 3)] }).mocDangKhen).toEqual([])
    expect(the({ keHoach: [4, 5, 6, 7, 8].map((n) => ({ ngay: ngayTruoc(n - 3), ketQua: 'dat' as const, laNgayNghi: false })) }).mocDangKhen.some((m) => m.loai === 'chuoi')).toBe(false) // chuỗi 5 không phải mốc
  })
  it('KHI NÀO VIẾT cho phụ huynh: mốc · sai lặp · bỏ dở · vắng ≥ 3 ngày · vừa thi; ngày thường rỗng', () => {
    expect(the({ suKien: ngay(1, 3, 2) }).khiNaoVietPhuHuynh).toEqual([])
    expect(the({ ngayHoatDongCuoi: ngayTruoc(4) }).khiNaoVietPhuHuynh).toEqual(['vang_3_ngay'])
    expect(the({ caGanNhat: { diem: 8, ngayNop: ngayTruoc(1) } }).khiNaoVietPhuHuynh).toEqual(['vua_thi'])
    const cau = ngay(2, 3, 0, {}, 'a').map((e) => ({ qid: e.qid, dang: 'D', lanSai: 1, trangThai: 'moi_sai' as const }))
    expect(the({ suKien: ngay(2, 3, 0, {}, 'a'), cau }).khiNaoVietPhuHuynh).toEqual(['vap_lap_da_xu_ly'])
    // bỏ dở 2 ngày liền rồi quay lại (nguồn ôn lại) cũng là mốc "quay lại": cả hai lý do cùng có
    expect(the({ suKien: [...ngay(4, 6, 4), ...ngay(1, 3, 3, { nguon: 'on_lai' })], btvn: [{ changXong: 1, tongChang: 3 }] }).khiNaoVietPhuHuynh).toEqual(['moc_dang_khen', 'bo_do_2_ngay'])
    expect(the({ suKien: [...ngay(2, 6, 4), ...ngay(3, 5, 4), ...ngay(4, 6, 4)], btvn: [{ changXong: 1, tongChang: 3 }] }).khiNaoVietPhuHuynh).toEqual([])
  })
  it('lượt soi kỹ hằng tuần và lời gần đây có mặt trong thẻ; lời gần đây chỉ giữ 3 và cắt 160 ký tự', () => {
    const t = the({ loiNhanGanDay: ['a', 'b', 'c', 'd', 'x'.repeat(300)] })
    expect(t.loiNhanGanDay).toEqual(['a', 'b', 'c'])
    expect(the({ loiNhanGanDay: ['x'.repeat(300)] }).loiNhanGanDay[0]).toHaveLength(160)
    expect(t.luotSoiKyTuan).toBe(toiLuotSoiKy('12007', NGAY))
  })
})

describe('PHÂN LUỒNG', () => {
  const luong = (o: Partial<DauVaoEm>, sbd = '12007') => {
    const t = the({ sbd, ...o })
    return phanLuong(t, { sbd, ngay: NGAY })
  }
  it('không hoạt động 30 ngày (hoặc chưa từng) ⇒ bo_qua; vắng ≥ 2 ngày ⇒ vang (lý do bằng số)', () => {
    expect(luong({ ngayHoatDongCuoi: null, ngayHoatDongDau: null }).luong).toBe('bo_qua')
    expect(luong({ ngayHoatDongCuoi: ngayTruoc(40) }).luong).toBe('bo_qua')
    const v = luong({ ngayHoatDongCuoi: ngayTruoc(4) })
    expect(v).toEqual({ luong: 'vang', lyDo: ['vắng 3 ngày liền'] })
    expect(luong({ ngayHoatDongCuoi: ngayTruoc(2) }).luong).not.toBe('vang') // vắng 1 ngày trọn
  })
  it('có cờ ⇒ sâu, mỗi cờ một lý do BẰNG SỐ lấy đúng từ thẻ', () => {
    const r = luong({ suKien: [...ngay(1, 3, 2), ...ngay(5, 8, 6), ...ngay(6, 8, 6)], btvn: [{ changXong: 2, tongChang: 7 }] })
    expect(r.luong).toBe('sau')
    expect(r.lyDo.some((x) => /tụt nhịp: 3 câu \/ 3 ngày so với 16 câu \/ 4 ngày trước/.test(x))).toBe(true)
    const sai = ngay(2, 3, 0, {}, 'a')
    const r2 = luong({ suKien: sai, cau: sai.map((e) => ({ qid: e.qid, dang: 'ESTE.X', lanSai: 1, trangThai: 'moi_sai' as const })) })
    expect(r2.lyDo).toContain('sai lặp: dạng ESTE.X sai 3/3 lần trong 7 ngày')
    expect(luong({ caGanNhat: { diem: 6, ngayNop: ngayTruoc(2) } }).lyDo).toContain('vừa thi 2 ngày trước')
    expect(luong({ ngayHoatDongDau: ngayTruoc(3) }).lyDo).toContain('mới vào 3 ngày')
  })
  it('không cờ, không tới lượt xoay vòng ⇒ nhanh; tới lượt ⇒ sâu vì xoay vòng', () => {
    const sbds = Array.from({ length: 300 }, (_, i) => `sb${i}`)
    const cua = (sbd: string) => phanLuong(the({ sbd, suKien: ngay(1, 5, 4) }), { sbd, ngay: NGAY })
    const kq = sbds.map(cua)
    const soSau = kq.filter((k) => k.luong === 'sau').length
    expect(soSau).toBeGreaterThan(300 / 7 - 20)
    expect(soSau).toBeLessThan(300 / 7 + 20)
    for (const k of kq.filter((x) => x.luong === 'sau')) expect(k.lyDo).toEqual(['tới lượt soi kỹ xoay vòng hằng tuần'])
    expect(kq.filter((x) => x.luong === 'nhanh').every((x) => x.lyDo.length === 0)).toBe(true)
  })
  it('XOAY VÒNG: trong 7 ngày liền, MỖI em được soi kỹ đúng MỘT lần; tất định theo (sbd, ngày)', () => {
    const sbds = Array.from({ length: 400 }, (_, i) => `${12000 + i}`)
    for (const dau of ['2026-09-22', '2026-12-28', '2027-03-01']) {
      const dem = new Map<string, number>()
      for (let k = 0; k < 7; k++) for (const s of sbds) if (toiLuotSoiKy(s, themNgay(dau, k))) dem.set(s, (dem.get(s) ?? 0) + 1)
      expect(dem.size).toBe(sbds.length)
      expect([...dem.values()].every((x) => x === 1)).toBe(true)
    }
    expect(toiLuotSoiKy('12007', NGAY)).toBe(toiLuotSoiKy('12007', NGAY))
    expect(toiLuotSoiKy('12007', 'rác')).toBe(false)
  })
})

describe('ĐÁNH GIÁ ĐIỀU CHỈNH hôm qua', () => {
  const t = (o: { lam: number; dung: number; tiLe7?: number | null; changXong?: number; dang?: TheNgan['dangChuY'] }): TheNgan => {
    const x = the({ suKien: ngay(1, o.lam, o.dung), btvn: [{ changXong: o.changXong ?? 0, tongChang: 7 }] })
    return { ...x, cau: { ...x.cau, tiLe7: o.tiLe7 === undefined ? x.cau.tiLe7 : o.tiLe7 }, dangChuY: o.dang ?? x.dangChuY }
  }
  it('chưa đủ dữ liệu khi hôm qua < 5 câu (giữ nguyên điều chỉnh)', () => {
    expect(danhGiaDieuChinh(t({ lam: 4, dung: 4, tiLe7: 0.6 }), t({ lam: 4, dung: 4 })).ketQua).toBe('chua_du_du_lieu')
    expect(danhGiaDieuChinh(null, t({ lam: 0, dung: 0 })).ketQua).toBe('chua_du_du_lieu')
  })
  it('ăn thua: đúng ≥ 70 % và không tụt; hoặc tăng ≥ 10 điểm; hoặc xong thêm chặng; hoặc dạng lên bậc', () => {
    expect(danhGiaDieuChinh(t({ lam: 8, dung: 6, tiLe7: 0.7 }), t({ lam: 8, dung: 6 })).ketQua).toBe('an_thua') // 75 % ≥ 70 %, không tụt
    expect(danhGiaDieuChinh(t({ lam: 8, dung: 5, tiLe7: 0.4 }), t({ lam: 8, dung: 5 })).ketQua).toBe('an_thua') // 62 % nhưng tăng 22 điểm
    expect(danhGiaDieuChinh(t({ lam: 8, dung: 4, tiLe7: 0.5, changXong: 1 }), t({ lam: 8, dung: 4, changXong: 3 })).ketQua).toBe('an_thua') // xong thêm 2 chặng
    const truoc = t({ lam: 8, dung: 4, tiLe7: 0.5, dang: [{ ma: 'D', gap: 8, sai: 3, bac: 0, tiLeKhacPhuc: 0.4, lam7: 3, sai7: 2 }] })
    const nay = t({ lam: 8, dung: 4, dang: [{ ma: 'D', gap: 9, sai: 3, bac: 1, tiLeKhacPhuc: 0.6, lam7: 3, sai7: 1 }] })
    const k = danhGiaDieuChinh(truoc, nay)
    expect(k.ketQua).toBe('an_thua')
    expect(k.so.soDangLenBac).toBe(1)
  })
  it('xấu đi: đúng < 50 % VÀ tụt ≥ 15 điểm so với 7 ngày trước; không đủ hai điều kiện thì không đổi', () => {
    const k = danhGiaDieuChinh(t({ lam: 8, dung: 6, tiLe7: 0.75 }), t({ lam: 8, dung: 3 }))
    expect(k.ketQua).toBe('xau_di')
    expect(k.chu).toBe('hôm qua đúng 3/8 câu (38 %), 7 ngày trước 75 %')
    expect(danhGiaDieuChinh(t({ lam: 8, dung: 6, tiLe7: 0.75 }), t({ lam: 8, dung: 5 })).ketQua).toBe('khong_doi') // 62 %: dưới 70 nhưng không tụt đủ nặng
    expect(danhGiaDieuChinh(t({ lam: 8, dung: 3, tiLe7: 0.45 }), t({ lam: 8, dung: 3 })).ketQua).toBe('khong_doi') // thấp nhưng vốn đã thấp
  })
  it('câu chữ do MÁY ghép, có số thật; số đo đủ để tự kiểm', () => {
    const k = danhGiaDieuChinh(t({ lam: 8, dung: 5, tiLe7: 0.4, changXong: 1 }), t({ lam: 8, dung: 7, changXong: 3 }))
    expect(k.chu).toBe('hôm qua đúng 7/8 câu (88 %), 7 ngày trước 40 %, xong thêm 2 chặng')
    expect(k.so).toMatchObject({ lam: 8, dung: 7, tiLeHomQua: 0.88, tiLe7Truoc: 0.4, soChangThem: 2 })
  })
})

describe('BỨC TRANH CẢ LỚP', () => {
  it('đếm luồng, dạng sai lặp nhiều em nhất, bỏ dở, tụt nhịp, em nổi lên, kết quả điều chỉnh', () => {
    const sai = (ma: string, k: number) => {
      const s = ngay(2, k, 0, {}, ma)
      return { suKien: s, cau: s.map((e) => ({ qid: e.qid, dang: ma, lanSai: 1, trangThai: 'moi_sai' as const })) }
    }
    const lopEm = [
      { sbd: 'a', lop: 'x', the: the({ ...sai('D1', 4) }), luong: 'sau' as const, ketQuaHomQua: 'an_thua' as const },
      { sbd: 'b', lop: 'x', the: the({ ...sai('D1', 3) }), luong: 'sau' as const, ketQuaHomQua: 'xau_di' as const },
      { sbd: 'c', lop: 'x', the: the({ ...sai('D2', 3) }), luong: 'nhanh' as const, ketQuaHomQua: 'chua_du_du_lieu' as const },
      { sbd: 'd', lop: 'x', the: the({ suKien: [...ngay(1, 10, 10), ...ngay(2, 10, 9), ...ngay(6, 8, 5)] }), luong: 'nhanh' as const, ketQuaHomQua: 'khong_doi' as const },
      { sbd: 'e', lop: 'x', the: the({ ngayHoatDongCuoi: ngayTruoc(4) }), luong: 'vang' as const },
      { sbd: 'f', lop: 'x', the: the({ ngayHoatDongCuoi: null, ngayHoatDongDau: null }), luong: 'bo_qua' as const },
    ]
    const b = tinhBucTranhLop(NGAY, lopEm)
    expect(b).toMatchObject({ ngay: NGAY, soEm: 6, soSoiNhanh: 2, soSoiKy: 2, soVang: 1, soBoQua: 1, soEmBoDoBtvn: 0, ketQuaDieuChinh: { anThua: 1, khongDoi: 1, xauDi: 1, chuaDu: 1 } })
    expect(b.dangKet).toEqual([{ ma: 'D1', soEm: 2, tongSai: 7 }, { ma: 'D2', soEm: 1, tongSai: 3 }])
    expect(b.emNoiLen).toEqual(['d'])
  })
})

describe('CÁC TÍNH CHẤT CHUNG', () => {
  it('KHÔNG PII: thẻ và hồ sơ không chứa SBD, lớp, hay tên', () => {
    const { the: t, hoSo } = tinhDacTrung(dauVao({ sbd: '12007', lop: '12A1-CHUYEN', suKien: ngay(1, 6, 5), loiNhanGanDay: ['Em làm tốt'] }))
    const j = JSON.stringify([t, hoSo])
    expect(j).not.toContain('12007')
    expect(j).not.toContain('12A1-CHUYEN')
  })
  it('TẤT ĐỊNH và không phụ thuộc thứ tự sự kiện đầu vào', () => {
    const su = [...ngay(1, 6, 5), ...ngay(3, 5, 3, { giay: 30 }), ...ngay(6, 4, 4, { nguon: 'on_lai', giay: 50 })]
    const a = tinhDacTrung(dauVao({ suKien: su }))
    expect(JSON.stringify(tinhDacTrung(dauVao({ suKien: [...su].reverse() })))).toBe(JSON.stringify(a))
    expect(JSON.stringify(tinhDacTrung(dauVao({ suKien: su })))).toBe(JSON.stringify(a))
  })
  it('NHỎ GỌN: thẻ ≤ 1.300 ký tự (≈ 300 token, chưa tính 3 lời gần đây) và hồ sơ ≤ 4.800 ký tự (≈ 1.200 token) ngay cả với em làm nhiều, nhiều dạng', () => {
    const r = mulberry32(7)
    const suKien: SuKienNgan[] = []
    const cau: CauEmNgan[] = []
    for (let n = 1; n <= 14; n++)
      for (let k = 0; k < 20; k++) {
        const qid = `q${n}-${k}`
        suKien.push({ qid, nguon: k % 3 === 0 ? 'game' : 'btvn', ketQua: r() < 0.6 ? 1 : 0, giay: 20 + Math.floor(r() * 60), ngay: ngayTruoc(n) })
        cau.push({ qid, dang: `DANG${k % 15}.KIEU_KHA_DAI`, lanSai: Math.floor(r() * 4), trangThai: 'moi_sai' })
      }
    const dangs = Array.from({ length: 15 }, (_, i) => dang(`DANG${i}.KIEU_KHA_DAI`, (i % 3) as 0 | 1 | 2, 10, 4, 2, 2))
    const { the: t, hoSo } = tinhDacTrung(dauVao({ suKien, cau, dang: dangs, loiNhanGanDay: ['x'.repeat(160), 'y'.repeat(160), 'z'.repeat(160)] }))
    expect(JSON.stringify({ ...t, loiNhanGanDay: [] }).length).toBeLessThanOrEqual(1300)
    expect(JSON.stringify({ ...hoSo, loiNhanGanDay: [] }).length).toBeLessThanOrEqual(4800)
    expect(t.dangChuY.length).toBeLessThanOrEqual(3)
    expect(t.maDang.length).toBeLessThanOrEqual(6)
    expect(hoSo.dang.length).toBeLessThanOrEqual(10)
    expect(hoSo.cauSaiGanDay.length).toBeLessThanOrEqual(8)
  })
  it('MỌI con số AI được nói lấy từ thẻ: lời nhắn ghép từ số thật của thẻ qua kiểm khuôn; số bịa bị loại', () => {
    const su = ngay(1, 8, 7)
    const t = the({ suKien: [...su, ...ngay(3, 5, 3)], keHoach: [1, 2, 3].map((n) => ({ ngay: ngayTruoc(n), ketQua: 'dat' as const, laNgayNghi: false })) })
    const d = (loi: string): DauRaEm => ({
      biDanh: 'X1', doTinCay: 0.8, nhip: { lech: 0, khoiDong: 2 }, dang: [], khacPhuc: [], co: 'khong', loiNhanChoEm: loi, loiNhanChoPhuHuynh: '', thuTuan: '',
      goiYChoThay: { chu: '', hanhDong: 'khong', dang: '' }, ghiChuHlv: '', canSau: false,
    })
    const cho = { ...t, biDanh: 'X1' } as unknown as Parameters<typeof kiemKhuon>[1]
    expect(kiemKhuon(d(`Hôm qua em đúng ${t.cau.dungHomQua}/${t.cau.lamHomQua} câu, chuỗi ${t.chuoi} ngày rồi.`), cho).hopLe).toBe(true)
    expect(kiemKhuon(d(`Hôm qua em đúng ${t.cau.dungHomQua + 40} câu.`), cho).hopLe).toBe(false)
  })
  it('THUẦN: không Math.random, không đồng hồ, không IO; chỉ import hashSeed (thuần) và kiểu', () => {
    const nguon = readFileSync('src/lib/bo-nao-dac-trung.ts', 'utf8').replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
    for (const cam of ['Math.random', 'Date.now', 'new Date()', 'fetch(', 'localStorage', 'console.']) expect(nguon, cam).not.toContain(cam)
    expect([...readFileSync('src/lib/bo-nao-dac-trung.ts', 'utf8').matchAll(/^import (?:type )?.* from '([^']+)'/gm)].map((m) => m[1])).toEqual(['./exam-shuffle', './bo-nao-khuon'])
  })
})
