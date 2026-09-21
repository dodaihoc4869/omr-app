// BẢNG "MỌI THỨ VỀ CON" KIỂU APPLE — phần B: DÒNG THỜI GIAN + TỪNG CÂU (src/components/ph-moi/bang/{nhom-cau.ts,DongThoiGian.tsx,TungCau.tsx}). Mẫu thầy chốt: docs/ban-ve-ph-apple-2109/ph-d + ph-e.
// Khoá: đủ dữ liệu / thiếu trường ⇒ ẩn; gom câu theo `lan` (thiếu ⇒ thuật toán cũ); cờ làm lâu máy chủ đứng trên ngưỡng dự phòng; câu/mốc BỊ CHE không lộ đúng-sai, đáp án, đề; lọc Sai/Làm lâu/Chưa công bố; danh sách dài dựng theo nhóm mở;
// mở câu ⇒ hỏi máy chủ (taiChiTietCau) đúng một lần, có trạng thái đang tải / lỗi thật / bị từ chối; lời giải chỉ khi có qid + máy chủ trả; bấm một lần ở dòng thời gian ⇒ mở + cuộn tới nhóm.
import { useMemo, useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, renderHook, waitFor } from '@testing-library/react'
import { DongThoiGian, coDongThoiGian } from '../src/components/ph-moi/bang/DongThoiGian'
import { TungCau, coTungCau, useNhomMo } from '../src/components/ph-moi/bang/TungCau'
import { NGUONG_LAM_LAU_GIAY, NGUONG_NHOM_LAZY, SO_CAU_XEM_TRUOC, chuKetQuaChe, chuNguongLamLau, gomNhomCau, laChe, laLamLau, laNhomChe, laSai, nhomMoSan, phutTheoGio, tachChuCai } from '../src/components/ph-moi/bang/nhom-cau'
import { docChiTietCau, docTatCaVeCon, type PhMoi } from '../src/lib/ph-moi/du-lieu'
import { taiChiTietCau } from '../src/lib/ph-moi/api'
import { CHI_TIET, H, PH_OK } from './_ph-moi/du-lieu-mau'
import { PH_APPLE, PH_APPLE_THUA } from './_ph-moi/du-lieu-mau-apple'

vi.mock('../src/lib/ph-moi/api', () => ({ taiChiTietCau: vi.fn() }))
const goiChiTiet = vi.mocked(taiChiTietCau)
const nhan = <T,>(o: T): T => JSON.parse(JSON.stringify(o))
const pmOf = (raw: unknown = PH_APPLE): PhMoi => docTatCaVeCon(raw)!
const CT_OK = docChiTietCau(CHI_TIET)!
const CAM_GAME = /thần thú|khiên|Võ đài|Đảo thần thú|Linh Tâm|Đoàn Hộ Tống|\bEXP\b/i

/** Vỏ thử: giữ trạng thái mở nhóm dùng chung như vỏ thật. */
function Bang({ pm, sbd = '12121212', khoiTao = [], chiTung = false, chiDong = false }: { pm: PhMoi; sbd?: string; khoiTao?: string[]; chiTung?: boolean; chiDong?: boolean }) {
  const nhom = useMemo(() => gomNhomCau(pm), [pm])
  const { mo, batMo, dongMo } = useNhomMo(khoiTao)
  const [lan, setLan] = useState<string | null>(null)
  return (
    <div className="m3 phm-goc">
      {!chiTung && <DongThoiGian pm={pm} nhom={nhom} onChonMoc={setLan} />}
      {!chiDong && <TungCau pm={pm} nhom={nhom} sbd={sbd} nhomMo={mo} batMo={batMo} dongMo={dongMo} lanBay={lan} />}
    </div>
  )
}
const nhomTheoId = (c: HTMLElement, id: string) => c.querySelector<HTMLElement>(`#${id}`)!
const hangCau = (n: HTMLElement) => [...n.querySelectorAll<HTMLElement>('li.phm-cau')]
// jsdom + KaTeX (MathML không có .style) làm getByRole(name) sập khi dòng câu đang mở ⇒ tìm nút theo CHỮ.
const nutTheoChu = (pham: HTMLElement, chu: string | RegExp) => [...pham.querySelectorAll<HTMLElement>('button')].find((b) => (typeof chu === 'string' ? b.textContent === chu : chu.test(b.textContent ?? '')))
const bam = (pham: HTMLElement, chu: string | RegExp) => {
  const b = nutTheoChu(pham, chu)
  if (!b) throw new Error(`Không thấy nút ${String(chu)}`)
  fireEvent.click(b)
}
const chuNut = (c: HTMLElement) => [...c.querySelectorAll('.phm-seg button')].map((b) => b.textContent)

beforeEach(() => {
  goiChiTiet.mockReset()
  HTMLElement.prototype.scrollIntoView = vi.fn()
})
afterEach(() => {
  cleanup()
  // @ts-expect-error dọn hàm giả
  delete HTMLElement.prototype.scrollIntoView
})

describe('nhom-cau.ts — phần thuần', () => {
  it('gomNhomCau theo `lan` máy chủ: 6 · 12 · 5 · 9 · 6; câu che vào mốc che; mốc mang che + soCauDaLam', () => {
    const n = gomNhomCau(pmOf())
    expect(n.map((x) => x.cau.length)).toEqual([6, 12, 5, 9, 6])
    expect(n.map((x) => x.id)).toEqual(['moc-1', 'moc-2', 'moc-3', 'moc-4', 'moc-5'])
    expect(n[4]!.che).toBe('chua_nop')
    expect(n[4]!.soCauDaLam).toBe(6)
    expect(n[0]!.che).toBeNull()
    expect(n[4]!.cau.every(laChe)).toBe(true)
  })

  it('`lan` hợp lệ ĐỨNG TRÊN thuật toán cũ; `lan` ngoài khoảng / âm / thiếu ⇒ rơi về thuật toán cũ (cùng nguồn, gần nhất trước)', () => {
    const raw = nhan(PH_APPLE)
    // một câu btvn (mốc thứ 2) nhưng máy chủ nói lần thứ 0 ⇒ theo máy chủ
    const c = raw.homNay.cau.find((x: { nguon: string }) => x.nguon === 'btvn')
    c.lan = 0
    let n = gomNhomCau(pmOf(raw))
    expect(n.map((x) => x.cau.length)).toEqual([7, 11, 5, 9, 6])
    // lan hỏng ⇒ về mốc btvn như thuật toán cũ
    c.lan = 99
    n = gomNhomCau(pmOf(raw))
    expect(n.map((x) => x.cau.length)).toEqual([6, 12, 5, 9, 6])
    c.lan = -1
    n = gomNhomCau(pmOf(raw))
    expect(n.map((x) => x.cau.length)).toEqual([6, 12, 5, 9, 6])
    // bộ CŨ (không có lan nào): 6 · 12 · 5 · 9 · 6, và bỏ hẳn dòng thời gian ⇒ nhóm riêng theo nguồn
    expect(gomNhomCau(pmOf(PH_OK)).map((x) => x.cau.length)).toEqual([6, 12, 5, 9, 6])
    const cu = nhan(PH_OK)
    delete cu.homNay.dongThoiGian
    expect(gomNhomCau(pmOf(cu)).map((x) => x.ten)).toEqual(['Ôn lại câu đến lịch', 'Bài tập về nhà', 'Thử thách riêng hôm nay', 'Luyện dạng con còn vấp', 'Gói gia đình giao'])
    expect(gomNhomCau(pmOf(cu)).map((x) => x.id)).toEqual(['moc-r-on_lai', 'moc-r-btvn', 'moc-r-thu_thach_rieng', 'moc-r-luyen_dang_vap', 'moc-r-gia_dinh_giao'])
  })

  it('laLamLau: cờ máy chủ đứng trên ngưỡng dự phòng; thiếu cờ ⇒ giây ≥ ngưỡng (120); không có giây ⇒ không lâu', () => {
    expect(NGUONG_LAM_LAU_GIAY).toBe(120)
    const c = (giay: number | null, lamLau: boolean | null) => ({ kieu: 'thuong', luc: H(7), nguon: 'on_lai', tenDang: '', de: 'x', conChon: '', dapAn: '', dung: true, giay, coLoiGiai: false, qid: '', lamLau, lan: null }) as const
    expect(laLamLau(c(500, false))).toBe(false)
    expect(laLamLau(c(10, true))).toBe(true)
    expect(laLamLau(c(119, null))).toBe(false)
    expect(laLamLau(c(120, null))).toBe(true)
    expect(laLamLau(c(null, null))).toBe(false)
    expect(chuNguongLamLau()).toBe('Làm lâu: từ 2 phút trở lên một câu')
  })

  it('phutTheoGio: mốc chia theo phần thật của từng giờ; vắt qua nửa đêm bỏ phần sau; tổng bằng tổng phút', () => {
    const g = phutTheoGio(pmOf().dongThoiGian!)
    expect(g[6]).toBe(7)
    expect(g[17]).toBe(21)
    expect(g[19]).toBe(6)
    expect(g[20]).toBe(18)
    expect(g.reduce((a, b) => a + b, 0)).toBe(52)
    const chia = phutTheoGio([{ batDau: H(20, 50), phut: 20 }])
    expect([chia[20], chia[21]]).toEqual([10, 10])
    expect(phutTheoGio([{ batDau: H(23, 50), phut: 30 }])[23]).toBe(10)
    expect(phutTheoGio([{ batDau: H(23, 50), phut: 30 }]).reduce((a, b) => a + b, 0)).toBe(10)
    expect(phutTheoGio([])).toHaveLength(24)
  })

  it('chuKetQuaChe: có số câu ⇒ "Con đã làm N câu"; không có (null/0) ⇒ bỏ số; hai lý do che', () => {
    expect(chuKetQuaChe('chua_nop', 6)).toBe('Con đã làm 6 câu · kết quả hiện sau khi con nộp bài')
    expect(chuKetQuaChe('chua_cong_bo', 3)).toBe('Con đã làm 3 câu · kết quả hiện khi Thầy công bố điểm')
    expect(chuKetQuaChe('chua_nop', null)).toBe('Con đã làm · kết quả hiện sau khi con nộp bài')
    expect(chuKetQuaChe('chua_nop', 0)).toBe('Con đã làm · kết quả hiện sau khi con nộp bài')
  })

  it('nhomMoSan: ≤ 40 câu ⇒ nhóm mới nhất có câu; > 40 ⇒ không mở; tachChuCai: chỉ chữ phương án A–D', () => {
    const n = gomNhomCau(pmOf())
    expect(nhomMoSan(n)).toEqual(['moc-5'])
    const dai = nhan(PH_APPLE)
    for (let i = 0; i < 5; i++) dai.homNay.cau.push({ ...dai.homNay.cau[0], luc: H(6, 50 + i), qid: `x-${i}` })
    const pmDai = pmOf(dai)
    expect(pmDai.cau!.length).toBeGreaterThan(NGUONG_NHOM_LAZY)
    expect(nhomMoSan(gomNhomCau(pmDai))).toEqual([])
    expect(nhomMoSan(gomNhomCau({ dongThoiGian: null, cau: null }))).toEqual([])
    expect(tachChuCai('B')).toEqual(['B'])
    expect(tachChuCai('a, c')).toEqual(['A', 'C'])
    expect(tachChuCai('AC')).toEqual(['A', 'C'])
    expect(tachChuCai('Sai')).toEqual([])
    expect(tachChuCai('2,75')).toEqual([])
    expect(tachChuCai('ĐSĐS')).toEqual([])
  })
})

