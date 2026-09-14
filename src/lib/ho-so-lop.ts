// HỒ SƠ ĐẦY ĐỦ CỦA MỘT EM — GỘP BA ĐƯỜNG EM CHẠM VÀO CÂU HỎI.
//
// Thầy chốt 14/09: "lấy tất cả mọi dữ liệu của học sinh, từ bài thi, bài tập
// về nhà, khắc phục câu sai đóng gói lại để phân bổ câu gọi lên bảng cho hợp lý".
//
// BA ĐƯỜNG, KHÔNG ĐƯỜNG NÀO ĐƯỢC BỎ:
//   1. BÀI THI        — `tien_do_hs` (mạnh–yếu theo chuyên đề) và `ban_do_sai`
//                        (TỪNG CÂU em sai, kèm số lần sai và đã chữa hay chưa)
//   2. BÀI TẬP VỀ NHÀ — nằm trong `qid_da_lam`: em làm phiếu BTVN thì qid vào đó
//   3. KHẮC PHỤC CÂU SAI — cũng vào `qid_da_lam`, và câu chữa xong thì
//                        `ban_do_sai.da_chua` bật lên 1
//
// VÌ SAO PHẢI GỘP: gọi em lên bảng mà chỉ nhìn ca vừa thi thì hai kiểu em bị
// xử sai. Em sai câu ấy từ ba ca trước rồi chữa rồi làm lại đúng — gọi lên là
// phí lượt. Em ca này không làm câu ấy nhưng BTVN sai đúng dạng ấy hai lần —
// đó mới là em cần gọi. Cả hai chỉ nhìn thấy khi gộp đủ ba đường.
//
// KHÔNG ĐOÁN: em chưa có dữ liệu gì thì `diemHopCau` trả điểm nền thấp kèm lý
// do "chưa có dữ liệu", chứ không loại em khỏi danh sách — em nào cũng phải có
// cơ hội lên bảng.
import type { CauChua } from './phan-cong'
import { chuanChuyenDe } from './phan-cong'
import { goiHoSoLopLenBang, type HoSoBtvnMayChu, type HoSoLopMayChu } from './exam-api'

export interface CauSaiCuaEm {
  qid: string
  chuyenDe: string
  mucDo: string
  soLanSai: number
  daChua: boolean
  maCa: string
}

export interface HoSoEmDayDu {
  sbd: string
  hoTen: string
  coMat: boolean
  /** Mạnh–yếu cộng dồn theo chuyên đề, đã xếp yếu nhất lên đầu. */
  chuyenDe: { ten: string; soCau: number; soSai: number }[]
  /** Từng câu em sai, mọi ca. */
  cauSai: CauSaiCuaEm[]
  /** Câu em ĐÃ LÀM — gồm cả bài tập về nhà và phiếu khắc phục. */
  daLam: Map<string, number>
  /** Em đã lên bảng mấy lần, câu nào. */
  lenBang: { soLan: number; lanCuoi: string; qids: string[] }
  /** BÀI TẬP VỀ NHÀ, đã quy về từng câu. */
  btvn: HoSoBtvnEm
}

/** BÀI TẬP VỀ NHÀ CỦA MỘT EM sau khi gộp, kèm bảng tra nhanh theo qid. */
export interface HoSoBtvnEm extends HoSoBtvnMayChu {
  /** qid → em làm câu ấy ở nhà ra sao. Không có khoá nghĩa là câu ấy KHÔNG
   * nằm trong bài tập về nhà mấy lượt gần đây — khác hẳn "chưa làm". */
  theoCau: Map<string, KetQuaBtvn>
}

export type KetQuaBtvn = 'dung' | 'sai' | 'chuaLam'

export const BTVN_RONG: HoSoBtvnEm = {
  soCauGiao: 0,
  soDaLam: 0,
  soDung: 0,
  soSai: 0,
  soChuaLam: 0,
  soLuot: 0,
  soLuotDaNop: 0,
  qidDung: [],
  qidSai: [],
  qidChuaLam: [],
  luot: [],
  theoCau: new Map(),
}

/** Chữ hiện cho từng trạng thái. MỘT chỗ duy nhất, để màn hình, bảng copy và
 * tờ máy chiếu không ai tự đặt chữ khác. */
export const CHU_BTVN: Record<KetQuaBtvn, string> = {
  dung: 'về nhà làm ĐÚNG',
  sai: 'về nhà làm SAI',
  chuaLam: 'về nhà CHƯA LÀM',
}

/** Em làm câu này ở nhà ra sao. `null` = câu không nằm trong bài giao về nhà. */
export function btvnCuaCau(em: HoSoEmDayDu, qid: string): KetQuaBtvn | null {
  return em.btvn.theoCau.get(qid) ?? null
}

