// "GIAO THÊM BÀI CHO CON" — MÀN phụ huynh (thầy lệnh 21/09; hợp đồng docs/hop-dong-ph-giao-them-2109.md mục 5–6; hàm thuần của Code 1 + máy chủ của Code 3 ở test khác).
// Khoá: đọc chặt thân máy chủ; chữ xác nhận/từ chối có số THẬT và chủ ngữ "A.I Đỗ Đại Học"; "Anh/chị chưa mất lượt nào" khi từ chối; hết 3 lượt ⇒ nút mờ; chống bấm đúp;
// máy chủ chưa có lệnh ⇒ giữ đường cũ (Pages đi trước Worker được); menu chỉ bỏ các mục giao KHI lệnh mới sẵn sàng; không game.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, configure, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import ParentPortalScreen from '../src/screens/ParentPortalScreen'
import GiaoThemChoCon from '../src/components/bang-nhiem-vu/GiaoThemChoCon'
import * as mucMenuTep from '../src/components/bang-nhiem-vu/muc-menu'
import { chuGoiGanNhat, chuLuot, chuThanhPhan, docKetQuaGiaoThem, theTuChoi, theXacNhan } from '../src/lib/giao-them-hien-thi'
import { phGiaoThemApi } from '../src/lib/giao-them-api'
import { useGiaoThem, type ViewGiaoThem } from '../src/lib/use-giao-them'

configure({ asyncUtilTimeout: 8000 })
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: () => null }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrl: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({
  ...(await original<any>()),
  tenTheoSbd: async () => ({ sbd: '12121212', hoTen: 'Đỗ Minh', lop: '12A1', tenCa: '' }),
  hsLichSuCaApi: async () => ({ ok: true, items: [] }),
  hsCauSaiApi: async () => ({ ok: true, items: [] }),
  hsBtvnApi: async () => ({ ok: true, items: [] }),
}))
vi.mock('../src/lib/mom-api', async (original) => ({ ...(await original<any>()), migrateMom: async () => {}, momApi: async () => ({ ok: true, items: [] }) }))
const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const CAM = /thần thú|EXP|khiên|Đoàn|Đảo|Võ đài/i

const THAN_GIAO = {
  ok: true,
  serverNow: 1,
  conLaiHomNay: 2,
  goiGanNhat: { luc: '2026-09-21T12:40:00Z', soCau: 6, soDaLam: 0, soDung: 0, phutUocTinh: 8 },
  daGiao: {
    soCau: 6,
    luot: 1,
    luc: '2026-09-21T12:40:00Z',
    phutUocTinh: 8,
    lyDo: ['x'],
    thanhPhan: [{ loai: 'on_lai', dang: 'ESTE.A', tenDang: '', soCau: 3 }, { loai: 'dang_vap', dang: 'ESTE.THUY_PHAN', tenDang: 'Thuỷ phân ester', soCau: 3 }],
    laLuotCu: false,
  },
}
const THAN_CHOI = { ok: true, conLaiHomNay: 3, tuChoi: { ma: 'con_viec_bat_buoc', lyDo: ['Hôm nay con còn chặng 2 bài tập về nhà, 9 câu, hạn 12:00 trưa mai — con nên làm phần này trước.'] } }

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})

