// BỐN VIỆC THẦY BÁO 08/09, ĐỢT 4.
//
//   1. "câu em từng sai không nằm trong kho ca này nghĩa là như thế nào?"
//      → Đọc ca 638242: đề chỉ 8 câu phần I mà cần 9 câu lặp. Câu thứ 9 CÓ
//      trong kho, chỉ là hết chỗ. Nhãn cũ gán nhầm thành "ngoài kho", nên thầy
//      đi tìm câu thiếu trong kho trong khi kho không thiếu gì.
//   2. "video nút đúng sai bấm không nhạy, nút Đ bấm mãi không được"
//      → Ô Đ/S chỉ 34×30px, dưới ngưỡng 44px, lại cách nhau 10px.
//   3. "ý của tôi là đổi màu cả 2 chỗ này nữa" (bìa + khối Tổng quan)
//      → Hai dải màu đó GÕ CỨNG mã màu navy, không dùng biến, nên 7 sắc không
//      ăn vào.
import { describe, expect, it } from 'vitest'
import { dungPhieu } from '../src/lib/html-phieu'
import { CHU_LY_DO_THIEU, dungDeRieng, type CaTruocDaCham } from '../src/lib/de-rieng'
import { PHAN_DE, type CauUngVien, type PhanDe, type YeuCauRut } from '../src/lib/rut-de'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'

const cauLuyen = (id: string, phan: 'I' | 'II' | 'III'): CauLuyen =>
  ({
    id,
    phan,
    text: 'Câu ' + id,
    luaChon: phan === 'III' ? undefined : ['a', 'b', 'c', 'd'],
    dapAn: phan === 'II' ? 'ĐSĐS' : phan === 'III' ? '12,5' : 'A',
    mucDo: 'biet',
    chuyenDe: 'Ester – lipid',
    loiGiai: { buoc: ['B1'], dapAn: 'A' },
  }) as unknown as CauLuyen

const TT = { hoTen: 'Đỗ Đại Học', sbd: '12121212', ngay: new Date('2026-09-08'), tenChuyenDe: 'Ester – lipid', ketQua: '', hienDapAn: false }
const NOP = { ma: 'abcd1234', sbd: '12121212', url: 'https://x' }
const CAU = [cauLuyen('q1', 'I'), cauLuyen('q2', 'II'), cauLuyen('q3', 'III')]

// ----------------------------------------------------------------------- 1
function uv(phan: PhanDe, i: number): CauUngVien {
  return { phan, id: `${phan}-${i}`, maDe: 'de1', soGoc: i, chuyenDe: 'Ester – lipid', mucDo: 'hieu', dang: 'chua_ro', text: `Câu ${phan}-${i}`, coHinh: false, canXem: false, sao: 0, lyDoSao: '' }
}

describe('NÓI ĐÚNG VÌ SAO THIẾU CÂU HỎI LẠI', () => {
  const UV: Record<PhanDe, CauUngVien[]> = {
    I: Array.from({ length: 40 }, (_, k) => uv('I', k)),
    II: Array.from({ length: 20 }, (_, k) => uv('II', k)),
    III: Array.from({ length: 20 }, (_, k) => uv('III', k)),
  }

  it('ĐỀ HẾT CHỖ: câu CÓ trong kho nhưng phần đó đã kín ⇒ "het_cho", KHÔNG phải "ngoai_kho"', () => {
    // Đúng hình dạng ca 638242: đề bé, em sai nhiều. Đề chỉ 2 câu phần I mà em
    // sai 10 câu phần I ⇒ cần 3, nhét được 2.
    const sai10 = Array.from({ length: 10 }, (_, k) => `I-${k}`)
    const ca: CaTruocDaCham = { maCa: 'ca-truoc', daLamCua: { '12121212': [...sai10, 'I-30'] }, saiCua: { '12121212': sai10 } }
    const yc: YeuCauRut = { soCau: { I: 2, II: 1, III: 1 }, chuyenDe: [], mucDo: [], tranhQid: [], seed: 7 }
    const ra = dungDeRieng({ uv: UV, yc, dsSbd: ['12121212'], dsCa: [ca] })
    expect(ra.canCua['12121212']).toBe(3)
    expect(ra.soLapCua['12121212']).toBe(2)
    const t = ra.thieuLap.find((x) => x.sbd === '12121212')
    expect(t?.lyDo).toBe('het_cho')
  })

  it('NGOÀI KHO: câu em sai KHÔNG có trong kho ca ⇒ vẫn là "ngoai_kho"', () => {
    // Câu sai mang mã lạ, không câu nào trong kho trùng.
    const sai = ['LA-1', 'LA-2', 'LA-3', 'LA-4', 'LA-5', 'LA-6', 'LA-7', 'LA-8', 'LA-9', 'LA-10']
    const ca: CaTruocDaCham = { maCa: 'ca-truoc', daLamCua: { '12121212': [...sai, 'I-0'] }, saiCua: { '12121212': sai } }
    const yc: YeuCauRut = { soCau: { I: 8, II: 2, III: 2 }, chuyenDe: [], mucDo: [], tranhQid: [], seed: 7 }
    const ra = dungDeRieng({ uv: UV, yc, dsSbd: ['12121212'], dsCa: [ca] })
    expect(ra.soLapCua['12121212']).toBe(0)
    expect(ra.thieuLap.find((x) => x.sbd === '12121212')?.lyDo).toBe('ngoai_kho')
  })

  it('hai lý do nói hai chuyện khác nhau, không dùng chung một câu chữ', () => {
    expect(CHU_LY_DO_THIEU.het_cho).toBe('đề không đủ chỗ — phần đó đã kín câu hỏi lại')
    expect(CHU_LY_DO_THIEU.ngoai_kho).toBe('câu em từng sai không nằm trong kho ca này')
    expect(CHU_LY_DO_THIEU.het_cho).not.toBe(CHU_LY_DO_THIEU.ngoai_kho)
  })
})

