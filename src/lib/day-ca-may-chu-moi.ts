// ĐẨY CA, GÓI ĐỀ VÀ DANH SÁCH LỚP LÊN MÁY CHỦ MỚI — 11/09.
//
// VÌ SAO PHẢI CÓ TỆP NÀY: Worker có sẵn `/ca/day` từ đợt 2, nhưng KHÔNG tệp nào
// của app gọi tới. Nghĩa là D1 chưa từng có một ca nào — và vì `luu-tam` với
// `nop` chỉ cập nhật dòng lượt do `/vao-thi` tạo ra, còn `/vao-thi` lại cần ca
// trong D1, nên cả đợt 3 nằm im: bật cờ lên thì mọi lệnh đều lùi về Apps Script.
//
// MỘT LUẬT DUY NHẤT, và nó quyết định mức an toàn của cả tệp:
// **đẩy hỏng KHÔNG BAO GIỜ được chặn việc mở ca.** Apps Script vẫn là nơi ca
// được mở thật. Đẩy lên đây chỉ để đường nóng có chỗ chạy nhanh; hỏng thì ca
// vẫn mở bình thường và cả lớp thi trên đường cũ.
import type { CauHinhMayChu } from './cau-hinh-may-chu'
import { voiHanCho } from './han-cho'

/** Hạn chờ khi đẩy. Rộng vì gói đề tới vài MB, nhưng vẫn hữu hạn. */
export const HAN_DAY_CA_GIAY = 45

export interface CaDay {
  maCa: string
  tenCa?: string
  trangThai?: string
  batDau?: string
  hetHanVao?: string
  thoiGianPhut?: number
  loai?: string
  hanNop?: string
  congBo?: string
  nguongLan?: number
  nguongGiay?: number
  lop?: string
  phongCho?: boolean
  dongBoGio?: boolean
  batDauThiLuc?: string
  giuDeDoc?: boolean
  anHanGiay?: number
  soCau?: unknown
  boTheoEm?: unknown
  /** PHẠM VI GỬI CA: tu_do · khoi · chon · sbd. Trước 12/09 cờ này chỉ sống bên
   * Sheet; Sheet mất thì cổng chặn mất theo, nên nó phải đi cùng ca. */
  phamVi?: string
  /** Danh sách SBD thầy tích (phamVi = 'chon') hoặc khối (phamVi = 'khoi'). */
  danhSachMoi?: unknown
  lenBang?: boolean
  deRieng?: boolean
  phamViHoiLai?: string
  matKhau?: string
  chiNop3PhutCuoi?: boolean
}

/** Gói đẩy ca: ngoài `ca` và gói đề KHÔNG đáp án, còn ngân hàng CÓ đáp án để
 * Worker trả ngay cho em lúc nộp khi ca công bố điểm. Cất sau khoá riêng. */
export interface GoiDayCa {
  bank?: unknown
  keyBank?: unknown
}

