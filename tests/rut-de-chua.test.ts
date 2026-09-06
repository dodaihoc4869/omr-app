// RÚT CÂU CHỮA THEO DẠNG BÀI — nghiệm thu theo đúng bảng mục 8, đặc tả v3.
//
// Mỗi `it` là MỘT DÒNG trong bảng "Định nghĩa hoàn thành tự chứng minh".
// Không thêm tiêu chí dễ hơn, không hạ ngưỡng nào.
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { cauSaiTuRows, rutDeChua, xepUuTienChua } from '../src/lib/rut-de-chua'
import { CHO_BAC_2, SO_CAU_MOI_CAU_SAI, TRAN_CAU_CHUA, maDangHopLe, nhanhCoChe } from '../src/lib/cau-hinh-chua'
import type { TeacherExamSource, TeacherMcqQuestion } from '../src/data/examContent'
import type { ChiTietCauRow } from '../src/lib/exam-api'

const goc = resolve(__dirname, '..')
const doc = (f: string) => readFileSync(resolve(goc, f), 'utf8')

const HS = 'ESTER.ESTER_HOA.TINH_HIEU_SUAT'
const KL = 'ESTER.ESTER_HOA.TINH_KHOI_LUONG' // cùng cơ chế, khác việc ⇒ bậc 2
const DP = 'ESTER.DANH_PHAP.GOI_TEN' // khác cơ chế ⇒ KHÔNG được lấy
const AM = 'AMINE.BAC_AMINE.DEM_DONG_PHAN'

const q = (id: string, ma: string | null, muc = 'hieu'): TeacherMcqQuestion =>
  ({
    id,
    text: `Câu ${id}`,
    choices: ['a', 'b', 'c', 'd'],
    correct: 'A',
    chuyenDe: 'Ester – lipid',
    mucDo: muc,
    dang: ma ? { ma, ten: ma } : null,
  }) as unknown as TeacherMcqQuestion

const kho = (qs: TeacherMcqQuestion[]): TeacherExamSource[] => [{ maDe: 'B1', phanI: qs, phanII: [], phanIII: [] } as unknown as TeacherExamSource]

const row = (soCau: number, qid: string, muc: string, dung: boolean | null): ChiTietCauRow => ({
  phan: 'I',
  soCau,
  qid,
  chuyenDe: 'Ester – lipid',
  mucDo: muc,
  dapAnChon: 'A',
  dapAnDung: 'B',
  dungSai: dung,
  giay: 30,
})

/** Kho đủ loại: 4 câu cùng mã HS, 3 câu cùng cơ chế khác việc, 3 câu khác hẳn. */
const khoDayDu = () =>
  kho([
    q('sai-7', HS),
    q('hs-1', HS),
    q('hs-2', HS, 'biet'),
    q('hs-3', HS, 'van_dung'),
    q('kl-1', KL),
    q('kl-2', KL),
    q('kl-3', KL),
    q('dp-1', DP),
    q('am-1', AM),
    q('chua-gan', null),
  ])

const rowsSaiCau7 = (): ChiTietCauRow[] => [row(1, 'hs-2', 'biet', true), row(7, 'sai-7', 'hieu', false)]

describe('mục 8 — KHÔNG lấy câu kiến thức khác', () => {
  it('100% câu bậc 1 trùng ĐÚNG mã; bậc 2 trùng hai tầng đầu; 0 câu ngoài hai loại', () => {
    const kq = rutDeChua({ khoDe: khoDayDu(), rows: rowsSaiCau7(), soCau: 10 })
    expect(kq.cau.length).toBeGreaterThan(0)
    for (const c of kq.cau) {
      const n = c.chuaCho!
      expect(n.maDang).toBe(HS)
      if (n.bac === 1) expect(['hs-1', 'hs-2', 'hs-3']).toContain(c.id)
      else expect(nhanhCoChe(KL)).toBe(nhanhCoChe(n.maDang))
      // tuyệt đối không có câu khác cơ chế
      expect(['dp-1', 'am-1', 'chua-gan']).not.toContain(c.id)
    }
  })

  it('CẤM tụt xuống "cùng chuyên đề, lấy đại" — đó chính là cái đang hỏng', () => {
    // Kho chỉ có câu danh pháp (cùng chuyên đề Ester, khác cơ chế) ⇒ phải trả 0.
    const kq = rutDeChua({ khoDe: kho([q('sai-7', HS), q('dp-1', DP), q('dp-2', DP)]), rows: rowsSaiCau7(), soCau: 5 })
    expect(kq.cau).toHaveLength(0)
    expect(kq.thieu.length).toBeGreaterThan(0)
  })

  it('hết bậc 2 là DỪNG, không có tầng ba', () => {
    const kq = rutDeChua({ khoDe: kho([q('sai-7', HS), q('kl-1', KL), q('dp-1', DP), q('am-1', AM)]), rows: rowsSaiCau7(), soCau: 10 })
    expect(kq.cau.map((c) => c.id)).toEqual(['kl-1'])
    expect(kq.cau[0].chuaCho!.bac).toBe(2)
  })
})

