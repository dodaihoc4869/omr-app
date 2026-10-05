// OMNI 3 — P VI KỸ NĂNG (BKT hội qua cổng AND có nhiễu) + SƠ Ý RIÊNG + TỐC ĐỘ RIÊNG + KHUNG GIỜ + SPRT. LÕI THUẦN.
// ⚠ STUB HỢP ĐỒNG (phiên điều phối viết 05/10): chữ ký + doc là HỢP ĐỒNG; agent "Lõi thuần" thay phần thân bằng bản thật + test.
// Đặc tả: DAC-TA-BUILD-OMNI-3-0510.md mục 4.1–4.4; công thức đã chạy trong docs/omni-0510/mo-phong-chac-8.mjs (hàm capNhat).
import { CAC_KHUNG_GIO, PHIEN_BAN_OMNI, THAM_SO_OMNI, type HoSoOmniEm, type HoSoVkn, type QCau, type SuKienOmni, type ThamSoOmni, type XacNhanThay } from './omni-kieu'

/**
 * Cập nhật Bayes HỘI cho các vi kỹ năng `kn` của MỘT quan sát (cổng AND: đúng cần ĐỦ mọi kỹ năng), rồi bước học T.
 *   pall = Π P[k]; pc = pall(1−s) + (1−pall)g
 *   đúng: P[k]' = P[k]·((1−s)·pKhac + g·(1−pKhac))/pc ; sai: P[k]' = P[k]·(s·pKhac + (1−g)(1−pKhac))/(1−pc), pKhac = pall/P[k]
 *   kẹp [P_MIN, P_MAX] rồi P'' = P' + (1−P')·T. Kỹ năng không có trong P ⇒ dùng P0. Trả object MỚI (không sửa đầu vào).
 */
export function capNhatHoi(P: Readonly<Record<string, number>>, kn: readonly string[], dung: boolean, g: number, s: number, T: number, ts: ThamSoOmni = THAM_SO_OMNI): Record<string, number> {
  void g; void s
  const moi: Record<string, number> = { ...P }
  for (const k of kn) moi[k] = Math.min(ts.P_MAX, Math.max(ts.P_MIN, (P[k] ?? ts.P0) + (dung ? T : -T)))
  return moi
}

export interface DauVaoPhatLai {
  suKien: readonly SuKienOmni[]
  /** Ma trận Q theo qid gốc. Câu không có trong map ⇒ bỏ qua sự kiện (không bịa vi kỹ năng). */
  q: ReadonlyMap<string, QCau>
  /** β câu = ln(ms) trung vị của lớp (omni_beta_cau). Vắng ⇒ nơi tính tốc độ dùng ước lượng theo phần × mức. */
  beta?: ReadonlyMap<string, number>
  xacNhan?: readonly XacNhanThay[]
  /** Prior theo vi kỹ năng (ca mở màn của em / prior lớp). Vắng ⇒ THAM_SO_OMNI.P0. */
  p0?: ReadonlyMap<string, number>
  /** Ngày VN "hôm nay" (đếm lượt lướt hôm nay). */
  homNay: string
  /** Bài (khoá) của câu trong phạm vi DẠY HỌC — để đếm "câu chưa gặp từ BÀI KHÁC" khi xét chuyển giao. */
  baiCuaQid?: ReadonlyMap<string, string>
  ts?: ThamSoOmni
}

/**
 * PHÁT LẠI TẤT ĐỊNH sổ của MỘT em ⇒ hồ sơ OMNI. Luật (đặc tả 4.1–4.4):
 *  · Sắp (receivedAt, khoa) tăng. Bỏ: purpose 'xem_loi_giai'/'luot', ketQua null, assistance khác 'none' (lượt có hỗ trợ không là quan sát).
 *  · MỘT quan sát / câu / ngày VN: lần độc lập ĐẦU TIÊN trong ngày (làm lại cùng ngày không đổi sai thành đúng).
 *  · Phần II có `y` ⇒ MỖI Ý là một quan sát trên `vknY[i]` với G.Y; không có `y` ⇒ một quan sát cả câu trên `vkn` với G.II_CA_CAU.
 *  · Trước khi cập nhật: nếu mọi vi kỹ năng cần có P ≥ P_VUNG_DO_SO_Y ⇒ lượt VỮNG: nVung++, sai ⇒ nSaiVung++ (chắc-mà-sai ⇒ +2).
 *    sEm = (nSaiVung + S0·S_AO)/(nVung + S_AO) — dùng sEm HIỆN TẠI cho mọi lần cập nhật sau.
 *  · Đúng + tuTin 'chua_chac' ⇒ g nhân 2 (kẹp ≤ 0,5) cho quan sát đó (nghi đoán).
 *  · SPRT mỗi vi kỹ năng (omni-sprt.ts); nTroiChay đếm lượt đúng nhanTocDo 'troi_chay'; nCauLaDung đếm câu chưa gặp thuộc bài KHÁC bài của
 *    đa số câu đã làm ở vi kỹ năng ấy, làm đúng lần đầu.
 *  · Xác nhận thầy: 'vung' ⇒ P = XAC_NHAN.vung cho mọi vi kỹ năng của dạng + điểm SPRT ≥ ngưỡng; 'day_lai' ⇒ P = XAC_NHAN.dayLai, dayLai = true
 *    (hết khi có lượt đúng tự làm sau đó).
 *  · τ = trung vị (β − ln ms) trên TAU_SO_MAU lượt đúng tự làm gần nhất có ms, co về 0 bằng TAU_MAU_AO mẫu ảo.
 *  · khungGio: đếm lượt thật + lượt "sơ ý" (lướt + chắc-mà-sai) theo khungGioCua(receivedAt). luotHomNay = số dòng purpose 'luot' ngày homNay.
 */
export function phatLaiEm(sbd: string, dv: DauVaoPhatLai): HoSoOmniEm {
  const ts = dv.ts ?? THAM_SO_OMNI
  const vkn: Record<string, HoSoVkn> = {}
  const khungGio = Object.fromEntries(CAC_KHUNG_GIO.map((k) => [k, { n: 0, soY: 0 }])) as HoSoOmniEm['khungGio']
  return { sbd, vkn, sEm: ts.S0, nVung: 0, nSaiVung: 0, tau: 0, nTau: 0, khungGio, luotHomNay: dv.suKien.filter((e) => e.purpose === 'luot' && e.ngayVn === dv.homNay).length, cursor: '', phienBan: PHIEN_BAN_OMNI }
}

/** P nắm của một tập vi kỹ năng (cổng AND) = Π P; vi kỹ năng chưa có hồ sơ ⇒ P0. */
export function pAnd(hs: Pick<HoSoOmniEm, 'vkn'>, kn: readonly string[], ts: ThamSoOmni = THAM_SO_OMNI): number {
  return kn.reduce((s, k) => s * (hs.vkn[k]?.p ?? ts.P0), 1)
}
