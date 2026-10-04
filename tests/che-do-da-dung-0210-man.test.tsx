// CHẾ ĐỘ "KIỂM CHỨNG CÂU ĐÃ ĐÚNG" (02/10) — PHẦN MÁY THẦY / MÁY EM:
//   · khối Bộ câu ra đề: chip "Kiểm chứng câu đã đúng" cạnh "Kiểm tra điểm yếu" ⇒ ca đề riêng, phạm vi 'da_dung', số câu chia theo ma trận 2026;
//   · chạy thử / chốt: chỉ câu em đã đúng, nối câu ngoài kho, bản đồ nhãn; bảng Xem trước báo em thiếu câu;
//   · màn thi: nhãn "Em đã làm đúng: …" dưới số câu, không lộ đáp án; khối kết thúc xếp em sai nhiều nhất lên đầu.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

const cauDaDungTheoEm = vi.fn()
const noiKhoCa = vi.fn(async () => ({ themBank: 1, themKey: 1 }))
const loadSessionTeacherBank = vi.fn()
const saveSessionTeacherBank = vi.fn(async () => {})
const docSoCauCa = vi.fn()
const loadExamSources = vi.fn(async () => [] as unknown[])

vi.mock('../src/lib/exam-api', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  cauDaDungTheoEm: (...a: unknown[]) => cauDaDungTheoEm(...a),
  noiKhoCa: (...a: unknown[]) => noiKhoCa(...(a as [])),
}))
vi.mock('../src/lib/exam-db', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  loadSessionTeacherBank: (...a: unknown[]) => loadSessionTeacherBank(...a),
  saveSessionTeacherBank: (...a: unknown[]) => saveSessionTeacherBank(...(a as [])),
  docSoCauCa: (...a: unknown[]) => docSoCauCa(...a),
  loadExamSources: (...a: unknown[]) => loadExamSources(...(a as [])),
}))

const { default: KhoiRutDe } = await import('../src/components/KhoiRutDe')
const { chayThuRutDeDaDung, chotRutDeDaDung } = await import('../src/lib/de-rieng-da-dung')
const { BangRutThuDaDung, KhoiSaiLaiDaDung } = await import('../src/components/ca-thi/KhoiDaDung')
const { default: TheCau } = await import('../src/components/TheCau')

afterEach(() => {
  cleanup()
})

const mcq = (id: string, mucDo = 'hieu') => ({ id, text: `Đốt cháy ${id} mol ester tính m gam`, choices: ['1,2', '2,4', '3,6', '4,8'] as [string, string, string, string], correct: 'A' as const, chuyenDe: 'Ester', mucDo })
const tln = (id: string, mucDo = 'van_dung') => ({ id, text: `Tính thể tích khí ${id} (lít)`, correct: '2,24', chuyenDe: 'Ester', mucDo })
const NGUON = [{ maDe: 'D', phanI: Array.from({ length: 40 }, (_, i) => mcq(`D-I-${i}`)), phanII: [], phanIII: Array.from({ length: 10 }, (_, i) => tln(`D-III-${i}`)) }]
const da = (qid: string, phan: 'I' | 'III', mucDo: string, noi = 'Ca Kiểm tra tuần 3') => ({ qid, phan, mucDo, dang: '', noi, ngayDung: '2026-09-28', nhan: '', lucDung: '2026-09-28T03:00:00Z', soLanDung: 2, soLanSai: 1 })

describe('khối Bộ câu ra đề — chip "Kiểm chứng câu đã đúng"', () => {
  it('cạnh "Kiểm tra điểm yếu"; bấm ⇒ ca đề riêng, phạm vi da_dung, số câu theo tỷ lệ ma trận (14 ⇒ 9·2·3; 28 ⇒ 18·4·6)', () => {
    const onDoi = vi.fn()
    render(<KhoiRutDe nguon={NGUON as never} qidCaTruoc={[]} phutLamBai={45} onDoi={onDoi} />)
    const chip = screen.getByText('Kiểm chứng câu đã đúng')
    expect(chip.parentElement).toBe(screen.getByText('Kiểm tra điểm yếu').parentElement)
    fireEvent.click(chip)
    const cuoi = () => onDoi.mock.calls.at(-1)?.[0] as { soCau: unknown; deRieng?: boolean; lenBang: boolean; phamViHoiLai?: string; ids: Set<string> }
    expect(cuoi()).toMatchObject({ soCau: { I: 9, II: 2, III: 3 }, deRieng: true, lenBang: false, phamViHoiLai: 'da_dung' })
    expect(cuoi().ids.size).toBe(50)
    expect(screen.getByText(/Phần I: 9 câu \(Nhận biết 6 · Thông hiểu 2 · Vận dụng 1\)/)).toBeTruthy()
    fireEvent.click(screen.getByText('28 câu'))
    expect(cuoi().soCau).toEqual({ I: 18, II: 4, III: 6 })
    // chế độ cũ không đổi: Kiểm tra điểm yếu vẫn là lên bảng, không mang phạm vi da_dung
    fireEvent.click(screen.getByText('Kiểm tra điểm yếu'))
    expect(cuoi().lenBang).toBe(true)
    expect(cuoi().phamViHoiLai).not.toBe('da_dung')
  })
})

