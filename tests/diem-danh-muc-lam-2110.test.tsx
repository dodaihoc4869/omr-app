// THANH MỨC LÀM Ở BẢNG ĐIỂM DANH (thầy 20/10, bản vẽ 03; 6 MỨC thầy duyệt 22/10, bản vẽ docs/ban-ve-muc-lam-6-muc-2210) — màn thầy, không lên bản chiếu. Kiểm:
//   · hỏi MỘT lệnh `/gv/muc-lam-lo` cho đúng các em đang hiện (6 dòng đầu), SAU 1,5 giây; mở "Xem cả N em" ⇒ chỉ hỏi thêm em mới; `/gv/nhip-hoc` vẫn đúng MỘT lệnh;
//   · dòng: thanh bốn đoạn + "Mức làm 1–2: x/y lượt" (≈ khi có lượt ước tính; "Chưa có số đo (N lượt)"; "Chưa có lượt 14 ngày qua"); nhãn đọc màn hình của nút có thêm câu mức;
//   · lỗi / máy chủ chưa có lệnh ⇒ dòng như cũ, KHÔNG tự hỏi lại, điểm danh không bị chặn; bản chiếu KHÔNG có thanh;
//   · phép thuần đọc chặt (`docMucLamEm`): tổng mức phải khớp số có đo, hỏng ⇒ bỏ em ấy.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

const { goi } = vi.hoisted(() => ({ goi: vi.fn() }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => goi(duong, body) }))
vi.mock('../src/components/hop-thoai', () => ({ hoiXacNhan: async () => true }))
vi.mock('../src/components/chien-dich/HoSoLamCauEm', () => ({ default: () => <div role="dialog" aria-label="Hồ sơ làm bài" /> }))

import { BuocDiemDanh, useDiemDanhBuoi } from '../src/components/day-hoc/DiemDanhBuoi'
import { CHO_HOI_MUC_LAM_MS } from '../src/components/day-hoc/Buoc1DiemDanh'
import { chuMucLamEm, coDauHieu, docMucLamEm, tiLeSaiVoi } from '../src/lib/muc-lam-lo-api'
import type { TrangThaiBuoi } from '../src/lib/buoi-hoc-api'
import type { KetQuaNhipHoc } from '../src/lib/nhip-hoc-thay'

