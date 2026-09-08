// ĐỀ RIÊNG TỪNG EM — lõi thuật toán (DE-RIENG-TUNG-EM.md mục 4).
//
// Mỗi em một đề, trong đó ÍT NHẤT 30% là câu chính em đã sai ở ca trước. Ý
// nghĩa: câu sai quay lại trong chính bài kiểm tra, nên câu hỏi "con sửa được
// chưa" có câu trả lời bằng số chứ không bằng cảm nhận.
//
// File này THUẦN LOGIC, không gọi mạng, không đụng IndexedDB — để test dựng
// được lớp 40 em giả lập mà không cần máy chủ. Phần đi lấy dữ liệu nằm ở
// `de-rieng-nguon.ts`.
//
// BA ĐIỀU CẤM ĐƯỢC MÃ HOÁ THẲNG VÀO ĐÂY, không để chỗ gọi tự giữ:
//   1. Cấm độn câu ngẫu nhiên cho đủ tỉ lệ rồi gọi đó là câu lặp — thiếu thì
//      trả ít và nói ra bằng số (`thieuLap`).
//   2. Cấm lấy câu sai của ca em KHÔNG NỘP — quét ngược tìm ca em có nộp.
//   3. Cấm lặp mãi một câu — quá `TRAN_LAP_MOT_CAU` lần thì chuyển sang
//      `canDayLai`, việc của người dạy chứ không phải của máy ra đề.
import { hashSeed, seededPermutation } from './exam-shuffle'
import { PHAN_DE, rutDeCoBatBuoc, type CauUngVien, type KetQuaRut, type PhanDe, type YeuCauRut } from './rut-de'
import { CAU_HINH_DE_RIENG_MAC_DINH, soCauLapCan, type CauHinhDeRieng } from './cau-hinh-de-rieng'

/** Một ca đã chấm, rút gọn còn đúng phần thuật toán cần. Ca gần nhất đứng
 * ĐẦU mảng — chỗ gọi sắp xếp trước, ở đây không đoán lại theo ngày. */
export interface CaTruocDaCham {
  maCa: string
  /** sbd → mọi qid em ĐÃ LÀM ở ca đó. Em không có tên ⇒ em không nộp ca đó. */
  daLamCua: Record<string, string[]>
  /** sbd → qid em LÀM SAI ở ca đó (đã bỏ hoặc giữ câu trống theo cấu hình). */
  saiCua: Record<string, string[]>
}

/** Vì sao một em không đủ câu lặp. Rỗng = đủ, không phải báo gì. */
export type LyDoThieuLap = '' | 'moi_vao' | 'dung_het' | 'khong_nop' | 'it_cau_sai' | 'ngoai_kho'

export const CHU_LY_DO_THIEU: Record<Exclude<LyDoThieuLap, ''>, string> = {
  moi_vao: 'mới vào lớp, chưa có ca nào',
  dung_het: 'ca trước làm đúng hết',
  khong_nop: 'không nộp ca nào trong khoảng quét',
  it_cau_sai: 'ca trước sai ít hơn số câu lặp cần',
  ngoai_kho: 'câu em từng sai không nằm trong kho ca này',
}

export interface CauLapCuaEm {
  sbd: string
  /** Ca lấy câu sai — ca gần nhất CHÍNH EM có nộp, không phải ca gần nhất lớp. */
  tuCa: string
  /** qid em từng sai, đã bỏ câu quá trần lặp. Có thể ít hơn số cần. */
  qids: string[]
  /** Câu bị bỏ vì đã lặp đủ trần mà vẫn sai — thầy phải dạy lại, không hỏi lại. */
  canDayLai: string[]
  /** SỐ CÂU EM SAI ở ca lấy nguồn. Đây là MẪU SỐ của tỉ lệ 30%. */
  soSaiCaTruoc: number
  /** Số câu lặp CẦN của riêng em này = làm tròn lên 30% × `soSaiCaTruoc`. */
  can: number
  lyDo: LyDoThieuLap
}

/** ĐẾM SỐ LẦN EM SAI TỪNG CÂU qua toàn bộ lịch sử đưa vào.
 *
 * Dùng cho hai việc: chặn trần lặp lúc ra đề, và nhãn "Sai lần thứ N" lúc
 * chấm. Một chỗ đếm để hai chỗ không ra hai con số. */
