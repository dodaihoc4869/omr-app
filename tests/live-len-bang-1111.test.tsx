// @vitest-environment jsdom
// LIVE BẢNG — MÁY EM: THÔNG BÁO «LÊN BẢNG» + THẺ TÊN em đang lên bảng (src/components/live/LenBang.tsx). Thầy 11/11: «khi bấm lên bảng hs đang ở màn live,
// tôi muốn bạn hiện một thông báo lên bảng ở giữa màn hình máy học sinh trong 3 giây cho tất cả máy học sinh trong live rồi tự thu nhỏ vào góc thẻ tên của
// học sinh đó, không chèn thẻ tên để học sinh biết.» Lớp bảng live thật (LopLive) + phòng thật (`viewEm`), thư viện live GIẢ, canvas giả. Khoá:
//   · thầy gọi em ⇒ MỘT tấm giữa màn: tên gọi hai chữ + «lên bảng» + tên đội, màu đội của em ĐƯỢC GỌI; không chặn chạm (kiểm ở CSS);
//   · hết 3 giây ⇒ tấm thu rồi mất; còn thẻ tên + DẤU «đang lên bảng» đứng CẠNH thẻ (anh em, không lồng), cả hai nằm trong dải NGOÀI khung bảng đen;
//   · bố cục thuần: dải thẻ tên không giao khung bảng, không giao khung giấy; khung giấy không đổi; phép co của bảng không đổi (bảng co theo bề ngang);
//   · gọi em khác lúc tấm cũ chưa tan ⇒ tấm mới THAY (không chồng hai tấm);
//   · em vào muộn / nối lại lúc đã có bạn đang lên bảng ⇒ KHÔNG phát lại tấm, chỉ thẻ + dấu;
//   · thầy chấm ⇒ dấu mất (thẻ còn, dải kết quả giữ nguyên); lượt mới ⇒ thẻ + dải mất, khung bảng cao lại như cũ;
//   · máy của chính em được gọi ⇒ «Em lên bảng»;
//   · an toàn: thứ lớp này nhận chỉ có tên gọi + đội + đã chấm chưa — không đáp án, không kết quả chấm.
// Hộp bao THẬT (tấm ≤ 40 % bề ngang, dấu không đè thẻ, dải không đè khung bảng, ở 844 / 667 / iPhone dọc xoay / 1971): scripts/thu-live-1011/thu-len-bang-1111.mjs.
import { act, render, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { chamLenBang, goiLenBang, lamBang, moDapAn, moLuot, nhanTra, taoPhong, viewEm, DOI_BPU, type TrangThaiPhong } from '../src/lib/bpu/phong'
import { VUNG_MAC_DINH, khungChieu } from '../src/components/live/bo-cuc'
import { DAU_BANG, KHE_DAU, boCucDocLap, mocChia, oDauBang } from '../src/components/live/bo-cuc-doc-lap'
import { GIUA_MS, THU_MS, emLenBang, khoaDang } from '../src/components/live/len-bang-tinh'
import { _datLaiTatMan } from '../src/components/bpu/tat-man'

type Tt = Record<string, unknown>
const NEN: Tt = { duocXem: true, san: true, bat: true, tu: 1, tieng: 'co', nghe: true, kenhNet: 'ws', duBang: true, bang: true, duocMoMic: false, duocMoi: false, tay: false, hangTay: null, mic: 'tat', banNoi: null, nghi: false }
vi.mock('../src/lib/live', () => ({
  taoLiveEm: (tuy: { khiTrangThai?: (t: Tt) => void }) => {
    setTimeout(() => act(() => { tuy.khiTrangThai?.({ ...NEN }) }), 0)
    return {
      trangThai: () => ({ ...NEN }), nhanView() {}, nhanTinPhong() {}, khiNoiLai() {}, moKhoaTieng: async () => true, datTieng() {}, datRoiMan() {},
      bang: () => ({ trang: '', tiLe: 16 / 9, net: [], cuoi: 0, lichSu: [], ghep: null }), khung: () => ({ dau: [], tro: null }), mucAm: () => 0, mucAmMic: () => 0, mucAmBan: () => 0, soDo: () => ({ kenhNet: 'ws' }), huy() {},
      batMicLenBang: async () => ({ ok: true }), tatMic() {}, dangChoQuyenMic: () => false, gioTay() {}, deSau() {}, datGiayLech() {}, datHienBang() {},
    }
  },
}))

const DS = [['S1', 'Nguyễn Thị Hà'], ['S2', 'Lê Gia Huy'], ['S5', 'Trần Minh Anh']] as const
const CAU = { qid: 'Q1', phan: 'I' as const, tuLuan: false, cau: { text: 'Alcohol nào là alcohol bậc II?' }, dung: 'B', hanGiay: null }
function phong(): TrangThaiPhong {
  const st = taoPhong({ buoiId: 'b1', lop: '12A1', nay: 1000, ds: DS.map(([sbd, ten], i) => ({ sbd, ten, coMat: true, luc: 1000 + i })) })
  st.ds.forEach((e, i) => { e.vao = true; e.doi = i }) // S1 đội Natri · S2 đội Kali · S5 đội Đồng
  moLuot(st, CAU, 2000)
  return st
}
const view = { duocXem: true, san: true, bat: true, tu: 1, phien: 1, ss: null, tieng: 'bat', soNet: 0, bang: true, emTay: false, hangTay: null, emDuocMoi: false, emNoi: false, noi: [] } as never
const dangKy = () => {}
/** Dựng LopLive cho máy của em `sbd` theo đúng cách ManBinhPhanUng truyền: `lenBang` = lượt của phòng (thẳng `viewEm.luot`); `luot` (dải lượt, mang số
 *  báo danh của em cầm máy) có khi máy đang ở bảng live. */
async function dung(st: TrangThaiPhong, sbd: string) {
  const { default: LopLive } = await import('../src/components/live/LopLive')
  const doi = st.ds.find((e) => e.sbd === sbd)?.doi ?? 0
  const ve = () => { const l = viewEm(st, sbd).luot; return <LopLive ve="ve" goc="https://may-chu" guiTho={() => {}} dangKy={dangKy} view={view} che="bang" de={null} khoaDe="q1" doi={{ ten: 'Đội Natri', ky: 'Na', kj: 0 }} matMang={false} roi={false}
    luot={l ? { l, sbd, doi, daGuiMay: false, ketQuaBang: null, gui: () => true } : null} lenBang={l} /> }
  const r = render(ve())
  await waitFor(() => expect(document.querySelector('.lv')).toBeTruthy())
  return { lai: () => act(() => { r.rerender(ve()) }) }
}
const tam = () => document.querySelectorAll<HTMLElement>('.lv-lb-tam')
const the = () => document.querySelector<HTMLElement>('.lv-dau-bang .lv-lb-the')
const dauNho = () => document.querySelector<HTMLElement>('.lv-dau-bang .lv-lb-dau')
const chu = (e: Element | null) => (e?.textContent ?? '').replace(/\s+/g, ' ').trim()
const qua = (ms: number) => act(() => { vi.advanceTimersByTime(ms) })
const gioGia = () => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })

