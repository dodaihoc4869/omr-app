// NHỊP SỐNG CỦA MÀN THEO DÕI CA (thầy 29/09: "phần trên cho đồng bộ trực tiếp thời gian thực luôn").
//
// Máy chủ chưa có kênh đẩy cho ca thi (Durable Object duy nhất là bàn Bi-a; nối kênh đẩy vào đường lưu bài của em là đổi đường thi ⇒ không làm).
// Nên dùng HỎI DÀY THÔNG MINH trên lệnh NHẸ `POST /ca/nhip` (server/src/nhip-ca.ts, 1 batch 4 câu D1, không đáp án):
//   - 3 giây/lần khi tab đang xem (qua `useNhipThay`: tab ẩn thì dừng, không gọi chồng, lỗi lùi 10 → 20 s, máy chủ bận thì giãn tối đa ×2);
//   - chỉ lấy dòng tiến độ ĐỔI từ mốc `sau` (bảng `trang_thai` máy em đẩy ~10 s/lần: số câu đã làm, rời màn);
//   - `dauVet` đổi (em vào / nộp / bị khoá, thêm phút, đóng cửa, phòng chờ) ⇒ màn tải lại cả ca, nhưng cách lần tải đầy trước ≥ 4 giây.
// Ước tải (100 em, 1 máy thầy): 20 lần/phút × 4 câu = 80 câu D1/phút, mỗi lần đọc ≈ (dòng trang_thai + 100 dòng lượt); tải đầy chỉ khi có em vào/nộp.
// So với chính 100 em: ~600 lần ghi trang_thai/phút. Đồng hồ đếm lùi KHÔNG phụ thuộc nhịp này: nó tự nhích mỗi giây theo `gioMayChu()`.
import { layCauHinhMayChu } from './may-chu-moi'

/** Nhịp hỏi `/ca/nhip` khi thầy đang nhìn ca đang chạy. */
export const NHIP_SONG_CA_MS = 3_000
/** Hai lần tải LẠI CẢ CA (vì dấu vết đổi) cách nhau tối thiểu — em nộp dồn cuối giờ không làm màn thầy dội `/ca/chi-tiet`. */
export const CACH_TAI_DAY_MS = 4_000
const HAN_MS = 8_000

export interface TienDoSong {
  sbd: string
  dangLam: boolean
  daLam: number
  tongCau: number
  soLanRoiMan: number
  biChan: boolean
  batDauLuc: string
  capNhatLuc: string
}

export interface KetQuaNhipCa {
  coCa: boolean
  gioMayChu: number | null
  dauVet: string
  tt: TienDoSong[]
  moc: string
}

function laChuoi(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

/** Đọc phản hồi `/ca/nhip` — hình dạng lạ ⇒ null (người gọi coi là lỗi, vòng tự lùi). */
export function docNhipCa(j: unknown): KetQuaNhipCa | null {
  if (!j || typeof j !== 'object') return null
  const o = j as Record<string, unknown>
  if (o.ok !== true) return null
  const gio = typeof o.gioMayChu === 'number' && Number.isFinite(o.gioMayChu) ? o.gioMayChu : null
  if (o.coCa !== true) return { coCa: false, gioMayChu: gio, dauVet: '', tt: [], moc: '' }
  const tt = (Array.isArray(o.tt) ? o.tt : [])
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object' && typeof (x as { sbd?: unknown }).sbd === 'string')
    .map((x) => ({
      sbd: String(x.sbd),
      dangLam: x.dangLam === true,
      daLam: Math.max(0, Number(x.daLam) || 0),
      tongCau: Math.max(0, Number(x.tongCau) || 0),
      soLanRoiMan: Math.max(0, Number(x.soLanRoiMan) || 0),
      biChan: x.biChan === true,
      batDauLuc: laChuoi(x.batDauLuc),
      capNhatLuc: laChuoi(x.capNhatLuc),
    }))
  return { coCa: true, gioMayChu: gio, dauVet: laChuoi(o.dauVet), tt, moc: laChuoi(o.moc) }
}

/** Gọi `/ca/nhip`. null = không gọi được (máy chủ mới tắt, mạng hỏng, máy chủ chưa có lệnh này). */
export async function goiNhipCa(maBiMat: string, maCa: string, sau: string): Promise<KetQuaNhipCa | null> {
  const ch = await layCauHinhMayChu()
  if (!ch.BAT || !ch.URL || !maCa || !maBiMat) return null
  const bo = new AbortController()
  const hen = setTimeout(() => bo.abort(), HAN_MS)
  try {
    const res = await fetch(`${ch.URL}/ca/nhip`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-ma-bi-mat': maBiMat },
      body: JSON.stringify({ maCa, sau }),
      signal: bo.signal,
    })
    if (!res.ok) return null
    return docNhipCa(await res.json())
  } catch {
    return null
  } finally {
    clearTimeout(hen)
  }
}

