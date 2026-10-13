// Cửa vào game "Đoàn Hộ Tống" trên Bảng nhiệm vụ (Boss giao 21/09; hợp đồng docs/hop-dong-mo-game-doan-ho-tong-1909.md).
// Thẻ "Lên đường cùng Đoàn Hộ Tống" CHỈ hiện khi: học sinh + máy chủ báo `doanMo === true` (gốc /hs/ke-hoach-ngay) + có hàm mở.
// Bấm ⇒ đặt sessionStorage['game-v2:man-dau']='doan' rồi mở tab game; nút "Về app học sinh" của game về ĐÚNG Bảng nhiệm vụ (không phải sheet điểm).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import StudentPortalScreen from '../src/screens/StudentPortalScreen'
import { dongGoiBanNho, phucHoiBanNho, tuKeHoachNgay } from '../src/lib/nhiem-vu-adapter'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/components/BangVinhDanh', () => ({ default: () => null }))
vi.mock('../src/components/BangTinPhuHuynh', () => ({ default: () => null }))
vi.mock('../src/components/ThongBaoHocSinh', () => ({ default: () => null, noticeApi: vi.fn() }))
vi.mock('../src/game/than-thu-v2/academic-sync', () => ({ syncStudentExp: async () => {} }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrlHoacMacDinh: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({
  ...(await original<any>()),
  hsLichSuCaApi: async () => ({ ok: true, items: [] }),
  hsBtvnApi: async () => ({ ok: true, items: [] }),
  thanThuDocApi: async () => ({ ok: true, hoSo: {} }),
}))
vi.mock('../src/lib/mom-api', async (original) => ({ ...(await original<any>()), momApi: async () => ({ ok: true, items: [] }) }))

const NOW = Date.now()
const gio = (h: number) => new Date(NOW + h * 3600_000).toISOString()
const VIEC = { id: 'on_lai:2026-09-19', loai: 'on_lai', soCau: 3, thuTu: 1, batBuoc: false, khan: false, cong: null, hien: true, nhan: 'bu', trangThai: 'cho', ghiChu: 'Ôn 3 câu đã tới hạn nhắc lại', chiTiet: { qid: ['a', 'b', 'c'] } }
const KE_HOACH: any = {
  ok: true,
  ngay: '2026-09-19',
  nganSach: { mucTieuCau: 12, toiThieuCau: 6, vanTocGiay: 78, vanTocNguon: 'do', ghiChuVanToc: '' },
  viec: [VIEC],
  canhBao: [],
  quaHan: [],
  tienBo: { daLamCau: 2, lenBac: 1, tutBac: 0, dat: false, toiThieuCau: 6, conThieu: 4 },
  chuoiDat: 0,
  lanNghi: false,
  capNhatLuc: gio(-0.1),
  thanThu: { pet: 'lua_phuong', cap: 12, nickname: 'Hoả Long' },
}
const VIEC2 = { id: 'than_thu:X', loai: 'than_thu', soCau: 6, thuTu: 2, batBuoc: false, khan: false, cong: null, hien: true, nhan: 'tuy_chon', trangThai: 'cho', ghiChu: 'Luyện dạng còn yếu với thần thú', chiTiet: { dang: 'X' } }
const duLieu = (rieng: any = {}) => tuKeHoachNgay({ ...KE_HOACH, ...rieng }, NOW, {})
const CARD = () => document.querySelector('[data-vung="doan-ho-tong"]') as HTMLElement | null

describe('adapter: doanMo đọc CHẶT', () => {
  it('chỉ `true` (boolean) ⇒ doanMo true; vắng/false/"true"/1/{} ⇒ không', () => {
    expect(duLieu({ doanMo: true }).doanMo).toBe(true)
    for (const x of [undefined, false, 'true', 1, {}, null, 'yes']) expect(duLieu({ doanMo: x }).doanMo, String(x)).toBe(false)
  })

  it('bản nhớ: đóng gói rồi phục hồi (qua JSON như localStorage) giữ đúng cờ; bản nhớ hỏng (doanMo kiểu lạ) ⇒ false', () => {
    const d = duLieu({ doanMo: true })
    const b = dongGoiBanNho(d, NOW)!
    expect(b.duLieu.doanMo).toBe(true)
    const qua = JSON.parse(JSON.stringify(b.duLieu))
    expect(phucHoiBanNho({ ...b, duLieu: qua }, NOW)!.doanMo).toBe(true)
    expect(phucHoiBanNho({ ...b, duLieu: { ...qua, doanMo: 'yes' } }, NOW)!.doanMo).toBe(false)
    expect(phucHoiBanNho({ ...b, duLieu: { ...qua, doanMo: undefined } }, NOW)!.doanMo).toBe(false)
  })
})

describe('thẻ mời trên Bảng nhiệm vụ', () => {
  afterEach(() => cleanup())
})



describe('CSS thẻ Đoàn', () => {
})

// 10/10: Đoàn là nguồn ôn trong kế hoạch, không còn cửa game ở cổng.
it('bản nhớ màn Đoàn cũ không mở game trong cổng học tập',async()=>{localStorage.setItem('omr_student_portal_auth',JSON.stringify({sbd:'test',hoTen:'Em thử',token:'test-token'}));sessionStorage.setItem('game-v2:man-dau','doan');render(<StudentPortalScreen/>);expect(await screen.findByRole('button',{name:'Của em'})).toBeTruthy();expect(screen.queryByRole('button',{name:'Lên đường cùng Đoàn Hộ Tống'})).toBeNull();expect(screen.queryByTestId('game')).toBeNull()})
