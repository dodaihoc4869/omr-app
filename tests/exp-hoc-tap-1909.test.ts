// @vitest-environment node
// EXP HỌC TẬP + MẢNH KHIÊN — hàm thuần (DE-XUAT-EXP-MANH-KHIEN-1909.md): bảng giá trị, trần mềm, khoá idempotent, mảnh khiên, "một ngày mẫu".
import { describe, it, expect } from 'vitest'
import { congManh, expMotCau, expSauTran, tinhExp, type KhoanExp, type SuKienExp, type VaoTinhExp } from '../server/src/exp-hoc-tap'
import * as CH from '../server/src/exp-cau-hinh'

const NGAY = '2026-09-20'
const luc = (i: number) => `${NGAY}T${String(1 + Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00.000Z`
let dem = 0
const sk = (qid: string, ketQua: 0 | 1 | null, o: Partial<SuKienExp> = {}): SuKienExp => {
  dem++
  return { khoa: `btvn|B|S1|${qid}|${dem}`, nguon: 'btvn', maNguon: 'B', qid, lan: 1, ketQua, luc: luc(dem), ...o }
}
const vao = (o: Partial<VaoTinhExp> = {}): VaoTinhExp => ({
  ngay: NGAY, suKien: [], metaCau: {}, mucTieuCau: 8, lenBac: [], khacPhuc: [], loXong: [], baiBtvnNop: [], momXong: [], diemCa: [], datNgay: null, dangRoiYeu: [],
  daCoKhoa: new Set(), ...o,
})
const tong = (k: KhoanExp[]) => k.reduce((t, x) => t + x.exp, 0)
const theoLoai = (k: KhoanExp[], loai: string) => k.filter((x) => x.loai === loai)

describe('bảng EXP một câu đúng (phần × sao)', () => {
  it.each([
    ['I', 0, 2], ['I', 1, 3], ['I', 2, 5],
    ['II', 0, 3], ['II', 1, 5], ['II', 2, 8],
    ['III', 0, 4], ['III', 1, 6], ['III', 2, 10],
  ] as const)('Phần %s, %i sao → %i EXP', (phan, sao, mong) => {
    expect(expMotCau(phan, sao)).toBe(mong)
    const r = tinhExp(vao({ suKien: [sk('Q1', 1)], metaCau: { Q1: { phan, sao } } }))
    expect(r.khoan).toHaveLength(1)
    expect(r.khoan[0]).toMatchObject({ khoa: `cau|Q1|${NGAY}`, loai: 'cau', exp: mong, qid: 'Q1' })
  })

  it('thiếu meta ⇒ phần suy từ hậu tố qid, sao 0; sao lạ ⇒ 0 sao; bảng khớp hằng số', () => {
    const r = tinhExp(vao({ suKien: [sk('DE-II-3', 1), sk('DE-III-9', 1), sk('LA', 1), sk('X', 1)], metaCau: { X: { phan: 'I', sao: 7 as never } } }))
    expect(r.khoan.map((k) => [k.qid, k.exp])).toEqual([['DE-II-3', 3], ['DE-III-9', 4], ['LA', 2], ['X', 2]])
    expect(expMotCau('II', 99)).toBe(CH.EXP_CAU.II[0])
  })

  it('SAI hoặc BỎ TRỐNG = 0 EXP; nguồn game và lên bảng không tính là EXP câu; 8 nguồn còn lại đều tính', () => {
    expect(tinhExp(vao({ suKien: [sk('A', 0), sk('B', null), sk('C', 1, { nguon: 'game' }), sk('D', 1, { nguon: 'len_bang' })] })).khoan.filter((k) => k.loai === 'cau')).toEqual([])
    const nguon = ['thi', 'btvn', 'btvn_lo', 'khac_phuc', 'mom', 'on_lai', 'luyen']
    const r = tinhExp(vao({ suKien: nguon.map((n, i) => sk(`Q${i}`, 1, { nguon: n })) }))
    expect(theoLoai(r.khoan, 'cau')).toHaveLength(nguon.length)
  })

  it('cùng một qid hai lần trong MỘT ngày ⇒ MỘT khoản (lần đúng đầu); sai rồi đúng vẫn tính lần đúng', () => {
    const r = tinhExp(vao({ suKien: [sk('A', 1, { luc: luc(5) }), sk('A', 1, { luc: luc(9), nguon: 'mom' }), sk('B', 0, { luc: luc(1) }), sk('B', 1, { luc: luc(2) })] }))
    expect(theoLoai(r.khoan, 'cau').map((k) => k.qid).sort()).toEqual(['A', 'B'])
    expect(theoLoai(r.khoan, 'cau').find((k) => k.qid === 'A')!.luc).toBe(luc(5))
  })
})

