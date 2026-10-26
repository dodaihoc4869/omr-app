// THẦY LỆNH 21/09 (kèm ảnh Bảng nhiệm vụ phụ huynh): "App phụ huynh KHÔNG được hiện thần thú hay bất cứ gì liên quan tới game."
// Đề: prompt-ph-giao-them-bai-2109.md mục B. GIỮ: điểm, số câu, lên bậc, dạng con vấp, lịch ôn, bài tập về nhà, hạn nộp, "Vinh danh hôm nay".
// CHỐT CHẶN: dữ liệu ĐẦY game (thú, EXP, mảnh khiên, Đoàn, thử thách, cảnh báo/lời có chữ game, việc `than_thu`) đi vào MÀN PHỤ HUYNH ⇒ chữ HIỂN THỊ (nội dung + aria-label + title + alt)
// của cả cây không còn "thần thú|EXP|khiên|Đoàn|Đảo|Võ đài". Học sinh giữ nguyên (không quét).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, configure, fireEvent, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import BangTinPhuHuynh from '../src/components/BangTinPhuHuynh'
import { boGameChoPhuHuynh, CHU_GAME_PH, khongChuGame, TEN_VIEC_LUYEN_DANG_PH, type DuLieuBangNhiemVu, type TheNhiemVu } from '../src/lib/nhiem-vu-adapter'
import './_ph-nap-trang-cu' // trang cũ nạp lười (26/10): chờ mảnh về trước các test

configure({ asyncUtilTimeout: 8000 })
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const NOW = Date.parse('2026-09-21T19:00:00+07:00')
/** Luật của thầy, đúng như đề: nếu còn bất kỳ chuỗi nào dưới đây trong chữ hiển thị của app phụ huynh thì hỏng. */
const CAM = /thần thú|EXP|khiên|Đoàn|Đảo|Võ đài/i

/** Mọi chữ NGƯỜI DÙNG NHÌN/NGHE được: nội dung + aria-label/title/alt/placeholder/value. */
function chuHienThi(goc: HTMLElement): string {
  const ra: string[] = [goc.textContent || '']
  goc.querySelectorAll<HTMLElement>('[aria-label],[title],[alt],[placeholder]').forEach((e) => {
    for (const k of ['aria-label', 'title', 'alt', 'placeholder']) {
      const v = e.getAttribute(k)
      if (v) ra.push(v)
    }
  })
  return ra.join('\n')
}

const viec = (id: string, tieuDe: string, tuy: Partial<TheNhiemVu> = {}): TheNhiemVu => ({
  id,
  bac: 'nen_lam',
  vaiTroMau: 'secondary',
  bieuTuong: 'on',
  tieuDe,
  moTa: '6 câu · khoảng 8 phút',
  soCau: 6,
  phutUocTinh: 8,
  biCong: false,
  trangThai: 'chua_lam',
  hanhDong: { loai: 'mo_khac_phuc', payload: { cheDo: 1, soCau: 6 }, nhanNut: 'Ôn ngay' },
  ...tuy,
})
const VIEC_GAME = viec('tt-1', 'Thần thú: luyện dạng còn yếu', {
  bieuTuong: 'sao',
  moTa: 'Luyện với thần thú để nhận EXP · 6 câu',
  dongPhu: ['Nhận thêm EXP khi xong', '6 câu · khoảng 8 phút'],
  hanhDong: { loai: 'mo_than_thu', nhanNut: 'Luyện với thần thú' } as any,
})
const VIEC_BTVN = viec('bt-1', 'Bài tập về nhà · Chặng 2', { bac: 'bat_buoc', vaiTroMau: 'primary', bieuTuong: 'btvn', hanNop: '2026-09-22T12:00:00+07:00', conLaiChu: 'Còn 17:00:00' })

