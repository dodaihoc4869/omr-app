// @vitest-environment node
// HƯỚNG B — chốt cuối bằng trên lớp (server/src/bon-tren-lop.ts). Thầy 02/11: «máy tự động làm hết, dựa chốt cuối cùng là bài kiểm tra trên lớp và gọi lên
// bảng … hiệu quả phải đạt 99% … 99% số liệu thật». Các bẫy xếp oan phải giữ: một buổi kém (ốm / run) · dạng chưa luyện · thi TỐT hơn ở nhà · lên bảng ghi đôi.
import { describe, expect, it } from 'vitest'
import { boTrungBang, chotNhan, llrCau, tinhTrenLop, NGUONG_CHOT, TRAN_BUOI, type BuoiLop } from '../server/src/bon-tren-lop'
import { kiemDinhBon } from '../server/src/bon-chi-so-d1'
import { banPhuHuynh } from '../server/src/ph-bon-so-do'
import type { CauCaThi, LuotBang } from '../server/src/bon-ca-thi'
import type { LuotDanhGia } from '../server/src/danh-gia-hoc-that'

const luot = (i: number, dung: boolean, dv = 'Este', ngay = '2026-10-10', dg: string | null = null): LuotDanhGia => ({
  phan: 'I', dung, cau: `L-${dv}-${i}`, qid: `L-${dv}-${i}`, ma: 3, r: 1, pLop: 0.6, chon: 'A', coGoiY: false, songSinh: false,
  ngay, luc: `${ngay}T10:${String(i % 60).padStart(2, '0')}:00.000Z`, dv, dg,
})
/** n lượt luyện lần đầu ở đơn vị, đúng tỉ lệ p (rải đều). */
const luyen = (dv: string, n: number, p: number, ngay = '2026-10-10', dg: string | null = null) =>
  Array.from({ length: n }, (_, i) => luot(i, (i * p) % 1 < p - 1e-9 ? i < Math.round(n * p) : i < Math.round(n * p), dv, ngay, dg))
/** Một ca: k/n câu đúng ở đơn vị, độ khó cả lớp q. */
const ca = (ma: string, ngay: string, dv: string, n: number, k: number, q = 0.6, dg: string | null = null): CauCaThi[] =>
  Array.from({ length: n }, (_, i) => ({ ma, qid: `${ma}-${dv}-${i}`, ngay, luc: `${ngay}T12:45:00.000Z`, dv, mucDo: 'hieu', dung: i < k, pLop: q, dg }))

