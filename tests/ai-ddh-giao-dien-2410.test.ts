// Bong bóng A.I Đỗ Đại Học — vẽ tin văn phòng (đánh dấu Zalo của javisdodaihoc giai_bai.py KY_HIEU) + nơi gắn trong app học sinh.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { chuNguon, tachKhoi, tachKhuc } from '../src/lib/ai-ddh-dinh-dang'

const TIN = `**<do>Đáp án: m = 10,2 gam</do>**

e quên NaOH dư nằm trong rắn r

**1.** n este = 8,8 / 88 = 0,1 mol; n NaOH = 0,15 mol
→ NaOH dư 0,05 mol
**2.** Phản ứng:
<xanh>CH₃COOC₂H₅ + NaOH → CH₃COONa + C₂H₅OH</xanh>
**3.** Rắn = 8,2 + 2 → m = <do>10,2 g</do>

<cam>Cô cạn thì NaOH dư vẫn ở trong rắn, đừng bỏ.</cam>`

describe('vẽ tin văn phòng', () => {
  it('dòng đầu đáp án ⇒ dải đáp án (bỏ chữ «Đáp án:»); bước có số; phương trình; chỗ hay nhầm; ý con gộp vào bước', () => {
    const k = tachKhoi(TIN)
    expect(k.map((x) => x.loai)).toEqual(['dap', 'doan', 'buoc', 'buoc', 'pt', 'buoc', 'nham'])
    expect(k[0]!.khuc.map((x) => x.chu).join('')).toBe('m = 10,2 gam')
    expect(k[0]!.khuc[0]!.kieu).toContain('do')
    const b1 = k[2] as { so: string; khuc: { chu: string }[] }
    expect(b1.so).toBe('1')
    expect(b1.khuc.map((x) => x.chu).join('')).toContain('NaOH dư 0,05 mol')
    expect(k[4]!.khuc.map((x) => x.chu).join('')).toBe('CH₃COOC₂H₅ + NaOH → CH₃COONa + C₂H₅OH')
  })
  it('đậm lồng màu; thẻ lạ giữ nguyên chữ (không HTML thô)', () => {
    expect(tachKhuc('**<do>A</do>** b')).toEqual([{ chu: 'A', kieu: ['dam', 'do'] }, { chu: ' b', kieu: [] }])
    expect(tachKhuc('<script>x</script>').map((x) => x.chu).join('')).toBe('<script>x</script>')
  })
  it('tin thường (không đáp án) ⇒ đoạn chữ; nhãn nguồn', () => {
    expect(tachKhoi('ok e, thầy xem kĩ câu này rồi trả lời e liền').map((x) => x.loai)).toEqual(['doan'])
    expect(chuNguon('kho', false)).toBe('Lời giải từ kho đề của Thầy')
    expect(chuNguon('kho', true)).toBe('Chỉ gợi ý: câu trong bài em chưa nộp')
  })
})

describe('nơi gắn bong bóng', () => {
  it('chỉ ở màn Hôm nay (tab trống); không ở màn thi, kiểm tra, làm bài, game, hồ sơ', () => {
    const s = readFileSync('src/screens/StudentPortalScreen.tsx', 'utf8')
    const dong = s.split('\n').find((d) => d.includes('<BongBongAiDdh'))!
    expect(dong).toContain('!manThi')
    expect(dong).toContain('tab === null')
    expect(dong).toContain('!moHoSoEm')
    expect(dong).not.toMatch(/'kiemtra'|'vaothi'|'hoctap'|'thanthu'|'bia'/)
  })
  // 25/10 (ảnh thầy: tấm trong suốt, chữ Hôm nay lộ qua, thẻ Điểm danh đè): cổng học sinh dựng `ht-shell` — KHÔNG có biến Bát Linh --bl-*.
  it('CSS tự ánh xạ --bl-* sang biến của app học sinh; tấm chat nằm trên thẻ Điểm danh (60) và thanh menu (30)', () => {
    const css = readFileSync('src/components/ai-ddh/ai-ddh.css', 'utf8')
    const khoi = /\.aid-bong, \.aid-che, \.aid-tam \{([^}]*)\}/.exec(css)?.[1] ?? ''
    for (const ten of new Set([...css.matchAll(/var\(--bl-([a-z-]+)/g)].map((m) => m[1]))) expect(khoi, `--bl-${ten}`).toMatch(new RegExp(`--bl-${ten}:`))
    expect(khoi).toContain('--bl-paper: var(--the)')
    const z = (lop: string) => Number(new RegExp(`\\.${lop} \\{[^}]*z-index: (\\d+)`).exec(css)?.[1])
    expect(z('aid-tam')).toBeGreaterThan(60)
    expect(z('aid-che')).toBeGreaterThan(60)
    expect(readFileSync('src/components/bat-linh/BatLinhShell.tsx', 'utf8')).toContain("vai === 'hs' ? 'ht-shell' : 'bl-app'")
  })
  it('bong bóng tải lười, ngoài precache', () => {
    expect(readFileSync('src/screens/StudentPortalScreen.tsx', 'utf8')).toContain('lazy(() => napKhoiPhu().then((m) => m.napBong()))')
    expect(readFileSync('src/components/cong-hs-nap-luoi.ts', 'utf8')).toContain("import('./ai-ddh/BongBongAiDdh')")
    expect(readFileSync('vite.config.ts', 'utf8')).toContain('BongBongAiDdh,ai-ddh-api,ai-ddh-dinh-dang')
  })
})

// 25/10 (thầy: "tốc độ nhắn chậm quá … khi vuốt nền ở dưới không chạy theo nữa").
describe('trả lời ngay + gộp tin + khoá cuộn nền', () => {
  it('văn phòng trả lời tin nào ⇒ tin em ấy hết «Thầy đang soạn»; tin cũ được thay, tin mới nối', async () => {
    const { gopTin } = await import('../src/lib/ai-ddh-api')
    const em = { id: 'e1', ben: 'em' as const, chu: 'Xin chào', anh: 0, nguon: '', chiGoiY: false, trangUrl: '', boDe: null, trangThai: 'dang', traLoiCho: '', luc: 1 }
    const vp = { ...em, id: 'e1~0', ben: 'vp' as const, chu: 'Chào e', trangThai: 'xong', traLoiCho: 'e1', luc: 2 }
    const ra = gopTin([em], [vp])
    expect(ra.map((x) => [x.id, x.trangThai])).toEqual([['e1', 'xong'], ['e1~0', 'xong']])
    expect(gopTin(ra, [])).toBe(ra)
  })
  it('tấm mở ghim body cố định (Safari iPhone), lớp phủ chặn kéo; nhịp chờ 1,5 giây', () => {
    const s = readFileSync('src/components/ai-ddh/BongBongAiDdh.tsx', 'utf8')
    expect(s).toMatch(/position: 'fixed', top: `-\$\{y\}px`/)
    expect(s).toContain('window.scrollTo(0, y)')
    expect(s).toContain('dangCho ? 1500')
    expect(readFileSync('src/components/ai-ddh/ai-ddh.css', 'utf8')).toMatch(/\.aid-che \{[^}]*touch-action: none/)
  })
})
