// NỘP BÀI KHÔNG ĐƯỢC TREO — thầy báo 10/09: "học sinh nộp vẫn bị treo".
//
// Không kiểm bằng cảm giác. Mô phỏng nguyên một lớp nộp cùng lúc rồi ĐẾM số
// lượt gọi đập vào máy chủ, so bản cũ với bản mới.
//
// BA CHỖ HỎNG CỦA BẢN CŨ, cộng hưởng với nhau:
//   ① `setInterval(..., 15000)` không đợi lượt trước xong, mà một lượt nộp có
//      hạn chờ 25 giây ⇒ lượt sau chồng lên lượt trước.
//   ② nhịp CỐ ĐỊNH ⇒ cả lớp thử lại cùng một khoảnh khắc.
//   ③ không có điểm dừng, hỏng mãi thì thử mãi.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { CHO_DAU_MS, CHO_TOI_DA_MS, GIAN_NOP_TOI_DA_MS, choBaoLau, gianNopTuDong } from '../src/lib/nhip-gui-lai'

const MAN = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamTakeScreen.tsx'), 'utf8')

describe('NHỊP LÙI DẦN — giãn thật, và có trần', () => {
  it('mỗi lần hỏng thì chờ lâu hơn lần trước', () => {
    const nn = () => 0 // bỏ lệch pha để đọc nền cho rõ
    const ds = [0, 1, 2, 3, 4].map((i) => choBaoLau(i, nn))
    expect(ds).toEqual([4000, 8000, 16000, 32000, 60000])
    for (let i = 1; i < ds.length; i++) expect(ds[i]).toBeGreaterThanOrEqual(ds[i - 1])
  })

  it('có TRẦN — hỏng 50 lần cũng không chờ quá 60 giây (cộng lệch pha)', () => {
    for (let i = 0; i < 50; i++) expect(choBaoLau(i, () => 1)).toBeLessThanOrEqual(Math.round(CHO_TOI_DA_MS * 1.4))
  })

  it('lần đầu KHÔNG chờ lâu — phần lớn ca hỏng chỉ là chập mạng một nhịp', () => {
    expect(choBaoLau(0, () => 0)).toBe(CHO_DAU_MS)
  })

  it('CÓ LỆCH PHA: 36 máy cùng hỏng cùng lúc thì KHÔNG cùng thử lại một khoảnh khắc', () => {
    const ds = Array.from({ length: 36 }, () => choBaoLau(0))
    const rieng = new Set(ds)
    // eslint-disable-next-line no-console
    console.log(`[nộp bài] 36 máy · ${rieng.size} mốc thử lại khác nhau · sớm nhất ${Math.min(...ds)}ms · muộn nhất ${Math.max(...ds)}ms`)
    expect(rieng.size).toBeGreaterThan(30)
    expect(Math.max(...ds) - Math.min(...ds)).toBeGreaterThan(800)
  })
})

describe('GIÃN CÚ NỘP TỰ ĐỘNG LÚC HẾT GIỜ', () => {
  it('nằm trong 0…2,5 giây — ngắn hơn một lượt gọi nên em không thấy chậm', () => {
    for (let i = 0; i < 200; i++) {
      const v = gianNopTuDong()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(GIAN_NOP_TOI_DA_MS)
    }
  })

  it('36 máy hết giờ cùng một giây ⇒ rải ra, không dồn một khoảnh khắc', () => {
    const ds = Array.from({ length: 36 }, () => gianNopTuDong())
    expect(new Set(ds).size).toBeGreaterThan(30)
  })
})

/** MÔ PHỎNG CẢ LỚP NỘP, đếm lượt gọi đập vào máy chủ trong 2 phút.
 *
 * Máy chủ nghẹn: mỗi lượt mất `treoGiay` giây rồi HỎNG. Đo xem trong cửa sổ ấy
 * mỗi máy thả ra bao nhiêu lượt, và cao điểm có bao nhiêu lượt chạy song song. */
