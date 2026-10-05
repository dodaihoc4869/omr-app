// HỎI SỚM CÁC LỆNH SẢNH (05/10, tối ưu mở app học sinh — thầy: "nhanh gấp 2 lần", giữ nguyên giao diện).
//
// Đo trước (scripts/do-app-hs.mjs, máy yếu giả lập): mở lại app (đã đăng nhập) thì lệnh `hoa2-sanh` + kế hoạch ngày + ca đang mở… chỉ được
// gửi SAU khi mảnh mã tải + chạy + React dựng xong lượt đầu (~1,2–2,3 s), rồi chờ thêm một vòng mạng (~0,65 s Slow 4G) mới có Sảnh.
// Nay gửi NGAY lúc đọc HTML (đoạn mã nội tuyến index.html, máy đã đăng nhập) hoặc ngay khi em vừa đăng nhập xong (AppHocSinh) — SONG SONG
// với lúc tải/chạy mã. Màn nào tới lượt gửi đúng lệnh ấy thì NHẬN phản hồi đã có thay vì gửi lại: tổng số lệnh tới máy chủ KHÔNG đổi.
//
// Luật nhận (an toàn hơn nhanh):
//   · Chỉ nhận khi ĐỊA CHỈ + THÂN lệnh trùng khớp từng ký tự với lệnh màn định gửi (đúng máy chủ app đang dùng, đúng token / SBD).
//   · Mỗi phản hồi nhận MỘT lần; lượt sau (làm mới, quay lại tab…) gửi lệnh thật như cũ.
//   · Lượt hỏi sớm hỏng (mất mạng, thân hỏng) ⇒ chỗ gọi tự gửi lệnh như cũ. Hạn chờ của chỗ gọi vẫn giữ nguyên.
//   · Phản hồi đến từ đoạn mã nội tuyến (chạy trước khi app bọc fetch) ⇒ ghi lại header nhịp đề nghị của máy chủ như bộ bọc fetch vẫn ghi.
import { KHOA_DIA_CHI_HS, LENH_HOI_SOM, hoiSomSanh } from './nap-truoc-man-em'
import { ghiHeSo } from './nhip-de-nghi'

/** Phản hồi đã đọc xong thân. */
export interface PhanHoiSom {
  ok: boolean
  status: number
  text: string
  nhip: string | null
}
interface MucHoiSom {
  goc: string
  than: string
  hua: Promise<PhanHoiSom | null>
  /** undefined = đang chờ · null = hỏng · còn lại = đã về. */
  xong?: PhanHoiSom | null
  daDung?: boolean
  tuHtml?: boolean
}
type KhoHoiSom = Record<string, MucHoiSom>

function kho(): KhoHoiSom | null {
  if (typeof window === 'undefined') return null
  return ((window as unknown as { __ddhHoiSom?: KhoHoiSom }).__ddhHoiSom ??= {})
}

/** Địa chỉ máy chủ app ĐÃ DÙNG trong phiên trang này (dia-chi-may-chu.ts báo mỗi lần tìm ra) — thước để nhận phản hồi hỏi sớm. */
let diaChiDaDung = ''

/** dia-chi-may-chu.ts gọi mỗi lần tìm ra địa chỉ: nhớ trong phiên + cất cho đoạn mã nội tuyến lần mở sau. */
export function ghiDiaChiDaDung(goc: string): void {
  if (!goc || goc === diaChiDaDung) return
  diaChiDaDung = goc
  try {
    localStorage.setItem(KHOA_DIA_CHI_HS, goc)
  } catch {
    /* máy chặn lưu: lần sau không hỏi sớm được, app vẫn chạy như cũ */
  }
}

/** Gửi sớm các lệnh Sảnh cho phiên vừa đăng nhập (cùng hàm đoạn mã nội tuyến dùng). */
export function batDauHoiSom(goc: string, phien: { token?: string; sbd?: string }): void {
  if (typeof window === 'undefined' || typeof fetch !== 'function' || !goc || !phien.token) return
  try {
    hoiSomSanh(window, goc, phien, LENH_HOI_SOM, false)
  } catch {
    /* hỏi sớm chỉ là tăng tốc */
  }
}

function timMuc(url: string, than: string): MucHoiSom | null {
  const k = kho()
  if (!k) return null
  for (const duong of Object.keys(k)) {
    const m = k[duong]
    if (!m.daDung && m.than === than && m.goc + duong === url) return m
  }
  return null
}

function thanhResponse(m: MucHoiSom, x: PhanHoiSom | null): Response | null {
  if (!x || x.status < 200 || x.status > 599) return null
  if (m.tuHtml) ghiHeSo(x.nhip)
  const h: Record<string, string> = { 'content-type': 'application/json' }
  if (x.nhip) h['x-nhip-de-nghi'] = x.nhip
  const khongThan = x.status === 204 || x.status === 205 || x.status === 304
  return new Response(khongThan ? null : x.text, { status: x.status, headers: h })
}

/**
 * Phản hồi hỏi sớm của ĐÚNG lệnh này (địa chỉ đầy đủ + thân) — nhận MỘT lần. null ⇒ không có (chỗ gọi tự fetch).
 * Lời hứa trả null nếu lượt hỏi sớm hỏng (chỗ gọi tự fetch như cũ); hết hạn chờ của chỗ gọi (`tin` bị huỷ) ⇒ ném AbortError như fetch.
 */
export function layHoiSom(url: string, than: string, tin?: AbortSignal): Promise<Response | null> | null {
  const m = timMuc(url, than)
  if (!m) return null
  m.daDung = true
  const ve = m.hua.then((x) => thanhResponse(m, x))
  if (!tin) return ve
  return new Promise<Response | null>((ok, hong) => {
    const huy = () => hong(new DOMException('Đã huỷ', 'AbortError'))
    if (tin.aborted) return huy()
    tin.addEventListener('abort', huy, { once: true })
    ve.then(ok, hong).finally(() => tin.removeEventListener('abort', huy))
  })
}

/**
 * Phản hồi hỏi sớm ĐÃ VỀ (đọc đồng bộ, không nhận) — để lượt vẽ ĐẦU của Sảnh có số ngay. Chỉ khi lệnh đã đi đúng máy chủ app vừa dùng
 * (địa chỉ đã biết trong phiên này); chưa biết địa chỉ ⇒ null (màn đi đường thường, vẫn nhận phản hồi qua `layHoiSom`).
 */
export function xemHoiSomDaVe(duong: string, than: string): PhanHoiSom | null {
  const m = kho()?.[duong]
  if (!m || m.daDung || m.than !== than || !diaChiDaDung || m.goc !== diaChiDaDung || !m.xong) return null
  return m.xong
}

/** Đánh dấu đã nhận phản hồi đọc đồng bộ ở trên (để lượt gửi kế tiếp đi lệnh thật). */
export function danhDauDaNhan(duong: string, than: string): void {
  const m = kho()?.[duong]
  if (!m || m.than !== than) return
  m.daDung = true
  if (m.tuHtml && m.xong) ghiHeSo(m.xong.nhip)
}
