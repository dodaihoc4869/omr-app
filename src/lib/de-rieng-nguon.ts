// ĐỀ RIÊNG TỪNG EM — phần ĐI LẤY DỮ LIỆU (DE-RIENG-TUNG-EM mục 4.1).
//
// Tách khỏi `de-rieng.ts` để lõi thuật toán test được không cần máy chủ.
//
// SỐ LỆNH MÁY CHỦ: đúng MỘT lệnh cho MỘT CA (`chiTietCa`), không phải một lệnh
// cho một em. Quét ngược tối đa `SO_CA_TRA_NGUOC` ca ⇒ tối đa 3 lệnh cho cả
// lớp 40 em, đúng ngưỡng ở bảng nghiệm thu.
import { banDoSaiCa, chiTietCa, danhSachCa, noiKhoCa } from './exam-api'
import { taoChiTietCau } from './chi-tiet-cau'
import { docDeRiengCa, loadExamSources, loadSessionTeacherBank, docSoCauCa, saveSessionTeacherBank } from './exam-db'
import { mergeAndStrip, mergeKeepAnswers, type SoCauMoiPhan, type TeacherExamSource } from '../data/examContent'
import { CAU_HINH_DE_RIENG_MAC_DINH, SO_CA_BOC_NGAU_NHIEN, type CauHinhDeRieng } from './cau-hinh-de-rieng'
import { demLanSai, dungDeRieng, type CaTruocDaCham, type EmThieuLap } from './de-rieng'
import { dungUngVien } from './rut-de'
import { hashSeed, seededPermutation } from './exam-shuffle'

export interface CaBoQua {
  maCa: string
  vi_sao: string
}

export interface NguonCaTruoc {
  /** Ca gần nhất đứng ĐẦU — đúng thứ tự `chonCauLapChoEm` chờ đợi. */
  dsCa: CaTruocDaCham[]
  /** Ca không đọc được, kèm lý do. Im lặng bỏ qua là thầy tưởng em đúng hết. */
  boQua: CaBoQua[]
}

/** Đọc câu sai của từng em ở một ca đã chấm.
 *
 * Dựng lại chi tiết từng câu tại chỗ từ đáp án thô + bản đề CÓ đáp án, giống
 * hệt `gomCa` — không đòi thầy phải bấm chấm ở màn Theo dõi trước. */
export async function docCaTruoc(url: string, mat: string, maCa: string, ch: CauHinhDeRieng = CAU_HINH_DE_RIENG_MAC_DINH): Promise<CaTruocDaCham> {
  const ma = maCa.trim()
  const banksCu = await loadSessionTeacherBank(ma)
  const ct = await chiTietCa(url, mat, ma, !banksCu)

  let bank: TeacherExamSource[] | null = banksCu ?? null
  if (!bank && ct.keyBank && (ct.keyBank.phanI.length || ct.keyBank.phanII.length || ct.keyBank.phanIII.length)) {
    bank = [{ maDe: ct.ca.maCa, phanI: ct.keyBank.phanI, phanII: ct.keyBank.phanII, phanIII: ct.keyBank.phanIII }]
    await saveSessionTeacherBank(ma, bank)
  }
  if (!bank || bank.length === 0) throw new Error('Máy này chưa có bản đề CÓ đáp án của ca')

  const scLocal = await docSoCauCa(ma)
  const scServer = (ct.keyBank as { soCau?: SoCauMoiPhan } | undefined)?.soCau
  const sc = scLocal ?? (scServer && scServer.I + scServer.II + scServer.III > 0 ? scServer : undefined)
  // `boTheoEm` PHẢI đi cùng: ca trước cũng có thể là ca đề riêng, và dựng lại
  // chi tiết từng câu bằng luật hash trong khi em nhận bộ câu theo bản đồ là
  // ra một bảng câu sai của người khác. Ưu tiên bản cất ở máy thầy, rồi mới
  // tới bản máy chủ trả về.
  const rieng = await docDeRiengCa(ma).catch(() => undefined)
  const boTheoEm = rieng?.boTheoEm ?? (ct.keyBank as { boTheoEm?: Record<string, string[]> } | undefined)?.boTheoEm
  const keyBank = mergeKeepAnswers(bank, sc, boTheoEm)

  const daLamCua: Record<string, string[]> = {}
  const saiCua: Record<string, string[]> = {}
  // Một em có thể thi nhiều lần: lấy LƯỢT MỚI NHẤT, đúng lượt tính điểm.
  const moiNhat = new Map<string, (typeof ct.luot)[number]>()
  for (const l of ct.luot) {
    const cu = moiNhat.get(l.sbd)
    if (!cu || l.lanThu > cu.lanThu) moiNhat.set(l.sbd, l)
  }
  moiNhat.forEach((l, sbd) => {
    if (!l.dapAn || (l.trangThai !== 'da_nop' && l.trangThai !== 'khoa')) return
    let rows
    try {
      rows = taoChiTietCau(keyBank, ct.ca.maCa, sbd, l.dapAn, l.giayCau)
    } catch {
      return
    }
    if (rows.length === 0) return
    daLamCua[sbd] = rows.map((r) => r.qid).filter(Boolean)
    saiCua[sbd] = rows
      .filter((r) => {
        if (r.dungSai !== false) return false
        // BỎ TRỐNG KHÔNG TỰ TÍNH LÀ SAI (mặc định): hết giờ nên chưa kịp làm
        // thì lặp lại là lặp nhầm chỗ.
        const coLam = String(r.dapAnChon ?? '').replace(/-/g, '').trim().length > 0
        return coLam || ch.CHO_LAP_CAU_BO_TRONG
      })
      .map((r) => r.qid)
      .filter(Boolean)
  })
  return { maCa: ct.ca.maCa, daLamCua, saiCua }
}

