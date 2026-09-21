// "ĐẠT NHIỆM VỤ NGÀY" — hàm THUẦN dùng chung `src/lib/dat-nhiem-vu-ngay.ts` (Code 1, 21/09/2026; Boss: giữ nguyên hành vi, gom ba nơi chép công thức).
// Nghiệm thu: công thức Y HỆT `exp-d1.ts` (đủ tối thiểu · không trễ nhịp · lên bậc HOẶC không có câu tới hạn) · ĐƠN ĐIỆU: thêm sự kiện (nhất là câu lên bậc) không làm MẤT đạt ·
// hai đường (mảnh thời gian thực / chốt ngày) KHỚP khi không có ca chưa công bố · các ca 2a, 2b, 3a Code 1 báo Boss được GHI LẠI thành test MÔ TẢ HÀNH VI HIỆN TẠI
// (không phải điều nên giữ mãi: Boss trình thầy hai chỗ chỉnh luật) · thuần (không sửa đầu vào, tất định).
import { describe, expect, it } from 'vitest'
import { mulberry32 } from '../src/lib/exam-shuffle'
import { ketQuaChotNgay, laDatNgay, thieuDat, tinhDatNhiemVuNgay, type DauVaoDatNgay, type SoDoNgay, type SuKienDat, type ThieuDat } from '../src/lib/dat-nhiem-vu-ngay'

const HOM_NAY = '2026-09-21'
const TRUOC = ['2026-09-15', '2026-09-17', '2026-09-19', '2026-09-20']
/** Một dòng sổ: `gio` = 'HH:MM' UTC ghép vào ngày để `luc` sắp xếp được như chuỗi. */
const sk = (qid: string, ngayVn: string, ketQua: 0 | 1 | null, gio = '10:00'): SuKienDat => ({ qid, ngayVn, luc: `${ngayVn}T${gio}:00.000Z`, ketQua })
const vao = (soTho: SuKienDat[], o: Partial<DauVaoDatNgay> = {}): DauVaoDatNgay => ({
  coKeHoach: true,
  toiThieu: 4,
  laNghi: false,
  homNay: HOM_NAY,
  tu: '2026-09-10T00:00:00.000Z',
  tuNgay: '2026-09-10',
  soTho,
  so: soTho,
  treNhip: false,
  soCauToiHan: 0,
  ...o,
})
const tinh = (soTho: SuKienDat[], o: Partial<DauVaoDatNgay> = {}) => tinhDatNhiemVuNgay(vao(soTho, o))!
/** N câu MỚI (chưa từng làm) hôm nay, mỗi câu một mã. */
const cauMoi = (n: number, ketQua: 0 | 1, tienTo = 'M') => Array.from({ length: n }, (_, i) => sk(`${tienTo}${i}`, HOM_NAY, ketQua, `1${i % 10}:00`))
/** Một câu ÔN: từng SAI ở ngày trước, hôm nay làm `ketQua`. */
const cauOn = (qid: string, ketQua: 0 | 1) => [sk(qid, TRUOC[0]!, 0), sk(qid, HOM_NAY, ketQua, '11:00')]

