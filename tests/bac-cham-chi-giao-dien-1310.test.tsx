// @vitest-environment jsdom
// 12 BẬC TỪ LƯỜI ĐẾN CHĂM — PHẦN HIỂN THỊ (thầy 13/10: "tính toán tối ưu sắp xếp mức độ lười biếng … và hiển thị luôn nhé", "Mỗi cấp độ hiển thị màu
// khác nhau nhé", rồi "Hiện bậc trên màn chiếu luôn nhé"). Phép tính máy chủ: tests/bac-cham-chi-1310.test.ts. Ở đây khoá:
//   · ChipBac: đúng biểu tượng / tên / số; bản nhỏ chỉ biểu tượng + số, tên đầy đủ trong title + aria-label;
//   · ThangBac: 12 ô, đủ 12 `data-bac` khác nhau, ô hiện tại đánh dấu + có biểu tượng; "Còn N điểm lên <biểu tượng> <tên bậc kế>" chỉ khi diemLenBac ≠ null;
//   · 12 màu: mỗi bậc một khai báo màu riêng, CHỈ từ biến chuẩn (không màu thô);
//   · máy chủ cũ (vắng `bacCham`) ⇒ không chip, không thang, không thẻ bậc, không dải chiếu — màn y như trước;
//   · thầy: chip nhỏ mỗi dòng em, cách xếp "Theo bậc" (thấp → cao, em lười nhất trước), dải đếm số em mỗi bậc đúng số;
//   · tờ chiếu điểm danh: ô em `.ddc-em` (bản A) / dòng em (bản B) có chip đúng bậc, dải chú giải đếm đúng số;
//   · bộ đọc 3 lệnh bỏ dữ liệu sai kiểu / lệch nhóm; khoảng bậc phía app khớp `NGUONG_BAC` máy chủ;
//   · bảng em/phụ huynh: số Sảnh đổi nhóm ⇒ bậc tính lại vẫn nằm trong khoảng của nhóm mới (MỘT con số).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'