// ----------------------------------------------------------------------- 2
describe('Ô Đ/S BẤM ĐƯỢC BẰNG NGÓN TAY', () => {
  const html = dungPhieu(TT, CAU, { nop: NOP })

  it('phiếu làm bài mang lớp co-lam', () => {
    expect(html).toContain('<body class="co-lam chua-nop">')
  })

  it('ô Đ/S đủ 44px trở lên — ô cũ 34×30 là dưới ngưỡng ngón tay', () => {
    expect(html).toContain('body.co-lam .tf-badge { width: 46px; height: 44px; border-radius: 10px; font-size: 15px; position: relative; }')
    const khoi = html.slice(html.indexOf('body.co-lam .tf-badge {'))
    const cao = /height:\s*(\d+)px/.exec(khoi)
    const rong = /width:\s*(\d+)px/.exec(khoi)
    expect(Number(cao?.[1])).toBeGreaterThanOrEqual(44)
    expect(Number(rong?.[1])).toBeGreaterThanOrEqual(44)
  })

  it('hai ô cách nhau rộng hơn, và cột tiêu đề Đ/S giãn theo cho thẳng hàng', () => {
    expect(html).toContain('body.co-lam .tf-o { gap: 12px; }')
    expect(html).toContain('body.co-lam .tf-head span { width: 46px; }')
  })

  it('KHÔNG chờ chạm đúp, và chạm giữ không bôi đen chữ', () => {
    const khoi = html.slice(html.indexOf('.lam-o {'), html.indexOf('.q-opt.lam-o {'))
    expect(khoi).toContain('touch-action: manipulation;')
    expect(khoi).toContain('-webkit-user-select: none; user-select: none;')
  })

  it('Ô CHỌN LÀ THẺ <button> THẬT, không phải div gắn sự kiện', () => {
    // Bốn lần thầy báo "nút bấm được nút không". Nền của bản sửa này là dùng
    // phần tử tương tác gốc, để trình duyệt lo phần của nó.
    expect(html).toContain('<button type="button" class="q-opt')
    expect(html).toContain('<button type="button" class="tf-badge')
    // Trong button chỉ được có nội dung dòng — nhét div vào là HTML sai chuẩn
    // và đo được: cả phương án phần I mất hẳn cú bấm.
    expect(html).toContain('<span class="q-opt-letter">')
    expect(html).not.toContain('<button type="button" class="q-opt dung lam-o" data-chon="A"><div')
    // Không tự bắt bàn phím nữa: button tự nhận Enter và Space rồi phát click.
    expect(html).not.toContain("e.key !== 'Enter'")
  })

  it('PHIẾU ĐỌC vẫn là div, không mọc thêm nút nào', () => {
    const doc = dungPhieu(TT, CAU)
    expect(doc).not.toContain('<button type="button" class="q-opt')
    expect(doc).not.toContain('<button type="button" class="tf-badge')
    expect(doc).toContain('<div class="q-opt')
  })

  it('LƯỚI AN TOÀN nghe touchend — Chromium huỷ click kể cả trên thẻ button', () => {
    // Đo bằng Chromium có cảm ứng, ghi nhật ký từng sự kiện: tay xê chừng 18px
    // thì KHÔNG có pointerup, KHÔNG có click, chỉ còn touchend. Mọi cách vá ở
    // tầng pointerup/click đều vô nghĩa vì không có sự kiện nào để bắt.
    expect(html).toContain("document.addEventListener('touchstart', function (e) {")
    expect(html).toContain("document.addEventListener('touchend', function (e) {")
    expect(html).toContain('{ passive: true, capture: true }')
    // Không nghe pointer — nghe cả pointer lẫn touch là một cú chạm ăn hai lần.
    expect(html).not.toContain("document.addEventListener('pointerdown'")
    expect(html).not.toContain("document.addEventListener('pointerup'")
    // Và không còn con số ngưỡng đoán mò nào.
    expect(html).not.toContain('Math.sqrt(dx * dx + dy * dy)')
  })

  it('HỎI TOẠ ĐỘ, không hỏi e.target — chạm di động bị pointer capture ngầm', () => {
    expect(html).toContain('var el = document.elementFromPoint(t.clientX, t.clientY);')
    expect(html).toContain('function oTaiCham(t) {')
    // Nhấc tay ở ô KHÁC thì không tính.
    expect(html).toContain('if (!o || o !== d.o) return;')
  })

  it('CUỘN THẬT thì không tính là bấm — so mốc cuộn trước và sau', () => {
    expect(html).toContain('function cuonY() {')
    expect(html).toContain('if (Math.abs(cuonY() - d.cuon) > 8) return;')
  })

  it('KHÔNG ĂN HAI LẦN — chặn click giả tại nguồn, KHÔNG khoá theo thời gian', () => {
    // Khoá theo thời gian nuốt mất cú bấm lại cùng một ô để BỎ CHỌN; phép kiểm
    // bấm thật trong DOM bắt được ngay. Nay chặn thẳng cú click giả sau touchend.
    expect(html).toContain('if (e.cancelable) e.preventDefault();')
    expect(html).toContain('{ passive: false, capture: true }')
    expect(html).not.toContain('lucVuaChon')
    expect(html).not.toContain('if (Date.now() - vuaChon < 700) return;')
  })

  it('VÙNG CHẠM rộng hơn ô nhìn thấy, nhưng không chồng sang ô bên cạnh', () => {
    expect(html).toContain("body.co-lam .tf-badge.lam-o::after { content: ''; position: absolute; inset: -6px; border-radius: 14px; }")
    // Nới 6px mỗi phía, hai ô cách nhau 12px ⇒ vừa khít, không chồng.
    expect(html).toContain('body.co-lam .tf-o { gap: 12px; }')
  })

  it('CUỘN KHÔNG PHẢI BẤM, và chấm xong thì khoá tay', () => {
    expect(html).toContain('.q-card.da-cham .lam-o, .q-card.da-cham .lam-nhap { pointer-events: none; opacity: .95; }')
    // `daNop` chặn cả ba đường vào.
    // Mốc cuối là dòng của khối bàn phím: `keydown` đầu tiên trong phiếu là
    // của menu PDF, nằm TRƯỚC khối làm bài, cắt theo nó ra chuỗi rỗng.
    const kv = html.slice(html.indexOf("document.addEventListener('touchstart'"), html.indexOf('KHÔNG có khối bàn phím riêng'))
    expect((kv.match(/if \(daNop/g) || []).length).toBeGreaterThanOrEqual(3)
  })

  it('BÀN PHÍM do chính thẻ button lo, không có khối bắt phím riêng', () => {
    // Thẻ button tự nhận Enter và Space rồi tự phát click. Tự bắt thêm là ăn
    // hai lần — chọn xong tự bỏ chọn ngay.
    expect(html).toContain('KHÔNG có khối bàn phím riêng')
    expect(html).not.toContain('chonO(oPhim);')
    expect(html).not.toContain('oPhim.click();')
  })

  it('PHIẾU ĐỌC giữ nguyên khổ cũ — không có co-lam thì không phóng to ô nào', () => {
    const doc = dungPhieu(TT, CAU)
    expect(doc).toContain('<body>')
    expect(doc).not.toContain('co-lam"')
    // Luật phóng to vẫn nằm trong bảng kiểu nhưng không có lớp nào kích hoạt.
    expect(doc).toContain('body.co-lam .tf-badge {')
  })
})

// ----------------------------------------------------------------------- 3
describe('BÌA VÀ KHỐI TỔNG QUAN CŨNG ĐỔI MÀU', () => {
  const html = dungPhieu(TT, CAU, { nop: NOP })

  it('hai dải màu dùng BIẾN, không gõ cứng mã màu navy', () => {
    expect(html).toContain('background: linear-gradient(150deg, var(--nav) 0%, var(--nav-2) 52%, var(--luc) 100%);')
    expect(html).toContain('background: linear-gradient(135deg, var(--nav) 0%, var(--nav-2) 55%, var(--luc) 100%);')
  })

  it('KHÔNG còn mã màu navy gõ cứng trong hai dải đó', () => {
    expect(html).not.toContain('linear-gradient(150deg, #0f3057')
    expect(html).not.toContain('linear-gradient(135deg, #0f3057 0%, #00587a 55%')
  })

  it('bảy sắc vẫn còn nguyên và vẫn đổi đủ ba biến mà hai dải màu cần', () => {
    for (let i = 1; i <= 7; i++) {
      const d = html.slice(html.indexOf(`body[data-mau="${i}"] {`))
      const khoi = d.slice(0, d.indexOf('}'))
      for (const bien of ['--nav:', '--nav-2:', '--luc:']) expect(khoi).toContain(bien)
    }
  })
})
