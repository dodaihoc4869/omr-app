// HS-1 · KẾT QUẢ NGAY SAU NỘP (bản vẽ đã chốt 21/09: docs/ban-ve-xem-diem-2109/hs-1a/1b/1c). Lib thuần + component + rào của màn thi thật:
// ba trạng thái theo luật công bố; HAI trạng thái chưa có điểm KHÔNG vẽ điểm/đáp án/lời giải; không xếp hạng, không nhãn năng lực; chỉ so với lần trước CỦA CHÍNH EM;
// đường "đang gửi" (pendingSubmit) của màn thi giữ nguyên.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import KetQuaSauNop from '../src/components/xem-diem/KetQuaSauNop'
import { chuGioNop, phanTuDiem, soSanhLanTruoc, soVn, thoiGianLam, tongDungTong } from '../src/lib/ket-qua-sau-nop'
import type { ScoreResult } from '../src/engine/score'

afterEach(cleanup)
const doc = (t: string) => fs.readFileSync(path.join(process.cwd(), t), 'utf8')

const it_ = (correct: boolean, yDung?: number) => ({ index: 0, correct, cents: 0, flag: 'OK' as const, ...(yDung === undefined ? {} : { yDung }) })
/** Ca mẫu: Phần I 18 câu (15 đúng), Phần II 4 câu (2 trọn, 2 một phần), Phần III 6 câu (4 đúng); điểm 3,75 + 2,75 + 1 = 7,5. */
const SCORE = {
  phanI: { items: [...Array(15).fill(0).map(() => it_(true)), ...Array(3).fill(0).map(() => it_(false))], cents: 375 },
  phanII: { items: [it_(true, 4), it_(false, 3), it_(true, 4), it_(false, 2)], cents: 275 },
  phanIII: { items: [...Array(4).fill(0).map(() => it_(true)), ...Array(2).fill(0).map(() => it_(false))], cents: 100 },
  totalCents: 750, total: 7.5, phanIScore: 3.75, phanIIScore: 2.75, phanIIIScore: 1, quota: { I: 450, II: 400, III: 150 }, remainingFlags: 0, crossSumOk: true,
} as unknown as ScoreResult

describe('lib · số liệu từ điểm ĐÃ chấm bằng luật chính thức', () => {
  it('ba phần: đúng/tổng, Phần II tách đúng TRỌN và đúng MỘT PHẦN, trần điểm từ quota của chính ca', () => {
    const p = phanTuDiem(SCORE)
    expect(p.map((x) => [x.ma, x.dung, x.tong, x.motPhan, x.diem, x.toiDa])).toEqual([['I', 15, 18, 0, 3.75, 4.5], ['II', 2, 4, 2, 2.75, 4], ['III', 4, 6, 0, 1, 1.5]])
    expect(tongDungTong(p)).toEqual({ dung: 21, tong: 28 })
    expect(p[1].ten).toBe('Phần II · Đúng–sai')
  })
  it('phần không có câu nào bị bỏ (ca thiếu Phần III)', () => {
    const s = { ...SCORE, phanIII: { items: [], cents: 0 } } as unknown as ScoreResult
    expect(phanTuDiem(s).map((x) => x.ma)).toEqual(['I', 'II'])
  })
  it('số kiểu Việt; thời gian làm; giờ nộp giờ VN', () => {
    expect([soVn(7.5), soVn(6.75), soVn(3), soVn(0.1 + 0.2)]).toEqual(['7,5', '6,75', '3', '0,3'])
    expect(thoiGianLam('2026-09-19T01:27:00Z', '2026-09-19T01:59:10Z')).toBe('32 phút 10 giây')
    expect(thoiGianLam(1000, 1000 + 45_000)).toBe('45 giây'); expect(thoiGianLam(0, 3_600_000)).toBe('60 phút')
    expect(thoiGianLam('x', '2026-09-19T01:59:10Z')).toBeNull(); expect(thoiGianLam('2026-09-19T02:00:00Z', '2026-09-19T01:00:00Z')).toBeNull()
    expect(chuGioNop('2026-09-19T02:12:00Z')).toBe('09:12 · Thứ Bảy 19/09/2026'); expect(chuGioNop('hỏng')).toBe('')
  })
  it('so với LẦN TRƯỚC CỦA CHÍNH EM: ca gần nhất KHÁC ca này và trước ca này; không có ⇒ null; không bao giờ so với bạn', () => {
    const ls = [{ maCa: 'A', ngay: '2026-09-05T01:00:00Z', tong: 6.25 }, { maCa: 'B', ngay: '2026-09-12T01:00:00Z', tong: 6.75 }, { maCa: 'C', ngay: '2026-09-19T01:00:00Z', tong: 7.5 }, { maCa: 'D', ngay: '2026-09-26T01:00:00Z', tong: 9 }]
    expect(soSanhLanTruoc(ls, 'C', '2026-09-19T01:00:00Z', 7.5)).toEqual({ hieu: 0.75, truoc: 6.75 })
    expect(soSanhLanTruoc(ls.filter((x) => x.maCa === 'C'), 'C', '2026-09-19T01:00:00Z', 7.5)).toBeNull()
    expect(soSanhLanTruoc(ls, 'A', '2026-09-05T01:00:00Z', 6.25)).toBeNull()
  })
})