/** Gộp dòng mới vào bảng đang giữ: mỗi SBD giữ dòng có `capNhatLuc` MỚI hơn (lần hỏi `>=` mốc có thể trả lại dòng cũ). */
export function gopTienDoSong(cu: Readonly<Record<string, TienDoSong>>, moi: readonly TienDoSong[]): Record<string, TienDoSong> {
  if (moi.length === 0) return cu as Record<string, TienDoSong>
  const ra: Record<string, TienDoSong> = { ...cu }
  for (const d of moi) {
    const c = ra[d.sbd]
    if (!c || d.capNhatLuc >= c.capNhatLuc) ra[d.sbd] = d
  }
  return ra
}

/**
 * Phủ tiến độ SỐNG lên số của lượt: CHỈ khi lượt đang làm và dòng sống thuộc đúng lượt này (ghi SAU giờ vào — dòng `trang_thai` giữ theo SBD,
 * nên dòng của lượt trước / ca trước không được đè). Số câu và số lần rời màn lấy số LỚN hơn (lượt lưu tạm có thể mới hơn dòng sống, hoặc ngược lại).
 */
export function phuTienDoSong(
  goc: { dangLam: boolean; vaoLuc: string; daLam: number | null; soLanRoiMan: number },
  song: TienDoSong | undefined,
): { daLam: number | null; soLanRoiMan: number } {
  if (!song || !goc.dangLam || !song.dangLam) return { daLam: goc.daLam, soLanRoiMan: goc.soLanRoiMan }
  if (goc.vaoLuc && song.capNhatLuc && song.capNhatLuc < goc.vaoLuc) return { daLam: goc.daLam, soLanRoiMan: goc.soLanRoiMan }
  return {
    daLam: goc.daLam === null ? song.daLam : Math.max(goc.daLam, song.daLam),
    soLanRoiMan: Math.max(goc.soLanRoiMan, song.soLanRoiMan),
  }
}

/**
 * Mốc hết giờ (ms, giờ máy chủ) của em HẾT GIỜ MUỘN NHẤT đang làm — cho vòng đồng hồ tự nhích từng giây. Ưu tiên `hetGioLuc` máy chủ ghi trên lượt
 * (đã gồm phút thầy THÊM); lượt cũ chưa có thì vào lúc + thời gian đề. null = chưa em nào đang làm.
 */
export function hetLucMuonNhat(luot: readonly { dangLam: boolean; vaoLuc?: string; hetGioLuc?: string }[], thoiGianPhut: number): number | null {
  let max: number | null = null
  for (const l of luot) {
    if (!l.dangLam) continue
    const het = Date.parse(String(l.hetGioLuc || ''))
    const vao = Date.parse(String(l.vaoLuc || ''))
    const t = Number.isFinite(het) ? het : Number.isFinite(vao) ? vao + thoiGianPhut * 60_000 : NaN
    if (Number.isFinite(t) && (max === null || t > max)) max = t
  }
  return max
}