describe('docKetQuaGiaoThem — đọc CHẶT thân máy chủ', () => {
  it('thân giao thành công → số thật, thành phần, lượt còn lại', () => {
    const k = docKetQuaGiaoThem(THAN_GIAO)!
    expect(k.conLaiHomNay).toBe(2)
    expect(k.daGiao).toMatchObject({ soCau: 6, luot: 1, phutUocTinh: 8, laLuotCu: false })
    expect(k.daGiao!.thanhPhan.map((t) => [t.loai, t.tenDang, t.soCau])).toEqual([['on_lai', '', 3], ['dang_vap', 'Thuỷ phân ester', 3]])
    expect(k.goiGanNhat).toMatchObject({ soCau: 6, soDaLam: 0 })
    expect(k.tuChoi).toBeNull()
  })

  it('thân từ chối → tuChoi có lý do; KHÔNG đọc thành đã giao', () => {
    const k = docKetQuaGiaoThem(THAN_CHOI)!
    expect(k.daGiao).toBeNull()
    expect(k.tuChoi).toEqual({ ma: 'con_viec_bat_buoc', lyDo: THAN_CHOI.tuChoi.lyDo })
    expect(k.conLaiHomNay).toBe(3)
  })

  it('vừa daGiao vừa tuChoi là sai dạng ⇒ tin TỪ CHỐI, không báo "đã giao"', () => {
    const k = docKetQuaGiaoThem({ ...THAN_GIAO, tuChoi: THAN_CHOI.tuChoi })!
    expect(k.daGiao).toBeNull()
    expect(k.tuChoi).not.toBeNull()
  })

  it('không phải thân của lệnh này ⇒ null: ok≠true, thiếu conLaiHomNay (đường bắt-mọi-thứ trả {ok:true}), không phải đối tượng', () => {
    for (const x of [null, undefined, 'x', 5, [], { ok: false, error: 'x' }, { ok: true }, { ok: true, conLaiHomNay: -1 }, { ok: true, conLaiHomNay: 1.5 }, { ok: 'true', conLaiHomNay: 2 }]) expect(docKetQuaGiaoThem(x), JSON.stringify(x)).toBeNull()
    expect(docKetQuaGiaoThem({ ok: true, conLaiHomNay: 0 })!.conLaiHomNay).toBe(0)
  })

  it('bỏ thành phần sai (loại lạ, số câu ≤ 0) và gói không có số câu; giữ phần đúng', () => {
    const k = docKetQuaGiaoThem({ ...THAN_GIAO, daGiao: { ...THAN_GIAO.daGiao, thanhPhan: [{ loai: 'lạ', soCau: 2 }, { loai: 'cau_sai', soCau: 0 }, { loai: 'cau_sai', tenDang: 'x', soCau: 2 }, 'rác'] } })!
    expect(k.daGiao!.thanhPhan).toEqual([{ loai: 'cau_sai', tenDang: 'x', soCau: 2 }])
    expect(docKetQuaGiaoThem({ ...THAN_GIAO, daGiao: { soCau: 0 } })!.daGiao).toBeNull()
  })
})

