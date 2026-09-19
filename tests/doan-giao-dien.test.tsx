// ĐOÀN HỘ TỐNG — bước 3: giao diện. Máy chủ giả bằng một hàm `call`; kiểm đúng gói tin gửi đi và ĐIỀU KHÔNG ĐƯỢC HIỆN.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor, act, configure } from '@testing-library/react'
vi.mock('../src/components/KhoiCauSai', () => ({ LoiGiaiCauSai: () => <p>Lời giải từ kho</p> }))
vi.mock('../src/game/than-thu-v2/battle-audio', () => ({ unlockBattleAudio: vi.fn(), playBattleSound: vi.fn() }))
import DoanHoTong from '../src/game/than-thu-v2/DoanHoTong'
import { GIAY_TUNG_CHUONG } from '../src/game/than-thu-v2/DoanTungChuong'
import { laThuBayVn } from '../src/game/than-thu-v2/Game'
import type { DoanXem } from '../src/game/than-thu-v2/doan-kieu'

// Chạy chung với cả bộ 5000+ test thì máy rất nặng: nới hạn chờ của findBy/waitFor để không đỏ oan vì chậm (không đo thời gian ở đây).
configure({ asyncUtilTimeout: 8000 })
beforeEach(() => { sessionStorage.clear(); localStorage.clear() })
afterEach(() => { cleanup(); vi.useRealTimers() })

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

describe('Đoàn Hộ Tống · giao diện · Sảnh', () => {
  it('nói rõ câu của RIÊNG em hôm nay từ gợi ý máy chủ; LÊN ĐƯỜNG gọi doan-mo; không bịa số trạm / vé / chuỗi khi máy chủ chưa trả', async () => {
    const { call } = dung(null)
    expect(await screen.findByText('2 câu Ester')).toBeTruthy(); expect(screen.getByText('1 câu Ancol')).toBeTruthy()
    expect(man().dataset.man).toBe('sanh'); expect(man().textContent).not.toMatch(/Trạm \d|\d+\/30|\d+ vé|chuỗi \d/i)
    // Bốn ô SẮP MỞ có khoá: tên + một dòng mô tả, KHÔNG con số nào ngoài giờ hẹn Chủ nhật 20:00
    const sapMo = screen.getByLabelText('Sắp mở'); expect([...sapMo.querySelectorAll('b')].map(b => b.textContent)).toEqual(['Đoàn lớp', 'Rương chuỗi ngày', 'Trùm lớp', 'Ấn thạch dạng'])
    expect(sapMo.querySelectorAll('.dh-khoa')).toHaveLength(4); expect(sapMo.textContent!.replace('20:00', '')).not.toMatch(/\d/); expect(sapMo.querySelectorAll('button')).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: /LÊN ĐƯỜNG/ }))
    await waitFor(() => expect(call).toHaveBeenCalledWith('doan-mo', {}))
  })
  it('đi cùng bạn: mở đoàn lấy mã, nhập mã để vào; phòng chờ hiện mã + tên gọi, chỉ chủ đoàn thấy nút lên đường', async () => {
    const phong: DoanXem = { ma: 'DH7A2C', revision: 1, laChu: false, batDau: false, ghe: ghe(['cho', 'cho', 'cho']), gioMayChu: 0 }
    const { call } = dung(null, lenh => lenh === 'doan-vao' ? { ok: true, doan: phong } : { ok: true })
    fireEvent.change(await screen.findByLabelText('Mã đoàn của bạn'), { target: { value: 'dh7a2c' } }); fireEvent.click(screen.getByRole('button', { name: 'Vào' }))
    await waitFor(() => expect(call).toHaveBeenCalledWith('doan-vao', { ma: 'DH7A2C' }))
    expect(await screen.findByLabelText('Mã đoàn DH7A2C')).toBeTruthy(); expect(screen.getByText('Thu Hà')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /LÊN ĐƯỜNG/ })).toBeNull(); expect(screen.getByText(/Chờ bạn mở đoàn/)).toBeTruthy()
  })
  it('máy chủ từ chối (hết 200 câu, chưa có câu vừa sức…) → lời tiếng Việt hiện ngay trong thẻ, không vỡ màn', async () => {
    dung(null, () => Promise.reject(new Error('Em đã hoàn thành 200 câu hôm nay.')))
    fireEvent.click(await screen.findByRole('button', { name: /LÊN ĐƯỜNG/ }))
    expect((await screen.findByRole('alert')).textContent).toContain('200 câu')
  })
})

