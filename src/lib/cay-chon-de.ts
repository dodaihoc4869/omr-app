// CÂY CHỌN ĐỀ — [thư mục →] khối → chương → bài → dạng.
//
// Vì sao có file này: kho 19 bài × 3 dạng là 45 dòng phẳng. Thầy muốn cả
// chương thì phải tích 15 lần, và giữa giờ ra chơi thì không kịp. Tích một ô
// chương là xong.
//
// Mọi luật gom nhóm và ba trạng thái ô tích nằm ở ĐÂY, thuần, có test. Component
// `HopChonDe.tsx` chỉ vẽ. Sai luật gom nhóm thì thầy mở ca thiếu câu mà không
// biết, nên chỗ này phải kiểm được bằng test chứ không bằng nhìn màn hình.
import type { TeacherExamSource } from '../data/examContent'
import { goMaDeTachRa, TEN_PHAN_TACH, type PhanDe } from './tach-phan-de'

export type Tang = 'khoi' | 'thumuc' | 'chuong' | 'bai' | 'dang'
export interface SoCau {
  I: number
  II: number
  III: number
}

export interface Nut {
  /** Đường dẫn duy nhất trong cây — dùng làm key React và khoá gập/mở. */
  khoa: string
  nhan: string
  tang: Tang
  con: Nut[]
  /** Chỉ tầng "dang" (lá) mới có. */
  maDe?: string
  soCau: SoCau
  /** Mọi mã đề nằm dưới nút này, kể cả chính nó nếu là lá. */
  laMa: string[]
}

export const KHONG_CAU: SoCau = { I: 0, II: 0, III: 0 }
export const tongCau = (s: SoCau) => s.I + s.II + s.III
const cong = (a: SoCau, b: SoCau): SoCau => ({ I: a.I + b.I, II: a.II + b.II, III: a.III + b.III })

/** KHỐI của một đề, đọc từ đầu mã đề hoặc đầu nhóm. Không nhận ra thì '' và
 * nhãn là "Chưa rõ khối" — hiện ra chứ không giấu, vì đề bị lạc khối là lỗi
 * nạp đề cần sửa, không phải đề đáng biến mất khỏi danh sách. */
export function khoiCuaDe(c: Pick<TeacherExamSource, 'maDe' | 'nhom'>): string {
  const m = /^(10|11|12)\b/.exec(c.maDe) || /^(10|11|12)\b/.exec(c.nhom || '')
  return m ? m[1] : ''
}

/** Phần sau dấu chấm giữa của `nhom`: "12 · DẠY HỌC/C1 - Ester lipid" → "DẠY
 * HỌC/C1 - Ester lipid". Dùng chung cho thư mục và chương. */
function sauKhoi(c: Pick<TeacherExamSource, 'nhom'>): string {
  const n = (c.nhom || '').trim()
  if (!n) return ''
  const i = n.indexOf('·')
  return (i >= 0 ? n.slice(i + 1) : n).trim()
}

/** THƯ MỤC LỚN — phần trước dấu "/" trong tên nhóm, vd "DẠY HỌC/C1 - Ester
 * lipid" → "DẠY HỌC".
 *
 * Vì sao có tầng này: lô bài dạy thêm trải khắp ba khối và mười mấy chương.
 * Không có thư mục thì mỗi chương thành một dòng nằm lẫn với chương của đề
 * kiểm tra, cây dài ra và thầy phải dò từng dòng. Nay cả lô gom đúng MỘT dòng,
 * y như thư mục gốc trên ổ cứng.
 *
 * Nhóm không có dấu "/" trả chuỗi rỗng — chương của nó nằm thẳng dưới khối như
 * cũ, không sinh thêm tầng rỗng. */
export function thuMucCuaDe(c: Pick<TeacherExamSource, 'nhom'>): string {
  const s = sauKhoi(c)
  const i = s.indexOf('/')
  return i >= 0 ? s.slice(0, i).trim() : ''
}

/** CHƯƠNG lấy từ `nhom` dạng "12 · C1 - Ester lipid" — bỏ phần khối phía trước
 * dấu chấm giữa, và bỏ luôn phần thư mục phía trước dấu "/". Nhóm rỗng thì gom
 * vào "Chưa xếp chương". */
export function chuongCuaDe(c: Pick<TeacherExamSource, 'nhom'>): string {
  const s = sauKhoi(c)
  const i = s.indexOf('/')
  return (i >= 0 ? s.slice(i + 1) : s).trim()
}

/** Tên bài hiện cho thầy đọc: ưu tiên `nguon` (vd "Bài 4. Glucose và
 * fructose"), thiếu thì lấy mã gốc. Cắt phần chú thích dài sau dấu " — ". */
