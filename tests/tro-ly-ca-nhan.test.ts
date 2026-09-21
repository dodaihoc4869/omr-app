import { describe, expect, it } from 'vitest'
import {
  dinhDangConLai,
  tinhNganSachNgay,
  tinhDiemUuTien,
  tongHopKeHoachTroLy,
} from '../src/lib/tro-ly-ca-nhan'

describe('Thuật toán Trợ lý Cá nhân AI (tro-ly-ca-nhan.ts)', () => {
  describe('1. Định dạng thời gian còn lại (dinhDangConLai)', () => {
    it('xử lý các mốc thời gian chính xác', () => {
      expect(dinhDangConLai(undefined)).toBe('Không rõ')
      expect(dinhDangConLai(-100)).toBe('Đã qua Hạn nộp')
      expect(dinhDangConLai(0)).toBe('Đã qua Hạn nộp')
      expect(dinhDangConLai(45 * 60 * 1000)).toBe('Còn 45 phút')
      expect(dinhDangConLai((2 * 60 + 15) * 60 * 1000)).toBe('Còn 2 giờ 15 phút')
      expect(dinhDangConLai((25 * 60) * 60 * 1000)).toBe('Còn 1 ngày 1 giờ')
      expect(dinhDangConLai(3 * 3600 * 1000)).toBe('Còn 3 giờ') // tròn giờ: không "0 phút", không khoảng trắng thừa
      expect(dinhDangConLai(2 * 24 * 3600 * 1000)).toBe('Còn 2 ngày')
      expect(dinhDangConLai(30_000)).toBe('Còn dưới 1 phút')
    })
    it('kèm MỐC THẬT khi biết giờ hiện tại (luật 6): "Còn 3 giờ 5 phút (tới 23:59 · Thứ Năm 24/09/2026)"; hết hạn thì không kèm', () => {
      const nay = Date.parse('2026-09-24T13:54:00+07:00') // 13:54 giờ VN
      expect(dinhDangConLai((3 * 60 + 5) * 60_000 + 60_000 * 0, nay)).toBe('Còn 3 giờ 5 phút (tới 16:59 · Thứ Năm 24/09/2026)')
      expect(dinhDangConLai(10 * 3600_000 + 5 * 60_000, nay)).toBe('Còn 10 giờ 5 phút (tới 23:59 · Thứ Năm 24/09/2026)')
      expect(dinhDangConLai(3 * 24 * 3600_000, nay)).toBe('Còn 3 ngày (tới 13:54 · Chủ nhật 27/09/2026)')
      expect(dinhDangConLai(-1, nay)).toBe('Đã qua Hạn nộp')
      expect(dinhDangConLai(undefined, nay)).toBe('Không rõ')
      expect(dinhDangConLai(45 * 60_000, undefined)).toBe('Còn 45 phút') // không có giờ hiện tại ⇒ như cũ, không bịa mốc
      expect(dinhDangConLai(45 * 60_000, NaN)).toBe('Còn 45 phút') // giờ hiện tại hỏng ⇒ không in "tới Chưa có hạn…"
      expect(dinhDangConLai(60 * 60_000)).toBe('Còn 1 giờ') // đúng 60 phút là 1 giờ, không phải "60 phút"
      expect(dinhDangConLai(59 * 60_000)).toBe('Còn 59 phút')
    })
  })

  describe('2. Ngân sách ngày thích ứng (Anti-Burnout Budget)', () => {
    it('giảm tải xuống 8 câu khi tồn đọng nhiều bài (>= 15 câu)', () => {
      const budget = tinhNganSachNgay(18, 5, 90, 0)
      expect(budget.mucTieuCau).toBe(8)
      expect(budget.trangThaiTai).toBe('go_no_giam_tai')
      expect(budget.chuThich).toContain('Gợi ý giảm tải')
    })

    it('giảm tải xuống 8 câu khi có quá nhiều câu sai tồn đọng (>= 20 câu)', () => {
      const budget = tinhNganSachNgay(2, 25, 90, 0)
      expect(budget.mucTieuCau).toBe(8)
      expect(budget.trangThaiTai).toBe('go_no_giam_tai')
    })

    it('giữ mức vừa sức 10 câu khi tồn đọng trung bình (6-14 câu)', () => {
      const budget = tinhNganSachNgay(8, 5, 90, 0)
      expect(budget.mucTieuCau).toBe(10)
      expect(budget.trangThaiTai).toBe('vua_suc')
    })

    it('giữ mức tiêu chuẩn 12 câu khi học sinh theo kịp tiến độ bình thường', () => {
      const budget = tinhNganSachNgay(1, 2, 90, 0)
      expect(budget.mucTieuCau).toBe(12)
      expect(budget.trangThaiTai).toBe('vua_suc')
    })

    it('nâng lên 16 câu khi học sinh làm bài nhanh (< 75s/câu) và không nợ bài', () => {
      const budget = tinhNganSachNgay(0, 1, 60, 0)
      expect(budget.mucTieuCau).toBe(16)
      expect(budget.trangThaiTai).toBe('nhe_nhang')
    })

    it('tính đúng phần trăm hoàn thành và số phút còn lại', () => {
      const budget = tinhNganSachNgay(1, 2, 90, 6)
      expect(budget.mucTieuCau).toBe(12)
      expect(budget.daLamCau).toBe(6)
      expect(budget.phanTramHoanThanh).toBe(50)
      // 6 câu còn lại * 90s = 540s = 9 phút
      expect(budget.phutConLaiUocTinh).toBe(9)
    })
  })

  describe('3. Điểm ưu tiên số học (Dynamic Priority Scoring)', () => {
    it('gắn cấp độ khẩn cấp cho deadline dưới 2 giờ', () => {
      const kq = tinhDiemUuTien({
        conLaiMs: 1.5 * 3600 * 1000,
        loai: 'btvn_lo',
        soCau: 6,
        expThuong: 12,
      })
      expect(kq.capDo).toBe('khan_cap')
      expect(kq.score).toBeGreaterThanOrEqual(0.8)
    })

    it('ưu tiên sửa lỗi sai Vòng 1 Lõi hơn là làm câu Thử thách Vòng 3', () => {
      const diemSuaV1 = tinhDiemUuTien({
        loai: 'sua_loi_vong1',
        soCau: 3,
        expThuong: 9,
      })
      const diemThuThachV3 = tinhDiemUuTien({
        loai: 'thu_thach_vong3',
        soCau: 2,
        expThuong: 8,
      })
      expect(diemSuaV1.score).toBeGreaterThan(diemThuThachV3.score)
    })
  })

  describe('4. Tổng hợp Kế hoạch Toàn diện (tongHopKeHoachTroLy)', () => {
    it('đưa bài Mom giao sát giờ hoặc BTVN sát hạn lên vị trí Top 1', () => {
      const bayGio = Date.now()
      const dsMomGiao = [
        {
          id: 'mom-1',
          tieuDe: 'Bài Mẹ giao ôn tập Este',
          soCau: 8,
          batDauLuc: new Date(bayGio - 3600 * 1000).toISOString(), // đã trôi 1h, còn 1h
          trangThai: 'chua_nop',
        },
      ]
      const dsBtvn = [
        {
          maBtvn: 'bt-1',
          tieuDe: 'BTVN Hoá hữu cơ',
          soCau: 15,
          hanNop: new Date(bayGio + 48 * 3600 * 1000).toISOString(),
          daNop: false,
        },
      ]

      const keHoach = tongHopKeHoachTroLy({
        sbd: '123456',
        hoTen: 'Nguyễn Văn A',
        dsBtvn,
        dsMomGiao,
        dsLichSu: [],
        tongCauSai: 5,
      })

      expect(keHoach.top3.length).toBeGreaterThanOrEqual(1)
      expect(keHoach.top3[0]?.loai).toBe('mom')
      expect(keHoach.top3[0]?.capDoUuTien).toBe('khan_cap')
      expect(keHoach.radarDeadline.sapHetHan).toBeGreaterThanOrEqual(1)
    })

    it('radar deadline phân loại chính xác các trạng thái', () => {
      const bayGio = Date.now()
      const dsBtvn = [
        {
          maBtvn: 'bt-done',
          tieuDe: 'Bài đã nộp',
          daNop: true,
        },
        {
          maBtvn: 'bt-urgent',
          tieuDe: 'Bài sát hạn',
          hanNop: new Date(bayGio + 2 * 3600 * 1000).toISOString(),
          daNop: false,
        },
        {
          maBtvn: 'bt-overdue',
          tieuDe: 'Bài quá hạn',
          hanNop: new Date(bayGio - 2 * 3600 * 1000).toISOString(),
          daNop: false,
        },
      ]

      const keHoach = tongHopKeHoachTroLy({
        sbd: '123456',
        hoTen: 'Trần Thị B',
        dsBtvn,
        dsMomGiao: [],
        dsLichSu: [],
        tongCauSai: 0,
      })

      expect(keHoach.radarDeadline.daXong).toBe(1)
      expect(keHoach.radarDeadline.sapHetHan).toBe(1)
      expect(keHoach.radarDeadline.quaHan).toBe(1)
      expect(keHoach.loiKhuyenSuPham.tieuDe).toContain('Ưu tiên giải quyết các bài sắp đến hạn')
    })
  })
})
