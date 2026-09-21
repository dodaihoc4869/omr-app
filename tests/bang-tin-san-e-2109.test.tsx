// BẢNG TIN KIỂU SÀN GIAO DỊCH · cụm (e): NỐI VÀO MÀN HÔM NAY THẬT (HomNayScreen) — bộ đọc hợp đồng `/gv/bang-tin-song`, nhịp hỏi 10 giây, cờ lùi + rơi về Bảng tin bản 3, không gọi lệnh bản 3 khi đang dùng sàn.
// Hợp đồng: docs/hop-dong-bang-tin-song-2109.md. Chuẩn bị tối thiểu như tests/bang-tin-v3-2109.test.tsx (fetch giả); Bảng tin sàn dựng thật (không three: `ban-do-3d-three` giả, canvas không có ⇒ bản 2D bỏ vẽ).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import { MAU_DAY } from './fixtures/bang-tin-mau'
import { docDanDau, docDungNhip, docNen, docNhiet, docSan, docTia, docTin, docTheoLop, tenLopHienThi, TEN_LOP_MAY_CHU_CHUA_XEP } from '../src/lib/bang-tin-san/doc-san'
import { taoDuLieuGia } from '../src/lib/bang-tin-san/mau-gia'
import { TEN_LOP_CHUA_XEP } from '../server/src/ten-lop'
import { datKhungGia } from './_khung-gia-2109'
import { useAppStore } from '../src/store/appStore'
import HomNayScreen from '../src/screens/HomNayScreen'
import { NHIP_HOI_SAN_MS, NHIP_HUT_MAT_KET_NOI, THU_LAI_SAU_KHI_TU_CHOI_MS } from '../src/components/bang-tin-san/use-san-song'
import { LUI_DAN_MS } from '../src/lib/nhip-ben-vung'
import { datLaiHeSo, ghiHeSo } from '../src/lib/nhip-de-nghi'
import { NHIP_SUC_KHOE_MS, THU_LAI_CHIP_SAU_KHI_TU_CHOI_MS } from '../src/lib/suc-khoe-may-chu'
import { tenGoiKhongTrung } from '../src/lib/bang-tin-san/ten-goi'
import { DanDau } from '../src/components/bang-tin-san/DanDau'

vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }) }))
vi.mock('../src/lib/exam-db', () => ({ loadTeacherSecret: async () => 'mat-thu' }))
vi.mock('../src/lib/cap-nhat-app', () => ({ daySangBanMoi: () => {} }))
vi.mock('../src/components/bang-tin-san/ban-do-3d-three', () => ({ taoBan3D: () => null })) // không nạp three trong jsdom

const NAY = Date.parse('2026-09-21T08:28:36.000Z')
const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

/** Thân `/gv/bang-tin-song` đúng hợp đồng, dựng từ dữ liệu giả có hạt giống (cùng số ở mọi khối). */
function thanSong(sua: (song: Record<string, unknown>) => void = () => {}): Record<string, unknown> {
  const g = taoDuLieuGia(NAY)
  const song: Record<string, unknown> = {
    tongEm: g.tongEm,
    dungNhip: g.dungNhip,
    tia60: g.tia ? { hs: g.tia.hs, cau: g.tia.cau, tile: g.tia.tile, nhip: g.tia.nhip } : null,
    nen: g.nen,
    theoLop: g.theoLop,
    nhiet: g.nhiet,
    suKienMoi: g.tin,
    danDau: g.danDau,
  }
  sua(song)
  return { ...MAU_DAY, serverNow: NAY, song }
}

