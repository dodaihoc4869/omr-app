// BẢN VẼ TỐI GIẢN THẦY CHỐT 09/10 (thay thứ tự thẻ 01/10) — app phụ huynh: BA mục Hôm nay · Tiến bộ · Ca kiểm tra; số câu hôm nay MỘT nguồn, nói MỘT lần;
// thẻ bo 24 px; tối đa một nút chính mỗi màn. Bản vẽ: scratchpad canvas-v3 PH-HomNay / PH-TienBo / PH-LichSu (.dc.html).
// SỬA CÓ CHỦ Ý — TRUNG TU 09/10 (thầy duyệt bản vẽ trung-tu-canvas PH-HomNay · PH-TienBo · PH-CaKiemTra, "build luôn"): bộ "giao diện đầy đủ" đã đưa lại
// bốn mục (Hôm nay · Tiến bộ · Lịch sử · Lời thầy) — nay CHỐT lại BA mục Hôm nay · Tiến bộ · Ca kiểm tra; "Nhận xét của thầy" là thẻ ở Hôm nay + màn con `#loi-thay`.
// Thứ tự Hôm nay mới: khối chính → cảnh báo của thầy (nếu có) → Nhận xét của thầy → Tuần này học đều → danh sách cần chú ý → "Gia đình hỗ trợ" (một đoạn chữ nhỏ, cuối màn).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import ParentPortalScreen from '../src/screens/ParentPortalScreen'
import { chuTinhTrang, soCauHomNay, tenDangHomNay } from '../src/components/ph-v3/ManHomNay'
import { docTatCaVeCon } from '../src/lib/ph-moi/du-lieu'
import { docHoc2 } from '../src/lib/ph-v3/du-lieu'
import { PH_OK, PH_TRONG } from './_ph-moi/du-lieu-mau'

let canhBao: unknown[] = []
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrl: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({ ...(await original<any>()), tenTheoSbd: async () => ({ sbd: '12121212', hoTen: 'Nguyễn Minh Khôi', lop: '12A1', tenCa: '' }) }))
vi.mock('../src/lib/tai-thong-tin-ph', () => ({ taiThongTinPhuHuynh: async () => ({ canhBao }) }))
const CANH_BAO = { id: 'cb-1', maBtvn: 'BT-1', tenBtvn: 'BTVN Este', guiLuc: '2026-09-21T01:00:00Z', hanNop: '2026-09-22T05:00:00Z', loi: 'Thầy nhắc con nộp bài trước 12:00.', trangThaiEm: 'chua_mo', chang: null, daXem: false }

const HOC2 = { ok: true, cheDo2: true, ngay: '2026-09-21', homNay: { tong: 40, daLam: 32 } }
const LOI_THAY = { ok: true, nhanXet: [{ maCa: 'CA-2', tenCa: 'Kiểm tra 45 phút · Ester – Lipid', noiDung: 'Con mất điểm ở bài đốt cháy ester.', capNhatLuc: '2026-09-20T01:00:00Z', nopLuc: '2026-09-19T02:12:00Z', tong: 7.5 }] }
const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

let tatCa: unknown = PH_OK
let hoc2: unknown = HOC2
let loiThay: unknown = LOI_THAY
let goi: string[] = []
beforeEach(() => {
  tatCa = PH_OK
  hoc2 = HOC2
  loiThay = LOI_THAY
  canhBao = []
  goi = []
  window.history.replaceState(null, '', '/?vai=phuhuynh')
  localStorage.setItem('omr_ph_sbd', '12121212')
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const duong = String(url).replace('https://may.test', '')
    goi.push(duong)
    const js = (t: unknown) => ({ ok: true, status: 200, json: async () => t, text: async () => JSON.stringify(t) })
    if (duong === '/ph/tat-ca-ve-con') return js(tatCa)
    if (duong === '/ph/hoc-2') return js(hoc2)
    if (duong === '/ph/loi-thay') return js(loiThay)
    return js({ ok: true })
  }))
})
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
  window.history.replaceState(null, '', '/')
})

