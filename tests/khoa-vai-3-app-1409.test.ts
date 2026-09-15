// BA APP, BA ĐƯỜNG — KHOÁ VAI, KHÔNG BAO GIỜ LẪN. 14/09.
//
// Thầy chốt: "Link của 3 app bạn hãy bọc hay làm gì đó để đảm bảo 100% không
// nhảy lẫn lộn."
//
// ─────────────────────────────────────────────────────────────────────────
// CHỖ DUY NHẤT CÒN LẪN ĐƯỢC, VÀ VÌ SAO
//
// Mọi đường CÓ vai rõ ràng vốn đã đúng. Chỗ đoán là `/` TRẦN:
// `laManThayQuanLy` hỏi `localStorage['ddh.vaiDaDung']`. Ba app chung một gốc
// (`scope: '/'`) nên chung MỘT localStorage — máy mở cả ba thì khoá ấy là của
// app mở sau cùng.
//
// Mà rơi vào `/` trần dễ: link `?vai=gv` bị Zalo hoặc trình rút gọn cắt mất
// phần sau dấu `?` là thành `/` trần ngay.
//
// Tệp này chốt ba lớp bọc:
//   1. Vai nằm trong ĐƯỜNG DẪN, và app tự viết địa chỉ về đúng dạng ấy.
//   2. `start_url` của cả ba manifest cũng là đường dẫn ấy.
//   3. `/` trần KHÔNG đoán nữa — hiện màn chọn app.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { chuanHoaUrlTheoVai, DUONG_APP, vaiCuaDuong } from '../src/lib/khoa-vai'

const GOC = process.cwd()
const doc = (p: string) => fs.readFileSync(path.join(GOC, p), 'utf8')
const docJson = (p: string) => JSON.parse(doc(p)) as Record<string, unknown>

describe('Ba đường chuẩn', () => {
  it('đúng ba đường, đều là đường dẫn chứ không phải tham số', () => {
    expect(DUONG_APP).toEqual({ gv: '/gv', hs: '/hs', ph: '/ph' })
    for (const d of Object.values(DUONG_APP)) {
      expect(d).toMatch(/^\/[a-z]+$/)
      expect(d).not.toContain('?')
    }
  })

  it('`start_url` của cả ba manifest trỏ ĐÚNG ba đường ấy', () => {
    // Biểu tượng trên màn hình chính mở thẳng app của nó, không bao giờ mở
    // `/` trần nữa — đây là lớp bọc thứ hai.
    expect(docJson('public/manifest.json').start_url).toBe('./gv')
    expect(docJson('public/manifest-hs.json').start_url).toBe('./hs')
    expect(docJson('public/manifest-ph.json').start_url).toBe('./ph')
  })

  it('ba manifest có `id` KHÁC NHAU, và `id` KHÔNG đổi theo start_url', () => {
    // Đổi `id` là trình duyệt coi đây là app khác: người đã cài thấy biểu
    // tượng thứ hai thay vì được cập nhật. Nên `id` giữ nguyên bản cũ.
    const ids = ['public/manifest.json', 'public/manifest-hs.json', 'public/manifest-ph.json'].map(
      (f) => docJson(f).id,
    )
    expect(new Set(ids).size).toBe(3)
    expect(ids).toEqual(['/?vai=gv', '/?vai=hocsinh', '/?vai=phuhuynh'])
  })

  it('ba manifest có TÊN khác nhau — cài cả ba không lẫn biểu tượng', () => {
    const ten = ['public/manifest.json', 'public/manifest-hs.json', 'public/manifest-ph.json'].map(
      (f) => docJson(f).short_name,
    )
    expect(new Set(ten).size).toBe(3)
  })

  it('cả ba giữ `scope` gốc — thu hẹp là link vào thi bật ra trình duyệt', () => {
    for (const f of ['public/manifest.json', 'public/manifest-hs.json', 'public/manifest-ph.json']) {
      expect(docJson(f).scope, f).toBe('./')
    }
  })
})

