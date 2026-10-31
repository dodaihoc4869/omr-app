// LỬA ĐỔI CẢM XÚC — LUẬT CHỌN CẤP (thầy «Chốt duyệt tất» 31/10, docs/DE-XUAT-BI-CAM-XUC-3110.md mục 4–5). Hàm thuần src/lib/lua-cam-xuc.ts.
import { describe, expect, it } from 'vitest'
import { capGianLua, capTheoGio, mocDoiLua, xetLua, type VaoLua } from '../src/lib/lua-cam-xuc'
import type { SoLuaThat } from '../src/lib/lua-that'

/** Giờ Việt Nam ngày 31/10/2026 ⇒ ms. */
const luc = (h: number, m = 0) => Date.UTC(2026, 9, 31, h - 7, m)
const vao = (h: number, m: number, x: Partial<VaoLua> = {}): VaoLua => ({ now: luc(h, m), daLam: 0, muc: 40, du: false, chuoi: 0, giuHomNay: false, ...x })
/** Sổ: chuỗi '1' (được tính) / '0' (chưa được tính), cũ trước mới sau, mỗi câu cách 1 phút, câu cuối lúc `cuoi`. */
const so = (kq: string, cuoi = luc(15, 0), xongThat?: number): SoLuaThat => ({
  kq: [...kq].map((c, i, a) => ({ t: cuoi - (a.length - 1 - i) * 60_000, tinh: c === '1' })), ...(xongThat !== undefined ? { xongThat } : {}),
})

describe('bước 1 — gấp theo giờ × số câu (đủ 15 ô)', () => {
  // hàng: giờ đại diện · cột: ≥ 50% mức (20/40) · 1–49% (6/40) · chưa làm câu nào (0/40)
  const BANG: [number, [number, number, number]][] = [[15, [1, 1, 1]], [18, [1, 1, 1]], [19, [1, 2, 2]], [20, [1, 2, 2]], [21, [2, 3, 3]], [22, [3, 4, 4]], [23, [4, 4, 5]]]
  for (const [h, [nua, mot, khong]] of BANG) it(`${h}:30`, () => {
    expect(capGianLua(vao(h, 30, { daLam: 20 }))).toBe(nua)
    expect(capGianLua(vao(h, 30, { daLam: 6 }))).toBe(mot)
    expect(capGianLua(vao(h, 30, { daLam: 0 }))).toBe(khong)
  })
  it('ranh giờ đúng mốc: 18:59 → 1, 19:00 → 2, 20:59 → 2, 21:00 → 3, 22:00 → 4, 23:00 → 5; 00:00 ngày mới → 1', () => {
    expect(capGianLua(vao(18, 59))).toBe(1)
    expect(capGianLua(vao(19, 0))).toBe(2)
    expect(capGianLua(vao(20, 59))).toBe(2)
    expect(capGianLua(vao(21, 0))).toBe(3)
    expect(capGianLua(vao(22, 0))).toBe(4)
    expect(capGianLua(vao(23, 0))).toBe(5)
    expect(capGianLua(vao(24, 0))).toBe(1)
    expect(capTheoGio(23, 20, 40)).toBe(4) // đúng nửa mức tính là ≥ 50%
  })
  it('đủ mức ⇒ cấp 0 ở mọi giờ; giờ trôi thì cấp chỉ tăng', () => {
    for (const h of [8, 19, 21, 22, 23]) expect(capGianLua(vao(h, 30, { daLam: 40, du: true }))).toBe(0)
    for (const d of [0, 6, 20]) {
      let truoc = 0
      for (let h = 6; h < 24; h++) { const c = capGianLua(vao(h, 0, { daLam: d })); expect(c).toBeGreaterThanOrEqual(truoc); truoc = c }
    }
  })
  it('chuỗi sắp mất (chuỗi ≥ 3, hôm nay chưa giữ, hết bình) ⇒ cấp 5 từ 23:00 dù đã làm quá nửa', () => {
    const sapMat = { daLam: 30, chuoi: 12, giuHomNay: false, giuChuoi: 0 }
    expect(capGianLua(vao(23, 5, sapMat))).toBe(5)
    expect(xetLua(vao(23, 5, sapMat)).chuoiSapMat).toBe(true)
    expect(capGianLua(vao(22, 50, sapMat))).toBe(3) // trước 23:00: theo bảng
    expect(capGianLua(vao(23, 5, { ...sapMat, giuChuoi: 1 }))).toBe(4) // còn bình ⇒ chuỗi chưa mất
    expect(capGianLua(vao(23, 5, { ...sapMat, chuoi: 2 }))).toBe(4) // chuỗi < 3
    expect(capGianLua(vao(23, 5, { ...sapMat, giuHomNay: true }))).toBe(4)
    expect(capGianLua(vao(23, 5, { ...sapMat, giuChuoi: undefined }))).toBe(4) // không rõ bình ⇒ không coi là sắp mất
  })
})