describe('chữ hiển thị — số THẬT, giọng phụ huynh, chủ ngữ A.I Đỗ Đại Học, không game', () => {
  it('thẻ xác nhận: "Đã giao cho con 6 câu, khoảng 8 phút" + "A.I Đỗ Đại Học đã chọn 6 câu hợp với con hôm nay." + từng thành phần + "Hôm nay còn 2 lượt giao"', () => {
    const t = theXacNhan(docKetQuaGiaoThem(THAN_GIAO)!.daGiao!, 2)
    expect(t.tieuDe).toBe('Đã giao cho con 6 câu, khoảng 8 phút')
    expect(t.dong).toEqual(['A.I Đỗ Đại Học đã chọn 6 câu hợp với con hôm nay.', '3 câu ôn lại đến lịch', '3 câu dạng Thuỷ phân ester (dạng con đang vấp)'])
    expect(t.cuoi).toBe('Hôm nay còn 2 lượt giao')
    expect(JSON.stringify(t)).not.toMatch(CAM)
  })

  it('bấm đúp cùng phút (laLuotCu): nói "bài vừa giao" và "chưa mất thêm lượt nào"; thiếu phút ⇒ bỏ "khoảng … phút"', () => {
    const d = { ...docKetQuaGiaoThem(THAN_GIAO)!.daGiao!, laLuotCu: true }
    const t = theXacNhan(d, 2)
    expect(t.tieuDe).toBe('Bài vừa giao cho con đây: 6 câu, khoảng 8 phút')
    expect(t.cuoi).toBe('Anh/chị chưa mất thêm lượt nào. Hôm nay còn 2 lượt giao')
    expect(theXacNhan({ ...d, phutUocTinh: null, laLuotCu: false }, null).tieuDe).toBe('Đã giao cho con 6 câu')
    expect(theXacNhan({ ...d, phutUocTinh: null, laLuotCu: false }, null).cuoi).toBe('')
  })

  it('bốn loại thành phần đọc thành tiếng thường; dạng thiếu tên ⇒ không in mã', () => {
    expect(chuThanhPhan({ loai: 'on_lai', tenDang: '', soCau: 3 })).toBe('3 câu ôn lại đến lịch')
    expect(chuThanhPhan({ loai: 'dang_vap', tenDang: 'Thuỷ phân ester', soCau: 3 })).toBe('3 câu dạng Thuỷ phân ester (dạng con đang vấp)')
    expect(chuThanhPhan({ loai: 'dang_vap', tenDang: '', soCau: 2 })).toBe('2 câu ở dạng con đang vấp')
    expect(chuThanhPhan({ loai: 'cau_sai', tenDang: '', soCau: 2 })).toBe('2 câu con từng làm sai')
    expect(chuThanhPhan({ loai: 'thu_suc', tenDang: '', soCau: 1 })).toBe('1 câu thử sức, cao hơn con một bậc')
  })

  it('từ chối: lý do THẬT của máy chủ + "Anh/chị chưa mất lượt nào."', () => {
    const t = theTuChoi({ ma: 'qua_muon', lyDo: ['Đã muộn rồi, để con nghỉ. Mai anh/chị giao tiếp được.'] })
    expect(t).toEqual({ tieuDe: 'Chưa giao thêm bài lúc này', dong: ['Đã muộn rồi, để con nghỉ. Mai anh/chị giao tiếp được.'], cuoi: 'Anh/chị chưa mất lượt nào.' })
    expect(theTuChoi({ ma: 'x', lyDo: [] }).dong.length).toBe(1) // không để thẻ trống
  })

  it('dòng lượt: còn N / hết 3 lượt / chưa biết ⇒ rỗng', () => {
    expect(chuLuot(3)).toBe('Hôm nay còn 3 lượt giao')
    expect(chuLuot(1)).toBe('Hôm nay còn 1 lượt giao')
    expect(chuLuot(0)).toBe('Hôm nay đã giao đủ 3 lượt, mai giao tiếp được')
    expect(chuLuot(null)).toBe('')
  })

  it('gói gần nhất: đã xong "đúng 5 trong 6 câu"; đang làm "đã làm 2/6"; thiếu số ⇒ không bịa', () => {
    // 12:40Z = 19:40 giờ Việt Nam
    expect(chuGoiGanNhat({ luc: '2026-09-21T12:40:00Z', soCau: 6, soDaLam: 6, soDung: 5 })).toBe('Con đã làm xong gói 19:40 · đúng 5 trong 6 câu')
    expect(chuGoiGanNhat({ luc: '2026-09-21T12:40:00Z', soCau: 6, soDaLam: 2, soDung: 1 })).toBe('Con đã làm 2/6 câu của gói 19:40')
    expect(chuGoiGanNhat({ luc: '2026-09-21T12:40:00Z', soCau: 6, soDaLam: 6, soDung: null })).toBe('Con đã làm xong gói 19:40 · 6 câu')
    expect(chuGoiGanNhat({ luc: '2026-09-21T12:40:00Z', soCau: 6, soDaLam: null, soDung: null })).toBe('Con có 6 câu ở gói 19:40')
  })
})

