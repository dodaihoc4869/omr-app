// TỜ CHỮA CỦA CHIẾN DỊCH KHÔNG ĐOÁN NỘI DUNG, BỎ CÂU KHÁC KHỐI (thầy 06/10):
//   "Mở câu chữa các chiến dịch đã xong của lớp 11 vẫn còn lẫn rất nhiều các câu thuộc lớp 10. Bạn áp dụng chặn câu luôn cho các chiến dịch đã xong nhé
//    và tờ chữa phải loại bỏ hết câu nhầm khối".
// GỐC LỖI (tái hiện ở khối "bản cũ đoán nội dung" — chạy trên mã trước bản vá thì ĐỎ): danh sách chữa của máy chủ đã sạch khối nhưng không mang nội dung câu, nên
// `dungToChieu` đoán từ Ngân hàng đề trên máy: khớp đuôi mã (`id.endsWith(khoá)`) + khoá theo số thứ tự (`3`, `III-3`, `q3`, `cau-3`…). Câu của chiến dịch không có trên máy
// ⇒ bị thay bằng MỘT CÂU KHÁC của tờ đầu tiên trong ngân hàng (ở đây: tờ khối 10). Nay: chỉ nội dung ĐÚNG mã (máy chủ qua cổng khối, hoặc ngân hàng khớp NGUYÊN mã).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

const { goi, toast, nguonMay } = vi.hoisted(() => ({ goi: vi.fn(), toast: vi.fn(), nguonMay: { ds: [] as unknown[] } }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => goi(duong, body) }))
vi.mock('../src/lib/exam-db', () => ({
  loadExamSources: async () => nguonMay.ds,
  loadAllSessionTeacherBanks: async () => [],
  loadScriptUrl: async () => 'https://may-chu.test',
  loadTeacherSecret: async () => 'bi-mat',
}))
// Khung xem phiếu thật dựng iframe; ở đây chỉ cần HTML tờ chiếu.
vi.mock('../src/components/KhungXemPhieu', () => ({ default: ({ html }: { html: string }) => <pre data-testid="to-chieu">{html}</pre> }))

import type { TeacherExamSource } from '../src/data/examContent'
import LenBangChienDich from '../src/components/chien-dich/LenBangChienDich'
import { cauKhacKhoiLop, dungBangTra, dungToChieu, hoiNoiDungChoToChieu, laLoiMaBiMat, napNoiDungChoToChieu, noiDungCua, traChinhXac, type OChieu } from '../src/components/chien-dich/to-chieu'
import { chuBoCauKhacKhoi, timCauTheoId } from '../src/lib/tra-cau-chieu'
import { cauChoThay } from '../server/src/noi-dung-cau-chien-dich'
import { useAppStore } from '../src/store/appStore'

const mcq = (id: string, text: string, chuyenDe = 'Este – Lipit') => ({ id, text, choices: ['pa a', 'pa b', 'pa c', 'pa d'], correct: 'A' as const, chuyenDe })
const nguon = (maDe: string, ...cau: ReturnType<typeof mcq>[]): TeacherExamSource => ({ maDe, phanI: cau, phanII: [], phanIII: [] })
/** Ngân hàng đề trên máy thầy: chỉ có tờ KHỐI 10 (ba câu) — tờ khối 11 của chiến dịch KHÔNG có trên máy này. */
const TO_10 = nguon('DH-10-C1-B1', mcq('DH-10-C1-B1-I-1', 'CÂU LỚP MƯỜI SỐ MỘT'), mcq('DH-10-C1-B1-I-2', 'CÂU LỚP MƯỜI SỐ HAI'), mcq('DH-10-C1-B1-I-3', 'CÂU LỚP MƯỜI SỐ BA'))
/** Tờ khối 11 CÓ trên máy (khác tờ của chiến dịch): câu `DH-11-C1-B1-I-2` có đúng mã. */
const TO_11_MAY = nguon('DH-11-C1-B1', mcq('DH-11-C1-B1-I-2', 'CÂU TRÊN MÁY KHỐI MƯỜI MỘT'))
const QID_11_3 = 'DH-11-C2-B3-I-3'
const dong = (qid: string, stt: number, them: Partial<OChieu> = {}): OChieu => ({ qid, stt, phan: 'I', mucDo: null, sbd: '', ten: 'Cả lớp', viSao: 'x', ...them })

