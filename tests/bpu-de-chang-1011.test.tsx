// @vitest-environment jsdom
// Bình Phản Ứng — máy em, thầy 10/11 (ảnh câu Đúng–sai «Cho một số hợp chất chứa nguyên tố nitrogen như sau:»): «Đề hiển thị ko đúng, cho hiển thị đề giống
// với phần chặng luôn, có giám thị».
// GỐC đã soát: câu đi kho → `cauCongKhai` → phòng → `viewEm` KHÔNG rơi trường nào của đề (khoá ở khối 1). Khác chặng nằm ở chỗ VẼ: `DeCau` đứng ngoài chuỗi
// lớp của chặng (`.ht-app.ht2-lam.duo`), thiếu giám thị + bong bóng, thiếu thẻ «hình vẽ lại» và ảnh cuối câu; còn dòng «(1)» trơ trọi là do bộ tách dòng
// coi dãy số trần «(1) (2) (3)» (chỗ đứng của ba công thức nằm chung một ảnh sau đề) là ba đầu ý.
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { moDapAn, moLuot, taoPhong, viewEm } from '../src/lib/bpu/phong'
import { cauCongKhai } from '../server/src/cau-theo-qid'
import { publicQuestion, type PrivateQuestion } from '../src/game/than-thu-v2/core'
import { tachNhanTran } from '../src/lib/ngat-y-so-sau'
import { tachDongTheoY } from '../src/lib/tach-dong-cau'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))

class WsGia { static ds: WsGia[] = []; readyState = 1; gui: string[] = []; onopen?: () => void; onmessage?: (e: { data: string }) => void; onclose?: () => void; onerror?: () => void
  constructor(public url: string) { WsGia.ds.push(this); setTimeout(() => this.onopen?.(), 0) }
  send(d: string) { this.gui.push(d) } close() {} nhan(v: unknown) { act(() => { this.onmessage?.({ data: JSON.stringify(v) }) }) } }

const T0 = Date.now()
const phong = () => taoPhong({ buoiId: 'b1', lop: '12A1', nay: T0, ds: [{ sbd: 'S1', ten: 'Nguyễn Minh Anh', coMat: true, luc: T0 }, { sbd: 'S2', ten: 'Trần Gia Bảo', coMat: true, luc: T0 }] })
const DE = 'Cho một số hợp chất chứa nguyên tố nitrogen như sau: (1) (2) (3) Tính chất hóa học của các hợp chất.'
/** Câu RIÊNG như kho (có đáp án + lời giải + ảnh lời giải) — đúng cấu trúc câu trong ảnh thầy: dãy số trần + MỘT ảnh sau đề; thêm ảnh sau ý, ảnh cuối câu, bảng. */
const rieng: PrivateQuestion = {
  qid: 'DH-12-C3-B9-P2-II-14', maDe: 'DH-12-C3-B9-P2', version: '3', group: 'g-n', phan: 'II', text: DE, choices: [],
  ideas: ['Đều có phản ứng với dung dịch HCl, sinh ra muối.', 'Có 1 chất tham gia phản ứng thuỷ phân.', 'Chất số (3) có thể trùng ngưng tạo polypeptide.', 'Cả ba chất đều làm quỳ tím ẩm hoá xanh.'],
  table: [['Chất', '(1)', '(2)', '(3)'], ['Số nhóm NH2', '1', '1', '1']],
  hinhAnh: [
    { src: 'data:image/png;base64,AAAA', viTri: 'sau_de', alt: 'Ba công thức (1), (2), (3)' },
    { src: 'data:image/png;base64,BBBB', viTri: 'sau_y_a' },
    { src: 'data:image/png;base64,CCCC', viTri: 'cuoi_cau', alt: 'Hình cuối câu' },
    { src: 'data:image/png;base64,DDDD', viTri: 'sau_loi_giai' },
  ],
  ideaImgs: ['', 'data:image/png;base64,EEEE', '', ''],
  dang: 'HOP_CHAT_N.AMINE', tenDang: 'Hợp chất chứa nitrogen', mucDo: 'van_dung', sao: 1, kienThuc: ['amine'],
  correct: 'DDDS', solution: { chot: 'Lời giải BÍ MẬT' }, reviewed: true,
}
/** Mọi trường phần ĐỀ + phần trả lời + giám thị của màn chặng đọc từ câu. */
const TRUONG_DE = ['qid', 'phan', 'text', 'choices', 'ideas', 'table', 'thanCauImg', 'imageDataUrl', 'choiceImgs', 'ideaImgs', 'hinhAnh', 'tenDang', 'mucDo', 'sao'] as const

