// CHẨN ĐOÁN NGUYÊN NHÂN SAI TRƯỚC KHI RÚT CÂU CHỮA.
//
// Đặc tả: RUT-CAU-CHUA-THEO-NGUYEN-NHAN.md, mục "luồng chính".
//
// Hai em cùng sai câu 14 — một em nhầm khái niệm, một em hết giờ khoanh bừa —
// hiện nhận y hệt một bộ câu chữa. Thuốc không khớp bệnh thì rút bao nhiêu cũng
// vô ích. Tệp này dán NHÃN BỆNH cho từng câu sai, rồi `keDon()` kê theo bệnh.
//
// BA CHỐT KHÔNG ĐƯỢC MẤT:
//
//  · DÙNG LẠI `doChum` ở `phan-cau-len-bang.ts`, cấm viết bản thứ hai — hai cách
//    tính lệch nhau là chẩn đoán sai cho MỌI em.
//  · MỞ RỘNG `rutDeChua`, KHÔNG thay nó: `keDon` gom câu sai theo bệnh rồi gọi
//    chính `rutDeChua` một lượt cho mỗi bệnh. Bộ chọn câu đã có phép kiểm riêng,
//    viết bộ thứ hai là mở thêm một mặt trận để sai.
//  · KHÔNG ĐOÁN. Thiếu giây, lớp quá ít em, hay không đủ dấu hiệu thì trả
//    `thieu_du_lieu` / `chua_ro` và rơi về đường rút cũ KÈM lý do hiện ra màn.
import type { ChiTietCauRow } from './exam-api'
import { doChum } from './phan-cau-len-bang'
import {
  BENH_DUOC_KE,
  CAU_HINH_CHAN_DOAN_MAC_DINH,
  type Benh,
  type CauHinhChanDoan,
} from './chan-doan-cau-hinh'

/** Thống kê CỦA CHÍNH MỘT CÂU trong ca — nền để đọc nhanh/chậm/chụm. */
export interface ThongKeMotCau {
  qid: string
  soEmLam: number
  /** Trung vị giây của cả lớp ở câu đó. 0 = không đo được. */
  trungViGiay: number
  /** Phương án SAI mà đông em chọn nhất, và tỉ lệ chụm trong nhóm sai. */
  chumChon: string
  doChum: number
}

export interface KetQuaChanDoan {
  qid: string
  benh: Benh
  /** Câu chữ ngắn nói VÌ SAO ra bệnh ấy — hiện thẳng lên phiếu, không giấu. */
  lyDo: string
  /** Có nên gán nhãn lỗi ở mức TỪNG PHƯƠNG ÁN cho câu này không (câu hỏi ❷ của
   * đặc tả). Cờ hoá để thầy có SỐ mà quyết, thay vì quyết bằng cảm tính. */
  canNhanPhuongAn: boolean
}

/** Trung vị. Mảng rỗng trả 0. */
export function trungVi(xs: number[]): number {
  if (!xs.length) return 0
  const a = [...xs].sort((x, y) => x - y)
  const g = Math.floor(a.length / 2)
  return a.length % 2 ? a[g] : (a[g - 1] + a[g]) / 2
}

/** Tỉ lệ dòng còn giây — cổng CẢ CA. Tách riêng để mỗi app so với ngưỡng của
 * chính nó mà không ai chép lại phép tính. */
export function tiLeCoGiay(rows: Pick<ChiTietCauRow, 'giay'>[]): number {
  if (!rows.length) return 0
  return rows.filter((r) => typeof r.giay === 'number' && (r.giay as number) > 0).length / rows.length
}

/** Dựng thống kê từng câu từ bảng chấm của CẢ LỚP. */
export function thongKeTungCau(rowsCaLop: ChiTietCauRow[]): Map<string, ThongKeMotCau> {
  const theoCau = new Map<string, ChiTietCauRow[]>()
  for (const r of rowsCaLop) {
    if (!r.qid) continue
    const a = theoCau.get(r.qid)
    if (a) a.push(r)
    else theoCau.set(r.qid, [r])
  }
  const ra = new Map<string, ThongKeMotCau>()
  for (const [qid, ds] of theoCau) {
    const sai = ds.filter((r) => r.dungSai !== true)
    const chon = sai.map((r) => (r.dapAnChon || '').trim()).filter(Boolean)
    const dem = new Map<string, number>()
    for (const c of chon) dem.set(c, (dem.get(c) ?? 0) + 1)
    let chumChon = ''
    let nhieuNhat = 0
    for (const [c, n] of dem) if (n > nhieuNhat) [chumChon, nhieuNhat] = [c, n]
    ra.set(qid, {
      qid,
      soEmLam: ds.length,
      trungViGiay: trungVi(ds.map((r) => (typeof r.giay === 'number' ? r.giay : 0)).filter((g) => g > 0)),
      chumChon,
      doChum: doChum(chon),
    })
  }
  return ra
}

function lechSoPhanIII(r: ChiTietCauRow, nguong: number): boolean {
  if (r.phan !== 'III') return false
  const so = (s: string) => {
    const v = Number(String(s ?? '').replace(',', '.').trim())
    return Number.isFinite(v) ? v : null
  }
  const c = so(r.dapAnChon)
  const d = so(r.dapAnDung)
  if (c === null || d === null || d === 0) return false
  return Math.abs(c - d) / Math.abs(d) < nguong
}

