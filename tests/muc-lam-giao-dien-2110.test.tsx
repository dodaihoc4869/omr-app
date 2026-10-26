// MỨC LÀM 1–4 TRONG TẤM "HỒ SƠ LÀM BÀI" (thầy 21/10) — giao diện ba chế độ (thầy · học sinh · phụ huynh), đọc hợp đồng, ba trạng thái (có số đo · chưa có số đo · lớp chưa đủ mẫu).
// Dữ liệu: scripts/chup-v2/gia/lich-su-muc-lam.ts — mức của từng lượt do CHÍNH hàm máy chủ `mucLamCuaLuot` tính, giao diện chỉ vẽ lại, không tự xếp mức.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import HoSoLamCauEm, { type NguonHoSo } from '../src/components/chien-dich/HoSoLamCauEm'
import { chuanHoaMucLam, docMucLam, docTongMucLam, mocThuoc, TEN_MUC_EM, TEN_MUC_THAY } from '../src/components/chien-dich/muc-lam-giao-dien'
import { docLichSuLamCau } from '../src/lib/lich-su-lam-cau-api'
import { hoSoThaiDoGia } from '../scripts/chup-v2/gia/bai-hang-ngay'
import { lichSuMucGia, type TuyChonGia } from '../scripts/chup-v2/gia/lich-su-muc-lam'

const SBD = '11010'
const TD = hoSoThaiDoGia(SBD)
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const nguon = (tuy: TuyChonGia): NguonHoSo => ({
  hoSoThaiDo: async () => ({ ok: true, du: TD }),
  lichSu: async () => ({ ok: true, du: lichSuMucGia(SBD, TD.em.hoTen, tuy) }),
})
async function mo(tuy: TuyChonGia, cheDo: 'thay' | 'hoc-sinh' | 'phu-huynh') {
  render(<HoSoLamCauEm em={{ sbd: SBD, ten: TD.em.hoTen, khoi: '12' }} onDong={() => {}} nguon={nguon(tuy)} cheDo={cheDo} />)
  const tam = await screen.findByRole('dialog')
  // 26/10: học sinh không có khối Mức làm ⇒ chờ khối «Từng lượt» (tấm đã vẽ xong lịch sử)
  await waitFor(() => expect(tam.querySelector(cheDo === 'hoc-sinh' ? '#hsv-lan, .hsv-trong' : '.hslc-cl')).not.toBeNull())
  return tam
}
// 22/10 (6 mức): "Từng lượt" luôn hiện (không còn thẻ "Toàn bộ lịch sử"); khối Mức làm là «Cách làm bài · 6 mức» (thầy) / «Em làm bài thế nào» / «Cách con làm bài».
// Dữ liệu giả ở đây là máy chủ KHÔNG có `mucLam6` ⇒ khối dùng tổng `mucLam` cả sổ, Mức làm 5–6 "Chưa đo treo máy" (không đoán).
const chu = (e: Element | null) => (e?.textContent ?? '').replace(/\s+/g, ' ').trim()

describe('phép thuần', () => {
  it('ranh giới thước LẤY từ máy chủ (ranh2/3/4): không biết tỉ lệ nào; không β ⇒ không Mức làm 4; thường nhỏ ⇒ đoạn Mức làm 3 co về 0', () => {
    const k = mocThuoc({ giay: 14, ranh2: 24, ranh3: 30, ranh4: 60 })
    expect([k.bien1, k.bien2, k.bien4, k.ketMuc3]).toEqual([24, 30, 60, 60])
    expect(k.toiDa).toBe(90)
    const khongBeta = mocThuoc({ giay: 50, ranh2: 20, ranh3: 26 })
    expect(khongBeta.bien4).toBeNull()
    expect(khongBeta.toiDa).toBeGreaterThanOrEqual(56) // chấm luôn nằm trong thước
    expect(mocThuoc({ giay: 30, ranh2: 20, ranh3: 26, ranh4: 16 }).ketMuc3).toBe(26)
  })
  it('tên mức: thầy "Chưa đọc hết đề…"; học sinh / phụ huynh tả việc đã làm, không nhãn năng lực', () => {
    expect(Object.values(TEN_MUC_THAY)).toEqual(['Chưa đọc hết đề', 'Đọc xong, chưa kịp nghĩ', 'Có nghĩ', 'Làm kỹ'])
    expect(Object.values(TEN_MUC_EM)).toEqual(['Nộp trước khi đọc hết đề', 'Đọc xong thì nộp ngay', 'Có thời gian nghĩ', 'Làm kỹ, đúng nhịp lớp'])
  })
})

