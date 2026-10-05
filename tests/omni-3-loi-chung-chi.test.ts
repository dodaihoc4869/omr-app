// @vitest-environment node
// OMNI 3 · GĐ A — dự báo đầy đủ (con đường rẻ nhất, còn thiếu, khả thi), chứng chỉ Sẵn sàng 8+ (K ∧ C ∧ M ∧ T), hồ sơ mệt theo giờ,
// ma trận Q gợi từ nhãn kho, đầu vào kế hoạch (trọng số câu, dạng đã vững, ôn bài cũ, chế độ chờ, hạn bài).
import { describe, expect, it } from 'vitest'
import { THAM_SO_OMNI, type DuBao, type HoSoVkn, type QCau, type Vkn } from '../server/src/omni-kieu'
import { chiPhiDuong, conThieuCua, duBaoDiem, luotCan, pHatTheoVkn, trongSoCau, DUONG_8 } from '../server/src/du-bao-diem'
import { uocNgayChungChi, xetChungChi } from '../server/src/omni-chung-chi'
import { xetMetGio } from '../server/src/omni-met-gio'
import { chuanHoaNhan, goiYQ, qMacDinh, vknMacDinh, vknNenTuBuoc, SO_NEN_TOI_DA } from '../server/src/omni-q'
import { dangDaVung, soNgayHanBai, theLucCho, tiLeOnBaiCu, trongSoCacCau } from '../server/src/omni-ke-hoach'
import { KHO_MO_PHONG, hoSoTuP, moiKnBang, vknHs } from './omni-3-loi-chung'

const ts = THAM_SO_OMNI
const qc = (qid: string, phan: QCau['phan'], vkn: string[], them: Partial<QCau> = {}): QCau => ({ qid, phan, maDang: 'D', mucDo: null, vkn, nguon: 'thay', ...them })

/** Phạm vi giả với vi kỹ năng TÁCH RỜI: Phần I/III dùng i1..i4 (cặp), ý Đúng–sai dùng y1..y4. */
const PHAM_VI_TACH: QCau[] = [
  ...[['i1', 'i2'], ['i3', 'i4'], ['i1', 'i3'], ['i2', 'i4'], ['i1', 'i4'], ['i2', 'i3'], ['i1', 'i2'], ['i3', 'i4']].map((kn, i) => qc(`I${i}`, 'I', kn)),
  qc('II0', 'II', ['y1', 'y2', 'y3', 'y4'], { vknY: [['y1'], ['y2'], ['y3'], ['y4']] }),
  qc('II1', 'II', ['y1', 'y2', 'y3', 'y4'], { vknY: [['y4'], ['y3'], ['y2'], ['y1']] }),
  qc('III0', 'III', ['i1', 'i2']),
  qc('III1', 'III', ['i3', 'i4']),
]
const hsTach = (pI: number, pY: number, sEm: number) => hoSoTuP({ i1: pI, i2: pI, i3: pI, i4: pI, y1: pY, y2: pY, y3: pY, y4: pY }, sEm)

