// CA "KIỂM CHỨNG CÂU ĐÃ ĐÚNG" — THAY CÂU (thầy 06/10) — PHẦN MÁY THẦY / MÁY EM:
//   · chạy thử + chốt: câu em đã đúng được thay bằng bản đổi số (câu tính toán) / câu cùng dạng (câu lý thuyết); nối câu thay vào kho ca; nhãn ghi rõ;
//   · không hỏi được máy chủ / công tắc tắt / không có bản thay / không nối được kho ca ⇒ GIỮ NGUYÊN câu em đã đúng và nói ra — ca không bao giờ bị chặn;
//   · bảng Xem trước phân bổ + báo cáo cuối bài + màn thi của em.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

const cauDaDungTheoEm = vi.fn()
const cauThayTheoEm = vi.fn()
const noiKhoCa = vi.fn(async (..._a: unknown[]) => ({ themBank: 1, themKey: 1 }))
const loadSessionTeacherBank = vi.fn()
const saveSessionTeacherBank = vi.fn(async (..._a: unknown[]) => {})
const docSoCauCa = vi.fn()
const loadExamSources = vi.fn(async () => [] as unknown[])

vi.mock('../src/lib/exam-api', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  cauDaDungTheoEm: (...a: unknown[]) => cauDaDungTheoEm(...a),
  cauThayTheoEm: (...a: unknown[]) => cauThayTheoEm(...a),
  noiKhoCa: (...a: unknown[]) => noiKhoCa(...a),
}))
vi.mock('../src/lib/exam-db', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  loadSessionTeacherBank: (...a: unknown[]) => loadSessionTeacherBank(...a),
  saveSessionTeacherBank: (...a: unknown[]) => saveSessionTeacherBank(...a),
  docSoCauCa: (...a: unknown[]) => docSoCauCa(...a),
  loadExamSources: (...a: unknown[]) => loadExamSources(...(a as [])),
}))

const { chayThuRutDeDaDung, chotRutDeDaDung, boRutThuDaDung } = await import('../src/lib/de-rieng-da-dung')
const { BangRutThuDaDung, KhoiSaiLaiDaDung } = await import('../src/components/ca-thi/KhoiDaDung')
const { default: TheCau } = await import('../src/components/TheCau')
const { xepSaiLaiDaDung, nhanThay } = await import('../src/lib/rut-de-da-dung')

beforeEach(() => {
  cauDaDungTheoEm.mockReset(); cauThayTheoEm.mockReset(); noiKhoCa.mockClear(); noiKhoCa.mockImplementation(async () => ({ themBank: 1, themKey: 1 }))
  loadSessionTeacherBank.mockReset(); saveSessionTeacherBank.mockClear(); docSoCauCa.mockReset(); loadExamSources.mockReset(); loadExamSources.mockResolvedValue([])
  boRutThuDaDung('CAT')
})
afterEach(() => cleanup())

// Kho ca: 6 câu Phần I (4 tính toán + 2 lý thuyết) + 2 Phần III; ca 3 câu = 2 Phần I + 1 Phần III? — dùng 3 câu Phần I + 1 Phần III cho gọn.
const mcq = (id: string, mucDo = 'hieu', them: Record<string, unknown> = {}) => ({ id, text: `Đề ${id}`, choices: ['1', '2', '3', '4'] as [string, string, string, string], correct: 'A' as const, chuyenDe: 'Ester', mucDo, kieu: 'bai_tap', ...them })
const tln = (id: string, mucDo = 'van_dung') => ({ id, text: `Tính ${id} (lít)`, correct: '2,24', chuyenDe: 'Ester', mucDo })
const NGUON = [{ maDe: 'D', phanI: [mcq('T1'), mcq('T2'), mcq('LT1', 'hieu', { kieu: 'ly_thuyet', text: 'Phát biểu nào sau đây đúng?' }), mcq('KHAC1'), mcq('KHAC2')], phanII: [], phanIII: [tln('N1'), tln('N2')] }]
const da = (qid: string, phan: 'I' | 'III', mucDo: string, noi = 'Ca Kiểm tra tuần 3') => ({ qid, phan, mucDo, dang: '', noi, ngayDung: '2026-09-28', nhan: '', lucDung: '2026-09-28T03:00:00Z', soLanDung: 2, soLanSai: 1 })
const NHAN_T1 = 'Ca Kiểm tra tuần 3 · 28/09 · Thông hiểu'