describe('Đoàn Hộ Tống · giao diện · Trong trận', () => {
  it('dải đồng đội chỉ có trạng thái — không có chữ "sai", không có đáp án của bạn; đồng hồ + 8 vạch hiệp', async () => {
    dung(trongTran())
    expect(await screen.findByText('Thuỷ phân ethyl acetate thu được')).toBeTruthy()
    const dai = screen.getByLabelText('Đồng đội'); expect(dai.textContent).toBe('Emđang làmThu Hàđã chốtNamđang làm')
    expect(man().textContent).not.toMatch(/\bsai\b/i); expect(man().dataset.man).toBe('tran'); expect(man().className).toContain('dh-tran')
    expect(document.querySelectorAll('.dh-vach i')).toHaveLength(8); expect(document.querySelectorAll('.dh-vach i.dh-trum')).toHaveLength(2)
    expect(screen.getByRole('timer').textContent).toBe('27'); expect(screen.getByText(/Ester · tới hạn ôn/)).toBeTruthy()
  })
  it('chọn B + Đánh rồi chốt → gửi đúng gói; chưa chọn đáp án thì không chốt được; Kỹ năng khoá khi thiếu năng lượng', async () => {
    const { call } = dung(trongTran(), () => ({ ok: true, doan: trongTran({ revision: 6, cau: { qid: 'Q1', daChot: true, hanhDong: 'danh', ketQua: null } }), ketQuaCau: { correct: true, answer: 'B', solution: 'x', reward: 20 } }))
    await screen.findByText('phương án hai')
    expect((screen.getByRole('button', { name: /Chọn đáp án để chốt đòn/ }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: /kỹ năng · 1\/2 NL/ }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: /phương án hai/ })); fireEvent.click(screen.getByRole('button', { name: /Chốt đòn · B \+ Đánh/ }))
    await waitFor(() => expect(call).toHaveBeenCalledWith('doan-nop', { ma: 'DH1', hiep: 3, answer: 'B', hanhDong: 'danh' }))
    expect(await screen.findByText('Em trả lời đúng.')).toBeTruthy(); expect(screen.getByText(/Em đã chốt/)).toBeTruthy()
    expect(screen.queryByRole('group', { name: 'Chọn đòn' })).toBeNull() // chốt rồi không đổi
  })
  it('bỏ trống chỉ đi với Chắn: gửi boTrong, không gửi đáp án', async () => {
    const { call } = dung(trongTran())
    await screen.findByText('phương án hai'); fireEvent.click(screen.getByRole('button', { name: /^Chắn/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Chốt · bỏ trống + Chắn' }))
    await waitFor(() => expect(call).toHaveBeenCalledWith('doan-nop', { ma: 'DH1', hiep: 3, boTrong: true, hanhDong: 'chan' }))
  })
  it('rời chặng phải chạm HAI lần; lần đầu chỉ nhắc "máy sẽ đỡ thay, đội không bị phạt"', async () => {
    const { call } = dung(trongTran(), () => ({ ok: true, daRoi: true }))
    fireEvent.click(await screen.findByRole('button', { name: 'Rời chặng' }))
    expect((await screen.findByRole('alert')).textContent).toContain('đội không bị phạt'); expect(call).not.toHaveBeenCalledWith('doan-roi', expect.anything())
    fireEvent.click(screen.getByRole('button', { name: 'Rời chặng' }))
    await waitFor(() => expect(call).toHaveBeenCalledWith('doan-roi', { ma: 'DH1' })); await waitFor(() => expect(man().dataset.man).toBe('sanh'))
  })
})

describe('Đoàn Hộ Tống · giao diện · Trùm câu chung', () => {
  const trum = (o: Record<string, unknown> = {}) => trongTran({ tran: tran({ hiep: 4, laTrum: true, giay: 60, conMs: 52000 }), cau: undefined, trum: { coCau: true, giaoY: [1, 0, 2, 1], yCuaEm: [1], yDaChot: [true, false, false, false], qid: 'T1', tenDang: 'Ester', de: cauTrum, ...o } })
  it('chỉ ý CỦA EM có nút Đúng/Sai; ý của bạn chỉ hiện "đã chốt / đang nghĩ…"; chốt ý gửi đúng gói; 3 tín hiệu có sẵn, không có ô nhập chữ', async () => {
    const { call } = dung(trum())
    expect(await screen.findByText('ý thứ hai')).toBeTruthy(); expect(man().dataset.man).toBe('trum')
    const the = screen.getByLabelText('Câu chung cả đội')
    expect(screen.getAllByRole('button', { name: 'Đúng' })).toHaveLength(1); expect(the.querySelectorAll('em.dh-xong')).toHaveLength(1); expect(the.querySelectorAll('em.dh-nghi')).toHaveLength(2); expect(the.textContent).not.toMatch(/"dung"|nopY/)
    expect(screen.queryByRole('button', { name: 'Chốt' })).toBeNull(); fireEvent.click(screen.getByRole('button', { name: 'Sai' })); fireEvent.click(screen.getByRole('button', { name: 'Chốt' }))
    await waitFor(() => expect(call).toHaveBeenCalledWith('doan-nop-y', { ma: 'DH1', hiep: 4, y: 1, answer: 'S' }))
    expect(screen.getByRole('group', { name: 'Tín hiệu cho đồng đội' }).querySelectorAll('button')).toHaveLength(3); expect(man().querySelectorAll('input,textarea')).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'Cần bàn thêm' })); await waitFor(() => expect(call).toHaveBeenCalledWith('doan-tin-hieu', { ma: 'DH1', tinHieu: 'ban_them' }))
  })
  it('không có câu chung hợp lệ → nói THẬT, không giả vờ có câu', async () => {
    dung(trum({ coCau: false, qid: undefined, de: undefined }))
    expect(await screen.findByText(/Hiệp này không có câu chung phù hợp với cả đội/)).toBeTruthy(); expect(screen.queryByRole('button', { name: 'Đúng' })).toBeNull()
  })
})

