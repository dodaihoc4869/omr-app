// CẤM RÚT CÂU TỰ LUẬN — MỘT ĐỊNH NGHĨA DÙNG CHUNG (Code 1, 21/09/2026). Đề bài: `prompt-cam-rut-tu-luan.md` (thầy lệnh: "tuyệt đối không rút câu tự luận, chỉ rút trắc nghiệm,
// đúng sai, trả lời ngắn — ở mọi chỗ rút đề của cả 3 app, TRỪ màn Gọi lên bảng").
//
// THUẦN: không IO, không import, không đồng hồ, không ngẫu nhiên — máy chủ, máy thầy, máy học sinh/phụ huynh cùng import.
// `laCauTuLuan(c)` ⇒ true khi câu KHÔNG chấm tự động được như trắc nghiệm / đúng-sai / trả lời ngắn. `laCauRutDuoc(c) = !laCauTuLuan(c)`.
//
// ĐỌC MỌI KHUÔN CÂU (một hàm nhận cả bốn, không phải chuyển đổi trước):
//   • tờ kho thô R2:            { phan, so, de, pa[], y[], dap_an, maDe? }
//   • đề thầy (TeacherExamSource): phanI/II/III[] — { text, choices[4] | ideas[4], correct }   (truyền `phanMacDinh` vì câu không mang `phan`)
//   • phiếu `CauLuyen`:         { phan, id, maDe, text, luaChon | null, dapAn }
//   • câu game / ôn lại:        { qid, phan, text, choices, ideas, correct? }  (khuôn CÔNG KHAI không có `correct`)
// Tên trường tương đương được đọc chịu: text|de, choices|pa|luaChon, ideas|y, correct|dapAn|dap_an|dapAnDung.
//
// NGUYÊN TẮC "KHÔNG BIẾT ⇒ KHÔNG KẾT TỘI": một luật chỉ áp khi TRƯỜNG nó cần CÓ MẶT trong câu. Khuôn công khai (không có trường đáp án — máy học sinh chưa nhận `dap_an` của bài cá nhân hoá)
// KHÔNG bị coi là tự luận chỉ vì thiếu đáp án; nhưng trường đáp án CÓ mặt mà rỗng ⇒ không chấm tự động được ⇒ tự luận. Luật theo chữ đề (phần III hỏi mở) áp được cả khi thiếu đáp án.
// Đầu vào không phải đối tượng ⇒ `true` (không có gì để rút).

export type PhanCau = 'I' | 'II' | 'III'

type Cau = Record<string, unknown>

const laDoiTuong = (x: unknown): x is Cau => x !== null && typeof x === 'object' && !Array.isArray(x)
const lay = (c: Cau, ...khoa: string[]): unknown => {
  for (const k of khoa) if (c[k] !== undefined) return c[k]
  return undefined
}
const chuoi = (x: unknown): string => (typeof x === 'string' ? x : typeof x === 'number' ? String(x) : '').normalize('NFC').trim()

/** Đáp án về một chuỗi (cùng tinh thần `answerText` của máy chủ): mảng nối lại, boolean → Đ/S, đối tượng {a,b,c,d} → 4 ký tự Đ/S. */
export function chuoiDapAn(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'boolean') return v ? 'D' : 'S'
  if (Array.isArray(v)) return v.map(chuoiDapAn).join('')
  if (typeof v === 'object') {
    const o = v as Cau
    const co = ['a', 'b', 'c', 'd'].some((k) => k in o) || ['A', 'B', 'C', 'D'].some((k) => k in o)
    if (co) {
      return ['a', 'b', 'c', 'd']
        .map((k) => {
          const val = o[k] ?? o[k.toUpperCase()]
          if (typeof val === 'object' && val !== null) return (val as { dung?: boolean }).dung ? 'D' : 'S'
          return chuoiDapAn(val)
        })
        .join('')
    }
    return ''
  }
  return String(v).trim()
}

/** Phần của câu: từ `phan` (I/II/III, hoặc TN/DS/TLN, hoặc 1/2/3), rồi từ qid `…-III-4`, rồi `phanMacDinh`. Phần LẠ (IV, TL, …) ⇒ 'khac'. Không rõ ⇒ null. */
function phanCua(c: Cau, phanMacDinh?: PhanCau): PhanCau | 'khac' | null {
  const ban: Record<string, PhanCau> = { I: 'I', II: 'II', III: 'III', TN: 'I', DS: 'II', TLN: 'III', '1': 'I', '2': 'II', '3': 'III' }
  const raw = chuoi(lay(c, 'phan', 'part')).toUpperCase()
  if (raw) return ban[raw] ?? 'khac'
  const m = chuoi(lay(c, 'qid', 'id')).match(/-(III|II|I)-\d+$/)
  if (m) return m[1] as PhanCau
  return phanMacDinh ?? null
}