/** Bản thay máy chủ trả: câu đổi số (có đáp án) cho T1 và N1; câu anh em cho LT1 (nội dung có trong kho máy thầy). */
const banThay = (them: Record<string, unknown> = {}) => ({
  bat: true,
  loi: [] as string[],
  dem: { ss: 2, bt: 0, ae: 1, giu: 0 },
  em: {
    A: {
      T1: { cach: 'ss', kieu: 'thay_so', id: 'T1~ss0', phan: 'I', mucDo: 'hieu', dang: '', cau: { id: 'T1~ss0', phan: 'I', text: 'Song sinh của T1', choices: ['5', '6', '7', '8'], correct: 'C' } },
      N1: { cach: 'bt', kieu: 'thay_so', id: 'N1~bt4', phan: 'III', mucDo: 'van_dung', dang: '', cau: { id: 'N1~bt4', phan: 'III', text: 'Biến thể của N1 (lít)', correct: '3,36' } },
      LT1: { cach: 'ae', kieu: 'cung_dang', id: 'ANH-EM-1', phan: 'I', mucDo: 'hieu', dang: '', maDe: 'KHO' },
    },
  },
  ...them,
})

function dungDauVao() {
  loadSessionTeacherBank.mockResolvedValue(NGUON)
  docSoCauCa.mockResolvedValue({ I: 3, II: 0, III: 1 }) // 4 câu
  loadExamSources.mockResolvedValue([{ maDe: 'KHO', phanI: [mcq('ANH-EM-1', 'hieu', { text: 'Phát biểu khác về cùng dạng?', kieu: 'ly_thuyet' })], phanII: [], phanIII: [] }])
  cauDaDungTheoEm.mockResolvedValue({ em: { A: [da('T1', 'I', 'hieu'), da('LT1', 'I', 'hieu'), da('KHAC1', 'I', 'hieu'), da('N1', 'III', 'van_dung')] } })
}