describe('dữ liệu: câu có ảnh chèn giữa đề đi qua phòng tới máy em giữ đủ trường, không mang đáp án', () => {
  it('`cauCongKhai` (đường Bình Phản Ứng) = `publicQuestion` (đường chặng) ở MỌI trường đề', () => {
    const bpu = cauCongKhai(rieng) as Record<string, unknown>, chang = publicQuestion(rieng) as unknown as Record<string, unknown>
    for (const t of TRUONG_DE) expect(bpu[t], t).toEqual(chang[t])
    expect((bpu.hinhAnh as { viTri: string }[]).map((h) => h.viTri)).toEqual(['sau_de', 'sau_y_a', 'cuoi_cau']) // đủ ảnh + đúng vị trí; ảnh lời giải ở lại máy chủ
  })
  it('qua phòng: `viewEm` trả NGUYÊN câu công khai (ảnh, vị trí ảnh, bảng, mức độ) — lượt chưa mở thì không có đáp án / lời giải / ảnh lời giải', () => {
    const st = phong(), cau = cauCongKhai(rieng)
    // như máy chủ: `gvBpuLuot` gửi vào phòng { cau: cauCongKhai(q), dung, giai } — qua JSON (Durable Object lưu + WebSocket)
    const gui = JSON.parse(JSON.stringify({ qid: rieng.qid, phan: rieng.phan, tuLuan: false, cau, dung: rieng.correct, hanGiay: 0, giai: { solution: rieng.solution, anh: rieng.hinhAnh.filter((h) => h.viTri === 'sau_loi_giai') } }))
    moLuot(st, gui, T0)
    const v = JSON.parse(JSON.stringify(viewEm(st, 'S1'))) as { luot: Record<string, unknown> & { cau: Record<string, unknown> } }
    expect(v.luot.cau).toEqual(JSON.parse(JSON.stringify(cau)))
    for (const t of ['text', 'hinhAnh', 'table', 'ideaImgs', 'mucDo', 'sao'] as const) expect(v.luot.cau[t], t).toEqual(t === 'hinhAnh' ? rieng.hinhAnh.filter((h) => h.viTri !== 'sau_loi_giai') : JSON.parse(JSON.stringify(rieng[t]))) // trừ ảnh lời giải (dòng dưới)
    const chuoi = JSON.stringify(v)
    expect(v.luot).not.toHaveProperty('dung')
    expect(v.luot).not.toHaveProperty('giai')
    expect(v.luot.cau).not.toHaveProperty('correct')
    expect(v.luot.cau).not.toHaveProperty('solution')
    expect(chuoi).not.toContain('DDDS')
    expect(chuoi).not.toContain('BÍ MẬT')
    expect(chuoi).not.toContain('DDDD') // ảnh lời giải
    expect(chuoi).not.toContain('sau_loi_giai')
    // thầy mở đáp án ⇒ lúc ấy mới có
    moDapAn(st, T0 + 5000, (a, b) => a === b)
    expect(viewEm(st, 'S1').luot).toMatchObject({ dung: 'DDDS', giai: { solution: { chot: 'Lời giải BÍ MẬT' } } })
  })
})