describe('mục 8 — nhãn', () => {
  it('mọi câu trả về đều có chuaCho', () => {
    const kq = rutDeChua({ khoDe: khoDayDu(), rows: rowsSaiCau7(), soCau: 6 })
    expect(kq.cau.length).toBeGreaterThan(0)
    for (const c of kq.cau) expect(c.chuaCho).toBeDefined()
  })

  it('nhãn trỏ đúng câu sai CÓ THẬT và mang mã dạng của câu sai', () => {
    const rows = rowsSaiCau7()
    const kq = rutDeChua({ khoDe: khoDayDu(), rows, soCau: 6 })
    for (const c of kq.cau) {
      const r = rows.find((x) => x.qid === c.chuaCho!.qid)!
      expect(r).toBeDefined()
      expect(r.dungSai).toBe(false)
      expect(c.chuaCho!.soCau).toBe(r.soCau)
      expect(c.chuaCho!.maDang).toBe(HS)
    }
  })

  it('mỗi câu chữa mang ĐÚNG MỘT nhãn, và bậc chỉ là 1 hoặc 2', () => {
    const kq = rutDeChua({ khoDe: khoDayDu(), rows: rowsSaiCau7(), soCau: 6 })
    for (const c of kq.cau) {
      expect(Array.isArray(c.chuaCho)).toBe(false)
      expect([1, 2]).toContain(c.chuaCho!.bac)
    }
  })
})

describe('mục 8 — một câu sai nhiều câu chữa', () => {
  it('2 câu sai, mỗi câu nhận đúng SO_CAU_MOI_CAU_SAI câu', () => {
    const k = kho([q('s1', HS), q('s2', AM), q('hs-1', HS), q('hs-2', HS), q('am-1', AM), q('am-2', AM)])
    const rows = [row(3, 's1', 'hieu', false), row(9, 's2', 'hieu', false)]
    const kq = rutDeChua({ khoDe: k, rows, soCau: TRAN_CAU_CHUA })
    const dem = new Map<string, number>()
    for (const c of kq.cau) dem.set(c.chuaCho!.qid, (dem.get(c.chuaCho!.qid) ?? 0) + 1)
    expect(dem.get('s1')).toBe(SO_CAU_MOI_CAU_SAI)
    expect(dem.get('s2')).toBe(SO_CAU_MOI_CAU_SAI)
    expect(kq.cau.length).toBe(SO_CAU_MOI_CAU_SAI * 2)
  })
})

describe('mục 8 — thiếu thì báo, không lấy bừa', () => {
  it('kho chỉ có 1 câu cùng mã: trả 1 câu, thieu[] nêu lý do, không câu nào lệch mã', () => {
    const kq = rutDeChua({ khoDe: kho([q('sai-7', HS), q('hs-1', HS), q('dp-1', DP)]), rows: rowsSaiCau7(), soCau: 5 })
    expect(kq.cau.map((c) => c.id)).toEqual(['hs-1'])
    expect(kq.thieu.length).toBe(1)
    expect(kq.thieu[0].vi).toMatch(/chỉ còn 1\/2/)
  })
})

describe('mục 8 — câu sai chưa gắn dạng', () => {
  it('không rút câu nào cho nó, thieu[] nói rõ, KHÔNG đoán', () => {
    const k = kho([q('sai-x', null), q('hs-1', HS), q('hs-2', HS)])
    const kq = rutDeChua({ khoDe: k, rows: [row(4, 'sai-x', 'hieu', false)], soCau: 5 })
    expect(kq.cau).toHaveLength(0)
    expect(kq.thieu[0].vi).toMatch(/chưa gắn dạng/)
    expect(kq.thieu[0].vi).toMatch(/Ngân hàng câu hỏi/)
  })
})

describe('mục 8 — kết quả ổn định', () => {
  it('chạy 50 lần cùng đầu vào ra 50 kết quả giống hệt', () => {
    const mau = JSON.stringify(rutDeChua({ khoDe: khoDayDu(), rows: rowsSaiCau7(), soCau: 6 }).cau.map((c) => c.id))
    for (let i = 0; i < 50; i++) {
      expect(JSON.stringify(rutDeChua({ khoDe: khoDayDu(), rows: rowsSaiCau7(), soCau: 6 }).cau.map((c) => c.id))).toBe(mau)
    }
  })
})

