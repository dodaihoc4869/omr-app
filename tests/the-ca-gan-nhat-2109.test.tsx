// THẺ "CA KIỂM TRA GẦN NHẤT CỦA CON" ở đầu Bảng nhiệm vụ phụ huynh (thầy lệnh 21/09; mẫu ph-3, Boss soát ĐẠT). Luật công bố đứng đầu: ca chưa công bố ⇒ thẻ trung tính, KHÔNG điểm/số câu/phần.
// GỌN MÃ 06/10 (lần 2, docs/gon-ma-0610-lan-2.md): thẻ vẽ `TheCaGanNhatCua` (xem-diem/TheCaGanNhat.tsx) — "lô dọn" ghi ở docs/ph-toi-gian-2109.md — đã xoá; đã gỡ khối "vẽ thẻ" + `it` soi nguồn tệp ấy. Còn hàm thuần `chonTheCaGanNhat` (lib, đang dùng) + `it` soi BangNhiemVu.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, configure } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import ParentPortalScreen from '../src/screens/ParentPortalScreen'
import { chonTheCaGanNhat, tenCaThe, type CaChuaCongBo, type CaDaCongBo } from '../src/lib/the-ca-gan-nhat'

configure({ asyncUtilTimeout: 8000 })
const mocks = vi.hoisted(() => ({ ls: { ok: true, items: [] as any[], chuaCongBo: [] as any[] } }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: () => null }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrl: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({
  ...(await original<any>()),
  tenTheoSbd: async () => ({ sbd: '12121212', hoTen: 'Đỗ Minh', lop: '12A1', tenCa: '' }),
  hsLichSuCaApi: async () => mocks.ls,
  hsCauSaiApi: async () => ({ ok: true, items: [] }),
  hsBtvnApi: async () => ({ ok: true, items: [] }),
}))
vi.mock('../src/lib/mom-api', async (original) => ({ ...(await original<any>()), migrateMom: async () => {}, momApi: async () => ({ ok: true, items: [] }) }))

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const CA_MOI: CaDaCongBo = { maCa: 'CA-2', tenCa: 'Kiểm tra 45 phút · Ester – lipid', nopLuc: '2026-09-19T02:12:00Z', tong: 7.5, diemI: 3.75, diemII: 2.75, diemIII: 1, soCauDung: 21, tongCau: 28 }
const CA_CU: CaDaCongBo = { maCa: 'CA-1', tenCa: 'Kiểm tra 60 phút · Ancol – phenol', nopLuc: '2026-09-12T02:12:00Z', tong: 6.75, diemI: 3, diemII: 2.5, diemIII: 1.25, soCauDung: 27, tongCau: 40 }
const CHUA_LOP: CaChuaCongBo = { maCa: 'CA-3', tenCa: 'Kiểm tra 20 phút · Amin', nopLuc: '2026-09-20T03:00:00Z', congBo: 'ca_lop_xong', soEmDaNop: 27, soEmDaVao: 32 }
const CHUA_KHONG: CaChuaCongBo = { maCa: 'CA-4', tenCa: 'Kiểm tra 10 phút · Polime', nopLuc: '2026-09-20T04:00:00Z', congBo: 'khong', soEmDaNop: 1, soEmDaVao: 32 }

beforeEach(() => {
  mocks.ls = { ok: true, items: [], chuaCongBo: [] }
  window.history.replaceState(null, '', '/?vai=phuhuynh')
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, items: [], winners: [] }), text: async () => '{}' })))
})
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
  window.history.replaceState(null, '', '/')
})

