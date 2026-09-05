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

// ===========================================================================
// RÚT ĐỀ CHO BUỔI CHỮA BÀI — "Phân công lên bảng" (thầy chốt 05/09 chiều).
//
// Khác hẳn rút đề thường ở MỤC ĐÍCH: ca này mở ra không phải để lấy điểm mà để
// biết cả lớp hổng chỗ nào, rồi chia câu cho từng em lên bảng. Ba hệ quả bắt
// buộc, sai một cái là buổi chữa hỏng:
//
//  1. CẢ LỚP CÙNG MỘT ĐỀ. `doChum` (bao nhiêu em cùng sai một kiểu) và
//     `tiLeDung` chỉ tính được khi nhiều em cùng làm MỘT câu. Mỗi em một bộ
//     riêng là mất sạch hai chỉ số đó, mà đó chính là thứ quyết định câu nào
//     giảng cả lớp thay vì gọi lên bảng.
//
//  2. ƯU TIÊN CÂU CÓ SAO. Sao cần chữa do pipeline chấm sẵn trong kho: câu 2
//     sao là câu nền, sai là hổng gốc. Chữa câu 2 sao đáng hơn câu 0 sao.
//
//  3. PHỦ NHIỀU CHUYÊN ĐỀ. Dồn 9 câu vào một chuyên đề thì đo được đúng một
//     chỗ. Nên chuyên đề đang ít câu nhất được lấy trước, TRONG chuyên đề đó
//     mới tới sao cao nhất.
//
// SỐ CÂU tính theo NGÂN SÁCH GIÂY của ca, không phải con số cố định: thầy đặt
// ca 15 phút thì ra 9 câu, đặt 45 phút thì ra gần ba chục. Giây mỗi câu lấy
// theo cỡ thật một câu THPT.
// ===========================================================================

/** Giây trung bình một câu mỗi phần — đo trên đề thật, dùng để chia ngân sách. */
export const GIAY_MOI_CAU: Record<PhanDe, number> = { I: 60, II: 150, III: 180 }

/** TRẦN CỨNG 15 PHÚT (thầy chốt 05/09 chiều). Ca chẩn đoán dài hơn là ăn mất
 * giờ chữa bài: khung buổi 120 phút chỉ dành 15 phút đầu cho việc lấy dữ liệu.
 * Thầy đặt ca ngắn hơn thì lấy con số ngắn hơn, dài hơn thì vẫn cắt ở 15. */
export const PHUT_TOI_DA_LEN_BANG = 15

/** Trần SỐ CÂU mỗi phần. Phần II trần 3: bốn ý một câu, quá ba câu là em ngồi
 * đọc suốt buổi chẩn đoán. Phần III trần 1: đắt nhất (180s) mà chỉ một tín
 * hiệu — giữ đúng một câu để có thứ cho em lên bảng trình bày lời giải. */
export const TRAN_CAU_LEN_BANG: Record<PhanDe, number> = { I: 15, II: 3, III: 1 }

/** Dưới mức này thì BỎ Phần III: 180 giây cho một tín hiệu là quá đắt khi
 * ngân sách hẹp, đổi sang Phần II được 4 tín hiệu trên 150 giây. */
export const NGUONG_CO_PHAN_III = 600

/** Bộ câu để CHỮA rộng gấp mấy lần bộ em làm. Bốn lượt gọi lên bảng, mỗi lượt
 * vài em, nên chỉ 8 câu em làm là hết câu ngay lượt hai. Câu chữa thêm KHÔNG
 * vào đề em làm (đề vẫn đúng 15 phút) — nó chỉ nằm trong danh sách chữa. */
export const HE_SO_KHO_CHUA = 4
export const TRAN_KHO_CHUA = 40

export interface YeuCauLenBang {
  /** Thời lượng làm bài của ca, phút. Cắt trần ở PHUT_TOI_DA_LEN_BANG. */
  phut: number
  tranhQid?: string[]
  seed: number
}

/** Ngân sách giây thật sự dùng — đã cắt trần 15 phút. */
export function giayNganSach(phut: number): number {
  return Math.min(Math.max(0, Math.floor(Number(phut) || 0)), PHUT_TOI_DA_LEN_BANG) * 60
}

/** SỐ CÂU mỗi phần cho buổi chữa bài.
 *
 * Xếp theo TÍN HIỆU TRÊN MỖI GIÂY, vì mục đích số một là đọc ra hồ sơ mạnh/yếu
 * của em trong 15 phút:
 *   Phần II  4 tín hiệu / 150s = 0,027 — dày nhất, lấy trước
 *   Phần I   1 tín hiệu /  60s = 0,017
 *   Phần III 1 tín hiệu / 180s = 0,006 — rẻ nhất về tín hiệu
 *
 * Nhưng KHÔNG xếp thuần theo con số đó: Phần III giữ đúng một câu (khi ngân
 * sách ≥ 10 phút) vì mục đích số hai là gọi em lên bảng, mà câu đáng đứng bảng
 * trình bày là câu trả lời ngắn chứ không phải câu bốn phương án.
 *
 * Thứ tự lấy: một câu Phần III → Phần II tới trần → Phần I lấp phần còn lại. */