describe('useNhomMo', () => {
  it('mở sẵn theo khoiTao; batMo/dongMo tạo tập MỚI, lặp lại không đổi gì', () => {
    const { result } = renderHook(() => useNhomMo(['moc-2']))
    expect([...result.current.mo]).toEqual(['moc-2'])
    const truoc = result.current.mo
    act(() => result.current.batMo('moc-2'))
    expect(result.current.mo).toBe(truoc) // đã mở: không tạo tập mới
    act(() => result.current.batMo('moc-4'))
    expect([...result.current.mo].sort()).toEqual(['moc-2', 'moc-4'])
    expect(result.current.mo).not.toBe(truoc)
    act(() => result.current.dongMo('moc-2'))
    expect([...result.current.mo]).toEqual(['moc-4'])
    const giua = result.current.mo
    act(() => result.current.dongMo('khong-co'))
    expect(result.current.mo).toBe(giua)
    expect([...renderHook(() => useNhomMo()).result.current.mo]).toEqual([])
  })
})

describe('DongThoiGian', () => {
  it('đủ dữ liệu: số lần, dài nhất, tổng, biểu đồ 24 giờ, 5 lần theo mẫu ph-d', () => {
    const { container } = render(<Bang pm={pmOf()} chiDong />)
    const muc = container.querySelector('#muc-thoi-gian')!
    expect(muc.querySelector('h2')!.textContent).toBe('Dòng thời gian trong ngày')
    expect(muc.querySelector('.phm-muc__dau p')!.textContent).toBe('chạm một lần ngồi học để xem từng câu')
    expect(muc.querySelector('.phm-so-to b')!.textContent).toBe('5lần ngồi học')
    expect(muc.querySelector('.phm-so-to > span')!.textContent).toBe('dài nhất 21 phút · tổng 52 phút')
    const bieu = muc.querySelector('.phm-bieu.phm-gio')!
    expect(bieu.getAttribute('role')).toBe('img')
    expect(bieu.getAttribute('aria-label')).toBe('Số phút con học theo từng giờ trong ngày: 6 giờ 7 phút, 17 giờ 21 phút, 19 giờ 6 phút, 20 giờ 18 phút')
    expect(bieu.querySelectorAll('ol > li')).toHaveLength(24)
    expect([...bieu.querySelectorAll('ol > li i')].map((i) => (i as HTMLElement).style.getPropertyValue('--c'))).toEqual(['7', '21', '6', '18'])
    expect([...bieu.querySelectorAll('ol > li[data-moc] > span')].map((s) => s.textContent)).toEqual(['0 giờ', '6 giờ', '12 giờ', '18 giờ'])
    expect([...bieu.querySelectorAll('.phm-bieu__luoi em')].map((e) => e.textContent)).toEqual(['30 phút', '15 phút', '0'])
    expect(muc.querySelector('.phm-gio__loi')!.textContent).toBe('1 lần buổi sáng, 1 lần buổi chiều, 3 lần buổi tối.')
    const lan = [...muc.querySelectorAll('ol.phm-lan > li')]
    expect(lan).toHaveLength(5)
    expect(lan[0]!.querySelector('h3')!.textContent).toBe('Ôn lại 6 câu đến lịch')
    expect(lan[0]!.querySelector('p')!.textContent).toBe('06:40 · 6 câu · đúng 5 · 7 phút')
    expect(lan[0]!.querySelector('a')!.getAttribute('aria-label')).toBe('06:40, Ôn lại 6 câu đến lịch: 6 câu, đúng 5, 7 phút. Xem từng câu của lần này')
    expect(lan[0]!.querySelector('.phm-thanh')!.getAttribute('aria-label')).toBe('đúng 5 trong 6 câu')
    expect(lan[1]!.querySelector('h3')!.textContent).toBe('Bài tập về nhà “Ester – Lipid”')
    expect(lan[1]!.querySelector('p')!.textContent).toBe('17:12 · 12 câu · đúng 9 · 21 phút · nộp đúng nhịp')
    expect(lan[3]!.querySelector('p')!.textContent).toBe('20:10 · 9 câu · đúng 7 · 11 phút')
    for (const li of lan) expect(li.querySelector('.phm-o-bt svg')).toBeTruthy()
    expect(container.textContent).not.toMatch(CAM_GAME)
  })

  it('lần bị che: chỉ "Con đã làm N câu · kết quả hiện sau…", KHÔNG thanh đúng, KHÔNG số đúng; không N ⇒ bỏ số; lý do chờ Thầy', () => {
    const { container, rerender } = render(<Bang pm={pmOf()} chiDong />)
    const lan5 = () => container.querySelectorAll('ol.phm-lan > li')[4] as HTMLElement
    expect(lan5().querySelector('h3')!.textContent).toBe('Gia đình giao thêm · 6 câu')
    expect(lan5().querySelector('p')!.textContent).toBe('20:40 · Con đã làm 6 câu · kết quả hiện sau khi con nộp bài')
    expect(lan5().querySelector('.phm-thanh')).toBeNull()
    expect(lan5().textContent).not.toMatch(/đúng|sai/i)
    expect(lan5().querySelector('.phm-o-bt')!.getAttribute('data-mau')).toBe('xam')
    const raw = nhan(PH_APPLE)
    delete raw.homNay.dongThoiGian[4].soCauDaLam
    rerender(<Bang pm={pmOf(raw)} chiDong />)
    expect(lan5().querySelector('p')!.textContent).toBe('20:40 · Con đã làm · kết quả hiện sau khi con nộp bài')
    raw.homNay.dongThoiGian[4].che = 'chua_cong_bo'
    raw.homNay.dongThoiGian[4].soCauDaLam = 3
    // dù JSON lỡ mang số đúng/số câu của mốc che, màn không lộ
    raw.homNay.dongThoiGian[4].soCau = 6
    raw.homNay.dongThoiGian[4].soDung = 5
    rerender(<Bang pm={pmOf(raw)} chiDong />)
    expect(lan5().querySelector('p')!.textContent).toBe('20:40 · Con đã làm 3 câu · kết quả hiện khi Thầy công bố điểm')
    expect(lan5().textContent).not.toMatch(/đúng 5|5 trong 6/)
  })

  it('thiếu trường ⇒ tự đếm từ mốc; một lần ⇒ bỏ "dài nhất"; số của tổng quan đứng trên số đếm', () => {
    const raw = nhan(PH_OK) // bộ CŨ: không soLanHoc / lanDaiNhatPhut
    const { container, rerender } = render(<Bang pm={pmOf(raw)} chiDong />)
    expect(container.querySelector('.phm-so-to b')!.textContent).toBe('5lần ngồi học')
    expect(container.querySelector('.phm-so-to > span')!.textContent).toBe('dài nhất 21 phút · tổng 52 phút')
    delete raw.homNay.tongQuan.phutHoc
    rerender(<Bang pm={pmOf(raw)} chiDong />)
    expect(container.querySelector('.phm-so-to > span')!.textContent).toBe('dài nhất 21 phút · tổng 52 phút') // cộng phút các mốc
    raw.homNay.dongThoiGian = raw.homNay.dongThoiGian.slice(0, 1)
    rerender(<Bang pm={pmOf(raw)} chiDong />)
    expect(container.querySelector('.phm-so-to b')!.textContent).toBe('1lần ngồi học')
    expect(container.querySelector('.phm-so-to > span')!.textContent).toBe('tổng 7 phút')
    expect(container.querySelector('.phm-gio__loi')!.textContent).toBe('1 lần buổi sáng.')
    const ap = nhan(PH_APPLE)
    ap.homNay.tongQuan.soLanHoc = 7
    ap.homNay.tongQuan.lanDaiNhatPhut = 25.4
    ap.homNay.tongQuan.phutHoc = 60.2
    rerender(<Bang pm={pmOf(ap)} chiDong />)
    expect(container.querySelector('.phm-so-to b')!.textContent).toBe('7lần ngồi học')
    expect(container.querySelector('.phm-so-to > span')!.textContent).toBe('dài nhất 25 phút · tổng 60 phút')
  })

  it('giờ nào học hơn 30 phút ⇒ trục nâng lên 60 (nhãn trục đổi, cột giữ đúng tỉ lệ)', () => {
    const raw = nhan(PH_APPLE)
    raw.homNay.dongThoiGian = [{ batDau: H(19, 0), nguon: 'on_lai', soCau: 9, soDung: 8, phut: 45 }]
    raw.homNay.cau = []
    delete raw.homNay.tongQuan.soLanHoc
    const { container } = render(<Bang pm={pmOf(raw)} chiDong />)
    expect([...container.querySelectorAll('.phm-bieu__luoi em')].map((e) => e.textContent)).toEqual(['60 phút', '30 phút', '0'])
    expect((container.querySelector('.phm-gio ol li i') as HTMLElement).style.getPropertyValue('--c')).toBe('22.5')
    expect(container.querySelector('.phm-gio')!.getAttribute('aria-label')).toBe('Số phút con học theo từng giờ trong ngày: 19 giờ 45 phút')
  })

  it('không có dòng thời gian ⇒ ẩn hẳn (không mục rỗng)', () => {
    const raw = nhan(PH_APPLE)
    delete raw.homNay.dongThoiGian
    expect(coDongThoiGian(pmOf(raw))).toBe(false)
    expect(render(<Bang pm={pmOf(raw)} chiDong />).container.querySelector('#muc-thoi-gian')).toBeNull()
    cleanup()
    raw.homNay.dongThoiGian = []
    expect(coDongThoiGian(pmOf(raw))).toBe(false)
    expect(render(<Bang pm={pmOf(raw)} chiDong />).container.querySelector('#muc-thoi-gian')).toBeNull()
    expect(coDongThoiGian(pmOf())).toBe(true)
  })

  it('bấm một lần ⇒ onChonMoc(id nhóm) và KHÔNG nhảy theo liên kết #', () => {
    const chon = vi.fn()
    const pm = pmOf()
    const { container } = render(<DongThoiGian pm={pm} nhom={gomNhomCau(pm)} onChonMoc={chon} />)
    const a = container.querySelectorAll('ol.phm-lan > li a')[1] as HTMLAnchorElement
    expect(a.getAttribute('href')).toBe('#moc-2')
    expect(fireEvent.click(a)).toBe(false) // preventDefault
    expect(chon).toHaveBeenCalledWith('moc-2')
    fireEvent.click(container.querySelectorAll('ol.phm-lan > li a')[4]!)
    expect(chon).toHaveBeenLastCalledWith('moc-5')
    expect(chon).toHaveBeenCalledTimes(2)
  })
})