/** Một dòng tóm tắt bài tập về nhà của em, đúng bốn con số thầy hỏi. */
export function tomTatBtvn(em: HoSoEmDayDu): string {
  const t = em.btvn
  if (t.soCauGiao === 0) return 'chưa có bài tập về nhà nào được giao'
  return `về nhà làm ${t.soDaLam}/${t.soCauGiao} câu · đúng ${t.soDung} · sai ${t.soSai} · chưa làm ${t.soChuaLam}`
}

/** Tỉ lệ sai của em ở một chuyên đề. Chưa có số thì 0,5 — không đoán em giỏi,
 * cũng không đoán em dốt. */
export function tiLeSaiCd(em: HoSoEmDayDu, cd: string): number {
  const c = chuanChuyenDe(cd)
  const t = em.chuyenDe.find((x) => chuanChuyenDe(x.ten) === c)
  return t && t.soCau > 0 ? t.soSai / t.soCau : 0.5
}

/** TRỌNG SỐ GHÉP EM VỚI CÂU. Tổng đúng 1,0 — đổi một số phải bù vào số khác.
 *
 * Xếp theo sức nặng của bằng chứng, nặng nhất trước:
 *   · sai ĐÚNG CÂU ẤY mà CHƯA chữa  — bằng chứng trực tiếp nhất
 *   · yếu chuyên đề của câu           — bằng chứng cộng dồn
 *   · chưa làm câu ấy bao giờ         — gọi lên là dạy mới, không phải dò lại
 *   · ít lên bảng                     — công bằng lượt, không để vài em ôm hết
 */
export const TRONG_SO = {
  BTVN_CHINH_CAU: 0.34,
  SAI_CHINH_CAU: 0.26,
  YEU_CHUYEN_DE: 0.22,
  CHUA_LAM: 0.1,
  IT_LEN_BANG: 0.08,
} as const

/** Câu ấy trong bài tập về nhà thì đáng gọi em lên bảng đến đâu.
 *
 * SAI nặng nhất: em đã ngồi làm, ra kết quả sai — chữa cho em là chữa đúng chỗ
 * em hiểu lệch. CHƯA LÀM nhẹ hơn một chút: cũng là câu em không qua được,
 * nhưng chưa có bằng chứng em hiểu lệch chỗ nào. ĐÚNG thì bằng 0 — gọi em lên
 * làm lại câu em đã làm đúng ở nhà là đốt thời gian bảng của cả lớp. */
export const DIEM_BTVN: Record<KetQuaBtvn, number> = {
  sai: 1,
  chuaLam: 0.8,
  dung: 0,
}

/** Trần số lần lên bảng để quy về thang 0–1. Lên 6 lần trở lên coi như kịch. */
export const TRAN_LAN_LEN_BANG = 6

/**
 * Điểm HỢP giữa một em và một câu, thang 0–1, kèm lý do in ra cho thầy đọc.
 *
 * Đây là chỗ ba đường dữ liệu gặp nhau. Không có đường nào thì phần ấy tính 0,
 * chứ không loại em.
 */
export function diemHopCau(em: HoSoEmDayDu, cau: CauChua): { diem: number; viSao: string } {
  const cd = chuanChuyenDe(cau.chuyenDe)
  const ly: string[] = []

  // 0. BÀI TẬP VỀ NHÀ — bằng chứng mới nhất và đúng câu nhất, vì thầy lấy
  //    CHÍNH tờ đề giao về nhà làm đề gọi lên bảng (thầy chốt 14/09).
  const kqBtvn = btvnCuaCau(em, cau.id)
  const pBtvn = kqBtvn ? DIEM_BTVN[kqBtvn] : 0
  if (kqBtvn) ly.push(CHU_BTVN[kqBtvn])

  // 1. Sai đúng câu ấy. Sai nhiều lần thì nặng hơn, nhưng CHỮA RỒI thì nhẹ đi
  //    hẳn — chữa rồi mà gọi lại là phí lượt của em khác.
  const sai = em.cauSai.find((x) => x.qid === cau.id)
  let pSai = 0
  if (sai) {
    const nang = Math.min(1, sai.soLanSai / 2)
    pSai = sai.daChua ? nang * 0.35 : nang
    ly.push(sai.daChua ? `sai câu này ${sai.soLanSai} lần, đã chữa` : `sai câu này${sai.soLanSai > 1 ? ` ${sai.soLanSai} lần` : ''}`)
  }

  // 2. Yếu chuyên đề của câu.
  const tl = tiLeSaiCd(em, cd)
  const coSo = em.chuyenDe.some((x) => chuanChuyenDe(x.ten) === cd)
  const pYeu = coSo ? tl : 0
  if (coSo && tl >= 0.4) ly.push(`yếu ${cau.chuyenDe} (sai ${Math.round(tl * 100)}%)`)

  // 3. Chưa làm câu ấy bao giờ — gồm cả BTVN và phiếu khắc phục.
  const soLanLam = em.daLam.get(cau.id) ?? 0
  const pChuaLam = soLanLam === 0 ? 1 : 0
  // Có kết quả BTVN của chính câu ấy rồi thì không nói thêm dòng chung chung
  // "đã làm" nữa — hai dòng cùng nói một việc, mà dòng BTVN chính xác hơn.
  if (soLanLam > 0 && !sai && !kqBtvn) ly.push(`đã làm câu này${soLanLam > 1 ? ` ${soLanLam} lần` : ''}`)

  // 4. Ít lên bảng.
  const pIt = 1 - Math.min(1, em.lenBang.soLan / TRAN_LAN_LEN_BANG)
  if (em.lenBang.soLan === 0) ly.push('chưa lên bảng lần nào')

  const diem =
    TRONG_SO.BTVN_CHINH_CAU * pBtvn +
    TRONG_SO.SAI_CHINH_CAU * pSai +
    TRONG_SO.YEU_CHUYEN_DE * pYeu +
    TRONG_SO.CHUA_LAM * pChuaLam +
    TRONG_SO.IT_LEN_BANG * pIt

  return { diem, viSao: ly.length > 0 ? ly.join(' · ') : 'chưa có dữ liệu riêng, gọi để lấy căn cứ' }
}

