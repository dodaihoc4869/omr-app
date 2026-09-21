// Ô "THI ĐUA HÔM NAY" (8A, thầy chốt 21/09; Boss soát mẫu 4 sửa): đọc chặt thân máy chủ; MẶC ĐỊNH GỌN (một hàng bục thu nhỏ, ảnh THÚ THẬT, dòng vị trí, nút, thẻ cam nhóm cuối LUÔN hiện);
// bấm tiêu đề ⇒ bản đầy đủ (nhớ trong phiên); em 0 câu ⇒ KHÔNG in hạng; hai nút dẫn tới việc CHƯA XONG đầu tiên (hết việc ⇒ Đảo thần thú); "vừa vượt lên" suy từ hai lần nạp liên tiếp, giữ 2 phút,
// chỉ nói bạn trong bục; làm mới 60 giây; thiếu lệnh/dữ liệu ⇒ KHÔNG có ô (Pages đi trước Worker được); không nêu tên ai chưa học; không emoji.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import OThiDua from '../src/components/bang-nhiem-vu/OThiDua'
import BangNhiemVu from '../src/components/bang-nhiem-vu/BangNhiemVu'
import { chuHangEm, chuaAiHoc, docThiDua, docThuBan, dungBuc, vuaVuotLen, type ThiDua } from '../src/lib/thi-dua'
import { GIU_VUA_VUOT_MS, NHIP_THI_DUA_MS, useThiDua } from '../src/lib/use-thi-dua'
import { taiThiDua } from '../src/lib/thi-dua-api'
import { tuKeHoachNgay, type KeHoachNgayMayChu } from '../src/lib/nhiem-vu-adapter'
import { PETS } from '../src/game/than-thu-v2/core'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: () => null }))
const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u

const LUA = PETS[3]!.id
const RAW = {
  ok: true,
  lop: '12A1',
  siSo: 42,
  daHoc: 27,
  top: [
    { ten: 'Khánh Linh', soCau: 58, chuoi: 12, thu: { pet: PETS[0]!.id, cap: 40, ten: 'Bạch Hổ' } },
    { ten: 'Minh Quân', soCau: 51, chuoi: 7, thu: PETS[1]!.id },
    { ten: 'Bảo Ngọc', soCau: 47, chuoi: 5, thu: { pet: LUA, cap: 5 } },
  ],
  cuaEm: { hang: 9, soCau: 31, themDeVuot: { soCau: 5, soBan: 2 }, nhomCuoi: false },
  capNhatLuc: '2026-09-21T07:00:00Z',
}
const T = (sua: (r: any) => void = () => {}): ThiDua => {
  const r = JSON.parse(JSON.stringify(RAW))
  sua(r)
  return docThiDua(r)!
}
const v = (t: ThiDua | null, vuot: string | null = null) => ({ thiDua: t, vuot })

