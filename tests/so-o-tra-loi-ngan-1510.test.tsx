// @vitest-environment jsdom
// SỐ Ô TRẢ LỜI NGẮN THEO TỪNG CÂU — sửa lỗi 15/10 (em Lê Công báo 04:38): câu DH-10-C1-B1-III-18 đáp án "10000" mà màn làm bài (bản dot13 12/10) chỉ
// cho 4 ô ⇒ em nhập được "1000", gửi "1000", bị chấm sai. Nguyên nhân gốc: `TOI_DA_KY_TU = 4` cứng trong `nhanPhim` (bàn phím số lẫn phím máy tính).
// Khoá: (1) gõ đủ "10000" (bàn phím số + phím máy tính), gửi "10000", máy chủ chấm đúng, máy chủ không cắt độ dài; (2) câu ≤ 4 kí tự giữ 4 ô, đáp án
// không xuống máy em; (3) BẤT BIẾN trên kho thật (D1 15/10, tests/fixtures/kho-phan3-so-o-1510.json): mọi câu phần III vào kênh nhập số gõ ĐỦ đáp số
// trong số ô máy chủ gửi; câu đáp án chữ (tự luận gắn nhầm phần III) và đáp số không gõ được không vào kênh nhập số (chốt ở kho game lúc nhập kho
// `normalizeBank` + lúc phát `currentQuestion`; luật tự luận dùng chung `laCauTuLuan` KHÔNG đổi).
// CẬP NHẬT 15/10 ~10:30 theo lệnh thầy ("tuỳ vào đáp án mà hiển thị đúng số ô cần điền", ảnh câu "24" hiện 4 ô): số ô = ĐÚNG số kí tự đáp số gõ chuẩn,
// bỏ mức cố định 4 / 8 ô. Các ca khẳng định "câu ≤ 4 kí tự không có soO", "mọi câu dài cùng 8 ô" đổi theo luật mới; luật mới khoá ở so-o-dung-do-dai-1510.
/** Câu KHÔNG vào kênh nhập số của màn làm bài: tự luận (luật chung) hoặc bàn phím số không gõ đủ (chốt kênh số). */
const ngoaiKenh = (q: PrivateQuestion) => laCauTuLuan(q) || ngoaiKenhSo(q)
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ManLamBaiTap from '../src/components/hoc-tap/ManLamBaiTap'
import { goiHoa2 } from '../src/components/hoa2/api'
import { nhanPhim, phimTuBanPhim, type PhimSo } from '../src/components/hoc-tap/lam-bai'
import { grade, publicQuestion, type PrivateQuestion } from '../src/game/than-thu-v2/core'
import { khopPhanIII } from '../src/lib/cham-so'
import { laCauTuLuan } from '../src/lib/cau-tu-luan'
import { SO_O_PHIEU, TRAN_O, dapSoGoPhim, ngoaiKenhSo, soOCuaCau, soOPhanIII } from '../src/lib/so-o-tra-loi-ngan'
import { normalizeBank } from '../server/src/game-v2-bank'
vi.mock('../src/components/hoa2/api', async (goc) => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: vi.fn() }))
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.mocked(goiHoa2).mockReset(); localStorage.clear() })

const KHO = JSON.parse(readFileSync(resolve(__dirname, 'fixtures/kho-phan3-so-o-1510.json'), 'utf8')) as { dai: { qid: string; maDe: string; c: string; tuLuan?: true }[]; ngan: string[] }
const cauIII = (qid: string, maDe: string, correct: string, them: Partial<PrivateQuestion> = {}): PrivateQuestion => ({
  qid, maDe, version: 'v1', group: 'g', phan: 'III', text: 'Hỏi gấp bao nhiêu lần?', choices: [], ideas: [], hinhAnh: [], dang: null, tenDang: '', mucDo: null, sao: null, kienThuc: [],
  correct, solution: 'Lời giải', reviewed: true, ...them,
})
/** Gõ một chuỗi bằng bàn phím số của màn làm bài (đúng phép `nhanPhim`). */
const go = (chuoi: string, soO?: number) => [...chuoi].reduce((v, c) => nhanPhim(v, c as PhimSo, soO), '')

