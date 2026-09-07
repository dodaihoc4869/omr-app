// ĐỀ RIÊNG TỪNG EM — phần ĐI LẤY DỮ LIỆU (DE-RIENG-TUNG-EM mục 4.1).
//
// Tách khỏi `de-rieng.ts` để lõi thuật toán test được không cần máy chủ.
//
// SỐ LỆNH MÁY CHỦ: đúng MỘT lệnh cho MỘT CA (`chiTietCa`), không phải một lệnh
// cho một em. Quét ngược tối đa `SO_CA_TRA_NGUOC` ca ⇒ tối đa 3 lệnh cho cả
// lớp 40 em, đúng ngưỡng ở bảng nghiệm thu.
import { chiTietCa, danhSachCa } from './exam-api'
import { taoChiTietCau } from './chi-tiet-cau'
import { docDeRiengCa, loadSessionTeacherBank, docSoCauCa, saveSessionTeacherBank } from './exam-db'
import { mergeKeepAnswers, type SoCauMoiPhan, type TeacherExamSource } from '../data/examContent'
import { CAU_HINH_DE_RIENG_MAC_DINH, type CauHinhDeRieng } from './cau-hinh-de-rieng'
import type { CaTruocDaCham } from './de-rieng'

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

/** Lấy `SO_CA_TRA_NGUOC` ca THI gần nhất đã đóng, mới nhất trước.
 *
 * Chỉ lấy ca `loai === 'thi'`: bài tập về nhà không phải bài kiểm tra có thầy
 * coi, lấy câu sai ở đó ra hỏi lại là hỏi lại câu em tra mạng. */
export async function docCacCaTruoc(url: string, mat: string, boCa: string[] = [], ch: CauHinhDeRieng = CAU_HINH_DE_RIENG_MAC_DINH): Promise<NguonCaTruoc> {
  const tatCa = await danhSachCa(url, mat)
  const bo = new Set(boCa.map((x) => x.trim()).filter(Boolean))
  const ung = tatCa
    .filter((c) => c.loai !== 'baitap' && c.trangThai !== 'da_xoa' && !bo.has(c.maCa))
    .sort((a, b) => String(b.moLuc ?? '').localeCompare(String(a.moLuc ?? '')))
    .slice(0, Math.max(0, ch.SO_CA_TRA_NGUOC))

  const dsCa: CaTruocDaCham[] = []
  const boQua: CaBoQua[] = []
  for (const c of ung) {
    try {
      dsCa.push(await docCaTruoc(url, mat, c.maCa, ch))
    } catch (e) {
      boQua.push({ maCa: c.maCa, vi_sao: e instanceof Error ? e.message : 'không đọc được ca này' })
    }
  }
  return { dsCa, boQua }
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
