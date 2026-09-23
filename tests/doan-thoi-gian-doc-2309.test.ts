// @vitest-environment node
// MỤC 6 — THỜI GIAN ĐOÀN HỘ TỐNG THEO ĐỘ DÀI ĐỀ (thầy chốt 23/09/2026; `docs/dac-ta-sua-3-app-2309.md` §6:
// "Đoàn hộ tống vừa sức và đủ thời gian … hạn theo loại câu và độ khó, 60–180 giây; server là nguồn hạn cuối").
//
// Trước bản này hạn của hiệp CHỈ theo (phần, bậc): câu Phần II dài 90 từ kèm bảng ảnh được đúng hạn bằng
// câu Phần I ba dòng cùng bậc ⇒ em đọc chưa xong đề đã hết giờ. Nay cộng THỜI GIAN ĐỌC cùng công thức
// với tờ chiếu M1 (`src/lib/thoi-gian-len-bang.ts`), kẹp 0..60 s, làm tròn 5 s, và KHÔNG có số đo thì
// y hệt bản cũ (mọi hạn đang chạy giữ nguyên).
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { giayCuaHiep, giayDocThem, GIAY_DOC_NEN, GIAY_MOI_TU, GIAY_CO_HINH, GIAY_DOC_TOI_DA } from '../src/game/than-thu-v2/doan-core'

describe('giayDocThem — thời gian đọc theo độ dài đề', () => {
  it('KHÔNG có số đo ⇒ 0 (mọi hạn cũ giữ nguyên, kể cả dữ liệu cũ)', () => {
    expect(giayDocThem({})).toBe(0)
    expect(giayDocThem({ soTu: 0, coHinh: false })).toBe(0)
    expect(giayDocThem({ soTu: null, coHinh: null })).toBe(0)
    expect(giayDocThem({ soTu: Number.NaN })).toBe(0)
  })

  it('càng nhiều từ càng lâu; có hình/bảng cộng thêm; làm tròn 5 s', () => {
    // 20 từ: 8 + 0,35×20 = 15 ⇒ 15 s
    expect(giayDocThem({ soTu: 20 })).toBe(15)
    // 60 từ: 8 + 21 = 29 ⇒ 30 s
    expect(giayDocThem({ soTu: 60 })).toBe(30)
    // 20 từ + bảng: 8 + 7 + 10 = 25 ⇒ 25 s
    expect(giayDocThem({ soTu: 20, coHinh: true })).toBe(25)
    // chỉ có hình: 8 + 10 = 18 ⇒ 20 s
    expect(giayDocThem({ coHinh: true })).toBe(20)
  })

  it('trần 60 s — đề rất dài không ăn hết cả hiệp', () => {
    expect(giayDocThem({ soTu: 500 })).toBe(GIAY_DOC_TOI_DA)
    expect(giayDocThem({ soTu: 500, coHinh: true })).toBe(GIAY_DOC_TOI_DA)
    expect(GIAY_DOC_NEN + GIAY_MOI_TU * 30 + GIAY_CO_HINH).toBeGreaterThan(0)
  })
})

describe('giayCuaHiep — hạn hiệp có độ dài đề', () => {
  it('KHÔNG kèm đo độ dài ⇒ y hệt bản cũ (90/120 + 30×bậc, sàn 90, trần 180)', () => {
    // bậc biết = 0 → 90; hiểu (1) → 120; vận dụng (2) → 150
    expect(giayCuaHiep(1, [{ phan: 'I', mucDo: 'biet' }])).toBe(90)
    expect(giayCuaHiep(1, [{ phan: 'I', mucDo: 'hieu' }])).toBe(120)
    expect(giayCuaHiep(1, [{ phan: 'I', mucDo: 'van_dung' }])).toBe(150)
    expect(giayCuaHiep(1, [{ phan: 'III', mucDo: 'hieu' }])).toBe(150)
    // lõi thuần gọi không kèm câu (test cũ, dữ liệu cũ)
    expect(giayCuaHiep(3)).toBe(40)
    expect(giayCuaHiep(4)).toBe(60)
  })

  it('câu dài/có hình được THÊM thời gian, nhưng không quá 180 s', () => {
    expect(giayCuaHiep(1, [{ phan: 'II', mucDo: 'hieu', soTu: 60 }])).toBe(150) // 120 + 30
    expect(giayCuaHiep(1, [{ phan: 'III', mucDo: 'van_dung', soTu: 120, coHinh: true }])).toBe(180) // 180 → trần
  })

  it('cả đội một đồng hồ: lấy câu DÀI NHẤT, không lấy trung bình', () => {
    const cau = [{ phan: 'I', mucDo: 'biet' }, { phan: 'II', mucDo: 'hieu', soTu: 60 }]
    expect(giayCuaHiep(1, cau)).toBe(150) // max(90; 120+30)
  })

  it('hiệp trùm giữ 180 s bất kể độ dài', () => {
    expect(giayCuaHiep(4, [{ phan: 'II', mucDo: 'biet' }])).toBe(180)
    expect(giayCuaHiep(4, [])).toBe(180)
  })
})

describe('máy chủ nối độ dài đề vào hạn hiệp', () => {
  const SRV = readFileSync('server/src/game-v2-doan.ts', 'utf8')
  it('`ganNhan` mang `soTu` + `coHinh` của chính câu đó vào CauRef', () => {
    expect(SRV).toContain('function doDaiCau(q: Question)')
    expect(SRV).toContain('...doDaiCau(q)')
    // ảnh/bảng đều được tính là "có hình"
    for (const truong of ['q.table', 'q.thanCauImg', 'q.imageDataUrl', 'q.choiceImgs', 'q.ideaImgs', 'q.hinhAnh']) {
      expect(SRV).toContain(truong)
    }
  })
  it('hạn hiệp dùng chính `giayCuaHiep` của lõi (một nguồn), không tự tính lại', () => {
    expect(SRV).toContain('const giayHiepPhong=(p:PhongDoan)=>giayCuaHiep(')
    expect(SRV).not.toMatch(/giayCuaHiep\([^)]*\)\s*[+*]/)
  })
})
