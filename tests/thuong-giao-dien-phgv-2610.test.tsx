// THƯỞNG PHẠT KIỂU DUOLINGO — giao diện PHỤ HUYNH + THẦY (thầy chốt bản vẽ 26/10: ve-moi/tp-14-ph-tuan · tp-15-gv-thi-dua). Khoá:
//   · PH: thẻ «Tuần này của con» trong màn chỉ đọc (DocPh), số lấy từ khối `tuan` của /ph/bao-cao-tuan (gốc hoặc duLieu.tuan) — KHÔNG gọi thêm lệnh;
//     trường thiếu ⇒ ẩn ô ấy, thiếu cả khối ⇒ không có thẻ;
//   · GV: màn «Thi đua tuần» nạp lười (một dòng lazy + TEN_MAN + một mục menu), vẽ ngay bản lưu máy rồi cập nhật; bảng sắp theo cột; nhãn Học thật /
//     Đối phó; bậc tới ĐUỔI; cặp học cùng; 4 công tắc gọi /gv/thuong/cong-tac, đổi phải xác nhận MỘT lần;
//   · CSS: PH chỉ trong doc-ph.css dưới [data-trong=ph]; thầy: trong-gv-thi-dua.css dưới [data-trong='gv'] (kiểu cũ ở thi-dua-tuan.css).
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import AppPhuHuynh from '../src/components/ph-v3/AppPhuHuynh'
import { cauGiai, cauHocThat } from '../src/components/ph-v3/DocPh'
import { docBaoCaoTuanCon, docTuanCon } from '../src/lib/bao-cao-tuan-ph-api'
import { docCongTac, docEm, docThiDua, nhoGhi } from '../src/lib/thi-dua-tuan-api'
import ThiDuaTuanScreen, { capHocCung, khoangTuan, sapXep } from '../src/screens/ThiDuaTuanScreen'
import { docKimLoai, klDuoi, klTren } from '../src/components/HuyHieuGiai'
import { hoc2Gia, lichSuGia, loiThayGia, nhipGia, thaiDoGia, tatCaGia, tongQuanGia } from '../scripts/chup-ph-dot19/gia'
import './_ph-nap-trang-cu'

const doc = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8')
const xacNhan = vi.fn(async (..._a: unknown[]) => true)
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/exam-db', async (goc) => ({ ...(await goc<object>()), loadTeacherSecret: async () => 'mat' }))
vi.mock('../src/lib/ten-lop-thay', () => ({ useLopThay: () => ({ ds: [{ tenLop: '12A1' }, { tenLop: '12A2' }], lyDoThieu: '', tenLopCua: () => '', lamMoi: () => {} }) }))
vi.mock('../src/components/hop-thoai', () => ({ hoiXacNhan: (...a: unknown[]) => xacNhan(...a) }))
vi.mock('../src/lib/tai-thong-tin-ph', () => ({ taiThongTinPhuHuynh: async () => ({ canhBao: [] }) }))
vi.mock('../src/lib/canh-bao-thay-may-chu', () => ({ baoDaXemPhuHuynh: () => {} }))

const DU_LIEU = { tu: '08/10', den: '14/10', buoi: { tong: 3, coMat: 3, coPhep: 0 }, soNgay: 7, ngayCoLam: 6, ngayKhongLam: [], soCau: 186, soDung: 141, mucLam: { thuoc: 126, bamVoi: 8, treo: 0, doDuoc: 180 }, ktcn: { nop: 0, hetHan: [], diem: [] }, banKhac: null, banKhacTruoc: null, chuyenDeYeu: [], nhan: 'Học thật', lyDo: [] }
const TUAN = { chuoi: 12, soBai: 9, hang: 'bac', thuHang: 4, soNguoi: 30, tiLeHocThat: 0.9, hocCung: ['Trần Gia Bảo', 'Lê Minh Anh'] }
const BANG = {
  ok: true, lop: '12A1', tuan: '2026-10-26', capNhat: Date.UTC(2026, 9, 26, 14, 5),
  ds: [
    { sbd: '1', ten: 'Nguyễn Minh Khôi', nguyenTuThat: 412, nguyenTuLoai: 46, hang: { kl: 'bac', thuHang: 4 }, chuoi: 12, nhan: 'Học thật', bacDuoi: 1, hocCung: [{ ten: 'Trần Gia Bảo', chuoiDoi: 9 }] },
    { sbd: '2', ten: 'Trần Gia Bảo', nguyenTuThat: 530, nguyenTuLoai: 0, hang: 'vang', thuHang: 1, chuoi: 20, nhan: 'Học thật', bacDuoi: null, hocCung: ['Nguyễn Minh Khôi'] },
    { sbd: '3', ten: 'Phạm Văn Đức', nguyenTuThat: 40, nguyenTuLoai: 210, hang: null, chuoi: 0, nhan: 'Đối phó', bacDuoi: 5, hocCung: [] },
  ],
}
let may: Record<string, (body?: unknown) => unknown> = {}
let goi: { duong: string; body?: unknown }[] = []

