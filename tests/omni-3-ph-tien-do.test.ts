// OMNI 3 · APP PHỤ HUYNH (05/10) — dòng thêm trong thẻ "Chiến dịch của con" khi `/ph/hoc-2` kèm `omni` (docs/hop-dong-omni-3.md mục C, kiểu PhOmni).
// Thầy 05/10: "giữ nguyên mọi giao diện hiện tại… thêm những mục cần thiết đồng bộ với giao diện hiện tại". Khoá:
// (1) vắng `omni` (hoặc `omni` không có số thật) ⇒ thẻ Y HỆT bản trước OMNI — so NGUYÊN HTML chụp từ mã chưa sửa (commit f189d2b);
// (2) có `omni` ⇒ đúng sáu dòng, đúng thứ tự, nằm cuối CÙNG thẻ, lớp sẵn có; bỏ ô OMNI thì phần cũ của thẻ không đổi một ký tự;
// (3) khoảng cách tới 8 chỉ khi đã hiệu chuẩn (≥ 3 ca chốt); độ tin không bao giờ 100%; không thẻ mới khi không có chiến dịch;
// (4) không chữ game, không chữ A.I trên màn phụ huynh; (5) lớp đọc chặt từng trường.
// Tệp .ts (không JSX) để lọt mẫu cổng `tests/omni-3-*.test.ts` của đặc tả mục 8.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import ParentPortalScreen from '../src/screens/ParentPortalScreen'
import { docHoc2, docOmniPh } from '../src/lib/ph-v3/du-lieu'
import { SO_Y_MUC_TIEU, chuPhSoY, dongOmniPh } from '../src/components/ph-v3/ManHomNay'
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
/** HTML thẻ "Chiến dịch của con" chụp từ mã CHƯA sửa (f189d2b) với HOC2 trên — mốc "y hệt hôm nay". */
const MOC =
  '<section class="ph3-the ph3-o-hep" aria-labelledby="ph3-cd" data-vung="chien-dich"><div class="ph3-the__dau"><span class="ph3-o-bt" data-mau="xd" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 21V4"></path><path d="M5 4h11l-2 4 2 4H5"></path></svg></span><div><h2 id="ph3-cd">Chiến dịch của con</h2><span>Bài 6 · Tinh bột và cellulose</span></div><span class="ph3-chip" data-mau="xd">Còn 7 ngày</span></div><div class="ph3-cd-ray" role="img" aria-label="24 câu đã thành thạo, 34 câu đang luyện, 2 câu cần thầy dạy lại, 52 câu chưa gặp, trên tổng 112 câu"><span data-mau="xl" style="width: 21.428571428571427%;"></span><span data-mau="xd" style="width: 30.357142857142854%;"></span><span data-mau="ho" style="width: 1.7857142857142856%;"></span></div><div class="ph3-cd-chu"><div><i data-mau="xl"></i><span><b>24</b>câu đã thành thạo</span></div><div><i data-mau="xd"></i><span><b>34</b>câu đang luyện</span></div><div><i data-mau="ho"></i><span><b>2</b>câu cần thầy dạy lại</span></div><div><i></i><span><b>52</b>câu chưa gặp</span></div></div><div class="ph3-o-xam"><b>Tổng 112 câu · con đã gặp 60 câu</b><span class="ph3-dong-bt"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>Hạn nộp 23:59 · Thứ Hai 12/10/2026</span></div></section>'
const CAM = /thần thú|khiên|Võ đài|Đảo|Linh Tâm|Đoàn Hộ Tống|\bEXP\b|vàng|rương|Vé thử thách|Trạm hồi phục|Máu|A\.I|Bộ não|100 ?%/i

