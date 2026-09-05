// RÚT ĐỀ KHI MỞ CA — thầy chốt đúng những câu sẽ ra, thay vì đẩy cả kho lên.
//
// BA LÝ DO PHẢI CÓ MÀN NÀY, đo trên đề thật `12-C1-B1` (147 câu: I 90 · II 26
// · III 31, một chuyên đề Ester – lipid, 20 câu kèm ảnh cắt):
//
//  1. Gói công khai của cả kho nặng **2,1 MB**. Đẩy nguyên lên là mỗi em phải
//     tải 2,1 MB qua 4G ngay đầu giờ. Rút 18/4/6 câu còn ~100 KB.
//
//  2. Trước đây máy tự cắt CỨNG 18/4/6 câu, và cắt NGẪU NHIÊN RIÊNG TỪNG EM
//     (`assignStudentQuestions`). Với đề 28 câu — đúng 18+4+6 — không ai thấy
//     gì vì mọi em nhận trọn đề. Với 90 câu phần I thì **mỗi em làm một bộ 18
//     câu khác nhau**, nên điểm hai em không so được với nhau, trong khi hạng
//     lớp và phân bố lớp trong báo cáo gửi phụ huynh lại dựa đúng vào đó.
//     Nay: thầy chốt bộ câu, **cả lớp làm cùng một đề**. Chống nhìn bài vẫn
//     còn nguyên vì thứ tự câu và thứ tự A–D vẫn đảo riêng từng em.
//
//  3. Thầy không chọn được chuyên đề, không chọn được mức độ.
//
// CÁCH RÚT — không random trần:
//   · trải đều CHUYÊN ĐỀ trước (10 câu không dồn hết vào một chuyên đề),
//   · rồi trải đều MỨC ĐỘ trong phạm vi đã trải,
//   · câu đã ra ở ca trước bị đẩy xuống cuối (không cấm hẳn — cấm hẳn thì hết
//     câu là ca không mở được),
//   · thiếu câu thì BÁO SỐ THIẾU, không lặng lẽ trả ít hơn.
import type { TeacherExamSource, TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion } from '../data/examContent'
import { soSao } from '../data/examContent'
import { hashSeed, seededPermutation } from './exam-shuffle'
import { chuanChuyenDe } from './goi-len-bang'

export type MucDoRut = 'biet' | 'hieu' | 'van_dung'
export type PhanDe = 'I' | 'II' | 'III'

export const PHAN_DE: PhanDe[] = ['I', 'II', 'III']
export const TEN_MUC: Record<MucDoRut, string> = { biet: 'Biết', hieu: 'Hiểu', van_dung: 'Vận dụng' }
export const MOI_MUC: MucDoRut[] = ['biet', 'hieu', 'van_dung']

export interface SoCauPhan {
  I: number
  II: number
  III: number
}

/** Một câu trong kho, đã rút gọn còn đúng những gì màn rút đề cần hiện. */
export interface CauUngVien {
  phan: PhanDe
  id: string
  maDe: string
  /** Số thứ tự trong đề gốc — để thầy đối chiếu với file đề trên máy. */
  soGoc: number
  chuyenDe: string
  mucDo: MucDoRut | ''
  text: string
  coHinh: boolean
  /** Câu pipeline tự đánh dấu cần thầy xem lại. */
  canXem: boolean
  /** Sao cần chữa (0/1/2) — câu chưa gắn tính 0. */
  sao: 0 | 1 | 2
  /** Vì sao câu này đáng chữa — thầy đọc để quyết có đưa vào đề không. */
  lyDoSao: string
}

export interface YeuCauRut {
  soCau: SoCauPhan
  /** Tên chuyên đề được phép lấy. Rỗng = mọi chuyên đề. */
  chuyenDe: string[]
  /** Mức độ được phép lấy. Rỗng = mọi mức (kể cả câu chưa gắn mức). */
  mucDo: MucDoRut[]
  /** Câu đã ra ở các ca trước — bị đẩy xuống cuối, không bị cấm. */
  tranhQid?: string[]
  /** Đổi seed là ra bộ câu khác — nút "Trộn lại". */
  seed: number
}