beforeEach(() => {
  goi = []
  xacNhan.mockReset().mockResolvedValue(true)
  localStorage.clear()
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} })
  Element.prototype.scrollIntoView = vi.fn()
  may = {
    '/ph/tat-ca-ve-con': tatCaGia, '/ph/con-tong-quan': tongQuanGia, '/ph/nhip-hoc': nhipGia, '/ph/loi-thay': loiThayGia, '/ph/hoc-2': hoc2Gia,
    '/ph/ho-so-thai-do': thaiDoGia, '/ph/lich-su-lam-cau': lichSuGia,
    '/ph/bao-cao-tuan': () => ({ ok: true, soLieu: 'x', duLieu: DU_LIEU, tuan: TUAN }),
    '/gv/thi-dua-tuan?lop=12A1': () => BANG,
    '/gv/thuong/cong-tac': (b) => (b ? { ok: true, congTac: { thuong_giai_tuan: 'bat', thuong_thang_hoa: 'tat', thuong_ban_be: 'bat', thuong_kim_cuong: 'bat' } }
      : { ok: true, congTac: { thuong_giai_tuan: 'bat', thuong_thang_hoa: 'bat', thuong_ban_be: 'bat', thuong_kim_cuong: 'bat' } }),
  }
  vi.stubGlobal('fetch', vi.fn((url: string, o?: { body?: string }) => {
    const duong = String(url).replace('https://may.test', '').replace(/^(\/ph\/[^?]+)\?.*$/, '$1')
    const body = o?.body ? JSON.parse(o.body) : undefined
    goi.push({ duong, body })
    const tra = may[duong]?.(body) ?? { ok: true }
    return Promise.resolve({ ok: true, status: 200, json: async () => tra, text: async () => JSON.stringify(tra) })
  }))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  delete document.documentElement.dataset.trong
  localStorage.clear()
  window.history.replaceState(null, '', '/')
})

