// BI-A PHẢN ỨNG · GIAO DIỆN (đặc tả DAC-TA-BI-A-PHAN-UNG-2809.md mục 8): Sảnh Bi-a, tấm câu dùng thẻ câu chuẩn (TheCau),
// câu SAI ⇒ lượt sang người kế tiếp NGAY, tấm lời giải ở lại tới khi bấm "Đã đọc lời giải", nút "Xem lại câu sai" lúc chờ lượt,
// tới lượt em thì tấm xem lại tự đóng; câu ĐÚNG ⇒ bi ăn khi em bấm "Đánh tiếp". Máy chủ giả qua `datBoGoiBia`.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor, configure, act } from '@testing-library/react'
import BiaGame from '../src/game/bi-a/BiaGame'
import ManChoi, { noiDungNhan } from '../src/game/bi-a/ManChoi'
import { datBoGoiBia } from '../src/game/bi-a/api'
import { suKienMoi } from '../src/game/bi-a/vat-ly'
import type { CauBia, VanBia } from '../src/game/bi-a/dieu-khien'
import type { KiHieu } from '../src/game/bi-a/nguyen-to'
import { KHO_HUONG_DAN } from '../src/game/bi-a/cai-dat-bia'

configure({ asyncUtilTimeout: 6000 })
vi.setConfig({ testTimeout: 20000 })
const cau = (i: number, mucDo = 'biet'): CauBia => ({ qid: `q${i}`, maDe: 'DE', version: '1', group: `g${i}`, phan: 'I', text: `Câu hỏi số ${i}`, choices: [`Đáp án đúng ${i}`, `Nhiễu một ${i}`, `Nhiễu hai ${i}`, `Nhiễu ba ${i}`], ideas: [], hinhAnh: [], dang: 'D', tenDang: `Dạng ${i}`, mucDo, sao: 1, kienThuc: [], vai: 'moi' } as unknown as CauBia)
const SANH = { ok: true, bat: true, chienDich: { ten: 'Ester – Lipid', hanNop: '2026-10-01', tong: 120 }, theLuc: { con: 26, tong: 40 }, doan: { con: 6 }, dao: { con: 20 }, tran: { con: 15, tong: 15, conDoan: 5, conDao: 10 }, giaoHuu: { mo: false, con: 2, toiDa: 2 } }
let goi: ReturnType<typeof vi.fn>
const mayChu = (ghiDe: Record<string, (d: Record<string, unknown>) => unknown> = {}) => {
  const kich: Record<string, (d: Record<string, unknown>) => unknown> = {
    'bia-sanh': () => SANH,
    'bia-xep-ban': () => ({ van: 'v1', session: 's1', bi: Array.from({ length: 7 }, (_, i) => cau(i + 1)), chot: cau(9, 'van_dung'), tran: { con: 7, tong: 15 } }),
    answer: (d) => { const dung = d.answer === 'A'; return { correct: dung, answer: 'A', traLoi: d.answer, solution: { chot: `Kiến thức cốt lõi của ${d.qid}` }, solutionImages: [], reward: dung ? 4 : 0 } },
    'bia-doi-cau': () => ({ trong: false, cau: cau(20) }),
    'bia-ket-van': () => ({ theLuc: { con: 18, tong: 40 } }),
    ...ghiDe,
  }
  goi = vi.fn(async (lenh: string, _t: string, d: Record<string, unknown> = {}) => ({ ok: true, ...((kich[lenh]?.(d) as object) ?? {}) }))
  datBoGoiBia(goi as never)
}
const lenh = (ten: string) => goi.mock.calls.filter((c) => c[0] === ten).map((c) => c[2] as Record<string, unknown>)
const van = () => (window as unknown as { __biaVan: VanBia }).__biaVan

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  mayChu()
})
afterEach(() => { cleanup(); datBoGoiBia(null); vi.unstubAllGlobals() })

