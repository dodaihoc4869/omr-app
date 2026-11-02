// @vitest-environment jsdom
// BỘ HIỆU ỨNG ĂN MỪNG (thầy chốt 02/11: «Chốt … hiệu ứng gắn luôn vào app, đảm bảo máy siêu yếu cũng hoạt động được, tải luôn hiệu ứng sẵn cho máy yếu nhé»).
// Khoá: (1) hàm thuần — chế độ theo máy yếu / giảm chuyển động, thông số bản gọn (hạt ≤ 1/4, không canvas toàn màn, không loé / rung màn, 30 khung/giây,
// ngắn hơn), chuỗi đúng ⇒ sét ở 5 · 10 · 15, điều kiện kích từng hiệu ứng, tiếng mặc định tắt; (2) bộ chạy: lớp phủ không chặn bấm, tự gỡ khi xong,
// chạm xuống ⇒ kết thúc ngay, nguyên tử luôn gọi onXong đúng một lần; (3) màn làm chặng không vỡ khi sét + đúng / sai chạy; (4) mảnh nạp lười riêng.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import {
  amAnMungBat, cheDoAnMung, chuoiSauCau, demChuoiDung, kichDuMuc, kichLuaChuoi, kichNguyenTu, kichRuong, kichSet, kichXongChang, kieuThe, mucSet, soHat,
  soNguyenTuBay, thoiGian, thongSo,
} from '../src/lib/hieu-ung/dieu-kien'
import { anMung, boHaGon, cheDoMayNay, napAnMung } from '../src/lib/hieu-ung/nap'

describe('chọn chế độ theo máy', () => {
  it('giảm chuyển động ⇒ tĩnh (thắng cả máy yếu); máy yếu ⇒ gọn; còn lại đầy đủ', () => {
    expect(cheDoAnMung({ mayYeu: false, giamChuyenDong: false })).toBe('day-du')
    expect(cheDoAnMung({ mayYeu: true, giamChuyenDong: false })).toBe('gon')
    expect(cheDoAnMung({ mayYeu: true, giamChuyenDong: true })).toBe('tinh')
    expect(cheDoAnMung({ mayYeu: false, giamChuyenDong: true })).toBe('tinh')
  })
  it('bản gọn: hạt ≤ 1/4, không pháo toàn màn, không loé / rung màn, 30 khung/giây, ngắn hơn; tĩnh: không hạt', () => {
    const g = thongSo('gon'), d = thongSo('day-du'), t = thongSo('tinh')
    expect(g.heSoHat).toBeLessThanOrEqual(0.25)
    expect(g.toanMan).toBe(false); expect(g.loeRungMan).toBe(false)
    expect(Math.round(1000 / g.khungMs)).toBe(30)
    expect(g.heSoThoiGian).toBeLessThan(1)
    expect(d.toanMan && d.loeRungMan).toBe(true)
    expect(t.heSoHat).toBe(0)
    for (const n of [40, 48, 26, 12, 9]) {
      expect(soHat(n, 'day-du')).toBe(n)
      expect(soHat(n, 'gon')).toBeLessThanOrEqual(Math.max(1, n / 4))
      expect(soHat(n, 'tinh')).toBe(0)
    }
    expect(thoiGian(1000, 'gon')).toBeLessThan(thoiGian(1000, 'day-du'))
  })
  it('máy kiểm thử (không Element.animate) ⇒ tĩnh', () => {
    expect(cheDoMayNay()).toBe('tinh')
  })
})

