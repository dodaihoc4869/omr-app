// T5 — MÁY EM PHẢI GIÃN RA VÀ BIẾT THỬ LẠI (KHACPHUCTREOHANGLOAT.md).
//
// Ba việc, và việc thứ ba là ràng buộc an toàn chứ không phải tốc độ:
//   ① giãn 0–3 giây trước lượt `vaoThi` đầu tiên;
//   ② thử lại có lùi 0,5 s → 1,5 s → 4 s, mỗi lần cộng nhiễu ±40%;
//   ③ CHỈ thử lại lệnh đã có khoá chống trùng — mục 4 cấm thẳng phần còn lại.
//
// Điều ③ là chỗ dễ hỏng nhất về sau: ai đó thấy `postCoThuLai` tiện rồi mang
// sang một lệnh ghi khác, và từ đó mỗi lần chập mạng là một dòng dữ liệu bị ghi
// hai lần. Nên nó được canh bằng một phép kiểm ĐỌC MÃ NGUỒN, liệt kê đích danh
// những lệnh được phép.
import { afterEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { GIAN_VAO_THI_TOI_DA_MS, gianVaoThi } from '../src/lib/nhip-gui-lai'
import { loiNenThuLai, nhipThuLai } from '../src/lib/exam-api'

const API = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-api.ts'), 'utf8')
const MAN = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamTakeScreen.tsx'), 'utf8')

describe('① GIÃN CÚ VÀO THI', () => {
  it('nằm trong 0…3 giây', () => {
    for (let i = 0; i < 300; i++) {
      const v = gianVaoThi()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(GIAN_VAO_THI_TOI_DA_MS)
    }
  })

  it('30 máy bấm cùng lúc ⇒ rải ra, không dồn một khoảnh khắc', () => {
    const ds = Array.from({ length: 30 }, () => gianVaoThi())
    // eslint-disable-next-line no-console
    console.log(`[T5] 30 máy vào thi · ${new Set(ds).size} mốc khác nhau · ${Math.min(...ds)}–${Math.max(...ds)}ms`)
    expect(new Set(ds).size).toBeGreaterThan(25)
    expect(Math.max(...ds) - Math.min(...ds)).toBeGreaterThan(1000)
  })

  it('CHỈ giãn LƯỢT ĐẦU — em bấm lại sau khi hỏng thì vào thẳng', () => {
    expect(MAN).toContain('if (!daGianVaoThiRef.current)')
    expect(MAN).toContain('daGianVaoThiRef.current = true')
  })
})

describe('② THỬ LẠI CÓ LÙI', () => {
  it('ba nhịp 0,5 s → 1,5 s → 4 s, đúng như đặc tả', () => {
    const giua = () => 0.5 // nhiễu = ×1,0
    expect([0, 1, 2].map((i) => nhipThuLai(i, giua))).toEqual([500, 1500, 4000])
  })

  it('mỗi nhịp sau chờ lâu hơn nhịp trước', () => {
    const g = () => 0.5
    expect(nhipThuLai(1, g)).toBeGreaterThan(nhipThuLai(0, g))
    expect(nhipThuLai(2, g)).toBeGreaterThan(nhipThuLai(1, g))
  })

  it('nhiễu đúng ±40%', () => {
    expect(nhipThuLai(0, () => 0)).toBe(300) // 500 × 0,6
    expect(nhipThuLai(0, () => 1)).toBe(700) // 500 × 1,4
  })

  it('30 máy cùng hỏng một lúc ⇒ KHÔNG cùng thử lại một khoảnh khắc', () => {
    const ds = Array.from({ length: 30 }, () => nhipThuLai(0))
    // eslint-disable-next-line no-console
    console.log(`[T5] 30 máy hỏng cùng lúc · ${new Set(ds).size} mốc thử lại · ${Math.min(...ds)}–${Math.max(...ds)}ms`)
    expect(new Set(ds).size).toBeGreaterThan(25)
    expect(Math.max(...ds) - Math.min(...ds)).toBeGreaterThan(200)
  })

  it('vượt số nhịp đã định thì giữ nhịp cuối, không nổ', () => {
    expect(nhipThuLai(9, () => 0.5)).toBe(4000)
  })
})

describe('② CHỈ THỬ LẠI LỖI ĐƯỜNG TRUYỀN', () => {
  it('hết hạn, mất mạng, 5xx, máy chủ bận ⇒ thử lại', () => {
    for (const s of [
      'Máy chủ không trả lời sau 30 giây. Kiểm tra mạng rồi thử lại.',
      'Failed to fetch',
      'NetworkError when attempting to fetch resource.',
      'Load failed',
      'Máy chủ trả lỗi HTTP 502',
      'Máy chủ đang bận — máy em giữ bài và gửi lại',
    ]) {
      expect(loiNenThuLai(new Error(s)), s).toBe(true)
    }
  })

  it('máy chủ TRẢ LỜI TỬ TẾ thì KHÔNG thử lại — thử nữa cũng vậy, chỉ làm nghẽn thêm', () => {
    for (const s of [
      'Số báo danh, họ tên hoặc năm sinh không khớp danh sách lớp',
      'Ca đã khoá — bài của em đã được nộp theo phần đã làm',
      'Không tìm thấy ca kiểm tra',
      'Em này chưa vào thi',
      'Máy chủ trả lỗi HTTP 404',
    ]) {
      expect(loiNenThuLai(new Error(s)), s).toBe(false)
    }
  })
})

describe('② THỬ LẠI CHẠY THẬT', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('hỏng mạng hai lần rồi được ⇒ vẫn trả kết quả, em không thấy lỗi', async () => {
    vi.resetModules()
    let lan = 0
    vi.stubGlobal('fetch', async () => {
      lan += 1
      if (lan <= 2) throw new Error('Failed to fetch')
      return new Response(JSON.stringify({ ok: true, cach: 'moi', lop: '12', thoiGianPhut: 45, lanThu: 1, vaoLuc: 'a', hetGioLuc: 'b' }), { status: 200 })
    })
    const { vaoThi } = await import('../src/lib/exam-api')
    const kq = await vaoThi('https://x/exec', 'ca1', '10001', 'tb', false)
    expect(kq.ok).toBe(true)
    expect(lan).toBe(3)
  }, 20000)

  it('lỗi máy chủ trả lời tử tế ⇒ CHỈ MỘT lượt, không thử lại', async () => {
    vi.resetModules()
    let lan = 0
    vi.stubGlobal('fetch', async () => {
      lan += 1
      return new Response(JSON.stringify({ ok: false, lyDo: 'khong_co_ca', error: 'Không tìm thấy ca kiểm tra' }), { status: 200 })
    })
    const { vaoThi } = await import('../src/lib/exam-api')
    const kq = await vaoThi('https://x/exec', 'ca1', '10001', 'tb', false)
    expect(kq.ok).toBe(false)
    expect(lan).toBe(1)
  })

  it('hỏng suốt ⇒ ném lỗi sau đúng 3 lượt, KHÔNG thử mãi', async () => {
    vi.resetModules()
    let lan = 0
    vi.stubGlobal('fetch', async () => {
      lan += 1
      throw new Error('Failed to fetch')
    })
    const { submitAnswers } = await import('../src/lib/exam-api')
    await expect(
      submitAnswers('https://x/exec', 'ca1', '10001', 'de', { phanI: {}, phanII: {}, phanIII: {} }, { leaveCount: 0, totalHiddenMs: 0, events: [], blocked: false }),
    ).rejects.toThrow()
    expect(lan).toBe(3)
  }, 20000)

  it('LƯU TẠM chỉ thử THÊM MỘT lần — nhịp sau còn tới, không việc gì phải cố', async () => {
    vi.resetModules()
    let lan = 0
    vi.stubGlobal('fetch', async () => {
      lan += 1
      throw new Error('Failed to fetch')
    })
    const { luuTam } = await import('../src/lib/exam-api')
    expect(await luuTam('https://x/exec', 'ca1', '10001', { phanI: {}, phanII: {}, phanIII: {} })).toBe(false)
    expect(lan).toBe(2)
  }, 20000)
})

