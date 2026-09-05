// PHÂN CÂU GỌI LÊN BẢNG — duyệt theo CÂU, không theo em.
//
// Đặc tả: claude/CA-THI-VA-GOI-LEN-BANG.md mục 4.4.
//
// Khác hẳn `goi-len-bang.ts` cũ (duyệt em, mỗi em lấy một câu thuộc chuyên đề
// em yếu). Ở đây thứ tự chữa bài mới là thứ quan trọng: một tiết chỉ chữa được
// mươi câu, nên phải chữa ĐÚNG mươi câu đáng chữa nhất của cả lớp, rồi mới hỏi
// câu ấy nên gọi em nào lên.
//
// BA THỨ QUYẾT ĐỊNH MỘT CÂU CÓ ĐÁNG CHỮA KHÔNG:
//   · sao cần chữa — thầy đã chấm sẵn trong kho, 0/1/2
//   · tỉ lệ cả lớp làm đúng — cả lớp đúng thì đọc đáp án là xong
//   · độ chụm — cả lớp cùng chọn một phương án sai nghĩa là cùng MỘT hiểu
//     nhầm, đáng chữa hơn hẳn câu sai rải rác do ẩu
//
// Mọi thứ trong file này là hàm thuần, không đụng DOM, không gọi mạng.
import { hashSeed } from './exam-shuffle'
import { chuanChuyenDe } from './goi-len-bang'
import { taoChiTietCau } from './chi-tiet-cau'
import type { AnswerRecord } from './exam-db'
import type { CanChua, SoCauMoiPhan, TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion } from '../data/examContent'

// ---------------------------------------------------------- NGƯỠNG & HỆ SỐ
// MỘT NGUỒN SỰ THẬT. Cấm rải mấy con số này ra chỗ khác.

/** Cả lớp đúng từ mức này trở lên: chỉ đọc đáp án, không phân cho ai. */
export const NGUONG_CHI_DOC = 0.85
/** Câu không sao mà lớp đúng từ mức này: cũng chỉ đọc đáp án. */
export const NGUONG_CHI_DOC_KHONG_SAO = 0.7
export const HE_SO_SAO = 100
export const HE_SO_SAI = 50
export const HE_SO_CHUM = 30

export type PhanDe = 'I' | 'II' | 'III'

export interface CauTrongCa {
  qid: string
  phan: PhanDe
  /** Số câu in trong đề của ca — con số thầy đọc to trên lớp. */
  so: number
  chuyenDe: string
  sao: 0 | 1 | 2
  tomTat: string
  /** Số em có bài làm câu này. 0 = chưa em nào làm tới. */
  soEmLam: number
  soEmDung: number
  /** Đáp án của những em LÀM SAI (chuỗi thô: 'B', 'DSSD', '12,5'…). */
  dapAnSai: string[]
}

export interface EmTrongCa {
  sbd: string
  hoTen: string
  /** Vắng mặt thì bị loại khỏi danh sách ghép trước khi chạy. */
  vangMat?: boolean
  /** qid em làm SAI trong ca này. */
  qidSai: string[]
  /** Ba chuyên đề em yếu nhất (tên như trong kho, hàm tự chuẩn hoá khi so). */
  chuyenDeYeu: string[]
  /** Số lần em đã lên bảng theo `lich_su_len_bang`. Thiếu → 0. */
  soLanLenBang?: number
}

export type MucGhep = 1 | 2 | 3 | 4

export interface DongPhanCong {
  cau: CauTrongCa
  sbd: string
  hoTen: string
  muc: MucGhep
  /** Câu chữ ngắn nói VÌ SAO chọn em này — thầy nhìn là biết, không phải đoán. */
  viSao: string
}

export interface LuotGoi {
  /** Lượt thứ mấy, đếm từ 1. */
  luot: number
  dong: DongPhanCong[]
}