describe('TungCau — bộ lọc, nhóm, che', () => {
  it('đầu mục + nút lọc chỉ những nút có ý nghĩa (đủ số) + chú thích ô theo hằng ngưỡng', () => {
    const pm = pmOf()
    const sai = pm.cau!.filter(laSai).length
    const lau = pm.cau!.filter((c) => c.kieu === 'thuong' && laLamLau(c)).length
    expect(sai).toBeGreaterThan(0)
    expect(lau).toBeGreaterThan(0)
    const { container } = render(<Bang pm={pm} chiTung />)
    const muc = container.querySelector('#muc-cau')!
    expect(muc.querySelector('h2')!.textContent).toBe('Từng câu con đã làm')
    expect(muc.querySelector('.phm-muc__dau p')!.textContent).toBe('38 câu hôm nay · xếp theo giờ làm')
    expect(chuNut(container)).toEqual(['Tất cả 38', `Sai ${sai}`, `Làm lâu ${lau}`, 'Chưa công bố 6'])
    expect(container.querySelector('.phm-seg')!.getAttribute('role')).toBe('group')
    expect(container.querySelector('.phm-seg button[aria-pressed="true"]')!.textContent).toBe('Tất cả 38')
    const chuThich = container.querySelector('.phm-chu-thich')!.textContent!
    expect(chuThich).toContain('ô đặc: đúng')
    expect(chuThich).toContain('ô gạch chéo: sai')
    expect(chuThich).toContain('Làm lâu: từ 2 phút trở lên một câu')
    expect(chuThich).not.toContain('3 phút')
  })

  it('câu bị che dù lâu (máy chủ gắn cờ) KHÔNG tính vào "Làm lâu": không hiện dòng nên không đếm', () => {
    const raw = nhan(PH_APPLE)
    const truoc = pmOf(raw).cau!.filter((c) => c.kieu === 'thuong' && laLamLau(c)).length
    for (const c of raw.homNay.cau.filter((x: { che?: string }) => x.che)) Object.assign(c, { lamLau: true, giay: 600 })
    const { container } = render(<Bang pm={pmOf(raw)} chiTung />)
    expect(chuNut(container)).toContain(`Làm lâu ${truoc}`)
    bam(document.body, `Làm lâu ${truoc}`)
    expect(container.querySelector('#moc-5')).toBeNull()
  })

  it('không câu làm lâu / không câu che ⇒ bỏ nút và chú thích tương ứng; chỉ còn "Tất cả" ⇒ bỏ cả nhóm nút', () => {
    const raw = nhan(PH_APPLE_THUA)
    const { container, rerender } = render(<Bang pm={pmOf(raw)} chiTung />)
    // 9 câu đầu của bộ thưa: có sai; làm lâu chỉ khi giây ≥ 120
    const pm = pmOf(raw)
    const lau = pm.cau!.filter((c) => c.kieu === 'thuong' && laLamLau(c)).length
    expect(chuNut(container)).toEqual(['Tất cả 9', `Sai ${pm.cau!.filter(laSai).length}`, ...(lau > 0 ? [`Làm lâu ${lau}`] : [])])
    expect(chuNut(container).join()).not.toMatch(/Chưa công bố/)
    for (const c of raw.homNay.cau) {
      c.dung = true
      c.giay = 30
      delete c.lamLau
    }
    rerender(<Bang pm={pmOf(raw)} chiTung />)
    expect(container.querySelector('.phm-seg')).toBeNull()
    expect(container.querySelector('.phm-chu-thich')!.textContent).toBe('ô đặc: đúng')
  })

  it('nhóm theo lần: tiêu đề "06:40 · Ôn lại 6 câu đến lịch", tóm tắt, dải ô đúng/sai có nhãn; nhóm đóng KHÔNG dựng dòng câu', () => {
    const pm = pmOf()
    const { container } = render(<Bang pm={pm} chiTung />)
    expect(container.querySelectorAll('.phm-nhom')).toHaveLength(5)
    const n1 = nhomTheoId(container, 'moc-1')
    expect(n1.querySelector('.phm-nhom__dau h3')!.textContent).toBe('06:40 · Ôn lại 6 câu đến lịch')
    const dungN1 = pm.cau!.filter((c) => c.lan === 0 && c.kieu === 'thuong' && c.dung === true).length
    expect(n1.querySelector('.phm-nhom__dau p')!.textContent).toBe(`6 câu · đúng ${dungN1} · sai ${6 - dungN1} · 7 phút`)
    expect(n1.querySelector('.phm-dai-o')!.getAttribute('aria-label')).toBe(`6 câu: đúng ${dungN1}, sai ${6 - dungN1}`)
    expect(n1.querySelectorAll('.phm-dai-o i')).toHaveLength(6)
    expect(n1.querySelectorAll('.phm-dai-o i[data-sai]')).toHaveLength(6 - dungN1)
    expect(nhomTheoId(container, 'moc-2').querySelector('.phm-nhom__dau h3')!.textContent).toBe('17:12 · Bài tập về nhà “Ester – Lipid”')
    expect(container.querySelectorAll('li.phm-cau')).toHaveLength(0) // mọi nhóm đóng ⇒ 0 dòng câu dù có 38 câu
    expect(nutTheoChu(n1, 'Xem 6 câu của lần này')!.getAttribute('aria-expanded')).toBe('false')
  })

  it('nhóm BỊ CHE: một dòng khoá + dải ô che, KHÔNG dòng câu, KHÔNG nút mở, KHÔNG đúng/sai/đáp án/đề (dù JSON lỡ mang)', () => {
    const raw = nhan(PH_APPLE)
    for (const c of raw.homNay.cau.filter((x: { che?: string }) => x.che)) Object.assign(c, { deRutGon: 'ĐỀ-BÍ-MẬT', dapAn: 'ĐÁP-ÁN-BÍ-MẬT', conChon: 'CON-CHỌN-BÍ-MẬT', tenDang: 'DẠNG-BÍ-MẬT', dung: false, qid: 'QID-BÍ-MẬT', coLoiGiai: true })
    const { container } = render(<Bang pm={pmOf(raw)} khoiTao={['moc-5']} chiTung />)
    const n5 = nhomTheoId(container, 'moc-5')
    expect(n5.querySelector('h3')!.textContent).toBe('20:40 · Gia đình giao thêm · 6 câu')
    expect(n5.querySelector('.phm-dong-bt p')!.textContent).toBe('Con đã làm 6 câu · kết quả hiện sau khi con nộp bài')
    expect(n5.querySelectorAll('.phm-dai-o i[data-che]')).toHaveLength(6)
    expect(n5.querySelector('.phm-dai-o')!.getAttribute('aria-label')).toBe('6 câu con đã làm, chưa hiện kết quả')
    expect(n5.querySelector('button')).toBeNull()
    expect(n5.querySelector('li.phm-cau')).toBeNull()
    expect(n5.textContent).not.toMatch(/BÍ-MẬT|Đúng|Sai|Đáp án|Con chọn|đúng|sai/)
    expect(container.textContent).not.toMatch(/BÍ-MẬT/)
    expect(goiChiTiet).not.toHaveBeenCalled()
    expect(laNhomChe(gomNhomCau(pmOf(raw))[4]!)).toBe(true)
  })

  it('mốc bị che CHƯA có dòng câu nào vẫn hiện một dòng khoá (theo số của máy chủ); mốc thường không câu thì không có nhóm', () => {
    const raw = nhan(PH_APPLE)
    raw.homNay.cau = raw.homNay.cau.filter((c: { che?: string }) => !c.che)
    const { container } = render(<Bang pm={pmOf(raw)} chiTung />)
    const n5 = nhomTheoId(container, 'moc-5')
    expect(n5.querySelector('.phm-dong-bt p')!.textContent).toBe('Con đã làm 6 câu · kết quả hiện sau khi con nộp bài')
    expect(n5.querySelectorAll('.phm-dai-o i[data-che]')).toHaveLength(6)
    expect(container.querySelectorAll('.phm-nhom')).toHaveLength(5)
    const raw2 = nhan(PH_APPLE)
    raw2.homNay.cau = raw2.homNay.cau.filter((c: { nguon: string }) => c.nguon !== 'thu_thach_rieng')
    expect(render(<Bang pm={pmOf(raw2)} chiTung />).container.querySelector('#moc-3')).toBeNull()
  })

  it('không có dòng thời gian ⇒ nhóm riêng theo nguồn; nhóm che riêng không có số máy chủ ⇒ bỏ số nhưng vẫn vẽ ô che theo dòng câu', () => {
    const raw = nhan(PH_OK)
    delete raw.homNay.dongThoiGian
    const { container } = render(<Bang pm={pmOf(raw)} chiTung />)
    expect(container.querySelectorAll('.phm-nhom')).toHaveLength(5)
    const che = nhomTheoId(container, 'moc-r-gia_dinh_giao')
    expect(che.querySelector('.phm-dong-bt p')!.textContent).toBe('Con đã làm · kết quả hiện sau khi con nộp bài')
    expect(che.querySelectorAll('.phm-dai-o i[data-che]')).toHaveLength(6)
    expect(nhomTheoId(container, 'moc-r-on_lai').querySelector('.phm-nhom__dau h3')!.textContent).toBe('06:40 · Ôn lại câu đến lịch')
    expect(nhomTheoId(container, 'moc-r-on_lai').querySelector('.phm-nhom__dau p')!.textContent).toBe('6 câu · đúng 3 · sai 3') // không có mốc ⇒ không có số phút
  })

  it('lọc: Sai ⇒ chỉ nhóm có câu sai, dòng câu chỉ câu sai; Làm lâu ⇒ chỉ câu làm lâu; Chưa công bố ⇒ chỉ nhóm che; về Tất cả', () => {
    const pm = pmOf()
    const sai = pm.cau!.filter(laSai).length
    const lau = pm.cau!.filter((c) => c.kieu === 'thuong' && laLamLau(c)).length
    const { container } = render(<Bang pm={pm} khoiTao={['moc-1', 'moc-2', 'moc-3', 'moc-4']} chiTung />)
    bam(document.body, `Sai ${sai}`)
    expect(container.querySelector('.phm-seg button[aria-pressed="true"]')!.textContent).toBe(`Sai ${sai}`)
    const nhomSai = [...container.querySelectorAll('.phm-nhom')]
    expect(nhomSai.length).toBeLessThan(5)
    expect(container.querySelector('#moc-5')).toBeNull() // nhóm che không có câu sai
    for (const r of container.querySelectorAll('li.phm-cau')) expect(r.getAttribute('data-kq')).toBe('sai')
    expect(container.querySelectorAll('li.phm-cau').length).toBeLessThanOrEqual(sai)
    bam(document.body, `Làm lâu ${lau}`)
    for (const r of container.querySelectorAll('li.phm-cau')) expect(r.hasAttribute('data-lau')).toBe(true)
    expect(container.querySelector('#moc-5')).toBeNull()
    bam(document.body, 'Chưa công bố 6')
    expect(container.querySelectorAll('.phm-nhom')).toHaveLength(1)
    expect(container.querySelector('#moc-5')).toBeTruthy()
    bam(document.body, 'Tất cả 38')
    expect(container.querySelectorAll('.phm-nhom')).toHaveLength(5)
  })

  it('lọc đang bật mà nhóm đóng: nút ghi rõ loại câu ("Xem 2 câu sai của lần này")', () => {
    const pm = pmOf()
    const { container } = render(<Bang pm={pm} chiTung />)
    const sai1 = pm.cau!.filter((c) => c.lan === 0 && laSai(c)).length
    bam(document.body, `Sai ${pm.cau!.filter(laSai).length}`)
    expect(nutTheoChu(nhomTheoId(container, 'moc-1'), `Xem ${sai1} câu sai của lần này`)).toBeTruthy()
  })

  it('bộ lọc đang chọn mất ý nghĩa sau khi dữ liệu đổi (hết câu che) ⇒ về "Tất cả", không kẹt trang trống', () => {
    const { container, rerender } = render(<Bang pm={pmOf()} chiTung />)
    bam(document.body, 'Chưa công bố 6')
    const raw = nhan(PH_APPLE)
    raw.homNay.cau = raw.homNay.cau.filter((c: { che?: string }) => !c.che)
    raw.homNay.dongThoiGian[4].che = null
    rerender(<Bang pm={pmOf(raw)} chiTung />)
    expect(chuNut(container)).not.toContain('Chưa công bố 6')
    expect(container.querySelector('.phm-seg button[aria-pressed="true"]')!.textContent).toMatch(/^Tất cả/)
    expect(container.querySelectorAll('.phm-nhom').length).toBeGreaterThan(0)
  })

  it('không có câu ⇒ ẩn hẳn; coTungCau', () => {
    const raw = nhan(PH_APPLE)
    raw.homNay.cau = []
    expect(coTungCau(pmOf(raw))).toBe(false)
    expect(render(<Bang pm={pmOf(raw)} chiTung />).container.querySelector('#muc-cau')).toBeNull()
    cleanup()
    delete raw.homNay.cau
    expect(coTungCau(pmOf(raw))).toBe(false)
    expect(render(<Bang pm={pmOf(raw)} chiTung />).container.querySelector('#muc-cau')).toBeNull()
    expect(coTungCau(pmOf())).toBe(true)
  })
})