describe('trần MỀM 2 × mục tiêu ngày', () => {
  it('đủ giá tới câu thứ 2×mục tiêu; sau đó 25% làm tròn lên, tối thiểu 1', () => {
    const suKien = Array.from({ length: 20 }, (_, i) => sk(`Q${String(i).padStart(2, '0')}`, 1, { luc: luc(i) }))
    const r = tinhExp(vao({ mucTieuCau: 8, suKien, metaCau: Object.fromEntries(suKien.map((e, i) => [e.qid, { phan: 'I' as const, sao: (i % 3) as 0 | 1 | 2 }])) }))
    const cau = theoLoai(r.khoan, 'cau')
    expect(cau).toHaveLength(20)
    expect(cau.slice(0, 16).map((k) => k.exp)).toEqual(Array.from({ length: 16 }, (_, i) => [2, 3, 5][i % 3]))
    // Câu thứ 17..20 (i = 16..19) có giá gốc sao i%3 ⇒ [3, 5, 2, 3] ⇒ 25% làm tròn lên, tối thiểu 1 ⇒ [1, 2, 1, 1].
    expect(cau.slice(16).map((k) => k.exp)).toEqual([3, 5, 2, 3].map((g) => Math.max(1, Math.ceil(g / 4))))
    expect(cau[16]!.ghiChu).toContain('25%')
    expect(cau[15]!.ghiChu).not.toContain('25%')
    expect(expSauTran(10)).toBe(3); expect(expSauTran(2)).toBe(1); expect(expSauTran(3)).toBe(1); expect(expSauTran(5)).toBe(2)
  })
  it('ngưỡng theo mục tiêu ngày: 16 → ngưỡng 32; thay đổi ngưỡng đổi đúng câu thứ 17', () => {
    const suKien = Array.from({ length: 18 }, (_, i) => sk(`Q${String(i).padStart(2, '0')}`, 1, { luc: luc(i) }))
    const so = (m: number) => theoLoai(tinhExp(vao({ mucTieuCau: m, suKien })).khoan, 'cau').filter((k) => k.ghiChu.includes('25%')).length
    expect(so(8)).toBe(2); expect(so(9)).toBe(0); expect(so(16)).toBe(0)
  })
  it('thưởng theo việc KHÔNG bị trần', () => {
    const suKien = Array.from({ length: 40 }, (_, i) => sk(`Q${i}`, 1, { luc: luc(i) }))
    const r = tinhExp(vao({ mucTieuCau: 8, suKien, loXong: [{ maBtvn: 'B', chiSo: 0, dungNhip: true, luc: luc(50) }], momXong: [{ id: 'M', luc: luc(51) }] }))
    expect(theoLoai(r.khoan, 'lo')[0]!.exp).toBe(10)
    expect(theoLoai(r.khoan, 'mom')[0]!.exp).toBe(10)
  })
  it('thứ tự xét theo `luc` rồi `khoa`, không theo thứ tự mảng đầu vào', () => {
    const suKien = Array.from({ length: 20 }, (_, i) => sk(`Q${String(i).padStart(2, '0')}`, 1, { luc: luc(i) }))
    const a = tinhExp(vao({ mucTieuCau: 8, suKien }))
    const b = tinhExp(vao({ mucTieuCau: 8, suKien: [...suKien].reverse() }))
    expect(JSON.stringify(b)).toBe(JSON.stringify(a))
  })
})