/** Gộp gói BTVN của máy chủ thành hồ sơ có bảng tra theo qid.
 *
 * Máy chủ đời cũ chưa trả `btvn` — khi ấy trả hồ sơ RỖNG, để màn hình nói
 * "chưa có dữ liệu bài tập về nhà" chứ không dựng số giả. */
export function gopBtvn(t: HoSoBtvnMayChu | undefined): HoSoBtvnEm {
  if (!t) return { ...BTVN_RONG, qidDung: [], qidSai: [], qidChuaLam: [], luot: [], theoCau: new Map() }
  const theoCau = new Map<string, KetQuaBtvn>()
  for (const q of t.qidDung ?? []) theoCau.set(q, 'dung')
  for (const q of t.qidSai ?? []) theoCau.set(q, 'sai')
  for (const q of t.qidChuaLam ?? []) theoCau.set(q, 'chuaLam')
  return {
    soCauGiao: t.soCauGiao ?? 0,
    soDaLam: t.soDaLam ?? 0,
    soDung: t.soDung ?? 0,
    soSai: t.soSai ?? 0,
    soChuaLam: t.soChuaLam ?? 0,
    soLuot: t.soLuot ?? 0,
    soLuotDaNop: t.soLuotDaNop ?? 0,
    qidDung: t.qidDung ?? [],
    qidSai: t.qidSai ?? [],
    qidChuaLam: t.qidChuaLam ?? [],
    luot: t.luot ?? [],
    theoCau,
  }
}

/** Dựng hồ sơ đầy đủ từ gói máy chủ trả về, ghép với danh sách em của buổi. */
export function gopHoSo(
  goi: HoSoLopMayChu,
  dsEm: { sbd: string; hoTen: string; coMat: boolean }[],
): HoSoEmDayDu[] {
  return dsEm.map((e) => {
    const h = goi.em[e.sbd]
    return {
      sbd: e.sbd,
      hoTen: e.hoTen,
      coMat: e.coMat,
      chuyenDe: h?.chuyenDe ?? [],
      cauSai: h?.qidSai ?? [],
      daLam: new Map((h?.qidDaLam ?? []).map((x) => [x.qid, x.soLan])),
      lenBang: h?.lenBang ?? { soLan: 0, lanCuoi: '', qids: [] },
      btvn: gopBtvn(h?.btvn),
    }
  })
}

/** Xin máy chủ hồ sơ cả lớp rồi gộp luôn. Không ném lỗi: mất mạng thì trả hồ
 * sơ rỗng để màn hình vẫn xếp được bằng dữ liệu ca hiện tại, kèm lý do. */
export async function napHoSoLop(
  scriptUrl: string,
  maBiMat: string,
  dsEm: { sbd: string; hoTen: string; coMat: boolean }[],
): Promise<{ hoSo: HoSoEmDayDu[]; loi: string }> {
  const sbd = dsEm.map((e) => e.sbd).filter(Boolean)
  if (sbd.length === 0) return { hoSo: [], loi: 'Chưa có em nào trong buổi' }
  try {
    const goi = await goiHoSoLopLenBang(scriptUrl, maBiMat, sbd)
    return { hoSo: gopHoSo(goi, dsEm), loi: '' }
  } catch (e) {
    return {
      hoSo: gopHoSo({ em: {} }, dsEm),
      loi: e instanceof Error ? e.message : 'Không lấy được hồ sơ lớp từ máy chủ',
    }
  }
}
