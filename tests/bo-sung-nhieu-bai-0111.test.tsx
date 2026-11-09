// HỘP «BỔ SUNG BÀI HÔM NAY» — CHỌN NHIỀU BÀI (thầy 01/11, bản vẽ chốt docs/ban-ve-chon-nhieu-bai-0111). Kiểm:
//   · ô tick từng bài; bài đã giao gọn một dòng (không ô tick, có «Gỡ bài»); chương đã giao hết gọn lại;
//   · chọn 2 bài ⇒ MỘT lượt `xem-truoc` gộp tờ tự giao của cả 2 bài (khoá = bài sau, phạm vi = các bài trước bài đầu) ⇒ thẻ tóm tắt đúng số máy chủ;
//   · «Giao 2 bài» ⇒ `tick` lần lượt bài số nhỏ trước, CÙNG hạn nộp máy chủ tính cho cả khối lượng ⇒ dòng xong nói rõ;
//   · chưa chọn bài ⇒ không gọi `xem-truoc`, nút Giao không có.
// SỬA CÓ CHỦ ĐÍCH 09/11 (thầy duyệt docs/ban-ve-giao-bai-0911: «bỏ hết màn phân bài bên trong», «tôi chỉ chọn giao bài, máy tự làm hết»): hộp tên «Giao bài»;
// bỏ ô hạn nộp / số lượt mỗi ngày / lưới số; ba ô tóm tắt Câu mới · Đề chuẩn · Hạn chung cả lớp (số từ `xem-truoc`: `hanChung`, `doChuan`); bài kế tiếp
// TICK SẴN nhãn «Gợi ý»; «Bỏ giao» đổi «Gỡ bài», thêm «Sửa em»; chương đã giao hết gộp một dòng; Giao gửi hạn chung, KHÔNG gửi `theLucNgay`.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { TeacherExamSource } from '../src/data/examContent'
import { hienHanNop } from '../src/components/chien-dich/ngay'

const { goi } = vi.hoisted(() => ({ goi: vi.fn() }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => goi(duong, body) }))
vi.mock('../src/lib/exam-db', async (goc) => ({
  ...(await goc<typeof import('../src/lib/exam-db')>()),
  loadExamSources: async () => KHO,
  loadScriptUrl: async () => 'https://may-chu',
  loadTeacherSecret: async () => 'mat',
}))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))
// Hộp nạp lười nhiều lớp (kho, buổi, cờ OMNI, danh sách bài) — cho mỗi test đủ thời gian khi chạy chung nhiều tệp.
vi.setConfig({ testTimeout: 20000 })