afterEach(() => {
  cleanup()
  sessionStorage.clear()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('docThiDua / docThuBan — đọc chặt', () => {
  it('thân đúng ⇒ dựng đủ; thú lấy đúng chỉ số theo id; id lạ ⇒ chiSo null (hình trung tính)', () => {
    const t = T()
    expect(t.siSo).toBe(42)
    expect(t.top).toHaveLength(3)
    expect(t.top[0]!.thu).toEqual({ chiSo: 0, cap: 40, ten: 'Bạch Hổ' })
    expect(t.top[1]!.thu.chiSo).toBe(1)
    expect(t.top[1]!.thu.cap).toBe(1)
    expect(t.top[2]!.thu.chiSo).toBe(3)
    expect(docThuBan('khong_co_thu_nay').chiSo).toBeNull()
    expect(docThuBan(null).chiSo).toBeNull()
    expect(docThuBan(undefined).ten).toBe('')
  })
  it('sai dạng ⇒ null: thiếu siSo/daHoc/cuaEm, daHoc > siSo, ok:false, có câu mà hạng hỏng', () => {
    for (const hong of [null, [], 'x', { ...RAW, ok: false }, { ...RAW, siSo: 0 }, { ...RAW, daHoc: 43 }, { ...RAW, siSo: 'a' }, { ...RAW, cuaEm: null }, { ...RAW, cuaEm: { ...RAW.cuaEm, soCau: -1 } }, { ...RAW, cuaEm: { ...RAW.cuaEm, hang: 0 } }, { ...RAW, cuaEm: { ...RAW.cuaEm, hang: 43 } }, { ...RAW, cuaEm: { ...RAW.cuaEm, hang: null } }]) {
      expect(docThiDua(hong)).toBeNull()
    }
  })
  it('em 0 câu ⇒ hạng LUÔN null dù máy chủ có gửi số; em >0 câu ⇒ giữ hạng', () => {
    expect(T((r) => { r.cuaEm = { hang: null, soCau: 0, themDeVuot: null, nhomCuoi: false } }).cuaEm.hang).toBeNull()
    expect(T((r) => { r.cuaEm = { hang: 17, soCau: 0, themDeVuot: null, nhomCuoi: false } }).cuaEm.hang).toBeNull()
    expect(T().cuaEm.hang).toBe(9)
  })
  it('bạn trong bục thiếu tên/số câu bị bỏ; tối đa 3; themDeVuot chỉ nhận khi CẢ HAI số > 0', () => {
    const t = T((r) => { r.top = [{ ten: '', soCau: 5 }, { ten: 'A', soCau: 'x' }, ...RAW.top, { ten: 'Dư', soCau: 1 }] })
    expect(t.top.map((b) => b.ten)).toEqual(['Khánh Linh', 'Minh Quân', 'Bảo Ngọc'])
    expect(T((r) => { r.cuaEm.themDeVuot = { soCau: 0, soBan: 2 } }).cuaEm.themDeVuot).toBeNull()
    expect(T((r) => { r.cuaEm.themDeVuot = { soCau: 3, soBan: 0 } }).cuaEm.themDeVuot).toBeNull()
    expect(T().cuaEm.themDeVuot).toEqual({ soCau: 5, soBan: 2 })
  })
})

describe('bục + dòng vị trí', () => {
  it('em hạng ≤ 3 đứng đúng chỗ với tên "Em"; thiếu bạn thì ô trống', () => {
    const b = dungBuc(T((r) => { r.cuaEm.hang = 2 }))
    expect(b[1]!.ten).toBe('Em')
    expect(b[1]!.laEm).toBe(true)
    expect(b[0]!.ten).toBe('Khánh Linh')
    expect(dungBuc(T((r) => { r.top = [RAW.top[0]] }))[2]).toBeNull()
  })
  it('chuHangEm: hạng có nhãn; hạng 1 = dẫn đầu; null ⇒ "Em chưa vào bảng hôm nay · N bạn đã vào"', () => {
    expect(chuHangEm(T()).gon).toBe('Em đang hạng 9 trong 42 bạn · đã làm 31 câu hôm nay')
    expect(chuHangEm(T()).them).toBe('Làm thêm 5 câu là vượt 2 bạn')
    expect(chuHangEm(T((r) => { r.cuaEm.hang = 1; r.cuaEm.themDeVuot = null })).tieuDe).toBe('Em đang dẫn đầu lớp')
    const trong = chuHangEm(T((r) => { r.cuaEm = { hang: null, soCau: 0, themDeVuot: null, nhomCuoi: false } }))
    expect(trong.gon).toBe('Em chưa vào bảng hôm nay · 27 bạn đã vào')
    expect(trong.phu).toBe('27 bạn đã vào')
    expect(chuHangEm(T((r) => { r.cuaEm.hang = 1; r.daHoc = 0 })).tieuDe).toBe('Em đang hạng 1 trong 42 bạn') // chưa bạn nào học ⇒ không tự phong "dẫn đầu"
    expect(trong.gon).not.toMatch(/hạng/i)
  })
  it('chuaAiHoc: chỉ khi 0 bạn học và bục không ai có câu', () => {
    expect(chuaAiHoc(T((r) => { r.daHoc = 0; r.top = []; r.cuaEm = { hang: null, soCau: 0, themDeVuot: null, nhomCuoi: false } }))).toBe(true)
    expect(chuaAiHoc(T((r) => { r.daHoc = 0 }))).toBe(false)
    expect(chuaAiHoc(T())).toBe(false)
  })
})

describe('vuaVuotLen — suy từ hai lần nạp', () => {
  it('lần đầu (không có bản trước) ⇒ không nói gì', () => {
    expect(vuaVuotLen(null, T())).toBeNull()
  })
  it('bạn lên hạng cao hơn hoặc mới vào bục ⇒ nói tên (bỏ chữ lót) + hạng mới; không đổi ⇒ null', () => {
    const truoc = T()
    expect(vuaVuotLen(truoc, T())).toBeNull()
    const nay = T((r) => { r.top = [RAW.top[1], RAW.top[0], RAW.top[2]] })
    expect(vuaVuotLen(truoc, nay)).toBe('Minh Quân vừa vượt lên hạng 1')
    const moi = T((r) => { r.top = [RAW.top[0], RAW.top[1], { ten: 'Thu Hà', soCau: 48, chuoi: 2, thu: PETS[2]!.id }] })
    expect(vuaVuotLen(truoc, moi)).toBe('Thu Hà vừa vượt lên hạng 3')
  })
  it('bạn chỉ "lên" vì em bị xếp chen vào bục, hoặc chính em ⇒ không tính', () => {
    const truoc = T()
    const nay = T((r) => { r.cuaEm.hang = 1; r.top = [{ ten: 'Em', soCau: 60, chuoi: 1, thu: PETS[0]!.id }, RAW.top[0], RAW.top[1]] })
    expect(vuaVuotLen(truoc, nay)).toBeNull()
  })
})

describe('OThiDua — bản GỌN mặc định', () => {
  it('có đủ: tiêu đề bấm được, 3 bạn kèm ảnh THÚ THẬT + số câu, dòng vị trí có nhãn, nút "Làm thêm N câu…"', () => {
    const { container } = render(<OThiDua v={v(T())} onLam={() => {}} />)
    const o = container.querySelector('[data-vung="thi-dua"]')!
    expect(o.getAttribute('data-che-do')).toBe('gon')
    expect(screen.getByRole('button', { name: /Xem bảng thi đua/ })).toBeTruthy()
    const imgs = [...o.querySelectorAll('img')].map((i) => i.getAttribute('src'))
    expect(imgs).toHaveLength(3)
    for (const s of imgs) expect(s).toMatch(/^\/than-thu-v2\/nho\/thu-\d-\d-be\.webp$/)
    expect(imgs[0]).toContain('thu-0-')
    expect(imgs[1]).toContain('thu-1-')
    expect(o.querySelector('[data-vung="vi-tri-em"]')!.textContent).toBe('Em đang hạng 9 trong 42 bạn · đã làm 31 câu hôm nay')
    expect(screen.getByText('58 câu')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Làm thêm 5 câu là vượt 2 bạn' })).toBeTruthy()
    expect(o.textContent).not.toMatch(/chưa học hôm nay/) // phần "N bạn chưa học" chỉ ở bản đầy đủ
    expect(EMOJI.test(o.textContent || '')).toBe(false)
  })
  it('đã có hạng nhưng không còn "làm thêm" (không vượt được ai) ⇒ KHÔNG có nút làm thêm; không thẻ cam', () => {
    const { container } = render(<OThiDua v={v(T((r) => { r.cuaEm.themDeVuot = null }))} onLam={() => {}} />)
    expect(container.querySelector('[data-vung="nut-lam-them"]')).toBeNull()
    expect(container.querySelectorAll('button')).toHaveLength(1)
  })
  it('bạn chưa chọn thú ⇒ biểu tượng trung tính (không ảnh), không vỡ ảnh', () => {
    const { container } = render(<OThiDua v={v(T((r) => { r.top[1].thu = 'khong_ro' }))} onLam={() => {}} />)
    expect(container.querySelectorAll('img')).toHaveLength(2)
  })
  it('dựng gọn ≤ 300 px ở 390: khoá bằng số phần tử — 1 hàng bục, 1 dòng vị trí, 1 nút, không thanh lớp, không chân giải thích', () => {
    const { container } = render(<OThiDua v={v(T())} onLam={() => {}} />)
    const o = container.querySelector('[data-vung="thi-dua"]')!
    expect(o.querySelectorAll('ol')).toHaveLength(1)
    expect(o.querySelectorAll('[role="progressbar"]')).toHaveLength(0)
    expect(o.querySelector('.bnv-td-chan')).toBeNull()
    expect(o.querySelectorAll('button')).toHaveLength(2) // tiêu đề + nút làm thêm
  })
  it('bấm tiêu đề ⇒ BẢN ĐẦY ĐỦ (thanh lớp, chân giải thích, "N bạn chưa học" chỉ con số) và nhớ trong phiên; bấm lần nữa ⇒ gọn lại', () => {
    const { container, unmount } = render(<OThiDua v={v(T())} onLam={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /Xem bảng thi đua/ }))
    let o = container.querySelector('[data-vung="thi-dua"]')!
    expect(o.getAttribute('data-che-do')).toBe('day-du')
    expect(o.querySelector('[role="progressbar"]')!.getAttribute('aria-valuenow')).toBe('27')
    expect(o.querySelector('[data-vung="chua-hoc"]')!.textContent).toContain('15 bạn')
    expect(o.querySelector('.bnv-td-chan')!.textContent).toMatch(/Không xếp theo điểm/)
    expect(screen.getByText('Chuỗi 12 ngày')).toBeTruthy()
    expect(sessionStorage.getItem('omr_thi_dua_mo')).toBe('1')
    unmount()
    const lai = render(<OThiDua v={v(T())} onLam={() => {}} />)
    o = lai.container.querySelector('[data-vung="thi-dua"]')!
    expect(o.getAttribute('data-che-do')).toBe('day-du') // nhớ trong phiên
    fireEvent.click(screen.getByRole('button', { name: /Thu gọn/ }))
    expect(lai.container.querySelector('[data-vung="thi-dua"]')!.getAttribute('data-che-do')).toBe('gon')
    expect(sessionStorage.getItem('omr_thi_dua_mo')).toBe('0')
  })
  it('máy chặn sessionStorage ⇒ vẫn bấm mở/gọn được, không lỗi', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('chan') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('chan') })
    const { container } = render(<OThiDua v={v(T())} onLam={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /Xem bảng thi đua/ }))
    expect(container.querySelector('[data-vung="thi-dua"]')!.getAttribute('data-che-do')).toBe('day-du')
    vi.restoreAllMocks()
  })
  it('bản đầy đủ: mỗi bạn có ảnh thú thật, tên thú, số câu và chuỗi; KHÔNG nêu tên ai chưa học', () => {
    const { container } = render(<OThiDua v={v(T())} onLam={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /Xem bảng thi đua/ }))
    expect(container.querySelectorAll('.bnv-td-buc img')).toHaveLength(3)
    expect(screen.getByText('Bạch Hổ')).toBeTruthy()
    expect(container.querySelector('[data-vung="chua-hoc"]')!.textContent).toBe('15 bạn chưa học hôm nay')
    expect(container.textContent).not.toMatch(/chưa học:|chưa học\s+[A-ZĐ][a-zà-ỹ]+ [A-ZĐ]/)
  })
})

