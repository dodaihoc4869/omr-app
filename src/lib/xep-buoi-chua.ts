// XẾP BUỔI CHỮA 90 PHÚT — HAI TẦNG, BẢO ĐẢM SÀN SỐ EM LÊN BẢNG.
//
// Thầy chốt 14/09:
//   "viết lại thuật toán phân công lên bảng ... ưu tiên phân công câu 2 sao
//    trước rồi đến 1 sao ... lấy tất cả mọi dữ liệu của học sinh, từ bài thi,
//    bài tập về nhà, khắc phục câu sai đóng gói lại ... trong 90 phút danh sách
//    lớp phải có ít nhất 20 em được lên bảng ... chữa câu khó và câu dễ đan xen
//    ... số câu khó và quan trọng nhất phải được chữa hết, số câu còn lại chỉ
//    cần đọc đáp án ... số câu còn lại chưa được chữa được chiếu đáp án lên
//    bảng qua mục máy chiếu."
//
// VÌ SAO BẢN CŨ KHÔNG THỂ ĐẠT 20 EM. `xep-gio-len-bang.ts` cho mỗi em lên bảng
// một giá CỐ ĐỊNH 420 giây. 20 × 420 = 8.400 giây, trong khi 90 phút trừ hao
// phí chỉ còn 4.920. Không thuật toán nào cứu được một bài toán vô nghiệm —
// phải đổi chính mô hình giá.
//
// MÔ HÌNH MỚI: giá lên bảng theo ĐỘ KHÓ của câu (xem `GIAY_LEN_BANG_THEO_SAO`).
// Câu 2 sao đáng 5 phút vì phải chốt bẫy; câu 0 sao gọi nhanh 2 phút là đủ.
// "Đan xen khó–dễ" của thầy chính là chỗ này, và nó làm bài toán có nghiệm:
//   6×300 + 8×180 + 6×120 = 3.960 giây cho 20 em, còn 960 giây đọc đáp án.
//
// HAI TẦNG, ĐÚNG THỨ TỰ THẦY DẶN:
//   Tầng 1 — CHỮA: câu 2 sao trước, rồi 1 sao, rồi 0 sao. Mỗi câu gọi một em.
//   Tầng 2 — ĐỌC ĐÁP ÁN: mọi câu còn lại. Không ai lên bảng, và chúng đi thẳng
//            vào tờ máy chiếu để thầy chiếu đáp án.
//
// BA ĐIỀU KHÔNG ĐƯỢC PHÁ:
//   · CÂU BẮT BUỘC PHẢI ĐƯỢC CHỮA HẾT. Hết ngân sách mà còn câu bắt buộc thì
//     báo thiếu bao nhiêu giây, KHÔNG lặng lẽ bỏ câu.
//   · KHÔNG BỊA EM. Thiếu câu để đạt sàn thì nói thiếu bao nhiêu câu.
//   · MỘT EM MỘT LẦN. Sàn 20 em nghĩa là 20 em KHÁC NHAU, không phải một em
//     lên bốn lượt.
import type { CauChua } from './phan-cong'
import { chuanChuyenDe } from './phan-cong'
import { CAU_HINH_LEN_BANG_MAC_DINH, HOC_NHIEU, nganSachGiay, type CauHinhLenBang } from './len-bang-cau-hinh'
import { giayBienGhepDoi, thoiGianCau, type NoiDungCau } from './thoi-gian-len-bang'
import type { BacBoCuc } from './bo-cuc-to-chieu'
import type { HoSoEmDayDu } from './ho-so-lop'
import { btvnCuaCau, canDayLaiCau, CHU_BTVN, diemHopCau, emYeuDang, lyDoChanCau, tomTatBtvn } from './ho-so-lop'

/** Một câu đã có thống kê lớp — phần thuật toán này cần đúng bấy nhiêu. */
export interface CauVaoXep {
  cau: CauChua
  /** Tỉ lệ em làm ĐÚNG câu này trong ca vừa rồi. Không có dữ liệu thì null. */
  tiLeDung: number | null
  /** Số em đã làm câu này. Mẫu nhỏ thì mọi kết luận về lớp đều yếu. */
  soEmLam: number
  /** Câu nằm trong danh sách BẮT BUỘC chữa (lớp sai nhiều, hoặc thầy chốt). */
  batBuoc: boolean
  /** Nội dung câu (số từ, hình/bảng, số bước lời giải) — để tính thời gian lên bảng theo ĐỘ DÀI (`thoi-gian-len-bang.ts`).
   * Thiếu (gói đề không tải được, test dựng tối giản) ⇒ rơi về 300/180/120 theo sao như cũ. */
  noiDung?: NoiDungCau
  /** BẬC BỐ CỤC ước lượng trên tờ chiếu (`uoc-luong-bo-cuc.ts`): 1 = ghép đôi được … 5 = chiếm CẢ bảng (em làm ở bảng phụ).
   * Thiếu thì không cảnh báo gì về bố cục. */
  bacUoc?: BacBoCuc
  /** NỐI BUỔI (M4): sbd em đã ĐỊNH cho câu này ở lần xếp trước. Em ấy còn CÓ MẶT, còn rảnh và không bị chặn bậc thì giữ nguyên
   * (buổi nối không xáo lại người đã đứng chỗ); vắng/bận/bị chặn thì chọn em hợp nhất như thường (`diemHopCau`). Đặt ở từng câu
   * (không ở `YeuCauBuoiChua`) để màn hình gọi `xepBuoiChua(cauVaoXep, hoSo)` nguyên dạng như test cũ khoá. */
  emDaDinh?: string
  /** HỆ SỐ HIỆU CHỈNH giờ theo giây thật của (phần, sao) câu này (M6, `hieu-chinh-giay-thuc.ts`) — màn hình đặt khi đã đủ mẫu; thiếu ⇒ 1. */
  heSoHieuChinh?: number
}

