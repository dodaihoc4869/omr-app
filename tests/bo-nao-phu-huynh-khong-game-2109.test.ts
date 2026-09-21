// BỘ NÃO — LỜI CHO PHỤ HUYNH KHÔNG NHẮC GAME (thầy lệnh 21/09/2026; đề bài `prompt-ph-giao-them-bai-2109.md` mục B, Code 1): `loiNhanChoPhuHuynh` và `thuTuan` cấm thần thú, EXP, khiên, mảnh khiên, Đoàn Hộ Tống, Đảo, Võ đài, game.
// Sai ⇒ CHỈ bỏ lời ấy (giữ núm) như mọi lỗi lời phụ huynh; lời cho EM (em thấy game) KHÔNG bị cấm.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { TU_CAM_CHO_PHU_HUYNH, kiemKhuon, lamSachDauRa, timTuCam, type DauRaEm } from '../src/lib/bo-nao-khuon'
import { THE } from './_bo-nao-thu-thach-mau'

const the = { ...THE, khiNaoVietPhuHuynh: ['moc_dang_khen'], luotSoiKyTuan: true }
const nen = (o: Partial<DauRaEm> = {}): DauRaEm => ({
  biDanh: 'A17', doTinCay: 0.8, nhip: { lech: 0, khoiDong: 2 }, dang: [], khacPhuc: [], co: 'khong', loiNhanChoEm: '', loiNhanChoPhuHuynh: '', thuTuan: '',
  goiYChoThay: { chu: '', hanhDong: 'khong', dang: '' }, ghiChuHlv: '', canSau: false, ...o,
})
const TU_GAME = ['thần thú', 'EXP', 'khiên', 'mảnh khiên', 'Đoàn Hộ Tống', 'Đảo', 'Võ đài', 'game', 'trò chơi']
const LOI_SACH = 'Anh chị ơi, con đã đúng lại 4 câu từng sai trong tuần này, bộ não đã xếp thêm vài câu cùng dạng để con luyện.'

describe('lời cho PHỤ HUYNH không nhắc game', () => {
  it('danh sách từ cấm của phụ huynh có đủ các từ game', () => {
    for (const t of ['thần thú', 'exp', 'khiên', 'mảnh khiên', 'đoàn hộ tống', 'đảo', 'võ đài', 'game', 'trò chơi']) expect(TU_CAM_CHO_PHU_HUYNH, t).toContain(t)
  })
  it('lời sạch qua; MỖI từ game bị chặn ở loiNhanChoPhuHuynh: phần tử vẫn hợp lệ, chỉ bỏ lời ấy, giữ núm', () => {
    const k0 = kiemKhuon(nen({ loiNhanChoPhuHuynh: LOI_SACH }), the)
    expect(k0.hopLe, JSON.stringify(k0.lyDo)).toBe(true)
    expect(k0.boLoi).toBeUndefined()
    for (const t of TU_GAME) {
      const d = nen({ loiNhanChoPhuHuynh: `Anh chị ơi, con đã đúng lại 4 câu từng sai, con còn ${t} để luyện thêm.`, nhip: { lech: -1, khoiDong: 3 } })
      const k = kiemKhuon(d, the)
      expect(k.hopLe, t).toBe(true)
      expect(k.boLoi, t).toEqual(['loiNhanChoPhuHuynh'])
      expect((k.canhBao ?? []).join(' '), t).toContain('có từ cấm')
      const sach = lamSachDauRa(d, k)
      expect(sach.loiNhanChoPhuHuynh).toBe('')
      expect(sach.nhip).toEqual({ lech: -1, khoiDong: 3 })
    }
  })
  it('thư tuần cũng vậy: mỗi từ game ⇒ bỏ thuTuan, giữ phần còn lại', () => {
    const tuan = 'Tuần này con làm được 24 câu, đúng 20 câu; con tiến ở dạng Thuỷ phân ester; chỗ còn vấp là Carb phân loại; tuần tới con thử thêm vài câu.'
    expect(kiemKhuon(nen({ thuTuan: tuan }), the).boLoi).toBeUndefined()
    for (const t of TU_GAME) {
      const k = kiemKhuon(nen({ thuTuan: `${tuan} Con còn ${t}.` }), the)
      expect(k.hopLe, t).toBe(true)
      expect(k.boLoi, t).toEqual(['thuTuan'])
    }
  })
  it('KHÔNG gộp nhầm: chữ thường gặp có chứa các âm tiết ấy vẫn được ("hòn đảo" là từ khác? — "đảo" bị cấm cố ý), "exp" chỉ khi là TỪ; "khiêng", "gameshow" không phải từ cấm', () => {
    expect(timTuCam('con khiêng bài giúp cô', TU_CAM_CHO_PHU_HUYNH)).toEqual([])
    expect(timTuCam('con thử thách bản thân', TU_CAM_CHO_PHU_HUYNH)).toEqual([])
    expect(timTuCam('con đã EXPERT hoá phần này', TU_CAM_CHO_PHU_HUYNH)).toEqual([])
    expect(timTuCam('Con làm đúng, con nhận EXP', TU_CAM_CHO_PHU_HUYNH)).toEqual(['exp'])
    expect(timTuCam('THẦN THÚ của con', TU_CAM_CHO_PHU_HUYNH)).toEqual(['thần thú'])
  })
  it('lời cho EM vẫn được nhắc thú / EXP (em thấy game): không bị danh sách phụ huynh chặn', () => {
    const k = kiemKhuon(nen({ loiNhanChoEm: 'Em đúng lại 4 câu từng sai, Rồng Lửa còn thiếu 40 EXP để lên cấp 6.' }), the)
    expect(k.hopLe, JSON.stringify(k.lyDo)).toBe(true)
  })
  it('LUAT-RUT-GON (≤ 1200 chữ) và cẩm nang dặn rõ: phụ huynh không thấy game', () => {
    const luat = readFileSync('bo-nao/LUAT-RUT-GON.md', 'utf8')
    const cn = readFileSync('bo-nao/HUONG-DAN-BO-NAO.md', 'utf8')
    expect(luat.split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(1200)
    for (const t of ['MỌI thứ của game', 'thần thú, EXP, khiên, Đoàn Hộ Tống, Đảo, Võ đài', 'phụ huynh không thấy game', 'cũng cấm game']) expect(luat, t).toContain(t)
    for (const t of ['MỌI thứ của game', 'mảnh khiên', 'Đoàn Hộ Tống', 'Võ đài', 'trò chơi', 'KHÔNG hiện gì của game']) expect(cn, t).toContain(t)
  })
})