describe('đọc hợp đồng máy chủ', () => {
  it('giữ `mucLam` từng lượt và tổng; trường thiếu / sai kiểu ⇒ bỏ (không bịa)', () => {
    const du = JSON.parse(JSON.stringify(lichSuMucGia(SBD, 'Em A', { cheDo: 'thay' }))) as Record<string, unknown>
    const kq = chuanHoaMucLam(docLichSuLamCau(du)!) // đọc chuyển tiếp ở lớp nối, kiểm khung ở tấm
    expect(kq.lan.filter((l) => l.mucLam)).toHaveLength(7)
    expect(kq.lan[0]!.mucLam).toMatchObject({ ma: 1, giay: 14, giayDoc: 24, sanNghi: 6, thuong: 75, ranh2: 24, ranh3: 30, ranh4: 60 })
    expect(kq.mucLam).toMatchObject({ soDo: 7, chuaCoSoDo: 4, saiLamVoi: 4, saiDuNghi: 1, dungTruocDoc: 1, coBetaThat: true })
    // máy chủ cũ (không có trường) ⇒ không `mucLam`
    const cu = JSON.parse(JSON.stringify(du)) as Record<string, unknown>
    delete cu.mucLam
    for (const l of cu.lan as Record<string, unknown>[]) delete l.mucLam
    const kqCu = chuanHoaMucLam(docLichSuLamCau(cu)!)
    expect(kqCu.mucLam).toBeUndefined()
    expect(kqCu.lan.every((l) => l.mucLam === undefined)).toBe(true)
  })
  it('kiểm khung cả kết quả: lượt có mức hỏng bị bỏ mức (giữ lượt), tổng hỏng bị bỏ', () => {
    const du = JSON.parse(JSON.stringify(lichSuMucGia(SBD, 'Em A', { cheDo: 'thay' }))) as Record<string, unknown>
    ;(du.lan as { mucLam?: unknown }[])[0]!.mucLam = { ma: 9, giay: 14 }
    du.mucLam = { soDo: 1 }
    const kq = chuanHoaMucLam(docLichSuLamCau(du)!)
    expect(kq.lan).toHaveLength(11)
    expect(kq.lan[0]!.mucLam).toBeUndefined()
    expect(kq.lan.filter((l) => l.mucLam)).toHaveLength(6)
    expect(kq.mucLam).toBeUndefined()
  })
  it('mức sai khung bị bỏ: mã ngoài 1–4, giây không dương, thiếu giayDoc; tổng thiếu bốn dòng ⇒ bỏ', () => {
    expect(docMucLam({ ma: 5, giay: 10, giayDoc: 20, sanNghi: 6, ranh2: 20, ranh3: 26 })).toBeUndefined()
    expect(docMucLam({ ma: 1, giay: 0, giayDoc: 20, sanNghi: 6, ranh2: 20, ranh3: 26 })).toBeUndefined()
    expect(docMucLam({ ma: 1, giay: 10, sanNghi: 6, ranh2: 20, ranh3: 26 })).toBeUndefined()
    expect(docMucLam({ ma: 1, giay: 10, giayDoc: 20, sanNghi: 6 })).toBeUndefined() // thiếu ranh giới ⇒ không vẽ được thước ⇒ không mức
    expect(docMucLam('x')).toBeUndefined()
    expect(docMucLam({ ma: 3, giay: 40, giayDoc: 20, sanNghi: 6, ranh2: 20, ranh3: 26, thuong: -5, ghiChu: 'khac' })).toEqual({ ma: 3, giay: 40, giayDoc: 20, sanNghi: 6, ranh2: 20, ranh3: 26 })
    expect(docMucLam({ ma: 1, giay: 8, giayDoc: 25, sanNghi: 6, ranh2: 13, ranh3: 31, xapXi: true, ghiChu: 'dung_truoc_doc' })).toEqual({ ma: 1, giay: 8, giayDoc: 25, sanNghi: 6, ranh2: 13, ranh3: 31, xapXi: true, ghiChu: 'dung_truoc_doc' })
    expect(docTongMucLam({ soDo: 1, chuaCoSoDo: 0, theoMuc: [], saiLamVoi: 0, saiDuNghi: 0, dungTruocDoc: 0, coBetaThat: false })).toBeUndefined()
  })
})

