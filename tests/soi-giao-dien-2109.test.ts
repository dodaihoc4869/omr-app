// BỘ SOI GIAO DIỆN tĩnh — `scripts/soi-giao-dien.mjs` (21/09/2026).
// Mỗi luật G01…G14: ít nhất 2 ca DƯƠNG (phải báo) + 2 ca ÂM (không được báo) trên chuỗi mẫu.
// Nguyên tắc của bộ soi: thà SÓT còn hơn báo bừa ⇒ các ca âm là phần quan trọng hơn.
import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
// @ts-expect-error — mã lệnh .mjs không có khai báo kiểu
import { CANH_BAO, LOI, LUAT, apDungMienTru, demTheoLuat, globThanhRegex, khopTep, laTepBoQua, luatG01, luatG02, luatG03, luatG04, luatG05, luatG06, luatG07, luatG08, luatG09, luatG10, luatG11, luatG12, luatG13, luatG14, soiTep } from '../scripts/soi-giao-dien.mjs'

type PhatHien = { luat: string; muc: string; duong: string; dong: number; moTa: string; goiY: string }
type Ham = (tep: { duong: string; noiDung: string }) => PhatHien[]
const soi = (ham: Ham, duong: string, noiDung: string): PhatHien[] => ham({ duong, noiDung })
const TSX = 'src/components/Mau.tsx'

