// 07/09: khối rút bài đã tách khỏi `PhieuScreen` sang `components/KhoiBaiLuyen`
// để bố cục v3 dùng CHUNG một bản với bố cục cũ (thầy chốt "giữ nguyên mục rút
// bài trong phiếu mới đầy đủ như trong phiếu cũ"). Luật không đổi, chỉ đổi tệp.
// "CÂU NÀY CHỮA CHO CÂU SAI NÀO" — thầy chỉ ra 07/09.
//
//   "tôi thấy em Tuân thi ester nhưng lại gán câu xà phòng."
//   "sai câu nào của ca thi mới nhất thì lấy câu chữa trong kho cùng nhãn phân
//    cho câu đó và phải thể hiện trong báo cáo là câu này khắc phục lỗi sai cho
//    câu sai nào"
//
// Hai lỗi trong một: phiếu bài luyện bó theo CHUYÊN ĐỀ (xà phòng cũng là Ester
// nên lọt), và phiếu không nói câu nào chữa cho câu nào.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { dungPhieu } from '../src/lib/phieu-du-lieu'
import { theCauHtml } from '../src/lib/html-phieu'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'
import type { TeacherExamSource } from '../src/data/examContent'
import type { ChiTietCauRow } from '../src/lib/exam-api'

const doc = (f: string) => readFileSync(resolve(__dirname, '..', f), 'utf8')

const XP = 'ESTER.UNG_DUNG.NHAN_DANG' // "Thành phần chính của xà phòng là"
const HS = 'ESTER.THUY_PHAN_BASE.TINH_KHOI_LUONG'

const cau = (id: string, ma: string, de: string) => ({
  id,
  text: de,
  choices: ['a', 'b', 'c', 'd'] as [string, string, string, string],
  correct: 'A' as const,
  chuyenDe: 'Ester – lipid',
  mucDo: 'hieu' as const,
  dang: { ma, ten: ma },
})

const kho = (cs: ReturnType<typeof cau>[]): TeacherExamSource[] => [
  { maDe: 'K1', ngayNap: '2026-09-06', phanI: cs, phanII: [], phanIII: [] } as unknown as TeacherExamSource,
]

const row = (soCau: number, qid: string, dung: boolean): ChiTietCauRow => ({
  phan: 'I',
  soCau,
  qid,
  chuyenDe: 'Ester – lipid',
  mucDo: 'hieu',
  dapAnChon: 'B',
  dapAnDung: 'A',
  dungSai: dung,
  giay: 30,
})

/** Kho: câu em sai (xà phòng hoá) + 2 câu cùng mã + 3 câu xà phòng ứng dụng. */
const KHO = kho([
  cau('sai-7', HS, 'Xà phòng hoá chất béo, tính khối lượng muối'),
  cau('hs-1', HS, 'Xà phòng hoá tristearin, tính khối lượng'),
  cau('hs-2', HS, 'Xà phòng hoá triolein, tính khối lượng'),
  cau('xp-1', XP, 'Thành phần chính của xà phòng là'),
  cau('xp-2', XP, 'Chất giặt rửa tổng hợp là'),
  cau('xp-3', XP, 'Xà phòng điều chế từ nguyên liệu nào'),
])

const NEN = {
  hoSo: { em: { hoTen: 'Tuân', sbd: '001', lop: '12A' }, ca: [], chuyenDe: [] },
  ca: { maCa: 'CA1', tenCa: 'Ester bài 1', lop: '12A', nopLuc: '2026-09-07T00:00:00Z', tong: 8, diemI: null, diemII: null, diemIII: null, hang: 1, siSo: 20 },
  chuyenDeCa: [{ ten: 'Ester – lipid', soCau: 10, soSai: 1 }],
  khoDe: KHO,
  banks: [],
  qidDaLam: ['sai-7'],
} as unknown as Parameters<typeof dungPhieu>[0]