let soCau = 0
const cau = (maDe: string, n: number) => Array.from({ length: n }, () => ({ id: `${maDe}-I-${++soCau}`, text: `Câu ${soCau} của ${maDe}`, choices: ['a', 'b', 'c', 'd'], correct: 'A' }))
const to = (maDe: string, nguon: string, n: number, chuong = 'C1 - Ester lipid'): TeacherExamSource => ({ maDe, nhom: `12 · DẠY HỌC/${chuong}`, nguon, phanI: cau(maDe, n), phanII: [], phanIII: [] }) as unknown as TeacherExamSource
const KHO: TeacherExamSource[] = [
  to('DH-12-C1-B1', 'Bài 1. Ester', 3), to('DH-12-C1-B2', 'Bài 2. Lipid', 4), to('DH-12-C1-B3', 'Bài 3. Xà phòng và chất giặt rửa', 5),
  to('DH-12-C2-B4', 'Bài 4. Glucose', 6, 'C2 - Carbohydrate'),
]
const BUOI = { id: 'BH-1', ten: 'Buổi học 01/11 · 12A1', lop: '12A1', moLuc: '2026-11-01T01:00:00Z', hetHan: '2026-11-02T01:00:00Z', dongLuc: null, dangMo: true }
const TICK_B1 = { khoaBai: 'DH-12-C1-B1', tenBai: 'Bài 1. Ester', viTri: 1, tickLuc: '2026-10-20T01:00:00Z', chienDichId: 'cd1', trangThai: 'dang_luyen', hanNop: '2026-11-03', conNgay: 2, chungChi: { dat: 0, tong: 2 }, soEm: 2 }
const tickCua = (khoaBai: string, tenBai: string, viTri: number) => ({ ...TICK_B1, khoaBai, tenBai, viTri, chienDichId: `cd-${viTri}` })
/** Bài đã giao của lớp (danh-sach) — mặc định chỉ Bài 1. */
let daGiao: Record<string, unknown>[] = [TICK_B1]
/** Phần thêm vào `xem-truoc` (09/11: `hanChung`, `doChuan`, số em được giao…) — mặc định rỗng = máy chủ cũ. */
let xemThem: Record<string, unknown> = {}
function mayChu() {
  goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
    if (duong === '/gv/lop') return { ok: true, du: { ok: true, lop: [{ tenLop: '12A1', khoi: '12', soEm: 2, sbd: [] }] } }
    if (duong === '/gv/buoi-hoc' && b.action === 'dang-mo') return { ok: true, du: { ok: true, buoi: [BUOI] } }
    if (duong === '/gv/buoi-hoc' && b.action === 'gan-day') return { ok: false, loai: 'chua_co_lenh', chu: 'lệnh lạ' }
    if (duong === '/gv/buoi-hoc') return { ok: true, du: { ok: true, buoi: BUOI, ma: '1', doiMaLuc: 1, coMat: [], siSo: 2, lopEm: [] } }
    if (duong === '/gv/omni' && b.action === 'co-doc') return { ok: true, du: { ok: true, co: { bat: true, lop: ['12A1'], sbd: [] } } }
    if (duong === '/gv/bai-da-day' && b.action === 'danh-sach') return { ok: true, du: { ok: true, bai: daGiao, choBaiMoi: null } }
    if (duong === '/gv/bai-da-day' && b.action === 'xem-truoc') {
      const n = (b.maDe as string[]).length
      return { ok: true, du: { ok: true, soCau: n === 2 ? 9 : 4, soTuLuan: 0, theoPhan: { I: n === 2 ? 9 : 4, II: 0, III: 0 }, hanNop: '2026-11-09', D: 8, luotCan: 30, sucChua: 320, duLuot: 2, tongEm: 2, soEmChon: 2, duDiem8: null, quaTai: [], theLucNgay: 40, ...xemThem } }
    }
    if (duong === '/gv/bai-da-day' && b.action === 'tick') return { ok: true, du: { ok: true, chienDichId: `cd-${String(b.khoaBai)}`, hanNop: String(b.hanNop), daCo: false } }
    return { ok: false, loai: 'chua_co_lenh', chu: 'lệnh lạ' }
  })
}
const lenh = (action: string) => goi.mock.calls.filter(([d, b]) => d === '/gv/bai-da-day' && (b as Record<string, unknown>).action === action).map(([, b]) => b as Record<string, unknown>)
const PHAM_VI_B1 = { khoaBai: 'DH-12-C1-B1', tenBai: 'Bài 1. Ester', viTri: 1, maDe: ['DH-12-C1-B1'] }

beforeEach(() => { goi.mockReset(); daGiao = [TICK_B1]; xemThem = {}; mayChu() })
afterEach(() => { cleanup(); localStorage.clear() })

async function moHop() {
  const { default: HopBoSungBai } = await import('../src/components/day-hoc/HopBoSungBai')
  render(<HopBoSungBai onDong={() => {}} />)
  return screen.getByRole('dialog', { name: 'Giao bài' })
}
/** Ba ô tóm tắt (bản vẽ 09/11): nhãn ⇒ [số to, dòng phụ]. */
const baO = (hop: HTMLElement) => Object.fromEntries([...hop.querySelectorAll('.cbm-o-so')].map((o) => [o.querySelector('span')!.textContent, [o.querySelector('b')!.textContent, o.querySelector('small')!.textContent]]))