describe('công thức: đủ tối thiểu · không trễ nhịp · (lên bậc HOẶC không câu tới hạn)', () => {
  it('chưa có kế hoạch đã lưu, hoặc chưa có mức tối thiểu ⇒ chưa xét (null)', () => {
    expect(tinhDatNhiemVuNgay(vao(cauMoi(6, 1), { coKeHoach: false }))).toBeNull()
    expect(tinhDatNhiemVuNgay(vao(cauMoi(6, 1), { toiThieu: undefined }))).toBeNull()
  })
  it('ngày nghỉ ⇒ không đạt, không thiếu gì, đã làm 0 (dù có làm)', () => {
    expect(tinh(cauMoi(9, 1), { laNghi: true })).toEqual({ dat: false, thieu: [], daLam: 0, toiThieu: 4, luc: '', laNghi: true })
  })
  it('đủ tối thiểu, không trễ nhịp, không câu tới hạn ⇒ đạt; thiếu từng vế ⇒ báo đúng vế, đúng thứ tự (câu tối thiểu → trễ nhịp → chưa lên bậc)', () => {
    expect(tinh(cauMoi(4, 1))).toMatchObject({ dat: true, thieu: [], daLam: 4, toiThieu: 4, laNghi: false })
    expect(tinh(cauMoi(3, 1)).thieu).toEqual(['cau_toi_thieu'])
    expect(tinh(cauMoi(4, 1), { treNhip: true }).thieu).toEqual(['tre_nhip'])
    expect(tinh(cauMoi(4, 1), { soCauToiHan: 2 }).thieu).toEqual(['chua_len_bac'])
    expect(tinh(cauMoi(2, 1), { treNhip: true, soCauToiHan: 3 })).toMatchObject({ dat: false, thieu: ['cau_toi_thieu', 'tre_nhip', 'chua_len_bac'] })
  })
  it('đếm câu KHÁC NHAU: cùng một câu làm 4 lần chỉ là 1 câu', () => {
    const lap = [0, 1, 2, 3].map((i) => sk('Q1', HOM_NAY, i % 2 === 0 ? 0 : 1, `1${i}:00`))
    expect(tinh(lap)).toMatchObject({ daLam: 1, dat: false, thieu: ['cau_toi_thieu'] })
  })
  it('chỉ tính việc CỦA NGÀY xét (sự kiện ngày khác không góp vào "đã làm")', () => {
    expect(tinh([...cauMoi(3, 1), sk('X', TRUOC[3]!, 1), sk('Y', '2026-09-22', 1)]).daLam).toBe(3)
  })
  it('lên bậc: câu đúng hôm nay mà TRƯỚC đó từng sai HOẶC chưa có kết quả (null); câu trước đó chỉ toàn đúng thì KHÔNG phải lên bậc', () => {
    const co = (truoc: 0 | 1 | null) => tinh([...cauMoi(3, 1), sk('Z', TRUOC[0]!, truoc), sk('Z', HOM_NAY, 1, '12:00')], { soCauToiHan: 5 })
    expect(co(0).dat).toBe(true)
    expect(co(null).dat).toBe(true)
    expect(co(1)).toMatchObject({ dat: false, thieu: ['chua_len_bac'] })
    // từng sai MỘT lần bất kỳ trong quá khứ (kể cả đã sửa đúng từ lâu) vẫn là "lên bậc" khi hôm nay đúng
    expect(tinh([...cauMoi(3, 1), sk('Z', TRUOC[0]!, 0), sk('Z', TRUOC[1]!, 1), sk('Z', HOM_NAY, 1, '12:00')], { soCauToiHan: 5 }).dat).toBe(true)
    // câu sai hôm nay, hay chưa từng làm trước đó, không phải lên bậc
    expect(tinh([...cauMoi(3, 1), sk('Z', TRUOC[0]!, 0), sk('Z', HOM_NAY, 0, '12:00')], { soCauToiHan: 5 }).thieu).toEqual(['chua_len_bac'])
  })
  it('`luc` = lúc lớn nhất trong các dòng đã tính của ngày; không có dòng nào ⇒ chuỗi rỗng', () => {
    expect(tinh([sk('A', HOM_NAY, 1, '08:00'), sk('B', HOM_NAY, 0, '21:15'), sk('C', HOM_NAY, 1, '09:00')]).luc).toBe('2026-09-21T21:15:00.000Z')
    expect(tinh([]).luc).toBe('')
  })
  it('thieuDat / laDatNgay / ketQuaChotNgay: dat ⇔ thiếu rỗng; chưa đạt mà có làm ⇒ mot_phan; không làm câu nào ⇒ khong', () => {
    const d = (o: Partial<SoDoNgay> = {}): SoDoNgay => ({ daLam: 5, lenBac: 1, toiThieu: 4, treNhip: false, soCauToiHan: 3, ...o })
    expect(laDatNgay(d())).toBe(true)
    expect(ketQuaChotNgay(d())).toBe('dat')
    expect(ketQuaChotNgay(d({ daLam: 2 }))).toBe('mot_phan')
    expect(ketQuaChotNgay(d({ treNhip: true }))).toBe('mot_phan')
    expect(ketQuaChotNgay(d({ daLam: 0, lenBac: 0 }))).toBe('khong')
    expect(thieuDat(d({ daLam: 0, lenBac: 0, treNhip: true }))).toEqual(['cau_toi_thieu', 'tre_nhip', 'chua_len_bac'])
    expect(thieuDat(d({ lenBac: 0, soCauToiHan: 0 }))).toEqual([]) // không có câu tới hạn ⇒ không đòi lên bậc
  })
})