describe('bước 2 — câu chưa được tính (10 câu nộp gần nhất hôm nay, mọi giờ)', () => {
  it('3–4 câu chưa tính ⇒ +1, ít nhất cấp 3 (15:00: 1 + 1, ít nhất 3); 21:30 (bảng 3) ⇒ 4', () => {
    expect(capGianLua(vao(15, 0, { daLam: 10, so: so('1101101101') }))).toBe(3) // 3/10, không liền
    expect(capGianLua(vao(15, 0, { daLam: 10, so: so('1011010101') }))).toBe(3) // 4/10, không liền 3, 3 câu cuối không cùng được tính
    expect(capGianLua(vao(21, 30, { daLam: 10, so: so('1011010101', luc(21, 30)) }))).toBe(4)
  })
  it('từ 5 câu chưa tính, hoặc 3 câu LIỀN ⇒ +2, ít nhất cấp 4; trần 5', () => {
    expect(capGianLua(vao(15, 0, { daLam: 10, so: so('0101010100') }))).toBe(4) // 6/10
    expect(capGianLua(vao(15, 0, { daLam: 3, so: so('000') }))).toBe(4) // ví dụ đặc tả: 1 + 2, ít nhất 4
    expect(capGianLua(vao(22, 30, { daLam: 3, so: so('000', luc(22, 30)) }))).toBe(5) // 4 + 2 ⇒ trần 5
    expect(xetLua(vao(15, 0, { daLam: 3, so: so('000') })).lien).toBe(3)
  })
  it('kể cả đã đủ mức: 3 câu liền chưa tính ⇒ cấp 4 (lý do «chưa tính»)', () => {
    const k = xetLua(vao(15, 0, { daLam: 40, du: true, so: so('11000') }))
    expect(k.cap).toBe(4)
    expect(k.lyDo).toBe('chuaTinh')
  })
  it('chỉ xét 10 câu gần nhất', () => {
    expect(capGianLua(vao(15, 0, { daLam: 13, so: { kq: [...so('000').kq.map((x) => ({ ...x, t: x.t - 3600_000 })), ...so('1101101101').kq] } }))).toBe(3)
  })
  it('điểm thấp / làm sai KHÔNG làm Lửa giận: mọi câu được tính (dù sai) ⇒ theo giờ', () => {
    expect(capGianLua(vao(15, 0, { daLam: 10, so: so('1111111111') }))).toBe(1)
  })
})

