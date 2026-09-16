/**
 * CÂU HỎI LẤY TỪ CHÍNH BÀI LÀM CỦA EM.
 *
 * Thầy chốt 15-09: *"mỗi câu học sinh đã làm đều có nhãn câu cùng dạng. Chỉ cần
 * lấy các câu cùng dạng với các câu học sinh đã làm"*.
 *
 * Nguồn là lệnh `hsCauSai` — đúng lệnh mục Khắc Phục Câu Sai đang gọi. Mỗi câu
 * về kèm `chuyenDe`, `mucDo`, `dang` / `dangMa`, `text`, `choices`, `dapAnDung`,
 * `loiGiai`. Nghĩa là KHÔNG dò từ khoá trong tên ca và KHÔNG đoán chuyên đề:
 * nhãn là nhãn thầy gắn trong kho đề.
 *
 * LUẬT LỌC — câu nào không chơi được thì BỎ và ĐẾM, không im lặng:
 *  · chỉ phần I (trắc nghiệm bốn phương án); phần II đúng/sai và phần III trả
 *    lời ngắn không vào được khung bốn nút của game,
 *  · đủ bốn phương án, không phương án nào rỗng,
 *  · `dapAnDung` phải là một trong A B C D,
 *  · câu có ảnh thì bỏ — màn đấu chỉ có chữ, hiện câu thiếu hình là bẫy em.
 */

import type { BacKho, CauHoi } from './kho-cau-hoi'

/** Hình dạng tối thiểu của một câu sai do `hsCauSai` trả về. */
export interface CauSaiTho {
  qid?: string
  maCa?: string
  tenCa?: string
  phan?: string
  soCau?: number
  chuyenDe?: string
  mucDo?: string
  dapAnDung?: string
  dapAnChon?: string
  text?: string
  choices?: string[]
  ideas?: string[]
  loiGiai?: string
  dang?: string | { ma?: string; ten?: string }
  dangMa?: string
  imageDataUrl?: string
  hinhAnh?: unknown
  /** Ảnh THÂN CÂU — khác hẳn ảnh từng phương án. */
  thanCauImg?: unknown
  /** Ảnh của từng phương án A B C D, đúng thứ tự. */
  choiceImgs?: unknown[]
  /** Bảng biểu: mảng hàng, mỗi hàng là mảng ô. */
  table?: unknown[]
  /** SỐ SAO thầy gắn trong kho đề (`can_chua.sao`): 0 · 1 · 2. */
  sao?: number
  /** Em làm ĐÚNG câu này hay không. Chỉ có ở lệnh `hsCauDaThi`. */
  dungSai?: boolean
}

/** Một câu sai đã đổi sang khung câu hỏi của game. */
export interface CauHoiCuaEm extends CauHoi {
  /**
   * LỜI GIẢI NGUYÊN BẢN TỪ KHO — chưa đụng vào.
   *
   * Kho ghi lời giải bằng JSON có cấu trúc (`chot`, `tung_pa`, `buoc`…), và bản
   * trước ép thẳng chuỗi ấy vào `giaiThich` rồi in ra màn. Học sinh nhận nguyên
   * một đống `{"chot":"…","tung_pa":{"A":{"dung":false,"vi_sao":"…"}}}`. Nay để
   * nguyên ở đây cho `chuanHoaLoiGiaiCau` đọc và màn hình dựng lại cho tử tế.
   */
  loiGiaiTho: unknown
  /** Em đã chọn gì trong ca thi — để tô đúng phương án em từng sa vào. */
  daChonTruoc: string
  /** Khoá câu trong kho đề — dùng để chỉ thưởng EXP một lần cho mỗi câu. */
  qid: string
  tenCa: string
  soCau: number
  /** Tên dạng thầy gắn; rỗng khi câu chưa gắn dạng. */
  tenDang: string
  maDang: string
  /**
   * SỐ SAO — thang khó DUY NHẤT của tháp từ 15-09.
   *
   * Thầy chốt: *"khó là những câu 2 sao... 2 sao khó nhất, xong đến 1 sao, rồi
   * 0 sao"*. Câu chưa gắn sao thì là 0 — và đó là SỰ THẬT (chưa gắn), không
   * phải mặc định bịa như `bacTheoMucDo` từng làm với mức độ.
   */
  sao: 0 | 1 | 2
  /** Em từng làm SAI câu này chưa. Câu từng sai đáng ôn hơn câu làm đúng. */
  tungSai: boolean
  /** Ảnh thân câu — rỗng nghĩa là câu không có ảnh. */
  anhThanCau: string
  /** Ảnh của từng phương án; phần tử rỗng nghĩa là phương án ấy không có ảnh. */
  anhPhuongAn: string[]
  /** Ảnh chèn giữa bài, giữ nguyên `viTri` thầy đặt. */
  anhXen: AnhXen[]
  /** Bảng biểu của câu; rỗng nghĩa là câu không có bảng. */
  bang: string[][]
  /** Tổng số ký tự đề + bốn phương án — dùng cho luật "tầng cao câu dài hơn". */
  doDai: number
}

