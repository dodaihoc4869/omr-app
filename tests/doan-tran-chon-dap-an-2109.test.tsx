// ĐOÀN HỘ TỐNG · P0 thầy báo 19:24 (tin Zalo của một em): "em chọn đáp án nhưng nó không ấn được · nó chọn đáp án em ấn trước · em ấn lại nó không nhận" — thầy: "đáp án bị nhảy, sửa lại ngay".
// GỐC (Boss đọc mã, Code 2 tái hiện bằng máy chủ giả CHẬM): `DoanTran` khoá CẢ lưới đáp án theo `ban` (MỌI lệnh `goi` đang bay: tín hiệu, xin tiếp sức, mở thẻ giúp bạn, chốt ý trùm… mạng điện thoại 1–2 giây)
// ⇒ em đổi ý bấm lại bị NUỐT ⇒ tới lúc chốt máy lấy đáp án bấm ĐẦU. Sửa: chọn / đổi đáp án CHỈ khoá khi đã chốt hoặc đang chốt CHÍNH câu này; nút CHỐT khoá theo `ban`.
// Trùm: nút "Chốt ý này" luôn CÓ SẴN (khoá tới khi chọn) — trước đây chỉ hiện SAU khi chọn ⇒ hàng Đúng/Sai bên dưới bị đẩy xuống ⇒ ngón tay trúng hàng khác.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor, configure, act } from '@testing-library/react'
vi.mock('../src/components/KhoiCauSai', () => ({ LoiGiaiCauSai: () => <p>Lời giải từ kho</p> }))
vi.mock('../src/game/than-thu-v2/battle-audio', () => ({ unlockBattleAudio: vi.fn(), playBattleSound: vi.fn() }))
import DoanHoTong from '../src/game/than-thu-v2/DoanHoTong'
import type { DoanXem } from '../src/game/than-thu-v2/doan-kieu'

configure({ asyncUtilTimeout: 8000 })
beforeEach(() => { sessionStorage.clear(); localStorage.clear() })
afterEach(() => { cleanup() })

const ghe = (): DoanXem['ghe'] => [
  { ghe: 0, ten: 'Minh', pet: 2, cap: 32, laMay: false, roi: false, laEm: true, trangThai: 'dang_lam' as never, tinHieu: null },
  { ghe: 1, ten: 'Thu Hà', pet: 1, cap: 30, laMay: false, roi: false, laEm: false, trangThai: 'dang_lam' as never, tinHieu: null },
  { ghe: 2, ten: 'Nam', pet: 3, cap: 12, laMay: false, roi: false, laEm: false, trangThai: 'dang_lam' as never, tinHieu: null },
  { ghe: 3, ten: 'Lan', pet: 0, cap: 8, laMay: true, roi: false, laEm: false, trangThai: 'dang_lam' as never, tinHieu: null },
]
const tran = (o: Record<string, unknown> = {}) => ({ tenChang: 'Vượt Đầm Bùn Acid', hiep: 3, soHiep: 8, laTrum: false, ketThuc: false, thang: null, linhTam: { hp: 80, toiDa: 100 }, quai: [{ ma: 5, loai: 'bun_acid', hp: 9 }], trumVoGiap: [],
  nangLuong: 1, daNhanTiepSuc: 0, giay: 40, moSauMs: 0, conMs: 27000, tenQuai: ['Bùn Acid', 'Khói Oxi Hoá'], loaiQuai: ['bun_acid', 'khoi_oxi_hoa'], tenTrum: ['Chúa tể Kết Tủa', 'Bá chủ Ăn Mòn'], loaiTrum: ['chua_te_ket_tua', 'ba_chu_an_mon'], ...o }) as DoanXem['tran']
