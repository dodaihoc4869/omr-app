// GAME HÓA 2.0 · Đoàn Hộ Tống — màn KẾT CHẶNG mới (Moi-DoanThang): "PHỤC KÍCH ĐÃ BỊ PHÁ!", 3 sao, cầu gỗ.
// Cầu CHỈ hạ khi `hoa2-sanh` đọc lại SAU chặng báo `doan.con === 0`: thẻ "Cầu sang Bát Linh Đảo đã hạ · N câu đang chờ" + nút "QUA CẦU · KHÁM PHÁ ĐẢO".
// Còn câu ôn ⇒ cầu kéo lên, nút chính "PHÁ TIẾP". Sảnh 2.0: chặng câu ôn MIỄN VÉ; hết câu ôn thì Sảnh chỉ đường qua cầu.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor, configure } from '@testing-library/react'
vi.mock('../src/game/than-thu-v2/battle-audio', () => ({ unlockBattleAudio: vi.fn(), playBattleSound: vi.fn() }))
import DoanHoTong from '../src/game/than-thu-v2/DoanHoTong'
import DoanSanh from '../src/game/than-thu-v2/DoanSanh'
import type { DoanXem, SanhXem } from '../src/game/than-thu-v2/doan-kieu'

configure({ asyncUtilTimeout: 8000 })
beforeEach(() => { sessionStorage.clear(); localStorage.clear() })
afterEach(() => { cleanup() })

const ghe: DoanXem['ghe'] = [
  { ghe: 0, ten: 'Minh', pet: 2, cap: 32, laMay: false, roi: false, laEm: true, trangThai: 'da_chot', tinHieu: null },
  { ghe: 1, ten: 'Thu Hà', pet: 1, cap: 30, laMay: false, roi: false, laEm: false, trangThai: 'da_chot', tinHieu: null },
]
const ket = (thang = true): DoanXem => ({
  ma: 'DH9', revision: 30, laChu: true, batDau: true, ghe, gioMayChu: 0,
  tran: { tenChang: 'Đèo', hiep: 8, soHiep: 8, laTrum: true, ketThuc: true, thang, linhTam: { hp: thang ? 84 : 0, toiDa: 100 }, quai: [], trumVoGiap: [true, true], nangLuong: 0, daNhanTiepSuc: 0, giay: 40, moSauMs: 0, conMs: 0, tenQuai: ['a', 'b'], loaiQuai: ['bun_acid', 'bun_acid'], tenTrum: ['x', 'y'], loaiTrum: ['chua_te_ket_tua', 'ba_chu_an_mon'] },
  ketChang: { thang, sao: thang ? 3 : 0, linhTam: { hp: thang ? 84 : 0, toiDa: 100 }, trumVoGiap: [true, true], quaiHaGuc: 17, soLienKich: 2,
    cuaEm: { ghe: 0, id: 'x', laMay: false, soCau: 4, soDung: 3, soTuLamDung: 3, satThuong: 120, chan: 8, haGuc: 5, soLanGiup: 0, soLanGiupThanhCong: 0, soLanDuocGiup: 0, soLienKich: 1 } as never,
    tienBo: { soCau: 4, tuLamDung: 3, lenBac: null, giup: 0, giupThanhCong: 0, duocGiup: 0 }, ban: [],
    doanLop: { tramTruoc: 17, tramSau: 18, tongTram: 30, banThu: 10, siSo: 32, conTramToiMoc: null, tenMocKe: null, trumLop: null } },
})

function dung(x: DoanXem, con: number, dao = 28) {
  sessionStorage.setItem('doan:S1', x.ma)
  const call = vi.fn(async (lenh: string) => lenh === 'hoa2-sanh' ? { ok: true, cheDo2: true, doan: { con }, dao: { con: dao } } : lenh === 'doan-xem' ? { ok: true, doan: x } : lenh === 'doan-sanh' ? { ok: true, sanh: null, dangDo: null } : { ok: true })
  const onDong = vi.fn(), onRaDao = vi.fn(), onVe = vi.fn()
  render(<DoanHoTong call={call} sbd="S1" pet={2} cap={32} onDong={onDong} onVeBangNhiemVu={onVe} onRaDao={onRaDao} />)
  return { call, onDong, onRaDao, onVe }
}

