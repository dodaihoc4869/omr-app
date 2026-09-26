// RÚT CÂU BÀI TẬP VỀ NHÀ LÊN BẢNG — LÕI THUẦN (thầy chốt 25/09/2026).
//
// Thầy lệnh: "chọn đủ số câu chữa sao cho PHỦ HẾT kiến thức số câu đã giao về nhà … tính toán cả lớp sai nhiều nhất,
// rồi sai nhiều tiếp theo … để chữa được tất cả những câu sai … sau đó chọn những câu khó mà ít học sinh làm được
// nhất, những câu cốt tủy … Sử dụng dữ liệu cá nhân của từng học sinh để phân công học sinh đó lên bảng … tổng số
// học sinh có em được gọi nhiều lượt, có em được gọi 1 lượt, sắp xếp ngẫu nhiên phù hợp … tổng số câu sao cho chữa
// trong 90 phút phải đạt được 80 % các câu lọc ra."
//
// BA VIỆC, BA HÀM — tất cả THUẦN, TẤT ĐỊNH (không IO, không đồng hồ, không `Math.random`):
//   1. `xepUuTienCau`     — xếp TOÀN BỘ câu BTVN theo thứ tự ưu tiên của thầy (sai nhiều → sai ít → khó ít em làm được
//                            → cốt tủy). KHÔNG cắt bớt câu sai nào ở bước này (phủ hết).
//   2. `ruiCauLenBang`    — nhét câu theo thứ tự ấy vào ngân sách buổi: nhóm CHỮA (gọi em lên bảng) + nhóm ĐỌC ĐÁP ÁN
//                            (chiếu máy chiếu), và KHOÁ SÀN 80 %: số câu CHỮA ≥ 80 % số câu LỌC RA.
//   3. `phanBoLuotEm`     — phân công em: mọi em có mặt đều được ≥ 1 lượt (nếu đủ câu), câu dư phát thêm lượt CÂN BẰNG,
//                            giữa các em ngang nhau thì bốc thăm bằng SEED tất định (thầy mở lại y nguyên bảng cũ).
//
// VÌ SAO KHÔNG NHẬP VAI "XẾP 90 PHÚT" SẴN CÓ (`xep-buoi-chua.ts`): bản ấy là ENGINE phân tầng chữa/đọc-đáp-án + chấm
// em theo nấc sư phạm, nhận câu đã LỌC SẴN. Ở đây là tầng LỌC MỚI của thầy: chọn câu theo phủ + ưu tiên, và ràng buộc
// 80 %. Hai tầng nối nhau: `ruiCauLenBang` trả `chua`/`docDapAn`, màn hình đưa tiếp vào Engine cũ.
//
// KHÔNG BỊA SỐ: thiếu dữ liệu thì nói thiếu (`canhBao`), không tự chế câu/em. Câu TỰ LUẬN không thuộc phận hàm này —
// lọc trước khi gọi (một định nghĩa chung `cau-tu-luan.ts`).
import { hashSeed, mulberry32 } from './exam-shuffle'
import { CAU_HINH_LEN_BANG_MAC_DINH, nganSachGiay, type CauHinhLenBang } from './len-bang-cau-hinh'
import { giayBienGhepDoi, thoiGianCau, type NoiDungCau, type PhanCau } from './thoi-gian-len-bang'

export const RUI_CAU_BTVN = {
  /** SÀN CỦA THẦY: nhóm CHỮA phải chiếm ÍT NHẤT bấy nhiêu phần trong số câu LỌC RA. */
  TI_LE_CHUA_TOI_THIEU: 0.8,
  /** Trần số câu đưa vào buổi (chữa + đọc đáp án). Bài giao 200 câu cũng không kéo buổi dài vô tận;
   * câu vượt trần bị cắt và ĐẾM (`cauBiCat`) để thầy biết, KHÔNG im lặng bỏ. */
  SO_CAU_TOI_DA: 60,
  /** "Câu KHÓ ít em làm được": tỉ lệ ĐÚNG dưới mức này (hoặc không em nào làm đúng) — thầy chốt ưu tiên
   * nhóm này SAU khi đã phủ hết câu sai. */
  NGUONG_KHO_IT_LAM_DUOC: 0.5,
} as const

