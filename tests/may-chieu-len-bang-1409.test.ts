// TỜ MÁY CHIẾU GỌI LÊN BẢNG — hai em một đợt.
//
// Thầy 14/09: "Gộp 2 nút này làm một, thiết kế lại cho tinh tế hiện đại đẹp và
// phù hợp chuẩn google. Tạo cho tôi một nút máy chiếu. Khi bấm nút này sẽ tạo
// ra 1 file html thiết kế theo chuẩn quay ngang được chia làm 2 phần, mỗi một
// trang sẽ in tên 2 học sinh vào 2 nửa và đề bài đi kèm để gọi lên bảng, đề bài
// có nút hiện lời giải, phần dưới trắng để học sinh lên bảng làm ở trên bảng
// khi tôi chiếu lên, file html này xong 1 đợt thì lại kéo xuống hoặc bấm tiếp
// để hiện 2 đề và 2 học sinh tiếp theo."
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { taoHtmlMayChieu, type OBang } from '../src/lib/html-may-chieu'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'

function cau(n: number, phan: 'I' | 'III' = 'I'): CauLuyen {
  return {
    phan,
    id: `D-${phan}-${n}`,
    maDe: 'D',
    chuyenDe: 'Ester – lipid',
    dang: 'bai_tap',
    sao: 2,
    mucDo: 'van_dung',
    text: `Đề bài của câu số ${n} dùng cho buổi chữa.`,
    luaChon: phan === 'I' ? ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'] : null,
    dapAn: phan === 'I' ? 'C' : '306',
    chot: 'Sodium stearate là muối của stearic acid với sodium.',
    lyDo: null,
    buoc: ['Bước một của lời giải.', 'Bước hai của lời giải.'],
    ketQua: phan === 'I' ? 'C' : '306',
  }
}

const O = (i: number, ten: string, phan: 'I' | 'III' = 'I'): OBang => ({
  sbd: `1210${i}`,
  hoTen: ten,
  soCau: i,
  cau: cau(i, phan),
  viSao: 'Em sai dạng này hai lần liên tiếp',
})