describe('OThiDua — em chưa làm câu nào (KHÔNG in hạng)', () => {
  const trong = () => T((r) => { r.cuaEm = { hang: null, soCau: 0, themDeVuot: null, nhomCuoi: false } })
  it('gọn: "Em chưa vào bảng hôm nay · 27 bạn đã vào"; không có chữ "hạng của em" hay số hạng; nút mời làm câu đầu', () => {
    const { container } = render(<OThiDua v={v(trong())} onLam={() => {}} />)
    const o = container.querySelector('[data-vung="thi-dua"]')!
    expect(o.querySelector('[data-vung="vi-tri-em"]')!.textContent).toBe('Em chưa vào bảng hôm nay · 27 bạn đã vào')
    expect(o.textContent).not.toMatch(/Em đang hạng/)
    expect(screen.getByRole('button', { name: 'Làm câu đầu tiên vào bảng' })).toBeTruthy()
  })
  it('đầy đủ: không có ô số hạng', () => {
    const { container } = render(<OThiDua v={v(trong())} onLam={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /Xem bảng thi đua/ }))
    expect(container.querySelector('.bnv-td-em__hang')).toBeNull()
    expect(container.querySelector('[data-vung="vi-tri-em"]')!.textContent).toContain('Em chưa vào bảng hôm nay')
  })
  it('đầu ngày, chưa ai học ⇒ ba ô "Còn trống", lời mời làm câu đầu là dẫn đầu; không bịa hạng', () => {
    const t = T((r) => { r.daHoc = 0; r.top = []; r.cuaEm = { hang: null, soCau: 0, themDeVuot: null, nhomCuoi: false } })
    const { container } = render(<OThiDua v={v(t)} onLam={() => {}} />)
    const o = container.querySelector('[data-vung="thi-dua"]')!
    expect(o.getAttribute('data-trang-thai')).toBe('dau-ngay')
    expect(o.textContent).toContain('Chưa bạn nào học hôm nay')
    expect(screen.getAllByText('Còn trống')).toHaveLength(3)
    expect(container.querySelectorAll('img')).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Làm câu đầu tiên hôm nay' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Xem bảng thi đua/ }))
    expect(container.querySelector('[data-vung="chua-hoc"]')).toBeNull() // đầu ngày: không đếm "N bạn chưa học" (ai cũng chưa)
  })
})

