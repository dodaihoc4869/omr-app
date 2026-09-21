import type { Env } from './kieu'
import { laCauTuLuan, laMaDeTuLuan } from '../../src/lib/cau-tu-luan'
import { soKhopSo } from '../../src/lib/cham-so'

export function answerText(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'boolean') return v ? 'D' : 'S'
  if (Array.isArray(v)) return v.map(answerText).join('')
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>
    const keys = ['a', 'b', 'c', 'd']
    const hasLower = keys.some(k => k in o)
    const hasUpper = ['A', 'B', 'C', 'D'].some(k => k in o)
    if (hasLower || hasUpper) {
      return keys.map(k => {
        const val = o[k] ?? o[k.toUpperCase()]
        if (typeof val === 'object' && val !== null) {
          return (val as { dung?: boolean }).dung ? 'D' : 'S'
        }
        return answerText(val)
      }).join('')
    }
  }
  return String(v).trim().toUpperCase().replace(/Đ/g, 'D')
}

export function cleanShortAnswer(s: string): string {
  return String(s ?? '')
    .replace(/[‐‑‒–—―−－]/g, '-')
    .replace(/\s+/g, '')
    .replace(/,/g, '.')
}

export function isAnswerCorrect(v: string, d: string, phan: 'I' | 'II' | 'III' | string): boolean {
  if (!v || !d) return false
  const cleanV = String(v).trim().toUpperCase().replace(/Đ/g, 'D')
  const cleanD = String(d).trim().toUpperCase().replace(/Đ/g, 'D')

  if (phan === 'I') {
    return cleanV === cleanD
  }

  if (phan === 'II') {
    const norm = (str: string) => str.replace(/[^DS]/gi, '').toUpperCase()
    const nV = norm(cleanV), nD = norm(cleanD)
    if (nV.length === 4 && nD.length === 4) return nV === nD
    return cleanV === cleanD
  }

  if (phan === 'III') return soKhopSo(v, d, 'so_hoc') // MỘT bộ chuẩn hoá số dùng chung (src/lib/cham-so.ts); chính sách số học 1e-4 của bài về nhà / ôn lại giữ nguyên

  return cleanV === cleanD
}

export function gradeHomework(keys: Map<string, string>, raw: Record<string, unknown>, maDe: string) {
  if (!keys.size) throw new Error('Chưa tải được đáp án. Bài làm vẫn được giữ, em thử nộp lại.')
  const answers: Record<string, string> = {}, ambiguous: string[] = []
  const aliases = new Map<string, string[]>()
  const tailMap = new Map<string, string[]>()
  for (const qid of keys.keys()) {
    const tail = qid.match(/-(III|II|I)-\d+$/)?.[0]
    if (!tail) continue
    const alias = maDe + tail
    aliases.set(alias, [...(aliases.get(alias) || []), qid])
    tailMap.set(tail, [...(tailMap.get(tail) || []), qid])
  }
  for (const [qid, v] of Object.entries(raw)) {
    if (keys.has(qid)) { answers[qid] = answerText(v); continue }
    const matches = aliases.get(qid) || []
    if (matches.length === 1 && !Object.hasOwn(raw, matches[0])) {
      answers[matches[0]] = answerText(v)
    } else if (matches.length > 1 && answerText(v)) {
      ambiguous.push(qid)
    } else {
      // Thử tìm theo tail nếu qid mang dạng tail
      const tail = qid.match(/-(III|II|I)-\d+$/)?.[0]
      if (tail) {
        const tMatches = (tailMap.get(tail) || []).filter(q => !answers[q])
        if (tMatches.length === 1) answers[tMatches[0]] = answerText(v)
      }
    }
  }
  if (ambiguous.length) throw new Error('Bài cũ bị trùng mã câu giữa các tờ đề. Cần kiểm tra lại, chưa thể chấm chính xác.')
  if (Object.values(raw).some(v => answerText(v)) && !Object.keys(answers).length) throw new Error('Mã câu chưa khớp đề. Đáp án vẫn được giữ; em mở lại bài từ app rồi nộp lại.')

  const qidSai: string[] = []
  for (const [qid, key] of keys) {
    const v = answers[qid] || '', d = answerText(key)
    const phanMatch = qid.match(/-(III|II|I)-\d+$/)
    const phan = phanMatch ? phanMatch[1] : (qid.includes('-III-') ? 'III' : qid.includes('-II-') ? 'II' : 'I')
    if (!v || !isAnswerCorrect(v, d, phan)) qidSai.push(qid)
  }
  return { answers, soCau: keys.size, soDung: keys.size - qidSai.length, qidSai }
}
export async function homeworkQuestions(env: Env, maDe: string) {
  const out: Record<string, unknown>[] = []; const seen = new Set<string>(); const cache = new Map<string, Record<string, unknown>[]>()
  for (const ma of maDe.split(',').map(x => x.trim()).filter(Boolean)) {
    if (laMaDeTuLuan(ma)) continue // -VD / -DT (mục dạy học) và -TL (tự luận): một định nghĩa dùng chung (src/lib/cau-tu-luan.ts)
    const match = ma.match(/-(TN|DS|TLN)$/), goc = match ? ma.slice(0, -match[0].length) : ma
    const phan = match ? ({ TN: 'I', DS: 'II', TLN: 'III' } as Record<string, string>)[match[1]] : null
    if (!cache.has(goc)) {
      const o = await env.DE?.get(`kho/${goc}.json`); if (!o) throw new Error('Không tải đủ đề bài tập.')
      const g = await new Response(o.body).json() as Record<string, unknown>
      cache.set(goc, Array.isArray(g.cau) ? g.cau as Record<string, unknown>[] : ['phanI', 'phanII', 'phanIII'].flatMap((k, i) => Array.isArray(g[k]) ? (g[k] as Record<string, unknown>[]).map(c => ({ ...c, phan: c.phan || ['I', 'II', 'III'][i] })) : []))
    }
    for (const c of cache.get(goc) || []) {
      if (phan && c.phan !== phan) continue
      // CẤM RÚT TỰ LUẬN (21/09): luật cũ (phần III đáp án dài / nhiều dòng) nay là MỘT phần của định nghĩa dùng chung — thêm: phần III không đáp án hoặc hỏi mở,
      // phần I thiếu phương án, phần II thiếu ý. Trên 4 tờ kho thật (299 câu) hai luật bỏ đúng cùng những câu (test khoá).
      if (laCauTuLuan(c)) continue
      const qid = `${goc}-${c.phan}-${c.so}`; if (seen.has(qid)) continue; seen.add(qid); out.push({ ...c, qid })
    }
  }
  return out
}
export function homeworkKeys(cau: Record<string, unknown>[]) { return new Map(cau.flatMap(c => { const d = answerText(c.dap_an ?? c.dapAn); return d ? [[String(c.qid), d] as [string, string]] : [] })) }
