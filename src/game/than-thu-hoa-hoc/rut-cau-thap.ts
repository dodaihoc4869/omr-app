/**
 * RÚT CÂU CHO THÁP — THEO SAO, KHÔNG LẶP.
 *
 * Thầy chốt 15-09: *"khó là những câu 2 sao, bạn dựa vào đó để phân. Không cần
 * phân câu sai, chỉ cần phân câu kiến thức em đã thi của các ca thi trước đó,
 * 2 sao khó nhất, xong đến 1 sao, rồi 0 sao"* — và trước đó: *"số câu chơi ở
 * các tầng lặp lại nhiều. Càng tầng cao câu phải càng khó"*.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * BỐN LỖI CỦA BẢN CŨ, tệp này khoá cả bốn:
 *
 *  1. `locTheoBac` hết bậc thì TRẢ CẢ KHO, im lặng ⇒ tầng 30 rút đúng cái rổ
 *     tầng 1 rút.
 *  2. `bacTheoMucDo` dồn "thông hiểu", "vận dụng" và CẢ CÂU CHƯA GẮN MỨC ĐỘ
 *     vào cùng một bậc ⇒ bậc 1 và 3 rỗng ⇒ rơi vào lỗi 1.
 *  3. `setDaHoiCau([])` mỗi lần bắt đầu leo ⇒ sổ chống lặp chỉ sống trong một
 *     lượt, đóng ra mở lại là quên hết.
 *  4. `bacTheoTang` ba nấc rồi đứng ⇒ tầng 26 và tầng 999 khó y hệt nhau.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * VÌ SAO KHÔNG CHIA BA VÙNG TẦNG CỨNG (1–333 · 334–666 · 667–999).
 *
 * Vì đó đúng là lỗi 1 mặc áo mới: kho câu của mỗi em một khác, em này có 80
 * câu 2 sao, em kia có 3 câu. Chia cứng thì em thứ hai leo tới tầng 700 là hết
 * câu, rồi lại rơi về "lấy bừa cả kho".
 *
 * Nay dùng MỤC TIÊU SAO LIÊN TỤC: tầng 1 nhắm 0,0 sao — tầng 999 nhắm 2,0 sao.
 * Câu nào có sao gần mục tiêu thì nặng ký hơn, chứ không phải lọc bỏ hẳn. Kho
 * lệch cỡ nào thì thang cũng tự co theo, và "tầng cao câu khó hơn" vẫn đúng
 * dù em chỉ có ba câu 2 sao.
 */

/** Một câu ứng viên — chỉ những trường tệp này thật sự cần. */
export interface CauUngVien {
  qid: string
  /** 0 · 1 · 2 — lấy từ `can_chua.sao` thầy gắn trong kho đề. */
  sao: number
  chuyenDe: string
  /** Em từng làm SAI câu này chưa. Câu từng sai đáng ôn hơn câu làm đúng. */
  tungSai: boolean
  /**
   * Tổng ký tự đề + bốn phương án.
   *
   * Thầy chốt 15-09: *"càng tầng cao câu càng khó càng dài"*. Độ dài là một
   * thang ĐỘC LẬP với sao: câu 2 sao vẫn có câu ngắn, câu 0 sao vẫn có câu dài
   * lê thê. Muốn tầng cao vừa khó vừa dài thì phải cân cả hai.
   */
  doDai: number
}

/** Một dòng sổ câu đã hỏi ở tháp. Sống trong hồ sơ thần thú, đồng bộ đa máy. */
export interface DongLichSuThap {
  qid: string
  /** Dấu thời gian lần hỏi gần nhất (ms). */
  lanCuoi: number
  soLanHoi: number
}

export const CAU_HINH_RUT = {
  /** Số câu gần nhất bị cấm hỏi lại, tính trên TOÀN BỘ sổ, mọi lượt leo. */
  SO_CAU_CAM_LAP: 40,
  /** Sổ giữ tối đa bao nhiêu dòng — cắt bớt để hồ sơ không phình. */
  SO_DONG_GIU: 300,
  /** Câu em từng làm sai nặng ký hơn câu em làm đúng bấy nhiêu lần. */
  UU_TIEN_TUNG_SAI: 1.25,
  /** Chuyên đề chưa gặp trong lượt leo này nặng ký hơn bấy nhiêu lần. */
  UU_TIEN_CHUYEN_DE_MOI: 1.6,
  /** Sao lệch mục tiêu 1 đơn vị thì còn lại bấy nhiêu phần trọng số. */
  PHAT_LECH_SAO: 0.35,
  /**
   * Trọng số của độ dài so với sao.
   *
   * Sao vẫn là thang chính (thầy chốt "khó là những câu 2 sao"); độ dài chỉ
   * nghiêng cán cân trong số câu cùng sao. 0,45 nghĩa là lệch hết cỡ về độ dài
   * cũng chỉ bằng nửa một bậc sao — không để câu dài mà dễ chen lên tầng cao.
   */
  TRONG_SO_DAI: 0.45,
} as const