/** CHỌN NHỮNG CA SẼ ĐỌC, theo đúng phạm vi thầy chốt lúc mở ca.
 *
 *   · `gan_nhat` — giữ `SO_CA_TRA_NGUOC` ca gần nhất. Không phải để GỘP ba ca:
 *     `chonCauLapChoEm` chỉ lấy MỘT ca — ca gần nhất em CÓ NỘP. Quét lùi là để
 *     em nghỉ buổi trước vẫn có câu hỏi lại, không lấy bừa ca lớp vừa thi.
 *   · `ba_ca`    — BỐC NGẪU NHIÊN 3 ca bất kỳ trong toàn bộ ca đã thi trước
 *     đó (thầy chốt 08/09: "rút ngẫu nhiên 3 ca trước đó bất kì không cần gần
 *     nhất"). Bốc theo HẠT GIỐNG từ mã ca chứ không `Math.random`: cùng một ca
 *     thì lần nào cũng ra đúng ba ca ấy, nên biên bản đối chiếu lại được và mở
 *     lại ca không đổi đề dưới chân em.
 *
 * Chỉ lấy ca `loai === 'thi'`: bài tập về nhà không phải bài kiểm tra có thầy
 * coi, lấy câu sai ở đó ra hỏi lại là hỏi lại câu em tra mạng. */
export function chonCaTheoPhamVi<T extends { maCa: string }>(dsMoiNhatTruoc: T[], maCaNay: string, ch: CauHinhDeRieng = CAU_HINH_DE_RIENG_MAC_DINH): T[] {
  if (ch.PHAM_VI_HOI_LAI !== 'ba_ca') return dsMoiNhatTruoc.slice(0, Math.max(0, ch.SO_CA_TRA_NGUOC))
  const can = Math.min(SO_CA_BOC_NGAU_NHIEN, dsMoiNhatTruoc.length)
  if (can <= 0) return []
  if (dsMoiNhatTruoc.length <= can) return dsMoiNhatTruoc.slice()
  const hoanVi = seededPermutation(dsMoiNhatTruoc.length, hashSeed(`hoi-lai:${maCaNay}`))
  const boc = hoanVi.slice(0, can).map((i) => dsMoiNhatTruoc[i])
  // Trả về theo thứ tự mới-trước như phần còn lại của luồng vẫn chờ đợi: chỉ
  // BỘ ca là ngẫu nhiên, thứ tự trong bộ thì không.
  const thuTu = new Map(dsMoiNhatTruoc.map((c, i) => [c.maCa, i]))
  return boc.sort((a, b) => (thuTu.get(a.maCa) ?? 0) - (thuTu.get(b.maCa) ?? 0))
}

