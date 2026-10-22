// ĐỢT 16 — TẤM "HỒ SƠ LÀM BÀI" MỘT CHO BA APP + BẢNG LƯỜI/CHĂM Ở APP PHỤ HUYNH (thầy 12/10):
//   "App ph cũng phải hiển thị lười chăm đầy đủ như app hs" · "đo kĩ hơn nữa thái độ … chính xác hơn 90%" · "số giây hiển thị cho cả việc làm câu dễ khó,
//   chỗ các câu học sinh chưa chữa đc bấm vào phải nảy vào đúng chỗ tự sửa … cho vào box" · "Đồng bộ cho cả app hs gv và ph".
// Kiểm:
//   · số giây ở MỌI lượt — lượt ĐÚNG của câu dễ (Nhận biết) cũng có "12 giây" (dòng lịch sử + hộp câu + khối theo mức độ); không đo được ⇒ "—" có chú thích;
//   · hộp "Chưa sửa được": chế độ học sinh là NÚT gọi onChuaCau(khoá câu); chế độ thầy KHÔNG là nút;
//   · app phụ huynh: thẻ "Nhịp học của con" vẽ từ `/ph/nhip-hoc` (giả), ngôi "con"; lỗi ⇒ câu nói thật + "Tải lại nhịp học"; bấm ⇒ CÙNG tấm, lệnh /ph/*;
//   · độ tin cậy (trường TUỲ CHỌN của làn máy chủ D): chip "Độ tin cậy N%", dưới 90% ⇒ "đang theo dõi" + "Cần thêm"; vắng ⇒ không chip.
// Số từ bộ giả của trang chụp ảnh (scripts/chup-v2/gia). Tên em là tên giả.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { choTamXong, choVaMoGap, moGap } from './_ho-so-6-muc'

const m = vi.hoisted(() => ({ goi: vi.fn() }))
vi.mock('../src/lib/exam-db', () => ({ loadScriptUrl: async () => 'https://gia/exec', loadTeacherSecret: async () => 'mat', loadExamSources: async () => [] }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => m.goi(duong, body) }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu-gia.example.com/', quenDiaChiMayChu: () => {} }))

import type { KetQuaLichSuLamCau, LanLamCau } from '../server/src/lich-su-lam-cau-kieu'
import { hoSoThaiDoGia } from '../scripts/chup-v2/gia/bai-hang-ngay'
import { lichSuGia } from '../scripts/chup-v2/gia/lich-su-lam-cau'
import { NHIP_EM_LUOI } from '../scripts/chup-v2/gia/nhip-hoc-em'
import { banHocSinhHoSoThaiDo, banHocSinhLichSu } from '../server/src/ho-so-em-hs-loc'
import { KHOA_PH_PASS } from '../src/lib/ph-token'
const { default: HoSoLamCauEm, giayCacLan, giayTheoMucDo, chuDoTinCay, soTinHieu } = await import('../src/components/chien-dich/HoSoLamCauEm')
const { default: HoSoCuaEmHs } = await import('../src/components/hoc-tap/HoSoCuaEmHs')
const { default: NhipHocCon } = await import('../src/components/ph-v3/NhipHocCon')
const { doiNgoiCon } = await import('../src/components/hoc-tap/BangNhipHoc')

const SBD = '11010'
const TD = hoSoThaiDoGia(SBD)
const LS = lichSuGia(SBD, TD.em.hoTen)

// Lịch sử nhỏ: câu DỄ (Nhận biết) sai 7 giây rồi ĐÚNG 12 giây; câu KHÓ (Vận dụng cao) sai, không đo được giờ.
const lan = (o: Partial<LanLamCau>): LanLamCau => ({ luc: '2026-10-09T03:00:00Z', ngay: '2026-10-09', qid: 'q5', tieuDe: 'Câu 5 · Gọi tên ester', mucDo: 'biet', noi: 'Đảo', dung: true, chon: 'A', giay: 12, nguonGiay: 'do', coGoiY: false, ...o })
const LAN: LanLamCau[] = [
  lan({}),
  lan({ luc: '2026-10-08T03:00:00Z', ngay: '2026-10-08', dung: false, chon: 'B', giay: 7 }),
  lan({ luc: '2026-10-08T02:00:00Z', ngay: '2026-10-08', qid: 'q40', tieuDe: 'Câu 40 · Hiệu suất ester hoá', mucDo: 'VDC', noi: 'Ca Kiểm tra 15 phút', dung: false, chon: 'C', giay: null, nguonGiay: null }),
]
const LS_NHO: KetQuaLichSuLamCau = {
  ok: true,
  em: { sbd: SBD, hoTen: TD.em.hoTen, lop: '12A1' },
  tong: { soLuot: 3, soDung: 1, soSai: 2, soBoTrong: 0, soCau: 2, soCauSai: 2, giayTb: 10, tongGiay: 19 },
  lan: LAN,
  cauSai: [
    { qid: 'q40', tieuDe: 'Câu 40 · Hiệu suất ester hoá', mucDo: 'VDC', soLan: 1, soSai: 1, soDung: 0, lanCuoiDung: false, lanCuoi: '2026-10-08T02:00:00Z', giaySai: [null] },
    { qid: 'q5', tieuDe: 'Câu 5 · Gọi tên ester', mucDo: 'biet', soLan: 2, soSai: 1, soDung: 1, lanCuoiDung: true, lanCuoi: '2026-10-09T03:00:00Z', giaySai: [7] },
  ],
  conNua: false,
  catBot: false,
}

const goiFetch: { duong: string; body: Record<string, unknown> }[] = []
let traFetch: (duong: string) => { status: number; du: unknown } = () => ({ status: 404, du: { ok: false, error: 'không có' } })
beforeEach(() => {
  goiFetch.length = 0
  m.goi.mockReset()
  localStorage.clear()
  traFetch = () => ({ status: 404, du: { ok: false, error: 'không có' } })
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const duong = new URL(url).pathname
    const body = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>
    goiFetch.push({ duong, body })
    const r = traFetch(duong)
    return new Response(JSON.stringify(r.du), { status: r.status, headers: { 'content-type': 'application/json' } })
  }))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  localStorage.clear()
})