describe('phiếu chỉ lấy câu CÙNG MÃ DẠNG với câu em sai', () => {
  it('em sai câu xà phòng hoá thì KHÔNG nhận câu ứng dụng xà phòng', () => {
    const p = dungPhieu({ ...NEN, rows: [row(7, 'sai-7', false), row(1, 'hs-2', true)] })
    const id = (p.baiTap ?? []).map((c) => c.id)
    expect(id.length).toBeGreaterThan(0)
    for (const x of ['xp-1', 'xp-2', 'xp-3']) expect(id).not.toContain(x)
    expect(id).not.toContain('sai-7')
  })

  it('mỗi câu rút ra mang nhãn chữa cho ĐÚNG câu sai có thật', () => {
    const p = dungPhieu({ ...NEN, rows: [row(7, 'sai-7', false)] })
    for (const c of p.baiTap ?? []) {
      expect(c.chuaCho).toBeTruthy()
      expect(c.chuaCho!.soCau).toBe(7)
      expect(c.chuaCho!.maDang).toBe(HS)
    }
  })

  it('em không sai câu nào thì vẫn có bài luyện, không để phiếu rỗng', () => {
    // Phiếu rỗng là mất linkBaiTap, kéo theo mất hai nút copy của báo cáo.
    const p = dungPhieu({ ...NEN, rows: [row(1, 'hs-2', true)] })
    expect((p.baiTap ?? []).length).toBeGreaterThan(0)
  })

  // SỬA SAU KHI CHẠY: bản đầu tôi bắt phiếu để TRỐNG khi kho hết câu cùng dạng.
  // Test `tao-phieu-ca-ca` bắt ngay — trống thì mất phiếu bài tập, mất
  // `linkBaiTap`, mất hai nút copy của báo cáo. Đổi một lỗi lấy một lỗi.
  // Luật đúng: vẫn có bài luyện chung, nhưng KHÔNG câu nào được mang nhãn chữa,
  // và phiếu phải nói thẳng đây không phải câu chữa.
  it('thiếu câu cùng dạng thì KHÔNG dán nhãn chữa, và nói thẳng', () => {
    const it1 = kho([cau('sai-7', HS, 'Xà phòng hoá, tính khối lượng'), cau('xp-1', XP, 'Thành phần chính của xà phòng là')])
    const p = dungPhieu({ ...NEN, khoDe: it1, rows: [row(7, 'sai-7', false)] })
    expect((p.baiTap ?? []).length).toBeGreaterThan(0)
    // Thầy đổi luật 07/09: câu sai không có câu chữa thì đưa lại chính nó, gắn
    // cờ `laLamLai`. Điều đang đo vẫn nguyên: KHÔNG câu nào khác được dán nhãn
    // chữa, và phiếu vẫn nói thẳng phần dưới không phải câu chữa.
    for (const c of p.baiTap ?? []) expect(c.chuaCho === undefined || c.chuaCho.laLamLai === true).toBe(true)
    expect(p.thieuChua?.join(' ')).toContain('không phải câu chữa')
  })
})

