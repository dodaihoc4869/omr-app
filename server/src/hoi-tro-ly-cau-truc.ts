// CÂU TRẢ LỜI CÓ CẤU TRÚC của Hỏi Thầy (bản vẽ docs/ban-ve-hoi-thay-1310, thầy chốt 13/10: "Phần hướng dẫn lời giải phải hiển thị khoa học
// hơn, ngắt câu tô đậm … sao cho hs đọc cái hiểu ngay"). Mô hình trả JSON theo `SCHEMA_TRA_LOI`; máy chủ LÀM SẠCH từng phần (cắt độ dài, bỏ HTML,
// giới hạn số cụm tô đậm / làm nổi), chặn lộ đáp án khi em đang làm, và dựng thêm bản CHỮ PHẲNG (`chuPhang`) để ghi sổ + gửi lại mô hình làm
// lịch sử + cho máy em bản cũ. Máy em vẽ: ý chính → các bước đánh số → bảng nhanh → ghi nhớ → nút hỏi tiếp.
// v2 (bản vẽ docs/ban-ve-hoi-thay-v2-1410, thầy 14/10: "Làm mọi thứ tốt nhất để hs hỏi cái là hiểu được bài ngay"): thêm KHỐI HÌNH tuỳ câu hỏi
// (sơ đồ chuyển hoá · thí nghiệm ảo · hiện tượng → nhóm chức · phương trình · tính nhanh · bẫy). Hiện tượng là danh sách ĐÓNG (`HIEN_TUONG`):
// máy em tự vẽ ống nghiệm theo mã, mô hình không gửi màu hay hình. Tối đa 3 khối hình (thứ tự cố định soDo → thiNghiem → nhanBiet →
// phuongTrinh → tinh). Em ĐANG LÀM: bỏ phương trình + tính nhanh, sơ đồ chỉ giữ ký hiệu đề (X, Y), nhãn ống ≤ 4 ký tự, không tô "đúng".
// v3 (bản vẽ docs/ban-ve-hoi-thay-v3-1510, thầy 15/10 "chốt build luôn nhé"): câu trả lời theo Ý EM HỎI — 5 KHUÔN do MÁY CHỦ chọn trước khi gọi
// Gemini (`chonKhuon`, từ dữ liệu đã đọc sẵn: đang làm, phần câu, kết quả em, đáp án em ghi, chữ câu hỏi). Mỗi khuôn một LƯỢC ĐỒ RIÊNG
// (`schemaChoKhuon`) chỉ gồm phần khuôn cần ⇒ mô hình lite buộc điền đúng phần (đo 14/10: để mô hình tự chọn thì 7/99 câu có khối).
// Đúng/Sai từng ý (`yDS`) do MÁY CHỦ điền từ đáp án kho + bài em; mô hình chỉ viết lý do. Em đang làm ⇒ chỉ gợi ý từng nấc + khối không lộ đáp án.

type Obj = Record<string, unknown>
const str = (v: unknown): string => (typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v))

export interface CauTrucTraLoi {
  /** Một câu trả lời thẳng chỗ em hỏi. */
  yChinh: string
  /** 0–4 bước: tên ngắn in đậm + 1–2 câu. */
  buoc: { ten: string; chu: string }[]
  /** Bảng nhanh (so ≥ 3 chất / số); `sauBuoc` = số thứ tự bước bảng minh hoạ (0: đứng riêng sau các bước). */
  bang: { cot: string[]; dong: string[][]; sauBuoc: number } | null
  ghiNho: string
  hoiTiep: string[]
  /** Khối hình (v2, tuỳ chọn — câu trả lời cũ không có). */
  soDo?: { nut: { ten: string; nhan: string }[]; dk: string[] }
  thiNghiem?: { nhan: string; thuoc: string; hien: HienTuong; chu: string; phu: string }[]
  nhanBiet?: { thuoc: string; hien: HienTuong; chu: string; nhom: string }[]
  phuongTrinh?: { trai: string[]; phai: string[]; mui: string; dk: string; chinh: string }[]
  tinh?: { dong: { nhan: string; phep: string; kq: string }[]; dapSo: string }
  bay?: { tieuDe: 'Bẫy hay nhầm' | 'Chỗ em nhầm'; chu: string }
  /** v3 — khuôn câu trả lời (máy chủ chọn) và các phần của khuôn (tuỳ chọn). */
  khuon?: Khuon
  soSanh?: { em: string; dung: string; lech: boolean }[]
  nac?: { ten: string; chu: string; khoi: '' | 'thiNghiem' | 'nhanBiet' | 'soDo' }[]
  xepHang?: { tieuChi: string; chat: { ct: string; ten: string }[]; hoi: number; nguong: { sau: number; tren: string; duoi: string } | null }
  hinhDung?: HinhDung
  doiChieu?: { a: string; b: string; dong: { tieuChi: string; a: string; b: string }[] }
  yDS?: { y: string; noi: string; em: '' | 'D' | 'S'; dapAn: 'D' | 'S'; lyDo: string }[]
  buocThu?: { buoc: number; hoi: string; dap: string; goiYSai: string }
  kiemLai?: { hoi: string; lua: string[]; dung: number; vi: string; goiYSai: string }
  chuaHieu?: string[]
}

export const KHUON = ['cho-sai', 'goi-y', 'giai-thich', 'tung-y', 'tinh'] as const
export type Khuon = (typeof KHUON)[number]
/** Hình VẼ SẴN máy em biết vẽ (danh sách đóng); mô hình chỉ gửi mã. */
export const HINH_DUNG = ['cap-e-amine', 'lien-ket-hydrogen', 'glucose-mach-ho', 'xa-phong-hoa'] as const
export type HinhDung = (typeof HINH_DUNG)[number]