function thayMo(td: unknown = TD, ls: unknown = LS_NHO) {
  m.goi.mockImplementation(async (duong: string) =>
    duong === '/gv/ho-so-thai-do' ? { ok: true, du: td } : duong === '/gv/lich-su-lam-cau' ? { ok: true, du: ls } : { ok: false, loai: 'chua_co_lenh', chu: 'x' },
  )
  render(<HoSoLamCauEm em={{ sbd: SBD, ten: TD.em.hoTen, khoi: '12' }} onDong={() => {}} />)
}

describe('số giây ở MỌI lượt — câu dễ lẫn câu khó, đúng lẫn sai', () => {
  it('phép thuần: số giây từng lần của một câu (cũ → mới) gồm cả lần ĐÚNG; theo mức độ: trung bình chỉ trên lượt có số giây', () => {
    expect(giayCacLan(LS_NHO.cauSai[1]!, LAN)).toEqual({ ds: [{ dung: false, giay: 7, nguon: 'do' }, { dung: true, giay: 12, nguon: 'do' }], truoc: 0 })
    expect(giayCacLan(LS_NHO.cauSai[0]!, LAN)).toEqual({ ds: [{ dung: false, giay: null, nguon: null }], truoc: 0 })
    // câu có lần sai cũ nằm ngoài các lượt đã tải ⇒ lấy số giây sai của máy chủ, lần còn lại "+ N lần khác" (không bịa)
    expect(giayCacLan({ qid: 'qx', giaySai: [30], soLan: 3 }, LAN)).toEqual({ ds: [{ dung: false, giay: 30, nguon: 'khong-ro' }], truoc: 2 })
    const muc = giayTheoMucDo(LAN)
    expect(muc.map((d) => [d.ten, d.giayTb, d.soCoGiay, d.soLuot])).toEqual([
      ['Nhận biết', 10, 2, 2],
      ['Vận dụng cao', null, 0, 1],
    ])
  })

  it('thầy: hộp câu ghi số giây cả lần ĐÚNG ("Đúng 12 giây"); lần không đo được ghi "—" có chú thích; lịch sử có cột số giây ở lượt đúng câu dễ', async () => {
    thayMo()
    const tam = await screen.findByRole('dialog')
    await choTamXong(tam)
    moGap(tam, /^Số giây theo mức độ câu/)
    const hop = [...tam.querySelectorAll('.gvv2-hs-cau')]
    expect(hop).toHaveLength(2)
    expect(hop[0]!.querySelector('.gvv2-hs-cau-giay')!.textContent).toBe('Số giây từng lần (cũ → mới):Sai — chưa đo số giây')
    expect(hop[0]!.querySelector('.hslc-giay[data-chua]')!.getAttribute('title')).toMatch(/chưa đo được số giây/)
    expect(hop[1]!.querySelector('.gvv2-hs-cau-giay')!.textContent).toBe('Số giây từng lần (cũ → mới):Sai 7 giâyĐúng 12 giây')
    // khối "Số giây theo mức độ câu" (dễ → khó)
    const muc = within(tam).getByRole('heading', { name: /^Số giây theo mức độ câu/ }).closest('section')!
    expect([...muc.querySelectorAll('.hslc-muc-dong')].map((d) => d.textContent)).toEqual([
      'Nhận biết10 giâytrung bình mỗi lượt · 2/2 lượt có số giây · đúng 1/2',
      'Vận dụng cao—chưa đo được số giây · 0/1 lượt có số giây · đúng 0/1',
    ])
    const dong = [...tam.querySelectorAll('.gvv2-hs-lan')].map((l) => l.textContent)
    expect(dong[0]).toBe('10:00Câu 5 · Gọi tên esterĐảo · Nhận biết · Chọn AĐúng12 giây')
    expect(dong[2]).toBe('09:00Câu 40 · Hiệu suất ester hoáCa Kiểm tra 15 phút · Vận dụng cao · Chọn CSai— chưa đo số giây')
  })
})

