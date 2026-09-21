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

describe('ManChinh — màn chính kiểu Apple, phương án B "Widget"', () => {
  const ve = (v: ReturnType<typeof view>, p: Record<string, unknown> = {}) =>
    render(<ManChinh v={v} tenCon="Khôi" lop="12 - Tinh Hoa" sbd="12121212" now={NAY} canhBao={[]} onCanhBaoDaXem={() => {}} giaoThem={giaoThemMau() as any} onMoBang={() => {}} onDoiSbd={() => {}} {...(p as object)} />)
  const cacO = (c: HTMLElement, sel: string) => [...c.querySelectorAll(sel)].map((l) => l.textContent)
  const voiViec = (xong: number, tong: number) => {
    const raw = nhan(PH_OK)
    raw.homNay.tongQuan.viecXong = xong
    raw.homNay.tongQuan.viecTong = tong
    return raw
  }

  it('có dữ liệu: tiêu đề lớn + "Tên con · Lớp"; widget lớn (đạt, ba số CÓ NHÃN, giờ học gần nhất); widget Ca kiểm tra gần nhất (7,5/10, Hơn 0,75 điểm so với lần trước của chính con); widget Học đều (6 ngày liên tục + 7 chấm)', () => {
    const { container } = ve(view(pmOf()))
    expect(container.querySelector('h1')!.textContent).toBe('Chào anh/chị')
    expect(container.querySelector('.phm-ap-dau__nho')!.textContent).toBe('Thầy Đỗ Đại Học')
    expect(container.querySelector('.phm-ap-dau__con')!.textContent).toBe('Nguyễn Minh Khôi · Lớp 12 - Tinh Hoa')
    const hn = container.querySelector('[data-vung="hom-nay"]') as HTMLElement
    expect(hn.querySelector('h2')!.textContent).toBe('Hôm nay của con')
    expect(hn.textContent).toContain('Thứ Hai 21/09')
    expect(hn.textContent).toContain('Con đã đạt nhiệm vụ hôm nay')
    expect(hn.textContent).toContain('Học gần nhất lúc 20:47')
    expect(cacO(hn, '.phm-ap-ba li')).toEqual(['38câu đã làm', '79%câu đúng', '52phút học'])
    const ca = container.querySelector('[data-vung="ca-gan-nhat"]') as HTMLElement
    expect(ca.querySelector('h2')!.textContent).toBe('Ca kiểm tra gần nhất')
    expect(ca.querySelector('.phm-ap-w-nho__so')!.textContent).toBe('7,5/10 điểm')
    expect(ca.querySelector('.phm-ap-w-nho__so')!.getAttribute('aria-label')).toBe('7,5 trên 10 điểm')
    expect(ca.querySelector('.phm-ap-w-nho__phu b')!.textContent).toBe('Thứ Bảy 19/09')
    expect(ca.textContent).toContain('Hơn 0,75 điểm so với lần trước của chính con')
    expect(ca.textContent).toContain('Kiểm tra 45 phút · Ester – Lipid') // tên ca cho người đọc màn hình (không hiện)
    const deu = container.querySelector('[data-vung="hoc-deu"]') as HTMLElement
    expect(deu.querySelector('.phm-ap-w-nho__so')!.textContent).toBe('6ngày liên tục')
    expect(deu.querySelectorAll('.phm-ap-7 i')).toHaveLength(7)
    expect(deu.querySelectorAll('.phm-ap-7 i[data-nghi]')).toHaveLength(1) // 15/09 không học
    expect(deu.querySelector('.phm-ap-7')!.getAttribute('aria-label')).toBe('7 ngày gần đây: con học 6 ngày, nghỉ 1 ngày')
    expect(deu.textContent).toContain('Từ 15/09 đến hôm nay')
    expect(container.querySelector('.phm-ap-hai')!.hasAttribute('data-mot')).toBe(false)
  })

  it('vòng "N/M việc đã xong" CHỈ khi máy chủ trả cả viecXong và viecTong; thiếu ⇒ vòng chỉ nói đạt / chưa đạt (không bịa số việc)', () => {
    const co = ve(view(pmOf(voiViec(3, 4)))).container.querySelector('.phm-ap-vong') as HTMLElement
    expect(co.textContent).toBe('3/4việc đã xong')
    expect(co.getAttribute('aria-label')).toBe('Nhiệm vụ hôm nay: xong 3 trong 4 việc')
    expect(co.hasAttribute('data-dat')).toBe(false) // chưa xong hết ⇒ chưa xanh lá
    const cung = (co.querySelector('.phm-ap-vong__tien') as SVGCircleElement).getAttribute('stroke-dasharray')!.split(' ').map(Number)
    expect(cung[0]! / cung[1]!).toBeCloseTo(0.75, 2) // cung 3/4 vòng
    cleanup()
    const rong = ve(view(pmOf(voiViec(0, 4)))).container.querySelector('.phm-ap-vong') as HTMLElement
    expect(rong.querySelector('.phm-ap-vong__tien')).toBeNull() // 0/4: chỉ vòng nền
    expect(rong.textContent).toBe('0/4việc đã xong')
    cleanup()
    const dayDu = ve(view(pmOf(voiViec(4, 4)))).container.querySelector('.phm-ap-vong') as HTMLElement
    expect(dayDu.hasAttribute('data-dat')).toBe(true)
    cleanup()
    const khong = ve(view(pmOf())).container.querySelector('.phm-ap-vong') as HTMLElement
    expect(khong.textContent).toBe('') // chỉ biểu tượng
    expect(khong.getAttribute('aria-label')).toBe('Nhiệm vụ hôm nay: đã đạt')
    expect(khong.hasAttribute('data-dat')).toBe(true)
    cleanup()
    const xau = voiViec(5, 4) // vô lý: xong > tổng ⇒ bỏ cả hai
    const v = ve(view(pmOf(xau))).container.querySelector('.phm-ap-vong') as HTMLElement
    expect(v.textContent).not.toMatch(/\d\/\d/)
  })

  it('chỉ MỘT đích chạm trong thân màn: thẻ rời "Xem mọi thứ về con" ⇒ mở bảng; widget Hôm nay / Ca / Học đều KHÔNG phải nút', () => {
    const onMoBang = vi.fn()
    const { container } = ve(view(pmOf()), { onMoBang })
    for (const v of ['hom-nay', 'ca-gan-nhat', 'hoc-deu']) expect((container.querySelector(`[data-vung="${v}"]`) as HTMLElement).querySelector('button, a')).toBeNull()
    const nut = [...container.querySelectorAll('main button')].filter((b) => /Xem mọi thứ về con/.test(b.textContent || ''))
    expect(nut).toHaveLength(1)
    expect(nut[0]!.textContent).toContain('Từng câu, điểm mạnh, dạng còn vấp')
    fireEvent.click(nut[0]!)
    expect(onMoBang).toHaveBeenCalledTimes(1)
    expect(onMoBang).toHaveBeenLastCalledWith()
  })

  it('nút tròn chữ cái đầu tên con ⇒ menu nổi có ĐÚNG MỘT mục "Đổi số báo danh" + "Đang xem: số báo danh … của con" + số bản (chữ nhỏ); đóng bằng Esc / bấm ngoài; bấm mục ⇒ onDoiSbd và đóng; màn KHÔNG còn dòng "Bản app" ngoài menu', () => {
    const onDoiSbd = vi.fn()
    const { container } = ve(view(pmOf()), { onDoiSbd })
    expect(container.textContent).not.toMatch(/Bản app|Bản chạy thử/)
    expect(container.querySelector('[role="menu"]')).toBeNull()
    const anh = screen.getByRole('button', { name: 'Tài khoản: mở để đổi số báo danh' })
    expect(anh.textContent).toBe('K')
    expect(anh.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(anh)
    expect(anh.getAttribute('aria-expanded')).toBe('true')
    const menu = container.querySelector('[role="menu"]') as HTMLElement
    expect(within(menu).getAllByRole('menuitem')).toHaveLength(1)
    expect(within(menu).getByRole('menuitem').textContent).toBe('Đổi số báo danh')
    expect(menu.textContent).toContain('Đang xem: số báo danh 12121212 của con')
    expect(menu.querySelector('[data-vung="ban-app"]')!.textContent).toBe(chuBanApp())
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(container.querySelector('[role="menu"]')).toBeNull()
    fireEvent.click(anh)
    fireEvent.click(screen.getByRole('button', { name: 'Đóng menu' }))
    expect(container.querySelector('[role="menu"]')).toBeNull()
    fireEvent.click(anh)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Đổi số báo danh' }))
    expect(onDoiSbd).toHaveBeenCalledTimes(1)
    expect(container.querySelector('[role="menu"]')).toBeNull()
  })

  it('con chưa có tên ⇒ nút tài khoản vẫn còn (hình người) để còn "Đổi số báo danh"; không tên không lớp ⇒ không dòng phụ', () => {
    const { container } = ve(view(null, 'tai'), { tenCon: '', lop: '' })
    expect(container.querySelector('.phm-ap-anh svg')).toBeTruthy()
    expect(container.querySelector('.phm-ap-dau__con')).toBeNull()
  })

  it('ca CHƯA công bố: "—" + "Thầy chưa công bố điểm" (chờ cả lớp nói cho người đọc màn hình); KHÔNG điểm, KHÔNG so sánh', () => {
    const { container } = ve(view(pmOf(PH_CHUA_CB)))
    const ca = container.querySelector('[data-vung="ca-gan-nhat"]') as HTMLElement
    expect(ca.querySelector('.phm-ap-w-nho__so')!.textContent).toBe('—')
    expect(ca.querySelector('[data-vung="chua-cong-bo"]')!.textContent).toBe('Thầy chưa công bố điểm')
    expect(ca.textContent).toContain('Điểm hiện khi cả lớp nộp xong (27/32 em đã nộp).')
    expect(ca.textContent).not.toMatch(/7,5|Hơn|so với lần trước|\/10 điểm/)
  })

  it('KHÔNG có ca gần nhất: ô "Ca kiểm tra gần nhất" VẪN hiện với trạng thái trống nói thật ("Chưa có ca kiểm tra nào" + "Điểm sẽ hiện ở đây sau khi thầy công bố"), không số bịa; "Học đều" giữ ô bên phải (lưới hai ô không đổi); thiếu cả Học đều ⇒ ô Ca một mình cả hàng', () => {
    const raw = nhan(PH_OK)
    delete raw.caGanNhat
    const { container } = ve(view(pmOf(raw)))
    const ca = container.querySelector('[data-vung="ca-gan-nhat"]') as HTMLElement
    expect(ca).toBeTruthy()
    expect(ca.hasAttribute('data-trong')).toBe(true)
    expect(ca.querySelector('h2')!.textContent).toBe('Ca kiểm tra gần nhất')
    expect(ca.querySelector('.phm-ap-w-nho__so')!.textContent).toBe('—')
    expect(ca.textContent).toContain('Chưa có ca kiểm tra nào')
    expect(ca.textContent).toContain('Điểm sẽ hiện ở đây sau khi thầy công bố')
    expect(ca.textContent).not.toMatch(/\d+,?\d*\/10|Hơn|Kém|so với lần trước/)
    expect(container.querySelector('.phm-ap-hai')!.hasAttribute('data-mot')).toBe(false)
    expect(container.querySelector('[data-vung="hoc-deu"]')).toBeTruthy()
    cleanup()
    delete raw.nhipHoc
    raw.homNay.tongQuan.chuoiNgayHoc = undefined
    const trong = ve(view(pmOf(raw))).container
    expect(trong.querySelector('[data-vung="ca-gan-nhat"]')).toBeTruthy()
    expect(trong.querySelector('[data-vung="hoc-deu"]')).toBeNull()
    expect(trong.querySelector('.phm-ap-hai')!.hasAttribute('data-mot')).toBe(true)
    expect(trong.querySelector('[data-vung="xem-tat-ca"]')).toBeTruthy()
  })

  it('hôm nay con chưa học: câu nói thật + gợi ý giao thêm; KHÔNG ba số, KHÔNG vòng, KHÔNG ô Học đều; ô Ca ở trạng thái trống', () => {
    const { container } = ve(view(pmOf(PH_TRONG)))
    expect(container.textContent).toContain('Hôm nay con chưa học')
    expect(container.textContent).toContain('Anh/chị có thể giao thêm bài cho con.')
    expect(container.querySelector('.phm-ap-ba')).toBeNull()
    expect(container.querySelector('.phm-ap-vong')).toBeNull()
    expect(container.querySelector('[data-vung="ca-gan-nhat"]')!.hasAttribute('data-trong')).toBe(true)
    expect(container.querySelector('[data-vung="hoc-deu"]')).toBeNull()
    expect(container.querySelector('[data-vung="trang-thai-nhiem-vu"]')).toBeNull()
  })

  it('chưa đạt nhiệm vụ / phần trăm chỉ khi có số; câu đã làm 0 ⇒ coi như chưa học; chuỗi 0 ngày nói thật "0 ngày liên tục"', () => {
    const raw = nhan(PH_OK)
    raw.homNay.tongQuan = { soCau: 12, soDung: 6, phutHoc: 20, datNhiemVu: false, chuoiNgayHoc: 0 }
    const { container } = ve(view(pmOf(raw)))
    expect(container.textContent).toContain('Con chưa đạt nhiệm vụ hôm nay')
    expect(cacO(container, '.phm-ap-ba li')).toEqual(['12câu đã làm', '50%câu đúng', '20phút học'])
    expect(container.querySelector('[data-vung="hoc-deu"] .phm-ap-w-nho__so')!.textContent).toBe('0ngày liên tục')
    expect(container.querySelector('.phm-ap-vong')!.getAttribute('aria-label')).toBe('Nhiệm vụ hôm nay: chưa đạt')
    cleanup()
    raw.homNay.tongQuan = { soCau: 0, phutHoc: 0 }
    expect(ve(view(pmOf(raw))).container.textContent).toContain('Hôm nay con chưa học')
  })

  it('đang tải ⇒ khung xương (role=status), chưa widget nào; lỗi ⇒ lời thật của máy chủ (role=alert) + "Thử lại" gọi lại; nút giao vẫn ở đáy', () => {
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

  it('MỘT nút hành động chính ("Giao thêm bài cho con", trên thanh đáy); dòng lượt "Hôm nay còn 2 lượt giao"; hết lượt ⇒ nút mờ + "mai giao tiếp được"; không chữ game; không emoji', () => {
    const { container } = ve(view(pmOf()))
    const nut = container.querySelectorAll('[data-vung="giao-them"]')
    expect(nut).toHaveLength(1)
    expect(nut[0]!.textContent).toBe('Giao thêm bài cho con')
    expect(nut[0]!.closest('.phm-ap-day')).toBeTruthy()
    expect(container.querySelector('[data-vung="luot-giao"]')!.textContent).toBe('Hôm nay còn 2 lượt giao · A.I Đỗ Đại Học chọn câu hợp với con')
    expect(container.textContent).not.toMatch(CAM_GAME)
    expect(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(container.textContent || '')).toBe(false)
    cleanup()
    const het = ve(view(pmOf()), { giaoThem: giaoThemMau({ conLai: 0 }) })
    expect((het.container.querySelector('[data-vung="giao-them"]') as HTMLButtonElement).disabled).toBe(true)
    expect(het.container.querySelector('[data-vung="luot-giao"]')!.textContent).toBe('Hôm nay đã giao đủ 3 lượt, mai giao tiếp được')
    fireEvent.click(het.container.querySelector('[data-vung="giao-them"]')!)
  })

  it('bấm nút ⇒ giao(); thẻ kết quả (đã giao / từ chối / lỗi thật) hiện NGAY TRÊN nút với role đúng; đã giao ⇒ dòng lượt nằm trong thẻ, không lặp dưới nút', () => {
    const giao = vi.fn()
    const { container, rerender } = ve(view(pmOf()), { giaoThem: giaoThemMau({ giao }) })
    fireEvent.click(screen.getByRole('button', { name: 'Giao thêm bài cho con' }))
    expect(giao).toHaveBeenCalledTimes(1)
    const props = { v: view(pmOf()), tenCon: 'Khôi', lop: '', sbd: '12121212', now: NAY, canhBao: [], onCanhBaoDaXem: () => {}, onMoBang: () => {}, onDoiSbd: () => {} }
    const the = { kieu: 'loi', tieuDe: 'Chưa giao được bài', dong: ['Cần liên kết riêng của con.'], cuoi: '' }
    rerender(<ManChinh {...props} giaoThem={giaoThemMau({ the }) as any} />)
    const t = container.querySelector('[data-vung="the-giao-them"]') as HTMLElement
    expect(t.getAttribute('role')).toBe('alert')
    expect(t.textContent).toContain('Cần liên kết riêng của con.')
    expect(t.compareDocumentPosition(container.querySelector('[data-vung="giao-them"]')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    const daGiao = { kieu: 'da_giao', tieuDe: 'Đã giao cho con 6 câu, khoảng 8 phút', dong: ['A.I Đỗ Đại Học đã chọn 6 câu hợp với con hôm nay.'], cuoi: 'Hôm nay còn 1 lượt giao' }
    rerender(<ManChinh {...props} giaoThem={giaoThemMau({ the: daGiao, conLai: 1 }) as any} />)
    const d = container.querySelector('[data-vung="the-giao-them"]') as HTMLElement
    expect(d.getAttribute('role')).toBe('status')
    expect(d.textContent).toContain('Đã giao cho con 6 câu, khoảng 8 phút')
    expect(container.querySelector('[data-vung="luot-giao"]')).toBeNull()
    expect(container.textContent!.match(/Hôm nay còn 1 lượt giao/g)).toHaveLength(1)
  })

  it('BIÊN dữ liệu thưa: số nào máy chủ không trả thì ẨN đúng ô đó — chỉ có "đạt" ⇒ vẫn thấy trạng thái; thiếu số câu đúng ⇒ không dòng %; ngày 0 câu là ngày nghỉ; Học đều thiếu một vế vẫn dựng vế còn lại', () => {
    const chiDat = nhan(PH_OK)
    chiDat.homNay.tongQuan = { datNhiemVu: true }
    expect(ve(view(pmOf(chiDat))).container.querySelector('[data-vung="trang-thai-nhiem-vu"]')!.textContent).toContain('Con đã đạt nhiệm vụ hôm nay')
    cleanup()
    const thieuDung = nhan(PH_OK)
    thieuDung.homNay.tongQuan = { soCau: 5, phutHoc: 10, datNhiemVu: true }
    expect(cacO(ve(view(pmOf(thieuDung))).container, '.phm-ap-ba li')).toEqual(['5câu đã làm', '10phút học'])
    cleanup()
    const ngay0 = nhan(PH_OK)
    ngay0.nhipHoc.ngay = ngay0.nhipHoc.ngay.map((n: { ngay: string; soCau: number; soCauDung: number }) => (n.ngay === '2026-09-20' ? { ...n, soCau: 0, soCauDung: 0 } : n))
    expect(ve(view(pmOf(ngay0))).container.querySelectorAll('.phm-ap-7 i[data-nghi]')).toHaveLength(2) // 15/09 vắng + 20/09 có dòng nhưng 0 câu
    cleanup()
    const chiChuoi = nhan(PH_OK)
    delete chiChuoi.nhipHoc
    const c1 = ve(view(pmOf(chiChuoi))).container.querySelector('[data-vung="hoc-deu"]') as HTMLElement
    expect(c1.querySelector('.phm-ap-w-nho__so')!.textContent).toBe('6ngày liên tục')
    expect(c1.querySelector('.phm-ap-7')).toBeNull() // không có nhịp ⇒ không chấm
    cleanup()
    const chiNhip = nhan(PH_OK)
    chiNhip.homNay.tongQuan.chuoiNgayHoc = undefined
    const c2 = ve(view(pmOf(chiNhip))).container.querySelector('[data-vung="hoc-deu"]') as HTMLElement
    expect(c2.querySelector('.phm-ap-w-nho__so')!.textContent).toBe('6/7 ngày gần đây') // không có chuỗi do máy chủ tính ⇒ chỉ nói số ngày học trong 7 ngày
    expect(c2.querySelectorAll('.phm-ap-7 i')).toHaveLength(7)
  })

  it('BIÊN ca: chưa công bố thì KHÔNG bao giờ hiện điểm dù gói tin có mang điểm; thiếu điểm lần trước ⇒ không dòng so sánh; bằng lần trước / kém lần trước nói đúng', () => {
    const roRi = pmOf(PH_CHUA_CB)
    roRi.caGanNhat!.ketQua = { tong: 9, soCau: 28, soCauDung: 25 }
    const a = ve(view(roRi)).container.querySelector('[data-vung="ca-gan-nhat"]') as HTMLElement
    expect(a.textContent).not.toMatch(/\/10 điểm|so với lần trước/)
    expect(a.querySelector('.phm-ap-w-nho__so')!.textContent).toBe('—')
    cleanup()
    const thieuTruoc = pmOf()
    thieuTruoc.caGanNhat!.truoc = { tong: null, doi: 0.5 }
    expect(ve(view(thieuTruoc)).container.querySelector('[data-vung="ca-gan-nhat"]')!.textContent).not.toMatch(/Hơn|Kém|Bằng lần trước/)
    cleanup()
    const bang = pmOf()
    bang.caGanNhat!.truoc = { tong: 7.5, doi: 0 }
    expect(ve(view(bang)).container.querySelector('[data-vung="ca-gan-nhat"]')!.textContent).toContain('Bằng lần trước của chính con')
    cleanup()
    const kem = pmOf()
    kem.caGanNhat!.truoc = { tong: 8.25, doi: -0.75 }
    expect(ve(view(kem)).container.querySelector('[data-vung="ca-gan-nhat"]')!.textContent).toContain('Kém 0,75 điểm so với lần trước của chính con')
  })

  it('BIÊN tiêu đề + menu: chỉ tên ⇒ không dấu chấm thừa; chỉ lớp ⇒ "Lớp …"; không có số báo danh ⇒ không dòng "Đang xem"; bấm nút tròn lần hai ⇒ đóng', () => {
    const a = ve(view(pmOf()), { lop: '', sbd: '' })
    expect(a.container.querySelector('.phm-ap-dau__con')!.textContent).toBe('Nguyễn Minh Khôi')
    const anh = screen.getByRole('button', { name: 'Tài khoản: mở để đổi số báo danh' })
    fireEvent.click(anh)
    expect(a.container.querySelector('[role="menu"]')!.textContent).not.toContain('Đang xem')
    fireEvent.click(anh)
    expect(a.container.querySelector('[role="menu"]')).toBeNull()
    a.unmount()
    const b = ve(view(null, 'tai'), { tenCon: '', lop: '12 - Tinh Hoa' })
    expect(b.container.querySelector('.phm-ap-dau__con')!.textContent).toBe('Lớp 12 - Tinh Hoa')
  })

  it('thanh đáy: đang gửi ⇒ nút "Đang chọn câu…" mờ + aria-busy và ẩn thẻ kết quả cũ; dòng "gói gần nhất" chỉ khi KHÔNG có thẻ kết quả; thẻ lỗi/từ chối dùng biểu tượng chấm than, thẻ đã giao dùng dấu tích', () => {
    const goi = { luc: '2026-09-21T12:40:00Z', soCau: 6, soDaLam: 2, soDung: null }
    const a = ve(view(pmOf()), { giaoThem: giaoThemMau({ goiGanNhat: goi }) }).container
    expect(a.querySelector('[data-vung="goi-gan-nhat"]')!.textContent).toBe('Con đã làm 2/6 câu của gói 19:40')
    cleanup()
    const the = { kieu: 'tu_choi', tieuDe: 'Chưa giao thêm bài lúc này', dong: ['Con còn bài bắt buộc chưa xong hôm nay.'], cuoi: 'Anh/chị chưa mất lượt nào.' }
    const b = ve(view(pmOf()), { giaoThem: giaoThemMau({ goiGanNhat: goi, the }) }).container
    expect(b.querySelector('[data-vung="goi-gan-nhat"]')).toBeNull()
    expect(b.querySelector('[data-vung="the-giao-them"]')!.getAttribute('role')).toBe('status')
    expect(b.querySelector('[data-vung="the-giao-them"] svg path[d="M12 7.6v5.4"]')).toBeTruthy() // chấm than
    cleanup()
    const daGiao = { kieu: 'da_giao', tieuDe: 'Đã giao cho con 6 câu', dong: [], cuoi: '' }
    const c = ve(view(pmOf()), { giaoThem: giaoThemMau({ the: daGiao }) }).container
    expect(c.querySelector('[data-vung="the-giao-them"] svg path[d="m8 12.4 2.8 2.8 5.2-6"]')).toBeTruthy() // dấu tích
    cleanup()
    const dang = ve(view(pmOf()), { giaoThem: giaoThemMau({ dangGui: true, the, goiGanNhat: goi }) }).container
    const nut = dang.querySelector('[data-vung="giao-them"]') as HTMLButtonElement
    expect(nut.textContent).toBe('Đang chọn câu…')
    expect(nut.disabled).toBe(true)
    expect(nut.getAttribute('aria-busy')).toBe('true')
    expect(dang.querySelector('[data-vung="the-giao-them"]')).toBeNull()
    expect(dang.querySelector('[data-vung="goi-gan-nhat"]')).toBeNull()
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

describe('useTatCaVeCon — nhịp 180 giây ± 30 giây, giữ bản cũ khi lỗi', () => {
  let ngauNhien: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    vi.useFakeTimers()
    ngauNhien = vi.spyOn(Math, 'random').mockReturnValue(0.5) // độ lệch đúng 0 ⇒ nhịp chính xác 180 giây
  })
  afterEach(() => {
    ngauNhien.mockRestore()
    vi.useRealTimers()
  })
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

  it('vào bằng SBD trần: màn chính có dữ liệu; đúng MỘT nút chính; bấm thẻ "Xem mọi thứ về con" ⇒ bảng (gói lười) ⇒ ← về màn chính ⇒ bấm lại được; không gọi lệnh của luồng cũ', async () => {
    const goi = dung()
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="hom-nay"]')).toBeTruthy())
    expect(container.querySelectorAll('[data-vung="giao-them"]')).toHaveLength(1)
    expect(container.querySelector('.phm-ap-dau__con')!.textContent).toBe('Nguyễn Minh Khôi · Lớp 12 - Tinh Hoa')
    expect(container.textContent).toContain('Thầy nhắc con nộp bài trước 12:00.') // dải cảnh báo
    fireEvent.click(container.querySelector('[data-vung="xem-tat-ca"]')!)
    await screen.findByRole('heading', { name: 'Mọi thứ về con' })
    expect(container.querySelector('[data-vung="bang-moi-thu"]')).toBeTruthy()
    expect(container.querySelector('[data-vung="man-chinh-ph"]')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại màn Hôm nay' }))
    await waitFor(() => expect(container.querySelector('[data-vung="man-chinh-ph"]')).toBeTruthy())
    fireEvent.click(container.querySelector('[data-vung="xem-tat-ca"]')!)
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
    fireEvent.click(screen.getByRole('button', { name: 'Tài khoản: mở để đổi số báo danh' }))
    expect(screen.getByRole('menu').textContent).toContain('Đang xem: số báo danh 12121212 của con')
    fireEvent.click(screen.getByRole('menuitem', { name: 'Đổi số báo danh' }))
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
    expect(doc('src/components/ph-moi/BangMoiThu.tsx')).toContain("export { default } from './bang/VoBang'") // tệp cửa vào chỉ xuất lại
    expect(doc('src/components/ph-moi/bang/TungCau.tsx')).toContain("import { ChemText } from '../../../lib/chem-format'") // ChemText chỉ vào gói bảng (TungCau), không vào màn chính
    for (const f of ['ManChinh.tsx', 'ThanhDayAp.tsx', 'BieuTuongAp.tsx']) expect(doc(`src/components/ph-moi/${f}`), f).not.toContain('chem-format')
  })
  it('phông Inter CHỈ cho app phụ huynh: @font-face trong ph-apple.css (swap, latin + vietnamese, tổng ≤ 150 KB), CSS ấy chỉ được nhập bởi màn chính; Inter đứng TRƯỚC system-ui; không precache; kèm giấy phép OFL', () => {
    const css = doc('src/components/ph-moi/ph-apple.css')
    expect(css.match(/@font-face\s*\{[^}]*font-family: "Inter"[^}]*font-display: swap/g)).toHaveLength(2)
    const tep = [...css.matchAll(/url\("\.\/phong\/([\w-]+\.woff2)"\)/g)].map((m) => m[1]!)
    expect([...new Set(tep)].sort()).toEqual(['inter-latin-wght-normal.woff2', 'inter-vietnamese-wght-normal.woff2'])
    const kb = [...new Set(tep)].reduce((t, f) => t + fs.statSync(path.join(process.cwd(), 'src/components/ph-moi/phong', f)).size, 0) / 1024
    expect(kb).toBeLessThanOrEqual(150)
    expect(css.indexOf('"Inter"', css.indexOf('--phm-ap-phong:'))).toBeLessThan(css.indexOf('system-ui', css.indexOf('--phm-ap-phong:')))
    expect(css).not.toMatch(/SF Pro[^;]*\.woff|url\([^)]*SF-?Pro/i) // không nhúng phông của Apple
    expect(doc('src/components/ph-moi/phong/INTER-OFL-LICENSE.txt')).toMatch(/SIL OPEN FONT LICENSE Version 1\.1/)
    expect(doc('vite.config.ts')).toContain("'**/inter-*-wght-normal-*.woff2'") // không ép vào precache vỏ
    const ai: string[] = []
    const duyet = (d: string) => {
      for (const e of fs.readdirSync(path.join(process.cwd(), d), { withFileTypes: true })) {
        const q = `${d}/${e.name}`
        if (e.isDirectory()) {
          if (e.name !== 'node_modules' && e.name !== 'graphify-out') duyet(q)
        } else if (/\.(tsx?|css)$/.test(e.name) && /import\s+['"][^'"]*ph-apple\.css['"]/.test(doc(q))) ai.push(q)
      }
    }
    duyet('src')
    expect(ai.sort()).toEqual(['src/components/ph-moi/ManChinh.tsx', 'src/components/ph-moi/ThanhDayAp.tsx', 'src/components/ph-moi/bang/VoBang.tsx']) // chỉ các cửa vào của app phụ huynh
  })
})