describe('duBaoDiem — con đường rẻ nhất (bảng 3.2), còn thiếu, số bằng chứng, khả thi', () => {
  it('đã đạt (kỳ vọng ≥ 8 và P(≥ 8) ≥ 0,9) ⇒ conDuong null', () => {
    const r = duBaoDiem(hoSoTuP(moiKnBang(0.99), 0.03), KHO_MO_PHONG)
    expect(r.kyVong).toBeGreaterThanOrEqual(8)
    expect(r.p8).toBeGreaterThanOrEqual(0.9)
    expect(r.conDuong).toBeNull()
  })
  it('đều yếu (mọi P 0,85) ⇒ A cân bằng là rẻ nhất', () => {
    const hs = hoSoTuP(moiKnBang(0.85), 0.03)
    const chiPhi = (['A', 'B', 'C'] as const).map((d) => chiPhiDuong(hs, KHO_MO_PHONG, 0.03, DUONG_8[d]))
    expect(chiPhi[0]).toBeLessThan(chiPhi[1]!)
    expect(chiPhi[0]).toBeLessThan(chiPhi[2]!)
    expect(duBaoDiem(hs, KHO_MO_PHONG).conDuong).toBe('A')
  })
  it('mạnh ý Đúng–sai, yếu Phần I ⇒ C; mạnh Phần I và cẩn thận, yếu Đúng–sai ⇒ B', () => {
    expect(duBaoDiem(hsTach(0.85, 0.97, 0.03), PHAM_VI_TACH).conDuong).toBe('C')
    expect(duBaoDiem(hsTach(0.985, 0.7, 0.02), PHAM_VI_TACH).conDuong).toBe('B')
  })
  it('sơ ý quá cao (mọi đường vượt mức với tới) ⇒ mọi chi phí vô hạn, chọn A', () => {
    const hs = hsTach(0.9, 0.9, 0.12)
    for (const d of ['A', 'B', 'C'] as const) expect(chiPhiDuong(hs, PHAM_VI_TACH, 0.12, DUONG_8[d])).toBe(Number.POSITIVE_INFINITY)
    expect(duBaoDiem(hs, PHAM_VI_TACH).conDuong).toBe('A')
  })
  it('phần đã đạt mốc không tốn lượt; chi phí = Σ luotCan từng vi kỹ năng', () => {
    const hs = hsTach(0.99, 0.99, 0.01)
    expect(chiPhiDuong(hs, PHAM_VI_TACH, 0.01, DUONG_8.A)).toBe(0)
    const hs2 = hsTach(0.99, 0.7, 0.02)
    const pHat = pHatTheoVkn(hs2, PHAM_VI_TACH, 0.02)
    const pStar = (0.9 - 0.5) / (1 - 0.02 - 0.5)
    const ky = ['y1', 'y2', 'y3', 'y4'].reduce((s, k) => s + luotCan(0.7, pStar, pHat.get(k)!, ts.T), 0)
    expect(chiPhiDuong(hs2, PHAM_VI_TACH, 0.02, DUONG_8.A)).toBeCloseTo(ky, 6)
  })
  it('conThieu: vi kỹ năng < 0,95 (yếu trước) + số ý có P nắm ý < 0,93; soBangChung = Σ nTuLam vi kỹ năng phạm vi', () => {
    const hs = hsTach(0.96, 0.96, 0.03)
    hs.vkn.i3 = vknHs('i3', 0.9, { nTuLam: 4 })
    hs.vkn.i1 = vknHs('i1', 0.8, { nTuLam: 2 })
    hs.vkn.y2 = vknHs('y2', 0.92, { nTuLam: 5 })
    hs.vkn.ngoai = vknHs('ngoai', 0.1, { nTuLam: 50 })
    const r = duBaoDiem(hs, PHAM_VI_TACH)
    expect(r.conThieu.vkn).toEqual(['i1', 'i3', 'y2'])
    expect(r.conThieu.soY).toBe(2)
    expect(r.soBangChung).toBe(11)
    expect(conThieuCua(hs, PHAM_VI_TACH)).toEqual(r.conThieu)
  })
  it('khả thi trong 50 phút: câu không kịp không có điểm; khaThi kẹp ≤ khung; mục tiêu 9 hạ P(≥ mục tiêu)', () => {
    const hs = hoSoTuP(moiKnBang(0.97), 0.04)
    const du = duBaoDiem(hs, KHO_MO_PHONG)
    const thieuGio = duBaoDiem(hs, KHO_MO_PHONG, { khaThi: { I: 18, II: 4, III: 4 } })
    expect(thieuGio.kyVong).toBeLessThan(du.kyVong)
    expect(thieuGio.khaThi).toEqual({ I: 18, II: 4, III: 4 })
    expect(du.khaThi).toBeUndefined()
    expect(duBaoDiem(hs, KHO_MO_PHONG, { khaThi: { I: 30, II: 4, III: 6 } }).khaThi).toEqual({ I: 18, II: 4, III: 6 })
    const chin = duBaoDiem(hs, KHO_MO_PHONG, { mucTieu: 9 })
    expect(chin.p8).toBeLessThan(du.p8)
    expect(chin.kyVong).toBeCloseTo(du.kyVong, 12)
  })
  it('luotCan: đúng công thức ln((1 − mục tiêu)/(1 − P))/ln(1 − T·p̂); đã đạt ⇒ 0; mục tiêu 1 ⇒ vô hạn', () => {
    expect(luotCan(0.6, 0.95, 0.8, 0.15)).toBeCloseTo(Math.log(0.05 / 0.4) / Math.log(1 - 0.12), 12)
    expect(luotCan(0.6, 0.95, 0.8, 0.15)).toBeCloseTo(16.27, 2)
    expect(luotCan(0.96, 0.95, 0.8, 0.15)).toBe(0)
    expect(luotCan(0.5, 1, 0.8, 0.15)).toBe(Number.POSITIVE_INFINITY)
    expect(luotCan(0.5, 0.9, 0, 0.15)).toBe(Number.POSITIVE_INFINITY)
  })
})