/** Chữ của một vùng, có ngắt dòng ở ranh giới khối (textContent dính "21/09" với "32/40 câu" thành "21/0932/40 câu"). */
const chuTach = (el: Element): string => {
  const c = el.cloneNode(true) as Element
  for (const e of c.querySelectorAll('h1, h2, p, li, a, div, section, span')) e.append('\n')
  return c.textContent ?? ''
}
const khoi = (c: HTMLElement) => [...c.querySelector('[data-vung="man-chinh-ph"] .ph3-luoi')!.children].map((x) => x.getAttribute('data-vung'))
const diToi = async (hash: string) => {
  await act(async () => {
    window.history.replaceState(null, '', `/?vai=phuhuynh${hash}`)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
}

describe('Hôm nay — thứ tự khối theo bản vẽ trung tu 09/10', () => {
  it('đúng thứ tự: chính · cảnh báo thật (nếu có) · nhận xét của thầy · tuần này · cần chú ý (dạng + ca gần nhất) · gia đình hỗ trợ (cuối)', async () => {
    canhBao = [CANH_BAO]
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="loi-thay-moi"]')).toBeTruthy())
    await waitFor(() => expect(container.querySelector('[data-vung="canh-bao-thay"]')).toBeTruthy())
    expect(khoi(container)).toEqual(['anh-hung', 'canh-bao-thay', 'loi-thay-moi', 'tuan-nay', 'dang-luyen-them', 'gia-dinh'])
    fireEvent.click(screen.getByRole('button', { name: 'Đã xem cảnh báo' }))
    expect(khoi(container)).toEqual(['anh-hung', 'loi-thay-moi', 'tuan-nay', 'dang-luyen-them', 'gia-dinh'])
    // "Gia đình hỗ trợ" là MỘT đoạn chữ nhỏ (không thẻ, không tiêu đề, không liên kết trùng tới Tiến bộ)
    const gd = container.querySelector('[data-vung="gia-dinh"]')!
    expect(gd.tagName).toBe('P')
    expect(gd.className).not.toContain('ph3-the')
    expect(gd.querySelector('a, h2')).toBeNull()
    expect(container.querySelector('[data-vung="man-chinh-ph"] a[href="#tien-bo"]')).toBeNull()
  })

  it('không cảnh báo ⇒ không khối cảnh báo nào (không khung rỗng)', async () => {
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="loi-thay-moi"]')).toBeTruthy())
    expect(khoi(container)).toEqual(['anh-hung', 'loi-thay-moi', 'tuan-nay', 'dang-luyen-them', 'gia-dinh'])
    expect(container.textContent).not.toContain('Cảnh báo của thầy')
  })

  it('KHÔNG LẶP số câu: có kế hoạch (32/40) thì số "câu đã làm" của nguồn thứ hai (38) không hiện ở đâu; "a/b câu" đúng MỘT lần; không phút học', async () => {
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="so-cau-hom-nay"]')?.textContent).toBe('32/40 câu'))
    await waitFor(() => expect(container.querySelector('[data-vung="loi-thay-moi"]')).toBeTruthy())
    const man = chuTach(container.querySelector('[data-vung="man-chinh-ph"]')!)
    expect(container.querySelectorAll('[data-vung="so-cau-hom-nay"]')).toHaveLength(1)
    expect(man.match(/\d+\s*\/\s*\d+ câu/g)).toEqual(['32/40 câu'])
    expect(man).not.toMatch(/\b38\b/)
    expect(man).not.toMatch(/học \d+ phút|\d+ phút học|Thời gian học|52 phút/) // tên ca "Kiểm tra 45 phút" thì được
    expect(man.match(/còn \d+ câu/g)).toEqual(['còn 8 câu']) // câu tình trạng nói phần còn lại, không nhắc lại 32 hay 40
    // một danh sách dạng (ở Tiến bộ) — Hôm nay chỉ MỘT dòng tên dạng ngắn, không "Đúng x/y câu" từng dạng
    // (trung tu 09/10: khối cần chú ý là danh sách DÒNG — dạng · ca gần nhất —, không phải danh sách từng dạng)
    expect(container.querySelector('[data-vung="dang-luyen-them"]')!.textContent).not.toMatch(/Đúng \d+\/\d+/)
    expect(container.querySelectorAll('[data-vung="dang-luyen-them"] .ph3-ten-dang')).toHaveLength(1)
    expect(container.querySelectorAll('[data-vung="dang-luyen-them"] li')).toHaveLength(2)
  })

  it('không có kế hoạch Game Hoá 2.0 ⇒ nguồn duy nhất là "câu đã làm hôm nay" của máy chủ (+ mục tiêu ngày nếu có)', async () => {
    hoc2 = { ok: true, cheDo2: false }
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="so-cau-hom-nay"]')?.textContent).toBe('38 câu'))
    expect(container.querySelector('.ph3-ah__thanh')).toBeNull() // không mục tiêu ⇒ không thanh
    cleanup()
    tatCa = { ...PH_OK, homNay: { ...(PH_OK as any).homNay, tongQuan: { ...(PH_OK as any).homNay.tongQuan, mucTieu: { soCau: 40, phutHoc: 60 } } } }
    const b = render(<ParentPortalScreen />)
    await waitFor(() => expect(b.container.querySelector('[data-vung="so-cau-hom-nay"]')?.textContent).toBe('38/40 câu'))
    expect(b.container.querySelector('[data-vung="anh-hung"]')!.textContent).toContain('Con đang làm, còn 2 câu nữa là đủ mục tiêu của ngày.')
    expect(b.container.querySelector('.ph3-ah__thanh > span')!.getAttribute('style')).toContain('width: 95%')
  })

  it('con chưa có dữ liệu ⇒ chỉ khối chính nói thật "chưa làm câu nào"; các khối khác vắng (không số 0 giả)', async () => {
    tatCa = PH_TRONG
    hoc2 = { ok: true, cheDo2: false }
    loiThay = { ok: true, nhanXet: [] }
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="anh-hung"]')).toBeTruthy())
    await waitFor(() => expect(goi).toContain('/ph/loi-thay'))
    expect(container.querySelector('[data-vung="anh-hung"] h2')!.textContent).toBe('Hôm nay con chưa làm câu nào')
    expect(khoi(container)).toEqual(['anh-hung', 'gia-dinh'])
  })

  it('tuần này: Thứ Năm, học T2 · T4 · T5 ⇒ "3/7 ngày"; T6 · T7 · CN là "chưa tới" (nét đứt), không tính vào số; ngày tuần trước không tính', async () => {
    const thu5 = Date.UTC(2026, 9, 8, 13, 0) // 20:00 Thứ Năm 08/10/2026 giờ VN
    tatCa = { ...PH_OK, serverNow: thu5, nhipHoc: { ngay: [{ ngay: '2026-10-02', soCau: 9 }, { ngay: '2026-10-05', soCau: 10 }, { ngay: '2026-10-06', soCau: 0 }, { ngay: '2026-10-07', soCau: 12 }, { ngay: '2026-10-08', soCau: 5 }], gioThuongHoc: '' } }
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="tuan-nay"]')).toBeTruthy())
    const t = container.querySelector('[data-vung="tuan-nay"]')!
    expect(t.querySelector('.ph3-the__so')!.textContent).toBe('3/7 ngày')
    const li = [...t.querySelectorAll('li')]
    expect(li.map((x) => (x.hasAttribute('data-hoc') ? 'hoc' : x.hasAttribute('data-sau') ? 'sau' : 'nghi'))).toEqual(['hoc', 'nghi', 'hoc', 'hoc', 'sau', 'sau', 'sau'])
    expect(li[3]!.hasAttribute('data-nay')).toBe(true)
    expect(li[1]!.textContent).toContain('Thứ Ba: không học') // trạng thái bằng CHỮ (màu không là kênh duy nhất)
    expect(li[6]!.textContent).toContain('Chủ nhật: chưa tới')
    expect(container.querySelector('[data-vung="anh-hung"]')!.textContent).not.toContain('Giờ học quen') // máy chủ không có giờ ⇒ không câu giờ
  })

  it('lời thầy lỗi ⇒ lời thật + "Thử lại" ngay chỗ khối lời thầy (gọi lại /ph/loi-thay)', async () => {
    loiThay = { ok: false, error: 'Máy chủ đang bận.' }
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.textContent).toContain('Máy chủ đang bận.'))
    const truoc = goi.filter((g) => g === '/ph/loi-thay').length
    loiThay = LOI_THAY
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    await waitFor(() => expect(container.querySelector('[data-vung="loi-thay-moi"]')).toBeTruthy())
    expect(goi.filter((g) => g === '/ph/loi-thay').length).toBe(truoc + 1)
  })
})

