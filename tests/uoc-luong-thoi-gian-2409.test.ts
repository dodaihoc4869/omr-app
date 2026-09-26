// CNH-1.0 P02 §5.1 + §8 — BẰNG CHỨNG hàm thuần (ước lượng thời gian + hạn mềm/đồng hồ đội).
//
// §5.1 in nguyên văn công thức; §8 in nguyên văn hạn mềm + trần đồng hồ đội. Không D1, không đồng hồ.
import { describe, expect, it } from 'vitest'
import {
  GIAY_NEN,
  feedbackSeconds,
  giayNen,
  giayNenTong,
  heSoTheoLichSu,
  solveSeconds,
  taskSeconds,
  themDocGiay,
  themMediaGiay,
  trungVi,
} from '../src/lib/uoc-luong-thoi-gian'
import { DUNG_DONG_HO_MEM_THEO_8, GIAY_DONG_HOI_TOI_DA, GIAY_MEM_TOI_THIEU, giayCuaHiep, giayDongHoiMoCua, giayHiepTheoCo, giayMemMotTask, hetGioHiep } from '../src/game/than-thu-v2/doan-core'

describe('§5.1 · thời gian NỀN (nguyên văn bảng)', () => {
  it('baseSeconds(I,d)=[75,105,150] · (II,d)=[150,210,300] · (III,d)=[120,180,240]', () => {
    expect(GIAY_NEN.I).toEqual([75, 105, 150])
    expect(GIAY_NEN.II).toEqual([150, 210, 300])
    expect(GIAY_NEN.III).toEqual([120, 180, 240])
    expect(giayNen('I', 0)).toBe(75)
    expect(giayNen('II', 2)).toBe(300)
    expect(giayNen('III', 1)).toBe(180)
  })

  it('đầu vào lạ ⇒ NÉM (không bịa số)', () => {
    expect(() => giayNen('IV' as 'I', 0)).toThrow(/phần lạ/)
    expect(() => giayNen('I', 3 as 0)).toThrow(/độ khó lạ/)
  })
})

describe('§5.1 · readingExtra / mediaExtra (có TRẦN)', () => {
  it('readingExtra = min(120, max(0, ceil((visibleChars−300)/120)) × 10)', () => {
    expect(themDocGiay(0)).toBe(0)
    expect(themDocGiay(300)).toBe(0) // miễn phí 300 chữ đầu
    expect(themDocGiay(301)).toBe(10)
    expect(themDocGiay(420)).toBe(10)
    expect(themDocGiay(421)).toBe(20)
    expect(themDocGiay(1500)).toBe(100)
    expect(themDocGiay(1800)).toBe(120) // trần
    expect(themDocGiay(99999)).toBe(120)
  })

  it('mediaExtra = min(90, 30 × số bảng/hình)', () => {
    expect(themMediaGiay(0)).toBe(0)
    expect(themMediaGiay(1)).toBe(30)
    expect(themMediaGiay(3)).toBe(90)
    expect(themMediaGiay(9)).toBe(90) // trần
  })

  it('đầu vào âm/không phải số ⇒ NÉM', () => {
    expect(() => themDocGiay(-1)).toThrow(/>= 0/)
    expect(() => themMediaGiay(Number.NaN)).toThrow(/>= 0/)
  })

  it('base = baseSeconds + readingExtra + mediaExtra', () => {
    expect(giayNenTong({ phan: 'II', doKho: 1, visibleChars: 420, tableOrFigureCount: 1 })).toBe(210 + 10 + 30)
  })
})

describe('§5.1 · hệ số theo lịch sử (n<5 ⇒ 1; n>=5 ⇒ kẹp 0,75..2)', () => {
  it('trung vị: lẻ lấy giữa, chẵn lấy bình quân hai giữa', () => {
    expect(trungVi([3, 1, 2])).toBe(2)
    expect(trungVi([1, 2, 3, 4])).toBe(2.5)
    expect(() => trungVi([])).toThrow(/không có mẫu/)
  })

  it('n < 5 ⇒ hệ số 1 dù mẫu thế nào', () => {
    expect(heSoTheoLichSu(100, [50, 50, 50, 50])).toBe(1)
  })

  it('n >= 5 ⇒ trung vị(active/base), kẹp về [0,75; 2]', () => {
    expect(heSoTheoLichSu(100, [50, 100, 100, 150, 200])).toBe(1) // trung vị tỉ lệ = 1
    expect(heSoTheoLichSu(100, [300, 300, 300, 300, 300])).toBe(2) // kẹp trên
    expect(heSoTheoLichSu(100, [10, 10, 10, 10, 10])).toBe(0.75) // kẹp dưới
  })

  it('mẫu ngoài 10–900 giây bị BỎ (không dùng làm thời gian giải)', () => {
    // 5 mẫu nhưng 2 mẫu vô lệ ⇒ chỉ còn 3 ⇒ n < 5 ⇒ hệ số 1
    expect(heSoTheoLichSu(100, [5, 1000, 100, 100, 100])).toBe(1)
  })

  it('base <= 0 ⇒ hệ số 1 (không chia cho 0)', () => {
    expect(heSoTheoLichSu(0, [50, 60, 70, 80, 90])).toBe(1)
  })
})

