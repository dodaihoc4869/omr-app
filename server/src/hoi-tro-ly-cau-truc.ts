// CÂU TRẢ LỜI CÓ CẤU TRÚC của Hỏi Thầy (bản vẽ docs/ban-ve-hoi-thay-1310, thầy chốt 13/10: "Phần hướng dẫn lời giải phải hiển thị khoa học
// hơn, ngắt câu tô đậm … sao cho hs đọc cái hiểu ngay"). Mô hình trả JSON theo `SCHEMA_TRA_LOI`; máy chủ LÀM SẠCH từng phần (cắt độ dài, bỏ HTML,
// giới hạn số cụm tô đậm / làm nổi), chặn lộ đáp án khi em đang làm, và dựng thêm bản CHỮ PHẲNG (`chuPhang`) để ghi sổ + gửi lại mô hình làm
// lịch sử + cho máy em bản cũ. Máy em vẽ: ý chính → các bước đánh số → bảng nhanh → ghi nhớ → nút hỏi tiếp.
// v2 (bản vẽ docs/ban-ve-hoi-thay-v2-1410, thầy 14/10: "Làm mọi thứ tốt nhất để hs hỏi cái là hiểu được bài ngay"): thêm KHỐI HÌNH tuỳ câu hỏi
// (sơ đồ chuyển hoá · thí nghiệm ảo · hiện tượng → nhóm chức · phương trình · tính nhanh · bẫy). Hiện tượng là danh sách ĐÓNG (`HIEN_TUONG`):
// máy em tự vẽ ống nghiệm theo mã, mô hình không gửi màu hay hình. Tối đa 3 khối hình (thứ tự cố định soDo → thiNghiem → nhanBiet →
// phuongTrinh → tinh). Em ĐANG LÀM: bỏ phương trình + tính nhanh, sơ đồ chỉ giữ ký hiệu đề (X, Y), nhãn ống ≤ 4 ký tự, không tô "đúng".

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
}

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
export function lamSachCauTruc(o: Obj, dangLam: boolean, chan?: (t: string) => string): CauTrucTraLoi | null {
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
  if (!yChinh && !buoc.length && !khoi.so) return null
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
  return kq
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
  c.buoc.forEach((b, i) => {
    d.push(`${i + 1}. ${b.ten ? `${b.ten}: ` : ''}${boDau(b.chu)}`)
    if (c.bang?.sauBuoc === i + 1) d.push(...bang)
  })
  if (c.bang && !c.bang.sauBuoc) d.push(...bang)
  if (c.bay) d.push(`${c.bay.tieuDe}: ${boDau(c.bay.chu)}`)
  if (c.ghiNho) d.push(`Ghi nhớ: ${boDau(c.ghiNho)}`)
  return d.filter(Boolean).join('\n').slice(0, 2400)
}