describe('hộp "Chưa sửa được"', () => {
  // SỬA CÓ CHỦ ĐÍCH 13/10 (đợt 18 — thầy: "những câu chưa sửa lỗi mà có trong tự sửa lỗi mới hiện sửa câu này, nếu chưa có thì chưa hiện"):
  // hộp chưa sửa chỉ là nút "Sửa câu này" khi câu đang ở danh sách Tự sửa lỗi (máy chủ giả trả mọi câu chưa sửa TRỪ câu cuối ⇒ câu cuối là hộp thường);
  // bỏ chữ gợi ý "Bấm một câu…", thay bằng dòng mời có số câu.
  it('học sinh: lưới hộp, mỗi hộp chưa sửa là MỘT nút gọi onChuaCau(khoá câu của lệnh lịch sử); hộp đã sửa không là nút', async () => {
    const chuaThat = LS.cauSai.filter((c) => !c.lanCuoiDung)
    expect(chuaThat.length).toBeGreaterThan(1)
    const ds = chuaThat.slice(0, -1).map((c) => ({ qid: c.qid, trangThai: 'can_chan_doan' }))
    traFetch = (d) =>
      d.endsWith('/chua-cau-sai/co')
        ? { status: 200, du: { ok: true } }
        : d.endsWith('/chua-cau-sai/danh-sach')
          ? { status: 200, du: { ok: true, ds } }
          : { status: 200, du: d === '/hs/ho-so-thai-do' ? banHocSinhHoSoThaiDo(TD) : banHocSinhLichSu(LS) }
    const onChuaCau = vi.fn()
    render(<HoSoCuaEmHs token="tk-em" tenEm="Nguyễn Minh Anh" lop="12A1" onDong={() => {}} onChuaCau={onChuaCau} />)
    const tam = await screen.findByRole('dialog')
    await choTamXong(tam)
    const banEm = banHocSinhLichSu(LS)
    const chua = banEm.cauSai.filter((c) => !c.lanCuoiDung)
    const nut = await within(tam).findAllByRole('button', { name: /^Sửa câu này: / })
    expect(nut).toHaveLength(chua.length - 1)
    expect(nut[0]!.getAttribute('aria-label')).toBe(`Sửa câu này: ${chua[0]!.tieuDe}`)
    expect(tam.querySelector('.hslc-cs-moi')!.textContent).toBe(`${chua.length - 1} câu đang chờ em tự sửa`)
    expect(tam.textContent).not.toMatch(/Bấm một câu/)
    const hopCuoi = [...tam.querySelectorAll('.hslc-cs-nhom[data-loai="chua"] .hslc-o')].at(-1)!
    expect(hopCuoi.querySelector('button')).toBeNull()
    fireEvent.click(nut[0]!)
    // khoá MỞ Tự sửa lỗi "g<số>" (hàm đọc lịch sử nay giữ `moChua`; trước đây bỏ ⇒ gửi khoá "c<số>" không khớp được câu nào)
    expect(chua[0]!.moChua).toMatch(/^g\d+$/)
    expect(onChuaCau).toHaveBeenCalledWith(chua[0]!.moChua)
    // hộp đã sửa: không nút
    const da = tam.querySelectorAll('.hslc-cs-nhom[data-loai="da"] .hslc-o')
    for (const h of da) expect(h.querySelector('button')).toBeNull()
    // không mã nội bộ trên màn em
    expect(tam.textContent).not.toMatch(/DH-12-|c\d+\b/)
  })

  it('thầy: hộp KHÔNG là nút (không đường vào Tự chữa) dù có truyền onChuaCau', async () => {
    m.goi.mockImplementation(async (duong: string) => (duong === '/gv/ho-so-thai-do' ? { ok: true, du: TD } : { ok: true, du: LS_NHO }))
    const onChuaCau = vi.fn()
    render(<HoSoLamCauEm em={{ sbd: SBD, ten: TD.em.hoTen, khoi: '12' }} onDong={() => {}} onChuaCau={onChuaCau} />)
    const tam = await screen.findByRole('dialog')
    await choTamXong(tam)
    const hop = tam.querySelector('.hslc-cs-nhom[data-loai="chua"] .hslc-o')!
    expect(hop.querySelector('button')).toBeNull()
    expect(hop.querySelector('.hslc-o-than')).toBeTruthy()
    expect(within(tam).queryByRole('button', { name: /^(Tự chữa|Sửa) câu này/ })).toBeNull()
  })
})