describe('khung chung', () => {
  it('có đủ 14 luật G01…G14, mã không trùng, mỗi luật một hàm', () => {
    expect(LUAT.map((l: { ma: string }) => l.ma)).toEqual(['G01', 'G02', 'G03', 'G04', 'G05', 'G06', 'G07', 'G08', 'G09', 'G10', 'G11', 'G12', 'G13', 'G14'])
    for (const l of LUAT) expect(typeof l.ham).toBe('function')
    expect(LUAT.filter((l: { muc: string }) => l.muc === LOI).map((l: { ma: string }) => l.ma)).toEqual(['G01', 'G02', 'G03', 'G04', 'G05'])
  })

  it('phát hiện có đủ trường và SỐ DÒNG đúng với thẻ nhiều dòng', () => {
    const kq = soi(luatG01, TSX, 'export function A() {\n  return (\n    <div\n      className="the"\n      onClick={() => mo()}\n    >\n      Mở\n    </div>\n  )\n}\n')
    expect(kq).toHaveLength(1)
    expect(kq[0]).toMatchObject({ luat: 'G01', muc: LOI, duong: TSX, dong: 3 })
    expect(kq[0].moTa.length).toBeGreaterThan(5)
    expect(kq[0].goiY).toContain('<button')
  })

  it('bỏ qua tệp test, graphify-out, *.d.ts', () => {
    expect(laTepBoQua('src/lib/a.test.ts')).toBe(true)
    expect(laTepBoQua('tests/x.test.tsx')).toBe(true)
    expect(laTepBoQua('src/graphify-out/a.ts')).toBe(true)
    expect(laTepBoQua('src/vite-env.d.ts')).toBe(true)
    expect(laTepBoQua('src/screens/HocSinhScreen.tsx')).toBe(false)
    expect(laTepBoQua('src/styles/tokens.css')).toBe(false)
    const xau = '<div onClick={x}>a</div>'
    expect(soiTep({ duong: 'src/a.test.tsx', noiDung: xau }).giu).toHaveLength(0)
    expect(soiTep({ duong: 'src/a.tsx', noiDung: xau }).giu).toHaveLength(1)
  })

  it('miễn trừ: chú thích `soi-bo-qua: G0x lý do` ở NGAY dòng trên', () => {
    const co = soiTep({ duong: TSX, noiDung: 'const a = (\n  // soi-bo-qua: G01 tấm nền bấm ra ngoài để đóng\n  <div onClick={dong}>x</div>\n)\n' })
    expect(co.giu).toHaveLength(0)
    expect(co.mienTru.map((p: PhatHien) => p.luat)).toEqual(['G01'])
    // sai mã luật ⇒ không miễn
    expect(soiTep({ duong: TSX, noiDung: 'const a = (\n  // soi-bo-qua: G02 nhầm mã\n  <div onClick={dong}>x</div>\n)\n' }).giu).toHaveLength(1)
    // cách một dòng ⇒ không miễn
    expect(soiTep({ duong: TSX, noiDung: '// soi-bo-qua: G01 xa quá\n\n<div onClick={dong}>x</div>\n' }).giu).toHaveLength(1)
    // dạng chú thích JSX và CSS, nhiều mã một lần
    expect(soiTep({ duong: TSX, noiDung: '<p>\n  {/* soi-bo-qua: G07 ô tìm kiếm có biểu tượng kính lúp */}\n  <input value={v} onChange={f} />\n</p>\n' }).mienTru).toHaveLength(1)
    const css = soiTep({ duong: 'src/styles/a.css', noiDung: '.thanh {\n  /* soi-bo-qua: G04, G13 thanh tiến độ cũ */\n  transition: all 0.2s, width 0.2s;\n}\n' })
    expect(css.giu).toHaveLength(0)
    expect(css.mienTru.map((p: PhatHien) => p.luat).sort()).toEqual(['G04', 'G13'])
  })

  it('apDungMienTru + demTheoLuat đếm đúng lỗi / cảnh báo / miễn trừ', () => {
    const ph = (luat: string, muc: string, dong: number): PhatHien => ({ luat, muc, duong: 'a', dong, moTa: '', goiY: '' })
    const { giu, mienTru } = apDungMienTru('a\n// soi-bo-qua: G08 câu trích nguyên văn\nb\nc\n', [ph('G08', CANH_BAO, 3), ph('G08', CANH_BAO, 4), ph('G01', LOI, 3)])
    const dem = demTheoLuat(giu, mienTru)
    expect(dem.G08).toMatchObject({ loi: 0, canhBao: 1, mienTru: 1 })
    expect(dem.G01).toMatchObject({ loi: 1, canhBao: 0, mienTru: 0 })
  })

  it('--tep: glob và đường dẫn', () => {
    expect(globThanhRegex('src/**/*.tsx').test('src/a/b/C.tsx')).toBe(true)
    expect(globThanhRegex('src/**/*.tsx').test('src/C.tsx')).toBe(true)
    expect(globThanhRegex('src/*.tsx').test('src/a/C.tsx')).toBe(false)
    expect(globThanhRegex('src/**/*.{ts,css}').test('src/styles/a.css')).toBe(true)
    expect(khopTep('src/game/than-thu-v2/Game.tsx', ['src/game'])).toBe(true)
    expect(khopTep('src/game/than-thu-v2/Game.tsx', ['src/game/'])).toBe(true)
    expect(khopTep('src/game2/Game.tsx', ['src/game'])).toBe(false)
    expect(khopTep('index.html', ['index.html'])).toBe(true)
    expect(khopTep('src/a.ts', [])).toBe(true)
  })

  it('chạy bằng dòng lệnh: không tệp nào khớp ⇒ JSON rỗng, mã thoát 0', () => {
    const maLenh = resolve(process.cwd(), 'scripts/soi-giao-dien.mjs') // vitest luôn chạy từ gốc kho
    const ra = execFileSync(process.execPath, [maLenh, '--json', '--tep', 'khong-co-thu-muc-nay/**'], { encoding: 'utf8' })
    const kq = JSON.parse(ra)
    expect(kq).toMatchObject({ soTep: 0, tongLoi: 0, tongCanhBao: 0, tongMienTru: 0, phatHien: [] })
    expect(Object.keys(kq.dem)).toHaveLength(14)
  })
})

