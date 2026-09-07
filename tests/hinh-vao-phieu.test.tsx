// ẢNH VÀO ĐỦ PHIẾU IN VÀ BÁO CÁO (thầy chốt 08/09).
//
// Luật cũ: câu có hình bị loại khỏi kho chữa vì "phiếu in không dựng được ảnh".
// Điều đó đã hết đúng từ lâu — `html-phieu.ts` dựng đủ ảnh thân câu, ảnh từng
// phương án và ảnh theo vị trí. Giữ bộ lọc là vứt 219 câu có mã ra khỏi kho.
//
// File này canh cả hai đầu: kho chữa không được loại câu có hình nữa, và ảnh
// phải đi tới tận nơi người đọc nhìn (phiếu in HTML + thẻ câu trong báo cáo).
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import TheCauChiTiet from '../src/components/TheCauChiTiet'
import { cauCoAnh, cauLuyenTuNguon, chonCauLuyen, type CauLuyen } from '../src/lib/bai-tap-pdf'
import { ungVienChua } from '../src/lib/rut-de-chua'
import { dsCauCoMa, thongKeDang } from '../src/lib/thong-ke-dang'
import { dungCauSai, giamGoiPhieu, type CauSaiChiTiet, type PhieuDayDu } from '../src/lib/phieu-du-lieu'
import { dungPhieu, theCauHtml } from '../src/lib/html-phieu'
import type { TeacherExamSource } from '../src/data/examContent'
import type { ChiTietCauRow } from '../src/lib/exam-api'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

const ANH_THAN = 'data:image/png;base64,THANCAU'
const ANH_PA = 'data:image/png;base64,PHUONGAN'
const ANH_CHEN = 'data:image/png;base64,CHENVAO'

const MA = 'ESTER.THUY_PHAN_BASE.TINH_KHOI_LUONG'

function mcq(id: string, sua: Record<string, unknown> = {}) {
  return {
    id,
    text: `Câu ${id}`,
    choices: ['A1', 'B1', 'C1', 'D1'] as [string, string, string, string],
    correct: 'A' as const,
    chuyenDe: 'Ester – lipid',
    mucDo: 'hieu' as const,
    dang: { ma: MA, ten: 'Thuỷ phân base' },
    loiGiai: { chot: `Chốt ${id}` },
    ...sua,
  }
}

const KHO: TeacherExamSource[] = [
  {
    maDe: 'X',
    phanI: [
      mcq('chu1'),
      mcq('chu2'),
      mcq('chu3'),
      mcq('anhThan', { thanCauImg: ANH_THAN }),
      mcq('anhPa', { choiceImgs: [ANH_PA, undefined, undefined, undefined] }),
      mcq('anhChen', { hinhAnh: [{ src: ANH_CHEN, viTri: 'sau_de' }] }),
    ],
    phanII: [],
    phanIII: [],
  } as unknown as TeacherExamSource,
]

function cauCo(id: string): CauLuyen {
  const c = cauLuyenTuNguon(KHO).find((x) => x.id === id)
  if (!c) throw new Error(`không thấy câu ${id}`)
  return c
}

describe('kho chữa KHÔNG còn loại câu có hình', () => {
  it('cả ba kiểu ảnh đều vào được kho chữa', () => {
    const ds = ungVienChua(KHO).map((x) => x.cau.id)
    expect(ds).toContain('anhThan')
    expect(ds).toContain('anhPa')
    expect(ds).toContain('anhChen')
    // Đủ SÁU câu, đúng bằng số câu có mã trong kho — không thiếu câu nào.
    expect(ds).toHaveLength(6)
  })

  it('BỘ ĐẾM KHỚP KHO — dùng được = số câu có mã, và đếm riêng câu có hình', () => {
    const tk = thongKeDang(KHO)
    expect(tk.daGan).toBe(6)
    expect(tk.dungLamCauChua).toBe(6)
    expect(tk.coHinhVanDung).toBe(3)
    // Không còn câu nào bị đánh dấu không dùng được vì có hình.
    expect(dsCauCoMa(KHO).every((c) => c.dungDuoc)).toBe(true)
  })

  it('màn Ngân hàng KHÔNG còn câu "không vào phiếu in được"', () => {
    const t = doc('src/components/KhoiMaDang.tsx')
    expect(t).not.toContain('không vào phiếu in được')
    expect(t).toContain('vẫn vào phiếu in đủ ảnh')
  })

  it('bài luyện rút ra cũng lấy câu có hình', () => {
    const kq = chonCauLuyen(KHO, { chuyenDe: [{ ten: 'Ester – lipid', tiLeSai: 0.9 }], soCau: 6, ngauNhien: () => 0.5 })
    expect(kq.cau.map((c) => c.id).sort()).toEqual(['anhChen', 'anhPa', 'anhThan', 'chu1', 'chu2', 'chu3'])
  })

  it('MỘT CỔNG duy nhất trả lời "câu có ảnh không", không mỗi nơi tự soi', () => {
    expect(cauCoAnh(cauCo('anhThan'))).toBe(true)
    expect(cauCoAnh(cauCo('anhPa'))).toBe(true)
    expect(cauCoAnh(cauCo('anhChen'))).toBe(true)
    expect(cauCoAnh(cauCo('chu1'))).toBe(false)
    const t = doc('src/lib/thong-ke-dang.ts')
    expect(t).toContain("import { cauCoAnh } from './bai-tap-pdf'")
    expect(t).not.toContain('anhThanCau')
  })
})

