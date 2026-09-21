// BẢNG TIN KIỂU SÀN GIAO DỊCH · cụm (a): khung + bốn ô số + băng chạy (Boss giao 21/09; đề bài prompt-bang-tin-san-2109.md).
// Khoá: MỘT nguồn trạng thái (số các khối KHỚP nhau) · khối thiếu ⇒ ẩn · số lăn kiểu công-tơ · chip chênh 10 phút · băng chạy chỉ nhận tin thật, không bịa · nút Sáng/Tối dùng cơ chế sẵn có ·
// mọi lớp `bts-` có định nghĩa CSS, màu chỉ qua token (sáng + tối), chữ ≥ 12 px.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { datKhungGia } from './_khung-gia-2109'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import { chenhLech, chotSo, chuMoc, gioGiayVN, kiemTraKhop } from '../src/lib/bang-tin-san/trang-thai'
import { chiaNguyen, taoDuLieuGia } from '../src/lib/bang-tin-san/mau-gia'
import type { DuLieuSan, TinSan } from '../src/lib/bang-tin-san/kieu'
import BangTinSan from '../src/components/bang-tin-san/BangTinSan'
import { SoLan } from '../src/components/bang-tin-san/SoLan'
import { BangChay } from '../src/components/bang-tin-san/BangChay'
import { ChipLech } from '../src/components/bang-tin-san/OSo'
import { KHOA_GIAO_DIEN } from '../src/lib/giao-dien-thay'

const NAY = Date.parse('2026-09-21T08:28:36.000Z') // 15:28:36 giờ VN
const goc = () => taoDuLieuGia(NAY)
const doc = (f: string) => fs.readFileSync(path.join(process.cwd(), f), 'utf8')

beforeEach(() => {
  try { localStorage.removeItem(KHOA_GIAO_DIEN) } catch { /* không có localStorage */ }
  document.documentElement.removeAttribute('data-giao-dien')
})
let khung = datKhungGia()
beforeEach(() => { khung = datKhungGia() })
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('dữ liệu giả có hạt giống — đúng hợp đồng và KHỚP nhau', () => {
  it('cùng hạt giống ⇒ cùng dữ liệu; hạt giống khác ⇒ khác', () => {
    expect(JSON.stringify(taoDuLieuGia(NAY))).toBe(JSON.stringify(taoDuLieuGia(NAY)))
    expect(JSON.stringify(taoDuLieuGia(NAY, 7))).not.toBe(JSON.stringify(taoDuLieuGia(NAY, 8)))
  })
  it('tổng lớp = câu đã làm; ô nhiệt = em đã học; số câu các nến cộng đúng bằng tổng; chuỗi tia đủ 60 điểm kết thúc ĐÚNG số hiện tại', () => {
    const d = goc()
    expect(kiemTraKhop(d)).toEqual([])
    expect(d.theoLop!.reduce((t, l) => t + l.soCau, 0)).toBe(d.soCau)
    expect(d.nhiet!).toHaveLength(d.tongEm)
    expect(d.nhiet!.filter((e) => e.soCau > 0)).toHaveLength(d.soEmHoc)
    expect(d.nen!.reduce((t, n) => t + n.soCau, 0)).toBe(d.soCau)
    expect(d.tia!.hs).toHaveLength(60)
    expect(d.tia!.hs[59]).toBe(d.soEmHoc)
    expect(d.tia!.cau[59]).toBe(d.soCau)
    expect(d.tia!.nhip![59]).toBe(d.dungNhip!.soEm)
    expect(d.moPhong).toBe(true)
  })
  it('chiaNguyen: tổng khớp tuyệt đối theo trọng số', () => {
    expect(chiaNguyen(100, [1, 1, 1])).toEqual([34, 33, 33])
    expect(chiaNguyen(10, [0, 0, 0]).reduce((a, b) => a + b, 0)).toBe(10)
    expect(chiaNguyen(7, [3, 1])).toEqual([5, 2])
  })
})

