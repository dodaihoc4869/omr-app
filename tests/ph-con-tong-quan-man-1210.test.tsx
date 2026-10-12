// LÀN PHỤ HUYNH 12/10 — GIAO DIỆN app phụ huynh trùng tu (thầy 12/10: "… số câu làm đúng, làm sai, thời gian làm từng câu gợi ý nhắc, bỏ mục thầy cần chữa,
// làm app phụ huynh siêu đẹp trực quan để phụ huynh theo dõi được con toàn diện"). Khoá: KHÔNG còn "Cần thầy chữa" (kể cả khi máy chủ vẫn gửi số);
// khối chính có câu đúng · câu sai · trung bình giây; "Gợi ý nhắc con" hiện đúng chữ máy chủ sinh; Lịch học tuần này; Tiến bộ có đúng/sai theo ngày,
// phân bố số giây, câu gần đây ("≈" ước tính, "chưa đo giờ"), câu sai + tình trạng sửa. Máy chủ cũ (chưa có lệnh) ⇒ khối mới vắng; lỗi ⇒ lý do + Thử lại.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ParentPortalScreen from '../src/screens/ParentPortalScreen'
import { chuGiay, docConTongQuan, nhanKhoangGiay, tiLeDung } from '../src/lib/ph-v3/con-tong-quan'
import { chuTrangThaiNgay } from '../src/components/ph-v3/ConTongQuan'
import { PH_OK } from './_ph-moi/du-lieu-mau'
import { conTongQuanGia } from '../scripts/chup-v2/gia/ph-con-tong-quan'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrl: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({ ...(await original<any>()), tenTheoSbd: async () => ({ sbd: '12121212', hoTen: 'Nguyễn Minh Khôi', lop: '12A1', tenCa: '' }) }))
vi.mock('../src/lib/tai-thong-tin-ph', () => ({ taiThongTinPhuHuynh: async () => ({ canhBao: [] }) }))

