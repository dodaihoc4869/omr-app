// THUẬT TOÁN 2.0 (Game Hóa 2.0, thầy chốt 27/09/2026) — LÕI THUẦN, không đụng D1.
// Đặc tả: prompt-game-hoa-2-0.md mục B. Trạng thái từng câu KHÔNG lưu riêng: suy lại từ sổ `su_kien_hoc`
// (mọi nguồn: ca kiểm tra, game, lên bảng) bằng `phatLaiCau` — một nguồn sự thật, xoá đệm dựng lại vẫn ra y hệt.
//
// Bản tối ưu so với đặc tả gốc (đã trình thầy): so lịch theo NGÀY giờ VN; chuỗi đúng = 1 cũng hẹn lại;
// sai thì bỏ cờ thành thạo; đúng lần hai cùng ngày không cộng (trừ ngày cuối); câu đã thành thạo không ép ôn
// hằng ngày sát hạn; cắt tỉa = rời hẳn kế hoạch sang "Cần thầy dạy lại"; câu mới giữ chỗ để phủ 100% trước hạn 3 ngày;
// Huyết Chiến đếm theo LƯỢT cần (không đếm câu) và có trần 80.
//
// OMNI 3 (05/10, đặc tả DAC-TA-BUILD-OMNI-3-0510.md mục 1 bước 3 + 11, mục 4.9): `lapKeHoachNgay` nhận thêm TUỲ CHỌN nhiều bài song song (`chienDich`),
// trọng số câu (`trongSoCau`), dạng đã vững (`dangVung`), ôn bài cũ (`onBaiCu`, `tiLeOnBaiCu`), chế độ chờ bài mới (`cheDoCho`). Vắng mọi trường mới ⇒ JSON
// kế hoạch Y HỆT bản trước (khoá bằng tests/omni-3-ke-hoach-chot-cu.test.ts, 30 kịch bản).
import { THAM_SO_OMNI } from './omni-kieu'
import {
  PHAN_BO_BAC, xepCauMoiTheoZpd,
  type BacCauChienDich, type HoSoZpdDang,
} from '../../src/lib/phan-bo-theo-bac'

export type Phan = 'I' | 'II' | 'III'

/** Câu thuộc phạm vi luyện của em. `nguon`: câu của chiến dịch đang chạy, nợ cũ, ôn duy trì, hay (OMNI 3) ôn bài cũ. */
export interface CauSrs {
  qid: string
  phan: Phan
  mucDo: string | null
  dang: string | null
  nguon?: 'chien_dich' | 'no_cu' | 'duy_tri' | 'on_bai_cu'
  /** Số sao "cần chữa" của câu trong kho (chỉ-thêm 29/09, Sổ nợ): 2 sao đang nợ ⇒ ưu tiên ngang câu sai 2 lần. */
  sao?: number
  /**
   * OMNI 3 — NHIỀU BÀI SONG SONG: id chiến dịch của câu chiến dịch (nguồn `chien_dich`). `lapKeHoachNgay` (khi có `TuyChonKeHoach.chienDich`) chia quota câu
   * mới theo chiến dịch này; vắng / không khớp chiến dịch đang chạy nào ⇒ tính vào chiến dịch hạn gần nhất. Chỉ có khi OMNI bật (cờ tắt ⇒ không có khoá này).
   */
  cd?: string
}

/** Một lần làm câu, đã lọc sẵn (bỏ sự kiện ca chưa công bố). `coGoiY` = máy chủ đã cho gợi ý M3 trước khi em trả lời. */
export interface LanLam {
  qid: string
  /** Ngày giờ Việt Nam YYYY-MM-DD. */
  ngay: string
  /** ISO 8601 — chỉ để xếp thứ tự trong ngày. */
  luc: string
  dung: boolean
  coGoiY: boolean
  /** Vòng học v2 (02/10): lần làm CÂU SONG SINH của câu này (qid sổ "<gốc>~ss0..3", đã quy về gốc) — hoặc lần làm CÂU ANH EM thay cho câu này (05/10). */
  songSinh?: true
  /** 05/10 (lam-lai-so.ts): lần làm này là dòng sổ của CÂU ANH EM (qid thật ở đây) quy về câu gốc nó thay — để thống kê gộp không đếm đôi. */
  cauAnhEm?: string
  /**
   * Nguồn trong sổ (`su_kien_hoc.nguon`, chỉ-thêm 29/09). `'dau_gio'` (Kiểm tra đầu giờ) ĐÚNG ⇒ thầy xác nhận: thành thạo NGAY kể cả
   * câu 2 sao. Vắng ⇒ như nguồn thường.
   */
  nguon?: string
}

export interface TrangThaiCau {
  qid: string
  laMoi: boolean
  /** Chuỗi đúng liên tiếp (tính theo ngày khác nhau). */
  cc: number
  /** Số lần sai kể từ lần thầy dạy lại gần nhất. */
  lanSai: number
  thanhThao: boolean
  /** Ngày đến lịch ôn lại (ngày VN). `null` = chưa làm, hoặc không cần ôn thêm trước hạn nộp. */
  henOn: string | null
  ngayDungCuoi: string | null
  lanCuoiDung: boolean | null
  /** Sai ≥ 4 lần và lần cuối vẫn sai ⇒ rời kế hoạch, chờ thầy dạy lại. */
  catTia: boolean
  lichSu: { ngay: string; dung: boolean; coGoiY: boolean }[]
  /** Thành thạo NGAY từ lần làm đầu (đúng, không gợi ý, câu khó đoán mò — `laCauKhoDoanMo`) — chỉ có mặt khi `true`; sai về sau thì bỏ. */
  thanhThaoLanDau?: true
  /** SỔ NỢ (29/09): ngày sai ĐẦU TIÊN của đợt nợ hiện tại (xoá khi thành thạo lại) — xếp "nợ lâu trước". */
  ngayVaoNo?: string
  /** Ngày (VN) thầy bấm "Chữa xong"/"Thầy đã chữa" gần nhất — xếp "vừa chữa" và nhãn "Thầy đã chữa dd/mm". */
  ngayChua?: string
}

export const TRAN_NGAY = 40
export const TRAN_HUYET_CHIEN = 80
/** Thầy 28/09: trần Huyết Chiến TỰ TÍNH theo thể lực của chiến dịch = GẤP ĐÔI thể lực/ngày (giữ tỉ lệ gốc 40 → 80), không cố định 80. */
export const tranHuyetChienTheo = (theLucNgay: number): number => 2 * Math.max(1, Math.floor(theLucNgay))
export const NGAY_DEM = 3
export const NGUONG_CAT_TIA = 4
export const TI_LE_DUY_TRI = 0.2
const HEN_DUNG_1 = 3
const HEN_DUNG_2 = 7
const HEN_DUNG_3 = 14
export const HEN_DUY_TRI = 30
/** SỔ NỢ (thầy chốt 29/09): câu 2 sao đã thành thạo ôn duy trì sau 14 ngày (câu thường 30). */
export const HEN_DUY_TRI_2_SAO = 14
/** Trần nợ khi có chiến dịch: tối đa 50% số lượt trong ngày (phần còn lại dành cho câu mới). */
export const TI_LE_TRAN_NO = 0.5
/** Nguồn sổ của Kiểm tra đầu giờ (hợp đồng docs/so-no-2909/HOP-DONG.md). */
export const NGUON_DAU_GIO = 'dau_gio'
/**
 * THÀNH THẠO LẦN ĐẦU (thầy CHỐT 28/09/2026): câu làm ĐÚNG ngay lần đầu, KHÔNG gợi ý ⇒ thành thạo luôn, không ôn lại
 * trong chiến dịch (chỉ còn ôn duy trì sau hạn) — CHỈ với câu KHÓ ĐOÁN MÒ (`laCauKhoDoanMo`):
 *   · Phần II đúng cả 4 ý (sổ chỉ ghi `dung` khi đủ 4 ý; đoán mò trúng ~1/16),
 *   · Phần III (điền số, đoán mò ~0),
 *   · Phần I mức Nhận biết.
 * Lý do bỏ Phần I Thông hiểu/Vận dụng: 4 phương án ⇒ đoán mò trúng ~25%, mô phỏng lớp yếu có tới 45% câu thành thạo "ảo".
 * Câu 2 sao (mọi phần), câu đúng nhờ gợi ý, câu sai lần đầu, Phần I Thông hiểu/Vận dụng: luật cũ (đúng 2 ngày khác nhau).
 * Câu đã thành thạo (kể cả thành thạo lần đầu) mà làm sai ⇒ mất thành thạo như cũ.
 * Lùi về luật cũ: đổi `true` → `false` (một dòng).
 */
export const THANH_THAO_LAN_DAU = true
/** Số sao từ mức này trở lên vẫn phải đúng 2 ngày khác nhau (câu vận dụng cao đánh dấu 2 sao trong kho). */
export const SAO_PHAI_ON = 2
/** Tuỳ chọn phát lại một câu: loại câu trong kho. `sao` vắng = 0; `phan` vắng ⇒ KHÔNG áp thành thạo lần đầu (thận trọng). */
export interface TuyChonPhatLai { sao?: number | null; phan?: Phan | null; mucDo?: string | null }

/** Câu khó đoán mò (được "thành thạo lần đầu"): Phần II, Phần III, Phần I Nhận biết; trừ câu 2 sao. */
export function laCauKhoDoanMo(tc: TuyChonPhatLai): boolean {
  if ((Number(tc.sao) || 0) >= SAO_PHAI_ON) return false
  if (tc.phan === 'II' || tc.phan === 'III') return true
  return tc.phan === 'I' && tc.mucDo != null && HANG_MUC_DO[tc.mucDo] === 0
}

/** Số ngày ôn duy trì của câu đã thành thạo: 2 sao 14 ngày, còn lại 30 ngày. */
export const soNgayDuyTri = (sao: number | null | undefined): number => ((Number(sao) || 0) >= SAO_PHAI_ON ? HEN_DUY_TRI_2_SAO : HEN_DUY_TRI)

/** Hẹn của câu thành thạo lần đầu (và câu Đạt ở Kiểm tra đầu giờ): không ôn trong chiến dịch — ôn duy trì sau `soNgay` ngày và SAU hạn nộp. */
export function henThanhThaoLanDau(ngay: string, hanNop: string | null, soNgay = HEN_DUY_TRI): string {
  const duyTri = congNgay(ngay, soNgay)
  return hanNop && ngay <= hanNop && duyTri <= hanNop ? congNgay(hanNop, 1) : duyTri
}

// ---------------------------------------------------------------- ngày VN dạng chuỗi
const MOT_NGAY = 86_400_000
/** Ngày VN (YYYY-MM-DD) của một mốc ISO; chuỗi lạ ⇒ 10 ký tự đầu. */
export const ngayVnCuaIso = (iso: string): string => {
  const ms = Date.parse(iso)
  return Number.isFinite(ms) ? new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10) : iso.slice(0, 10)
}
const msNgay = (ngay: string): number => Date.parse(`${ngay}T00:00:00Z`)
export const congNgay = (ngay: string, so: number): string => new Date(msNgay(ngay) + so * MOT_NGAY).toISOString().slice(0, 10)
/** Số ngày từ `a` tới `b` (b − a). */
export const soNgayGiua = (a: string, b: string): number => Math.round((msNgay(b) - msNgay(a)) / MOT_NGAY)
/** D: số ngày còn lại tới hạn nộp, TÍNH CẢ hôm nay (hạn nộp là 23:59 của ngày `hanNop`). Tối thiểu 1. */
export const soNgayConLai = (homNay: string, hanNop: string): number => Math.max(1, soNgayGiua(homNay, hanNop) + 1)