describe('ba mục · một nút chính mỗi màn · thẻ bo 24 px', () => {
  it('thanh mục: đúng 3 liên kết, ba biểu tượng khác nhau; mỗi màn tối đa MỘT nút chính (Hôm nay 0 · Tiến bộ 0 · Ca kiểm tra 1, màu đặc); tiêu đề màn = tên mục', async () => {
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="loi-thay-moi"]')).toBeTruthy())
    const muc = [...container.querySelectorAll('nav[aria-label="Các mục chính"] a')]
    expect(muc.map((a) => a.textContent)).toEqual(['Hôm nay', 'Tiến bộ', 'Ca kiểm tra'])
    expect(new Set(muc.map((a) => a.querySelector('svg')!.innerHTML)).size).toBe(3)
    expect(container.textContent).not.toMatch(/Lịch sử|Lời thầy/)
    const nutChinh = () => container.querySelectorAll('main .ph3-nut-tong').length
    expect(nutChinh()).toBe(0)
    await diToi('#tien-bo')
    await waitFor(() => expect(container.querySelector('[data-vung="man-tien-bo"]')).toBeTruthy())
    expect(container.querySelector('main h1')!.textContent).toBe('Tiến bộ')
    expect(nutChinh()).toBe(0)
    await diToi('#ca-kiem-tra')
    await waitFor(() => expect(container.querySelector('[data-vung="man-ca-kiem-tra"]')).toBeTruthy())
    expect(container.querySelector('main h1')!.textContent).toBe('Ca kiểm tra')
    expect(nutChinh()).toBe(1)
    expect(container.querySelector('main .ph3-nut-tong')!.className).toContain('ph3-nut-tong--dac')
    expect(container.querySelector('nav[aria-label="Lọc lịch sử"], [aria-pressed]')).toBeNull() // bỏ ba nút lọc
  })

  it('CSS: thanh mục 3 cột; thẻ (.ph3-the) và khối chính (.ph3-ah) bo 24 px; khối mới chỉ dùng biến --ph3-*', () => {
    const css = doc('src/components/ph-v3/ph-v3.css')
    expect(css).toMatch(/\.ph3-dieu-huong \{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/)
    expect(css).toMatch(/\.ph3-the \{[^}]*border-radius: 24px/)
    expect(css).toMatch(/\.ph3-ah \{[^}]*border-radius: 24px/)
    const moi = css.slice(css.indexOf('/* bản vẽ tối giản 09/10: số bên phải'), css.indexOf('.ph3-thanh {'))
    for (const m of moi.matchAll(/(?:color|background|border(?:-color)?):\s*([^;]+);/g)) expect(m[1], m[0]).toMatch(/^(var\(--ph3-[\w-]+\)|transparent|1\.5px solid var\(--ph3-[\w-]+\)|1px solid var\(--ph3-[\w-]+\))$/)
    expect(fs.existsSync(path.join(process.cwd(), 'src/components/ph-v3/ManLoiThay.tsx'))).toBe(true)
  })
})

