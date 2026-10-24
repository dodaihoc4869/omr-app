// VẼ TIN VĂN PHÒNG (thầy 24/10): tin Zalo của văn phòng dùng đánh dấu `**đậm**`, `<do>` đỏ (đáp án), `<xanh>` xanh (công thức), `<cam>` cam (chỗ hay nhầm),
// `<vang>`, `<i>`, `<u>`, `<to>` (javisdodaihoc tro_giang/giai_bai.py KY_HIEU; chỉ số đã đổi sang ký tự Unicode ở văn phòng). Ở đây tách DÒNG thành khối
// để vẽ đẹp: dòng đầu đáp án ⇒ dải đáp án; `**1.**` ⇒ bước có số; dòng chỉ một `<xanh>` ⇒ khung phương trình; dòng chỉ một `<cam>` ⇒ ô «chỗ hay nhầm».
// THUẦN, không HTML thô: trả cây khúc chữ (không bao giờ dangerouslySetInnerHTML).

export type KieuChu = 'dam' | 'do' | 'xanh' | 'cam' | 'vang' | 'nghieng' | 'gach' | 'to'
export interface Khuc { chu: string; kieu: KieuChu[] }
export type Khoi =
  | { loai: 'dap'; khuc: Khuc[] }
  | { loai: 'buoc'; so: string; khuc: Khuc[] }
  | { loai: 'pt'; khuc: Khuc[] }
  | { loai: 'nham'; khuc: Khuc[] }
  | { loai: 'doan'; khuc: Khuc[] }

const THE: Record<string, KieuChu> = { do: 'do', xanh: 'xanh', cam: 'cam', vang: 'vang', i: 'nghieng', u: 'gach', to: 'to', nho: 'to' }

/** Một dòng ⇒ khúc chữ có kiểu (lồng được: **<do>..</do>**). Thẻ lạ giữ nguyên là chữ. */
export function tachKhuc(dong: string): Khuc[] {
  const ra: Khuc[] = []
  const ngan: KieuChu[] = []
  const re = /\*\*|<(\/?)(do|xanh|cam|vang|i|u|to|nho)>/g
  let i = 0
  let m: RegExpExecArray | null
  const day = (s: string) => { if (s) ra.push({ chu: s, kieu: [...ngan] }) }
  while ((m = re.exec(dong))) {
    day(dong.slice(i, m.index))
    i = m.index + m[0].length
    if (m[0] === '**') {
      const k = ngan.lastIndexOf('dam')
      if (k >= 0) ngan.splice(k, 1)
      else ngan.push('dam')
    } else {
      const kieu = THE[m[2]!]!
      if (m[1]) { const k = ngan.lastIndexOf(kieu); if (k >= 0) ngan.splice(k, 1) } else ngan.push(kieu)
    }
  }
  day(dong.slice(i))
  return ra.length ? ra : [{ chu: '', kieu: [] }]
}

const chiMot = (dong: string, the: string) => new RegExp(`^\\s*(\\*\\*)?<${the}>[\\s\\S]*</${the}>(\\*\\*)?\\s*$`).test(dong) && dong.split(`<${the}>`).length === 2

/** Tin ⇒ khối. Dòng trống tách đoạn. */
export function tachKhoi(tin: string): Khoi[] {
  const ra: Khoi[] = []
  const dong = String(tin || '').replace(/\r/g, '').split('\n')
  let dau = true
  for (const d0 of dong) {
    const d = d0.trimEnd()
    if (!d.trim()) continue
    if (dau && /^\s*\*\*\s*<do>.*đáp\s*án/i.test(d)) {
      ra.push({ loai: 'dap', khuc: tachKhuc(d.replace(/^\s*\*\*\s*<do>\s*(?:Đáp\s*án\s*:?\s*)?/i, '<do>').replace(/<\/do>\s*\*\*\s*$/, '</do>')) })
      dau = false
      continue
    }
    dau = false
    const b = /^\s*\*\*(\d{1,2})\.\*\*\s*/.exec(d)
    if (b) { ra.push({ loai: 'buoc', so: b[1]!, khuc: tachKhuc(d.slice(b[0].length)) }); continue }
    if (chiMot(d, 'xanh')) { ra.push({ loai: 'pt', khuc: tachKhuc(d.replace(/<\/?xanh>/g, '')) }); continue }
    if (chiMot(d, 'cam')) { ra.push({ loai: 'nham', khuc: tachKhuc(d.replace(/<\/?cam>/g, '')) }); continue }
    const truoc = ra[ra.length - 1]
    // Dòng tiếp theo của một bước (ý con «• », «→») gộp vào bước ấy.
    if (truoc && truoc.loai === 'buoc' && /^\s*(•|→|-|\+)/.test(d)) { truoc.khuc.push({ chu: '\n', kieu: [] }, ...tachKhuc(d.trim())); continue }
    ra.push({ loai: 'doan', khuc: tachKhuc(d) })
  }
  return ra
}

/** Nhãn nguồn dưới tin (máy chủ / văn phòng ghi). */
export function chuNguon(nguon: string, chiGoiY: boolean): string {
  if (chiGoiY) return 'Chỉ gợi ý: câu trong bài em chưa nộp'
  if (nguon === 'kho') return 'Lời giải từ kho đề của Thầy'
  if (nguon === 'hai-luot') return 'Thầy giải hai lượt độc lập, khớp nhau'
  if (nguon === 'phan-xu') return 'Thầy giải lại kĩ, đã kiểm'
  if (nguon === 'de') return 'Câu lấy nguyên văn từ kho đề của Thầy'
  return ''
}