describe('chotSo — MỘT nguồn: các khối đọc chung ⇒ số khớp nhau', () => {
  it('có bảng theo lớp + ô nhiệt ⇒ số lấy từ CHÚNG (không lấy số gốc lệch): câu = tổng lớp, em học = số ô có câu, chưa học = sĩ số − đã học', () => {
    const d = { ...goc(), soCau: 9999, soCauDung: 9999, soEmHoc: 1, tongEm: 5 }
    const s = chotSo(d)
    expect(s.soCau).toBe(1142)
    expect(s.soCauDung).toBe(994)
    expect(s.tongEm).toBe(264)
    expect(s.soEmHoc).toBe(34)
    expect(s.chuaHoc).toBe(230)
    expect(s.tiLeDung).toBeCloseTo((994 / 1142) * 100, 6)
    expect(kiemTraKhop(d).length).toBeGreaterThan(0) // và ghi nhận chỗ máy chủ lệch
  })
  it('thiếu ô nhiệt ⇒ em học/sĩ số lấy từ bảng lớp; thiếu cả hai ⇒ số gốc; không có câu nào ⇒ tỉ lệ null (không 0 giả)', () => {
    const d = goc()
    expect(chotSo({ ...d, nhiet: null })).toMatchObject({ soEmHoc: 34, tongEm: 264, chuaHoc: 230 })
    const goi = chotSo({ ...d, nhiet: null, theoLop: null, soEmHoc: 12, tongEm: 40, soCau: 50, soCauDung: 40 })
    expect(goi).toMatchObject({ soEmHoc: 12, tongEm: 40, chuaHoc: 28, soCau: 50, soCauDung: 40, tiLeDung: 80 })
    expect(chotSo({ ...d, nhiet: null, theoLop: null, soCau: 0, soCauDung: 0 }).tiLeDung).toBeNull()
  })
  it('kẹp: câu đúng không vượt câu làm; em đã học không vượt sĩ số; số âm / NaN ⇒ 0', () => {
    const d = { ...goc(), nhiet: null, theoLop: null }
    expect(chotSo({ ...d, soCau: 10, soCauDung: 50 }).soCauDung).toBe(10)
    expect(chotSo({ ...d, tongEm: 5, soEmHoc: 9 }).soEmHoc).toBe(5)
    expect(chotSo({ ...d, soCau: -3, soCauDung: Number.NaN, tongEm: Number.NaN }).soCau).toBe(0)
  })
  it('kiemTraKhop nêu từng chỗ lệch: tổng câu, câu đúng, em học, sĩ số ô nhiệt, tổng đã học các lớp, tổng sĩ số', () => {
    const d = goc()
    expect(kiemTraKhop({ ...d, soCau: d.soCau + 1 })).toEqual(['tổng câu các lớp ≠ "Câu đã làm"'])
    expect(kiemTraKhop({ ...d, soCauDung: d.soCauDung + 1 })).toEqual(['tổng câu đúng các lớp ≠ số câu đúng'])
    expect(kiemTraKhop({ ...d, soEmHoc: d.soEmHoc + 1 })).toEqual(['số ô nhiệt đã học ≠ "Em đã học"'])
    expect(kiemTraKhop({ ...d, tongEm: d.tongEm + 1 })).toEqual(['số ô nhiệt ≠ sĩ số', 'tổng sĩ số các lớp ≠ sĩ số'])
    const lop = d.theoLop!.map((l, i) => (i === 0 ? { ...l, daHoc: l.daHoc + 1 } : l))
    expect(kiemTraKhop({ ...d, theoLop: lop })).toEqual(['tổng "đã học" các lớp ≠ số ô nhiệt đã học'])
  })
})

describe('chenhLech · gioGiayVN · chuMoc', () => {
  it('chênh lệch = điểm cuối − điểm cách 10 phút; thiếu điểm ⇒ null', () => {
    const a = Array.from({ length: 60 }, (_, i) => i)
    expect(chenhLech(a)).toBe(10)
    expect(chenhLech(a, 5)).toBe(5)
    expect(chenhLech([1, 2, 3])).toBeNull()
    expect(chenhLech(null)).toBeNull()
    expect(chenhLech(undefined)).toBeNull()
    expect(chenhLech([...Array(11).fill(1), Number.NaN])).toBeNull()
  })
  it('giờ Việt Nam không lệ thuộc múi giờ máy; chip mốc có thứ, ngày, năm', () => {
    expect(gioGiayVN(NAY)).toBe('15:28:36')
    expect(gioGiayVN(Date.parse('2026-09-21T17:00:05.000Z'))).toBe('00:00:05') // qua nửa đêm giờ VN
    expect(chuMoc(Date.parse('2026-09-21T05:00:00.000Z'))).toBe('Từ 12:00 · Thứ Hai 21/09/2026')
    expect(chuMoc(Date.parse('2026-09-19T05:00:00.000Z'))).toBe('Từ 12:00 · Thứ Bảy 19/09/2026')
  })
})