/** Vì sao lượt rút này phải nới lỏng — màn hình PHẢI nói ra, cấm nới lặng lẽ. */
export type LyDoNoi = 'hetCauMoi' | 'phaiLap' | 'muonKhoChung'

export const CHU_LY_DO_NOI: Record<LyDoNoi, string> = {
  hetCauMoi: 'Em đã gặp gần hết câu trong kho — đang cho phép hỏi lại câu cũ hơn.',
  phaiLap: 'Kho câu của em đã cạn — từ đây sẽ có câu lặp lại.',
  muonKhoChung: 'Em chưa có câu nào chơi được, đang mượn kho câu chung của thầy.',
}

export interface KetQuaRut {
  cau: CauUngVien | null
  /** Rỗng nghĩa là rút được câu mới đúng tầm, không phải nới gì. */
  daNoi: LyDoNoi[]
}

/** Sổ → bản đồ tra nhanh. */
function banDo(so: readonly DongLichSuThap[]): Map<string, DongLichSuThap> {
  const m = new Map<string, DongLichSuThap>()
  for (const d of so) m.set(d.qid, d)
  return m
}

/**
 * ĐIỂM ƯU TIÊN của một câu ở tầng N.
 *
 * Bốn thành phần nhân nhau, không cộng — cộng thì một thành phần lớn nuốt hết
 * ba cái kia, mà ở đây cả bốn đều là điều kiện cần.
 */
export function diemUuTien(
  c: CauUngVien,
  saoMucTieu: number,
  soLanHoi: number,
  chuyenDeDaGap: ReadonlySet<string>,
  /** Độ dài mục tiêu quy về thang 0…1; bỏ trống thì không cân độ dài. */
  daiMucTieu?: number,
  /** Độ dài của câu này quy về thang 0…1 trong chính kho của em. */
  daiCuaCau?: number,
): number {
  // Gần mục tiêu sao thì nặng ký. Lệch 2 sao còn 0,35² ≈ 0,12 — vẫn có cửa,
  // không loại hẳn, nên kho lệch cỡ nào cũng rút được.
  const lech = Math.abs(c.sao - saoMucTieu)
  let d = Math.pow(CAU_HINH_RUT.PHAT_LECH_SAO, lech)
  // Hỏi càng nhiều lần càng nhẹ ký. Đây mới là thứ thật sự giết lặp.
  d /= 1 + soLanHoi * 1.5
  if (c.tungSai) d *= CAU_HINH_RUT.UU_TIEN_TUNG_SAI
  if (!chuyenDeDaGap.has(c.chuyenDe)) d *= CAU_HINH_RUT.UU_TIEN_CHUYEN_DE_MOI
  // Độ dài: cùng cách chấm như sao, nhưng nhẹ ký hơn.
  if (daiMucTieu !== undefined && daiCuaCau !== undefined) {
    const lechDai = Math.abs(daiCuaCau - daiMucTieu)
    d *= Math.pow(CAU_HINH_RUT.PHAT_LECH_SAO, lechDai * 2 * CAU_HINH_RUT.TRONG_SO_DAI)
  }
  return d
}

/**
 * Xếp hạng độ dài của từng câu trong kho, quy về 0…1.
 *
 * Dùng THỨ HẠNG chứ không dùng số ký tự chia cho hằng số: kho của em này toàn
 * câu ngắn, kho em kia toàn câu dài — chia cho hằng số thì một trong hai em
 * không bao giờ chạm được đầu thang.
 */
export function thangDoDai(kho: readonly CauUngVien[]): Map<string, number> {
  const sap = [...kho].sort((a, b) => a.doDai - b.doDai)
  const m = new Map<string, number>()
  for (const [i, c] of sap.entries()) {
    m.set(c.qid, sap.length <= 1 ? 0.5 : i / (sap.length - 1))
  }
  return m
}

/** Bốc một phần tử theo trọng số. `ngauNhien` trả về 0…1. */
function bocTheoTrongSo<T>(ds: readonly { x: T; w: number }[], ngauNhien: () => number): T | null {
  const tong = ds.reduce((t, o) => t + o.w, 0)
  if (ds.length === 0 || tong <= 0) return ds[0]?.x ?? null
  let r = ngauNhien() * tong
  for (const o of ds) { r -= o.w; if (r <= 0) return o.x }
  return ds[ds.length - 1]!.x
}

/**
 * RÚT MỘT CÂU cho tầng N.
 *
 * `ngauNhien` truyền từ ngoài vào để phép kiểm chạy tất định — cấm gọi
 * `Math.random()` trong thân hàm.
 */
