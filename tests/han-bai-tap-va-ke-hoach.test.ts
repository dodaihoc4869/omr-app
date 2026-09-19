import { describe, it, expect } from 'vitest'
import { chuoiNgayHoc, hanBaiMom, hanNhapVietNam, hanChoOChon, ngayVietNam, mocThoiGian } from '../src/lib/han-bai-tap'
import { tongHopKeHoachTroLy } from '../src/lib/tro-ly-ca-nhan'
const now = Date.parse('2026-09-18T00:30:00+07:00')
const plan = (extra: Record<string, unknown> = {}) => tongHopKeHoachTroLy({ sbd: 'test', hoTen: 'Em', dsLichSu: [], dsBtvn: [], dsMomGiao: [], tongCauSai: 0, now, ...extra })
describe('Hạn bài và ngày học Việt Nam', () => {
  it('không bắt đầu đếm bài gia đình giao trước khi học sinh mở bài', () => {
    expect(hanBaiMom({})).toBeUndefined()
    const p = plan({ dsMomGiao: [{ id:'m', trangThai:'chua_lam', soCau:4 }] })
    expect(p.radarDeadline.sapHetHan).toBe(0)
    expect(p.radarDeadline.danhSach[0].conLaiChu).toContain('từ khi bắt đầu')
  })
  it('120 phút tính từ mốc bắt đầu; hết giờ hướng dẫn hoàn tất nộp', () => {
    const b = { id:'m', trangThai:'dang_lam', batDauLuc:new Date(now - 7200_000).toISOString(), soCau:4 }
    expect(Date.parse(hanBaiMom(b)!)).toBe(now)
    const p = plan({ dsMomGiao:[b] })
    expect(p.radarDeadline.quaHan).toBe(1)
    expect(p.top3.find(t => t.loai === 'mom')?.hanhDong.nhanNut).toContain('hoàn tất nộp')
  })
  it('BTVN hết hạn không được gợi ý làm, bài đã nộp không tính quá hạn', () => {
    const p = plan({ dsBtvn:[{maBtvn:'old', hanNop:new Date(now).toISOString()}, {maBtvn:'done', daNop:true, hanNop:new Date(now-1).toISOString()}] })
    expect(p.radarDeadline.quaHan).toBe(1)
    expect(p.radarDeadline.daXong).toBe(1)
    expect(p.top3.some(t => t.hanhDong.loai === 'mo_btvn')).toBe(false)
  })
  it('bài gần hạn đứng trước và không lặp cùng bài ở hai ô', () => {
    const p = plan({ dsBtvn:[{maBtvn:'later',soCau:16,giaoLuc:new Date(now).toISOString(),hanNop:new Date(now+23*3600_000).toISOString()}, {maBtvn:'soon',soCau:16,giaoLuc:new Date(now).toISOString(),hanNop:new Date(now+3600_000).toISOString()}], tongCauSai:20 })
    expect(p.top3[0].hanhDong.payload?.bt.maBtvn).toBe('soon')
    const ids = p.top3.filter(t => t.hanhDong.loai === 'mo_btvn').map(t => t.hanhDong.payload?.bt.maBtvn)
    expect(new Set(ids).size).toBe(ids.length)
    // Không còn payload.soCau/vong (thay Vòng 1/2 — mục 3 SO-VIEC.md 19/09):
    // số câu của LÔ đang chờ nay là trường `soCau` cấp cao nhất của nhiệm vụ,
    // và phiếu tự tính lại lịch lô từ `bt` gốc trong payload.
    expect(p.top3[0].soCau).toBeGreaterThan(0)
    expect(p.top3[0].hanhDong.nhanNut).toMatch(/^Làm Lô \d+$/)
  })
  it('hạn sai định dạng không bị coi là sát hạn', () => {
    expect(mocThoiGian('khong-hop-le')).toBeUndefined()
    expect(plan({dsBtvn:[{maBtvn:'x',hanNop:'invalid'}]}).radarDeadline.sapHetHan).toBe(0)
  })
  it('đếm đúng ngày Việt Nam và không bịa số câu khi thiếu dữ liệu', () => {
    expect(ngayVietNam(now)).toBe('2026-09-18')
    const p = plan({dsLichSu:[{maCa:'a',nopLuc:'2026-09-17T17:05:00Z',soCau:6},{maCa:'a',nopLuc:'2026-09-17T17:05:00Z',soCau:6},{maCa:'b',nopLuc:'2026-09-17T17:10:00Z'}],dsBtvn:[{maBtvn:'b',daNop:true,nopLuc:'2026-09-17T17:20:00Z',soCau:4}]})
    expect(p.nganSach.daLamCau).toBe(10)
    expect(p.streak.soNgayLienTiep).toBe(1)
    expect(plan().streak.soNgayLienTiep).toBe(0)
  })
  it('chuỗi dựa ngày nộp liên tiếp, có thể nối từ hôm qua', () => {
    expect(chuoiNgayHoc(['2026-09-17T12:00:00+07:00','2026-09-16T12:00:00+07:00','2026-09-16T18:00:00+07:00'],now)).toBe(2)
    expect(chuoiNgayHoc(['2026-09-15T12:00:00+07:00'],now)).toBe(0)
  })
  it('nhập và sửa hạn theo giờ Việt Nam, từ chối ngày sai hoặc đã qua', () => {
    const iso = hanNhapVietNam('2026-09-18T20:00',now)
    expect(iso).toBe('2026-09-18T13:00:00.000Z')
    expect(hanChoOChon(iso)).toBe('2026-09-18T20:00')
    expect(() => hanNhapVietNam('2026-02-30T20:00',now)).toThrow()
    expect(() => hanNhapVietNam('2026-09-17T20:00',now)).toThrow()
    expect(() => hanNhapVietNam('',now)).toThrow()
  })
})