describe('thưởng theo việc + khoá idempotent', () => {
  it('lô đúng nhịp +10, trễ nhịp +4 (cùng khoá lo|<bài>|<chỉ số>)', () => {
    const r = tinhExp(vao({ loXong: [{ maBtvn: 'B1', chiSo: 0, dungNhip: true, luc: luc(1) }, { maBtvn: 'B1', chiSo: 1, dungNhip: false, luc: luc(2) }] }))
    expect(r.khoan.map((k) => [k.khoa, k.exp])).toEqual([['lo|B1|0', 10], ['lo|B1|1', 4]])
  })
  it('nộp cả bài BTVN: +15 đúng hạn, 0 nếu quá hạn; Mẹ giao +10; lên bảng đạt +15 / chưa đạt +5 theo khoá sổ', () => {
    const lb = [sk('L1', 1, { nguon: 'len_bang', khoa: 'len_bang|lb|S1|L1|7' }), sk('L2', 0, { nguon: 'len_bang', khoa: 'len_bang|lb|S1|L2|8' })]
    const r = tinhExp(vao({ suKien: lb, baiBtvnNop: [{ maBtvn: 'B1', dungHan: true, luc: luc(1) }, { maBtvn: 'B2', dungHan: false, luc: luc(2) }], momXong: [{ id: 'M1', luc: luc(3) }] }))
    expect(r.khoan.map((k) => [k.khoa, k.exp]).sort()).toEqual([
      ['btvn|B1', 15], ['lb|len_bang|lb|S1|L1|7', 15], ['lb|len_bang|lb|S1|L2|8', 5], ['mom|M1', 10],
    ].sort())
  })
  it('câu ôn LÊN BẬC +6 (khoá theo ngày); khắc phục +30 (khoá theo lần: tái phát rồi khắc phục lại là khoản MỚI)', () => {
    const r = tinhExp(vao({ suKien: [sk('A', 1)], lenBac: ['A', 'A', 'B'], khacPhuc: [{ qid: 'A', lan: 1, luc: luc(3) }, { qid: 'A', lan: 2, luc: luc(4) }] }))
    expect(theoLoai(r.khoan, 'len_bac').map((k) => [k.khoa, k.exp]).sort()).toEqual([[`bac|A|${NGAY}`, 6], [`bac|B|${NGAY}`, 6]])
    expect(theoLoai(r.khoan, 'khac_phuc').map((k) => [k.khoa, k.exp])).toEqual([['kp|A|1', 30], ['kp|A|2', 30]])
  })
  it('ca thi theo điểm: round(điểm) × 3, kẹp 0..10', () => {
    const r = tinhExp(vao({ diemCa: [{ maCa: 'C1', lanThu: 1, diem: 7.5, luc: luc(1) }, { maCa: 'C2', lanThu: 1, diem: 12, luc: luc(2) }, { maCa: 'C3', lanThu: 2, diem: -1, luc: luc(3) }, { maCa: 'C4', lanThu: 1, diem: 6.4, luc: luc(4) }] }))
    expect(r.khoan.map((k) => [k.khoa, k.exp])).toEqual([['diem|C1|1', 24], ['diem|C2|1', 30], ['diem|C4|1', 18]]) // điểm âm ⇒ 0 EXP nên không có khoản
  })
  it('KHOÁ ĐÃ CÓ thì không sinh lại; gọi lần hai với các khoá vừa sinh ⇒ rỗng (nạp lại sổ không cộng trùng)', () => {
    const v = vao({
      suKien: [sk('A', 1), sk('B', 1)], lenBac: ['A'], khacPhuc: [{ qid: 'B', lan: 1, luc: luc(3) }], loXong: [{ maBtvn: 'B1', chiSo: 0, dungNhip: true, luc: luc(4) }],
      baiBtvnNop: [{ maBtvn: 'B1', dungHan: true, luc: luc(5) }], momXong: [{ id: 'M', luc: luc(6) }], diemCa: [{ maCa: 'C', lanThu: 1, diem: 8, luc: luc(7) }],
      datNgay: { chuoi: 7, luc: luc(8) }, dangRoiYeu: [{ maDang: 'ES-01', lan: 1, luc: luc(9) }],
    })
    const dau = tinhExp(v)
    expect(dau.khoan.length).toBeGreaterThan(8)
    const khoa = new Set([...dau.khoan.map((k) => k.khoa), ...dau.manh.map((m) => m.khoa)])
    const sau = tinhExp({ ...v, daCoKhoa: khoa })
    expect(sau).toEqual({ khoan: [], manh: [] })
    // Chỉ một phần đã có ⇒ chỉ sinh phần còn thiếu.
    const mot = tinhExp({ ...v, daCoKhoa: new Set([`cau|A|${NGAY}`, 'mom|M']) })
    expect(mot.khoan.map((k) => k.khoa)).not.toContain(`cau|A|${NGAY}`)
    expect(mot.khoan.map((k) => k.khoa)).not.toContain('mom|M')
    expect(mot.khoan.length).toBe(dau.khoan.length - 2)
  })
})