describe('nguyên nhân gốc và cách sửa (phép thuần)', () => {
  it('câu DH-10-C1-B1-III-18: máy chủ gửi 5 ô (đúng số kí tự, thầy 15/10), em gõ đủ 10000; không có số ô thì vẫn 4 như phiếu', () => {
    const q = cauIII('DH-10-C1-B1-III-18', 'DH-10-C1-B1', '10000')
    const pub = publicQuestion(q) as unknown as Record<string, unknown>
    expect(pub.soO).toBe(5)
    expect(pub).not.toHaveProperty('correct'); expect(pub).not.toHaveProperty('solution')
    expect(JSON.stringify(pub)).not.toContain('10000') // chỉ con số ô, không lộ đáp án
    // số ô = đúng số kí tự đáp số gõ chuẩn (thầy 15/10 ~10:25 thay mức cố định 8)
    expect(['10000', '6724,2', '13507,3', '-96,9', '1,2375×10⁹ kJ'].map(soOPhanIII)).toEqual([5, 6, 7, 5, 6])
    expect(go('10000', soOCuaCau(pub))).toBe('10000')
    expect(go('10000')).toBe('1000') // hành vi cũ khi thiếu số ô (bản trước sửa) — đúng lỗi em báo
    // phím máy tính đi cùng phép
    expect(['1', '0', '0', '0', '0'].map(phimTuBanPhim).reduce((v, p) => nhanPhim(v, p!, TRAN_O), '')).toBe('10000')
  })
  it('máy chủ chấm "10000" ĐÚNG, "1000" SAI, ở cả luật luyện lẫn luật game; không cắt độ dài', () => {
    const q = cauIII('DH-10-C1-B1-III-18', 'DH-10-C1-B1', '10000')
    expect(khopPhanIII('10000', q.correct)).toBe(true); expect(grade(q, '10000')).toBe(true)
    expect(khopPhanIII('1000', q.correct)).toBe(false); expect(grade(q, '1000')).toBe(false)
  })
  it('câu ≤ 4 kí tự: số ô = đúng số kí tự đáp số gõ (thầy 15/10, trước là "không thêm trường, 4 ô"); phần I/II không có số ô', () => {
    const SO = [['1234', 4], ['-1,5', 4], ['0,54', 4], ['7', 1], ['25%', 2], ['0,1 mol', 3], ['1,76.10⁻⁵', 4]] as const
    for (const [c, n] of SO) expect((publicQuestion(cauIII('q', 'd', c)) as { soO?: number }).soO, c).toBe(n)
    const tn = { ...cauIII('q1', 'd', 'A'), phan: 'I' as const, choices: ['a', 'b', 'c', 'd'] }
    expect(publicQuestion(tn)).not.toHaveProperty('soO')
    expect(soOCuaCau({})).toBe(SO_O_PHIEU); expect(soOCuaCau({ soO: 3 })).toBe(3); expect(soOCuaCau({ soO: 99 })).toBe(SO_O_PHIEU); expect(soOCuaCau({ soO: '6' })).toBe(6)
  })
  it('đáp số gõ: số mũ ⇒ định trị, đơn vị viết theo bị bỏ, phân cách nghìn gộp; không gõ được ⇒ null', () => {
    expect(dapSoGoPhim('1,2375×10⁹ kJ')).toBe('1,2375'); expect(soOPhanIII('1,2375×10⁹ kJ')).toBe(6)
    expect(dapSoGoPhim('≈ 6724,2 kJ')).toBe('6724,2'); expect(dapSoGoPhim('0.54')).toBe('0,54'); expect(dapSoGoPhim('1.237.500')).toBe('1237500')
    expect(dapSoGoPhim('-96,9')).toBe('-96,9'); expect(soOPhanIII('-96,9')).toBe(5); expect(soOPhanIII('-9,6')).toBe(4)
    for (const c of ['AlCl₃', 'Na mạnh hơn Mg', 'p = 8; n = 8', '', '13,1 g; 14,1 g']) expect(soOPhanIII(c)).toBeNull()
    expect(soOPhanIII('123456789')).toBeNull() // cần hơn TRAN_O ô
  })
})