beforeEach(() => {
  goi.mockReset()
  toast.mockReset()
  nguonMay.ds = []
  useAppStore.setState({ showToast: toast } as never)
})
afterEach(cleanup)

describe('bản cũ đoán nội dung ⇒ lẫn câu tờ khác (tái hiện gốc lỗi)', () => {
  it('câu khối 11 KHÔNG có trên máy, ngân hàng chỉ có tờ khối 10 ⇒ tờ KHÔNG được hiện câu khối 10 thay vào; hiện dòng thay thế và đếm là thiếu', async () => {
    const tra = dungBangTra([TO_10])
    const { html, soThieu } = await dungToChieu([dong(QID_11_3, 3)], 'Buổi chữa · Ôn tổng hợp', tra)
    expect(html).not.toContain('CÂU LỚP MƯỜI')
    expect(html).toContain('Nội dung câu hỏi 3')
    expect(soThieu).toBe(1)
  })
  it('bảng tra KHÔNG còn khoá theo số thứ tự / đuôi mã: `3`, `q3`, `cau-3`, `I-3`, `<tờ>-3`, `<tờ>-I-3` (không phải mã câu thật) đều không có', () => {
    const tra = dungBangTra([TO_10])
    for (const k of ['1', '3', 'q3', 'cau-3', 'cau_3', 'I-3', 'III-3', 'DH-10-C1-B1-3', 'DH-10-C1-B1-I-03']) expect(tra.has(k), k).toBe(false)
    expect([...tra.keys()].filter((k) => k !== k.toLowerCase())).toEqual(['DH-10-C1-B1-I-1', 'DH-10-C1-B1-I-2', 'DH-10-C1-B1-I-3'])
  })
  it('nội dung dùng để ước thời gian cũng đúng mã: câu không có trên máy ⇒ không có số đo (không mượn số đo của câu khác)', () => {
    const tra = dungBangTra([TO_10])
    expect(noiDungCua(tra, QID_11_3)).toBeUndefined()
    expect(noiDungCua(tra, 'DH-10-C1-B1-I-3')).toBeDefined()
  })
  it('đối chứng: hàm khớp đuôi CŨ của màn Gọi lên bảng vẫn y nguyên (thầy tự chọn — luật C), chỉ chiến dịch không dùng nó', () => {
    const m = new Map([['DH-12-C1-B2-I-49', { id: 'x' }]])
    expect(timCauTheoId(m, 'B2-I-49')).toEqual({ id: 'x' })
  })
})

describe('traChinhXac — khớp NGUYÊN mã', () => {
  it('nguyên mã; id nội bộ có -TN/-DS/-TLN khớp mã máy chủ; chữ thường; KHÔNG khớp đuôi, KHÔNG khớp theo số thứ tự', () => {
    const tra = dungBangTra([nguon('DH-11-C1-B1-TN', mcq('DH-11-C1-B1-TN-I-3', 'câu ba tờ TN'))])
    expect(traChinhXac(tra, 'DH-11-C1-B1-TN-I-3')).toBeDefined()
    expect(traChinhXac(tra, 'DH-11-C1-B1-I-3')).toBeDefined() // mã máy chủ của câu (bỏ -TN)
    expect(traChinhXac(tra, 'dh-11-c1-b1-i-3')).toBeDefined()
    for (const k of ['I-3', '3', 'q3', 'X-DH-11-C1-B1-I-3', 'DH-11-C1-B1-I-4', 'DH-11-C1-B1', '', '  ']) expect(traChinhXac(tra, k), JSON.stringify(k)).toBeUndefined()
  })
})

