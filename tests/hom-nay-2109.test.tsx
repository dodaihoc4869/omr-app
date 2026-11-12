// APP GIÁO VIÊN · G2 — màn HÔM NAY. Mọi số hiện ra phải đến từ lệnh máy chủ (docs/hop-dong-gv-hom-nay-2109.md); chưa có ⇒ "đang chờ máy chủ", KHÔNG bịa số.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import { useAppStore } from '../src/store/appStore'
import type { HomNay } from '../src/lib/hom-nay-api'
import {
  cauLyDo,
  hanhDongCua,
  layCauToiHan,
  layHomNay,
  ngayDai,
  phanTram,
  thuCuaHan,
} from '../src/lib/hom-nay-api'

const nap = vi.hoisted(() => ({ hom: null as unknown, cau: null as unknown, cho: false }))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }) }))
vi.mock('../src/lib/exam-db', () => ({ loadTeacherSecret: async () => 'bi-mat-thu' }))
vi.mock('../src/lib/cap-nhat-app', () => ({ daySangBanMoi: () => {} }))
import ExamHubScreen from '../src/screens/ExamHubScreen'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

const MAU: HomNay = {
  serverNow: 1, ngay: '2026-09-21', soEm: 261, soLop: 8, caDangMo: 0,
  nhiemVu: { tong: 261, dat: 142, tongHomQua: 261, datHomQua: 128 },
  btvn: { soEmCoLo: 100, soEmDungNhip: 86, dangChay: [{ ma: 'b1', ten: 'Chương 1 · Ester – Lipid', lop: '12A1', soEm: 34, loHienTai: 3, tongLo: 5, soEmKip: 30, han: '2026-09-25T16:00:00Z' }] },
  canYTuong: { tong: 17, ds: [
    { sbd: '12001', hoTen: 'Nguyễn Minh Khôi', lop: '12A1', lyDo: 'tre_nhip', soLieu: { ngay: 4 } },
    { sbd: '12002', hoTen: 'Trần Thu Hà', lop: '12A1', lyDo: 'dang_yeu', soLieu: { ten: 'Oxi hoá ancol', soCauSai: 4 } },
    { sbd: '12003', hoTen: 'Lê Hoàng Nam', lop: '12A2', lyDo: 'tut_bac', soLieu: { soCau: 5, soNgay: 3 } },
  ] },
  dangYeu: [{ lop: '12A1', siSo: 34, dang: [{ ma: 'a', ten: 'Oxi hoá ancol', soEmYeu: 21 }, { ma: 'b', ten: 'Thuỷ phân ester', soEmYeu: 16 }] }],
  doan: { lop: '12A1', tram: 17, tongTram: 30, gopSucHomNay: 9, siSo: 34 },
}

beforeEach(() => {
  useAppStore.getState().setScreen('examhub')
  useAppStore.getState().setClassList([{ sbd: '12001', hoTen: 'Nguyễn Minh Khôi', sdt: '', lop: '12A1', namSinh: '2008', raw: {} }])
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { body?: string; headers?: Record<string, string> }) => {
    const u = new URL(String(url)).pathname
    const ok = (b: unknown) => ({ ok: true, status: 200, json: async () => b })
    if (nap.cho) return new Promise(() => {})
    if (u === '/ke-hoach/hom-nay-thay') return nap.hom ? ok({ ok: true, ...(nap.hom as object) }) : { ok: false, status: 404, json: async () => ({ ok: false }) }
    if (u === '/gv/can-giup') return { ok: false, status: 404, json: async () => ({ ok: false }) } // bước 3: chưa có lệnh chi tiết ⇒ rơi về danh sách rút gọn (test này khoá danh sách rút gọn)
    if (u === '/ke-hoach/do-phu-phuc-vu') return nap.cau ? ok({ ok: true, ...(nap.cau as object) }) : ok({ ok: false })
    void init
    return ok({ ok: true })
  }))
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  nap.hom = null
  nap.cau = null
  nap.cho = false
})

describe('hom-nay-api: hàm thuần', () => {
  it('cauLyDo: MỘT câu bằng SỐ cho mỗi lý do, không kết luận năng lực; hanhDongCua theo lý do', () => {
    const em = (lyDo: 'tre_nhip' | 'tut_bac' | 'dang_yeu', soLieu: object) => ({ sbd: 'x', hoTen: 'A', lop: '12', lyDo, soLieu })
    expect(cauLyDo(em('tre_nhip', { ngay: 4 }))).toBe('Trễ nhịp 4 ngày, chưa làm câu nào trong thời gian ấy')
    expect(cauLyDo(em('tut_bac', { soCau: 5, soNgay: 3 }))).toBe('Tụt bậc 5 câu trong 3 ngày')
    expect(cauLyDo(em('dang_yeu', { ten: 'Oxi hoá ancol', soCauSai: 4 }))).toBe('Dạng "Oxi hoá ancol" sai 4 câu')
    expect(cauLyDo(em('dang_yeu', { ma: 'CD:x' }))).toContain('CD:x')
    expect([hanhDongCua(em('tre_nhip', {})), hanhDongCua(em('tut_bac', {})), hanhDongCua(em('dang_yeu', {}))]).toEqual(['xem_ho_so', 'xem_ho_so', 'dua_vao_buoi_chua'])
    for (const s of [cauLyDo(em('tre_nhip', {})), cauLyDo(em('tut_bac', {})), cauLyDo(em('dang_yeu', {}))]) expect(s).not.toMatch(/nắm chắc|năng lực|giỏi|kém/i)
  })

  it('phanTram: làm tròn; mẫu số 0 → null (không bịa 0%); ngayDai / thuCuaHan đúng thứ', () => {
    expect(phanTram(142, 261)).toBe(54)
    expect(phanTram(0, 0)).toBeNull()
    expect(ngayDai('2026-09-21')).toBe('Thứ Hai, 21/09')
    expect(ngayDai('2026-09-27')).toBe('Chủ nhật, 27/09')
    expect(ngayDai('hỏng')).toBe('')
    expect(thuCuaHan('2026-09-25T09:00:00')).toBe('thứ Sáu')
    expect(thuCuaHan(null)).toBe('')
  })
})

