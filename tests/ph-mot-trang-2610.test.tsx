// APP PHỤ HUYNH «CHỈ ĐỌC» (thầy chốt bản vẽ 26/10: ve-moi/ph-doc-*.html — thay màn «Một trang» 8 ô + tấm). Khoá:
//   · main.tsx gắn <html data-trong="ph"> cho cổng phụ huynh (cùng luật lùi `ddh.trong`='tat'); /hoi-thay vẫn không có; PH không nạp trong.css;
//   · bật ⇒ màn CHỈ ĐỌC: đầu (tên con · lớp) → Hôm nay → 7 ngày qua → Con đang ở nhóm (+ Học thật / Đối phó) → Lời thầy → Kiểm tra và sửa lỗi; KHÔNG ô bấm,
//     không tấm, nút duy nhất = ảnh đại diện (menu «Đổi số báo danh»);
//   · số: CHỈ lệnh sẵn có (thêm /ph/bao-cao-tuan, một lần); không gọi hai lệnh hồ sơ (/ph/ho-so-thai-do · /ph/lich-su-lam-cau);
//   · lý do nhận định bằng SỐ CÂU / SỐ LẦN (mucLam), không %;
//   · tắt (không data-trong) ⇒ trang cũ y nguyên.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import AppPhuHuynh from '../src/components/ph-v3/AppPhuHuynh'
import { dongBtvn, dongKiemTra, dongSuaLoi, lyDoCach, nhanNgay, tomTat7, trangThaiHomNay } from '../src/components/ph-v3/DocPh'
import type { TomTatKiemTra } from '../src/lib/kiem-tra-ca-nhan'
import type { BaoCaoTuanCon } from '../src/lib/bao-cao-tuan-ph-api'
import type { NgayHoc } from '../src/lib/ph-v3/con-tong-quan'
import { hoc2Gia, lichSuGia, loiThayGia, nhipGia, thaiDoGia, tatCaGia, tongQuanGia } from '../scripts/chup-ph-dot19/gia'
import './_ph-nap-trang-cu' // trang cũ nạp lười (26/10): chờ mảnh về trước các test

const daXem = vi.fn()
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/tai-thong-tin-ph', () => ({
  taiThongTinPhuHuynh: async () => ({
    canhBao: [{ id: 'cb1', maBtvn: 'B7', tenBtvn: 'Ester buổi 7', guiLuc: '2026-10-14T12:30:00Z', hanNop: '2026-10-15T15:00:00Z', loi: '', trangThaiEm: 'do_chang', chang: { hienTai: 2, tong: 5 }, daXem: false }],
  }),
}))
vi.mock('../src/lib/canh-bao-thay-may-chu', () => ({ baoDaXemPhuHuynh: (id: string) => daXem(id) }))

const BAO_CAO = {
  ok: true, soLieu: 'x',
  duLieu: { tu: '08/10', den: '14/10', buoi: { tong: 3, coMat: 3, coPhep: 0 }, soNgay: 7, ngayCoLam: 6, ngayKhongLam: [], soCau: 186, soDung: 141, mucLam: { thuoc: 126, bamVoi: 8, treo: 0, doDuoc: 180 }, ktcn: { nop: 0, hetHan: [], diem: [] }, banKhac: null, banKhacTruoc: null, chuyenDeYeu: [], nhan: 'Học thật', lyDo: [] },
}
const MAY: Record<string, () => unknown> = {
  '/ph/tat-ca-ve-con': tatCaGia, '/ph/con-tong-quan': tongQuanGia, '/ph/nhip-hoc': nhipGia, '/ph/loi-thay': loiThayGia, '/ph/hoc-2': hoc2Gia,
  '/ph/ho-so-thai-do': thaiDoGia, '/ph/lich-su-lam-cau': lichSuGia, '/ph/bao-cao-tuan': () => BAO_CAO,
}
let goi: string[] = []

beforeEach(() => {
  goi = []
  daXem.mockReset()
  localStorage.clear()
  window.history.replaceState(null, '', '/?vai=phuhuynh')
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} })
  Element.prototype.scrollIntoView = vi.fn()
  vi.stubGlobal('fetch', vi.fn((url: string) => {
    const duong = String(url).replace('https://may.test', '')
    goi.push(duong)
    const body = MAY[duong]?.() ?? { ok: true }
    return Promise.resolve({ ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) })
  }))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  delete document.documentElement.dataset.trong
  localStorage.clear()
  window.history.replaceState(null, '', '/')
})

