// ĐO TREO MÁY Ở CA THI (thầy 22/10, docs/dac-ta-muc-lam-6-muc-2210.md mục 3 — Đợt 1, không đổi giao diện).
// Ca thi đã có `giayCau` (giây câu chiếm màn hình khi tab hiện, KHÔNG cắt 180 giây) — đó chính là `v` của đặc tả, nên không đếm lại.
// Mô-đun này chỉ đếm phần còn thiếu, theo cùng khuôn với phiếu (`taoBoDoGiay` trong html-phieu.ts):
//   a = giây ẩn tab / màn tắt, cộng cho câu đang làm lúc ẩn — CHỈ khoảng ẩn khép lại trong cùng một lần mở trang;
//   l = khoảng lặng dài nhất (giây tab hiện kể từ lần chạm trước), tính cả khoảng từ lần chạm cuối tới lúc nộp;
//   n = số khoảng lặng 120–179 giây kết thúc bằng một lần chạm (chạm giữ cho đồng hồ chạy);
//   w = 1 nếu đã xin được giữ màn sáng trong lúc câu mở (bảng lưu: `wc` = 1); trình duyệt tự nhả khi tab ẩn KHÔNG hạ về 0 (luật Boss 22/10).
// ExamTakeScreen NẠP LƯỜI mô-đun này sau khi vào đề (cổng tốc độ: đường /t không mang thêm byte); mảnh nằm ở kho chạy-lúc (vite.config globIgnores),
// mất mạng không nạp được thì chỉ thiếu số đo, bài thi không ảnh hưởng. Không setState: màn thi gọi `nhip` trong nhịp 1 giây sẵn có.

/** Phần đo thêm của một câu, lưu cùng lượt làm (IndexedDB) để mở lại vẫn cộng dồn. */
export interface DoTreoCau {
  a?: number
  l?: number
  n?: number
  /** 1 = đã giữ được màn sáng (Screen Wake Lock) ít nhất một giây lúc câu mở. */
  wc?: 1
}

/** Cụm gửi máy chủ cho một câu ca thi — cùng khuôn `doGiay` máy chủ nhận (`lamSachDo`: cụm treo máy chỉ nhận khi có g). */
export interface DoGiayThiCau {
  /** Giây ca thi theo định nghĩa hiện hành (= giayCau); vắng khi câu chưa có giây nào. */
  g?: number
  v: number
  a: number
  l: number
  n: number
  w: 0 | 1
}

export const TRAN_DO = 7200
const TRAN_N = 60

export interface BoDoTreoMay {
  /** Một nhịp 1 giây lúc tab HIỆN. `qid` = câu đang làm (null: không câu nào hiện đủ ⇒ cộng cho câu vừa đếm). */
  nhip: (qid: string | null, giuSang: boolean) => void
  /** Em chạm màn (pointerdown / keydown / input / touchstart / wheel). */
  cham: () => void
  an: () => void
  hien: () => void
  /** Bản sao bảng đo để lưu cùng lượt làm. */
  bang: () => Record<string, DoTreoCau>
}

export function taoDoTreoMay(dau?: Record<string, DoTreoCau> | null, bayGio: () => number = () => Date.now()): BoDoTreoMay {
  const bang: Record<string, DoTreoCau> = {}
  if (dau && typeof dau === 'object') {
    for (const [q, m] of Object.entries(dau)) {
      if (!m || typeof m !== 'object') continue
      const sach: DoTreoCau = {}
      for (const [k, tran] of [['a', TRAN_DO], ['l', TRAN_DO], ['n', TRAN_N]] as const) {
        const x = Math.round(Number(m[k]))
        if (x > 0) sach[k] = Math.min(tran, x)
      }
      if (m.wc === 1) sach.wc = 1
      bang[q] = sach
    }
  }
  let lang = 0
  let qLang: string | null = null
  let tAn: number | null = null
  let qAn: string | null = null
  const cua = (q: string) => (bang[q] ??= {})
  return {
    nhip(qid, giuSang) {
      lang++
      if (qid) qLang = qid
      const q = qid ?? qLang
      if (!q) return
      const m = cua(q)
      if (lang > (m.l ?? 0)) m.l = Math.min(TRAN_DO, lang)
      if (giuSang) m.wc = 1
    },
    cham() {
      if (lang >= 120 && lang < 180 && qLang) {
        const m = cua(qLang)
        m.n = Math.min(TRAN_N, (m.n ?? 0) + 1)
      }
      lang = 0
    },
    an() {
      tAn = bayGio()
      qAn = qLang
    },
    hien() {
      if (tAn !== null && qAn) {
        const giay = Math.round((bayGio() - tAn) / 1000)
        if (giay > 0) {
          const m = cua(qAn)
          m.a = Math.min(TRAN_DO, (m.a ?? 0) + giay)
        }
      }
      tAn = null
      qAn = null
    },
    bang: () => JSON.parse(JSON.stringify(bang)) as Record<string, DoTreoCau>,
  }
}

