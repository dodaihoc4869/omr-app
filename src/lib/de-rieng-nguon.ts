// ĐỀ RIÊNG TỪNG EM — phần ĐI LẤY DỮ LIỆU (DE-RIENG-TUNG-EM mục 4.1).
//
// Tách khỏi `de-rieng.ts` để lõi thuật toán test được không cần máy chủ.
//
// SỐ LỆNH MÁY CHỦ: đúng MỘT lệnh cho MỘT CA (`chiTietCa`), không phải một lệnh
// cho một em. Quét cả thư mục năm sinh, chặn trần `TRAN_CA_QUET` ⇒ vẫn gộp cho
// lớp 40 em, đúng ngưỡng ở bảng nghiệm thu.
import { namSinhDaSo, namSinhTuTenCa } from './nam-sinh-ca'
import { banDoSaiCa, chiTietCa, danhSachCa, danhSachEm, hoSoOnCa, noiKhoCa } from './exam-api'
import { taoChiTietCau } from './chi-tiet-cau'
import { docDeRiengCa, loadExamSources, loadSessionTeacherBank, docSoCauCa, saveSessionTeacherBank } from './exam-db'
import { mergeAndStrip, mergeKeepAnswers, type SoCauMoiPhan, type TeacherExamSource } from '../data/examContent'
import { CAU_HINH_DE_RIENG_MAC_DINH, SO_CA_BOC_NGAU_NHIEN, type CauHinhDeRieng } from './cau-hinh-de-rieng'
import { demLanSai, docHoSoOnEm, dungDeRieng, dungDeRiengLuotHai, type CaTruocDaCham, type EmThieuLap, type HoSoOnEm, type YeuCauDeRieng } from './de-rieng'
import { dungUngVien } from './rut-de'
import { chuanChuyenDe } from './goi-len-bang'
import { hashSeed } from './exam-shuffle'
import { laCauRutDuoc } from './cau-tu-luan'
import { cauHopKhoi, khoiCuaEm, type Khoi } from './khoi-cau'

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

  // ĐƯỜNG LUI CHỈ CHẠY KHI CÒN THIẾU — chỗ quyết định tốc độ của cả màn.
  //
  // Bản đồ sai lấy theo LÔ nên quét cả thư mục 60 ca cũng chỉ tốn 3 lệnh; rẻ,
  // cứ lấy hết để `demLanSai` (trần lặp một câu) đếm đủ.
  //
  // `docCaTruoc` thì KHÁC HẲN: mỗi ca một lệnh `chiTietCa`. Quét cả thư mục mà
  // ca nào cũng rơi vào đường lui là 60 lệnh — chậm gấp 20 lần bản cũ chỉ quét
  // 3 ca. Mà phần lớn số đó vô ích: `chonCauLapChoEm` chỉ cần ca gần nhất mỗi
  // em CÓ NỘP (`ba_ca` thì 3 ca). Em nào đủ rồi thì mọi ca cũ hơn không đổi
  // được kết quả của em ấy.
  //
  // Nên: đi từ ca mới nhất, đếm số ca đã phủ cho từng em; khi MỌI em trong
  // `dsSbd` đã đủ thì thôi gọi đường lui. Ca chưa đọc vẫn nằm trong bản đồ rẻ
  // ở trên, không mất dữ liệu đếm.
  const canMoiEm = ch.PHAM_VI_HOI_LAI === 'ba_ca' ? SO_CA_BOC_NGAU_NHIEN : 1
  const daPhu = new Map<string, number>()
  const conThieuEm = () => dsSbd.length === 0 || dsSbd.some((sbd) => (daPhu.get(sbd) ?? 0) < canMoiEm)
  const ghiPhu = (ca: CaTruocDaCham) => {
    for (const sbd of dsSbd) if ((ca.daLamCua[sbd] ?? []).length > 0) daPhu.set(sbd, (daPhu.get(sbd) ?? 0) + 1)
  }

  const dsCa: CaTruocDaCham[] = []
  const boQua: CaBoQua[] = []
  let boQuaVeSau = 0
  for (const c of ung) {
    const bd = banDo[c.maCa]
    if (bd && Object.keys(bd.lam).length > 0) {
      const ca = { maCa: c.maCa, daLamCua: bd.lam, saiCua: bd.sai }
      dsCa.push(ca)
      ghiPhu(ca)
      continue
    }
    if (!conThieuEm()) {
      boQuaVeSau += 1
      continue
    }
    try {
      const ca = await docCaTruoc(url, mat, c.maCa, ch)
      dsCa.push(ca)
      ghiPhu(ca)
    } catch (e) {
      boQua.push({ maCa: c.maCa, vi_sao: e instanceof Error ? e.message : 'không đọc được ca này' })
    }
  }
  // Khai ra, không im lặng: thầy phải biết vì sao vài ca cũ không nằm trong
  // danh sách đã dò — đó là chủ ý tiết kiệm lệnh, không phải ca hỏng.
  if (boQuaVeSau > 0) boQua.push({ maCa: `+${boQuaVeSau} ca cũ hơn`, vi_sao: 'mọi em đã đủ ca gần nhất — bỏ qua cho nhanh, không phải lỗi' })
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