beforeEach(() => {
  const g = new Proxy({}, { get: (_, k) => (k === 'canvas' ? null : () => undefined), set: () => true })
  ;(HTMLCanvasElement.prototype as unknown as { getContext: () => unknown }).getContext = () => g
  localStorage.clear(); _datLaiTatMan()
  document.documentElement.classList.remove('may-yeu')
})
afterEach(() => { vi.useRealTimers(); _datLaiTatMan() })

describe('dữ liệu: em được gọi lên bảng lấy từ viewEm.luot.goi — không thêm trường, không lộ gì ngoài tên + đội', () => {
  it('gọi ⇒ tên gọi hai chữ + đội + «đang»; bắt đầu làm bảng vẫn cùng lời gọi; thầy chấm ⇒ hết «đang» (thẻ còn); mở đáp án / lượt mới ⇒ hết', () => {
    const st = phong()
    expect(emLenBang(viewEm(st, 'S1').luot, 'S1')).toBeNull()
    nhanTra(st, 'S5', 'B', 2500)
    goiLenBang(st, 'S5', ['Chưa lên bảng buổi này'], 3000)
    const a = emLenBang(viewEm(st, 'S1').luot, 'S1')!
    expect(a).toEqual({ khoa: `${st.luot!.so}:S5`, ten: 'Minh Anh', doi: 2, laEm: false, dang: true, tiep: [0, 0, 0, 0], emTiep: 0, doiEm: -1 }) // 13/11: thêm SỐ lượt cổ vũ theo đội + số lần của em (tinh thể cổ vũ) — vẫn không tên người bấm, không đáp án
    expect(emLenBang(viewEm(st, 'S5').luot, 'S5')!.laEm).toBe(true)
    // chỉ các trường ấy (13/11 thêm ba SỐ cổ vũ): không số báo danh rời, không lý do gọi, không đáp án, không kết quả chấm
    expect(Object.keys(a).sort()).toEqual(['dang', 'doi', 'doiEm', 'emTiep', 'khoa', 'laEm', 'ten', 'tiep'])
    lamBang(st, 3500)
    expect(khoaDang(emLenBang(viewEm(st, 'S1').luot, 'S1'))).toBe(a.khoa)
    chamLenBang(st, true, 4000)
    const b = emLenBang(viewEm(st, 'S1').luot, 'S1')!
    expect(b.dang).toBe(false); expect(khoaDang(b)).toBe('')
    expect(JSON.stringify(b)).not.toMatch(/dat|kj/i)
    moDapAn(st, 5000, () => false)
    expect(emLenBang(viewEm(st, 'S1').luot, 'S1')!.dang).toBe(false)
    moLuot(st, { ...CAU, qid: 'Q2' }, 6000)
    expect(emLenBang(viewEm(st, 'S1').luot, 'S1')).toBeNull()
  })
})