describe('hộp Giao bài — chọn nhiều bài', () => {
  it('bài đã giao gọn một dòng; tick 2 bài ⇒ một lượt xem trước gộp; Giao 2 bài ⇒ tick lần lượt cùng một hạn; báo đã giao', async () => {
    const hop = await moHop()
    const b2 = (await within(hop).findByRole('checkbox', { name: /Bài 2\. Lipid/ }, { timeout: 4000 })) as HTMLInputElement
    // Bài 1 đã giao: không có ô tick, có «Gỡ bài» (trước là «Bỏ giao») + trạng thái
    expect(within(hop).queryByRole('checkbox', { name: /Bài 1\. Ester/ })).toBeNull()
    expect(hop.textContent).toContain('Đang luyện · còn 2 ngày · 2 em')
    expect(within(hop).getByRole('button', { name: 'Gỡ bài' })).toBeTruthy()
    // 09/11: Bài 2 (kế sau bài đã giao xa nhất) tick sẵn ⇒ bỏ chọn để về «chưa chọn gì»: không xem trước, không nút giao.
    await waitFor(() => expect(b2.checked).toBe(true))
    fireEvent.click(b2)
    const truoc = lenh('xem-truoc').length
    await new Promise((r) => setTimeout(r, 400)) // quá nhịp chờ gõ của xem trước
    expect(lenh('xem-truoc')).toHaveLength(truoc)
    expect(within(hop).queryByRole('button', { name: /^Giao / })).toBeNull()

    fireEvent.click(b2)
    fireEvent.click(within(hop).getByRole('checkbox', { name: /Bài 3\. Xà phòng/ }))
    await waitFor(() => expect(within(hop).getByRole('button', { name: 'Giao 2 bài cho lớp 12A1 · 2 em' })).toBeTruthy(), { timeout: 4000 })
    const xem = lenh('xem-truoc')
    expect(xem.at(-1)).toMatchObject({ lop: '12A1', khoaBai: 'DH-12-C1-B3', maDe: ['DH-12-C1-B2', 'DH-12-C1-B3'], phamVi: [expect.objectContaining({ khoaBai: 'DH-12-C1-B1' })] })
    const tom = hop.querySelector('[data-khoi="tom-tat-giao"]')!.textContent!
    expect(tom).toContain('Bài 2, Bài 3')
    // 09/11: ô «Câu mới» thay dòng TN/ĐS/TLN + số ngày D của lưới cũ; máy chủ cũ (không `hanChung`/`doChuan`) ⇒ số ngày = ⌈câu / 28⌉, hạn tự tính.
    expect(baO(hop)['Câu mới']).toEqual(['9', '1 ngày · 28 câu/ngày'])
    expect(baO(hop)['Đề chuẩn']![0]).toBe('—')
    expect(baO(hop)['Hạn chung cả lớp']).toEqual(['—', `hết 23:59 · ${hienHanNop('2026-11-09', false)}`])

    fireEvent.click(within(hop).getByRole('button', { name: 'Giao 2 bài cho lớp 12A1 · 2 em' }))
    await waitFor(() => expect(hop.textContent).toContain('Đã giao Bài 2, Bài 3 cho 2 em lớp 12A1'), { timeout: 4000 })
    // SỬA CÓ CHỦ ĐÍCH 09/11: dòng xong theo bản vẽ — máy tự xếp 28 câu mỗi ngày (thay câu «máy các em tự tải câu và đáp án»).
    expect(hop.textContent).toContain('Từ hôm nay máy tự xếp 28 câu mỗi ngày cho từng em.')
    const tick = lenh('tick')
    expect(tick.map((t) => t.khoaBai)).toEqual(['DH-12-C1-B2', 'DH-12-C1-B3'])
    // máy chủ cũ chưa gửi hạn chung ⇒ dùng hạn tự tính của xem trước, cùng một hạn cho mọi bài
    expect(tick.every((t) => t.hanNop === '2026-11-09')).toBe(true)
    expect(tick[1]!.phamVi).toEqual(expect.arrayContaining([expect.objectContaining({ khoaBai: 'DH-12-C1-B2' })]))
  })
})