export function soCauLenBang(uv: Record<PhanDe, CauUngVien[]>, phut: number): SoCauPhan {
  let con = giayNganSach(phut)
  const ra: SoCauPhan = { I: 0, II: 0, III: 0 }

  if (con >= NGUONG_CO_PHAN_III && uv.III.length > 0 && con >= GIAY_MOI_CAU.III) {
    ra.III = 1
    con -= GIAY_MOI_CAU.III
  }
  ra.II = Math.min(TRAN_CAU_LEN_BANG.II, uv.II.length, Math.floor(con / GIAY_MOI_CAU.II))
  con -= ra.II * GIAY_MOI_CAU.II
  ra.I = Math.min(TRAN_CAU_LEN_BANG.I, uv.I.length, Math.floor(con / GIAY_MOI_CAU.I))
  con -= ra.I * GIAY_MOI_CAU.I

  // Kho không có Phần I (thầy chỉ tích dạng đúng sai chẳng hạn) thì phần giây
  // thừa quay lại cho Phần II và III, chứ không bỏ phí nửa ca.
  if (con >= GIAY_MOI_CAU.II && ra.II < uv.II.length) {
    const them = Math.min(uv.II.length - ra.II, Math.floor(con / GIAY_MOI_CAU.II))
    ra.II += them
    con -= them * GIAY_MOI_CAU.II
  }
  if (con >= GIAY_MOI_CAU.III && ra.III < uv.III.length) {
    const them = Math.min(uv.III.length - ra.III, Math.floor(con / GIAY_MOI_CAU.III))
    ra.III += them
    con -= them * GIAY_MOI_CAU.III
  }
  return ra
}

/** Tổng giây ước tính của bộ câu — hiện lên màn để thầy so với thời lượng ca. */
export function giayUocTinh(s: SoCauPhan): number {
  return PHAN_DE.reduce((t, p) => t + s[p] * GIAY_MOI_CAU[p], 0)
}

/** Số TÍN HIỆU chẩn đoán: một câu Phần II có bốn ý nên đáng bốn tín hiệu, các
 * phần khác một. Nhiều tín hiệu = đọc ra hồ sơ em rõ hơn trong cùng số phút. */
export function soTinHieu(s: SoCauPhan): number {
  return s.I + s.II * 4 + s.III
}

/** Lấy n câu của MỘT phần cho buổi chữa bài.
 *
 * Khoá xếp, nhỏ hơn là lấy trước:
 *   1. chuyên đề đang ít câu nhất trong bộ đang chọn — phủ rộng trước;
 *   2. sao cao nhất (đảo dấu) — trong chuyên đề đó lấy câu đáng chữa nhất;
 *   3. câu `canXem` (pipeline nghi đáp án sai) xuống cuối — đưa câu nghi ngờ
 *      lên bảng chữa là thầy sai trước cả lớp;
 *   4. câu chưa ra ở ca trước;
 *   5. thứ tự ngẫu nhiên có seed — nút "Trộn lại" đổi seed là ra bộ khác. */
function chonChuaBai(ds: CauUngVien[], can: number, tranh: Set<string>, seed: number): CauUngVien[] {
  if (can <= 0 || ds.length === 0) return []
  const perm = seededPermutation(ds.length, seed)
  const hang = new Map<string, number>()
  perm.forEach((goc, i) => hang.set(ds[goc].id, i))

  const chon: CauUngVien[] = []
  const conLai = [...ds]
  const demCd = new Map<string, number>()

  const diemCua = (c: CauUngVien): number[] => [demCd.get(chuanChuyenDe(c.chuyenDe)) ?? 0, -c.sao, c.canXem ? 1 : 0, tranh.has(c.id) ? 1 : 0, hang.get(c.id) ?? 0]
  const nhoHon = (a: number[], b: number[]): boolean => {
    for (let k = 0; k < a.length; k++) if (a[k] !== b[k]) return a[k] < b[k]
    return false
  }

  while (chon.length < can && conLai.length > 0) {
    let iTot = 0
    let diemTot = diemCua(conLai[0])
    for (let i = 1; i < conLai.length; i++) {
      const d = diemCua(conLai[i])
      if (nhoHon(d, diemTot)) {
        diemTot = d
        iTot = i
      }
    }
    const lay = conLai.splice(iTot, 1)[0]
    chon.push(lay)
    const k = chuanChuyenDe(lay.chuyenDe)
    demCd.set(k, (demCd.get(k) ?? 0) + 1)
  }
  return chon
}

