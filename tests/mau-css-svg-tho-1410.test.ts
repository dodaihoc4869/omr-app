import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join, dirname } from 'node:path'
import { describe, expect, it } from 'vitest'

const script = resolve('scripts/kiem-mau-giu-nguyen.mjs')
const cssCu = '.dang-dung { color: var(--muc); }\n'

function kiem(cu: string, moi: string, tep = 'src/styles/mau-cli.css') {
  const thu = mkdtempSync(join(tmpdir(), 'mau-css-svg-1410-'))
  try {
    const file = join(thu, tep)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(join(thu, 'index.html'), '<style>:root { --muc: currentColor; --nhat: transparent; --white: currentColor; --blue: transparent; --goldenrod: var(--muc); }</style>')
    writeFileSync(file, cu)
    const git = (...args: string[]) => execFileSync('git', args, { cwd: thu, stdio: 'ignore' })
    git('init', '-q'); git('add', 'src', 'index.html')
    git('-c', 'user.name=Kiểm màu', '-c', 'user.email=kiem@example.test', 'commit', '-qm', 'Nền giả')
    writeFileSync(file, moi)
    const r = spawnSync(process.execPath, [script, 'HEAD'], { cwd: thu, encoding: 'utf8' })
    return { status: r.status, out: r.stdout + r.stderr }
  } finally { rmSync(thu, { recursive: true, force: true }) }
}
const soMauTho = (r: ReturnType<typeof kiem>) => r.out.split('\n').filter(x => x.includes('MÀU THÔ mới')).length

// Tập đầu vào theo bảng named colors của CSS Color 4, không đọc danh sách từ bộ nhận diện.
const TEN_CSS_CHUAN = `aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen`.split(' ')

describe('CLI chặn màu CSS thô mới', () => {
  it('chặn đủ 148 named colors, gồm các tên ngoài danh sách ngắn cũ', () => {
    expect(TEN_CSS_CHUAN).toHaveLength(148)
    const r = kiem(cssCu, cssCu + TEN_CSS_CHUAN.map((ten, i) => `.m${i} { color: ${ten}; }`).join('\n'))
    expect(r.status).toBe(1)
    expect(soMauTho(r)).toBe(148)
    for (const ten of TEN_CSS_CHUAN) expect(r.out).toContain(`color: ${ten}`)
  })
  it('hwb/lab/lch/oklab/oklch/color() và cách viết hoa đều bị chặn', () => {
    const giaTri = ['hwb(120deg 10% 20% / .5)', 'lab(52% 20 30)', 'lch(52% 40 100)', 'oklab(.7 .1 .2)', 'oklch(.7 .1 100)', 'color(display-p3 1 0 0)', 'HWB(120 0% 0%)', 'ReBeCcApUrPlE']
    const r = kiem(cssCu, cssCu + giaTri.map((m, i) => `.m${i} { background: ${m}; }`).join('\n'))
    expect(r.status).toBe(1)
    expect(soMauTho(r)).toBe(giaTri.length)
  })
  it('màu thô trong fallback var hoặc color-mix cũng bị chặn', () => {
    const r = kiem(cssCu, cssCu + '.a { color: var(--muc, rebeccapurple); } .b { background: color-mix(in srgb, var(--muc), oklch(.7 .2 120)); }')
    expect(r.status).toBe(1)
    expect(soMauTho(r)).toBe(2)
  })
  it('đổi/xoá named color và hàm mới đã có vẫn bị chặn', () => {
    const cu = '.a { color: rebeccapurple; } .b { fill: oklch(.7 .2 120); }'
    const r = kiem(cu, '.a { color: var(--muc); }')
    expect(r.status).toBe(1)
    expect(r.out).toContain('ĐỔI/XOÁ màu đang có')
    expect(r.out).toContain('color: rebeccapurple')
    expect(r.out).toContain('fill: oklch(.7 .2 120)')
  })
  it('var/currentColor/transparent và màu pha chỉ từ token đã có được giữ', () => {
    const r = kiem(cssCu, cssCu + `.a { color: var(--white); } .b { border: 1px solid var(--blue); } .c { background: color-mix(in oklch, var(--muc) 20%, transparent); } .d { fill: currentColor; } .e { background: linear-gradient(var(--muc), var(--goldenrod)); }`)
    expect(r.status).toBe(0)
  })
  it('tên màu trong URL, fragment, tên biến, content hoặc font-family không bị bắt nhầm', () => {
    const r = kiem(cssCu, cssCu + `.a { background: url('/icons/red;archive(2).svg') var(--muc); } .b { background-image: url('/blue/coral.svg'); } .c { fill: url('#blue'); } .d { color: var(--goldenrod); } .e { content: 'rebeccapurple oklch'; font-family: 'Snow'; }`)
    expect(r.status).toBe(0)
  })
})

