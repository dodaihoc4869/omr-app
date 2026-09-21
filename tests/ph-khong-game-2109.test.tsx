// THẦY LỆNH 21/09 (kèm ảnh Bảng nhiệm vụ phụ huynh): "App phụ huynh KHÔNG được hiện thần thú hay bất cứ gì liên quan tới game."
// Đề: prompt-ph-giao-them-bai-2109.md mục B. GIỮ: điểm, số câu, lên bậc, dạng con vấp, lịch ôn, bài tập về nhà, hạn nộp, "Vinh danh hôm nay".
// CHỐT CHẶN: dữ liệu ĐẦY game (thú, EXP, mảnh khiên, Đoàn, thử thách, cảnh báo/lời có chữ game, việc `than_thu`) đi vào MÀN PHỤ HUYNH ⇒ chữ HIỂN THỊ (nội dung + aria-label + title + alt)
// của cả cây không còn "thần thú|EXP|khiên|Đoàn|Đảo|Võ đài". Học sinh giữ nguyên (không quét).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, configure, fireEvent, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import BangNhiemVu from '../src/components/bang-nhiem-vu/BangNhiemVu'
import BangTinPhuHuynh from '../src/components/BangTinPhuHuynh'
import { boGameChoPhuHuynh, CHU_GAME_PH, khongChuGame, sachBoNaoChoPhuHuynh, TEN_VIEC_LUYEN_DANG_PH, type DuLieuBangNhiemVu, type TheNhiemVu } from '../src/lib/nhiem-vu-adapter'

configure({ asyncUtilTimeout: 8000 })
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
// Ảnh thú: nếu còn ai vẽ thì test thấy ngay (data-testid).
vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: () => <div data-testid="anh-thu" /> }))
vi.mock('../src/game/than-thu-v2/SpiritArt', () => ({ default: () => <div data-testid="anh-thu" /> }))

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
    thuThachRieng: null,
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
const BO_NAO_PH = { ngay: '2026-09-21', loiNhan: 'Hôm nay con ôn đều, thần thú của con lên cấp rồi.', thuTuan: 'Tuần này con tiến bộ ở dạng Thuỷ phân ester: từ Biết lên Hiểu.', tuanTu: '2026-09-14' }

function veBangPh(tuy: Record<string, unknown> = {}) {
  return render(
    <BangNhiemVu
      vaiTro="phuhuynh"
      hoTen="Đỗ Minh"
      now={NOW}
      duLieu={duLieuDayGame()}
      taiVinhDanh={VINH_DANH}
      boNaoPh={BO_NAO_PH}
      onLenDuongDoan={() => {}}
      onMoThanThu={() => {}}
      onDoiSbd={() => {}}
      {...(tuy as object)}
    />,
  )
}

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
    expect(d.thuThachRieng).toBeNull()
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

  it('sachBoNaoChoPhuHuynh: bỏ câu có chữ game; còn một trong hai (lời / thư) thì giữ thẻ; hết cả hai ⇒ null (không thẻ); null vào null ra', () => {
    expect(sachBoNaoChoPhuHuynh(BO_NAO_PH)).toEqual({ ...BO_NAO_PH, loiNhan: '' })
    expect(sachBoNaoChoPhuHuynh({ ...BO_NAO_PH, thuTuan: 'Con có 30 EXP' })).toBeNull() // lời có chữ game + thư có chữ game ⇒ hết cả hai ⇒ không thẻ
    expect(sachBoNaoChoPhuHuynh(null)).toBeNull()
    expect(sachBoNaoChoPhuHuynh(undefined)).toBeNull()
    const sach = { ...BO_NAO_PH, loiNhan: 'Con ôn đều 3 ngày liền.' }
    expect(sachBoNaoChoPhuHuynh(sach)).toEqual(sach)
  })
})