describe('xetChungChi — K ∧ C ∧ M ∧ T', () => {
  const PV: QCau[] = [qc('a', 'I', ['x', 'y']), qc('b', 'II', ['x', 'y', 'z'], { vknY: [['x'], ['y'], ['z'], ['x']] }), qc('c', 'III', ['y', 'z'])]
  const duBao = (p8: number): DuBao => ({ kyVong: 8.8, p8, saiSo: 0.4, pmf: [], conDuong: null, conThieu: { vkn: [], soY: 0 }, soBangChung: 30 })
  const hsDat = () => hoSoTuP({ x: 0.97, y: 0.96, z: 0.95 }, 0.05)
  const CA = { diem: 8.5, ngay: '2026-10-12' }
  it('đủ bốn điều kiện ⇒ đạt, không thiếu gì, uocNgay null, độ tin = P(≥ 8) của mô hình', () => {
    const r = xetChungChi(hsDat(), PV, duBao(0.93), CA, 30)
    expect(r).toEqual({ dat: true, doTin: 0.93, thieu: [], conThieu: { vkn: [], soY: 0 }, uocNgay: null })
  })
  it('K trượt: một vi kỹ năng < 0,95 ⇒ thiếu kien_thuc, conThieu nêu tên, uocNgay theo nhịp thật', () => {
    const hs = hsDat()
    hs.vkn.z = vknHs('z', 0.6)
    const r = xetChungChi(hs, PV, duBao(0.93), CA, 10)
    expect(r.dat).toBe(false)
    expect(r.thieu).toEqual(['kien_thuc'])
    expect(r.conThieu.vkn).toEqual(['z'])
    expect(r.conThieu.soY).toBe(1)
    const pHat = pHatTheoVkn(hs, PV, hs.sEm).get('z')!
    expect(r.uocNgay).toBe(Math.ceil(luotCan(0.6, 0.95, pHat, ts.T) / 10))
    expect(uocNgayChungChi(hs, PV, 1)).toBe(Math.ceil(luotCan(0.6, 0.95, pHat, ts.T)))
  })
  it('C trượt: sơ ý 0,08 > 0,07 ⇒ thiếu can_than; kiến thức đủ ⇒ uocNgay null (công thức lượt học không ước được)', () => {
    const hs = hsDat()
    hs.sEm = 0.08
    const r = xetChungChi(hs, PV, duBao(0.93), CA, 30)
    expect(r.thieu).toEqual(['can_than'])
    expect(r.uocNgay).toBeNull()
    hs.sEm = 0.07
    expect(xetChungChi(hs, PV, duBao(0.93), CA, 30).dat).toBe(true)
  })
  it('M trượt: P(≥ 8) < 0,90 ⇒ thiếu mo_hinh', () => {
    expect(xetChungChi(hsDat(), PV, duBao(0.89), CA, 30).thieu).toEqual(['mo_hinh'])
    expect(xetChungChi(hsDat(), PV, duBao(0.9), CA, 30).dat).toBe(true)
  })
  it('T trượt: chưa có ca chốt hoặc ca chốt < 8,0 ⇒ thiếu ca_chot', () => {
    expect(xetChungChi(hsDat(), PV, duBao(0.93), null, 30).thieu).toEqual(['ca_chot'])
    expect(xetChungChi(hsDat(), PV, duBao(0.93), { diem: 7.95, ngay: '2026-10-12' }, 30).thieu).toEqual(['ca_chot'])
    expect(xetChungChi(hsDat(), PV, duBao(0.93), { diem: 8, ngay: '2026-10-12' }, 30).dat).toBe(true)
  })
  it('trượt cả bốn ⇒ thieu theo thứ tự kien_thuc · can_than · mo_hinh · ca_chot; phạm vi rỗng ⇒ K trượt; nhịp 0 ⇒ uocNgay null', () => {
    const hs = hoSoTuP({ x: 0.5, y: 0.5, z: 0.5 }, 0.12)
    const r = xetChungChi(hs, PV, duBao(0.2), null, 0)
    expect(r.thieu).toEqual(['kien_thuc', 'can_than', 'mo_hinh', 'ca_chot'])
    expect(r.uocNgay).toBeNull()
    expect(xetChungChi(hsDat(), [], duBao(0.95), CA, 30).thieu).toEqual(['kien_thuc'])
    expect(xetChungChi(hs, PV, duBao(0.2), null, 40).uocNgay).toBeGreaterThan(0)
  })
  it('đi cùng duBaoDiem thật: P 0,95 · S 0,05 trên kho mô phỏng ⇒ M đạt sát ngưỡng; ca chốt quyết định', () => {
    const hs = hoSoTuP(moiKnBang(0.955), 0.05)
    const db = duBaoDiem(hs, KHO_MO_PHONG)
    expect(db.p8).toBeGreaterThanOrEqual(0.9)
    expect(xetChungChi(hs, KHO_MO_PHONG, db, CA, 40).dat).toBe(true)
    expect(xetChungChi(hs, KHO_MO_PHONG, db, null, 40).thieu).toEqual(['ca_chot'])
  })
})

