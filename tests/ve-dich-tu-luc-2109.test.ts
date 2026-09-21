// MỐC TÍNH NỢ THEO GIỜ `tuLuc` của "Dồn về đích" (thầy nói rõ 21/09 15:55: "tất cả chỉ tính từ 12h trưa nay thôi, chặng cũ cũng không hiện lại luôn"; Code 1).
// (a) chặng mốc gốc < tuLuc không bao giờ là nợ; (b) câu ôn ngày < ngày mốc + gói tạo trước tuLuc bỏ; (c) vắng tuLuc ⇒ y hệt cũ. Hàm thuần: bài giao trước ngày mốc là việc của tầng đọc D1.
import { describe, expect, it } from 'vitest'
import { mulberry32 } from '../src/lib/exam-shuffle'
import { soNo, trangThaiChangTheoMoc, type BaiDangChay, type GoiGiaDinhChuaXong, type MonNo, type OnQuaLich } from '../src/lib/ve-dich'

const vn = (s: string) => Date.parse(`${s}:00+07:00`)
const MS_NGAY = 86_400_000
const TU_LUC = '2026-09-21T05:00:00.000Z' // 12:00 trưa 21/09 giờ VN
const dauNgay = (ms: number) => Math.floor((ms + 7 * 3600_000) / MS_NGAY) * MS_NGAY - 7 * 3600_000
const ngayVn = (ms: number) => new Date(ms + 7 * 3600_000).toISOString().slice(0, 10)
const tong = (ds: readonly MonNo[]) => ({ cau: ds.reduce((s, m) => s + m.soCau, 0), phut: ds.reduce((s, m) => s + m.phut, 0) })

const NOW = vn('2026-09-23T09:00')
const bai: BaiDangChay = {
  maBtvn: 'B1', ten: 'Bài Este', hanNop: '2026-09-26T12:00:00+07:00',
  moLuc: ['2026-09-19T20:30:00+07:00', '2026-09-21T11:59:00+07:00', '2026-09-21T12:00:00+07:00', '2026-09-22T00:00:00+07:00', '2026-09-23T00:00:00+07:00', '2026-09-24T00:00:00+07:00'],
  daXong: 0, cauMoiChang: [10, 11, 12, 13, 14, 15], phutMoiChang: [15, 16, 18, 19, 21, 22],
}
const on: OnQuaLich[] = [{ ngay: '2026-09-20', soCau: 4 }, { ngay: '2026-09-21', soCau: 5 }, { ngay: '2026-09-22', soCau: 6 }]
const goi: GoiGiaDinhChuaXong[] = [
  { ngay: '2026-09-21', soCau: 7, ten: 'Gói sáng', phut: 10, taoLuc: '2026-09-21T03:00:00.000Z' }, // 10:00 VN — trước mốc
  { ngay: '2026-09-21', soCau: 8, ten: 'Gói chiều', phut: 12, taoLuc: '2026-09-21T05:00:00.000Z' }, // đúng mốc — giữ
  { ngay: '2026-09-22', soCau: 9, ten: 'Gói ngày sau', phut: 13 }, // không taoLuc ⇒ theo ngay ≥ ngày mốc ⇒ giữ
  { ngay: '2026-09-20', soCau: 6, ten: 'Gói cũ', phut: 9 }, // không taoLuc, ngày < ngày mốc ⇒ bỏ
]
const goiV = (v: Partial<Parameters<typeof soNo>[0]> = {}) => soNo({ now: NOW, baiDangChay: [bai], onQuaLich: on, goiGiaDinh: goi, ...v })