/** Phần của đề. Chỉ ba giá trị — cùng `PhanCau` của `thoi-gian-len-bang.ts`. */
export type Phan = PhanCau

/** MỘT CÂU của bài giao về nhà, kèm thống kê LỚP đã làm câu ấy. */
export interface CauVaoRui {
  qid: string
  /** Dạng (`btvn_cau.dang` hoặc `game_v2_question.dang`); rỗng thì xếp theo qid. */
  dang: string
  chuyenDe: string
  phan: Phan
  sao: 0 | 1 | 2
  /** Câu CỐT TỦY của bài (`btvn_cau.loi = 1`) — hiểu bản chất của bài giao. */
  loi: boolean
  /** Số em ĐÃ LÀM câu này (có kết quả đúng/sai). */
  soEmLam: number
  /** Số em LÀM SAI câu này. */
  soEmSai: number
  /** Số em làm ĐÚNG câu này. */
  soEmDung: number
  /** Bậc của câu trong kho (0 = dễ … 2 = vận dụng). Dùng khi thiếu `sao`. */
  noiDung?: NoiDungCau
  /** HỆ SỐ HIỆU CHỈNH giờ theo mẫu giây THẬT (M6, `hieu-chinh-giay-thuc.ts`) — nhân cả ba thành phần thời gian.
   * Thiếu / không hợp lệ ⇒ 1. Luật mới KHÔNG bỏ M6: đường CA truyền vào, đường BTVN bỏ trống. */
  heSo?: number
}

/** Một câu đã xếp vào buổi, kèm số giây và lý do đọc được cho thầy. */
export interface CauXep {
  qid: string
  dang: string
  phan: Phan
  sao: 0 | 1 | 2
  loi: boolean
  soEmLam: number
  soEmSai: number
  soEmDung: number
  /** Giây câu này tốn trong buổi (`giayBienGhepDoi` của `thoiGianCau`). */
  giay: number
  /** Lý do bằng SỐ THẬT ("9/24 em làm sai · câu cốt tủy"). */
  lyDo: string
  /** Vì sao câu này được chọn — để đếm và hiện cho thầy. */
  nguon: 'sai_nhieu' | 'kho_it_lam_duoc' | 'cot_tuy' | 'con_lai'
}

// ══════════════════════════ 1 · XẾP ƯU TIÊN (phủ hết — KHÔNG cắt câu sai) ══════════════════════════

/** Tầng ưu tiên của một câu (0 = cả lớp sai · 1 = khó ít em làm được · 2 = cốt tủy · 3 = còn lại). */
export function tangUuTien(c: CauVaoRui): 0 | 1 | 2 | 3 {
  if (c.soEmSai > 0) return 0
  if (c.soEmLam === 0 || c.soEmDung / c.soEmLam < RUI_CAU_BTVN.NGUONG_KHO_IT_LAM_DUOC) return 1
  if (c.loi) return 2
  return 3
}

/** Nguồn của câu — thầy đọc bảng biết vì sao câu ấy có mặt. */
export function nguonCau(c: CauVaoRui): CauXep['nguon'] {
  const t = tangUuTien(c)
  return t === 0 ? 'sai_nhieu' : t === 1 ? 'kho_it_lam_duoc' : t === 2 ? 'cot_tuy' : 'con_lai'
}

/**
 * XẾP TOÀN BỘ câu BTVN theo thứ tự ưu tiên của thầy — TẤT ĐỊNH, KHÔNG cắt câu nào:
 *   1. Câu cả lớp SAI trước (sai NHIỀU NHẤT → sai nhiều tiếp theo).
 *   2. Rồi câu KHÓ ÍT EM LÀM ĐƯỢC NHẤT (số em làm đúng tăng dần).
 *   3. Rồi câu CỐT TỦY (hiểu bản chất bài giao). 4. Còn lại.
 * Phá hoà theo `loi` → `sao` → `qid`: gọi hai lần ra đúng một thứ tự.
 */