describe('Đoàn Hộ Tống · giao diện · Tung chưởng và Kết chặng', () => {
  const kqGhe = { ghe: 0, nop: true, dung: true, tuLam: true, hanhDong: 'danh', tenChieu: 'Liệt Diễm Pháo', satThuong: 48, heSo: { dung: 1.5, lienKich: 2, anThach: 1 }, lienKich: true, chan: 0, hoi: 0, lan: 0, haGuc: 1, giup: 1, giupThanhCong: true, duocGiupBoi: null, nangLuongSau: 2, yGiu: [], yDung: [] }
  const vuaXong = { hiep: 3, laTrum: false, tongSatThuong: 96, tongChan: 8, quaiHaGuc: 2, quaiConLai: 1, linhTamMat: 0, linhTamHoi: 0, linhTamSau: 80, trum: null, cuaEm: kqGhe,
    ban: [{ ghe: 1, ra: 'don', tenChieu: 'Thuỷ Long Pháo', satThuong: 48, haGuc: 1, lienKich: true }, { ghe: 2, ra: 'chan', tenChieu: '', satThuong: 0, haGuc: 0, lienKich: false }] }
  const sauHiep = trongTran({ revision: 9, tran: tran({ hiep: 4, laTrum: true, moSauMs: 6000 }), cau: undefined, hiepVuaXong: vuaXong as never })
  it('cuối hiệp bật màn tung chưởng: tên chiêu, −96, HẠ GỤC, LIÊN KÍCH ×2, "vì sao đòn này mạnh" nối với việc học; KHÔNG có chữ nào nói bạn sai; một chạm là tắt', async () => {
    dung(sauHiep)
    const hop = await screen.findByRole('dialog', { name: 'Cả đội ra đòn' })
    expect(hop.textContent).toContain('LIỆT DIỄM PHÁO'); expect(hop.textContent).toContain('−96'); expect(hop.textContent).toContain('HẠ GỤC'); expect(hop.textContent).toContain('LIÊN KÍCH ×2')
    expect(hop.textContent).toContain('VÌ SAO ĐÒN NÀY MẠNH'); expect(hop.textContent).toContain('tự làm đúng'); expect(hop.textContent).toContain('sau khi em tiếp sức')
    expect(hop.textContent).not.toMatch(/\bsai\b|trượt|Nam/i) // bạn chắn (có thể vì sai) không bị nêu tên
    expect(hop.querySelectorAll('image[href*="/spells/"]').length).toBe(2) // tia chiêu thức THẬT của hai bạn ra đòn
    fireEvent.click(hop); expect(screen.queryByRole('dialog')).toBeNull() // tắt NGAY ở cú chạm, không phải nhờ hẹn giờ 3 giây
  })
  it('tự tắt sau ĐÚNG 3 giây (không hơn); bật "giảm hiệu ứng" của game thì màn mang lớp tĩnh', async () => {
    // Không chờ đồng hồ thật (máy tải nặng sẽ đỏ oan): bắt đúng cái hẹn giờ 3000 ms mà màn đặt ra, rồi tự bấm nó.
    const datHen = globalThis.setTimeout, hen: (() => void)[] = []
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((fn: () => void, ms?: number, ...a: unknown[]) => ms === 3000 ? (hen.push(fn), 0) : datHen(fn, ms, ...a)) as never)
    localStorage.setItem('game-v2-low', '1'); expect(GIAY_TUNG_CHUONG).toBeLessThanOrEqual(3)
    dung(sauHiep)
    const hop = await screen.findByRole('dialog'); expect(hop.className).toContain('dh-tinh'); expect(man().className).toContain('dh-tinh')
    expect(hen).toHaveLength(1); act(() => hen[0]!()); expect(screen.queryByRole('dialog')).toBeNull()
    vi.restoreAllMocks()
  })
  it('em làm SAI: bảng của em nói thần thú đã chắn + câu sẽ quay lại — không có "vì sao đòn này mạnh"', async () => {
    dung(trongTran({ revision: 9, tran: tran({ hiep: 4, laTrum: true, moSauMs: 6000 }), cau: undefined, hiepVuaXong: { ...vuaXong, tongSatThuong: 48, cuaEm: { ...kqGhe, dung: false, hanhDong: 'chan', satThuong: 0, lienKich: false, chan: 8, giup: null, giupThanhCong: false, heSo: { dung: 0, lienKich: 1, anThach: 1 } } } as never }))
    const hop = await screen.findByRole('dialog'); expect(hop.textContent).toContain('HIỆP NÀY CỦA EM'); expect(hop.textContent).toContain('chắn cho Linh Tâm'); expect(hop.textContent).toContain('quay lại'); expect(hop.textContent).not.toContain('VÌ SAO ĐÒN NÀY MẠNH')
    expect(hop.textContent).toContain('THU HÀ'); expect(hop.textContent).not.toMatch(/Nam/i); expect(hop.querySelectorAll('image[href*="/spells/"]').length).toBe(1) // chỉ bạn RA ĐÒN được nêu tên; bạn chắn (có thể vì sai) thì không
  })
  const ket = (tienBo: Record<string, unknown>, thang = true) => trongTran({ revision: 30, cau: undefined, tran: tran({ hiep: 8, laTrum: true, ketThuc: true, thang, quai: [] }),
    ketChang: { thang, sao: thang ? 3 : 0, linhTam: { hp: thang ? 84 : 0, toiDa: 100 }, trumVoGiap: [true, true], quaiHaGuc: 17, soLienKich: 1, cuaEm: { ghe: 0, id: 'x', laMay: false, soCau: 6, soDung: 5, soTuLamDung: 5, satThuong: 168, chan: 8, haGuc: 6, soLanGiup: 1, soLanGiupThanhCong: 1, soLanDuocGiup: 0, soLienKich: 1 },
      tienBo: { soCau: 6, tuLamDung: 5, lenBac: 2, giup: 1, giupThanhCong: 1, duocGiup: 0, ...tienBo } as never, ban: [] } })
  it('kết chặng: VƯỢT CHẶNG + 3 sao; bảng tiến bộ chỉ có số đo được, không chữ "nắm chắc"; nút chính về Bảng nhiệm vụ', async () => {
    const { onVe } = dung(ket({}))
    expect(await screen.findByText('VƯỢT CHẶNG!')).toBeTruthy(); expect(screen.getByRole('img', { name: '3 trên 3 sao' })).toBeTruthy(); expect(man().dataset.man).toBe('ket-chang')
    const bang = screen.getByLabelText('Hôm nay em tiến bộ gì'); expect(bang.textContent).toContain('tự làm đúng 5/6 câu'); expect(bang.textContent).toContain('2 câu lên bậc ôn'); expect(bang.textContent).toContain('tiếp sức 1 lần')
    expect(man().textContent).not.toMatch(/nắm chắc|giỏi|yếu kém|xếp loại/i)
    fireEvent.click(screen.getByRole('button', { name: 'VỀ BẢNG NHIỆM VỤ' })); expect(onVe).toHaveBeenCalledTimes(1)
  })
  it('máy chủ không đo được "lên bậc" (thiếu sổ) → dòng ấy KHÔNG hiện; thua thì nói rõ không mất gì', async () => {
    dung(ket({ lenBac: null }, false))
    expect(await screen.findByText('Linh Tâm cần nghỉ')).toBeTruthy(); expect(screen.getByText(/Thua không mất gì cả/)).toBeTruthy()
    expect(screen.getByLabelText('Hôm nay em tiến bộ gì').textContent).not.toContain('lên bậc')
  })
})

describe('Đoàn Hộ Tống · cửa vào', () => {
  it('Võ đài cũ chỉ mở thứ Bảy theo GIỜ VIỆT NAM', () => {
    expect(laThuBayVn(Date.parse('2026-09-19T12:00:00+07:00'))).toBe(true)  // thứ Bảy
    expect(laThuBayVn(Date.parse('2026-09-19T00:30:00+07:00'))).toBe(true)  // 00:30 thứ Bảy VN = 17:30 thứ Sáu UTC
    expect(laThuBayVn(Date.parse('2026-09-20T00:30:00+07:00'))).toBe(false) // 00:30 Chủ nhật VN = 17:30 thứ Bảy UTC
    expect(laThuBayVn(Date.parse('2026-09-21T09:00:00+07:00'))).toBe(false)
  })
})
