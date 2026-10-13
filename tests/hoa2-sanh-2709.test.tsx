// GAME HÓA 2.0 — Sảnh bản đồ Bát Linh (src/components/hoa2/SanhBanDo.tsx), nối vào StudentPortalScreen thật, và app phụ huynh đã ngừng.
// Hợp đồng: docs/hop-dong-game-hoa-2.md · bản vẽ: docs/ban-ve-game-hoa-2-2709/Moi-SanhBanDo.dc.html, HS-HuyetChien, HS-XongHomNay.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { docNhoKetQuaSanh, docSanh, ghiNhoKetQuaSanh, type KetQuaSanh } from '../src/components/hoa2/api'
import { chuHanNop, thuNgayThang } from '../src/components/hoa2/thoi-gian'
import StudentPortalScreen from '../src/screens/StudentPortalScreen'

const mocks = vi.hoisted(() => ({ items: [] as any[], momItems: [] as any[] }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/components/ThongBaoHocSinh', () => ({ default: () => null, noticeApi: vi.fn() }))
vi.mock('../src/game/than-thu-v2/academic-sync', () => ({ syncStudentExp: async () => {} }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrlHoacMacDinh: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({
  ...(await original<any>()),
  hsLichSuCaApi: () => Promise.resolve({ ok: true, items: [] }),
  hsBtvnApi: async () => ({ ok: true, items: mocks.items }),
  thanThuDocApi: async () => ({ ok: true, hoSo: {} }),
}))
vi.mock('../src/lib/mom-api', async (original) => ({ ...(await original<any>()), momApi: async () => ({ ok: true, items: mocks.momItems }) }))

// 14:00 Thứ Tư 30/09/2026 giờ Việt Nam
const NOW = Date.UTC(2026, 8, 30, 7, 0, 0)

const SANH = {
  ok: true,
  cheDo2: true,
  ngay: '2026-09-30',
  chienDich: { id: 'cd1', ten: 'Ester – Lipid', hanNop: '2026-10-04', D: 5, tong: 120, coXat: 67, thanhThao: 0, canDayLai: 0, thanhThaoTangTu: '2026-10-02' },
  theLuc: { con: 32, tong: 40 },
  huyetChien: false,
  doan: { con: 4 },
  dao: { con: 28 },
  khoaDao: true,
  loiKhoaDao: 'Có xe hàng đang bị phục kích, hãy hoàn thành Hộ Tống trước khi ra Đảo nhé!',
  ruong: { daLam: 8, tong: 40, moDuoc: false, daMo: false },
}

type Tra = { status?: number; body?: any; nem?: boolean }
let cuocGoi: { url: string; body: any }[] = []
let tra: Record<string, Tra> = {}
function giaLapFetch() {
  cuocGoi = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: any) => {
      let body: any = {}
      try {
        body = JSON.parse(init?.body || '{}')
      } catch {}
      cuocGoi.push({ url: String(url), body })
      const r = tra[new URL(String(url)).pathname]
      if (r?.nem) throw new Error('mất mạng')
      const status = r?.status ?? 200
      return { ok: status >= 200 && status < 300, status, json: async () => r?.body ?? { ok: true, items: [] } }
    }),
  )
}
const goiTheo = (duong: string) => cuocGoi.filter((c) => new URL(c.url).pathname === duong)

beforeEach(() => {
  tra = {}
  giaLapFetch()
})
afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('ngày giờ hạn nộp (luật 6 bảng từ chuẩn)', () => {
  it('"còn X ngày Y giờ (tới 23:59 Thứ … dd/mm)", giờ Việt Nam; đã qua ⇒ "đã hết hạn"', () => {
    expect(thuNgayThang('2026-09-24')).toBe('Thứ Năm 24/09')
    expect(chuHanNop('2026-10-04', NOW)).toBe('còn 4 ngày 9 giờ (tới 23:59 Chủ Nhật 04/10)')
    expect(chuHanNop('2026-09-30', NOW)).toBe('còn 9 giờ (tới 23:59 Thứ Tư 30/09)')
    expect(chuHanNop('2026-09-29', NOW)).toBe('đã hết hạn (23:59 Thứ Ba 29/09)')
  })
  it('docSanh đọc chặt: cờ tắt ⇒ cheDo2 false; thiếu Thể lực ⇒ null (không bịa số)', () => {
    expect(docSanh({ ok: true, cheDo2: false })).toEqual({ cheDo2: false })
    expect(docSanh({ ok: true, cheDo2: true, canChonThu: true })).toEqual({ cheDo2: true, canChonThu: true })
    expect(docSanh({ ok: true, cheDo2: true })).toBeNull()
  })
})