describe('HÀNH VI HIỆN TẠI đã báo Boss (ghi lại, KHÔNG đổi): 2a · 2b · 3a', () => {
  it('2a · LÀM ÍT vẫn đạt: 4 câu SAI HẾT (mục tiêu ≤ 8 ⇒ tối thiểu 4) vẫn đạt khi hôm nay không có câu tới hạn — đúng/sai không được xét', () => {
    const r = tinh(cauMoi(4, 0))
    expect(r).toMatchObject({ dat: true, thieu: [], daLam: 4 })
    // đảo đúng/sai không đổi kết luận
    expect(tinh(cauMoi(4, 1)).dat).toBe(true)
  })
  it('2b · LÀM ÍT vẫn đạt: có 40 câu tới hạn, chỉ 1 câu ôn ĐÚNG (lên bậc) + 3 câu mới SAI là đạt; 39 câu ôn kia không ai đòi', () => {
    const r = tinh([...cauOn('ON0', 1), ...cauMoi(3, 0)], { soCauToiHan: 40 })
    expect(r).toMatchObject({ dat: true, thieu: [], daLam: 4 })
    // cùng ngày, làm đúng 3 câu mới + 1 câu ôn SAI ⇒ không đạt: chỉ một câu ôn ĐÚNG mới cứu được ngày
    expect(tinh([...cauOn('ON0', 0), ...cauMoi(3, 1)], { soCauToiHan: 40 })).toMatchObject({ dat: false, thieu: ['chua_len_bac'] })
  })
  it('3a · LÀM NHIỀU không đạt: 30 câu mới đều ĐÚNG mà hôm nay có câu tới hạn và không câu ôn nào lên bậc ⇒ KHÔNG đạt (thiếu "chưa lên bậc"), nhưng "đủ câu" thì có', () => {
    const r = tinh(cauMoi(30, 1), { soCauToiHan: 5 })
    expect(r).toMatchObject({ dat: false, thieu: ['chua_len_bac'], daLam: 30 })
    // nhiều gấp 10 lần mức tối thiểu cũng không bù được vế này
    expect(tinh(cauMoi(80, 1), { soCauToiHan: 1 }).dat).toBe(false)
    // bỏ vế tới hạn thì cùng bộ câu ấy đạt
    expect(tinh(cauMoi(30, 1), { soCauToiHan: 0 }).dat).toBe(true)
  })
  it('3b (đầu vào ngoài hàm) · trễ nhịp đọc từ kế hoạch ĐÃ LƯU: làm 30 câu lên bậc đủ cả mà treNhip còn true (kế hoạch chưa lập lại) ⇒ không đạt', () => {
    expect(tinh([...cauOn('ON0', 1), ...cauMoi(29, 1)], { soCauToiHan: 3, treNhip: true })).toMatchObject({ dat: false, thieu: ['tre_nhip'] })
  })
})