describe('dãy số trần «(1) (2) (3)» giữ chỗ cho công thức trong ảnh sau đề', () => {
  it('nhận đúng dạng: lời dẫn · dòng số · phần chữ còn lại', () => {
    expect(tachNhanTran(DE, tachDongTheoY)).toEqual({ truoc: 'Cho một số hợp chất chứa nguyên tố nitrogen như sau:', nhan: '(1) (2) (3)', sau: 'Tính chất hóa học của các hợp chất.' })
    expect(tachNhanTran('Cho các chất sau:  (1)  (2)', tachDongTheoY)).toEqual({ truoc: 'Cho các chất sau:', nhan: '(1) (2)', sau: '' })
    expect(tachNhanTran('Cho các chất sau: (1) (2) (3).', tachDongTheoY)).toEqual({ truoc: 'Cho các chất sau:', nhan: '(1) (2) (3)', sau: '' })
    expect(tachNhanTran('Cho các chất sau: (1), (2), (3) Phát biểu nào đúng?', tachDongTheoY)).toMatchObject({ nhan: '(1), (2), (3)', sau: 'Phát biểu nào đúng?' })
  })
  it('KHÔNG đụng đề thường: số có chữ đi kèm, số không liền từ (1), nhắc lại số trong câu văn, công thức có ngoặc', () => {
    for (const de of [
      'Cho các chất sau: (1) ammonia, (2) methylamine, (3) aniline. Chất nào có lực base mạnh nhất?',
      'Cho các chất sau:\n(1) ammonia,\n(2) methylamine.',
      'Thực hiện các thí nghiệm sau: tan trong nước lạnh (1); làm mất màu nước bromine (2); tráng bạc (3).',
      'Thứ tự tăng dần lực base của các chất (1), (2), (3) là',
      'Cho các chất: (2) (3) không có chất (1).',
      'Cho dãy: Cu(OH)2, Fe(OH)3. Chất nào tan trong NH3?',
      'Chất nào sau đây là amine bậc hai?',
    ]) expect(tachNhanTran(de, tachDongTheoY), de).toBeNull()
  })
})