export function xepUuTienCau(cau: readonly CauVaoRui[]): CauVaoRui[] {
  return [...cau].sort(
    (a, b) =>
      tangUuTien(a) - tangUuTien(b) ||
      b.soEmSai - a.soEmSai ||
      a.soEmDung - b.soEmDung ||
      (a.loi === b.loi ? 0 : a.loi ? -1 : 1) ||
      b.sao - a.sao ||
      (a.qid < b.qid ? -1 : a.qid > b.qid ? 1 : 0),
  )
}

// ══════════════════════════ 2 · RÚT CÂU (ngân sách + KHOÁ SÀN 80 %) ══════════════════════════

export interface KetQuaRuiCau {
  /** Câu CHỮA — gọi em lên bảng, theo đúng thứ tự ưu tiên. */
  chua: CauXep[]
  /** Câu chỉ ĐỌC ĐÁP ÁN — chiếu máy chiếu, ưu tiên thấp hơn. */
  docDapAn: CauXep[]
  /** Câu KHÔNG đưa vào buổi (vượt sức chứa; câu SAI nằm đây là điều phải báo). */
  boQua: CauXep[]
  /** Số câu LỌC RA = `chua + docDapAn`. */
  soCauLocRa: number
  /** Số câu CHỮA / số câu LỌC RA. */
  tiLeChua: number
  /** Đạt sàn của thầy (`TI_LE_CHUA_TOI_THIEU`). */
  dat80: boolean
  /** Giây cần THÊM để CHỮA hết những câu cả lớp sai còn nằm ngoài nhóm chữa (0 = đủ). */
  thieuGiay: number
  tongGiay: number
  nganSach: number
  /** Số câu bị cắt vì vượt trần `SO_CAU_TOI_DA` (báo thầy, không im lặng). */
  cauBiCat: number
  /** Lời thật cho thầy — chỉ những điều cần hành động. */
  canhBao: string[]
}

/** Giây một câu tốn trong buổi — CÙNG công thức với `buoi-chua-de-xuat.ts` và Engine E. */
function giayCau(c: CauVaoRui, ch: CauHinhLenBang): number {
  const tiLeLopSai = c.soEmLam > 0 ? c.soEmSai / c.soEmLam : 0
  return giayBienGhepDoi(thoiGianCau({ phan: c.phan, sao: c.sao, noiDung: c.noiDung, tiLeLopSai, heSo: c.heSo }, ch))
}

function lyDoCau(c: CauVaoRui): string {
  const phan: string[] = []
  if (c.soEmSai > 0) phan.push(`${c.soEmSai}/${c.soEmLam} em làm sai`)
  else if (c.soEmLam > 0) phan.push(`${c.soEmDung}/${c.soEmLam} em làm đúng`)
  else phan.push('chưa em nào làm')
  if (c.loi) phan.push('câu cốt tủy')
  return phan.join(' · ')
}

/** Tuỳ chọn cho `ruiCauLenBang`. */
export interface TuyChonRuiCau {
  /** BỎ trần `SO_CAU_TOI_DA` + BỎ ngân sách: CHỮA HẾT mọi câu ưu tiên (sai-nhiều → khó → cốt-tủy);
   *  câu "còn lại" (dễ, cả lớp làm đúng) chỉ ĐỌC ĐÁP ÁN. Dùng cho nút "Xếp giờ & phân công" của thầy —
   *  gọi liên tục tới hết, không cắt câu nào. Thẻ "Buổi chữa tối nay" KHÔNG bật cờ này. */
  het?: boolean
}