describe('CHỐT CHẶN — chữ hiển thị của MÀN PHỤ HUYNH không còn game', () => {
  it('Bảng nhiệm vụ phụ huynh với dữ liệu ĐẦY game: 0 chuỗi cấm trong nội dung + aria-label + title + alt; 0 ảnh thú; 0 khối EXP/Đoàn/chọn thú', async () => {
    const { container } = veBangPh()
    await screen.findByText('Bài tập về nhà · Chặng 2')
    // (Vinh danh KHÔNG còn ở app phụ huynh — một màn một nút, 21/09.)
    expect(chuHienThi(container)).not.toMatch(CAM)
    expect(screen.queryByTestId('anh-thu')).toBeNull()
    for (const vung of ['exp', 'exp-moi', 'doan-ho-tong', 'chon-than-thu']) expect(container.querySelector(`[data-vung="${vung}"]`), vung).toBeNull()
    expect(container.querySelector('.bnv-thu, .bnv-thu-vong, .bnv-thu-danh, .bnv-exp, .bnv-doan, .bnv-vd-thu')).toBeNull()
  })

  it('app phụ huynh một màn một nút (21/09): KHÔNG menu ba chấm; chân màn có "Đổi số báo danh", KHÔNG dòng số bản app (thầy lệnh 21/09 "Bỏ bản app"), không chữ game', async () => {
    const { container } = veBangPh()
    await screen.findByText('Bài tập về nhà · Chặng 2')
    expect(screen.queryByRole('button', { name: 'Mở menu' })).toBeNull()
    expect(container.querySelector('.bnv-menu')).toBeNull()
    const chan = container.querySelector('[data-vung="chan-ph"]') as HTMLElement
    expect(chan).toBeTruthy()
    expect(chuHienThi(chan)).not.toMatch(CAM)
    expect(chan.querySelector('.bnv-chan-ph-ban')).toBeNull()
    expect(chan.textContent).not.toMatch(/Bản app|Bản chạy thử/)
    expect(chan.textContent).toContain('Đổi số báo danh')
  })

  it('việc `than_thu` hiện là "Luyện dạng con còn vấp" kèm số câu; việc bài tập về nhà và hạn nộp GIỮ nguyên', async () => {
    const { container } = veBangPh()
    await screen.findByText('Bài tập về nhà · Chặng 2')
    expect(screen.getByText('Luyện dạng con còn vấp')).toBeTruthy()
    expect(container.textContent).toMatch(/6\s*câu/)
    expect(container.textContent).toContain('Chuỗi 5 ngày') // chuỗi ngày HỌC giữ (không phải chuỗi của game)
    expect(container.textContent).toContain('hạn nộp 12:00 trưa mai') // cảnh báo học tập giữ, cảnh báo có chữ game bị bỏ
    expect(container.textContent).not.toContain('sắp lên cấp')
  })

  it('"Vinh danh hôm nay" KHÔNG còn ở app phụ huynh (một màn một nút, 21/09) — học sinh vẫn có', async () => {
    const { container } = veBangPh()
    await screen.findByText('Bài tập về nhà · Chặng 2')
    await new Promise((r) => setTimeout(r, 200))
    expect(container.textContent).not.toMatch(/Vinh danh|Nguyễn M\.|9,5 điểm/)
    expect(container.querySelector('.bnv-vd, [data-vung="vinh-danh"]')).toBeNull()
  })

  it('lời Bộ não cho phụ huynh: câu nhắc thú/EXP bị bỏ, thư tuần không chữ game vẫn hiện', async () => {
    const { container } = veBangPh()
    await screen.findByText(/Thuỷ phân ester/)
    expect(container.textContent).toContain('Tuần này con tiến bộ ở dạng Thuỷ phân ester')
    expect(container.textContent).not.toContain('thần thú của con lên cấp')
  })

  it('CẢ khi màn cha quên gỡ dữ liệu: BangNhiemVu vai phụ huynh tự gỡ (một cửa duy nhất) — cùng dữ liệu, học sinh VẪN thấy game', async () => {
    const { container: ph } = veBangPh()
    await screen.findByText('Bài tập về nhà · Chặng 2')
    expect(chuHienThi(ph)).not.toMatch(CAM)
    cleanup()
    const hs = render(<BangNhiemVu vaiTro="hocsinh" hoTen="Đỗ Minh" now={NOW} duLieu={duLieuDayGame()} taiVinhDanh={VINH_DANH} onLenDuongDoan={() => {}} onMoThanThu={() => {}} />)
    await screen.findByText('Bài tập về nhà · Chặng 2')
    expect(chuHienThi(hs.container)).toMatch(/EXP/)
    expect(chuHienThi(hs.container)).toMatch(/thần thú/i)
    expect(hs.container.querySelector('[data-vung="exp"]')).toBeTruthy()
    expect(hs.container.querySelector('[data-vung="doan-ho-tong"]')).toBeTruthy()
  })

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
  const bang = doc('src/components/bang-nhiem-vu/BangNhiemVu.tsx')
  it('BangNhiemVu: gỡ dữ liệu một cửa + vùng EXP, "Vừa nhận EXP", chọn thú đều có `!laPh`', () => {
    expect(bang).toContain('const duLieu = useMemo(() => (laPh ? boGameChoPhuHuynh(duLieuGoc) : duLieuGoc), [laPh, duLieuGoc])')
    expect(bang).toContain('const boNaoPh = useMemo(() => (laPh ? sachBoNaoChoPhuHuynh(boNaoPhGoc) : boNaoPhGoc), [laPh, boNaoPhGoc])')
    expect(bang).toContain("const coBaoNhan = !dangTai && !laPh && khoaNhan !== '#'")
    expect(bang).toContain("const chuaChonThu = !dangTai && !laPh && duLieu.thanThu.kieu === 'chua_chon'")
    expect(bang).toContain('{duLieu.exp && !laPh && (')
    expect(bang).toContain('{!dangTai && !laPh && <TheVinhDanh') // Vinh danh chỉ ở học sinh (app PH một màn một nút, 21/09) — trước đây `hienThu={!laPh}`
  })
  it('DauTrang: phụ huynh không vẽ khối thần thú; TheVinhDanh có `hienThu`; BangTinPhuHuynh chỉ vẽ ô Thần thú khi có studentToken', () => {
    expect(doc('src/components/bang-nhiem-vu/DauTrang.tsx')).toContain('{laPh ? null : onMoThanThu && (co || chuaChon) ? (')
    expect(doc('src/components/bang-nhiem-vu/TheVinhDanh.tsx')).toContain('const pet = hienThu ? PETS.findIndex((p) => p.id === w.pet) : -1')
    expect(doc('src/components/BangTinPhuHuynh.tsx')).toMatch(/\{studentToken && \(\s*<button[^>]*\n\s*type="button"\s*\n\s*onClick=\{\(\) => onSelectTab\?\.\('thanthu'\)\}/)
  })
  it('màn phụ huynh (ParentPortalScreen) không nhắc game trong mã hiển thị của chính nó', () => {
    const ma = doc('src/screens/ParentPortalScreen.tsx').replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n')
    expect(ma).not.toMatch(/thần thú|khiên|Đoàn|Đảo|Võ đài|\bEXP\b/i)
  })
})
