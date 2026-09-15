// SERVICE WORKER KHÔNG ĐƯỢC TRẢ TRANG "ĐÃ QUA CHUYỂN HƯỚNG". 15/09.
//
// Thầy báo: "Làm bài ktra xong trên app học sinh bấm nộp bài bị văng như thế
// này" — ảnh chụp Safari trên iPhone:
//
//     Safari không thể mở trang.
//     Đã xảy ra lỗi: "Response served by service worker has redirections".
//
// BÀI VẪN NỘP ĐƯỢC. Đối chứng trên D1: ca 457868 · sbd 12121212 ·
// nop_luc 2026-09-15T03:24:56 · trang_thai 'da_nop' · tổng 3,88 · dap_an_json
// 330 ký tự. Hỏng ở màn hình SAU khi nộp, không hỏng ở dữ liệu.
//
// ─────────────────────────────────────────────────────────────────────────
// NGUYÊN NHÂN GỐC — ĐO ĐƯỢC TRÊN BẢN LIVE
//
//     fetch('/index.html?__WB_REVISION__=…')  →  redirected: true
//                                                url: '/?__WB_REVISION__=…'
//
// Cloudflare Pages cắt `index.html` khỏi đường dẫn bằng một lượt CHUYỂN HƯỚNG.
// Mà `/index.html?__WB_REVISION__=<mã>` chính là khoá workbox dùng cho kho
// precache. Khi khoá ấy TRƯỢT trong kho — đúng lúc vừa phát hành bản mới, kho
// đang thay — workbox đi ra mạng lấy chính khoá ấy, và response thu về mang
// `redirected = true`.
//
// Chuẩn Fetch CẤM service worker trả response như thế cho lượt ĐIỀU HƯỚNG.
// Chrome bỏ qua, Safari chặn thẳng. Nên lỗi chỉ nổ trên iPhone, và chỉ trong
// mấy phút đầu sau mỗi lần phát hành — đúng lúc em bấm Nộp rồi app tải lại.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const GOC = process.cwd()
const doc = (p: string) => fs.readFileSync(path.join(GOC, p), 'utf8')
const boChuThich = (ma: string) => ma.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
const SW = boChuThich(doc('src/sw.ts'))

describe('Gỡ dấu chuyển hướng trước khi trả trang', () => {
  it('có hàm dựng lại response sạch', () => {
    expect(SW).toContain('async function goDauChuyenHuong(r: Response): Promise<Response>')
    expect(SW).toContain('if (!r.redirected) return r')
    // Dựng lại từ CHÍNH THÂN của nó — nội dung y nguyên, chỉ mất cái dấu.
    expect(SW).toContain('await r.clone().arrayBuffer()')
    expect(SW).toContain('new Response(than, { status: r.status, statusText: r.statusText, headers: r.headers })')
  })

  it('CẢ BA TẦNG đường lui đều đi qua nó — sót một tầng là còn văng', () => {
    // Tầng nào cũng có thể nhặt về một response đã qua chuyển hướng.
    expect(SW).toContain('if (r) return goDauChuyenHuong(r)') // precache
    expect(SW).toContain('if (r && r.ok) return goDauChuyenHuong(r)') // mạng
    expect(SW).toContain('if (c) return goDauChuyenHuong(c)') // kho tạm
  })

  it('KHÔNG còn chỗ nào trả thẳng response của mạng cho điều hướng', () => {
    // Dòng cũ gộp `r.ok || r.type === 'opaqueredirect'` rồi `return r` — chính
    // nó trả response `redirected` cho Safari.
    expect(SW).not.toContain("if (r && (r.ok || r.type === 'opaqueredirect')) return r")
  })

  it('`opaqueredirect` thì GIỮ NGUYÊN — chuẩn cho phép, và thân không đọc được', () => {
    expect(SW).toContain("if (r && r.type === 'opaqueredirect') return r")
  })

  it('dựng lại hỏng thì trả bản gốc, KHÔNG để em màn trắng', () => {
    const i = SW.indexOf('async function goDauChuyenHuong')
    const than = SW.slice(i, SW.indexOf('\n}', SW.indexOf('catch', i)))
    expect(than).toContain('return r')
  })

  it('ba tầng đường lui vẫn còn nguyên', () => {
    expect(SW).toContain('const r = await TU_PRECACHE(tuyChon)')
    expect(SW).toContain('const r = await fetch(tuyChon.request)')
    expect(SW).toContain('caches.match(khoa, { ignoreSearch: true })')
    expect(SW).toContain('return Response.error()')
  })
})

describe('Phép kiểm chạy được trên chính hàm ấy', () => {
  /** Bản sao đúng logic của `goDauChuyenHuong` — chạy thật để chắc nó làm đúng
   * việc, chứ không chỉ soi chữ trong mã. */
  const goDau = async (r: Response): Promise<Response> => {
    if (!r.redirected) return r
    const than = await r.clone().arrayBuffer()
    return new Response(than, { status: r.status, statusText: r.statusText, headers: r.headers })
  }

  it('response thường thì trả NGUYÊN nó, không dựng lại thừa', async () => {
    const r = new Response('<html>xin chào</html>', { status: 200, headers: { 'content-type': 'text/html' } })
    expect(await goDau(r)).toBe(r)
  })

  it('response ĐÃ CHUYỂN HƯỚNG thì ra bản mới, sạch dấu, GIỮ NGUYÊN nội dung', async () => {
    const goc = new Response('<html>trang thi</html>', { status: 200, headers: { 'content-type': 'text/html' } })
    // `redirected` là thuộc tính chỉ đọc — giả lập đúng dáng response thật.
    Object.defineProperty(goc, 'redirected', { value: true })
    const moi = await goDau(goc)
    expect(moi).not.toBe(goc)
    expect(moi.redirected).toBe(false)
    expect(moi.status).toBe(200)
    expect(moi.headers.get('content-type')).toBe('text/html')
    expect(await moi.text()).toBe('<html>trang thi</html>')
  })

  it('thân bài dài vẫn nguyên vẹn từng byte', async () => {
    const dai = '<html>' + 'x'.repeat(50000) + '</html>'
    const goc = new Response(dai, { status: 200 })
    Object.defineProperty(goc, 'redirected', { value: true })
    expect(await (await goDau(goc)).text()).toBe(dai)
  })
})