describe('thầy bấm vào em: đủ Mức làm 1–4', () => {
  it('khối "Cách làm bài · 6 mức": đo được 7/11 lượt, thanh 6 mức + đoạn chưa có số đo, 6 ô đúng/sai (Mức 5–6 chưa đo treo máy), ô làm vội / đã nghĩ, ghi chú, cách tính', async () => {
    const tam = await mo({ cheDo: 'thay' }, 'thay')
    const khoi = tam.querySelector('.hslc-cl')!
    expect(chu(khoi.querySelector('.hsv-phu'))).toBe('Đo được 7/11 lượt · 4 lượt chưa có số đo · 7 lượt chưa đo treo máy.')
    expect([...khoi.querySelectorAll('.hsv-thanh i')].map((i) => [i.getAttribute('data-m') ?? (i.hasAttribute('data-chua') ? 'chua' : ''), chu(i)])).toEqual([['1', '4'], ['2', '1'], ['3', '1'], ['4', '1'], ['chua', '4']])
    const o = [...khoi.querySelectorAll('.hsv-o')].map((li) => chu(li))
    expect(o).toEqual([
      'Mức làm 1 Chưa đọc hết đề 4 lượt đúng 1 · sai 3',
      'Mức làm 2 Đọc xong, chưa kịp nghĩ 1 lượt đúng 0 · sai 1',
      'Mức làm 3 Có nghĩ 1 lượt đúng 0 · sai 1',
      'Mức làm 4 Làm kỹ 1 lượt đúng 1 · sai 0',
      'Mức làm 5 Treo máy Chưa đo treo máy',
      'Mức làm 6 Cố tình treo máy Chưa đo treo máy',
    ])
    const hai = [...khoi.querySelectorAll('.hsv-ba p')].map((p) => chu(p))
    expect(hai).toEqual(['4/5 lượt sai là lúc làm vội (Mức làm 1–2)', '1/5 lượt sai dù đã nghĩ (Mức làm 3–4)'])
    expect(chu(khoi)).toContain('chưa xếp được Mức làm 5–6 (không đoán)')
    expect(chu(khoi)).toContain('1 lượt đúng nộp trước khi đọc hết đề. Chỉ ghi chú, không tính là vội.')
    expect(chu(khoi)).not.toContain('chưa đủ mẫu') // có β thật ⇒ Mức làm 4 xếp được
    expect(within(khoi as HTMLElement).getByText('Cách tính Mức làm')).toBeTruthy()
  })

  it('lịch sử: mỗi lượt có mức ⇒ chip "Mức làm N" + tên + dòng giây · đọc hết đề + thước (chấm, vạch); lượt chưa có số đo ⇒ nhãn nét đứt, giữ số giây cũ; câu chỉ ảnh ghi "≈"', async () => {
    const tam = await mo({ cheDo: 'thay' }, 'thay')
    const luot = [...tam.querySelectorAll('.hslc-lan')]
    expect(luot).toHaveLength(11)
    const co = luot.filter((l) => l.querySelector('.hslc-muc-luot'))
    expect(co).toHaveLength(7)
    expect(chu(co[0]!.querySelector('.hslc-muc-luot-dong'))).toBe('Mức làm 1 Chưa đọc hết đề 14 giây · đọc hết đề cần 24 giây Chưa đo treo máy') // lượt cũ: nhãn nhỏ cho thầy
    expect(co[0]!.querySelector('.hslc-thuoc-m[role="img"]')!.getAttribute('aria-label')).toBe('Làm 14 giây; đọc hết đề cần 24 giây; có thời gian nghĩ từ 30 giây; làm kỹ từ 60 giây')
    expect(co[0]!.querySelector('.hslc-thuoc-m-z u')).not.toBeNull()
    expect(co[0]!.querySelector('.hslc-thuoc-m-z b')).not.toBeNull()
    expect(co[0]!.querySelectorAll('.hslc-thuoc-m-z i')).toHaveLength(4)
    expect(luot.map((l) => chu(l)).find((t) => t.includes('Câu 30'))).toContain('đọc hết đề cần ≈ 32 giây')
    // lượt ĐÚNG ở Mức làm 1: ghi chú riêng của thầy
    expect(tam.querySelectorAll('.hslc-muc-luot-ghi')).toHaveLength(1)
    expect(chu(tam.querySelector('.hslc-muc-luot-ghi'))).toBe('Đúng trước khi đọc hết đề: ghi chú riêng, không tính là vội.')
    // lượt cũ: nhãn "Chưa có số đo" + số giây cũ (hoặc "chưa đo giờ")
    const chua = luot.filter((l) => !l.querySelector('.hslc-muc-luot'))
    expect(chua).toHaveLength(4)
    for (const l of chua) expect(l.querySelector('.hslc-chip-m--chua')?.textContent).toBe('Chưa có số đo')
    expect(chu(chua[0]!)).toContain('33 giây')
    // chú giải một dòng + câu chỉ ảnh không có ranh Mức làm 4 khi lớp chưa đủ mẫu (câu 30 không có thường)
    expect(tam.querySelector('.hslc-chu-giai-m')).not.toBeNull()
    expect(co[4]!.querySelector('.hslc-thuoc-m')!.getAttribute('aria-label')).not.toContain('làm kỹ từ')
  })

  it('hộp câu sai có chip mức của lượt gần nhất; câu chưa có số đo thì không chip', async () => {
    const tam = await mo({ cheDo: 'thay' }, 'thay')
    const hop = [...tam.querySelectorAll('.gvv2-hs-cau')]
    const c12 = hop.find((h) => chu(h).includes('Câu 12'))!
    expect(chu(c12.querySelector('.hslc-o-muc'))).toBe('Lần gần nhất: Mức làm 1 Chưa đọc hết đề')
    const c3 = hop.find((h) => chu(h).includes('Câu 3 '))!
    expect(c3.querySelector('.hslc-o-muc')).toBeNull()
  })

  it('những ngày đầu (không lượt nào có số đo): khối viền nét đứt "Chưa lượt nào của em có số đo", không bảng, không đoán', async () => {
    const tam = await mo({ cheDo: 'thay', chuaDo: true }, 'thay')
    const khoi = tam.querySelector('.hslc-cl')!
    expect(khoi.querySelector('.hslc-cl-trong')).not.toBeNull()
    expect(chu(khoi)).toContain('Chưa lượt nào của em có số đo Mức làm (11 lượt chưa có số đo)')
    expect(khoi.querySelector('.hsv-o-luoi')).toBeNull()
    expect(tam.querySelectorAll('.hslc-muc-luot')).toHaveLength(0)
    expect(tam.querySelectorAll('.hslc-lan .hslc-chip-m--chua')).toHaveLength(11)
  })

  it('lớp chưa đủ mẫu (không β thật): ghi chú một dòng, vẫn xếp Mức làm 1–3', async () => {
    const tam = await mo({ cheDo: 'thay', khongBeta: true }, 'thay')
    expect(chu(tam.querySelector('.hslc-cl'))).toContain('Lớp chưa đủ mẫu của các câu này để xếp Mức làm 4.')
    expect(tam.querySelectorAll('.hsv-thanh i[data-m="4"]')).toHaveLength(0)
  })
})

