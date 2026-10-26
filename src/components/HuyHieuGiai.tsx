// HUY HIỆU KIM LOẠI CỦA GIẢI TUẦN (thưởng phạt kiểu Duolingo — thầy chốt 26/10, bản vẽ ve-moi/tp-14-ph-tuan · tp-15-gv-thi-dua).
// Lục giác nhỏ + kí hiệu hoá học của kim loại (Fe · Cu · Ag · Au · Pt; Kim cương = C). Dùng chung: thẻ tuần phụ huynh (DocPh, mảnh nạp lười)
// và màn Thi đua tuần của thầy (mảnh nạp lười) — KHÔNG nhập ở mảnh mở app. MÀU do tờ CSS của nơi dùng đặt qua ba biến trên `.hhg[data-kl]`:
// --hhg-n (nền lục giác) · --hhg-v (viền) · --hhg-c (chữ) — chỉ biến màu sẵn có của đúng app (PH: --ph3-* / --ph-cam; thầy: --tr-*).
export type KimLoai = 'sat' | 'dong' | 'bac' | 'vang' | 'bachkim' | 'kimcuong'
export const THU_TU_KL: readonly KimLoai[] = ['sat', 'dong', 'bac', 'vang', 'bachkim', 'kimcuong']
export const TEN_KL: Readonly<Record<KimLoai, string>> = { sat: 'Sắt', dong: 'Đồng', bac: 'Bạc', vang: 'Vàng', bachkim: 'Bạch kim', kimcuong: 'Kim cương' }
const KI_HIEU: Readonly<Record<KimLoai, string>> = { sat: 'Fe', dong: 'Cu', bac: 'Ag', vang: 'Au', bachkim: 'Pt', kimcuong: 'C' }
const BI_DANH: Readonly<Record<string, KimLoai>> = { bk: 'bachkim', 'bach-kim': 'bachkim', bach_kim: 'bachkim', kc: 'kimcuong', 'kim-cuong': 'kimcuong', kim_cuong: 'kimcuong' }

/** Đọc tên hạng từ máy chủ ('bac', 'bachkim', 'bk', 'kim_cuong'…). Lạ ⇒ null (ẩn, không bịa). */
export function docKimLoai(x: unknown): KimLoai | null {
  if (typeof x !== 'string') return null
  const s = x.trim().toLowerCase()
  return (THU_TU_KL as readonly string[]).includes(s) ? (s as KimLoai) : BI_DANH[s] ?? null
}
/** Hạng kế trên / kế dưới (Kim cương không có trên, Sắt không có dưới). */
export const klTren = (kl: KimLoai): KimLoai | null => THU_TU_KL[THU_TU_KL.indexOf(kl) + 1] ?? null
export const klDuoi = (kl: KimLoai): KimLoai | null => THU_TU_KL[THU_TU_KL.indexOf(kl) - 1] ?? null

export function HuyHieuGiai({ kl, co = 22 }: { kl: KimLoai; co?: number }) {
  return (
    <svg className="hhg" data-kl={kl} viewBox="0 0 100 100" width={co} height={co} role="img" aria-label={`Giải ${TEN_KL[kl]}`}>
      <path className="hhg-n" d="M50 5 90 28v44L50 95 10 72V28z" />
      <path className="hhg-s" d="M50 5 90 28 50 50 10 28z" />
      <text className="hhg-k" x="50" y="64" textAnchor="middle">{KI_HIEU[kl]}</text>
    </svg>
  )
}