describe('xetMetGio — hồ sơ mệt theo khung giờ (co Bayes về tỉ lệ chung của em)', () => {
  const kg = (o: Partial<Record<'truoc18' | '18_20' | '20_22' | '22_24' | 'sau24', [number, number]>>) => ({
    khungGio: Object.fromEntries((['truoc18', '18_20', '20_22', '22_24', 'sau24'] as const).map((k) => [k, { n: o[k]?.[0] ?? 0, soY: o[k]?.[1] ?? 0 }])) as Parameters<typeof xetMetGio>[0]['khungGio'],
  })
  it('chưa có lượt nào / khung hiện tại < 20 lượt ⇒ null', () => {
    expect(xetMetGio(kg({}), '22_24')).toBeNull()
    expect(xetMetGio(kg({ '22_24': [19, 10], '20_22': [40, 1] }), '22_24')).toBeNull()
  })
  it('khung hiện tại ≥ 2 × khung tốt nhất ⇒ kích hoạt; số đúng công thức co Bayes', () => {
    const r = xetMetGio(kg({ '22_24': [40, 10], '20_22': [40, 1] }), '22_24')!
    const chung = 11 / 80
    expect(r.tiLe).toBeCloseTo((10 + chung * 20) / 60, 12)
    expect(r.tiLeTot).toBeCloseTo((1 + chung * 20) / 60, 12)
    expect(r).toMatchObject({ khung: '22_24', khungTot: '20_22', kichHoat: true })
  })
  it('chính là khung tốt nhất, hoặc chưa tới 2 lần ⇒ không kích hoạt; em không sơ ý lần nào ⇒ không kích hoạt', () => {
    expect(xetMetGio(kg({ '22_24': [40, 10], '20_22': [40, 1] }), '20_22')!.kichHoat).toBe(false)
    expect(xetMetGio(kg({ '22_24': [40, 3], '20_22': [40, 2] }), '22_24')!.kichHoat).toBe(false)
    expect(xetMetGio(kg({ '22_24': [40, 0], '20_22': [40, 0] }), '22_24')!.kichHoat).toBe(false)
  })
  it('khung tốt nhất chỉ xét khung có ≥ 20 lượt thật', () => {
    const r = xetMetGio(kg({ '22_24': [30, 6], truoc18: [5, 0], '18_20': [30, 5] }), '22_24')!
    expect(r.khungTot).toBe('18_20')
    expect(r.kichHoat).toBe(false)
  })
})

