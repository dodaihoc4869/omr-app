// CỬA HÀNG PHỤ KIỆN · B1 — LOGIC MÀN (React Testing Library + máy chủ giả đúng hợp đồng). Bố cục Chromium: shop-bo-cuc-2109; khoá nguồn: shop-khoa-nguon-2109.
// (a) luồng đủ · (b) số dư CHỈ đổi theo đáp máy chủ · (c) bấm đúp ⇒ MỘT lần ghi cùng khoá · (d) mọi lỗi hợp đồng hiện lời máy chủ + "Thử lại"
// (e) đổi EXP không xuống dưới giữ lại · (f) cờ tắt / mất mạng / trống / đang tải / tấm chào · điểm cắm `veThu`.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import ManShop from '../src/game/than-thu-v2/shop/ManShop'
import { ShopApiGia } from '../src/game/than-thu-v2/shop/du-lieu-mau'
import type { MaLoiEp, TuyChonGia } from '../src/game/than-thu-v2/shop/du-lieu-mau'
import { LoiShopApi } from '../src/game/than-thu-v2/shop/kieu'
import type { DangMac, OGan, VeThuDauVao } from '../src/game/than-thu-v2/shop/kieu'

afterEach(cleanup)

/** Máy chủ giả có ghi lại khoá của từng lệnh ghi. */
class ApiGhi extends ShopApiGia {
  khoaMua: string[] = []
  khoaDoi: string[] = []
  async shopMua(maMon: string, giaThay: number, khoa: string) {
    this.khoaMua.push(khoa)
    return super.shopMua(maMon, giaThay, khoa)
  }
  async vangDoi(soExp: number, khoa: string) {
    this.khoaDoi.push(khoa)
    return super.vangDoi(soExp, khoa)
  }
}

function dung(t: TuyChonGia = {}, props: Partial<Parameters<typeof ManShop>[0]> = {}, api: ShopApiGia = new ApiGhi(t)) {
  const onDong = vi.fn()
  const r = render(<ManShop api={api} pet={2} cap={34} tenThu="Bé Mây" onDong={onDong} {...props} />)
  return { api: api as ApiGhi, onDong, ...r }
}
const sanSang = (c: HTMLElement) => waitFor(() => expect(c.querySelector('.ps-the[data-ma]')).not.toBeNull())
const the = (c: HTMLElement, ma: string) => c.querySelector<HTMLElement>(`.ps-the[data-ma="${ma}"]`)!
const vangHien = (c: HTMLElement) => c.querySelector('[data-vang]')?.textContent
const nut = (c: HTMLElement, viec: string) => c.querySelector<HTMLButtonElement>(`[data-viec="${viec}"]`)!
const hop = () => screen.getByRole('dialog')
const chu = (c: HTMLElement) => (c.textContent ?? '').replace(/\s+/g, ' ')
const chonMon = async (c: HTMLElement, ma: string) => {
  await sanSang(c)
  fireEvent.click(the(c, ma))
  expect(c.querySelector('.ps-san')).not.toBeNull()
}
const moTuDo = (c: HTMLElement) => {
  fireEvent.click(screen.getAllByRole('button', { name: 'Tủ đồ' })[0]!)
  expect(c.querySelector('.ps-tu-o, .ps-tu-trong, .ps-loi, .ps-tu-xam')).not.toBeNull()
}

