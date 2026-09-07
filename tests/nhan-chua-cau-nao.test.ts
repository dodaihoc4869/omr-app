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
    for (const c of p.baiTap ?? []) expect(c.chuaCho).toBeUndefined()
    expect(p.thieuChua?.join(' ')).toContain('không phải câu chữa')
  })
})

describe('phiếu HTML hiện nhãn "Chữa câu N"', () => {
  const c = (chuaCho?: CauLuyen['chuaCho']): CauLuyen =>
    ({ id: 'x', phan: 'I', de: 'Đề', luaChon: ['a', 'b', 'c', 'd'], dapAn: 'A', chuyenDe: 'Ester – lipid', mucDo: 'hieu', chuaCho }) as CauLuyen

  it('có nhãn kèm đúng số câu sai', () => {
    const h = theCauHtml(c({ qid: 'sai-7', soCau: 7, phan: 'I', maDang: HS, bac: 1 }), 1)
    expect(h).toContain('Chữa câu 7')
  })

  it('câu bậc 2 nói rõ là gần dạng, không giả vờ trùng khít', () => {
    const h = theCauHtml(c({ qid: 'sai-7', soCau: 7, phan: 'I', maDang: HS, bac: 2 }), 1)
    expect(h).toContain('Chữa câu 7 · gần dạng')
  })

  it('câu luyện thường không có nhãn — không bịa ra chỗ chữa', () => {
    expect(theCauHtml(c(), 1)).not.toContain('Chữa câu')
  })

  it('nhãn chữa đứng TRƯỚC nhãn loại câu', () => {
    const h = theCauHtml(c({ qid: 's', soCau: 3, phan: 'I', maDang: HS, bac: 1 }), 1)
    expect(h.indexOf('Chữa câu 3')).toBeLessThan(h.indexOf('Trắc nghiệm'))
  })
})

describe('không lách cổng', () => {
  it('phiếu bài luyện đi qua rutDeChua, không tự bó theo chuyên đề nữa', () => {
    const t = doc('src/lib/phieu-du-lieu.ts')
    expect(t).toContain("import { rutDeChua } from './rut-de-chua'")
    expect(t).toMatch(/kqChua[\s\S]{0,200}rutDeChua\(\{ khoDe: kho, rows/)
  })
})
