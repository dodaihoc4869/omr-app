// @vitest-environment jsdom
// CỔ VŨ BẰNG TINH THỂ LỬA (thầy duyệt bản vẽ 73–74 ngày 13/11): «bấm nút cổ vũ trên máy em thì tinh thể lửa theo màu đội siêu đẹp bay luôn lên màn hình bay
// vào thẻ tên của bạn gọi lên bảng, màn thầy và màn học sinh thấy tổng hợp những tinh thể bay của tất cả mọi người» · «mỗi học sinh mỗi lần cổ vũ chỉ có 12
// lần bấm» · «thẻ tên gọi lên bảng của học sinh dùng bản có sẵn luôn».
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import TinhTheCoVu from '../src/components/live/TinhTheCoVu'
import { MOI_LUOT, TRAN, TRAN_YEU, tinhPhat } from '../src/components/live/tinh-the-tinh'
import { emLenBang } from '../src/components/live/len-bang-tinh'
import { DOI_BPU, TIEP_SUC_TOI_DA, goiLenBang, moLuot, taoPhong, tiepSuc, tiepTheoDoi, viewBang, viewEm } from '../src/lib/bpu/phong'

const T0 = Date.parse('2026-11-13T12:00:00Z')
const ds = Array.from({ length: 12 }, (_, i) => ({ sbd: `S${i + 1}`, ten: `Nguyễn Văn Em${i + 1}`, coMat: true, luc: T0 + i * 1000 }))
const cauTN = { qid: 'q1', phan: 'I' as const, tuLuan: false, cau: { qid: 'q1', text: 'Chất nào là amine bậc hai?', choices: ['a', 'b', 'c', 'd'] }, dung: 'B', hanGiay: 60 }
function phongDangGoi() {
  const st = taoPhong({ buoiId: 'b1', lop: '12A1', nay: T0, ds })
  moLuot(st, cauTN, T0)
  goiLenBang(st, 'S1', ['a', 'b', 'c', 'd'], T0)
  return st
}

describe('phòng đếm lượt cổ vũ theo đội người bấm', () => {
  it('mỗi em tối đa 12 lần một lượt gọi; số theo đội = tổng của các em trong đội ấy', () => {
    const st = phongDangGoi()
    expect(TIEP_SUC_TOI_DA).toBe(12)
    for (let i = 0; i < 20; i++) tiepSuc(st, 'S2', T0)
    for (let i = 0; i < 3; i++) tiepSuc(st, 'S3', T0)
    expect(tiepSuc(st, 'S1', T0)).toBe(false) // em đang lên bảng không tự cổ vũ
    const g = st.luot!.goi!, doi = (s: string) => st.ds.find((e) => e.sbd === s)!.doi
    expect(g.tiep.S2).toBe(12)
    const theo = tiepTheoDoi(st, g)
    expect(theo).toHaveLength(4)
    expect(theo.reduce((a, b) => a + b, 0)).toBe(15)
    const mong = [0, 0, 0, 0]; mong[doi('S2')]! += 12; mong[doi('S3')]! += 3
    expect(theo).toEqual(mong)
  })
  it('máy em và máy thầy cùng nhận `tiepDoi`; máy em không nhận tên / số báo danh người bấm', () => {
    const st = phongDangGoi()
    tiepSuc(st, 'S2', T0); tiepSuc(st, 'S5', T0)
    const em = viewEm(st, 'S4', T0).luot!.goi!, bang = viewBang(st, T0).luot!.goi!
    expect(em.tiepDoi).toEqual(tiepTheoDoi(st, st.luot!.goi!))
    expect(bang.tiepDoi).toEqual(em.tiepDoi)
    expect(em.emTiep).toBe(0)
    expect(viewEm(st, 'S2', T0).luot!.goi!.emTiep).toBe(1)
    expect(JSON.stringify(em)).not.toMatch(/"S2"|"S5"/)
  })
  it('em lên bảng của lượt mang số cổ vũ + đội của em cầm máy; máy chủ bản cũ (chưa có `tiepDoi`) ⇒ bốn số 0, không lỗi', () => {
    const st = phongDangGoi()
    tiepSuc(st, 'S2', T0)
    const l = viewEm(st, 'S2', T0).luot!
    const e = emLenBang(l, 'S2', 3)!
    expect(e.tiep).toEqual(l.goi!.tiepDoi)
    expect(e.emTiep).toBe(1)
    expect(e.doiEm).toBe(3)
    const cu = { ...l, goi: { ...l.goi!, tiepDoi: undefined as unknown as number[] } }
    expect(emLenBang(cu, 'S2')!.tiep).toEqual([0, 0, 0, 0])
    expect(emLenBang(cu, 'S2')!.doiEm).toBe(-1)
  })
})