describe('(a) luồng đủ: Cửa hàng → chạm món → Thử đồ → Mua → Xác nhận → thành công → món mặc → Tủ đồ', () => {
  it('đi hết luồng; món mua xong TỰ MẶC; Tủ đồ liệt kê, "Cởi ra" / "Mặc ngay" chạy qua máy chủ', async () => {
    const { api, container: c } = dung()
    await chonMon(c, 'VD-04')
    expect(screen.getByRole('heading', { level: 2, name: /^Thử đồ/ })).toBeTruthy()
    expect(chu(c)).toContain('Đang thử 1 phụ kiện')
    expect(chu(c)).toContain('Cả đoàn sẽ thấy thần thú của em y như thế này. Bảng vinh danh cũng vậy.')
    expect(chu(c)).toContain('Đủ vàng rồi')
    expect(nut(c, 'mua').textContent).toBe('Mua · 120 vàng')
    expect(api.ghi.mua).toBe(0) // thử thì không mất vàng, không ghi gì

    fireEvent.click(nut(c, 'mua'))
    expect(within(hop()).getByText('Em trả 120 vàng, còn lại 220 vàng. Mua rồi giữ mãi, không trả lại hay bán lại được.')).toBeTruthy()
    expect(api.ghi.mua).toBe(0) // một bước xác nhận: chưa ghi
    fireEvent.click(within(hop()).getByRole('button', { name: 'Mua · 120 vàng' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    expect(api.ghi.mua).toBe(1)
    expect(vangHien(c)).toBe('220')
    expect(chu(c)).toContain('Hợp quá! Đuôi Lửa Tím đã là của em. Em còn 220 vàng.')
    expect(chu(c)).toContain('Em vẫn đủ vàng cho Thảm Tinh Thể Xanh, giá 220 vàng.')
    expect(c.querySelector('.ps-gc-vet[data-mon="VD-04"]')).not.toBeNull() // món tự mặc lên thú
    expect(nut(c, 'dang-mac').disabled).toBe(true)
    expect(nut(c, 'dang-mac').textContent).toBe('Thần thú đang mặc món này')
    expect(api.dangMac.vet).toBe('VD-04')

    fireEvent.click(screen.getByRole('button', { name: 'Về Cửa hàng' }))
    moTuDo(c)
    const hang = c.querySelector<HTMLElement>('.ps-tu-hang[data-ma="VD-04"]')!
    expect(hang.textContent).toContain('Đang mặc')
    expect(chu(c)).toContain('Đuôi Bong Bóng') // món có sẵn
    expect(chu(c)).toContain('Khung Ô Nguyên Tố')
    fireEvent.click(hang.querySelector('[data-viec="coi"]')!)
    await waitFor(() => expect(api.dangMac.vet).toBeNull())
    await waitFor(() => expect(chu(c)).toContain('Đã cởi Đuôi Lửa Tím.'))
    expect(c.querySelector('.ps-tu-hang[data-ma="VD-04"] [data-viec="mac"]')!.textContent).toBe('Mặc ngay')
    fireEvent.click(c.querySelector('.ps-tu-hang[data-ma="VD-04"] [data-viec="mac"]')!)
    await waitFor(() => expect(api.dangMac.vet).toBe('VD-04'))
    await waitFor(() => expect(chu(c)).toContain('Đã mặc Đuôi Lửa Tím.'))
    expect(api.ghi).toMatchObject({ mua: 1, mac: 2 })
  })

  it('chạm tên món ở Tủ đồ hiện lại dòng Bật mí Hoá học; năm chỗ đeo đều có; chỗ chưa có món ghi lời trống; Trên đầu / Trên lưng kèm "Sắp mở"', async () => {
    const { container: c } = dung()
    await sanSang(c)
    moTuDo(c)
    expect([...c.querySelectorAll('.ps-tu-o h3')].map((h) => h.textContent)).toEqual(['Vòng sáng', 'Đuôi sáng', 'Khung tên', 'Trên đầuSắp mở', 'Trên lưngSắp mở'])
    expect(c.querySelector('.ps-tu-o[data-o="hao-quang"]')!.textContent).toContain('Chưa có món nào cho chỗ này.')
    const ten = c.querySelector<HTMLElement>('.ps-tu-hang[data-ma="KT-03"] .ps-tu-ten')!
    expect(ten.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(ten)
    expect(ten.getAttribute('aria-expanded')).toBe('true')
    expect(c.querySelector('.ps-tu-bat-mi')!.textContent).toContain('Bật mí Hoá học')
    expect(c.querySelector('.ps-tu-bat-mi')!.textContent).toContain('Bảng tuần hoàn có 118 nguyên tố, mỗi ô một nguyên tố.')
  })

  it('Thử đồ: mỗi chỗ đeo thử một món; "Bỏ thử món này" gỡ món; hết món thử ⇒ lời trống + "Tới Cửa hàng"; thanh quay lại hoạt động', async () => {
    const { container: c, onDong } = dung()
    await chonMon(c, 'VD-04')
    fireEvent.click(screen.getByRole('button', { name: 'Về Cửa hàng' }))
    fireEvent.click(the(c, 'HQ-05'))
    fireEvent.click(screen.getByRole('button', { name: 'Về Cửa hàng' }))
    fireEvent.click(the(c, 'VD-01')) // cùng chỗ đeo với VD-04 ⇒ thay
    expect(chu(c)).toContain('Đang thử 2 phụ kiện')
    expect([...c.querySelectorAll('.ps-thu-hang')].map((e) => e.getAttribute('data-ma'))).toEqual(['HQ-05', 'VD-01'])
    fireEvent.click(nut(c, 'bo-thu')) // đang xem VD-01
    expect([...c.querySelectorAll('.ps-thu-hang')].map((e) => e.getAttribute('data-ma'))).toEqual(['HQ-05'])
    fireEvent.click(nut(c, 'bo-thu'))
    expect(chu(c)).toContain('Em chưa thử món nào. Chạm một phụ kiện ở Cửa hàng, thần thú mặc thử liền.')
    expect(chu(c)).toContain('Đồ thần thú đang mặc')
    fireEvent.click(screen.getByRole('button', { name: 'Tới Cửa hàng' }))
    expect(screen.getByRole('heading', { level: 2, name: /^Cửa hàng/ })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Về Đảo thần thú' }))
    expect(onDong).toHaveBeenCalledTimes(1)
  })

  it('bảy trạng thái của món ở Thử đồ: đủ vàng · thiếu vàng (+ chỉ đường) · còn khoá (+ chỉ đường) · đã hết · đã có · đang mặc', async () => {
    const { container: c } = dung()
    await sanSang(c)
    const xem = async (ma: string) => {
      fireEvent.click(the(c, ma))
      const ct = c.querySelector<HTMLElement>('.ps-chi-tiet')!
      const kq = { chu: chu(ct), tt: ct.querySelector('.ps-chi-duong')!.textContent ?? '', nut: nut(c, ct.querySelector('.ps-hanh-dong')!.getAttribute('data-viec')!) }
      fireEvent.click(screen.getByRole('button', { name: 'Về Cửa hàng' }))
      return kq
    }
    const dv = await xem('HQ-03')
    expect(dv.nut.textContent).toBe('Mua · 150 vàng')
    expect(dv.tt).toBe('Đủ vàng rồi')
    const tv = await xem('HQ-05')
    expect(tv.tt).toContain('Chưa đủ vàng — còn thiếu 260 vàng')
    expect(tv.tt).toContain('Em có đủ EXP thừa. Đổi vàng là mua được.')
    expect(tv.nut.textContent).toBe('Đổi vàng')
    const xa = await xem('HQ-07')
    expect(xa.tt).toContain('Chưa đủ vàng — còn thiếu 2.060 vàng')
    expect(xa.tt).toContain('Học đều khoảng 21 ngày nữa là đủ vàng.') // (2.060 − 420) / 80 = 20,5 ⇒ 21
    const kh = await xem('KT-08')
    expect(kh.tt).toContain('Chưa mua được — cần chuỗi 14 ngày (em đang chuỗi 9 ngày)')
    expect(kh.tt).toContain('Giữ chuỗi thêm 5 ngày nữa là mở.')
    expect(kh.nut.disabled).toBe(true)
    expect(kh.nut.textContent).toBe('Cần chuỗi 14 ngày')
    expect(kh.chu).toContain('Chỉ còn 12 cái · mùa 1 có 30 cái')
    const hq8 = await xem('HQ-08')
    expect(hq8.tt).toContain('Giữ chuỗi thêm 5 ngày nữa là mở. Kiếm thêm 2 ấn thạch sáng ở Đoàn Hộ Tống là mở.')
    expect(hq8.chu).toContain('Chuỗi 14 ngày + 5 ấn thạch sáng')
    expect(hq8.chu).toContain('Mùa 1 chỉ có 20 cái')
    const het = await xem('VD-08')
    expect(het.tt).toBe('Đã hết')
    expect(het.nut.disabled).toBe(true)
    const co = await xem('VD-01')
    expect(co.tt).toBe('Đã có')
    expect(co.nut.textContent).toBe('Mặc ngay')
    const mac = await xem('KT-03')
    expect(mac.tt).toBe('Đang mặc')
    expect(mac.nut.disabled).toBe(true)
  })

  it('"Đổi vàng" ở Thử đồ đưa em tới khối Đổi vàng; "Mặc ngay" một món đã có chạy qua máy chủ', async () => {
    const { api, container: c } = dung()
    await chonMon(c, 'HQ-05')
    fireEvent.click(nut(c, 'toi-doi'))
    expect(screen.getByRole('heading', { level: 3, name: /^Đổi vàng/ })).toBeTruthy()
    fireEvent.click(the(c, 'VD-01'))
    fireEvent.click(nut(c, 'mac'))
    await waitFor(() => expect(api.dangMac.vet).toBe('VD-01'))
    await waitFor(() => expect(chu(c)).toContain('Đã mặc Đuôi Bong Bóng.'))
    expect(nut(c, 'dang-mac')).not.toBeNull()
  })
})

describe('Cửa hàng: ví, thẻ món, thanh lọc', () => {
  it('ví + dòng phụ theo số máy chủ; thẻ xếp giá tăng dần; mỗi thẻ có bậc bằng chữ, chỗ đeo, giá; khoá + số cái nói thật', async () => {
    const { container: c } = dung()
    await sanSang(c)
    expect(vangHien(c)).toBe('340')
    expect(chu(c)).toContain('Vàng của em')
    expect(chu(c)).toContain('Ống nghiệm có 620 EXP · Dự trữ đủ 3 ngày ăn')
    expect(chu(c)).toContain('Sắm đồ cho thần thú · Mùa 1, tới hết học kỳ I')
    expect(chu(c)).toContain('Đắt dần:')
    const gia = [...c.querySelectorAll<HTMLElement>('.ps-the')].map((e) => Number((e.querySelector('.ps-the-gia b')!.textContent ?? '').replace(/\./g, '')))
    expect(gia).toHaveLength(24)
    expect(gia).toEqual([...gia].sort((a, b) => a - b))
    const t = the(c, 'VD-04').textContent!
    expect(t).toContain('Đẹp')
    expect(t).toContain('Chỗ đeo: Đuôi sáng')
    expect(t).toContain('Giá 120 vàng')
    expect(the(c, 'KT-08').textContent).toContain('Cần chuỗi 14 ngày (em đang chuỗi 9 ngày)')
    expect(the(c, 'KT-08').textContent).toContain('Chỉ còn 12 cái')
    expect(the(c, 'HQ-08').textContent).toContain('Mùa 1 chỉ có 20 cái')
    expect(the(c, 'HQ-08').textContent).toContain('Cần chuỗi 14 ngày (em đang chuỗi 9 ngày) và 5 ấn thạch sáng (em đang có 3 ấn thạch)')
    expect(the(c, 'VD-08').textContent).toContain('Đã hết')
    expect(the(c, 'VD-01').textContent).toContain('Đã có')
    expect(the(c, 'KT-03').textContent).toContain('Đang mặc')
    expect(the(c, 'VD-04').getAttribute('aria-label')).toBe('Thử Đuôi Lửa Tím. Đẹp. Giá 120 vàng. Đủ vàng rồi')
  })

  it('thanh lọc theo chỗ đeo; Trên đầu / Trên lưng là chip "Sắp mở" (vô hiệu); đợt 2 mở ⇒ chip mở và đủ 40 món', async () => {
    const { container: c } = dung()
    await sanSang(c)
    const chip = (ten: RegExp) => screen.getByRole('button', { name: ten }) as HTMLButtonElement
    expect(chip(/^Trên đầu/).disabled).toBe(true)
    expect(chip(/^Trên đầu/).textContent).toContain('Sắp mở')
    expect(chip(/^Trên lưng/).disabled).toBe(true)
    expect(chip(/^Vòng sáng/).disabled).toBe(false)
    fireEvent.click(chip(/^Vòng sáng/))
    expect(chip(/^Vòng sáng/).getAttribute('aria-pressed')).toBe('true')
    expect(c.querySelectorAll('.ps-the')).toHaveLength(8)
    fireEvent.click(chip(/^Tất cả/))
    expect(c.querySelectorAll('.ps-the')).toHaveLength(24)
    cleanup()
    const d2 = dung({ dotMoBan: 2 })
    await sanSang(d2.container)
    expect(d2.container.querySelectorAll('.ps-the')).toHaveLength(40)
    expect((screen.getByRole('button', { name: /^Trên đầu/ }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('đang tải: khung xám giữ chỗ (6 thẻ xám, số ẩn, aria-busy), xong thì thay bằng dữ liệu thật', async () => {
    const { container: c } = dung({ tre: 120 })
    expect(c.querySelectorAll('.ps-xam')).toHaveLength(6)
    expect(c.querySelector('.ps-luoi')!.getAttribute('aria-busy')).toBe('true')
    expect(c.querySelector('[data-vang]')).toBeNull()
    expect(c.querySelector('.ps-the:not(.ps-xam)')).toBeNull()
    expect((c.querySelector('.ps-truot') as HTMLInputElement).disabled).toBe(true)
    await sanSang(c)
    expect(c.querySelectorAll('.ps-xam')).toHaveLength(0)
    expect(c.querySelector('.ps-luoi')!.getAttribute('aria-busy')).toBe('false')
  })
})

describe('(b) số dư CHỈ đổi theo đáp máy chủ (máy chủ giả trả số "lạ")', () => {
  it('mua: máy chủ trả 777 (không phải 340 − 120 = 220) ⇒ màn hiện 777, cả ở lời mừng', async () => {
    const { api, container: c } = dung({ tre: 40, congTac: { vangSauGhi: 777 } }) // chậm 40 ms: làm mới nền sau khi mua chưa kịp về khi ta đọc số
    await chonMon(c, 'VD-04')
    expect(vangHien(c)).toBe('340')
    fireEvent.click(nut(c, 'mua'))
    // xem trước trong hộp xác nhận là chữ chốt "còn lại" (chưa phải số dư); số dư thật chỉ đổi sau đáp
    expect(vangHien(c)).toBe('340')
    fireEvent.click(nut(c, 'mua-that'))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(vangHien(c)).toBe('777')
    expect(vangHien(c)).not.toBe('220')
    expect(chu(c)).toContain('Em còn 777 vàng.')
    // số chạy nhìn thấy được (300 ms) dừng đúng ở số máy chủ trả
    await act(async () => {
      await new Promise((r) => setTimeout(r, 380))
    })
    expect(c.querySelector('[data-vang-hien]')!.textContent).toBe('777')
    // làm mới nền sau đó (máy chủ giả giữ 777) cũng không kéo số về 220
    await waitFor(() => expect(api.nhatKy.filter((x) => x === 'shop-danh-sach').length).toBeGreaterThanOrEqual(2))
    await new Promise((r) => setTimeout(r, 30))
    expect(vangHien(c)).toBe('777')
  })

  it('đổi EXP: máy chủ trả 4.321 vàng, ống nghiệm 200 ⇒ màn hiện đúng số ấy', async () => {
    const { container: c } = dung({ tre: 40, congTac: { vangSauGhi: 4321 } })
    await sanSang(c)
    fireEvent.click(screen.getByRole('button', { name: 'Đổi được nhiều nhất 420 EXP' }))
    fireEvent.click(nut(c, 'doi'))
    fireEvent.click(nut(c, 'doi-that'))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(vangHien(c)).toBe('4.321')
    expect(chu(c)).toContain('Đã đổi xong. Em có 4.321 vàng, thần thú vẫn đủ 1 ngày ăn.')
    await waitFor(() => expect(chu(c)).toContain('Ống nghiệm có 200 EXP · Dự trữ đủ 1 ngày ăn'))
  })

  it('số ban đầu cũng là số máy chủ (không mặc định 340)', async () => {
    const { container: c } = dung({ vang: 1234, ongNghiem: 700 })
    await sanSang(c)
    expect(vangHien(c)).toBe('1.234')
    expect(chu(c)).toContain('Ống nghiệm có 700 EXP · Dự trữ đủ 3 ngày ăn')
  })
})

describe('(c) chống bấm đúp: MỘT lần ghi, cùng khoá', () => {
  it('bấm "Mua" ba lần liên tiếp trong hộp xác nhận ⇒ máy chủ giả nhận đúng MỘT lệnh ghi', async () => {
    const { api, container: c } = dung({ tre: 30 })
    await chonMon(c, 'VD-04')
    fireEvent.click(nut(c, 'mua'))
    const b = nut(c, 'mua-that')
    // ba lần bấm TRONG CÙNG MỘT nhịp vẽ (nút chưa kịp khoá trên DOM): chỉ cờ đồng bộ của màn chặn được
    act(() => {
      for (let i = 0; i < 3; i++) b.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(b.disabled).toBe(true) // và sau đó nút khoá
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(api.khoaMua).toHaveLength(1)
    expect(api.ghi.mua).toBe(1)
    expect(api.vang).toBe(220)
    expect(vangHien(c)).toBe('220')
  })

  it('bấm "Đổi" nhiều lần ⇒ một lệnh ghi', async () => {
    const { api, container: c } = dung({ tre: 30 })
    await sanSang(c)
    fireEvent.change(c.querySelector('.ps-truot')!, { target: { value: '180' } })
    fireEvent.click(nut(c, 'doi'))
    const b = nut(c, 'doi-that')
    act(() => {
      for (let i = 0; i < 3; i++) b.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(api.khoaDoi).toHaveLength(1)
    expect(api.ghi.doi).toBe(1)
    expect(vangHien(c)).toBe('520')
  })

  it('mất mạng giữa lúc gửi: "Thử lại" DÙNG LẠI khoá cũ (không mua hai lần); lỗi máy chủ rõ ràng thì khoá MỚI', async () => {
    const { api, container: c } = dung()
    await chonMon(c, 'VD-04')
    fireEvent.click(nut(c, 'mua'))
    api.congTac.matMang = true
    fireEvent.click(nut(c, 'mua-that'))
    await waitFor(() => expect(within(hop()).getByRole('alert').textContent).toBe('Mất mạng rồi. Có mạng lại mới mua được, em vẫn xem được Tủ đồ.'))
    api.congTac.matMang = false
    fireEvent.click(within(hop()).getByRole('button', { name: 'Thử lại' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(api.khoaMua).toHaveLength(2)
    expect(api.khoaMua[1]).toBe(api.khoaMua[0])
    expect(api.ghi.mua).toBe(1)

    // lỗi máy chủ rõ ràng (thieu_vang) ⇒ lần thử lại là khoá mới
    cleanup()
    const d = dung()
    await chonMon(d.container, 'VD-04')
    fireEvent.click(nut(d.container, 'mua'))
    d.api.congTac.epLoi = 'thieu_vang'
    fireEvent.click(nut(d.container, 'mua-that'))
    await waitFor(() => expect(within(hop()).getByRole('alert').textContent).toMatch(/^Chưa đủ vàng/))
    fireEvent.click(within(hop()).getByRole('button', { name: 'Thử lại' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(d.api.khoaMua).toHaveLength(2)
    expect(d.api.khoaMua[1]).not.toBe(d.api.khoaMua[0])
    expect(d.api.ghi.mua).toBe(1)
  })

  it('bàn phím: tiêu điểm vào nút chính, Tab / Shift+Tab quay vòng trong hộp, Esc đóng và trả tiêu điểm về nút đã mở hộp', async () => {
    const { container: c } = dung()
    await chonMon(c, 'VD-04')
    const mo = nut(c, 'mua')
    mo.focus()
    fireEvent.click(mo)
    expect(document.activeElement).toBe(nut(c, 'mua-that'))
    fireEvent.keyDown(hop(), { key: 'Tab' }) // nút chính là nút cuối ⇒ quay về nút đầu
    expect(document.activeElement).toBe(nut(c, 'de-sau'))
    fireEvent.keyDown(hop(), { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(nut(c, 'mua-that'))
    fireEvent.keyDown(hop(), { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(mo)
    // hộp mở từ nút sẽ khoá / biến mất (mua xong): tiêu điểm ở lại TRONG màn, không rơi ra thân trang
    fireEvent.click(mo)
    fireEvent.click(nut(c, 'mua-that'))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(c.contains(document.activeElement)).toBe(true)
    expect(document.activeElement).not.toBe(document.body)
  })

  it('"Để sau" và Esc đóng hộp xác nhận mà KHÔNG ghi gì; nút khoá khi đang gửi thì Esc không đóng', async () => {
    const { api, container: c } = dung({ tre: 40 })
    await chonMon(c, 'VD-04')
    fireEvent.click(nut(c, 'mua'))
    fireEvent.click(within(hop()).getByRole('button', { name: 'Để sau' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(nut(c, 'mua'))
    fireEvent.keyDown(hop(), { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(api.nhatKy.filter((x) => x === 'shop-mua')).toHaveLength(0)
    fireEvent.click(nut(c, 'mua'))
    fireEvent.click(nut(c, 'mua-that'))
    fireEvent.keyDown(hop(), { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeNull()
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(api.ghi.mua).toBe(1)
  })
})

describe('(d) mọi lỗi hợp đồng hiện lời máy chủ + "Thử lại"', () => {
  const MUA: [MaLoiEp, RegExp][] = [
    ['thieu_vang', /^Chưa đủ vàng — còn thiếu \d+ vàng\.$/],
    ['chua_mo', /^Món này cần chuỗi \d+ ngày\. Em đang chuỗi 9 ngày\.$/],
    ['het_suat', /^Món này đã hết\. Mùa 1 chỉ có \d+ cái\.$/],
    ['gia_doi', /^Giá vừa thay đổi, em xem lại rồi mua nhé\.$/],
    ['tam_dong', /^Cửa hàng đang tạm đóng\. Đồ em đã mua vẫn còn nguyên\.$/],
    ['da_co', /^Em đã có món này rồi\. Vào Tủ đồ để mặc\.$/],
    ['khong_co_mon', /^Không tìm thấy món này\.$/],
    ['sap_mo', /^Món này chưa mở bán\. Em quay lại sau nhé\.$/],
    ['sai_dau_vao', /^Yêu cầu chưa đúng\. Em thử lại nhé\.$/],
  ]
  for (const [ma, mau] of MUA)
    it(`shop-mua · ${ma}: lời máy chủ ngay trong hộp xác nhận, nút "Thử lại" gửi lại và thành công (lỗi giả chỉ bắn một lần)`, async () => {
      const { api, container: c } = dung()
      await chonMon(c, 'VD-04')
      fireEvent.click(nut(c, 'mua'))
      api.congTac.epLoi = ma
      fireEvent.click(nut(c, 'mua-that'))
      await waitFor(() => expect(within(hop()).getByRole('alert').textContent).toMatch(mau))
      expect(api.ghi.mua).toBe(0)
      expect(vangHien(c)).toBe('340') // lỗi thì số dư đứng nguyên
      const lai = within(hop()).getByRole('button', { name: 'Thử lại' })
      if (ma === 'gia_doi') {
        // máy chủ đổi giá 120 → 130: màn làm mới và nói giá mới trước khi em bấm lại
        await waitFor(() => expect(within(hop()).getByText(/Em trả 130 vàng, còn lại 210 vàng/)).toBeTruthy())
      }
      fireEvent.click(lai)
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
      expect(api.ghi.mua).toBe(1)
      expect(vangHien(c)).toBe(ma === 'gia_doi' ? '210' : '220')
    })

  it('vang-doi · duoi_nguong: lời "Thần thú cần giữ lại 200 EXP để ăn. Em đổi được tối đa 420 EXP." + "Thử lại"', async () => {
    const { api, container: c } = dung()
    await sanSang(c)
    fireEvent.change(c.querySelector('.ps-truot')!, { target: { value: '100' } })
    fireEvent.click(nut(c, 'doi'))
    api.congTac.epLoi = 'duoi_nguong'
    fireEvent.click(nut(c, 'doi-that'))
    await waitFor(() => expect(within(hop()).getByRole('alert').textContent).toBe('Thần thú cần giữ lại 200 EXP để ăn. Em đổi được tối đa 420 EXP.'))
    fireEvent.click(within(hop()).getByRole('button', { name: 'Thử lại' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(api.ghi.doi).toBe(1)
    expect(vangHien(c)).toBe('440')
  })

  it('tải hỏng: lời RIÊNG của máy chủ hiện nguyên văn + "Thử lại" (bấm lại gọi lại máy chủ); lỗi không rõ ⇒ lời chung', async () => {
    class Hong extends ShopApiGia {
      dem = 0
      async shopDanhSach(): Promise<never> {
        this.dem += 1
        throw new LoiShopApi('loi_may_chu', 'Lời riêng của máy chủ, màn không có sẵn câu này.')
      }
    }
    const api = new Hong()
    dung({}, {}, api)
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('Lời riêng của máy chủ, màn không có sẵn câu này.')
    fireEvent.click(within(alert).getByRole('button', { name: 'Thử lại' }))
    await waitFor(() => expect(api.dem).toBe(2))
    expect((await screen.findByRole('alert')).textContent).toContain('Lời riêng của máy chủ')
    cleanup()
    const k = dung({ congTac: { loiTai: 1 } })
    const a2 = await screen.findByRole('alert')
    expect(a2.textContent).toContain('Cửa hàng chưa tải được. Em bấm Thử lại nhé.')
    fireEvent.click(within(a2).getByRole('button', { name: 'Thử lại' }))
    await sanSang(k.container)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('thu-mac-do hỏng (chua_co): lời máy chủ + "Thử lại" ngay ở Tủ đồ, bấm lại thì mặc được', async () => {
    let lan = 0
    class MacLoi extends ApiGhi {
      async thuMacDo(o: OGan, ma: string | null) {
        lan += 1
        if (lan === 1) throw new LoiShopApi('chua_co', 'Em chưa có món này nên chưa mặc được.')
        return super.thuMacDo(o, ma)
      }
    }
    const { api, container: c } = dung({}, {}, new MacLoi())
    await sanSang(c)
    moTuDo(c)
    fireEvent.click(c.querySelector('.ps-tu-hang[data-ma="VD-01"] [data-viec="mac"]')!)
    const a = await screen.findByRole('alert')
    expect(a.textContent).toContain('Em chưa có món này nên chưa mặc được.')
    fireEvent.click(within(a).getByRole('button', { name: 'Thử lại' }))
    await waitFor(() => expect(api.dangMac.vet).toBe('VD-01'))
    await waitFor(() => expect(chu(c)).toContain('Đã mặc Đuôi Bong Bóng.'))
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('(e) đổi EXP: không xuống dưới giữ lại', () => {
  it('thanh kéo + ô nhập cho chọn TỪNG EXP (không bắt bội của 10), kẹp ở doiToiDa do máy chủ tính; số ngày ăn trước / sau khi đổi', async () => {
    const { container: c } = dung()
    await sanSang(c)
    const thanh = c.querySelector<HTMLInputElement>('.ps-truot')!
    const o = c.querySelector<HTMLInputElement>('.ps-nhap')!
    expect(thanh.max).toBe('420')
    expect(thanh.step).toBe('1')
    expect(nut(c, 'doi').disabled).toBe(true)
    expect(nut(c, 'doi').textContent).toBe('Kéo thanh để chọn số EXP')
    fireEvent.change(thanh, { target: { value: '180' } })
    expect(o.value).toBe('180')
    expect(nut(c, 'doi').textContent).toBe('Đổi 180 EXP lấy 180 vàng')
    expect(chu(c)).toContain('180 EXP thành 180 vàng')
    const dong = () => [...c.querySelectorAll('.ps-doi-dong')].map((r) => `${r.querySelector('span')!.textContent}|${r.querySelector('b')!.textContent}`)
    expect(dong()).toEqual(['Trước khi đổi|620 EXP · đủ 3 ngày ăn', 'Sau khi đổi|440 EXP · đủ 2 ngày ăn'])
    fireEvent.change(o, { target: { value: '7' } })
    expect(nut(c, 'doi').textContent).toBe('Đổi 7 EXP lấy 7 vàng')
    fireEvent.change(o, { target: { value: '999' } })
    expect(o.value).toBe('420')
    expect(dong()[1]).toBe('Sau khi đổi|200 EXP · đủ 1 ngày ăn') // đúng mức giữ lại, không thấp hơn
    fireEvent.change(o, { target: { value: '-5' } })
    expect(o.value).toBe('0')
    expect(nut(c, 'doi').disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Đổi được nhiều nhất 420 EXP' }))
    expect(o.value).toBe('420')
  })

  it('hộp xác nhận nói thật cái giá [X1]; đổi xong [M3]; hết EXP thừa thì khối đổi khoá và nói "Chưa có EXP thừa"', async () => {
    const { api, container: c } = dung()
    await sanSang(c)
    fireEvent.change(c.querySelector('.ps-truot')!, { target: { value: '180' } })
    fireEvent.click(nut(c, 'doi'))
    expect(within(hop()).getByText('Thần thú bớt 180 EXP dự trữ, vẫn đủ 2 ngày ăn. Em nhận 180 vàng, đổi rồi không đổi ngược lại được.')).toBeTruthy()
    expect(within(hop()).getByRole('button', { name: 'Đổi 180 EXP' })).toBeTruthy()
    fireEvent.click(nut(c, 'doi-that'))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(chu(c)).toContain('Đã đổi xong. Em có 520 vàng, thần thú vẫn đủ 2 ngày ăn.')
    expect(vangHien(c)).toBe('520')
    await waitFor(() => expect(c.querySelector<HTMLInputElement>('.ps-truot')!.max).toBe('240')) // doiToiDa máy chủ tính lại
    expect(api.ghi.doi).toBe(1)
    // đổi nốt phần còn lại
    fireEvent.click(screen.getByRole('button', { name: 'Đổi được nhiều nhất 240 EXP' }))
    fireEvent.click(nut(c, 'doi'))
    fireEvent.click(nut(c, 'doi-that'))
    await waitFor(() => expect(vangHien(c)).toBe('760'))
    await waitFor(() => expect(c.querySelector<HTMLInputElement>('.ps-truot')!.disabled).toBe(true))
    expect(c.querySelector<HTMLInputElement>('.ps-nhap')!.disabled).toBe(true)
    expect(nut(c, 'doi').disabled).toBe(true)
    expect(nut(c, 'doi').textContent).toBe('Chưa có EXP thừa để đổi')
    expect(chu(c)).toContain('Chưa có EXP thừa. Thần thú cần giữ 200 EXP để ăn.')
    expect(chu(c)).toContain('Làm nhiệm vụ hôm nay để ống nghiệm đầy thêm.')
    expect(api.ongNghiem).toBe(200) // máy chủ giữ đúng 200
  })

  it('ống nghiệm ≤ 200 EXP ngay từ đầu: khối đổi khoá, nói lý do, không có gì để gửi', async () => {
    const { api, container: c } = dung({ ongNghiem: 200 })
    await sanSang(c)
    expect(c.querySelector<HTMLInputElement>('.ps-truot')!.disabled).toBe(true)
    expect(nut(c, 'doi').disabled).toBe(true)
    expect(chu(c)).toContain('Chưa có EXP thừa. Thần thú cần giữ 200 EXP để ăn.')
    expect(chu(c)).toContain('Ống nghiệm có 200 EXP · Dự trữ đủ 1 ngày ăn')
    fireEvent.click(nut(c, 'doi'))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(api.nhatKy.filter((x) => x === 'vang-doi')).toHaveLength(0)
  })
})

describe('(f) cờ tắt · mất mạng · Tủ đồ trống · tấm chào · điểm cắm veThu', () => {
  it('cờ tắt (vang-xem bat:false, ba lệnh còn lại tam_dong): màn nói "Cửa hàng đang tạm đóng", không có khối đổi / thẻ; vẫn mở được Tủ đồ và không nói dối là "trống"', async () => {
    const { container: c } = dung({ congTac: { batShop: false } })
    const a = await screen.findByRole('alert')
    expect(a.textContent).toContain('Cửa hàng đang tạm đóng. Đồ em đã mua vẫn còn nguyên.')
    expect(within(a).queryByRole('button', { name: 'Thử lại' })).toBeNull() // đóng thì bấm lại vô ích
    expect(c.querySelector('.ps-doi')).toBeNull()
    expect(c.querySelector('.ps-the')).toBeNull()
    moTuDo(c)
    expect(chu(c)).toContain('Đồ em đã mua vẫn còn nguyên')
    expect(chu(c)).not.toContain('Tủ đồ còn trống')
  })

  it('cờ tắt giữa phiên: Tủ đồ dùng danh sách của lần tải trước và vẫn mặc / cởi được (thu-mac-do còn chạy)', async () => {
    const { api, container: c } = dung()
    await sanSang(c)
    api.congTac.batShop = false
    moTuDo(c)
    fireEvent.click(c.querySelector('.ps-tu-hang[data-ma="VD-01"] [data-viec="mac"]')!)
    await waitFor(() => expect(api.dangMac.vet).toBe('VD-01'))
    await waitFor(() => expect(chu(c)).toContain('Đã mặc Đuôi Bong Bóng.'))
  })

  it('mất mạng lúc tải: lời L9 + "Thử lại" + Tủ đồ; có mạng lại thì "Thử lại" tải được', async () => {
    const { api, container: c } = dung({ congTac: { matMang: true } })
    const a = await screen.findByRole('alert')
    expect(a.textContent).toContain('Mất mạng rồi. Có mạng lại mới mua được, em vẫn xem được Tủ đồ.')
    expect(screen.getByRole('button', { name: 'Tủ đồ' })).toBeTruthy() // vẫn có đường vào Tủ đồ ở đầu màn
    api.congTac.matMang = false
    fireEvent.click(within(a).getByRole('button', { name: 'Thử lại' }))
    await sanSang(c)
    expect(vangHien(c)).toBe('340')
  })

  it('mất mạng SAU khi tải: mua báo lỗi mất mạng trong hộp, nhưng Tủ đồ vẫn xem được (danh sách lần tải trước)', async () => {
    const { api, container: c } = dung()
    await chonMon(c, 'VD-04')
    api.congTac.matMang = true
    fireEvent.click(nut(c, 'mua'))
    fireEvent.click(nut(c, 'mua-that'))
    await waitFor(() => expect(within(hop()).getByRole('alert').textContent).toContain('Mất mạng rồi.'))
    fireEvent.click(within(hop()).getByRole('button', { name: 'Để sau' }))
    fireEvent.click(screen.getByRole('button', { name: 'Về Cửa hàng' }))
    moTuDo(c)
    expect(chu(c)).toContain('Đuôi Bong Bóng')
    expect(chu(c)).toContain('Khung Ô Nguyên Tố')
    expect(vangHien(c) ?? '').not.toBe('220')
  })

  it('Tủ đồ trống cả tủ: lời [R1] + "Tới Cửa hàng"', async () => {
    const { container: c } = dung({ soHuu: [], dangMac: {} })
    await sanSang(c)
    moTuDo(c)
    expect(chu(c)).toContain('Tủ đồ còn trống. Ghé Cửa hàng chọn món đầu tiên, có món chỉ 20 vàng.')
    fireEvent.click(screen.getByRole('button', { name: 'Tới Cửa hàng' }))
    expect(screen.getByRole('heading', { level: 2, name: /^Cửa hàng/ })).toBeTruthy()
  })

  it('tấm chào lần đầu [C1–C4]: hiện đúng bốn câu, "Xem Cửa hàng" đóng và báo `onDaChao` một lần', async () => {
    const onDaChao = vi.fn()
    const { container: c } = dung({}, { chaoLanDau: true, onDaChao })
    const h = await screen.findByRole('dialog')
    for (const s of ['Chào em tới Cửa hàng.', 'EXP thừa đổi thành vàng. Vàng mua đồ cho thần thú.', 'Phụ kiện chỉ để đẹp, không làm thần thú mạnh hơn.', 'Vàng chỉ đến từ việc học. Không nạp tiền, không xin bạn được.']) expect(within(h).getByText(s)).toBeTruthy()
    fireEvent.click(within(h).getByRole('button', { name: 'Xem Cửa hàng' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onDaChao).toHaveBeenCalledTimes(1)
    await sanSang(c)
  })

  it('điểm cắm `veThu`: nhận đúng dangMac (món thử đè món mặc), pet, cap, tên; thay bản vẽ mặc định mà không đổi gì khác', async () => {
    const goi: VeThuDauVao[] = []
    const veThu = (o: VeThuDauVao): ReactNode => {
      goi.push(o)
      return <b data-thu-that="">{o.dangMac.vet ?? 'khong'}</b>
    }
    const { container: c } = dung({}, { veThu, pet: 3, cap: 12 })
    await chonMon(c, 'VD-04')
    const cuoi = () => goi[goi.length - 1]!
    expect(c.querySelector('[data-thu-that]')!.textContent).toBe('VD-04')
    expect(c.querySelector('.ps-gc-vet')).toBeNull() // bản vẽ mặc định không còn
    const dm = cuoi().dangMac as DangMac
    expect(dm).toMatchObject({ vet: 'VD-04', khung: 'KT-03', 'hao-quang': null, dau: null, 'co-lung': null })
    expect(cuoi()).toMatchObject({ pet: 3, cap: 12, ten: 'Bé Mây', nhan: 'Tên em đặt cho thần thú' })
    expect(cuoi().size).toBeGreaterThanOrEqual(150)
    // bỏ thử ⇒ quay về món đang mặc (không có vệt)
    fireEvent.click(nut(c, 'bo-thu'))
    expect(c.querySelector('[data-thu-that]')!.textContent).toBe('khong')
  })
})
