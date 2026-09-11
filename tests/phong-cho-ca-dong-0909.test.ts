// PHÒNG CHỜ CỦA CA ĐÔNG — rà soát trước ca thi tối 09/09.
//
// ĐO TRÊN MÁY CHỦ THẬT (không phải phỏng đoán):
//
//   trangThaiPhongCho, gọi lẻ : 2,853 · 3,114 · 2,599 · 2,162 · 3,289 giây
//   8 lượt cùng lúc           : xong hết trong 2,754 giây, 0 hỏng
//   30 lượt cùng lúc          : 0 hỏng · giữa 2,85 s · chậm nhất 7,71 s
//   60 lượt cùng lúc          : 0 hỏng · giữa 3,57 s · chậm nhất 4,34 s
//
// KẾT LUẬN 1: máy chủ KHÔNG phải chỗ yếu. Sáu mươi máy cùng hỏi vẫn trả lời hết.
//
// KẾT LUẬN 2: nhịp hỏi của TỪNG MÁY mới là chỗ hở. Nhịp là 3 000 ms, mà một
// lượt mất 2,2–3,6 giây — tức lâu hơn chính nhịp. `setInterval` không đợi lượt
// trước xong, nên mỗi 3 giây máy em lại thả thêm một lượt vào hàng. Cả lớp cùng
// đứng chờ thầy bấm "Bắt đầu" là lúc đông nhất của ca, và cũng là lúc số lượt
// chồng lên nhau lớn nhất.
//
// Hai việc sửa, không đổi một hành vi nào thầy hay em nhìn thấy:
//   1. chốt chống chồng lượt: lượt trước chưa xong thì bỏ nhịp này.
//   2. lệch pha theo MILI GIÂY: `chuKyLechPha` cũ làm tròn về giây nên nhịp 3
//      giây chỉ ra 3 hoặc 4 — vẫn dồn cục.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { chuKyLechPha, chuKyLechPhaMs, LECH_PHA } from '../src/lib/exam-api'

const MAN = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamTakeScreen.tsx'), 'utf8')

/** Thân của đúng effect phòng chờ, cắt theo mốc chắc chắn nằm trong nó. */
function thanPhongCho(): string {
  const dau = MAN.indexOf("if (phase !== 'cho') return")
  expect(dau).toBeGreaterThan(0)
  return MAN.slice(dau, dau + 2200)
}

describe('chuKyLechPhaMs — rải nhịp ngắn bằng mili giây', () => {
  it('không bao giờ NGẮN hơn nhịp gốc', () => {
    for (const r of [0, 0.25, 0.5, 0.75, 0.999]) {
      expect(chuKyLechPhaMs(3000, () => r)).toBeGreaterThanOrEqual(3000)
    }
  })

  it('trần đúng bằng LECH_PHA, không nới thêm', () => {
    expect(chuKyLechPhaMs(3000, () => 0.999)).toBeLessThanOrEqual(3000 * (1 + LECH_PHA))
    expect(chuKyLechPhaMs(3000, () => 0)).toBe(3000)
  })

  it('RẢI THẬT: 200 máy ra nhiều hơn 50 mốc khác nhau', () => {
    let hat = 20260909
    const rnd = () => ((hat = (hat * 1103515245 + 12345) % 2147483648) / 2147483648)
    const moc = new Set(Array.from({ length: 200 }, () => chuKyLechPhaMs(3000, rnd)))
    expect(moc.size).toBeGreaterThan(50)
  })

  it('VÌ SAO KHÔNG DÙNG BẢN CŨ: làm tròn giây chỉ ra 3 hoặc 4 mốc', () => {
    let hat = 20260909
    const rnd = () => ((hat = (hat * 1103515245 + 12345) % 2147483648) / 2147483648)
    const moc = new Set(Array.from({ length: 200 }, () => chuKyLechPha(3, rnd)))
    expect(moc.size).toBeLessThanOrEqual(2)
  })

  it('bản cũ theo giây KHÔNG đổi hành vi — mọi chỗ đang dùng nó giữ nguyên', () => {
    expect(chuKyLechPha(20, () => 0)).toBe(20)
    expect(chuKyLechPha(20, () => 1)).toBe(28)
  })
})

describe('màn chờ: không chồng lượt, có lệch pha', () => {
  it('có chốt chống chồng lượt và chốt được nhả trong finally', () => {
    const than = thanPhongCho()
    expect(than).toContain('let dangHoi = false')
    // MỐC NEO ĐỔI 11/09: chốt nay còn phải nhường cả vòng vào-sau-bắt-đầu, nếu
    // không thì trong lúc em đang xếp hàng vào thi, nhịp hỏi phòng chờ vẫn thả
    // thêm lượt vào đúng hàng đợi đang tắc. Ý ĐỊNH KHÔNG ĐỔI — một máy, một
    // lượt hỏi tại một thời điểm.
    expect(than).toContain('if (dangHoi || dangVaoSauBatDauRef.current) return')
    expect(than).toContain('dangHoi = true')
    expect(than).toMatch(/finally \{\s*\n\s*dangHoi = false/)
  })

  it('nhịp đã lệch pha, KHÔNG còn hằng 3000 trần', () => {
    const than = thanPhongCho()
    // Mốc neo đổi 11/09: thân `setInterval` nay có thêm chốt ngừng hỏi khi đã
    // thấy `batDau`. Nhịp vẫn phải LỆCH PHA và vẫn là 3 giây.
    expect(than).toContain('chuKyLechPhaMs(3000)')
    expect(than).not.toContain('}, 3000)')
  })

  it('vẫn hỏi NGAY một lượt lúc vào chờ — em không đứng nhìn màn trắng 3 giây', () => {
    expect(thanPhongCho()).toContain('void hoi()\n')
  })

  it('vẫn dọn nhịp khi rời màn chờ', () => {
    expect(thanPhongCho()).toContain('clearInterval(dong)')
  })
})

/** Mô phỏng đúng cái hỏng: nhịp ngắn hơn độ trễ. Không có chốt thì số lượt
 * đang bay tăng không giới hạn; có chốt thì luôn đúng một. */
function moPhong(coChot: boolean, soNhip: number, doTreNhip: number) {
  let dangBay = 0
  let dinhCao = 0
  let dangHoi = false
  const xongLuc: number[] = []
  for (let nhip = 0; nhip < soNhip; nhip++) {
    while (xongLuc.length && xongLuc[0] <= nhip) {
      xongLuc.shift()
      dangBay--
      dangHoi = false
    }
    if (coChot && dangHoi) continue
    dangHoi = true
    dangBay++
    dinhCao = Math.max(dinhCao, dangBay)
    xongLuc.push(nhip + doTreNhip)
  }
  return dinhCao
}

describe('chốt chống chồng lượt — đo bằng mô phỏng đúng con số đã đo', () => {
  it('KHÔNG chốt: độ trễ 1,2 nhịp thì lượt đang bay chồng lên theo thời gian', () => {
    // 40 nhịp = 2 phút chờ ở nhịp 3 giây.
    expect(moPhong(false, 40, 2)).toBeGreaterThan(1)
  })

  it('CÓ chốt: mỗi máy luôn chỉ có ĐÚNG MỘT lượt đang bay, chờ bao lâu cũng vậy', () => {
    expect(moPhong(true, 40, 2)).toBe(1)
    expect(moPhong(true, 200, 5)).toBe(1)
  })

  it('máy chủ nhanh hơn nhịp thì chốt không cản gì', () => {
    expect(moPhong(true, 40, 0)).toBe(1)
    expect(moPhong(false, 40, 0)).toBe(1)
  })
})