const CHUNG = { tenCa: 'Kiểm tra 45 phút · Ester – lipid', gioNop: '09:12 · Thứ Bảy 19/09/2026' }
const DA_CONG_BO = { kieu: 'da_cong_bo' as const, ...CHUNG, diem: 7.5, phan: phanTuDiem(SCORE), dung: 21, tong: 28, lam: '32 phút 10 giây', de: '45 phút', ss: 0.75, truoc: 6.75 }

describe('KetQuaSauNop · đã công bố', () => {
  it('điểm to có nhãn, đúng x/y câu, thời gian, so với lần trước của chính em; ba phần có trần điểm; MỘT nút chính "Xem báo cáo chi tiết" + nút chữ "Về bảng nhiệm vụ"', () => {
    const onXem = vi.fn(), onVe = vi.fn()
    const { container } = render(<KetQuaSauNop {...DA_CONG_BO} onXemBaoCao={onXem} onVe={onVe} />)
    expect(screen.getByRole('img', { name: 'Điểm 7,5 trên 10' })).toBeTruthy()
    const t = container.textContent!
    for (const c of ['Em làm đúng 21/28 câu', 'Thời gian làm 32 phút 10 giây (đề cho 45 phút)', '+0,75 điểm so với lần trước của em (6,75)', 'Em đã nộp bài lúc 09:12 · Thứ Bảy 19/09/2026',
      'Phần I · Trắc nghiệm', '3,75/4,5 điểm', 'đúng 15/18 câu', 'đúng trọn 2/4 câu, 2 câu đúng một phần', 'Phần III · Trả lời ngắn', '1/1,5 điểm']) expect(t).toContain(c)
    expect(container.querySelectorAll('.xd-nut--chinh')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Xem báo cáo chi tiết' })); expect(onXem).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Về bảng nhiệm vụ' })); expect(onVe).toHaveBeenCalledTimes(1)
  })
  it('KHÔNG xếp hạng, KHÔNG nhãn năng lực, KHÔNG emoji, KHÔNG "nắm chắc"; giảm điểm nói trung tính; ca đầu tiên nói thẳng', () => {
    const { container, rerender } = render(<KetQuaSauNop {...DA_CONG_BO} ss={-0.5} truoc={8} />)
    expect(container.textContent).toContain('−0,5 điểm so với lần trước của em (8)')
    rerender(<KetQuaSauNop {...DA_CONG_BO} ss={null} truoc={undefined} />)
    expect(container.textContent).toContain('Đây là ca đầu tiên của em nên chưa có lần trước để so')
    rerender(<KetQuaSauNop {...DA_CONG_BO} ss={undefined} />)
    expect(container.textContent).not.toContain('lần trước') // chưa có dữ liệu lịch sử ⇒ ẩn chip, không đoán
    const t = container.textContent!
    expect(t).not.toMatch(/hạng|xếp loại|giỏi|khá|trung bình|yếu|nắm chắc|sĩ số/i)
    expect(t).not.toMatch(/\p{Extended_Pictographic}/u)
  })
  it('thiếu ba phần ⇒ không vẽ khối "Ba phần"; thiếu thời gian ⇒ không dòng thời gian (không bịa)', () => {
    const { container } = render(<KetQuaSauNop {...DA_CONG_BO} phan={[]} lam={null} de={null} />)
    expect(container.textContent).not.toContain('Ba phần của bài'); expect(container.textContent).not.toContain('Thời gian làm')
  })
})