const NHIP: KetQuaNhipHoc = { ok: true, tu: '2026-10-01', den: '2026-10-12', homNay: '2026-10-12', ngay: ['2026-10-12'], lop: [], doiPhoDaTinh: { quaNhanh: true, chonLap: true }, canhBao: [], em: [] }
const BUOI = { id: 'BH-12', ten: 'Buổi học 12/10 · 12A1', lop: '12A1', moLuc: '2026-10-12T10:50:00Z', hetHan: '2026-10-13T10:50:00Z', dongLuc: null, dangMo: true }
const TEN = ['An', 'Bình', 'Cường', 'Dung', 'Em', 'Phúc', 'Giang', 'Hà']
const SBD = TEN.map((_, i) => `S${i + 1}`)
const luc = (phut: number) => `2026-10-12T10:${String(phut).padStart(2, '0')}:00Z`
// S1 → S8 điểm danh lần lượt: mới nhất trước ⇒ hàng "Vừa điểm danh" là S8, S7, S6, S5, S4, S3 (6 dòng), S2, S1 chỉ hiện khi bấm "Xem cả 8 em"
const TT: TrangThaiBuoi = {
  buoi: BUOI, ma: '482915', doiMaLuc: 1, siSo: 8,
  coMat: SBD.map((sbd, i) => ({ sbd, hoTen: `Em ${TEN[i]}`, luc: luc(50 + i), cach: 'ma' as const })),
  lopEm: SBD.map((sbd, i) => ({ sbd, hoTen: `Em ${TEN[i]}`, tenLop: '12A1' })),
}
type TuyMuc = { chua?: number; uoc?: number; treo?: number; coTinh?: number; chuaTreo?: number; sv?: number; sn?: number }
/** Khuôn 6 mức (22/10): `m` = Mức 1–4 KHÔNG treo, soDo = Σm + soTreo + soCoTinh; `sv`/`sn` = lượt sai Mức 1–2 / 3–4. */
const mucEm = (m: [number, number, number, number], t: TuyMuc = {}) => ({
  soDo: m[0] + m[1] + m[2] + m[3] + (t.treo ?? 0) + (t.coTinh ?? 0), chuaCoSoDo: t.chua ?? 0, m, soUocTinh: t.uoc ?? 0,
  soTreo: t.treo ?? 0, soCoTinh: t.coTinh ?? 0, soChuaDoTreo: t.chuaTreo ?? 0,
  ...(t.sv !== undefined ? { saiLamVoi: t.sv, saiDuNghi: t.sn ?? 0 } : {}),
})
let MUC: Record<string, ReturnType<typeof mucEm>> = {}
const MUC_DU: Record<string, ReturnType<typeof mucEm>> = {
  S8: mucEm([6, 9, 30, 7], { chua: 3, treo: 1, sv: 6, sn: 10 }),            // 38% (6/16) · treo 1 (không tô)
  S7: mucEm([2, 2, 10, 2], { uoc: 4, chuaTreo: 6, sv: 1, sn: 4 }),           // ≈ · 20% (1/5)
  S6: mucEm([0, 0, 0, 0], { chua: 40 }),                                     // chưa có số đo (40 lượt)
  S5: mucEm([0, 0, 0, 0]),                                                   // không có lượt nào
  S4: mucEm([7, 5, 3, 0], { treo: 1, coTinh: 3, sv: 9, sn: 1 }),             // CỐ TÌNH · 90% · treo 4 (tô)
  S3: mucEm([8, 12, 14, 0], { treo: 2, chuaTreo: 4, sv: 10, sn: 4 }),        // 71% · treo 2 (tô)
  S2: mucEm([1, 3, 9, 4], { sv: 1, sn: 1 }),                                 // ít lượt sai (2)
  S1: mucEm([0, 0, 1, 0], { sv: 0, sn: 0 }),
}
let chet = false
function mayChu() {
  goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
    if (duong === '/gv/lop') return { ok: true, du: { ok: true, lop: [{ tenLop: '12A1', khoi: '12', soEm: 8, sbd: [] }] } }
    if (duong === '/gv/nhip-hoc') return { ok: true, du: NHIP as unknown as Record<string, unknown> }
    if (duong === '/gv/buoi-hoc') return { ok: true, du: { ok: true, ...(b.action === 'dang-mo' ? { buoi: [BUOI] } : TT) } }
    if (duong === '/gv/muc-lam-lo') {
      if (chet) return { ok: false, loai: 'chua_co_lenh', chu: 'chưa có lệnh' }
      const em: Record<string, unknown> = {}
      for (const s of b.sbds as string[]) if (MUC[s]) em[s] = MUC[s]
      return { ok: true, du: { ok: true, tu: '2026-09-29', den: '2026-10-12', em } }
    }
    return { ok: false, loai: 'chua_co_lenh', chu: 'lệnh lạ' }
  })
}
const lenh = (duong: string) => goi.mock.calls.filter(([d]) => d === duong)

function Khung() {
  const dd = useDiemDanhBuoi()
  return <BuocDiemDanh dd={dd} soBuoc={1} idTieuDe="bd-b1" thanh />
}
const dongVua = () => within(screen.getByRole('list', { name: /Em vừa điểm danh/ })).getAllByRole('button')
const o = (b: HTMLElement, lop: string) => b.querySelector(lop)?.textContent ?? ''
beforeEach(() => {
  goi.mockReset()
  chet = false
  MUC = MUC_DU
  mayChu()
})
afterEach(() => {
  cleanup()
})