describe('G01 · <div|span onClick> thiếu role + bàn phím (LỖI)', () => {
  it('dương', () => {
    expect(soi(luatG01, TSX, '<div onClick={() => mo()}>Mở</div>')).toHaveLength(1)
    expect(soi(luatG01, TSX, '<span\n  className="chip"\n  onClick={chon}\n>\n  Chọn\n</span>')).toHaveLength(1)
    const coRole = soi(luatG01, TSX, '<div role="button" onClick={mo}>Mở</div>')
    expect(coRole).toHaveLength(1)
    expect(coRole[0].moTa).toContain('thiếu tabIndex')
    expect(soi(luatG01, TSX, '<ul>{ds.map((c) => (\n  <div key={c.ma} onClick={() => xem(c)} className="the cursor-pointer">{c.ten}</div>\n))}</ul>')[0].muc).toBe(LOI)
  })
  it('âm', () => {
    expect(soi(luatG01, TSX, '<button type="button" onClick={mo}>Mở</button>')).toHaveLength(0)
    expect(soi(luatG01, TSX, '<div role="button" tabIndex={0} onKeyDown={phim} onClick={mo}>Mở</div>')).toHaveLength(0)
    expect(soi(luatG01, TSX, '<div className="hop" onClick={(e) => e.stopPropagation()}>…</div>')).toHaveLength(0)
    expect(soi(luatG01, TSX, '<div className="fixed inset-0 z-50" onClick={dong}><Hop /></div>')).toHaveLength(0)
    expect(soi(luatG01, TSX, '<div className="man-che" onClick={dong} aria-hidden="true" />')).toHaveLength(0)
    expect(soi(luatG01, TSX, '<div role="presentation" onClick={dong}><Hop /></div>')).toHaveLength(0)
    expect(soi(luatG01, TSX, '<div {...thuocTinh} onClick={mo}>x</div>')).toHaveLength(0)
    expect(soi(luatG01, TSX, '{/* <div onClick={mo}>cũ</div> */}\n// <span onClick={mo}>cũ</span>\n<p>ok</p>')).toHaveLength(0)
    expect(soi(luatG01, 'src/lib/html.ts', "export const h = '<div onClick=\"mo()\">x</div>'")).toHaveLength(0)
    expect(soi(luatG01, TSX, '<div className="the">{ds.map((d) => <button key={d} onClick={() => chon(d)}>{d}</button>)}</div>')).toHaveLength(0)
  })
})

describe('G02 · nút chỉ có biểu tượng thiếu aria-label (LỖI)', () => {
  const nhap = "import { X, Bell as Chuong } from 'lucide-react'\n"
  it('dương', () => {
    expect(soi(luatG02, TSX, `${nhap}<button onClick={dong}><X /></button>`)).toHaveLength(1)
    const nhieuDong = soi(luatG02, TSX, `${nhap}const a = (\n  <button\n    type="button"\n    onClick={mo}\n  >\n    <Chuong size={18} />\n  </button>\n)`)
    expect(nhieuDong).toHaveLength(1)
    expect(nhieuDong[0].dong).toBe(3)
    expect(soi(luatG02, TSX, '<div role="button" tabIndex={0} onKeyDown={p} onClick={dong}><IconDong /></div>')).toHaveLength(1)
  })
  it('âm', () => {
    expect(soi(luatG02, TSX, `${nhap}<button aria-label="Đóng" onClick={dong}><X /></button>`)).toHaveLength(0)
    expect(soi(luatG02, TSX, `${nhap}<button title="Đóng" onClick={dong}><X /></button>`)).toHaveLength(0)
    expect(soi(luatG02, TSX, `${nhap}<button onClick={dong}><X /> Đóng</button>`)).toHaveLength(0)
    expect(soi(luatG02, TSX, `${nhap}<button onClick={dong}><X /><span>Đóng</span></button>`)).toHaveLength(0)
    expect(soi(luatG02, TSX, '<button onClick={dong}><NhanNut /></button>')).toHaveLength(0) // không chắc là biểu tượng
    expect(soi(luatG02, TSX, `${nhap}<button {...thuocTinh}><X /></button>`)).toHaveLength(0)
    expect(soi(luatG02, TSX, `${nhap}<button onClick={dong}><X aria-label="Đóng" /></button>`)).toHaveLength(0)
  })
})