describe('đọc số — chặt, không bịa', () => {
  it('kim loại: tên chuẩn + bí danh; lạ ⇒ null; hạng trên / dưới', () => {
    expect(docKimLoai('Bac')).toBe('bac')
    expect(docKimLoai('bach_kim')).toBe('bachkim')
    expect(docKimLoai('kc')).toBe('kimcuong')
    expect(docKimLoai('titan')).toBeNull()
    expect([klTren('kimcuong'), klDuoi('sat'), klTren('sat'), klDuoi('kimcuong')]).toEqual([null, null, 'dong', 'bachkim'])
  })
  it('PH `tuan`: gốc hoặc duLieu.tuan; hang chuỗi + thuHang riêng; phần trăm 0…100 cũng đọc; trường sai ⇒ null; rỗng ⇒ không có thẻ', () => {
    expect(docTuanCon(TUAN)).toEqual({ chuoi: 12, soBai: 9, hang: { kl: 'bac', thuHang: 4, soNguoi: 30 }, tiLeHocThat: 0.9, hocCung: [{ ten: 'Trần Gia Bảo', lop: '' }, { ten: 'Lê Minh Anh', lop: '' }] })
    expect(docTuanCon({ chuoi: -1, soBai: '3', hang: { kl: 'vang', thuHang: 2 }, tiLeHocThat: 85 })).toEqual({ chuoi: null, soBai: null, hang: { kl: 'vang', thuHang: 2, soNguoi: null }, tiLeHocThat: 0.85, hocCung: [] })
    expect(docTuanCon({ chuoi: null, hang: 'titan', hocCung: [] })).toBeNull()
    expect(docBaoCaoTuanCon({ ok: true, soLieu: 'x', duLieu: { ...DU_LIEU, tuan: { soBai: 3 } } })?.tuan?.soBai).toBe(3)
    expect(docBaoCaoTuanCon({ ok: true, soLieu: 'x', duLieu: DU_LIEU })?.tuan).toBeNull()
  })
  it('câu giải cho phụ huynh: top 5 lên hạng, 4 hạng cuối xuống, Sắt không xuống, thiếu thứ hạng ⇒ chỉ nói giải', () => {
    // 27/10 (thầy: «100% nguyên tử là gì, tuần này giải Sắt rất khó hiểu»): câu nói rõ Giải tuần là gì, bậc mấy/6, hạng trong nhóm.
    expect(cauGiai({ kl: 'bac', thuHang: 4, soNguoi: 30 })).toBe('Giải tuần là bảng thi đua mỗi tuần, 6 bậc từ Sắt lên Kim cương. Con đang ở bậc Bạc (bậc 3/6), hạng 4/30 trong nhóm. Cuối tuần vào top 5 thì lên bậc Vàng.')
    expect(cauGiai({ kl: 'bac', thuHang: 28, soNguoi: 30 })).toBe('Giải tuần là bảng thi đua mỗi tuần, 6 bậc từ Sắt lên Kim cương. Con đang ở bậc Bạc (bậc 3/6), hạng 28/30 trong nhóm. Cuối tuần còn trong 4 hạng cuối thì xuống bậc Đồng.')
    expect(cauGiai({ kl: 'sat', thuHang: 29, soNguoi: 30 })).toBe('Giải tuần là bảng thi đua mỗi tuần, 6 bậc từ Sắt lên Kim cương. Con đang ở bậc Sắt (bậc 1/6), hạng 29/30 trong nhóm. Cuối tuần vào top 5 thì lên bậc Đồng.')
    expect(cauGiai({ kl: 'kimcuong', thuHang: 2, soNguoi: 30 })).toBe('Giải tuần là bảng thi đua mỗi tuần, 6 bậc từ Sắt lên Kim cương. Con đang ở bậc Kim cương (bậc cao nhất), hạng 2/30 trong nhóm.')
    expect(cauGiai({ kl: 'vang', thuHang: null, soNguoi: null })).toBe('Giải tuần là bảng thi đua mỗi tuần, 6 bậc từ Sắt lên Kim cương. Con đang ở bậc Vàng (bậc 4/6).')
    expect(cauGiai({ kl: 'sat', thuHang: null, soNguoi: null })).toBe('Giải tuần là bảng thi đua mỗi tuần, 6 bậc từ Sắt lên Kim cương. Con đang ở bậc Sắt (bậc 1/6).')
  })
  it('dòng giải nghĩa nguyên tử: 100% ⇒ nói nguyên tử là gì và câu nào được tính; dưới 100% ⇒ phần còn lại là câu đúng nhờ gợi ý / hỏi thầy; 0% ⇒ kể cả Đối phó', () => {
    expect(cauHocThat(1)).toBe('Mỗi câu làm đúng được nguyên tử. Chỉ câu con tự làm (không xem gợi ý, không hỏi thầy) mới tính vào Giải tuần.')
    expect(cauHocThat(0.9)).toBe('Phần còn lại là câu con làm đúng nhờ xem gợi ý hoặc hỏi thầy, không tính vào Giải tuần.')
    expect(cauHocThat(0)).toContain('Đối phó')
  })
  it('GV: em thiếu tên bị bỏ; hang hai dạng; hocCung chuỗi hoặc đối tượng; bậc ngoài 1…5 ⇒ null; công tắc chỉ nhận bat/tat', () => {
    const d = docThiDua(BANG, '12A1')!
    expect(d.ds.map((e) => [e.ten, e.hang, e.bacDuoi])).toEqual([
      ['Nguyễn Minh Khôi', { kl: 'bac', thuHang: 4 }, 1], ['Trần Gia Bảo', { kl: 'vang', thuHang: 1 }, null], ['Phạm Văn Đức', null, 5],
    ])
    expect(d.ds[1]!.hocCung).toEqual([{ ten: 'Nguyễn Minh Khôi', lop: '', chuoiDoi: null }])
    expect(docEm({ sbd: '9', nguyenTuThat: 1 }, 0)).toBeNull()
    expect(docEm({ ten: 'A', bacDuoi: 7, nhan: 'Lười' }, 0)).toMatchObject({ bacDuoi: null, nhan: null, nguyenTuThat: 0 })
    expect(docThiDua({ ok: true }, '12A1')).toBeNull()
    expect(docCongTac({ congTac: { thuong_giai_tuan: 'tat', thuong_ban_be: true } })).toEqual({ thuong_giai_tuan: false })
    expect(docCongTac({ thuong_kim_cuong: 'bat' })).toEqual({ thuong_kim_cuong: true })
  })
  it('sắp xếp theo cột + cặp học cùng một lần + khoảng tuần', () => {
    const ds = docThiDua(BANG, '12A1')!.ds
    expect(sapXep(ds, 'that', true).map((e) => e.sbd)).toEqual(['2', '1', '3'])
    expect(sapXep(ds, 'loai', true).map((e) => e.sbd)).toEqual(['3', '1', '2'])
    expect(sapXep(ds, 'hang', true).map((e) => e.sbd)).toEqual(['2', '1', '3'])
    expect(sapXep(ds, 'bac', true)[0]!.sbd).toBe('3')
    expect(sapXep(ds, 'ten', false).map((e) => e.ten)).toEqual(['Nguyễn Minh Khôi', 'Phạm Văn Đức', 'Trần Gia Bảo'])
    expect(capHocCung(ds)).toEqual([{ a: 'Nguyễn Minh Khôi', b: 'Trần Gia Bảo', n: 9 }])
    expect(khoangTuan('2026-10-26')).toBe('26/10 – 1/11')
    expect(khoangTuan('tuần 4')).toBe('')
  })
})