/** Đồng hồ giả CHỈ cho timer + Date; khung hình (rAF) là hàng đợi giả không tự chạy — 90 giây giả không kéo theo 5.400 lần vẽ. */
const dongHoGia = () => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] })
beforeEach(() => {
  datKhungGia()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null)
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
})
afterEach(() => {
  cleanup()
  datLaiHeSo()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

// ─────────────────────────────── BỘ ĐỌC HỢP ĐỒNG ───────────────────────────────
describe('docSan — đọc CÓ CHỐNG SAI KIỂU; thiếu mảnh ⇒ ẩn khối, thiếu nền ⇒ null (rơi về bản 3)', () => {
  it('thân đủ ⇒ DuLieuSan: mốc từ tuHomNay, số đầu từ nhip, các khối sống từ song; bt = đúng docBangTin', () => {
    const d = docSan(thanSong(), 123)!
    expect(d).toBeTruthy()
    expect(d.mocMs).toBe(Date.parse(MAU_DAY.tuHomNay))
    expect(d.serverNow).toBe(NAY)
    expect(d.nhanLucMs).toBe(123)
    expect([d.soEmHoc, d.soCau, d.soCauDung]).toEqual([MAU_DAY.nhip.soEmHoc, MAU_DAY.nhip.soCau, MAU_DAY.nhip.soCauDung])
    const g = taoDuLieuGia(NAY)
    expect(d.tongEm).toBe(g.tongEm)
    expect(d.theoLop).toEqual(g.theoLop)
    expect(d.nhiet).toEqual(g.nhiet)
    expect(d.nen).toEqual(g.nen)
    expect(d.tin).toEqual(g.tin)
    expect(d.danDau).toEqual(g.danDau)
    expect(d.tia).toEqual(g.tia)
    expect(d.dungNhip).toEqual(g.dungNhip)
    expect(d.bt!.baiTap.length).toBe(MAU_DAY.baiTap.length)
  })
  it('KHÔNG có `song` (máy chủ cũ trả bản 3) ⇒ null; thiếu `nhip` ⇒ null; không có mốc ⇒ null', () => {
    const { song: _s, ...khongSong } = thanSong()
    expect(docSan(khongSong, 1)).toBeNull()
    expect(docSan({ ...thanSong(), nhip: undefined }, 1)).toBeNull()
    expect(docSan({ ...thanSong(), tu: '', tuHomNay: '' }, 1)).toBeNull()
    expect(docSan({ ok: true, song: {} }, 1)).toBeNull()
  })
  it('"Chưa xếp lớp" (chữ nội bộ của máy chủ) ⇒ "Chưa rõ lớp" Ở NGUỒN: bảng theo lớp, ô nhiệt, dẫn đầu, bài tập về nhà, em cần để ý; hằng khớp server/src/ten-lop.ts', () => {
    expect(TEN_LOP_MAY_CHU_CHUA_XEP).toBe(TEN_LOP_CHUA_XEP)
    expect(tenLopHienThi('Chưa xếp lớp')).toBe('Chưa rõ lớp')
    expect(tenLopHienThi('12 - Tinh Hoa')).toBe('12 - Tinh Hoa')
    expect(tenLopHienThi('· Chưa xếp lớp · vừa vào học')).toBe('· Chưa rõ lớp · vừa vào học') // nằm trong câu chữ soạn sẵn (băng tin)
    const d = docSan(
      {
        ...thanSong((s) => {
          s.theoLop = [{ lop: 'Chưa xếp lớp', siSo: 3, daHoc: 1, soCau: 5, soCauDung: 4 }]
          s.nhiet = [{ sbd: '1', hoTen: 'Họ Mẫu Tên', lop: 'Chưa xếp lớp', soCau: 5, soCauDung: 4, dangVap: false }]
          s.danDau = [{ sbd: '1', hoTen: 'Họ Mẫu Tên', tenLop: 'Chưa xếp lớp', soCau: 12, tienBo: 3 }]
        }),
        baiTap: [{ ...MAU_DAY.baiTap[0], tenLop: 'Chưa xếp lớp' }],
        canDeY: { ds: [{ sbd: '2', hoTen: 'Họ Mẫu Hai', tenLop: 'Chưa xếp lớp', lyDo: [{ loai: 'sai_nhieu', chu: 'Sai nhiều', so: 2, tong: 5 }] }], conLai: 0 },
      },
      1,
    )!
    expect(JSON.stringify(d)).not.toContain('Chưa xếp lớp')
    expect(d.theoLop![0]!.lop).toBe('Chưa rõ lớp')
    expect(d.nhiet![0]!.lop).toBe('Chưa rõ lớp') // cùng tên với bảng theo lớp ⇒ ô nhiệt vẫn gom đúng nhóm
    expect(d.danDau![0]!.tenLop).toBe('Chưa rõ lớp')
    expect(d.bt!.baiTap[0]!.tenLop).toBe('Chưa rõ lớp')
    expect(d.bt!.canDeY.ds[0]!.tenLop).toBe('Chưa rõ lớp')
  })
  it('tia60: ba chuỗi cùng độ dài ≥ 2 và toàn số hữu hạn; nhip hỏng ⇒ null RIÊNG; một điểm hỏng ⇒ bỏ cả tia; lệch độ dài ⇒ null', () => {
    const t = (o: object) => docTia({ hs: [1, 2, 3], cau: [1, 2, 3], tile: [50, 60, 70], nhip: [1, 1, 1], ...o })
    expect(t({})).toEqual({ hs: [1, 2, 3], cau: [1, 2, 3], tile: [50, 60, 70], nhip: [1, 1, 1] })
    expect(t({ nhip: null })!.nhip).toBeNull()
    expect(t({ nhip: [1, 'x', 1] })!.nhip).toBeNull()
    expect(t({ hs: [1, NaN, 3] })).toBeNull()
    expect(t({ cau: [1, 2] })).toBeNull()
    expect(t({ tile: [50] , hs: [1], cau: [1] })).toBeNull()
    expect(docTia(null)).toBeNull()
    expect(docTia('x')).toBeNull()
  })
  it('nến: bỏ mục hỏng, xếp cũ → mới, ≤ 100 nến gần nhất; [] (chưa có câu) ⇒ null (ẩn khối, không vẽ khung rỗng)', () => {
    const n = (tu: number) => ({ tu, mo: 80, cao: 85, thap: 78, dong: 82, soCau: 4 })
    expect(docNen([])).toBeNull()
    expect(docNen([{ tu: 1 }, 'x', null, { ...n(2), cao: 'a' }])).toBeNull()
    expect(docNen([n(30), n(10), n(20), { ...n(5), soCau: -1 }])!.map((x) => x.tu)).toEqual([10, 20, 30])
    const nhieu = Array.from({ length: 130 }, (_, i) => n(i))
    const r = docNen(nhieu)!
    expect(r).toHaveLength(100)
    expect(r[0]!.tu).toBe(30)
    expect(r.at(-1)!.tu).toBe(129)
  })
  it('theoLop / nhiet / danDau: bỏ mục thiếu khoá hoặc số âm; rỗng ⇒ null; danDau ≤ 5; hoTen thiếu ⇒ lấy sbd (không rỗng)', () => {
    expect(docTheoLop([{ lop: '', siSo: 1, daHoc: 0, soCau: 0, soCauDung: 0 }, { lop: 'A', siSo: -1, daHoc: 0, soCau: 0, soCauDung: 0 }])).toBeNull()
    expect(docTheoLop([{ lop: 'A', siSo: 10, daHoc: 3, soCau: 20, soCauDung: 15 }, 'x'])).toEqual([{ lop: 'A', siSo: 10, daHoc: 3, soCau: 20, soCauDung: 15 }])
    expect(docNhiet([{ sbd: '', soCau: 1, soCauDung: 1 }, { sbd: '9', lop: 'A', soCau: 2, soCauDung: 1, dangVap: 'true' }])).toEqual([{ sbd: '9', hoTen: '9', lop: 'A', soCau: 2, soCauDung: 1, dangVap: false }])
    const d = Array.from({ length: 8 }, (_, i) => ({ sbd: String(i), hoTen: `Em ${i}`, tenLop: 'A', soCau: 20 - i, tienBo: i - 3 }))
    expect(docDanDau(d)).toHaveLength(5)
    expect(docDanDau([{ sbd: '1', soCau: 20, tienBo: 'x' }])).toBeNull()
    expect(docDanDau([{ sbd: '1', soCau: 20, tienBo: -4 }])![0]!.tienBo).toBe(-4) // số âm giữ nguyên (tiến bộ âm là thật)
  })
  it('tin (suKienMoi): chỉ loại len/xuong/cham, có chữ, có giờ; xếp cũ → mới; ≤ 20; dungNhip: cần soCoLo > 0, soEm không vượt soCoLo', () => {
    const t = (luc: number, loai = 'len', chu = 'Tin') => ({ luc, loai, chu })
    expect(docTin([t(3), t(1), { ...t(2), loai: 'la' }, { ...t(4), chu: '' }, { chu: 'x', loai: 'len' }, 'x']).map((x) => x.luc)).toEqual([1, 3])
    expect(docTin(Array.from({ length: 30 }, (_, i) => t(i))).map((x) => x.luc)).toEqual(Array.from({ length: 20 }, (_, i) => i + 10))
    expect(docTin([{ ...t(1), phu: '  · Khối 10 ' }])[0]!.phu).toBe('· Khối 10')
    expect(docDungNhip({ soEm: 5, soCoLo: 0 })).toBeNull()
    expect(docDungNhip({ soEm: 9, soCoLo: 4 })).toEqual({ soEm: 4, soCoLo: 4 })
    expect(docDungNhip(null)).toBeNull()
  })
})

// ─────────────────────────────── MÀN HÔM NAY: sàn ⇄ bản 3 ───────────────────────────────
type Tra = { ok: boolean; status: number; json: () => Promise<unknown> }
describe('HomNayScreen — Bảng tin sàn khi máy chủ có lệnh sống; rơi về Bảng tin bản 3 khi không', () => {
  const nap: { song: (() => Promise<Tra> | Tra) | null; bangTin: unknown; suc: () => Promise<Tra> | Tra } = { song: null, bangTin: MAU_DAY, suc: () => ok({ ok: true }) }
  const goi: string[] = []
  const ok = (b: unknown): Tra => ({ ok: true, status: 200, json: async () => b })
  const kho: Tra = { ok: false, status: 404, json: async () => ({ ok: false }) }
  const dem = (u: string) => goi.filter((x) => x === u).length
  beforeEach(() => {
    goi.length = 0
    nap.song = () => ok(thanSong())
    nap.bangTin = MAU_DAY
    nap.suc = () => ok({ ok: true }) // không có `muc` ⇒ không chip (các test cũ không đổi)
    useAppStore.getState().setScreen('examhub')
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const u = new URL(String(url)).pathname
        goi.push(u)
        if (u === '/gv/bang-tin-song') return nap.song ? nap.song() : kho
        if (u === '/gv/suc-khoe-may-chu') return nap.suc()
        if (u === '/gv/bang-tin') return nap.bangTin ? ok(nap.bangTin) : kho
        if (u === '/ke-hoach/hom-nay-thay') return ok({ ok: true, btvn: { soEmCoLo: 148, soEmDungNhip: 97, dangChay: [] } })
        if (u === '/gv/can-giup') return kho
        return ok({ ok: true })
      }),
    )
  })
  const laSan = (c: HTMLElement) => c.querySelector('[data-khoi="bang-tin-san"]')
  const laV3 = (c: HTMLElement) => c.querySelector('[data-khung="bang-tin-v3"]')
  /** Lùi dần sau hụt (kế hoạch giờ cao điểm 21/09): hụt lần 1 ⇒ 30 s, lần 2 ⇒ 60 s. */
const LUI_HUT_DAU_MS = LUI_DAN_MS[0]!
const LUI_HUT_HAI_MS = LUI_DAN_MS[1]!
const yen = async (ms = 50) => act(async () => void (await vi.advanceTimersByTimeAsync(ms)))

  it('đang chờ câu trả lời đầu ⇒ khung xương (không màn trắng)', () => {
    nap.song = () => new Promise<Tra>(() => {})
    render(<HomNayScreen />)
    expect(screen.getByRole('status', { name: 'Đang tải bảng tin' })).toBeTruthy()
  })
  it('lệnh sống có ⇒ BẢNG TIN SÀN; KHÔNG gọi lệnh của bản 3 (/gv/bang-tin, /ke-hoach/hom-nay-thay) — lệnh sống đã mang đủ khoá', async () => {
    const { container } = render(<HomNayScreen />)
    await waitFor(() => expect(laSan(container)).toBeTruthy())
    expect(laV3(container)).toBeNull()
    expect(container.querySelector('.bts-ten, h1')?.textContent).toContain('Bảng tin')
    expect(dem('/gv/bang-tin-song')).toBe(1)
    expect(dem('/gv/bang-tin')).toBe(0)
    expect(dem('/ke-hoach/hom-nay-thay')).toBe(0)
  })
  it('máy chủ CHƯA có lệnh (404) ⇒ Bảng tin bản 3, không lỗi đỏ; 5 phút sau mới hỏi lại lệnh sống (không đập vào lệnh đang tắt)', async () => {
    dongHoGia()
    nap.song = null
    const { container } = render(<HomNayScreen />)
    await yen()
    expect(laV3(container)).toBeTruthy()
    expect(laSan(container)).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(dem('/gv/bang-tin-song')).toBe(1)
    await yen(THU_LAI_SAU_KHI_TU_CHOI_MS - 1_000)
    expect(dem('/gv/bang-tin-song')).toBe(1) // suốt 4 phút 59 giây: không hỏi lại
    await yen(NHIP_HOI_SAN_MS + 1_000)
    expect(dem('/gv/bang-tin-song')).toBe(2)
    expect(laV3(container)).toBeTruthy()
  })
  it('CỜ LÙI cau_hinh.bang_tin_san = "tat" (máy chủ trả {ok:false, lyDo:"tat"}) ⇒ Bảng tin bản 3', async () => {
    nap.song = () => ok({ ok: false, lyDo: 'tat', error: 'Bảng tin sống đang tắt.' })
    const { container } = render(<HomNayScreen />)
    await waitFor(() => expect(laV3(container)).toBeTruthy())
    expect(laSan(container)).toBeNull()
    expect(dem('/gv/bang-tin')).toBeGreaterThan(0)
  })
  it('thân `ok:true` nhưng VẮNG song (máy chủ cũ / phần trực tiếp lỗi) hoặc sai dạng ⇒ Bảng tin bản 3; bản 3 cũng lỗi ⇒ bản 2 dự phòng (không trắng màn)', async () => {
    const { song: _s, ...khongSong } = thanSong()
    nap.song = () => ok(khongSong)
    const a = render(<HomNayScreen />)
    await waitFor(() => expect(laV3(a.container)).toBeTruthy())
    a.unmount()
    nap.song = () => ok({ ok: true, song: 'hỏng' })
    nap.bangTin = null
    render(<HomNayScreen />)
    expect(await screen.findByText('Chào thầy Học')).toBeTruthy()
  })
  it('lần đầu MẤT MẠNG ⇒ bản 3 ngay (không trắng); nhịp kế lệnh sống trả lời được ⇒ CHUYỂN sang sàn', async () => {
    dongHoGia()
    nap.song = () => { throw new TypeError('mất mạng') }
    const { container } = render(<HomNayScreen />)
    await yen()
    expect(laV3(container)).toBeTruthy()
    nap.song = () => ok(thanSong())
    await yen(NHIP_HOI_SAN_MS + 200)
    expect(laSan(container)).toBeTruthy()
    expect(laV3(container)).toBeNull()
  })
  it('đang xem sàn, một lần hỏi sau đó MẤT MẠNG ⇒ GIỮ số sống đã có (không nhảy về bản 3); cờ bị tắt giữa chừng ⇒ về bản 3', async () => {
    dongHoGia()
    const { container } = render(<HomNayScreen />)
    await yen()
    expect(laSan(container)).toBeTruthy()
    nap.song = () => { throw new TypeError('mất mạng') }
    await yen(NHIP_HOI_SAN_MS + 200)
    expect(laSan(container)).toBeTruthy()
    nap.song = () => ok({ ok: false, lyDo: 'tat' })
    await yen(LUI_HUT_DAU_MS + 200) // hụt một lần ⇒ vòng LÙI 30 giây (kế hoạch giờ cao điểm), không phải 10 giây
    expect(laSan(container)).toBeNull()
    expect(laV3(container)).toBeTruthy()
  })
  it('hỏi lại mỗi 10 GIÂY; tab ẩn ⇒ dừng; hiện lại ⇒ hỏi NGAY; lần hỏi trước chưa xong ⇒ không chồng lệnh', async () => {
    dongHoGia()
    render(<HomNayScreen />)
    await yen()
    expect(dem('/gv/bang-tin-song')).toBe(1)
    await yen(NHIP_HOI_SAN_MS)
    expect(dem('/gv/bang-tin-song')).toBe(2)
    await yen(NHIP_HOI_SAN_MS)
    expect(dem('/gv/bang-tin-song')).toBe(3)
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    try {
      await act(async () => void document.dispatchEvent(new Event('visibilitychange')))
      await yen(NHIP_HOI_SAN_MS * 3)
      expect(dem('/gv/bang-tin-song')).toBe(3)
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
      await act(async () => void document.dispatchEvent(new Event('visibilitychange')))
      expect(dem('/gv/bang-tin-song')).toBe(4)
    } finally {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
    }
    let mo!: (t: Tra) => void
    nap.song = () => new Promise<Tra>((r) => { mo = r })
    await yen(NHIP_HOI_SAN_MS)
    const truoc = dem('/gv/bang-tin-song')
    await yen(NHIP_HOI_SAN_MS * 3) // câu trả lời chưa về ⇒ ba nhịp trôi qua không thêm lệnh
    expect(dem('/gv/bang-tin-song')).toBe(truoc)
    await act(async () => mo(ok(thanSong())))
  })
  it('MẤT KẾT NỐI: hỏi hụt ≥ 2 nhịp liền ⇒ chip "Mất kết nối · số lúc HH:MM" (giờ của số đang hiện) thay "TRỰC TIẾP"; hụt thì vòng LÙI (30 s rồi 60 s, không dồn lệnh); hỏi được lại ⇒ tự mất; 1 nhịp hụt chưa đủ', async () => {
    expect(NHIP_HUT_MAT_KET_NOI).toBe(2)
    dongHoGia()
    const { container } = render(<HomNayScreen />)
    await yen()
    expect(laSan(container)).toBeTruthy()
    const chip = () => container.querySelector('.bts-mat-ket-noi')?.textContent ?? null
    expect(chip()).toBeNull()
    expect(container.textContent).toContain('TRỰC TIẾP')
    nap.song = () => { throw new TypeError('mất mạng') }
    await yen(NHIP_HOI_SAN_MS + 200)
    expect(chip()).toBeNull() // mới hụt 1 nhịp
    expect(container.textContent).toContain('TRỰC TIẾP')
    const truoc = dem('/gv/bang-tin-song')
    await yen(NHIP_HOI_SAN_MS * 2) // đang lùi: 20 giây sau vẫn KHÔNG có lệnh mới (nhịp kế là 30 giây, không phải 10)
    expect(dem('/gv/bang-tin-song')).toBe(truoc)
    await yen(NHIP_HOI_SAN_MS + 200) // đủ 30 giây ⇒ hụt thứ hai
    expect(chip()).toBe('Mất kết nối · số lúc 15:28') // serverNow của số cuối = 08:28:36Z = 15:28 giờ VN
    expect(container.textContent).not.toContain('TRỰC TIẾP')
    expect(laSan(container)).toBeTruthy() // vẫn giữ số
    nap.song = () => ok(thanSong())
    await yen(LUI_HUT_HAI_MS + 200) // hụt hai lần ⇒ lùi 60 giây, rồi hỏi được
    expect(chip()).toBeNull()
    expect(container.textContent).toContain('TRỰC TIẾP')
    // hụt rải rác (không liền nhau) không đủ 2
    nap.song = () => { throw new TypeError('mất mạng') }
    await yen(NHIP_HOI_SAN_MS + 200)
    nap.song = () => ok(thanSong())
    await yen(LUI_HUT_DAU_MS + 200) // hỏi được lại ⇒ số hụt liền về 0, nhịp về 10 giây
    nap.song = () => { throw new TypeError('mất mạng') }
    await yen(NHIP_HOI_SAN_MS + 200)
    expect(chip()).toBeNull()
  })
  it('CHIP "Máy chủ: …": tốt ⇒ chip tốt; lấy MAX 3 lượt gần nhất (1 lượt bận ⇒ "đang bận"; cần 3 lượt liền tốt mới về "tốt"); nghẽn ⇒ "nghẽn"', async () => {
    dongHoGia()
    nap.suc = () => ok({ ok: true, muc: 'tot', heSo: 1 })
    const { container } = render(<HomNayScreen />)
    await yen()
    const chip = () => container.querySelector('[data-khoi="suc-khoe-may"]')?.textContent ?? null
    expect(chip()).toBe('Máy chủ: tốt')
    nap.suc = () => ok({ ok: true, muc: 'ban', heSo: 2 })
    await yen(NHIP_SUC_KHOE_MS)
    expect(chip()).toBe('Máy chủ: đang bận')
    nap.suc = () => ok({ ok: true, muc: 'tot', heSo: 1 })
    await yen(NHIP_SUC_KHOE_MS) // [tốt, bận, tốt]
    expect(chip()).toBe('Máy chủ: đang bận')
    await yen(NHIP_SUC_KHOE_MS) // [bận, tốt, tốt]
    expect(chip()).toBe('Máy chủ: đang bận')
    await yen(NHIP_SUC_KHOE_MS) // [tốt, tốt, tốt]
    expect(chip()).toBe('Máy chủ: tốt')
    nap.suc = () => ok({ ok: true, muc: 'nghen', heSo: 4 })
    await yen(NHIP_SUC_KHOE_MS)
    expect(chip()).toBe('Máy chủ: nghẽn')
  })
  it('CHIP: máy chủ CHƯA có lệnh sức khoẻ (404) ⇒ không chip, 5 phút sau mới hỏi lại; thân sai dạng ⇒ không chip; hụt mạng ⇒ GIỮ chip đang có', async () => {
    dongHoGia()
    nap.suc = () => kho
    const { container } = render(<HomNayScreen />)
    await yen()
    const chip = () => container.querySelector('[data-khoi="suc-khoe-may"]')
    expect(chip()).toBeNull()
    expect(dem('/gv/suc-khoe-may-chu')).toBe(1)
    await yen(NHIP_SUC_KHOE_MS * 6)
    expect(dem('/gv/suc-khoe-may-chu')).toBe(1) // đang nghỉ 5 phút, không đập vào lệnh chưa có
    nap.suc = () => ok({ ok: true, muc: 'tot' })
    await yen(THU_LAI_CHIP_SAU_KHI_TU_CHOI_MS)
    expect(chip()?.textContent).toBe('Máy chủ: tốt')
    nap.suc = () => { throw new TypeError('mất mạng') }
    await yen(NHIP_SUC_KHOE_MS + 200)
    expect(chip()?.textContent).toBe('Máy chủ: tốt') // hụt mạng: giữ
    nap.suc = () => ok({ ok: true, muc: 'la-la' })
    await yen(LUI_HUT_DAU_MS + 200) // vòng đang lùi 30 s sau hụt
    expect(chip()).toBeNull() // sai dạng ⇒ ẩn (không bịa)
  })
  it('CHIP: sàn chưa có lệnh (rơi về bản 3) ⇒ KHÔNG gọi lệnh sức khoẻ; tab ẩn ⇒ chip cũng dừng hỏi', async () => {
    dongHoGia()
    nap.song = null
    render(<HomNayScreen />)
    await yen()
    await yen(NHIP_SUC_KHOE_MS * 3)
    expect(dem('/gv/suc-khoe-may-chu')).toBe(0)
    cleanup()
    nap.song = () => ok(thanSong())
    render(<HomNayScreen />)
    await yen()
    expect(dem('/gv/suc-khoe-may-chu')).toBe(1)
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    try {
      await act(async () => void document.dispatchEvent(new Event('visibilitychange')))
      await yen(NHIP_SUC_KHOE_MS * 4)
      expect(dem('/gv/suc-khoe-may-chu')).toBe(1)
    } finally {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
    }
  })
  it('MÁY CHỦ ĐỀ NGHỊ GIÃN (header x-nhip-de-nghi): hệ số 2 ⇒ Bảng tin sàn hỏi mỗi 20 s; hệ số 4 ⇒ 30 s (TRẦN của sàn, không phải 40 s); hệ số 1 ⇒ về 10 s', async () => {
    dongHoGia()
    const hoi = async (ms: number) => { const t = dem('/gv/bang-tin-song'); await yen(ms); return dem('/gv/bang-tin-song') - t }
    render(<HomNayScreen />)
    await yen()
    for (let i = 0; i < 3; i++) ghiHeSo(2)
    await yen(NHIP_HOI_SAN_MS) // lượt đã hẹn 10 s từ trước — còn theo hệ số cũ
    expect(await hoi(NHIP_HOI_SAN_MS + 1_000)).toBe(0) // từ nay 20 s
    expect(await hoi(NHIP_HOI_SAN_MS)).toBe(1)
    for (let i = 0; i < 3; i++) ghiHeSo(4)
    expect(await hoi(NHIP_HOI_SAN_MS * 2)).toBe(1) // lượt kế còn hẹn theo hệ số 2 (20 s)…
    expect(await hoi(NHIP_HOI_SAN_MS * 2 + 5_000)).toBe(0) // …rồi 30 s (trần), không phải 40 s
    expect(await hoi(5_000)).toBe(1)
    datLaiHeSo()
    for (let i = 0; i < 3; i++) ghiHeSo(1)
    await yen(NHIP_HOI_SAN_MS * 3)
    expect(await hoi(NHIP_HOI_SAN_MS + 500)).toBeGreaterThanOrEqual(1) // hệ số 1 ⇒ nhịp gốc 10 s
  })
  it('tên gọi ngắn: HAI CHỮ CUỐI, không "…"; hai em trùng tên gọi ⇒ thêm chữ đứng trước; cùng một em hai lần không tính trùng; một chữ / rỗng không vỡ', () => {
    const t = (...ds: [string, string][]) => tenGoiKhongTrung(ds.map(([sbd, hoTen]) => ({ sbd, hoTen })))
    expect(t(['1', 'Nguyễn Thị Thanh Thảo']).get('1')).toBe('Thanh Thảo')
    const trung = t(['1', 'Nguyễn Thanh Thảo'], ['2', 'Trần Thanh Thảo'], ['3', 'Lê Minh Anh'])
    expect(trung.get('1')).toBe('Nguyễn Thanh Thảo')
    expect(trung.get('2')).toBe('Trần Thanh Thảo')
    expect(trung.get('3')).toBe('Minh Anh') // em không trùng giữ hai chữ
    expect(t(['1', 'Nguyễn Thanh Thảo'], ['1', 'Nguyễn Thanh Thảo']).get('1')).toBe('Thanh Thảo') // cùng em (Dẫn đầu + Tiến bộ nhất)
    expect(t(['1', 'Thảo']).get('1')).toBe('Thảo')
    expect(t(['1', '   ']).get('1')).toBe('')
    expect(t(['1', 'Lê Văn An'], ['2', 'Lê Văn An']).get('1')).toBe('Lê Văn An') // trùng cả họ tên: hết chữ để thêm, không lặp vô hạn
    expect(t(['1', 'Nguyễn Văn An'], ['2', 'văn an']).get('2')).toBe('văn an') // trùng không phân biệt hoa thường ⇒ hết chữ thêm
  })
  it('Dẫn đầu: tên dài hiện HAI CHỮ CUỐI, không có "…"; hai em trùng tên gọi ⇒ ba chữ', () => {
    const e = (sbd: string, hoTen: string, soCau: number) => ({ sbd, hoTen, tenLop: 'Lớp A', soCau, tienBo: 3 })
    const { container } = render(<DanDau danDau={[e('1', 'Nguyễn Thị Thanh Thảo', 60), e('2', 'Trần Minh Khôi', 50), e('3', 'Lê Thanh Thảo', 40)]} bt={null} onMoEm={() => {}} />)
    const ten = [...container.querySelectorAll('.bts-dd-ten')].map((x) => x.textContent!.replace(/·.*$/, '').trim())
    expect(ten).toEqual(['Thị Thanh Thảo', 'Minh Khôi', 'Lê Thanh Thảo']) // #1 và #3 cùng "Thanh Thảo" ⇒ mỗi em thêm một chữ đứng trước
    expect(container.textContent).not.toContain('…')
  })
  it('THREE nạp LƯỜI và KHÔNG precache: chỉ ban-do-3d-three.ts import "three"; BanDo3D nạp động; vite.config.ts bỏ **/ban-do-3d-three-*.js khỏi precache (máy học sinh không cất 536 KB)', () => {
    const importThree: string[] = []
    const duyet = (d: string) => {
      for (const e of fs.readdirSync(path.join(process.cwd(), d), { withFileTypes: true })) {
        const p = `${d}/${e.name}`
        if (e.isDirectory()) { if (e.name !== 'graphify-out' && e.name !== 'node_modules') duyet(p) }
        else if (/\.(ts|tsx)$/.test(e.name) && /(^|\n)\s*import[^\n]*from ['"]three(\/[^'"]*)?['"]/.test(doc(p))) importThree.push(p)
      }
    }
    duyet('src')
    // Spirit3D (Code 5) cũng dùng three — chunk riêng đã có trong globIgnores; ở đây chỉ khoá Bảng tin sàn không kéo three vào gói chính
    expect(importThree.filter((p) => p.startsWith('src/components/bang-tin-san/') || p.startsWith('src/lib/bang-tin-san/'))).toEqual(['src/components/bang-tin-san/ban-do-3d-three.ts'])
    expect(doc('src/components/bang-tin-san/BanDo3D.tsx')).toMatch(/import\('\.\/ban-do-3d-three'\)/)
    expect(doc('src/components/bang-tin-san/BanDo3D.tsx')).not.toMatch(/^import (?!type)[^\n]*from '\.\/ban-do-3d-three'/m) // chỉ được `import type`
    expect(doc('vite.config.ts')).toMatch(/'\*\*\/ban-do-3d-three-\*\.js'/)
  })
  it('nguồn: HomNayScreen nối sàn qua useSanSong; bản 3 giữ nguyên trong HomNayBan3; nút Sáng/Tối dùng chế độ sẵn có (useGiaoDien), không lưu riêng', () => {
    const man = doc('src/screens/HomNayScreen.tsx')
    expect(man).toMatch(/useSanSong\(\)/)
    expect(man).toMatch(/function HomNayBan3\(\)/)
    expect(man).toMatch(/BangTinSanCoChip du=\{san\.du\} onMoEm=\{moToanCanh\}/)
    expect(man).toMatch(/<BangTinSan du=\{du\} onMoEm=\{onMoEm\} matKetNoi=\{matKetNoi\} sucKhoe=\{sucKhoe\} \/>/) // chip chỉ ở sàn
    expect(doc('src/components/bang-tin-san/ThanhTren.tsx')).toMatch(/useGiaoDien/)
    expect(doc('src/components/bang-tin-san/use-san-song.ts')).not.toMatch(/localStorage|sessionStorage/)
  })
})