describe('phGiaoThemApi — không ném lỗi, chỉ đọc khi chiXem, đúng thân', () => {
  it('chiXem ⇒ body {pass, chiXem:true}; giao ⇒ body {pass}; URL /ph/giao-them; đọc thân ok', async () => {
    localStorage.setItem('omr_ph_pass', 'MA-BI-MAT')
    const goi: Array<{ u: string; b: unknown }> = []
    vi.stubGlobal('fetch', vi.fn(async (u: string, o: any) => (goi.push({ u, b: JSON.parse(o.body) }), { status: 200, json: async () => THAN_GIAO })))
    const a = await phGiaoThemApi(true)
    const b = await phGiaoThemApi(false)
    expect(goi.map((g) => g.u)).toEqual(['https://may.test/ph/giao-them', 'https://may.test/ph/giao-them'])
    expect(goi[0]!.b).toEqual({ pass: 'MA-BI-MAT', chiXem: true })
    expect(goi[1]!.b).toEqual({ pass: 'MA-BI-MAT' })
    expect(a.kieu === 'ok' && b.kieu === 'ok').toBe(true)
  })

  it('SBD trần (không có mã liên kết): gửi {sbd, chiXem:true} / {sbd}; CÓ mã ⇒ chỉ gửi pass, KHÔNG kèm sbd (danh tính lấy từ mã)', async () => {
    const goi: Array<{ b: unknown }> = []
    vi.stubGlobal('fetch', vi.fn(async (_u: string, o: any) => (goi.push({ b: JSON.parse(o.body) }), { status: 200, json: async () => THAN_GIAO })))
    expect((await phGiaoThemApi(true, ' 12121212 ')).kieu).toBe('ok')
    expect((await phGiaoThemApi(false, '12121212')).kieu).toBe('ok')
    expect(goi.map((g) => g.b)).toEqual([{ sbd: '12121212', chiXem: true }, { sbd: '12121212' }])
    localStorage.setItem('omr_ph_pass', 'MA-PH')
    goi.length = 0
    await phGiaoThemApi(true, '12121212')
    expect(goi[0]!.b).toEqual({ pass: 'MA-PH', chiXem: true })
  })

  it('MỘT đường giao bài (không còn đường cũ để lùi): 404 ⇒ khong_co_lenh; thân lạ / {ok:false} / không JSON / mạng rớt ⇒ `loi` — cả khi CHỈ ĐỌC; lời THẬT của máy chủ nếu có; KHÔNG ném; thiếu cả mã lẫn SBD ⇒ khong_co_lenh', async () => {
    localStorage.setItem('omr_ph_pass', 'MA')
    const CHUNG = 'Chưa giao được bài lúc này. Anh/chị chưa mất lượt nào, thử lại sau ít phút.'
    vi.stubGlobal('fetch', vi.fn(async () => ({ status: 404, json: async () => ({}) })))
    expect((await phGiaoThemApi(true)).kieu).toBe('khong_co_lenh')
    for (const t of [{ status: 200, json: async () => ({ ok: true }) }, { status: 200, json: async () => { throw new Error('không JSON') } }, { status: 200, json: async () => ({ ok: false }) }, { status: 200, json: async () => ({ ok: false, error: 'x'.repeat(300) }) }]) {
      vi.stubGlobal('fetch', vi.fn(async () => t))
      for (const chiXem of [true, false]) expect(await phGiaoThemApi(chiXem)).toEqual({ kieu: 'loi', chu: CHUNG })
    }
    vi.stubGlobal('fetch', vi.fn(async () => ({ status: 200, json: async () => ({ ok: false, error: '  Cần liên kết riêng   của con.  ' }) })))
    expect(await phGiaoThemApi(true)).toEqual({ kieu: 'loi', chu: 'Cần liên kết riêng của con.' })
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    for (const chiXem of [true, false]) {
      const r = await phGiaoThemApi(chiXem)
      expect(r.kieu).toBe('loi')
      expect(r.kieu === 'loi' && r.chu).toMatch(/chưa mất lượt nào/)
    }
    localStorage.clear()
    expect((await phGiaoThemApi(true)).kieu).toBe('khong_co_lenh') // thiếu cả mã lẫn SBD
    expect((await phGiaoThemApi(true, '   ')).kieu).toBe('khong_co_lenh')
  })

  it('mã phụ huynh không bao giờ vào chữ hiển thị / console', async () => {
    localStorage.setItem('omr_ph_pass', 'MA-TUYET-DOI-BI-MAT')
    vi.stubGlobal('fetch', vi.fn(async () => ({ status: 200, json: async () => THAN_GIAO })))
    const ghi = vi.spyOn(console, 'log')
    const r = await phGiaoThemApi(false)
    expect(JSON.stringify(r)).not.toContain('MA-TUYET-DOI-BI-MAT')
    expect(ghi).not.toHaveBeenCalled()
    ghi.mockRestore()
  })
})