describe('màn máy em: đề vẽ bằng khối đề của chặng + giám thị', () => {
  beforeEach(() => { WsGia.ds = []; document.documentElement.dataset.trong = 'hs'; vi.stubGlobal('WebSocket', WsGia); vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true, ve: 've-em', buoiId: 'b1', ban: {} })))) })
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); delete document.documentElement.dataset.trong })

  async function vao(q: PrivateQuestion) {
    const { default: Man } = await import('../src/components/bpu/ManBinhPhanUng')
    render(<Man token="tok" buoiId="b1" onDong={() => {}} />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    const ws = WsGia.ds[0]!
    const st = phong()
    moLuot(st, { qid: q.qid, phan: q.phan, tuLuan: false, cau: cauCongKhai(q) as unknown as Record<string, unknown>, dung: q.correct, hanGiay: 0 }, T0)
    ws.nhan(viewEm(st, 'S1'))
    await waitFor(() => expect(document.querySelector('.bpu-de-chang .ht2-lam-de')).toBeTruthy(), { timeout: 8000 })
    return { ws, st }
  }

  it('câu có mức độ ⇒ khối đề đứng trong chuỗi lớp của chặng, có giám thị đúng mức + bong bóng đề; phần trả lời nằm trong `.duo-tra`', async () => {
    await vao(rieng)
    const khoi = document.querySelector('.bpu-hs-than > .bpu-de-chang')!
    expect([...khoi.classList]).toEqual(expect.arrayContaining(['ht-app', 'ht2-lam', 'duo'])) // cùng tờ kiểu với chặng
    expect(khoi.hasAttribute('data-chang')).toBe(false) // không kéo bố cục «cả màn» hai cột của màn chặng
    const san = khoi.querySelector('.duo-gt-san')!
    expect(san.querySelector(':scope > .duo-gt-loi-o')).toBeTruthy()
    expect(san.querySelector(':scope > .duo-gt-bong > .ht2-lam-de')).toBeTruthy() // đề nằm TRONG bong bóng cạnh giám thị
    await waitFor(() => expect(san.querySelector('.duo-gt-nv .gt-o .gtm')?.getAttribute('data-muc')).toBe('vd'), { timeout: 8000 }) // mảnh giám thị nạp lười: mức «vận dụng»
    expect(khoi.querySelector('.gyc')).toBeNull() // không «chạm để hiểu đề» / gợi ý trong lượt thi đua
    // phần trả lời: ngoài chuỗi lớp chặng (giữ kiểu Bình Phản Ứng), trong `.duo-tra` để mắt giám thị dõi theo
    const tra = document.querySelector('.bpu-hs-than > .duo-tra.bpu-tra')!
    expect(tra.querySelectorAll('.ht2-lam-y')).toHaveLength(4)
    expect(tra.closest('.duo')).toBeNull()
    // các phần giữ nguyên: đầu màn đội + nút Gửi nổi (thân chừa lề)
    expect(document.querySelector('.bpu-hs-tren.co-doi')).toBeTruthy()
    expect(document.querySelector('.bpu-hs.co-gui .bpu-gui-noi')).toBeTruthy()
  })

  it('đề đúng thứ tự: lời dẫn → dòng «(1) (2) (3)» → ảnh công thức → phần chữ còn lại; ảnh cuối câu cũng hiện', async () => {
    await vao(rieng)
    const de = document.querySelector('.bpu-de-chang .ht2-lam-de')!
    const dong = [...de.querySelectorAll('.ht2-lam-de-chu, img[src$="AAAA"]')].map((x) => (x.tagName === 'IMG' ? '[ảnh]' : x.textContent!.replace(/^Câu \d+\.\s*/, '').trim()))
    expect(dong).toEqual(['Cho một số hợp chất chứa nguyên tố nitrogen như sau:', '(1) (2) (3)', '[ảnh]', 'Tính chất hóa học của các hợp chất.'])
    expect(de.textContent).not.toMatch(/\(1\)\s*\n/) // không còn «(1)» trơ trọi một dòng
    expect(document.querySelector('.bpu-hs-than img[src$="BBBB"]')).toBeTruthy() // ảnh sau ý a
    expect(document.querySelector('.bpu-hs-than img[src$="CCCC"]')).toBeTruthy() // ảnh cuối câu (trước 10/11 Bình Phản Ứng bỏ rơi)
    expect(document.querySelector('img[src$="DDDD"]')).toBeNull() // ảnh lời giải không có trên máy em
  })

  it('câu không có mức độ ⇒ không giám thị, đề vẫn theo kiểu chặng; em gửi ⇒ lớp che như cũ', async () => {
    const { ws } = await vao({ ...rieng, qid: 'q-tn', phan: 'I', mucDo: null, sao: null, text: 'Chất nào là amine bậc hai?', choices: ['CH3NH2', 'CH3NHCH3', '(CH3)3N', 'C6H5NH2'], ideas: [], hinhAnh: [], table: undefined, ideaImgs: undefined, correct: 'B' })
    expect(document.querySelector('.bpu-de-chang .duo-gt-san')).toBeNull()
    expect(document.querySelector('.bpu-de-chang > .ht2-lam-de')).toBeTruthy()
    const pa = await screen.findAllByRole('radio', {}, { timeout: 5000 })
    act(() => { pa[1]!.click() })
    act(() => { screen.getByRole('button', { name: 'Gửi đáp án' }).click() })
    expect(ws.gui.map((x) => JSON.parse(x) as { t: string; chon?: string }).filter((x) => x.t === 'tra')).toEqual([{ t: 'tra', chon: 'B' }])
    expect(document.querySelector('.bpu-che')).toBeTruthy()
  })
})