describe('BẤT BIẾN trên kho thật (D1 15/10): câu phần III vào kênh nhập số ⇒ gõ đủ đáp số trong số ô máy chủ gửi', () => {
  it('307 câu đáp án dài hơn 4 kí tự: hoặc là tự luận (không vào kênh số), hoặc gõ đủ trong số ô và chấm đúng', () => {
    let vao = 0, canHon4 = 0, tuLuan = 0
    for (const x of KHO.dai) {
      const q = cauIII(x.qid, x.maDe, x.c, x.tuLuan ? { tuLuan: true } as Partial<PrivateQuestion> : {})
      if (ngoaiKenh(q)) { tuLuan++; continue }
      vao++
      const dapSo = dapSoGoPhim(x.c)!, soO = soOCuaCau(publicQuestion(q))
      expect(dapSo, x.qid).not.toBeNull()
      expect(dapSo.length, x.qid).toBeLessThanOrEqual(soO)
      expect(soO, x.qid).toBeLessThanOrEqual(TRAN_O)
      expect(go(dapSo, soO), x.qid).toBe(dapSo)
      expect(khopPhanIII(go(dapSo, soO), x.c), x.qid).toBe(true)
      if (soO > SO_O_PHIEU) canHon4++
    }
    // Số đo 15/10: 42 câu cần hơn 4 ô (đúng danh sách bàn Trưởng phòng), 0 câu đáp số dài bị cắt.
    expect(canHon4).toBe(42)
    expect(vao + tuLuan).toBe(KHO.dai.length)
  })
  it('đáp án chữ / công thức / nhiều số ở "phần III" (tự luận gắn nhầm) không vào kênh nhập số', () => {
    for (const c of ['a) proton và neutron; b) neutron; c) proton; d) electron', 'Mg: +12; O: +8', 'AlCl₃', 'Cl mạnh hơn I', 'Sulfur (S)'])
      expect(laCauTuLuan(cauIII('X-III-1', 'X', c)), c).toBe(true)
    for (const x of KHO.dai) if (dapSoGoPhim(x.c) === null) expect(ngoaiKenh(cauIII(x.qid, x.maDe, x.c)), x.qid).toBe(true)
  })
  it('528 đáp án ≤ 4 kí tự trong kho: không câu nào bị chặn thêm, số ô = đúng số kí tự đáp số gõ (1–4) và gõ đủ, chấm đúng', () => {
    for (const c of KHO.ngan) {
      const q = cauIII('Y-III-1', 'Y', c)
      expect(ngoaiKenhSo(q), c).toBe(laCauTuLuan(q)) // không câu ngắn nào bị chốt kênh số chặn thêm
      if (laCauTuLuan(q)) continue
      const d = dapSoGoPhim(c)!, soO = soOCuaCau(publicQuestion(q))
      expect(soO, c).toBe(d.length)
      expect(soO, c).toBeLessThanOrEqual(SO_O_PHIEU)
      expect(go(d, soO), c).toBe(d)
      expect(khopPhanIII(go(d, soO), c), c).toBe(true)
    }
  })
})

describe('chốt kênh nhập số ở kho game, luật tự luận chung giữ nguyên', () => {
  it('nhập kho (normalizeBank): câu phần III cần hơn 8 ô mang cờ, không vào kênh học/game; câu 10000 và câu số thường không mang cờ', async () => {
    const goi = { ma_de: 'KHO-SO-O', cau: [
      { phan: 'III', so: 1, de: 'Tính số hạt.', dap_an: '123456789', kieu: 'bai_tap', muc_do: 'hieu' },
      { phan: 'III', so: 2, de: 'Gấp bao nhiêu lần?', dap_an: '10000', kieu: 'bai_tap', muc_do: 'hieu' },
      { phan: 'III', so: 3, de: 'Tính V (lít).', dap_an: '2,24', kieu: 'bai_tap', muc_do: 'hieu' },
    ] }
    const qs = await normalizeBank(goi as unknown as Record<string, unknown>, 'KHO-SO-O')
    expect(qs.map((q) => laCauTuLuan(q))).toEqual([true, false, false])
    expect(qs.map((q) => (q as { tuLuan?: boolean }).tuLuan === true)).toEqual([true, false, false])
    expect(publicQuestion(qs[1]!).soO).toBe(5); expect(publicQuestion(qs[2]!).soO).toBe(4)
  })
  it('luật tự luận dùng chung KHÔNG đổi: số dài như 1.237.500.000 vẫn là trả lời ngắn ở các kênh khác (luật 30/09)', () => {
    expect(laCauTuLuan(cauIII('Z-III-1', 'Z', '1.237.500.000'))).toBe(false)
    expect(ngoaiKenhSo(cauIII('Z-III-1', 'Z', '1.237.500.000'))).toBe(true) // 10 chữ số > 8 ô ⇒ chỉ chặn ở kênh bàn phím số
  })
})

