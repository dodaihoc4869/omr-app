// Cổng kiểm cho scripts/nap-kho-ma-hoa-2410.mjs: đúng chuỗi kiểm của nút «Đẩy file JSON» (parse → build → validate) + kiemGoiDe của máy chủ.
import { parseKhoDeJsonText, buildTeacherSourceFromKhoDe } from '../src/lib/exam-kho-de-import'
import { kiemGoiDe } from '../src/lib/kiem-goi-de'
import { validateTeacherSource } from '../src/data/examContent'

export function kiem(raw: string) {
  const p = parseKhoDeJsonText(raw)
  if (!p.ok || !p.json) return { sach: false, tom: { parse: p.errors.slice(0, 3) } }
  const b = buildTeacherSourceFromKhoDe(p.json)
  const v = validateTeacherSource(b.source)
  const k = kiemGoiDe(String((p.json as { ma_de?: string }).ma_de ?? ''), JSON.parse(raw))
  const tom = { loiBuild: b.errors.length, loiValidate: v.length, loiKiemGoi: k.loi.length, canXem: b.canXemList.length }
  return { sach: b.errors.length === 0 && v.length === 0 && k.loi.length === 0, tom }
}