/** Ngày VN (+07:00) 'YYYY-MM-DD' của một mốc giờ. Tầng ĐI LẤY DỮ LIỆU mới được
 * đọc đồng hồ; lõi `de-rieng.ts` chỉ nhận ngày truyền vào. */
export function ngayVnCua(ms: number): string {
  return new Date(ms + 7 * 3600_000).toISOString().slice(0, 10)
}

export interface KetQuaDocHoSoOn {
  /** sbd → hồ sơ ôn. `undefined` = KHÔNG lô nào đọc được (máy chủ chưa có lệnh,
   * mất mạng) ⇒ chỗ gọi rút đề ĐÚNG NHƯ TRƯỚC 19/09. `{}` hoặc thiếu vài em =
   * lệnh chạy được nhưng các em đó chưa có dòng nào / lô của các em đó hỏng. */
  hoSo?: Record<string, HoSoOnEm>
  /** Số em nằm trong lô KHÔNG đọc được. */
  soEmHong: number
  /** Lỗi của lô hỏng đầu tiên — để biên bản nói đúng chuyện đang xảy ra. */
  loi: string
}

/** ĐỌC HỒ SƠ ÔN CHO CẢ PHÒNG CHỜ — lệnh máy chủ `hoSoOnCa`, chia lô 20 em.
 *
 * KHÔNG BAO GIỜ NÉM LỖI. Đây là lớp thông tin THÊM lên trên `banDoSaiCa`; nó
 * hỏng thì ca vẫn phải mở được với đúng bộ đề bản cũ sẽ rút. Lô nào hỏng thì chỉ
 * các em trong lô đó đi luật cũ. Hợp đồng: `docs/hop-dong-ho-so-on-ca-1909.md`. */
export async function docHoSoOnCa(url: string, mat: string, dsSbd: string[], maCa: string, ngayCa: string, soCa: 1 | 3 = 1): Promise<KetQuaDocHoSoOn> {
  const LO = 20
  const ds = [...new Set(dsSbd.map((x) => String(x || '').trim()).filter(Boolean))]
  const hoSo: Record<string, HoSoOnEm> = {}
  let soLoDuoc = 0
  let soEmHong = 0
  let loi = ''
  for (let i = 0; i < ds.length; i += LO) {
    const lo = ds.slice(i, i + LO)
    try {
      const em = await hoSoOnCa(url, mat, lo, maCa, ngayCa, soCa)
      soLoDuoc += 1
      // Chỉ nhận em CÓ TRONG LÔ đã hỏi: máy chủ trả thừa SBD lạ thì bỏ.
      for (const sbd of lo) if (sbd in em) hoSo[sbd] = docHoSoOnEm(em[sbd])
    } catch (e) {
      soEmHong += lo.length
      if (!loi) loi = e instanceof Error ? e.message : 'không đọc được hồ sơ ôn'
    }
  }
  return { hoSo: soLoDuoc > 0 ? hoSo : undefined, soEmHong, loi }
}