// ---------- lưới ngẫu nhiên tất định ----------
interface Ca {
  sk: SuKienDat[]
  toiThieu: number
  treNhip: boolean
  soCauToiHan: number
}
function ngauNhien(hat: number): Ca {
  const r = mulberry32(hat)
  const ri = (a: number, b: number) => a + Math.floor(r() * (b - a + 1))
  const ds: SuKienDat[] = []
  const soCau = ri(0, 14)
  for (let i = 0; i < soCau; i++) {
    const qid = `Q${ri(0, 11)}`
    // 0–3 lần làm ở ngày trước
    for (let k = ri(0, 3); k > 0; k--) ds.push(sk(qid, TRUOC[ri(0, 3)]!, ([0, 1, null] as const)[ri(0, 2)]!, `0${ri(0, 9)}:00`))
    // 0–2 lần hôm nay
    for (let k = ri(0, 2); k > 0; k--) ds.push(sk(qid, HOM_NAY, ([0, 1, 1, null] as const)[ri(0, 3)]!, `${String(ri(6, 22)).padStart(2, '0')}:${String(ri(0, 5) * 10).padStart(2, '0')}`))
  }
  return { sk: ds, toiThieu: ri(4, 8), treNhip: r() < 0.25, soCauToiHan: r() < 0.5 ? 0 : ri(1, 40) }
}
const CAC = Array.from({ length: 4000 }, (_, i) => ({ c: ngauNhien(2109 + i), i }))
const cua = (c: Ca, them: SuKienDat[] = [], o: Partial<DauVaoDatNgay> = {}) => tinh([...c.sk, ...them], { toiThieu: c.toiThieu, treNhip: c.treNhip, soCauToiHan: c.soCauToiHan, ...o })