describe('goiYQ — mã vi kỹ năng thống nhất: dang:<ma> ∪ kienThuc khớp vknDang ∪ nen:<nhãn>', () => {
  const VKN: Vkn[] = [
    { id: 'D#1', maDang: 'D', ten: 'Viết đúng phương trình thuỷ phân', thuTu: 1 },
    { id: 'D#2', maDang: 'D', ten: 'Tỉ lệ mol ester – NaOH', nhanNen: 'ti le mol este phenol', thuTu: 2 },
    { id: 'D#3', maDang: 'D', ten: 'Xử lý hỗn hợp hai ester', thuTu: 0 },
  ]
  const TEN_NEN_GIA = { bao_toan_khoi_luong: 'Bảo toàn khối lượng', hieu_suat: 'Hiệu suất phản ứng', chat_du_het: 'Chất dư, chất hết', lap_he_phuong_trinh: 'Lập hệ phương trình' }
  const goc = { qid: 'q1', phan: 'I' as const, maDang: 'D', mucDo: 'VD' }
  it('chuẩn hoá nhãn: bỏ dấu, thường hoá, gộp khoảng trắng', () => {
    expect(chuanHoaNhan('  Bảo   toàn KHỐI lượng ')).toBe('bao toan khoi luong')
    expect(chuanHoaNhan('Đường glucozơ')).toBe('duong glucozo')
    expect(chuanHoaNhan(null)).toBe('')
  })
  it('không nhãn nào ⇒ qMacDinh (dang:<ma>; không dạng ⇒ cd:<chuyên đề> ⇒ cau:<qid>)', () => {
    expect(goiYQ(goc, VKN)).toEqual(qMacDinh('q1', 'I', 'D', 'VD'))
    expect(goiYQ({ ...goc, maDang: null, chuyenDe: 'Ester' }, VKN).vkn).toEqual(['cd:Ester'])
    expect(vknMacDinh(null, null, 'q9')).toBe('cau:q9')
    expect(goiYQ({ ...goc, kienThuc: ['không khớp gì'], nhanNen: [{ buoc: 1, nen: 'khac' }] }, VKN, TEN_NEN_GIA).nguon).toBe('mac_dinh')
  })
  it('kienThuc khớp tên hoặc nhãn nền của vi kỹ năng (đã chuẩn hoá) ⇒ thêm vào sau dang:, sắp theo thuTu; nguon goi_y', () => {
    const r = goiYQ({ ...goc, kienThuc: ['tỉ lệ MOL ester – naoh', 'Viết đúng   phương trình thuỷ phân', 'xu ly hon hop hai ester'] }, VKN)
    expect(r.vkn).toEqual(['dang:D', 'D#3', 'D#1', 'D#2'])
    expect(r.nguon).toBe('goi_y')
    expect(goiYQ({ ...goc, kienThuc: ['Tỉ lệ mol este phenol'] }, VKN).vkn).toEqual(['dang:D', 'D#2'])
  })
  it('nhãn nền từng bước ⇒ nen:<nhãn> theo thứ tự bước, bỏ trùng, chỉ nhãn thuộc danh mục (bỏ khac), tối đa 3', () => {
    const nhanNen = [{ buoc: 3, nen: 'hieu_suat' }, { buoc: 1, nen: 'bao_toan_khoi_luong' }, { buoc: 2, nen: 'khac' }, { buoc: 4, nen: 'bao_toan_khoi_luong' }, { buoc: 5, nen: 'nhan_la' }, { buoc: 6, nen: 'chat_du_het' }, { buoc: 7, nen: 'lap_he_phuong_trinh' }]
    const r = goiYQ({ ...goc, nhanNen }, VKN, TEN_NEN_GIA)
    expect(r.vkn).toEqual(['dang:D', 'nen:bao_toan_khoi_luong', 'nen:hieu_suat', 'nen:chat_du_het'])
    expect(r.vkn.filter((k) => k.startsWith('nen:'))).toHaveLength(SO_NEN_TOI_DA)
    expect(r.nguon).toBe('goi_y')
    // không truyền danh mục ⇒ nhận nhãn đúng dạng a-z0-9_ (nhan_la được nhận), vẫn bỏ khac và nhãn sai dạng
    expect(vknNenTuBuoc([{ buoc: 1, nen: 'nhan_la' }, { buoc: 2, nen: 'khac' }, { buoc: 3, nen: 'Sai Dạng' }])).toEqual(['nen:nhan_la'])
    expect(vknNenTuBuoc([{ buoc: 1, nen: 'nhan_la' }], new Set(['hieu_suat']))).toEqual([])
    expect(vknNenTuBuoc([{ buoc: 1, nen: 'hieu_suat' }], ['hieu_suat'])).toEqual(['nen:hieu_suat'])
  })
  it('kết hợp: dang ∪ kienThuc ∪ nen (cổng AND)', () => {
    const r = goiYQ({ ...goc, kienThuc: ['Xử lý hỗn hợp hai ester'], nhanNen: [{ buoc: 1, nen: 'bao_toan_khoi_luong' }] }, VKN, TEN_NEN_GIA)
    expect(r.vkn).toEqual(['dang:D', 'D#3', 'nen:bao_toan_khoi_luong'])
    expect(r.vknY).toBeUndefined()
  })
  it('Phần II: ý có dữ liệu riêng ⇒ vknY[i] = dang ∪ khớp của ý ∪ nen của ý; ý không có ⇒ vkn của câu; không ý nào có ⇒ không vknY', () => {
    const cau = {
      qid: 'd1', phan: 'II' as const, maDang: 'D', mucDo: null,
      nhanNen: [{ buoc: 1, nen: 'hieu_suat' }],
      kienThucY: [['Tỉ lệ mol ester – NaOH'], [], [], []],
      nhanNenY: [[], [{ buoc: 2, nen: 'bao_toan_khoi_luong' }], [], []],
    }
    const r = goiYQ(cau, VKN, TEN_NEN_GIA)
    expect(r.vkn).toEqual(['dang:D', 'nen:hieu_suat'])
    expect(r.vknY).toEqual([['dang:D', 'D#2'], ['dang:D', 'nen:bao_toan_khoi_luong'], ['dang:D', 'nen:hieu_suat'], ['dang:D', 'nen:hieu_suat']])
    expect(r.nguon).toBe('goi_y')
    const khongY = goiYQ({ ...cau, kienThucY: undefined, nhanNenY: undefined }, VKN, TEN_NEN_GIA)
    expect(khongY.vknY).toBeUndefined()
    expect(khongY.vkn).toEqual(['dang:D', 'nen:hieu_suat'])
    const chiY = goiYQ({ ...cau, nhanNen: [] }, VKN, TEN_NEN_GIA)
    expect(chiY.vkn).toEqual(['dang:D'])
    expect(chiY.vknY![2]).toEqual(['dang:D'])
    expect(chiY.nguon).toBe('goi_y')
  })
})