let hoc2: unknown = HOC2
beforeEach(() => {
  hoc2 = HOC2
  window.history.replaceState(null, '', '/?vai=phuhuynh')
  localStorage.setItem('omr_ph_sbd', '12121212')
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const duong = String(url).replace('https://may.test', '')
    const js = (t: unknown) => ({ ok: true, status: 200, json: async () => t, text: async () => JSON.stringify(t) })
    if (duong === '/ph/tat-ca-ve-con') return js(PH_OK)
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

const moTheChienDich = async (): Promise<HTMLElement> => {
  const { container } = render(createElement(ParentPortalScreen))
  await waitFor(() => expect(container.querySelector('[data-vung="chien-dich"]')).toBeTruthy())
  return container.querySelector('[data-vung="chien-dich"]') as HTMLElement
}

describe('OMNI 3 · thẻ "Chiến dịch của con" (app phụ huynh)', () => {
  it('VẮNG omni ⇒ thẻ Y HỆT bản trước OMNI (nguyên HTML), không ô OMNI', async () => {
    const the = await moTheChienDich()
    expect(the.outerHTML).toBe(MOC)
    expect(the.querySelector('[data-vung="chien-dich-omni"]')).toBeNull()
  })

  it('omni KHÔNG có số thật (chưa hiệu chuẩn, rỗng, 0) ⇒ thẻ vẫn y hệt — không ô trống, không số 0 giả', async () => {
    hoc2 = { ...HOC2, omni: OMNI_RONG }
    const the = await moTheChienDich()
    expect(the.outerHTML).toBe(MOC)
  })

  it('CÓ omni ⇒ sáu dòng đúng thứ tự, cuối CÙNG thẻ, lớp sẵn có; bỏ ô OMNI thì phần cũ y hệt; không chữ game / A.I / 100%', async () => {
    hoc2 = { ...HOC2, omni: OMNI }
    const the = await moTheChienDich()
    const o = the.querySelector('[data-vung="chien-dich-omni"]') as HTMLElement
    expect([...o.children].map((x) => x.textContent)).toEqual([
      'Con còn 1,1 điểm tới 8',
      'Dạng cần vững: Hiệu suất ester hoá, Hỗn hợp ester',
      'Sơ ý của con: 6% (mục tiêu dưới 7%)',
      'Chứng chỉ gần nhất: Bài 5 · Sẵn sàng 8+ · độ tin 91% · điểm ca chốt 8,5',
      'Giờ học con chọn: 20:30',
      'Cần thầy chữa: 1 chỗ',
    ])
    // cùng ô xám + chữ ghi như ô "Tổng · Hạn nộp" ngay trên; dòng khoảng cách đậm như dòng "Tổng"
    expect(o.className).toBe('ph3-o-xam')
    expect(o.children[0]!.tagName).toBe('B')
    for (const x of [...o.children].slice(1)) expect(x.tagName + '.' + x.className).toBe('SPAN.ph3-ghi')
    expect(o.parentElement).toBe(the)
    expect(the.lastElementChild).toBe(o)
    expect(o.previousElementSibling!.textContent).toContain('Hạn nộp 23:59 · Thứ Hai 12/10/2026')
    const banCu = the.cloneNode(true) as HTMLElement
    banCu.querySelector('[data-vung="chien-dich-omni"]')!.remove()
    expect(banCu.outerHTML).toBe(MOC)
    expect(the.textContent).not.toMatch(CAM)
  })

  it('chưa hiệu chuẩn (du = false) ⇒ không dòng khoảng cách dù máy chủ gửi số; không cần thầy chữa (0) ⇒ không dòng ấy', async () => {
    hoc2 = { ...HOC2, omni: { ...OMNI, hieuChuan: { soCaChot: 2, du: false }, canThayChua: 0, gioHoc: null } }
    const the = await moTheChienDich()
    const chu = [...the.querySelector('[data-vung="chien-dich-omni"]')!.children].map((x) => x.textContent)
    expect(chu).toEqual(['Dạng cần vững: Hiệu suất ester hoá, Hỗn hợp ester', 'Sơ ý của con: 6% (mục tiêu dưới 7%)', 'Chứng chỉ gần nhất: Bài 5 · Sẵn sàng 8+ · độ tin 91% · điểm ca chốt 8,5'])
    expect(the.textContent).not.toMatch(/tới 8|mốc 8|Cần thầy chữa|Giờ học/)
  })

  it('có omni nhưng KHÔNG có chiến dịch ⇒ không dựng thẻ mới (dòng OMNI chỉ sống trong thẻ sẵn có)', async () => {
    hoc2 = { ok: true, cheDo2: true, ngay: '2026-10-05', homNay: { tong: 40, daLam: 34 }, omni: OMNI }
    const { container } = render(createElement(ParentPortalScreen))
    await waitFor(() => expect(container.textContent).toContain('Còn 6 câu nữa là xong kế hoạch hôm nay (40 câu).'))
    expect(container.querySelector('[data-vung="chien-dich"], [data-vung="chien-dich-omni"]')).toBeNull()
    expect(container.textContent).not.toContain('Sẵn sàng 8+')
  })
})

describe('chữ OMNI giọng phụ huynh (dùng lại src/lib/omni-chu.ts)', () => {
  it('đã chạm mốc 8 · nhiều dạng gộp "và N dạng khác" · độ tin 1 ⇒ 99% (không bao giờ 100%) · không điểm ca chốt ⇒ bỏ đoạn điểm', () => {
    const d = dongOmniPh({ ...OMNI, khoangCach8: -0.2, dangCanVung: ['Danh pháp', 'Thuỷ phân', 'Ester hoá', 'Hiệu suất', 'Đốt cháy'], sEm: null, chungChi: [{ ten: 'Bài 6', doTin: 1, ngay: '', diem: null }], gioHoc: null, canThayChua: 0 })
    expect(d.map((x) => x.chu)).toEqual([
      'Con đã chạm mốc 8 theo dự báo — chờ ca chốt xác nhận',
      'Dạng cần vững: Danh pháp, Thuỷ phân, Ester hoá và 2 dạng khác',
      'Chứng chỉ gần nhất: Bài 6 · Sẵn sàng 8+ · độ tin 99%',
    ])
    expect(d[0]!.dam).toBe(true)
    expect(dongOmniPh(OMNI_RONG)).toEqual([])
    expect(dongOmniPh({ ...OMNI_RONG, canThayChua: 3 }).map((x) => x.chu)).toEqual(['Cần thầy chữa: 3 chỗ'])
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