describe('Sảnh Bi-a', () => {
  it('đọc bia-sanh: Thể lực, "Bi-a hôm nay còn 15/15 câu", hai nút A.I bật, hai nút chơi với bạn "Sắp mở" bị khoá; 3 nhóm chế độ, không nút trùng', async () => {
    render(<BiaGame token="tk" hoTen="Khánh Linh" onVe={() => {}} />)
    expect(await screen.findByText('còn 15/15 câu')).toBeTruthy()
    expect(screen.getByText('còn 26/40 câu')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Đấu đơn với A.I' }) as HTMLButtonElement).disabled).toBe(false)
    expect((screen.getByRole('button', { name: /^Đánh đôi với A\.I/ }) as HTMLButtonElement).disabled).toBe(false)
    expect((screen.getByRole('button', { name: /Đấu với bạn.*Sắp mở/ }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: /Nhập mã bàn.*Sắp mở/ }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.queryByRole('button', { name: /Bàn giao hữu/ })).toBeNull()
    // Sảnh chia 3 nhóm rõ ràng; bỏ nút trùng "Tự chơi với A.I"; mỗi chế độ đúng MỘT nút; một nút chính (vàng) duy nhất.
    for (const nhom of ['Chơi với bạn', 'Chơi với A.I']) expect(screen.getByRole('region', { name: nhom })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Tự chơi với A\.I/ })).toBeNull()
    for (const ten of [/^Đấu đơn với A\.I/, /^Đánh đôi với A\.I/, /Trả lời câu hỏi · không cần chơi/]) expect(screen.getAllByRole('button', { name: ten })).toHaveLength(1)
    expect(document.querySelectorAll('.bia-sanh .bia-nut-vang')).toHaveLength(1)
    expect(document.querySelector('.bia-sanh .bia-nut-vang')!.textContent).toBe('Đấu đơn với A.I')
    expect(screen.getByText('Luật nhanh').closest('details')).toBeTruthy()
    expect(lenh('bia-sanh')).toHaveLength(1)
  })
  it('xong kế hoạch ⇒ nút A.I khoá, hiện lời máy chủ và Bàn giao hữu (còn 2/2 ván)', async () => {
    mayChu({ 'bia-sanh': () => ({ ...SANH, lyDoKhoa: 'xong_ke_hoach', message: 'Hôm nay em xong kế hoạch rồi.', tran: { con: 0, tong: 15 }, giaoHuu: { mo: true, con: 2, toiDa: 2 } }) })
    render(<BiaGame token="tk" hoTen="Khánh Linh" onVe={() => {}} />)
    expect(await screen.findByText('Hôm nay em xong kế hoạch rồi.')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Đấu đơn với A.I' }) as HTMLButtonElement).disabled).toBe(true)
    const gh = screen.getByRole('button', { name: /^Bàn giao hữu với A\.I.*còn 2\/2 ván/ }) as HTMLButtonElement
    expect(gh.disabled).toBe(false)
    fireEvent.click(gh)
    await waitFor(() => expect(lenh('bia-xep-ban')[0]).toEqual({ loai: 'giao_huu', cheDo: 'don', soBi: 7 }))
  })
  it('bấm "Đấu đơn với A.I" ⇒ bia-xep-ban đơn 7 bi rồi vào màn chơi; đánh đôi xin 4 bi', async () => {
    render(<BiaGame token="tk" hoTen="Khánh Linh" onVe={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Đấu đơn với A.I' }))
    await screen.findByRole('region', { name: 'Hai phe' })
    expect(lenh('bia-xep-ban')[0]).toEqual({ loai: 'ai', cheDo: 'don', soBi: 7 })
    expect(screen.getByText('Đấu với A.I')).toBeTruthy()
    // Sửa 30/09 (thầy chốt "Bàn Bi-a mới"): bỏ hàng ô "Bi của em" ⇒ hàng chấm 7 bi của em (lam) + 7 bi đối thủ.
    expect(screen.queryAllByRole('button', { name: /^Bi (Na|Mg|Al|Fe|Cu|Ag|Au) / })).toHaveLength(0)
    expect(screen.getByRole('region', { name: 'Hai phe' }).querySelectorAll('i[data-kieu="ta"]')).toHaveLength(7)
  })
  it('bấm "Đánh đôi với A.I" (thẻ Chơi với A.I) ⇒ bia-xep-ban đánh đôi 4 bi', async () => {
    render(<BiaGame token="tk" hoTen="Khánh Linh" onVe={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: /^Đánh đôi với A\.I/ }))
    await waitFor(() => expect(lenh('bia-xep-ban')[0]).toEqual({ loai: 'ai', cheDo: 'doi', soBi: 4 }))
  })
  it('máy chủ từ chối xếp bàn ⇒ ở lại Sảnh, hiện lời máy chủ', async () => {
    mayChu({ 'bia-xep-ban': () => ({ lyDo: 'dang_co_ca', message: 'Đang có ca kiểm tra.' }) })
    render(<BiaGame token="tk" hoTen="Khánh Linh" onVe={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Đấu đơn với A.I' }))
    expect(await screen.findByText('Đang có ca kiểm tra.')).toBeTruthy()
    expect(screen.queryByRole('region', { name: 'Hai phe' })).toBeNull()
  })
})

// Em vừa đánh bi `id` vào lỗ (dựng thẳng kết quả cú đánh, bỏ qua vật lý).
const emAnBi = (v: VanBia, id: KiHieu) => act(() => {
  v.isBreak = false; v.cur = 0
  const b = v.st.balls.find((x) => x.id === id)!
  b.on = false; v.viTriLo[id] = { x: 20, y: 20 }
  v.ev = { ...suKienMoi(), firstHit: id, potted: [id] }; v.pha = 'xet'
  v.ketThucCu()
})
const veVan = (cheDo: 'don' | 'doi' = 'don') => render(<ManChoi token="tk" tenEm="Khánh Linh" van="v1" session="s1" cheDo={cheDo} loai="ai" cauEm={Array.from({ length: 7 }, (_, i) => cau(i + 1))} chot={cau(9)} onVeSanh={() => {}} onChoiLai={() => {}} />)

describe('Màn chơi: tấm câu, câu sai sang lượt ngay, Xem lại câu sai', () => {
  it('mở diễn biến khi cần; đọc bằng bàn phím và đóng bằng Esc không đổi góc hoặc đánh bi', () => {
    KHO_HUONG_DAN.dat('1')
    veVan()
    const v = van(), gocDau = { ...v.aim }, soCu = v.soCu
    expect(screen.queryByRole('dialog', { name: 'Diễn biến ván' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Tuỳ chỉnh' }))
    fireEvent.click(screen.getByRole('button', { name: 'Diễn biến ván' }))
    const dong = screen.getByRole('button', { name: 'Đóng diễn biến ván' })
    expect(screen.getByRole('dialog', { name: 'Diễn biến ván' })).toBeTruthy()
    expect(document.activeElement).toBe(dong)
    fireEvent.keyDown(dong, { key: 'ArrowRight' })
    fireEvent.keyDown(dong, { key: ' ' })
    expect(v.aim).toEqual(gocDau)
    expect(v.soCu).toBe(soCu)
    fireEvent.keyDown(dong, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Diễn biến ván' })).toBeNull()
    expect(van()).toBe(v)
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Tuỳ chỉnh' }))
  })
  it('câu SAI ⇒ máy chủ chấm, lượt sang A.I NGAY (tấm vẫn mở), máy chủ đổi câu cho bi; "Đã đọc lời giải" đóng tấm; hiện "Xem lại câu sai 1"', async () => {
    veVan()
    const v = van()
    expect(v).toBeTruthy()
    await emAnBi(v, 'Na')
    const tam = await screen.findByRole('dialog', { name: /Na/ })
    expect(tam.textContent).toContain('Câu hỏi số 1')
    fireEvent.click(screen.getByRole('button', { name: /Nhiễu một 1/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Chốt đáp án' }))
    await waitFor(() => expect(lenh('answer')[0]).toEqual({ session: 's1', qid: 'q1', answer: 'B', assisted: false }))
    await screen.findByRole('button', { name: 'Đã đọc lời giải' })
    expect(tam.textContent).toContain('Kiến thức cốt lõi của q1') // lời giải chuẩn của thẻ câu
    await waitFor(() => expect(v.cur).toBe(1), { timeout: 1500 }) // sang lượt A.I ngay, KHÔNG đợi em đọc xong
    expect(screen.getByRole('button', { name: 'Đã đọc lời giải' })).toBeTruthy()
    await waitFor(() => expect(lenh('bia-doi-cau')[0]).toEqual({ session: 's1', qidCu: 'q1', chot: false }))
    await waitFor(() => expect(v.cauCua.Na?.qid).toBe('q20'))
    expect(v.bi.Na.an).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Đã đọc lời giải' }))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Đã đọc lời giải' })).toBeNull())
    const nutXem = await screen.findByRole('button', { name: /Xem lại câu sai\s*1/ })
    fireEvent.click(nutXem)
    const xem = await screen.findByRole('dialog', { name: 'Xem lại câu sai' })
    expect(xem.textContent).toContain('Câu hỏi số 1')
    expect(xem.textContent).toContain('tới lượt em thì tấm này tự đóng')
    // tới lượt em ⇒ tấm tự đóng
    act(() => { v.cur = 0; v.batDauLuot(false) })
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Xem lại câu sai' })).toBeNull())
    expect(screen.queryByRole('button', { name: /Xem lại câu sai/ })).toBeNull() // lượt em: không hiện nút
  })

  it('câu ĐÚNG ⇒ bi ăn + cộng điểm ngay lúc chấm, nhưng chưa đánh tiếp; bấm "Đánh tiếp" thì em đánh tiếp', async () => {
    veVan()
    const v = van()
    await emAnBi(v, 'Mg')
    await screen.findByRole('dialog', { name: /Mg/ })
    fireEvent.click(screen.getByRole('button', { name: /Đáp án đúng 2/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Chốt đáp án' }))
    const tiep = await screen.findByRole('button', { name: 'Đánh tiếp' })
    expect(v.bi.Mg.an).toBe(true)
    expect(v.diem[0]).toBe(10) // Nhận biết = 10 điểm
    expect(v.pha).toBe('cau') // còn đợi em đóng tấm
    fireEvent.click(tiep)
    await waitFor(() => expect(v.pha).toBe('aim'))
    expect(v.cur).toBe(0)
    expect(lenh('bia-doi-cau')).toHaveLength(0)
  })

  it('đánh đôi: đang xem lại câu sai mà đồng đội A.I đánh bi của em vào lỗ ⇒ tấm xem lại tự đóng, tấm câu cho em lên trên', async () => {
    veVan('doi')
    const v = van()
    const [b1, b2] = v.biEm() as KiHieu[]
    await emAnBi(v, b1!)
    await screen.findByRole('dialog', { name: new RegExp(`Bi ${b1} vào lỗ`) })
    fireEvent.click(screen.getByRole('button', { name: /Nhiễu một/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Chốt đáp án' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Đã đọc lời giải' }))
    fireEvent.click(await screen.findByRole('button', { name: /Xem lại câu sai\s*1/ }))
    await screen.findByRole('dialog', { name: 'Xem lại câu sai' })
    act(() => {
      v.cur = 2 // đồng đội A.I
      const b = v.st.balls.find((x) => x.id === b2)!
      b.on = false; v.viTriLo[b2!] = { x: 20, y: 20 }
      v.ev = { ...suKienMoi(), firstHit: b2!, potted: [b2!] }; v.pha = 'xet'
      v.ketThucCu()
    })
    const tam = await screen.findByRole('dialog', { name: new RegExp(`Đồng đội .* đánh bi ${b2} của em vào lỗ`) })
    expect(screen.queryByRole('dialog', { name: 'Xem lại câu sai' })).toBeNull()
    expect(v.xemMo).toBe(false)
    fireEvent.click(screen.getAllByRole('button', { name: /Đáp án đúng/ })[0]!)
    expect(tam.textContent).toContain('Câu hỏi số')
  })

  // Sửa 30/09 (thầy chốt "Bàn Bi-a mới"): giải trước = CHẠM BI CỦA EM TRÊN BÀN (bỏ ô "Bi của em"); lượt em thì chạm bi là nhắm.
  it('giải trước: lượt em ⇒ chạm bi trên bàn không mở; lượt A.I ⇒ mở tấm, đúng thì bi hoá vàng', async () => {
    const hop = (w: number, h: number) => ({ x: 0, y: 0, left: 0, top: 0, right: w, bottom: h, width: w, height: h, toJSON: () => ({}) }) as DOMRect
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => hop(360, 740))
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(360)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(740)
    KHO_HUONG_DAN.dat('1') // đã xem hướng dẫn lần đầu
    veVan()
    const v = van()
    const S = Math.min(360 / 552, 740 / 952), cv = document.querySelector('.bia-ban canvas')!
    const chamBi = (id: KiHieu) => { const b = v.st.balls.find((x) => x.id === id)!; const o = { clientX: (b.x + 26) * S, clientY: (b.y + 26) * S, pointerId: 1 }; fireEvent.pointerDown(cv, o); fireEvent.pointerUp(cv, o) }
    act(() => { v.pha = 'aim'; v.cur = 0 })
    chamBi('Al')
    expect(screen.queryByRole('dialog')).toBeNull()
    act(() => { v.cur = 1; v.pha = 'ai' })
    chamBi('Al')
    const tam = await screen.findByRole('dialog', { name: /em giải trước/ })
    expect(tam.textContent).toContain('Câu hỏi số 3')
    fireEvent.click(screen.getByRole('button', { name: /Đáp án đúng 3/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Chốt đáp án' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Về bàn' }))
    await waitFor(() => expect(v.bi.Al.vang).toBe(true))
    expect(screen.getByRole('region', { name: 'Hai phe' }).querySelectorAll('i[data-vang]')).toHaveLength(1)
    vi.restoreAllMocks()
  })

  it('hết giờ khi chưa chọn đủ (không gửi máy chủ) ⇒ trong ván như sai (bi về bàn, sang lượt) nhưng KHÔNG đếm câu sai, không đổi câu', async () => {
    veVan()
    const v = van()
    await emAnBi(v, 'Fe')
    await screen.findByRole('dialog', { name: /Fe/ })
    act(() => v.xongCau(v.sheet!.ma, false, false, false))
    await waitFor(() => expect(v.cur).toBe(1), { timeout: 1500 })
    expect(v.bi.Fe.an).toBe(false)
    expect(v.tk[0]!.sai).toBe(0)
    expect(v.tk[0]!.caiSai).toEqual([])
    expect(v.cauCua.Fe?.qid).toBe('q4') // bi giữ câu cũ
    expect(lenh('answer')).toHaveLength(0)
    expect(lenh('bia-doi-cau')).toHaveLength(0)
  })

  it('nhãn chỉ bi: bi em lộ dạng câu + mức + điểm; bi đối thủ và đồng đội KHÔNG lộ dạng câu', () => {
    veVan('doi')
    const v = van()
    const em = v.biEm()[0]!
    const nEm = noiDungNhan(v, em)
    expect(nEm.qh).toBe('em')
    expect(nEm.nho).toMatch(/Dạng \d · Nhận biết · 10 điểm/)
    const doiThu = noiDungNhan(v, 'Cl')
    expect(doiThu.qh).toBe('doi-thu')
    expect(doiThu.chinh).toMatch(/^Bi của đối thủ /)
    expect(doiThu.nho).not.toMatch(/Dạng/)
    const dd = (['Na', 'Mg', 'Al', 'Fe', 'Cu', 'Ag', 'Au'] as KiHieu[]).find((id) => !v.biEm().includes(id))!
    const nDd = noiDungNhan(v, dd)
    expect(nDd.qh).toBe('dong-doi')
    expect(nDd.nho).not.toMatch(/Dạng/)
    expect(noiDungNhan(v, 'C').chinh).toBe('Bi chốt')
  })

  it('Rời ván ⇒ hỏi lại; xác nhận ⇒ bia-ket-van lyDo "bo"', async () => {
    const onVeSanh = vi.fn()
    render(<ManChoi token="tk" tenEm="Khánh Linh" van="v9" session="s1" cheDo="don" loai="ai" cauEm={[cau(1)]} chot={cau(9)} onVeSanh={onVeSanh} onChoiLai={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Về Sảnh Bi-a' }))
    const hoi = await screen.findByRole('dialog', { name: 'Rời ván' })
    expect(hoi.textContent).toContain('câu chưa trả lời trả lại kế hoạch hôm nay')
    fireEvent.click(screen.getAllByRole('button', { name: 'Rời ván' }).at(-1)!)
    await waitFor(() => expect(lenh('bia-ket-van')[0]).toMatchObject({ van: 'v9', ketQua: { lyDo: 'bo' } }))
    await waitFor(() => expect(onVeSanh).toHaveBeenCalled())
  })
})
