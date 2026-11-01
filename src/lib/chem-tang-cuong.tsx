// TĂNG CƯỜNG CHỮ ĐỀ (thầy 01/11) — mảnh NẠP LƯỜI đi cùng KaTeX (katex-goi.ts), không cộng byte lượt mở app:
//   · «Chữ Không in đậm bỏ dấu sao hai đầu»: **chữ** ⇒ <b>chữ</b>;
//   · «Chỉnh hiển thị đầu dòng dãn cách phải đẹp chỉnh chu để hs dễ đọc nhất»: đề có từ 2 dòng đánh số (1) (2)… / 1. / a) ⇒ mỗi dòng một hàng hai cột
//     (số | nội dung, xuống dòng thụt thẳng hàng); đoạn chữ trước / sau danh sách tách khoảng thoáng.
import type { ComponentType, ReactNode } from 'react'

/** Dòng đánh số đầu dòng: (1) · 1) · 1. · a) · a. (chữ thường a–h, sau đó PHẢI có khoảng trắng). */
const RE_DAU_DONG = /^\s*(\(\d{1,2}\)|\d{1,2}[.)]|[a-h][.)])\s+(.*)$/
/** Tách đề thành đoạn chữ + dòng đánh số; < 2 dòng đánh số ⇒ null (giữ nguyên cách vẽ cũ). Thuần (có test). */
export function tachDanhSach(text: string): { so: string | null; v: string }[] | null {
  if (!text.includes('\n')) return null
  const ra: { so: string | null; v: string }[] = []
  let soMuc = 0
  for (const dong of text.split('\n')) {
    const m = RE_DAU_DONG.exec(dong)
    if (m) { ra.push({ so: m[1]!, v: m[2]! }); soMuc++; continue }
    if (!dong.trim()) continue
    const cuoi = ra[ra.length - 1]
    if (cuoi && cuoi.so === null) cuoi.v += '\n' + dong
    else ra.push({ so: null, v: dong })
  }
  return soMuc >= 2 ? ra : null
}

/** Đề có danh sách ⇒ các hàng đã dựng; không ⇒ null (người gọi vẽ như cũ). */
export function veDanhSach(text: string, Khuc: ComponentType<{ text: string }>): ReactNode | null {
  const ds = tachDanhSach(text)
  if (!ds) return null
  return ds.map((k, i) => k.so === null
    ? <span key={i} className="de-doan" style={{ display: 'block', marginTop: i ? '0.55em' : 0 }}><Khuc text={k.v} /></span>
    : (
      <span key={i} className="de-muc" style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', columnGap: '0.5em', alignItems: 'baseline', marginTop: i && ds[i - 1]!.so === null ? '0.45em' : '0.3em' }}>
        <span className="de-muc-so" style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{k.so}</span>
        <span className="de-muc-nd" style={{ minWidth: 0 }}><Khuc text={k.v} /></span>
      </span>
    ))
}

/** **chữ** ⇒ <b>chữ</b> (không còn dấu sao); không có cặp ** ⇒ null. */
export function veInDam(text: string, Dong: ComponentType<{ text: string }>, key: number): ReactNode | null {
  const manh = text.split(/\*\*([^*\n]+?)\*\*/)
  if (manh.length < 2) return null
  return <span key={key}>{manh.map((m, i) => (m ? (i % 2 ? <b key={i}><Dong text={m} /></b> : <Dong key={i} text={m} />) : null))}</span>
}

/** Cả đề: danh sách đầu dòng (nếu có) + in đậm trong từng khúc; không có gì cần tăng cường ⇒ null (người gọi vẽ như cũ). */
export function veDe(text: string, Khuc: ComponentType<{ text: string }>): ReactNode | null {
  const KhucDam = ({ text: t }: { text: string }) => <>{veInDam(t, Khuc, 0) ?? <Khuc text={t} />}</>
  return veDanhSach(text, KhucDam) ?? veInDam(text, Khuc, 0)
}
