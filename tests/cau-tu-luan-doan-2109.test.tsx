// CẤM RÚT CÂU TỰ LUẬN · ĐOÀN HỘ TỐNG (chốt chặn cuối ở máy em, thầy lệnh 21/09): máy chủ lỡ gửi câu tự luận vào hiệp ⇒ màn KHÔNG dựng ô nhập đáp án
// cho nó (không hiện đề, không nút chốt đòn), ghi console.warn; câu trắc nghiệm bình thường vẫn hiện như cũ. Bộ định nghĩa "tự luận": src/lib/cau-tu-luan.ts.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, configure } from '@testing-library/react'
vi.mock('../src/components/KhoiCauSai', () => ({ LoiGiaiCauSai: () => <p>Lời giải từ kho</p> }))
vi.mock('../src/game/than-thu-v2/battle-audio', () => ({ unlockBattleAudio: vi.fn(), playBattleSound: vi.fn() }))
import DoanHoTong from '../src/game/than-thu-v2/DoanHoTong'
import type { DoanXem } from '../src/game/than-thu-v2/doan-kieu'
import { quenDaBao } from '../src/lib/cau-tu-luan-may-hs'

configure({ asyncUtilTimeout: 8000 })
let canhBao: ReturnType<typeof vi.spyOn>
beforeEach(() => { sessionStorage.clear(); localStorage.clear(); quenDaBao(); canhBao = vi.spyOn(console, 'warn').mockImplementation(() => {}) })
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers() })

const ghe = (tt: string[] = ['dang_lam', 'da_chot', 'dang_lam']): DoanXem['ghe'] => [
  { ghe: 0, ten: 'Minh', pet: 2, cap: 32, laMay: false, roi: false, laEm: true, trangThai: tt[0] as never, tinHieu: null },
  { ghe: 1, ten: 'Thu Hà', pet: 1, cap: 30, laMay: false, roi: false, laEm: false, trangThai: tt[1] as never, tinHieu: null },
  { ghe: 2, ten: 'Nam', pet: 3, cap: 12, laMay: false, roi: false, laEm: false, trangThai: tt[2] as never, tinHieu: null },
]
const tran = (o: Record<string, unknown> = {}) => ({ tenChang: 'Vượt Đầm Bùn Acid', hiep: 3, soHiep: 8, laTrum: false, ketThuc: false, thang: null, linhTam: { hp: 80, toiDa: 100 }, quai: [{ ma: 5, loai: 'bun_acid', hp: 9 }], trumVoGiap: [],
  nangLuong: 1, daNhanTiepSuc: 0, giay: 40, moSauMs: 0, conMs: 27000, tenQuai: ['Bùn Acid', 'Khói Oxi Hoá'], loaiQuai: ['bun_acid', 'khoi_oxi_hoa'], tenTrum: ['Chúa tể Kết Tủa', 'Bá chủ Ăn Mòn'], loaiTrum: ['chua_te_ket_tua', 'ba_chu_an_mon'], ...o }) as DoanXem['tran']
const cau = { qid: 'Q1', maDe: 'D', version: 'v', group: 'g', phan: 'I' as const, text: 'Thuỷ phân ethyl acetate thu được', choices: ['phương án một', 'phương án hai', 'phương án ba', 'phương án bốn'], ideas: [], hinhAnh: [], dang: 'ES', tenDang: 'Ester', mucDo: 'hieu', sao: 2, kienThuc: [] }
const cauTrum = { ...cau, qid: 'T1', phan: 'II' as const, text: 'Cho ester X', choices: [], ideas: ['ý thứ nhất', 'ý thứ hai', 'ý thứ ba', 'ý thứ tư'] }
const trongTran = (o: Partial<DoanXem> = {}): DoanXem => ({ ma: 'DH1', revision: 5, laChu: true, batDau: true, ghe: ghe(), gioMayChu: 0, tran: tran(), cau: { qid: 'Q1', nhan: 'toi_han_on', de: cau }, ...o })