describe('bước 3 — hạ nhiệt (chỉ việc em làm mới hạ được cấp)', () => {
  it('3 câu LIỀN được tính ⇒ bỏ ngay phần cộng (ví dụ: 15:00 3 câu liền chưa tính → 4, làm tiếp 3 câu được tính → 1)', () => {
    expect(capGianLua(vao(15, 0, { daLam: 3, so: so('000') }))).toBe(4)
    expect(capGianLua(vao(15, 3, { daLam: 6, so: so('000111', luc(15, 3)) }))).toBe(1)
    expect(capGianLua(vao(15, 2, { daLam: 5, so: so('00011', luc(15, 2)) }))).toBe(4) // mới 2 câu liền
  })
  it('xong chặng làm thật (≥ 4/6 được tính) ⇒ cấp 0 trong 30 phút; hết 30 phút ⇒ tính lại theo bảng', () => {
    const x = luc(22, 45)
    const k = xetLua(vao(22, 46, { daLam: 12, so: so('111111', x, x) }))
    expect(k.cap).toBe(0)
    expect(k.lyDo).toBe('that')
    expect(capGianLua(vao(23, 14, { daLam: 12, so: so('111111', x, x) }))).toBe(0)
    expect(capGianLua(vao(23, 15, { daLam: 12, so: so('111111', x, x) }))).toBe(4) // 23:15 không làm thêm ⇒ 4
    expect(capGianLua(vao(23, 15, { daLam: 12, chuoi: 12, giuChuoi: 0, so: so('111111', x, x) }))).toBe(5) // … hoặc 5 nếu chuỗi sắp mất
  })
  it('trong 30 phút vui, câu chưa tính nộp SAU lúc xong chặng vẫn đẩy cấp lên (câu trước đó đã được tha)', () => {
    const x = luc(15, 0)
    expect(capGianLua(vao(15, 10, { daLam: 12, so: so('000111', x, x) }))).toBe(0)
    const sau = { kq: [...so('111111', x).kq, ...so('000', luc(15, 10)).kq], xongThat: x }
    expect(capGianLua(vao(15, 10, { daLam: 15, so: sau }))).toBe(4)
  })
})

describe('ngoại lệ (mục 5)', () => {
  it('ca kiểm tra đang mở ⇒ cấp 1 dù muộn', () => {
    expect(xetLua(vao(23, 30, { coCa: true, chuoi: 12, giuChuoi: 0 }))).toMatchObject({ cap: 1, lyDo: 'ca' })
  })
  it('ngày Kiểm tra ôn tập / Kiểm tra ôn tập khoá chặng ⇒ tối đa cấp 2', () => {
    expect(capGianLua(vao(23, 30, { kiem: true }))).toBe(2)
    expect(capGianLua(vao(15, 0, { kiem: true, daLam: 3, so: so('000') }))).toBe(2)
  })
  it('nghỉ phép / thầy tắt ngày / hết câu / mức 0 ⇒ cấp 0', () => {
    for (const x of [{ nghi: true }, { hetCau: true }, { muc: 0 }] as Partial<VaoLua>[]) expect(xetLua(vao(23, 30, x))).toMatchObject({ cap: 0, lyDo: 'nghi' })
  })
  it('ngày đầu vào app ⇒ tối đa cấp 2; số cũ (lỗi / mất mạng) ⇒ tối đa cấp 3', () => {
    expect(capGianLua(vao(23, 30, { ngayDau: true }))).toBe(2)
    expect(capGianLua(vao(23, 30, { cu: true }))).toBe(3)
    expect(capGianLua(vao(20, 0, { cu: true }))).toBe(2)
  })
  it('ví dụ đặc tả mục 4.2', () => {
    expect(capGianLua(vao(20, 10, { daLam: 0 }))).toBe(2)
    expect(capGianLua(vao(21, 40, { daLam: 12 }))).toBe(3)
    expect(capGianLua(vao(22, 30, { daLam: 6 }))).toBe(4)
    expect(capGianLua(vao(23, 5, { daLam: 0, chuoi: 12, giuChuoi: 0 }))).toBe(5)
  })
})

describe('mốc tính lại', () => {
  it('mốc giờ kế (19 · 21 · 22 · 23 · 00) hoặc hết 30 phút vui', () => {
    expect(mocDoiLua(vao(15, 20))).toBe(luc(19, 0))
    expect(mocDoiLua(vao(19, 0))).toBe(luc(21, 0))
    expect(mocDoiLua(vao(23, 59))).toBe(luc(24, 0))
    const x = luc(19, 0)
    expect(mocDoiLua(vao(19, 5, { so: so('111111', x, x) }))).toBe(x + 30 * 60_000)
    expect(mocDoiLua(vao(18, 55, { so: so('111111', luc(18, 50), luc(18, 50)) }))).toBe(luc(19, 0))
  })
})
