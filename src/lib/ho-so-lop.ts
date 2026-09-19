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

/** Trạng thái một câu trong HỒ SƠ NẮM KIẾN THỨC — đúng bốn giá trị máy chủ ghi ở
 * `nam_kt_cau.trang_thai` (`server/src/ho-so-nam-kt.ts`). */
export type TrangThaiNamKt = 'chua_thay_sai' | 'moi_sai' | 'dang_on' | 'da_khac_phuc'

/** Bậc của em ở một DẠNG: `nam_kt_dang.bac` 0 · 1 · 2. */
export type BacDang = 'biet' | 'hieu' | 'van_dung'

/** HỒ SƠ NẮM KIẾN THỨC CỦA MỘT EM Ở MỘT CÂU — nguyên văn hợp đồng máy chủ
 * (`docs/hop-dong-ho-so-len-bang-1909.md`).
 *
 * Mọi trường đều có giá trị AN TOÀN khi thiếu: `lanSai 0`, `trangThai null`,
 * `canDayLai false`, `bac null`, `dang null` — nghĩa là "không có bằng chứng",
 * và chỗ dùng phải hành xử như máy chủ đời cũ. */
export interface NamKtCauEm {
  /** `nam_kt_cau.lan_sai` — số lần SAI thật (bỏ trống không tính). */
  lanSai: number
  /** `null` = em CHƯA TỪNG gặp câu này (gói chỉ mang bậc/dạng cho câu). */
  trangThai: TrangThaiNamKt | null
  /** Sai ≥ 3 lần mà chưa đúng lại lần nào — rơi khỏi mọi kênh tự động. */
  canDayLai: boolean
  /** Dạng của câu (`game_v2_question.dang`, hoặc `CD:<chuyên đề>`). */
  maDang: string | null
  /** Bậc của em ở DẠNG này, kể cả khi em chưa gặp riêng câu này. */
  bac: BacDang | null
  /** Số liệu `nam_kt_dang` của em ở dạng này. */
  dang: { soGap: number; soDaKhacPhuc: number; soChuaThaySai: number } | null
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
  /** HỒ SƠ NẮM KIẾN THỨC theo qid (GĐ 6, 19/09) — chỉ có khi máy chủ đã hỗ trợ.
   * `undefined` = máy chủ đời cũ: mọi chỗ đọc phải rơi về hành vi cũ. */
  namKt?: Map<string, NamKtCauEm>
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

/** Câu sai nhưng ĐÃ CHỮA thì sức nặng còn bấy nhiêu — chữa rồi mà gọi lại là phí lượt. */
export const HE_SO_DA_CHUA = 0.35

// HAI HẰNG SỐ DƯỚI ĐÂY CHÉP TỪ MÁY CHỦ (`server/src/ho-so-cau-hinh.ts`) — cùng một
// định nghĩa "dạng yếu" cho cả kế hoạch ngày lẫn buổi chữa. Test soi hai bản
// không lệch (`tests/ho-so-lop-nam-kt-1909.test.ts`).
/** Dạng có dưới bấy nhiêu câu đã gặp thì chưa đủ căn cứ kết luận yếu/mạnh. */
export const SO_CAU_DU_TIN_DANG = 4
/** Dạng yếu khi (câu đã khắc phục + câu chưa từng sai) / câu đã gặp thấp hơn mức này. */
export const NGUONG_DANG_YEU = 0.7

/** Hồ sơ nắm kiến thức của em ở một câu, hoặc `null` (máy chủ cũ / em chưa có dòng nào). */
export function namKtCuaCau(em: HoSoEmDayDu, qid: string): NamKtCauEm | null {
  return em.namKt?.get(qid) ?? null
}

/** Em này SAI ≥ 3 lần câu ấy mà chưa đúng lại lần nào — câu đó phải được dạy lại. */
export function canDayLaiCau(em: HoSoEmDayDu, qid: string): boolean {
  return namKtCuaCau(em, qid)?.canDayLai === true
}

/** Tên dạng để in: mã dạng thật, còn `CD:<chuyên đề>` (dạng thiếu mã) thì chỉ in chuyên đề. */
function tenDang(maDang: string | null): string {
  return maDang ? maDang.replace(/^CD:/, '') : 'của câu này'
}

/** Vì sao em này KHÔNG được nhận câu này lên bảng, hoặc `null` nếu được.
 *
 * CHẶN CỨNG (thầy chốt 19/09): em còn ở bậc "biết" của dạng nào thì không nhận
 * câu 2 sao (vận dụng) của dạng ấy — vấp công khai trước cả lớp ở câu quá tầm
 * là dạy hỏng chứ không phải dạy thêm. Chưa có bậc (máy chủ cũ, hoặc em chưa có
 * dòng dạng) thì KHÔNG chặn: không đoán em yếu. */
export function lyDoChanCau(em: HoSoEmDayDu, cau: CauChua): string | null {
  if (cau.sao !== 2) return null
  const nk = namKtCuaCau(em, cau.id)
  if (nk?.bac !== 'biet') return null
  return `em còn ở bậc "biết" của dạng ${tenDang(nk.maDang)} — chưa nhận câu 2 sao`
}

/** Tỉ lệ câu của DẠNG em chưa khắc phục xong (0–1), hoặc `null` khi chưa đủ mẫu.
 * Đúng phần bù của định nghĩa "dạng yếu" ở máy chủ: (đã khắc phục + chưa từng sai) / đã gặp. */
function tiLeYeuDang(nk: NamKtCauEm | null): number | null {
  const d = nk?.dang
  if (!d || d.soGap < SO_CAU_DU_TIN_DANG) return null
  const on = Math.min(1, Math.max(0, (d.soDaKhacPhuc + d.soChuaThaySai) / d.soGap))
  return 1 - on
}

/**
 * Điểm HỢP giữa một em và một câu, thang 0–1, kèm lý do in ra cho thầy đọc.
 *
 * Đây là chỗ ba đường dữ liệu gặp nhau. Không có đường nào thì phần ấy tính 0,
 * chứ không loại em.
 *
 * Từ 19/09 còn đọc HỒ SƠ NẮM KIẾN THỨC (`em.namKt`) khi máy chủ có: số lần sai
 * thật, đã khắc phục hay chưa, dạng yếu. Không có thì đúng công thức cũ.
 *
 * `chan` có nghĩa là em này KHÔNG được nhận câu này (xem `lyDoChanCau`) — chỗ
 * chọn em phải bỏ qua, điểm vẫn trả để in cho thầy nếu cần. `dayLai` = câu này
 * là câu em đã sai ≥ 3 lần mà chưa đúng lại.
 */
export function diemHopCau(
  em: HoSoEmDayDu,
  cau: CauChua,
): { diem: number; viSao: string; chan?: string; dayLai?: boolean } {
  const cd = chuanChuyenDe(cau.chuyenDe)
  const ly: string[] = []
  const nk = namKtCuaCau(em, cau.id)

  // 0. BÀI TẬP VỀ NHÀ — bằng chứng mới nhất và đúng câu nhất, vì thầy lấy
  //    CHÍNH tờ đề giao về nhà làm đề gọi lên bảng (thầy chốt 14/09).
  const kqBtvn = btvnCuaCau(em, cau.id)
  const pBtvn = kqBtvn ? DIEM_BTVN[kqBtvn] : 0
  if (kqBtvn) ly.push(CHU_BTVN[kqBtvn])

  // 1. Sai đúng câu ấy. Sai nhiều lần thì nặng hơn, nhưng CHỮA RỒI thì nhẹ đi
  //    hẳn — chữa rồi mà gọi lại là phí lượt của em khác.
  //
  //    Em đã có dòng hồ sơ nắm thì HỒ SƠ THẮNG bản đồ sai cũ: `ban_do_sai.so_lan_sai`
  //    không bao giờ tăng quá 1 nên pSai từng kẹt ở 0,5 với mọi em.
  let pSai = 0
  let dayLai = false
  let coDongSai = false // đã in một dòng "sai câu này…" — để bước 3 không nói thêm "đã làm"
  if (nk && nk.trangThai !== null) {
    if (nk.lanSai > 0) {
      coDongSai = true
      const nang = Math.min(1, nk.lanSai / 2)
      const daChua = nk.trangThai === 'da_khac_phuc'
      pSai = daChua ? nang * HE_SO_DA_CHUA : nang
      if (nk.canDayLai) {
        dayLai = true
        ly.push(`câu cần dạy lại (sai ${nk.lanSai} lần, chưa đúng lại lần nào)`)
      } else {
        ly.push(daChua ? `sai câu này ${nk.lanSai} lần, đã khắc phục` : `sai câu này${nk.lanSai > 1 ? ` ${nk.lanSai} lần` : ''}`)
      }
    }
  } else {
    const sai = em.cauSai.find((x) => x.qid === cau.id)
    if (sai) {
      coDongSai = true
      const nang = Math.min(1, sai.soLanSai / 2)
      pSai = sai.daChua ? nang * HE_SO_DA_CHUA : nang
      ly.push(sai.daChua ? `sai câu này ${sai.soLanSai} lần, đã chữa` : `sai câu này${sai.soLanSai > 1 ? ` ${sai.soLanSai} lần` : ''}`)
    }
  }

  // 2. Yếu chuyên đề của câu — hoặc yếu DẠNG khi hồ sơ nắm có đủ mẫu (chính xác
  //    hơn: dạng nhỏ hơn chuyên đề, và tính cả câu đã khắc phục).
  const tl = tiLeSaiCd(em, cd)
  const coSo = em.chuyenDe.some((x) => chuanChuyenDe(x.ten) === cd)
  const yeuDang = tiLeYeuDang(nk)
  let pYeu: number
  if (yeuDang !== null && nk?.dang) {
    pYeu = yeuDang
    if (1 - yeuDang < NGUONG_DANG_YEU) {
      const con = nk.dang.soGap - nk.dang.soDaKhacPhuc - nk.dang.soChuaThaySai
      ly.push(`yếu dạng ${tenDang(nk.maDang)} (còn ${con}/${nk.dang.soGap} câu chưa khắc phục)`)
    }
  } else {
    pYeu = coSo ? tl : 0
    if (coSo && tl >= 0.4) ly.push(`yếu ${cau.chuyenDe} (sai ${Math.round(tl * 100)}%)`)
  }

  // 3. Chưa làm câu ấy bao giờ — gồm cả BTVN và phiếu khắc phục.
  const soLanLam = em.daLam.get(cau.id) ?? 0
  const pChuaLam = soLanLam === 0 ? 1 : 0
  // Có kết quả BTVN của chính câu ấy rồi thì không nói thêm dòng chung chung
  // "đã làm" nữa — hai dòng cùng nói một việc, mà dòng BTVN chính xác hơn.
  if (soLanLam > 0 && !coDongSai && !kqBtvn) ly.push(`đã làm câu này${soLanLam > 1 ? ` ${soLanLam} lần` : ''}`)

  // 4. Ít lên bảng.
  const pIt = 1 - Math.min(1, em.lenBang.soLan / TRAN_LAN_LEN_BANG)
  if (em.lenBang.soLan === 0) ly.push('chưa lên bảng lần nào')

  // 5. Vùng phát triển gần ZPD: ưu tiên em vấp ngã nhưng câu hỏi đúng tầm với để tiến bộ (chỉ tính khi có số liệu)
  let pZpd = 0
  if (coSo) {
    if (cau.sao === 2) {
      if (tl >= 0.2 && tl <= 0.65) {
        pZpd = 0.08
        ly.push('đúng vùng ZPD bứt phá')
      } else if (tl > 0.65) {
        ly.push('cần thầy hướng dẫn bước chốt')
      }
    } else if (cau.sao === 0) {
      if (tl >= 0.4) {
        pZpd = 0.08
        ly.push('vừa sức củng cố nền tảng')
      }
    } else {
      // 1 sao
      if (tl >= 0.2 && tl <= 0.6) {
        pZpd = 0.05
        ly.push('vừa nấc rèn luyện kỹ năng')
      }
    }
  }

  const diem =
    TRONG_SO.BTVN_CHINH_CAU * pBtvn +
    TRONG_SO.SAI_CHINH_CAU * pSai +
    TRONG_SO.YEU_CHUYEN_DE * pYeu +
    TRONG_SO.CHUA_LAM * pChuaLam +
    TRONG_SO.IT_LEN_BANG * pIt +
    pZpd

  const kq: { diem: number; viSao: string; chan?: string; dayLai?: boolean } = {
    diem,
    viSao: ly.length > 0 ? ly.join(' · ') : 'chưa có dữ liệu riêng, gọi để lấy căn cứ',
  }
  const chan = lyDoChanCau(em, cau)
  if (chan) kq.chan = chan
  if (dayLai) kq.dayLai = true
  return kq
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

const TRANG_THAI_NAM_KT: ReadonlySet<string> = new Set(['chua_thay_sai', 'moi_sai', 'dang_on', 'da_khac_phuc'])
const BAC_DANG: ReadonlySet<string> = new Set(['biet', 'hieu', 'van_dung'])
const soDem = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0)

/** Đọc `namKt` của một em trong gói máy chủ. KHÔNG tin kiểu dữ liệu: trường lạ
 * hoặc sai kiểu rơi về giá trị "không có bằng chứng", để một dòng hỏng không thể
 * chặn nhầm một em hay làm câu bị đẩy vào danh sách dạy lại.
 *
 * `undefined` vào ⇒ `undefined` ra (máy chủ đời cũ — chỗ dùng rơi về hành vi
 * cũ). `{}` vào ⇒ Map rỗng (máy chủ mới, em chưa có dòng nào). */
export function gopNamKt(raw: unknown): Map<string, NamKtCauEm> | undefined {
  if (raw === undefined || raw === null || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const ra = new Map<string, NamKtCauEm>()
  for (const [qid, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!qid || !v || typeof v !== 'object') continue
    const o = v as Record<string, unknown>
    const d = o.dang && typeof o.dang === 'object' ? (o.dang as Record<string, unknown>) : null
    const soGap = d ? soDem(d.soGap) : 0
    ra.set(qid, {
      lanSai: soDem(o.lanSai),
      trangThai: typeof o.trangThai === 'string' && TRANG_THAI_NAM_KT.has(o.trangThai) ? (o.trangThai as TrangThaiNamKt) : null,
      canDayLai: o.canDayLai === true,
      maDang: typeof o.maDang === 'string' && o.maDang ? o.maDang : null,
      bac: typeof o.bac === 'string' && BAC_DANG.has(o.bac) ? (o.bac as BacDang) : null,
      dang: d && soGap > 0 ? { soGap, soDaKhacPhuc: soDem(d.soDaKhacPhuc), soChuaThaySai: soDem(d.soChuaThaySai) } : null,
    })
  }
  return ra
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
      namKt: gopNamKt(h?.namKt),
    }
  })
}