/** Mã hiện tượng máy em biết vẽ (ống nghiệm). Mô hình chọn đúng một mã; mã lạ ⇒ bỏ ống / dòng đó. */
export const HIEN_TUONG = ['quy-xanh', 'quy-do', 'trang-bac', 'tua-trang', 'tua-vang', 'tua-xanh', 'tua-nau-do', 'dd-xanh-lam', 'tim', 'xanh-tim', 'mat-mau', 'khi', 'tach-lop', 'khong-doi'] as const
export type HienTuong = (typeof HIEN_TUONG)[number]
const S = { type: 'STRING' } as const
const DS = { type: 'ARRAY', items: S } as const
const HIEN = { type: 'STRING', format: 'enum', enum: [...HIEN_TUONG] } as const

/** Lược đồ JSON gửi Gemini (`responseSchema`). `dong` là chuỗi các ô cách nhau " | " (đơn giản hơn mảng lồng mảng). */
export const SCHEMA_TRA_LOI = {
  type: 'OBJECT',
  properties: {
    lienQuan: { type: 'BOOLEAN' },
    yChinh: { type: 'STRING' },
    buoc: { type: 'ARRAY', items: { type: 'OBJECT', properties: { ten: { type: 'STRING' }, chu: { type: 'STRING' } }, required: ['ten', 'chu'] } },
    bang: { type: 'OBJECT', properties: { cot: { type: 'ARRAY', items: { type: 'STRING' } }, dong: { type: 'ARRAY', items: { type: 'STRING' } }, sauBuoc: { type: 'INTEGER' } } },
    ghiNho: { type: 'STRING' },
    hoiTiep: { type: 'ARRAY', items: { type: 'STRING' } },
    soDo: { type: 'OBJECT', properties: { nut: DS, dk: DS } },
    thiNghiem: { type: 'ARRAY', items: { type: 'OBJECT', properties: { nhan: S, thuoc: S, hien: HIEN, chu: S, phu: S }, required: ['thuoc', 'hien', 'chu'] } },
    nhanBiet: { type: 'ARRAY', items: { type: 'OBJECT', properties: { thuoc: S, hien: HIEN, chu: S, nhom: S }, required: ['thuoc', 'hien', 'nhom'] } },
    phuongTrinh: { type: 'ARRAY', items: { type: 'OBJECT', properties: { pt: S, dk: S, chinh: S }, required: ['pt'] } },
    tinh: { type: 'OBJECT', properties: { dong: DS, dapSo: S } },
    bay: { type: 'OBJECT', properties: { tieuDe: { type: 'STRING', format: 'enum', enum: ['Bẫy hay nhầm', 'Chỗ em nhầm'] }, chu: S } },
  },
  required: ['lienQuan', 'yChinh'],
  // `bay` ngay sau ý chính (đo 14/10: 0/99 câu trả lời có ô bẫy khi đứng gần cuối) — máy em vẫn vẽ theo thứ tự cố định của mình.
  propertyOrdering: ['lienQuan', 'yChinh', 'bay', 'soDo', 'thiNghiem', 'nhanBiet', 'phuongTrinh', 'tinh', 'buoc', 'bang', 'ghiNho', 'hoiTiep'],
} as const

/** LƯỢC ĐỒ CŨ (khuôn 13/10, không khối hình): đường lui khi Google từ chối lược đồ v2 (HTTP 400) — em vẫn được trả lời như trước. */
const { lienQuan, yChinh, buoc, bang, ghiNho, hoiTiep } = SCHEMA_TRA_LOI.properties
export const SCHEMA_TRA_LOI_CU = {
  type: 'OBJECT',
  properties: { lienQuan, yChinh, buoc, bang, ghiNho, hoiTiep },
  required: ['lienQuan', 'yChinh'],
  propertyOrdering: ['lienQuan', 'yChinh', 'buoc', 'bang', 'ghiNho', 'hoiTiep'],
} as const