describe('màn làm bài: gõ đủ 10000, gửi đúng "10000"', () => {
  const TLN5 = { maDe: 'DH-10-C1-B1', version: 'v1', group: 'g', hinhAnh: [], dang: null, tenDang: 'Cấu tạo nguyên tử', mucDo: 'hieu', sao: 0, kienThuc: [], qid: 'DH-10-C1-B1-III-18', phan: 'III' as const, text: 'Hạt nhân nhỏ hơn nguyên tử bao nhiêu lần?', choices: [], ideas: [], soO: 5 }
  const moMan = (cau: object[]) => {
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, id: 'p1', questions: cau })
    return render(<ManLamBaiTap token="tk" sbd="10000" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={{ daLam: 0, muc: 6, chang: 1, soChang: 1 }} />)
  }
  it('bàn phím số: 5 ô, phím 0 thứ năm vẫn bấm được, nộp gửi "10000"', async () => {
    moMan([TLN5])
    const phim = within(await screen.findByRole('group', { name: 'Bàn phím số' }))
    for (const p of ['1', '0', '0', '0', '0']) fireEvent.click(phim.getByRole('button', { name: p }))
    expect(document.querySelectorAll('.ht2-lam-o')).toHaveLength(5)
    expect(screen.getByRole('button', { name: /Nộp câu · 10000/ })).toBeTruthy()
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, correct: true, answer: '10000', solution: 'x' })
    fireEvent.click(screen.getByRole('button', { name: /Nộp câu · 10000/ }))
    await waitFor(() => expect(vi.mocked(goiHoa2).mock.calls.some(([lenh, , than]) => lenh === 'answer' && (than as { answer?: string }).answer === '10000')).toBe(true))
  })
  it('đủ 5 kí tự thì phím số mờ, kí tự thứ 6 không vào', async () => {
    moMan([TLN5])
    const phim = within(await screen.findByRole('group', { name: 'Bàn phím số' }))
    for (let i = 0; i < 9; i++) fireEvent.click(phim.getByRole('button', { name: '9' }))
    expect(screen.getByRole('button', { name: /Nộp câu · 99999$/ })).toBeTruthy()
    expect((phim.getByRole('button', { name: '9' }) as HTMLButtonElement).disabled).toBe(true)
  })
  it('phím máy tính: gõ 10000 ⇒ gửi "10000"', async () => {
    moMan([TLN5])
    await screen.findByRole('group', { name: 'Bàn phím số' })
    for (const k of ['1', '0', '0', '0', '0']) fireEvent.keyDown(window, { key: k })
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, correct: true, answer: '10000', solution: 'x' })
    fireEvent.click(screen.getByRole('button', { name: /Nộp câu · 10000/ }))
    await waitFor(() => expect(vi.mocked(goiHoa2).mock.calls.some(([lenh, , than]) => lenh === 'answer' && (than as { answer?: string }).answer === '10000')).toBe(true))
  })
  it('câu không có số ô: giữ 4 ô như phiếu', async () => {
    const { soO: _bo, ...TLN4 } = TLN5
    moMan([TLN4])
    const phim = within(await screen.findByRole('group', { name: 'Bàn phím số' }))
    for (const p of ['1', '2', '3', '4', '5']) fireEvent.click(phim.getByRole('button', { name: p }))
    expect(document.querySelectorAll('.ht2-lam-o')).toHaveLength(4)
    expect(screen.getByRole('button', { name: /Nộp câu · 1234/ })).toBeTruthy()
  })
})
