// MỖI EM MỘT BỘ ĐỀ RIÊNG — CHẶN TRẦN TRÙNG CÂU.
//
// Đặc tả: DE-RIENG-CHAN-TRAN-TRUNG.md.
//
// VÌ SAO CÓ TỆP NÀY. Thuật toán đang chạy (`pick()` trong `exam-assign.ts`) cho
// mỗi em bốc ĐỘC LẬP theo seed `hash(maCa:sbd)`. Trung bình trùng của nó đã sát
// sàn lý thuyết — sửa code không kéo xuống được. Chỗ hỏng là CÁI ĐUÔI: vì mỗi
// em bốc độc lập, luôn tồn tại một cặp xui xẻo trùng gấp 3–7 lần trung bình.
//
// Số đo thật (Phần I 18 câu, 30 em, 60 lần chạy mỗi dòng):
//
//     kho 100 câu: TB 3,23 — CẶP TỆ NHẤT 8,0   (sàn 2,73)
//     kho 200 câu: TB 1,62 — CẶP TỆ NHẤT 5,8   (sàn 1,06)
//     kho 300 câu: TB 1,08 — CẶP TỆ NHẤT 4,7   (sàn 0,50)
//     kho 600 câu: TB 0,54 — CẶP TỆ NHẤT 3,4   (sàn 0,00)
//
// Kho 600 câu mà vẫn có một cặp chung 3–4 câu. Quay cóp là bài toán của CẶP TỆ
// NHẤT: một cặp trùng nhiều ngồi cạnh nhau là hỏng cả ca. Nên mục tiêu ở đây là
// cực tiểu hoá ĐỈNH, không phải trung bình.
//
// Khi kho đủ lớn (N ≥ m·k trong từng ô blueprint) thì trùng PHẢI bằng 0 tuyệt
// đối — đó là tiêu chí đạt/trượt, không phải mục tiêu phấn đấu.
import { CAU_HINH_TRAN_TRUNG_MAC_DINH, type CauHinhDeRiengTranTrung } from './de-rieng-cau-hinh'