describe('KetQuaSauNop · HAI trạng thái chưa có điểm KHÔNG lộ điểm, đáp án, lời giải', () => {
  it('chờ cả lớp: "Điểm hiện khi cả lớp nộp xong", thanh Đã nộp 27/32 em; kể cả khi màn cha lỡ truyền điểm/phần vẫn KHÔNG vẽ', () => {
    const { container } = render(<KetQuaSauNop {...DA_CONG_BO} kieu="ca_lop" daNop={27} daVao={32} onVe={() => {}} />)
    const t = container.textContent!
    expect(t).toContain('Điểm hiện khi cả lớp nộp xong'); expect(t).toContain('Đã nộp 27/32 em'); expect(t).toContain('Còn 5 em')
    expect(screen.getByRole('progressbar', { name: 'Số em đã nộp' }).getAttribute('aria-valuenow')).toBe('27')
    expect(t).not.toMatch(/7,5|21\/28|đúng|Phần I|báo cáo chi tiết|đáp án ·/i)
    expect(screen.queryByRole('img', { name: /Điểm/ })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Xem báo cáo chi tiết' })).toBeNull()
    expect(container.querySelectorAll('.xd-nut--chinh')).toHaveLength(1) // "Về bảng nhiệm vụ" là nút chính duy nhất
  })
  it('thầy chưa công bố: nói thật, không lộ gì', () => {
    const { container } = render(<KetQuaSauNop {...DA_CONG_BO} kieu="khong" />)
    const t = container.textContent!
    expect(t).toContain('Thầy chưa công bố điểm'); expect(t).toContain('Đáp án và lời giải cũng hiện lúc đó')
    expect(t).not.toMatch(/7,5|21\/28|Phần I ·|Xem báo cáo chi tiết/)
    expect(container.querySelectorAll('[role="progressbar"]')).toHaveLength(0)
  })
})

describe('rào của màn thi thật (ExamTakeScreen): CHỈ đổi phần nhìn khối kết quả sau nộp', () => {
  const src = doc('src/screens/ExamTakeScreen.tsx')
  it('dùng KetQuaSauNop; hết dòng cũ "Điểm của em:" + xếp loại + hai nút cũ; đường "đang gửi" (Gửi lại ngay) còn nguyên', () => {
    expect(src).toContain("from '../components/xem-diem/KetQuaSauNop'")
    expect(src).not.toContain('Điểm của em: <b')
    expect(src).not.toContain('Xem điểm (Chờ cả lớp nộp xong')
    expect(src).toContain('Gửi lại ngay'); expect(src).toContain('pendingSubmit')
    expect(src).toContain("kieu={graded ? 'da_cong_bo' : choCaLop ? 'ca_lop' : 'khong'}")
  })
  it('luật chấm/luật công bố không bị đụng: vẫn gọi gradeFromKeyBank + fetchKetQua + setCongBo; không import thêm hàm chấm', () => {
    expect(src).toContain('gradeFromKeyBank'); expect(src).toContain('fetchKetQua'); expect(src).toContain('setCongBo(')
    expect(doc('src/lib/ket-qua-sau-nop.ts')).not.toMatch(/gradeFromKeyBank|scoreExam|fetch\(|localStorage/)
  })
})
