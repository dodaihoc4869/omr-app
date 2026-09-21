// XEM ĐIỂM BẢN 2 · GV-1 nối MÁY CHỦ: bộ đọc `/gv/bao-cao-ca` (src/lib/bao-cao-may-chu.ts) + khối vẽ khi có `layMayChu` (lấy từ máy chủ, rơi về số tính ở máy).
// Hợp đồng: docs/hop-dong-xem-diem-v2-2109.md mục 4 (Code 3). Thân thật của máy chủ đi qua bộ đọc ở tests/bao-cao-may-chu-hai-phia-2109.test.ts.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import BaoCaoCaLopKhoi from '../src/components/xem-diem-gv/BaoCaoCaLop'
import { KHOANG_DIEM, type BaoCaoCaLop } from '../src/lib/bao-cao-ca-lop'
import { docBaoCaoCaLopMayChu, docBaoCaoEmMayChu, GIAM_DIEM_NEU, layBaoCaoCaLopMayChu, layBaoCaoEmMayChu, type EmRoiMan } from '../src/lib/bao-cao-may-chu'
import { readFileSync } from 'node:fs'

vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }) }))
vi.mock('../src/lib/exam-db', () => ({ loadTeacherSecret: async () => 'mat-thu' }))
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const THAN = (): Record<string, unknown> => ({
  ok: true,
  ca: { maCa: 'C1', tenCa: 'Ca thử', loai: 'thi', trangThai: 'dong', lop: '12' },
  congBo: { congBo: 'ngay', daCongBo: true, soEmDaNop: 5, soEmDaVao: 6 },
  tongQuan: {
    soEm: 5, tb: 6.9, cao: 9.5, thap: 2.5,
    phoDiem: Array.from({ length: 10 }, (_, i) => ({ tu: i, den: i + 1, so: [0, 0, 1, 0, 0, 1, 1, 0, 1, 1][i] })),
    phanTb: [{ ma: 'I', diemTb: 2.6, dungTb: 8.4, tong: 12, toiDa: 3 }, { ma: 'II', diemTb: 1.9, dungTb: 2.1, tong: 4, toiDa: 4 }],
  },
  dangCaLopVap: [
    { ma: 'D.B', ten: 'Tính chất amin', tiLeDung: 0.62, soEmSai: 3, soEm: 5 },
    { ma: 'D.A', ten: 'Thuỷ phân ester', tiLeDung: 0.46, soEmSai: 4, soEm: 5 },
  ],
  cauSaiNhieu: [
    { qid: 'Q1', phan: 'I', soCau: 1, de: 'Câu 1', dang: 'Thuỷ phân ester', soEmSai: 3, soEm: 5, dapAnDung: 'B', dapAnSaiNhieu: { dapAn: 'A', soEm: 2 } },
    { qid: 'Q2', phan: 'II', soCau: 2, de: 'Câu 2', soEmSai: 4, soEm: 5, dapAnDung: 'DSDS' },
  ],
  emCanYY: [
    { sbd: 'C', hoTen: 'Chi', tong: 2.5, diemTruoc: 5, doi: -2.5 },
    { sbd: 'D', hoTen: 'Dũng', tong: 7, diemTruoc: 9, doi: -2 },
  ],
  hocSinh: [
    { sbd: 'A', hoTen: 'An', tong: 9.5, thoiGianLamGiay: 1800, soCauDung: 27, soCau: 28 },
    { sbd: 'C', hoTen: 'Chi', tong: 2.5, thoiGianLamGiay: 1200, soCauDung: 9, soCau: 28 },
    { sbd: 'D', hoTen: 'Dũng', tong: 7, thoiGianLamGiay: 0, soCauDung: 20, soCau: 28 },
  ],
})
const ROI: EmRoiMan[] = [
  { sbd: 'C', hoTen: 'Chi', lop: '12A1', soLanRoiMan: 4, tongGiayRoiMan: 84 },
  { sbd: 'E', hoTen: 'Em', lop: '12A2', soLanRoiMan: 3, tongGiayRoiMan: 30 },
  { sbd: 'A', hoTen: 'An', lop: '12A1', soLanRoiMan: 2, tongGiayRoiMan: 10 },
]