describe('TÍNH CHẤT trên 4000 sổ ngẫu nhiên', () => {
  it('lưới có đủ ca đạt và không đạt (phép kiểm có nghĩa)', () => {
    const dat = CAC.filter(({ c }) => cua(c).dat).length
    expect(dat).toBeGreaterThan(300)
    expect(CAC.length - dat).toBeGreaterThan(300)
  })
  it('dat ⇔ thiếu rỗng; thiếu theo đúng thứ tự cố định, không trùng; daLam = số câu khác nhau hôm nay', () => {
    const THU_TU: ThieuDat[] = ['cau_toi_thieu', 'tre_nhip', 'chua_len_bac']
    for (const { c, i } of CAC) {
      const r = cua(c)
      expect(r.dat, `#${i}`).toBe(r.thieu.length === 0)
      expect(r.thieu, `#${i}`).toEqual(THU_TU.filter((t) => r.thieu.includes(t)))
      expect(r.daLam, `#${i}`).toBe(new Set(c.sk.filter((e) => e.ngayVn === HOM_NAY).map((e) => e.qid)).size)
      expect(r.thieu.includes('cau_toi_thieu'), `#${i}`).toBe(r.daLam < c.toiThieu)
      expect(r.thieu.includes('tre_nhip'), `#${i}`).toBe(c.treNhip)
    }
  })
  it('ĐƠN ĐIỆU: thêm BẤT KỲ sự kiện nào không làm MẤT đạt và không thêm điều còn thiếu (thiếu sau ⊆ thiếu trước)', () => {
    const r = mulberry32(77)
    for (const { c, i } of CAC) {
      const truoc = cua(c)
      const them: SuKienDat[] = []
      for (let k = 1 + Math.floor(r() * 3); k > 0; k--) {
        const ngay = r() < 0.6 ? HOM_NAY : TRUOC[Math.floor(r() * 4)]!
        them.push(sk(`Q${Math.floor(r() * 14)}`, ngay, ([0, 1, null] as const)[Math.floor(r() * 3)]!, `${String(6 + Math.floor(r() * 16)).padStart(2, '0')}:00`))
      }
      const sau = cua(c, them)
      if (truoc.dat) expect(sau.dat, `#${i} mất đạt`).toBe(true)
      for (const t of sau.thieu) expect(truoc.thieu, `#${i} thêm điều thiếu ${t}`).toContain(t)
      expect(sau.daLam, `#${i}`).toBeGreaterThanOrEqual(truoc.daLam)
    }
  })
  it('ĐƠN ĐIỆU (câu lên bậc): thêm một câu ôn từng sai + hôm nay đúng không làm mất đạt, và luôn gỡ được điều thiếu "chưa lên bậc"', () => {
    for (const { c, i } of CAC) {
      const truoc = cua(c)
      const sau = cua(c, cauOn('ON_MOI', 1))
      if (truoc.dat) expect(sau.dat, `#${i}`).toBe(true)
      expect(sau.thieu, `#${i}`).not.toContain('chua_len_bac')
      // và chỉ khi câu ôn đó là câu MỚI trong ngày thì "đã làm" tăng đúng 1
      expect(sau.daLam, `#${i}`).toBe(truoc.daLam + 1)
    }
  })
  it('ĐƠN ĐIỆU theo kế hoạch: nâng mức tối thiểu, thêm trễ nhịp hay thêm câu tới hạn KHÔNG bao giờ biến "chưa đạt" thành "đạt"', () => {
    for (const { c, i } of CAC) {
      const goc = cua(c)
      for (const kho of [cua(c, [], { toiThieu: c.toiThieu + 1 }), cua(c, [], { treNhip: true }), cua(c, [], { soCauToiHan: c.soCauToiHan + 1 })]) {
        if (!goc.dat) expect(kho.dat, `#${i}`).toBe(false)
      }
      // ngược lại: hạ tối thiểu / hết trễ nhịp / hết câu tới hạn không làm MẤT đạt
      for (const de of [cua(c, [], { toiThieu: Math.max(0, c.toiThieu - 1) }), cua(c, [], { treNhip: false }), cua(c, [], { soCauToiHan: 0 })]) {
        if (goc.dat) expect(de.dat, `#${i}`).toBe(true)
      }
    }
  })
  it('ĐÚNG/SAI VÔ CAN khi không có câu tới hạn: đảo hết kết quả hôm nay không đổi kết luận (đạt chỉ còn phụ thuộc số câu và trễ nhịp)', () => {
    for (const { c, i } of CAC) {
      const dao = c.sk.map((e) => (e.ngayVn === HOM_NAY ? { ...e, ketQua: (e.ketQua === 1 ? 0 : 1) as 0 | 1 } : e))
      const a = tinh(c.sk, { toiThieu: c.toiThieu, treNhip: c.treNhip, soCauToiHan: 0 })
      const b = tinh(dao, { toiThieu: c.toiThieu, treNhip: c.treNhip, soCauToiHan: 0 })
      expect(b.dat, `#${i}`).toBe(a.dat)
      expect(a.dat, `#${i}`).toBe(a.daLam >= c.toiThieu && !c.treNhip)
    }
  })
  it('NGÀY PHÁT HÀNH: chỉ ở ngày của mốc, việc TRƯỚC mốc không tính (không "đạt miễn phí" lúc bật); ngày khác mốc thì tính đủ; lịch sử ngày trước vẫn dùng để xác định lên bậc', () => {
    const r = mulberry32(31)
    for (const { c, i } of CAC.slice(0, 1500)) {
      const tu = `${HOM_NAY}T${String(6 + Math.floor(r() * 16)).padStart(2, '0')}:00:00.000Z`
      const rr = cua(c, [], { tu, tuNgay: HOM_NAY })
      const daLamSau = new Set(c.sk.filter((e) => e.ngayVn === HOM_NAY && e.luc >= tu).map((e) => e.qid)).size
      expect(rr.daLam, `#${i}`).toBe(daLamSau)
      expect(rr.daLam, `#${i}`).toBeLessThanOrEqual(cua(c).daLam)
      // mốc ở ngày trước: tính đủ như không có mốc
      expect(cua(c, [], { tu: '2026-09-19T05:00:00.000Z', tuNgay: '2026-09-19' }).daLam, `#${i}`).toBe(cua(c).daLam)
    }
  })
  it('THUẦN: cùng đầu vào cho cùng kết quả; không sửa đầu vào (đóng băng sâu vẫn chạy)', () => {
    for (const { c, i } of CAC.slice(0, 800)) {
      const v = vao(c.sk, { toiThieu: c.toiThieu, treNhip: c.treNhip, soCauToiHan: c.soCauToiHan })
      for (const e of v.soTho) Object.freeze(e)
      Object.freeze(v.soTho)
      Object.freeze(v)
      expect(tinhDatNhiemVuNgay(v), `#${i}`).toEqual(tinhDatNhiemVuNgay(v))
    }
  })
})

