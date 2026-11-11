// LIVE BẢNG — EM ĐƯỢC GỌI LÊN BẢNG: MIC TỰ BẬT (thầy 10/11 «tự động bật mic cho bạn lên bảng»; đặc tả mục 4.3c). Lớp bảng live thật (LopLive) với thư viện
// live GIẢ (điều khiển được trạng thái `mic`, `duocMoMic`, `banNoi`). Khoá: phòng cho phép ⇒ tự gọi `batMicLenBang`; thẻ «Mic của em đang bật» LUÔN HIỆN
// khi mic mở, có «Tắt mic»; em tự tắt ⇒ không tự bật lại, còn «Bật mic lại»; bị từ chối quyền ⇒ báo nhẹ kèm cách bật; máy khác ⇒ «Bạn … đang nói»;
// hộp hỏi quyền mic đang hiện ⇒ bộ bắt rời màn coi như đang xin quyền (không báo «cửa sổ nổi»).
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { _datLaiTatMan, dangXinQuyen } from '../src/components/bpu/tat-man'

type Tt = Record<string, unknown>
const NEN: Tt = { duocXem: true, san: true, bat: true, tu: 1, tieng: 'co', nghe: false, kenhNet: 'ws', duBang: true, bang: true, duocMoMic: false, duocMoi: false, tay: false, hangTay: null, mic: 'tat', banNoi: null, nghi: false }
let dat: (o: Tt) => void = () => {}
let choQuyen = false
const goi: string[] = []
vi.mock('../src/lib/live', () => ({
  taoLiveEm: (tuy: { khiTrangThai?: (t: Tt) => void }) => {
    let tt = { ...NEN }
    dat = (o) => { tt = { ...tt, ...o }; act(() => { tuy.khiTrangThai?.({ ...tt }) }) }
    setTimeout(() => dat({}), 0)
    return {
      trangThai: () => ({ ...tt }), nhanView() {}, nhanTinPhong() {}, khiNoiLai() {}, moKhoaTieng: async () => true, datTieng() {}, datRoiMan() {},
      bang: () => ({ trang: '', tiLe: 16 / 9, net: [], cuoi: 0, lichSu: [], ghep: null }), khung: () => ({ dau: [], tro: null }), mucAm: () => 0, mucAmMic: () => 0.4, mucAmBan: () => 0.2, soDo: () => ({ kenhNet: 'ws' }), huy() {},
      batMicLenBang: async () => { goi.push('bat'); return { ok: true } }, tatMic: () => { goi.push('tat'); dat({ mic: 'tat' }) }, dangChoQuyenMic: () => choQuyen,
      gioTay() {}, deSau() {}, datGiayLech() {}, datHienBang() {},
    }
  },
}))

const view = { duocXem: true, san: true, bat: true, tu: 1, phien: 1, ss: null, tieng: 'tat', soNet: 0, bang: true, emTay: false, hangTay: null, emDuocMoi: false, emNoi: false, noi: [] } as never

const dangKy = () => {}
async function dung() {
  const { default: LopLive } = await import('../src/components/live/LopLive')
  render(<LopLive ve="ve" goc="https://may-chu" guiTho={() => {}} dangKy={dangKy} view={view} che="bang" de={null} khoaDe="q1" doi={{ ten: 'Đội Kali', ky: 'K', kj: 120 }} matMang={false} roi={false} />)
  await waitFor(() => expect(document.querySelector('.lv')).toBeTruthy())
}
beforeEach(() => { goi.length = 0; choQuyen = false; _datLaiTatMan() })
afterEach(() => { _datLaiTatMan() })