describe('điều kiện kích từng hiệu ứng', () => {
  it('đếm chuỗi đúng: đúng tự làm được tính +1; sai / có hỗ trợ / chưa được tính ⇒ 0; sét ở 5, 10, 15 …', () => {
    expect(chuoiSauCau(4, { dung: true })).toBe(5)
    expect(chuoiSauCau(4, { dung: false })).toBe(0)
    expect(chuoiSauCau(4, { dung: true, tuLam: false })).toBe(0)
    expect(chuoiSauCau(4, { dung: true, tinh: false })).toBe(0)
    const ds = Array.from({ length: 5 }, () => ({ dung: true }))
    expect(demChuoiDung(ds)).toBe(5)
    expect(kichSet(demChuoiDung(ds))).toBe(true)
    expect(demChuoiDung([...ds, { dung: false }, { dung: true }])).toBe(1)
    expect([1, 2, 3, 4, 6, 7, 9, 11, 14].some(kichSet)).toBe(false)
    expect([5, 10, 15, 20, 25].every(kichSet)).toBe(true)
    expect([mucSet(5), mucSet(10), mucSet(15), mucSet(30)]).toEqual([1, 2, 3, 3])
  })
  it('thẻ đáp án: đúng ⇒ «đúng», sai ⇒ «sai», nhờ hỗ trợ / chưa có kết quả ⇒ không', () => {
    expect(kieuThe({ coKetQua: true, dung: true, hoTro: false })).toBe('dung')
    expect(kieuThe({ coKetQua: true, dung: false, hoTro: false })).toBe('sai')
    expect(kieuThe({ coKetQua: true, dung: true, hoTro: true })).toBeNull()
    expect(kieuThe({ coKetQua: false, dung: true, hoTro: false })).toBeNull()
  })
  it('nguyên tử chỉ khi máy chủ cộng N > 0; 3–8 hạt theo N, gọn ≤ 1/4', () => {
    expect([kichNguyenTu(0), kichNguyenTu(-2), kichNguyenTu(Number.NaN), kichNguyenTu(undefined), kichNguyenTu(12)]).toEqual([false, false, false, false, true])
    expect(soNguyenTuBay(12, 'day-du')).toBe(6)
    expect(soNguyenTuBay(2, 'day-du')).toBe(3)
    expect(soNguyenTuBay(40, 'day-du')).toBe(8)
    expect(soNguyenTuBay(40, 'gon')).toBeLessThanOrEqual(2)
    expect(soNguyenTuBay(0, 'day-du')).toBe(0)
  })
  it('lửa: chuỗi ngày tăng hoặc vừa đủ mức; xong chặng chạy một lần; rương: đã sáng + chạm', () => {
    expect(kichLuaChuoi(6, 7)).toBe(true); expect(kichLuaChuoi(7, 7)).toBe(false); expect(kichLuaChuoi(null, 1)).toBe(true); expect(kichLuaChuoi(1, 0)).toBe(false)
    expect(kichDuMuc({ truoc: 11, sau: 12, muc: 12 })).toBe(true)
    expect(kichDuMuc({ truoc: 12, sau: 13, muc: 12 })).toBe(false)
    expect(kichDuMuc({ truoc: 0, sau: 1, muc: 0 })).toBe(false)
    expect(kichXongChang({ xong: true, daChay: false })).toBe(true); expect(kichXongChang({ xong: true, daChay: true })).toBe(false)
    expect(kichRuong({ duMo: true, cham: true })).toBe(true); expect(kichRuong({ duMo: false, cham: true })).toBe(false)
  })
  it('tiếng ăn mừng MẶC ĐỊNH TẮT: chỉ kêu khi bật riêng, «Âm thanh» chung không tắt, không ở màn kiểm tra', () => {
    expect(amAnMungBat({ am: null, anMung: null, dangThi: false })).toBe(false)
    expect(amAnMungBat({ am: null, anMung: 'bat', dangThi: false })).toBe(true)
    expect(amAnMungBat({ am: 'tat', anMung: 'bat', dangThi: false })).toBe(false)
    expect(amAnMungBat({ am: null, anMung: 'bat', dangThi: true })).toBe(false)
  })
})

// ───────────────────────────── bộ chạy (giả trình duyệt có Element.animate / canvas)
type Goc = { animate?: unknown; matchMedia: typeof window.matchMedia; getContext: typeof HTMLCanvasElement.prototype.getContext }
const goc: Goc = { animate: (Element.prototype as unknown as { animate?: unknown }).animate, matchMedia: window.matchMedia, getContext: HTMLCanvasElement.prototype.getContext }
function giaTrinhDuyet() {
  ;(Element.prototype as unknown as { animate: unknown }).animate = function () {
    const a = { onfinish: null as null | (() => void), cancel: vi.fn(), finish: vi.fn(), playState: 'running' }
    return a
  }
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as typeof window.matchMedia
  const ctx = new Proxy({} as Record<string | symbol, unknown>, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => { t[k] = v; return true } })
  HTMLCanvasElement.prototype.getContext = (() => ctx) as unknown as typeof HTMLCanvasElement.prototype.getContext
}
function traTrinhDuyet() {
  ;(Element.prototype as unknown as { animate?: unknown }).animate = goc.animate
  window.matchMedia = goc.matchMedia
  HTMLCanvasElement.prototype.getContext = goc.getContext
  document.documentElement.classList.remove('may-yeu')
}
const lop = () => document.querySelector<HTMLElement>('.hu-lop')

