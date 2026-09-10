// T2 — CHỈ GỬI LƯU TẠM KHI ĐÁP ÁN THẬT SỰ ĐỔI (KHACPHUCTREOHANGLOAT.md).
//
// Phép kiểm này phải chứng minh ĐỦ HAI CHIỀU. Chỉ chứng minh chiều thứ nhất là
// vừa cắt tải vừa mở một đường mất bài không ai thấy:
//
//   CHIỀU CẮT   — nội dung không đổi thì KHÔNG chạm máy chủ.
//   CHIỀU GIỮ   — nhịp gửi HỎNG thì tuyệt đối không được coi như đã gửi; nhịp
//                 sau phải gửi lại, kể cả khi em không đổi thêm ô nào.
//
// Chiều thứ hai mới là chỗ dễ hỏng. Cách viết tự nhiên nhất — ghi nhớ chữ ký
// rồi mới gửi — làm một nhịp rớt mạng biến thành mất trắng phần bài em làm sau
// nhịp đó, và không có lỗi nào hiện ra để ai kịp biết.
import { describe, expect, it } from 'vitest'
import { CongNhip, NHIP_TIM_LUU_TAM_GIAY } from '../src/lib/nhip-gui'

describe('CHIỀU CẮT — bỏ nhịp khi không có gì đổi', () => {
  it('gửi lần đầu, rồi im khi nội dung y nguyên', () => {
    const c = new CongNhip()
    expect(c.nenGui('a', 0)).toBe(true)
    c.batDau()
    c.xong('a', 0)
    expect(c.nenGui('a', 1000)).toBe(false)
    expect(c.nenGui('a', 60_000)).toBe(false)
  })

  it('nội dung đổi là gửi ngay, không đợi nhịp tim', () => {
    const c = new CongNhip(NHIP_TIM_LUU_TAM_GIAY * 1000)
    c.batDau()
    c.xong('a', 0)
    expect(c.nenGui('b', 1)).toBe(true)
  })

  it('CẮT ĐƯỢC BAO NHIÊU — ca 45 phút, nhịp 20 giây, em đổi đáp án 28 lần', () => {
    const c = new CongNhip(NHIP_TIM_LUU_TAM_GIAY * 1000)
    const SO_NHIP = Math.floor((45 * 60) / 20) // 135
    // Em bấm câu mới ở 28 nhịp rải đều trong ca; các nhịp còn lại em đọc lại đề.
    const nhipCoDoi = new Set<number>()
    for (let k = 0; k < 28; k++) nhipCoDoi.add(Math.floor((k * SO_NHIP) / 28))

    let van = ''
    let soLuotGoi = 0
    for (let i = 0; i < SO_NHIP; i++) {
      const nay = i * 20_000
      if (nhipCoDoi.has(i)) van = `dapAn-${i}`
      if (!c.nenGui(van, nay)) continue
      soLuotGoi += 1
      c.batDau()
      c.xong(van, nay)
    }
    // eslint-disable-next-line no-console
    console.log(`[T2] ${SO_NHIP} nhịp · ${soLuotGoi} lượt chạm máy chủ · cắt ${Math.round((1 - soLuotGoi / SO_NHIP) * 100)}%`)
    // Đích của đặc tả (bảng mục 3 dòng 7): giảm ≥ 60%.
    expect(soLuotGoi / SO_NHIP).toBeLessThanOrEqual(0.4)
    // Và phải gửi ĐỦ 28 lần đổi — cắt mà nuốt mất một lần đổi là hỏng.
    expect(soLuotGoi).toBeGreaterThanOrEqual(28)
  })
})

