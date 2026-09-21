// BẢNG "MỌI THỨ VỀ CON" KIỂU APPLE — PHẦN A (đầu trang · Tổng quan + ba vòng · Điều đáng mừng · A.I đã làm; mẫu docs/ban-ve-ph-apple-2109/ph-d-bang-day-du.html + ph-e-bang-thua.html):
// đủ dữ liệu ⇒ chữ đúng mẫu + hình học vòng đúng mẫu; thiếu trường ⇒ ẨN đúng phần đó (không số 0 giả); biên (0, null, rất dài); cảnh chưa học; không chữ game; chuyển động chỉ khi không giảm chuyển động.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import DauTrang from '../src/components/ph-moi/bang/DauTrang'
import Vong3, { cacVongVe, tinhVong } from '../src/components/ph-moi/bang/Vong3'
import { TongQuan, chuGiaiVong, coTongQuan, soSanhHomQua, tomTatHomNay } from '../src/components/ph-moi/bang/TongQuan'
import { DieuMung, coDieuMung, dongLenBac } from '../src/components/ph-moi/bang/DieuMung'
import { AiLam, coAiLam, phuChonRieng, phuNhac } from '../src/components/ph-moi/bang/AiLam'
import { docTatCaVeCon } from '../src/lib/ph-moi/du-lieu'
import { PH_OK, PH_TRONG, NAY } from './_ph-moi/du-lieu-mau'
import { PH_APPLE, PH_APPLE_CHUA_HOC, PH_APPLE_THUA } from './_ph-moi/du-lieu-mau-apple'

const CAM_GAME = /thần thú|khiên|Võ đài|Đảo thần thú|Linh Tâm|Đoàn Hộ Tống|\bEXP\b/i
const nhan = <T,>(o: T): T => JSON.parse(JSON.stringify(o))
const pmOf = (raw: unknown = PH_APPLE) => docTatCaVeCon(raw)!
const cacO = (c: ParentNode, sel: string) => [...c.querySelectorAll(sel)].map((l) => l.textContent)
const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const NAM_TEP = ['DauTrang.tsx', 'Vong3.tsx', 'TongQuan.tsx', 'DieuMung.tsx', 'AiLam.tsx', 'TongQuan.css'].map((t) => `src/components/ph-moi/bang/${t}`)

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
  window.history.replaceState(null, '', '/')
})

// ───────────────────────────────────────────── tinhVong (hàm thuần)
describe('tinhVong — cung của một vòng', () => {
  it('chưa tới mục tiêu: một cung; đúng mục tiêu: đầy nhưng KHÔNG vượt; vượt: đầy + cung thứ hai bằng phần lẻ (38/16 ⇒ 0,375 như mẫu)', () => {
    expect(tinhVong(9, 16)).toMatchObject({ lapDau: 9 / 16, vuot: false, lapHai: 0 })
    expect(tinhVong(16, 16)).toMatchObject({ lapDau: 1, vuot: false, lapHai: 0 })
    const v = tinhVong(38, 16)!
    expect(v.vuot).toBe(true)
    expect(v.lapDau).toBe(1)
    expect(v.lapHai).toBeCloseTo(0.375, 9)
    expect(tinhVong(52, 45)!.lapHai).toBeCloseTo(7 / 45, 9)
  })
  it('biên: 0 ⇒ cung rỗng; đúng bội nguyên của mục tiêu ⇒ cung thứ hai đầy cả vòng; thiếu số / âm / mục tiêu ≤ 0 / NaN / vô hạn ⇒ null (không vẽ vòng)', () => {
    expect(tinhVong(0, 16)).toMatchObject({ lapDau: 0, vuot: false })
    expect(tinhVong(32, 16)).toMatchObject({ vuot: true, lapHai: 1 })
    for (const [g, m] of [[null, 16], [undefined, 16], [-1, 16], [5, 0], [5, -3], [5, null], [5, undefined], [NaN, 16], [Infinity, 16], [5, NaN]] as const) expect(tinhVong(g, m)).toBeNull()
  })
})