describe('CLI đọc màu SVG literal', () => {
  const tep = 'src/components/SvgCli.tsx'
  const svgCu = 'export default () => <svg><path /></svg>'
  it('fill/stroke/stopColor ở JSX, kể cả literal trong biểu thức, đều được kiểm', () => {
    const r = kiem(svgCu, 'export default () => <svg><path fill="rebeccapurple" stroke="hwb(120 0% 0%)" /><circle fill={"coral"} stroke={`oklch(.7 .2 120)`} /><linearGradient><stop stopColor="tomato" /><stop stopColor={"lab(52% 20 30)"} /></linearGradient></svg>', tep)
    expect(r.status).toBe(1)
    expect(soMauTho(r)).toBe(6)
  })
  it('SVG trực tiếp trong HTML và màu kế thừa ở defs đều được kiểm', () => {
    const cu = '<!doctype html><html><body><svg><defs /></svg></body></html>'
    const moi = '<!doctype html><html><body><svg><defs fill="coral" stroke="lch(52% 40 100)"><path /></defs><stop stop-color="tomato" /></svg></body></html>'
    const r = kiem(cu, moi, 'src/fixtures/svg-cli.html')
    expect(r.status).toBe(1)
    expect(soMauTho(r)).toBe(3)
    expect(kiem(svgCu, 'export default () => <svg><defs fill="coral"><path /></defs></svg>', tep).status).toBe(1)
  })
  it('chú thích HTML/SVG và nhãn tên màu không trở thành thuộc tính tô màu', () => {
    const cu = '<!doctype html><svg><path /></svg>'
    const moi = cu + '<!-- <svg><path fill="coral" /></svg> --><p title="red">rebeccapurple</p>'
    expect(kiem(cu, moi, 'src/fixtures/svg-cli.html').status).toBe(0)
    expect(kiem(svgCu, svgCu + '\n// <path fill="coral" />', tep).status).toBe(0)
  })
  it('SVG trong phiếu HTML dùng fill/stroke/stop-color cũng được kiểm', () => {
    const r = kiem('export const html = `<svg />`', 'export const html = `<svg><path fill="rebeccapurple" stroke="hwb(120 0% 0%)" /><stop stop-color="oklch(.7 .2 120)" /></svg>`', tep)
    expect(r.status).toBe(1)
    expect(soMauTho(r)).toBe(3)
  })
  it('SVG đã có màu bị đổi vẫn báo; đổi cú pháp literal mà giữ màu không báo', () => {
    const cu = 'export default () => <svg><path fill="coral" /></svg>'
    expect(kiem(cu, 'export default () => <svg><path fill={"coral"} /></svg>', tep).status).toBe(0)
    const r = kiem(cu, 'export default () => <svg><path fill="var(--muc)" /></svg>', tep)
    expect(r.status).toBe(1)
    expect(r.out).toContain('ĐỔI/XOÁ màu đang có')
  })
  it('giữ token và nhãn SVG; không bắt title/aria-label/data-fill/chữ giao diện', () => {
    const r = kiem(svgCu, `export default () => <><p title="rebeccapurple">coral oklch(…) màu được mô tả</p><svg aria-label="red" data-fill="rebeccapurple"><title>goldenrod</title><path fill="var(--white)" stroke="currentColor" /><stop stopColor="transparent" /></svg></>`, tep)
    expect(r.status).toBe(0)
  })
})
