// ĐO TREO MÁY Ở CA THI (thầy 22/10, docs/dac-ta-muc-lam-6-muc-2210.md mục 3 — Đợt 1, không đổi giao diện).
// Ca thi đã có `giayCau` (giây câu chiếm màn hình khi tab hiện, KHÔNG cắt 180 giây) — đó chính là `v` của đặc tả, nên không đếm lại.
// Mô-đun này chỉ đếm phần còn thiếu, theo cùng khuôn với phiếu (`taoBoDoGiay` trong html-phieu.ts):
//   a = giây ẩn tab / màn tắt, cộng cho câu đang làm lúc ẩn — CHỈ khoảng ẩn khép lại trong cùng một lần mở trang;
//   l = khoảng lặng dài nhất (giây tab hiện kể từ lần chạm trước), tính cả khoảng từ lần chạm cuối tới lúc nộp;
//   n = số khoảng lặng 120–179 giây kết thúc bằng một lần chạm (chạm giữ cho đồng hồ chạy);
//   w = 1 nếu màn được giữ sáng suốt mọi giây câu mở (bảng lưu ghi điều ngược lại: `wh` = 1 khi có giây KHÔNG giữ được).
// Chỉ ExamTakeScreen nhập mô-đun này (đi chung mảnh màn thi, không thêm tệp nạp). Không setState: màn thi gọi trong nhịp 1 giây sẵn có.

/** Phần đo thêm của một câu, lưu cùng lượt làm (IndexedDB) để mở lại vẫn cộng dồn. */
export interface DoTreoCau {
  a?: number
  l?: number
  n?: number
  /** 1 = có ít nhất một giây câu mở mà màn KHÔNG được giữ sáng. */
  wh?: 1
}

/** Cụm gửi máy chủ cho một câu ca thi. */
export interface DoGiayThiCau {
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
      if (m.wh === 1) sach.wh = 1
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
      if (!giuSang) m.wh = 1
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
    ra[q] = { v, a, l: m.l ?? 0, n: m.n ?? 0, w: v > 0 && m.wh !== 1 ? 1 : 0 }
  }
  return Object.keys(ra).length > 0 ? ra : null
}