export interface KetQuaRut {
  chon: Record<PhanDe, CauUngVien[]>
  /** Thiếu bao nhiêu câu so với số thầy đặt (kho không đủ câu hợp lọc). */
  thieu: SoCauPhan
  /** Trong số đã rút, bao nhiêu câu từng ra ở ca trước. */
  lapLai: number
  /** Còn bao nhiêu câu hợp lọc chưa dùng — để nút "đổi câu" biết còn đổi được. */
  conLai: SoCauPhan
}

function coHinhCua(q: { thanCauImg?: string; choiceImgs?: (string | undefined)[]; ideaImgs?: (string | undefined)[]; hinhAnh?: unknown[]; imageDataUrl?: string }): boolean {
  return Boolean(q.thanCauImg || q.imageDataUrl || (q.hinhAnh && q.hinhAnh.length > 0) || q.choiceImgs?.some(Boolean) || q.ideaImgs?.some(Boolean))
}

function mucCua(v: unknown): MucDoRut | '' {
  return v === 'biet' || v === 'hieu' || v === 'van_dung' ? v : ''
}

/** Dàn cả kho đã chọn thành ba danh sách ứng viên phẳng, giữ nguyên thứ tự đề gốc. */
export function dungUngVien(sources: TeacherExamSource[]): Record<PhanDe, CauUngVien[]> {
  const ra: Record<PhanDe, CauUngVien[]> = { I: [], II: [], III: [] }
  for (const s of sources) {
    const day: [PhanDe, (TeacherMcqQuestion | TeacherTrueFalseQuestion | TeacherShortAnswerQuestion)[]][] = [
      ['I', s.phanI],
      ['II', s.phanII],
      ['III', s.phanIII],
    ]
    for (const [phan, ds] of day) {
      ds.forEach((q, i) => {
        ra[phan].push({
          phan,
          id: q.id,
          maDe: s.maDe,
          soGoc: i + 1,
          chuyenDe: (q.chuyenDe || '').trim(),
          mucDo: mucCua(q.mucDo),
          text: q.text || '',
          coHinh: coHinhCua(q),
          canXem: Boolean(q.canXem),
          sao: soSao(q),
          lyDoSao: q.canChua?.ly_do || '',
        })
      })
    }
  }
  return ra
}

/** Chuyên đề có trong kho đã chọn, kèm số câu — để dựng chip lọc. */
export function dsChuyenDe(uv: Record<PhanDe, CauUngVien[]>): { ten: string; soCau: number }[] {
  const dem = new Map<string, { ten: string; soCau: number }>()
  for (const p of PHAN_DE) {
    for (const c of uv[p]) {
      const khoa = chuanChuyenDe(c.chuyenDe)
      const cu = dem.get(khoa)
      if (cu) cu.soCau += 1
      else dem.set(khoa, { ten: c.chuyenDe || '(chưa gắn chuyên đề)', soCau: 1 })
    }
  }
  return [...dem.values()].sort((a, b) => b.soCau - a.soCau || a.ten.localeCompare(b.ten, 'vi'))
}

/** Số câu từng mức độ trong kho đã chọn (khoá '' = câu chưa gắn mức). */
export function demMucDo(uv: Record<PhanDe, CauUngVien[]>): Record<MucDoRut | '', number> {
  const ra: Record<MucDoRut | '', number> = { biet: 0, hieu: 0, van_dung: 0, '': 0 }
  for (const p of PHAN_DE) for (const c of uv[p]) ra[c.mucDo] += 1
  return ra
}

/** Câu hợp bộ lọc chuyên đề + mức độ. Lọc rỗng = nhận hết. */
export function locTheoYeuCau(ds: CauUngVien[], yc: Pick<YeuCauRut, 'chuyenDe' | 'mucDo'>): CauUngVien[] {
  const cd = new Set(yc.chuyenDe.map(chuanChuyenDe).filter(Boolean))
  const md = new Set(yc.mucDo)
  return ds.filter((c) => (cd.size === 0 || cd.has(chuanChuyenDe(c.chuyenDe))) && (md.size === 0 || (c.mucDo !== '' && md.has(c.mucDo))))
}

/** Lấy dần từng câu: mỗi lượt chọn câu thuộc chuyên đề đang ít nhất, rồi mức độ
 * đang ít nhất, rồi câu chưa từng ra, cuối cùng mới tới thứ tự ngẫu nhiên có
 * seed. Trả về ĐÚNG số lấy được, thiếu thì trả ít hơn để chỗ gọi báo ra. */