describe('kiểm định tuần tự trên lớp', () => {
  it('LLR một câu: đúng ⇒ nghiêng Học thật (âm), sai ở câu em đáng lẽ làm được ⇒ nghiêng Đối phó (dương)', () => {
    expect(llrCau(true, 0.8)).toBeLessThan(0)
    expect(llrCau(false, 0.8)).toBeGreaterThan(0)
    expect(NGUONG_CHOT).toBeCloseTo(Math.log(99), 6)
  })

  it('MỘT buổi kém hẳn (ốm / run) KHÔNG đủ chốt Đối phó — mỗi buổi tối đa một trần, phải ≥ 2 buổi', () => {
    const kq = tinhTrenLop({ luyen: luyen('Este', 30, 0.9), luyenCu: [], caThi: ca('C1', '2026-10-20', 'Este', 10, 1), lenBang: [] })
    expect(kq.buoi).toHaveLength(1)
    expect(kq.buoi[0]!.llr).toBe(TRAN_BUOI)
    expect(kq.nhan).toBeNull()
  })

  it('HAI buổi khác nhau cùng thấp hẳn mức luyện (đã tính độ khó) ⇒ Đối phó ĐÃ KIỂM; bỏ buổi nặng nhất vẫn còn đủ', () => {
    const kq = tinhTrenLop({ luyen: [...luyen('Este', 30, 0.9), ...luyen('Amin', 30, 0.9, '2026-10-12')], luyenCu: [],
      caThi: [...ca('C1', '2026-10-20', 'Este', 10, 2), ...ca('C2', '2026-10-27', 'Amin', 10, 2)], lenBang: [] })
    expect(kq.buoiDp).toBe(2)
    expect(kq.nhan).toBe('dp')
  })

  it('thi TỐT hơn ở nhà (thi tốt ít luyện, giỏi làm nhanh) KHÔNG BAO GIỜ thành Đối phó', () => {
    const kq = tinhTrenLop({ luyen: [...luyen('Este', 20, 0.5), ...luyen('Amin', 20, 0.5, '2026-10-12')], luyenCu: [],
      caThi: [...ca('C1', '2026-10-20', 'Este', 10, 10), ...ca('C2', '2026-10-27', 'Amin', 10, 10)], lenBang: [] })
    expect(kq.nhan).not.toBe('dp')
    expect(kq.llr).toBeLessThan(0)
  })

  it('dạng / chuyên đề CHƯA luyện đủ 6 lượt trước buổi ⇒ bỏ, không phạt', () => {
    const kq = tinhTrenLop({ luyen: luyen('Este', 5, 1), luyenCu: [], caThi: [...ca('C1', '2026-10-20', 'Este', 10, 0), ...ca('C2', '2026-10-27', 'Este', 10, 0)], lenBang: [] })
    expect(kq.soBuoi).toBe(0)
    expect(kq.nhan).toBeNull()
  })

  it('luyện SAU buổi thi không được tính (có thể là học từ lỗi)', () => {
    const kq = tinhTrenLop({ luyen: luyen('Este', 30, 1, '2026-10-25'), luyenCu: [], caThi: ca('C1', '2026-10-20', 'Este', 10, 0), lenBang: [] })
    expect(kq.soBuoi).toBe(0)
  })

  it('so theo DẠNG khi đủ lượt: giỏi dạng A, hỏng dạng B cùng chuyên đề ⇒ ca thi dạng B đối chiếu với luyện dạng B (không bị dạng A thổi kỳ vọng)', () => {
    const l = [...luyen('Este', 20, 1, '2026-10-10', 'A'), ...luyen('Este', 20, 0.2, '2026-10-11', 'B').map((x, i) => ({ ...x, cau: `B${i}`, qid: `B${i}` }))]
    const theoDang = tinhTrenLop({ luyen: l, luyenCu: [], caThi: [...ca('C1', '2026-10-20', 'Este', 8, 2, 0.6, 'B'), ...ca('C2', '2026-10-27', 'Este', 8, 2, 0.6, 'B')], lenBang: [] })
    expect(theoDang.nhan).not.toBe('dp')
  })

  it('≥ 2 buổi khớp mức luyện ⇒ Học thật ĐÃ KIỂM', () => {
    const kq = tinhTrenLop({ luyen: [...luyen('Este', 30, 0.8), ...luyen('Amin', 30, 0.8, '2026-10-12'), ...luyen('Peptit', 30, 0.8, '2026-10-13')], luyenCu: [],
      caThi: [...ca('C1', '2026-10-20', 'Este', 12, 11, 0.8), ...ca('C2', '2026-10-27', 'Amin', 12, 11, 0.8), ...ca('C3', '2026-10-30', 'Peptit', 12, 11, 0.8)], lenBang: [] })
    expect(kq.nhan).toBe('ht')
  })

  it('kiểm định ngược: niêm phong từ các buổi TRƯỚC 2 buổi cuối; 2 buổi cuối (dữ liệu chưa dùng) tự chốt — MỘT buổi ngược không lật được, HAI buổi ngược thì lật', () => {
    const l = ['Este', 'Amin', 'Peptit', 'Polime', 'Sắt'].flatMap((dv, i) => luyen(dv, 30, 0.9, `2026-10-1${i}`))
    const thap = (ma: string, ngay: string, dv: string) => ca(ma, ngay, dv, 10, 2)
    // câu độ khó trung bình (lớp đúng 60%) — đúng hết câu QUÁ DỄ chỉ là bằng chứng yếu, 2 buổi chưa đủ chốt Học thật (đúng thiết kế)
    const cao = (ma: string, ngay: string, dv: string) => ca(ma, ngay, dv, 10, 10)
    // 3 buổi thấp (niêm phong Đối phó) + 1 buổi cao + 1 buổi thấp ⇒ 2 buổi sau không cùng chiều ⇒ chưa phân xử (không phải lật)
    const mot = tinhTrenLop({ luyen: l, luyenCu: [], caThi: [...thap('C1', '2026-10-20', 'Este'), ...thap('C2', '2026-10-22', 'Amin'), ...thap('C3', '2026-10-24', 'Peptit'), ...cao('C4', '2026-10-27', 'Polime'), ...thap('C5', '2026-10-30', 'Sắt')], lenBang: [] })
    expect(mot.nguoc?.nhan).toBe('dp')
    expect(mot.nguoc?.sau).toBeNull()
    // 3 buổi thấp + 2 buổi cao khớp ⇒ 2 buổi sau tự chốt Học thật ⇒ LẬT (sai)
    const hai = tinhTrenLop({ luyen: l, luyenCu: [], caThi: [...thap('C1', '2026-10-20', 'Este'), ...thap('C2', '2026-10-22', 'Amin'), ...thap('C3', '2026-10-24', 'Peptit'), ...cao('C4', '2026-10-27', 'Polime'), ...cao('C5', '2026-10-30', 'Sắt')], lenBang: [] })
    expect(hai.nguoc?.nhan).toBe('dp')
    expect(hai.nguoc?.sau).toBe('ht')
    // < 4 buổi ⇒ chưa kiểm định ngược được
    expect(tinhTrenLop({ luyen: l, luyenCu: [], caThi: [...thap('C1', '2026-10-20', 'Este'), ...thap('C2', '2026-10-22', 'Amin'), ...thap('C3', '2026-10-24', 'Peptit')], lenBang: [] }).nguoc).toBeNull()
  })

  it('chotNhan: tổng đủ nhưng dồn vào MỘT buổi ⇒ không chốt; hai buổi đều ⇒ chốt', () => {
    const b = (llr: number, i: number): BuoiLop => ({ buoi: `B${i}`, ngay: `2026-10-${10 + i}`, luc: `2026-10-${10 + i}T00:00:00Z`, loai: 'thi', n: 5, k: 1, e0: 4, llrTho: llr, llr, dvLech: [] })
    expect(chotNhan([b(2.3, 1), b(2.3, 2), b(0.1, 3)])).toBe('dp')
    expect(chotNhan([b(2.3, 1), b(0.3, 2), b(0.3, 3), b(0.3, 4), b(1.5, 5)])).toBe('dp')
    expect(chotNhan([b(2.3, 1), b(-0.2, 2)])).toBeNull()
    expect(chotNhan([b(-2.3, 1), b(-2.3, 2)])).toBe('ht')
  })
})