describe('trung tu 09/10: đổi mục mịn, giữ chỗ cuộn từng mục, khung xương đúng hình, Hành trình không lặp số', () => {
  it('mỗi mục nhớ chỗ cuộn riêng; mở chi tiết ca luôn từ đầu; quay lại Ca kiểm tra trả đúng chỗ cũ; khung đổi mục có lớp .tt-vao-muc / màn con .tt-mo-lop', async () => {
    let y = 0
    Object.defineProperty(window, 'scrollY', { configurable: true, get: () => y })
    const cuon = vi.fn()
    vi.stubGlobal('scrollTo', cuon)
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="anh-hung"]')).toBeTruthy())
    expect(container.querySelector('[data-vung="man-chinh-ph"]')!.parentElement!.className).toBe('tt-vao-muc')
    y = 300 // Hôm nay đang cuộn 300
    await diToi('#ca-kiem-tra')
    await waitFor(() => expect(container.querySelector('[data-vung="man-ca-kiem-tra"]')).toBeTruthy())
    expect(cuon).toHaveBeenLastCalledWith(0, 0) // lần đầu vào mục ⇒ từ đầu
    y = 420 // Ca kiểm tra đang cuộn 420
    await diToi('#ca/CA-2')
    expect(cuon).toHaveBeenLastCalledWith(0, 0) // màn con ⇒ từ đầu
    await waitFor(() => expect(container.querySelector('[data-vung="man-chi-tiet-ca"]')).toBeTruthy())
    expect(container.querySelector('[data-vung="man-chi-tiet-ca"]')!.closest('.tt-mo-lop')).toBeTruthy()
    y = 900
    await diToi('#ca-kiem-tra')
    expect(cuon).toHaveBeenLastCalledWith(0, 420) // quay lại từ chi tiết ca ⇒ đúng chỗ cũ
    await diToi('#hom-nay')
    expect(cuon).toHaveBeenLastCalledWith(0, 300)
    delete (window as { scrollY?: number }).scrollY
  })

  it('đang tải ⇒ khung xương đúng hình màn Hôm nay (khối chính, thẻ, tuần, danh sách); không màn trắng', async () => {
    let tra: (v: unknown) => void = () => {}
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      const duong = String(url).replace('https://may.test', '')
      const js = (t: unknown) => ({ ok: true, status: 200, json: async () => t, text: async () => JSON.stringify(t) })
      if (duong === '/ph/tat-ca-ve-con') return new Promise((r) => { tra = () => r(js(PH_OK)) })
      return Promise.resolve(js(duong === '/ph/hoc-2' ? HOC2 : duong === '/ph/loi-thay' ? LOI_THAY : { ok: true }))
    }))
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="dang-tai"]')).toBeTruthy())
    expect([...container.querySelectorAll('[data-vung="dang-tai"] .ph3-xuong')].map((x) => x.getAttribute('data-hinh'))).toEqual(['ah', 'the', 'tuan', 'ds'])
    expect(container.querySelector('[data-vung="dang-tai"] .tt-xuong')).toBeTruthy()
    await act(async () => { tra(null) })
    await waitFor(() => expect(container.querySelector('[data-vung="anh-hung"]')).toBeTruthy())
  })

  it('Hành trình: tầng đang học; mức tối thiểu trùng số câu đã ghi to ⇒ không nhắc lại; không chữ nội bộ "kho", "xếp"; không liên kết trùng tới Tiến bộ', async () => {
    hoc2 = { ...HOC2, hanhTrinh: { tang: 2, toiThieu: 40 } }
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="hanh-trinh"]')).toBeTruthy())
    expect(container.querySelector('[data-vung="hanh-trinh"]')!.textContent).toBe('Hành trình của con: tầng Hiểu.')
    const man = container.querySelector('[data-vung="man-chinh-ph"]')!.textContent!
    expect(man).not.toMatch(/(^|[\s,.:;])kho([\s,.:;]|$)|đã xếp|Mức tối thiểu hôm nay/) // "khoảng" thì được
    expect(container.querySelector('[data-vung="man-chinh-ph"] a[href="#tien-bo"]')).toBeNull()
    cleanup()
    hoc2 = { ...HOC2, hanhTrinh: { tang: 3, toiThieu: 45 } }
    const b = render(<ParentPortalScreen />)
    await waitFor(() => expect(b.container.querySelector('[data-vung="hanh-trinh"]')).toBeTruthy())
    expect(b.container.querySelector('[data-vung="hanh-trinh"]')!.textContent).toBe('Hành trình của con: tầng Vận dụng · mức tối thiểu 45 câu. Kế hoạch hôm nay ít hơn vì chưa đủ câu phù hợp hoặc có câu đang để dành cho ca kiểm tra.')
  })
})