function chonDan(ds: CauUngVien[], can: number, tranh: Set<string>, seed: number, daCo: CauUngVien[], cam: Set<string>): CauUngVien[] {
  const chon = [...daCo]
  if (can <= chon.length) return chon.slice(0, Math.max(0, can))

  const perm = seededPermutation(ds.length, seed)
  const hang = new Map<string, number>()
  perm.forEach((goc, i) => hang.set(ds[goc].id, i))

  const daLay = new Set(chon.map((c) => c.id))
  const conLai = ds.filter((c) => !daLay.has(c.id) && !cam.has(c.id))
  const demCd = new Map<string, number>()
  const demMd = new Map<string, number>()
  const cong = (c: CauUngVien) => {
    const k = chuanChuyenDe(c.chuyenDe)
    demCd.set(k, (demCd.get(k) ?? 0) + 1)
    demMd.set(c.mucDo, (demMd.get(c.mucDo) ?? 0) + 1)
  }
  chon.forEach(cong)

  // Thứ tự ưu tiên, nhỏ hơn là được lấy trước: chuyên đề đang ít câu nhất →
  // mức độ đang ít câu nhất → câu chưa ra ở ca trước → thứ tự ngẫu nhiên seed.
  const diemCua = (c: CauUngVien): number[] => [demCd.get(chuanChuyenDe(c.chuyenDe)) ?? 0, demMd.get(c.mucDo) ?? 0, tranh.has(c.id) ? 1 : 0, hang.get(c.id) ?? 0]
  const nhoHon = (a: number[], b: number[]): boolean => {
    for (let k = 0; k < a.length; k++) if (a[k] !== b[k]) return a[k] < b[k]
    return false
  }

  while (chon.length < can && conLai.length > 0) {
    let iTot = 0
    let diemTot = diemCua(conLai[0])
    for (let i = 1; i < conLai.length; i++) {
      const diem = diemCua(conLai[i])
      if (nhoHon(diem, diemTot)) {
        diemTot = diem
        iTot = i
      }
    }
    const lay = conLai.splice(iTot, 1)[0]
    chon.push(lay)
    cong(lay)
  }
  return chon
}

export function rutDe(uv: Record<PhanDe, CauUngVien[]>, yc: YeuCauRut): KetQuaRut {
  const tranh = new Set(yc.tranhQid ?? [])
  const chon = { I: [], II: [], III: [] } as Record<PhanDe, CauUngVien[]>
  const thieu = { I: 0, II: 0, III: 0 }
  const conLai = { I: 0, II: 0, III: 0 }
  let lapLai = 0
  for (const p of PHAN_DE) {
    const hop = locTheoYeuCau(uv[p], yc)
    const can = Math.max(0, Math.floor(Number(yc.soCau[p]) || 0))
    const c = chonDan(hop, can, tranh, hashSeed(`${yc.seed}:${p}`), [], new Set())
    chon[p] = c
    thieu[p] = Math.max(0, can - c.length)
    conLai[p] = hop.length - c.length
    lapLai += c.filter((x) => tranh.has(x.id)).length
  }
  return { chon, thieu, lapLai, conLai }
}

/** Đổi một câu đã rút lấy câu khác, giữ nguyên các câu còn lại. Câu bị bỏ ra
 * KHÔNG quay lại trong lượt đổi này (`cam`), kẻo bấm đổi mà vẫn ra câu cũ. */
export function doiMotCau(uv: Record<PhanDe, CauUngVien[]>, yc: YeuCauRut, kq: KetQuaRut, phan: PhanDe, id: string, camThem: string[] = []): KetQuaRut {
  const giu = kq.chon[phan].filter((c) => c.id !== id)
  if (giu.length === kq.chon[phan].length) return kq
  const hop = locTheoYeuCau(uv[phan], yc)
  const can = kq.chon[phan].length
  const cam = new Set([id, ...camThem])
  const moi = chonDan(hop, can, new Set(yc.tranhQid ?? []), hashSeed(`${yc.seed}:${phan}:doi:${id}`), giu, cam)
  const tranh = new Set(yc.tranhQid ?? [])
  const chon = { ...kq.chon, [phan]: moi }
  let lapLai = 0
  for (const p of PHAN_DE) lapLai += chon[p].filter((x) => tranh.has(x.id)).length
  return {
    chon,
    thieu: { ...kq.thieu, [phan]: Math.max(0, can - moi.length) },
    conLai: { ...kq.conLai, [phan]: hop.length - moi.length },
    lapLai,
  }
}