export function demLanSai(dsCa: CaTruocDaCham[]): Record<string, Record<string, number>> {
  const ra: Record<string, Record<string, number>> = {}
  for (const ca of dsCa) {
    for (const [sbd, qids] of Object.entries(ca.saiCua)) {
      const cua = (ra[sbd] ??= {})
      for (const q of qids) cua[q] = (cua[q] ?? 0) + 1
    }
  }
  return ra
}

/** CHỌN CÂU LẶP CHO MỘT EM.
 *
 * Quét ngược `dsCa` (gần nhất trước) tìm ca ĐẦU TIÊN em có nộp; câu sai của em
 * ở đúng ca đó là nguồn câu lặp. Em nghỉ buổi trước thì lùi tiếp một ca — lấy
 * câu sai của ca em không làm là lấy câu của người khác.
 *
 * SỐ CÂU LẤY tính TỪ SỐ CÂU EM SAI Ở CA ĐÓ, không phải từ độ dài đề (thầy chốt
 * 08/09). Sai 10 câu ⇒ lấy 3. Mỗi em một con số, vì mỗi em sai một khác.
 *
 * `tranCau` = tổng số câu của đề lần này, chỉ để chặn trường hợp vô lý: em sai
 * 40 câu mà đề lần này 12 câu thì không thể lấy 12 câu lặp và không còn chỗ
 * cho câu mới. */
export function chonCauLapChoEm(
  sbd: string,
  dsCa: CaTruocDaCham[],
  tranCau: number,
  demSai: Record<string, Record<string, number>>,
  ch: CauHinhDeRieng = CAU_HINH_DE_RIENG_MAC_DINH,
): CauLapCuaEm {
  const quet = dsCa.slice(0, Math.max(0, ch.SO_CA_TRA_NGUOC))
  const caCoNop = quet.find((c) => (c.daLamCua[sbd] ?? []).length > 0)
  if (!caCoNop) {
    // Phân biệt "chưa từng xuất hiện" với "có tên mà ca nào cũng vắng": hai
    // chuyện khác nhau, thầy xử lý khác nhau.
    const tungCoTen = quet.some((c) => sbd in c.daLamCua || sbd in c.saiCua)
    return { sbd, tuCa: '', qids: [], canDayLai: [], soSaiCaTruoc: 0, can: 0, lyDo: tungCoTen ? 'khong_nop' : 'moi_vao' }
  }
  const daSai = caCoNop.saiCua[sbd] ?? []
  const demCua = demSai[sbd] ?? {}
  const canDayLai = daSai.filter((q) => (demCua[q] ?? 0) >= ch.TRAN_LAP_MOT_CAU)
  const conLap = daSai.filter((q) => (demCua[q] ?? 0) < ch.TRAN_LAP_MOT_CAU)
  const can = Math.min(soCauLapCan(daSai.length, ch), Math.max(0, Math.floor(Number(tranCau) || 0)))
  return {
    sbd,
    tuCa: caCoNop.maCa,
    qids: conLap.slice(0, can),
    canDayLai,
    soSaiCaTruoc: daSai.length,
    can,
    // Sai hết đều quá trần cũng là "không còn câu để lặp", nhưng lý do là dạy
    // lại chứ không phải làm đúng hết — nói đúng chuyện đang xảy ra.
    lyDo: conLap.length === 0 ? 'dung_het' : '',
  }
}

export interface YeuCauDeRieng {
  /** Ứng viên toàn kho, đã dàn phẳng (`dungUngVien`). */
  uv: Record<PhanDe, CauUngVien[]>
  /** Luật rút cho phần câu MỚI: y nguyên luật đang chạy, không đẻ luật thứ hai. */
  yc: YeuCauRut
  /** Danh sách SBD sẽ vào ca. */
  dsSbd: string[]
  dsCa: CaTruocDaCham[]
  ch?: CauHinhDeRieng
}

export interface EmThieuLap {
  sbd: string
  soLap: number
  can: number
  /** Ca trước em sai bao nhiêu câu — mẫu số của tỉ lệ, thầy cần thấy để biết
   * "cần 3" ở đâu ra. */
  soSaiCaTruoc: number
  lyDo: Exclude<LyDoThieuLap, ''>
}