describe('useGiaoThem — trạng thái nút', () => {
  const ok = (kq: object) => ({ kieu: 'ok' as const, kq: docKetQuaGiaoThem(kq)! })

  it('nạp chiXem một lần: san + lượt còn lại + gói gần nhất; chưa có lệnh ⇒ san=false', async () => {
    const api = vi.fn(async () => ok({ ok: true, conLaiHomNay: 3 }))
    const { result } = renderHook(() => useGiaoThem(true, api))
    await waitFor(() => expect(result.current.san).toBe(true))
    expect(result.current.conLai).toBe(3)
    expect(api).toHaveBeenCalledTimes(1)
    expect(api).toHaveBeenCalledWith(true, undefined)
    const r2 = renderHook(() => useGiaoThem(true, async () => ({ kieu: 'khong_co_lenh' as const })))
    await waitFor(() => expect(r2.result.current.dangTai).toBe(false))
    expect(r2.result.current.san).toBe(false)
    // Không còn đường cũ: đọc trạng thái hỏng ⇒ thẻ lỗi ngay dưới nút (nút vẫn bấm được để thử lại)
    expect(r2.result.current.the).toMatchObject({ kieu: 'loi', dong: ['Chưa giao được bài lúc này. Anh/chị chưa mất lượt nào, thử lại sau ít phút.'] })
    // Lời THẬT của máy chủ đi thẳng ra thẻ; SBD trần được truyền cho hàm gọi
    const r4 = renderHook(() => useGiaoThem(true, vi.fn(async () => ({ kieu: 'loi' as const, chu: 'Cần liên kết riêng của con.' })), '12121212'))
    await waitFor(() => expect(r4.result.current.the?.dong).toEqual(['Cần liên kết riêng của con.']))
    const api4 = vi.fn(async () => ok({ ok: true, conLaiHomNay: 2 }))
    renderHook(() => useGiaoThem(true, api4, '12121212'))
    await waitFor(() => expect(api4).toHaveBeenCalledWith(true, '12121212'))
    const r3 = renderHook(() => useGiaoThem(false, api))
    expect(r3.result.current.san).toBe(false)
    expect(api).toHaveBeenCalledTimes(1) // chưa đăng nhập ⇒ không gọi
  })

  it('giao: thẻ xác nhận, lượt còn lại theo MÁY CHỦ, gói gần nhất cập nhật; từ chối: KHÔNG đổi lượt còn lại; lỗi: thẻ lỗi', async () => {
    const goi: boolean[] = []
    const kq = [ok({ ok: true, conLaiHomNay: 3 }), ok(THAN_GIAO), ok(THAN_CHOI), { kieu: 'loi' as const, chu: 'Chưa nối được máy chủ. Anh/chị chưa mất lượt nào, thử lại sau ít phút.' }]
    const api = vi.fn(async (chiXem: boolean) => (goi.push(chiXem), kq[goi.length - 1]!))
    const { result } = renderHook(() => useGiaoThem(true, api))
    await waitFor(() => expect(result.current.san).toBe(true))
    await act(async () => void result.current.giao())
    await waitFor(() => expect(result.current.the?.kieu).toBe('da_giao'))
    expect(result.current.conLai).toBe(2)
    expect(result.current.the?.tieuDe).toBe('Đã giao cho con 6 câu, khoảng 8 phút')
    expect(result.current.goiGanNhat?.soCau).toBe(6)
    await act(async () => void result.current.giao())
    await waitFor(() => expect(result.current.the?.kieu).toBe('tu_choi'))
    expect(result.current.conLai).toBe(3) // máy chủ nói còn 3 ⇒ KHÔNG tự trừ
    expect(result.current.the?.cuoi).toBe('Anh/chị chưa mất lượt nào.')
    await act(async () => void result.current.giao())
    await waitFor(() => expect(result.current.the?.kieu).toBe('loi'))
    expect(goi).toEqual([true, false, false, false])
    expect(result.current.dangGui).toBe(false)
  })

  it('BẤM ĐÚP khi đang gửi: chỉ MỘT lệnh giao đi (chặn ở máy trước cả khóa theo phút của máy chủ)', async () => {
    let mo!: () => void
    const cho = new Promise<void>((r) => (mo = r))
    const goi: boolean[] = []
    const api = vi.fn(async (chiXem: boolean) => {
      goi.push(chiXem)
      if (!chiXem) await cho
      return ok(chiXem ? { ok: true, conLaiHomNay: 3 } : THAN_GIAO)
    })
    const { result } = renderHook(() => useGiaoThem(true, api))
    await waitFor(() => expect(result.current.san).toBe(true))
    act(() => {
      result.current.giao()
      result.current.giao()
      result.current.giao()
    })
    expect(result.current.dangGui).toBe(true)
    mo()
    await waitFor(() => expect(result.current.dangGui).toBe(false))
    expect(goi.filter((x) => x === false).length).toBe(1)
  })
})