describe('soNo có tuLuc', () => {
  const cu = goiV()
  it('(a) chặng mốc gốc TRƯỚC tuLuc không bao giờ là nợ (kể cả 11:59 sát biên); đúng tuLuc trở đi mới nợ', () => {
    const chang = goiV({ tuLuc: TU_LUC }).filter((m) => m.loai === 'chang_btvn').map((m) => m.chiSo)
    expect(chang).toEqual([2, 3]) // chặng 0 (19/09), 1 (21/09 11:59) bỏ; 2 (21/09 12:00) và 3 (22/09) giữ; 4 (hôm nay) chưa nợ
    expect(cu.filter((m) => m.loai === 'chang_btvn').map((m) => m.chiSo)).toEqual([0, 1, 2, 3])
  })
  it('(b) câu ôn ngày < ngày VN của mốc bỏ; gói tạo trước tuLuc bỏ (không taoLuc ⇒ theo ngày); tổng câu / phút khớp', () => {
    const kq = goiV({ tuLuc: TU_LUC })
    expect(kq.filter((m) => m.loai === 'on_lai').map((m) => m.ngay)).toEqual(['2026-09-21', '2026-09-22'])
    expect(kq.filter((m) => m.loai === 'goi_gia_dinh').map((m) => m.ten)).toEqual(['Gói chiều', 'Gói ngày sau'])
    expect(kq.map((m) => `${m.ngay}|${m.loai}|${m.soCau}`)).toEqual([
      '2026-09-21|chang_btvn|12', '2026-09-21|goi_gia_dinh|8', '2026-09-21|on_lai|5',
      '2026-09-22|chang_btvn|13', '2026-09-22|goi_gia_dinh|9', '2026-09-22|on_lai|6',
    ])
    expect(tong(kq).cau).toBe(12 + 8 + 5 + 13 + 9 + 6)
  })
  it('(c) vắng / không đọc được tuLuc ⇒ Y HỆT cũ; kèm tuNgay thì áp cả hai; tuLuc muộn hơn mọi món ⇒ rỗng', () => {
    for (const t of [undefined, '', 'trưa nay', '21/09/2026 12:00']) expect(goiV({ tuLuc: t as string | undefined }), String(t)).toEqual(cu)
    expect(goiV({ tuLuc: TU_LUC, tuNgay: '2026-09-22' }).every((m) => m.ngay >= '2026-09-22')).toBe(true)
    expect(goiV({ tuLuc: '2027-01-01T00:00:00.000Z' })).toEqual([])
  })
  it('thuần: không sửa đầu vào; gọi lại cho cùng kết quả', () => {
    const b = Object.freeze({ ...bai, moLuc: Object.freeze([...bai.moLuc]) }) as BaiDangChay
    const v = { now: NOW, baiDangChay: Object.freeze([b]), onQuaLich: Object.freeze(on.map((x) => Object.freeze(x))), goiGiaDinh: Object.freeze(goi.map((x) => Object.freeze(x))), tuLuc: TU_LUC }
    expect(soNo(v)).toEqual(soNo(v))
  })
  it('TÍNH CHẤT 2 000 ca: có tuLuc ≡ sổ cũ LỌC (chặng: mốc ≥ tuLuc; ôn: ngày ≥ ngày mốc; gói: taoLuc ≥ tuLuc hoặc ngày ≥ ngày mốc); thứ tự giữ nguyên', () => {
    const r = mulberry32(1555)
    for (let i = 0; i < 2000; i++) {
      const now = vn('2026-09-20T00:00') + Math.floor(r() * 12 * MS_NGAY)
      const soChang = 1 + Math.floor(r() * 6)
      const moLuc = Array.from({ length: soChang }, (_, k) => new Date(vn('2026-09-15T00:00') + Math.floor((k + r() * 1.5) * MS_NGAY)).toISOString())
      const b: BaiDangChay = { maBtvn: 'B', ten: 'B', hanNop: new Date(now + 5 * MS_NGAY).toISOString(), moLuc, daXong: Math.floor(r() * soChang), cauMoiChang: moLuc.map(() => 5 + Math.floor(r() * 20)), phutMoiChang: moLuc.map(() => 5 + Math.floor(r() * 30)) }
      const ngayNgau = () => ngayVn(vn('2026-09-15T12:00') + Math.floor(r() * 10 * MS_NGAY))
      const onN = Array.from({ length: Math.floor(r() * 4) }, () => ({ ngay: ngayNgau(), soCau: Math.floor(r() * 9) }))
      const goiN = Array.from({ length: Math.floor(r() * 3) }, () => {
        const ngay = ngayNgau()
        return r() < 0.5 ? { ngay, soCau: Math.floor(r() * 12), taoLuc: new Date(vn(`${ngay}T00:00`) + Math.floor(r() * MS_NGAY)).toISOString() } : { ngay, soCau: Math.floor(r() * 12) }
      })
      const tuLuc = new Date(vn('2026-09-15T00:00') + Math.floor(r() * 12 * MS_NGAY)).toISOString()
      const tuMs = Date.parse(tuLuc), ngayMoc = ngayVn(tuMs)
      const cuN = soNo({ now, baiDangChay: [b], onQuaLich: onN, goiGiaDinh: goiN })
      const moiN = soNo({ now, baiDangChay: [b], onQuaLich: onN, goiGiaDinh: goiN, tuLuc })
      // dựng phần lọc từ sổ cũ theo từng loại
      const moLucCua = new Map<number, number>(b.moLuc.map((m, k) => [k, Date.parse(m)]))
      const loc = cuN.filter((m) => {
        if (m.loai === 'chang_btvn') return (moLucCua.get(m.chiSo!) ?? 0) >= tuMs
        if (m.loai === 'on_lai') return m.ngay >= ngayMoc
        return true
      })
      // gói: lọc riêng vì cần taoLuc; so bằng danh sách khi chỉ có chặng + ôn, và kiểm gói qua tổng riêng
      const goiSo = (ds: readonly MonNo[]) => ds.filter((m) => m.loai === 'goi_gia_dinh').map((m) => `${m.ngay}|${m.soCau}`)
      const goiMong = goiSo(cuN).filter((_, j) => {
        const cu1 = cuN.filter((m) => m.loai === 'goi_gia_dinh')[j]!
        const nguon = goiN.find((g) => g.ngay === cu1.ngay && g.soCau === cu1.soCau && (g.taoLuc !== undefined || true))!
        return nguon.taoLuc !== undefined ? Date.parse(nguon.taoLuc) >= tuMs : nguon.ngay >= ngayMoc
      })
      const khongGoi = (ds: readonly MonNo[]) => ds.filter((m) => m.loai !== 'goi_gia_dinh')
      if (JSON.stringify(khongGoi(moiN)) !== JSON.stringify(khongGoi(loc))) throw new Error(`#${i} lệch chặng/ôn: ${JSON.stringify({ tuLuc, moiN: khongGoi(moiN), loc: khongGoi(loc) })}`)
      // gói: mọi gói còn lại phải thoả điều kiện giữ; số gói ≤ số gói cũ
      expect(goiSo(moiN).length).toBeLessThanOrEqual(goiSo(cuN).length)
      if (goiSo(moiN).join(',') !== goiMong.join(',')) {
        // trùng (ngày, số câu) giữa hai gói có/không taoLuc làm phép tìm mơ hồ: chỉ chấp nhận khi có cặp trùng
        const khoa = goiN.map((g) => `${g.ngay}|${g.soCau}`)
        if (new Set(khoa).size === khoa.length) throw new Error(`#${i} lệch gói: ${JSON.stringify({ moi: goiSo(moiN), mong: goiMong })}`)
      }
      expect(tong(moiN).cau).toBe(moiN.reduce((s, m) => s + m.soCau, 0))
    }
  })
})