export type TangChua = 'len_bang' | 'doc_dap_an'

export interface DongChua {
  tang: TangChua
  cau: CauChua
  giay: number
  /** Chỉ tầng `len_bang` mới có em.
   *
   * 14/09 giữ NGUYÊN hồ sơ em ở đây thay vì cắt còn tên và số báo danh: thầy
   * chốt bảng phân công phải hiện luôn em ấy ở nhà làm câu này đúng hay sai
   * hay chưa làm, và làm được bao nhiêu câu trên tổng số câu được giao. Cắt
   * bớt ở đây thì màn hình phải đi tra ngược lại hồ sơ theo số báo danh — hai
   * nguồn cho một việc, sớm muộn lệch nhau. */
  em: HoSoEmDayDu | null
  /** Vì sao gọi ĐÚNG em này — in ra cho thầy đọc, không phải mã số. */
  viSao: string
  /** Điểm hợp giữa em và câu (0–1). Càng cao càng đúng người. */
  hop: number
}

export interface KetQuaBuoiChua {
  dong: DongChua[]
  /** Số em KHÁC NHAU được lên bảng. */
  soEmLenBang: number
  soEmToiThieu: number
  /** Đạt sàn chưa. Chưa đạt thì `thieu` nói thiếu vì đâu. */
  datSan: boolean
  thieu: { soEmConThieu: number; viSao: string } | null
  tongGiay: number
  nganSach: number
  /** Câu chỉ đọc đáp án — chính là bộ đi vào tờ máy chiếu. */
  cauDocDapAn: CauChua[]
  /** Câu BẮT BUỘC mà ngân sách không đủ để chữa. Rỗng là tốt. */
  batBuocChuaChua: CauChua[]
  /** Câu ĐƯỢC GỌI EM LÊN BẢNG mà quá dài, tờ chiếu phải dành CẢ bảng cho đề (bậc 5): em làm ở bảng phụ. */
  cauChiemCaBang: CauChua[]
  canhBao: string[]
  /** CÁC CON SỐ ĐO ĐƯỢC của buổi (M5) — không có chữ nào kiểu "nắm chắc". */
  hocNhieu: {
    /** Tổng giá trị các câu được chữa: Σ tỉLệLớpSai × (1 + 0,5 × [dạng lớp yếu chưa phủ lúc chọn]). */
    tongGiaTri: number
    /** Số dạng LỚP YẾU (theo hồ sơ nắm kiến thức của em có mặt), số dạng đã có ít nhất một câu được chữa, và tên các dạng chưa phủ. */
    soDangYeu: number
    soDangYeuDaPhu: number
    dangYeuChuaPhu: string[]
    /** Số câu KHÔNG được gọi em hôm nay (chỉ đọc đáp án) — còn lại cho buổi sau (nối buổi ở màn giáo viên). */
    soCauDoiBuoiSau: number
    /** Một dòng cho thầy, ghép từ đúng các số trên. */
    tomTat: string
  }
}

export interface YeuCauBuoiChua {
  cauHinh?: CauHinhLenBang
  /** Chỉ xếp trong số em thầy đã tích. Rỗng nghĩa là lấy tất cả em có mặt. */
  sbdChon?: string[]
}

/** Thứ tự ưu tiên chữa: 2 sao trước, rồi 1 sao, rồi 0 sao.
 *
 * Trong cùng bậc sao thì câu lớp sai nhiều hơn đứng trước — sao là nhãn dán từ
 * trước, tỉ lệ sai là số đo của lớp HÔM NAY. Câu bắt buộc luôn đứng trên hết. */
export function xepThuTuChua(ds: CauVaoXep[]): CauVaoXep[] {
  return [...ds].sort((a, b) => {
    if (a.batBuoc !== b.batBuoc) return a.batBuoc ? -1 : 1
    if (a.cau.sao !== b.cau.sao) return b.cau.sao - a.cau.sao
    const sa = a.tiLeDung === null ? 0.5 : 1 - a.tiLeDung
    const sb = b.tiLeDung === null ? 0.5 : 1 - b.tiLeDung
    if (Math.abs(sa - sb) > 0.001) return sb - sa
    return a.cau.viTri - b.cau.viTri
  })
}