describe('docBaoCaoCaLopMayChu — thân máy chủ ⇒ BaoCaoCaLop', () => {
  it('số lớp: nộp/vào/chưa nộp, tb/cao/thấp, phổ điểm đúng nhãn, ba phần, thời gian làm TB từ các em có thời gian (bỏ 0)', () => {
    const b = docBaoCaoCaLopMayChu(THAN())!
    expect([b.nop, b.daVao, b.chuaNop, b.tb, b.cao, b.thap]).toEqual([5, 6, 1, 6.9, 9.5, 2.5])
    expect(b.pho.map((x) => x.nhan)).toEqual(KHOANG_DIEM.map((k) => k[2]))
    expect(b.pho.map((x) => x.soEm)).toEqual([0, 1, 0, 1, 1, 0, 1, 1]) // 10 khoảng đơn vị gộp vào 8 khoảng của màn: [0,2) 0 · [2,4) 1 · [4,5) 0 · [5,6) 1 · [6,7) 1 · [7,8) 0 · [8,9) 1 · [9,10] 1
    expect(b.baPhan).toEqual([
      { ma: 'I', ten: 'Trắc nghiệm', diemTB: 2.6, toiDa: 3, dungTB: 8.4, tong: 12 },
      { ma: 'II', ten: 'Đúng–sai', diemTB: 1.9, toiDa: 4, dungTB: 2.1, tong: 4 },
    ])
    expect(b.phutTB).toBe(25) // (1800 + 1200) / 2 = 1500 giây; em có thoiGianLamGiay 0 không tính
    expect(b.coBangCham).toBe(true)
  })
  it('số em đã vào NHỎ hơn số đã nộp (lệch giờ đọc hai truy vấn) ⇒ đã vào tối thiểu bằng đã nộp, chưa nộp 0 (không số âm / vô lý)', () => {
    const t = THAN()
    ;(t as { congBo: unknown }).congBo = { congBo: 'ngay', daCongBo: true, soEmDaNop: 5, soEmDaVao: 3 }
    const b = docBaoCaoCaLopMayChu(t)!
    expect([b.nop, b.daVao, b.chuaNop]).toEqual([5, 5, 0])
    delete (t as { congBo?: unknown }).congBo
    expect(docBaoCaoCaLopMayChu(t)!.daVao).toBe(5) // không có congBo ⇒ bằng số đã nộp
  })
  it('dạng vấp: tỉ lệ 0–1 ⇒ %, xếp thấp trước; câu sai nhiều: tỉ lệ sai từ soEmSai/soEm, đáp án sai nhiều chỉ khi có; xếp tỉ lệ sai giảm dần', () => {
    const b = docBaoCaoCaLopMayChu(THAN())!
    expect(b.dang).toEqual([
      { ten: 'Thuỷ phân ester', tiLeDung: 46, soEmSai: 4, soEmLam: 5 },
      { ten: 'Tính chất amin', tiLeDung: 62, soEmSai: 3, soEmLam: 5 },
    ])
    expect(b.cauSai.map((c) => [c.qid, c.tiLeSai, c.soSai, c.soLam])).toEqual([['Q2', 80, 4, 5], ['Q1', 60, 3, 5]])
    expect(b.cauSai[0]!.dapAnSaiNhieu).toBeNull()
    expect(b.cauSai[1]!.dapAnSaiNhieu).toEqual({ dapAn: 'A', soEm: 2 })
    expect(b.cauSai[1]!.dang).toBe('Thuỷ phân ester')
  })
  it('em cần để ý: điểm dưới 5 (lý do bằng số, đúng d/t câu), điểm GIẢM ≥ 1,5 so với lần trước của chính em, rời màn ≥ 3 lần của máy thầy; em rời màn mà máy chủ không nêu vẫn vào; ≤ 5', () => {
    expect(GIAM_DIEM_NEU).toBe(1.5)
    const b = docBaoCaoCaLopMayChu(THAN(), ROI)!
    expect(b.emCanYY.map((e) => e.sbd)).toEqual(['C', 'D', 'E'])
    expect(b.emCanYY[0]).toEqual({ sbd: 'C', hoTen: 'Chi', lop: '12A1', lyDo: ['Đúng 9/28 câu (32%) — điểm 2,5', 'Điểm giảm 2,5 so với lần trước (5 → 2,5)', 'Rời màn làm bài 4 lần, tổng 1 phút 24 giây'] })
    expect(b.emCanYY[1]!.lyDo).toEqual(['Điểm giảm 2 so với lần trước (9 → 7)']) // điểm 7 không dưới 5; rời màn của D chưa có
    expect(b.emCanYY[2]).toMatchObject({ sbd: 'E', lop: '12A2', lyDo: ['Rời màn làm bài 3 lần, tổng 30 giây'] })
    expect(b.emCanYY.some((e) => e.sbd === 'A')).toBe(false) // rời màn 2 lần: chưa tới mốc
    const nhieu = docBaoCaoCaLopMayChu(THAN(), Array.from({ length: 9 }, (_, i) => ({ sbd: `X${i}`, hoTen: 'X', lop: '', soLanRoiMan: 5, tongGiayRoiMan: 1 })))!
    expect(nhieu.emCanYY).toHaveLength(5)
  })
  it('điểm giảm dưới ngưỡng (−1,4) không nêu; không có hocSinh ⇒ lý do điểm thấp chỉ nêu điểm', () => {
    const t = THAN()
    ;(t as { emCanYY: unknown }).emCanYY = [{ sbd: 'Z', hoTen: 'Zân', tong: 4, diemTruoc: 5.4, doi: -1.4 }]
    ;(t as { hocSinh: unknown }).hocSinh = []
    expect(docBaoCaoCaLopMayChu(t)!.emCanYY).toEqual([{ sbd: 'Z', hoTen: 'Zân', lop: '', lyDo: ['Điểm 4, dưới 5'] }])
  })
  it('CHỐNG SAI KIỂU: thiếu tongQuan / soEm âm ⇒ null; khối hỏng bị bỏ riêng (không kéo cả báo cáo); phổ điểm hỏng ⇒ tự đếm từ điểm từng em', () => {
    expect(docBaoCaoCaLopMayChu({ ok: true })).toBeNull()
    expect(docBaoCaoCaLopMayChu({ ok: true, tongQuan: { soEm: -1 } })).toBeNull()
    const t = THAN()
    ;(t as { dangCaLopVap: unknown }).dangCaLopVap = [{ ten: '', tiLeDung: 0.5, soEmSai: 1, soEm: 2 }, { ten: 'X', tiLeDung: 3, soEmSai: 1, soEm: 2 }, 'x', null]
    ;(t as { cauSaiNhieu: unknown }).cauSaiNhieu = [{ qid: 'Q', phan: 'IV', soCau: 1, soEmSai: 1, soEm: 2 }, { qid: 'Q', phan: 'I', soCau: 1, soEmSai: 1, soEm: 0 }]
    ;(t.tongQuan as { phoDiem: unknown; phanTb: unknown }).phoDiem = 'hỏng'
    ;(t.tongQuan as { phoDiem: unknown; phanTb: unknown }).phanTb = [{ ma: 'IV' }, { ma: 'I', diemTb: 'x' }]
    const b = docBaoCaoCaLopMayChu(t)!
    expect(b.dang).toEqual([])
    expect(b.cauSai).toEqual([])
    expect(b.baPhan).toEqual([])
    expect(b.pho.reduce((s, x) => s + x.soEm, 0)).toBe(3) // 3 em trong hocSinh: 9,5 · 2,5 · 7
    expect(b.tb).toBe(6.9)
  })
  it('khối ít (dang ≤ 5, câu ≤ 3): cắt theo giới hạn của màn', () => {
    const t = THAN()
    ;(t as { dangCaLopVap: unknown }).dangCaLopVap = Array.from({ length: 8 }, (_, i) => ({ ten: `D${i}`, tiLeDung: 0.1 * i, soEmSai: 1, soEm: 2 }))
    ;(t as { cauSaiNhieu: unknown }).cauSaiNhieu = Array.from({ length: 6 }, (_, i) => ({ qid: `Q${i}`, phan: 'I', soCau: i + 1, soEmSai: 1, soEm: 2, dapAnDung: 'B' }))
    const b = docBaoCaoCaLopMayChu(t)!
    expect(b.dang).toHaveLength(5)
    expect(b.cauSai).toHaveLength(3)
  })
})