const cau = { qid: 'Q1', maDe: 'D', version: 'v', group: 'g', phan: 'I' as const, text: 'Thuỷ phân ethyl acetate thu được', choices: ['phương án một', 'phương án hai', 'phương án ba', 'phương án bốn'], ideas: [], hinhAnh: [], dang: 'ES', tenDang: 'Ester', mucDo: 'hieu', sao: 2, kienThuc: [] }
const cauTrum = { ...cau, qid: 'T1', phan: 'II' as const, text: 'Cho ester X', choices: [], ideas: ['ý thứ nhất', 'ý thứ hai', 'ý thứ ba', 'ý thứ tư'] }
const ts = (o: Record<string, unknown> = {}) => ({ conLuotNhan: 2, daXin: false, theNhan: null, banCan: [], daGiup: false, lienKichSanSang: false, ...o })
const trongTran = (o: Partial<DoanXem> = {}): DoanXem => ({ ma: 'DH1', revision: 5, laChu: true, batDau: true, ghe: ghe(), gioMayChu: 0, tran: tran(), cau: { qid: 'Q1', nhan: 'toi_han_on', de: cau }, tiepSuc: ts() as never, ...o })
const trumTran = (o: Partial<DoanXem> = {}): DoanXem => ({ ma: 'DH1', revision: 5, laChu: true, batDau: true, ghe: ghe(), gioMayChu: 0, tran: tran({ laTrum: true, hiep: 4 }), trum: { coCau: true, giaoY: [0, 1, 2, 3], yCuaEm: [0, 1], yDaChot: [false, false, false, false], qid: 'T1', tenDang: 'Ester', de: cauTrum as never }, ...o })

/** Máy chủ giả CHẬM: mỗi lệnh trong `treo` chỉ trả lời khi test gọi `nha()` (mạng điện thoại 1–2 giây). `doan-xem` (nhịp hỏi) trả gói hiện tại NGAY. */
function dung(xem: DoanXem, treo: string[] = []) {
  sessionStorage.setItem('doan:S1', xem.ma)
  const dangCho: (() => void)[] = []
  let hienTai = xem
  const call = vi.fn(async (lenh: string, _b: Record<string, unknown> = {}) => {
    if (lenh === 'recommendations') return { ok: true, suggestions: [], remaining: 100 }
    if (lenh === 'doan-xem') return { ok: true, doan: hienTai }
    if (lenh === 'doan-sanh') return { ok: true, sanh: null }
    if (treo.includes(lenh)) return await new Promise((res) => { dangCho.push(() => res(lenh === 'doan-nop' ? { ok: true, doan: { ...hienTai, revision: hienTai.revision + 1, cau: { ...hienTai.cau, daChot: true, hanhDong: 'danh', ketQua: null } }, ketQuaCau: { correct: true, answer: 'B', solution: 'x', reward: 20 } } : { ok: true, doan: { ...hienTai, revision: hienTai.revision + 1 } })) })
    return { ok: true, doan: { ...hienTai, revision: hienTai.revision + 1 } }
  })
  render(<DoanHoTong call={call} sbd="S1" pet={2} cap={32} onDong={vi.fn()} onVeBangNhiemVu={vi.fn()} />)
  return { call, nha: () => act(async () => { dangCho.splice(0).forEach((f) => f()) }), doiGoi: (g: DoanXem) => { hienTai = g } }
}
const pa = (chu: 'một' | 'hai' | 'ba' | 'bốn') => screen.getByRole('button', { name: new RegExp(`phương án ${chu}`) }) as HTMLButtonElement
const dangChon = () => (['một', 'hai', 'ba', 'bốn'] as const).filter((c) => pa(c).getAttribute('aria-pressed') === 'true').map((c) => ({ một: 'A', hai: 'B', ba: 'C', bốn: 'D' })[c])
const nutChot = () => document.querySelector('.dh-nut-lam') as HTMLButtonElement
const nutXin = () => screen.getByRole('button', { name: /Cần tiếp sức|Đang chờ bạn tiếp sức/ }) as HTMLButtonElement