describe('G03 · xoá outline không có thay thế (LỖI)', () => {
  it('dương', () => {
    expect(soi(luatG03, 'src/styles/a.css', '.tim input {\n  border: 0;\n  outline: 0;\n  background: transparent;\n}\n')).toHaveLength(1)
    expect(soi(luatG03, 'src/styles/a.css', '.o:focus { outline: none; }\n')).toHaveLength(1)
    expect(soi(luatG03, TSX, "const o = { width: '100%', outline: 'none' }\nexport const A = () => <input aria-label=\"x\" style={o} />")).toHaveLength(1)
    expect(soi(luatG03, TSX, '<input aria-label="x" className="w-full px-2 outline-none" />')).toHaveLength(1)
  })
  it('âm', () => {
    expect(soi(luatG03, 'src/styles/a.css', '.o:focus { outline: none; box-shadow: inset 0 0 0 2px var(--m3-primary); }\n')).toHaveLength(0)
    expect(soi(luatG03, 'src/styles/a.css', '.o { outline: none; }\n.khac { color: red; }\n.khac2 { color: red; }\n.khac3 { color: red; }\n.khung .o:focus-visible { outline: 2px solid var(--m3-primary); }\n')).toHaveLength(0)
    expect(soi(luatG03, 'src/styles/a.css', '.o:focus:not(:focus-visible) { outline: none; }\n')).toHaveLength(0)
    expect(soi(luatG03, 'src/styles/a.css', '.o { outline-offset: 0; }\n/* .p { outline: none; } */\n')).toHaveLength(0)
    expect(soi(luatG03, TSX, '<input aria-label="x" className="outline-none focus:ring-2 focus:ring-blue-500" />')).toHaveLength(0)
    expect(soi(luatG03, TSX, "<input\n  aria-label=\"x\"\n  onFocus={() => setF(true)}\n  style={{ outline: 'none', boxShadow: f ? vong : 'none' }}\n/>")).toHaveLength(0)
    expect(soi(luatG03, TSX, "// outline: 'none' đã bỏ\nconst a = 1")).toHaveLength(0)
  })
})

describe('G04 · transition: all (LỖI)', () => {
  it('dương', () => {
    expect(soi(luatG04, 'src/a.css', '.a { transition: all 0.2s ease; }')).toHaveLength(1)
    expect(soi(luatG04, 'src/a.css', '.a {\n  transition-property: all;\n}')[0]).toMatchObject({ luat: 'G04', muc: LOI, dong: 2 })
    expect(soi(luatG04, TSX, "<div style={{ transition: 'all 0.3s' }} />")).toHaveLength(1)
    expect(soi(luatG04, TSX, '<button className="px-3 transition-all hover:shadow">Lưu</button>')).toHaveLength(1)
    expect(soi(luatG04, 'src/lib/html.ts', 'export const css = `\n.nut {\n  transition: all 0.2s;\n}\n`')[0]).toMatchObject({ luat: 'G04', dong: 3 })
  })
  it('âm', () => {
    expect(soi(luatG04, 'src/a.css', '.a { transition: opacity 0.2s, transform 0.2s; }\n.b { transition: none; }\n.c { transition: var(--all-nhanh); }')).toHaveLength(0)
    expect(soi(luatG04, 'src/a.css', '/* transition: all 0.2s */\n.small { color: red; }')).toHaveLength(0)
    expect(soi(luatG04, TSX, '<button className="transition-colors transition-opacity">Lưu</button>')).toHaveLength(0)
    expect(soi(luatG04, 'src/lib/html.ts', 'export const css = `.nut { transition: opacity 0.2s; }`')).toHaveLength(0)
    expect(soi(luatG04, TSX, "<div style={{ transition: 'transform 0.3s' }} /> // transition: 'all'")).toHaveLength(0)
  })
})

