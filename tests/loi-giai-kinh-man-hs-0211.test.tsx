// Thầy 02/11: «Thay thế toàn bộ 100% lời giải trong app học sinh bằng lời giải kiểu Kính».
// (1) Phép đổi thứ tự GỐC của TheCau ⇒ thứ tự HIỆN cho Kính (phương án / ý bị xáo).
// (2) `banKinhCua` tự tải theo lô khi màn không tải sẵn; nhớ câu không có bản; ca kiểm tra đóng ⇒ không nhớ.
// (3) Màn học sinh gắn Kính; TheCau không nhập thêm gì (luật tốc độ); app thầy / phụ huynh không gắn.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import { kinhTheoHien } from '../src/lib/loi-giai-kinh/the-cau-hien'
import TheCau from '../src/components/TheCau'

const doc = (p: string) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8')

describe('kinhTheoHien — đổi thứ tự gốc ⇒ thứ tự hiện', () => {
  it('Phần I: choicePerm không đồng nhất ⇒ chữ phương án, đáp án, câu em chọn theo thứ tự HIỆN', () => {
    // hiện: A=gốc C, B=gốc A, C=gốc D, D=gốc B
    const r = kinhTheoHien({ phan: 'I', choices: ['a0', 'b1', 'c2', 'd3'], choicePerm: [2, 0, 3, 1], correct: 'A', selected: 'D' })
    expect(r).toEqual({ choices: ['c2', 'a0', 'd3', 'b1'], dapAn: 'B', em: 'C' })
  })
  it('Phần I: hoán vị hỏng ⇒ coi như giữ nguyên; thiếu đáp án ⇒ null (giữ lời giải cũ)', () => {
    expect(kinhTheoHien({ phan: 'I', choices: ['a', 'b', 'c', 'd'], choicePerm: [0, 0, 1, 2], correct: 'C', selected: null })).toEqual({ choices: ['a', 'b', 'c', 'd'], dapAn: 'C', em: undefined })
    expect(kinhTheoHien({ phan: 'I', choices: ['a', 'b', 'c', 'd'], choicePerm: [0, 1, 2, 3], correct: undefined, selected: 'A' })).toBeNull()
  })
  it('Phần II: yPerm không đồng nhất ⇒ ý, đáp án, lựa chọn theo thứ tự HIỆN', () => {
    const r = kinhTheoHien({ phan: 'II', ideas: ['y0', 'y1', 'y2', 'y3'], yPerm: [3, 1, 0, 2], correct: ['D', 'S', 'S', 'D'], selected: ['D', null, 'D', 'S'] })
    expect(r).toEqual({ ideas: ['y3', 'y1', 'y0', 'y2'], dapAn: 'DSDS', em: ['S', null, 'D', 'D'] })
  })
  it('Phần II thiếu đáp án một ý ⇒ null; Phần III đáp số rỗng ⇒ null', () => {
    expect(kinhTheoHien({ phan: 'II', ideas: ['a', 'b', 'c', 'd'], correct: ['D', 'S', null, 'D'], selected: [] })).toBeNull()
    expect(kinhTheoHien({ phan: 'III', correct: '  ', selected: '1' })).toBeNull()
    expect(kinhTheoHien({ phan: 'III', correct: '13,2', selected: ' 13,2 ' })).toEqual({ dapAn: '13,2', em: '13,2' })
  })
})

describe('banKinhCua — tự tải khi chưa có gói', () => {
  beforeEach(() => { vi.resetModules(); localStorage.clear(); localStorage.setItem('omr_student_portal_auth', JSON.stringify({ token: 'tk' })) })
  afterEach(() => { vi.doUnmock('../src/lib/loi-giai-api'); vi.useRealTimers() })

  it('gom các câu cùng lượt vẽ thành MỘT lệnh; câu máy chủ báo không có bản ⇒ không hỏi lại', async () => {
    const goi = vi.fn(async () => ({ ok: true, ban: {} }))
    vi.doMock('../src/lib/loi-giai-api', () => ({ goiHs: goi, docTokenHs: () => 'tk' }))
    const { banKinhCua } = await import('../src/lib/loi-giai-kinh/tai-san')
    expect(await Promise.all([banKinhCua('q1'), banKinhCua('q2')])).toEqual([null, null])
    expect(goi).toHaveBeenCalledTimes(1)
    expect(goi.mock.calls[0]).toEqual(['/hs/loi-giai-kinh', { token: 'tk', qids: ['q1', 'q2'] }])
    expect(await banKinhCua('q1')).toBeNull()
    expect(goi).toHaveBeenCalledTimes(1)
  })

  it('máy chủ đóng (đang kiểm tra cá nhân) ⇒ KHÔNG nhớ «không có», lần sau hỏi lại', async () => {
    const goi = vi.fn(async () => ({ ok: true, ban: {}, dong: true }))
    vi.doMock('../src/lib/loi-giai-api', () => ({ goiHs: goi, docTokenHs: () => 'tk' }))
    const { banKinhCua } = await import('../src/lib/loi-giai-kinh/tai-san')
    expect(await banKinhCua('q9')).toBeNull()
    expect(await banKinhCua('q9')).toBeNull()
    expect(goi).toHaveBeenCalledTimes(2)
  })

  it('mạng treo ⇒ sau 3 giây trả null (về lời giải cũ), không chờ mãi', async () => {
    vi.useFakeTimers()
    vi.doMock('../src/lib/loi-giai-api', () => ({ goiHs: () => new Promise(() => {}), docTokenHs: () => 'tk' }))
    const { banKinhCua } = await import('../src/lib/loi-giai-kinh/tai-san')
    const p = banKinhCua('q7')
    await vi.advanceTimersByTimeAsync(3100)
    expect(await p).toBeNull()
  })
})