const OMNI = { khoangCach8: null, hieuChuan: { soCaChot: 0, du: false }, dangCanVung: ['Hiệu suất ester hoá'], sEm: null, chungChi: [], gioHoc: '20:30', canThayChua: 3 }
let tq: unknown
let tqTrangThai = 200
let goi: string[] = []
beforeEach(() => {
  tq = conTongQuanGia()
  tqTrangThai = 200
  goi = []
  window.history.replaceState(null, '', '/?vai=phuhuynh')
  localStorage.setItem('omr_ph_sbd', '12121212')
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const duong = String(url).replace('https://may.test', '')
    goi.push(duong)
    const js = (t: unknown, status = 200) => ({ ok: status < 400, status, json: async () => t, text: async () => JSON.stringify(t) })
    if (duong === '/ph/tat-ca-ve-con') return js(PH_OK)
    // máy chủ VẪN gửi canThayChua: 3 — app phụ huynh không được hiện "Cần thầy chữa" nữa
    if (duong === '/ph/hoc-2') return js({ ok: true, cheDo2: true, ngay: '2026-10-16', homNay: { tong: 30, daLam: 12 }, omni: OMNI })
    if (duong === '/ph/con-tong-quan') return js(tq, tqTrangThai)
    return js({ ok: true })
  }))
})
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
  window.history.replaceState(null, '', '/')
})
const diToi = async (hash: string) => {
  await act(async () => {
    window.history.replaceState(null, '', `/?vai=phuhuynh${hash}`)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
}

describe('Hôm nay — bỏ "Cần thầy chữa"; khối chính có đúng/sai/giây; gợi ý nhắc con; lịch tuần', () => {
  it('không còn "Cần thầy chữa" dù máy chủ gửi số; ba số câu đúng · câu sai · trung bình; số câu đã làm / mức một lần', async () => {
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="goi-y-nhac"]')).toBeTruthy())
    await waitFor(() => expect(container.querySelector('[data-vung="dang-luyen-them"]')).toBeTruthy())
    expect(container.textContent).not.toMatch(/[Cc]ần thầy chữa|[Tt]hầy cần chữa/)
    expect(container.querySelector('[data-vung="can-thay-chua"]')).toBeNull()
    expect(container.querySelector('[data-vung="so-cau-hom-nay"]')!.textContent).toBe('12/30 câu')
    expect(container.querySelectorAll('[data-vung="so-cau-hom-nay"]')).toHaveLength(1)
    const ba = container.querySelector('[data-vung="dung-sai-hom-nay"]')!
    const o = [...ba.querySelectorAll('dl > div')].map((d) => [d.querySelector('dt')!.textContent, d.querySelector('dd')!.textContent])
    expect(o).toEqual([['Câu đúng', '9'], ['Câu sai', '3'], ['Trung bình', '41 giây/câu']])
    expect(container.querySelector('[data-vung="anh-hung"]')!.textContent).toContain('Còn 18 câu nữa là đủ mức tối thiểu của ngày.')
  })

  it('"Gợi ý nhắc con": hiện đúng các câu máy chủ sinh theo luật, mỗi câu một biểu tượng; ngay sau khối chính', async () => {
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="goi-y-nhac"]')).toBeTruthy())
    const ds = [...container.querySelectorAll('[data-vung="goi-y-nhac"] li')]
    // SỬA CÓ CHỦ Ý — đợt 18 (thầy 13/10: "Bỏ hết các gợi ý hướng dẫn"): khối thành "Cần nhắc con"; bỏ dòng nói lại số câu hôm nay của khối chính;
    // mỗi dòng chỉ còn câu số liệu (bỏ vế khuyên "Nhắc con…", "Hỏi con…").
    expect(container.querySelector('#ph3-goi-y')!.textContent).toBe('Cần nhắc con')
    expect(ds.map((li) => li.getAttribute('data-ma'))).toEqual(['sai-chua-sua', 'nhanh-sai', 'thieu-ngay', 'lam-khuya'])
    expect(ds[1]!.textContent).toBe('7 ngày qua có 14 câu con làm dưới 8 giây và sai 9 câu.')
    expect(container.querySelector('[data-vung="goi-y-nhac"]')!.textContent).not.toMatch(/Nhắc con|Hỏi con|Tự chữa lỗi/)
    for (const li of ds) expect(li.querySelector('.ph3-o-bt svg')).toBeTruthy()
    const khoi = [...container.querySelector('[data-vung="man-chinh-ph"] .ph3-luoi')!.children].map((x) => x.getAttribute('data-vung'))
    expect(khoi.slice(0, 2)).toEqual(['anh-hung', 'goi-y-nhac'])
    expect(khoi).toContain('lich-tuan')
    expect(khoi).not.toContain('tuan-nay') // Lịch học tuần này thay "Tuần này học đều" — không hai lịch tuần
  })

  // SỬA CÓ CHỦ ĐÍCH 12/10 — thầy: "dữ liệu phần này tính từ 1/10" ⇒ bộ giả có mốc 01/10, sổ đủ 01/10 → 16/10 (16 ngày).
  it('Lịch học tuần này: trạng thái từng ngày bằng chữ (không chỉ màu) + từng ngày từ 01/10', async () => {
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="lich-tuan"]')).toBeTruthy())
    const lich = container.querySelector('[data-vung="lich-tuan"]')!
    expect([...lich.querySelectorAll('.ph3-lich > li')].map((li) => li.getAttribute('data-tt'))).toEqual(['du', 'thieu', 'khong', 'du', 'nay', 'chua-toi', 'chua-toi'])
    expect(lich.textContent).toContain('Thứ Ba 13/10: Thiếu 10 câu, đã làm 20/30 câu')
    expect(lich.textContent).toContain('Thứ Tư 14/10: Không làm, đã làm 0/≈30 câu')
    expect(lich.textContent).toContain('Đủ mức 2/4')
    const tungNgay = [...lich.querySelectorAll('[data-vung="lich-tung-ngay"] li b')].map((b) => b.textContent)
    expect(tungNgay.slice(0, 5)).toEqual(['Hôm nay 16/10', 'Thứ Năm 15/10', 'Thứ Tư 14/10', 'Thứ Ba 13/10', 'Thứ Hai 12/10'])
    expect(tungNgay).toHaveLength(16)
    expect(tungNgay.at(-1)).toBe('Thứ Năm 01/10')
    expect(lich.textContent).toContain('Xem từng ngày từ 01/10 (16 ngày)')
    expect(lich.textContent).toContain('≈ là mức ước tính')
  })

  it('máy chủ cũ chưa có lệnh (404) ⇒ khối mới vắng, màn như trước (Tuần này học đều); lỗi thật ⇒ lý do + Thử lại gọi lại', async () => {
    tq = { ok: false, error: 'Không có đường' }
    tqTrangThai = 404
    const a = render(<ParentPortalScreen />)
    await waitFor(() => expect(a.container.querySelector('[data-vung="loi-thay-moi"], [data-vung="tuan-nay"], [data-vung="dang-luyen-them"]')).toBeTruthy())
    await waitFor(() => expect(goi).toContain('/ph/con-tong-quan'))
    await waitFor(() => expect(a.container.querySelector('[data-vung="goi-y-nhac"], [data-vung="goi-y-dang-tai"]')).toBeNull())
    expect(a.container.querySelector('[data-vung="dung-sai-hom-nay"]')).toBeNull()
    expect(a.container.textContent).not.toMatch(/[Cc]ần thầy chữa/)
    cleanup()
    tq = { ok: false, error: 'Máy chủ đang bận.' }
    tqTrangThai = 500
    render(<ParentPortalScreen />)
    await waitFor(() => expect(screen.getByText(/Máy chủ đang bận\./)).toBeTruthy())
    const truoc = goi.filter((g) => g === '/ph/con-tong-quan').length
    tq = conTongQuanGia()
    tqTrangThai = 200
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    await waitFor(() => expect(document.querySelector('[data-vung="goi-y-nhac"]')).toBeTruthy())
    expect(goi.filter((g) => g === '/ph/con-tong-quan').length).toBe(truoc + 1)
  })
})