/**
 * Bản dựng lại bằng JS của SQL `TIEN_BO_NGAY` (ke-hoach-ngay-d1.ts) trên sổ THÔ — nguồn số đo của CHỐT NGÀY (`chotNgayCu`):
 * da = số câu khác nhau trong ngày; len = số câu khác nhau đúng trong ngày mà TRƯỚC ngày ấy từng sai hoặc chưa có kết quả.
 */
function soDoTheoSql(ds: readonly SuKienDat[], ngay: string): { da: number; len: number } {
  const homNay = ds.filter((e) => e.ngayVn === ngay)
  const da = new Set(homNay.map((e) => e.qid)).size
  const len = new Set(homNay.filter((e) => e.ketQua === 1 && ds.some((p) => p.qid === e.qid && p.ngayVn < e.ngayVn && (p.ketQua === 0 || p.ketQua === null))).map((e) => e.qid)).size
  return { da, len }
}

/**
 * KHỐI `chiTietDat` NGUYÊN VĂN của `server/src/exp-d1.ts` (dòng 419–435, chép nguyên cách viết, chỉ đổi biến ngoài thành tham số) — chuẩn để chứng minh hàm dùng chung
 * Y HỆT hành vi đang chạy. Khi Code 3 nối hàm vào exp-d1.ts thì bản chép này vẫn là "hành vi trước khi nối".
 */
function chiTietDatNguyenVan(p: { coKeHoach: boolean; toiThieu: number | undefined; laNghi: boolean; homNay: string; tu: string; tuNgay: string; soTho: SuKienDat[]; so: SuKienDat[]; treNhip: boolean; soCauToiHan: number }) {
  const { coKeHoach, toiThieu, laNghi, homNay, tu, tuNgay, soTho, so, treNhip, soCauToiHan } = p
  if (!coKeHoach || toiThieu === undefined) return null
  if (laNghi) return { dat: false, thieu: [] as string[], daLam: 0, toiThieu, luc: '', laNghi: true }
  const sauMoc = (e: SuKienDat) => homNay !== tuNgay || e.luc >= tu
  const dsHomNay = soTho.filter((e) => e.ngayVn === homNay && sauMoc(e))
  const daLam = new Set(dsHomNay.map((e) => e.qid)).size
  const truocHomNay = new Map<string, boolean>()
  for (const e of so) if (e.ngayVn < homNay && (e.ketQua === 0 || e.ketQua === null)) truocHomNay.set(e.qid, true)
  const lenBac = new Set(so.filter((e) => e.ngayVn === homNay && sauMoc(e) && e.ketQua === 1 && truocHomNay.has(e.qid)).map((e) => e.qid)).size
  const thieu: string[] = []
  if (daLam < toiThieu) thieu.push('cau_toi_thieu')
  if (treNhip) thieu.push('tre_nhip')
  if (lenBac < 1 && soCauToiHan > 0) thieu.push('chua_len_bac')
  return { dat: thieu.length === 0, thieu, daLam, toiThieu, luc: dsHomNay.reduce((m, e) => (e.luc > m ? e.luc : m), ''), laNghi: false }
}

describe('Y HỆT khối chiTietDat hiện có của exp-d1.ts (đối chiếu nguyên văn trên lưới ngẫu nhiên)', () => {
  it('4000 sổ × sổ đã lọc ngẫu nhiên × mốc phát hành ngẫu nhiên × ngày nghỉ × chưa có kế hoạch: hai bên trả CÙNG kết quả', () => {
    const r = mulberry32(555)
    let khacNhauSo = 0
    for (const { c, i } of CAC) {
      const so = r() < 0.4 ? c.sk.filter(() => r() < 0.8) : c.sk // đôi khi sổ đã lọc thiếu vài dòng (ca chưa công bố)
      if (so.length !== c.sk.length) khacNhauSo++
      const cheDo = r()
      const tuNgay = cheDo < 0.3 ? HOM_NAY : '2026-09-10'
      const tu = tuNgay === HOM_NAY ? `${HOM_NAY}T${String(6 + Math.floor(r() * 16)).padStart(2, '0')}:00:00.000Z` : '2026-09-10T00:00:00.000Z'
      const dv = { coKeHoach: r() > 0.05, toiThieu: r() < 0.05 ? undefined : c.toiThieu, laNghi: r() < 0.06, homNay: HOM_NAY, tu, tuNgay, soTho: c.sk, so, treNhip: c.treNhip, soCauToiHan: c.soCauToiHan }
      expect(tinhDatNhiemVuNgay(dv), `#${i}`).toEqual(chiTietDatNguyenVan(dv))
    }
    expect(khacNhauSo, 'lưới có ca sổ đã lọc ≠ sổ thô').toBeGreaterThan(500)
  })
})