describe('SoLan — số lăn kiểu công-tơ', () => {
  it('mỗi chữ số là một cột trượt tới đúng chữ số; dấu chấm là ký tự thường; có nhãn đọc được', () => {
    const { container } = render(<SoLan chu="1.142" />)
    const so = container.querySelector('.bts-so-lan') as HTMLElement
    expect(so.getAttribute('aria-label')).toBe('1.142')
    expect(so.querySelectorAll('.bts-cs')).toHaveLength(4)
    expect(so.querySelectorAll('.bts-kt')).toHaveLength(1)
    const dich = [...so.querySelectorAll<HTMLElement>('.bts-dai')].map((e) => e.style.transform)
    expect(dich).toEqual(['translateY(-10%)', 'translateY(-10%)', 'translateY(-40%)', 'translateY(-20%)'])
  })
  it('đổi số cùng độ dài ⇒ CHÍNH các cột ấy trượt (không dựng lại); đổi độ dài (999 → 1.000) ⇒ dựng lại', () => {
    const { container, rerender } = render(<SoLan chu="34" />)
    const cot = container.querySelectorAll<HTMLElement>('.bts-dai')
    rerender(<SoLan chu="35" />)
    const sau = container.querySelectorAll<HTMLElement>('.bts-dai')
    expect(sau[0]).toBe(cot[0])
    expect(sau[1]).toBe(cot[1])
    expect(sau[1]!.style.transform).toBe('translateY(-50%)')
    rerender(<SoLan chu="1.000" />)
    expect(container.querySelectorAll('.bts-cs')).toHaveLength(4)
    expect(container.querySelectorAll('.bts-dai')[0]).not.toBe(cot[0])
  })
  it('lần đầu KHÔNG chạy chuyển động (chỉ bật lớp chạy sau khung hình đầu); "—" là ký tự thường', async () => {
    const { container } = render(<SoLan chu="—" />)
    expect(container.querySelector('.bts-cs')).toBeNull()
    expect(container.querySelector('.bts-kt')!.textContent).toBe('—')
    expect(container.querySelector('.bts-so-lan')!.className).not.toContain('bts-so-lan--chay')
    await khung.chay(1)
    expect(container.querySelector('.bts-so-lan')!.className).toContain('bts-so-lan--chay')
  })
})

describe('ChipLech — hướng theo SỐ ĐANG HIỆN', () => {
  const chip = (d: number, thap?: boolean) => render(<ChipLech d={d} don="em" thapPhan={thap} />).container.querySelector('.bts-lech') as HTMLElement
  it('lên (+, xanh) / xuống (−, đỏ) / ngang; làm tròn về 0 ⇒ ngang, KHÔNG dấu, không "+0,0"', () => {
    expect(chip(3).getAttribute('data-h')).toBe('len')
    expect(chip(3).textContent).toBe('+3 em')
    cleanup()
    expect(chip(-2).getAttribute('data-h')).toBe('xuong')
    expect(chip(-2).textContent).toBe('−2 em')
    cleanup()
    expect(chip(0).getAttribute('data-h')).toBe('ngang')
    expect(chip(0).textContent).toBe('0 em')
    cleanup()
    expect(chip(0.04, true).getAttribute('data-h')).toBe('ngang')
    expect(chip(0.04, true).textContent).toBe('0,0 em')
    cleanup()
    expect(chip(-0.26, true).textContent).toBe('−0,3 em')
    expect(chip(0.26, true).getAttribute('data-h')).toBe('len')
  })
})