describe('hàm thuần của Hôm nay', () => {
  const pm = docTatCaVeCon(PH_OK)!
  it('soCauHomNay: kế hoạch đứng trên; không kế hoạch ⇒ tổng quan + mục tiêu (mục tiêu 0 ⇒ coi như không có)', () => {
    expect(soCauHomNay(pm, docHoc2(HOC2))).toEqual({ daLam: 32, tong: 40, keHoach: true })
    expect(soCauHomNay(pm, null)).toEqual({ daLam: 38, tong: null, keHoach: false })
    expect(soCauHomNay({ ...pm, tongQuan: { ...pm.tongQuan!, mucTieu: { soCau: 0, phutHoc: null } } }, null)).toEqual({ daLam: 38, tong: null, keHoach: false })
  })
  it('chuTinhTrang: xong · chưa bắt đầu · đang làm (chỉ nói phần còn lại) · không mục tiêu', () => {
    expect(chuTinhTrang({ daLam: 40, tong: 40, keHoach: true })).toBe('Con đã xong kế hoạch hôm nay.')
    expect(chuTinhTrang({ daLam: 0, tong: 40, keHoach: true })).toBe('Con chưa bắt đầu kế hoạch hôm nay.')
    expect(chuTinhTrang({ daLam: 12, tong: 30, keHoach: true })).toBe('Con đang làm, còn 18 câu nữa là xong kế hoạch hôm nay.')
    expect(chuTinhTrang({ daLam: 41, tong: 40, keHoach: false })).toBe('Con đã đủ mục tiêu của ngày.')
    expect(chuTinhTrang({ daLam: 9, tong: null, keHoach: false })).toBe('')
    expect(chuTinhTrang({ daLam: 0, tong: null, keHoach: false })).toBe('Kết quả hiện ở đây ngay khi con bắt đầu học.')
  })
  it('tenDangHomNay: dạng luyện thêm của máy chủ đứng trên; không có ⇒ "Dạng cần vững" của OMNI; không có gì ⇒ rỗng', () => {
    expect(tenDangHomNay(pm, null)).toEqual({ tieuDe: 'Dạng con đang luyện thêm', ten: ['Xà phòng hoá chất béo', 'Bài toán hỗn hợp ester'] })
    const tron = { ...pm, manhYeu: null, dangVap: null }
    const omni = { chienDich: null, homNay: null, cauTungSai: null, omni: { khoangCach8: null, hieuChuan: { soCaChot: 0, du: false }, dangCanVung: ['Hiệu suất ester hoá'], sEm: null, chungChi: [], gioHoc: null, canThayChua: 0 } }
    expect(tenDangHomNay(tron, omni)).toEqual({ tieuDe: 'Dạng cần vững', ten: ['Hiệu suất ester hoá'] })
    expect(tenDangHomNay(tron, null).ten).toEqual([])
  })
})
