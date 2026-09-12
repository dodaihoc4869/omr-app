// HẠN CHỜ ĐƯỜNG NÓNG — sửa lỗi trước ca thi thật 11/09 14h30.
//
// LỖI CỦA BẢN ĐỢT 3: `goiWorker` dùng chung `HAN_GIAY = 10` và `SO_LAN_THU = 3`
// cho MỌI lệnh. Worker không với tới được thì máy em chờ
//
//     10s + 0,5s + 10s + 1,5s + 10s  ≈  32 giây
//
// rồi MỚI đi Apps Script. Cả lớp bấm Nộp trong mười phút cuối mà Cloudflare
// chập một nhịp là em ngồi nhìn màn hình hơn nửa phút — CHẬM HƠN HẲN so với
// khi chưa có máy chủ mới.
//
// Phép kiểm này đo THỜI GIAN THẬT tới lúc đường lùi được phép chạy, không chỉ
// soi hằng số.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MAC_DINH_MAY_CHU, chuanHoaMayChu } from '../src/lib/cau-hinh-may-chu'
import { goiWorker, nhipNong } from '../src/lib/may-chu-moi'

const CH = chuanHoaMayChu({ BAT: true, URL: 'https://omr.example' })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('NHỊP ĐƯỜNG NÓNG', () => {
  it('hạn nóng mặc định 3 giây, tách khỏi hạn 10 giây của lệnh thầy', () => {
    expect(MAC_DINH_MAY_CHU.HAN_NONG_GIAY).toBe(3)
    expect(MAC_DINH_MAY_CHU.HAN_GIAY).toBe(10)
  })

  // 12/09: KHÔNG CÒN ĐƯỜNG LÙI. Luật cũ cho thử đúng một lần vì "Apps Script
  // chính là lượt thử lại"; nay lượt ấy không tồn tại, nên một nhịp mạng chập
  // của điện thoại em là hỏng hẳn giữa giờ thi. Phải thử lại.
  it('đường nóng thử lại đủ SO_LAN_THU lần — không còn gì đỡ phía sau', () => {
    expect(nhipNong(chuanHoaMayChu({ BAT: true, URL: 'https://x', SO_LAN_THU: 3 })).soLan).toBe(3)
  })

  it('cờ LUI_VE_APPS_SCRIPT không còn ảnh hưởng tới nhịp', () => {
    const bat = chuanHoaMayChu({ BAT: true, URL: 'https://x', SO_LAN_THU: 3, LUI_VE_APPS_SCRIPT: true })
    const tat = chuanHoaMayChu({ BAT: true, URL: 'https://x', SO_LAN_THU: 3, LUI_VE_APPS_SCRIPT: false })
    expect(nhipNong(bat).soLan).toBe(nhipNong(tat).soLan)
  })

  it('thầy đặt số lần thử thì nhịp đi theo, không gõ cứng', () => {
    expect(nhipNong(chuanHoaMayChu({ BAT: true, URL: 'https://x', SO_LAN_THU: 5 })).soLan).toBe(5)
  })

  it('thầy nới hạn nóng thì nhịp đi theo, không hard-code', () => {
    expect(nhipNong(chuanHoaMayChu({ BAT: true, URL: 'https://x', HAN_NONG_GIAY: 5 })).hanGiay).toBe(5)
  })
})

