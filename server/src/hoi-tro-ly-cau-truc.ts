// CÂU TRẢ LỜI CÓ CẤU TRÚC của Hỏi Thầy (bản vẽ docs/ban-ve-hoi-thay-1310, thầy chốt 13/10: "Phần hướng dẫn lời giải phải hiển thị khoa học
// hơn, ngắt câu tô đậm … sao cho hs đọc cái hiểu ngay"). Mô hình trả JSON theo `SCHEMA_TRA_LOI`; máy chủ LÀM SẠCH từng phần (cắt độ dài, bỏ HTML,
// giới hạn số cụm tô đậm / làm nổi), chặn lộ đáp án khi em đang làm, và dựng thêm bản CHỮ PHẲNG (`chuPhang`) để ghi sổ + gửi lại mô hình làm
// lịch sử + cho máy em bản cũ. Máy em vẽ: ý chính → các bước đánh số → bảng nhanh → ghi nhớ → nút hỏi tiếp.

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
}

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
  },
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
/** Một ô chữ: bỏ HTML, markdown khác, emoji, gạch ngang dài; gọn khoảng trắng; cắt `toiDa`; GIỮ **…** và ==…== (máy em vẽ). */
function sachO(v: unknown, toiDa: number): string {
  let s = str(v).replace(/<[^>]*>/g, '').replace(EMOJI, '').replace(/__(.+?)__/g, '$1').replace(/^#{1,6}\s*|#{2,}\s*/gm, '').replace(/\s*—\s*/g, ', ').replace(/\s+/g, ' ').trim()
  if (s.length > toiDa) s = s.slice(0, toiDa).replace(/\s+\S*$/, '').trim() + '…'
  // Cắt giữa chừng hay mô hình lỡ tay ⇒ dấu lẻ không thành cặp thì bỏ.
  for (const dau of ['**', '==']) if (s.split(dau).length % 2 === 0) { const i = s.lastIndexOf(dau); s = s.slice(0, i) + s.slice(i + dau.length) }
  return s
}
const boDau = (s: string): string => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/==(.+?)==/g, '$1').replace(/\*\*|==/g, '')

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
  if (!yChinh && !buoc.length) return null
  // Tô đậm tối đa 4 cụm cả câu trả lời (đặc tả mục 4); làm nổi tối đa 1 cụm và CHỈ ở ý chính; em đang làm ⇒ không làm nổi gì.
  let soDam = 0
  const dam = (s: string) => s.replace(/\*\*(.+?)\*\*/g, (_m, x: string) => (++soDam <= 4 ? `**${x}**` : x))
  const khongNoi = (s: string) => s.replace(/==(.+?)==/g, '$1')
  let soNoi = 0
  const yc = dam(dangLam ? khongNoi(yChinh) : yChinh.replace(/==(.+?)==/g, (_m, x: string) => (++soNoi <= 1 ? `==${x}==` : x)))
  return {
    yChinh: yc,
    buoc: buoc.map((x) => ({ ten: x.ten, chu: dam(khongNoi(x.chu)) })),
    bang: bang ? { ...bang, dong: bang.dong.map((r) => r.map((c) => boDau(c))) } : null,
    ghiNho: dam(khongNoi(ghiNho)),
    hoiTiep,
  }
}

/** Bản chữ phẳng (không dấu tô): ghi sổ `hoi_tro_ly.tra_loi`, gửi lại mô hình làm lịch sử, trả `traLoi` cho máy em bản cũ. */
export function chuPhang(c: CauTrucTraLoi): string {
  const bang = c.bang ? [c.bang.cot.join(' | '), ...c.bang.dong.map((r) => r.join(' | '))] : []
  const d: string[] = [boDau(c.yChinh)]
  c.buoc.forEach((b, i) => {
    d.push(`${i + 1}. ${b.ten ? `${b.ten}: ` : ''}${boDau(b.chu)}`)
    if (c.bang?.sauBuoc === i + 1) d.push(...bang)
  })
  if (c.bang && !c.bang.sauBuoc) d.push(...bang)
  if (c.ghiNho) d.push(`Ghi nhớ: ${boDau(c.ghiNho)}`)
  return d.filter(Boolean).join('\n').slice(0, 2000)
}
