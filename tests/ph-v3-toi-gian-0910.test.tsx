// BẢN VẼ TỐI GIẢN THẦY CHỐT 09/10 (thay thứ tự thẻ 01/10) — app phụ huynh: BA mục Hôm nay · Tiến bộ · Ca kiểm tra; số câu hôm nay MỘT nguồn, nói MỘT lần;
// thẻ bo 24 px; tối đa một nút chính mỗi màn. Bản vẽ: scratchpad canvas-v3 PH-HomNay / PH-TienBo / PH-LichSu (.dc.html).
// SỬA CÓ CHỦ Ý — TRUNG TU 09/10 (thầy duyệt bản vẽ trung-tu-canvas PH-HomNay · PH-TienBo · PH-CaKiemTra, "build luôn"): bộ "giao diện đầy đủ" đã đưa lại
// bốn mục (Hôm nay · Tiến bộ · Lịch sử · Lời thầy) — nay CHỐT lại BA mục Hôm nay · Tiến bộ · Ca kiểm tra; "Nhận xét của thầy" là thẻ ở Hôm nay + màn con `#loi-thay`.
// Thứ tự Hôm nay mới: khối chính → cảnh báo của thầy (nếu có) → Nhận xét của thầy → Tuần này học đều → danh sách cần chú ý → "Gia đình hỗ trợ" (một đoạn chữ nhỏ, cuối màn).
// 27/10: `ph-v3/ManHomNay` (màn Hôm nay cũ) đã gỡ khỏi src/ vì không màn nào dùng ⇒ bỏ khối «hàm thuần của Hôm nay» (soCauHomNay, chuTinhTrang, tenDangHomNay).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import ParentPortalScreen from '../src/screens/ParentPortalScreen'
import { PH_OK, PH_TRONG } from './_ph-moi/du-lieu-mau'
import './_ph-nap-trang-cu' // trang cũ nạp lười (26/10): chờ mảnh về trước các test

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