/**
 * RÚT CÂU BTVN LÊN BẢNG. Tất định; mọi câu SAI đều vào `xepUuTienCau` trước, không bỏ ở bước xếp.
 *   · Nhóm CHỮA = nhét theo thứ tự ưu tiên tới khi đầy ngân sách (`nganSachGiay`).
 *   · Nhóm LỌC RA = chữa + đọc-đáp-án, và nhỏ sao cho `chữa ≥ 80 %` số lọc ra (sàn của thầy).
 *   · Câu SAI không chữa được trong ngân sách ⇒ VÀO `docDapAn`/`boQua` và BÁO `thieuGiay` — không im lặng.
 *   · `tuyChon.het` ⇒ BỎ trần + ngân sách: mọi câu ưu tiên vào CHỮA, "còn lại" chỉ đọc đáp án.
 */
export function ruiCauLenBang(
  cau: readonly CauVaoRui[],
  ch: CauHinhLenBang = CAU_HINH_LEN_BANG_MAC_DINH,
  tuyChon: TuyChonRuiCau = {},
): KetQuaRuiCau {
  const D = RUI_CAU_BTVN
  const nganSach = nganSachGiay(ch)
  const canhBao: string[] = []

  const xep: CauXep[] = xepUuTienCau(cau).map((c) => ({
    qid: c.qid,
    dang: c.dang,
    phan: c.phan,
    sao: c.sao,
    loi: c.loi,
    soEmLam: c.soEmLam,
    soEmSai: c.soEmSai,
    soEmDung: c.soEmDung,
    giay: giayCau(c, ch),
    lyDo: lyDoCau(c),
    nguon: nguonCau(c),
  }))

  // ── CHẾ ĐỘ "HẾT" (bỏ trần 60 câu + bỏ ngân sách): MỌI câu ưu tiên (sai / khó / cốt tủy) vào CHỮA;
  //    câu "còn lại" (dễ, cả lớp làm đúng) chỉ ĐỌC ĐÁP ÁN. Không cắt câu nào ⇒ thầy gọi liên tục tới hết. ──
  if (tuyChon.het) {
    const chua = xep.filter((c) => c.nguon !== 'con_lai')
    const docDapAn = xep.filter((c) => c.nguon === 'con_lai')
    if (xep.length === 0) canhBao.push('Không có câu nào để rút — kiểm lại bài giao về nhà')
    else if (chua.length === 0) canhBao.push('Không có câu cả lớp sai / khó / cốt tủy — chỉ còn câu dễ để đọc đáp án')
    return {
      chua,
      docDapAn,
      boQua: [],
      soCauLocRa: xep.length,
      tiLeChua: xep.length > 0 ? chua.length / xep.length : 0,
      dat80: chua.length > 0,
      thieuGiay: 0,
      tongGiay: chua.reduce((n, c) => n + c.giay, 0),
      nganSach,
      cauBiCat: 0,
      canhBao,
    }
  }

  const cauBiCat = Math.max(0, xep.length - D.SO_CAU_TOI_DA)
  if (cauBiCat > 0) canhBao.push(`${cauBiCat} câu vượt trần ${D.SO_CAU_TOI_DA} câu/buổi — chưa đưa vào buổi này`)
  const ds = cauBiCat > 0 ? xep.slice(0, D.SO_CAU_TOI_DA) : xep

  // Nhét vào ngân sách: nhóm CHỮA = phần đầu vừa giờ.
  let tongGiay = 0
  let soChua = 0
  for (const c of ds) {
    if (tongGiay + c.giay > nganSach) break
    tongGiay += c.giay
    soChua++
  }

  // KHOÁ SÀN 80 %: |lọc ra| ≤ |chữa| / 0,8 (để `chữa / lọc ra ≥ 80 %`).
  const soLocRa = soChua > 0 ? Math.min(ds.length, Math.floor(soChua / D.TI_LE_CHUA_TOI_THIEU)) : 0
  const chua = ds.slice(0, soChua)
  const docDapAn = ds.slice(soChua, Math.max(soChua, soLocRa))
  const boQua = ds.slice(Math.max(soChua, soLocRa))
  const tiLeChua = soLocRa > 0 ? soChua / soLocRa : 0
  const dat80 = soChua > 0 && tiLeChua >= D.TI_LE_CHUA_TOI_THIEU - 1e-9

  // Lời thật: câu cả lớp SAI mà chưa chữa được → nói rõ cần thêm bao nhiêu phút.
  const saiChua = [...docDapAn, ...boQua].filter((c) => c.soEmSai > 0)
  const thieuGiay = saiChua.reduce((n, c) => n + c.giay, 0)
  if (saiChua.length > 0) {
    canhBao.push(
      `${saiChua.length} câu cả lớp SAI chưa chữa được trong ${ch.NGAN_SACH_PHUT} phút: cần thêm ${Math.ceil(thieuGiay / 60)} phút (${saiChua.map((c) => `Phần ${c.phan} câu ${c.qid}`).join(' · ')})`,
    )
  }
  if (xep.length === 0) canhBao.push('Không có câu nào để rút — kiểm lại bài giao về nhà')
  else if (soChua === 0) canhBao.push(`Không câu nào vừa ${ch.NGAN_SACH_PHUT} phút — thầy nới ngân sách hoặc cắt câu dài`)

  return {
    chua,
    docDapAn,
    boQua,
    soCauLocRa: soLocRa,
    tiLeChua,
    dat80,
    thieuGiay,
    tongGiay,
    nganSach,
    cauBiCat,
    canhBao,
  }
}


