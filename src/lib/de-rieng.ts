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
import { PHAN_DE, locTheoYeuCau, type CauUngVien, type PhanDe, type YeuCauRut } from './rut-de'
import { CAU_HINH_DE_RIENG_MAC_DINH, SO_CA_BOC_NGAU_NHIEN as SO_CA_HOI_LAI, soCauLapCan, type CauHinhDeRieng } from './cau-hinh-de-rieng'
import { noiTapCam, sinhBoMotO, type CamTheoEm } from './de-rieng-tran-trung'
import { CAU_HINH_TRAN_TRUNG_MAC_DINH } from './de-rieng-cau-hinh'

/** Một ca đã chấm, rút gọn còn đúng phần thuật toán cần. Ca gần nhất đứng
 * ĐẦU mảng — chỗ gọi sắp xếp trước, ở đây không đoán lại theo ngày. */
export interface CaTruocDaCham {
  maCa: string
  /** sbd → mọi qid em ĐÃ LÀM ở ca đó. Em không có tên ⇒ em không nộp ca đó. */
  daLamCua: Record<string, string[]>
  /** sbd → qid em LÀM SAI ở ca đó (đã bỏ hoặc giữ câu trống theo cấu hình). */
  saiCua: Record<string, string[]>
}

/** MỘT CÂU EM CÒN PHẢI HỎI LẠI, theo hồ sơ nắm kiến thức (`nam_kt_cau`). */
export interface CauSaiHoSo {
  qid: string
  /** Số lần sai ở MỌI nguồn. Chỉ để ghi biên bản — trần lặp vẫn đếm bằng các ca thi. */
  lanSai: number
  /** Mốc ôn kế, ngày VN 'YYYY-MM-DD'. `≤ ngayCa` = câu đã TỚI HẠN ôn. */
  mocOnKe: string | null
  /** Mã dạng ba tầng, hoặc `CD:<chuyên đề>`. `null` = hồ sơ chưa biết dạng. */
  maDang: string | null
  trangThai: 'moi_sai' | 'dang_on'
}

/** HỒ SƠ ÔN CỦA MỘT EM cho ca sắp mở — bản đã đọc phòng thủ của lệnh `hoSoOnCa`
 * (hợp đồng: `docs/hop-dong-ho-so-on-ca-1909.md`). */
export interface HoSoOnEm {
  /** Ca máy chủ đã lấy nguồn. Chỉ để ghi biên bản. */
  tuCa: string
  sai: CauSaiHoSo[]
  /** Câu em sai ở ca trước mà hồ sơ nói THẲNG là đã khắc phục (đúng 3 mốc ở
   * BTVN/game/bài mẹ giao) — không hỏi lại nữa. Vắng mặt trong `sai` KHÔNG đủ để
   * coi là đã khắc phục: sổ có chỗ thưa, suy vậy là bỏ hỏi lại im lặng. */
  daKhacPhuc: string[]
  /** qid em có làm trong 7 ngày qua ở MỌI nguồn, MỚI NHẤT đứng đầu. */
  lam: string[]
}

const NGAY_VN = /^\d{4}-\d{2}-\d{2}$/

/** ĐỌC PHÒNG THỦ một mục `em[sbd]` của lệnh `hoSoOnCa`. Không bao giờ ném lỗi.
 *
 * Sai kiểu ở đâu thì BỎ đúng chỗ đó về giá trị vô hại: dòng `sai` hỏng ⇒ bỏ dòng
 * (câu đó xử theo luật cũ, vẫn được hỏi lại); `daKhacPhuc` hỏng ⇒ rỗng (không câu
 * nào bị bỏ hỏi lại); `lam` hỏng ⇒ rỗng (không cấm gì). Một dòng rác từ máy chủ
 * không thể làm em MẤT câu hỏi lại. */
export function docHoSoOnEm(v: unknown): HoSoOnEm {
  const o = typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
  const chuoiGon = (x: unknown): string[] => {
    if (!Array.isArray(x)) return []
    const ra: string[] = []
    const co = new Set<string>()
    for (const t of x) {
      const q = typeof t === 'string' ? t.trim() : ''
      if (q && !co.has(q)) {
        co.add(q)
        ra.push(q)
      }
    }
    return ra
  }
  const sai: CauSaiHoSo[] = []
  const coSai = new Set<string>()
  for (const t of Array.isArray(o.sai) ? o.sai : []) {
    if (typeof t !== 'object' || t === null) continue
    const d = t as Record<string, unknown>
    const qid = typeof d.qid === 'string' ? d.qid.trim() : ''
    if (!qid || coSai.has(qid)) continue
    if (d.trangThai !== 'moi_sai' && d.trangThai !== 'dang_on') continue
    coSai.add(qid)
    const lanSai = Math.floor(Number(d.lanSai))
    const moc = typeof d.mocOnKe === 'string' ? d.mocOnKe.trim().slice(0, 10) : ''
    const ma = typeof d.maDang === 'string' ? d.maDang.trim() : ''
    sai.push({
      qid,
      lanSai: Number.isFinite(lanSai) && lanSai > 0 ? lanSai : 0,
      mocOnKe: NGAY_VN.test(moc) ? moc : null,
      maDang: ma || null,
      trangThai: d.trangThai,
    })
  }
  return {
    tuCa: typeof o.tuCa === 'string' ? o.tuCa.trim() : '',
    sai,
    daKhacPhuc: chuoiGon(o.daKhacPhuc),
    lam: chuoiGon(o.lam),
  }
}

/** PHẦN THÊM CỦA `chonCauLapChoEm` KHI CA CÓ HỒ SƠ ÔN (19/09, GĐ 6 Kênh 1).
 *
 * KHÔNG truyền đối tượng này ⇒ hàm chạy đúng từng dòng của bản trước. Máy chủ
 * chưa có lệnh `hoSoOnCa` thì cả lớp đi đường đó — tương thích ngược là bắt buộc. */