describe('phiếu HTML hiện nhãn "Chữa câu N"', () => {
  const c = (chuaCho?: CauLuyen['chuaCho']): CauLuyen =>
    ({ id: 'x', phan: 'I', de: 'Đề', luaChon: ['a', 'b', 'c', 'd'], dapAn: 'A', chuyenDe: 'Ester – lipid', mucDo: 'hieu', chuaCho }) as CauLuyen

  it('có nhãn kèm đúng số câu sai', () => {
    const h = theCauHtml(c({ qid: 'sai-7', soCau: 7, phan: 'I', maDang: HS, bac: 1 }), 1)
    expect(h).toContain('Khắc phục lỗi sai câu 7')
  })

  // v4 mục 6 đổi cách nói: chip riêng "cùng cơ chế, khác việc" thay cho đuôi
  // "· gần dạng" — nói đúng bản chất bậc 2 thay vì một chữ mơ hồ.
  it('câu bậc 2 có chip riêng nói rõ cùng cơ chế khác việc', () => {
    const h = theCauHtml(c({ qid: 'sai-7', soCau: 7, phan: 'I', maDang: HS, bac: 2 }), 1)
    expect(h).toContain('Khắc phục lỗi sai câu 7')
    expect(h).toContain('cùng cơ chế, khác việc')
  })

  it('câu luyện thường không có nhãn — không bịa ra chỗ chữa', () => {
    expect(theCauHtml(c(), 1)).not.toContain('Khắc phục lỗi sai')
  })

  it('nhãn chữa mang màu riêng, không lẫn với ba nhãn pastel còn lại', () => {
    // Thầy chốt 07/09: "gắn màu nào cho nổi bật lên". Cam đặc + chấm trắng.
    const css = doc('src/lib/html-phieu.ts')
    expect(css).toMatch(/\.q-tag\.chua \{[^}]*background: #c2410c/)
    expect(css).toMatch(/\.q-tag\.chua::before \{[^}]*background: #ffffff/)
    expect(css).toMatch(/\.q-tag\.chua-2 \{[^}]*background: #ffedd5/)
  })

  it('thẻ câu chữa đổi luôn vạch trái để nhìn lướt là thấy', () => {
    const h = theCauHtml(c({ qid: 's', soCau: 3, phan: 'I', maDang: HS, bac: 1 }), 1)
    expect(h).toContain('class="q-card la-chua')
    expect(theCauHtml(c(), 1)).not.toContain('la-chua')
    expect(doc('src/lib/html-phieu.ts')).toMatch(/\.q-card\.la-chua \{[^}]*border-left-color: #c2410c/)
  })

  it('nhãn chữa đứng TRƯỚC nhãn loại câu', () => {
    const h = theCauHtml(c({ qid: 's', soCau: 3, phan: 'I', maDang: HS, bac: 1 }), 1)
    expect(h.indexOf('Khắc phục lỗi sai câu 3')).toBeLessThan(h.indexOf('Trắc nghiệm'))
  })
})

describe('không lách cổng', () => {
  it('phiếu bài luyện đi qua rutDeChua, không tự bó theo chuyên đề nữa', () => {
    const t = doc('src/lib/phieu-du-lieu.ts')
    expect(t).toContain("from './rut-de-chua'")
    expect(t).toMatch(/import \{[^}]*\brutDeChua\b[^}]*\} from '\.\/rut-de-chua'/)
    expect(t).toMatch(/kqChua[\s\S]{0,200}rutDeChua\(\{ khoDe: kho, rows/)
  })
})

// ---------------------------------------------------------------------------
// "ÁP DỤNG CHO TẤT CẢ CÁC PHIẾU" — thầy chốt 07/09.
//
// Có HAI đường dựng phiếu: `dungPhieu` (thầy dựng trên máy mình) và
// `dungPhieuMayEm` (máy học sinh tự dựng ngay sau khi nộp). Chỉ nối cổng cho
// một đường là nửa số phiếu vẫn rút bừa.
import { dungPhieuMayEm } from '../src/lib/phieu-du-lieu'

describe('phiếu máy học sinh cũng đi qua cổng', () => {
  const NEN_EM = {
    rows: [row(2, 'sai-7', false), row(1, 'hs-2', true)],
    banks: KHO,
    khoKhacPhuc: KHO,
    thuTuKhacPhuc: [],
    maCa: 'CA1',
    sbd: '001',
    hoTen: 'Tuân',
    lichSuEm: [],
  } as unknown as Parameters<typeof dungPhieuMayEm>[0]

  it('em sai câu xà phòng hoá thì KHÔNG nhận câu ứng dụng xà phòng', () => {
    const p = dungPhieuMayEm(NEN_EM)
    const id = (p.baiTap ?? []).map((c) => c.id)
    expect(id.length).toBeGreaterThan(0)
    for (const x of ['xp-1', 'xp-2', 'xp-3']) expect(id).not.toContain(x)
  })

  it('mỗi câu mang nhãn chữa cho đúng câu sai', () => {
    for (const c of dungPhieuMayEm(NEN_EM).baiTap ?? []) {
      expect(c.chuaCho?.soCau).toBe(2)
      expect(c.chuaCho?.maDang).toBe(HS)
    }
  })

  it('em không sai câu nào thì vẫn có bài luyện, không để màn trắng', () => {
    const p = dungPhieuMayEm({ ...NEN_EM, rows: [row(1, 'hs-2', true)] } as typeof NEN_EM)
    expect((p.baiTap ?? []).length).toBeGreaterThan(0)
  })

  it('CẢ HAI đường dựng phiếu đều gọi cổng — không đường nào bị bỏ quên', () => {
    const t = doc('src/lib/phieu-du-lieu.ts')
    const than = (ten: string) => {
      const i = t.indexOf(`export function ${ten}(`)
      const j = t.indexOf('\nexport function ', i + 1)
      return t.slice(i, j === -1 ? undefined : j)
    }
    expect(than('dungPhieu')).toContain('rutDeChua(')
    expect(than('dungPhieuMayEm')).toContain('rutDeChua(')
  })
})

// ---------------------------------------------------------------------------
// CHIA SUẤT THEO VÒNG — thầy chốt 07/09:
//   "nếu kéo nhiều thì ghép nhiều câu chữa cho những câu sai đó"
//   "không lấy trong chuyên đề tick, lấy trong cả kho nhé"
//
// ĐỔI YÊU CẦU so với đặc tả v3 mục 3: `SO_CAU_MOI_CAU_SAI` từ "đúng 2 câu mỗi
// câu sai" thành "TỐI THIỂU 2". Bản cũ ghi cứng 2 nên thầy kéo 40 câu vẫn chỉ
// ra 2 câu cho mỗi câu sai.
import { rutDeChua } from '../src/lib/rut-de-chua'


const nhieuCau = (ma: string, n: number, tien: string) =>
  Array.from({ length: n }, (_, i) => cau(`${tien}${i + 1}`, ma, `Câu ${tien}${i + 1}`))

describe('kéo nhiều câu thì chia đều cho các câu sai', () => {
  const K = kho([cau('s1', HS, 'sai 1'), cau('s2', XP, 'sai 2'), ...nhieuCau(HS, 6, 'hs'), ...nhieuCau(XP, 6, 'xp')])
  const rows2 = [row(3, 's1', false), row(9, 's2', false)]

  it('kéo 10 câu, 2 câu sai: mỗi câu sai được 5, không dồn hết vào một câu', () => {
    const kq = rutDeChua({ khoDe: K, rows: rows2, soCau: 10 })
    const dem = new Map<string, number>()
    for (const c of kq.cau) dem.set(c.chuaCho!.qid, (dem.get(c.chuaCho!.qid) ?? 0) + 1)
    expect(kq.cau.length).toBe(10)
    expect(dem.get('s1')).toBe(5)
    expect(dem.get('s2')).toBe(5)
  })

  it('chỗ ít thì chia theo vòng: câu sai nào cũng có phần trước khi ai được câu thứ hai', () => {
    const kq = rutDeChua({ khoDe: K, rows: rows2, soCau: 3 })
    const dem = new Map<string, number>()
    for (const c of kq.cau) dem.set(c.chuaCho!.qid, (dem.get(c.chuaCho!.qid) ?? 0) + 1)
    expect(kq.cau.length).toBe(3)
    expect(Math.min(...dem.values())).toBe(1)
    expect(Math.max(...dem.values())).toBe(2)
  })

  // v4 bỏ hằng số "mỗi câu sai mấy câu". Xin 4 với 2 câu sai thì vòng tròn chia
  // đôi: 2 mỗi câu.
  it('xin 4 với 2 câu sai thì chia đôi, không lệch', () => {
    const kq = rutDeChua({ khoDe: K, rows: rows2, soCau: 4 })
    const dem = new Map<string, number>()
    for (const c of kq.cau) dem.set(c.chuaCho!.qid, (dem.get(c.chuaCho!.qid) ?? 0) + 1)
    for (const n of dem.values()) expect(n).toBe(2)
  })

  it('kéo nhiều KHÔNG được phá luật dạng: không câu nào khác mã lọt vào', () => {
    const kq = rutDeChua({ khoDe: K, rows: [row(3, 's1', false)], soCau: 10 })
    for (const c of kq.cau) {
      expect(c.chuaCho!.maDang).toBe(HS)
      expect(c.id.startsWith('hs')).toBe(true) // không có câu xp nào
    }
  })

  it('không lấy lại câu em vừa làm, và không phát trùng câu cho hai câu sai', () => {
    const kq = rutDeChua({ khoDe: K, rows: rows2, soCau: 10, qidTranh: ['hs1', 'xp1'] })
    const id = kq.cau.map((c) => c.id)
    expect(id).not.toContain('hs1')
    expect(id).not.toContain('xp1')
    expect(new Set(id).size).toBe(id.length)
  })

  it('báo cáo không còn nói "theo đúng chuyên đề em mất điểm" — cách đó đã bỏ', () => {
    const t = doc('src/components/KhoiBaiLuyen.tsx')
    expect(t).not.toContain('Thầy đã chọn sẵn theo đúng chuyên đề em mất điểm')
    expect(t).toContain('Rút từ cả kho, theo đúng dạng của từng câu em làm sai')
  })
})