describe('LƯỚI ĐÁP ÁN KHÔNG BỊ KHOÁ khi có lệnh khác đang bay (gốc "bấm lại nó không nhận")', () => {
  it('bấm "Cần tiếp sức" (lệnh treo 1,5 s) rồi chọn A, đổi B ⇒ CẢ HAI lần bấm nhận ngay; chốt ⇒ máy chủ nhận B (không phải A bấm đầu)', async () => {
    const { call, nha } = dung(trongTran(), ['doan-tin-hieu'])
    await screen.findByText('phương án hai')
    fireEvent.click(nutXin())
    await waitFor(() => expect(call).toHaveBeenCalledWith('doan-tin-hieu', { ma: 'DH1', tinHieu: 'can_tiep_suc' }))
    // đang bay: lưới VẪN bấm được
    expect(pa('một').disabled).toBe(false)
    fireEvent.click(pa('một'))
    expect(dangChon()).toEqual(['A'])
    fireEvent.click(pa('hai'))
    expect(dangChon()).toEqual(['B']) // đổi ý được ngay, không bị nuốt
    await nha()
    await waitFor(() => expect(nutChot().disabled).toBe(false))
    fireEvent.click(nutChot())
    await waitFor(() => expect(call).toHaveBeenCalledWith('doan-nop', { ma: 'DH1', hiep: 3, answer: 'B', hanhDong: 'danh' }))
    expect(call.mock.calls.filter((c) => c[0] === 'doan-nop')).toHaveLength(1)
  })

  it('CHỐT đang bay (mạng chậm): lưới khoá để đáp án trên màn = đáp án đã gửi; nút chốt nói "Đang chốt…"; xong thì khoá hẳn vì đã chốt', async () => {
    const { call, nha } = dung(trongTran(), ['doan-nop'])
    await screen.findByText('phương án hai')
    fireEvent.click(pa('một'))
    fireEvent.click(nutChot())
    await waitFor(() => expect(call).toHaveBeenCalledWith('doan-nop', { ma: 'DH1', hiep: 3, answer: 'A', hanhDong: 'danh' }))
    expect(nutChot().textContent).toContain('Đang chốt…')
    expect(pa('hai').disabled).toBe(true) // đang chốt A: không cho đổi sang B (màn sẽ nói dối)
    fireEvent.click(pa('hai'))
    expect(dangChon()).toEqual(['A'])
    await nha()
    expect(await screen.findByText(/Em đã chốt/)).toBeTruthy()
    expect(pa('hai').disabled).toBe(true)
    expect(call.mock.calls.filter((c) => c[0] === 'doan-nop')).toHaveLength(1)
  })

  it('chốt THẤT BẠI (mạng rớt / máy chủ từ chối) ⇒ lưới MỞ LẠI (không kẹt khoá), đổi được sang B và chốt lần hai gửi B', async () => {
    sessionStorage.setItem('doan:S1', 'DH1')
    let lanNop = 0
    const call = vi.fn(async (lenh: string, _b: Record<string, unknown> = {}) => {
      if (lenh === 'doan-xem') return { ok: true, doan: trongTran() }
      if (lenh === 'recommendations') return { ok: true, suggestions: [], remaining: 9 }
      if (lenh === 'doan-sanh') return { ok: true, sanh: null }
      if (lenh === 'doan-nop') { lanNop += 1; if (lanNop === 1) throw new Error('Mạng chập chờn, em thử lại nhé.'); return { ok: true, doan: { ...trongTran(), revision: 9, cau: { ...trongTran().cau, daChot: true, hanhDong: 'danh', ketQua: null } }, ketQuaCau: { correct: true, answer: 'B', solution: 'x', reward: 20 } } }
      return { ok: true }
    })
    render(<DoanHoTong call={call} sbd="S1" pet={2} cap={32} onDong={vi.fn()} onVeBangNhiemVu={vi.fn()} />)
    await screen.findByText('phương án hai')
    fireEvent.click(pa('một'))
    fireEvent.click(nutChot())
    expect(await screen.findByText('Mạng chập chờn, em thử lại nhé.')).toBeTruthy()
    await waitFor(() => expect(pa('hai').disabled).toBe(false)) // mở lại
    fireEvent.click(pa('hai'))
    expect(dangChon()).toEqual(['B'])
    await waitFor(() => expect(nutChot().disabled).toBe(false))
    fireEvent.click(nutChot())
    await waitFor(() => expect(call).toHaveBeenLastCalledWith('doan-nop', { ma: 'DH1', hiep: 3, answer: 'B', hanhDong: 'danh' }))
  })

  it('lệnh KHÁC chốt đang bay: nút chốt khoá nhưng KHÔNG nói "Đang chốt…" (em chưa chốt gì)', async () => {
    const { nha } = dung(trongTran(), ['doan-tin-hieu'])
    await screen.findByText('phương án hai')
    fireEvent.click(pa('ba'))
    fireEvent.click(nutXin())
    await waitFor(() => expect(nutChot().disabled).toBe(true))
    expect(nutChot().textContent).not.toContain('Đang chốt…')
    expect(nutChot().textContent).toMatch(/Chờ một chút…/)
    await nha()
    await waitFor(() => expect(nutChot().disabled).toBe(false))
    expect(nutChot().textContent).toContain('Chốt đòn · C + Đánh')
  })

  it('chọn A rồi bấm lại A/B liên tiếp nhiều lần ⇒ luôn là lần bấm CUỐI (không bao giờ kẹt ở lần đầu)', async () => {
    dung(trongTran(), ['doan-tin-hieu'])
    await screen.findByText('phương án hai')
    fireEvent.click(nutXin())
    for (const c of ['một', 'hai', 'ba', 'bốn', 'một', 'ba'] as const) fireEvent.click(pa(c))
    expect(dangChon()).toEqual(['C'])
  })
})

