// @vitest-environment node
// CỬA HÀNG PHỤ KIỆN · B1 — KHOÁ NGUỒN: (h) không hex, chữ tiếng Việt hiển thị CHỈ ở chu-shop.ts, chữ chốt mục 9 đúng từng chuỗi, tiền tố `ps-` (không đụng lớp `pk-` của Code 4),
// luật thiết kế (không backdrop-filter thẻ, chỉ transform/opacity, tối đa 3 chuyển động, giảm chuyển động), luật kinh tế (máy em không tự tính số dư, không ngẫu nhiên), dung lượng.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import * as chu from '../src/game/than-thu-v2/shop/chu-shop'
import { loiMayChu } from '../src/game/than-thu-v2/shop/chu-shop'

const goc = process.cwd()
const DIR = 'src/game/than-thu-v2/shop'
const doc = (p: string) => fs.readFileSync(path.join(goc, p), 'utf8')
const TEP = fs.readdirSync(path.join(goc, DIR)).map((f) => `${DIR}/${f}`)
const MA = TEP.filter((f) => /\.(ts|tsx)$/.test(f))
const CSS_TEP = TEP.filter((f) => f.endsWith('.css'))
const MAN_HINH = MA.filter((f) => !/xem-thu\./.test(f)) // trang xem thử chỉ dùng khi dev
const bo = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1').replace(/<!--[\s\S]*?-->/g, '')
const DAU = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i
const CSS = doc(`${DIR}/shop.css`)