describe('GiaoThemChoCon — màn', () => {
  const v = (tuy: Partial<ViewGiaoThem> = {}): ViewGiaoThem => ({ san: true, dangTai: false, conLai: 3, goiGanNhat: null, the: null, dangGui: false, giao: () => {}, ...tuy })

  it('trạng thái sẵn sàng: MỘT nút chính "Giao thêm bài cho con" + "Hôm nay còn 3 lượt giao"; bấm gọi giao()', () => {
    const giao = vi.fn()
    const { container } = render(<GiaoThemChoCon v={v({ giao })} />)
    const nut = screen.getByRole('button', { name: 'Giao thêm bài cho con' })
    expect(container.querySelectorAll('button').length).toBe(1)
    expect(nut.className).toContain('bnv-nut-chinh')
    expect(nut.getAttribute('aria-describedby')).toBe('bnv-giao-them-luot')
    expect(container.textContent).toContain('Hôm nay còn 3 lượt giao')
    fireEvent.click(nut)
    expect(giao).toHaveBeenCalledTimes(1)
  })

  it('đang gửi: khung xương + nút khoá "Đang chọn câu…" + lời cho trình đọc màn hình (chủ ngữ A.I Đỗ Đại Học)', () => {
    const { container } = render(<GiaoThemChoCon v={v({ dangGui: true })} />)
    expect(container.querySelector('[data-vung="giao-them-cho"]')).toBeTruthy()
    const nut = screen.getByRole('button', { name: /Đang chọn câu/ }) as HTMLButtonElement
    expect(nut.disabled).toBe(true)
    expect(nut.getAttribute('aria-busy')).toBe('true')
    expect(container.textContent).toContain('A.I Đỗ Đại Học đang chọn câu cho con')
  })

  it('hết 3 lượt: nút MỜ (disabled) + "Hôm nay đã giao đủ 3 lượt, mai giao tiếp được"', () => {
    const { container } = render(<GiaoThemChoCon v={v({ conLai: 0 })} />)
    expect((screen.getByRole('button', { name: 'Giao thêm bài cho con' }) as HTMLButtonElement).disabled).toBe(true)
    expect(container.textContent).toContain('Hôm nay đã giao đủ 3 lượt, mai giao tiếp được')
  })

  it('thẻ xác nhận / từ chối / lỗi: đúng vai trò aria (status / alert), có số thật; gói gần nhất ẩn khi đang có thẻ', () => {
    const the = { kieu: 'da_giao' as const, ...theXacNhan(docKetQuaGiaoThem(THAN_GIAO)!.daGiao!, 2) }
    const a = render(<GiaoThemChoCon v={v({ the, conLai: 2, goiGanNhat: { luc: '2026-09-21T12:40:00Z', soCau: 6, soDaLam: 6, soDung: 5 } })} />)
    const t = a.container.querySelector('[data-vung="the-giao-them"]')!
    expect(t.getAttribute('role')).toBe('status')
    expect(t.textContent).toContain('Đã giao cho con 6 câu, khoảng 8 phút')
    expect(t.textContent).toContain('3 câu dạng Thuỷ phân ester (dạng con đang vấp)')
    expect(a.container.querySelector('[data-vung="goi-gan-nhat"]')).toBeNull()
    expect((a.container.textContent!.match(/Hôm nay còn 2 lượt giao/g) ?? []).length).toBe(1) // mỗi con số MỘT lần: thẻ đã nói thì dưới nút không lặp
    a.unmount()
    const b = render(<GiaoThemChoCon v={v({ the: { kieu: 'tu_choi', ...theTuChoi({ ma: 'qua_muon', lyDo: ['Đã muộn rồi, để con nghỉ. Mai anh/chị giao tiếp được.'] }) } })} />)
    expect(b.container.querySelector('[data-vung="the-giao-them"]')!.textContent).toContain('Anh/chị chưa mất lượt nào.')
    b.unmount()
    const c = render(<GiaoThemChoCon v={v({ the: { kieu: 'loi', tieuDe: 'Chưa giao được bài', dong: ['x'], cuoi: '' } })} />)
    expect(c.container.querySelector('[data-vung="the-giao-them"]')!.getAttribute('role')).toBe('alert')
    c.unmount()
    const d = render(<GiaoThemChoCon v={v({ goiGanNhat: { luc: '2026-09-21T12:40:00Z', soCau: 6, soDaLam: 6, soDung: 5 } })} />)
    expect(d.container.querySelector('[data-vung="goi-gan-nhat"]')!.textContent).toBe('Con đã làm xong gói 19:40 · đúng 5 trong 6 câu')
  })

  it('không game, không "Máy", không mã nội bộ trong chữ của cả bốn trạng thái', () => {
    for (const tuy of [v(), v({ dangGui: true }), v({ conLai: 0 }), v({ the: { kieu: 'da_giao', ...theXacNhan(docKetQuaGiaoThem(THAN_GIAO)!.daGiao!, 2) } })]) {
      const r = render(<GiaoThemChoCon v={tuy} />)
      expect(r.container.textContent).not.toMatch(CAM)
      expect(r.container.textContent).not.toMatch(/\bMáy\b|ESTE\.|_/)
      r.unmount()
    }
  })
})