describe('Câu chung của TRÙM: Đúng/Sai không khoá theo lệnh đang bay; "Chốt ý này" CÓ SẴN (không xuất hiện sau khi chọn ⇒ không đẩy hàng dưới)', () => {
  const hang = (i: number) => document.querySelectorAll('.dh-y > div')[i] as HTMLElement
  it('mỗi ý CỦA EM có nút "Chốt ý này" ngay từ đầu, khoá tới khi chọn; chọn xong KHÔNG thêm phần tử nào vào hàng', async () => {
    dung(trumTran())
    await screen.findByText('ý thứ nhất')
    const truoc = [...hang(0).querySelectorAll('button')].map((b) => b.textContent)
    expect(truoc).toEqual(['Đúng', 'Sai', 'Chốt ý này'])
    const chot = hang(0).querySelector('.dh-chot-y') as HTMLButtonElement
    expect(chot.disabled).toBe(true) // chưa chọn ⇒ khoá (nhưng CÓ MẶT giữ chỗ)
    const nodeTruoc = [...hang(0).querySelectorAll('button')]
    fireEvent.click(screen.getAllByRole('button', { name: 'Đúng' })[0]!)
    const nodeSau = [...hang(0).querySelectorAll('button')]
    expect(nodeSau).toHaveLength(nodeTruoc.length) // KHÔNG thêm nút
    expect(nodeSau.every((n, i) => n === nodeTruoc[i])).toBe(true) // cùng phần tử DOM (không dựng lại)
    expect((hang(0).querySelector('.dh-chot-y') as HTMLButtonElement).disabled).toBe(false)
  })
  it('Đúng/Sai bấm được khi có lệnh khác đang bay (tín hiệu "Đợi tí" treo); đổi ý Đúng → Sai nhận ngay; chốt ý gửi ĐÚNG lựa chọn cuối', async () => {
    const { call, nha } = dung(trumTran(), ['doan-tin-hieu'])
    await screen.findByText('ý thứ nhất')
    fireEvent.click(screen.getByRole('button', { name: 'Đợi tí' }))
    await waitFor(() => expect(call).toHaveBeenCalledWith('doan-tin-hieu', { ma: 'DH1', tinHieu: 'doi_ti' }))
    const [dung0, sai0] = [screen.getAllByRole('button', { name: 'Đúng' })[0]!, screen.getAllByRole('button', { name: 'Sai' })[0]!] as HTMLButtonElement[]
    expect(dung0.disabled).toBe(false)
    expect(sai0.disabled).toBe(false)
    fireEvent.click(dung0)
    expect(dung0.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(sai0)
    expect(sai0.getAttribute('aria-pressed')).toBe('true')
    expect(dung0.getAttribute('aria-pressed')).toBe('false')
    await nha()
    const chot = hang(0).querySelector('.dh-chot-y') as HTMLButtonElement
    await waitFor(() => expect(chot.disabled).toBe(false))
    fireEvent.click(chot)
    await waitFor(() => expect(call).toHaveBeenCalledWith('doan-nop-y', { ma: 'DH1', hiep: 4, y: 0, answer: 'S' }))
  })
  it('nút "Chốt ý này" vẫn khoá theo lệnh đang bay (không chốt hai lần) và khoá khi chưa chọn', async () => {
    const { nha } = dung(trumTran(), ['doan-tin-hieu'])
    await screen.findByText('ý thứ nhất')
    fireEvent.click(screen.getAllByRole('button', { name: 'Đúng' })[0]!)
    fireEvent.click(screen.getByRole('button', { name: 'Đợi tí' }))
    await waitFor(() => expect((hang(0).querySelector('.dh-chot-y') as HTMLButtonElement).disabled).toBe(true))
    expect((hang(1).querySelector('.dh-chot-y') as HTMLButtonElement).disabled).toBe(true) // ý b chưa chọn
    await nha()
  })
})

describe('HIỆP MỚI xoá lựa chọn cũ; gói tin CŨ tới trễ không xoá lựa chọn của em; không có đường tự chốt bằng lựa chọn cũ', () => {
  it('em chọn A ở hiệp 3; gói CŨ (revision thấp hơn) tới trễ ⇒ lựa chọn giữ; sang hiệp 4 ⇒ ô trống, chọn C mới nhận và chốt gửi C ở hiệp 4', async () => {
    const { call, doiGoi } = dung(trongTran({ revision: 10 }))
    await screen.findByText('phương án hai')
    fireEvent.click(pa('một'))
    expect(dangChon()).toEqual(['A'])
    doiGoi(trongTran({ revision: 7 })) // gói cũ (revision thấp) tới trễ
    await new Promise((r) => setTimeout(r, 1700)) // qua một nhịp hỏi 1,5 s
    expect(dangChon()).toEqual(['A'])
    doiGoi(trongTran({ revision: 11, tran: tran({ hiep: 4 }) })) // sang hiệp 4
    await waitFor(() => expect(dangChon()).toEqual([]), { timeout: 4000 })
    fireEvent.click(pa('ba'))
    expect(dangChon()).toEqual(['C'])
    fireEvent.click(nutChot())
    await waitFor(() => expect(call).toHaveBeenCalledWith('doan-nop', { ma: 'DH1', hiep: 4, answer: 'C', hanhDong: 'danh' }))
  }, 20000)
  it('hết giờ (đồng hồ về 0) KHÔNG tự chốt: máy chủ chỉ được hỏi trạng thái (doan-xem), không có doan-nop nào từ máy em', async () => {
    const { call } = dung(trongTran({ tran: tran({ conMs: 300 }) }))
    await screen.findByText('phương án hai')
    fireEvent.click(pa('hai'))
    await new Promise((r) => setTimeout(r, 1200))
    expect(call.mock.calls.some((c) => c[0] === 'doan-nop')).toBe(false)
    expect(dangChon()).toEqual(['B']) // gói hỏi lại lúc hết giờ không xoá lựa chọn của hiệp đang hiện
  })
})
