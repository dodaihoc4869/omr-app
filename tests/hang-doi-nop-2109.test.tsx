// HÀNG ĐỢI NỘP LẠI TỰ ĐỘNG (Boss 21/09 sau sự cố D1): máy chủ bận lúc nộp ⇒ bài giữ ở máy, tự nộp lại lùi dần, em thấy "Đã lưu ở máy, đang chờ máy chủ".
// Ba tầng: (1) hàm thuần + lưu trữ; (2) vòng chạy (hook, đồng hồ giả); (3) khoá nguồn ở cổng học sinh + dải trên Bảng nhiệm vụ.
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  CHU_DA_LUU_MAY,
  KHOA_LUU_HANG,
  LUI_NOP_LAI_MS,
  TOI_DA_LAN_THU,
  TOI_DA_MUC,
  TUOI_TOI_DA_MS,
  boMucQuaTuoi,
  chuDangCho,
  demHangCuaEm,
  docHang,
  henSomNhat,
  khoaChang,
  khoaOnCau,
  khoangNopLai,
  luuHangVaoKho,
  mucDenHan,
  sauLanThu,
  themMuc,
  type MucHang,
} from '../src/lib/hang-doi-nop'
import { useHangDoiNop } from '../src/lib/use-hang-doi-nop'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const T0 = 1_800_000_000_000
const GIUA = () => 0.5 // lệch đúng 0
const muc = (id: string, sbd = 'A1', goi: Record<string, unknown> = { ma: 'B1', chiSo: 0, dapAn: { q1: 'A' }, maCa: 'R' }) => ({ id, loai: 'btvn_chang' as const, sbd, goi })