// ---------------------------------------------------------------- v3 · KHUÔN
const BOOL = { type: 'BOOLEAN' } as const
const INT = { type: 'INTEGER' } as const
const PHAN_MOI: Obj = {
  soSanh: { type: 'ARRAY', items: { type: 'OBJECT', properties: { em: S, dung: S, lech: BOOL }, required: ['em', 'dung'] } },
  nac: { type: 'ARRAY', items: { type: 'OBJECT', properties: { ten: S, chu: S, khoi: { type: 'STRING', format: 'enum', enum: ['khong', 'thiNghiem', 'nhanBiet', 'soDo'] } }, required: ['ten', 'chu'] } },
  xepHang: { type: 'OBJECT', properties: { tieuChi: S, chat: { type: 'ARRAY', items: { type: 'OBJECT', properties: { ct: S, ten: S }, required: ['ct'] } }, hoi: INT, nguongSau: INT, nguongTren: S, nguongDuoi: S } },
  hinhDung: { type: 'STRING', format: 'enum', enum: [...HINH_DUNG] },
  doiChieu: { type: 'OBJECT', properties: { a: S, b: S, dong: { type: 'ARRAY', items: { type: 'OBJECT', properties: { tieuChi: S, a: S, b: S }, required: ['tieuChi', 'a', 'b'] } } } },
  lyDoY: { type: 'ARRAY', items: { type: 'OBJECT', properties: { y: { type: 'STRING', format: 'enum', enum: ['a', 'b', 'c', 'd'] }, lyDo: S }, required: ['y', 'lyDo'] } },
  buocThu: { type: 'OBJECT', properties: { buoc: INT, hoi: S, dap: S, goiYSai: S } },
  kiemLai: { type: 'OBJECT', properties: { hoi: S, lua: DS, dung: INT, vi: S, goiYSai: S }, required: ['hoi', 'lua', 'dung'] },
  chuaHieu: DS,
}
/** Phần của từng khuôn, đúng thứ tự mô hình viết (ý chính trước, phần chính của khuôn ngay sau). */
const PHAN_KHUON: Record<Khuon, string[]> = {
  'cho-sai': ['soSanh', 'bay', 'phuongTrinh', 'tinh', 'buoc', 'ghiNho', 'chuaHieu', 'kiemLai', 'hoiTiep'],
  'goi-y': ['nac', 'thiNghiem', 'nhanBiet', 'soDo', 'bay', 'chuaHieu', 'hoiTiep'],
  'giai-thich': ['xepHang', 'hinhDung', 'thiNghiem', 'soDo', 'nhanBiet', 'phuongTrinh', 'doiChieu', 'bay', 'buoc', 'ghiNho', 'chuaHieu', 'kiemLai', 'hoiTiep'],
  'tung-y': ['lyDoY', 'bay', 'thiNghiem', 'ghiNho', 'chuaHieu', 'kiemLai', 'hoiTiep'],
  tinh: ['phuongTrinh', 'buoc', 'buocThu', 'tinh', 'bay', 'ghiNho', 'chuaHieu', 'kiemLai', 'hoiTiep'],
}
/** Lược đồ RIÊNG của một khuôn: chỉ phần khuôn cần ⇒ nhỏ hơn lược đồ v2, mô hình không lạc sang phần khác. */
export function schemaChoKhuon(k: Khuon) {
  const ten = ['lienQuan', 'yChinh', ...PHAN_KHUON[k]]
  const nguon = SCHEMA_TRA_LOI.properties as unknown as Obj
  return { type: 'OBJECT', properties: Object.fromEntries(ten.map((t) => [t, nguon[t] ?? PHAN_MOI[t]])), required: ['lienQuan', 'yChinh'], propertyOrdering: ten }
}
/** Dòng gửi kèm DỮ LIỆU CÂU: khuôn máy chủ đã chọn + phần BẮT BUỘC của khuôn đó. */
export const CHI_DAN_KHUON: Record<Khuon, string> = {
  'cho-sai': 'KHUÔN TRẢ LỜI "Chỉ chỗ sai". BẮT BUỘC: soSanh 2–5 dòng theo thứ tự làm, mỗi dòng {em: em đã làm gì ở bước đó (suy từ đáp án em ghi), dung: bước đúng}, đúng MỘT dòng lech = true là dòng ĐẦU TIÊN em làm khác lời giải; bay tieuDe "Chỗ em nhầm" nói vì sao em nhầm; kiemLai 1 câu cùng lỗi nhưng với chất hay số khác. Có tính toán thì thêm phuongTrinh, tinh. chuaHieu 2–3 chỗ.',
  'goi-y': 'KHUÔN TRẢ LỜI "Gợi ý từng nấc" (em ĐANG LÀM). BẮT BUỘC nac đúng 3 nấc từ nhẹ tới sâu: nấc 1 gợi kiến thức cần dùng, nấc 2 gợi cách làm (câu có hiện tượng / thuốc thử / sơ đồ thì khoi = thiNghiem / nhanBiet / soDo và điền khối đó), nấc 3 gợi bước cuối để em TỰ kết luận. KHÔNG nấc nào nêu đáp án, phương án đúng, đúng/sai từng ý hay kết quả số. chuaHieu 2 chỗ.',
  'giai-thich': 'KHUÔN TRẢ LỜI "Giải thích". yChinh MỘT câu trả lời thẳng. Câu có so sánh, thứ tự, mạnh/yếu ⇒ BẮT BUỘC xepHang. Có hình vẽ sẵn hợp ⇒ hinhDung. So hai chất ⇒ doiChieu. BẮT BUỘC kiemLai 1 câu về đúng kiến thức vừa giải thích. chuaHieu 2–3 chỗ.',
  'tung-y': 'KHUÔN TRẢ LỜI "Từng ý a–d". BẮT BUỘC lyDoY đủ 4 ý a, b, c, d, mỗi ý MỘT câu lý do (KHÔNG mở đầu bằng chữ Đúng hay Sai: máy em tự ghi theo đáp án). yChinh nói em sai ý nào và gốc chung nếu có. kiemLai 1 câu về kiến thức của ý em sai. chuaHieu ghi "Ý b", "Ý c"… cho ý em sai.',
  tinh: 'KHUÔN TRẢ LỜI "Tính từng bước". BẮT BUỘC buoc 2–4 bước có phép tính và kết quả kèm đơn vị; buocThu chọn MỘT bước giữa cho em tự tính (buoc = số thứ tự bước đó, hoi = câu hỏi ngắn, dap = kết quả số của bước đó chỉ gồm số và dấu phẩy, goiYSai = gợi ý khi em tính sai); tinh có dapSo; phuongTrinh nếu có phản ứng. chuaHieu 2 chỗ.',
}

