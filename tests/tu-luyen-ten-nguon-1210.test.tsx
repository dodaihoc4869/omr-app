// TU LUYỆN · TÊN NGUỒN (12/10) — thầy: "thay những từ đảo, đoàn, bia bằng những từ phù hợp". Khoá:
//   · ô chọn nguồn câu sai dùng ĐÚNG bộ tên của Câu đã làm (NHAN_NGUON_LAN — một khái niệm một từ), mã gửi máy chủ giữ nguyên;
//   · mọi chữ Tu luyện hiện ra (thẻ chọn, nguồn, dòng "Sai gốc" máy chủ viết sẵn) không còn Bát Linh Đảo / Đoàn Hộ Tống / Bi-a;
//   · biểu tượng ba nguồn ấy không còn hình trò chơi (đảo-cây, khiên, bi);
//   · không phông Baloo trong Tu luyện (trùng tu theo ngôn ngữ Hôm nay).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import ManTuLuyen from '../src/components/tu-luyen/ManTuLuyen'
import { DS_NGUON } from '../src/components/tu-luyen/nguon-cau-sai'
import { NHAN_NGUON_LAN, doiTenNguonCu } from '../src/lib/nhan-nguon-lan'
import { NHAN_NGUON_LAN as NHAN_HOA2 } from '../src/components/hoa2/api'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }), xongNapDiaChi: async () => {} }))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
  try { localStorage.clear() } catch { /* bỏ qua */ }
})

const KHO = {
  tong: 5, tuCa: 3, tuChienDich: 2, tuLuyenDe: 0, tuTuLuyen: 0, loi: '', tongTuMoc: 6, daKhacPhuc: 1, toiHan: 0, choHen: 0,
  theoNguon: { ca: 3, dao: 2, doan: 1, bia: 1, tu_luyen: 0, luyen_de: 0 },
  theoMat: { 1: 2, 3: 1, 4: 1, 8: 1 },
}
const CAU = [{ qid: 'q1', phan: 'I', text: 'Câu một', luaChon: ['A', 'B', 'C', 'D'], tenDang: 'Ester', sao: 0, loai: 'ly_thuyet', nhanLuyen: 'Luyện lần đầu', saiGoc: 'Sai gốc: Bi-a · 30/09 và 1 lần khác ở Bát Linh Đảo' }]
function giaLap() {
  vi.stubGlobal('matchMedia', (m: string) => ({ matches: false, media: m, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }))
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const u = new URL(String(url)).pathname
    const ok = (b: unknown) => ({ ok: true, status: 200, json: async () => b })
    if (u === '/hs/tu-luyen/nguon') return ok({ ok: true, cacCa: [], soCauSai: 5, danhMuc: [], dangThi: false, khoCauSai: KHO, dangCauSai: { kieu: 'cau_sai', nhan: 'Theo câu sai của em' }, tuDo: { kieu: 'cau_sai', nhan: 'Theo câu sai của em' }, dangNenLuyen: null })
    if (u === '/hs/tu-luyen/tong-hop') return ok({ ok: true, luot: [], cau: [], luyenDe: [], khacPhuc: null })
    if (u === '/hs/tu-luyen/rut') return ok({ ok: true, luotId: 'tl_1', cheDo: 1, tieuDe: 'Sửa câu sai · 1 câu', taoLuc: Date.now(), cau: CAU })
    if (u === '/luyen-de/dieu-kien') return ok({ ok: true, trangThai: 'mo', lyDo: '', items: [] })
    return ok({ ok: true })
  }))
}
const GAME = /Bát Linh|Đảo|Đoàn Hộ|Đoàn|Bi-a/

describe('Tu luyện dùng tên nguồn chuẩn', () => {
  it('bộ tên nguồn = bộ tên Câu đã làm; mã nguồn và thứ tự không đổi', () => {
    expect(NHAN_HOA2).toBe(NHAN_NGUON_LAN)
    expect(DS_NGUON.map((n) => n.ma)).toEqual(['ca', 'dao', 'doan', 'bia', 'tu_luyen', 'luyen_de'])
    expect(DS_NGUON.map((n) => n.ten)).toEqual([NHAN_NGUON_LAN.thi, NHAN_NGUON_LAN.dao, NHAN_NGUON_LAN.doan, NHAN_NGUON_LAN.bia, 'Tu luyện', 'Luyện đề cấu trúc'])
    for (const n of DS_NGUON) expect(n.ten).not.toMatch(GAME)
  })

  it('chữ máy chủ viết sẵn đổi sang tên chuẩn, chữ khác giữ nguyên', () => {
    expect(doiTenNguonCu('Sai gốc: Chiến dịch Ôn ester · Đoàn Hộ Tống · 30/09')).toBe('Sai gốc: Chiến dịch Ôn ester · Ôn theo kế hoạch · 30/09')
    expect(doiTenNguonCu('Sai gốc: Bi-a Phản Ứng · 29/09')).toBe('Sai gốc: Luyện tập trước đây · 29/09')
    expect(doiTenNguonCu('Sai gốc: Bi-a · 30/09 và 1 lần khác ở Bát Linh Đảo')).toBe('Sai gốc: Luyện tập trước đây · 30/09 và 1 lần khác ở Học theo kế hoạch')
    expect(doiTenNguonCu('Ca kiểm tra Ester · 29/09')).toBe('Ca kiểm tra Ester · 29/09')
  })

  it('màn chọn + chế độ Sửa câu sai + màn làm: không còn chữ Đảo / Đoàn / Bi-a', async () => {
    giaLap()
    render(<ManTuLuyen token="t" sbd="S1" onVe={() => {}} />)
    fireEvent.click(await screen.findByRole('radio', { name: /Sửa câu sai/ }))
    await screen.findByRole('group', { name: 'Nguồn câu sai' })
    for (const ten of ['Học theo kế hoạch', 'Ôn theo kế hoạch', 'Luyện tập trước đây']) expect(screen.getByRole('checkbox', { name: new RegExp(ten) })).toBeTruthy()
    expect(document.body.textContent).not.toMatch(GAME)
    fireEvent.click(screen.getByRole('button', { name: /^Luyện \d+ câu sai$/ }))
    expect(await screen.findByText('Sai gốc: Luyện tập trước đây · 30/09 và 1 lần khác ở Học theo kế hoạch')).toBeTruthy()
    expect(document.body.textContent).not.toMatch(GAME)
  })

  it('biểu tượng nguồn không hình trò chơi; Tu luyện không nạp phông Baloo', () => {
    const icon = readFileSync('src/components/tu-luyen/ChonNguonSai.tsx', 'utf8')
    // hình cũ: đảo + hai lá cây, khiên có dấu tick, hai vòng tròn bi
    expect(icon).not.toContain('M3 19c3-2 6-2 9 0s6 2 9 0')
    expect(icon).not.toContain('M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z')
    expect(icon).not.toContain('<circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" />')
    const man = readFileSync('src/components/tu-luyen/ManTuLuyen.tsx', 'utf8')
    expect(man).not.toMatch(/phong-baloo|className="[^"]*\bbaloo\b/)
    const css = readFileSync('src/components/tu-luyen/tu-luyen-hs.css', 'utf8')
    expect(css).toMatch(/body\[data-hoc-tap=hs\] \.tlu :is\(\.baloo,/)
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/)
  })
})