describe('hàm thuần', () => {
  it('bậc lùi 20 → 40 → 80 → 160 → 300 s, giữ ở 300; lệch ± 25 %; không dưới 15 giây', () => {
    expect(LUI_NOP_LAI_MS).toEqual([20_000, 40_000, 80_000, 160_000, 300_000])
    expect([0, 1, 2, 3, 4, 5, 99].map((n) => khoangNopLai(n, GIUA))).toEqual([20_000, 40_000, 80_000, 160_000, 300_000, 300_000, 300_000])
    expect(khoangNopLai(0, () => 0)).toBe(15_000) // 20 s × 0,75 = 15 s
    expect(khoangNopLai(0, () => 1)).toBe(25_000)
    expect(khoangNopLai(4, () => 0)).toBe(225_000)
    expect(khoangNopLai(-3, GIUA)).toBe(20_000)
    expect(khoangNopLai(Number.NaN, GIUA)).toBe(20_000)
  })
  it('khoá việc: cùng chặng cùng khoá; ôn câu không phụ thuộc thứ tự qid', () => {
    expect(khoaChang('A1', 'B1', 2)).toBe('btvn_chang|A1|B1|2')
    expect(khoaOnCau('A1', '/hs/on-lai/nop', ['b', 'a'])).toBe(khoaOnCau('A1', '/hs/on-lai/nop', ['a', 'b']))
  })
  it('themMuc: hẹn lượt đầu sau ≥ 15 s; đã có cùng khoá ⇒ GIỮ mục cũ (đáp án đầu thắng); quá 20 mục ⇒ bỏ CŨ nhất; bỏ mục quá 48 giờ', () => {
    let ds = themMuc([], muc('a'), T0, GIUA)
    expect(ds).toHaveLength(1)
    expect(ds[0]).toMatchObject({ id: 'a', lanThu: 0, tao: T0, henLuc: T0 + 20_000 })
    const lai = themMuc(ds, { ...muc('a'), goi: { ma: 'B1', chiSo: 0, dapAn: { q1: 'D' }, maCa: 'R' } }, T0 + 5000, GIUA)
    expect(lai).toHaveLength(1)
    expect((lai[0]!.goi as { dapAn: Record<string, string> }).dapAn.q1).toBe('A')
    for (let i = 0; i < TOI_DA_MUC + 5; i++) ds = themMuc(ds, muc(`m${i}`), T0 + i, GIUA)
    expect(ds).toHaveLength(TOI_DA_MUC)
    expect(ds.some((m) => m.id === 'a')).toBe(false)
    expect(ds[ds.length - 1]!.id).toBe(`m${TOI_DA_MUC + 4}`)
    expect(boMucQuaTuoi([{ ...ds[0]!, tao: T0 }, { ...ds[1]!, tao: T0 + TUOI_TOI_DA_MS + 1 }], T0 + TUOI_TOI_DA_MS + 2)).toHaveLength(1)
  })
  it('mucDenHan chỉ trả mục CỦA EM, đã đến hạn, theo thứ tự đưa vào; henSomNhat tính đúng và không dưới mức tối thiểu', () => {
    let ds = themMuc([], muc('x', 'A1'), T0, GIUA)
    ds = themMuc(ds, muc('y', 'B2'), T0 + 1, GIUA)
    ds = themMuc(ds, muc('z', 'A1'), T0 + 2, GIUA)
    expect(mucDenHan(ds, 'A1', T0 + 19_999)).toEqual([])
    expect(mucDenHan(ds, 'A1', T0 + 20_002).map((m) => m.id)).toEqual(['x', 'z'])
    expect(mucDenHan(ds, 'B2', T0 + 20_002).map((m) => m.id)).toEqual(['y'])
    expect(henSomNhat(ds, 'A1', T0)).toBe(20_000)
    expect(henSomNhat(ds, 'A1', T0 + 19_999.5, 1000)).toBe(1000)
    expect(henSomNhat(ds, 'ZZ', T0)).toBeNull()
    expect(demHangCuaEm(ds, 'A1')).toBe(2)
  })
  it('sauLanThu: xong / bo ⇒ gỡ; ban ⇒ tăng lần thử và lùi dần theo bậc', () => {
    let ds = themMuc([], muc('x'), T0, GIUA)
    ds = sauLanThu(ds, 'x', 'ban', T0 + 20_000, GIUA)
    expect(ds[0]).toMatchObject({ lanThu: 1, henLuc: T0 + 20_000 + 40_000 })
    ds = sauLanThu(ds, 'x', 'ban', T0 + 60_000, GIUA)
    expect(ds[0]).toMatchObject({ lanThu: 2, henLuc: T0 + 60_000 + 80_000 })
    expect(sauLanThu(ds, 'x', 'xong', T0, GIUA)).toEqual([])
    expect(sauLanThu(ds, 'x', 'bo', T0, GIUA)).toEqual([])
    expect(sauLanThu(ds, 'khac', 'ban', T0, GIUA)).toEqual(ds)
  })
  it('docHang: chuỗi hỏng / mục lạ ⇒ bỏ, không ném; lưu rồi đọc lại đúng; kho ném lỗi ⇒ im lặng', () => {
    expect(docHang(null)).toEqual([])
    expect(docHang('{không phải json')).toEqual([])
    expect(docHang('{"a":1}')).toEqual([])
    const ok = themMuc([], muc('x'), T0, GIUA)
    expect(docHang(JSON.stringify([...ok, { id: '', loai: 'btvn_chang' }, null, 5, { ...ok[0], loai: 'la' }]))).toEqual(ok)
    const kho = { v: '', getItem: () => kho.v || null, setItem: (_k: string, v: string) => { kho.v = v } }
    luuHangVaoKho(ok, kho)
    expect(docHang(kho.v)).toEqual(ok)
    expect(() => luuHangVaoKho(ok, { getItem: () => null, setItem: () => { throw new Error('đầy') } })).not.toThrow()
    expect(() => luuHangVaoKho(ok, null)).not.toThrow()
  })
  it('lời báo: một câu CHUNG cho mọi màn, không mã nội bộ', () => {
    expect(CHU_DA_LUU_MAY).toBe('Đã lưu ở máy, đang chờ máy chủ. Em không cần bấm nộp lại — app tự gửi khi máy chủ rảnh.')
    expect(chuDangCho(1)).toBe('Đã lưu ở máy 1 bài, đang chờ máy chủ nhận.')
    expect(chuDangCho(3)).toBe('Đã lưu ở máy 3 bài, đang chờ máy chủ nhận.')
    expect(TOI_DA_LAN_THU).toBe(20)
  })
})

