// Bình Phản Ứng — thầy báo 10/11 trên bản sống:
// (1) bảng chọn câu «sắp xếp đúng thứ tự cây thư mục»: Bài 11 đứng trước Bài 8 vì giữ thứ tự nhập kho ⇒ nay theo đúng cây kho của app thầy
//     (`dungCay` + `dsBaiCuaKhoi`): chương → bài theo số (Bài 2 trước Bài 10) → các tờ của bài gom dưới tên bài, đúng thứ tự tờ của cây;
// (2) máy em: dải kết quả lên bảng ĐÈ thanh đội «Đội … kJ đội» ⇒ dải và thẻ ±kJ nằm trong dòng chảy, ngay dưới thanh đội.
import { act, render, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TeacherExamSource } from '../src/data/examContent'
import { baiTheoCay, dsChonCau } from '../src/lib/bpu/cay-chon-cau'
import { goiLenBang, chamLenBang, lamBang, moDapAn, moLuot, nhanTra, taoPhong, viewEm } from '../src/lib/bpu/phong'

const tn = (id: string) => ({ id, text: `Câu ${id}`, choices: ['a', 'b', 'c', 'd'], answer: 'A' })
const ds = (id: string) => ({ id, text: `Câu ${id}`, ideas: ['a', 'b', 'c', 'd'], answer: 'DDSS' })
const tl = (id: string) => ({ id, text: `Câu ${id}`, answer: '1' })
/** Tờ kho Dạy học (đã tách theo phần như `khoDayHoc`). */
function to(maDe: string, nguon: string, nhom: string, phan: 'I' | 'II' | 'III', so = 1): TeacherExamSource {
  const ds_ = Array.from({ length: so }, (_, i) => `${maDe}-${i + 1}`)
  return { maDe, nguon, nhom, phanI: phan === 'I' ? ds_.map(tn) : [], phanII: phan === 'II' ? ds_.map(ds) : [], phanIII: phan === 'III' ? ds_.map(tl) : [] } as unknown as TeacherExamSource
}
const C3 = '12 · DẠY HỌC/C3 - Hợp chất chứa nitrogen'
// THỨ TỰ NHẬP KHO lộn xộn đúng như ảnh thầy gửi: Bài 11 trước Bài 8; Bài 10 trước Bài 2; mục «Các dạng toán trọng tâm» của Bài 8 nằm cuối.
const KHO: TeacherExamSource[] = [
  to('DH-12-C3-B11-DS', 'Bài 11. Ôn tập chương 3 (Đề 2)', C3, 'II'),
  to('DH-12-C3-B11-TLN', 'Bài 11. Ôn tập chương 3 (Đề 2)', C3, 'III'),
  to('DH-12-C3-B8-TN', 'Bài 8. Amine', C3, 'I', 3),
  to('DH-12-C3-B8-DS', 'Bài 8. Amine', C3, 'II'),
  to('DH-12-C3-B8-TLN', 'Bài 8. Amine', C3, 'III'),
  to('DH-12-C2-B10-TN', 'Bài 10. Polymer', '12 · DẠY HỌC/C2 - Carbohydrate', 'I'),
  to('DH-12-C1-B2-TN', 'Bài 2. Xà phòng', '12 · DẠY HỌC/C1 - Ester – lipid', 'I'),
  to('DH-12-C1-B10-TN', 'Bài 10. Ôn chương', '12 · DẠY HỌC/C1 - Ester – lipid', 'I'),
  to('DH-11-C1-B1-TN', 'Bài 1. Cân bằng', '11 · DẠY HỌC/C1 - Cân bằng hoá học', 'I'),
  to('DH-12-C3-B8-DT', 'Bài 8. Amine · CÁC DẠNG TOÁN TRỌNG TÂM', C3, 'I'),
]
const tenBai = (khoi: string, tim = '') => dsChonCau(baiTheoCay(KHO), khoi, tim).flatMap((c) => c.bai.map((b) => b.ten))