describe('khoản theo CHUYỂN TRẠNG THÁI HỒ SƠ áp cho MỌI nguồn, kể cả game (0.Planer chốt 19/09)', () => {
  it('em làm đúng câu ôn trong GAME: không có EXP câu (tránh thưởng đôi với 20/40/40) nhưng CÓ +6 lên bậc, +30 khắc phục; dạng rời yếu giữ khoá sổ với 0 mảnh (thầy lệnh 21/09)', () => {
    const r = tinhExp(vao({
      suKien: [sk('G1', 1, { nguon: 'game' }), sk('G2', 1, { nguon: 'game' })],
      lenBac: ['G1'], khacPhuc: [{ qid: 'G2', lan: 2, luc: luc(5) }], dangRoiYeu: [{ maDang: 'ES-01', lan: 1, luc: luc(6) }],
    }))
    expect(theoLoai(r.khoan, 'cau')).toEqual([]) // câu theo bảng 9 ô: loại game
    expect(theoLoai(r.khoan, 'len_bac').map((k) => [k.khoa, k.exp])).toEqual([[`bac|G1|${NGAY}`, 6]])
    expect(theoLoai(r.khoan, 'khac_phuc').map((k) => [k.khoa, k.exp])).toEqual([['kp|G2|2', 30]])
    expect(r.manh.map((m) => [m.khoa, m.so])).toEqual([['manh|dang|ES-01|1', 0]]) // giữ khoá sổ, KHÔNG cộng mảnh
    expect(tong(r.khoan)).toBe(36)
  })
  it('câu game có trợ giúp không ghi sổ nên không có sự kiện, không có chuyển trạng thái ⇒ không có khoản nào', () => {
    expect(tinhExp(vao({ suKien: [], lenBac: [], khacPhuc: [], dangRoiYeu: [] }))).toEqual({ khoan: [], manh: [] })
  })
})

describe('đạt nhiệm vụ ngày, chuỗi và mảnh khiên', () => {
  it('đạt ngày +20 và chuỗi +2×min(chuỗi,10) trao CÙNG LÚC; mảnh +1', () => {
    for (const [chuoi, mong] of [[1, 2], [5, 10], [10, 20], [11, 20], [30, 20]] as const) {
      const r = tinhExp(vao({ datNgay: { chuoi, luc: luc(1) } }))
      expect(r.khoan.map((k) => [k.khoa, k.exp]).sort()).toEqual([[`chuoi|${NGAY}`, mong], [`dat|${NGAY}`, 20]]) // cùng `luc` nên thứ tự theo khoá
      expect(r.manh.filter((m) => m.loai === 'dat')).toEqual([expect.objectContaining({ khoa: `manh|dat|${NGAY}`, so: 1 })])
    }
  })
  it('chuỗi chạm BỘI SỐ 7 (gồm hôm nay) ⇒ khoá sổ `chuoi7` với 0 mảnh (thầy lệnh 21/09: mảnh chỉ đến từ ngày đạt); chuỗi khác thì không có khoá', () => {
    for (const [chuoi, co] of [[6, false], [7, true], [8, false], [14, true], [21, true]] as const) {
      const r = tinhExp(vao({ datNgay: { chuoi, luc: luc(1) } }))
      expect(r.manh.some((m) => m.loai === 'chuoi7'), `chuỗi ${chuoi}`).toBe(co)
      if (co) expect(r.manh.find((m) => m.loai === 'chuoi7')).toMatchObject({ khoa: `manh|chuoi7|${NGAY}`, so: 0 })
      expect(r.manh.reduce((t, m) => t + m.so, 0), `chuỗi ${chuoi}`).toBe(1) // mỗi ngày đạt chỉ +1 mảnh, kể cả bội 7
    }
  })
  it('không đạt ngày ⇒ không đạt/chuỗi/mảnh đạt', () => {
    expect(tinhExp(vao({ datNgay: null }))).toEqual({ khoan: [], manh: [] })
  })
  it('một DẠNG rời danh sách dạng yếu: 0 mảnh (thầy lệnh 21/09), khoá sổ theo (dạng, lần); lần mới khi tái phát rồi rời lại', () => {
    const r = tinhExp(vao({ dangRoiYeu: [{ maDang: 'ES-01', lan: 1, luc: luc(1) }, { maDang: 'ES-01', lan: 2, luc: luc(2) }] }))
    expect(r.manh.map((m) => [m.khoa, m.so])).toEqual([['manh|dang|ES-01|1', 0], ['manh|dang|ES-01|2', 0]])
  })
  it('mảnh KHÔNG mua được bằng EXP: hàm tính EXP không nhận cũng không trả mảnh từ EXP', () => {
    const r = tinhExp(vao({ suKien: Array.from({ length: 30 }, (_, i) => sk(`Q${i}`, 1)) }))
    expect(r.manh).toEqual([])
  })
})