describe('G05 · chặn phóng to trang (LỖI)', () => {
  it('dương', () => {
    expect(soi(luatG05, 'index.html', '<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />')).toHaveLength(1)
    const hai = soi(luatG05, 'index.html', '<head>\n<meta name="viewport" content="width=device-width, maximum-scale=1.0, user-scalable=no" />\n</head>')
    expect(hai).toHaveLength(2)
    expect(hai.every((p) => p.dong === 2 && p.muc === LOI)).toBe(true)
  })
  it('âm', () => {
    expect(soi(luatG05, 'index.html', '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />')).toHaveLength(0)
    expect(soi(luatG05, 'index.html', '<meta name="viewport" content="width=device-width, maximum-scale=5" />')).toHaveLength(0)
    expect(soi(luatG05, 'index.html', '<!-- đã bỏ user-scalable=no, maximum-scale=1 -->\n<meta name="viewport" content="width=device-width" />')).toHaveLength(0)
    expect(soi(luatG05, 'src/lib/a.ts', "export const c = 'user-scalable=no'")).toHaveLength(0)
  })
})

describe('G06 · <img> thiếu kích thước + loading (CẢNH BÁO)', () => {
  it('dương', () => {
    expect(soi(luatG06, TSX, '<img src={anh} alt="" />')[0]).toMatchObject({ luat: 'G06', muc: CANH_BAO })
    expect(soi(luatG06, TSX, '<p>\n  <img\n    src={anh}\n    alt="Hình câu 3"\n    className="dh-anh"\n  />\n</p>')[0].dong).toBe(2)
  })
  it('âm', () => {
    expect(soi(luatG06, TSX, '<img src={anh} alt="" width={40} height={40} />')).toHaveLength(0)
    expect(soi(luatG06, TSX, '<img src={anh} alt="" style={{ width: 40, height: 40 }} />')).toHaveLength(0)
    expect(soi(luatG06, TSX, '<img src={anh} alt="" className="w-10 h-10 rounded-full" />')).toHaveLength(0)
    expect(soi(luatG06, TSX, '<img src={anh} alt="" loading="lazy" />')).toHaveLength(0)
    expect(soi(luatG06, TSX, '<img {...thuocTinh} />')).toHaveLength(0)
    expect(soi(luatG06, 'src/lib/html.ts', "export const h = '<img src=\"a.png\">'")).toHaveLength(0)
  })
})

describe('G07 · ô nhập không có nhãn (CẢNH BÁO)', () => {
  it('dương', () => {
    expect(soi(luatG07, TSX, '<input placeholder="Nhập lớp…" value={lop} onChange={(e) => setLop(e.target.value)} />')).toHaveLength(1)
    expect(soi(luatG07, TSX, '<span>Cột</span>\n<select value={v} onChange={f}><option>a</option></select>')[0].dong).toBe(2)
    expect(soi(luatG07, TSX, '<textarea value={v} onChange={f} />')).toHaveLength(1)
    expect(soi(luatG07, TSX, '<label htmlFor="sbd">Số báo danh</label>\n<input id="ma-ca" value={v} onChange={f} />')).toHaveLength(1)
  })
  it('âm', () => {
    expect(soi(luatG07, TSX, '<input aria-label="Tìm em" value={v} onChange={f} />')).toHaveLength(0)
    expect(soi(luatG07, TSX, '<label className="o">\n  Số báo danh\n  <input value={v} onChange={f} />\n</label>')).toHaveLength(0)
    expect(soi(luatG07, TSX, '<label htmlFor="sbd">Số báo danh</label>\n<input id="sbd" value={v} onChange={f} />')).toHaveLength(0)
    expect(soi(luatG07, TSX, '<label htmlFor={ma}>Mã ca</label>\n<input id={ma} value={v} onChange={f} />')).toHaveLength(0)
    expect(soi(luatG07, TSX, '<input type="hidden" name="a" value={v} />\n<input type="file" className="hidden" onChange={f} />')).toHaveLength(0)
    expect(soi(luatG07, TSX, '<input {...dangKy} />')).toHaveLength(0)
    expect(soi(luatG07, 'src/lib/a.ts', 'export function f<input>(a: input) { return a }')).toHaveLength(0)
  })
})