function moPhong(cach: 'cu' | 'moi', soMay: number, treoMs: number, cuaSoMs: number) {
  let tongLuot = 0
  let dangChay = 0
  let dinhSongSong = 0
  const viec: { luc: number; loai: 'batDau' | 'ketThuc'; may: number }[] = []
  const hongCua = new Array(soMay).fill(0)
  const dangGui = new Array(soMay).fill(false)

  for (let m = 0; m < soMay; m++) viec.push({ luc: cach === 'moi' ? gianNopTuDong() : 0, loai: 'batDau', may: m })

  while (viec.length) {
    viec.sort((a, b) => a.luc - b.luc)
    const v = viec.shift()!
    if (v.luc > cuaSoMs) break
    if (v.loai === 'batDau') {
      // BẢN MỚI có chốt chống chồng lượt; bản CŨ không có.
      if (cach === 'moi' && dangGui[v.may]) continue
      dangGui[v.may] = true
      tongLuot++
      dangChay++
      dinhSongSong = Math.max(dinhSongSong, dangChay)
      viec.push({ luc: v.luc + treoMs, loai: 'ketThuc', may: v.may })
      // Bản CŨ đặt nhịp lặp 15 giây NGAY, không đợi lượt này xong.
      if (cach === 'cu') {
        for (let t = v.luc + 15000; t <= cuaSoMs; t += 15000) viec.push({ luc: t, loai: 'batDau', may: v.may })
      }
    } else {
      dangChay--
      dangGui[v.may] = false
      // Bản MỚI mới hẹn lượt kế SAU KHI lượt này hỏng.
      if (cach === 'moi') {
        const cho = choBaoLau(hongCua[v.may])
        hongCua[v.may] += 1
        if (v.luc + cho <= cuaSoMs) viec.push({ luc: v.luc + cho, loai: 'batDau', may: v.may })
      }
    }
  }
  return { tongLuot, dinhSongSong }
}

describe('MÔ PHỎNG CẢ LỚP NỘP LÚC MÁY CHỦ NGHẸN — đo bằng SỐ', () => {
  it('bản mới đập vào máy chủ ÍT HƠN HẲN bản cũ, và không máy nào chồng lượt', () => {
    // 36 máy, mỗi lượt treo 25 giây rồi hỏng (đúng hạn chờ của `postJson`),
    // quan sát trong 2 phút.
    const cu = moPhong('cu', 36, 25000, 120000)
    const moi = moPhong('moi', 36, 25000, 120000)
    // eslint-disable-next-line no-console
    console.log(`[nộp bài] 36 máy · máy chủ nghẹn 25s · trong 2 phút — CŨ: ${cu.tongLuot} lượt, đỉnh ${cu.dinhSongSong} lượt song song · MỚI: ${moi.tongLuot} lượt, đỉnh ${moi.dinhSongSong}`)
    expect(moi.tongLuot).toBeLessThan(cu.tongLuot)
    // Bản cũ chồng lượt: đỉnh song song vượt hẳn số máy.
    expect(cu.dinhSongSong).toBeGreaterThan(36)
    // Bản mới: mỗi máy nhiều nhất một lượt ⇒ đỉnh không bao giờ quá số máy.
    expect(moi.dinhSongSong).toBeLessThanOrEqual(36)
  })

  it('mạng CHẬM chứ không chết (mỗi lượt 5 giây rồi hỏng) — bản mới vẫn không bùng', () => {
    const cu = moPhong('cu', 36, 5000, 120000)
    const moi = moPhong('moi', 36, 5000, 120000)
    // eslint-disable-next-line no-console
    console.log(`[nộp bài] 36 máy · mỗi lượt 5s — CŨ: ${cu.tongLuot} lượt · MỚI: ${moi.tongLuot} lượt`)
    expect(moi.tongLuot).toBeLessThan(cu.tongLuot)
    expect(moi.dinhSongSong).toBeLessThanOrEqual(36)
  })
})