describe('Đoàn 2.0 · kết chặng thắng', () => {
  it('hết câu ôn hôm nay (doan.con = 0): 3 sao, "PHỤC KÍCH ĐÃ BỊ PHÁ!", thẻ "Cầu sang Bát Linh Đảo đã hạ · 28 câu đang chờ khám phá", cầu HẠ; nút chính qua cầu, "Về bản đồ" về Đảo', async () => {
    const { onRaDao, onDong, onVe } = dung(ket(), 0)
    expect(await screen.findByText('PHỤC KÍCH ĐÃ BỊ PHÁ!')).toBeTruthy()
    const cau = await screen.findByLabelText('Cầu sang Bát Linh Đảo')
    expect(cau.textContent).toContain('Cầu sang Bát Linh Đảo đã hạ')
    expect(cau.textContent).toContain('28 câu đang chờ khám phá')
    expect(screen.getByRole('img', { name: '3 trên 3 sao' })).toBeTruthy()
    expect(document.querySelector('[data-cau="ha"]')).toBeTruthy()
    expect(screen.getByText('Linh Tâm về đích với Máu 84/100 · cả đội hạ 17 Tạp Chất · vỡ giáp 2 trùm')).toBeTruthy()
    expect(screen.getByLabelText('Linh Tâm của lớp').textContent).toContain('trạm 17 → 18/30')
    expect(screen.getByLabelText('Phần thưởng và tiến bộ').textContent).toContain('3/4câu ôn tự làm đúng')
    expect(document.body.textContent).not.toMatch(/mảnh khiên/) // máy chủ không gửi ⇒ không bịa
    fireEvent.click(screen.getByRole('button', { name: 'QUA CẦU · KHÁM PHÁ ĐẢO' })); expect(onRaDao).toHaveBeenCalledTimes(1)
    cleanup()
    const lan2 = dung(ket(), 0)
    fireEvent.click(await screen.findByRole('button', { name: 'Về bản đồ' })); expect(lan2.onDong).toHaveBeenCalledTimes(1)
    expect(onDong).not.toHaveBeenCalled(); expect(onVe).not.toHaveBeenCalled()
  })

  it('còn câu ôn (doan.con = 2): KHÔNG nói cầu đã hạ; cầu kéo lên; nút chính "PHÁ TIẾP · CÒN 2 Ổ PHỤC KÍCH" về Sảnh chặng câu ôn miễn phí', async () => {
    dung(ket(), 2)
    expect(await screen.findByText('Còn 2 ổ phục kích chặn cầu')).toBeTruthy()
    expect(screen.queryByText('Cầu sang Bát Linh Đảo đã hạ')).toBeNull()
    expect(document.querySelector('[data-cau="keo-len"]')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'PHÁ TIẾP · CÒN 2 Ổ PHỤC KÍCH' }))
    expect(await screen.findByText('CHUYẾN CÂU ÔN · MIỄN PHÍ')).toBeTruthy()
  })

  it('thua: "Linh Tâm cần nghỉ" + thua không mất gì; vẫn nói thật số ổ phục kích còn lại', async () => {
    dung(ket(false), 3)
    expect(await screen.findByText('Linh Tâm cần nghỉ')).toBeTruthy()
    expect(screen.getByText(/Thua không mất gì cả/)).toBeTruthy()
    expect(await screen.findByText('Còn 3 ổ phục kích chặn cầu')).toBeTruthy()
  })
})

const sanh = (sua: Partial<SanhXem> = {}): SanhXem => ({
  lop: '12A1', tenDoan: 'Đoàn Hộ Tống 12A1', mua: { so: 1, conNgay: 19 }, ve: 0, mienPhiHomNay: false,
  chuoi: { ngay: 5, daDiHomNay: false, mocKe: 7, conNgay: 2 },
  doanLop: { lop: '12A1', tram: 17, tongTram: 30, changThang: 3, changMoiTram: 4, conChangToiTramKe: 4, mocKe: 20, tenMocKe: 'Hồ Cân Bằng', conTramToiMoc: 3, gopSucHomNay: 9, siSo: 32 },
  trumLop: { dangMo: false, chuNhat: '2026-10-04', moSauMs: 4 * 24 * 3_600_000, conMs: 0, daGop: 0, mucTieu: 300, daHa: false }, quaMoi: [], ...sua,
})
const cb = () => ({ onLenDuong: vi.fn(), onMoPhong: vi.fn(), onVaoPhong: vi.fn(), onBatDau: vi.fn(), onRoi: vi.fn(), onDong: vi.fn(), onRaDao: vi.fn() })

describe('Đoàn 2.0 · Sảnh chặng câu ôn', () => {
  it('còn 4 ổ phục kích: "CHUYẾN CÂU ÔN · MIỄN PHÍ", hết vé cũng KHÔNG khoá LÊN ĐƯỜNG (máy chủ bỏ cổng vé), không hiện thẻ vé', () => {
    const p = cb()
    const { container } = render(<div className="dh dh2"><DoanSanh pet={0} cap={12} tenDoan="Đoàn Hộ Tống" goiY={null} sanh={sanh()} anThach={null} banDongHanh={null} phong={null} ban={false} loi="" hoa2={{ con: 4, daoCon: 28 }} {...p} /></div>)
    expect(screen.getByText('CHUYẾN CÂU ÔN · MIỄN PHÍ')).toBeTruthy()
    const di = container.querySelector('.dh-chang .dh-nut-vang') as HTMLButtonElement
    expect(di.disabled).toBe(false); expect(di.textContent).toBe('LÊN ĐƯỜNG')
    expect(container.querySelector('.dh-the-ve')).toBeNull()
    expect(container.querySelector('.dh-chang')!.textContent).toContain('còn 4 câu = 4 ổ phục kích')
    fireEvent.click(di); expect(p.onLenDuong).toHaveBeenCalledTimes(1)
  })
  it('hết câu ôn (con 0, đảo còn 28): lời máy chủ "đã phá hết ổ phục kích… Cầu sang Bát Linh Đảo đã hạ", nút chính QUA CẦU; Mở đoàn mới khoá + nói lý do', () => {
    const p = cb()
    const { container } = render(<DoanSanh pet={0} cap={12} tenDoan="Đoàn Hộ Tống" goiY={null} sanh={sanh()} anThach={null} banDongHanh={null} phong={null} ban={false} loi="" hoa2={{ con: 0, daoCon: 28 }} {...p} />)
    expect(container.querySelector('.dh-chang')!.textContent).toContain('Em đã phá hết ổ phục kích hôm nay. Cầu sang Bát Linh Đảo đã hạ')
    fireEvent.click(screen.getByRole('button', { name: 'QUA CẦU · KHÁM PHÁ ĐẢO' })); expect(p.onRaDao).toHaveBeenCalledTimes(1); expect(p.onLenDuong).not.toHaveBeenCalled()
    expect((screen.getByRole('button', { name: /Mở đoàn mới/ }) as HTMLButtonElement).disabled).toBe(true)
  })
})