describe('hom-nay-api: gọi máy chủ', () => {
  it('layHomNay: POST /ke-hoach/hom-nay-thay kèm x-ma-bi-mat; trả dữ liệu khi ok, null khi 404 / sai mã / mạng hỏng', async () => {
    nap.hom = MAU
    const r = await layHomNay()
    expect(r!.nhiemVu!.dat).toBe(142)
    const goi = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(goi[0]).toBe('https://may.test/ke-hoach/hom-nay-thay')
    expect(goi[1].method).toBe('POST')
    expect(goi[1].headers['x-ma-bi-mat']).toBe('bi-mat-thu')
    nap.hom = null
    expect(await layHomNay()).toBeNull()
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    expect(await layHomNay()).toBeNull()
  })

  it('layCauToiHan: chỉ nhận số; thiếu trường → null', async () => {
    nap.cau = { qidToiHan: 1179, qidPhucVuDuoc: 939 }
    expect(await layCauToiHan()).toEqual({ toiHan: 1179, moDuoc: 939 })
    nap.cau = { qidToiHan: 'nhiều' }
    expect(await layCauToiHan()).toBeNull()
  })
})

// 12/11: BỎ HẲN màn dự phòng HomNayCu (thầy «load lại nhiều lần vẫn bị vào màn này, xoá hẳn đi») ⇒ bỏ khối test của màn đó.

describe('ExamHubScreen = trang chủ Hôm nay bản 2 (đã bỏ Bảng tin cũ); CSS', () => {
  it('ExamHubScreen dựng HomNayScreen; máy chủ CHƯA có /gv/bang-tin ⇒ thẻ «Chưa đọc được bảng tin» (bỏ bản dự phòng 12/11, SỬA CÓ CHỦ Ý); KHÔNG còn bảng tin hoạt động cũ', async () => {
    render(<ExamHubScreen />)
    expect(await screen.findByRole('heading', { name: 'Chưa đọc được bảng tin' })).toBeTruthy()
    expect(screen.queryByText('Chào thầy Học')).toBeNull()
    expect(screen.queryByText('bảng tin hoạt động')).toBeNull()
    expect(doc('src/screens/ExamHubScreen.tsx')).not.toContain('BangTinGiaoVien')
  })

  it('hom-nay.css: token --m3-*, không hex, không !important; 4 cột → 2 cột (<1100) → 1 cột (<880)', () => {
    const css = doc('src/styles/hom-nay.css').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(css).not.toContain('!important')
    expect(css).toMatch(/\.hn-hang-so \{[^}]*repeat\(4, minmax\(0, 1fr\)\)/)
    expect(css).toMatch(/@media \(max-width: 1099px\)[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/)
    expect(css).toMatch(/@media \(max-width: 879px\)/)
    expect(css).toContain('var(--m3-error-container)')
  })

  it('hom-nay-v2.css: token --m3-*, không hex, không !important; hàng A hai cột → một cột (<1280), hàng B ba cột → hai → một (<720)', () => {
    const css = doc('src/styles/hom-nay-v2.css').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(css).not.toContain('!important')
    expect(css).toMatch(/\.hn2-luoi-a \{[^}]*1\.25fr/)
    expect(css).toMatch(/\.hn2-luoi-b \{[^}]*repeat\(3, minmax\(0, 1fr\)\)/)
    expect(css).toMatch(/@media \(max-width: 1279px\)/)
    expect(css).toMatch(/@media \(max-width: 719px\)/)
  })

  it('hợp đồng: nguồn không dùng chữ "nắm chắc"; tệp màn dự phòng HomNayCu đã xoá', () => {
    expect(fs.existsSync(path.join(process.cwd(), 'src/screens/HomNayCu.tsx'))).toBe(false)
    for (const t of ['src/screens/HomNayScreen.tsx', 'src/lib/hom-nay-api.ts', 'src/lib/hom-nay-v2.ts', 'src/components/hom-nay/ViecGap.tsx', 'src/components/hom-nay/OTraCuu.tsx']) expect(doc(t)).not.toContain('nắm chắc')
  })
})