describe('bộ chạy hiệu ứng', () => {
  beforeEach(async () => { boHaGon(); giaTrinhDuyet(); await napAnMung() })
  afterEach(() => { window.dispatchEvent(new Event('pointerdown')); traTrinhDuyet(); document.body.innerHTML = '' })

  it('mảnh nạp lười chạy đủ 7 hiệu ứng không lỗi; lớp phủ không chặn bấm; chạm xuống ⇒ kết thúc ngay, gỡ lớp phủ', async () => {
    expect(cheDoMayNay()).toBe('day-du')
    document.body.innerHTML = '<main class="duo-than"><div class="ht2-lam-pa" data-ket="dung" style="width:200px;height:60px"><b class="ht2-lam-pa-ma">A</b></div>'
      + '<div class="ht2-lam-pa" data-ket="sai"><b class="ht2-lam-pa-ma">B</b></div><p class="duo-moc">Phản ứng dây chuyền! ×5</p><button class="dem"><svg></svg></button>'
      + '<svg class="ruong"><path class="rg-nap" /></svg><span class="lua"></span><h1>Xong chặng!</h1></main><section class="duo-ket">x</section>'
    const q = (s: string) => document.querySelector(s)
    const onXong = vi.fn()
    const huy = [
      anMung('set', { chuoi: 5, dich: q('[data-ket=dung]'), chu: q('.duo-moc'), goc: q('.duo-than'), day: q('.duo-ket') }),
      anMung('dung', { the: q('[data-ket=dung]') }),
      anMung('sai', { the: q('[data-ket=sai]') }),
      anMung('nguyen-tu', { tu: q('[data-ket=dung]'), dich: q('.dem'), N: 12, onXong }),
      anMung('lua', { goc: q('.lua') }),
      anMung('chang', { goc: q('h1') }),
      anMung('ruong', { goc: q('.ruong'), nap: q('.rg-nap'), rung: true }),
    ]
    expect(huy).toHaveLength(7)
    expect((q('[data-ket=dung]') as HTMLElement).style.animation).toBe('none') // tắt nảy CSS cũ — không chạy hai thứ chồng nhau
    await new Promise((r) => setTimeout(r, 450))
    const l = lop()!
    expect(l).not.toBeNull()
    expect(l.style.pointerEvents).toBe('none')
    expect(l.querySelector('svg path')).not.toBeNull() // tia sét / tia sáng rương
    window.dispatchEvent(new Event('pointerdown'))
    expect(lop()).toBeNull()
    expect(onXong).toHaveBeenCalledTimes(1) // bị cắt giữa chừng vẫn cộng số đúng một lần
  })

  it('tự gỡ khi xong (không chạm gì): lớp phủ + hạt biến mất sau ~1,7 s; hạt là phần tử Web Animations (không canvas)', async () => {
    document.body.innerHTML = '<div class="ruong"></div>'
    anMung('ruong', { goc: document.querySelector('.ruong') })
    await new Promise((r) => setTimeout(r, 500))
    const soHatDom = lop()!.querySelectorAll('i').length
    expect(soHatDom).toBeGreaterThan(0); expect(soHatDom).toBeLessThanOrEqual(18) // trần 18 hạt bay cùng lúc ở bản đầy đủ (rương xin 43); máy kiểm thử chậm ⇒ tự hạ gọn (10)
    expect(lop()!.querySelector('canvas')).toBeNull()
    await waitFor(() => expect(lop()).toBeNull(), { timeout: 3500 })
  })

  it('máy yếu (lớp may-yeu) ⇒ bản gọn: hạt ≤ 1/4, không tối / loé màn, 2 nguyên tử', async () => {
    document.documentElement.classList.add('may-yeu')
    expect(cheDoMayNay()).toBe('gon')
    document.body.innerHTML = '<div class="the" data-ket="dung"></div><button class="dem"><svg></svg></button>'
    anMung('ruong', { goc: document.querySelector('.the') })
    const onXong = vi.fn()
    anMung('nguyen-tu', { tu: document.querySelector('.the'), dich: document.querySelector('.dem'), N: 40, onXong })
    await new Promise((r) => setTimeout(r, 450))
    const l = lop()!
    expect(l.querySelectorAll('i').length).toBeGreaterThan(0)
    expect(l.querySelectorAll('i').length).toBeLessThanOrEqual(11) // ⌊26/4⌋ tia lửa + ⌊16/4⌋ lấp lánh + 1 sóng xung (đầy đủ: 43)
    expect([...l.children].some((e) => (e as HTMLElement).style.inset === '0px' || (e as HTMLElement).style.background === 'var(--tr-phu)')).toBe(false) // không loé / tối màn
    expect(l.querySelectorAll('span svg').length).toBeLessThanOrEqual(2) // ≤ 1/4 của 8 nguyên tử
  })
})

