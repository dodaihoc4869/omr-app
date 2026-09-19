// CHUYỂN TRẠNG THÁI HỒ SƠ TRONG MỘT NGÀY — HÀM THUẦN, dùng cho EXP "lên bậc", "khắc phục xong", mảnh khiên "dạng rời danh sách yếu"
// (DE-XUAT-EXP-MANH-KHIEN-1909.md mục 2 và 4).
//
// Không có luật thứ hai: chỉ PHÁT LẠI sổ bằng đúng `phatLaiSuKien`/`dangYeu` của hồ sơ, hai lần (trước và sau ngày `ngay`), rồi so hai
// trạng thái. Nên "lên bậc", "đạt da_khac_phuc", "dạng yếu" ở đây LUÔN khớp với hồ sơ mà kế hoạch ngày đọc.
//
// Mọi nguồn ghi sổ đều tính (kể cả `game`). Sự kiện có `luc` TRƯỚC mốc phát hành `tu` chỉ là lịch sử: nó có thể nằm trong "trước" nhưng
// không bao giờ sinh khoản (không tính lại EXP quá khứ).
import { dangYeu, phatLaiSuKien, type SuKienDoc, type TraCuuCau } from './ho-so-nam-kt'

export interface ChuyenTrangThai {
  /** qid ĐÚNG trong ngày mà TRƯỚC ngày đó từng sai/trống (đúng định nghĩa `len_bac` của `TIEN_BO_NGAY`). Đã khử trùng, sắp tăng. */
  lenBac: string[]
  /** Câu vừa CHUYỂN sang `da_khac_phuc` trong ngày; `lan` = số lần sai của câu lúc đó (tái phát rồi khắc phục lại → lần mới). */
  khacPhuc: { qid: string; lan: number; luc: string }[]
  /** Dạng vừa RỜI danh sách dạng yếu trong ngày; `lan` = số câu từng sai của dạng lúc đó. */
  dangRoiYeu: { maDang: string; lan: number; luc: string }[]
}

const ms = (iso: string): number => Date.parse(iso) || 0

export function chuyenTrangThaiTrongNgay(ds: readonly SuKienDoc[], tra: TraCuuCau, ngay: string, tu: string | null): ChuyenTrangThai {
  const tuMs = tu ? ms(tu) : 0
  const truocDs = ds.filter((e) => e.ngayVn < ngay || (e.ngayVn === ngay && ms(e.luc) < tuMs))
  const sauDs = ds.filter((e) => e.ngayVn <= ngay)
  const homNay = sauDs.filter((e) => e.ngayVn === ngay && ms(e.luc) >= tuMs)
  if (homNay.length === 0) return { lenBac: [], khacPhuc: [], dangRoiYeu: [] }

  const truoc = phatLaiSuKien(truocDs, tra)
  const sau = phatLaiSuKien(sauDs, tra)
  const cauTruoc = new Map(truoc.cau.map((c) => [c.qid, c]))
  const cauSau = new Map(sau.cau.map((c) => [c.qid, c]))
  const dungSomNhat = new Map<string, string>()
  for (const e of homNay) {
    if (e.ketQua === 1 && (!dungSomNhat.has(e.qid) || ms(e.luc) < ms(dungSomNhat.get(e.qid)!))) dungSomNhat.set(e.qid, e.luc)
  }

  // Lần đúng ĐẦU của câu trong ngày mới là chỗ chuyển bậc: nếu nó nằm TRƯỚC mốc phát hành thì bậc đã lên từ trước mốc, lần đúng sau mốc chỉ là lặp lại.
  const dungTruocMoc = new Set(sauDs.filter((e) => e.ngayVn === ngay && e.ketQua === 1 && ms(e.luc) < tuMs).map((e) => e.qid))
  const lenBac = [...dungSomNhat.keys()]
    .filter((qid) => !dungTruocMoc.has(qid))
    .filter((qid) => truocDs.some((e) => e.qid === qid && e.ngayVn < ngay && (e.ketQua === 0 || e.ketQua === null)))
    .sort()

  const khacPhuc: ChuyenTrangThai['khacPhuc'] = []
  for (const [qid, luc] of [...dungSomNhat].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    const s = cauSau.get(qid)
    if (s?.trangThai === 'da_khac_phuc' && cauTruoc.get(qid)?.trangThai !== 'da_khac_phuc') khacPhuc.push({ qid, lan: s.lanSai, luc })
  }

  const dangTruoc = new Map(truoc.dang.map((d) => [d.maDang, d]))
  const lucCuoiCuaDang = new Map<string, string>()
  for (const e of homNay) {
    const ma = cauSau.get(e.qid)?.maDang
    if (ma && (!lucCuoiCuaDang.has(ma) || ms(e.luc) > ms(lucCuoiCuaDang.get(ma)!))) lucCuoiCuaDang.set(ma, e.luc)
  }
  const dangRoiYeu: ChuyenTrangThai['dangRoiYeu'] = []
  for (const d of sau.dang) {
    const t = dangTruoc.get(d.maDang)
    if (t && dangYeu(t, ngay) && !dangYeu(d, ngay)) {
      dangRoiYeu.push({ maDang: d.maDang, lan: d.soSai, luc: lucCuoiCuaDang.get(d.maDang) ?? homNay[homNay.length - 1]!.luc })
    }
  }
  return { lenBac, khacPhuc, dangRoiYeu }
}