describe('OThiDua — thẻ cam "nhóm cuối" (chỉ của em; LUÔN hiện ở bản gọn)', () => {
  const cuoi = () => T((r) => { r.cuaEm = { hang: 41, soCau: 3, themDeVuot: { soCau: 6, soBan: 4 }, nhomCuoi: true } })
  it('gọn có thẻ cam + nút "Làm 6 câu ngay"; đầy đủ vẫn có; không nhóm cuối ⇒ không thẻ', () => {
    const { container } = render(<OThiDua v={v(cuoi())} onLam={() => {}} />)
    expect(container.querySelector('[data-vung="nhom-cuoi"]')!.textContent).toContain('6 câu là thoát nhóm cuối')
    expect(screen.getByRole('button', { name: 'Làm 6 câu ngay' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Xem bảng thi đua/ }))
    expect(container.querySelector('[data-vung="nhom-cuoi"]')).toBeTruthy()
    cleanup()
    const khong = render(<OThiDua v={v(T())} onLam={() => {}} />)
    expect(khong.container.querySelector('[data-vung="nhom-cuoi"]')).toBeNull()
  })
  it('không có onLam ⇒ không nút nào dẫn đi (chỉ chữ)', () => {
    const { container } = render(<OThiDua v={v(cuoi())} />)
    expect(container.querySelector('[data-vung="nhom-cuoi"] button')).toBeNull()
    expect(container.querySelector('[data-vung="nut-lam-them"]')).toBeNull()
  })
})