describe('lên bảng ghi đôi (02/11: 158/159 lượt thật có hai dòng cách ~0,85 giây)', () => {
  const lb = (luc: string, dat: boolean, qid = 'Q1'): LuotBang => ({ qid, ngay: '2026-10-20', luc, dv: 'Este', dat, loai: 'len_bang' })
  it('cùng câu · cùng kết quả trong 10 giây = MỘT lần; hai lần gọi thật cách nhau phút vẫn là hai', () => {
    expect(boTrungBang([lb('2026-10-20T10:00:00.000Z', false), lb('2026-10-20T10:00:00.850Z', false)])).toHaveLength(1)
    expect(boTrungBang([lb('2026-10-20T10:00:00.000Z', false), lb('2026-10-20T10:05:00.000Z', false)])).toHaveLength(2)
    expect(boTrungBang([lb('2026-10-20T10:00:00.000Z', false), lb('2026-10-20T10:00:01.000Z', true)])).toHaveLength(2)
    expect(boTrungBang([lb('2026-10-20T10:00:00.000Z', false), lb('2026-10-20T10:00:01.000Z', false, 'Q2')])).toHaveLength(2)
  })
})

describe('tự đo độ chính xác trên số liệu thật — /gv/bon-bang → kiemDinh (chỉ đếm gộp)', () => {
  it('đếm nhãn đã kiểm / tạm; nhãn niêm phong: 2 buổi sau tự chốt trùng (xác nhận) · ngược (lật = sai) · chưa chắc (không tính)', () => {
    const r = (vao: object, kiem: string | null, ng: string | null, sau: string | null) =>
      ({ vao: JSON.stringify(vao), kiem_cl: kiem, ng_nhan: ng, ng_sau: sau, ng_llr: null })
    const kd = kiemDinhBon([
      r({ dp: true, ht: false }, 'da', 'dp', 'dp'),
      r({ dp: true, ht: false }, 'da', 'dp', null),
      r({ dp: false, ht: true }, 'da', 'ht', 'ht'),
      r({ dp: false, ht: true }, 'tam', null, null),
      r({ dp: false, ht: true }, 'da', 'dp', 'ht'),
    ])
    expect(kd.daKiem).toEqual({ ht: 2, dp: 2 })
    expect(kd.tam).toEqual({ ht: 1, dp: 0 })
    expect(kd.niemPhong.dp).toEqual({ tong: 3, cung: 1, lat: 1 })
    expect(kd.niemPhong.ht).toEqual({ tong: 1, cung: 1, lat: 0 })
    // < 30 nhãn niêm phong ⇒ «chưa đủ mẫu», không in con số
    expect(kd.chinhXac).toEqual({ ht: null, dp: null })
  })
  it('≥ 30 nhãn niêm phong ⇒ có độ chính xác + cận dưới Wilson; 1 lật / 300 ⇒ cận dưới < 99% vẫn phải hiện đúng', () => {
    const ds = Array.from({ length: 300 }, (_, i) => ({ vao: JSON.stringify({ dp: true }), kiem_cl: 'da', ng_sau: i === 0 ? 'ht' : 'dp', ng_nhan: 'dp', ng_llr: 1 }))
    const kd = kiemDinhBon(ds)
    expect(kd.chinhXac!.dp!.ti).toBeCloseTo(299 / 300, 6)
    expect(kd.chinhXac!.dp!.canDuoi).toBeLessThan(kd.chinhXac!.dp!.ti)
    expect(kd.chinhXac!.ht).toBeNull()
  })
})