describe('app phụ huynh — thẻ "Nhịp học của con" + CÙNG tấm hồ sơ', () => {
  it('vẽ từ /ph/nhip-hoc (SBD trong thân lệnh), ngôi "con"; bấm ⇒ tấm chế độ phụ huynh gọi /ph/ho-so-thai-do + /ph/lich-su-lam-cau', async () => {
    traFetch = (d) =>
      d === '/ph/nhip-hoc'
        ? { status: 200, du: NHIP_EM_LUOI }
        : d === '/ph/ho-so-thai-do'
          ? { status: 200, du: banHocSinhHoSoThaiDo(TD) }
          : d === '/ph/lich-su-lam-cau'
            ? { status: 200, du: banHocSinhLichSu(LS) }
            : { status: 404, du: {} }
    const { container } = render(<NhipHocCon sbd="12121212" tenCon="Nguyễn Minh Anh" lop="12A1" />)
    const the = await waitFor(() => {
      const x = container.querySelector('[data-vung="nhip-hoc-con"]')
      expect(x).toBeTruthy()
      return x as HTMLElement
    })
    expect(within(the).getByRole('heading', { name: 'Nhịp học của con' })).toBeTruthy()
    expect(the.querySelector('.ph3-nhip__nhom')!.textContent).toBe('Lười')
    expect(the.textContent).toContain('Ra khỏi nhóm Lười:')
    expect(the.textContent).toMatch(/con đang có \d\/6 ngày/)
    expect(the.textContent).not.toMatch(/\bem\b/)
    expect(the.textContent).toContain('Con và thầy cùng thấy bảng này.')
    expect(goiFetch.find((g) => g.duong === '/ph/nhip-hoc')!.body).toEqual({ sbd: '12121212' })
    fireEvent.click(within(the).getByRole('button', { name: 'Xem hồ sơ làm bài của con' }))
    const tam = await screen.findByRole('dialog')
    await choTamXong(tam)
    await choVaMoGap(tam)
    expect(within(tam).getByRole('heading', { level: 2 }).textContent).toBe('Hồ sơ làm bài của con')
    expect(within(tam).getByText(/^Nhịp học của con ·/)).toBeTruthy()
    expect([...tam.querySelectorAll('.hsv-gap summary')].map((x) => x.firstChild?.textContent)).toContain('Toàn bộ sổ của con')
    expect(within(tam).getByRole('heading', { name: /^Lượt sai gần đây/ })).toBeTruthy()
    expect(within(tam).getByRole('button', { name: 'Xem mọi lượt của con' })).toBeTruthy()
    expect(within(tam).queryByRole('button', { name: /Mở hồ sơ đầy đủ|^Tự chữa/ })).toBeNull()
    expect(tam.textContent).not.toMatch(/SBD|Kho thiếu|Kiến thức cần bổ sung/)
    expect(goiFetch.map((g) => g.duong).filter((d) => d !== '/ph/nhip-hoc').sort()).toEqual(['/ph/ho-so-thai-do', '/ph/lich-su-lam-cau'])
  })

  it('máy lưu liên kết riêng ⇒ thân lệnh {pass}, không SBD', async () => {
    localStorage.setItem(KHOA_PH_PASS, 'ma-lien-ket-gia')
    traFetch = () => ({ status: 200, du: NHIP_EM_LUOI })
    const { container } = render(<NhipHocCon sbd="12121212" tenCon="Nguyễn Minh Anh" />)
    await waitFor(() => expect(container.querySelector('[data-vung="nhip-hoc-con"]')).toBeTruthy())
    expect(goiFetch[0]!.body).toEqual({ pass: 'ma-lien-ket-gia' })
  })

  it('lỗi (máy chủ chưa có lệnh 404) ⇒ "Chưa tải được nhịp học của con." + lý do thật + "Tải lại nhịp học"; tải lại được thì hiện bảng', async () => {
    const { container } = render(<NhipHocCon sbd="12121212" tenCon="Nguyễn Minh Anh" />)
    const loi = await waitFor(() => {
      const x = container.querySelector('[data-vung="nhip-con-loi"]')
      expect(x).toBeTruthy()
      return x as HTMLElement
    })
    expect(loi.textContent).toContain('Chưa tải được nhịp học của con. Máy chủ chưa có hồ sơ làm bài cho phụ huynh')
    expect(container.querySelector('.ht2-hn-dai')).toBeNull() // không số giả
    traFetch = () => ({ status: 200, du: NHIP_EM_LUOI })
    fireEvent.click(within(loi).getByRole('button', { name: 'Tải lại nhịp học' }))
    await waitFor(() => expect(container.querySelector('[data-vung="nhip-hoc-con"]')).toBeTruthy())
    // lỗi máy chủ (500, { ok:false, error }) ⇒ giữ lời máy chủ
    cleanup()
    traFetch = () => ({ status: 500, du: { ok: false, error: 'Máy chủ đang bận.' } })
    const b = render(<NhipHocCon sbd="12121212" tenCon="Nguyễn Minh Anh" />)
    await waitFor(() => expect(b.container.querySelector('[data-vung="nhip-con-loi"]')?.textContent).toContain('Chưa tải được nhịp học của con. Máy chủ đang bận.'))
  })

  it('bảng có độ tin cậy (trường tuỳ chọn) dưới 90% ⇒ "Kết luận tạm, đang theo dõi" + câu cần thêm, ngôi "con"', async () => {
    traFetch = () => ({ status: 200, du: { ...NHIP_EM_LUOI, doTinCay: 72, canThem: 'cần thêm 3 ngày em làm bài để chắc.' } })
    const { container } = render(<NhipHocCon sbd="12121212" tenCon="Nguyễn Minh Anh" />)
    await waitFor(() => expect(container.querySelector('.ht2-hn-tin')).toBeTruthy())
    const tin = container.querySelector('.ht2-hn-tin')!
    expect(tin.getAttribute('data-du')).toBe('false')
    // câu máy chủ đã mở đầu "cần …" ⇒ không lặp "Cần thêm: cần thêm"
    expect(tin.textContent).toBe('Độ tin cậy 72%Kết luận tạm, đang theo dõi. Cần thêm 3 ngày con làm bài để chắc.')
  })
})