describe('OThiDua — "vừa vượt lên"', () => {
  it('có câu ⇒ hiện dạng thông báo mềm (role=status, aria-live=polite); không có ⇒ không dòng; đầu ngày ⇒ không', () => {
    const { container } = render(<OThiDua v={v(T(), 'Minh Quân vừa vượt lên hạng 1')} onLam={() => {}} />)
    const s = container.querySelector('[data-vung="vua-vuot"]')!
    expect(s.getAttribute('role')).toBe('status')
    expect(s.getAttribute('aria-live')).toBe('polite')
    expect(s.textContent).toBe('Minh Quân vừa vượt lên hạng 1')
    cleanup()
    expect(render(<OThiDua v={v(T(), null)} onLam={() => {}} />).container.querySelector('[data-vung="vua-vuot"]')).toBeNull()
  })
  it('thiếu dữ liệu ⇒ KHÔNG dựng ô nào', () => {
    expect(render(<OThiDua v={v(null)} onLam={() => {}} />).container.firstChild).toBeNull()
  })
})

describe('hai nút dẫn tới VIỆC CHƯA XONG ĐẦU TIÊN của Bảng nhiệm vụ (hết việc ⇒ Đảo thần thú)', () => {
  const NOW = Date.parse('2026-09-21T10:00:00+07:00')
  const gio = (h: number) => new Date(NOW + h * 3600_000).toISOString()
  const vm = (o: object) => ({ thuTu: 1, batBuoc: false, khan: false, cong: null, hien: true, nhan: null, trangThai: 'cho', ghiChu: '', chiTiet: {}, hanCung: null, hanMem: null, soCau: 6, ...o })
  const kh = (viec: unknown[]): KeHoachNgayMayChu => ({
    ok: true,
    nganSach: { mucTieuCau: 12, toiThieuCau: 6, vanTocGiay: 78, vanTocNguon: 'do', ghiChuVanToc: '' },
    viec: viec as any,
    canhBao: [],
    quaHan: [],
    tienBo: { daLamCau: 0, lenBac: 0, conThieu: 6 },
    chuoiDat: 0,
    lanNghi: false,
    capNhatLuc: gio(-0.1),
  })
  const phu = { dsBtvn: [{ maBtvn: 'BT-A', maCa: 'CA-A', tenBtvn: 'BTVN A', soCau: 12 }, { maBtvn: 'BT-B', maCa: 'CA-B', tenBtvn: 'BTVN B', soCau: 12 }], dsMomGiao: [] as any[] }
  const dl = (viec: unknown[]) => ({ ...tuKeHoachNgay(kh(viec), NOW, phu), thanThu: { kieu: 'co', pet: LUA, cap: 12, ten: 'Hoả Long' } as const })
  const manh = (d: any, ...n: any[]) => render(<BangNhiemVu vaiTro="hocsinh" hoTen="Đỗ Minh" now={NOW} duLieu={d} onHanhDong={n[0]} onMoThanThu={n[1]} thiDua={v(T())} taiVinhDanh={async () => null} />)

  it('bấm "Làm thêm 5 câu…" ⇒ onHanhDong với việc chưa xong đầu tiên (không phải việc bị cổng)', () => {
    const d = dl([
      vm({ id: 'btvn_lo:BT-A:0', loai: 'btvn_lo', batBuoc: true, hanCung: gio(5), chiTiet: { ma: 'BT-A', chiSo: 0, tongLo: 1 } }),
      vm({ id: 'btvn_lo:BT-B:0', loai: 'btvn_lo', batBuoc: true, hanCung: gio(9), cong: 'btvn_lo:BT-A:0', chiTiet: { ma: 'BT-B', chiSo: 0, tongLo: 1 } }),
    ])
    expect(d.lamNgay).toBeTruthy() // việc đầu không bị cổng; việc thứ hai bị cổng (biCong)
    const onHanhDong = vi.fn()
    const onMoThanThu = vi.fn()
    manh(d, onHanhDong, onMoThanThu)
    fireEvent.click(screen.getByRole('button', { name: 'Làm thêm 5 câu là vượt 2 bạn' }))
    expect(onMoThanThu).not.toHaveBeenCalled()
    expect(onHanhDong).toHaveBeenCalledTimes(1)
    const hd = onHanhDong.mock.calls[0]![0]
    expect(JSON.stringify(hd)).toContain('BT-A')
    expect(JSON.stringify(hd)).not.toContain('BT-B')
  })
  it('hết việc (không còn thẻ nào) ⇒ mở Đảo thần thú', () => {
    const d = dl([])
    const onHanhDong = vi.fn()
    const onMoThanThu = vi.fn()
    manh(d, onHanhDong, onMoThanThu)
    fireEvent.click(screen.getByRole('button', { name: 'Làm thêm 5 câu là vượt 2 bạn' }))
    expect(onHanhDong).not.toHaveBeenCalled()
    expect(onMoThanThu).toHaveBeenCalledTimes(1)
  })
  it('phụ huynh KHÔNG thấy ô (không có học sinh nào thi đua trong app PH)', () => {
    const { container } = render(<BangNhiemVu vaiTro="phuhuynh" hoTen="PH" now={NOW} duLieu={dl([])} thiDua={v(T())} taiVinhDanh={async () => null} />)
    expect(container.querySelector('[data-vung="thi-dua"]')).toBeNull()
  })
})

