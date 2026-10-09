// OMNI 3 · APP PHỤ HUYNH (05/10) — các số OMNI khi `/ph/hoc-2` kèm `omni` (docs/hop-dong-omni-3.md mục C, kiểu PhOmni).
// SỬA CÓ CHỦ Ý — bản vẽ tối giản thầy chốt 09/10 (thay thứ tự 01/10): thẻ "Chiến dịch của con" ở Hôm nay ĐÃ BỎ (khoá HTML nguyên thẻ f189d2b không còn chỗ áp);
// các dòng OMNI về đúng chỗ của bản vẽ, MỖI SỐ MỘT CHỖ:
//   Hôm nay  — giờ học (khi máy chủ không có giờ học quen) trong khối chính; "Cần thầy chữa: N chỗ" + tên dạng cần vững (khi không có dạng luyện thêm) ở khối (c);
//   Tiến bộ  — khoảng cách tới 8 (chỉ khi đã hiệu chuẩn) + chứng chỉ Sẵn sàng 8+ dưới đường điểm; Sơ ý của con (mục tiêu dưới 7%) một thẻ.
// Khoá: (1) vắng `omni` / omni không có số thật ⇒ không dòng OMNI nào, không số 0 giả; (2) có omni ⇒ đúng chữ, đúng chỗ; (3) độ tin không bao giờ 100%;
// (4) không chữ game, không chữ A.I trên màn phụ huynh; (5) lớp đọc chặt từng trường.
// Tệp .ts (không JSX) để lọt mẫu cổng `tests/omni-3-*.test.ts` của đặc tả mục 8.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import ParentPortalScreen from '../src/screens/ParentPortalScreen'
import { docHoc2, docOmniPh } from '../src/lib/ph-v3/du-lieu'
import { SO_Y_MUC_TIEU, chuPhSoY, dongDiemOmni } from '../src/components/ph-v3/ManTienBo'
import { THAM_SO_OMNI, type PhOmni } from '../server/src/omni-kieu'
import { PH_OK } from './_ph-moi/du-lieu-mau'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrl: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({ ...(await original<any>()), tenTheoSbd: async () => ({ sbd: '12121212', hoTen: 'Nguyễn Minh Khôi', lop: '12A1', tenCa: '' }) }))
vi.mock('../src/lib/tai-thong-tin-ph', () => ({ taiThongTinPhuHuynh: async () => ({ canhBao: [] }) }))

const HOC2 = { ok: true, cheDo2: true, ngay: '2026-10-05', chienDich: { ten: 'Bài 6 · Tinh bột và cellulose', hanNop: '2026-10-12', conNgay: 7, tong: 112, daGap: 60, thanhThao: 24, canDayLai: 2 }, homNay: { tong: 40, daLam: 34 } }
const OMNI: PhOmni = {
  khoangCach8: 1.1, hieuChuan: { soCaChot: 3, du: true }, dangCanVung: ['Hiệu suất ester hoá', 'Hỗn hợp ester'], sEm: 0.06,
  chungChi: [{ ten: 'Bài 5', doTin: 0.91, ngay: '2026-10-05', diem: 8.5 }, { ten: 'Bài 4', doTin: 0.93, ngay: '2026-09-29', diem: 9 }], gioHoc: '20:30', canThayChua: 1,
}
const OMNI_RONG: PhOmni = { khoangCach8: null, hieuChuan: { soCaChot: 0, du: false }, dangCanVung: [], sEm: null, chungChi: [], gioHoc: null, canThayChua: 0 }
/** Con chưa có giờ học quen (nhịp học không ghi giờ) và chưa có dạng luyện thêm ⇒ Hôm nay dùng giờ học con chọn + dạng cần vững của OMNI. */
const PH_OMNI = { ...PH_OK, nhipHoc: { ...PH_OK.nhipHoc, gioThuongHoc: '' }, manhYeu: null, dangVap: null }
const CAM = /thần thú|khiên|Võ đài|Đảo|Linh Tâm|Đoàn Hộ Tống|\bEXP\b|vàng|rương|Vé thử thách|Trạm hồi phục|Máu|A\.I|Bộ não|100 ?%/i

let hoc2: unknown = HOC2
let tatCa: unknown = PH_OMNI
beforeEach(() => {
  hoc2 = HOC2
  tatCa = PH_OMNI
  window.history.replaceState(null, '', '/?vai=phuhuynh')
  localStorage.setItem('omr_ph_sbd', '12121212')
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const duong = String(url).replace('https://may.test', '')
    const js = (t: unknown) => ({ ok: true, status: 200, json: async () => t, text: async () => JSON.stringify(t) })
    if (duong === '/ph/tat-ca-ve-con') return js(tatCa)
    if (duong === '/ph/hoc-2') return js(hoc2)
    return js({ ok: true })
  }))
})
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
  window.history.replaceState(null, '', '/')
})