describe('chạy thử — câu em đã đúng được thay, nhãn ghi rõ, câu thay nối vào kho ca', () => {
  it('câu tính toán ⇒ bản đổi số (song sinh / biến thể); câu lý thuyết ⇒ câu anh em; câu khác không có bản thay ⇒ giữ nguyên', async () => {
    dungDauVao()
    cauThayTheoEm.mockResolvedValue(banThay())
    const rt = await chayThuRutDeDaDung('', 'MAT', 'CAT', ['A'], { ngay: '2026-10-06' })
    expect(rt.thay.trangThai).toBe('bat')
    const a = rt.kq.theoEm.A!
    expect(a.map((c) => c.qid).sort()).toEqual(['ANH-EM-1', 'KHAC1', 'N1~bt4', 'T1~ss0'])
    expect(a.find((c) => c.qid === 'T1~ss0')).toMatchObject({ goc: 'T1', thay: 'thay_so', phan: 'I' })
    expect(a.find((c) => c.qid === 'N1~bt4')).toMatchObject({ goc: 'N1', thay: 'thay_so', phan: 'III' })
    expect(a.find((c) => c.qid === 'ANH-EM-1')).toMatchObject({ goc: 'LT1', thay: 'cung_dang', lyThuyet: true })
    expect(a.find((c) => c.qid === 'KHAC1')?.thay).toBeUndefined()
    // nhãn: thay số / câu lý thuyết thay / nguyên văn
    expect(rt.kq.nhan.A!['T1~ss0']).toBe(`Câu này thay số của câu em đã đúng ở ${NHAN_T1}`)
    expect(rt.kq.nhan.A!['ANH-EM-1']).toBe(`Câu lý thuyết này thay cho câu em đã đúng ở ${NHAN_T1} (cùng dạng bài, nội dung khác)`)
    expect(rt.kq.nhan.A!.KHAC1).toBe(NHAN_T1)
    expect(rt.kq.dem.A!['T1~ss0']).toEqual([2, 1]) // đếm đúng/sai cũ của câu gốc
    // câu đổi số mang ĐÁP ÁN ở máy thầy để nối kho ca; câu anh em nội dung lấy từ kho máy thầy
    expect(rt.cauNgoai['T1~ss0']).toMatchObject({ phan: 'I', cau: { id: 'T1~ss0', correct: 'C', mucDo: 'hieu', chuyenDe: 'Ester' } })
    expect(rt.cauNgoai['N1~bt4']).toMatchObject({ phan: 'III', cau: { id: 'N1~bt4', correct: '3,36' } })
    expect(rt.cauNgoai['ANH-EM-1']).toBeTruthy()
    expect(rt.thay.theoEm.A).toEqual({ T1: { id: 'T1~ss0', kieu: 'thay_so' }, N1: { id: 'N1~bt4', kieu: 'thay_so' }, LT1: { id: 'ANH-EM-1', kieu: 'cung_dang' } })
    expect(rt.thay.lyThuyet).toContain('LT1')
    // yêu cầu gửi máy chủ: có cờ lý thuyết, không có đáp án
    const yeuCau = cauThayTheoEm.mock.calls[0]!
    expect(yeuCau[2]).toBe('CAT')
    const cauA = (yeuCau[3] as Record<string, { qid: string; lyThuyet: boolean; bu: boolean }[]>).A!
    expect(cauA.find((x) => x.qid === 'LT1')).toMatchObject({ lyThuyet: true, bu: false })
    expect(cauA.find((x) => x.qid === 'T1')).toMatchObject({ lyThuyet: false, bu: false })
    expect(JSON.stringify(yeuCau[3])).not.toContain('correct')
  })

  it('chốt: nối câu thay vào kho ca (bản có đáp án) MỘT lần; bản đồ chốt mang qid câu thay + nhãn; biên bản đếm đủ; không cảnh báo thừa', async () => {
    dungDauVao()
    cauThayTheoEm.mockResolvedValue(banThay())
    const rt = await chayThuRutDeDaDung('', 'MAT', 'CAT', ['A'], { ngay: '2026-10-06' })
    cauThayTheoEm.mockClear()
    const chot = await chotRutDeDaDung('', 'MAT', 'CAT', ['A'], { ngay: '2026-10-06' })
    expect(cauThayTheoEm).not.toHaveBeenCalled() // dùng lại kết quả chạy thử
    expect(chot.boTheoEm.A).toEqual(rt.kq.theoEm.A!.map((c) => c.qid))
    expect(chot.banDoDaDung.daDung.A!['T1~ss0']).toMatch(/^Câu này thay số của câu em đã đúng ở Ca Kiểm tra tuần 3/)
    expect(chot.banDoDaDung.daDung.A!['ANH-EM-1']).toMatch(/^Câu lý thuyết này thay cho câu em đã đúng ở /)
    expect(chot.banDoDaDung.daDung.A!.KHAC1).toBe(NHAN_T1)
    expect(chot.banDoDaDung.demDaDung.A!['T1~ss0']).toEqual([2, 1])
    expect(noiKhoCa).toHaveBeenCalledTimes(1)
    const [, , , gui, phan] = noiKhoCa.mock.calls[0] as unknown as [string, string, string, { phanI?: { id: string }[]; phanIII?: { id: string }[] }, { phanI: { id: string; correct?: string }[]; phanIII: { id: string; correct?: string }[] }]
    expect(phan.phanI.map((x) => x.id).sort()).toEqual(['ANH-EM-1', 'T1~ss0'])
    expect(phan.phanIII.map((x) => x.id)).toEqual(['N1~bt4'])
    expect(phan.phanI.find((x) => x.id === 'T1~ss0')!.correct).toBe('C') // kho đáp án của ca có đáp án câu thay
    expect(chot.soCauNoiThem).toBe(3)
    expect(chot.soCauThay).toEqual({ thaySo: 2, cungDang: 1, giuNguyen: 1 })
    expect(saveSessionTeacherBank).toHaveBeenCalledTimes(1)
    const luu = saveSessionTeacherBank.mock.calls[0]![1] as { maDe: string; phanI: { id: string }[] }[]
    expect(luu.at(-1)!.phanI.map((x) => x.id)).toContain('T1~ss0')
    const th = (chot.bienBan.daDung as { thay: Record<string, unknown> }).thay
    expect(th).toMatchObject({ trangThai: 'bat', thaySo: 2, cungDang: 1, lyThuyet: 1, giuNguyen: 1, emGiuNguyen: 1, khongDung: 0 })
    expect(th.cungDangTheoEm).toEqual({ A: [['LT1', 'ANH-EM-1']] })
    expect(chot.canhBao.join(' ')).toMatch(/1 câu em đã làm đúng \(1 em\) chưa có câu thay phù hợp — giữ nguyên văn/)
    expect(chot.canhBao.join(' ')).not.toMatch(/Chưa thay được|TẮT/)
  })
})