// ══════════════════════════ 3 · PHÂN BỔ LƯỢT EM (≥ 1 lượt · cân bằng · seed) ══════════════════════════

/** Chấm một em với một câu — nơi nối HỒ SƠ CÁ NHÂN (`diemHopCau` của `ho-so-lop.ts`) vào thuật toán này.
 * Trả `chan: true` nghĩa là em KHÔNG được nhận câu này (chặn cứng, ví dụ bậc "biết" không nhận câu 2 sao).
 * Mặc định: mọi em ngang nhau (điểm 0) — dùng cho test và cho đường chưa có hồ sơ. */
export type ChamEm = (sbd: string, cau: CauXep) => { diem: number; chan?: boolean; viSao?: string }

/** Nguồn bốc thăm giữa các em NGANG NHAU: hàm, SEED số, hoặc seed chuỗi (qua `hashSeed`).
 * Mặc định là chuỗi cố định ⇒ hai lần bấm ra ĐÚNG một bảng (thầy mở lại bảng hôm qua vẫn y nguyên). */
export type NguonBocTham = (() => number) | number | string

const SEED_MAC_DINH = 'rui-cau-btvn-len-bang'
/** Seed RIÊNG cho việc ĐAN XEN 3 nhóm — tách khỏi seed gán em để hai việc độc lập nhau. */
const SEED_XEN_KE = 'xen-ke-sai-kho-cot-tuy'

function taoBocTham(nguon: NguonBocTham): () => number {
  if (typeof nguon === 'function') return nguon
  return mulberry32(typeof nguon === 'number' ? nguon : hashSeed(nguon))
}

/**
 * ĐAN XEN LUÂN PHIÊN (round-robin) 3 nhóm theo TẦNG ưu tiên — `sai` (tầng 0) · `khó` (tầng 1) · `cốt tủy` (tầng 2).
 *
 * Thầy chốt: "phân công ngẫu nhiên giữa câu sai và câu khó và câu cốt tủy" — thay vì xếp "sai hết → khó → cốt tủy".
 * · THỨ TỰ 3 NHÓM bốc thăm bằng SEED (Fisher–Yates) ⇒ hai lần xếp ra ĐÚNG một bảng, mở lại buổi cũ y nguyên.
 * · TRONG mỗi nhóm giữ nguyên thứ tự ưu tiên sẵn có (sai nhiều nhất trước, …) — đan xen chỉ đổi VỊ TRÍ nhóm.
 * · Nhóm "còn lại" (tầng 3) KHÔNG tham gia đan xen — luôn nằm CUỐI (chỉ đọc đáp án, không gọi).
 *
 * Đầu vào nên ĐÃ sắp theo `xepUuTienCau` (để thứ tự trong nhóm đúng). Hàm THUẦN + TẤT ĐỊNH.
 */
