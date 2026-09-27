// GAME HÓA 2.0 · Đoàn Hộ Tống — CỜ TẮT GIỮ GIAO DIỆN CŨ: `hoa2-sanh` trả `cheDo2:false` (cờ tắt) hoặc máy chủ cũ chưa có lệnh (lỗi)
// ⇒ không lớp dh2, không HUD/cảnh/thẻ thắng mới, không dải bùa, không gạch phương án, luật vé cũ vẫn khoá như trước.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor, configure } from '@testing-library/react'
vi.mock('../src/components/KhoiCauSai', () => ({ LoiGiaiCauSai: () => <p>Lời giải từ kho</p> }))
vi.mock('../src/game/than-thu-v2/battle-audio', () => ({ unlockBattleAudio: vi.fn(), playBattleSound: vi.fn() }))
import DoanHoTong from '../src/game/than-thu-v2/DoanHoTong'
import type { DoanXem } from '../src/game/than-thu-v2/doan-kieu'

configure({ asyncUtilTimeout: 8000 })
beforeEach(() => { sessionStorage.clear(); localStorage.clear() })
afterEach(() => { cleanup() })

const ghe: DoanXem['ghe'] = [
  { ghe: 0, ten: 'Minh', pet: 2, cap: 32, laMay: false, roi: false, laEm: true, trangThai: 'dang_lam', tinHieu: null },
  { ghe: 1, ten: 'Thu Hà', pet: 1, cap: 30, laMay: false, roi: false, laEm: false, trangThai: 'da_chot', tinHieu: null },
]
const tran = (o: Record<string, unknown> = {}) => ({ tenChang: 'Vượt Đầm Bùn Acid', hiep: 3, soHiep: 8, laTrum: false, ketThuc: false, thang: null, linhTam: { hp: 80, toiDa: 100 }, quai: [{ ma: 5, loai: 'bun_acid', hp: 9 }], trumVoGiap: [],
  nangLuong: 1, daNhanTiepSuc: 0, giay: 40, moSauMs: 0, conMs: 27000, tenQuai: ['Bùn Acid', 'Khói Oxi Hoá'], loaiQuai: ['bun_acid', 'khoi_oxi_hoa'], tenTrum: ['Chúa tể Kết Tủa', 'Bá chủ Ăn Mòn'], loaiTrum: ['chua_te_ket_tua', 'ba_chu_an_mon'], ...o }) as DoanXem['tran']
const de = { qid: 'Q1', maDe: 'D', version: 'v', group: 'g', phan: 'I' as const, text: 'Thuỷ phân ethyl acetate thu được', choices: ['phương án một', 'phương án hai', 'phương án ba', 'phương án bốn'], ideas: [], hinhAnh: [], dang: 'ES', tenDang: 'Ester', mucDo: 'hieu', sao: 2, kienThuc: [] }
// Cố ý để `goiY` lọt vào gói (máy chủ lẽ ra không gửi khi cờ tắt): giao diện cũ vẫn phải BỎ QUA nó.
const trongTran = (): DoanXem => ({ ma: 'DH1', revision: 5, laChu: true, batDau: true, ghe, gioMayChu: 0, tran: tran(), cau: { qid: 'Q1', nhan: 'toi_han_on', de, goiY: { gach: ['A', 'D'] } } as DoanXem['cau'] })
const ketChang = (): DoanXem => ({ ...trongTran(), revision: 30, cau: undefined, tran: tran({ hiep: 8, laTrum: true, ketThuc: true, thang: true, quai: [] }),
  ketChang: { thang: true, sao: 3, linhTam: { hp: 84, toiDa: 100 }, trumVoGiap: [true, true], quaiHaGuc: 17, soLienKich: 1, cuaEm: { ghe: 0, soLanGiup: 0, soLanGiupThanhCong: 0 } as never,
    tienBo: { soCau: 6, tuLamDung: 5, lenBac: 2, giup: 0, giupThanhCong: 0, duocGiup: 0 }, ban: [] } })

type Hoa2 = 'tat' | 'loi'
function dung(xem: DoanXem | null, hoa2: Hoa2, tra: (lenh: string) => unknown = () => ({ ok: true, doan: xem })) {
  if (xem) sessionStorage.setItem('doan:S1', xem.ma)
  const call = vi.fn(async (lenh: string) => lenh === 'hoa2-sanh' ? (hoa2 === 'tat' ? { ok: true, cheDo2: false } : Promise.reject(new Error('Lệnh không hợp lệ.')))
    : lenh === 'recommendations' ? { ok: true, suggestions: [{ title: 'Ester' }] } : lenh === 'doan-xem' ? (xem ? { ok: true, doan: xem } : Promise.reject(new Error('x'))) : tra(lenh))
  const onVe = vi.fn()
  render(<DoanHoTong call={call} sbd="S1" pet={2} cap={32} onDong={vi.fn()} onVeBangNhiemVu={onVe} />)
  return { call, onVe }
}
const man = () => document.querySelector('.dh') as HTMLElement