describe('dự phòng — việc thay câu KHÔNG BAO GIỜ làm hỏng ca: giữ nguyên câu em đã đúng và nói ra', () => {
  const nguyenVan = (rt: Awaited<ReturnType<typeof chayThuRutDeDaDung>>) => {
    expect(rt.kq.theoEm.A!.map((c) => c.qid).sort()).toEqual(['KHAC1', 'LT1', 'N1', 'T1'])
    expect(rt.kq.theoEm.A!.some((c) => c.thay || c.goc)).toBe(false)
    expect(rt.kq.nhan.A!.T1).toBe(NHAN_T1) // nhãn nơi như trước ("Em đã làm đúng: …" ở máy em)
  }
  it('máy chủ chưa có lệnh / mạng lỗi ⇒ nguyên văn + trạng thái loi + cảnh báo lúc Bắt đầu', async () => {
    dungDauVao()
    cauThayTheoEm.mockRejectedValue(new Error('Máy chủ chưa có lệnh thay câu đã làm đúng'))
    const rt = await chayThuRutDeDaDung('', 'MAT', 'CAT', ['A'], { ngay: '2026-10-06' })
    expect(rt.thay).toMatchObject({ trangThai: 'loi', loi: 'Máy chủ chưa có lệnh thay câu đã làm đúng' })
    nguyenVan(rt)
    const chot = await chotRutDeDaDung('', 'MAT', 'CAT', ['A'], { ngay: '2026-10-06' })
    expect(chot.boTheoEm.A!.sort()).toEqual(['KHAC1', 'LT1', 'N1', 'T1'])
    expect(chot.canhBao.join(' ')).toMatch(/Chưa thay được câu em đã làm đúng \(Máy chủ chưa có lệnh thay câu đã làm đúng\) — em nhận NGUYÊN VĂN/)
    expect(noiKhoCa).not.toHaveBeenCalled() // không câu ngoài kho cần nối
  })
  it('công tắc máy chủ TẮT ⇒ nguyên văn + trạng thái tat + cảnh báo', async () => {
    dungDauVao()
    cauThayTheoEm.mockResolvedValue({ bat: false, em: {}, dem: { ss: 0, bt: 0, ae: 0, giu: 0 }, loi: [] })
    const rt = await chayThuRutDeDaDung('', 'MAT', 'CAT', ['A'], { ngay: '2026-10-06' })
    expect(rt.thay.trangThai).toBe('tat')
    nguyenVan(rt)
    expect((await chotRutDeDaDung('', 'MAT', 'CAT', ['A'], { ngay: '2026-10-06' })).canhBao.join(' ')).toMatch(/đang TẮT ở máy chủ — em nhận nguyên văn/)
  })
  it('bản thay hỏng (câu đổi số thiếu phương án / sai kiểu; câu anh em không có nội dung trong kho máy thầy) ⇒ chỉ riêng câu ấy giữ nguyên, đếm "khongDung"', async () => {
    dungDauVao()
    const bt = banThay()
    ;(bt.em.A.T1 as { cau: { choices: string[] } }).cau.choices = ['5', '6', '7'] // thiếu một phương án
    ;(bt.em.A.LT1 as { id: string }).id = 'KHONG-CO-TRONG-KHO-MAY'
    cauThayTheoEm.mockResolvedValue(bt)
    const rt = await chayThuRutDeDaDung('', 'MAT', 'CAT', ['A'], { ngay: '2026-10-06' })
    expect(rt.thay.khongDung).toBe(2)
    expect(rt.kq.theoEm.A!.map((c) => c.qid).sort()).toEqual(['KHAC1', 'LT1', 'N1~bt4', 'T1'])
    expect(rt.kq.nhan.A!.LT1).toBe(NHAN_T1)
    expect(rt.cauNgoai['T1~ss0']).toBeUndefined()
  })
  it('máy chủ trả lệch (id của câu thay ≠ id của nội dung; phần của nội dung ≠ phần khai) ⇒ KHÔNG dùng, câu giữ nguyên — không bao giờ nối một câu sai id vào kho ca', async () => {
    dungDauVao()
    const bt = banThay()
    ;(bt.em.A.T1 as { cau: { id: string } }).cau.id = 'T1~ss9' // id nội dung ≠ id khai
    ;(bt.em.A.N1 as { phan: string }).phan = 'I' // khai Phần I nhưng nội dung là Phần III
    cauThayTheoEm.mockResolvedValue(bt)
    const rt = await chayThuRutDeDaDung('', 'MAT', 'CAT', ['A'], { ngay: '2026-10-06' })
    expect(rt.thay.khongDung).toBe(2)
    expect(rt.kq.theoEm.A!.map((c) => c.qid).sort()).toEqual(['ANH-EM-1', 'KHAC1', 'N1', 'T1'])
    expect(Object.keys(rt.cauNgoai).filter((k) => k.includes('~'))).toEqual([])
  })
  it('nối kho ca hỏng ⇒ rút lại cả lớp NGUYÊN VĂN (không câu thay), cảnh báo rõ, trạng thái loi', async () => {
    dungDauVao()
    cauThayTheoEm.mockResolvedValue(banThay())
    noiKhoCa.mockRejectedValue(new Error('mạng đứt'))
    await chayThuRutDeDaDung('', 'MAT', 'CAT', ['A'], { ngay: '2026-10-06' })
    const chot = await chotRutDeDaDung('', 'MAT', 'CAT', ['A'], { ngay: '2026-10-06' })
    expect(chot.boTheoEm.A!.some((q) => q.includes('~') || q === 'ANH-EM-1')).toBe(false)
    expect(chot.canhBao.join(' ')).toMatch(/Không nối được .* câu thay .* nhận nguyên văn câu đã làm đúng/)
    expect((chot.bienBan.daDung as { thay: { trangThai: string } }).thay.trangThai).toBe('loi')
    expect(chot.banDoDaDung.daDung.A!.T1).toBe(NHAN_T1)
  })
  it('máy chủ báo em lỗi đọc ⇒ em ấy nguyên văn, lượt vẫn chạy, cảnh báo nêu số em', async () => {
    dungDauVao()
    cauThayTheoEm.mockResolvedValue({ bat: true, em: { A: {} }, dem: { ss: 0, bt: 0, ae: 0, giu: 4 }, loi: ['A'] })
    const rt = await chayThuRutDeDaDung('', 'MAT', 'CAT', ['A'], { ngay: '2026-10-06' })
    expect(rt.thay.emLoi).toEqual(['A'])
    nguyenVan(rt)
    expect((await chotRutDeDaDung('', 'MAT', 'CAT', ['A'], { ngay: '2026-10-06' })).canhBao.join(' ')).toMatch(/1 em máy chủ không tìm được câu thay/)
  })
  it('em vào phòng chờ SAU lượt chạy thử ⇒ chốt rút + thay riêng cho em ấy, em cũ giữ nguyên bộ', async () => {
    dungDauVao()
    cauThayTheoEm.mockResolvedValueOnce(banThay())
    const rt = await chayThuRutDeDaDung('', 'MAT', 'CAT', ['A'], { ngay: '2026-10-06' })
    const boA = rt.kq.theoEm.A!.map((c) => c.qid)
    cauDaDungTheoEm.mockResolvedValue({ em: { B: [da('T2', 'I', 'hieu'), da('N2', 'III', 'van_dung')] } })
    cauThayTheoEm.mockResolvedValueOnce({ bat: true, dem: { ss: 1, bt: 0, ae: 0, giu: 1 }, loi: [], em: { B: { T2: { cach: 'ss', kieu: 'thay_so', id: 'T2~ss1', phan: 'I', mucDo: 'hieu', dang: '', cau: { id: 'T2~ss1', phan: 'I', text: 'Song sinh T2', choices: ['1', '2', '3', '4'], correct: 'B' } } } } })
    const chot = await chotRutDeDaDung('', 'MAT', 'CAT', ['A', 'B'], { ngay: '2026-10-06' })
    expect(chot.soEmRutThem).toBe(1)
    expect(chot.boTheoEm.A).toEqual(boA)
    expect(chot.boTheoEm.B).toContain('T2~ss1')
    expect(chot.banDoDaDung.daDung.B!['T2~ss1']).toMatch(/^Câu này thay số của câu em đã đúng ở /)
    expect(cauThayTheoEm).toHaveBeenCalledTimes(2)
    expect(Object.keys(cauThayTheoEm.mock.calls[1]![3] as object)).toEqual(['B']) // chỉ hỏi cho em mới
  })
})