describe('bố cục thuần: dải thẻ tên nằm NGOÀI khung bảng (so hộp bao)', () => {
  const giao = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  for (const [w, h, at] of [[844, 390, { trai: 0, phai: 0, duoi: 0, tren: 0 }], [667, 375, { trai: 0, phai: 0, duoi: 0, tren: 0 }], [844, 390, { trai: 47, phai: 34, duoi: 21, tren: 0 }], [1180, 820, { trai: 0, phai: 0, duoi: 0, tren: 0 }], [1971, 1247, { trai: 0, phai: 0, duoi: 0, tren: 0 }]] as const) {
    it(`${w} × ${h}${at.trai ? ' (tai thỏ)' : ''}: dải không giao khung bảng / khung giấy, nằm trong hình; giấy + phép co của bảng không đổi`, () => {
      const kc = khungChieu(VUNG_MAC_DINH, 16 / 9), m = mocChia(w, h, at, kc, 0.0388)
      for (const chia of [m.giay, m.giua, m.bang]) for (const phong of [null, 'bang'] as const) {
        const cu = boCucDocLap({ w, h, at, kc, chia, phong }), moi = boCucDocLap({ w, h, at, kc, chia, phong, dauBang: DAU_BANG })
        expect(oDauBang(cu)).toBeNull()
        const d = oDauBang(moi)!
        expect(d.h).toBe(DAU_BANG - KHE_DAU)
        expect(giao(d, moi.bang)).toBe(false)
        if (!phong) expect(giao(d, moi.giay)).toBe(false)
        expect(d.x).toBe(moi.bang.x); expect(d.w).toBe(moi.bang.w)
        expect(d.y).toBeGreaterThanOrEqual((at.tren ?? 0)); expect(d.y + d.h + KHE_DAU).toBe(moi.bang.y)
        // khung bảng chỉ thấp đi đúng 26 px; khung giấy và vạch chia y nguyên
        expect(moi.bang.h).toBe(cu.bang.h - DAU_BANG); expect(moi.bang.y + moi.bang.h).toBe(cu.bang.y + cu.bang.h)
        expect(moi.giay).toEqual(cu.giay); expect(moi.sG).toBe(cu.sG); expect(moi.vach).toBe(cu.vach)
        // thẻ tên hiện ra không làm nét trên bảng đổi cỡ (13/11: phép «vừa trọn» của bảng luôn trừ sẵn chỗ của dải)
        if (w <= 1180 && !phong) expect(moi.sB).toBe(cu.sB)
        expect(moi.sB).toBeGreaterThan(cu.sB * 0.95)
      }
    })
  }
})