describe('phụ huynh chỉ thấy số đo Đối phó khi nhãn ĐÃ KIỂM', () => {
  const hang = (kiem: string | null) => ({ ngay: '2026-11-02', tinh_luc: '2026-11-02T01:00:00Z', ht: 40, dp: 70, ch: 60, lu: 30, so_luot: 100,
    the_json: JSON.stringify({ dp: [{ ma: 'voi', tieu: 'Chọn vội', lon: '30/100' }] }), ngay_json: '[]', kiem_cl: kiem })
  it('nhãn tạm «chưa kiểm trên lớp» ⇒ ô Đối phó «chưa có», không kèm bằng chứng', () => {
    const t = banPhuHuynh(hang('tam'))
    if (!t.ok || !t.co) throw new Error('phải có')
    expect(t.diem.dp).toBeNull()
    expect(t.bangChung.dp).toEqual([])
    expect(t.diem.ht).toBe(40)
  })
  it('Đối phó đã kiểm CHỈ bằng hành vi ở nhà (chưa có trên lớp) ⇒ phụ huynh vẫn «chưa có» — chốt cuối là trên lớp', () => {
    const t = banPhuHuynh({ ...hang('da'), kiem_cach: 'hanhVi' })
    if (!t.ok || !t.co) throw new Error('phải có')
    expect(t.diem.dp).toBeNull()
  })
  it('đã kiểm ⇒ như trước; hàng cũ (chưa có mức chắc) ⇒ như trước', () => {
    for (const k of ['da', null]) {
      const t = banPhuHuynh(hang(k))
      if (!t.ok || !t.co) throw new Error('phải có')
      expect(t.diem.dp).toBe(70)
    }
  })
})
