// HIỆU ỨNG EXP THEO TỪNG CÂU ĐÚNG (luật v4, thầy chốt 29/09/2026): chỉ câu tự làm đúng có khoản EXP câu của máy chủ mới có "+N EXP";
// câu sai / có trợ giúp / đã bấm Hỏi thầy ⇒ không hiệu ứng; máy yếu ⇒ không hạt; giảm chuyển động ⇒ đứng yên.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { cheDoHieuUng, docAnhThu, expCauGame, expTheoCau, tiLeThanh } from '../src/lib/hieu-ung-exp-cau'
import { DaiKetQua, type PhanHoi2 } from '../src/game/than-thu-v2/dao2/TrongAi'
import type { CauDao2 } from '../src/game/than-thu-v2/dao2/dao2-core'
import type { DaoProfile } from '../src/game/than-thu-v2/dao/kieu'
import DoanCau from '../src/game/than-thu-v2/DoanCau'
import { docKetQuaChang, theChangView } from '../src/lib/btvn-ca-nhan-kieu'
import { SoExpCau, ThanhExpNho } from '../src/components/exp-cau/ExpCau'

afterEach(cleanup)

describe('expTheoCau — câu nào được "+N EXP"', () => {
  const ketQua = [{ qid: 'A', dung: true }, { qid: 'B', dung: false }, { qid: 'C', dung: true }, { qid: 'D', dung: true }]
  const expNhan = [
    { loai: 'cau', qid: 'A', exp: 5, ghiChu: 'x' },
    { loai: 'cau', qid: 'B', exp: 3, ghiChu: 'x' }, // câu sai: máy chủ không bao giờ trả, nhưng nếu có cũng không hiện
    { loai: 'cau', qid: 'C', exp: 2, ghiChu: 'x' },
    { loai: 'len_bac', qid: 'D', exp: 6, ghiChu: 'x' }, // không phải EXP câu
    { loai: 'dat_ngay', exp: 80, ghiChu: 'x' },
  ]
  it('chỉ câu ĐÚNG có khoản `cau` mang đúng qid; câu đã bấm Hỏi thầy bị loại', () => {
    expect(expTheoCau(ketQua, expNhan)).toEqual({ A: 5, C: 2 })
    expect(expTheoCau(ketQua, expNhan, new Set(['C']))).toEqual({ A: 5 })
    expect(expTheoCau(undefined, expNhan)).toEqual({})
    expect(expTheoCau(ketQua, [{ loai: 'cau', exp: 4, ghiChu: 'x' }])).toEqual({}) // máy chủ cũ không gửi qid ⇒ không hiệu ứng
  })
  it('mức hiệu ứng: giảm chuyển động ⇒ tĩnh; máy yếu ⇒ gọn; còn lại đầy đủ', () => {
    expect(cheDoHieuUng({ giamChuyenDong: true, mayYeu: true })).toBe('tinh')
    expect(cheDoHieuUng({ giamChuyenDong: false, mayYeu: true })).toBe('gon')
    expect(cheDoHieuUng({ giamChuyenDong: false, mayYeu: false })).toBe('day-du')
  })
  it('docAnhThu đọc chặt; thiếu/sai ⇒ null', () => {
    expect(docAnhThu({ cap: 3, exp: 40, thanh: 510, soCapLen: 2, choMoc: 0 })).toEqual({ cap: 3, exp: 40, thanh: 510, soCapLen: 2, choMoc: 0 })
    expect(docAnhThu({ cap: 0, exp: 1, thanh: 2 })).toBeNull()
    expect(docAnhThu(null)).toBeNull()
    expect(tiLeThanh({ exp: 255, thanh: 510 })).toBe(0.5)
    expect(tiLeThanh({ exp: 0, thanh: 0 })).toBe(1)
  })
})