describe('Menu phụ huynh — ĐÃ GỠ (một màn một nút, 21/09)', () => {
  it('muc-menu không còn xuất hàm menu phụ huynh; menu học sinh giữ nguyên', () => {
    expect((mucMenuTep as Record<string, unknown>).mucMenuPhuHuynh).toBeUndefined()
    expect(typeof mucMenuTep.mucMenuHocSinh).toBe('function')
  })
})

describe('Cổng phụ huynh thật — MỘT màn, MỘT nút, mọi kiểu đăng nhập', () => {
  const dung = (coLenh: boolean, loiXem?: string) => {
    const goi: unknown[] = []
    vi.stubGlobal('fetch', vi.fn(async (url: string, o?: any) => {
      if (String(url).endsWith('/ph/xac-dinh')) {
        const t = { ok: true, sbd: '12121212', hoTen: 'Đỗ Minh', lop: '12A1' }
        return { ok: true, status: 200, json: async () => t, text: async () => JSON.stringify(t) }
      }
      if (String(url).endsWith('/ph/giao-them')) {
        const b = JSON.parse(o.body)
        goi.push(b)
        if (!coLenh) return { ok: false, status: 404, json: async () => ({}), text: async () => '' }
        if (loiXem && b.chiXem) return { ok: true, status: 200, json: async () => ({ ok: false, error: loiXem }), text: async () => '' }
        const than = b.chiXem ? { ok: true, conLaiHomNay: 3 } : THAN_GIAO
        return { ok: true, status: 200, json: async () => than, text: async () => JSON.stringify(than) }
      }
      return { ok: true, status: 200, json: async () => ({ ok: true, items: [], winners: [] }), text: async () => '{}' }
    }))
    return goi
  }
  beforeEach(() => {
    window.history.replaceState(null, '', '/?vai=phuhuynh')
    localStorage.setItem('omr_ph_sbd', '12121212')
    localStorage.setItem('omr_ph_pass', 'MA-PH')
  })
  afterEach(() => window.history.replaceState(null, '', '/'))

  it('CÓ mã liên kết: nút mới; KHÔNG menu ba chấm; bấm ⇒ thẻ xác nhận có số + đếm lượt theo máy chủ; MỘT nút chính; gửi {pass}', async () => {
    const goi = dung(true)
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="giao-them"]')).toBeTruthy())
    expect(container.querySelector('[data-vung="giao-bai"]')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Mở menu' })).toBeNull()
    await waitFor(() => expect(container.textContent).toContain('Hôm nay còn 3 lượt giao'))
    expect(container.querySelectorAll('.mt-nut--chinh').length).toBe(1)
    fireEvent.click(screen.getByRole('button', { name: 'Giao thêm bài cho con' }))
    await waitFor(() => expect(container.querySelector('[data-vung="the-giao-them"]')).toBeTruthy())
    const the = container.querySelector('[data-vung="the-giao-them"]')!.textContent!
    expect(the).toContain('Đã giao cho con 6 câu, khoảng 8 phút')
    expect(the).toContain('A.I Đỗ Đại Học đã chọn 6 câu hợp với con hôm nay.')
    expect(container.textContent).toContain('Hôm nay còn 2 lượt giao')
    expect(goi).toEqual([{ pass: 'MA-PH', chiXem: true }, { pass: 'MA-PH' }])
  }, 20000)

  it('SBD TRẦN (không có mã liên kết — 100% phụ huynh hiện tại): nút VẪN chạy, gửi {sbd} (không kèm pass)', async () => {
    localStorage.removeItem('omr_ph_pass')
    const goi = dung(true)
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="giao-them"]')).toBeTruthy())
    await waitFor(() => expect(container.textContent).toContain('Hôm nay còn 3 lượt giao'))
    fireEvent.click(screen.getByRole('button', { name: 'Giao thêm bài cho con' }))
    await waitFor(() => expect(container.querySelector('[data-vung="the-giao-them"]')).toBeTruthy())
    expect(goi).toEqual([{ sbd: '12121212', chiXem: true }, { sbd: '12121212' }])
    expect(container.querySelector('[data-vung="giao-bai"]')).toBeNull()
  }, 20000)

  it('máy chủ trả lời thật "Cần liên kết riêng của con.": hiện ĐÚNG lời đó ngay dưới nút; KHÔNG quay về đường/menu cũ', async () => {
    dung(true, 'Cần liên kết riêng của con.')
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="the-giao-them"]')).toBeTruthy())
    expect(container.querySelector('[data-vung="the-giao-them"]')!.textContent).toContain('Cần liên kết riêng của con.')
    expect(container.querySelector('[data-vung="giao-bai"]')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Mở menu' })).toBeNull()
  }, 20000)

  it('CHƯA có lệnh (404): vẫn MỘT nút + câu lỗi chung ("chưa mất lượt nào") — không ô cũ, không menu cũ', async () => {
    dung(false)
    const { container } = render(<ParentPortalScreen />)
    await waitFor(() => expect(container.querySelector('[data-vung="the-giao-them"]')).toBeTruthy())
    expect(container.querySelector('[data-vung="the-giao-them"]')!.textContent).toContain('chưa mất lượt nào')
    expect(screen.getByRole('button', { name: 'Giao thêm bài cho con' })).toBeTruthy()
    expect(container.querySelector('[data-vung="giao-bai"]')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Mở menu' })).toBeNull()
  }, 20000)
})