describe('layBaoCaoCaLopMayChu — POST /gv/bao-cao-ca', () => {
  const dat = (tra: () => unknown) => {
    const goi: { url: string; body: unknown }[] = []
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: { body?: string }) => {
      goi.push({ url: String(url), body: JSON.parse(init.body ?? '{}') })
      return tra()
    }))
    return goi
  }
  it('gọi đúng đường + maCa; có ⇒ BaoCaoCaLop', async () => {
    const goi = dat(() => ({ ok: true, status: 200, json: async () => THAN() }))
    const r = await layBaoCaoCaLopMayChu('C1', ROI)
    expect(goi).toEqual([{ url: 'https://may.test/gv/bao-cao-ca', body: { maCa: 'C1' } }])
    expect(r!.nop).toBe(5)
    expect(r!.emCanYY.map((e) => e.sbd)).toContain('E')
  })
  it('404 (máy chủ cũ) / từ chối / mất mạng / thân sai dạng ⇒ null (màn rơi về số tính ở máy)', async () => {
    dat(() => ({ ok: false, status: 404, json: async () => ({ ok: false }) }))
    expect(await layBaoCaoCaLopMayChu('C1')).toBeNull()
    dat(() => ({ ok: false, status: 403, json: async () => ({ ok: false, error: 'Sai mã' }) }))
    expect(await layBaoCaoCaLopMayChu('C1')).toBeNull()
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('mất mạng') }))
    expect(await layBaoCaoCaLopMayChu('C1')).toBeNull()
    dat(() => ({ ok: true, status: 200, json: async () => ({ ok: true, tongQuan: 'hỏng' }) }))
    expect(await layBaoCaoCaLopMayChu('C1')).toBeNull()
  })
})