describe('phiếu in HTML dựng ĐỦ ảnh', () => {
  it('ảnh thân câu THAY chữ đề, không in cả hai', () => {
    const h = theCauHtml(cauCo('anhThan'), 1)
    expect(h).toContain(ANH_THAN)
    expect(h).not.toContain('Câu anhThan')
  })

  it('ảnh của từng phương án đi đúng phương án của nó', () => {
    const h = theCauHtml(cauCo('anhPa'), 1)
    expect(h).toContain(ANH_PA)
    const oA = h.slice(h.indexOf('>A<'), h.indexOf('>B<'))
    expect(oA).toContain(ANH_PA)
  })

  it('ảnh chèn theo vị trí vẫn nằm sau đề', () => {
    expect(theCauHtml(cauCo('anhChen'), 1)).toContain(ANH_CHEN)
  })

  it('cả phiếu dựng ra KHÔNG rơi mất ảnh nào', () => {
    const h = dungPhieu({ hoTen: 'A', sbd: '1', ngay: new Date('2026-09-08'), tenChuyenDe: 'Ester', ketQua: '', hienDapAn: false }, cauLuyenTuNguon(KHO))
    for (const a of [ANH_THAN, ANH_PA, ANH_CHEN]) expect(h).toContain(a)
  })
})

describe('báo cáo phụ huynh và học sinh cũng hiện ảnh', () => {
  const rows: ChiTietCauRow[] = [
    { phan: 'I', soCau: 1, qid: 'anhThan', chuyenDe: '', mucDo: '', dapAnChon: 'B', dapAnDung: 'A', dungSai: false, giay: 20 },
    { phan: 'I', soCau: 2, qid: 'anhPa', chuyenDe: '', mucDo: '', dapAnChon: 'C', dapAnDung: 'A', dungSai: false, giay: 20 },
    { phan: 'I', soCau: 3, qid: 'anhChen', chuyenDe: '', mucDo: '', dapAnChon: 'D', dapAnDung: 'A', dungSai: false, giay: 20 },
  ] as ChiTietCauRow[]

  it('gói báo cáo CHỞ ảnh của từng câu sai', () => {
    const ds = dungCauSai(rows, KHO)
    expect(ds).toHaveLength(3)
    expect(ds[0].anhThanCau).toBe(ANH_THAN)
    expect(ds[1].anhLuaChon?.[0]).toBe(ANH_PA)
    expect(ds[2].hinh?.[0]).toEqual({ src: ANH_CHEN, viTri: 'sau_de', alt: undefined })
    // Câu không có ảnh thì KHÔNG mọc trường rỗng — gói phình vô ích.
    const chu = dungCauSai([{ ...rows[0], qid: 'chu1' }] as ChiTietCauRow[], KHO)
    expect(chu[0].anhThanCau).toBeUndefined()
    expect(chu[0].hinh).toBeUndefined()
  })

  it('THẺ CÂU vẽ ảnh ra: thân câu thay chữ, ảnh phương án đúng chỗ', () => {
    const ds = dungCauSai(rows, KHO)
    const a = render(<TheCauChiTiet c={ds[0]} stt={1} />)
    const img = [...a.container.querySelectorAll('img.bc-hinh')]
    expect(img.map((x) => x.getAttribute('src'))).toContain(ANH_THAN)
    // Có ảnh thì KHÔNG in chữ đề nữa, đúng như màn làm bài của em.
    expect(a.container.textContent ?? '').not.toContain('Câu anhThan')
    a.unmount()
    const b = render(<TheCauChiTiet c={ds[1]} stt={1} />)
    expect([...b.container.querySelectorAll('img.bc-hinh')].map((x) => x.getAttribute('src'))).toContain(ANH_PA)
  })

  it('CÒN ẢNH thì KHÔNG nói "không kèm hình" — nói vậy là nói sai chuyện đang xảy ra', () => {
    const ds = dungCauSai(rows, KHO)
    const { container } = render(<TheCauChiTiet c={ds[0]} stt={1} />)
    expect(container.textContent ?? '').not.toContain('không kèm được hình')
  })

  it('MẤT ẢNH vì gói quá nặng thì PHẢI nói ra, không im lặng', () => {
    const ds = dungCauSai(rows, KHO)
    const khongAnh: CauSaiChiTiet = { ...ds[0], anhThanCau: undefined, anhLuaChon: undefined, hinh: undefined }
    expect(khongAnh.coHinh).toBe(true)
    const { container } = render(<TheCauChiTiet c={khongAnh} stt={1} />)
    expect(container.textContent ?? '').toContain('không kèm được hình')
  })

  it('GÓI QUÁ CỠ thì BỎ ẢNH TRƯỚC, giữ lại đề và bài tập', () => {
    const nang = (n: number) => 'data:image/png;base64,' + 'A'.repeat(n)
    const p = {
      v: 2,
      cauSai: [{ ...dungCauSai(rows, KHO)[0], anhThanCau: nang(5000) }],
      daSuaDuoc: [{ ...dungCauSai(rows, KHO)[1], anhThanCau: nang(5000) }],
      deCuaEm: [cauCo('chu1')],
      baiTap: [cauCo('chu2')],
    } as unknown as PhieuDayDu
    const { phieu, daBo } = giamGoiPhieu(p, 4000)
    expect(daBo[0]).toBe('ảnh của câu sai')
    expect(phieu.cauSai[0].anhThanCau).toBeUndefined()
    expect(phieu.daSuaDuoc?.[0].anhThanCau).toBeUndefined()
    // Bỏ ảnh là đủ nhẹ thì KHÔNG đụng tới đề và bài tập.
    expect(phieu.deCuaEm).toHaveLength(1)
    expect(phieu.baiTap).toHaveLength(1)
    // Và câu vẫn giữ cờ `coHinh` để báo cáo nói được là câu này có hình.
    expect(phieu.cauSai[0].coHinh).toBe(true)
  })
})
