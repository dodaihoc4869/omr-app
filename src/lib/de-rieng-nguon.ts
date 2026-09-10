// ĐỀ RIÊNG TỪNG EM — phần ĐI LẤY DỮ LIỆU (DE-RIENG-TUNG-EM mục 4.1).
//
// Tách khỏi `de-rieng.ts` để lõi thuật toán test được không cần máy chủ.
//
// SỐ LỆNH MÁY CHỦ: đúng MỘT lệnh cho MỘT CA (`chiTietCa`), không phải một lệnh
// cho một em. Quét cả thư mục năm sinh, chặn trần `TRAN_CA_QUET` ⇒ vẫn gộp cho
// lớp 40 em, đúng ngưỡng ở bảng nghiệm thu.
import { namSinhDaSo, namSinhTuTenCa } from './nam-sinh-ca'
import { banDoSaiCa, chiTietCa, danhSachCa, danhSachEm, noiKhoCa } from './exam-api'
import { taoChiTietCau } from './chi-tiet-cau'
import { docDeRiengCa, loadExamSources, loadSessionTeacherBank, docSoCauCa, saveSessionTeacherBank } from './exam-db'
import { mergeAndStrip, mergeKeepAnswers, type SoCauMoiPhan, type TeacherExamSource } from '../data/examContent'
import { CAU_HINH_DE_RIENG_MAC_DINH, type CauHinhDeRieng } from './cau-hinh-de-rieng'
import { demLanSai, dungDeRieng, type CaTruocDaCham, type EmThieuLap } from './de-rieng'
import { dungUngVien } from './rut-de'
import { hashSeed } from './exam-shuffle'

export interface CaBoQua {
  maCa: string
  vi_sao: string
}

export interface NguonCaTruoc {
  /** Ca gần nhất đứng ĐẦU — đúng thứ tự `chonCauLapChoEm` chờ đợi. */
  dsCa: CaTruocDaCham[]
  /** Ca không đọc được, kèm lý do. Im lặng bỏ qua là thầy tưởng em đúng hết. */
  boQua: CaBoQua[]
  /** Năm sinh đã dùng để lọc thư mục. `null` = KHÔNG lọc được (phải báo lên màn). */
  namQuet: string | null
  /** Lấy năm sinh ở đâu ra — để biên bản nói đúng chuyện đang xảy ra. */
  nguonNam: 'hoc_sinh' | 'ten_ca' | 'khong_xac_dinh'
  /** Tổng số ca THI trong thư mục năm sinh đó (trước khi chặn trần quét). */
  soCaThuMuc: number
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
 *   · `gan_nhat` — giữ cả thư mục năm sinh. Không phải để GỘP mọi ca:
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
  // `gan_nhat` QUÉT CẢ THƯ MỤC NĂM SINH (thầy chốt 10/09). Danh sách vào đây đã
  // được `docCacCaTruoc` lọc còn đúng một năm sinh, nên chỉ cần chặn trần an
  // toàn. Việc tìm "ca gần nhất TỪNG EM có nộp" là của `chonCauLapChoEm`.
  // CẢ HAI PHẠM VI ĐỀU QUÉT CẢ THƯ MỤC (thầy chốt 10/09 và nhắc lại 10/09 tối:
  // "quét tất cả các mã trong thư mục ca thi chứa năm sinh đó").
  //
  // Bản trước, `ba_ca` BỐC NGẪU NHIÊN 3 ca trong toàn bộ danh sách RỒI mới xem
  // em có mặt trong đó không. Đó là trò may rủi: bốc trúng ba ca lớp khác thì
  // cả lớp ra "mới vào lớp, chưa có ca nào" — đúng thứ đã xảy ra ngày 10/09 với
  // bộ ca 817428 · 890691 · 335663.
  //
  // Nay quét cả thư mục ở đây, còn việc "chỉ lấy 3 ca" chuyển vào
  // `chonCauLapChoEm` — nơi ĐÃ BIẾT em nào nộp ca nào, nên bốc trong ĐÚNG những
  // ca chính em đó có nộp. Bốc sau khi biết dữ liệu, không bốc trước.
  void maCaNay
  return dsMoiNhatTruoc.slice(0, Math.max(0, ch.TRAN_CA_QUET))
}