describe('mục 8 — không gọi mạng lúc rút', () => {
  it('fetch ném lỗi mà rút vẫn chạy đủ', () => {
    const cu = globalThis.fetch
    globalThis.fetch = (() => {
      throw new Error('cấm gọi mạng lúc rút câu')
    }) as unknown as typeof fetch
    try {
      const kq = rutDeChua({ khoDe: khoDayDu(), rows: rowsSaiCau7(), soCau: 6 })
      expect(kq.cau.length).toBeGreaterThan(0)
    } finally {
      globalThis.fetch = cu
    }
  })
})

describe('mục 8 — không key trong client', () => {
  it('không có api key, sk-, bearer trong lib rút câu', () => {
    for (const f of ['src/lib/rut-de-chua.ts', 'src/lib/cau-hinh-chua.ts', 'src/components/NutBaiTapPdf.tsx']) {
      expect(doc(f)).not.toMatch(/api[_-]?key|sk-[A-Za-z0-9]|bearer\s+[A-Za-z0-9]/i)
    }
  })
})

describe('mục 8 — bảng mã không phình', () => {
  it('mã dạng phải đúng khuôn ba tầng', () => {
    expect(maDangHopLe(HS)).toBe(true)
    expect(maDangHopLe('ESTER.ESTER_HOA')).toBe(false)
    expect(maDangHopLe('ester.ester_hoa.tinh')).toBe(false)
    expect(maDangHopLe(null)).toBe(false)
  })

  it('nhánh cơ chế lấy đúng hai tầng đầu', () => {
    expect(nhanhCoChe(HS)).toBe('ESTER.ESTER_HOA')
    expect(nhanhCoChe(KL)).toBe('ESTER.ESTER_HOA')
    expect(nhanhCoChe(DP)).toBe('ESTER.DANH_PHAP')
    expect(nhanhCoChe('hỏng')).toBe('')
  })
})

describe('mục 8 — không lách cổng', () => {
  it('chonCauLuyen KHÔNG được gọi từ component hay screen', () => {
    const quet = (thuMuc: string) => {
      const d = resolve(goc, thuMuc)
      return readdirSync(d)
        .filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'))
        .filter((f) => /\bchonCauLuyen\s*\(/.test(readFileSync(resolve(d, f), 'utf8')))
    }
    expect(quet('src/components')).toEqual([])
    expect(quet('src/screens')).toEqual([])
  })
})

describe('luật xếp và cắt', () => {
  it('sai câu NHẬN BIẾT chữa trước — hổng nền ưu tiên', () => {
    const ds = cauSaiTuRows([row(9, 'a', 'van_dung', false), row(2, 'b', 'biet', false)], () => ({ ma: HS, ten: HS }))
    expect(xepUuTienChua(ds)[0].qid).toBe('b')
  })

  it('chạm trần thì NÓI RA còn mấy câu sai chưa được chữa', () => {
    const k = kho([q('s1', HS), q('s2', AM), q('hs-1', HS), q('am-1', AM)])
    const rows = [row(1, 's1', 'biet', false), row(2, 's2', 'hieu', false)]
    const kq = rutDeChua({ khoDe: k, rows, soCau: 1 })
    expect(kq.cau).toHaveLength(1)
    expect(kq.capBiCat).toBe(1)
  })

  it('KHÔNG suy câu sai từ điểm — chỉ đọc rows, bỏ qua dòng chưa chấm', () => {
    const ds = cauSaiTuRows([row(1, 'a', 'biet', null), row(2, 'b', 'biet', true), row(3, 'c', 'biet', false)], () => ({ ma: HS, ten: HS }))
    expect(ds.map((c) => c.qid)).toEqual(['c'])
  })

  it('cấu hình v3 đúng mặc định đặc tả', () => {
    expect(SO_CAU_MOI_CAU_SAI).toBe(2)
    expect(TRAN_CAU_CHUA).toBe(10)
    expect(CHO_BAC_2).toBe(true)
  })
})

describe('v3 bỏ hẳn deTichCa của v1', () => {
  it('không còn luuDeTichCa / docDeTichCa trong mã nguồn', () => {
    expect(doc('src/lib/exam-db.ts')).not.toContain('DeTichCa')
    expect(doc('src/screens/ExamSetupScreen.tsx')).not.toContain('luuDeTichCa')
  })
})