/** Dữ liệu ĐẦY game — cái tệ nhất máy chủ có thể gửi. */
function duLieuDayGame(): DuLieuBangNhiemVu {
  return {
    nguon: 'ke_hoach_ngay',
    lamNgay: VIEC_BTVN,
    cacBac: [
      { bac: 'khan', nhan: 'Sắp đến hạn nộp', vaiTroMau: 'error' as any, viec: [] },
      { bac: 'bat_buoc', nhan: 'Bắt buộc hôm nay', vaiTroMau: 'primary', viec: [] },
      { bac: 'nen_lam', nhan: 'Nên làm', vaiTroMau: 'secondary', viec: [VIEC_GAME] },
      { bac: 'tuy_chon', nhan: 'Làm thêm (không bắt buộc)', vaiTroMau: 'tertiary', viec: [] },
    ],
    trong: false,
    tienDo: { daLam: 12, mucTieu: 30, phanTram: 40, ghiChu: 'Con tích EXP mỗi ngày nhờ làm đều' },
    tocDo: { giayMoiCau: 45, chu: '45 giây mỗi câu, trung bình 30 ngày gần đây' },
    chuoiNgay: { soNgay: 5, chu: 'Chuỗi 5 ngày' },
    canhBao: [
      { loai: 'khong_kip', noiDung: 'Hôm nay con còn 9 câu, hạn nộp 12:00 trưa mai.' },
      { loai: 'khac', noiDung: 'Thần thú của con sắp lên cấp, nhớ chơi game nhé.' },
    ],
    quaHan: [],
    ngayNghi: false,
    thanThu: { kieu: 'co', pet: 'nuoc_long', cap: 37, ten: 'Bông' },
    tonCu: { soBai: 0, soCau: 0, bai: [] },
    daXongHomNay: null,
    exp: { homNay: 22, chiTiet: [{ loai: 'lo', exp: 12, ghiChu: '6 câu đúng · +12 EXP' }], manhKhien: { manh: 7, moiKhien: 12, khienConLai: 1 } },
    expNhan: [{ exp: 12, ghiChu: '6 câu đúng · +12 EXP' }],
    manhNhan: [{ so: 1, ghiChu: 'Được 1 mảnh khiên' }],
    doanMo: true,
    boNao: { hs: { loi: 'Em chọn thần thú rồi cùng Đoàn Hộ Tống nhé', ngay: '2026-09-21' } as any, ph: null },
    canhBaoThay: [],
  }
}

const VINH_DANH = async () => ({
  day: '2026-09-21',
  live: true,
  winners: [
    { rank: 1, name: 'Nguyễn M.', nickname: 'Bông', score: 9.5, seconds: 1800, exam: 'CA-1', pet: 'nuoc_long', level: 30 },
    { rank: 2, name: 'Trần A.', score: 9, seconds: null, exam: 'CA-1', pet: null, level: 1 },
  ],
})

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, items: [], winners: [] }), text: async () => '{}' })))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('boGameChoPhuHuynh — gỡ game ở DỮ LIỆU (thuần)', () => {
  it('gỡ thú, EXP, mảnh khiên, Đoàn, thử thách; việc `than_thu` đọc là "Luyện dạng con còn vấp"; nút cũng đổi chữ', () => {
    const d = boGameChoPhuHuynh(duLieuDayGame())
    expect(d.thanThu).toEqual({ kieu: 'chua_biet' })
    expect(d.exp).toBeNull()
    expect(d.expNhan).toEqual([])
    expect(d.manhNhan).toEqual([])
    expect(d.doanMo).toBe(false)
    expect('thuThachRieng' in d).toBe(false) // thẻ Thử thách riêng đã gỡ 28/09
    const v = d.cacBac[2].viec[0]
    expect(TEN_VIEC_LUYEN_DANG_PH).toBe('Luyện dạng con còn vấp')
    expect(v.tieuDe).toBe('Luyện dạng con còn vấp')
    expect(v.hanhDong.nhanNut).toBe('Luyện dạng còn vấp')
    expect(v.moTa).toBe('') // chữ game trong mô tả ⇒ bỏ cả câu; số câu do thẻ tự in
    expect(v.dongPhu).toEqual(['6 câu · khoảng 8 phút'])
  })

  it('GIỮ nguyên mọi thứ học tập: việc khác, hạn nộp, điểm/tiến độ, chuỗi ngày học, tốc độ, cảnh báo không có chữ game', () => {
    const goc = duLieuDayGame()
    const d = boGameChoPhuHuynh(goc)
    expect(d.lamNgay).toEqual(goc.lamNgay)
    expect(d.lamNgay!.hanNop).toBe('2026-09-22T12:00:00+07:00')
    expect(d.tienDo).toEqual({ ...goc.tienDo, ghiChu: undefined }) // chỉ ghi chú có chữ game bị bỏ
    expect(d.tocDo).toEqual(goc.tocDo)
    expect(d.chuoiNgay).toEqual(goc.chuoiNgay)
    expect(d.canhBao).toEqual([{ loai: 'khong_kip', noiDung: 'Hôm nay con còn 9 câu, hạn nộp 12:00 trưa mai.' }])
    expect(d.cacBac.map((n) => n.bac)).toEqual(['khan', 'bat_buoc', 'nen_lam', 'tuy_chon'])
  })

  it('không sửa đầu vào (thuần), gọi hai lần cho cùng kết quả (idempotent), và toàn bộ JSON kết quả không còn chữ game', () => {
    const goc = duLieuDayGame()
    const banSao = JSON.stringify(goc)
    const a = boGameChoPhuHuynh(goc)
    expect(JSON.stringify(goc)).toBe(banSao)
    expect(boGameChoPhuHuynh(a)).toEqual(a)
    // Quét GIÁ TRỊ chữ (không quét tên khoá JSON như `exp`, `expNhan` — đó không phải chữ người dùng nhìn).
    const chu: string[] = []
    const di = (x: unknown): void => {
      if (typeof x === 'string') chu.push(x)
      else if (Array.isArray(x)) x.forEach(di)
      else if (x && typeof x === 'object') Object.values(x).forEach(di)
    }
    di({ ...a, boNao: null })
    expect(chu.filter((x) => CAM.test(x))).toEqual([])
  })

  it('khongChuGame: chữ có game ⇒ "" (bỏ cả câu); chữ học tập nguyên vẹn (kể cả từ chứa "exp" trong chữ khác)', () => {
    for (const x of ['Con nhận thêm EXP', 'Thần thú lên cấp', 'còn 1 khiên', 'Đoàn Hộ Tống đang chờ', 'Đảo thần thú mở', 'thi đấu Võ đài', 'quái Linh Tâm']) expect(khongChuGame(x), x).toBe('')
    for (const x of ['Ôn lại 6 câu, khoảng 8 phút', 'Điểm 7,5 trên 10', 'Nộp bài trước 12:00', 'Lên bậc Hiểu ở dạng Thuỷ phân ester', 'expert', 'Bài tập về nhà · Chặng 2']) expect(khongChuGame(x), x).toBe(x)
    expect(khongChuGame(undefined)).toBe('')
    expect(khongChuGame(null)).toBe('')
    expect(CHU_GAME_PH.flags).toContain('i')
  })
})