describe('Đọc vai từ mọi dáng link đã từng gửi đi', () => {
  const ca: [string, string, 'gv' | 'hs' | 'ph' | null][] = [
    ['/gv', '', 'gv'],
    ['/', '?vai=gv', 'gv'],
    ['/giaovien', '', 'gv'],
    ['/hs', '', 'hs'],
    ['/hoc-sinh', '', 'hs'],
    ['/hocsinh', '', 'hs'],
    ['/', '?vai=hocsinh', 'hs'],
    ['/ph', '', 'ph'],
    ['/phu-huynh', '', 'ph'],
    ['/', '?vai=phuhuynh', 'ph'],
    // KHÔNG phải app: link thi, link điểm, link phiếu, `/` trần.
    ['/', '', null],
    ['/t/123456', '', null],
    ['/d/123456', '', null],
    ['/p', '', null],
  ]
  for (const [duong, search, mong] of ca) {
    it(`${duong}${search} → ${mong ?? 'không phải app'}`, () => {
      expect(vaiCuaDuong(search, duong)).toBe(mong)
    })
  }
})

describe('Viết lại địa chỉ về đường chuẩn', () => {
  const ch = (duong: string, search = '', hash = '') => chuanHoaUrlTheoVai('/', duong, search, hash)

  it('mọi dáng cũ đều quy về đúng một đường', () => {
    expect(ch('/', '?vai=hocsinh')).toBe('/hs')
    expect(ch('/hoc-sinh')).toBe('/hs')
    expect(ch('/', '?vai=phuhuynh')).toBe('/ph')
    expect(ch('/phu-huynh')).toBe('/ph')
    expect(ch('/', '?vai=gv')).toBe('/gv')
    expect(ch('/giaovien')).toBe('/gv')
  })

  it('đã đúng đường rồi thì KHÔNG viết lại — không đẩy thêm một bản ghi lịch sử', () => {
    expect(ch('/hs')).toBe('')
    expect(ch('/ph')).toBe('')
    expect(ch('/gv')).toBe('')
  })

  it('bỏ `vai` khỏi tham số nhưng GIỮ mọi tham số khác', () => {
    expect(ch('/', '?vai=hocsinh&examCode=123456')).toBe('/hs?examCode=123456')
    expect(ch('/hoc-sinh', '?api=abc')).toBe('/hs?api=abc')
    // Đã đúng đường mà chỉ có tham số thường thì không phải viết lại gì.
    expect(ch('/hs', '?api=abc')).toBe('')
  })

  it('GIỮ NGUYÊN phần sau dấu `#` — phiếu phụ huynh để dữ liệu ở đó', () => {
    expect(ch('/', '?vai=phuhuynh', '#abc123')).toBe('/ph#abc123')
    expect(ch('/hoc-sinh', '', '#xyz')).toBe('/hs#xyz')
  })

  it('KHÔNG đụng link thi, link điểm, link phiếu, `/` trần', () => {
    expect(ch('/t/123456')).toBe('')
    expect(ch('/d/123456')).toBe('')
    expect(ch('/p', '', '#du-lieu')).toBe('')
    expect(ch('/')).toBe('')
  })

  it('KHÔNG đụng link riêng CŨ `/hs/<token>` — chúng có màn báo riêng', () => {
    expect(ch('/hs/abcd1234efgh')).toBe('')
    expect(ch('/ph/abcd1234efgh')).toBe('')
    expect(ch('/', '?vai=hs')).toBe('')
    expect(ch('/', '?vai=ph')).toBe('')
  })

  it('chạy hai lần ra cùng một chỗ — không có vòng viết lại vô tận', () => {
    const lan1 = ch('/', '?vai=hocsinh')
    expect(lan1).toBe('/hs')
    expect(ch(lan1)).toBe('')
  })
})