describe('(h) khoá nguồn: màu · chữ · tiền tố', () => {
  it('không mã màu hex ở bất kỳ tệp nào của shop (chỉ rgb()/biến) — `npm run check:mau` cũng giữ', () => {
    for (const f of TEP) expect(doc(f).match(/#[0-9a-fA-F]{3,8}\b/g), f).toBeNull()
  })

  it('chữ tiếng Việt hiển thị CHỈ nằm ở chu-shop.ts: mọi tệp TS/TSX/CSS/HTML khác không có ký tự có dấu ngoài chú thích', () => {
    const co: string[] = []
    for (const f of TEP) {
      if (f.endsWith('chu-shop.ts')) continue
      const s = bo(doc(f))
      const dong = s.split('\n').filter((l) => DAU.test(l))
      if (dong.length) co.push(`${f}: ${dong.slice(0, 3).map((l) => l.trim().slice(0, 90)).join(' ⏎ ')}`)
    }
    expect(co, co.join('\n')).toEqual([])
    expect(DAU.test(bo(doc(`${DIR}/chu-shop.ts`)))).toBe(true) // và chu-shop.ts thật sự chứa chữ
  })

  it('tiền tố riêng `ps-` / `.ps`: không còn `pk-` / `.pk` ở shop (đụng lớp mặc đồ của Code 4) — kể cả tệp test shop-*', () => {
    const tep = [...TEP, ...fs.readdirSync(path.join(goc, 'tests')).filter((f) => /^shop-(logic|man|bo-cuc|khoa-nguon)-2109\.test\.tsx$/.test(f)).map((f) => `tests/${f}`)]
    for (const f of tep) {
      const s = bo(doc(f)).replace(/phu-kien|PHU_KIEN|phuKien|pk-\.\.\.|`pk-`/g, '')
      // ngoại lệ: chính tệp này nêu tiền tố cũ trong regex/chuỗi mô tả
      if (f.endsWith('shop-khoa-nguon-2109.test.tsx')) continue
      expect(s.match(/(?<![\w-])pk-|\.pk(?![\w-])|"pk"|'pk'/g), f).toBeNull()
    }
    // mọi bộ chọn của shop.css bắt đầu bằng `.ps` (hoặc :root … .ps); keyframes đặt tên `ps-…`
    const s = CSS.replace(/\/\*[\s\S]*?\*\//g, '')
    const kf = [...s.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]!)
    expect(kf.length).toBeGreaterThanOrEqual(5)
    for (const k of kf) expect(k, 'keyframes').toMatch(/^ps-/)
    // bỏ khối keyframes rồi kiểm từng bộ chọn
    let r = ''
    let sau = 0
    for (const m of s.matchAll(/@keyframes\s+[\w-]+\s*\{/g)) {
      r += s.slice(sau, m.index)
      let d = 1
      let i = m.index! + m[0].length
      while (d > 0 && i < s.length) d += s[i] === '{' ? 1 : s[i] === '}' ? -1 : 0, i++
      sau = i
    }
    r += s.slice(sau)
    r = r.replace(/@[\w-]+[^{}]*\{/g, '') // đầu khối @media không phải bộ chọn
    // tách theo dấu phẩy NGOÀI ngoặc (`:is(a, b)` là một bộ chọn)
    const tach = (b: string) => {
      const ra: string[] = []
      let d = 0
      let dau = 0
      for (let i = 0; i < b.length; i++) {
        if (b[i] === '(') d++
        else if (b[i] === ')') d--
        else if (b[i] === ',' && d === 0) (ra.push(b.slice(dau, i).trim()), (dau = i + 1))
      }
      ra.push(b.slice(dau).trim())
      return ra
    }
    const boChon = [...r.matchAll(/([^{}]+)\{/g)].map((m) => m[1]!.trim()).filter((x) => x)
    const sai = boChon.flatMap(tach).filter((x) => x && !/^(:root(:not\(\[data-giao-dien='sang'\]\)|\[data-giao-dien='toi'\])? )?\.ps(-|(?![\w-]))/.test(x))
    expect(sai, `bộ chọn không có tiền tố .ps: ${sai.slice(0, 5).join(' | ')}`).toEqual([])
  })

  it('hai khối token TỐI (theo hệ thống và ép `data-giao-dien=toi`) GIỐNG HỆT nhau; khối sáng có đủ cùng tên biến', () => {
    const khoi = (re: RegExp) => re.exec(CSS)![1]!.split(';').map((x) => x.trim()).filter((x) => x.startsWith('--')).sort()
    const heThong = khoi(/@media \(prefers-color-scheme: dark\) \{\s*:root:not\(\[data-giao-dien='sang'\]\) \.ps \{([^}]*)\}/)
    const ep = khoi(/:root\[data-giao-dien='toi'\] \.ps \{([^}]*)\}/)
    expect(heThong.length).toBeGreaterThan(20)
    expect(heThong).toEqual(ep)
    const sang = khoi(/\n\.ps \{\s*color-scheme: light;([^}]*)\}/)
    const ten = (l: string[]) => l.map((x) => x.split(':')[0]!.trim())
    for (const t of ten(heThong)) expect(ten(sang), `thiếu ${t} ở khối sáng`).toContain(t)
    // 5 bậc: đủ màu + chữ ở cả hai chế độ
    for (const b of [1, 2, 3, 4, 5]) for (const k of ['c', 't']) expect(ten(heThong)).toContain(`--ch-b${b}${k}`)
  })
})

describe('chữ chốt mục 9 (DE-XUAT-SHOP-PHU-KIEN-2109.md): từng chuỗi đúng từng chữ', () => {
  const D = doc('DE-XUAT-SHOP-PHU-KIEN-2109.md')
  const BANG: [string, string, string][] = [
    ['N1', chu.chuCuaHang, 'Cửa hàng'],
    ['N1', chu.chuCuaHangPhu, 'Sắm đồ cho thần thú · Mùa 1, tới hết học kỳ I'],
    ['N2', chu.chuThuDo, 'Thử đồ'],
    ['N2', chu.chuThuDoPhu, 'Thử thoải mái, không mất vàng'],
    ['N3', chu.chuTuDo, 'Tủ đồ'],
    ['N3', chu.chuTuDoPhu, 'Đồ em đã mua, giữ mãi'],
    ['N4', chu.chuVangCuaEm, 'Vàng của em'],
    ['N4', chu.chuVangSo(340), '340 vàng'],
    ['N5', `${chu.chuOngNghiemCo} ${chu.chuExp(620)} · ${chu.chuDuTruDu} ${chu.chuNgayAn(3)}`, 'Ống nghiệm có 620 EXP · Dự trữ đủ 3 ngày ăn'],
    ['N6', chu.chuDoiVang, 'Đổi vàng'],
    ['N6', chu.chuDoiVangPhu, 'EXP thừa trong ống nghiệm đổi được thành vàng.'],
    ['N7', chu.chuGhiChuDoi(200), '1 EXP thừa = 1 vàng. Thần thú luôn giữ lại 200 EXP, đủ ăn 1 ngày.'],
    ['N8', chu.chuTruocKhiDoi, 'Trước khi đổi'],
    ['N8', chu.chuSauKhiDoi, 'Sau khi đổi'],
    ['N8', chu.chuDuNgayAn(620, 3), '620 EXP · đủ 3 ngày ăn'],
    ['mục 4', chu.chuDoiThanh(180), '180 EXP thành 180 vàng'],
    ['N9', chu.chuDatDan, 'Đắt dần:'],
    ['N9', Object.values(chu.TEN_BAC).join(' · '), 'Thường · Đẹp · Hiếm · Sử thi · Huyền thoại'],
    ['9.2', Object.values(chu.TEN_O).join(' · '), 'Vòng sáng · Đuôi sáng · Khung tên · Trên đầu · Trên lưng'],
    ['N10', chu.chuChoDeo('hao-quang'), 'Chỗ đeo: Vòng sáng'],
    ['N10', `${chu.chuGia} · ${chu.chuCanCo} · ${chu.chuSoLuong} · ${chu.chuBatMi}`, 'Giá · Cần có · Số lượng · Bật mí Hoá học'],
    ['N11', chu.chuDangThuDanhSach, 'Em đang thử · chạm một món để xem kỹ'],
    ['N12', chu.chuDangThu(3), 'Đang thử 3 phụ kiện'],
    ['N12', chu.chuDoThanThuDangMac, 'Đồ thần thú đang mặc'],
    ['B1', chu.chuNutDoi(180), 'Đổi 180 EXP lấy 180 vàng'],
    ['B1', chu.chuNutDoiXacNhan(180), 'Đổi 180 EXP'],
    ['B2', chu.chuNutMua(120), 'Mua · 120 vàng'],
    ['B3', chu.chuDeSau, 'Để sau'],
    ['B4', `${chu.chuMacNgay} · ${chu.chuCoiRa}`, 'Mặc ngay · Cởi ra'],
    ['B6', chu.chuBoThu, 'Bỏ thử món này'],
    ['B7', `${chu.chuToiCuaHang} · ${chu.chuXemCuaHang} · ${chu.chuTuDo}`, 'Tới Cửa hàng · Xem Cửa hàng · Tủ đồ'],
    ['B8', chu.chuThuLai, 'Thử lại'],
    ['B9', chu.chuKeoThanh, 'Kéo thanh để chọn số EXP'],
    ['B9', chu.chuChuaCoExpThua, 'Chưa có EXP thừa để đổi'],
    ['C1', chu.chuChao[0], 'Chào em tới Cửa hàng.'],
    ['C2', chu.chuChao[1], 'EXP thừa đổi thành vàng. Vàng mua đồ cho thần thú.'],
    ['C3', chu.chuChao[2], 'Phụ kiện chỉ để đẹp, không làm thần thú mạnh hơn.'],
    ['C4', chu.chuChao[3], 'Vàng chỉ đến từ việc học. Không nạp tiền, không xin bạn được.'],
    ['T2', chu.chuTuHao, 'Cả đoàn sẽ thấy thần thú của em y như thế này. Bảng vinh danh cũng vậy.'],
    ['X1', chu.chuXacNhanDoi(180, 2), 'Thần thú bớt 180 EXP dự trữ, vẫn đủ 2 ngày ăn. Em nhận 180 vàng, đổi rồi không đổi ngược lại được.'],
    ['X2', chu.chuXacNhanMua(120, 220), 'Em trả 120 vàng, còn lại 220 vàng. Mua rồi giữ mãi, không trả lại hay bán lại được.'],
    ['M1', chu.chuMuaXong('Đuôi Lửa Tím', 220), 'Hợp quá! Đuôi Lửa Tím đã là của em. Em còn 220 vàng.'],
    ['M2', chu.chuMonKe('Vòng Lửa Vàng', 150), 'Em vẫn đủ vàng cho Vòng Lửa Vàng, giá 150 vàng.'],
    ['M3', chu.chuDoiXong(520, 2), 'Đã đổi xong. Em có 520 vàng, thần thú vẫn đủ 2 ngày ăn.'],
    ['M4', `${chu.chuDaMac('Khung Ô Nguyên Tố')} ${chu.chuDaCoi('Khung Ô Nguyên Tố')}`, 'Đã mặc Khung Ô Nguyên Tố. Đã cởi Khung Ô Nguyên Tố.'],
    ['D1', chu.chuChiDuongDuExp, 'Em có đủ EXP thừa. Đổi vàng là mua được.'],
    ['D2', chu.chuChiDuongNgay(13), 'Học đều khoảng 13 ngày nữa là đủ vàng.'],
    ['D3', chu.chuChiDuongChuoi(5), 'Giữ chuỗi thêm 5 ngày nữa là mở.'],
    ['D4', chu.chuChiDuongAn(2), 'Kiếm thêm 2 ấn thạch sáng ở Đoàn Hộ Tống là mở.'],
    ['D5', chu.chuChiDuongNhiemVu, 'Làm nhiệm vụ hôm nay để ống nghiệm đầy thêm.'],
    ['9.2', Object.values(chu.chuTrangThai).join(' · '), 'Đang thử · Đủ vàng rồi · Đã có · Đang mặc · Đã hết'],
    ['9.2', chu.chuThieuVang(260), 'Chưa đủ vàng — còn thiếu 260 vàng'],
    ['9.2', chu.chuCanChuoiNgan(14, 5), 'Cần chuỗi 14 ngày + 5 ấn thạch sáng'],
    ['S1', chu.chuCanDai([chu.chuKhoaChuoiDai(14, 9)]), 'Cần chuỗi 14 ngày (em đang chuỗi 9 ngày)'],
    ['S2', chu.chuCanDai([chu.chuKhoaAnDai(5, 3)]), 'Cần 5 ấn thạch sáng (em đang có 3 ấn thạch)'],
    ['S3', chu.chuSoLuongDai(12, 30), 'Chỉ còn 12 cái · mùa 1 có 30 cái'],
    ['S3', chu.chuChiCon(12), 'Chỉ còn 12 cái'],
    ['S3', chu.chuMuaChiCo(25), 'Mùa 1 chỉ có 25 cái'],
    ['S4', chu.chuChuaMuaDuoc('Cần chuỗi 14 ngày (em đang chuỗi 9 ngày)'), 'Chưa mua được — cần chuỗi 14 ngày (em đang chuỗi 9 ngày)'],
    ['R1', chu.chuTuDoTrong, 'Tủ đồ còn trống. Ghé Cửa hàng chọn món đầu tiên, có món chỉ 20 vàng.'],
    ['R2', chu.chuOTrong, 'Chưa có món nào cho chỗ này.'],
    ['R3', chu.chuChuaThuMon, 'Em chưa thử món nào. Chạm một phụ kiện ở Cửa hàng, thần thú mặc thử liền.'],
    ['R4', chu.chuChuaCoExpThuaLoi(200), 'Chưa có EXP thừa. Thần thú cần giữ 200 EXP để ăn.'],
    ['L1', loiMayChu.duoiNguong(200, 420), 'Thần thú cần giữ lại 200 EXP để ăn. Em đổi được tối đa 420 EXP.'],
    ['L2', loiMayChu.thieuVang(260), 'Chưa đủ vàng — còn thiếu 260 vàng.'],
    ['L3', loiMayChu.chuaMo(14, 9), 'Món này cần chuỗi 14 ngày. Em đang chuỗi 9 ngày.'],
    ['L4', loiMayChu.hetSuat(30), 'Món này đã hết. Mùa 1 chỉ có 30 cái.'],
    ['L5', loiMayChu.daCo, 'Em đã có món này rồi. Vào Tủ đồ để mặc.'],
    ['L6', loiMayChu.giaDoi, 'Giá vừa thay đổi, em xem lại rồi mua nhé.'],
    ['L7', loiMayChu.tamDong, 'Cửa hàng đang tạm đóng. Đồ em đã mua vẫn còn nguyên.'],
    ['L8', loiMayChu.chuaCo, 'Em chưa có món này nên chưa mặc được.'],
    ['L9', chu.chuMatMang, 'Mất mạng rồi. Có mạng lại mới mua được, em vẫn xem được Tủ đồ.'],
    ['L10', chu.chuLoiKhongRo, 'Cửa hàng chưa tải được. Em bấm Thử lại nhé.'],
  ]
  for (const [ma, thuc, mong] of BANG) it(`[${ma}] ${mong.slice(0, 60)}`, () => expect(thuc).toBe(mong))

  it('các câu tĩnh của mục 9 còn ĐÚNG NGUYÊN VĂN trong đề xuất (Boss đổi chữ ở đề xuất mà chưa đổi chu-shop.ts ⇒ đỏ ở đây)', () => {
    const tinh = [
      'Sắm đồ cho thần thú · Mùa 1, tới hết học kỳ I', 'Thử thoải mái, không mất vàng', 'Đồ em đã mua, giữ mãi', 'EXP thừa trong ống nghiệm đổi được thành vàng.', '1 EXP thừa = 1 vàng. Thần thú luôn giữ lại 200 EXP, đủ ăn 1 ngày.',
      'Em đang thử · chạm một món để xem kỹ', 'Đồ thần thú đang mặc', 'Chào em tới Cửa hàng.', 'EXP thừa đổi thành vàng. Vàng mua đồ cho thần thú.', 'Phụ kiện chỉ để đẹp, không làm thần thú mạnh hơn.',
      'Vàng chỉ đến từ việc học. Không nạp tiền, không xin bạn được.', 'Cả đoàn sẽ thấy thần thú của em y như thế này. Bảng vinh danh cũng vậy.', 'Em có đủ EXP thừa. Đổi vàng là mua được.', 'Làm nhiệm vụ hôm nay để ống nghiệm đầy thêm.',
      'Tủ đồ còn trống. Ghé Cửa hàng chọn món đầu tiên, có món chỉ 20 vàng.', 'Chưa có món nào cho chỗ này.', 'Em chưa thử món nào. Chạm một phụ kiện ở Cửa hàng, thần thú mặc thử liền.', 'Cửa hàng đang tạm đóng. Đồ em đã mua vẫn còn nguyên.',
      'Mất mạng rồi. Có mạng lại mới mua được, em vẫn xem được Tủ đồ.', 'Cửa hàng chưa tải được. Em bấm Thử lại nhé.', 'Em đã có món này rồi. Vào Tủ đồ để mặc.', 'Giá vừa thay đổi, em xem lại rồi mua nhé.', 'Em chưa có món này nên chưa mặc được.',
      'Kéo thanh để chọn số EXP', 'Chưa có EXP thừa để đổi', 'Bỏ thử món này', 'Bật mí Hoá học', 'Đắt dần:',
    ]
    for (const t of tinh) {
      expect(D.includes(t), `đề xuất không còn câu: ${t}`).toBe(true)
      expect(doc(`${DIR}/chu-shop.ts`).includes(t.replace(/^1 EXP thừa = 1 vàng\. Thần thú luôn giữ lại 200 EXP, đủ ăn 1 ngày\.$/, '1 EXP thừa = 1 vàng. Thần thú luôn giữ lại ${so(giuLai)} EXP, đủ ăn 1 ngày.')) || /\d/.test(t), `chu-shop.ts thiếu câu: ${t}`).toBe(true)
    }
  })

  it('chuỗi nào mục 9 KHÔNG có đều đánh dấu `// CHỜ MỤC 9` (danh sách khoá để báo Boss); giọng văn: một dấu chấm than, không chữ gợi cờ bạc / quảng cáo', () => {
    const src = doc(`${DIR}/chu-shop.ts`)
    const cho = [...src.matchAll(/^export const (\w+)[^\n]*\/\/ CHỜ MỤC 9/gm)].map((m) => m[1]!)
    expect([...cho].sort()).toEqual(['chuDangTai', 'chuDoiToiDa', 'chuKhongCan', 'chuKhongGioiHan', 'chuLoiTheoMa', 'chuLocNhan', 'chuMonKeChuaDu', 'chuNhanKhungTen', 'chuTheMon', 'chuThanhKeoNhan', 'chuThuCuaEm', 'chuVeCuaHang', 'chuVeDao'].sort())
    const chu9 = bo(src)
    expect((chu9.match(/!/g) ?? []).length, 'mỗi màn tối đa MỘT dấu chấm than').toBeLessThanOrEqual(1)
    expect(chu9).not.toMatch(/\b(rương|may mắn|trúng|jackpot|gold|coin|shop|skin|item|quay(?! lại))\b/i)
    expect(chu9).not.toMatch(/sắp hết|chỉ hôm nay|giảm giá|đếm ngược|nhanh tay/i)
    expect(chu9).not.toMatch(/\b(HQ|VD|KT|DA|CL)-\d\d\b/) // không mã nội bộ trên màn
  })
})

describe('chuẩn thiết kế + luật kinh tế trong mã', () => {
  const man = MAN_HINH.map((f) => [f, bo(doc(f))] as const)
  const css = bo(CSS)

  it('CSS: không backdrop-filter ở thẻ (không đâu cả), không `transition: all`, không `outline: none`, có :focus-visible + giảm chuyển động; hoạt ảnh chỉ transform/opacity', () => {
    expect(css).not.toMatch(/backdrop-filter/)
    expect(css).not.toMatch(/transition:\s*all/)
    expect(css).not.toMatch(/outline:\s*(none|0)\b/)
    expect(css).toMatch(/:focus-visible/)
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*animation: none !important/)
    for (const m of css.matchAll(/transition:\s*([^;]+);/g)) expect(m[1], 'transition').toMatch(/^(opacity|transform|none)\b/)
    for (const k of css.matchAll(/@keyframes\s+[\w-]+\s*\{([\s\S]*?\})\s*\}/g)) {
      const props = [...k[1]!.matchAll(/([\w-]+)\s*:/g)].map((x) => x[1]!)
      for (const p of props) expect(['transform', 'opacity'], `keyframes có thuộc tính ${p}`).toContain(p)
    }
    // tối đa 3 chuyển động lặp trong tệp: đếm `infinite`
    expect((css.match(/infinite/g) ?? []).length).toBeLessThanOrEqual(3)
  })

  it('TSX: mọi <button> có type="button"; không <div onClick> (trừ nền tấm phủ); không innerHTML; không mạng / kho trình duyệt / ngẫu nhiên ngoài khoá yêu cầu', () => {
    let nut = 0
    let kieu = 0
    for (const [f, s] of man) {
      if (!f.endsWith('.tsx')) continue
      nut += (s.match(/<button\b/g) ?? []).length
      kieu += (s.match(/type="button"/g) ?? []).length
      expect(s, f).not.toMatch(/dangerouslySetInnerHTML|innerHTML/)
      for (const m of s.matchAll(/<div\b[^>]*onClick/g)) expect(m[0], `${f}: <div onClick> ngoài nền tấm phủ`).toMatch(/ps-phu/)
    }
    expect(nut).toBeGreaterThan(10)
    expect(kieu).toBe(nut)
    for (const [f, s] of man) {
      expect(s, f).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB|document\.cookie/)
      if (f.endsWith('logic-shop.ts')) continue
      expect(s, f).not.toMatch(/Math\.random|randomUUID/)
    }
    // Math.random chỉ có trong sinhKhoa (chống ghi hai lần), không đâu khác
    const logic = bo(doc(`${DIR}/logic-shop.ts`))
    expect((logic.match(/Math\.random/g) ?? []).length).toBe(1)
    expect(logic.slice(logic.indexOf('Math.random') - 400, logic.indexOf('Math.random') + 50)).toMatch(/sinhKhoa|randomUUID/)
  })

  it('máy em KHÔNG tự tính số dư: mọi setVang chỉ nhận số máy chủ trả; không có phép cộng/trừ trên `vang` ở ManShop; phép trừ duy nhất là chữ XEM TRƯỚC của hộp xác nhận [X2]', () => {
    const s = bo(doc(`${DIR}/ManShop.tsx`))
    const goi = [...s.matchAll(/setVang\(([^)]*)\)/g)].map((m) => m[1]!.trim())
    expect(goi.length).toBeGreaterThanOrEqual(3)
    for (const g of goi) expect(g, `setVang(${g})`).toMatch(/^(r|a\.value|b\.value)\.vang$/)
    expect(s).not.toMatch(/\bvang\s*[-+]=?\s*[\w(]/)
    expect(s).not.toMatch(/setVang\(\(/) // không cập nhật theo số cũ
    expect(s).not.toMatch(/\.gia\s*[-+]/)
    for (const [f, t] of man) {
      if (/ManShop|XacNhanMua|logic-shop|du-lieu-mau|chung/.test(f)) continue
      expect(t, f).not.toMatch(/\bvang\s+[-+]\s+[\w(]|[\w)]\s+[-+]\s+vang\b/)
    }
    // chung.tsx: phép tính duy nhất là nội suy HIỆN RA của số chạy 300 ms (từ số cũ tới đúng số máy chủ trả); test RTL (b) khoá số cuối = số máy chủ
    const chungSrc = bo(doc(`${DIR}/chung.tsx`))
    expect((chungSrc.match(/\bvang\s+[-+]\s+[\w(]|[\w)]\s+[-+]\s+vang\b/g) ?? []).length).toBe(1)
    expect(chungSrc).toMatch(/Math\.round\(tu \+ \(vang - tu\)/)
    // xem trước [X2] là chỗ DUY NHẤT (và chỉ là chữ trong hộp xác nhận)
    expect(bo(doc(`${DIR}/XacNhanMua.tsx`))).toMatch(/viec\.vang - viec\.mon\.gia/)
    // không nơi nào trong màn ghi số dư vào kho trình duyệt / thuộc tính bền
    for (const [f, t] of man) expect(t, f).not.toMatch(/setItem\(/)
  })

  it('không cơ chế ngẫu nhiên trả thưởng, không phụ kiện cộng chỉ số / EXP / vé, không chuyển vàng, không bảng xếp hạng vàng (từ khoá trong mã màn)', () => {
    for (const [f, s] of man) {
      if (/du-lieu-mau|xem-thu/.test(f)) continue
      expect(s, f).not.toMatch(/xếp hạng|bảng xếp|chuyển vàng|tặng vàng|gửi vàng|rút thăm|quay thưởng|hộp quà/i)
      expect(s, f).not.toMatch(/\b(sucManh|chiSo|tangExp|congExp|expBonus|hangSo)\b/)
    }
  })

  it('gói mã shop nhỏ: tổng nguồn (không kể trang xem thử) gzip ≤ 60 KB — mục tiêu đóng gói lười', () => {
    const tong = [...MAN_HINH, ...CSS_TEP].map((f) => doc(f)).join('\n')
    const gz = zlib.gzipSync(Buffer.from(tong)).length
    expect(gz, `nguồn gzip ${gz} B`).toBeLessThanOrEqual(60 * 1024)
  })

  it('điểm cắm `veThu` giữ đúng chữ ký (dangMac, pet, cap, size + ten/nhan/tinh tuỳ chọn); màn không import lớp mặc đồ của Code 4 (thay bằng điểm cắm, không nối cứng)', () => {
    const k = bo(doc(`${DIR}/kieu.ts`))
    expect(k).toMatch(/interface VeThuDauVao \{[\s\S]*dangMac: DangMac[\s\S]*pet: number[\s\S]*cap: number[\s\S]*size: number[\s\S]*ten\?: string[\s\S]*nhan\?: string[\s\S]*tinh\?: boolean/)
    expect(k).toMatch(/type VeThu = \(o: VeThuDauVao\) => import\('react'\)\.ReactNode/)
    for (const [f, s] of man) expect(s, f).not.toMatch(/from '\.\.\/phu-kien\//)
  })
})