describe('học sinh và phụ huynh: cùng tấm, chỉ lượt SAI, chữ nhẹ, không nhãn năng lực', () => {
  // 26/10 (thầy: Mức làm «Nộp trước khi đọc hết đề», Bấm vội, Treo máy… CHỈ thầy + phụ huynh xem): học sinh KHÔNG có khối Mức làm, chip mức, thước giây
  // ở bất kỳ lượt nào — chỉ Đúng / Sai / có dùng gợi ý / số giây (kể cả khi dữ liệu lỡ có mức: tấm bỏ ở bước đọc).
  it('học sinh: không khối Mức làm, không chip / thước mức ở lượt nào; lượt vẫn có kết quả + số giây', async () => {
    const tam = await mo({ cheDo: 'em' }, 'hoc-sinh')
    expect(tam.querySelector('.hslc-cl, .hslc-chip-m, .hslc-muc-luot, .hslc-muc-luot-dong, .hslc-thuoc, .hslc-chu-giai-m')).toBeNull()
    expect(tam.textContent).not.toMatch(/Mức làm|Nộp trước khi đọc hết đề|đọc hết đề cần|treo|vội/i)
    const dongDung = [...tam.querySelectorAll('.hslc-lan')].find((l) => chu(l).includes('Câu 9'))!
    expect(chu(dongDung)).toContain('8 giây') // số giây vẫn hiện
    expect(dongDung.querySelector('.hslc-chip-m--chua')).toBeNull()
    const sai = [...tam.querySelectorAll('.hslc-lan')].find((l) => chu(l).includes('Câu 12 · Pin điện hóa'))!
    expect(chu(sai.querySelector('.gvv2-hs-kq'))).toBe('Sai')
    expect(chu(sai)).toContain('14 giây')
  })

  it('phụ huynh: ngôi "con"; cùng quy tắc; không chữ "em" trong khối mức', async () => {
    const tam = await mo({ cheDo: 'em' }, 'phu-huynh')
    const khoi = tam.querySelector('.hslc-cl')!
    expect(chu(khoi.querySelector('h3'))).toBe('Cách con làm bài · lượt sai có số đo · toàn bộ sổ') // máy chủ chưa có `mucLam6` ⇒ tổng cả sổ, ghi rõ
    expect(chu(khoi.querySelector('.hsv-phu'))).toContain('4 lượt con nộp trước khi kịp nghĩ')
    expect(chu(khoi)).not.toMatch(/\bem\b/)
    expect(khoi.querySelector('.hsv-o-luoi')).toBeNull()
  })

  it('học sinh, những ngày đầu: không khối Mức làm, không chữ «Mức làm» (26/10)', async () => {
    const tam = await mo({ cheDo: 'em', chuaDo: true }, 'hoc-sinh')
    expect(tam.querySelector('.hslc-cl-trong, .hslc-cl')).toBeNull()
    expect(tam.textContent).not.toMatch(/Mức làm/)
  })
})