describe('khiên RÈN: 21 mảnh → 1 khiên (thầy lệnh 21/09); tối đa 5 khiên rèn chưa dùng; mảnh kẹp 42', () => {
  it('21 mảnh ⇒ tự rèn, trừ 21; 43 mảnh ⇒ rèn 2 dư 1; chưa đủ thì giữ; mảnh cũ 7/12 giữ nguyên thành 7/21', () => {
    expect(congManh({ manh: 20, daRen: 0 }, 1, 0)).toEqual({ manh: 0, daRen: 1 })
    expect(congManh({ manh: 0, daRen: 3 }, 43, 0)).toEqual({ manh: 1, daRen: 5 })
    expect(congManh({ manh: 5, daRen: 2 }, 3, 0)).toEqual({ manh: 8, daRen: 2 })
    expect(congManh({ manh: 7, daRen: 1 }, 0, 0)).toEqual({ manh: 7, daRen: 1 }) // mảnh em đang có: không mất, không tự rèn
    expect(congManh({ manh: 12, daRen: 1 }, 0, 0)).toEqual({ manh: 12, daRen: 1 }) // 12 mảnh KHÔNG còn đủ một khiên
  })
  it('đã có 5 khiên rèn chưa dùng ⇒ KHÔNG rèn thêm, mảnh vẫn cộng nhưng kẹp ở 42; còn 4 thì rèn đúng 1 rồi dừng', () => {
    expect(congManh({ manh: 10, daRen: 5 }, 90, 5)).toEqual({ manh: 42, daRen: 5 })
    expect(congManh({ manh: 20, daRen: 7 }, 90, 4)).toEqual({ manh: 42, daRen: 8 }) // 110 → rèn 1 (74) rồi chạm 5 chưa dùng → giữ, kẹp 42
    expect(congManh({ manh: 0, daRen: 0 }, 0, 0)).toEqual({ manh: 0, daRen: 0 })
  })
  it('đầu vào lạ (âm, phân số, NaN) không làm mảnh âm hay sinh khiên ảo', () => {
    expect(congManh({ manh: -5, daRen: -1 }, -3, -2)).toEqual({ manh: 0, daRen: 0 })
    expect(congManh({ manh: 3, daRen: 0 }, 2.9, 0)).toEqual({ manh: 5, daRen: 0 })
  })
  it('hằng số đúng như đặc tả', () => {
    expect(CH.MANH_MOI_KHIEN).toBe(21); expect(CH.KHIEN_REN_TOI_DA).toBe(5); expect(CH.MANH_TOI_DA).toBe(42)
    expect(CH.MANH_DAT_NGAY).toBe(1); expect(CH.MANH_CHUOI_BOI_SO_THUONG).toBe(0); expect(CH.MANH_DANG_ROI_YEU).toBe(0) // nguồn mảnh DUY NHẤT là ngày đạt
    expect(CH.EXP_MOI_TU).toBeNull() // chưa phát hành ⇒ không mốc
  })
})