/** Mã đề / qid mang nhãn mục dạy học hay tự luận (`-VD`, `-DT`, `-TL`) — luật sẵn có của BTVN mở rộng thêm `-TL`. `-TLN` (trả lời ngắn) KHÔNG dính. */
export function laMaDeTuLuan(ma: string): boolean {
  return /(?:^|-)(?:VD|DT|TL)(?:-|$)/i.test(String(ma ?? ''))
}

const KIEU_TU_LUAN = /(?:^|[^a-z])(?:tu[\s_-]?luan|tự[\s_-]?luận|essay|open[\s_-]?ended|free[\s_-]?text)(?:$|[^a-z])/i
const CO_ANH = (x: unknown): boolean => (Array.isArray(x) ? x.some(Boolean) : Boolean(x))

/** Chữ đề phần III hỏi MỞ ("theo em…", "phương pháp nào…", "vì sao…", "giải thích…") — phần III đúng nghĩa hỏi ra MỘT SỐ hay một mã ngắn. */
const HOI_MO_PHAN_III = [
  'theo em', 'vì sao', 'tại sao', 'giải thích', 'trình bày', 'mô tả', 'phương pháp nào', 'cách nào', 'cách gì', 'bằng cách nào', 'như thế nào', 'đề xuất', 'nhận xét', 'so sánh', 'hãy nêu',
]
const hoiMo = (text: string): boolean => {
  const t = text.toLowerCase()
  return HOI_MO_PHAN_III.some((m) => t.includes(m))
}

/** Đáp án phần III là CHỮ NHIỀU TỪ (≥ 2 từ toàn chữ, không chứa chữ số): "kết tinh lại", "chưng cất phân đoạn". Số, công thức (C2H5OH), số kèm một đơn vị (1,5 mol) không dính. */
const laChuNhieuTu = (da: string): boolean => da.split(/\s+/).filter((t) => t.length > 0 && !/\d/.test(t) && /^\p{L}{2,}[.,;:!?]*$/u.test(t)).length >= 2

/** Chữ của MỘT phương án/ý: chuỗi, hoặc đối tượng có text/noiDung/de. */
const chuPhuongAn = (x: unknown): string => (typeof x === 'string' ? x.trim() : laDoiTuong(x) ? chuoi(lay(x, 'text', 'noiDung', 'noi_dung', 'de')) : typeof x === 'number' ? String(x) : '')

/**
 * Số phương án/ý CÓ NỘI DUNG (chữ HOẶC ảnh). Nhận cả MẢNG (đề thầy, phiếu, game: 4 phần tử theo thứ tự A–D / a–d) lẫn ĐỐI TƯỢNG (tờ kho thô R2: `pa {A,B,C,D}`, `y {a,b,c,d}` — đếm khoá A–D/a–d).
 * Ảnh của phương án: mảng song song (`choiceImgs`/`ideaImgs`) hoặc hình có `viTri` = `sau_pa_A` / `sau_y_a` (kho thô: `hinh[]`; đề thầy: `hinhAnh[]`).
 */
function demCoNoiDung(ds: unknown, anh: unknown, hinh: unknown, tienTo: 'sau_pa_' | 'sau_y_'): number {
  const khoa = ['A', 'B', 'C', 'D']
  const coHinh = (k: string): boolean =>
    Array.isArray(hinh) && hinh.some((h) => laDoiTuong(h) && chuoi(h.viTri ?? h.vi_tri).toLowerCase() === `${tienTo}${k}`.toLowerCase() && Boolean(h.src ?? h.url ?? h.data))
  const imgs = Array.isArray(anh) ? anh : []
  let n = 0
  if (Array.isArray(ds)) {
    for (let i = 0; i < ds.length; i++) if (chuPhuongAn(ds[i]) || CO_ANH(imgs[i]) || (i < 4 && coHinh(khoa[i]))) n++
    return n
  }
  if (laDoiTuong(ds)) {
    khoa.forEach((k, i) => {
      const v = ds[k] ?? ds[k.toLowerCase()]
      if (chuPhuongAn(v) || CO_ANH(imgs[i]) || coHinh(k)) n++
    })
  }
  return n
}

/**
 * LÝ DO câu là tự luận (chuỗi ngắn tiếng Việt cho nhật ký / "đã bỏ N câu tự luận"), hoặc `null` khi câu rút được.
 * `phanMacDinh`: phần của câu khi khuôn không mang `phan` (đề thầy: câu nằm trong `phanI/phanII/phanIII`).
 */
