// CẤM RÚT CÂU TỰ LUẬN · LỚP PHÒNG THỦ CUỐI Ở MÁY HỌC SINH / PHỤ HUYNH (thầy lệnh 21/09; đề bài prompt-cam-rut-tu-luan.md, phần Code 2).
// Định nghĩa "tự luận" nằm ở src/lib/cau-tu-luan.ts (Code 1). Ở đây khoá: nhận phải câu tự luận thì BỎ QUA (không dựng ô nhập), ghi console.warn,
// ở MỌI kênh máy em: game Đảo thần thú / Võ đài (cùng cổng `request` của Game.tsx), Đoàn Hộ Tống, ôn lại (/hs/cau-theo-qid), bộ lọc rút của phiếu (`hopLeDeRut`).
// Gọi lên bảng của thầy KHÔNG nằm trong src của em và không dùng lớp này (khoá bằng test nguồn cuối tệp).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, configure, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/components/KhoiCauSai', () => ({ LoiGiaiCauSai: () => <p>Lời giải từ kho</p> }))
vi.mock('../src/game/than-thu-v2/battle-audio', () => ({ unlockBattleAudio: vi.fn(), playBattleSound: vi.fn() }))
// Game.tsx: bắt PROP `call` mà Game truyền cho ba màn con để thử đúng cổng thật (không dựng cả game).
const bat = vi.hoisted(() => ({ dao: null as null | ((a: string, d?: Record<string, unknown>) => Promise<any>), doan: null as null | ((a: string, d?: Record<string, unknown>) => Promise<any>), voDai: null as null | ((a: string, d?: Record<string, unknown>) => Promise<any>) }))
vi.mock('../src/game/than-thu-v2/dao/DaoThanThu', () => ({ default: (p: any) => { bat.dao = p.call; return <div data-testid="vo-dao" /> } }))
vi.mock('../src/game/than-thu-v2/DoanHoTong', () => ({ default: (p: any) => { bat.doan = p.call; return <div data-testid="doan-that" /> } }))
vi.mock('../src/game/than-thu-v2/EscortRoom', () => ({ default: (p: any) => { bat.voDai = p.call; return <div data-testid="vo-dai" /> } }))
vi.mock('../src/game/than-thu-v2/ProgressChart', () => ({ default: () => null }))
vi.mock('../src/game/than-thu-v2/LearningBattle', () => ({ default: () => null, SpellPreview: () => null }))
vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: () => null }))
vi.mock('../src/game/than-thu-v2/SpiritArt', () => ({ default: () => null }))
vi.mock('../src/game/than-thu-v2/ImmortalShield', () => ({ default: () => null }))
import Game from '../src/game/than-thu-v2/Game'
import { chanCauTuLuan, chanPhanHoiCau, choPhepCauChoEm, quenDaBao } from '../src/lib/cau-tu-luan-may-hs'
import { taiCauTheoQid } from '../src/components/bang-nhiem-vu/cau-on-api'
import { hopLeDeRut } from '../src/lib/loc-cau-rut'

configure({ asyncUtilTimeout: 8000 })

// ---- câu mẫu (khuôn CÔNG KHAI của game: không có đáp án) ----
const goc = { maDe: 'DH-12-C2-B6-TN', version: '1', group: 'g', ideas: [] as string[], hinhAnh: [], dang: null, tenDang: 'Ester', mucDo: null, sao: null, kienThuc: [] as string[] }
const I_OK = { ...goc, qid: 'DH-12-C2-B6-TN-I-1', phan: 'I' as const, text: 'Este X có tên gọi là gì?', choices: ['etyl axetat', 'metyl propionat', 'propyl fomat', 'isopropyl fomat'] }
const II_OK = { ...goc, qid: 'DH-12-C2-B6-TN-II-2', phan: 'II' as const, text: 'Xét đúng sai từng ý:', choices: [] as string[], ideas: ['ý một', 'ý hai', 'ý ba', 'ý bốn'] }
const III_OK = { ...goc, qid: 'DH-12-C2-B6-TN-III-3', phan: 'III' as const, text: 'Tính khối lượng glucozơ (gam) thu được.', choices: [] as string[] }
/** ĐÚNG câu trong ảnh thầy: game Đảo, ải "Sửa lỗi", hiện ô nhập đáp án ngắn cho một câu tự luận. */
const SACCA = { ...goc, qid: 'DH-12-C2-B7-TN-III-9', phan: 'III' as const, text: 'Theo em, có thể dùng phương pháp nào để tách saccharose ra khỏi hỗn hợp với tinh bột?', choices: [] as string[] }
const NHAN_TL = { ...III_OK, qid: 'DH-12-C2-B6-TN-III-4', kieu: 'tu_luan' }
const MA_TL = { ...I_OK, qid: 'DH-12-C2-B6-TL-I-5', maDe: 'DH-12-C2-B6-TL' }
const I_THIEU = { ...I_OK, qid: 'DH-12-C2-B6-TN-I-6', choices: ['chỉ một', 'chỉ hai'] }
const TU_LUAN = [SACCA, NHAN_TL, MA_TL, I_THIEU]