describe('thầy bấm Bắt đầu khi chạy thử còn dở', () => {
  it('chốt ĐỢI lượt chạy thử đang chạy — không chạy lại cả lớp (bước tìm câu thay chỉ hỏi máy chủ MỘT lần)', async () => {
    dungDauVao()
    let tra!: (v: unknown) => void
    cauThayTheoEm.mockImplementation(() => new Promise((r) => { tra = r }))
    const chay = chayThuRutDeDaDung('', 'MAT', 'CAT', ['A'], { ngay: '2026-10-06' })
    const chot = chotRutDeDaDung('', 'MAT', 'CAT', ['A'], { ngay: '2026-10-06' })
    for (let i = 0; i < 100 && cauThayTheoEm.mock.calls.length === 0; i++) await new Promise((r) => setTimeout(r, 5))
    expect(cauThayTheoEm).toHaveBeenCalledTimes(1)
    tra(banThay())
    const [rt, c] = await Promise.all([chay, chot])
    expect(cauThayTheoEm).toHaveBeenCalledTimes(1)
    expect(cauDaDungTheoEm).toHaveBeenCalledTimes(1)
    expect(c.boTheoEm.A).toEqual(rt.kq.theoEm.A!.map((x) => x.qid))
    expect(c.boTheoEm.A).toContain('T1~ss0')
  })
  it('chạy thử HỎNG (mất mạng đọc câu đã đúng) rồi bấm Bắt đầu ⇒ chốt tự chạy lại, không treo vì lượt hỏng', async () => {
    dungDauVao()
    cauDaDungTheoEm.mockRejectedValueOnce(new Error('mất mạng'))
    await expect(chayThuRutDeDaDung('', 'MAT', 'CAT', ['A'], { ngay: '2026-10-06' })).rejects.toThrow('mất mạng')
    cauThayTheoEm.mockResolvedValue(banThay())
    const c = await chotRutDeDaDung('', 'MAT', 'CAT', ['A'], { ngay: '2026-10-06' })
    expect(c.boTheoEm.A).toContain('T1~ss0')
  })
})