describe('chạy thử / chốt — chỉ câu em đã đúng, nhãn theo kho, thiếu ⇒ báo', () => {
  it('em A đủ Phần I, thiếu Phần III; câu ngoài kho ca lấy từ kho máy thầy rồi nối vào ca; câu tự luận và câu không có nội dung bị bỏ', async () => {
    loadSessionTeacherBank.mockResolvedValue([{ maDe: 'D', phanI: Array.from({ length: 12 }, (_, i) => mcq(`D-I-${i}`, i < 6 ? 'biet' : i < 9 ? 'hieu' : 'van_dung')), phanII: [], phanIII: [] }])
    docSoCauCa.mockResolvedValue({ I: 7, II: 1, III: 2 }) // 10 câu
    loadExamSources.mockResolvedValue([{ maDe: 'KHO', phanI: [], phanII: [], phanIII: [tln('NGOAI-1'), { id: 'TL-1', text: 'Giải thích vì sao', correct: 'Vì có liên kết pi', kieu: 'tu_luan', mucDo: 'van_dung' }] }])
    cauDaDungTheoEm.mockResolvedValue({
      em: {
        A: [...Array.from({ length: 12 }, (_, i) => da(`D-I-${i}`, 'I', 'hieu')), da('NGOAI-1', 'III', 'van_dung', 'Chiến dịch Ôn chương 1 (Đảo thần thú)'), da('TL-1', 'III', 'van_dung'), da('MAT-1', 'III', 'hieu')],
        B: [],
      },
    })
    const rt = await chayThuRutDeDaDung('', 'MAT', 'CADD', ['A', 'B'], { ngay: '2026-10-02' })
    const boA = rt.kq.theoEm.A!
    expect(boA.filter((c) => c.phan === 'I')).toHaveLength(7)
    expect(boA.filter((c) => c.phan === 'III').map((c) => c.qid)).toEqual(['NGOAI-1'])
    expect(boA.some((c) => c.qid === 'TL-1' || c.qid === 'MAT-1')).toBe(false)
    // mức độ + nhãn theo KHO (D-I-0 là Nhận biết trong kho dù máy chủ ghi Thông hiểu)
    const d0 = boA.find((c) => c.qid === 'D-I-0')
    if (d0) expect(rt.kq.nhan.A!['D-I-0']).toBe('Ca Kiểm tra tuần 3 · 28/09 · Nhận biết')
    expect(rt.kq.nhan.A!['NGOAI-1']).toBe('Chiến dịch Ôn chương 1 (Đảo thần thú) · 28/09 · Vận dụng')
    expect(rt.kq.thieu.A!.reduce((n, t) => n + t.so, 0)).toBe(2) // 1 câu Phần II + 1 câu Phần III
    expect(rt.kq.theoEm.B).toEqual([])

    render(<BangRutThuDaDung rt={rt} dang={false} loi="" tenCua={{ A: 'An', B: 'Bình' }} onChayLai={() => {}} />)
    expect(screen.getByText('An thiếu 1 câu Phần II vì chưa làm đúng đủ')).toBeTruthy()
    expect(screen.getByText('An thiếu 1 câu Phần III vì chưa làm đúng đủ')).toBeTruthy()
    expect(screen.getByText(/chưa có câu nào đã làm đúng/)).toBeTruthy()

    const chot = await chotRutDeDaDung('', 'MAT', 'CADD', ['A', 'B'], { ngay: '2026-10-02' })
    expect(chot.boTheoEm.A).toEqual(boA.map((c) => c.qid))
    expect(chot.boTheoEm.B).toBeUndefined()
    expect(chot.banDoDaDung.daDung.A!['NGOAI-1']).toMatch(/Đảo thần thú/)
    expect(chot.banDoDaDung.demDaDung.A!['NGOAI-1']).toEqual([2, 1])
    expect(chot.soCauNoiThem).toBe(1)
    expect(noiKhoCa).toHaveBeenCalledTimes(1)
    expect(chot.canhBao.join(' ')).toMatch(/chưa làm đúng đủ câu/)
  })
})