describe('cauKhacKhoiLop — lớp phòng thủ thứ hai (cổng chính ở máy chủ)', () => {
  it('mã khối khác ⇒ chặn; đúng khối ⇒ giữ; mã không đọc ra khối ⇒ giữ (luật B); lớp chưa rõ khối ⇒ không chặn; lớp gom nhiều khối ⇒ câu của khối nào trong đó cũng giữ', () => {
    expect(cauKhacKhoiLop('DH-10-C1-B1-I-1', [11])).toBe(true)
    expect(cauKhacKhoiLop('DH-12-C1-B1-I-1', [11])).toBe(true)
    expect(cauKhacKhoiLop('DH-11-C1-B1-I-1', [11])).toBe(false)
    expect(cauKhacKhoiLop('LA-C1-B1-I-1', [11])).toBe(false)
    expect(cauKhacKhoiLop('DH-10-C1-B1-I-1', [])).toBe(false)
    expect(cauKhacKhoiLop('DH-10-C1-B1-I-1', [10, 11])).toBe(false)
    expect(cauKhacKhoiLop('DH-12-C1-B1-I-1', [10, 11])).toBe(true)
  })
  it('dungToChieu bỏ dòng có mã khác khối lớp dù dòng ấy mang sẵn nội dung; đếm `soBoKhoi`; câu đúng khối còn nguyên', async () => {
    const c = (id: string, text: string) => ({ ...mcq(id, text), phan: 'I' })
    const { html, soBoKhoi, soThieu } = await dungToChieu(
      [dong('DH-10-C1-B1-I-1', 1, { cauGoc: c('DH-10-C1-B1-I-1', 'NOIDUNG-KHOI-10-XYZ') }), dong('DH-11-C1-B1-I-1', 2, { cauGoc: c('DH-11-C1-B1-I-1', 'NOIDUNG-KHOI-11-XYZ') })],
      'Buổi chữa',
      new Map(),
      undefined,
      { khoiDich: [11] },
    )
    expect(soBoKhoi).toBe(1)
    expect(soThieu).toBe(0)
    expect(html).toContain('NOIDUNG-KHOI-11-XYZ')
    expect(html).not.toContain('NOIDUNG-KHOI-10-XYZ')
  })
  it('không truyền khối lớp ⇒ như cũ (không bỏ dòng nào)', async () => {
    const r = await dungToChieu([dong('DH-10-C1-B1-I-1', 1)], 'x', new Map())
    expect(r.soBoKhoi).toBe(0)
  })
  it('lời báo: 0 ⇒ không hiện; ≥ 1 ⇒ có nhãn + đơn vị', () => {
    expect(chuBoCauKhacKhoi(0)).toBeNull()
    expect(chuBoCauKhacKhoi(3)).toBe('3 câu thuộc khối khác đã được bỏ khỏi tờ chiếu')
  })
})