describe('Nối vào app', () => {
  const MAIN = doc('src/main.tsx')
  const APP = doc('src/App.tsx')
  const RED = doc('public/_redirects')

  it('khoá vai chạy lúc khởi động, SAU chuẩn hoá đường dẫn', () => {
    expect(MAIN).toContain('khoaVaiVaoUrl(import.meta.env.BASE_URL)')
    expect(MAIN.indexOf('chuanHoaDuongDan(import.meta.env.BASE_URL)')).toBeLessThan(
      MAIN.indexOf('khoaVaiVaoUrl(import.meta.env.BASE_URL)'),
    )
  })

  it('KHÔNG có màn chọn app, KHÔNG có màn chặn — thầy chỉ gửi ba link', () => {
    // 15/09 thầy chốt: "bỏ màn chọn app ... làm thế này giảm trải nghiệm người
    // dùng. Chỉ cần kiểm tra kĩ 3 link riêng biệt." Bấm link là vào thẳng app,
    // không màn đệm nào.
    expect(fs.existsSync(path.join(GOC, 'src/screens/ChonAppScreen.tsx'))).toBe(false)
    expect(fs.existsSync(path.join(GOC, 'src/screens/DungLinkScreen.tsx'))).toBe(false)
    expect(APP).not.toContain('khongCoVai')
    expect(APP).not.toContain('canChonApp')
  })

  it('`_redirects` KHÔNG còn 302 đổi `/hs` thành `?vai=`', () => {
    expect(RED).not.toMatch(/^\/hs\s+\/\?vai=/m)
    expect(RED).not.toMatch(/^\/ph\s+\/\?vai=/m)
    expect(RED).not.toMatch(/^\/hoc-sinh\s+\/\?vai=/m)
    expect(RED).not.toMatch(/^\/phu-huynh\s+\/\?vai=/m)
    // Dòng bắt tất cả vẫn phải còn, nếu không `/hs` ra 404.
    expect(RED).toMatch(/^\/\*\s+\/index\.html\s+200\s*$/m)
  })

  it('đoạn chọn manifest trong index.html nhận cả ba đường mới', () => {
    const html = doc('index.html')
    const doan = html.slice(html.indexOf('var vai ='), html.indexOf('var ten ='))
    for (const k of ['hs', 'ph', 'gv']) expect(doan, k).toContain(k)
  })
})

describe('Tốc độ — mảnh mã chính không cõng thứ người khác không dùng', () => {
  const MAN_EM = doc('src/screens/StudentPortalScreen.tsx')
  const APP = doc('src/App.tsx')

  it('game NẠP MUỘN — đo 14/09: ~234 KB nguồn game từng nằm trong mảnh chính', () => {
    // 14/09 chiều: thầy chốt bỏ hẳn Giải Cứu Người Yêu Cũ, chỉ còn Thần Thú.
    expect(MAN_EM).toContain("lazy(() => import('../components/ThanThuHoaHocGame'))")
    expect(MAN_EM).not.toMatch(/^import ThanThuHoaHocGame from/m)
    // và không còn dấu vết game đã bỏ
    expect(MAN_EM).not.toContain('GiaiCuuCongChua')
  })

  it('game nạp muộn có chỗ giữ màn, không để em nhìn khoảng trắng', () => {
    expect(MAN_EM).toContain('<Suspense fallback={<ChoNapGame />}>')
    expect(MAN_EM).toContain('function ChoNapGame()')
  })

  it('cổng phụ huynh nạp muộn — em học sinh không phải tải kèm', () => {
    expect(APP).toContain("const ParentPortalScreen = lazy(() => import('./screens/ParentPortalScreen'))")
    expect(APP).not.toMatch(/^import ParentPortalScreen from/m)
  })

  it('MÀN LÀM BÀI và MÀN PHIẾU vẫn nạp SỚM — ngày thi không đánh cược', () => {
    expect(APP).toMatch(/^import ExamTakeScreen from/m)
    expect(APP).toMatch(/^import PhieuScreen from/m)
  })
})