export interface KetQuaPhanCau {
  /** Câu không cần chữa, gom một khối cuối màn. */
  chiDoc: CauTrongCa[]
  /** Câu đáng chữa, đã xếp theo điểm giảm dần. */
  dangChua: CauTrongCa[]
  luot: LuotGoi[]
  /** Câu đáng chữa mà hết em để phân — còn lại sau lượt cuối. */
  chuaPhan: CauTrongCa[]
}

// ------------------------------------------------------------------ TÍNH

/** Tỉ lệ cả lớp làm ĐÚNG câu này. Không em nào làm tới thì trả 0 — câu chưa ai
 * chạm vào không thể coi là "cả lớp đã đúng". */
export function tiLeDungLop(c: Pick<CauTrongCa, 'soEmLam' | 'soEmDung'>): number {
  return c.soEmLam > 0 ? c.soEmDung / c.soEmLam : 0
}

/**
 * ĐỘ CHỤM — trong số em LÀM SAI, tỉ lệ em cùng chọn một phương án.
 *
 * 12/12 em sai cùng chọn B là cả lớp mắc chung một hiểu nhầm: chữa câu đó là
 * gỡ được cho cả lớp. 12 em sai mỗi em một kiểu là sai do ẩu, chữa một câu
 * không gỡ được gì.
 *
 * Không em nào sai → 0.
 */
export function doChum(dapAnSai: string[]): number {
  const co = dapAnSai.map((x) => (x ?? '').trim()).filter(Boolean)
  if (co.length === 0) return 0
  const dem = new Map<string, number>()
  for (const d of co) dem.set(d, (dem.get(d) ?? 0) + 1)
  return Math.max(...dem.values()) / co.length
}

/** Câu KHÔNG CẦN CHỮA: cả lớp đã đúng, hoặc câu không sao mà lớp đúng nhiều. */
export function chiDocDapAn(c: CauTrongCa): boolean {
  const tl = tiLeDungLop(c)
  if (tl >= NGUONG_CHI_DOC) return true
  return c.sao === 0 && tl >= NGUONG_CHI_DOC_KHONG_SAO
}

export function diemCau(c: CauTrongCa): number {
  return c.sao * HE_SO_SAO + (1 - tiLeDungLop(c)) * HE_SO_SAI + doChum(c.dapAnSai) * HE_SO_CHUM
}

/** Xếp câu theo điểm giảm dần. Bằng điểm thì theo phần rồi số câu, để hai lần
 * chạy ra đúng một thứ tự — thầy đọc lại danh sách phải thấy y hệt. */
export function xepCau(ds: CauTrongCa[]): CauTrongCa[] {
  const bac: Record<PhanDe, number> = { I: 0, II: 1, III: 2 }
  return [...ds].sort((a, b) => diemCau(b) - diemCau(a) || bac[a.phan] - bac[b.phan] || a.so - b.so)
}

// ------------------------------------------------------------------ GHÉP

/** Mức ghép của một em với một câu. Trả null khi không ghép được (không xảy ra
 * với mức 4, nhưng giữ để hàm tổng đọc rõ). */
function mucCua(em: EmTrongCa, c: CauTrongCa): MucGhep {
  const saiCau = em.qidSai.includes(c.qid)
  const yeuCd = c.chuyenDe.trim() !== '' && em.chuyenDeYeu.some((t) => chuanChuyenDe(t) === chuanChuyenDe(c.chuyenDe))
  if (saiCau && yeuCd) return 1
  if (saiCau) return 2
  if (yeuCd) return 3
  return 4
}

function viSaoCua(muc: MucGhep, c: CauTrongCa): string {
  if (muc === 1) return `sai câu này · yếu ${c.chuyenDe}`
  if (muc === 2) return 'sai câu này'
  if (muc === 3) return `yếu ${c.chuyenDe}`
  return 'chưa được gọi lượt này'
}

