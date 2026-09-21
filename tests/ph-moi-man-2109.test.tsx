// APP PHỤ HUYNH MỚI — MÀN (Code 2; thầy chốt mẫu 21/09; docs/ban-ve-ph-moi-thu-ve-con-2109/): màn chính (thẻ "Hôm nay của con" → bảng, thẻ "Ca kiểm tra gần nhất" → bảng ở khối ca, dải cảnh báo thụ động, MỘT nút dính đáy,
// chân "Đổi số báo danh"), bảng chín khối (khối nào máy chủ không trả ⇒ ẨN), câu bị che không lộ đáp án, danh sách dài dựng theo nhóm mở, lời giải chỉ khi có mã câu, và ParentPortalScreen thật đi màn chính → bảng → về.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import ParentPortalScreen from '../src/screens/ParentPortalScreen'
import ManChinh from '../src/components/ph-moi/ManChinh'
import BangMoiThu, { NGUONG_LAM_LAU_GIAY, gomNhomCau, ChuoiMuoiBonNgay } from '../src/components/ph-moi/BangMoiThu'
import { docTatCaVeCon } from '../src/lib/ph-moi/du-lieu'
import { NHIP_PH_MOI_MS, useTatCaVeCon } from '../src/lib/ph-moi/use-tat-ca-ve-con'
import { chuBanApp } from '../src/lib/cap-nhat-app'
import { PH_OK, PH_CHUA_CB, PH_TRONG, CHI_TIET, H, NAY } from './_ph-moi/du-lieu-mau'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrl: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({ ...(await original<any>()), tenTheoSbd: async () => ({ sbd: '12121212', hoTen: 'Nguyễn Minh Khôi', lop: '12 - Tinh Hoa', tenCa: '' }) }))
vi.mock('../src/lib/bo-nao-lay-loi-ph', () => ({ taiThongTinPhuHuynh: async () => ({ boNao: null, canhBao: [CANH_BAO] }) }))
const CANH_BAO = { id: 'cb-1', maBtvn: 'BT-1', tenBtvn: 'BTVN Este', guiLuc: '2026-09-21T01:00:00Z', hanNop: '2026-09-22T05:00:00Z', loi: 'Thầy nhắc con nộp bài trước 12:00.', trangThaiEm: 'chua_mo', chang: null, daXem: false }
const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const CAM_GAME = /thần thú|khiên|Võ đài|Đảo thần thú|Linh Tâm|Đoàn Hộ Tống|\bEXP\b/i
const nhan = <T,>(o: T): T => JSON.parse(JSON.stringify(o))
const pmOf = (raw: unknown = PH_OK) => docTatCaVeCon(raw)!
const giaoThemMau = (them: object = {}) => ({ san: true, dangTai: false, conLai: 2, goiGanNhat: null, the: null, dangGui: false, giao: vi.fn(), ...them })
const view = (pm: ReturnType<typeof pmOf> | null, tt: 'tai' | 'ok' | 'loi' = 'ok', chuLoi = '') => ({ trangThai: tt, pm, chuLoi, dangLamMoi: false, thuLai: vi.fn() })

beforeEach(() => {
  vi.stubGlobal('scrollTo', vi.fn())
})
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
  window.history.replaceState(null, '', '/')
})