describe('Tờ máy chiếu', () => {
  const dsO = [O(1, 'Nguyễn Văn An'), O(2, 'Trần Thị Bình'), O(3, 'Lê Văn Cường', 'III'), O(4, 'Phạm Thị Dung')]
  const html = taoHtmlMayChieu(dsO, { tenBuoi: 'Chữa bài ca 814335', ngay: new Date(2026, 8, 14) })

  it('chia hai em một đợt, bốn em ra hai đợt', () => {
    expect(html.match(/class="mc-dot"/g)).toHaveLength(2)
    expect(html).toContain('Đợt 1/2')
  })

  // Thầy 14/09: "1 đợt là 1 trang chia đôi bảng chứ không cuộn xuống, khi bấm
  // đợt tiếp thì chuyển sang trang tiếp theo theo chiều ngang chứ không theo
  // chiều dọc". Bản trước xếp các đợt chồng dọc rồi cuộn.
  it('lật trang NGANG, mỗi đợt trọn một màn, trang không cuộn dọc', () => {
    expect(html).toContain('<div class="mc-ray" id="mc-ray">')
    expect(html).toContain('.mc-ray { display: flex;')
    expect(html).toContain('scroll-snap-type: x mandatory')
    expect(html).toContain('.mc-dot { flex: 0 0 100%;')
    expect(html).toContain('height: calc(100vh - 61px)')
    // Trang không được cuộn dọc; nửa bảng quá dài thì TỰ nó cuộn.
    expect(html).toContain('body.mc { margin: 0; background: var(--mc-nen); color: var(--mc-muc); overflow: hidden; }')
    expect(html).toContain('overflow-y: auto;')
    // Bấm "Đợt tiếp" phải đi ngang, không kéo trang xuống.
    expect(html).toContain("ray.scrollTo({ left: i * ray.clientWidth, behavior: 'smooth' })")
    // Hàm `den` của tờ chiếu KHÔNG được kéo dọc nữa. (`scrollIntoView` vẫn còn
    // trong JS dùng chung của phiếu, nên chỉ soi đúng hàm này.)
    const den = html.slice(html.indexOf('function den(k)'), html.indexOf('function den(k)') + 400)
    expect(den).not.toContain('scrollIntoView')
  })

  it('mỗi đợt chia đôi màn: nửa trái và nửa phải', () => {
    expect(html.match(/class="mc-nua mc-trai"/g)).toHaveLength(2)
    expect(html.match(/class="mc-nua mc-phai"/g)).toHaveLength(2)
    expect(html).toContain('grid-template-columns: 1fr 1fr')
  })

  it('in đủ tên bốn em và đề bài đi kèm', () => {
    for (const o of dsO) {
      expect(html).toContain(o.hoTen)
      expect(html).toContain(`Đề bài của câu số ${o.soCau}`)
    }
  })

  it('mỗi nửa có nút hiện lời giải riêng, đóng sẵn', () => {
    expect(html.match(/class="mc-nut-giai"/g)).toHaveLength(4)
    expect(html.match(/aria-expanded="false"/g)).toHaveLength(4)
    expect(html.match(/class="mc-giai" id="giai-\d+-(trai|phai)" hidden/g)).toHaveLength(4)
    // Lời giải phải là lời giải THẬT của câu, không phải chữ độn.
    expect(html).toContain('Bước một của lời giải')
    expect(html).not.toContain('Cần chú ý định luật bảo toàn')
  })

  // Thầy 14/09 (lượt 11): "Lời giải hiện trong mục chiếu lên bảng bị lỗi".
  // `oGiaiHtml` trả `<div class="sol-box">`, mà CSS_PHIEU để khối ấy opacity 0
  // và chỉ mở lại bằng `.q-card.mo .sol-box`. Tờ chiếu không có `.q-card` nào
  // nên lời giải nằm đó mà không nhìn thấy.
  it('lời giải trong tờ chiếu KHÔNG bị ẩn bằng opacity', () => {
    expect(html).toContain('.mc-giai .sol-box { opacity: 1 !important; transform: none !important; margin: 0; }')
    // Luật gốc vẫn còn trong CSS_PHIEU — nên luật gỡ phải đứng SAU nó.
    expect(html.indexOf('.sol-box {')).toBeLessThan(html.indexOf('.mc-giai .sol-box'))
    // Và nội dung lời giải thật sự nằm trong khối.
    expect(html).toContain('<div class="sol-box">')
  })

  it('chừa phần dưới trắng cho em viết bảng', () => {
    expect(html.match(/class="mc-trang"/g)).toHaveLength(4)
    expect(html).toContain('.mc-trang { flex: 1 1 auto; min-height: 12vh; }')
  })

  // Thầy 14/09: "cho tôi một nút toàn màn hình ở mục chiếu lên bảng nhé".
  it('có nút toàn màn hình, bật bằng nút hoặc phím F', () => {
    expect(html).toContain('id="mc-toan"')
    expect(html).toContain('Toàn màn hình')
    expect(html).toContain('requestFullscreen')
    expect(html).toContain('webkitRequestFullscreen')
    expect(html).toContain("e.key === 'f' || e.key === 'F'")
    // Đang toàn màn hình thì đổi nhãn, không để thầy đoán đang ở chế độ nào.
    expect(html).toContain('Thoát toàn màn hình')
    // Chiếu lên tường thì thanh điều khiển phải lùi đi.
    expect(html).toContain(':fullscreen .mc-thanh')
  })

  // Thầy 14/09: "nội dung đề bị lỗi chữ" — "Hợp châ ́t", "tiê ́t", "vê ̀ mô ́i".
  // Đề rút từ PDF ra chữ dạng NFD: 'ấ' ghi thành 'â' + U+0301, phông nào không
  // gộp dấu thì vẽ thành hai ký tự rời.
  it('gộp dấu NFD về một ký tự, không để dấu rơi ra đứng riêng', () => {
    const nfd = 'Hợp châ\u0301t 2-methylbutyl ethanoate tiê\u0301t ra vê\u0300 mô\u0301i nguy hiểm'
    const o = taoHtmlMayChieu([{ ...O(1, 'Em A'), cau: { ...cau(1), text: nfd } }], {})
    expect(o).toContain('Hợp chất')
    expect(o).toContain('tiết ra về mối')
    // Không còn ký tự dấu đứng rời nào trong phần đề.
    expect(o).not.toContain('\u0301')
    expect(o).not.toContain('\u0300')
  })

  // Thầy 14/09: "vẫn bị lỗi font, bạn sửa lại triệt để".
  //
  // Đã truy: chữ trong kho sạch (6.843 câu, 0 câu lệch NFC), chữ tờ chiếu sinh
  // ra cũng sạch (ế là đúng một ký tự U+1EBF). Chỗ vỡ nằm ở LÚC VẼ — phông máy
  // chọn thiếu glyph gộp cho chữ hai dấu. Đo trên máy thầy: generic "serif" vẽ
  // 'ế' rộng hơn 'ê' 7,3px; Georgia và Times New Roman thì không.
  it('không mượn --serif của app, chốt phông đủ glyph tiếng Việt', () => {
    // Thứ tự chốt bằng SỐ ĐO trên máy thầy (cỡ 64px, 5 chữ hai dấu so 5 chữ
    // một dấu): generic serif lệch 25,15px · Georgia 1,50px · Times New Roman,
    // Palatino, Charter đều lệch 0. Phông lệch 0 phải đứng trước.
    expect(html).toContain('--mc-serif: "Times New Roman", Palatino, Charter, Georgia, serif')
    expect(html).toContain('.mc-de { font-family: var(--mc-serif);')
    // Generic serif trần là phông vỡ trên máy thầy — không được đứng một mình.
    expect(html).not.toContain('var(--serif, Georgia, serif)')
  })

  it('trang TỰ ĐO phông và tự đổi khi phông vẽ tách dấu', () => {
    expect(html).toContain("rong('ếềồấắ', phong) - rong('êêôââ', phong)")
    expect(html).toContain("document.documentElement.style.setProperty('--mc-serif'")
    // Đổi rồi thì nói ra, không lặng lẽ.
    expect(html).toContain('không vẽ được chữ hai dấu')
  })

  it('chữ trong tờ chiếu là ký tự GỘP, không phải chữ cái cộng dấu rời', () => {
    const o = taoHtmlMayChieu([{ ...O(1, 'Em A'), cau: { ...cau(1), text: 'Glucose phổ biến, tồn tại, chủ yếu, lắc đều' } }], {})
    expect(o).toContain('ph\u1ed5 bi\u1ebfn')
    expect(o).toContain('t\u1ed3n t\u1ea1i')
    expect(o).toContain('ch\u1ee7 y\u1ebfu')
    expect(o).toContain('l\u1eafc \u0111\u1ec1u')
    // Không một dấu tổ hợp nào lọt ra.
    expect(/[\u0300-\u036f]/.test(o)).toBe(false)
  })

  // Thầy 14/09: "số câu còn lại chưa được chữa được chiếu đáp án lên bảng qua
  // mục máy chiếu".
  it('câu chỉ đọc đáp án thành TRANG ĐÁP ÁN nối sau các đợt', () => {
    const dsDapAn = Array.from({ length: 26 }, (_, i) => ({ ...cau(i + 50), dapAn: 'C' }))
    const o = taoHtmlMayChieu([O(1, 'Em A'), O(2, 'Em B')], { dsDapAn })
    // 1 đợt gọi em + 3 trang đáp án (12 + 12 + 2)
    expect(o.match(/class="mc-dot"/g)).toHaveLength(1)
    expect(o.match(/class="mc-dot mc-dot-da"/g)).toHaveLength(3)
    expect(o).toContain('Đáp án các câu còn lại')
    expect(o).toContain('1–12 trong 26 câu')
    expect(o).toContain('25–26 trong 26 câu')
    expect(o).toContain('26 câu chỉ đọc đáp án')
    // Trang đáp án chiếm trọn bề ngang, không chia đôi bảng.
    expect(o).toContain('.mc-dot-da { grid-template-columns: 1fr; }')
  })

  it('không có câu đọc đáp án thì không sinh trang thừa', () => {
    const o = taoHtmlMayChieu([O(1, 'Em A')], {})
    // Luật CSS vẫn nằm trong bảng kiểu; thứ KHÔNG được có là TRANG.
    expect(o).not.toContain('class="mc-dot mc-dot-da"')
    expect(o).not.toContain('Đáp án các câu còn lại')
    expect(o).not.toContain('chỉ đọc đáp án')
  })

  it('in ra thì quay ngang A4', () => {
    expect(html).toContain('size: A4 landscape')
  })

  it('có nút sang đợt tiếp và kéo tay cũng đếm đúng', () => {
    expect(html).toContain('id="mc-sau"')
    expect(html).toContain('id="mc-truoc"')
    // Kéo tay trên ray ngang cũng phải cập nhật số đợt.
    expect(html).toContain("ray.addEventListener('scroll'")
    expect(html).toContain('Math.round(ray.scrollLeft / Math.max(1, ray.clientWidth))')
    expect(html).toContain("e.key === 'ArrowRight'")
  })

  it('lẻ một em thì để trắng nửa kia, KHÔNG bịa thêm em', () => {
    const le = taoHtmlMayChieu([O(1, 'Nguyễn Văn An')], {})
    expect(le).toContain('mc-trong')
    expect(le).toContain('Đợt này chỉ gọi một em')
    expect(le.match(/class="mc-nut-giai"/g)).toHaveLength(1)
  })
})