export interface TuyChonHoSoLap {
  /** Hồ sơ của ĐÚNG em này. Thiếu = em chưa có dòng nào: thứ tự chọn như cũ. */
  hoSo?: HoSoOnEm
  /** Ngày VN của ca sắp mở — mốc so `mocOnKe`. Thiếu thì không câu nào "tới hạn". */
  ngayCa?: string
  /** qid → mã dạng của câu TRONG KHO ca này (ứng viên song sinh). */
  maDangCua?: Map<string, string>
  /** Hạt giống xoay ứng viên song sinh. Cùng seed + cùng sbd ⇒ cùng câu. */
  seed?: number
  /** qid song sinh → số em trong lớp ĐÃ nhận. `dungDeRieng` truyền CHUNG một Map
   * cho cả lớp, hàm này đọc rồi cộng vào — để hai em cùng sai một câu không
   * nhận cùng một câu song sinh khi kho còn câu khác cùng dạng. */
  demSongSinh?: Map<string, number>
}

/** Vì sao một em không đủ câu lặp. Rỗng = đủ, không phải báo gì. */
export type LyDoThieuLap = '' | 'moi_vao' | 'dung_het' | 'khong_nop' | 'it_cau_sai' | 'ngoai_kho' | 'het_cho' | 'da_khac_phuc'

export const CHU_LY_DO_THIEU: Record<Exclude<LyDoThieuLap, ''>, string> = {
  moi_vao: 'mới vào lớp, chưa có ca nào',
  dung_het: 'ca trước làm đúng hết',
  khong_nop: 'không nộp ca nào trong khoảng quét',
  it_cau_sai: 'ca trước sai ít hơn số câu lặp cần',
  ngoai_kho: 'câu em từng sai không nằm trong kho ca này',
  het_cho: 'đề không đủ chỗ — phần đó đã kín câu hỏi lại',
  da_khac_phuc: 'câu sai ca trước em đã khắc phục ở bài luyện (đúng đủ 3 mốc) — không hỏi lại',
}