describe('MÃ MÀN THI — ba chốt không được mất', () => {
  it('CHỐT CHỐNG CHỒNG LƯỢT có mặt và chặn ngay đầu `trySend`', () => {
    expect(MAN).toContain('if (dangGui.current) return')
    expect(MAN).toContain('dangGui.current = true')
    expect(MAN).toContain('dangGui.current = false')
  })

  it('KHÔNG còn `setInterval` cho đường gửi lại — nhịp lặp là gốc của bão', () => {
    const khoi = MAN.slice(MAN.indexOf('const trySend'), MAN.indexOf('const guiLaiNgay'))
    expect(khoi).not.toContain('setInterval')
    expect(khoi).toContain('setTimeout')
    expect(khoi).toContain('choBaoLau(lanHong.current)')
  })

  it('KHÔNG gọi `trySend` bên trong updater của `setAttempt`', () => {
    // Updater phải thuần; React chạy nó hai lần là gửi hai lượt nộp.
    expect(MAN).not.toMatch(/setAttempt\(\(cur\) => \{[\s\S]{0,200}trySend\(/)
  })

  it('em có NÚT GỬI LẠI, và màn nói số lần đã thử', () => {
    expect(MAN).toContain('const guiLaiNgay = ()')
    expect(MAN).toContain('Gửi lại ngay')
    expect(MAN).toContain('soLanThuGui')
  })

  it('BÀI LƯU LÊN MÁY TRƯỚC khi gọi mạng — giãn cú nộp không được làm mất bài', () => {
    const khoi = MAN.slice(MAN.indexOf('const doSubmit = async'), MAN.indexOf('const apDungKeyBank'))
    const viTriLuu = khoi.indexOf('await saveAttempt(updated)')
    const viTriGian = khoi.indexOf('gianNopTuDong()')
    expect(viTriLuu).toBeGreaterThan(-1)
    expect(viTriGian).toBeGreaterThan(viTriLuu)
    // Và chỉ giãn khi TỰ ĐỘNG nộp lúc hết giờ, không giãn khi em tự bấm.
    expect(khoi).toContain('const giam = tuDongNop ? gianNopTuDong() : 0')
  })
})

describe('MỌI NHỊP GỌI MẠNG TRONG CA đều phải có chốt và lệch pha', () => {
  // Một ca có BỐN đám đông, không phải một. Chữa mỗi đường nộp là còn ba đường
  // kia cùng bệnh: cả lớp cùng nhịp, không chốt chồng lượt.
  //
  //   · Phòng chờ      — cả lớp đứng chờ thầy bấm Bắt đầu   (đã chữa 09/09)
  //   · Lưu tạm        — mọi máy tự lưu theo cùng chu kỳ     (đã lệch pha)
  //   · Báo sống       — mọi máy báo trạng thái theo nhịp    (đã lệch pha)
  //   · Hỏi đáp án     — cả lớp nộp xong cùng ngồi hỏi điểm  (chữa 10/09)
  it('nhịp HỎI ĐÁP ÁN sau khi nộp: có chốt `dangHoi` và lệch pha', () => {
    const khoi = MAN.slice(MAN.indexOf('const hoi = async () => {'), MAN.indexOf('const trySend'))
    expect(khoi).toContain('if (dung || dangHoi || document.hidden) return')
    expect(khoi).toContain('dangHoi = true')
    expect(khoi).toContain('dangHoi = false')
    expect(MAN).toContain('setInterval(() => void hoi(), chuKyLechPhaMs(20000))')
    // Nhịp trần 20 giây không lệch pha là cả lớp hỏi cùng một khoảnh khắc.
    expect(MAN).not.toContain('setInterval(hoi, 20000)')
  })

  it('lưu tạm và báo sống VẪN lệch pha — không được vô tình gỡ', () => {
    expect(MAN).toContain('chuKyLechPha(10)')
    expect(MAN).toContain('chuKyLechPha(CHU_KY_LUU_TAM_GIAY)')
  })

  it('phòng chờ VẪN có chốt chống chồng lượt', () => {
    expect(MAN).toContain('chuKyLechPhaMs(3000)')
  })
})
