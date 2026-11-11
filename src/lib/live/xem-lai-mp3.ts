// XEM LẠI LIVE — KHUNG MP3 (đặc tả docs/dac-ta-live-xem-lai-1011.md mục 4.2, 4.4 luật 7). Thuần, không DOM, không mã hoá lại.
// Tiếng buổi live là MP3 CBR 48 kb/s, mono, 24 kHz (MPEG-2 Layer III): MỖI khung đúng 144 byte = 576 mẫu = 24 ms ⇒ byte ↔ giây tính thẳng
// (6.000 byte / giây), ghép khúc = nối byte, cắt một khoảng = bỏ nguyên khung. Bộ đọc ở đây vẫn đọc tổng quát (MPEG-1 / 2 / 2.5 Layer III)
// để khúc lạ không làm hỏng việc chốt: khung không hợp lệ bị bỏ, không ném lỗi.

export const HZ_LIVE = 24000
export const KB_LIVE = 48
export const MAU_MOI_KHUNG = 576
/** Một khung = 24 ms ở 24 kHz. */
export const MS_MOI_KHUNG = (MAU_MOI_KHUNG * 1000) / HZ_LIVE
/** Một khung = 144 byte ở 48 kb/s, 24 kHz. */
export const BYTE_MOI_KHUNG = (72 * KB_LIVE * 1000) / HZ_LIVE
/** Độ trễ của bộ mã hoá + bộ giải mã LAME (mẫu ở tần số ra): tiếng trong tệp chậm hơn tiếng thật chừng này ⇒ máy ghi trừ đi khi ghi `t0` của khúc. */
export const TRE_LAME_MAU = 576 + 529

const KB_V1 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
const KB_V2 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]
const HZ_V1 = [44100, 48000, 32000]

export interface DauKhungMp3 { dai: number; mau: number; hz: number; kb: number; mono: boolean; v1: boolean }

/** Đọc phần đầu 4 byte của một khung Layer III tại `o`. Không phải khung hợp lệ ⇒ null. */
export function docDauKhung(b: Uint8Array, o: number): DauKhungMp3 | null {
  if (o + 4 > b.length || b[o] !== 0xff || (b[o + 1]! & 0xe0) !== 0xe0) return null
  const ban = (b[o + 1]! >> 3) & 3, lop = (b[o + 1]! >> 1) & 3
  if (ban === 1 || lop !== 1) return null // bản dành riêng / không phải Layer III
  const iKb = b[o + 2]! >> 4, iHz = (b[o + 2]! >> 2) & 3, dem = (b[o + 2]! >> 1) & 1
  if (iKb === 0 || iKb === 15 || iHz === 3) return null
  const v1 = ban === 3
  const kb = (v1 ? KB_V1 : KB_V2)[iKb]!, hz = HZ_V1[iHz]! / (v1 ? 1 : ban === 2 ? 2 : 4)
  const dai = Math.floor(((v1 ? 144 : 72) * kb * 1000) / hz) + dem
  return { dai, mau: v1 ? 1152 : 576, hz, kb, mono: (b[o + 3]! >> 6) === 3, v1 }
}

/** Khung «Xing» / «Info» (thẻ LAME đứng đầu luồng, không mang tiếng): chốt bỏ đi để tệp ghép chỉ gồm khung tiếng ⇒ byte ↔ giây chính xác. */
export function laKhungInfo(b: Uint8Array, o: number, d: DauKhungMp3): boolean {
  const vt = o + 4 + (d.v1 ? (d.mono ? 17 : 32) : d.mono ? 9 : 17)
  if (vt + 4 > b.length) return false
  const s = String.fromCharCode(b[vt]!, b[vt + 1]!, b[vt + 2]!, b[vt + 3]!)
  return s === 'Xing' || s === 'Info'
}

export interface KhungTach { vt: number; dai: number }
/** Tách một đoạn byte thành các khung tiếng liền nhau (bỏ rác trước khung đầu, bỏ khung Info, bỏ khung cụt ở cuối). `du` = số byte đã dùng. */
export function tachKhung(b: Uint8Array): { khung: KhungTach[]; hz: number; mau: number; du: number } {
  const khung: KhungTach[] = []
  let o = 0, hz = 0, mau = 0, du = 0
  while (o + 4 <= b.length) {
    const d = docDauKhung(b, o)
    if (!d) { o += 1; continue }
    if (o + d.dai > b.length) break
    if (!laKhungInfo(b, o, d)) { khung.push({ vt: o, dai: d.dai }); hz = hz || d.hz; mau = mau || d.mau }
    o += d.dai; du = o
  }
  return { khung, hz, mau, du }
}

let camNho: Uint8Array | null = null
/** Một khung CÂM đúng dạng tiếng buổi live (48 kb/s, mono, 24 kHz): phần đầu hợp lệ + thân toàn 0 ⇒ bộ giải mã phát im lặng. Dùng lấp khúc tiếng bị thiếu. */
export function khungCam(): Uint8Array {
  if (!camNho) { camNho = new Uint8Array(BYTE_MOI_KHUNG); camNho.set([0xff, 0xf3, 0x64, 0xc4]) }
  return camNho
}
/** `n` khung câm nối nhau. */
export function dayCam(n: number): Uint8Array<ArrayBuffer> {
  const k = khungCam(), ra = new Uint8Array(Math.max(0, n) * k.length)
  for (let i = 0; i < n; i++) ra.set(k, i * k.length)
  return ra
}

/** ms ⇒ số khung (làm tròn gần nhất). */
export const soKhungCua = (ms: number): number => Math.max(0, Math.round(ms / MS_MOI_KHUNG))
/** Vị trí byte trong `tieng.mp3` của thời điểm `ms` (đầu khung chứa nó) — để tua bằng Range. */
export const byteCua = (ms: number): number => Math.floor(Math.max(0, ms) / MS_MOI_KHUNG) * BYTE_MOI_KHUNG
/** Thời lượng (ms) của tệp `byte` byte. */
export const msCua = (byte: number): number => Math.floor(byte / BYTE_MOI_KHUNG) * MS_MOI_KHUNG

/** Lấy các khung có chỉ số trong các khoảng `giu` ([từ, tới) theo CHỈ SỐ KHUNG của khúc) ⇒ byte nối liền. Cắt theo khung, không mã hoá lại. */
export function catKhung(b: Uint8Array, khung: readonly KhungTach[], giu: readonly (readonly [number, number])[]): Uint8Array<ArrayBuffer> {
  let tong = 0
  const phan: [number, number][] = []
  for (const [a, z] of giu) {
    const tu = Math.max(0, a), toi = Math.min(khung.length, z)
    if (toi <= tu) continue
    const dau = khung[tu]!.vt, cuoi = khung[toi - 1]!.vt + khung[toi - 1]!.dai
    phan.push([dau, cuoi]); tong += cuoi - dau
  }
  const ra = new Uint8Array(tong)
  let o = 0
  for (const [dau, cuoi] of phan) { ra.set(b.subarray(dau, cuoi), o); o += cuoi - dau }
  return ra
}
