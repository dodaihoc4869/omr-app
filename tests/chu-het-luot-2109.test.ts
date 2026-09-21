// CÂU "HẾT LƯỢT CÂU GAME HÔM NAY" (Boss 19:5x: thầy "mới làm 58 câu mà chưa mở được đoàn"): trần game/ngày máy chủ đã HẠ 200 → 60 (`game-v2-luot.ts` TRAN_CAU_GAME_NGAY = 36 Đảo + 24 Đoàn) mà chữ trên màn vẫn cứng "200 câu".
// Sửa: màn KHÔNG viết cứng số — đọc `tranNgay` + `dailyUsed` của lệnh `recommendations`; máy chủ cũ chưa gửi ⇒ câu không số. Máy chủ đếm LƯỢT trả lời nên em nhớ "58 câu" vẫn có thể đã chạm 60.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { CHU_HET_CAU_MOI, chuChangHomNay, chuHetChang, chuHetLuotDao, chuHetLuotDoan, daChamTran, daHetChang, docChangHomNay, docLuotCauNgay, soDaChoiTrenTran } from '../src/game/than-thu-v2/chu-het-luot'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

describe('docLuotCauNgay — đọc chặt hai số máy chủ gửi', () => {
  it('đủ hai số ⇒ giữ; thiếu ⇒ vắng từng số; hỏng (âm, lẻ, chữ, trần 0) ⇒ vắng', () => {
    expect(docLuotCauNgay({ dailyUsed: 60, tranNgay: 60 })).toEqual({ daDung: 60, tran: 60 })
    expect(docLuotCauNgay({ dailyUsed: 12 })).toEqual({ daDung: 12, tran: undefined })
    expect(docLuotCauNgay({ tranNgay: 60 })).toEqual({ daDung: undefined, tran: 60 })
    expect(docLuotCauNgay({})).toEqual({ daDung: undefined, tran: undefined })
    expect(docLuotCauNgay(null)).toEqual({ daDung: undefined, tran: undefined })
    expect(docLuotCauNgay(undefined)).toEqual({ daDung: undefined, tran: undefined })
    for (const hong of [-1, 2.5, 'x', null, Number.NaN]) expect(docLuotCauNgay({ dailyUsed: hong, tranNgay: hong }), String(hong)).toEqual({ daDung: undefined, tran: undefined })
    expect(docLuotCauNgay({ dailyUsed: 5, tranNgay: 0 }).tran).toBeUndefined() // trần 0 vô nghĩa
  })
})

describe('soDaChoiTrenTran — chỉ nói "60/60" khi máy chủ nói trần VÀ em đã chạm trần', () => {
  it('đã dùng ≥ trần ⇒ "trần/trần"; chưa chạm hoặc thiếu số ⇒ null', () => {
    expect(soDaChoiTrenTran({ daDung: 60, tran: 60 })).toBe('60/60')
    expect(soDaChoiTrenTran({ daDung: 75, tran: 60 })).toBe('60/60') // máy chủ đếm lượt: hơn trần vẫn ghi trần
    expect(soDaChoiTrenTran({ daDung: 58, tran: 60 })).toBeNull()
    expect(soDaChoiTrenTran({ daDung: 60, tran: 0 })).toBeNull() // trần 0 vô nghĩa, không nói "0/0"
    expect(soDaChoiTrenTran({ daDung: 60 })).toBeNull()
    expect(soDaChoiTrenTran({ tran: 60 })).toBeNull()
    expect(soDaChoiTrenTran(null)).toBeNull()
    expect(soDaChoiTrenTran(undefined)).toBeNull()
  })
})

describe('chữ hết lượt', () => {
  it('Đoàn: có số ⇒ "Hôm nay em đã đi 60/60 câu Đoàn Hộ Tống — mai mình đi tiếp nhé."; máy chủ cũ ⇒ "Em đã đi đủ số câu Đoàn Hộ Tống của hôm nay — mai mình đi tiếp nhé."', () => {
    expect(chuHetLuotDoan({ daDung: 60, tran: 60 })).toBe('Hôm nay em đã đi 60/60 câu Đoàn Hộ Tống — mai mình đi tiếp nhé.')
    expect(chuHetLuotDoan()).toBe('Em đã đi đủ số câu Đoàn Hộ Tống của hôm nay — mai mình đi tiếp nhé.')
    expect(chuHetLuotDoan(null)).toBe('Em đã đi đủ số câu Đoàn Hộ Tống của hôm nay — mai mình đi tiếp nhé.')
    expect(chuHetLuotDoan({ daDung: 30, tran: 60 })).toBe('Em đã đi đủ số câu Đoàn Hộ Tống của hôm nay — mai mình đi tiếp nhé.')
  })
  it('Đảo: số của ĐẢO (trần riêng 36), kết bằng chuyến mới của đảo', () => {
    expect(chuHetLuotDao({ daDung: 36, tran: 36 })).toBe('Hôm nay em đã đi 36/36 câu Đảo thần thú. Mai đảo có chuyến mới.')
    expect(chuHetLuotDao()).toBe('Em đã đi đủ số câu Đảo thần thú của hôm nay. Mai đảo có chuyến mới.')
  })
  it('không câu nào chứa số cứng 200 / 60 (số chỉ đến từ máy chủ)', () => {
    expect(chuHetLuotDoan()).not.toMatch(/\d/)
    expect(chuHetLuotDao()).not.toMatch(/\d/)
    expect(chuHetLuotDoan({ daDung: 99, tran: 99 })).toContain('99/99')
  })
})