const RE_KHAI_NIEM = /(vì sao|tại sao|giải thích|là gì|khác (gì|nhau)|giống|so sánh|sắp xếp|thứ tự|mạnh hơn|yếu hơn|dễ hơn|ví dụ khác|chưa hiểu|nghĩa là)/i
const RE_BAI_EM = /(sao em|em (ra|chọn|được|làm|tính|ghi|sai)|nhầm|sai ở đâu|sai chỗ nào)/i
const RE_SO_DON_VI = /\d+(?:[.,]\d+)?\s*(?:gam|g|kg|mol|lít|l|ml|%|m3|tấn)(?![\p{L}])/iu
/** Máy chủ chọn khuôn trước khi gọi Gemini (không đọc D1 thêm). Có số liệu bài em (đáp án em ghi, hoặc em nói số / phương án em ra) mới
 *  "Chỉ chỗ sai" — không có thì cột "Em làm" sẽ là đoán ⇒ dùng khuôn tính / giải thích. */
export function chonKhuon(x: { dangLam: boolean; phan: string; ketQua: 'dung' | 'sai' | 'chua_lam'; cauHoi: string; de: string; dapAnEm: string }): Khuon {
  if (x.dangLam) return 'goi-y'
  if (x.phan === 'II') return 'tung-y'
  const baiEm = RE_BAI_EM.test(x.cauHoi)
  if (RE_KHAI_NIEM.test(x.cauHoi) && !baiEm) return 'giai-thich'
  if ((x.ketQua === 'sai' && x.dapAnEm) || (baiEm && (x.dapAnEm || /\d|(^|[^\p{L}])[A-D]([^\p{L}]|$)/u.test(x.cauHoi)))) return 'cho-sai'
  if (x.phan === 'III' || RE_SO_DON_VI.test(x.de) || /tính|bao nhiêu/i.test(x.cauHoi)) return 'tinh'
  return 'giai-thich'
}
/** Bối cảnh máy chủ biết để làm sạch phần v3 (khuôn đã chọn, câu, đáp án, bài em). */
export interface BoiCanhKhuon { khuon: Khuon; phan: string; de: string; pa: Record<string, string> | null; y: Record<string, string> | null; dapAn: string; dapAnEm: string }

/** Đầu ra JSON có `yChinh` hoặc `buoc` ⇒ khuôn mới; khác ⇒ null (nơi gọi đọc khuôn cũ `{lienQuan, traLoi}`). */
export function tachCauTruc(chu: string): { lienQuan: boolean; o: Obj } | null {
  const s = str(chu).trim().replace(/^```(?:json)?\s*|\s*```$/g, '')
  try {
    const o = JSON.parse(s) as Obj
    if (o && typeof o === 'object' && !Array.isArray(o) && typeof o.lienQuan === 'boolean' && ('yChinh' in o || Array.isArray(o.buoc))) return { lienQuan: o.lienQuan, o }
  } catch { /* không phải khuôn mới */ }
  return null
}

const EMOJI = /\p{Extended_Pictographic}️?/gu
/** Một ô chữ: bỏ HTML, markdown khác, emoji, gạch ngang dài; gọn khoảng trắng; cắt `toiDa`; GIỮ **…**, ==…==, ++đúng++, !!sai!! (máy em vẽ). */
function sachO(v: unknown, toiDa: number): string {
  let s = str(v).replace(/<[^>]*>/g, '').replace(EMOJI, '').replace(/__(.+?)__/g, '$1').replace(/^#{1,6}\s*|#{2,}\s*/gm, '').replace(/\s*—\s*/g, ', ').replace(/\s+/g, ' ').trim()
  if (s.length > toiDa) s = s.slice(0, toiDa).replace(/\s+\S*$/, '').trim() + '…'
  // Cắt giữa chừng hay mô hình lỡ tay ⇒ dấu lẻ không thành cặp thì bỏ.
  for (const dau of ['**', '==', '!!']) if (s.split(dau).length % 2 === 0) { const i = s.lastIndexOf(dau); s = s.slice(0, i) + s.slice(i + dau.length) }
  return s
}
/** ++đúng++: nội dung không bắt đầu/kết thúc bằng khoảng trắng hay "+" (ion "NH4^+ + OH^-" không bị hiểu nhầm). */
const RE_DUNG = /\+\+([^+\s](?:[^+]*?[^+\s])?)\+\+/g
const RE_SAI = /!!([^!\s](?:[^!]*?[^!\s])?)!!/g
const boDungSai = (s: string): string => s.replace(RE_DUNG, '$1').replace(RE_SAI, '$1').replace(/!!/g, '')
const boDau = (s: string): string => boDungSai(s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/==(.+?)==/g, '$1').replace(/\*\*|==/g, ''))