/** qid → MÃ DẠNG của mọi câu trong kho ca: `dang.ma` thầy đã gán lúc nạp đề,
 * thiếu thì `CD:<chuyên đề>` — đúng quy ước máy chủ ghi vào `su_kien_hoc.ma_dang`,
 * nên mã của câu gốc (từ hồ sơ) và mã của ứng viên song sinh (từ kho) so được. */
export function maDangCuaKho(bank: TeacherExamSource[]): Record<string, string> {
  const ra: Record<string, string> = {}
  for (const s of bank) {
    for (const q of [...s.phanI, ...s.phanII, ...s.phanIII]) {
      const ma = String(q.dang?.ma ?? '').trim()
      const cd = String(q.chuyenDe ?? '').trim()
      if (ma) ra[q.id] = ma
      else if (cd) ra[q.id] = `CD:${cd}`
    }
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
  /** sbd → danh sách câu sai gốc được kiểm tra lại. */
  cauGocTheoEm?: Record<string, string[]>
  /** sbd → danh sách câu song sinh cùng dạng đổi số để chống học vẹt. */
  songSinhTheoEm?: Record<string, string[]>
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
  /** HỒ SƠ ÔN (19/09): ca này rút theo đường nào. `coHoSo = false` = máy chủ chưa
   * có lệnh `hoSoOnCa` hoặc lệnh lỗi ⇒ đề y hệt bản trước 19/09. */
  hoSoOn: { coHoSo: boolean; ngayCa: string; soEmCoHoSo: number; soEmHong: number; loi: string }
  /** Kho mỏng phải nới tập cấm: em nào nhận lại bao nhiêu câu vừa làm trong tuần. */
  noiCam: { sbd: string; soNoi: number }[]
  /** sbd → câu sai ca trước KHÔNG hỏi lại vì hồ sơ nói đã khắc phục. */
  daKhacPhucTheoEm: Record<string, string[]>
  /** GHI CHÚ CHO BIÊN BẢN — `tin` in màu thường, `canh_bao` in màu cam (thầy cần
   * làm gì đó). Màn Ca thi chép nguyên mảng này vào `BienBanDeRieng.ghiChu`. */
  ghiChu: GhiChuBienBan[]
  /** LƯỢT HAI — em cùng lớp chưa vào phòng chờ lúc bấm Bắt đầu, đã được chuẩn bị
   * đề sẵn. Bộ đề của các em này ĐÃ nằm trong `boTheoEm`/`lapTheoEm` ở trên (máy
   * chủ phải có thì em vào muộn mới nhận được), nhưng KHÔNG nằm trong mọi con số
   * biên bản (`thieu`, `canCua`, `soLapCua`, `saiCaTruocCua`, `tuCaCua`, `trungBinh`). */
  vang: { dsSbd: string[]; coHoSo: boolean; soCauNoiThem: number; dinhTrung: number; thieuCau: { sbd: string; thieu: number }[]; noiCam: { sbd: string; soNoi: number }[] }
}

export interface GhiChuBienBan {
  loai: 'tin' | 'canh_bao'
  loi: string
}

/** Phần tuỳ chọn của `dungDeRiengChoCa`. */
export interface TuyChonDungDeRieng {
  /** Ngày VN của ca. Mặc định: ngày VN lúc thầy bấm Bắt đầu. */
  ngayCa?: string
  /** LỚP của ca (`ca.lop`). Có thì em CÙNG LỚP chưa vào phòng chờ được chuẩn bị đề
   * sẵn ở LƯỢT HAI. Rỗng/thiếu ⇒ KHÔNG có lượt hai: ca không ghi lớp mà vẫn gộp
   * là gộp cả trường (bản 17/09 mắc đúng chỗ này). Không đụng luật vào thi — em
   * vắng chỉ có thêm một dòng trong bản đồ, vào được hay không vẫn do cổng cũ quyết. */
  lopCa?: string
}

/** CA LẤY NGUỒN CÂU SAI của một em — đúng phép chọn của `chonCauLapChoEm`: ca gần
 * nhất em có nộp (`gan_nhat`), hoặc tối đa 3 ca gần nhất em có nộp (`ba_ca`). */
function caNguonCuaEm(dsCa: CaTruocDaCham[], sbd: string, ch: CauHinhDeRieng): CaTruocDaCham[] {
  const coNop = dsCa.slice(0, Math.max(0, ch.TRAN_CA_QUET)).filter((c) => (c.daLamCua[sbd] ?? []).length > 0)
  return coNop.slice(0, ch.PHAM_VI_HOI_LAI === 'ba_ca' ? SO_CA_BOC_NGAU_NHIEN : 1)
}

/** LỌC KHO TOÀN BỘ VỀ ĐÚNG CHUYÊN ĐỀ CỦA CA (vá 19/09 — sự cố "chọn chương 1
 * ra cả chương 2").
 *
 * BÙ KHO cho phần CÂU MỚI (khi kho ca không đủ số câu mỗi phần) trước đây lấy
 * bừa từ `khoToanBo` — TOÀN BỘ kho câu trên máy thầy, không lọc chuyên đề.
 * Ca thầy chọn "Chương 1 – Ester" mà kho Chương 1 không đủ câu (đề bài mới,
 * ít câu, hoặc đã loại bớt câu sao) thì phần thiếu bị lấp bằng câu CHƯƠNG
 * KHÁC — im lặng, đề ra không còn đúng chuyên đề thầy chọn nữa.
 *
 * KHÁC với "câu khắc phục" (30% câu em từng sai): đó là thầy chủ động chốt
 * 08/09 "bất kể chuyên đề gì", còn BÙ KHO là chuyện phát sinh ngoài ý định —
 * không có lý do gì bù bằng câu khác chuyên đề. Chuyên đề ca lấy từ CHÍNH kho
 * gốc của ca (`bankGoc`, trước khi nối câu khắc phục) — đó là câu thầy đã rút
 * lúc mở ca, đúng những chuyên đề thầy chọn. Kho gốc không câu nào gắn chuyên
 * đề (dữ liệu cũ, hoặc thầy không lọc chuyên đề lúc rút) thì trả nguyên
 * `khoToanBo` — không có gì để lọc theo, thà bù đủ câu còn hơn ca thiếu câu. */
export function locKhoToanBoTheoChuyenDeCa(khoToanBo: TeacherExamSource[], bankGoc: TeacherExamSource[]): TeacherExamSource[] {
  const chuyenDeCa = new Set(
    bankGoc
      .flatMap((s) => [...s.phanI, ...s.phanII, ...s.phanIII])
      .map((q) => chuanChuyenDe((q as { chuyenDe?: string }).chuyenDe ?? ''))
      .filter(Boolean),
  )
  if (chuyenDeCa.size === 0) return khoToanBo
  const hop = (q: { chuyenDe?: string }) => chuyenDeCa.has(chuanChuyenDe(q.chuyenDe ?? ''))
  return khoToanBo.map((s) => ({ ...s, phanI: s.phanI.filter(hop), phanII: s.phanII.filter(hop), phanIII: s.phanIII.filter(hop) }))
}

/** LỌC KHO BÙ THEO KHỐI CỦA CA (Code 1 yêu cầu 21/09 — cùng luật khối với mọi kênh rút câu khác).
 *
 * BÙ KHO lấy từ CẢ kho máy thầy nên có thể bù câu KHỐI CAO HƠN vào đề của ca khối thấp (ca lớp 11 nhận câu lớp 12). Chỉ giữ câu HỢP KHỐI: khối câu đọc từ mã tờ
 * (`maDe` của nguồn) VÀ mã câu (`id`) như `khoiCuaCau` — khối cao hơn khối ca ⇒ bỏ; không rõ khối ca (ca không ghi lớp) hoặc không rõ khối câu ⇒ GIỮ (không đoán).
 * Chỉ áp cho phần BÙ; kho gốc của ca (thầy chọn lúc mở ca) và câu hỏi-lại-câu-đã-sai không đụng. Hàm thuần. */
export function locKhoBuTheoKhoi(kho: TeacherExamSource[], khoiCa: Khoi | null | undefined): TeacherExamSource[] {
  if (!khoiCa) return kho
  const hop = (s: TeacherExamSource) => (q: { id: string }) => cauHopKhoi(khoiCa, { maDe: s.maDe, id: q.id })
  return kho.map((s) => ({ ...s, phanI: s.phanI.filter(hop(s)), phanII: s.phanII.filter(hop(s)), phanIII: s.phanIII.filter(hop(s)) }))
}

/** CÂU BÙ KHO cho đề riêng: câu CHƯA có trong bộ và KHÔNG phải câu tự luận (thầy lệnh 21/09: tuyệt đối không rút tự luận), đúng số thiếu từng phần, theo thứ tự kho. */
export function chonCauBuKho(
  kho: TeacherExamSource[],
  daCo: ReadonlySet<string>,
  thieu: { I: number; II: number; III: number },
): Pick<TeacherExamSource, 'phanI' | 'phanII' | 'phanIII'> {
  return {
    phanI: kho.flatMap((s) => s.phanI.filter((q) => !daCo.has(q.id) && laCauRutDuoc(q, 'I'))).slice(0, thieu.I),
    phanII: kho.flatMap((s) => s.phanII.filter((q) => !daCo.has(q.id) && laCauRutDuoc(q, 'II'))).slice(0, thieu.II),
    phanIII: kho.flatMap((s) => s.phanIII.filter((q) => !daCo.has(q.id) && laCauRutDuoc(q, 'III'))).slice(0, thieu.III),
  }
}


export async function dungDeRiengChoCa(
  url: string,
  mat: string,
  maCa: string,
  dsSbd: string[],
  ch: CauHinhDeRieng = CAU_HINH_DE_RIENG_MAC_DINH,
  tuyChon: TuyChonDungDeRieng = {},
): Promise<KetQuaDungDeRieng> {
  const bank = await loadSessionTeacherBank(maCa)
  if (!bank || bank.length === 0) throw new Error('Máy này chưa có bản đề CÓ đáp án của ca')
  const sc = await docSoCauCa(maCa)
  if (!sc) throw new Error('Ca này chưa ghi số câu mỗi phần')

  // DANH SÁCH LỚP đi SONG SONG với việc quét ca cũ — lượt hai không được làm thầy
  // đứng chờ thêm. Hỏng thì chỉ mất lượt hai (em vào muộn bốc theo hash như ca
  // thường), việc bấm Bắt đầu không hỏng theo.
  const lopCa = String(tuyChon.lopCa ?? '').trim()
  const [nguonCaTruoc, dsLop] = await Promise.all([
    docCacCaTruoc(url, mat, [maCa], ch, dsSbd),
    lopCa ? danhSachEm(url, mat).catch(() => null) : Promise.resolve(null),
  ])
  const { dsCa, boQua, namQuet, nguonNam, soCaThuMuc } = nguonCaTruoc
  const ghiChu: GhiChuBienBan[] = []
  const coMat = new Set(dsSbd)
  // Sắp theo SBD: thứ tự máy chủ trả danh sách lớp không phải là đầu vào của thuật toán.
  const dsSbdVang = dsLop
    ? [...new Set(dsLop.filter((e) => String(e.lop ?? '').trim() === lopCa).map((e) => String(e.sbd ?? '').trim()))].filter((x) => x && !coMat.has(x)).sort()
    : []
  if (!lopCa) ghiChu.push({ loai: 'tin', loi: 'ca không ghi lớp — em vào muộn rút theo luật thường (không chuẩn bị đề sẵn)' })
  else if (!dsLop) ghiChu.push({ loai: 'canh_bao', loi: 'không đọc được danh sách lớp — em vào muộn rút theo luật thường, không có câu hỏi lại' })

  // HỒ SƠ ÔN (GĐ 6 Kênh 1, 19/09) — lớp thông tin THÊM, ≤ 3 lệnh cho 60 em.
  // `banDoSaiCa` ở trên vẫn là nguồn của luật 30% và trần lặp; hồ sơ chỉ nói câu
  // nào em đã tự chữa, câu nào tới hạn ôn, và tuần này em vừa làm câu gì. Lệnh
  // hỏng ⇒ `hoSo` là `undefined` ⇒ `dungDeRieng` chạy đúng bản trước.
  const ngayCa = tuyChon.ngayCa ?? ngayVnCua(Date.now())
  const soCaHoSo = ch.PHAM_VI_HOI_LAI === 'ba_ca' ? 3 : 1
  // Hồ sơ của em VẮNG là một lượt RIÊNG (chia lô 20 như cũ), chạy song song: nó
  // hỏng thì chỉ em vắng đi luật cũ, không kéo em có mặt theo — và ngược lại.
  const [docHoSo, docHoSoVang] = await Promise.all([
    docHoSoOnCa(url, mat, dsSbd, maCa, ngayCa, soCaHoSo),
    dsSbdVang.length > 0 ? docHoSoOnCa(url, mat, dsSbdVang, maCa, ngayCa, soCaHoSo) : Promise.resolve<KetQuaDocHoSoOn>({ hoSo: undefined, soEmHong: 0, loi: '' }),
  ])
  // KHAI RA, không im lặng.
  if (!docHoSo.hoSo) ghiChu.push({ loai: 'canh_bao', loi: `hồ sơ ôn chưa đọc được (${docHoSo.loi || 'máy chủ chưa có lệnh'}) — rút đúng luật cũ, không phải lỗi ca` })
  else if (docHoSo.soEmHong > 0) ghiChu.push({ loai: 'canh_bao', loi: `${docHoSo.soEmHong} em không đọc được hồ sơ ôn (${docHoSo.loi}) — các em đó rút theo luật cũ` })

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
  let uvCuoi = uv
  const qidHoiLai = new Set(cauNoiThem.qids)
  const soMoiCoI = uv.I.filter((q) => !qidHoiLai.has(q.id)).length
  const soMoiCoII = uv.II.filter((q) => !qidHoiLai.has(q.id)).length
  const soMoiCoIII = uv.III.filter((q) => !qidHoiLai.has(q.id)).length

  const thieuI = Math.max(0, sc.I - soMoiCoI)
  const thieuII = Math.max(0, sc.II - soMoiCoII)
  const thieuIII = Math.max(0, sc.III - soMoiCoIII)
  if (thieuI > 0 || thieuII > 0 || thieuIII > 0) {
    const khoToanBoGoc = await loadExamSources().catch(() => [] as TeacherExamSource[])
    // Lọc về đúng chuyên đề ca (vá 19/09) TRƯỚC khi bù — xem
    // `locKhoToanBoTheoChuyenDeCa`. `bank` ở đây là kho GỐC của ca (trước khi
    // nối câu khắc phục), đúng những chuyên đề thầy đã chọn lúc mở ca.
    // Rồi lọc KHỐI của ca (`lopCa` rỗng ⇒ không rõ khối ⇒ không lọc): ca lớp 11 không được bù câu lớp 12.
    const khoToanBo = locKhoBuTheoKhoi(locKhoToanBoTheoChuyenDeCa(khoToanBoGoc, bank), khoiCuaEm({ lop: lopCa }))
    const daCo = new Set([...bankDung.flatMap((s) => [...s.phanI, ...s.phanII, ...s.phanIII].map((q) => q.id))])
    const bu: TeacherExamSource = { maDe: `${maCa}-bu-kho`, ...chonCauBuKho(khoToanBo, daCo, { I: thieuI, II: thieuII, III: thieuIII }) }
    if (bu.phanI.length > 0 || bu.phanII.length > 0 || bu.phanIII.length > 0) {
      bankDung = [...bankDung, bu]
      await noiKhoCa(url, mat, maCa, mergeAndStrip([bu]), { phanI: bu.phanI, phanII: bu.phanII, phanIII: bu.phanIII })
      await saveSessionTeacherBank(maCa, bankDung)
      uvCuoi = dungUngVien(bankDung)
    }
  }

  const yeuCau: YeuCauDeRieng = {
    uv: uvCuoi,
    yc: { soCau: sc, chuyenDe: [], mucDo: [], tranhQid: [], seed: hashSeed(maCa) },
    dsSbd,
    dsCa,
    ch,
    // Ba trường dưới CHỈ có khi lệnh `hoSoOnCa` chạy được. Thiếu cả ba thì lời gọi
    // này giống hệt bản trước 19/09 và ra đúng bộ đề đó.
    ...(docHoSo.hoSo ? { hoSo: docHoSo.hoSo, ngayCa, maDangCua: maDangCuaKho(bankDung) } : {}),
  }
  const ra = dungDeRieng(yeuCau)
  if (ra.noiCam.length > 0) {
    const tong = ra.noiCam.reduce((t, x) => t + x.soNoi, 0)
    ghiChu.push({ loai: 'canh_bao', loi: `kho mỏng — ${ra.noiCam.length} em phải nhận lại tổng ${tong} câu vừa làm trong tuần (đã nới câu cũ nhất trước); thêm câu vào kho ca để hết trùng` })
  }
  const emDaKhacPhuc = Object.values(ra.daKhacPhucTheoEm)
  if (emDaKhacPhuc.length > 0) {
    ghiChu.push({ loai: 'tin', loi: `${emDaKhacPhuc.length} em đã tự khắc phục tổng ${emDaKhacPhuc.reduce((t, x) => t + x.length, 0)} câu sai ca trước ở bài luyện — không hỏi lại các câu đó` })
  }

  // LƯỢT HAI — EM VẮNG. Chạy SAU khi `ra` (mọi em có mặt) đã chốt và chỉ ĐỌC `ra`.
  const vang: KetQuaDungDeRieng['vang'] = { dsSbd: dsSbdVang, coHoSo: Boolean(docHoSoVang.hoSo), soCauNoiThem: 0, dinhTrung: 0, thieuCau: [], noiCam: [] }
  let boVang: ReturnType<typeof dungDeRiengLuotHai> | null = null
  if (dsSbdVang.length > 0) {
    // Câu em vắng từng sai mà kho ca chưa có: nối vào bằng MỘT lượt `noiKhoCa`
    // riêng. Kho phần câu MỚI của lượt một không đổi (đã chốt ở trên), nên đề em
    // có mặt không đổi một qid. Lượt nối hỏng ⇒ em vắng bỏ các câu ngoài kho
    // (đúng lý do `ngoai_kho` như cũ), việc bấm Bắt đầu KHÔNG hỏng theo.
    let bankVang = bankDung
    try {
      const daCo = new Set(bankDung.flatMap((b) => [...b.phanI, ...b.phanII, ...b.phanIII].map((q) => q.id)))
      const canTheoCaVang = new Map<string, Set<string>>()
      for (const sbd of dsSbdVang) {
        for (const ca of caNguonCuaEm(dsCa, sbd, ch)) {
          for (const q of ca.saiCua[sbd] ?? []) {
            if (daCo.has(q)) continue
            const bo = canTheoCaVang.get(ca.maCa) ?? new Set<string>()
            bo.add(q)
            canTheoCaVang.set(ca.maCa, bo)
          }
        }
      }
      if (canTheoCaVang.size > 0) {
        const can = new Set([...canTheoCaVang.values()].flatMap((b) => [...b]))
        const kho = await loadExamSources().catch(() => [] as TeacherExamSource[])
        const themVang: TeacherExamSource = {
          maDe: `${maCa}-hoi-lai-vang`,
          phanI: kho.flatMap((b) => b.phanI.filter((q) => can.has(q.id))),
          phanII: kho.flatMap((b) => b.phanII.filter((q) => can.has(q.id))),
          phanIII: kho.flatMap((b) => b.phanIII.filter((q) => can.has(q.id))),
        }
        const daLay = new Set([...themVang.phanI, ...themVang.phanII, ...themVang.phanIII].map((q) => q.id))
        const conThieu = new Map<string, Set<string>>()
        for (const [ma, bo] of canTheoCaVang) {
          const b = new Set([...bo].filter((q) => !daLay.has(q)))
          if (b.size > 0) conThieu.set(ma, b)
        }
        if (conThieu.size > 0) {
          const buCa = await gomCauTuCaCu(url, mat, conThieu)
          themVang.phanI = [...themVang.phanI, ...buCa.phanI]
          themVang.phanII = [...themVang.phanII, ...buCa.phanII]
          themVang.phanIII = [...themVang.phanIII, ...buCa.phanIII]
        }
        const soThem = themVang.phanI.length + themVang.phanII.length + themVang.phanIII.length
        if (soThem > 0) {
          await noiKhoCa(url, mat, maCa, mergeAndStrip([themVang]), { phanI: themVang.phanI, phanII: themVang.phanII, phanIII: themVang.phanIII })
          bankVang = [...bankDung, themVang]
          await saveSessionTeacherBank(maCa, bankVang)
          vang.soCauNoiThem = soThem
        }
      }
    } catch (e) {
      bankVang = bankDung
      ghiChu.push({ loai: 'canh_bao', loi: `không nối được câu em vắng từng sai vào kho ca (${e instanceof Error ? e.message : 'lỗi không rõ'}) — em vào muộn có thể thiếu câu hỏi lại` })
    }

    boVang = dungDeRiengLuotHai({
      y: yeuCau,
      luotMot: ra,
      dsSbdVang,
      hoSoVang: docHoSoVang.hoSo,
      ...(bankVang !== bankDung ? { uvThem: dungUngVien(bankVang) } : {}),
      ...(docHoSoVang.hoSo ? { maDangCuaThem: maDangCuaKho(bankVang) } : {}),
    })
    vang.dinhTrung = boVang.dinhTrung
    vang.thieuCau = boVang.thieuCau
    vang.noiCam = boVang.noiCam
    if (!docHoSoVang.hoSo) ghiChu.push({ loai: 'canh_bao', loi: `hồ sơ ôn của ${dsSbdVang.length} em chưa vào phòng chờ không đọc được (${docHoSoVang.loi || 'lỗi không rõ'}) — đề sẵn của các em đó rút theo luật cũ` })
    // ĐÚNG MỘT DÒNG về em vắng trong biên bản; mọi con số khác chỉ đếm em có mặt.
    ghiChu.push({ loai: 'tin', loi: `${dsSbdVang.length} em chưa vào phòng chờ đã được chuẩn bị đề sẵn` })
  }
  // Bản đồ GỬI MÁY CHỦ phải có cả em vắng — không có thì em vào muộn không nhận
  // được đề đã chuẩn bị. Em có mặt đứng trước, y nguyên thứ tự và nội dung.
  const gop = (a: Record<string, string[]>, b: Record<string, string[]> | undefined) => (b ? { ...a, ...b } : a)
  const boTheoEm = gop(ra.boTheoEm, boVang?.boTheoEm)
  return {
    cauNoiThem,
    boTheoEm,
    lapTheoEm: gop(ra.lapTheoEm, boVang?.lapTheoEm),
    cauGocTheoEm: gop(ra.cauGocTheoEm, boVang?.cauGocTheoEm),
    songSinhTheoEm: gop(ra.songSinhTheoEm, boVang?.songSinhTheoEm),
    lapCua: lapCuaTungEm(boTheoEm, demLanSai(dsCa)),
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
    hoSoOn: {
      coHoSo: Boolean(docHoSo.hoSo),
      ngayCa,
      soEmCoHoSo: Object.keys(docHoSo.hoSo ?? {}).length,
      soEmHong: docHoSo.soEmHong,
      loi: docHoSo.loi,
    },
    noiCam: ra.noiCam,
    daKhacPhucTheoEm: ra.daKhacPhucTheoEm,
    ghiChu,
    vang,
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