export function tenBai(c: Pick<TeacherExamSource, 'maDe' | 'nguon'>): string {
  const n = (c.nguon || '').split(' — ')[0].trim()
  return n || goMaDeTachRa(c.maDe).goc
}

const soCauCua = (s: TeacherExamSource): SoCau => ({ I: s.phanI.length, II: s.phanII.length, III: s.phanIII.length })

/** Đuôi phân biệt hai đề CÙNG MỘT BÀI: kho cắt bài quá 150 câu thành
 * `...-D1`, `...-D2`. Trả 'D1' / 'D2'; mã không có đuôi ấy thì trả nguyên mã.
 *
 * Chỉ dùng khi trong một bài có nhiều hơn một mã gốc — bài chỉ có một mã thì
 * không cần bày đuôi ra cho rối. */
export function duoiPhanBiet(goc: string): string {
  const m = /-(D\d+)$/.exec(goc)
  return m ? m[1] : goc
}

/** Gom một danh sách theo khoá, GIỮ THỨ TỰ xuất hiện đầu tiên. Sắp lại theo
 * alphabet sẽ đảo thứ tự bài trong chương (Bài 10 lên trước Bài 8). */
function gom<T>(ds: T[], khoa: (x: T) => string): { khoa: string; ds: T[] }[] {
  const map = new Map<string, T[]>()
  for (const x of ds) {
    const k = khoa(x)
    const cu = map.get(k)
    if (cu) cu.push(x)
    else map.set(k, [x])
  }
  return [...map].map(([k, v]) => ({ khoa: k, ds: v }))
}

function nutCha(khoa: string, nhan: string, tang: Tang, con: Nut[]): Nut {
  return { khoa, nhan, tang, con, soCau: con.reduce((s, c) => cong(s, c.soCau), KHONG_CAU), laMa: con.flatMap((c) => c.laMa) }
}

/**
 * Dựng cây từ danh sách đề ĐÃ TÁCH THEO PHẦN (`tachNhieuTheoPhan`):
 * [thư mục →] khối → chương → bài → dạng. Thư mục chỉ có khi nhóm ghi "/".
 *
 * Đề chưa tách (chỉ có một phần sẵn) vẫn thành một nút lá tầng "dang", nhãn
 * lấy theo phần thực có — không sinh nút rỗng.
 */
export function dungCay(ds: TeacherExamSource[]): Nut[] {
  // Dựng các nút CHƯƠNG của một danh sách đề, dưới một tiền tố khoá cho trước.
  const dungChuong = (dsX: TeacherExamSource[], tienTo: string): Nut[] =>
    gom(dsX, chuongCuaDe).map(({ khoa: ch, ds: dsC }) => {
      // GOM THEO TÊN BÀI, không theo mã đề.
      //
      // Bản cũ gom bằng `goMaDeTachRa(maDe).goc`, đúng khi mỗi bài chỉ có đúng
      // một mã đề. Từ 09/09 kho cắt bài quá 150 câu thành `12-C2-B4-D1` và
      // `-D2` — hai mã gốc khác nhau nên bài "Glucose và fructose" hiện ra HAI
      // dòng trùng tên, thầy phải tích hai lần và tưởng kho có đề trùng.
      // Nay một bài đúng một nhánh; các mã của nó nằm dưới tầng lá.
      const bai = gom(dsC, (c) => tenBai(c)).map(({ khoa: b, ds: dsB }) => {
        // Bài có nhiều mã gốc thì lá phải nói rõ mã nào, không thì thầy thấy
        // hai dòng "Trắc nghiệm" y hệt nhau mà không biết khác gì.
        const nhieuMa = new Set(dsB.map((c) => goMaDeTachRa(c.maDe).goc)).size > 1
        const dang: Nut[] = dsB.map((c) => {
          const { goc, phan } = goMaDeTachRa(c.maDe)
          const sc = soCauCua(c)
          const tuCau: PhanDe | null = phan ?? (sc.I > 0 ? 'I' : sc.II > 0 ? 'II' : sc.III > 0 ? 'III' : null)
          const ten = tuCau ? TEN_PHAN_TACH[tuCau] : c.maDe
          return {
            khoa: `${tienTo}/${ch}/${b}/${c.maDe}`,
            nhan: nhieuMa ? `${ten} · ${duoiPhanBiet(goc)}` : ten,
            tang: 'dang' as const,
            con: [],
            maDe: c.maDe,
            soCau: sc,
            laMa: [c.maDe],
          }
        })
        return nutCha(`${tienTo}/${ch}/${b}`, b, 'bai', dang)
      })
      return nutCha(`${tienTo}/${ch}`, ch || 'Chưa xếp chương', 'chuong', bai)
    })

  // Các nút KHỐI của một danh sách đề.
  const dungKhoi = (dsX: TeacherExamSource[], tienTo: string): Nut[] =>
    gom(dsX, khoiCuaDe).map(({ khoa: k, ds: dsK }) => {
      const goc = tienTo ? `${tienTo}/${k || '?'}` : k || '?'
      return nutCha(goc, k ? `Khối ${k}` : 'Chưa rõ khối', 'khoi', dungChuong(dsK, goc))
    })

  // TẦNG THƯ MỤC đứng NGOÀI khối, ngang hàng với "Khối 10/11/12" — đúng cây
  // thư mục gốc trên ổ cứng: DẠY HỌC ▸ 10 / 11 / 12 ▸ chương ▸ bài.
  //
  // Vì sao: lô bài dạy thêm trải khắp ba khối và mười mấy chương. Để lẫn thì
  // mỗi chương thành một dòng nằm xen với chương của đề kiểm tra, cây dài ra và
  // thầy phải dò từng dòng. Nay cả lô gom đúng MỘT dòng.
  //
  // Nhóm không ghi dấu "/" thì khối của nó vẫn nằm ở tầng ngoài cùng như cũ,
  // không sinh thêm tầng rỗng.
  return gom(ds, thuMucCuaDe).flatMap(({ khoa: tm, ds: dsT }) =>
    tm ? [nutCha(tm, tm, 'thumuc', dungKhoi(dsT, tm))] : dungKhoi(dsT, ''),
  )
}