export function xenKeNgauNhien(ds: readonly CauXep[], nguon: NguonBocTham = SEED_XEN_KE): CauXep[] {
  const tang = (c: CauXep): 0 | 1 | 2 | 3 =>
    c.nguon === 'sai_nhieu' ? 0 : c.nguon === 'kho_it_lam_duoc' ? 1 : c.nguon === 'cot_tuy' ? 2 : 3
  const nhom: CauXep[][] = [[], [], [], []]
  for (const c of ds) nhom[tang(c)].push(c)
  const random = taoBocTham(nguon)
  const thuTu = [0, 1, 2]
  for (let i = thuTu.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[thuTu[i], thuTu[j]] = [thuTu[j], thuTu[i]]
  }
  const ra: CauXep[] = []
  for (let k = 0; ; k++) {
    let co = false
    for (const g of thuTu)
      if (k < nhom[g].length) {
        ra.push(nhom[g][k])
        co = true
      }
    if (!co) break
  }
  return [...ra, ...nhom[3]]
}

export interface LuotEm {
  /** Thứ tự lượt trong buổi (1…n). */
  luot: number
  sbd: string
  hoTen: string
  cau: CauXep
  /** Em này đã lên bảng bấy nhiêu lần TÍNH TỚI lượt này (1 = lần đầu tiên trong buổi). */
  luotCuaEm: number
  /** Điểm hợp với câu (do `cham` trả). */
  diem: number
  /** Lý do in cho thầy ("sai câu này · yếu …"). */
  viSao: string
}

export interface KetQuaPhanBo {
  luot: LuotEm[]
  /** Số lượt của từng em (sbd → số lượt trong buổi). */
  soLuot: Map<string, number>
  /** Em CÓ MẶT nhưng không được lượt nào (hết câu trước khi tới em). */
  emKhongLuot: string[]
  soEmCoLuot: number
  /** Số em được gọi NHIỀU HƠN 1 lượt. */
  soEmNhieuLuot: number
  canhBao: string[]
}

/**
 * PHÂN BỔ LƯỢT LÊN BẢNG. Tất định (mọi phá hoà bằng seed).
 *   · MỌI em có mặt được ≥ 1 lượt trước khi có ai được lượt thứ hai (chọn theo BẬC số lượt thấp nhất trước).
 *   · Trong cùng một bậc lượt, chọn em HỢP NHẤT theo hồ sơ cá nhân (`cham`); ngang điểm ⇒ bốc thăm bằng seed.
 *   · Chặn cứng (`chan`) được tôn trọng: chỉ khi MỌI em đều bị chặn mới lấy tạm em ít lượt nhất và BÁO.
 */