describe('napNoiDungChoToChieu — chỉ hỏi máy chủ câu máy này không có ĐÚNG mã', () => {
  const noiDung = (qid: string) => ({ ...cauChoThay({ qid, phan: 'I', text: `MÁY CHỦ ${qid}`, choices: ['a', 'b', 'c', 'd'], correct: 'B', solution: { chot: 'Chốt.' } }, 'Este – Lipit') })
  it('A có trên máy (không hỏi) · B máy chủ có nội dung · C máy chủ báo khác khối (bỏ) · D máy chủ không có (giữ, dòng thay thế)', async () => {
    const tra = dungBangTra([TO_10])
    const hoi = vi.fn(async (qids: string[]) => ({ khoiDich: [11], cau: { [qids[0]!]: noiDung(qids[0]!) }, boKhoi: [qids[1]!], khongCo: [qids[2]!] }))
    const ds = [dong('DH-10-C1-B1-I-2', 1), dong('DH-11-C2-B3-I-1', 2), dong('DH-10-C5-B1-I-9', 3), dong('DH-11-C2-B3-I-4', 4)]
    const r = await napNoiDungChoToChieu(ds, tra, hoi)
    expect(hoi).toHaveBeenCalledTimes(1)
    expect(hoi.mock.calls[0]![0]).toEqual(['DH-11-C2-B3-I-1', 'DH-10-C5-B1-I-9', 'DH-11-C2-B3-I-4']) // A đã có trên máy ⇒ không hỏi
    expect(r.ds.map((o) => o.qid)).toEqual(['DH-10-C1-B1-I-2', 'DH-11-C2-B3-I-1', 'DH-11-C2-B3-I-4'])
    expect(r.ds[0]!.cauGoc).toBeUndefined()
    expect((r.ds[1]!.cauGoc as { text: string }).text).toBe('MÁY CHỦ DH-11-C2-B3-I-1')
    expect(r.ds[2]!.cauGoc).toBeUndefined()
    expect(r.soBoKhoi).toBe(1)
    expect(r.khoiDich).toEqual([11])
  })
  it('mọi dòng đã có đúng mã trên máy ⇒ KHÔNG gọi máy chủ', async () => {
    const hoi = vi.fn(async () => null)
    const r = await napNoiDungChoToChieu([dong('DH-10-C1-B1-I-1', 1)], dungBangTra([TO_10]), hoi)
    expect(hoi).not.toHaveBeenCalled()
    expect(r.ds).toHaveLength(1)
  })
  it('máy chủ lỗi / chưa có lệnh / ném lỗi ⇒ giữ nguyên các dòng (không bỏ, không đoán)', async () => {
    const ds = [dong('DH-11-C2-B3-I-1', 1), dong('DH-11-C2-B3-I-2', 2)]
    for (const hoi of [async () => null, async () => { throw new Error('mất mạng') }]) {
      const r = await napNoiDungChoToChieu(ds, new Map(), hoi)
      expect(r.ds.map((o) => o.qid)).toEqual(ds.map((o) => o.qid))
      expect(r.soBoKhoi).toBe(0)
    }
  })
})

describe('nội dung máy chủ dựng được tờ đủ ba phần, có nút Đạt / Chưa đạt (hợp đồng chéo máy chủ ↔ tờ)', () => {
  it('Phần I / II / III từ câu chỉ mục game: đề, phương án / ý, đáp án, lời giải hiện đủ; có chuyên đề ⇒ có nút', async () => {
    const goc = (o: Record<string, unknown>) => cauChoThay({ phan: 'I', choices: ['PA-1', 'PA-2', 'PA-3', 'PA-4'], ideas: ['Ý-a', 'Ý-b', 'Ý-c', 'Ý-d'], mucDo: 'hieu', solution: { chot: 'CHỐT-GIẢI' }, ...o }, 'Este – Lipit')!
    const ds = [
      dong('T-I-1', 1, { sbd: 'S1', ten: 'Em Một', cauGoc: goc({ qid: 'T-I-1', text: 'ĐỀ-PHẦN-I', correct: 'C' }) }),
      dong('T-II-1', 2, { phan: 'II', sbd: 'S2', ten: 'Em Hai', cauGoc: goc({ qid: 'T-II-1', phan: 'II', text: 'ĐỀ-PHẦN-II', correct: 'DSDS' }) }),
      dong('T-III-1', 3, { phan: 'III', sbd: 'S3', ten: 'Em Ba', cauGoc: goc({ qid: 'T-III-1', phan: 'III', text: 'ĐỀ-PHẦN-III', correct: '0,5' }) }),
    ]
    const { html, soThieu, o } = await dungToChieu(ds, 'Buổi chữa', new Map(), 'phien-1')
    expect(soThieu).toBe(0)
    for (const x of ['ĐỀ-PHẦN-I', 'ĐỀ-PHẦN-II', 'ĐỀ-PHẦN-III', 'PA-3', 'Ý-b', 'CHỐT-GIẢI', '0,5']) expect(html, x).toContain(x)
    expect([...o.keys()].sort()).toEqual(['S1|T-I-1', 'S2|T-II-1', 'S3|T-III-1'])
    expect(o.get('S2|T-II-1')?.chuyenDe).toBe('Este – Lipit')
  })
})