describe('mic của em lên bảng', () => {
  // 11/11 (thầy «ô tắt mở tiếng ẩn hết vào thanh»): mic của em lên bảng điều khiển TRONG khay (dòng «Mic của em · Đang bật / Đang tắt»), tay nắm mang huy hiệu
  // mic khi mic đang mở — không còn thẻ / nút nổi riêng trên bảng.
  // 11/11 LẦN 3 (thầy: «Chuyển mic, tắt tiếng, thanh ẩn sang hẳn góc phải … thiết kế ẩn hết vào thanh ẩn»): huy hiệu mic tròn nổi ⇒ DẤU mic rất nhỏ ngay trên tay nắm.
  it('phòng cho phép ⇒ mic TỰ BẬT; khay có dòng «Mic của em · Đang bật» + huy hiệu mic trên tay nắm; em tắt ⇒ không tự bật lại, bấm dòng ấy để bật lại; hết lượt gọi ⇒ sạch', async () => {
    await dung()
    expect(goi).toEqual([])
    dat({ duocMoMic: true })
    await waitFor(() => expect(goi).toContain('bat'))
    const nutMic = () => document.querySelector<HTMLButtonElement>('.lv-khay .lv-vua.mic')
    dat({ mic: 'xin-quyen' })
    expect(nutMic()!.textContent).toContain('Đang bật…')
    dat({ mic: 'dang-phat' })
    expect(nutMic()!.textContent).toContain('Mic của em'); expect(nutMic()!.textContent).toContain('Đang bật')
    expect(nutMic()!.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText('Thầy và cả lớp đang nghe em.')).toBeTruthy()
    expect(document.querySelector('.lv-nam .lv-nam-dau [data-dau="mic"]')!.getAttribute('title')).toBe('mic của em đang bật') // khay đóng vẫn biết mic đang mở
    expect(document.querySelector('.lv-nam')!.getAttribute('aria-label')).toContain('mic của em đang bật')
    expect(document.querySelector('.lv-nam-hh')).toBeNull() // hết huy hiệu tròn nổi
    expect(document.querySelector('.lv > .lv-noi, .lv > .lv-bat-tieng')).toBeNull() // không còn thẻ / nút nổi riêng trên bảng
    const soBat = goi.filter((x) => x === 'bat').length
    fireEvent.click(nutMic()!)
    expect(goi).toContain('tat')
    await waitFor(() => expect(nutMic()!.getAttribute('aria-label')).toContain('bật mic lại'))
    expect(document.querySelector('.lv-nam .lv-nam-dau [data-dau="mic"]')).toBeNull()
    await act(async () => { await new Promise((r) => setTimeout(r, 1700)) }) // quá một nhịp thử lại: KHÔNG tự bật lại
    expect(goi.filter((x) => x === 'bat').length).toBe(soBat)
    fireEvent.click(nutMic()!)
    await waitFor(() => expect(goi.filter((x) => x === 'bat').length).toBe(soBat + 1))
    // thầy chấm / lượt mới: phòng thôi cho phép ⇒ không còn dòng mic
    dat({ duocMoMic: false, mic: 'tat' })
    await waitFor(() => expect(nutMic()).toBeNull())
  })

  it('bị từ chối quyền mic ⇒ báo nhẹ kèm cách bật, không hỏi lại dồn dập', async () => {
    await dung()
    dat({ duocMoMic: true }); await waitFor(() => expect(goi).toContain('bat'))
    const so = goi.length
    dat({ mic: 'tu-choi' })
    expect(screen.getByText(/Máy em chưa cho dùng mic/)).toBeTruthy()
    await act(async () => { await new Promise((r) => setTimeout(r, 1700)) })
    expect(goi.length).toBe(so)
  })

  it('máy khác: «Bạn <tên gọi> đang nói» theo màu đội của bạn; chính em đang nói thì không hiện dải này', async () => {
    await dung()
    dat({ banNoi: { sbd: 'S2', ten: 'Trần Thị Minh Anh', doi: 3 } })
    const dai = screen.getByText(/Bạn Minh Anh đang nói/)
    expect(dai.getAttribute('style')).toContain('--p-do') // Đội Canxi
    dat({ banNoi: null })
    expect(screen.queryByText(/đang nói/)).toBeNull()
  })

  it('hộp hỏi quyền mic đang hiện ⇒ bộ bắt rời màn coi là đang xin quyền (không báo «cửa sổ nổi»); gỡ lớp live ⇒ hết', async () => {
    await dung()
    expect(dangXinQuyen()).toBe(false)
    choQuyen = true
    expect(dangXinQuyen()).toBe(true)
    choQuyen = false
    expect(dangXinQuyen()).toBe(false)
  })
})