describe('ManChinh — màn chính', () => {
  const ve = (v: ReturnType<typeof view>, p: Record<string, unknown> = {}) =>
    render(<ManChinh v={v} tenCon="Khôi" lop="12 - Tinh Hoa" now={NAY} canhBao={[]} onCanhBaoDaXem={() => {}} giaoThem={giaoThemMau() as any} onMoBang={() => {}} onDoiSbd={() => {}} {...(p as object)} />)

  it('có dữ liệu: lời chào + tên con/lớp; thẻ "Hôm nay của con" (đạt, 4 số CÓ NHÃN, giờ học gần nhất); thẻ ca gần nhất (7,5/10, Hơn 0,75 điểm so với lần trước của chính con)', () => {
    const { container } = ve(view(pmOf()))
    expect(container.querySelector('h1')!.textContent).toBe('Chào anh/chị')
    expect(container.textContent).toContain('Con: Nguyễn Minh Khôi')
    expect(container.textContent).toContain('Lớp 12 - Tinh Hoa')
    const hn = container.querySelector('[data-vung="hom-nay"]') as HTMLElement
    expect(hn.textContent).toContain('Thứ Hai 21/09')
    expect(hn.textContent).toContain('Con đã đạt nhiệm vụ hôm nay')
    expect(hn.textContent).toContain('Học gần nhất lúc 20:47')
    const so = [...hn.querySelectorAll('.mt-hn__so li')].map((l) => l.textContent)
    expect(so).toEqual(['38câuđã làm', '79%câuđúng', '52phúthọc', '6ngàyhọc đều'])
    expect(hn.textContent).toContain('Xem mọi thứ về con')
    const ca = container.querySelector('[data-vung="ca-gan-nhat"]') as HTMLElement
    expect(ca.textContent).toContain('Kiểm tra 45 phút · Ester – Lipid')
    expect(ca.textContent).toContain('Nộp lúc 09:12 · Thứ Bảy 19/09/2026')
    expect(ca.textContent).toContain('7,5')
    expect(ca.textContent).toContain('Hơn 0,75 điểm')
    expect(ca.textContent).toContain('so với lần trước của chính con (6,75 điểm)')
  })

  it('cả thẻ "Hôm nay của con" là MỘT nút ⇒ mở bảng; thẻ ca ⇒ mở bảng ở khối Ca kiểm tra; "Đổi số báo danh" + số bản ở chân', () => {
    const onMoBang = vi.fn()
    const onDoiSbd = vi.fn()
    const { container } = ve(view(pmOf()), { onMoBang, onDoiSbd })
    fireEvent.click(container.querySelector('[data-vung="hom-nay"]')!)
    expect(onMoBang).toHaveBeenLastCalledWith()
    fireEvent.click(container.querySelector('[data-vung="ca-gan-nhat"]')!)
    expect(onMoBang).toHaveBeenLastCalledWith('ca-kiem-tra')
    fireEvent.click(screen.getByRole('button', { name: 'Đổi số báo danh' }))
    expect(onDoiSbd).toHaveBeenCalledTimes(1)
    expect(container.querySelector('[data-vung="chan-ph"] span')!.textContent).toBe(chuBanApp())
  })

  it('ca CHƯA công bố: "Thầy chưa công bố điểm" + chờ cả lớp; KHÔNG điểm, KHÔNG so sánh', () => {
    const { container } = ve(view(pmOf(PH_CHUA_CB)))
    const ca = container.querySelector('[data-vung="ca-gan-nhat"]') as HTMLElement
    expect(ca.textContent).toContain('Thầy chưa công bố điểm')
    expect(ca.textContent).toContain('Điểm hiện khi cả lớp nộp xong (27/32 em đã nộp).')
    expect(ca.textContent).not.toMatch(/7,5|Hơn|so với lần trước|\/10 điểm/)
  })

  it('hôm nay con chưa học: câu nói thật + gợi ý giao thêm; KHÔNG ô số, KHÔNG thẻ ca; thiếu tổng quan ⇒ không vòng', () => {
    const { container } = ve(view(pmOf(PH_TRONG)))
    expect(container.textContent).toContain('Hôm nay con chưa học')
    expect(container.textContent).toContain('Anh/chị có thể giao thêm bài cho con.')
    expect(container.querySelector('.mt-hn__so')).toBeNull()
    expect(container.querySelector('.mt-vong')).toBeNull()
    expect(container.querySelector('[data-vung="ca-gan-nhat"]')).toBeNull()
  })

  it('chưa đạt nhiệm vụ / phần trăm chỉ khi có số; câu đã làm 0 ⇒ coi như chưa học', () => {
    const raw = nhan(PH_OK)
    raw.homNay.tongQuan = { soCau: 12, soDung: 6, phutHoc: 20, datNhiemVu: false, chuoiNgayHoc: 0 }
    const { container } = ve(view(pmOf(raw)))
    expect(container.textContent).toContain('Con chưa đạt nhiệm vụ hôm nay')
    expect([...container.querySelectorAll('.mt-hn__so li')].map((l) => l.textContent)).toEqual(['12câuđã làm', '50%câuđúng', '20phúthọc']) // chuỗi 0 ⇒ không ô ngày
    cleanup()
    raw.homNay.tongQuan = { soCau: 0, phutHoc: 0 }
    expect(ve(view(pmOf(raw))).container.textContent).toContain('Hôm nay con chưa học')
  })

  it('đang tải ⇒ khung xương (role=status), chưa thẻ nào; lỗi ⇒ lời thật của máy chủ (role=alert) + "Thử lại" gọi lại; nút giao vẫn ở đáy', () => {
    const a = ve(view(null, 'tai'))
    expect(a.container.querySelector('[data-vung="dang-tai"]')!.getAttribute('role')).toBe('status')
    expect(a.container.querySelector('[data-vung="hom-nay"]')).toBeNull()
    a.unmount()
    const v = view(null, 'loi', 'Không tìm thấy số báo danh của con.')
    const b = ve(v)
    expect(b.container.querySelector('[role="alert"]')!.textContent).toContain('Không tìm thấy số báo danh của con.')
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(v.thuLai).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Giao thêm bài cho con' })).toBeTruthy()
  })

  it('đúng MỘT nút hành động chính (.mt-nut--chinh = "Giao thêm bài cho con"); dòng lượt "Hôm nay còn 2 lượt giao"; hết lượt ⇒ nút mờ; không chữ game; không emoji', () => {
    const { container } = ve(view(pmOf()))
    expect(container.querySelectorAll('.mt-nut--chinh')).toHaveLength(1)
    expect(container.querySelector('.mt-nut--chinh')!.textContent).toBe('Giao thêm bài cho con')
    expect(container.querySelector('[data-vung="luot-giao"]')!.textContent).toBe('Hôm nay còn 2 lượt giao · A.I Đỗ Đại Học chọn câu hợp với con')
    expect(container.textContent).not.toMatch(CAM_GAME)
    expect(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(container.textContent || '')).toBe(false)
    cleanup()
    const het = ve(view(pmOf()), { giaoThem: giaoThemMau({ conLai: 0 }) })
    expect((het.container.querySelector('.mt-nut--chinh') as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(het.container.querySelector('.mt-nut--chinh')!)
  })

  it('bấm nút ⇒ giao(); thẻ kết quả (đã giao / lỗi thật) hiện NGAY TRÊN nút với role đúng', () => {
    const giao = vi.fn()
    const { container, rerender } = ve(view(pmOf()), { giaoThem: giaoThemMau({ giao }) })
    fireEvent.click(screen.getByRole('button', { name: 'Giao thêm bài cho con' }))
    expect(giao).toHaveBeenCalledTimes(1)
    const the = { kieu: 'loi', tieuDe: 'Chưa giao được bài', dong: ['Cần liên kết riêng của con.'], cuoi: '' }
    rerender(<ManChinh v={view(pmOf())} tenCon="Khôi" lop="" now={NAY} canhBao={[]} onCanhBaoDaXem={() => {}} giaoThem={giaoThemMau({ the }) as any} onMoBang={() => {}} onDoiSbd={() => {}} />)
    const t = container.querySelector('[data-vung="the-giao-them"]') as HTMLElement
    expect(t.getAttribute('role')).toBe('alert')
    expect(t.textContent).toContain('Cần liên kết riêng của con.')
    expect(t.compareDocumentPosition(container.querySelector('.mt-nut--chinh')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('dải cảnh báo của thầy: THỤ ĐỘNG (chỉ đọc + "Đã xem"), không nút "Làm ngay"', () => {
    const onDaXem = vi.fn()
    const { container } = ve(view(pmOf()), { canhBao: [CANH_BAO], onCanhBaoDaXem: onDaXem })
    expect(container.textContent).toContain('Thầy nhắc con nộp bài trước 12:00.')
    expect(screen.queryByRole('button', { name: 'Làm ngay' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Đã xem/ }))
    expect(onDaXem).toHaveBeenCalledTimes(1)
  })
})

describe('BangMoiThu — chín khối, ẩn khối vắng', () => {
  const bang = (pm = pmOf(), p: Record<string, unknown> = {}) => render(<BangMoiThu pm={pm} sbd="12121212" lop="12 - Tinh Hoa" giaoThem={giaoThemMau() as any} onVe={() => {}} {...(p as object)} />)

  it('đủ chín khối theo THỨ TỰ mẫu + mục lục 9 chip ("Từng câu (38)") + tiêu đề "Mọi thứ về con" + tên con/lớp; MỘT nút chính; không chữ game', () => {
    const { container } = bang()
    expect([...container.querySelectorAll('.mt-muc')].map((x) => x.id)).toEqual(['tong-quan', 'dong-thoi-gian', 'ca-kiem-tra', 'manh-yeu', 'tung-cau', 'btvn', 'lich-on', 'nhip-14-ngay', 'loi-ai'])
    expect([...container.querySelectorAll('.mt-muc-luc a')].map((a) => a.textContent)).toEqual(['Tổng quan', 'Dòng thời gian', 'Ca kiểm tra', 'Điểm mạnh · cần luyện', 'Từng câu (38)', 'Bài tập về nhà', 'Lịch ôn lại', '14 ngày', 'Lời A.I Đỗ Đại Học'])
    expect(container.querySelector('h1')!.textContent).toBe('Mọi thứ về con')
    expect(container.querySelector('.mt-tren-ten p')!.textContent).toBe('Nguyễn Minh Khôi · Lớp 12 - Tinh Hoa')
    expect(container.querySelectorAll('.mt-nut--chinh')).toHaveLength(1)
    expect(container.textContent).not.toMatch(CAM_GAME)
    expect(container.textContent).not.toMatch(/xếp hạng|nắm chắc|năng lực/i)
    expect(container.querySelector('[data-vung="do-cham"]')!.textContent).toBe('Độ chăm hôm nay: hạng 9 trong 42 bạn') // được phép: không tên bạn
  })

  it('① tổng quan: bốn số có nhãn + dòng phụ tính từ dữ liệu; so với hôm qua; nhiệm vụ đạt', () => {
    const { container } = bang()
    const t = container.querySelector('#tong-quan') as HTMLElement
    expect(t.textContent).toContain('Thứ Hai 21/09 · cập nhật lúc 21:00')
    expect(t.textContent).toContain('Nhiệm vụ hôm nay: đã đạt')
    expect([...t.querySelectorAll('.mt-so-o')].map((o) => o.textContent)).toEqual(['Câu đã làm38câu5 lần ngồi học', 'Câu đúng79%30 trong 38 câu', 'Thời gian học52phútdài nhất 21 phút', 'Chuỗi học đều6ngàyliên tục từ 16/09'])
    expect(t.querySelector('.mt-hom-qua')!.textContent).toContain('Nhiều hơn 5 câu (hôm qua 33 câu)')
    expect(t.querySelector('.mt-hom-qua')!.textContent).toContain('Câu đúng 79 % (hôm qua 76 %)')
  })

  it('② dòng thời gian: 5 mốc theo giờ, tóm tắt buổi, mốc bị che có khoá + lời, thanh đúng/số câu', () => {
    const { container } = bang()
    const d = container.querySelector('#dong-thoi-gian') as HTMLElement
    expect([...d.querySelectorAll('.mt-tl__gio')].map((x) => x.textContent)).toEqual(['06:40', '17:12', '19:35', '20:10', '20:40'])
    expect(d.textContent).toContain('Con ngồi học 5 lần: 1 lần buổi sáng, 1 lần buổi chiều, 3 lần buổi tối.')
    expect(d.textContent).toContain('Ôn lại 6 câu đến lịch')
    expect(d.textContent).toContain('6 câu · đúng 5 · 7 phút')
    expect(d.textContent).toContain('Bài tập về nhà “Ester – Lipid”')
    const che = [...d.querySelectorAll('.mt-tl li')][4]!
    expect(che.textContent).toContain('Con đã làm · kết quả hiện sau khi con nộp bài')
    expect(che.querySelector('.mt-thanh')).toBeNull()
    expect(che.textContent).not.toMatch(/đúng \d/)
  })

  it('③ ca kiểm tra: điểm 7,5/10, đúng 21/28, làm trong 32 phút 10 giây, hơn lần trước 0,75, ba phần có điểm; chưa công bố ⇒ thẻ khoá, KHÔNG điểm', () => {
    const { container } = bang()
    const c = container.querySelector('#ca-kiem-tra') as HTMLElement
    for (const m of ['7,5', 'Nộp lúc 09:12 · Thứ Bảy 19/09/2026', 'Đúng 21/28 câu · làm trong 32 phút 10 giây', 'Hơn lần trước của chính con 0,75 điểm (lần trước 6,75)', 'Phần I · Trắc nghiệm', '3,75', 'đúng 15/18 câu', 'Phần II · Đúng–sai', 'Phần III · Trả lời ngắn']) expect(c.textContent).toContain(m)
    cleanup()
    const u = bang(pmOf(PH_CHUA_CB)).container.querySelector('#ca-kiem-tra') as HTMLElement
    expect(u.textContent).toContain('Thầy chưa công bố điểm')
    expect(u.textContent).toContain('Điểm hiện khi cả lớp nộp xong (27/32 em đã nộp).')
    expect(u.textContent).not.toMatch(/7,5|Phần I|so với lần trước|trên 10/)
  })

  it('④ điểm mạnh · cần luyện: lên bậc hôm nay, dạng làm tốt / còn vấp có "đúng x/y câu" + bậc; lịch ôn ngày mai nêu số THẬT', () => {
    const { container } = bang()
    const m = container.querySelector('#manh-yeu') as HTMLElement
    expect(m.querySelector('[data-vung="len-bac"]')!.textContent).toContain('Hôm nay con lên bậc ở 2 dạng')
    expect(m.querySelector('[data-vung="dang-tot"]')!.textContent).toContain('Danh pháp ester')
    expect(m.querySelector('[data-vung="dang-tot"]')!.textContent).toContain('đúng 11/12 câu')
    expect(m.querySelector('[data-vung="dang-vap"]')!.textContent).toContain('Xà phòng hoá chất béo')
    expect(m.querySelector('[data-vung="dang-vap"]')!.textContent).toContain('A.I Đỗ Đại Học đã xếp 7 câu vào lịch ôn ngày mai')
    expect(m.querySelector('[role="img"][aria-label*="Bậc hiện tại của con: Vận dụng"]')).toBeTruthy()
  })

  it('⑥ bài tập về nhà: đang chạy (xong 2/5 chặng, hạn) + gần đây (đúng hạn / sau hạn + điểm); ⑦ lịch ôn; ⑧ 14 ngày; ⑨ lời A.I + gợi ý', () => {
    const { container } = bang()
    const b = container.querySelector('#btvn') as HTMLElement
    expect(b.textContent).toContain('Xong 2 trong 5 chặng')
    expect(b.querySelectorAll('.mt-chang li[data-xong]')).toHaveLength(2)
    expect(b.textContent).toContain('Hạn nộp 12:00 · Thứ Sáu 25/09/2026')
    expect(b.textContent).toContain('còn 3 ngày 15 giờ')
    expect(b.textContent).toContain('Nộp đúng hạn')
    expect(b.textContent).toContain('Nộp sau hạn')
    expect(b.textContent).toContain('8,2')
    const l = container.querySelector('#lich-on') as HTMLElement
    expect(l.textContent).toContain('7câu đến lịch ôn ngày mai')
    expect(l.textContent).toContain('Đã khắc phục 12 trong 31 câu từng sai')
    expect(l.textContent).toContain('còn 19 câu đang trong lịch ôn')
    const n = container.querySelector('#nhip-14-ngay') as HTMLElement
    expect(n.querySelectorAll('.mt-14 li')).toHaveLength(14)
    expect(n.querySelector('.mt-14 li[data-nay]')!.textContent).toContain('38')
    expect(n.textContent).toContain('Con học 11 trong 14 ngày · tổng 283 câu')
    expect(n.textContent).toContain('Con thường học từ 19:30 đến 21:00')
    const a = container.querySelector('#loi-ai') as HTMLElement
    expect(a.textContent).toContain('Hôm nay · Thứ Hai 21/09')
    expect(a.textContent).toContain('A.I Đỗ Đại Học viết từ số liệu học của con')
    expect(a.querySelectorAll('[data-vung="goi-y"] li')).toHaveLength(2)
  })

  it('KHỐI NÀO MÁY CHỦ KHÔNG TRẢ ⇒ ẨN: con mới hoàn toàn chỉ có bảng rỗng (không khối nào, không chip mục lục), nút giao vẫn còn', () => {
    const { container } = bang(pmOf(PH_TRONG))
    expect(container.querySelectorAll('.mt-muc')).toHaveLength(0)
    expect(container.querySelectorAll('.mt-muc-luc a')).toHaveLength(0)
    expect(container.querySelectorAll('.mt-nut--chinh')).toHaveLength(1)
    cleanup()
    const raw = nhan(PH_OK)
    for (const k of ['manhYeu', 'baiTapVeNha', 'lichOn', 'nhipHoc', 'loiBoNao', 'phuHuynhLamGi', 'doCham']) delete raw[k]
    delete raw.homNay.cau
    const r = bang(pmOf(raw)).container
    expect([...r.querySelectorAll('.mt-muc')].map((x) => x.id)).toEqual(['tong-quan', 'dong-thoi-gian', 'ca-kiem-tra'])
    expect(r.querySelector('#tung-cau')).toBeNull()
  })

  it('bấm chip mục lục ⇒ aria-current đổi; nút ← gọi onVe', () => {
    const onVe = vi.fn()
    const { container } = bang(pmOf(), { onVe })
    const chip = [...container.querySelectorAll('.mt-muc-luc a')].find((a) => a.textContent === 'Lịch ôn lại') as HTMLElement
    fireEvent.click(chip)
    expect(chip.getAttribute('aria-current')).toBe('true')
    expect(container.querySelector('.mt-muc-luc a[aria-current="true"]')).toBe(chip)
    fireEvent.click(screen.getByRole('button', { name: 'Về màn chính' }))
    expect(onVe).toHaveBeenCalledTimes(1)
  })
})

describe('⑤ từng câu — lọc, che, nhóm, lời giải', () => {
  const bang = (pm = pmOf()) => render(<BangMoiThu pm={pm} sbd="12121212" lop="" giaoThem={giaoThemMau() as any} onVe={() => {}} />)
  const nhomTheoTen = (c: HTMLElement, ten: RegExp) => [...c.querySelectorAll('[data-vung="nhom-cau"]')].find((n) => ten.test(n.getAttribute('aria-label') || ''))! as HTMLElement

  it('bộ lọc có SỐ: Tất cả 38 · Sai · Làm lâu · Chưa công bố 6; lọc "Sai" chỉ còn câu sai; chú giải đúng/sai', () => {
    const { container } = bang()
    const pm = pmOf()
    const sai = pm.cau!.filter((c) => c.kieu === 'thuong' && c.dung === false).length
    const lau = pm.cau!.filter((c) => c.giay !== null && c.giay > NGUONG_LAM_LAU_GIAY).length
    const loc = [...container.querySelectorAll('.mt-loc button')].map((b) => b.textContent)
    expect(loc).toEqual(['Tất cả 38', `Sai ${sai}`, `Làm lâu ${lau}`, 'Chưa công bố 6'])
    expect(sai).toBeGreaterThan(0)
    expect(container.querySelector('.mt-chu-giai')!.textContent).toContain('Làm lâu: hơn 3 phút một câu')
    fireEvent.click(screen.getByRole('button', { name: `Sai ${sai}` }))
    expect(container.querySelector('.mt-loc button[aria-pressed="true"]')!.textContent).toBe(`Sai ${sai}`)
    for (const g of container.querySelectorAll('[data-vung="nhom-cau"]')) {
      const b = g.querySelector('.mt-moc__dau') as HTMLElement
      if (b.getAttribute('aria-expanded') === 'true') for (const r of g.querySelectorAll('[data-vung="cau"]')) expect(r.getAttribute('data-kq')).toBe('sai')
    }
    fireEvent.click(screen.getByRole('button', { name: 'Chưa công bố 6' }))
    const gc = nhomTheoTen(container, /Gia đình giao/)
    expect(gc.querySelectorAll('[data-vung="cau-che"]')).toHaveLength(6)
  })

  it('CÂU BỊ CHE: "Đã làm" + lời đúng chữ; KHÔNG đề, đáp án, đúng/sai, nút lời giải — kể cả khi JSON lỡ có đáp án', () => {
    const raw = nhan(PH_OK)
    raw.homNay.cau = raw.homNay.cau.map((c: any) => (c.che ? { ...c, deRutGon: 'ĐỀ LỘ', dapAn: 'C', dung: true, qid: 'q-lo', coLoiGiai: true } : c))
    const { container } = bang(pmOf(raw))
    const gc = nhomTheoTen(container, /Gia đình giao/)
    const dong = gc.querySelectorAll('[data-vung="cau-che"]')
    expect(dong).toHaveLength(6)
    for (const d of dong) {
      expect(d.textContent).toContain('Đã làm')
      expect(d.textContent).toContain('Con đã làm · kết quả hiện sau khi con nộp bài')
      expect(d.textContent).not.toMatch(/ĐỀ LỘ|Đáp án|Đúng|Sai|Xem lời giải/)
    }
    expect(container.textContent).not.toMatch(/ĐỀ LỘ|q-lo/)
    expect(gc.querySelector('[data-vung="xem-loi-giai"]')).toBeNull()
  })

  it('≤ 40 câu ⇒ mở sẵn nhóm MỚI NHẤT có câu; > 40 câu ⇒ đóng hết, chưa dựng dòng nào; mở nhóm nào dựng nhóm đó; đóng lại thì gỡ', () => {
    const it40 = bang()
    expect(it40.container.querySelectorAll('[data-vung="nhom-cau"] .mt-moc__dau[aria-expanded="true"]')).toHaveLength(1)
    it40.unmount()
    const raw = nhan(PH_OK)
    raw.homNay.cau = Array.from({ length: 60 }, (_, i) => ({ luc: H(17, 12 + Math.floor(i / 3)), nguon: 'btvn', tenDang: 'D', deRutGon: `Đề ${i}`, dung: i % 2 === 0, giay: 30, coLoiGiai: false }))
    const { container } = bang(pmOf(raw))
    expect(container.querySelectorAll('[data-vung="cau"]')).toHaveLength(0) // chưa dựng dòng nào
    const nhom = nhomTheoTen(container, /Bài tập về nhà/)
    fireEvent.click(nhom.querySelector('.mt-moc__dau')!)
    expect(nhom.querySelectorAll('[data-vung="cau"]')).toHaveLength(60)
    fireEvent.click(nhom.querySelector('.mt-moc__dau')!)
    expect(container.querySelectorAll('[data-vung="cau"]')).toHaveLength(0)
  })

  it('bấm mốc trên dòng thời gian ⇒ mở đúng nhóm câu của mốc', () => {
    const raw = nhan(PH_OK)
    raw.homNay.cau = raw.homNay.cau.concat(Array.from({ length: 10 }, (_, i) => ({ luc: H(17, 12 + i), nguon: 'btvn', deRutGon: `Thêm ${i}`, dung: true })))
    const { container } = bang(pmOf(raw))
    const moc = [...container.querySelectorAll('.mt-tl__moc')].find((b) => /17:12/.test(b.textContent || '')) as HTMLElement
    fireEvent.click(moc)
    const nhom = nhomTheoTen(container, /17:12/)
    expect(nhom.querySelector('.mt-moc__dau')!.getAttribute('aria-expanded')).toBe('true')
  })

  it('dòng câu thường: giờ, nguồn, Đúng/Sai, dạng, đề, "Con chọn B · Đáp án B", thời gian; câu BTVN không có conChon ⇒ chỉ "Đáp án C"; KHÔNG mã câu trên màn', () => {
    const raw = nhan(PH_OK)
    raw.homNay.cau = [
      { luc: H(17, 15), nguon: 'btvn', tenDang: 'Phản ứng ester hoá', deRutGon: 'Đề A', dapAn: 'C', dung: false, giay: 65, coLoiGiai: true, qid: 'q-an' },
      { luc: H(17, 16), nguon: 'on_lai', deRutGon: 'Đề B', conChon: 'B', dapAn: 'B', dung: true, giay: 52, coLoiGiai: false },
    ]
    const { container } = bang(pmOf(raw))
    for (const b of container.querySelectorAll('[data-vung="nhom-cau"] .mt-moc__dau[aria-expanded="false"]')) fireEvent.click(b)
    const hang = [...container.querySelectorAll('[data-vung="cau"]')]
    const a = hang.find((h) => h.textContent!.includes('Đề A'))!
    expect(a.textContent).toContain('17:15')
    expect(a.textContent).toContain('Bài tập về nhà')
    expect(a.textContent).toContain('Sai')
    expect(a.textContent).toContain('Phản ứng ester hoá')
    expect(a.textContent).toContain('Đáp án C')
    expect(a.textContent).not.toContain('Con chọn')
    expect(a.textContent).toContain('1 phút 5 giây')
    const b = hang.find((h) => h.textContent!.includes('Đề B'))!
    expect(b.textContent).toContain('Con chọn B')
    expect(b.textContent).toContain('Đáp án B')
    expect(container.textContent).not.toContain('q-an')
  })

  it('LỜI GIẢI: nút chỉ khi có mã câu VÀ coLoiGiai; bấm ⇒ gọi /ph/chi-tiet-cau-ve-con, hiện đáp án + lời giải; máy chủ từ chối ⇒ LỜI THẬT; không mã câu ⇒ không nút', async () => {
    const raw = nhan(PH_OK)
    raw.homNay.cau = [
      { luc: H(17, 15), nguon: 'btvn', deRutGon: 'Có lời giải', dapAn: 'B', dung: true, coLoiGiai: true, qid: 'q-1' },
      { luc: H(17, 16), nguon: 'btvn', deRutGon: 'Chưa có mã', dapAn: 'B', dung: true, coLoiGiai: true },
      { luc: H(17, 17), nguon: 'btvn', deRutGon: 'Bị từ chối', dapAn: 'B', dung: true, coLoiGiai: true, qid: 'q-2' },
    ]
    const goi: unknown[] = []
    vi.stubGlobal('fetch', vi.fn(async (_u: string, o: any) => {
      const b = JSON.parse(o.body)
      goi.push(b)
      return { status: 200, json: async () => (b.qid === 'q-2' ? { ok: false, error: 'Ca này chưa công bố điểm nên chưa xem được lời giải.', che: 'chua_cong_bo' } : CHI_TIET) }
    }))
    const { container } = bang(pmOf(raw))
    for (const b of container.querySelectorAll('[data-vung="nhom-cau"] .mt-moc__dau[aria-expanded="false"]')) fireEvent.click(b)
    const hang = (t: string) => [...container.querySelectorAll('[data-vung="cau"]')].find((h) => h.textContent!.includes(t)) as HTMLElement
    expect(hang('Chưa có mã').querySelector('[data-vung="xem-loi-giai"]')).toBeNull()
    expect(hang('Chưa có mã').textContent).toContain('Câu này chưa có lời giải để xem.')
    fireEvent.click(hang('Có lời giải').querySelector('[data-vung="xem-loi-giai"]')!)
    await waitFor(() => expect(hang('Có lời giải').textContent).toContain('Lời giải'))
    expect(hang('Có lời giải').textContent).toContain('Đáp án')
    expect(hang('Có lời giải').querySelector('[data-vung="xem-loi-giai"]')).toBeNull()
    fireEvent.click(hang('Bị từ chối').querySelector('[data-vung="xem-loi-giai"]')!)
    await waitFor(() => expect(hang('Bị từ chối').querySelector('[role="alert"]')!.textContent).toContain('Ca này chưa công bố điểm nên chưa xem được lời giải.'))
    expect(goi).toEqual([{ sbd: '12121212', qid: 'q-1' }, { sbd: '12121212', qid: 'q-2' }])
  })

  it('gomNhomCau: câu vào mốc CÙNG NGUỒN gần nhất trước nó; không có mốc ⇒ nhóm riêng theo nguồn; mốc không câu vẫn giữ', () => {
    const pm = pmOf()
    const n = gomNhomCau(pm)
    expect(n).toHaveLength(5)
    expect(n.map((x) => x.cau.length)).toEqual([6, 12, 5, 9, 6])
    const raw = nhan(PH_OK)
    delete raw.homNay.dongThoiGian
    const r = gomNhomCau(pmOf(raw))
    expect(r.map((x) => x.ten)).toEqual(['Ôn lại câu đến lịch', 'Bài tập về nhà', 'Thử thách riêng hôm nay', 'Luyện dạng con còn vấp', 'Gói gia đình giao'])
  })

  it('ChuoiMuoiBonNgay: đủ 14 ngày kết thúc HÔM NAY (giờ VN), ngày không học ⇒ null', () => {
    const c = ChuoiMuoiBonNgay({ nhipHoc: pmOf().nhipHoc, serverNow: NAY })
    expect(c).toHaveLength(14)
    expect(c[0]!.ngay).toBe('2026-09-08')
    expect(c[13]!.ngay).toBe('2026-09-21')
    expect(c[13]!.soCau).toBe(38)
    expect(c[1]!.soCau).toBeNull() // 09/09 nghỉ
  })
})

describe('useTatCaVeCon — nhịp 60 giây, giữ bản cũ khi lỗi', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())
  const { renderHook } = require('@testing-library/react')
  const chay = async (ms: number) => act(async () => void (await vi.advanceTimersByTimeAsync(ms)))
  it('nạp ngay; lỗi lần đầu ⇒ trạng thái loi + chữ thật; thuLai nạp lại; thành công ⇒ ok; lỗi sau đó GIỮ bản cũ; sbd null ⇒ không gọi', async () => {
    const api = vi.fn().mockResolvedValueOnce({ kieu: 'loi', chu: 'Chưa nối được' }).mockResolvedValueOnce({ kieu: 'ok', pm: pmOf() }).mockResolvedValue({ kieu: 'loi', chu: 'Lại lỗi' })
    const { result } = renderHook(() => useTatCaVeCon('12121212', api))
    await chay(0)
    expect(result.current.trangThai).toBe('loi')
    expect(result.current.chuLoi).toBe('Chưa nối được')
    await act(async () => result.current.thuLai())
    await chay(0)
    expect(result.current.trangThai).toBe('ok')
    await chay(NHIP_PH_MOI_MS)
    expect(api).toHaveBeenCalledTimes(3)
    expect(result.current.trangThai).toBe('ok') // lỗi nhất thời: giữ bản cũ
    expect(result.current.pm).toBeTruthy()
    const ko = vi.fn()
    renderHook(() => useTatCaVeCon(null, ko))
    await chay(NHIP_PH_MOI_MS)
    expect(ko).not.toHaveBeenCalled()
  })
})

describe('ParentPortalScreen thật — màn chính → bảng → về; MỘT nút', () => {
  const dung = () => {
    const goi: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (url: string, o?: any) => {
      const u = String(url).replace('https://may.test', '')
      goi.push(`${u} ${o?.body ?? ''}`)
      const js = (t: unknown) => ({ ok: true, status: 200, json: async () => t, text: async () => JSON.stringify(t) })
      if (u === '/ph/tat-ca-ve-con') return js(PH_OK)
      if (u === '/ph/chi-tiet-cau-ve-con') return js(CHI_TIET)
      if (u === '/ph/giao-them') return js({ ok: true, conLaiHomNay: 2 })
      return js({ ok: true, items: [], winners: [] })
    }))
    return goi
  }
  beforeEach(() => {
    window.history.replaceState(null, '', '/?vai=phuhuynh')
    localStorage.setItem('omr_ph_sbd', '12121212')
  })

  it('vào bằng SBD trần: màn chính có dữ liệu; đúng MỘT nút chính; bấm thẻ Hôm nay ⇒ bảng (gói lười) ⇒ ← về màn chính; thẻ ca ⇒ bảng; không gọi lệnh của luồng cũ', async () => {
    const goi = dung()
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="hom-nay"]')).toBeTruthy())
    expect(container.querySelectorAll('.mt-nut--chinh')).toHaveLength(1)
    expect(container.textContent).toContain('Con: Nguyễn Minh Khôi')
    expect(container.textContent).toContain('Thầy nhắc con nộp bài trước 12:00.') // dải cảnh báo
    fireEvent.click(container.querySelector('[data-vung="hom-nay"]')!)
    await screen.findByRole('heading', { name: 'Mọi thứ về con' })
    expect(container.querySelector('[data-vung="bang-moi-thu"]')).toBeTruthy()
    expect(container.querySelector('[data-vung="man-chinh-ph"]')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Về màn chính' }))
    await waitFor(() => expect(container.querySelector('[data-vung="man-chinh-ph"]')).toBeTruthy())
    fireEvent.click(container.querySelector('[data-vung="ca-gan-nhat"]')!)
    await screen.findByRole('heading', { name: 'Mọi thứ về con' })
    expect(goi.filter((g) => /parent-news|mom\/|hs\/lich-su|hs\/ke-hoach|hs\/btvn|hs\/cau-sai/.test(g))).toEqual([])
    expect(goi.filter((g) => g.startsWith('/ph/tat-ca-ve-con'))[0]).toBe('/ph/tat-ca-ve-con {"sbd":"12121212"}')
  }, 30000)

  it('bấm "Giao thêm bài cho con" ⇒ /ph/giao-them; "Đổi số báo danh" ⇒ về đăng nhập, xoá SBD nhớ', async () => {
    const goi = dung()
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="luot-giao"]')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: 'Giao thêm bài cho con' }))
    await waitFor(() => expect(goi.filter((g) => g.startsWith('/ph/giao-them')).length).toBeGreaterThanOrEqual(2))
    fireEvent.click(screen.getByRole('button', { name: 'Đổi số báo danh' }))
    await screen.findByRole('button', { name: 'Vào xem kết quả của con' })
    expect(localStorage.getItem('omr_ph_sbd')).toBeNull()
  }, 30000)

  it('máy chủ lỗi ("Không tìm thấy số báo danh của con.") ⇒ màn chính báo lời thật + Thử lại; nút giao vẫn còn', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (String(url).endsWith('/ph/tat-ca-ve-con') ? { ok: false, status: 500, json: async () => ({ ok: false, error: 'Không tìm thấy số báo danh của con.' }), text: async () => '' } : { ok: true, status: 200, json: async () => ({ ok: true, items: [] }), text: async () => '{}' })))
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="loi-tai"]')).toBeTruthy())
    expect(container.querySelector('[data-vung="loi-tai"]')!.textContent).toContain('Không tìm thấy số báo danh của con.')
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Giao thêm bài cho con' })).toBeTruthy()
  }, 30000)
})

describe('khoá nguồn', () => {
  it('bảng là GÓI TẢI LƯỜI: ParentPortalScreen dùng lazy(() => import(...BangMoiThu)) và KHÔNG import tĩnh BangMoiThu / ChemText; ManChinh không kéo ChemText', () => {
    const p = doc('src/screens/ParentPortalScreen.tsx')
    expect(p).toContain("lazy(() => import('../components/ph-moi/BangMoiThu'))")
    expect(p).not.toMatch(/import\s+BangMoiThu\s+from/)
    expect(p).not.toContain('chem-format')
    expect(doc('src/components/ph-moi/ManChinh.tsx')).not.toContain('chem-format')
    expect(doc('src/components/ph-moi/BangMoiThu.tsx')).toContain("import { ChemText } from '../../lib/chem-format'")
  })
})