describe('màn Buổi chữa của chiến dịch ĐÃ HẾT HẠN (lớp 11): bấm "Mở tờ máy chiếu"', () => {
  const CD = { id: 'cd-11', ten: 'Ôn tổng hợp', lop: '11 - Tinh Hoa', maDe: ['DH-11-C2-B3'], hanNop: '2026-10-04', theLucNgay: 40, huyetChien: false, maCa: null, taoLuc: '2026-09-27', trangThai: 'dang_chay', soCau: 6, soEm: 2, hetHan: true }
  const EM = ['Trần Bảo', 'Lê Chi'].map((ten) => ({ sbd: ten, ten, coXat: 4, thanhThao: 1, canDayLai: 1, treNhip: 0, huyetChien: false, theoDang: { 'Dạng A': 0.2 } }))
  const cauBc = (qid: string, stt: number) => ({ qid, stt, dang: 'Dạng A', phan: 'I', mucDo: 'hieu', soChuaThanhThao: 2, soCanDayLai: 1, diemChua: 4, giaiMau: null, emSua: [{ sbd: 'Trần Bảo', ten: 'Trần Bảo' }] })
  const A = 'DH-11-C1-B1-I-2' // có đúng mã trên máy (tờ khối 11 nằm trong ngân hàng, bên cạnh tờ khối 10) — đã qua cổng khối ở danh sách máy chủ
  const B = 'DH-11-C2-B3-I-1' // máy chủ có nội dung
  const C = 'DH-11-C2-B3-I-4' // máy chủ không có nội dung
  const D = 'DH-10-C5-B1-I-9' // máy chủ báo khác khối ⇒ bỏ khỏi tờ

  function dungMay(noiDungCau: (b: Record<string, unknown>) => unknown) {
    goi.mockImplementation(async (_d: string, b: Record<string, unknown>) => {
      if (b.action === 'danh-sach') return { ok: true, du: { ok: true, homNay: '2026-10-05', chienDich: [CD] } }
      if (b.action === 'bang') return { ok: true, du: { ok: true, chienDich: CD, homNay: '2026-10-05', hetHan: true, lop: { coXat: 0.9, thanhThao: 0.4, huyetChien: 0, canDayLaiCau: 0, canDayLaiLuot: 0 }, dang: ['Dạng A'], em: EM, canDayLai: [], noCu: [] } }
      if (b.action === 'buoi-chua') return { ok: true, du: { ok: true, chienDich: { id: 'cd-11', ten: 'Ôn tổng hợp', hanNop: '2026-10-04', lop: '11 - Tinh Hoa' }, hetHan: true, soEm: 2, lop: { coXat: 0.9, thanhThao: 0.4 }, cau: [cauBc(A, 2), cauBc(B, 1), cauBc(C, 4), cauBc(D, 9)] } }
      if (b.action === 'noi-dung-cau') return { ok: true, du: { ok: true, ...(noiDungCau(b) as object) } }
      return { ok: false, loai: 'tu_choi', chu: 'lệnh lạ' }
    })
  }
  const diemDanh = async () => {
    fireEvent.click(await screen.findByRole('button', { name: 'Điểm danh 2 học sinh' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Chốt 2 em có mặt' }))
  }
  const moTo = async () => {
    render(<LenBangChienDich />)
    await diemDanh()
    fireEvent.click(await screen.findByRole('button', { name: 'Mở tờ máy chiếu' }))
    return (await screen.findByTestId('to-chieu')).textContent ?? ''
  }

  it('hỏi máy chủ CHỈ câu máy không có đúng mã; tờ: câu trên máy + câu máy chủ gửi + dòng thay thế; câu khác khối bị BỎ; KHÔNG câu khối 10 nào thế chỗ câu khối 11; báo thầy hai dòng', async () => {
    nguonMay.ds = [TO_10, TO_11_MAY]
    dungMay(() => ({ khoiDich: [11], cau: { [B]: cauChoThay({ qid: B, phan: 'I', text: 'NỘI DUNG TỪ MÁY CHỦ SỐ MỘT', choices: ['a', 'b', 'c', 'd'], correct: 'A', solution: { chot: 'Chốt máy chủ.' } }, 'Este – Lipit') }, boKhoi: [D], khongCo: [C] }))
    const html = await moTo()
    const hoi = goi.mock.calls.filter(([, b]) => b.action === 'noi-dung-cau')
    expect(hoi).toHaveLength(1)
    expect(hoi[0]![1]).toMatchObject({ id: 'cd-11' })
    expect([...(hoi[0]![1].qids as string[])].sort()).toEqual([B, C, D].sort()) // A có sẵn trên máy ⇒ không hỏi
    expect(html).toContain('NỘI DUNG TỪ MÁY CHỦ SỐ MỘT') // B
    expect(html).toContain('CÂU TRÊN MÁY KHỐI MƯỜI MỘT') // A: ĐÚNG MÃ có trên máy
    expect(html).not.toContain('CÂU LỚP MƯỜI') // không câu khối 10 nào (tờ khối 10 nằm trong ngân hàng) thế chỗ câu của chiến dịch
    expect(html).toContain('Nội dung câu hỏi 4') // C: không có nội dung đúng mã ⇒ dòng thay thế, KHÔNG câu mượn
    expect(html).not.toContain('Nội dung câu hỏi 9') // D bị bỏ
    expect(toast).toHaveBeenCalledWith('1 câu thuộc khối khác đã được bỏ khỏi tờ chiếu', 'warn')
    expect(toast).toHaveBeenCalledWith('1 câu chưa tra được nội dung đề — tờ chiếu sẽ hiện dòng thay thế', 'warn')
  })

  it('máy chủ cũ chưa có lệnh `noi-dung-cau` ⇒ tờ vẫn mở: câu có đúng mã trên máy hiện thật, còn lại dòng thay thế (KHÔNG đoán), báo số câu thiếu', async () => {
    nguonMay.ds = [TO_10, TO_11_MAY]
    dungMay(() => ({}))
    goi.mockImplementation(async (_d: string, b: Record<string, unknown>) => {
      if (b.action === 'noi-dung-cau') return { ok: false, loai: 'chua_co_lenh', chu: 'Máy chủ chưa có lệnh' }
      if (b.action === 'danh-sach') return { ok: true, du: { ok: true, homNay: '2026-10-05', chienDich: [CD] } }
      if (b.action === 'bang') return { ok: true, du: { ok: true, chienDich: CD, homNay: '2026-10-05', hetHan: true, lop: { coXat: 0.9, thanhThao: 0.4, huyetChien: 0, canDayLaiCau: 0, canDayLaiLuot: 0 }, dang: ['Dạng A'], em: EM, canDayLai: [], noCu: [] } }
      return { ok: true, du: { ok: true, chienDich: { id: 'cd-11', ten: 'Ôn tổng hợp', hanNop: '2026-10-04', lop: '11 - Tinh Hoa' }, hetHan: true, soEm: 2, lop: { coXat: 0.9, thanhThao: 0.4 }, cau: [cauBc(A, 2), cauBc(B, 1), cauBc(C, 4), cauBc(D, 9)] } }
    })
    const html = await moTo()
    expect(html).toContain('CÂU TRÊN MÁY KHỐI MƯỜI MỘT')
    expect(html).not.toContain('CÂU LỚP MƯỜI')
    expect(html).toContain('Nội dung câu hỏi 1')
    expect(html).toContain('Nội dung câu hỏi 4')
    // D mang mã khối 10 trong chiến dịch khối 11: lớp phòng thủ máy thầy bỏ luôn dù máy chủ cũ không báo
    expect(html).not.toContain('Nội dung câu hỏi 9')
    await waitFor(() => expect(toast).toHaveBeenCalledWith('2 câu chưa tra được nội dung đề — tờ chiếu sẽ hiện dòng thay thế', 'warn'))
    expect(toast).toHaveBeenCalledWith('1 câu thuộc khối khác đã được bỏ khỏi tờ chiếu', 'warn')
  })

  it('MỌI câu bị chặn ⇒ không mở tờ rỗng; nói thật vì sao', async () => {
    nguonMay.ds = []
    dungMay((b) => ({ khoiDich: [11], cau: {}, boKhoi: b.qids, khongCo: [] }))
    render(<LenBangChienDich />)
    await diemDanh()
    fireEvent.click(await screen.findByRole('button', { name: 'Mở tờ máy chiếu' }))
    await waitFor(() => expect(toast).toHaveBeenCalled())
    expect(screen.queryByTestId('to-chieu')).toBeNull()
    expect(toast.mock.calls.map((c) => c[0]).join(' | ')).toContain('không còn câu nào để chiếu')
  })

  // 07/10: thầy đổi mã bí mật ở Cloudflare, máy chiếu của lớp vẫn gửi mã cũ ⇒ `noi-dung-cau` bị từ chối ⇒ tờ toàn "Nội dung câu hỏi N" chiếu lên bảng mà thầy không biết vì sao.
  it('máy chủ TỪ CHỐI mã bí mật ⇒ KHÔNG mở tờ toàn dòng thay thế; báo thật lý do + chỉ chỗ nhập lại; không hỏi lại vô ích', async () => {
    nguonMay.ds = [TO_10, TO_11_MAY]
    dungMay(() => ({}))
    const goiCu = goi.getMockImplementation()!
    goi.mockImplementation(async (d: string, b: Record<string, unknown>) =>
      b.action === 'noi-dung-cau' ? { ok: false, loai: 'tu_choi', chu: 'Sai mã bí mật — mã trên máy này không còn đúng với máy chủ. Vào Cài đặt → Kết nối máy chủ, nhập lại mã bí mật rồi bấm Lưu.' } : goiCu(d, b),
    )
    render(<LenBangChienDich />)
    await diemDanh()
    fireEvent.click(await screen.findByRole('button', { name: 'Mở tờ máy chiếu' }))
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.stringContaining('Sai mã bí mật'), 'error'))
    expect(toast.mock.calls.map((c) => c[0]).join(' | ')).toContain('Cài đặt')
    expect(screen.queryByTestId('to-chieu')).toBeNull()
    expect(goi.mock.calls.filter(([, b]) => b.action === 'noi-dung-cau')).toHaveLength(1)
  })

  it('mạng chập chờn lần đầu, lần hai được ⇒ tờ có nội dung THẬT của máy chủ, không dòng thay thế', async () => {
    nguonMay.ds = [TO_10, TO_11_MAY]
    dungMay(() => ({ khoiDich: [11], cau: { [B]: cauChoThay({ qid: B, phan: 'I', text: 'NỘI DUNG SAU LẦN HỎI LẠI', choices: ['a', 'b', 'c', 'd'], correct: 'A' }, 'Este – Lipit'), [C]: cauChoThay({ qid: C, phan: 'I', text: 'CÂU BỐN SAU LẦN HỎI LẠI', choices: ['a', 'b', 'c', 'd'], correct: 'B' }, 'Este – Lipit') }, boKhoi: [D], khongCo: [] }))
    const goiCu = goi.getMockImplementation()!
    let lan = 0
    goi.mockImplementation(async (d: string, b: Record<string, unknown>) => {
      if (b.action === 'noi-dung-cau' && ++lan === 1) return { ok: false, loai: 'mang', chu: 'Không nối được máy chủ.' }
      return goiCu(d, b)
    })
    const html = await moTo()
    expect(goi.mock.calls.filter(([, b]) => b.action === 'noi-dung-cau')).toHaveLength(2)
    expect(html).toContain('NỘI DUNG SAU LẦN HỎI LẠI')
    expect(html).toContain('CÂU BỐN SAU LẦN HỎI LẠI')
    expect(html).not.toContain('Nội dung câu hỏi')
  })

  it('mạng hỏng cả hai lần ⇒ tờ VẪN mở bằng dòng thay thế + báo số câu thiếu (giữ quyết định Boss 21/09), không báo lỗi mã bí mật', async () => {
    nguonMay.ds = [TO_10, TO_11_MAY]
    dungMay(() => ({}))
    const goiCu = goi.getMockImplementation()!
    goi.mockImplementation(async (d: string, b: Record<string, unknown>) => (b.action === 'noi-dung-cau' ? { ok: false, loai: 'cham', chu: 'Máy chủ trả lời chậm — thử lại sau ít phút.' } : goiCu(d, b)))
    const html = await moTo()
    expect(goi.mock.calls.filter(([, b]) => b.action === 'noi-dung-cau')).toHaveLength(2)
    expect(html).toContain('Nội dung câu hỏi')
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.stringMatching(/câu chưa tra được nội dung đề/), 'warn'))
    expect(toast.mock.calls.map((c) => c[0]).join(' | ')).not.toContain('mã bí mật')
  })
})

