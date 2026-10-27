// @vitest-environment node
// LẶP CÂU TRONG NGÀY (thầy 27/10 «đảm bảo công bằng mọi chỗ»; đo 27/10: 3 186 lượt lặp cộng thêm 12 256 nguyên tử) — từ 28/10, so MÃ GỐC (kể cả song sinh):
// câu đã ĐÚNG hôm nay làm lại ⇒ 0 nguyên tử (chuỗi đúng giữ), đã SAI làm sai lại ⇒ 0; sai trước rồi đúng (sửa sai) ⇒ cộng như thường. Ngày cũ giữ luật cũ.
import { describe, expect, it } from 'vitest'
import { gocCau, ntNgaySau, ntNgayTuHoSo, tinhThuongTraLoi, NGAY_LAP_CAU, type PhienNt } from '../server/src/thuong-tra-loi'

const T28 = Date.parse('2026-10-28T03:00:00Z'), T27 = Date.parse('2026-10-26T03:00:00Z')
const phien = (qs: string[], lamLai: string[] = []): PhienNt => ({ hocTap: 1, created: T28, questions: qs.map((qid) => ({ qid, ...(lamLai.includes(qid) ? { lamLaiCuoi: true as const } : {}) })), nt: [] })
const goi = (qid: string, dung: boolean, daLam: { dung: string[]; sai: string[] } | undefined, nowMs = T28, s = phien([qid, 'khac'])) =>
  tinhThuongTraLoi({ session: s, qid, dung, hoTro: false, khongTinh: false, cau: {}, chuoiTruoc: 2, giay: 30, nowMs, ...(daLam ? { daLamNgay: { dung: new Set(daLam.dung), sai: new Set(daLam.sai) } } : {}) })

describe('lặp câu trong ngày', () => {
  it('mã gốc bỏ hậu tố song sinh / biến thể / lần', () => {
    expect(NGAY_LAP_CAU).toBe('2026-10-28')
    expect(gocCau('DH-B1.q3~ss2')).toBe('DH-B1.q3'); expect(gocCau('DH-B1.q3~bt1#2')).toBe('DH-B1.q3'); expect(gocCau('DH-B1.q3')).toBe('DH-B1.q3')
  })
  it('lần đầu đúng ⇒ đủ nguyên tử; câu (kể cả song sinh) đã đúng hôm nay làm lại ⇒ 0, chuỗi đúng giữ', () => {
    const dau = goi('A.q1', true, { dung: [], sai: [] })
    expect(dau.thuong.nguyenTu).toBeGreaterThan(0)
    const lap = goi('A.q1~ss1', true, { dung: ['A.q1'], sai: [] })
    expect(lap.thuong).toMatchObject({ tinh: true, nguyenTu: 0, chuoiDung: 2 })
    expect(lap.thuong.dong).toEqual([{ nhan: 'Câu đã đúng hôm nay', so: 0 }])
    expect(lap.nt.find((x) => x.q === 'A.q1~ss1')?.r).toBe(1)
  })
  it('sai rồi làm lại đúng (sửa sai) ⇒ cộng như thường; sai lại ⇒ 0', () => {
    expect(goi('A.q2', true, { dung: [], sai: ['A.q2'] }).thuong.nguyenTu).toBeGreaterThan(0)
    expect(goi('A.q2', false, { dung: [], sai: ['A.q2'] }).thuong.nguyenTu).toBe(0)
    expect(goi('A.q3', false, { dung: [], sai: [] }).thuong.nguyenTu).toBe(2) // lần đầu sai nghiêm túc
  })
  it('làm lại cuối chặng (A3) sau khi sai ⇒ vẫn «Làm lại đúng»', () => {
    const r = goi('A.q4', true, { dung: [], sai: ['A.q4'] }, T28, phien(['A.q4'], ['A.q4']))
    expect(r.thuong.dong[0]?.nhan).toBe('Làm lại đúng'); expect(r.thuong.nguyenTu).toBeGreaterThan(0)
  })
  it('ngày trước 28/10 hoặc chưa có tập câu ⇒ luật cũ', () => {
    expect(goi('A.q1', true, { dung: ['A.q1'], sai: [] }, T27).thuong.nguyenTu).toBeGreaterThan(0)
    expect(goi('A.q1', true, undefined).thuong.nguyenTu).toBeGreaterThan(0)
  })
  it('tập câu trong hồ sơ: theo ngày, sai rồi đúng chuyển sang «đúng», lượt không được tính không ghi', () => {
    const cu = ntNgayTuHoSo({ n: '2026-10-28', d: ['X'], s: ['Y'] }, '2026-10-28')
    expect(ntNgayTuHoSo({ n: '2026-10-27', d: ['X'], s: [] }, '2026-10-28').dung.size).toBe(0)
    expect(ntNgaySau(cu, '2026-10-28', 'Y~ss1', true, true)).toEqual({ n: '2026-10-28', d: ['X', 'Y'], s: [] })
    expect(ntNgaySau(cu, '2026-10-28', 'Z', false, true)).toEqual({ n: '2026-10-28', d: ['X'], s: ['Y', 'Z'] })
    expect(ntNgaySau(cu, '2026-10-28', 'Z', true, false)).toEqual({ n: '2026-10-28', d: ['X'], s: ['Y'] })
  })
})
