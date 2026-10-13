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
// Game.tsx: bắt PROP `call` mà Game truyền cho ba màn con để thử đúng cổng thật (không dựng cả game).
const bat = vi.hoisted(() => ({ dao: null as null | ((a: string, d?: Record<string, unknown>) => Promise<any>), doan: null as null | ((a: string, d?: Record<string, unknown>) => Promise<any>), voDai: null as null | ((a: string, d?: Record<string, unknown>) => Promise<any>) }))
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

describe('Ôn lại — POST /hs/cau-theo-qid', () => {
  it('câu tự luận máy chủ lỡ trả về KHÔNG vào màn ôn; câu tốt giữ thứ tự', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, cau: [I_OK, SACCA, II_OK, III_OK, MA_TL], khongCo: [] }) })))
    const r = await taiCauTheoQid('t', ['a', 'b', 'c', 'd', 'e'])
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.cau.map((c) => c.qid)).toEqual([I_OK.qid, II_OK.qid, III_OK.qid])
    expect(canhBao).toHaveBeenCalled()
  })
})

// 06/10 (thầy đổi luật): tự luận CHỈ hiện ở Gọi lên bảng phần DẠY HỌC. Phần Dạy học (`DayHocLenBang`, phan-cau-len-bang) vẫn KHÔNG lọc tự luận;
// phần còn lại của màn Gọi lên bảng (chữa bài / chiến dịch / chọn kho) PHẢI bỏ tự luận bằng `boTuLuanKhoiBanDe`.
describe('Gọi lên bảng phần Dạy học KHÔNG dùng lớp lọc tự luận; phần còn lại có', () => {
  it('màn Gọi lên bảng ngoài Dạy học bỏ tự luận', () => {
    const nguon = fs.readFileSync(path.join(process.cwd(), 'src/screens/GoiLenBangScreen.tsx'), 'utf8')
    expect(nguon).toMatch(/boTuLuanKhoiBanDe/)
    expect(nguon).toMatch(/dayHoc \? b : boTuLuanKhoiBanDe\(b\)/)
  })
  it('thẻ Dạy học + phân công dạy học không import cau-tu-luan-may-hs / cau-tu-luan', () => {
    for (const t of ['src/components/day-hoc/DayHocLenBang.tsx', 'src/lib/phan-cau-len-bang.ts']) {
      const f = path.join(process.cwd(), t)
      if (!fs.existsSync(f)) continue
      const nguon = fs.readFileSync(f, 'utf8')
      expect(nguon, t).not.toMatch(/cau-tu-luan/)
      expect(nguon, t).not.toMatch(/hopLeDeRut|loc-cau-rut/)
    }
  })
})