// ────────────── khối vẽ ──────────────
const LOCAL: BaoCaoCaLop = {
  nop: 2, daVao: 2, chuaNop: 0, tb: 4, cao: 5, thap: 3, phutTB: null, pho: KHOANG_DIEM.map(([, , nhan]) => ({ nhan, soEm: 0 })), baPhan: [], dang: [], cauSai: [], emCanYY: [], coBangCham: false,
}
describe('BaoCaoCaLopKhoi có layMayChu', () => {
  const ve = (layMayChu: () => Promise<BaoCaoCaLop | null>, khoa = 'k1') => {
    const tinh = vi.fn(() => LOCAL)
    const cau = (k: string) => <BaoCaoCaLopKhoi tomTat={{ nop: 5, tb: 6.9 }} tinh={tinh} khoa={k} phutDe={45} moSan onMoEm={() => {}} layMayChu={layMayChu} />
    const r = render(cau(khoa))
    return { ...r, tinh, veLai: (k: string) => r.rerender(cau(k)) }
  }
  it('chờ máy chủ ⇒ dòng "Đang lấy báo cáo…" (không tính nặng ở máy); có số ⇒ vẽ số của máy chủ, KHÔNG gọi tinh', async () => {
    let xong!: (b: BaoCaoCaLop | null) => void
    const cho = new Promise<BaoCaoCaLop | null>((r) => { xong = r })
    const { tinh } = ve(() => cho)
    expect(screen.getByText(/Đang lấy báo cáo/)).toBeTruthy()
    await act(async () => xong(docBaoCaoCaLopMayChu(THAN(), ROI)))
    await waitFor(() => expect(screen.queryByText(/Đang lấy báo cáo/)).toBeNull())
    expect(screen.getByText('Tính chất amin')).toBeTruthy() // dạng vấp từ máy chủ
    expect(tinh).not.toHaveBeenCalled()
  })
  it('máy chủ trả null / ném lỗi ⇒ RƠI VỀ số tính ở máy (tinh được gọi đúng một lần), màn vẫn vẽ', async () => {
    const a = ve(async () => null)
    await waitFor(() => expect(a.container.querySelector('[data-khoi="tong-quan-lop"]')).toBeTruthy())
    expect(a.tinh).toHaveBeenCalledTimes(1)
    cleanup()
    const b = ve(async () => { throw new Error('hỏng') })
    await waitFor(() => expect(b.container.querySelector('[data-khoi="tong-quan-lop"]')).toBeTruthy())
    expect(b.tinh).toHaveBeenCalledTimes(1)
  })
  it('khoá đổi (có bài nộp mới) ⇒ hỏi lại và GIỮ bản cũ trong lúc chờ (không nhấp nháy); khoá không đổi ⇒ không hỏi lại', async () => {
    const goi = vi.fn(async () => docBaoCaoCaLopMayChu(THAN(), ROI))
    const r = ve(goi)
    await waitFor(() => expect(r.container.querySelector('[data-khoi="tong-quan-lop"]')).toBeTruthy())
    expect(goi).toHaveBeenCalledTimes(1)
    r.veLai('k1')
    expect(goi).toHaveBeenCalledTimes(1)
    goi.mockImplementation(() => new Promise(() => {})) // lần hỏi sau chưa về
    r.veLai('k2')
    expect(goi).toHaveBeenCalledTimes(2)
    expect(r.container.querySelector('[data-khoi="tong-quan-lop"]')).toBeTruthy()
    expect(screen.queryByText(/Đang lấy báo cáo/)).toBeNull()
  })
  it('gỡ khối trước khi máy chủ trả lời ⇒ không cập nhật gì sau khi gỡ (không cảnh báo)', async () => {
    let xong!: (b: BaoCaoCaLop | null) => void
    const loi = vi.spyOn(console, 'error').mockImplementation(() => {})
    const r = ve(() => new Promise<BaoCaoCaLop | null>((res) => { xong = res }))
    r.unmount()
    await act(async () => xong(LOCAL))
    expect(loi).not.toHaveBeenCalled()
    loi.mockRestore()
  })
  it('KHÔNG có layMayChu ⇒ hành vi cũ nguyên: tinh chạy đồng bộ khi mở, không dòng "Đang lấy"', () => {
    const tinh = vi.fn(() => LOCAL)
    render(<BaoCaoCaLopKhoi tomTat={{ nop: 2, tb: 4 }} tinh={tinh} khoa="k" phutDe={45} moSan onMoEm={() => {}} />)
    expect(tinh).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(/Đang lấy báo cáo/)).toBeNull()
  })
})