export interface BoiCanhChanDoan {
  /** Ca này có đủ giây để đọc luật thời gian không (cổng CẢ CA). */
  caCoGiay: boolean
  /** Tổng số giây em rời màn trong lượt ấy (`LuotThi.TongGiayRoiMan`). */
  giayRoiMan?: number
  /** Số câu sai CÙNG DẠNG của chính em này trong ca. */
  soCauSaiCungDang?: number
  /** Số thứ tự câu lớn nhất trong phần — để biết đâu là vùng cuối bài. */
  soCauCuoiPhan?: number
}

/** CHẨN ĐOÁN MỘT CÂU SAI. Thuần hàm, không mạng, không DOM. */
export function chanDoan(
  row: ChiTietCauRow,
  tk: ThongKeMotCau | undefined,
  bc: BoiCanhChanDoan,
  ch: CauHinhChanDoan = CAU_HINH_CHAN_DOAN_MAC_DINH,
): KetQuaChanDoan {
  const qid = row.qid
  const ra = (benh: Benh, lyDo: string, canNhanPhuongAn = false): KetQuaChanDoan => ({ qid, benh, lyDo, canNhanPhuongAn })

  if (!tk || tk.soEmLam < ch.TOI_THIEU_EM_TINH_CHUM) {
    return ra('thieu_du_lieu', `lớp chỉ có ${tk?.soEmLam ?? 0} em làm câu này, dưới ${ch.TOI_THIEU_EM_TINH_CHUM} thì độ chụm là nhiễu`)
  }

  // Bỏ trống: không cần đồng hồ cũng biết em không ra được đáp án.
  const chon = (row.dapAnChon || '').trim()
  if (!chon) return ra('chua_biet', 'em bỏ trống câu này')

  // ---- hai cổng thời gian ---------------------------------------------------
  const roiManNhieu = typeof bc.giayRoiMan === 'number' && bc.giayRoiMan > ch.GIAY_ROI_MAN_TOI_DA
  const giay = typeof row.giay === 'number' ? row.giay : null
  const dungGio = bc.caCoGiay && !roiManNhieu && giay !== null && tk.trungViGiay > 0

  const chum = tk.doChum
  const trungChum = !!tk.chumChon && chon === tk.chumChon && chum >= ch.CHUM_TI_LE

  if (!dungGio) {
    // Không có đồng hồ thì vẫn còn MỘT tín hiệu thật: phương án em chọn.
    const viSao = roiManNhieu
      ? `em rời màn ${bc.giayRoiMan} giây trong lượt này nên số giây không còn nghĩa`
      : !bc.caCoGiay
        ? 'ca này thiếu số giây làm bài'
        : 'câu này không có số giây'
    if (trungChum) {
      return ra('nham_khai_niem', `em chọn ${chon}, ${Math.round(chum * 100)}% bạn làm sai cũng chọn ${chon} (${viSao}, chẩn đoán chỉ theo phương án)`, true)
    }
    return ra('chua_ro', `${viSao}, và phương án em chọn không trùng đám đông sai`)
  }

  // ---- có đồng hồ: đủ bốn luật của đặc tả -----------------------------------
  const g = giay as number
  const nhanh = g < tk.trungViGiay * ch.NHANH_TI_LE
  const cham = g > tk.trungViGiay * ch.CHAM_TI_LE
  const cuoi =
    typeof bc.soCauCuoiPhan === 'number' && bc.soCauCuoiPhan > 0
      ? row.soCau > bc.soCauCuoiPhan * (1 - ch.VI_TRI_CUOI_BAI)
      : false

  if (nhanh && trungChum) {
    return ra('nham_khai_niem', `em làm ${g} giây (lớp ${tk.trungViGiay}), chọn ${chon} như ${Math.round(chum * 100)}% bạn làm sai`, true)
  }
  if (nhanh && !trungChum && cuoi) {
    return ra('bua_het_gio', `em làm ${g} giây (lớp ${tk.trungViGiay}), phương án rải rác, lại nằm cuối bài`)
  }
  if (cham && lechSoPhanIII(row, ch.LECH_SO_LOI_TINH)) {
    return ra('loi_tinh', `em ra ${chon}, đáp án ${row.dapAnDung} — lệch dưới ${Math.round(ch.LECH_SO_LOI_TINH * 100)}%, làm ${g} giây nên có làm thật`)
  }
  if (cham && (bc.soCauSaiCungDang ?? 0) >= 2) {
    return ra('chua_biet', `em làm ${g} giây (lớp ${tk.trungViGiay}) mà vẫn sai, và sai ${bc.soCauSaiCungDang} câu cùng dạng`)
  }
  if (trungChum) {
    return ra('nham_khai_niem', `em chọn ${chon} như ${Math.round(chum * 100)}% bạn làm sai`, true)
  }
  return ra('chua_ro', 'không đủ dấu hiệu để kết luận — không đoán')
}

/** Bệnh này có được kê câu chữa không. */
export function duocKe(b: Benh): boolean {
  return BENH_DUOC_KE.includes(b)
}