describe('HAI ĐƯỜNG KHỚP: mảnh (thời gian thực) và chuỗi (chốt ngày) — khi không có ca chưa công bố', () => {
  it('trên 4000 sổ: ketQuaChotNgay(số đo SQL) = "dat" ⇔ tinhDatNhiemVuNgay.dat; chốt "khong" ⇔ chưa làm câu nào; thiếu giống nhau', () => {
    for (const { c, i } of CAC) {
      const tb = soDoTheoSql(c.sk, HOM_NAY)
      const dv: SoDoNgay = { daLam: tb.da, lenBac: tb.len, toiThieu: c.toiThieu, treNhip: c.treNhip, soCauToiHan: c.soCauToiHan }
      const chot = ketQuaChotNgay(dv)
      const tt = cua(c)
      expect(chot === 'dat', `#${i}`).toBe(tt.dat)
      expect(thieuDat(dv), `#${i}`).toEqual(tt.thieu)
      expect(chot === 'khong', `#${i}`).toBe(tt.daLam === 0)
      expect(tb.da, `#${i}`).toBe(tt.daLam)
    }
  })
  it('công thức nội tuyến CŨ của chotNgayCu (`da >= toiThieu && !treNhip && (len >= 1 || coToiHan === 0)`) khớp hàm dùng chung trên mọi số đo hợp lệ', () => {
    const r = mulberry32(9)
    for (let i = 0; i < 6000; i++) {
      const d: SoDoNgay = { daLam: Math.floor(r() * 12), lenBac: Math.floor(r() * 4), toiThieu: 4 + Math.floor(r() * 5), treNhip: r() < 0.3, soCauToiHan: r() < 0.5 ? 0 : 1 + Math.floor(r() * 30) }
      const cu = d.daLam >= d.toiThieu && !d.treNhip && (d.lenBac >= 1 || d.soCauToiHan === 0)
      expect(laDatNgay(d), JSON.stringify(d)).toBe(cu)
      const kqCu = cu ? 'dat' : d.daLam >= 1 ? 'mot_phan' : 'khong'
      expect(ketQuaChotNgay(d), JSON.stringify(d)).toBe(kqCu)
    }
  })
  it('LỆCH ĐÃ BIẾT (báo Boss 21/09, hành vi HIỆN TẠI — Code 3 quyết cách gom): câu ca thi CHƯA công bố làm đúng hôm nay, từng sai trước đó: thời gian thực bỏ nó khi tính lên bậc ⇒ "chưa lên bậc"; chốt ngày dùng SQL thô ⇒ "dat"', () => {
    const thi = [sk('THI1', TRUOC[0]!, 0), sk('THI1', HOM_NAY, 1, '09:00')] // ca chưa công bố: sổ ĐÃ lọc không có dòng hôm nay của câu này
    const soTho = [...cauMoi(3, 1), ...thi]
    const so = [...cauMoi(3, 1), thi[0]!] // dòng "thi" hôm nay bị lọc (chưa công bố); "đã làm" vẫn đếm nó qua soTho
    const tt = tinhDatNhiemVuNgay(vao(soTho, { so, soCauToiHan: 4 }))!
    expect(tt).toMatchObject({ daLam: 4, dat: false, thieu: ['chua_len_bac'] })
    const tb = soDoTheoSql(soTho, HOM_NAY)
    expect(ketQuaChotNgay({ daLam: tb.da, lenBac: tb.len, toiThieu: 4, treNhip: false, soCauToiHan: 4 })).toBe('dat')
  })
})