describe('khoá nguồn', () => {
  it('BangNhiemVu: nút CHỈ ở phụ huynh và LUÔN hiện khi có giaoThem (không còn ô cũ); màn phụ huynh truyền SBD cho hook', () => {
    const b = doc('src/components/bang-nhiem-vu/BangNhiemVu.tsx')
    expect(b).toContain('{laPh && giaoThem && <GiaoThemChoCon v={giaoThem} />}')
    expect(b).not.toContain('bnv-giao-bai')
    expect(b).not.toContain('onGiaoHangNgay')
    const p = doc('src/screens/ParentPortalScreen.tsx')
    expect(p).toContain('const giaoThem = useGiaoThem(!!sbdHienTai, undefined, sbdHienTai ?? undefined)')
    expect(p).toContain('giaoThem={giaoThem}')
    expect(p).not.toContain('mucMenuPhuHuynh')
  })
  it('API chỉ gọi /ph/giao-them, không đọc mã bằng cách nào khác ngoài docPass, không in console', () => {
    const a = doc('src/lib/giao-them-api.ts').replace(/\/\/.*$/gm, '')
    expect(a).toContain("import { docPass } from './ph-token'")
    expect(a).toContain('/ph/giao-them')
    expect(a).not.toMatch(/console\./)
  })
})