export function phanBoLuotEm(
  cau: readonly CauXep[],
  em: readonly { sbd: string; hoTen: string }[],
  cham: ChamEm = () => ({ diem: 0 }),
  nguon: NguonBocTham = SEED_MAC_DINH,
): KetQuaPhanBo {
  const random = taoBocTham(nguon)
  const ds = em.filter((e) => e.sbd)
  const soLuot = new Map<string, number>(ds.map((e) => [e.sbd, 0]))
  const canhBao: string[] = []
  if (ds.length === 0) return { luot: [], soLuot, emKhongLuot: [], soEmCoLuot: 0, soEmNhieuLuot: 0, canhBao: ['Chưa có em nào trong buổi'] }

  /** Bốc đều giữa các em NGANG ĐIỂM — luôn gọi `random()` MỘT lần để dòng ngẫu nhiên khớp ở mọi nhánh. */
  const boc = (nhom: { e: { sbd: string; hoTen: string }; k: { diem: number; chan?: boolean; viSao?: string } }[]) => {
    const cao = Math.max(...nhom.map((x) => x.k.diem))
    const hop = nhom.filter((x) => x.k.diem === cao)
    const r = random()
    return hop[Math.min(hop.length - 1, Math.floor(r * hop.length))]!
  }

  const luot: LuotEm[] = []
  for (const c of cau) {
    const bac = [...new Set(ds.map((e) => soLuot.get(e.sbd)!))].sort((a, b) => a - b)
    let chon: { e: { sbd: string; hoTen: string }; k: { diem: number; chan?: boolean; viSao?: string } } | null = null
    for (const lv of bac) {
      const nhom = ds.filter((e) => soLuot.get(e.sbd) === lv).map((e) => ({ e, k: cham(e.sbd, c) }))
      const ok = nhom.filter((x) => !x.k.chan)
      if (ok.length) {
        chon = boc(ok)
        break
      }
    }
    if (!chon) {
      const lv = bac[0]!
      const nhom = ds.filter((e) => soLuot.get(e.sbd) === lv).map((e) => ({ e, k: cham(e.sbd, c) }))
      chon = boc(nhom)
      canhBao.push(`Phần ${c.phan} câu ${c.qid}: mọi em đều bị chặn bậc — tạm gọi ${chon.e.hoTen || chon.e.sbd}, thầy cân nhắc`)
    }
    const t = soLuot.get(chon.e.sbd)! + 1
    soLuot.set(chon.e.sbd, t)
    luot.push({ luot: luot.length + 1, sbd: chon.e.sbd, hoTen: chon.e.hoTen, cau: c, luotCuaEm: t, diem: chon.k.diem, viSao: chon.k.viSao ?? '' })
  }

  const emKhongLuot = ds.filter((e) => (soLuot.get(e.sbd) ?? 0) === 0).map((e) => e.hoTen || e.sbd)
  if (emKhongLuot.length > 0) canhBao.push(`${emKhongLuot.length} em chưa được gọi lượt nào: ${emKhongLuot.join(', ')} — thiếu câu, thầy thêm câu hoặc chấp nhận`)
  return {
    luot,
    soLuot,
    emKhongLuot,
    soEmCoLuot: ds.length - emKhongLuot.length,
    soEmNhieuLuot: ds.filter((e) => (soLuot.get(e.sbd) ?? 0) > 1).length,
    canhBao,
  }
}

/** Bảng chữ để thầy copy sang giáo án / nhóm Zalo. */
export function bangChuRuiCau(kq: KetQuaRuiCau, pb: KetQuaPhanBo, tenNguon: string): string {
  const d: string[] = [
    `Rút câu BTVN lên bảng · ${tenNguon}`,
    `${kq.chua.length} câu chữa (${Math.round(kq.tongGiay / 60)}/${Math.round(kq.nganSach / 60)} phút) · ${Math.round(kq.tiLeChua * 100)}% câu lọc ra · ${pb.soEmCoLuot} em lên bảng (${pb.soEmNhieuLuot} em nhiều lượt)`,
  ]
  if (pb.luot.length > 0) {
    d.push('', 'GỌI LÊN BẢNG')
    for (const x of pb.luot)
      d.push(`${x.luot}. Phần ${x.cau.phan} câu ${x.cau.qid}${x.cau.sao ? ' ' + '★'.repeat(x.cau.sao) : ''} (${Math.round(x.cau.giay / 60)} phút) → ${x.hoTen || x.sbd}${x.luotCuaEm > 1 ? ` (lượt ${x.luotCuaEm})` : ''} · ${x.viSao || x.cau.lyDo}`)
  }
  if (kq.docDapAn.length > 0) d.push('', `CHỈ ĐỌC ĐÁP ÁN — ${kq.docDapAn.length} câu`, kq.docDapAn.map((c) => `Phần ${c.phan} câu ${c.qid}`).join(' · '))
  if (kq.boQua.length > 0) d.push('', `${kq.boQua.length} câu chưa đưa vào buổi`, kq.boQua.map((c) => `Phần ${c.phan} câu ${c.qid}`).join(' · '))
  for (const c of [...kq.canhBao, ...pb.canhBao]) d.push('', `⚠ ${c}`)
  return d.join('\n')
}

