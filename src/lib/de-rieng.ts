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
import { sinhBoMotO } from './de-rieng-tran-trung'
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

/** Vì sao một em không đủ câu lặp. Rỗng = đủ, không phải báo gì. */
export type LyDoThieuLap = '' | 'moi_vao' | 'dung_het' | 'khong_nop' | 'it_cau_sai' | 'ngoai_kho' | 'het_cho'

export const CHU_LY_DO_THIEU: Record<Exclude<LyDoThieuLap, ''>, string> = {
  moi_vao: 'mới vào lớp, chưa có ca nào',
  dung_het: 'ca trước làm đúng hết',
  khong_nop: 'không nộp ca nào trong khoảng quét',
  it_cau_sai: 'ca trước sai ít hơn số câu lặp cần',
  ngoai_kho: 'câu em từng sai không nằm trong kho ca này',
  het_cho: 'đề không đủ chỗ — phần đó đã kín câu hỏi lại',
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
  const canDayLai = daSai.filter((q) => (demCua[q] ?? 0) >= ch.TRAN_LAP_MOT_CAU)
  const conLap = daSai.filter((q) => (demCua[q] ?? 0) < ch.TRAN_LAP_MOT_CAU)
  const can = Math.min(soCauLapCan(daSai.length, ch), Math.max(0, Math.floor(Number(tranCau) || 0)))

  if (conLap.length === 0 || can === 0) {
    return {
      sbd,
      tuCa,
      qids: [],
      cauGoc: [],
      songSinh: [],
      canDayLai,
      soSaiCaTruoc: daSai.length,
      can,
      lyDo: conLap.length === 0 ? 'dung_het' : '',
    }
  }

  // SẮP XẾP ƯU TIÊN LỖ HỔNG (nếu bật UU_TIEN_LO_HONG)
  const conLapSapXep = ch.UU_TIEN_LO_HONG
    ? [...conLap].sort((a, b) => (demCua[b] ?? 0) - (demCua[a] ?? 0))
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
    for (const cand of cauCua.values()) {
      if (cand.dang && cand.dang !== 'chua_ro') {
        const keyDang = `${cand.phan}:${cand.dang}`
        const arr = ungVienTheoDang.get(keyDang) ?? []
        arr.push(cand)
        ungVienTheoDang.set(keyDang, arr)
      }
    }

    for (const q of dsChonGoc) {
      const infoQ = cauCua.get(q)
      const muonSongSinh = songSinh.length < soSongSinhCan

      if (muonSongSinh && infoQ && infoQ.dang && infoQ.dang !== 'chua_ro') {
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
      soSaiCaTruoc: daSai.length,
      can,
      lyDo: qids.length === 0 ? 'dung_het' : '',
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
    soSaiCaTruoc: daSai.length,
    can,
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

  // PHA A — câu khắc phục riêng từng em, KHÔNG đổi so với bản trước.
  for (let idxEm = 0; idxEm < m; idxEm++) {
    const sbd = y.dsSbd[idxEm]!
    const daLamSet = new Set<string>()
    for (const ca of y.dsCa) {
      for (const q of (ca.daLamCua[sbd] ?? [])) daLamSet.add(q)
    }
    const lap = chonCauLapChoEm(sbd, y.dsCa, tongCau, demSai, ch, cauCua, daLamSet)
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

    const boPhan = sinhBoMotO(idsPool, canP, m, hashSeed(`${y.yc.seed}:${p}`), CAU_HINH_TRAN_TRUNG_MAC_DINH, Date.now(), boSan, boSan)

    for (let e = 0; e < m; e++) {
      const bo = boPhan[e] ?? new Set<string>()
      for (const q of bo) qidsCuaEm[e]!.push(q)
      thieuTongCuaEm[e]! += Math.max(0, canP - bo.size)
    }
  }

  const boTheoEm: Record<string, string[]> = {}
  const lapTheoEm: Record<string, string[]> = {}
  const cauGocTheoEm: Record<string, string[]> = {}
  const songSinhTheoEm: Record<string, string[]> = {}
  const soLapCua: Record<string, number> = {}
  const thieuLap: EmThieuLap[] = []
  const thieuCau: { sbd: string; thieu: number }[] = []

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