describe('tinhPhat: số tinh thể cần phát khi số đếm đổi', () => {
  it('chưa có mốc ⇒ không phát; có mốc ⇒ phát đúng phần tăng của từng đội; số giảm ⇒ 0', () => {
    expect(tinhPhat(null, [5, 1, 0, 2])).toEqual([0, 0, 0, 0])
    expect(tinhPhat([1, 1, 0, 2], [3, 1, 1, 2])).toEqual([2, 0, 1, 0])
    expect(tinhPhat([4, 4, 4, 4], [0, 0, 0, 0])).toEqual([0, 0, 0, 0])
  })
  it('lớp đông bấm dồn: mỗi lượt số mới một đội không quá MOI_LUOT', () => {
    expect(tinhPhat([0, 0, 0, 0], [100, 3, 0, 0])).toEqual([MOI_LUOT, 3, 0, 0])
    expect(TRAN).toBeGreaterThan(TRAN_YEU)
  })
})

describe('lớp tinh thể', () => {
  let goc: ReturnType<typeof vi.fn>
  const xong: Array<() => void> = []
  beforeEach(() => {
    xong.length = 0
    goc = vi.fn(function (this: HTMLElement) { const a: { onfinish: null | (() => void); oncancel: null | (() => void) } = { onfinish: null, oncancel: null }; xong.push(() => a.onfinish?.()); return a })
    ;(HTMLElement.prototype as unknown as { animate: unknown }).animate = goc
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => 844 })
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 390 })
  })
  afterEach(() => { delete (HTMLElement.prototype as unknown as { animate?: unknown }).animate; vi.restoreAllMocks() })
  const dich = () => ({ x: 700, y: 12 })
  const tt = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('[data-tinh-the] > div')]

  it('lớp vừa dựng KHÔNG phát bù lượt cũ; số tăng ⇒ đúng ngần ấy tinh thể, đúng màu đội người bấm; bay tới đúng điểm đích', () => {
    const r = render(<TinhTheCoVu khoa="1:S1" dem={[5, 0, 2, 0]} dich={dich} />)
    expect(tt(r.container)).toHaveLength(0)
    r.rerender(<TinhTheCoVu khoa="1:S1" dem={[7, 0, 3, 0]} dich={dich} />)
    const ds = tt(r.container)
    expect(ds.map((e) => e.style.color)).toEqual([`var(${DOI_BPU[0]!.mau})`, `var(${DOI_BPU[0]!.mau})`, `var(${DOI_BPU[2]!.mau})`])
    const khung = goc.mock.calls.map((c) => c[0] as Keyframe[]).filter((k) => String(k[0]?.transform).includes('rotate'))
    expect(khung).toHaveLength(3)
    for (const k of khung) expect(String(k[k.length - 1]!.transform)).toContain('translate3d(700.0px,12.0px,0)')
    // vẽ lại với cùng số ⇒ không phát thêm
    r.rerender(<TinhTheCoVu khoa="1:S1" dem={[7, 0, 3, 0]} dich={dich} />)
    expect(tt(r.container)).toHaveLength(3)
  })
  it('bay xong tự gỡ; lớp không chặn chạm, không vào cây trợ năng', () => {
    const r = render(<TinhTheCoVu khoa="1:S1" dem={[0, 0, 0, 0]} dich={dich} />)
    r.rerender(<TinhTheCoVu khoa="1:S1" dem={[0, 2, 0, 0]} dich={dich} />)
    expect(tt(r.container)).toHaveLength(2)
    for (const f of xong.splice(0)) f()
    for (const f of xong.splice(0)) f() // vòng sáng tại đích
    const lop = r.container.querySelector<HTMLElement>('[data-tinh-the]')!
    expect(lop.children).toHaveLength(0)
    expect(lop.style.pointerEvents).toBe('none')
    expect(lop.getAttribute('aria-hidden')).toBe('true')
  })
  it('lời gọi mới (khoá đổi) ⇒ đặt lại mốc, không phát; màn không có thẻ tên (đích null) ⇒ không bay', () => {
    const r = render(<TinhTheCoVu khoa="1:S1" dem={[1, 0, 0, 0]} dich={dich} />)
    r.rerender(<TinhTheCoVu khoa="2:S4" dem={[6, 0, 0, 0]} dich={dich} />)
    expect(tt(r.container)).toHaveLength(0)
    r.rerender(<TinhTheCoVu khoa="2:S4" dem={[9, 0, 0, 0]} dich={() => null} />)
    expect(tt(r.container)).toHaveLength(0)
  })
  it('tinh thể của chính em xuất phát từ nút cổ vũ; của bạn khác từ mép dưới', () => {
    const nguon = () => ({ x: 400, y: 370 })
    const r = render(<TinhTheCoVu khoa="1:S1" dem={[0, 0, 0, 0]} cuaEm={0} doiEm={1} dich={dich} nguon={nguon} />)
    r.rerender(<TinhTheCoVu khoa="1:S1" dem={[1, 1, 0, 0]} cuaEm={1} doiEm={1} dich={dich} nguon={nguon} />)
    const khung = goc.mock.calls.map((c) => c[0] as Keyframe[]).filter((k) => String(k[0]?.transform).includes('rotate'))
    expect(khung).toHaveLength(2)
    expect(String(khung[0]![0]!.transform)).toContain(',414.0px,0)') // đội 0 (bạn khác): mép dưới = cao 390 + 24
    expect(String(khung[1]![0]!.transform)).toContain('translate3d(400.0px,370.0px,0)') // đội 1 = của em: từ nút
  })
  it('máy yếu: không vệt sáng, không quầng, tối đa TRAN_YEU tinh thể cùng lúc', () => {
    const r = render(<TinhTheCoVu khoa="1:S1" dem={[0, 0, 0, 0]} dich={dich} yeu />)
    r.rerender(<TinhTheCoVu khoa="1:S1" dem={[8, 8, 8, 8]} dich={dich} yeu />)
    const ds = tt(r.container)
    expect(ds).toHaveLength(TRAN_YEU)
    expect(ds.every((e) => !e.style.filter)).toBe(true)
    expect(r.container.querySelectorAll('[data-tinh-the] > i[style*="radial-gradient"]')).toHaveLength(0)
  })
})

