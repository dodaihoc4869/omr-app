// MÀN CHIẾU ĐIỂM DANH THEO BẬC (đợt 19 · làn Q — bản vẽ docs/ban-ve-dot19/man-chieu-diem-danh.html, thầy duyệt 13/10: "duyệt cả hai giữ xếp theo bậc
// phụ huynh xem được hạng"). PHÉP THUẦN cho bản chiếu A (`BanChieuDiemDanh.tsx`, test tests/man-chieu-dot19-1310q.test.tsx):
//   · thang 12 bậc: số em CÓ MẶT ở mỗi bậc + số em mỗi nhóm (Lười 1–5 · Chưa đều 6–7 · Chăm 8–12) + ô Mới (em chưa xếp bậc);
//   · khối "Bậc cao nhất lớp": em đứng đầu lưới (bậc cao nhất, cùng bậc ⇒ điểm chăm cao hơn) + hai em theo sát phía sau;
//   · thẻ nổi "Vừa điểm danh": câu "Còn N điểm chăm nữa lên Bậc …" (từ `diemLenBac`); bậc cuối nhóm ⇒ câu luật nhóm (thoát Lười 6 ngày liền ·
//     thêm ngày đủ mức để lên Chăm · chuỗi 7 ngày cho bậc 12) — phép thuần sẵn có, không tính lại bậc;
//   · cỡ lưới thẻ theo số em (cột · hàng · thẻ đủ / thẻ gọn).
// Không thêm lệnh máy chủ: mọi số lấy từ `EmBuoi` (= `/gv/buoi-hoc` + `/gv/nhip-hoc` đang gọi). Máy chủ cũ không gửi `bacCham` ⇒ `coBac` = false,
// màn về cách cũ (thẻ tô theo nhóm), không bịa bậc. Tệp chỉ nằm trong khối nạp khi chiếu (bảng 12 tên + ngưỡng điểm không vào tải đầu app thầy).
import { CHUOI_BAC_CAO_NHAT, NGUONG_BAC } from '../../../server/src/bac-cham-chi'
import { ngayDuCanThemDeCham } from '../../../server/src/nhip-hoc-luat'
import { demNhom, gioDd, NGAY_LIEN_THOAT_LUOI, type DemNhom, type EmBuoi } from '../../lib/diem-danh-nhip'
import { demTheoBac, LUAT_NHOM_NHIP } from '../../lib/nhip-hoc-thay'
import { motBac, SO_BAC } from '../bac-cham-chi/bac'

/** Máy chủ có gửi bậc: ít nhất một em của buổi (cả lớp) mang `bacCham`. */
export const coBacBuoi = (ds: readonly Pick<EmBuoi, 'bacCham'>[]): boolean => ds.some((e) => !!e.bacCham)

export interface DemThang {
  /** 12 số: phần tử i = số em có mặt ở bậc i+1. */
  bac: number[]
  /** Số em mỗi nhóm (theo luật nhóm — khớp tổng các bậc của nhóm). */
  nhom: DemNhom
  /** Em có mặt chưa xếp bậc (Mới · chưa có số nhịp học) — ô "Mới" của thang. */
  chuaXep: number
}
/** Đếm cho thang 12 bậc, trên các em có mặt. Thuần. */
export function demThang(coMat: readonly EmBuoi[]): DemThang {
  return { bac: demTheoBac(coMat), nhom: demNhom(coMat), chuaXep: coMat.filter((e) => !e.bacCham).length }
}


export interface DauLop {
  dau: EmBuoi
  /** Tối đa hai em theo sát phía sau (cũng đã xếp bậc). */
  sau: EmBuoi[]
}
/** Khối "Bậc cao nhất lớp" từ lưới ĐÃ XẾP (`luoiDiemDanh`): em đầu tiên có bậc + hai em có bậc kế tiếp. Không em nào có bậc ⇒ null. Thuần. */
export function dauLop(luoi: readonly EmBuoi[]): DauLop | null {
  const coBac = luoi.filter((e) => !!e.bacCham)
  return coBac.length ? { dau: coBac[0]!, sau: coBac.slice(1, 3) } : null
}

/** Ba em điểm danh MUỘN NHẤT (giờ mới nhất) — nhãn "Vừa vào" + viền vàng. Thuần. */
export function emVuaVao(coMat: readonly EmBuoi[], so = 3): Set<string> {
  return new Set(
    coMat
      .filter((e) => !!e.luc)
      .sort((a, b) => (b.luc ?? '').localeCompare(a.luc ?? ''))
      .slice(0, so)
      .map((e) => e.sbd),
  )
}