describe('G08 · "..." thay vì "…" (CẢNH BÁO)', () => {
  it('dương', () => {
    expect(soi(luatG08, TSX, '<input aria-label="x" placeholder="Nhập mật khẩu..." />')).toHaveLength(1)
    expect(soi(luatG08, TSX, '<p className="mo">Đang chấm bài...</p>')).toHaveLength(1)
    expect(soi(luatG08, 'src/lib/a.ts', "export const rut = (t: string) => t.slice(0, 20) + '...'")).toHaveLength(1)
    expect(soi(luatG08, 'src/lib/a.ts', 'export const c = (n: number) => `Đang tải ${n} câu...`')[0]).toMatchObject({ luat: 'G08', muc: CANH_BAO })
  })
  it('âm', () => {
    expect(soi(luatG08, TSX, '<Nut {...thuocTinh} ds={[...a, ...b]} onClick={() => goi(x, ...conLai)}>Đang tải…</Nut>')).toHaveLength(0)
    expect(soi(luatG08, 'src/lib/a.ts', 'const a = { ...goc, b: 1 }\nfunction f(x: number, ...rest: number[]) { return [x, ...rest] }')).toHaveLength(0)
    expect(soi(luatG08, TSX, '// đang tải...\n/* chờ... */\n<p>{/* cũ... */}Xong</p>')).toHaveLength(0)
    expect(soi(luatG08, 'src/lib/a.ts', "console.log('đang đẩy...')")).toHaveLength(0)
    expect(soi(luatG08, 'src/lib/a.ts', "export const t = 'Đang tải…'")).toHaveLength(0)
  })
})

describe('G09 · emoji trong chuỗi giao diện (CẢNH BÁO)', () => {
  it('dương', () => {
    expect(soi(luatG09, TSX, '<p>🔥 Chuỗi 5 ngày</p>')).toHaveLength(1)
    expect(soi(luatG09, 'src/lib/a.ts', "export const t = 'Xong ✅'")).toHaveLength(1)
    expect(soi(luatG09, TSX, '<button title="⚡ Nhanh">Rút đề</button>')[0]).toMatchObject({ luat: 'G09', muc: CANH_BAO })
    expect(soi(luatG09, TSX, '<span>\n  Máu ❤️ 83\n</span>')[0].dong).toBe(2)
  })
  it('âm', () => {
    expect(soi(luatG09, 'src/lib/a.ts', "export const t = 'Đúng ✓ · Sai ✗ → Tiếp • xong ★ © 2026'")).toHaveLength(0)
    expect(soi(luatG09, TSX, '// 🔥 ghi chú nội bộ\n/* ✅ */\n<p>{/* 🎯 */}Chuỗi 5 ngày</p>')).toHaveLength(0)
    expect(soi(luatG09, 'src/lib/a.ts', "console.log('✅ xong')")).toHaveLength(0)
    expect(soi(luatG09, 'src/styles/a.css', '.a::before { content: "🔥"; }')).toHaveLength(0) // ngoài phạm vi luật (chỉ soi ts/tsx)
  })
})