/** Cụm `doGiay` của lượt thi: mọi câu có giây (`giayCau`, = v) hoặc có giây ẩn. Không câu nào ⇒ null (đừng gửi khoá). */
export function doGiayThi(giayCau: Record<string, number> | null | undefined, doCau: Record<string, DoTreoCau> | null | undefined): Record<string, DoGiayThiCau> | null {
  const ra: Record<string, DoGiayThiCau> = {}
  const qids = new Set([...Object.keys(giayCau ?? {}), ...Object.keys(doCau ?? {})])
  for (const q of qids) {
    const v = Math.min(TRAN_DO, Math.max(0, Math.round(Number(giayCau?.[q]) || 0)))
    const m = doCau?.[q] ?? {}
    const a = m.a ?? 0
    if (!(v > 0) && !(a > 0)) continue
    ra[q] = { ...(v >= 1 ? { g: Math.min(900, v) } : {}), v, a, l: Math.min(m.l ?? 0, v), n: m.n ?? 0, w: m.wc === 1 ? 1 : 0 }
  }
  return Object.keys(ra).length > 0 ? ra : null
}

/** Giữ màn sáng khi đang làm (đặc tả mục 5; luật Boss 22/10 cùng ManLamBaiTap): xin khi vào đề, nhả sau 10 phút không chạm, chạm thì xin lại. */
export const GIU_MAN_SANG = true
const NHA_SANG_MS = 600_000

type KhoaSang = { released?: boolean; release?: () => Promise<void>; addEventListener?: (t: string, f: () => void) => void }

/** Bật bộ đo trên trang thi: nghe chạm (pointerdown / keydown / input / touchstart / wheel), ẩn / hiện tab, giữ màn sáng (theo cờ).
 *  Màn thi gọi `nhip(qid)` mỗi giây lúc tab hiện và `dung()` khi rời màn. Mỗi nhịp bộ đo TỰ ghi bảng vào lượt làm hiện hành (`luot.current.doCau`,
 *  như màn thi tự ghi `giayCau`) ⇒ lưu IndexedDB / nộp cứ mang theo lượt làm là có, màn thi không phải ghép thêm (đường /t không thêm byte). */
export function batDoTreoMay(luot: { current: { doCau?: Record<string, DoTreoCau>; submitted?: boolean } | null }, giuSang: boolean = GIU_MAN_SANG, bayGio: () => number = () => Date.now()) {
  const bo = taoDoTreoMay(luot.current?.doCau, bayGio)
  let khoa: KhoaSang | null = null
  let dangXin = false
  let het = false
  let chamCuoi = bayGio()
  const xinSang = () => {
    if (!giuSang || het || khoa || dangXin || document.hidden) return
    const wl = (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<KhoaSang> } }).wakeLock
    if (!wl) return
    dangXin = true
    wl.request('screen').then(
      (k) => {
        dangXin = false
        if (het) { k.release?.().catch(() => {}); return }
        khoa = k
        k.addEventListener?.('release', () => { if (khoa === k) khoa = null })
      },
      () => { dangXin = false; khoa = null },
    )
  }
  const cham = () => { bo.cham(); chamCuoi = bayGio(); if (!khoa) xinSang() }
  const anHien = () => { if (document.hidden) { khoa = null; bo.an() } else { bo.hien(); xinSang() } }
  const SU_KIEN = ['pointerdown', 'keydown', 'input', 'touchstart', 'wheel']
  for (const t of SU_KIEN) document.addEventListener(t, cham, { capture: true, passive: true })
  document.addEventListener('visibilitychange', anHien)
  xinSang()
  return {
    nhip: (qid: string | null) => {
      bo.nhip(qid, !!khoa && !khoa.released)
      if (khoa && bayGio() - chamCuoi > NHA_SANG_MS) { khoa.release?.().catch(() => {}); khoa = null } // máy bỏ quên không sáng mãi
      const cur = luot.current
      if (cur && !cur.submitted) cur.doCau = bo.bang()
    },
    bang: bo.bang,
    dung: () => {
      het = true
      for (const t of SU_KIEN) document.removeEventListener(t, cham, { capture: true })
      document.removeEventListener('visibilitychange', anHien)
      khoa?.release?.().catch(() => {})
      khoa = null
    },
  }
}
export type BoDoTreoMayTrang = ReturnType<typeof batDoTreoMay>