describe('taiThiDua — không có lệnh / lỗi ⇒ null, không ném', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  it('POST /hs/thi-dua-hom-nay với token; thân đúng ⇒ ThiDua', async () => {
    ;(fetch as any).mockResolvedValue({ ok: true, status: 200, json: async () => RAW })
    const t = await taiThiDua('tok-abc')
    expect(t!.siSo).toBe(42)
    const [url, init] = (fetch as any).mock.calls[0]
    expect(String(url)).toBe('https://may.test/hs/thi-dua-hom-nay')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ token: 'tok-abc' })
  })
  it('404 (Worker chưa có lệnh), 500, mạng đứt, thân hỏng ⇒ null', async () => {
    ;(fetch as any).mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({ ok: false }) })
    expect(await taiThiDua('t')).toBeNull()
    ;(fetch as any).mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
    expect(await taiThiDua('t')).toBeNull()
    ;(fetch as any).mockRejectedValueOnce(new Error('mang'))
    expect(await taiThiDua('t')).toBeNull()
    ;(fetch as any).mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: true, siSo: 'x' }) })
    expect(await taiThiDua('t')).toBeNull()
    ;(fetch as any).mockResolvedValueOnce({ ok: true, status: 200, json: async () => { throw new Error('json') } })
    expect(await taiThiDua('t')).toBeNull()
  })
})