describe('nối vào hai máy + luật chung', () => {
  const doc = (p: string) => readFileSync(p, 'utf8') // vitest chạy từ gốc repo
  it('máy em: đích là thẻ tên CÓ SẴN `.lv-lb-the`, nguồn là nút cổ vũ sẵn có; chỉ dựng khi bạn còn đang lên bảng; mảnh nạp lười', () => {
    const lop = doc('src/components/live/LopLive.tsx'), tinh = doc('src/components/live/len-bang-tinh.ts')
    expect(lop).toContain("lazy(() => import('./TinhTheCoVu'))")
    expect(lop).toContain('{lenBang?.dang ? <Suspense fallback={null}><TinhTheCoVu')
    expect(tinh).toContain("querySelector<HTMLElement>('.lv-lb-the')")
    expect(tinh).toContain("querySelector<HTMLElement>('.lv-luot button.tiep')")
  })
  it('máy thầy: đích là thẻ tên trong tờ chiếu (`.mc-em`), không dựng thẻ mới', () => {
    const thay = doc('src/components/live-khoi/LopNoiThay.tsx')
    expect(thay).toContain("lazy(() => import('../live/TinhTheCoVu'))")
    expect(thay).toContain("querySelectorAll<HTMLElement>('.mc-em')")
    expect(thay).toContain('<TinhTheCoVu coDinh')
  })
  it('hiệu ứng không dựng thẻ tên, không màu thô, không biểu tượng cảm xúc; chỉ transform + opacity', () => {
    const m = doc('src/components/live/TinhTheCoVu.tsx')
    expect(m).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(m).not.toMatch(/rgba?\(/)
    expect(m).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u)
    expect(m).not.toMatch(/querySelector|className=/) // không tự tìm / tự dựng thẻ tên: máy chủ lớp đo thẻ có sẵn rồi đưa toạ độ vào
  })
  it('nút cổ vũ sẵn có trên dải lượt đếm tới 12', () => {
    expect(doc('src/components/live/DaiLuot.tsx')).toContain('{g.emTiep}/{TIEP_SUC_TOI_DA}')
    expect(doc('src/components/bpu/ManBinhPhanUng.tsx')).toContain('{g.emTiep}/12')
  })
})