const mo = () => render(<div className="m3"><AppPhuHuynh sbd="12121212" hoTen="Nguyễn Minh Khôi" lop="12A1" onDoiSbd={() => {}} /></div>).container

describe('main.tsx — công tắc giao diện mới phụ huynh', () => {
  const ma = readFileSync(resolve(__dirname, '../src/main.tsx'), 'utf8')
  it("cổng phụ huynh = 'ph', /hoi-thay không có, lùi bằng ddh.trong='tat'", () => {
    expect(ma).toMatch(/const vaiTrong = laHoiThay \? '' : laCongPhuHuynh \? 'ph' :/)
    expect(ma).toMatch(/localStorage\.getItem\('ddh\.trong'\) !== 'tat'/)
  })
  it('PH KHÔNG nạp trong.css (màu PH giữ bảng PH); mọi bộ chọn dưới [data-trong=ph]; không mã màu thô', () => {
    const doc = readFileSync(resolve(__dirname, '../src/components/ph-v3/DocPh.tsx'), 'utf8')
    const app = readFileSync(resolve(__dirname, '../src/components/ph-v3/AppPhuHuynh.tsx'), 'utf8')
    for (const t of [doc, app]) expect(t).not.toMatch(/styles\/trong/)
    const css = readFileSync(resolve(__dirname, '../src/components/ph-v3/doc-ph.css'), 'utf8')
    let dem = 0
    for (const khoi of css.replace(/\/\*[\s\S]*?\*\//g, '').split('}')) {
      if (!khoi.includes('{')) continue
      const chon = khoi.replace(/^[\s\S]*@media[^{]*\{/, '').split('{')[0]!.trim()
      for (const c of chon.split(',')) { expect(c.trim(), chon).toMatch(/^\[data-trong=ph\] /); dem++ }
    }
    expect(dem).toBeGreaterThan(60)
    expect(css).not.toMatch(/--tr-|#[0-9a-f]{3,8}\b/i)
  })
})

describe('phép thuần của màn chỉ đọc', () => {
  const ngay = (o: Partial<NgayHoc>): NgayHoc => ({ ngay: '2026-10-20', dung: 0, sai: 0, boTrong: 0, soCau: 0, muc: 24, mucUocTinh: false, daXep: null, canLam: 24, daLam: 0, trangThai: 'khong', homNay: false, ...o })
  it('trạng thái câu chính: chưa làm (đỏ) · đang làm · đủ', () => {
    expect(trangThaiHomNay(0, 24)).toBe('chua')
    expect(trangThaiHomNay(9, 24)).toBe('dang')
    expect(trangThaiHomNay(24, 24)).toBe('du')
    expect(trangThaiHomNay(5, null)).toBe('dang')
  })
  it('7 ngày (bản vẽ ph-doc-chua): đủ mức 3/6 ngày · 1 ngày không làm · tổng 98 câu; hôm nay đủ thì tính thêm hôm nay', () => {
    const ds = [24, 9, 0, 14, 26, 25].map((daLam, i) => ngay({ ngay: `2026-10-${20 + i}`, daLam, trangThai: daLam >= 24 ? 'du' : daLam ? 'thieu' : 'khong' }))
    expect(tomTat7([...ds, ngay({ ngay: '2026-10-26', homNay: true })])).toEqual({ du: 3, soNgay: 6, khong: 1, tong: 98 })
    expect(tomTat7([...ds, ngay({ ngay: '2026-10-26', homNay: true, daLam: 30, trangThai: 'du' })])).toEqual({ du: 4, soNgay: 7, khong: 1, tong: 128 })
    expect(nhanNgay('2026-10-20')).toBe('T3 20')
    expect(nhanNgay('2026-10-25')).toBe('CN 25')
  })
  it('thẻ «Kiểm tra và sửa lỗi»: câu trạng thái + màu nghĩa của ba dòng; thiếu số ⇒ «—»', () => {
    const mo = Date.UTC(2026, 9, 13, 17)
    const kt = (o: Partial<TomTatKiemTra>): TomTatKiemTra => ({ id: 'k', ngay: '2026-10-14', moLuc: mo, hanLuc: mo + 86_400_000, serverNow: mo, trangThai: 'can_lam', homNay: true, tong: 28, daTra: 0, con: 28, soChang: 5, phut: 25, soBai: 6, tongKienThuc: 12, phuDe: 0, nguonDayDu: true, lyDo: '', thieuNguon: 0, diem: null, nopLuc: null, ...o })
    expect(dongKiemTra(kt({}), true)).toEqual({ mau: 'do', chu: 'Hôm nay có bài kiểm tra · con chưa làm · hạn 24:00' })
    expect(dongKiemTra(kt({ daTra: 10, con: 18 }), true)).toEqual({ mau: 'cam', chu: 'Đang làm · 10/28 câu · hạn 24:00' })
    expect(dongKiemTra(kt({ trangThai: 'da_nop', diem: 8, nopLuc: mo + 3_600_000 }), true)).toEqual({ mau: 'xanh', chu: 'Đã nộp · 8/10' })
    expect(dongKiemTra(kt({ trangThai: 'het_han' }), true)).toEqual({ mau: 'do', chu: 'Hết hạn, con chưa nộp' })
    expect(dongKiemTra(kt({ trangThai: 'da_nop', homNay: false, diem: 7.5, nopLuc: Date.UTC(2026, 9, 10, 13) }), true)).toEqual({ mau: 'xam', chu: 'Lần gần nhất 7,5/10 · 10/10' })
    expect(dongKiemTra(undefined, true).chu).toBe('Chưa có lịch kiểm tra ôn tập')
    expect(dongKiemTra(undefined, false).chu).toBe('—')
    expect(dongSuaLoi(19, 46, 6)).toEqual({ mau: 'cam', chu: 'Còn 19 câu chưa sửa · 14 ngày qua con tự sửa 6 câu' })
    expect(dongSuaLoi(19, 46, 0).mau).toBe('do')
    expect(dongSuaLoi(0, 46, 3)).toEqual({ mau: 'xanh', chu: 'Đã sửa hết câu sai' })
    expect(dongSuaLoi(null, null, null).chu).toBe('—')
    const bt = (dangChay: { hanNop: string }[], gan: unknown[]) => ({ dangChay, gan }) as never
    expect(dongBtvn(bt([{ hanNop: '2026-10-28T16:59:00Z' }], []))).toEqual({ mau: 'cam', chu: '1 bài chưa nộp · hạn 28/10' })
    expect(dongBtvn(bt([{ hanNop: '' }], [])).chu).toBe('1 bài chưa nộp')
    expect(dongBtvn(bt([], [{}]))).toEqual({ mau: 'xanh', chu: 'Đã nộp đủ' })
    expect(dongBtvn(bt([], [])).chu).toBe('Không có bài')
    expect(dongBtvn(null).chu).toBe('—')
  })
  it('lý do nhận định bằng SỐ CÂU / SỐ LẦN, không %', () => {
    const bc = (nhan: BaoCaoTuanCon['nhan'], thuoc: number, bamVoi: number, treo: number) => ({ nhan, mucLam: { thuoc, bamVoi, treo, doDuoc: 200 } }) as BaoCaoTuanCon
    expect(lyDoCach(bc('Đối phó', 20, 21, 3))).toBe('Bấm vội mà sai 21 câu · để máy treo 3 lần trong 7 ngày')
    expect(lyDoCach(bc('Học thật', 126, 8, 0))).toBe('Làm nhanh vì đã thuộc 126 câu · bấm vội mà sai 8 câu')
    expect(lyDoCach(bc('Học thật', 0, 8, 0))).toBe('Bấm vội mà sai 8 câu')
    expect(lyDoCach({ nhan: 'Đối phó', mucLam: null } as BaoCaoTuanCon)).toBe('')
  })
})

describe('«Chỉ đọc» bật (<html data-trong="ph">)', () => {
  beforeEach(() => { document.documentElement.dataset.trong = 'ph' })

  it('thứ tự đầu → Hôm nay → 7 ngày → nhóm → Lời thầy → Kiểm tra và sửa lỗi; không ô bấm, nút duy nhất là ảnh đại diện; chỉ lệnh sẵn có', async () => {
    const c = mo()
    await waitFor(() => expect(c.querySelector('[data-vung="ph-chi-doc"] [data-vung="hom-nay-doc"]')).toBeTruthy())
    const man = c.querySelector('[data-vung="ph-chi-doc"]')!
    expect(man.querySelector('h1')!.textContent).toBe('Khôi · Lớp 12A1')
    expect([...man.querySelectorAll('.pd-luoi > section')].map((x) => x.getAttribute('data-vung'))).toEqual(['hom-nay-doc', 'bay-ngay', 'nhom-con', 'loi-thay-doc', 'kiem-tra-sua-loi'])
    expect([...man.querySelectorAll('.pd-kt li')].map((x) => x.querySelector('b')!.textContent)).toEqual(['Kiểm tra ôn tập', 'Tự sửa lỗi', 'Bài tập về nhà'])
    expect([...man.querySelectorAll('button')].map((b) => b.getAttribute('aria-label'))).toEqual(['Tài khoản: mở để đổi số báo danh'])
    expect(man.querySelectorAll('a')).toHaveLength(0)
    expect(c.querySelector('.tvc-muc-luc, .tvc-ben, [role="dialog"]')).toBeNull()
    // Hôm nay (bộ giả: 18/30 câu, có mặt 17:52) · 7 cột · nhóm Chưa đều · Học thật (số câu)
    expect(man.querySelector('[data-vung="cau-hom-nay"]')!.textContent).toBe('Con đã làm 18/30 câu')
    expect(man.querySelector('[data-vung="hom-nay-doc"]')!.textContent).toContain('còn hạn đến 24:00')
    expect(man.querySelector('[data-vung="hom-nay-doc"]')!.textContent).toContain('Có mặt buổi học 17:52')
    await waitFor(() => expect(man.querySelectorAll('.pd-7 .c')).toHaveLength(7))
    expect(man.querySelector('.pd-7 .c[data-tt="nay"] small')!.textContent).toBe('Hôm nay')
    await waitFor(() => expect(man.querySelector('.pd-thang [data-on]')!.textContent).toBe('Chưa đều'))
    await waitFor(() => expect(man.querySelector('[data-vung="cach-lam-bai"]')!.textContent).toBe('Học thậtLàm nhanh vì đã thuộc 126 câu · bấm vội mà sai 8 câu'))
    await waitFor(() => expect(man.querySelector('.pd-kt li[data-ma="sua-loi"] > div > span')!.textContent).toBe('Còn 19 câu chưa sửa · 14 ngày qua con tự sửa 6 câu'))
    expect(man.querySelector('.pd-kt li[data-ma="btvn"]')!.getAttribute('data-mau')).toBe('cam')
    for (const d of goi) expect(Object.keys(MAY)).toContain(d)
    expect(goi.filter((x) => x === '/ph/bao-cao-tuan')).toHaveLength(1)
    for (const d of ['/ph/ho-so-thai-do', '/ph/lich-su-lam-cau']) expect(goi).not.toContain(d)
    expect(c.textContent).not.toMatch(/CA-45|12121212/)
  })

  it('Lời thầy: cảnh báo của thầy, CHỈ ĐỌC (không nút «Đã xem»)', async () => {
    const c = mo()
    await waitFor(() => expect(c.querySelector('[data-vung="loi-thay-doc"] [data-vung="canh-bao-thay"]')).toBeTruthy())
    expect(c.querySelector('[data-vung="loi-thay-doc"] button')).toBeNull()
    expect(daXem).not.toHaveBeenCalled()
  })

  it('ảnh đại diện ⇒ menu «Đổi số báo danh» (hỏi lại trước khi đổi)', async () => {
    const c = mo()
    await waitFor(() => expect(c.querySelector('[data-vung="ph-chi-doc"] .ph3-tron__nut')).toBeTruthy())
    fireEvent.click(c.querySelector('[data-vung="ph-chi-doc"] .ph3-tron__nut')!)
    const muc = () => [...c.querySelectorAll('[role="menuitem"]')].find((x) => x.textContent === 'Đổi số báo danh')
    await waitFor(() => expect(muc()).toBeTruthy())
    fireEvent.click(muc()!)
    await waitFor(() => expect(document.body.textContent).toContain('Đổi số báo danh?'))
  })
})

describe('giao diện mới tắt (không data-trong / ddh.trong=tat)', () => {
  it('trang cũ y nguyên: thanh mục, các phần, không có ô', async () => {
    const c = mo()
    await waitFor(() => expect(c.querySelector('[data-vung="man-chinh-ph"] [data-vung="anh-hung"]')).toBeTruthy())
    expect(c.querySelector('.tvc-muc-luc')).toBeTruthy()
    expect(c.querySelector('[data-vung="ph-chi-doc"]')).toBeNull()
    expect(goi).not.toContain('/ph/ho-so-thai-do')
  })
})