describe('TungCau — mở nhóm, danh sách dài', () => {
  it('bấm "Xem 6 câu của lần này" ⇒ dựng đúng 6 dòng; "Thu gọn" ⇒ bỏ dòng; chỉ nhóm mở mới có dòng câu', () => {
    const { container } = render(<Bang pm={pmOf()} chiTung />)
    const n1 = nhomTheoId(container, 'moc-1')
    fireEvent.click(nutTheoChu(n1, 'Xem 6 câu của lần này')!)
    expect(hangCau(n1)).toHaveLength(6)
    expect(container.querySelectorAll('li.phm-cau')).toHaveLength(6) // các nhóm khác vẫn không dựng
    expect(nutTheoChu(n1, /Hiện đủ/)).toBeUndefined() // 6 câu ≤ ngưỡng xem trước + 2
    fireEvent.click(nutTheoChu(n1, 'Thu gọn')!)
    expect(container.querySelectorAll('li.phm-cau')).toHaveLength(0)
    expect(nutTheoChu(n1, 'Xem 6 câu của lần này')!).toBeTruthy()
  })

  it('nhóm dài: mở ⇒ chỉ vài câu đầu + "Hiện đủ N câu · còn M câu nữa của lần này"; bấm ⇒ đủ; thu gọn rồi mở lại ⇒ lại rút gọn', () => {
    const { container } = render(<Bang pm={pmOf()} khoiTao={['moc-2', 'moc-4']} chiTung />)
    const n2 = nhomTheoId(container, 'moc-2')
    expect(SO_CAU_XEM_TRUOC).toBe(4)
    expect(hangCau(n2)).toHaveLength(4)
    const nut = nutTheoChu(n2, /Hiện đủ 12 câu/)!
    expect(nut.textContent).toBe('Hiện đủ 12 câucòn 8 câu nữa của lần này')
    expect(hangCau(nhomTheoId(container, 'moc-4'))).toHaveLength(4)
    expect(nutTheoChu(nhomTheoId(container, 'moc-4'), /Hiện đủ 9 câu/)!.textContent).toContain('còn 5 câu nữa của lần này')
    fireEvent.click(nut)
    expect(hangCau(n2)).toHaveLength(12)
    expect(nutTheoChu(n2, /Hiện đủ/)).toBeUndefined()
    fireEvent.click(nutTheoChu(n2, 'Thu gọn')!)
    fireEvent.click(nutTheoChu(n2, 'Xem 12 câu của lần này')!)
    expect(hangCau(n2)).toHaveLength(4)
  })

  it('dòng câu: tên dạng · giờ · đề · chip Đúng/Sai · "Con chọn X · Đáp án Y" · thời gian · chip Làm lâu; không có con chọn ⇒ chỉ "Đáp án Y"', () => {
    const raw = nhan(PH_APPLE)
    const { container } = render(<Bang pm={pmOf(raw)} khoiTao={['moc-1']} chiTung />)
    const hang = hangCau(nhomTheoId(container, 'moc-1'))
    const r0 = hang[0]!
    expect(r0.getAttribute('data-kq')).toBe('ok')
    expect(r0.querySelector('.phm-cau__dau b')!.textContent).toBe('Danh pháp ester')
    expect(r0.querySelector('.phm-cau__dau span')!.textContent).toBe('06:40')
    expect(r0.querySelector('.phm-cau__de')!.textContent).toContain('Đun nóng CH3COOH')
    expect(r0.querySelector('.phm-cau__kq .phm-chip')!.textContent).toBe('Đúng')
    expect(r0.querySelector('.phm-cau__kq')!.textContent).toContain('Con chọn B · Đáp án B')
    expect(r0.querySelector('.phm-cau__kq')!.textContent).toContain('40 giây')
    expect(r0.querySelector('.phm-chip[data-mau="dat"]')).toBeTruthy()
    const r1 = hang[1]!
    expect(r1.getAttribute('data-kq')).toBe('sai')
    expect(r1.hasAttribute('data-sai')).toBe(true)
    expect(r1.querySelector('.phm-chip[data-mau="do"]')!.textContent).toBe('Sai')
    const r2 = hang[2]! // giây 248 ⇒ làm lâu
    expect(r2.hasAttribute('data-lau')).toBe(true)
    expect(r2.querySelector('.phm-chip[data-mau="cam"]')!.textContent).toBe('Làm lâu')
    expect(r2.querySelector('.phm-cau__kq')!.textContent).toContain('4 phút 8 giây')
    expect(r0.querySelector('.phm-chip[data-mau="cam"]')).toBeNull()
  })

  it('câu bài về nhà không có conChon ⇒ chỉ "Đáp án Y"; câu chưa chấm đúng/sai ⇒ chip "Đã làm", ô trống, không tô đỏ/xanh', () => {
    const raw = nhan(PH_APPLE)
    const c = raw.homNay.cau.find((x: { nguon: string }) => x.nguon === 'btvn')
    c.conChon = ''
    const ch = raw.homNay.cau.find((x: { nguon: string }) => x.nguon === 'on_lai')
    delete ch.dung
    const { container } = render(<Bang pm={pmOf(raw)} khoiTao={['moc-1', 'moc-2']} chiTung />)
    const btvn = hangCau(nhomTheoId(container, 'moc-2'))[0]!
    expect(btvn.querySelector('.phm-cau__kq')!.textContent).toContain('Đáp án')
    expect(btvn.querySelector('.phm-cau__kq')!.textContent).not.toContain('Con chọn')
    const cho = hangCau(nhomTheoId(container, 'moc-1'))[0]!
    expect(cho.getAttribute('data-kq')).toBe('cho')
    expect(cho.querySelector('.phm-chip')!.textContent).toBe('Đã làm')
    expect(cho.querySelector('.phm-chip')!.hasAttribute('data-mau')).toBe(false)
    expect(nhomTheoId(container, 'moc-1').querySelector('.phm-dai-o i')!.hasAttribute('data-che')).toBe(true)
    expect(container.querySelector('.phm-chu-thich')!.textContent).toContain('ô trống: chưa có kết quả')
  })

  it('câu che chung nhóm với câu thường: dòng khoá, KHÔNG mở được, không đáp án/đề/tên dạng', () => {
    const raw = nhan(PH_APPLE)
    const che = raw.homNay.cau.find((x: { che?: string }) => x.che)
    Object.assign(che, { nguon: 'on_lai', lan: 0, luc: H(6, 39), deRutGon: 'ĐỀ-BÍ-MẬT', dapAn: 'ĐÁP-ÁN-BÍ-MẬT', tenDang: 'DẠNG-BÍ-MẬT', qid: 'QID-BÍ-MẬT', dung: true })
    const { container } = render(<Bang pm={pmOf(raw)} khoiTao={['moc-1']} chiTung />)
    const n1 = nhomTheoId(container, 'moc-1')
    expect(hangCau(n1)).toHaveLength(4) // 7 câu > 4 + 2 ⇒ xem trước 4 câu đầu; câu che có giờ sớm nhất nên đứng đầu
    const rc = n1.querySelector('li[data-vung="cau-che"]') as HTMLElement
    expect(rc).toBeTruthy()
    expect(rc.querySelector('button')).toBeNull()
    expect(rc.textContent).toContain('Con đã làm · kết quả hiện sau khi con nộp bài')
    expect(rc.textContent).not.toMatch(/BÍ-MẬT|Đúng|Sai|Đáp án/)
    expect(n1.querySelector('.phm-nhom__dau p')!.textContent).not.toMatch(/BÍ-MẬT/)
    expect(container.textContent).not.toMatch(/BÍ-MẬT/)
    fireEvent.click(rc)
    expect(goiChiTiet).not.toHaveBeenCalled()
  })
})