/** Một ảnh chèn giữa bài. `viTri` < 0 nghĩa là không rõ chỗ, xếp cuối thân câu. */
export interface AnhXen {
  url: string
  viTri: number
}

export type LyDoBo =
  | 'khongPhaiPhanI'
  | 'thieuPhuongAn'
  | 'dapAnKhongHopLe'
  | 'coAnh'
  | 'thieuDeBai'
  | 'trungQid'

export interface KetQuaDoiCau {
  dsCau: CauHoiCuaEm[]
  /** Số câu bị bỏ, kèm lý do — màn hình phải nói ra, không giấu. */
  soBoQua: number
  lyDoBoQua: Partial<Record<LyDoBo, number>>
  /** Các chuyên đề và dạng em thật sự đã đụng tới. */
  dsChuyenDe: string[]
  dsDang: string[]
}

const CHU_CAI = ['A', 'B', 'C', 'D'] as const

function boDau(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

/**
 * Bậc khó của câu, đọc từ `mucDo` thầy gắn.
 *
 * KHÔNG BỊA: chỉ bốn mức dưới đây là đọc được. Câu chưa gắn mức độ trả về bậc 2
 * — đây là MẶC ĐỊNH, không phải số đọc từ dữ liệu, nên đừng hiểu thành "câu này
 * mức vận dụng".
 */
export function bacTheoMucDo(mucDo: string | undefined): BacKho {
  const m = boDau(String(mucDo ?? ''))
  if (m === '') return 2
  if (m.includes('van dung cao')) return 3
  if (m.includes('van dung')) return 2
  if (m.includes('thong hieu')) return 2
  if (m.includes('nhan biet')) return 1
  return 2
}

/** Tên dạng ở dạng chuỗi, dù máy chủ trả chuỗi hay đối tượng. */
export function tenDangCua(c: CauSaiTho): { ma: string; ten: string } {
  const ma = String(c.dangMa ?? '').trim()
  let ten = ''
  if (typeof c.dang === 'string') ten = c.dang.trim()
  else if (c.dang && typeof c.dang === 'object') {
    ten = String(c.dang.ten ?? '').trim()
  }
  const maPhu = ma || (c.dang && typeof c.dang === 'object' ? String(c.dang.ma ?? '').trim() : '')
  return { ma: maPhu, ten: ten || maPhu }
}

/**
 * Gom ẢNH của một câu về đúng ba chỗ nó thuộc về.
 *
 * Thầy chốt 15-09: *"tất cả các câu có hình ảnh, bảng biểu đều mang vào game
 * được, hiển thị đúng chuẩn cấu trúc"*. Bản trước VỨT THẲNG mọi câu có ảnh —
 * mà ảnh là chỗ nhiều câu hay nhất nằm (đồ thị, sơ đồ phản ứng, bảng số liệu).
 *
 * BA CHỖ KHÁC NHAU, không được gộp — thầy đã bắt đúng lỗi này ngày 14-09 ở màn
 * báo cáo: ảnh thân câu, ảnh từng phương án, và ảnh chèn giữa bài theo `viTri`.
 */
function gomAnh(c: CauSaiTho): { thanCau: string; theoPa: string[]; xen: AnhXen[] } {
  const chuoiAnh = (x: unknown): string => (typeof x === 'string' && x.startsWith('data:') ? x : '')
  const thanCau = chuoiAnh(c.thanCauImg) || chuoiAnh(c.imageDataUrl)
  const theoPa = Array.isArray(c.choiceImgs)
    ? c.choiceImgs.map((x) => chuoiAnh(x))
    : []
  const xen: AnhXen[] = []
  if (Array.isArray(c.hinhAnh)) {
    for (const h of c.hinhAnh) {
      if (typeof h === 'string') { const u = chuoiAnh(h); if (u !== '') xen.push({ url: u, viTri: -1 }) }
      else if (h !== null && typeof h === 'object') {
        const o = h as Record<string, unknown>
        const u = chuoiAnh(o.url ?? o.data ?? o.src ?? o.imageDataUrl)
        if (u !== '') xen.push({ url: u, viTri: Number(o.viTri ?? o.vi_tri ?? -1) })
      }
    }
  } else if (typeof c.hinhAnh === 'string') {
    const u = chuoiAnh(c.hinhAnh)
    if (u !== '') xen.push({ url: u, viTri: -1 })
  }
  return { thanCau, theoPa, xen }
}

/** Bảng biểu về đúng mảng hai chiều; ô rỗng giữ nguyên, không tự điền. */
function gomBang(c: CauSaiTho): string[][] {
  if (!Array.isArray(c.table)) return []
  const ra: string[][] = []
  for (const hang of c.table) {
    if (!Array.isArray(hang)) continue
    ra.push(hang.map((o) => String(o ?? '')))
  }
  return ra.length > 0 && ra.some((h) => h.length > 0) ? ra : []
}

/**
 * Đổi danh sách câu sai của em thành câu chơi được.
 * Hàm THUẦN: không đọc mạng, không đọc localStorage — để còn kiểm bằng vitest.
 */
export function doiCauSaiThanhCauChoi(tho: readonly CauSaiTho[]): KetQuaDoiCau {
  const dsCau: CauHoiCuaEm[] = []
  const lyDo: Partial<Record<LyDoBo, number>> = {}
  const daCo = new Set<string>()
  const chuyenDeSet = new Set<string>()
  const dangSet = new Set<string>()

  const bo = (ly: LyDoBo) => { lyDo[ly] = (lyDo[ly] ?? 0) + 1 }

  for (const c of tho) {
    if (String(c.phan ?? '').trim().toUpperCase() !== 'I') { bo('khongPhaiPhanI'); continue }

    const de = String(c.text ?? '').trim()
    if (de === '') { bo('thieuDeBai'); continue }

    const pa = Array.isArray(c.choices) ? c.choices.map((x) => String(x ?? '').trim()) : []
    if (pa.length !== 4 || pa.some((x) => x === '')) { bo('thieuPhuongAn'); continue }

    const anh = gomAnh(c)
    const dap = String(c.dapAnDung ?? '').trim().toUpperCase()
    const iDung = CHU_CAI.indexOf(dap as 'A' | 'B' | 'C' | 'D')
    if (iDung < 0) { bo('dapAnKhongHopLe'); continue }


    const qid = String(c.qid ?? '').trim()
    const khoa = qid !== '' ? qid : `${String(c.maCa ?? '')}_${String(c.soCau ?? '')}`
    if (daCo.has(khoa)) { bo('trungQid'); continue }
    daCo.add(khoa)

    const dang = tenDangCua(c)
    const chuyenDe = String(c.chuyenDe ?? '').trim() || dang.ten || 'Câu em từng làm sai'
    if (String(c.chuyenDe ?? '').trim() !== '') chuyenDeSet.add(String(c.chuyenDe).trim())
    if (dang.ten !== '') dangSet.add(dang.ten)

    const daChon = String(c.dapAnChon ?? '').trim().toUpperCase()
    // KHÔNG ép lời giải thành chuỗi ở đây. `c.loiGiai` có thể là object hoặc
    // chuỗi JSON; ép sang String là cách sinh ra đống ngoặc nhọn trên màn hình.
    const giaiTho: unknown = c.loiGiai
    const giaiChu = typeof giaiTho === 'string' ? giaiTho.trim() : ''
    const laJson = giaiChu.startsWith('{') && giaiChu.endsWith('}')

    dsCau.push({
      qid: khoa,
      tenCa: String(c.tenCa ?? '').trim() || String(c.maCa ?? '').trim(),
      soCau: Number(c.soCau) || 0,
      tenDang: dang.ten,
      maDang: dang.ma,
      cau: de,
      phuongAn: [pa[0]!, pa[1]!, pa[2]!, pa[3]!],
      dung: iDung as 0 | 1 | 2 | 3,
      loiGiaiTho: giaiTho,
      daChonTruoc: daChon,
      // `giaiThich` chỉ còn là DÒNG DỰ PHÒNG một câu, dùng khi kho không có lời
      // giải. Chuỗi JSON không bao giờ được rơi vào đây.
      giaiThich: (giaiChu !== '' && !laJson)
        ? giaiChu
        : (daChon !== '' && daChon !== dap
            ? `Lần thi trước em chọn ${daChon}, đáp án đúng là ${dap}.`
            : `Đáp án đúng là ${dap}.`),
      chuyenDe,
      bac: bacTheoMucDo(c.mucDo),
      sao: (() => { const n = Math.round(Number(c.sao)); return n === 1 || n === 2 ? n : 0 })(),
      anhThanCau: anh.thanCau,
      anhPhuongAn: anh.theoPa,
      anhXen: anh.xen,
      bang: gomBang(c),
      doDai: de.length + pa.reduce((t, x) => t + x.length, 0),
      // Lệnh cũ `hsCauSai` chỉ trả câu SAI nên thiếu trường này ⇒ coi là đã sai.
      tungSai: c.dungSai === undefined ? true : c.dungSai !== true,
    })
  }

  let soBoQua = 0
  for (const v of Object.values(lyDo)) soBoQua += v ?? 0

  return {
    dsCau,
    soBoQua,
    lyDoBoQua: lyDo,
    dsChuyenDe: Array.from(chuyenDeSet).sort((a, b) => a.localeCompare(b, 'vi')),
    dsDang: Array.from(dangSet).sort((a, b) => a.localeCompare(b, 'vi')),
  }
}

/** Chữ giải thích cho thầy/em vì sao thiếu câu — không giấu con số. */
export const TEN_LY_DO: Record<LyDoBo, string> = {
  khongPhaiPhanI: 'không phải trắc nghiệm 4 phương án',
  thieuPhuongAn: 'thiếu phương án',
  dapAnKhongHopLe: 'đáp án đúng không phải A/B/C/D',
  coAnh: 'câu có hình ảnh',
  thieuDeBai: 'thiếu đề bài',
  trungQid: 'trùng câu',
}

/** Rút các câu đúng bậc của tầng; hết bậc thì lấy cả kho câu của em. */
export function locTheoBac(ds: readonly CauHoiCuaEm[], bac: BacKho): CauHoiCuaEm[] {
  const dung = ds.filter((c) => c.bac === bac)
  return dung.length > 0 ? dung : ds.slice()
}
