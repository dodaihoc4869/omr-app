// BẢNG "MỌI THỨ VỀ CON" KIỂU APPLE — VỎ (src/components/ph-moi/bang/VoBang.tsx qua cửa vào BangMoiThu.tsx; thầy chốt 21/09 16:16). Khoá phần GHÉP mà test từng khối không thấy: mục lục chỉ liệt kê khối có mặt, thứ tự một cột đã chốt,
// hai cột từ 900 px xếp bằng React (KHÔNG CSS `order`, thứ tự Tab = thứ tự nhìn), khối vắng ⇒ ẩn (con mới / thưa / chưa học / bộ cũ không có trường mới), lệnh máy chủ thiếu khoá không làm vỡ,
// CÂU BỊ CHE không lộ đúng/sai/đáp án (Boss soi đầu tiên), nợ Dồn về đích, MỘT nút Giao thêm bài, không chữ game.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import BangMoiThu, { ChuoiMuoiBonNgay, NGUONG_LAM_LAU_GIAY, gomNhomCau } from '../src/components/ph-moi/BangMoiThu'
import { docTatCaVeCon } from '../src/lib/ph-moi/du-lieu'
import { taiChiTietCau } from '../src/lib/ph-moi/api'
import { NAY, PH_OK, PH_CHUA_CB } from './_ph-moi/du-lieu-mau'
import { PH_APPLE, PH_APPLE_CHUA_HOC, PH_APPLE_NO, PH_APPLE_THUA } from './_ph-moi/du-lieu-mau-apple'

vi.mock('../src/lib/ph-moi/api', () => ({ taiChiTietCau: vi.fn() }))
const goiChiTiet = vi.mocked(taiChiTietCau)
const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const CAM_GAME = /thần thú|khiên|Võ đài|Đảo thần thú|Linh Tâm|Đoàn Hộ Tống|\bEXP\b/i
const giaoThem = { san: true, dangTai: false, conLai: 2, goiGanNhat: null, the: null, dangGui: false, giao: vi.fn() }
const ve = (raw: unknown, p: Record<string, unknown> = {}) => render(<BangMoiThu pm={docTatCaVeCon(raw)!} sbd="12121212" lop="12 - Tinh Hoa" giaoThem={giaoThem as never} onVe={() => {}} {...(p as object)} />)
const idKhoi = (c: HTMLElement) => [...c.querySelectorAll('.phm-man .phm-muc[id]')].map((e) => e.id)
const chip = (c: HTMLElement) => [...c.querySelectorAll('.phm-muc-luc a')].map((a) => a.textContent)
const datRong = (rong: boolean) => vi.stubGlobal('matchMedia', (q: string) => ({ matches: /min-width:\s*900px/.test(q) ? rong : false, media: q, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, onchange: null, dispatchEvent: () => false }))