export interface KetQuaDeRieng {
  /** sbd → danh sách qid của em đó. Đây chính là `boTheoEm` gửi lên máy chủ. */
  boTheoEm: Record<string, string[]>
  /** sbd → qid CÂU LẶP thật sự nằm trong đề em đó. Máy em dùng bản đồ này để
   * đánh dấu "em đã sai câu này buổi trước" ngay trong màn làm bài. */
  lapTheoEm: Record<string, string[]>
  /** HỢP của mọi câu mọi em — gói đề của ca phải chứa đủ chừng này câu. */
  ids: Set<string>
  /** sbd → số câu lặp THẬT SỰ có trong đề em đó. */
  soLapCua: Record<string, number>
  /** sbd → số câu lặp CẦN của riêng em. Mỗi em một con số vì mẫu số là số câu
   * chính em sai ở ca trước. */
  canCua: Record<string, number>
  /** sbd → số câu em sai ở ca lấy nguồn (mẫu số của 30%). */
  saiCaTruocCua: Record<string, number>
  soLapTrungBinh: number
  /** Em không đủ câu lặp, kèm lý do — màn Mở ca in thẳng danh sách này ra. */
  thieuLap: EmThieuLap[]
  /** qid đã lặp đủ trần mà vẫn sai, gom theo câu, kèm SBD của em liên quan. */
  canDayLai: { qid: string; dsSbd: string[] }[]
  /** Từng em rút thiếu bao nhiêu câu so với chỉ tiêu (kho không đủ câu). */
  thieuCau: { sbd: string; thieu: number }[]
}

function tongCauCua(yc: YeuCauRut): number {
  return PHAN_DE.reduce((s, p) => s + Math.max(0, Math.floor(Number(yc.soCau[p]) || 0)), 0)
}

/** DỰNG ĐỀ RIÊNG CHO CẢ LỚP.
 *
 * Trả về bản đồ `boTheoEm` mà `assignStudentQuestions` đã biết đọc sẵn từ
 * trước (nhánh CA CHẨN ĐOÁN) — không thêm nhánh phát đề thứ hai, không đổi
 * luật hash cũ, nên ca không bật chế độ này chấm lại vẫn ra đúng điểm cũ. */