describe('giao diện thầy — bảng Xem trước phân bổ + báo cáo cuối bài', () => {
  it('bảng nói thật: số câu thay số · thay bằng câu cùng dạng (lý thuyết) · giữ nguyên, em còn câu giữ nguyên; tiến độ khi đang tìm', async () => {
    dungDauVao()
    cauThayTheoEm.mockResolvedValue(banThay())
    const rt = await chayThuRutDeDaDung('', 'MAT', 'CAT', ['A'], { ngay: '2026-10-06' })
    const { container } = render(<BangRutThuDaDung rt={rt} dang={false} loi="" tenCua={{ A: 'An' }} onChayLai={() => {}} />)
    const khoi = container.querySelector('[data-khoi="thay-cau-da-dung"]')!
    expect(khoi.textContent).toMatch(/Thay câu đã làm đúng: 2 câu thay số · 1 câu thay bằng câu cùng dạng \(trong đó 1 câu lý thuyết\) · 1 câu giữ nguyên văn vì chưa có câu thay phù hợp \(1 em\)/)
    expect(container.querySelector('[data-khoi="em-giu-nguyen-da-dung"]')!.textContent).toContain('An: 1 câu giữ nguyên văn')
    cleanup()
    render(<BangRutThuDaDung rt={null} dang loi="" tenCua={{}} tienDoThay={{ xong: 8, tong: 30 }} onChayLai={() => {}} />)
    expect(screen.getByRole('status').textContent).toBe('Đang tìm câu thay số cho từng em: 8/30 em…')
  })
  it('trạng thái lỗi / tắt nói rõ em nhận NGUYÊN VĂN', async () => {
    dungDauVao()
    cauThayTheoEm.mockRejectedValue(new Error('mất mạng'))
    const rt = await chayThuRutDeDaDung('', 'MAT', 'CAT', ['A'], { ngay: '2026-10-06' })
    render(<BangRutThuDaDung rt={rt} dang={false} loi="" tenCua={{}} onChayLai={() => {}} />)
    expect(screen.getByRole('alert').textContent).toMatch(/Chưa thay được câu đã làm đúng \(mất mạng\) — em sẽ nhận NGUYÊN VĂN câu đã làm đúng/)
    cleanup()
    cauThayTheoEm.mockResolvedValue({ bat: false, em: {}, dem: { ss: 0, bt: 0, ae: 0, giu: 0 }, loi: [] })
    boRutThuDaDung('CAT')
    const rt2 = await chayThuRutDeDaDung('', 'MAT', 'CAT', ['A'], { ngay: '2026-10-06' })
    render(<BangRutThuDaDung rt={rt2} dang={false} loi="" tenCua={{}} onChayLai={() => {}} />)
    expect(screen.getByText(/Thay câu đã làm đúng đang TẮT ở máy chủ/)).toBeTruthy()
  })
  it('báo cáo cuối bài: câu đã thay in cả nhãn thay (không lặp "đã làm đúng:"), câu nguyên văn vẫn "đã làm đúng: …"', () => {
    const ds = xepSaiLaiDaDung([{ sbd: '1', hoTen: 'An', tong: 3, sai: [
      { soCau: 1, phan: 'I', qid: 'a', nhan: nhanThay('thay_so', false, NHAN_T1), soLanDung: 2, soLanSai: 1 },
      { soCau: 2, phan: 'I', qid: 'b', nhan: nhanThay('cung_dang', true, NHAN_T1) },
      { soCau: 3, phan: 'III', qid: 'c', nhan: NHAN_T1 },
    ] }])
    const { container } = render(<KhoiSaiLaiDaDung ds={ds} soEmDaCham={1} />)
    const dong = [...container.querySelectorAll('li[data-sbd] > div:last-child > div')].map((x) => x.textContent ?? '')
    expect(dong[0]).toContain(`Câu này thay số của câu em đã đúng ở ${NHAN_T1}`)
    expect(dong[0]).not.toMatch(/đã làm đúng:/)
    expect(dong[1]).toContain('Câu lý thuyết này thay cho câu em đã đúng ở')
    expect(dong[2]).toContain(`đã làm đúng: ${NHAN_T1}`)
  })
})