// ---------------------------------------------------------------- phát lại lịch sử một câu
/**
 * Hẹn ôn theo luật "ép chín sát hạn".
 * - Trước hạn: khoảng chuẩn nếu còn đủ ngày; không đủ ⇒ câu chưa thành thạo ôn ngày mai (ngày cuối: ngay trong ngày),
 *   câu đã thành thạo ôn chốt MỘT lần vào ngày áp chót (hết chỗ ⇒ không ôn thêm trước hạn).
 * - Sau hạn (nợ cũ, ôn duy trì): khoảng chuẩn, không nén; câu đã thành thạo hẹn ≥ 30 ngày.
 */
export function henOnSau(ngay: string, soNgayChuan: number, hanNop: string | null, daThanhThao: boolean, duyTri = HEN_DUY_TRI): string {
  if (!hanNop || ngay > hanNop) return congNgay(ngay, daThanhThao ? Math.max(soNgayChuan, duyTri) : soNgayChuan)
  const D = soNgayConLai(ngay, hanNop)
  if (D > soNgayChuan) return congNgay(ngay, soNgayChuan)
  if (daThanhThao) {
    const apChot = congNgay(hanNop, -1)
    // Hết chỗ ôn chốt trước hạn ⇒ không ôn thêm trong chiến dịch; sau hạn vào ôn duy trì.
    return apChot > ngay ? apChot : congNgay(ngay, duyTri)
  }
  return D > 1 ? congNgay(ngay, 1) : ngay
}

/**
 * Trạng thái MỘT câu từ các lần làm (mọi nguồn). `mocDayLai`: các thời điểm thầy bấm "Chữa xong" cho câu này —
 * đếm sai về 0 và hẹn ôn ngày hôm sau.
 */
export function phatLaiCau(qid: string, lanLam: readonly LanLam[], hanNop: string | null, mocDayLai: readonly string[] = [], tuyChon: TuyChonPhatLai = {}): TrangThaiCau {
  const duocLanDau = THANH_THAO_LAN_DAU && laCauKhoDoanMo(tuyChon)
  const duyTri = soNgayDuyTri(tuyChon.sao)
  const ds = [...lanLam].filter((x) => x.qid === qid).sort((a, b) => (a.luc < b.luc ? -1 : a.luc > b.luc ? 1 : 0))
  const moc = [...mocDayLai].sort()
  let iMoc = 0
  const tt: TrangThaiCau = { qid, laMoi: true, cc: 0, lanSai: 0, thanhThao: false, henOn: null, ngayDungCuoi: null, lanCuoiDung: null, catTia: false, lichSu: [] }
  const quaMoc = (den: string) => {
    while (iMoc < moc.length && moc[iMoc]! <= den) {
      tt.lanSai = 0
      tt.catTia = false
      tt.ngayChua = ngayVnCuaIso(moc[iMoc]!)
      // 02/10: ngày HÔM SAU theo giờ VN (mốc là ISO UTC — cắt 10 ký tự đầu lấy ngày UTC, bấm lúc 0–7 giờ sáng VN thì hẹn ngay hôm đó).
      if (!tt.laMoi) tt.henOn = congNgay(ngayVnCuaIso(moc[iMoc]!), 1)
      iMoc++
    }
  }
  for (const x of ds) {
    quaMoc(x.luc)
    const D = hanNop && x.ngay <= hanNop ? soNgayConLai(x.ngay, hanNop) : Number.POSITIVE_INFINITY
    if (x.dung && x.nguon === NGUON_DAU_GIO) {
      // KIỂM TRA ĐẦU GIỜ — Đạt (thầy chốt 29/09): thầy xác nhận ⇒ thành thạo NGAY, kể cả câu 2 sao; hẹn duy trì 30 ngày (2 sao 14).
      tt.cc = Math.max(tt.cc, 2)
      tt.ngayDungCuoi = x.ngay
      tt.thanhThao = true
      delete tt.thanhThaoLanDau
      tt.henOn = henThanhThaoLanDau(x.ngay, hanNop, duyTri)
    } else if (x.dung && tt.laMoi && !x.coGoiY && duocLanDau) {
      // Thành thạo lần đầu: coi như đã đủ chuỗi 2 ngày; không hẹn ôn trong chiến dịch.
      tt.cc = 2
      tt.ngayDungCuoi = x.ngay
      tt.thanhThao = true
      tt.thanhThaoLanDau = true
      tt.henOn = henThanhThaoLanDau(x.ngay, hanNop)
    } else if (x.dung) {
      if (tt.laMoi || x.coGoiY) tt.cc = 1
      else if (tt.ngayDungCuoi !== x.ngay || D <= 1) tt.cc += 1
      tt.ngayDungCuoi = x.ngay
      tt.thanhThao = tt.cc >= 2
      if (!tt.thanhThao) delete tt.thanhThaoLanDau
      const so = tt.cc >= 3 ? HEN_DUNG_3 : tt.cc === 2 ? HEN_DUNG_2 : HEN_DUNG_1
      // Câu thành thạo lần đầu làm đúng lại (ví dụ gặp trong ca kiểm tra): vẫn không kéo vào ôn trong chiến dịch.
      tt.henOn = tt.thanhThaoLanDau ? henThanhThaoLanDau(x.ngay, hanNop) : henOnSau(x.ngay, so, hanNop, tt.thanhThao, duyTri)
    } else {
      tt.cc = 0
      tt.lanSai += 1
      tt.thanhThao = false
      delete tt.thanhThaoLanDau
      // SỔ NỢ (29/09): sai hôm nay ⇒ tới lịch NGÀY MAI ở mọi nguồn, kể cả sau hạn / không chiến dịch (ngày cuối trước hạn: ngay trong ngày).
      tt.henOn = henOnSau(x.ngay, 1, hanNop, false)
      if (!tt.ngayVaoNo) tt.ngayVaoNo = x.ngay
    }
    if (tt.thanhThao) delete tt.ngayVaoNo
    tt.laMoi = false
    tt.lanCuoiDung = x.dung
    tt.lichSu.push({ ngay: x.ngay, dung: x.dung, coGoiY: x.coGoiY })
    tt.catTia = tt.lanSai >= NGUONG_CAT_TIA && !x.dung
  }
  quaMoc('9999')
  return tt
}

/** Bật gợi ý M3 cho lần làm tới: lần cuối sai, đã sai ≥ 2 lần, chưa cắt tỉa. */
export const canGoiY = (t: TrangThaiCau): boolean => !t.laMoi && t.lanCuoiDung === false && t.lanSai >= 2 && !t.catTia

// ---------------------------------------------------------------- kế hoạch ngày
export interface TuyChonKeHoach {
  homNay: string
  /** Hạn nộp của chiến dịch đang chạy (ngày VN). `null` ⇒ không có chiến dịch: chỉ ôn. */
  hanNop: string | null
  tranNgay?: number
  tranHuyetChien?: number
  /**
   * BỐC CÂU MỚI CÁ NHÂN HOÁ (thầy chốt 28/09) — hạng của em THEO TỪNG DẠNG (khoá = `dang` của câu). Vắng ⇒ hành vi cũ
   * (Nhận biết → Vận dụng cao cho mọi em). Dạng không có trong bảng ⇒ `hangChung`.
   */
  hangTheoDang?: Readonly<Record<string, HangEm>>
  /** Hạng chung của em (gộp mọi dạng) cho dạng chưa có dữ liệu. Vắng ⇒ L2. */
  hangChung?: HangEm
  /**
   * PHÂN BỔ THEO HỒ SƠ (08/10): bật ⇒ (1) trần ngày là trần riêng theo hạng chung; (2) câu MỚI bắt buộc của từng dạng
   * chỉ tới tối đa một bậc trên hạng hiện tại của em. Câu đã sai / tới lịch ôn KHÔNG BAO GIỜ bị lọc bởi giới hạn này — luôn đi trước
   * để khép kín siêu vòng lặp. Vắng ⇒ giữ nguyên hợp đồng cũ.
   */
  phanBoTheoHoSo?: boolean
  /** ZPD 08/10: hồ sơ đủ sâu theo dạng để đổi MIX câu mới; không đổi tổng quota, câu ôn/nợ không đi qua đây. */
  hoSoZpdTheoDang?: Readonly<Record<string, HoSoZpdDang>>
  /** 0 = thuần ZPD · 1 = đúng phân bố nền của kho. Mặc định luyện chiến dịch = 0,35. */
  alphaZpd?: number
  /**
   * RẢI ĐỀU CÂU MỚI THEO NGÀY (thầy chốt 30/09): bật ⇒ số câu MỚI mỗi ngày dừng đúng quota `ceil(số mới còn / (D − NGAY_DEM))`, KHÔNG đổ thêm câu mới
   * cho đủ thể lực; lượt dư dồn cho nợ / củng cố / duy trì (tỉ lệ cũ), đủ quota câu mới thì nợ tới lịch lấp nốt lượt dư (vượt trần 50 %), vẫn dư thì thôi. VẮNG ⇒ TẮT = hành vi cũ (đổ câu mới cho đầy thể lực);
   * tầng đọc chiến dịch (`srs2-d1.ts`) quy chiến dịch không đặt (null) ⇒ BẬT.
   */
  raiDeu?: boolean
  /**
   * Số câu MỚI của kế hoạch hôm nay em ĐÃ LÀM (chỉ dùng khi `raiDeu`): lập LẠI kế hoạch giữa ngày (thay câu không phục vụ được) thì quota hôm nay
   * trừ đi phần đã làm, không cộng dồn thêm câu mới. Vắng ⇒ 0.
   */
  moiDaLamHomNay?: number
  /**
   * VÒNG HỌC v2 — NHỊP RIÊNG TỪNG EM (thầy 02/10: "khắc phục luôn giới hạn này"): tỉ lệ trần nợ khi chiến dịch còn câu mới. Em có nhiều câu nợ đến
   * hạn so với số câu em thực làm mỗi ngày ⇒ tỉ lệ cao hơn (trả nợ trước, câu mới chậm lại). Vắng ⇒ TI_LE_TRAN_NO (50 %).
   */
  tiLeNo?: number
  /** VÒNG HỌC v2 — KÊNH RIÊNG: em không chơi Đoàn (7 ngày) mà chơi Đảo ⇒ câu ôn Phần I/III cũng vào Đảo (không bao giờ kẹt ở kênh em không mở). */
  onVaoDao?: boolean
  // ------------------------------------------------------------ OMNI 3 (05/10) — MỌI trường dưới đây TUỲ CHỌN; vắng ⇒ hành vi cũ y hệt.
  /**
   * NHIỀU BÀI SONG SONG (đặc tả mục 1 bước 11; prompt tick bài mục B): MỌI chiến dịch đang chạy của em. Có trường này ⇒ thay `hanNop`/`tranNgay`/`raiDeu`:
   * - thể lực ngày = max `theLucNgay` của các chiến dịch đang chạy (không chiến dịch ⇒ `cheDoCho.theLuc` hoặc `tranNgay` như cũ);
   * - mỗi chiến dịch có D riêng (`soNgayConLai` tới hạn của nó), quota câu mới riêng `quotaCauMoi(còn_c, D_c)` theo cờ rải đều RIÊNG; câu mới lấy theo chiến
   *   dịch hạn gần trước (EDF), trong cùng một trần ngày; câu chiến dịch nhận chiến dịch qua `CauSrs.cd`;
   * - Huyết Chiến khi Σ khối lượng > 0,9 × Σ(D_c) × thể lực, hoặc một chiến dịch tự vượt 0,9 × D_c × thể lực; trần Huyết Chiến = `tranHuyetChien` (vắng ⇒ 2 × thể lực);
   * - chiến dịch đã quá hạn hoặc chưa tới `batDau` bị bỏ; mảng rỗng ⇒ không có chiến dịch đang chạy.
   * Một chiến dịch duy nhất ⇒ kế hoạch y hệt đường một `hanNop` (test).
   */
  chienDich?: readonly ChienDichKeHoach[]
  /** Số câu MỚI đã làm hôm nay THEO chiến dịch (lập lại giữa ngày; chỉ chiến dịch rải đều). Vắng ⇒ `moiDaLamHomNay` tính cho chiến dịch hạn gần nhất. */
  moiDaLamTheoCd?: Readonly<Record<string, number>>
  /**
   * Trọng số câu (qid → số ≥ 0; `omni-ke-hoach.ts` `trongSoCacCau` = điểm còn lấy được × độ tăng P kỳ vọng × vùng học). Có ⇒ câu MỚI trong quota xếp theo
   * trọng số giảm dần (hoà: băm `homNay|qid`), THAY thứ tự `xepCauMoi`/`bocCauMoiCaNhan`; câu ôn bài cũ xếp theo trọng số (hoà: thứ tự truyền vào).
   * KHÔNG đổi số câu mới mỗi ngày. Câu vắng trong bảng ⇒ trọng số 0.
   */
  trongSoCau?: Readonly<Record<string, number>>
  /** Mã dạng ĐÃ VỮNG của em: câu MỚI chiến dịch của các dạng này KHÔNG bắt buộc — bỏ khỏi câu mới, quota và khối lượng (vẫn nằm trong `cau` cho Thử sức thêm). Câu ôn/nợ không miễn. */
  dangVung?: readonly string[]
  /**
   * ÔN BÀI CŨ: ứng viên (câu bài cũ trong phạm vi lớp, chưa gặp hoặc chưa thành thạo, không thuộc chiến dịch đang chạy, không trùng `cau`; trạng thái trong
   * `trangThai`). Lấp SAU nợ / mới / củng cố / duy trì, tối đa floor(trần × `tiLeOnBaiCu`) (chế độ chờ: lấp hết phần còn lại). Câu chưa gặp ⇒ Đảo; câu đã gặp ⇒
   * như câu ôn (Phần II ⇒ Đảo, còn lại ⇒ Đoàn, theo `onVaoDao`).
   */
  onBaiCu?: readonly CauSrs[]
  /** Tỉ lệ trần ôn bài cũ khi có chiến dịch (`omni-ke-hoach.ts` `tiLeOnBaiCu`: ngày 4–5 của bài 0,4, còn lại 0,2). Vắng ⇒ THAM_SO_OMNI.ON_BAI_CU_TI_LE. */
  tiLeOnBaiCu?: number
  /**
   * CHẾ ĐỘ CHỜ BÀI MỚI (đặc tả mục 1 bước 11; prompt mục D): KHÔNG có chiến dịch đang chạy ⇒ trần = `theLuc` (= `theLucCho(thể lực lớp)`); nợ đến lịch trước;
   * duy trì nới tới THAM_SO_OMNI.CHO_DUY_TRI_TI_LE; ôn bài cũ lấp phần còn lại. Có chiến dịch đang chạy ⇒ bỏ qua.
   */
  cheDoCho?: { theLuc: number }
}

