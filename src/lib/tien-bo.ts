// TIẾN BỘ CỦA MỘT EM QUA CÁC CA THI.
//
// Hai đường trên cùng một biểu đồ, và hai đường nói hai chuyện khác nhau:
//   - ĐIỂM TỪNG CA: đúng số em đạt, nhấp nhô theo độ khó từng đề.
//   - TRUNG BÌNH CỘNG DỒN: cộng dồn từ ca đầu tới ca đó rồi chia. Đường này
//     mượt, và nó đi lên hay đi xuống mới là câu trả lời cho "em có tiến bộ
//     không" — một ca điểm cao không đủ để kết luận.
//
// Kết luận bằng chữ luôn kèm con số. Chưa đủ ca thì nói thẳng là chưa đủ, không
// vẽ mũi tên cho có.
import type { HoSoEm } from './exam-api'

export interface DiemMotCa {
  maCa: string
  tenCa: string
  ngay: string
  diem: number
  hang: number | null
  siSo: number | null
}

export type ChieuTienBo = 'len' | 'xuong' | 'deu' | 'chua_du'

export interface NhanXetTienBo {
  chieu: ChieuTienBo
  /** Chênh lệch điểm trung bình giữa nhóm ca gần đây và nhóm trước đó. */
  lech: number | null
  /** Một câu kèm số, dán thẳng lên biểu đồ được. */
  cau: string
}

/** Ngưỡng coi là đổi chiều — dưới mức này là dao động bình thường giữa các đề. */
export const NGUONG_LECH = 0.5

/** Chuỗi ca ĐÃ CHẤM, sắp cũ trước mới sau. Ca chưa có điểm bị loại: vẽ nó vào
 * là bịa ra một cú tụt điểm không có thật. */
export function chuoiTienBo(ca: HoSoEm['ca']): DiemMotCa[] {
  return [...(ca ?? [])]
    .filter((c) => typeof c.tong === 'number' && Number.isFinite(c.tong))
    .sort((a, b) => new Date(a.nopLuc).getTime() - new Date(b.nopLuc).getTime())
    .map((c) => ({ maCa: c.maCa, tenCa: c.tenCa || '', ngay: c.nopLuc, diem: c.tong as number, hang: c.hang, siSo: c.siSo }))
}

/** Trung bình cộng dồn: phần tử thứ i là trung bình của các ca từ đầu tới i. */
export function trungBinhCongDon(diem: number[]): number[] {
  const ra: number[] = []
  let tong = 0
  diem.forEach((d, i) => {
    tong += d
    ra.push(Math.round((tong / (i + 1)) * 100) / 100)
  })
  return ra
}

function tb(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0
}

function soVN(x: number, le = 2): string {
  return x.toFixed(le).replace('.', ',')
}

/** So nhóm ca GẦN ĐÂY với nhóm TRƯỚC ĐÓ (mỗi nhóm tối đa 3 ca) — cùng cách so
 * với mũi tên xu hướng ở bảng chuyên đề, để hai chỗ không nói ngược nhau. */
export function nhanXetTienBo(ds: DiemMotCa[]): NhanXetTienBo {
  if (ds.length < 2) {
    return { chieu: 'chua_du', lech: null, cau: ds.length === 1 ? 'Mới có 1 bài đã chấm, chưa đủ để nói về xu hướng.' : 'Chưa có bài nào đã chấm.' }
  }
  const diem = ds.map((d) => d.diem)
  const nSau = Math.min(3, Math.floor(diem.length / 2)) || 1
  const sau = diem.slice(-nSau)
  const truoc = diem.slice(Math.max(0, diem.length - nSau * 2), diem.length - nSau)
  if (truoc.length === 0) return { chieu: 'chua_du', lech: null, cau: 'Chưa đủ bài để so hai giai đoạn.' }

  const lech = Math.round((tb(sau) - tb(truoc)) * 100) / 100
  const chieu: ChieuTienBo = lech >= NGUONG_LECH ? 'len' : lech <= -NGUONG_LECH ? 'xuong' : 'deu'
  const ve = `${nSau} bài gần nhất trung bình ${soVN(tb(sau))}, ${truoc.length} bài trước đó ${soVN(tb(truoc))}`
  const cau =
    chieu === 'len'
      ? `${ve}, tăng ${soVN(Math.abs(lech))} điểm.`
      : chieu === 'xuong'
        ? `${ve}, giảm ${soVN(Math.abs(lech))} điểm.`
        : `${ve}, chênh nhau ${soVN(Math.abs(lech))} điểm, coi như đi ngang.`
  return { chieu, lech, cau }
}

/** Điểm cao nhất và thấp nhất, để đánh dấu trên biểu đồ. */
export function moc(ds: DiemMotCa[]): { cao: DiemMotCa | null; thap: DiemMotCa | null } {
  if (ds.length === 0) return { cao: null, thap: null }
  let cao = ds[0]
  let thap = ds[0]
  for (const d of ds) {
    if (d.diem > cao.diem) cao = d
    if (d.diem < thap.diem) thap = d
  }
  return { cao, thap }
}