async function guiJson(ch: CauHinhMayChu, maBiMat: string, duong: string, than: unknown, giay: number): Promise<boolean> {
  if (!ch.BAT || !ch.URL) return false
  const bo = new AbortController()
  const hen = setTimeout(() => bo.abort(), giay * 1000)
  try {
    const res = await fetch(`${ch.URL}${duong}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-ma-bi-mat': maBiMat },
      body: JSON.stringify(than),
      signal: bo.signal,
    })
    if (!res.ok) return false
    const j = (await res.json()) as { ok?: boolean }
    return !!j?.ok
  } catch {
    return false
  } finally {
    clearTimeout(hen)
  }
}

/** ĐẨY MỘT CA LÊN MÁY CHỦ MỚI, kèm gói đề nếu có.
 *
 * `bank` là bản KHÔNG ĐÁP ÁN — Worker cất vào R2 và phục vụ công khai ở
 * `/de/:maCa`. Đẩy bản có đáp án lên đó là phát đáp án cho cả lớp. */
export async function dayCaMoi(ch: CauHinhMayChu, maBiMat: string, ca: CaDay, bank?: unknown, keyBank?: unknown): Promise<boolean> {
  if (!ca?.maCa) return false
  const than: Record<string, unknown> = { ca }
  if (bank) than.bank = bank
  // NGÂN HÀNG CÓ ĐÁP ÁN — chỉ gửi khi ca công bố điểm. Ca không công bố mà vẫn
  // đẩy đáp án lên là để sẵn một thứ không ai được đọc; không cần thì đừng cất.
  if (keyBank) than.keyBank = keyBank
  return guiJson(ch, maBiMat, '/ca/day', than, HAN_DAY_CA_GIAY)
}

/** ĐẨY RIÊNG MỐC BẮT ĐẦU (và bản đồ đề riêng) — KHÔNG đụng phần còn lại của ca.
 *
 * LỖI ĐÃ DÍNH, ca thật 704066 tối 11/09: `batDauThi` gọi `dayCaMoi` với đúng
 * hai trường, và câu upsert bên Worker ghi đè mọi cột không gửi bằng rỗng. Tra
 * D1 giữa ca: `ten_ca ''`, `lop ''`, `bat_dau ''`, `het_han_vao ''`,
 * `phong_cho 0` — tức HẠN VÀO PHÒNG và cờ PHÒNG CHỜ bị xoá ngay giữa ca, còn
 * màn Ca thi thì hiện một ca không tên. */
export async function dayMocBatDauMoi(
  ch: CauHinhMayChu,
  maBiMat: string,
  maCa: string,
  batDauThiLuc: string,
  boTheoEm?: unknown,
  soLan = 3,
): Promise<boolean> {
  if (!maCa) return false
  // THỬ LẠI TỚI CÙNG — đây là lượt gọi quan trọng nhất của cả ca.
  //
  // Mốc này không sang được thì máy chủ mới giữ cả lớp trong phòng chờ, và chốt
  // đối chiếu ở máy em (`doi-chieu-phong-cho.ts`) phải gánh — mà chốt ấy đổ tải
  // vào Apps Script đúng lúc Apps Script đang nặng nhất. Chữa ở ĐÂY, một máy,
  // rẻ hơn hẳn chữa ở bốn mươi máy.
  //
  // Lượt đẩy mang cờ `chiMoc` nên gửi lại bao nhiêu lần cũng ra một kết quả:
  // Worker chỉ `UPDATE` đúng hai cột, không tạo dòng nào.
  for (let i = 0; i < Math.max(1, soLan); i++) {
    const xong = await guiJson(ch, maBiMat, '/ca/day', { ca: { maCa, batDauThiLuc, boTheoEm }, chiMoc: true }, HAN_DAY_CA_GIAY)
    if (xong) return true
    if (i < soLan - 1) await new Promise((r) => setTimeout(r, 700 * (i + 1)))
  }
  return false
}

export interface EmDanhSach {
  sbd: string
  hoTen?: string
  namSinh?: string
  lop?: string
}

/** ĐẨY DANH SÁCH LỚP. Đây là CỔNG CHẶN số báo danh lạ trên máy chủ mới.
 *
 * Chưa đẩy thì bảng rỗng, và Worker cố ý KHÔNG chặn ai — giống hệt luật bên
 * Apps Script. Thà thiếu cổng còn hơn cả lớp đứng ngoài cửa vì thầy quên đẩy. */
export async function dayDanhSachMoi(ch: CauHinhMayChu, maBiMat: string, ds: EmDanhSach[]): Promise<boolean> {
  const sach = (ds ?? []).filter((e) => String(e?.sbd ?? '').trim().length > 0)
  if (sach.length === 0) return false
  return guiJson(ch, maBiMat, '/danh-sach/day', { ds: sach }, HAN_DAY_CA_GIAY)
}

/** ĐỌC MỌI LƯỢT CỦA MỘT CA TỪ MÁY CHỦ MỚI.
 *
 * Dùng cho màn Chi tiết ca của thầy. Ca chạy trên máy chủ mới thì lượt VÀO THI
 * không tạo dòng bên Apps Script, nên màn ấy đọc bảng cũ ra TRỐNG giữa ca —
 * thầy không biết ai đã vào, ai đang làm, và không có gì để bấm.
 *
 * Trả `null` nghĩa là "không có gì để trộn": cờ tắt, mạng hỏng, hoặc ca này
 * chưa từng chạy trên máy chủ mới. Chỗ gọi giữ nguyên danh sách cũ. */
export async function luotCuaCaMoi(
  ch: CauHinhMayChu,
  maBiMat: string,
  maCa: string,
): Promise<Record<string, unknown>[] | null> {
  if (!ch.BAT || !ch.URL || !maCa) return null
  const bo = new AbortController()
  const hen = setTimeout(() => bo.abort(), ch.HAN_GIAY * 1000)
  try {
    const res = await fetch(`${ch.URL}/ca/luot`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-ma-bi-mat': maBiMat },
      body: JSON.stringify({ maCa }),
      signal: bo.signal,
    })
    if (!res.ok) return null
    const j = (await res.json()) as { ok?: boolean; ds?: Record<string, unknown>[] }
    return j?.ok && Array.isArray(j.ds) ? j.ds : null
  } catch {
    return null
  } finally {
    clearTimeout(hen)
  }
}

/** Ô của dòng ca mà máy thầy được phép sửa trên máy chủ mới. Khớp đúng bảng
 * `O_SUA_DUOC` bên Worker — thêm ô ở một bên mà quên bên kia là sửa vào khoảng
 * không, không báo lỗi. */
export interface OSuaCa {
  trangThai?: string
  tenCa?: string
  xoaLuc?: string
  hetHanVao?: string
  congBo?: string
  hanNop?: string
  phamVi?: string
}

/** SỬA DÒNG CA TRÊN MÁY CHỦ MỚI cho khớp với việc thầy vừa làm bên Apps Script.
 *
 * LỖI ĐÃ DÍNH, 11/09: thầy bấm xoá ca 432566, Apps Script đánh dấu `da_xoa`,
 * nhưng màn Ca thi nay đọc D1 nên ca vẫn nằm nguyên đó. Bấm mấy lần cũng vậy.
 * Mọi lệnh thầy tác động lên MỘT ca đã có — xoá, khôi phục, khoá, mở khoá, đổi
 * tên — đều phải soi sang đây.
 *
 * Trả `false` nghĩa là chưa soi được (cờ tắt, mạng hỏng, ca chưa lên D1). KHÔNG
 * ném lỗi: việc bên Apps Script đã xong rồi, không được vì lượt soi này mà báo
 * cho thầy là thao tác thất bại. */
export async function suaCaMoi(
  ch: CauHinhMayChu,
  maBiMat: string,
  maCa: string,
  dat: OSuaCa,
  them: { khoaLuot?: boolean; ghiChu?: string } = {},
): Promise<boolean> {
  if (!ch.BAT || !ch.URL || !maCa) return false
  if (Object.keys(dat).length === 0) return false
  const bo = new AbortController()
  const hen = setTimeout(() => bo.abort(), ch.HAN_GIAY * 1000)
  try {
    const res = await fetch(`${ch.URL}/ca/sua`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-ma-bi-mat': maBiMat },
      body: JSON.stringify({ maCa, dat, ...them }),
      signal: bo.signal,
    })
    if (!res.ok) return false
    const j = (await res.json()) as { ok?: boolean; coCa?: boolean }
    return j?.ok === true && j.coCa === true
  } catch {
    return false
  } finally {
    clearTimeout(hen)
  }
}

/** CHI TIẾT MỘT CA ĐỌC THẲNG TỪ MÁY CHỦ MỚI.
 *
 * VÌ SAO: `chiTietCa` bên Apps Script đo được p50 **5,1 giây** — thầy bấm vào
 * một ca rồi ngồi nhìn năm giây, giữa ca thi thì nhìn nhiều lần.
 *
 * Trả `null` nghĩa là "đi đường cũ", dùng chung cho mọi trường hợp không chắc:
 * cờ tắt · mạng hỏng · ca không có trên D1 · **ca chưa `dayDu`**. Vế cuối là
 * cổng an toàn: ca chép sang từ Sheet thiếu điểm, thiếu họ tên, thiếu dòng bị
 * chặn — hiện ra là sai số liệu, còn tệ hơn chậm. */
export async function chiTietCaMoi(
  ch: CauHinhMayChu,
  maBiMat: string,
  maCa: string,
): Promise<Record<string, unknown> | null> {
  if (!ch.BAT || !ch.URL || !maCa) return null
  const bo = new AbortController()
  const hen = setTimeout(() => bo.abort(), ch.HAN_GIAY * 1000)
  try {
    const res = await fetch(`${ch.URL}/ca/chi-tiet`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-ma-bi-mat': maBiMat },
      body: JSON.stringify({ maCa }),
      signal: bo.signal,
    })
    if (!res.ok) return null
    const j = (await res.json()) as Record<string, unknown>
    if (j?.ok !== true || j.coCa !== true || j.dayDu !== true) return null
    return j
  } catch {
    return null
  } finally {
    clearTimeout(hen)
  }
}

/** SOI ĐIỂM VỪA CHẤM SANG MÁY CHỦ MỚI.
 *
 * Không có bước này thì D1 mãi thiếu điểm, và màn Chi tiết ca không bao giờ đọc
 * thẳng D1 được cho một ca đã chấm. Hỏng thì thôi: Apps Script vẫn là nơi điểm
 * được ghi thật, và dòng `if (!r.ok) throw` ở chỗ gọi đã lo phần ấy. */
export async function ghiDiemMoi(
  ch: CauHinhMayChu,
  maBiMat: string,
  maCa: string,
  bai: { sbd: string; lanThu?: number; hoTen?: string; diem?: { I?: number; II?: number; III?: number; tong?: number } }[],
): Promise<boolean> {
  if (!ch.BAT || !ch.URL || !maCa || bai.length === 0) return false
  return guiJson(ch, maBiMat, '/diem', { maCa, bai }, HAN_DAY_CA_GIAY)
}

/** DANH SÁCH HỌC SINH ĐỌC TỪ MÁY CHỦ MỚI.
 *
 * Trả `null` = đi đường cũ. Bảng `danh_sach` RỖNG cũng trả `null`: thầy chưa
 * đẩy danh sách thì đường cũ vẫn có dữ liệu, còn ở đây là một màn hình trống. */
export async function danhSachEmMoi(
  ch: CauHinhMayChu,
  maBiMat: string,
): Promise<Record<string, unknown>[] | null> {
  if (!ch.BAT || !ch.URL) return null
  const bo = new AbortController()
  const hen = setTimeout(() => bo.abort(), ch.HAN_GIAY * 1000)
  try {
    const res = await fetch(`${ch.URL}/em/danh-sach`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-ma-bi-mat': maBiMat },
      body: JSON.stringify({}),
      signal: bo.signal,
    })
    if (!res.ok) return null
    const j = (await res.json()) as { ok?: boolean; items?: Record<string, unknown>[] }
    if (j?.ok !== true || !Array.isArray(j.items) || j.items.length === 0) return null
    return j.items
  } catch {
    return null
  } finally {
    clearTimeout(hen)
  }
}

/** NẠP ĐỦ MỘT CA SANG MÁY CHỦ MỚI SAU KHI ĐÃ ĐỌC NÓ TỪ APPS SCRIPT.
 *
 * TỰ CHỮA LÀNH: máy thầy vừa đi đường cũ xong là đã cầm gói đầy đủ của ca ấy —
 * điểm, họ tên, ghi chú. Gửi luôn sang đây thì lần sau mở chính ca đó là tức
 * thì, không cần một lượt chuyển dữ liệu 88 ca (lượt ấy đã chết ở ca thứ 6 hôm
 * 11/09).
 *
 * Worker tự từ chối ca ĐANG MỞ — trường hợp duy nhất D1 mới hơn Sheet. */
export async function napDayDuCaMoi(
  ch: CauHinhMayChu,
  maBiMat: string,
  maCa: string,
  luot: Record<string, unknown>[],
  keyBank?: unknown,
): Promise<boolean> {
  if (!ch.BAT || !ch.URL || !maCa || luot.length === 0) return false
  return guiJson(ch, maBiMat, '/ca/nap-day-du', keyBank ? { maCa, luot, keyBank } : { maCa, luot }, HAN_DAY_CA_GIAY)
}

// ---------------------------------------------------------------------------
// KHỐI A — CHẤM ĐIỂM TRỌN VẸN TRÊN MÁY CHỦ MỚI
//
// Một lượt gọi `/cham-diem` làm hết chuỗi việc mà `ghiDiem` bên Apps Script
// kéo theo: điểm · chi tiết từng câu · tiến độ theo ca · bảng mạnh–yếu · câu đã
// làm · bản đồ câu sai. Bên Apps Script chuỗi ấy đọc và ghi lại năm bảng bằng
// `getDataRange()`; ở đây là vài câu SQL có khoá.

/** CHẤM ĐIỂM MỘT LÔ BÀI trong cùng một ca. Trả `false` nghĩa là chưa sang được
 * — chỗ gọi vẫn còn Apps Script đỡ. */
export async function chamDiemMoi(
  ch: CauHinhMayChu,
  maBiMat: string,
  maCa: string,
  bai: unknown[],
): Promise<boolean> {
  if (!ch.BAT || !ch.URL || !maCa || bai.length === 0) return false
  return guiJson(ch, maBiMat, '/cham-diem', { maCa, bai }, HAN_DAY_CA_GIAY)
}

/** BẢNG MẠNH–YẾU + CÂU ĐÃ LÀM của một em. `null` = đi đường cũ. */
export async function tienDoEmMoi(
  ch: CauHinhMayChu,
  maBiMat: string,
  sbd: string,
): Promise<{ chuyenDe: { ten: string; soCau: number; soSai: number }[]; qidDaLam: string[] } | null> {
  if (!ch.BAT || !ch.URL || !sbd) return null
  const bo = new AbortController()
  const hen = setTimeout(() => bo.abort(), ch.HAN_GIAY * 1000)
  try {
    const res = await fetch(`${ch.URL}/em/tien-do`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-ma-bi-mat': maBiMat },
      body: JSON.stringify({ sbd }),
      signal: bo.signal,
    })
    if (!res.ok) return null
    const j = (await res.json()) as { ok?: boolean; chuyenDe?: unknown; qidDaLam?: unknown }
    if (j?.ok !== true) return null
    return {
      chuyenDe: Array.isArray(j.chuyenDe) ? (j.chuyenDe as { ten: string; soCau: number; soSai: number }[]) : [],
      qidDaLam: Array.isArray(j.qidDaLam) ? (j.qidDaLam as string[]) : [],
    }
  } catch {
    return null
  } finally {
    clearTimeout(hen)
  }
}

/** GHI MỘT CÂU CHỮA TẠI LỚP vào bảng mạnh–yếu. KHÔNG tạo lượt thi, KHÔNG đụng
 * điểm — đúng khuôn `ghiLenBang` bên Apps Script. */
export async function ghiLenBangMoi(
  ch: CauHinhMayChu,
  maBiMat: string,
  d: { sbd: string; chuyenDe: string; dat: boolean; qid?: string; giayThuc?: number },
): Promise<boolean> {
  if (!ch.BAT || !ch.URL || !d.sbd || !d.chuyenDe) return false
  return guiJson(ch, maBiMat, '/len-bang', d, HAN_DAY_CA_GIAY)
}

/** Tạo ca: lỗi rõ nguyên nhân, mất phản hồi thì hỏi lại trước khi gửi lại cùng mã. */
export function diaChiGuiCa(server: string, origin: string): string {
  const base = server.replace(/\/+$/, '')
  // Trên app chính, điện thoại chỉ cần kết nối tên miền app đang mở.
  // Cấu hình máy chủ khác vẫn đi đúng nơi được cấu hình, không gửi nhầm mã.
  if (base === 'https://omr.ttadodaihoc.workers.dev' && /^https:\/\/(?:[a-z0-9-]+\.)?omr-app-b3u\.pages\.dev$/.test(origin)) return `${origin}/api`
  return base
}

export async function taoCaDaXacNhan(ch: CauHinhMayChu, secret: string, ca: CaDay, bank: unknown, keyBank?: unknown): Promise<boolean> {
  if (!ch.BAT || !ch.URL) throw new Error('Chưa có kết nối máy chủ. Thầy kiểm tra cấu hình kết nối.')
  if (!secret.trim()) throw new Error('Chưa có mã xác thực giáo viên. Thầy đăng nhập lại app giáo viên.')
  const body = JSON.stringify({ ca, bank, keyBank, secret })
  const headers = { 'content-type': 'text/plain;charset=utf-8' }
  const directBase = ch.URL.replace(/\/+$/, '')
  const base = diaChiGuiCa(ch.URL, typeof location === 'undefined' ? '' : location.origin)
  // THỨ TỰ ĐỊA CHỈ: gọi THẲNG máy chủ trước, proxy Pages là đường LUI.
  //
  // LỖI ĐÃ DÍNH, máy thầy 23/09: nút mở ca đứng ở "Đang gửi ca…" rồi báo "Mất
  // kết nối hoặc máy chủ chưa phản hồi kịp". Nguyên nhân: đường gửi ca đi QUA
  // PROXY Pages trước, mà bản cũ chỉ lui về gọi thẳng khi proxy trả LỖI MẠNG hoặc
  // 5xx. Còn khi proxy TREO tới hạn thì `voiHanCho` abort cả lượt gọi, nên đường
  // thẳng KHÔNG BAO GIỜ được thử — đúng chữ thầy thấy.
  //
  // Đường thẳng chắc chắn sống: MỌI lượt khác của app (vào thi, nộp bài, lưu tạm,
  // chấm điểm…) đều gọi thẳng `workers.dev` và chạy tốt trên mạng trường; riêng
  // `/ca/day` bị đẩy qua proxy. Proxy là một chặng thừa, kèm một lớp hạn chờ 50 s.
  const cacDiaChi = base === directBase ? [directBase] : [directBase, base]
  // MỖI ĐỊA CHỈ MỘT HẠN RIÊNG (không chia chung một hạn): một đường TREO tới hạn
  // không được nuốt mất lượt thử của đường kia — đúng lỗi làm nút mở ca đứng im.
  const gui = async (path: string, payload: string, seconds: number) => {
    let ketQua5xx: { ok: boolean; status: number; data: { ok?: boolean; error?: string; daLuu?: boolean } | null } | null = null
    let loiCuoi: unknown = null
    for (const goc of cacDiaChi) {
      const controller = new AbortController()
      try {
        // fetch() kết thúc khi có HEADER, chưa chắc đã nhận đủ thân phản hồi.
        // Giữ hạn chờ tới khi đọc xong JSON để tránh nút mở ca quay mãi.
        const kq = await voiHanCho((async () => {
          const res = await fetch(goc + path, { method: 'POST', headers, body: payload, signal: controller.signal })
          if (res.status === 401 || res.status === 403) throw new Error('AUTH')
          const data = await res.json().catch(() => null) as { ok?: boolean; error?: string; daLuu?: boolean } | null
          return { ok: res.ok, status: res.status, data }
        })(), seconds * 1000, 'Máy chủ chưa phản hồi kịp.', () => controller.abort())
        if (kq.status >= 500) { ketQua5xx = kq; continue } // máy chủ lỗi: thử địa chỉ kế
        return kq
      } catch (e) {
        if (e instanceof Error && e.message === 'AUTH') throw e
        loiCuoi = e // mạng đứt / hết hạn: thử địa chỉ kế
      }
    }
    // Hết đường mà chỉ gặp 5xx: trả kết quả ấy để vòng ngoài báo đúng chữ máy chủ.
    if (ketQua5xx) return ketQua5xx
    throw loiCuoi instanceof Error ? loiCuoi : new Error('Không kết nối được máy chủ.')
  }
  let loi = 'Không kết nối được máy chủ.'
  for (let lan = 0; lan < 2; lan++) {
    let thuLai = true
    try {
      const res = await gui('/ca/day', body, HAN_DAY_CA_GIAY)
      const j = res.data
      if (res.ok && j?.ok === true) return true
      if (res.status === 413) { loi = 'Gói đề quá lớn. Thầy chọn ít đề hơn rồi mở lại ca.'; thuLai = false }
      else { loi = j?.error || `Máy chủ chưa lưu được ca (HTTP ${res.status}).`; thuLai = res.status >= 500 || res.status === 429 }
    } catch (e) {
      if (e instanceof Error && e.message === 'AUTH') throw new Error('Mã xác thực giáo viên không hợp lệ. Thầy đăng nhập lại app giáo viên.')
      // Kèm lý do gốc (hết hạn? mạng đứt? cỡ gói?) để lần sau đọc là biết ngay,
      // không phải đoán — lỗi này đã từng tốn một buổi chỉ để hỏi "dừng ở đâu".
      const them = e instanceof Error && e.message ? ` (${e.message}; gói ${Math.round(body.length / 1024)} KB)` : ''
      loi = `Mất kết nối hoặc máy chủ chưa phản hồi kịp.${them}`
      // Mạng đứt / hết hạn ở CẢ hai đường (proxy đã được thử trong `gui`): gửi
      // lại y hệt ngay lập tức cũng vô ích. Vẫn đọc xác nhận (ca có thể đã lưu),
      // rồi báo thật. Chỉ 5xx mới đáng gửi lại.
      thuLai = false
    }
    // Chỉ đọc xác nhận; không dựng ca hay thay đổi bài của học sinh.
    try {
      const res = await gui('/ca/xac-nhan', JSON.stringify({ secret, maCa: ca.maCa, batDau: ca.batDau, tenCa: ca.tenCa, canDe: !!bank, canKey: !!keyBank }), 10)
      if (res.ok && res.data?.daLuu === true) return true
    } catch { /* Giữ nguyên lỗi ban đầu nếu mạng vẫn đứt. */ }
    if (!thuLai) break
  }
  throw new Error(`${loi} Chưa xác nhận lưu ca #${ca.maCa}. Thầy giữ màn này và kiểm tra kết nối.`)
}