/** Chọn em hợp nhất còn rảnh cho một câu. Trả null khi không còn ai NHẬN được.
 *
 * Em bị CHẶN CỨNG (`chan` — bậc "biết" ở dạng của câu 2 sao) không bao giờ được
 * chọn, dù điểm cao đến đâu. Điểm bằng nhau thì em mà câu này là câu CẦN DẠY LẠI
 * của chính em ấy đứng trước; còn bằng nữa thì em đứng trước trong danh sách
 * (tất định — không bốc thăm). */
function chonEm(
  c: CauVaoXep,
  dsEm: HoSoEmDayDu[],
  daGoi: Set<string>,
  emDaDinh?: string,
): { em: HoSoEmDayDu; hop: number; viSao: string } | null {
  if (emDaDinh) {
    const e = dsEm.find((x) => x.sbd === emDaDinh)
    if (e && !daGoi.has(e.sbd)) {
      const d = diemHopCau(e, c.cau)
      if (!d.chan) return { em: e, hop: d.diem, viSao: d.viSao }
    }
  }
  let tot: { em: HoSoEmDayDu; hop: number; viSao: string; dayLai: boolean } | null = null
  for (const e of dsEm) {
    if (daGoi.has(e.sbd)) continue
    const d = diemHopCau(e, c.cau)
    if (d.chan) continue
    const dayLai = d.dayLai === true
    if (!tot || d.diem > tot.hop + 1e-9 || (Math.abs(d.diem - tot.hop) <= 1e-9 && dayLai && !tot.dayLai)) {
      tot = { em: e, hop: d.diem, viSao: d.viSao, dayLai }
    }
  }
  return tot ? { em: tot.em, hop: tot.hop, viSao: tot.viSao } : null
}

/** Một chữ số thập phân, dấu phẩy kiểu Việt ("12,4") — dùng chung cho dòng tóm tắt và màn hình để hai nơi không lệch chữ. */
export const chuSoGiaTri = (n: number): string => (Math.round(n * 10) / 10).toString().replace('.', ',')

/**
 * Xếp cả buổi chữa.
 *
 * `dsEm` phải là hồ sơ ĐẦY ĐỦ (bài thi + bài tập về nhà + khắc phục câu sai),
 * xem `src/lib/ho-so-lop.ts`. Thiếu dữ liệu thì `diemHopCau` tự hạ điểm chứ
 * không loại em — em nào cũng phải có cơ hội lên bảng.
 */