// SỬA CÓ CHỦ ĐÍCH 13/10 (đợt 19 · làn R — thầy duyệt bản vẽ docs/ban-ve-dot19/app-phu-huynh.html): mục Hôm nay thành MỘT trang cuộn "Hôm nay của con"
// (TrangVeCon.tsx). Bố cục: nhóm trái (Hôm nay · Nhịp học) + nhóm phải (cảnh báo · Cần nhắc con · Nhận xét của thầy), rồi phần dưới nạp khi cuộn tới.
// Thẻ "Tuần này học đều" (7 chấm) đã thay bằng Nhịp học 14 ngày (`/ph/nhip-hoc`) + Lịch sử từng ngày — khoá ở tests/ph-trung-tu-1310r.test.tsx.
// Máy giả ở tệp này không có `/ph/nhip-hoc` ⇒ phần Nhịp học nói thật "Chưa tải được…" + "Tải lại nhịp học" (`nhip-con-loi`), không số giả.
const nhom = (c: HTMLElement, ben: 'trai' | 'phai') => [...c.querySelector(`.tvc-nhom-${ben}`)!.children].map((x) => x.getAttribute('data-vung'))
describe('Hôm nay — trang "Hôm nay của con" (bản vẽ đợt 19)', () => {
  it('đúng bố cục: trái = Hôm nay · Nhịp học; phải = cảnh báo thật (nếu có) · nhận xét của thầy; bấm "Đã xem cảnh báo" ⇒ cảnh báo rời đi', async () => {
    canhBao = [CANH_BAO]
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="loi-thay-moi"]')).toBeTruthy())
    await waitFor(() => expect(container.querySelector('[data-vung="canh-bao-thay"]')).toBeTruthy())
    await waitFor(() => expect(container.querySelector('[data-vung="nhip-con-loi"]')).toBeTruthy())
    expect(nhom(container, 'trai')).toEqual(['anh-hung', 'nhip-con-loi'])
    expect(nhom(container, 'phai')).toEqual(['canh-bao-thay', 'goi-y-nhac', 'loi-thay-moi'])
    fireEvent.click(screen.getByRole('button', { name: 'Đã xem cảnh báo' }))
    expect(nhom(container, 'phai')).toEqual(['goi-y-nhac', 'loi-thay-moi'])
    expect(container.querySelector('[data-vung="gia-dinh"]')).toBeNull()
    expect(container.textContent).not.toContain('Gia đình hỗ trợ')
  })

  it('không cảnh báo ⇒ không khối cảnh báo nào (không khung rỗng)', async () => {
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="loi-thay-moi"]')).toBeTruthy())
    await waitFor(() => expect(container.querySelector('[data-vung="nhip-con-loi"]')).toBeTruthy())
    expect(nhom(container, 'phai')).not.toContain('canh-bao-thay')
    expect(container.textContent).not.toContain('Cảnh báo của thầy')
  })

  it('KHÔNG LẶP số câu: có kế hoạch (32/40) thì số "câu đã làm" của nguồn thứ hai (38) không hiện ở khối Hôm nay; "a/b câu" đúng MỘT lần; không phút học', async () => {
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="so-cau-hom-nay"]')?.textContent).toBe('32/40 câu'))
    await waitFor(() => expect(container.querySelector('[data-vung="loi-thay-moi"]')).toBeTruthy())
    const hn = chuTach(container.querySelector('[data-vung="anh-hung"]')!)
    expect(container.querySelectorAll('[data-vung="so-cau-hom-nay"]')).toHaveLength(1)
    expect(hn.match(/\d+\s*\/\s*\d+ câu/g)).toEqual(['32/40 câu'])
    expect(hn).not.toMatch(/\b38\b/)
    expect(hn).not.toMatch(/học \d+ phút|\d+ phút học|Thời gian học|52 phút/)
    expect(hn.match(/[Cc]òn \d+ câu/g)).toEqual(['Còn 8 câu']) // câu tình trạng nói phần còn lại, không nhắc lại 32 hay 40
    expect(container.querySelector('[data-vung="anh-hung"] .tvc-hn-con')!.textContent).toBe('Còn 8 câu nữa là xong kế hoạch hôm nay.')
  })

  it('không có kế hoạch Game Hoá 2.0 ⇒ nguồn duy nhất là "câu đã làm hôm nay" của máy chủ (+ mục tiêu ngày nếu có)', async () => {
    hoc2 = { ok: true, cheDo2: false }
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="so-cau-hom-nay"]')?.textContent).toBe('38 câu'))
    expect(container.querySelector('[data-vung="anh-hung"] .tvc-thanh')).toBeNull() // không mục tiêu ⇒ không thanh
    cleanup()
    tatCa = { ...PH_OK, homNay: { ...(PH_OK as any).homNay, tongQuan: { ...(PH_OK as any).homNay.tongQuan, mucTieu: { soCau: 40, phutHoc: 60 } } } }
    const b = render(<ParentPortalScreen />)
    await waitFor(() => expect(b.container.querySelector('[data-vung="so-cau-hom-nay"]')?.textContent).toBe('38/40 câu'))
    expect(b.container.querySelector('[data-vung="anh-hung"] .tvc-hn-con')!.textContent).toBe('Còn 2 câu nữa là đủ mục tiêu của ngày.')
    expect(b.container.querySelector('[data-vung="anh-hung"] .tvc-thanh > i')!.getAttribute('style')).toContain('width: 95%')
  })

  it('con chưa có dữ liệu ⇒ khối Hôm nay nói thật "chưa làm câu nào"; Cần nhắc / nhận xét / bài tập / buổi học vắng (không số 0 giả)', async () => {
    tatCa = PH_TRONG
    hoc2 = { ok: true, cheDo2: false }
    loiThay = { ok: true, nhanXet: [] }
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="anh-hung"]')).toBeTruthy())
    await waitFor(() => expect(goi).toContain('/ph/loi-thay'))
    expect(container.querySelector('[data-vung="anh-hung"] h2')!.textContent).toBe('Hôm nay con chưa làm câu nào')
    await waitFor(() => expect(container.querySelector('[data-vung="nhip-con-loi"]')).toBeTruthy())
    expect(nhom(container, 'trai')).toEqual(['anh-hung', 'nhip-con-loi'])
    expect(container.querySelector('[data-vung="goi-y-nhac"]')).toBeNull()
    expect(container.querySelector('[data-vung="loi-thay-moi"]')!.textContent).toContain('Thầy chưa gửi nhận xét nào cho con.')
    expect(container.querySelector('[data-phan="btvn"], [data-phan="buoi-hoc"], [data-phan="lich-su"]')).toBeNull()
  })

  it('lời thầy lỗi ⇒ lời thật + "Thử lại nhận xét" ngay chỗ khối lời thầy (gọi lại /ph/loi-thay)', async () => {
    loiThay = { ok: false, error: 'Máy chủ đang bận.' }
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.textContent).toContain('Máy chủ đang bận.'))
    const truoc = goi.filter((g) => g === '/ph/loi-thay').length
    loiThay = LOI_THAY
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại nhận xét' }))
    await waitFor(() => expect(container.querySelector('[data-vung="loi-thay-moi"]')).toBeTruthy())
    expect(goi.filter((g) => g === '/ph/loi-thay').length).toBe(truoc + 1)
  })
})