describe('tự hạ xuống bản gọn khi khung chậm', () => {
  it('≥ 2 khung > 40 ms hoặc 1 khung > 70 ms (bỏ 2 khung đầu, bỏ khoảng tab ẩn) ⇒ hạ', async () => {
    const { nenHaGon } = await import('../src/lib/hieu-ung/dieu-kien')
    expect(nenHaGon([16, 17, 16, 17, 33, 16])).toBe(false)
    expect(nenHaGon([90, 60, 16, 17, 16])).toBe(false) // hai khung đầu (dựng dải kết quả) không tính
    expect(nenHaGon([16, 16, 45, 17, 48])).toBe(true)
    expect(nenHaGon([16, 16, 17, 75])).toBe(true)
    expect(nenHaGon([16, 16, 5000, 16])).toBe(false) // tab ẩn
  })
  it('đã hạ ⇒ máy này chạy bản gọn tới khi tải lại', async () => {
    giaTrinhDuyet()
    const nap = await import('../src/lib/hieu-ung/nap')
    try {
      nap.boHaGon()
      expect(nap.cheDoMayNay()).toBe('day-du')
      nap.haXuongGon()
      expect(nap.cheDoMayNay()).toBe('gon')
    } finally { nap.boHaGon(); traTrinhDuyet() }
  })
})

describe('giảm chuyển động / máy kiểm thử', () => {
  it('tĩnh: không lớp phủ, nguyên tử gọi onXong ngay', async () => {
    await napAnMung()
    const onXong = vi.fn()
    document.body.innerHTML = '<div class="the"></div><b class="dem"></b>'
    anMung('set', { chuoi: 5 })
    anMung('nguyen-tu', { tu: document.querySelector('.the'), dich: document.querySelector('.dem'), N: 10, onXong })
    expect(onXong).toHaveBeenCalledTimes(1)
    expect(lop()).toBeNull()
    document.body.innerHTML = ''
  })
})

// ───────────────────────────── màn làm chặng: sét ở câu đúng thứ 5 + đúng / sai trên thẻ, màn không vỡ
vi.mock('../src/components/hoa2/api', async (g) => ({ ...await g<typeof import('../src/components/hoa2/api')>(), goiHoa2: vi.fn() }))
vi.mock('../src/components/hoa2/doc-luong-nop', async () => { const api = await import('../src/components/hoa2/api'); return { nopCauLuong: (token: string, du: Record<string, unknown>, giay: number) => api.goiHoa2('answer', token, du, giay) } })