describe('tất định và không sửa đầu vào', () => {
  it('cùng đầu vào → cùng JSON; đảo mọi mảng đầu vào không đổi kết quả; đầu vào không bị sửa', () => {
    const v = vao({
      suKien: Array.from({ length: 12 }, (_, i) => sk(`Q${i}`, (i % 4 === 0 ? 0 : 1) as 0 | 1, { luc: luc(i) })), lenBac: ['Q1', 'Q2'], khacPhuc: [{ qid: 'Q3', lan: 1, luc: luc(20) }],
      loXong: [{ maBtvn: 'B', chiSo: 1, dungNhip: false, luc: luc(21) }, { maBtvn: 'B', chiSo: 0, dungNhip: true, luc: luc(22) }], datNgay: { chuoi: 7, luc: luc(30) },
      dangRoiYeu: [{ maDang: 'X', lan: 1, luc: luc(31) }, { maDang: 'A', lan: 1, luc: luc(32) }],
    })
    const truoc = JSON.stringify({ ...v, daCoKhoa: [...v.daCoKhoa] })
    const a = tinhExp(v)
    expect(JSON.stringify(tinhExp(v))).toBe(JSON.stringify(a))
    const dao = { ...v, suKien: [...v.suKien].reverse(), lenBac: [...v.lenBac].reverse(), loXong: [...v.loXong].reverse(), dangRoiYeu: [...v.dangRoiYeu].reverse() }
    expect(JSON.stringify(tinhExp(dao))).toBe(JSON.stringify(a))
    expect(JSON.stringify({ ...v, daCoKhoa: [...v.daCoKhoa] })).toBe(truoc)
  })
})

describe('MỘT NGÀY MẪU (bảng để 0.Planer đối chiếu với con số đã trình thầy)', () => {
  // Em chăm: làm 12 câu, đúng 9 (75%): 5 Phần I 1 sao, 2 Phần II 1 sao, 2 Phần III 0 sao; 1 lô đúng nhịp; 2 câu ôn lên bậc; đạt ngày; chuỗi 5.
  const cham = () => {
    const meta: Record<string, { phan: 'I' | 'II' | 'III'; sao: 0 | 1 | 2 }> = {}
    const suKien: SuKienExp[] = []
    const them = (n: number, phan: 'I' | 'II' | 'III', sao: 0 | 1 | 2, t: string) => {
      for (let i = 0; i < n; i++) { const q = `${t}${i}`; meta[q] = { phan, sao }; suKien.push(sk(q, 1)) }
    }
    them(5, 'I', 1, 'P1-'); them(2, 'II', 1, 'P2-'); them(2, 'III', 0, 'P3-')
    for (const q of ['S1', 'S2', 'S3']) suKien.push(sk(q, 0)) // 3 câu sai (12 câu làm, 9 đúng)
    return vao({ suKien, metaCau: meta, mucTieuCau: 10, lenBac: ['P1-0', 'P2-0'], loXong: [{ maBtvn: 'B1', chiSo: 0, dungNhip: true, luc: luc(40) }], datNgay: { chuoi: 5, luc: luc(50) } })
  }
  it('em chăm: 9 câu đúng = 33 + lô đúng nhịp 10 + 2 lên bậc 12 + đạt ngày 20 + chuỗi 5 ngày 10 = 85 EXP, +1 mảnh khiên', () => {
    const r = tinhExp(cham())
    expect(tong(theoLoai(r.khoan, 'cau'))).toBe(5 * 3 + 2 * 5 + 2 * 4) // 33
    expect(tong(theoLoai(r.khoan, 'lo'))).toBe(10)
    expect(tong(theoLoai(r.khoan, 'len_bac'))).toBe(12)
    expect(tong(theoLoai(r.khoan, 'dat_ngay'))).toBe(20)
    expect(tong(theoLoai(r.khoan, 'chuoi'))).toBe(10)
    expect(tong(r.khoan)).toBe(85)
    expect(r.manh.map((m) => m.so)).toEqual([1])
  })
  it('em chỉ vào game vài câu: 0 EXP câu theo bảng này (game giữ 20/40/40 theo mastery, vào ví như cũ, không thưởng đôi)', () => {
    const r = tinhExp(vao({ suKien: ['G1', 'G2', 'G3', 'G4'].map((q) => sk(q, 1, { nguon: 'game' })) }))
    expect(r).toEqual({ khoan: [], manh: [] })
  })
  it('em làm ít (4 câu Phần I không sao, chưa đạt ngày) = 8 EXP; em làm nhiều gấp đôi mục tiêu ngày vẫn có trần mềm', () => {
    expect(tong(tinhExp(vao({ suKien: ['A', 'B', 'C', 'D'].map((q) => sk(q, 1)) })).khoan)).toBe(8)
    const nhieu = Array.from({ length: 24 }, (_, i) => sk(`Q${i}`, 1, { luc: luc(i) }))
    expect(tong(tinhExp(vao({ mucTieuCau: 8, suKien: nhieu })).khoan)).toBe(16 * 2 + 8 * 1) // 40
  })
})