describe('giao diện cũ (máy lùi, <html> không có data-trong)', () => {
  beforeEach(() => { WsGia.ds = []; delete document.documentElement.dataset.trong; vi.stubGlobal('WebSocket', WsGia); vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true, ve: 've-em', buoiId: 'b1' })))) })
  afterEach(() => { cleanup(); vi.unstubAllGlobals() })
  it('màn chặng cũng không dùng khối giám thị ở giao diện này ⇒ Bình Phản Ứng giữ `DeCau` trơn như trước (không khung chặng, không giám thị)', async () => {
    const { default: Man } = await import('../src/components/bpu/ManBinhPhanUng')
    render(<Man token="tok" buoiId="b1" onDong={() => {}} />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    const st = phong()
    moLuot(st, { qid: rieng.qid, phan: rieng.phan, tuLuan: false, cau: cauCongKhai(rieng) as unknown as Record<string, unknown>, dung: rieng.correct, hanGiay: 0 }, T0)
    WsGia.ds[0]!.nhan(viewEm(st, 'S1'))
    await waitFor(() => expect(document.querySelector('.bpu-hs-than > .ht2-lam-de')).toBeTruthy(), { timeout: 8000 })
    expect(document.querySelector('.bpu-de-chang')).toBeNull()
    expect(document.querySelector('.duo-gt-san')).toBeNull()
  })
})

describe('một nguồn với chặng + không thêm byte đường mở', () => {
  const chang = readFileSync('src/components/hoc-tap/ManLamBaiTap.tsx', 'utf8'), bpu = readFileSync('src/components/bpu/ManBinhPhanUng.tsx', 'utf8'), khoi = readFileSync('src/components/hoc-tap/KhoiDeChang.tsx', 'utf8')
  it('màn chặng và Bình Phản Ứng cùng dựng đề bằng `KhoiDeChang`; chặng vẫn bọc «chạm để hiểu đề»', () => {
    expect(chang).toMatch(/<KhoiDeChang san=\{sanRef\} muc=\{mucGt\} q=\{q\} phien=\{phien\} nop=\{nop\} ket=\{ketGt\} vung=\{\(\) => gocRef\.current\}><VungChamDe /)
    expect(chang).toMatch(/PHAN_CAU_CHANG = \{[^}]*KhoiDeChang[^}]*HinhCuoiCau[^}]*mucGiamThi[^}]*\}/)
    expect(chang).not.toMatch(/className="duo-gt-san"/) // không còn bản thứ hai của khung giám thị
    expect(bpu).toMatch(/<LC\.KhoiDeChang /)
    expect(bpu).not.toMatch(/VungChamDe/)
  })
  it('giám thị + hình vẽ lại vẫn là mảnh nạp lười; Bình Phản Ứng lấy phần chặng qua nhập ĐỘNG (không nhập tĩnh)', () => {
    expect(khoi).toMatch(/lazy\(\(\) => import\('\.\.\/giam-thi\/GiamThi'\)\)/)
    expect(khoi).toMatch(/lazy\(\(\) => import\('\.\.\/hinh-ve\/HinhVeLaiCuaCau'\)\)/)
    expect(bpu).not.toMatch(/^import [^\n]*(?:giam-thi\/GiamThi|hoc-tap\/KhoiDeChang|hoc-tap\/ManLamBaiTap)'/m)
    expect(bpu).toMatch(/void import\('\.\.\/hoc-tap\/ManLamBaiTap'\)/)
  })
  it('kiểu: chỉ gỡ khung «cả màn» của lớp gốc chặng, không khai màu mới', () => {
    const css = readFileSync('src/components/bpu/bpu-hs.css', 'utf8')
    const luat = /\.bpu-hs\.m3 \.ht-app\.ht2-lam\.duo\.bpu-de-chang \{([^}]*)\}/.exec(css)?.[1] ?? ''
    expect(luat).toMatch(/min-height: 0/)
    expect(luat).toMatch(/flex: none/) // không co lại trong thân cuộn ⇒ bong bóng không đè phần trả lời
    expect(luat).not.toMatch(/#[0-9a-f]{3,8}\b|rgb|hsl|color:/i)
  })
})