export function rutCauChoTang(p: {
  kho: readonly CauUngVien[]
  tang: number
  saoMucTieu: number
  lichSu: readonly DongLichSuThap[]
  /** Câu đã hỏi trong CHÍNH lượt leo này — tuyệt đối không lặp trong một lượt. */
  daHoiLuotNay: readonly string[]
  /** Chuyên đề đã gặp trong lượt leo này. */
  chuyenDeDaGap: ReadonlySet<string>
  /** Độ dài mục tiêu 0…1 theo tầng. Tầng 1 nhắm câu ngắn, tầng 999 nhắm câu dài. */
  daiMucTieu?: number
  ngauNhien: () => number
}): KetQuaRut {
  const { kho, saoMucTieu, lichSu, daHoiLuotNay, chuyenDeDaGap, ngauNhien } = p
  if (kho.length === 0) return { cau: null, daNoi: ['muonKhoChung'] }

  const so = banDo(lichSu)
  const soLan = (q: string): number => so.get(q)?.soLanHoi ?? 0
  // Sổ đã sắp theo `lanCuoi` giảm dần ⇒ N câu đầu là N câu gần nhất.
  const ganDay = new Set(
    [...lichSu].sort((a, b) => b.lanCuoi - a.lanCuoi)
      .slice(0, CAU_HINH_RUT.SO_CAU_CAM_LAP).map((d) => d.qid),
  )
  const trongLuot = new Set(daHoiLuotNay)

  const thangDai = thangDoDai(kho)
  const chamDiem = (ds: readonly CauUngVien[]) =>
    ds.map((x) => ({
      x,
      w: diemUuTien(x, saoMucTieu, soLan(x.qid), chuyenDeDaGap,
        p.daiMucTieu, thangDai.get(x.qid)),
    }))

  // Lớp 1 — câu chưa hỏi trong lượt này VÀ không nằm trong 40 câu gần nhất.
  const lop1 = kho.filter((c) => !trongLuot.has(c.qid) && !ganDay.has(c.qid))
  if (lop1.length > 0) return { cau: bocTheoTrongSo(chamDiem(lop1), ngauNhien), daNoi: [] }

  // Lớp 2 — nới sổ chống lặp, nhưng vẫn không lặp TRONG lượt này.
  const lop2 = kho.filter((c) => !trongLuot.has(c.qid))
  if (lop2.length > 0) {
    return { cau: bocTheoTrongSo(chamDiem(lop2), ngauNhien), daNoi: ['hetCauMoi'] }
  }

  // Lớp 3 — cạn thật, đành lặp cả trong lượt.
  return { cau: bocTheoTrongSo(chamDiem(kho), ngauNhien), daNoi: ['hetCauMoi', 'phaiLap'] }
}

/** Ghi một lượt hỏi vào sổ, cắt bớt cho khỏi phình. */
export function ghiLichSu(
  so: readonly DongLichSuThap[],
  qid: string,
  bayGio: number,
): DongLichSuThap[] {
  const ra = so.filter((d) => d.qid !== qid)
  const cu = so.find((d) => d.qid === qid)
  ra.unshift({ qid, lanCuoi: bayGio, soLanHoi: (cu?.soLanHoi ?? 0) + 1 })
  ra.sort((a, b) => b.lanCuoi - a.lanCuoi)
  return ra.slice(0, CAU_HINH_RUT.SO_DONG_GIU)
}

/**
 * TRỘN SỔ HAI MÁY — không bên nào đè bên nào.
 *
 * Em leo trên máy tính rồi mở điện thoại: hai sổ đều thật, phải cộng hiểu biết
 * chứ không phải chọn một bên. Lấy `max` cả hai trường: hỏi nhiều hơn thì giữ
 * số lớn, hỏi gần đây hơn thì giữ mốc mới.
 */
export function tronLichSu(
  a: readonly DongLichSuThap[],
  b: readonly DongLichSuThap[],
): DongLichSuThap[] {
  const m = new Map<string, DongLichSuThap>()
  for (const d of [...a, ...b]) {
    const cu = m.get(d.qid)
    m.set(d.qid, cu === undefined ? { ...d } : {
      qid: d.qid,
      lanCuoi: Math.max(cu.lanCuoi, d.lanCuoi),
      soLanHoi: Math.max(cu.soLanHoi, d.soLanHoi),
    })
  }
  return [...m.values()]
    .sort((x, y) => y.lanCuoi - x.lanCuoi)
    .slice(0, CAU_HINH_RUT.SO_DONG_GIU)
}

/** Đọc sổ từ dữ liệu thô của máy chủ / localStorage — cấm tin, phải vá. */
export function vaLichSu(tho: unknown): DongLichSuThap[] {
  if (!Array.isArray(tho)) return []
  const ra: DongLichSuThap[] = []
  for (const x of tho) {
    if (x === null || typeof x !== 'object') continue
    const o = x as Record<string, unknown>
    const qid = typeof o.qid === 'string' ? o.qid.trim() : ''
    if (qid === '') continue
    ra.push({
      qid,
      lanCuoi: Number.isFinite(o.lanCuoi) ? Math.max(0, Math.round(o.lanCuoi as number)) : 0,
      soLanHoi: Number.isFinite(o.soLanHoi) ? Math.max(1, Math.round(o.soLanHoi as number)) : 1,
    })
  }
  return ra.sort((a, b) => b.lanCuoi - a.lanCuoi).slice(0, CAU_HINH_RUT.SO_DONG_GIU)
}