/** Số trên thẻ một em: chuỗi đủ mức hoặc "Thoát Lười k/6" (em nhóm Lười); Mới ⇒ "Đã có số k/3 ngày". */
export interface SoThe {
  /** Lười ⇒ số ngày đủ mức liền đã có (tối đa 6) để thoát; còn lại null. */
  thoatLuoi: number | null
  chuoi: number
  du: string
}
export function soThe(e: Pick<EmBuoi, 'nhip'>): SoThe | null {
  const n = e.nhip
  if (!n) return null
  return {
    thoatLuoi: n.nhom === 'luoi' ? Math.min(n.chuoiDuGanNhat, NGAY_LIEN_THOAT_LUOI) : null,
    chuoi: n.chuoiDuGanNhat,
    du: `${n.soNgayDu}/${n.soNgayQua}`,
  }
}

export interface LenBac {
  /** Bậc kế (để vẽ huy hiệu đích); đã bậc cao nhất ⇒ null. */
  ke: number | null
  cau: string
  /** Tiến độ 0–1 tới bậc kế (vạch); không đo được bằng một vạch ⇒ null. */
  tien: number | null
  mocTrai: string
  mocPhai: string
}
const ten = (so: number) => motBac(so)?.ten ?? ''
/**
 * Câu "lên bậc kế" của thẻ nổi Vừa điểm danh. Có `diemLenBac` ⇒ "Còn N điểm chăm nữa lên Bậc k · Tên" + vạch giữa hai ngưỡng điểm (`NGUONG_BAC`).
 * `diemLenBac` null (bậc cuối nhóm / bậc 11 chuỗi ngắn / bậc 12) ⇒ câu theo luật nhóm. Em chưa xếp bậc ⇒ null. Thuần.
 */
export function lenBac(e: Pick<EmBuoi, 'bacCham' | 'nhip'>): LenBac | null {
  const b = e.bacCham
  const m = b ? motBac(b.bac) : null
  if (!b || !m) return null
  const chuoi = e.nhip?.chuoiDuGanNhat ?? 0
  if (b.bac >= SO_BAC) return { ke: null, cau: `Bậc cao nhất · giữ chuỗi đủ mức mỗi ngày để giữ Bậc ${SO_BAC}`, tien: null, mocTrai: '', mocPhai: '' }
  const ke = b.bac + 1
  if (b.diemLenBac !== null) {
    const { dau, nguong } = NGUONG_BAC[m.nhom]
    const i = b.bac - dau
    const tu = i > 0 ? nguong[i - 1]! : 0
    const den = nguong[i] ?? b.diem + b.diemLenBac
    return {
      ke,
      cau: `Còn ${b.diemLenBac} điểm chăm nữa lên Bậc ${ke} · ${ten(ke)}`,
      tien: den > tu ? Math.max(0, Math.min(1, (b.diem - tu) / (den - tu))) : null,
      mocTrai: tu > 0 ? `Bậc ${b.bac} từ ${tu} điểm` : `Bậc ${b.bac}`,
      mocPhai: `Bậc ${ke} từ ${den} điểm`,
    }
  }
  if (b.bac === SO_BAC - 1) {
    const k = Math.min(chuoi, CHUOI_BAC_CAO_NHAT)
    return { ke, cau: `Lên Bậc ${ke} · ${ten(ke)} cần chuỗi đủ mức ${CHUOI_BAC_CAO_NHAT} ngày liền`, tien: k / CHUOI_BAC_CAO_NHAT, mocTrai: `Đang có ${k} ngày liền`, mocPhai: `${CHUOI_BAC_CAO_NHAT} ngày liền` }
  }
  if (m.nhom === 'luoi') {
    const k = Math.min(chuoi, LUAT_NHOM_NHIP.ngayLienThoatLuoi)
    return { ke, cau: `Đủ mức ${LUAT_NHOM_NHIP.ngayLienThoatLuoi} ngày liền là thoát Lười, lên Bậc ${ke} · ${ten(ke)}`, tien: k / LUAT_NHOM_NHIP.ngayLienThoatLuoi, mocTrai: `Đang có ${k} ngày liền`, mocPhai: `${LUAT_NHOM_NHIP.ngayLienThoatLuoi} ngày liền` }
  }
  // Chưa đều bậc 7 ⇒ lên Chăm theo luật nhóm (đủ mức ≥ 80% số ngày)
  const n = e.nhip
  const h = n?.homNay
  const can = n ? ngayDuCanThemDeCham(n.soNgayQua, n.soNgayDu, !!h && h.muc > 0 && h.lam >= h.muc) : 0
  return {
    ke,
    cau: can > 0 ? `Thêm ${can} ngày đủ mức nữa là lên Chăm · Bậc ${ke} · ${ten(ke)}` : `Giữ đủ mức mỗi ngày để lên Chăm · Bậc ${ke} · ${ten(ke)}`,
    tien: null,
    mocTrai: '',
    mocPhai: '',
  }
}

/** Câu đọc màn hình + nhãn giờ của em vừa vào ("vừa điểm danh lúc 17:53"). */
export const chuVuaVao = (e: Pick<EmBuoi, 'luc'>): string => {
  const g = gioDd(e.luc)
  return g ? `vừa điểm danh lúc ${g}` : 'vừa điểm danh'
}