describe('SoExpCau / ThanhExpNho', () => {
  it('đầy đủ: số + 3 hạt; gọn (máy yếu): không hạt; tĩnh: không hạt; exp 0 ⇒ không vẽ', () => {
    const a = render(<SoExpCau exp={5} cheDo="day-du" />)
    expect(a.container.textContent).toBe('+5 EXP')
    expect(a.container.querySelectorAll('.exp-cau-hat')).toHaveLength(3)
    cleanup()
    expect(render(<SoExpCau exp={5} cheDo="gon" />).container.querySelectorAll('.exp-cau-hat')).toHaveLength(0)
    cleanup()
    expect(render(<SoExpCau exp={5} cheDo="tinh" />).container.querySelector('[data-che-do="tinh"]')).not.toBeNull()
    cleanup()
    expect(render(<SoExpCau exp={0} cheDo="day-du" />).container.textContent).toBe('')
  })
  it('thanh có nhãn + số; lên cấp ⇒ "Lên cấp N!"; đang chờ mốc ⇒ nói EXP được giữ', () => {
    const r = render(<ThanhExpNho thu={{ cap: 10, exp: 100, thanh: 2990, soCapLen: 1, choMoc: 0 }} cheDo="tinh" />)
    expect(r.container.textContent).toContain('Thần thú cấp 10 · 100 / 2.990 EXP')
    expect(r.container.textContent).toContain('Lên cấp 10!')
    expect(r.container.querySelector('[role="progressbar"]')!.getAttribute('aria-valuenow')).toBe('100')
    cleanup()
    const cho = render(<ThanhExpNho thu={{ cap: 9, exp: 2929, thanh: 2930, soCapLen: 0, choMoc: 500 }} cheDo="gon" />)
    expect(cho.container.textContent).toContain('500 EXP đang được giữ, vào thần thú khi em đạt nhiệm vụ ngày đủ 21 ngày.')
  })
  it('CSS: tôn trọng giảm chuyển động và máy yếu; không mã màu thô', () => {
    const css = readFileSync('src/components/exp-cau/exp-cau.css', 'utf8')
    expect(css).toMatch(/prefers-reduced-motion: reduce/)
    expect(css).toMatch(/\.may-yeu \.exp-cau-hat \{ display: none; \}/)
    expect(css.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })
})

// ── GAME + BTVN lô (Boss soát PR #74): CÙNG một thành phần `SoExpCau`, số lấy từ phản hồi máy chủ ─────────────────────────
describe('expCauGame — game chỉ hiệu ứng câu TỰ LÀM ĐÚNG', () => {
  it('đúng ⇒ reward + expThuThach của máy chủ; sai / assisted / trợ giúp / Bùa / Hỏi thầy ⇒ 0', () => {
    expect(expCauGame({ correct: true, reward: 10, expThuThach: 3 })).toBe(13)
    expect(expCauGame({ correct: false, reward: 10 })).toBe(0)
    expect(expCauGame({ correct: true, assisted: true, reward: 10 })).toBe(0)
    expect(expCauGame({ correct: true, coTroGiup: true, reward: 10 })).toBe(0)
    expect(expCauGame({ correct: true, daHoi: true, reward: 10 })).toBe(0)
    expect(expCauGame({ correct: true, reward: 0 })).toBe(0)
    expect(expCauGame(null)).toBe(0)
    // luật 29/09: máy chủ trả `expCau` (EXP thật của câu) ⇒ dùng NGUYÊN số đó, không cộng lại reward/expThuThach
    expect(expCauGame({ correct: true, reward: 10, expThuThach: 3, expCau: 16 })).toBe(16)
    expect(expCauGame({ correct: true, reward: 0, expCau: 3 })).toBe(3)
    expect(expCauGame({ correct: true, reward: 10, expCau: 0 })).toBe(0)
    expect(expCauGame({ correct: true, assisted: true, expCau: 3 })).toBe(0)
    expect(expCauGame({ correct: false, expCau: 3 })).toBe(0)
  })
})

const hoSo: DaoProfile = { nickname: 'Lửa Nhỏ', pet: 'lua_phuong', choice: false, cap: 7, exp: 0, wallet: 0, mastery: [] }
const cauI = { qid: 'q1', maDe: 'DE', version: '1', group: 'g1', phan: 'I', text: 'Câu', choices: ['A1', 'B1', 'C1', 'D1'], ideas: [], hinhAnh: [], dang: 'd', mucDo: 'biet' } as unknown as CauDao2
const ph = (o: Partial<PhanHoi2>): PhanHoi2 => ({ correct: true, answer: 'A', traLoi: 'A', solution: null, solutionImages: [], reward: 10, lyDo: { moc: 1, exp: 10, chu: '+10 · Sao thứ nhất' }, ...o })

describe('Đảo 2.0 · Đoàn · BTVN lô dùng chung SoExpCau', () => {
  it('Đảo 2.0 (DaiKetQua): đúng ⇒ "+N EXP" bay sang ảnh thú (reward + thử thách); có trợ giúp ⇒ không hiệu ứng', () => {
    const r = render(<DaiKetQua profile={hoSo} cau={cauI} phanHoi={ph({ expThuThach: 3 })} ketQua={[{ qid: 'q1', correct: true }]} tong={6} />)
    const so = r.container.querySelector('[data-vung="exp-cau"]')!
    expect(so.textContent).toContain('+13 EXP'); expect(so.getAttribute('data-vao-thu')).toBe('dong')
    cleanup()
    const t = render(<DaiKetQua profile={hoSo} cau={cauI} phanHoi={ph({ coTroGiup: true })} ketQua={[{ qid: 'q1', correct: true }]} tong={6} />)
    expect(t.container.querySelector('[data-vung="exp-cau"]')).toBeNull()
  })
  it('Đoàn (DoanCau): đúng + reward ⇒ hiệu ứng; assisted / Bùa (gạch) / sai ⇒ không', () => {
    const q = { ...cauI, correct: 'A' } as never
    const ve = (ketQua: object, gach?: string[]) => render(<DoanCau q={q} chon="A" onChon={() => {}} khoa ketQua={ketQua as never} onZoom={() => {}} dau={<b>CÂU</b>} gach={gach} />)
    expect(ve({ correct: true, answer: 'A', solution: null, reward: 10 }).container.querySelector('[data-vung="exp-cau"]')?.textContent).toContain('+10 EXP'); cleanup()
    expect(ve({ correct: true, answer: 'A', solution: null, reward: 10, assisted: true }).container.querySelector('[data-vung="exp-cau"]')).toBeNull(); cleanup()
    expect(ve({ correct: true, answer: 'A', solution: null, reward: 10 }, ['B']).container.querySelector('[data-vung="exp-cau"]')).toBeNull(); cleanup()
    expect(ve({ correct: false, answer: 'B', solution: null, reward: 10 }).container.querySelector('[data-vung="exp-cau"]')).toBeNull()
  })
  it('BTVN lô: theChangView đưa "+N EXP" theo từng câu đúng (khoản `cau` của máy chủ) + thần thú sau lượt; máy chủ cũ ⇒ không thêm trường', () => {
    const tho = { ok: true, chang: { chiSo: 0, soCau: 3, soDung: 2, xong: true }, ketQua: [{ qid: 'a', dung: true }, { qid: 'b', dung: false }, { qid: 'c', dung: true }], chuaLam: [],
      expNhan: [{ loai: 'cau', qid: 'a', exp: 5, ghiChu: 'x' }, { loai: 'cau', qid: 'c', exp: 2, ghiChu: 'y' }, { loai: 'lo', exp: 20, ghiChu: 'z' }], thanThu: { cap: 3, exp: 40, thanh: 510, soCapLen: 1, choMoc: 0 } }
    const v = theChangView(docKetQuaChang(tho)!, 3)!
    expect(v.expCau).toEqual([{ stt: 1, exp: 5 }, { stt: 3, exp: 2 }])
    expect(v.thu).toEqual({ cap: 3, exp: 40, thanh: 510, soCapLen: 1, choMoc: 0 })
    const cu = theChangView(docKetQuaChang({ ...tho, expNhan: undefined, thanThu: undefined })!, 3)!
    expect(cu).not.toHaveProperty('expCau'); expect(cu).not.toHaveProperty('thu')
  })
  it('mọi nơi gắn hiệu ứng dùng CHUNG SoExpCau (không tự viết hiệu ứng riêng)', () => {
    for (const f of ['src/game/than-thu-v2/dao/ThamHiem.tsx', 'src/game/than-thu-v2/dao2/TrongAi.tsx', 'src/game/than-thu-v2/DoanCau.tsx', 'src/game/bi-a/TamCauBia.tsx', 'src/components/bang-nhiem-vu/TheCuoiChang.tsx', 'src/components/bang-nhiem-vu/LamCauOn.tsx']) {
      expect(readFileSync(f, 'utf8'), f).toMatch(/<SoExpCau\b/)
    }
  })
})