export function xepBuoiChua(dsCau: CauVaoXep[], dsEm: HoSoEmDayDu[], yc: YeuCauBuoiChua = {}): KetQuaBuoiChua {
  const ch = yc.cauHinh ?? CAU_HINH_LEN_BANG_MAC_DINH
  const nganSach = nganSachGiay(ch)
  const canhBao: string[] = []

  const loc = yc.sbdChon && yc.sbdChon.length > 0 ? new Set(yc.sbdChon) : null
  const em = dsEm.filter((e) => e.coMat && (!loc || loc.has(e.sbd)))
  if (em.length === 0) canhBao.push('Không em nào có mặt — chưa xếp được ai lên bảng')

  const san = Math.min(ch.SO_EM_LEN_BANG_TOI_THIEU, em.length)
  const tran = Math.min(ch.SO_EM_LEN_BANG_TOI_DA, em.length)

  // CÂU CẦN DẠY LẠI → BẮT BUỘC (thầy chốt 19/09): có ÍT NHẤT MỘT em CÓ MẶT đã sai câu
  // ấy ≥ 3 lần mà chưa đúng lại lần nào thì câu đó vào danh sách bắt buộc — đi
  // vòng 1 cùng câu thầy chốt, không bị nhường chỗ cho câu dễ hơn. Em vắng thì
  // không ép được ai, nên chỉ soi em có mặt.
  const cauDayLai = new Set(dsCau.filter((c) => em.some((e) => canDayLaiCau(e, c.cau.id))).map((c) => c.cau.id))
  const thuTu = xepThuTuChua(dsCau.map((c) => (!c.batBuoc && cauDayLai.has(c.cau.id) ? { ...c, batBuoc: true } : c)))

  // Giá RẺ NHẤT của một câu khi chỉ đọc đáp án. Câu bắt buộc phải nêu bẫy nên
  // đắt hơn; câu thường đọc lướt là xong.
  const giayDoc = (c: CauVaoXep) => (c.batBuoc || c.cau.sao === 2 ? ch.GIAY_LANE.L1 : ch.GIAY_LANE.L0)
  const tongGiayDoc = thuTu.reduce((n, c) => n + giayDoc(c), 0)

  const dong: DongChua[] = []
  const daGoi = new Set<string>()
  const daChua = new Set<string>()
  let dung = 0
  let tongGiaTri = 0
  const batBuocChuaChua: CauChua[] = []

  /** Câu vào buổi vì có em CẦN DẠY LẠI mà em đứng lên không phải em ấy (em ấy bị chặn
   * bậc, hoặc vắng lượt) — vẫn phải nói cho thầy biết đây là câu dạy lại. */
  const lyDoGoi = (c: CauVaoXep, viSao: string) =>
    cauDayLai.has(c.cau.id) && !viSao.includes('dạy lại') ? `câu cần dạy lại (có em sai ≥ 3 lần chưa đúng lại) · ${viSao}` : viSao

  // ── THỜI GIAN (M1 + M5) ────────────────────────────────────────────────────
  /** `T = T_đọc + T_làm + T_chữa` của MỘT em ở câu này (`thoi-gian-len-bang.ts`): theo sao, độ dài đề, tỉ lệ lớp sai và bậc của
   * CHÍNH em đứng lên. Câu thiếu văn bản = 300/180/120 như cũ (`roiVeMacDinh`). */
  const thoiGianO = (c: CauVaoXep, e?: HoSoEmDayDu) =>
    thoiGianCau(
      {
        phan: c.cau.phan,
        sao: c.cau.sao,
        noiDung: c.noiDung,
        tiLeLopSai: c.tiLeDung === null ? undefined : 1 - c.tiLeDung,
        bacEm: e?.namKt?.get(c.cau.id)?.bac ?? null,
        heSo: c.heSoHieuChinh,
      },
      ch,
    )
  /** Tờ chiếu CHỈ ghép đôi hai câu cùng bậc bố cục 1 (`bo-cuc-to-chieu.ts`); câu bậc ≥ 2 đứng MỘT MÌNH (2/3 bảng) nên phải tính
   * ĐỦ T — M1 từng tính ½ cho mọi câu (nợ đã ghi ở M2, sửa ở M5). Chưa biết bậc (test dựng tối giản) ⇒ coi như ghép đôi được. */
  const ghepDuoc = (c: CauVaoXep) => (c.bacUoc ?? 1) === 1
  /** Giá ƯỚC nghiêng về phía ghép đôi (½ phần làm bài): CHỈ dùng cho MẬT ĐỘ giá trị/giây và GIỮ CHỖ SÀN, không trừ ngân sách. */
  const giayUoc = (c: CauVaoXep, e?: HoSoEmDayDu): number => {
    const t = thoiGianO(c, e)
    return t.roiVeMacDinh || !ghepDuoc(c) ? t.tong : giayBienGhepDoi(t)
  }

  /** Giá THÊM (ƯỚC) của việc nâng một câu từ đọc đáp án lên gọi em lên bảng. Chưa biết em nào thì tính bậc trung tính (giữ chỗ cho SÀN). */
  const themGiay = (c: CauVaoXep, e?: HoSoEmDayDu) => giayUoc(c, e) - giayDoc(c)

  // GHÉP SONG SONG THẬT (M5): các câu bậc 1 được chọn ghép đôi THEO THỨ TỰ CHỌN (đúng cách tờ chiếu ghép câu liền kề).
  // Câu thứ hai của một cặp chỉ tốn thêm giờ chữa của mình + phần giờ làm bài vượt em kia — rẻ hơn ½ khi hai câu dài bằng nhau
  // không đổi, và ĐẮT hơn ½ khi chỉ còn một câu bậc 1 lẻ (đứng một mình). `dung` cộng đúng theo phép này.
  let choGhep: { l: number } | null = null
  /** Giây THẬT thêm vào buổi khi xếp câu này cho em này (trước khi trừ phần đọc đáp án). */
  const chiPhiBien = (c: CauVaoXep, e: HoSoEmDayDu): number => {
    const t = thoiGianO(c, e)
    if (t.roiVeMacDinh || !ghepDuoc(c)) return t.tong
    const l = t.doc + t.lam
    return choGhep ? t.chua + Math.max(0, l - choGhep.l) : l + t.chua
  }
  /** Như `chiPhiBien` khi chưa biết em nào (bậc trung tính) — để chấm mật độ trước khi chọn em. */
  const chiPhiBienUoc = (c: CauVaoXep): number => {
    const t = thoiGianO(c)
    if (t.roiVeMacDinh || !ghepDuoc(c)) return t.tong
    const l = t.doc + t.lam
    return choGhep ? t.chua + Math.max(0, l - choGhep.l) : l + t.chua
  }
  const chotGhep = (c: CauVaoXep, e: HoSoEmDayDu) => {
    const t = thoiGianO(c, e)
    if (t.roiVeMacDinh || !ghepDuoc(c)) return
    choGhep = choGhep ? null : { l: t.doc + t.lam }
  }
  const themGiayThat = (c: CauVaoXep, e: HoSoEmDayDu) => chiPhiBien(c, e) - giayDoc(c)

  /** Giữ chỗ cho SÀN: tổng của đúng `n` giá thêm RẺ NHẤT còn lại, bỏ qua câu
   * đang cân nhắc.
   *
   * Phải cộng `n` giá rẻ nhất THẬT, không lấy giá rẻ nhất nhân `n`. Đo 14/09:
   * buổi 30 câu (18 câu 2 sao, 6 câu 1 sao, 6 câu 0 sao) — ước bằng phép nhân
   * thì máy tưởng còn rẻ, ăn 13 câu 2 sao rồi hết giờ ở 19 em; cộng đúng thì
   * dừng ở 9 câu 2 sao và đủ chỗ cho 21 em. Sai một phép ước là hụt đúng một
   * em, mà một em cũng là trượt sàn. */
  const giuChoChoSan = (n: number, boQuaId: string): number => {
    if (n <= 0) return 0
    const gia: number[] = []
    for (const c of thuTu) if (!daChua.has(c.cau.id) && c.cau.id !== boQuaId) gia.push(themGiay(c))
    gia.sort((a, b) => a - b)
    let tong = 0
    for (let i = 0; i < n && i < gia.length; i++) tong += gia[i]
    return tong
  }

  /** Còn đủ chỗ để nâng câu này lên tầng lên bảng không.
   *
   * Trừ luôn phần đọc đáp án của MỌI câu còn lại: nâng một câu mà làm cụt phần
   * đọc đáp án của cả buổi là đổi cái lớn lấy cái nhỏ.
   *
   * `giuChoSan` là chỗ thực hiện đúng câu "chữa câu khó và câu dễ ĐAN XEN" của
   * thầy. Tham lam thuần tuý sẽ ăn sạch ngân sách vào câu 2 sao: 13 câu 2 sao
   * là 3.900 giây, hết veo 4.920 và chỉ còn chỗ cho 18 em. Nên trước khi nâng
   * một câu đắt, phải chắc phần còn lại vẫn đủ cho số em còn thiếu tới SÀN,
   * tính theo câu RẺ NHẤT còn lại. Không đủ thì bỏ qua câu đắt ấy và đi tiếp —
   * nó rơi xuống tầng đọc đáp án, đúng luật "câu còn lại chỉ cần đọc đáp án".
   */
  const duCho = (c: CauVaoXep, e: HoSoEmDayDu, giuChoSan = false): boolean => {
    const them = themGiayThat(c, e)
    let giuCho = 0
    if (giuChoSan) {
      const conThieu = Math.max(0, san - daGoi.size - 1)
      giuCho = giuChoChoSan(conThieu, c.cau.id)
    }
    return dung + tongGiayDoc + them + giuCho <= nganSach
  }

  // ── DẠNG LỚP YẾU (M5) ─────────────────────────────────────────────────────
  // Dạng của câu lấy từ hồ sơ nắm kiến thức của em (`namKt.maDang`; máy chủ đời cũ không có ⇒ không có dạng nào ⇒ toàn bộ phần
  // này im lặng và Engine E chọn như trước, chỉ khác mật độ giá trị/giây trong cùng tầng).
  const dangCua = new Map<string, string>()
  for (const c of dsCau) {
    for (const e of em) {
      const d = e.namKt?.get(c.cau.id)?.maDang
      if (d) {
        dangCua.set(c.cau.id, d)
        break
      }
    }
  }
  const dangYeuLop = new Set<string>()
  {
    const tk = new Map<string, { n: number; yeu: number }>()
    const daDem = new Set<string>()
    for (const c of dsCau) {
      const d = dangCua.get(c.cau.id)
      if (!d) continue
      for (const e of em) {
        const k = `${d}|${e.sbd}`
        if (daDem.has(k)) continue
        const y = emYeuDang(e, c.cau.id)
        if (y === null) continue
        daDem.add(k)
        const t = tk.get(d) ?? { n: 0, yeu: 0 }
        t.n++
        if (y) t.yeu++
        tk.set(d, t)
      }
    }
    for (const [d, t] of tk) if (t.n >= HOC_NHIEU.DANG_YEU_LOP_TOI_THIEU_EM && t.yeu / t.n >= HOC_NHIEU.DANG_YEU_LOP_TL_EM) dangYeuLop.add(d)
  }
  const dangDaPhu = new Set<string>()
  const dangYeuCua = (c: CauVaoXep) => {
    const d = dangCua.get(c.cau.id)
    return d && dangYeuLop.has(d) ? d : null
  }
  const laDangYeuChuaPhu = (c: CauVaoXep) => {
    const d = dangYeuCua(c)
    return d !== null && !dangDaPhu.has(d)
  }
  const tiLeSai = (c: CauVaoXep) => (c.tiLeDung === null ? 0.5 : 1 - c.tiLeDung)
  /** GIÁ TRỊ một câu = tỉLệLớpSai × (1 + 0,5 × [dạng lớp yếu CHƯA có câu nào được chữa trong buổi]). Câu bắt buộc không "vô hạn" ở
   * đây: bắt buộc là TẦNG (luôn chọn trước), giá trị chỉ dùng để sắp trong tầng và để báo con số. */
  const giaTri = (c: CauVaoXep) => tiLeSai(c) * (1 + HOC_NHIEU.HE_SO_DANG_YEU * (laDangYeuChuaPhu(c) ? 1 : 0))

  /** Chọn câu kế tiếp trong MỘT tầng (`pool`): RÀNG BUỘC — còn câu phủ được dạng lớp yếu chưa có câu nào thì KHÔNG chọn câu thứ hai
   * của dạng đã phủ; rồi lấy câu có MẬT ĐỘ giá trị/giây cao nhất (bằng nhau: câu đứng trước đề). */
  const chonCauKe = (pool: CauVaoXep[]): CauVaoXep | null => {
    if (pool.length === 0) return null
    const conDangChuaPhu = pool.some(laDangYeuChuaPhu)
    const ungVien = conDangChuaPhu ? pool.filter((c) => { const d = dangYeuCua(c); return d === null || !dangDaPhu.has(d) }) : pool
    let tot: { c: CauVaoXep; mat: number } | null = null
    for (const c of ungVien) {
      // Mật độ theo giá THÊM THẬT của câu này ở trạng thái ghép hiện tại: còn một câu bậc 1 đang chờ bạn thì câu vừa/ngắn hơn nó gần
      // như chỉ tốn giờ chữa — nhờ đó các cặp gồm hai câu dài GẦN BẰNG NHAU (ghép lệch là phí giờ làm bài dài hơn của cặp).
      const mat = giaTri(c) / Math.max(1, chiPhiBienUoc(c))
      if (!tot || mat > tot.mat + 1e-12 || (Math.abs(mat - tot.mat) <= 1e-12 && c.cau.viTri < tot.c.cau.viTri)) tot = { c, mat }
    }
    return tot ? tot.c : null
  }

  /** Thử xếp MỘT câu: chọn em, kiểm giờ, ghi vào buổi. `false` = không xếp được (không em nào nhận / hết giờ). */
  const thuXep = (c: CauVaoXep, giuChoSan: boolean): boolean => {
    // Chọn em TRƯỚC rồi mới kiểm giờ: chi phí phụ thuộc bậc của em đứng lên.
    // Null = không em còn lại nào NHẬN được câu này (bị chặn bậc "biết"), chứ không hẳn hết em: câu khác vẫn còn em nhận được.
    const chon = chonEm(c, em, daGoi, c.emDaDinh)
    if (!chon || !duCho(c, chon.em, giuChoSan)) return false
    dung += themGiayThat(c, chon.em)
    chotGhep(c, chon.em)
    tongGiaTri += giaTri(c)
    const d = dangYeuCua(c)
    if (d) dangDaPhu.add(d)
    daGoi.add(chon.em.sbd)
    daChua.add(c.cau.id)
    dong.push({ tang: 'len_bang', cau: c.cau, giay: 0, em: chon.em, viSao: lyDoGoi(c, chon.viSao), hop: chon.hop })
    return true
  }

  // Tầng ưu tiên đã chốt: bắt buộc (2→1→0 sao) rồi câu thường (2→1→0 sao). TRONG từng tầng chọn theo mật độ giá trị/giây + phủ dạng.
  const CAC_TANG: readonly (readonly [boolean, 0 | 1 | 2])[] = [[true, 2], [true, 1], [true, 0], [false, 2], [false, 1], [false, 0]]
  const chayVong = (vong: 1 | 2 | 3) => {
    const gioiHan = vong === 2 ? Math.min(san, tran) : tran
    for (const [batBuoc, sao] of CAC_TANG) {
      if (vong === 1 && !batBuoc) return
      const daThu = new Set<string>() // đã thử mà không xếp được trong vòng này — không thử lại
      for (;;) {
        if (daGoi.size >= gioiHan) return
        const c = chonCauKe(thuTu.filter((x) => x.batBuoc === batBuoc && x.cau.sao === sao && !daChua.has(x.cau.id) && !daThu.has(x.cau.id)))
        if (!c) break
        if (!thuXep(c, vong === 2)) {
          daThu.add(c.cau.id)
          if (vong === 1) batBuocChuaChua.push(c.cau)
        }
      }
    }
  }

  // ── VÒNG 1: CÂU BẮT BUỘC — phải chữa hết, không nhường chỗ cho ai ─────────
  chayVong(1)
  // ── VÒNG 2: cho tới khi ĐẠT SÀN — dừng ở SÀN chứ không ở TRẦN: gọi thừa em là cắt mất giờ chữa của câu khó ──
  chayVong(2)
  // ── VÒNG 3: CÒN GIỜ THÌ GỌI THÊM, nhưng chỉ tới trần ──────────────────────
  chayVong(3)

  // GIỜ THẬT của từng dòng: cặp câu bậc 1 chia đều phần làm bài dài hơn (`max(T_đọc+T_làm)/2` mỗi em) cộng T_chữa của em ấy; câu đứng
  // một mình (bậc ≥ 2, hoặc câu bậc 1 lẻ, hoặc thiếu văn bản = 300/180/120) mang trọn T. Tổng các dòng = đúng thứ `dung` đã cộng.
  {
    let cho: { d: DongChua; l: number; cc: number } | null = null
    for (const d of dong) {
      if (d.tang !== 'len_bang') continue
      const c = thuTu.find((x) => x.cau.id === d.cau.id)!
      const t = thoiGianO(c, d.em!)
      if (t.roiVeMacDinh || !ghepDuoc(c)) {
        d.giay = t.tong
        continue
      }
      const l = t.doc + t.lam
      if (cho) {
        const maxL = Math.max(cho.l, l)
        cho.d.giay = cho.cc + maxL / 2
        d.giay = t.chua + maxL / 2
        cho = null
      } else {
        d.giay = l + t.chua
        cho = { d, l, cc: t.chua }
      }
    }
  }

  // ── TẦNG 2: mọi câu còn lại chỉ đọc đáp án ────────────────────────────────
  const cauDocDapAn: CauChua[] = []
  // Câu 2 sao mà MỌI em còn chưa được gọi đều đang bị chặn (bậc "biết") — nói đúng
  // lý do, đừng để thầy tưởng "lớp làm được" hay "hết giờ".
  const emConRanh = em.filter((e) => !daGoi.has(e.sbd))
  const khongEmNhan = (c: CauVaoXep) => c.cau.sao === 2 && emConRanh.length > 0 && emConRanh.every((e) => lyDoChanCau(e, c.cau) !== null)
  const cauKhongEmNhan: CauChua[] = []
  for (const c of thuTu) {
    if (daChua.has(c.cau.id)) continue
    cauDocDapAn.push(c.cau)
    const chanHet = khongEmNhan(c)
    if (chanHet) cauKhongEmNhan.push(c.cau)
    const viSao = chanHet
      ? 'mọi em còn lại đều ở bậc "biết" của dạng này — chưa nhận câu 2 sao, thầy giảng và chiếu đáp án'
      : c.batBuoc
        ? 'bắt buộc chữa nhưng hết giờ gọi em — chiếu đáp án'
        : 'lớp làm được, chỉ cần đáp án'
    dong.push({ tang: 'doc_dap_an', cau: c.cau, giay: giayDoc(c), em: null, viSao, hop: 0 })
  }

  const tongGiay = dong.reduce((n, d) => n + d.giay, 0)
  const soEmLenBang = daGoi.size

  let thieu: KetQuaBuoiChua['thieu'] = null
  if (soEmLenBang < ch.SO_EM_LEN_BANG_TOI_THIEU) {
    const con = ch.SO_EM_LEN_BANG_TOI_THIEU - soEmLenBang
    // NÓI ĐÚNG LÝ DO. Ba lý do khác nhau, ba cách xử khác nhau.
    const viSao =
      em.length < ch.SO_EM_LEN_BANG_TOI_THIEU
        ? `lớp chỉ có ${em.length} em có mặt`
        : thuTu.length <= daChua.size
          ? `chỉ có ${thuTu.length} câu để chữa — tích thêm ít nhất ${con} bài nữa`
          : // Còn câu chưa chữa mà KHÔNG em nào còn lại nhận được (bị chặn bậc "biết" ở câu 2 sao) thì
            // giờ không phải thủ phạm: nới giờ cũng không thêm được em nào.
            !thuTu.some((c) => !daChua.has(c.cau.id) && !khongEmNhan(c))
            ? `còn ${cauKhongEmNhan.length} câu chưa chữa nhưng mọi em còn lại đều ở bậc "biết" của dạng ấy (chưa nhận câu 2 sao) — tích thêm câu 1 sao / 0 sao`
            : `hết ngân sách ${Math.round(nganSach / 60)} phút — nới giờ buổi hoặc bỏ bớt câu bắt buộc`
    thieu = { soEmConThieu: con, viSao }
    canhBao.push(`Mới xếp được ${soEmLenBang}/${ch.SO_EM_LEN_BANG_TOI_THIEU} em lên bảng: ${viSao}`)
  }
  if (batBuocChuaChua.length > 0) {
    canhBao.push(`${batBuocChuaChua.length} câu bắt buộc chưa gọi được em nào — sẽ chiếu đáp án, thầy cân nhắc nới giờ`)
  }
  // Câu dài tới mức chiếm cả bảng (bậc 5) mà có em lên bảng: thầy cần biết TRƯỚC để chuẩn bị bảng phụ / cân nhắc bỏ câu.
  const cauChiemCaBang = dong.filter((d) => d.tang === 'len_bang' && dsCau.find((c) => c.cau.id === d.cau.id)?.bacUoc === 5).map((d) => d.cau)
  if (cauChiemCaBang.length > 0) {
    canhBao.push(
      `${cauChiemCaBang.length} câu dài tới mức chiếm cả bảng (em làm ở bảng phụ): ${cauChiemCaBang.map((c) => `Phần ${c.phan} câu ${c.so}`).join(' · ')}`,
    )
  }
  if (cauKhongEmNhan.length > 0) {
    canhBao.push(
      `${cauKhongEmNhan.length} câu 2 sao chưa gọi được em nào: mọi em còn lại đều ở bậc "biết" của dạng ấy — chiếu đáp án, thầy giảng`,
    )
  }

  // Dạng lớp yếu mà buổi chưa chạm tới: nói tên để thầy thêm câu hoặc nới giờ — không lặng lẽ bỏ.
  const dangYeuChuaPhu = [...dangYeuLop].filter((d) => !dangDaPhu.has(d)).sort()
  if (dangYeuChuaPhu.length > 0) {
    canhBao.push(`${dangYeuChuaPhu.length} dạng lớp yếu chưa có câu nào được chữa: ${dangYeuChuaPhu.map((d) => d.replace(/^CD:/, '')).join(' · ')} — tích thêm câu ở dạng ấy hoặc nới giờ`)
  }
  const tomTatHocNhieu = [
    `giá trị chữa ${chuSoGiaTri(tongGiaTri)}`,
    ...(dangYeuLop.size > 0 ? [`phủ ${dangDaPhu.size}/${dangYeuLop.size} dạng lớp yếu`] : []),
    `${soEmLenBang} em lên bảng`,
    `${cauDocDapAn.length} câu dời buổi sau`,
  ].join(' · ')

  return {
    hocNhieu: { tongGiaTri, soDangYeu: dangYeuLop.size, soDangYeuDaPhu: dangDaPhu.size, dangYeuChuaPhu, soCauDoiBuoiSau: cauDocDapAn.length, tomTat: tomTatHocNhieu },
    dong,
    soEmLenBang,
    soEmToiThieu: ch.SO_EM_LEN_BANG_TOI_THIEU,
    datSan: soEmLenBang >= ch.SO_EM_LEN_BANG_TOI_THIEU,
    thieu,
    tongGiay,
    nganSach,
    cauDocDapAn,
    batBuocChuaChua,
    cauChiemCaBang,
    canhBao,
  }
}