const ph = vi.hoisted(() => ({ nhip: vi.fn() }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/ho-so-con-ph-api', async (goc) => ({ ...(await goc<typeof import('../src/lib/ho-so-con-ph-api')>()), layNhipHocCon: (sbd: string) => ph.nhip(sbd) }))
vi.mock('../src/components/chien-dich/HoSoLamCauEm', () => ({ default: () => <div role="dialog" aria-label="Hồ sơ làm bài" /> }))
vi.mock('../src/components/chien-dich/TheBaiHangNgay', () => ({ default: () => <section aria-label="Bảng giả" /> }))

import { BAC_CHAM_CHI, bacChamChi, NGUONG_BAC, type KetQuaBac } from '../server/src/bac-cham-chi'
import { tomTatNhip } from '../server/src/nhip-hoc-luat'
import type { EmNhipHoc, KetQuaNhipHoc, KetQuaNhipHocEm } from '../server/src/nhip-hoc-kieu'
import { BAC_CAO_NHAT, docBacCham, KHOANG_BAC } from '../src/lib/bac-cham-chi'
import { docNhipHocEm, nhipTheoSanh } from '../src/lib/nhip-hoc-em'
import { demTheoBac, docNhipHoc, phanNhomEm, xepTheoBac, type DongNhipHoc } from '../src/lib/nhip-hoc-thay'
import { docHoSoThaiDo } from '../src/lib/bai-hang-ngay-api'
import { chuNutEm, nhipTheoSbd, thongKeBuoi } from '../src/lib/diem-danh-nhip'
import type { TrangThaiBuoi } from '../src/lib/buoi-hoc-api'
import { bacTheoSanh } from '../src/components/bac-cham-chi/bac'
import ChipBac from '../src/components/bac-cham-chi/ChipBac'
import ThangBac from '../src/components/bac-cham-chi/ThangBac'
import BangNhipHoc from '../src/components/hoc-tap/BangNhipHoc'
import NhipHocCon from '../src/components/ph-v3/NhipHocCon'
import NhipHocThay from '../src/components/hom-nay-thay/NhipHocThay'
import BanChieuDiemDanh from '../src/components/day-hoc/BanChieuDiemDanh'
import { NHIP_EM_CHUA_DEU, NHIP_EM_LUOI } from '../scripts/chup-v2/gia/nhip-hoc-em'

afterEach(() => {
  cleanup()
  ph.nhip.mockReset()
})

// ---------------------------------------------------------------- dữ liệu: 12 ngày 01/10 → 12/10, hôm nay 12/10; bậc tính bằng ĐÚNG phép máy chủ
const NGAY = Array.from({ length: 12 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`)
const HOM_NAY = '2026-10-12'
/** Bậc của một em đúng như máy chủ gửi (`bacChamChi` trên các ngày từ ngày vào). */
function bacEm(e: EmNhipHoc): KetQuaBac | null {
  const dai = NGAY.map((ngay, i) => ({ ngay, muc: e.muc[i]!, lam: e.lam[i]! })).filter((x) => x.ngay >= e.ngayVao)
  return bacChamChi(dai, HOM_NAY, tomTatNhip(dai, HOM_NAY))
}
const em = (sbd: string, hoTen: string, lam: number[], o: Partial<EmNhipHoc> = {}): EmNhipHoc => {
  const e: EmNhipHoc = { sbd, hoTen, lop: '12A1', khoi: '12', ngayVao: NGAY[0]!, muc: NGAY.map(() => 10), lam, doiPho: null, ...o }
  const b = bacEm(e)
  return b ? { ...e, bacCham: b } : e
}
const deu = (n: number) => NGAY.map(() => n)
// sáu em trải đủ ba nhóm + một em mới vào (chưa đủ dữ liệu ⇒ không bậc)
const DS_EM = [
  em('A1', 'An Bình', deu(0)), // Lười, không làm gì
  em('A2', 'Bảo Châu', [10, 0, 0, 0, 10, 0, 0, 0, 10, 0, 4, 0]), // Lười
  em('A3', 'Cẩm Dung', [10, 10, 0, 10, 10, 0, 10, 10, 4, 10, 10, 0]), // Chưa đều
  em('A4', 'Duy Khang', [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10]), // Chăm, 11 ngày liền
  em('A5', 'Gia Hân', [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 12, 0]), // Chăm
  em('A6', 'Hà My', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 10], { ngayVao: NGAY[10]! }), // mới vào ⇒ chưa đủ dữ liệu
]
const KQ: KetQuaNhipHoc = { ok: true, tu: NGAY[0]!, den: HOM_NAY, homNay: HOM_NAY, ngay: NGAY, em: DS_EM, lop: [{ tenLop: '12A1', khoi: '12', soEm: DS_EM.length }], doiPhoDaTinh: { quaNhanh: true, chonLap: true }, canhBao: [] }
const boBac = (e: EmNhipHoc): EmNhipHoc => {
  const { bacCham: _bo, ...con } = e
  return con
}

describe('fixture khớp luật: bậc luôn trong khoảng nhóm', () => {
  it('mỗi em có bậc nằm đúng khoảng nhóm; em mới vào không có bậc', () => {
    const dong = DS_EM.map((e) => phanNhomEm(e, NGAY, HOM_NAY))
    expect(dong.map((d) => d.nhom)).toEqual(['luoi', 'luoi', 'chua-deu', 'cham', 'cham', 'chua-du'])
    for (const d of dong) {
      if (d.nhom === 'chua-du') expect(d.bacCham).toBeUndefined()
      else expect(d.bacCham!.bac).toBeGreaterThanOrEqual(KHOANG_BAC[d.nhom][0]), expect(d.bacCham!.bac).toBeLessThanOrEqual(KHOANG_BAC[d.nhom][1])
    }
  })
  it('khoảng bậc phía app (hằng nhỏ, không kéo bảng tên vào tải đầu) khớp NGUONG_BAC của máy chủ', () => {
    for (const [nhom, n] of Object.entries(NGUONG_BAC)) expect(KHOANG_BAC[nhom as keyof typeof KHOANG_BAC]).toEqual([n.dau, n.dau + n.nguong.length])
    expect(BAC_CAO_NHAT).toBe(BAC_CHAM_CHI.length)
  })
})

describe('ChipBac', () => {
  it('bản thường: biểu tượng + "Bậc N/12 · Tên"; biểu tượng ẩn khỏi trình đọc màn hình', () => {
    const { container } = render(<ChipBac bac={6} />)
    const chip = container.querySelector('.bcc-chip')!
    expect(chip.getAttribute('data-bac')).toBe('6')
    expect(chip.textContent).toBe('🐼Bậc 6/12 · Lười Có Tính Toán')
    expect(chip.querySelector('.bcc-bt')!.getAttribute('aria-hidden')).toBe('true')
  })
  it('bản nhỏ: chỉ biểu tượng + số bậc; tên đầy đủ ở title + aria-label', () => {
    render(<ChipBac bac={12} nho />)
    const chip = screen.getByRole('img', { name: 'Bậc 12/12 · Thần Chăm Chỉ Tối Thượng' })
    expect(chip.textContent).toBe('👑12')
    expect(chip.getAttribute('title')).toBe('Bậc 12/12 · Thần Chăm Chỉ Tối Thượng')
    expect(chip.hasAttribute('data-nho')).toBe(true)
  })
  it('số bậc ngoài 1–12 ⇒ không vẽ gì', () => {
    const { container } = render(<ChipBac bac={13} />)
    expect(container.innerHTML).toBe('')
  })
})

describe('ThangBac', () => {
  it('12 ô, 12 data-bac khác nhau theo thứ tự 1 → 12, đúng một ô hiện tại có biểu tượng; "Còn N điểm lên <biểu tượng> <tên bậc kế>"', () => {
    const { container } = render(<ThangBac kq={{ bac: 6, diem: 49, diemLenBac: 6 }} />)
    const o = [...container.querySelectorAll('.bcc-o')]
    expect(o).toHaveLength(12)
    expect(o.map((x) => x.getAttribute('data-bac'))).toEqual(Array.from({ length: 12 }, (_, i) => String(i + 1)))
    const hien = o.filter((x) => x.getAttribute('data-hien') === 'true')
    expect(hien).toHaveLength(1)
    expect(hien[0]!.getAttribute('data-bac')).toBe('6')
    expect(hien[0]!.textContent).toBe('🐼')
    expect(o.filter((x) => x.textContent).length).toBe(1)
    expect(screen.getByRole('img', { name: 'Thang 12 bậc từ Lười đến Chăm: đang ở Bậc 6/12 · Lười Có Tính Toán, điểm chăm 49/100' })).toBeTruthy()
    expect(container.querySelector('.bcc-len')!.textContent).toBe('Còn 6 điểm lên ⚖️ Đại Sư Cân Bằng')
  })
  it('diemLenBac = null (bậc kế thuộc nhóm khác / bậc 12) ⇒ không thêm chữ', () => {
    const { container, rerender } = render(<ThangBac kq={{ bac: 5, diem: 40, diemLenBac: null }} />)
    expect(container.querySelector('.bcc-len')).toBeNull()
    rerender(<ThangBac kq={{ bac: 12, diem: 100, diemLenBac: null }} />)
    expect(container.querySelector('.bcc-len')).toBeNull()
    expect(container.querySelector('[data-hien="true"]')!.getAttribute('data-bac')).toBe('12')
  })
})

describe('12 màu: mỗi bậc một màu riêng, chỉ từ biến chuẩn', () => {
  const css = readFileSync('src/components/bac-cham-chi/bac-cham-chi.css', 'utf8')
  it('đủ 12 khai báo --bac khác nhau, không màu thô, chỉ dùng --do --cam --xanh --tim --vang-diu', () => {
    const khai = [...css.matchAll(/\.bcc\[data-bac='(\d+)'\] \{ --bac: ([^;]+); \}/g)].map((m) => [Number(m[1]), m[2]!] as const)
    expect(khai.map(([n]) => n)).toEqual(Array.from({ length: 12 }, (_, i) => i + 1))
    expect(new Set(khai.map(([, v]) => v)).size).toBe(12)
    for (const [, v] of khai) expect([...v.matchAll(/var\((--[\w-]+)\)/g)].every((m) => ['--do', '--cam', '--xanh', '--tim', '--vang-diu'].includes(m[1]!))).toBe(true)
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i)
    expect(khai[0]![1]).toBe('var(--do)')
    expect(khai[11]![1]).toBe('var(--vang-diu)')
  })
})

describe('bộ đọc: sai kiểu / lệch nhóm ⇒ bỏ trường (không bịa)', () => {
  it('docBacCham', () => {
    expect(docBacCham({ bac: 3, diem: 20, diemLenBac: 6 }, 'luoi')).toEqual({ bac: 3, diem: 20, diemLenBac: 6 })
    expect(docBacCham({ bac: 11, diem: 95, diemLenBac: null }, 'cham')).toEqual({ bac: 11, diem: 95, diemLenBac: null })
    expect(docBacCham({ bac: 3, diem: 20, diemLenBac: 6 })).toEqual({ bac: 3, diem: 20, diemLenBac: 6 })
    for (const sai of [
      null, [], 'bac', { bac: '3', diem: 20, diemLenBac: 6 }, { bac: 3.5, diem: 20, diemLenBac: 6 }, { bac: 0, diem: 20, diemLenBac: 6 }, { bac: 13, diem: 20, diemLenBac: null },
      { bac: 3, diem: Number.NaN, diemLenBac: 6 }, { bac: 3, diem: 150, diemLenBac: 6 }, { bac: 3, diem: 20 }, { bac: 3, diem: 20, diemLenBac: -1 }, { bac: 3, diem: 20, diemLenBac: '6' },
      { bac: 12, diem: 99, diemLenBac: 1 },
    ])
      expect(docBacCham(sai)).toBeNull()
    expect(docBacCham({ bac: 6, diem: 40, diemLenBac: 5 }, 'luoi')).toBeNull() // lệch nhóm
    expect(docBacCham({ bac: 5, diem: 40, diemLenBac: 3 }, 'luoi')).toBeNull() // cuối khoảng mà còn "điểm lên" ⇒ sai
    expect(docBacCham({ bac: 3, diem: 20, diemLenBac: 6 }, 'chua-du')).toBeNull()
    expect(docBacCham({ bac: 3, diem: 20, diemLenBac: 6 }, null)).toBeNull()
  })
  it('/hs|/ph/nhip-hoc: bậc hợp lệ giữ nguyên; sai kiểu / lệch nhóm ⇒ bỏ trường, bảng vẫn đọc', () => {
    const b = bacTheoSanh({ ...NHIP_EM_LUOI, bacCham: { bac: 1, diem: 0, diemLenBac: 8 } })!
    const goc = { ...NHIP_EM_LUOI, bacCham: b }
    expect(docNhipHocEm(JSON.parse(JSON.stringify(goc)))).toEqual(goc)
    expect(docNhipHocEm(JSON.parse(JSON.stringify({ ...NHIP_EM_LUOI, bacCham: { bac: 9, diem: 85, diemLenBac: 5 } })))).toEqual(NHIP_EM_LUOI)
    expect(docNhipHocEm(JSON.parse(JSON.stringify({ ...NHIP_EM_LUOI, bacCham: { bac: 'hai' } })))).toEqual(NHIP_EM_LUOI)
  })
  it('/gv/nhip-hoc: em vẫn giữ, bậc sai kiểu bỏ; bậc lệch nhóm app tính ⇒ dòng không có bậc', () => {
    const du = JSON.parse(JSON.stringify({ ...KQ, em: [{ ...DS_EM[0]!, bacCham: { bac: 'x' } }, { ...DS_EM[3]!, bacCham: { bac: 2, diem: 10, diemLenBac: 6 } }] }))
    const kq = docNhipHoc(du)!
    expect(kq.em).toHaveLength(2)
    expect(kq.em[0]!.bacCham).toBeUndefined()
    expect(kq.em[1]!.bacCham).toEqual({ bac: 2, diem: 10, diemLenBac: 6 }) // kiểu đúng ⇒ đọc
    expect(phanNhomEm(kq.em[1]!, NGAY, HOM_NAY).bacCham).toBeUndefined() // nhưng em này Chăm ⇒ bậc 2 lệch nhóm ⇒ bỏ
    expect(phanNhomEm(DS_EM[3]!, NGAY, HOM_NAY).bacCham).toEqual(DS_EM[3]!.bacCham)
  })
  it('hồ sơ thái độ: chỉ nhận khi có nhóm hợp lệ và bậc nằm trong khoảng nhóm', () => {
    const khung = { em: { sbd: '1', hoTen: 'A', lop: '12A1', khoi: '12' }, ketLuan: { nhan: 'chua-du-du-lieu', lyDo: [] }, dem: {}, tinHieu: [], ngay: [], tu: '2026-10-01', den: HOM_NAY }
    expect(docHoSoThaiDo({ ...khung, nhomNhip: 'cham', bacCham: { bac: 9, diem: 86, diemLenBac: 4 } })!.bacCham).toEqual({ bac: 9, diem: 86, diemLenBac: 4 })
    expect(docHoSoThaiDo({ ...khung, nhomNhip: 'cham', bacCham: { bac: 3, diem: 20, diemLenBac: 6 } })!.bacCham).toBeUndefined()
    expect(docHoSoThaiDo({ ...khung, bacCham: { bac: 9, diem: 86, diemLenBac: 4 } })!.bacCham).toBeUndefined()
    expect(docHoSoThaiDo({ ...khung, nhomNhip: 'cham', bacCham: [9] })!.bacCham).toBeUndefined()
  })
})

describe('bảng em / phụ huynh', () => {
  it('số Sảnh làm em thoát Lười ngay hôm nay ⇒ bậc tính lại bằng phép máy chủ, nằm trong khoảng nhóm mới (không giữ bậc Lười cũ)', () => {
    // 5 ngày liền đủ tới hôm qua, máy chủ đọc hôm nay 0 câu ⇒ Lười; Sảnh: hôm nay đủ ⇒ 6 ngày liền ⇒ thoát Lười
    const ngay = NGAY.map((d, i) => ({ ngay: d, muc: 30, lam: i < 6 ? 0 : i < 11 ? 30 : 0 }))
    const t = tomTatNhip(ngay, HOM_NAY)
    expect(t.nhom).toBe('luoi')
    const k: KetQuaNhipHocEm = { ...NHIP_EM_LUOI, ngay, chuoiDuGanNhat: t.chuoiDuGanNhat, bacCham: bacChamChi(ngay, HOM_NAY, t)! }
    expect(k.bacCham!.bac).toBeLessThanOrEqual(5)
    const sau = nhipTheoSanh(k, { muc: 30, daLam: 30 })
    expect(sau.nhom).not.toBe('luoi')
    const b = bacTheoSanh(sau)!
    const [dau, cuoi] = KHOANG_BAC[sau.nhom as 'cham' | 'chua-deu']
    expect(b.bac).toBeGreaterThanOrEqual(dau)
    expect(b.bac).toBeLessThanOrEqual(cuoi)
    // không có Sảnh ⇒ y số máy chủ
    expect(bacTheoSanh(k)).toEqual(k.bacCham)
    // máy chủ cũ (không gửi bậc) ⇒ không tính
    expect(bacTheoSanh({ ...k, bacCham: undefined })).toBeNull()
  })

  it('BangNhipHoc có bậc ⇒ thang 12 bậc đầu bảng (khối nạp khi cần); vắng ⇒ không thang', async () => {
    const k = { ...NHIP_EM_CHUA_DEU, bacCham: bacTheoSanh({ ...NHIP_EM_CHUA_DEU, bacCham: { bac: 6, diem: 0, diemLenBac: null } })! }
    const { container, unmount } = render(<BangNhipHoc k={k} />)
    const thang = await screen.findByRole('img', { name: /^Thang 12 bậc từ Lười đến Chăm: đang ở Bậc [67]\/12/ })
    expect(thang.querySelectorAll('.bcc-o')).toHaveLength(12)
    expect(container.querySelector('.ht2-hn-nhip')!.firstElementChild!.classList.contains('bcc-thang')).toBe(true)
    unmount()
    const cu = render(<BangNhipHoc k={NHIP_EM_CHUA_DEU} />)
    await new Promise((r) => setTimeout(r, 20))
    expect(cu.container.querySelector('.bcc-thang, .bcc-chip')).toBeNull()
  })

  it('phụ huynh: chip "Bậc N/12 · Tên" cạnh chip nhóm + thang; máy chủ cũ ⇒ thẻ y như trước', async () => {
    const b = bacTheoSanh({ ...NHIP_EM_LUOI, bacCham: { bac: 1, diem: 0, diemLenBac: 8 } })!
    ph.nhip.mockResolvedValue({ ok: true, du: { ...NHIP_EM_LUOI, bacCham: b } })
    const { container, unmount } = render(<NhipHocCon sbd="12121212" tenCon="Minh Anh" />)
    const chip = await waitFor(() => {
      const c = container.querySelector('.ph3-the__dau .bcc-chip')
      if (!c) throw new Error('chưa có chip')
      return c
    })
    expect(chip.getAttribute('data-bac')).toBe(String(b.bac))
    expect(chip.textContent).toBe(`${BAC_CHAM_CHI[b.bac - 1]!.bieuTuong}Bậc ${b.bac}/12 · ${BAC_CHAM_CHI[b.bac - 1]!.ten}`)
    expect(chip.parentElement!.querySelector('.ph3-nhip__nhom')!.textContent).toBe('Lười')
    expect(container.querySelector('.ph3-nhip')!.classList.contains('ph3-nhip--bac')).toBe(true)
    await screen.findByRole('img', { name: /^Thang 12 bậc/ })
    unmount()
    ph.nhip.mockResolvedValue({ ok: true, du: NHIP_EM_LUOI })
    const cu = render(<NhipHocCon sbd="12121212" tenCon="Minh Anh" />)
    await waitFor(() => expect(cu.container.querySelector('.ph3-nhip__nhom')).toBeTruthy())
    expect(cu.container.querySelector('.bcc-chip, .bcc-thang, .bcc-hang')).toBeNull()
    expect(cu.container.querySelector('.ph3-nhip')!.classList.contains('ph3-nhip--bac')).toBe(false)
  })
})

describe('thầy · Nhịp học cả lớp', () => {
  const dong = (): DongNhipHoc[] => DS_EM.map((e) => phanNhomEm(e, NGAY, HOM_NAY))
  it('xếp theo bậc: thấp → cao (lười nhất trước), cùng bậc điểm thấp trước, em chưa xếp bậc cuối', () => {
    const ds = [...dong()].sort(xepTheoBac)
    const bac = ds.map((d) => d.bacCham?.bac ?? null)
    expect(bac.at(-1)).toBeNull()
    const coBac = ds.filter((d) => d.bacCham)
    for (let i = 1; i < coBac.length; i++) {
      const a = coBac[i - 1]!.bacCham!, b = coBac[i]!.bacCham!
      expect(a.bac < b.bac || (a.bac === b.bac && a.diem <= b.diem)).toBe(true)
    }
    expect(ds[0]!.sbd).toBe('A1')
  })
  it('đếm số em mỗi bậc', () => {
    const dem = demTheoBac(dong())
    expect(dem).toHaveLength(12)
    expect(dem.reduce((a, b) => a + b, 0)).toBe(5)
    for (const e of DS_EM) if (e.bacCham) expect(dem[e.bacCham.bac - 1]).toBeGreaterThan(0)
  })
  it('màn: chip nhỏ mỗi dòng em + trình đọc nghe bậc; thẻ "12 bậc" có dải đếm đúng; "Theo bậc" ⇒ MỘT danh sách đúng thứ tự', () => {
    render(<NhipHocThay du={{ ok: true, kq: KQ }} dangTai={false} onThuLai={() => {}} />)
    const luoi = screen.getByRole('region', { name: 'Lười nhất · cần nhắc ngay' })
    const nutA1 = within(luoi).getAllByRole('button').find((b) => b.getAttribute('data-sbd') === 'A1')!
    const b1 = DS_EM[0]!.bacCham!
    expect(nutA1.querySelector('.bcc-chip[data-nho]')!.getAttribute('data-bac')).toBe(String(b1.bac))
    expect(nutA1.getAttribute('aria-label')).toContain(`; Bậc ${b1.bac}/12 · ${BAC_CHAM_CHI[b1.bac - 1]!.ten}`)
    // dải đếm
    const the = screen.getByRole('region', { name: '12 bậc từ Lười đến Chăm' })
    const dem = demTheoBac(DS_EM.map((e) => ({ bacCham: e.bacCham })))
    const o = [...the.querySelectorAll('.bcc-dem-o')]
    expect(o).toHaveLength(12)
    expect(o.map((x) => Number(x.querySelector('b')!.textContent!.replace(/\D/g, '')))).toEqual(dem)
    expect(o[0]!.textContent).toContain(`${dem[0]} em ở Bậc 1/12 · Lười Vô Cực`)
    // cách xếp
    expect(screen.queryByRole('region', { name: 'Theo bậc · lười nhất trước' })).toBeNull()
    fireEvent.click(within(the).getByRole('radio', { name: 'Theo bậc' }))
    expect(within(the).getByRole('radio', { name: 'Theo bậc' }).getAttribute('aria-checked')).toBe('true')
    const cot = screen.getByRole('region', { name: 'Theo bậc · lười nhất trước' })
    const thuTu = within(cot).getAllByRole('button').filter((b) => b.classList.contains('nht-em')).map((b) => b.getAttribute('data-sbd'))
    expect(thuTu).toEqual(dong().filter((d) => d.bacCham).sort(xepTheoBac).map((d) => d.sbd))
    expect(screen.queryByRole('region', { name: 'Lười nhất · cần nhắc ngay' })).toBeNull()
    expect(within(cot).getByText(/1 em chưa đủ dữ liệu/)).toBeTruthy()
    fireEvent.click(within(the).getByRole('radio', { name: 'Theo nhóm' }))
    expect(screen.getByRole('region', { name: 'Lười nhất · cần nhắc ngay' })).toBeTruthy()
  })
  it('máy chủ cũ (không bậc) ⇒ không chip, không thẻ 12 bậc, không cách xếp', () => {
    render(<NhipHocThay du={{ ok: true, kq: { ...KQ, em: DS_EM.map(boBac) } }} dangTai={false} onThuLai={() => {}} />)
    expect(document.querySelector('.bcc-chip, .nht-bac, .bcc-dem')).toBeNull()
    expect(screen.queryByRole('radio', { name: 'Theo bậc' })).toBeNull()
  })
})

describe('tờ chiếu điểm danh (thầy 13/10: "Hiện bậc trên màn chiếu luôn nhé")', () => {
  const BUOI = { id: 'BH-1', ten: 'Buổi học 12/10 · 12A1', lop: '12A1', moLuc: '2026-10-12T10:50:00Z', hetHan: '2026-10-13T10:50:00Z', dongLuc: null, dangMo: true }
  const CO_MAT = ['A1', 'A3', 'A4', 'A6'].map((sbd, i) => ({ sbd, hoTen: DS_EM.find((e) => e.sbd === sbd)!.hoTen, luc: `2026-10-12T10:5${i}:00Z`, cach: 'ma' as const }))
  const TT: TrangThaiBuoi = { buoi: BUOI, ma: '482915', doiMaLuc: 1, coMat: CO_MAT, siSo: 6, lopEm: DS_EM.map((e) => ({ sbd: e.sbd, hoTen: e.hoTen, tenLop: '12A1' })) }
  const ve = (cheDo: 'diem-danh' | 'nhip-lop', kq: KetQuaNhipHoc = KQ) =>
    render(
      <BanChieuDiemDanh cheDo={cheDo} tt={TT} tk={thongKeBuoi(TT, nhipTheoSbd(kq))} nhip={{ kq, dangTai: false, loi: '' }} goc="https://app.test" matKetNoi={false} hoSoMo={false}
        onDoiCheDo={() => {}} onDong={() => {}} onMoEm={() => {}} onThuLaiNhip={() => {}} />,
    )
  it('bản A: mỗi ô em có chip đúng bậc (em mới vào không chip); dải chú giải đếm đúng số em có mặt mỗi bậc', () => {
    ve('diem-danh')
    const o = [...document.querySelectorAll<HTMLButtonElement>('.ddc-em')]
    expect(o).toHaveLength(4)
    for (const nut of o) {
      const e = DS_EM.find((x) => nut.textContent!.includes(x.hoTen))!
      const chip = nut.querySelector('.bcc-chip[data-nho]')
      if (e.bacCham) {
        expect(chip!.getAttribute('data-bac')).toBe(String(e.bacCham.bac))
        expect(chip!.textContent).toBe(`${BAC_CHAM_CHI[e.bacCham.bac - 1]!.bieuTuong}${e.bacCham.bac}`)
        expect(nut.getAttribute('aria-label')).toContain(`, Bậc ${e.bacCham.bac}/12 · ${BAC_CHAM_CHI[e.bacCham.bac - 1]!.ten} — mở hồ sơ làm bài`)
      } else expect(chip).toBeNull()
    }
    const dai = screen.getByRole('group', { name: '12 bậc từ Lười đến Chăm' })
    const dem = demTheoBac(DS_EM.filter((e) => CO_MAT.some((c) => c.sbd === e.sbd)).map((e) => ({ bacCham: e.bacCham })))
    expect([...dai.querySelectorAll('.bcc-dem-o b')].map((b) => Number(b.textContent!.replace(/\D/g, '')))).toEqual(dem)
    expect(dem.reduce((a, b) => a + b, 0)).toBe(3)
  })
  it('bản B: dòng em có chip, dải chú giải cả lớp kèm tên bậc', () => {
    ve('nhip-lop')
    const dai = screen.getByRole('group', { name: '12 bậc từ Lười đến Chăm' })
    expect([...dai.querySelectorAll('.bcc-dem-ten')].map((x) => x.textContent)).toEqual(BAC_CHAM_CHI.map((b) => b.ten))
    expect([...dai.querySelectorAll('.bcc-dem-o b')].map((b) => Number(b.textContent!.replace(/\D/g, '')))).toEqual(demTheoBac(DS_EM.map((e) => ({ bacCham: e.bacCham }))))
    const dongA4 = [...document.querySelectorAll('.ddc-dong-em')].find((x) => x.textContent!.includes('Duy Khang'))!
    expect(dongA4.querySelector('.bcc-chip')!.getAttribute('data-bac')).toBe(String(DS_EM[3]!.bacCham!.bac))
  })
  it('máy chủ cũ ⇒ không chip, không dải; câu đọc màn hình y như trước', () => {
    const cu = { ...KQ, em: DS_EM.map(boBac) }
    ve('diem-danh', cu)
    expect(document.querySelector('.bcc-chip, .ddc-bac')).toBeNull()
    const tk = thongKeBuoi(TT, nhipTheoSbd(cu))
    const nut = [...document.querySelectorAll('.ddc-em')][0]!
    expect(nut.getAttribute('aria-label')).toBe(chuNutEm(tk.coMat.find((e) => nut.textContent!.includes(e.hoTen))!))
  })
})