describe('máy em đang ở bảng live: thầy gọi em lên bảng', () => {
  it('lời gọi mới ⇒ MỘT tấm giữa màn: tên gọi + «lên bảng» + tên đội, màu đội của em được gọi; 3 giây sau thu về dấu nhỏ CẠNH thẻ tên, ngoài khung bảng', async () => {
    const st = phong(), m = await dung(st, 'S1')
    expect(tam().length).toBe(0); expect(document.querySelector('.lv-dau-bang')).toBeNull()
    const caoTruoc = parseFloat(document.querySelector<HTMLElement>('.lv-bang')!.style.height)
    gioGia()
    goiLenBang(st, 'S5', [], 3000); m.lai()
    expect(tam().length).toBe(1)
    const t = tam()[0]!
    expect(chu(t)).toBe('Đội ĐồngMinh Anhlên bảng')
    expect(t.getAttribute('data-pha')).toBe('giua'); expect(t.getAttribute('role')).toBe('status')
    expect(t.style.getPropertyValue('--doi')).toBe(`var(${DOI_BPU[2].mau})`) // màu đội của Minh Anh, không phải đội của em cầm máy (Natri)
    expect(t.parentElement).toBe(document.querySelector('.lv')) // nổi trên lớp bảng: không nằm trong khung nào ⇒ không dịch bố cục
    // thẻ tên đã ở chỗ; dấu giữ chỗ nhưng CHƯA hiện (tấm sẽ bay về đó)
    expect(chu(the())).toBe('Minh Anh'); expect(the()!.getAttribute('aria-label')).toBe('Bạn Minh Anh lên bảng · Đội Đồng')
    expect(dauNho()!.hasAttribute('data-cho')).toBe(true)
    // khung bảng nhường đúng 26 px cho dải thẻ tên; dải nằm ngoài khung bảng (anh em với khung, không lồng)
    expect(parseFloat(document.querySelector<HTMLElement>('.lv-bang')!.style.height)).toBe(caoTruoc - DAU_BANG)
    const dai = document.querySelector<HTMLElement>('.lv-dau-bang')!
    expect(dai.closest('.lv-bang')).toBeNull(); expect(dai.closest('.lv-giay')).toBeNull()
    expect(parseFloat(dai.style.top) + parseFloat(dai.style.height) + KHE_DAU).toBe(parseFloat(document.querySelector<HTMLElement>('.lv-bang')!.style.top))
    expect(dai.style.pointerEvents).toBe('none')
    // gần hết 3 giây vẫn còn; đủ 3 giây ⇒ đang thu; thu xong ⇒ tấm mất, dấu hiện
    qua(GIUA_MS - 60)
    expect(tam()[0]!.getAttribute('data-pha')).toBe('giua')
    qua(80)
    expect(tam()[0]!.getAttribute('data-pha')).toBe('thu'); expect(tam()[0]!.hasAttribute('data-thu')).toBe(true); expect(tam()[0]!.hasAttribute('data-tat')).toBe(false)
    expect(dauNho()!.hasAttribute('data-cho')).toBe(false)
    qua(THU_MS + 60)
    expect(tam().length).toBe(0)
    expect(chu(dauNho())).toBe('đang lên bảng'); expect(dauNho()!.getAttribute('aria-label')).toBe('đang lên bảng')
    // dấu đứng CẠNH thẻ: anh em trong dải, thẻ đứng trước, không cái nào chứa cái nào
    expect(dauNho()!.parentElement).toBe(the()!.parentElement); expect(the()!.nextElementSibling).toBe(dauNho())
    expect(the()!.contains(dauNho())).toBe(false)
  })

  it('gọi em KHÁC lúc tấm cũ chưa tan ⇒ tấm mới thay ngay (không chồng hai tấm), đủ 3 giây tính lại từ lời gọi mới', async () => {
    const st = phong(), m = await dung(st, 'S1')
    gioGia()
    goiLenBang(st, 'S5', [], 3000); m.lai()
    qua(1800)
    goiLenBang(st, 'S2', [], 4800); m.lai()
    expect(tam().length).toBe(1)
    expect(chu(tam()[0]!)).toBe('Đội KaliGia Huylên bảng'); expect(tam()[0]!.getAttribute('data-pha')).toBe('giua')
    expect(chu(the())).toBe('Gia Huy'); expect(document.querySelectorAll('.lv-lb-the').length).toBe(1)
    qua(1800) // lời gọi cũ lẽ ra đã hết 3 giây — tấm mới vẫn đứng
    expect(tam().length).toBe(1); expect(tam()[0]!.getAttribute('data-pha')).toBe('giua')
    qua(1300); qua(THU_MS + 60)
    expect(tam().length).toBe(0); expect(document.querySelectorAll('.lv-lb-dau').length).toBe(1)
  })

  it('em vào muộn / nối lại lúc đã có bạn đang lên bảng ⇒ KHÔNG phát lại tấm giữa màn, chỉ thẻ tên + dấu nhỏ; tin phòng lặp lại cũng không phát', async () => {
    const st = phong()
    goiLenBang(st, 'S5', [], 3000)
    const m = await dung(st, 'S1')
    expect(tam().length).toBe(0)
    expect(chu(the())).toBe('Minh Anh'); expect(dauNho()!.hasAttribute('data-cho')).toBe(false)
    lamBang(st, 3500); m.lai(); m.lai()
    expect(tam().length).toBe(0); expect(chu(dauNho())).toBe('đang lên bảng')
  })

  it('thầy chấm ⇒ dấu mất ngay (kể cả khi tấm còn đang đứng), thẻ tên còn; lượt mới ⇒ thẻ + dải mất, khung bảng cao lại như cũ', async () => {
    const st = phong(), m = await dung(st, 'S1')
    const caoTruoc = parseFloat(document.querySelector<HTMLElement>('.lv-bang')!.style.height)
    const conLop = () => [...document.querySelector('.lv')!.children].map((e) => e.className.split(' ')[0]).sort()
    await act(async () => { await new Promise((r) => setTimeout(r, 700)) })
    const conTruoc = conLop() // viên chào «Thầy đang live» lúc thầy vừa bật live tự mất sau 0,6 giây
    gioGia()
    goiLenBang(st, 'S5', [], 3000); m.lai()
    qua(900)
    chamLenBang(st, true, 4000); m.lai()
    expect(tam().length).toBe(0); expect(dauNho()).toBeNull()
    expect(chu(the())).toBe('Minh Anh')
    expect(document.querySelector('.lv-dau-bang')!.textContent).not.toMatch(/đạt|kJ/i) // kết quả chấm không hiện ở thẻ (đã có dải lượt)
    moLuot(st, { ...CAU, qid: 'Q2' }, 6000); m.lai()
    expect(the()).toBeNull(); expect(document.querySelector('.lv-dau-bang')).toBeNull()
    expect(parseFloat(document.querySelector<HTMLElement>('.lv-bang')!.style.height)).toBe(caoTruoc)
    // con trực tiếp của lớp bảng về đúng như lúc chưa ai lên bảng (không sót tấm / dải nào)
    expect(conLop()).toEqual(conTruoc); expect(conTruoc.some((c) => c.startsWith('lv-lb') || c === 'lv-dau-bang')).toBe(false)
  })

  it('máy của CHÍNH em được gọi ⇒ chữ riêng «Em lên bảng» + tên em · đội; dấu vẫn gọn «đang lên bảng», nhãn đọc màn «Em đang lên bảng»', async () => {
    const st = phong(), m = await dung(st, 'S5')
    gioGia()
    goiLenBang(st, 'S5', [], 3000); m.lai()
    expect(chu(tam()[0]!)).toBe('Em lên bảngMinh Anh · Đội Đồng'); expect(tam()[0]!.hasAttribute('data-em')).toBe(true)
    expect(the()!.getAttribute('aria-label')).toBe('Em lên bảng · Đội Đồng')
    qua(GIUA_MS + 20); qua(THU_MS + 60)
    expect(tam().length).toBe(0); expect(chu(dauNho())).toBe('đang lên bảng'); expect(dauNho()!.getAttribute('aria-label')).toBe('Em đang lên bảng')
  })

  it('máy yếu: không bay (không đặt phép dời), hết 3 giây tấm tắt, dấu hiện', async () => {
    document.documentElement.classList.add('may-yeu')
    const st = phong(), m = await dung(st, 'S1')
    gioGia()
    goiLenBang(st, 'S5', [], 3000); m.lai()
    qua(GIUA_MS + 20)
    expect(tam()[0]!.getAttribute('data-pha')).toBe('thu'); expect(tam()[0]!.hasAttribute('data-thu')).toBe(false); expect(tam()[0]!.hasAttribute('data-tat')).toBe(true)
    qua(THU_MS + 60)
    expect(tam().length).toBe(0); expect(dauNho()!.hasAttribute('data-cho')).toBe(false)
  })
})