describe('Màn Gọi lên bảng', () => {
  const src = readFileSync(join(process.cwd(), 'src/screens/GoiLenBangScreen.tsx'), 'utf8')
  const than = src.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')

  it('chỉ còn MỘT nút chính, chạy cả xếp giờ lẫn phân công', () => {
    expect(than).toContain('Xếp giờ &amp; phân công lên bảng')
    expect(than).toContain('onClick={chayCaHai}')
    expect(than).toContain('const chayCaHai = () => {')
    // Hai nút cũ đã đi.
    expect(than).not.toContain('Phân công lên bảng ({soCoMat} em)')
    expect(than).not.toContain('Xếp giờ ({dsCau.length} câu')
  })

  it('có nút máy chiếu, chỉ hiện khi đã có bảng phân công', () => {
    expect(than).toContain('Chiếu lên bảng')
    expect(than).toContain('{kq && kq.phanCong.length > 0 && (')
    expect(than).toContain('void moMayChieu()')
  })

  it('tờ chiếu lấy đúng bảng phân công vừa chạy, câu không tra được thì báo', () => {
    // Sửa 14/09: nguồn ưu tiên là BUỔI CHỮA mới (`kqBuoi`); chưa xếp thì mới
    // lùi về bảng phân công cũ. Tờ chiếu không bao giờ tự rút bộ câu khác.
    // 14/09 lượt 10: `dsPc` mang thêm dữ liệu bài tập về nhà nên phải khai
    // kiểu tường minh, không viết gọn một dòng được nữa. Ý ĐỊNH giữ nguyên:
    // nguồn ưu tiên vẫn là `kqBuoi`, và vẫn lùi về `kq.phanCong` khi chưa xếp.
    expect(than).toMatch(/const dsPc:[\s\S]{0,400}\}\[\] = kqBuoi/)
    expect(than).toContain('(kq?.phanCong ?? [])')
    expect(than).toContain('chưa tra được đề')
  })
})