describe('vòng chạy useHangDoiNop (đồng hồ giả)', () => {
  const kho = () => {
    const k = { v: '' as string, getItem: (_: string) => k.v || null, setItem: (_: string, v: string) => { k.v = v } }
    return k
  }
  let ngauNhien: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(T0)
  })
  afterEach(() => {
    ngauNhien?.mockRestore()
    vi.useRealTimers()
  })
  // Tiến đồng hồ TỪNG NỬA GIÂY, mỗi bước một `act`: React gom cập nhật trong một `act` tới lúc ra khỏi nó, nên nếu tiến cả đoạn dài trong MỘT `act` thì lượt hẹn kế
  // (đặt lại sau khi state đổi) không kịp được đặt — khác thực tế (trình duyệt xả hiệu ứng ngay).
  const chay = async (ms: number) => {
    for (let t = 0; t < ms; t += 500) await act(async () => { await vi.advanceTimersByTimeAsync(Math.min(500, ms - t)) })
  }

  it('thêm việc ⇒ soCho 1; sau ~20 s thử; "ban" ⇒ lùi 40 s; "xong" ⇒ gỡ và soCho 0; đã lưu vào kho', async () => {
    const k = kho()
    const kq: Array<'ban' | 'xong'> = ['ban', 'xong']
    const xuLy = vi.fn(async () => kq.shift()!)
    const { result } = renderHook(() => useHangDoiNop('A1', xuLy, { kho: k, ngauNhien: GIUA }))
    expect(result.current.soCho).toBe(0)
    act(() => result.current.them(muc('c0')))
    expect(result.current.soCho).toBe(1)
    expect(result.current.daCo('c0')).toBe(true)
    expect(docHang(k.v)).toHaveLength(1)
    await chay(19_000)
    expect(xuLy).not.toHaveBeenCalled()
    await chay(1_500)
    expect(xuLy).toHaveBeenCalledTimes(1)
    expect(result.current.soCho).toBe(1) // ban ⇒ vẫn chờ
    await chay(39_000)
    expect(xuLy).toHaveBeenCalledTimes(1)
    await chay(2_000)
    expect(xuLy).toHaveBeenCalledTimes(2) // ~40 s sau lượt đầu
    expect(result.current.soCho).toBe(0)
    expect(docHang(k.v)).toEqual([])
  })

  it('TUẦN TỰ: hai việc đến hạn cùng lúc ⇒ chỉ MỘT lượt bay tại một thời điểm', async () => {
    let bay = 0, toiDa = 0
    const xuLy = vi.fn(async () => {
      bay++
      toiDa = Math.max(toiDa, bay)
      await new Promise((r) => setTimeout(r, 3000))
      bay--
      return 'xong' as const
    })
    const k = kho()
    const { result } = renderHook(() => useHangDoiNop('A1', xuLy, { kho: k, ngauNhien: GIUA }))
    act(() => { result.current.them(muc('m1')); result.current.them(muc('m2')) })
    await chay(30_000)
    expect(xuLy).toHaveBeenCalledTimes(2)
    expect(toiDa).toBe(1)
    expect(result.current.soCho).toBe(0)
  })

  it('máy chủ từ chối hẳn (bo) ⇒ gỡ ngay, không thử lại; việc của em KHÁC không bị động tới', async () => {
    const xuLy = vi.fn(async () => 'bo' as const)
    const k = kho()
    const { result } = renderHook(() => useHangDoiNop('A1', xuLy, { kho: k, ngauNhien: GIUA }))
    act(() => { result.current.them(muc('m1', 'A1')); result.current.them(muc('m2', 'B2')) })
    await chay(200_000)
    expect(xuLy).toHaveBeenCalledTimes(1)
    expect(xuLy).toHaveBeenCalledWith(expect.objectContaining({ id: 'm1' }))
    expect(result.current.soCho).toBe(0)
    expect(docHang(k.v).map((m) => m.id)).toEqual(['m2']) // việc của em B2 còn nguyên trong kho
  })

  it('ném lỗi cũng tính là "ban" (không mất việc); go(id) gỡ việc đã nộp bằng đường bấm tay', async () => {
    const xuLy = vi.fn(async () => { throw new Error('mạng') })
    const k = kho()
    const { result } = renderHook(() => useHangDoiNop('A1', xuLy, { kho: k, ngauNhien: GIUA }))
    act(() => result.current.them(muc('m1')))
    await chay(21_000)
    expect(xuLy).toHaveBeenCalledTimes(1)
    expect(result.current.soCho).toBe(1)
    act(() => result.current.go('m1'))
    expect(result.current.soCho).toBe(0)
    await chay(200_000)
    expect(xuLy).toHaveBeenCalledTimes(1)
  })

  it('mở app lại (kho đã có việc) ⇒ vẫn tự nộp; tab ẩn ⇒ hoãn, hiện lại ⇒ nộp', async () => {
    const k = kho()
    luuHangVaoKho(themMuc([], muc('c0'), T0 - 100_000, GIUA), k) // việc tạo từ phiên trước, đã quá hạn hẹn
    const xuLy = vi.fn(async () => 'xong' as const)
    let an = true
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => an })
    try {
      const { result } = renderHook(() => useHangDoiNop('A1', xuLy, { kho: k, ngauNhien: GIUA }))
      expect(result.current.soCho).toBe(1)
      await chay(5_000)
      expect(xuLy).not.toHaveBeenCalled() // tab ẩn
      an = false
      await act(async () => { document.dispatchEvent(new Event('visibilitychange')) })
      await chay(2_000)
      expect(xuLy).toHaveBeenCalledTimes(1)
      expect(result.current.soCho).toBe(0)
    } finally {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
    }
  })

  it('MÁY DÙNG CHUNG: việc của em A chỉ chạy khi CHÍNH em A đăng nhập; em B đăng nhập ⇒ việc của A ngủ trong kho (không bị nộp bằng phiên của B), A đăng nhập lại ⇒ mới nộp', async () => {
    const k = kho()
    const xuLy = vi.fn(async () => 'xong' as const)
    const a = renderHook(({ sbd }) => useHangDoiNop(sbd, xuLy, { kho: k, ngauNhien: GIUA }), { initialProps: { sbd: 'A1' as string | undefined } })
    act(() => a.result.current.them(muc('viec-cua-A', 'A1')))
    a.rerender({ sbd: undefined }) // A đăng xuất trước khi hàng kịp nộp
    await chay(60_000)
    expect(xuLy).not.toHaveBeenCalled()
    a.rerender({ sbd: 'B2' }) // B đăng nhập trên cùng máy
    expect(a.result.current.soCho).toBe(0) // dải "Đã lưu ở máy" của B không đếm việc của A
    await chay(60_000)
    expect(xuLy).not.toHaveBeenCalled()
    expect(docHang(k.v).map((m) => m.id)).toEqual(['viec-cua-A']) // việc của A còn nguyên trong kho
    a.rerender({ sbd: 'A1' })
    await chay(2_000)
    expect(xuLy).toHaveBeenCalledTimes(1)
    expect(xuLy).toHaveBeenCalledWith(expect.objectContaining({ id: 'viec-cua-A', sbd: 'A1' }))
  })

  it('HAI TAB cùng máy (localStorage thật + sự kiện storage): tab 2 biết việc do tab 1 thêm, nhưng tới hạn chỉ MỘT tab nộp (giữ chỗ trong kho); không ai nộp lại sau khi xong', async () => {
    localStorage.clear()
    let bay = 0
    const xuLy = vi.fn(async () => {
      bay++
      await new Promise((r) => setTimeout(r, 4000))
      return 'xong' as const
    })
    const t1 = renderHook(() => useHangDoiNop('A1', xuLy, { ngauNhien: GIUA }))
    const t2 = renderHook(() => useHangDoiNop('A1', xuLy, { ngauNhien: GIUA }))
    act(() => t1.result.current.them(muc('chung', 'A1')))
    // Trình duyệt bắn `storage` cho CÁC TAB KHÁC khi một tab ghi localStorage; jsdom không tự bắn trong cùng cửa sổ ⇒ bắn tay.
    await act(async () => { window.dispatchEvent(new StorageEvent('storage', { key: KHOA_LUU_HANG, newValue: localStorage.getItem(KHOA_LUU_HANG) })) })
    expect(t2.result.current.soCho).toBe(1) // tab 2 thấy việc
    await chay(30_000)
    expect(bay).toBe(1) // cả hai tab tới hạn cùng lúc, chỉ MỘT tab giữ chỗ và nộp
    expect(xuLy).toHaveBeenCalledTimes(1)
    await act(async () => { window.dispatchEvent(new StorageEvent('storage', { key: KHOA_LUU_HANG, newValue: localStorage.getItem(KHOA_LUU_HANG) })) })
    expect(docHang(localStorage.getItem(KHOA_LUU_HANG))).toEqual([]) // nộp xong, gỡ khỏi kho
    expect(t2.result.current.soCho).toBe(0)
    await chay(300_000)
    expect(xuLy).toHaveBeenCalledTimes(1) // không ai nộp lại
    t1.unmount()
    t2.unmount()
    localStorage.clear()
  })

  it('lượt bay dài hơn thời gian giữ chỗ 90 s không làm mất kết quả: vẫn ghi vào hàng khi xong (kể cả state đã đổi vì giữ chỗ)', async () => {
    const k = kho()
    const xuLy = vi.fn(async () => {
      await new Promise((r) => setTimeout(r, 3000))
      return 'ban' as const
    })
    const { result } = renderHook(() => useHangDoiNop('A1', xuLy, { kho: k, ngauNhien: GIUA }))
    act(() => result.current.them(muc('m1', 'A1')))
    await chay(25_000)
    expect(xuLy).toHaveBeenCalledTimes(1)
    const m = docHang(k.v)[0]!
    expect(m.lanThu).toBe(1) // kết quả "ban" đã được ghi (lần thử tăng), hạn mới theo bậc lùi 40 s
    expect(m.henLuc - T0).toBeGreaterThan(20_000 + 3_000 + 30_000)
  })

  it('không có sbd (chưa đăng nhập) ⇒ không chạy, soCho 0', async () => {
    const xuLy = vi.fn(async () => 'xong' as const)
    const { result } = renderHook(() => useHangDoiNop(undefined, xuLy, { kho: kho(), ngauNhien: GIUA }))
    expect(result.current.soCho).toBe(0)
    await chay(100_000)
    expect(xuLy).not.toHaveBeenCalled()
  })
})

