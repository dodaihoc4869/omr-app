// LINK PHIẾU KẾT QUẢ GỬI PHỤ HUYNH.
//
// Vì sao dữ liệu nằm TRONG link chứ không nằm trên máy chủ: repo này là repo
// PUBLIC trên GitHub Pages. Ghi file phiếu vào repo là đăng tên và điểm học
// sinh lên mạng công khai. Còn lưu trên Apps Script thì phải mở một lệnh đọc
// KHÔNG đòi mã bí mật (phụ huynh không có mã) — tức là mở thêm một cửa, và mỗi
// lần phụ huynh mở phiếu phải chờ Apps Script ~1,3 giây.
//
// Cách làm ở đây: nén dữ liệu phiếu rồi nhét vào phần SAU DẤU `#` của link.
// Phần sau `#` (fragment) **trình duyệt không bao giờ gửi lên máy chủ** — không
// vào log GitHub, không vào bộ thu thập link của Zalo. Phiếu dựng hoàn toàn
// trong máy phụ huynh, mở được cả khi mất mạng sau lần tải đầu.
//
// ĐÁNH ĐỔI PHẢI BIẾT: link tự chứa dữ liệu nên **không thu hồi được**. Đã gửi
// là phụ huynh giữ mãi, và chuyển tiếp cho ai cũng xem được. Muốn thu hồi thì
// phải đổi sang phương án mã phiếu trên máy chủ — xem claude/gui-phieu-zalo.md.
//
// CẤM đưa câu hỏi, phương án và đáp án vào đây: link chuyển tiếp một chạm là
// cả lớp có đề. Phiếu chỉ có điểm và chuyên đề.

/** Đúng những gì được phép nằm trong link. Không có câu hỏi, không có đáp án. */
export interface DuLieuPhieuLink {
  hoTen: string
  sbd: string
  lop: string
  tenCa: string
  /** Thời điểm nộp (ISO). */
  ngay: string
  diem: number
  diemPhan: { I: number; II: number; III: number } | null
  soCauSai: number
  tongSoCau: number | null
  hang: number | null
  siSo: number | null
  chuyenDe: { ten: string; soCau: number; soSai: number }[]
  vieCanLam: string
}

/** Khoá viết tắt: link đi vào tin nhắn Zalo nên từng byte đều đáng. Thứ tự và
 * tên khoá ở đây là MỘT PHẦN CỦA ĐỊNH DẠNG — đổi là link cũ đã gửi chết. */
type Goi = {
  v: number
  n: string
  s: string
  l: string
  c: string
  d: string
  t: number
  p: [number, number, number] | 0
  e: number
  o: number
  h: number
  i: number
  k: [string, number, number][]
  w: string
}

/** Phiên bản định dạng. Tăng khi đổi cấu trúc; bộ đọc từ chối bản lạ thay vì
 * dựng phiếu sai số liệu. */
export const BAN_PHIEU = 1

const B64_CHUAN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const B64_URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

function sangB64Url(b: Uint8Array): string {
  let thuong = ''
  // Cắt khúc: String.fromCharCode(...mảng vài trăm nghìn phần tử) làm tràn ngăn xếp.
  for (let i = 0; i < b.length; i += 0x8000) thuong += String.fromCharCode(...b.subarray(i, i + 0x8000))
  const s = btoa(thuong)
  let ra = ''
  for (const ch of s) {
    if (ch === '=') continue
    const j = B64_CHUAN.indexOf(ch)
    ra += j >= 0 ? B64_URL[j] : ch
  }
  return ra
}

function tuB64Url(s: string): Uint8Array {
  let chuan = ''
  for (const ch of s) {
    const j = B64_URL.indexOf(ch)
    chuan += j >= 0 ? B64_CHUAN[j] : ch
  }
  while (chuan.length % 4 !== 0) chuan += '='
  const thuong = atob(chuan)
  const b = new Uint8Array(thuong.length)
  for (let i = 0; i < thuong.length; i++) b[i] = thuong.charCodeAt(i)
  return b
}

type LopNen = new (dinhDang: string) => { writable: WritableStream<Uint8Array>; readable: ReadableStream<Uint8Array> }

