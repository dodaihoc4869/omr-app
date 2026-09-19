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
 * trùng bằng 0 ngay tại đây — pha 2 không còn việc gì để làm.
 *
 * `boSan` (tuỳ chọn) — mỗi em có thể đã CÓ SẴN một ít câu từ trước (câu khắc
 * phục cá nhân, không phải chỗ này chọn). Những câu đó tính vào đúng chỉ tiêu
 * `k` của em luôn — vòng lặp chỉ bù phần CÒN THIẾU, không phát thêm cho em đã
 * đủ. Không truyền thì coi như mọi em bắt đầu từ rỗng, hệt bản gốc.
 *
 * `cam` (tuỳ chọn, 19/09) — tập CẤM THEO TỪNG EM: câu em vừa làm trong tuần ở
 * BTVN/khắc phục/bài mẹ giao thì đề thi không phát lại. Phải là tập ĐÃ NỚI SẴN
 * bằng `noiTapCam` (kho mỏng mà cấm cứng thì em thiếu câu); `sinhBoMotO` lo việc
 * đó. Không truyền, hoặc mọi tập đều rỗng ⇒ đúng thuật toán cũ. */
export function chiaVongTron(ids: string[], k: number, m: number, seed: number, boSan?: Set<string>[], cam?: Set<string>[]): Set<string>[] {
  const N = ids.length
  const bo: Set<string>[] = Array.from({ length: m }, (_, e) => new Set<string>(boSan?.[e] ?? []))
  if (N === 0 || k <= 0 || m <= 0) return bo
  const can = Math.min(k, N)
  const thu = xao(ids, bocSo(seed))
  // Có tập cấm thật sự thì đi nhánh riêng; KHÔNG có (hoặc toàn rỗng) thì chạy
  // đúng vòng lặp cũ bên dưới, từng bước một — ca không có hồ sơ ôn ra y hệt bản trước.
  if (cam && cam.some((c) => c && c.size > 0)) return chiaVongTronCoCam(thu, can, m, bo, cam)
  let i = 0
  for (let vong = 0; vong < can; vong++) {
    for (let e = 0; e < m; e++) {
      if (bo[e].size >= can) continue // đã đủ chỉ tiêu từ `boSan` hoặc vòng trước
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

/** TẬP CẤM THEO TỪNG EM, dạng chỗ gọi đưa vào `sinhBoMotO`. */
export interface CamTheoEm {
  /** `cam[e]` = qid KHÔNG phát cho em thứ `e`, câu em làm MỚI NHẤT đứng ĐẦU —
   * thứ tự là một phần đầu vào: kho mỏng thì nới từ CUỐI mảng (cũ nhất trước). */
  cam: string[][]
  /** Hàm GHI vào đây, không đọc: `soNoi[e]` = số câu cấm đã phải nới cho em `e`.
   * Bằng 0 hết = kho đủ, không em nào phải nhận lại câu vừa làm. */
  soNoi?: number[]
}

/** NỚI TẬP CẤM CỦA ĐÚNG EM THIẾU CÂU — và ĐẾM số câu đã nới, không im lặng.
 *
 * Em `e` còn cần `can − |boSan[e]|` câu. Kho trừ câu em đã có, trừ câu cấm, mà
 * còn ít hơn ngần ấy thì cấm cứng sẽ làm em THIẾU CÂU — tệ hơn nhiều so với
 * gặp lại một câu cũ. Nên gỡ cấm vừa đủ số thiếu, câu CŨ NHẤT trước (cuối mảng):
 * câu làm 6 ngày trước gặp lại đỡ hại hơn câu làm tối qua.
 *
 * Chỉ nới của em thiếu. Em khác kho vẫn đủ thì tập cấm của em đó giữ nguyên. */
export function noiTapCam(ids: string[], k: number, m: number, boSan: Set<string>[] | undefined, cam: string[][]): { cam: Set<string>[]; soNoi: number[] } {
  const trongKho = new Set(ids)
  const can = Math.min(k, ids.length)
  const ra: Set<string>[] = []
  const soNoi = new Array<number>(m).fill(0)
  for (let e = 0; e < m; e++) {
    const daCo = boSan?.[e] ?? new Set<string>()
    // Chỉ giữ câu CÓ TRONG KHO và em CHƯA có: câu ngoài kho cấm hay không cũng
    // thế, đếm vào là báo "đã nới" cho một câu chẳng bao giờ phát được.
    const thuTu = [...new Set(cam[e] ?? [])].filter((q) => trongKho.has(q) && !daCo.has(q))
    let soDaCoTrongKho = 0
    for (const q of daCo) if (trongKho.has(q)) soDaCoTrongKho++
    const conCan = Math.max(0, can - daCo.size)
    const conPhatDuoc = ids.length - soDaCoTrongKho - thuTu.length
    const phaiNoi = Math.min(thuTu.length, Math.max(0, conCan - conPhatDuoc))
    soNoi[e] = phaiNoi
    ra.push(new Set(phaiNoi > 0 ? thuTu.slice(0, thuTu.length - phaiNoi) : thuTu))
  }
  return { cam: ra, soNoi }
}

/** Pha 1 khi CÓ tập cấm. Vẫn là một dòng chảy duy nhất `thu` lặp vòng, mỗi em
 * tới lượt lấy câu SỚM NHẤT trong dòng mà mình nhận được.
 *
 * Khác vòng lặp gốc ở đúng một chỗ: câu em này không nhận được (đã có, hoặc bị
 * cấm) KHÔNG bị bỏ phí — nó vào hàng `hoan` và em kế tiếp nhận được thì lấy
 * trước khi con trỏ đi tiếp. Bỏ phí như vòng gốc thì câu cả lớp vừa làm ở BTVN
 * kéo lệch tần suất của mọi câu đứng sau nó; xếp hàng thì câu nào không ai cấm
 * vẫn được dùng đều, chênh nhau tối đa 1. */
function chiaVongTronCoCam(thu: string[], can: number, m: number, bo: Set<string>[], cam: Set<string>[]): Set<string>[] {
  const N = thu.length
  const hoan: string[] = []
  const trongHoan = new Set<string>()
  const duoc = (e: number, x: string) => !bo[e].has(x) && !cam[e]?.has(x)
  let i = 0
  for (let vong = 0; vong < can; vong++) {
    for (let e = 0; e < m; e++) {
      if (bo[e].size >= can) continue
      let lay: string | undefined
      for (let h = 0; h < hoan.length; h++) {
        if (duoc(e, hoan[h])) {
          lay = hoan[h]
          hoan.splice(h, 1)
          trongHoan.delete(lay)
          break
        }
      }
      for (let dem = 0; lay === undefined && dem < N; dem++) {
        const x = thu[i % N]
        i++
        if (duoc(e, x)) lay = x
        else if (!trongHoan.has(x)) {
          hoan.push(x)
          trongHoan.add(x)
        }
      }
      // LƯỚI AN TOÀN: tập cấm chưa qua `noiTapCam` mà kín cả kho. Thà phát một
      // câu cấm còn hơn để em thiếu câu; đường `sinhBoMotO` không bao giờ tới đây.
      for (let d = 0; lay === undefined && d < N; d++) if (!bo[e].has(thu[(i + d) % N])) lay = thu[(i + d) % N]
      if (lay !== undefined) bo[e].add(lay)
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
 * Một phép đổi chỉ động tới `a`, `c` và các cặp dính hai em đó ⇒ O(m).
 *
 * `khoa` (tuỳ chọn) — câu KHOÁ của từng em, không được đổi đi: câu khắc phục
 * cá nhân (em sai câu gì phải nhận đúng câu đó) không phải chỗ pha này được
 * quyền động vào. Một cặp trùng chỉ vì cùng dính câu khoá thì ĐÀNH CHỊU — đó
 * là trùng thật của lịch sử làm bài, không phải lỗi thuật toán, và không có
 * quyền sửa bằng cách rút mất câu khắc phục của em.
 *
 * `cam` (tuỳ chọn, 19/09) — tập cấm theo từng em, ĐÃ NỚI: phép đổi nào đưa một
 * câu cấm vào tay đúng em bị cấm thì bỏ. Pha 1 tránh được mà pha 2 đổi trả lại
 * thì tập cấm thành vô nghĩa. */
export function haDinh(
  boVao: Set<string>[],
  seed: number,
  cauHinh: CauHinhDeRiengTranTrung = CAU_HINH_TRAN_TRUNG_MAC_DINH,
  batDauMs = Date.now(),
  khoa?: Set<string>[],
  cam?: Set<string>[],
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
  // Cặp tệ nhất bị KHOÁ hết đường đổi (mọi câu chung đều là câu khoá của một
  // trong hai em) thì quẩn mãi ở cùng cặp đó — `goEmDinh` chỉ hạ đỉnh khi túi
  // RỖNG, không phải khi túi toàn cặp bất động. Đếm liền mấy lần không đổi
  // được gì; vượt trần thì dừng hẳn, coi phần trùng còn lại là trùng thật của
  // lịch sử làm bài, không phải chỗ thuật toán còn có thể nắn.
  let khongDoiLien = 0
  const tranKhongDoi = Math.max(64, m * 4)
  for (let v = 0; v < cauHinh.VONG_DOI_CHO; v++) {
    goEmDinh()
    if (dinh === 0) break
    if (cauHinh.CAT_THEO_GIO && (v & 31) === 0 && Date.now() - batDauMs > cauHinh.NGAN_SACH_MS) break
    if (khongDoiLien > tranKhongDoi) break

    // Cặp tệ nhất: bốc trong túi đỉnh, không quét m² cặp.
    const tuiDinh = tui[dinh]
    const it = tuiDinh.values()
    let buoc = Math.floor(r() * tuiDinh.size)
    let ic = it.next().value as number
    while (buoc-- > 0) ic = it.next().value as number
    const a = Math.floor(ic / m)
    const b = ic % m

    // Câu chung mà em `a` ĐƯỢC PHÉP nhả ra — bỏ câu khoá của `a` khỏi ứng viên.
    const chung: string[] = []
    for (const x of bo[a]) if (bo[b].has(x) && !khoa?.[a]?.has(x)) chung.push(x)
    if (chung.length === 0) {
      khongDoiLien++
      continue
    }
    khongDoiLien = 0 // có câu chung hợp lệ để thử — không tính là quẩn
    const q = chung[Math.floor(r() * chung.length)]
    const c = Math.floor(r() * m)
    // `q` nằm trong tập cấm của `c` (em vừa làm câu đó trong tuần) thì không đổi sang `c`.
    if (c === a || c === b || bo[c].has(q) || cam?.[c]?.has(q)) continue
    // Câu em `c` ĐƯỢC PHÉP nhả ra — bỏ câu khoá của `c` khỏi ứng viên.
    const ung: string[] = []
    for (const x of bo[c]) if (!bo[a].has(x) && !khoa?.[c]?.has(x) && !cam?.[a]?.has(x)) ung.push(x)
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

/** Chạy trọn hai pha cho MỘT ô blueprint.
 *
 * `boSan`/`khoa` tuỳ chọn — xem `chiaVongTron` và `haDinh`. Truyền cả hai khi
 * một số em đã có sẵn câu KHÔNG ĐƯỢC ĐỘNG (câu khắc phục cá nhân): pha 1 tính
 * chúng vào đúng chỉ tiêu, pha 2 không bao giờ đổi chúng đi.
 *
 * `camTheoEm` tuỳ chọn — xem `CamTheoEm`. Không truyền (hoặc mọi tập rỗng) thì
 * kết quả y hệt bản trước; có truyền thì `camTheoEm.soNoi` được GHI lại để chỗ
 * gọi báo thầy bao nhiêu câu phải nới vì kho mỏng. */
export function sinhBoMotO(
  ids: string[],
  k: number,
  m: number,
  seed: number,
  cauHinh: CauHinhDeRiengTranTrung = CAU_HINH_TRAN_TRUNG_MAC_DINH,
  batDauMs = Date.now(),
  boSan?: Set<string>[],
  khoa?: Set<string>[],
  camTheoEm?: CamTheoEm,
): Set<string>[] {
  // Tập cấm: nới TRƯỚC cho em nào kho không đủ, rồi cả hai pha dùng chung bản đã nới.
  const noi = camTheoEm ? noiTapCam(ids, k, m, boSan, camTheoEm.cam) : undefined
  if (camTheoEm && noi) camTheoEm.soNoi = noi.soNoi
  const pha1 = chiaVongTron(ids, k, m, seed, boSan, noi?.cam)
  if (m < 2 || k <= 0 || ids.length === 0) return pha1
  return haDinh(pha1, seed ^ 0x5bf03635, cauHinh, batDauMs, khoa, noi?.cam)
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