/** Lấy các ca THI trước đó theo phạm vi thầy chọn, mới nhất trước. */
export async function docCacCaTruoc(url: string, mat: string, boCa: string[] = [], ch: CauHinhDeRieng = CAU_HINH_DE_RIENG_MAC_DINH): Promise<NguonCaTruoc> {
  const tatCa = await danhSachCa(url, mat)
  const bo = new Set(boCa.map((x) => x.trim()).filter(Boolean))
  const dsGoc = tatCa
    .filter((c) => c.loai !== 'baitap' && c.trangThai !== 'da_xoa' && !bo.has(c.maCa))
    .sort((a, b) => String(b.moLuc ?? '').localeCompare(String(a.moLuc ?? '')))
  const ung = chonCaTheoPhamVi(dsGoc, boCa[0] ?? '', ch)

  // BẢN ĐỒ SAI DỰNG SẴN Ở MÁY CHỦ — hỏi trước, MỘT lệnh cho cả mấy ca (thầy
  // chốt 08/09: "ca thi nào cũng phải dựng sẵn bản đồ sai từng câu").
  //
  // Đây là đường nhanh và chắc: không cần bản đề của ca cũ nằm trên máy này,
  // nên máy nào cũng dựng đề được. Ca chưa có bản đồ (chấm trước khi có tính
  // năng này) thì rơi về cách cũ — chấm lại tại máy thầy.
  let banDo: Record<string, { sai: Record<string, string[]>; lam: Record<string, string[]> }> = {}
  try {
    banDo = await banDoSaiCa(url, mat, ung.map((c) => c.maCa))
  } catch {
    banDo = {}
  }

  const dsCa: CaTruocDaCham[] = []
  const boQua: CaBoQua[] = []
  for (const c of ung) {
    const bd = banDo[c.maCa]
    if (bd && Object.keys(bd.lam).length > 0) {
      dsCa.push({ maCa: c.maCa, daLamCua: bd.lam, saiCua: bd.sai })
      continue
    }
    try {
      dsCa.push(await docCaTruoc(url, mat, c.maCa, ch))
    } catch (e) {
      boQua.push({ maCa: c.maCa, vi_sao: e instanceof Error ? e.message : 'không đọc được ca này' })
    }
  }
  return { dsCa, boQua }
}

/** DỰNG ĐỀ RIÊNG CHO ĐÚNG NHỮNG EM ĐANG CHỜ, gọi lúc thầy bấm BẮT ĐẦU.
 *
 * Kho lấy từ bản đề CÓ đáp án của chính ca này (đã cất lúc mở ca), số câu mỗi
 * phần lấy từ `soCauCa`. Ca trước quét ngay tại đây — ba lệnh máy chủ, không
 * phải một lệnh một em.
 *
 * Ca hiện tại LOẠI khỏi danh sách quét: nó chính là ca đang mở, chưa ai nộp. */
export interface KetQuaDungDeRieng {
  /** Câu KÉO TỪ CẢ KHO vào ca này để lặp lại được. Rỗng = kho ca đã đủ. */
  cauNoiThem: { soCau: number; qids: string[] }
  boTheoEm: Record<string, string[]>
  /** sbd → qid câu lặp có thật trong đề em đó. Đi kèm `boTheoEm` lên máy chủ. */
  lapTheoEm: Record<string, string[]>
  lapCua: Record<string, Record<string, number>>
  thieu: EmThieuLap[]
  canCua: Record<string, number>
  soLapCua: Record<string, number>
  saiCaTruocCua: Record<string, number>
  /** sbd → mã ca THẬT SỰ lấy câu sai của em đó. */
  tuCaCua: Record<string, string>
  /** Ca cũ KHÔNG đọc được, kèm lý do. Đây thường là câu trả lời cho "vì sao
   * không rút được câu hỏi lại nào" — im lặng bỏ qua là thầy tưởng máy hỏng. */
  boQua: CaBoQua[]
  /** Mã những ca đã quét được, mới nhất trước. */
  caDaQuet: string[]
  trungBinh: number
}

