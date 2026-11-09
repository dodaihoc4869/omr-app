// @vitest-environment node
// KIỂM TRA ÔN TẬP THEO CHU KỲ BÀI — luật thuần (khối B, thầy 09/11 đặc tả mục 0 điểm 1; 10/11 «Bỏ codex tự làm lại ko chờ gì cả»).
import { describe, expect, it } from 'vitest'
import { ngayKtTheoBai, MOC_HAI_KT_MOI_BAI } from '../server/src/kiem-tra-chu-ky-bai'

const goi = (id: string, han: string, conMoi: number, daKt = 0) => ({ id, han, conMoi, daKt })
describe('ngayKtTheoBai', () => {
  it('em không có gói ⇒ null (giữ lịch tuần cũ)', () => { expect(ngayKtTheoBai('2026-11-10', [])).toBeNull() })
  it('em làm hết câu mới của bài ⇒ Kiểm tra ôn tập ngày mai', () => {
    expect(ngayKtTheoBai('2026-11-10', [goi('g8', '2026-11-17', 0)])).toEqual({ ngay: '2026-11-11', goiId: 'g8' })
  })
  it('chưa hết câu mới ⇒ muộn nhất 2 ngày trước hạn; còn xa ⇒ chưa dựng (chờ); sát hạn ⇒ không trước ngày mai', () => {
    expect(ngayKtTheoBai('2026-11-10', [goi('g8', '2026-11-17', 20)])).toEqual({ cho: true })
    expect(ngayKtTheoBai('2026-11-14', [goi('g8', '2026-11-17', 20)])).toEqual({ ngay: '2026-11-15', goiId: 'g8' })
    expect(ngayKtTheoBai('2026-11-16', [goi('g8', '2026-11-17', 5)])).toEqual({ ngay: '2026-11-17', goiId: 'g8' })
  })
  it('gói đã có lịch ⇒ sang gói kế (hạn sớm trước); mọi gói đã đủ ⇒ chờ, KHÔNG lịch tuần', () => {
    expect(ngayKtTheoBai('2026-11-10', [goi('g9', '2026-11-24', 0), goi('g8', '2026-11-17', 0, 1)])).toEqual({ ngay: '2026-11-11', goiId: 'g9' })
    expect(ngayKtTheoBai('2026-11-10', [goi('g8', '2026-11-17', 0, 1)])).toEqual({ cho: true })
  })
  it('3 tháng cuối (từ 22/03/2027): mỗi bài HAI ngày — lần hai muộn nhất 1 ngày trước hạn', () => {
    expect(MOC_HAI_KT_MOI_BAI).toBe('2027-03-22')
    expect(ngayKtTheoBai('2027-03-25', [goi('gx', '2027-03-28', 0, 1)])).toEqual({ ngay: '2027-03-27', goiId: 'gx' })
    expect(ngayKtTheoBai('2027-03-25', [goi('gx', '2027-03-28', 0, 2)])).toEqual({ cho: true })
    expect(ngayKtTheoBai('2026-11-10', [goi('gx', '2026-11-17', 0, 1)])).toEqual({ cho: true })
  })
})