describe('màn thi của em — nhãn dưới số câu, không lộ đáp án', () => {
  it('in "Em đã làm đúng: <nơi> · dd/mm · <mức độ>"; câu không có nhãn thì không in', () => {
    const { container } = render(
      <TheCau cheDo="thi" phan="I" stt={3} text="Câu hỏi thử" choices={['1', '2', '3', '4']} choicePerm={[0, 1, 2, 3]} selected={null} onSelect={() => {}} daDungO={{ nhan: 'Ca Kiểm tra tuần 3 · 28/09 · Thông hiểu' }} />,
    )
    const dai = container.querySelector('[data-da-dung="1"]')!
    expect(dai.textContent).toBe('Em đã làm đúng: Ca Kiểm tra tuần 3 · 28/09 · Thông hiểu')
    expect(container.textContent).not.toMatch(/Đáp án|đáp án đúng/)
    cleanup()
    const r2 = render(<TheCau cheDo="thi" phan="I" stt={1} text="Câu khác" choices={['1', '2', '3', '4']} choicePerm={[0, 1, 2, 3]} selected={null} onSelect={() => {}} />)
    expect(r2.container.querySelector('[data-da-dung]')).toBeNull()
  })

  it('màn thi nối nhãn từ máy chủ vào thẻ câu (cả ba phần)', async () => {
    const ma = (await import('../src/screens/ExamTakeScreen.tsx?raw')).default
    expect(ma.match(/daDungO=\{nhanDaDung\(item\.qid\)\}/g)).toHaveLength(3)
    expect(ma).toContain('kq.daDungNhan')
  })
})

describe('kết thúc bài — "Sai lại câu đã làm đúng", em sai nhiều nhất lên đầu', () => {
  it('thứ tự theo số câu sai, mỗi câu kèm nhãn đã đúng ở đâu', async () => {
    const { xepSaiLaiDaDung } = await import('../src/lib/rut-de-da-dung')
    const e = (sbd: string, hoTen: string, sai: number) => ({ sbd, hoTen, tong: 14, sai: Array.from({ length: sai }, (_, i) => ({ soCau: i + 1, phan: 'I' as const, qid: `${sbd}-${i}`, nhan: `Ca Tuần ${i + 1} · 28/09 · Thông hiểu`, soLanDung: 1, soLanSai: 0 })) })
    const ds = xepSaiLaiDaDung([e('1', 'An', 1), e('2', 'Bình', 4), e('3', 'Chi', 0)])
    const { container } = render(<KhoiSaiLaiDaDung ds={ds} soEmDaCham={3} />)
    expect([...container.querySelectorAll('li[data-sbd]')].map((x) => x.getAttribute('data-sbd'))).toEqual(['2', '1'])
    expect(screen.getByText(/2 em sai lại · 5 câu/)).toBeTruthy()
    expect(screen.getAllByText(/đã làm đúng: Ca Tuần 1 · 28\/09 · Thông hiểu/).length).toBe(2)
  })

  it('màn Theo dõi: ca chế độ này vẽ khối mới thay khối "câu em sai buổi trước", chốt không lùi về đường rút cũ', async () => {
    const ma = (await import('../src/screens/ExamMonitorScreen.tsx?raw')).default
    expect(ma).toContain('{laCaDaDungNay && <KhoiSaiLaiDaDung ds={emSaiLaiDaDung}')
    const than = ma.slice(ma.indexOf('const batDauCaNay = async'), ma.indexOf('const huyCaCho = async'))
    expect(than.indexOf('chotRutDeDaDung(')).toBeGreaterThan(0)
    expect(than.indexOf('chotRutDeDaDung(')).toBeLessThan(than.indexOf('chotRutDeCa('))
  })
})
