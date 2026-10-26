// @vitest-environment jsdom
// ẨN HỆ PHÁT HIỆN LƯỜI KHỎI MÁY HỌC SINH (thầy 26/10) — PHẦN MÀN: màn học sinh (thẻ Hôm nay của em + bảng Nhịp học, Hồ sơ làm bài của em) không chứa
// «Lười», «Đối phó», «Bấm vội», «treo» (không phân biệt hoa thường) kể cả khi máy chủ CŨ còn gửi các trường; màn phụ huynh / thầy vẫn chứa như cũ.
// Máy chủ ⇒ tests/an-luoi-hs-2610.test.ts.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test', quenDiaChiMayChu: () => {} }))

import { banHocSinhHoSoThaiDo } from '../server/src/ho-so-em-hs-loc'
import { hoSoThaiDoGia } from '../scripts/chup-v2/gia/bai-hang-ngay'
import { lichSu6MucGia } from '../scripts/chup-v2/gia/lich-su-6-muc'
import { NHIP_EM_LUOI } from '../scripts/chup-v2/gia/nhip-hoc-em'
import { choTamXong, moGap } from './_ho-so-6-muc'
import { docNhipHocHs } from '../src/lib/nhip-hoc-em'
import { hoSoThaiDoKhungHs, lichSuKhungHs } from '../src/lib/ho-so-em-hs-api'

const { default: TheHomNayEm, xoaNhoNhipHocEm } = await import('../src/components/hoc-tap/TheHomNayEm')
const { default: BangNhipHoc } = await import('../src/components/hoc-tap/BangNhipHoc')
const { default: HoSoCuaEmHs } = await import('../src/components/hoc-tap/HoSoCuaEmHs')
const { default: HoSoLamCauEm, xoaDemHoSoLamCau } = await import('../src/components/chien-dich/HoSoLamCauEm')

type Kq = Record<string, unknown>
const CHU_LUOI = /lười|đối phó|bấm vội|treo/i
/** Khoá của hệ phát hiện lười — không được có ở BẤT KỲ tầng nào của trả lời /hs (trừ `nhan` của nhóm số giây "Dưới 8 giây" — kiểm riêng ở tầng đầu). */
const KHOA_LUOI = ['lyDo', 'soLieu', 'tienBo', 'tin', 'lichSu', 'coDoiPho', 'nhomNhip', 'bacCham', 'nhom', 'ketLuan', 'tinHieu', 'tinCayNhom', 'mucLam', 'mucLam6', 'tocDo', 'viecTiep', 'doTinCay', 'canThem', 'soNhanh', 'treo', 'giayTreo', 'cachTinhTinCay']
const moiKhoa = (x: unknown, ra = new Set<string>()): Set<string> => {
  if (Array.isArray(x)) x.forEach((v) => moiKhoa(v, ra))
  else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) { ra.add(k); moiKhoa(v, ra) }
  return ra
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  xoaNhoNhipHocEm()
  xoaDemHoSoLamCau()
})

describe('app em: bộ đọc bỏ trường của máy chủ CŨ (không vào bộ nhớ app em)', () => {
  it('docNhipHocHs · hoSoThaiDoKhungHs · lichSuKhungHs', () => {
    const nhip = docNhipHocHs(JSON.parse(JSON.stringify({ ...NHIP_EM_LUOI, bacCham: { bac: 1, diem: 0, diemLenBac: 3 }, doTinCay: 80 })))!
    expect(nhip).toBeTruthy()
    expect(KHOA_LUOI.filter((x) => moiKhoa(nhip).has(x))).toEqual([])
    const td = hoSoThaiDoKhungHs(JSON.parse(JSON.stringify({ ...banHocSinhHoSoThaiDo(hoSoThaiDoGia('11010')), nhomNhip: 'luoi', coDoiPho: true })))
    expect(['nhomNhip', 'coDoiPho', 'bacCham', 'tinCayNhom', 'soNhanh'].filter((x) => moiKhoa(td).has(x))).toEqual([])
    expect(td.ketLuan).toEqual({ nhan: 'chua-du-du-lieu', lyDo: [] })
    expect(td.tinHieu).toEqual([])
    const ls = lichSuKhungHs(JSON.parse(JSON.stringify(lichSu6MucGia('11010', 'Em Giả', 'hoc-sinh'))))
    expect(['mucLam', 'mucLam6'].filter((x) => moiKhoa(ls).has(x))).toEqual([])
  })
})

// ---------------------------------------------------------------- (3) màn
const traLoi = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } })
const SBD = '11010'
const TD = { ...hoSoThaiDoGia(SBD), nhomNhip: 'luoi' as const, coDoiPho: true, chuoiDuGanNhat: 2 }