describe('màn Theo dõi — nối tiến độ và thông báo thay câu', () => {
  it('chạy thử truyền tiến độ vào bảng; Bắt đầu báo số câu đã thay (mã nguồn)', async () => {
    const ma = (await import('../src/screens/ExamMonitorScreen.tsx?raw')).default
    expect(ma).toContain('tienDoThay={tienDoThay}')
    expect(ma).toContain('{ tienDo: (xong, tong) => setTienDoThay({ xong, tong }) }')
    expect(ma).toContain('dd.soCauThay.thaySo + dd.soCauThay.cungDang > 0')
    expect(ma).toContain('setTienDoThay(null)')
  })
})

describe('màn thi của em — nhãn câu thay in nguyên văn, nhãn câu cũ vẫn "Em đã làm đúng: …"', () => {
  it('in đúng lời thầy cho câu thay số; câu lý thuyết có lời riêng; không lộ đáp án', () => {
    const the = (nhan: string) => render(<TheCau cheDo="thi" phan="I" stt={3} text="Câu hỏi thử" choices={['1', '2', '3', '4']} choicePerm={[0, 1, 2, 3]} selected={null} onSelect={() => {}} daDungO={{ nhan }} />).container.querySelector('[data-da-dung="1"]')!.textContent
    expect(the(nhanThay('thay_so', false, NHAN_T1))).toBe(`Câu này thay số của câu em đã đúng ở ${NHAN_T1}`)
    cleanup()
    expect(the(nhanThay('cung_dang', true, NHAN_T1))).toBe(`Câu lý thuyết này thay cho câu em đã đúng ở ${NHAN_T1} (cùng dạng bài, nội dung khác)`)
    cleanup()
    expect(the(NHAN_T1)).toBe(`Em đã làm đúng: ${NHAN_T1}`)
  })
})