describe('bảng chọn câu — đúng thứ tự cây thư mục kho (thầy 10/11)', () => {
  it('Lớp 12: chương theo số, bài theo số — Bài 8 trước Bài 11, Bài 2 trước Bài 10', () => {
    expect(tenBai('12')).toEqual(['Bài 2. Xà phòng', 'Bài 10. Ôn chương', 'Bài 10. Polymer', 'Bài 8. Amine', 'Bài 11. Ôn tập chương 3 (Đề 2)'])
    expect(dsChonCau(baiTheoCay(KHO), '12', '').map((c) => c.ten)).toEqual(['Lớp 12 · C1 - Ester – lipid', 'Lớp 12 · C2 - Carbohydrate', 'Lớp 12 · C3 - Hợp chất chứa nitrogen'])
  })
  it('các tờ của một bài gom dưới tên bài, đúng thứ tự tờ của cây (mục dạng toán trước, rồi Trắc nghiệm → Đúng–sai → Trả lời ngắn)', () => {
    const b8 = dsChonCau(baiTheoCay(KHO), '12', '').flatMap((c) => c.bai).find((b) => b.ten === 'Bài 8. Amine')!
    expect(b8.to.map((t) => t.nhan)).toEqual(['Các dạng toán trọng tâm', 'Trắc nghiệm', 'Đúng–sai', 'Trả lời ngắn'])
    expect(b8.to.map((t) => t.soCau)).toEqual([1, 3, 1, 1])
    expect(b8.soCau).toBe(6)
  })
  it('kho cất từng tờ riêng, đọc theo mã (-DS, -DT, -TLN, -TN, -VD — như IndexedDB trả): vẫn Ví dụ, Dạng toán, rồi Phần I → II → III', () => {
    const goc = ['DS', 'DT', 'TLN', 'TN', 'VD'].map((d) => to(`DH-12-C3-B8-${d}`, d === 'DT' ? 'Bài 8. Amine · CÁC DẠNG TOÁN TRỌNG TÂM' : d === 'VD' ? 'Bài 8. Amine · VÍ DỤ MINH HOẠ' : 'Bài 8. Amine', C3, d === 'DS' ? 'II' : d === 'TLN' ? 'III' : 'I'))
    const b8 = dsChonCau(baiTheoCay(goc), '12', '')[0]!.bai[0]!
    expect(b8.to.map((t) => t.nhan)).toEqual(['Ví dụ minh hoạ', 'Các dạng toán trọng tâm', 'Trắc nghiệm', 'Đúng–sai', 'Trả lời ngắn'])
  })
  it('«Tất cả»: đủ mọi tờ của kho (không tờ nào biến mất), Lớp 11 trước Lớp 12; lọc khối và ô tìm (không dấu) giữ như cũ', () => {
    const tat = dsChonCau(baiTheoCay(KHO), '', '')
    expect(tat.flatMap((c) => c.bai.flatMap((b) => b.to)).length).toBe(KHO.length)
    expect(tat[0]!.ten).toBe('Lớp 11 · C1 - Cân bằng hoá học')
    expect(tenBai('11')).toEqual(['Bài 1. Cân bằng'])
    expect(tenBai('12', 'amin')).toEqual(['Bài 8. Amine'])
    expect(tenBai('12', 'hop chat chua')).toEqual(['Bài 8. Amine', 'Bài 11. Ôn tập chương 3 (Đề 2)'])
  })
  it('tờ không rõ khối vẫn hiện ở mọi bộ lọc (như trước)', () => {
    const kho = [...KHO, to('DH-X-TN', 'Bài 5. Lạ', 'DẠY HỌC/Chưa xếp', 'I')]
    expect(dsChonCau(baiTheoCay(kho), '12', '').flatMap((c) => c.bai.map((b) => b.ten))).toContain('Bài 5. Lạ')
    expect(dsChonCau(baiTheoCay(kho), '', '').flatMap((c) => c.bai.flatMap((b) => b.to)).length).toBe(kho.length)
  })
})

describe('bảng chọn câu — vẽ theo cây (render)', () => {
  beforeEach(() => { vi.resetModules(); vi.doMock('../src/lib/bpu/to-chieu-bpu', () => ({ napKhoDayHoc: async () => KHO, baiDaChonCuaBuoi: () => ({ maChon: [], boCau: [] }) })) })
  afterEach(() => { vi.doUnmock('../src/lib/bpu/to-chieu-bpu') })
  it('lọc Lớp 12 (theo lớp 12A1): tên bài theo đúng thứ tự cây, tờ của bài nằm dưới tên bài; bấm tờ ⇒ tiêu đề «Bài · Phần»', async () => {
    const { default: ChonCauBpu } = await import('../src/components/bpu/ChonCauBpu')
    const r = render(<ChonCauBpu buoiId="b1" lop="12A1" buocDau="cau" onChieu={async () => ''} onDong={() => {}} />)
    await waitFor(() => expect(r.container.querySelector('.bcc-ten-nhom')).toBeTruthy())
    const ten = [...r.container.querySelectorAll('.bcc-ten-nhom')].map((x) => x.firstChild?.textContent)
    expect(ten).toEqual(['Bài 2. Xà phòng', 'Bài 10. Ôn chương', 'Bài 10. Polymer', 'Bài 8. Amine', 'Bài 11. Ôn tập chương 3 (Đề 2)'])
    const nhom8 = r.container.querySelector('[aria-label="Bài 8. Amine"]')!
    expect([...nhom8.querySelectorAll('.bcc-to b')].map((x) => x.textContent)).toEqual(['Các dạng toán trọng tâm', 'Trắc nghiệm', 'Đúng–sai', 'Trả lời ngắn'])
    act(() => { (nhom8.querySelectorAll('.bcc-to')[1] as HTMLButtonElement).click() })
    expect(r.container.querySelector('.bcc-ten-bai')?.firstChild?.textContent).toBe('Bài 8. Amine · Trắc nghiệm')
    expect(r.container.querySelectorAll('.bcc-cau')).toHaveLength(3)
  })
})

