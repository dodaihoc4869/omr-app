// Live theo khối — luật điều hướng máy thầy (thầy 12/11: «bấm đạt với chưa đạt thì lại out ra màn chọn đề», «nút học phải bấm 2 lần mới chọn được bài»,
// «esc thì lùi lại, khi lùi lại rồi thì phải có nút về màn chiếu lưu lại mọi thứ tức thì», «màn giáo viên không cần full màn hình»).
// Hành vi thật được thử trên trình duyệt ở `scripts/thu-live-1011/thu-gv-that-1211.mjs` (bước 3c2–3c7, 3g2–3g5, 3j3–3j6, 3m2–3m3, 5c–5d, 9z);
// tệp này khoá các chốt trong mã để phiên sau không gỡ nhầm.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const doc = (p: string) => readFileSync(p, 'utf8')
const ganGv = doc('src/components/bpu/gan-gv.tsx')
const lop = doc('src/components/live-khoi/LopNoiThay.tsx')
const bang = doc('src/components/bpu/BangBinhPhanUng.tsx')
const doan = (s: string, tu: string, den: string) => { const i = s.indexOf(tu); expect(i, tu).toBeGreaterThan(-1); const j = s.indexOf(den, i + tu.length); return s.slice(i, j < 0 ? undefined : j) }

describe('Live theo khối — máy thầy: một luật điều hướng', () => {
  it('chấm Đạt / Chưa đạt trong buổi live: chỉ ghi kết quả, KHÔNG phóng bảng đua, KHÔNG che tờ', () => {
    const cham = doan(ganGv, 'export function chamTuTo', '\n}')
    expect(cham.indexOf('if (phienLive) { nhanCham?.(dat); return }')).toBeGreaterThan(-1)
    expect(cham.indexOf('if (phienLive)')).toBeLessThan(cham.indexOf('hienBang()'))
    expect(doan(ganGv, 'function hienBang', '\n}')).toContain('if (!tamAn && !phienLive) cheTo(true)')
  })
  it('bảng đang thu trong buổi live: Esc / P không «đưa bảng về» (để Esc tới luật lùi màn của buổi live)', () => {
    const phim = doan(ganGv, 'function phimKhiAn', '\n}')
    expect(phim.indexOf('if (phienLive) return')).toBeGreaterThan(-1)
    expect(phim.indexOf('if (phienLive) return')).toBeLessThan(phim.indexOf('hienBang()'))
  })
  it('máy thầy không tự toàn màn hình trong buổi live', () => {
    expect(bang).toContain("!document.fullscreenElement && !document.documentElement.hasAttribute('data-live-khoi')")
    expect(ganGv).toContain('if (!phienLive && !document.fullscreenElement) void document.documentElement.requestFullscreen')
  })
  it('«Học» ở bảng danh sách luôn mở bảng chọn (bấm một lần); bảng chọn được nạp sẵn', () => {
    const doi = doan(lop, 'const doiChe = ', '\n  }\n')
    expect(doi).toContain('if (tuSanh || !coTo() || laToBang()) { setChon(true); return }')
    expect(lop).toContain("useEffect(() => { if (dang) void import('../bpu/ChonCauBpu').catch(() => {}) }, [dang])")
    expect(lop).toContain('onChe={(c) => doiChe(c, true)}')
  })
  it('Esc chỉ LÙI màn, không đóng tấm hoạt động / tờ; có nút «Về màn chiếu»', () => {
    expect(lop).not.toContain('dongHoatDong')
    expect(lop).toContain('if (hdMo && hdDuoi()) { hienHoatDong(); return true }')
    expect(lop.match(/Về màn chiếu<\/button>/g)?.length).toBe(2) // ở bảng danh sách + nổi trên tấm hoạt động
    expect(lop).toContain('coVe={coToChieu()}')
    expect(lop).toContain('const sanh = dang && (sanhTay ?? k.che === \'sanh\')')
  })
  it('không còn cụm nút nổi đè lên tấm hoạt động', () => {
    expect(lop).not.toContain('className="lkt-vien"')
    expect(lop).not.toContain('bangHien')
  })
})