describe('ba mục · một nút chính mỗi màn · thẻ bo 24 px', () => {
  // SỬA CÓ CHỦ ĐÍCH 13/10 (đợt 19, bản vẽ thầy duyệt): thanh điều hướng thành danh sách PHẦN của trang (9 mục, mỗi mục một biểu tượng riêng; bấm ⇒ cuộn
  // tới phần). Tiến bộ · Ca kiểm tra thành màn con mở từ liên kết trong trang (có nút "Hôm nay" quay lại). Mỗi màn vẫn tối đa MỘT nút chính.
  it('thanh bên: các phần của trang, biểu tượng khác nhau; mỗi màn tối đa MỘT nút chính (Hôm nay 0 · Tiến bộ 0 · Ca kiểm tra 1, màu đặc); màn con có nút quay lại', async () => {
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="loi-thay-moi"]')).toBeTruthy())
    const muc = [...container.querySelectorAll('nav[aria-label="Các phần về con"] a')]
    // máy giả không có `/ph/con-tong-quan` (⇒ không Lịch sử) và không `buoiHoc` (⇒ không Buổi học): mục trỏ vào phần vắng không hiện
    expect(muc.map((a) => a.textContent)).toEqual(['Hôm nay', 'Nhịp học', 'Thái độ', 'Câu sai', 'Thời gian', 'Kiểm tra', 'Bài tập về nhà'])
    expect(new Set(muc.map((a) => a.querySelector('svg')!.innerHTML)).size).toBe(muc.length)
    const nutChinh = () => container.querySelectorAll('main .ph3-nut-tong').length
    expect(nutChinh()).toBe(0)
    await diToi('#tien-bo')
    await waitFor(() => expect(container.querySelector('[data-vung="man-tien-bo"]')).toBeTruthy())
    expect(container.querySelector('main h1')!.textContent).toBe('Tiến bộ')
    expect(container.querySelector('main a.ph3-lui[href="#hom-nay"]')!.textContent).toBe('Hôm nay')
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
  // SỬA CÓ CHỦ ĐÍCH 13/10 (đợt 19): Tiến bộ · Ca kiểm tra là MÀN CON (mở từ trang, luôn từ đầu); trang "Hôm nay của con" nhớ chỗ cuộn khi quay lại.
  it('trang Hôm nay nhớ chỗ cuộn; Ca kiểm tra + chi tiết ca là màn con luôn mở từ đầu; khung đổi mục có lớp .tt-vao-muc / màn con .tt-mo-lop', async () => {
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
    expect(cuon).toHaveBeenLastCalledWith(0, 0) // màn con ⇒ từ đầu
    expect(container.querySelector('[data-vung="man-ca-kiem-tra"]')!.closest('.tt-mo-lop')).toBeTruthy()
    y = 420
    await diToi('#ca/CA-2')
    expect(cuon).toHaveBeenLastCalledWith(0, 0)
    await waitFor(() => expect(container.querySelector('[data-vung="man-chi-tiet-ca"]')).toBeTruthy())
    expect(container.querySelector('[data-vung="man-chi-tiet-ca"]')!.closest('.tt-mo-lop')).toBeTruthy()
    y = 900
    await diToi('#ca-kiem-tra')
    expect(cuon).toHaveBeenLastCalledWith(0, 0)
    await diToi('#hom-nay')
    expect(cuon).toHaveBeenLastCalledWith(0, 300) // quay về trang ⇒ đúng chỗ cũ
    delete (window as { scrollY?: number }).scrollY
  })

  it('đang tải ⇒ khung chờ đúng hình trang Hôm nay (khối Hôm nay + thẻ); không màn trắng', async () => {
    let tra: (v: unknown) => void = () => {}
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      const duong = String(url).replace('https://may.test', '')
      const js = (t: unknown) => ({ ok: true, status: 200, json: async () => t, text: async () => JSON.stringify(t) })
      if (duong === '/ph/tat-ca-ve-con') return new Promise((r) => { tra = () => r(js(PH_OK)) })
      return Promise.resolve(js(duong === '/ph/hoc-2' ? HOC2 : duong === '/ph/loi-thay' ? LOI_THAY : { ok: true }))
    }))
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="dang-tai"]')).toBeTruthy())
    expect([...container.querySelectorAll('[data-vung="dang-tai"] .tvc-cho')].map((x) => x.getAttribute('data-hinh'))).toEqual(['hom-nay', null])
    expect(container.querySelector('[data-vung="dang-tai"] .tt-xuong')).toBeTruthy()
    expect(container.querySelector('.tvc-chao h1')!.textContent).toBe('Hôm nay của Khôi') // lời chào hiện ngay
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
    // SỬA CÓ CHỦ ĐÍCH 13/10 (đợt 19): Tiến bộ không còn trên thanh điều hướng ⇒ trang có ĐÚNG MỘT liên kết tới Tiến bộ (phần Kiểm tra, "Xem bậc từng dạng").
    expect(container.querySelectorAll('[data-vung="man-chinh-ph"] a[href="#tien-bo"]').length).toBeLessThanOrEqual(1)
    cleanup()
    hoc2 = { ...HOC2, hanhTrinh: { tang: 3, toiThieu: 45 } }
    const b = render(<ParentPortalScreen />)
    await waitFor(() => expect(b.container.querySelector('[data-vung="hanh-trinh"]')).toBeTruthy())
    // SỬA CÓ CHỦ Ý — đợt 18 (thầy 13/10: "Bỏ hết các gợi ý hướng dẫn"): bỏ câu giải thích vì sao kế hoạch ít hơn mức.
    expect(b.container.querySelector('[data-vung="hanh-trinh"]')!.textContent).toBe('Hành trình của con: tầng Vận dụng · mức tối thiểu 45 câu.')
  })
})