beforeEach(() => {
  goiChiTiet.mockReset()
  vi.stubGlobal('scrollTo', vi.fn())
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('VoBang — ghép khối, mục lục, thứ tự', () => {
  it('đủ dữ liệu: MỘT cột dưới 900 px theo thứ tự đã chốt; mục lục 9 chip (Điều đáng mừng / A.I đã làm nằm trong Tổng quan nên không có chip); tiêu đề "Mọi thứ về con" + tên/lớp; nút ‹ Hôm nay gọi onVe', () => {
    const onVe = vi.fn()
    const { container } = ve(PH_APPLE, { onVe })
    expect(idKhoi(container)).toEqual(['muc-tong-quan', 'muc-mung', 'muc-ai-lam', 'muc-thoi-gian', 'muc-ca', 'muc-dang', 'muc-cau', 'muc-btvn', 'muc-on', 'muc-14', 'muc-loi'])
    expect(chip(container)).toEqual(['Tổng quan', 'Dòng thời gian', 'Ca kiểm tra', 'Điểm mạnh · cần luyện', 'Từng câu (38)', 'Bài tập về nhà', 'Lịch ôn lại', '14 ngày', 'Lời A.I Đỗ Đại Học'])
    expect(container.querySelector('h1')!.textContent).toBe('Mọi thứ về con')
    expect(container.textContent).toContain('Nguyễn Minh Khôi')
    expect(container.textContent).toContain('Lớp 12 - Tinh Hoa')
    expect(container.querySelector('.phm-hang')).toBeNull() // một cột: không bọc hàng/cột
    expect(container.querySelector('[data-vung="bang-moi-thu"]')).toBeTruthy()
    fireEvent.click(container.querySelector('.phm-lui')!)
    expect(onVe).toHaveBeenCalledTimes(1)
  })

  it('từ 900 px: hai cột xếp bằng REACT — hàng 1 [Tổng quan, Dòng thời gian | Điều đáng mừng, A.I đã làm, Ca], Điểm mạnh cả hàng, hàng 2 [Từng câu | Bài tập, Lịch ôn, 14 ngày, Lời A.I]; thứ tự DOM = thứ tự nhìn', () => {
    datRong(true)
    const { container } = ve(PH_APPLE)
    const hang = [...container.querySelectorAll('.phm-hang')]
    expect(hang).toHaveLength(2)
    const ids = (h: Element) => [...h.querySelectorAll(':scope > .phm-cot')].map((c) => [...c.querySelectorAll(':scope > .phm-muc')].map((e) => e.id))
    expect(ids(hang[0]!)).toEqual([['muc-tong-quan', 'muc-thoi-gian'], ['muc-mung', 'muc-ai-lam', 'muc-ca']])
    expect(ids(hang[1]!)).toEqual([['muc-cau'], ['muc-btvn', 'muc-on', 'muc-14', 'muc-loi']])
    expect(container.querySelector('.phm-man > #muc-dang')).toBeTruthy() // Điểm mạnh · cần luyện nằm GIỮA hai hàng, cả bề ngang
    expect(idKhoi(container)).toHaveLength(11)
  })

  it('KHÔNG dùng CSS `order` (thứ tự Tab lệch thứ tự nhìn) — ở cả CSS bảng lẫn CSS của từng khối', () => {
    for (const f of ['ph-apple-bang.css', 'bang/TongQuan.css', 'bang/DongThoiGian.css', 'bang/TungCau.css', 'bang/khoi-c.css']) expect(doc(`src/components/ph-moi/${f}`).replace(/\/\*[\s\S]*?\*\//g, ''), f).not.toMatch(/(^|[;{\s])order\s*:/m)
  })

  it('khối vắng ⇒ ẨN, mục lục chỉ còn khối có mặt: bộ CŨ chưa có trường mới · con THƯA (mới học 4 ngày) · CHƯA HỌC hôm nay · ca chưa công bố', () => {
    const cu = ve(PH_OK).container
    expect(idKhoi(cu)).toEqual(['muc-tong-quan', 'muc-thoi-gian', 'muc-ca', 'muc-dang', 'muc-cau', 'muc-btvn', 'muc-on', 'muc-14', 'muc-loi']) // không mừng, không A.I đã làm
    expect(cu.querySelector('.phm-vong3')).toBeTruthy() // vòng % vẫn có; vòng câu/phút ẩn (chưa có mục tiêu)
    cleanup()
    const thua = ve(PH_APPLE_THUA).container
    expect(chip(thua)).toEqual(['Tổng quan', 'Dòng thời gian', 'Từng câu (9)', 'Lịch ôn lại', '14 ngày', 'Lời A.I Đỗ Đại Học'])
    expect(thua.querySelector('#muc-ca, #muc-dang, #muc-btvn')).toBeNull()
    expect(thua.textContent).toContain('Bảng sẽ đầy dần khi con học thêm')
    cleanup()
    const chua = ve(PH_APPLE_CHUA_HOC).container
    expect(chip(chua)).toEqual(['Tổng quan', 'Lịch ôn lại', '14 ngày', 'Lời A.I Đỗ Đại Học'])
    expect(chua.querySelector('#muc-thoi-gian, #muc-cau')).toBeNull()
    expect(chua.querySelector('#muc-ai-lam h2')!.textContent).toBe('A.I Đỗ Đại Học đã chuẩn bị gì cho con hôm nay')
    expect(chua.textContent).toContain('Hôm nay con chưa học')
    cleanup()
    const chuaCb = ve(PH_CHUA_CB).container
    expect(chuaCb.querySelector('#muc-ca')!.textContent).toContain('Thầy chưa công bố điểm')
    expect(chuaCb.querySelector('#muc-ca .phm-diem')).toBeNull() // không điểm
  })

  it('máy chủ trả gần như rỗng (chỉ hoTen / thiếu mọi khoá): bảng KHÔNG vỡ — đầu trang + thanh đáy vẫn còn, không khối nào, không lỗi', () => {
    for (const raw of [{ ok: true, hoTen: 'Nguyễn Minh Khôi' }, { ok: true, hoTen: 'Khôi', homNay: {}, nhipHoc: null, caGanNhat: 5, baiTapVeNha: 'x', lichOn: [], no: 3, doCham: {} }]) {
      const { container, unmount } = ve(raw)
      expect(container.querySelector('h1')!.textContent).toBe('Mọi thứ về con')
      expect(container.querySelector('[data-vung="giao-them"]')).toBeTruthy()
      expect(container.textContent).not.toMatch(/undefined|NaN|null|\[object Object\]/)
      unmount()
    }
  })

  it('MỘT nút hành động chính (thanh đáy dùng chung với màn chính); không chữ game, không emoji, không chữ "Biến thể" của bản vẽ', () => {
    const { container } = ve(PH_APPLE)
    expect(container.querySelectorAll('[data-vung="giao-them"]')).toHaveLength(1)
    expect(container.querySelector('[data-vung="luot-giao"]')!.textContent).toBe('Hôm nay còn 2 lượt giao · A.I Đỗ Đại Học chọn câu hợp với con')
    expect(container.textContent).not.toMatch(CAM_GAME)
    expect(container.textContent).not.toMatch(/Biến thể/)
    expect(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(container.textContent || '')).toBe(false)
  })
})

describe('VoBang — Dồn về đích, nhịp học, mốc dùng chung', () => {
  it('con còn nợ ⇒ dòng cam "Con còn N chặng của …" trong khối Bài tập về nhà; không nợ ⇒ không dòng', () => {
    const co = ve(PH_APPLE_NO).container
    const cam = co.querySelector('#muc-btvn .phm-dong-cam') as HTMLElement
    expect(cam).toBeTruthy()
    expect(cam.textContent).toMatch(/Con còn 1 chặng của Thứ Hai/)
    cleanup()
    expect(ve(PH_APPLE).container.querySelector('.phm-dong-cam')).toBeNull()
  })

  it('ChuoiMuoiBonNgay (dùng chung màn chính "Học đều" và khối 14 ngày): đủ 14 ngày kết thúc HÔM NAY (giờ VN); ngày không học ⇒ soCau null', () => {
    const pm = docTatCaVeCon(PH_APPLE)!
    const c = ChuoiMuoiBonNgay({ nhipHoc: pm.nhipHoc, serverNow: NAY })
    expect(c).toHaveLength(14)
    expect(c[0]!.ngay).toBe('2026-09-08')
    expect(c[13]!.ngay).toBe('2026-09-21')
    expect(c[13]!.soCau).toBe(38)
    expect(c.find((d) => d.ngay === '2026-09-09')!.soCau).toBeNull()
    expect(ChuoiMuoiBonNgay({ nhipHoc: null, serverNow: NAY })).toEqual([])
  })

  it('cửa vào BangMoiThu xuất lại gomNhomCau + ngưỡng làm lâu 120 giây (khớp máy chủ) cho test/gói lười cũ', () => {
    expect(NGUONG_LAM_LAU_GIAY).toBe(120)
    expect(gomNhomCau(docTatCaVeCon(PH_APPLE)!).length).toBe(5)
  })
})

describe('VoBang — CÂU BỊ CHE không lộ đúng/sai/đáp án (luật che)', () => {
  const nhomChe = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('.phm-nhom')].filter((n) => /Gia đình giao/.test(n.textContent || ''))

  it('nhóm của bài chưa nộp: chỉ "Con đã làm N câu · kết quả hiện sau khi con nộp bài" + dải ô che; KHÔNG Đúng/Sai/Đáp án/Con chọn/lời giải; KHÔNG hỏi máy chủ chi tiết câu', () => {
    const { container } = ve(PH_APPLE)
    const g = nhomChe(container)
    expect(g.length).toBeGreaterThan(0)
    for (const n of g) {
      const chu = n.textContent || ''
      expect(chu).toContain('kết quả hiện sau khi con nộp bài')
      expect(chu).not.toMatch(/\bĐúng\b|\bSai\b|Đáp án|Con chọn|Lời giải|đúng \d|sai \d/)
      expect(n.querySelector('li.phm-cau, .phm-pa, .phm-loi-giai')).toBeNull()
      expect(n.querySelectorAll('.phm-o-cau[data-che]').length).toBeGreaterThan(0)
      expect(n.querySelector('.phm-o-cau:not([data-che])')).toBeNull()
    }
    expect(goiChiTiet).not.toHaveBeenCalled()
  })

  it('kể cả khi JSON lỡ mang đúng/sai/đáp án/mã câu của câu bị che: bộ đọc bỏ hết; màn không có chúng', () => {
    const raw = JSON.parse(JSON.stringify(PH_APPLE))
    for (const c of raw.homNay.cau) if (c.che) Object.assign(c, { dung: true, dapAn: 'B', conChon: 'B', deRutGon: 'ĐỀ-LỘ-DIỆN', qid: 'Q-LỘ', coLoiGiai: true, tenDang: 'DẠNG-LỘ' })
    const { container } = ve(raw)
    expect(container.textContent).not.toMatch(/ĐỀ-LỘ-DIỆN|Q-LỘ|DẠNG-LỘ/)
    const g = nhomChe(container)
    for (const n of g) expect(n.textContent).not.toMatch(/\bĐúng\b|\bSai\b|Đáp án|Con chọn/)
  })

  it('ca CHƯA công bố: khối Ca không có điểm, không "so với lần trước", không phần I/II/III có điểm', () => {
    const raw = JSON.parse(JSON.stringify(PH_APPLE))
    raw.caGanNhat.congBo = { congBo: 'ca_lop_xong', daCongBo: false, soEmDaNop: 27, soEmDaVao: 32 }
    const { container } = ve(raw)
    const ca = container.querySelector('#muc-ca') as HTMLElement
    expect(ca.textContent).toContain('Thầy chưa công bố điểm')
    expect(ca.textContent).not.toMatch(/7,5|Hơn|Kém|so với lần trước|Phần I|\/10 điểm|Trắc nghiệm/)
  })
})