describe('độ tin cậy trên tấm (trường tuỳ chọn của máy chủ)', () => {
  it('có ⇒ chip "Độ tin cậy N%" ở đầu tấm + từng tín hiệu; dưới 90% ⇒ "đang theo dõi" + "Cần thêm"; cách tính + "Tự sửa được"', async () => {
    const td = {
      ...TD,
      ketLuan: { ...TD.ketLuan, doTinCay: 86, canThem: 'ít nhất 3 ngày làm bài nữa.' },
      tinHieu: TD.tinHieu.map((t, i) => (i === 0 ? { ...t, doTinCay: 95 } : i === 1 ? { ...t, doTinCay: 60 } : t)),
      cachTinhTinCay: 'Tính từ số ngày và số lượt đã đo.',
      tuSuaSai: { soCauSai: 6, soCauDaSua: 4, phanTram: 67, chu: 'Đã làm đúng lại 4/6 câu từng sai (67%)' }, // đúng hợp đồng máy chủ làn D
    }
    thayMo(td)
    const tam = await screen.findByRole('dialog')
    await choTamXong(tam)
    await choVaMoGap(tam)
    const dau = await waitFor(() => {
      const x = tam.querySelector('.hslc-hero')
      expect(x).toBeTruthy()
      return x as HTMLElement
    })
    expect(dau.querySelector('.hslc-tin')!.textContent).toBe('Độ tin cậy 86% · đang theo dõi')
    expect(dau.querySelector('.hslc-tin')!.getAttribute('data-du')).toBe('false')
    expect(dau.querySelector('.hslc-tam')!.textContent).toBe('Kết luận tạm, đang theo dõi. Cần thêm: ít nhất 3 ngày làm bài nữa.') // SỬA CÓ CHỦ ĐÍCH 13/10 (đợt 18): bỏ dấu gạch dài, cùng chữ bảng Nhịp học
    expect(within(dau).getByText('Cách tính độ tin cậy')).toBeTruthy()
    const th = [...tam.querySelectorAll('.gvv2-tdo-th-o')]
    expect(th[0]!.querySelector('.hslc-tin')!.textContent).toBe('Độ tin cậy 95%')
    expect(th[1]!.querySelector('.hslc-tin')!.textContent).toBe('Độ tin cậy 60% · đang theo dõi')
    expect(th[2]!.querySelector('.hslc-tin')).toBeNull()
    expect([...tam.querySelectorAll('.gvv2-tdo-o')].map((o) => o.textContent)).toContain('Tự sửa được4/6 câuĐã làm đúng lại 4/6 câu từng sai (67%)')
  })

  it('13/10: có nhóm Nhịp học ⇒ chip cạnh tên nhóm lấy độ tin cậy CỦA NHÓM (`tinCayNhom`), không mượn số của nhãn thái độ; nhóm không kèm số ⇒ không chip', async () => {
    const td = { ...TD, nhomNhip: 'luoi', chuoiDuGanNhat: 1, ketLuan: { ...TD.ketLuan, doTinCay: 61, canThem: 'ít nhất 5 ngày làm bài nữa.' }, tinCayNhom: { doTinCay: 93 } }
    thayMo(td)
    const tam = await screen.findByRole('dialog')
    await choVaMoGap(tam)
    const dau = await waitFor(() => { const x = tam.querySelector('.hslc-hero'); expect(x).toBeTruthy(); return x as HTMLElement })
    expect(dau.querySelector('.hslc-tin')!.textContent).toBe('Độ tin cậy 93%')
    expect(dau.querySelector('.hslc-tam')).toBeNull()
    cleanup()
    thayMo({ ...td, tinCayNhom: undefined })
    const tam2 = await screen.findByRole('dialog')
    await choVaMoGap(tam2)
    const dau2 = await waitFor(() => { const x = tam2.querySelector('.hslc-hero'); expect(x).toBeTruthy(); return x as HTMLElement })
    expect(dau2.querySelector('.hslc-tin')).toBeNull()
    expect(dau2.textContent).not.toContain('61%')
  })

  it('vắng ⇒ không chip, không "đang theo dõi" (máy chủ cũ y như trước); chữ độ tin không bao giờ 100%', async () => {
    thayMo()
    const tam = await screen.findByRole('dialog')
    await choTamXong(tam)
    await choVaMoGap(tam)
    await waitFor(() => expect(tam.querySelector('.hslc-hero')).toBeTruthy())
    expect(tam.querySelector('.hslc-tin, .hslc-tam, .hslc-cach')).toBeNull()
    expect(chuDoTinCay(100)).toBe('Độ tin cậy 99%')
    expect(soTinHieu({ ma: 'xu-huong', giaTri: -12 })).toBe('−12 điểm %')
    expect(soTinHieu({ ma: 'qua-nhanh', giaTri: null })).toBe('—')
  })

  it('đổi ngôi cho phụ huynh: chỉ cả từ "em"', () => {
    expect(doiNgoiCon('Em đang ở ngoài nhóm Lười; hôm nay em xem lại đề')).toBe('Con đang ở ngoài nhóm Lười; hôm nay con xem lại đề')
  })
})