describe('hoiNoiDungChoToChieu + laLoiMaBiMat (thuần)', () => {
  const OK = { ok: true as const, du: { khoiDich: [11], cau: {}, boKhoi: [], khongCo: [] } }
  it('lần đầu được ⇒ trả nội dung, hỏi đúng một lần, không ghi lỗi', async () => {
    const doc = vi.fn(async () => OK)
    const ghi = vi.fn()
    expect(await hoiNoiDungChoToChieu(doc, ['a'], ghi)).toBe(OK.du)
    expect(doc).toHaveBeenCalledTimes(1)
    expect(ghi).not.toHaveBeenCalled()
  })
  it('mạng / quá hạn ⇒ thử lại một lần; được thì không ghi lỗi', async () => {
    const doc = vi.fn().mockResolvedValueOnce({ ok: false, loai: 'mang', chu: 'x' }).mockResolvedValueOnce(OK)
    const ghi = vi.fn()
    expect(await hoiNoiDungChoToChieu(doc, ['a'], ghi)).toBe(OK.du)
    expect(doc).toHaveBeenCalledTimes(2)
    expect(ghi).not.toHaveBeenCalled()
  })
  it('hỏng cả hai lần ⇒ null + ghi lỗi cuối cùng', async () => {
    const doc = vi.fn(async () => ({ ok: false as const, loai: 'cham' as const, chu: 'chậm' }))
    const ghi = vi.fn()
    expect(await hoiNoiDungChoToChieu(doc, ['a'], ghi)).toBeNull()
    expect(doc).toHaveBeenCalledTimes(2)
    expect(ghi).toHaveBeenCalledWith({ ok: false, loai: 'cham', chu: 'chậm' })
  })
  it('máy chủ từ chối (`tu_choi`) ⇒ KHÔNG thử lại, ghi lỗi', async () => {
    const doc = vi.fn(async () => ({ ok: false as const, loai: 'tu_choi' as const, chu: 'Sai mã bí mật' }))
    const ghi = vi.fn()
    expect(await hoiNoiDungChoToChieu(doc, ['a'], ghi)).toBeNull()
    expect(doc).toHaveBeenCalledTimes(1)
    expect(ghi).toHaveBeenCalledTimes(1)
  })
  it('laLoiMaBiMat: chỉ đúng khi máy chủ TỪ CHỐI và câu nhắc tới mã bí mật', () => {
    expect(laLoiMaBiMat({ ok: false, loai: 'tu_choi', chu: 'Sai mã bí mật — vào Cài đặt' })).toBe(true)
    expect(laLoiMaBiMat({ ok: false, loai: 'tu_choi', chu: 'Lệnh bang đang dựng.' })).toBe(false)
    expect(laLoiMaBiMat({ ok: false, loai: 'mang', chu: 'Sai mã bí mật' })).toBe(false)
  })
})