export async function dungDeRiengChoCa(
  url: string,
  mat: string,
  maCa: string,
  dsSbd: string[],
  ch: CauHinhDeRieng = CAU_HINH_DE_RIENG_MAC_DINH,
): Promise<KetQuaDungDeRieng> {
  const bank = await loadSessionTeacherBank(maCa)
  if (!bank || bank.length === 0) throw new Error('Máy này chưa có bản đề CÓ đáp án của ca')
  const sc = await docSoCauCa(maCa)
  if (!sc) throw new Error('Ca này chưa ghi số câu mỗi phần')

  const { dsCa, boQua } = await docCacCaTruoc(url, mat, [maCa], ch)

  // KÉO CÂU EM TỪNG SAI TỪ CẢ KHO VÀO CA NÀY (thầy chốt 08/09: "bất kể là tôi
  // chọn chuyên đề gì thi mà ca trước sai 9 câu phải rút đúng 3 câu đó ra vào
  // đề mới").
  //
  // Trước đây câu lặp bị bó trong kho thầy vừa rút cho ca. Thầy chọn chuyên đề
  // khác buổi trước là gần như không câu nào lặp được — đúng thứ biên bản báo
  // "câu em từng sai không nằm trong kho ca này". Nay:
  //   1. tìm câu đó trong CẢ KHO trên máy thầy;
  //   2. NỐI nó vào kho của ca (cả bản gửi máy em lẫn bản có đáp án);
  //   3. rồi mới rút.
  //
  // Chỉ nối THÊM, không thay câu nào, nên phần đề mới vẫn đúng chuyên đề thầy
  // chọn — câu lặp là câu thứ 3 trong 12, không phải cả đề đổi chuyên đề.
  const canQid = new Set<string>()
  for (const ca of dsCa) for (const sbd of dsSbd) for (const q of ca.saiCua[sbd] ?? []) canQid.add(q)
  const coSan = new Set<string>()
  for (const s of bank) for (const q of [...s.phanI, ...s.phanII, ...s.phanIII]) coSan.add(q.id)
  const thieuQid = [...canQid].filter((q) => !coSan.has(q))

  let bankDung = bank
  const cauNoiThem: { soCau: number; qids: string[] } = { soCau: 0, qids: [] }
  if (thieuQid.length > 0) {
    const kho = await loadExamSources().catch(() => [] as TeacherExamSource[])
    const can = new Set(thieuQid)
    const them: TeacherExamSource = {
      maDe: `${maCa}-hoi-lai`,
      phanI: kho.flatMap((s) => s.phanI.filter((q) => can.has(q.id))),
      phanII: kho.flatMap((s) => s.phanII.filter((q) => can.has(q.id))),
      phanIII: kho.flatMap((s) => s.phanIII.filter((q) => can.has(q.id))),
    }
    const soThem = them.phanI.length + them.phanII.length + them.phanIII.length
    if (soThem > 0) {
      // Máy chủ trước, máy thầy sau. Ghi vào máy thầy mà máy chủ hỏng là em
      // nhận đề thiếu đúng những câu thầy vừa thêm.
      // Gói CÓ đáp án dựng thẳng từ `them`, KHÔNG qua `mergeKeepAnswers`: hàm
      // đó là để dựng bảng chấm (phải đi kèm `soCau` và `boTheoEm`), còn đây
      // chỉ là mấy câu đem nối vào kho.
      await noiKhoCa(url, mat, maCa, mergeAndStrip([them]), { phanI: them.phanI, phanII: them.phanII, phanIII: them.phanIII })
      bankDung = [...bank, them]
      await saveSessionTeacherBank(maCa, bankDung)
      cauNoiThem.soCau = soThem
      cauNoiThem.qids = [...them.phanI, ...them.phanII, ...them.phanIII].map((q) => q.id)
    }
  }

  const uv = dungUngVien(bankDung)
  const ra = dungDeRieng({
    uv,
    yc: { soCau: sc, chuyenDe: [], mucDo: [], tranhQid: [], seed: hashSeed(maCa) },
    dsSbd,
    dsCa,
    ch,
  })
  return {
    cauNoiThem,
    boTheoEm: ra.boTheoEm,
    lapTheoEm: ra.lapTheoEm,
    lapCua: lapCuaTungEm(ra.boTheoEm, demLanSai(dsCa)),
    thieu: ra.thieuLap,
    canCua: ra.canCua,
    soLapCua: ra.soLapCua,
    saiCaTruocCua: ra.saiCaTruocCua,
    tuCaCua: ra.tuCaCua,
    boQua,
    caDaQuet: dsCa.map((c) => c.maCa),
    trungBinh: ra.soLapTrungBinh,
  }
}