describe('③ RÀNG BUỘC AN TOÀN — cấm thử lại lệnh ghi chưa có khoá chống trùng', () => {
  it('CHỈ ba lệnh được dùng `postCoThuLai`, đúng ba lệnh có khoá', () => {
    const duocPhep = ['vaoThi', 'submit', 'luuTam']
    const dungO: string[] = []
    const re = /postCoThuLai\(scriptUrl, \{ action: '(\w+)'/g
    let m: RegExpExecArray | null
    while ((m = re.exec(API)) !== null) dungO.push(m[1])
    expect(dungO.sort()).toEqual([...duocPhep].sort())
  })

  it('máy chủ THẬT SỰ có khoá chống trùng cho `submit` — nếu không, ③ chỉ là lời hứa', () => {
    const GS = fs.readFileSync(path.join(process.cwd(), 'docs/apps-script-kiem-tra.gs'), 'utf8')
    expect(GS).toContain('function khoaNop_(')
    expect(GS).toContain('function nopTrungRoi_(')
    expect(GS).toContain('if (nopTrungRoi_(luotCu, khoaLuotNop))')
    expect(GS).toContain("'KhoaNop'")
  })

  it('hạn chờ 30 giây CHỈ cho `vaoThi` và `submit`, phần còn lại giữ 25', () => {
    expect(API).toContain('const HAN_GIAY_DONG_NGUOI = 30')
    expect(API).toContain('const HAN_GIAY = 25')
    const soLan = (API.match(/HAN_GIAY_DONG_NGUOI\)/g) || []).length
    expect(soLan).toBe(2)
  })
})