describe('màn làm chặng không vỡ khi hiệu ứng chạy', () => {
  beforeEach(() => { boHaGon(); document.documentElement.dataset.trong = 'hs'; giaTrinhDuyet() })
  afterEach(() => { window.dispatchEvent(new Event('pointerdown')); cleanup(); traTrinhDuyet(); localStorage.clear(); delete document.documentElement.dataset.trong })

  it('5 câu đúng liền ⇒ sét đánh (lớp phủ có tia), thẻ đúng tắt nảy CSS; câu sai ⇒ thẻ em chọn lắc; «Tiếp tục» vẫn bấm được ngay', async () => {
    const { default: ManLamBaiTap } = await import('../src/components/hoc-tap/ManLamBaiTap')
    const { goiHoa2 } = await import('../src/components/hoa2/api')
    const nen = { maDe: 'de', version: 'v1', group: 'g', hinhAnh: [], dang: null, tenDang: 'Ester', mucDo: 'hieu', sao: 0, kienThuc: [], ideas: [] }
    const cau = Array.from({ length: 7 }, (_, i) => ({ ...nen, qid: `q${i}`, phan: 'I' as const, text: `Câu số ${i + 1} về ester`, choices: ['A1', 'B2', 'C3', 'D4'] }))
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, id: 'p1', questions: cau })
    await napAnMung()
    render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={{ daLam: 0, muc: 24, chang: 1, soChang: 4 }} />)
    for (let i = 0; i < 6; i++) {
      await screen.findByText(`Câu số ${i + 1} về ester`)
      const dung = i < 5
      vi.mocked(goiHoa2).mockResolvedValueOnce({ correct: dung, answer: 'A', solution: {},
        thuong: dung ? { tinh: true, nguyenTu: 10, dong: [{ nhan: 'Đúng', so: 10 }], chuoiDung: i + 1, cauKho: false } : { tinh: true, nguyenTu: 2, dong: [{ nhan: 'Làm nghiêm túc', so: 2 }], chuoiDung: 0, cauKho: false } })
      fireEvent.click(screen.getByRole('radio', { name: dung ? /^A/ : /^B/ }))
      fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
      await screen.findByRole('button', { name: 'Tiếp tục' })
      const the = document.querySelector<HTMLElement>(`.ht2-lam-pa[data-ket=${dung ? 'dung' : 'sai'}]`)!
      await waitFor(() => expect(the.style.animation).toBe('none'))
      if (i === 4) await waitFor(() => expect(document.querySelector('.hu-lop svg path')).not.toBeNull(), { timeout: 1500 })
      fireEvent.pointerDown(window)
      fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }))
    }
    expect(await screen.findByText('Câu số 7 về ester')).toBeTruthy()
    expect(document.querySelector('.hu-lop')).toBeNull()
  }, 20000)
})

describe('tải sẵn, không cộng byte lượt mở', () => {
  it('mảnh vẽ chỉ nạp ĐỘNG từ nap.ts; mọi nơi gọi đi qua lib/hieu-ung; tên mảnh khớp globIgnores hieu-ung-* của service worker', () => {
    const nap = readFileSync('src/lib/hieu-ung/nap.ts', 'utf8')
    expect(nap).toMatch(/import\('\.\/hieu-ung-an-mung'\)/)
    for (const f of ['src/components/hoc-tap/ManLamBaiTap.tsx', 'src/components/hoc-tap/TrongHs.tsx', 'src/components/hoc-tap/hieu-ung-duo.ts', 'src/components/thuong/KetBaiThuong.tsx', 'src/components/thuong/ManChuoi.tsx', 'src/components/thuong/ManTinhThe.tsx', 'src/components/chua-cau-sai/ChuaGonDuo.tsx']) {
      const s = readFileSync(f, 'utf8')
      expect(s, f).not.toMatch(/hieu-ung\/(hieu-ung-an-mung|bo-chay|set|nguyen-tu)'/)
    }
    expect(readFileSync('vite.config.ts', 'utf8')).toMatch(/\{rung,phan-hoi,am-thanh,Bi,hieu-ung\}-\*\.\{js,css\}/)
    // nạp trước: ngay khi vào màn làm câu, và lúc rảnh sau khi Lộ trình hiện
    expect(readFileSync('src/components/hoc-tap/ManLamBaiTap.tsx', 'utf8')).toMatch(/napTruocAnMung\(true\)/)
    expect(readFileSync('src/components/hoc-tap/TrongHs.tsx', 'utf8')).toMatch(/useEffect\(\(\) => \{ napTruocAnMung\(\) \}, \[\]\)/)
  })
})