/**
 * Phân MỘT lượt: duyệt câu theo thứ tự ưu tiên, mỗi câu chọn một em.
 *
 * `hạThapUuTien` là những em đã lên ở lượt trước — chỉ nhận câu khi KHÔNG CÒN
 * em nào chưa lên. Không cấm hẳn: 40 câu mà 27 em thì lượt 2 buộc phải gọi lại
 * người cũ, cấm là để câu treo.
 */
export function phanMotLuot(
  cau: CauTrongCa[],
  em: EmTrongCa[],
  seed: string,
  haThapUuTien: Set<string> = new Set(),
  /** Thầy đã bấm "Đổi em khác": câu qid này KHÔNG giao cho những sbd trong danh
   * sách nữa. Thầy có lý do mà máy không biết (em nghỉ ốm, em vừa lên hôm qua). */
  khongNhan: Record<string, string[]> = {},
): { dong: DongPhanCong[]; conCau: CauTrongCa[] } {
  const conEm = new Map<string, EmTrongCa>()
  for (const e of em) if (!e.vangMat) conEm.set(e.sbd, e)

  const dong: DongPhanCong[] = []
  const conCau: CauTrongCa[] = []
  for (const c of cau) {
    if (conEm.size === 0) {
      conCau.push(c)
      continue
    }
    const cam = new Set(khongNhan[c.qid] ?? [])
    let tot: { em: EmTrongCa; muc: MucGhep } | null = null
    let totKhoa = ''
    for (const e of conEm.values()) {
      if (cam.has(e.sbd)) continue
      const muc = mucCua(e, c)
      // Bốc ngẫu nhiên TÁI TẠO ĐƯỢC: chạy lại cùng mã ca ra cùng kết quả, nên
      // thầy tải lại màn không thấy danh sách nhảy lung tung.
      const khoa = String(hashSeed(`${seed}|${c.qid}|${e.sbd}`))
      const ha = haThapUuTien.has(e.sbd) ? 1 : 0
      const haTot = tot && haThapUuTien.has(tot.em.sbd) ? 1 : 0
      const hon =
        !tot ||
        ha < haTot ||
        (ha === haTot &&
          (muc < tot.muc ||
            (muc === tot.muc &&
              ((e.soLanLenBang ?? 0) < (tot.em.soLanLenBang ?? 0) ||
                ((e.soLanLenBang ?? 0) === (tot.em.soLanLenBang ?? 0) && khoa < totKhoa)))))
      if (hon) {
        tot = { em: e, muc }
        totKhoa = khoa
      }
    }
    if (!tot) {
      conCau.push(c)
      continue
    }
    dong.push({ cau: c, sbd: tot.em.sbd, hoTen: tot.em.hoTen, muc: tot.muc, viSao: viSaoCua(tot.muc, c) })
    // RÀNG BUỘC CỨNG: một em chỉ nhận một câu mỗi lượt.
    conEm.delete(tot.em.sbd)
  }
  return { dong, conCau }
}

/**
 * Phân ĐỦ mọi lượt cho một ca đã chấm.
 *
 * Số câu đáng chữa thường nhiều hơn số em có mặt, nên chia lượt: mỗi lượt tối
 * đa N câu (N = số em có mặt). Câu đã phân ở lượt trước KHÔNG được phân lại;
 * em đã lên lượt trước bị hạ ưu tiên xuống dưới mọi em chưa lên.
 *
 * `soLuotToiDa` chặn trên để một ca 200 câu không sinh ra tám lượt vô nghĩa —
 * hết lượt mà còn câu thì câu đó vào `chuaPhan`, hiện ra chứ không giấu.
 */