// ───────────────────────────────────────────── Vong3
describe('Vong3 — ba vòng SVG', () => {
  const tq = (raw: unknown = PH_APPLE) => pmOf(raw).tongQuan!
  const ve = (t = tq(), nhanTay?: string) => render(<Vong3 soCau={t.soCau} soDung={t.soDung} phutHoc={t.phutHoc} mucTieu={t.mucTieu} nhan={nhanTay} />)

  it('đủ dữ liệu: hình học ĐÚNG MẪU (bán kính 50 / 37,5 / 25; cung 117,81 · 186,02 · 24,43; chấm đầu vòng), nhãn đọc màn hình y mẫu', () => {
    const { container } = ve()
    const wrap = container.querySelector('.phm-vong3') as HTMLElement
    expect(wrap.getAttribute('role')).toBe('img')
    expect(wrap.getAttribute('aria-label')).toBe('Ba vòng hôm nay: 38 câu đã làm trên mục tiêu 16 câu; câu đúng 79 %; 52 phút học trên mục tiêu 45 phút')
    expect(container.querySelector('svg')!.getAttribute('viewBox')).toBe('0 0 120 120')
    expect(container.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true')
    expect(cacO(container, 'circle.phm-v-nen').length).toBe(3)
    const r = (mau: number) => container.querySelector(`circle.phm-v-nen[data-mau="${mau}"]`)!.getAttribute('r')
    expect([r(1), r(2), r(3)]).toEqual(['50', '37.5', '25'])
    for (const c of container.querySelectorAll('circle.phm-v-nen')) expect(c.getAttribute('stroke-width')).toBe('10.5')
    const cung = (mau: number, lap2 = false) => container.querySelector(`circle.phm-v-cung${lap2 ? '.phm-v-lap2' : ':not(.phm-v-lap2)'}[data-mau="${mau}"]`) as SVGElement
    expect(cung(1, true).getAttribute('stroke-dasharray')).toBe('117.81 314.16') // 0,375 × chu vi 314,16 (mẫu)
    expect(cung(1).getAttribute('stroke-dasharray')).toBe('314.16 314.16') // vòng đầu đầy
    expect(cung(2).getAttribute('stroke-dasharray')).toBe('186.02 235.62') // 30/38 (mẫu)
    expect(cung(3, true).getAttribute('stroke-dasharray')).toBe('24.43 157.08') // (52/45 − 1) (mẫu)
    expect(cung(1, true).getAttribute('transform')).toBe('rotate(-90 60 60)')
    // chấm đầu vòng: vòng 1 ở 45° (95,36 · 95,36), vòng 3 ở −34° (80,73 · 46,02); vòng 2 không vượt ⇒ không chấm
    const dau = (mau: number) => container.querySelector(`circle[data-to="${mau}"]`) as SVGElement | null
    expect([dau(1)!.getAttribute('cx'), dau(1)!.getAttribute('cy'), dau(1)!.getAttribute('r')]).toEqual(['95.36', '95.36', '5.25'])
    expect([dau(3)!.getAttribute('cx'), dau(3)!.getAttribute('cy')]).toEqual(['80.73', '46.02'])
    expect(dau(2)).toBeNull()
    // bóng đầu vòng: lệch 3,2 về phía trước theo tiếp tuyến, cắt bằng mặt nạ đúng vành vòng
    const bong = container.querySelectorAll('circle.phm-v-bong')
    expect(bong.length).toBe(2)
    expect(Number(bong[0]!.getAttribute('cx'))).toBeCloseTo(93.09, 1)
    expect(Number(bong[0]!.getAttribute('cy'))).toBeCloseTo(97.62, 1)
    expect(container.querySelectorAll('mask').length).toBe(2)
    expect(container.querySelector('filter feGaussianBlur')!.getAttribute('stdDeviation')).toBe('1.7')
  })

  it('id của mặt nạ / bộ lọc: hợp lệ trong url(#…) và KHÁC nhau giữa hai vòng đặt cạnh nhau; mọi tham chiếu trỏ đúng phần tử có mặt', () => {
    const { container } = render(
      <>
        <Vong3 soCau={38} soDung={30} phutHoc={52} mucTieu={{ soCau: 16, phutHoc: 45 }} />
        <Vong3 soCau={38} soDung={30} phutHoc={52} mucTieu={{ soCau: 16, phutHoc: 45 }} />
      </>,
    )
    const ids = [...container.querySelectorAll('[id]')].map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[A-Za-z][A-Za-z0-9_-]*$/)
    for (const e of container.querySelectorAll('[mask],[filter]')) {
      const ref = (e.getAttribute('mask') ?? e.getAttribute('filter'))!.replace(/^url\(#|\)$/g, '')
      expect(container.querySelector(`[id="${ref}"]`)).not.toBeNull()
    }
  })

  it('chưa tới mục tiêu: không mặt nạ / bóng / chấm; cung đầu tròn; nhãn ghi "trên mục tiêu"', () => {
    const { container } = ve(tq(PH_APPLE_THUA))
    // THUA không có mục tiêu ⇒ chỉ vòng 2
    expect(container.querySelectorAll('circle.phm-v-nen').length).toBe(1)
    const t = pmOf(PH_APPLE_THUA).tongQuan!
    const { container: c2 } = render(<Vong3 soCau={t.soCau} soDung={t.soDung} phutHoc={t.phutHoc} mucTieu={{ soCau: 16, phutHoc: 45 }} />)
    expect(c2.querySelector('mask')).toBeNull()
    expect(c2.querySelector('filter')).toBeNull()
    expect(c2.querySelector('[data-vuot]')).toBeNull()
    expect(c2.querySelector('circle.phm-v-cung[data-mau="1"]')!.getAttribute('stroke-linecap')).toBe('round')
    expect(c2.querySelector('.phm-vong3')!.getAttribute('aria-label')).toBe('Ba vòng hôm nay: 9 câu đã làm trên mục tiêu 16 câu; câu đúng 56 %; 14 phút học trên mục tiêu 45 phút')
  })

  it('thiếu mục tiêu / thiếu số ⇒ KHÔNG vẽ vòng đó; vòng còn lại nhận bán kính theo thứ tự có mặt (50, 37,5, 25)', () => {
    // chỉ có tỉ lệ đúng (bộ cũ không mục tiêu): một vòng ở bán kính 50, màu 2
    const a = render(<Vong3 soCau={38} soDung={30} phutHoc={52} mucTieu={null} />).container
    expect([...a.querySelectorAll('circle.phm-v-nen')].map((c) => [c.getAttribute('data-mau'), c.getAttribute('r')])).toEqual([['2', '50']])
    cleanup()
    // mục tiêu câu có, phút không: vòng 1 (50) + vòng 2 (37,5)
    const b = render(<Vong3 soCau={9} soDung={5} phutHoc={14} mucTieu={{ soCau: 16, phutHoc: null }} />).container
    expect([...b.querySelectorAll('circle.phm-v-nen')].map((c) => [c.getAttribute('data-mau'), c.getAttribute('r')])).toEqual([['1', '50'], ['2', '37.5']])
    cleanup()
    // mục tiêu phút có, câu không: vòng 2 (50) + vòng 3 (37,5)
    const c = render(<Vong3 soCau={9} soDung={5} phutHoc={14} mucTieu={{ soCau: null, phutHoc: 45 }} />).container
    expect([...c.querySelectorAll('circle.phm-v-nen')].map((x) => [x.getAttribute('data-mau'), x.getAttribute('r')])).toEqual([['2', '50'], ['3', '37.5']])
    cleanup()
    // không vòng nào ⇒ không vẽ gì
    const d = render(<Vong3 soCau={null} soDung={null} phutHoc={null} mucTieu={null} />).container
    expect(d.innerHTML).toBe('')
    expect(cacVongVe({ soCau: 0, soDung: null, phutHoc: 0, mucTieu: null })).toEqual([]) // chưa học + không mục tiêu: không có vòng trống lẻ loi
  })

  it('con chưa làm câu nào (0): vòng câu + vòng phút trống, vòng đúng trống đi cùng; KHÔNG cung nào; nhãn tay được dùng', () => {
    const { container } = ve(tq(PH_APPLE_CHUA_HOC), 'Các vòng hôm nay còn trống: con chưa học')
    expect(container.querySelectorAll('circle.phm-v-nen').length).toBe(3)
    expect(container.querySelector('.phm-v-cung')).toBeNull()
    expect(container.querySelector('.phm-vong3')!.getAttribute('aria-label')).toBe('Các vòng hôm nay còn trống: con chưa học')
  })

  it('dữ liệu lệch (đúng > làm) không làm vòng đúng "vượt": kẹp ở 100 % (không mặt nạ / chấm)', () => {
    const { container } = render(<Vong3 soCau={5} soDung={9} phutHoc={null} mucTieu={{ soCau: 5, phutHoc: null }} />)
    expect(container.querySelector('circle.phm-v-cung[data-mau="2"]')!.getAttribute('stroke-dasharray')).toBe('235.62 235.62')
    expect(container.querySelector('[data-vuot]')).toBeNull()
    expect(container.querySelector('mask')).toBeNull()
  })

  it('vượt gấp đôi: cung thứ hai đầy cả vòng nhạt, chấm ở 12 giờ; số âm / chia cho mục tiêu 0 không làm vỡ (không NaN trong SVG)', () => {
    const { container } = render(<Vong3 soCau={32} soDung={0} phutHoc={-5} mucTieu={{ soCau: 16, phutHoc: 0 }} />)
    expect(container.querySelector('circle[data-to="1"]')!.getAttribute('cx')).toBe('60.00')
    expect(container.querySelector('circle[data-to="1"]')!.getAttribute('cy')).toBe('10.00')
    expect(container.innerHTML).not.toMatch(/NaN|Infinity|undefined/)
    expect(container.querySelectorAll('circle.phm-v-nen').length).toBe(2) // vòng 1 + vòng 2 (0 đúng / 32 câu); vòng phút bỏ
  })
})

// ───────────────────────────────────────────── TongQuan
describe('TongQuan — thẻ hero', () => {
  it('đủ dữ liệu: ngày + giờ máy chủ, "Hôm nay của Khôi", ba số CÓ NHÃN như mẫu, câu tóm tắt, chip so với hôm qua', () => {
    const { container } = render(<TongQuan pm={pmOf()} now={NAY} />)
    const s = container.querySelector('section') as HTMLElement
    expect(s.id).toBe('muc-tong-quan')
    expect(s.className).toBe('phm-muc phm-muc--dau')
    expect(s.getAttribute('aria-label')).toBe('Tổng quan hôm nay')
    expect(s.querySelector('.phm-the.phm-the--dem.phm-ah')).not.toBeNull()
    expect(s.querySelector('.phm-ah__ngay')!.textContent).toBe('Thứ Hai 21/09/2026 · cập nhật lúc 21:00')
    expect(s.querySelector('h2')!.textContent).toBe('Hôm nay của Khôi')
    expect(cacO(s, '.phm-chu-giai li')).toEqual(['38/16 câuđã làm · vượt mục tiêu', '79%đúng 30 trong 38 câu', '52/45 phútđã học · vượt mục tiêu'])
    expect(cacO(s, '.phm-chu-giai li').map((_, i) => s.querySelectorAll('.phm-chu-giai li')[i]!.getAttribute('data-mau'))).toEqual(['1', '2', '3'])
    expect(s.querySelector('.phm-ah__loi')!.textContent).toBe('Hôm nay Khôi học 5 lần, lần dài nhất 21 phút, và đã đạt nhiệm vụ ngày.')
    expect(s.querySelector('.phm-ah__hq h3')!.textContent).toBe('So với hôm qua của chính con')
    expect(cacO(s, '.phm-ah__hq .phm-chip')).toEqual(['nhiều hơn 5 câu', 'đúng hơn 3 %', 'lâu hơn 8 phút'])
    expect([...s.querySelectorAll('.phm-ah__hq .phm-chip')].map((c) => c.getAttribute('data-mau'))).toEqual(['dat', 'dat', 'dat'])
    expect(s.querySelector('.phm-vong3')).not.toBeNull()
    expect(s.querySelector('.phm-dong-cam')).toBeNull() // dòng nợ do khối Bài tập về nhà dựng
    expect(container.textContent).not.toMatch(CAM_GAME)
  })

  it('bộ CŨ (thiếu mọi trường mới): không vòng mục tiêu, số thường có nhãn, tự đếm lần học từ dòng thời gian, không chip phút', () => {
    const { container } = render(<TongQuan pm={pmOf(PH_OK)} />)
    expect(container.querySelector('.phm-ah__ngay')!.textContent).toBe('Thứ Hai 21/09/2026 · cập nhật lúc 21:00')
    expect(cacO(container, '.phm-chu-giai li')).toEqual(['38câuđã làm', '79%đúng 30 trong 38 câu', '52phútđã học'])
    expect(container.querySelectorAll('.phm-vong3 circle.phm-v-nen').length).toBe(1) // chỉ vòng đúng, không vòng có mục tiêu
    expect(container.querySelector('.phm-ah__loi')!.textContent).toBe('Hôm nay Khôi học 5 lần, lần dài nhất 21 phút, và đã đạt nhiệm vụ ngày.')
    expect(cacO(container, '.phm-ah__hq .phm-chip')).toEqual(['nhiều hơn 5 câu', 'đúng hơn 3 %']) // hôm qua không có phút ⇒ không "lâu hơn N phút"
    expect(container.textContent).not.toMatch(/mục tiêu/)
  })

  it('biên: thiếu serverNow ⇒ ngày theo `now`, KHÔNG dòng "cập nhật lúc"; thiếu mọi thứ để tóm tắt / so sánh ⇒ ẩn từng phần; tên rất dài không vỡ', () => {
    const raw = nhan(PH_OK)
    delete raw.serverNow
    delete raw.homNay.dongThoiGian
    raw.homNay.tongQuan = { soCau: 4, soDung: 4, phutHoc: 3 }
    raw.hoTen = 'Nguyễn Hoàng Bảo Khánh ' + 'An'.repeat(60)
    const { container } = render(<TongQuan pm={pmOf(raw)} now={NAY} />)
    expect(container.querySelector('.phm-ah__ngay')!.textContent).toBe('Thứ Hai 21/09/2026')
    expect(container.querySelector('.phm-ah__loi')).toBeNull() // không nhiệm vụ, không đếm được lần học
    expect(container.querySelector('.phm-ah__hq')).toBeNull() // không soVoiHomQua
    const pm = pmOf(raw)
    expect(pm.hoTen.length).toBe(80) // bộ đọc cắt tên ở 80 ký tự
    expect(container.querySelector('h2')!.textContent).toBe('Hôm nay của ' + pm.hoTen.split(' ').pop())
    expect(cacO(container, '.phm-chu-giai li')).toEqual(['4câuđã làm', '100%đúng 4 trong 4 câu', '3phútđã học'])
  })

  it('tomTatHomNay: đạt / chưa đạt / chưa biết theo datNhiemVu; chưa đạt + có mục tiêu ⇒ "cần thêm N câu nữa"; đếm lần từ dòng thời gian khi máy chủ chưa trả', () => {
    const p = (sua: (r: any) => void) => {
      const r = nhan(PH_APPLE)
      sua(r)
      return pmOf(r)
    }
    expect(tomTatHomNay(p(() => {}))).toEqual({ chinh: 'Hôm nay Khôi học 5 lần, lần dài nhất 21 phút, và đã đạt nhiệm vụ ngày.', phu: '', dat: true })
    expect(tomTatHomNay(p((r) => { r.homNay.tongQuan.datNhiemVu = false; r.homNay.tongQuan.soCau = 9 }))).toEqual({ chinh: 'Hôm nay Khôi học 5 lần, lần dài nhất 21 phút.', phu: 'Con cần thêm 7 câu nữa để đạt mục tiêu ngày.', dat: false })
    // đã đủ số câu của mục tiêu mà chưa đạt nhiệm vụ ⇒ không bịa "cần thêm"
    expect(tomTatHomNay(p((r) => { r.homNay.tongQuan.datNhiemVu = false }))!.phu).toBe('Con chưa đạt nhiệm vụ ngày.')
    // datNhiemVu null ⇒ bỏ vế nhiệm vụ
    expect(tomTatHomNay(p((r) => { delete r.homNay.tongQuan.datNhiemVu }))).toEqual({ chinh: 'Hôm nay Khôi học 5 lần, lần dài nhất 21 phút.', phu: '', dat: false })
    // thiếu soLanHoc + lanDaiNhatPhut ⇒ đếm từ dongThoiGian (5 mốc, dài nhất 21 phút)
    expect(tomTatHomNay(p((r) => { delete r.homNay.tongQuan.soLanHoc; delete r.homNay.tongQuan.lanDaiNhatPhut }))!.chinh).toBe('Hôm nay Khôi học 5 lần, lần dài nhất 21 phút, và đã đạt nhiệm vụ ngày.')
    // không có gì đếm được + không nhiệm vụ ⇒ null; chỉ có nhiệm vụ ⇒ câu ngắn
    expect(tomTatHomNay(p((r) => { delete r.homNay.tongQuan.soLanHoc; delete r.homNay.tongQuan.lanDaiNhatPhut; delete r.homNay.dongThoiGian; delete r.homNay.tongQuan.datNhiemVu }))).toBeNull()
    expect(tomTatHomNay(p((r) => { delete r.homNay.tongQuan.soLanHoc; delete r.homNay.tongQuan.lanDaiNhatPhut; delete r.homNay.dongThoiGian }))!.chinh).toBe('Hôm nay Khôi đã đạt nhiệm vụ ngày.')
    // số lần 0 / lần dài nhất 0 ⇒ không viết "học 0 lần"
    expect(tomTatHomNay(p((r) => { r.homNay.tongQuan.soLanHoc = 0; delete r.homNay.dongThoiGian }))!.chinh).toBe('Hôm nay Khôi đã đạt nhiệm vụ ngày.')
  })

  it('chưa đạt nhiệm vụ mà đã đủ số câu của mục tiêu ⇒ KHÔNG bịa "cần thêm 0 câu"; thiếu số câu (khối chỉ có phút + nhiệm vụ) ⇒ không viết "0 câu" giả', () => {
    const raw = nhan(PH_APPLE)
    raw.homNay.tongQuan.soCau = 16
    raw.homNay.tongQuan.datNhiemVu = false
    expect(tomTatHomNay(pmOf(raw))!.phu).toBe('Con chưa đạt nhiệm vụ ngày.')
    const r2 = nhan(PH_APPLE)
    r2.homNay.tongQuan = { phutHoc: 20, datNhiemVu: true }
    const { container } = render(<TongQuan pm={pmOf(r2)} />)
    expect(cacO(container, '.phm-chu-giai li')).toEqual(['20phútđã học'])
    expect(container.textContent).not.toMatch(/câu đã làm|0 câu|\b0\/16/)
  })

  it('cảnh chưa học KHÔNG có chip so với hôm qua dù máy chủ lỡ gửi soVoiHomQua', () => {
    const raw = nhan(PH_APPLE_CHUA_HOC)
    raw.homNay.tongQuan.soVoiHomQua = { soCau: 7, tiLeDung: 0.7, phutHoc: 9 }
    const { container } = render(<TongQuan pm={pmOf(raw)} />)
    expect(container.querySelector('.phm-ah__hq')).toBeNull()
    expect(container.querySelector('.phm-chip')).toBeNull()
  })

  it('dữ liệu thưa (THUA): chưa đạt nhiệm vụ ⇒ dòng nhỏ; chip "gần bằng" khi đúng chênh ≤ 2 điểm; mũi tên xuống + không tô xanh khi ít hơn', () => {
    const { container } = render(<TongQuan pm={pmOf(PH_APPLE_THUA)} />)
    expect(container.querySelector('.phm-ah__loi small')!.textContent).toBe('Con chưa đạt nhiệm vụ ngày.')
    expect(container.querySelector('.phm-ah__loi')!.getAttribute('data-mau')).toBe('nhan')
    const t = { soCau: 9, soDung: 5, phutHoc: 11 }
    expect(soSanhHomQua({ ...t, soVoiHomQua: { soCau: 7, tiLeDung: 0.55, phutHoc: 9 } })).toEqual([
      { chu: 'nhiều hơn 2 câu', huong: 'len', mau: 'dat' },
      { chu: 'câu đúng gần bằng hôm qua', huong: 'bang' },
      { chu: 'lâu hơn 2 phút', huong: 'len', mau: 'dat' },
    ])
    expect(soSanhHomQua({ ...t, soVoiHomQua: { soCau: 12, tiLeDung: 0.8, phutHoc: 20 } })).toEqual([
      { chu: 'ít hơn 3 câu', huong: 'xuong' },
      { chu: 'đúng kém 24 %', huong: 'xuong' },
      { chu: 'ngắn hơn 9 phút', huong: 'xuong' },
    ])
    expect(soSanhHomQua({ ...t, soCau: 9, soDung: 9, soVoiHomQua: { soCau: 9, tiLeDung: 1, phutHoc: 11 } })).toEqual([
      { chu: 'số câu bằng hôm qua', huong: 'bang' },
      { chu: 'câu đúng bằng hôm qua', huong: 'bang' },
      { chu: 'thời gian học bằng hôm qua', huong: 'bang' },
    ])
    // hôm qua không học câu nào ⇒ không so tỉ lệ đúng; không soVoiHomQua ⇒ không chip nào
    expect(soSanhHomQua({ ...t, soVoiHomQua: { soCau: 0, tiLeDung: 0, phutHoc: null } }).map((c) => c.chu)).toEqual(['nhiều hơn 9 câu'])
    expect(soSanhHomQua({ ...t, soVoiHomQua: null })).toEqual([])
  })

  it('chuGiaiVong: có / thiếu mục tiêu, 0 câu ⇒ "—", đúng > làm (dữ liệu lệch) không vượt 100 %', () => {
    const t = { soCau: 16, soDung: 8, phutHoc: 45, mucTieu: { soCau: 16, phutHoc: 45 } }
    expect(chuGiaiVong(t).map((d) => `${d.so}|${d.don}|${d.nhan}`)).toEqual(['16|/16 câu|đã làm · đạt mục tiêu', '50|%|đúng 8 trong 16 câu', '45|/45 phút|đã học · đạt mục tiêu'])
    expect(chuGiaiVong({ soCau: 0, soDung: null, phutHoc: 0, mucTieu: { soCau: 16, phutHoc: 45 } }).map((d) => `${d.so}|${d.don}|${d.nhan}`)).toEqual(['0|/16 câu|đã làm · mục tiêu 16 câu', '—||câu đúng · chưa có câu nào', '0|/45 phút|đã học · mục tiêu 45 phút'])
    expect(chuGiaiVong({ soCau: 5, soDung: 9, phutHoc: null, mucTieu: null }).map((d) => `${d.so}|${d.don}|${d.nhan}`)).toEqual(['5|câu|đã làm', '100|%|đúng 5 trong 5 câu'])
    expect(chuGiaiVong({ soCau: null, soDung: null, phutHoc: null, mucTieu: null })).toEqual([])
  })

  it('CHƯA HỌC: thẻ riêng đúng mẫu ("Hôm nay con chưa học", số 0 + nhãn, vòng trống, lần học gần nhất, gợi ý giao bài); không chip so với hôm qua', () => {
    const pm = pmOf(PH_APPLE_CHUA_HOC)
    expect(coTongQuan(pm)).toBe(true)
    const { container } = render(<TongQuan pm={pm} now={NAY} />)
    expect(container.querySelector('h2')!.textContent).toBe('Hôm nay của Khôi')
    expect(cacO(container, '.phm-chu-giai li')).toEqual(['0/16 câuđã làm · mục tiêu 16 câu', '—câu đúng · chưa có câu nào', '0/20 phútđã học · mục tiêu 20 phút'])
    expect(container.querySelectorAll('.phm-chu-giai li[data-rong]').length).toBe(3)
    expect(container.querySelector('.phm-vong3')!.getAttribute('aria-label')).toBe('Các vòng hôm nay còn trống: con chưa học')
    expect(container.querySelectorAll('.phm-vong3 circle.phm-v-nen').length).toBe(3)
    expect(container.querySelector('.phm-vong3 .phm-v-cung')).toBeNull()
    const loi = container.querySelector('.phm-ah__loi') as HTMLElement
    expect(loi.getAttribute('data-mau')).toBe('nhan')
    expect(loi.querySelector('p')!.firstChild!.textContent).toBe('Hôm nay con chưa học')
    expect(loi.querySelector('small')!.textContent).toBe('Lần học gần nhất: Chủ nhật 20/09/2026. Anh/chị có thể giao cho con một bài ngắn để con bắt đầu.')
    expect(container.querySelector('.phm-ah__hq')).toBeNull()
    expect(container.textContent).not.toMatch(/nhiệm vụ ngày|so với hôm qua/i)
    expect(container.textContent).not.toMatch(CAM_GAME)
  })

  it('chưa học, biên: hết lượt giao ⇒ không gợi ý giao bài; không thấy lần học nào trong 14 ngày ⇒ không câu "Lần học gần nhất"; không khối tổng quan ⇒ chỉ lời, không số / vòng', () => {
    const a = nhan(PH_APPLE_CHUA_HOC)
    a.giaoThem = { conLaiHomNay: 0 }
    const { container } = render(<TongQuan pm={pmOf(a)} />)
    expect(container.querySelector('.phm-ah__loi small')!.textContent).toBe('Lần học gần nhất: Chủ nhật 20/09/2026.')
    cleanup()
    const b = nhan(PH_APPLE_CHUA_HOC)
    b.nhipHoc.ngay = []
    b.giaoThem = { conLaiHomNay: 0 }
    const r2 = render(<TongQuan pm={pmOf(b)} />).container
    expect(r2.querySelector('.phm-ah__loi small')).toBeNull()
    expect(r2.querySelector('.phm-ah__loi')!.textContent).toBe('Hôm nay con chưa học')
    cleanup()
    const pmRong = pmOf(PH_TRONG) // máy chủ không gửi khối hôm nay
    expect(coTongQuan(pmRong)).toBe(true)
    const r3 = render(<TongQuan pm={pmRong} now={NAY} />).container
    expect(r3.querySelector('.phm-ah__than')).toBeNull()
    expect(r3.querySelector('.phm-vong3')).toBeNull()
    expect(r3.querySelector('.phm-ah__loi')!.textContent).toContain('Hôm nay con chưa học')
  })

  it('coTongQuan: có khối tổng quan ⇒ true; không khối nhưng đã có câu ⇒ false (không dựng thẻ rỗng)', () => {
    expect(coTongQuan(pmOf())).toBe(true)
    const r = nhan(PH_OK)
    delete r.homNay.tongQuan
    expect(coTongQuan(pmOf(r))).toBe(false)
    expect(render(<TongQuan pm={pmOf(r)} />).container.innerHTML).toBe('')
  })
})

// ───────────────────────────────────────────── DieuMung
describe('DieuMung — điều đáng mừng', () => {
  it('đủ dữ liệu: ba dòng đúng chữ mẫu — làm đúng lại (dòng phụ + 4 ô tích), lên bậc (tên dạng), học đều (từ ngày + 7 chấm T3…T2)', () => {
    const { container } = render(<DieuMung pm={pmOf()} />)
    const s = container.querySelector('section') as HTMLElement
    expect(s.id).toBe('muc-mung')
    expect(s.className).toBe('phm-muc phm-muc--sat')
    expect(s.getAttribute('aria-label')).toBe('Điều đáng mừng hôm nay')
    expect(s.querySelector('.phm-nhan-muc')!.textContent).toBe('Điều đáng mừng hôm nay')
    const dong = [...s.querySelectorAll('.phm-mung > li')]
    expect(dong.length).toBe(3)
    expect(dong.map((l) => l.querySelector('h3')!.textContent)).toEqual(['Con làm đúng lại 4 câu từng sai', 'Con lên bậc ở 2 dạng', 'Con học đều ngày thứ 6 liên tiếp'])
    expect(dong[0]!.querySelector('p')!.textContent).toBe('trong 6 câu ôn lại lúc 06:40 sáng nay')
    expect(dong[0]!.querySelectorAll('.phm-o4 i').length).toBe(4)
    expect(dong[0]!.querySelector('.phm-o4')!.getAttribute('aria-hidden')).toBe('true')
    expect(cacO(dong[1]!, '.phm-len-bac > li > span:first-child')).toEqual(['Phản ứng ester hoá', 'Tính chất vật lí của lipid'])
    expect(dong[2]!.querySelector('p')!.textContent).toBe('từ Thứ Tư 16/09 đến hôm nay')
    expect(cacO(dong[2]!, '.phm-7 li')).toEqual(['T3', 'T4', 'T5', 'T6', 'T7', 'CN', 'T2'])
    expect([...dong[2]!.querySelectorAll('.phm-7 li')].map((l) => l.hasAttribute('data-nghi'))).toEqual([true, false, false, false, false, false, false]) // 15/09 con không học
    expect(dong.map((l) => l.querySelector('.phm-o-bt')!.getAttribute('data-mau'))).toEqual(['dat', 'dat', 'dat'])
    expect(s.textContent).not.toMatch(CAM_GAME)
  })

  it('lên bậc: "Biết → Hiểu" lấy từ vuaLenBac khớp tên (không phân biệt hoa thường); không khớp ⇒ chỉ tên + "lên bậc"; thiếu `dang` ⇒ dùng manhYeu.lenBacHomNay', () => {
    const raw = nhan(PH_APPLE)
    raw.vuaLenBac = [
      { ma: 'D1', ten: 'phản ứng ESTER hoá', tu: 0, den: 1, ngay: '2026-09-21' },
      { ma: 'D2', ten: 'Danh pháp ester', tu: 1, den: 2, ngay: '2026-09-20' },
    ]
    const pm = pmOf(raw)
    const d = pm.dieuDangMung!.find((x) => x.loai === 'len_bac')!
    expect(dongLenBac(pm, d)).toEqual([
      { ten: 'Phản ứng ester hoá', tu: 'Biết', den: 'Hiểu' },
      { ten: 'Tính chất vật lí của lipid', tu: null, den: null },
    ])
    const { container } = render(<DieuMung pm={pm} />)
    const ban = [...container.querySelectorAll('.phm-len-bac .phm-bac-len')]
    expect(ban.map((b) => b.textContent!.replace(/\s+/g, ' ').trim())).toEqual(['Biết Hiểu', 'lên bậc'])
    expect(ban[0]!.querySelector('b')!.textContent).toBe('Hiểu')
    // bậc ngoài 0/1/2 ⇒ bỏ bậc, không "undefined"
    raw.vuaLenBac[0].den = 7
    const pm2 = pmOf(raw)
    expect(dongLenBac(pm2, pm2.dieuDangMung!.find((x) => x.loai === 'len_bac')!)[0]).toEqual({ ten: 'Phản ứng ester hoá', tu: null, den: null })
    // thiếu `dang` ⇒ tên từ manhYeu.lenBacHomNay (chỉ tên, không bậc)
    const r3 = nhan(PH_APPLE)
    r3.homNay.dieuDangMung = [{ loai: 'len_bac', so: 1 }]
    r3.manhYeu.lenBacHomNay = [{ tenDang: 'Xà phòng hoá chất béo' }]
    const pm3 = pmOf(r3)
    expect(dongLenBac(pm3, pm3.dieuDangMung![0]!)).toEqual([{ ten: 'Xà phòng hoá chất béo', tu: null, den: null }])
    // không tên nào ⇒ vẫn có dòng "Con lên bậc ở N dạng", không danh sách
    const r4 = nhan(PH_APPLE)
    r4.homNay.dieuDangMung = [{ loai: 'len_bac', so: 2 }]
    delete r4.manhYeu
    const c4 = render(<DieuMung pm={pmOf(r4)} />).container
    expect(c4.querySelector('h3')!.textContent).toBe('Con lên bậc ở 2 dạng')
    expect(c4.querySelector('.phm-len-bac')).toBeNull()
  })

  it('theo thứ tự máy chủ; dòng chỉ có số thật: chuỗi < 2 ngày bị bỏ, số 0 / null bị bỏ; không dòng nào hợp lệ ⇒ ẩn CẢ THẺ (coDieuMung false)', () => {
    const { container } = render(<DieuMung pm={pmOf(PH_APPLE_THUA)} />)
    expect([...container.querySelectorAll('.phm-mung > li h3')].map((h) => h.textContent)).toEqual(['Con học đều ngày thứ 4 liên tiếp', 'Con làm đúng lại 1 câu từng sai'])
    expect(container.querySelector('.phm-mung > li:nth-child(2) p')!.textContent).toBe('câu ôn lại lúc 19:20')
    expect(cacO(container, '.phm-7 li')).toEqual(['T3', 'T4', 'T5', 'T6', 'T7', 'CN', 'T2'])
    expect([...container.querySelectorAll('.phm-7 li')].map((l) => l.hasAttribute('data-nghi'))).toEqual([true, true, true, false, false, false, false])
    cleanup()
    const raw = nhan(PH_APPLE)
    raw.homNay.dieuDangMung = [{ loai: 'chuoi', so: 1 }, { loai: 'dung_lai', so: 0 }, { loai: 'len_bac' }]
    expect(coDieuMung(pmOf(raw))).toBe(false)
    expect(render(<DieuMung pm={pmOf(raw)} />).container.innerHTML).toBe('')
    delete raw.homNay.dieuDangMung
    expect(coDieuMung(pmOf(raw))).toBe(false)
    expect(coDieuMung(pmOf(PH_OK))).toBe(false) // bộ cũ không có trường
    expect(render(<DieuMung pm={pmOf(PH_OK)} />).container.innerHTML).toBe('')
  })

  it('PhMoi dựng tay có 4 dòng ⇒ vẫn chỉ hiện tối đa 3 (không dựa vào bộ đọc)', () => {
    const pm = pmOf()
    pm.dieuDangMung = [...pm.dieuDangMung!, { loai: 'dung_lai', so: 2, chiTiet: '', dang: [] }]
    expect(pm.dieuDangMung.length).toBe(4)
    expect(render(<DieuMung pm={pm} />).container.querySelectorAll('.phm-mung > li').length).toBe(3)
  })

  it('biên: quá 6 câu đúng lại ⇒ tối đa 6 ô tích; thiếu nhịp học ⇒ bỏ hàng chấm nhưng giữ chữ; dòng phụ chỉ có khi máy chủ gửi', () => {
    const raw = nhan(PH_APPLE)
    raw.homNay.dieuDangMung = [{ loai: 'dung_lai', so: 11 }, { loai: 'chuoi', so: 6 }]
    delete raw.nhipHoc
    const { container } = render(<DieuMung pm={pmOf(raw)} />)
    expect(container.querySelectorAll('.phm-o4 i').length).toBe(6)
    expect(container.querySelector('.phm-mung > li:first-child p')).toBeNull()
    expect(container.querySelector('.phm-7')).toBeNull()
    expect(container.querySelector('.phm-mung > li:nth-child(2) p')!.textContent).toBe('từ Thứ Tư 16/09 đến hôm nay')
    // chỉ tối đa 3 dòng dù máy chủ gửi thừa
    const r2 = nhan(PH_APPLE)
    r2.homNay.dieuDangMung = [{ loai: 'dung_lai', so: 1 }, { loai: 'len_bac', so: 1 }, { loai: 'chuoi', so: 3 }, { loai: 'chuoi', so: 9 }]
    cleanup()
    expect(render(<DieuMung pm={pmOf(r2)} />).container.querySelectorAll('.phm-mung > li').length).toBe(3)
  })
})

// ───────────────────────────────────────────── AiLam
describe('AiLam — Thầy và A.I đã làm gì', () => {
  it('đủ dữ liệu: tiêu đề + 5 việc đúng chữ (số THẬT, dòng phụ từ máy chủ) + dòng cuối', () => {
    const { container } = render(<AiLam pm={pmOf()} />)
    const s = container.querySelector('section') as HTMLElement
    expect(s.id).toBe('muc-ai-lam')
    expect(s.className).toBe('phm-muc phm-muc--sat')
    expect(s.getAttribute('aria-label')).toBe('Thầy và A.I Đỗ Đại Học đã làm gì cho con hôm nay')
    expect(s.querySelector('.phm-nhan-muc')!.textContent).toBe('A.I Đỗ Đại Học · hôm nay')
    expect(s.querySelector('h2.phm-ten-the')!.textContent).toBe('Thầy và A.I Đỗ Đại Học đã làm gì cho con hôm nay')
    const dong = [...s.querySelectorAll('.phm-lam > li')]
    expect(dong.map((l) => l.querySelector('h3')!.textContent)).toEqual([
      'Chọn riêng 23 câu hợp với sức của con',
      'Xếp 7 câu con từng sai vào lịch ôn ngày mai',
      'Soạn một thử thách riêng 5 câu lúc 19:30',
      'Nhắc con trước hạn nộp bài tập về nhà',
      'Chấm và giải thích 38 câu ngay khi con làm xong',
    ])
    expect(dong.map((l) => l.querySelector('p')?.textContent ?? null)).toEqual(['6 câu ôn lại đến lịch, 9 câu luyện dạng con còn vấp, 5 câu ôn thi, 3 câu dành riêng trong bài tập về nhà', null, null, 'đã nhắc lúc 17:00', null])
    expect(dong.every((l) => l.querySelector('.phm-tich svg') !== null)).toBe(true)
    expect(s.querySelector('.phm-lam__cuoi')!.textContent).toBe('Anh/chị không cần làm gì thêm — chỉ cần động viên con học đều.')
    expect(s.textContent).not.toMatch(CAM_GAME)
  })

  it('cảnh CHƯA HỌC dùng aiDaChuanBi: tiêu đề "đã chuẩn bị", "Chọn sẵn", đúng thứ tự máy chủ, dòng cuối chỉ khi có chọn sẵn câu', () => {
    const pm = pmOf(PH_APPLE_CHUA_HOC)
    const { container } = render(<AiLam pm={pm} />)
    expect(container.querySelector('h2')!.textContent).toBe('A.I Đỗ Đại Học đã chuẩn bị gì cho con hôm nay')
    expect(container.querySelector('section')!.getAttribute('aria-label')).toBe('A.I Đỗ Đại Học đã chuẩn bị gì cho con hôm nay')
    expect(cacO(container, '.phm-lam > li h3')).toEqual(['Xếp 2 câu con từng sai vào lịch ôn ngày mai', 'Chọn sẵn 6 câu hợp với sức của con'])
    expect(container.querySelectorAll('.phm-lam > li')[1]!.querySelector('p')!.textContent).toBe('2 câu ôn lại đến lịch, 4 câu luyện dạng con còn vấp')
    expect(container.querySelector('.phm-lam__cuoi')!.textContent).toBe('Mọi thứ đã sẵn. Con chỉ cần mở app là có bài vừa sức để làm ngay.')
    expect(container.textContent).not.toMatch(/Thầy và A\.I|ngay khi con làm xong|động viên/)
    cleanup()
    // không có việc "chọn sẵn" ⇒ không hứa "có bài vừa sức"
    const raw = nhan(PH_APPLE_CHUA_HOC)
    raw.homNay.aiDaChuanBi = [{ loai: 'xep_on', so: 2 }]
    const c2 = render(<AiLam pm={pmOf(raw)} />).container
    expect(c2.querySelector('.phm-lam__cuoi')).toBeNull()
    expect(c2.textContent).not.toMatch(/bài vừa sức/)
  })

  it('cả hai mảng vắng ⇒ ẩn cả thẻ; chỉ có aiDaChuanBi mà con ĐÃ học ⇒ ẩn; chưa học mà chỉ có aiDaLam ⇒ vẫn hiện việc thật đó', () => {
    expect(coAiLam(pmOf(PH_OK))).toBe(false)
    expect(render(<AiLam pm={pmOf(PH_OK)} />).container.innerHTML).toBe('')
    cleanup()
    const daHoc = nhan(PH_APPLE)
    delete daHoc.homNay.aiDaLam
    daHoc.homNay.aiDaChuanBi = [{ loai: 'chon_rieng', so: 3 }]
    expect(coAiLam(pmOf(daHoc))).toBe(false)
    const chua = nhan(PH_APPLE_CHUA_HOC)
    delete chua.homNay.aiDaChuanBi
    chua.homNay.aiDaLam = [{ loai: 'xep_on', so: 4 }]
    const c = render(<AiLam pm={pmOf(chua)} />).container
    expect(c.querySelector('h2')!.textContent).toBe('Thầy và A.I Đỗ Đại Học đã làm gì cho con hôm nay')
    expect(cacO(c, '.phm-lam > li h3')).toEqual(['Xếp 4 câu con từng sai vào lịch ôn ngày mai'])
  })

  it('biên: thử thách không có giờ ⇒ không "lúc"; dòng phụ trống ⇒ không thẻ <p>; nhắc: chỉ 1 lần / nhiều lần / thiếu giờ; mã nguồn lạ trong theoNguon bị bỏ', () => {
    const raw = nhan(PH_APPLE)
    raw.homNay.aiDaLam = [{ loai: 'soan_thu_thach', so: 5 }, { loai: 'chon_rieng', so: 2, chiTiet: { on_lai: 1, mo_la: 1, than_thu: 0 } }, { loai: 'cham', so: 1 }]
    const { container } = render(<AiLam pm={pmOf(raw)} />)
    const dong = [...container.querySelectorAll('.phm-lam > li')]
    expect(dong[0]!.querySelector('h3')!.textContent).toBe('Soạn một thử thách riêng 5 câu')
    expect(dong[0]!.querySelector('p')).toBeNull()
    expect(dong[1]!.querySelector('p')!.textContent).toBe('1 câu ôn lại đến lịch')
    expect(dong[2]!.querySelector('h3')!.textContent).toBe('Chấm và giải thích 1 câu ngay khi con làm xong')
    expect(phuChonRieng({ theoNguon: [{ ma: 'xyz', so: 4 }], chiTiet: '' })).toBe('')
    expect(phuChonRieng({ theoNguon: [], chiTiet: 'chữ của máy chủ' })).toBe('chữ của máy chủ')
    expect(phuNhac({ so: 1, luc: '17:00', chiTiet: '' })).toBe('đã nhắc lúc 17:00')
    expect(phuNhac({ so: 3, luc: '17:00', chiTiet: '' })).toBe('đã nhắc 3 lần · gần nhất lúc 17:00')
    expect(phuNhac({ so: 3, luc: '', chiTiet: '' })).toBe('đã nhắc 3 lần')
    expect(phuNhac({ so: 1, luc: '', chiTiet: '' })).toBe('đã nhắc')
    expect(phuNhac({ so: null, luc: '', chiTiet: '' })).toBe('')
    expect(phuNhac({ so: 1, luc: '17:00', chiTiet: 'con làm chặng 2' })).toBe('đã nhắc lúc 17:00 · con làm chặng 2')
    expect(phuNhac({ so: 2, luc: '2026-09-21T10:00:00.000Z', chiTiet: '' })).toBe('đã nhắc 2 lần · gần nhất lúc 17:00') // ISO ⇒ giờ VN
  })
})

// ───────────────────────────────────────────── DauTrang
describe('DauTrang — thanh trên, Large Title, mục lục', () => {
  const MUC = [{ id: 'muc-a', ten: 'Tổng quan' }, { id: 'muc-b', ten: 'Dòng thời gian' }, { id: 'muc-c', ten: 'Từng câu (38)' }]
  const dung = (p: Partial<React.ComponentProps<typeof DauTrang>> = {}) =>
    render(
      <div className="phm-goc" data-testid="goc">
        <DauTrang ten="Nguyễn Minh Khôi" lop="12 - Tinh Hoa" muc={MUC} onVe={() => {}} {...p} />
        {MUC.map((m) => (
          <section key={m.id} id={m.id} />
        ))}
      </div>,
    )
  const chip = (c: HTMLElement) => [...c.querySelectorAll('.phm-muc-luc a')] as HTMLAnchorElement[]
  const dangXem = (c: HTMLElement) => chip(c).filter((a) => a.hasAttribute('aria-current')).map((a) => a.textContent)
  const dat = (y: number) => Object.defineProperty(window, 'scrollY', { value: y, configurable: true })

  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('chữ đúng mẫu: nút "Hôm nay" (≥ nhãn đọc màn hình), tiêu đề nhỏ trên thanh, Large Title h1, "Tên · Lớp …", ba chip mục lục', () => {
    const onVe = vi.fn()
    const { container } = dung({ onVe })
    const nut = container.querySelector('header .phm-lui') as HTMLButtonElement
    expect(nut.tagName).toBe('BUTTON')
    expect(nut.getAttribute('type')).toBe('button')
    expect(nut.textContent).toBe('Hôm nay')
    expect(nut.getAttribute('aria-label')).toBe('Quay lại màn Hôm nay')
    fireEvent.click(nut)
    expect(onVe).toHaveBeenCalledTimes(1)
    expect(cacO(container, '.phm-tren__giua span')).toEqual(['Mọi thứ về con', 'Nguyễn Minh Khôi'])
    expect(container.querySelector('.phm-tren__giua')!.getAttribute('aria-hidden')).toBe('true')
    expect(container.querySelector('h1')!.textContent).toBe('Mọi thứ về con')
    expect(container.querySelector('.phm-tieu-de p')!.textContent).toBe('Nguyễn Minh Khôi · Lớp 12 - Tinh Hoa')
    expect(container.querySelector('.phm-tieu-de p b')!.textContent).toBe('Nguyễn Minh Khôi')
    const nav = container.querySelector('nav.phm-muc-luc') as HTMLElement
    expect(nav.getAttribute('aria-label')).toBe('Các mục của bảng')
    expect(nav.querySelector('.phm-muc-luc__khung > ul')).not.toBeNull()
    expect(chip(container).map((a) => [a.textContent, a.getAttribute('href')])).toEqual([['Tổng quan', '#muc-a'], ['Dòng thời gian', '#muc-b'], ['Từng câu (38)', '#muc-c']])
    expect(dangXem(container)).toEqual(['Tổng quan'])
    expect(chip(container)[0]!.getAttribute('aria-current')).toBe('true')
    expect(container.textContent).not.toMatch(CAM_GAME)
  })

  it('biên: lớp rỗng ⇒ chỉ tên; "Lớp 12" không bị nhân đôi chữ "Lớp"; tên rất dài không lỗi; không mục ⇒ không thanh mục lục', () => {
    expect(dung({ lop: '' }).container.querySelector('.phm-tieu-de p')!.textContent).toBe('Nguyễn Minh Khôi')
    cleanup()
    expect(dung({ lop: 'Lớp 12 - Tinh Hoa' }).container.querySelector('.phm-tieu-de p')!.textContent).toBe('Nguyễn Minh Khôi · Lớp 12 - Tinh Hoa')
    cleanup()
    const dai = 'Nguyễn Hoàng Bảo Khánh ' + 'An'.repeat(80)
    expect(dung({ ten: dai }).container.querySelector('.phm-tieu-de p b')!.textContent).toBe(dai)
    cleanup()
    const c = dung({ muc: [] }).container
    expect(c.querySelector('.phm-muc-luc')).toBeNull()
    expect(c.querySelector('h1')).not.toBeNull()
    cleanup()
    expect(dung({ ten: '', lop: '' }).container.querySelector('.phm-tieu-de p')).toBeNull()
  })

  it('cuộn: `data-cuon` khi đã cuộn, `data-thu` khi Large Title khuất — đặt lên `.phm-goc`, gỡ khi trở lại đầu trang và khi tháo', () => {
    const { container, unmount } = dung()
    const goc = container.querySelector('.phm-goc') as HTMLElement
    const h1 = container.querySelector('h1') as HTMLElement
    let day = 200
    h1.getBoundingClientRect = () => ({ bottom: day, top: day - 40, height: 40, left: 0, right: 0, width: 0, x: 0, y: 0, toJSON: () => ({}) })
    act(() => void window.dispatchEvent(new Event('scroll')))
    expect(goc.hasAttribute('data-cuon')).toBe(false)
    expect(goc.hasAttribute('data-thu')).toBe(false)
    dat(3)
    act(() => void window.dispatchEvent(new Event('scroll')))
    expect(goc.hasAttribute('data-cuon')).toBe(false) // ≤ 6 px chưa tính là đã cuộn
    dat(120)
    day = -10
    act(() => void window.dispatchEvent(new Event('scroll')))
    expect(goc.hasAttribute('data-cuon')).toBe(true)
    expect(goc.hasAttribute('data-thu')).toBe(true)
    dat(0)
    day = 200
    act(() => void window.dispatchEvent(new Event('scroll')))
    expect(goc.hasAttribute('data-cuon')).toBe(false)
    expect(goc.hasAttribute('data-thu')).toBe(false)
    dat(120)
    day = -10
    act(() => void window.dispatchEvent(new Event('scroll')))
    expect(goc.hasAttribute('data-thu')).toBe(true)
    unmount()
    expect(goc.hasAttribute('data-cuon')).toBe(false)
    expect(goc.hasAttribute('data-thu')).toBe(false)
    // sau khi tháo, cuộn nữa không đụng gì (đã gỡ listener) — và không lỗi
    act(() => void window.dispatchEvent(new Event('scroll')))
    expect(goc.hasAttribute('data-thu')).toBe(false)
  })

  it('bấm chip: aria-current chuyển ngay, cuộn mượt tới #id, focus vào mục (tabindex -1), không đổi địa chỉ; giữ Ctrl/Cmd thì để trình duyệt tự xử lý', () => {
    const { container } = dung()
    const [a, b] = chip(container)
    const dich = document.getElementById('muc-b') as HTMLElement
    const cuon = vi.spyOn(dich, 'scrollIntoView')
    const xong = fireEvent.click(b!)
    expect(xong).toBe(false) // đã preventDefault ⇒ không nhảy hash
    expect(dangXem(container)).toEqual(['Dòng thời gian'])
    expect(cuon).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
    expect(dich.getAttribute('tabindex')).toBe('-1')
    expect(document.activeElement).toBe(dich)
    expect(window.location.hash).toBe('')
    expect(fireEvent.click(a!, { ctrlKey: true })).toBe(true)
    expect(dangXem(container)).toEqual(['Dòng thời gian']) // Ctrl+bấm không đổi mục
  })

  it('bấm chip khi hệ thống báo GIẢM CHUYỂN ĐỘNG ⇒ nhảy thẳng (behavior auto)', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} }))
    const { container } = dung()
    const dich = document.getElementById('muc-c') as HTMLElement
    const cuon = vi.spyOn(dich, 'scrollIntoView')
    fireEvent.click(chip(container)[2]!)
    expect(cuon).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' })
  })

  it('bấm chip khi mục không còn trên trang ⇒ không lỗi', () => {
    const { container } = dung({ muc: [...MUC, { id: 'muc-khong-co', ten: 'Mất' }] })
    expect(() => fireEvent.click(chip(container)[3]!)).not.toThrow()
  })

  describe('scrollspy (IntersectionObserver)', () => {
    let goi: (es: unknown[]) => void
    let quanSat: Element[]
    let ngat: ReturnType<typeof vi.fn>
    const vao = (id: string, top = 0) => ({ isIntersecting: true, target: document.getElementById(id), boundingClientRect: { top } })
    beforeEach(() => {
      quanSat = []
      ngat = vi.fn()
      class GiaIO {
        constructor(cb: (es: unknown[]) => void) {
          goi = cb
        }
        observe(e: Element) {
          quanSat.push(e)
        }
        disconnect() {
          ngat()
        }
      }
      vi.stubGlobal('IntersectionObserver', GiaIO)
    })

    it('quan sát đúng các mục có trên trang; cuộn tới mục nào chip mục đó sáng; ở đầu trang (scrollY < 8) thì giữ chip đầu; tháo ⇒ ngắt quan sát', () => {
      const { container, unmount } = dung()
      expect(quanSat.map((e) => e.id)).toEqual(['muc-a', 'muc-b', 'muc-c'])
      dat(0)
      act(() => goi([vao('muc-b')]))
      expect(dangXem(container)).toEqual(['Tổng quan'])
      dat(300)
      act(() => goi([vao('muc-b')]))
      expect(dangXem(container)).toEqual(['Dòng thời gian'])
      act(() => goi([{ isIntersecting: false, target: document.getElementById('muc-c'), boundingClientRect: { top: 0 } }]))
      expect(dangXem(container)).toEqual(['Dòng thời gian']) // mục vừa RỜI dải không đổi chip
      act(() => goi([vao('muc-c', 90), vao('muc-a', 10)]))
      expect(dangXem(container)).toEqual(['Tổng quan']) // nhiều mục cùng vào dải: lấy mục trên cùng
      unmount()
      expect(ngat).toHaveBeenCalled()
    })

    it('vừa bấm chip: bỏ qua scrollspy trong lúc cuộn mượt (không nhảy qua mục giữa đường), hết cửa sổ khoá thì theo lại', () => {
      let gio = 1_000_000
      vi.spyOn(Date, 'now').mockImplementation(() => gio)
      const { container } = dung()
      dat(300)
      fireEvent.click(chip(container)[2]!)
      act(() => goi([vao('muc-b')]))
      expect(dangXem(container)).toEqual(['Từng câu (38)'])
      gio += 1500
      act(() => goi([vao('muc-b')]))
      expect(dangXem(container)).toEqual(['Dòng thời gian'])
    })

    it('chip đang xem được cuộn vào tầm nhìn của khung ngang (nếu trình duyệt có scrollTo)', () => {
      const scrollTo = vi.fn()
      HTMLElement.prototype.scrollTo = scrollTo as never
      const { container } = dung()
      dat(300)
      scrollTo.mockClear()
      act(() => goi([vao('muc-c')]))
      expect(scrollTo).toHaveBeenCalledTimes(1)
      expect(scrollTo.mock.calls[0]![0]).toMatchObject({ behavior: 'auto' })
      expect(dangXem(container)).toEqual(['Từng câu (38)'])
      delete (HTMLElement.prototype as { scrollTo?: unknown }).scrollTo
    })

    it('danh sách mục đổi (mục mới xuất hiện) ⇒ quan sát lại; chip đang xem không còn trong danh sách ⇒ lùi về chip đầu', () => {
      const { container, rerender } = dung()
      dat(300)
      act(() => goi([vao('muc-c')]))
      expect(dangXem(container)).toEqual(['Từng câu (38)'])
      rerender(
        <div className="phm-goc">
          <DauTrang ten="Khôi" lop="" muc={MUC.slice(0, 2)} onVe={() => {}} />
          {MUC.map((m) => (
            <section key={m.id} id={m.id} />
          ))}
        </div>,
      )
      expect(dangXem(container)).toEqual(['Tổng quan'])
      expect(ngat).toHaveBeenCalled()
    })
  })

  it('máy KHÔNG có IntersectionObserver (jsdom mặc định): dựng bình thường, không lỗi', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    expect(() => dung()).not.toThrow()
  })

  it('đứng ngoài `.phm-goc` (vỏ chưa bọc) ⇒ không đặt thuộc tính đâu cả, không lỗi', () => {
    const { container } = render(<DauTrang ten="Khôi" lop="" muc={MUC} onVe={() => {}} />)
    dat(200)
    expect(() => act(() => void window.dispatchEvent(new Event('scroll')))).not.toThrow()
    expect(container.querySelector('[data-cuon],[data-thu]')).toBeNull()
  })
})