// ĐO THỜI GIAN THẬT EM PHẢI CHỜ TRƯỚC KHI ĐƯỢC BÁO HỎNG.
//
// Đích cũ là 3,5 giây, vì sau 3,5 giây ấy Apps Script gánh tiếp — em không hỏng,
// chỉ chậm. Apps Script đã bị gỡ 12/09, nên "thời gian tới lúc đường lùi chạy"
// không còn là đại lượng có thật. Đại lượng thật bây giờ là: em ngồi chờ bao lâu
// trước khi màn hình nói "không kết nối được".
//
// Đích mới ≤ 12 giây, và đây KHÔNG phải hạ đích cho vừa số đo: ba lượt thử là
// thứ thay chỗ cho đường lùi đã mất. Thử một lần rồi báo hỏng sau 3 giây thì
// nhanh hơn thật, nhưng một nhịp mạng chập của điện thoại em giữa giờ thi là
// hỏng hẳn — đổi 8 giây lấy việc đó là đúng.
describe('ĐO THỜI GIAN THẬT EM CHỜ TRƯỚC KHI ĐƯỢC BÁO HỎNG', () => {
  /** Worker "chết lặng": không trả lời, không từ chối — ca tệ nhất, vì chỉ có
   * hạn chờ mới cắt được. Tôn trọng AbortSignal đúng như `fetch` thật. */
  function workerCamNhu() {
    vi.stubGlobal('fetch', (_u: string, init: RequestInit) =>
      new Promise((_res, rej) => {
        init.signal?.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')))
      }),
    )
  }

  it('ĐÍCH: ≤ 12 giây, và phải THỬ ĐỦ BA LƯỢT chứ không bỏ cuộc sau lượt đầu', async () => {
    let soLuot = 0
    vi.stubGlobal('fetch', (_u: string, init: RequestInit) => {
      soLuot += 1
      return new Promise((_res, rej) => {
        init.signal?.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')))
      })
    })
    const t0 = Date.now()
    const r = await goiWorker(CH, '/nop', {}, nhipNong(CH))
    const giay = (Date.now() - t0) / 1000
    // eslint-disable-next-line no-console
    console.log(`[hạn nóng] Worker chết lặng · ${soLuot} lượt thử · báo hỏng sau ${giay.toFixed(2)}s`)
    expect(r).toBeNull()
    // BA lượt: đây mới là thứ thay chỗ cho đường lùi đã mất. Một lượt là hỏng
    // hẳn vì một nhịp chập; đó chính là điều phép kiểm này canh.
    expect(soLuot).toBe(3)
    expect(giay).toBeLessThanOrEqual(12)
    // và vẫn phải ngắn hơn hẳn 32 giây của bản đợt 3.
    expect(giay).toBeLessThan(32)
  }, 20000)

  it('KHÔNG kèm nhịp nóng thì rơi về hạn thường — canh để không ai gỡ nhịp nóng ra', async () => {
    workerCamNhu()
    const t0 = Date.now()
    const r = await goiWorker(chuanHoaMayChu({ BAT: true, URL: 'https://x', HAN_GIAY: 6, SO_LAN_THU: 3 }), '/nop', {})
    const giay = (Date.now() - t0) / 1000
    expect(r).toBeNull()
    // Hạn thường 6 giây × 3 lượt ⇒ chắc chắn dài hơn hẳn nhịp nóng.
    expect(giay).toBeGreaterThan(12)
  }, 40000)
})

describe('MÃ NGUỒN — BỐN LỆNH NÓNG đều phải đi nhịp nóng', () => {
  it('vào thi, lưu tạm, nộp, trạng thái: không lệnh nào bị sót', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const s = fs.readFileSync(path.join(process.cwd(), 'src/lib/may-chu-moi.ts'), 'utf8')
    for (const duong of ["'/vao-thi'", "'/luu-tam'", "'/nop'", "'/trang-thai'"]) {
      const i = s.indexOf(`goiWorker`)
      expect(i, duong).toBeGreaterThan(0)
      const j = s.indexOf(duong)
      expect(j, duong).toBeGreaterThan(0)
      // Từ chỗ nêu đường tới hết lượt gọi phải thấy `nhipNong(ch)`.
      expect(s.slice(j, j + 900), duong).toContain('nhipNong(ch)')
    }
  })

  it('phòng chờ — lượt gọi ĐÔNG NHẤT của ca — cũng dùng hạn nóng', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const s = fs.readFileSync(path.join(process.cwd(), 'src/lib/may-chu-moi.ts'), 'utf8')
    const i = s.indexOf('export async function phongChoMoi')
    expect(i).toBeGreaterThan(0)
    expect(s.slice(i, i + 700)).toContain('ch.HAN_NONG_GIAY')
  })
})