/** Làm sạch đối tượng mô hình trả về. `chan` (em đang làm): lọc câu lộ đáp án trong từng phần ('' = bỏ cả phần). Rỗng hết ⇒ null. */
export function lamSachCauTruc(o: Obj, dangLam: boolean, chan?: (t: string) => string, bo?: BoiCanhKhuon): CauTrucTraLoi | null {
  const loc = (t: string) => (t && chan ? chan(t) : t)
  const yChinh = loc(sachO(o.yChinh, 220))
  const buoc = (Array.isArray(o.buoc) ? o.buoc : []).slice(0, 4)
    .map((b) => { const x = (b && typeof b === 'object' ? b : {}) as Obj; return { ten: boDau(sachO(x.ten, 48)), chu: loc(sachO(x.chu, 320)) } })
    .filter((b) => b.chu)
  let bang: CauTrucTraLoi['bang'] = null
  const b = o.bang && typeof o.bang === 'object' ? (o.bang as Obj) : null
  if (b && !dangLam) {
    const cot = (Array.isArray(b.cot) ? b.cot : []).slice(0, 3).map((c) => boDau(sachO(c, 24))).filter(Boolean)
    const dong = (Array.isArray(b.dong) ? b.dong : []).slice(0, 8)
      .map((d) => (Array.isArray(d) ? d : str(d).split('|')).slice(0, cot.length).map((x) => sachO(x, 48)))
      .filter((d) => d.some(Boolean))
      .map((d) => [...d, ...Array<string>(Math.max(0, cot.length - d.length)).fill('')])
    const sau = Number(b.sauBuoc)
    if (cot.length >= 2 && dong.length) bang = { cot, dong, sauBuoc: Number.isInteger(sau) && sau >= 1 && sau <= buoc.length ? sau : 0 }
  }
  const ghiNho = loc(sachO(o.ghiNho, 200))
  const hoiTiep = (Array.isArray(o.hoiTiep) ? o.hoiTiep : []).slice(0, 2).map((x) => loc(boDau(sachO(x, 80)))).filter((x) => x.length >= 4)
  const khoi = lamSachKhoi(o, dangLam, loc)
  const v3 = lamSachV3(o, dangLam, loc, buoc.length, bo)
  if (!yChinh && !buoc.length && !khoi.so && !v3.so) return null
  // Tô đậm tối đa 4 cụm cả câu trả lời (đặc tả mục 4); làm nổi tối đa 1 cụm và CHỈ ở ý chính; em đang làm ⇒ không làm nổi gì.
  // ++đúng++ / !!sai!!: tối đa 2 cụm mỗi loại, chỉ ở ý chính và ô bẫy; em đang làm ⇒ không tô "đúng".
  let soDam = 0
  const dam = (s: string) => s.replace(/\*\*(.+?)\*\*/g, (_m, x: string) => (++soDam <= 4 ? `**${x}**` : x))
  const khongNoi = (s: string) => boDungSai(s.replace(/==(.+?)==/g, '$1'))
  let soNoi = 0, soDung = 0, soSai = 0
  // !!…!!: tách theo cặp hợp lệ (phần lẻ là nội dung cặp) — dấu "!!" lẻ ngoài cặp thì bỏ, cặp thứ 3 trở đi thành chữ thường.
  const dungSai = (s: string) => s.replace(RE_DUNG, (_m, x: string) => (!dangLam && ++soDung <= 2 ? `++${x}++` : x))
    .split(RE_SAI).map((p, i) => (i % 2 ? (++soSai <= 2 ? `!!${p}!!` : p) : p.replace(/!!/g, ''))).join('')
  const yc = dam(dungSai(dangLam ? yChinh.replace(/==(.+?)==/g, '$1') : yChinh.replace(/==(.+?)==/g, (_m, x: string) => (++soNoi <= 1 ? `==${x}==` : x))))
  const kq: CauTrucTraLoi = {
    yChinh: yc,
    buoc: buoc.map((x) => ({ ten: x.ten, chu: dam(khongNoi(x.chu)) })),
    bang: bang ? { ...bang, dong: bang.dong.map((r) => r.map((c) => boDau(c))) } : null,
    ghiNho: dam(khongNoi(ghiNho)),
    hoiTiep,
  }
  if (khoi.soDo) kq.soDo = khoi.soDo
  if (khoi.thiNghiem) kq.thiNghiem = khoi.thiNghiem
  if (khoi.nhanBiet) kq.nhanBiet = khoi.nhanBiet
  if (khoi.phuongTrinh) kq.phuongTrinh = khoi.phuongTrinh
  if (khoi.tinh) kq.tinh = khoi.tinh
  if (khoi.bay) kq.bay = { ...khoi.bay, chu: dam(dungSai(khoi.bay.chu.replace(/==(.+?)==/g, '$1'))) }
  const { so: _so, ...phan3 } = v3
  if (bo) kq.khuon = bo.khuon
  Object.assign(kq, phan3)
  return kq
}