describe('useThiDua — nhịp 60 giây, giữ bản cũ khi lỗi, "vừa vượt lên" 2 phút', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  const chay = async (ms: number) => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms)
    })
  }
  it('nạp ngay; sau mỗi 60 giây nạp lại; tắt (bat=false) ⇒ xoá ô và dừng nhịp', async () => {
    const api = vi.fn().mockResolvedValue(T())
    const { result, rerender } = renderHook(({ bat }) => useThiDua('tok', bat, api), { initialProps: { bat: true } })
    await chay(0)
    expect(api).toHaveBeenCalledTimes(1)
    expect(result.current.thiDua!.siSo).toBe(42)
    await chay(NHIP_THI_DUA_MS)
    expect(api).toHaveBeenCalledTimes(2)
    await chay(NHIP_THI_DUA_MS)
    expect(api).toHaveBeenCalledTimes(3)
    rerender({ bat: false })
    expect(result.current.thiDua).toBeNull()
    await chay(NHIP_THI_DUA_MS * 3)
    expect(api).toHaveBeenCalledTimes(3)
  })
  it('không token ⇒ không gọi', async () => {
    const api = vi.fn().mockResolvedValue(T())
    const { result } = renderHook(() => useThiDua(undefined, true, api))
    await chay(NHIP_THI_DUA_MS)
    expect(api).not.toHaveBeenCalled()
    expect(result.current.thiDua).toBeNull()
  })
  it('một lần nạp lỗi (null) ⇒ GIỮ bản đang hiện, không nhấp nháy mất ô', async () => {
    const api = vi.fn().mockResolvedValueOnce(T()).mockResolvedValue(null)
    const { result } = renderHook(() => useThiDua('tok', true, api))
    await chay(0)
    await chay(NHIP_THI_DUA_MS)
    expect(api).toHaveBeenCalledTimes(2)
    expect(result.current.thiDua!.siSo).toBe(42)
  })
  it('bạn vượt lên giữa hai lần nạp ⇒ có câu, giữ 2 phút rồi tắt; lần nạp đầu không có câu', async () => {
    const sau = T((r) => { r.top = [RAW.top[1], RAW.top[0], RAW.top[2]] })
    const api = vi.fn().mockResolvedValueOnce(T()).mockResolvedValue(sau)
    const { result } = renderHook(() => useThiDua('tok', true, api))
    await chay(0)
    expect(result.current.vuot).toBeNull()
    await chay(NHIP_THI_DUA_MS)
    expect(result.current.vuot).toBe('Minh Quân vừa vượt lên hạng 1')
    await chay(GIU_VUA_VUOT_MS - 1000)
    expect(result.current.vuot).toBe('Minh Quân vừa vượt lên hạng 1')
    await chay(1500)
    expect(result.current.vuot).toBeNull()
  })
  it('tab ẩn ⇒ bỏ lượt; hiện lại ⇒ nạp ngay', async () => {
    const api = vi.fn().mockResolvedValue(T())
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
    renderHook(() => useThiDua('tok', true, api))
    await chay(NHIP_THI_DUA_MS * 2)
    expect(api).not.toHaveBeenCalled()
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' })
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await chay(0)
    expect(api).toHaveBeenCalledTimes(1)
  })
})