export type TrangThaiTich = 'trong' | 'day' | 'nua'

/** Ba trạng thái ô tích. Nút không có lá nào (không xảy ra với cây dựng ở
 * trên, nhưng giữ cho chắc) coi như trống. */
export function trangThaiTich(n: Nut, daChon: Set<string>): TrangThaiTich {
  if (n.laMa.length === 0) return 'trong'
  let co = 0
  for (const m of n.laMa) if (daChon.has(m)) co++
  return co === 0 ? 'trong' : co === n.laMa.length ? 'day' : 'nua'
}

/** Bấm vào ô tích một nút: đang đầy thì bỏ hết con, còn lại (trống hoặc nửa)
 * thì chọn hết con. Trả về Set MỚI, không sửa Set cũ. */
export function bamTich(n: Nut, daChon: Set<string>): Set<string> {
  const ra = new Set(daChon)
  if (trangThaiTich(n, daChon) === 'day') for (const m of n.laMa) ra.delete(m)
  else for (const m of n.laMa) ra.add(m)
  return ra
}

/** Tổng số câu của những mã ĐANG CHỌN trong cây. Đếm từ lá nên không cộng
 * trùng khi thầy tích cả chương lẫn một bài trong chương đó. */
export function tongDaChon(cay: Nut[], daChon: Set<string>): SoCau {
  let ra = KHONG_CAU
  const di = (ds: Nut[]) => {
    for (const n of ds) {
      if (n.maDe) {
        if (daChon.has(n.maDe)) ra = cong(ra, n.soCau)
      } else di(n.con)
    }
  }
  di(cay)
  return ra
}

const bo = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim()

/**
 * Lọc cây theo chữ thầy gõ. Nút khớp thì giữ NGUYÊN cả nhánh con của nó (gõ
 * "Carbohydrate" là muốn thấy đủ bài trong chương ấy); nút không khớp mà có con
 * khớp thì giữ lại đúng những con khớp.
 *
 * Trả kèm `moKhoa` — danh sách khoá phải tự mở, để thầy gõ xong nhìn thấy ngay
 * kết quả chứ không phải bấm mở từng tầng.
 */
export function locCay(cay: Nut[], tim: string): { cay: Nut[]; moKhoa: string[] } {
  const q = bo(tim)
  if (!q) return { cay, moKhoa: [] }
  const moKhoa: string[] = []
  const di = (ds: Nut[]): Nut[] => {
    const ra: Nut[] = []
    for (const n of ds) {
      const khop = bo(n.nhan).includes(q) || (n.maDe ? bo(n.maDe).includes(q) : false)
      if (khop) {
        ra.push(n)
        if (n.con.length > 0) moKhoa.push(n.khoa)
        continue
      }
      const con = di(n.con)
      if (con.length > 0) {
        moKhoa.push(n.khoa)
        ra.push({ ...n, con })
      }
    }
    return ra
  }
  const loc = di(cay)
  return { cay: loc, moKhoa }
}

/** Mọi mã đề trong cây — cho nút "Chọn tất cả đang lọc". */
export function moiMaTrongCay(cay: Nut[]): string[] {
  return cay.flatMap((n) => n.laMa)
}