const chuanSo = (t: string) => t.replace(/\s+/g, '').replace('.', ',')
const gon = (t: string) => t.toLowerCase().replace(/<[^>]*>/g, '').replace(/[^\p{L}\p{N}]+/gu, '')
/** Làm sạch phần v3; `so` = số phần có được. Em đang làm ⇒ chỉ chuaHieu, nac, hinhDung (không phần nào chứa đáp án / so với đáp án). */
function lamSachV3(o: Obj, dangLam: boolean, loc: (t: string) => string, soBuoc: number, bo?: BoiCanhKhuon) {
  const k: Omit<Partial<CauTrucTraLoi>, 'khuon'> & { so: number } = { so: 0 }
  const o1 = (v: unknown, n: number) => loc(boDau(sachO(v, n)))
  const giu = (v: unknown, n: number) => loc(boDungSai(sachO(v, n).replace(/==(.+?)==/g, '$1')))
  // Bỏ trùng TRƯỚC rồi mới cắt 3 (mô hình hay lặp một chỗ).
  const ch = [...new Set((Array.isArray(o.chuaHieu) ? o.chuaHieu : []).slice(0, 6).map((x) => o1(x, 24)).filter((x) => x.length >= 2))].slice(0, 3)
  if (ch.length) k.chuaHieu = ch
  const nac = mang(o.nac, 3).map((x) => ({ ten: o1(x.ten, 40), chu: giu(x.chu, 260), khoi: (['thiNghiem', 'nhanBiet', 'soDo'].includes(str(x.khoi)) ? str(x.khoi) : '') as '' | 'thiNghiem' | 'nhanBiet' | 'soDo' })).filter((x) => x.chu)
  if (nac.length >= 2) { k.nac = nac; k.so++ }
  if ((HINH_DUNG as readonly string[]).includes(str(o.hinhDung))) { k.hinhDung = str(o.hinhDung) as HinhDung; k.so++ }
  if (dangLam) return k
  // SO BÀI EM VỚI LỜI GIẢI: giữ đúng MỘT dòng lệch (dòng lệch đầu tiên).
  let daLech = false
  const ss = mang(o.soSanh, 5).map((x) => ({ em: o1(x.em, 90), dung: o1(x.dung, 90), lech: x.lech === true })).filter((x) => x.em && x.dung)
    .map((x) => { const lech = x.lech && !daLech; if (lech) daLech = true; return { ...x, lech } })
  if (ss.length >= 2) { k.soSanh = ss; k.so++ }
  // THANG XẾP HẠNG: mạnh/lớn ở đầu; `hoi` = chất em hỏi; ngưỡng nằm SAU chất thứ `nguongSau`.
  const xh = o.xepHang && typeof o.xepHang === 'object' ? (o.xepHang as Obj) : null
  if (xh) {
    const chat = mang(xh.chat, 5).map((x) => ({ ct: o1(x.ct, 24), ten: o1(x.ten, 32) })).filter((x) => x.ct)
    const hoi = Number(xh.hoi), sau = Number(xh.nguongSau), tren = o1(xh.nguongTren, 28), duoi = o1(xh.nguongDuoi, 28)
    if (chat.length >= 2) {
      k.xepHang = { tieuChi: o1(xh.tieuChi, 32) || 'So sánh', chat, hoi: Number.isInteger(hoi) && hoi >= 0 && hoi < chat.length ? hoi : -1,
        nguong: Number.isInteger(sau) && sau >= 0 && sau < chat.length - 1 && tren && duoi ? { sau, tren, duoi } : null }
      k.so++
    }
  }
  const dc = o.doiChieu && typeof o.doiChieu === 'object' ? (o.doiChieu as Obj) : null
  const dcDong = dc ? mang(dc.dong, 4).map((x) => ({ tieuChi: o1(x.tieuChi, 40), a: o1(x.a, 40), b: o1(x.b, 40) })).filter((x) => x.tieuChi && x.a && x.b) : []
  if (dc && o1(dc.a, 24) && o1(dc.b, 24) && dcDong.length) { k.doiChieu = { a: o1(dc.a, 24), b: o1(dc.b, 24), dong: dcDong }; k.so++ }
  // TỪNG Ý a–d: Đúng/Sai lấy từ ĐÁP ÁN KHO, "Em:" từ bài em gửi (DSSD) — mô hình chỉ viết lý do.
  const da = str(bo?.dapAn).trim().toUpperCase().replace(/Đ/g, 'D')
  if (bo && bo.phan === 'II' && bo.y && /^[DS]{2,4}$/.test(da)) {
    const ly = new Map(mang(o.lyDoY, 4).map((x) => [str(x.y).toLowerCase(), giu(x.lyDo, 220)] as const))
    const em = str(bo.dapAnEm).toUpperCase().replace(/Đ/g, 'D')
    const ds = Object.keys(bo.y).slice(0, da.length).map((key, i) => {
      const chu = /^[a-d]$/i.test(key) ? key.toLowerCase() : String.fromCharCode(97 + i)
      return { y: chu, noi: boDau(sachO(bo.y![key], 140)), em: (em[i] === 'D' || em[i] === 'S' ? em[i] : '') as '' | 'D' | 'S', dapAn: da[i] as 'D' | 'S', lyDo: ly.get(chu) ?? '' }
    })
    if (ds.length) { k.yDS = ds; k.so++ }
  }
  // EM THỬ TÍNH một bước giữa: đáp số chỉ là số.
  const bt = o.buocThu && typeof o.buocThu === 'object' ? (o.buocThu as Obj) : null
  const btDap = bt ? chuanSo(str(bt.dap)) : ''
  if (bt && Number.isInteger(Number(bt.buoc)) && Number(bt.buoc) >= 1 && Number(bt.buoc) <= soBuoc && /^-?\d+(?:,\d+)?$/.test(btDap) && o1(bt.hoi, 120)) {
    k.buocThu = { buoc: Number(bt.buoc), hoi: o1(bt.hoi, 120), dap: btDap, goiYSai: o1(bt.goiYSai, 140) }
    k.so++
  }
  // THẦY HỎI LẠI 1 CÂU: 3 lựa chọn khác nhau; bỏ nếu câu hỏi LẶP CHÍNH ĐỀ này (vô ích). Lựa chọn trùng chất với phương án thì giữ: cùng chủ đề hay
  // có chung chất (CH3COONa…), và câu hỏi lại chỉ có khi em đã nộp nên không còn gì để lộ.
  const kl = o.kiemLai && typeof o.kiemLai === 'object' ? (o.kiemLai as Obj) : null
  if (kl) {
    const hoi = o1(kl.hoi, 160), lua = (Array.isArray(kl.lua) ? kl.lua : []).slice(0, 3).map((x) => o1(x, 60)), dung = Number(kl.dung)
    const deGon = gon(str(bo?.de))
    const trung = hoi.length >= 20 && deGon.includes(gon(hoi))
    if (hoi && lua.length === 3 && lua.every(Boolean) && new Set(lua.map(gon)).size === 3 && [0, 1, 2].includes(dung) && !trung) {
      k.kiemLai = { hoi, lua, dung, vi: o1(kl.vi, 160), goiYSai: o1(kl.goiYSai, 160) }
      k.so++
    }
  }
  return k
}

