// ĐỊA CHỈ MÁY CHỦ — MỘT NGUỒN CHO MỌI MÁY. 15/09.
//
// Thầy báo, kèm ảnh ca Test7 (SBD 12121212, 9 câu cần chữa):
//   "Nút khắc phục ngay 9 câu sai bấm không phản hồi trên điện thoại của học
//    sinh, trên Chrome máy tính vẫn bấm được. Sửa lại triệt để và đồng bộ hết
//    mọi báo cáo, mọi app, mọi chỗ."
//
// ĐO THẬT TRƯỚC KHI SỬA — gọi thẳng máy chủ, đúng em ấy, đúng ca ấy:
//   POST https://omr.ttadodaihoc.workers.dev/hs/cau-sai {sbd:'12121212',dsMaCa:['457868']}
//   → 200 · ok:true · 9 câu · 16.649 byte · 1.257 ms
// Máy chủ không hỏng, gói nhỏ, không có gì để chậm. Lỗi nằm ở MÁY EM.
//
// ĐO THẬT TRÊN MỘT MÁY SẠCH (trình duyệt chưa từng mở app): IndexedDB
// `omr-exam/settings` chỉ có ĐÚNG MỘT khoá — `mayChuMoi`. KHÔNG có `scriptUrl`.
//
// NGUYÊN NHÂN GỐC: `scriptUrl` là giá trị CHẾT mà vẫn canh cửa.
//   · 12/09 cắt hẳn Google ⇒ khoá `scriptUrl` bị gỡ khỏi `public/cau-hinh.json`.
//   · `loadScriptUrlHoacMacDinh()` chạy MỘT LẦN lúc màn mở; thua cuộc đua với
//     lượt nạp địa chỉ ở `main.tsx` thì nó đi tìm khoá `scriptUrl` trong
//     `cau-hinh.json` — khoá đã gỡ ⇒ rỗng, và KHÔNG ai thử lại cả phiên.
//   · Máy thầy còn khoá cũ trong IndexedDB từ trước 12/09 ⇒ luôn khác rỗng.
//   · Hai màn báo cáo canh `if (!baiThi.maCa || !scriptUrl) return` ⇒ trên máy
//     em lượt gọi `hsCauSai` KHÔNG BAO GIỜ được bắn đi.
//
// Cùng họ với vụ 60-vs-579 ngày 14/09: màn phụ thuộc một giá trị cất trong máy
// đang mở. Chữa bằng cách bỏ hẳn sự phụ thuộc, không phải đoán giá trị giỏi hơn.
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const gia = {
  cauHinh: { URL: '' } as { URL: string },
  nemCauHinh: false,
  napXong: 0,
  sauKhiNap: '' as string,
  tuTep: '' as string,
}

vi.mock('../src/lib/may-chu-moi', () => ({
  layCauHinhMayChu: async () => {
    if (gia.nemCauHinh) throw new Error('IndexedDB hỏng')
    return { ...gia.cauHinh }
  },
  xongNapDiaChi: async () => {
    gia.napXong += 1
    if (gia.sauKhiNap) gia.cauHinh.URL = gia.sauKhiNap
  },
}))

vi.mock('../src/lib/exam-db', () => ({
  loadDiaChiMayChuMoiChoEm: async () => gia.tuTep,
}))

const { layDiaChiMayChu, quenDiaChiMayChu } = await import('../src/lib/dia-chi-may-chu')

const MC = 'https://omr.ttadodaihoc.workers.dev'

beforeEach(() => {
  quenDiaChiMayChu()
  gia.cauHinh = { URL: '' }
  gia.nemCauHinh = false
  gia.napXong = 0
  gia.sauKhiNap = ''
  gia.tuTep = ''
})

describe('layDiaChiMayChu — bốn đường, đường nào ra trước thì lấy', () => {
  it('cấu hình trong máy có địa chỉ ⇒ lấy luôn, không cần gợi ý', async () => {
    gia.cauHinh.URL = MC
    expect(await layDiaChiMayChu('')).toBe(MC)
    expect(gia.napXong).toBe(0)
  })

  it('MÁY EM SẠCH, thua cuộc đua nạp địa chỉ ⇒ chờ nạp xong rồi vẫn ra', async () => {
    gia.sauKhiNap = MC
    expect(await layDiaChiMayChu('')).toBe(MC)
    expect(gia.napXong).toBe(1)
  })

  it('nạp vẫn rỗng ⇒ tải thẳng cau-hinh.json', async () => {
    gia.tuTep = MC
    expect(await layDiaChiMayChu('')).toBe(MC)
  })

  it('IndexedDB ném lỗi ⇒ KHÔNG ném ra ngoài, vẫn lấy được qua tệp', async () => {
    gia.nemCauHinh = true
    gia.tuTep = MC
    await expect(layDiaChiMayChu('')).resolves.toBe(MC)
  })

  it('không đường nào ra ⇒ trả chuỗi rỗng, cấm ném lỗi', async () => {
    await expect(layDiaChiMayChu('')).resolves.toBe('')
  })
})