/** OMNI 3: một chiến dịch đang chạy trong `TuyChonKeHoach.chienDich`. */
export interface ChienDichKeHoach {
  id: string
  /** Hạn nộp (ngày VN, hết 23:59). */
  hanNop: string
  theLucNgay: number
  raiDeu: boolean
  /** Ngày bắt đầu (VN); sau hôm nay ⇒ chưa chạy (bỏ). */
  batDau?: string
}

export interface KeHoachNgay {
  /** Câu cho Bát Linh Đảo: câu ôn Đúng–sai trước, rồi câu mới. Đúng thứ tự phục vụ. */
  dao: string[]
  /** Câu cho Đoàn Hộ Tống: câu ôn Trắc nghiệm, Trả lời ngắn. */
  doan: string[]
  huyetChien: boolean
  /** Số lượt tối thiểu còn cần để mọi câu (chưa cắt tỉa) thành thạo. */
  khoiLuong: number
  /** D × trần ngày. */
  sucChua: number
  D: number
  tran: number
  /** Công tắc rải đều câu mới đã áp cho kế hoạch này (chỉ-thêm, để chẩn đoán/test đọc). */
  raiDeu: boolean
  catTia: string[]
  /** OMNI 3 (chỉ có khi truyền ứng viên ôn bài cũ): qid ôn bài cũ đã chọn hôm nay, theo thứ tự chọn. */
  onBaiCu?: string[]
  /** OMNI 3 (chỉ có khi truyền `chienDich`): số câu mới đã chọn hôm nay theo id chiến dịch. */
  moiTheoCd?: Record<string, number>
}

