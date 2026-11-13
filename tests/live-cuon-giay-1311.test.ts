// EM TỰ CUỘN GIẤY ĐỀ TRÊN MÁY EM (thầy 13/11, buổi Live theo khối: «Đề trên máy học sinh không vuốt cuộn xuống được»). Phần thuần: src/components/live/cuon-giay.ts.
// Gốc lỗi đo bằng Chromium thật (scripts/thu-live-1011/thu-cuon-de-1311.mjs): điện thoại cầm dọc ⇒ lớp live xoay 90° bằng CSS ⇒ trình duyệt không cuộn hộ khung
// nằm trong khối xoay ⇒ khung giấy tự cuộn theo ngón tay (KhungDocLap.tsx). Ở đây khoá: ngưỡng kéo, không giật khi vừa vượt ngưỡng, vận tốc nhả tay, quán tính.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { CUA_SO_V_MS, NGUONG_KEO, QUAN_TINH_MS, V_DUNG, V_TRAN, buocQuanTinh, cuonSauThayCuon, taoKeoCuon, tranGiay } from '../src/components/live/cuon-giay'

describe('kéo giấy bằng ngón tay (hình xoay 90°)', () => {
  it('ngón đi dưới ngưỡng ⇒ là CHẠM, không cuộn; nhả tay không trôi', () => {
    const k = taoKeoCuon(200, 0)
    expect(k.di(200 - (NGUONG_KEO - 1), 16)).toBe(0)
    expect(k.di(200 + (NGUONG_KEO - 1), 32)).toBe(0)
    expect(k.dangKeo()).toBe(false)
    expect(k.nha(48)).toBe(0)
  })
  it('vừa vượt ngưỡng: cuộn từ chỗ ngón đang đứng, KHÔNG giật bù cả quãng ngưỡng; sau đó cuộn đúng quãng ngón đi (ngón lên ⇒ cuộn xuống)', () => {
    const k = taoKeoCuon(300, 0)
    expect(k.di(300 - NGUONG_KEO - 2, 16)).toBe(0) // khung đầu sau ngưỡng: chưa dời
    expect(k.dangKeo()).toBe(true)
    expect(k.di(300 - NGUONG_KEO - 2 - 40, 32)).toBe(40)
    expect(k.di(300 - NGUONG_KEO - 2 - 40 + 15, 48)).toBe(-15)
  })
  it('vận tốc lúc nhả chỉ tính các mẫu trong CUA_SO_V_MS gần nhất; ngón dừng hẳn rồi mới nhả ⇒ không trôi; có trần V_TRAN', () => {
    // đi chậm lâu rồi vụt nhanh ở cuối: vận tốc theo đoạn cuối
    const k = taoKeoCuon(500, 0)
    let y = 500, t = 0
    for (let i = 0; i < 10; i++) { y -= 2; t += 50; k.di(y, t) } // 0,04 px/ms (đoạn sớm, ngoài cửa sổ)
    for (let i = 0; i < 4; i++) { y -= 24; t += 16; k.di(y, t) } // 1,5 px/ms
    const v = k.nha(t)
    expect(v).toBeGreaterThan(1.2); expect(v).toBeLessThanOrEqual(1.6)
    // ngón dừng > CUA_SO_V_MS rồi mới nhả
    const d = taoKeoCuon(500, 0)
    d.di(480, 16); d.di(440, 32); d.di(400, 48)
    expect(d.nha(48 + CUA_SO_V_MS + 30)).toBe(0)
    // vụt cực nhanh ⇒ kẹp ở V_TRAN
    const n = taoKeoCuon(800, 0)
    n.di(780, 4); n.di(500, 8); n.di(200, 12)
    expect(n.nha(12)).toBe(V_TRAN)
  })
})

