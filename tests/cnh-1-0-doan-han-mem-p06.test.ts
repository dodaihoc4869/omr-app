// @vitest-environment node
// P06 (02 §8) — ĐOÀN HỘ TỐNG: HẠN MỀM theo từng em + ĐỒNG HỒ ĐỘI.
//   · hạn mềm MỘT CÂU = ceil(1,25 × solveSeconds), TỐI THIỂU 60 giây, KHÔNG chặn cứng 180;
//   · đồng hồ đội = max hạn mềm của các nhiệm vụ ĐANG MỞ (kể cả câu trùm), TỐI ĐA 300 giây/hiệp;
//   · mức game (`level`) KHÔNG tham gia hạn mềm hay độ khó.
import { describe, expect, it } from 'vitest'
import { giayCuaHiep, hanMemMotCau, TRAN_GIAY_HIEP } from '../src/game/than-thu-v2/doan-core'
import { GIAY_CO_SO as BANG_CHUNG } from '../src/lib/giay-co-so'
import { GIAY_CO_SO as BANG_MAY_CHU } from '../server/src/ho-so-cau-hinh'

describe('P06/02 §8 — hạn mềm Đoàn', () => {
  it('bảng giây gốc dùng chung KHÔNG trôi khỏi bảng của máy chủ (`server/src/ho-so-cau-hinh.ts`)', () => {
    expect(BANG_CHUNG).toEqual(BANG_MAY_CHU)
  })

  it('hạn mềm = ceil(1,25 × giây gốc) cho MỌI ô phần × mức', () => {
    for (const phan of ['I', 'II', 'III'] as const) {
      for (const [bac, mucDo] of [[0, 'biet'], [1, 'hieu'], [2, 'van_dung']] as const) {
        const goc = BANG_CHUNG[phan][bac]!
        expect(hanMemMotCau({ phan, mucDo }), `${phan}/${mucDo}`).toBe(Math.ceil(goc * 1.25))
      }
    }
    // vài số cụ thể của đặc tả
    expect(hanMemMotCau({ phan: 'I', mucDo: 'biet' })).toBe(94)
    expect(hanMemMotCau({ phan: 'I', mucDo: 'van_dung' })).toBe(188) // VƯỢT 180 — §8 cho phép
    expect(hanMemMotCau({ phan: 'II', mucDo: 'van_dung' })).toBe(375)
  })

  it('TỐI THIỂU 60 giây (câu rất ngắn vẫn không dưới 60)', () => {
    expect(hanMemMotCau({ phan: 'I', mucDo: 'biet', solveSeconds: 10 })).toBe(60)
    expect(hanMemMotCau({})).toBe(94) // thiếu phần/mức ⇒ rơi về ô I.biết
  })

  it('có SỐ ĐO riêng của em ⇒ hạn mềm bám theo em đó (không dùng giây gốc)', () => {
    expect(hanMemMotCau({ phan: 'II', mucDo: 'van_dung', solveSeconds: 240 })).toBe(300) // ceil(1,25 × 240)
    expect(hanMemMotCau({ phan: 'I', mucDo: 'biet', solveSeconds: 400 })).toBe(500) // không bị kẹp 180
  })

  it('đồng hồ ĐỘI = max hạn mềm của các nhiệm vụ đang mở, TRẦN 300 giây/hiệp', () => {
    expect(giayCuaHiep(1, [{ phan: 'I', mucDo: 'biet' }, { phan: 'I', mucDo: 'hieu' }])).toBe(132) // max(94; 132)
    expect(giayCuaHiep(1, [{ phan: 'II', mucDo: 'van_dung' }])).toBe(300) // 375 → kẹp trần đội
    expect(TRAN_GIAY_HIEP).toBe(300)
    // câu trùm là nhiệm vụ ĐANG MỞ của cả đội ⇒ phải được tính vào đồng hồ
    expect(giayCuaHiep(4, [{ phan: 'I', mucDo: 'biet' }, { phan: 'II', mucDo: 'hieu' }])).toBe(263) // ceil(1,25 × 210)
    // không có câu nào (dữ liệu cũ) ⇒ giữ hằng số cũ, KHÔNG rỗng/âm
    expect(giayCuaHiep(1, [])).toBe(40)
    expect(giayCuaHiep(4, [])).toBe(60)
  })

  it('MỨC GAME (level) KHÔNG tham gia hạn mềm', () => {
    const a = hanMemMotCau({ phan: 'I', mucDo: 'hieu' } as { phan: string; mucDo: string })
    const b = hanMemMotCau({ phan: 'I', mucDo: 'hieu', level: 99 } as unknown as { phan: string; mucDo: string })
    expect(b).toBe(a)
  })
})