/** Bảng chữ để thầy copy sang giáo án hoặc nhóm Zalo. */
export function bangChuBuoiChua(kq: KetQuaBuoiChua, tenNguon: string): string {
  const d: string[] = [`Buổi chữa · ${tenNguon}`, `${kq.soEmLenBang} em lên bảng · ${Math.round(kq.tongGiay / 60)}/${Math.round(kq.nganSach / 60)} phút`, kq.hocNhieu.tomTat]
  const lenBang = kq.dong.filter((x) => x.tang === 'len_bang')
  if (lenBang.length > 0) {
    d.push('', 'GỌI LÊN BẢNG')
    lenBang.forEach((x, i) => {
      const sao = x.cau.sao ? ' ' + '★'.repeat(x.cau.sao) : ''
      // BÀI TẬP VỀ NHÀ đứng NGAY SAU tên em (thầy chốt 14/09): thầy cầm bảng
      // này gọi lên, cần biết ngay em ấy ở nhà làm câu này ra sao và làm được
      // bao nhiêu câu trên tổng số câu được giao.
      const kb = x.em ? btvnCuaCau(x.em, x.cau.id) : null
      const nhan = kb ? ` [${CHU_BTVN[kb]}]` : ''
      const tom = x.em && x.em.btvn.soCauGiao > 0 ? ` · ${tomTatBtvn(x.em)}` : ''
      d.push(
        `${i + 1}. Phần ${x.cau.phan} câu ${x.cau.so}${sao} (${Math.round(x.giay / 60)} phút) → ${x.em?.hoTen || x.em?.sbd}${nhan}${tom} · ${x.viSao}`,
      )
    })
  }
  if (kq.cauDocDapAn.length > 0) {
    d.push('', `CHỈ ĐỌC ĐÁP ÁN — ${kq.cauDocDapAn.length} câu, chiếu lên bảng`)
    d.push(kq.cauDocDapAn.map((c) => `Phần ${c.phan} câu ${c.so}`).join(' · '))
  }
  for (const c of kq.canhBao) d.push('', `⚠ ${c}`)
  return d.join('\n')
}

/** Chuyên đề của câu, chuẩn hoá — dùng chung với `phan-cong.ts`. */
export const chuanCd = chuanChuyenDe