export function phanCauLenBang(
  cau: CauTrongCa[],
  em: EmTrongCa[],
  seed: string,
  soLuotToiDa = 3,
  khongNhan: Record<string, string[]> = {},
): KetQuaPhanCau {
  const chiDoc = cau.filter(chiDocDapAn)
  const dangChua = xepCau(cau.filter((c) => !chiDocDapAn(c)))
  const coMat = em.filter((e) => !e.vangMat)

  const luot: LuotGoi[] = []
  const daLen = new Set<string>()
  let conLai = dangChua
  for (let i = 1; i <= soLuotToiDa && conLai.length > 0 && coMat.length > 0; i++) {
    const lay = conLai.slice(0, coMat.length)
    conLai = conLai.slice(coMat.length)
    const { dong, conCau } = phanMotLuot(lay, coMat, `${seed}|luot${i}`, new Set(daLen), khongNhan)
    if (dong.length === 0) break
    luot.push({ luot: i, dong })
    for (const d of dong) daLen.add(d.sbd)
    // Câu lượt này không phân được (hết em) đẩy về đầu phần còn lại.
    conLai = [...conCau, ...conLai]
  }
  return { chiDoc, dangChua, luot, chuaPhan: conLai }
}

/** Bảng phân công dạng chữ — thầy copy sang Zalo lớp hoặc dán vào giáo án. */
export function bangChu(kq: KetQuaPhanCau, tenCa: string): string {
  const d: string[] = [`Gọi lên bảng · ${tenCa}`]
  for (const l of kq.luot) {
    d.push('', `LƯỢT ${l.luot}`)
    for (const x of l.dong) d.push(`Câu ${x.cau.so} (phần ${x.cau.phan})${x.cau.sao > 0 ? ' ' + '★'.repeat(x.cau.sao) : ''} → ${x.hoTen || `SBD ${x.sbd}`} (${x.viSao})`)
  }
  if (kq.chiDoc.length > 0) {
    d.push('', `CHỈ ĐỌC ĐÁP ÁN — không cần chữa (${kq.chiDoc.length} câu)`)
    d.push(kq.chiDoc.map((c) => `Câu ${c.so}`).join(' · '))
  }
  if (kq.chuaPhan.length > 0) d.push('', `Còn ${kq.chuaPhan.length} câu chưa phân.`)
  return d.join('\n')
}

/** Dòng nhắc dẫn dắt khi cả lớp cùng mắc một hiểu nhầm. Dưới ngưỡng thì trả
 * chuỗi rỗng — nói "nhiều bạn cùng nghĩ vậy" khi chỉ 2/11 em chọn thế là sai
 * sự thật, và thầy đứng lớp sẽ phát hiện ngay. */
export const NGUONG_CHUM_NHAC = 0.5
export function nhacHieuNhamChung(c: CauTrongCa): string {
  const chum = doChum(c.dapAnSai)
  if (chum < NGUONG_CHUM_NHAC) return ''
  const dem = new Map<string, number>()
  for (const d of c.dapAnSai.map((x) => (x ?? '').trim()).filter(Boolean)) dem.set(d, (dem.get(d) ?? 0) + 1)
  let pa = ''
  let n = 0
  for (const [k, v] of dem) if (v > n || (v === n && k < pa)) ((pa = k), (n = v))
  return `${n} em cùng chọn ${pa} — hiểu nhầm chung`
}

// ------------------------------------------------- DỰNG DỮ LIỆU TỪ MỘT CA

/** Ngân hàng CÓ đáp án của ca (mergeKeepAnswers) — chỉ cần ba mảng câu. */
export interface NganHangCa {
  phanI: (TeacherMcqQuestion & { canChua?: CanChua })[]
  phanII: (TeacherTrueFalseQuestion & { canChua?: CanChua })[]
  phanIII: (TeacherShortAnswerQuestion & { canChua?: CanChua })[]
  soCau?: SoCauMoiPhan
}

export interface LuotDaCham {
  sbd: string
  hoTen: string
  /** Lượt chưa nộp / chưa vào thì coi là VẮNG, không ghép. */
  trangThai: string
  dapAn: AnswerRecord | null
  giayCau?: Record<string, number> | null
}

/** Số chuyên đề yếu nhất lấy ra cho mỗi em — đặc tả 4.4 nói "3 chuyên đề em
 * yếu nhất". Một nguồn sự thật, cấm viết số 3 ở chỗ khác. */
