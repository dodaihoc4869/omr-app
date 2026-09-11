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

  it('CÒN đường lùi ⇒ thử ĐÚNG MỘT lần: Apps Script chính là lượt thử lại', () => {
    expect(nhipNong(chuanHoaMayChu({ BAT: true, URL: 'https://x', LUI_VE_APPS_SCRIPT: true })).soLan).toBe(1)
  })

  it('thầy TẮT đường lùi ⇒ mới được thử lại, vì lúc đó không còn gì đỡ', () => {
    const ch = chuanHoaMayChu({ BAT: true, URL: 'https://x', LUI_VE_APPS_SCRIPT: false, SO_LAN_THU: 3 })
    expect(nhipNong(ch).soLan).toBe(3)
  })

  it('thầy nới hạn nóng thì nhịp đi theo, không hard-code', () => {
    expect(nhipNong(chuanHoaMayChu({ BAT: true, URL: 'https://x', HAN_NONG_GIAY: 5 })).hanGiay).toBe(5)
  })
})

describe('ĐO THỜI GIAN THẬT TỚI LÚC ĐƯỜNG LÙI ĐƯỢC CHẠY', () => {
  /** Worker "chết lặng": không trả lời, không từ chối — ca tệ nhất, vì chỉ có
   * hạn chờ mới cắt được. Tôn trọng AbortSignal đúng như `fetch` thật. */
  function workerCamNhu() {
    vi.stubGlobal('fetch', (_u: string, init: RequestInit) =>
      new Promise((_res, rej) => {
        init.signal?.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')))
      }),
    )
  }

  it('ĐÍCH: ≤ 3,5 giây (bản cũ ≈ 32 giây)', async () => {
    workerCamNhu()
    const t0 = Date.now()
    const r = await goiWorker(CH, '/nop', {}, nhipNong(CH))
    const giay = (Date.now() - t0) / 1000
    // eslint-disable-next-line no-console
    console.log(`[hạn nóng] Worker chết lặng · đường lùi chạy sau ${giay.toFixed(2)}s`)
    expect(r).toBeNull() // null = "đi đường cũ"
    expect(giay).toBeLessThanOrEqual(3.5)
  }, 15000)

  it('BẢN CŨ nếu ai đó gỡ nhịp nóng ra: chờ hơn 9 giây — phép kiểm này canh điều đó', async () => {
    workerCamNhu()
    const t0 = Date.now()
    // Cố tình gọi KHÔNG kèm nhịp nóng ⇒ rơi về hạn 10 giây, 3 lần.
    const p = goiWorker(chuanHoaMayChu({ BAT: true, URL: 'https://x', HAN_GIAY: 3, SO_LAN_THU: 3 }), '/nop', {})
    const r = await p
    const giay = (Date.now() - t0) / 1000
    expect(r).toBeNull()
    // Ba lần × 3 giây + hai lần nghỉ ⇒ chắc chắn hơn 9 giây.
    expect(giay).toBeGreaterThan(9)
  }, 30000)
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
      expect(s.slice(j, j + 400), duong).toContain('nhipNong(ch)')
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
