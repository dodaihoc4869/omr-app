// VÁ 19/09 — sự cố "chọn rút đề chương 1 Ester nhưng đề ra cả chương 2
// Carbohidrate" (thầy báo qua ảnh chụp nhóm chat phụ huynh: "8 câu chương 2",
// "4 câu chương 2 sai hết", "2 câu chương 2").
//
// NGUYÊN NHÂN GỐC: câu "khắc phục" (30% câu em từng sai, TI_LE_CAU_LAP) được
// phép lấy từ CẢ KHO CÂU của thầy, không lọc chuyên đề (đúng ý thầy chốt
// 08/09: "bất kể là tôi chọn chuyên đề gì"). Nhưng số câu khắc phục CẦN
// (`can`) trước đây chỉ giới hạn theo SỐ CÂU EM TỪNG SAI Ở CA TRƯỚC, không
// giới hạn theo TỔNG SỐ CÂU CỦA ĐỀ MỚI — nên em có lịch sử sai nhiều (nhiều
// ca cộng dồn, hoặc một ca sai nhiều) có thể bị câu khắc phục (từ bất kỳ
// chương nào) lấp gần hết đề mới, vượt xa tỉ lệ 30% thầy hình dung. Với đề
// chuẩn 14 câu (9-2-3), `TRAN_PHAN_BO_14_CAU` chặn được, NHƯNG có đường vòng
// `phanConLai` (câu không phân loại được phần I/II/III vì không có trong kho
// đang rút) bỏ qua trần đó — đúng con đường một câu chương khác lọt vào.
//
// Test dưới tái hiện đúng con số thầy báo: em sai 24 câu ở lịch sử (hoàn toàn
// có thật với `PHAM_VI_HOI_LAI='ba_ca'` cộng dồn 3 ca, hoặc một ca sai nhiều)
// từng ra ĐÚNG 8 câu khắc phục trong đề 14 câu trước khi vá — nay bị chặn ở 5.
import { describe, expect, it } from 'vitest'
import { chonCauLapChoEm, type CaTruocDaCham } from '../src/lib/de-rieng'
import { soCauLapCan } from '../src/lib/cau-hinh-de-rieng'

describe('Trần câu khắc phục theo % ĐỀ MỚI (vá 19/09)', () => {
  it('em sai 24 câu ở lịch sử, đề mới 14 câu: KHÔNG được vượt quá 5 câu khắc phục (30% của 14)', () => {
    const daSai = Array.from({ length: 24 }, (_, i) => `I-lich-su-${i}`)
    const ca: CaTruocDaCham = {
      maCa: 'ca-cu',
      daLamCua: { '12000': daSai },
      saiCua: { '12000': daSai },
    }
    // Trước vá: soCauLapCan(24) = ceil(24*0.3) = 8 → đúng con số "8 câu
    // chương 2" thầy báo. Khẳng định lại công thức gốc chưa đổi, chỉ thêm
    // trần thứ hai theo đề mới.
    expect(soCauLapCan(24)).toBe(8)

    const lap = chonCauLapChoEm('12000', [ca], 14, {})
    expect(lap.can).toBeLessThanOrEqual(5) // ceil(14 * 0.3) = 5
    expect(lap.qids.length).toBeLessThanOrEqual(5)
  })

  it('đề mới KHÔNG phải cấu trúc 14 câu chuẩn (ví dụ 20 câu): vẫn chặn đúng 30% của đề mới, không chặn theo số câu em từng sai', () => {
    const daSai = Array.from({ length: 30 }, (_, i) => `I-lich-su-${i}`)
    const ca: CaTruocDaCham = {
      maCa: 'ca-cu',
      daLamCua: { '12000': daSai },
      saiCua: { '12000': daSai },
    }
    // Trước vá: min(ceil(30*0.3)=9, 20) = 9 câu (45% đề — không có trần theo
    // phần vì `tranCau !== 14` nên TRAN_PHAN_BO_14_CAU không áp dụng).
    const lap = chonCauLapChoEm('12000', [ca], 20, {})
    expect(lap.can).toBeLessThanOrEqual(6) // ceil(20 * 0.3) = 6
    expect(lap.qids.length).toBeLessThanOrEqual(6)
  })

  it('ca đúng ví dụ thầy chốt 08/09 (sai 9 câu ở ca trước, đề 14 câu) — HÀNH VI KHÔNG ĐỔI, vẫn ra đúng 3 câu', () => {
    const daSai = Array.from({ length: 9 }, (_, i) => `I-lich-su-${i}`)
    const ca: CaTruocDaCham = {
      maCa: 'ca-cu',
      daLamCua: { '12000': daSai },
      saiCua: { '12000': daSai },
    }
    const lap = chonCauLapChoEm('12000', [ca], 14, {})
    expect(lap.can).toBe(3)
    expect(lap.qids.length).toBe(3)
  })
})