describe('daChamTran — hết lượt chỉ khi có ĐỦ hai số và đã chạm trần', () => {
  it('đủ số + đã dùng ≥ trần ⇒ true; thiếu số (máy chủ cũ) / chưa chạm / trần 0 ⇒ false (màn không tự khoá)', () => {
    expect(daChamTran({ daDung: 60, tran: 60 })).toBe(true)
    expect(daChamTran({ daDung: 61, tran: 60 })).toBe(true)
    expect(daChamTran({ daDung: 59, tran: 60 })).toBe(false)
    expect(daChamTran({ tran: 60 })).toBe(false)
    expect(daChamTran({ daDung: 60 })).toBe(false)
    expect(daChamTran({ daDung: 5, tran: 0 })).toBe(false)
    expect(daChamTran(null)).toBe(false)
    expect(daChamTran(undefined)).toBe(false)
  })
})

describe('chặng hôm nay (doan-sanh.changHomNay) + hetCauMoi', () => {
  it('docChangHomNay đọc chặt: đủ hai số nguyên không âm, trần > 0; vắng / hỏng ⇒ null', () => {
    expect(docChangHomNay({ changHomNay: { daDi: 2, toiDa: 6 } })).toEqual({ daDi: 2, toiDa: 6 })
    expect(docChangHomNay({ changHomNay: { daDi: 0, toiDa: 6 } })).toEqual({ daDi: 0, toiDa: 6 })
    for (const hong of [null, undefined, 'x', 5, [], {}, { daDi: 2 }, { toiDa: 6 }, { daDi: -1, toiDa: 6 }, { daDi: 2.5, toiDa: 6 }, { daDi: 2, toiDa: 0 }, { daDi: '2', toiDa: 6 }]) expect(docChangHomNay({ changHomNay: hong }), JSON.stringify(hong)).toBeNull()
    expect(docChangHomNay(null)).toBeNull()
    expect(docChangHomNay({})).toBeNull()
  })
  it('daHetChang: đi ≥ trần ⇒ hết; chữ theo số máy chủ nói (không cứng 6)', () => {
    expect(daHetChang({ daDi: 6, toiDa: 6 })).toBe(true)
    expect(daHetChang({ daDi: 7, toiDa: 6 })).toBe(true)
    expect(daHetChang({ daDi: 5, toiDa: 6 })).toBe(false)
    expect(daHetChang(null)).toBe(false)
    expect(chuChangHomNay({ daDi: 2, toiDa: 6 })).toBe('Đã đi 2/6 chặng hôm nay')
    expect(chuChangHomNay({ daDi: 9, toiDa: 6 })).toBe('Đã đi 6/6 chặng hôm nay') // không nói quá trần
    expect(chuChangHomNay({ daDi: 1, toiDa: 4 })).toBe('Đã đi 1/4 chặng hôm nay')
    expect(chuHetChang({ daDi: 6, toiDa: 6 })).toBe('Hôm nay em đã đi đủ 6 chặng — mai mình đi tiếp nhé.')
    expect(chuHetChang({ daDi: 4, toiDa: 4 })).toContain('đủ 4 chặng')
  })
  it('câu hết câu mới: máy nói thật', () => {
    expect(CHU_HET_CAU_MOI).toBe('Hôm nay hết câu mới cho em, có vài câu em từng làm lâu rồi.')
  })
})

describe('khoá nguồn: chữ "200 câu" đã gỡ, trần đọc từ máy chủ', () => {
  it('DoanSanh + DaoCuaEm không còn "200 câu"; DoanHoTong + DaoThanThu đọc qua docLuotCauNgay', () => {
    expect(doc('src/game/than-thu-v2/DoanSanh.tsx')).not.toMatch(/200 câu/)
    expect(doc('src/game/than-thu-v2/dao/DaoCuaEm.tsx')).not.toMatch(/200 câu/)
    expect(doc('src/game/than-thu-v2/DoanHoTong.tsx')).toMatch(/const l = docLuotCauNgay\(x\); setLuotDoan\(/) // số của ĐOÀN từ doan-sanh
    expect(doc('src/game/than-thu-v2/DoanHoTong.tsx')).not.toMatch(/hetLuot: x\.remaining === 0/) // recommendations = Đảo, không dùng cho hết-lượt của Đoàn
    expect(doc('src/game/than-thu-v2/dao/DaoThanThu.tsx')).toMatch(/setLuotCau\(docLuotCauNgay\(r\)\)/)
    expect(doc('src/game/than-thu-v2/dao/DaoThanThu.tsx')).toMatch(/luotCau=\{luotCau\}/)
  })
})