/** Lấy các ca THI trước đó theo phạm vi thầy chọn, mới nhất trước. */
export async function docCacCaTruoc(
  url: string,
  mat: string,
  boCa: string[] = [],
  ch: CauHinhDeRieng = CAU_HINH_DE_RIENG_MAC_DINH,
  dsSbd: string[] = [],
): Promise<NguonCaTruoc> {
  const tatCa = await danhSachCa(url, mat)
  const bo = new Set(boCa.map((x) => x.trim()).filter(Boolean))
  const maNay = (boCa[0] ?? '').trim()

  // CHỈ QUÉT TRONG CÙNG THƯ MỤC NĂM SINH (thầy chốt 10/09).
  //
  // Bản trước xếp MỌI ca của MỌI khối chung một danh sách theo giờ mở rồi lấy
  // ba ca gần nhất. Ngày 10/09 ca khối 10 thi 14:37 và ca khối 12 thi 17:40 nằm
  // sát nhau, nên ca 2011 hoàn toàn có thể rút "câu em từng sai" từ một ca
  // 2009 — khác đề, khác chương, và sai IM LẶNG vì đề vẫn dựng ra bình thường.
  //
  // NGUỒN NĂM SINH — HAI TẦNG, hồ sơ học sinh trước, tên ca sau.
  //
  // Ngày 10/09 thầy đổi tên ca nên tên không còn bắt đầu bằng năm sinh. Bản
  // trước gặp thế thì `namNay = null` rồi ÂM THẦM bỏ lọc, quét sang mọi khối —
  // bộ ca 817428 · 890691 (2011) · 335663 (2009) lọt chung một lượt là dấu vết
  // của đúng chỗ này. Cả lớp ra "mới vào lớp, chưa có ca nào", tức máy đổ lỗi
  // cho học sinh thay vì khai rằng nó không lọc được.
  //
  // Nay lấy năm sinh từ CHÍNH CÁC EM trong ca. Thầy đổi tên ca là chuyện bình
  // thường; năm sinh trong hồ sơ thì không đổi. Tên ca chỉ còn là đường lùi.
  const caNay = tatCa.find((c) => c.maCa === maNay)
  let namNay: string | null = null
  let nguonNam: NguonCaTruoc['nguonNam'] = 'khong_xac_dinh'
  if (dsSbd.length > 0) {
    try {
      const dsEm = await danhSachEm(url, mat)
      const can = new Set(dsSbd.map((x) => String(x || '').trim()).filter(Boolean))
      namNay = namSinhDaSo(dsEm.filter((e) => can.has(e.sbd)).map((e) => e.namSinh))
      if (namNay !== null) nguonNam = 'hoc_sinh'
    } catch {
      namNay = null
    }
  }
  if (namNay === null) {
    namNay = namSinhTuTenCa(caNay?.tenCa)
    if (namNay !== null) nguonNam = 'ten_ca'
  }

  const dsThi = tatCa.filter((c) => c.loai !== 'baitap' && c.trangThai !== 'da_xoa' && !bo.has(c.maCa))
  const dsGoc = dsThi
    .filter((c) => namNay === null || namSinhTuTenCa(c.tenCa) === namNay)
    .sort((a, b) => String(b.moLuc ?? '').localeCompare(String(a.moLuc ?? '')))
  const ung = chonCaTheoPhamVi(dsGoc, maNay, ch)

  // BẢN ĐỒ SAI DỰNG SẴN Ở MÁY CHỦ — hỏi trước, MỘT lệnh cho cả mấy ca (thầy
  // chốt 08/09: "ca thi nào cũng phải dựng sẵn bản đồ sai từng câu").
  //
  // Đây là đường nhanh và chắc: không cần bản đề của ca cũ nằm trên máy này,
  // nên máy nào cũng dựng đề được. Ca chưa có bản đồ (chấm trước khi có tính
  // năng này) thì rơi về cách cũ — chấm lại tại máy thầy.
  //
  // CHIA LÔ 20 CA MỘT LƯỢT: máy chủ chặn cứng ở `dsMa.length > 20` ("Xin quá
  // nhiều ca một lượt"). Quét cả thư mục thì vượt 20 là bình thường, và trước
  // đây cả lượt gọi hỏng ⇒ `banDo = {}` ⇒ rơi hết về đường chấm lại tại máy
  // thầy ⇒ máy nào không có bản đề ca cũ là không rút được câu nào.
  const LO = 20
  const banDo: Record<string, { sai: Record<string, string[]>; lam: Record<string, string[]> }> = {}
  for (let i = 0; i < ung.length; i += LO) {
    const lo = ung.slice(i, i + LO).map((c) => c.maCa)
    try {
      Object.assign(banDo, await banDoSaiCa(url, mat, lo))
    } catch {
      // Lô này hỏng thì chỉ mất lô này — các lô khác vẫn dùng được.
    }
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
  return { dsCa, boQua, namQuet: namNay, nguonNam, soCaThuMuc: dsGoc.length }
}

/** LẤY BẢN ĐỀ CÓ ĐÁP ÁN CỦA MỘT CA CŨ — máy thầy trước, máy chủ sau.
 *
 * Tách riêng vì `docCaTruoc` chỉ trả DANH SÁCH qid rồi vứt bản đề đi, trong khi
 * `dungDeRiengChoCa` lại cần chính NỘI DUNG mấy câu đó. */
async function bankCuaCa(url: string, mat: string, maCa: string): Promise<TeacherExamSource[] | null> {
  const cu = await loadSessionTeacherBank(maCa).catch(() => null)
  if (cu && cu.length > 0) return cu
  try {
    const ct = await chiTietCa(url, mat, maCa, true)
    const kb = ct.keyBank
    if (!kb || (kb.phanI.length === 0 && kb.phanII.length === 0 && kb.phanIII.length === 0)) return null
    const bank: TeacherExamSource[] = [{ maDe: maCa, phanI: kb.phanI, phanII: kb.phanII, phanIII: kb.phanIII }]
    await saveSessionTeacherBank(maCa, bank).catch(() => {})
    return bank
  } catch {
    return null
  }
}

/** GOM NỘI DUNG NHỮNG CÂU EM TỪNG SAI, LẤY TỪ CHÍNH CA CŨ.
 *
 * VÌ SAO PHẢI CÓ. Id câu được ghép từ `maDe` ("để ghép id câu hỏi cho không
 * trùng giữa các đề"). Nạp lại kho là `maDe` đổi ⇒ **id đổi theo**, dù đề bài
 * y nguyên. Ca cũ ghi lại id cũ, nên tra trong kho HIỆN TẠI là không thấy —
 * đúng dòng "câu em từng sai không nằm trong kho ca này" thầy đang gặp, dù câu
 * đó vẫn nằm sờ sờ trong kho dưới một cái id khác.
 *
 * Chữa tận gốc: KHÔNG đi tìm trong kho hiện tại nữa. Câu em làm sai đã được
 * cất nguyên văn trong bản đề CÓ ĐÁP ÁN của chính ca cũ — lấy thẳng ở đó.
 * Không phụ thuộc nhãn, không phụ thuộc kho còn hay mất đề ấy. */
export async function gomCauTuCaCu(
  url: string,
  mat: string,
  canTheoCa: Map<string, Set<string>>,
): Promise<{ phanI: TeacherExamSource['phanI']; phanII: TeacherExamSource['phanII']; phanIII: TeacherExamSource['phanIII']; thieu: string[] }> {
  const ra = { phanI: [] as TeacherExamSource['phanI'], phanII: [] as TeacherExamSource['phanII'], phanIII: [] as TeacherExamSource['phanIII'], thieu: [] as string[] }
  const daCo = new Set<string>()
  for (const [maCa, qids] of canTheoCa) {
    if (qids.size === 0) continue
    const bank = await bankCuaCa(url, mat, maCa)
    if (!bank) {
      for (const q of qids) if (!daCo.has(q)) ra.thieu.push(q)
      continue
    }
    const conThieu = new Set(qids)
    for (const s of bank) {
      for (const q of s.phanI) if (conThieu.has(q.id) && !daCo.has(q.id)) { ra.phanI.push(q); daCo.add(q.id); conThieu.delete(q.id) }
      for (const q of s.phanII) if (conThieu.has(q.id) && !daCo.has(q.id)) { ra.phanII.push(q); daCo.add(q.id); conThieu.delete(q.id) }
      for (const q of s.phanIII) if (conThieu.has(q.id) && !daCo.has(q.id)) { ra.phanIII.push(q); daCo.add(q.id); conThieu.delete(q.id) }
    }
    for (const q of conThieu) if (!daCo.has(q)) ra.thieu.push(q)
  }
  return ra
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
  /** Năm sinh dùng để lọc thư mục ca. `null` = không lọc được, phải báo lên màn. */
  namQuet: string | null
  nguonNam: NguonCaTruoc['nguonNam']
  /** Tổng số ca THI trong thư mục năm sinh đó. */
  soCaThuMuc: number
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

  const { dsCa, boQua, namQuet, nguonNam, soCaThuMuc } = await docCacCaTruoc(url, mat, [maCa], ch, dsSbd)

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
  // Nhớ luôn câu ấy đến TỪ CA NÀO — để còn lấy nguyên văn nó ở bản đề của
  // chính ca đó khi kho hiện tại không còn id ấy nữa (xem `gomCauTuCaCu`).
  const canQid = new Set<string>()
  const canTheoCa = new Map<string, Set<string>>()
  for (const ca of dsCa) {
    for (const sbd of dsSbd) {
      for (const q of ca.saiCua[sbd] ?? []) {
        canQid.add(q)
        const bo = canTheoCa.get(ca.maCa) ?? new Set<string>()
        bo.add(q)
        canTheoCa.set(ca.maCa, bo)
      }
    }
  }
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
    // ĐƯỜNG THỨ HAI, và là đường ĐÁNG TIN HƠN: câu nào kho hiện tại không có
    // thì lấy NGUYÊN VĂN từ bản đề của ca cũ. Nạp lại kho làm đổi `maDe` ⇒ đổi
    // id câu, nên tra theo id trong kho mới là hụt, dù đề bài y hệt.
    const daLay = new Set([...them.phanI, ...them.phanII, ...them.phanIII].map((q) => q.id))
    const conThieu = new Map<string, Set<string>>()
    for (const [ma, bo] of canTheoCa) {
      const b = new Set([...bo].filter((q) => can.has(q) && !daLay.has(q)))
      if (b.size > 0) conThieu.set(ma, b)
    }
    if (conThieu.size > 0) {
      const buCa = await gomCauTuCaCu(url, mat, conThieu)
      them.phanI = [...them.phanI, ...buCa.phanI]
      them.phanII = [...them.phanII, ...buCa.phanII]
      them.phanIII = [...them.phanIII, ...buCa.phanIII]
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
    namQuet,
    nguonNam,
    soCaThuMuc,
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