describe('PH — thẻ «Tuần này của con» (tp-14)', () => {
  beforeEach(() => {
    document.documentElement.dataset.trong = 'ph'
    window.history.replaceState(null, '', '/?vai=phuhuynh')
  })
  // mỗi lần mở một SBD riêng: DocPh nhớ báo cáo tuần theo SBD trong phiên
  const mo = (sbd = '12121212') => render(<div className="m3"><AppPhuHuynh sbd={sbd} hoTen="Nguyễn Minh Khôi" lop="12A1" onDoiSbd={() => {}} /></div>).container
  it('đủ khối ⇒ 3 ô số + câu giải + % học thật + học cùng; KHÔNG gọi thêm lệnh (bao-cao-tuan đúng 1 lần)', async () => {
    const c = mo()
    await waitFor(() => expect(c.querySelector('[data-vung="tuan-nay"]')).toBeTruthy())
    const t = c.querySelector<HTMLElement>('[data-vung="tuan-nay"]')!
    expect([...t.querySelectorAll('.pd-ba-so > div > span')].map((x) => x.textContent)).toEqual(['Chuỗi ngày', 'Số bài', 'Giải tuần'])
    expect(t.querySelector('.pd-ba-so')!.textContent).toContain('12ngày')
    expect(t.querySelector('.hhg[data-kl="bac"]')?.getAttribute('aria-label')).toBe('Giải Bạc')
    expect(t.querySelector('[data-vung="cau-giai"]')!.textContent).toBe('Giải tuần là bảng thi đua mỗi tuần, 6 bậc từ Sắt lên Kim cương. Con đang ở bậc Bạc (bậc 3/6), hạng 4/30 trong nhóm. Cuối tuần vào top 5 thì lên bậc Vàng.')
    expect(t.querySelector('[data-vung="ti-le-hoc-that"]')!.textContent).toContain('nguyên tử (điểm thưởng) tuần này là từ câu con tự làm đúng')
    expect(t.querySelector('[data-vung="ti-le-hoc-that"] b')!.textContent).toBe('90%')
    expect(t.querySelector('[data-vung="hoc-cung"]')!.textContent).toContain('Trần Gia Bảo')
    expect(c.querySelector('.pd-luoi')!.hasAttribute('data-tuan')).toBe(true)
    expect(goi.filter((x) => x.duong === '/ph/bao-cao-tuan')).toHaveLength(1)
    expect(goi.some((x) => /tuan|thi-dua|thuong/.test(x.duong) && x.duong !== '/ph/bao-cao-tuan')).toBe(false)
  })
  it('thiếu trường ⇒ ẩn ô ấy; thiếu cả khối ⇒ không có thẻ', async () => {
    may['/ph/bao-cao-tuan'] = () => ({ ok: true, soLieu: 'x', duLieu: { ...DU_LIEU, tuan: { soBai: 5 } } })
    const c = mo('12121213')
    await waitFor(() => expect(c.querySelector('[data-vung="tuan-nay"]')).toBeTruthy())
    expect(c.querySelectorAll('[data-vung="tuan-nay"] .pd-ba-so > div')).toHaveLength(1)
    expect(c.querySelector('[data-vung="cau-giai"], [data-vung="ti-le-hoc-that"], [data-vung="hoc-cung"]')).toBeNull()
    cleanup()
    may['/ph/bao-cao-tuan'] = () => ({ ok: true, soLieu: 'x', duLieu: DU_LIEU })
    const c2 = mo('12121214')
    await waitFor(() => expect(c2.querySelector('[data-vung="hom-nay-doc"]')).toBeTruthy())
    await waitFor(() => expect(goi.filter((x) => x.duong === '/ph/bao-cao-tuan')).toHaveLength(2))
    await new Promise((r) => setTimeout(r, 20))
    expect(c2.querySelector('[data-vung="tuan-nay"]')).toBeNull()
  })
})

