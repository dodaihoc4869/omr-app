// @vitest-environment node
// LỚP BẢNG ĐẶC của bút viết bảng (thầy 12/11: «Nét bút bị chậm hơn, làm cho thật hơn tức thì hơn nữa») — các điều KHÔNG ĐƯỢC SAI trong đoạn mã chèn vào tờ.
// Sự cố 11/11: lớp mực TRONG SUỐT phủ cả tờ xin vẽ-thẳng-lên-màn (`desynchronized`) ⇒ trên card đồ hoạ thật thành lớp phủ đen che giấy đề.
// Khoá: lớp phủ cả tờ không bao giờ xin `desynchronized`; chỗ DUY NHẤT xin là lớp bảng, và lớp đó phải ĐẶC (`alpha: false`); có công tắc lùi khẩn;
// không tự bật «vẽ ngay khi mẫu tới». Hình thật + «đề không bị che» từng điểm ảnh: scripts/but-bang-1011/do-bang-nhanh.mjs (Chromium thật).
import { describe, expect, it } from 'vitest'
import { CSS_BUT_BANG, JS_BUT_BANG } from '../src/lib/but-bang-to-chieu'

describe('lớp bảng đặc — an toàn cho giấy đề', () => {
  it('lớp mực phủ cả tờ (cvT), lớp đã chốt, ô nháp: KHÔNG xin desynchronized', () => {
    expect(JS_BUT_BANG).toContain('gT = nguCanh(cvT, false), gC = nguCanh(cvC, false), gS = nguCanh(cvS, false)')
    expect(JS_BUT_BANG).not.toMatch(/nguCanh\([^)]*,\s*true\)/)
  })
  it('chỗ duy nhất xin desynchronized là lớp bảng `cvB`, và nó ĐẶC (alpha: false)', () => {
    const xin = JS_BUT_BANG.match(/desynchronized:\s*true/g) ?? []
    // một lần trong hàm nguCanh (chỉ chạy khi tham số `song` đúng — không nơi nào gọi như vậy), một lần cho cvB
    expect(xin.length).toBe(2)
    expect(JS_BUT_BANG).toContain("cvB.getContext('2d', { alpha: false, desynchronized: true })")
  })
  it('công tắc lùi khẩn: localStorage ddh.but.nhanh = tat ⇒ không dùng; trình duyệt không cấp ⇒ không dùng; có __mcBut.nhanh(false)', () => {
    expect(JS_BUT_BANG).toContain("getItem('ddh.but.nhanh')")
    expect(JS_BUT_BANG).toMatch(/k !== 'tat'[^;]*nhDuoc = k === 'ep' \? 2 : capB \? 1 : 0/)
    expect(JS_BUT_BANG).toContain('nhanh: function (b)')
    expect(JS_BUT_BANG).toContain("setItem('ddh.but.nhanh', b === 'ep' ? 'ep' : 'tat')")
  })
  it('lớp bảng nằm TRONG cột bảng, dưới ruột của cột (z-index âm trong cột đã cô lập), không bắt con trỏ, không in ra giấy', () => {
    expect(CSS_BUT_BANG).toMatch(/canvas\.mc-but-bang\{position:absolute;z-index:-1;pointer-events:none;[^}]*image-rendering:pixelated\}/)
    expect(CSS_BUT_BANG).toContain('.mc-cot-nhanh{isolation:isolate}')
    expect(CSS_BUT_BANG).toMatch(/@media print\{[^}]*canvas\.mc-but-bang[^}]*display:none!important\}/)
    expect(JS_BUT_BANG).toContain('c.appendChild(cvB)')
  })
  it('không dựng lại được nền cột (nền có ảnh, nền bán trong suốt, bóng kiểu khác, cột có viền thật, cột không định vị) ⇒ đợt đó dùng đường cũ', () => {
    expect(JS_BUT_BANG).toContain("if (cs.backgroundImage && cs.backgroundImage !== 'none') return '';")
    expect(JS_BUT_BANG).toContain("cs.position === 'static'")
  })
  it('KHÔNG tự bật «vẽ ngay khi mẫu tới» (đo thấy mực lùi) — chỉ bật tay', () => {
    expect(JS_BUT_BANG).not.toMatch(/if \(duocNgay[^)]*\) datVeNgay\(true\)/)
    expect(JS_BUT_BANG).toContain('veNgay: function (b)')
  })
})