describe('Đoàn · cờ Game Hóa 2.0 TẮT ⇒ giao diện cũ y nguyên', () => {
  for (const hoa2 of ['tat', 'loi'] as const) {
    it(`trong trận (${hoa2 === 'tat' ? 'cheDo2:false' : 'máy chủ cũ báo lỗi'}): nhãn "CÂU CỦA EM", vạch hiệp cũ, dải đồng đội cũ, không bùa, không gạch, nút chốt chữ cũ`, async () => {
      const { call } = dung(trongTran(), hoa2)
      await screen.findByText('phương án hai')
      await waitFor(() => expect(call).toHaveBeenCalledWith('hoa2-sanh'))
      await new Promise(r => setTimeout(r, 20))
      expect(man().className).not.toContain('dh2'); expect(man().dataset.cheDo).toBeUndefined()
      expect(screen.getByText('CÂU CỦA EM')).toBeTruthy(); expect(screen.queryByText('CÂU ÔN CỦA EM')).toBeNull()
      expect(document.querySelectorAll('.dh-vach i')).toHaveLength(8); expect(document.querySelector('.dh2-vach')).toBeNull(); expect(document.querySelector('[data-vung="canh-2"]')).toBeNull()
      expect(screen.getByLabelText('Đồng đội').textContent).toBe('Emđang làmThu Hàđã chốt')
      expect(document.querySelector('[data-vung="bua-tro-giang"]')).toBeNull(); expect(document.querySelector('.dh2-chay')).toBeNull()
      const a = screen.getByRole('button', { name: /phương án một/ }) as HTMLButtonElement
      expect(a.disabled).toBe(false)
      fireEvent.click(a)
      expect(screen.getByRole('button', { name: /Chốt đòn · A \+ Đánh/ })).toBeTruthy()
    })
  }

  it('kết chặng cũ: "HOÀN THÀNH CHUYẾN!" + "VỀ BẢNG NHIỆM VỤ"; không có thẻ cầu / "PHỤC KÍCH ĐÃ BỊ PHÁ!"', async () => {
    const { onVe } = dung(ketChang(), 'tat')
    expect(await screen.findByText('HOÀN THÀNH CHUYẾN!')).toBeTruthy()
    expect(screen.queryByText('PHỤC KÍCH ĐÃ BỊ PHÁ!')).toBeNull(); expect(document.querySelector('[data-vung="ket-chang-2"]')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'VỀ BẢNG NHIỆM VỤ' })); expect(onVe).toHaveBeenCalledTimes(1)
  })

  it('Sảnh cũ: hết vé vẫn khoá LÊN ĐƯỜNG như trước (luật vé cũ không bị 2.0 nới), nhãn "CHUYẾN THÊM · 1 VÉ"', async () => {
    dung(null, 'tat', lenh => lenh === 'doan-sanh' ? { ok: true, sanh: { lop: '12A1', tenDoan: 'Đoàn Hộ Tống', mua: { so: 1, conNgay: 9 }, ve: 0, mienPhiHomNay: false, chuoi: { ngay: 0, daDiHomNay: false, mocKe: 7, conNgay: 7 },
      doanLop: { lop: '12A1', tram: 3, tongTram: 30, changThang: 0, changMoiTram: 4, conChangToiTramKe: 4, mocKe: 5, tenMocKe: 'Cổng', conTramToiMoc: 2, gopSucHomNay: 1, siSo: 30 },
      trumLop: { dangMo: false, chuNhat: '', moSauMs: 3_600_000, conMs: 0, daGop: 0, mucTieu: 300, daHa: false }, quaMoi: [] }, dangDo: null } : { ok: true })
    expect(await screen.findByText('CHUYẾN THÊM · 1 VÉ')).toBeTruthy()
    const di = document.querySelector('.dh-chang .dh-nut-vang') as HTMLButtonElement
    expect(di.disabled).toBe(true); expect(di.textContent).toBe('HẾT VÉ HÔM NAY')
    expect(screen.queryByText('CHUYẾN CÂU ÔN · MIỄN PHÍ')).toBeNull()
  })
})