describe('khoá nguồn', () => {
  const sp = doc('src/screens/StudentPortalScreen.tsx')
  it('cổng học sinh: máy chủ bận ⇒ xếp hàng + trả daLuu; nộp tay được ⇒ gỡ; nộp lại được ⇒ vẽ lại đúng phiếu hoặc nạp lại danh sách; giới hạn lần thử', () => {
    expect(sp).toMatch(/useHangDoiNop\(auth\?\.sbd,/)
    expect(sp).toMatch(/hangNop\.them\(\{ id: idHang, loai: 'btvn_chang'/)
    expect(sp).toMatch(/return \{ ok: false, ban: true, daLuu: true, error: CHU_DA_LUU_MAY \}/)
    expect(sp).toMatch(/hangNop\.go\(idHang\)/)
    expect(sp).toMatch(/maBtvnPhieuRef\.current === g\.ma/)
    expect(sp).toMatch(/m\.lanThu >= TOI_DA_LAN_THU/)
    expect(sp).toMatch(/dangChoNop=\{hangNop\.soCho\}/)
  })
  it('cổng học sinh: chỉ nộp việc của ĐÚNG em đang đăng nhập; ôn câu bị từ chối / hết lần thử mà màn đã đóng ⇒ hộp thoại báo (không lặng lẽ mất); màn ôn nhận qua cờ daNhan', () => {
    expect(sp).toMatch(/if \(!auth \|\| m\.sbd !== auth\.sbd\) return 'ban'/)
    expect(sp).toMatch(/if \(!chiTiet\.daNhan\) void bao\(/)
    expect(sp).toMatch(/baoOnCau\(r\.error \|\| 'Máy chủ chưa nhận bài ôn\.'\)/)
    expect(doc('src/components/bang-nhiem-vu/LamCauOn.tsx')).toMatch(/d\.daNhan = true/)
  })
  it('KHÔNG có token trong gói xếp hàng (không lưu bí mật ở kho hàng đợi)', () => {
    expect(sp).not.toMatch(/hangNop\.them\([^)]*token/)
    expect(doc('src/lib/hang-doi-nop.ts')).toMatch(/Không chứa token/)
  })
  it('Bảng nhiệm vụ: dải chờ nộp dùng CÙNG chữ chuDangCho, role=status, chỉ khi có việc; không màu thô', () => {
    const b = doc('src/components/bang-nhiem-vu/BangNhiemVu.tsx')
    expect(b).toMatch(/dangChoNop > 0 && \(/)
    expect(b).toMatch(/data-vung="dang-cho-nop"/)
    expect(b).toMatch(/chuDangCho\(dangChoNop\)/)
    expect(KHOA_LUU_HANG).toBe('omr_hang_doi_nop_v1')
  })
})
