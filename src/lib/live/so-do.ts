// LIVE BẢNG — SỐ ĐO `live-do` (đặc tả mục 7): thu trong bộ nhớ, có hàm đọc; máy em gửi phòng 10 giây một lần (trung vị của khoảng vừa qua). Thuần.
//   d    = đệm phát nét D (ms)                    j   = p95 dao động giờ tới của gói điểm (ms)
//   m    = điểm tới muộn nhất so với mốc phát (ms) — «khoảng đứng» của đầu nét
//   rtt  = RTT máy em ↔ SFU (ms)                  jt  = jitter tiếng (ms)
//   tt   = trễ tiếng ước lượng phía máy em (đệm jitter + ~45 ms thu, mã hoá + ~20 ms loa), CHƯA gồm quãng mạng
//   tn   = trễ nét ước lượng = D + RTT/2 (quãng máy em ↔ SFU; quãng máy thầy ↔ SFU không đo được từ máy em)
//   dg   = quãng đầu nét phải ĐỨNG dài nhất vì hết điểm (ms) — 11/11
export type TenSoDo = 'd' | 'j' | 'm' | 'rtt' | 'jt' | 'tt' | 'tn' | 'dg'
export interface TomTatSo { n: number; tv: number; p95: number; max: number }
const GIU = 600

export function tomTatSo(ds: readonly number[]): TomTatSo | null {
  const s = ds.filter((x) => Number.isFinite(x)).sort((a, b) => a - b)
  if (!s.length) return null
  return { n: s.length, tv: s[Math.floor((s.length - 1) / 2)]!, p95: s[Math.min(s.length - 1, Math.floor(s.length * 0.95))]!, max: s[s.length - 1]! }
}

export function taoSoDo() {
  const tat = new Map<TenSoDo, number[]>(), ky = new Map<TenSoDo, number[]>()
  return {
    ghi(ten: TenSoDo, v: number | null | undefined): void {
      if (v == null || !Number.isFinite(v)) return
      for (const m of [tat, ky]) { let a = m.get(ten); if (!a) { a = []; m.set(ten, a) } a.push(v); if (a.length > GIU) a.shift() }
    },
    /** Tóm tắt mọi số đã thu (tới `GIU` mẫu gần nhất mỗi loại). */
    doc(): Partial<Record<TenSoDo, TomTatSo>> {
      const r: Partial<Record<TenSoDo, TomTatSo>> = {}
      for (const [k, a] of tat) { const t = tomTatSo(a); if (t) r[k] = t }
      return r
    },
    /** Thân tin `live-do` của KỲ vừa qua (trung vị, `m` lấy lớn nhất) rồi đặt lại kỳ. Không có mẫu nào ⇒ null. */
    tinKy(dc: boolean): Record<string, unknown> | null {
      const lay = (k: TenSoDo, max = false): number | undefined => { const t = tomTatSo(ky.get(k) ?? []); return t ? Math.round(max ? t.max : t.tv) : undefined }
      const r = { t: 'live-do', d: lay('d'), j: lay('j'), m: lay('m', true), rtt: lay('rtt'), tt: lay('tt'), dc }
      const co = ky.size > 0
      ky.clear()
      return co ? r : null
    },
  }
}
export type SoDo = ReturnType<typeof taoSoDo>

// ── TRỄ TIẾNG ƯỚC TÍNH miệng thầy → tai em (11/11). Chỉ cộng số ĐO ĐƯỢC + hằng số đã đo trên Chromium (docs/do-live-1011.md mục 5). CHƯA gồm loa / tai nghe
//    của máy em (tai nghe Bluetooth thêm 150–250 ms, app không đo và không sửa được).
/** Phần cố định cộng vào đệm rung trong số `tt` máy em báo (≈ 45 ms thu + mã hoá, ≈ 20 ms loa) — giữ nguyên vì đệm phát nét đang dựa vào nó. */
export const TRE_CO_DINH_EM = 65
/** Trễ của chuỗi làm rõ tiếng theo kiểu đang chạy (ms, đo Chromium): từng khung = 0 · worklet Web Audio ≈ 21 · hai bộ nén ≈ 33. */
export const TRE_CHUOI: Record<string, number> = { khung: 0, nhanh: 21, cho: 21, nen: 33, khong: 0 }
/** Bộ mã Opus: trung bình chờ nửa khung (`ptime` / 2) + ≈ 7 ms nhìn-trước và giải mã (khớp số đo: khung 20 ms ≈ 17 ms, khung 10 ms ≈ 12 ms). */
export const treKhungOpus = (ptime: number): number => ptime / 2 + 7
export interface PhanTre { thu: number; chuoi: number; ma: number; mangThay: number | null; mangEm: number | null; demEm: number | null }
/** Tổng các phần đã biết (ms, làm tròn); `du` = đã có đủ số của cả máy thầy lẫn máy em. */
export function treTiengUocTinh(p: PhanTre): { ms: number; du: boolean } {
  const du = p.mangThay != null && p.mangEm != null && p.demEm != null
  return { ms: Math.round(p.thu + p.chuoi + p.ma + (p.mangThay ?? 0) / 2 + (p.mangEm ?? 0) / 2 + (p.demEm ?? 0)), du }
}