describe('Tiến bộ — đúng/sai theo ngày, thời gian làm câu, câu sai gần đây', () => {
  it('ba ô tỉ lệ + cột chồng 14 ngày; phân bố số giây; câu gần đây có giây ("≈", "chưa đo giờ") và đúng/sai; câu sai + tình trạng sửa; không đáp án', async () => {
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="goi-y-nhac"]')).toBeTruthy())
    await diToi('#tien-bo')
    await waitFor(() => expect(container.querySelector('[data-vung="dung-sai-ngay"]')).toBeTruthy())
    expect(container.querySelector('[data-vung="nhip-14"]')).toBeNull() // cùng trục ngày ⇒ không vẽ hai lần
    const ds = container.querySelector('[data-vung="dung-sai-ngay"]')!
    // SỬA CÓ CHỦ ĐÍCH 12/10 (mốc 01/10): ô thứ ba cộng mọi ngày từ 01/10
    expect([...ds.querySelectorAll('.ph3-so3 > div')].map((d) => d.textContent)).toEqual(['Hôm nay75% đúng9 đúng · 3 sai', '7 ngày qua73% đúng82 đúng · 31 sai', 'Từ 01/1075% đúng219 đúng · 73 sai'])
    expect(ds.querySelectorAll('.ph3-cot-ds__cot > span')).toHaveLength(14)
    expect(ds.querySelector('.ph3-cot-ds__cot')!.getAttribute('aria-label')).toContain('15/10 26 đúng 10 sai')
    const tg = container.querySelector('[data-vung="thoi-gian-lam"]')!
    expect(tg.querySelector('[data-vung="giay-tb"]')!.textContent).toBe('47 giây')
    expect([...tg.querySelectorAll('.ph3-pb__nhan')].map((x) => x.textContent)).toEqual(['Dưới 8 giây', '8–30 giây', '30 giây–1 phút', '1–2 phút', '2–5 phút', 'Từ 5 phút'])
    expect(tg.querySelector('.ph3-pb > li')!.textContent).toContain('14 câu · sai 9')
    const luot = [...tg.querySelectorAll('[data-vung="cau-gan-day"] .ph3-luot__giay')].map((x) => x.textContent)
    expect(luot.slice(0, 4)).toEqual(['42 giây', '6 giây', '1 phút 15 giây', '≈4 giây'])
    expect([...tg.querySelectorAll('.ph3-luot__giay')].some((x) => x.textContent === 'chưa đo giờ')).toBe(true)
    expect(tg.querySelector('.ph3-luot[data-kq="sai"]')).toBeTruthy()
    const cs = container.querySelector('[data-vung="cau-sai-gan-day"]')!
    expect(cs.querySelector('[data-vung="chua-sua"]')!.textContent).toBe('5')
    expect(cs.textContent).toContain('Câu 31 · Bảo toàn khối lượng khi xà phòng hoáSai 3 lần · lần gần nhất 16/10Chưa sửa')
    expect(cs.textContent).toContain('Đã sửa')
    expect(container.textContent).not.toMatch(/Đáp án|đáp án đúng|Cần thầy chữa/)
  })
})

