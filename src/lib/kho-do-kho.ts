// KHO ĐỘ KHÓ — CÂU NÀY ĐÃ CHẠY BAO NHIÊU LƯỢT, ĐÚNG BAO NHIÊU (nguồn N2).
//
// Đặc tả: GOI-LEN-BANG-80-PHUT.md mục 4.2.
//
// Dựng nền một lần bằng cách duyệt `danhSachCa` → `chiTietCa`, cộng dồn theo
// qid. Sau đó CHỈ nạp ca mới — `daDuyet` giữ danh sách ca đã cộng, nên gọi lại
// không cộng đúp.
//
// Đo 10/09 để biết cái kho này sẽ đầy tới đâu: sheet `ChiTietCau` có 3 737 dòng
// / 32 ca / 814 qid khác nhau; 251 qid đạt ≥ 5 lượt, 150 đạt ≥ 10, và ĐÚNG MỘT
// đạt ≥ 30. Chính con số cuối là lý do ngưỡng N2 dùng cận dưới Wilson chứ không
// dùng "≥ 30 lượt" như bản prompt.
//
// Đây là tài sản dùng lại được cho cả Rút đề và Bài tập về nhà, không riêng màn
// Gọi lên bảng.
import type { KhoDoKho, MucKhoDoKho } from './do-kho-cau'
import type { AnswerRecord } from './exam-db'
import { taoChiTietCau } from './chi-tiet-cau'
import { daCoBaiLam, luotMoiNhat, type BanDeCa, type LuotCa } from './du-lieu-len-bang'

export interface KhoDoKhoLuu {
  muc: KhoDoKho
  /** Mã ca đã cộng vào kho — cấm cộng đúp. */
  daDuyet: string[]
  capNhatLuc: string
}

export const KHO_DO_KHO_RONG: KhoDoKhoLuu = { muc: {}, daDuyet: [], capNhatLuc: '' }

/** Cộng kết quả một ca vào kho. Thuần hàm, không đụng mạng — chỗ này là chỗ
 * phép kiểm bám vào. Ca đã cộng rồi thì trả về nguyên bản, không cộng đúp. */
export function gopCaVaoKho(kho: KhoDoKhoLuu, maCa: string, bank: BanDeCa, luot: LuotCa[], luc: string): KhoDoKhoLuu {
  if (kho.daDuyet.includes(maCa)) return kho
  const muc: KhoDoKho = { ...kho.muc }
  // `soCa` đếm theo CA, không theo lượt: một qid hai chục em cùng làm trong một
  // ca vẫn chỉ là MỘT ca. Gom qid của ca vào tập rồi cộng một lần ở cuối.
  const qidCuaCa = new Set<string>()
  for (const l of luotMoiNhat(luot)) {
    if (!daCoBaiLam(l)) continue
    for (const r of taoChiTietCau(bank, maCa, l.sbd, l.dapAn as AnswerRecord, l.giayCau ?? null)) {
      if (!r.qid) continue
      const cu: MucKhoDoKho = muc[r.qid] ?? { soLuot: 0, soDung: 0, soCa: 0 }
      muc[r.qid] = {
        soLuot: cu.soLuot + 1,
        soDung: cu.soDung + (r.dungSai === true ? 1 : 0),
        soCa: cu.soCa ?? 0,
        capNhatLuc: luc,
      }
      qidCuaCa.add(r.qid)
    }
  }
  for (const q of qidCuaCa) muc[q] = { ...muc[q], soCa: (muc[q].soCa ?? 0) + 1 }
  return { muc, daDuyet: [...kho.daDuyet, maCa], capNhatLuc: luc }
}

/** Phân bố cỡ mẫu — dòng báo cáo của ĐỊNH NGHĨA HOÀN THÀNH mục 8.3. */
export function thongKeKho(kho: KhoDoKhoLuu): { soCa: number; soQid: number; ge5: number; ge8: number; ge10: number; ge30: number } {
  const ks = Object.keys(kho.muc)
  const dem = (n: number) => ks.filter((q) => kho.muc[q].soLuot >= n).length
  return { soCa: kho.daDuyet.length, soQid: ks.length, ge5: dem(5), ge8: dem(8), ge10: dem(10), ge30: dem(30) }
}

/** Câu ca này sắp chữa mà kho chưa biết gì — để màn nói thật là N2 đang trống,
 * chứ không im lặng rơi hết về N3. */
export function qidChuaCoLichSu(kho: KhoDoKhoLuu, dsQid: string[]): string[] {
  return dsQid.filter((q) => !kho.muc[q] || kho.muc[q].soLuot === 0)
}