describe('(3) màn học sinh không có chữ nào của hệ phát hiện lười — kể cả khi máy chủ CŨ còn gửi', () => {
  it('thẻ "Hôm nay của em" + bảng Nhịp học: máy chủ cũ gửi nhóm Lười, bậc 1, tốc độ xấu ⇒ không chữ / chip / màu nhóm', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => traLoi({ ...NHIP_EM_LUOI, bacCham: { bac: 1, diem: 0, diemLenBac: 3 }, doTinCay: 80 })))
    const onMoHoSo = vi.fn()
    render(<TheHomNayEm so={{ daLam: 7, muc: 32, chang: 2, soChang: 6 }} dangTai={false} ngayChu="Thứ Hai 12/10" onHoc={vi.fn()} khoaHoc={false} hetCau={false} token="tk" onMoHoSo={onMoHoSo} />)
    const the = screen.getByRole('region', { name: 'Hôm nay của em' })
    await within(the).findByText('Thầy cũng thấy bảng này.')
    await new Promise((r) => setTimeout(r, 30)) // khối bậc (nếu lỡ nạp) đã kịp vẽ
    expect(the.textContent).not.toMatch(CHU_LUOI)
    expect(the.textContent).not.toMatch(/bậc|chăm|chưa đều|quá nhanh|đọc hết đề/i)
    expect(the.outerHTML).not.toMatch(/data-nhom|bcc-|ht2-hn-luoi|ht2-hn-toc/)
    expect(within(the).getByRole('button', { name: 'Xem hồ sơ làm bài của em' })).toBeTruthy()
  })

  it('Hồ sơ làm bài của em: máy chủ cũ gửi nhóm Lười + cờ đối phó + Mức làm + treo ⇒ mở mọi ngăn vẫn không có; không gọi /hs/danh-gia', async () => {
    const duong: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const p = new URL(url).pathname
      duong.push(p)
      if (p === '/hs/ho-so-thai-do') return traLoi(banHocSinhHoSoThaiDo(TD))
      if (p === '/hs/lich-su-lam-cau') return traLoi(lichSu6MucGia(SBD, TD.em.hoTen, 'hoc-sinh'))
      if (p === '/hs/danh-gia') return traLoi({ ok: true, bat: true, coDanhGia: true, nhan: 'Đối phó', lyDo: ['Bấm vội'], lichSu: [] })
      return traLoi({ ok: false, error: 'không có' }, 404)
    }))
    render(<HoSoCuaEmHs token="tk-em" tenEm={TD.em.hoTen} lop="12A1" onDong={() => {}} />)
    const tam = await screen.findByRole('dialog')
    await choTamXong(tam)
    await waitFor(() => expect(tam.querySelector('.hsv-gap summary')).not.toBeNull())
    await waitFor(() => expect(tam.querySelector('.hsv-nhan')).not.toBeNull())
    moGap(tam)
    await waitFor(() => expect(tam.querySelector('.gvv2-tdo-dau')).not.toBeNull())
    expect(tam.textContent).not.toMatch(CHU_LUOI)
    expect(tam.textContent).not.toMatch(/Mức làm|Nộp trước khi đọc|quá nhanh|Chưa đều|Học thật|Sáu tín hiệu/i)
    expect(tam.outerHTML).not.toMatch(/data-treo|data-nhom|data-nhan|hslc-chip-m/)
    expect(tam.querySelectorAll('.hslc-lan').length).toBeGreaterThan(0) // vẫn đủ từng lượt (Đúng / Sai · số giây)
    expect(duong).not.toContain('/hs/danh-gia')
  })
})

describe('(3) màn phụ huynh / thầy GIỮ NGUYÊN', () => {
  it('bảng Nhịp học của con: «Ra khỏi nhóm Lười» + thang 12 bậc như cũ', async () => {
    render(<BangNhipHoc k={{ ...NHIP_EM_LUOI, bacCham: { bac: 1, diem: 0, diemLenBac: 3 } }} ngoi="con" />)
    await screen.findByRole('img', { name: /^Thang 12 bậc từ Lười đến Chăm/ })
    expect(document.body.textContent).toMatch(/Ra khỏi nhóm Lười/)
  })

  it.each([
    ['phu-huynh', /Lười|treo/],
    ['thay', /Lười|treo|đối phó/i],
  ] as const)('tấm hồ sơ chế độ %s vẫn có nhóm / Mức làm / treo', async (cheDo, mau) => {
    const nguon = {
      hoSoThaiDo: async () => ({ ok: true as const, du: TD }),
      lichSu: async () => ({ ok: true as const, du: JSON.parse(JSON.stringify(lichSu6MucGia(SBD, TD.em.hoTen, cheDo))) }),
    }
    render(<HoSoLamCauEm em={{ sbd: SBD, ten: TD.em.hoTen, khoi: '12' }} onDong={() => {}} nguon={nguon as never} cheDo={cheDo} />)
    const tam = await screen.findByRole('dialog')
    await choTamXong(tam)
    await waitFor(() => expect([...tam.querySelectorAll('.hsv-gap summary')].some((x) => /^Sáu tín hiệu/.test(x.textContent ?? ''))).toBe(true))
    moGap(tam)
    await waitFor(() => expect(tam.querySelector('#gvv2-tdo-nhan')).not.toBeNull())
    expect(tam.textContent).toMatch(mau)
    expect(tam.textContent).toMatch(/Mức làm/)
  })
})