/** Dựng màn với máy chủ giả: `doan-xem` luôn trả `xem`; lệnh khác trả theo `tra`. */
function dung(xem: DoanXem | null, tra: (lenh: string, b: Record<string, unknown>) => unknown = () => ({ ok: true, doan: xem })) {
  if (xem) sessionStorage.setItem('doan:S1', xem.ma)
  const call = vi.fn(async (lenh: string, b: Record<string, unknown> = {}) => lenh === 'recommendations' ? { ok: true, suggestions: [{ title: 'Ester' }, { title: 'Ester' }, { title: 'Ancol' }], remaining: 100 } : lenh === 'doan-xem' ? (xem ? { ok: true, doan: xem } : Promise.reject(new Error('Không tìm thấy chặng này.'))) : tra(lenh, b))
  const onVe = vi.fn(), onDong = vi.fn()
  render(<DoanHoTong call={call} sbd="S1" pet={2} cap={32} onDong={onDong} onVeBangNhiemVu={onVe} />)
  return { call, onVe, onDong }
}
const man = () => document.querySelector('.dh') as HTMLElement
/** ĐÚNG câu trong ảnh thầy: phần III hỏi mở, khuôn công khai (không đáp án). */
const cauTuLuan = { ...cau, qid: 'Q9', phan: 'III' as const, text: 'Theo em, có thể dùng phương pháp nào để tách saccharose ra khỏi hỗn hợp với tinh bột?', choices: [], ideas: [] }

/** Hiệp trùm: câu chung cả đội (phần II bốn ý). */
const trum = (de: unknown) => trongTran({ tran: tran({ hiep: 4, laTrum: true, giay: 60, conMs: 52000 }), cau: undefined, trum: { coCau: true, giaoY: [1, 0, 2, 1], yCuaEm: [1], yDaChot: [true, false, false, false], qid: 'T1', tenDang: 'Ester', de: de as never } })

describe('Đoàn Hộ Tống · chốt chặn câu tự luận', () => {
  it('câu trắc nghiệm bình thường: đề hiện, có nút chốt đòn, không cảnh báo (đối chứng)', async () => {
    dung(trongTran())
    expect(await screen.findByText('Thuỷ phân ethyl acetate thu được')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Chọn đáp án để chốt đòn/ })).toBeTruthy()
    expect(canhBao).not.toHaveBeenCalled()
  })
  it('câu tự luận của hiệp: KHÔNG hiện đề, KHÔNG có phương án/ô nhập, nút chốt đòn khoá, ghi cảnh báo một dòng', async () => {
    dung(trongTran({ cau: { qid: 'Q9', nhan: 'toi_han_on', de: cauTuLuan } }))
    expect(await screen.findByText(/Đang tải câu của em/)).toBeTruthy() // chỗ đề rỗng, không ô nhập
    expect(man().textContent).not.toContain('saccharose')
    for (const nut of screen.queryAllByRole('button', { name: /chốt/i })) expect((nut as HTMLButtonElement).disabled).toBe(true) // không có đường chốt đáp án cho câu này
    expect(screen.queryAllByRole('button', { name: /^(A|B|C|D)\b|phương án/i })).toHaveLength(0)
    expect(document.querySelectorAll('input, textarea')).toHaveLength(0)
    expect(canhBao).toHaveBeenCalledTimes(1)
    expect(String(canhBao.mock.calls[0]![0])).toContain('Q9')
  })
  it('hiệp trùm: câu chung bình thường hiện đủ (đối chứng); câu chung tự luận ⇒ rơi về lời "không có câu chung phù hợp", không dựng ô nào', async () => {
    dung(trum(cauTrum))
    expect(await screen.findByText('ý thứ hai')).toBeTruthy()
    expect(canhBao).not.toHaveBeenCalled()
    cleanup()
    dung(trum({ ...cauTrum, kieu: 'tu_luan' }))
    expect(await screen.findByText(/không có câu chung phù hợp/)).toBeTruthy()
    expect(screen.queryByLabelText('Câu chung cả đội')).toBeNull()
    expect(screen.queryByText('ý thứ hai')).toBeNull()
    expect(canhBao).toHaveBeenCalledTimes(1)
    expect(String(canhBao.mock.calls[0]![0])).toContain('doan-trum')
  })
})