export const SO_CHUYEN_DE_YEU = 3

/**
 * Từ một ca ĐÃ CHẤM dựng ra đầu vào cho `phanCauLenBang`.
 *
 * `so` của mỗi câu lấy theo thứ tự trong NGÂN HÀNG CỦA CA, không theo số câu
 * trên giấy của từng em: mỗi em một thứ tự xáo riêng, đọc số của em này thì em
 * khác giở nhầm câu.
 *
 * `chuyenDeYeu` của em mặc định tính TỪ CHÍNH CA NÀY (chuyên đề em sai nhiều
 * nhất), không gọi máy chủ. Truyền `hoSoYeu` nếu muốn dùng hồ sơ tích luỹ.
 */
export function dungDuLieuTuCa(
  bank: NganHangCa,
  maCa: string,
  luot: LuotDaCham[],
  hoSoYeu?: Record<string, string[]>,
  lichSuLenBang?: Record<string, number>,
): { cau: CauTrongCa[]; em: EmTrongCa[] } {
  const tomTat = (t: string) =>
    (t || '')
      .replace(/\$\\ce\{([^}]*)\}\$/g, '$1')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 90)

  const cauTheoQid = new Map<string, CauTrongCa>()
  const them = (phan: PhanDe, ds: { id: string; text: string; chuyenDe?: string; canChua?: CanChua }[]) =>
    ds.forEach((q, i) =>
      cauTheoQid.set(q.id, {
        qid: q.id,
        phan,
        so: i + 1,
        chuyenDe: (q.chuyenDe || '').trim(),
        sao: q.canChua?.sao ?? 0,
        tomTat: tomTat(q.text),
        soEmLam: 0,
        soEmDung: 0,
        dapAnSai: [],
      }),
    )
  them('I', bank.phanI)
  them('II', bank.phanII)
  them('III', bank.phanIII)

  const em: EmTrongCa[] = []
  for (const l of luot) {
    // Chỉ em ĐÃ NỘP mới có bài để đối chiếu. Em đang làm dở hoặc chưa vào coi
    // như vắng — ghép câu cho em không có mặt là gọi tên vào chỗ trống.
    const daNop = l.trangThai === 'da_nop' || l.trangThai === 'khoa'
    if (!daNop || !l.dapAn) {
      em.push({ sbd: l.sbd, hoTen: l.hoTen, vangMat: true, qidSai: [], chuyenDeYeu: [], soLanLenBang: lichSuLenBang?.[l.sbd] ?? 0 })
      continue
    }
    const rows = taoChiTietCau(bank, maCa, l.sbd, l.dapAn, l.giayCau)
    const qidSai: string[] = []
    const saiTheoCd = new Map<string, number>()
    for (const r of rows) {
      const c = cauTheoQid.get(r.qid)
      if (c) {
        c.soEmLam++
        if (r.dungSai) c.soEmDung++
        else c.dapAnSai.push(r.dapAnChon || '(bỏ trống)')
      }
      if (!r.dungSai) {
        qidSai.push(r.qid)
        const cd = (r.chuyenDe || '').trim()
        if (cd) saiTheoCd.set(cd, (saiTheoCd.get(cd) ?? 0) + 1)
      }
    }
    const yeu =
      hoSoYeu?.[l.sbd] ??
      [...saiTheoCd.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'vi'))
        .slice(0, SO_CHUYEN_DE_YEU)
        .map(([ten]) => ten)
    em.push({ sbd: l.sbd, hoTen: l.hoTen, qidSai, chuyenDeYeu: yeu, soLanLenBang: lichSuLenBang?.[l.sbd] ?? 0 })
  }

  // Câu KHÔNG em nào làm tới (kho ca rộng hơn đề mỗi em) bị loại hẳn: đưa lên
  // bảng một câu cả lớp chưa ai đọc thì không phải là chữa bài.
  return { cau: [...cauTheoQid.values()].filter((c) => c.soEmLam > 0), em }
}