let canhBao: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  quenDaBao()
  canhBao = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('chanCauTuLuan — bộ lọc cuối', () => {
  it('câu saccharose trong ảnh thầy (phần III hỏi mở) bị bỏ; câu trắc nghiệm / đúng-sai / trả lời ngắn được giữ nguyên thứ tự, cùng đối tượng', () => {
    const vao = [I_OK, SACCA, II_OK, III_OK]
    const ra = chanCauTuLuan(vao, 'thu')
    expect(ra.map((c) => c.qid)).toEqual([I_OK.qid, II_OK.qid, III_OK.qid])
    expect(ra[0]).toBe(I_OK) // không sao chép, không sửa
    expect(vao).toHaveLength(4) // không đụng danh sách gốc
  })
  it('mọi kiểu tự luận đều bị bỏ: nhãn tự luận, mã -TL, phần I thiếu phương án', () => {
    expect(chanCauTuLuan(TU_LUAN, 'thu')).toEqual([])
    expect(chanCauTuLuan([SACCA, I_OK, NHAN_TL, MA_TL, I_THIEU], 'thu').map((c) => c.qid)).toEqual([I_OK.qid])
  })
  it('không phải mảng / rỗng ⇒ mảng rỗng, không ném', () => {
    for (const x of [undefined, null, 5, 'x', {}]) expect(chanCauTuLuan(x as never, 'thu')).toEqual([])
    expect(chanCauTuLuan([], 'thu')).toEqual([])
  })
  it('ghi console.warn: MỘT dòng cho mỗi câu bị bỏ, có tên nguồn + mã câu + lý do; lần sau cùng câu cùng nguồn không lặp', () => {
    chanCauTuLuan([I_OK, SACCA], 'game-v2/start')
    expect(canhBao).toHaveBeenCalledTimes(1)
    const dong = String(canhBao.mock.calls[0]![0])
    expect(dong).toContain('game-v2/start')
    expect(dong).toContain(SACCA.qid)
    expect(dong).toMatch(/hỏi mở/)
    chanCauTuLuan([SACCA], 'game-v2/start')
    expect(canhBao).toHaveBeenCalledTimes(1) // đã báo rồi
    chanCauTuLuan([SACCA], 'on-lai/cau-theo-qid')
    expect(canhBao).toHaveBeenCalledTimes(2) // nguồn khác ⇒ báo lại
  })
  it('câu rút được KHÔNG gây cảnh báo', () => {
    chanCauTuLuan([I_OK, II_OK, III_OK], 'thu')
    expect(canhBao).not.toHaveBeenCalled()
  })
  it('choPhepCauChoEm: từng câu một', () => {
    expect(choPhepCauChoEm(I_OK, 'thu')).toBe(true)
    expect(choPhepCauChoEm(SACCA, 'thu')).toBe(false)
    expect(choPhepCauChoEm(undefined, 'thu')).toBe(false)
  })
  it('chanPhanHoiCau: chỉ lọc `questions`; trường khác + `answered` giữ nguyên; không có `questions` ⇒ trả đúng đối tượng cũ', () => {
    const r = { ok: true, id: 's1', questions: [I_OK, SACCA], answered: [{ attempt: { qid: SACCA.qid } }], message: 'm' }
    const ra = chanPhanHoiCau(r, 'thu')
    expect(ra.questions.map((c) => c.qid)).toEqual([I_OK.qid])
    expect(ra.answered).toBe(r.answered)
    expect(ra).toMatchObject({ ok: true, id: 's1', message: 'm' })
    expect(r.questions).toHaveLength(2) // bản gốc còn nguyên
    const khong = { ok: true, profile: { cap: 1 } }
    expect(chanPhanHoiCau(khong, 'thu')).toBe(khong)
    expect(chanPhanHoiCau(null as never, 'thu')).toBeNull()
  })
})