describe('StudentPortalScreen thật: giao diện học tập tập trung', () => {
  beforeEach(() => {
    mocks.items = []; mocks.momItems = []
    localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: 'test', hoTen: 'Em thử', token: 'test-token' }))
  })
  it('đọc kế hoạch bằng token, hiển thị tiến độ; nút học mở bài tập, không chọn thú', async () => {
    tra['/game-v2/hoc-tap-sanh'] = { body: SANH }
    tra['/game-v2/hoc-tap-start'] = { body: {ok:true, id:'p1', questions:[]} }
    const { container } = render(<StudentPortalScreen />)
    await waitFor(() => expect(goiTheo('/game-v2/hoc-tap-sanh').length).toBeGreaterThan(0))
    await waitFor(() => expect(localStorage.getItem('omr_hoa2_che_do:test')).toBe('1'))
    expect(container.querySelector('.bnv')).toBeNull()
    expect(goiTheo('/game-v2/hoc-tap-sanh')[0].body).toEqual({ token: 'test-token' })
    expect(screen.queryByRole('button', {name:/Thần thú|Bi-a|Cửa hàng/})).toBeNull()
    // SỬA CÓ CHỦ ĐÍCH 12/10 (thầy 12/10: "gộp hai phần làm một"): nút học duy nhất ghi số câu còn lại ("Học tiếp · N câu").
    fireEvent.click(screen.getByRole('button', {name:/^Học tiếp · \d+ câu$/}))
    await waitFor(() => expect(goiTheo('/game-v2/hoc-tap-start').length).toBeGreaterThan(0))
    expect(localStorage.getItem('game-v2:man-dau')).toBeNull()
  })
  it('cờ kế hoạch tắt vẫn dùng giao diện học tập, không quay lại game', async () => {
    tra['/game-v2/hoc-tap-sanh'] = { body:{ok:true,cheDo2:false} }
    const {container}=render(<StudentPortalScreen />)
    await waitFor(() => expect(goiTheo('/game-v2/hoc-tap-sanh').length).toBeGreaterThan(0))
    expect(container.querySelector('.ht-app')).toBeTruthy()
    expect(container.querySelector('.h2-sanh')).toBeNull()
    expect(container.querySelector('.bnv')).toBeNull()
  })
  it('có đệm phiên trước hiện kế hoạch ngay; mạng lỗi vẫn giữ kế hoạch', async () => {
    // Khẩn 12/10 21h: đệm chỉ dùng khi là số của HÔM NAY (giờ Việt Nam) — dựng đệm đúng ngày hôm nay.
    const homNayVn = new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10)
    ghiNhoKetQuaSanh('test',docSanh({ ...SANH, ngay: homNayVn })!)
    tra['/game-v2/hoc-tap-sanh']={nem:true}
    render(<StudentPortalScreen />)
    expect(screen.getByRole('button',{name:/^Học tiếp · \d+ câu$/})).toBeTruthy() // 12/10: "gộp hai phần làm một" — nút ghi số câu còn lại
    expect(docNhoKetQuaSanh('test')).toBeTruthy()
  })
  it('khẩn 12/10 21h: đệm của NGÀY KHÁC không bao giờ vẽ thành số hôm nay (mạng lỗi ⇒ không có "Học tiếp · N câu" từ số cũ)', async () => {
    // Đệm hôm qua: lỗi mạng giờ cao điểm từng làm em chưa làm câu nào thấy "Đủ mức hôm nay 36/36" (số hôm qua).
    ghiNhoKetQuaSanh('test',docSanh({ ...SANH, ngay: '2026-09-30' })!)
    expect(docNhoKetQuaSanh('test')).toBeNull()
    tra['/game-v2/hoc-tap-sanh']={nem:true}
    render(<StudentPortalScreen />)
    expect(screen.queryByRole('button',{name:/^Học tiếp · \d+ câu$/})).toBeNull()
  })
})

// ĐÃ GỠ 28/09: describe "ParentPortalScreen: app phụ huynh đã ngừng" — thầy lệnh trùng tu app phụ huynh (chỉ xem báo cáo), app chạy lại dù Game Hoá 2.0 bật;
// hành vi mới khoá ở tests/ph-ngung-2709.test.tsx + tests/ph-v3-app-2809.test.tsx.
