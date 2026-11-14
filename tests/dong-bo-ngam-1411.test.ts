// THẦY 14/11: «đề trên app gv thì là 3% còn app hs là 1%» (DH-11-C2-B9-D1 câu 10, kho máy chủ đã tự sửa 29/09 cho khớp đáp án B 30,99 m³).
// GỐC: kho đề trên MÁY THẦY chỉ làm mới khi mở Ngân hàng đề / Mở ca ⇒ bảng Live / Dạy học chiếu bản cũ. SỬA: đồng bộ NGẦM (src/lib/dong-bo-ngam.ts):
//  · tải đề đổi về máy thầy (bản «1%» thay bản «3%»), báo các màn đọc lại kho;
//  · KHÔNG đụng ca đã mở lúc ngầm (có thể đang thi) — ghi chờ, lần thầy chủ động đồng bộ mới đẩy sang ca.
import { beforeEach, describe, expect, it, vi } from 'vitest'

const may = vi.hoisted(() => ({
  local: new Map<string, Record<string, unknown>>(),
  capNhatKey: [] as string[],
}))

const deKho = (pt: string) => ({
  ma_de: 'DH-11-C2-B9-D1', nguon: 'Ôn bài 9', ngay_nap: '2026-09-29', nhom: '11 · DẠY HỌC/C2 - Nitrogen và Sulfur',
  cau: [{ phan: 'I', so: 10, de: `Cần tối đa bao nhiêu m³ H₂S (ở đkc) để loại bỏ SO₂ sinh ra khi đốt cháy 2,0 tấn than chứa sulfur chiếm ${pt} theo khối lượng?`, pa: { A: '23,24 m³.', B: '30,99 m³.', C: '46,48 m³.', D: '34,86 m³.' }, dap_an: 'B', chuyen_de: 'Nitrogen – sulfur', muc_do: 'van_dung' }],
})

vi.mock('../src/lib/exam-api', () => ({
  danhSachDe: async () => [{ maDe: 'DH-11-C2-B9-D1', tenDe: '', lop: '11', chuyenDe: '', soCau: 1, ngayNap: '2026-09-29', nguon: 'Ôn bài 9', capNhatLuc: '2026-09-29T14:20:00Z' }],
  layDe: async () => deKho('1%'),
  danhSachCa: async () => [{ maCa: 'CA1' }],
  capNhatKeyBank: async (_u: string, _s: string, maCa: string) => { may.capNhatKey.push(maCa) },
}))
vi.mock('../src/lib/exam-db', () => ({
  loadExamSources: async () => [...may.local.values()],
  saveExamSource: async (s: Record<string, unknown>) => { may.local.set(String(s.maDe), s) },
  deleteExamSource: async (m: string) => { may.local.delete(m) },
  loadSoSuaDang: async () => ({}),
  loadAllSessionTeacherBanks: async () => [{ maCa: 'CA1', sources: [{ maDe: 'DH-11-C2-B9-D1', phanI: [], phanII: [], phanIII: [] }] }],
  saveSessionTeacherBank: async () => {},
  xoaSessionTeacherBank: async () => {},
  loadTeacherSecret: async () => 'mat',
  loadScriptUrlHoacMacDinh: async () => 'https://may-chu.thu',
}))

const textCau10 = () => String(((may.local.get('DH-11-C2-B9-D1')?.phanI as { text: string }[] | undefined) ?? [])[0]?.text ?? '')

describe('đồng bộ ngầm kho máy thầy (14/11)', () => {
  beforeEach(async () => {
    localStorage.clear()
    may.capNhatKey.length = 0
    may.local.clear()
    // Máy thầy đang giữ bản CŨ (3%), tải trước đợt tự sửa kho (chưa có mốc capNhatKho).
    const { buildTeacherSourceFromKhoDe } = await import('../src/lib/exam-kho-de-import')
    const cu = buildTeacherSourceFromKhoDe(deKho('3%') as never).source as unknown as Record<string, unknown>
    may.local.set('DH-11-C2-B9-D1', cu)
  })

  it('ngầm: bản «1%» của máy chủ thay bản «3%» trên máy thầy; KHÔNG đẩy sang ca đã mở, ghi chờ', async () => {
    expect(textCau10()).toContain('3%')
    const { dongBoNganHang } = await import('../src/lib/exam-sync')
    const kq = await dongBoNganHang('https://may-chu.thu', 'mat', false, { ngam: true })
    expect(kq.capNhat).toEqual(['DH-11-C2-B9-D1'])
    expect(textCau10()).toContain('1%')
    expect(may.capNhatKey).toEqual([])
    expect(JSON.parse(localStorage.getItem('ddh.caChoCapNhatDe') || '[]')).toEqual(['DH-11-C2-B9-D1'])
  })

  it('lần thầy chủ động đồng bộ (Mở ca / Ngân hàng đề) mới đẩy đề đã đổi sang ca đã mở, rồi xoá chờ', async () => {
    const { dongBoNganHang } = await import('../src/lib/exam-sync')
    await dongBoNganHang('https://may-chu.thu', 'mat', false, { ngam: true })
    const kq = await dongBoNganHang('https://may-chu.thu', 'mat')
    expect(kq.capNhat).toEqual([]) // máy đã có bản mới
    expect(may.capNhatKey).toEqual(['CA1'])
    expect(localStorage.getItem('ddh.caChoCapNhatDe')).toBeNull()
  })

  it('dongBoNgam: có đề đổi ⇒ báo các màn đang giữ kho; lượt gọi dồn trong 5 phút bị bỏ qua', async () => {
    const { dongBoNgam, khiKhoDoi } = await import('../src/lib/dong-bo-ngam')
    const bao = vi.fn()
    const go = khiKhoDoi(bao)
    expect(await dongBoNgam(true)).toBe(1)
    expect(bao).toHaveBeenCalledTimes(1)
    expect(await dongBoNgam()).toBe(0)
    go()
    expect(textCau10()).toContain('1%')
  })
})