export interface CauLapCuaEm {
  sbd: string
  /** Ca lấy câu sai — ca gần nhất CHÍNH EM có nộp, không phải ca gần nhất lớp. */
  tuCa: string
  /** qid câu khắc phục (gồm câu gốc và câu song sinh), đã bỏ câu quá trần lặp. */
  qids: string[]
  /** Danh sách câu sai gốc được giữ lại để kiểm tra xem đã đọc lời giải chưa. */
  cauGoc?: string[]
  /** Danh sách câu song sinh cùng dạng đổi số để triệt tiêu học vẹt. */
  songSinh?: string[]
  /** Câu bị bỏ vì đã lặp đủ trần mà vẫn sai — thầy phải dạy lại, không hỏi lại. */
  canDayLai: string[]
  /** Câu sai ca trước bị BỎ vì hồ sơ nói đã khắc phục. Chỉ có khi ca có hồ sơ ôn. */
  daKhacPhuc?: string[]
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

/** CHỌN CÂU KHẮC PHỤC THÔNG MINH CHO MỘT EM (THUẬT TOÁN SSR MỚI).
 *
 * 1. Quét tìm ca gần nhất em có nộp để lấy câu sai nguồn.
 * 2. Phân loại theo 3 phần (Phần I, Phần II, Phần III) khớp cấu trúc 14 câu.
 * 3. Ưu tiên dạng sai dai dẳng (`demSai`).
 * 4. Cơ chế Cặp đôi Song sinh (Isomorphic Twin): 50% câu gốc + 50% câu cùng dạng từ kho ca này. */
export function chonCauLapChoEm(
  sbd: string,
  dsCa: CaTruocDaCham[],
  tranCau: number,
  demSai: Record<string, Record<string, number>>,
  ch: CauHinhDeRieng = CAU_HINH_DE_RIENG_MAC_DINH,
  cauCua?: Map<string, CauUngVien>,
  daLamSet?: Set<string>,
  tuyChon?: TuyChonHoSoLap,
): CauLapCuaEm {
  const quet = dsCa.slice(0, Math.max(0, ch.TRAN_CA_QUET))
  const caCoNop = quet.find((c) => (c.daLamCua[sbd] ?? []).length > 0)
  if (!caCoNop) {
    const tungCoTen = quet.some((c) => sbd in c.daLamCua || sbd in c.saiCua)
    return { sbd, tuCa: '', qids: [], cauGoc: [], songSinh: [], canDayLai: [], soSaiCaTruoc: 0, can: 0, lyDo: tungCoTen ? 'khong_nop' : 'moi_vao' }
  }

  let daSai: string[]
  let tuCa = caCoNop.maCa
  if (ch.PHAM_VI_HOI_LAI === 'ba_ca') {
    const dem = new Map<string, number>()
    const thuTu: string[] = []
    const caLay: string[] = []
    for (const c of quet) {
      if ((c.daLamCua[sbd] ?? []).length === 0) continue
      if (caLay.length >= SO_CA_HOI_LAI) break
      caLay.push(c.maCa)
      for (const q of c.saiCua[sbd] ?? []) {
        if (!dem.has(q)) thuTu.push(q)
        dem.set(q, (dem.get(q) ?? 0) + 1)
      }
    }
    const goc = new Map(thuTu.map((q, i) => [q, i]))
    daSai = [...thuTu].sort((a, b) => (dem.get(b) ?? 0) - (dem.get(a) ?? 0) || (goc.get(a) ?? 0) - (goc.get(b) ?? 0))
    tuCa = caLay.join(' + ')
  } else {
    daSai = caCoNop.saiCua[sbd] ?? []
  }

  const demCua = demSai[sbd] ?? {}
  // HỒ SƠ ÔN (19/09): câu hồ sơ nói THẲNG `da_khac_phuc` thì thôi hỏi lại, và
  // cũng thôi xếp vào "cần dạy lại" — em đã tự chữa được ở BTVN/game. `sai` thắng
  // `daKhacPhuc` nếu máy chủ lỡ trả một qid ở cả hai nơi: thà hỏi thừa một câu.
  const hoSo = tuyChon?.hoSo
  const conSaiTheoHoSo = new Map((hoSo?.sai ?? []).map((c) => [c.qid, c]))
  const daKP = new Set((hoSo?.daKhacPhuc ?? []).filter((q) => !conSaiTheoHoSo.has(q)))
  const daKhacPhuc = daSai.filter((q) => daKP.has(q))
  const canDayLai = daSai.filter((q) => (demCua[q] ?? 0) >= ch.TRAN_LAP_MOT_CAU && !daKP.has(q))
  const conLap = daSai.filter((q) => (demCua[q] ?? 0) < ch.TRAN_LAP_MOT_CAU && !daKP.has(q))
  // SỐ CẦN vẫn tính trên MỌI câu em sai ca trước (kể cả câu đã khắc phục) — hồ
  // sơ chỉ được đổi THỨ TỰ và bỏ câu, không được đổi mẫu số của luật 30%.
  const can = Math.min(soCauLapCan(daSai.length, ch), Math.max(0, Math.floor(Number(tranCau) || 0)))
  const themHoSo = daKhacPhuc.length > 0 ? { daKhacPhuc } : {}

  if (conLap.length === 0 || can === 0) {
    return {
      sbd,
      tuCa,
      qids: [],
      cauGoc: [],
      songSinh: [],
      canDayLai,
      ...themHoSo,
      soSaiCaTruoc: daSai.length,
      can,
      lyDo: conLap.length === 0 ? (daKhacPhuc.length > 0 && can > 0 ? 'da_khac_phuc' : 'dung_het') : '',
    }
  }

  // SẮP XẾP ƯU TIÊN LỖ HỔNG (nếu bật UU_TIEN_LO_HONG). Có hồ sơ thì trong CÙNG
  // mức ưu tiên, câu đã TỚI HẠN ôn (`mocOnKe ≤ ngayCa`) đứng trước, quá hạn lâu
  // hơn đứng trước nữa. `sort` của JS ổn định nên hoà thì giữ thứ tự cũ — không
  // có hồ sơ là ra đúng thứ tự bản trước.
  const ngayCa = tuyChon?.ngayCa ?? ''
  const mocToiHan = (q: string): string => {
    const moc = conSaiTheoHoSo.get(q)?.mocOnKe ?? ''
    return moc !== '' && ngayCa !== '' && moc <= ngayCa ? moc : ''
  }
  const soToiHan = (a: string, b: string): number => {
    const ma = mocToiHan(a)
    const mb = mocToiHan(b)
    if (ma === mb) return 0
    if (ma === '') return 1
    if (mb === '') return -1
    return ma < mb ? -1 : 1
  }
  const coToiHan = conLap.some((q) => mocToiHan(q) !== '')
  const conLapSapXep = ch.UU_TIEN_LO_HONG
    ? [...conLap].sort((a, b) => (demCua[b] ?? 0) - (demCua[a] ?? 0) || (coToiHan ? soToiHan(a, b) : 0))
    : coToiHan
      ? [...conLap].sort(soToiHan)
      : conLap

  // PHÂN BỔ THÔNG MINH CHO CẤU TRÚC ĐỀ (nếu có thông tin kho và cấu hình)
  if (cauCua && cauCua.size > 0) {
    const phanI = conLapSapXep.filter((q) => cauCua.get(q)?.phan === 'I')
    const phanII = conLapSapXep.filter((q) => cauCua.get(q)?.phan === 'II')
    const phanIII = conLapSapXep.filter((q) => cauCua.get(q)?.phan === 'III')
    const phanConLai = conLapSapXep.filter((q) => !['I', 'II', 'III'].includes(cauCua.get(q)?.phan || ''))

    // Ca 14 câu chuẩn (9-2-3): áp dụng trần phân bổ { I: 3, II: 1, III: 1 }
    const laCa14 = tranCau === 14
    let dsChonGoc: string[]

    if (laCa14 && ch.TRAN_PHAN_BO_14_CAU) {
      const limitI = ch.TRAN_PHAN_BO_14_CAU.I ?? 3
      const limitII = ch.TRAN_PHAN_BO_14_CAU.II ?? 1
      const limitIII = ch.TRAN_PHAN_BO_14_CAU.III ?? 1

      let quotaI = Math.min(limitI, phanI.length)
      let quotaII = Math.min(limitII, phanII.length)
      let quotaIII = Math.min(limitIII, phanIII.length)

      while (quotaI + quotaII + quotaIII > can) {
        if (quotaI > 1) quotaI--
        else if (quotaIII > 1) quotaIII--
        else if (quotaII > 0) quotaII--
        else if (quotaI > 0) quotaI--
        else if (quotaIII > 0) quotaIII--
        else break
      }

      dsChonGoc = [...phanI.slice(0, quotaI), ...phanII.slice(0, quotaII), ...phanIII.slice(0, quotaIII)]
      if (dsChonGoc.length < can && phanConLai.length > 0) {
        dsChonGoc.push(...phanConLai.slice(0, can - dsChonGoc.length))
      }
    } else {
      // Ca bình thường: lấy theo thứ tự ưu tiên
      dsChonGoc = conLapSapXep.slice(0, can)
    }

    // CƠ CHẾ CẶP ĐÔI SONG SINH (Isomorphic Twin)
    const cauGoc: string[] = []
    const songSinh: string[] = []
    const daChonId = new Set<string>()

    const soSongSinhCan = ch.CO_CAU_SONG_SINH && dsChonGoc.length >= 2
      ? Math.floor(dsChonGoc.length * ch.TI_LE_SONG_SINH)
      : 0

    // Tập hợp ứng viên trong kho ca này theo dạng bài cụ thể
    const ungVienTheoDang = new Map<string, CauUngVien[]>()
    // CA CÓ HỒ SƠ ÔN: thêm một bảng thứ hai, ghép theo MÃ DẠNG. Khoá cũ
    // `phan:lý thuyết|bài tập` coi mọi câu bài tập Phần I là "cùng dạng" — câu
    // este ghép với câu điện phân. Mã dạng ba tầng mới là cùng dạng thật.
    const ungVienTheoMaDang = new Map<string, CauUngVien[]>()
    for (const cand of cauCua.values()) {
      if (cand.dang && cand.dang !== 'chua_ro') {
        const keyDang = `${cand.phan}:${cand.dang}`
        const arr = ungVienTheoDang.get(keyDang) ?? []
        arr.push(cand)
        ungVienTheoDang.set(keyDang, arr)
      }
      if (tuyChon) {
        const k = khoaMaDang(cand.phan, tuyChon.maDangCua?.get(cand.id), cand.dang)
        if (k) ungVienTheoMaDang.set(k, [...(ungVienTheoMaDang.get(k) ?? []), cand])
      }
    }
    const lamGanDay = new Set(hoSo?.lam ?? [])

    for (const q of dsChonGoc) {
      const infoQ = cauCua.get(q)
      const muonSongSinh = songSinh.length < soSongSinhCan

      if (muonSongSinh && infoQ && tuyChon) {
        // ĐƯỜNG MỚI. Mã dạng của câu gốc: hồ sơ trước, kho sau. Có mã dạng thì
        // CHỈ ghép trong mã dạng đó — không thấy câu cùng dạng thì giữ câu gốc,
        // không lùi về khoá lỏng (câu "song sinh" khác dạng là câu lạ, không
        // phải phép thử chống học vẹt). Thiếu mã dạng mới dùng khoá cũ.
        const maDangQ = conSaiTheoHoSo.get(q)?.maDang || tuyChon.maDangCua?.get(q)
        const kMa = khoaMaDang(infoQ.phan, maDangQ, infoQ.dang)
        const khoa = kMa ?? (infoQ.dang && infoQ.dang !== 'chua_ro' ? `${infoQ.phan}:${infoQ.dang}` : '')
        const cands = kMa ? (ungVienTheoMaDang.get(kMa) ?? []) : (ungVienTheoDang.get(khoa) ?? [])
        // XOAY THEO EM, không lấy phần tử ĐẦU: bản trước mọi em cùng sai một dạng
        // nhận CÙNG một câu song sinh, mà câu đó bị khoá nên pha hạ trùng không
        // sửa được. Nay: câu ÍT em nhận nhất trước; hoà thì theo vòng xoay bắt
        // đầu từ `hash(seed|sbd|khoá)` — tất định, không `Math.random`.
        const L = cands.length
        const dau = L > 0 ? hashSeed(`${tuyChon.seed ?? 0}|${sbd}|${khoa}`) % L : 0
        let twin: CauUngVien | undefined
        let diemTwin = Infinity
        for (let buoc = 0; buoc < L; buoc++) {
          const c = cands[(dau + buoc) % L]!
          if (c.id === q || daChonId.has(c.id) || daLamSet?.has(c.id) || lamGanDay.has(c.id)) continue
          const diem = tuyChon.demSongSinh?.get(c.id) ?? 0
          if (diem < diemTwin) {
            twin = c
            diemTwin = diem
          }
        }
        if (twin) {
          songSinh.push(twin.id)
          daChonId.add(twin.id)
          tuyChon.demSongSinh?.set(twin.id, diemTwin + 1)
          continue
        }
      } else if (muonSongSinh && infoQ && infoQ.dang && infoQ.dang !== 'chua_ro') {
        const keyDang = `${infoQ.phan}:${infoQ.dang}`
        const cands = ungVienTheoDang.get(keyDang) ?? []
        const twin = cands.find(
          (c) => c.id !== q && !daChonId.has(c.id) && !(daLamSet?.has(c.id))
        )
        if (twin) {
          songSinh.push(twin.id)
          daChonId.add(twin.id)
          continue
        }
      }

      // Giữ câu gốc
      cauGoc.push(q)
      daChonId.add(q)
    }

    const qids = [...cauGoc, ...songSinh]
    return {
      sbd,
      tuCa,
      qids,
      cauGoc,
      songSinh,
      canDayLai,
      ...themHoSo,
      soSaiCaTruoc: daSai.length,
      can,
      lyDo: qids.length === 0 ? 'dung_het' : qids.length < can && daKhacPhuc.length > 0 ? 'da_khac_phuc' : '',
    }
  }

  // Mặc định nếu không có bản đồ kho: lấy câu gốc theo thứ tự ưu tiên
  const qids = conLapSapXep.slice(0, can)
  return {
    sbd,
    tuCa,
    qids,
    cauGoc: qids,
    songSinh: [],
    canDayLai,
    ...themHoSo,
    soSaiCaTruoc: daSai.length,
    can,
    lyDo: conLap.length === 0 ? 'dung_het' : qids.length < can && daKhacPhuc.length > 0 ? 'da_khac_phuc' : '',
  }
}

/** KHOÁ GHÉP SONG SINH THEO MÃ DẠNG. Trả `null` khi câu không có mã dạng — chỗ
 * gọi lùi về khoá cũ.
 *
 * Luôn kèm `phan`: câu song sinh THAY câu gốc trong đúng phần đó của đề, khác
 * phần là vỡ cấu trúc 9-2-3. Mã `CD:<chuyên đề>` (kho chưa gán mã ba tầng) thì
 * kèm thêm lý thuyết/bài tập khi biết: cùng chuyên đề mà một câu tính toán ghép
 * với một câu lý thuyết thì không phải song sinh. */
function khoaMaDang(phan: PhanDe, maDang: string | null | undefined, kieu: CauUngVien['dang']): string | null {
  const ma = String(maDang ?? '').trim()
  if (!ma) return null
  return ma.startsWith('CD:') && kieu && kieu !== 'chua_ro' ? `${phan}|${ma}|${kieu}` : `${phan}|${ma}`
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
  /** HỒ SƠ ÔN (19/09) — sbd → hồ sơ, từ lệnh máy chủ `hoSoOnCa`.
   *
   * CÓ trường này (kể cả `{}`) = ca đi ĐƯỜNG MỚI: bỏ câu đã khắc phục, câu tới
   * hạn ôn đứng trước, song sinh ghép theo mã dạng và xoay theo em, phần câu mới
   * né câu em vừa làm trong tuần. KHÔNG có (máy chủ chưa có lệnh, lệnh lỗi) =
   * đúng từng dòng của bản trước, `boTheoEm` y hệt — có test khoá. */
  hoSo?: Record<string, HoSoOnEm>
  /** Ngày VN 'YYYY-MM-DD' của ca sắp mở. Chỗ gọi truyền vào — trong này cấm đọc đồng hồ. */
  ngayCa?: string
  /** qid → mã dạng của câu trong kho ca này (`dang.ma`, thiếu thì `CD:<chuyên đề>`). */
  maDangCua?: Record<string, string>
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
  /** sbd → qid CÂU KHẮC PHỤC thật sự nằm trong đề em đó. */
  lapTheoEm: Record<string, string[]>
  /** sbd → danh sách câu sai gốc được kiểm tra lại. */
  cauGocTheoEm: Record<string, string[]>
  /** sbd → danh sách câu song sinh cùng dạng đổi số để chống học vẹt. */
  songSinhTheoEm: Record<string, string[]>
  /** HỢP của mọi câu mọi em — gói đề của ca phải chứa đủ chừng này câu. */
  ids: Set<string>
  /** sbd → số câu lặp THẬT SỰ có trong đề em đó. */
  soLapCua: Record<string, number>
  /** sbd → số câu lặp CẦN của riêng em. Mỗi em một con số vì mẫu số là số câu
   * chính em sai ở ca trước. */
  canCua: Record<string, number>
  /** sbd → số câu em sai ở ca lấy nguồn (mẫu số của 30%). */
  saiCaTruocCua: Record<string, number>
  /** sbd → mã ca THẬT SỰ lấy câu sai của em đó. Quét mấy ca không có nghĩa là
   * dùng cả mấy ca: ở `gan_nhat` chỉ dùng ĐÚNG MỘT ca gần nhất em có nộp. */
  tuCaCua: Record<string, string>
  soLapTrungBinh: number
  /** Em không đủ câu lặp, kèm lý do — màn Mở ca in thẳng danh sách này ra. */
  thieuLap: EmThieuLap[]
  /** qid đã lặp đủ trần mà vẫn sai, gom theo câu, kèm SBD của em liên quan. */
  canDayLai: { qid: string; dsSbd: string[] }[]
  /** Từng em rút thiếu bao nhiêu câu so với chỉ tiêu (kho không đủ câu). */
  thieuCau: { sbd: string; thieu: number }[]
  /** KHO MỎNG PHẢI NỚI TẬP CẤM: em nào, bao nhiêu câu MỚI trong đề là câu em vừa
   * làm trong tuần (nới câu cũ nhất trước). Rỗng = kho đủ, hoặc ca không có hồ sơ. */
  noiCam: { sbd: string; soNoi: number }[]
  /** sbd → câu sai ca trước KHÔNG hỏi lại vì hồ sơ nói đã khắc phục. */
  daKhacPhucTheoEm: Record<string, string[]>
}

function tongCauCua(yc: YeuCauRut): number {
  return PHAN_DE.reduce((s, p) => s + Math.max(0, Math.floor(Number(yc.soCau[p]) || 0)), 0)
}

/** DỰNG ĐỀ RIÊNG CHO CẢ LỚP (NÂNG CẤP SSR TOÀN DIỆN).
 *
 * Trả về bản đồ `boTheoEm` mà `assignStudentQuestions` đã biết đọc sẵn từ
 * trước (nhánh CA CHẨN ĐOÁN) — không thêm nhánh phát đề thứ hai, không đổi
 * luật hash cũ, nên ca không bật chế độ này chấm lại vẫn ra đúng điểm cũ.
 *
 * VÁ 19/09 — PHẦN "CÂU MỚI" DỰNG CHUNG CHO CẢ LỚP, KHÔNG BỐC ĐỘC LẬP TỪNG EM.
 * Bản trước gọi `rutDeCoBatBuoc` riêng cho từng em (seed `${ca}:${idxEm}:{sbd}`)
 * — mỗi em bốc độc lập từ cùng một kho. Kho đúng chuyên đề mà mỏng (sau vá
 * "rút đề lẫn chương" không còn được bù bằng chương khác nữa) thì độc lập kiểu
 * này luôn có một cặp em xui xẻo trùng gần hết đề — đúng sự cố thầy báo.
 *
 * Nay dùng chung một thuật toán với màn Ca thi (`sinhBoMotO` /
 * `de-rieng-tran-trung.ts`, đã có sẵn, đã có test riêng đo đỉnh trùng): pha 1
 * chia vòng tròn công bằng tần suất, pha 2 đổi chỗ hạ ĐỈNH trùng giữa mọi cặp
 * em — chạy MỘT LƯỢT cho cả lớp, mỗi phần. Câu khắc phục cá nhân của từng em
 * (`batBuoc`) được KHOÁ — pha 2 không bao giờ đổi mất câu em cần phải làm lại;
 * một cặp trùng chỉ vì cùng dính đúng câu khắc phục là trùng thật của lịch sử
 * làm bài, không phải chỗ sửa được. */
export function dungDeRieng(y: YeuCauDeRieng): KetQuaDeRieng {
  const ch = y.ch ?? CAU_HINH_DE_RIENG_MAC_DINH
  const tongCau = tongCauCua(y.yc)
  const demSai = demLanSai(y.dsCa)
  // Tra câu theo id MỘT LẦN cho cả lớp: 40 em nhân kho vài trăm câu mà tra
  // tuyến tính là bốn vạn lượt duyệt không cần thiết.
  const cauCua = new Map<string, CauUngVien>()
  for (const p of PHAN_DE) for (const c of y.uv[p]) cauCua.set(c.id, c)

  const m = y.dsSbd.length
  const lapCuaEm: ReturnType<typeof chonCauLapChoEm>[] = []
  const batBuocCuaEm: Partial<Record<PhanDe, CauUngVien[]>>[] = []
  const canCua: Record<string, number> = {}
  const saiCaTruocCua: Record<string, number> = {}
  const tuCaCua: Record<string, string> = {}
  const dayLai = new Map<string, string[]>()

  // PHA A — câu khắc phục riêng từng em. Ca KHÔNG có hồ sơ ôn thì `tuyChonLap`
  // là `undefined` và `chonCauLapChoEm` chạy đúng bản trước.
  const maDangCua = y.hoSo && y.maDangCua ? new Map(Object.entries(y.maDangCua)) : undefined
  const demSongSinh = new Map<string, number>()
  const daKhacPhucTheoEm: Record<string, string[]> = {}
  for (let idxEm = 0; idxEm < m; idxEm++) {
    const sbd = y.dsSbd[idxEm]!
    const daLamSet = new Set<string>()
    for (const ca of y.dsCa) {
      for (const q of (ca.daLamCua[sbd] ?? [])) daLamSet.add(q)
    }
    const tuyChonLap: TuyChonHoSoLap | undefined = y.hoSo
      ? { hoSo: y.hoSo[sbd], ngayCa: y.ngayCa, maDangCua, seed: y.yc.seed, demSongSinh }
      : undefined
    const lap = chonCauLapChoEm(sbd, y.dsCa, tongCau, demSai, ch, cauCua, daLamSet, tuyChonLap)
    if (lap.daKhacPhuc && lap.daKhacPhuc.length > 0) daKhacPhucTheoEm[sbd] = lap.daKhacPhuc
    lapCuaEm.push(lap)
    canCua[sbd] = lap.can
    saiCaTruocCua[sbd] = lap.soSaiCaTruoc
    tuCaCua[sbd] = lap.tuCa
    for (const q of lap.canDayLai) dayLai.set(q, [...(dayLai.get(q) ?? []), sbd])

    // Câu lặp phải CÒN TRONG KHO của ca này. Câu ca trước lấy từ đề khác mà ca
    // này không chọn thì không lặp được — bỏ ra và tính là thiếu, không im lặng.
    const batBuoc: Partial<Record<PhanDe, CauUngVien[]>> = {}
    for (const q of lap.qids) {
      const c = cauCua.get(q)
      if (!c) continue
      ;(batBuoc[c.phan] ??= []).push(c)
    }
    batBuocCuaEm.push(batBuoc)
  }

  // PHA B — câu mới, dựng CHUNG cho cả lớp từng phần một, chặn đỉnh trùng.
  const qidsCuaEm: string[][] = Array.from({ length: m }, () => [])
  const thieuTongCuaEm = new Array<number>(m).fill(0)
  const soNoiCuaEm = new Array<number>(m).fill(0)
  const ids = new Set<string>()

  for (const p of PHAN_DE) {
    const canP = Math.max(0, Math.floor(Number(y.yc.soCau[p]) || 0))
    if (canP <= 0 || m === 0) continue

    // Câu khắc phục KHÔNG qua bộ lọc mức độ/dạng/sao — giữ đúng hành vi cũ.
    const boSan: Set<string>[] = batBuocCuaEm.map((b) => new Set((b[p] ?? []).slice(0, canP).map((c) => c.id)))

    const hop = locTheoYeuCau(y.uv[p], y.yc)
    // Kho lọc không đủ cho MỘT em thì bỏ lọc, lấy nguyên kho phần này — y hệt
    // đường bù cũ của `rutDeCoBatBuoc`, chỉ khác là quyết định MỘT LẦN cho cả
    // lớp thay vì lặp lại quyết định giống hệt nhau cho từng em.
    const pool = hop.length >= canP ? hop : y.uv[p]
    const idsPool = pool.map((c) => c.id)

    // TẬP CẤM THEO TỪNG EM = câu em vừa làm trong tuần (`lam` của hồ sơ ôn): đề
    // thi không phát lại câu vừa giao BTVN/khắc phục/bài mẹ. Câu khắc phục của
    // chính em (`boSan`) được MIỄN — hỏi lại câu sai là chủ ý, không phải trùng.
    // Không em nào có `lam` dính kho phần này thì `camTheoEm` là `undefined`: đúng lời gọi cũ.
    let camTheoEm: CamTheoEm | undefined
    if (y.hoSo) {
      const trongPool = new Set(idsPool)
      const cam = y.dsSbd.map((sbd, e) => (y.hoSo?.[sbd]?.lam ?? []).filter((q) => trongPool.has(q) && !boSan[e]!.has(q)))
      if (cam.some((c) => c.length > 0)) camTheoEm = { cam }
    }

    const boPhan = sinhBoMotO(idsPool, canP, m, hashSeed(`${y.yc.seed}:${p}`), CAU_HINH_TRAN_TRUNG_MAC_DINH, Date.now(), boSan, boSan, camTheoEm)

    for (let e = 0; e < m; e++) {
      const bo = boPhan[e] ?? new Set<string>()
      for (const q of bo) qidsCuaEm[e]!.push(q)
      thieuTongCuaEm[e]! += Math.max(0, canP - bo.size)
      soNoiCuaEm[e]! += camTheoEm?.soNoi?.[e] ?? 0
    }
  }

  const boTheoEm: Record<string, string[]> = {}
  const lapTheoEm: Record<string, string[]> = {}
  const cauGocTheoEm: Record<string, string[]> = {}
  const songSinhTheoEm: Record<string, string[]> = {}
  const soLapCua: Record<string, number> = {}
  const thieuLap: EmThieuLap[] = []
  const thieuCau: { sbd: string; thieu: number }[] = []
  const noiCam: { sbd: string; soNoi: number }[] = []

  for (let idxEm = 0; idxEm < m; idxEm++) {
    const sbd = y.dsSbd[idxEm]!
    const lap = lapCuaEm[idxEm]!
    const can = lap.can
    const qids = qidsCuaEm[idxEm]!
    boTheoEm[sbd] = qids
    for (const q of qids) ids.add(q)
    // ĐẾM LẠI trên bộ câu THẬT trong đề, không tin con số đếm lúc chọn
    const trongDe = new Set(qids)
    const cauLapThat = lap.qids.filter((q) => trongDe.has(q))
    const soLap = cauLapThat.length
    lapTheoEm[sbd] = cauLapThat
    cauGocTheoEm[sbd] = (lap.cauGoc ?? []).filter((q) => trongDe.has(q))
    songSinhTheoEm[sbd] = (lap.songSinh ?? []).filter((q) => trongDe.has(q))
    soLapCua[sbd] = soLap
    const thieuTong = thieuTongCuaEm[idxEm]!
    if (thieuTong > 0) thieuCau.push({ sbd, thieu: thieuTong })
    if (soNoiCuaEm[idxEm]! > 0) noiCam.push({ sbd, soNoi: soNoiCuaEm[idxEm]! })
    if (soLap < can || lap.lyDo !== '') {
      const coTrongKho = lap.qids.filter((q) => cauCua.has(q)).length
      const lyDo: Exclude<LyDoThieuLap, ''> =
        lap.lyDo !== ''
          ? lap.lyDo
          : soLap < coTrongKho
            ? 'het_cho'
            : soLap < lap.qids.length
              ? 'ngoai_kho'
              : 'it_cau_sai'
      thieuLap.push({ sbd, soLap, can, soSaiCaTruoc: lap.soSaiCaTruoc, lyDo })
    }
  }

  const tong = y.dsSbd.reduce((s, sbd) => s + (soLapCua[sbd] ?? 0), 0)
  return {
    boTheoEm,
    lapTheoEm,
    cauGocTheoEm,
    songSinhTheoEm,
    ids,
    soLapCua,
    canCua,
    saiCaTruocCua,
    tuCaCua,
    soLapTrungBinh: y.dsSbd.length > 0 ? tong / y.dsSbd.length : 0,
    thieuLap,
    canDayLai: [...dayLai.entries()].map(([qid, dsSbd]) => ({ qid, dsSbd })),
    thieuCau,
    noiCam,
    daKhacPhucTheoEm,
  }
}

// ---------------------------------------------------------------------------
// LƯỢT HAI — EM CÙNG LỚP CHƯA VÀO PHÒNG CHỜ LÚC THẦY BẤM BẮT ĐẦU (19/09)
// ---------------------------------------------------------------------------

export interface YeuCauLuotHai {
  /** ĐÚNG yêu cầu đã đưa vào `dungDeRieng` ở lượt một. Kho phần câu MỚI của em
   * vắng là kho này — không phải `uvThem` — để "câu ít dùng nhất" đo trên cùng
   * một kho với bộ đếm của lượt một. */
  y: YeuCauDeRieng
  /** Kết quả lượt một, ĐÃ CHỐT. Hàm này chỉ ĐỌC nó: bộ đề của em có mặt không
   * đổi một qid, em vắng không chiếm suất chia vòng tròn của ai. */
  luotMot: KetQuaDeRieng
  /** Em cùng lớp chưa vào phòng chờ. Thứ tự là một phần đầu vào (chỗ gọi sắp theo SBD). */
  dsSbdVang: string[]
  /** Hồ sơ ôn của em vắng. `undefined` = lượt `hoSoOnCa` của em vắng hỏng ⇒ em
   * vắng rút theo LUẬT CŨ (không hồ sơ) — không liên quan gì tới em có mặt. */
  hoSoVang?: Record<string, HoSoOnEm>
  /** Kho MỞ RỘNG = kho lượt một + câu em vắng từng sai vừa nối thêm. Chỉ dùng để
   * TRA câu khắc phục và tìm câu song sinh. Thiếu thì dùng kho lượt một. */
  uvThem?: Record<PhanDe, CauUngVien[]>
  /** qid → mã dạng trên kho mở rộng. Thiếu thì dùng `y.maDangCua`. */
  maDangCuaThem?: Record<string, string>
}

export interface KetQuaLuotHai {
  boTheoEm: Record<string, string[]>
  lapTheoEm: Record<string, string[]>
  cauGocTheoEm: Record<string, string[]>
  songSinhTheoEm: Record<string, string[]>
  soLapCua: Record<string, number>
  canCua: Record<string, number>
  daKhacPhucTheoEm: Record<string, string[]>
  thieuCau: { sbd: string; thieu: number }[]
  noiCam: { sbd: string; soNoi: number }[]
  canDayLai: { qid: string; dsSbd: string[] }[]
  /** Đỉnh trùng (theo TỪNG PHẦN, cùng thước đo với lượt một) giữa một em vắng và
   * bất kỳ em nào khác. Để chỗ gọi và test thấy lượt hai có đẩy trùng lên không. */
  dinhTrung: number
}

/** DỰNG ĐỀ RIÊNG CHO EM VẮNG, SAU KHI MỌI EM CÓ MẶT ĐÃ CHỐT.
 *
 * VÌ SAO KHÔNG GỘP VÀO LƯỢT MỘT (như bản 17/09 đã làm): chia vòng tròn coi mọi
 * em như nhau, nên 15 em vắng ăn mất 15 suất của kho mỏng — đỉnh trùng của 25 em
 * đang ngồi thi cao lên vì những em có thể không bao giờ tới. Mà bỏ hẳn em vắng
 * (bản 19/09 sáng) thì em vào muộn vài phút rơi về bốc theo hash: mất câu hỏi
 * lại, mất cá nhân hoá — chuyện thường ngày ở lớp thật.
 *
 * Nên: lượt một KHÔNG BIẾT tới em vắng. Lượt hai đi sau, nhận bộ đếm của lượt
 * một, và với từng em vắng lần lượt:
 *   · PHA A y như em có mặt (`chonCauLapChoEm`, có hồ sơ thì theo hồ sơ; bộ đếm
 *     song sinh nối tiếp từ lượt một);
 *   · PHA B THAM LAM: mỗi lần lấy câu làm ĐỈNH trùng của em này với mọi em khác
 *     thấp nhất; hoà thì câu ÍT EM DÙNG NHẤT; hoà nữa thì theo một hoán vị có hạt
 *     giống, xoay theo SBD. Không đổi chỗ với ai — đề em có mặt là bất khả xâm phạm.
 *
 * Tất định: không `Math.random`, không đọc đồng hồ. */
export function dungDeRiengLuotHai(h: YeuCauLuotHai): KetQuaLuotHai {
  const y = h.y
  const ch = y.ch ?? CAU_HINH_DE_RIENG_MAC_DINH
  const tongCau = tongCauCua(y.yc)
  const demSai = demLanSai(y.dsCa)
  const uvTra = h.uvThem ?? y.uv
  const cauCua = new Map<string, CauUngVien>()
  for (const p of PHAN_DE) for (const c of uvTra[p]) cauCua.set(c.id, c)
  const nguonMaDang = h.maDangCuaThem ?? y.maDangCua
  const maDangCua = h.hoSoVang && nguonMaDang ? new Map(Object.entries(nguonMaDang)) : undefined

  // Bộ đếm song sinh NỐI TIẾP lượt một: em vắng nhận câu song sinh ít em có mặt nhận nhất.
  const demSongSinh = new Map<string, number>()
  for (const ds of Object.values(h.luotMot.songSinhTheoEm)) for (const q of ds) demSongSinh.set(q, (demSongSinh.get(q) ?? 0) + 1)

  const ra: KetQuaLuotHai = { boTheoEm: {}, lapTheoEm: {}, cauGocTheoEm: {}, songSinhTheoEm: {}, soLapCua: {}, canCua: {}, daKhacPhucTheoEm: {}, thieuCau: [], noiCam: [], canDayLai: [], dinhTrung: 0 }
  const coMat = new Set(y.dsSbd)
  const dsVang = [...new Set(h.dsSbdVang)].filter((sbd) => sbd && !coMat.has(sbd))
  if (dsVang.length === 0) return ra

  // Kho phần câu mới của TỪNG PHẦN — đúng phép chọn của lượt một.
  const poolCua = {} as Record<PhanDe, string[]>
  for (const p of PHAN_DE) {
    const canP = Math.max(0, Math.floor(Number(y.yc.soCau[p]) || 0))
    const hop = locTheoYeuCau(y.uv[p], y.yc)
    poolCua[p] = (hop.length >= canP ? hop : y.uv[p]).map((c) => c.id)
  }

  // AI ĐANG GIỮ CÂU NÀO — bộ đếm tần suất của lượt một, tách theo phần. Chỉ số
  // người giữ: em có mặt trước, em vắng đã dựng xong nối theo sau.
  const nguoiGiu = {} as Record<PhanDe, Map<string, number[]>>
  for (const p of PHAN_DE) nguoiGiu[p] = new Map()
  const ghiGiu = (q: string, nguoi: number) => {
    const p = cauCua.get(q)?.phan
    if (!p) return
    const ds = nguoiGiu[p].get(q)
    if (ds) ds.push(nguoi)
    else nguoiGiu[p].set(q, [nguoi])
  }
  y.dsSbd.forEach((sbd, i) => {
    for (const q of h.luotMot.boTheoEm[sbd] ?? []) ghiGiu(q, i)
  })

  const dayLai = new Map<string, string[]>()
  dsVang.forEach((sbd, thuTu) => {
    const nguoi = y.dsSbd.length + thuTu
    const daLamSet = new Set<string>()
    for (const ca of y.dsCa) for (const q of ca.daLamCua[sbd] ?? []) daLamSet.add(q)
    const tuyChonLap: TuyChonHoSoLap | undefined = h.hoSoVang
      ? { hoSo: h.hoSoVang[sbd], ngayCa: y.ngayCa, maDangCua, seed: y.yc.seed, demSongSinh }
      : undefined
    const lap = chonCauLapChoEm(sbd, y.dsCa, tongCau, demSai, ch, cauCua, daLamSet, tuyChonLap)
    ra.canCua[sbd] = lap.can
    if (lap.daKhacPhuc && lap.daKhacPhuc.length > 0) ra.daKhacPhucTheoEm[sbd] = lap.daKhacPhuc
    for (const q of lap.canDayLai) dayLai.set(q, [...(dayLai.get(q) ?? []), sbd])

    const batBuoc: Partial<Record<PhanDe, string[]>> = {}
    for (const q of lap.qids) {
      const c = cauCua.get(q)
      if (c) (batBuoc[c.phan] ??= []).push(q)
    }

    const qids: string[] = []
    let thieu = 0
    let soNoi = 0
    for (const p of PHAN_DE) {
      const canP = Math.max(0, Math.floor(Number(y.yc.soCau[p]) || 0))
      if (canP <= 0) continue
      const ids = poolCua[p]
      const bo = new Set((batBuoc[p] ?? []).slice(0, canP))
      const trongPool = new Set(ids)
      const lam = (h.hoSoVang?.[sbd]?.lam ?? []).filter((q) => trongPool.has(q) && !bo.has(q))
      const noi = noiTapCam(ids, canP, 1, [bo], [lam])
      const cam = noi.cam[0]!
      soNoi += noi.soNoi[0]!
      const can = Math.min(canP, ids.length)

      // Số câu chung (trong PHẦN này) của em đang dựng với từng người khác.
      const chung = new Map<number, number>()
      let dinhEm = 0
      const cong = (q: string) => {
        for (const s of nguoiGiu[p].get(q) ?? []) {
          const v = (chung.get(s) ?? 0) + 1
          chung.set(s, v)
          if (v > dinhEm) dinhEm = v
        }
      }
      for (const q of bo) cong(q)

      // Thứ tự phân xử cuối: MỘT hoán vị có hạt giống cho cả lượt hai, xoay theo em.
      const N = ids.length
      const perm = seededPermutation(N, hashSeed(`${y.yc.seed}:${p}:luot-hai`))
      const xoay = N > 0 ? hashSeed(`${y.yc.seed}|${sbd}|${p}|luot-hai`) % N : 0
      const ungVien: string[] = []
      for (let b = 0; b < N; b++) {
        const q = ids[perm[(b + xoay) % N]!]!
        if (!bo.has(q) && !cam.has(q)) ungVien.push(q)
      }
      const daLay = new Set<number>()
      while (bo.size < can && daLay.size < ungVien.length) {
        let tot = -1
        let totDinh = Infinity
        let totDung = Infinity
        for (let i = 0; i < ungVien.length; i++) {
          if (daLay.has(i)) continue
          const giu = nguoiGiu[p].get(ungVien[i]!) ?? []
          let dinhSau = dinhEm
          for (const s of giu) {
            const v = (chung.get(s) ?? 0) + 1
            if (v > dinhSau) dinhSau = v
          }
          if (dinhSau < totDinh || (dinhSau === totDinh && giu.length < totDung)) {
            tot = i
            totDinh = dinhSau
            totDung = giu.length
            if (dinhSau === dinhEm && giu.length === 0) break // không thể tốt hơn: câu chưa ai dùng
          }
        }
        if (tot < 0) break
        daLay.add(tot)
        const q = ungVien[tot]!
        cong(q)
        bo.add(q)
      }
      if (dinhEm > ra.dinhTrung) ra.dinhTrung = dinhEm
      for (const q of bo) {
        qids.push(q)
        ghiGiu(q, nguoi)
      }
      thieu += Math.max(0, canP - bo.size)
    }

    ra.boTheoEm[sbd] = qids
    const trongDe = new Set(qids)
    ra.lapTheoEm[sbd] = lap.qids.filter((q) => trongDe.has(q))
    ra.cauGocTheoEm[sbd] = (lap.cauGoc ?? []).filter((q) => trongDe.has(q))
    ra.songSinhTheoEm[sbd] = (lap.songSinh ?? []).filter((q) => trongDe.has(q))
    ra.soLapCua[sbd] = ra.lapTheoEm[sbd]!.length
    if (thieu > 0) ra.thieuCau.push({ sbd, thieu })
    if (soNoi > 0) ra.noiCam.push({ sbd, soNoi })
  })
  ra.canDayLai = [...dayLai.entries()].map(([qid, dsSbd]) => ({ qid, dsSbd }))
  return ra
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