describe('TungCau — mở câu ⇒ hỏi máy chủ, phương án, lời giải', () => {
  const moMotCau = (khoiTao = ['moc-1'], pm = pmOf()) => {
    const r = render(<Bang pm={pm} khoiTao={khoiTao} chiTung />)
    return { ...r, hang: () => hangCau(nhomTheoId(r.container, khoiTao[0]!)) }
  }

  it('chưa mở ⇒ KHÔNG hỏi máy chủ, KHÔNG có phương án/lời giải; mở ⇒ gọi taiChiTietCau(sbd, qid) đúng một lần, có trạng thái đang tải', async () => {
    let xong!: (v: unknown) => void
    goiChiTiet.mockReturnValue(new Promise((r) => (xong = r)) as never)
    const { container, hang } = moMotCau()
    expect(goiChiTiet).not.toHaveBeenCalled()
    expect(container.querySelector('.phm-pa, .phm-loi-giai, .phm-mo')).toBeNull()
    const r1 = hang()[1]!
    const qid = pmOf().cau!.filter((c) => c.lan === 0)[1]!
    fireEvent.click(r1.querySelector('button')!)
    expect(goiChiTiet).toHaveBeenCalledTimes(1)
    expect(goiChiTiet).toHaveBeenCalledWith('12121212', qid.kieu === 'thuong' ? qid.qid : '')
    expect(r1.querySelector('button')!.getAttribute('aria-expanded')).toBe('true')
    expect(r1.hasAttribute('data-mo')).toBe(true)
    expect(r1.querySelector('[role="status"]')!.textContent).toBe('Đang lấy lời giải…')
    expect(r1.querySelector('.phm-pa')).toBeNull()
    await act(async () => xong({ kieu: 'ok', ct: CT_OK }))
    expect(r1.querySelector('[role="status"]')).toBeNull()
    expect(r1.querySelectorAll('.phm-pa li')).toHaveLength(4)
  })

  it('LỜI GIẢI CÓ CẤU TRÚC (P0 thầy báo 21/09: máy chủ gửi chuỗi JSON, màn in nguyên `{"chot":…}`): dựng dòng Chốt + các bước ĐÁNH SỐ + dòng Kết quả; công thức qua ChemText; JSON hỏng ⇒ "chưa có lời giải", KHÔNG BAO GIỜ thấy `{"`', async () => {
    const json = JSON.stringify({ chot: 'Acetylene $C_2H_2$ có khối lượng mol 26.', buoc: ['Tính số mol $C_2H_2$ = 0,3 mol.', 'Tính khối lượng sản phẩm.'], ketQua: '92,3%' })
    goiChiTiet.mockResolvedValue({ kieu: 'ok', ct: docChiTietCau({ ...CHI_TIET, loiGiai: json })! })
    const { hang } = moMotCau()
    const r1 = hang()[1]!
    fireEvent.click(r1.querySelector('button')!)
    await waitFor(() => expect(r1.querySelector('[data-vung="loi-giai-ct"]')).toBeTruthy())
    const lg = r1.querySelector('[data-vung="loi-giai-ct"]') as HTMLElement
    expect(lg.querySelector('.phm-lg-chot')!.textContent).toMatch(/^Chốt: Acetylene/)
    const buoc = [...lg.querySelectorAll('.phm-lg-buoc li')]
    expect(buoc).toHaveLength(2)
    expect(buoc.map((b) => b.querySelector('i')!.textContent)).toEqual(['1', '2'])
    expect(buoc[0]!.textContent).toContain('Tính số mol')
    expect(lg.querySelector('.phm-lg-ket')!.textContent).toBe('Kết quả: 92,3%')
    expect(lg.querySelector('.katex, sub, .chem')).toBeTruthy() // công thức C₂H₂ do bộ hiện công thức sẵn có dựng (chỉ số dưới), không chữ "$C_2H_2$" thô
    expect(r1.textContent).not.toMatch(/\{"|\$C_2H_2\$/)
    cleanup()
    goiChiTiet.mockResolvedValue({ kieu: 'ok', ct: docChiTietCau({ ...CHI_TIET, loiGiai: '{"chot":"Acetylene có' })! })
    const b2 = moMotCau()
    const r2 = b2.hang()[1]!
    fireEvent.click(r2.querySelector('button')!)
    await waitFor(() => expect(r2.querySelectorAll('.phm-pa li')).toHaveLength(4))
    expect(r2.querySelector('[data-vung="loi-giai-ct"]')).toBeNull()
    expect(r2.textContent).toContain('Câu này chưa có lời giải để xem.')
    expect(r2.textContent).not.toMatch(/\{"/)
  })

  it('LƯỚI AN TOÀN (Boss 21/09): chi tiết một câu bị từ chối "chưa nộp / chưa công bố" ⇒ dòng câu ấy CHUYỂN NGAY sang dạng che trong phiên — hết Đúng/Sai + Đáp án + Con chọn, không mở được nữa; đếm bộ lọc và tóm tắt nhóm cập nhật; câu khác giữ nguyên; từ chối kiểu khác (lỗi mạng, không có lời giải) KHÔNG che', async () => {
    goiChiTiet.mockResolvedValue({ kieu: 'ok', ct: { kieu: 'tu_choi', chu: 'Bài này con chưa nộp nên chưa xem được lời giải.', che: null } })
    const { container, hang } = moMotCau()
    const truoc = hang()
    const n = truoc.length
    const r1 = truoc[1]! // câu sai (con chọn A, đáp án B)
    expect(r1.textContent).toMatch(/Sai/)
    expect(r1.textContent).toMatch(/Đáp án/)
    const nhomEl = r1.closest('.phm-nhom') as HTMLElement
    const saiTruoc = container.querySelector('.phm-seg')!.textContent
    fireEvent.click(r1.querySelector('button')!)
    await waitFor(() => expect(nhomEl.querySelectorAll('[data-vung="cau-che"]').length).toBeGreaterThan(0))
    const sau = [...nhomEl.querySelectorAll('li.phm-cau')]
    expect(sau).toHaveLength(n)
    const che = nhomEl.querySelector('[data-vung="cau-che"]') as HTMLElement
    expect(che.textContent).not.toMatch(/Sai|Đúng|Đáp án|Con chọn/)
    expect(che.querySelector('button, .phm-mo, .phm-pa, .phm-loi-giai')).toBeNull() // không mở được, không phương án/lời giải
    expect(container.querySelector('.phm-seg')!.textContent).not.toBe(saiTruoc) // đếm "Sai" / "Chưa công bố" đã đổi
    // từ chối KHÔNG phải kiểu che ⇒ không che
    cleanup()
    goiChiTiet.mockResolvedValue({ kieu: 'ok', ct: { kieu: 'tu_choi', chu: 'Chưa xem được lời giải của câu này.', che: null } })
    const b2 = moMotCau()
    const q1 = b2.hang()[1]!
    fireEvent.click(q1.querySelector('button')!)
    await waitFor(() => expect(q1.textContent).toContain('Chưa xem được lời giải của câu này.'))
    expect(b2.container.querySelectorAll('[data-vung="cau-che"]').length).toBe(0)
    expect(q1.textContent).toMatch(/Sai/)
    // máy chủ mới gửi `che` rõ ràng: nhận luôn
    cleanup()
    goiChiTiet.mockResolvedValue({ kieu: 'ok', ct: { kieu: 'tu_choi', chu: 'Chưa xem được.', che: 'chua_cong_bo' } })
    const b3 = moMotCau()
    fireEvent.click(b3.hang()[1]!.querySelector('button')!)
    await waitFor(() => expect(b3.container.querySelectorAll('[data-vung="cau-che"]').length).toBeGreaterThan(0))
  })

  it('phương án: "Đáp án đúng" ở B; "Con chọn" đỏ ở A (con chọn sai); lời giải ngắn từ máy chủ; đề đầy đủ của máy chủ thay đề rút gọn', async () => {
    goiChiTiet.mockResolvedValue({ kieu: 'ok', ct: CT_OK })
    const { hang } = moMotCau()
    const r1 = hang()[1]! // on_lai i=1: con chọn A, đáp án B, sai
    fireEvent.click(r1.querySelector('button')!)
    await waitFor(() => expect(r1.querySelectorAll('.phm-pa li')).toHaveLength(4))
    const li = [...r1.querySelectorAll('.phm-pa li')] as HTMLElement[]
    expect(li.map((x) => x.querySelector('i')!.textContent)).toEqual(['A', 'B', 'C', 'D'])
    expect(li[1]!.hasAttribute('data-dung')).toBe(true)
    expect(li[1]!.querySelector('em')!.textContent).toBe('Đáp án đúng')
    expect(li[0]!.hasAttribute('data-chon')).toBe(true)
    expect(li[0]!.hasAttribute('data-dung')).toBe(false)
    expect(li[0]!.querySelector('em')!.textContent).toBe('Con chọn')
    expect(li[2]!.querySelector('em')).toBeNull()
    expect(li[2]!.hasAttribute('data-chon')).toBe(false)
    const loi = r1.querySelector('.phm-loi-giai')!
    expect(loi.querySelector('h4')!.textContent).toBe('Lời giải ngắn')
    expect(loi.textContent).toContain('Phản ứng ester hoá giữa acid acetic và ethanol')
    expect(r1.querySelector('.phm-cau__de')!.textContent).toContain('Đun nóng')
  })

  it('con chọn ĐÚNG: một dòng "Đáp án đúng · Con chọn", không viền đỏ', async () => {
    goiChiTiet.mockResolvedValue({ kieu: 'ok', ct: CT_OK })
    const { hang } = moMotCau()
    const r0 = hang()[0]! // con chọn B = đáp án B
    fireEvent.click(r0.querySelector('button')!)
    await waitFor(() => expect(r0.querySelectorAll('.phm-pa li')).toHaveLength(4))
    const b = r0.querySelectorAll('.phm-pa li')[1] as HTMLElement
    expect(b.querySelector('em')!.textContent).toBe('Đáp án đúng · Con chọn')
    expect(b.hasAttribute('data-chon')).toBe(false)
    expect(r0.querySelector('.phm-pa li[data-chon]')).toBeNull()
  })

  it('mở lại câu đã có chi tiết thật ⇒ KHÔNG hỏi lại; đóng ⇒ bỏ khối; mũi tên xoay bằng data-mo', async () => {
    goiChiTiet.mockResolvedValue({ kieu: 'ok', ct: CT_OK })
    const { hang } = moMotCau()
    const r0 = hang()[0]!
    fireEvent.click(r0.querySelector('button')!)
    await waitFor(() => expect(r0.querySelector('.phm-pa')).toBeTruthy())
    fireEvent.click(r0.querySelector('button')!)
    expect(r0.querySelector('.phm-mo')).toBeNull()
    expect(r0.hasAttribute('data-mo')).toBe(false)
    expect(r0.querySelector('button')!.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(r0.querySelector('button')!)
    expect(r0.querySelector('.phm-pa li')).toBeTruthy()
    expect(goiChiTiet).toHaveBeenCalledTimes(1)
  })

  it('kho chi tiết dùng chung: thu gọn nhóm rồi mở lại, mở câu đó ⇒ vẫn không hỏi lại', async () => {
    goiChiTiet.mockResolvedValue({ kieu: 'ok', ct: CT_OK })
    const { container, hang } = moMotCau()
    fireEvent.click(hang()[0]!.querySelector('button')!)
    await waitFor(() => expect(hang()[0]!.querySelector('.phm-pa')).toBeTruthy())
    const n1 = nhomTheoId(container, 'moc-1')
    fireEvent.click(nutTheoChu(n1, 'Thu gọn')!)
    fireEvent.click(nutTheoChu(n1, 'Xem 6 câu của lần này')!)
    fireEvent.click(hang()[0]!.querySelector('button')!)
    expect(hang()[0]!.querySelector('.phm-pa li')).toBeTruthy()
    expect(goiChiTiet).toHaveBeenCalledTimes(1)
  })

  it('lỗi thật của máy chủ hiện nguyên chữ + "Thử lại"; thử lại thành công ⇒ có phương án', async () => {
    goiChiTiet.mockResolvedValueOnce({ kieu: 'loi', chu: 'Chưa kết nối được máy chủ. Anh/chị kiểm tra mạng rồi thử lại.' }).mockResolvedValueOnce({ kieu: 'ok', ct: CT_OK })
    const { hang } = moMotCau()
    const r0 = hang()[0]!
    fireEvent.click(r0.querySelector('button')!)
    await waitFor(() => expect(r0.querySelector('[role="alert"]')).toBeTruthy())
    expect(r0.querySelector('[role="alert"]')!.textContent).toContain('Chưa kết nối được máy chủ. Anh/chị kiểm tra mạng rồi thử lại.')
    expect(r0.querySelector('.phm-pa')).toBeNull()
    fireEvent.click(nutTheoChu(r0, 'Thử lại')!)
    await waitFor(() => expect(r0.querySelectorAll('.phm-pa li')).toHaveLength(4))
    expect(r0.querySelector('[role="alert"]')).toBeNull()
    expect(goiChiTiet).toHaveBeenCalledTimes(2)
  })

  it('máy chủ TỪ CHỐI kiểu che (chưa công bố điểm) ⇒ dòng câu chuyển NGAY sang dạng che (lưới an toàn): không phương án, không lời giải, không đúng/sai/đáp án, không mở lại được', async () => {
    goiChiTiet.mockResolvedValue({ kieu: 'ok', ct: { kieu: 'tu_choi', chu: 'Ca này chưa công bố điểm nên chưa xem được lời giải.', che: 'chua_cong_bo' } })
    const { container, hang } = moMotCau()
    const r0 = hang()[0]!
    const nhomEl = r0.closest('.phm-nhom') as HTMLElement
    const soCheTruoc = nhomEl.querySelectorAll('[data-vung="cau-che"]').length
    fireEvent.click(r0.querySelector('button')!)
    await waitFor(() => expect(nhomEl.querySelectorAll('[data-vung="cau-che"]').length).toBe(soCheTruoc + 1))
    expect(goiChiTiet).toHaveBeenCalledTimes(1)
    expect(nhomEl.querySelector('.phm-pa, .phm-loi-giai, [role="alert"]')).toBeNull()
    expect(container.querySelector('[data-vung="cau-che"]')!.querySelector('button')).toBeNull()
  })

  it('từ chối KHÁC (không phải che): hiện đúng lời của máy chủ, KHÔNG phương án/lời giải; mở lại thì hỏi lại', async () => {
    goiChiTiet.mockResolvedValue({ kieu: 'ok', ct: { kieu: 'tu_choi', chu: 'Chưa xem được lời giải của câu này.', che: null } })
    const { hang } = moMotCau()
    const r0 = hang()[0]!
    fireEvent.click(r0.querySelector('button')!)
    await waitFor(() => expect(r0.querySelector('[role="alert"]')).toBeTruthy())
    expect(r0.querySelector('[role="alert"]')!.textContent).toBe('Chưa xem được lời giải của câu này.')
    expect(r0.querySelector('.phm-pa, .phm-loi-giai')).toBeNull()
    fireEvent.click(r0.querySelector('button')!)
    fireEvent.click(r0.querySelector('button')!)
    await act(async () => {})
    expect(goiChiTiet).toHaveBeenCalledTimes(2)    // lời có chữ "nộp" nhưng KHÔNG phải "chưa nộp" ⇒ không che nhầm
    cleanup()
    goiChiTiet.mockReset()
    goiChiTiet.mockResolvedValue({ kieu: 'ok', ct: { kieu: 'tu_choi', chu: 'Câu này chưa có lời giải, thầy sẽ bổ sung sau khi con nộp bài kế tiếp.', che: null } })
    const b2 = moMotCau()
    const q0 = b2.hang()[0]!
    fireEvent.click(q0.querySelector('button')!)
    await waitFor(() => expect(q0.querySelector('[role="alert"]')).toBeTruthy())
    expect(b2.container.querySelector('[data-vung="cau-che"]')).toBeNull()
  })

  it('câu KHÔNG có mã (qid) ⇒ mở được nhưng không hỏi máy chủ, không phương án/lời giải, chỉ ghi chú', () => {
    const raw = nhan(PH_APPLE)
    for (const c of raw.homNay.cau) if (!c.che) c.qid = ''
    const { hang } = moMotCau(['moc-1'], pmOf(raw))
    const r0 = hang()[0]!
    fireEvent.click(r0.querySelector('button')!)
    expect(goiChiTiet).not.toHaveBeenCalled()
    expect(r0.querySelector('.phm-mo')!.textContent).toBe('Câu này chưa có lời giải để xem.')
    expect(r0.querySelector('.phm-pa, .phm-loi-giai, [role="status"]')).toBeNull()
  })

  it('máy chủ trả chi tiết nhưng không có lời giải ⇒ có phương án + ghi chú "chưa có lời giải"; đáp án nhiều chữ ("A, C") đánh dấu cả hai', async () => {
    goiChiTiet.mockResolvedValue({ kieu: 'ok', ct: { ...CT_OK, loiGiai: '', dapAn: 'A, C' } })
    const { hang } = moMotCau()
    const r0 = hang()[0]!
    fireEvent.click(r0.querySelector('button')!)
    await waitFor(() => expect(r0.querySelectorAll('.phm-pa li')).toHaveLength(4))
    expect(r0.querySelector('.phm-loi-giai')).toBeNull()
    expect(r0.querySelector('.phm-mo')!.textContent).toContain('Câu này chưa có lời giải để xem.')
    expect([...r0.querySelectorAll('.phm-pa li[data-dung] i')].map((i) => i.textContent)).toEqual(['A', 'C'])
  })

  it('đóng câu khi đang tải rồi bỏ nhóm (thu gọn) ⇒ kết quả về muộn không làm hỏng màn', async () => {
    let xong!: (v: unknown) => void
    goiChiTiet.mockReturnValue(new Promise((r) => (xong = r)) as never)
    const { container, hang } = moMotCau()
    fireEvent.click(hang()[0]!.querySelector('button')!)
    fireEvent.click(nutTheoChu(nhomTheoId(container, 'moc-1'), 'Thu gọn')!)
    await act(async () => xong({ kieu: 'ok', ct: CT_OK }))
    expect(container.querySelectorAll('li.phm-cau')).toHaveLength(0)
    expect(container.querySelectorAll('.phm-nhom')).toHaveLength(5)
  })
})

describe('DongThoiGian ⇄ TungCau — chạm một lần ngồi học', () => {
  it('bấm lần thứ 4 ⇒ mở nhóm moc-4 (rút gọn 4 câu) và cuộn tới nhóm; nhóm khác vẫn đóng', async () => {
    const { container } = render(<Bang pm={pmOf()} />)
    expect(container.querySelectorAll('li.phm-cau')).toHaveLength(0)
    fireEvent.click(container.querySelectorAll('ol.phm-lan > li a')[3]!)
    await waitFor(() => expect(hangCau(nhomTheoId(container, 'moc-4'))).toHaveLength(4))
    expect(container.querySelectorAll('li.phm-cau')).toHaveLength(4)
    const cuon = vi.mocked(HTMLElement.prototype.scrollIntoView)
    await waitFor(() => expect(cuon).toHaveBeenCalled())
    expect(cuon.mock.instances[0]).toBe(nhomTheoId(container, 'moc-4'))
  })

  it('đang lọc "Sai" mà chạm lần không có câu sai ⇒ tự về "Tất cả" để nhóm hiện ra; lần bị che cuộn tới dòng khoá', async () => {
    const pm = pmOf()
    const { container } = render(<Bang pm={pm} />)
    bam(document.body, `Sai ${pm.cau!.filter(laSai).length}`)
    expect(container.querySelector('#moc-5')).toBeNull()
    fireEvent.click(container.querySelectorAll('ol.phm-lan > li a')[4]!)
    await waitFor(() => expect(container.querySelector('#moc-5')).toBeTruthy())
    expect(container.querySelector('.phm-seg button[aria-pressed="true"]')!.textContent).toMatch(/^Tất cả/)
    expect(nhomTheoId(container, 'moc-5').querySelector('.phm-dong-bt p')!.textContent).toBe('Con đã làm 6 câu · kết quả hiện sau khi con nộp bài')
  })

  it('TungCau tự mở nhóm khi nhận lanBay (không cần vỏ làm hộ)', () => {
    const pm = pmOf()
    const batMo = vi.fn()
    render(<TungCau pm={pm} nhom={gomNhomCau(pm)} sbd="12121212" nhomMo={new Set()} batMo={batMo} dongMo={() => {}} lanBay="moc-2" />)
    expect(batMo).toHaveBeenCalledWith('moc-2')
    cleanup()
    const bo = vi.fn()
    render(<TungCau pm={pm} nhom={gomNhomCau(pm)} sbd="12121212" nhomMo={new Set()} batMo={bo} dongMo={() => {}} lanBay="khong-co" />)
    expect(bo).not.toHaveBeenCalled()
  })
})

describe('Chữ và luật chung', () => {
  it('không chữ game, không mã nội bộ (qid/moc-…) trên màn, không emoji, mọi nút có tên', async () => {
    goiChiTiet.mockResolvedValue({ kieu: 'ok', ct: CT_OK })
    const { container } = render(<Bang pm={pmOf()} khoiTao={['moc-1', 'moc-2']} />)
    const chu = container.textContent!
    expect(chu).not.toMatch(CAM_GAME)
    expect(chu).not.toMatch(/q-on_lai|q-btvn|moc-\d|moc-r-/)
    expect(chu).not.toMatch(/\p{Extended_Pictographic}/u)
    for (const b of container.querySelectorAll('button, a')) expect((b.textContent || b.getAttribute('aria-label') || '').trim().length).toBeGreaterThan(0)
    for (const svg of container.querySelectorAll('svg')) expect(svg.getAttribute('aria-hidden')).toBe('true')
  })

  it('bộ thưa (9 câu, 2 lần): hai mục vẫn dựng đủ, số theo tổng quan', () => {
    const pm = pmOf(PH_APPLE_THUA)
    const { container } = render(<Bang pm={pm} />)
    expect(container.querySelector('.phm-so-to b')!.textContent).toBe('2lần ngồi học')
    expect(container.querySelector('.phm-so-to > span')!.textContent).toBe('dài nhất 21 phút · tổng 14 phút')
    expect(container.querySelector('.phm-muc__dau p')!.textContent).toBe('chạm một lần ngồi học để xem từng câu')
    expect(container.querySelectorAll('#muc-cau .phm-muc__dau p')[0]!.textContent).toBe('9 câu hôm nay · xếp theo giờ làm')
    expect(container.querySelectorAll('.phm-nhom')).toHaveLength(2)
    expect(container.textContent).not.toMatch(CAM_GAME)
  })

  it('hằng ngưỡng khớp mẫu chữ: NGUONG_LAM_LAU_GIAY / 60 phút; laSai/laChe chỉ đúng kiểu', () => {
    expect(chuNguongLamLau()).toContain(`${NGUONG_LAM_LAU_GIAY / 60} phút`)
    const pm = pmOf()
    expect(pm.cau!.filter(laChe)).toHaveLength(6)
    expect(pm.cau!.filter(laChe).every((c) => !laSai(c))).toBe(true)
  })
})
