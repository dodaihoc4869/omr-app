/** Bảng riêng của câu song sinh: giữ nguyên ô, không mượn số liệu câu gốc. */
export function bangSongSinh(v: unknown): string[][] | undefined {
  if (!Array.isArray(v) || v.length < 2 || !Array.isArray(v[0]) || !v[0].length) return undefined
  const cot = v[0].length
  return v.every((r) => Array.isArray(r) && r.length === cot && r.every((c) => typeof c === 'string') && r.some((c) => c.trim())) ? v as string[][] : undefined
}

/** Dùng chung cho game và rút đề: đề dẫn tới bảng phải tự mang đủ bảng. */
export function duBangSongSinh(de: string, bang: unknown, gocCoBang = false): boolean {
  if (!de.trim()) return false
  const day = bangSongSinh(bang)
  if (bang !== undefined && !day) return false
  const hang = de.split('\n').filter((r) => (r.match(/\|/g) ?? []).length >= 2 && !/^[\s|:\-]+$/.test(r))
  const html = de.match(/<table\b[^>]*>[\s\S]*?<\/table>/i)?.[0] ?? ''
  const trongChu = (html.match(/<tr\b/gi) ?? []).length >= 2 || hang.length >= 2
  return !(gocCoBang || /\bbảng\b/i.test(de)) || !!day || trongChu
}