// ── (2) MÁY EM: dải kết quả lên bảng không đè thanh đội ──
class WsGia { static ds: WsGia[] = []; readyState = 1; onopen?: () => void; onmessage?: (e: { data: string }) => void; onclose?: () => void; onerror?: () => void
  constructor(public url: string) { WsGia.ds.push(this); setTimeout(() => this.onopen?.(), 0) }
  send() {} close() {} nhan(v: unknown) { act(() => { this.onmessage?.({ data: JSON.stringify(v) }) }) } }
const T0 = Date.now()
const phong = () => taoPhong({ buoiId: 'b1', lop: '12A1', nay: T0, ds: [{ sbd: 'S1', ten: 'Đỗ Đại Học', coMat: true, luc: T0 }, { sbd: 'S2', ten: 'Trần Gia Bảo', coMat: true, luc: T0 }] })
const cau = (qid: string) => ({ qid, phan: 'I' as const, tuLuan: false, cau: { qid, maDe: 'm', phan: 'I', text: `Đề ${qid}`, choices: ['A1', 'B1', 'C1', 'D1'], ideas: [], hinhAnh: [], kienThuc: [] }, dung: 'B', hanGiay: 0 })

describe('máy em — dải kết quả lên bảng nằm dưới thanh đội (thầy 10/11: chèn chữ)', () => {
  beforeEach(() => { vi.resetModules(); vi.doMock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' })); WsGia.ds = []; vi.stubGlobal('WebSocket', WsGia); vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true, ve: 've-em', buoiId: 'b1' })))) })
  afterEach(() => { vi.unstubAllGlobals(); vi.doUnmock('../src/lib/dia-chi-may-chu') })
  for (const dat of [true, false]) {
    it(`${dat ? 'Đạt' : 'Chưa đạt'}: trong lớp che, dải đứng NGAY SAU «Đội … kJ đội», rồi mốc thẻ ±kJ — không phải lớp nổi`, async () => {
      const { default: Man } = await import('../src/components/bpu/ManBinhPhanUng')
      render(<Man token="tok" buoiId="b1" onDong={() => {}} />)
      await waitFor(() => expect(WsGia.ds.length).toBe(1))
      const ws = WsGia.ds[0]!
      const st = phong()
      moLuot(st, cau('q1'), T0); nhanTra(st, 'S1', 'B', T0); nhanTra(st, 'S2', 'C', T0); goiLenBang(st, 'S1', ['x'], T0); lamBang(st, T0)
      chamLenBang(st, dat, T0 + 1); moDapAn(st, T0 + 2, (a, b) => a === b)
      ws.nhan(viewEm(st, 'S1'))
      const klb = document.querySelector('.bpu-klb')!
      expect(klb.textContent).toMatch(dat ? /Em · Đạt/ : /Em · Chưa đạt/)
      expect(klb.parentElement?.classList.contains('bpu-che-noi')).toBe(true)
      expect(klb.previousElementSibling?.classList.contains('bpu-che-doi')).toBe(true)
      expect(klb.nextElementSibling?.classList.contains('bpu-bd-neo')).toBe(true)
      expect(document.querySelectorAll('.bpu-klb')).toHaveLength(1)
    })
  }
  it('CSS: dải kết quả không còn position absolute; thẻ ±kJ treo dưới mốc (không top cố định 76px / 140px đè thanh đội)', () => {
    const css = readFileSync('src/components/bpu/bpu-hs.css', 'utf8')
    const quy = (sel: string) => [...css.matchAll(new RegExp(`(^|\\n)${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`, 'g'))].map((m) => m[2]).join(';')
    expect(quy('.bpu-klb')).not.toMatch(/position\s*:\s*absolute/)
    expect(quy('.bpu-klb')).not.toMatch(/translateX\(-50%\)/)
    expect(css).not.toMatch(/top:\s*(76|140)px/)
    expect(quy('.bpu-bd-neo')).toMatch(/height:\s*0/)
    // trong lớp che chỉ thẻ mới nhất hiện (2–3 thẻ chồng xuống tới «Chưa đúng» — đo bằng Chromium 360–430 px, chữ ×1,3)
    expect(css).toMatch(/\.bpu-che-noi \.bpu-bd-the:not\(:last-child\) \{ display: none; \}/)
    expect(css).toMatch(/@keyframes bpu-klb-vao \{ from \{ opacity: 0; transform: translateY/)
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{ \.bpu-klb \{ animation: none; \} \}/)
    expect(css).toMatch(/html\.may-yeu \.bpu-klb \{ animation: none; \}/)
  })
})