/** Mở Hôm nay, chờ /ph/hoc-2 về (số kế hoạch 34/40 hiện) rồi trả gốc. */
const moHomNay = async (): Promise<HTMLElement> => {
  const { container } = render(createElement(ParentPortalScreen))
  await waitFor(() => expect(container.querySelector('[data-vung="so-cau-hom-nay"]')?.textContent).toBe('34/40 câu'))
  return container
}
const sangTienBo = async (container: HTMLElement): Promise<void> => {
  await act(async () => {
    window.history.replaceState(null, '', '/?vai=phuhuynh#tien-bo')
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
  await waitFor(() => expect(container.querySelector('[data-vung="man-tien-bo"]')).toBeTruthy())
}

describe('OMNI 3 · app phụ huynh theo bản vẽ tối giản 09/10', () => {
  it('VẮNG omni ⇒ không dòng OMNI nào ở Hôm nay lẫn Tiến bộ; không thẻ chiến dịch', async () => {
    const c = await moHomNay()
    expect(c.querySelector('[data-vung="chien-dich"], [data-vung="chien-dich-omni"], [data-vung="can-thay-chua"]')).toBeNull()
    expect(c.textContent).not.toMatch(/Giờ học con chọn|Dạng cần vững|Cần thầy chữa/)
    await sangTienBo(c)
    expect(c.querySelector('[data-vung="diem-omni"], [data-vung="so-y"]')).toBeNull()
    expect(c.textContent).not.toMatch(/Sẵn sàng 8\+|tới 8|Sơ ý/)
  })

  it('omni KHÔNG có số thật (chưa hiệu chuẩn, rỗng, 0) ⇒ vẫn không dòng nào — không ô trống, không số 0 giả', async () => {
    hoc2 = { ...HOC2, omni: OMNI_RONG }
    const c = await moHomNay()
    expect(c.textContent).not.toMatch(/Giờ học con chọn|Dạng cần vững|Cần thầy chữa/)
    await sangTienBo(c)
    expect(c.querySelector('[data-vung="diem-omni"], [data-vung="so-y"]')).toBeNull()
  })

  it('CÓ omni ⇒ Hôm nay: giờ học con chọn, dạng cần vững, Cần thầy chữa; Tiến bộ: khoảng cách tới 8 + chứng chỉ dưới đường điểm, Sơ ý; không chữ game / A.I / 100%', async () => {
    hoc2 = { ...HOC2, omni: OMNI }
    const c = await moHomNay()
    expect(c.querySelector('[data-vung="anh-hung"]')!.textContent).toContain('Giờ học con chọn: 20:30.')
    const dang = c.querySelector('[data-vung="dang-luyen-them"]')!
    expect(dang.querySelector('h2')!.textContent).toBe('Dạng cần vững')
    expect(dang.textContent).toContain('Hiệu suất ester hoá · Hỗn hợp ester')
    expect(c.querySelector('[data-vung="can-thay-chua"]')!.textContent).toBe('Cần thầy chữa: 1 chỗ')
    expect(c.textContent).not.toMatch(/Sẵn sàng 8\+|tới 8|Sơ ý/) // các số ấy chỉ ở Tiến bộ
    expect(c.textContent).not.toMatch(CAM)
    await sangTienBo(c)
    const o = c.querySelector('[data-vung="diem-omni"]') as HTMLElement
    expect([...o.children].map((x) => x.textContent)).toEqual(['Con còn 1,1 điểm tới 8', 'Chứng chỉ gần nhất: Bài 5 · Sẵn sàng 8+ · độ tin 91% · điểm ca chốt 8,5'])
    expect(o.children[0]!.tagName).toBe('B')
    expect(o.closest('[data-vung="xu-huong-diem"]')).toBeTruthy()
    const soY = c.querySelector('[data-vung="so-y"]')!
    expect(soY.querySelector('h2')!.textContent).toBe('Sơ ý của con')
    expect(soY.textContent).toContain('6% (mục tiêu dưới 7%)')
    expect(c.textContent).not.toContain('Cần thầy chữa') // mỗi số một chỗ: Cần thầy chữa chỉ ở Hôm nay
    expect(c.textContent).not.toMatch(CAM)
  })

  it('có giờ học quen + dạng luyện thêm từ máy chủ ⇒ dùng chúng (không lặp bằng số OMNI); chưa hiệu chuẩn ⇒ không dòng khoảng cách; Cần thầy chữa 0 ⇒ không dòng', async () => {
    tatCa = PH_OK
    hoc2 = { ...HOC2, omni: { ...OMNI, hieuChuan: { soCaChot: 2, du: false }, canThayChua: 0 } }
    const c = await moHomNay()
    expect(c.querySelector('[data-vung="anh-hung"]')!.textContent).toContain('Giờ học quen của con: 19:30–21:00.')
    expect(c.textContent).not.toContain('Giờ học con chọn')
    expect(c.querySelector('[data-vung="dang-luyen-them"] h2')!.textContent).toBe('Dạng con đang luyện thêm')
    expect(c.textContent).not.toMatch(/Dạng cần vững|Cần thầy chữa/)
    await sangTienBo(c)
    expect([...c.querySelector('[data-vung="diem-omni"]')!.children].map((x) => x.textContent)).toEqual(['Chứng chỉ gần nhất: Bài 5 · Sẵn sàng 8+ · độ tin 91% · điểm ca chốt 8,5'])
    expect(c.textContent).not.toMatch(/tới 8|mốc 8/)
  })
})

describe('chữ OMNI giọng phụ huynh (dùng lại src/lib/omni-chu.ts)', () => {
  it('đã chạm mốc 8 · độ tin 1 ⇒ 99% (không bao giờ 100%) · không điểm ca chốt ⇒ bỏ đoạn điểm; omni vắng/rỗng ⇒ không dòng', () => {
    const d = dongDiemOmni({ ...OMNI, khoangCach8: -0.2, chungChi: [{ ten: 'Bài 6', doTin: 1, ngay: '', diem: null }] })
    expect(d.map((x) => x.chu)).toEqual(['Con đã chạm mốc 8 theo dự báo — chờ ca chốt xác nhận', 'Chứng chỉ gần nhất: Bài 6 · Sẵn sàng 8+ · độ tin 99%'])
    expect(d[0]!.dam).toBe(true)
    expect(dongDiemOmni(OMNI_RONG)).toEqual([])
    expect(dongDiemOmni(undefined)).toEqual([])
  })
  it('mục tiêu sơ ý = ngưỡng C của chứng chỉ (THAM_SO_OMNI.C_SO_Y); sơ ý vắng ⇒ không dòng', () => {
    expect(SO_Y_MUC_TIEU).toBe(THAM_SO_OMNI.C_SO_Y)
    expect(chuPhSoY(null)).toBeNull()
    expect(chuPhSoY(0.123)).toBe('Sơ ý của con: 12% (mục tiêu dưới 7%)')
  })
})

describe('lớp đọc chặt `omni` của /ph/hoc-2', () => {
  it('vắng / sai kiểu ⇒ KHÔNG có khoá omni (dạng y cũ); Hoá 2.0 tắt ⇒ bỏ omni; đúng dạng ⇒ giữ nguyên', () => {
    expect(Object.keys(docHoc2(HOC2)!)).toEqual(['chienDich', 'homNay', 'cauTungSai'])
    for (const sai of [null, 'x', 3, [OMNI]]) expect(docHoc2({ ...HOC2, omni: sai }), String(sai)).not.toHaveProperty('omni')
    expect(docHoc2({ ok: true, cheDo2: false, omni: OMNI })).toEqual({ chienDich: null, homNay: null, cauTungSai: null })
    expect(docHoc2({ ...HOC2, omni: OMNI })!.omni).toEqual(OMNI)
  })
  it('từng trường sai dạng ⇒ vắng (null · rỗng · 0), không bịa; khoảng cách tới 8 chỉ giữ khi đã hiệu chuẩn', () => {
    const o = docOmniPh({
      khoangCach8: 1.1, hieuChuan: { soCaChot: 2, du: false }, dangCanVung: ['  Hỗn hợp   ester ', '', 7, 'Hỗn hợp ester'], sEm: 1.4,
      chungChi: [{ ten: '', doTin: 0.9 }, { ten: 'Bài 3', doTin: 1.2 }, { ten: 'Bài 2', doTin: 0.88, diem: 12 }, 'x'], gioHoc: '20_22', canThayChua: -1,
    })
    expect(o).toEqual({ khoangCach8: null, hieuChuan: { soCaChot: 2, du: false }, dangCanVung: ['Hỗn hợp ester'], sEm: null, chungChi: [{ ten: 'Bài 2', doTin: 0.88, ngay: '', diem: null }], gioHoc: null, canThayChua: 0 })
    expect(docOmniPh({ hieuChuan: { soCaChot: 3, du: true }, khoangCach8: 1.25 })!.khoangCach8).toBe(1.25)
    expect(docOmniPh({ hieuChuan: { soCaChot: 3, du: true }, khoangCach8: 'x' })!.khoangCach8).toBeNull()
    expect(docOmniPh({ hieuChuan: { soCaChot: 3, du: true }, khoangCach8: 42 })!.khoangCach8).toBeNull()
    expect(docOmniPh({ gioHoc: '8:05' })!.gioHoc).toBe('08:05')
    expect(docOmniPh({ gioHoc: '20:30 - 21:15' })!.gioHoc).toBe('20:30–21:15')
    expect(docOmniPh({ gioHoc: '25:00' })!.gioHoc).toBeNull()
    expect(docOmniPh({ canThayChua: 2.5 })!.canThayChua).toBe(0)
    expect(docOmniPh({})).toEqual(OMNI_RONG)
  })
})