describe('kiểu (live-em.css): không chặn chạm, ≤ 40 % bề ngang, chỉ transform + opacity, có giảm chuyển động + máy yếu', () => {
  const css = readFileSync('src/components/live/live-em.css', 'utf8')
  const luat = (k: string) => { const i = css.indexOf(`\n${k} {`); return i < 0 ? '' : css.slice(i, css.indexOf('}', i)) }
  it('tấm giữa màn', () => {
    const t = luat('.lv-lb-tam')
    expect(t).toMatch(/pointer-events: none/); expect(t).toMatch(/max-width: min\(40%, \d+px\)/); expect(t).toMatch(/left: 50%; top: 50%/)
    expect(t).not.toMatch(/backdrop-filter/)
    const thu = luat('.lv-lb-tam[data-thu]')
    expect(thu).toMatch(/transition: transform 0\.4s cubic-bezier\([^)]*\), opacity 0\.14s ease-in 0\.26s/) // 400 ms ≤ 450 ms, chỉ transform + opacity
    // độ mờ 0 chỉ đi cùng `data-thu` (bay) / `data-tat` (tắt thẳng): đặt ở `data-pha="thu"` thì lúc đo chỗ bay tấm đã tắt phụt (lỗi bắt được bằng ảnh thật 11/11)
    expect(thu).toMatch(/opacity: 0;/); expect(luat('.lv-lb-tam[data-tat]')).toMatch(/opacity: 0/)
    expect(luat('.lv-lb-tam[data-pha="thu"]')).not.toMatch(/opacity/)
    expect(THU_MS).toBeLessThanOrEqual(450); expect(GIUA_MS).toBe(3000)
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{ \.lv-lb-tam \{ animation: none; \} \.lv-lb-dau \{ transition: none; \} \}/)
    expect(css).toMatch(/html\.may-yeu \.lv-lb-tam \{ animation: none;/)
  })
  it('màu: chỉ biến chuẩn (màu đội qua --doi, bảng màu màn chiếu) — không mã màu thô', () => {
    const khoi = css.slice(css.indexOf('── EM LÊN BẢNG'), css.indexOf('html.may-yeu .lv-lb-dau'))
    expect(khoi.length).toBeGreaterThan(500)
    expect(khoi).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/)
  })
})