describe('lớp đọc chặt + chữ', () => {
  it('docConTongQuan: thiếu khối bắt buộc ⇒ null; dòng hỏng bị bỏ; số tự mâu thuẫn ⇒ không nhận', () => {
    expect(docConTongQuan({ ok: true })).toBeNull()
    expect(docConTongQuan(null)).toBeNull()
    const goc = conTongQuanGia()
    const r = docConTongQuan({ ...goc, ngay: [...goc.ngay, { ngay: 'x' }, 7], ganDay: [...goc.ganDay, { luc: 'khong-phai-ngay' }], goiY: [...goc.goiY, { ma: 'la', chu: 'x' }, { ma: 'nhanh-sai', chu: 'trùng' }] })!
    expect(r.ngay).toHaveLength(16) // 01/10 → 16/10 (mốc 01/10)
    expect(r.ganDay).toHaveLength(30)
    expect(r.goiY.map((g) => g.ma)).toEqual(['con-cau-hom-nay', 'sai-chua-sua', 'nhanh-sai', 'thieu-ngay', 'lam-khuya'])
    expect(docConTongQuan({ ...goc, dem: { ...goc.dem, homNay: { soLuot: 5, dung: 9, sai: 3, boTrong: 0, soCau: 1, giayTb: 4 } } })).toBeNull()
  })

  it('chữ số giây, nhãn khoảng, tỉ lệ, trạng thái ngày', () => {
    expect([chuGiay(null), chuGiay(45), chuGiay(45, 'uoc'), chuGiay(75), chuGiay(120)]).toEqual(['chưa đo giờ', '45 giây', '≈45 giây', '1 phút 15 giây', '2 phút'])
    expect(nhanKhoangGiay({ tu: 300, den: null })).toBe('Từ 5 phút')
    expect([tiLeDung({ dung: 0, sai: 0 }), tiLeDung({ dung: 2, sai: 1 })]).toEqual([null, 67])
    const n = { ngay: '2026-10-13', dung: 1, sai: 0, boTrong: 0, soCau: 1, muc: 24, mucUocTinh: true, daXep: null, canLam: 24, daLam: 1, trangThai: 'thieu' as const, homNay: false }
    expect(chuTrangThaiNgay(n)).toBe('Thiếu ≈23 câu')
    expect(chuTrangThaiNgay({ ...n, homNay: true })).toBe('Còn ≈23 câu')
    expect(chuTrangThaiNgay({ ...n, soCau: 0, daLam: 0, trangThai: 'khong' })).toBe('Không làm')
    expect(chuTrangThaiNgay({ ...n, daLam: 24, trangThai: 'du' })).toBe('Đủ mức')
  })
})