describe('chonTheCaGanNhat — chọn ca + luật công bố (thuần)', () => {
  it('không ca nào ⇒ null (không vẽ thẻ)', () => {
    expect(chonTheCaGanNhat([], [])).toBeNull()
  })

  it('chỉ ca đã công bố: chọn ca nộp MUỘN NHẤT; so với lần trước CỦA CHÍNH CON (+0,75 so với 6,75); số câu, ba phần', () => {
    const t = chonTheCaGanNhat([CA_CU, CA_MOI], [])!
    expect(t.kieu).toBe('da_cong_bo')
    if (t.kieu !== 'da_cong_bo') return
    expect(t).toMatchObject({ maCa: 'CA-2', tenCa: 'Kiểm tra 45 phút · Ester – lipid', diem: 7.5, dung: 21, tong: 28 })
    expect(t.ss).toEqual({ hieu: 0.75, truoc: 6.75 })
    expect(t.phan).toEqual([{ ma: 'I', ten: 'Phần I', diem: 3.75 }, { ma: 'II', ten: 'Phần II', diem: 2.75 }, { ma: 'III', ten: 'Phần III', diem: 1 }])
  })

  it('ca đầu tiên (không có ca công bố nào trước, cũng không ca chưa công bố nào trước) ⇒ ss = null ("chưa có lần trước")', () => {
    const t = chonTheCaGanNhat([CA_CU], [])!
    expect(t.kieu === 'da_cong_bo' && t.ss).toBeNull()
  })

  it('có ca CHƯA công bố nộp TRƯỚC ca này mà chưa có ca công bố trước ⇒ ẨN chip (không dám nói "ca đầu tiên")', () => {
    const t = chonTheCaGanNhat([CA_MOI], [{ ...CHUA_LOP, nopLuc: '2026-09-10T03:00:00Z' }])!
    expect(t.kieu).toBe('da_cong_bo')
    expect(t.kieu === 'da_cong_bo' && t.ss).toBeUndefined()
  })

  it('LUẬT CÔNG BỐ: ca chưa công bố nộp MUỘN HƠN ⇒ thẻ trung tính, KHÔNG điểm/số câu/phần của bất kỳ ca nào; chờ cả lớp ⇒ ca_lop + 27/32; thầy chưa công bố ⇒ khong', () => {
    const a = chonTheCaGanNhat([CA_CU, CA_MOI], [CHUA_LOP])!
    expect(a).toEqual({ kieu: 'ca_lop', maCa: 'CA-3', tenCa: 'Kiểm tra 20 phút · Amin', nopLuc: CHUA_LOP.nopLuc, nop: 27, si: 32 })
    const b = chonTheCaGanNhat([CA_CU, CA_MOI], [CHUA_LOP, CHUA_KHONG])!
    expect(b.kieu).toBe('khong') // CA-4 nộp muộn nhất
    for (const t of [a, b]) {
      expect(Object.keys(t).sort()).toEqual(['kieu', 'maCa', 'nop', 'nopLuc', 'si', 'tenCa'])
      expect(JSON.stringify(t)).not.toMatch(/7[.,]5|6[.,]75|diem|dung|phan/)
    }
  })

  it('ca chưa công bố CŨ HƠN ca đã công bố ⇒ vẫn thẻ điểm của ca mới nhất đã công bố', () => {
    const t = chonTheCaGanNhat([CA_MOI], [{ ...CHUA_KHONG, nopLuc: '2026-09-01T00:00:00Z' }])!
    expect(t.kieu).toBe('da_cong_bo')
  })

  it('chỉ nói SỐ THẬT: thiếu phần/điểm phần ⇒ bỏ; số câu không hợp lệ (đúng > tổng, tổng 0, thiếu) ⇒ ẩn dòng; điểm tổng thiếu ⇒ không thẻ (không đoán)', () => {
    const t = chonTheCaGanNhat([{ ...CA_MOI, diemI: null, diemII: undefined, diemIII: 1 }], [])!
    expect(t.kieu === 'da_cong_bo' && t.phan).toEqual([{ ma: 'III', ten: 'Phần III', diem: 1 }])
    for (const xau of [{ soCauDung: 30, tongCau: 28 }, { soCauDung: 5, tongCau: 0 }, { soCauDung: null, tongCau: 28 }, { soCauDung: -1, tongCau: 28 }]) {
      const u = chonTheCaGanNhat([{ ...CA_MOI, ...xau }], [])!
      expect(u.kieu === 'da_cong_bo' && [u.dung, u.tong]).toEqual([null, null])
    }
    expect(chonTheCaGanNhat([{ ...CA_MOI, tong: null }], [])).toBeNull()
  })

  it('mốc giờ hỏng/thiếu không làm hỏng việc chọn; hoà mốc ⇒ ưu tiên ca đã công bố; tên ca thiếu ⇒ "Ca kiểm tra mã <mã>"', () => {
    expect(chonTheCaGanNhat([{ ...CA_MOI, nopLuc: 'hỏng' }], [CHUA_LOP])!.kieu).toBe('ca_lop') // ca hợp lệ thắng ca mốc hỏng
    expect(chonTheCaGanNhat([CA_MOI], [{ ...CHUA_KHONG, nopLuc: CA_MOI.nopLuc }])!.kieu).toBe('da_cong_bo')
    expect(tenCaThe('CA-9', '')).toBe('Ca kiểm tra mã CA-9')
    expect(tenCaThe('CA-9', 'Ca CA-9')).toBe('Ca kiểm tra mã CA-9') // máy chủ điền "Ca <mã>" khi thiếu tên
    expect(tenCaThe('CA-9', 'Kiểm tra Este')).toBe('Kiểm tra Este')
  })
})

// ĐÃ GỠ 21/09 (app phụ huynh MỚI): describe "Bảng nhiệm vụ phụ huynh — thẻ ở ĐẦU…" (3 test trên ParentPortalScreen). Thẻ ca gần nhất của màn chính mới + bảng khoá ở tests/ph-moi-man-2109.test.tsx.
// GỌN MÃ 06/10 (lần 2): `TheCaGanNhatCua` đã xoá (xem ghi chú đầu tệp).

describe('khoá nguồn', () => {
  it('CardCaThiGanNhat.tsx mồ côi ĐÃ XOÁ; thẻ mới chỉ nằm ở vai phụ huynh (`laPh && theCaGanNhat`) và đứng sau khối tiến độ', () => {
    expect(fs.existsSync(path.join(process.cwd(), 'src/components/CardCaThiGanNhat.tsx'))).toBe(false)
    const b = doc('src/components/bang-nhiem-vu/BangNhiemVu.tsx')
    expect(b).toContain('{laPh && theCaGanNhat}')
    expect(b.indexOf('data-vung="tien-do"')).toBeLessThan(b.indexOf('{laPh && theCaGanNhat}'))
    expect(b.indexOf('{laPh && theCaGanNhat}')).toBeLessThan(b.indexOf('{duLieu.trong ? (')) // (thẻ Thử thách riêng đã gỡ 28/09)
  })
})