const laHien = (v: unknown): v is HienTuong => (HIEN_TUONG as readonly string[]).includes(str(v))
const mang = (v: unknown, toiDa: number): Obj[] => (Array.isArray(v) ? v : []).slice(0, toiDa).map((x) => (x && typeof x === 'object' && !Array.isArray(x) ? (x as Obj) : {}))
/** Nhãn chất trong sơ đồ: "Glucose (X)" ⇒ tên "Glucose", nhãn "X" (nhãn ≤ 4 ký tự trong ngoặc cuối). */
function tachNhan(t: string): { ten: string; nhan: string } {
  const m = /^(.*?)\s*\(([A-Za-z]\d?'?|\d{1,2})\)$/.exec(t)
  return m ? { ten: m[1]!.trim(), nhan: m[2]! } : /^[A-Z]\d?'?$/.test(t) ? { ten: '', nhan: t } : { ten: t, nhan: '' }
}
/** "A + B → C + D": tách hai vế theo mũi tên (→, ⟶, ->, ⇌, =), mỗi vế tách chất theo " + " (dấu + có khoảng trắng hai bên: ion "NH4^+" giữ nguyên). */
function tachPhuongTrinh(pt: string): { trai: string[]; phai: string[]; mui: string } | null {
  const m = /\s*(⇌|⇄|→|⟶|->|=)\s*/.exec(pt)
  if (!m) return null
  const ve = (s: string) => s.split(/\s\+\s/).map((x) => x.trim()).filter(Boolean).slice(0, 5)
  const trai = ve(pt.slice(0, m.index)), phai = ve(pt.slice(m.index + m[0].length))
  return trai.length && phai.length ? { trai, phai, mui: m[1] === '⇌' || m[1] === '⇄' ? '⇌' : '→' } : null
}

/** Làm sạch các khối hình; `so` = số khối giữ (tối đa 3, theo thứ tự cố định). Không dấu tô trong khối (trừ ô bẫy). */
function lamSachKhoi(o: Obj, dangLam: boolean, loc: (t: string) => string) {
  const k: Pick<CauTrucTraLoi, 'soDo' | 'thiNghiem' | 'nhanBiet' | 'phuongTrinh' | 'tinh' | 'bay'> & { so: number } = { so: 0 }
  const o1 = (v: unknown, n: number) => loc(boDau(sachO(v, n)))
  const con = () => k.so < 3
  // SƠ ĐỒ CHUYỂN HOÁ: 2–6 nút, dk = số nút − 1. Em đang làm ⇒ nút có ký hiệu đề (X, Y) chỉ giữ ký hiệu (không lộ tên chất cần tìm).
  const sd = o.soDo && typeof o.soDo === 'object' ? (o.soDo as Obj) : null
  if (sd && con()) {
    const nut = (Array.isArray(sd.nut) ? sd.nut : []).slice(0, 6).map((x) => tachNhan(o1(x, 40))).map((x) => (dangLam && x.nhan ? { ten: '', nhan: x.nhan } : x)).filter((x) => x.ten || x.nhan)
    const dkGoc = Array.isArray(sd.dk) ? sd.dk : []
    if (nut.length >= 2) { k.soDo = { nut, dk: nut.slice(1).map((_x, i) => o1(dkGoc[i], 40)) }; k.so++ }
  }
  // THÍ NGHIỆM ẢO: 1–4 ống. Em đang làm ⇒ nhãn ống chỉ là ký hiệu ngắn (X, Y, (1)) — tên dài có thể là chất cần tìm.
  const tn = mang(o.thiNghiem, 4).filter((x) => laHien(x.hien))
    .map((x) => ({ nhan: o1(x.nhan, 24), thuoc: o1(x.thuoc, 40), hien: x.hien as HienTuong, chu: o1(x.chu, 32), phu: o1(x.phu, 40) }))
    .map((x) => (dangLam && x.nhan.length > 4 ? { ...x, nhan: '' } : x))
    .filter((x) => x.thuoc && x.chu)
  if (tn.length && con()) { k.thiNghiem = tn; k.so++ }
  // HIỆN TƯỢNG → NHÓM CHỨC: 1–5 dòng.
  const nb = mang(o.nhanBiet, 5).filter((x) => laHien(x.hien))
    .map((x) => ({ thuoc: o1(x.thuoc, 40), hien: x.hien as HienTuong, chu: o1(x.chu, 32), nhom: o1(x.nhom, 60) }))
    .filter((x) => x.thuoc && x.nhom)
  if (nb.length && con()) { k.nhanBiet = nb; k.so++ }
  // PHƯƠNG TRÌNH + TÍNH NHANH: em đang làm ⇒ bỏ (sản phẩm / kết quả số là đáp án).
  if (!dangLam) {
    const pt = mang(o.phuongTrinh, 3).map((x) => {
      const t = tachPhuongTrinh(boDau(sachO(x.pt, 160)))
      return t ? { ...t, dk: boDau(sachO(x.dk, 32)), chinh: boDau(sachO(x.chinh, 40)) } : null
    }).filter((x): x is NonNullable<typeof x> => !!x)
    if (pt.length && con()) { k.phuongTrinh = pt.map((x) => ({ ...x, chinh: [...x.trai, ...x.phai].includes(x.chinh) ? x.chinh : '' })); k.so++ }
    const ti = o.tinh && typeof o.tinh === 'object' ? (o.tinh as Obj) : null
    if (ti && con()) {
      // Dòng thiếu " | " mà viết kiểu "n ester = 8,8 : 88 = 0,1 mol" ⇒ tách theo " = " (mô hình hay viết thế).
      const tachDong = (d: unknown) => (Array.isArray(d) ? d.map(str) : str(d).includes('|') ? str(d).split('|') : str(d).split(/\s=\s/))
      const dong = (Array.isArray(ti.dong) ? ti.dong : []).slice(0, 6).map((d) => tachDong(d).map((c) => boDau(sachO(c, 60))))
        .filter((d) => d.length >= 2 && d.some(Boolean)).map((d) => (d.length === 2 ? { nhan: d[0]!, phep: '', kq: d[1]! } : { nhan: d[0]!, phep: d[1]!, kq: d.slice(2).join(' ') }))
      if (dong.length) { k.tinh = { dong, dapSo: boDau(sachO(ti.dapSo, 40)) }; k.so++ }
    }
  }
  // BẪY / CHỖ EM NHẦM (không tính vào 3 khối hình).
  const by = o.bay && typeof o.bay === 'object' ? (o.bay as Obj) : null
  const byChu = by ? loc(sachO(by.chu, 240)) : ''
  if (by && byChu) k.bay = { tieuDe: by.tieuDe === 'Chỗ em nhầm' ? 'Chỗ em nhầm' : 'Bẫy hay nhầm', chu: byChu }
  return k
}

/** Bản chữ phẳng (không dấu tô): ghi sổ `hoi_tro_ly.tra_loi`, gửi lại mô hình làm lịch sử, trả `traLoi` cho máy em bản cũ. */
export function chuPhang(c: CauTrucTraLoi): string {
  const bang = c.bang ? [c.bang.cot.join(' | '), ...c.bang.dong.map((r) => r.join(' | '))] : []
  const d: string[] = [boDau(c.yChinh)]
  const ten = (n: { ten: string; nhan: string }) => (n.ten && n.nhan ? `${n.ten} (${n.nhan})` : n.ten || n.nhan)
  if (c.soDo) d.push(`Sơ đồ: ${c.soDo.nut.map((n, i) => (i ? `→${c.soDo!.dk[i - 1] ? ` (${c.soDo!.dk[i - 1]})` : ''} ${ten(n)}` : ten(n))).join(' ')}`)
  for (const t of c.thiNghiem ?? []) d.push(`Thí nghiệm: ${t.nhan ? `${t.nhan} + ` : ''}${t.thuoc}: ${t.chu}${t.phu ? ` (${t.phu})` : ''}`)
  // Mỗi khối một tiền tố cố định: sổ đếm được câu trả lời nào có khối gì (workflow chỉ đọc), mô hình đọc lại lịch sử cũng rõ.
  for (const r of c.nhanBiet ?? []) d.push(`Nhận biết: ${r.thuoc} → ${r.chu || r.hien} ⇒ ${r.nhom}`)
  for (const p of c.phuongTrinh ?? []) d.push(`Phương trình: ${p.trai.join(' + ')} ${p.mui}${p.dk ? ` (${p.dk})` : ''} ${p.phai.join(' + ')}`)
  for (const r of c.tinh?.dong ?? []) d.push(`Tính: ${r.nhan}${r.phep ? ` = ${r.phep}` : ''} = ${r.kq}`)
  if (c.tinh?.dapSo) d.push(`Đáp số: ${c.tinh.dapSo}`)
  for (const r of c.soSanh ?? []) d.push(`So bài: em ${r.em} | đúng ${r.dung}${r.lech ? ' (chỗ lệch)' : ''}`)
  ;(c.nac ?? []).forEach((n, i) => d.push(`Gợi ý ${i + 1}: ${n.ten ? `${n.ten}: ` : ''}${boDau(n.chu)}`))
  if (c.xepHang) d.push(`Xếp hạng (${c.xepHang.tieuChi}): ${c.xepHang.chat.map((x) => x.ct).join(' > ')}`)
  if (c.doiChieu) for (const r of c.doiChieu.dong) d.push(`Đối chiếu ${r.tieuChi}: ${c.doiChieu.a} ${r.a} | ${c.doiChieu.b} ${r.b}`)
  for (const y of c.yDS ?? []) d.push(`Ý ${y.y} (${y.dapAn === 'D' ? 'Đúng' : 'Sai'})${y.lyDo ? `: ${boDau(y.lyDo)}` : ''}`)
  if (c.buocThu) d.push(`Em thử bước ${c.buocThu.buoc}: ${c.buocThu.hoi} (${c.buocThu.dap})`)
  if (c.kiemLai) d.push(`Thầy hỏi lại: ${c.kiemLai.hoi} → ${c.kiemLai.lua[c.kiemLai.dung]}`)
  c.buoc.forEach((b, i) => {
    d.push(`${i + 1}. ${b.ten ? `${b.ten}: ` : ''}${boDau(b.chu)}`)
    if (c.bang?.sauBuoc === i + 1) d.push(...bang)
  })
  if (c.bang && !c.bang.sauBuoc) d.push(...bang)
  if (c.bay) d.push(`${c.bay.tieuDe}: ${boDau(c.bay.chu)}`)
  if (c.ghiNho) d.push(`Ghi nhớ: ${boDau(c.ghiNho)}`)
  return d.filter(Boolean).join('\n').slice(0, 3000)
}