describe('đầu vào kế hoạch — trọng số câu, dạng đã vững, ôn bài cũ, chế độ chờ, hạn bài', () => {
  it('trongSoCacCau = trongSoCau từng câu với sơ ý riêng của em', () => {
    const hs = hoSoTuP({ a: 0.9, b: 0.5 }, 0.06)
    const ds = [qc('q1', 'I', ['a', 'b']), qc('q2', 'III', ['a']), qc('q3', 'II', ['b'])]
    const r = trongSoCacCau(hs, ds)
    expect(Object.keys(r)).toEqual(['q1', 'q2', 'q3'])
    for (const c of ds) expect(r[c.qid]).toBe(trongSoCau(hs, c, 0.06))
    expect(r.q3!).toBeGreaterThan(r.q1!)
  })
  const VUNG: Partial<HoSoVkn> = { trangThai: 'vung', nCau: 4, nNgay: 3, nTroiChay: 2, nCauLaDung: 2, dayLai: false, nTuLam: 12 }
  const PV: QCau[] = [qc('q1', 'I', ['a', 'b']), qc('q2', 'II', ['a'], { vknY: [['a'], ['c'], ['a'], ['a']] }), qc('q3', 'I', ['e'], { maDang: 'E' })]
  const hsVung = () => {
    const hs = hoSoTuP({}, 0.05, { nTau: 12 })
    for (const k of ['a', 'b', 'c', 'e']) hs.vkn[k] = vknHs(k, 0.97, VUNG)
    return hs
  }
  it('mọi vi kỹ năng của dạng (kể cả vi kỹ năng từng ý) đủ điều kiện ⇒ dạng vững; sắp theo mã', () => {
    expect(dangDaVung(hsVung(), PV)).toEqual(['D', 'E'])
  })
  it('thiếu bất kỳ điều kiện nào ở một vi kỹ năng ⇒ dạng chưa vững', () => {
    const hong: [string, Partial<HoSoVkn>][] = [
      ['c', { trangThai: 'chua_du' }], ['b', { nCau: 3 }], ['a', { nNgay: 2 }], ['c', { nTroiChay: 1 }], ['b', { nCauLaDung: 1 }], ['a', { dayLai: true }],
    ]
    for (const [k, sua] of hong) {
      const hs = hsVung()
      hs.vkn[k] = vknHs(k, 0.97, { ...VUNG, ...sua })
      expect(dangDaVung(hs, PV)).toEqual(['E'])
    }
    const thieuHoSo = hsVung()
    delete thieuHoSo.vkn.c
    expect(dangDaVung(thieuHoSo, PV)).toEqual(['E'])
  })
  it('trôi chảy được MIỄN khi chưa đo tốc độ lần nào (nTau = 0 và mọi vi kỹ năng của dạng nTroiChay = 0)', () => {
    const hs = hsVung()
    hs.nTau = 0
    for (const k of ['a', 'b', 'c']) hs.vkn[k] = vknHs(k, 0.97, { ...VUNG, nTroiChay: 0 })
    expect(dangDaVung(hs, PV)).toEqual(['D', 'E'])
    hs.nTau = 3
    expect(dangDaVung(hs, PV)).toEqual(['E'])
    hs.nTau = 0
    hs.vkn.b = vknHs('b', 0.97, { ...VUNG, nTroiChay: 1 })
    expect(dangDaVung(hs, PV)).toEqual(['E'])
  })
  it('tiLeOnBaiCu: ngày 4–5 đan xen 40 %, còn lại 20 %', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map((d) => tiLeOnBaiCu(d))).toEqual([0.2, 0.2, 0.2, 0.4, 0.4, 0.2, 0.2])
    expect(tiLeOnBaiCu(null)).toBe(0.2)
  })
  it('theLucCho: 60 % thể lực lớp, sàn 12', () => {
    expect(theLucCho(40)).toBe(24)
    expect(theLucCho(30)).toBe(18)
    expect(theLucCho(10)).toBe(12)
  })
  it('soNgayHanBai: D nhỏ nhất trong [7, 14] với lượt cần ≤ 0,8 × D × thể lực; quá tải ⇒ 14', () => {
    expect(soNgayHanBai(200, 40)).toBe(7)
    expect(soNgayHanBai(224, 40)).toBe(7)
    expect(soNgayHanBai(225, 40)).toBe(8)
    expect(soNgayHanBai(300, 40)).toBe(10)
    expect(soNgayHanBai(1000, 40)).toBe(14)
  })
})