describe('khoá mã nguồn', () => {
  it('ô chỉ nằm ở app học sinh: StudentPortalScreen truyền, ParentPortalScreen KHÔNG gọi lệnh thi đua', () => {
    expect(doc('src/screens/StudentPortalScreen.tsx')).toMatch(/useThiDua\(/)
    expect(doc('src/screens/StudentPortalScreen.tsx')).toMatch(/thiDua=\{thiDua\}/)
    expect(doc('src/screens/ParentPortalScreen.tsx')).not.toMatch(/thi-dua|ThiDua/)
    expect(doc('src/components/bang-nhiem-vu/BangNhiemVu.tsx')).toMatch(/\{!laPh && thiDua && <OThiDua/)
  })
  it('không màu thô, không emoji, không lookbehind / .at( trong các tệp mới', () => {
    for (const p of ['src/components/bang-nhiem-vu/OThiDua.tsx', 'src/lib/thi-dua.ts', 'src/lib/use-thi-dua.ts', 'src/lib/thi-dua-api.ts']) {
      const s = doc(p)
      expect(s).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
      expect(EMOJI.test(s)).toBe(false)
      expect(s).not.toMatch(/\(\?<[=!]/)
      expect(s).not.toMatch(/\.at\(/)
      expect(s).not.toMatch(/randomUUID/)
    }
  })
  it('ô KHÔNG bao giờ in hạng khi hang===null và KHÔNG nêu tên bạn chưa học (chỉ có tên trong top ≤ 3)', () => {
    const s = doc('src/components/bang-nhiem-vu/OThiDua.tsx')
    expect(s).toMatch(/t\.cuaEm\.hang !== null &&/)
    expect(s).not.toMatch(/chuaHoc\.map|dsChuaHoc/)
  })
})