describe('phép thuần đọc Mức làm theo lô (6 mức)', () => {
  it('đọc chặt: Σm + soTreo + soCoTinh = soDo; máy chủ cũ (không trường treo) vẫn đọc; máy chủ giữa chừng (treo còn trong m) ⇒ bỏ; thiếu / sai kiểu ⇒ null', () => {
    expect(docMucLamEm(mucEm([1, 2, 3, 4], { chua: 5, uoc: 2, treo: 2, coTinh: 1, chuaTreo: 3, sv: 2, sn: 1 }))).toEqual(mucEm([1, 2, 3, 4], { chua: 5, uoc: 2, treo: 2, coTinh: 1, chuaTreo: 3, sv: 2, sn: 1 }))
    expect(docMucLamEm({ soDo: 10, chuaCoSoDo: 0, m: [1, 2, 3, 4], soUocTinh: 0 })).toEqual(mucEm([1, 2, 3, 4])) // khuôn cũ ⇒ treo 0, không số sai
    expect(docMucLamEm({ ...mucEm([1, 2, 3, 4]), soTreo: 2 })).toBeNull() // treo còn nằm trong m (soDo không cộng) ⇒ tổng lệch
    expect(docMucLamEm({ ...mucEm([1, 2, 3, 4]), soDo: 11 })).toBeNull()
    expect(docMucLamEm({ ...mucEm([1, 2, 3, 4]), m: [1, 2, 3] })).toBeNull()
    expect(docMucLamEm({ ...mucEm([1, 2, 3, 4]), m: [1, 2, 3, '4'] })).toBeNull()
    expect(docMucLamEm({ ...mucEm([1, 2, 3, 4]), soUocTinh: 11 })).toBeNull()
    expect(docMucLamEm({ ...mucEm([1, 2, 3, 4]), chuaCoSoDo: -1 })).toBeNull()
    expect(docMucLamEm({ ...mucEm([1, 2, 3, 4]), soCoTinh: -1 })).toBeNull()
    expect(docMucLamEm(mucEm([1, 2, 3, 4], { sv: 4, sn: 0 }))).not.toHaveProperty('saiLamVoi') // sai vội > lượt Mức 1–2 ⇒ bỏ số sai (không bịa %)
    expect(docMucLamEm(null)).toBeNull()
  })
  it('«Sai vì vội» tính trên lượt SAI, ≥ 5 lượt sai mới kết luận, ≥ 50% mới vào lọc; lọc Treo = ≥ 1 lượt treo; Cố tình = có Mức 6', () => {
    expect(tiLeSaiVoi(mucEm([9, 0, 1, 0], { sv: 4, sn: 0 }))).toEqual({ it: 4 })
    expect(tiLeSaiVoi(mucEm([9, 0, 1, 0], { sv: 3, sn: 1 }))).toEqual({ it: 4 })
    expect(tiLeSaiVoi(mucEm([3, 0, 2, 0], { sv: 3, sn: 2 }))).toEqual({ phanTram: 60, voi: 3, sai: 5 })
    expect(tiLeSaiVoi(mucEm([3, 0, 2, 0]))).toBeNull() // máy chủ không gửi số sai
    expect(coDauHieu(mucEm([3, 0, 2, 0], { sv: 3, sn: 2 }), 'voi')).toBe(true)
    expect(coDauHieu(mucEm([2, 0, 3, 0], { sv: 2, sn: 3 }), 'voi')).toBe(false)
    expect(coDauHieu(mucEm([1, 0, 0, 0], { treo: 1 }), 'treo')).toBe(true)
    expect(coDauHieu(mucEm([1, 0, 0, 0], { coTinh: 3 }), 'treo')).toBe(true)
    expect(coDauHieu(mucEm([1, 0, 0, 0], { treo: 1 }), 'co-tinh')).toBe(false)
    expect(coDauHieu(undefined, 'treo')).toBe(false)
  })
  it('câu đọc màn hình: cờ cố tình · % sai vì vội · vội / có nghĩ / treo; chưa có số đo; không lượt nào', () => {
    expect(chuMucLamEm(MUC_DU.S4!)).toBe('Cố tình treo máy 3 lượt. Sai vì vội 90%, 9 trên 10 lượt sai. vội 12, có nghĩ 3, treo máy 4 lượt trong 14 ngày')
    expect(chuMucLamEm(MUC_DU.S7!)).toBe('Sai vì vội 20%, 1 trên 5 lượt sai. khoảng vội 4, có nghĩ 12 lượt trong 14 ngày')
    expect(chuMucLamEm(MUC_DU.S2!)).toBe('Ít lượt sai có số đo (2). vội 4, có nghĩ 13 lượt trong 14 ngày')
    expect(chuMucLamEm(mucEm([0, 0, 0, 0], { chua: 40 }))).toBe('Chưa có số đo (40 lượt)')
    expect(chuMucLamEm(mucEm([0, 0, 0, 0]))).toBe('Chưa có lượt nào 14 ngày qua')
  })
})