describe('Game.tsx — cổng `request` chung cho Đảo thần thú, Đoàn Hộ Tống, Võ đài', () => {
  const THU_BAY = Date.parse('2026-09-26T09:00:00+07:00') // Võ đài mở thứ Bảy
  function mayChu(doanMo: boolean) {
    const hoSo = { pet: 'lua_phuong', choice: false, cap: 5, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null }
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const lenh = String(url).split('/game-v2/')[1]
      const them = lenh === 'start' ? { id: 's1', questions: [I_OK, SACCA, II_OK, NHAN_TL, III_OK] } : lenh === 'resume' ? { id: 's0', mode: 'adventure', questions: [MA_TL, I_THIEU], answered: [] } : {}
      return { json: async () => ({ ok: true, profile: hoSo, revision: 1, tasks: [], suggestions: [], doanMo, ...them }) }
    }))
  }
  beforeEach(() => { sessionStorage.clear(); localStorage.clear(); bat.dao = bat.doan = bat.voDai = null })

  it('ĐẢO: `start` chỉ còn câu rút được, câu saccharose không tới màn; `resume` toàn câu tự luận ⇒ không còn câu nào', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(THU_BAY); mayChu(false)
    render(<Game sbd="S1" token="t" onDong={() => {}} />)
    await screen.findByTestId('vo-dao')
    const s = await act(async () => bat.dao!('start', { mode: 'adventure' }))
    expect(s.questions.map((c: { qid: string }) => c.qid)).toEqual([I_OK.qid, II_OK.qid, III_OK.qid])
    expect(s.id).toBe('s1')
    const cu = await act(async () => bat.dao!('resume'))
    expect(cu.questions).toEqual([])
  })
  it('VÕ ĐÀI: cùng cổng, `start` mode arena cũng được lọc', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(THU_BAY); mayChu(false)
    render(<Game sbd="S1" token="t" onDong={() => {}} />)
    await waitFor(() => expect(bat.voDai).not.toBeNull())
    const s = await act(async () => bat.voDai!('start', { mode: 'arena' }))
    expect(s.questions.map((c: { qid: string }) => c.qid)).toEqual([I_OK.qid, II_OK.qid, III_OK.qid])
  })
  it('ĐOÀN: lệnh của Đoàn đi cùng cổng; phản hồi không có `questions` (gói doan) đi qua nguyên vẹn', async () => {
    mayChu(true)
    render(<Game sbd="S1" token="t" manDau="doan" onDong={() => {}} />)
    await screen.findByTestId('doan-that')
    const s = await act(async () => bat.doan!('start', { mode: 'adventure' }))
    expect(s.questions.map((c: { qid: string }) => c.qid)).toEqual([I_OK.qid, II_OK.qid, III_OK.qid])
    const khac = await act(async () => bat.doan!('doan-xem'))
    expect(khac.questions).toBeUndefined()
    expect(khac.doanMo).toBe(true)
  })
})

describe('Ôn lại — POST /hs/cau-theo-qid', () => {
  it('câu tự luận máy chủ lỡ trả về KHÔNG vào màn ôn; câu tốt giữ thứ tự', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, cau: [I_OK, SACCA, II_OK, III_OK, MA_TL], khongCo: [] }) })))
    const r = await taiCauTheoQid('t', ['a', 'b', 'c', 'd', 'e'])
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.cau.map((c) => c.qid)).toEqual([I_OK.qid, II_OK.qid, III_OK.qid])
    expect(canhBao).toHaveBeenCalled()
  })
})