describe('Ba điều cấm', () => {
  it('CẤM NHỚ CÁI RỖNG — lần trước rỗng thì lần này phải thử lại', async () => {
    expect(await layDiaChiMayChu('')).toBe('')
    gia.cauHinh.URL = MC
    expect(await layDiaChiMayChu('')).toBe(MC)
  })

  it('CẤM trả về địa chỉ Google — đường ấy cắt từ 12/09', async () => {
    gia.cauHinh.URL = 'https://script.google.com/macros/s/abc/exec'
    gia.tuTep = MC
    expect(await layDiaChiMayChu('https://script.google.com/macros/s/xyz/exec')).toBe(MC)
  })

  it('CẤM nhận địa chỉ không phải https', async () => {
    expect(await layDiaChiMayChu('http://omr.ttadodaihoc.workers.dev')).toBe('')
  })

  it('nhớ địa chỉ ĐÃ ra được để khỏi hỏi lại mỗi lượt', async () => {
    gia.cauHinh.URL = MC
    expect(await layDiaChiMayChu('')).toBe(MC)
    gia.nemCauHinh = true
    expect(await layDiaChiMayChu('')).toBe(MC)
  })

  it('bỏ dấu / thừa ở cuối', async () => {
    gia.cauHinh.URL = MC + '///'
    expect(await layDiaChiMayChu('')).toBe(MC)
  })
})

// ---------------------------------------------------------------------------
// SOI MÃ CHẠY — "đồng bộ hết mọi báo cáo, mọi app, mọi chỗ"

const doc = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8')
const boChuThich = (ma: string) => ma.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')

const API = boChuThich(doc('src/lib/exam-api.ts'))
const BC_HS = boChuThich(doc('src/components/BaoCaoCaThiHocSinhModal.tsx'))
const BC_PH = boChuThich(doc('src/components/BaoCaoCaThiPhuHuynhModal.tsx'))
const CONG_PH = boChuThich(doc('src/screens/ParentPortalScreen.tsx'))
const DB = boChuThich(doc('src/lib/exam-db.ts'))

describe('Mọi lượt gọi của học sinh và phụ huynh dùng chung một nguồn địa chỉ', () => {
  it('8 hàm API không còn tự suy địa chỉ từ `scriptUrl`', () => {
    expect(API).not.toContain('ch.BAT && ch.URL')
    const dung = API.split('await layDiaChiMayChu(scriptUrl)').length - 1
    expect(dung).toBe(8)
  })

  it('không lấy được địa chỉ thì NÓI RA, không trả rỗng im lặng', () => {
    expect(API).toContain('Chưa lấy được địa chỉ máy chủ')
  })

  it('`loadScriptUrlHoacMacDinh` hết đi tìm khoá `scriptUrl` đã chết', () => {
    expect(DB).not.toContain("cfg.scriptUrl")
    expect(DB).toContain("import('./dia-chi-may-chu')")
  })

  it('`cau-hinh.json` đúng là KHÔNG còn khoá `scriptUrl` — sự thật làm bản cũ chết', () => {
    const cfg = JSON.parse(doc('public/cau-hinh.json'))
    expect(cfg.scriptUrl).toBeUndefined()
    expect(String(cfg.mayChuMoi || '')).toMatch(/^https:\/\//)
  })
})

describe('Màn báo cáo hết canh cửa bằng `scriptUrl`', () => {
  it('app học sinh: hai lượt nạp không còn cổng `!scriptUrl`', () => {
    expect(BC_HS).not.toContain('if (!sbd || !scriptUrl) return')
    expect(BC_HS).not.toContain('if (!baiThi.maCa || !scriptUrl) return')
    expect(BC_HS).toContain('if (!baiThi.maCa) return')
  })

  it('app phụ huynh: hai lượt nạp không còn cổng `!scriptUrl`', () => {
    expect(BC_PH).not.toContain('if (!sbd || !scriptUrl) return')
    expect(BC_PH).not.toContain('if (!baiThi.maCa || !scriptUrl) return')
    expect(BC_PH).toContain('if (!baiThi.maCa) return')
  })

  it('cổng phụ huynh: lượt lấy câu sai không còn bọc trong `if (scriptUrl)`', () => {
    expect(CONG_PH).not.toContain('if (scriptUrl) {')
  })
})

describe('Cấm nuốt lỗi im lặng', () => {
  it('app học sinh: gọi hỏng thì giữ lại lý do và hiện ra', () => {
    expect(BC_HS).toContain('setLoiCauSai')
    expect(BC_HS).toContain("loiCauSai || 'Chưa lấy được danh sách câu sai của ca này'")
  })

  it('app phụ huynh: gọi hỏng thì giữ lại lý do và hiện ra', () => {
    expect(BC_PH).toContain('setLoiCauSai')
    expect(BC_PH).toContain("loiCauSai || 'Ca này con không có câu nào cần khắc phục'")
  })

  it('cổng phụ huynh: phân biệt "không sai câu nào" với "gọi hỏng"', () => {
    expect(CONG_PH).toContain('loiGoi ||')
  })
})