describe('hộp Giao bài 09/11 — máy tự tính, thầy chỉ chọn bài', () => {
  const HAN_CHUNG = { M: 2, T: 10, han: '2026-11-19', duKienXong: 48, tongEm: 53 }

  it('(a) ba ô Câu mới · Đề chuẩn · Hạn chung cả lớp hiện đúng số máy chủ (`hanChung`, `doChuan`); hộp không còn ô hạn nộp / số lượt mỗi ngày', async () => {
    xemThem = { soEmChon: 53, tongEm: 53, hanChung: HAN_CHUNG, doChuan: { dungO: 24, M: 2, thieuDS: 3 } }
    const hop = await moHop()
    // Bài 2 tick sẵn (gợi ý) ⇒ xem trước tự chạy.
    await waitFor(() => expect(within(hop).getByRole('button', { name: 'Giao 1 bài cho lớp 12A1 · 53 em' })).toBeTruthy(), { timeout: 4000 })
    expect(baO(hop)).toEqual({
      'Câu mới': ['4', '2 ngày · 28 câu/ngày'],
      'Đề chuẩn': ['24/28', 'đúng mức đề thi; ô thiếu máy tự lấy câu gần nhất'],
      'Hạn chung cả lớp': ['10 ngày', `hết ${hienHanNop('2026-11-19', false)} · 48/53 em dự kiến xong hết`],
    })
    expect(hop.textContent).toContain('Cả lớp chung hạn. Máy tự xếp 28 câu mỗi ngày cho từng em')
    // Ô không còn (bỏ theo thầy 09/11): hạn nộp, số lượt câu mỗi ngày, lưới số, dòng Ôn bài cũ.
    expect(hop.querySelector('input[type="date"]')).toBeNull()
    expect(hop.querySelector('input[type="number"]')).toBeNull()
    expect(hop.textContent).not.toMatch(/Hạn nộp \(hết lúc 23:59\)|Số lượt câu mỗi ngày|Ôn bài cũ|Lượt cần/)
    expect(hop.querySelector('[data-khoi="sua-han-luot"]')).toBeNull()
    expect(hop.querySelector('[data-so-tick]')).toBeNull()
  })

  it('(a) đề đủ 28/28 ⇒ ô Đề chuẩn chỉ ghi «đúng mức đề thi»', async () => {
    xemThem = { hanChung: { ...HAN_CHUNG, tongEm: 2, duKienXong: 2 }, doChuan: { dungO: 28, M: 2, thieuDS: 0 } }
    const hop = await moHop()
    await waitFor(() => expect(baO(hop)['Đề chuẩn']).toEqual(['28/28', 'đúng mức đề thi']), { timeout: 4000 })
  })

  it('(b) Giao ⇒ `tick` gửi hanNop = hanChung.han (khác hạn tự tính cũ), KHÔNG gửi theLucNgay; xem trước không gửi hạn / lượt', async () => {
    xemThem = { hanChung: { ...HAN_CHUNG, tongEm: 2, duKienXong: 2 }, doChuan: { dungO: 28, M: 2, thieuDS: 0 } }
    const hop = await moHop()
    const nut = await within(hop).findByRole('button', { name: 'Giao 1 bài cho lớp 12A1 · 2 em' }, { timeout: 4000 })
    await waitFor(() => expect((nut as HTMLButtonElement).disabled).toBe(false))
    for (const x of lenh('xem-truoc')) {
      expect('hanNop' in x).toBe(false)
      expect('theLucNgay' in x).toBe(false)
    }
    fireEvent.click(nut)
    await waitFor(() => expect(lenh('tick')).toHaveLength(1))
    expect(lenh('tick')[0]).toEqual({
      action: 'tick', lop: '12A1', khoaBai: 'DH-12-C1-B2', tenBai: 'Bài 2. Lipid', viTri: 2, maDe: ['DH-12-C1-B2'], hanNop: '2026-11-19', phamVi: [PHAM_VI_B1],
    })
    expect('theLucNgay' in lenh('tick')[0]!).toBe(false)
    await waitFor(() => expect(hop.textContent).toContain(`Hạn chung cả lớp: ${hienHanNop('2026-11-19', false)}.`), { timeout: 4000 })
  })

  it('(c) bài gợi ý = bài kế sau bài đã giao xa nhất: tick sẵn, nhãn «Gợi ý»; bỏ chọn thì không tự tick lại', async () => {
    const hop = await moHop()
    const b2 = (await within(hop).findByRole('checkbox', { name: /Bài 2\. Lipid/ }, { timeout: 4000 })) as HTMLInputElement
    const b3 = within(hop).getByRole('checkbox', { name: /Bài 3\. Xà phòng/ }) as HTMLInputElement
    await waitFor(() => expect(b2.checked).toBe(true))
    expect(b3.checked).toBe(false)
    expect(b2.closest('label')!.querySelector('.cbm-goi-y-chip')?.textContent).toBe('Gợi ý')
    expect(b3.closest('label')!.querySelector('.cbm-goi-y-chip')).toBeNull()
    expect(hop.querySelectorAll('.cbm-goi-y-chip')).toHaveLength(1)
    fireEvent.click(b2)
    await new Promise((r) => setTimeout(r, 400))
    expect(b2.checked).toBe(false)
    expect(within(hop).queryByRole('button', { name: /^Giao / })).toBeNull()
  })

  it('(c) đã giao hết chương 1 ⇒ gợi ý Bài 4 (chương 2); chương đã giao hết gộp MỘT dòng «Hiện 1 chương đã giao hết (…)», bấm thì hiện lại', async () => {
    daGiao = [TICK_B1, tickCua('DH-12-C1-B2', 'Bài 2. Lipid', 2), tickCua('DH-12-C1-B3', 'Bài 3. Xà phòng và chất giặt rửa', 3)]
    const hop = await moHop()
    const b4 = (await within(hop).findByRole('checkbox', { name: /Bài 4\. Glucose/ }, { timeout: 4000 })) as HTMLInputElement
    await waitFor(() => expect(b4.checked).toBe(true))
    expect(b4.closest('label')!.querySelector('.cbm-goi-y-chip')?.textContent).toBe('Gợi ý')
    const gop = within(hop).getByRole('button', { name: 'Hiện 1 chương đã giao hết (C1 - Ester lipid)' })
    expect([...hop.querySelectorAll('.cbm-chuong-ten')].map((e) => e.textContent)).toEqual(['C2 - Carbohydrate'])
    expect(hop.textContent).not.toContain('Bài 2. Lipid')
    fireEvent.click(gop)
    expect([...hop.querySelectorAll('.cbm-chuong-ten')].map((e) => e.textContent)).toEqual(['C1 - Ester lipid', 'C2 - Carbohydrate'])
    expect(within(hop).getByRole('button', { name: 'Ẩn 1 chương đã giao hết' })).toBeTruthy()
  })

  it('bài đang giao (có gói Gói7) có «Sửa em» ⇒ mở tấm Em nhận bài của đúng bài; và «Gỡ bài»', async () => {
    daGiao = [{ ...TICK_B1, goi7: { goiId: 'g7-b1', soEm: 2, han: '2026-11-03' } }]
    const hop = await moHop()
    const sua = await within(hop).findByRole('button', { name: 'Sửa em' }, { timeout: 4000 })
    expect(within(hop).getByRole('button', { name: 'Gỡ bài' })).toBeTruthy()
    fireEvent.click(sua)
    expect(await screen.findByRole('dialog', { name: 'Em nhận Bài 1' }, { timeout: 4000 })).toBeTruthy()
  })
})