describe('CHIỀU GIỮ — nhịp hỏng KHÔNG được coi là đã gửi', () => {
  it('gửi hỏng thì nhịp sau gửi lại, dù em không đổi gì', () => {
    const c = new CongNhip()
    expect(c.nenGui('a', 0)).toBe(true)
    c.batDau()
    c.hong() // rớt mạng
    expect(c.nenGui('a', 20_000)).toBe(true)
    c.batDau()
    c.hong()
    expect(c.nenGui('a', 40_000)).toBe(true)
    c.batDau()
    c.xong('a', 40_000)
    expect(c.nenGui('a', 60_000)).toBe(false)
  })

  it('KỊCH BẢN THẬT: nhịp rớt ở phút 30, em soát bài tới hết ca — bản cuối vẫn phải lên máy chủ', () => {
    const c = new CongNhip()
    const daNhanTrenMayChu: string[] = []
    let van = 'lam-xong-28-cau'
    let matMang = true

    for (let i = 0; i < 45; i++) {
      const nay = i * 20_000
      if (i >= 5) matMang = false // mạng có lại từ nhịp thứ 6
      if (!c.nenGui(van, nay)) continue
      c.batDau()
      if (matMang) c.hong()
      else {
        daNhanTrenMayChu.push(van)
        c.xong(van, nay)
      }
    }
    expect(daNhanTrenMayChu).toContain('lam-xong-28-cau')
    // Nhận rồi thì thôi, không gửi lại mãi.
    expect(daNhanTrenMayChu).toHaveLength(1)
    void van
  })

  it('không bắn chồng khi lượt trước còn đang bay', () => {
    const c = new CongNhip()
    expect(c.nenGui('a', 0)).toBe(true)
    c.batDau()
    expect(c.dangBay()).toBe(true)
    expect(c.nenGui('b', 20_000)).toBe(false)
    c.xong('a', 25_000)
    expect(c.dangBay()).toBe(false)
    expect(c.nenGui('b', 26_000)).toBe(true)
  })
})

describe('NHỊP TIM — gửi lại theo đồng hồ, chỉ theo chiều DÀY THÊM', () => {
  it('quá 5 phút không đổi gì thì vẫn gửi một lượt', () => {
    const c = new CongNhip(NHIP_TIM_LUU_TAM_GIAY * 1000)
    c.batDau()
    c.xong('a', 0)
    expect(c.nenGui('a', 299_000)).toBe(false)
    expect(c.nenGui('a', 300_000)).toBe(true)
  })

  it('không có nhịp tim (0) thì im hẳn khi không đổi', () => {
    const c = new CongNhip(0)
    c.batDau()
    c.xong('a', 0)
    expect(c.nenGui('a', 10_000_000)).toBe(false)
  })

  it('nhịp tim của lưu tạm là 5 phút, đúng như đặc tả T2', () => {
    expect(NHIP_TIM_LUU_TAM_GIAY).toBe(300)
  })
})

describe('MÃ NGUỒN — màn làm bài phải đi qua cổng, không được tự chế lại', () => {
  it('ExamTakeScreen dùng CongNhip cho cả lưu tạm lẫn trạng thái', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const s = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamTakeScreen.tsx'), 'utf8')
    expect(s).toContain('new CongNhip(NHIP_BAO_SONG_GIAY * 1000)')
    expect(s).toContain('new CongNhip(NHIP_TIM_LUU_TAM_GIAY * 1000)')
    // Cái bẫy cũ: một ref tự chế nhớ chữ ký TRƯỚC khi gửi.
    expect(s).not.toContain('daGuiRef')
  })

  it('`pushExamStatus` phải BÁO ĐƯỢC thành/bại, nếu không cổng nhịp mù', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const s = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-api.ts'), 'utf8')
    const dau = s.indexOf('export async function pushExamStatus')
    expect(dau).toBeGreaterThan(0)
    const than = s.slice(dau, dau + 1400)
    expect(than).toContain('Promise<boolean>')
    expect(than).toContain('return false')
  })

  it('CHU_KY_LUU_TAM_GIAY không bị nới ra — cấm giãn nhịp theo đồng hồ (mục 4)', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const s = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-api.ts'), 'utf8')
    const m = /export const CHU_KY_LUU_TAM_GIAY = (\d+)/.exec(s)
    expect(m).not.toBeNull()
    expect(Number(m![1])).toBeLessThanOrEqual(20)
  })
})