/** RÚT BỘ CÂU CHO BUỔI CHỮA BÀI. Máy tự chọn hết — thầy chỉ tích kho và đặt
 * thời lượng ca. Không lọc chuyên đề/mức độ: buổi chẩn đoán mà chặn sẵn chuyên
 * đề thì chỉ đo lại đúng chỗ thầy đã đoán, không phát hiện được chỗ chưa biết. */
export function rutDeLenBang(uv: Record<PhanDe, CauUngVien[]>, yc: YeuCauLenBang): KetQuaRut {
  const tranh = new Set(yc.tranhQid ?? [])
  const can = soCauLenBang(uv, yc.phut)
  const chon = { I: [], II: [], III: [] } as Record<PhanDe, CauUngVien[]>
  const thieu = { I: 0, II: 0, III: 0 }
  const conLai = { I: 0, II: 0, III: 0 }
  let lapLai = 0
  for (const p of PHAN_DE) {
    const c = chonChuaBai(uv[p], can[p], tranh, hashSeed(`${yc.seed}:lenbang:${p}`))
    chon[p] = c
    thieu[p] = Math.max(0, can[p] - c.length)
    conLai[p] = uv[p].length - c.length
    lapLai += c.filter((x) => tranh.has(x.id)).length
  }
  return { chon, thieu, lapLai, conLai }
}

/** KHO CHỮA: bộ câu rộng hơn bộ em làm, dùng ở màn Gọi lên bảng.
 *
 * Vì sao phải có: đề em làm gói trong 15 phút nên chỉ 8 câu. Bỏ ra câu cả lớp
 * cùng sai (giảng cả lớp) và câu cả lớp làm đúng (chỉ đọc đáp án) thì còn 5–6
 * câu để chia. Bốn lượt gọi, mỗi lượt vài em, là hết câu ngay lượt hai.
 *
 * Kho chữa lấy thêm câu CÙNG CHUYÊN ĐỀ với bộ em làm, theo đúng luật ưu tiên
 * sao. Câu thêm KHÔNG vào đề em làm — đề vẫn đúng 15 phút, `doChum` và
 * `tiLeDung` vẫn tính trên bộ cả lớp cùng làm. Em nhận câu thêm ở mức ghép 3
 * hoặc 5 ("chưa làm câu này"), đúng như engine phân công đã tính sẵn.
 *
 * Trả về kho chữa ĐÃ GỒM bộ em làm, để chỗ gọi chỉ cần dùng một danh sách. */
export function rutKhoChua(uv: Record<PhanDe, CauUngVien[]>, boLamBai: KetQuaRut, yc: YeuCauLenBang): KetQuaRut {
  const tranh = new Set(yc.tranhQid ?? [])
  const daCo = moiIdDaRut(boLamBai)
  const soLam = soCauCua(boLamBai)
  const tongLam = tongCau(soLam)
  const muonThem = Math.max(0, Math.min(TRAN_KHO_CHUA, tongLam * HE_SO_KHO_CHUA) - tongLam)

  const chon = { I: [...boLamBai.chon.I], II: [...boLamBai.chon.II], III: [...boLamBai.chon.III] } as Record<PhanDe, CauUngVien[]>
  if (muonThem <= 0) return { chon, thieu: { I: 0, II: 0, III: 0 }, lapLai: boLamBai.lapLai, conLai: boLamBai.conLai }

  // Chuyên đề của bộ em làm — chỉ lấy thêm trong đúng những chuyên đề này, kẻo
  // thầy chữa một chuyên đề cả lớp chưa đụng tới buổi nào.
  const cdCanLay = new Set(PHAN_DE.flatMap((p) => chon[p]).map((c) => chuanChuyenDe(c.chuyenDe)))

  // Chia phần thêm theo tỉ lệ bộ em làm, nhưng Phần I gánh phần lẻ: câu Phần I
  // rẻ nhất để đọc và nhiều nhất trong kho.
  const themTheoPhan: SoCauPhan = { I: 0, II: 0, III: 0 }
  let con = muonThem
  for (const p of ['II', 'III'] as PhanDe[]) {
    const n = Math.min(Math.round((muonThem * soLam[p]) / Math.max(1, tongLam)), con)
    themTheoPhan[p] = n
    con -= n
  }
  themTheoPhan.I = con

  for (const p of PHAN_DE) {
    const ungVien = uv[p].filter((c) => !daCo.has(c.id) && (cdCanLay.size === 0 || cdCanLay.has(chuanChuyenDe(c.chuyenDe))))
    const them = chonChuaBai(ungVien, themTheoPhan[p], tranh, hashSeed(`${yc.seed}:khochua:${p}`))
    chon[p] = [...chon[p], ...them]
  }

  return {
    chon,
    thieu: { I: 0, II: 0, III: 0 },
    lapLai: PHAN_DE.reduce((t, p) => t + chon[p].filter((c) => tranh.has(c.id)).length, 0),
    conLai: { I: uv.I.length - chon.I.length, II: uv.II.length - chon.II.length, III: uv.III.length - chon.III.length },
  }
}