async function chayLuong(ten: 'CompressionStream' | 'DecompressionStream', b: Uint8Array): Promise<Uint8Array | null> {
  const Lop = (globalThis as unknown as Record<string, LopNen | undefined>)[ten]
  if (!Lop) return null
  try {
    const luong = new Lop('deflate-raw')
    const ghi = luong.writable.getWriter()
    // Link cụt thì luồng giải nén báo lỗi ở CẢ hai đầu. Không bắt lỗi đầu ghi
    // thì nó thành "unhandled rejection" — test đỏ, và trên máy thật là một lỗi
    // đỏ trong console không ai hiểu vì sao. Lỗi thật đã bắt ở đầu đọc bên dưới.
    ghi.write(b).catch(() => {})
    ghi.close().catch(() => {})
    const buf = await new Response(luong.readable).arrayBuffer()
    return new Uint8Array(buf)
  } catch {
    return null
  }
}

/** Bỏ số 0 thừa: 0.75 -> 0.75, 6 -> 6. JSON.stringify đã làm; hàm này chỉ làm
 * tròn 2 chữ số để số dấu phẩy động dài dòng không phình link. */
function tron(x: number): number {
  return Math.round(x * 100) / 100
}

function dongGoi(d: DuLieuPhieuLink): Goi {
  return {
    v: BAN_PHIEU,
    n: d.hoTen || '',
    s: d.sbd || '',
    l: d.lop || '',
    c: d.tenCa || '',
    d: d.ngay || '',
    t: tron(d.diem),
    p: d.diemPhan ? [tron(d.diemPhan.I), tron(d.diemPhan.II), tron(d.diemPhan.III)] : 0,
    e: d.soCauSai || 0,
    o: d.tongSoCau ?? 0,
    h: d.hang ?? 0,
    i: d.siSo ?? 0,
    k: d.chuyenDe.map((c) => [c.ten, c.soCau, c.soSai] as [string, number, number]),
    w: d.vieCanLam || '',
  }
}

function moGoi(g: Goi): DuLieuPhieuLink {
  return {
    hoTen: String(g.n ?? ''),
    sbd: String(g.s ?? ''),
    lop: String(g.l ?? ''),
    tenCa: String(g.c ?? ''),
    ngay: String(g.d ?? ''),
    diem: Number(g.t) || 0,
    diemPhan: Array.isArray(g.p) ? { I: Number(g.p[0]) || 0, II: Number(g.p[1]) || 0, III: Number(g.p[2]) || 0 } : null,
    soCauSai: Number(g.e) || 0,
    tongSoCau: Number(g.o) > 0 ? Number(g.o) : null,
    hang: Number(g.h) > 0 ? Number(g.h) : null,
    siSo: Number(g.i) > 0 ? Number(g.i) : null,
    chuyenDe: Array.isArray(g.k) ? g.k.map((c) => ({ ten: String(c[0] ?? ''), soCau: Number(c[1]) || 0, soSai: Number(c[2]) || 0 })) : [],
    vieCanLam: String(g.w ?? ''),
  }
}

/** Nén dữ liệu phiếu thành chuỗi đặt sau dấu `#`.
 * Ký tự đầu là cờ: `1` = có nén (deflate-raw), `0` = chưa nén (máy cũ không có
 * CompressionStream). Bộ đọc nhận cả hai nên link luôn mở được. */
export async function nenPhieu(d: DuLieuPhieuLink): Promise<string> {
  const tho = new TextEncoder().encode(JSON.stringify(dongGoi(d)))
  const nen = await chayLuong('CompressionStream', tho)
  return nen && nen.length < tho.length ? '1' + sangB64Url(nen) : '0' + sangB64Url(tho)
}

/** Đọc ngược. Trả null khi link hỏng, cụt hoặc sai phiên bản — màn phiếu báo
 * "link hỏng" chứ KHÔNG dựng phiếu với số liệu đoán được phần nào. */
export async function giaiPhieu(payload: string): Promise<DuLieuPhieuLink | null> {
  const s = (payload || '').trim().replace(/^#/, '')
  if (s.length < 2) return null
  try {
    const b = tuB64Url(s.slice(1))
    const tho = s[0] === '1' ? await chayLuong('DecompressionStream', b) : b
    if (!tho) return null
    const g = JSON.parse(new TextDecoder().decode(tho)) as Goi
    if (Number(g.v) !== BAN_PHIEU) return null
    if (!g.n && !g.s) return null
    return moGoi(g)
  } catch {
    return null
  }
}

/** Link đầy đủ để dán vào Zalo. `goc` là gốc app, ví dụ
 * `https://dodaihoc4869.github.io/omr-app/`. */
export async function taoLinkPhieu(goc: string, d: DuLieuPhieuLink): Promise<string> {
  const g = goc.endsWith('/') ? goc : goc + '/'
  return `${g}p#${await nenPhieu(d)}`
}