describe('Phiếu / rút đề — hopLeDeRut cùng dùng định nghĩa chung', () => {
  it('câu gắn nhãn tự luận, mã -TL, phần I thiếu phương án: KHÔNG hợp lệ để rút (dù bộ lọc cũ cho qua)', () => {
    const kho = (q: Record<string, unknown>) => ({ phan: String(q.phan), maDe: String(q.maDe), q })
    expect(hopLeDeRut(kho({ phan: 'I', maDe: 'DH-12-C2-B6-TN', text: 'Este nào?', pa: ['a', 'b', 'c', 'd'], dap_an: 'A' }))).toBe(true)
    expect(hopLeDeRut(kho({ phan: 'I', maDe: 'DH-12-C2-B6-TN', text: 'Este nào?', pa: ['a', 'b'], dap_an: 'A' }))).toBe(false) // thiếu phương án
    expect(hopLeDeRut(kho({ phan: 'III', maDe: 'DH-12-C2-B6-TN', text: 'Tính m (gam).', dap_an: '12,5', kieu: 'tu_luan' }))).toBe(false) // nhãn
    expect(hopLeDeRut({ phan: 'I', maDe: 'DH-12-C2-B6-TL', dapAn: 'A', text: 'Este nào?', choices: ['a', 'b', 'c', 'd'] })).toBe(false) // mã -TL
  })
  it('phần III hỏi mở ("Theo em… phương pháp nào") chưa có đáp án ⇒ bị loại; câu tính toán bình thường vẫn rút được', () => {
    expect(hopLeDeRut({ phan: 'III', maDe: 'DH-12-C2-B6-TN', text: 'Theo em, có thể dùng phương pháp nào để tách saccharose?', q: { correct: 'kết tinh lại' } })).toBe(false)
    expect(hopLeDeRut({ phan: 'III', maDe: 'DH-12-C2-B6-TN', dapAn: '2', text: 'Tính khối lượng saccharose (gam).' })).toBe(true)
  })
  it('các trường đứng NGOÀI `q` (phan, maDe, đáp án) cũng được tính khi `q` không mang chúng', () => {
    const q4 = { pa: ['a', 'b', 'c', 'd'] }
    expect(hopLeDeRut({ phan: 'I', maDe: 'DH-12-C2-B6-TN', q: { pa: ['a', 'b'], text: 'Este nào?' } })).toBe(false) // phan ở ngoài ⇒ luật phần I thiếu phương án áp được
    expect(hopLeDeRut({ phan: 'I', maDe: 'DH-12-C2-B6-TL', q: { ...q4, text: 'Este nào?' } })).toBe(false) // maDe ở ngoài mang -TL
    expect(hopLeDeRut({ phan: 'II', maDe: 'DH-12-C2-B6-TN', dapAn: 'DS', q: { ideas: ['một', 'hai', 'ba', 'bốn'], text: 'Xét đúng sai:' } })).toBe(false) // đáp án ở ngoài không đủ 4 ý Đ/S
    expect(hopLeDeRut({ phan: 'II', maDe: 'DH-12-C2-B6-TN', dapAn: 'DSDS', q: { ideas: ['một', 'hai', 'ba', 'bốn'], text: 'Xét đúng sai:' } })).toBe(true)
  })
  it('đáp án RỖNG đứng ngoài `q` là "chưa biết", không phải "không có đáp án" ⇒ không kết tội', () => {
    expect(hopLeDeRut({ phan: 'I', maDe: 'DH-12-C2-B6-TN', dapAn: '', text: 'Este nào?', q: { pa: ['a', 'b', 'c', 'd'] } })).toBe(true)
  })
  it('khuôn thiếu trường đáp án (bảng câu sai của em) KHÔNG bị kết tội vì thiếu đáp án', () => {
    expect(hopLeDeRut({ phan: 'I', maDe: 'DH-12-C2-B6-TN', text: 'Este nào?', choices: ['a', 'b', 'c', 'd'] })).toBe(true)
  })
})

describe('Gọi lên bảng của thầy KHÔNG dùng lớp này', () => {
  it('màn Gọi lên bảng + tờ chiếu không import cau-tu-luan-may-hs / cau-tu-luan', () => {
    for (const t of ['src/screens/GoiLenBangScreen.tsx', 'src/lib/phan-cau-len-bang.ts']) {
      const f = path.join(process.cwd(), t)
      if (!fs.existsSync(f)) continue
      const nguon = fs.readFileSync(f, 'utf8')
      expect(nguon, t).not.toMatch(/cau-tu-luan/)
      expect(nguon, t).not.toMatch(/hopLeDeRut|loc-cau-rut/)
    }
  })
})