export function dungDeRieng(y: YeuCauDeRieng): KetQuaDeRieng {
  const ch = y.ch ?? CAU_HINH_DE_RIENG_MAC_DINH
  const tongCau = tongCauCua(y.yc)
  const demSai = demLanSai(y.dsCa)
  // Tra câu theo id MỘT LẦN cho cả lớp: 40 em nhân kho vài trăm câu mà tra
  // tuyến tính là bốn vạn lượt duyệt không cần thiết.
  const cauCua = new Map<string, CauUngVien>()
  for (const p of PHAN_DE) for (const c of y.uv[p]) cauCua.set(c.id, c)

  const boTheoEm: Record<string, string[]> = {}
  const lapTheoEm: Record<string, string[]> = {}
  const soLapCua: Record<string, number> = {}
  const canCua: Record<string, number> = {}
  const saiCaTruocCua: Record<string, number> = {}
  const thieuLap: EmThieuLap[] = []
  const thieuCau: { sbd: string; thieu: number }[] = []
  const dayLai = new Map<string, string[]>()
  const ids = new Set<string>()

  for (const sbd of y.dsSbd) {
    const lap = chonCauLapChoEm(sbd, y.dsCa, tongCau, demSai, ch)
    const can = lap.can
    canCua[sbd] = can
    saiCaTruocCua[sbd] = lap.soSaiCaTruoc
    for (const q of lap.canDayLai) dayLai.set(q, [...(dayLai.get(q) ?? []), sbd])

    // Câu lặp phải CÒN TRONG KHO của ca này. Câu ca trước lấy từ đề khác mà ca
    // này không chọn thì không lặp được — bỏ ra và tính là thiếu, không im lặng.
    const batBuoc: Partial<Record<PhanDe, CauUngVien[]>> = {}
    for (const q of lap.qids) {
      const c = cauCua.get(q)
      if (!c) continue
      ;(batBuoc[c.phan] ??= []).push(c)
    }

    // Seed RIÊNG TỪNG EM cho phần câu mới: cùng seed là cả lớp lại chung một đề.
    const kq: KetQuaRut = rutDeCoBatBuoc(y.uv, { ...y.yc, seed: hashSeed(`${y.yc.seed}:${sbd}`) }, batBuoc)
    const qids = PHAN_DE.flatMap((p) => kq.chon[p].map((c) => c.id))
    boTheoEm[sbd] = qids
    for (const q of qids) ids.add(q)
    // ĐẾM LẠI trên bộ câu THẬT trong đề, không tin con số đếm lúc chọn: nếu
    // `rutDeCoBatBuoc` phải cắt bớt câu bắt buộc vì vượt chỉ tiêu phần, con số
    // báo cho thầy phải là con số sau khi cắt.
    const trongDe = new Set(qids)
    const cauLapThat = lap.qids.filter((q) => trongDe.has(q))
    const soLap = cauLapThat.length
    lapTheoEm[sbd] = cauLapThat
    soLapCua[sbd] = soLap
    const thieuTong = PHAN_DE.reduce((s, p) => s + kq.thieu[p], 0)
    if (thieuTong > 0) thieuCau.push({ sbd, thieu: thieuTong })
    // BÁO CẢ KHI `can` BẰNG 0. Em mới vào lớp, em nghỉ ca trước, em làm đúng
    // hết — cả ba đều ra 0 câu lặp, và cả ba đều là thứ thầy cần biết. Bản
    // trước chỉ báo khi `soLap < can`, nên đúng ba trường hợp này im lặng
    // hoàn toàn (thầy bắt được 08/09).
    if (soLap < can || lap.lyDo !== '') {
      // Nói ĐÚNG chuyện đang xảy ra, không gộp mọi thứ vào "đúng hết": em sai
      // 2 câu mà cần 6 là chuyện khác hẳn em sai 0 câu, và khác hẳn em sai
      // nhiều câu nhưng mấy câu đó không nằm trong kho ca này.
      const lyDo: Exclude<LyDoThieuLap, ''> = lap.lyDo !== '' ? lap.lyDo : soLap < lap.qids.length ? 'ngoai_kho' : 'it_cau_sai'
      thieuLap.push({ sbd, soLap, can, soSaiCaTruoc: lap.soSaiCaTruoc, lyDo })
    }
  }

  const tong = y.dsSbd.reduce((s, sbd) => s + (soLapCua[sbd] ?? 0), 0)
  return {
    boTheoEm,
    lapTheoEm,
    ids,
    soLapCua,
    canCua,
    saiCaTruocCua,
    soLapTrungBinh: y.dsSbd.length > 0 ? tong / y.dsSbd.length : 0,
    thieuLap,
    canDayLai: [...dayLai.entries()].map(([qid, dsSbd]) => ({ qid, dsSbd })),
    thieuCau,
  }
}

/** VỊ TRÍ CÂU LẶP TRONG ĐỀ CỦA MỘT EM — dùng để tự kiểm "không dồn lên đầu".
 *
 * Trả về chỉ số 0-based trong danh sách câu em THẬT SỰ nhận, tức là sau khi
 * `assignStudentQuestions` xếp lại theo thứ tự kho. */
export function viTriCauLap(qidTrongDe: string[], qidLap: string[]): number[] {
  const lap = new Set(qidLap)
  const ra: number[] = []
  qidTrongDe.forEach((q, i) => {
    if (lap.has(q)) ra.push(i)
  })
  return ra
}

/** Trộn thứ tự một danh sách qid theo seed của em — để hai em không những khác
 * bộ câu mà còn khác thứ tự. Chỉ dùng khi chỗ gọi cần thứ tự riêng; đường phát
 * đề chính lấy thứ tự theo kho nên câu lặp đã nằm rải sẵn. */
export function tronTheoEm(qids: string[], maCa: string, sbd: string): string[] {
  const perm = seededPermutation(qids.length, hashSeed(`${maCa}:${sbd}:thu-tu`))
  return perm.map((i) => qids[i])
}