/** SỐ LẦN EM ĐÃ SAI TỪNG CÂU LẶP, tính TRƯỚC ca sắp mở.
 *
 * Cất cùng ca để lúc dựng báo cáo không phải đọc lại ba ca cũ — và quan trọng
 * hơn: con số trong báo cáo đúng bằng con số máy đã dùng để ra đề, không phải
 * một phép đếm thứ hai có thể lệch. */
export function lapCuaTungEm(boTheoEm: Record<string, string[]>, demSai: Record<string, Record<string, number>>): Record<string, Record<string, number>> {
  const ra: Record<string, Record<string, number>> = {}
  for (const [sbd, qids] of Object.entries(boTheoEm)) {
    const cua = demSai[sbd] ?? {}
    const mot: Record<string, number> = {}
    for (const q of qids) if (typeof cua[q] === 'number' && cua[q] > 0) mot[q] = cua[q]
    if (Object.keys(mot).length > 0) ra[sbd] = mot
  }
  return ra
}

/** DỰNG LẠI KHỐI "CÒN SAI LẠI" TỪ MÁY CHỦ, cho máy nào cũng xem được.
 *
 * Thầy chốt 08/09: "đồng bộ phần màu đỏ đấy vào tất cả các thiết bị".
 *
 * Bản đồ câu lặp và số lần sai được ghi lên máy chủ lúc bấm Bắt đầu — nhưng chỉ
 * từ bản app 08/09 trở đi, và chỉ khi chính máy bấm Bắt đầu chạy bản đó. Ca mở
 * trước đó, hoặc bấm bằng máy chưa cập nhật, thì ô đó rỗng và mọi máy khác nhìn
 * vào đều thấy trống.
 *
 * Hàm này dựng lại hai bản đồ ấy TẠI CHỖ, từ hai thứ máy chủ luôn có:
 *   · `boTheoEm` — bộ câu của từng em trong ca này;
 *   · `BanDoSai` — câu sai của từng em ở các ca trước (ghi lúc chấm).
 *
 * Không cần kho đề, không cần IndexedDB của máy nào, nên máy vừa mở app lần đầu
 * cũng xem được. */
export async function dungLapTuMayChu(
  url: string,
  mat: string,
  maCa: string,
  boTheoEm: Record<string, string[]>,
  ch: CauHinhDeRieng = CAU_HINH_DE_RIENG_MAC_DINH,
): Promise<{ lapTheoEm: Record<string, string[]>; demSai: Record<string, Record<string, number>> }> {
  const dsSbd = Object.keys(boTheoEm)
  if (dsSbd.length === 0) return { lapTheoEm: {}, demSai: {} }

  const { dsCa } = await docCacCaTruoc(url, mat, [maCa], ch)
  if (dsCa.length === 0) return { lapTheoEm: {}, demSai: {} }

  const demSai = demLanSai(dsCa)
  const lapTheoEm: Record<string, string[]> = {}
  for (const sbd of dsSbd) {
    const cua = demSai[sbd]
    if (!cua) continue
    // Câu lặp = câu trong đề em lần này MÀ em đã sai ở ca trước. Đúng định
    // nghĩa máy đã dùng lúc ra đề, nên hai đường cho cùng một danh sách.
    const lap = (boTheoEm[sbd] ?? []).filter((q) => (cua[q] ?? 0) > 0)
    if (lap.length > 0) lapTheoEm[sbd] = lap
  }
  return { lapTheoEm, demSai }
}
