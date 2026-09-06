// DẠNG CÂU — lý thuyết / bài tập / ngẫu nhiên. Thầy chốt 06/09.
//
// Chỗ đáng kiểm nhất không phải "phân loại có đúng không" — kho không có nhãn
// thật nên không có đáp án để chấm. Đáng kiểm là: câu KHÔNG CHẮC có bị đẩy vào
// một trong hai nút chặt không. Đẩy vào là lặng lẽ sai, mà thầy thì tin cái nút.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  dangCua,
  demDang,
  diemDang,
  hopDang,
  LOC_DANG_MAC_DINH,
  MOC_BAI_TAP,
  MOC_LY_THUYET,
  MOI_LOC_DANG,
  soCauDung,
  TEN_LOC_DANG,
  type CauDeDoan,
} from '../src/lib/dang-cau'

const doc = (f: string) => readFileSync(resolve(__dirname, '..', f), 'utf8')

describe('phân loại dạng câu', () => {
  it('Phần III luôn là bài tập — đáp án là số em phải tính ra', () => {
    // Số đo 06/09: 578/578 câu Phần III trong kho đều là bài tập.
    expect(dangCua({ phan: 'III', text: 'Cho 5,6 gam Fe tác dụng…', dapAn: '0,1' })).toBe('bai_tap')
    // kể cả khi mặt chữ trông như lý thuyết
    expect(dangCua({ phan: 'III', text: 'Phát biểu nào đúng', mucDo: 'biet' })).toBe('bai_tap')
  })

  it('nhãn thật từ kho THẮNG mọi suy đoán', () => {
    // Khi pipeline nạp đề gắn `dang`, chỗ này thôi đoán.
    expect(dangCua({ phan: 'III', text: 'x', dang: 'ly_thuyet' })).toBe('ly_thuyet')
    expect(dangCua({ text: 'Tính khối lượng…', dapAn: '12', dang: 'ly_thuyet' })).toBe('ly_thuyet')
  })

  it('câu hỏi định nghĩa mức biết → lý thuyết', () => {
    const c: CauDeDoan = { phan: 'I', text: 'Phản ứng thuận nghịch là phản ứng hoá học mà', mucDo: 'biet' }
    expect(dangCua(c)).toBe('ly_thuyet')
  })

  it('câu bắt tính có đơn vị và động từ hỏi → bài tập', () => {
    const c: CauDeDoan = { phan: 'I', text: 'Cho 5,6 gam Fe tan hết trong dung dịch HCl. Tính thể tích khí thu được là bao nhiêu lít?', mucDo: 'van_dung' }
    expect(diemDang(c)).toBeGreaterThanOrEqual(MOC_BAI_TAP)
    expect(dangCua(c)).toBe('bai_tap')
  })

  it('ĐƠN VỊ LÀ ĐIỀU KIỆN, không phải phép tính → vẫn là lý thuyết', () => {
    // Đây là ca tôi đọc tay trên kho thật: 11 câu kiểu này, cả 11 gọi đúng.
    expect(dangCua({ phan: 'I', text: 'Tích số ion của nước ở 25 °C là', mucDo: 'biet' })).toBe('ly_thuyet')
    expect(dangCua({ phan: 'I', text: 'Môi trường kiềm (base) có khoảng giá trị pH ở 25 °C là', mucDo: 'biet' })).toBe('ly_thuyet')
  })

  it('DANH TỪ TRẦN không đủ để thành bài tập — phải có động từ hỏi', () => {
    // "khối lượng riêng của kim loại kiềm nhỏ vì…" là lý thuyết thuần.
    const c: CauDeDoan = { phan: 'I', text: 'Khối lượng riêng của kim loại kiềm nhỏ là do', mucDo: 'hieu' }
    expect(dangCua(c)).toBe('ly_thuyet')
  })

  it('CA KHÔNG CHẮC rơi vào chua_ro, KHÔNG bị nhét vào hai nút chặt', () => {
    // Có số và đơn vị nhưng câu hỏi lại là chọn phát biểu — đúng loại 207 câu
    // máy không tách nổi.
    const c: CauDeDoan = { phan: 'I', text: 'Hạt nhân nguyên tử sodium có 11 proton và 12 neutron, coi khối lượng electron không đáng kể. Khối lượng 1 mol nguyên tử là', mucDo: 'hieu' }
    const d = dangCua(c)
    expect(d).toBe('chua_ro')
    expect(hopDang(d, 'ly_thuyet')).toBe(false)
    expect(hopDang(d, 'bai_tap')).toBe(false)
    expect(hopDang(d, 'ngau_nhien')).toBe(true)
  })

  it('hai mốc không chồng nhau và có khoảng giữa cho chua_ro', () => {
    expect(MOC_LY_THUYET).toBeLessThan(MOC_BAI_TAP)
    expect(MOC_BAI_TAP - MOC_LY_THUYET).toBeGreaterThanOrEqual(2)
  })

  it('ngẫu nhiên là mặc định, và nó nhận CẢ câu chưa rõ', () => {
    expect(LOC_DANG_MAC_DINH).toBe('ngau_nhien')
    for (const d of ['ly_thuyet', 'bai_tap', 'chua_ro'] as const) expect(hopDang(d, 'ngau_nhien')).toBe(true)
  })

  it('đủ đúng ba lựa chọn, mỗi cái có tên tiếng Việt', () => {
    expect(MOI_LOC_DANG).toEqual(['ngau_nhien', 'ly_thuyet', 'bai_tap'])
    for (const d of MOI_LOC_DANG) expect(TEN_LOC_DANG[d].length).toBeGreaterThan(0)
  })

  it('đếm và báo số câu dùng được cho từng lựa chọn', () => {
    const dem = demDang([{ dang: 'ly_thuyet' }, { dang: 'ly_thuyet' }, { dang: 'bai_tap' }, { dang: 'chua_ro' }])
    expect(dem).toEqual({ ly_thuyet: 2, bai_tap: 1, chua_ro: 1 })
    expect(soCauDung(dem, 'ly_thuyet')).toBe(2)
    expect(soCauDung(dem, 'bai_tap')).toBe(1)
    // ngẫu nhiên đếm cả câu chưa rõ — đó là lý do nó luôn nhiều câu nhất
    expect(soCauDung(dem, 'ngau_nhien')).toBe(4)
  })

  it('luật ghi rõ SỐ ĐO THẬT, không phải số nhớ ra', () => {
    // Tôi đã báo nhầm một lần (19%) rồi phải đính chính thành 8%. Ghi số đo vào
    // file để lần sau ai đổi ngưỡng thì phải đo lại chứ không sửa chữ.
    const lib = doc('src/lib/dang-cau.ts')
    expect(lib).toContain('2.520 câu')
    expect(lib).toMatch(/1\.641/)
    expect(lib).toMatch(/672/)
    expect(lib).toMatch(/207/)
  })

  it('KHÔNG nhận đơn vị một chữ cái — chỗ đã làm hỏng lần đo đầu', () => {
    const lib = doc('src/lib/dang-cau.ts')
    // `M`, `L`, `V`, `A`, `%` khớp bừa vào công thức hoá học và phần trăm đồng
    // vị; giữ chúng thì `chua_ro` vọt từ 8 % lên 41 %.
    expect(lib).not.toMatch(/SO_KEM_DON_VI[^\n]*\|M\\b/)
    expect(lib).not.toMatch(/SO_KEM_DON_VI[^\n]*%/)
    // và phần trăm đồng vị thật sự không được tính là bài tập
    expect(dangCua({ phan: 'I', text: 'Trong tự nhiên bromine có hai đồng vị bền, đồng vị thứ nhất chiếm 50,69% số nguyên tử', mucDo: 'hieu' })).not.toBe('bai_tap')
  })
})