/** Bỏ hẳn một câu khỏi bộ đã rút (không lấy câu thay). */
export function boMotCau(kq: KetQuaRut, phan: PhanDe, id: string): KetQuaRut {
  const giu = kq.chon[phan].filter((c) => c.id !== id)
  if (giu.length === kq.chon[phan].length) return kq
  return { ...kq, chon: { ...kq.chon, [phan]: giu }, conLai: { ...kq.conLai, [phan]: kq.conLai[phan] + 1 } }
}

/** Cắt kho đề xuống còn đúng những câu đã rút — giữ nguyên dạng
 * TeacherExamSource để `mergeAndStrip` / `mergeKeepAnswers` dùng lại y nguyên,
 * không phải viết đường publish thứ hai. Đề không còn câu nào thì bỏ khỏi danh
 * sách. */
export function locNguonTheoId(sources: TeacherExamSource[], ids: Set<string>): TeacherExamSource[] {
  return sources
    .map((s) => ({ ...s, phanI: s.phanI.filter((q) => ids.has(q.id)), phanII: s.phanII.filter((q) => ids.has(q.id)), phanIII: s.phanIII.filter((q) => ids.has(q.id)) }))
    .filter((s) => s.phanI.length + s.phanII.length + s.phanIII.length > 0)
}

/** Ca đã mở, để tính câu nào THẬT SỰ đã ra. */
export interface CaDaMo {
  maCa: string
  sources: TeacherExamSource[]
  /** Số câu mỗi phần của ca (chỉ ca mở bằng màn Rút đề mới có). */
  soCau?: SoCauPhan | null
}

/** Số câu mỗi phần của ca mở TRƯỚC màn Rút đề — hằng số cũ trong exam-assign. */
const CU_18_4_6: SoCauPhan = { I: 18, II: 4, III: 6 }

/** Câu đã ra ở các ca trước, để rút đề tránh phát lại.
 *
 * KHÔNG lấy bừa mọi câu trong bản đề đã lưu của mỗi ca. Ca mở TRƯỚC màn Rút đề
 * lưu cả kho (đề `12-C1-B1` là 147 câu) trong khi mỗi em chỉ làm 18/4/6 câu
 * random riêng — coi cả 147 câu là "đã ra" thì lần rút nào cũng báo lặp lại
 * toàn bộ, tức là cái cờ mất hết ý nghĩa. Đã thấy đúng cảnh này trên máy thầy
 * ngày 04-09.
 *
 * Luật: ca có `soCau` (mở bằng màn Rút đề) thì bản lưu CHÍNH LÀ bộ đã ra, tính
 * hết. Ca cũ chỉ tính khi số câu từng phần không vượt 18/4/6 — khi đó mọi em
 * nhận trọn đề nên chắc chắn câu nào cũng đã ra. Ca cũ có kho lớn hơn thì
 * KHÔNG đoán em nào làm câu nào, bỏ qua cả ca. */
export function qidDaRaTuCacCa(ds: CaDaMo[]): string[] {
  const ra = new Set<string>()
  for (const ca of ds) {
    const so = { I: 0, II: 0, III: 0 }
    for (const s of ca.sources) {
      so.I += s.phanI.length
      so.II += s.phanII.length
      so.III += s.phanIII.length
    }
    const chacChan = ca.soCau ? true : PHAN_DE.every((p) => so[p] <= CU_18_4_6[p])
    if (!chacChan) continue
    for (const s of ca.sources) for (const q of [...s.phanI, ...s.phanII, ...s.phanIII]) ra.add(q.id)
  }
  return [...ra]
}

export function moiIdDaRut(kq: KetQuaRut): Set<string> {
  return new Set(PHAN_DE.flatMap((p) => kq.chon[p].map((c) => c.id)))
}

export function soCauCua(kq: KetQuaRut): SoCauPhan {
  return { I: kq.chon.I.length, II: kq.chon.II.length, III: kq.chon.III.length }
}

export function tongCau(s: SoCauPhan): number {
  return s.I + s.II + s.III
}