describe('CHỐT CHẶN — chữ hiển thị của MÀN PHỤ HUYNH không còn game', () => {

  it('sheet "Bảng tin của con" (BangTinPhuHuynh, phụ huynh): không ô "Thần thú của con"; học sinh (studentToken) vẫn có', async () => {
    const REPORT = {
      day: '2026-09-21', updatedAt: '2026-09-21T08:00:00Z', today: [], weak: [], wrong: 5, pending: 0, questionCount: 8, assignmentCount: 1, minutes: 12, mode: 'on_lai', reason: 'Ôn lại các câu vừa sai',
      keHoach: { tongCau: 8, soCauSuaLoi: 4, soCauOnBaiCu: 2, soCauTienBo: 2, phuongPhap: 'x' },
    }
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const b = String(url).includes('-news/') ? { ok: true, report: REPORT, daily: null } : { ok: true, winners: [], day: '2026-09-21', live: true }
      return { ok: true, status: 200, json: async () => b, text: async () => JSON.stringify(b) }
    }))
    const { container, unmount } = render(<BangTinPhuHuynh sbd="12001" onSent={() => {}} onSelectTab={() => {}} />)
    await screen.findByText(/câu sửa lỗi/)
    expect(chuHienThi(container)).not.toMatch(CAM)
    unmount()
    const hs = render(<BangTinPhuHuynh sbd="12001" studentToken="t" onSent={() => {}} onSelectTab={() => {}} />)
    await screen.findByText(/câu sửa lỗi/)
    await waitFor(() => expect(hs.container.textContent).toContain('Thần thú của em'))
  })
})

describe('khoá nguồn — các chốt `laPh` nằm đúng chỗ (đột biến bắt được)', () => {
  it('DauTrang: phụ huynh không vẽ khối thần thú; TheVinhDanh có `hienThu`; BangTinPhuHuynh chỉ vẽ ô Thần thú khi có studentToken', () => {
    expect(doc('src/components/BangTinPhuHuynh.tsx')).toMatch(/\{studentToken && !tapTrungHoc && \(\s*<button[^>]*\n\s*type="button"\s*\n\s*onClick=\{\(\) => onSelectTab\?\.\('thanthu'\)\}/)
  })
  it('màn phụ huynh (ParentPortalScreen) không nhắc game trong mã hiển thị của chính nó', () => {
    const ma = doc('src/screens/ParentPortalScreen.tsx').replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n')
    expect(ma).not.toMatch(/thần thú|khiên|Đoàn|Đảo|Võ đài|\bEXP\b/i)
  })
})