describe('quán tính sau khi nhả tay', () => {
  it('tắt dần theo hàm mũ, không phụ thuộc nhịp khung hình: hai bước 16 ms ≈ một bước 32 ms', () => {
    const a1 = buocQuanTinh(2, 16), a2 = buocQuanTinh(a1.v, 16), b = buocQuanTinh(2, 32)
    expect(a1.di + a2.di).toBeCloseTo(b.di, 6)
    expect(a2.v).toBeCloseTo(b.v, 6)
    expect(b.di).toBeCloseTo(2 * QUAN_TINH_MS * (1 - Math.exp(-32 / QUAN_TINH_MS)), 6)
  })
  it('dưới V_DUNG thì dừng; bước khung dài (máy khựng) bị chặn 64 ms; tổng quãng trôi hữu hạn ≈ v·τ', () => {
    expect(buocQuanTinh(V_DUNG * 0.9, 16).v).toBe(0)
    expect(buocQuanTinh(1, 500).di).toBeCloseTo(buocQuanTinh(1, 64).di, 9)
    let v = 1.5, tong = 0, n = 0
    while (v && n < 1000) { const b = buocQuanTinh(v, 16); tong += b.di; v = b.v; n++ }
    expect(v).toBe(0)
    expect(tong).toBeGreaterThan(1.5 * QUAN_TINH_MS * 0.9); expect(tong).toBeLessThan(1.5 * QUAN_TINH_MS)
    // trôi ngược chiều (ngón kéo xuống) đối xứng
    expect(buocQuanTinh(-1.5, 16).di).toBeCloseTo(-buocQuanTinh(1.5, 16).di, 9)
  })
})

describe('giấy soi: phần đề nằm ngoài ô giấy thầy đang thấy', () => {
  it('tranGiay: phần đã trôi lên trên mép (toạ độ âm) và phần còn dưới mép dưới; khối hỏng bị bỏ qua', () => {
    const o = [[1, 0, 10, -120, 500, 40], [2, 1, 10, -80, 500, 900], [3, 2, 10, 830, 500, 60], [2, 3, 10, Number.NaN, 500, 10], [9]]
    expect(tranGiay(o, 768)).toEqual({ tren: 120, duoi: 890 - 768 })
    expect(tranGiay([[2, 0, 10, 20, 500, 300]], 768)).toEqual({ tren: 0, duoi: 0 })
  })
  it('thầy cuộn giấy của thầy: em không tự cuộn gần đây ⇒ giữ độ cuộn (đi theo thầy); em vừa tự cuộn ⇒ chữ em đang đọc đứng yên', () => {
    expect(cuonSauThayCuon(50, 0, 200, false)).toBe(50)
    expect(cuonSauThayCuon(50, 0, 200, true)).toBe(-150)
    expect(cuonSauThayCuon(-150, 200, 0, true)).toBe(50)
  })
})

describe('nối vào khung giấy', () => {
  const k = readFileSync('src/components/live/KhungDocLap.tsx', 'utf8'), css = readFileSync('src/components/live/live-em.css', 'utf8')
  it('chỉ khi HÌNH XOAY mới tự cuộn theo ngón (máy ngang thật / máy tính để trình duyệt cuộn như cũ); hình xoay thì chặn trình duyệt giành cú vuốt', () => {
    expect(k).toContain("const el = P.current.layHinh().xoay && e.button === 0 ? khungCuonGiay() : null")
    expect(k).toContain("touchAction: xoayNay ? 'none' : 'pan-y'")
    expect(k).toContain("c.addEventListener('touchmove', chan, { passive: false })")
    expect(css).toContain('.lv[data-xoay] .lv-de { touch-action: none; }')
  })
  it('sang câu khác ⇒ giấy về đầu đề; nhả tay ⇒ trôi quán tính, đặt ngón lại ⇒ dừng trôi', () => {
    expect(k).toContain('}, [khoaGiay, tuCuon])')
    expect(k).toMatch(/const giayXuong = [\s\S]{0,200}cancelAnimationFrame\(s\.troiG\)/)
    expect(k).toContain('troiTay(kg.el, kg.k.nha(e.timeStamp))')
  })
})