describe('bảng điểm danh — Mức làm 6 mức (bản vẽ 22/10)', () => {
  it('hỏi MỘT lệnh cho MỌI em có mặt sau khi danh sách đã vẽ; dòng tổng + cột: % sai vì vội, thanh 3 nhóm, treo, cờ Cố tình; nhãn nút có câu mức; Nhịp học vẫn MỘT lệnh', async () => {
    render(<Khung />)
    await screen.findByRole('list', { name: /Em vừa điểm danh/ })
    expect(lenh('/gv/muc-lam-lo')).toHaveLength(0) // chưa hỏi ngay — chờ danh sách ổn định
    await waitFor(() => expect(lenh('/gv/muc-lam-lo')).toHaveLength(1), { timeout: CHO_HOI_MUC_LAM_MS + 2500 })
    expect((lenh('/gv/muc-lam-lo')[0]![1] as { sbds: string[] }).sbds).toEqual(['S8', 'S7', 'S6', 'S5', 'S4', 'S3', 'S2', 'S1'])
    await waitFor(() => expect(dongVua().map((b) => o(b, '.dd1-ov'))).toEqual(['38%6/16 lượt sai', '20%1/5 lượt sai', '—', '—', '90%9/10 lượt sai', '71%10/14 lượt sai']))
    const dong = dongVua()
    expect(dong.map((b) => o(b, '.dd1-ot small'))).toEqual(['Vội 15 · Có nghĩ 37 · Treo 1 lượt', '≈ Vội 4 · Có nghĩ 12 lượt', 'Chưa có số đo', 'Chưa có lượt 14 ngày qua', 'Vội 12 · Có nghĩ 3 · Treo 4 lượt', 'Vội 20 · Có nghĩ 14 · Treo 2 lượt'])
    expect(dong.map((b) => o(b, '.dd1-otr'))).toEqual(['1 lượt', '0', '—', '—', '4 lượt', '2 lượt'])
    // % tô hổ phách chỉ khi vào bộ lọc (≥ 50%); ô treo tô khi ≥ 2 lượt
    expect(dong.map((b) => b.querySelector('.dd1-ov')?.hasAttribute('data-nhieu'))).toEqual([false, false, false, false, true, true])
    expect(dong.map((b) => b.querySelector('.dd1-otr')?.hasAttribute('data-nhieu'))).toEqual([false, false, false, false, true, true])
    // thanh: Vội (1–2) · Có nghĩ (3–4) · Treo (5) · Cố tình (6), rộng theo số lượt
    expect([...dong[4]!.querySelectorAll('.dd1-ot-thanh i')].map((i) => [i.getAttribute('data-g'), (i as HTMLElement).style.flexGrow])).toEqual([['voi', '12'], ['nghi', '3'], ['treo', '1'], ['co-tinh', '3']])
    expect(dong[2]!.querySelectorAll('.dd1-ot-thanh i')).toHaveLength(0)
    // cờ Cố tình CHỈ ở em có Mức 6
    expect(dong.map((b) => !!b.querySelector('.dd1-co-tinh'))).toEqual([false, false, false, false, true, false])
    expect(dong[1]!.querySelector('.dd1-ot small')?.getAttribute('title')).toContain('mức thật có thể thấp hơn')
    expect(dong[4]!.getAttribute('aria-label')).toMatch(/\. Cố tình treo máy 3 lượt\. Sai vì vội 90%/)
    // dòng tổng đếm trên CẢ 8 em; chú giải + chú thích chung (thay dòng phụ lặp từng dòng)
    expect(screen.getByRole('button', { name: /Sai vì vội nhiều/ }).textContent).toBe('Sai vì vội nhiều2')
    expect(screen.getByRole('button', { name: /^Treo máy/ }).textContent).toBe('Treo máy3')
    expect(screen.getByRole('button', { name: /^Cố tình treo máy/ }).textContent).toBe('Cố tình treo máy1')
    expect(screen.getByLabelText('Chú giải thanh 14 ngày').textContent).toContain('Màn riêng của thầy, không lên bản chiếu')
    expect(document.querySelector('.dd1-chu-chung')?.textContent).toBe('% và thanh chỉ tính lượt đã đo giờ làm. 6 em đang hiện: 43 lượt chưa có số đo · 10 lượt làm trước khi đo treo máy (nằm trong nhóm Vội / Có nghĩ) · ≈ = có lượt giây ước tính.')
    expect(lenh('/gv/nhip-hoc')).toHaveLength(1)
  })

  it('lọc «Treo máy» ⇒ hiện HẾT em có ≥ 1 lượt treo (kể cả em chỉ 1 lượt, em cố tình), không hỏi lại máy chủ; «Bỏ lọc» trả 6 dòng', async () => {
    render(<Khung />)
    await waitFor(() => expect(document.querySelectorAll('.dd1-ov b').length).toBeGreaterThan(0), { timeout: CHO_HOI_MUC_LAM_MS + 2500 })
    fireEvent.click(screen.getByRole('button', { name: /^Treo máy/ }))
    expect(screen.getByRole('button', { name: /^Treo máy/ }).getAttribute('aria-pressed')).toBe('true')
    expect(dongVua().map((b) => o(b, '.dd1-vua-ten'))).toEqual(['Em Hà', 'Em Dung', 'Em Cường'])
    expect(screen.getByText(/có treo máy trong 14 ngày/).textContent).toContain('3 em')
    expect(screen.queryByRole('button', { name: /Xem cả 8 em/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /^Cố tình treo máy/ }))
    expect(dongVua().map((b) => o(b, '.dd1-vua-ten'))).toEqual(['Em Dung'])
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ lọc' }))
    expect(dongVua()).toHaveLength(6)
    expect(lenh('/gv/muc-lam-lo')).toHaveLength(1)
  })

  it('những ngày đầu (chưa lượt nào đo treo máy) ⇒ dòng tổng nói thật «đo từ các lượt làm mới», không nút Treo / Cố tình, cột Treo "—"', async () => {
    MUC = Object.fromEntries(Object.entries(MUC_DU).map(([k, v]) => [k, { ...v, m: [v.m[0], v.m[1], v.m[2] + v.soTreo + v.soCoTinh, v.m[3]] as [number, number, number, number], soTreo: 0, soCoTinh: 0, soChuaDoTreo: v.soDo }]))
    render(<Khung />)
    await waitFor(() => expect(document.querySelectorAll('.dd1-ov b').length).toBeGreaterThan(0), { timeout: CHO_HOI_MUC_LAM_MS + 2500 })
    expect(screen.getByText(/Treo máy: đo từ các lượt làm mới, lượt cũ chưa đo/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /^Treo máy/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Cố tình treo máy/ })).toBeNull()
    expect(dongVua().map((b) => o(b, '.dd1-otr'))).toEqual(['—', '—', '—', '—', '—', '—'])
    expect(document.querySelector('.dd1-chu-chung')?.textContent).not.toContain('trước khi đo treo máy')
  })

  it('máy chủ chưa có lệnh / lỗi ⇒ dòng như cũ (không cột, không dòng tổng) + LÝ DO THẬT + nút «Thử tải lại» (bản vẽ khung 04); bấm em vẫn mở hồ sơ; KHÔNG tự hỏi lại; bấm Thử tải lại ⇒ hỏi lại đúng một lần', async () => {
    chet = true
    render(<Khung />)
    await waitFor(() => expect(lenh('/gv/muc-lam-lo')).toHaveLength(1), { timeout: CHO_HOI_MUC_LAM_MS + 2500 })
    expect((await screen.findByText(/Chưa tải được Mức làm 14 ngày/)).textContent).toContain('Chưa tải được Mức làm 14 ngày: chưa có lệnh. Danh sách điểm danh vẫn đúng.')
    expect(document.querySelectorAll('.dd1-ot, .dd1-ov, .dd1-tong')).toHaveLength(0)
    expect(dongVua()).toHaveLength(6)
    fireEvent.click(dongVua()[0]!)
    expect(await screen.findByRole('dialog', { name: 'Hồ sơ làm bài' })).toBeTruthy() // bấm em vẫn mở hồ sơ
    await new Promise((ok) => setTimeout(ok, CHO_HOI_MUC_LAM_MS + 500))
    expect(lenh('/gv/muc-lam-lo')).toHaveLength(1)
    // thầy bấm Thử tải lại (máy chủ đã có lệnh) ⇒ hỏi lại các em hỏng, có số ⇒ cột hiện, câu lỗi biến mất
    chet = false
    fireEvent.click(screen.getByRole('button', { name: 'Thử tải lại' }))
    await waitFor(() => expect(lenh('/gv/muc-lam-lo')).toHaveLength(2), { timeout: CHO_HOI_MUC_LAM_MS + 2500 })
    expect((lenh('/gv/muc-lam-lo')[1]![1] as { sbds: string[] }).sbds).toHaveLength(8)
    await waitFor(() => expect(document.querySelectorAll('.dd1-ov b').length).toBeGreaterThan(0))
    expect(screen.queryByText(/Chưa tải được Mức làm 14 ngày/)).toBeNull()
  }, 15_000)

  it('bản chiếu điểm danh KHÔNG có Mức làm / Treo / Cố tình (tên em kèm mức trước lớp là điều cần tránh)', async () => {
    render(<Khung />)
    await waitFor(() => expect(document.querySelectorAll('.dd1-ot').length).toBeGreaterThan(0), { timeout: CHO_HOI_MUC_LAM_MS + 2500 })
    fireEvent.click(screen.getByRole('button', { name: 'Chiếu điểm danh' }))
    const chieu = await screen.findByRole('dialog', { name: 'Bản chiếu điểm danh' })
    expect(chieu.querySelectorAll('.dd1-ot, .dd1-ov, .dd1-otr, .dd1-co-tinh')).toHaveLength(0)
    expect(chieu.textContent).not.toMatch(/Mức làm|Treo máy|Cố tình|Sai vì vội/)
  })
})