describe('trangThaiChangTheoMoc có tuLuc', () => {
  const hom = vn('2026-09-23T00:00')
  const v = { dauHomNay: hom, dauMai: hom + MS_NGAY, tuLuc: TU_LUC }
  it('mốc gốc < tuLuc (chưa làm) ⇒ hom_nay, KHÔNG nợ; ≥ tuLuc mà trước hôm nay ⇒ no; hôm nay / sắp tới không đổi; vắng tuLuc ⇒ luật cũ', () => {
    expect(trangThaiChangTheoMoc(vn('2026-09-19T20:30'), v)).toBe('hom_nay')
    expect(trangThaiChangTheoMoc(vn('2026-09-21T11:59'), v)).toBe('hom_nay')
    expect(trangThaiChangTheoMoc(vn('2026-09-21T12:00'), v)).toBe('no')
    expect(trangThaiChangTheoMoc(vn('2026-09-22T09:00'), v)).toBe('no')
    expect(trangThaiChangTheoMoc(vn('2026-09-23T10:00'), v)).toBe('hom_nay')
    expect(trangThaiChangTheoMoc(vn('2026-09-24T00:00'), v)).toBe('sap_toi')
    expect(trangThaiChangTheoMoc(vn('2026-09-19T20:30'), { dauHomNay: hom, dauMai: hom + MS_NGAY })).toBe('no')
    expect(trangThaiChangTheoMoc(vn('2026-09-19T20:30'), { ...v, tuLuc: 'hỏng' })).toBe('no')
  })
  it('TÍNH CHẤT: có tuLuc chỉ ĐỔI no ⇒ hom_nay khi mốc < tuLuc; nhất quán với soNo (soNo giữ chặng ⇔ nhãn no)', () => {
    const r = mulberry32(3)
    for (let i = 0; i < 3000; i++) {
      const now = vn('2026-09-22T00:00') + Math.floor(r() * 4 * MS_NGAY)
      const dauHomNay = dauNgay(now), dauMai = dauHomNay + MS_NGAY
      const mo = vn('2026-09-15T00:00') + Math.floor(r() * 12 * MS_NGAY)
      const tuLuc = new Date(vn('2026-09-15T00:00') + Math.floor(r() * 12 * MS_NGAY)).toISOString()
      const cu = trangThaiChangTheoMoc(mo, { dauHomNay, dauMai })
      const moi = trangThaiChangTheoMoc(mo, { dauHomNay, dauMai, tuLuc })
      if (cu !== 'no') expect(moi).toBe(cu)
      else expect(moi).toBe(mo < Date.parse(tuLuc) ? 'hom_nay' : 'no')
      const b: BaiDangChay = { maBtvn: 'B', ten: 'B', hanNop: new Date(now + MS_NGAY).toISOString(), moLuc: [new Date(mo).toISOString()], daXong: 0, cauMoiChang: [10], phutMoiChang: [15] }
      expect(soNo({ now, baiDangChay: [b], tuLuc }).length === 1).toBe(moi === 'no')
    }
  })
})