describe('GV — màn «Thi đua tuần» (tp-15)', () => {
  it('vẽ NGAY bản lưu máy rồi cập nhật từ máy chủ', async () => {
    nhoGhi('lop', '12A1')
    nhoGhi('td:12A1', { lop: '12A1', tuan: '', capNhat: null, ds: [docEm({ sbd: '7', ten: 'Em Cũ', nguyenTuThat: 5 }, 0)] })
    const { container } = render(<ThiDuaTuanScreen />)
    expect(container.querySelector('tr[data-sbd="7"]')).toBeTruthy()
    await waitFor(() => expect(container.querySelector('tr[data-sbd="2"]')).toBeTruthy())
    expect(container.querySelector('tr[data-sbd="7"]')).toBeNull()
    expect(container.querySelector('.tdt-nhan')!.textContent).toBe('12A1 · 3 em · tuần 26/10 – 1/11 · cập nhật 21:05')
  })
  it('bảng: xếp theo nguyên tử học thật, bấm cột đổi chiều; huy hiệu, nhãn, bậc ĐUỔI, cặp học cùng, dải 4 số', async () => {
    const { container } = render(<ThiDuaTuanScreen />)
    await waitFor(() => expect(container.querySelectorAll('.tdt-bang tbody tr')).toHaveLength(3))
    const thuTu = () => [...container.querySelectorAll('.tdt-bang tbody tr')].map((r) => r.getAttribute('data-sbd'))
    expect(thuTu()).toEqual(['2', '1', '3'])
    const cotChuoi = container.querySelector('th[data-cot="chuoi"] button')!
    fireEvent.click(cotChuoi)
    expect(thuTu()).toEqual(['2', '1', '3'])
    fireEvent.click(cotChuoi)
    expect(thuTu()).toEqual(['3', '1', '2'])
    expect(container.querySelector('th[data-cot="chuoi"]')!.getAttribute('aria-sort')).toBe('ascending')
    const duc = container.querySelector('tr[data-sbd="3"]')!
    expect(duc.textContent).toContain('chưa vào bảng')
    expect(within(duc as HTMLElement).getByText('Đối phó').getAttribute('data-m')).toBe('tin')
    expect(within(duc as HTMLElement).getByText('5 · ĐUỔI').getAttribute('data-m')).toBe('sai')
    expect(container.querySelector('tr[data-sbd="2"] .hhg[data-kl="vang"]')).toBeTruthy()
    expect(container.querySelector('[data-vung="cap-hoc-cung"]')!.textContent).toContain('9 ngày')
    expect([...container.querySelectorAll('[data-vung="dai-so"] b')].map((b) => b.textContent)).toEqual(['982cả lớp', '25621%', '1em', '1cặp'])
  })
  it('công tắc: đọc từ máy chủ, đổi phải xác nhận MỘT lần; huỷ ⇒ không gửi; đồng ý ⇒ POST {khoa, giaTri}', async () => {
    render(<ThiDuaTuanScreen />)
    const thangHoa = await screen.findByRole('switch', { name: /Thăng hoa/ })
    await waitFor(() => expect(thangHoa.getAttribute('aria-checked')).toBe('true'))
    xacNhan.mockResolvedValueOnce(false)
    fireEvent.click(thangHoa)
    await waitFor(() => expect(xacNhan).toHaveBeenCalledTimes(1))
    expect(goi.some((g) => g.body)).toBe(false)
    fireEvent.click(thangHoa)
    await waitFor(() => expect(thangHoa.getAttribute('aria-checked')).toBe('false'))
    expect(xacNhan).toHaveBeenCalledTimes(2)
    expect(xacNhan.mock.calls[1]![0]).toMatchObject({ tieuDe: 'Tắt Thăng hoa?', nguyHiem: true })
    expect(goi.filter((g) => g.body)).toEqual([{ duong: '/gv/thuong/cong-tac', body: { khoa: 'thuong_thang_hoa', giaTri: 'tat' } }])
    expect(screen.getAllByRole('switch')).toHaveLength(5) // + «Tạm đóng app học sinh» (27/10)
  })
})