/** PRNG tất định — cùng seed cho cùng kết quả trên mọi máy, mọi lần chạy. */
function bocSo(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function xao<T>(ds: T[], r: () => number): T[] {
  const a = [...ds]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ---------------------------------------------------------------------------
// PHA 1 — CHIA VÒNG TRÒN
// ---------------------------------------------------------------------------

/** Chia `k` câu cho mỗi em trong `m` em, lấy từ `ids`, theo lối vòng tròn trên
 * một hoán vị duy nhất của kho.
 *
 * Sau pha này, số lần dùng của mọi câu chênh nhau TỐI ĐA 1 — không còn cảnh câu
 * này 20 em gặp, câu kia không em nào gặp. Đó vừa là chuyện công bằng, vừa là
 * chuyện chống lộ đề.
 *
 * Khi `m·k ≤ ids.length`, con trỏ không quay vòng nên các bộ RỜI NHAU và đỉnh
 * trùng bằng 0 ngay tại đây — pha 2 không còn việc gì để làm. */
export function chiaVongTron(ids: string[], k: number, m: number, seed: number): Set<string>[] {
  const N = ids.length
  const bo: Set<string>[] = Array.from({ length: m }, () => new Set<string>())
  if (N === 0 || k <= 0 || m <= 0) return bo
  const can = Math.min(k, N)
  const thu = xao(ids, bocSo(seed))
  let i = 0
  for (let vong = 0; vong < can; vong++) {
    for (let e = 0; e < m; e++) {
      // Câu này em đã có rồi thì đi tiếp — không ai nhận hai lần một câu.
      let dem = 0
      while (bo[e].has(thu[i % N]) && dem <= N) {
        i++
        dem++
      }
      bo[e].add(thu[i % N])
      i++
    }
  }
  return bo
}

// ---------------------------------------------------------------------------
// PHA 2 — ĐỔI CHỖ HỢP LỆ ĐỂ HẠ ĐỈNH
// ---------------------------------------------------------------------------

function giao(a: Set<string>, b: Set<string>): number {
  let n = 0
  const nho = a.size <= b.size ? a : b
  const to = nho === a ? b : a
  for (const x of nho) if (to.has(x)) n++
  return n
}

export interface DoTrung {
  dinh: number
  trungBinh: number
}

export function doTrung(bo: Set<string>[]): DoTrung {
  const m = bo.length
  if (m < 2) return { dinh: 0, trungBinh: 0 }
  let dinh = 0
  let tong = 0
  let soCap = 0
  for (let a = 0; a < m; a++) {
    for (let b = a + 1; b < m; b++) {
      const g = giao(bo[a], bo[b])
      if (g > dinh) dinh = g
      tong += g
      soCap++
    }
  }
  return { dinh, trungBinh: soCap ? tong / soCap : 0 }
}

/** Đổi chỗ câu giữa các em để hạ ĐỈNH trùng.
 *
 * Mỗi phép đổi lấy một câu `q` đang nằm ở cả `a` lẫn `b` (cặp tệ nhất) rồi đổi
 * nó với một câu `p` của một em `c` khác. Phép đổi GIỮ NGUYÊN cỡ mỗi bộ và GIỮ
 * NGUYÊN tần suất dùng của từng câu, nên ràng buộc của pha 1 không bao giờ bị
 * phá — đó là lý do phải đổi chỗ chứ không phải thay câu.
 *
 * HAI ĐIỀU KIỆN BẮT BUỘC, thiếu là hỏng: `c` không được là `a` hay `b`, và `q`
 * không được đã nằm trong `bo[c]`. Thiếu một trong hai thì một em nhận hai lần
 * cùng một câu.
 *
 * CẬP NHẬT GIA TĂNG, không tính lại cả ma trận mỗi vòng. Bản đầu của tôi gọi
 * `dinh()` và `tong()` quét đủ m² cặp ở MỖI vòng: 60 em × 40 câu mất 674 ms,
 * vượt trần 500 ms, và vì chậm nên không đủ vòng để hội tụ — kho 200 vẫn còn
 * đỉnh 3 trong khi đặc tả đòi ≤ 2. Nay giữ:
 *   · `G[a][b]` — số câu chung của từng cặp, sửa tại chỗ sau mỗi lần đổi;
 *   · `tui[v]`  — tập các cặp đang có đúng `v` câu chung, để lấy cặp tệ nhất
 *                 trong thời gian hằng số thay vì quét m² cặp.
 * Một phép đổi chỉ động tới `a`, `c` và các cặp dính hai em đó ⇒ O(m). */
export function haDinh(
  boVao: Set<string>[],
  seed: number,
  cauHinh: CauHinhDeRiengTranTrung = CAU_HINH_TRAN_TRUNG_MAC_DINH,
  batDauMs = Date.now(),
): Set<string>[] {
  const bo = boVao.map((s) => new Set(s))
  const m = bo.length
  if (m < 2) return bo
  const coCau = Math.max(...bo.map((s) => s.size))

  const G = new Int32Array(m * m)
  const tui: Set<number>[] = Array.from({ length: coCau + 2 }, () => new Set<number>())
  const chiSo = (a: number, b: number) => (a < b ? a * m + b : b * m + a)
  let dinh = 0
  let tongBp = 0
  for (let a = 0; a < m; a++) {
    for (let b = a + 1; b < m; b++) {
      const g = giao(bo[a], bo[b])
      G[a * m + b] = g
      tui[g].add(a * m + b)
      tongBp += g * g
      if (g > dinh) dinh = g
    }
  }

  const dat = (a: number, b: number, gMoi: number) => {
    const i = chiSo(a, b)
    const cu = G[i]
    if (cu === gMoi) return
    tui[cu].delete(i)
    tui[gMoi].add(i)
    G[i] = gMoi
    tongBp += gMoi * gMoi - cu * cu
    if (gMoi > dinh) dinh = gMoi
  }
  const goEmDinh = () => {
    while (dinh > 0 && tui[dinh].size === 0) dinh--
  }

  const r = bocSo(seed)
  for (let v = 0; v < cauHinh.VONG_DOI_CHO; v++) {
    goEmDinh()
    if (dinh === 0) break
    if ((v & 31) === 0 && Date.now() - batDauMs > cauHinh.NGAN_SACH_MS) break

    // Cặp tệ nhất: bốc trong túi đỉnh, không quét m² cặp.
    const tuiDinh = tui[dinh]
    const it = tuiDinh.values()
    let buoc = Math.floor(r() * tuiDinh.size)
    let ic = it.next().value as number
    while (buoc-- > 0) ic = it.next().value as number
    const a = Math.floor(ic / m)
    const b = ic % m

    const chung: string[] = []
    for (const x of bo[a]) if (bo[b].has(x)) chung.push(x)
    if (chung.length === 0) break
    const q = chung[Math.floor(r() * chung.length)]
    const c = Math.floor(r() * m)
    if (c === a || c === b || bo[c].has(q)) continue
    const ung: string[] = []
    for (const x of bo[c]) if (!bo[a].has(x)) ung.push(x)
    if (ung.length === 0) continue
    const p = ung[Math.floor(r() * ung.length)]

    const dinhCu = dinh
    const tongCu = tongBp
    // Ghi lại đủ để trả lại nguyên trạng nếu xấu đi.
    const luu: [number, number, number][] = []
    const doi = (x: number, y: number, gMoi: number) => {
      luu.push([x, y, G[chiSo(x, y)]])
      dat(x, y, gMoi)
    }

    bo[a].delete(q)
    bo[a].add(p)
    bo[c].delete(p)
    bo[c].add(q)
    for (let x = 0; x < m; x++) {
      if (x === a || x === c) continue
      const coQ = bo[x].has(q) ? 1 : 0
      const coP = bo[x].has(p) ? 1 : 0
      if (coQ !== coP) {
        doi(a, x, G[chiSo(a, x)] - coQ + coP)
        doi(c, x, G[chiSo(c, x)] + coQ - coP)
      }
    }

    goEmDinh()
    if (dinh > dinhCu || (dinh === dinhCu && tongBp > tongCu)) {
      bo[a].delete(p)
      bo[a].add(q)
      bo[c].delete(q)
      bo[c].add(p)
      for (let i = luu.length - 1; i >= 0; i--) dat(luu[i][0], luu[i][1], luu[i][2])
      dinh = dinhCu
      tongBp = tongCu
    }
  }
  return bo
}

/** Chạy trọn hai pha cho MỘT ô blueprint. */
export function sinhBoMotO(
  ids: string[],
  k: number,
  m: number,
  seed: number,
  cauHinh: CauHinhDeRiengTranTrung = CAU_HINH_TRAN_TRUNG_MAC_DINH,
  batDauMs = Date.now(),
): Set<string>[] {
  const pha1 = chiaVongTron(ids, k, m, seed)
  if (m < 2 || k <= 0 || ids.length === 0) return pha1
  return haDinh(pha1, seed ^ 0x5bf03635, cauHinh, batDauMs)
}

/** Tần suất dùng của từng câu — max trừ min. Pha 1 bảo đảm ≤ 1. */
export function lechTanSuat(bo: Set<string>[], ids: string[]): number {
  if (ids.length === 0) return 0
  const dem = new Map<string, number>()
  for (const id of ids) dem.set(id, 0)
  for (const s of bo) for (const x of s) dem.set(x, (dem.get(x) ?? 0) + 1)
  let min = Infinity
  let max = -Infinity
  for (const v of dem.values()) {
    if (v < min) min = v
    if (v > max) max = v
  }
  return max - min
}