describe('§5.1 · solveSeconds / feedbackSeconds / taskSeconds', () => {
  it('solveSeconds = ceil(base × factor)', () => {
    expect(solveSeconds({ phan: 'I', doKho: 0, visibleChars: 0, tableOrFigureCount: 0 })).toBe(75)
    expect(solveSeconds({ phan: 'II', doKho: 2, visibleChars: 0, tableOrFigureCount: 0 })).toBe(300)
  })

  it('feedbackSeconds = max(30, ceil(solve × 0,25)); taskSeconds = solve + feedback', () => {
    expect(feedbackSeconds(75)).toBe(30) // ceil(18.75)=19 < 30 ⇒ 30
    expect(feedbackSeconds(200)).toBe(50)
    expect(taskSeconds(200)).toBe(250)
    expect(taskSeconds(75)).toBe(105)
  })
})

describe('§8 · hạn MỀM cá nhân + ĐỒNG HỒ ĐỘI (mặc định TẮT, không đổi nhịp game đang sống)', () => {
  it('CỜ mặc định TẮT ⇒ `giayCuaHiep` cũ vẫn là đường đang chạy', () => {
    expect(DUNG_DONG_HO_MEM_THEO_8).toBe(false)
  })

  it('hạn mềm = max(60, ceil(1,25 × solveSeconds)) — KHÔNG kẹp ở 180', () => {
    expect(GIAY_MEM_TOI_THIEU).toBe(60)
    expect(giayMemMotTask(0)).toBe(60)
    expect(giayMemMotTask(48)).toBe(60) // ceil(60) = 60
    expect(giayMemMotTask(100)).toBe(125)
    expect(giayMemMotTask(144)).toBe(180)
    expect(giayMemMotTask(400)).toBe(500) // §8: "không chặn cứng ở 180 giây"
  })

  it('đồng hồ đội = min(300, max(hạn mềm các task ĐANG MỞ)); rỗng ⇒ 0', () => {
    expect(GIAY_DONG_HOI_TOI_DA).toBe(300)
    expect(giayDongHoiMoCua([])).toBe(0)
    expect(giayDongHoiMoCua([125, 200])).toBe(200)
    expect(giayDongHoiMoCua([125, 500])).toBe(300) // trần/hiệp
  })

  it('solveSeconds lạ ⇒ NÉM', () => {
    expect(() => giayMemMotTask(-1)).toThrow(/>= 0/)
    expect(() => giayMemMotTask(Number.NaN)).toThrow(/>= 0/)
  })

  it('`giayHiepTheoCo`: cờ TẮT ⇒ NGUYÊN nhịp cũ; cờ BẬT + có task mở ⇒ §8 (max hạn mềm, trần 300)', () => {
    const cau = [{ phan: 'I', mucDo: 'biet' as const, soTu: 100, coHinh: false }]
    // Cờ đang TẮT ⇒ phải bằng ĐÚNG `giayCuaHiep` cũ (bảo chứng "chưa đổi nhịp game đang sống").
    expect(giayHiepTheoCo(1, cau, [125, 400])).toBe(giayCuaHiep(1, cau))
    // Cờ BẬT mà CHƯA có task mở ⇒ QUAY VỀ nhịp CŨ (KHÔNG trả 0 — trả 0 là hết giờ tức thì).
    expect(giayHiepTheoCo(1, cau, [])).toBe(giayCuaHiep(1, cau))
    // Cờ BẬT + CÓ task mở ⇒ §8: max hạn mềm (trần 300). (Tham số cờ để TEST được đường BẬT.)
    expect(giayHiepTheoCo(1, cau, [125, 400], true)).toBe(300)
    expect(giayHiepTheoCo(1, cau, [125, 200], true)).toBe(200)
    expect(giayHiepTheoCo(1, cau, [125, 400], false)).toBe(giayCuaHiep(1, cau)) // cờ TẮT ⇒ bỏ qua danh sách
    // Hàm §8 khi có task mở: trần 300.
    expect(giayDongHoiMoCua([125, 400])).toBe(300)
    expect(giayDongHoiMoCua([])).toBe(0) // hàm THUẦN vẫn trả 0; việc "0 ⇒ quay về nhịp cũ" là ở `giayHiepTheoCo`
  })

  it('`hetGioHiep` giữ NGUYÊN hành vi cũ khi không truyền gì (tương thích ngược)', () => {
    // 3 tham số như mọi chỗ gọi cũ ⇒ y hệt `giayCuaHiep(hiep)` không kèm câu.
    const han = giayCuaHiep(1) * 1000
    expect(hetGioHiep(0, han - 1, 1)).toBe(false)
    expect(hetGioHiep(0, han, 1)).toBe(true)
  })
})