// ────────────── GV-2: báo cáo MỘT em ──────────────
const THAN_EM = (): Record<string, unknown> => ({
  ok: true,
  ketQua: { tong: 7.5, diemI: 3, diemII: 2.5, diemIII: 2, soCau: 28, soCauDung: 21, soCauSai: 5, soCauMotPhan: 1, soCauBoTrong: 1 },
  phan: [{ ma: 'I', dung: 10, tong: 12, motPhan: 0, diem: 3, toiDa: 4.5 }, { ma: 'II', dung: 2, tong: 4, motPhan: 1, diem: 2.5 }, { ma: 'III', dung: 4, tong: 6, motPhan: 0, diem: 2, toiDa: 1.5 }],
  dang: [{ ma: 'D.A', ten: 'Tính chất amin', dung: 4, tong: 4 }, { ma: 'D.B', ten: 'Thuỷ phân ester', dung: 1, tong: 5 }],
  cauCanXemLai: [
    { qid: 'Q7', phan: 'I', soCau: 7, de: 'Đề rút gọn', dapAnChon: 'A', dapAnDung: 'C', loiGiai: 'Vì…', giay: 84, tbGiay: 61, laDungNhungLau: false },
    { qid: 'Q9', phan: 'II', soCau: 2, de: '', dapAnChon: 'DDSS', dapAnDung: 'DSDS', giay: 20, laDungNhungLau: true },
  ],
})
describe('docBaoCaoEmMayChu — thân máy chủ ⇒ phần ghép được', () => {
  it('đủ: điểm + đúng/tổng, ba phần (phần II thiếu trần ⇒ 4), dạng vấp trước, câu cần xem lại (loại sai / đúng-nhưng-lâu, tbGiay ⇒ tbGiayLop)', () => {
    const e = docBaoCaoEmMayChu(THAN_EM())!
    expect([e.tong, e.dung, e.tongCau, e.motPhan]).toEqual([7.5, 21, 28, 1])
    expect(e.phan.map((p) => [p.ma, p.dung, p.tong, p.diem, p.toiDa, p.cau.length])).toEqual([['I', 10, 12, 3, 4.5, 0], ['II', 2, 4, 2.5, 4, 0], ['III', 4, 6, 2, 1.5, 0]])
    expect(e.dang.map((d) => [d.ten, d.canOn])).toEqual([['Thuỷ phân ester', true], ['Tính chất amin', false]])
    expect(e.cauXemLai.map((c) => [c.qid, c.loai, c.de, c.giay, c.tbGiayLop])).toEqual([['Q7', 'sai', 'Đề rút gọn', 84, 61], ['Q9', 'dung_lau', null, 20, null]])
  })
  it('thiếu ketQua ⇒ null; khối sai dạng bị bỏ riêng; câu xem lại ≤ 8', () => {
    expect(docBaoCaoEmMayChu({ ok: true })).toBeNull()
    expect(docBaoCaoEmMayChu({ ok: true, ketQua: { tong: 'x' } })).toBeNull()
    const t = THAN_EM()
    ;(t as { phan: unknown }).phan = [{ ma: 'IV', dung: 1, tong: 2, diem: 1 }, { ma: 'I', dung: 'x' }]
    ;(t as { dang: unknown }).dang = [{ ten: 'X', dung: 5, tong: 2 }, { ten: '', dung: 1, tong: 2 }, { ten: 'Y', dung: 1, tong: 0 }]
    ;(t as { cauCanXemLai: unknown }).cauCanXemLai = Array.from({ length: 12 }, (_, i) => ({ qid: `Q${i}`, phan: 'I', soCau: i + 1, dapAnChon: 'A', dapAnDung: 'B' }))
    const e = docBaoCaoEmMayChu(t)!
    expect(e.phan).toEqual([])
    expect(e.dang).toEqual([])
    expect(e.cauXemLai).toHaveLength(8)
    expect(e.tong).toBe(7.5)
  })
  it('layBaoCaoEmMayChu: đúng đường + maCa + sbd; 404 / từ chối / mất mạng ⇒ null', async () => {
    const goi: { url: string; body: unknown }[] = []
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: { body?: string }) => { goi.push({ url: String(url), body: JSON.parse(init.body ?? '{}') }); return { ok: true, status: 200, json: async () => THAN_EM() } }))
    expect((await layBaoCaoEmMayChu('C1', 'A'))!.tong).toBe(7.5)
    expect(goi).toEqual([{ url: 'https://may.test/gv/bao-cao-ca-em', body: { maCa: 'C1', sbd: 'A' } }])
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, json: async () => ({ ok: false }) })))
    expect(await layBaoCaoEmMayChu('C1', 'A')).toBeNull()
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('mất mạng') }))
    expect(await layBaoCaoEmMayChu('C1', 'A')).toBeNull()
  })
  it('nguồn màn Theo dõi ca: chỉ hỏi /gv/bao-cao-ca-em khi máy thầy KHÔNG có bảng chấm và em đã nộp; ghép qua ghepBaoCaoMotEm; hiện bản ghép', () => {
    const man = readFileSync('src/screens/ExamMonitorScreen.tsx', 'utf8')
    expect(man).toMatch(/const canHoiMayChu = !!baoCaoMotEm && !baoCaoMotEm\.coBangCham && baoCaoMotEm\.daNop/)
    expect(man).toMatch(/layBaoCaoEmMayChu\(chiTiet\.ca\.maCa, sbdHoSo\)/)
    expect(man).toMatch(/ghepBaoCaoMotEm\(baoCaoMotEm, baoCaoEmMay\.may\)/)
    expect(man).toMatch(/<BaoCaoMotEmTrang\s+bc=\{baoCaoMotEmHienThi\}/)
  })
})