/** Xin máy chủ hồ sơ cả lớp rồi gộp luôn. Không ném lỗi: mất mạng thì trả hồ
 * sơ rỗng để màn hình vẫn xếp được bằng dữ liệu ca hiện tại, kèm lý do. */
export async function napHoSoLop(
  scriptUrl: string,
  maBiMat: string,
  dsEm: { sbd: string; hoTen: string; coMat: boolean }[],
  /** Các câu của buổi chữa — máy chủ trả hồ sơ nắm kiến thức của từng em Ở ĐÚNG NHỮNG CÂU NÀY
   * (kể cả bậc dạng cho câu em chưa gặp). Thiếu thì máy chủ không trả `namKt`. */
  dsQid?: string[],
): Promise<{ hoSo: HoSoEmDayDu[]; loi: string }> {
  const sbd = dsEm.map((e) => e.sbd).filter(Boolean)
  if (sbd.length === 0) return { hoSo: [], loi: 'Chưa có em nào trong buổi' }
  try {
    const goi = await goiHoSoLopLenBang(scriptUrl, maBiMat, sbd, undefined, dsQid)
    return { hoSo: gopHoSo(goi, dsEm), loi: '' }
  } catch (e) {
    return {
      hoSo: gopHoSo({ em: {} }, dsEm),
      loi: e instanceof Error ? e.message : 'Không lấy được hồ sơ lớp từ máy chủ',
    }
  }
}