describe('BangTinSan — khung, bốn ô số', () => {
  it('thanh trên: tiêu đề, chip mốc, chip "Dữ liệu mô phỏng" (chỉ khi mô phỏng), đồng hồ giây theo giờ đã cho, TRỰC TIẾP, nút Sáng/Tối', () => {
    const { container } = render(<BangTinSan du={goc()} nayMs={NAY} />)
    const dau = container.querySelector('[data-khoi="thanh-tren"]') as HTMLElement
    expect(dau.querySelector('h1')!.textContent).toBe('Bảng tin')
    expect(dau.textContent).toContain('Từ 12:00 · Thứ Hai 21/09/2026')
    expect(dau.textContent).toContain('Dữ liệu mô phỏng')
    expect(dau.querySelector('[aria-label="Giờ hiện tại"]')!.textContent).toBe('15:28:36')
    expect(dau.textContent).toContain('TRỰC TIẾP')
    expect(screen.getByRole('button', { name: 'Sáng' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Tối' })).toBeTruthy()
    cleanup()
    const that = render(<BangTinSan du={{ ...goc(), moPhong: false }} nayMs={NAY} />)
    expect(that.container.textContent).not.toContain('Dữ liệu mô phỏng')
  })

  it('bốn ô số có NHÃN + số + đơn vị đúng, và KHỚP chotSo: 34/264 em · 1.142 câu · 87 % cả ngày · 59/59 em', () => {
    const { container } = render(<BangTinSan du={goc()} nayMs={NAY} />)
    const o = (k: string) => container.querySelector(`[data-khoi="${k}"]`) as HTMLElement
    expect(o('em-hoc').querySelector('h2')!.textContent).toBe('Em đã học hôm nay')
    expect(o('em-hoc').querySelector('.bts-so-lan')!.getAttribute('aria-label')).toBe('34')
    expect(o('em-hoc').querySelector('.bts-o-duoi')!.textContent).toBe('/ 264 em')
    expect(o('cau-lam').querySelector('h2')!.textContent).toBe('Câu đã làm')
    expect(o('cau-lam').querySelector('.bts-so-lan')!.getAttribute('aria-label')).toBe('1.142')
    expect(o('ti-le-dung').querySelector('h2')!.textContent).toBe('Tỉ lệ đúng')
    expect(o('ti-le-dung').querySelector('.bts-so-lan')!.getAttribute('aria-label')).toBe('87')
    expect(o('ti-le-dung').querySelector('.bts-o-duoi')!.textContent).toBe('% cả ngày')
    expect(o('dung-nhip').querySelector('h2')!.textContent).toBe('Bài tập về nhà đúng nhịp')
    expect(o('dung-nhip').querySelector('.bts-so-lan')!.getAttribute('aria-label')).toBe('59')
    expect(o('dung-nhip').querySelector('.bts-o-duoi')!.textContent).toBe('/ 59 em')
    expect(container.querySelector('[data-so-o]')!.getAttribute('data-so-o')).toBe('4')
  })

  it('số hiển thị theo chotSo chứ không theo số gốc lệch của máy chủ (một nguồn)', () => {
    const { container } = render(<BangTinSan du={{ ...goc(), soCau: 5, soEmHoc: 2, soCauDung: 1 }} nayMs={NAY} />)
    expect(container.querySelector('[data-khoi="cau-lam"] .bts-so-lan')!.getAttribute('aria-label')).toBe('1.142')
    expect(container.querySelector('[data-khoi="em-hoc"] .bts-so-lan')!.getAttribute('aria-label')).toBe('34')
  })

  it('chip chênh 10 phút = điểm cuối − điểm cách 10 phút của CHÍNH chuỗi tia; ô đủ nhãn "10 phút qua" (chữ nằm trong DOM)', () => {
    const d = goc()
    d.tia = { hs: Array.from({ length: 60 }, (_, i) => (i < 50 ? 30 : 30 + (i - 49) / 10)), cau: Array(60).fill(100), tile: Array(60).fill(87), nhip: Array.from({ length: 60 }, (_, i) => i) }
    d.tia.hs[59] = 34
    d.tia.hs[49] = 30
    const { container } = render(<BangTinSan du={d} nayMs={NAY} />)
    const lech = (k: string) => container.querySelector(`[data-khoi="${k}"] .bts-lech`) as HTMLElement
    expect(lech('em-hoc').textContent).toBe('+4 em')
    expect(lech('em-hoc').getAttribute('data-h')).toBe('len')
    expect(lech('cau-lam').getAttribute('data-h')).toBe('ngang')
    expect(lech('dung-nhip').textContent).toBe('+10 em')
    expect(container.querySelector('[data-khoi="em-hoc"] .bts-o-lech')!.textContent).toContain('10 phút qua')
  })

  it('tỉ lệ đúng cả ngày: điểm cuối của tia luôn bằng số đang hiện (không lệch giữa số và đường)', () => {
    const d = goc()
    d.tia!.tile = Array(60).fill(50) // lệch cố ý: máy chủ trả tia không khớp số
    const { container } = render(<BangTinSan du={d} nayMs={NAY} />)
    expect(container.querySelector('[data-khoi="ti-le-dung"] .bts-lech')!.textContent).toMatch(/^\+37,\d điểm %$/) // 87,0 − 50 (điểm cuối bị kéo về số đang hiện)
  })

  it('THIẾU KHỐI ⇒ ẨN, không bịa: không có số đúng nhịp ⇒ chỉ 3 ô; không có tia ⇒ số vẫn hiện nhưng KHÔNG có đường tia và KHÔNG có chip chênh; không có tin ⇒ không có băng chạy', () => {
    const { container } = render(<BangTinSan du={{ ...goc(), dungNhip: null }} nayMs={NAY} />)
    expect(container.querySelector('[data-khoi="dung-nhip"]')).toBeNull()
    expect(container.querySelector('[data-so-o]')!.getAttribute('data-so-o')).toBe('3')
    expect(container.textContent).not.toContain('Bài tập về nhà đúng nhịp')
    cleanup()
    const c2 = render(<BangTinSan du={{ ...goc(), tia: null, tin: [] }} nayMs={NAY} />).container
    expect(c2.querySelectorAll('.bts-o-so')).toHaveLength(4)
    expect(c2.querySelectorAll('.bts-o-tia canvas')).toHaveLength(0)
    expect(c2.querySelectorAll('.bts-lech')).toHaveLength(0)
    expect(c2.querySelector('[data-khoi="bang-chay"]')).toBeNull()
    expect(c2.querySelector('[data-khoi="em-hoc"] .bts-so-lan')!.getAttribute('aria-label')).toBe('34')
  })

  it('chưa có câu nào ⇒ tỉ lệ đúng hiện "—" và KHÔNG có đơn vị "% cả ngày"', () => {
    const d = { ...goc(), nhiet: null, theoLop: null, soCau: 0, soCauDung: 0 }
    const { container } = render(<BangTinSan du={d} nayMs={NAY} />)
    expect(container.querySelector('[data-khoi="ti-le-dung"] .bts-so-lan')!.getAttribute('aria-label')).toBe('—')
    expect(container.querySelector('[data-khoi="ti-le-dung"] .bts-o-duoi')).toBeNull()
  })

  it('mỗi đường tia là canvas có nhãn đọc được (mô tả bằng chữ)', () => {
    const { container } = render(<BangTinSan du={goc()} nayMs={NAY} />)
    const nhan = [...container.querySelectorAll('.bts-o-tia canvas')].map((c) => c.getAttribute('aria-label'))
    expect(nhan).toEqual([
      'Số em đã học trong 60 phút gần nhất', 'Số câu đã làm trong 60 phút gần nhất', 'Tỉ lệ đúng trong 60 phút gần nhất', 'Số em nộp chặng đúng nhịp trong 60 phút gần nhất',
    ])
  })
})

describe('Nút Sáng / Tối — cơ chế giao diện SẴN CÓ của app', () => {
  it('bấm Tối ⇒ lưu lựa chọn + đặt data-giao-dien="toi"; bấm Sáng ⇒ "sang"; aria-pressed theo lựa chọn', () => {
    render(<BangTinSan du={goc()} nayMs={NAY} />)
    fireEvent.click(screen.getByRole('button', { name: 'Tối' }))
    expect(localStorage.getItem(KHOA_GIAO_DIEN)).toBe('toi')
    expect(document.documentElement.getAttribute('data-giao-dien')).toBe('toi')
    expect(screen.getByRole('button', { name: 'Tối' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Sáng' }).getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(screen.getByRole('button', { name: 'Sáng' }))
    expect(localStorage.getItem(KHOA_GIAO_DIEN)).toBe('sang')
    expect(document.documentElement.getAttribute('data-giao-dien')).toBe('sang')
    expect(screen.getByRole('button', { name: 'Sáng' }).getAttribute('aria-pressed')).toBe('true')
  })
})

describe('BangChay — chỉ nhận tin thật, không bịa', () => {
  const tin = (n: number): TinSan => ({ luc: NAY - n * 60_000, loai: n % 3 === 0 ? 'len' : n % 3 === 1 ? 'xuong' : 'cham', chu: `Tin ${n}`, phu: `· phụ ${n}` })
  const chu = (c: HTMLElement) => [...c.querySelectorAll('.bts-tin')].map((e) => e.querySelector('b')!.textContent)

  it('hiện đúng các tin đã cho, đúng thứ tự, kèm mũi tên theo loại (lên/xuống/chấm); có nhãn "Vừa xảy ra"', () => {
    const { container } = render(<BangChay tin={[tin(3), tin(2), tin(1)]} itDong />)
    expect(chu(container)).toEqual(['Tin 3', 'Tin 2', 'Tin 1'])
    expect(container.querySelector('.bts-bang-nhan')!.textContent).toBe('Vừa xảy ra')
    expect(container.querySelector('.bts-tin-len')).toBeTruthy()
    expect(container.querySelector('.bts-tin-xuong')).toBeTruthy()
    expect(container.querySelector('.bts-tin-cham')).toBeTruthy()
    expect(container.querySelector('.bts-tin .bts-phu')!.textContent).toContain('phụ 3')
  })

  it('tin MỚI (chưa từng thấy) nối vào CUỐI; gửi lại tin cũ không nhân đôi; tối đa 24 tin (bỏ tin cũ nhất)', () => {
    const { container, rerender } = render(<BangChay tin={[tin(3), tin(2)]} itDong />)
    rerender(<BangChay tin={[tin(3), tin(2), tin(1)]} itDong />)
    expect(chu(container)).toEqual(['Tin 3', 'Tin 2', 'Tin 1'])
    rerender(<BangChay tin={[tin(3), tin(2), tin(1)]} itDong />)
    expect(chu(container)).toEqual(['Tin 3', 'Tin 2', 'Tin 1'])
    const nhieu = Array.from({ length: 30 }, (_, i) => tin(40 - i))
    rerender(<BangChay tin={nhieu} itDong />)
    expect(container.querySelectorAll('.bts-tin')).toHaveLength(24)
    expect(chu(container).at(-1)).toBe('Tin 11')
  })

  it('tắt chuyển động ⇒ đứng yên (không transform); bật ⇒ băng có chuyển động (transform được đặt sau khung hình đầu)', async () => {
    const { container, unmount } = render(<BangChay tin={[tin(3), tin(2)]} itDong />)
    expect((container.querySelector('.bts-bang-day') as HTMLElement).style.transform).toBe('')
    unmount()
    const { container: c2 } = render(<BangChay tin={[tin(3), tin(2)]} itDong={false} />)
    await khung.chay(2)
    expect((c2.querySelector('.bts-bang-day') as HTMLElement).style.transform).toMatch(/^translate3d\(/)
  })
})

describe('BangChay — đổi sang giảm chuyển động giữa chừng', () => {
  it('đang chạy mà bật "giảm chuyển động" ⇒ băng về vị trí gốc và đứng yên', async () => {
    const tin: TinSan[] = [{ luc: NAY, loai: 'len', chu: 'A', phu: 'x' }, { luc: NAY + 1, loai: 'cham', chu: 'B' }]
    const { container, rerender } = render(<BangChay tin={tin} itDong={false} />)
    await khung.chay(2)
    const day = container.querySelector('.bts-bang-day') as HTMLElement
    expect(day.style.transform).toMatch(/^translate3d\(/)
    rerender(<BangChay tin={tin} itDong />)
    expect(day.style.transform).toBe('')
  })
})

describe('nguồn: lớp CSS, token, chữ', () => {
  const css = doc('src/components/bang-tin-san/bang-tin-san.css')
  const tsx = ['BangTinSan', 'ThanhTren', 'BangChay', 'OSo', 'SoLan', 'TiaCanvas'].map((f) => doc(`src/components/bang-tin-san/${f}.tsx`)).join('\n')
  const dinhNghia = new Set([...css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{[^{}]*\}/g, '{}').matchAll(/\.([A-Za-z][\w-]*)/g)].map((m) => m[1]!))
  const dung = new Set<string>()
  for (const m of tsx.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) for (const t of (m[1] ?? m[2] ?? '').replace(/\$\{[^}]*\}/g, ' ').split(/\s+/)) if (/^bts-[\w-]+$/.test(t) && !t.endsWith('-')) dung.add(t) // `bts-tin-${loai}` ghép lúc chạy: kiểm ba lớp cụ thể riêng

  it('mọi lớp `bts-` dùng ở TSX đều có định nghĩa CSS; MỌI lớp dùng đều mang tiền tố bts- (không `.mt` trần, không lớp lạ)', () => {
    expect(dung.size).toBeGreaterThan(20)
    expect([...dung].filter((t) => !dinhNghia.has(t))).toEqual([])
    for (const t of ['bts-tin-len', 'bts-tin-xuong', 'bts-tin-cham']) expect(dinhNghia.has(t), t).toBe(true)
    for (const m of tsx.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) for (const t of (m[1] ?? m[2] ?? '').replace(/\$\{[^}]*\}/g, ' ').split(/\s+/)) if (t && !t.startsWith('bts-')) throw new Error(`lớp không có tiền tố bts-: ${t}`)
    expect([...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/\.([A-Za-z][\w-]*)/g)].map((m) => m[1]!).filter((t) => !t.startsWith('bts-'))).toEqual([]) // bộ chọn CSS: không lớp nào ngoài tiền tố bts-
  })

  it('CSS không có mã màu thô (# hex) — màu chỉ qua var(--bts-*) hoặc rgb() của token; mọi --bts-* dùng đều được định nghĩa ở CẢ nền sáng và nền tối trong tokens.css khi cần đổi', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    const tok = doc('src/styles/tokens.css')
    const khoiSang = tok.slice(tok.indexOf('--bts-nen: #f8fafd'), tok.indexOf('@media (prefers-color-scheme: dark)', tok.indexOf('--bts-nen: #f8fafd')))
    const khoiToi = tok.slice(tok.indexOf('--bts-nen: #0e1116'))
    const dungBien = new Set([...css.matchAll(/var\(--(bts-[\w-]+)\)/g)].map((m) => m[1]!))
    expect(dungBien.size).toBeGreaterThan(15)
    for (const b of dungBien) if (!['bts-fm', 'bts-em', 'bts-cao-hang'].includes(b)) expect(khoiSang.includes(`--${b}:`), `thiếu ${b} ở nền sáng`).toBe(true)
    for (const b of ['bts-nen', 'bts-mat', 'bts-mat-2', 'bts-vien', 'bts-chu', 'bts-chu-phu', 'bts-duong', 'bts-la', 'bts-do', 'bts-la-nhat', 'bts-do-nhat', 'bts-xam-o', 'bts-luoi']) expect(khoiToi.includes(`--${b}:`), `thiếu ${b} ở nền tối`).toBe(true)
  })

  it('chữ trên màn ≥ 12 px (chuẩn giao diện); chuyển động tắt khi giảm chuyển động; nút Sáng/Tối cao ≥ 32 px có viền tiêu điểm', () => {
    for (const m of css.matchAll(/font-size:\s*([\d.]+)px/g)) expect(Number(m[1]), m[0]).toBeGreaterThanOrEqual(12)
    expect(css).toMatch(/prefers-reduced-motion: reduce/)
    expect(css).toMatch(/\.bts-doi-mau button \{[^}]*height: 32px/)
    expect(css).toMatch(/\.bts-doi-mau button:focus-visible/)
  })

  it('màn không tự chế cơ chế giao diện (dùng useGiaoDien) và không gọi mạng / không đọc localStorage trực tiếp', () => {
    const t = doc('src/components/bang-tin-san/ThanhTren.tsx')
    expect(t).toMatch(/useGiaoDien/)
    for (const f of ['BangTinSan', 'ThanhTren', 'BangChay', 'OSo', 'SoLan', 'TiaCanvas', 'hooks']) {
      const s = f === 'hooks' ? doc('src/components/bang-tin-san/hooks.ts') : doc(`src/components/bang-tin-san/${f}.tsx`)
      expect(s, f).not.toMatch(/fetch\(|goiLenh|localStorage|XMLHttpRequest/)
    }
  })
})