describe('gắn Kính ở màn học sinh', () => {
  afterEach(cleanup)
  it('TheCau không nhập mảnh Kính (lượt mở app) — chỉ nhận hàm bọc `bocLoiGiai`', () => {
    const s = doc('src/components/TheCau.tsx')
    expect(s).not.toMatch(/(import|lazy)[^\n]*loi-giai-kinh/)
    expect(s).toMatch(/bocLoiGiai\?: \(loiGiai: React\.ReactNode, the: TheCauProps\) => React\.ReactNode/)
  })
  it('TheCau xem lại gọi hàm bọc với khối lời giải cũ; không truyền ⇒ y như cũ', () => {
    const boc = vi.fn((cu: React.ReactNode) => <div data-boc="kinh">{cu}</div>)
    const p = { cheDo: 'xem_lai' as const, stt: 1, text: 'Đề', phan: 'III' as const, selected: '1', correct: '1', explanation: 'Giải' }
    const { container, rerender } = render(<TheCau {...p} bocLoiGiai={boc} />)
    expect(boc).toHaveBeenCalledTimes(1)
    expect(container.querySelector('[data-boc="kinh"]')).not.toBeNull()
    rerender(<TheCau {...p} />)
    expect(container.querySelector('[data-boc="kinh"]')).toBeNull()
    rerender(<TheCau {...p} cheDo="thi" bocLoiGiai={boc} />)
    expect(boc).toHaveBeenCalledTimes(1)
  })
  it.each([
    ['src/components/hoa2/CauDaLam.tsx', 'bocKinh(c.qid)'],
    ['src/components/chua-cau-sai/ChuaGon.tsx', 'bocKinh(qid)'],
    ['src/components/chua-cau-sai/ChuaTrucTiep.tsx', 'bocKinh(qid)'],
    ['src/components/ca-thi/CauCanChua.tsx', 'bocKinh(c.qid)'],
    ['src/components/tu-luyen/ManTuLuyen.tsx', 'bocKinh(c.qid)'],
    ['src/components/tu-luyen/LuyenDeCauTruc.tsx', 'bocKinh(q.id)'],
    ['src/components/KhoiKhacPhuc3CheDo.tsx', 'daNop ? bocKinh(q.id) : undefined'],
    ['src/components/LuyenDeChuan.tsx', 'done ? bocKinh(q.id) : undefined'],
    ['src/components/bang-nhiem-vu/LamCauOn.tsx', '<LoiGiaiKinhHs qid={c.qid}'],
    ['src/components/chua-cau-sai/ChuaGonDuo.tsx', '<LoiGiaiKinhHs qid={qid}'],
  ])('%s gắn Kính', (tep, mau) => { expect(doc(tep)).toContain(mau) })
  it('ManLamBaiTap: cả hai chỗ hiện lời giải (kiểu Duolingo + kiểu cũ) đều bọc Kính', () => {
    expect(doc('src/components/hoc-tap/ManLamBaiTap.tsx').match(/<LoiGiaiKinhHs /g)?.length).toBe(2)
  })
  it.each(['src/components/chien-dich/BangGoi7.tsx', 'src/components/BaiNopBtvn.tsx', 'src/components/day-hoc/TheCauHienThi.tsx', 'src/screens/GoiLenBangScreen.tsx', 'src/screens/NganHangDeScreen.tsx', 'src/components/ph-v3/ManChiTietCa.tsx', 'src/components/loi-giai/KhoiLoiGiaiChuan.tsx', 'src/components/hoc-tap/ManKiemTraCaNhan.tsx'])(
    '%s (thầy / phụ huynh / dùng chung / làn Codex) KHÔNG gắn Kính', (tep) => { expect(doc(tep)).not.toMatch(/bocKinh|LoiGiaiKinhHs/) })
})