describe('G10 · từ bị cấm theo bảng A2', () => {
  const GAME = 'src/game/than-thu-v2/Mau.tsx'
  it('dương: "nắm chắc" ở MỌI NƠI là LỖI', () => {
    expect(soi(luatG10, 'src/lib/nhan-xet.ts', "export const t = 'Em đã nắm chắc dạng này'")[0]).toMatchObject({ luat: 'G10', muc: LOI })
    expect(soi(luatG10, 'src/screens/HocSinhScreen.tsx', '<p>\n  Dạng đã nắm chắc\n</p>')[0]).toMatchObject({ muc: LOI, dong: 2 })
  })
  it('dương: deadline / Lô / HP / streak ở màn học sinh + phụ huynh là CẢNH BÁO', () => {
    expect(soi(luatG10, GAME, '<span>{mau}/100 HP</span>')[0]).toMatchObject({ luat: 'G10', muc: CANH_BAO })
    expect(soi(luatG10, 'src/screens/StudentPortalScreen.tsx', "alert('Làm tiếp trước khi hết hạn (deadline).')")).toHaveLength(1)
    expect(soi(luatG10, 'src/components/bang-nhiem-vu/BtvnM3.tsx', '<p className="phu">Lô 2 đang mở · làm lô đang mở rồi nộp</p>')).toHaveLength(1)
    expect(soi(luatG10, 'src/screens/ParentPortalScreen.tsx', 'const t = `Con giữ streak ${n} ngày`')).toHaveLength(1)
    expect(soi(luatG10, GAME, '<Thanh label="HP" gia={mau} />')).toHaveLength(1)
  })
  it('âm', () => {
    // bảng từ cấm của bộ chặn + regex + chú thích: không phải chữ hiển thị
    expect(soi(luatG10, 'src/lib/bo-chan.ts', "export const TU_CAM = ['yếu', 'nắm chắc', 'dốt']\nexport const co = (t: string) => /nắm chắc/i.test(t)\n// không viết nắm chắc")).toHaveLength(0)
    // ngoài vùng học sinh / phụ huynh: deadline, HP không bị soi
    expect(soi(luatG10, 'src/screens/ExamSetupScreen.tsx', "<p>Hạn (deadline) của lô 2 · 100 HP</p>")).toHaveLength(0)
    // tên biến, khoá, lớp CSS trong vùng soi
    expect(soi(luatG10, GAME, "const deadline = bai.deadline\nconst HP = 100\nif (a > deadline && b < streak) chay()\nconst k = goi['deadline'] + goi['hp']\nexport const A = () => <div className=\"streak-chip deadline lo-1\">{HP}</div>")).toHaveLength(0)
    expect(soi(luatG10, GAME, '<p>Lôi Điểu tung chiêu · Máu 83/100 · Hạn nộp 23:59 · Chặng 2</p>')).toHaveLength(0)
    expect(soi(luatG10, GAME, '// HP cũ, deadline cũ, Lô 1\n<p>Máu 83/100</p>')).toHaveLength(0)
  })
})

describe('G11 · giờ 12 tiếng (CẢNH BÁO)', () => {
  it('dương', () => {
    expect(soi(luatG11, 'src/lib/a.ts', "export const g = (d: Date) => d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })")).toHaveLength(1)
    expect(soi(luatG11, 'src/lib/a.ts', 'export const g = (d: Date) => d.toLocaleTimeString()')).toHaveLength(1)
    expect(soi(luatG11, 'src/lib/a.ts', "export const g = (x: number) => new Date(x).toLocaleString('vi-VN')")).toHaveLength(1)
    expect(soi(luatG11, 'src/screens/A.tsx', '<input aria-label="Hẹn giờ" type="datetime-local" value={v} onChange={f} />')[0]).toMatchObject({ luat: 'G11', muc: CANH_BAO })
    expect(soi(luatG11, 'src/components/A.tsx', '<input aria-label="Giờ" type="time" value={v} onChange={f} />')).toHaveLength(1)
  })
  it('âm', () => {
    expect(soi(luatG11, 'src/lib/a.ts', "export const g = (d: Date) => d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })")).toHaveLength(0)
    expect(soi(luatG11, 'src/lib/a.ts', "export const g = (d: Date) => d.toLocaleString('vi-VN', {\n  hour: '2-digit',\n  hourCycle: 'h23',\n})")).toHaveLength(0)
    expect(soi(luatG11, 'src/lib/a.ts', "export const so = (n: number) => n.toLocaleString('vi-VN')")).toHaveLength(0) // định dạng SỐ
    expect(soi(luatG11, 'src/lib/a.ts', "export const g = (d: Date) => d.toLocaleTimeString('vi-VN', TUY_CHON_GIO_24)")).toHaveLength(0) // tuỳ chọn qua biến: không biết
    expect(soi(luatG11, 'src/lib/a.ts', "// <input type=\"datetime-local\">\nexport const kieu = 'datetime-local'")).toHaveLength(0)
    expect(soi(luatG11, 'src/components/ONgayGio24.tsx', '<input aria-label="x" type="time" />')).toHaveLength(0)
    expect(soi(luatG11, 'src/screens/A.tsx', '<input aria-label="x" type="text" inputMode="numeric" />')).toHaveLength(0)
  })
})