export function lyDoTuLuan(c: unknown, phanMacDinh?: PhanCau): string | null {
  if (!laDoiTuong(c)) return 'không phải câu hỏi'
  const kieu = chuoi(lay(c, 'kieu', 'loai', 'type', 'loaiCau'))
  if (kieu && KIEU_TU_LUAN.test(kieu)) return 'câu gắn nhãn tự luận'
  if (laMaDeTuLuan(chuoi(lay(c, 'maDe', 'ma_de'))) || laMaDeTuLuan(chuoi(lay(c, 'qid', 'id')))) return 'mã đề thuộc mục dạy học / tự luận (-VD, -DT, -TL)'

  const phan = phanCua(c, phanMacDinh)
  if (phan === 'khac') return 'phần của câu không phải I, II, III (tự luận)'
  const text = chuoi(lay(c, 'text', 'de', 'cauHoi', 'noiDung'))
  const daRaw = lay(c, 'correct', 'dapAn', 'dap_an', 'dapAnDung')
  // `CauLuyen` của bài cá nhân hoá luôn có `dapAn: ''` kèm `caNhan.chuaCoDapAn` (máy chủ chưa gửi đáp án): đó là CHƯA BIẾT, không phải "không có đáp án"
  const chuaCoDapAn = c.chuaCoDapAn === true || (laDoiTuong(c.caNhan) && c.caNhan.chuaCoDapAn === true)
  const coDapAn = daRaw !== undefined && !chuaCoDapAn // trường đáp án CÓ mặt (kể cả rỗng) — khuôn công khai thì không có
  const da = chuoiDapAn(daRaw)

  if (phan === 'I') {
    const pa = lay(c, 'choices', 'pa', 'luaChon', 'phuongAn', 'options')
    const coPa = c.choices !== undefined || c.pa !== undefined || c.luaChon !== undefined || c.phuongAn !== undefined || c.options !== undefined
    if (coPa && demCoNoiDung(pa, lay(c, 'choiceImgs', 'anhLuaChon'), lay(c, 'hinh', 'hinhAnh'), 'sau_pa_') < 4) return 'phần I thiếu phương án (không đủ 4)'
    if (coDapAn && !/^[A-D]$/i.test(da.replace(/[.)\s]+$/, '').trim())) return 'phần I không có đáp án A–D'
  } else if (phan === 'II') {
    const y = lay(c, 'ideas', 'y', 'cacY', 'statements')
    const coY = c.ideas !== undefined || c.y !== undefined || c.cacY !== undefined || c.statements !== undefined
    if (coY && demCoNoiDung(y, lay(c, 'ideaImgs', 'anhY'), lay(c, 'hinh', 'hinhAnh'), 'sau_y_') < 4) return 'phần II thiếu ý (không đủ 4)'
    if (coDapAn && da.replace(/[^DSĐdsđ]/g, '').length !== 4) return 'phần II không có đáp án đúng/sai đủ 4 ý'
  } else if (phan === 'III') {
    if (coDapAn) {
      if (!da) return 'phần III không có đáp án để chấm tự động'
      if ((da.length > 20 && /\s/.test(da)) || /[\n;→⇌:]/.test(da)) return 'phần III đáp án dài / nhiều dòng (tự luận)'
      if (laChuNhieuTu(da)) return 'phần III đáp án là chữ nhiều từ (không phải số hay mã ngắn)'
    }
    if (text && hoiMo(text)) return 'phần III hỏi mở (theo em / phương pháp nào / giải thích …)'
  }
  return null
}

/** CÂU NÀY LÀ TỰ LUẬN — không chấm tự động được như trắc nghiệm / đúng-sai / trả lời ngắn. */
export function laCauTuLuan(c: unknown, phanMacDinh?: PhanCau): boolean {
  return lyDoTuLuan(c, phanMacDinh) !== null
}

/** CÂU NÀY RÚT ĐƯỢC (không phải tự luận). */
export function laCauRutDuoc(c: unknown, phanMacDinh?: PhanCau): boolean {
  return lyDoTuLuan(c, phanMacDinh) === null
}

/** Lọc một danh sách: `giu` (rút được, giữ thứ tự) và `bo` (tự luận) kèm lý do — để màn thầy ghi "đã bỏ N câu tự luận". */
export function locCauRutDuoc<T>(ds: readonly T[], phanMacDinh?: PhanCau): { giu: T[]; bo: { cau: T; lyDo: string }[] } {
  const giu: T[] = []
  const bo: { cau: T; lyDo: string }[] = []
  for (const c of ds) {
    const ly = lyDoTuLuan(c, phanMacDinh)
    if (ly === null) giu.push(c)
    else bo.push({ cau: c, lyDo: ly })
  }
  return { giu, bo }
}

/** Câu chữ báo thầy khi bộ lọc loại câu ("Đã bỏ 3 câu tự luận"). Không bỏ câu nào ⇒ chuỗi rỗng. */
export function chuBaoBoTuLuan(soBo: number): string {
  return soBo > 0 ? `Đã bỏ ${soBo} câu tự luận (chỉ rút câu trắc nghiệm, đúng sai, trả lời ngắn)` : ''
}