// ───────────────────────────────────────────── kiểm tệp nguồn (luật cứng)
describe('luật cứng của phần A (đọc tệp nguồn)', () => {
  it('KHÔNG màu thô #hex, KHÔNG CSS `order`, không chữ game, không mã nội bộ trên màn', () => {
    for (const t of NAM_TEP) {
      const s = doc(t)
      expect(s.match(/#[0-9a-fA-F]{3,8}\b/g), `${t}: mã màu thô`).toBeNull()
      expect(s.replace(/\/\*[\s\S]*?\*\//g, '').match(/(^|[\s{;])order\s*:/), `${t}: CSS order`).toBeNull()
      expect(s.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, ''), `${t}: chữ game`).not.toMatch(CAM_GAME)
    }
  })

  it('chuyển động CHỈ nằm trong `prefers-reduced-motion: no-preference` (ngoài khối đó không `animation:` / `@keyframes`); có đủ ba vòng · điều mừng · dấu tích; chỉ opacity/transform', () => {
    const css = doc('src/components/ph-moi/bang/TongQuan.css').replace(/\/\*[\s\S]*?\*\//g, '')
    const dau = '@media (prefers-reduced-motion: no-preference)'
    const i = css.indexOf(dau)
    expect(i).toBeGreaterThan(-1)
    let d = 0
    let j = css.indexOf('{', i)
    for (; j < css.length; j++) {
      if (css[j] === '{') d++
      else if (css[j] === '}' && --d === 0) break
    }
    const trong = css.slice(css.indexOf('{', i) + 1, j)
    const ngoai = css.slice(0, i) + css.slice(j + 1)
    expect(ngoai).not.toMatch(/animation\s*:|animation-|@keyframes/)
    for (const k of ['phm-tq-chay', 'phm-tq-dau', 'phm-tq-hien', 'phm-tq-tich']) expect(trong).toContain(`@keyframes ${k}`)
    expect(trong).toMatch(/\.phm-vong3 \.phm-v-cung\s*\{[^}]*animation/)
    expect(trong).toMatch(/\.phm-mung\[data-hien\] > li\s*\{[^}]*animation/) // CHỈ lần mở đầu tiên trong ngày (data-hien)
    expect(trong).toMatch(/\.phm-lam \.phm-tich\s*\{[^}]*animation/)
    expect(css).not.toMatch(/transition\s*:[^;]*(width|height|margin|padding)/)
  })

  it('lớp / @keyframes MỚI của phần A chưa tồn tại ở CSS nào khác trong src (khỏi đụng tên)', () => {
    const moi = ['phm-v-cung', 'phm-v-lap2', 'phm-v-dau', 'phm-v-bong', 'phm-v-mat-na', 'phm-tq-chay', 'phm-tq-dau', 'phm-tq-hien', 'phm-tq-tich']
    const duyet = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (e.name === 'node_modules' || e.name === 'graphify-out' ? [] : duyet(path.join(d, e.name))) : e.name.endsWith('.css') ? [path.join(d, e.name)] : []))
    for (const f of duyet(path.join(process.cwd(), 'src'))) {
      if (f.endsWith('bang/TongQuan.css')) continue
      const s = fs.readFileSync(f, 'utf8')
      for (const k of moi) expect(s.includes(k), `${path.relative(process.cwd(), f)} đã có ${k}`).toBe(false)
    }
  })

  it('mọi tsx mở đầu bằng chú thích tiếng Việt về tệp làm gì + nguồn mẫu', () => {
    for (const t of NAM_TEP.filter((x) => x.endsWith('.tsx'))) {
      const dau = doc(t).split('\n').slice(0, 2).join('\n')
      expect(dau, t).toMatch(/^\/\/ .*ph-[de]-bang-/s)
      expect(dau, t).toMatch(/[ăâđêôơư]/i)
    }
  })

  it('đích chạm ≥ 48 px: nút "Hôm nay" và chip mục lục lấy min-height 48 từ ph-apple-bang.css (không bị TongQuan.css hạ xuống)', () => {
    const goc = doc('src/components/ph-moi/ph-apple-bang.css')
    expect(goc).toMatch(/\.phm-lui\s*\{[^}]*min-height:\s*48px/)
    expect(goc).toMatch(/\.phm-muc-luc a\s*\{[^}]*min-height:\s*48px/)
    expect(doc('src/components/ph-moi/bang/TongQuan.css')).not.toMatch(/min-height\s*:\s*(?!48)/)
  })
})