describe('G12 · chặn dán (CẢNH BÁO)', () => {
  it('dương', () => {
    expect(soi(luatG12, TSX, '<input aria-label="x" onPaste={(e) => e.preventDefault()} />')[0]).toMatchObject({ luat: 'G12', muc: CANH_BAO })
    expect(soi(luatG12, TSX, '<input\n  aria-label="x"\n  onPaste={(e) => {\n    e.preventDefault()\n    bao("Không được dán")\n  }}\n/>')[0].dong).toBe(3)
  })
  it('âm', () => {
    expect(soi(luatG12, TSX, '<input aria-label="x" onPaste={xuLyDan} />')).toHaveLength(0)
    expect(soi(luatG12, TSX, "<input aria-label=\"x\" onPaste={(e) => setV(e.clipboardData.getData('text'))} />")).toHaveLength(0)
    expect(soi(luatG12, TSX, '<div role="region" onDrop={(e) => e.preventDefault()} />')).toHaveLength(0)
    expect(soi(luatG12, TSX, '// onPaste={(e) => e.preventDefault()}\n<input aria-label="x" />')).toHaveLength(0)
  })
})

describe('G13 · chuyển động trên thuộc tính bố cục (CẢNH BÁO)', () => {
  it('dương', () => {
    expect(soi(luatG13, 'src/a.css', '.thanh > i { transition: width 0.3s ease; }')[0]).toMatchObject({ luat: 'G13', muc: CANH_BAO })
    expect(soi(luatG13, 'src/a.css', '.a { transition: opacity 0.2s, max-height 0.3s cubic-bezier(0.2, 0, 0, 1); }')).toHaveLength(1)
    expect(soi(luatG13, 'src/a.css', '@keyframes truot {\n  from { left: 0; }\n  to { left: 100%; }\n}')[0].dong).toBe(2)
    expect(soi(luatG13, TSX, "<i style={{ width: `${pt}%`, transition: 'width 0.4s' }} />")).toHaveLength(1)
  })
  it('âm', () => {
    expect(soi(luatG13, 'src/a.css', '.a { transition: transform 0.2s, opacity 0.2s, border-top-color 0.2s; }')).toHaveLength(0)
    expect(soi(luatG13, 'src/a.css', '@keyframes nay { from { transform: translateY(4px); opacity: 0; } to { transform: none; opacity: 1; text-align: left; } }')).toHaveLength(0)
    expect(soi(luatG13, 'src/a.css', '.a { width: 100%; height: 4px; top: 0; padding: 8px; }\n/* transition: width 1s */')).toHaveLength(0)
    expect(soi(luatG13, TSX, "<i style={{ transition: 'transform 0.4s, opacity 0.4s' }} />")).toHaveLength(0)
  })
})

describe('G14 · CSS có hoạt ảnh, thiếu prefers-reduced-motion (CẢNH BÁO)', () => {
  it('dương', () => {
    expect(soi(luatG14, 'src/a.css', '.a { color: red; }\n@keyframes quay { to { transform: rotate(360deg); } }')[0]).toMatchObject({ luat: 'G14', muc: CANH_BAO, dong: 2 })
    expect(soi(luatG14, 'src/a.css', '.a { animation: quay 1s linear infinite; }')).toHaveLength(1)
  })
  it('âm', () => {
    expect(soi(luatG14, 'src/a.css', '@keyframes quay { to { transform: rotate(360deg); } }\n@media (prefers-reduced-motion: reduce) { .a { animation: none; } }')).toHaveLength(0)
    expect(soi(luatG14, 'src/a.css', '.a { color: red; animation: none; animation-duration: 0s; }')).toHaveLength(0)
    expect(soi(luatG14, 'src/a.css', '/* @keyframes cũ đã bỏ */\n.a { color: red; }')).toHaveLength(0)
    expect(soi(luatG14, TSX, 'const css = `@keyframes quay { to { transform: rotate(360deg) } }`')).toHaveLength(0)
  })
})