/** Băm tất định (FNV-1a) — hoà điểm xếp theo khoá, không dùng Math.random. */
export function bam(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

export const HANG_MUC_DO: Record<string, number> = {
  NB: 0, 'Nhận biết': 0, biet: 0, TH: 1, 'Thông hiểu': 1, hieu: 1, VD: 2, 'Vận dụng': 2, van_dung: 2, VDC: 3, 'Vận dụng cao': 3, van_dung_cao: 3,
}
const hangMucDo = (m: string | null): number => (m != null && m in HANG_MUC_DO ? HANG_MUC_DO[m]! : 9)

/** Trọng số câu ôn đến lịch: 50 + 20 × số ngày trễ + 80 nếu sắp chín (cc = 1) hoặc + 60 nếu vừa sai (cc = 0). */
export function trongSoOn(t: TrangThaiCau, homNay: string): number {
  const tre = t.henOn ? Math.max(0, soNgayGiua(t.henOn, homNay)) : 0
  return 50 + 20 * tre + (t.cc === 1 ? 80 : t.cc === 0 ? 60 : 0)
}

/**
 * Lượt tối thiểu còn cần: câu mới 2, câu đang ôn 2 − cc; bỏ câu đã thành thạo (kể cả thành thạo lần đầu) và câu cắt tỉa.
 * MỘT hàm cho mọi nơi ước khối lượng (thầy chốt 28/09, phương án P1): Huyết Chiến (`lapKeHoachNgay`), đồng hồ sức chứa +
 * "Tự tính" + quá tải ở Giao chiến dịch (`srs2-gv.ts`), tự nâng số câu/ngày ở Sửa chiến dịch (`srs2-sua.ts`).
 * Câu mới vẫn ước 2 lượt dù có thể thành thạo lần đầu (an toàn; máy tính lại mỗi ngày theo tình trạng thật).
 */
export function khoiLuongCan(ds: Iterable<TrangThaiCau>): number {
  let s = 0
  for (const t of ds) {
    if (t.catTia || t.thanhThao) continue
    s += t.laMoi ? 2 : Math.max(0, 2 - t.cc)
  }
  return s
}

/** Câu mới: Nhận biết → Thông hiểu → Vận dụng; trong cùng mức xen kẽ dạng; hoà thì băm theo ngày. */
function xepCauMoi(ds: readonly CauSrs[], homNay: string): CauSrs[] {
  const theoMuc = new Map<number, CauSrs[]>()
  for (const c of ds) {
    const k = hangMucDo(c.mucDo)
    if (!theoMuc.has(k)) theoMuc.set(k, [])
    theoMuc.get(k)!.push(c)
  }
  const ra: CauSrs[] = []
  for (const k of [...theoMuc.keys()].sort((a, b) => a - b)) {
    const theoDang = new Map<string, CauSrs[]>()
    for (const c of theoMuc.get(k)!) {
      const d = c.dang ?? ''
      if (!theoDang.has(d)) theoDang.set(d, [])
      theoDang.get(d)!.push(c)
    }
    const hang = [...theoDang.entries()]
      .sort((a, b) => bam(`${homNay}|${a[0]}`) - bam(`${homNay}|${b[0]}`))
      .map(([, cs]) => cs.sort((a, b) => bam(`${homNay}|${a.qid}`) - bam(`${homNay}|${b.qid}`)))
    for (let i = 0; hang.some((h) => i < h.length); i++) for (const h of hang) if (i < h.length) ra.push(h[i]!)
  }
  return ra
}

// ---------------------------------------------------------------- BỐC CÂU MỚI CÁ NHÂN HOÁ (thầy chốt 28/09)
/** Hạng của em ở một dạng: L1 Yếu · L2 Trung bình · L3 Khá · L4 Giỏi. */
export type HangEm = 'L1' | 'L2' | 'L3' | 'L4'
/** Bậc năng lực nền của học sinh: L1 = Nhận biết … L4 = Vận dụng cao. */
export const BAC_HANG_EM: Readonly<Record<HangEm, number>> = { L1: 0, L2: 1, L3: 2, L4: 3 }
/** Nhãn chuẩn để máy chủ và giao diện cùng nói một ngôn ngữ. */
export const TEN_BAC_MUC_DO = ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'] as const
/** Mức khó tối đa trong phần bắt buộc: đúng mức em + thử thách cao hơn một bậc. */
export const bacToiDaBatBuoc = (hang: HangEm): number => Math.min(3, BAC_HANG_EM[hang] + 1)
/** Bậc mục tiêu của thẻ nâng bậc; em đã ở L4 thì không còn bậc cao hơn. */
export const bacThuThachTiepTheo = (hang: HangEm): number | null => BAC_HANG_EM[hang] < 3 ? BAC_HANG_EM[hang] + 1 : null
/** Tỉ lệ khối lượng câu mới bắt buộc theo hạng. Dùng chung cho trần ngày và quota chiến dịch rải đều. */
export const TI_LE_PHAN_BO_THEO_HO_SO: Readonly<Record<HangEm, number>> = { L1: 0.6, L2: 0.75, L3: 0.9, L4: 1 }

/**
 * Trần ngày riêng theo hồ sơ, làm tròn lên theo một chuyến 6 câu để không tạo chuyến vụn:
 * L1 60% · L2 75% · L3 90% · L4 100%. Ví dụ trần lớp 40 ⇒ 24 / 30 / 36 / 40.
 * Trần nhỏ hơn 6 được giữ nguyên; không bao giờ vượt trần giáo viên đặt.
 */
export function tranNgayTheoHoSo(tranGoc: number, hang: HangEm): number {
  const goc = Math.max(0, Math.floor(Number(tranGoc) || 0))
  if (goc <= 6) return goc
  return Math.min(goc, Math.max(6, Math.ceil((goc * TI_LE_PHAN_BO_THEO_HO_SO[hang]) / 6) * 6))
}

/**
 * Quota câu MỚI của chiến dịch rải đều cũng phải khác nhau theo hồ sơ. Trước bản này chỉ trần ngày đổi;
 * nếu quota rải đều thấp hơn mọi trần thì L1–L4 vẫn nhận cùng số câu (SBD 11010: L2 vẫn 39/39).
 * Câu ôn/nợ không đi qua hàm này nên siêu vòng lặp sửa sai vẫn được giữ nguyên.
 */
export function quotaMoiTheoHoSo(quotaGoc: number, hang: HangEm): number {
  const goc = Math.max(0, Math.floor(Number(quotaGoc) || 0))
  return goc === 0 ? 0 : Math.min(goc, Math.max(1, Math.ceil(goc * TI_LE_PHAN_BO_THEO_HO_SO[hang])))
}
/** Thống kê một dạng: số lần gặp và số lần đúng (hồ sơ `nam_kt_dang` + lần làm trong chiến dịch, bỏ lượt có gợi ý). */
export interface ThongKeDang { gap: number; dung: number }

/** Tỉ lệ đúng đã làm trơn: p = (đúng + 2) / (gặp + 4) — ít dữ liệu thì kéo về 0,5. */
export const tiLeLamTron = (dung: number, gap: number): number => (Math.max(0, dung) + 2) / (Math.max(0, gap) + 4)
/** Ngưỡng hạng: p < 0,40 → L1; < 0,65 → L2; ≤ 0,85 → L3; > 0,85 → L4. */
export const hangTuTiLe = (p: number): HangEm => (p < 0.4 ? 'L1' : p < 0.65 ? 'L2' : p <= 0.85 ? 'L3' : 'L4')

/**
 * Hạng theo từng dạng của em. Dạng có dữ liệu (gặp > 0) ⇒ hạng từ p của dạng; dạng chưa có ⇒ `hangChung` (p gộp mọi dạng);
 * em không có dữ liệu gì ⇒ L2.
 */
export function tinhHangTheoDang(thongKe: ReadonlyMap<string, ThongKeDang>, dangCan: readonly string[] = []): { hangTheoDang: Record<string, HangEm>; hangChung: HangEm } {
  let gap = 0, dung = 0
  for (const t of thongKe.values()) { gap += Math.max(0, t.gap); dung += Math.max(0, t.dung) }
  const hangChung: HangEm = gap > 0 ? hangTuTiLe(tiLeLamTron(dung, gap)) : 'L2'
  const hangTheoDang: Record<string, HangEm> = {}
  for (const d of new Set([...thongKe.keys(), ...dangCan])) {
    const t = thongKe.get(d)
    hangTheoDang[d] = t && t.gap > 0 ? hangTuTiLe(tiLeLamTron(t.dung, t.gap)) : hangChung
  }
  return { hangTheoDang, hangChung }
}

/** Một dòng hồ sơ dạng (`nam_kt_dang`): `soGap` câu đã gặp, `soSai` câu từng sai; `capNhatLuc` = lúc dựng hồ sơ (ISO). */
export interface HoSoDangTho {
  maDang: string
  soGap: number
  soSai: number
  soDaKhacPhuc?: number
  soChuaThaySai?: number
  bac?: number
  capNhatLuc: string | null
}

/** Hồ sơ ZPD theo dạng: bậc lấy từ hạng đang dùng trong chiến dịch; độ khắc phục lấy từ hồ sơ nắm kiến thức thật. */
export function hoSoZpdTu(
  hoSo: readonly HoSoDangTho[],
  hangTheoDang: Readonly<Record<string, HangEm>>,
  hangChung: HangEm,
): Record<string, HoSoZpdDang> {
  const ra: Record<string, HoSoZpdDang> = {}
  for (const d of hoSo) {
    if (!d.maDang || d.maDang.startsWith('CD:')) continue
    const gap = Math.max(0, Number(d.soGap) || 0)
    const da = Math.max(0, Number(d.soDaKhacPhuc) || 0)
    const chuaSai = Math.max(0, Number(d.soChuaThaySai) || 0)
    ra[d.maDang] = {
      bacDich: BAC_HANG_EM[hangTheoDang[d.maDang] ?? hangChung] as BacCauChienDich,
      soGap: gap,
      tiLeKhacPhuc: gap >= PHAN_BO_BAC.SO_CAU_DU_TIN ? Math.min(1, (da + chuaSai) / gap) : null,
    }
  }
  return ra
}

/**
 * Gộp thống kê theo dạng để XẾP HẠNG: hồ sơ `nam_kt_dang` (đúng = gặp − sai) + lần làm TRONG chiến dịch (sau lúc giao,
 * bỏ lượt có gợi ý). Lần làm trước lúc dựng hồ sơ của dạng đã nằm trong hồ sơ ⇒ không cộng lại (tránh đếm đôi).
 * Bỏ dòng tổng chuyên đề `CD:…`.
 */
export function gopThongKeDang(
  hoSo: readonly HoSoDangTho[],
  lanLam: readonly { dang: string | null; luc: string; dung: boolean; coGoiY: boolean }[],
  tuLuc = '',
): Map<string, ThongKeDang> {
  const ra = new Map<string, ThongKeDang>()
  const moc = new Map<string, string>()
  for (const d of hoSo) {
    if (!d.maDang || d.maDang.startsWith('CD:')) continue
    const gap = Math.max(0, Number(d.soGap) || 0)
    ra.set(d.maDang, { gap, dung: Math.max(0, gap - Math.max(0, Number(d.soSai) || 0)) })
    if (d.capNhatLuc) moc.set(d.maDang, d.capNhatLuc)
  }
  for (const x of lanLam) {
    if (!x.dang || x.coGoiY || x.luc < tuLuc) continue
    const m = moc.get(x.dang)
    if (m && x.luc <= m) continue
    const t = ra.get(x.dang) ?? { gap: 0, dung: 0 }
    ra.set(x.dang, { gap: t.gap + 1, dung: t.dung + (x.dung ? 1 : 0) })
  }
  return ra
}

/** Mức câu cho bốc cá nhân: NB 0 … VDC 3; nhãn lạ/thiếu coi là Thông hiểu (không để câu không nhãn nhảy lên đầu nhóm "khó trước"). */
export const mucCaNhan = (m: string | null): number => (m != null && m in HANG_MUC_DO ? HANG_MUC_DO[m]! : 1)

/** Chia `n` theo trọng số (phần dư lớn nhất), mỗi phần không vượt `tran[i]`; phần thừa dồn sang phần còn chỗ theo trọng số. */
function chiaTheoTrongSo(n: number, trongSo: readonly number[], tran: readonly number[]): number[] {
  const ra = trongSo.map(() => 0)
  let con = Math.min(n, tran.reduce((s, x) => s + x, 0))
  while (con > 0) {
    const mo = trongSo.map((w, i) => (ra[i]! < tran[i]! ? Math.max(0, w) : 0))
    const dung = mo.some((w) => w > 0) ? mo : tran.map((t, i) => (ra[i]! < t ? 1 : 0))
    const tong = dung.reduce((s, x) => s + x, 0)
    const thuc = dung.map((w) => (con * w) / tong)
    const phan = thuc.map((x, i) => Math.min(Math.floor(x), tran[i]! - ra[i]!))
    let da = phan.reduce((s, x) => s + x, 0)
    const du = thuc
      .map((x, i) => [x - Math.floor(x), i] as const)
      .filter(([, i]) => dung[i]! > 0 && ra[i]! + phan[i]! < tran[i]!)
      .sort((a, b) => b[0] - a[0] || a[1] - b[1])
    for (const [, i] of du) {
      if (da >= con) break
      phan[i]!++
      da++
    }
    phan.forEach((x, i) => { ra[i]! += x })
    if (da === 0) break
    con -= da
  }
  return ra
}

/**
 * Hạng L3 — BẬC THANG: số câu mức m hôm nay ∝ N_m × max(0, 1 + t·(μ − m)), μ = mức trung bình của phần còn lại,
 * t = min(0,6; 0,3·(K − 2)) với K = số ngày giao câu mới còn lại (kể cả hôm nay). Đầu kỳ nghiêng về câu dễ, t giảm dần
 * về 0 ở hai ngày giao cuối (chia đều phần còn lại) ⇒ câu khó tăng dần và HẾT mọi mức đúng ngày giao cuối (ngày cuối lấy hết).
 * Ví dụ kho 24/62/84, 5 ngày × 34: 9/15/10 · 7/15/12 · 4/12/18 · 2/10/22 · 2/10/22.
 */
export function chiaBacThang(soTheoMuc: ReadonlyMap<number, number>, n: number, K: number): Map<number, number> {
  const muc = [...soTheoMuc.keys()].sort((a, b) => a - b)
  const N = muc.map((m) => soTheoMuc.get(m)!)
  const tong = N.reduce((s, x) => s + x, 0)
  if (n >= tong) return new Map(muc.map((m, i) => [m, N[i]!]))
  const t = Math.min(0.6, Math.max(0, 0.3 * (K - 2)))
  const mu = muc.reduce((s, m, i) => s + m * N[i]!, 0) / tong
  const w = muc.map((m, i) => N[i]! * Math.max(0, 1 + t * (mu - m)))
  const ra = chiaTheoTrongSo(n, w, N)
  return new Map(muc.map((m, i) => [m, ra[i]!]))
}

/** Số câu khởi động (dễ hơn 1 bậc) mỗi ngày của hạng L4: ~1/6 lượng câu mới trong ngày. */
export const soCauKhoiDong = (n: number): number => Math.round(n / 6)

/** Xếp câu đã chọn trong ngày: rải đều các mức (mỗi chuyến 6 câu có đủ dễ/khó theo đúng tỉ lệ ngày); hoà ⇒ mức dễ trước, rồi thứ tự gốc. */
function raiDeuTheoMuc(ds: readonly CauSrs[], viTri: ReadonlyMap<string, number>): CauSrs[] {
  const theoMuc = new Map<number, CauSrs[]>()
  for (const c of ds) {
    const m = mucCaNhan(c.mucDo)
    if (!theoMuc.has(m)) theoMuc.set(m, [])
    theoMuc.get(m)!.push(c)
  }
  const khoa = new Map<string, number>()
  for (const cs of theoMuc.values()) {
    cs.sort((a, b) => viTri.get(a.qid)! - viTri.get(b.qid)!)
    cs.forEach((c, i) => khoa.set(c.qid, (i + 0.5) / cs.length))
  }
  return [...ds].sort((a, b) => khoa.get(a.qid)! - khoa.get(b.qid)! || mucCaNhan(a.mucDo) - mucCaNhan(b.mucDo) || viTri.get(a.qid)! - viTri.get(b.qid)!)
}

/**
 * Chọn `soLay` câu mới HÔM NAY theo hạng của em ở dạng của từng câu, rồi nối phần còn lại (thứ tự cũ, dễ trước) để lấp chỗ trống.
 * - `moi`: câu mới đã xếp kiểu cũ (`xepCauMoi` — dễ trước, xen dạng). `tatCa`: mọi câu chiến dịch (để biết mức "vừa sức" của nhóm L4).
 * - `K`: số ngày giao câu mới còn lại, kể cả hôm nay (D − 3; sát hạn = 1).
 * - Chia `soLay` cho ba nhóm (L1+L2 · L3 · L4) theo tỉ lệ câu mới còn lại ⇒ mọi nhóm cùng giao hết vào ngày giao cuối.
 * - L1, L2: dễ trước. L3: bậc thang (`chiaBacThang`). L4: vừa sức (mức cao nhất của nhóm) trước, giữ `soCauKhoiDong` câu
 *   ở mức ngay dưới làm khởi động; hết câu mức ấy thì lấy tiếp theo thứ tự khó → dễ.
 */
export function bocCauMoiCaNhan(
  moi: readonly CauSrs[],
  soLay: number,
  K: number,
  hangCua: (c: CauSrs) => HangEm,
  tatCa: readonly CauSrs[] = moi,
): CauSrs[] {
  const viTri = new Map(moi.map((c, i) => [c.qid, i]))
  const nhomCua = (c: CauSrs): 0 | 1 | 2 => {
    const h = hangCua(c)
    return h === 'L4' ? 2 : h === 'L3' ? 1 : 0
  }
  const nhom: CauSrs[][] = [[], [], []]
  for (const c of moi) nhom[nhomCua(c)]!.push(c)
  const soNhom = chiaTheoTrongSo(Math.max(0, Math.min(soLay, moi.length)), nhom.map((g) => g.length), nhom.map((g) => g.length))
  const chon: CauSrs[] = []
  // Nhóm L1 + L2: dễ trước (đúng thứ tự cũ).
  chon.push(...nhom[0]!.slice(0, soNhom[0]))
  // Nhóm L3: bậc thang theo mức.
  if (soNhom[1]! > 0) {
    const theoMuc = new Map<number, CauSrs[]>()
    for (const c of nhom[1]!) {
      const m = mucCaNhan(c.mucDo)
      if (!theoMuc.has(m)) theoMuc.set(m, [])
      theoMuc.get(m)!.push(c)
    }
    const so = chiaBacThang(new Map([...theoMuc].map(([m, cs]) => [m, cs.length])), soNhom[1]!, K)
    for (const [m, cs] of theoMuc) chon.push(...cs.slice(0, so.get(m) ?? 0))
  }
  // Nhóm L4: vừa sức trước + câu khởi động.
  if (soNhom[2]! > 0) {
    const n = soNhom[2]!
    const nhomTatCa = tatCa.filter((c) => nhomCua(c) === 2)
    const mucCo = [...new Set((nhomTatCa.length ? nhomTatCa : nhom[2]!).map((c) => mucCaNhan(c.mucDo)))].sort((a, b) => b - a)
    const mucKhoiDong = mucCo[1] // mức ngay dưới mức vừa sức (mức cao nhất của nhóm trong chiến dịch)
    const khoTruoc = [...nhom[2]!].sort((a, b) => mucCaNhan(b.mucDo) - mucCaNhan(a.mucDo) || viTri.get(a.qid)! - viTri.get(b.qid)!)
    const daLay = new Set<string>()
    const kd = mucKhoiDong == null ? 0 : soCauKhoiDong(n)
    for (const c of khoTruoc) {
      if (daLay.size >= n - kd) break
      daLay.add(c.qid)
    }
    for (const c of khoTruoc) {
      if (daLay.size >= n) break
      if (mucCaNhan(c.mucDo) === mucKhoiDong) daLay.add(c.qid)
    }
    for (const c of khoTruoc) {
      if (daLay.size >= n) break
      daLay.add(c.qid)
    }
    chon.push(...khoTruoc.filter((c) => daLay.has(c.qid)))
  }
  const daChon = new Set(chon.map((c) => c.qid))
  // Chỉ có câu nhóm L1/L2 ⇒ giữ đúng thứ tự cũ (dễ trước); có nhóm L3/L4 ⇒ rải đều mức để mỗi chuyến có câu khởi động và câu trùm.
  const ngay = chon.every((c) => nhomCua(c) === 0) ? moi.filter((c) => daChon.has(c.qid)) : raiDeuTheoMuc(chon, viTri)
  return [...ngay, ...moi.filter((c) => !daChon.has(c.qid))]
}

/**
 * Thứ tự câu trong MỘT chuyến Bát Linh Đảo: câu ôn (Đúng–sai) đi trước như cũ; câu mới xếp dễ → khó ⇒ ải 1–2 là câu mới dễ
 * nhất, ải cuối (Trùm, chuyến đủ 6 ải) là câu mới khó nhất, giữa là phần còn lại. Hoà mức ⇒ giữ thứ tự kế hoạch.
 */
export function xepChuyenDao<T>(ds: readonly T[], laMoi: (x: T) => boolean, mucDo: (x: T) => string | null): T[] {
  const on = ds.filter((x) => !laMoi(x))
  const moi = ds
    .map((x, i) => [x, i] as const)
    .filter(([x]) => laMoi(x))
    .sort((a, b) => hangMucDo(mucDo(a[0])) - hangMucDo(mucDo(b[0])) || a[1] - b[1])
    .map(([x]) => x)
  return [...on, ...moi]
}

/**
 * Quota câu MỚI của một ngày khi RẢI ĐỀU (thầy 30/09): ceil(số câu mới còn / (D − 3)); ba ngày ôn cuối (D ≤ 3) ⇒ mọi câu mới còn lại.
 * MỘT công thức cho kế hoạch ngày (`lapKeHoachNgay`) và Thử sức thêm (`coLoThuSucThem`).
 */
export const quotaCauMoi = (soMoi: number, D: number): number => {
  const n = Math.max(0, Math.floor(soMoi))
  return D > NGAY_DEM ? Math.ceil(n / (D - NGAY_DEM)) : n
}

/**
 * THỬ SỨC THÊM (thầy chốt 30/09): em làm xong kế hoạch hôm nay thì được lấy TRƯỚC câu mới của ngày mai, từng lô. Cỡ một lô =
 * min(quota câu mới NGÀY MAI theo đúng công thức rải đều trên số câu mới còn lại, trần hôm nay − tổng kế hoạch hôm nay).
 * Hôm nay đã là hạn nộp (chiến dịch không còn ngày mai) ⇒ 0. Ngày mai quota tự giảm vì số câu mới còn lại đã giảm ⇒ tổng câu mới cả chiến dịch không đổi.
 */
export function coLoThuSucThem(soMoiConLai: number, homNay: string, hanNop: string, tongHomNay: number, tran: number): number {
  const mai = congNgay(homNay, 1)
  if (mai > hanNop) return 0
  return Math.max(0, Math.min(quotaCauMoi(soMoiConLai, soNgayConLai(mai, hanNop)), Math.floor(tran) - tongHomNay))
}

/**
 * Lập kế hoạch MỘT ngày cho một em. `trangThai` phải có đủ mọi câu trong `cau` (câu chưa làm ⇒ trạng thái mới) — và mọi ứng viên `tc.onBaiCu`.
 * `daLamHomNay`: số câu của kế hoạch hôm nay em đã làm (trừ vào trần).
 * SỔ NỢ (thầy chốt 29/09): câu NỢ (mọi nguồn) tới lịch lấy TRƯỚC, trần 50% lượt khi chiến dịch còn câu mới (không chiến dịch ⇒ 100%),
 * xếp `soSanhNo`; câu mới lấy phần còn lại theo quota; rồi câu chiến dịch đã thành thạo tới lịch ôn chốt; ôn duy trì ≤ 20% và sau cùng;
 * còn chỗ ⇒ thêm câu mới, hết câu mới ⇒ thêm nợ (`raiDeu`: câu mới dừng đúng quota, đủ quota thì nợ lấp lượt dư — thầy 30/09). Thứ tự phục vụ: đan xen theo sức em (`danXenNgay`).
 * OMNI 3 (05/10): câu mới chia theo NHÓM chiến dịch — đường cũ là đúng MỘT nhóm (`hanNop`), `tc.chienDich` cho nhiều nhóm (EDF, quota riêng); sau cùng (sau cả
 * nợ lấp lượt dư) là ÔN BÀI CŨ (`tc.onBaiCu`); không chiến dịch + `tc.cheDoCho` ⇒ kế hoạch nhẹ. Vắng mọi trường mới ⇒ từng phép tính y như bản trước.
 */
export function lapKeHoachNgay(cau: readonly CauSrs[], trangThai: ReadonlyMap<string, TrangThaiCau>, tc: TuyChonKeHoach, daLamHomNay = 0): KeHoachNgay {
  const tt = (c: CauSrs) => trangThai.get(c.qid)!
  const nguonCua = (c: CauSrs) => c.nguon ?? 'chien_dich'
  // NHÓM câu mới. Đường cũ: một nhóm khi `hanNop` còn hạn. OMNI 3 (`tc.chienDich`): mỗi chiến dịch đang chạy một nhóm, hạn gần trước (EDF).
  const nhieu = tc.chienDich !== undefined
  type Nhom = { id: string | null; hanNop: string; raiDeu: boolean; D: number; theLuc: number }
  const nhom: Nhom[] = []
  if (nhieu) {
    const daCo = new Set<string>()
    // hạn gần trước; cùng hạn ⇒ giữ thứ tự truyền vào (sort ổn định — lớp D1 đã xếp bắt đầu sớm trước, rồi giao gần nhất)
    const ds = tc.chienDich!
      .filter((c) => !!c.hanNop && c.hanNop >= tc.homNay && !(c.batDau && c.batDau > tc.homNay))
      .slice()
      .sort((a, b) => (a.hanNop < b.hanNop ? -1 : a.hanNop > b.hanNop ? 1 : 0))
    for (const c of ds) {
      if (daCo.has(c.id)) continue
      daCo.add(c.id)
      nhom.push({ id: c.id, hanNop: c.hanNop, raiDeu: c.raiDeu === true, D: soNgayConLai(tc.homNay, c.hanNop), theLuc: Number(c.theLucNgay) || TRAN_NGAY })
    }
  } else if (!!tc.hanNop && tc.homNay <= tc.hanNop) {
    nhom.push({ id: null, hanNop: tc.hanNop, raiDeu: tc.raiDeu === true, D: soNgayConLai(tc.homNay, tc.hanNop), theLuc: tc.tranNgay ?? TRAN_NGAY })
  }
  const coChienDich = nhom.length > 0
  // CHẾ ĐỘ CHỜ BÀI MỚI (OMNI 3): chỉ khi KHÔNG có chiến dịch đang chạy.
  const cho = !coChienDich && !!tc.cheDoCho
  const tranNgayGoc = nhieu && coChienDich ? Math.max(...nhom.map((g) => g.theLuc)) : cho ? tc.cheDoCho!.theLuc : (tc.tranNgay ?? TRAN_NGAY)
  const apDungPhanBo = tc.phanBoTheoHoSo === true && coChienDich
  const tranNgay = apDungPhanBo ? tranNgayTheoHoSo(tranNgayGoc, tc.hangChung ?? 'L2') : tranNgayGoc
  const tranHuyetGoc = tc.tranHuyetChien ?? (nhieu ? tranHuyetChienTheo(tranNgayGoc) : TRAN_HUYET_CHIEN)
  const tranHuyet = apDungPhanBo ? Math.min(tranHuyetGoc, tranHuyetChienTheo(tranNgay)) : tranHuyetGoc
  const D = coChienDich ? nhom[0]!.D : 1
  const tongD = nhom.reduce((s, g) => s + g.D, 0)
  const viTriNhom = new Map(nhom.map((g, i) => [g.id, i] as const))
  /** Nhóm của một câu chiến dịch: theo `cd` (OMNI 3); vắng / không khớp ⇒ nhóm hạn gần nhất. Đường cũ: luôn nhóm 0. */
  const nhomCua = (c: CauSrs): number => (nhieu ? (viTriNhom.get(c.cd ?? '\u0000') ?? 0) : 0)
  const catTia = cau.filter((c) => tt(c).catTia).map((c) => c.qid)
  const song = cau.filter((c) => !tt(c).catTia)
  const cauChienDich = song.filter((c) => nguonCua(c) === 'chien_dich')
  // DẠNG ĐÃ VỮNG (OMNI 3): câu MỚI chiến dịch của dạng ấy không bắt buộc (không vào câu mới, quota, khối lượng).
  const vung = new Set(tc.dangVung ?? [])
  const mien = (c: CauSrs) => vung.size > 0 && c.dang != null && vung.has(c.dang) && nguonCua(c) === 'chien_dich' && tt(c).laMoi
  const hangCua = (c: CauSrs): HangEm => tc.hangTheoDang?.[c.dang ?? ''] ?? tc.hangChung ?? 'L2'
  // Chỉ câu MỚI bị giới hạn vừa sức + 1. Nợ sai, câu tới lịch, củng cố và duy trì luôn được giữ để siêu vòng lặp khép kín.
  const vuotKhungBatBuoc = (c: CauSrs) => apDungPhanBo
    && nguonCua(c) === 'chien_dich' && tt(c).laMoi && mucCaNhan(c.mucDo) > bacToiDaBatBuoc(hangCua(c))
  // SỔ NỢ (29/09): Huyết Chiến tính CẢ lượt nợ cũ (câu ngoài chiến dịch chưa thành thạo, ≈ 2 − cc lượt/câu).
  const canLam = song.filter((c) => nguonCua(c) !== 'duy_tri' && nguonCua(c) !== 'on_bai_cu' && !mien(c) && !vuotKhungBatBuoc(c))
  const khoiLuong = coChienDich ? khoiLuongCan(canLam.map(tt)) : 0
  const trongSo = (c: CauSrs): number => { const x = Number(tc.trongSoCau?.[c.qid]); return Number.isFinite(x) ? x : 0 }
  // Tập gốc giữ cả câu mới vượt khung để tính QUOTA KHỐI LƯỢNG từ đúng cỡ chiến dịch giáo viên giao; tập phục vụ mới lọc mức em + 1.
  // Nếu tính quota từ tập đã lọc rồi nhân tiếp tỉ lệ hồ sơ, học sinh yếu bị giảm hai lần (vừa ít bậc vừa ít câu) quá mức chủ đích.
  const moiNhomGoc: CauSrs[][] = nhom.map(() => [])
  const moiNhom: CauSrs[][] = nhom.map(() => [])
  for (const c of cauChienDich) if (coChienDich && tt(c).laMoi && !mien(c)) {
    moiNhomGoc[nhomCua(c)]!.push(c)
    if (!vuotKhungBatBuoc(c)) moiNhom[nhomCua(c)]!.push(c)
  }
  // Thứ tự câu mới: trọng số OMNI (giảm dần, hoà băm theo ngày) khi có; không thì dễ trước, xen dạng (`xepCauMoi`) như cũ.
  const moiXep = moiNhom.map((ds) => (tc.trongSoCau
    ? [...ds].sort((a, b) => trongSo(b) - trongSo(a) || bam(`${tc.homNay}|${a.qid}`) - bam(`${tc.homNay}|${b.qid}`))
    : xepCauMoi(ds, tc.homNay)))
  const tongMoi = moiXep.reduce((s, ds) => s + ds.length, 0)
  // RẢI ĐỀU (thầy 30/09): quota hôm nay tính trên CẢ câu mới đã làm hôm nay (lập lại giữa ngày) rồi trừ phần đã làm (đã làm đủ ⇒ 0);
  // lập đầu ngày (chưa làm) ⇒ ceil(...) ≥ 1 khi còn câu mới. Nhiều bài: quota RIÊNG từng chiến dịch theo D và cờ của nó.
  const daMoiCua = (g: Nhom, i: number): number => {
    if (!g.raiDeu) return 0
    if (nhieu && tc.moiDaLamTheoCd) return Math.max(0, Math.floor(Number(tc.moiDaLamTheoCd[g.id!]) || 0))
    return i === 0 ? Math.max(0, Math.floor(tc.moiDaLamHomNay ?? 0)) : 0
  }
  const daMoi = nhom.map(daMoiCua)
  const quotaGoc = nhom.map((g, i) => {
    const da = daMoi[i]!
    return quotaCauMoi((apDungPhanBo ? moiNhomGoc[i]!.length : moiXep[i]!.length) + da, g.D)
  })
  const quota = nhom.map((_, i) => {
    const da = daMoi[i]!
    return Math.max(0, quotaGoc[i]! - da)
  })
  if (apDungPhanBo) {
    // Nhiều chiến dịch rải đều phải nhân tỉ lệ trên TỔNG quota rồi mới chia lại. Nếu ceil từng chiến dịch,
    // bốn quota nhỏ có thể cùng làm tròn lên khiến L2 gần bằng L4 (ca thật 11010: 35 câu mới vẫn thành 31 thay vì 27).
    const rai = nhom.map((g, i) => g.raiDeu ? i : -1).filter((i) => i >= 0)
    const tongGoc = rai.reduce((s, i) => s + quotaGoc[i]!, 0)
    const mucTieu = quotaMoiTheoHoSo(tongGoc, tc.hangChung ?? 'L2')
    const tongDa = rai.reduce((s, i) => s + daMoi[i]!, 0)
    const canPhan = Math.max(0, mucTieu - tongDa)
    const trongLuong = rai.map((i) => Math.max(0, quotaGoc[i]! - daMoi[i]!))
    const tongTrongLuong = trongLuong.reduce((s, n) => s + n, 0)
    const phan = rai.map((i, k) => Math.min(moiXep[i]!.length,
      tongTrongLuong > 0 ? Math.floor(canPhan * trongLuong[k]! / tongTrongLuong) : 0))
    let con = Math.max(0, canPhan - phan.reduce((s, n) => s + n, 0))
    const uuTien = rai.map((i, k) => ({ i, k, le: tongTrongLuong > 0 ? (canPhan * trongLuong[k]! / tongTrongLuong) % 1 : 0 }))
      .sort((a, b) => b.le - a.le || nhom[a.i]!.D - nhom[b.i]!.D || a.i - b.i)
    while (con > 0) {
      let daThem = false
      for (const x of uuTien) {
        if (con <= 0) break
        if (phan[x.k]! >= moiXep[x.i]!.length) continue
        phan[x.k] = phan[x.k]! + 1
        con--
        daThem = true
      }
      if (!daThem) break
    }
    rai.forEach((i, k) => { quota[i] = phan[k]! })
  }
  // OMNI 3 (nhiều bài): câu mới BẮT BUỘC hôm nay = câu mới của bài đã tới ngày giao câu mới CUỐI (D_c ≤ 4 ⇒ quota = mọi câu mới còn lại). Chúng GIỮ CHỖ
  // trước nợ (nợ vẫn ≤ 50 %, chỉ nhường đúng phần chỗ ấy) để mọi câu mới của mỗi bài được gặp trước hạn riêng − 3; không đủ chỗ ngay cả khi không nợ ⇒
  // Huyết Chiến. Đường cũ (một `hanNop`) không có luật này.
  const batBuoc = nhieu ? nhom.reduce((s, g, i) => s + (g.D <= NGAY_DEM + 1 ? Math.min(moiXep[i]!.length, quota[i]!) : 0), 0) : 0
  // Nhiều bài: Σ khối lượng > 0,9 × Σ D_c × thể lực, hoặc một bài tự vượt ngưỡng của nó, hoặc câu mới bắt buộc vượt thể lực. Một nhóm cũ ⇒ đúng biểu thức `0,9 × D × trần`.
  const huyetChien = coChienDich && (khoiLuong > 0.9 * tongD * tranNgay
    || (nhieu && (batBuoc > tranNgay || nhom.some((g, i) => khoiLuongCan(canLam.filter((c) => nguonCua(c) === 'chien_dich' && nhomCua(c) === i).map(tt)) > 0.9 * g.D * tranNgay))))
  const tran = Math.max(0, (huyetChien ? tranHuyet : tranNgay) - daLamHomNay)

  const denLich = (c: CauSrs) => {
    const t = tt(c)
    return !t.laMoi && !!t.henOn && t.henOn <= tc.homNay
  }
  const xepOn = (ds: CauSrs[]) =>
    ds.sort((a, b) => trongSoOn(tt(b), tc.homNay) - trongSoOn(tt(a), tc.homNay) || bam(`${tc.homNay}|${a.qid}`) - bam(`${tc.homNay}|${b.qid}`))
  // NỢ = câu đã làm, chưa thành thạo, chưa cắt tỉa — MỌI nguồn (chiến dịch đang chạy, chiến dịch cũ, ca/lên bảng/đầu giờ). Xếp `soSanhNo`.
  const no = song.filter((c) => nguonCua(c) !== 'duy_tri' && nguonCua(c) !== 'on_bai_cu' && laNo(tt(c)) && denLich(c)).sort((a, b) => soSanhNo(a, b, trangThai, tc.homNay))
  // Câu chiến dịch ĐÃ thành thạo tới lịch ôn củng cố/ôn chốt (không phải nợ): sau câu mới.
  const cungCo = xepOn(song.filter((c) => nguonCua(c) === 'chien_dich' && tt(c).thanhThao && denLich(c)))
  const duyTri = xepOn(song.filter((c) => nguonCua(c) === 'duy_tri' && denLich(c)))

  // Trần nợ 50% khi chiến dịch còn câu mới chưa giao; không chiến dịch (hoặc hết câu mới) ⇒ nợ tới 100%. Nhiều bài: nhường chỗ cho câu mới bắt buộc.
  const tranNo = coChienDich && tongMoi > 0 ? Math.floor(tran * Math.min(0.9, Math.max(TI_LE_TRAN_NO, tc.tiLeNo ?? TI_LE_TRAN_NO))) : tran
  const layNo = Math.min(no.length, tranNo, Math.max(0, tran - batBuoc))
  // EDF: chiến dịch hạn gần lấy câu mới trước trong phần trần còn lại.
  let conMoi = tran - layNo
  const layMoi = nhom.map((_, i) => { const n = Math.min(moiXep[i]!.length, quota[i]!, conMoi); conMoi -= n; return n })
  const tongLayMoi = layMoi.reduce((s, x) => s + x, 0)
  const layCungCo = Math.min(cungCo.length, tran - layNo - tongLayMoi)
  const layDuyTri = Math.min(duyTri.length, Math.floor(tran * (cho ? THAM_SO_OMNI.CHO_DUY_TRI_TI_LE : TI_LE_DUY_TRI)), tran - layNo - tongLayMoi - layCungCo)
  let conDu = tran - layNo - tongLayMoi - layCungCo - layDuyTri
  // Còn chỗ ⇒ thêm câu mới (nợ < 50% thì câu mới được thêm); đã giao HẾT câu mới hôm nay mà vẫn còn chỗ ⇒ thêm nợ vượt trần.
  // RẢI ĐỀU (thầy 30/09, chữ màn Giao "lượt dư trong ngày dùng để ôn"): KHÔNG thêm câu mới — câu mới dừng đúng quota; đã xếp ĐỦ quota câu mới hôm nay
  // (kể cả ngày ôn cuối D ≤ 3: quota = mọi câu mới còn lại) ⇒ lượt dư cho NỢ tới lịch lấp (vượt trần 50 %). Hết cả nợ ⇒ ngày ngắn hơn là bình thường.
  // (Phản biện vòng 2 #110: trước đây rải đều giữ nợ ở 50 % ⇒ ngày ôn cuối còn sót 1 câu mới thì em mất nửa lượt ôn; em yếu thiệt nhất.)
  const themMoi = nhom.map((g, i) => {
    if (g.raiDeu) return 0
    const n = Math.min(Math.max(0, conDu), moiXep[i]!.length - layMoi[i]!)
    conDu -= n
    return n
  })
  const duMoiHomNay = nhom.every((g, i) => layMoi[i]! + themMoi[i]! >= (g.raiDeu ? Math.min(moiXep[i]!.length, quota[i]!) : moiXep[i]!.length))
  const themNo = duMoiHomNay ? Math.min(Math.max(0, conDu), no.length - layNo) : 0
  conDu -= themNo
  // ÔN BÀI CŨ (OMNI 3): chỉ phần lượt còn dư sau nợ / mới / củng cố / duy trì; ≤ floor(trần × tỉ lệ); chế độ chờ ⇒ lấp hết phần còn lại.
  const coOnBaiCu = tc.onBaiCu !== undefined || song.some((c) => nguonCua(c) === 'on_bai_cu')
  let chonOnBaiCu: CauSrs[] = []
  if (coOnBaiCu) {
    const trongCau = new Set(cau.filter((c) => nguonCua(c) !== 'on_bai_cu').map((c) => c.qid))
    const thay = new Set<string>()
    const ung: CauSrs[] = []
    for (const c of [...(tc.onBaiCu ?? []), ...song.filter((x) => nguonCua(x) === 'on_bai_cu')]) {
      const t = trangThai.get(c.qid)
      if (!t || t.catTia || t.thanhThao || trongCau.has(c.qid) || thay.has(c.qid)) continue
      thay.add(c.qid)
      ung.push(c)
    }
    const xep = tc.trongSoCau ? ung.map((c, i) => [c, i] as const).sort((a, b) => trongSo(b[0]) - trongSo(a[0]) || a[1] - b[1]).map(([c]) => c) : ung
    const tiLe = Math.min(1, Math.max(0, tc.tiLeOnBaiCu ?? THAM_SO_OMNI.ON_BAI_CU_TI_LE))
    chonOnBaiCu = xep.slice(0, cho ? Math.max(0, conDu) : Math.min(Math.max(0, conDu), Math.floor(tran * tiLe)))
    conDu -= chonOnBaiCu.length
  }
  // Bốc câu mới cá nhân hoá: ZPD đổi SỐ LƯỢNG theo mức trong đúng quota; thiếu hồ sơ thì giữ bộ xếp 28/09.
  const chonMoi: CauSrs[] = []
  nhom.forEach((g, i) => {
    const ds = moiXep[i]!
    const soCan = layMoi[i]! + themMoi[i]!
    let thuTuMoi: CauSrs[] = ds
    if (!tc.trongSoCau && tc.hoSoZpdTheoDang) {
      thuTuMoi = xepCauMoiTheoZpd(
        ds.map((c) => ({ ...c, bac: mucCaNhan(c.mucDo) as BacCauChienDich })),
        soCan,
        tc.hoSoZpdTheoDang,
        tc.alphaZpd,
      ).thuTu
    } else if (tc.hangTheoDang && !tc.trongSoCau) {
      thuTuMoi = bocCauMoiCaNhan(ds, layMoi[i]!, g.D > NGAY_DEM ? g.D - NGAY_DEM : 1, hangCua, nhieu ? cauChienDich.filter((c) => nhomCua(c) === i) : cauChienDich)
    }
    chonMoi.push(...thuTuMoi.slice(0, soCan))
  })
  const chonOn = [...no.slice(0, layNo + themNo), ...cungCo.slice(0, layCungCo), ...duyTri.slice(0, layDuyTri)]
  // Ôn bài cũ: câu chưa gặp đi với câu mới (Đảo); câu đã gặp đi như câu ôn (Phần II ⇒ Đảo, còn lại ⇒ Đoàn).
  const onCuMoi = chonOnBaiCu.filter((c) => tt(c).laMoi)
  const onCuDaGap = chonOnBaiCu.filter((c) => !tt(c).laMoi)

  // ĐAN XEN (thầy 29/09): chọn xong mới xếp thứ tự phục vụ — chia lượt 6 câu theo mật độ của em, mở/kết lượt bằng câu dễ.
  const suc = sucEmCua(tc.hangChung)
  const loai = (c: CauSrs) => phanLoaiDanXen(c.qid, tt(c), c)
  const vaoDao = (c: CauSrs) => tc.onVaoDao || c.phan === 'II'
  return {
    dao: danXenNgay([...chonOn.filter(vaoDao), ...onCuDaGap.filter(vaoDao), ...chonMoi, ...onCuMoi].map(loai), suc).map((x) => x.qid),
    doan: tc.onVaoDao ? [] : danXenNgay([...chonOn, ...onCuDaGap].filter((c) => c.phan !== 'II').map(loai), suc).map((x) => x.qid),
    huyetChien,
    khoiLuong,
    sucChua: (coChienDich ? tongD : 1) * tranNgay,
    D,
    tran: huyetChien ? tranHuyet : tranNgay,
    catTia,
    raiDeu: nhieu && coChienDich ? nhom[0]!.raiDeu : tc.raiDeu === true,
    ...(coOnBaiCu ? { onBaiCu: chonOnBaiCu.map((c) => c.qid) } : {}),
    ...(nhieu ? { moiTheoCd: Object.fromEntries(nhom.map((g, i) => [g.id!, layMoi[i]! + themMoi[i]!])) } : {}),
  }
}

// ---------------------------------------------------------------- SỔ NỢ (thầy chốt 29/09)
/** Câu nợ: đã làm, chưa thành thạo, chưa cắt tỉa (sang "Cần thầy dạy lại"). */
export const laNo = (t: TrangThaiCau): boolean => !t.laMoi && !t.thanhThao && !t.catTia
/** Tổng số lần sai trong lịch sử (không đặt lại khi thầy chữa — nhãn "Sai N lần"). */
export const soLanSai = (t: TrangThaiCau): number => t.lichSu.filter((l) => !l.dung).length
/** Điểm "sai nhiều": số lần sai; câu 2 sao đang nợ tính ngang sai 2 lần. */
export const diemSaiNo = (t: TrangThaiCau, sao: number | null | undefined): number => Math.max(soLanSai(t), (Number(sao) || 0) >= SAO_PHAI_ON ? 2 : 0)
/** Vừa "Thầy đã chữa": mốc dạy lại cách hôm nay ≤ 1 ngày. */
export const vuaChua = (t: TrangThaiCau, homNay: string): boolean => !!t.ngayChua && soNgayGiua(t.ngayChua, homNay) <= 1
/**
 * Thứ tự nợ: (1) sai nhiều trước (2 sao ngang sai 2 lần) → (2) nợ lâu trước (ngày sai đầu cũ nhất) → (3) vừa "Thầy đã chữa" trước →
 * hoà thì băm theo ngày (tất định). Bỏ ưu tiên cũ "sắp chín trên vừa sai".
 */
export function soSanhNo(a: CauSrs, b: CauSrs, trangThai: ReadonlyMap<string, TrangThaiCau>, homNay: string): number {
  const ta = trangThai.get(a.qid)!, tb = trangThai.get(b.qid)!
  const sai = diemSaiNo(tb, b.sao) - diemSaiNo(ta, a.sao)
  if (sai) return sai
  const na = ta.ngayVaoNo ?? '9999', nb = tb.ngayVaoNo ?? '9999'
  if (na !== nb) return na < nb ? -1 : 1
  const ca = vuaChua(ta, homNay) ? 1 : 0, cb = vuaChua(tb, homNay) ? 1 : 0
  if (ca !== cb) return cb - ca
  return bam(`${homNay}|${a.qid}`) - bam(`${homNay}|${b.qid}`)
}

/** Trần nợ một ngày khi có chiến dịch: 50% thể lực/ngày (tối thiểu 1). */
export const tranNoNgay = (theLucNgay: number): number => Math.max(1, Math.floor(Math.max(1, theLucNgay) * TI_LE_TRAN_NO))
/** Số ngày ≈ để trả hết `luotNo` lượt nợ trong trần 50% của `theLucNgay`. */
export const soNgayTraNo = (luotNo: number, theLucNgay: number): number => (luotNo > 0 ? Math.ceil(luotNo / tranNoNgay(theLucNgay)) : 0)
/** Màn Chiến dịch báo thầy khi nợ cũ vượt trần từ ngần này ngày trở lên. */
export const NGUONG_BAO_NO_NGAY = 3

/** Nguồn của một lần làm để ghi nhãn. */
export type NguonNhan = 'bia' | 'doan' | 'dao' | 'thi' | 'len_bang' | 'dau_gio' | 'khac'
export const TEN_NGUON_NHAN: Record<NguonNhan, string> = { bia: 'Bi-a', doan: 'Đoàn', dao: 'Đảo', thi: 'Ca', len_bang: 'Lên bảng', dau_gio: 'Đầu giờ', khac: 'Khác' }
const ddmm = (ngay: string): string => `${ngay.slice(8, 10)}/${ngay.slice(5, 7)}`
/**
 * Nhãn nợ trên câu: "Sai 2 lần · Ca 26/09 · Lên bảng 28/09 · Thầy đã chữa 29/09". Liệt kê tối đa `toiDa` lần sai gần nhất (gộp cùng nguồn + ngày),
 * theo thứ tự thời gian; `chienDichCu` = "Chiến dịch 'Tên' · 25/09" khi câu là nợ của chiến dịch đã đóng. Chưa sai lần nào ⇒ null.
 */
export function nhanNo(lichSu: readonly { ngay: string; dung: boolean; nguon?: string }[], ngayChua?: string | null, chienDichCu?: { ten: string; hanNop: string } | null, toiDa = 3): string | null {
  const sai = lichSu.filter((l) => !l.dung)
  if (!sai.length) return null
  const lan: string[] = []
  for (const l of sai) {
    const ten = TEN_NGUON_NHAN[(l.nguon ?? 'khac') as NguonNhan] ?? 'Khác'
    const k = l.nguon && l.nguon !== 'khac' ? `${ten} ${ddmm(l.ngay)}` : `Sai ${ddmm(l.ngay)}`
    if (lan[lan.length - 1] !== k) lan.push(k)
  }
  const phan = [`Sai ${sai.length} lần`, ...[...new Set(lan)].slice(-toiDa)]
  if (chienDichCu) phan.push(`Chiến dịch '${chienDichCu.ten}' · ${ddmm(chienDichCu.hanNop)}`)
  if (ngayChua) phan.push(`Thầy đã chữa ${ddmm(ngayChua)}`)
  return phan.join(' · ')
}

// ---------------------------------------------------------------- ĐAN XEN câu trong ngày (thầy yêu cầu 29/09)
// "Câu nợ hãy hiển thị đan xen hợp lý trong ngày, đừng để học sinh nản, đặc biệt câu khó cho học sinh yếu." Luật CHỌN câu giữ nguyên
// (`lapKeHoachNgay`); ở đây chỉ đổi THỨ TỰ PHỤC VỤ và cách chia câu thành từng lượt game (chuyến Đảo, chặng Đoàn). Tất định.
/** Một câu đã phân loại để đan xen. `no` = câu nợ; `kho` = 2 sao / Vận dụng trở lên / sai ≥ 2 lần; `de` = câu "khởi động" dễ đúng. */
export interface CauDanXen { qid: string; no: boolean; kho: boolean; de: boolean; /** Mức (NB 0 … VDC 3) — chọn Trùm khó nhất cho em khá/giỏi. */ muc: number }
/** Sức em cho mật độ: yếu (L1) · trung bình (L2, không rõ) · khá/giỏi (L3, L4). */
export type SucEm = 'yeu' | 'tb' | 'kha'
export const sucEmCua = (h: HangEm | null | undefined): SucEm => (h === 'L1' ? 'yeu' : h === 'L3' || h === 'L4' ? 'kha' : 'tb')
/** Mật độ tối đa mỗi lượt 6 câu: em yếu 1 khó + 2 nợ, em TB 2 khó + 3 nợ, khá/giỏi không hạn (vẫn không liền nhau). Khó là trần CỨNG; nợ là trần mềm. */
export const MAT_DO_LUOT: Record<SucEm, { kho: number; no: number }> = { yeu: { kho: 1, no: 2 }, tb: { kho: 2, no: 3 }, kha: { kho: Number.POSITIVE_INFINITY, no: Number.POSITIVE_INFINITY } }
/** Phân loại một câu từ trạng thái + loại câu (mức, sao). Câu chưa có trạng thái ⇒ coi là câu mới. */
export function phanLoaiDanXen(qid: string, t: TrangThaiCau | undefined, loai: { mucDo?: string | null; sao?: number | null } | undefined): CauDanXen {
  const muc = mucCaNhan(loai?.mucDo ?? null)
  const laMoi = !t || t.laMoi
  const kho = (Number(loai?.sao) || 0) >= SAO_PHAI_ON || muc >= 2 || (!!t && soLanSai(t) >= 2)
  const no = !!t && laNo(t)
  const de = !kho && (laMoi ? muc === 0 : t!.thanhThao || t!.cc >= 1)
  return { qid, no, kho, de, muc }
}

/**
 * Chia danh sách câu (đúng thứ tự ưu tiên) thành các LƯỢT ≤ `co` câu theo mật độ của em: câu NỢ khó rải vòng tròn (mỗi lượt ≤ trần khó —
 * em yếu có nhiều nợ khó ⇒ nhiều lượt ngắn hơn, KHÔNG dồn vào một lượt); câu mới khó sang lượt ít khó nhất; câu nợ sang lượt ít nợ nhất;
 * câu còn lại lấp chỗ.
 * Không bớt câu nào (tổng giữ nguyên). Khá/giỏi: lượt đầy `co` câu theo thứ tự.
 */
export function chiaLuot<T extends CauDanXen>(ds: readonly T[], suc: SucEm, co = 6): T[][] {
  const n = ds.length
  if (!n) return []
  const md = MAT_DO_LUOT[suc]
  // Trần khó CỨNG cho câu NỢ khó (dồn nhiều ⇒ thêm lượt ngắn, trải cả ngày); câu MỚI khó chỉ rải đều (không làm vụn lượt ngày toàn câu Vận dụng).
  const khoNo = ds.filter((x) => x.kho && x.no)
  const khoMoi = ds.filter((x) => x.kho && !x.no)
  // Boss chốt 29/09: KHÔNG tách lượt vụn — mỗi lượt tối thiểu 4 câu (trừ lượt cuối); không còn câu dễ để xen (toàn câu khó) ⇒ lượt đầy như thường.
  const L0 = Math.ceil(n / co)
  const coDe = ds.some((x) => !x.kho)
  const L = !coDe || !Number.isFinite(md.kho) ? L0 : Math.max(L0, Math.min(Math.ceil(khoNo.length / md.kho), Math.floor(n / LUOT_TOI_THIEU)))
  // Khá/giỏi: lượt đầy `co` câu (lượt cuối phần dư); yếu/TB: số câu chia đều cho L lượt.
  const coLuot = Array.from({ length: L }, (_, i) => (suc === 'kha' ? Math.min(co, n - i * co) : Math.floor(n / L) + (i < n % L ? 1 : 0)))
  const luot: T[][] = Array.from({ length: L }, () => [])
  const soNo = Array(L).fill(0) as number[]
  const soKho = Array(L).fill(0) as number[]
  const conCho = (j: number) => luot[j]!.length < coLuot[j]!
  const dat = (j: number, x: T) => { luot[j]!.push(x); if (x.no) soNo[j]!++; if (x.kho) soKho[j]!++ }
  /** Lượt còn chỗ có `dem` nhỏ nhất (hoà ⇒ lượt sớm hơn); hết chỗ ⇒ lượt đầu chưa đủ `co`. */
  const itNhat = (dem: number[]) => {
    let tot = -1
    for (let j = 0; j < L; j++) if (conCho(j) && (tot < 0 || dem[j]! < dem[tot]!)) tot = j
    return tot >= 0 ? tot : Math.max(0, luot.findIndex((l) => l.length < co))
  }
  // Nợ khó: vòng tròn (mỗi lượt ≤ trần khó).
  khoNo.forEach((x, i) => {
    let j = i % L
    for (let k = 0; k < L && !conCho(j); k++) j = (j + 1) % L
    dat(j, x)
  })
  for (const x of khoMoi) dat(itNhat(soKho), x)
  for (const x of ds.filter((y) => !y.kho && y.no)) dat(itNhat(soNo), x)
  for (const x of ds.filter((y) => !y.kho && !y.no)) {
    const j = luot.findIndex((_, k) => conCho(k))
    dat(j >= 0 ? j : Math.max(0, luot.findIndex((l) => l.length < co)), x)
  }
  const viTri = new Map(ds.map((x, i) => [x.qid, i]))
  return luot.filter((l) => l.length).map((l) => l.sort((a, b) => viTri.get(a.qid)! - viTri.get(b.qid)!))
}

/** Số câu tối thiểu của một lượt (Boss chốt 29/09), trừ lượt cuối. */
export const LUOT_TOI_THIEU = 4

/**
 * Lượt TOÀN câu khó của em yếu/TB (không còn câu dễ để xen, Boss chốt 29/09): hai câu khó nhất tách nhau qua hiệp trùm — một câu ở nửa đầu
 * (hiệp 1–3), một câu ở nửa sau (hiệp 5–7); các câu còn lại xếp khó vừa → khó hơn.
 */
function xepLuotToanKho<T extends CauDanXen>(luot: readonly T[]): T[] {
  const viTri = new Map(luot.map((x, i) => [x.qid, i]))
  const tang = [...luot].sort((a, b) => a.muc - b.muc || viTri.get(a.qid)! - viTri.get(b.qid)!)
  const h2 = tang.pop()!, h1 = tang.pop()!
  const nua = Math.ceil(luot.length / 2)
  const ra = [...tang]
  ra.splice(nua - 1, 0, h1)
  ra.splice(nua + Math.floor((luot.length - nua) / 2), 0, h2)
  return ra
}

/** Điểm phạt của một thứ tự trong lượt (thấp = tốt). */
function phatThuTu<T extends CauDanXen>(xs: readonly T[], suc: SucEm, viTri: ReadonlyMap<string, number>, trumKho: boolean): number {
  const n = xs.length
  let p = 0
  const coDe = xs.some((x) => x.de)
  if (coDe && !xs[0]!.de) p += 40
  if (n > 1) {
    const cuoi = xs[n - 1]!
    if (trumKho) { if (cuoi.muc < Math.max(...xs.map((x) => x.muc))) p += 20 }
    else if (xs.filter((x) => x.de).length >= 2 && !cuoi.de) p += 20
    else if (!coDe && cuoi.kho && xs.some((x) => !x.kho)) p += 20
  }
  for (let i = 1; i < n; i++) {
    const a = xs[i - 1]!, b = xs[i]!
    if (a.kho && b.kho) p += 100
    if (a.no && b.no) p += 10
    if (suc === 'yeu' && b.kho && !a.de) p += 15
  }
  if (suc === 'yeu') xs.forEach((x, i) => { if (x.kho && (i === 0 || (i === n - 1 && !trumKho))) p += 15 })
  xs.forEach((x, i) => { p += 0.001 * Math.abs(i - viTri.get(x.qid)!) })
  return p
}
function* hoanVi<T>(xs: readonly T[]): Generator<T[]> {
  if (xs.length <= 1) { yield [...xs]; return }
  for (let i = 0; i < xs.length; i++) for (const r of hoanVi([...xs.slice(0, i), ...xs.slice(i + 1)])) yield [xs[i]!, ...r]
}
/**
 * Thứ tự câu TRONG một lượt: mở đầu bằng câu khởi động dễ, kết thúc bằng câu dễ (nếu có); không 2 câu khó liền nhau, không 2 câu nợ liền
 * nhau khi còn câu khác; em yếu: câu khó ở giữa lượt, ngay sau một câu dễ. `trumKho` (Đảo, em khá/giỏi, chuyến đủ 6): ải cuối (Trùm) là câu
 * khó nhất như thầy chốt 28/09. Duyệt mọi hoán vị (lượt ≤ 7 câu), hoà ⇒ gần thứ tự ưu tiên nhất. Lượt dài hơn ⇒ giữ nguyên thứ tự.
 */
export function danXenLuot<T extends CauDanXen>(luot: readonly T[], suc: SucEm, tuyChon: { trumKho?: boolean } = {}): T[] {
  if (luot.length <= 1 || luot.length > 7) return [...luot]
  if (suc !== 'kha' && !tuyChon.trumKho && luot.length >= 3 && luot.every((x) => x.kho)) return xepLuotToanKho(luot)
  const viTri = new Map(luot.map((x, i) => [x.qid, i]))
  let tot: T[] = [...luot], diem = phatThuTu(tot, suc, viTri, !!tuyChon.trumKho)
  for (const xs of hoanVi(luot)) {
    const d = phatThuTu(xs, suc, viTri, !!tuyChon.trumKho)
    if (d < diem - 1e-9) { tot = xs; diem = d }
  }
  return tot
}
/** Thứ tự phục vụ CẢ NGÀY của một danh sách (Đảo hoặc Đoàn): chia lượt theo mật độ rồi đan xen từng lượt. Không thêm, không bớt câu. */
export const danXenNgay = <T extends CauDanXen>(ds: readonly T[], suc: SucEm, co = 6): T[] => chiaLuot(ds, suc, co).flatMap((l) => danXenLuot(l, suc))

/** Huyết Chiến: từ câu thứ 41 trong ngày không rơi EXP, không rơi vật phẩm. `thuTu` đếm từ 1. */
export const duocThuongCauThu = (thuTu: number, tranNgay = TRAN_NGAY): boolean => thuTu <= tranNgay

/** Rương Bát Linh: mở khi xong trọn kế hoạch ngày (kế hoạch rỗng thì không có rương). */
export const moDuocRuong = (tongKeHoach: number, daLam: number): boolean => tongKeHoach > 0 && daLam >= tongKeHoach

/** Gợi ý M3 Phần I: gạch 2 trong 3 phương án sai, tất định theo khoá (em + câu + ngày). Không bao giờ gạch đáp án đúng. */
export function chonPhuongAnGach(dung: string, khoa: string): string[] {
  const sai = ['A', 'B', 'C', 'D'].filter((x) => x !== dung.toUpperCase())
  const giu = sai[bam(khoa) % sai.length]
  return sai.filter((x) => x !== giu)
}

// ---------------------------------------------------------------- tỉ lệ cho màn hình
export function tiLeChienDich(ds: readonly TrangThaiCau[]): { tong: number; coXat: number; thanhThao: number; canDayLai: number } {
  return {
    tong: ds.length,
    coXat: ds.filter((t) => !t.laMoi).length,
    thanhThao: ds.filter((t) => t.thanhThao).length,
    canDayLai: ds.filter((t) => t.catTia).length,
  }
}

/** Ngày đầu tiên thanh Thành thạo có thể tăng (câu đúng lần đầu sớm nhất + khoảng hẹn), để màn nói thật "tăng từ ngày …". */
export function ngayThanhThaoSomNhat(ds: readonly TrangThaiCau[]): string | null {
  let min: string | null = null
  for (const t of ds) if (!t.thanhThao && t.cc === 1 && t.henOn && (!min || t.henOn < min)) min = t.henOn
  return min
}

/** Sức chứa cho màn giao chiến dịch: tỉ lệ khối lượng / (D × trần). */
export function sucChua(khoiLuong: number, D: number, tranNgay = TRAN_NGAY): { tiLe: number; muc: 'xanh' | 'vang' | 'do' } {
  const tiLe = D * tranNgay > 0 ? khoiLuong / (D * tranNgay) : Number.POSITIVE_INFINITY
  return { tiLe, muc: tiLe <= 0.7 ? 'xanh' : tiLe <= 0.9 ? 'vang' : 'do' }
}