describe('nối vào app thầy + tờ kiểu', () => {
  it('App: một dòng lazy + TEN_MAN + dựng màn; vite: mảnh ngoài precache', () => {
    const app = doc('src/App.tsx')
    expect(app).toContain("const ThiDuaTuanScreen = lazy(() => import('./screens/ThiDuaTuanScreen'))")
    // gộp 26/10 (bù byte /gv): tên màn cho câu báo lỗi lấy từ mục thanh bên (MUC_THI_DUA), màn dựng qua bảng MAN_DON
    expect(doc('src/components/ThanhBenTrai.tsx')).toContain("id: 'thidua', ten: 'Thi đua tuần'")
    expect(app).toContain('tenMucCua(MUC_HOA2_DAY, s)')
    expect(app).toContain('thidua: ThiDuaTuanScreen')
    expect(app).toContain('{ManDon && <ManDon />}')
    expect(doc('vite.config.ts')).toContain("'**/{ThiDuaTuanScreen,thi-dua-tuan-api,HuyHieuGiai}-*.{js,css}'")
  })
  it('CSS: PH dưới [data-trong=ph] trong doc-ph.css (ph-v3.css không đụng); thầy «Trong» dưới [data-trong=\'gv\']; không mã màu thô', () => {
    const ph = doc('src/components/ph-v3/doc-ph.css')
    for (const l of ph.split('\n').filter((x) => /\.(pd-ba-so|pd-ht|pd-ban|pd-av|hhg|g-tuan)/.test(x))) expect(l.trim()).toMatch(/^\[data-trong=ph\]/)
    expect(doc('src/components/ph-v3/ph-v3.css')).not.toMatch(/pd-ba-so|hhg/)
    const tr = doc('src/styles/trong-gv-thi-dua.css').replace(/\/\*[\s\S]*?\*\//g, '')
    for (const l of tr.split('\n').filter((x) => x.includes('{') && !x.trim().startsWith('@media'))) expect(l.trim()).toMatch(/^\[data-trong='gv'\]/)
    for (const t of [ph, tr, doc('src/screens/thi-dua-tuan.css')]) expect(t.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i)
  })
})
